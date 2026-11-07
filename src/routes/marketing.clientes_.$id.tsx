import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/marketing/clientes_/$id")({
  beforeLoad: ({ params }) => { throw redirect({ to: "/clientes/$id", params: { id: params.id }, replace: true }); },
});
