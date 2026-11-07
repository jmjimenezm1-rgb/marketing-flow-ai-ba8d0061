import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { campanas as flowCampanas } from "@/lib/mock-data";
import { nombreCampana } from "@/marketing/catalyst/mock/data";

// Correspondencia explícita de demostración entre campañas Flow y Catalyst.
// Se sustituirá por el identificador común del CRM en una fase posterior.
export const FLOW_TO_CATALYST: Record<string, string> = { cam1: "c1", cam2: "c2", cam3: "c3", cam4: "c4" };

export type CampaignSearch = { campana?: string };
export const validateCampaignSearch = (s: Record<string, unknown>): CampaignSearch =>
  typeof s.campana === "string" ? { campana: s.campana } : {};

export function catalystCampaignFor(flowId?: string) {
  return flowId ? FLOW_TO_CATALYST[flowId] : undefined;
}

export function CampaignBanner({ flowId }: { flowId?: string }) {
  if (!flowId) return null;
  const flow = flowCampanas.find((c) => c.id === flowId);
  const cat = catalystCampaignFor(flowId);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
      <p className="min-w-0 text-muted-foreground">
        Mostrando solo la campaña <strong className="text-foreground">{flow?.nombre ?? flowId}</strong>
        {cat ? <> · en Catalyst: {nombreCampana(cat)}</> : <> · sin campaña Catalyst vinculada</>}
      </p>
      <Link to="/campanas/$id" params={{ id: flowId }} className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 font-medium hover:bg-muted">
        <ArrowLeft className="size-4" /> Volver a la campaña
      </Link>
    </div>
  );
}
