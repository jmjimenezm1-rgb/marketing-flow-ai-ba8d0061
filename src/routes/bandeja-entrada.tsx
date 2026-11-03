import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/bandeja-entrada")({
  beforeLoad: () => { throw redirect({ to: "/marketing/bandeja-entrada", replace: true }); },
});
