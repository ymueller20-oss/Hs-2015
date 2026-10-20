/* Audit-Tests für das Basis-Set (Werte/Regeln Stand 2015): node test/audit_basic.js */
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

/* Werte-Tabelle: id: [Kosten, Angriff, Leben, Klasse, Rasse] (2015) */
const STATS = {
  innervate: [0, , , 'druid'], moonfire: [0, , , 'druid'], claw: [1, , , 'druid'], mark_of_the_wild: [2, , , 'druid'], wild_growth: [2, , , 'druid'],
  healing_touch: [3, , , 'druid'], savage_roar: [3, , , 'druid'], swipe: [4, , , 'druid'], starfire: [6, , , 'druid'], ironbark_protector: [8, 8, 8, 'druid'],
  arcane_shot: [1, , , 'hunter'], hunters_mark: [1, , , 'hunter'], tracking: [1, , , 'hunter'], timber_wolf: [1, 1, 1, 'hunter', 'beast'],
  animal_companion: [3, , , 'hunter'], kill_command: [3, , , 'hunter'], multi_shot: [4, , , 'hunter'], houndmaster: [4, 4, 3, 'hunter'],
  starving_buzzard: [5, 3, 2, 'hunter', 'beast'], tundra_rhino: [5, 2, 5, 'hunter', 'beast'],
  t_misha: [3, 4, 4, 'hunter', 'beast'], t_leokk: [3, 2, 4, 'hunter', 'beast'], t_huffer: [3, 4, 2, 'hunter', 'beast'],
  arcane_missiles: [1, , , 'mage'], mirror_image: [1, , , 'mage'], arcane_explosion: [2, , , 'mage'], frostbolt: [2, , , 'mage'], arcane_intellect: [3, , , 'mage'],
  frost_nova: [3, , , 'mage'], fireball: [4, , , 'mage'], polymorph: [4, , , 'mage'], water_elemental: [4, 3, 6, 'mage'], flamestrike: [7, , , 'mage'],
  t_mirror_image: [0, 0, 2, 'mage'], t_sheep: [1, 1, 1, 'neutral', 'beast'],
  blessing_of_might: [1, , , 'paladin'], hand_of_protection: [1, , , 'paladin'], humility: [1, , , 'paladin'], lights_justice: [1, 1, 4, 'paladin'],
  holy_light: [2, , , 'paladin'], blessing_of_kings: [4, , , 'paladin'], consecration: [4, , , 'paladin'], hammer_of_wrath: [4, , , 'paladin'],
  truesilver_champion: [4, 4, 2, 'paladin'], guardian_of_kings: [7, 5, 6, 'paladin'],
  holy_smite: [1, , , 'priest'], mind_vision: [1, , , 'priest'], power_word_shield: [1, , , 'priest'], northshire_cleric: [1, 1, 3, 'priest'],
  divine_spirit: [2, , , 'priest'], shadow_word_pain: [2, , , 'priest'], mind_blast: [2, , , 'priest'], shadow_word_death: [3, , , 'priest'],
  holy_nova: [5, , , 'priest'], mind_control: [10, , , 'priest'],
  backstab: [0, , , 'rogue'], deadly_poison: [1, , , 'rogue'], sinister_strike: [1, , , 'rogue'], sap: [2, , , 'rogue'], shiv: [2, , , 'rogue'],
  fan_of_knives: [3, , , 'rogue'], assassinate: [5, , , 'rogue'], assassins_blade: [5, 3, 4, 'rogue'], vanish: [6, , , 'rogue'], sprint: [7, , , 'rogue'],
  ancestral_healing: [0, , , 'shaman'], totemic_might: [0, , , 'shaman'], frost_shock: [1, , , 'shaman'], rockbiter_weapon: [1, , , 'shaman'],
  windfury: [2, , , 'shaman'], flametongue_totem: [2, 0, 3, 'shaman', 'totem'], hex: [3, , , 'shaman'], windspeaker: [4, 3, 3, 'shaman'],
  bloodlust: [5, , , 'shaman'], fire_elemental: [6, 6, 5, 'shaman'], t_frog: [0, 0, 1, 'neutral', 'beast'],
  sacrificial_pact: [0, , , 'warlock'], corruption: [1, , , 'warlock'], mortal_coil: [1, , , 'warlock'], soulfire: [1, , , 'warlock'],
  voidwalker: [1, 1, 3, 'warlock', 'demon'], succubus: [2, 4, 3, 'warlock', 'demon'], drain_life: [3, , , 'warlock'], shadow_bolt: [3, , , 'warlock'],
  hellfire: [4, , , 'warlock'], dread_infernal: [6, 6, 6, 'warlock', 'demon'],
  execute: [1, , , 'warrior'], whirlwind: [1, , , 'warrior'], fiery_war_axe: [2, 3, 2, 'warrior'], cleave: [2, , , 'warrior'], heroic_strike: [2, , , 'warrior'],
  charge: [3, , , 'warrior'], shield_block: [3, , , 'warrior'], warsong_commander: [3, 2, 3, 'warrior'], korkron_elite: [4, 4, 3, 'warrior'], arcanite_reaper: [5, 5, 2, 'warrior'],
  elven_archer: [1, 1, 1], goldshire_footman: [1, 1, 2], grimscale_oracle: [1, 1, 1, , 'murloc'], murloc_raider: [1, 2, 1, , 'murloc'],
  stonetusk_boar: [1, 1, 1, , 'beast'], voodoo_doctor: [1, 2, 1], acidic_swamp_ooze: [2, 3, 2], bloodfen_raptor: [2, 3, 2, , 'beast'],
  bluegill_warrior: [2, 2, 1, , 'murloc'], frostwolf_grunt: [2, 2, 2], kobold_geomancer: [2, 2, 2], murloc_tidehunter: [2, 2, 1, , 'murloc'],
  novice_engineer: [2, 1, 1], river_crocolisk: [2, 2, 3, , 'beast'], dalaran_mage: [3, 1, 4], ironforge_rifleman: [3, 2, 2], ironfur_grizzly: [3, 3, 3, , 'beast'],
  magma_rager: [3, 5, 1], raid_leader: [3, 2, 2], razorfen_hunter: [3, 2, 3], shattered_sun_cleric: [3, 3, 2], silverback_patriarch: [3, 1, 4, , 'beast'],
  wolfrider: [3, 3, 1], chillwind_yeti: [4, 4, 5], dragonling_mechanic: [4, 2, 4], gnomish_inventor: [4, 2, 4], oasis_snapjaw: [4, 2, 7, , 'beast'],
  ogre_magi: [4, 4, 4], senjin_shieldmasta: [4, 3, 5], stormwind_knight: [4, 2, 5], booty_bay_bodyguard: [5, 5, 4], darkscale_healer: [5, 4, 5],
  frostwolf_warlord: [5, 4, 4], gurubashi_berserker: [5, 2, 7], nightblade: [5, 4, 4], stormpike_commando: [5, 4, 2], archmage: [6, 4, 7],
  boulderfist_ogre: [6, 6, 7], lord_of_the_arena: [6, 6, 5], reckless_rocketeer: [6, 5, 2], core_hound: [7, 9, 5, , 'beast'], stormwind_champion: [7, 6, 6],
  war_golem: [7, 7, 7], t_murloc_scout: [0, 1, 1, , 'murloc'], t_boar: [1, 1, 1, , 'beast'], t_mechanical_dragonling: [1, 2, 1, , 'mech'],
};
t('Werte-Tabelle Basis-Set', () => {
  const basic = Object.values(HS.CARDS).filter((c) => c.set === 'basic');
  eq(basic.length, 133, 'Anzahl Basis-Karten');
  for (const c of basic) { if (!STATS[c.id]) throw new Error('fehlt in Tabelle: ' + c.id); eq(c.rarity, 'free', c.id + ' Seltenheit'); }
  for (const [id, [cost, atk, hp, cls, race]] of Object.entries(STATS)) {
    const c = HS.card(id);
    eq(c.cost, cost, id + ' Kosten');
    if (atk != null) eq(c.atk, atk, id + ' Angriff');
    if (hp != null) eq(c.hp, hp, id + ' Leben');
    eq(c.cls, cls || 'neutral', id + ' Klasse');
    eq(c.race || null, race || null, id + ' Rasse');
  }
});
const KW = { taunt: ['ironbark_protector', 't_misha', 't_mirror_image', 't_frog', 'voidwalker', 'goldshire_footman', 'frostwolf_grunt', 'ironfur_grizzly', 'silverback_patriarch', 'senjin_shieldmasta', 'booty_bay_bodyguard', 'lord_of_the_arena'],
  freezer: ['water_elemental'],
  charge: ['t_huffer', 'korkron_elite', 'stonetusk_boar', 'bluegill_warrior', 'wolfrider', 'stormwind_knight', 'reckless_rocketeer'] };
t('Schlüsselwörter', () => {
  for (const [k, ids] of Object.entries(KW)) for (const id of ids) eq(HS.card(id).kw.includes(k), true, id + ' ' + k);
  for (const c of Object.values(HS.CARDS)) if (c.set === 'basic' && c.type === 'minion') for (const k of c.kw) if (!KW[k] || !KW[k].includes(c.id)) throw new Error('unerwartet ' + c.id + ' ' + k);
  for (const id of ['kobold_geomancer', 'dalaran_mage', 'ogre_magi', 'archmage']) eq(HS.card(id).spellDamage, 1, id);
});

/* Korrekturen */
t('Mirror Image braucht Platz auf dem Feld', () => { const g = setup(); for (let i = 0; i < 7; i++) mk(g, 0, 'wisp'); eq(g.canPlay(0, hand(g, 0, 'mirror_image')), false); });
t('Mirror Image mit 6 Dienern ruft eins herbei', () => { const g = setup(); for (let i = 0; i < 6; i++) mk(g, 0, 'wisp'); play(g, 0, hand(g, 0, 'mirror_image')); eq(g.board(0).length, 7); });
t('Sacrificial Pact auf eigenen Jaraxxus verliert trotz Heilung', () => { const g = setup('warlock'); const h = HS.replaceHero(g, 0, 't_jaraxxus_hero', 'hp_inferno'); h.armor = 2; play(g, 0, hand(g, 0, 'sacrificial_pact'), { target: h.id }); eq(g.s.phase, 'over'); eq(g.s.winner, 1); });
t('Sacrificial Pact auf feindlichen Jaraxxus', () => { const g = setup('warlock', 'warlock'); const h = HS.replaceHero(g, 1, 't_jaraxxus_hero', 'hp_inferno'); h.armor = 10; g.hero(0).damage = 10; play(g, 0, hand(g, 0, 'sacrificial_pact'), { target: h.id }); eq(g.s.winner, 0); });
t('Sacrificial Pact auf Diener heilt', () => { const g = setup('warlock'); g.hero(0).damage = 10; const v = mk(g, 1, 'voidwalker'); const c = hand(g, 0, 'sacrificial_pact'); eq(g.targetsFor(c).length, 1); play(g, 0, c, { target: v.id }); eq(v.zone, 'grave'); eq(g.hero(0).damage, 5); });

/* verifizierte Sonderfälle */
t('Arcane Missiles + Zauberschaden = 4 Geschosse nur auf Feinde', () => { const g = setup(); mk(g, 0, 'kobold_geomancer'); play(g, 0, hand(g, 0, 'arcane_missiles')); eq(g.hero(1).damage, 4); eq(g.hero(0).damage, 0); });
t('Multi-Shot / Cleave brauchen 2 feindliche Diener', () => { const g = setup('hunter'); mk(g, 1, 'chillwind_yeti'); eq(g.canPlay(0, hand(g, 0, 'multi_shot')), false); eq(g.canPlay(0, hand(g, 0, 'cleave')), false); const a = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'multi_shot')); eq(g.hp(a), 2); });
t('Execute nur verletzte feindliche Diener', () => { const g = setup('warrior'); const m = mk(g, 0, 'chillwind_yeti'); m.damage = 1; const e = mk(g, 1, 'chillwind_yeti'); const c = hand(g, 0, 'execute'); eq(g.canPlay(0, c), false); e.damage = 1; eq(g.targetsFor(c).length, 1); play(g, 0, c, { target: e.id }); eq(e.zone, 'grave'); });
t('Shadow Word: Death >= 5 / Pain <= 3', () => { const g = setup('priest'); mk(g, 1, 'river_crocolisk'); const m = mk(g, 1, 'magma_rager'); const r = mk(g, 1, 'chillwind_yeti'); eq(g.targetsFor(hand(g, 0, 'shadow_word_death')).length, 1); const p = g.targetsFor(hand(g, 0, 'shadow_word_pain')); eq(p.length, 1); eq(p[0].card, 'river_crocolisk'); void m; void r; });
t('Mind Control bei vollem Feld nicht spielbar', () => { const g = setup('priest'); for (let i = 0; i < 7; i++) mk(g, 0, 'wisp'); mk(g, 1, 'chillwind_yeti'); eq(g.canPlay(0, hand(g, 0, 'mind_control')), false); });
t('Water Elemental friert ein', () => { const g = setup(); const w = mk(g, 0, 'water_elemental'); g.attack(w.id, g.hero(1).id); eq(g.hero(1).frozen, true); });
t('Frostbolt friert ein', () => { const g = setup(); const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'frostbolt'), { target: y.id }); eq(g.hp(y), 2); eq(y.frozen, true); });
t('Tracking: eine ziehen, zwei abwerfen', () => { const g = setup('hunter'); const n = g.P(0).deck.length; play(g, 0, hand(g, 0, 'tracking')); eq(g.s.pending.options.length, 3); g.choose(0, 1); eq(g.P(0).hand.length, 1); eq(g.P(0).deck.length, n - 3); });
t('Animal Companion', () => { const g = setup('hunter'); play(g, 0, hand(g, 0, 'animal_companion')); eq(['t_misha', 't_leokk', 't_huffer'].includes(g.board(0)[0].card), true); });
t('Starving Buzzard zieht bei Beast', () => { const g = setup('hunter'); mk(g, 0, 'starving_buzzard'); play(g, 0, hand(g, 0, 'river_crocolisk')); eq(g.P(0).hand.length, 1); play(g, 0, hand(g, 0, 'chillwind_yeti')); eq(g.P(0).hand.length, 1); });
t('Timber Wolf / Leokk / Raid Leader / Champion', () => { const g = setup('hunter'); const r = mk(g, 0, 'river_crocolisk'); const w = mk(g, 0, 'timber_wolf'); mk(g, 0, 'stormwind_champion'); eq(g.atk(r), 4); eq(g.hp(r), 4); eq(g.atk(w), 2); });
t('Grimscale Oracle wirkt auf alle Murlocs', () => { const g = setup(); mk(g, 0, 'grimscale_oracle'); const e = mk(g, 1, 'murloc_raider'); eq(g.atk(e), 3); });
t('Hunter\'s Mark + Aura', () => { const g = setup('hunter'); const y = mk(g, 1, 'chillwind_yeti'); y.damage = 2; play(g, 0, hand(g, 0, 'hunters_mark'), { target: y.id }); eq(g.hp(y), 1); });
t('Divine Spirit verdoppelt aktuelles Leben', () => { const g = setup('priest'); const y = mk(g, 0, 'chillwind_yeti'); y.damage = 2; play(g, 0, hand(g, 0, 'divine_spirit'), { target: y.id }); eq(g.hp(y), 6); });
t('Wild Growth bei 10 Kristallen gibt Excess Mana', () => { const g = setup('druid'); play(g, 0, hand(g, 0, 'wild_growth')); eq(g.hand(0)[0].card, 't_excess_mana'); });
t('Truesilver heilt beim Angriff', () => { const g = setup('paladin'); g.hero(0).damage = 5; play(g, 0, hand(g, 0, 'truesilver_champion')); g.attack(g.hero(0).id, g.hero(1).id); eq(g.hero(0).damage, 3); eq(g.hero(1).damage, 4); });
t('Swipe 4 + 1', () => { const g = setup('druid'); const a = mk(g, 1, 'chillwind_yeti'), b = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'swipe'), { target: a.id }); eq(g.hp(a), 1); eq(g.hp(b), 4); eq(g.hero(1).damage, 1); });
t('Holy Nova schadet Feinden, heilt Freunde', () => { const g = setup('priest'); g.hero(0).damage = 5; const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'holy_nova')); eq(g.hero(0).damage, 3); eq(g.hp(y), 3); eq(g.hero(1).damage, 2); });
t('Dread Infernal trifft alle anderen', () => { const g = setup('warlock'); const w = mk(g, 0, 'chillwind_yeti'); const d = hand(g, 0, 'dread_infernal'); play(g, 0, d); eq(g.hp(w), 4); eq(g.hero(0).damage, 1); eq(g.hero(1).damage, 1); eq(g.hp(d), 6); });
t('Corruption vernichtet zu Beginn des eigenen Zuges', () => { const g = setup('warlock'); const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'corruption'), { target: y.id }); g.endTurn(); eq(y.zone, 'play'); g.endTurn(); eq(y.zone, 'grave'); });
t('Mortal Coil zieht nur bei Tod', () => { const g = setup('warlock'); const w = mk(g, 1, 'wisp'); const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'mortal_coil'), { target: y.id }); eq(g.P(0).hand.length, 0); play(g, 0, hand(g, 0, 'mortal_coil'), { target: w.id }); eq(g.P(0).hand.length, 1); });
t('Charge (Krieger) +2 und Ansturm', () => { const g = setup('warrior'); const c = hand(g, 0, 'chillwind_yeti'); play(g, 0, c); play(g, 0, hand(g, 0, 'charge'), { target: c.id }); eq(g.atk(c), 6); eq(g.canAttack(c), true); });
t('Battlecry-Ziel optional ohne Ziele', () => { const g = setup(); eq(g.targetsFor(hand(g, 0, 'shattered_sun_cleric')), null); eq(g.targetsFor(hand(g, 0, 'windspeaker')), null); });
t('Acidic Swamp Ooze zerstört Waffe', () => { const g = setup(); g.equip(1, 'fiery_war_axe'); play(g, 0, hand(g, 0, 'acidic_swamp_ooze')); eq(g.weapon(1), null); });
t('Murloc Tidehunter / Razorfen rechts daneben', () => { const g = setup(); mk(g, 0, 'wisp'); const c = hand(g, 0, 'murloc_tidehunter'); play(g, 0, c, { pos: 0 }); eq(g.board(0)[1].card, 't_murloc_scout'); });
t('Sap / Vanish', () => { const g = setup('rogue'); mk(g, 0, 'wisp'); mk(g, 1, 'wisp'); play(g, 0, hand(g, 0, 'vanish')); eq(g.board().length, 0); eq(g.P(0).hand.length, 1); eq(g.P(1).hand.length, 1); });
t('Backstab nur unverletzte Diener', () => { const g = setup('rogue'); const y = mk(g, 1, 'chillwind_yeti'); y.damage = 1; eq(g.canPlay(0, hand(g, 0, 'backstab')), false); });
t('Savage Roar inkl. Held', () => { const g = setup('druid'); const w = mk(g, 0, 'wisp'); play(g, 0, hand(g, 0, 'savage_roar')); eq(g.atk(w), 3); eq(g.atk(g.hero(0)), 2); g.endTurn(); eq(g.atk(w), 1); });

console.log(`${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
