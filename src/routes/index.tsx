import { createFileRoute, Link } from "@tanstack/react-router";
import { Megaphone, Sparkles, ClipboardCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";

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

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-panel">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Index() {
  const { campanas, mensajes, clientes } = useStore();
  const pendientes = mensajes.filter((m) => m.estado === "pendiente_revision").length;
  const bloqueados = mensajes.filter((m) => m.riesgoLegal === "bloqueante").length;
  const sinConsent = clientes.filter((c) => c.consentimiento.email === "ausente").length;

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
        <Kpi label="Campañas activas" value={campanas.filter((c) => c.estado === "activa").length} />
        <Kpi label="Campañas programadas" value={campanas.filter((c) => c.estado === "programada").length} />
        <Kpi label="Mensajes pendientes de revisión" value={pendientes} hint="Requieren revisión humana" />
        <Kpi label="Mensajes bloqueados" value={bloqueados} hint="Sin base jurídica válida" />
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
