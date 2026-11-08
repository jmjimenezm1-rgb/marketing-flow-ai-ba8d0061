// Repositorio temporal en memoria. Interfaz principal de integración:
// las pantallas y la capa de dominio trabajan contra este contrato,
// sustituible por la base de datos común sin cambiar los consumidores.

export interface TemporaryRepository<T extends { id: string }> {
  list(): readonly T[];
  get(id: string): T | undefined;
  update(id: string, patch: Partial<T>): void;
  add(item: T): void;
}

export function createTemporaryRepository<T extends { id: string }>(
  initial: readonly T[],
  onChange?: (items: readonly T[]) => void,
): TemporaryRepository<T> {
  let items = [...initial];
  const emit = () => onChange?.(items);
  return {
    list: () => items,
    get: (id) => items.find((i) => i.id === id),
    update: (id, patch) => {
      items = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
      emit();
    },
    add: (item) => {
      items = items.some((i) => i.id === item.id)
        ? items.map((i) => (i.id === item.id ? item : i))
        : [item, ...items];
      emit();
    },
  };
}
