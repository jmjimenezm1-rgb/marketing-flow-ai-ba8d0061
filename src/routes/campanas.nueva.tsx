import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { segmentos } from "@/lib/mock-data";
import type { Campana, Canal, PasoSecuencia } from "@/lib/mock-data";
import { evaluarCumplimiento } from "@/lib/ai-mock";

export const Route = createFileRoute("/campanas/nueva")({
  head: () => ({
    meta: [
      { title: "Nueva campaña — MarketingHub AI" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Constructor de campañas con validación de consentimiento por canal." },
      { property: "og:title", content: "Nueva campaña — MarketingHub AI" },
      { property: "og:description", content: "Define objetivo, segmento, canal, secuencia y base jurídica." },
    ],
  }),
  component: NuevaCampana,
});

const secuenciaPorDefecto = (canal: Canal): PasoSecuencia[] => [
  { id: "n1", orden: 1, nombre: "Mensaje inicial", canal, esperaDias: 0, condicion: "Al iniciar la campaña", objetivo: "Presentar propuesta de valor", revisionRequerida: true },
  { id: "n2", orden: 2, nombre: "Primer seguimiento", canal, esperaDias: 4, condicion: "Si el cliente no responde", objetivo: "Recordatorio con caso de uso", revisionRequerida: true },
  { id: "n3", orden: 3, nombre: "Cierre", canal, esperaDias: 9, condicion: "Si el cliente no responde", objetivo: "Última llamada / cierre", revisionRequerida: true },
];

function NuevaCampana() {
  const { productos, clientes, addCampana } = useStore();
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({
    nombre: "",
    productoId: productos[0]!.id,
    objetivo: "",
    tipo: "captacion" as Campana["tipo"],
    publicoObjetivo: "",
    segmentos: [] as string[],
    canalPrincipal: "email" as Campana["canalPrincipal"],
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaFin: "",
    responsable: "Ana Coloma",
    presupuesto: 1000,
    metricaObjetivo: "",
    mensajePrincipal: "",
    reglasEvolucion: "Máximo 3 impactos. Parada inmediata ante respuesta o baja.",
    reglasExclusion: "Excluir contactos sin consentimiento válido y bajas registradas.",
    reglasBaja: "Incluir mecanismo de baja en todos los mensajes.",
    requisitoConsentimiento: "consentimiento_expreso" as Campana["requisitoConsentimiento"],
    observaciones: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canalRevision: Canal = form.canalPrincipal === "whatsapp" ? "whatsapp" : "email";
  const candidatos = clientes.filter(
    (c) => form.segmentos.length === 0 || form.segmentos.includes(c.segmento),
  );
  const campanaProvisional = {
    ...form,
    id: "tmp",
    validacionLegal: "pendiente",
  } as unknown as Campana;
  const aptos = candidatos.filter(
    (c) => evaluarCumplimiento(c, canalRevision, campanaProvisional).riesgoLegal !== "bloqueante",
  );
  const noAptos = candidatos.length - aptos.length;

  const crear = (estado: Campana["estado"]) => {
    if (!form.nombre.trim()) {
      toast.error("La campaña necesita un nombre.");
      setPaso(1);
      return;
    }
    const id = `cam-${Math.random().toString(36).slice(2, 8)}`;
    addCampana({
      ...form,
      id,
      canalesSecundarios: [],
      fechaInicio: new Date(form.fechaInicio).toISOString(),
      fechaFin: form.fechaFin ? new Date(form.fechaFin).toISOString() : "",
      estado,
      validacionLegal: "pendiente",
      destinatarios: aptos.map((c) => c.id),
      secuencia: secuenciaPorDefecto(canalRevision),
      createdAt: new Date().toISOString(),
    });
    toast.success(
      estado === "borrador" ? "Campaña guardada como borrador." : "Campaña enviada a revisión legal.",
    );
    void navigate({ to: "/campanas/$id", params: { id } });
  };

  const pasos = ["Datos", "Público y canal", "Cumplimiento", "Resumen"];

  return (
    <AppShell title="Constructor de campaña" subtitle="Módulo 5 · Flujo guiado con validación de consentimiento">
      <div className="mb-6 flex flex-wrap gap-2">
        {pasos.map((p, i) => (
          <button
            key={p}
            onClick={() => setPaso(i + 1)}
            className={`rounded-full border px-3 py-1 text-sm ${
              paso === i + 1 ? "border-primary bg-primary/10 font-medium text-primary" : "bg-card text-muted-foreground"
            }`}
          >
            {i + 1}. {p}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border bg-card p-5 shadow-panel">
          {paso === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nombre de campaña</Label>
                <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Captación Q4 · …" />
              </div>
              <div>
                <Label>Producto o servicio</Label>
                <Select value={form.productoId} onValueChange={(v) => set("productoId", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {productos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de campaña</Label>
                <Select value={form.tipo} onValueChange={(v) => set("tipo", v as Campana["tipo"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["captacion", "reactivacion", "upselling", "cross-selling", "fidelizacion", "recordatorio", "evento", "lanzamiento", "nutricion"].map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Objetivo</Label>
                <Input value={form.objetivo} onChange={(e) => set("objetivo", e.target.value)} placeholder="Generar 20 reuniones cualificadas" />
              </div>
              <div>
                <Label>Fecha de inicio</Label>
                <Input type="date" value={form.fechaInicio} onChange={(e) => set("fechaInicio", e.target.value)} />
              </div>
              <div>
                <Label>Fecha de fin</Label>
                <Input type="date" value={form.fechaFin} onChange={(e) => set("fechaFin", e.target.value)} />
              </div>
              <div>
                <Label>Responsable</Label>
                <Input value={form.responsable} onChange={(e) => set("responsable", e.target.value)} />
              </div>
              <div>
                <Label>Presupuesto orientativo (€)</Label>
                <Input type="number" value={form.presupuesto} onChange={(e) => set("presupuesto", Number(e.target.value))} />
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="grid gap-4">
              <div>
                <Label>Público objetivo</Label>
                <Input value={form.publicoObjetivo} onChange={(e) => set("publicoObjetivo", e.target.value)} placeholder="Directores financieros de pymes" />
              </div>
              <div>
                <Label>Segmentos de clientes</Label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {segmentos.map((s) => (
                    <label key={s} className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
                      <Checkbox
                        checked={form.segmentos.includes(s)}
                        onCheckedChange={(v) =>
                          set("segmentos", v ? [...form.segmentos, s] : form.segmentos.filter((x) => x !== s))
                        }
                      />
                      {s}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Sin selección se consideran todos los segmentos.</p>
              </div>
              <div>
                <Label>Canal principal</Label>
                <Select value={form.canalPrincipal} onValueChange={(v) => set("canalPrincipal", v as Campana["canalPrincipal"])}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="mixto">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mensaje principal</Label>
                <Textarea rows={3} value={form.mensajePrincipal} onChange={(e) => set("mensajePrincipal", e.target.value)} />
              </div>
              <div>
                <Label>Métrica objetivo</Label>
                <Input value={form.metricaObjetivo} onChange={(e) => set("metricaObjetivo", e.target.value)} placeholder="Tasa de respuesta > 8%" />
              </div>
            </div>
          )}

          {paso === 3 && (
            <div className="grid gap-4">
              <div>
                <Label>Requisito de consentimiento</Label>
                <Select
                  value={form.requisitoConsentimiento}
                  onValueChange={(v) => set("requisitoConsentimiento", v as Campana["requisitoConsentimiento"])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consentimiento_expreso">Consentimiento expreso previo</SelectItem>
                    <SelectItem value="cliente_existente_similar">Cliente existente · productos similares (art. 21.2 LSSI)</SelectItem>
                    <SelectItem value="interes_legitimo_b2b">Interés legítimo B2B (requiere validación legal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reglas de evolución</Label>
                <Textarea rows={2} value={form.reglasEvolucion} onChange={(e) => set("reglasEvolucion", e.target.value)} />
              </div>
              <div>
                <Label>Reglas de exclusión</Label>
                <Textarea rows={2} value={form.reglasExclusion} onChange={(e) => set("reglasExclusion", e.target.value)} />
              </div>
              <div>
                <Label>Reglas de baja / opt-out</Label>
                <Textarea rows={2} value={form.reglasBaja} onChange={(e) => set("reglasBaja", e.target.value)} />
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea rows={2} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} />
              </div>
            </div>
          )}

          {paso === 4 && (
            <div className="space-y-3 text-sm">
              <h2 className="font-display text-base font-semibold">Resumen</h2>
              <dl className="grid gap-2 sm:grid-cols-2">
                {[
                  ["Nombre", form.nombre || "—"],
                  ["Producto", productos.find((p) => p.id === form.productoId)?.nombre ?? "—"],
                  ["Tipo", form.tipo],
                  ["Canal", form.canalPrincipal],
                  ["Segmentos", form.segmentos.join(", ") || "Todos"],
                  ["Destinatarios aptos", `${aptos.length} de ${candidatos.length}`],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg border bg-muted/40 px-3 py-2">
                    <dt className="text-xs uppercase text-muted-foreground">{k}</dt>
                    <dd className="capitalize">{v as string}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-muted-foreground">
                La campaña se crea con validación legal <strong>pendiente</strong>. No podrá enviarse hasta
                que compliance la apruebe y los mensajes pasen revisión humana.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
            <Button variant="outline" disabled={paso === 1} onClick={() => setPaso((p) => p - 1)}>
              Anterior
            </Button>
            {paso < 4 ? (
              <Button onClick={() => setPaso((p) => p + 1)}>Siguiente</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => crear("borrador")}>Guardar borrador</Button>
                <Button onClick={() => crear("pendiente_revision")}>Crear y enviar a revisión</Button>
              </>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-panel">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4 text-primary" /> Validación de consentimiento
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Canal evaluado: <strong>{canalRevision === "email" ? "Email" : "WhatsApp"}</strong>
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between rounded-md bg-success/10 px-3 py-2">
                <span>Aptos para envío</span>
                <strong className="text-success">{aptos.length}</strong>
              </div>
              <div className="flex justify-between rounded-md bg-destructive/10 px-3 py-2">
                <span>No aptos / bloqueados</span>
                <strong className="text-destructive">{noAptos}</strong>
              </div>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
            <p className="text-muted-foreground">
              WhatsApp marketing exige opt-in específico y trazable. Los contactos sin consentimiento válido
              quedan excluidos automáticamente de los destinatarios.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
