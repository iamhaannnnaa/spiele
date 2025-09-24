(() => {
  const APP_KEY = 'hanna-spiel:v1';
  const $ = (sel, root = document) => root.querySelector(sel);

  const state = loadState();

  function loadState(){
    try {
      return JSON.parse(localStorage.getItem(APP_KEY)) || { spion: { selected: {} } };
    } catch {
      return { spion: { selected: {} } };
    }
  }
  function saveState(){
    localStorage.setItem(APP_KEY, JSON.stringify(state));
  }

  function toast(msg){
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.hidden = true), 1800);
  }

  // ---------- Views ----------
  function renderHome(){
    const app = $('#app');
    app.innerHTML = `
      <section class="grid">
        <article class="card">
          <h2>Spiele</h2>
          <p class="subtitle">Wähle ein Spiel aus dem Menü.</p>
          <a class="primary" href="#/spion" aria-label="Spion öffnen">🕵️‍♀️ Spion öffnen</a>
        </article>

        <article class="card">
          <h2>Status</h2>
          <p class="subtitle">
            Gespeicherte Auswahl in <strong>Spion</strong>:
            <span class="count" id="selCount">0</span>
          </p>
          <p class="subtitle">Unten rechts kannst du jederzeit alles löschen.</p>
        </article>
      </section>
    `;
    // update counter
    const c = Object.values(state.spion.selected).filter(Boolean).length;
    $('#selCount').textContent = c;
  }

  function renderSpion(){
    const app = $('#app');
    const options = [
      { id:'brille', name:'Spionbrille' },
      { id:'notiz', name:'Geheim-Notizbuch' },
      { id:'verkleidung', name:'Verkleidung' },
    ];
    // Stelle sicher, dass das Objekt existiert
    state.spion = state.spion || { selected:{} };

    app.innerHTML = `
      <article class="card">
        <a href="#/" class="primary" style="margin-bottom:10px; display:inline-flex; width:auto; padding:8px 12px;">← Zurück</a>
        <h2>🕵️‍♀️ Spion</h2>
        <p class="subtitle">Platzhalter. Hier kannst du testweise Dinge auswählen (wird gespeichert).</p>

        <div class="list" id="spionList"></div>
      </article>
    `;

    const list = $('#spionList');
    list.innerHTML = options.map(o => {
      const checked = !!state.spion.selected[o.id];
      return `
        <div class="row">
          <label>
            <input type="checkbox" data-id="${o.id}" ${checked ? 'checked' : ''}>
            ${o.name}
          </label>
          ${checked ? '<span class="count">gewählt</span>' : '<span class="count" style="opacity:.5">aus</span>'}
        </div>
      `;
    }).join('');

    // Events
    list.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"][data-id]')) {
        const id = e.target.getAttribute('data-id');
        state.spion.selected[id] = e.target.checked;
        saveState();
        toast('Gespeichert');
        // Re-render nur die Badges
        renderSpion();
      }
    });
  }

  // ---------- Router ----------
  function route(){
    const h = location.hash.replace('#','');
    if (h === '/spion') renderSpion();
    else renderHome();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', route);

  // ---------- Reset Button ----------
  const resetBtn = $('#resetBtn');
  resetBtn.addEventListener('click', () => {
    const really = confirm('Alles zurücksetzen?\nGespeicherte Auswahlen werden gelöscht.');
    if (!really) return;
    try {
      // nur unsere App-Daten löschen:
      localStorage.removeItem(APP_KEY);
      // falls du auch Sitzungszustand nutzt:
      sessionStorage.clear();
    } catch {}
    // State neu aufsetzen & zur Startseite
    Object.assign(state, { spion: { selected: {} } });
    location.hash = '#/';
    route();
    toast('Zurückgesetzt');
  });

})();
