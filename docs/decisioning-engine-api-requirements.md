# Decisioning Engine — Backend API Requirements

**Status:** Draft for engineering review
**Scope:** The live Decisioning Engine flow only — `/decisioning-engine`, the setup board at `/decisioning-engine/preview`, the objective creation wizard at `/decisioning-engine/objective/v2`, and the performance page at `/decisioning-engine/objective/performance`.
**Out of scope:** the orphaned `/decisioning-engine/setup` and `/decisioning-engine/configuration` routes (nothing in the app navigates to them; they edit the same three configs) and the ignored v1 flow at `/decisioning-engine/objective/new`.

> **Fidelity note.** The frontend today is a self-contained prototype: all state lives in one in-memory React Context (`src/contexts/DecisioningSetupContext.tsx`), every async step is faked with `setTimeout`, and there is **no API layer, persistence, or failure path**. `@tanstack/react-query` is instantiated in `src/App.tsx` but never used.
>
> This spec is **faithful to the prototype**. Contracts mirror what the UI actually captures and commits. Endpoints that exist only to replace a client-side `setTimeout` simulation are labelled **[Simulated today]**. Anything the UI does not do yet (partial-progress persistence, failure/retry, concurrency control, auth) is labelled **[Required addition]** and never presented as existing behavior. Everything else is grounded in a cited source file.

**Conventions**

- Base path: `/api/v1`. Resource roots: `/decisioning/setup`, `/decisioning/objectives`, `/decisioning/opportunities`, `/decisioning/reference/*`.
- All bodies are JSON (`Content-Type: application/json`) except document upload (multipart).
- All timestamps are ISO-8601 UTC. All IDs are opaque strings.
- Enum values are quoted verbatim from the code; where the UI stores a human label as the value (e.g. goal `"Repeat purchase"`) the spec keeps that label and recommends a machine key as a **[Required addition]**.
- `{tenantId}`/workspace scoping and auth headers are assumed (see §9) — not present in the FE.

---

## 1. Frontend flow summary

The end-to-end journey is two chained phases sharing one status enum (`SetupStatus`): engine onboarding, then repeated objective creation.

### Phase A — Engine onboarding

Driven entirely by `status` in `DecisioningEngine.tsx` (`not_started`/`configuring` → empty state; `processing` → progress; `ready` → objectives board).

1. Entry `/decisioning-engine`. First run shows `DecisioningEmptyState`; "GET STARTED" (or "Resume setup" when `status === "configuring"`) → `/decisioning-engine/preview`.
2. `/decisioning-engine/preview` renders `DecisioningBoard` — three config cards, each opening a right-hand side panel from `ConfigPanels.tsx`:
   - **Brand wiki** → `saveBrandWiki`
   - **Event definitions** → `saveEventMapping`
   - **Guardrails** → `saveGuardrails`
   Progress = `configuredCount` of 3. When `allConfigured` (all three saved), a **Launch** button calls `startProcessing()` and navigates to `/decisioning-engine`.
3. `status = processing` → `DecisioningProcessingState`: a timed progress bar (`PROCESSING_DURATION_MS = 10_000` ms wall-clock; copy says "≈ 4 hours") stepping through three phases, then `markReady()` → `status = ready`.
4. `status = ready` → `DecisioningReadyState`: two tabs — **Objectives** (`ObjectiveCard` list, or empty state) and **Opportunities** (ranked `OpportunityCard` insights). CTAs: "Create objective" → `/objective/v2`; "Edit configuration" → `/preview`.

### Phase B — Objective creation (`ObjectiveCreationFlowV2.tsx`)

A single-page accordion wizard, four steps: `goal → audience → content → preview`.

- **Goal** — goal/intent (select), horizon (select), value per conversion (numeric), and an "Arbitrate against my other objectives" toggle.
- **Audience** — a ~5 s AI-"generating" state, then four persona cards (each a toggle + sub-cohorts + reachable count) and an "exclude list/segment" toggle.
- **Content** (`ContentMapping.tsx`) — a ~4 s "generating" state, then audience → channel → template mapping with per-sub-cohort template overrides.
- **Preview** (`ObjectiveJourneyPreview.tsx`) — read-only recap tree; each node jumps back to its step.

Terminal actions: **Launch objective** → full-screen loader (~11.76 s) → `launchObjective(...)` adds a live objective, navigates to `/decisioning-engine`, shows a success toast. **Finish later** → `saveDraftObjective(...)` (summary card only). Post-launch, an `ObjectiveCard` "View live performance" → `/objective/performance` (`DecisioningPerformance`).

### Surface classification

| Surface | Read-only | Editable | Progressive | Locked | Completed marker | Depends on |
|---|---|---|---|---|---|---|
| Empty state | ✓ | — | — | — | — | `status` |
| Setup board (3 config cards) | — | ✓ | ✓ (3 dots) | — | green tick per configured card | — |
| Launch gate (board) | — | trigger | — | disabled until `allConfigured` | — | all 3 configs |
| Processing screen | ✓ | — | ✓ (3 phases) | — | phase checks | `processingStartedAt` |
| Ready board — Objectives tab | ✓ (list) | card actions | — | — | — | `status = ready` |
| Ready board — Opportunities tab | ✓ | seeds objective | — | — | — | `status = ready` |
| Objective: Goal step | — | ✓ | ✓ | **not truly gated** (see note) | check when intent+horizon+value set | — |
| Objective: Audience step | mostly ✓ | toggles | ✓ | — | check when ≥1 persona on | goal (input to generation) |
| Objective: Content step | — | template picks | ✓ | — | check when ≥1 asset | audience personas |
| Objective: Preview step | ✓ | edit links | ✓ | — | never (launch button) | all prior steps |
| Performance page | ✓ | — | — | — | — | a launched objective |

> **Progressive-gating reality (`ObjectiveCreationFlowV2.tsx`).** Despite "guided/gated" wording in comments, the accordion is **not locked** — `toggleStep` opens any card. Three independent pieces of state drive visuals only: `activeStep` (open card), `furthestIndex` (furthest reached; progress-bar width), and `completedSteps: Set<StepId>` (cards the user tapped "Done" on). A step renders "complete" only when `completedSteps.has(id) && isStepComplete(id)`.

---

## 2. API inventory

Every endpoint traces to a Context mutator or a navigational CTA in the live path. Standard headers on all calls: `Authorization: Bearer <jwt>` and `X-Tenant-Id` (both **[Required addition]** — §9); mutations echo/accept `X-Correlation-Id`.

### 2.1 Reference data (read-only lookups)

| # | Name | Method | Path | Purpose | Source |
|---|---|---|---|---|---|
| R1 | List standard events | GET | `/decisioning/reference/events` | The 6 canonical events the engine understands | `STANDARD_EVENTS` |
| R2 | List detected events | GET | `/decisioning/reference/detected-events` | Events detected from the brand's stream, for mapping dropdowns | `DETECTED_EVENTS` **[Simulated today]** |
| R3 | Brand-wiki questionnaire | GET | `/decisioning/reference/brand-wiki-questions` | Grouped question definitions | `brand-wiki-questions.ts` |
| R4 | List content templates | GET | `/decisioning/reference/templates` | The template registry for the content gallery | `emailTemplates.ts` |
| R5 | List channels | GET | `/decisioning/reference/channels` | `email/sms/push/webpush` + defaults | `contentMappingRules.ts` |

**R1 — GET `/decisioning/reference/events`**
Response `200`: `{ "events": [{ "id": "page_view", "label": "Page view" }, ...] }` (6 items).
No params. Auth: any authenticated user. Cacheable (`ETag`/`Cache-Control`).

**R2 — GET `/decisioning/reference/detected-events`** *(returns events discovered in the tenant's event stream; simulated client-side today as a fixed list)*
Response `200`: `{ "detectedEvents": [{ "id": "add_to_bag", "label": "add_to_bag" }, ...] }`.

**R4 — GET `/decisioning/reference/templates`**
Response `200`: `{ "templates": [{ "id": "912", "name": "Women's Day Special", "type": "Marketing", "previewUrl": "https://.../index.html" }, ...] }`.
Filtering: `?channel=email` (optional) to return only the channel's pool.

### 2.2 Engine setup

| # | Name | Method | Path | Purpose | Mutator |
|---|---|---|---|---|---|
| S1 | Get setup state | GET | `/decisioning/setup` | Full onboarding state + derived flags | `status`, `configuredCount`, `allConfigured` |
| S2 | Save brand wiki | PUT | `/decisioning/setup/brand-wiki` | Upsert brand-wiki config | `saveBrandWiki` |
| S3 | Upload brand documents | POST | `/decisioning/setup/brand-wiki/documents` | Attach brand docs (multipart) | local (upload) **[Simulated today]** |
| S4 | Import brand from website | POST | `/decisioning/setup/brand-wiki/import` | Fetch brand details from a URL | local **[Simulated today]** |
| S5 | Save event mapping | PUT | `/decisioning/setup/event-mapping` | Upsert event mapping | `saveEventMapping` |
| S6 | Save guardrails | PUT | `/decisioning/setup/guardrails` | Upsert guardrails | `saveGuardrails` |
| S7 | Start processing | POST | `/decisioning/setup:process` | Kick off engine preparation | `startProcessing` |
| S8 | Get processing status | GET | `/decisioning/setup/status` | Poll preparation progress | `markReady` (poll target) |
| S9 | Retry processing | POST | `/decisioning/setup:retry` | Re-run after a failure | **[Required addition]** |
| S10 | Cancel processing | POST | `/decisioning/setup:cancel` | Abort a running preparation | **[Required addition]** |

**S1 — GET `/decisioning/setup`**
Response `200`:
```json
{
  "status": "configuring",
  "configuredCount": 2,
  "allConfigured": false,
  "version": 4,
  "brandWiki": { "...": "..." },
  "eventMapping": { "...": "..." },
  "guardrails": null,
  "processing": { "startedAt": null, "progress": 0, "phase": null, "estimatedCompletionAt": null }
}
```
`status` ∈ `not_started | configuring | processing | ready | failed`* (*`failed` is a **[Required addition]**). Auth: engine viewer. `configuredCount`/`allConfigured` are derived server-side from which of the three configs are non-null.

**S2 — PUT `/decisioning/setup/brand-wiki`**
Request body: the `BrandWiki` model (§3). Validation: at least one of `files`, `brandName`/`brandVoice`/`audience`, or a non-empty `answers` value must be present (mirrors FE `isValid`). Idempotent upsert. Side effect: if `status === "not_started"`, transitions to `configuring`. Requires `If-Match: <version>` (§7). Responses: `200` (updated resource incl. new `version`), `400` validation, `409` version conflict, `403`, `422` semantic.

**S3 — POST `/decisioning/setup/brand-wiki/documents`** *(multipart; simulated today)*
`multipart/form-data` with one or more `file` parts. Accept: `.pdf,.doc,.docx,.csv,.txt,.md,.xlsx` (from `accept` attr). Per-file size limit **[Required addition]** — suggest 25 MB. Response `201`: `{ "files": [{ "id": "doc_1", "name": "brand.pdf", "size": 20480, "status": "stored" }] }`. Dedup by name (FE drops same-name dupes). Errors: `413` too large, `415` unsupported type.

**S5 — PUT `/decisioning/setup/event-mapping`**
Request body: `EventMapping` (§3). Validation (mirrors FE): `mappings.add_to_cart !== "none"` **and** `mappings.purchase !== "none"` are mandatory; other standard events may be `"none"`. Custom-event rows with a blank `label` are dropped server-side (FE behavior). Same version/idempotency rules as S2.

**S6 — PUT `/decisioning/setup/guardrails`**
Request body: `Guardrails` (§3). Validation (mirrors FE clamps): `frequencyCapPerWeek` ∈ [1,14]; `holdoutPercent` ∈ [0,20]; `quietHoursStart`/`End` are `HH:mm`. Values out of range are rejected `400` (FE silently clamps; server should reject or clamp — see §12).

**S7 — POST `/decisioning/setup:process`**
Precondition: `allConfigured === true` (else `409 SETUP_INCOMPLETE`). Transitions `status → processing`, sets `startedAt`. **Idempotent** via `Idempotency-Key` header: a repeat with the same key while already processing returns the in-flight job, not a new one. Response `202`: `{ "status": "processing", "startedAt": "...", "estimatedCompletionAt": "..." }`.

**S8 — GET `/decisioning/setup/status`** *(poll target; replaces the elapsed-time simulation)*
Response `200`:
```json
{
  "status": "processing",
  "progress": 0.42,
  "phase": "Connecting customer signals",
  "phases": [
    { "label": "Understanding your brand", "state": "done" },
    { "label": "Connecting customer signals", "state": "loading" },
    { "label": "Preparing decision intelligence", "state": "pending" }
  ],
  "estimatedCompletionAt": "2026-07-23T14:00:00Z",
  "error": null
}
```
`progress` ∈ [0,1]. Phase labels are verbatim from `DecisioningProcessingState.tsx`. On completion `status = ready`. On failure `status = failed`, `error = { errorCode, message, retryable }` **[Required addition]**. Suggested poll interval `5s`; supports `Retry-After`. Webhook alternative in §8.

### 2.3 Objectives

| # | Name | Method | Path | Purpose | Mutator |
|---|---|---|---|---|---|
| O1 | List objectives | GET | `/decisioning/objectives` | Objectives-tab cards | `objectives` |
| O2 | Create/launch objective | POST | `/decisioning/objectives` | Launch a live objective | `launchObjective` |
| O3 | Save draft | POST | `/decisioning/objectives` (`status: "draft"`) | Finish later | `saveDraftObjective` |
| O4 | Get objective | GET | `/decisioning/objectives/{id}` | Detail / resume / performance header | `location.state.objective` |
| O5 | Update objective | PATCH | `/decisioning/objectives/{id}` | Edit fields / pause / resume | `pause/resumeObjective` |
| O6 | Duplicate | POST | `/decisioning/objectives/{id}:duplicate` | Copy | `duplicateObjective` |
| O7 | Archive | POST | `/decisioning/objectives/{id}:archive` | Archive | `archiveObjective` |
| O8 | Delete | DELETE | `/decisioning/objectives/{id}` | Delete | `deleteObjective` |
| O9 | Generate audience | POST | `/decisioning/objectives/audience:generate` | AI audience personas | **[Simulated today]** |
| O10 | Generate content mapping | POST | `/decisioning/objectives/content:generate` | AI template mapping | **[Simulated today]** |
| O11 | Validate objective | POST | `/decisioning/objectives/{id}:validate` | Pre-launch field validation | **[Required addition]** |
| O12 | Get performance | GET | `/decisioning/objectives/{id}/performance` | Metrics + charts | **[Simulated today]** |

**O1 — GET `/decisioning/objectives`**
Query params: `status` (repeatable filter: `live|paused|draft|archived`), `q` (title search), `sort` (`createdAt|title|revenue`, default `-createdAt` — FE prepends newest), `limit` (default 20, max 100), `cursor`.
Response `200`: `{ "objectives": [Objective, ...], "nextCursor": "..." }`. The FE renders newest-first; cursor pagination recommended even though the prototype holds all in memory.

**O2 — POST `/decisioning/objectives`** (launch)
Request body — **faithful to what `finishLaunch` sends**:
```json
{
  "title": "Win the second purchase",
  "description": "Monitoring one-time buyers and triggering re-engagement across selected channels.",
  "goal": "Repeat purchase",
  "channels": "Email, App push, SMS, Web Push",
  "status": "live"
}
```
> The wizard also captures `horizon`, `conversionValue`, `arbitration`, per-persona `personaEnabled`, `excludeList`, and the full `contentAssignments` slot map, **but does not send them at launch today**. They belong in the persisted model (§3) and are listed in §12 as a gap; a real launch endpoint should accept them. See the **extended body** in §11.
Validation: `title` non-empty; `goal` ∈ goal enum. Idempotent via `Idempotency-Key` (prevents duplicate submission from the double-click/animation window). Responses: `201` (created `Objective` with `id`, `createdAt`), `400`, `409` duplicate, `422`.

**O3 — POST `/decisioning/objectives`** with `status: "draft"`
Faithful body: `{ "title": "Untitled objective", "description": "Draft — Repeat purchase objective, setup in progress.", "status": "draft" }`. Draft goal/channels/revenue are blank (card shows "—"). Response `201`.

**O5 — PATCH `/decisioning/objectives/{id}`**
Partial update. Pause/resume map to `{ "status": "paused" }` / `{ "status": "live" }`. `If-Match` required. Allowed transitions enforced (§4). Responses `200`, `409` (illegal transition or version conflict).

**O9 — POST `/decisioning/objectives/audience:generate`** *(replaces the 5 s `AudienceGeneratingState`)*
Request: `{ "goal": "Repeat purchase", "horizon": "90 days", "conversionValue": "40" }`.
Response `200` (or `202` + poll if long-running): `{ "personas": [AudiencePersona, ...] }` — see §3. Each persona carries `reachableRate`; `reachable` may be returned pre-derived. Deterministic per (goal, horizon) recommended.

**O10 — POST `/decisioning/objectives/content:generate`** *(replaces the 4 s content generation)*
Request: `{ "audiences": [{ "id": "high-intent", "subCohorts": ["male","repeat"] }], "channels": ["email","sms","push","webpush"] }`.
Response `200`: `{ "assignments": { "high-intent::email::parent": "912", ... } }` — recommended template per slot, following the override→pool→default precedence (§3). The FE lifts these into `contentAssignments`.

**O11 — POST `/decisioning/objectives/{id}:validate`** *(explicit "Next step enabled?" backing — Required addition)*
Runs the per-step completeness rules server-side and returns field-level results without mutating. Response `200`:
```json
{
  "valid": false,
  "steps": {
    "goal": { "complete": true, "errors": [] },
    "audience": { "complete": false, "errors": [{ "field": "personaEnabled", "errorCode": "AUDIENCE_EMPTY", "message": "Turn on at least one audience." }] },
    "content": { "complete": true, "errors": [] }
  }
}
```

**O12 — GET `/decisioning/objectives/{id}/performance`** *(all values hardcoded in `DecisioningPerformance.tsx` today)*
Response `200`: stat tiles (`revenue`, `conversions`, `conversionRate`, `contactsReached`, `messagesSent`, `upliftVsHoldout`), `revenueTrend[]` (day/revenue/conversions), `channelPerformance[]`, `actionMix[]`, `funnel[]`, `wentLiveOn`. Query: `?range=14d`. Shapes match the recharts data arrays in the file.

### 2.4 Opportunities

**Op1 — GET `/decisioning/opportunities`** *(the `OPPORTUNITIES` const)*
Response `200`: `{ "opportunities": [Opportunity, ...] }`, ranked. Each seeds an objective (`recommendedObjective` prefills the wizard's `objectiveName` via router state). Fields: `title`, `audience`, `reach`, `value`, `channels`, `confidence` (`high|medium|low`), `recommendedObjective`, `detail`. Read-only.

---

## 3. Data models

Types are lifted verbatim from `DecisioningSetupContext.tsx`, `contentMappingRules.ts`, `emailTemplates.ts`, and `ObjectiveCreationFlowV2.tsx`. Fields marked **[+]** are captured in the UI but not yet persisted at the API boundary (see §12).

### 3.1 Objective

| Field | Type | Req | Allowed / range | Default | Description | Example |
|---|---|---|---|---|---|---|
| `id` | string | server | — | server-gen | Opaque id (`obj-<seq>-<ts>` in FE) | `"obj-3-1721736000000"` |
| `title` | string | ✓ | 1–120 chars | `"Untitled objective"` (draft) | Objective name; seeded from opportunity or default `"Win the second purchase"` | `"Win the second purchase"` |
| `description` | string | ✓ | ≤ 280 chars | hardcoded | Card description | `"Monitoring one-time buyers…"` |
| `status` | enum | ✓ | `live \| paused \| draft` (`archived` **[+]**) | `live` (launch) / `draft` | Lifecycle | `"live"` |
| `goal` | string(enum) | ✓ (launch) | `Repeat purchase \| Acquisition \| Reactivation \| Premium grow` | `""` (draft) | Optimization intent | `"Repeat purchase"` |
| `channels` | string | ✓ (launch) | CSV of channel names | `""` (draft) | Channels summary shown on card | `"Email, App push, SMS, Web Push"` |
| `revenue` | string | server | currency string | `""` (draft) | Attributed revenue (computed post-launch) | `"$3130"` |
| `horizon` **[+]** | string(enum) | ✓ | `45 days \| 60 days \| 90 days \| 120 days` | — | Optimization time horizon | `"90 days"` |
| `conversionValue` **[+]** | string/number | ✓ | numeric, relative | — | Value per conversion (FE numeric text) | `"40"` |
| `arbitration` **[+]** | boolean | ✓ | true/false | `true` | Arbitrate one best action per person across objectives | `true` |
| `audience` **[+]** | AudienceSelection | ✓ | see §3.3 | — | Enabled personas + excludes | — |
| `contentAssignments` **[+]** | map | ✓ | slotKey → templateId | `{}` | Per audience/channel/scope template map | see §3.5 |
| `createdAt` | timestamp | server | ISO-8601 | server | — | `"2026-07-23T…Z"` |
| `version` | integer | server | ≥1 | `1` | Optimistic-lock version | `1` |

### 3.2 Goal (embedded in Objective)

`goal` (enum above), `horizon` (enum above), `conversionValue` (numeric; FE has no min/max/regex — free numeric text with `inputMode="numeric"`), `arbitration` (bool, default `true`). Completeness rule (FE `isStepComplete`): `Boolean(goal && horizon && conversionValue)`; `arbitration` is **not** part of completeness.

### 3.3 AudienceSelection / AudiencePersona / SubCohort

`AudienceSelection`: `{ personaEnabled: Record<personaId, boolean> (all default true), excludeList: boolean (default false) }`. Completeness (FE): total selected contacts > 0, i.e. ≥1 persona enabled.

`AudiencePersona` (from `audiencePersonaDefs`):

| Field | Type | Allowed / example | Description |
|---|---|---|---|
| `id` | string | `high-intent`, `price-sensitive`, `loyal-repeat`, `at-risk` | Persona key |
| `name` | string | `"High-intent buyers"` | Display name |
| `description` | string | — | Persona description |
| `reachableRate` | number | `0.83`–`0.95` | Deliverable fraction |
| `subCohorts` | SubCohort[] | 2 per persona | Slices of the persona |
| `selected` | integer (derived) | Σ sub-cohort counts | Selected audience size |
| `reachable` | integer (derived) | `round(selected × reachableRate / 10) × 10` | Reachable contacts |

`SubCohort`: `{ id, label, count }` (e.g. `{ "id": "new-contacts", "label": "New contacts", "count": 9240 }`). The four personas and their sub-cohort counts (verbatim): high-intent (New contacts 9240 / Past buyers 6130, rate 0.92); price-sensitive (Discount seekers 5820 / Cart abandoners 3410, rate 0.88); loyal-repeat (Frequent buyers 4150 / Subscription members 2600, rate 0.95); at-risk (Lapsed 30–60 7480 / Lapsed 60–90 4220, rate 0.83).

### 3.4 Channel / Template

`Channel`: `{ id: "email"|"sms"|"push"|"webpush", name }`. Channel defaults (`CHANNEL_DEFAULT`): email→`912`, sms→`742`, push→`915`, webpush→`603`. Pools (`CHANNEL_POOL`) and email rotation (`EMAIL_ROTATION`) as in `contentMappingRules.ts`.

`Template` (`emailTemplates.ts`, 8 items): `{ id, name, type: "Marketing"|"Transactional", previewUrl }`. IDs/names: 912 Women's Day Special, 868 New Year Party, 664 Valentine's Day, 337 Holiday Decor Sale, 774 Christmas Collections, 742 Loan Application Update (Transactional), 915 Awareness Campaign, 603 Monthly Newsletter.

### 3.5 ContentAssignment

A map keyed by `slotKey = "${audienceId}::${channelId}::${scope}"` where `scope` is `"parent"` or a sub-cohort id, valued by `templateId`. Resolution precedence (server should mirror `resolveAssignedOrRecommended`): explicit assignment (`isOverride: true`) → channel/audience pool recommendation by scope index → `CHANNEL_DEFAULT[channel]`. Example: `{ "high-intent::email::parent": "912", "high-intent::email::male": "664" }`.

### 3.6 BrandWiki

| Field | Type | Req | Default | Description | Example |
|---|---|---|---|---|---|
| `files` | `{name,size}[]` | opt | `[]` | Uploaded brand docs | `[{ "name": "brand.pdf", "size": 20480 }]` |
| `brandName` | string | opt | `""` | Brand name | `"Northwind"` |
| `brandVoice` | string | opt | `""` | Tone of voice | `"Warm, confident, never pushy"` |
| `audience` | string | opt | `""` | Who you sell to | `"Urban millennials…"` |
| `website` | string | opt | — | URL brand details were imported from | `"https://…"` |
| `answers` | `Record<string,string>` | opt | `{}` | Questionnaire answers keyed by question id | `{ "q_tone": "…" }` |

Config-level validity (FE): at least one of files / any quick field / any answer present.

### 3.7 EventMapping

`mappings: Record<standardEventId, detectedEventId | "none">` + optional `customEvents: {id,label,mappedTo}[]`. Standard event ids: `page_view, product_view, add_to_cart, checkout_started, purchase, search`. Detected ids: `screen_open, item_viewed, add_to_bag, begin_checkout, order_success, search_query`. Defaults map each 1:1 (`DEFAULT_EVENT_MAPPINGS`). Validity: `add_to_cart` and `purchase` must be mapped (≠ `"none"`).

### 3.8 Guardrails

| Field | Type | Req | Range | Default | Example |
|---|---|---|---|---|---|
| `requireConsent` | boolean | ✓ | — | `true` | `true` |
| `frequencyCapPerWeek` | integer | ✓ | 1–14 | `3` | `3` |
| `quietHoursStart` | string `HH:mm` | ✓ | — | `"22:00"` | `"22:00"` |
| `quietHoursEnd` | string `HH:mm` | ✓ | — | `"07:00"` | `"07:00"` |
| `holdoutPercent` | integer | ✓ | 0–20 | `5` | `5` |

### 3.9 Derived / meta

`configuredCount` (0–3, count of non-null configs), `allConfigured` (`=== 3`), `SetupStatus` (`not_started|configuring|processing|ready`; `failed` **[+]**), processing `{ progress, phase, estimatedCompletionAt }`. Draft/completion/validation state per §5.

---

## 4. State management & transitions

### 4.1 Engine setup (`SetupStatus`)

| From | Event / API | To | Notes |
|---|---|---|---|
| `not_started` | first config saved (S2/S5/S6) | `configuring` | FE sets this on first `save*` while `not_started` |
| `configuring` | more configs saved | `configuring` | until `allConfigured` |
| `configuring` | `POST :process` (S7), requires `allConfigured` | `processing` | sets `startedAt` |
| `processing` | status poll reaches `progress=1` (S8) | `ready` | maps to `markReady()` |
| `processing` | job error **[+]** | `failed` | not representable in FE today |
| `failed` | `POST :retry` (S9) **[+]** | `processing` | — |
| `processing` | `POST :cancel` (S10) **[+]** | `configuring` | — |
| any | `resetSetup` (dev) | `not_started` | demo escape hatch |

### 4.2 Objective (`ObjectiveStatus`)

| From | Event / API | To |
|---|---|---|
| — | `POST /objectives` (launch, O2) | `live` |
| — | `POST /objectives` (draft, O3) | `draft` |
| `draft` | resume + launch | `live` |
| `live` | PATCH `status=paused` (O5) | `paused` |
| `paused` | PATCH `status=live` (O5) | `live` |
| `live`/`paused`/`draft` | `POST :archive` (O7) | `archived` **[+]** |
| any | `DELETE` (O8) | (removed) |

### 4.3 Objective-creation lifecycle

Draft creation → step completion (per-step `isStepComplete`) → **auto-save / manual save [Required addition]** (FE keeps step data in local state only) → resume → validation (O11) → submission (O2) → processing (launch overlay ~11.76 s; no server work today) → success (toast + card). **Failure / retry / edit-after-complete are Required additions** — the prototype models only the happy path (no `SUCCESS`/`FAILED` for objective launch).

---

## 5. Progressive step behavior

The backend needs to back the wizard even though today it is local-state only.

- **Unlocking / locking next step:** the accordion is not hard-locked in the FE; enablement is visual. Recommended contract: `O11 :validate` returns per-step `complete` flags; the client enables "Next"/shows checks from those.
- **Persisting partial progress [Required addition]:** add a draft resource that stores the wizard's working fields (goal/horizon/value/arbitration, `personaEnabled`, `excludeList`, `contentAssignments`, `furthestStep`). PATCH `/objectives/{id}` with partial body on each step "Done" (manual save) and/or debounced auto-save. Today "Finish later" persists only a summary card and discards in-progress data.
- **Field-level errors:** returned by O11 and by mutation `400`s in the §6 envelope, keyed by `field`.
- **"Next step" enabled:** driven by `isStepComplete` semantics — goal: `goal && horizon && conversionValue`; audience: ≥1 persona enabled; content: ≥1 template assigned; preview: always allows launch.
- **Finish later:** O3 (draft). With partial-progress persistence, drafts should round-trip the full working set so the wizard rehydrates.
- **Resume from last incomplete step:** persist `furthestStep`; on GET `/objectives/{id}` return it so the client reopens there.

---

## 6. Error handling

Canonical envelope on every non-2xx:
```json
{
  "error": {
    "errorCode": "EVENT_MAPPING_INCOMPLETE",
    "message": "Add to cart and Purchase must be mapped.",
    "field": "mappings.add_to_cart",
    "retryable": false,
    "correlationId": "b3f1c2a4-…"
  }
}
```
`field` is omitted for non-field errors; for multiple field errors return `error.details: [{field, errorCode, message}]`.

| Case | HTTP | errorCode | retryable | Example trigger |
|---|---|---|---|---|
| Invalid field value | 400 | `INVALID_FIELD` | false | `frequencyCapPerWeek = 99` |
| Missing mandatory field | 422 | `MISSING_REQUIRED` / `EVENT_MAPPING_INCOMPLETE` / `AUDIENCE_EMPTY` | false | no persona enabled; cart/purchase unmapped |
| Dependency failure | 424 | `DEPENDENCY_FAILED` | true | audience-generate needs saved goal |
| Conflict / stale update | 409 | `VERSION_CONFLICT` | false | `If-Match` mismatch |
| Permission error | 403 | `FORBIDDEN` | false | role lacks edit |
| Timeout | 504 | `UPSTREAM_TIMEOUT` | true | generation upstream slow |
| Engine-processing failure | 500/200(status) | `PROCESSING_FAILED` | true | preparation job error (S8) |
| Partial success | 207 | `PARTIAL_SUCCESS` | mixed | some brand docs stored, some rejected |
| Duplicate submission | 409 | `DUPLICATE_REQUEST` | false | repeated launch without new `Idempotency-Key` |
| Not found | 404 | `NOT_FOUND` | false | unknown objective id |
| Setup incomplete | 409 | `SETUP_INCOMPLETE` | false | `:process` before all 3 configs |

---

## 7. Concurrency & versioning

- **Multiple editors:** every mutable resource (setup configs, objective) carries an integer `version`. Reads return it (and an `ETag`).
- **Optimistic locking:** mutations require `If-Match: <version|etag>`; a mismatch returns `409 VERSION_CONFLICT` with the current server version so the client can refetch and merge. The FE state already carries `version: 1`.
- **Stale frontend data:** on `409`, the client should GET and re-render; O11 re-validation after refetch.
- **API versioning:** URL-based `/api/v1`. Additive changes are backward-compatible; breaking changes bump to `/v2`. Enum additions (e.g. new goal) must be tolerated by clients (unknown value → passthrough).
- **Backward compatibility:** never repurpose an existing enum value; deprecate via docs + `Sunset` header.

---

## 8. Asynchronous processing

Engine preparation (and, optionally, audience/content generation) is long-running.

- **Start:** `POST /decisioning/setup:process` → `202` with `startedAt`, `estimatedCompletionAt`. Idempotent via `Idempotency-Key`.
- **Progress (poll):** `GET /decisioning/setup/status` → `{ status, progress (0–1), phase, phases[], estimatedCompletionAt, error }`. Phase labels verbatim from `DecisioningProcessingState.tsx`. Honour `Retry-After`; suggested 5 s interval.
- **Progress (webhook alternative) [Required addition]:** tenant-registered callback `POST {callbackUrl}` with `{ event: "decisioning.processing.updated", status, progress, phase }` and a signed header; poll remains the fallback.
- **Status values:** `processing → ready` (success) or `processing → failed`.
- **Retry:** `POST :retry` from `failed` (S9). **Cancellation:** `POST :cancel` from `processing` (S10). **Failure recovery:** last good config is preserved; retry re-runs preparation without re-entering configs.
- **Estimated completion:** `estimatedCompletionAt` surfaced in copy ("≈ 4 hours"). The same envelope backs O9/O10 if they become async (`202` + a per-request status URL).

---

## 9. Security *(no auth exists in the FE — all Required additions)*

- **Authentication:** Bearer JWT (`Authorization` header). Reject unauthenticated with `401`.
- **RBAC:** roles `engine.viewer` (read), `engine.editor` (configs + objectives), `engine.admin` (start/cancel processing, delete). Enforce per endpoint; `403 FORBIDDEN` otherwise.
- **Tenant / workspace isolation:** every resource scoped by `X-Tenant-Id` derived from the token; cross-tenant access is `404` (not `403`, to avoid existence disclosure).
- **Sensitive data:** uploaded brand documents and consent/holdout settings — encrypt at rest, virus-scan uploads, signed time-limited URLs for `previewUrl`/document download.
- **Audit logs:** see §10.
- **Rate limiting:** per-tenant token bucket; stricter on upload (S3), generation (O9/O10), and `:process` (S7). Return `429` + `Retry-After`.
- **Input sanitization:** validate/escape all free-text (brandVoice, answers, title, custom event labels); reject oversized payloads; strip HTML from text fields.
- **API abuse protection:** idempotency keys on all creates; size caps on uploads; bound `answers`/`customEvents` counts.

---

## 10. Observability

- **Logging:** structured JSON per request — `tenantId`, `userId`, `route`, `status`, `latencyMs`, `correlationId`. No PII in log bodies.
- **Audit events:** `brand_wiki.saved`, `event_mapping.saved`, `guardrails.saved`, `setup.processing_started`, `setup.processing_ready`, `setup.processing_failed`, `objective.launched`, `objective.drafted`, `objective.paused/resumed/duplicated/archived/deleted`. Persisted with actor + before/after version.
- **Metrics:** setup completion rate (`configuredCount` distribution), processing duration & failure rate, objective launch count, generation latency (O9/O10), 4xx/5xx rates per route.
- **Tracing:** propagate `X-Correlation-Id`/W3C `traceparent` across setup → processing → generation calls.
- **Correlation IDs:** accepted from client, generated if absent, returned on every response and in the error envelope.
- **Business events to track:** objectives launched per tenant, opportunities → objective conversion, active vs paused objectives, revenue attributed (perf).

---

## 11. Example payloads

**Create objective — faithful (what the FE sends today)**
```http
POST /api/v1/decisioning/objectives
Idempotency-Key: 3d9b…  •  If-None: —
```
```json
{ "title": "Win the second purchase", "description": "Monitoring one-time buyers and triggering re-engagement across selected channels.", "goal": "Repeat purchase", "channels": "Email, App push, SMS, Web Push", "status": "live" }
```
`201`:
```json
{ "id": "obj-3-1721736000000", "title": "Win the second purchase", "description": "Monitoring one-time buyers…", "goal": "Repeat purchase", "channels": "Email, App push, SMS, Web Push", "status": "live", "revenue": "", "createdAt": "2026-07-23T09:44:00Z", "version": 1 }
```

**Create objective — extended (full captured state; recommended)**
```json
{
  "title": "Win the second purchase",
  "goal": "Repeat purchase",
  "horizon": "90 days",
  "conversionValue": "40",
  "arbitration": true,
  "audience": { "personaEnabled": { "high-intent": true, "price-sensitive": true, "loyal-repeat": false, "at-risk": true }, "excludeList": false },
  "contentAssignments": { "high-intent::email::parent": "912", "high-intent::email::male": "664", "high-intent::sms::parent": "742" },
  "status": "live"
}
```

**Fetch objective** — `GET /decisioning/objectives/obj-3-… → 200` returns the Objective (§3.1) incl. `furthestStep` for resume.

**Update goal** — `PATCH /decisioning/objectives/obj-3-…`  `If-Match: 1`
```json
{ "goal": "Reactivation", "horizon": "60 days", "conversionValue": "55" }
```
`200` → updated objective, `version: 2`.

**Update audience** — `PATCH …/obj-3-…`
```json
{ "audience": { "personaEnabled": { "high-intent": true, "at-risk": false }, "excludeList": true } }
```

**Update content** — `PATCH …/obj-3-…`
```json
{ "contentAssignments": { "high-intent::email::parent": "868" } }
```

**Save draft** — `POST /decisioning/objectives`
```json
{ "title": "Untitled objective", "description": "Draft — Repeat purchase objective, setup in progress.", "status": "draft" }
```

**Validate objective** — `POST /decisioning/objectives/obj-3-…:validate → 200`
```json
{ "valid": true, "steps": { "goal": { "complete": true, "errors": [] }, "audience": { "complete": true, "errors": [] }, "content": { "complete": true, "errors": [] } } }
```

**Submit / launch** — see "Create objective" above (`status: "live"`).

**Fetch processing status** — `GET /decisioning/setup/status → 200`
```json
{ "status": "processing", "progress": 0.66, "phase": "Preparing decision intelligence", "phases": [ { "label": "Understanding your brand", "state": "done" }, { "label": "Connecting customer signals", "state": "done" }, { "label": "Preparing decision intelligence", "state": "loading" } ], "estimatedCompletionAt": "2026-07-23T14:00:00Z", "error": null }
```

**Retry failed processing** — `POST /decisioning/setup:retry → 202`
```json
{ "status": "processing", "startedAt": "2026-07-23T10:05:00Z", "estimatedCompletionAt": "2026-07-23T14:05:00Z" }
```

**Save guardrails** — `PUT /decisioning/setup/guardrails`  `If-Match: 2`
```json
{ "requireConsent": true, "frequencyCapPerWeek": 3, "quietHoursStart": "22:00", "quietHoursEnd": "07:00", "holdoutPercent": 5 }
```

**Save event mapping** — `PUT /decisioning/setup/event-mapping`
```json
{ "mappings": { "page_view": "screen_open", "product_view": "item_viewed", "add_to_cart": "add_to_bag", "checkout_started": "begin_checkout", "purchase": "order_success", "search": "search_query" }, "customEvents": [] }
```

---

## 12. Open questions & assumptions

### Assumptions inferred from the frontend
1. Multi-tenant SaaS with per-workspace scoping; JWT bearer auth (no auth code in FE).
2. The three configs and each objective are independently versioned resources supporting optimistic locking.
3. `detectedEvents`, audience personas, content recommendations, opportunities, and performance metrics are **server-computed** — the FE hardcodes/simulates them.
4. Real processing is asynchronous and pollable; the "≈ 4 hours" copy is the true target (prototype runs 10 s).

### Persistence gaps (captured in UI, not sent today)
- `horizon`, `conversionValue`, `arbitration` (Goal step) — captured, not in launch payload.
- `personaEnabled`, `excludeList` (Audience) — captured, not sent.
- Full `contentAssignments` slot map (Content) — captured via `onAssignmentsChange`, not sent.
- "Finish later" persists a **summary card only**; in-progress step data is discarded (no resume-from-step).
- `goal`/`channels` are free strings (human labels) — recommend stable machine keys.

### Missing product decisions
- Failure UX for engine processing and objective launch (no `failed`/retry state exists).
- Whether guardrail out-of-range values should be rejected (`400`) or silently clamped (FE clamps).
- Whether audience/content generation is synchronous (`200`) or async (`202` + poll).
- Cancellation semantics for in-flight preparation; edit-after-launch rules (which fields are mutable on a `live` objective).
- Whether drafts and full working state should be one resource or two (summary vs. working set).
- Archive vs. delete retention policy.

### Engineering dependencies
- Identity/tenant service for auth + `X-Tenant-Id`.
- Document storage + virus scanning + signed URLs for brand docs (S3) and template previews.
- Event catalog / CDP integration to produce `detectedEvents` and audience personas.
- The decisioning/ML engine for processing, audience generation, content recommendation, and performance attribution.
- Template service (the FE "Create template" opens an external editor `https://uce-email.lovable.app/`) — needs a real templates API behind R4.

### Questions to resolve before implementation
1. Do launch bodies persist the full captured state (extended body) or stay minimal? (Recommend extended.)
2. Machine keys for `goal`/`horizon`/`channels` vs. display labels?
3. Poll vs. webhook (or both) for processing progress?
4. Are personas/sub-cohorts a fixed catalog or generated per objective? (FE hardcodes 4.)
5. Is `arbitration` cross-objective logic in scope for v1?
6. Retention/soft-delete semantics for archived and deleted objectives.
