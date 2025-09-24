// Global: window.Spion
(function(){
  const $ = (sel, root = document) => root.querySelector(sel);
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffle = (arr) => arr.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);

  // Basis-Kategorien mit Beispielwörtern
  const BASE_CATS = {
    jobs: { name:'Jobs', words:[
      'Arzt','Lehrer','Polizist','Pilot','Bäcker','Programmierer','Gärtner','Kellner','Designer','Fotograf','Mechaniker','Tierarzt','Feuerwehrmann','Journalist','Architekt'
    ]},
    gegenstaende: { name:'Gegenstände', words:[
      'Schlüssel','Uhr','Rucksack','Kamera','Regenschirm','Brille','Buch','Stift','Ball','Tasche','Telefon','Flasche','Laptop','Kopfhörer','Kerze'
    ]},
    orte: { name:'Orte', words:[
      'Schule','Supermarkt','Strand','Park','Bahnhof','Flughafen','Kino','Museum','Bibliothek','Krankenhaus','Restaurant','Bäckerei','Schwimmbad','Zoo','Stadion'
    ]},
    laender: { name:'Länder', words:[
      'Deutschland','Frankreich','Spanien','Italien','Österreich','Schweiz','Polen','Niederlande','Belgien','Portugal','Schweden','Norwegen','Dänemark','Griechenland','Türkei'
    ]},
    tiere: { name:'Tiere', words:[
      'Hund','Katze','Pferd','Löwe','Tiger','Elefant','Fisch','Vogel','Pinguin','Eule','Affe','Giraffe','Bär','Känguru','Fuchs'
    ]},
  };

  // Standardzustand
  const defaults = () => ({
    players: ['Spieler 1','Spieler 2','Spieler 3'],
    spyMode: 'fixed',           // 'fixed' | 'random-any' | 'random-range'
    spies: 1,                   // für fixed
    spiesMin: 1, spiesMax: 1,   // für range
    categories: {               // Auswahl + eigene Kategorien
      selected: { jobs:true, gegenstaende:true, orte:true },
      custom: []                // {id, name, words:[]}
    },
    started: false,
    round: { index: 0, revealed: false, word: null, categoryKey: null, roles: [] },
    usedWords: [],
    revealSpyCount: true
  });

  function ensureState(app){
    app.spion = app.spion || {};
    // migrieren/auffüllen
    app.spion = { ...defaults(), ...app.spion };
    // falls selected fehlt
    if (!app.spion.categories || !app.spion.categories.selected) {
      app.spion.categories = { selected: { jobs:true, gegenstaende:true, orte:true }, custom: [] };
    }
    return app.spion;
  }

  function isConfigured(spion){
  const playersOk = Array.isArray(spion.players) && spion.players.length >= 3;
  const sel = selectedCategories(spion);
  const wordsOk = sel.totalWords > 0;
  return playersOk && wordsOk;
}


  // ---------- Router ----------
  function route(hash, appState){
  const spion = ensureState(appState);
  const app = document.getElementById('app');

  if (hash === '/spion') {
    // Wenn schon konfiguriert → direkt ins Spiel, sonst ins Setup
    if (isConfigured(spion)) {
      location.hash = '#/spion/play';
    } else {
      location.hash = '#/spion/setup';
    }
    return;
  }

  if (hash === '/spion/setup') {
    renderSetup(app, spion, appState);
    return;
  }

  if (hash === '/spion/play') {
    renderPlay(app, spion, appState);
    return;
  }

  // fallback
  location.hash = '#/spion/setup';
}


  // ---------- Setup View ----------
  function renderSetup(root, spion, appState){
    const playerInputs = spion.players.map((name,i)=>playerRow(i+1,name)).join('');
    const catList = renderCategoryChecklist(spion);

    root.innerHTML = `
      <article class="card">
        <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:8px;">
          <a href="#/" class="btn small">← Menü</a>
          <a href="#/spion/play" class="btn small ghost" id="goPlay">Zum Spiel</a>
        </div>
        <h2>🕵️‍♀️ Spion – Einstellungen</h2>
        <p class="subtitle">Spieler, Spione & Kategorien festlegen. Alles wird lokal gespeichert.</p>

        <div class="form">

          <div class="row">
            <label class="title">Anzahl Spieler</label>
            <div class="row inline">
              <input type="number" id="playerCount" min="3" max="20" value="${spion.players.length}" />
              <button class="btn" id="applyCount">Anwenden</button>
            </div>
            <p class="hint">Mindestens 3 (1 Spion + 2 andere).</p>
          </div>

          <div class="row">
            <label class="title">Namen</label>
            <div class="players" id="playersBox">${playerInputs}</div>
          </div>

          <div class="row">
            <label class="title">Anzahl Spione</label>
            <div class="row">
              <select id="spyMode">
                <option value="fixed" ${spion.spyMode==='fixed'?'selected':''}>Fixe Anzahl</option>
                <option value="random-any" ${spion.spyMode==='random-any'?'selected':''}>Zufällig (1..Spieleranzahl)</option>
                <option value="random-range" ${spion.spyMode==='random-range'?'selected':''}>Zufällig im Bereich</option>
              </select>
            </div>

          <div class="row">
            <label class="title">Info für Spione</label>
            <label style="display:flex; align-items:center; gap:10px;">
                <input type="checkbox" id="revealSpyCount" ${spion.revealSpyCount ? 'checked' : ''}>
                Spione sehen, wie viele Spione es gibt
            </label>
           </div>


            <div class="row inline" id="spyFixed" style="display:${spion.spyMode==='fixed'?'grid':'none'}">
              <input type="number" id="spyCount" min="1" max="${spion.players.length}" value="${spion.spies}"/>
              <div class="hint">mind. 1, max. Spieleranzahl</div>
            </div>

            <div class="row inline" id="spyRange" style="display:${spion.spyMode==='random-range'?'grid':'none'}">
              <input type="number" id="spyMin" min="1" max="${spion.players.length}" value="${spion.spiesMin}"/>
              <input type="number" id="spyMax" min="1" max="${spion.players.length}" value="${spion.spiesMax}"/>
            </div>
          </div>

          <div class="row">
            <label class="title">Kategorien</label>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
              <button class="btn small ghost" id="allCats">Alle auswählen</button>
              <button class="btn small ghost" id="noneCats">Keine</button>
            </div>
            <div class="checklist" id="catList">${catList}</div>
            <p class="hint">Du kannst eigene Kategorien unten ergänzen.</p>
          </div>

          <div class="row">
            <label class="title">Benutzte Wörter</label>
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span class="badge">benutzt: ${spion.usedWords?.length || 0}</span>
                <button class="btn small ghost" id="clearUsedWords">Verwendete Wörter löschen</button>
            </div>
            <p class="hint">Nur der Wort-Verlauf wird gelöscht. Deine Spieler & Einstellungen bleiben.</p>
          </div>

          <div class="row">
            <label class="title">Eigene Kategorie hinzufügen</label>
            <input type="text" id="customCatName" placeholder="Name der Kategorie (z. B. Süßigkeiten)" />
            <textarea id="customCatWords" rows="2" placeholder="Wörter, durch Komma getrennt (z. B. Schokolade, Gummibärchen, Keks)"></textarea>
            <button class="btn small" id="addCustomCat">Hinzufügen</button>
            <div id="customList" style="margin-top:8px;"></div>
          </div>

          <div class="row">
            <button class="btn accent" id="saveGo">Speichern & Weiter</button>
          </div>
        </div>
      </article>
    `;

    // Events
    $('#applyCount').addEventListener('click', () => {
      let n = parseInt($('#playerCount').value || '3', 10);
      n = Math.max(3, Math.min(20, n));
      const cur = spion.players.slice();
      if (n > cur.length) {
        for (let i=cur.length; i<n; i++) cur.push(`Spieler ${i+1}`);
      } else {
        cur.length = n;
      }
      spion.players = cur;
      window.__saveAppState();
      renderSetup(root, spion, appState);
    });

    // Namen live übernehmen
    $('#playersBox').addEventListener('input', (e)=>{
      if (e.target.matches('input[data-i]')) {
        const i = +e.target.dataset.i;
        spion.players[i] = e.target.value || `Spieler ${i+1}`;
        window.__saveAppState();
      }
    });

    // Spy mode
    $('#spyMode').addEventListener('change', (e)=>{
      spion.spyMode = e.target.value;
      window.__saveAppState();
      $('#spyFixed').style.display = spion.spyMode==='fixed' ? 'grid' : 'none';
      $('#spyRange').style.display = spion.spyMode==='random-range' ? 'grid' : 'none';
    });
    const clampSpies = () => {
      const max = spion.players.length;
      spion.spies = Math.max(1, Math.min(max, parseInt($('#spyCount')?.value || spion.spies,10)));
      spion.spiesMin = Math.max(1, Math.min(max, parseInt($('#spyMin')?.value || spion.spiesMin,10)));
      spion.spiesMax = Math.max(1, Math.min(max, parseInt($('#spyMax')?.value || spion.spiesMax,10)));
      if (spion.spiesMin > spion.spiesMax) spion.spiesMax = spion.spiesMin;
      window.__saveAppState();
    };
    $('#spyFixed')?.addEventListener('input', clampSpies);
    $('#spyRange')?.addEventListener('input', clampSpies);

    $('#revealSpyCount').addEventListener('change', (e)=>{
    spion.revealSpyCount = e.target.checked;
    window.__saveAppState();
    });


    // Kategorien toggles
    $('#catList').addEventListener('change', (e)=>{
      if (e.target.matches('input[type="checkbox"][data-cat]')) {
        const key = e.target.dataset.cat;
        spion.categories.selected[key] = e.target.checked;
        window.__saveAppState();
      }
    });
    $('#allCats').addEventListener('click', ()=>{
      Object.keys(allCategoryMap(spion)).forEach(k => spion.categories.selected[k] = true);
      window.__saveAppState(); renderSetup(root, spion, appState);
    });
    $('#noneCats').addEventListener('click', ()=>{
      Object.keys(allCategoryMap(spion)).forEach(k => spion.categories.selected[k] = false);
      window.__saveAppState(); renderSetup(root, spion, appState);
    });
     
    $('#clearUsedWords').addEventListener('click', ()=>{
    if (!spion.usedWords?.length) { toast('Es gibt keine benutzten Wörter.'); return; }
    const ok = confirm('Benutzte Wörter wirklich löschen?\nDann können Wörter wieder gezogen werden.');
    if (!ok) return;
    spion.usedWords = [];
    window.__saveAppState();
    renderSetup(root, spion, appState);
    toast('Benutzte Wörter gelöscht.');
    });

    // Eigene Kategorie hinzufügen
    $('#addCustomCat').addEventListener('click', ()=>{
      const name = ($('#customCatName').value || '').trim();
      const words = ($('#customCatWords').value || '')
        .split(',').map(s=>s.trim()).filter(Boolean);
      if (!name || words.length === 0) { toast('Bitte Namen & Wörter angeben.'); return; }
      const id = 'custom_' + Date.now().toString(36);
      spion.categories.custom.push({ id, name, words });
      spion.categories.selected['custom:'+id] = true;
      $('#customCatName').value = ''; $('#customCatWords').value = '';
      window.__saveAppState();
      renderSetup(root, spion, appState);
      toast('Kategorie hinzugefügt');
    });

    // Speichern & Weiter
    $('#saveGo').addEventListener('click', ()=>{
      // Validierung
      if (spion.players.length < 3) { toast('Mindestens 3 Spieler.'); return; }
      const sel = selectedCategories(spion);
      if (sel.totalWords === 0) { toast('Mindestens 1 Kategorie mit Wörtern auswählen.'); return; }
      location.hash = '#/spion/play';
    });

    // kleine Liste eigener Kategorien anzeigen
    renderCustomList(spion);
  }

  function playerRow(i, name){
    return `
      <div class="playerrow">
        <span class="badge">#${i}</span>
        <input type="text" data-i="${i-1}" value="${escapeHtml(name)}" />
      </div>
    `;
  }

  function renderCategoryChecklist(spion){
    const map = allCategoryMap(spion);
    return Object.entries(map).map(([key,c])=>{
      const checked = !!spion.categories.selected[key];
      return `
        <div class="checkitem">
          <label style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" data-cat="${key}" ${checked?'checked':''} />
            ${c.name}
          </label>
          <span class="hint">${c.words.length} Wörter</span>
        </div>
      `;
    }).join('');
  }

  function allCategoryMap(spion){
    const base = { ...BASE_CATS };
    const customEntries = Object.fromEntries(
      (spion.categories.custom||[]).map(c => ['custom:'+c.id, { name:c.name, words:c.words }])
    );
    return { ...base, ...customEntries };
  }

  function selectedCategories(spion){
    const map = allCategoryMap(spion);
    const keys = Object.keys(spion.categories.selected).filter(k => spion.categories.selected[k]);
    const words = keys.flatMap(k => map[k]?.words || []);
    return { keys, words, totalWords: words.length };
  }
  
  function getAvailableWords(spion){
  const all = selectedCategories(spion).words;
  if (!all.length) return [];
  const usedSet = new Set(spion.usedWords || []);
  return all.filter(w => !usedSet.has(w));
}

function addUsedWord(spion, word){
  spion.usedWords = spion.usedWords || [];
  if (!spion.usedWords.includes(word)) spion.usedWords.push(word);
}


  function renderCustomList(spion){
    const list = $('#customList');
    if (!list) return;
    if (!spion.categories.custom?.length){ list.innerHTML = ''; return; }
    list.innerHTML = spion.categories.custom.map(c => `
      <div class="badge">${escapeHtml(c.name)} • ${c.words.length} Wörter</div>
    `).join(' ');
  }

  // ---------- Play View ----------
  function renderPlay(root, spion, appState){
    // Headerleiste
    root.innerHTML = `
      <article class="card">
        <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:8px;">
          <a href="#/" class="btn small">← Menü</a>
          <a href="#/spion/setup" class="btn small">⚙️ Einstellungen</a>
        </div>
        <h2>🕵️‍♀️ Spion – Spiel</h2>
        <p class="subtitle">Gib das Handy reihum weiter und deckt eure Karten nacheinander auf.</p>
        <div id="playArea"></div>
      </article>
    `;

    const area = $('#playArea');

    if (!spion.started) {
      area.innerHTML = `
        <div class="row">
          <p class="hint">Bereit für die Runde?</p>
          <button class="btn accent" id="startRound">Start</button>
        </div>
      `;
      $('#startRound').addEventListener('click', ()=>{
        startNewRound(spion);
        window.__saveAppState();
        renderPlay(root, spion, appState);
      });
      return;
    }

    // Runde läuft
    const i = spion.round.index;
    if (i >= spion.players.length) {
      area.innerHTML = `
        <div class="row">
          <h3>Viel Spaß beim Spielen! 🎉</h3>
          <div class="row" style="margin-top:8px; display:flex; gap:10px;">
            <button class="btn accent" id="newRound">Neue Runde starten</button>
          </div>
        </div>
      `;
      $('#newRound').addEventListener('click', ()=>{
        startNewRound(spion); window.__saveAppState(); renderPlay(root, spion, appState);
      });
      return;
    }

    // Karte rendern
    const name = spion.players[i];
    area.innerHTML = `
      <div class="row">
        <div class="badge">Spieler ${i+1} / ${spion.players.length}</div>
        <div class="stage">
          <div class="flip ${spion.round.revealed ? 'revealed' : ''}" id="flip">
            <div class="face front">
              <div class="hint">Tippe, um die Karte aufzudecken</div>
              <div class="word">${escapeHtml(name)}</div>
            </div>
            <div class="face back">
              ${spion.round.roles[i] === 'spy'
                ? `<div>
                    <div class="spy">SPION</div>
                    ${spion.revealSpyCount ? `<div class="hint">Ihr seid ${spion.round.spiesCount}</div>` : ``}
                    </div>`
                : `<div>
                    <div class="hint">Wort</div>
                    <div class="word">${escapeHtml(spion.round.word)}</div>
                    </div>`
                }

            </div>
          </div>
        </div>
        <div style="display:flex; gap:10px; justify-content:center; margin-top:10px;">
          <button class="btn" id="tapBtn">${spion.round.revealed ? 'Weitergeben' : 'Aufdecken'}</button>
        </div>
      </div>
    `;

    const flip = $('#flip');
    const tap = $('#tapBtn');

    const handleTap = () => {
      if (!spion.round.revealed) {
        spion.round.revealed = true;
      } else {
        // nächste Person
        spion.round.revealed = false;
        spion.round.index += 1;
      }
      window.__saveAppState();
      // UI aktualisieren
      renderPlay(root, spion, appState);
    };

    flip.addEventListener('click', handleTap);
    tap.addEventListener('click', handleTap);
  }

  function startNewRound(spion){
    const n = spion.players.length;
    const max = n;
    // Anzahl Spione bestimmen
    let spiesN = 1;
    if (spion.spyMode === 'fixed') {
      spiesN = clamp(spion.spies, 1, max);
    } else if (spion.spyMode === 'random-any') {
      spiesN = randInt(1, max);
    } else if (spion.spyMode === 'random-range') {
      const min = clamp(spion.spiesMin, 1, max);
      const maxv = clamp(spion.spiesMax, 1, max);
      const lo = Math.min(min, maxv);
      const hi = Math.max(min, maxv);
      spiesN = randInt(lo, hi);
    }
    spiesN = Math.min(spiesN, n); // Sicherheit

    // Wort auswählen – ohne Wiederholung
    let pool = getAvailableWords(spion);
    if (pool.length === 0) {
    // Alles aufgebraucht → automatisch zurücksetzen (nur Wortpool)
    spion.usedWords = [];
    pool = getAvailableWords(spion);
    toast('Alle Wörter wurden schon benutzt – Pool zurückgesetzt.');
    }
    const word = pool[randInt(0, pool.length - 1)];
    addUsedWord(spion, word);


    // Rollen vorbereiten
    const roles = Array(spiesN).fill('spy').concat(Array(n - spiesN).fill('word'));
    const shuffled = shuffle(roles);

    spion.started = true;
    spion.round = { index: 0, revealed: false, word, roles: shuffled , spiesCount: spiesN };
  }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // Exponieren
  window.Spion = { route };
})();
