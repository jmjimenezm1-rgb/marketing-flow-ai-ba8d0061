import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, LayoutGrid, Table2 } from "lucide-react";
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
import type { EstadoCampana } from "@/lib/mock-data";

export const Route = createFileRoute("/campanas/")({
  head: () => ({
    meta: [
      { title: "Campañas — MarketingHub AI" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "description",
        content: "Gestiona campañas comerciales por email y WhatsApp con reglas de consentimiento y validación legal.",
      },
      { property: "og:title", content: "Campañas — MarketingHub AI" },
      { property: "og:description", content: "Campañas multicanal con validación legal y secuencias evolutivas." },
    ],
  }),
  component: CampanasPage,
});

const ESTADOS: EstadoCampana[] = [
  "borrador",
  "pendiente_revision",
  "aprobada",
  "programada",
  "activa",
  "pausada",
  "finalizada",
  "cancelada",
];

const KANBAN: EstadoCampana[] = ["borrador", "pendiente_revision", "aprobada", "programada", "activa", "finalizada"];

function CampanasPage() {
  const { campanas, productos, mensajes } = useStore();
  const [vista, setVista] = useState<"tabla" | "kanban">("tabla");
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");
  const [canal, setCanal] = useState("todos");
  const [producto, setProducto] = useState("todos");

  const filtradas = useMemo(
    () =>
      campanas.filter(
        (c) =>
          (estado === "todos" || c.estado === estado) &&
          (canal === "todos" || c.canalPrincipal === canal) &&
          (producto === "todos" || c.productoId === producto) &&
          (q === "" || c.nombre.toLowerCase().includes(q.toLowerCase())),
      ),
    [campanas, estado, canal, producto, q],
  );

  const nombreProducto = (id: string) => productos.find((p) => p.id === id)?.nombre ?? "—";

  return (
    <AppShell
      title="Campañas"
      subtitle="Módulo 5 · Gestión de campañas multicanal"
      actions={
        <Button asChild>
          <Link to="/campanas/nueva">
            <Plus className="size-4" /> Nueva campaña
          </Link>
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar campaña…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-xs bg-card"
        />
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-44 bg-card">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>
                {etiquetas[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={canal} onValueChange={setCanal}>
          <SelectTrigger className="w-36 bg-card">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los canales</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="mixto">Mixto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={producto} onValueChange={setProducto}>
          <SelectTrigger className="w-56 bg-card">
            <SelectValue placeholder="Producto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los productos</SelectItem>
            {productos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex rounded-md border bg-card p-0.5">
          <Button size="sm" variant={vista === "tabla" ? "secondary" : "ghost"} onClick={() => setVista("tabla")}>
            <Table2 className="size-4" /> Tabla
          </Button>
          <Button size="sm" variant={vista === "kanban" ? "secondary" : "ghost"} onClick={() => setVista("kanban")}>
            <LayoutGrid className="size-4" /> Kanban
          </Button>
        </div>
      </div>

      {vista === "tabla" ? (
        <div className="mt-4 overflow-x-auto rounded-xl border bg-card shadow-panel">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Campaña</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Destinatarios</th>
                <th className="px-4 py-3">Mensajes</th>
                <th className="px-4 py-3">Validación legal</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtradas.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link to="/campanas/$id" params={{ id: c.id }} className="font-medium hover:underline">
                      {c.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.responsable}</p>
                  </td>
                  <td className="px-4 py-3">{nombreProducto(c.productoId)}</td>
                  <td className="px-4 py-3 capitalize">{c.tipo}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={c.canalPrincipal} />
                  </td>
                  <td className="px-4 py-3">{c.destinatarios.length}</td>
                  <td className="px-4 py-3">{mensajes.filter((m) => m.campanaId === c.id).length}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={c.validacionLegal} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={c.estado} />
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No hay campañas con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {KANBAN.map((col) => (
            <div key={col} className="rounded-xl border bg-muted/30 p-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {etiquetas[col]}
              </p>
              <div className="space-y-2">
                {filtradas
                  .filter((c) => c.estado === col)
                  .map((c) => (
                    <Link
                      key={c.id}
                      to="/campanas/$id"
                      params={{ id: c.id }}
                      className="block rounded-lg border bg-card p-3 shadow-sm hover:border-primary/50"
                    >
                      <p className="text-sm font-medium leading-snug">{c.nombre}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{nombreProducto(c.productoId)}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <StatusBadge value={c.canalPrincipal} />
                        <StatusBadge value={c.validacionLegal} />
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
