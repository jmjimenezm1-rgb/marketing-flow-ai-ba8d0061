import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/marketing/revision_/$id")({
  beforeLoad: ({ params }) => { throw redirect({ to: "/revision/$id", params: { id: params.id }, replace: true }); },
});
