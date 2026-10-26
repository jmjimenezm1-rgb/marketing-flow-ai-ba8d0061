import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes y leads — MarketingHub AI" },
      { name: "description", content: "Contactos con su consentimiento por canal, base jurídica y bajas registradas." },
      { property: "og:title", content: "Clientes y leads — MarketingHub AI" },
      { property: "og:description", content: "Trazabilidad legal de cada contacto antes de cualquier envío comercial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const { clientes } = useStore();
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [consent, setConsent] = useState("todos");

  const lista = useMemo(
    () =>
      clientes.filter((c) => {
        const txt = `${c.razonSocial} ${c.persona} ${c.email} ${c.ciudad}`.toLowerCase();
        return (
          (q === "" || txt.includes(q.toLowerCase())) &&
          (tipo === "todos" || (tipo === "lead" ? c.esLead : !c.esLead)) &&
          (consent === "todos" || c.consentimiento.email === consent || c.consentimiento.whatsapp === consent)
        );
      }),
    [clientes, q, tipo, consent],
  );

  return (
    <AppShell title="Clientes y leads" subtitle={`${lista.length} de ${clientes.length} contactos`}>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar por nombre, email o ciudad…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full max-w-xs bg-card" />
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="cliente">Clientes</SelectItem>
            <SelectItem value="lead">Leads</SelectItem>
          </SelectContent>
        </Select>
        <Select value={consent} onValueChange={setConsent}>
          <SelectTrigger className="w-52 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Cualquier consentimiento</SelectItem>
            <SelectItem value="valido">Válido</SelectItem>
            <SelectItem value="interes_legitimo">Interés legítimo</SelectItem>
            <SelectItem value="ausente">Ausente</SelectItem>
            <SelectItem value="revocado">Revocado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {lista.map((c) => (
          <Link key={c.id} to="/clientes/$id" params={{ id: c.id }} className="rounded-xl border bg-card p-4 shadow-panel">
            <p className="font-medium">{c.razonSocial}</p>
            <p className="text-xs text-muted-foreground">{c.persona} · {c.ciudad}</p>
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              <span>Email</span><StatusBadge value={c.consentimiento.email} />
              <span>WhatsApp</span><StatusBadge value={c.consentimiento.whatsapp} />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-xl border bg-card shadow-panel md:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Segmento</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Base jurídica</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lista.map((c) => (
              <tr key={c.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link to="/clientes/$id" params={{ id: c.id }} className="font-medium hover:underline">{c.razonSocial}</Link>
                  <p className="text-xs text-muted-foreground">{c.persona} · {c.ciudad}</p>
                </td>
                <td className="px-4 py-3">{c.esLead ? "Lead" : "Cliente"}</td>
                <td className="px-4 py-3">{c.segmento}</td>
                <td className="px-4 py-3"><StatusBadge value={c.consentimiento.email} /></td>
                <td className="px-4 py-3"><StatusBadge value={c.consentimiento.whatsapp} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.baseJuridica}</td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Sin contactos con esos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
