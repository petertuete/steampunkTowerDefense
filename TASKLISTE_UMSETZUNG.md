# Einzeltaskliste fuer die konkrete Umsetzung

Version: 0.3  
Datum: 5. April 2026

Legende: ✅ erledigt | ❌ entfernt/entfallen | ⏳ offen

## Prioritaetslegende
- P0: kritisch, blockiert Fortschritt
- P1: wichtig fuer Milestone-Abnahme
- P2: sinnvoll, aber nachrangig

## Milestone 0: Setup-Ready

1. ✅ P0: Frontend-Projekt mit Vite initialisieren
2. ✅ P0: Phaser als Abhaengigkeit einbinden
3. ✅ P0: Backend-Projekt mit Express initialisieren
4. ✅ P0: SQLite anbinden und DB-Datei konfigurieren
5. ✅ P0: Basisordnerstruktur fuer Frontend anlegen
6. ✅ P0: Basisordnerstruktur fuer Backend anlegen
7. ✅ P1: Environment-Handling fuer API-URL aufsetzen
8. ✅ P1: CORS fuer lokale Frontend-Origin konfigurieren
9. ✅ P1: Health-Check Endpoint erstellen
10. ✅ P1: Startscripts fuer Frontend/Backend definieren

## Milestone 1: Vertical Slice

11. ✅ P0: Grundlegende GameScene in Phaser erstellen
12. ✅ P0: Tilemap-Raster als Platzhalter darstellen
13. ✅ P0: Buildable- und Path-Tiles trennen
14. ✅ P0: Pfadbewegung fuer Gegner implementieren
15. ✅ P0: Gegnertyp normal konfigurieren
16. ✅ P0: Gegnertyp schnell konfigurieren
17. ✅ P0: Turmtyp Dampfkanone implementieren
18. ✅ P0: Turmtyp Tesla implementieren
19. ✅ P0: Targeting-System implementieren
20. ✅ P0: Projectile- und Trefferlogik implementieren
21. ✅ P0: Goldsystem (Killreward, Kaufkosten) implementieren
22. ❌ P2: Upgrade-Logik (Post-Release, verschoben)
23. ✅ P1: Verkaufslogik (Shift+Click, 75% Rueckerstattung)
24. ✅ P1: Wellensteuerung implementieren
25. ✅ P1: Inter-Wave-Timer + initiale Build-Pause
26. ✅ P1: HUD fuer Level, Gegner, Wellen-Timer, Gold
27. ✅ P1: Win/Lose-Zustand implementieren
28. ✅ P1: POST /api/v1/runs implementiert (Run + Analytics)
29. ✅ P1: GET /api/v1/scores (Top-Limit, sortiert) implementiert
30. ✅ P1: Namenseingabe nach Run-Ende (3-10 Zeichen)
31. ✅ P1: Score-Submit aus Frontend ans Backend

## Milestone 2: Core Gameplay Complete

32. ✅ P0: 3 Level anlegen (Beginner/Advanced/Ultimate)
33. ✅ P0: WaveSets fuer 15/20/25 Wellen
34. ✅ P0: Gegnertyp gepanzert (armored)
35. ❌ P0: Gegnertyp heiler (Post-Release)
36. ❌ P0: Zwischenboss (Post-Release)
37. ❌ P0: Split-Mechanik (Post-Release)
38. ❌ P0: Endboss (Post-Release)
39. ✅ P0: Leak-Schaden je Gegnertyp
40. ✅ P0: Turmtyp Hochdruck-Kanone
41. ❌ P0: Turmtyp Dampfmoerser (entfernt - kein Nutzen)
42. ✅ P0: Turmtyp Flammwerfer (Beam + Nachbrennen)
43. ✅ P0: Turmtyp Generator (Buff, nicht stapelbar)
44. ❌ P2: Ult-Upgrade-Logik (Post-Release)
45. ✅ P1: DoT-System + Armored-Resistenz
46. ✅ P1: Kettenblitz Tesla (Instant, Ghost-fix)
47. ❌ P1: AoE Moerser (entfernt)
48. ❌ P2: Upgrade-UI (Post-Release)
49. ✅ P1: Balancing-Werte in Config-Dateien ausgelagert
49b. ✅ P1: Wellen-Skalierung +14% HP pro Welle
49c. ✅ P1: Auto-Progression Kampagne + kumulatives Scoring
49d. ✅ P1: Speed-Toggle Taste S (1x/2x)

## Milestone 3: UI/UX und Highscore Final

50. ✅ P0: Highscore-Ansicht (Top-10) im Frontend
51. ✅ P0: Sortierung und Ranking visualisiert
52. ✅ P1: Validierungsfehler fuer playerName
53. ✅ P1: Feedback bei ungueltiger Turmplatzierung
54. ✅ P1: Feedback bei zu wenig Gold
55. ⏳ P1: Platzhalter-UI-Icons integrieren
56. ⏳ P1: Basis-SFX einbauen
57. ⏳ P2: Feinjustierung HUD-Lesbarkeit

## Milestone 4: Stabilisierung und Release Candidate

58. ✅ P0: API Input-Validierung serverseitig umgesetzt
59. ✅ P0: Rate-Limiting auf Score-POST
59a. ⏳ P0: Score-Trust hardening (Client-Score serverseitig verifizieren oder neu berechnen)
59b. ⏳ P0: towerUsageByLevel serverseitig strikt validieren (Schema/Bounds/Unknown-Fields)
60. ✅ P0: SQL-Injection-Risiko minimiert (Supabase Client Inserts)
61. ✅ P1: Smoke-Testliste ausgefuehrt (lokal + deployed)
62. ✅ P1: Edge Cases Basisvalidierung getestet
63. ✅ P1: Fehler-Logging im Backend
64. ⏳ P1: Performance-Pass fuer hohe Gegnerdichte
65. ✅ P2: Build-Optimierung Frontend (Vite Build clean)
66. ✅ P2: Deployment-Readiness-Check

## Querschnittstasks (laufend)

67. ⏳ P1: Konfigurationsschemas dokumentieren
68. ✅ P1: Changelog-Notizen je Sitzung gepflegt
69. ⏳ P1: Regressionsbugs als Tests absichern
70. ⏳ P2: Platzhalter-Assets durch finale Assets ersetzen
71. ⏳ P1: Punkte-System Feintuning nach Tester-Runs (Gewichtung Kill/Wave/Clear/Gold/Perfection validieren)

## Empfohlene Reihenfolge naechste Session
1. Balancing Level 2/3 mit externen Tester-Daten feinjustieren
2. Punkte-System Feintuning (Scoring-Gewichte auf Basis echter Runs justieren)
3. Score-Trust hardening: Client-Score nicht mehr als Wahrheit behandeln
4. towerUsageByLevel serverseitig strikt validieren
5. Supabase service-role key rotieren und in Render aktualisieren
6. Rate-Limits/Token-TTL anhand echter Nutzung nachjustieren
7. Grafik-/Asset-Phase planen
