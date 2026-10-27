import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { Canal, EstadoConsentimiento } from "@/lib/mock-data";

export const Route = createFileRoute("/clientes/$id")({
  head: () => ({
    meta: [
      { title: "Ficha de contacto — MarketingHub AI" },
      { name: "description", content: "Consentimientos por canal, bajas y mensajes recibidos por el contacto." },
      { property: "og:title", content: "Ficha de contacto — MarketingHub AI" },
      { property: "og:description", content: "Gestión del consentimiento y trazabilidad legal del contacto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClienteDetalle,
});

const CANALES: Canal[] = ["email", "whatsapp"];

function ClienteDetalle() {
  const { id } = Route.useParams();
  const { clientes, mensajes, campanas, updateCliente } = useStore();
  const c = clientes.find((x) => x.id === id);

  if (!c) {
    return (
      <AppShell title="Contacto no encontrado">
        <Link to="/clientes" className="text-primary hover:underline">Volver a clientes</Link>
      </AppShell>
    );
  }

  const suyos = mensajes.filter((m) => m.clienteId === c.id);

  const cambiar = (canal: Canal, estado: EstadoConsentimiento) => {
    const hoy = new Date().toISOString().slice(0, 10);
    const baja = estado === "revocado"
      ? Array.from(new Set([...c.bajaCanal, canal]))
      : c.bajaCanal.filter((b) => b !== canal);
    updateCliente(
      c.id,
      {
        consentimiento: { ...c.consentimiento, [canal]: estado },
        bajaCanal: baja,
        fechaConsentimiento: estado === "valido" ? hoy : c.fechaConsentimiento,
        fuenteConsentimiento: estado === "valido" ? "Registro manual en MarketingHub" : c.fuenteConsentimiento,
      },
      `consentimiento_${canal}_${estado}`,
    );
    toast.success(estado === "revocado" ? `Baja registrada en ${canal}` : `Consentimiento de ${canal} actualizado`);
  };

  const campo = (k: string, v: string | null) => (
    <div><dt className="text-xs text-muted-foreground">{k}</dt><dd className="text-sm">{v || "—"}</dd></div>
  );

  return (
    <AppShell title={c.razonSocial} subtitle={`${c.esLead ? "Lead" : "Cliente"} · ${c.segmento}`}>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border bg-card p-5 shadow-panel lg:col-span-2">
          <h2 className="text-sm font-semibold">Datos del contacto</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {campo("Persona", `${c.persona} (${c.cargo})`)}
            {campo("Email", c.email)}
            {campo("WhatsApp", c.whatsapp)}
            {campo("Ciudad", c.ciudad)}
            {campo("Sector", c.sector)}
            {campo("Responsable", c.responsable)}
            {campo("Origen del dato", c.origenDato)}
            {campo("Notas", c.notas)}
          </dl>
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-panel">
          <h2 className="text-sm font-semibold">Consentimiento y bajas</h2>
          <p className="mt-1 text-xs text-muted-foreground">Base jurídica: {c.baseJuridica}</p>
          <p className="text-xs text-muted-foreground">Fuente: {c.fuenteConsentimiento} · {c.fechaConsentimiento ?? "sin fecha"}</p>
          <div className="mt-4 space-y-4">
            {CANALES.map((canal) => (
              <div key={canal} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{canal}</span>
                  <StatusBadge value={c.consentimiento[canal]} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.consentimiento[canal] !== "valido" && (
                    <Button size="sm" variant="outline" onClick={() => cambiar(canal, "valido")}>Registrar consentimiento</Button>
                  )}
                  {c.consentimiento[canal] !== "revocado" && (
                    <Button size="sm" variant="destructive" onClick={() => cambiar(canal, "revocado")}>Registrar baja</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Solo registra consentimiento si el contacto lo ha dado de forma expresa y verificable.</p>
        </section>
      </div>

      <section className="mt-4 rounded-xl border bg-card shadow-panel">
        <h2 className="border-b px-5 py-3 text-sm font-semibold">Mensajes para este contacto ({suyos.length})</h2>
        <ul className="divide-y">
          {suyos.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm">
              <Link to="/revision/$id" params={{ id: m.id }} className="flex-1 hover:underline">
                {campanas.find((x) => x.id === m.campanaId)?.nombre ?? "Campaña"}
              </Link>
              <StatusBadge value={m.riesgoLegal} />
              <StatusBadge value={m.estado} />
            </li>
          ))}
          {suyos.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted-foreground">Sin mensajes todavía.</li>}
        </ul>
      </section>
    </AppShell>
  );
}
