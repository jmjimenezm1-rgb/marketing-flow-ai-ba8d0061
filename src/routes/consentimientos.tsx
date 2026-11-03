import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/consentimientos")({
  beforeLoad: () => { throw redirect({ to: "/marketing/consentimientos", replace: true }); },
});
