/* Audit-Tests für Naxxramas und Schwarzfels: node test/audit_naxx_brm.js */
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
const ids = (g, pi) => g.board(pi).map((m) => m.card).join(',');
const kill = (g, m) => { g.destroy(m); g.processDeaths(); };
const toDeck = (g, pi, id) => { const e = g.newEnt(id, pi, 'deck'); g.P(pi).deck.push(e.id); return e; };

/* ---------- Kartenwerte (Stand Mitte 2015) ---------- */
const VALUES = [
  // id, Kosten, Angriff, Leben, Seltenheit, Volk, Klasse
  ['zombie_chow', 1, 2, 3, 'common'], ['undertaker', 1, 1, 2, 'common'], ['echoing_ooze', 2, 1, 2, 'epic'],
  ['haunted_creeper', 2, 1, 2, 'common', 'beast'], ['mad_scientist', 2, 2, 2, 'common'], ['nerubar_weblord', 2, 1, 4, 'common'],
  ['nerubian_egg', 2, 0, 2, 'rare'], ['unstable_ghoul', 2, 1, 3, 'common'], ['dancing_swords', 3, 4, 4, 'common'],
  ['deathlord', 3, 2, 8, 'rare'], ['shade_of_naxxramas', 3, 2, 2, 'epic'], ['stoneskin_gargoyle', 3, 1, 4, 'common'],
  ['baron_rivendare', 4, 1, 7, 'legendary'], ['wailing_soul', 4, 3, 5, 'rare'], ['feugen', 5, 4, 7, 'legendary'],
  ['stalagg', 5, 7, 4, 'legendary'], ['loatheb', 5, 5, 5, 'legendary'], ['sludge_belcher', 5, 3, 5, 'rare'],
  ['spectral_knight', 5, 4, 6, 'common'], ['maexxna', 6, 2, 8, 'legendary', 'beast'], ['kelthuzad', 8, 6, 8, 'legendary'],
  ['poison_seeds', 4, null, null, 'common', null, 'druid'], ['webspinner', 1, 1, 1, 'common', 'beast', 'hunter'],
  ['duplicate', 3, null, null, 'common', null, 'mage'], ['avenge', 1, null, null, 'common', null, 'paladin'],
  ['dark_cultist', 3, 3, 4, 'common', null, 'priest'], ['anubar_ambusher', 4, 5, 5, 'common', null, 'rogue'],
  ['reincarnate', 2, null, null, 'common', null, 'shaman'], ['voidcaller', 4, 3, 4, 'common', 'demon', 'warlock'],
  ['deaths_bite', 4, 4, 2, 'common', null, 'warrior'],
  ['t_spectral_spider', 1, 1, 1], ['t_nerubian', 3, 4, 4], ['t_slime', 1, 1, 2], ['t_thaddius', 10, 11, 11], ['t_treant', 1, 2, 2],
  ['dragon_egg', 1, 0, 2, 'rare'], ['blackwing_technician', 3, 2, 4, 'common'], ['dragonkin_sorcerer', 4, 3, 5, 'common', 'dragon'],
  ['hungry_dragon', 4, 5, 6, 'common', 'dragon'], ['grim_patron', 5, 3, 3, 'rare'], ['blackwing_corruptor', 5, 5, 4, 'common'],
  ['drakonid_crusher', 6, 6, 6, 'common', 'dragon'], ['volcanic_drake', 6, 6, 4, 'common', 'dragon'],
  ['emperor_thaurissan', 6, 5, 5, 'legendary'], ['rend_blackhand', 7, 8, 4, 'legendary'], ['chromaggus', 8, 6, 8, 'legendary', 'dragon'],
  ['nefarian', 9, 8, 8, 'legendary', 'dragon'], ['majordomo_executus', 9, 9, 7, 'legendary'],
  ['druid_of_the_flame', 3, 2, 2, 'common', null, 'druid'], ['volcanic_lumberer', 9, 7, 8, 'rare', null, 'druid'],
  ['quick_shot', 2, null, null, 'common', null, 'hunter'], ['core_rager', 4, 4, 4, 'rare', 'beast', 'hunter'],
  ['flamewaker', 3, 2, 4, 'rare', null, 'mage'], ['dragons_breath', 5, null, null, 'common', null, 'mage'],
  ['solemn_vigil', 5, null, null, 'common', null, 'paladin'], ['dragon_consort', 5, 5, 5, 'rare', 'dragon', 'paladin'],
  ['twilight_whelp', 1, 2, 1, 'common', 'dragon', 'priest'], ['resurrect', 2, null, null, 'rare', null, 'priest'],
  ['gang_up', 2, null, null, 'common', null, 'rogue'], ['dark_iron_skulker', 5, 4, 3, 'rare', null, 'rogue'],
  ['lava_shock', 2, null, null, 'rare', null, 'shaman'], ['fireguard_destroyer', 4, 3, 6, 'common', null, 'shaman'],
  ['demonwrath', 3, null, null, 'rare', null, 'warlock'], ['imp_gang_boss', 3, 2, 4, 'common', 'demon', 'warlock'],
  ['revenge', 2, null, null, 'rare', null, 'warrior'], ['axe_flinger', 4, 2, 5, 'common', null, 'warrior'],
  ['t_black_whelp', 1, 2, 1, null, 'dragon'], ['t_flame_cat', 3, 5, 2, null, 'beast'], ['t_flame_bird', 3, 2, 5, null, 'beast'],
];
for (const [id, cost, atk, hp, rar, race, cls] of VALUES) {
  t('Werte ' + id, () => {
    const c = HS.card(id);
    eq(c.cost, cost, 'Kosten'); if (atk != null) eq(c.atk, atk, 'Angriff'); if (hp != null) eq(c.hp, hp, 'Leben');
    if (rar) eq(c.rarity, rar, 'Seltenheit'); eq(c.race || null, race || null, 'Volk'); eq(c.cls, cls || (id.startsWith('t_') ? c.cls : 'neutral'), 'Klasse');
  });
}
t('Satzumfang Naxx 30 / BRM 31', () => {
  eq(Object.values(HS.CARDS).filter((c) => c.set === 'naxx' && c.collectible).length, 30);
  eq(Object.values(HS.CARDS).filter((c) => c.set === 'brm' && c.collectible).length, 31);
});

/* ---------- Haunted Creeper ---------- */
t('Creeper stirbt im Kampf -> 2 Spinnen an seiner Stelle', () => {
  const g = setup(); mk(g, 0, 'wisp'); const c = mk(g, 0, 'haunted_creeper'); mk(g, 0, 'river_crocolisk');
  const y = mk(g, 1, 'chillwind_yeti'); g.attack(c.id, y.id);
  eq(ids(g, 0), 'wisp,t_spectral_spider,t_spectral_spider,river_crocolisk');
});
t('Creeper wird angegriffen (Gegnerzug)', () => {
  const g = setup(); const c = hand(g, 0, 'haunted_creeper'); play(g, 0, c); g.endTurn();
  const y = mk(g, 1, 'chillwind_yeti'); g.attack(y.id, c.id); eq(ids(g, 0), 't_spectral_spider,t_spectral_spider');
  eq(g.board(0).every((m) => g.atk(m) === 1 && g.hp(m) === 1), true);
});
t('Creeper durch Zauber (Feuerball) getötet', () => {
  const g = setup(); const c = mk(g, 1, 'haunted_creeper'); play(g, 0, hand(g, 0, 'fireball'), { target: c.id }); eq(ids(g, 1), 't_spectral_spider,t_spectral_spider');
});
t('Creeper bei vollem Brett: nur eine Spinne', () => {
  const g = setup(); for (let i = 0; i < 6; i++) mk(g, 0, 'chillwind_yeti'); const c = mk(g, 0, 'haunted_creeper'); kill(g, c);
  eq(g.board(0).length, 7); eq(g.board(0).filter((m) => m.card === 't_spectral_spider').length, 1);
});
t('Creeper mit Baron Rivendare: 4 Spinnen', () => { const g = setup(); mk(g, 0, 'baron_rivendare'); kill(g, mk(g, 0, 'haunted_creeper')); eq(g.board(0).filter((m) => m.card === 't_spectral_spider').length, 4); });
t('Baron auf gegnerischer Seite verdoppelt nicht', () => { const g = setup(); mk(g, 1, 'baron_rivendare'); kill(g, mk(g, 0, 'haunted_creeper')); eq(g.board(0).length, 2); });
t('Creeper mit Silence: keine Spinnen', () => { const g = setup(); const c = mk(g, 0, 'haunted_creeper'); g.silence(c); kill(g, c); eq(g.board(0).length, 0); });
t('Creeper + Feign Death', () => { const g = setup('hunter'); mk(g, 0, 'haunted_creeper'); play(g, 0, hand(g, 0, 'feign_death')); eq(g.board(0).length, 3); });

/* ---------- weitere Todesröcheln-Herbeirufungen ---------- */
t('Nerubian Egg -> Nerubian 4/4 an seiner Stelle', () => {
  const g = setup(); mk(g, 0, 'wisp'); const e = mk(g, 0, 'nerubian_egg'); mk(g, 0, 'wisp'); kill(g, e);
  eq(ids(g, 0), 'wisp,t_nerubian,wisp'); eq(g.atk(g.board(0)[1]), 4); eq(g.hp(g.board(0)[1]), 4);
});
t('Sludge Belcher -> Slime mit Taunt', () => {
  const g = setup(); const s = mk(g, 0, 'sludge_belcher'); eq(g.has(s, 'taunt'), true); kill(g, s);
  eq(ids(g, 0), 't_slime'); eq(g.has(g.board(0)[0], 'taunt'), true);
});
t('Feugen nach Stalagg -> Thaddius an Feugens Stelle', () => {
  const g = setup(); kill(g, mk(g, 0, 'stalagg')); eq(g.board(0).length, 0);
  mk(g, 0, 'wisp'); const f = mk(g, 0, 'feugen'); mk(g, 0, 'wisp'); kill(g, f); eq(ids(g, 0), 'wisp,t_thaddius,wisp');
});
t('Stalagg nach gegnerischem Feugen -> Thaddius', () => { const g = setup(); kill(g, mk(g, 1, 'feugen')); kill(g, mk(g, 0, 'stalagg')); eq(ids(g, 0), 't_thaddius'); });
t('Feugen allein -> kein Thaddius', () => { const g = setup(); kill(g, mk(g, 0, 'feugen')); eq(g.board(0).length, 0); });
t('Kel\'Thuzad belebt eigene in diesem Zug gestorbene Diener', () => {
  const g = setup(); mk(g, 0, 'kelthuzad'); kill(g, mk(g, 0, 'chillwind_yeti')); kill(g, mk(g, 0, 'haunted_creeper')); kill(g, mk(g, 1, 'river_crocolisk'));
  g.endTurn(); eq(ids(g, 0), 'kelthuzad,t_spectral_spider,t_spectral_spider,chillwind_yeti,haunted_creeper'); eq(g.board(1).length, 0);
});
t('Kel\'Thuzad im Gegnerzug', () => { const g = setup(); mk(g, 0, 'kelthuzad'); g.endTurn(); kill(g, mk(g, 0, 'wisp')); g.endTurn(); eq(ids(g, 0), 'kelthuzad,wisp'); });
t('Undertaker +1 Angriff für Todesröcheln-Diener', () => {
  const g = setup(); const u = mk(g, 0, 'undertaker'); play(g, 0, hand(g, 0, 'haunted_creeper')); eq(g.atk(u), 2); eq(g.hp(u), 2);
  play(g, 0, hand(g, 0, 'wisp')); eq(g.atk(u), 2); mk(g, 1, 'haunted_creeper'); eq(g.atk(u), 2);
});
t('Echoing Ooze kopiert sich am Zugende', () => {
  const g = setup(); const o = hand(g, 0, 'echoing_ooze'); play(g, 0, o); mk(g, 0, 'wisp'); g.buff(o, { atk: 2 }); g.endTurn();
  eq(ids(g, 0), 'echoing_ooze,echoing_ooze,wisp'); eq(g.atk(g.board(0)[1]), 3); g.endTurn(); g.endTurn(); eq(g.board(0).length, 3);
});
t('Echoing Ooze mit Silence: keine Kopie', () => { const g = setup(); const o = hand(g, 0, 'echoing_ooze'); play(g, 0, o); g.silence(o); g.endTurn(); eq(g.board(0).length, 1); });
t('Voidcaller legt Demon von der Hand ohne Battlecry', () => {
  const g = setup('warlock'); hand(g, 0, 'flame_imp'); hand(g, 0, 'wisp'); mk(g, 0, 'wisp'); const v = mk(g, 0, 'voidcaller'); mk(g, 0, 'wisp'); kill(g, v);
  eq(ids(g, 0), 'wisp,flame_imp,wisp'); eq(g.hero(0).damage, 0); eq(g.P(0).hand.length, 1);
});
t('Deathlord legt gegnerischen Diener aus dessen Deck', () => {
  const g = setup(); const d = mk(g, 0, 'deathlord'); g.P(1).deck = []; toDeck(g, 1, 'fireball'); toDeck(g, 1, 'chillwind_yeti'); kill(g, d);
  eq(ids(g, 1), 'chillwind_yeti'); eq(g.P(1).deck.length, 1);
});
t('Mad Scientist legt Secret aus Deck (ohne Secretkeeper/Kirin Tor)', () => {
  const g = setup(); const k = mk(g, 0, 'secretkeeper'); toDeck(g, 0, 'mirror_entity'); const n = g.P(0).deck.length; kill(g, mk(g, 0, 'mad_scientist'));
  eq(g.P(0).secrets.length, 1); eq(g.ent(g.P(0).secrets[0]).card, 'mirror_entity'); eq(g.P(0).deck.length, n - 1); eq(g.atk(k), 1);
});
t('Mad Scientist legt kein doppeltes Secret', () => {
  const g = setup(); play(g, 0, hand(g, 0, 'mirror_entity')); toDeck(g, 0, 'mirror_entity'); kill(g, mk(g, 0, 'mad_scientist')); eq(g.P(0).secrets.length, 1);
});
t('Mad Scientist + Kirin Tor Mage: Effekt bleibt', () => {
  const g = setup(); play(g, 0, hand(g, 0, 'kirin_tor_mage')); toDeck(g, 0, 'ice_barrier'); kill(g, mk(g, 0, 'mad_scientist'));
  eq(g.cost(hand(g, 0, 'vaporize')), 0);
});
t('Nerub\'ar Weblord: nur Battlecry-Diener +2', () => {
  const g = setup(); mk(g, 1, 'nerubar_weblord');
  eq(g.cost(hand(g, 0, 'elven_archer')), 3); eq(g.cost(hand(g, 0, 'chillwind_yeti')), 4);
  eq(g.cost(hand(g, 0, 'druid_of_the_claw')), 5); eq(g.cost(hand(g, 0, 'si7_agent')), 3); eq(g.cost(hand(g, 0, 'fireball')), 4);
});
t('Duplicate: 2 Kopien auf die Hand', () => {
  const g = setup(); play(g, 0, hand(g, 0, 'duplicate')); const y = mk(g, 0, 'chillwind_yeti'); g.buff(y, { atk: 5 }); g.endTurn(); g.P(1).hand = []; kill(g, y);
  eq(g.hand(0).filter((c) => c.card === 'chillwind_yeti').length, 2); eq(g.P(0).secrets.length, 0);
});
t('Avenge: +3/+2 für zufälligen befreundeten Diener', () => {
  const g = setup('paladin'); play(g, 0, hand(g, 0, 'avenge')); const w = mk(g, 0, 'wisp'); const y = mk(g, 0, 'chillwind_yeti'); g.endTurn(); kill(g, w);
  eq(g.atk(y), 7); eq(g.hp(y), 7);
});
t('Avenge ohne anderen Diener bleibt', () => { const g = setup('paladin'); play(g, 0, hand(g, 0, 'avenge')); const w = mk(g, 0, 'wisp'); g.endTurn(); kill(g, w); eq(g.P(0).secrets.length, 1); });
t('Reincarnate auf Creeper: Spinnen + neuer Creeper', () => {
  const g = setup('shaman'); const c = mk(g, 0, 'haunted_creeper'); c.damage = 1; play(g, 0, hand(g, 0, 'reincarnate'), { target: c.id });
  eq(g.board(0).length, 3); const n = g.board(0).find((m) => m.card === 'haunted_creeper'); eq(g.hp(n), 2);
});
t('Poison Seeds: Treants für jeden Diener', () => {
  const g = setup('druid'); mk(g, 0, 'chillwind_yeti'); mk(g, 1, 'wisp'); mk(g, 1, 'wisp'); play(g, 0, hand(g, 0, 'poison_seeds'));
  eq(ids(g, 0), 't_treant'); eq(ids(g, 1), 't_treant,t_treant');
});
t('Anub\'ar Ambusher', () => { const g = setup('rogue'); mk(g, 0, 'wisp'); kill(g, mk(g, 0, 'anubar_ambusher')); eq(g.board(0).length, 0); eq(g.hand(0)[0].card, 'wisp'); });
t('Dark Cultist', () => { const g = setup('priest'); const w = mk(g, 0, 'wisp'); kill(g, mk(g, 0, 'dark_cultist')); eq(g.hp(w), 4); eq(g.atk(w), 1); });
t('Webspinner', () => { const g = setup('hunter'); kill(g, mk(g, 0, 'webspinner')); const c = HS.card(g.hand(0)[0].card); eq(c.race, 'beast'); eq(c.type, 'minion'); });
t('Death\'s Bite Todesröcheln beim Zerbrechen', () => {
  const g = setup('warrior'); play(g, 0, hand(g, 0, 'deaths_bite')); const y = mk(g, 1, 'chillwind_yeti'); const w = mk(g, 0, 'wisp');
  g.attack(g.hero(0).id, g.hero(1).id); g.attack(g.hero(0).id, g.hero(1).id); g.endTurn(); g.endTurn(); g.attack(g.hero(0).id, g.hero(1).id);
  eq(g.weapon(0), null); eq(g.hp(y), 4); eq(g.inPlay(w), false); eq(g.hero(1).damage, 8);
});
t('Unstable Ghoul / Dancing Swords / Zombie Chow', () => {
  const g = setup(); const y = mk(g, 1, 'chillwind_yeti'); const gh = mk(g, 0, 'unstable_ghoul'); eq(g.has(gh, 'taunt'), true); kill(g, gh); eq(g.hp(y), 4);
  const n = g.P(1).hand.length; kill(g, mk(g, 0, 'dancing_swords')); eq(g.P(1).hand.length, n + 1);
  g.hero(1).damage = 10; kill(g, mk(g, 0, 'zombie_chow')); eq(g.hero(1).damage, 5);
});
t('Loatheb: gegnerische Zauber nächsten Zug +5', () => {
  const g = setup(); const f = hand(g, 1, 'fireball'); play(g, 0, hand(g, 0, 'loatheb')); g.endTurn(); eq(g.cost(f), 9); g.endTurn(); eq(g.cost(f), 4);
});
t('Spectral Knight: kein Ziel für Zauber/Heldenfähigkeit', () => {
  const g = setup(); const k = mk(g, 1, 'spectral_knight'); eq(g.targetsFor(hand(g, 0, 'fireball')).includes(k), false); eq(g.powerTargets(0).includes(k), false);
  eq(g.targetsFor(hand(g, 0, 'elven_archer')).includes(k), true);
});
t('Maexxna vernichtet', () => { const g = setup(); const m = mk(g, 0, 'maexxna'); const y = mk(g, 1, 'war_golem'); g.attack(m.id, y.id); eq(g.inPlay(y), false); eq(g.inPlay(m), true); });
t('Stoneskin Gargoyle / Shade of Naxxramas', () => {
  const g = setup(); const s = mk(g, 0, 'stoneskin_gargoyle'); const sh = mk(g, 0, 'shade_of_naxxramas'); s.damage = 3; eq(g.has(sh, 'stealth'), true);
  g.endTurn(); eq(s.damage, 3); eq(g.atk(sh), 2); g.endTurn(); eq(s.damage, 0); eq(g.atk(sh), 3); eq(g.hp(sh), 3);
});
t('Wailing Soul', () => { const g = setup(); const c = mk(g, 0, 'haunted_creeper'); const e = mk(g, 1, 'haunted_creeper'); play(g, 0, hand(g, 0, 'wailing_soul')); eq(c.silenced, true); eq(e.silenced, false); });

/* ---------- Schwarzfels ---------- */
t('Dragon Egg: Welpe rechts daneben, auch beim Sterben', () => {
  const g = setup(); const e = mk(g, 0, 'dragon_egg'); mk(g, 0, 'wisp'); g.damage(null, e, 1); eq(ids(g, 0), 'dragon_egg,t_black_whelp,wisp');
  play(g, 0, hand(g, 0, 'fireball'), { target: e.id }); eq(ids(g, 0), 't_black_whelp,t_black_whelp,wisp');
});
t('Grim Patron stirbt -> keine Kopie', () => { const g = setup(); const p = mk(g, 0, 'grim_patron'); play(g, 0, hand(g, 0, 'fireball'), { target: p.id }); eq(g.board(0).length, 0); });
t('Imp Gang Boss beim Sterben', () => { const g = setup(); const b = mk(g, 0, 'imp_gang_boss'); play(g, 0, hand(g, 0, 'fireball'), { target: b.id }); eq(ids(g, 0), 't_imp'); });
t('Axe Flinger', () => { const g = setup('warrior'); const a = mk(g, 0, 'axe_flinger'); g.damage(null, a, 1); eq(g.hero(1).damage, 2); });
t('Hungry Dragon ruft 1-Kosten-Diener für Gegner', () => {
  const g = setup(); play(g, 0, hand(g, 0, 'hungry_dragon')); eq(g.board(1).length, 1); eq(HS.card(g.board(1)[0].card).cost, 1); eq(HS.card(g.board(1)[0].card).collectible, true);
});
t('Dragonkin Sorcerer', () => {
  const g = setup('priest'); const d = mk(g, 0, 'dragonkin_sorcerer'); play(g, 0, hand(g, 0, 'power_word_shield'), { target: d.id }); eq(g.atk(d), 4); eq(g.hp(d), 8);
  g.endTurn(); play(g, 1, hand(g, 1, 'execute'), { target: (g.damage(null, d, 1), d).id }); eq(g.inPlay(d), false);
});
t('Dragon Consort: nur nächster Dragon -2', () => {
  const g = setup('paladin'); const a = hand(g, 0, 'azure_drake'), b = hand(g, 0, 'twilight_drake'), y = hand(g, 0, 'chillwind_yeti');
  play(g, 0, hand(g, 0, 'dragon_consort')); eq(g.cost(a), 3); eq(g.cost(b), 2); eq(g.cost(y), 4); play(g, 0, a); eq(g.cost(b), 4);
});
t('Rend Blackhand mit Dragon', () => {
  const g = setup(); const l = mk(g, 1, 'baron_rivendare'); mk(g, 1, 'chillwind_yeti'); hand(g, 0, 'azure_drake'); const r = hand(g, 0, 'rend_blackhand');
  eq(g.targetsFor(r).length, 1); play(g, 0, r, { target: l.id }); eq(g.inPlay(l), false);
});
t('Rend Blackhand ohne Dragon kein Ziel', () => { const g = setup(); mk(g, 1, 'baron_rivendare'); eq(g.targetsFor(hand(g, 0, 'rend_blackhand')), null); });
t('Nefarian: 2 Zauber der Gegnerklasse', () => {
  const g = setup('mage', 'warrior'); play(g, 0, hand(g, 0, 'nefarian')); eq(g.P(0).hand.length, 2);
  for (const c of g.hand(0)) { eq(HS.card(c.card).type, 'spell'); eq(HS.card(c.card).cls, 'warrior'); }
});
t('Chromaggus kopiert gezogene Karte', () => { const g = setup(); mk(g, 0, 'chromaggus'); g.draw(0); eq(g.hand(0).length, 2); eq(g.hand(0)[1].card, g.hand(0)[0].card); });
t('Majordomo -> Ragnaros 8 Leben, DIE, INSECT!', () => {
  const g = setup(); g.gainArmor(0, 3); kill(g, mk(g, 0, 'majordomo_executus')); eq(g.hero(0).card, 't_ragnaros_hero'); eq(g.hp(g.hero(0)), 8); eq(g.hero(0).armor, 3);
  eq(g.power(0).card, 'hp_die_insect'); g.usePower(0); eq(g.hero(1).damage, 8);
});
t('Emperor Thaurissan nur am eigenen Zugende', () => {
  const g = setup(); const c = hand(g, 0, 'fireball'); mk(g, 0, 'emperor_thaurissan'); g.endTurn(); eq(g.cost(c), 3); g.endTurn(); eq(g.cost(c), 3);
});
t('Flamewaker: 2 Schaden auf Feinde', () => { const g = setup(); mk(g, 0, 'flamewaker'); play(g, 0, hand(g, 0, 'arcane_intellect')); eq(g.hero(1).damage, 2); eq(g.hero(0).damage, 0); });
t('Dark Iron Skulker nur unverletzte Feinde', () => {
  const g = setup('rogue'); const a = mk(g, 1, 'chillwind_yeti'); const b = mk(g, 1, 'chillwind_yeti'); b.damage = 1; const own = mk(g, 0, 'chillwind_yeti');
  play(g, 0, hand(g, 0, 'dark_iron_skulker')); eq(g.hp(a), 3); eq(g.hp(b), 4); eq(g.hp(own), 5);
});
t('Volcanic Lumberer / Dragon\'s Breath Kosten', () => {
  const g = setup('druid'); const l = hand(g, 0, 'volcanic_lumberer'); const d = hand(g, 0, 'dragons_breath');
  kill(g, mk(g, 1, 'wisp')); kill(g, mk(g, 0, 'wisp')); eq(g.cost(l), 7); eq(g.cost(d), 3); g.endTurn(); eq(g.cost(l), 9);
});
t('Druid of the Flame Choose One, keine Battlecry', () => {
  const g = setup('druid'); const a = hand(g, 0, 'druid_of_the_flame'); play(g, 0, a, { choice: 0 }); eq(g.atk(a), 5); eq(g.hp(a), 2);
  const b = hand(g, 0, 'druid_of_the_flame'); play(g, 0, b, { choice: 1 }); eq(g.atk(b), 2); eq(g.hp(b), 5);
});
t('Resurrect braucht gestorbenen befreundeten Diener', () => {
  const g = setup('priest'); const r = hand(g, 0, 'resurrect'); kill(g, mk(g, 1, 'chillwind_yeti')); eq(g.canPlay(0, r), false);
  kill(g, mk(g, 0, 'war_golem')); play(g, 0, r); eq(ids(g, 0), 'war_golem');
});
t('Lava Shock entsperrt Overload', () => {
  const g = setup('shaman'); g.P(0).overload = 2; g.endTurn(); g.endTurn(); const p = g.P(0); p.maxMana = 10; eq(p.locked, 2); p.mana = 8;
  play(g, 0, hand(g, 0, 'fireguard_destroyer')); eq(p.overload, 1); play(g, 0, hand(g, 0, 'lava_shock'), { target: g.hero(1).id });
  eq(p.mana, 4); eq(p.locked, 0); eq(p.overload, 0); eq(g.hero(1).damage, 2);
});
t('Fireguard Destroyer 4-7 Angriff, Overload 1', () => {
  const g = setup('shaman'); const f = hand(g, 0, 'fireguard_destroyer'); play(g, 0, f); eq(g.atk(f) >= 4 && g.atk(f) <= 7, true); eq(g.P(0).overload, 1);
});
t('Demonwrath', () => { const g = setup('warlock'); const d = mk(g, 0, 'imp_gang_boss'); const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'demonwrath')); eq(g.hp(d), 4); eq(g.hp(y), 3); });
t('Gang Up', () => { const g = setup('rogue'); const y = mk(g, 1, 'chillwind_yeti'); const n = g.P(0).deck.length; play(g, 0, hand(g, 0, 'gang_up'), { target: y.id }); eq(g.deck(0).filter((c) => c.card === 'chillwind_yeti').length, 3); eq(g.P(0).deck.length, n + 3); });
t('Revenge 1 / 3 Schaden', () => { const g = setup('warrior'); const y = mk(g, 1, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'revenge')); eq(g.hp(y), 4); });
t('Blackwing Corruptor / Twilight Whelp / Technician', () => {
  const g = setup('priest'); hand(g, 0, 'azure_drake'); const w = hand(g, 0, 'twilight_whelp'); play(g, 0, w); eq(g.hp(w), 3);
  const c = hand(g, 0, 'blackwing_corruptor'); play(g, 0, c, { target: g.hero(1).id }); eq(g.hero(1).damage, 3);
});
t('Quick Shot mit Karte auf Hand: kein Zug', () => { const g = setup('hunter'); hand(g, 0, 'wisp'); play(g, 0, hand(g, 0, 'quick_shot'), { target: g.hero(1).id }); eq(g.P(0).hand.length, 1); eq(g.hero(1).damage, 3); });

console.log(`${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
