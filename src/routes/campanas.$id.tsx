import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, ClipboardCheck, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, etiquetas } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { evaluarCumplimiento } from "@/lib/ai-mock";
import type { Canal } from "@/lib/mock-data";

export const Route = createFileRoute("/campanas/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de campaña — MarketingHub AI" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Ficha de campaña: destinatarios, secuencia evolutiva y cumplimiento." },
      { property: "og:title", content: "Detalle de campaña — MarketingHub AI" },
      { property: "og:description", content: "Destinatarios, secuencia de refuerzos y estado de validación legal." },
    ],
  }),
  component: DetalleCampana,
});

function Dato({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
      <p className="text-sm">{v || "—"}</p>
    </div>
  );
}

function DetalleCampana() {
  const { id } = Route.useParams();
  const { campanas, productos, clientes, mensajes, updateCampana } = useStore();
  const campana = campanas.find((c) => c.id === id);
  if (!campana) throw notFound();
  const producto = productos.find((p) => p.id === campana.productoId);
  const destinatarios = clientes.filter((c) => campana.destinatarios.includes(c.id));
  const msgs = mensajes.filter((m) => m.campanaId === campana.id);
  const canal: Canal = campana.canalPrincipal === "whatsapp" ? "whatsapp" : "email";
  const bloqueados = destinatarios.filter(
    (c) => evaluarCumplimiento(c, canal, campana).riesgoLegal === "bloqueante",
  ).length;

  const cambiarEstado = (estado: typeof campana.estado) => {
    if (
      (estado === "activa" || estado === "programada") &&
      campana.validacionLegal !== "aprobada"
    ) {
      toast.error("No se puede activar: la validación legal está pendiente.");
      return;
    }
    updateCampana(campana.id, { estado });
    toast.success(`Campaña ${etiquetas[estado]?.toLowerCase()}.`);
  };

  return (
    <AppShell
      title={campana.nombre}
      subtitle={`${producto?.nombre ?? ""} · Responsable: ${campana.responsable}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/campanas">
              <ArrowLeft className="size-4" /> Campañas
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/generador" search={{ campana: campana.id }}>
              <Sparkles className="size-4" /> Generar mensajes
            </Link>
          </Button>
          <Button asChild>
            <Link to="/revision" search={{ campana: campana.id }}>
              <ClipboardCheck className="size-4" /> Revisar mensajes
            </Link>
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge value={campana.estado} />
        <StatusBadge value={campana.canalPrincipal} />
        <StatusBadge value={campana.validacionLegal} label={`Validación legal: ${etiquetas[campana.validacionLegal]}`} />
        <div className="ml-auto flex flex-wrap gap-2">
          {campana.validacionLegal !== "aprobada" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                updateCampana(campana.id, { validacionLegal: "aprobada" });
                toast.success("Validación legal aprobada y registrada en auditoría.");
              }}
            >
              Aprobar validación legal
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => cambiarEstado("programada")}>Programar</Button>
          <Button size="sm" onClick={() => cambiarEstado("activa")}>Activar</Button>
          <Button size="sm" variant="outline" onClick={() => cambiarEstado("pausada")}>Pausar</Button>
        </div>
      </div>

      {bloqueados > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <ShieldAlert className="mt-0.5 size-5 text-destructive" />
          <p className="text-muted-foreground">
            <strong className="text-destructive">{bloqueados} destinatarios bloqueados</strong> por baja,
            oposición o falta de consentimiento válido en el canal. No se les enviará ningún mensaje comercial.
          </p>
        </div>
      )}

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="destinatarios">Destinatarios ({destinatarios.length})</TabsTrigger>
          <TabsTrigger value="secuencia">Secuencia ({campana.secuencia.length})</TabsTrigger>
          <TabsTrigger value="mensajes">Mensajes ({msgs.length})</TabsTrigger>
          <TabsTrigger value="cumplimiento">Cumplimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Dato k="Objetivo" v={campana.objetivo} />
          <Dato k="Tipo" v={campana.tipo} />
          <Dato k="Público objetivo" v={campana.publicoObjetivo} />
          <Dato k="Segmentos" v={campana.segmentos.join(", ")} />
          <Dato k="Fechas" v={`${campana.fechaInicio.slice(0, 10)} → ${campana.fechaFin ? campana.fechaFin.slice(0, 10) : "—"}`} />
          <Dato k="Presupuesto" v={`${campana.presupuesto} €`} />
          <Dato k="Métrica objetivo" v={campana.metricaObjetivo} />
          <div className="rounded-lg border bg-muted/40 px-3 py-2 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mensaje principal</p>
            <p className="text-sm">{campana.mensajePrincipal}</p>
          </div>
          <Dato k="Observaciones" v={campana.observaciones} />
        </TabsContent>

        <TabsContent value="destinatarios" className="mt-4 overflow-x-auto rounded-xl border bg-card shadow-panel">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Segmento</th>
                <th className="px-4 py-3">Consent. email</th>
                <th className="px-4 py-3">Consent. WhatsApp</th>
                <th className="px-4 py-3">Base jurídica</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {destinatarios.map((c) => {
                const ev = evaluarCumplimiento(c, canal, campana);
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.razonSocial}</p>
                      <p className="text-xs text-muted-foreground">{c.persona} · {c.cargo}</p>
                    </td>
                    <td className="px-4 py-3">{c.segmento}</td>
                    <td className="px-4 py-3"><StatusBadge value={c.consentimiento.email} /></td>
                    <td className="px-4 py-3"><StatusBadge value={c.consentimiento.whatsapp} /></td>
                    <td className="px-4 py-3 max-w-xs text-xs text-muted-foreground">{c.baseJuridica}</td>
                    <td className="px-4 py-3"><StatusBadge value={ev.riesgoLegal} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="secuencia" className="mt-4 space-y-3">
          {campana.secuencia.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-panel">
              <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {p.orden}
              </span>
              <div className="min-w-48 flex-1">
                <p className="font-medium">{p.nombre}</p>
                <p className="text-xs text-muted-foreground">{p.objetivo}</p>
              </div>
              <StatusBadge value={p.canal} />
              <span className="text-sm text-muted-foreground">Espera: {p.esperaDias} días</span>
              <span className="rounded-md bg-muted px-2 py-1 text-xs">{p.condicion}</span>
              {p.revisionRequerida && <StatusBadge value="pendiente_revision" label="Revisión humana requerida" />}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Los pasos sucesivos se adaptan según respuesta, no respuesta u objeción detectada, manteniendo
            trazabilidad completa. Cualquier solicitud de baja detiene la secuencia de inmediato.
          </p>
        </TabsContent>

        <TabsContent value="mensajes" className="mt-4 space-y-2">
          {msgs.map((m) => {
            const cli = clientes.find((c) => c.id === m.clienteId);
            return (
              <Link
                key={m.id}
                to="/revision/$id"
                params={{ id: m.id }}
                className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 text-sm shadow-panel hover:border-primary/50"
              >
                <span className="min-w-48 flex-1 font-medium">{cli?.razonSocial}</span>
                <StatusBadge value={m.canal} />
                <StatusBadge value={m.riesgoLegal} />
                <StatusBadge value={m.estado} />
              </Link>
            );
          })}
          {msgs.length === 0 && (
            <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
              Aún no hay mensajes generados para esta campaña.
            </p>
          )}
        </TabsContent>

        <TabsContent value="cumplimiento" className="mt-4 grid gap-3 sm:grid-cols-2">
          <Dato k="Requisito de consentimiento" v={etiquetas[campana.requisitoConsentimiento] ?? campana.requisitoConsentimiento.replaceAll("_", " ")} />
          <Dato k="Validación legal" v={etiquetas[campana.validacionLegal] ?? campana.validacionLegal} />
          <Dato k="Reglas de exclusión" v={campana.reglasExclusion} />
          <Dato k="Reglas de baja / opt-out" v={campana.reglasBaja} />
          <Dato k="Reglas de evolución" v={campana.reglasEvolucion} />
          <Dato k="Destinatarios bloqueados" v={bloqueados} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
