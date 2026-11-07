import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/marketing/campanas_/$id")({
  beforeLoad: ({ params }) => { throw redirect({ to: "/campanas/$id", params: { id: params.id }, replace: true }); },
});
