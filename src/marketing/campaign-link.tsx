import { Link } from "@tanstack/react-router";
import { ArrowLeft, Link2 } from "lucide-react";
import { useFlowStoreName } from "@/marketing/domain/hooks";
import { useMarketingDomain } from "@/marketing/domain/store";
import { FLOW_TO_CATALYST } from "@/marketing/domain/campaigns";

// Reexportación de compatibilidad: el mapa inicial vive en domain/campaigns.
export { FLOW_TO_CATALYST };

export type CampaignSearch = { campana?: string };
export const validateCampaignSearch = (s: Record<string, unknown>): CampaignSearch =>
  typeof s["campana"] === "string" ? { campana: s["campana"] } : {};

/** Compatibilidad: resolución estática con la semilla inicial. Preferir useMarketingDomain. */
export function catalystCampaignFor(flowId?: string) {
  return flowId ? FLOW_TO_CATALYST[flowId] : undefined;
}

export function CampaignBanner({ flowId }: { flowId?: string | undefined }) {
  const { resolverCampanaFlow, vincularCampanaNueva } = useMarketingDomain();
  const nombreFlow = useFlowStoreName(flowId);
  if (!flowId) return null;
  const res = resolverCampanaFlow(flowId);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
      <p className="min-w-0 text-muted-foreground">
        Mostrando solo la campaña <strong className="text-foreground">{nombreFlow ?? flowId}</strong>
        {res.estado === "vinculada" && res.campana ? (
          <> · en Catalyst: {res.campana.nombre}{res.campana.catalystDerivada ? " (vinculada en esta sesión)" : ""}</>
        ) : res.estado === "sin_relacion" ? (
          <> · sin campaña Catalyst vinculada</>
        ) : (
          <> · {res.motivo}</>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {res.estado === "sin_relacion" && (
          <button
            type="button"
            onClick={() => vincularCampanaNueva(flowId)}
            className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 font-medium hover:bg-muted"
          >
            <Link2 className="size-4" /> Vincular con Catalyst
          </button>
        )}
        <Link to="/campanas/$id" params={{ id: flowId }} className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 font-medium hover:bg-muted">
          <ArrowLeft className="size-4" /> Volver a la campaña
        </Link>
      </div>
    </div>
  );
}
