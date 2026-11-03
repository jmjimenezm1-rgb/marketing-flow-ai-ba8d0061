import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/bandeja-salida")({
  beforeLoad: () => { throw redirect({ to: "/marketing/bandeja-salida", replace: true }); },
});
