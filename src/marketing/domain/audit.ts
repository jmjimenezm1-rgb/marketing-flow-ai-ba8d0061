// Contrato común de auditoría (AuditService) y combinación temporal de orígenes.
// Une en una sola línea de tiempo: auditoría estructurada de Catalyst,
// historiales de envíos y borradores de Catalyst, e historiales de mensajes
// y campañas de Flow. Sin tablas nuevas en esta fase.

import type { EventoAuditoria } from "@/marketing/catalyst/store";
import type { Borrador, Envio } from "@/marketing/catalyst/mock/data";
import type { MensajeGenerado } from "@/lib/mock-data";
import { nombreCliente } from "@/marketing/catalyst/mock/data";
import type { AuditEventComun } from "./types";

export interface AuditService {
  recordAuditEvent(event: Omit<AuditEventComun, "id" | "fecha">): void;
  listAuditEvents(): readonly AuditEventComun[];
}

/** Combina temporalmente ambos orígenes en una línea de tiempo común ordenada. */
export function combinarAuditoria(input: {
  auditoriaCatalyst: readonly EventoAuditoria[];
  envios: readonly Envio[];
  borradores: readonly Borrador[];
  mensajesFlow: readonly MensajeGenerado[];
}): AuditEventComun[] {
  const deCatalyst: AuditEventComun[] = input.auditoriaCatalyst.map((a) => ({
    id: `cat-${a.id}`,
    fecha: a.fecha,
    usuario: a.usuario,
    modulo: a.modulo,
    accion: a.accion,
    detalle: a.detalle,
    procedencia: "catalyst",
    clienteId: a.clienteId,
    anterior: a.anterior,
    nuevo: a.nuevo,
    resultado: a.resultado,
  }));

  const deEnvios: AuditEventComun[] = input.envios.flatMap((e) =>
    e.historial.map((h, i) => ({
      id: `env-${e.id}-${i}`,
      fecha: h.fecha,
      usuario: h.usuario,
      modulo: "Envíos",
      accion: h.evento,
      detalle: `${e.id} · ${e.canal} · ${nombreCliente(e.clienteId)}`,
      procedencia: "catalyst" as const,
      clienteId: e.clienteId,
      campanaId: e.campanaId,
      resultado: /bloqueado|cancelado|fallido/i.test(h.evento) ? ("bloqueado" as const) : ("realizado" as const),
    })),
  );

  const deBorradores: AuditEventComun[] = input.borradores.map((b) => ({
    id: `bor-${b.id}`,
    fecha: b.creado,
    usuario: b.responsable,
    modulo: "Bandeja de salida",
    accion: `Borrador ${b.estado.replace(/_/g, " ")}`,
    detalle: `${b.canal} · riesgo ${b.riesgoLegal}${b.revisionLegal ? " · revisión legal" : ""} · ${nombreCliente(b.clienteId)}`,
    procedencia: "catalyst",
    clienteId: b.clienteId,
    campanaId: b.campanaId,
    resultado: "realizado",
  }));

  const deMensajesFlow: AuditEventComun[] = input.mensajesFlow.flatMap((m) =>
    m.historial.map((h, i) => ({
      id: `msg-${m.id}-${i}`,
      fecha: h.fecha,
      usuario: h.usuario,
      modulo: "Revisión de mensajes",
      accion: h.accion,
      detalle: `${m.id} · ${m.canal} · riesgo ${m.riesgoLegal}${h.texto ? ` · ${h.texto}` : ""}`,
      procedencia: "flow" as const,
      clienteId: m.clienteId,
      campanaId: m.campanaId,
      resultado: /bloque|rechaz|exclu/i.test(h.accion) ? ("bloqueado" as const) : ("realizado" as const),
    })),
  );

  return [...deCatalyst, ...deEnvios, ...deBorradores, ...deMensajesFlow].sort((a, b) => b.fecha.localeCompare(a.fecha));
}
