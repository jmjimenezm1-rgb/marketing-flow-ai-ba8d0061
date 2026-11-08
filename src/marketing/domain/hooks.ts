// Hooks auxiliares de la capa de dominio.

import { useStore as useFlowStore } from "@/lib/store";

/** Nombre de una campaña Flow por id (o undefined si no existe). */
export function useFlowStoreName(flowId?: string): string | undefined {
  const { campanas } = useFlowStore();
  return flowId ? campanas.find((c) => c.id === flowId)?.nombre : undefined;
}
