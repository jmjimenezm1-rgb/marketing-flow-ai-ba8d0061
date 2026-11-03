import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/marketing/revision")({
  beforeLoad: () => { throw redirect({ to: "/revision", replace: true }); },
});
