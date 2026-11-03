import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createSession, type SessionData } from "./session";
import type { Borrador, Canal, Campana, Cliente, Envio, Mensaje, MensajeEntrada, PasoSecuencia, Producto, Secuencia } from "./mock/data";

// Estado temporal de sesión de Marketing Catalyst. Nunca muta los datos semilla.
const USUARIO_ACTUAL = "l.vega@demo";

export interface EventoAuditoria {
  id: string;
  fecha: string;
  usuario: string;
  modulo: string;
  accion: string;
  detalle: string;
  clienteId?: string | undefined;
  anterior?: string | undefined;
  nuevo?: string | undefined;
  resultado?: "realizado" | "bloqueado";
}

interface Store {
  envios: Envio[];
  secuencias: Secuencia[];
  entradas: MensajeEntrada[];
  borradores: Borrador[];
  clientes: Cliente[];
  campanas: Campana[];
  mensajes: Mensaje[];
  productos: Producto[];
  snapshot: SessionData;
  usuario: string;
  auditoria: EventoAuditoria[];
  registrarAuditoria: (e: Omit<EventoAuditoria, "id" | "fecha" | "usuario">) => void;
  registrarEvento: (envioId: string, evento: string) => void;
  actualizarEnvio: (id: string, cambios: Partial<Envio>, evento: string) => void;
  actualizarPaso: (secuenciaId: string, pasoId: string, cambios: Partial<PasoSecuencia>) => void;
  cambiarEstadoSecuencia: (id: string, estado: Secuencia["estado"]) => void;
  actualizarEntrada: (id: string, cambios: Partial<MensajeEntrada>) => void;
  añadirNota: (entradaId: string, texto: string) => void;
  actualizarBorrador: (id: string, cambios: Partial<Borrador>) => void;
  crearBorradorIA: (entrada: MensajeEntrada, texto: string) => void;
  cambiarEstadoCampana: (id: string, estado: Campana["estado"]) => void;
  registrarBaja: (clienteId: string, canales: Canal[], motivo: string, origen: string) => void;
  registrarConsentimiento: (clienteId: string, canal: Canal, fuente: string) => void;
}

const Ctx = createContext<Store | null>(null);
const ahora = () => new Date().toISOString();

export function CatalystStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SessionData>(() => createSession());
  const [auditoria, setAuditoria] = useState<EventoAuditoria[]>([]);
  const log = (e: Omit<EventoAuditoria, "id" | "fecha" | "usuario">) =>
    setAuditoria((prev) => [{ resultado: "realizado", ...e, id: crypto.randomUUID(), fecha: ahora(), usuario: USUARIO_ACTUAL }, ...prev]);
  const patch = <K extends keyof SessionData>(key: K, fn: (v: SessionData[K]) => SessionData[K]) =>
    setData((d) => ({ ...d, [key]: fn(d[key]) }));

  const value = useMemo<Store>(() => ({
    ...data,
    snapshot: data,
    usuario: USUARIO_ACTUAL,
    auditoria,
    registrarAuditoria: log,
    cambiarEstadoCampana: (id, estado) => {
      const c = data.campanas.find((x) => x.id === id);
      patch("campanas", (l) => l.map((x) => (x.id === id ? { ...x, estado } : x)));
      log({ modulo: "Campañas", accion: "Cambio de estado de campaña", detalle: `${c?.nombre ?? id} → ${estado.replace("_", " ")}`, anterior: c?.estado, nuevo: estado });
    },
    registrarBaja: (clienteId, canales, motivo, origen) => {
      const c = data.clientes.find((x) => x.id === clienteId);
      setData((d) => ({
        ...d,
        clientes: d.clientes.map((x) => x.id === clienteId ? { ...x, consentimiento: { ...x.consentimiento, ...Object.fromEntries(canales.map((k) => [k, "baja"])) } as Cliente["consentimiento"] } : x),
        envios: d.envios.map((e) => e.clienteId === clienteId && canales.includes(e.canal) && ["pendiente", "programado"].includes(e.estado)
          ? { ...e, estado: "cancelado", historial: [...e.historial, { fecha: ahora(), evento: "Cancelado por baja/oposición", usuario: USUARIO_ACTUAL }] } : e),
        borradores: d.borradores.map((b) => b.clienteId === clienteId && canales.includes(b.canal) && !["enviada", "cancelada"].includes(b.estado) ? { ...b, estado: "cancelada" } : b),
      }));
      log({ modulo: "Consentimientos", accion: "Baja / oposición registrada", detalle: `${canales.join(", ")} · ${origen} · ${motivo}`, clienteId, anterior: canales.map((k) => `${k}: ${c?.consentimiento[k]}`).join(", "), nuevo: "baja" });
    },
    registrarConsentimiento: (clienteId, canal, fuente) => {
      const c = data.clientes.find((x) => x.id === clienteId);
      patch("clientes", (l) => l.map((x) => x.id === clienteId ? { ...x, fuenteConsentimiento: fuente, consentimiento: { ...x.consentimiento, [canal]: "valido" } } : x));
      log({ modulo: "Consentimientos", accion: "Opt-in registrado", detalle: `${canal} · fuente: ${fuente}`, clienteId, anterior: c?.consentimiento[canal], nuevo: "valido" });
    },
    registrarEvento: (envioId, evento) =>
      patch("envios", (l) => l.map((e) => (e.id === envioId ? { ...e, historial: [...e.historial, { fecha: ahora(), evento, usuario: USUARIO_ACTUAL }] } : e))),
    actualizarEnvio: (id, cambios, evento) => {
      const prev = data.envios.find((e) => e.id === id);
      patch("envios", (l) => l.map((e) => (e.id === id ? { ...e, ...cambios, historial: [...e.historial, { fecha: ahora(), evento, usuario: USUARIO_ACTUAL }] } : e)));
      log({ modulo: "Envíos", accion: evento, detalle: id, clienteId: prev?.clienteId, anterior: prev?.estado, nuevo: cambios.estado ?? prev?.estado });
    },
    actualizarPaso: (sid, pid, cambios) =>
      patch("secuencias", (l) => l.map((s) => (s.id === sid ? { ...s, pasos: s.pasos.map((p) => (p.id === pid ? { ...p, ...cambios } : p)) } : s))),
    cambiarEstadoSecuencia: (id, estado) => {
      const s = data.secuencias.find((x) => x.id === id);
      patch("secuencias", (l) => l.map((x) => (x.id === id ? { ...x, estado } : x)));
      log({ modulo: "Secuencias", accion: "Cambio de estado de secuencia", detalle: s?.nombre ?? id, anterior: s?.estado, nuevo: estado });
    },
    actualizarEntrada: (id, cambios) => patch("entradas", (l) => l.map((e) => (e.id === id ? { ...e, ...cambios } : e))),
    añadirNota: (id, texto) =>
      patch("entradas", (l) => l.map((e) => (e.id === id ? { ...e, notas: [...e.notas, { fecha: ahora(), usuario: USUARIO_ACTUAL, texto }] } : e))),
    actualizarBorrador: (id, cambios) => {
      const b = data.borradores.find((x) => x.id === id);
      patch("borradores", (l) => l.map((x) => (x.id === id ? { ...x, ...cambios } : x)));
      if (cambios.estado && b && cambios.estado !== b.estado)
        log({ modulo: "Bandeja de salida", accion: "Revisión de respuesta", detalle: id, clienteId: b.clienteId, anterior: b.estado, nuevo: cambios.estado });
    },
    crearBorradorIA: (entrada, texto) => {
      const sensible = entrada.intencion === "solicita_baja" || entrada.intencion === "queja";
      patch("borradores", (l) => [{
        id: `b${crypto.randomUUID().slice(0, 6)}`,
        clienteId: entrada.clienteId, campanaId: entrada.campanaId, productoId: entrada.productoId, canal: entrada.canal,
        entradaId: entrada.id, texto, estado: entrada.intencion === "solicita_baja" ? "pendiente_revision" : "borrador",
        responsable: entrada.responsable, creado: ahora(), riesgoLegal: sensible ? "alto" : "bajo", revisionLegal: sensible,
      }, ...l]);
    },
  }), [data, auditoria]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore debe usarse dentro de CatalystStoreProvider");
  return ctx;
}
