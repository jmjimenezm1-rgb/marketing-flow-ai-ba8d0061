import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Check, Send, Save, Undo2, Scale } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { generarMensaje, puedeEnviar, type OpcionesGeneracion } from "@/lib/ai-mock";

export const Route = createFileRoute("/revision/$id")({
  head: () => ({
    meta: [
      { title: "Detalle del mensaje — MarketingHub AI" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Detalle y edición del mensaje antes del envío, con comparativa de versiones." },
      { property: "og:title", content: "Detalle del mensaje — MarketingHub AI" },
      { property: "og:description", content: "Compara versiones, revisa riesgos y aprueba antes de enviar." },
    ],
  }),
  component: DetalleMensaje,
});

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
      <p className="text-sm">{v || "—"}</p>
    </div>
  );
}

function DetalleMensaje() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { mensajes, clientes, campanas, productos, updateMensaje } = useStore();
  const mensaje = mensajes.find((m) => m.id === id);
  if (!mensaje) throw notFound();
  const cliente = clientes.find((c) => c.id === mensaje.clienteId)!;
  const campana = campanas.find((c) => c.id === mensaje.campanaId)!;
  const producto = productos.find((p) => p.id === mensaje.productoId)!;

  const [asunto, setAsunto] = useState(mensaje.asunto ?? "");
  const [cuerpo, setCuerpo] = useState(mensaje.cuerpo);
  const [fecha, setFecha] = useState(mensaje.fechaPrevistaEnvio?.slice(0, 10) ?? "");

  const guardar = (estado: typeof mensaje.estado, accion: string) => {
    updateMensaje(
      mensaje.id,
      {
        cuerpo,
        asunto: mensaje.canal === "email" ? asunto : null,
        estado,
        fechaPrevistaEnvio: fecha ? new Date(fecha).toISOString() : null,
      },
      accion,
    );
    toast.success(accion);
  };

  const regenerar = () => {
    const opts: OpcionesGeneracion = {
      campanaId: campana.id,
      productoId: producto.id,
      canal: mensaje.canal,
      tipoMensaje: mensaje.tipoMensaje,
      tono: mensaje.tono,
      idioma: mensaje.idioma,
      nivelPersonalizacion: mensaje.nivelPersonalizacion,
      objetivo: campana.objetivo,
      cta: "",
      longitud: "media",
      propuestaValor: campana.mensajePrincipal,
      objeciones: producto.objeciones[0] ?? "",
      palabrasProhibidas: "garantizado, sin riesgo",
      restriccionesLegales: campana.reglasBaja,
      variantesAB: false,
      clienteIds: [cliente.id],
    };
    const nuevo = generarMensaje(opts, cliente, producto, campana, null);
    setCuerpo(nuevo.cuerpo);
    if (nuevo.asunto) setAsunto(nuevo.asunto);
    updateMensaje(mensaje.id, { riesgos: nuevo.riesgos, riesgoLegal: nuevo.riesgoLegal }, "Regenerado con IA (simulado)");
    toast.success("Mensaje regenerado. Requiere nueva revisión humana.");
  };

  const enviar = () => {
    const res = puedeEnviar(cliente, mensaje.canal, campana, { ...mensaje, cuerpo });
    if (!res.permitido) {
      toast.error("Envío bloqueado por cumplimiento", { description: res.motivos.join(" · ") });
      return;
    }
    guardar("enviado", "Envío individual simulado (conector mock)");
    void navigate({ to: "/revision" });
  };

  return (
    <AppShell
      title={`Mensaje para ${cliente.razonSocial}`}
      subtitle={`${campana.nombre} · ${producto.nombre}`}
      actions={
        <Button variant="outline" asChild>
          <Link to="/revision"><ArrowLeft className="size-4" /> Bandeja</Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={mensaje.canal} />
            <StatusBadge value={mensaje.estado} />
            <StatusBadge value={mensaje.riesgoLegal} />
            <StatusBadge value={cliente.consentimiento[mensaje.canal]} />
            <span className="text-xs text-muted-foreground">v{mensaje.version} · {mensaje.autor}</span>
          </div>

          <Tabs defaultValue="editar">
            <TabsList>
              <TabsTrigger value="editar">Editar mensaje</TabsTrigger>
              <TabsTrigger value="comparar">Comparar versiones</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="editar" className="mt-4 space-y-3 rounded-xl border bg-card p-4 shadow-panel">
              {mensaje.canal === "email" && (
                <div>
                  <Label>Asunto</Label>
                  <Input value={asunto} onChange={(e) => setAsunto(e.target.value)} />
                </div>
              )}
              <div>
                <Label>Cuerpo del mensaje</Label>
                <Textarea rows={mensaje.canal === "email" ? 14 : 6} value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
              </div>
              <div className="max-w-xs">
                <Label>Fecha prevista de envío</Label>
                <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <Button variant="outline" onClick={regenerar}><Sparkles className="size-4" /> Regenerar con IA</Button>
                <Button variant="outline" onClick={() => guardar("borrador", "Guardado como borrador")}><Save className="size-4" /> Guardar borrador</Button>
                <Button variant="outline" onClick={() => guardar("revision_legal", "Marcado para revisión legal")}><Scale className="size-4" /> Revisión legal</Button>
                <Button variant="outline" onClick={() => guardar("pendiente_revision", "Devuelto a generación")}><Undo2 className="size-4" /> Devolver a generación</Button>
                <Button onClick={() => guardar("aprobado", "Mensaje aprobado")}><Check className="size-4" /> Aprobar</Button>
                <Button onClick={enviar}><Send className="size-4" /> Enviar</Button>
              </div>
            </TabsContent>

            <TabsContent value="comparar" className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border bg-card p-4 shadow-panel">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Mensaje original (IA)</p>
                <pre className="whitespace-pre-wrap font-sans text-sm">{mensaje.cuerpoOriginal}</pre>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-panel">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Versión actual</p>
                <pre className="whitespace-pre-wrap font-sans text-sm">{cuerpo}</pre>
              </div>
            </TabsContent>

            <TabsContent value="historial" className="mt-4 rounded-xl border bg-card shadow-panel">
              <ul className="divide-y text-sm">
                {mensaje.historial.map((h, i) => (
                  <li key={i} className="flex flex-wrap gap-2 px-4 py-3">
                    <span className="text-muted-foreground">{h.fecha.slice(0, 16).replace("T", " ")}</span>
                    <span className="font-medium">{h.usuario}</span>
                    <span>{h.accion}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-panel">
            <p className="text-sm font-semibold">Cliente</p>
            <div className="mt-2 grid gap-2">
              <Dato k="Razón social" v={cliente.razonSocial} />
              <Dato k="Contacto" v={`${cliente.persona} · ${cliente.cargo}`} />
              <Dato k="Sector / ciudad" v={`${cliente.sector} · ${cliente.ciudad}`} />
              <Dato k="Responsable" v={cliente.responsable} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-panel">
            <p className="text-sm font-semibold">Consentimiento y base jurídica</p>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>Email</span><StatusBadge value={cliente.consentimiento.email} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>WhatsApp</span><StatusBadge value={cliente.consentimiento.whatsapp} />
              </div>
              <Dato k="Fuente" v={cliente.fuenteConsentimiento} />
              <Dato k="Fecha" v={cliente.fechaConsentimiento?.slice(0, 10) ?? "—"} />
              <Dato k="Base jurídica" v={cliente.baseJuridica} />
              <Dato k="Origen del dato" v={cliente.origenDato} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-panel">
            <p className="text-sm font-semibold">Riesgos detectados</p>
            {mensaje.riesgos.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
                {mensaje.riesgos.map((r) => <li key={r}>{r}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Sin riesgos bloqueantes detectados.</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">{mensaje.motivoPersonalizacion}</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
