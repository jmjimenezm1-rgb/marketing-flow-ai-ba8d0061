import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  LayoutDashboard,
  Megaphone,
  Sparkles,
  ClipboardCheck,
  Users,
  Package,
  Send,
  Inbox,
  ShieldCheck,
  BarChart3,
  Settings,
  Search,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

const groups = [
  { title: "Marketing Flow", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/campanas", label: "Campañas", icon: Megaphone },
    { to: "/generador", label: "Generador IA", icon: Sparkles },
    { to: "/revision", label: "Revisión de mensajes", icon: ClipboardCheck },
    { to: "/clientes", label: "Clientes y leads", icon: Users },
    { to: "/productos", label: "Productos", icon: Package },
  ] },
  { title: "Marketing Catalyst", items: [
    { to: "/marketing/catalyst", label: "Operación", icon: BarChart3 },
    { to: "/marketing/catalyst/clientes", label: "Clientes", icon: Users },
    { to: "/marketing/catalyst/productos", label: "Productos", icon: Package },
    { to: "/marketing/catalyst/campanas", label: "Campañas", icon: Megaphone },
    { to: "/marketing/secuencias", label: "Secuencias", icon: Settings },
    { to: "/marketing/envios", label: "Envíos", icon: Send },
    { to: "/marketing/bandeja-entrada", label: "Bandeja de entrada", icon: Inbox },
    { to: "/marketing/bandeja-salida", label: "Bandeja de salida", icon: Inbox },
    { to: "/marketing/consentimientos", label: "Consentimientos", icon: ShieldCheck },
    { to: "/marketing/auditoria", label: "Auditoría", icon: ClipboardCheck },
  ] },
] as const;

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {groups.map((g) => (
        <div key={g.title} className="mb-4">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/50">{g.title}</p>
          {g.items.map((item) => {
            const active = item.to === "/" ? pathname === "/" : item.to === "/marketing/catalyst" ? pathname === "/marketing/catalyst" || pathname === "/marketing/catalyst/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} onClick={onNavigate}
                className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
                <Icon className="size-4" />{item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
  pageHeading = false,
}: {
  pageHeading?: boolean;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const { usuarioActual, fuente } = useStore();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <div className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold leading-tight">MarketingHub AI</p>
            <p className="text-[11px] text-sidebar-foreground/60">Campañas con cumplimiento</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="border-t border-sidebar-border px-5 py-4 text-xs">
          <p className="font-medium">{usuarioActual.nombre}</p>
          <p className="text-sidebar-foreground/60">{usuarioActual.rol}</p>
          <p className="mt-2 text-[11px] text-sidebar-foreground/50">
            Datos: {fuente === "supabase" ? "Supabase externo" : fuente === "local" ? "demo local" : "cargando…"}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-card/85 px-4 py-3 backdrop-blur md:px-8">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Volver"
            onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/" }))}
            className="grid size-9 shrink-0 place-items-center rounded-md border bg-background text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Sheet open={menu} onOpenChange={setMenu}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Abrir menú" className="md:hidden"><Menu className="size-4" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto bg-sidebar p-3 pt-10 text-sidebar-foreground">
              <SheetTitle className="px-3 pb-3 text-sm">MarketingHub AI</SheetTitle>
              <NavLinks pathname={pathname} onNavigate={() => setMenu(false)} />
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            {pageHeading ? <p className="truncate text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</p> : <h1 className="truncate text-lg font-semibold md:text-xl">{title}</h1>}
            {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <div className="hidden items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground lg:flex">
            <Search className="size-4" />
            <span>Buscador global</span>
          </div>
          {actions}
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
