/* Stresstest: node test/sim.js [anzahlZufallsspiele] [anzahlKISpiele] */
const HS = require('./load.js');
const N = +(process.argv[2] || 2000), NA = +(process.argv[3] || 10);
const classes = Object.keys(HS.CLASSES);
let errors = 0;
const seen = new Set();
function check(g) {
  for (let i = 0; i < 2; i++) {
    const p = g.P(i);
    if (p.board.length > 7) throw new Error('Brett > 7');
    if (p.hand.length > 10) throw new Error('Hand > 10');
    if (p.mana < 0 || p.mana > 10) throw new Error('Mana ' + p.mana);
    for (const id of p.board) { const e = g.ent(id); if (e.zone !== 'play' || e.owner !== i) throw new Error('Zone/Besitzer inkonsistent ' + e.card); }
  }
}
function run(gameNo, useAI) {
  const r = Math.random;
  const decks = [0, 1].map(() => { const cls = classes[Math.floor(r() * 9)]; return { cls, cards: useAI ? HS.fixDeck(cls, HS.PRESETS.find(p => p.cls === cls).cards) : HS.randomDeck(cls) }; });
  for (const d of decks) { const e = HS.validateDeck(d.cls, d.cards); if (e.length) throw new Error('Deck: ' + e.join(',')); d.cards.forEach(c => seen.add(c)); }
  const g = HS.Game.create({ decks, seed: (r() * 1e9) | 0 });
  let last = null;
  try {
    for (let i = 0; i < 2; i++) HS.applyAction(g, i, { type: 'mulligan', ids: HS.AI.mulligan(g, i) });
    let steps = 0;
    while (g.s.phase !== 'over' && steps++ < 3000) {
      const pi = g.s.pending ? g.s.pending.player : g.cur;
      let a;
      if (useAI) a = HS.AI.choose(g, pi);
      else { const acts = HS.legalActions(g, pi); a = (acts.length && r() < 0.85) ? acts[Math.floor(r() * acts.length)] : (g.s.pending ? { type: 'choose', idx: 0 } : { type: 'end' }); }
      last = a;
      const ok = HS.applyAction(g, pi, a);
      if (!ok) throw new Error('Legale Aktion abgelehnt: ' + JSON.stringify(a) + ' ' + (a.id ? g.ent(a.id).card : ''));
      check(g);
      if (g.s.turn > 200) break;
    }
    return g;
  } catch (e) {
    errors++;
    const card = last && last.id ? g.ent(last.id).card : '';
    console.log(`Spiel ${gameNo}: ${e.stack.split('\n').slice(0, 4).join(' | ')} | letzte Aktion ${JSON.stringify(last)} ${card}`);
    return null;
  }
}
const t0 = Date.now();
let wins = [0, 0, 0];
for (let i = 0; i < N; i++) run(i, false);
console.log(`${N} Zufallsspiele in ${((Date.now() - t0) / 1000).toFixed(1)}s, Fehler: ${errors}`);
const t1 = Date.now();
for (let i = 0; i < NA; i++) { const g = run('KI' + i, true); if (g) wins[g.s.winner + 1]++; }
console.log(`${NA} KI-Spiele in ${((Date.now() - t1) / 1000).toFixed(1)}s, Ergebnis [remis,P0,P1]=${wins}`);
const all = HS.collectible().map(c => c.id).filter(id => !seen.has(id));
console.log('Nicht abgedeckte Karten:', all.length);
process.exit(errors ? 1 : 0);
