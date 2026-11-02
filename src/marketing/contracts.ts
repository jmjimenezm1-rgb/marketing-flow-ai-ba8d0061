import type { Cliente as FlowClient, Campana as FlowCampaign, Producto as FlowProduct, MensajeGenerado as FlowMessage } from "@/lib/mock-data";
import type { Cliente as CatalystClient, Campana as CatalystCampaign, Producto as CatalystProduct, Mensaje as CatalystMessage, Secuencia, Envio, MensajeEntrada, Borrador } from "./catalyst/mock/data";
import type { AuditInput } from "./audit";

export type SourceIdentity = { source: "flow" | "catalyst"; originalId: string };
export interface MarketingClient extends SourceIdentity {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  sector: string;
  owner: string;
  original: FlowClient | CatalystClient;
}
export type MarketingProduct = FlowProduct | CatalystProduct;
export type MarketingCampaign = FlowCampaign | CatalystCampaign;
export type MarketingMessage = FlowMessage | CatalystMessage;
export type MarketingSequence = Secuencia;
export type MarketingSend = Envio;
export type InboundMessage = MensajeEntrada;
export type OutboundDraft = Borrador;
export interface ConsentRecord {
  contact: SourceIdentity;
  channel: "email" | "whatsapp";
  state: "valido" | "ausente" | "revocado" | "baja" | "pendiente" | "interes_legitimo";
  legalBasis: string;
  source: string;
  obtainedAt?: string | null;
  purpose?: string;
  evidence?: string;
  validation?: "pendiente" | "validada" | "rechazada";
  opposition?: boolean;
}
export interface TemporaryRepository<T> { list(): readonly T[]; update(id: string, patch: Partial<T>): void }
export interface AiMessageService<Input, Output> { generate(input: Input): Output }
export interface AiReplyService { generate(input: InboundMessage): string }
export interface ComplianceService<T> { validate(input: T): { permitido: boolean; motivos: string[] } }
export interface EmailProvider { simulate(send: MarketingSend): MarketingSend }
export interface WhatsAppProvider extends EmailProvider {}
export interface LeadSourceProvider { list(): readonly MarketingClient[] }
export interface AuditService { recordAuditEvent(event: AuditInput): void }