/* Oberfläche: Menü, Deckwahl, Spiel, Deck-Editor */
(function () {
  'use strict';
  const HS = window.HS;
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const tip = document.getElementById('tip');
  const toastEl = document.getElementById('toast');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const GLYPH = { druid: '❦', hunter: '➶', mage: '✦', paladin: '✚', priest: '☀', rogue: '✧', shaman: '☈', warlock: '✺', warrior: '⚒', neutral: '◆' };
  const CLASS_KEYS = Object.keys(HS.CLASSES);

  /* ---------------- Speicher ---------------- */
  const Store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* egal */ } },
    decks() { return this.get('hs2015_decks', []); },
    saveDecks(d) { this.set('hs2015_decks', d); },
  };
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.add('hidden'), 2600);
  }
  function showModal(html) { modal.innerHTML = `<div class="dialog">${html}</div>`; modal.classList.remove('hidden'); return modal.firstChild; }
  function hideModal() { modal.classList.add('hidden'); modal.innerHTML = ''; }
  /* eigener Bestätigungsdialog (window.confirm ist nicht überall verfügbar) */
  function ask(msg, yes) {
    const d = showModal(`<h2>${esc(msg)}</h2><div class="row" style="justify-content:center"><button id="no">Abbrechen</button><button class="primary" id="yes">Ja</button></div>`);
    d.querySelector('#no').onclick = () => hideModal();
    d.querySelector('#yes').onclick = () => { hideModal(); yes(); };
  }

  /* ---------------- Kartendarstellung ---------------- */
  function fmtText(t) { return t.replace(/\*(\d+)\*/g, '<b class="sd">$1</b>'); }
  const TYPE = { minion: 'Diener', spell: 'Zauber', weapon: 'Waffe' };
  function artTag(cardId, cls) {
    const u = HS.artUrl(cardId);
    return u ? `<img src="${u}" alt="" draggable="false" loading="lazy">` : `<span class="noart">${GLYPH[cls] || '◆'}</span>`;
  }
  function cardHTML(g, e, cardId, extra) {
    const d = e ? g.def(e) : HS.card(cardId);
    const cost = e && g ? g.cost(e) : d.cost;
    const costCls = cost < d.cost ? 'down' : cost > d.cost ? 'up' : '';
    let stats = '';
    if (d.type === 'minion' || d.type === 'weapon') {
      const a = e && g ? g.atk(e) : d.atk;
      const h = e && g ? g.hp(e) : d.hp;
      stats = `<div class="c-atk ${a > d.atk ? 'up' : a < d.atk ? 'dn' : ''}">${a}</div><div class="c-hp ${h > d.hp ? 'up' : h < d.hp ? 'dn' : ''}">${h}</div>`;
    }
    const text = e && g ? g.text(e) : HS.textOf(d);
    const type = (TYPE[d.type] || '') + (d.race ? ' — ' + HS.RACES[d.race] : d.secret ? ' — Geheimnis' : '');
    const nm = d.name.length > 22 ? 'xlong' : d.name.length > 15 ? 'long' : '';
    return `<div class="card cls-${d.cls} rar-${d.rarity} type-${d.type} ${extra || ''}" ${e ? `data-eid="${e.id}"` : `data-cid="${d.id}"`}>
      <div class="c-name ${nm}">${esc(d.name)}</div>
      <div class="c-cost ${costCls}">${cost}</div>
      <div class="c-art">${artTag(d.id, d.cls)}</div>
      <div class="c-type">${type}<i class="c-gem"></i></div>
      <div class="c-text"><div>${fmtText(text)}</div></div>${stats}</div>`;
  }

  /* ---------------- Deckauswahl ---------------- */
  function deckOptions(cls) {
    const opts = [];
    for (const d of Store.decks()) if (!HS.validateDeck(d.cls, d.cards).length && (!cls || d.cls === cls)) opts.push({ v: 'user:' + d.id, t: `★ ${d.name} (${HS.CLASSES[d.cls].name})` });
    HS.PRESETS.forEach((p, i) => { if (!cls || p.cls === cls) opts.push({ v: 'preset:' + i, t: `${p.name} (${HS.CLASSES[p.cls].name})` }); });
    for (const k of CLASS_KEYS) if (!cls || k === cls) opts.push({ v: 'random:' + k, t: `Zufallsdeck – ${HS.CLASSES[k].name}` });
    return opts;
  }
  function deckSelect(id, val) {
    return `<select id="${id}">${deckOptions().map((o) => `<option value="${o.v}" ${o.v === val ? 'selected' : ''}>${esc(o.t)}</option>`).join('')}</select>`;
  }
  function resolveDeck(v) {
    const [kind, key] = v.split(':');
    if (kind === 'user') {
      const d = Store.decks().find((x) => x.id === key);
      if (d) return { cls: d.cls, cards: d.cards.slice(), name: d.name };
    }
    if (kind === 'preset') { const p = HS.PRESETS[+key]; return { cls: p.cls, cards: HS.fixDeck(p.cls, p.cards), name: p.name }; }
    const cls = kind === 'random' ? key : 'mage';
    return { cls, cards: HS.randomDeck(cls), name: 'Zufallsdeck' };
  }

  function arenaSelect(id, val) {
    return `<select id="${id}"><option value="random">Zufälliges Spielfeld</option>${HS.ARENAS.map((a) => `<option value="${a.id}" ${a.id === val ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>`;
  }
  const pickArena = (v) => (v && v !== 'random' ? v : HS.ARENAS[Math.floor(Math.random() * HS.ARENAS.length)].id);

  /* ================= Menü ================= */
  const UI = {
    screen: 'menu',
    menu() {
      this.stopGame();
      this.screen = 'menu';
      const online = HS.Net.available();
      app.innerHTML = `<div class="menu">
        <h1>Tavernenduell 2015</h1>
        <div class="sub">Kartenduell mit allen Inhalten bis einschließlich Schwarzfels · ${HS.collectible().length} Karten · alle freigeschaltet</div>
        <div class="menu-grid">
          <div class="menu-tile" data-go="ai"><b>Gegen die KI</b><span>Übungspartie gegen den Computer.</span></div>
          <div class="menu-tile" data-go="duel"><b>Duell</b><span>Gegen Freunde – online per Raumcode oder lokal an einem Gerät.</span></div>
          <div class="menu-tile" data-go="editor"><b>Deck-Editor</b><span>Eigene Decks bauen, alle Karten verfügbar.</span></div>
        </div>
        ${online ? '' : '<p class="err" style="margin-top:20px">Online-Duelle gegen Freunde brauchen den mitgelieferten Server (<code>node server.js</code>). Hier gehen KI-Partie, lokales Duell und Deck-Editor.</p>'}
      </div>`;
      app.querySelectorAll('[data-go]').forEach((t) => (t.onclick = () => this[t.dataset.go + 'Setup']()));
    },

    aiSetup() {
      const last = Store.get('hs2015_last', {});
      app.innerHTML = `<div class="menu"><h1>Gegen die KI</h1><div class="box">
        <label>Dein Deck</label>${deckSelect('d0', last.ai0 || 'preset:2')}
        <label>Deck der KI</label><select id="d1"><option value="any">Zufälliges Startdeck</option>${deckOptions().map((o) => `<option value="${o.v}" ${o.v === last.ai1 ? 'selected' : ''}>${esc(o.t)}</option>`).join('')}</select>
        <label>Spielfeld</label>${arenaSelect('arena', last.arena)}
        <div class="row end" style="margin-top:16px"><button id="back">Zurück</button><button class="primary" id="go">Spielen</button></div></div></div>`;
      app.querySelector('#back').onclick = () => this.menu();
      app.querySelector('#go').onclick = () => {
        const v0 = app.querySelector('#d0').value, v1 = app.querySelector('#d1').value;
        Store.set('hs2015_last', Object.assign(last, { ai0: v0, ai1: v1 }));
        const d0 = resolveDeck(v0);
        const d1 = v1 === 'any' ? resolveDeck('preset:' + Math.floor(Math.random() * HS.PRESETS.length)) : resolveDeck(v1);
        d0.name = 'Du (' + HS.CLASSES[d0.cls].name + ')';
        d1.name = 'KI (' + HS.CLASSES[d1.cls].name + ')';
        const av = app.querySelector('#arena').value;
        Store.set('hs2015_last', Object.assign(last, { arena: av }));
        this.startGame('ai', [d0, d1], { first: Math.random() < 0.5 ? 0 : 1, arena: pickArena(av) });
      };
    },

    duelSetup() {
      const last = Store.get('hs2015_last', {});
      const online = HS.Net.available();
      app.innerHTML = `<div class="menu"><h1>Duell</h1>
        <div class="box"><label style="margin-top:0">Spielfeld (für dich)</label>${arenaSelect('arena', last.arena)}</div>
        <div class="box"><h2>Online gegen Freunde</h2>
          ${online ? `<label>Dein Name</label><input type="text" id="pname" maxlength="24" value="${esc(last.pname || '')}" placeholder="Spieler">
          <label>Dein Deck</label>${deckSelect('od', last.od || 'preset:0')}
          <div class="row" style="margin-top:14px"><button class="primary" id="create">Raum erstellen</button>
            <input type="text" id="code" maxlength="5" placeholder="CODE" style="width:110px;text-transform:uppercase"><button id="join">Beitreten</button></div>
          <div id="oerr" class="err"></div>` : '<p class="err">Nur verfügbar, wenn das Spiel über <code>node server.js</code> geöffnet wird.</p>'}
        </div>
        <div class="box"><h2>Lokal an einem Gerät</h2>
          <label>Spieler 1</label><div class="row"><input type="text" id="n0" style="flex:1" value="${esc(last.n0 || 'Spieler 1')}">${deckSelect('l0', last.l0 || 'preset:7')}</div>
          <label>Spieler 2</label><div class="row"><input type="text" id="n1" style="flex:1" value="${esc(last.n1 || 'Spieler 2')}">${deckSelect('l1', last.l1 || 'preset:8')}</div>
          <div class="row end" style="margin-top:14px"><button class="primary" id="local">Lokales Duell starten</button></div>
        </div>
        <div class="row end" style="max-width:620px;margin:0 auto"><button id="back">Zurück</button></div></div>`;
      app.querySelector('#back').onclick = () => this.menu();
      app.querySelector('#local').onclick = () => {
        const v = ['l0', 'l1'].map((k) => app.querySelector('#' + k).value);
        const n = ['n0', 'n1'].map((k) => app.querySelector('#' + k).value.trim() || k);
        Store.set('hs2015_last', Object.assign(last, { l0: v[0], l1: v[1], n0: n[0], n1: n[1] }));
        const d = v.map(resolveDeck);
        d[0].name = n[0]; d[1].name = n[1];
        const av = app.querySelector('#arena').value;
        Store.set('hs2015_last', Object.assign(last, { arena: av }));
        this.startGame('hotseat', d, { first: Math.random() < 0.5 ? 0 : 1, arena: pickArena(av) });
      };
      if (!online) return;
      const err = app.querySelector('#oerr');
      const getDeck = () => {
        const v = app.querySelector('#od').value;
        const name = app.querySelector('#pname').value.trim() || 'Spieler';
        Store.set('hs2015_last', Object.assign(last, { od: v, pname: name, arena: app.querySelector('#arena').value }));
        const d = resolveDeck(v);
        return { cls: d.cls, cards: d.cards, player: name };
      };
      app.querySelector('#create').onclick = async () => {
        try { const r = await HS.Net.create(getDeck(), this.netHandlers()); this.lobby(r.room); } catch (e) { err.textContent = e.message; }
      };
      app.querySelector('#join').onclick = async () => {
        const c = app.querySelector('#code').value;
        if (!c.trim()) { err.textContent = 'Bitte einen Raumcode eingeben.'; return; }
        try { await HS.Net.join(c, getDeck(), this.netHandlers()); this.lobby(c.toUpperCase(), true); } catch (e) { err.textContent = e.message; }
      };
    },

    lobby(code, joining) {
      this.screen = 'lobby';
      app.innerHTML = `<div class="menu"><h1>Online-Duell</h1><div class="box" style="text-align:center">
        ${joining ? '<p>Verbinde …</p>' : `<p>Gib deinem Freund diesen Raumcode:</p><div class="code">${esc(code)}</div>
        <p style="color:var(--muted)">Er öffnet dieselbe Adresse (${esc(location.host)}), wählt „Duell“ und tritt mit dem Code bei.</p><p>Warte auf Gegner …</p>`}
        <button id="cancel">Abbrechen</button></div></div>`;
      app.querySelector('#cancel').onclick = () => { HS.Net.forget(); this.menu(); };
    },

    netHandlers() {
      return {
        event: (ev) => this.onNet(ev),
        error: () => { if (this.mode === 'online' && this.g && this.g.s.phase !== 'over') this.setHint('Verbindung unterbrochen – versuche erneut …'); },
      };
    },
    onNet(ev) {
      if (ev.type === 'hello') {
        this.netSeat = ev.seat;
        this.netApplied = 0;
        if (ev.waiting && this.screen !== 'lobby') this.lobby(ev.room);
        return;
      }
      if (ev.type === 'start') {
        this.startGame('online', ev.decks.map((d) => ({ cls: d.cls, cards: d.cards, name: d.name })), { seed: ev.seed, first: ev.first, seat: this.netSeat, arena: pickArena(Store.get('hs2015_last', {}).arena) });
        return;
      }
      if (ev.type === 'action' && this.g && this.mode === 'online') {
        const g = this.g;
        const a = ev.action;
        this.queue = (this.queue || Promise.resolve()).then(() => {
          if (this.g !== g) return;
          const mine = ev.seat === this.seat;
          if (!mine && a.type === 'play' && g.ent(a.id)) this.showcase(g.ent(a.id).card, g.P(ev.seat).name);
          const anim = !mine && a.type === 'attack' ? this.animateAttack(a.a, a.d) : Promise.resolve();
          return anim.then(() => {
            if (mine) this.busy = false;
            this.snapshot();
            HS.applyAction(g, ev.seat, a);
            this.after();
          });
        });
      }
    },

    /* ================= Spiel ================= */
    startGame(mode, decks, o) {
      this.stopGame();
      this.mode = mode;
      this.arenaId = o.arena || pickArena('random');
      this.ambience = null;
      this.g = HS.Game.create({ decks, seed: o.seed, first: o.first });
      this.seat = mode === 'online' ? o.seat : 0;
      this.sel = null;
      this.mull = [];
      this.busy = false;
      this.shownSeat = null;
      this.prev = null;
      this.screen = 'game';
      if (mode === 'ai') HS.applyAction(this.g, 1, { type: 'mulligan', ids: HS.AI.mulligan(this.g, 1) });
      this.render();
      this.checkOverlays();
    },
    stopGame() {
      HS.stopAmbience();
      this.ambience = null;
      clearTimeout(this.aiTimer); this.aiTimer = null;
      clearInterval(this.timer); this.timer = null;
      hideModal();
      tip.classList.add('hidden');
      if (this.mode === 'online' && this.screen === 'game') HS.Net.forget();
      this.g = null;
    },
    /* Wer sitzt unten? */
    view() {
      if (this.mode === 'hotseat') {
        const g = this.g;
        if (g.s.phase === 'mulligan') return g.P(g.s.first).mullDone ? 1 - g.s.first : g.s.first;
        return g.s.pending ? g.s.pending.player : g.cur;
      }
      return this.seat;
    },
    actor() {
      const g = this.g;
      if (g.s.phase === 'mulligan') return this.view();
      return g.s.pending ? g.s.pending.player : g.cur;
    },
    canAct() {
      const g = this.g;
      if (!g || g.s.phase !== 'play' || this.busy || this.animating) return false;
      if (this.mode === 'hotseat') return this.shownSeat === this.actor();
      return this.actor() === this.seat;
    },
    act(a, seat) {
      if (seat == null) seat = this.actor();
      this.sel = null;
      this.pending = null;
      this.arrow(null);
      app.querySelectorAll('.ghost').forEach((x) => x.remove());
      if (this.mode === 'online') {
        this.busy = true;
        HS.Net.send(a).catch((e) => { this.busy = false; toast(e.message); this.render(); });
        this.render();
        return;
      }
      this.snapshot();
      if (!HS.applyAction(this.g, seat, a)) toast('Diese Aktion ist nicht möglich.');
      this.after();
    },
    snapshot() {
      const g = this.g;
      const m = {};
      for (const c of g.chars()) m[c.id] = g.hp(c) + (c.armor || 0);
      this.prev = m;
    },
    after() {
      this.render();
      this.playFx();
      this.checkOverlays();
      this.scheduleAI();
    },
    scheduleAI() {
      const g = this.g;
      if (this.mode !== 'ai' || !g || g.s.phase !== 'play' || this.aiTimer) return;
      if (this.actor() !== 1) return;
      this.aiTimer = setTimeout(() => {
        this.aiThink(g).then((a) => {
          this.aiTimer = null;
          if (!this.g || this.g !== g || g.s.phase !== 'play' || this.actor() !== 1) return;
          this.flashIds = a.type === 'play' && a.target ? [a.target] : a.type === 'power' && a.target ? [a.target] : [];
          if (a.type === 'play' && g.ent(a.id)) this.showcase(g.ent(a.id).card, g.P(1).name);
          const go = () => { if (this.g !== g) return; this.snapshot(); HS.applyAction(g, 1, a); this.after(); };
          if (a.type === 'attack') this.animateAttack(a.a, a.d).then(go);
          else setTimeout(go, a.type === 'play' ? 450 : 0);
        });
      }, 550);
    },

    /* KI-Zug im Worker berechnen; ohne Worker (z. B. file://) direkt */
    aiThink(g) {
      if (this.worker === undefined) {
        try { this.worker = new Worker('src/aiworker.js'); this.worker.onerror = () => { this.worker = null; }; } catch (e) { this.worker = null; }
      }
      if (!this.worker) return new Promise((res) => setTimeout(() => res(HS.AI.choose(g, 1)), 0));
      const id = (this.aiReq = (this.aiReq || 0) + 1);
      return new Promise((res) => {
        const to = setTimeout(() => { this.worker.onmessage = null; res(HS.AI.choose(g, 1)); }, 8000);
        this.worker.onmessage = (m) => { if (m.data.id !== id) return; clearTimeout(to); res(m.data.a); };
        this.worker.onerror = () => { clearTimeout(to); this.worker = null; res(HS.AI.choose(g, 1)); };
        this.worker.postMessage({ id, s: g.s, pi: 1 });
      });
    },
    checkOverlays() {
      const g = this.g;
      if (!g) return;
      if (g.s.phase === 'over') return this.gameOver();
      if (g.s.phase === 'mulligan') {
        const v = this.view();
        const mySeat = this.mode === 'hotseat' ? v : this.seat;
        if (g.P(mySeat).mullDone) { if (this.mode === 'online') showModal('<h2>Warte auf den Gegner …</h2>'); return; }
        if (this.mode === 'hotseat' && this.shownSeat !== mySeat) return this.passDevice(mySeat, () => this.mulliganDialog(mySeat));
        return this.mulliganDialog(mySeat);
      }
      hideModal();
      if (this.mode === 'hotseat' && this.shownSeat !== this.actor()) return this.passDevice(this.actor());
      if (g.s.pending && g.s.pending.player === (this.mode === 'hotseat' ? this.shownSeat : this.seat)) this.pendingDialog();
      this.startTimer();
    },
    passDevice(seat, then) {
      const d = showModal(`<h2>Gerät an ${esc(this.g.P(seat).name)} übergeben</h2><p style="color:var(--muted)">Die Handkarten bleiben bis zur Bestätigung verdeckt.</p><button class="primary" id="ok">Ich bin ${esc(this.g.P(seat).name)}</button>`);
      app.querySelector('.hand') && (app.querySelector('.hand').style.visibility = 'hidden');
      d.querySelector('#ok').onclick = () => {
        this.shownSeat = seat;
        hideModal();
        this.render();
        if (then) then(); else this.checkOverlays();
      };
    },
    mulliganDialog(seat) {
      const g = this.g;
      const p = g.P(seat);
      const sel = new Set();
      const draw = () => {
        const d = showModal(`<h2>Starthand – ${esc(p.name)}</h2><p>${seat === g.s.first ? 'Du beginnst.' : 'Du bist Zweiter und erhältst „Die Münze“.'} Klicke Karten an, die du austauschen möchtest.</p>
          <div class="cards">${p.mull.map((id) => cardHTML(g, g.ent(id), null, sel.has(id) ? 'replace' : '')).join('')}</div>
          <button class="primary" id="ok">Bestätigen</button>`);
        d.querySelectorAll('.card').forEach((c) => (c.onclick = () => { const id = +c.dataset.eid; sel.has(id) ? sel.delete(id) : sel.add(id); draw(); }));
        d.querySelector('#ok').onclick = () => { hideModal(); this.act({ type: 'mulligan', ids: [...sel] }, seat); };
      };
      draw();
    },
    pendingDialog() {
      const g = this.g;
      const pd = g.s.pending;
      const d = showModal(`<h2>Wähle eine Karte</h2><div class="cards">${pd.options.map((id, i) => `<div data-i="${i}">${cardHTML(g, g.ent(id))}</div>`).join('')}</div>`);
      d.querySelectorAll('[data-i]').forEach((c) => (c.onclick = () => { hideModal(); this.act({ type: 'choose', idx: +c.dataset.i }); }));
    },
    gameOver() {
      clearInterval(this.timer);
      const g = this.g;
      const w = g.s.winner;
      let title;
      if (w < 0) title = 'Unentschieden!';
      else if (this.mode === 'hotseat') title = `${esc(g.P(w).name)} gewinnt!`;
      else title = w === this.seat ? 'Sieg!' : 'Niederlage';
      const d = showModal(`<h1>${title}</h1><div class="row" style="justify-content:center"><button id="look">Brett ansehen</button><button class="primary" id="menu">Hauptmenü</button></div>`);
      d.querySelector('#menu').onclick = () => { if (this.mode === 'online') HS.Net.forget(); this.menu(); };
      d.querySelector('#look').onclick = () => hideModal();
    },
    startTimer() {
      clearInterval(this.timer);
      this.timer = null;
      const g = this.g;
      if (!g || g.s.phase !== 'play' || !this.canAct()) return;
      if (!g.board().some((m) => m.card === 'nozdormu' && !m.silenced)) return;
      const key = g.s.turn;
      if (this.timerTurn !== key) { this.timerTurn = key; this.timerEnd = Date.now() + 15000; }
      this.timer = setInterval(() => {
        const left = Math.ceil((this.timerEnd - Date.now()) / 1000);
        const t = app.querySelector('.timer');
        if (t) t.textContent = `Nozdormu: ${Math.max(0, left)} s`;
        if (left <= 0) { clearInterval(this.timer); this.timer = null; if (this.g === g && g.s.turn === key && this.canAct()) this.act({ type: 'end' }); }
      }, 250);
    },
    setHint(t) { const h = app.querySelector('.hint'); if (h) h.textContent = t; },

    /* ---------- Rendern ---------- */
    render() {
      const g = this.g;
      if (!g) return;
      const me = this.view();
      const op = 1 - me;
      const act = this.canAct();
      const hideOwn = this.mode === 'hotseat' && this.shownSeat !== me;
      const sel = this.sel;
      const tgt = new Set(sel && sel.targets ? sel.targets.map((t) => t.id) : []);
      const known = this.knownIds || new Set();
      const nowIds = new Set();
      const mark = (e) => {
        const c = [];
        if (tgt.has(e.id)) c.push('targetable');
        if (sel && sel.id === e.id) c.push('selected');
        if (this.flashIds && this.flashIds.includes(e.id)) c.push('flash');
        return c.join(' ');
      };
      const floatFor = (e) => {
        if (!this.prev || this.prev[e.id] == null) return '';
        const d = g.hp(e) + (e.armor || 0) - this.prev[e.id];
        return d ? `<span class="float ${d < 0 ? 'dmg' : 'heal'}">${d > 0 ? '+' : ''}${d}</span>` : '';
      };
      const minion = (m) => {
        const d = g.def(m);
        nowIds.add(m.id);
        const ic = [];
        if ((!m.silenced && d.deathrattle) || m.ench.some((x) => x.card && HS.CARDS[x.card] && HS.CARDS[x.card].deathrattle)) ic.push('<i title="Todesröcheln">☠</i>');
        if (!m.silenced && (d.triggers || d.aura || d.costAura || d.auraKw)) ic.push('<i title="Effekt">ϟ</i>');
        if (g.has(m, 'windfury') || g.has(m, 'megaWindfury')) ic.push('<i title="Windzorn">≋</i>');
        if (g.has(m, 'poison')) ic.push('<i title="Giftig">☣</i>');
        if (g.has(m, 'immune')) ic.push('<i title="Immun">✪</i>');
        if (g.has(m, 'elusive')) ic.push('<i title="Nicht als Ziel wählbar">◌</i>');
        if ((!m.silenced && d.spellDamage) || m.ench.some((x) => x.sd)) ic.push('<i title="Zauberschaden">✷</i>');
        const a = g.atk(m), h = g.hp(m), mx = g.maxHp(m);
        const k = ['minion', 'cls-' + d.cls, mark(m)];
        if (g.has(m, 'taunt')) k.push('taunt');
        if (m.kw.divineShield) k.push('ds');
        if (g.has(m, 'stealth')) k.push('stealth');
        if (m.frozen) k.push('frozen');
        if (m.silenced) k.push('silenced');
        if (act && m.owner === g.cur && g.canAttack(m) && !sel) k.push('ready');
        const asleep = m.owner === g.cur && m.exhausted && !g.has(m, 'charge');
        if (!known.has(m.id)) k.push('enter');
        if (d.rarity === 'legendary') k.push('legend');
        return `<div class="${k.join(' ')}" data-eid="${m.id}"><div class="m-art">${artTag(m.card, d.cls)}</div><div class="m-frame"></div>
          <div class="m-icons">${ic.join('')}</div>${asleep ? '<div class="m-zzz">Zzz</div>' : ''}${d.race ? `<div class="m-race">${HS.RACES[d.race]}</div>` : ''}
          <div class="m-atk ${a > (d.atk || 0) ? 'up' : a < (d.atk || 0) ? 'dn' : ''}">${a}</div><div class="m-hp ${h < mx ? 'dn' : mx > d.hp ? 'up' : ''}">${h}</div>${floatFor(m)}</div>`;
      };
      const boardHTML = (i) => {
        const ms = g.board(i);
        const drop = i === me && this.dropPos != null ? this.dropPos : -1;
        let s = '';
        ms.forEach((m, k) => { if (k === drop) s += '<div class="gap"></div>'; s += minion(m); });
        if (drop >= ms.length) s += '<div class="gap"></div>';
        if (sel && sel.kind === 'pos' && i === me) {
          s = '<div class="slot" data-slot="0"></div>';
          ms.forEach((m, k) => { s += minion(m) + `<div class="slot" data-slot="${k + 1}"></div>`; });
        }
        return s || '<div class="empty-board"></div>';
      };
      const heroHTML = (i) => {
        const h = g.hero(i);
        const p = g.P(i);
        const a = g.atk(h);
        const k = ['hero', 'cls-' + p.cls, mark(h)];
        if (h.frozen) k.push('frozen');
        if (g.has(h, 'immune')) k.push('immune');
        if (act && i === g.cur && g.canAttack(h) && !sel) k.push('ready');
        const secrets = p.secrets.map((id) => `<div class="secret" data-eid="${id}" title="${i === me && !hideOwn ? esc(g.def(g.ent(id)).name) : 'Geheimnis'}">?</div>`).join('');
        return `<div class="${k.join(' ')}" data-eid="${h.id}"><div class="h-art"><span class="noart">${GLYPH[p.cls]}</span></div><div class="h-frame"></div>
          <div class="h-name">${esc(p.name)}</div><div class="secrets">${secrets}</div>
          ${a > 0 ? `<div class="h-atk">${a}</div>` : ''}${h.armor ? `<div class="h-arm">${h.armor}</div>` : ''}<div class="h-hp ${h.damage ? 'dn' : ''}">${g.hp(h)}</div>${floatFor(h)}</div>`;
      };
      const powerHTML = (i) => {
        const pw = g.power(i);
        const d = g.def(pw);
        const usable = act && i === g.cur && g.canPower(i) && !sel;
        return `<div class="power cls-${g.P(i).cls} ${g.P(i).powerUses ? 'used' : ''} ${usable ? 'playable' : ''} ${sel && sel.kind === 'power' && i === me ? 'selected' : ''}" data-power="${i}" data-eid="${pw.id}"><div class="p-cost">${d.cost}</div><div class="p-name">${esc(d.name)}</div></div>`;
      };
      const weaponHTML = (i) => {
        const w = g.weapon(i);
        if (!w) return '<div class="weapon empty"></div>';
        return `<div class="weapon" data-eid="${w.id}"><div class="w-art">${artTag(w.card, g.def(w).cls)}</div><div class="w-atk">${g.atk(w)}</div><div class="w-dur">${g.hp(w)}</div></div>`;
      };
      const manaHTML = (i) => {
        const p = g.P(i);
        let s = '';
        for (let k = 0; k < 10; k++) {
          const st = k < p.mana ? 'full' : k < p.maxMana - p.locked ? 'spent' : k < p.maxMana ? 'locked' : 'none';
          s += `<i class="${st}"></i>`;
        }
        return `<div class="mana"><div class="mana-count"><b>${p.mana}</b><small>/${p.maxMana}</small></div><span class="crystals">${s}</span>${p.overload ? `<em>+${p.overload} Überladung</em>` : ''}</div>`;
      };
      const pile = (i) => `<div class="pile" title="Deck"><div class="pile-cards">${g.P(i).deck.length}</div><span>Deck</span></div>`;
      const handCards = g.hand(me);
      const n = handCards.length;
      const myHand = handCards.map((c, i) => {
        const off = i - (n - 1) / 2;
        const style = `--rot:${(off * Math.min(5, 34 / Math.max(n, 1))).toFixed(1)}deg;--dy:${(off * off * 3).toFixed(0)}px;--i:${i}`;
        if (hideOwn) return `<div class="card back" style="${style}"></div>`;
        const pl = act && g.cur === me && g.canPlay(me, c) && !sel;
        const dragging = this.drag && this.drag.e === c && this.drag.moved;
        const cond = pl && g.def(c).cond && g.def(c).cond(g, c);
        return cardHTML(g, c, null, `${pl ? 'playable' : ''} ${cond ? 'cond' : ''} ${sel && sel.id === c.id ? 'selected' : ''} ${dragging ? 'lifted' : ''}`).replace('<div class="card', `<div style="${style}" class="card`);
      }).join('');
      const on = g.hand(op).length;
      const oppHand = g.hand(op).map((c, i) => `<div class="card back" style="--rot:${((i - (on - 1) / 2) * -4).toFixed(1)}deg"></div>`).join('');
      const myTurn = g.cur === me;
      const anyMove = act && myTurn && (g.hand(me).some((c) => g.canPlay(me, c)) || g.canPower(me) || g.chars(me).some((c) => g.canAttack(c)));
      const status = g.s.phase === 'over' ? 'Spiel beendet' : this.busy ? 'Sende …' : myTurn ? (this.mode === 'hotseat' ? `${esc(g.P(me).name)} ist am Zug` : 'Dein Zug') : `${esc(g.P(g.cur).name)} ist am Zug`;
      const hint = sel ? (sel.kind === 'pos' ? 'Platz für den Diener wählen' : sel.kind === 'attack' ? 'Angriffsziel wählen' : 'Ziel wählen') + ' · Rechtsklick/Esc bricht ab' : act && myTurn ? 'Karten aufs Brett ziehen · Diener auf Ziele ziehen' : '';
      const logOpen = this.logOpen ? '' : 'hidden';
      const oldMinions = this.captureMinions();
      this.lastPositions = oldMinions;
      const ar = HS.arena(this.arenaId);
      const aimg = HS.arenaImg(ar.id);
      const aStyle = `--a0:${ar.c[0]};--a1:${ar.c[1]};--a2:${ar.c[2]};--aline:${ar.line};--aglow:${ar.glow};${aimg ? `--aimg:url(${aimg});` : ''}`;
      const oldFx = this.ambience;
      app.innerHTML = `<div class="game"><div class="stage" id="stage">
        <div class="table arena-${ar.id}" data-arena="${ar.id}" style="${aStyle}"><div class="arena-name">${esc(ar.name)}</div>
          <div class="opp-hand">${oppHand}</div>
          <div class="hero-row opp">${pile(op)}${manaHTML(op)}${weaponHTML(op)}${heroHTML(op)}${powerHTML(op)}</div>
          <div class="board opp">${boardHTML(op)}</div>
          <div class="midline"></div>
          <div class="board me" id="myboard">${boardHTML(me)}</div>
          <div class="hero-row me">${pile(me)}${manaHTML(me)}${weaponHTML(me)}${heroHTML(me)}${powerHTML(me)}</div>
          <div class="hand ${n > 7 ? 'cramped' : ''}" id="myhand">${myHand}</div>
        </div>
        <button class="turnbtn ${act && myTurn && !anyMove ? 'ready' : ''} ${myTurn ? 'mine' : ''}" id="endturn" ${act && myTurn ? '' : 'disabled'}>${myTurn ? 'Zug beenden' : 'Gegnerzug'}</button>
        <div class="topbar"><button id="logbtn" title="Verlauf">☰ Verlauf</button><div class="status"><b>${status}</b> · Runde ${Math.ceil(g.s.turn / 2)} <span class="timer"></span></div><button id="tomenu">Menü</button><button id="concede" class="danger">Aufgeben</button></div>
        <div class="hint">${hint}</div>
        <div class="logpanel ${logOpen}" id="logpanel"><div class="log">${g.s.log.slice(-150).map((l) => `<div class="${l.startsWith('—') ? 'turn' : ''}">${esc(l)}</div>`).join('')}</div></div>
        <div class="pv-pop hidden" id="pv"></div>
        <div class="turn-banner" id="banner"></div>
      </div></div>`;
      this.fit();
      this.mountAmbience(oldFx);
      this.animateLeavers(oldMinions);
      const log = app.querySelector('.log');
      log.scrollTop = log.scrollHeight;
      this.knownIds = nowIds;
      this.prev = null;
      this.flashIds = null;
      if (myTurn && act && this.bannerTurn !== g.s.turn) { this.bannerTurn = g.s.turn; this.banner('Dein Zug'); }
      this.bind();
    },
    fit() {
      const st = document.getElementById('stage');
      if (!st) return;
      const portrait = innerHeight > innerWidth;
      const W = portrait ? 720 : 1280, H = portrait ? 1280 : 720;
      const sc = Math.min(innerWidth / W, innerHeight / H);
      this.scale = sc;
      st.classList.toggle('portrait', portrait);
      st.style.transform = `translate(${(innerWidth - W * sc) / 2}px, ${(innerHeight - H * sc) / 2}px) scale(${sc})`;
    },
    captureMinions() {
      const st = document.getElementById('stage');
      const out = new Map();
      if (!st || !this.scale) return out;
      const sr = st.getBoundingClientRect();
      for (const el of app.querySelectorAll('.board .minion')) {
        const r = el.getBoundingClientRect();
        out.set(+el.dataset.eid, { x: (r.left - sr.left) / this.scale, y: (r.top - sr.top) / this.scale, w: r.width / this.scale, h: r.height / this.scale, html: el.outerHTML });
      }
      return out;
    },
    /* Diener, die das Brett verlassen haben: zerbrechen (tot) oder zur Hand fliegen */
    animateLeavers(old) {
      const g = this.g;
      const st = document.getElementById('stage');
      if (!g || !st || !old.size) return;
      const now = new Set([...app.querySelectorAll('.board .minion')].map((el) => +el.dataset.eid));
      for (const [id, o] of old) {
        if (now.has(id)) continue;
        const e = g.ent(id);
        if (!e) continue;
        const ghost = document.createElement('div');
        ghost.className = 'leaver ' + (e.zone === 'hand' ? 'to-hand' : e.zone === 'grave' ? 'dies' : 'fades');
        ghost.style.cssText = `left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;--hand-dy:${e.owner === this.view() ? 260 : -260}px`;
        ghost.innerHTML = o.html.replace(/data-eid="\d+"/, '').replace(/class="minion[^"]*"/, 'class="minion"');
        if (e.zone === 'grave') ghost.insertAdjacentHTML('beforeend', '<span class="shard s1"></span><span class="shard s2"></span><span class="shard s3"></span><span class="shard s4"></span>');
        st.append(ghost);
        setTimeout(() => ghost.remove(), 900);
      }
    },
    /* Ereignisse aus der Engine sichtbar machen */
    playFx() {
      const g = this.g;
      if (!g || !g.fx.length) return;
      const list = g.fx.splice(0);
      const hits = list.filter((f) => f.type === 'hit');
      hits.forEach((h, i) => setTimeout(() => this.bolt(h, hits.length > 6), i * (hits.length > 6 ? 40 : 170)));
      for (const f of list) {
        if (f.type === 'secret') this.showcase(f.card, g.P(f.owner).name, 'Geheimnis aufgedeckt!');
        else if (f.type === 'shield') this.popAt(f.id, 'shieldpop', 'Gottesschild!');
        else if (f.type === 'misattack') this.popAt(f.id, 'misattack', 'Falsches Ziel!');
        else if (f.type === 'immune') this.popAt(f.id, 'immunepop', 'Immun');
      }
    },
    /* Position eines Elements (lebend oder gerade gestorben) in Bühnenkoordinaten */
    posOf(id) {
      const el = app.querySelector(`.table [data-eid="${id}"]`);
      if (el) { const o = this.captureOne(el); return [o.x + o.w / 2, o.y + o.h / 2]; }
      const o = this.lastPositions && this.lastPositions.get(id);
      return o ? [o.x + o.w / 2, o.y + o.h / 2] : null;
    },
    /* Einzeltreffer: Geschoss vom Verursacher zum Ziel, dann Einschlag mit Zahl */
    bolt(h, quick) {
      const st = document.getElementById('stage');
      if (!st) return;
      const to = this.posOf(h.id);
      if (!to) return;
      let from = h.src ? this.posOf(h.src) : null;
      if (!from && h.owner >= 0) from = this.posOf(this.g.P(h.owner).hero);
      const impact = () => {
        const p = document.createElement('div');
        p.className = 'impact';
        p.style.cssText = `left:${to[0]}px;top:${to[1]}px`;
        p.innerHTML = `<span>-${h.n}</span>`;
        st.append(p);
        setTimeout(() => p.remove(), 900);
      };
      if (quick || !from || (from[0] === to[0] && from[1] === to[1]) || matchMedia('(prefers-reduced-motion: reduce)').matches) return impact();
      const b = document.createElement('div');
      b.className = 'bolt';
      b.style.cssText = `left:${from[0]}px;top:${from[1]}px`;
      st.append(b);
      b.animate([{ transform: 'translate(-50%,-50%) scale(.6)' }, { transform: `translate(calc(${to[0] - from[0]}px - 50%), calc(${to[1] - from[1]}px - 50%)) scale(1)` }], { duration: 260, easing: 'cubic-bezier(.4,0,.8,.6)' }).finished.then(() => { b.remove(); impact(); }, () => b.remove());
    },
    popAt(id, cls, text) {
      const st = document.getElementById('stage');
      const el = app.querySelector(`.table [data-eid="${id}"]`);
      const o = this.captureOne(el);
      if (!st || !o) return;
      const p = document.createElement('div');
      p.className = 'pop ' + cls;
      p.textContent = text;
      p.style.cssText = `left:${o.x + o.w / 2}px;top:${o.y + o.h / 2}px`;
      st.append(p);
      setTimeout(() => p.remove(), 1300);
    },
    captureOne(el) {
      const st = document.getElementById('stage');
      if (!el || !st) return null;
      const sr = st.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { x: (r.left - sr.left) / this.scale, y: (r.top - sr.top) / this.scale, w: r.width / this.scale, h: r.height / this.scale };
    },
    /* Atmosphäre-Leinwand bleibt über Neuaufbauten hinweg erhalten */
    mountAmbience(old) {
      const table = app.querySelector('.table');
      if (!table) return;
      const st = document.getElementById('stage');
      const W = st.classList.contains('portrait') ? 720 : 1280, H = st.classList.contains('portrait') ? 1280 : 720;
      if (old && old.dataset.w == W && old.dataset.h == H && old.dataset.arena === this.arenaId) { table.prepend(old); return; }
      const cv = document.createElement('canvas');
      cv.className = 'ambience';
      cv.width = W; cv.height = H;
      cv.dataset.arena = this.arenaId;
      cv.dataset.w = W; cv.dataset.h = H;
      table.prepend(cv);
      this.ambience = cv;
      HS.startAmbience(cv, this.arenaId);
    },
    banner(text) {
      const b = app.querySelector('#banner');
      if (!b) return;
      b.textContent = text;
      b.classList.remove('show');
      void b.offsetWidth;
      b.classList.add('show');
    },
    showcase(cardId, who, label) {
      this.lastPlayed = { card: cardId, who };
      const el = document.createElement('div');
      el.className = 'showcase' + (label ? ' secretshow' : '');
      el.innerHTML = (label ? `<div class="sc-label">${esc(label)}</div>` : '') + cardHTML(null, null, cardId);
      document.body.append(el);
      setTimeout(() => el.remove(), label ? 2300 : 1700);
    },
    bind() {
      app.querySelector('#endturn').onclick = () => { if (this.canAct() && this.g.cur === this.view()) this.act({ type: 'end' }); };
      app.querySelector('#concede').onclick = () => { if (this.g.s.phase !== 'over') ask('Wirklich aufgeben?', () => this.concede()); };
      app.querySelector('#tomenu').onclick = () => { if (this.g.s.phase === 'over') this.menu(); else ask('Partie verlassen?', () => this.menu()); };
      app.querySelector('#logbtn').onclick = () => { this.logOpen = !this.logOpen; app.querySelector('#logpanel').classList.toggle('hidden', !this.logOpen); };
      app.querySelectorAll('.slot').forEach((s) => (s.onclick = (ev) => { ev.stopPropagation(); this.withPos(+s.dataset.slot); }));
      const table = app.querySelector('.table');
      table.onpointerdown = (ev) => this.down(ev);
      table.oncontextmenu = (ev) => { ev.preventDefault(); this.cancel(); };
    },
    concede() {
      const g = this.g;
      if (!g || g.s.phase === 'over') return;
      const seat = this.mode === 'hotseat' ? this.view() : this.seat;
      if (this.mode === 'online') { HS.Net.send({ type: 'concede' }).catch((e) => toast(e.message)); return; }
      this.act({ type: 'concede' }, seat);
    },
    cancel() { if (this.pending) return this.cancelPending(); this.sel = null; this.dropPos = null; this.arrow(null); if (this.g) this.render(); },

    /* ---------- Zeigen, Ziehen, Zielen ---------- */
    center(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; },
    arrow(from, to, ok) {
      let svg = document.getElementById('arrow');
      if (!from) { if (svg) svg.style.display = 'none'; return; }
      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'arrow';
        svg.innerHTML = '<defs><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs><path id="arrowpath" marker-end="url(#ah)"/><circle id="arrowdot" r="7"/>';
        document.body.append(svg);
      }
      svg.style.display = 'block';
      svg.classList.toggle('ok', !!ok);
      const [x0, y0] = from, [x1, y1] = to;
      const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - Math.abs(x1 - x0) * 0.25 - 40;
      svg.querySelector('#arrowpath').setAttribute('d', `M${x0},${y0} Q${mx},${my} ${x1},${y1}`);
      const dot = svg.querySelector('#arrowdot');
      dot.setAttribute('cx', x0); dot.setAttribute('cy', y0);
    },
    targetAt(x, y) {
      const el = document.elementFromPoint(x, y);
      const t = el && el.closest('[data-eid]');
      if (!t || !this.sel || !this.sel.targets) return null;
      return this.sel.targets.find((e) => e.id === +t.dataset.eid) || null;
    },
    /* Ziele direkt im DOM markieren (kein Neuaufbau während des Ziehens) */
    markTargets(list) {
      app.querySelectorAll('.targetable').forEach((el) => el.classList.remove('targetable'));
      if (list) for (const t of list) app.querySelectorAll(`.table [data-eid="${t.id}"]`).forEach((el) => el.classList.add('targetable'));
    },
    /* Bildschirm- in Bühnenkoordinaten */
    toStage(x, y) {
      const r = document.getElementById('stage').getBoundingClientRect();
      return [(x - r.left) / this.scale, (y - r.top) / this.scale];
    },
    /* Lücke im eigenen Brett öffnen: Diener links/rechts der Einfügestelle rücken auseinander */
    openGap(idx) {
      const d = this.drag || this.pending;
      const els = d && d.boardEls ? d.boardEls : [];
      const half = (els.length ? els[0].offsetWidth + 12 : 104) / 2;
      els.forEach((el, i) => { el.style.transform = idx == null ? '' : `translateX(${i < idx ? -half : half}px)`; });
    },
    insertIndex(x) {
      const d = this.drag;
      let i = 0;
      for (const cx of d.centers) if (x > cx) i++;
      return i;
    },
    inBoardZone(x, y) {
      const r = this.drag.boardRect;
      return x > r.left - 40 && x < r.right + 40 && y > r.top - 70 && y < r.bottom + 50;
    },
    moveGhost(x, y) {
      const d = this.drag;
      const [sx, sy] = this.toStage(x, y);
      d.gx = sx; d.gy = sy;
      d.ghost.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -62%) scale(${d.small ? 0.72 : 1})`;
    },
    returnGhost(d) {
      if (!d.ghost) return;
      const home = d.el.getBoundingClientRect();
      const [hx, hy] = this.toStage(home.left + home.width / 2, home.top + home.height / 2);
      d.ghost.classList.add('back');
      d.ghost.style.transform = `translate3d(${hx}px, ${hy}px, 0) translate(-50%, -50%) scale(.85)`;
      setTimeout(() => { d.ghost.remove(); d.el.classList.remove('lifted'); }, 220);
    },
    down(ev) {
      if (ev.button === 2) return;
      const g = this.g;
      const t = ev.target.closest('[data-eid],[data-power],.slot');
      if (this.pending) { this.cancelPending(); return; }
      if (!t || t.classList.contains('slot')) { if (this.sel && this.sel.kind !== 'pos') this.cancel(); return; }
      const touchPv = () => { if (ev.pointerType !== 'mouse') { const pe = t.dataset.power != null ? g.power(+t.dataset.power) : g.ent(+t.dataset.eid); if (pe) this.preview(pe, true); } };
      if (!this.canAct()) return touchPv();
      const me = this.view();
      if (this.sel && this.sel.targets) {
        const hit = this.sel.targets.find((x) => x.id === +t.dataset.eid);
        if (hit) { const f = this.sel.finish; this.arrow(null); f(hit); } else this.cancel();
        return;
      }
      if (this.sel && this.sel.kind === 'pos') return this.cancel();
      let kind = null;
      const e = t.dataset.power != null ? g.power(+t.dataset.power) : g.ent(+t.dataset.eid);
      if (!e) return;
      if (t.dataset.power != null) { if (+t.dataset.power === me && g.canPower(me)) kind = 'power'; }
      else if (e.zone === 'hand' && e.owner === me) {
        if (!g.canPlay(me, e)) { if (ev.pointerType !== 'mouse') return touchPv(); toast(g.cost(e) > g.P(me).mana ? 'Nicht genug Mana.' : 'Diese Karte kann gerade nicht gespielt werden.'); return; }
        kind = 'card';
      } else if (e.owner === me && g.inPlay(e) && g.canAttack(e)) kind = 'attack';
      if (!kind) return touchPv();
      ev.preventDefault();
      try { t.setPointerCapture && t.releasePointerCapture(ev.pointerId); } catch (x) { /* egal */ }
      this.hidePreview();
      const d = { kind, e, el: t, x0: ev.clientX, y0: ev.clientY, moved: false, from: this.center(t), touch: ev.pointerType !== 'mouse' };
      this.drag = d;
      let raf = 0, last = null;
      const move = (m) => { last = m; if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (last) this.dmove(last); }); };
      const up = (u) => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); if (raf) cancelAnimationFrame(raf); this.dmove(u); this.dup(u); };
      addEventListener('pointermove', move, { passive: true });
      addEventListener('pointerup', up);
      addEventListener('pointercancel', up);
      if (kind === 'attack') {
        this.sel = { kind: 'attack', id: e.id, targets: g.attackTargets(e), finish: (x) => this.doAttack(e.id, x.id) };
        t.classList.add('selected');
        this.markTargets(this.sel.targets);
      } else if (kind === 'power') {
        const tl = g.powerTargets(me);
        if (tl) { this.sel = { kind: 'power', targets: tl, finish: (x) => this.act({ type: 'power', target: x.id }) }; t.classList.add('selected'); this.markTargets(tl); }
      }
    },
    dmove(ev) {
      const d = this.drag;
      if (!d) return;
      if (!d.moved && Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) < 6) return;
      const g = this.g;
      if (!d.moved) {
        d.moved = true;
        if (d.kind === 'card') {
          d.ghost = document.createElement('div');
          d.ghost.className = 'ghost';
          d.ghost.innerHTML = cardHTML(g, d.e);
          document.getElementById('stage').append(d.ghost);
          d.el.classList.add('lifted');
          d.boardEls = [...app.querySelectorAll('#myboard .minion')];
          d.centers = d.boardEls.map((el) => this.center(el)[0]);
          d.boardRect = app.querySelector('#myboard').getBoundingClientRect();
          d.handTop = app.querySelector('#myhand').getBoundingClientRect().top;
          const c = g.def(d.e);
          d.isMinion = c.type === 'minion';
          d.tl = !c.choose ? g.targetsFor(d.e) : null;
        }
      }
      if (d.kind !== 'card') {
        if (this.sel && this.sel.targets) this.arrow(d.from, [ev.clientX, ev.clientY], !!this.targetAt(ev.clientX, ev.clientY));
        return;
      }
      const above = ev.clientY < d.handTop - 8;
      if (!d.isMinion && d.tl && d.tl.length && above) {
        /* Zielzauber: Karte verschwindet, Pfeil zeigt aufs Ziel */
        d.ghost.style.opacity = '0';
        if (!this.sel) { this.sel = { kind: 'target', id: d.e.id, targets: d.tl, finish: (x) => this.act({ type: 'play', id: d.e.id, target: x.id }) }; this.markTargets(d.tl); }
        this.arrow([d.x0, d.handTop], [ev.clientX, ev.clientY], !!this.targetAt(ev.clientX, ev.clientY));
        return;
      }
      if (this.sel && this.sel.kind === 'target') { this.sel = null; this.arrow(null); this.markTargets(null); }
      d.ghost.style.opacity = '';
      if (d.isMinion) {
        const over = this.inBoardZone(ev.clientX, ev.clientY) && g.P(this.view()).board.length < 7;
        const idx = over ? this.insertIndex(ev.clientX) : null;
        d.small = over;
        if (idx !== d.idx) { d.idx = idx; this.openGap(idx); }
        d.ghost.classList.toggle('armed', over);
      } else {
        d.small = false;
        d.ghost.classList.toggle('armed', above);
      }
      this.moveGhost(ev.clientX, ev.clientY);
    },
    dup(ev) {
      const d = this.drag;
      this.drag = null;
      if (!d) return;
      const g = this.g;
      const me = this.view();
      if (!d.moved) {
        if (d.kind === 'card') { if (d.touch) return this.preview(d.e, true); return this.startPlay(d.e); }
        if (d.kind === 'power' && !g.powerTargets(me)) return this.act({ type: 'power' });
        if (this.sel && this.sel.targets) this.followArrow(d.from);
        return;
      }
      const hit = this.targetAt(ev.clientX, ev.clientY);
      if (d.kind === 'attack' || d.kind === 'power') {
        this.arrow(null);
        if (hit) return this.sel.finish(hit);
        return this.cancel();
      }
      const c = g.def(d.e);
      if (this.sel && this.sel.kind === 'target') {
        this.arrow(null);
        if (hit) { d.ghost.remove(); return this.sel.finish(hit); }
        this.sel = null; this.markTargets(null);
        return this.returnGhost(d);
      }
      if (d.isMinion) {
        if (d.idx == null) { this.openGap(null); return this.returnGhost(d); }
        const pos = d.idx;
        if (c.choose) { d.ghost.remove(); this.openGap(null); return this.startPlay(d.e, pos); }
        const tl = g.targetsFor(d.e);
        if (tl && tl.length) {
          /* Diener bleibt in seiner Lücke stehen, bis das Kampfschrei-Ziel gewählt ist */
          const gapX = d.boardEls.length ? null : null;
          void gapX;
          d.small = true;
          this.pending = d;
          const slotX = this.slotCenter(d, pos);
          d.ghost.classList.add('settle');
          d.ghost.style.transform = `translate3d(${slotX[0]}px, ${slotX[1]}px, 0) translate(-50%, -50%) scale(.72)`;
          this.sel = { kind: 'target', id: d.e.id, targets: tl, finish: (x) => { this.clearPending(); this.act({ type: 'play', id: d.e.id, pos, target: x.id }); } };
          this.markTargets(tl);
          const r = document.getElementById('stage').getBoundingClientRect();
          this.followArrow([r.left + slotX[0] * this.scale, r.top + slotX[1] * this.scale]);
          return;
        }
        d.ghost.remove();
        return this.act({ type: 'play', id: d.e.id, pos });
      }
      if (ev.clientY > d.handTop - 8) return this.returnGhost(d);
      d.ghost.remove();
      if (c.choose) return this.startPlay(d.e);
      this.act({ type: 'play', id: d.e.id });
    },
    slotCenter(d, pos) {
      const r = d.boardRect;
      const n = d.boardEls.length;
      const w = n ? d.boardEls[0].offsetWidth * this.scale : 90 * this.scale;
      let cx;
      if (!n) cx = r.left + r.width / 2;
      else if (pos <= 0) cx = d.centers[0] - w / 2 - 6 * this.scale;
      else if (pos >= n) cx = d.centers[n - 1] + w / 2 + 6 * this.scale;
      else cx = (d.centers[pos - 1] + d.centers[pos]) / 2;
      return this.toStage(cx, r.top + r.height / 2);
    },
    clearPending() {
      const d = this.pending;
      this.pending = null;
      if (d && d.ghost) d.ghost.remove();
    },
    cancelPending() {
      const d = this.pending;
      this.pending = null;
      this.sel = null;
      this.arrow(null);
      this.markTargets(null);
      if (d) { this.openGap(null); this.returnGhost(d); }
    },
    followArrow(from) {
      const mv = (m) => { if (!this.sel || !this.sel.targets) { removeEventListener('pointermove', mv); this.arrow(null); return; } this.arrow(from, [m.clientX, m.clientY], !!this.targetAt(m.clientX, m.clientY)); };
      addEventListener('pointermove', mv);
    },
    doAttack(a, d) {
      this.animating = true;
      this.markTargets(null);
      this.animateAttack(a, d).then(() => { this.animating = false; this.act({ type: 'attack', a, d }); });
    },
    animateAttack(aId, dId) {
      const a = app.querySelector(`[data-eid="${aId}"]`), d = app.querySelector(`[data-eid="${dId}"]`);
      if (!a || !d || !a.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
      const [ax, ay] = this.center(a), [dx, dy] = this.center(d);
      const k = 0.75;
      a.style.zIndex = 30;
      return a.animate([{ transform: 'none' }, { transform: `translate(${(dx - ax) * k}px, ${(dy - ay) * k}px) scale(1.12)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.5,0,.3,1)' }).finished.catch(() => {});
    },
    startPlay(e, presetPos) {
      const g = this.g;
      const d = g.def(e);
      const me = this.view();
      if (d.choose) {
        const dlg = showModal(`<h2>${esc(d.name)} – Wählt aus:</h2><div class="cards">${d.choose.map((o, i) => {
          const ok = g.canPlay(me, e, i);
          return `<div class="card cls-${d.cls} type-spell choice" data-i="${i}" style="${ok ? '' : 'opacity:.35;pointer-events:none'}"><div class="c-name">${esc(o.name)}</div><div class="c-art">${artTag(d.id, d.cls)}</div><div class="c-type">Wählt aus</div><div class="c-text"><div>${fmtText(o.text.replace(/\$(\d+)/g, (_, n) => { const v = g.spellDmg(e, +n); return v !== +n ? `*${v}*` : n; }))}</div></div></div>`;
        }).join('')}</div><button id="x">Abbrechen</button>`);
        dlg.querySelector('#x').onclick = () => { hideModal(); this.cancel(); };
        dlg.querySelectorAll('[data-i]').forEach((c) => (c.onclick = () => {
          hideModal();
          if (presetPos !== undefined || d.type !== 'minion') { this.sel = { kind: 'pos', id: e.id, card: e, choice: +c.dataset.i }; this.withPos(presetPos); }
          else this.continuePlay(e, +c.dataset.i);
        }));
        return;
      }
      this.continuePlay(e, undefined);
    },
    continuePlay(e, choice) {
      const g = this.g;
      const me = this.view();
      this.sel = { kind: 'pos', id: e.id, card: e, choice };
      if (g.def(e).type === 'minion' && g.P(me).board.length > 0) return this.render();
      this.withPos(g.def(e).type === 'minion' ? 0 : undefined);
    },
    withPos(pos) {
      const g = this.g;
      const s = this.sel;
      if (!s || !s.card) return;
      const e = s.card;
      const tl = g.targetsFor(e, s.choice);
      const base = { type: 'play', id: e.id, choice: s.choice, pos };
      if (tl && tl.length) {
        this.sel = { kind: 'target', id: e.id, targets: tl, finish: (x) => this.act(Object.assign(base, { target: x.id })) };
        this.render();
        const from = this.dropAt || this.center(app.querySelector(`#myhand [data-eid="${e.id}"]`) || app.querySelector('#myboard'));
        this.dropAt = null;
        this.followArrow(from);
        return;
      }
      this.act(base);
    },
    preview(e, sticky) {
      const g = this.g;
      const pv = document.getElementById('pv');
      if (!pv || !e) return;
      if ((e.zone === 'hand' && (e.owner !== this.view() || (this.mode === 'hotseat' && this.shownSeat !== e.owner))) || e.zone === 'deck') return;
      let html;
      if (e.zone === 'secret' && (e.owner !== this.view() || (this.mode === 'hotseat' && this.shownSeat !== e.owner))) html = '<div class="card back"></div><div class="pv-ench">Verdecktes Geheimnis</div>';
      else if (g.isHero(e)) html = `<div class="heroinfo cls-${g.P(e.owner).cls}"><b>${esc(g.P(e.owner).name)}</b><span>${HS.CLASSES[g.P(e.owner).cls].name}</span><span>Leben ${g.hp(e)}/${g.maxHp(e)}</span>${e.armor ? `<span>Rüstung ${e.armor}</span>` : ''}${g.atk(e) ? `<span>Angriff ${g.atk(e)}</span>` : ''}</div>`;
      else if (g.def(e).type === 'power') html = `<div class="heroinfo"><b>${esc(g.def(e).name)}</b><span>Heldenfähigkeit · Kosten ${g.def(e).cost}</span><p>${fmtText(g.text(e))}</p></div>`;
      else {
        const extra = [];
        if (g.isMinion(e)) {
          if (e.frozen) extra.push('Eingefroren');
          if (e.silenced) extra.push('Zum Schweigen gebracht');
          if (g.has(e, 'immune')) extra.push('Immun');
          for (const x of e.ench) {
            const bits = [];
            if (x.atk) bits.push((x.atk > 0 ? '+' : '') + x.atk + ' Angriff');
            if (x.hp) bits.push('+' + x.hp + ' Leben');
            if (x.setAtk != null) bits.push('Angriff = ' + x.setAtk);
            if (x.setHp != null) bits.push('Leben = ' + x.setHp);
            if (x.kw && x.kw.length) bits.push(x.kw.map((k) => ({ taunt: 'Spott', stealth: 'Verstohlenheit', immune: 'Immun', divineShield: 'Gottesschild', windfury: 'Windzorn', charge: 'Ansturm' }[k] || k)).join(', '));
            if (x.sd) bits.push('Zauberschaden +' + x.sd);
            if (x.card && HS.CARDS[x.card] && HS.CARDS[x.card].text) bits.push(HS.CARDS[x.card].text.replace(/<[^>]+>/g, ''));
            if (x.expire) bits.push('(diesen Zug)');
            if (bits.length) extra.push(bits.join(' '));
          }
        }
        html = cardHTML(g, e) + (extra.length ? `<div class="pv-ench">${extra.map(esc).join('<br>')}</div>` : '');
      }
      pv.innerHTML = html;
      pv.classList.remove('hidden');
      const right = e.owner === this.view() && e.zone !== 'hand' ? false : true;
      pv.classList.toggle('right', e.zone === 'hand' || !right);
      clearTimeout(this._pvT);
      if (sticky) this._pvT = setTimeout(() => pv.classList.add('hidden'), 2600);
    },
    hidePreview() { const pv = document.getElementById('pv'); if (pv) pv.classList.add('hidden'); },

    /* ================= Deck-Editor ================= */
    editorSetup() {
      this.screen = 'editor';
      const decks = Store.decks();
      app.innerHTML = `<div class="menu" style="max-width:1000px"><h1>Deck-Editor</h1>
        <div class="box" style="max-width:none"><h2>Neues Deck</h2><div class="row">${CLASS_KEYS.map((k) => `<button class="cls-${k}" data-new="${k}" style="border-left:6px solid var(--cc)">${HS.CLASSES[k].name}</button>`).join('')}</div>
          <div class="row" style="margin-top:10px"><input type="text" id="imp" placeholder="Deckcode einfügen" style="flex:1"><button id="doimp">Importieren</button></div></div>
        <div class="box" style="max-width:none"><h2>Meine Decks</h2><div class="mydecks">${decks.length ? decks.map((d) => {
          const errs = HS.validateDeck(d.cls, d.cards);
          return `<div class="deckcard cls-${d.cls}" data-edit="${d.id}"><b>${esc(d.name)}</b><small>${HS.CLASSES[d.cls].name} · ${d.cards.length}/30 ${errs.length ? '· unvollständig' : '✓'}</small></div>`;
        }).join('') : '<p style="color:var(--muted)">Noch keine eigenen Decks.</p>'}</div></div>
        <div class="box" style="max-width:none"><h2>Startdecks als Vorlage</h2><div class="mydecks">${HS.PRESETS.map((p, i) => `<div class="deckcard cls-${p.cls}" data-preset="${i}"><b>${esc(p.name)}</b><small>${HS.CLASSES[p.cls].name} · Kopie bearbeiten</small></div>`).join('')}</div></div>
        <div class="row end"><button id="back">Zurück</button></div></div>`;
      app.querySelector('#back').onclick = () => this.menu();
      app.querySelectorAll('[data-new]').forEach((b) => (b.onclick = () => this.editDeck({ id: 'd' + Date.now(), name: 'Neues ' + HS.CLASSES[b.dataset.new].name + '-Deck', cls: b.dataset.new, cards: [] })));
      app.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => this.editDeck(structuredClone(Store.decks().find((d) => d.id === b.dataset.edit)))));
      app.querySelectorAll('[data-preset]').forEach((b) => (b.onclick = () => { const p = HS.PRESETS[+b.dataset.preset]; this.editDeck({ id: 'd' + Date.now(), name: p.name + ' (Kopie)', cls: p.cls, cards: HS.fixDeck(p.cls, p.cards) }); }));
      app.querySelector('#doimp').onclick = () => {
        try {
          const d = decodeDeck(app.querySelector('#imp').value);
          this.editDeck({ id: 'd' + Date.now(), name: d.name, cls: d.cls, cards: d.cards });
        } catch (e) { toast('Ungültiger Deckcode.'); }
      };
    },
    editDeck(deck) {
      this.screen = 'deck';
      const f = { cls: true, cost: null, set: '', q: '', type: '' };
      const pool = HS.cardsForClass(deck.cls).sort((a, b) => (a.cls === 'neutral') - (b.cls === 'neutral') || a.cost - b.cost || a.name.localeCompare(b.name));
      const count = (id) => deck.cards.filter((c) => c === id).length;
      const render = () => {
        const list = pool.filter((c) => (f.cls ? c.cls === deck.cls : c.cls === 'neutral')
          && (f.cost == null || (f.cost === 7 ? c.cost >= 7 : c.cost === f.cost))
          && (!f.set || c.set === f.set) && (!f.type || c.type === f.type)
          && (!f.q || (c.name + ' ' + HS.textOf(c).replace(/<[^>]+>/g, '') + ' ' + (c.race ? HS.RACES[c.race] : '')).toLowerCase().includes(f.q.toLowerCase())));
        const grid = list.map((c) => {
          const n = count(c.id);
          return cardHTML(null, null, c.id, n >= HS.maxCopies(c) ? 'maxed' : '').replace(/<\/div>$/, `${n ? `<div class="count">${n}×</div>` : ''}</div>`);
        }).join('');
        const grouped = {};
        for (const id of deck.cards) grouped[id] = (grouped[id] || 0) + 1;
        const entries = Object.keys(grouped).map((id) => HS.CARDS[id]).sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
        const curve = Array(8).fill(0);
        for (const id of deck.cards) curve[Math.min(7, HS.CARDS[id].cost)]++;
        const mx = Math.max(1, ...curve);
        const errs = HS.validateDeck(deck.cls, deck.cards);
        app.innerHTML = `<div class="editor"><div class="collection">
          <div class="filters">
            <button data-f="cls" class="${f.cls ? 'on' : ''}">${HS.CLASSES[deck.cls].name}</button><button data-f="neu" class="${!f.cls ? 'on' : ''}">Neutral</button>
            <span style="width:8px"></span>${[0, 1, 2, 3, 4, 5, 6, 7].map((c) => `<button data-cost="${c}" class="${f.cost === c ? 'on' : ''}">${c === 7 ? '7+' : c}</button>`).join('')}
            <select id="fset"><option value="">Alle Sets</option>${['basic', 'classic', 'naxx', 'gvg', 'brm'].map((s) => `<option value="${s}" ${f.set === s ? 'selected' : ''}>${HS.SETS[s]}</option>`).join('')}</select>
            <select id="ftype"><option value="">Alle Typen</option><option value="minion" ${f.type === 'minion' ? 'selected' : ''}>Diener</option><option value="spell" ${f.type === 'spell' ? 'selected' : ''}>Zauber</option><option value="weapon" ${f.type === 'weapon' ? 'selected' : ''}>Waffen</option></select>
            <input type="text" id="fq" placeholder="Suche…" value="${esc(f.q)}" style="flex:1;min-width:120px">
          </div>
          <div class="grid">${grid || '<p style="color:var(--muted)">Keine Karten gefunden.</p>'}</div></div>
          <div class="decklist cls-${deck.cls}">
            <input type="text" id="dname" value="${esc(deck.name)}" maxlength="40">
            <div><b style="color:${deck.cards.length === 30 ? 'var(--green)' : 'var(--gold)'}">${deck.cards.length}/30</b> Karten · ${HS.CLASSES[deck.cls].name}</div>
            <div class="curve">${curve.map((n, i) => `<div style="height:${(n / mx) * 100}%" title="${n}"><span>${i === 7 ? '7+' : i}</span></div>`).join('')}</div>
            <div style="height:12px"></div>
            <div class="entries">${entries.map((c) => `<div class="entry cls-${c.cls} rar-${c.rarity}" data-rm="${c.id}"><div class="ec">${c.cost}</div><div class="en">${esc(c.name)}</div><div class="ex">${grouped[c.id] > 1 ? '×' + grouped[c.id] : c.rarity === 'legendary' ? '★' : ''}</div></div>`).join('')}</div>
            ${errs.length && deck.cards.length === 30 ? `<div class="err">${errs.map(esc).join('<br>')}</div>` : ''}
            <div class="row"><button id="fill">Auffüllen</button><button id="clear">Leeren</button><button id="code">Deckcode</button></div>
            <div class="row"><button class="danger" id="del">Löschen</button><button id="back">Zurück</button><button class="primary" id="save">Speichern</button></div>
          </div></div>`;
        app.querySelector('[data-f=cls]').onclick = () => { f.cls = true; render(); };
        app.querySelector('[data-f=neu]').onclick = () => { f.cls = false; render(); };
        app.querySelectorAll('[data-cost]').forEach((b) => (b.onclick = () => { const c = +b.dataset.cost; f.cost = f.cost === c ? null : c; render(); }));
        app.querySelector('#fset').onchange = (e) => { f.set = e.target.value; render(); };
        app.querySelector('#ftype').onchange = (e) => { f.type = e.target.value; render(); };
        const q = app.querySelector('#fq');
        q.oninput = () => { f.q = q.value; clearTimeout(this._qt); this._qt = setTimeout(() => { render(); const n = app.querySelector('#fq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200); };
        app.querySelector('#dname').oninput = (e) => { deck.name = e.target.value; };
        app.querySelectorAll('.grid [data-cid]').forEach((c) => {
          c.onclick = () => {
            const card = HS.CARDS[c.dataset.cid];
            if (deck.cards.length >= 30) return toast('Das Deck ist voll (30 Karten).');
            if (count(card.id) >= HS.maxCopies(card)) return toast(card.rarity === 'legendary' ? 'Legendäre Karten nur einmal pro Deck.' : 'Höchstens 2 Kopien pro Karte.');
            deck.cards.push(card.id);
            render();
          };
          c.onmouseenter = () => { };
        });
        app.querySelectorAll('[data-rm]').forEach((r) => (r.onclick = () => { const i = deck.cards.indexOf(r.dataset.rm); if (i >= 0) deck.cards.splice(i, 1); render(); }));
        app.querySelector('#fill').onclick = () => { deck.cards = HS.fixDeck(deck.cls, deck.cards); render(); };
        app.querySelector('#clear').onclick = () => { ask('Alle Karten entfernen?', () => { deck.cards = []; render(); }); };
        app.querySelector('#code').onclick = () => {
          const code = encodeDeck(deck);
          const d = showModal(`<h2>Deckcode</h2><p>Kopieren und an Freunde schicken – im Deck-Editor über „Importieren“ einfügen.</p><textarea style="width:100%;height:90px;background:#241a12;color:var(--text)" readonly>${esc(code)}</textarea><button id="ok">Schließen</button>`);
          const ta = d.querySelector('textarea'); ta.select();
          d.querySelector('#ok').onclick = () => hideModal();
        };
        app.querySelector('#save').onclick = () => {
          const all = Store.decks().filter((d) => d.id !== deck.id);
          all.push({ id: deck.id, name: deck.name.trim() || 'Deck', cls: deck.cls, cards: deck.cards.slice() });
          Store.saveDecks(all);
          toast(errs.length ? 'Gespeichert (noch nicht spielbereit: 30 Karten nötig).' : 'Deck gespeichert.');
        };
        app.querySelector('#del').onclick = () => { ask('Deck löschen?', () => { Store.saveDecks(Store.decks().filter((d) => d.id !== deck.id)); this.editorSetup(); }); };
        app.querySelector('#back').onclick = () => this.editorSetup();
      };
      render();
    },
  };

  function encodeDeck(d) {
    const json = JSON.stringify({ n: d.name, c: d.cls, k: d.cards });
    return 'TD1:' + btoa(unescape(encodeURIComponent(json)));
  }
  function decodeDeck(code) {
    const s = code.trim().replace(/^TD1:/, '');
    const o = JSON.parse(decodeURIComponent(escape(atob(s))));
    if (!HS.CLASSES[o.c] || !Array.isArray(o.k)) throw new Error('bad');
    return { name: String(o.n || 'Importiertes Deck').slice(0, 40), cls: o.c, cards: HS.fixDeck(o.c, o.k.map(String)).slice(0, 30) };
  }

  /* Vorschau beim Überfahren (Maus) */
  document.addEventListener('pointerover', (ev) => {
    if (ev.pointerType !== 'mouse' || UI.screen !== 'game' || !UI.g || UI.drag) return;
    const t = ev.target.closest('.table [data-eid]');
    if (!t) { UI.hidePreview(); return; }
    if (t.closest('#myhand')) { UI.hidePreview(); return; }
    const e = UI.g.ent(+t.dataset.eid);
    if (e) UI.preview(e);
  });
  addEventListener('resize', () => {
    if (UI.screen !== 'game' || !UI.g) return;
    const st = document.getElementById('stage');
    const was = st && st.classList.contains('portrait');
    UI.fit();
    if (st && was !== (innerHeight > innerWidth) && !UI.drag) UI.render();
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && UI.screen === 'game') UI.cancel(); });

  window.UI = UI;
  UI.menu();
  HS.Net.probe().then((ok) => {
    if (!ok) return;
    if (HS.Net.resume(UI.netHandlers())) UI.lobby('…', true);
    else if (UI.screen === 'menu') UI.menu();
  });
})();
