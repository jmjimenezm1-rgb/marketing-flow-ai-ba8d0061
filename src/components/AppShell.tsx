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
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, activo: true },
  { to: "/campanas", label: "Campañas", icon: Megaphone, activo: true },
  { to: "/generador", label: "Generador IA", icon: Sparkles, activo: true },
  { to: "/revision", label: "Revisión de mensajes", icon: ClipboardCheck, activo: true },
  { to: "/", label: "Clientes", icon: Users, activo: false },
  { to: "/", label: "Productos", icon: Package, activo: false },
  { to: "/", label: "Envíos", icon: Send, activo: false },
  { to: "/", label: "Bandejas", icon: Inbox, activo: false },
  { to: "/", label: "Cumplimiento", icon: ShieldCheck, activo: false },
  { to: "/", label: "Analítica", icon: BarChart3, activo: false },
  { to: "/", label: "Configuración", icon: Settings, activo: false },
];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
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
          {nav.map((item, i) => {
            const active = item.activo && (item.to === "/" ? pathname === "/" : pathname.startsWith(item.to));
            const Icon = item.icon;
            if (!item.activo) {
              return (
                <div
                  key={`${item.label}-${i}`}
                  className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/35"
                  title="Módulo ya construido: se integrará más adelante"
                >
                  <Icon className="size-4" />
                  {item.label}
                  <span className="ml-auto text-[10px] uppercase tracking-wide">próx.</span>
                </div>
              );
            }
            return (
              <Link
                key={`${item.label}-${i}`}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
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
          <button
            type="button"
            aria-label="Volver"
            onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/" }))}
            className="grid size-9 shrink-0 place-items-center rounded-md border bg-background text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold md:text-xl">{title}</h1>
            {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <div className="hidden items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground lg:flex">
            <Search className="size-4" />
            <span>Buscador global</span>
          </div>
          {actions}
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
