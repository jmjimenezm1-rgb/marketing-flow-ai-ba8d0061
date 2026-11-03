import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/secuencias")({
  beforeLoad: () => { throw redirect({ to: "/marketing/secuencias", replace: true }); },
});
