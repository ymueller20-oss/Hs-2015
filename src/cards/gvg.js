/* Goblins gegen Gnome */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : global;
  const HS = root.HS;
  const { M, S, W, T, TS } = HS.lib;
  HS.setSet('gvg');
  const L = 'legendary';
  const room = (g, s) => g.P(s.owner).board.length < 7;
  const isMech = (g, m) => g.isMinion(m) && g.isRace(m, 'mech');
  const SPARE = ['t_armor_plating', 't_emergency_coolant', 't_finicky_cloakfield', 't_reversing_switch', 't_rusty_horn', 't_time_rewinder', 't_whirling_blades'];
  const spare = (g, pi) => g.addCard(pi, g.pick(SPARE));
  HS.spare = spare;
  const randMinion = (g, f) => g.randomCard((c) => c.type === 'minion' && f(c));

  /* Ersatzteile */
  const SP = (id, name, o) => TS(id, name, 1, Object.assign({ spare: true }, o));
  SP('t_armor_plating', 'Armor Plating', { text: 'Verleiht einem Diener +1 Leben.', target: 'minion', play: (g, s, t) => g.buff(t, { hp: 1 }) });
  SP('t_emergency_coolant', 'Emergency Coolant', { text: 'Wirkt <b>Freeze</b> auf einen Diener.', target: 'minion', play: (g, s, t) => g.freeze(t) });
  SP('t_finicky_cloakfield', 'Finicky Cloakfield', { text: 'Verleiht einem befreundeten Diener bis zu Eurem nächsten Zug <b>Stealth</b>.', target: 'friendlyMinion',
    play: (g, s, t) => g.buff(t, { kw: ['stealth'], expire: 'start:' + s.owner }) });
  SP('t_reversing_switch', 'Reversing Switch', { text: 'Vertauscht Angriff und Leben eines Dieners.', target: 'minion',
    play: (g, s, t) => { const a = g.atk(t), h = g.hp(t); g.buff(t, { setAtk: h, setHp: a }); } });
  SP('t_rusty_horn', 'Rusty Horn', { text: 'Verleiht einem Diener <b>Taunt</b>.', target: 'minion', play: (g, s, t) => g.giveKw(t, 'taunt') });
  SP('t_time_rewinder', 'Time Rewinder', { text: 'Lasst einen befreundeten Diener auf Eure Hand zurückkehren.', target: 'friendlyMinion', play: (g, s, t) => g.bounce(t) });
  SP('t_whirling_blades', 'Whirling Blades', { text: 'Verleiht einem Diener +1 Angriff.', target: 'minion', play: (g, s, t) => g.buff(t, { atk: 1 }) });

  /* ===== Neutral ===== */
  M('target_dummy', 'Target Dummy', 0, 0, 2, { race: 'mech', rarity: 'rare', kw: ['taunt'], text: '<b>Taunt</b>' });
  M('clockwork_gnome', 'Clockwork Gnome', 1, 2, 1, { race: 'mech', text: '<b>Deathrattle:</b> Erhaltet ein Spare Part auf die Hand.', deathrattle: (g, s) => spare(g, s.owner) });
  M('cogmaster', 'Cogmaster', 1, 1, 2, { text: 'Hat +2 Angriff, solange Ihr einen Mech habt.',
    selfAtk: (g, s) => (g.inPlay(s) && g.others(s).some((m) => isMech(g, m)) ? 2 : 0) });
  M('annoy_o_tron', 'Annoy-o-Tron', 2, 1, 2, { race: 'mech', kw: ['taunt', 'divineShield'], text: '<b>Taunt</b>, <b>Divine Shield</b>' });
  M('mechwarper', 'Mechwarper', 2, 2, 3, { race: 'mech', text: 'Eure Mechs kosten (1) weniger.',
    costAura: (g, s, c) => (c.owner === s.owner && c.zone === 'hand' && g.def(c).type === 'minion' && g.def(c).race === 'mech' ? -1 : 0) });
  M('micro_machine', 'Micro Machine', 2, 1, 2, { race: 'mech', text: 'Erhält zu Beginn jedes Zuges +1 Angriff.',
    triggers: { turnStart: (g, s) => g.buff(s, { atk: 1 }) } });
  M('puddlestomper', 'Puddlestomper', 2, 3, 2, { race: 'murloc' });
  M('gilblin_stalker', 'Gilblin Stalker', 2, 2, 3, { kw: ['stealth'], text: '<b>Stealth</b>' });
  M('explosive_sheep', 'Explosive Sheep', 2, 1, 1, { race: 'mech', text: '<b>Deathrattle:</b> Verursacht 2 Schaden bei allen Dienern.',
    deathrattle: (g, s) => g.aoe(s, g.board(), 2) });
  M('recombobulator', 'Recombobulator', 2, 3, 2, { rarity: 'epic', text: '<b>Battlecry:</b> Verwandelt einen befreundeten Diener in einen zufälligen Diener mit gleichen Kosten.',
    target: 'friendlyMinion', play: (g, s, t) => { if (t) { const id = randMinion(g, (c) => c.cost === g.def(t).cost); if (id) g.transform(t, id); } } });
  M('ships_cannon', 'Ship\'s Cannon', 2, 2, 3, { text: 'Nachdem Ihr einen Pirate herbeigerufen habt, wird 2 Schaden bei einem zufälligen Feind verursacht.',
    triggers: { afterSummon: (g, s, ev) => { if (ev.minion !== s && ev.minion.owner === s.owner && g.isRace(ev.minion, 'pirate')) { const t = g.pick(g.chars(1 - s.owner)); if (t) g.damage(s, t, 2); } } } });
  M('stonesplinter_trogg', 'Stonesplinter Trogg', 2, 2, 3, { text: 'Immer wenn Euer Gegner einen Zauber wirkt, erhält dieser Diener +1 Angriff.',
    triggers: { castSpell: (g, s, ev) => { if (ev.player !== s.owner) g.buff(s, { atk: 1 }); } } });
  M('gnomeregan_infantry', 'Gnomeregan Infantry', 3, 1, 4, { kw: ['charge', 'taunt'], text: '<b>Charge</b>, <b>Taunt</b>' });
  M('flying_machine', 'Flying Machine', 3, 1, 4, { race: 'mech', kw: ['windfury'], text: '<b>Windfury</b>' });
  M('lil_exorcist', 'Lil\' Exorcist', 3, 2, 3, { rarity: 'rare', kw: ['taunt'], text: '<b>Taunt</b>. <b>Battlecry:</b> Erhält +1/+1 für jeden feindlichen Diener mit <b>Deathrattle</b>.',
    play: (g, s) => { const n = g.board(1 - s.owner).filter((m) => HS.hasDeathrattle(g, m)).length; if (n) g.buff(s, { atk: n, hp: n }); } });
  M('spider_tank', 'Spider Tank', 3, 3, 4, { race: 'mech' });
  M('tinkertown_technician', 'Tinkertown Technician', 3, 3, 3, { text: '<b>Battlecry:</b> Habt Ihr einen Mech, erhält dieser Diener +1/+1 und Ihr ein Spare Part.',
    play: (g, s) => { if (g.others(s).some((m) => isMech(g, m))) { g.buff(s, { atk: 1, hp: 1 }); spare(g, s.owner); } } });
  M('ogre_brute', 'Ogre Brute', 3, 4, 4, { kw: ['ogre'], text: 'Greift mit einer Wahrscheinlichkeit von 50 % den falschen Feind an.' });
  M('gnomish_experimenter', 'Gnomish Experimenter', 3, 3, 2, { rarity: 'rare', text: '<b>Battlecry:</b> Zieht eine Karte. Ist es ein Diener, wird er in ein Chicken verwandelt.',
    play: (g, s) => { const d = g.draw(s.owner)[0]; if (d && g.def(d).type === 'minion') g.transform(d, 't_chicken'); } });
  M('hobgoblin', 'Hobgoblin', 3, 2, 3, { rarity: 'epic', text: 'Immer wenn Ihr einen Diener mit 1 Angriff ausspielt, erhält er +2/+2.',
    triggers: { cardPlayed: (g, s, ev) => { const c = ev.card; if (ev.player === s.owner && g.def(c).type === 'minion' && g.atk(c) === 1) g.buff(c, { atk: 2, hp: 2 }); } } });
  M('goblin_sapper', 'Goblin Sapper', 3, 2, 4, { rarity: 'rare', text: 'Hat +4 Angriff, solange Euer Gegner 6 oder mehr Karten auf der Hand hat.',
    selfAtk: (g, s) => (g.P(1 - s.owner).hand.length >= 6 ? 4 : 0) });
  M('illuminator', 'Illuminator', 3, 2, 4, { rarity: 'rare', text: 'Kontrolliert Ihr am Ende Eures Zuges ein <b>Secret</b>, werden bei Eurem Helden 4 Leben wiederhergestellt.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner && g.P(s.owner).secrets.length) g.heal(s, g.hero(s.owner), 4); } } });
  M('jeeves', 'Jeeves', 4, 1, 4, { race: 'mech', rarity: 'rare', text: 'Am Ende jedes Zuges zieht der aktive Spieler Karten, bis er 3 Karten hat.',
    triggers: { turnEnd: (g, s, ev) => { const n = 3 - g.P(ev.player).hand.length; if (n > 0) g.draw(ev.player, n); } } });
  M('kezan_mystic', 'Kezan Mystic', 4, 4, 3, { rarity: 'rare', text: '<b>Battlecry:</b> Übernehmt die Kontrolle über ein zufälliges feindliches <b>Secret</b>.',
    play: (g, s) => {
      const o = g.P(1 - s.owner), me = g.P(s.owner);
      const all = o.secrets.map((id) => g.ent(id));
      const fresh = all.filter((x) => !me.secrets.some((id) => g.ent(id).card === x.card));
      const sec = g.pick(fresh.length ? fresh : all);
      if (!sec) return;
      o.secrets = o.secrets.filter((id) => id !== sec.id);
      if (me.secrets.length < 5 && !me.secrets.some((id) => g.ent(id).card === sec.card)) { sec.owner = s.owner; me.secrets.push(sec.id); }
      else sec.zone = 'grave';
    } });
  M('mini_mage', 'Mini-Mage', 4, 4, 1, { rarity: 'epic', kw: ['stealth'], spellDamage: 1, text: '<b>Stealth</b>, <b>Spell Damage +1</b>' });
  M('burly_rockjaw_trogg', 'Burly Rockjaw Trogg', 4, 3, 5, { text: 'Immer wenn Euer Gegner einen Zauber wirkt, erhält dieser Diener +2 Angriff.',
    triggers: { castSpell: (g, s, ev) => { if (ev.player !== s.owner) g.buff(s, { atk: 2 }); } } });
  M('lost_tallstrider', 'Lost Tallstrider', 4, 5, 4, { race: 'beast' });
  M('piloted_shredder', 'Piloted Shredder', 4, 4, 3, { race: 'mech', text: '<b>Deathrattle:</b> Ruft einen zufälligen Diener mit Kosten von (2) herbei.',
    deathrattle: (g, s, info) => g.summon(s.owner, randMinion(g, (c) => c.cost === 2), info.pos) });
  M('mechanical_yeti', 'Mechanical Yeti', 4, 4, 5, { race: 'mech', text: '<b>Deathrattle:</b> Jeder Spieler erhält ein Spare Part.',
    deathrattle: (g, s) => { spare(g, s.owner); spare(g, 1 - s.owner); } });
  M('enhance_o_mechano', 'Enhance-o Mechano', 4, 3, 2, { race: 'mech', rarity: 'epic', text: '<b>Battlecry:</b> Verleiht Euren anderen Dienern zufällig <b>Windfury</b>, <b>Taunt</b> oder <b>Divine Shield</b>.',
    play: (g, s) => { for (const m of g.others(s)) g.giveKw(m, g.pick(['windfury', 'taunt', 'divineShield'])); } });
  M('arcane_nullifier_x21', 'Arcane Nullifier X-21', 4, 2, 5, { race: 'mech', rarity: 'rare', kw: ['taunt', 'elusive'], text: '<b>Taunt</b>. Kann nicht als Ziel von Zaubern oder Heldenfähigkeiten gewählt werden.' });
  M('antique_healbot', 'Antique Healbot', 5, 3, 3, { race: 'mech', text: '<b>Battlecry:</b> Stellt bei Eurem Helden 8 Leben wieder her.',
    play: (g, s) => g.heal(s, g.hero(s.owner), 8) });
  M('bomb_lobber', 'Bomb Lobber', 5, 3, 3, { rarity: 'rare', text: '<b>Battlecry:</b> Verursacht 4 Schaden bei einem zufälligen feindlichen Diener.',
    play: (g, s) => { const t = g.pick(g.board(1 - s.owner)); if (t) g.damage(s, t, 4); } });
  M('fel_reaver', 'Fel Reaver', 5, 8, 8, { race: 'mech', rarity: 'epic', text: 'Immer wenn Euer Gegner eine Karte ausspielt, werden die obersten 3 Karten Eures Decks entfernt.',
    triggers: { cardPlayed: (g, s, ev) => { if (ev.player !== s.owner) { const p = g.P(s.owner); for (let i = 0; i < 3 && p.deck.length; i++) g.ent(p.deck.pop()).zone = 'grave'; } } } });
  M('junkbot', 'Junkbot', 5, 1, 5, { race: 'mech', rarity: 'epic', text: 'Immer wenn ein befreundeter Mech stirbt, erhält dieser Diener +2/+2.',
    triggers: { death: (g, s, ev) => { if (ev.owner === s.owner && ev.minion !== s && g.isRace(ev.minion, 'mech')) g.buff(s, { atk: 2, hp: 2 }); } } });
  M('salty_dog', 'Salty Dog', 5, 7, 4, { race: 'pirate' });
  M('madder_bomber', 'Madder Bomber', 5, 5, 4, { rarity: 'rare', text: '<b>Battlecry:</b> Verursacht 6 Schaden, zufällig auf alle anderen Charaktere verteilt.',
    play: (g, s) => g.splitDamage(s, 6, () => g.chars().filter((c) => c !== s)) });
  M('blingtron_3000', 'Blingtron 3000', 5, 3, 4, { race: 'mech', rarity: L, text: '<b>Battlecry:</b> Rüstet für jeden Spieler eine zufällige Waffe aus.',
    play: (g, s) => { for (const i of [s.owner, 1 - s.owner]) g.equip(i, g.randomCard((c) => c.type === 'weapon')); } });
  M('hemet_nesingwary', 'Hemet Nesingwary', 5, 6, 3, { rarity: L, text: '<b>Battlecry:</b> Vernichtet ein Beast.',
    target: { t: 'minion', f: (g, s, t) => g.isRace(t, 'beast') }, play: (g, s, t) => { if (t) g.destroy(t); } });
  M('mimirons_head', 'Mimiron\'s Head', 5, 4, 5, { race: 'mech', rarity: L, text: 'Habt Ihr zu Beginn Eures Zuges mindestens 3 Mechs, werden sie alle vernichtet und zu V-07-TR-0N zusammengesetzt.',
    triggers: { turnStart: (g, s, ev) => {
      if (ev.player !== s.owner) return;
      const mechs = g.board(s.owner).filter((m) => isMech(g, m));
      if (mechs.length < 3) return;
      for (const m of mechs) g.destroy(m);
      g.processDeaths();
      g.summon(s.owner, 't_v07tr0n');
    } } });
  M('gazlowe', 'Gazlowe', 6, 3, 6, { rarity: L, text: 'Immer wenn Ihr einen Zauber mit Kosten von (1) wirkt, erhaltet Ihr einen zufälligen Mech auf die Hand.',
    triggers: { castSpell: (g, s, ev) => {
      /* tatsächlich bezahlte Kosten zählen (z. B. mit Sorcerer's Apprentice oder Preparation) */
      if (ev.player === s.owner && ev.cost === 1) g.addCard(s.owner, randMinion(g, (x) => x.race === 'mech'));
    } } });
  M('mogor_the_ogre', 'Mogor the Ogre', 6, 7, 6, { rarity: L, text: 'Alle Diener greifen mit einer Wahrscheinlichkeit von 50 % den falschen Feind an.' });
  M('toshley', 'Toshley', 6, 5, 7, { rarity: L, text: '<b>Battlecry and Deathrattle:</b> Erhaltet ein Spare Part auf die Hand.',
    play: (g, s) => spare(g, s.owner), deathrattle: (g, s) => spare(g, s.owner) });
  M('piloted_sky_golem', 'Piloted Sky Golem', 6, 6, 4, { race: 'mech', rarity: 'epic', text: '<b>Deathrattle:</b> Ruft einen zufälligen Diener mit Kosten von (4) herbei.',
    deathrattle: (g, s, info) => g.summon(s.owner, randMinion(g, (c) => c.cost === 4), info.pos) });
  M('dr_boom', 'Dr. Boom', 7, 7, 7, { rarity: L, text: '<b>Battlecry:</b> Ruft zwei Boom Bots (1/1) herbei. <i>Wenn sie sterben, verursachen sie 1–4 Schaden bei einem zufälligen Feind.</i>',
    play: (g, s) => { g.summonNext(s, 't_boom_bot'); g.summon(s.owner, 't_boom_bot', g.pos(s)); } });
  M('troggzor_the_earthinator', 'Troggzor the Earthinator', 7, 6, 6, { rarity: L, text: 'Immer wenn Euer Gegner einen Zauber wirkt, ruft einen Burly Rockjaw Trogg herbei.',
    triggers: { castSpell: (g, s, ev) => { if (ev.player !== s.owner) g.summonNext(s, 'burly_rockjaw_trogg'); } } });
  M('foe_reaper_4000', 'Foe Reaper 4000', 8, 6, 9, { race: 'mech', rarity: L, cleave: true, text: 'Verursacht auch Schaden bei den Dienern neben dem angegriffenen Ziel.' });
  M('force_tank_max', 'Force-Tank MAX', 8, 7, 7, { race: 'mech', kw: ['divineShield'], text: '<b>Divine Shield</b>' });
  M('sneeds_old_shredder', 'Sneed\'s Old Shredder', 8, 5, 7, { race: 'mech', rarity: L, text: '<b>Deathrattle:</b> Ruft einen zufälligen legendären Diener herbei.',
    deathrattle: (g, s, info) => g.summon(s.owner, randMinion(g, (c) => c.rarity === 'legendary'), info.pos) });
  M('mekgineer_thermaplugg', 'Mekgineer Thermaplugg', 9, 9, 7, { race: 'mech', rarity: L, text: 'Immer wenn ein feindlicher Diener stirbt, ruft einen Leper Gnome herbei.',
    triggers: { death: (g, s, ev) => { if (ev.owner !== s.owner) g.summon(s.owner, 'leper_gnome'); } } });
  M('clockwork_giant', 'Clockwork Giant', 12, 8, 8, { race: 'mech', rarity: 'epic', text: 'Kostet (1) weniger für jede Karte auf der Hand Eures Gegners.',
    selfCost: (g, s) => -g.P(1 - s.owner).hand.length });

  /* ===== Druide ===== */
  M('anodized_robo_cub', 'Anodized Robo Cub', 2, 2, 2, { cls: 'druid', race: 'mech', kw: ['taunt'], text: '<b>Taunt</b>. <b>Choose One:</b> +1 Angriff; oder +1 Leben.',
    choose: [
      { name: 'Attack Mode', text: '+1 Angriff.', play: (g, s) => g.buff(s, { atk: 1 }) },
      { name: 'Tank Mode', text: '+1 Leben.', play: (g, s) => g.buff(s, { hp: 1 }) },
    ] });
  M('grove_tender', 'Grove Tender', 3, 2, 4, { cls: 'druid', rarity: 'rare', text: '<b>Choose One:</b> Jeder Spieler erhält einen Manakristall; oder jeder Spieler zieht eine Karte.',
    choose: [
      { name: 'Gift of Mana', text: 'Jeder Spieler erhält einen Manakristall.', play: (g, s) => { g.gainMana(s.owner, 1, true); g.gainMana(1 - s.owner, 1, true); } },
      { name: 'Gift of Cards', text: 'Jeder Spieler zieht eine Karte.', play: (g, s) => { g.draw(s.owner); g.draw(1 - s.owner); } },
    ] });
  M('mech_bear_cat', 'Mech-Bear-Cat', 6, 7, 6, { cls: 'druid', race: 'mech', rarity: 'rare', text: 'Immer wenn dieser Diener Schaden erleidet, erhaltet Ihr ein Spare Part.',
    triggers: { damage: (g, s, ev) => { if (ev.target === s) spare(g, s.owner); } } });
  M('druid_of_the_fang', 'Druid of the Fang', 5, 4, 4, { cls: 'druid', text: '<b>Battlecry:</b> Habt Ihr ein Beast, verwandelt sich dieser Diener in eine Kobra (7/7).',
    play: (g, s) => { if (g.others(s).some((m) => g.isRace(m, 'beast'))) g.transform(s, 't_fang_cobra'); } });
  S('recycle', 'Recycle', 6, { cls: 'druid', rarity: 'rare', text: 'Mischt einen feindlichen Diener in das Deck Eures Gegners.', target: 'enemyMinion',
    play: (g, s, t) => { g.removeFromBoard(t); t.zone = 'grave'; g.shuffleIn(t.owner, t.card); } });
  S('dark_wispers', 'Dark Wispers', 6, { cls: 'druid', rarity: 'epic', text: '<b>Choose One:</b> Ruft 5 Wisps herbei; oder verleiht einem Diener +5/+5 und <b>Taunt</b>.',
    choose: [
      { name: 'Call of the Wisps', text: 'Ruft 5 Wisps (1/1) herbei.', canPlay: room, play: (g, s) => { for (let i = 0; i < 5; i++) g.summon(s.owner, 'wisp'); } },
      { name: 'Might of the Wisps', text: '+5/+5 und <b>Taunt</b>.', target: 'minion', play: (g, s, t) => { g.buff(t, { atk: 5, hp: 5 }); g.giveKw(t, 'taunt'); } },
    ] });
  S('tree_of_life', 'Tree of Life', 9, { cls: 'druid', rarity: 'epic', text: 'Stellt bei ALLEN Charakteren sämtliches Leben wieder her.',
    play: (g, s) => g.batch(() => { for (const c of g.chars()) g.heal(s, c, c.damage); }) });
  M('malorne', 'Malorne', 7, 9, 7, { cls: 'druid', race: 'beast', rarity: L, text: '<b>Deathrattle:</b> Mischt diesen Diener in Euer Deck.',
    /* nur einmal (Baron Rivendare) und nicht, solange Malorne noch im Spiel ist (Feign Death) */
    deathrattle: (g, s) => { if (s.zone !== 'grave' || s.shuffled) return; s.shuffled = true; g.shuffleIn(s.owner, 'malorne'); } });
  T('t_fang_cobra', 'Druid of the Fang', 5, 7, 7, { cls: 'druid', race: 'beast' });

  /* ===== Jäger ===== */
  S('call_pet', 'Call Pet', 2, { cls: 'hunter', rarity: 'rare', text: 'Zieht eine Karte. Ist es ein Beast, kostet es (4) weniger.',
    play: (g, s) => { const d = g.draw(s.owner)[0]; if (d && g.def(d).type === 'minion' && g.isRace(d, 'beast')) d.ench.push({ cost: -4 }); } });
  S('feign_death', 'Feign Death', 2, { cls: 'hunter', rarity: 'epic', text: 'Löst alle <b>Deathrattle</b> Eurer Diener aus.',
    play: (g, s) => {
      for (const m of g.board(s.owner)) {
        const list = [];
        if (!m.silenced && g.def(m).deathrattle) list.push(g.def(m).deathrattle);
        for (const x of m.ench) if (x.card && HS.CARDS[x.card] && HS.CARDS[x.card].deathrattle) list.push(HS.CARDS[x.card].deathrattle);
        const times = g.hasOnBoard(s.owner, 'baron_rivendare') ? 2 : 1;
        for (let k = 0; k < times; k++) for (const dr of list) dr(g, m, { pos: g.pos(m) + 1, owner: m.owner });
      }
    } });
  S('cobra_shot', 'Cobra Shot', 5, { cls: 'hunter', text: 'Verursacht $3 Schaden bei einem Diener und dem feindlichen Helden.', target: 'minion',
    play: (g, s, t) => g.aoe(s, [t, g.hero(1 - s.owner)], g.spellDmg(s, 3)) });
  W('glaivezooka', 'Glaivezooka', 2, 2, 2, { cls: 'hunter', text: '<b>Battlecry:</b> Verleiht einem zufälligen befreundeten Diener +1 Angriff.',
    play: (g, s) => { const t = g.pick(g.board(s.owner)); if (t) g.buff(t, { atk: 1 }); } });
  M('metaltooth_leaper', 'Metaltooth Leaper', 3, 3, 3, { cls: 'hunter', race: 'mech', rarity: 'rare', text: '<b>Battlecry:</b> Verleiht Euren anderen Mechs +2 Angriff.',
    play: (g, s) => { for (const m of g.others(s)) if (isMech(g, m)) g.buff(m, { atk: 2 }); } });
  M('king_of_beasts', 'King of Beasts', 5, 2, 6, { cls: 'hunter', race: 'beast', rarity: 'rare', kw: ['taunt'], text: '<b>Taunt</b>. <b>Battlecry:</b> Erhält +1 Angriff für jedes andere befreundete Beast.',
    play: (g, s) => { const n = g.others(s).filter((m) => g.isRace(m, 'beast')).length; if (n) g.buff(s, { atk: n }); } });
  M('gahzrilla', 'Gahz\'rilla', 7, 6, 9, { cls: 'hunter', race: 'beast', rarity: L, text: 'Immer wenn dieser Diener Schaden erleidet, verdoppelt sich sein Angriff.',
    triggers: { damage: (g, s, ev) => { if (ev.target === s) g.buff(s, { atk: g.atk(s) }); } } });
  M('steamwheedle_sniper', 'Steamwheedle Sniper', 2, 2, 3, { cls: 'hunter', rarity: 'epic', text: 'Eure Heldenfähigkeit kann Diener als Ziel wählen.' });

  /* ===== Magier ===== */
  S('flamecannon', 'Flamecannon', 2, { cls: 'mage', text: 'Verursacht $4 Schaden bei einem zufälligen feindlichen Diener.',
    canPlay: (g, s) => g.board(1 - s.owner).length > 0, play: (g, s) => { const t = g.pick(g.board(1 - s.owner)); if (t) g.damage(s, t, g.spellDmg(s, 4)); } });
  S('unstable_portal', 'Unstable Portal', 2, { cls: 'mage', rarity: 'rare', text: 'Erhaltet einen zufälligen Diener auf die Hand. Er kostet (3) weniger.',
    play: (g, s) => g.addCard(s.owner, randMinion(g, () => true), { cost: -3 }) });
  S('echo_of_medivh', 'Echo of Medivh', 4, { cls: 'mage', rarity: 'epic', text: 'Legt eine Kopie jedes befreundeten Dieners auf Eure Hand.',
    play: (g, s) => { for (const m of g.board(s.owner)) g.addCard(s.owner, m.card); } });
  M('snowchugger', 'Snowchugger', 2, 2, 3, { cls: 'mage', race: 'mech', kw: ['freezer'], text: 'Wirkt <b>Freeze</b> auf jeden Charakter, der von diesem Diener Schaden erleidet.' });
  M('soot_spewer', 'Soot Spewer', 3, 3, 3, { cls: 'mage', race: 'mech', rarity: 'rare', spellDamage: 1, text: '<b>Spell Damage +1</b>' });
  M('goblin_blastmage', 'Goblin Blastmage', 4, 5, 4, { cls: 'mage', rarity: 'rare', text: '<b>Battlecry:</b> Habt Ihr einen Mech, verursacht 4 Schaden, zufällig auf alle Feinde verteilt.',
    play: (g, s) => { if (g.others(s).some((m) => isMech(g, m))) g.splitDamage(s, 4, () => g.chars(1 - s.owner)); } });
  M('wee_spellstopper', 'Wee Spellstopper', 4, 2, 5, { cls: 'mage', rarity: 'epic', positional: true, text: 'Benachbarte Diener können nicht als Ziel von Zaubern oder Heldenfähigkeiten gewählt werden.',
    auraKw: (g, s, t) => (g.isMinion(t) && t.owner === s.owner && g.adj(s).includes(t) ? ['elusive'] : null) });
  M('flame_leviathan', 'Flame Leviathan', 7, 7, 7, { cls: 'mage', race: 'mech', rarity: L, text: 'Wenn Ihr diese Karte zieht, verursacht sie 2 Schaden bei allen Charakteren.',
    onDraw: (g, s) => g.aoe(s, g.chars(), 2) });

  /* ===== Paladin ===== */
  S('seal_of_light', 'Seal of Light', 2, { cls: 'paladin', text: 'Stellt bei Eurem Helden #4 Leben wieder her und verleiht ihm +2 Angriff in diesem Zug.',
    play: (g, s) => { g.heal(s, g.hero(s.owner), g.spellHeal(s, 4)); g.buff(g.hero(s.owner), { atk: 2, expire: g.eot() }); } });
  S('muster_for_battle', 'Muster for Battle', 3, { cls: 'paladin', rarity: 'rare', text: 'Ruft drei Silver Hand Recruits (1/1) herbei. Rüstet eine Waffe (1/4) aus.',
    play: (g, s) => { for (let i = 0; i < 3; i++) g.summon(s.owner, 't_silver_hand_recruit'); g.equip(s.owner, 'lights_justice'); } });
  W('coghammer', 'Coghammer', 3, 2, 3, { cls: 'paladin', rarity: 'epic', text: '<b>Battlecry:</b> Verleiht einem zufälligen befreundeten Diener <b>Divine Shield</b> und <b>Taunt</b>.',
    play: (g, s) => { const t = g.pick(g.board(s.owner)); if (t) g.giveKw(t, 'divineShield', 'taunt'); } });
  M('shielded_minibot', 'Shielded Minibot', 2, 2, 2, { cls: 'paladin', race: 'mech', kw: ['divineShield'], text: '<b>Divine Shield</b>' });
  M('scarlet_purifier', 'Scarlet Purifier', 3, 4, 3, { cls: 'paladin', rarity: 'rare', text: '<b>Battlecry:</b> Verursacht 2 Schaden bei allen Dienern mit <b>Deathrattle</b>.',
    play: (g, s) => g.aoe(s, g.board().filter((m) => m !== s && HS.hasDeathrattle(g, m)), 2) });
  M('cobalt_guardian', 'Cobalt Guardian', 5, 6, 3, { cls: 'paladin', race: 'mech', rarity: 'rare', text: 'Immer wenn Ihr einen Mech herbeiruft, erhält dieser Diener <b>Divine Shield</b>.',
    triggers: { summon: (g, s, ev) => { if (ev.minion !== s && ev.minion.owner === s.owner && isMech(g, ev.minion)) g.giveKw(s, 'divineShield'); } } });
  M('quartermaster', 'Quartermaster', 5, 2, 5, { cls: 'paladin', rarity: 'epic', text: '<b>Battlecry:</b> Verleiht Euren Silver Hand Recruits +2/+2.',
    play: (g, s) => { for (const m of g.board(s.owner)) if (m.card === 't_silver_hand_recruit') g.buff(m, { atk: 2, hp: 2 }); } });
  M('bolvar_fordragon', 'Bolvar Fordragon', 5, 1, 7, { cls: 'paladin', rarity: L, text: 'Immer wenn ein befreundeter Diener stirbt, während diese Karte auf Eurer Hand ist, erhält sie +1 Angriff.',
    handTriggers: { death: (g, s, ev) => { if (ev.owner === s.owner) g.buff(s, { atk: 1 }); } } });

  /* ===== Priester ===== */
  S('light_of_the_naaru', 'Light of the Naaru', 1, { cls: 'priest', rarity: 'rare', text: 'Stellt #3 Leben wieder her. Ist das Ziel danach noch verletzt, ruft eine Lightwarden herbei.', target: 'char',
    play: (g, s, t) => { g.heal(s, t, g.spellHeal(s, 3)); if (t.damage > 0 && g.inPlay(t)) g.summon(s.owner, 'lightwarden'); } });
  S('velens_chosen', 'Velen\'s Chosen', 3, { cls: 'priest', text: 'Verleiht einem Diener +2/+4 und <b>Spell Damage +1</b>.', target: 'minion',
    play: (g, s, t) => g.buff(t, { atk: 2, hp: 4, sd: 1 }) });
  S('lightbomb', 'Lightbomb', 6, { cls: 'priest', rarity: 'epic', text: 'Fügt jedem Diener Schaden in Höhe seines Angriffs zu.',
    play: (g, s) => { const list = g.board().map((m) => [m, g.atk(m)]); g.batch(() => { for (const [m, a] of list) g.damage(s, m, a); }); } });
  M('shrinkmeister', 'Shrinkmeister', 2, 3, 2, { cls: 'priest', text: '<b>Battlecry:</b> Verleiht einem Diener −2 Angriff in diesem Zug.',
    target: 'minion', play: (g, s, t) => { if (t) g.buff(t, { atk: -2, expire: g.eot() }); } });
  M('upgraded_repair_bot', 'Upgraded Repair Bot', 5, 5, 5, { cls: 'priest', race: 'mech', rarity: 'rare', text: '<b>Battlecry:</b> Verleiht einem befreundeten Mech +4 Leben.',
    target: { t: 'friendlyMinion', f: (g, s, t) => g.isRace(t, 'mech') }, play: (g, s, t) => { if (t) g.buff(t, { hp: 4 }); } });
  M('shadowbomber', 'Shadowbomber', 1, 2, 1, { cls: 'priest', rarity: 'epic', text: '<b>Battlecry:</b> Verursacht 3 Schaden bei jedem Helden.',
    play: (g, s) => g.aoe(s, [g.hero(0), g.hero(1)], 3) });
  M('shadowboxer', 'Shadowboxer', 2, 2, 3, { cls: 'priest', race: 'mech', rarity: 'rare', text: 'Immer wenn ein Charakter geheilt wird, wird 1 Schaden bei einem zufälligen Feind verursacht.',
    triggers: { heal: (g, s) => { const t = g.pick(g.chars(1 - s.owner).filter((c) => g.hp(c) > 0)); if (t) g.damage(s, t, 1); } } });
  M('voljin', 'Vol\'jin', 5, 6, 2, { cls: 'priest', rarity: L, text: '<b>Battlecry:</b> Vertauscht das Leben dieses Dieners mit dem eines anderen Dieners.',
    target: 'minion', play: (g, s, t) => { if (!t) return; const a = g.hp(s), b = g.hp(t); g.buff(s, { setHp: b }); g.buff(t, { setHp: a }); } });

  /* ===== Schurke ===== */
  S('tinkers_sharpsword_oil', 'Tinker\'s Sharpsword Oil', 4, { cls: 'rogue', text: 'Verleiht Eurer Waffe +3 Angriff. <b>Combo:</b> Verleiht einem zufälligen befreundeten Diener +3 Angriff.',
    canPlay: (g, s) => !!g.weapon(s.owner),
    play: (g, s, t, ctx) => { const w = g.weapon(s.owner); if (w) g.buff(w, { atk: 3 }); if (ctx.combo) { const m = g.pick(g.board(s.owner)); if (m) g.buff(m, { atk: 3 }); } } });
  S('sabotage', 'Sabotage', 4, { cls: 'rogue', rarity: 'epic', text: 'Vernichtet einen zufälligen feindlichen Diener. <b>Combo:</b> Zerstört außerdem die Waffe Eures Gegners.',
    play: (g, s, t, ctx) => { const m = g.pick(g.board(1 - s.owner)); if (m) g.destroy(m); if (ctx.combo) { const w = g.weapon(1 - s.owner); if (w) g.destroy(w); } } });
  W('cogmasters_wrench', 'Cogmaster\'s Wrench', 3, 1, 3, { cls: 'rogue', rarity: 'epic', text: 'Hat +2 Angriff, solange Ihr einen Mech habt.',
    selfAtk: (g, s) => (g.board(s.owner).some((m) => isMech(g, m)) ? 2 : 0) });
  M('goblin_auto_barber', 'Goblin Auto-Barber', 2, 3, 2, { cls: 'rogue', race: 'mech', text: '<b>Battlecry:</b> Verleiht Eurer Waffe +1 Angriff.',
    play: (g, s) => { const w = g.weapon(s.owner); if (w) g.buff(w, { atk: 1 }); } });
  M('one_eyed_cheat', 'One-eyed Cheat', 2, 4, 1, { cls: 'rogue', race: 'pirate', rarity: 'rare', text: 'Immer wenn Ihr einen Pirate herbeiruft, erhält dieser Diener <b>Stealth</b>.',
    triggers: { summon: (g, s, ev) => { if (ev.minion !== s && ev.minion.owner === s.owner && g.isRace(ev.minion, 'pirate')) g.giveKw(s, 'stealth'); } } });
  M('iron_sensei', 'Iron Sensei', 3, 2, 2, { cls: 'rogue', race: 'mech', rarity: 'rare', text: 'Verleiht am Ende Eures Zuges einem anderen zufälligen befreundeten Mech +2/+2.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) { const t = g.pick(g.others(s).filter((m) => isMech(g, m))); if (t) g.buff(t, { atk: 2, hp: 2 }); } } } });
  M('ogre_ninja', 'Ogre Ninja', 5, 6, 6, { cls: 'rogue', rarity: 'rare', kw: ['stealth', 'ogre'], text: '<b>Stealth</b>. Greift mit einer Wahrscheinlichkeit von 50 % den falschen Feind an.' });
  M('trade_prince_gallywix', 'Trade Prince Gallywix', 6, 5, 8, { cls: 'rogue', rarity: L, text: 'Immer wenn Euer Gegner einen Zauber wirkt, erhaltet Ihr eine Kopie davon und er erhält eine Gallywix\'s Coin.',
    triggers: { castSpell: (g, s, ev) => { if (ev.player !== s.owner && ev.card.card !== 't_gallywix_coin') { g.addCard(s.owner, ev.card.card); g.addCard(ev.player, 't_gallywix_coin'); } } } });
  TS('t_gallywix_coin', 'Gallywix\'s Coin', 0, { cls: 'rogue', text: 'Erhaltet in diesem Zug 1 Manakristall. (Löst Gallywix nicht aus.)',
    play: (g, s) => { const p = g.P(s.owner); p.mana = Math.min(10, p.mana + 1); } });

  /* ===== Schamane ===== */
  S('ancestors_call', 'Ancestor\'s Call', 4, { cls: 'shaman', rarity: 'epic', text: 'Legt einen zufälligen Diener aus der Hand jedes Spielers auf das Schlachtfeld.',
    play: (g, s) => {
      for (const i of [s.owner, 1 - s.owner]) {
        const c = g.pick(g.hand(i).filter((x) => g.def(x).type === 'minion'));
        if (c && g.P(i).board.length < 7) { g.removeFromHand(c); g.place(c, null, true); }
      }
    } });
  S('crackle', 'Crackle', 2, { cls: 'shaman', overload: 1, text: 'Verursacht $3–$6 Schaden. <b>Overload:</b> (1)', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 3 + g.rand(4))) });
  W('powermace', 'Powermace', 3, 3, 2, { cls: 'shaman', rarity: 'rare', text: '<b>Deathrattle:</b> Verleiht einem zufälligen befreundeten Mech +2/+2.',
    deathrattle: (g, s) => { const t = g.pick(g.board(s.owner).filter((m) => isMech(g, m))); if (t) g.buff(t, { atk: 2, hp: 2 }); } });
  M('vitality_totem', 'Vitality Totem', 2, 0, 3, { cls: 'shaman', race: 'totem', rarity: 'rare', text: 'Stellt am Ende Eures Zuges bei Eurem Helden 4 Leben wieder her.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) g.heal(s, g.hero(s.owner), 4); } } });
  M('whirling_zap_o_matic', 'Whirling Zap-o-matic', 2, 3, 2, { cls: 'shaman', race: 'mech', kw: ['windfury'], text: '<b>Windfury</b>' });
  M('dunemaul_shaman', 'Dunemaul Shaman', 4, 5, 4, { cls: 'shaman', rarity: 'rare', overload: 1, kw: ['windfury', 'ogre'], text: '<b>Windfury</b>, <b>Overload:</b> (1). Greift mit einer Wahrscheinlichkeit von 50 % den falschen Feind an.' });
  M('siltfin_spiritwalker', 'Siltfin Spiritwalker', 4, 2, 5, { cls: 'shaman', race: 'murloc', rarity: 'epic', overload: 1, text: 'Immer wenn ein anderer befreundeter Murloc stirbt, zieht Ihr eine Karte. <b>Overload:</b> (1)',
    triggers: { death: (g, s, ev) => { if (ev.owner === s.owner && ev.minion !== s && g.isRace(ev.minion, 'murloc')) g.draw(s.owner); } } });
  M('neptulon', 'Neptulon', 7, 7, 7, { cls: 'shaman', rarity: L, overload: 3, text: '<b>Battlecry:</b> Erhaltet 4 zufällige Murlocs auf die Hand. <b>Overload:</b> (3)',
    play: (g, s) => { for (let i = 0; i < 4; i++) g.addCard(s.owner, randMinion(g, (c) => c.race === 'murloc')); } });

  /* ===== Hexenmeister ===== */
  S('darkbomb', 'Darkbomb', 2, { cls: 'warlock', text: 'Verursacht $3 Schaden.', target: 'char', play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 3)) });
  S('demonheart', 'Demonheart', 5, { cls: 'warlock', rarity: 'epic', text: 'Verursacht $5 Schaden bei einem Diener. Ist es ein befreundeter Demon, erhält er stattdessen +5/+5.', target: 'minion',
    play: (g, s, t) => { if (t.owner === s.owner && g.isRace(t, 'demon')) g.buff(t, { atk: 5, hp: 5 }); else g.damage(s, t, g.spellDmg(s, 5)); } });
  S('implosion', 'Imp-losion', 4, { cls: 'warlock', rarity: 'rare', text: 'Verursacht $2–$4 Schaden bei einem Diener. Ruft für jeden Schadenspunkt einen Imp (1/1) herbei.', target: 'minion',
    play: (g, s, t) => { const n = g.spellDmg(s, 2 + g.rand(3)); g.damage(s, t, n); for (let i = 0; i < n; i++) g.summon(s.owner, 't_imp'); } });
  M('mistress_of_pain', 'Mistress of Pain', 2, 1, 4, { cls: 'warlock', race: 'demon', rarity: 'rare', text: 'Immer wenn dieser Diener Schaden verursacht, wird bei Eurem Helden genauso viel Leben wiederhergestellt.',
    triggers: { damage: (g, s, ev) => { if (ev.source === s) g.heal(s, g.hero(s.owner), ev.amount); } } });
  M('floating_watcher', 'Floating Watcher', 5, 4, 4, { cls: 'warlock', race: 'demon', text: 'Immer wenn Euer Held in Eurem Zug Schaden erleidet, erhält dieser Diener +2/+2.',
    triggers: { damage: (g, s, ev) => { if (ev.target === g.hero(s.owner) && g.cur === s.owner) g.buff(s, { atk: 2, hp: 2 }); } } });
  M('fel_cannon', 'Fel Cannon', 4, 3, 5, { cls: 'warlock', race: 'mech', rarity: 'rare', text: 'Verursacht am Ende Eures Zuges 2 Schaden bei einem Diener, der kein Mech ist.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) { const t = g.pick(g.board().filter((m) => !g.isRace(m, 'mech'))); if (t) g.damage(s, t, 2); } } } });
  M('anima_golem', 'Anima Golem', 6, 9, 9, { cls: 'warlock', race: 'mech', rarity: 'epic', text: 'Ist dies am Ende eines Zuges Euer einziger Diener, wird er vernichtet.',
    triggers: { turnEnd: (g, s) => { if (g.board(s.owner).length === 1) g.destroy(s); } } });
  M('malganis', 'Mal\'Ganis', 9, 9, 7, { cls: 'warlock', race: 'demon', rarity: L, text: 'Eure anderen Demons haben +2/+2. Euer Held ist <b>Immune</b>.',
    aura: (g, s, t) => (t !== s && t.owner === s.owner && g.isMinion(t) && g.isRace(t, 'demon') ? { atk: 2, hp: 2 } : null),
    auraKw: (g, s, t) => (g.isHero(t) && t.owner === s.owner ? ['immune'] : null) });

  /* ===== Krieger ===== */
  S('bouncing_blade', 'Bouncing Blade', 3, { cls: 'warrior', rarity: 'epic', text: 'Verursacht $1 Schaden bei einem zufälligen Diener. Wird wiederholt, bis ein Diener stirbt.',
    canPlay: (g) => g.board().length > 0,
    play: (g, s) => {
      for (let i = 0; i < 80; i++) {
        const pool = g.board().filter((m) => g.hp(m) > 0 && !m.dead && !g.has(m, 'immune'));
        const t = g.pick(pool);
        if (!t) break;
        g.damage(s, t, g.spellDmg(s, 1));
        if (g.board().some((m) => g.hp(m) <= 0 || m.dead)) break;
      }
    } });
  S('crush', 'Crush', 7, { cls: 'warrior', rarity: 'epic', text: 'Vernichtet einen Diener. Habt Ihr einen verletzten Diener, kostet diese Karte (4) weniger.', target: 'minion',
    selfCost: (g, s) => (g.board(s.owner).some((m) => m.damage > 0) ? -4 : 0), play: (g, s, t) => g.destroy(t) });
  M('shieldmaiden', 'Shieldmaiden', 6, 5, 5, { cls: 'warrior', rarity: 'rare', text: '<b>Battlecry:</b> Erhaltet 5 Rüstung.', play: (g, s) => g.gainArmor(s.owner, 5) });
  M('screwjank_clunker', 'Screwjank Clunker', 4, 2, 5, { cls: 'warrior', race: 'mech', rarity: 'rare', text: '<b>Battlecry:</b> Verleiht einem befreundeten Mech +2/+2.',
    target: { t: 'friendlyMinion', f: (g, s, t) => g.isRace(t, 'mech') }, play: (g, s, t) => { if (t) g.buff(t, { atk: 2, hp: 2 }); } });
  M('warbot', 'Warbot', 1, 1, 3, { cls: 'warrior', race: 'mech', enrage: { atk: 1 }, text: '<b>Enrage:</b> +1 Angriff.' });
  M('iron_juggernaut', 'Iron Juggernaut', 6, 6, 5, { cls: 'warrior', race: 'mech', rarity: L, text: '<b>Battlecry:</b> Mischt eine Burrowing Mine in das Deck Eures Gegners. Wird sie gezogen, explodiert sie.',
    play: (g, s) => g.shuffleIn(1 - s.owner, 't_burrowing_mine') });
  M('siege_engine', 'Siege Engine', 5, 5, 5, { cls: 'warrior', race: 'mech', rarity: 'rare', text: 'Immer wenn Ihr Rüstung erhaltet, erhält dieser Diener +1 Angriff.',
    triggers: { armor: (g, s, ev) => { if (ev.player === s.owner) g.buff(s, { atk: 1 }); } } });
  W('ogre_warmaul', 'Ogre Warmaul', 3, 4, 2, { cls: 'warrior', kw: ['ogre'], text: 'Greift mit einer Wahrscheinlichkeit von 50 % den falschen Feind an.' });
  TS('t_burrowing_mine', 'Burrowing Mine', 0, { cls: 'warrior', text: 'Wenn Ihr diese Karte zieht, explodiert sie. Ihr erleidet 10 Schaden und zieht eine Karte.',
    onDraw: (g, s) => { g.removeFromHand(s); s.zone = 'grave'; g.log('Eine Grabende Mine explodiert!'); g.damage(s, g.hero(s.owner), 10); g.draw(s.owner); } });

  /* Token */
  T('t_chicken', 'Chicken', 1, 1, 1, { race: 'beast' });
  T('t_boom_bot', 'Boom Bot', 1, 1, 1, { race: 'mech', text: '<b>Deathrattle:</b> Verursacht 1–4 Schaden bei einem zufälligen Feind.',
    deathrattle: (g, s) => { const t = g.pick(g.chars(1 - s.owner).filter((c) => g.hp(c) > 0)); if (t) g.damage(s, t, 1 + g.rand(4)); } });
  T('t_v07tr0n', 'V-07-TR-0N', 8, 4, 8, { race: 'mech', rarity: L, kw: ['charge', 'megaWindfury'], text: '<b>Charge</b>. <b>Mega-Windfury</b> (kann viermal pro Zug angreifen).' });
})();
