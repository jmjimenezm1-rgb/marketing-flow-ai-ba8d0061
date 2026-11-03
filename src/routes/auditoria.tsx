import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auditoria")({
  beforeLoad: () => { throw redirect({ to: "/marketing/auditoria", replace: true }); },
});
