// Registro común de campañas Flow ↔ Catalyst.
// Sustituye la dependencia directa del mapa fijo FLOW_TO_CATALYST:
// ese mapa solo se usa aquí como semilla de compatibilidad de datos iniciales.
// Las relaciones nuevas se crean en memoria con identificadores generados,
// sin depender de IDs hardcodeados. Sin tablas ni migraciones en esta fase.

import type { Campana as FlowCampana } from "@/lib/mock-data";
import type { Campana as CatalystCampana } from "@/marketing/catalyst/mock/data";
import { FLOW_TO_CATALYST } from "@/marketing/campaign-link";
import type { DomainCampaign, EstadoCampanaComun, ResolucionCampana } from "./types";

export interface CampaignLink {
  relationId: string;
  flowId: string;
  catalystId: string;
  /** true si la campaña Catalyst se derivó temporalmente desde Flow. */
  derivada: boolean;
}

const estadoFlowACatalyst = (e: EstadoCampanaComun): CatalystCampana["estado"] =>
  e === "pausada" || e === "cancelada" ? "borrador" : e;

export class CampaignRegistry {
  private links: CampaignLink[];
  private derivadas: CatalystCampana[];

  constructor(seed: Record<string, string> = FLOW_TO_CATALYST) {
    this.links = Object.entries(seed).map(([flowId, catalystId]) => ({
      relationId: `rel-${flowId}-${catalystId}`,
      flowId,
      catalystId,
      derivada: false,
    }));
    this.derivadas = [];
  }

  /** Campañas Catalyst creadas temporalmente a partir de campañas Flow nuevas. */
  get campanasDerivadas(): readonly CatalystCampana[] {
    return this.derivadas;
  }

  get relaciones(): readonly CampaignLink[] {
    return this.links;
  }

  private buildDomain(
    link: CampaignLink,
    flow: readonly FlowCampana[],
    catalyst: readonly CatalystCampana[],
  ): DomainCampaign | undefined {
    const f = flow.find((c) => c.id === link.flowId);
    const cat =
      catalyst.find((c) => c.id === link.catalystId) ??
      this.derivadas.find((c) => c.id === link.catalystId);
    if (!f && !cat) return undefined;
    return {
      relationId: link.relationId,
      flowId: f?.id,
      catalystId: cat?.id,
      nombre: f?.nombre ?? cat?.nombre ?? link.flowId,
      productoId: f?.productoId ?? cat?.productoId ?? "",
      objetivo: f?.objetivo,
      estado: f?.estado ?? cat?.estado ?? "borrador",
      canal: f?.canalPrincipal ?? cat?.canal ?? "email",
      responsable: f?.responsable,
      catalystDerivada: link.derivada,
    };
  }

  /** Resuelve una campaña por su identificador Flow. */
  resolverDesdeFlow(flowId: string, flow: readonly FlowCampana[], catalyst: readonly CatalystCampana[]): ResolucionCampana {
    if (!flow.some((c) => c.id === flowId)) {
      return { estado: "no_existe", motivo: `La campaña ${flowId} no existe en Marketing Flow.` };
    }
    const link = this.links.find((l) => l.flowId === flowId);
    if (!link) {
      return { estado: "sin_relacion", motivo: "Sin campaña Catalyst vinculada. Puedes crear la relación." };
    }
    const campana = this.buildDomain(link, flow, catalyst);
    if (!campana) return { estado: "sin_relacion", motivo: "La relación existe pero ninguna de las dos campañas está disponible." };
    return { estado: "vinculada", campana };
  }

  /** Resuelve una campaña por su identificador Catalyst. */
  resolverDesdeCatalyst(catalystId: string, flow: readonly FlowCampana[], catalyst: readonly CatalystCampana[]): ResolucionCampana {
    const existe = catalyst.some((c) => c.id === catalystId) || this.derivadas.some((c) => c.id === catalystId);
    if (!existe) return { estado: "no_existe", motivo: `La campaña ${catalystId} no existe en Marketing Catalyst.` };
    const link = this.links.find((l) => l.catalystId === catalystId);
    if (!link) return { estado: "sin_relacion", motivo: "Sin campaña Flow vinculada." };
    const campana = this.buildDomain(link, flow, catalyst);
    if (!campana) return { estado: "sin_relacion", motivo: "La relación existe pero ninguna de las dos campañas está disponible." };
    return { estado: "vinculada", campana };
  }

  /**
   * Crea la relación para una campaña Flow nueva: genera un identificador
   * Catalyst derivado (no hardcodeado) y registra la campaña espejo temporal
   * conservando producto, canal, estado y objetivo.
   */
  vincularNueva(flowCampana: FlowCampana): CampaignLink {
    const existente = this.links.find((l) => l.flowId === flowCampana.id);
    if (existente) return existente;
    const catalystId = `cat-${flowCampana.id}-${crypto.randomUUID().slice(0, 6)}`;
    const link: CampaignLink = {
      relationId: `rel-${flowCampana.id}-${catalystId}`,
      flowId: flowCampana.id,
      catalystId,
      derivada: true,
    };
    this.links = [...this.links, link];
    this.derivadas = [
      ...this.derivadas,
      {
        id: catalystId,
        nombre: flowCampana.nombre,
        productoId: flowCampana.productoId,
        estado: estadoFlowACatalyst(flowCampana.estado),
        canal: flowCampana.canalPrincipal,
      },
    ];
    return link;
  }

  /** Valida que ambas campañas de una relación existen. */
  validar(flowId: string, flow: readonly FlowCampana[], catalyst: readonly CatalystCampana[]): boolean {
    const link = this.links.find((l) => l.flowId === flowId);
    if (!link) return false;
    const okFlow = flow.some((c) => c.id === link.flowId);
    const okCat = catalyst.some((c) => c.id === link.catalystId) || this.derivadas.some((c) => c.id === link.catalystId);
    return okFlow && okCat;
  }
}
