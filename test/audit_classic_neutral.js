/* Audit-Tests für src/cards/classic_neutral.js (Stand Mitte 2015): node test/audit_classic_neutral.js */
const HS = require('./load.js');
let fail = 0, pass = 0;
function setup(cls = 'mage', ocls = 'warrior', seed = 3) {
  const g = HS.Game.create({ decks: [{ cls, cards: Array(30).fill('wisp') }, { cls: ocls, cards: Array(30).fill('wisp') }], seed, first: 0 });
  g.mulligan(0, []); g.mulligan(1, []);
  for (const i of [0, 1]) { const p = g.P(i); for (const id of p.hand) g.ent(id).zone = 'grave'; p.hand = []; p.maxMana = 10; p.mana = 10; }
  return g;
}
const mk = (g, pi, id) => { const m = g.summon(pi, id); m.exhausted = false; return m; };
const hand = (g, pi, id) => g.addCard(pi, id);
const play = (g, pi, e, o) => { if (!g.play(pi, e.id, o || {})) throw new Error('nicht spielbar: ' + e.card); };
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m || ''} erwartet ${b}, erhalten ${a}`); };
const t = (name, fn) => { try { fn(); pass++; } catch (e) { fail++; console.log('✗ ' + name + ': ' + e.message); } };
const C = (id) => HS.CARDS[id];

/* Korrigierte Werte */
t('Leeroy kostet 5 (seit Sept. 2014)', () => { eq(C('leeroy_jenkins').cost, 5); eq(C('leeroy_jenkins').atk, 6); eq(C('leeroy_jenkins').hp, 2); });
t('Finkle Einhorn kostet 2', () => { eq(C('t_finkle_einhorn').cost, 2); eq(C('t_finkle_einhorn').atk, 3); });
t('Onyxia füllt das Brett und bricht sicher ab', () => { const g = setup(); mk(g, 0, 'wisp'); const o = hand(g, 0, 'onyxia'); play(g, 0, o); eq(g.board(0).length, 7); eq(g.board(0).filter((m) => m.card === 't_whelp').length, 5); });
t('Onyxia bei Spielende (Gegner tot) hängt nicht', () => { const g = setup(); g.s.phase = 'play'; const o = hand(g, 0, 'onyxia'); const orig = g.summon.bind(g); let n = 0; g.summon = (...a) => (++n > 2 ? null : orig(...a)); play(g, 0, o); eq(g.board(0).length, 3); });

/* Werte-Stichproben (Stand Mitte 2015, vor den Nerfs vom April 2016) */
const STATS = { molten_giant: [20, 8, 8], big_game_hunter: [3, 4, 2], tinkmaster_overspark: [3, 3, 3], gadgetzan_auctioneer: [6, 4, 4], knife_juggler: [2, 3, 2], leper_gnome: [1, 2, 1], ironbeak_owl: [2, 2, 1], arcane_golem: [3, 4, 2], murloc_warleader: [3, 3, 3], t_baine_bloodhoof: [4, 4, 5], mountain_giant: [12, 8, 8], sea_giant: [10, 8, 8] };
for (const [id, [c, a, h]] of Object.entries(STATS)) t('Werte ' + id, () => { eq(C(id).cost, c, 'Kosten'); eq(C(id).atk, a, 'Angriff'); eq(C(id).hp, h, 'Leben'); });

/* Verhalten */
t('Leeroy: 2 Welplinge für den Gegner, Ansturm', () => { const g = setup(); const l = hand(g, 0, 'leeroy_jenkins'); play(g, 0, l); eq(g.board(1).filter((m) => m.card === 't_whelp').length, 2); eq(g.canAttack(l), true); });
t('Messerjongleur löst nach dem Kampfschrei aus', () => { const g = setup(); mk(g, 0, 'knife_juggler'); const m = mk(g, 1, 'murloc_raider'); play(g, 0, hand(g, 0, 'hungry_crab'), { target: m.id }); eq(g.hero(1).damage, 1); eq(m.zone, 'grave'); });
t('Messerjongleur triggert nicht auf gegnerische Herbeirufung', () => { const g = setup(); mk(g, 0, 'knife_juggler'); g.summon(1, 'wisp'); eq(g.hero(1).damage, 0); eq(g.hero(0).damage, 0); });
t('Verrückter Bomber trifft nur andere Charaktere (inkl. eigenen Helden)', () => { const g = setup(); const b = hand(g, 0, 'mad_bomber'); play(g, 0, b); eq(g.hp(b), 2); eq(g.hero(0).damage + g.hero(1).damage, 3); });
t('Gedankenkontrolltechniker: 3 Diener -> nichts', () => { const g = setup(); for (let i = 0; i < 3; i++) mk(g, 1, 'wisp'); play(g, 0, hand(g, 0, 'mind_control_tech')); eq(g.board(1).length, 3); eq(g.board(0).length, 1); });
t('Großwildjäger ohne Ziel spielbar, nur Angriff >= 7', () => { const g = setup(); const y = mk(g, 1, 'chillwind_yeti'); g.buff(y, { atk: 2 }); const c = hand(g, 0, 'big_game_hunter'); eq(g.targetsFor(c), null); play(g, 0, c); eq(y.zone, 'play'); g.buff(y, { atk: 1 }); const c2 = hand(g, 0, 'big_game_hunter'); play(g, 0, c2, { target: y.id }); g.processDeaths(); eq(y.zone, 'grave'); });
t('Hungrige Krabbe nur Murlocs, sonst ohne Ziel spielbar', () => { const g = setup(); mk(g, 1, 'wisp'); const c = hand(g, 0, 'hungry_crab'); eq(g.targetsFor(c), null); play(g, 0, c); eq(g.atk(c), 1); const m = mk(g, 1, 'murloc_raider'); const c2 = hand(g, 0, 'hungry_crab'); play(g, 0, c2, { target: m.id }); eq(m.zone, 'grave'); eq(g.atk(c2), 3); eq(g.hp(c2), 4); });
t('Ruchloser Unteroffizier nur in diesem Zug', () => { const g = setup(); const w = mk(g, 0, 'wisp'); play(g, 0, hand(g, 0, 'abusive_sergeant'), { target: w.id }); eq(g.atk(w), 3); g.endTurn(); eq(g.atk(w), 1); });
t('Dunkeleisenzwerg auf Gegner, nur in diesem Zug', () => { const g = setup(); const w = mk(g, 1, 'wisp'); play(g, 0, hand(g, 0, 'dark_iron_dwarf'), { target: w.id }); eq(g.atk(w), 3); g.endTurn(); eq(g.atk(w), 1); });
t('Verrückter Alchemist tauscht aktuelle Werte', () => { const g = setup(); const y = mk(g, 1, 'chillwind_yeti'); g.damage(null, y, 2); play(g, 0, hand(g, 0, 'crazed_alchemist'), { target: y.id }); eq(g.atk(y), 3); eq(g.hp(y), 4); eq(y.damage, 0); });
t('Alexstrasza setzt Leben auf 15 (beide Richtungen)', () => { const g = setup(); play(g, 0, hand(g, 0, 'alexstrasza'), { target: g.hero(1).id }); eq(g.hp(g.hero(1)), 15); g.hero(0).damage = 25; g.P(0).mana = 10; play(g, 0, hand(g, 0, 'alexstrasza'), { target: g.hero(0).id }); eq(g.hp(g.hero(0)), 15); eq(g.maxHp(g.hero(0)), 30); });
t('Gesichtsloser kopiert Buffs und Schaden', () => { const g = setup(); const y = mk(g, 1, 'chillwind_yeti'); g.buff(y, { atk: 2, hp: 2 }); g.damage(null, y, 1); const f = hand(g, 0, 'faceless_manipulator'); play(g, 0, f, { target: y.id }); eq(f.card, 'chillwind_yeti'); eq(g.atk(f), 6); eq(g.hp(f), 6); });
t('Weltuntergangsprophet zu Beginn des eigenen Zuges', () => { const g = setup(); mk(g, 0, 'doomsayer'); mk(g, 1, 'chillwind_yeti'); g.endTurn(); eq(g.board().length, 2); g.endTurn(); eq(g.board().length, 0); });
t('Arkangolem gibt dem Gegner einen leeren Kristall', () => { const g = setup(); g.P(1).maxMana = 5; g.P(1).mana = 5; play(g, 0, hand(g, 0, 'arcane_golem')); eq(g.P(1).maxMana, 6); eq(g.P(1).mana, 5); });
t('Kaltlichtorakel: jeder zieht 2', () => { const g = setup(); play(g, 0, hand(g, 0, 'coldlight_oracle')); eq(g.P(0).hand.length, 2); eq(g.P(1).hand.length, 2); });
t('Millhaus: gegnerische Zauber nur im nächsten Zug 0', () => { const g = setup(); play(g, 0, hand(g, 0, 'millhouse_manastorm')); g.endTurn(); const c = hand(g, 1, 'fireball'); eq(g.cost(c), 0); g.endTurn(); eq(g.cost(c), 4); });
t('Black Knight ohne Spott spielbar', () => { const g = setup(); mk(g, 1, 'wisp'); const c = hand(g, 0, 'the_black_knight'); eq(g.targetsFor(c), null); play(g, 0, c); });
t('Sylvanas stiehlt zufälligen Feind', () => { const g = setup(); const s = mk(g, 0, 'sylvanas_windrunner'); mk(g, 1, 'chillwind_yeti'); g.destroy(s); g.processDeaths(); eq(g.board(0).length, 1); eq(g.board(1).length, 0); });
t('Todesschwinge zerstört alle anderen und wirft Hand ab', () => { const g = setup(); mk(g, 1, 'wisp'); mk(g, 0, 'wisp'); hand(g, 0, 'wisp'); const d = hand(g, 0, 'deathwing'); play(g, 0, d); eq(g.board().length, 1); eq(g.P(0).hand.length, 0); });
t('Riesen-Kostenreduktion', () => { const g = setup(); const mo = hand(g, 0, 'molten_giant'); g.hero(0).damage = 15; eq(g.cost(mo), 5); const mt = hand(g, 0, 'mountain_giant'); eq(g.cost(mt), 11); mk(g, 1, 'wisp'); mk(g, 0, 'wisp'); eq(g.cost(hand(g, 0, 'sea_giant')), 8); });
t('Pint-Sized Summoner nur erster Diener', () => { const g = setup(); mk(g, 0, 'pint_sized_summoner'); const a = hand(g, 0, 'chillwind_yeti'); eq(g.cost(a), 3); play(g, 0, a); eq(g.cost(hand(g, 0, 'chillwind_yeti')), 4); });
t('Manageist / Venture Co.', () => { const g = setup(); mk(g, 1, 'mana_wraith'); mk(g, 0, 'venture_co_mercenary'); eq(g.cost(hand(g, 0, 'wisp')), 4); eq(g.cost(hand(g, 1, 'wisp')), 1); eq(g.cost(hand(g, 0, 'fireball')), 4); });
t('Baron Geddon trifft alle anderen', () => { const g = setup(); mk(g, 0, 'baron_geddon'); const w = mk(g, 0, 'chillwind_yeti'); g.endTurn(); eq(g.hero(0).damage, 2); eq(g.hero(1).damage, 2); eq(g.hp(w), 3); });
t('Ragnaros 8 Schaden zufälliger Feind, kann nicht angreifen', () => { const g = setup(); const r = mk(g, 0, 'ragnaros_the_firelord'); eq(g.canAttack(r), false); g.endTurn(); eq(g.hero(1).damage, 8); });
t('Illidan: Flamme pro gespielter Karte', () => { const g = setup(); mk(g, 0, 'illidan_stormrage'); play(g, 0, hand(g, 0, 'arcane_intellect')); eq(g.board(0).filter((m) => m.card === 't_flame_of_azzinoth').length, 1); });
t('Uralter Magier: benachbarte Zauberschaden +1', () => { const g = setup(); const a = mk(g, 0, 'wisp'); play(g, 0, hand(g, 0, 'ancient_mage'), { pos: 1 }); eq(g.spellPower(0), 1); g.silence(a); eq(g.spellPower(0), 0); });
t('Rachsüchtiger Schmied: Waffe +2 bei Wut', () => { const g = setup('warrior'); g.equip(0, 'fiery_war_axe'); const s = mk(g, 0, 'spiteful_smith'); eq(g.atk(g.weapon(0)), 3); g.damage(null, s, 1); eq(g.atk(g.weapon(0)), 5); });
t('Südmeerdeckmatrose Ansturm nur mit Waffe', () => { const g = setup('warrior'); const d = hand(g, 0, 'southsea_deckhand'); play(g, 0, d); eq(g.canAttack(d), false); g.equip(0, 'fiery_war_axe'); eq(g.canAttack(d), true); });
t('Blutsegelpirat: Angriff der Waffe', () => { const g = setup('warrior'); g.equip(0, 'fiery_war_axe'); const r = hand(g, 0, 'bloodsail_raider'); play(g, 0, r); eq(g.atk(r), 5); });
t('Kodo nur Angriff <= 2', () => { const g = setup(); const y = mk(g, 1, 'chillwind_yeti'); const w = mk(g, 1, 'wisp'); play(g, 0, hand(g, 0, 'stampeding_kodo')); g.processDeaths(); eq(w.zone, 'grave'); eq(y.zone, 'play'); });
t('Harrison Jones zieht Haltbarkeit', () => { const g = setup(); g.equip(1, 'fiery_war_axe'); play(g, 0, hand(g, 0, 'harrison_jones')); eq(g.weapon(1), null); eq(g.P(0).hand.length, 2); });
t('Zwielichtdrache +1 Leben pro Handkarte', () => { const g = setup(); for (let i = 0; i < 3; i++) hand(g, 0, 'wisp'); const d = hand(g, 0, 'twilight_drake'); play(g, 0, d); eq(g.hp(d), 4); });
t('Murlocanführer +2/+1 für alle anderen Murlocs', () => { const g = setup(); const a = mk(g, 1, 'murloc_raider'); mk(g, 0, 'murloc_warleader'); eq(g.atk(a), 4); eq(g.hp(a), 2); });
t('Alter Mirkauge zählt Murlocs beider Seiten', () => { const g = setup(); const o = mk(g, 0, 'old_murk_eye'); mk(g, 1, 'murloc_raider'); mk(g, 0, 'murloc_raider'); eq(g.atk(o), 4); });
t('Junge Priesterin +1 Leben einem anderen', () => { const g = setup(); mk(g, 0, 'young_priestess'); const w = mk(g, 0, 'wisp'); g.endTurn(); eq(g.hp(w), 2); });
t('Wichtelmeister: 1 Schaden an sich, Wichtel', () => { const g = setup(); const i = mk(g, 0, 'imp_master'); g.endTurn(); eq(g.hp(i), 4); eq(g.board(0).length, 2); });
t('Ysera: Albtraum zerstört zu Beginn des nächsten eigenen Zuges', () => { const g = setup(); const w = mk(g, 1, 'wisp'); play(g, 0, hand(g, 0, 't_nightmare'), { target: w.id }); eq(g.atk(w), 6); g.endTurn(); eq(w.zone, 'play'); g.endTurn(); eq(w.zone, 'grave'); });
t('Ysera erwacht verschont Ysera', () => { const g = setup(); const y = mk(g, 0, 'ysera'); const w = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 't_ysera_awakens')); eq(g.hp(y), 12); eq(w.zone === 'grave' || g.hp(w) <= 0, true); eq(g.hero(1).damage, 5); });
t('Lorewalker Cho gibt Kopie', () => { const g = setup(); mk(g, 0, 'lorewalker_cho'); play(g, 0, hand(g, 0, 'arcane_intellect')); eq(g.hand(1).some((c) => c.card === 'arcane_intellect'), true); });
t('Nat Pagle zieht mit 50 % zu Zugbeginn', () => { let extra = 0; for (let s = 1; s <= 40; s++) { const g = setup('mage', 'warrior', s); mk(g, 0, 'nat_pagle'); g.endTurn(); g.endTurn(); extra += g.P(0).hand.length - 1; } eq(extra > 8 && extra < 32, true, 'ca. 50 %'); });
t('Kultmeister zieht nicht beim eigenen Tod', () => { const g = setup(); const c = mk(g, 0, 'cult_master'); const w = mk(g, 0, 'wisp'); g.destroy(c); g.destroy(w); g.processDeaths(); eq(g.P(0).hand.length, 0); });
t('Bestie: Finkle für den Gegner', () => { const g = setup(); const b = mk(g, 0, 'the_beast'); g.destroy(b); g.processDeaths(); eq(g.board(1)[0].card, 't_finkle_einhorn'); });

console.log(`${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
