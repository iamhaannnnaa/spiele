(() => {
  const APP_KEY = 'hanna-spiel:v1';
  const $ = (sel, root = document) => root.querySelector(sel);

  const state = loadState();

  function loadState(){
    try { return JSON.parse(localStorage.getItem(APP_KEY)) || { spion: {} }; }
    catch { return { spion: {} }; }
  }
  function saveState(){ localStorage.setItem(APP_KEY, JSON.stringify(state)); }
  window.__saveAppState = saveState; // damit spion.js speichern kann

  // ---------- Views ----------
  function renderHome(){
    const app = $('#app');
    app.innerHTML = `
      <section class="grid">
        <article class="card">
          <h2>Spiele</h2>
          <p class="subtitle">Wähle ein Spiel aus dem Menü.</p>
          <a class="primary" href="#/spion/setup" aria-label="Spion öffnen">🕵️‍♀️ Spion öffnen</a>
        </article>

        <article class="card">
          <h2>Status</h2>
          <p class="subtitle">
            Konfiguration <strong>Spion</strong>:
            <span class="count" id="selCount">${state?.spion?.players?.length || 0} Spieler</span>
          </p>
          <p class="subtitle">Unten rechts kannst du jederzeit alles löschen.</p>
        </article>
      </section>
    `;
  }

  // ---------- Router ----------
  function route(){
    const h = location.hash.replace('#','');
    if (h.startsWith('/spion')) {
      // delegiert ans Modul
      if (window.Spion) window.Spion.route(h, state);
      else renderHome();
      return;
    }
    renderHome();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', route);

  // ---------- Reset Button ----------
  const resetBtn = $('#resetBtn');
  resetBtn.addEventListener('click', () => {
    const really = confirm('Alles zurücksetzen?\nGespeicherte Auswahlen werden gelöscht.');
    if (!really) return;
    try {
      localStorage.removeItem(APP_KEY);
      sessionStorage.clear();
    } catch {}
    Object.assign(state, { spion: {} });
    location.hash = '#/';
    route();
    toast('Zurückgesetzt');
  });

  function toast(msg){
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(el._t); el._t = setTimeout(() => (el.hidden = true), 1800);
  }
  window.toast = toast; // für spion.js
})();
