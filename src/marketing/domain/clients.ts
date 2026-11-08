// Adaptadores de ida y vuelta entre los modelos de cliente de Flow y Catalyst
// y el tipo de dominio común MarketingClient. No se eliminan propiedades.

import type { Cliente as FlowCliente } from "@/lib/mock-data";
import type { Cliente as CatalystCliente } from "@/marketing/catalyst/mock/data";
import type { Canal, EstadoConsentimientoComun, MarketingClient } from "./types";

/** Flow → común. Flow no distingue "baja" como estado: usa revocado + bajaCanal. */
export function flowToMarketingClient(c: FlowCliente): MarketingClient {
  const consentimiento: Record<Canal, EstadoConsentimientoComun> = {
    email: c.bajaCanal.includes("email") ? "baja" : c.consentimiento.email,
    whatsapp: c.bajaCanal.includes("whatsapp") ? "baja" : c.consentimiento.whatsapp,
  };
  return {
    id: c.id,
    procedencia: "flow",
    razonSocial: c.razonSocial,
    contacto: c.persona,
    cargo: c.cargo,
    email: c.email,
    whatsapp: c.whatsapp,
    sector: c.sector,
    responsable: c.responsable,
    estadoComercial: c.estadoComercial,
    segmento: c.segmento,
    consentimiento,
    baseJuridica: c.baseJuridica,
    fuenteDato: c.origenDato,
    fechaConsentimiento: c.fechaConsentimiento,
    baja: { activa: c.bajaCanal.length > 0, canales: [...c.bajaCanal] },
    historial: [],
    original: c,
  };
}

/** Catalyst → común. */
export function catalystToMarketingClient(c: CatalystCliente): MarketingClient {
  const canalesBaja = (Object.keys(c.consentimiento) as Canal[]).filter((k) => c.consentimiento[k] === "baja");
  return {
    id: c.id,
    procedencia: "catalyst",
    razonSocial: c.nombre,
    contacto: c.contacto,
    cargo: "",
    email: c.email,
    whatsapp: c.whatsapp,
    sector: c.sector,
    responsable: c.responsable,
    consentimiento: { ...c.consentimiento },
    baseJuridica: c.baseJuridica,
    fuenteDato: c.fuenteConsentimiento,
    fechaConsentimiento: c.fechaConsentimiento ?? null,
    baja: { activa: canalesBaja.length > 0, canales: canalesBaja },
    historial: [],
    original: c,
  };
}

/** Común → parche Flow (consentimiento y baja). Estados sin equivalente se mapean de forma explícita. */
export function consentimientoComunAFlow(cons: Record<Canal, EstadoConsentimientoComun>): {
  consentimiento: FlowCliente["consentimiento"];
  bajaCanal: Canal[];
} {
  const map = (e: EstadoConsentimientoComun): FlowCliente["consentimiento"][Canal] =>
    e === "baja" ? "revocado" : e === "pendiente" ? "ausente" : e;
  return {
    consentimiento: { email: map(cons.email), whatsapp: map(cons.whatsapp) },
    bajaCanal: (Object.keys(cons) as Canal[]).filter((k) => cons[k] === "baja"),
  };
}

/** Común → parche Catalyst. */
export function consentimientoComunACatalyst(cons: Record<Canal, EstadoConsentimientoComun>): CatalystCliente["consentimiento"] {
  const map = (e: EstadoConsentimientoComun): CatalystCliente["consentimiento"][Canal] =>
    e === "interes_legitimo" ? "pendiente" : e;
  return { email: map(cons.email), whatsapp: map(cons.whatsapp) };
}
