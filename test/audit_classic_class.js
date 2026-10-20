/* Audit-Tests für Klassik-Klassenkarten: node test/audit_classic_class.js */
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
const secret = (g, pi, id) => { const c = g.s.cur; g.s.cur = pi; play(g, pi, hand(g, pi, id)); g.s.cur = c; };
const C = (id) => HS.CARDS[id];

/* Werte (Stand Mitte 2015) */
const V = {
  unleash_the_hounds: [3], blade_flurry: [2], force_of_nature: [6], ancient_of_lore: [7, 5, 5], keeper_of_the_grove: [4, 2, 4],
  master_of_disguise: [4, 4, 4], summoning_portal: [4, 0, 4], lord_jaraxxus: [9, 3, 15], gorehowl: [7, 7, 1], perditions_blade: [3, 2, 2],
  mana_wyrm: [1, 1, 3], blood_imp: [1, 0, 1], earth_elemental: [5, 7, 8], doomhammer: [5, 2, 8], kirin_tor_mage: [3, 4, 3],
};
for (const [id, [c, a, h]] of Object.entries(V)) t('Werte ' + id, () => { eq(C(id).cost, c, 'Kosten'); if (a != null) { eq(C(id).atk, a, 'Angriff'); eq(C(id).hp, h, 'Leben'); } });
t('Seltenheiten', () => { eq(C('summoning_portal').rarity, 'common'); eq(C('void_terror').rarity, 'rare'); eq(C('lord_jaraxxus').rarity, 'legendary'); });
t('Overload-Werte', () => { for (const [id, n] of [['earth_elemental', 3], ['forked_lightning', 2], ['lightning_bolt', 1], ['dust_devil', 2], ['stormforged_axe', 1], ['feral_spirit', 2], ['lava_burst', 2], ['lightning_storm', 2], ['doomhammer', 2]]) eq(C(id).overload, n, id); });
t('Name Perdition\'s Blade', () => eq(C('perditions_blade').name, 'Perdition\'s Blade'));

/* Korrekturen */
t('Headcrack Combo kehrt am Ende des Zuges zurück', () => {
  const g = setup('rogue'); play(g, 0, hand(g, 0, 'wisp')); play(g, 0, hand(g, 0, 'headcrack'));
  eq(g.hand(0).some((c) => c.card === 'headcrack'), false); g.endTurn(); eq(g.hand(0).some((c) => c.card === 'headcrack'), true);
  g.endTurn(); eq(g.hand(0).filter((c) => c.card === 'headcrack').length, 1);
});
t('Headcrack ohne Combo kehrt nicht zurück', () => { const g = setup('rogue'); play(g, 0, hand(g, 0, 'headcrack')); g.endTurn(); g.endTurn(); eq(g.hand(0).some((c) => c.card === 'headcrack'), false); });
t('Sense Demons: Hand voll verbrennt den Dämon', () => {
  const g = setup('warlock'); g.P(0).deck.push(g.newEnt('voidwalker', 0, 'deck').id);
  for (let i = 0; i < 9; i++) hand(g, 0, 'wisp'); const n = g.P(0).deck.length;
  play(g, 0, hand(g, 0, 'sense_demons')); eq(g.P(0).deck.length, n - 1); eq(g.deck(0).some((c) => c.card === 'voidwalker'), false);
});
t('Sense Demons ohne Dämonen: zwei Worthless Imps', () => { const g = setup('warlock'); play(g, 0, hand(g, 0, 'sense_demons')); eq(g.hand(0).filter((c) => c.card === 't_worthless_imp').length, 2); });
t('Force of Nature / Feral Spirit brauchen Platz', () => {
  const g = setup('druid'); for (let i = 0; i < 7; i++) mk(g, 0, 'wisp');
  eq(g.canPlay(0, hand(g, 0, 'force_of_nature')), false); eq(g.canPlay(0, hand(g, 0, 'feral_spirit')), false);
});
t('Force of Nature: Treants mit Charge sterben am Zugende', () => { const g = setup('druid'); play(g, 0, hand(g, 0, 'force_of_nature')); eq(g.board(0).length, 3); eq(g.canAttack(g.board(0)[0]), true); g.endTurn(); eq(g.board(0).length, 0); });
t('Redemption + Sword of Justice: 1 Leben, dann +1/+1', () => {
  const g = setup('paladin'); g.s.cur = 1; g.equip(1, 'sword_of_justice'); g.s.cur = 0; secret(g, 1, 'redemption');
  const y = mk(g, 1, 'chillwind_yeti'); g.weapon(1).damage = 0; const d = g.weapon(1).damage;
  play(g, 0, hand(g, 0, 'assassinate'), { target: y.id }); const r = g.board(1)[0];
  eq(r.card, 'chillwind_yeti'); eq(g.hp(r), 2); eq(g.atk(r), 5); eq(g.weapon(1).damage, d + 1);
});
t('Redemption: Stille stellt kein Leben her', () => { const g = setup('paladin'); secret(g, 1, 'redemption'); const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'assassinate'), { target: y.id }); const r = g.board(1)[0]; g.silence(r); eq(g.hp(r), 1); });
t('Misdirection lenkt auf den Helden des Angreifers um', () => {
  const g = setup(); secret(g, 1, 'misdirection'); const w = mk(g, 1, 'worgen_infiltrator'); void w;
  /* getarnter Diener scheidet aus, Held des Angreifers bleibt gültiges Ziel */
  const a = mk(g, 0, 'chillwind_yeti'); g.attack(a.id, g.hero(1).id); eq(g.P(1).secrets.length, 0); eq(g.hero(1).damage, 0); eq(g.hero(0).damage, 4);
});
t('Misdirection bleibt ohne gültiges Ziel liegen', () => {
  const g = setup('rogue'); secret(g, 1, 'misdirection'); mk(g, 1, 'worgen_infiltrator'); g.equip(0, 't_wicked_knife');
  /* Held greift an: Kandidaten = nur getarnter Diener -> keine Auslösung */
  g.attack(g.hero(0).id, g.hero(1).id); eq(g.P(1).secrets.length, 1); eq(g.hero(1).damage, 1);
});

/* Verifizierte knifflige Karten */
t('Blade Flurry trifft alle Feinde inkl. Held, Zauberschaden', () => {
  const g = setup('rogue'); g.equip(0, 'fiery_war_axe'); mk(g, 0, 'kobold_geomancer'); const y = mk(g, 1, 'chillwind_yeti');
  play(g, 0, hand(g, 0, 'blade_flurry')); eq(g.hero(1).damage, 4); eq(g.hp(y), 1); eq(g.weapon(0), null);
});
t('Avenging Wrath: Zauberschaden erhöht Geschosse', () => { const g = setup('paladin'); mk(g, 0, 'kobold_geomancer'); play(g, 0, hand(g, 0, 'avenging_wrath')); eq(g.hero(1).damage, 9); });
t('Holy Wrath: Schaden = Kosten der gezogenen Karte', () => { const g = setup('paladin'); g.P(0).deck.push(g.newEnt('chillwind_yeti', 0, 'deck').id); play(g, 0, hand(g, 0, 'holy_wrath'), { target: g.hero(1).id }); eq(g.hero(1).damage, 4); });
t('Equality + Consecration', () => { const g = setup('paladin'); mk(g, 1, 'boulderfist_ogre'); play(g, 0, hand(g, 0, 'equality')); play(g, 0, hand(g, 0, 'consecration')); eq(g.board(1).length, 0); });
t('Shadow Madness nur <=3 Angriff', () => { const g = setup('priest'); mk(g, 1, 'chillwind_yeti'); const r = mk(g, 1, 'bloodfen_raptor'); const c = hand(g, 0, 'shadow_madness'); eq(g.targetsFor(c).length, 1); eq(g.targetsFor(c)[0], r); });
t('Cabal Shadow Priest nur <=2 Angriff, sonst kein Ziel', () => { const g = setup('priest'); mk(g, 1, 'chillwind_yeti'); const c = hand(g, 0, 'cabal_shadow_priest'); eq(g.targetsFor(c), null); play(g, 0, c); eq(g.board(1).length, 1); });
t('Shadowform zweimal -> Mind Shatter', () => { const g = setup('priest'); play(g, 0, hand(g, 0, 'shadowform')); eq(g.power(0).card, 'hp_mind_spike'); play(g, 0, hand(g, 0, 'shadowform')); eq(g.power(0).card, 'hp_mind_shatter'); g.usePower(0, g.hero(1).id); eq(g.hero(1).damage, 3); });
t('Lightwell heilt verletzten Helden', () => { const g = setup('priest'); mk(g, 0, 'lightwell'); g.hero(0).damage = 5; g.endTurn(); g.endTurn(); eq(g.hero(0).damage, 2); });
t('Mindgames ohne Diener im Deck', () => { const g = setup('priest'); g.P(1).deck = []; play(g, 0, hand(g, 0, 'mindgames')); eq(g.board(0)[0].card, 't_shadow_of_nothing'); });
t('Thoughtsteal kopiert 2 Karten', () => { const g = setup('priest'); const n = g.P(1).deck.length; play(g, 0, hand(g, 0, 'thoughtsteal')); eq(g.P(0).hand.length, 2); eq(g.P(1).deck.length, n); });
t('Jaraxxus behält Rüstung, INFERNO! gleich nutzbar', () => { const g = setup('warlock'); g.hero(0).armor = 4; play(g, 0, hand(g, 0, 'lord_jaraxxus')); eq(g.hero(0).armor, 4); eq(g.hp(g.hero(0)), 15); g.P(0).mana = 10; eq(g.usePower(0), true); eq(g.board(0)[0].card, 't_infernal'); });
t('Power Overwhelming stirbt am Zugende', () => { const g = setup('warlock'); const w = mk(g, 0, 'wisp'); play(g, 0, hand(g, 0, 'power_overwhelming'), { target: w.id }); eq(g.atk(w), 5); g.endTurn(); eq(w.zone, 'grave'); });
t('Blood Imp gibt anderem Diener +1 Leben', () => { const g = setup('warlock'); mk(g, 0, 'blood_imp'); const w = mk(g, 0, 'wisp'); g.endTurn(); eq(g.maxHp(w), 2); });
t('Felguard zerstört Manakristall', () => { const g = setup('warlock'); play(g, 0, hand(g, 0, 'felguard')); eq(g.P(0).maxMana, 9); eq(g.P(0).mana, 7); });
t('Doomguard wirft 2 ab', () => { const g = setup('warlock'); hand(g, 0, 'wisp'); hand(g, 0, 'wisp'); hand(g, 0, 'wisp'); const d = hand(g, 0, 'doomguard'); play(g, 0, d); eq(g.P(0).hand.length, 1); eq(g.canAttack(d), true); });
t('Bane of Doom ruft Dämon bei Kill', () => { const g = setup('warlock'); const w = mk(g, 1, 'wisp'); play(g, 0, hand(g, 0, 'bane_of_doom'), { target: w.id }); eq(g.board(0).length, 1); eq(g.isRace(g.board(0)[0], 'demon'), true); });
t('Siphon Soul heilt 3', () => { const g = setup('warlock'); g.hero(0).damage = 10; const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'siphon_soul'), { target: y.id }); eq(g.hero(0).damage, 7); eq(y.zone, 'grave'); });
t('Void Terror frisst Nachbarn', () => { const g = setup('warlock'); mk(g, 0, 'wisp'); mk(g, 0, 'wisp'); const v = hand(g, 0, 'void_terror'); play(g, 0, v, { pos: 1 }); eq(g.atk(v), 5); eq(g.board(0).length, 1); });
t('Gorehowl: gegen Helden verliert er Haltbarkeit', () => { const g = setup('warrior'); play(g, 0, hand(g, 0, 'gorehowl')); g.attack(g.hero(0).id, g.hero(1).id); eq(g.hero(1).damage, 7); eq(g.weapon(0), null); });
t('Gorehowl mit 0 Angriff wird nicht zerstört', () => { const g = setup('warrior'); play(g, 0, hand(g, 0, 'gorehowl')); g.buff(g.weapon(0), { atk: -6 }); const y = mk(g, 1, 'chillwind_yeti'); g.attack(g.hero(0).id, y.id); eq(g.atk(g.weapon(0)), 0); eq(!!g.weapon(0), true); });
t('Brawl lässt genau einen übrig', () => { const g = setup('warrior'); for (let i = 0; i < 3; i++) { mk(g, 0, 'wisp'); mk(g, 1, 'wisp'); } play(g, 0, hand(g, 0, 'brawl')); eq(g.board().length, 1); });
t('Frothing Berserker zählt jeden Diener', () => { const g = setup('warrior'); const f = mk(g, 0, 'frothing_berserker'); mk(g, 1, 'chillwind_yeti'); mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'whirlwind')); eq(g.atk(f), 5); });
t('Grommash Enrage', () => { const g = setup('warrior'); const c = hand(g, 0, 'grommash_hellscream'); play(g, 0, c); eq(g.atk(c), 4); play(g, 0, hand(g, 0, 'inner_rage'), { target: c.id }); eq(g.atk(c), 12); });
t('Shield Slam', () => { const g = setup('warrior'); g.hero(0).armor = 5; const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'shield_slam'), { target: y.id }); eq(y.zone, 'grave'); });
t('Upgrade! ohne/mit Waffe', () => { const g = setup('warrior'); play(g, 0, hand(g, 0, 'upgrade')); eq(g.weapon(0).card, 't_heavy_axe'); play(g, 0, hand(g, 0, 'upgrade')); eq(g.atk(g.weapon(0)), 2); eq(g.hp(g.weapon(0)), 4); });
t('Slam zieht nur bei Überleben', () => { const g = setup('warrior'); const y = mk(g, 1, 'chillwind_yeti'); const w = mk(g, 1, 'wisp'); play(g, 0, hand(g, 0, 'slam'), { target: y.id }); eq(g.P(0).hand.length, 1); play(g, 0, hand(g, 0, 'slam'), { target: w.id }); eq(g.P(0).hand.length, 1); });
t('Bestial Wrath nur befreundetes Wildtier', () => { const g = setup('hunter'); mk(g, 0, 'wisp'); mk(g, 1, 'river_crocolisk'); eq(g.canPlay(0, hand(g, 0, 'bestial_wrath')), false); const b = mk(g, 0, 'river_crocolisk'); play(g, 0, hand(g, 0, 'bestial_wrath'), { target: b.id }); eq(g.has(b, 'immune'), true); g.endTurn(); eq(g.has(b, 'immune'), false); });
t('Eaglehorn Bow +1 bei Secret', () => { const g = setup('hunter'); g.s.cur = 1; g.equip(1, 'eaglehorn_bow'); g.s.cur = 0; secret(g, 1, 'snipe'); play(g, 0, hand(g, 0, 'chillwind_yeti')); eq(g.hp(g.weapon(1)), 3); });
t('Snake Trap', () => { const g = setup('hunter'); secret(g, 1, 'snake_trap'); const w = mk(g, 1, 'chillwind_yeti'); const a = mk(g, 0, 'wisp'); g.attack(a.id, w.id); eq(g.board(1).length, 4); });
t('Freezing Trap +2 Kosten', () => { const g = setup('hunter'); secret(g, 1, 'freezing_trap'); const a = mk(g, 0, 'chillwind_yeti'); g.attack(a.id, g.hero(1).id); eq(g.hero(1).damage, 0); eq(g.cost(g.hand(0)[0]), 6); });
t('Vaporize nur Diener', () => { const g = setup(); secret(g, 1, 'vaporize'); const a = mk(g, 0, 'chillwind_yeti'); g.attack(a.id, g.hero(1).id); eq(a.zone, 'grave'); eq(g.hero(1).damage, 0); });
t('Ice Barrier', () => { const g = setup(); secret(g, 1, 'ice_barrier'); const a = mk(g, 0, 'chillwind_yeti'); g.attack(a.id, g.hero(1).id); eq(g.hero(1).armor, 4); eq(g.hero(1).damage, 0); });
t('Eye for an Eye', () => { const g = setup('paladin'); secret(g, 1, 'eye_for_an_eye'); play(g, 0, hand(g, 0, 'fireball'), { target: g.hero(1).id }); eq(g.hero(0).damage, 6); });
t('Repentance', () => { const g = setup('paladin'); secret(g, 1, 'repentance'); const y = hand(g, 0, 'chillwind_yeti'); play(g, 0, y); eq(g.hp(y), 1); });
t('Kirin Tor Mage: nächstes Secret kostet 0', () => { const g = setup(); play(g, 0, hand(g, 0, 'kirin_tor_mage')); const s1 = hand(g, 0, 'ice_block'); const s2 = hand(g, 0, 'vaporize'); eq(g.cost(s1), 0); play(g, 0, s1); eq(g.cost(s2), 3); });
t('Ice Lance: einfrieren, dann 4 Schaden', () => { const g = setup(); const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'ice_lance'), { target: y.id }); eq(y.frozen, true); eq(y.damage, 0); play(g, 0, hand(g, 0, 'ice_lance'), { target: y.id }); eq(g.hp(y), 1); });
t('Preparation nur ein Zauber', () => { const g = setup('rogue'); play(g, 0, hand(g, 0, 'preparation')); const a = hand(g, 0, 'sprint'); const b = hand(g, 0, 'eviscerate'); eq(g.cost(a), 4); play(g, 0, a); eq(g.cost(b), 2); });
t('Betrayal', () => { const g = setup('rogue'); const l = mk(g, 1, 'wisp'); const m = mk(g, 1, 'chillwind_yeti'); const r = mk(g, 1, 'river_crocolisk'); play(g, 0, hand(g, 0, 'betrayal'), { target: m.id }); eq(l.zone, 'grave'); eq(r.zone, 'grave'); eq(g.hp(m), 5); });
t('Far Sight -3', () => { const g = setup('shaman'); g.P(0).deck.push(g.newEnt('chillwind_yeti', 0, 'deck').id); play(g, 0, hand(g, 0, 'far_sight')); eq(g.cost(g.hand(0)[0]), 1); });
t('Earth Shock: erst Silence, dann Schaden', () => { const g = setup('shaman'); const s = mk(g, 1, 'argent_squire'); play(g, 0, hand(g, 0, 'earth_shock'), { target: s.id }); eq(s.zone, 'grave'); });
t('Ancestral Spirit', () => { const g = setup('shaman'); const y = mk(g, 0, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'ancestral_spirit'), { target: y.id }); g.destroy(y); g.processDeaths(); eq(g.board(0)[0].card, 'chillwind_yeti'); });
t('Keeper of the Grove ohne Ziel spielbar', () => { const g = setup('druid'); const k = hand(g, 0, 'keeper_of_the_grove'); eq(g.canPlay(0, k, 1), true); play(g, 0, k, { choice: 1 }); eq(g.board(0).length, 1); });
t('Nourish Rampant Growth volle Kristalle', () => { const g = setup('druid'); g.P(0).maxMana = 5; g.P(0).mana = 5; play(g, 0, hand(g, 0, 'nourish'), { choice: 0 }); eq(g.P(0).maxMana, 7); eq(g.P(0).mana, 2); });
t('Cenarius Treants beidseitig', () => { const g = setup('druid'); const c = hand(g, 0, 'cenarius'); play(g, 0, c, { choice: 1 }); eq(g.pos(c), 1); eq(g.board(0).length, 3); });
console.log(`${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
