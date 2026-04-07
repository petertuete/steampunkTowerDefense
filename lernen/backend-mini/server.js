require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

/**
 * ⚠️ SECURITY WARNING: PRE-RELEASE VERSION
 * 
 * Diese API ist für lokale Entwicklung (Singleplayer) konzipiert.
 * Vor Online-Release MÜSSEN folgende Sicherheitsmaßnahmen implementiert werden:
 * 
 * - [ ] Rate Limiting pro IP
 * - [ ] Request Size Limits
 * - [ ] SQL Injection Protection (Parameterized Queries)
 * - [ ] HTTPS + Authentifizierung (API Keys / JWT Tokens)
 * - [ ] Input Validation auf Server-Seite (nicht nur Client)
 * - [ ] Error Messages sanitieren (keine internen Details)
 * - [ ] Logging + Monitoring
 * 
 * Siehe: SECURITY_WARNINGS.md für Details.
 */

const app = express();
const port = Number(process.env.PORT || 3001);
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

function parsePositiveIntEnv(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

const runsRateLimitWindowMs = parsePositiveIntEnv(process.env.RUNS_RATE_LIMIT_WINDOW_MS, 60_000);
const runsRateLimitMax = parsePositiveIntEnv(process.env.RUNS_RATE_LIMIT_MAX, 30);
const challengeRateLimitWindowMs = parsePositiveIntEnv(process.env.CHALLENGE_RATE_LIMIT_WINDOW_MS, 60_000);
const challengeRateLimitMax = parsePositiveIntEnv(process.env.CHALLENGE_RATE_LIMIT_MAX, 60);
const runAuthTokenTtlSeconds = parsePositiveIntEnv(process.env.RUN_AUTH_TOKEN_TTL_SECONDS, 60);

const configuredRunAuthSecret = process.env.RUN_AUTH_SECRET || "";
const RUN_AUTH_SECRET = configuredRunAuthSecret || (isProduction ? "" : `dev-${crypto.randomBytes(32).toString("hex")}`);
const hasRunAuthConfig = Boolean(RUN_AUTH_SECRET);
const usedRunAuthNonces = new Map();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function detectSupabaseKeyKind(key) {
  if (!key) return "missing";
  if (key.startsWith("sb_publishable_")) return "publishable";
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("eyJ")) return "jwt";
  return "unknown";
}

function detectJwtRole(key) {
  if (!key || !key.startsWith("eyJ")) {
    return null;
  }

  try {
    const payloadPart = key.split(".")[1];
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
    return payload.role || null;
  } catch {
    return null;
  }
}

const supabaseKeyKind = detectSupabaseKeyKind(SUPABASE_SERVICE_ROLE_KEY);
const supabaseJwtRole = detectJwtRole(SUPABASE_SERVICE_ROLE_KEY);
const hasSupabaseAdminKey =
  supabaseKeyKind === "secret" || (supabaseKeyKind === "jwt" && supabaseJwtRole === "service_role");
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && hasSupabaseAdminKey);

const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function pruneExpiredRunAuthNonces(nowSec = Math.floor(Date.now() / 1000)) {
  for (const [nonce, exp] of usedRunAuthNonces.entries()) {
    if (!Number.isFinite(exp) || exp <= nowSec) {
      usedRunAuthNonces.delete(nonce);
    }
  }
}

function signRunAuthPayload(payloadBase64) {
  return crypto
    .createHmac("sha256", RUN_AUTH_SECRET)
    .update(payloadBase64)
    .digest("base64url");
}

function createRunAuthToken(req) {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    nonce: crypto.randomBytes(16).toString("hex"),
    iat: nowSec,
    exp: nowSec + runAuthTokenTtlSeconds,
    ip: req.ip || "",
    ua: req.get("user-agent") || ""
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signRunAuthPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

function verifyAndConsumeRunAuthToken(token, req) {
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { ok: false, reason: "format" };
  }

  const [payloadBase64, providedSignature] = parts;
  const expectedSignature = signRunAuthPayload(payloadBase64);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return { ok: false, reason: "signature" };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "payload" };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  pruneExpiredRunAuthNonces(nowSec);

  if (!payload || typeof payload !== "object" || !payload.nonce) {
    return { ok: false, reason: "payload" };
  }

  if (!Number.isFinite(payload.exp) || payload.exp < nowSec) {
    return { ok: false, reason: "expired" };
  }

  if (payload.ip !== (req.ip || "") || payload.ua !== (req.get("user-agent") || "")) {
    return { ok: false, reason: "context" };
  }

  if (usedRunAuthNonces.has(payload.nonce)) {
    return { ok: false, reason: "replay" };
  }

  usedRunAuthNonces.set(payload.nonce, payload.exp);
  return { ok: true };
}

function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || "";
  const configured = raw
    .split(",")
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  // Sichere Defaults fuer lokale Entwicklung
  return [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
  ];
}

function normalizeOrigin(origin) {
  if (!origin) {
    return null;
  }

  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return false;
  }

  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  if (process.env.ALLOW_VERCEL_PREVIEWS === "true") {
    try {
      const { hostname, protocol } = new URL(normalizedOrigin);
      if (protocol === "https:" && hostname.endsWith(".vercel.app")) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

const allowedOrigins = parseAllowedOrigins();

app.disable("x-powered-by");
if (isProduction) {
  // Render/Reverse-Proxy: echte Client-IP fuer Rate-Limit nutzen
  app.set("trust proxy", 1);
}
app.use(cors({
  origin: (origin, callback) => {
    // Requests ohne Origin erlauben (z.B. Healthchecks/Server-zu-Server)
    if (!origin) {
      return callback(null, true);
    }

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked: origin not allowed"));
  }
}));
app.use(express.json({ limit: "1mb" }));

const submitRunsLimiter = rateLimit({
  windowMs: runsRateLimitWindowMs,
  limit: runsRateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Zu viele Run-Submits in kurzer Zeit. Bitte kurz warten und erneut versuchen."
  }
});

const challengeLimiter = rateLimit({
  windowMs: challengeRateLimitWindowMs,
  limit: challengeRateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Zu viele Auth-Challenges in kurzer Zeit. Bitte kurz warten und erneut versuchen."
  }
});

function requireRunSubmitAuth(req, res, next) {
  if (!hasRunAuthConfig) {
    return res.status(503).json({
      error: "Run-Auth ist nicht konfiguriert. Setze RUN_AUTH_SECRET auf dem Backend."
    });
  }

  const token = req.get("x-run-auth-token") || req.body?.runAuthToken;
  const result = verifyAndConsumeRunAuthToken(token, req);
  if (!result.ok) {
    return res.status(401).json({
      error: "Ungültiger oder abgelaufener Run-Auth-Token.",
      code: result.reason
    });
  }

  next();
}

function sanitizePlayerName(name) {
  const trimmed = String(name || "").trim();
  if (trimmed.length < 3 || trimmed.length > 10) {
    return null;
  }
  return trimmed.replace(/\s+/g, " ");
}

function isValidTowerUsageByLevel(towerUsageByLevel) {
  if (!towerUsageByLevel || typeof towerUsageByLevel !== "object") {
    return false;
  }

  for (const levelUsage of Object.values(towerUsageByLevel)) {
    if (!levelUsage || typeof levelUsage !== "object") {
      return false;
    }
    if (!Array.isArray(levelUsage.placements)) {
      return false;
    }
  }

  return true;
}

function flattenTowerPlacements(runId, towerUsageByLevel) {
  const rows = [];
  for (const [levelKey, levelUsage] of Object.entries(towerUsageByLevel || {})) {
    const placements = Array.isArray(levelUsage.placements) ? levelUsage.placements : [];

    for (const placement of placements) {
      rows.push({
        run_id: runId,
        level_key: levelKey,
        placement_id: placement.placementId,
        tower_type_key: placement.towerTypeKey,
        tower_name: placement.towerName,
        grid_x: placement.gridX,
        grid_y: placement.gridY,
        screen_x: placement.screenX,
        screen_y: placement.screenY,
        placed_at_wave: placement.placedAtWave,
        sold: Boolean(placement.sold),
        sold_at_wave: placement.soldAtWave || null,
        metadata: {
          placedAtMs: placement.placedAtMs || null,
          soldAtMs: placement.soldAtMs || null,
          levelNumber: levelUsage.levelNumber || null,
          levelName: levelUsage.levelName || null
        }
      });
    }
  }

  return rows;
}

app.get("/api/v1/health", (req, res) => {
  const payload = {
    status: "ok",
    service: "highscore-api",
    environment: NODE_ENV,
    supabaseConfigured: hasSupabaseConfig,
    runAuthConfigured: hasRunAuthConfig
  };

  // Diagnosedetails nur ausserhalb Produktion zeigen
  if (!isProduction) {
    payload.supabaseKeyKind = supabaseKeyKind;
    payload.supabaseJwtRole = supabaseJwtRole;
    payload.allowedOrigins = allowedOrigins;
  }

  res.status(200).json(payload);
});

app.get("/api/v1/auth/challenge", challengeLimiter, (req, res) => {
  if (!hasRunAuthConfig) {
    return res.status(503).json({
      error: "Run-Auth ist nicht konfiguriert. Setze RUN_AUTH_SECRET auf dem Backend."
    });
  }

  const token = createRunAuthToken(req);
  return res.status(200).json({
    token,
    expiresInSec: runAuthTokenTtlSeconds
  });
});

app.post("/api/v1/runs", submitRunsLimiter, requireRunSubmitAuth, async (req, res) => {
  try {
    const body = req.body || {};

    const playerName = sanitizePlayerName(body.playerName);
    if (!playerName) {
      return res.status(400).json({ error: "Ungueltiger playerName (3-10 Zeichen)." });
    }

    const scorePointsInput = Number.isFinite(body.scorePoints) ? body.scorePoints : body.scoreGold;
    if (!Number.isFinite(scorePointsInput) || scorePointsInput < 0) {
      return res.status(400).json({ error: "scorePoints muss eine positive Zahl sein." });
    }

    if (!Number.isFinite(body.scoreGold) || body.scoreGold < 0) {
      return res.status(400).json({ error: "scoreGold muss eine positive Zahl sein." });
    }

    if (!isValidTowerUsageByLevel(body.towerUsageByLevel)) {
      return res.status(400).json({ error: "towerUsageByLevel ist ungueltig." });
    }

    if (!hasSupabaseConfig || !supabase) {
      return res.status(503).json({
        error: "Supabase ist nicht korrekt konfiguriert. Verwende einen service_role JWT oder sb_secret_ Key in SUPABASE_SERVICE_ROLE_KEY."
      });
    }

    const runRow = {
      player_name: playerName,
      result: body.result === "won" ? "won" : "lost",
      score_points: Math.round(scorePointsInput),
      score_gold: Math.round(body.scoreGold),
      selected_level_key: body.selectedLevelKey || null,
      selected_level_number: Number.isFinite(body.selectedLevelNumber) ? body.selectedLevelNumber : null,
      wave_reached: Number.isFinite(body.waveReached) ? body.waveReached : null,
      total_waves: Number.isFinite(body.totalWaves) ? body.totalWaves : null,
      total_kills: Number.isFinite(body.totalKills) ? body.totalKills : 0,
      total_leaks: Number.isFinite(body.totalLeaks) ? body.totalLeaks : 0,
      total_gold_earned: Number.isFinite(body.totalGoldEarned) ? body.totalGoldEarned : 0,
      total_gold_spent: Number.isFinite(body.totalGoldSpent) ? body.totalGoldSpent : 0,
      total_gold_remaining: Number.isFinite(body.totalGoldRemaining) ? body.totalGoldRemaining : 0,
      lives_remaining: Number.isFinite(body.livesRemaining) ? body.livesRemaining : null,
      tower_usage_by_level: body.towerUsageByLevel,
      client_version: body.clientVersion || null,
      submitted_at: new Date().toISOString()
    };

    const { data: insertedRun, error: runInsertError } = await supabase
      .from("game_runs")
      .insert(runRow)
      .select("id, player_name, score_points, score_gold, result, submitted_at")
      .single();

    if (runInsertError) {
      console.error("Run insert error:", runInsertError);
      return res.status(500).json({ error: "Run konnte nicht gespeichert werden." });
    }

    const placements = flattenTowerPlacements(insertedRun.id, body.towerUsageByLevel);
    if (placements.length > 0) {
      const { error: usageInsertError } = await supabase
        .from("tower_usage_entries")
        .insert(placements);

      if (usageInsertError) {
        console.error("Tower usage insert error:", usageInsertError);
        return res.status(500).json({
          error: "Run gespeichert, aber Tower-Statistiken konnten nicht gespeichert werden.",
          runId: insertedRun.id
        });
      }
    }

    return res.status(201).json({
      ok: true,
      run: insertedRun,
      placementsSaved: placements.length
    });
  } catch (error) {
    console.error("POST /api/v1/runs failed:", error);
    return res.status(500).json({ error: "Interner Serverfehler." });
  }
});

app.get("/api/v1/scores", async (req, res) => {
  try {
    if (!hasSupabaseConfig || !supabase) {
      return res.status(503).json({
        error: "Supabase ist nicht korrekt konfiguriert."
      });
    }

    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const { data, error } = await supabase
      .from("game_runs")
      .select("id, player_name, score_points, score_gold, result, selected_level_number, wave_reached, submitted_at")
      .order("score_points", { ascending: false })
      .order("submitted_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("GET /api/v1/scores failed:", error);
      return res.status(500).json({ error: "Highscores konnten nicht geladen werden." });
    }

    return res.status(200).json({ items: data || [] });
  } catch (error) {
    console.error("GET /api/v1/scores error:", error);
    return res.status(500).json({ error: "Interner Serverfehler." });
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
  if (!hasRunAuthConfig) {
    console.warn("WARN: RUN_AUTH_SECRET fehlt. /api/v1/runs ist deaktiviert, bis Run-Auth konfiguriert ist.");
  }
});