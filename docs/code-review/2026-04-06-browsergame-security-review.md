# Code Review: BrowserGame (backend-mini + GameScene + env handling)
**Ready for Production**: No
**Critical Issues**: 1
**Compliance Scope**: GDPR: Yes (likely) NIS2: Unknown/Likely relevant for enterprise ops CRA: Unknown (depends on EU product distribution)

## Assumptions / Data Classification
- Personal data likely present: player names and IP addresses in request logs/rate-limit context.
- Secrets present: Supabase service-role credential.
- Data flow: Browser -> Express API -> Supabase.
- Cross-border/data processor implications depend on Supabase project region and deployment setup.

## Priority 1 (Must Fix) ⛔
- Secret exposure risk: service-role credential appears in local env handling context and can grant full DB access if leaked. Evidence: [lernen/backend-mini/.env](lernen/backend-mini/.env#L3), [lernen/backend-mini/server.js](lernen/backend-mini/server.js#L42).
  - Impact: Full confidentiality/integrity loss of stored run data, bypass of RLS, persistent compromise until key rotation.
  - Fix: Rotate key immediately in Supabase, invalidate old key, ensure only secret manager/runtime injection for production.

## Priority 2 (High)
- Missing authentication on score write endpoint allows forged runs/leaderboard manipulation (CWE-306). Evidence: [lernen/backend-mini/server.js](lernen/backend-mini/server.js#L199), [frontend/src/scenes/GameScene.js](frontend/src/scenes/GameScene.js#L1600).
  - Impact: Integrity loss (fake highscores), abuse automation despite per-IP rate limiting.
  - Fix: Require signed auth token per run (or server-side challenge), verify token server-side before insert.

## Compliance Findings
### GDPR
- Risk: If player names are user-provided identifiers, they are personal data; current controls do not show retention/deletion policy or DSAR support in scoped code.
- Evidence: [frontend/src/scenes/GameScene.js](frontend/src/scenes/GameScene.js#L1572), [lernen/backend-mini/server.js](lernen/backend-mini/server.js#L199).
- Minimal fix: define retention TTL, add deletion/export workflow, document lawful basis and processor region.

### NIS2
- Risk: Basic technical controls exist (rate-limit, CORS), but auth and secret lifecycle handling are incomplete for internet exposure.
- Evidence: [lernen/backend-mini/server.js](lernen/backend-mini/server.js#L114), [lernen/backend-mini/server.js](lernen/backend-mini/server.js#L199).
- Minimal fix: establish vulnerability and secret-rotation process, add auth for mutating endpoints, keep dependency patch policy documented.

### CRA
- Scope uncertain (depends on whether this is distributed as a digital product in EU market).
- Gap to monitor: secure-by-default and vulnerability handling documentation should be explicit before distribution.

## Recommended Changes
- Rotate Supabase service-role key and move secret injection to deployment secret store only.
- Add auth verification middleware to POST /api/v1/runs.
- Keep rate limit and body-size limits; add stricter schema validation for nested placement objects.
- Upgrade Vite to patched version and avoid exposing dev server to untrusted networks.