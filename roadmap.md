# MarketingHub AI

## Parallel fusion — mock-only phase
- [x] Inventory Marketing Flow and GitHub Marketing Catalyst, preserving every screen and behavior.
- [x] Present integration plan and resolve duplicate routes without substituting screens.
- [x] Integrate shared shell, temporary stores and screens.
- [ ] Campaign shortcuts filtered to the source campaign with return link.
- [x] Preserve consent, human review, legal blocking, and temporal audit with tests.
- [x] Verify both areas and integration flows on desktop, tablet, and mobile.
- Constraint: no tables, migrations, schema changes, secrets, real providers, or authentication in this phase.

- [x] Verify Clients and leads, including links to each contact's messages.
- [x] Add Products catalog with search, creation, editing, and campaign associations.
- [x] Verify browser-local product persistence and availability to campaigns and the generator.
- [x] Check navigation and content-page metadata.
- [ ] Verify external product persistence — deferred outside this phase: the fusion must use temporary data without external database dependencies.

## Corrección de integración (documento subido por Pepe)
- [ ] Capa de dominio común `src/marketing/domain/` (types, clients, products, campaigns, consent, sends, audit) + adaptadores `src/marketing/adapters/` (flow, catalyst, temporary-repository).
- [ ] Sustituir mapa fijo FLOW_TO_CATALYST por adaptador común (resolver ida/vuelta, validar existencia, relación para campañas nuevas sin IDs hardcodeados, estado claro si no hay relación).
- [ ] Sincronización temporal de campañas entre Flow y Catalyst durante la sesión.
- [ ] Clientes y productos comunes: tipo MarketingClient de dominio, adaptadores ida/vuelta, consentimiento reflejado entre módulos.
- [ ] Dashboard consolidado con indicadores de ambos módulos y etiqueta de procedencia (Flow / Catalyst / consolidado temporal).
- [ ] Auditoría común: contrato AuditEvent/AuditService, línea de tiempo unificada de ambos orígenes.
- [ ] Recorrido funcional completo campaña → mensajes → revisión → secuencia → envíos → respuestas → consentimiento → auditoría → volver, conservando el identificador.
- [ ] Persistencia temporal de sesión sin reseteos entre pantallas.
- [ ] Pruebas: campañas, sincronización, consentimiento, nuevas entidades, auditoría, responsive.
- Constraint: 0 tablas, 0 migraciones, 0 cambios de esquema, 0 secretos, 0 proveedores reales, sin eliminar pantallas ni romper rutas.

Deferred: authentication (not requested); Compliance module (next increment).