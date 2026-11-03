import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/marketing/generador")({
  beforeLoad: () => { throw redirect({ to: "/generador", replace: true }); },
});
