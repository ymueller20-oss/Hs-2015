/* Regel-Engine: Zustand ist reines Daten-Objekt (klonbar), Kartenlogik liegt in HS.CARDS. */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : global;
  const HS = (root.HS = root.HS || {});

  HS.CARDS = {};
  HS._set = 'basic';
  HS.setSet = (s) => (HS._set = s);
  HS.def = function (c) {
    if (HS.CARDS[c.id]) throw new Error('Doppelte Karte: ' + c.id);
    c.cls = c.cls || 'neutral';
    c.set = c.set || HS._set;
    c.rarity = c.rarity || (c.set === 'basic' ? 'free' : 'common');
    if (c.collectible === undefined) c.collectible = c.set !== 'token' && ['minion', 'spell', 'weapon'].includes(c.type);
    c.kw = c.kw || [];
    c.text = c.text || '';
    HS.CARDS[c.id] = c;
    return c;
  };
  HS.card = (id) => {
    const c = HS.CARDS[id];
    if (!c) throw new Error('Unbekannte Karte: ' + id);
    return c;
  };

  HS.CLASSES = {
    druid: { name: 'Druide', color: '#8a5a2b', hero: 'hero_druid', power: 'hp_shapeshift' },
    hunter: { name: 'Jäger', color: '#2f7d32', hero: 'hero_hunter', power: 'hp_steady_shot' },
    mage: { name: 'Magier', color: '#3d6fd1', hero: 'hero_mage', power: 'hp_fireblast' },
    paladin: { name: 'Paladin', color: '#c9a227', hero: 'hero_paladin', power: 'hp_reinforce' },
    priest: { name: 'Priester', color: '#c9c9c9', hero: 'hero_priest', power: 'hp_lesser_heal' },
    rogue: { name: 'Schurke', color: '#4a4a4a', hero: 'hero_rogue', power: 'hp_dagger_mastery' },
    shaman: { name: 'Schamane', color: '#2c4fa3', hero: 'hero_shaman', power: 'hp_totemic_call' },
    warlock: { name: 'Hexenmeister', color: '#7b3fa0', hero: 'hero_warlock', power: 'hp_life_tap' },
    warrior: { name: 'Krieger', color: '#a82a2a', hero: 'hero_warrior', power: 'hp_armor_up' },
  };
  HS.SETS = { basic: 'Basis', classic: 'Klassik', naxx: 'Naxxramas', gvg: 'Goblins gegen Gnome', brm: 'Schwarzfels', token: 'Token' };
  HS.RACES = { beast: 'Beast', murloc: 'Murloc', demon: 'Demon', dragon: 'Dragon', mech: 'Mech', pirate: 'Pirate', totem: 'Totem' };

  let _pool = null;
  HS.collectible = function () {
    if (!_pool) _pool = Object.values(HS.CARDS).filter((c) => c.collectible);
    return _pool;
  };

  const kwObj = (c) => {
    const o = {};
    for (const k of c.kw) o[k] = true;
    return o;
  };

  class Game {
    constructor(s) {
      this.s = s;
      this._bq = null;
      this._fd = 0;
      this.sim = false;
      this.fx = [];
    }
    /* Sichtbare Ereignisse für die Oberfläche (nicht Teil des Spielzustands) */
    vfx(e) { if (!this.sim) this.fx.push(e); }

    /* ---------------- Erzeugung ---------------- */
    static create(opts) {
      const s = {
        seed: (opts.seed != null ? opts.seed : (Math.random() * 2147483647) | 0) || 1,
        nextId: 1, order: 1, turn: 1, cur: 0, phase: 'mulligan', winner: null,
        players: [], ents: {}, effects: [], log: [], diedThisTurn: [], pending: null, first: 0,
      };
      const g = new Game(s);
      const first = opts.first != null ? opts.first : g.rand(2);
      s.first = first;
      s.cur = first;
      for (let i = 0; i < 2; i++) {
        const d = opts.decks[i];
        const cls = HS.CLASSES[d.cls];
        const p = {
          i, cls: d.cls, name: d.name || cls.name, hero: 0, power: 0, weapon: 0, deck: [], hand: [], board: [], secrets: [],
          mana: 0, maxMana: 0, overload: 0, locked: 0, fatigue: 0, played: 0, minionsPlayed: 0, powerUses: 0,
          graveyard: [], mull: [], mullDone: false,
        };
        s.players.push(p);
        const h = g.newEnt(cls.hero, i, 'hero');
        h.armor = 0;
        h.exhausted = false;
        p.hero = h.id;
        p.power = g.newEnt(cls.power, i, 'power').id;
        for (const cid of d.cards) p.deck.push(g.newEnt(cid, i, 'deck').id);
        g.shuffle(p.deck);
      }
      for (let i = 0; i < 2; i++) {
        const p = s.players[i];
        const n = i === first ? 3 : 4;
        for (let k = 0; k < n; k++) {
          const id = p.deck.pop();
          if (id == null) break;
          g.ent(id).zone = 'hand';
          p.hand.push(id);
        }
        p.mull = p.hand.slice();
      }
      return g;
    }

    clone() {
      const g = new Game(structuredClone(this.s));
      g.sim = true;
      return g;
    }

    newEnt(cardId, owner, zone) {
      const c = HS.card(cardId);
      const e = {
        id: this.s.nextId++, card: cardId, owner, zone, damage: 0, ench: [], kw: kwObj(c),
        frozen: false, frozenTurn: 0, exhausted: true, attacks: 0, silenced: false, dead: false, order: 0, lastMax: c.hp || 0,
      };
      this.s.ents[e.id] = e;
      return e;
    }

    /* ---------------- Zufall ---------------- */
    rand(n) {
      this.s.seed = (this.s.seed + 0x6d2b79f5) | 0;
      let t = this.s.seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      return Math.floor(r * n);
    }
    chance(p) { return this.rand(1000) < p * 1000; }
    pick(arr) { return arr.length ? arr[this.rand(arr.length)] : null; }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = this.rand(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    pickN(arr, n) { return this.shuffle(arr.slice()).slice(0, n); }

    /* ---------------- Zugriff ---------------- */
    ent(id) { return this.s.ents[id]; }
    def(e) { return HS.CARDS[e.card]; }
    P(i) { return this.s.players[i]; }
    get cur() { return this.s.cur; }
    hero(i) { return this.ent(this.P(i).hero); }
    power(i) { return this.ent(this.P(i).power); }
    weapon(i) { const w = this.P(i).weapon; return w ? this.ent(w) : null; }
    board(i) {
      if (i == null) return this.board(0).concat(this.board(1)).sort((a, b) => a.order - b.order);
      return this.P(i).board.map((id) => this.ent(id));
    }
    hand(i) { return this.P(i).hand.map((id) => this.ent(id)); }
    deck(i) { return this.P(i).deck.map((id) => this.ent(id)); }
    chars(i) {
      if (i == null) return [this.hero(0), this.hero(1)].concat(this.board());
      return [this.hero(i)].concat(this.board(i));
    }
    others(e) { return this.board(e.owner).filter((m) => m !== e); }
    isMinion(e) { return !!e && this.def(e).type === 'minion' && e.zone !== 'hero'; }
    isHero(e) { return !!e && e.zone === 'hero'; }
    inPlay(e) { return !!e && (e.zone === 'play' || e.zone === 'hero' || e.zone === 'weapon'); }
    alive(e) { return this.inPlay(e) && !e.dead && (e.zone === 'weapon' || this.hp(e) > 0); }
    race(e) { return this.def(e).race || null; }
    isRace(e, r) { return this.def(e).race === r; }
    pos(e) { return this.P(e.owner).board.indexOf(e.id); }
    adj(e) {
      const b = this.P(e.owner).board;
      const i = b.indexOf(e.id);
      if (i < 0) return [];
      const r = [];
      if (i > 0) r.push(this.ent(b[i - 1]));
      if (i < b.length - 1) r.push(this.ent(b[i + 1]));
      return r;
    }
    holding(pi, race) { return this.hand(pi).some((c) => this.def(c).type === 'minion' && this.def(c).race === race); }
    hasOnBoard(pi, cardId) { return this.board(pi).some((m) => m.card === cardId && !m.silenced); }
    countOnBoard(pi, cardId) { return this.board(pi).filter((m) => m.card === cardId && !m.silenced).length; }
    log(msg) {
      if (this.sim) return;
      this.s.log.push(msg);
      if (this.s.log.length > 300) this.s.log.shift();
    }
    nm(e) { return e ? (this.isHero(e) ? this.P(e.owner).name : this.def(e).name) : '?'; }

    /* ---------------- Werte ---------------- */
    auraSources() {
      const out = [];
      for (let i = 0; i < 2; i++) {
        for (const id of this.P(i).board) {
          const m = this.ent(id);
          if (!m.silenced && !m.dead) out.push(m);
        }
        const w = this.weapon(i);
        if (w) out.push(w);
      }
      return out;
    }
    atk(e) {
      const c = this.def(e);
      let a = this.isHero(e) ? 0 : c.atk || 0;
      for (const x of e.ench) {
        if (x.setAtk != null) a = x.setAtk;
        if (x.atk) a += x.atk;
      }
      if (!e.silenced) {
        if (c.enrage && c.enrage.atk && e.damage > 0 && this.isMinion(e)) a += c.enrage.atk;
        if (c.selfAtk) a += c.selfAtk(this, e);
      }
      if (this.inPlay(e)) {
        for (const src of this.auraSources()) {
          const d = this.def(src);
          if (d.aura) {
            const r = d.aura(this, src, e);
            if (r && r.atk) a += r.atk;
          }
        }
      }
      if (this.isHero(e) && this.s.cur === e.owner) {
        const w = this.weapon(e.owner);
        if (w) a += this.atk(w);
      }
      if (c.atkIsHp && !e.silenced && this.isMinion(e)) a = this.hp(e);
      return Math.max(0, a);
    }
    maxHp(e) {
      const c = this.def(e);
      let h = c.hp || 0;
      for (const x of e.ench) {
        if (x.setHp != null) h = x.setHp;
        if (x.hp) h += x.hp;
      }
      if (!e.silenced && c.selfHp) h += c.selfHp(this, e);
      if (this.inPlay(e) && !this.isHero(e)) {
        for (const src of this.auraSources()) {
          const d = this.def(src);
          if (d.aura) {
            const r = d.aura(this, src, e);
            if (r && r.hp) h += r.hp;
          }
        }
      }
      return h;
    }
    hp(e) { return this.maxHp(e) - e.damage; }
    dur(w) { return this.hp(w); }
    damaged(e) { return e.damage > 0; }
    has(e, k) {
      if (!e) return false;
      if (e.kw[k]) return true;
      for (const x of e.ench) if (x.kw && x.kw.includes(k)) return true;
      const c = this.def(e);
      if (!e.silenced) {
        if (c.enrage && c.enrage.kw && e.damage > 0 && c.enrage.kw.includes(k)) return true;
        if (c.selfKw && c.selfKw(this, e).includes(k)) return true;
      }
      if (this.inPlay(e)) {
        for (const src of this.auraSources()) {
          const d = this.def(src);
          if (d.auraKw) {
            const r = d.auraKw(this, src, e);
            if (r && r.includes(k)) return true;
          }
        }
      }
      return false;
    }
    cost(e) {
      const c = this.def(e);
      let v = c.cost || 0;
      let set = null;
      let min = 0;
      for (const x of e.ench) {
        if (x.cost) v += x.cost;
        if (x.setCost != null) v = x.setCost;
      }
      if (c.selfCost) v += c.selfCost(this, e);
      const apply = (r) => {
        if (r == null) return;
        if (typeof r === 'number') v += r;
        else {
          if (r.delta) v += r.delta;
          if (r.set != null) set = r.set;
          if (r.min != null) min = Math.max(min, r.min);
        }
      };
      for (const src of this.auraSources()) {
        const d = this.def(src);
        if (d.costAura) apply(d.costAura(this, src, e));
      }
      for (const ef of this.s.effects) {
        const d = HS.card(ef.card);
        if (d.costMod) apply(d.costMod(this, ef, e));
      }
      if (set != null) v = set;
      if (v < min && (c.cost || 0) >= min) v = min;
      return Math.max(0, v);
    }
    spellPower(pi) {
      let n = 0;
      for (const m of this.board(pi)) {
        if (!m.silenced) n += this.def(m).spellDamage || 0;
        for (const x of m.ench) n += x.sd || 0;
      }
      return n;
    }
    velen(pi) { return Math.pow(2, this.countOnBoard(pi, 'prophet_velen')); }
    spellDmg(src, n) {
      const t = this.def(src).type;
      if (t === 'spell') n += this.spellPower(src.owner);
      if (t === 'spell' || t === 'power') n *= this.velen(src.owner);
      return n;
    }
    spellHeal(src, n) {
      const t = this.def(src).type;
      if (t === 'spell' || t === 'power') n *= this.velen(src.owner);
      return n;
    }
    maxAttacks(e) {
      if (this.isHero(e)) {
        const w = this.weapon(e.owner);
        return w && this.has(w, 'windfury') ? 2 : this.has(e, 'windfury') ? 2 : 1;
      }
      if (this.has(e, 'megaWindfury')) return 4;
      return this.has(e, 'windfury') ? 2 : 1;
    }

    /* ---------------- Ereignisse ---------------- */
    batch(fn) {
      if (this._bq) return fn();
      this._bq = [];
      try { fn(); } finally {
        const q = this._bq;
        this._bq = null;
        for (const [n, ev] of q) this.fire(n, ev);
      }
    }
    triggerList(name) {
      const sec = [];
      const rest = [];
      for (let i = 0; i < 2; i++) {
        const p = this.P(i);
        for (const id of p.secrets) {
          const e = this.ent(id);
          const d = this.def(e);
          if (d.secret && d.secret.on === name) sec.push(['sec', e, d.secret, null]);
        }
        const ents = [this.hero(i)].concat(this.board(i));
        const w = this.weapon(i);
        if (w) ents.push(w);
        for (const e of ents) {
          const d = this.def(e);
          if (!e.silenced && d.triggers && d.triggers[name]) rest.push(['ent', e, d.triggers[name], null]);
          for (const x of e.ench) {
            if (!x.card) continue;
            const xd = HS.CARDS[x.card];
            if (xd && xd.triggers && xd.triggers[name]) rest.push(['ench', e, xd.triggers[name], x]);
          }
        }
        for (const e of this.hand(i)) {
          const d = this.def(e);
          if (d.handTriggers && d.handTriggers[name]) rest.push(['hand', e, d.handTriggers[name], null]);
        }
      }
      for (const ef of this.s.effects) {
        const d = HS.card(ef.card);
        if (d.triggers && d.triggers[name]) rest.push(['eff', ef, d.triggers[name], null]);
      }
      sec.sort((a, b) => a[1].order - b[1].order);
      rest.sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
      return sec.concat(rest);
    }
    fire(name, ev) {
      ev = ev || {};
      if (this._bq) { this._bq.push([name, ev]); return ev; }
      if (this._fd > 40 || this.s.phase === 'over') return ev;
      this._fd++;
      try {
        const list = this.triggerList(name);
        for (const [kind, e, h, x] of list) {
          if (this.s.phase === 'over') break;
          /* Verlässt der Angreifer das Spiel (z. B. Freezing Trap), entfällt der Angriff samt weiterer Angriffstrigger */
          if (name === 'attack' && !this.inPlay(ev.attacker)) break;
          if (kind === 'sec') {
            /* ein gekonterter Zauber löst keine weiteren Secrets (z. B. Spellbender) aus */
            if (name === 'castSpell' && ev.countered) continue;
            if (e.zone !== 'secret' || this.s.cur === e.owner) continue;
            if (h.cond && !h.cond(this, e, ev)) continue;
            this.revealSecret(e);
            h.fire(this, e, ev);
            continue;
          }
          if (kind === 'ent') {
            if (!this.inPlay(e) || e.silenced || e.dead) continue;
            h(this, e, ev);
          } else if (kind === 'ench') {
            if (!this.inPlay(e) || !e.ench.includes(x)) continue;
            h(this, e, ev, x);
          } else if (kind === 'hand') {
            if (e.zone !== 'hand') continue;
            h(this, e, ev);
          } else if (kind === 'eff') {
            if (!this.s.effects.includes(e)) continue;
            h(this, e, ev);
          }
        }
      } finally { this._fd--; }
      return ev;
    }
    revealSecret(e) {
      const p = this.P(e.owner);
      p.secrets = p.secrets.filter((id) => id !== e.id);
      e.zone = 'grave';
      this.log(`Secret aufgedeckt: ${this.def(e).name}`);
      this.vfx({ type: 'secret', card: e.card, owner: e.owner });
      this.fire('secretRevealed', { secret: e, player: e.owner });
    }
    addEffect(pi, card, opts) {
      const ef = Object.assign({ id: this.s.nextId++, card, owner: pi, order: this.s.order++, data: {} }, opts || {});
      this.s.effects.push(ef);
      return ef;
    }
    removeEffect(ef) { this.s.effects = this.s.effects.filter((x) => x !== ef); }
    hasEffect(pi, card) { return this.s.effects.some((x) => x.owner === pi && x.card === card); }
    eot() { return 'end:' + this.s.cur; }

    /* ---------------- Grundaktionen ---------------- */
    damage(src, t, n) {
      if (!t || n <= 0 || this.s.phase === 'over') return 0;
      if (!this.inPlay(t) || t.zone === 'weapon') return 0;
      if (this.has(t, 'immune') || this._atkImmune === t) { this.vfx({ type: 'immune', id: t.id }); return 0; }
      if (this.isMinion(t)) {
        if (t.kw.divineShield) {
          t.kw.divineShield = false;
          this.vfx({ type: 'shield', id: t.id });
          return 0;
        }
        if (this.s.effects.some((x) => x.card === 'e_commanding_shout' && x.owner === t.owner)) {
          n = Math.min(n, this.hp(t) - 1);
          if (n <= 0) return 0;
        }
      } else {
        if (n >= this.hp(t) + t.armor && this.s.cur !== t.owner) {
          const ib = this.P(t.owner).secrets.map((id) => this.ent(id)).find((s) => s.card === 'ice_block');
          if (ib) {
            this.revealSecret(ib);
            this.buff(t, { kw: ['immune'], expire: this.eot() });
            return 0;
          }
        }
        /* von Rüstung abgefangener Schaden zählt trotzdem als Schaden (Freeze, Stealth, Auslöser) */
        const ab = Math.min(t.armor, n);
        t.armor -= ab;
        t.damage -= ab;
      }
      t.damage += n;
      if (!this._combat) {
        this.vfx({ type: 'hit', src: src ? src.id : 0, owner: src ? src.owner : -1, id: t.id, n });
        if (src && !this.sim) this.log(`${this.nm(src)} → ${this.nm(t)}: ${n} Schaden`);
      }
      if (src && this.inPlay(src)) {
        if (this.isMinion(src)) this.loseStealth(src);
        if (this.has(src, 'freezer')) this.freeze(t);
        if (this.has(src, 'poison') && this.isMinion(t)) t.dead = true;
      }
      this.fire('damage', { target: t, source: src, amount: n });
      return n;
    }
    heal(src, t, n) {
      if (!t || n <= 0 || !this.inPlay(t) || this.s.phase === 'over') return 0;
      const owner = src ? src.owner : t.owner;
      if (this.hasOnBoard(owner, 'auchenai_soulpriest')) return this.damage(src, t, n);
      const r = Math.min(t.damage, n);
      if (r <= 0) return 0;
      t.damage -= r;
      this.fire('heal', { target: t, source: src, amount: r });
      return r;
    }
    aoe(src, targets, n) {
      const list = targets.slice();
      this.batch(() => { for (const t of list) this.damage(src, t, n); });
    }
    aoeHeal(src, targets, n) {
      const list = targets.slice();
      this.batch(() => { for (const t of list) this.heal(src, t, n); });
    }
    splitDamage(src, n, poolFn) {
      for (let i = 0; i < n; i++) {
        const pool = poolFn().filter((t) => this.alive(t) && this.hp(t) > 0);
        const t = this.pick(pool);
        if (!t) break;
        this.damage(src, t, 1);
      }
    }
    gainArmor(pi, n) {
      this.hero(pi).armor += n;
      this.fire('armor', { player: pi, amount: n });
    }
    freeze(t) {
      if (!t || !this.inPlay(t)) return;
      t.frozen = true;
      t.frozenTurn = this.s.turn;
    }
    destroy(t) { if (t) t.dead = true; }
    loseStealth(e) {
      if (e.kw.stealth) e.kw.stealth = false;
      for (const x of e.ench) if (x.kw && x.kw.includes('stealth')) x.kw = x.kw.filter((k) => k !== 'stealth');
    }
    silence(t) {
      if (!t || !this.isMinion(t)) return;
      const before = this.maxHp(t);
      t.silenced = true;
      t.kw = {};
      t.ench = [];
      t.frozen = false;
      const after = this.maxHp(t);
      if (after < before) t.damage = Math.max(0, t.damage - (before - after));
      t.lastMax = after;
      this.log(`${this.nm(t)} erhält Silence.`);
    }
    buff(t, o) {
      if (!t) return null;
      const x = Object.assign({}, o);
      if (x.setHp != null) t.damage = 0;
      t.ench.push(x);
      if (this.inPlay(t)) t.lastMax = this.maxHp(t);
      return x;
    }
    giveKw(t, ...ks) { for (const k of ks) t.kw[k] = true; }
    updateAuras() {
      for (let i = 0; i < 2; i++) {
        for (const m of this.board(i)) {
          const mx = this.maxHp(m);
          if (mx < m.lastMax) m.damage = Math.max(0, m.damage - (m.lastMax - mx));
          m.lastMax = mx;
        }
      }
    }

    draw(pi, n = 1) {
      const out = [];
      for (let k = 0; k < n; k++) {
        if (this.s.phase === 'over') break;
        const p = this.P(pi);
        if (!p.deck.length) {
          p.fatigue++;
          this.log(`${p.name} erleidet ${p.fatigue} Erschöpfungsschaden.`);
          this.damage(null, this.hero(pi), p.fatigue);
          continue;
        }
        const e = this.ent(p.deck.pop());
        if (p.hand.length >= 10) {
          e.zone = 'grave';
          this.log(`${p.name}: Hand voll – ${this.def(e).name} wurde verbrannt.`);
          continue;
        }
        e.zone = 'hand';
        p.hand.push(e.id);
        out.push(e);
        const d = this.def(e);
        if (d.onDraw) d.onDraw(this, e);
        this.fire('draw', { card: e, player: pi });
      }
      return out;
    }
    addCard(pi, cardId, ench) {
      const p = this.P(pi);
      if (p.hand.length >= 10) return null;
      const e = this.newEnt(cardId, pi, 'hand');
      if (ench) e.ench.push(Object.assign({}, ench));
      p.hand.push(e.id);
      return e;
    }
    removeFromHand(e) {
      const p = this.P(e.owner);
      p.hand = p.hand.filter((id) => id !== e.id);
    }
    discardRandom(pi) {
      const e = this.pick(this.hand(pi));
      if (!e) return null;
      this.removeFromHand(e);
      e.zone = 'grave';
      this.log(`${this.P(pi).name} wirft ${this.def(e).name} ab.`);
      return e;
    }
    shuffleIn(pi, cardId) {
      const p = this.P(pi);
      const e = this.newEnt(cardId, pi, 'deck');
      p.deck.splice(this.rand(p.deck.length + 1), 0, e.id);
      return e;
    }
    removeFromDeck(e) {
      const p = this.P(e.owner);
      p.deck = p.deck.filter((id) => id !== e.id);
    }

    summon(owner, cardId, pos) {
      const p = this.P(owner);
      if (p.board.length >= 7 || this.s.phase === 'over') return null;
      const e = this.newEnt(cardId, owner, 'aside');
      return this.place(e, pos, true);
    }
    summonNext(src, cardId) {
      const i = this.pos(src);
      return this.summon(src.owner, cardId, i < 0 ? null : i + 1);
    }
    place(e, pos, fireAll) {
      const p = this.P(e.owner);
      if (p.board.length >= 7) { e.zone = 'grave'; return null; }
      if (pos == null || pos > p.board.length || pos < 0) pos = p.board.length;
      p.board.splice(pos, 0, e.id);
      e.zone = 'play';
      e.order = this.s.order++;
      e.exhausted = true;
      e.attacks = 0;
      e.dead = false;
      e.lastMax = this.maxHp(e);
      this.fire('summon', { minion: e });
      if (fireAll) this.fire('afterSummon', { minion: e });
      return e;
    }
    removeFromBoard(e) {
      const p = this.P(e.owner);
      const i = p.board.indexOf(e.id);
      if (i >= 0) p.board.splice(i, 1);
      return i;
    }
    bounce(e, ench) {
      if (!this.inPlay(e)) return null;
      this.removeFromBoard(e);
      e.zone = 'grave';
      const n = this.addCard(e.owner, e.card, ench);
      if (!n) this.log(`${this.def(e).name} wurde zerstört (Hand voll).`);
      return n;
    }
    control(e, to) {
      if (!this.inPlay(e) || e.owner === to) return;
      if (this.P(to).board.length >= 7) { e.dead = true; return; }
      this.removeFromBoard(e);
      e.owner = to;
      this.P(to).board.push(e.id);
      e.exhausted = true;
      e.attacks = 0;
      this.log(`${this.P(to).name} übernimmt die Kontrolle über ${this.def(e).name}.`);
    }
    transform(e, cardId) {
      const c = HS.card(cardId);
      e.card = cardId;
      e.damage = 0;
      e.ench = [];
      e.kw = kwObj(c);
      e.silenced = false;
      e.frozen = false;
      e.dead = false;
      e.exhausted = true;
      e.lastMax = this.maxHp(e);
      return e;
    }
    copyMinion(src, owner, pos) {
      const p = this.P(owner);
      if (p.board.length >= 7) return null;
      const e = this.newEnt(src.card, owner, 'aside');
      e.damage = src.damage;
      e.ench = structuredClone(src.ench);
      e.kw = Object.assign({}, src.kw);
      e.silenced = src.silenced;
      return this.place(e, pos, true);
    }
    equip(pi, cardId) {
      const e = this.newEnt(cardId, pi, 'aside');
      this.equipEnt(e);
      return e;
    }
    equipEnt(e) {
      const p = this.P(e.owner);
      const old = this.weapon(e.owner);
      if (old) {
        p.weapon = 0;
        old.zone = 'grave';
        const d = this.def(old);
        if (d.deathrattle) d.deathrattle(this, old, { owner: old.owner });
      }
      e.zone = 'weapon';
      e.order = this.s.order++;
      p.weapon = e.id;
      e.dead = false;
    }
    gainMana(pi, n, full) {
      const p = this.P(pi);
      for (let i = 0; i < n; i++) {
        if (p.maxMana >= 10) {
          if (!full) this.addCard(pi, 't_excess_mana');
          continue;
        }
        p.maxMana++;
        if (full) p.mana = Math.min(10, p.mana + 1);
      }
    }
    randomCards(filter) { return HS.collectible().filter(filter).map((c) => c.id); }
    randomCard(filter) { return this.pick(this.randomCards(filter)); }

    /* ---------------- Tod ---------------- */
    processDeaths() {
      for (let guard = 0; guard < 60; guard++) {
        if (this.s.phase === 'over') return;
        this.updateAuras();
        const dead = [];
        for (let i = 0; i < 2; i++) for (const m of this.board(i)) if (m.dead || this.hp(m) <= 0) dead.push(m);
        const deadW = [];
        for (let i = 0; i < 2; i++) {
          const w = this.weapon(i);
          if (w && (w.dead || this.hp(w) <= 0)) deadW.push(w);
        }
        const hd = [0, 1].filter((i) => this.hp(this.hero(i)) <= 0 || this.hero(i).dead);
        if (hd.length) {
          this.s.phase = 'over';
          this.s.winner = hd.length === 2 ? -1 : 1 - hd[0];
          this.log(this.s.winner < 0 ? 'Unentschieden!' : `${this.P(this.s.winner).name} gewinnt!`);
          return;
        }
        if (!dead.length && !deadW.length) break;
        /* Platz jedes Toten relativ zu den Überlebenden: Index vor dem Entfernen minus gleichzeitig entfernte Diener links davon */
        const orig = new Map(dead.map((m) => [m, this.pos(m)]));
        const infos = [];
        for (const m of dead) {
          const o = orig.get(m);
          const left = dead.filter((x) => x.owner === m.owner && orig.get(x) < o).length;
          infos.push({ m, pos: o - left, orig: o, owner: m.owner, added: 0, done: false });
        }
        for (const m of dead) {
          this.removeFromBoard(m);
          m.zone = 'grave';
          this.s.diedThisTurn.push({ card: m.card, owner: m.owner });
          this.P(m.owner).graveyard.push(m.card);
          this.log(`${this.def(m).name} stirbt.`);
        }
        for (const w of deadW) {
          this.P(w.owner).weapon = 0;
          w.zone = 'grave';
        }
        /* Todesröcheln (Diener und Waffen) in Ausspielreihenfolge */
        const queue = infos.concat(deadW.map((w) => ({ w, owner: w.owner })));
        queue.sort((a, b) => (a.m || a.w).order - (b.m || b.w).order);
        for (const info of queue) {
          if (this.s.phase === 'over') return;
          if (info.w) {
            const d = this.def(info.w);
            if (d.deathrattle) d.deathrattle(this, info.w, { owner: info.w.owner });
            continue;
          }
          const m = info.m;
          /* bereits aufgelöste Tote links davon haben ggf. schon Diener an ihren Platz gestellt */
          info.pos += infos.filter((x) => x.done && x.owner === info.owner && x.orig < info.orig).reduce((n, x) => n + x.added, 0);
          const list = [];
          const d = this.def(m);
          if (!m.silenced && d.deathrattle) list.push(d.deathrattle);
          for (const x of m.ench) {
            const xd = x.card && HS.CARDS[x.card];
            if (xd && xd.deathrattle) list.push(xd.deathrattle);
          }
          const times = this.hasOnBoard(m.owner, 'baron_rivendare') ? 2 : 1;
          const before = this.P(info.owner).board.length;
          for (let t = 0; t < times; t++) for (const dr of list) {
            if (this.s.phase === 'over') return;
            dr(this, m, info);
          }
          info.added = Math.max(0, this.P(info.owner).board.length - before);
          info.done = true;
          this.fire('death', { minion: m, owner: m.owner, pos: info.pos });
        }
      }
    }

    /* ---------------- Zielwahl ---------------- */
    targets(src, spec) {
      if (typeof spec === 'function') spec = spec(this, src);
      if (!spec) return null;
      let type = spec, f = null;
      if (typeof spec === 'object') { type = spec.t; f = spec.f; }
      const me = src.owner;
      let list;
      switch (type) {
        case 'char': list = this.chars(); break;
        case 'minion': list = this.board(); break;
        case 'enemyChar': list = this.chars(1 - me); break;
        case 'enemyMinion': list = this.board(1 - me); break;
        case 'friendlyChar': list = this.chars(me); break;
        case 'friendlyMinion': list = this.board(me); break;
        case 'hero': list = [this.hero(0), this.hero(1)]; break;
        default: throw new Error('Zieltyp ' + type);
      }
      list = list.filter((t) => t !== src && !t.dead && this.targetable(src, t));
      if (f) list = list.filter((t) => f(this, src, t));
      return list;
    }
    targetable(src, t) {
      const ty = this.def(src).type;
      if (t.owner !== src.owner && this.isMinion(t) && this.has(t, 'stealth')) return false;
      if ((ty === 'spell' || ty === 'power') && this.isMinion(t) && this.has(t, 'elusive')) return false;
      return true;
    }
    option(e, choice) {
      const c = this.def(e);
      if (c.choose && choice != null) return c.choose[choice];
      return c;
    }
    /* null = kein Ziel nötig; [] = Ziel nötig aber keins verfügbar */
    targetsFor(e, choice, combo) {
      const c = this.def(e);
      const o = this.option(e, choice);
      if (!o || !o.target) return null;
      const ctx = { combo: combo != null ? combo : this.P(e.owner).played > 0 };
      if (o.targetIf && !o.targetIf(this, e, ctx)) return null;
      const list = this.targets(e, o.target);
      if (c.type === 'minion' && list && !list.length) return null;
      return list;
    }

    /* ---------------- Spielbarkeit ---------------- */
    canPlay(pi, e, choice) {
      const s = this.s;
      if (s.phase !== 'play' || s.cur !== pi || s.pending || e.zone !== 'hand' || e.owner !== pi) return false;
      const p = this.P(pi);
      const c = this.def(e);
      if (this.cost(e) > p.mana) return false;
      if (c.type === 'minion' && p.board.length >= 7) return false;
      if (c.secret) {
        if (p.secrets.length >= 5) return false;
        if (p.secrets.some((id) => this.ent(id).card === e.card)) return false;
      }
      if (c.choose) {
        if (choice == null) return c.choose.some((_, i) => this.canPlay(pi, e, i));
      }
      const o = this.option(e, choice);
      if (o.canPlay && !o.canPlay(this, e)) return false;
      if (c.canPlay && o !== c && !c.canPlay(this, e)) return false;
      const t = this.targetsFor(e, choice);
      if (t && !t.length) return false;
      return true;
    }
    canAttack(e) {
      if (this.s.phase !== 'play' || this.s.pending || !e || e.owner !== this.s.cur || !this.inPlay(e)) return false;
      if (e.frozen) return false;
      if (this.atk(e) <= 0) return false;
      if (e.attacks >= this.maxAttacks(e)) return false;
      if (this.isHero(e)) return true;
      if (this.has(e, 'cantAttack')) return false;
      if (e.exhausted && !this.has(e, 'charge')) return false;
      return true;
    }
    attackTargets(a) {
      const o = 1 - a.owner;
      const taunts = this.board(o).filter((m) => this.has(m, 'taunt') && !this.has(m, 'stealth'));
      if (taunts.length) return taunts;
      return this.chars(o).filter((t) => !(this.isMinion(t) && this.has(t, 'stealth')));
    }
    canPower(pi) {
      const s = this.s;
      if (s.phase !== 'play' || s.cur !== pi || s.pending) return false;
      const p = this.P(pi);
      const pw = this.power(pi);
      const c = this.def(pw);
      if (p.powerUses >= 1 || c.cost > p.mana) return false;
      if (c.canUse && !c.canUse(this, pw)) return false;
      /* null = Fähigkeit braucht gerade kein Ziel (z. B. Steady Shot ohne Steamwheedle Sniper) */
      const t = c.target ? this.targets(pw, c.target) : null;
      if (t && !t.length) return false;
      return true;
    }
    powerTargets(pi) {
      const pw = this.power(pi);
      const c = this.def(pw);
      return c.target ? this.targets(pw, c.target) : null;
    }

    /* ---------------- Spielzüge ---------------- */
    mulligan(pi, replaceIds) {
      const p = this.P(pi);
      if (this.s.phase !== 'mulligan' || p.mullDone) return false;
      const rep = p.hand.filter((id) => replaceIds.includes(id));
      p.hand = p.hand.filter((id) => !rep.includes(id));
      for (let i = 0; i < rep.length; i++) {
        const id = p.deck.pop();
        this.ent(id).zone = 'hand';
        p.hand.push(id);
      }
      for (const id of rep) {
        this.ent(id).zone = 'deck';
        p.deck.splice(this.rand(p.deck.length + 1), 0, id);
      }
      p.mullDone = true;
      if (this.P(0).mullDone && this.P(1).mullDone) {
        const second = 1 - this.s.first;
        this.addCard(second, 't_the_coin');
        this.s.phase = 'play';
        this.s.cur = this.s.first;
        this.log('Das Spiel beginnt!');
        this.startTurn();
      }
      return true;
    }

    play(pi, eid, opt) {
      opt = opt || {};
      const e = this.ent(eid);
      if (!e || !this.canPlay(pi, e, opt.choice)) return false;
      const c = this.def(e);
      if (c.choose && opt.choice == null) return false;
      const tl = this.targetsFor(e, opt.choice);
      let target = null;
      if (tl) {
        target = this.ent(opt.target);
        if (!target || !tl.includes(target)) return false;
      }
      const p = this.P(pi);
      const paid = this.cost(e);
      p.mana -= paid;
      this.removeFromHand(e);
      e.zone = 'aside';
      const ctx = { combo: p.played > 0, choice: opt.choice, pos: opt.pos };
      p.played++;
      const o = this.option(e, opt.choice);
      this.log(`${p.name} spielt ${c.name}${target ? ' → ' + this.nm(target) : ''}.`);
      /* Diener stehen bereits auf dem Feld, wenn „Wenn Ihr eine Karte ausspielt“ auslöst (Illidan, Hobgoblin) */
      const played = () => this.fire('cardPlayed', { card: e, player: pi, target, cost: paid });
      if (c.type !== 'minion') played();
      if (c.overload) p.overload += c.overload;
      if (c.type === 'minion') {
        if (p.board.length >= 7) { e.zone = 'grave'; this.processDeaths(); return true; }
        let pos = opt.pos;
        if (pos == null || pos > p.board.length) pos = p.board.length;
        this.place(e, pos, false);
        played();
        p.minionsPlayed++;
        if (o.play && this.inPlay(e)) {
          if (!target || this.inPlay(target)) o.play(this, e, target, ctx);
        }
        if (this.inPlay(e) || e.zone === 'aside') this.fire('minionPlayed', { minion: e, player: pi });
        if (this.inPlay(e)) this.fire('afterSummon', { minion: e });
      } else if (c.type === 'weapon') {
        this.equipEnt(e);
        if (o.play) o.play(this, e, target, ctx);
      } else if (c.secret) {
        /* Ein Secret auszuspielen ist ein gewirkter Zauber (Counterspell, Mana Wyrm, Wild Pyromancer …) */
        const ev = this.fire('castSpell', { card: e, player: pi, target: null, countered: false, cost: paid });
        if (ev.countered) e.zone = 'grave';
        else if (p.secrets.length < 5 && !p.secrets.some((id) => this.ent(id).card === e.card)) {
          e.zone = 'secret';
          e.order = this.s.order++;
          p.secrets.push(e.id);
          this.fire('secretPlayed', { secret: e, player: pi });
          this.fire('afterSpell', { card: e, player: pi });
        } else e.zone = 'grave';
      } else {
        const ev = this.fire('castSpell', { card: e, player: pi, target, countered: false, cost: paid });
        if (!ev.countered) {
          target = ev.target;
          if (target && target.owner === pi && this.isMinion(target)) this.fire('spellTarget', { card: e, target });
          if (o.play && (!target || this.inPlay(target))) o.play(this, e, target, ctx);
          this.fire('afterSpell', { card: e, player: pi });
        }
        e.zone = 'grave';
      }
      this.processDeaths();
      return true;
    }

    attack(aid, did) {
      let a = this.ent(aid);
      let d = this.ent(did);
      if (!a || !d || !this.canAttack(a)) return false;
      if (!this.attackTargets(a).includes(d)) return false;
      a.attacks++;
      const w = this.isHero(a) ? this.weapon(a.owner) : null;
      /* Mogor betrifft nur Diener; ein Held vergreift sich nur mit Ogre Warmaul */
      const ogre = this.has(a, 'ogre') || (w && this.has(w, 'ogre')) || (this.isMinion(a) && this.board().some((m) => m.card === 'mogor_the_ogre' && !m.silenced));
      if (ogre && this.chance(0.5)) {
        const alt = this.chars(1 - a.owner).filter((t) => t !== d && !(this.isMinion(t) && this.has(t, 'stealth')));
        if (alt.length) {
          d = this.pick(alt);
          this.log(`${this.nm(a)} greift das falsche Ziel an!`);
          this.vfx({ type: 'misattack', id: a.id, target: d.id });
        }
      }
      this.loseStealth(a);
      this.log(`${this.nm(a)} greift ${this.nm(d)} an.`);
      const ev = this.fire('attack', { attacker: a, defender: d });
      d = ev.defender;
      this.processDeaths();
      if (this.s.phase === 'over') return true;
      if (!this.alive(a) || !d || !this.alive(d) || this.hp(d) <= 0) return true;
      const aAtk = this.atk(a);
      const dAtk = this.atk(d);
      if (w && this.def(w).attackImmune) this._atkImmune = a;
      try {
        this._combat = true;
        this.batch(() => {
          this.damage(a, d, aAtk);
          if (dAtk > 0) this.damage(d, a, dAtk);
          if (this.isMinion(a) && this.def(a).cleave && !a.silenced) for (const x of this.adj(d)) this.damage(a, x, aAtk);
        });
      } finally { this._atkImmune = null; this._combat = false; }
      if (w && this.inPlay(w)) {
        if (this.def(w).gorehowl && this.isMinion(d)) this.buff(w, { atk: -1 });
        else w.damage++;
      }
      this.fire('afterAttack', { attacker: a, defender: d });
      this.processDeaths();
      return true;
    }

    usePower(pi, tid) {
      if (!this.canPower(pi)) return false;
      const pw = this.power(pi);
      const c = this.def(pw);
      let t = null;
      const list = c.target ? this.targets(pw, c.target) : null;
      if (list) {
        t = this.ent(tid);
        if (!t || !list.includes(t)) return false;
      }
      const p = this.P(pi);
      p.mana -= c.cost;
      p.powerUses++;
      this.log(`${p.name} nutzt ${c.name}${t ? ' → ' + this.nm(t) : ''}.`);
      c.play(this, pw, t, {});
      this.fire('heroPower', { player: pi, target: t });
      this.processDeaths();
      return true;
    }

    choose(pi, idx) {
      const pd = this.s.pending;
      if (!pd || pd.player !== pi) return false;
      this.s.pending = null;
      HS.card(pd.card).resolve(this, pd, idx);
      this.processDeaths();
      return true;
    }

    expire(tag) {
      for (const id in this.s.ents) {
        const e = this.s.ents[id];
        if (e.ench.length && e.ench.some((x) => x.expire === tag)) {
          e.ench = e.ench.filter((x) => x.expire !== tag);
        }
      }
      this.s.effects = this.s.effects.filter((x) => x.expire !== tag);
      this.updateAuras();
    }

    endTurn() {
      const s = this.s;
      if (s.phase !== 'play' || s.pending) return false;
      const pi = s.cur;
      this.log(`— ${this.P(pi).name} beendet den Zug —`);
      this.fire('turnEnd', { player: pi });
      this.processDeaths();
      if (s.phase === 'over') return true;
      this.expire('end:' + pi);
      for (const e of this.chars(pi)) {
        if (!e.frozen) continue;
        /* bleibt eingefroren, wenn es in diesem Zug eingefroren wurde und ohnehin nicht (mehr) angreifen konnte */
        const missed = e.frozenTurn === s.turn && (e.attacks >= this.maxAttacks(e) || (this.isMinion(e) && e.exhausted && !this.has(e, 'charge')));
        if (!missed) e.frozen = false;
      }
      this.processDeaths();
      if (s.phase === 'over') return true;
      s.cur = 1 - pi;
      s.turn++;
      this.startTurn();
      return true;
    }

    startTurn() {
      const s = this.s;
      const pi = s.cur;
      const p = this.P(pi);
      p.maxMana = Math.min(10, p.maxMana + 1);
      p.locked = p.overload;
      p.overload = 0;
      p.mana = Math.max(0, p.maxMana - p.locked);
      p.played = 0;
      p.minionsPlayed = 0;
      p.powerUses = 0;
      s.diedThisTurn = [];
      for (const e of this.chars(pi)) {
        e.attacks = 0;
        e.exhausted = false;
      }
      this.expire('start:' + pi);
      this.log(`— Zug ${Math.ceil(s.turn / 2)}: ${p.name} —`);
      this.fire('turnStart', { player: pi });
      this.processDeaths();
      if (s.phase === 'over') return;
      this.draw(pi);
      this.processDeaths();
    }

    /* Textdarstellung mit Zauberschaden ($n) und Heilung (#n) */
    text(e) {
      const c = this.def(e);
      let t = c.text || '';
      const pi = e.owner;
      if (c.type === 'spell' || c.type === 'power') {
        t = t.replace(/\$(\d+)/g, (_, n) => {
          const v = this.spellDmg(e, +n);
          return v !== +n ? `*${v}*` : n;
        });
        t = t.replace(/#(\d+)/g, (_, n) => {
          const v = this.spellHeal(e, +n);
          return v !== +n ? `*${v}*` : n;
        });
      } else {
        t = t.replace(/[$#](\d+)/g, '$1');
      }
      void pi;
      return t;
    }
  }

  HS.Game = Game;
  HS.textOf = (c) => (c.text || '').replace(/[$#](\d+)/g, '$1');
})();
