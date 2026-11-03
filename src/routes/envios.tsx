import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/envios")({
  beforeLoad: () => { throw redirect({ to: "/marketing/envios", replace: true }); },
});
