import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X, Sparkles, Scale, Send, Ban, Eye } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, etiquetas } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { puedeEnviar } from "@/lib/ai-mock";
import type { EstadoMensaje } from "@/lib/mock-data";

type Search = { campana?: string };

export const Route = createFileRoute("/revision/")({
  validateSearch: (search: Record<string, unknown>): Search =>
    typeof search["campana"] === "string" ? { campana: search["campana"] } : {},
  head: () => ({
    meta: [
      { title: "Revisión de mensajes — MarketingHub AI" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "description",
        content: "Bandeja de revisión humana: aprueba, edita o bloquea cada mensaje antes de enviarlo al cliente.",
      },
      { property: "og:title", content: "Revisión de mensajes — MarketingHub AI" },
      { property: "og:description", content: "Revisión previa por cliente con control de consentimiento y riesgo legal." },
    ],
  }),
  component: RevisionPage,
});

const ESTADOS: EstadoMensaje[] = [
  "borrador",
  "pendiente_revision",
  "aprobado",
  "rechazado",
  "revision_legal",
  "revision_comercial",
  "programado",
  "enviado",
  "excluido",
];

function RevisionPage() {
  const search = Route.useSearch();
  const { mensajes, clientes, campanas, productos, updateMensaje } = useStore();
  const [campanaId, setCampanaId] = useState(search.campana ?? "todas");
  const [estado, setEstado] = useState("todos");
  const [canal, setCanal] = useState("todos");
  const [riesgo, setRiesgo] = useState("todos");
  const [q, setQ] = useState("");

  const cliente = (id: string) => clientes.find((c) => c.id === id)!;

  const filtrados = useMemo(
    () =>
      mensajes.filter((m) => {
        const c = cliente(m.clienteId);
        return (
          (campanaId === "todas" || m.campanaId === campanaId) &&
          (estado === "todos" || m.estado === estado) &&
          (canal === "todos" || m.canal === canal) &&
          (riesgo === "todos" || m.riesgoLegal === riesgo) &&
          (q === "" || c.razonSocial.toLowerCase().includes(q.toLowerCase()))
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mensajes, campanaId, estado, canal, riesgo, q, clientes],
  );

  const accion = (id: string, nuevoEstado: EstadoMensaje, texto: string) => {
    updateMensaje(id, { estado: nuevoEstado }, texto);
    toast.success(texto);
  };

  const enviar = (id: string) => {
    const m = mensajes.find((x) => x.id === id)!;
    const camp = campanas.find((c) => c.id === m.campanaId)!;
    const res = puedeEnviar(cliente(m.clienteId), m.canal, camp, m);
    if (!res.permitido) {
      toast.error("Envío bloqueado por cumplimiento", { description: res.motivos.join(" · ") });
      return;
    }
    updateMensaje(id, { estado: "enviado" }, "Envío individual simulado (conector mock)");
    toast.success("Envío simulado registrado en auditoría.");
  };

  const pendientes = mensajes.filter((m) => m.estado === "pendiente_revision").length;

  return (
    <AppShell
      title="Revisión de mensajes por cliente"
      subtitle={`Módulo 7 · ${pendientes} mensajes pendientes de revisión humana`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Buscar cliente…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full max-w-xs bg-card" />
        <Select value={campanaId} onValueChange={setCampanaId}>
          <SelectTrigger className="w-64 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las campañas</SelectItem>
            {campanas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ESTADOS.map((e) => <SelectItem key={e} value={e}>{etiquetas[e]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={canal} onValueChange={setCanal}>
          <SelectTrigger className="w-36 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los canales</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riesgo} onValueChange={setRiesgo}>
          <SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo riesgo</SelectItem>
            {["bajo", "medio", "alto", "bloqueante"].map((r) => (
              <SelectItem key={r} value={r}>{etiquetas[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border bg-card shadow-panel">
        <table className="w-full min-w-[1320px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Campaña / Producto</th>
              <th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3">Mensaje</th>
              <th className="px-4 py-3">Consentimiento</th>
              <th className="px-4 py-3">Riesgo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Envío previsto</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtrados.map((m) => {
              const c = cliente(m.clienteId);
              const camp = campanas.find((x) => x.id === m.campanaId);
              const prod = productos.find((p) => p.id === m.productoId);
              return (
                <tr key={m.id} className="align-top hover:bg-muted/40">
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="font-medium">{c.razonSocial}</p>
                    <p className="text-xs text-muted-foreground">{c.persona} · {c.cargo}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <p>{camp?.nombre}</p>
                    <p className="text-xs text-muted-foreground">{prod?.nombre}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge value={m.canal} /></td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="line-clamp-2 text-xs text-muted-foreground">{m.cuerpo}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Personalización: {m.nivelPersonalizacion} · v{m.version}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge value={c.consentimiento[m.canal]} /></td>
                  <td className="px-4 py-3"><StatusBadge value={m.riesgoLegal} /></td>
                  <td className="px-4 py-3"><StatusBadge value={m.estado} /></td>
                  <td className="px-4 py-3 text-xs">{m.fechaPrevistaEnvio ? m.fechaPrevistaEnvio.slice(0, 10) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-nowrap justify-end gap-1">
                      <Button size="icon" variant="outline" asChild title="Ver detalle">
                        <Link to="/revision/$id" params={{ id: m.id }}><Eye className="size-4" /></Link>
                      </Button>
                      <Button size="icon" variant="outline" title="Aprobar" onClick={() => accion(m.id, "aprobado", "Mensaje aprobado")}>
                        <Check className="size-4" />
                      </Button>
                      <Button size="icon" variant="outline" title="Rechazar" onClick={() => accion(m.id, "rechazado", "Mensaje rechazado")}>
                        <X className="size-4" />
                      </Button>
                      <Button size="icon" variant="outline" title="Revisión legal" onClick={() => accion(m.id, "revision_legal", "Marcado para revisión legal")}>
                        <Scale className="size-4" />
                      </Button>
                      <Button size="icon" variant="outline" title="Regenerar con IA" asChild>
                        <Link to="/revision/$id" params={{ id: m.id }}><Sparkles className="size-4" /></Link>
                      </Button>
                      <Button size="icon" variant="outline" title="Excluir de la campaña" onClick={() => accion(m.id, "excluido", "Cliente excluido de la campaña")}>
                        <Ban className="size-4" />
                      </Button>
                      <Button size="icon" title="Enviar individualmente" onClick={() => enviar(m.id)}>
                        <Send className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  No hay mensajes con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
