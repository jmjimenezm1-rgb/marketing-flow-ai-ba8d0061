// Resolución común de productos entre Flow y Catalyst.
// Flow es la fuente maestra de detalle (beneficios, objeciones, público, estado);
// Catalyst referencia productos por id. Se resuelven por identificador común.

import type { Producto as FlowProducto } from "@/lib/mock-data";
import type { Producto as CatalystProducto } from "@/marketing/catalyst/mock/data";
import type { DomainProduct } from "./types";

export function flowToDomainProduct(p: FlowProducto): DomainProduct {
  return {
    id: p.id,
    procedencia: "flow",
    nombre: p.nombre,
    descripcionCorta: p.descripcionCorta,
    publicoObjetivo: p.publicoObjetivo,
    beneficios: [...p.beneficios],
    objeciones: [...p.objeciones],
    estado: p.estado,
    original: p,
  };
}

export function catalystToDomainProduct(p: CatalystProducto): DomainProduct {
  return { id: p.id, procedencia: "catalyst", nombre: p.nombre, beneficios: [], objeciones: [], original: p };
}

/**
 * Resuelve un producto por id consultando primero Flow (detalle completo)
 * y después Catalyst. Devuelve undefined si no existe en ninguno.
 */
export function resolverProducto(
  id: string,
  flow: readonly FlowProducto[],
  catalyst: readonly CatalystProducto[],
): DomainProduct | undefined {
  const f = flow.find((p) => p.id === id);
  if (f) return flowToDomainProduct(f);
  const c = catalyst.find((p) => p.id === id);
  return c ? catalystToDomainProduct(c) : undefined;
}

/** Lista unificada sin duplicados por id; Flow aporta el detalle cuando coincide. */
export function productosComunes(
  flow: readonly FlowProducto[],
  catalyst: readonly CatalystProducto[],
): DomainProduct[] {
  const porId = new Map<string, DomainProduct>();
  for (const p of catalyst) porId.set(p.id, catalystToDomainProduct(p));
  for (const p of flow) porId.set(p.id, flowToDomainProduct(p));
  return [...porId.values()];
}
