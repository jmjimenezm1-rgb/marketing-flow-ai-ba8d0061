import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Producto } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export function ProductEditor({ producto, onClose }: { producto: Producto | null; onClose: () => void }) {
  const { saveProducto, fuente } = useStore();
  const [draft, setDraft] = useState<Producto>(producto ?? {
    id: "", nombre: "", descripcionCorta: "", publicoObjetivo: "", beneficios: [], objeciones: [], landing: "", estado: "activo",
  });
  const [beneficios, setBeneficios] = useState(draft.beneficios.join("\n"));
  const [objeciones, setObjeciones] = useState(draft.objeciones.join("\n"));
  const [saving, setSaving] = useState(false);
  const field = (key: keyof Producto, value: string) => setDraft((prev) => ({ ...prev, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveProducto({
        ...draft, id: draft.id || crypto.randomUUID(), nombre: draft.nombre.trim(),
        beneficios: beneficios.split("\n").map((x) => x.trim()).filter(Boolean),
        objeciones: objeciones.split("\n").map((x) => x.trim()).filter(Boolean),
      });
      toast.success(fuente === "supabase" ? "Producto guardado" : "Producto guardado en este navegador");
      onClose();
    } catch {
      toast.error("No se pudo guardar el producto. Inténtalo de nuevo.");
    } finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent aria-describedby={undefined} className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{producto ? "Editar producto" : "Nuevo producto"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="space-y-1.5"><Label htmlFor="product-name">Nombre</Label><Input id="product-name" required value={draft.nombre} onChange={(e) => field("nombre", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="product-description">Descripción</Label><Textarea id="product-description" required value={draft.descripcionCorta} onChange={(e) => field("descripcionCorta", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="product-audience">Público objetivo</Label><Input id="product-audience" value={draft.publicoObjetivo} onChange={(e) => field("publicoObjetivo", e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="product-benefits">Beneficios (uno por línea)</Label><Textarea id="product-benefits" rows={4} value={beneficios} onChange={(e) => setBeneficios(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="product-objections">Objeciones (una por línea)</Label><Textarea id="product-objections" rows={4} value={objeciones} onChange={(e) => setObjeciones(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="product-url">Página del producto</Label><Input id="product-url" type="url" placeholder="https://" value={draft.landing} onChange={(e) => field("landing", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="product-state">Estado</Label><Select value={draft.estado} onValueChange={(value) => field("estado", value)}><SelectTrigger id="product-state"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="activo">Activo</SelectItem><SelectItem value="pausado">Pausado</SelectItem><SelectItem value="retirado">Retirado</SelectItem></SelectContent></Select></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={saving || fuente === "cargando" || !draft.nombre.trim()}><Save />{saving ? "Guardando…" : "Guardar producto"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}