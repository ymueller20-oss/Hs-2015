/* Audit-Tests für Goblins gegen Gnome: node test/audit_gvg.js */
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
const secret = (g, pi, id) => { const e = g.newEnt(id, pi, 'secret'); e.order = g.s.order++; g.P(pi).secrets.push(e.id); return e; };
const deckCount = (g, pi, id) => g.deck(pi).filter((c) => c.card === id).length;

/* Werte */
t('Set vollständig: 123 Karten, 40/37/26/20', () => {
  const c = Object.values(HS.CARDS).filter((x) => x.set === 'gvg' && x.collectible !== false);
  eq(c.length, 123);
  const r = {}; for (const x of c) r[x.rarity || 'common'] = (r[x.rarity || 'common'] || 0) + 1;
  eq(r.common, 40); eq(r.rare, 37); eq(r.epic, 26); eq(r.legendary, 20);
});
t('Namen Mini-Mage / Goblin Auto-Barber / Imp-losion', () => {
  eq(HS.CARDS.mini_mage.name, 'Mini-Mage'); eq(HS.CARDS.goblin_auto_barber.name, 'Goblin Auto-Barber'); eq(HS.CARDS.implosion.name, 'Imp-losion');
});
t('Stichproben Werte/Rasse', () => {
  for (const [id, c, a, h, r] of [['piloted_shredder', 4, 4, 3, 'mech'], ['dr_boom', 7, 7, 7, undefined], ['foe_reaper_4000', 8, 6, 9, 'mech'], ['fel_reaver', 5, 8, 8, 'mech'],
    ['jeeves', 4, 1, 4, 'mech'], ['mal' + 'ganis', 9, 9, 7, 'demon'], ['malorne', 7, 9, 7, 'beast'], ['clockwork_giant', 12, 8, 8, 'mech'], ['mekgineer_thermaplugg', 9, 9, 7, 'mech'],
    ['anima_golem', 6, 9, 9, 'mech'], ['gahzrilla', 7, 6, 9, 'beast'], ['voljin', 5, 6, 2, undefined], ['trade_prince_gallywix', 6, 5, 8, undefined]]) {
    const d = HS.CARDS[id]; eq(d.cost + '/' + d.atk + '/' + d.hp + '/' + d.race, c + '/' + a + '/' + h + '/' + r, id);
  }
});
t('7 Ersatzteile, alle (1)', () => {
  const sp = Object.values(HS.CARDS).filter((c) => c.spare);
  eq(sp.length, 7); eq(sp.every((c) => c.cost === 1 && c.type === 'spell'), true);
});

/* Fixes */
t('Kezan Mystic stiehlt bevorzugt ein Secret, das man noch nicht hat', () => {
  for (let seed = 1; seed < 15; seed++) {
    const g = setup('mage', 'mage', seed);
    secret(g, 0, 'counterspell');
    secret(g, 1, 'counterspell'); const me = secret(g, 1, 'mirror_entity');
    play(g, 0, hand(g, 0, 'kezan_mystic'));
    eq(me.owner, 0, 'seed ' + seed); eq(g.P(0).secrets.length, 2); eq(g.P(1).secrets.length, 1);
  }
});
t('Kezan Mystic: nur Duplikat vorhanden -> zerstört', () => {
  const g = setup('mage', 'mage'); secret(g, 0, 'counterspell'); secret(g, 1, 'counterspell');
  play(g, 0, hand(g, 0, 'kezan_mystic')); eq(g.P(0).secrets.length, 1); eq(g.P(1).secrets.length, 0);
});
t('Gazlowe zählt aktuelle Kosten (Frostbolt mit Sorcerer\'s Apprentice)', () => {
  const g = setup(); mk(g, 0, 'gazlowe'); mk(g, 0, 'sorcerers_apprentice');
  play(g, 0, hand(g, 0, 'frostbolt'), { target: g.hero(1).id });
  eq(g.P(0).hand.length, 1); eq(HS.CARDS[g.hand(0)[0].card].race, 'mech');
});
t('Gazlowe: Ersatzteil (1) löst aus, Fireball nicht', () => {
  const g = setup(); const gz = mk(g, 0, 'gazlowe');
  play(g, 0, hand(g, 0, 't_whirling_blades'), { target: gz.id }); eq(g.P(0).hand.length, 1);
  play(g, 0, hand(g, 0, 'fireball'), { target: g.hero(1).id }); eq(g.P(0).hand.length, 1);
});
t('Malorne wird beim Tod einmal ins Deck gemischt', () => {
  const g = setup('druid'); const n = g.P(0).deck.length; const m = mk(g, 0, 'malorne'); g.destroy(m); g.processDeaths();
  eq(g.P(0).deck.length, n + 1); eq(deckCount(g, 0, 'malorne'), 1);
});
t('Malorne mit Baron Rivendare nur einmal', () => {
  const g = setup('druid'); mk(g, 0, 'baron_rivendare'); const m = mk(g, 0, 'malorne'); g.destroy(m); g.processDeaths();
  eq(deckCount(g, 0, 'malorne'), 1);
});
t('Feign Death auf Malorne bewirkt nichts', () => {
  const g = setup('hunter'); const m = mk(g, 0, 'malorne'); play(g, 0, hand(g, 0, 'feign_death'));
  eq(deckCount(g, 0, 'malorne'), 0); eq(g.inPlay(m), true);
});

/* geprüfte, knifflige Karten */
t('Piloted Shredder ruft 2-Kosten-Diener auf seinem Platz', () => {
  const g = setup(); const a = mk(g, 0, 'wisp'); const s = mk(g, 0, 'piloted_shredder'); const b = mk(g, 0, 'wisp');
  g.destroy(s); g.processDeaths();
  eq(g.board(0).length, 3); const n = g.board(0)[1]; eq(HS.CARDS[n.card].cost, 2); eq(HS.CARDS[n.card].collectible !== false, true); void a; void b;
});
t('Piloted Sky Golem 4 / Sneed legendär', () => {
  const g = setup(); const s = mk(g, 0, 'piloted_sky_golem'); g.destroy(s); g.processDeaths(); eq(HS.CARDS[g.board(0)[0].card].cost, 4);
  const n = mk(g, 1, 'sneeds_old_shredder'); g.destroy(n); g.processDeaths(); eq(HS.CARDS[g.board(1)[0].card].rarity, 'legendary');
});
t('Dr. Boom: Boom Bots links und rechts, Bot trifft Feind 1-4', () => {
  const g = setup(); const c = hand(g, 0, 'dr_boom'); play(g, 0, c);
  eq(g.board(0).map((m) => m.card).join(), 't_boom_bot,dr_boom,t_boom_bot');
  g.destroy(g.board(0)[0]); g.processDeaths(); const d = g.hero(1).damage; eq(d >= 1 && d <= 4, true); eq(g.hero(0).damage, 0);
});
t('Foe Reaper trifft Nachbarn des Verteidigers', () => {
  const g = setup(); const f = mk(g, 0, 'foe_reaper_4000');
  const a = mk(g, 1, 'chillwind_yeti'), b = mk(g, 1, 'chillwind_yeti'), c = mk(g, 1, 'chillwind_yeti'), d = mk(g, 1, 'chillwind_yeti');
  g.attack(f.id, b.id); eq(b.zone, 'grave'); eq(a.zone, 'grave'); eq(c.zone, 'grave'); eq(g.hp(d), 5); eq(g.hp(f), 5);
});
t('Fel Reaver: Gegner spielt Karte -> 3 eigene Deckkarten weg', () => {
  const g = setup(); mk(g, 0, 'fel_reaver'); g.endTurn(); const n = g.P(0).deck.length; g.P(1).mana = 10;
  play(g, 1, hand(g, 1, 'wisp')); eq(g.P(0).deck.length, n - 3);
});
t('Hobgoblin: 1-Angriff-Diener +2/+2, sonst nicht', () => {
  const g = setup(); mk(g, 0, 'hobgoblin'); const w = hand(g, 0, 'wisp'); play(g, 0, w); eq(g.atk(w), 3); eq(g.hp(w), 3);
  const y = hand(g, 0, 'bloodfen_raptor'); play(g, 0, y); eq(g.atk(y), 3); eq(g.hp(y), 2);
  const o = hand(g, 1, 'wisp'); g.endTurn(); g.P(1).mana = 10; play(g, 1, o); eq(g.atk(o), 1);
});
t('Unstable Portal: Diener kostet 3 weniger', () => {
  const g = setup(); play(g, 0, hand(g, 0, 'unstable_portal')); const c = g.hand(0)[0];
  eq(HS.CARDS[c.card].type, 'minion'); eq(g.cost(c), Math.max(0, HS.CARDS[c.card].cost - 3));
});
t('Recombobulator: gleiche Kosten', () => {
  const g = setup(); const y = mk(g, 0, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'recombobulator'), { target: y.id }); eq(HS.CARDS[y.card].cost, 4);
});
t('Iron Juggernaut: Mine explodiert beim Ziehen (10 Schaden + Karte)', () => {
  const g = setup('warrior'); play(g, 0, hand(g, 0, 'iron_juggernaut')); eq(deckCount(g, 1, 't_burrowing_mine'), 1);
  const p = g.P(1); p.deck = p.deck.filter((id) => g.ent(id).card !== 't_burrowing_mine'); g.shuffleIn(1, 't_burrowing_mine'); p.deck.push(p.deck.splice(p.deck.findIndex((id) => g.ent(id).card === 't_burrowing_mine'), 1)[0]);
  g.draw(1); eq(g.hero(1).damage, 10); eq(g.P(1).hand.length, 1); eq(g.hand(1)[0].card, 'wisp');
});
t('Flame Leviathan: beim Ziehen 2 Schaden an alle', () => {
  const g = setup(); const y = mk(g, 1, 'chillwind_yeti'); g.P(0).deck.push(g.newEnt('flame_leviathan', 0, 'deck').id); g.draw(0);
  eq(g.hero(0).damage, 2); eq(g.hero(1).damage, 2); eq(g.hp(y), 3); eq(g.hand(0)[0].card, 'flame_leviathan');
});
t('Mechwarper senkt nur Mechs auf der Hand', () => {
  const g = setup(); mk(g, 0, 'mechwarper'); eq(g.cost(hand(g, 0, 'piloted_shredder')), 3); eq(g.cost(hand(g, 1, 'piloted_shredder')), 4);
});
t('Vol\'jin tauscht Leben', () => {
  const g = setup('priest'); const y = mk(g, 1, 'chillwind_yeti'); const v = hand(g, 0, 'voljin'); play(g, 0, v, { target: y.id }); eq(g.hp(v), 5); eq(g.hp(y), 2);
});
t('Burly Rockjaw / Troggzor bei gegnerischem Zauber', () => {
  const g = setup(); const b = mk(g, 1, 'burly_rockjaw_trogg'); mk(g, 1, 'troggzor_the_earthinator');
  play(g, 0, hand(g, 0, 'arcane_intellect')); eq(g.atk(b), 5); eq(g.board(1).filter((m) => m.card === 'burly_rockjaw_trogg').length, 2);
});
t('Gallywix: Kopie + Gallywix\'s Coin, Coin löst nicht aus', () => {
  const g = setup(); mk(g, 1, 'trade_prince_gallywix'); play(g, 0, hand(g, 0, 'arcane_intellect'));
  eq(g.hand(1).some((c) => c.card === 'arcane_intellect'), true); const coin = g.hand(0).find((c) => c.card === 't_gallywix_coin'); eq(!!coin, true);
  const n = g.P(1).hand.length; play(g, 0, coin); eq(g.P(1).hand.length, n);
});
t('Mal\'Ganis: Held immun, andere Dämonen +2/+2', () => {
  const g = setup('warlock'); const v = mk(g, 0, 'voidwalker'); mk(g, 0, 'malganis'); eq(g.atk(v), 3); eq(g.hp(v), 5);
  g.damage(null, g.hero(0), 5); eq(g.hero(0).damage, 0);
});
t('Anima Golem stirbt allein am Zugende', () => {
  const g = setup('warlock'); mk(g, 0, 'anima_golem'); g.endTurn(); eq(g.board(0).length, 0);
});
t('Mimiron\'s Head formt V-07-TR-0N', () => {
  const g = setup(); mk(g, 0, 'mimirons_head'); mk(g, 0, 'spider_tank'); mk(g, 0, 'annoy_o_tron'); mk(g, 0, 'wisp'); g.endTurn(); g.endTurn();
  eq(g.board(0).map((m) => m.card).sort().join(), 't_v07tr0n,wisp');
});
t('Bouncing Blade hört auf, wenn ein Diener stirbt', () => {
  const g = setup('warrior'); const a = mk(g, 1, 'chillwind_yeti'); const w = mk(g, 1, 'wisp'); play(g, 0, hand(g, 0, 'bouncing_blade'));
  eq(w.zone === 'grave' || a.zone === 'grave', true);
});
t('Imp-losion: Imps = Schaden (inkl. Zauberschaden)', () => {
  const g = setup('warlock'); mk(g, 0, 'kobold_geomancer'); const y = mk(g, 1, 'boulderfist_ogre'); play(g, 0, hand(g, 0, 'implosion'), { target: y.id });
  eq(g.board(0).filter((m) => m.card === 't_imp').length, y.damage); eq(y.damage >= 3 && y.damage <= 5, true);
});
t('Cogmaster +2 nur mit Mech', () => {
  const g = setup(); const c = mk(g, 0, 'cogmaster'); eq(g.atk(c), 1); const s = mk(g, 0, 'spider_tank'); eq(g.atk(c), 3); g.destroy(s); g.processDeaths(); eq(g.atk(c), 1);
});
t('Light of the Naaru ruft Lightwarden nur bei weiter verletztem Ziel', () => {
  const g = setup('priest'); g.hero(0).damage = 5; play(g, 0, hand(g, 0, 'light_of_the_naaru'), { target: g.hero(0).id }); eq(g.board(0).length, 1);
  g.hero(0).damage = 2; play(g, 0, hand(g, 0, 'light_of_the_naaru'), { target: g.hero(0).id }); eq(g.board(0).length, 1);
});
t('Lightbomb: Schaden = eigener Angriff', () => {
  const g = setup('priest'); const a = mk(g, 0, 'chillwind_yeti'); const b = mk(g, 1, 'boulderfist_ogre'); play(g, 0, hand(g, 0, 'lightbomb')); eq(g.hp(a), 1); eq(g.hp(b), 1);
});
t('Echo of Medivh kopiert eigene Diener', () => {
  const g = setup(); mk(g, 0, 'wisp'); mk(g, 0, 'chillwind_yeti'); play(g, 0, hand(g, 0, 'echo_of_medivh')); eq(g.hand(0).map((c) => c.card).join(), 'wisp,chillwind_yeti');
});
t('Jeeves: aktiver Spieler füllt auf 3 auf', () => {
  const g = setup(); mk(g, 0, 'jeeves'); g.endTurn(); eq(g.P(0).hand.length, 3);
});
t('Ogre Brute verfehlt manchmal (50 %)', () => {
  let wrong = 0;
  for (let seed = 1; seed <= 40; seed++) { const g = setup('mage', 'warrior', seed); const o = mk(g, 0, 'ogre_brute'); mk(g, 1, 'wisp'); g.attack(o.id, g.hero(1).id); if (g.hero(1).damage === 0) wrong++; }
  eq(wrong > 5 && wrong < 35, true, 'Fehlangriffe ' + wrong);
});

console.log(`${pass} bestanden, ${fail} fehlgeschlagen`);
if (fail) process.exit(1);
