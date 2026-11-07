# Kanban Flow Simulator & Analytics Studio

Eine moderne, interaktive Web-Simulation zur Visualisierung, Analyse und Optimierung von Fluss in Kanban-Systemen – basierend auf dem Python-Original mit erweitertem Kennzahlen-Cockpit (CFD, Flusseffizienz, Lead Time, Cost of Delay) und A/B-Rundenvergleich.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Basierend auf Ihren Antworten in der Klärungsphase wurden die folgenden Kernentscheidungen für die Architektur und das Feature-Set festgelegt:

- **Confirmed Decision 1 (Moderne Web-App):** Wir bauen direkt eine moderne, reaktive Web-App in TypeScript & React, die die Original-Logik aus `KanbanSim-V1.0.py` nahtlos aufgreift und mit professionellen Kanban-Werkzeugen erweitert.
- **Confirmed Decision 2 (Kennzahlen & Experimente):** Integration von interaktivem Kumulativem Flussdiagramm (CFD), Cycle-Time-Scatterplot, Live-Flusseffizienz ($\text{BZ} / (\text{BZ} + \text{WZ})$) sowie A/B-Rundenvergleich zum wissenschaftlichen Testen unterschiedlicher WiP-Limits und Engpass-Konfigurationen.
- **Confirmed Decision 3 (Steuerung & Animation):** Flüssige, physikalisch nachvollziehbare Kartenübergänge mit Play, Pause, Einzelschritt (Step-by-Step), stufenlosem Tempo-Regler (1x bis 10x) und Sofort-Reset.
- **Offene Option (Stochastik vs. Deterministisch):** Standardmäßig deterministischer Komplexitätsmodus wie im Python-Skript (1, 2, 5 Tage), zuschaltbar mit stochastischen Würfelzeiten (z.B. 1–6 Tage mit Varianz) für realitätsnahe Kanban-Experimente.

---

### 1. Overview & Core Concept

- **Was die App tut:**
  Eine visuelle Simulationsumgebung für Kanban- und Flow-Prinzipien. Sie demonstriert anschaulich die Auswirkungen von WiP-Limits (Work in Progress), Engpässen (Bottlenecks) und Express-Karten (Expedite / Red Card) auf Durchsatz, Zykluszeiten, Wartezeiten und Kosten von Verzögerungen (Cost of Delay).
- **Zielgruppe & Einsatzbereich:**
  Agile Coaches, Kanban-Trainer (z.B. von it-agile), Scrum Master, Engineering Leads und Teams, die Little's Law, Flusseffizienz und Engpasstheorie in Workshops, Trainings oder Selbststudien interaktiv begreifbar machen wollen.
- **Hauptnutzen:**
  Praktisches Erleben von *„Stop starting, start finishing“*: Nutzer können direkt sehen, wie ein reduziertes WiP-Limit Warteschlangen vor Engpässen abbaut, die Flusseffizienz drastisch steigert und die Durchlaufzeit der dringenden roten Karte verkürzt.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Board-Ansicht & Live-Simulation:**
   - Der Nutzer sieht das 8-Spalten-Kanban-Board: *Backlog (0)* $\rightarrow$ *Schritt A (1)* $\rightarrow$ *Warten... (2)* $\rightarrow$ *Schritt B (3)* $\rightarrow$ *Warten... (4)* $\rightarrow$ *Schritt C (5)* $\rightarrow$ *Warten... (6)* $\rightarrow$ *Done (7)*.
   - Karten gleiten animiert von Spalte zu Spalte. In den Arbeitsschritten läuft ein Fortschrittsring/-balken (Processing Days).
   - Nach konfigurierbarer Vorlaufzeit (Standard: 10s oder Tag 10) wird die prominente **rote Expedite-Karte** im Backlog getauft.
   - Sobald die rote Karte Done erreicht, stoppt die Runde automatisch oder läuft im Endlosmodus weiter; Kennzahlen werden archiviert.
2. **Interaktive Steuerung (Control Deck):**
   - Play/Pause, Step-Next-Day, Neustart mit aktuellem Parametersatz.
   - WiP-Limit Schieberegler/Eingabefeld (greift auf die Spaltenpaare wie im Original).
   - Einstellbare Komplexitätsfaktoren pro Arbeitsschritt (Standard A: 1, B: 2, C: 5).
3. **Analytics & Kennzahlen-Cockpit:**
   - **Tabelle der Runden:** Historie mit WiP-Limit, Durchlaufzeit rote Karte, Flusseffizienz in %, Karten In Progress, Done-Anzahl und Durchsatz.
   - **Kumulatives Flussdiagramm (CFD):** Reaktiv gezeichnetes Flächendiagramm der Karten über die Tage in den verschiedenen Zuständen (Backlog, WIP, Done).
   - **Cost of Delay Chart:** Balkendiagramm pro Runde analog zum Python-Original mit Farbcodierung und Vergleichswerten.
   - **A/B-Runden-Vergleichsmodus:** Gegenüberstellung zweier Konfigurationen (z.B. Hohes WiP = 12 vs. Niedriges WiP = 4).
4. **Szenario-Presets:**
   - Ein-Klick-Szenarien: *Klassischer Engpass (Original)*, *Overburdened System (Kein Limit)*, *Optimierter Flow (WiP = 3)*, *Balancierte Linie*.

#### Visual Identity & Theme
- **Ästhetik:** Professionell, aufgeräumt, funktional im Geiste moderner agiler Dashboards und wissenschaftlicher Simulationen. Keine verspielten Farb-Gradienten oder künstliche Pseudo-Telemetry.
- **Farben & Kontrast (60-30-10):**
  - *Canvas (60%):* Neutraler, warmer Heller Hintergrund (`#F8FAFC` / `#FFFFFF`) mit subtilen Spalten-Shadings wie im Original (`#F1F5F9`).
  - *Struktur & Typografie (30%):* Scharfe Haarlinien (`#E2E8F0`), dunkles Schiefergrau für Text (`#0F172A`, `#475569`).
  - *Akzente (10%):*
    - Standard-Karten: Solides Agiles Schiefergrau (`#64748B` / `#7B8388` wie im Original).
    - Expedite / Rote Karte: Intensives Signal-Rot (`#DC2626` / `#CA0633`).
    - Aktive Status & Flow: Sattes Indigo/Blau (`#2563EB`) für aktive Timer und Primär-Aktionen.
    - it-agile Brand-Badge / Hommage dezent im Header platziert.
- **Typografie:**
  - Headlines & Brand: `Plus Jakarta Sans` (SemiBold / Bold).
  - Daten, Timer & Tabellen: `IBM Plex Mono` / `tabular-nums` für perfekte vertikale Ziffernausrichtung.

---

### 3. Key Product Decisions & Trade-Offs

- **Entscheidung 1: Zustand & Animations-Engine:**
  - *Ansatz:* Diskrete Simulations-Schritte (Takt-basiertes Modell in Millisekunden oder manuellen Schritten) gekoppelt mit flüssigen CSS-/Motion-Transforms für die Kartenbewegungen.
  - *Warum:* Verhindert das „Driften“ des Python `after()`-Loops und ermöglicht sowohl flüssige visuelle Anschauung als auch deterministische Kennzahlen und deterministische Replays.
- **Entscheidung 2: Spalten-Architektur & Paarung:**
  - *Ansatz:* Unterstützung sowohl des Original-Musters (gekoppelte WiP-Limits für In-Progress + Warteschlange: `[A + Warten A]`, `[B + Warten B]`, `[C + Warten C]`) als auch individueller Spalten-WiP-Limits.
  - *Warum:* Das Original nutzt gezielt Spaltenpaare, um Little's Law und Pufferbildung zu demonstrieren. Diese Mechanik bleibt im Kern unverändert erhalten.
- **Entscheidung 3: Reines Client-Side State Management:**
  - *Ansatz:* Vollständig reaktiver React-State mit optionalem Export/Import der Simulationsläufe als JSON/CSV.
  - *Warum:* Keine Server-Latenz, sofortige Ausführung im Browser, ideal für Präsentationen und Offline-Workshops.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Kanban App Root                                 │
├──────────────────────────────────────┬──────────────────────────────────────┤
│              Header Bar              │  Controls & Simulation Toolbar       │
│  - Titel & it-agile Hommage          │  - Play / Pause / Step / Speed       │
│  - Preset-Auswahl (Original, Flow)   │  - WiP-Limit / Reset / New Round     │
├──────────────────────────────────────┴──────────────────────────────────────┤
│                           Kanban Board Stage                                │
│ ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬───────┐ │
│ │ Backlog │Schritt A│ Warten  │Schritt B│ Warten  │Schritt C│ Warten  │ Done  │ │
│ │ (Col 0) │ (Col 1) │ (Col 2) │ (Col 3) │ (Col 4) │ (Col 5) │ (Col 6) │ (Col 7│ │
│ └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴───────┘ │
│                  ▲                 ▲                 ▲                      │
│                  └──── WiP-Pair ───┘──── WiP-Pair ───┘─── WiP-Pair ─────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                          Analytics & Insights Tabs                          │
│ ┌───────────────────────────┬───────────────────────────┬─────────────────┐ │
│ │ Cumulative Flow (CFD)     │ Cost of Delay Bar Chart   │ Round History   │ │
│ │ Interaktives SVG-Flächen- │ Vergleich der Runden &    │ Metrik-Tabelle  │ │
│ │ diagramm aller Zustände   │ rote Karten-Durchlaufzeit │ mit Export      │ │
│ └───────────────────────────┴───────────────────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Datenmodell & Entitäten
- **`Card`:**
  - `id`: Eindeutige Karten-ID.
  - `birthId`: Nummerierung wie im Original.
  - `col`: Aktuelle Spalte ($0 \dots 7$).
  - `targetCol`: Zielspalte während Transition.
  - `isRed`: Flag für die rote Expedite-Karte.
  - `startDay`: Tag, an dem die Karte in Arbeit (Spalte 1) gezogen wurde.
  - `finishDay`: Tag des Erreichens von Done.
  - `cycleTime`: Durchlaufzeit (`finishDay - startDay`).
  - `processingTime`: Aktuell geleistete Arbeitstage im Schritt.
  - `activeTime (BZ)`: Kumulierte Zeit in aktiven Arbeitsschritten.
  - `waitingTime (WZ)`: Kumulierte Zeit in Warte-Spalten.
- **`SimulationState`:**
  - `dayCount`: Aktueller virtueller Simulationstag.
  - `wipLimit`: Aktives WiP-Limit (Standard: 10 / 12).
  - `complexities`: Map der Bearbeitungszeiten pro Schritt `{ 1: 1, 3: 2, 5: 5 }`.
  - `cards`: Liste aller Karten auf dem Board.
  - `cfdHistory`: Zeithistorie für jeden Tag mit Kartenanzahl je Spaltenkategorie.
  - `roundHistory`: Archivierte Runden für den A/B- und Vorher-Nachher-Vergleich.

#### Nächste Schritte nach Freigabe:
1. `metadata.json` und `index.html` mit Titel und Beschreibung konfigurieren.
2. Kern-Simulationsmodell (`src/types/kanban.ts`, `src/simulation/engine.ts`) implementieren.
3. Komponenten für Kanban-Board, animierte Karten und Steuerung erstellen.
4. Kennzahlen-Cockpit mit CFD-Visualisierung, Cost-of-Delay-Chart und Runden-Tabelle ausbauen.
5. Verifikation via `compile_applet` und `lint_applet`.
