# SECURITY WARNINGS — Pre-Release Checklist

**Status:** ⚠️ **LOKALE ENTWICKLUNG NUR**

Diese API ist **NICHT produktionsbereit**. Die folgenden Sicherheitsmaßnahmen müssen vor einem Online-Release implementiert werden.

## Must-Have vor Production

### 1. Rate Limiting
- [ ] Implementiert: 100 Requests pro IP pro Minute
- [ ] Code-Location: `backend-mini/server.js`
- [ ] Package: `express-rate-limit`

### 2. SQL Injection Prevention
- [ ] Alle DB-Queries verwenden Parameterized Statements
- [ ] KEINE String-Konkatenation in WHERE/INSERT-Clauses
- [ ] Package: `sqlite3` mit bound parameters

### 3. HTTPS + Authentifizierung
- [ ] Production-URL hat HTTPS
- [ ] API-Keys / JWT Tokens für Online-Version prüfen
- [ ] CORS auf nur deine Domain limitieren (nicht "*")

### 4. Input Validation (Server-Side)
- [ ] playerName: 1-20 chars, nur `[A-Za-z0-9 _-]`
- [ ] scoreGold: Integer, >= 0, <= 9999999
- [ ] Validation auf Backend, nicht nur Frontend!

### 5. Error Handling
- [ ] Stack-Traces nicht in API-Responses
- [ ] Generische Fehler-Messages ("Etwas ist schief gelaufen")
- [ ] Logging nur in Server-Logs, nicht im Response

### 6. Request Size Limits
- [ ] Max 1 KB Body Size
- [ ] Max 100 KB Headers

## Aktueller Status

✅ CORS konfiguriert (lokal)  
✅ Error-Response-Format definiert  
❌ Rate Limiting: NICHT IMPLEMENTIERT  
❌ SQL Injection Protection: NICHT IMPLEMENTIERT  
❌ HTTPS: NICHT KONFIGURIERT  
❌ Authentifizierung: NICHT IMPLEMENTIERT  

## Timeline

- **Lokale Phase (Jetzt):** Sicherheit optional
- **Before Beta:** Mindestens Rate Limiting + HTTPS
- **Before Production:** Alle Items ✅

---

*Zuletzt aktualisiert: 25. März 2026*
