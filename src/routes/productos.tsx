import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Plus, Pencil, ExternalLink, Megaphone, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { ProductEditor } from "@/components/ProductEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import type { Producto } from "@/lib/mock-data";

export const Route = createFileRoute("/productos")({
  head: () => ({ meta: [
    { title: "Productos — MarketingHub AI" },
    { name: "description", content: "Catálogo comercial con beneficios, objeciones y campañas asociadas a cada producto." },
    { property: "og:title", content: "Productos — MarketingHub AI" },
    { property: "og:description", content: "Gestiona la información comercial de tus productos y sus campañas." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Productos,
});

function Productos() {
  const { productos, campanas, fuente } = useStore();
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("todos");
  const [editor, setEditor] = useState<{ producto: Producto | null } | null>(null);
  const lista = productos.filter((p) => (estado === "todos" || p.estado === estado) && `${p.nombre} ${p.descripcionCorta} ${p.publicoObjetivo}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <AppShell title="Productos" subtitle={`${lista.length} de ${productos.length} productos`} actions={<Button onClick={() => setEditor({ producto: null })} disabled={fuente === "cargando"}><Plus />Nuevo producto</Button>}>
      {fuente === "local" && <p role="status" className="mb-4 border-l-2 border-warning bg-warning/10 px-3 py-2 text-sm text-foreground">La base externa no está disponible. Los productos se guardan solo en este navegador.</p>}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-md"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Buscar productos" className="bg-card pl-9" placeholder="Buscar productos…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <Select value={estado} onValueChange={setEstado}><SelectTrigger aria-label="Filtrar por estado" className="w-44 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos los estados</SelectItem><SelectItem value="activo">Activo</SelectItem><SelectItem value="pausado">Pausado</SelectItem><SelectItem value="retirado">Retirado</SelectItem></SelectContent></Select>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {lista.map((p) => {
          const asociadas = campanas.filter((c) => c.productoId === p.id);
          const safeUrl = /^https?:\/\//i.test(p.landing) ? p.landing : null;
          return <article key={p.id} className="flex min-w-0 flex-col rounded-lg border bg-card p-5 shadow-panel">
            <div className="flex items-start gap-3"><Package className="mt-1 size-5 shrink-0 text-primary" /><h2 className="min-w-0 flex-1 break-words text-base font-semibold">{p.nombre}</h2><Button variant="ghost" size="icon" aria-label={`Editar ${p.nombre}`} title="Editar producto" className="shrink-0" onClick={() => setEditor({ producto: p })}><Pencil /></Button></div>
            <div className="mt-2"><StatusBadge value={p.estado} /></div>
            <p className="mt-3 text-sm text-muted-foreground">{p.descripcionCorta}</p>
            <p className="mt-3 text-xs font-medium text-muted-foreground">Público objetivo</p><p className="mt-1 text-sm">{p.publicoObjetivo || "—"}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><h3 className="text-xs font-semibold text-success">Beneficios</h3><ul className="mt-2 list-inside list-disc space-y-1 break-words text-sm">{p.beneficios.map((x, i) => <li key={i}>{x}</li>)}</ul></div><div><h3 className="text-xs font-semibold text-muted-foreground">Objeciones</h3><ul className="mt-2 list-inside list-disc space-y-1 break-words text-sm text-muted-foreground">{p.objeciones.map((x, i) => <li key={i}>{x}</li>)}</ul></div></div>
            <div className="mt-5 border-t pt-3"><h3 className="flex items-center gap-2 text-xs font-medium"><Megaphone className="size-4" />Campañas ({asociadas.length})</h3><ul className="mt-2 space-y-1">{asociadas.map((c) => <li key={c.id}><Link to="/campanas/$id" params={{ id: c.id }} className="break-words text-sm text-primary hover:underline">{c.nombre}</Link></li>)}</ul></div>
            {safeUrl && <Button asChild variant="link" className="mt-auto justify-start px-0 pt-4"><a href={safeUrl} target="_blank" rel="noopener noreferrer"><ExternalLink />Página del producto</a></Button>}
          </article>;
        })}
      </div>
      {lista.length === 0 && <div className="py-16 text-center text-muted-foreground"><Package className="mx-auto mb-3 size-8" /><p>No hay productos con esos filtros.</p><Button variant="link" onClick={() => { setQuery(""); setEstado("todos"); }}>Restablecer filtros</Button></div>}
      {editor && <ProductEditor producto={editor.producto} onClose={() => setEditor(null)} />}
    </AppShell>
  );
}