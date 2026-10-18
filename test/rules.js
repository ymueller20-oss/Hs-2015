/* Gezielte Regeltests: node test/rules.js */
const HS = require('./load.js');
let fail = 0, pass = 0;
function setup(clsA = 'mage', clsB = 'warrior') {
  const g = HS.Game.create({ decks: [{ cls: clsA, cards: Array(30).fill('wisp') }, { cls: clsB, cards: Array(30).fill('wisp') }], seed: 1, first: 0 });
  g.mulligan(0, []); g.mulligan(1, []);
  for (const i of [0, 1]) { const p = g.P(i); for (const id of p.hand) g.ent(id).zone = 'grave'; p.hand = []; p.maxMana = 10; p.mana = 10; }
  return g;
}
const mk = (g, pi, id) => { const m = g.summon(pi, id); m.exhausted = false; return m; };
const hand = (g, pi, id) => g.addCard(pi, id);
const play = (g, pi, e, o) => { const r = g.play(pi, e.id, o || {}); if (!r) throw new Error('play abgelehnt: ' + e.card); return r; };
function t(name, fn) { try { fn(); pass++; } catch (e) { fail++; console.log('✗ ' + name + ': ' + e.message); } }
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m || ''} erwartet ${b}, erhalten ${a}`); };

t('Aura-Leben: Champion stirbt, beschädigter Diener überlebt', () => {
  const g = setup(); const champ = mk(g, 0, 'stormwind_champion'); const w = mk(g, 0, 'wisp');
  eq(g.hp(w), 2); g.damage(null, w, 1); eq(g.hp(w), 1); g.destroy(champ); g.processDeaths(); eq(g.hp(w), 1); eq(w.zone, 'play');
});
t('Stille entfernt Buff und kappt Leben', () => {
  const g = setup(); const w = mk(g, 0, 'chillwind_yeti'); g.buff(w, { atk: 4, hp: 4 }); g.damage(null, w, 3); eq(g.hp(w), 6); g.silence(w); g.updateAuras(); eq(g.hp(w), 5); eq(g.atk(w), 4);
});
t('Gleichheit + Wilder Pyromant leert das Brett', () => {
  const g = setup('paladin'); mk(g, 0, 'wild_pyromancer'); mk(g, 1, 'boulderfist_ogre'); mk(g, 0, 'chillwind_yeti');
  play(g, 0, hand(g, 0, 'equality')); eq(g.board().length, 0);
});
t('Messerjongleur nach Herbeirufen', () => {
  const g = setup(); mk(g, 0, 'knife_juggler'); play(g, 0, hand(g, 0, 'wisp')); eq(g.hero(1).damage, 1);
});
t('Gegenzauber kontert, Mana weg', () => {
  const g = setup(); const s = hand(g, 1, 'counterspell'); g.s.cur = 1; play(g, 1, s); g.s.cur = 0;
  const fb = hand(g, 0, 'fireball'); play(g, 0, fb, { target: g.hero(1).id }); eq(g.hero(1).damage, 0); eq(g.P(0).mana, 6); eq(g.P(1).secrets.length, 0);
});
t('Geheimnis löst im eigenen Zug nicht aus', () => {
  const g = setup(); play(g, 0, hand(g, 0, 'counterspell')); play(g, 0, hand(g, 0, 'arcane_shot'), { target: g.hero(1).id }); eq(g.P(0).secrets.length, 1); eq(g.hero(1).damage, 2);
});
t('Eisblock verhindert tödlichen Schaden', () => {
  const g = setup(); g.s.cur = 1; play(g, 1, hand(g, 1, 'ice_block')); g.s.cur = 0; g.hero(1).damage = 27;
  play(g, 0, hand(g, 0, 'fireball'), { target: g.hero(1).id }); eq(g.s.phase, 'play'); eq(g.hero(1).damage, 27);
  play(g, 0, hand(g, 0, 'fireball'), { target: g.hero(1).id }); eq(g.hero(1).damage, 27, 'immun');
});
t('Einfrieren: verpasst nächsten Angriff, taut danach auf', () => {
  const g = setup(); const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'frostbolt'), { target: y.id });
  g.endTurn(); eq(g.canAttack(y), false); g.endTurn(); eq(y.frozen, false); g.endTurn(); eq(g.canAttack(y), true);
});
t('Gottesschild', () => { const g = setup(); const s = mk(g, 1, 'argent_squire'); play(g, 0, hand(g, 0, 'fireball'), { target: s.id }); eq(s.zone, 'play'); eq(s.kw.divineShield, false); });
t('Spott erzwingt Ziel, Verstohlenheit nicht angreifbar', () => {
  const g = setup(); const a = mk(g, 0, 'chillwind_yeti'); const tt = mk(g, 1, 'goldshire_footman'); mk(g, 1, 'worgen_infiltrator');
  eq(g.attack(a.id, g.hero(1).id), false); eq(g.attackTargets(a).length, 1); eq(g.attackTargets(a)[0], tt);
});
t('Zauberschaden und Velen', () => {
  const g = setup('priest'); mk(g, 0, 'kobold_geomancer'); mk(g, 0, 'prophet_velen');
  play(g, 0, hand(g, 0, 'holy_smite'), { target: g.hero(1).id }); eq(g.hero(1).damage, 6);
  g.usePower(0, g.hero(1).id); eq(g.hero(1).damage, 2, 'Heilung verdoppelt'); g.hero(0).damage = 10; g.P(0).powerUses = 0; g.usePower(0, g.hero(0).id); eq(g.hero(0).damage, 6);
});
t('Auchenai + Kreis der Heilung', () => { const g = setup('priest'); mk(g, 0, 'auchenai_soulpriest'); const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'circle_of_healing')); eq(g.hp(y), 1); });
t('Baron Totenschwur verdoppelt Todesröcheln', () => { const g = setup(); mk(g, 0, 'baron_rivendare'); const c = mk(g, 0, 'haunted_creeper'); g.destroy(c); g.processDeaths(); eq(g.board(0).length, 5); });
t('Sylvanas stiehlt', () => { const g = setup(); const s = mk(g, 0, 'sylvanas_windrunner'); mk(g, 1, 'chillwind_yeti'); g.destroy(s); g.processDeaths(); eq(g.board(0).length, 1); eq(g.board(1).length, 0); });
t('Spiegelbildnis kopiert', () => { const g = setup(); g.s.cur = 1; play(g, 1, hand(g, 1, 'mirror_entity')); g.s.cur = 0; play(g, 0, hand(g, 0, 'chillwind_yeti')); eq(g.board(1).length, 1); eq(g.board(1)[0].card, 'chillwind_yeti'); });
t('Gesichtsloser kopiert Buffs', () => { const g = setup(); const y = mk(g, 1, 'chillwind_yeti'); g.buff(y, { atk: 4, hp: 4 }); const f = hand(g, 0, 'faceless_manipulator'); play(g, 0, f, { target: y.id }); eq(g.atk(f), 8); eq(g.hp(f), 9); });
t('Lord Jaraxxus', () => { const g = setup('warlock'); play(g, 0, hand(g, 0, 'lord_jaraxxus')); eq(g.maxHp(g.hero(0)), 15); eq(g.board(0).length, 0); eq(g.weapon(0).card, 't_blood_fury'); eq(g.power(0).card, 'hp_inferno'); });
t('Überladung', () => { const g = setup('shaman'); play(g, 0, hand(g, 0, 'lightning_bolt'), { target: g.hero(1).id }); g.endTurn(); g.endTurn(); eq(g.P(0).locked, 1); eq(g.P(0).mana, 9); });
t('Grimmiger Gast + Wirbelwind', () => { const g = setup('warrior'); mk(g, 0, 'grim_patron'); play(g, 0, hand(g, 0, 'whirlwind')); eq(g.board(0).length, 2); });
t('Kel\'Thuzad', () => { const g = setup(); mk(g, 0, 'kelthuzad'); const y = mk(g, 0, 'chillwind_yeti'); g.destroy(y); g.processDeaths(); g.endTurn(); eq(g.board(0).some(m => m.card === 'chillwind_yeti'), true); });
t('Kosten: Lehrling, Portal, Thaurissan', () => {
  const g = setup(); mk(g, 0, 'sorcerers_apprentice'); const a = hand(g, 0, 'arcane_missiles'); eq(g.cost(a), 0);
  mk(g, 0, 'summoning_portal'); const w = hand(g, 0, 'goldshire_footman'); const y = hand(g, 0, 'chillwind_yeti'); eq(g.cost(w), 1); eq(g.cost(y), 2);
  mk(g, 0, 'emperor_thaurissan'); g.endTurn(); eq(g.cost(y), 1);
});
t('Combo Ausweiden', () => { const g = setup('rogue'); play(g, 0, hand(g, 0, 'eviscerate'), { target: g.hero(1).id }); eq(g.hero(1).damage, 2); play(g, 0, hand(g, 0, 'eviscerate'), { target: g.hero(1).id }); eq(g.hero(1).damage, 6); });
t('Blutschrei', () => { const g = setup('warrior'); play(g, 0, hand(g, 0, 'gorehowl')); const y = mk(g, 1, 'chillwind_yeti'); g.attack(g.hero(0).id, y.id); eq(g.atk(g.weapon(0)), 6); eq(g.hp(g.weapon(0)), 1); });
t('Wählt aus: Katzengestalt hat Ansturm', () => { const g = setup('druid'); const d = hand(g, 0, 'druid_of_the_claw'); play(g, 0, d, { choice: 0 }); eq(g.canAttack(d), true); });
t('Fährtenlesen', () => { const g = setup('hunter'); const n = g.P(0).deck.length; play(g, 0, hand(g, 0, 'tracking')); eq(!!g.s.pending, true); g.choose(0, 1); eq(g.P(0).hand.length, 1); eq(g.P(0).deck.length, n - 3); });
t('Anspornender Ruf', () => { const g = setup('warrior'); const y = mk(g, 0, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'commanding_shout')); g.damage(null, y, 10); g.processDeaths(); eq(g.hp(y), 1); });
t('Mal\'Ganis macht Helden immun', () => { const g = setup('warlock'); mk(g, 0, 'malganis'); g.damage(null, g.hero(0), 5); eq(g.hero(0).damage, 0); });
t('Erschöpfung', () => { const g = setup(); g.P(0).deck = []; g.draw(0); g.draw(0); eq(g.hero(0).damage, 3); });
t('Hand voll: Karte verbrannt', () => { const g = setup(); for (let i = 0; i < 10; i++) hand(g, 0, 'wisp'); const n = g.P(0).deck.length; g.draw(0); eq(g.P(0).hand.length, 10); eq(g.P(0).deck.length, n - 1); });
t('Sprengfalle tötet Angreifer, Angriff entfällt', () => {
  const g = setup(); g.s.cur = 1; play(g, 1, hand(g, 1, 'explosive_trap')); g.s.cur = 0; const w = mk(g, 0, 'wisp'); g.attack(w.id, g.hero(1).id); eq(w.zone, 'grave'); eq(g.hero(1).damage, 0);
});
t('Edles Opfer lenkt um', () => { const g = setup(); g.s.cur = 1; play(g, 1, hand(g, 1, 'noble_sacrifice')); g.s.cur = 0; const y = mk(g, 0, 'chillwind_yeti'); g.attack(y.id, g.hero(1).id); eq(g.hero(1).damage, 0); eq(g.hp(y), 3); });
t('Ansturm über Kriegshymnenfeste', () => { const g = setup('warrior'); mk(g, 0, 'warsong_commander'); const w = hand(g, 0, 'wolfrider'); const b = hand(g, 0, 'bloodfen_raptor'); play(g, 0, b); eq(g.canAttack(b), true); void w; });
t('Windzorn zweimal angreifen', () => { const g = setup(); const h = mk(g, 0, 'windfury_harpy'); g.attack(h.id, g.hero(1).id); g.attack(h.id, g.hero(1).id); eq(g.hero(1).damage, 8); eq(g.attack(h.id, g.hero(1).id), false); });
t('Waffe nur im eigenen Zug', () => { const g = setup('warrior'); play(g, 0, hand(g, 0, 'fiery_war_axe')); eq(g.atk(g.hero(0)), 3); g.endTurn(); eq(g.atk(g.hero(0)), 0); });
t('Rüstung absorbiert', () => { const g = setup('warrior'); g.usePower(0); g.damage(null, g.hero(0), 3); eq(g.hero(0).armor, 0); eq(g.hero(0).damage, 1); });
t('Münze für Spieler 2', () => { const g = HS.Game.create({ decks: [{ cls: 'mage', cards: Array(30).fill('wisp') }, { cls: 'mage', cards: Array(30).fill('wisp') }], seed: 2, first: 0 }); g.mulligan(0, []); g.mulligan(1, []); eq(g.P(1).hand.length, 5); eq(g.P(1).hand.some(id => g.ent(id).card === 't_the_coin'), true); eq(g.P(0).hand.length, 4); });
t('Riesen-Kosten', () => { const g = setup(); const m = hand(g, 0, 'molten_giant'); g.hero(0).damage = 15; eq(g.cost(m), 5); const s = hand(g, 0, 'sea_giant'); mk(g, 1, 'wisp'); mk(g, 1, 'wisp'); eq(g.cost(s), 8); });
t('Wutanfall', () => { const g = setup(); const a = mk(g, 0, 'amani_berserker'); eq(g.atk(a), 2); g.damage(null, a, 1); eq(g.atk(a), 5); g.heal(null, a, 1); eq(g.atk(a), 2); });
t('Feendrache nicht als Zauberziel', () => { const g = setup(); const f = mk(g, 1, 'faerie_dragon'); const fb = hand(g, 0, 'fireball'); eq(g.targetsFor(fb).includes(f), false); eq(g.usePower(0, f.id), false); });
t('Schattenwahnsinn: Rückgabe am Zugende', () => { const g = setup('priest'); const w = mk(g, 1, 'bloodfen_raptor'); play(g, 0, hand(g, 0, 'shadow_madness'), { target: w.id }); eq(w.owner, 0); eq(g.canAttack(w), true); g.endTurn(); eq(w.owner, 1); });
t('Verderbnis vernichtet zu Beginn des eigenen Zuges', () => { const g = setup('warlock'); const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'corruption'), { target: y.id }); g.endTurn(); eq(y.zone, 'play'); g.endTurn(); eq(y.zone, 'grave'); });
t('Erlösung', () => { const g = setup('paladin'); g.s.cur = 1; play(g, 1, hand(g, 1, 'redemption')); g.s.cur = 0; const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'assassinate'), { target: y.id }); eq(g.board(1).length, 1); eq(g.hp(g.board(1)[0]), 1); });
t('Majordomus', () => { const g = setup(); const m = mk(g, 0, 'majordomo_executus'); g.destroy(m); g.processDeaths(); eq(g.maxHp(g.hero(0)), 8); eq(g.power(0).card, 'hp_die_insect'); });
console.log(`${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
