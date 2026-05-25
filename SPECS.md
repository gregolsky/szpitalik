# Hospital Duty Planner — Specification

## Overview

A Progressive Web App (PWA) for scheduling hospital duty shifts (dyżury). Hosted on GitHub Pages with no backend — all compute and storage are client-side.

**Language conventions**: source code in English; UI labels and messages in Polish.

---

## Hosting & Technical Stack

| Concern          | Choice                                              |
|------------------|-----------------------------------------------------|
| Hosting          | GitHub Pages (static)                               |
| App type         | PWA — Service Worker + Web App Manifest             |
| Build tool       | Vite                                                |
| Framework        | React + TypeScript                                  |
| Testing          | Vitest + Testing Library                            |
| Heavy compute    | Web Worker (genetic algorithm)                      |
| Persistence      | IndexedDB (primary) + `localStorage` (metadata)     |
| Crypto           | Web Crypto API (AES-GCM / PBKDF2)                  |

---

## Feature Areas

### 1. Unit Setup

One-time configuration per medical unit (szpital / oddział / specjalizacja). Presented as a **wizard with tabs**. The same tabs serve as an **edit view** once setup is complete.

#### 1A — Unit Identity

- **name**: free-text string (e.g. `"OIOM Szpital Miejski"`, `"Oddział Anestezjologii"`)
- Displayed in the app header and on printed plans.

#### 1B — Piony (Wards)

A *ward* is a named duty position or role that must be filled on every duty day.

| Field    | Type   | Constraints                        |
|----------|--------|------------------------------------|
| `name`   | string | required, unique within unit       |
| `abbrev` | string | 2–4 uppercase letters, unique      |
| `emoji`  | string | single emoji character, optional   |

At least one ward must be defined. Display order is preserved and used in the schedule grid.

Examples: OIOM 🫁 · ANES 🩺 · POOP 🛏

#### 1C — Doctors

| Field       | Type         | Constraints       |
|-------------|--------------|-------------------|
| `firstName` | string       | required          |
| `lastName`  | string       | required, sort key|
| `type`      | `DoctorType` | required          |

`DoctorType` enum: `resident` | `senior_resident` | `specialist`

Default type emoji (display only, not configurable):
- `resident` → 🩺
- `senior_resident` → 🔬
- `specialist` → ⭐

#### 1D — Tags

A *tag* is a named set of allowed doctor types. Tags are defined at unit level and referenced by ward eligibility rules.

| Field          | Type           | Constraints             |
|----------------|----------------|-------------------------|
| `name`         | string         | required, unique        |
| `allowedTypes` | `DoctorType[]` | at least one entry      |

Example: `{ name: "specjalista_lub_starszy", allowedTypes: ["specialist", "senior_resident"] }`

#### 1E — General Rules

Two rule types constrain how the genetic algorithm fills slots.

**Type A — Daily doctor-type count rule**

Requires that on every duty day, at least N slots are filled by doctors of a specific type.

| Field        | Type         | Constraints |
|--------------|--------------|-------------|
| `doctorType` | `DoctorType` | required    |
| `minCount`   | integer      | ≥ 1         |

Example: _Each day must have at least 1 specialist._

**Type B — Ward eligibility rule**

Restricts which doctor types may fill a specific ward, using a tag.

| Field      | Type   | Constraints             |
|------------|--------|-------------------------|
| `wardId`   | string | references a Ward       |
| `tagId`    | string | references a Tag        |

Example: _Ward "Pooperacyjna" requires tag "specjalista_lub_starszy"._

If a ward has no eligibility rule, any doctor type may fill it.

---

### 2. Duty Plan

#### 2A — Month Selection

- User picks a **year and month**.
- The plan covers every calendar day of that month.
- Each day has exactly N slots, where N = number of wards defined in the unit.

A plan may have an optional **label** (free-text name) to distinguish multiple plans for the same month (e.g. `"Wersja 1"`, `"Po korekcie"`).

#### 2B — Preferences & Exclusions

Entered directly in **Aspect A (Przypisania)** while the toolbar's preference-edit mode is active.

Cell click-cycle (when preference-edit mode is ON):
```
empty → ✓ (preference) → ✗ (exclusion) → empty → …
```

- **Preference** (✓): doctor *wants* duty on this date. Soft constraint.
- **Exclusion** (✗): doctor *must not* have duty on this date. Hard constraint.

The toolbar toggle switches between preference-edit mode and view mode. In view mode, cells show assigned ward abbreviations / emojis.

#### 2C — Plan Generation

After preferences/exclusions are entered, the user clicks **Generuj**. The genetic algorithm runs in a Web Worker. A progress bar shows current generation and best fitness score.

On completion, the plan is saved and displayed. The user may then inspect and pin slots before regenerating.

#### 2D — Regeneration

The user may click **Regeneruj** at any time after initial generation. The GA re-runs from scratch except that **pinned slots are treated as hard constraints** (their doctor–ward–date assignments are locked).

#### 2E — Pinning

- Right-click on an assigned cell (or tap a pushpin icon on hover) toggles the pin.
- Pinned cells are visually distinguished (e.g. distinct background or border).
- A pinned cell survives regeneration unchanged.
- Pinning an empty slot is not allowed.

---

## Data Model

```typescript
type DoctorType = "resident" | "senior_resident" | "specialist";

interface Unit {
  id: string;
  name: string;
  wards: Ward[];
  doctors: Doctor[];
  tags: Tag[];
  rules: Rule[];
}

interface Ward {
  id: string;
  name: string;
  abbrev: string;       // 2–4 uppercase chars
  emoji: string | null;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  type: DoctorType;
}

interface Tag {
  id: string;
  name: string;
  allowedTypes: DoctorType[];
}

type Rule = DailyCountRule | WardEligibilityRule;

interface DailyCountRule {
  kind: "daily_count";
  id: string;
  doctorType: DoctorType;
  minCount: number;
}

interface WardEligibilityRule {
  kind: "ward_eligibility";
  id: string;
  wardId: string;
  tagId: string;
}

interface Plan {
  id: string;
  unitId: string;
  year: number;
  month: number;          // 1–12
  label: string | null;   // disambiguates multiple plans for same month
  preferences: DoctorDateEntry[];
  exclusions: DoctorDateEntry[];
  assignments: Assignment[];
}

interface DoctorDateEntry {
  doctorId: string;
  date: string;           // YYYY-MM-DD
}

interface Assignment {
  date: string;           // YYYY-MM-DD
  wardId: string;
  doctorId: string | null;
  pinned: boolean;
}
```

---

## Genetic Algorithm

### Chromosome

A chromosome is a complete set of `Assignment` objects for the month: one per `(date × ward)` slot.

### Fitness Function

Violations are accumulated as a weighted penalty score (lower = better). Zero penalty = perfect plan.

**Hard violations** (high weight, e.g. 1000 per occurrence):
- Exclusion breached — doctor assigned on an excluded date
- Ward eligibility violated — doctor type not in ward's required tag
- Doctor double-booked — same doctor in more than one slot on the same day
- Pinned slot overridden — pinned assignment not preserved

**Soft violations** (low weight, e.g. 10 per occurrence):
- Preference not honored — doctor not assigned on preferred date
- Daily count rule not met — fewer doctors of required type than `minCount` on a given day

**Distribution penalty** (medium weight, e.g. 50 per unit of deviation):
- Unequal duty count across doctors — penalise deviation from mean

**Null slots** (medium weight, e.g. 100 per slot):
- Any slot with `doctorId: null`

### Algorithm Parameters (defaults, not user-configurable in v1)

| Parameter          | Default |
|--------------------|---------|
| Population size    | 100     |
| Generations        | 500     |
| Mutation rate      | 0.05    |
| Crossover rate     | 0.80    |
| Elite fraction     | 0.10    |

### Execution

- Runs entirely in a **Web Worker**.
- Worker posts progress messages: `{ type: "progress", generation: number, bestFitness: number }`.
- On completion: `{ type: "result", assignments: Assignment[] }`.
- The UI renders a progress bar during execution and enables cancellation.

---

## UI

### Navigation

Three top-level views reachable via a persistent navigation bar:

| Route         | View                         |
|---------------|------------------------------|
| `/`           | Home / Dashboard             |
| `/setup/:id`  | Unit Setup (wizard or edit)  |
| `/plan/:id`   | Plan view                    |

### Home / Dashboard

- Lists all defined units.
- Each unit card shows its name and a list of plans (month + label).
- Actions per unit: **Edit setup**, **Delete unit**, **Create plan**.
- Actions per plan: **Open plan**, **Export plan (JSON)**, **Delete plan**.
- Top-level action: **Import plan (JSON)**, **Create unit**.

---

### Setup — Wizard with Tabs

Tabs in order:

| # | Label      | Content                          |
|---|------------|----------------------------------|
| 1 | Jednostka  | Unit name (1A)                   |
| 2 | Piony      | Ward list — add / edit / delete (1B) |
| 3 | Lekarze    | Doctor list — add / edit / delete (1C) |
| 4 | Tagi       | Tag definitions (1D)             |
| 5 | Reguły     | Rule list — add / edit / delete (1E) |

**Wizard mode** (new unit): Next / Back buttons; validation runs before tab advance.  
**Edit mode** (existing unit): all tabs accessible directly; Save button per tab.

---

### Plan View

#### Toolbar

| Control              | Description                                                             |
|----------------------|-------------------------------------------------------------------------|
| Month picker         | Year + month selector                                                   |
| Aspect toggle        | Switch between **Przypisania** (A) and **Piony** (B)                   |
| Cell display toggle  | (Aspect A only) Switch between **Skrót** (4-letter abbrev) and **Emoji** |
| Prefs-edit toggle    | Activate / deactivate preference-edit mode (click-cycle on cells)       |
| Generuj              | Start plan generation (GA); shows progress bar                          |
| Regeneruj            | Re-run GA preserving pinned slots                                       |
| Export ▾             | Dropdown: **JSON** / **Zaszyfrowany link**                              |
| Import               | Import plan from JSON file                                              |
| Drukuj               | Trigger print                                                           |

#### Aspect A — Assignments (Przypisania)

```
           │  1   │  2   │  3   │ … │ 31  │
───────────┼──────┼──────┼──────┼───┼─────┤
⭐ Nowak   │ OIOM │      │ ANES │ … │     │
🔬 Kowal  │      │ POOP │      │ … │ OIOM│
🩺 Marek  │      │      │ OIOM │ … │     │
…
```

- **Left column**: doctors sorted ascending by `lastName`; each row prefixed with the type emoji.
- **Top row**: day numbers 1–N for the month.
- **Cells (view mode)**: 4-letter ward abbreviation or ward emoji depending on the cell-display toggle; empty if no duty.
- **Cells (preference-edit mode)**: click-cycle as described in 2B; ✓ and ✗ overlay the cell.
- **Assigned + pinned cell**: rendered with a pin indicator (📌 or distinct background).

#### Aspect B — Wards (Piony)

```
                │    1     │    2     │  3  │ … │
────────────────┼──────────┼──────────┼─────┼───┤
🫁 OIOM        │ Nowak J. │ Marek P. │     │ … │
🩺 Anestezja  │          │ Nowak J. │     │ … │
🛏 Pooperac.  │ Kowal K. │          │     │ … │
…
```

- **Left column**: wards in defined order, each prefixed with emoji + name.
- **Top row**: day numbers.
- **Cells**: doctor full name(s) written top-to-bottom. In v1 each ward has exactly one slot per day, so at most one name per cell.

---

### Print

- Triggered by the **Drukuj** button or `Ctrl+P`.
- Prints the **currently active aspect**.
- Page orientation: **landscape** via `@page { size: landscape }`.
- Print stylesheet hides: toolbar, navigation, non-grid UI elements.
- Page header (repeated): unit name · month · year.
- Font size auto-scales so the grid fits within a minimal number of pages.

---

## Multi-unit Support

- All units coexist in the same browser profile.
- The home dashboard lists all units and their plans together.
- Each plan is linked to one unit via `unitId`.
- Storage is keyed by `unitId`; no global "active unit" switcher.

---

## Export / Import / Sharing

### JSON export — full snapshot

Downloads a single `.json` file containing the full unit definition and all its plans.

```json
{
  "schemaVersion": 1,
  "type": "full_snapshot",
  "unit": { … },
  "plans": [ … ]
}
```

### JSON import — full snapshot

File upload. Validates `schemaVersion`. On import, merge or replace existing unit data (prompt user if unit already exists).

### JSON export — single plan

Exports one selected plan along with its parent unit's identity (name + id) as a standalone file.

```json
{
  "schemaVersion": 1,
  "type": "single_plan",
  "unitRef": { "id": "…", "name": "…" },
  "plan": { … }
}
```

### JSON import — single plan

1. User selects a file via the toolbar **Import** button or the home dashboard.
2. Validate `schemaVersion`.
3. Check that `unitRef.id` or `unitRef.name` matches a locally stored unit; if not, prompt user to also import the full unit snapshot or abort.
4. If a plan with the same `(unitId, year, month)` already exists:
   - Prompt user to provide a new **label** for the imported plan (both coexist), or choose to **overwrite** the existing plan.
5. Save and open the imported plan.

### Encrypted share link

Encodes a full unit + plan snapshot in the URL fragment so no data is sent to the server.

**Encoding steps**:
1. Serialize `{ schemaVersion, unit, plan }` as JSON (UTF-8).
2. Compress with `CompressionStream("gzip")`.
3. Derive a 256-bit AES-GCM key via `PBKDF2(password, salt, 200_000 iterations, SHA-256)`.
4. Encrypt with AES-GCM (random 96-bit IV, random 128-bit salt prepended to ciphertext).
5. Concatenate: `[salt (16 bytes)][iv (12 bytes)][ciphertext]`.
6. Base64url-encode the result.
7. Final URL: `https://<host>/#share=<base64url>`

**Decoding steps** (recipient side):
1. Detect `#share=` fragment on page load; show a password prompt.
2. Reverse steps 6 → 1.
3. On wrong password (AES-GCM auth tag failure): show error, re-prompt.
4. On success: offer to import the decoded unit + plan.

---

## Storage

All data stored client-side. Schema versioned.

| Store / Key             | Engine     | Content                        |
|-------------------------|------------|--------------------------------|
| `units` object store    | IndexedDB  | `Unit[]` keyed by `unit.id`    |
| `plans` object store    | IndexedDB  | `Plan[]` keyed by `plan.id`    |
| `szpitalik_schema_v`    | localStorage | integer, current value: `1` |

On detected schema version mismatch: show a migration notice and, if no automated migration path exists, offer to reset storage.

---

## Testing

### Unit Tests

- GA fitness function: each penalty type in isolation (exclusion breach, eligibility violation, double-booking, preference miss, daily-count miss, null slot, pin preservation)
- Constraint validators: ward abbrev length (2–4), tag `allowedTypes` non-empty, rule referential integrity (wardId and tagId exist), pinned-cell hard constraint enforcement
- Date / slot utilities: days-in-month edge cases (February, leap year), slot list generation
- Sort utility: doctor sort ascending by `lastName`
- Crypto utilities: encrypt → decrypt round-trip; decrypt with wrong password throws; IV/salt randomness (each call produces distinct output)
- JSON serialization: full snapshot and single-plan round-trips preserve all fields including `pinned` and `label`

### Integration Tests

- Full setup wizard: fill all five tabs, save, reload from IndexedDB, confirm data integrity
- Plan generation: minimal unit (1 ward, 2 doctors, no rules), run GA to completion, assert zero hard violations in result
- Regeneration with pinned cell: pin one slot, regenerate, assert pinned slot unchanged
- Preference cell-cycle: three sequential clicks on a cell cycle through empty → ✓ → ✗ → empty
- Aspect A rendering: given known `Assignment[]`, assert correct cells render (abbrev mode + emoji mode)
- Aspect B rendering: same data, assert ward rows render correct doctor names
- Single-plan JSON export → import with matching unit: plan restored correctly
- Single-plan JSON import name conflict: user prompted for label; both plans coexist after rename
- Encrypted-link export → import in fresh state: unit + plan restored after correct password; fails gracefully on wrong password
- Print stylesheet: `window.print` trigger applies print-specific CSS class that hides toolbar and nav

---

## Non-Functional Requirements

- **Offline**: full functionality after first load; Service Worker pre-caches all Vite build assets.
- **Installable**: Web App Manifest with `name`, `short_name`, icons (192×192, 512×512), `theme_color`, `display: standalone`.
- **Responsive**: usable on tablet (≥ 768 px wide); grid scrolls horizontally on smaller screens.
- **Accessibility**: keyboard navigation through wizard tabs; ARIA roles and labels on grid cells; focus management in modals/prompts.
- **No backend**: zero server-side dependencies; all computation and storage are client-side.
- **Security**: passwords never stored or logged; AES-GCM with PBKDF2 at ≥ 200 000 iterations; URL fragment never sent to GitHub Pages server.

---

## Out of Scope (v1)

- Cloud sync or external calendar export (Google Calendar, iCal)
- Drag-and-drop manual schedule editing (only pin + regenerate)
- Role-based access or authentication
- Recurring rules carried across months (preferences and exclusions are per-plan)
- Multiple slots per ward per day (v1: exactly 1 slot per ward per day)
- Configurable GA parameters exposed in UI
