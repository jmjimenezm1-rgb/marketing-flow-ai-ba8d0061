import { describe, expect, it } from "vitest";
import { createSession, sendBlockReasons, draftBlockReasons, type SessionData } from "./session";
import type { Envio } from "./mock/data";

function base() {
  const d: SessionData = createSession();
  const c = d.clientes[0]!; const camp = d.campanas[0]!; const p = d.productos[0]!;
  c.consentimiento.email = "valido"; c.baseJuridica = "Consentimiento expreso"; c.ultimoContacto = "2020-01-01";
  camp.estado = "aprobada";
  const m = { ...d.mensajes[0]!, id: "mt", clienteId: c.id, campanaId: camp.id, productoId: p.id, canal: "email" as const, aprobado: true, riesgoLegal: "bajo" as "bajo" | "medio" | "alto", incluyeBaja: true };
  d.mensajes = [m];
  const e = { ...d.envios[0]!, id: "et", clienteId: c.id, campanaId: camp.id, productoId: p.id, mensajeId: "mt", canal: "email", estado: "pendiente" } as Envio;
  d.envios = [e];
  return { d, e, c, camp, m };
}

describe("bloqueos de envío", () => {
  it("permite un envío válido", () => { const { d, e } = base(); expect(sendBlockReasons(d, e)).toEqual([]); });
  for (const s of ["ausente", "revocado", "baja", "pendiente"] as const)
    it(`bloquea consentimiento ${s}`, () => { const { d, e, c } = base(); c.consentimiento.email = s; expect(sendBlockReasons(d, e).length).toBeGreaterThan(0); });
  it("bloquea revisión pendiente", () => { const { d, e, m } = base(); m.aprobado = false; expect(sendBlockReasons(d, e).some(r => r.startsWith("Mensaje aprobado"))).toBe(true); });
  it("bloquea riesgo alto", () => { const { d, e, m } = base(); m.riesgoLegal = "alto"; expect(sendBlockReasons(d, e).some(r => r.startsWith("Sin alertas legales"))).toBe(true); });
  it("bloquea campaña no aprobada", () => { const { d, e, camp } = base(); camp.estado = "borrador"; expect(sendBlockReasons(d, e).some(r => r.startsWith("Campaña aprobada"))).toBe(true); });
  it("bloquea sin mecanismo de baja", () => { const { d, e, m } = base(); m.incluyeBaja = false; expect(sendBlockReasons(d, e).some(r => r.startsWith("Incluye mecanismo"))).toBe(true); });
  it("frecuencia no bloquea", () => { const { d, e, c } = base(); c.ultimoContacto = new Date().toISOString(); expect(sendBlockReasons(d, e)).toEqual([]); });
});

describe("bloqueos de respuesta", () => {
  it("bloquea aprobar respuesta con consentimiento revocado", () => {
    const { d, c, camp } = base(); c.consentimiento.email = "revocado";
    const b = { ...d.borradores[0]!, clienteId: c.id, campanaId: camp.id, canal: "email" as const, riesgoLegal: "bajo" as const, revisionLegal: false };
    expect(draftBlockReasons(d, b, "aprobada")).toContain("Consentimiento no válido, baja o revocación en el canal");
  });
});
