import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/marketing/campanas")({
  beforeLoad: () => { throw redirect({ to: "/campanas", replace: true }); },
});
