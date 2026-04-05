require("dotenv").config();

const express = require("express");
const cors = require("cors");
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

function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || "";
  const configured = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  // Sichere Defaults fuer lokale Entwicklung
  return ["http://localhost:5173", "http://localhost:8000", "http://localhost:8080"];
}

const allowedOrigins = parseAllowedOrigins();

app.disable("x-powered-by");
app.use(cors({
  origin: (origin, callback) => {
    // Requests ohne Origin erlauben (z.B. Healthchecks/Server-zu-Server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked: origin not allowed"));
  }
}));
app.use(express.json({ limit: "1mb" }));

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
    supabaseConfigured: hasSupabaseConfig
  };

  // Diagnosedetails nur ausserhalb Produktion zeigen
  if (!isProduction) {
    payload.supabaseKeyKind = supabaseKeyKind;
    payload.supabaseJwtRole = supabaseJwtRole;
    payload.allowedOrigins = allowedOrigins;
  }

  res.status(200).json(payload);
});

app.post("/api/v1/runs", async (req, res) => {
  try {
    const body = req.body || {};

    const playerName = sanitizePlayerName(body.playerName);
    if (!playerName) {
      return res.status(400).json({ error: "Ungueltiger playerName (3-10 Zeichen)." });
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
      .select("id, player_name, score_gold, result, submitted_at")
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
      .select("id, player_name, score_gold, result, selected_level_number, wave_reached, submitted_at")
      .order("score_gold", { ascending: false })
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
});