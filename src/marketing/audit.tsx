import { createContext, useContext, useRef, useState, type ReactNode } from "react";

export interface AuditEvent {
  id: string;
  fecha: string;
  usuario: string;
  modulo: string;
  accion: string;
  detalle: string;
  entidad: string;
  entidadId: string;
  clienteId?: string;
  campanaId?: string;
  canal?: string;
  anterior?: unknown;
  nuevo?: unknown;
  resultado: "realizado" | "bloqueado";
  motivo?: string;
  revisionHumana?: boolean;
}
export type AuditInput = Omit<AuditEvent, "id" | "fecha">;
export function makeAuditEvent(input: AuditInput): AuditEvent {
  return { ...structuredClone(input), id: crypto.randomUUID(), fecha: new Date().toISOString() };
}
const Context = createContext<{ events: AuditEvent[]; record: (event: AuditInput) => void } | null>(null);
export function AuditProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const records = useRef<AuditEvent[]>([]);
  const record = (input: AuditInput) => {
    records.current = [makeAuditEvent(input), ...records.current];
    setEvents(records.current);
  };
  return <Context.Provider value={{ events, record }}>{children}</Context.Provider>;
}
export function useAudit() {
  const value = useContext(Context);
  if (!value) throw new Error("AuditProvider requerido");
  return value;
}