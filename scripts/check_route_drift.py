#!/usr/bin/env python3
"""
check_route_drift.py — Runtime Ownership drift check for public routes

Compares BYPASS_PATHS in src/middleware.ts against the expected public routes
documented in src/app/platform/ops/runtime/surfaces.json

Fails with exit code 1 if:
  - A path in BYPASS_PATHS is NOT listed in surfaces.json publicRoutes
  - A path in surfaces.json publicRoutes is NOT in BYPASS_PATHS
    (note: paths with /* suffix are matched by prefix)

When this fails:
  1. If a new path was added to BYPASS_PATHS: add it to surfaces.json publicRoutes
  2. If a path was removed from BYPASS_PATHS: remove it from surfaces.json publicRoutes
  3. Update surfaces.json _meta.audited date

Surfaces.json: src/app/platform/ops/runtime/surfaces.json
Middleware:    src/middleware.ts
"""

import re
import sys
import json
import os

REPO_ROOT  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIDDLEWARE = os.path.join(REPO_ROOT, "src", "middleware.ts")
SURFACES   = os.path.join(REPO_ROOT, "src", "app", "platform", "ops", "runtime", "surfaces.json")

# ── Parse BYPASS_PATHS from middleware.ts ─────────────────────────────────────

with open(MIDDLEWARE) as f:
    mw_content = f.read()

# Extract the BYPASS_PATHS array value
bp_match = re.search(r'const BYPASS_PATHS\s*=\s*\[([^\]]+)\]', mw_content, re.DOTALL)
if not bp_match:
    print("[ERROR] Could not find BYPASS_PATHS in middleware.ts")
    sys.exit(1)

bp_raw = bp_match.group(1)
# Extract all quoted strings (single or double quotes)
bypass_paths = set(re.findall(r"['\"]([^'\"]+)['\"]", bp_raw))

# ── Parse publicRoutes from surfaces.json ─────────────────────────────────────

with open(SURFACES) as f:
    surfaces = json.load(f)

public_items = surfaces["sections"]["publicRoutes"]["items"]
# Normalise: strip trailing /* for comparison
panel_paths = set()
for item in public_items:
    name = item["name"].rstrip("/*")
    panel_paths.add(name)

# ── Compare ───────────────────────────────────────────────────────────────────

unregistered = bypass_paths - panel_paths   # in middleware, not in panel
missing      = panel_paths - bypass_paths   # in panel, not in middleware

failed = False

if unregistered:
    print("\n[DRIFT] BYPASS_PATHS entries not listed in surfaces.json publicRoutes:")
    for p in sorted(unregistered):
        print(f"  + {p}  ← add to surfaces.json publicRoutes section")
    print("  Unauthenticated users can reach these paths but they are not tracked in Runtime Ownership.")
    failed = True

if missing:
    print("\n[DRIFT] surfaces.json publicRoutes entries not present in BYPASS_PATHS:")
    for p in sorted(missing):
        print(f"  - {p}  ← either remove from surfaces.json or re-add to BYPASS_PATHS")
    print("  These paths may be auth-gated even though surfaces.json marks them as public.")
    failed = True

if failed:
    print("\nFIX: Update surfaces.json publicRoutes to match current BYPASS_PATHS.")
    print("     See /platform/ops/runtime for the Runtime Ownership panel.")
    sys.exit(1)

print(f"[OK] BYPASS_PATHS matches Runtime Ownership panel public routes ({len(bypass_paths)} paths)")
sys.exit(0)
