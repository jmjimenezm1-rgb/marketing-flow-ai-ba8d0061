import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  campanas as seedCampanas,
  clientes as seedClientes,
  mensajes as seedMensajes,
  productos as seedProductos,
  type Campana,
  type Cliente,
  type MensajeGenerado,
  type Producto,
} from "./mock-data";
import { supabaseExterno } from "./supabase-external";

type Fuente = "cargando" | "supabase" | "local";

type Store = {
  clientes: Cliente[];
  productos: Producto[];
  campanas: Campana[];
  mensajes: MensajeGenerado[];
  fuente: Fuente;
  usuarioActual: { nombre: string; rol: string };
  addCampana: (c: Campana) => void;
  updateCampana: (id: string, patch: Partial<Campana>) => void;
  addMensajes: (m: MensajeGenerado[]) => void;
  updateMensaje: (id: string, patch: Partial<MensajeGenerado>, accion?: string, texto?: string) => void;
};

const StoreContext = createContext<Store | null>(null);

async function cargar<T>(tabla: string): Promise<T[] | null> {
  const { data, error } = await supabaseExterno.from(tabla).select("datos");
  if (error || !data || data.length === 0) return null;
  return data.map((r: { datos: T }) => r.datos);
}

const filaCampana = (c: Campana) => ({ id: c.id, estado: c.estado, producto_id: c.productoId, datos: c });
const filaMensaje = (m: MensajeGenerado) => ({
  id: m.id,
  campana_id: m.campanaId,
  cliente_id: (m as { clienteId?: string }).clienteId ?? "",
  estado: m.estado,
  riesgo_legal: m.riesgoLegal,
  datos: m,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(() => seedClientes);
  const [productos, setProductos] = useState<Producto[]>(() => seedProductos);
  const [campanas, setCampanas] = useState<Campana[]>(() => seedCampanas);
  const [mensajes, setMensajes] = useState<MensajeGenerado[]>(() => seedMensajes);
  const [fuente, setFuente] = useState<Fuente>("cargando");
  const remoto = useRef(false);
  const usuarioActual = { nombre: "Ana Coloma", rol: "Responsable comercial" };

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [cl, pr, ca, me] = await Promise.all([
          cargar<Cliente>("clientes"),
          cargar<Producto>("productos"),
          cargar<Campana>("campanas"),
          cargar<MensajeGenerado>("mensajes"),
        ]);
        if (!vivo) return;
        if (cl && pr && ca) {
          setClientes(cl);
          setProductos(pr);
          setCampanas(ca);
          setMensajes(me ?? []);
          remoto.current = true;
          setFuente("supabase");
        } else setFuente("local");
      } catch {
        if (vivo) setFuente("local");
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const guardar = (tabla: string, filas: object[], accion: string) => {
    if (!remoto.current || filas.length === 0) return;
    void supabaseExterno.from(tabla).upsert(filas).then(({ error }) => {
      if (error) console.error(`Error guardando ${tabla}:`, error.message);
    });
    void supabaseExterno.from("auditoria_legal").insert(
      filas.map((f) => ({
        entidad: tabla,
        entidad_id: (f as { id: string }).id,
        accion,
        usuario: usuarioActual.nombre,
      })),
    );
  };

  const value = useMemo<Store>(
    () => ({
      clientes,
      productos,
      campanas,
      mensajes,
      fuente,
      usuarioActual,
      addCampana: (c) => {
        setCampanas((prev) => [c, ...prev]);
        guardar("campanas", [filaCampana(c)], "crear");
      },
      updateCampana: (id, patch) =>
        setCampanas((prev) =>
          prev.map((c) => {
            if (c.id !== id) return c;
            const n = { ...c, ...patch };
            guardar("campanas", [filaCampana(n)], "actualizar");
            return n;
          }),
        ),
      addMensajes: (m) => {
        setMensajes((prev) => [...m, ...prev]);
        guardar("mensajes", m.map(filaMensaje), "generar");
      },
      updateMensaje: (id, patch, accion, texto) =>
        setMensajes((prev) =>
          prev.map((m) => {
            if (m.id !== id) return m;
            const n: MensajeGenerado = {
              ...m,
              ...patch,
              version: patch.cuerpo && patch.cuerpo !== m.cuerpo ? m.version + 1 : m.version,
              historial: accion
                ? [
                    ...m.historial,
                    {
                      fecha: new Date().toISOString(),
                      usuario: usuarioActual.nombre,
                      accion,
                      ...(texto ? { texto } : {}),
                    },
                  ]
                : m.historial,
            };
            guardar("mensajes", [filaMensaje(n)], accion ?? "actualizar");
            return n;
          }),
        ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clientes, productos, campanas, mensajes, fuente],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
