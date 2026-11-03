import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/marketing/productos")({
  beforeLoad: () => { throw redirect({ to: "/productos", replace: true }); },
});
