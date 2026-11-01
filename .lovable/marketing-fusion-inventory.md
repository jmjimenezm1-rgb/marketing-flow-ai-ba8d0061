# Parallel fusion inventory

## Sources
- Marketing Flow: current MarketingHub AI working tree.
- Marketing Catalyst: public GitHub repository `jmjimenezm1-rgb/marketing-catalyst`, main branch archive; safely inspected without executing source code. 101 files, approximately 603 KB expanded; credential-looking files excluded. No schema or record export detected by inspection. Source uses React, TypeScript, TanStack Start/Router, Tailwind and shadcn UI; target framework versions stay pinned.

## Route ownership
| Flow | Catalyst | Preservation decision |
|---|---|---|
| `/` dashboard | `/` operations dashboard | Keep both dashboards as distinct screens |
| `/clientes`, `/clientes/$id` | `/clientes` | Keep both lists and Flow contact detail |
| `/productos` with create/edit dialog | `/productos` operational product summaries | Keep both catalogs; do not substitute one for the other |
| `/campanas`, `/campanas/nueva`, `/campanas/$id` | `/campanas` approval workflow table | Keep both campaign screens and Flow creation/detail |
| `/generador` | no generator route | Preserve simulated Flow generator |
| `/revision`, `/revision/$id` | no standalone review route | Preserve Flow review; Catalyst draft review stays in output inbox |
| no equivalent standalone routes | `/secuencias`, `/envios`, `/bandeja-entrada`, `/bandeja-salida`, `/consentimientos`, `/auditoria` | Add all original Catalyst screens |

Catalyst sidebar currently labels some existing dashboard/client/product/campaign routes as pending; integration must expose those real screens. No independent Catalyst baja or response-generator route exists: those capabilities belong to consent and inbox screens.

## Shared and separate implementation
- Flow: `AppShell`, `StatusBadge`, `ProductEditor`; mock data, `ai-mock`, and its own StoreProvider. Forms, wizard, detail tabs, table/Kanban views and filters must remain intact.
- Catalyst: `AppSidebar`, `components/common` (PageHeader, KpiCard, Pill), its own StoreProvider, `data/mock`, `services/compliance`, `services/ia`. Preserve operational tables, dialogs and badges; replace only duplicate shell/navigation.
- Both use UI primitives under `components/ui`. Reuse target primitives when equivalent; keep Catalyst-specific variants or wrappers if visual fidelity requires them.
- Catalyst seeds and helpers currently mutate shared module arrays when consent/campaign state changes. Replace that dependency with a session-scoped repository to avoid stale guard reads and state leaking between SSR requests.
- Flow attempts external data reads and writes; this phase must disable that dependency through a mock adapter, not change the external schema or remove external integration code. Products currently have browser-local persistence; preserve it only as an existing explicitly labeled fallback, not a new persistence scheme.

## Rules to preserve
- Flow: channel consent, baja/revocation, campaign legal validation, review status, legal risk, opt-out text and message version/history.
- Catalyst send validation: campaign approved/programmed/active; message approved; consent valid for channel; no baja/revocation; enabled channel; opt-out mechanism; no high legal risk; daily send ceiling. Contact interval is currently a nonblocking warning, not a new blocking rule.
- Catalyst campaigns cannot progress to approval with unreviewed or high-risk messages. Consent/baja actions log events and baja cancels pending/programmed sends in affected channels.
- All providers and generators remain simulated. No authentication is added.

## Gaps requiring temporary contracts, not invented data
- Catalyst contacts lack distinct email/phone/WhatsApp, consent evidence and acquisition-purpose/date fields in their current type; common interface must keep these optional and preserve originals.
- Flow and Catalyst IDs are independent. Use explicit source-qualified identities and mapping, never join equal IDs or names automatically.
- Current audit entries are incomplete for requested before/after/context coverage. Add structured session audit records without discarding existing message/send histories or audit presentation.
- Preserve pending consent as a distinct domain state, not a boolean. Missing evidence stays missing; do not invent legal authorization.

## Verification scope
Compare original screen structures before/after, verify every route and navigation link, both session stores, campaign-to-message-to-sequence-to-send/reply links, legal blocking and audit behavior, then desktop/tablet/mobile layouts. Existing external storage remains outside this phase.