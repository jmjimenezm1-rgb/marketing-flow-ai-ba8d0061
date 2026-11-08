// Capa de dominio común temporal para la integración Flow ↔ Catalyst.
// Sin tablas ni migraciones: representación en memoria durante la sesión.
// Sustituible por la base de datos común en una fase posterior.

import type { Cliente as FlowCliente, Producto as FlowProducto, Campana as FlowCampana } from "@/lib/mock-data";
import type { Cliente as CatalystCliente, Producto as CatalystProducto, Campana as CatalystCampana } from "@/marketing/catalyst/mock/data";

export type Canal = "email" | "whatsapp";

/** Estados de consentimiento unificados. Nunca booleanos. */
export type EstadoConsentimientoComun =
  | "valido"
  | "ausente"
  | "revocado"
  | "baja"
  | "pendiente"
  | "interes_legitimo";

export type Procedencia = "flow" | "catalyst" | "consolidado";

/** Cliente de dominio temporal común a ambos módulos. */
export interface MarketingClient {
  id: string;
  procedencia: Procedencia;
  razonSocial: string;
  contacto: string;
  cargo: string;
  email?: string;
  whatsapp?: string;
  sector: string;
  responsable: string;
  estadoComercial?: string;
  segmento?: string;
  consentimiento: Record<Canal, EstadoConsentimientoComun>;
  baseJuridica: string;
  fuenteDato: string;
  fechaConsentimiento?: string | null;
  baja: { activa: boolean; canales: Canal[] };
  historial: { fecha: string; usuario: string; accion: string }[];
  original: FlowCliente | CatalystCliente;
}

/** Producto de dominio: conserva beneficios, objeciones, público y estado. */
export interface DomainProduct {
  id: string;
  procedencia: Procedencia;
  nombre: string;
  descripcionCorta?: string;
  publicoObjetivo?: string;
  beneficios: string[];
  objeciones: string[];
  estado?: string;
  original: FlowProducto | CatalystProducto;
}

export type EstadoCampanaComun =
  | "borrador"
  | "pendiente_revision"
  | "aprobada"
  | "programada"
  | "activa"
  | "pausada"
  | "finalizada"
  | "cancelada";

/** Campaña de dominio: una sola entidad con identificadores de ambos módulos. */
export interface DomainCampaign {
  /** Identificador común de la relación (no hardcodeado: se genera al vincular). */
  relationId: string;
  flowId?: string;
  catalystId?: string;
  nombre: string;
  productoId: string;
  objetivo?: string;
  estado: EstadoCampanaComun;
  canal: Canal | "mixto";
  responsable?: string;
  /** true si la campaña Catalyst fue derivada temporalmente desde Flow. */
  catalystDerivada: boolean;
}

export type EstadoRelacionCampana = "vinculada" | "sin_relacion" | "no_existe";

export interface ResolucionCampana {
  estado: EstadoRelacionCampana;
  campana?: DomainCampaign;
  motivo?: string;
}

/** Evento de auditoría unificado (contrato AuditService). */
export interface AuditEventComun {
  id: string;
  fecha: string;
  usuario: string;
  modulo: string;
  accion: string;
  detalle: string;
  procedencia: Procedencia;
  clienteId?: string;
  campanaId?: string;
  anterior?: unknown;
  nuevo?: unknown;
  resultado?: "realizado" | "bloqueado";
  motivo?: string;
}
