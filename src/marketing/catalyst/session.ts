import { borradoresSeed, campanas, clientes, entradasSeed, enviosSeed, mensajes, productos, secuenciasSeed, type Borrador, type Canal, type Campana, type Cliente, type Envio, type Mensaje, type MensajeEntrada, type PasoSecuencia, type Producto, type Secuencia } from "./mock/data";
import { validarEnvio } from "./services/compliance";

export interface SessionData {
  clientes: Cliente[]; productos: Producto[]; campanas: Campana[]; mensajes: Mensaje[];
  envios: Envio[]; secuencias: Secuencia[]; entradas: MensajeEntrada[]; borradores: Borrador[];
}
export function createSession(): SessionData {
  return structuredClone({ clientes, productos, campanas, mensajes, envios: enviosSeed, secuencias: secuenciasSeed, entradas: entradasSeed, borradores: borradoresSeed });
}
export function campaignBlockReasons(data: SessionData, id: string): string[] {
  const messages = data.mensajes.filter(m => m.campanaId === id);
  return [
    ...(messages.some(m => !m.aprobado) ? ["Mensajes sin revisión humana"] : []),
    ...(messages.some(m => m.riesgoLegal === "alto") ? ["Mensajes con riesgo legal alto"] : []),
  ];
}
export function draftBlockReasons(data: SessionData, draft: Borrador, state: Borrador["estado"]): string[] {
  if (!["aprobada", "programada", "enviada"].includes(state)) return [];
  const client = data.clientes.find(c => c.id === draft.clienteId);
  const campaign = data.campanas.find(c => c.id === draft.campanaId);
  const reasons: string[] = [];
  if (draft.riesgoLegal === "alto" || draft.revisionLegal) reasons.push("Respuesta con riesgo legal alto o revisión legal pendiente");
  if (client?.consentimiento[draft.canal] !== "valido") reasons.push("Consentimiento no válido, baja o revocación en el canal");
  if (!client?.baseJuridica.trim() || /pendiente|baja|revocad/i.test(client.baseJuridica)) reasons.push("Base jurídica no válida");
  if (!campaign || !["aprobada", "programada", "activa"].includes(campaign.estado)) reasons.push("Campaña no aprobada");
  if (["enviada", "programada"].includes(state) && draft.estado !== "aprobada") reasons.push("Respuesta pendiente de aprobación humana");
  if (state === "enviada" && !/baja|no deseas recibir|no desea recibir|no recibir más/i.test(draft.texto)) reasons.push("Falta mecanismo de baja");
  return reasons;
}
export function cancelContactSends(data: SessionData, id: string, channels: Canal[], usuario: string, evento: string): SessionData {
  return { ...data,
    envios: data.envios.map(e => e.clienteId === id && channels.includes(e.canal) && ["pendiente", "programado"].includes(e.estado)
      ? { ...e, estado: "cancelado", historial: [...e.historial, { fecha: new Date().toISOString(), usuario, evento }] } : e),
    borradores: data.borradores.map(b => b.clienteId === id && channels.includes(b.canal) && !["enviada", "cancelada"].includes(b.estado) ? { ...b, estado: "cancelada" } : b),
  };
}
export function sendBlockReasons(data: SessionData, send: Envio): string[] {
  const count = data.envios.filter(e => e.fechaEnvio?.slice(0, 10) === new Date().toISOString().slice(0, 10) && ["enviado", "entregado", "leido", "respondido"].includes(e.estado)).length;
  return validarEnvio(send, count, data).chequeos.filter(c => c.bloqueante && !c.ok).map(c => `${c.etiqueta}: ${c.detalle}`);
}
export type { Borrador, Canal, Campana, Cliente, Envio, MensajeEntrada, PasoSecuencia, Secuencia };