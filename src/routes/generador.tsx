import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, ShieldAlert, ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { evaluarCumplimiento, generarMensaje, type OpcionesGeneracion } from "@/lib/ai-mock";
import type { Canal, MensajeGenerado } from "@/lib/mock-data";

type Search = { campana?: string };

export const Route = createFileRoute("/generador")({
  validateSearch: (search: Record<string, unknown>): Search =>
    typeof search["campana"] === "string" ? { campana: search["campana"] } : {},
  head: () => ({
    meta: [
      { title: "Generador de mensajes con IA — MarketingHub AI" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "description",
        content: "Genera mensajes de email y WhatsApp personalizados por cliente, con reglas de IA responsable.",
      },
      { property: "og:title", content: "Generador de mensajes con IA — MarketingHub AI" },
      { property: "og:description", content: "Mensajes personalizados, variantes A/B y control de riesgos legales." },
    ],
  }),
  component: Generador,
});

const TONOS = ["formal", "cercano", "ejecutivo", "consultivo", "comercial", "técnico", "breve", "premium"];
const TIPOS = [
  "Mensaje inicial",
  "Seguimiento",
  "Recordatorio",
  "Reactivación",
  "Agradecimiento",
  "Respuesta a objeción",
  "Caso de uso",
];

function Generador() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { campanas, productos, clientes, addMensajes } = useStore();
  const [campanaId, setCampanaId] = useState(search.campana ?? campanas[0]!.id);
  const campana = campanas.find((c) => c.id === campanaId) ?? campanas[0]!;
  const [canal, setCanal] = useState<Canal>(campana.canalPrincipal === "whatsapp" ? "whatsapp" : "email");
  const [opts, setOpts] = useState({
    tipoMensaje: TIPOS[0]!,
    tono: "consultivo",
    idioma: "es",
    nivelPersonalizacion: "alto" as OpcionesGeneracion["nivelPersonalizacion"],
    objetivo: "",
    cta: "",
    longitud: "media" as OpcionesGeneracion["longitud"],
    propuestaValor: "",
    objeciones: "",
    palabrasProhibidas: "garantizado, sin riesgo",
    restriccionesLegales: "Incluir enlace de baja. No usar datos sensibles ni atributos protegidos.",
    variantesAB: false,
  });
  const [seleccion, setSeleccion] = useState<string[]>(campana.destinatarios);
  const [preview, setPreview] = useState<MensajeGenerado[]>([]);

  const destinatarios = useMemo(
    () => clientes.filter((c) => campana.destinatarios.includes(c.id)),
    [clientes, campana],
  );

  const set = <K extends keyof typeof opts>(k: K, v: (typeof opts)[K]) => setOpts((o) => ({ ...o, [k]: v }));

  const cambiarCampana = (id: string) => {
    const c = campanas.find((x) => x.id === id)!;
    setCampanaId(id);
    setCanal(c.canalPrincipal === "whatsapp" ? "whatsapp" : "email");
    setSeleccion(c.destinatarios);
    setPreview([]);
  };

  const generar = () => {
    const producto = productos.find((p) => p.id === campana.productoId)!;
    const elegidos = destinatarios.filter((c) => seleccion.includes(c.id));
    if (elegidos.length === 0) {
      toast.error("Selecciona al menos un cliente.");
      return;
    }
    const base: OpcionesGeneracion = {
      ...opts,
      campanaId: campana.id,
      productoId: producto.id,
      canal,
      clienteIds: elegidos.map((c) => c.id),
    };
    const generados = elegidos.flatMap((cli) =>
      opts.variantesAB
        ? (["A", "B"] as const).map((v) => generarMensaje(base, cli, producto, campana, v))
        : [generarMensaje(base, cli, producto, campana, null)],
    );
    setPreview(generados);
    toast.success(`${generados.length} mensajes generados. Requieren revisión humana antes del envío.`);
  };

  const enviarARevision = () => {
    addMensajes(preview);
    toast.success("Mensajes enviados a la bandeja de revisión.");
    void navigate({ to: "/revision", search: { campana: campana.id } });
  };

  const bloqueadosSeleccion = destinatarios.filter(
    (c) => seleccion.includes(c.id) && evaluarCumplimiento(c, canal, campana).riesgoLegal === "bloqueante",
  ).length;

  return (
    <AppShell
      title="Generador de mensajes con IA"
      subtitle="Módulo 6 · Servicio de IA simulado con reglas de IA responsable"
      actions={
        <Button onClick={generar}>
          <Sparkles className="size-4" /> Generar
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-panel">
            <h2 className="text-sm font-semibold">Contexto</h2>
            <div className="mt-3 grid gap-3">
              <div>
                <Label>Campaña</Label>
                <Select value={campanaId} onValueChange={cambiarCampana}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {campanas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                Producto: <strong>{productos.find((p) => p.id === campana.productoId)?.nombre}</strong>
              </div>
              <div>
                <Label>Canal</Label>
                <Select value={canal} onValueChange={(v) => setCanal(v as Canal)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={opts.tipoMensaje} onValueChange={(v) => set("tipoMensaje", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tono</Label>
                  <Select value={opts.tono} onValueChange={(v) => set("tono", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONOS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Idioma</Label>
                  <Select value={opts.idioma} onValueChange={(v) => set("idioma", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">Inglés</SelectItem>
                      <SelectItem value="ca">Catalán</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Longitud</Label>
                  <Select value={opts.longitud} onValueChange={(v) => set("longitud", v as typeof opts.longitud)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breve">Breve</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="extensa">Extensa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Nivel de personalización</Label>
                <Select
                  value={opts.nivelPersonalizacion}
                  onValueChange={(v) => set("nivelPersonalizacion", v as typeof opts.nivelPersonalizacion)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generico">Genérico (toda la campaña)</SelectItem>
                    <SelectItem value="medio">Medio (sector y producto)</SelectItem>
                    <SelectItem value="alto">Alto (cliente, cargo y sector)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Objetivo del mensaje</Label>
                <Input value={opts.objetivo} onChange={(e) => set("objetivo", e.target.value)} placeholder="Conseguir una reunión" />
              </div>
              <div>
                <Label>Llamada a la acción</Label>
                <Input value={opts.cta} onChange={(e) => set("cta", e.target.value)} placeholder="¿Le encaja una llamada de 20 min?" />
              </div>
              <div>
                <Label>Propuesta de valor</Label>
                <Textarea rows={2} value={opts.propuestaValor} onChange={(e) => set("propuestaValor", e.target.value)} />
              </div>
              <div>
                <Label>Objeciones a anticipar</Label>
                <Input value={opts.objeciones} onChange={(e) => set("objeciones", e.target.value)} placeholder="Coste de migración" />
              </div>
              <div>
                <Label>Palabras o expresiones prohibidas</Label>
                <Input value={opts.palabrasProhibidas} onChange={(e) => set("palabrasProhibidas", e.target.value)} />
              </div>
              <div>
                <Label>Restricciones legales</Label>
                <Textarea rows={2} value={opts.restriccionesLegales} onChange={(e) => set("restriccionesLegales", e.target.value)} />
              </div>
              <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                Generar variantes A/B
                <Switch checked={opts.variantesAB} onCheckedChange={(v) => set("variantesAB", v)} />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-info/40 bg-info/5 p-4 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Reglas de IA responsable aplicadas</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>No se inventan datos del cliente: sin datos verificados, el mensaje se degrada a genérico.</li>
              <li>Sin promesas absolutas ni presión indebida; expresiones de riesgo marcadas.</li>
              <li>Siempre se incluye mecanismo de baja y se identifica al remitente.</li>
              <li>Toda generación queda registrada con autor, versión e historial.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card shadow-panel">
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Destinatarios de la campaña</h2>
              <span className="text-xs text-muted-foreground">{seleccion.length} seleccionados</span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setSeleccion(destinatarios.map((c) => c.id))}>Todos</Button>
                <Button size="sm" variant="ghost" onClick={() => setSeleccion([])}>Ninguno</Button>
              </div>
            </div>
            <ul className="divide-y">
              {destinatarios.map((c) => {
                const ev = evaluarCumplimiento(c, canal, campana);
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <Checkbox
                      checked={seleccion.includes(c.id)}
                      onCheckedChange={(v) =>
                        setSeleccion((s) => (v ? [...s, c.id] : s.filter((x) => x !== c.id)))
                      }
                    />
                    <div className="min-w-40 flex-1">
                      <p className="font-medium">{c.razonSocial}</p>
                      <p className="text-xs text-muted-foreground">{c.persona} · {c.sector}</p>
                    </div>
                    <StatusBadge value={c.consentimiento[canal]} />
                    <StatusBadge value={ev.riesgoLegal} />
                  </li>
                );
              })}
            </ul>
          </div>

          {bloqueadosSeleccion > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <ShieldAlert className="mt-0.5 size-5 text-destructive" />
              <p className="text-muted-foreground">
                {bloqueadosSeleccion} contactos seleccionados están bloqueados. Se puede generar el texto para
                revisión interna, pero el envío quedará impedido por cumplimiento.
              </p>
            </div>
          )}

          <div className="rounded-xl border bg-card shadow-panel">
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Vista previa ({preview.length})</h2>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={generar}>
                  <Sparkles className="size-4" /> Regenerar
                </Button>
                <Button size="sm" disabled={preview.length === 0} onClick={enviarARevision}>
                  <ClipboardCheck className="size-4" /> Enviar a revisión
                </Button>
              </div>
            </div>
            {preview.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                Configura las opciones y pulsa «Generar» para ver los mensajes propuestos.
              </p>
            ) : (
              <ul className="divide-y">
                {preview.map((m) => {
                  const cli = clientes.find((c) => c.id === m.clienteId)!;
                  return (
                    <li key={m.id} className="space-y-2 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{cli.razonSocial}</p>
                        <StatusBadge value={m.canal} />
                        <StatusBadge value={m.riesgoLegal} />
                        {m.variante && <StatusBadge value="borrador" label={`Variante ${m.variante}`} />}
                        <span className="text-xs text-muted-foreground">
                          Personalización: {m.nivelPersonalizacion}
                        </span>
                      </div>
                      {m.asunto && <p className="text-sm font-medium">Asunto: {m.asunto}</p>}
                      <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 font-sans text-sm">{m.cuerpo}</pre>
                      {m.riesgos.length > 0 && (
                        <ul className="list-disc space-y-0.5 pl-5 text-xs text-destructive">
                          {m.riesgos.map((r) => <li key={r}>{r}</li>)}
                        </ul>
                      )}
                      <p className="text-xs text-muted-foreground">{m.motivoPersonalizacion}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            ¿Ya generados? Revísalos uno a uno en{" "}
            <Link to="/revision" className="text-primary underline">
              Revisión de mensajes
            </Link>
            .
          </p>
        </div>
      </div>
    </AppShell>
  );
}
