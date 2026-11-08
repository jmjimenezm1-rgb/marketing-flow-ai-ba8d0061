// Adaptador de Marketing Flow hacia la capa de dominio común.

import type { Cliente as FlowCliente, Producto as FlowProducto, Campana as FlowCampana } from "@/lib/mock-data";
import { flowToMarketingClient } from "@/marketing/domain/clients";
import { flowToDomainProduct } from "@/marketing/domain/products";
import type { MarketingClient, DomainProduct } from "@/marketing/domain/types";

export const flowAdapter = {
  clientes: (list: readonly FlowCliente[]): MarketingClient[] => list.map(flowToMarketingClient),
  productos: (list: readonly FlowProducto[]): DomainProduct[] => list.map(flowToDomainProduct),
  campanaExiste: (list: readonly FlowCampana[], id: string) => list.some((c) => c.id === id),
};
