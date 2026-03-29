# Runtime Surfaces — Maintainer Reference

`surfaces.json` is the data source for the Runtime Ownership panel at
`/platform/ops/runtime`. The React page is a read-only renderer.
All content changes happen here.

---

## What this file owns

- The complete classified inventory of Signal's executable surfaces
- Provenance labels for each section (what is automated vs. human-maintained)
- Risk flags for surfaces with known production hazards
- Audit metadata (last verified date, commit SHAs, crontab status)

It does **not** own:
- Runtime state (whether services are currently up)
- Live cron schedules (those require SSH to verify)
- Ownership policy decisions for new surfaces (those require human classification)

---

## Fields checked by CI on every push

| Field | Check | Workflow |
|-------|-------|----------|
| `backgroundScripts.items[].name` | Must match `second_brain/*.py` exactly | `SecondBrain/runtime-drift.yml` |
| `publicRoutes.items[].name` | Must match `BYPASS_PATHS` in `src/middleware.ts` | `fieldstoneFront/ci.yml` (route-drift-check job) |

If either check fails, the CI job prints exactly which names are missing or
extra. See **When a drift check fails** below.

---

## Fields that are curated metadata

These have no automated source of truth. A human must keep them correct.

| Field | What it represents | When it drifts |
|-------|--------------------|----------------|
| `items[].ownership` | `production` / `dev-only` / `legacy` / `deprecated` / `unknown` | When a script's role changes |
| `items[].note` | Short operational description | When behavior or purpose changes |
| `items[].risk` | ⚠ warning shown in the panel with hover detail | When a new hazard is discovered or resolved |
| `items[].status` | `active` / `passive` / `scheduled` / `disabled` | When a script is scheduled or retired |
| `deprecatedSurfaces` deletion gates | Conditions under which a deprecated surface can be deleted | When policy changes |
| Section `provenanceNote` | Tooltip text explaining how each section is maintained | When the maintenance model changes |

---

## When a drift check fails

### Script drift (SecondBrain `runtime-drift.yml`)

Triggered by: any `second_brain/*.py` change.

**A new `.py` was added to `second_brain/` without being registered:**
```
[DRIFT] Unregistered scripts found in second_brain/:
  + new_script.py  ← add to EXPECTED_SCRIPTS here and to surfaces.json
```

Fix — two changes, same PR/deploy pass:
1. Add `"new_script.py"` to `EXPECTED_SCRIPTS` in
   `SecondBrain/scripts/check_script_drift.py`
2. Add a classified entry to `backgroundScripts.items` in this file

**A `.py` was removed from `second_brain/` without updating the registry:**
```
[DRIFT] Scripts listed in EXPECTED_SCRIPTS no longer exist:
  - old_script.py  ← remove from EXPECTED_SCRIPTS here and from surfaces.json
```

Fix — same two-step: remove from `EXPECTED_SCRIPTS` and from
`backgroundScripts.items` in the same pass.

---

### Route drift (fieldstoneFront `ci.yml` → `route-drift-check`)

Triggered by: every push to master.

**A path was added to `BYPASS_PATHS` in `src/middleware.ts` without
updating the panel:**
```
[DRIFT] BYPASS_PATHS entries not listed in surfaces.json publicRoutes:
  + /new-public-path  ← add to surfaces.json publicRoutes section
```

Fix: Add the path to `publicRoutes.items` with correct `ownership`,
`authGate`, `status`, and `note`.

**A path was removed from `BYPASS_PATHS` without updating the panel:**
```
[DRIFT] surfaces.json publicRoutes entries not present in BYPASS_PATHS:
  - /old-path  ← either remove from surfaces.json or re-add to BYPASS_PATHS
```

Fix: Determine which is correct — remove from `publicRoutes.items` if the
route is now auth-gated, or restore it to `BYPASS_PATHS` if the removal
was accidental.

---

## When to update `_meta.audited` and commit SHAs

Update `_meta.audited` when you have **manually re-verified** at least one
audit-snapshot section against the live production server. Do not update it
just because you changed data in the file.

Update `_meta.fieldstoneFrontCommit` and `_meta.secondBrainCommit` when you
perform a full re-audit (crontab check, service state check, PID/log
inspection for dev tools).

| Trigger | Update `audited`? | Update SHAs? |
|---------|------------------|-------------|
| Added/reclassified a script or route (CI-driven change) | No | No |
| Manually verified crontab is still clean | Yes | Yes |
| Verified `signal-api` systemd service state | Yes | Yes |
| Re-inspected `discord_bot.py` PID / gateway log | Yes | Yes |
| Updated a risk label or note (curated change only) | No | No |

Rule of thumb: **`audited` date = last time someone SSHed in and checked.**
CI drift checks don't count as an audit.

---

## Adding a new section

If a new category of runtime surface is needed (e.g., `webhookReceivers`
or `scheduledCloudJobs`), add it as a new key under `sections` with:
- `title` — display name in the panel
- `provenance` — array of applicable provenance types
- `provenanceNote` — one sentence explaining what is automated vs. manual
- `footerNote` — one-line status shown in the section header
- `items` — array of classified surfaces

If the new section has a code-derivable field (e.g., a list of webhook
routes parseable from `api.py`), add a corresponding drift check script
before shipping.
