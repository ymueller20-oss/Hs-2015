/* Prüft nach jeder Aktion: keine "toten" Diener auf dem Brett; Diener, die Helden angreifen, sterben nur mit Grund */
const HS = require('./load.js');
const classes = Object.keys(HS.CLASSES);
let zombie = 0, oddDeaths = {}, games = 0, steps = 0;
for (let n = 0; n < 3000; n++) {
  const decks = [0, 1].map(() => { const cls = classes[Math.floor(Math.random() * 9)]; return { cls, cards: HS.randomDeck(cls) }; });
  const g = HS.Game.create({ decks });
  g.mulligan(0, []); g.mulligan(1, []);
  games++;
  while (g.s.phase === 'play' && g.s.turn < 80) {
    const pi = g.s.pending ? g.s.pending.player : g.cur;
    const acts = HS.legalActions(g, pi);
    const a = acts.length && Math.random() < 0.85 ? acts[Math.floor(Math.random() * acts.length)] : (g.s.pending ? { type: 'choose', idx: 0 } : { type: 'end' });
    const logLen = g.s.log.length;
    let attacker = null, hpBefore = 0, defHero = false;
    if (a.type === 'attack') { attacker = g.ent(a.a); hpBefore = g.hp(attacker); defHero = g.isHero(g.ent(a.d)); }
    HS.applyAction(g, pi, a);
    steps++;
    if (g.s.phase === 'play') for (const m of g.board()) if (g.hp(m) <= 0 || m.dead) { zombie++; if (zombie < 5) console.log('Zombie:', m.card, g.hp(m), JSON.stringify(a)); }
    if (attacker && defHero && g.isMinion(attacker) && attacker.zone !== 'play') {
      const log = g.s.log.slice(logLen).join(' | ');
      const why = /Geheimnis aufgedeckt: (\S+ ?\S*)/.exec(log);
      const key = why ? 'Geheimnis ' + why[1] : /falsche Ziel/.test(log) ? 'Fehlangriff (Oger)' : 'UNERKLÄRT';
      oddDeaths[key] = (oddDeaths[key] || 0) + 1;
      if (key === 'UNERKLÄRT' && oddDeaths[key] < 6) console.log('Unerklärt:', attacker.card, hpBefore, log);
    }
  }
}
console.log({ games, steps, zombie, oddDeaths });
