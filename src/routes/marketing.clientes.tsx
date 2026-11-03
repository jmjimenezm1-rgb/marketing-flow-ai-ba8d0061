import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/marketing/clientes")({
  beforeLoad: () => { throw redirect({ to: "/clientes", replace: true }); },
});
