# SECURITY WARNINGS — Security Status

**Status:** ⚠️ **LIVE DEMO / HOBBY-BETRIEB, NICHT FULL-PRODUCTION**

Die API ist nicht mehr nur lokal, aber auch noch kein voll abgesicherter Production-Service. Mehrere Kernmaßnahmen sind bereits umgesetzt; offen bleiben vor allem Operations- und Hardening-Themen.

## Must-Have vor Production

### 1. Rate Limiting
- [x] Implementiert via `express-rate-limit`
- [x] Code-Location: `lernen/backend-mini/server.js`
- [x] Konfigurierbar ueber `RUNS_RATE_LIMIT_*` und `CHALLENGE_RATE_LIMIT_*`

### 2. SQL Injection Prevention
- [x] Keine SQL-String-Konkatenation im App-Code
- [x] DB-Zugriff laeuft ueber Supabase-Client statt manuell gebauter SQL-Strings
- [ ] RLS/DB-Policies weiter regelmaessig pruefen

### 3. HTTPS + Authentifizierung
- [x] Live-Deployment laeuft ueber HTTPS
- [x] CORS ist eingeschraenkt und konfigurierbar
- [x] Run-Submits brauchen HMAC-Challenge-Token
- [ ] Secret-Rotation und Incident-Prozess dokumentieren

### 4. Input Validation (Server-Side)
- [x] playerName: 3-10 Zeichen, serverseitig geprueft
- [x] scoreGold / scorePoints: numerisch und >= 0
- [x] towerUsageByLevel wird serverseitig validiert

### 5. Error Handling
- [x] Keine Stack-Traces in API-Responses
- [x] Generische Fehler-Messages fuer Clients
- [x] Detail-Logs bleiben im Server-Log

### 6. Request Size Limits
- [x] JSON-Body-Limit aktiv (`express.json({ limit: "1mb" })`)
- [ ] Header-Limits nur ueber Infrastruktur/Proxy absichern

## Aktueller Status

✅ CORS konfiguriert und normalisiert  
✅ Rate Limiting fuer Challenge + Run-Submit aktiv  
✅ Request-Body-Limit aktiv  
✅ HMAC-Auth fuer Run-Submit aktiv  
✅ Input-Validation und generische Fehlerantworten aktiv  
⚠️ Secret-Rotation / Monitoring / weitergehende Abuse-Defense offen
⚠️ Score-Faking durch konsistente Fake-Payloads möglich (kein Server-side Replay der Spiellogik)
   → Akzeptiertes Risiko für Hobby-Betrieb. Fix: inkrementelle signierte Events oder Server-Simulation.  

## Timeline

- **Jetzt:** Limits und Auth beobachten, Defaults sinnvoll halten
- **Vor groesserem Playtest/Beta:** Monitoring, Secret-Rotation, Log-Review
- **Vor echter Production:** Infrastruktur-Hardening und Operations-Prozesse komplettieren

---

*Zuletzt aktualisiert: 9. April 2026*
