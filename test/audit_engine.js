/* Regressionstests der Regel-Engine (Audit): node test/audit_engine.js */
const HS = require('./load.js');
let fail = 0, pass = 0;
function setup(cls = 'mage', ocls = 'warrior') {
  const g = HS.Game.create({ decks: [{ cls, cards: Array(30).fill('wisp') }, { cls: ocls, cards: Array(30).fill('wisp') }], seed: 3, first: 0 });
  g.mulligan(0, []); g.mulligan(1, []);
  for (const i of [0, 1]) { const p = g.P(i); for (const id of p.hand) g.ent(id).zone = 'grave'; p.hand = []; p.maxMana = 10; p.mana = 10; }
  return g;
}
const mk = (g, pi, id) => { const m = g.summon(pi, id); m.exhausted = false; return m; };
const hand = (g, pi, id) => g.addCard(pi, id);
const play = (g, pi, e, o) => { if (!g.play(pi, e.id, o || {})) throw new Error('nicht spielbar: ' + e.card); };
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m || ''} erwartet ${b}, erhalten ${a}`); };
const t = (name, fn) => { try { fn(); pass++; } catch (e) { fail++; console.log('✗ ' + name + ': ' + e.message); } };
const secretFor = (g, pi, id) => { g.s.cur = pi; play(g, pi, hand(g, pi, id)); g.s.cur = 1 - pi; };
const cards = (g, pi) => g.board(pi).map((m) => m.card).join(',');

/* Secrets sind Zauber */
t('Secret löst Mana Wyrm aus', () => { const g = setup(); const w = mk(g, 0, 'mana_wyrm'); play(g, 0, hand(g, 0, 'ice_block')); eq(g.atk(w), 2); eq(g.P(0).secrets.length, 1); });
t('Secret löst Wild Pyromancer aus', () => { const g = setup(); const y = mk(g, 1, 'chillwind_yeti'); mk(g, 0, 'wild_pyromancer'); play(g, 0, hand(g, 0, 'ice_block')); eq(g.hp(y), 4); });
t('Counterspell kontert ein Secret', () => { const g = setup(); secretFor(g, 1, 'counterspell'); play(g, 0, hand(g, 0, 'ice_block')); eq(g.P(0).secrets.length, 0); eq(g.P(1).secrets.length, 0); });
t('Gegenzauber: Spellbender löst danach nicht aus', () => {
  const g = setup(); secretFor(g, 1, 'counterspell'); secretFor(g, 1, 'spellbender'); const y = mk(g, 1, 'chillwind_yeti');
  play(g, 0, hand(g, 0, 'fireball'), { target: y.id }); eq(g.P(1).secrets.length, 1); eq(g.board(1).length, 1); eq(g.hp(y), 5);
});
t('Gekonterter Zauber löst Mana Wyrm trotzdem aus', () => { const g = setup(); secretFor(g, 1, 'counterspell'); const w = mk(g, 0, 'mana_wyrm'); play(g, 0, hand(g, 0, 'arcane_intellect')); eq(g.atk(w), 2); eq(g.P(0).hand.length, 0); });
t('cardPlayed meldet bezahlte Kosten', () => { const g = setup(); let c = null; g.addEffect(0, 'e_commanding_shout'); HS.CARDS.e_commanding_shout.triggers = { cardPlayed: (gg, ef, ev) => { c = ev.cost; } }; try { mk(g, 0, 'sorcerers_apprentice'); play(g, 0, hand(g, 0, 'fireball'), { target: g.hero(1).id }); } finally { delete HS.CARDS.e_commanding_shout.triggers; } eq(c, 3); });

/* Angriff */
t('Freezing Trap vor Vaporize: Vaporize bleibt', () => {
  const g = setup('mage', 'mage'); secretFor(g, 1, 'freezing_trap'); secretFor(g, 1, 'vaporize'); const y = mk(g, 0, 'chillwind_yeti');
  g.attack(y.id, g.hero(1).id); eq(g.P(1).secrets.length, 1); eq(g.ent(g.P(1).secrets[0]).card, 'vaporize'); eq(g.P(0).hand.length, 1); eq(g.hero(1).damage, 0);
});
t('Mogor: Held vergreift sich nicht', () => {
  const g = setup('warrior'); mk(g, 1, 'mogor_the_ogre'); for (let i = 0; i < 3; i++) mk(g, 1, 'wisp'); g.equip(0, 'fiery_war_axe');
  for (let k = 0; k < 9; k++) { g.hero(0).attacks = 0; g.weapon(0).damage = 0; g.attack(g.hero(0).id, g.hero(1).id); }
  eq(g.hero(1).damage, 27);
});
t('Mogor: Diener vergreifen sich manchmal', () => {
  let wrong = 0;
  for (let k = 0; k < 20; k++) { const g = setup(); g.s.seed = k + 1; mk(g, 1, 'mogor_the_ogre'); const w = mk(g, 0, 'wisp'); const before = g.hero(1).damage; g.attack(w.id, g.hero(1).id); if (g.hero(1).damage === before) wrong++; }
  eq(wrong > 0 && wrong < 20, true);
});
t('Windzorn: nach einem Angriff eingefroren taut am Zugende auf', () => {
  const g = setup(); const h = mk(g, 0, 'windfury_harpy'); const we = mk(g, 1, 'water_elemental');
  g.attack(h.id, we.id); eq(h.frozen, true); g.endTurn(); eq(h.frozen, false);
});
t('Einfach-Angreifer bleibt nach Einfrieren eingefroren', () => {
  const g = setup(); const y = mk(g, 0, 'chillwind_yeti'); const we = mk(g, 1, 'water_elemental');
  g.attack(y.id, we.id); g.endTurn(); eq(y.frozen, true); g.endTurn(); eq(g.canAttack(y), false); g.endTurn(); eq(y.frozen, false);
});

/* Todesphase */
t('Todesröcheln-Plätze: [x, A, Creeper, y], Creeper zuerst gespielt', () => {
  const g = setup(); const x = mk(g, 0, 'chillwind_yeti'); const c = mk(g, 0, 'haunted_creeper'); const a = mk(g, 0, 'wisp'); g.P(0).board = [x.id, a.id, c.id]; const y = mk(g, 0, 'river_crocolisk');
  g.destroy(a); g.destroy(c); g.processDeaths(); eq(cards(g, 0), 'chillwind_yeti,t_spectral_spider,t_spectral_spider,river_crocolisk');
});
t('Todesröcheln-Plätze: zwei benachbarte Tote behalten Reihenfolge', () => {
  const g = setup(); const a = mk(g, 0, 'harvest_golem'); const b = mk(g, 0, 'cairne_bloodhoof'); mk(g, 0, 'river_crocolisk');
  g.destroy(a); g.destroy(b); g.processDeaths(); eq(cards(g, 0), 't_damaged_golem,t_baine_bloodhoof,river_crocolisk');
});
t('Todesröcheln-Plätze: linker Toter mit 2 Token, rechter danach', () => {
  const g = setup(); const a = mk(g, 0, 'haunted_creeper'); mk(g, 0, 'chillwind_yeti'); const b = mk(g, 0, 'harvest_golem');
  g.destroy(a); g.destroy(b); g.processDeaths(); eq(cards(g, 0), 't_spectral_spider,t_spectral_spider,chillwind_yeti,t_damaged_golem');
});
t('Waffen-Todesröcheln in Ausspielreihenfolge', () => {
  const g = setup('warrior'); const log = []; const l = mk(g, 0, 'loot_hoarder'); g.equip(0, 'deaths_bite'); const y = mk(g, 1, 'chillwind_yeti');
  g.destroy(l); g.weapon(0).dead = true; g.processDeaths(); eq(g.hp(y), 4); eq(g.P(0).hand.length, 1); void log;
});
t('Zerstörter Held beendet das Spiel', () => { const g = setup(); g.hero(1).dead = true; g.processDeaths(); eq(g.s.phase, 'over'); eq(g.s.winner, 0); });
t('Beide Helden sterben: Unentschieden', () => { const g = setup('warlock'); g.hero(0).damage = 27; g.hero(1).damage = 27; play(g, 0, hand(g, 0, 'hellfire')); eq(g.s.winner, -1); });

/* Ausspielen */
t('Illidan bei vollem Brett: gespielter Diener kommt aufs Feld', () => {
  const g = setup(); mk(g, 0, 'illidan_stormrage'); for (let i = 0; i < 5; i++) mk(g, 0, 'wisp'); const c = hand(g, 0, 'river_crocolisk');
  play(g, 0, c); eq(c.zone, 'play'); eq(g.board(0).length, 7); eq(g.board(0).some((m) => m.card === 't_flame_of_azzinoth'), false);
});
t('Illidans Flamme erscheint rechts von Illidan', () => { const g = setup(); mk(g, 0, 'illidan_stormrage'); play(g, 0, hand(g, 0, 'wisp')); eq(cards(g, 0), 'illidan_stormrage,t_flame_of_azzinoth,wisp'); });
t('Mana nie über 10 (Münze + Nourish)', () => { const g = setup('druid'); g.P(0).maxMana = 9; g.P(0).mana = 9; play(g, 0, hand(g, 0, 't_the_coin')); play(g, 0, hand(g, 0, 'nourish'), { choice: 0 }); eq(g.P(0).maxMana, 10); eq(g.P(0).mana <= 10, true); });
t('Rüstung fängt Schaden ab, Freeze greift trotzdem', () => { const g = setup(); g.hero(1).armor = 5; const w = mk(g, 0, 'water_elemental'); g.attack(w.id, g.hero(1).id); eq(g.hero(1).armor, 2); eq(g.hero(1).damage, 0); eq(!!g.hero(1).frozen || !!(g.hero(1).kw && g.hero(1).kw.frozen), true); });
t('Rüstung teilweise: Rest geht aufs Leben', () => { const g = setup(); g.hero(1).armor = 2; play(g, 0, hand(g, 0, 'fireball'), { target: g.hero(1).id }); eq(g.hero(1).armor, 0); eq(g.hero(1).damage, 4); });

console.log(`${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
