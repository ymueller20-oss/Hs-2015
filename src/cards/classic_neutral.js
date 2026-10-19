/* Klassik-Set: neutrale Karten */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : global;
  const HS = root.HS;
  const { M, T, TS } = HS.lib;
  HS.setSet('classic');
  const L = 'legendary';
  const isMurloc = (g, m) => g.isMinion(m) && g.isRace(m, 'murloc');
  const otherFriendly = (s, t, g) => t !== s && t.owner === s.owner && g.isMinion(t);

  M('wisp', 'Irrwisch', 0, 1, 1);
  M('abusive_sergeant', 'Ruppiger Feldwebel', 1, 2, 1, { text: '<b>Kampfschrei:</b> Verleiht einem Diener +2 Angriff in diesem Zug.',
    target: 'minion', play: (g, s, t) => { if (t) g.buff(t, { atk: 2, expire: g.eot() }); } });
  M('angry_chicken', 'Wütendes Huhn', 1, 1, 1, { race: 'beast', rarity: 'rare', enrage: { atk: 5 }, text: '<b>Wutanfall:</b> +5 Angriff.' });
  M('argent_squire', 'Argentumknappin', 1, 1, 1, { kw: ['divineShield'], text: '<b>Gottesschild</b>' });
  M('bloodsail_corsair', 'Korsar der Blutsegel', 1, 1, 2, { race: 'pirate', rarity: 'rare', text: '<b>Kampfschrei:</b> Entfernt 1 Haltbarkeit von der Waffe Eures Gegners.',
    play: (g, s) => { const w = g.weapon(1 - s.owner); if (w) w.damage++; } });
  M('hungry_crab', 'Hungrige Krabbe', 1, 1, 2, { race: 'beast', rarity: 'epic', text: '<b>Kampfschrei:</b> Vernichtet einen Murloc und erhält +2/+2.',
    target: { t: 'minion', f: (g, s, t) => g.isRace(t, 'murloc') }, play: (g, s, t) => { if (t) { g.destroy(t); g.buff(s, { atk: 2, hp: 2 }); } } });
  M('leper_gnome', 'Lepragnom', 1, 2, 1, { text: '<b>Todesröcheln:</b> Verursacht 2 Schaden beim feindlichen Helden.',
    deathrattle: (g, s) => g.damage(s, g.hero(1 - s.owner), 2) });
  M('lightwarden', 'Lichtwächterin', 1, 1, 2, { rarity: 'rare', text: 'Immer wenn ein Charakter geheilt wird, erhält dieser Diener +2 Angriff.',
    triggers: { heal: (g, s) => g.buff(s, { atk: 2 }) } });
  M('murloc_tidecaller', 'Murlocflutrufer', 1, 1, 2, { race: 'murloc', rarity: 'rare', text: 'Immer wenn ein Murloc herbeigerufen wird, erhält dieser Diener +1 Angriff.',
    triggers: { summon: (g, s, ev) => { if (ev.minion !== s && g.isRace(ev.minion, 'murloc')) g.buff(s, { atk: 1 }); } } });
  M('secretkeeper', 'Geheimnishüterin', 1, 1, 2, { rarity: 'rare', text: 'Immer wenn ein <b>Geheimnis</b> ausgespielt wird, erhält dieser Diener +1/+1.',
    triggers: { secretPlayed: (g, s) => g.buff(s, { atk: 1, hp: 1 }) } });
  M('shieldbearer', 'Schildträger', 1, 0, 4, { kw: ['taunt'], text: '<b>Spott</b>' });
  M('southsea_deckhand', 'Deckputzer der Südmeerpiraten', 1, 2, 1, { race: 'pirate', text: 'Hat <b>Ansturm</b>, solange Ihr eine Waffe angelegt habt.',
    selfKw: (g, s) => (g.weapon(s.owner) ? ['charge'] : []) });
  M('worgen_infiltrator', 'Worgeninfiltrant', 1, 2, 1, { kw: ['stealth'], text: '<b>Verstohlenheit</b>' });
  M('young_dragonhawk', 'Junger Drachenfalke', 1, 1, 1, { race: 'beast', kw: ['windfury'], text: '<b>Windzorn</b>' });
  M('young_priestess', 'Junge Priesterin', 1, 2, 1, { rarity: 'rare', text: 'Verleiht am Ende Eures Zuges einem anderen zufälligen befreundeten Diener +1 Leben.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) { const t = g.pick(g.others(s)); if (t) g.buff(t, { hp: 1 }); } } } });

  M('amani_berserker', 'Berserker der Amani', 2, 2, 3, { enrage: { atk: 3 }, text: '<b>Wutanfall:</b> +3 Angriff.' });
  M('ancient_watcher', 'Uralter Wächter', 2, 4, 5, { rarity: 'rare', kw: ['cantAttack'], text: 'Kann nicht angreifen.' });
  M('bloodmage_thalnos', 'Blutmagier Thalnos', 2, 1, 1, { rarity: L, spellDamage: 1, text: '<b>Zauberschaden +1</b>. <b>Todesröcheln:</b> Zieht eine Karte.',
    deathrattle: (g, s) => g.draw(s.owner) });
  M('bloodsail_raider', 'Plünderer der Blutsegel', 2, 2, 3, { race: 'pirate', text: '<b>Kampfschrei:</b> Erhält Angriff in Höhe des Angriffs Eurer Waffe.',
    play: (g, s) => { const w = g.weapon(s.owner); if (w) g.buff(s, { atk: g.atk(w) }); } });
  M('crazed_alchemist', 'Wahnsinniger Alchemist', 2, 2, 2, { rarity: 'rare', text: '<b>Kampfschrei:</b> Vertauscht Angriff und Leben eines Dieners.',
    target: 'minion', play: (g, s, t) => { if (t) { const a = g.atk(t), h = g.hp(t); g.buff(t, { setAtk: h, setHp: a }); } } });
  M('dire_wolf_alpha', 'Leitwolf', 2, 2, 2, { race: 'beast', positional: true, text: 'Benachbarte Diener haben +1 Angriff.',
    aura: (g, s, t) => (g.isMinion(t) && t.owner === s.owner && g.adj(s).includes(t) ? { atk: 1 } : null) });
  M('doomsayer', 'Weltenuntergangsprophet', 2, 0, 7, { rarity: 'epic', text: 'Vernichtet zu Beginn Eures Zuges ALLE Diener.',
    triggers: { turnStart: (g, s, ev) => { if (ev.player === s.owner) for (const m of g.board()) g.destroy(m); } } });
  M('faerie_dragon', 'Feendrache', 2, 3, 2, { race: 'dragon', kw: ['elusive'], text: 'Kann nicht als Ziel von Zaubern oder Heldenfähigkeiten gewählt werden.' });
  M('knife_juggler', 'Messerjongleur', 2, 3, 2, { rarity: 'rare', text: 'Nachdem Ihr einen Diener herbeigerufen habt, wird 1 Schaden bei einem zufälligen Feind verursacht.',
    triggers: { afterSummon: (g, s, ev) => { if (ev.minion !== s && ev.minion.owner === s.owner) { const t = g.pick(g.chars(1 - s.owner).filter((c) => g.hp(c) > 0 && !c.dead)); if (t) g.damage(s, t, 1); } } } });
  M('loot_hoarder', 'Beutehamsterer', 2, 2, 1, { text: '<b>Todesröcheln:</b> Zieht eine Karte.', deathrattle: (g, s) => g.draw(s.owner) });
  M('lorewalker_cho', 'Lehrensucher Cho', 2, 0, 4, { rarity: L, text: 'Immer wenn ein Spieler einen Zauber wirkt, erhält der andere Spieler eine Kopie davon auf die Hand.',
    triggers: { castSpell: (g, s, ev) => g.addCard(1 - ev.player, ev.card.card) } });
  M('mad_bomber', 'Verrückter Bomber', 2, 3, 2, { text: '<b>Kampfschrei:</b> Verursacht 3 Schaden, zufällig auf alle anderen Charaktere verteilt.',
    play: (g, s) => g.splitDamage(s, 3, () => g.chars().filter((c) => c !== s)) });
  M('mana_addict', 'Manasüchtige', 2, 1, 3, { rarity: 'rare', text: 'Immer wenn Ihr einen Zauber wirkt, erhält dieser Diener +2 Angriff in diesem Zug.',
    triggers: { castSpell: (g, s, ev) => { if (ev.player === s.owner) g.buff(s, { atk: 2, expire: g.eot() }); } } });
  M('mana_wraith', 'Managespenst', 2, 2, 2, { rarity: 'rare', text: 'ALLE Diener kosten (1) mehr.',
    costAura: (g, s, c) => (c.zone === 'hand' && g.def(c).type === 'minion' ? 1 : 0) });
  M('master_swordsmith', 'Schwertschmiedemeister', 2, 1, 3, { rarity: 'rare', text: 'Verleiht am Ende Eures Zuges einem anderen zufälligen befreundeten Diener +1 Angriff.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) { const t = g.pick(g.others(s)); if (t) g.buff(t, { atk: 1 }); } } } });
  HS.lib.E('e_millhouse', { type: 'effect', costMod: (g, ef, c) => (c.owner === ef.owner && c.zone === 'hand' && g.def(c).type === 'spell' ? { set: 0 } : null) });
  M('millhouse_manastorm', 'Millhaus Manasturm', 2, 4, 4, { rarity: L, text: '<b>Kampfschrei:</b> Die Zauber des Gegners kosten im nächsten Zug (0).',
    play: (g, s) => g.addEffect(1 - s.owner, 'e_millhouse', { expire: 'end:' + (1 - s.owner) }) });
  M('nat_pagle', 'Nat Pagle', 2, 0, 4, { rarity: L, text: 'Zu Beginn Eures Zuges zieht Ihr mit einer Wahrscheinlichkeit von 50 % eine zusätzliche Karte.',
    triggers: { turnStart: (g, s, ev) => { if (ev.player === s.owner && g.chance(0.5)) g.draw(s.owner); } } });
  M('pint_sized_summoner', 'Winziger Beschwörer', 2, 2, 2, { rarity: 'rare', text: 'Der erste Diener, den Ihr in jedem Zug ausspielt, kostet (1) weniger.',
    costAura: (g, s, c) => (c.owner === s.owner && c.zone === 'hand' && g.def(c).type === 'minion' && g.P(s.owner).minionsPlayed === 0 && g.cur === s.owner ? -1 : 0) });
  M('sunfury_protector', 'Beschützer der Sonnenzorn', 2, 2, 3, { rarity: 'rare', positional: true, text: '<b>Kampfschrei:</b> Verleiht benachbarten Dienern <b>Spott</b>.',
    play: (g, s) => { for (const m of g.adj(s)) g.giveKw(m, 'taunt'); } });
  M('wild_pyromancer', 'Wilder Pyromant', 2, 3, 2, { rarity: 'rare', text: 'Nachdem Ihr einen Zauber gewirkt habt, wird 1 Schaden bei ALLEN Dienern verursacht.',
    triggers: { afterSpell: (g, s, ev) => { if (ev.player === s.owner) g.aoe(s, g.board(), 1); } } });
  M('youthful_brewmaster', 'Junger Braumeister', 2, 3, 2, { text: '<b>Kampfschrei:</b> Lasst einen befreundeten Diener auf Eure Hand zurückkehren.',
    target: 'friendlyMinion', play: (g, s, t) => { if (t) g.bounce(t); } });
  M('captains_parrot', 'Papagei des Kapitäns', 2, 1, 1, { race: 'beast', rarity: 'epic', text: '<b>Kampfschrei:</b> Legt einen zufälligen Piraten aus Eurem Deck auf Eure Hand.',
    play: (g, s) => { const c = g.pick(g.deck(s.owner).filter((x) => g.def(x).race === 'pirate')); if (c && g.P(s.owner).hand.length < 10) { g.removeFromDeck(c); c.zone = 'hand'; g.P(s.owner).hand.push(c.id); } } });
  M('ironbeak_owl', 'Eisenschnabeleule', 2, 2, 1, { race: 'beast', text: '<b>Kampfschrei:</b> Bringt einen Diener zum <b>Schweigen</b>.',
    target: 'minion', play: (g, s, t) => { if (t) g.silence(t); } });

  M('acolyte_of_pain', 'Akolyth des Schmerzes', 3, 1, 3, { text: 'Immer wenn dieser Diener Schaden erleidet, zieht Ihr eine Karte.',
    triggers: { damage: (g, s, ev) => { if (ev.target === s) g.draw(s.owner); } } });
  M('alarm_o_bot', 'Alarm-o-Bot', 3, 0, 3, { race: 'mech', rarity: 'rare', text: 'Tauscht diesen Diener zu Beginn Eures Zuges gegen einen zufälligen Diener auf Eurer Hand.',
    triggers: { turnStart: (g, s, ev) => {
      if (ev.player !== s.owner) return;
      const c = g.pick(g.hand(s.owner).filter((x) => g.def(x).type === 'minion'));
      if (!c) return;
      const pos = g.pos(s);
      g.removeFromBoard(s); s.zone = 'grave';
      g.removeFromHand(c);
      g.addCard(s.owner, 'alarm_o_bot');
      g.place(c, pos, true);
    } } });
  M('arcane_golem', 'Arkangolem', 3, 4, 2, { rarity: 'rare', kw: ['charge'], text: '<b>Ansturm</b>. <b>Kampfschrei:</b> Gebt Eurem Gegner einen Manakristall.',
    play: (g, s) => { const p = g.P(1 - s.owner); p.maxMana = Math.min(10, p.maxMana + 1); } });
  M('blood_knight', 'Blutritter', 3, 3, 3, { rarity: 'epic', text: '<b>Kampfschrei:</b> Alle Diener verlieren <b>Gottesschild</b>. Erhält +3/+3 für jeden verlorenen Schild.',
    play: (g, s) => { let n = 0; for (const m of g.board()) if (m.kw.divineShield) { m.kw.divineShield = false; n++; } if (n) g.buff(s, { atk: 3 * n, hp: 3 * n }); } });
  M('coldlight_oracle', 'Orakel der Kaltlichter', 3, 2, 2, { race: 'murloc', rarity: 'rare', text: '<b>Kampfschrei:</b> Jeder Spieler zieht 2 Karten.',
    play: (g, s) => { g.draw(s.owner, 2); g.draw(1 - s.owner, 2); } });
  M('coldlight_seer', 'Seher der Kaltlichter', 3, 2, 3, { race: 'murloc', rarity: 'rare', text: '<b>Kampfschrei:</b> Verleiht ALLEN anderen Murlocs +2 Leben.',
    play: (g, s) => { for (const m of g.board()) if (m !== s && g.isRace(m, 'murloc')) g.buff(m, { hp: 2 }); } });
  M('demolisher', 'Demolierer', 3, 1, 4, { race: 'mech', rarity: 'rare', text: 'Verursacht zu Beginn Eures Zuges 2 Schaden bei einem zufälligen Feind.',
    triggers: { turnStart: (g, s, ev) => { if (ev.player === s.owner) { const t = g.pick(g.chars(1 - s.owner)); if (t) g.damage(s, t, 2); } } } });
  M('earthen_ring_farseer', 'Weissager des Irdenen Rings', 3, 3, 3, { text: '<b>Kampfschrei:</b> Stellt 3 Leben wieder her.',
    target: 'char', play: (g, s, t) => { if (t) g.heal(s, t, 3); } });
  M('emperor_cobra', 'Kaiserkobra', 3, 2, 3, { race: 'beast', rarity: 'rare', kw: ['poison'], text: 'Vernichtet jeden Diener, dem dieser Diener Schaden zufügt.' });
  M('flesheating_ghoul', 'Fleischfressender Ghul', 3, 2, 3, { text: 'Immer wenn ein Diener stirbt, erhält dieser Diener +1 Angriff.',
    triggers: { death: (g, s) => g.buff(s, { atk: 1 }) } });
  M('harvest_golem', 'Erntegolem', 3, 2, 3, { race: 'mech', text: '<b>Todesröcheln:</b> Ruft einen Beschädigten Golem (2/1) herbei.',
    deathrattle: (g, s, info) => g.summon(s.owner, 't_damaged_golem', info.pos) });
  M('imp_master', 'Wichtelmeister', 3, 1, 5, { rarity: 'rare', text: 'Verursacht am Ende Eures Zuges 1 Schaden bei diesem Diener und ruft einen Wichtel (1/1) herbei.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) { g.damage(s, s, 1); g.summonNext(s, 't_imp'); } } } });
  M('injured_blademaster', 'Verletzter Klingenmeister', 3, 4, 7, { rarity: 'rare', text: '<b>Kampfschrei:</b> Verursacht 4 Schaden bei DIESEM Diener.',
    play: (g, s) => g.damage(s, s, 4) });
  M('jungle_panther', 'Dschungelpanther', 3, 4, 2, { race: 'beast', kw: ['stealth'], text: '<b>Verstohlenheit</b>' });
  M('king_mukla', 'König Mukla', 3, 5, 5, { race: 'beast', rarity: L, text: '<b>Kampfschrei:</b> Gebt Eurem Gegner 2 Bananen.',
    play: (g, s) => { g.addCard(1 - s.owner, 't_bananas'); g.addCard(1 - s.owner, 't_bananas'); } });
  M('mind_control_tech', 'Gedankenkontrolltechniker', 3, 3, 3, { rarity: 'rare', text: '<b>Kampfschrei:</b> Hat Euer Gegner 4 oder mehr Diener, übernehmt die Kontrolle über einen davon (zufällig).',
    play: (g, s) => { if (g.board(1 - s.owner).length >= 4) g.control(g.pick(g.board(1 - s.owner)), s.owner); } });
  M('murloc_warleader', 'Murlockriegsherr', 3, 3, 3, { race: 'murloc', rarity: 'epic', text: 'ALLE anderen Murlocs haben +2/+1.',
    aura: (g, s, t) => (t !== s && isMurloc(g, t) ? { atk: 2, hp: 1 } : null) });
  M('questing_adventurer', 'Abenteuerlustiger Recke', 3, 2, 2, { rarity: 'rare', text: 'Immer wenn Ihr eine Karte ausspielt, erhält dieser Diener +1/+1.',
    triggers: { cardPlayed: (g, s, ev) => { if (ev.player === s.owner && ev.card !== s) g.buff(s, { atk: 1, hp: 1 }); } } });
  M('raging_worgen', 'Tobender Worgen', 3, 3, 3, { enrage: { atk: 1, kw: ['windfury'] }, text: '<b>Wutanfall:</b> <b>Windzorn</b> und +1 Angriff.' });
  M('scarlet_crusader', 'Scharlachroter Kreuzfahrer', 3, 3, 1, { kw: ['divineShield'], text: '<b>Gottesschild</b>' });
  M('southsea_captain', 'Kapitän der Südmeerpiraten', 3, 3, 3, { race: 'pirate', rarity: 'epic', text: 'Eure anderen Piraten haben +1/+1.',
    aura: (g, s, t) => (otherFriendly(s, t, g) && g.isRace(t, 'pirate') ? { atk: 1, hp: 1 } : null) });
  M('tauren_warrior', 'Taurenkrieger', 3, 2, 3, { kw: ['taunt'], enrage: { atk: 3 }, text: '<b>Spott</b>. <b>Wutanfall:</b> +3 Angriff.' });
  M('thrallmar_farseer', 'Weitseher von Thrallmar', 3, 2, 3, { kw: ['windfury'], text: '<b>Windzorn</b>' });
  M('big_game_hunter', 'Großwildjäger', 3, 4, 2, { rarity: 'epic', text: '<b>Kampfschrei:</b> Vernichtet einen Diener mit 7 oder mehr Angriff.',
    target: { t: 'minion', f: (g, s, t) => g.atk(t) >= 7 }, play: (g, s, t) => { if (t) g.destroy(t); } });
  M('tinkmaster_overspark', 'Tüftlermeister Oberfunks', 3, 3, 3, { rarity: L, text: '<b>Kampfschrei:</b> Verwandelt einen anderen zufälligen Diener in einen Teufelssaurier (5/5) oder ein Eichhörnchen (1/1).',
    play: (g, s) => { const t = g.pick(g.board().filter((m) => m !== s)); if (t) g.transform(t, g.chance(0.5) ? 't_devilsaur' : 't_squirrel'); } });

  M('ancient_brewmaster', 'Uralter Braumeister', 4, 5, 4, { text: '<b>Kampfschrei:</b> Lasst einen befreundeten Diener vom Schlachtfeld auf Eure Hand zurückkehren.',
    target: 'friendlyMinion', play: (g, s, t) => { if (t) g.bounce(t); } });
  M('ancient_mage', 'Uralter Magier', 4, 2, 5, { rarity: 'rare', positional: true, text: '<b>Kampfschrei:</b> Verleiht benachbarten Dienern <b>Zauberschaden +1</b>.',
    play: (g, s) => { for (const m of g.adj(s)) g.buff(m, { sd: 1 }); } });
  M('cult_master', 'Kultmeister', 4, 4, 2, { text: 'Immer wenn einer Eurer anderen Diener stirbt, zieht Ihr eine Karte.',
    triggers: { death: (g, s, ev) => { if (ev.owner === s.owner && ev.minion !== s) g.draw(s.owner); } } });
  M('dark_iron_dwarf', 'Dunkeleisenzwerg', 4, 4, 4, { text: '<b>Kampfschrei:</b> Verleiht einem Diener +2 Angriff in diesem Zug.',
    target: 'minion', play: (g, s, t) => { if (t) g.buff(t, { atk: 2, expire: g.eot() }); } });
  M('defender_of_argus', 'Verteidiger von Argus', 4, 2, 3, { rarity: 'rare', positional: true, text: '<b>Kampfschrei:</b> Verleiht benachbarten Dienern +1/+1 und <b>Spott</b>.',
    play: (g, s) => { for (const m of g.adj(s)) { g.buff(m, { atk: 1, hp: 1 }); g.giveKw(m, 'taunt'); } } });
  M('dread_corsair', 'Schreckenskorsar', 4, 3, 3, { race: 'pirate', kw: ['taunt'], text: '<b>Spott</b>. Kostet (1) weniger pro Angriffspunkt Eurer Waffe.',
    selfCost: (g, s) => { const w = g.weapon(s.owner); return w ? -g.atk(w) : 0; } });
  M('leeroy_jenkins', 'Leeroy Jenkins', 4, 6, 2, { rarity: L, kw: ['charge'], text: '<b>Ansturm</b>. <b>Kampfschrei:</b> Ruft zwei Welpen (1/1) für Euren Gegner herbei.',
    play: (g, s) => { g.summon(1 - s.owner, 't_whelp'); g.summon(1 - s.owner, 't_whelp'); } });
  M('mogushan_warden', 'Wächter von Mogu\'shan', 4, 1, 7, { kw: ['taunt'], text: '<b>Spott</b>' });
  M('old_murk_eye', 'Der alte Trübauge', 4, 2, 4, { race: 'murloc', rarity: L, kw: ['charge'], text: '<b>Ansturm</b>. Hat +1 Angriff für jeden anderen Murloc auf dem Schlachtfeld.',
    selfAtk: (g, s) => (g.inPlay(s) ? g.board().filter((m) => m !== s && g.isRace(m, 'murloc')).length : 0) });
  M('silvermoon_guardian', 'Wächter von Silbermond', 4, 3, 3, { kw: ['divineShield'], text: '<b>Gottesschild</b>' });
  M('spellbreaker', 'Zauberbrecher', 4, 4, 3, { text: '<b>Kampfschrei:</b> Bringt einen Diener zum <b>Schweigen</b>.',
    target: 'minion', play: (g, s, t) => { if (t) g.silence(t); } });
  M('twilight_drake', 'Zwielichtdrache', 4, 4, 1, { race: 'dragon', rarity: 'rare', text: '<b>Kampfschrei:</b> Erhält +1 Leben für jede Karte auf Eurer Hand.',
    play: (g, s) => { const n = g.P(s.owner).hand.length; if (n) g.buff(s, { hp: n }); } });
  M('violet_teacher', 'Violette Lehrerin', 4, 3, 5, { rarity: 'rare', text: 'Immer wenn Ihr einen Zauber wirkt, ruft einen Violetten Lehrling (1/1) herbei.',
    triggers: { castSpell: (g, s, ev) => { if (ev.player === s.owner) g.summonNext(s, 't_violet_apprentice'); } } });

  M('abomination', 'Monstrosität', 5, 4, 4, { rarity: 'rare', kw: ['taunt'], text: '<b>Spott</b>. <b>Todesröcheln:</b> Verursacht 2 Schaden bei ALLEN Charakteren.',
    deathrattle: (g, s) => g.aoe(s, g.chars(), 2) });
  M('azure_drake', 'Azurblauer Drache', 5, 4, 4, { race: 'dragon', rarity: 'rare', spellDamage: 1, text: '<b>Zauberschaden +1</b>. <b>Kampfschrei:</b> Zieht eine Karte.',
    play: (g, s) => g.draw(s.owner) });
  M('captain_greenskin', 'Kapitän Grünhaut', 5, 5, 4, { race: 'pirate', rarity: L, text: '<b>Kampfschrei:</b> Verleiht Eurer Waffe +1/+1.',
    play: (g, s) => { const w = g.weapon(s.owner); if (w) g.buff(w, { atk: 1, hp: 1 }); } });
  M('faceless_manipulator', 'Gesichtsloser Manipulator', 5, 3, 3, { rarity: 'epic', text: '<b>Kampfschrei:</b> Wählt einen Diener. Dieser Diener wird zu einer Kopie davon.',
    target: 'minion', play: (g, s, t) => {
      if (!t) return;
      s.card = t.card; s.damage = t.damage; s.ench = structuredClone(t.ench); s.kw = Object.assign({}, t.kw); s.silenced = t.silenced; s.lastMax = g.maxHp(s);
    } });
  M('fen_creeper', 'Moorkriecher', 5, 3, 6, { kw: ['taunt'], text: '<b>Spott</b>' });
  M('harrison_jones', 'Harrison Jones', 5, 5, 4, { rarity: L, text: '<b>Kampfschrei:</b> Zerstört die Waffe Eures Gegners und zieht Karten in Höhe ihrer Haltbarkeit.',
    play: (g, s) => { const w = g.weapon(1 - s.owner); if (w) { const n = g.hp(w); g.destroy(w); g.processDeaths(); g.draw(s.owner, n); } } });
  M('silver_hand_knight', 'Ritter der Silbernen Hand', 5, 4, 4, { text: '<b>Kampfschrei:</b> Ruft einen Knappen (2/2) herbei.',
    play: (g, s) => g.summonNext(s, 't_squire') });
  M('spiteful_smith', 'Gehässiger Schmied', 5, 4, 6, { text: '<b>Wutanfall:</b> Eure Waffe hat +2 Angriff.',
    aura: (g, s, t) => (t.zone === 'weapon' && t.owner === s.owner && s.damage > 0 ? { atk: 2 } : null) });
  M('stampeding_kodo', 'Stampfender Kodo', 5, 3, 5, { race: 'beast', rarity: 'rare', text: '<b>Kampfschrei:</b> Vernichtet einen zufälligen feindlichen Diener mit 2 oder weniger Angriff.',
    play: (g, s) => { const t = g.pick(g.board(1 - s.owner).filter((m) => g.atk(m) <= 2)); if (t) g.destroy(t); } });
  M('stranglethorn_tiger', 'Schlingendorntiger', 5, 5, 5, { race: 'beast', kw: ['stealth'], text: '<b>Verstohlenheit</b>' });
  M('venture_co_mercenary', 'Söldner der Venture Co.', 5, 7, 6, { text: 'Eure Diener kosten (3) mehr.',
    costAura: (g, s, c) => (c.owner === s.owner && c.zone === 'hand' && g.def(c).type === 'minion' ? 3 : 0) });

  M('argent_commander', 'Argentumkommandant', 6, 4, 2, { rarity: 'rare', kw: ['charge', 'divineShield'], text: '<b>Ansturm</b>, <b>Gottesschild</b>' });
  M('cairne_bloodhoof', 'Cairne Bluthuf', 6, 4, 5, { rarity: L, text: '<b>Todesröcheln:</b> Ruft Baine Bluthuf (4/5) herbei.',
    deathrattle: (g, s, info) => g.summon(s.owner, 't_baine_bloodhoof', info.pos) });
  M('frost_elemental', 'Frostelementar', 6, 5, 5, { text: '<b>Kampfschrei:</b> <b>Friert</b> einen Charakter <b>ein</b>.',
    target: 'char', play: (g, s, t) => { if (t) g.freeze(t); } });
  M('gadgetzan_auctioneer', 'Auktionator von Gadgetzan', 6, 4, 4, { rarity: 'rare', text: 'Immer wenn Ihr einen Zauber wirkt, zieht Ihr eine Karte.',
    triggers: { castSpell: (g, s, ev) => { if (ev.player === s.owner) g.draw(s.owner); } } });
  M('hogger', 'Hogger', 6, 4, 4, { rarity: L, text: 'Ruft am Ende Eures Zuges einen Gnoll (2/2) mit <b>Spott</b> herbei.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) g.summonNext(s, 't_gnoll'); } } });
  M('illidan_stormrage', 'Illidan Sturmgrimm', 6, 7, 5, { race: 'demon', rarity: L, text: 'Immer wenn Ihr eine Karte ausspielt, ruft eine Flamme von Azzinoth (2/1) herbei.',
    triggers: { cardPlayed: (g, s, ev) => { if (ev.player === s.owner) g.summonNext(s, 't_flame_of_azzinoth'); } } });
  M('priestess_of_elune', 'Priesterin der Elune', 6, 5, 4, { text: '<b>Kampfschrei:</b> Stellt bei Eurem Helden 4 Leben wieder her.',
    play: (g, s) => g.heal(s, g.hero(s.owner), 4) });
  M('sunwalker', 'Sonnenwandler', 6, 4, 5, { rarity: 'rare', kw: ['taunt', 'divineShield'], text: '<b>Spott</b>, <b>Gottesschild</b>' });
  M('sylvanas_windrunner', 'Sylvanas Windläufer', 6, 5, 5, { rarity: L, text: '<b>Todesröcheln:</b> Übernehmt die Kontrolle über einen zufälligen feindlichen Diener.',
    deathrattle: (g, s) => { const t = g.pick(g.board(1 - s.owner)); if (t) g.control(t, s.owner); } });
  M('the_beast', 'Die Bestie', 6, 9, 7, { race: 'beast', rarity: L, text: '<b>Todesröcheln:</b> Ruft Finkle Einhorn (3/3) für Euren Gegner herbei.',
    deathrattle: (g, s) => g.summon(1 - s.owner, 't_finkle_einhorn') });
  M('the_black_knight', 'Der Schwarze Ritter', 6, 4, 5, { rarity: L, text: '<b>Kampfschrei:</b> Vernichtet einen feindlichen Diener mit <b>Spott</b>.',
    target: { t: 'enemyMinion', f: (g, s, t) => g.has(t, 'taunt') }, play: (g, s, t) => { if (t) g.destroy(t); } });
  M('windfury_harpy', 'Windzornharpyie', 6, 4, 5, { kw: ['windfury'], text: '<b>Windzorn</b>' });

  M('baron_geddon', 'Baron Geddon', 7, 7, 5, { rarity: L, text: 'Verursacht am Ende Eures Zuges 2 Schaden bei ALLEN anderen Charakteren.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) g.aoe(s, g.chars().filter((c) => c !== s), 2); } } });
  M('barrens_stablehand', 'Stallmeister des Brachlands', 7, 4, 4, { rarity: 'epic', text: '<b>Kampfschrei:</b> Ruft ein zufälliges Wildtier herbei.',
    play: (g, s) => g.summonNext(s, g.randomCard((c) => c.type === 'minion' && c.race === 'beast')) });
  M('ravenholdt_assassin', 'Assassine von Rabenholdt', 7, 7, 5, { rarity: 'rare', kw: ['stealth'], text: '<b>Verstohlenheit</b>' });
  M('gruul', 'Gruul', 8, 7, 7, { rarity: L, text: 'Erhält am Ende jedes Zuges +1/+1.',
    triggers: { turnEnd: (g, s) => g.buff(s, { atk: 1, hp: 1 }) } });
  M('ragnaros_the_firelord', 'Ragnaros der Feuerfürst', 8, 8, 8, { rarity: L, kw: ['cantAttack'], text: 'Kann nicht angreifen. Verursacht am Ende Eures Zuges 8 Schaden bei einem zufälligen Feind.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) { const t = g.pick(g.chars(1 - s.owner).filter((c) => g.hp(c) > 0)); if (t) g.damage(s, t, 8); } } } });
  M('alexstrasza', 'Alexstrasza', 9, 8, 8, { race: 'dragon', rarity: L, text: '<b>Kampfschrei:</b> Setzt das verbleibende Leben eines Helden auf 15.',
    target: 'hero', play: (g, s, t) => {
      if (!t) return;
      const mx = g.maxHp(t);
      if (mx < 15) { g.buff(t, { hp: 15 - mx }); t.damage = 0; } else t.damage = mx - 15;
    } });
  M('malygos', 'Malygos', 9, 4, 12, { race: 'dragon', rarity: L, spellDamage: 5, text: '<b>Zauberschaden +5</b>' });
  M('nozdormu', 'Nozdormu', 9, 8, 8, { race: 'dragon', rarity: L, text: 'Spieler haben pro Zug nur 15 Sekunden Zeit.' });
  M('onyxia', 'Onyxia', 9, 8, 8, { race: 'dragon', rarity: L, text: '<b>Kampfschrei:</b> Ruft Welpen (1/1) herbei, bis Eure Seite des Schlachtfelds voll ist.',
    play: (g, s) => { let left = true; while (g.P(s.owner).board.length < 7) { const i = g.pos(s); g.summon(s.owner, 't_whelp', left ? i : i + 1); left = !left; } } });
  const DREAMS = ['t_dream', 't_emerald_drake', 't_laughing_sister', 't_nightmare', 't_ysera_awakens'];
  M('ysera', 'Ysera', 9, 4, 12, { race: 'dragon', rarity: L, text: 'Erhaltet am Ende Eures Zuges eine Traumkarte auf die Hand.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) g.addCard(s.owner, g.pick(DREAMS)); } } });
  M('deathwing', 'Todesschwinge', 10, 12, 12, { race: 'dragon', rarity: L, text: '<b>Kampfschrei:</b> Vernichtet alle anderen Diener und werft Eure Hand ab.',
    play: (g, s) => {
      for (const m of g.board()) if (m !== s) g.destroy(m);
      for (const c of g.hand(s.owner)) { g.removeFromHand(c); c.zone = 'grave'; }
    } });
  M('sea_giant', 'Seeriese', 10, 8, 8, { rarity: 'epic', text: 'Kostet (1) weniger für jeden anderen Diener auf dem Schlachtfeld.',
    selfCost: (g, s) => -g.board().filter((m) => m !== s).length });
  M('mountain_giant', 'Bergriese', 12, 8, 8, { rarity: 'epic', text: 'Kostet (1) weniger für jede andere Karte auf Eurer Hand.',
    selfCost: (g, s) => -g.P(s.owner).hand.filter((id) => id !== s.id).length });
  M('molten_giant', 'Geschmolzener Riese', 20, 8, 8, { rarity: 'epic', text: 'Kostet (1) weniger für jeden Schaden, den Euer Held erlitten hat.',
    selfCost: (g, s) => -g.hero(s.owner).damage });

  /* Token */
  T('t_damaged_golem', 'Beschädigter Golem', 1, 2, 1, { race: 'mech' });
  T('t_imp', 'Wichtel', 1, 1, 1, { race: 'demon' });
  T('t_devilsaur', 'Teufelssaurier', 5, 5, 5, { race: 'beast' });
  T('t_squirrel', 'Eichhörnchen', 1, 1, 1, { race: 'beast' });
  T('t_whelp', 'Welpe', 1, 1, 1, { race: 'dragon' });
  T('t_violet_apprentice', 'Violetter Lehrling', 0, 1, 1);
  T('t_squire', 'Knappe', 1, 2, 2);
  T('t_baine_bloodhoof', 'Baine Bluthuf', 4, 4, 5, { rarity: L });
  T('t_gnoll', 'Gnoll', 2, 2, 2, { kw: ['taunt'], text: '<b>Spott</b>' });
  T('t_flame_of_azzinoth', 'Flamme von Azzinoth', 1, 2, 1);
  T('t_finkle_einhorn', 'Finkle Einhorn', 3, 3, 3, { rarity: L });
  TS('t_bananas', 'Bananen', 1, { text: 'Verleiht einem Diener +1/+1.', target: 'minion', play: (g, s, t) => g.buff(t, { atk: 1, hp: 1 }) });
  TS('t_dream', 'Traum', 0, { text: 'Lasst einen Diener auf die Hand seines Besitzers zurückkehren.', target: 'minion', play: (g, s, t) => g.bounce(t) });
  T('t_emerald_drake', 'Smaragddrache', 4, 7, 6, { race: 'dragon' });
  T('t_laughing_sister', 'Lachende Schwester', 3, 3, 5, { kw: ['elusive'], text: 'Kann nicht als Ziel von Zaubern oder Heldenfähigkeiten gewählt werden.' });
  HS.lib.E('e_nightmare', { triggers: { turnStart: (g, e, ev, x) => { if (ev.player === x.by) g.destroy(e); } } });
  TS('t_nightmare', 'Albtraum', 0, { text: 'Verleiht einem Diener +5/+5. Zu Beginn Eures nächsten Zuges wird er vernichtet.', target: 'minion',
    play: (g, s, t) => g.buff(t, { atk: 5, hp: 5, card: 'e_nightmare', by: s.owner }) });
  TS('t_ysera_awakens', 'Ysera erwacht', 2, { text: 'Verursacht $5 Schaden bei allen Charakteren außer Ysera.',
    play: (g, s) => g.aoe(s, g.chars().filter((c) => c.card !== 'ysera'), g.spellDmg(s, 5)) });
})();
