/* Deckregeln, Startdecks und Zufallsdecks */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : global;
  const HS = root.HS;

  HS.DECK_SIZE = 30;
  HS.maxCopies = (c) => (c.rarity === 'legendary' ? 1 : 2);
  HS.cardsForClass = (cls) => HS.collectible().filter((c) => c.cls === 'neutral' || c.cls === cls);

  HS.validateDeck = function (cls, cards) {
    const err = [];
    if (!HS.CLASSES[cls]) err.push('Unbekannte Klasse.');
    if (cards.length !== HS.DECK_SIZE) err.push(`Ein Deck braucht genau ${HS.DECK_SIZE} Karten (aktuell ${cards.length}).`);
    const cnt = {};
    for (const id of cards) {
      const c = HS.CARDS[id];
      if (!c || !c.collectible) { err.push(`Ungültige Karte: ${id}`); continue; }
      if (c.cls !== 'neutral' && c.cls !== cls) err.push(`${c.name} gehört nicht zu dieser Klasse.`);
      cnt[id] = (cnt[id] || 0) + 1;
      if (cnt[id] === HS.maxCopies(c) + 1) err.push(`Zu viele Kopien: ${c.name}`);
    }
    return err;
  };

  const P = (list) => list.split(/\s+/).filter(Boolean).flatMap((t) => {
    const m = /^(.+)\*(\d)$/.exec(t);
    return m ? Array(+m[2]).fill(m[1]) : [t];
  });

  HS.PRESETS = [
    { cls: 'druid', name: 'Midrange-Druide', cards: P('innervate*2 wild_growth*2 wrath*2 swipe*2 keeper_of_the_grove*2 druid_of_the_claw*2 force_of_nature*2 savage_roar ancient_of_lore*2 ancient_of_war piloted_shredder*2 azure_drake*2 emperor_thaurissan dr_boom sylvanas_windrunner loatheb zombie_chow*2 big_game_hunter mind_control_tech') },
    { cls: 'hunter', name: 'Aggro-Jäger', cards: P('arcane_shot*2 leper_gnome*2 abusive_sergeant*2 explosive_trap freezing_trap*2 quick_shot*2 knife_juggler*2 haunted_creeper*2 mad_scientist*2 ironbeak_owl kill_command*2 unleash_the_hounds*2 eaglehorn_bow*2 animal_companion*2 arcane_golem*2 leeroy_jenkins') },
    { cls: 'mage', name: 'Mech-Magier', cards: P('mechwarper*2 clockwork_gnome*2 cogmaster*2 annoy_o_tron*2 snowchugger*2 frostbolt*2 unstable_portal*2 spider_tank*2 goblin_blastmage*2 piloted_shredder*2 fireball*2 arcane_missiles*2 piloted_sky_golem*2 dr_boom archmage_antonidas flamecannon*2') },
    { cls: 'paladin', name: 'Midrange-Paladin', cards: P('equality*2 consecration*2 truesilver_champion*2 aldor_peacekeeper*2 avenging_wrath tirion_fordring muster_for_battle*2 shielded_minibot*2 piloted_shredder*2 zombie_chow*2 knife_juggler big_game_hunter sludge_belcher*2 dr_boom loatheb sylvanas_windrunner quartermaster ragnaros_the_firelord solemn_vigil*2 ironbeak_owl') },
    { cls: 'priest', name: 'Kontroll-Priester', cards: P('northshire_cleric*2 power_word_shield*2 velens_chosen*2 shadow_word_pain*2 shadow_word_death*2 holy_nova*2 auchenai_soulpriest circle_of_healing deathlord*2 injured_blademaster*2 cabal_shadow_priest lightbomb dark_cultist*2 sylvanas_windrunner voljin ragnaros_the_firelord zombie_chow*2 thoughtsteal wild_pyromancer loatheb') },
    { cls: 'rogue', name: 'Öl-Schurke', cards: P('backstab*2 preparation*2 deadly_poison*2 blade_flurry*2 eviscerate*2 sap fan_of_knives*2 si7_agent*2 tinkers_sharpsword_oil*2 gadgetzan_auctioneer*2 violet_teacher*2 azure_drake*2 loot_hoarder*2 bloodmage_thalnos edwin_vancleef defias_ringleader*2 leeroy_jenkins') },
    { cls: 'shaman', name: 'Midrange-Schamane', cards: P('earth_shock lightning_bolt*2 flametongue_totem*2 feral_spirit*2 hex*2 lightning_storm*2 mana_tide_totem fire_elemental*2 alakir_the_windlord piloted_shredder*2 azure_drake*2 dr_boom sylvanas_windrunner big_game_hunter loatheb zombie_chow*2 unbound_elemental*2 lava_shock haunted_creeper*2') },
    { cls: 'warlock', name: 'Handlock', cards: P('mortal_coil*2 ancient_watcher*2 sunfury_protector*2 defender_of_argus*2 twilight_drake*2 molten_giant*2 mountain_giant*2 hellfire*2 shadowflame siphon_soul lord_jaraxxus big_game_hunter ironbeak_owl*2 earthen_ring_farseer*2 antique_healbot emperor_thaurissan dr_boom sylvanas_windrunner darkbomb*2') },
    { cls: 'warrior', name: 'Patron-Krieger', cards: P('inner_rage*2 execute*2 whirlwind*2 slam*2 battle_rage*2 cruel_taskmaster*2 armorsmith*2 fiery_war_axe*2 frothing_berserker*2 warsong_commander*2 acolyte_of_pain*2 grim_patron*2 deaths_bite*2 emperor_thaurissan unstable_ghoul*2 loot_hoarder') },
  ];

  /* Zufallsdeck mit einfacher Manakurve. rnd() liefert [0,1). */
  HS.randomDeck = function (cls, rnd) {
    rnd = rnd || Math.random;
    const pool = HS.cardsForClass(cls);
    const out = [];
    const cnt = {};
    const add = (c) => {
      if ((cnt[c.id] || 0) >= HS.maxCopies(c)) return false;
      cnt[c.id] = (cnt[c.id] || 0) + 1;
      out.push(c.id);
      return true;
    };
    const cls_ = pool.filter((c) => c.cls === cls);
    let guard = 0;
    while (out.length < 14 && guard++ < 500) add(cls_[Math.floor(rnd() * cls_.length)]);
    guard = 0;
    while (out.length < HS.DECK_SIZE && guard++ < 5000) {
      const c = pool[Math.floor(rnd() * pool.length)];
      const cost = c.cost;
      if (cost > 7 && rnd() < 0.7) continue;
      if (cost > 5 && rnd() < 0.3) continue;
      add(c);
    }
    return out;
  };

  /* Füllt ein unvollständiges Deck regelkonform auf (für Presets/Notfälle). */
  HS.fixDeck = function (cls, cards) {
    const out = [];
    const cnt = {};
    for (const id of cards) {
      const c = HS.CARDS[id];
      if (!c || !c.collectible || (c.cls !== 'neutral' && c.cls !== cls)) continue;
      if ((cnt[id] || 0) >= HS.maxCopies(c) || out.length >= HS.DECK_SIZE) continue;
      cnt[id] = (cnt[id] || 0) + 1;
      out.push(id);
    }
    if (out.length < HS.DECK_SIZE) {
      for (const id of HS.randomDeck(cls)) {
        if (out.length >= HS.DECK_SIZE) break;
        const c = HS.CARDS[id];
        if ((cnt[id] || 0) >= HS.maxCopies(c)) continue;
        cnt[id] = (cnt[id] || 0) + 1;
        out.push(id);
      }
    }
    return out;
  };
})();
