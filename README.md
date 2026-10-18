# Tavernenduell 2015

Nachbau des Sammelkartenspiels mit dem Regelwerk und den Kartenwerten von 2015 – alle Inhalte bis
einschließlich **Schwarzfels**: Basis, Klassik, Naxxramas, Goblins gegen Gnome, Schwarzfels
(566 sammelbare Karten plus alle Token). Alle Karten sind immer frei verfügbar.

## Starten

```bash
node server.js          # dann http://localhost:8080 öffnen
```

Keine Abhängigkeiten, nur Node.js ≥ 18. Ohne Server kann `index.html` auch direkt geöffnet werden
(dann ohne Online-Duell).

## Modi

- **Gegen die KI** – der Computer simuliert jeden möglichen Zug und wählt den besten.
- **Duell online** – „Raum erstellen“ liefert einen 5-stelligen Code; der Freund öffnet dieselbe
  Adresse, wählt „Duell“ und tritt bei. Für Spiele über das Internet muss der Server erreichbar sein
  (z. B. auf einem kleinen Server/Hoster mit `PORT`-Variable oder per Portfreigabe).
  Der Server prüft jeden Zug mit derselben Regel-Engine; nach Neuladen der Seite geht es weiter.
- **Duell lokal** – zwei Spieler an einem Gerät, die Hand wird bei jeder Übergabe verdeckt.
- **Deck-Editor** – Decks bauen (30 Karten, max. 2 Kopien, Legendäre 1×), Manakurve, Filter nach
  Kosten/Set/Typ/Text, Deckcodes zum Teilen. Neun Startdecks bekannter Archetypen von 2015 sind dabei.

## Bedienung

Karte anklicken → ggf. Platz auf dem Brett wählen → ggf. Ziel anklicken. Diener/Held anklicken →
Angriffsziel anklicken. Rechtsklick oder Esc bricht ab. Mauszeiger über Karten zeigt Details.

## Umgesetzte Mechaniken

Mana/Überladung, Münze, Mulligan, Erschöpfung, Handlimit 10, Brettlimit 7, Spott, Ansturm,
Gottesschild, Verstohlenheit, Windzorn/Mega-Windzorn, Einfrieren, Zauberschaden, Kampfschrei,
Todesröcheln, Wutanfall, Combo, Wählt aus, Geheimnisse (nur im gegnerischen Zug), Stille,
Auren (inkl. korrekter Leben-Rückrechnung), Kostenmodifikatoren, Todesphasen in Ausspielreihenfolge,
Immunität, „nicht als Ziel wählbar“, Heldenwechsel (Jaraxxus, Ragnaros), Ersatzteile, Ogerfehlangriffe,
Nozdormus 15-Sekunden-Timer u. v. m.

## Tests

```bash
npm test     # Regeltests + tausende Zufallspartien über alle Karten
```

## Hinweis

Enthält keine Originalgrafiken, Logos, Sounds oder Flavor-Texte; Kartentexte sind eigene
Regelbeschreibungen. Privates Fanprojekt, nicht kommerziell.

## Aufbau

- `src/engine.js` – Regel-Engine (Zustand ist reines JSON → klonbar und deterministisch)
- `src/cards/*.js` – Kartendefinitionen je Set
- `src/ai.js` – Aktionen und KI · `src/decks.js` – Deckregeln, Startdecks
- `src/ui.js`, `src/style.css`, `index.html` – Oberfläche · `src/net.js` + `server.js` – Online-Duell
