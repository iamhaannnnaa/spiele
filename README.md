# Hanna Spiel (Webapp)

Kleine mobile Webapp mit Menü, „Spion“ (Platzhalter) und Reset-Button (unten rechts).
Hosted via GitHub Pages.

## Schnellstart
1. `git init && git add . && git commit -m "init"`
2. Repo zu GitHub pushen (origin/main).
3. GitHub Pages aktivieren: Settings → Pages → Deploy from a branch → main / (root).
4. Öffnen: `https://<DEIN_USERNAME>.github.io/hanna-spiel/`

## Entwickeln
- `index.html`, `styles.css`, `app.js` bearbeiten.
- `app.js` nutzt LocalStorage unter dem Schlüssel `hanna-spiel:v1`.
- Der Reset-Button löscht alle gespeicherten Inhalte dieser App und setzt den Bildschirm zurück.

## Nächste Schritte
- „Spion“-Logik ausbauen (richtige Spielregeln, Screens).
- Optional PWA (manifest + service worker), App-Icon, Splash.
