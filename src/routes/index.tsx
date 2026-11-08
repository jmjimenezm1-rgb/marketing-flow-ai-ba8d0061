import { createFileRoute, Link } from "@tanstack/react-router";
import { Megaphone, Sparkles, ClipboardCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { useMarketingDomain } from "@/marketing/domain/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MarketingHub AI — Campañas, IA y revisión con cumplimiento" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "description",
        content:
          "Gestiona campañas multicanal por email y WhatsApp, genera mensajes con IA y revísalos cliente a cliente antes de enviar.",
      },
      { property: "og:title", content: "MarketingHub AI — Campañas con cumplimiento" },
      {
        property: "og:description",
        content: "Campañas, generación de mensajes con IA y revisión humana previa al envío.",
      },
    ],
  }),
  component: Index,
});

const etiquetaProcedencia: Record<string, string> = {
  flow: "Flow",
  catalyst: "Catalyst",
  consolidado: "Consolidado temporal",
};

function Kpi({ label, value, hint, procedencia }: { label: string; value: number | string; hint?: string; procedencia?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-panel">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      {procedencia ? <p className="mt-1 text-[11px] text-muted-foreground/70">Fuente: {etiquetaProcedencia[procedencia] ?? procedencia}</p> : null}
    </div>
  );
}

function Index() {
  const { campanas, mensajes, clientes } = useStore();
  const { indicadores } = useMarketingDomain();
  const ind = (clave: string) => indicadores.find((i) => i.clave === clave);
  const pendientes = ind("mensajes_pendientes")?.valor ?? 0;
  const bloqueados = ind("mensajes_bloqueados")?.valor ?? 0;
  const sinConsent = ind("sin_consentimiento")?.valor ?? 0;

  const modulos = [
    {
      to: "/campanas",
      icon: Megaphone,
      titulo: "Campañas",
      texto: "Crea campañas, define segmentos, secuencias evolutivas y reglas de cumplimiento.",
    },
    {
      to: "/generador",
      icon: Sparkles,
      titulo: "Generador de mensajes con IA",
      texto: "Genera mensajes genéricos o personalizados por cliente, canal y tono, con variantes A/B.",
    },
    {
      to: "/revision",
      icon: ClipboardCheck,
      titulo: "Revisión por cliente",
      texto: "Bandeja de revisión humana previa al envío: aprobar, editar, regenerar o excluir.",
    },
  ] as const;

  return (
    <AppShell
      title="Dashboard"
      subtitle="Vista general de campañas, generación y revisión (datos ficticios de demostración)"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Campañas activas" value={ind("campanas_activas")?.valor ?? 0} procedencia={ind("campanas_activas")?.procedencia} />
        <Kpi label="Campañas programadas" value={ind("campanas_programadas")?.valor ?? 0} procedencia={ind("campanas_programadas")?.procedencia} />
        <Kpi label="Mensajes pendientes de revisión" value={pendientes} hint="Requieren revisión humana" procedencia={ind("mensajes_pendientes")?.procedencia} />
        <Kpi label="Mensajes bloqueados" value={bloqueados} hint="Sin base jurídica válida" procedencia={ind("mensajes_bloqueados")?.procedencia} />
        <Kpi label="Envíos pendientes" value={ind("envios_pendientes")?.valor ?? 0} procedencia={ind("envios_pendientes")?.procedencia} />
        <Kpi label="Envíos realizados" value={ind("envios_realizados")?.valor ?? 0} procedencia={ind("envios_realizados")?.procedencia} />
        <Kpi label="Respuestas pendientes" value={ind("respuestas_pendientes")?.valor ?? 0} procedencia={ind("respuestas_pendientes")?.procedencia} />
        <Kpi label="Contactos dados de baja" value={ind("bajas")?.valor ?? 0} procedencia={ind("bajas")?.procedencia} />
      </div>

      {(bloqueados > 0 || sinConsent > 0) && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <ShieldAlert className="mt-0.5 size-5 text-destructive" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Alertas de cumplimiento</p>
            <p className="text-muted-foreground">
              {bloqueados} mensajes bloqueados por consentimiento no válido o baja registrada ·{" "}
              {sinConsent} contactos sin consentimiento de email marketing. No se permite el envío comercial
              sin base jurídica válida.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {modulos.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group rounded-xl border bg-card p-5 shadow-panel transition-colors hover:border-primary/50"
          >
            <m.icon className="size-6 text-primary" />
            <p className="mt-3 font-display font-semibold">{m.titulo}</p>
            <p className="mt-1 text-sm text-muted-foreground">{m.texto}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Abrir <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-xl border bg-card shadow-panel">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Campañas recientes</h2>
        </div>
        <ul className="divide-y">
          {campanas.slice(0, 5).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <Link to="/campanas/$id" params={{ id: c.id }} className="flex-1 font-medium hover:underline">
                {c.nombre}
              </Link>
              <StatusBadge value={c.canalPrincipal} />
              <StatusBadge value={c.estado} />
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
