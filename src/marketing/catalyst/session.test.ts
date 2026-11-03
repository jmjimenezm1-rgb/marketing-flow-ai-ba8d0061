import { describe, expect, it } from "vitest";
import { campaignBlockReasons, createSession, draftBlockReasons } from "./session";

const base = () => {
  const d = createSession();
  const draft = { ...d.borradores[0], estado: "aprobada" as const, riesgoLegal: "bajo" as const, revisionLegal: false, texto: "Hola. Si no deseas recibir más mensajes, responde BAJA." };
  const client = d.clientes.find((c) => c.id === draft.clienteId)!;
  client.consentimiento[draft.canal] = "valido";
  client.baseJuridica = "Consentimiento expreso";
  const camp = d.campanas.find((c) => c.id === draft.campanaId)!;
  camp.estado = "aprobada";
  return { d, draft, client, camp };
};

describe("bloqueos de cumplimiento", () => {
  it("permite enviar una respuesta aprobada con consentimiento válido", () => {
    const { d, draft } = base();
    expect(draftBlockReasons(d, draft, "enviada")).toEqual([]);
  });
  it.each(["ausente", "revocado", "baja", "pendiente"] as const)("bloquea con consentimiento %s", (estado) => {
    const { d, draft, client } = base();
    client.consentimiento[draft.canal] = estado as never;
    expect(draftBlockReasons(d, draft, "enviada")).toContain("Consentimiento no válido, baja o revocación en el canal");
  });
  it("bloquea revisión humana pendiente", () => {
    const { d, draft } = base();
    expect(draftBlockReasons(d, { ...draft, estado: "pendiente_revision" }, "enviada")).toContain("Respuesta pendiente de aprobación humana");
  });
  it("bloquea riesgo legal alto", () => {
    const { d, draft } = base();
    expect(draftBlockReasons(d, { ...draft, riesgoLegal: "alto" }, "aprobada").length).toBeGreaterThan(0);
  });
  it("bloquea campaña no aprobada", () => {
    const { d, draft, camp } = base();
    camp.estado = "borrador";
    expect(draftBlockReasons(d, draft, "enviada")).toContain("Campaña no aprobada");
  });
  it("bloquea envío sin mecanismo de baja", () => {
    const { d, draft } = base();
    expect(draftBlockReasons(d, { ...draft, texto: "Hola" }, "enviada")).toContain("Falta mecanismo de baja");
  });
  it("no aprueba campaña con mensajes sin revisión", () => {
    const d = createSession();
    const m = d.mensajes[0]; m.aprobado = false;
    expect(campaignBlockReasons(d, m.campanaId)).toContain("Mensajes sin revisión humana");
  });
});
