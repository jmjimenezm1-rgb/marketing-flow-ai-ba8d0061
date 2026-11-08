// Proveedor de dominio común: interfaz principal de integración Flow ↔ Catalyst.
// Consume ambos stores sin eliminarlos y expone una única representación
// temporal de clientes, productos, campañas, consentimientos, envíos y auditoría.

import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useStore as useFlowStore } from "@/lib/store";
import { useStore as useCatalystStore } from "@/marketing/catalyst/store";
import { CampaignRegistry } from "./campaigns";
import { combinarAuditoria } from "./audit";
import { flowToMarketingClient, catalystToMarketingClient } from "./clients";
import { productosComunes, resolverProducto } from "./products";
import type {
  AuditEventComun,
  DomainCampaign,
  DomainProduct,
  EstadoCampanaComun,
  MarketingClient,
  Procedencia,
  ResolucionCampana,
} from "./types";

export interface IndicadorConsolidado {
  clave: string;
  valor: number;
  procedencia: Procedencia;
}

interface DomainStore {
  registry: CampaignRegistry;
  resolverCampanaFlow: (flowId: string) => ResolucionCampana;
  resolverCampanaCatalyst: (catalystId: string) => ResolucionCampana;
  vincularCampanaNueva: (flowId: string) => ResolucionCampana;
  campanasComunes: DomainCampaign[];
  clientesComunes: MarketingClient[];
  productosComunes: DomainProduct[];
  resolverProductoComun: (id: string) => DomainProduct | undefined;
  auditoriaComun: AuditEventComun[];
  indicadores: IndicadorConsolidado[];
  /** Cambia el estado en Flow y lo refleja en la campaña Catalyst vinculada. */
  cambiarEstadoCampanaComun: (flowId: string, estado: EstadoCampanaComun) => void;
}

const Ctx = createContext<DomainStore | null>(null);

export function MarketingDomainProvider({ children }: { children: ReactNode }) {
  const flow = useFlowStore();
  const catalyst = useCatalystStore();
  const registryRef = useRef<CampaignRegistry | null>(null);
  if (!registryRef.current) registryRef.current = new CampaignRegistry();
  const registry = registryRef.current;
  // Fuerza rerender cuando el registro crea relaciones nuevas.
  const [version, setVersion] = useState(0);

  const value = useMemo<DomainStore>(() => {
    const catalystCampanas = [...catalyst.campanas, ...registry.campanasDerivadas];

    const resolverCampanaFlow = (flowId: string): ResolucionCampana =>
      registry.resolverDesdeFlow(flowId, flow.campanas, catalystCampanas);
    const resolverCampanaCatalyst = (catalystId: string): ResolucionCampana =>
      registry.resolverDesdeCatalyst(catalystId, flow.campanas, catalystCampanas);

    const campanasComunes = registry.relaciones
      .map((l) => resolverCampanaFlow(l.flowId).campana)
      .filter((c): c is DomainCampaign => !!c);

    const auditoriaComun = combinarAuditoria({
      auditoriaCatalyst: catalyst.auditoria,
      envios: catalyst.envios,
      borradores: catalyst.borradores,
      mensajesFlow: flow.mensajes,
    });

    const activasFlow = flow.campanas.filter((c) => c.estado === "activa").length;
    const activasCat = catalystCampanas.filter(
      (c) => c.estado === "activa" && !registry.relaciones.some((l) => l.catalystId === c.id),
    ).length;
    const sinConsentFlow = flow.clientes.filter(
      (c) => c.consentimiento.email === "ausente" && c.consentimiento.whatsapp === "ausente",
    ).length;
    const sinConsentCat = catalyst.clientes.filter(
      (c) => c.consentimiento.email === "ausente" && c.consentimiento.whatsapp === "ausente",
    ).length;
    const bajasCat = catalyst.clientes.filter((c) =>
      Object.values(c.consentimiento).includes("baja"),
    ).length;

    const indicadores: IndicadorConsolidado[] = [
      { clave: "campanas_activas", valor: activasFlow + activasCat, procedencia: "consolidado" },
      {
        clave: "campanas_programadas",
        valor: flow.campanas.filter((c) => c.estado === "programada").length +
          catalystCampanas.filter((c) => c.estado === "programada").length,
        procedencia: "consolidado",
      },
      {
        clave: "mensajes_pendientes",
        valor: flow.mensajes.filter((m) => m.estado === "pendiente_revision").length,
        procedencia: "flow",
      },
      {
        clave: "mensajes_bloqueados",
        valor: flow.mensajes.filter((m) => m.riesgoLegal === "bloqueante").length,
        procedencia: "flow",
      },
      {
        clave: "envios_pendientes",
        valor: catalyst.envios.filter((e) => ["pendiente", "programado"].includes(e.estado)).length,
        procedencia: "catalyst",
      },
      {
        clave: "envios_realizados",
        valor: catalyst.envios.filter((e) => ["enviado", "entregado", "leido", "respondido"].includes(e.estado)).length,
        procedencia: "catalyst",
      },
      {
        clave: "respuestas_pendientes",
        valor: catalyst.entradas.filter((e) => e.estado === "nuevo").length,
        procedencia: "catalyst",
      },
      {
        clave: "borradores",
        valor: catalyst.borradores.filter((b) => ["borrador", "pendiente_revision"].includes(b.estado)).length,
        procedencia: "catalyst",
      },
      { clave: "sin_consentimiento", valor: sinConsentFlow + sinConsentCat, procedencia: "consolidado" },
      { clave: "bajas", valor: bajasCat, procedencia: "catalyst" },
      {
        clave: "alertas_legales",
        valor: flow.mensajes.filter((m) => ["alto", "bloqueante"].includes(m.riesgoLegal)).length +
          catalyst.borradores.filter((b) => b.revisionLegal).length,
        procedencia: "consolidado",
      },
    ];

    return {
      registry,
      resolverCampanaFlow,
      resolverCampanaCatalyst,
      vincularCampanaNueva: (flowId) => {
        const c = flow.campanas.find((x) => x.id === flowId);
        if (!c) return { estado: "no_existe", motivo: `La campaña ${flowId} no existe en Marketing Flow.` };
        registry.vincularNueva(c);
        setVersion((v) => v + 1);
        return resolverCampanaFlow(flowId);
      },
      campanasComunes,
      clientesComunes: [
        ...flow.clientes.map(flowToMarketingClient),
        ...catalyst.clientes.map(catalystToMarketingClient),
      ],
      productosComunes: productosComunes(flow.productos, catalyst.productos),
      resolverProductoComun: (id) => resolverProducto(id, flow.productos, catalyst.productos),
      auditoriaComun,
      indicadores,
      cambiarEstadoCampanaComun: (flowId, estado) => {
        flow.updateCampana(flowId, { estado });
        const res = registry.resolverDesdeFlow(flowId, flow.campanas, catalystCampanas);
        if (res.estado === "vinculada" && res.campana?.catalystId && !res.campana.catalystDerivada) {
          const estadoCat = estado === "pausada" || estado === "cancelada" ? "borrador" : estado;
          catalyst.cambiarEstadoCampana(res.campana.catalystId, estadoCat);
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow, catalyst, registry, version]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMarketingDomain() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMarketingDomain debe usarse dentro de MarketingDomainProvider");
  return ctx;
}
