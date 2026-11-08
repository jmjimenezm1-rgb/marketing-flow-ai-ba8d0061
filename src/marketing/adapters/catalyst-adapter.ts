// Adaptador de Marketing Catalyst hacia la capa de dominio común.

import type { Cliente as CatalystCliente, Producto as CatalystProducto, Campana as CatalystCampana } from "@/marketing/catalyst/mock/data";
import { catalystToMarketingClient } from "@/marketing/domain/clients";
import { catalystToDomainProduct } from "@/marketing/domain/products";
import type { MarketingClient, DomainProduct } from "@/marketing/domain/types";

export const catalystAdapter = {
  clientes: (list: readonly CatalystCliente[]): MarketingClient[] => list.map(catalystToMarketingClient),
  productos: (list: readonly CatalystProducto[]): DomainProduct[] => list.map(catalystToDomainProduct),
  campanaExiste: (list: readonly CatalystCampana[], id: string) => list.some((c) => c.id === id),
};
