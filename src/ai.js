/* Aktionen (auch fürs Netzwerk) und Computergegner */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : global;
  const HS = root.HS;

  /* Eine Aktion ist reines JSON: so kann sie über das Netz geschickt und deterministisch nachgespielt werden. */
  HS.applyAction = function (g, pi, a) {
    switch (a.type) {
      case 'mulligan': return g.mulligan(pi, a.ids || []);
      case 'play': return g.play(pi, a.id, { target: a.target, choice: a.choice, pos: a.pos });
      case 'attack': return g.cur === pi && g.attack(a.a, a.d);
      case 'power': return g.usePower(pi, a.target);
      case 'choose': return g.choose(pi, a.idx);
      case 'end': return g.cur === pi && g.endTurn();
      case 'concede':
        if (g.s.phase === 'over') return false;
        g.s.phase = 'over';
        g.s.winner = 1 - pi;
        g.log(`${g.P(pi).name} gibt auf.`);
        return true;
      default: return false;
    }
  };

  const MANA_CARDS = ['t_the_coin', 'innervate', 't_gallywix_coin', 'preparation'];

  function legal(g, pi) {
    const out = [];
    if (g.s.phase !== 'play' || g.cur !== pi) return out;
    if (g.s.pending) {
      if (g.s.pending.player === pi) g.s.pending.options.forEach((_, i) => out.push({ type: 'choose', idx: i }));
      return out;
    }
    const p = g.P(pi);
    for (const c of g.hand(pi)) {
      const d = g.def(c);
      const choices = d.choose ? d.choose.map((_, i) => i) : [null];
      for (const ch of choices) {
        if (!g.canPlay(pi, c, ch)) continue;
        const tl = g.targetsFor(c, ch);
        const ts = tl ? tl : [null];
        const ps = d.type === 'minion' && d.positional ? [...Array(p.board.length + 1).keys()] : [null];
        for (const t of ts) for (const pos of ps) out.push({ type: 'play', id: c.id, target: t ? t.id : undefined, choice: ch == null ? undefined : ch, pos: pos == null ? undefined : pos });
      }
    }
    if (g.canPower(pi)) {
      const tl = g.powerTargets(pi);
      if (tl) for (const t of tl) out.push({ type: 'power', target: t.id });
      else out.push({ type: 'power' });
    }
    for (const a of g.chars(pi)) {
      if (!g.canAttack(a)) continue;
      for (const d of g.attackTargets(a)) out.push({ type: 'attack', a: a.id, d: d.id });
    }
    return out;
  }
  HS.legalActions = legal;

  function minionValue(g, m, mine) {
    const d = g.def(m);
    const a = g.atk(m), h = g.hp(m);
    let v = a + h + 0.5 + Math.min(d.cost || 0, 10) * 0.25;
    if (g.has(m, 'taunt')) v += mine ? 1.5 : 1;
    if (m.kw.divineShield) v += a * 0.8 + 0.5;
    if (g.has(m, 'windfury')) v += a * 0.5;
    if (g.has(m, 'stealth')) v += 1;
    if (g.has(m, 'poison')) v += 2;
    if (g.has(m, 'cantAttack')) v -= a * 0.7;
    if (m.frozen) v -= a * 0.3;
    if (!m.silenced) v += (d.spellDamage || 0) * 1.2;
    if (m.card === 'doomsayer' && !m.silenced) v = mine ? -2 : 6;
    return v;
  }

  function evaluate(g, pi) {
    const s = g.s;
    if (s.phase === 'over') return s.winner === pi ? 1e6 : s.winner === -1 ? -5e5 : -1e6;
    const op = 1 - pi;
    const hp = (i) => g.hp(g.hero(i)) + g.hero(i).armor;
    const heroScore = (h) => h * 0.8 + (h < 12 ? (12 - h) * -0.9 : 0);
    let v = heroScore(hp(pi)) - heroScore(hp(op)) * 1.1;
    for (const m of g.board(pi)) v += minionValue(g, m, true);
    for (const m of g.board(op)) v -= minionValue(g, m, false) * 1.05;
    const w = g.weapon(pi), ow = g.weapon(op);
    if (w) v += Math.max(0, g.def(w).atk + w.ench.reduce((a, x) => a + (x.atk || 0), 0)) * g.hp(w) * 0.5;
    if (ow) v -= Math.max(0, g.def(ow).atk) * g.hp(ow) * 0.5;
    for (const c of g.hand(pi)) v += 1.2 + Math.min(g.def(c).cost || 0, 7) * 0.3;
    v -= g.P(op).hand.length * 0.6;
    v += (g.P(pi).maxMana - g.P(op).maxMana) * 0.8;
    v += g.P(pi).secrets.length * 2.5 - g.P(op).secrets.length * 2.5;
    v -= g.P(pi).overload * 0.8;
    let threat = g.board(op).reduce((a, m) => a + (g.has(m, 'cantAttack') ? 0 : g.atk(m)), 0);
    if (ow) threat += g.def(ow).atk;
    if (threat >= hp(pi)) v -= 30;
    return v;
  }
  HS.evaluate = evaluate;

  function resolvePendingSim(g) {
    let guard = 0;
    while (g.s.pending && guard++ < 5) {
      const pd = g.s.pending;
      g.choose(pd.player, HS.AI.pickOption(g, pd));
    }
  }

  function simulate(g, pi, a) {
    const c = g.clone();
    c.s.seed = (Math.random() * 2147483647) | 0;
    if (!HS.applyAction(c, pi, a)) return null;
    resolvePendingSim(c);
    return c;
  }

  HS.AI = {
    mulligan(g, pi) {
      const p = g.P(pi);
      return p.hand.filter((id) => (g.def(g.ent(id)).cost || 0) > 3).slice();
    },
    pickOption(g, pd) {
      let best = 0, bc = -1;
      pd.options.forEach((id, i) => {
        const c = g.def(g.ent(id)).cost || 0;
        if (c > bc) { bc = c; best = i; }
      });
      return best;
    },
    choose(g, pi) {
      if (g.s.phase === 'mulligan') return { type: 'mulligan', ids: this.mulligan(g, pi) };
      if (g.s.pending && g.s.pending.player === pi) return { type: 'choose', idx: this.pickOption(g, g.s.pending) };
      const acts = legal(g, pi);
      const base = evaluate(g, pi);
      let best = null, bestV = base + 0.05;
      const limit = acts.length > 160 ? 160 : acts.length;
      const sample = acts.length > limit ? g.pickN(acts, limit) : acts;
      for (const a of sample) {
        const r = simulate(g, pi, a);
        if (!r) continue;
        let v = evaluate(r, pi);
        if (a.type === 'play' && MANA_CARDS.includes(g.ent(a.id).card)) {
          let follow = -Infinity;
          for (const b of legal(r, pi)) {
            if (b.type === 'play' && MANA_CARDS.includes(r.ent(b.id).card)) continue;
            const r2 = simulate(r, pi, b);
            if (r2) follow = Math.max(follow, evaluate(r2, pi));
          }
          v = follow > -Infinity ? follow - 0.3 : v - 5;
        }
        if (v > bestV) { bestV = v; best = a; }
      }
      return best || { type: 'end' };
    },
  };
})();
