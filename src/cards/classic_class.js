/* Klassik-Set: Klassenkarten */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : global;
  const HS = root.HS;
  const { M, S, W, T, TS, E, SEC } = HS.lib;
  HS.setSet('classic');
  const room = (g, s) => g.P(s.owner).board.length < 7;
  const R = (r) => ({ rarity: r });

  /* ===== Druide ===== */
  S('naturalize', 'Naturalize', 1, { cls: 'druid', text: 'Vernichtet einen Diener. Euer Gegner zieht 2 Karten.', target: 'minion',
    play: (g, s, t) => { g.destroy(t); g.draw(1 - s.owner, 2); } });
  S('savagery', 'Savagery', 1, { cls: 'druid', rarity: 'rare', text: 'Fügt einem Diener Schaden in Höhe des Angriffs Eures Helden zu.', target: 'minion',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, g.atk(g.hero(s.owner)))) });
  S('power_of_the_wild', 'Power of the Wild', 2, { cls: 'druid', text: '<b>Choose One:</b> Verleiht Euren Dienern +1/+1; oder ruft einen Panther (3/2) herbei.',
    choose: [
      { name: 'Leader of the Pack', text: 'Verleiht Euren Dienern +1/+1.', play: (g, s) => { for (const m of g.board(s.owner)) g.buff(m, { atk: 1, hp: 1 }); } },
      { name: 'Summon a Panther', text: 'Ruft einen Panther (3/2) herbei.', canPlay: room, play: (g, s) => g.summon(s.owner, 't_panther') },
    ] });
  S('wrath', 'Wrath', 2, { cls: 'druid', text: '<b>Choose One:</b> Verursacht $3 Schaden bei einem Diener; oder $1 Schaden und zieht eine Karte.',
    choose: [
      { name: 'Wrath (3)', text: 'Verursacht $3 Schaden bei einem Diener.', target: 'minion', play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 3)) },
      { name: 'Wrath (1)', text: 'Verursacht $1 Schaden bei einem Diener. Zieht eine Karte.', target: 'minion', play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 1)); g.draw(s.owner); } },
    ] });
  S('mark_of_nature', 'Mark of Nature', 3, { cls: 'druid', text: '<b>Choose One:</b> Verleiht einem Diener +4 Angriff; oder +4 Leben und <b>Taunt</b>.',
    choose: [
      { name: 'Tiger\'s Fury', text: '+4 Angriff.', target: 'minion', play: (g, s, t) => g.buff(t, { atk: 4 }) },
      { name: 'Thick Hide', text: '+4 Leben und <b>Taunt</b>.', target: 'minion', play: (g, s, t) => { g.buff(t, { hp: 4 }); g.giveKw(t, 'taunt'); } },
    ] });
  S('bite', 'Bite', 4, { cls: 'druid', rarity: 'rare', text: 'Verleiht Eurem Helden +4 Angriff in diesem Zug und 4 Rüstung.',
    play: (g, s) => { g.buff(g.hero(s.owner), { atk: 4, expire: g.eot() }); g.gainArmor(s.owner, 4); } });
  M('keeper_of_the_grove', 'Keeper of the Grove', 4, 2, 4, { cls: 'druid', rarity: 'rare', text: '<b>Choose One:</b> Verursacht 2 Schaden; oder wirkt <b>Silence</b> auf einen Diener.',
    choose: [
      { name: 'Moonfire', text: 'Verursacht 2 Schaden.', target: 'char', play: (g, s, t) => { if (t) g.damage(s, t, 2); } },
      { name: 'Dispel', text: 'Wirkt <b>Silence</b> auf einen Diener.', target: 'minion', play: (g, s, t) => { if (t) g.silence(t); } },
    ] });
  E('e_soul_of_the_forest', { text: '<b>Deathrattle:</b> Ruft einen Treant (2/2) herbei.', deathrattle: (g, e, info) => g.summon(e.owner, 't_treant', info.pos) });
  S('soul_of_the_forest', 'Soul of the Forest', 4, { cls: 'druid', text: 'Verleiht Euren Dienern "<b>Deathrattle:</b> Ruft einen Treant (2/2) herbei."',
    play: (g, s) => { for (const m of g.board(s.owner)) g.buff(m, { card: 'e_soul_of_the_forest' }); } });
  M('druid_of_the_claw', 'Druid of the Claw', 5, 4, 4, { cls: 'druid', text: '<b>Choose One:</b> <b>Charge</b>; oder +2 Leben und <b>Taunt</b>.',
    choose: [
      { name: 'Cat Form', text: '<b>Charge</b>', play: (g, s) => g.transform(s, 't_druid_cat') },
      { name: 'Bear Form', text: '+2 Leben und <b>Taunt</b>.', play: (g, s) => g.transform(s, 't_druid_bear') },
    ] });
  S('nourish', 'Nourish', 5, { cls: 'druid', rarity: 'rare', text: '<b>Choose One:</b> Erhaltet 2 Manakristalle; oder zieht 3 Karten.',
    choose: [
      { name: 'Rampant Growth', text: 'Erhaltet 2 Manakristalle.', play: (g, s) => g.gainMana(s.owner, 2, true) },
      { name: 'Nourish', text: 'Zieht 3 Karten.', play: (g, s) => g.draw(s.owner, 3) },
    ] });
  S('starfall', 'Starfall', 5, { cls: 'druid', rarity: 'rare', text: '<b>Choose One:</b> Verursacht $5 Schaden bei einem Diener; oder $2 Schaden bei allen feindlichen Dienern.',
    choose: [
      { name: 'Starlight', text: '$5 Schaden bei einem Diener.', target: 'minion', play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 5)) },
      { name: 'Star Shower', text: '$2 Schaden bei allen feindlichen Dienern.', play: (g, s) => g.aoe(s, g.board(1 - s.owner), g.spellDmg(s, 2)) },
    ] });
  S('force_of_nature', 'Force of Nature', 6, { cls: 'druid', rarity: 'epic', text: 'Ruft drei Treants (2/2) mit <b>Charge</b> herbei, die am Ende des Zuges sterben.',
    canPlay: room, play: (g, s) => { for (let i = 0; i < 3; i++) g.summon(s.owner, 't_treant_fon'); } });
  M('ancient_of_lore', 'Ancient of Lore', 7, 5, 5, { cls: 'druid', rarity: 'epic', text: '<b>Choose One:</b> Zieht 2 Karten; oder stellt 5 Leben wieder her.',
    choose: [
      { name: 'Ancient Teachings', text: 'Zieht 2 Karten.', play: (g, s) => g.draw(s.owner, 2) },
      { name: 'Ancient Secrets', text: 'Stellt 5 Leben wieder her.', target: 'char', play: (g, s, t) => { if (t) g.heal(s, t, 5); } },
    ] });
  M('ancient_of_war', 'Ancient of War', 7, 5, 5, { cls: 'druid', rarity: 'epic', text: '<b>Choose One:</b> +5 Angriff; oder +5 Leben und <b>Taunt</b>.',
    choose: [
      { name: 'Uproot', text: '+5 Angriff.', play: (g, s) => g.buff(s, { atk: 5 }) },
      { name: 'Rooted', text: '+5 Leben und <b>Taunt</b>.', play: (g, s) => { g.buff(s, { hp: 5 }); g.giveKw(s, 'taunt'); } },
    ] });
  S('gift_of_the_wild', 'Gift of the Wild', 8, { cls: 'druid', text: 'Verleiht Euren Dienern +2/+2 und <b>Taunt</b>.',
    play: (g, s) => { for (const m of g.board(s.owner)) { g.buff(m, { atk: 2, hp: 2 }); g.giveKw(m, 'taunt'); } } });
  M('cenarius', 'Cenarius', 9, 5, 8, { cls: 'druid', rarity: 'legendary', text: '<b>Choose One:</b> Verleiht Euren anderen Dienern +2/+2; oder ruft zwei Treants (2/2) mit <b>Taunt</b> herbei.',
    choose: [
      { name: 'Demigod\'s Favor', text: 'Eure anderen Diener erhalten +2/+2.', play: (g, s) => { for (const m of g.others(s)) g.buff(m, { atk: 2, hp: 2 }); } },
      { name: 'Shan\'do\'s Lesson', text: 'Ruft zwei Treants (2/2) mit <b>Taunt</b> herbei.', play: (g, s) => { g.summonNext(s, 't_treant_taunt'); g.summon(s.owner, 't_treant_taunt', g.pos(s)); } },
    ] });
  T('t_panther', 'Panther', 2, 3, 2, { cls: 'druid', race: 'beast' });
  T('t_treant', 'Treant', 1, 2, 2, { cls: 'druid' });
  T('t_treant_taunt', 'Treant', 1, 2, 2, { cls: 'druid', kw: ['taunt'], text: '<b>Taunt</b>' });
  T('t_treant_fon', 'Treant', 1, 2, 2, { cls: 'druid', kw: ['charge'], text: '<b>Charge</b>. Stirbt am Ende des Zuges.',
    triggers: { turnEnd: (g, s) => g.destroy(s) } });
  T('t_druid_cat', 'Druid of the Claw', 5, 4, 4, { cls: 'druid', race: 'beast', kw: ['charge'], text: '<b>Charge</b>' });
  T('t_druid_bear', 'Druid of the Claw', 5, 4, 6, { cls: 'druid', race: 'beast', kw: ['taunt'], text: '<b>Taunt</b>' });

  /* ===== Jäger ===== */
  S('bestial_wrath', 'Bestial Wrath', 1, { cls: 'hunter', rarity: 'epic', text: 'Verleiht einem befreundeten Beast +2 Angriff und <b>Immune</b> in diesem Zug.',
    target: { t: 'friendlyMinion', f: (g, s, t) => g.isRace(t, 'beast') },
    play: (g, s, t) => g.buff(t, { atk: 2, kw: ['immune'], expire: g.eot() }) });
  S('flare', 'Flare', 2, { cls: 'hunter', rarity: 'rare', text: 'Alle Diener verlieren <b>Stealth</b>. Zerstört alle feindlichen <b>Secrets</b>. Zieht eine Karte.',
    play: (g, s) => {
      for (const m of g.board()) g.loseStealth(m);
      const p = g.P(1 - s.owner);
      for (const id of p.secrets) g.ent(id).zone = 'grave';
      p.secrets = [];
      g.draw(s.owner);
    } });
  SEC('explosive_trap', 'Explosive Trap', 2, 'attack', (g, s, ev) => ev.defender === g.hero(s.owner),
    (g, s) => g.aoe(s, g.chars(1 - s.owner), g.spellDmg(s, 2)),
    { cls: 'hunter', text: '<b>Secret:</b> Wenn Euer Held angegriffen wird, verursacht $2 Schaden bei allen Feinden.' });
  SEC('freezing_trap', 'Freezing Trap', 2, 'attack', (g, s, ev) => g.isMinion(ev.attacker) && ev.attacker.owner !== s.owner,
    (g, s, ev) => g.bounce(ev.attacker, { cost: 2 }),
    { cls: 'hunter', text: '<b>Secret:</b> Wenn ein feindlicher Diener angreift, kehrt er auf die Hand seines Besitzers zurück und kostet (2) mehr.' });
  const misTargets = (g, ev) => g.chars().filter((c) => c !== ev.attacker && c !== ev.defender && !c.dead && !(g.isMinion(c) && c.owner !== ev.attacker.owner && g.has(c, 'stealth')));
  SEC('misdirection', 'Misdirection', 2, 'attack',
    (g, s, ev) => ev.defender === g.hero(s.owner) && misTargets(g, ev).length > 0,
    (g, s, ev) => { const t = g.pick(misTargets(g, ev)); if (t) ev.defender = t; },
    { cls: 'hunter', rarity: 'rare', text: '<b>Secret:</b> Wenn ein Charakter Euren Helden angreift, greift er stattdessen einen anderen zufälligen Charakter an.' });
  SEC('snipe', 'Snipe', 2, 'minionPlayed', (g, s, ev) => ev.player !== s.owner && g.inPlay(ev.minion),
    (g, s, ev) => g.damage(s, ev.minion, g.spellDmg(s, 4)),
    { cls: 'hunter', text: '<b>Secret:</b> Nachdem Euer Gegner einen Diener ausgespielt hat, verursacht $4 Schaden bei ihm.' });
  SEC('snake_trap', 'Snake Trap', 2, 'attack', (g, s, ev) => g.isMinion(ev.defender) && ev.defender.owner === s.owner && room(g, s),
    (g, s) => { for (let i = 0; i < 3; i++) g.summon(s.owner, 't_snake'); },
    { cls: 'hunter', rarity: 'epic', text: '<b>Secret:</b> Wenn einer Eurer Diener angegriffen wird, ruft drei Snakes (1/1) herbei.' });
  M('scavenging_hyena', 'Scavenging Hyena', 2, 2, 2, { cls: 'hunter', race: 'beast', text: 'Immer wenn ein befreundetes Beast stirbt, erhält dieser Diener +2/+1.',
    triggers: { death: (g, s, ev) => { if (ev.owner === s.owner && g.isRace(ev.minion, 'beast')) g.buff(s, { atk: 2, hp: 1 }); } } });
  S('deadly_shot', 'Deadly Shot', 3, { cls: 'hunter', text: 'Vernichtet einen zufälligen feindlichen Diener.',
    canPlay: (g, s) => g.board(1 - s.owner).length > 0, play: (g, s) => g.destroy(g.pick(g.board(1 - s.owner))) });
  W('eaglehorn_bow', 'Eaglehorn Bow', 3, 3, 2, { cls: 'hunter', rarity: 'rare', text: 'Immer wenn ein befreundetes <b>Secret</b> aufgedeckt wird, erhält diese Waffe +1 Haltbarkeit.',
    triggers: { secretRevealed: (g, s, ev) => { if (ev.player === s.owner) g.buff(s, { hp: 1 }); } } });
  S('unleash_the_hounds', 'Unleash the Hounds', 3, { cls: 'hunter', text: 'Ruft für jeden feindlichen Diener einen Hound (1/1) mit <b>Charge</b> herbei.',
    canPlay: (g, s) => g.board(1 - s.owner).length > 0 && room(g, s),
    play: (g, s) => { const n = g.board(1 - s.owner).length; for (let i = 0; i < n; i++) g.summon(s.owner, 't_hound'); } });
  S('explosive_shot', 'Explosive Shot', 5, { cls: 'hunter', rarity: 'rare', text: 'Verursacht $5 Schaden bei einem Diener und $2 Schaden bei benachbarten Dienern.', target: 'minion',
    play: (g, s, t) => { const a = g.adj(t); g.batch(() => { g.damage(s, t, g.spellDmg(s, 5)); for (const x of a) g.damage(s, x, g.spellDmg(s, 2)); }); } });
  M('savannah_highmane', 'Savannah Highmane', 6, 6, 5, { cls: 'hunter', race: 'beast', rarity: 'rare', text: '<b>Deathrattle:</b> Ruft zwei Hyenas (2/2) herbei.',
    deathrattle: (g, s, info) => { g.summon(s.owner, 't_hyena', info.pos); g.summon(s.owner, 't_hyena', info.pos); } });
  W('gladiators_longbow', 'Gladiator\'s Longbow', 7, 5, 2, { cls: 'hunter', rarity: 'epic', attackImmune: true, text: 'Euer Held ist <b>Immune</b>, während er angreift.' });
  M('king_krush', 'King Krush', 9, 8, 8, { cls: 'hunter', race: 'beast', rarity: 'legendary', kw: ['charge'], text: '<b>Charge</b>' });
  T('t_snake', 'Snake', 0, 1, 1, { cls: 'hunter', race: 'beast' });
  T('t_hound', 'Hound', 1, 1, 1, { cls: 'hunter', race: 'beast', kw: ['charge'], text: '<b>Charge</b>' });
  T('t_hyena', 'Hyena', 2, 2, 2, { cls: 'hunter', race: 'beast' });

  /* ===== Magier ===== */
  S('ice_lance', 'Ice Lance', 1, { cls: 'mage', text: 'Wirkt <b>Freeze</b> auf einen Charakter. Ist er bereits <b>Frozen</b>, verursacht stattdessen $4 Schaden.', target: 'char',
    play: (g, s, t) => { if (t.frozen) g.damage(s, t, g.spellDmg(s, 4)); else g.freeze(t); } });
  M('mana_wyrm', 'Mana Wyrm', 1, 1, 3, { cls: 'mage', text: 'Immer wenn Ihr einen Zauber wirkt, erhält dieser Diener +1 Angriff.',
    triggers: { castSpell: (g, s, ev) => { if (ev.player === s.owner) g.buff(s, { atk: 1 }); } } });
  M('sorcerers_apprentice', 'Sorcerer\'s Apprentice', 2, 3, 2, { cls: 'mage', text: 'Eure Zauber kosten (1) weniger.',
    costAura: (g, s, c) => (c.owner === s.owner && c.zone === 'hand' && g.def(c).type === 'spell' ? -1 : 0) });
  SEC('counterspell', 'Counterspell', 3, 'castSpell', (g, s, ev) => ev.player !== s.owner,
    (g, s, ev) => { ev.countered = true; g.log('Der Zauber wurde gekontert!'); },
    { cls: 'mage', rarity: 'rare', text: '<b>Secret:</b> Wenn Euer Gegner einen Zauber wirkt, wird er <b>gekontert</b>.' });
  SEC('ice_barrier', 'Ice Barrier', 3, 'attack', (g, s, ev) => ev.defender === g.hero(s.owner),
    (g, s) => g.gainArmor(s.owner, 8), { cls: 'mage', text: '<b>Secret:</b> Wenn Euer Held angegriffen wird, erhält er 8 Rüstung.' });
  SEC('mirror_entity', 'Mirror Entity', 3, 'minionPlayed', (g, s, ev) => ev.player !== s.owner && g.inPlay(ev.minion) && room(g, s),
    (g, s, ev) => g.copyMinion(ev.minion, s.owner), { cls: 'mage', text: '<b>Secret:</b> Nachdem Euer Gegner einen Diener ausgespielt hat, ruft Ihr eine Kopie davon herbei.' });
  SEC('spellbender', 'Spellbender', 3, 'castSpell', (g, s, ev) => ev.player !== s.owner && ev.target && g.isMinion(ev.target) && room(g, s),
    (g, s, ev) => { const b = g.summon(s.owner, 't_spellbender'); if (b) ev.target = b; },
    { cls: 'mage', rarity: 'epic', text: '<b>Secret:</b> Wenn ein Feind einen Zauber auf einen Diener wirkt, ruft einen Diener (1/3) herbei, der das neue Ziel wird.' });
  SEC('vaporize', 'Vaporize', 3, 'attack', (g, s, ev) => g.isMinion(ev.attacker) && ev.defender === g.hero(s.owner),
    (g, s, ev) => g.destroy(ev.attacker), { cls: 'mage', rarity: 'rare', text: '<b>Secret:</b> Wenn ein Diener Euren Helden angreift, wird er vernichtet.' });
  SEC('ice_block', 'Ice Block', 3, 'never', null, null,
    { cls: 'mage', rarity: 'epic', text: '<b>Secret:</b> Wenn Euer Held tödlichen Schaden erleiden würde, wird dieser verhindert und er ist in diesem Zug <b>Immune</b>.' });
  HS.lib.E('e_kirin_tor', { type: 'effect',
    costMod: (g, ef, c) => (c.owner === ef.owner && c.zone === 'hand' && g.def(c).secret ? { set: 0 } : null),
    triggers: { secretPlayed: (g, ef, ev) => { if (ev.player === ef.owner) g.removeEffect(ef); } } });
  M('kirin_tor_mage', 'Kirin Tor Mage', 3, 4, 3, { cls: 'mage', rarity: 'rare', text: '<b>Battlecry:</b> Euer nächstes <b>Secret</b> in diesem Zug kostet (0).',
    play: (g, s) => g.addEffect(s.owner, 'e_kirin_tor', { expire: g.eot() }) });
  S('cone_of_cold', 'Cone of Cold', 4, { cls: 'mage', text: 'Wirkt <b>Freeze</b> auf einen Diener und die benachbarten Diener und verursacht $1 Schaden bei ihnen.', target: 'minion',
    play: (g, s, t) => { const ts = [t].concat(g.adj(t)); g.aoe(s, ts, g.spellDmg(s, 1)); for (const x of ts) g.freeze(x); } });
  M('ethereal_arcanist', 'Ethereal Arcanist', 4, 3, 3, { cls: 'mage', rarity: 'rare', text: 'Wenn Ihr ein <b>Secret</b> kontrolliert, erhält dieser Diener am Ende Eures Zuges +2/+2.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner && g.P(s.owner).secrets.length) g.buff(s, { atk: 2, hp: 2 }); } } });
  S('blizzard', 'Blizzard', 6, { cls: 'mage', rarity: 'rare', text: 'Verursacht $2 Schaden bei allen feindlichen Dienern und wirkt <b>Freeze</b> auf sie.',
    play: (g, s) => { const b = g.board(1 - s.owner); g.aoe(s, b, g.spellDmg(s, 2)); for (const m of b) g.freeze(m); } });
  M('archmage_antonidas', 'Archmage Antonidas', 7, 5, 7, { cls: 'mage', rarity: 'legendary', text: 'Immer wenn Ihr einen Zauber wirkt, erhaltet Ihr einen „Fireball“ auf die Hand.',
    triggers: { castSpell: (g, s, ev) => { if (ev.player === s.owner) g.addCard(s.owner, 'fireball'); } } });
  S('pyroblast', 'Pyroblast', 10, { cls: 'mage', rarity: 'epic', text: 'Verursacht $10 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 10)) });
  T('t_spellbender', 'Spellbender', 1, 1, 3, { cls: 'mage' });

  /* ===== Paladin ===== */
  HS.lib.E('e_blessing_of_wisdom', { triggers: { attack: (g, e, ev, x) => { if (ev.attacker === e) g.draw(x.by); } } });
  S('blessing_of_wisdom', 'Blessing of Wisdom', 1, { cls: 'paladin', text: 'Wählt einen Diener. Immer wenn er angreift, zieht Ihr eine Karte.', target: 'minion',
    play: (g, s, t) => g.buff(t, { card: 'e_blessing_of_wisdom', by: s.owner }) });
  SEC('eye_for_an_eye', 'Eye for an Eye', 1, 'damage', (g, s, ev) => ev.target === g.hero(s.owner),
    (g, s, ev) => g.damage(s, g.hero(1 - s.owner), g.spellDmg(s, ev.amount)),
    { cls: 'paladin', text: '<b>Secret:</b> Wenn Euer Held Schaden erleidet, wird dem feindlichen Helden genauso viel Schaden zugefügt.' });
  SEC('noble_sacrifice', 'Noble Sacrifice', 1, 'attack', (g, s, ev) => ev.attacker.owner !== s.owner && room(g, s),
    (g, s, ev) => { const d = g.summon(s.owner, 't_defender'); if (d) ev.defender = d; },
    { cls: 'paladin', text: '<b>Secret:</b> Wenn ein Feind angreift, ruft einen Defender (2/1) herbei, der das neue Ziel wird.' });
  SEC('redemption', 'Redemption', 1, 'death', (g, s, ev) => ev.owner === s.owner && room(g, s),
    (g, s, ev) => { const m = g.newEnt(ev.minion.card, s.owner, 'aside'); m.damage = Math.max(0, (g.def(m).hp || 0) - 1); g.place(m, ev.pos, true); },
    { cls: 'paladin', text: '<b>Secret:</b> Wenn ein befreundeter Diener stirbt, wird er mit 1 Leben wiederbelebt.' });
  SEC('repentance', 'Repentance', 1, 'minionPlayed', (g, s, ev) => ev.player !== s.owner && g.inPlay(ev.minion),
    (g, s, ev) => g.buff(ev.minion, { setHp: 1 }),
    { cls: 'paladin', text: '<b>Secret:</b> Nachdem Euer Gegner einen Diener ausgespielt hat, wird dessen Leben auf 1 gesetzt.' });
  S('equality', 'Equality', 2, { cls: 'paladin', rarity: 'rare', text: 'Setzt das Leben ALLER Diener auf 1.',
    play: (g, s) => { for (const m of g.board()) g.buff(m, { setHp: 1 }); } });
  M('argent_protector', 'Argent Protector', 2, 2, 2, { cls: 'paladin', text: '<b>Battlecry:</b> Verleiht einem befreundeten Diener <b>Divine Shield</b>.',
    target: 'friendlyMinion', play: (g, s, t) => { if (t) g.giveKw(t, 'divineShield'); } });
  M('aldor_peacekeeper', 'Aldor Peacekeeper', 3, 3, 3, { cls: 'paladin', rarity: 'rare', text: '<b>Battlecry:</b> Setzt den Angriff eines feindlichen Dieners auf 1.',
    target: 'enemyMinion', play: (g, s, t) => { if (t) g.buff(t, { setAtk: 1 }); } });
  S('divine_favor', 'Divine Favor', 3, { cls: 'paladin', rarity: 'rare', text: 'Zieht Karten, bis Ihr so viele Karten habt wie Euer Gegner.',
    play: (g, s) => { const n = g.P(1 - s.owner).hand.length - g.P(s.owner).hand.length; if (n > 0) g.draw(s.owner, n); } });
  W('sword_of_justice', 'Sword of Justice', 3, 1, 5, { cls: 'paladin', rarity: 'epic', text: 'Nachdem Ihr einen Diener herbeigerufen habt, erhält er +1/+1 und diese Waffe verliert 1 Haltbarkeit.',
    triggers: { afterSummon: (g, s, ev) => { if (ev.minion.owner === s.owner && g.hp(s) > 0) { g.buff(ev.minion, { atk: 1, hp: 1 }); s.damage++; } } } });
  S('blessed_champion', 'Blessed Champion', 5, { cls: 'paladin', rarity: 'rare', text: 'Verdoppelt den Angriff eines Dieners.', target: 'minion',
    play: (g, s, t) => g.buff(t, { atk: g.atk(t) }) });
  S('holy_wrath', 'Holy Wrath', 5, { cls: 'paladin', rarity: 'rare', text: 'Zieht eine Karte und verursacht Schaden in Höhe ihrer Kosten.', target: 'char',
    play: (g, s, t) => { const d = g.draw(s.owner)[0]; if (d) g.damage(s, t, g.spellDmg(s, g.def(d).cost)); } });
  S('avenging_wrath', 'Avenging Wrath', 6, { cls: 'paladin', rarity: 'epic', text: 'Verursacht $8 Schaden, zufällig auf alle Feinde verteilt.',
    play: (g, s) => g.splitDamage(s, g.spellDmg(s, 8), () => g.chars(1 - s.owner)) });
  S('lay_on_hands', 'Lay on Hands', 8, { cls: 'paladin', rarity: 'epic', text: 'Stellt #8 Leben wieder her. Zieht 3 Karten.', target: 'char',
    play: (g, s, t) => { g.heal(s, t, g.spellHeal(s, 8)); g.draw(s.owner, 3); } });
  M('tirion_fordring', 'Tirion Fordring', 8, 6, 6, { cls: 'paladin', rarity: 'legendary', kw: ['divineShield', 'taunt'], text: '<b>Divine Shield</b>, <b>Taunt</b>. <b>Deathrattle:</b> Rüstet einen Ashbringer (5/3) aus.',
    deathrattle: (g, s) => g.equip(s.owner, 't_ashbringer') });
  T('t_defender', 'Defender', 1, 2, 1, { cls: 'paladin' });
  W('t_ashbringer', 'Ashbringer', 5, 5, 3, { cls: 'paladin', set: 'token', collectible: false });

  /* ===== Priester ===== */
  S('circle_of_healing', 'Circle of Healing', 0, { cls: 'priest', text: 'Stellt bei ALLEN Dienern #4 Leben wieder her.',
    play: (g, s) => g.aoeHeal(s, g.board(), g.spellHeal(s, 4)) });
  S('silence', 'Silence', 0, { cls: 'priest', text: 'Wirkt <b>Silence</b> auf einen Diener.', target: 'minion', play: (g, s, t) => g.silence(t) });
  S('inner_fire', 'Inner Fire', 1, { cls: 'priest', text: 'Setzt den Angriff eines Dieners auf den Wert seines Lebens.', target: 'minion',
    play: (g, s, t) => g.buff(t, { setAtk: g.hp(t) }) });
  M('lightwell', 'Lightwell', 2, 0, 5, { cls: 'priest', rarity: 'rare', text: 'Stellt zu Beginn Eures Zuges bei einem verletzten befreundeten Charakter 3 Leben wieder her.',
    triggers: { turnStart: (g, s, ev) => { if (ev.player !== s.owner) return; const t = g.pick(g.chars(s.owner).filter((c) => c.damage > 0)); if (t) g.heal(s, t, 3); } } });
  S('thoughtsteal', 'Thoughtsteal', 3, { cls: 'priest', text: 'Kopiert 2 Karten aus dem Deck Eures Gegners und legt sie auf Eure Hand.',
    play: (g, s) => { for (const c of g.pickN(g.deck(1 - s.owner), 2)) g.addCard(s.owner, c.card); } });
  S('shadowform', 'Shadowform', 3, { cls: 'priest', rarity: 'epic', text: 'Eure Heldenfähigkeit wird zu „Verursacht 2 Schaden“. Ist sie das bereits, verursacht sie stattdessen 3 Schaden.',
    play: (g, s) => {
      const p = g.P(s.owner);
      const cur = g.power(s.owner).card;
      const next = cur === 'hp_mind_spike' || cur === 'hp_mind_shatter' ? 'hp_mind_shatter' : 'hp_mind_spike';
      g.ent(p.power).zone = 'grave';
      p.power = g.newEnt(next, s.owner, 'power').id;
      p.powerUses = 0;
    } });
  S('mass_dispel', 'Mass Dispel', 4, { cls: 'priest', rarity: 'rare', text: 'Wirkt <b>Silence</b> auf alle feindlichen Diener. Zieht eine Karte.',
    play: (g, s) => { for (const m of g.board(1 - s.owner)) g.silence(m); g.draw(s.owner); } });
  S('mindgames', 'Mindgames', 4, { cls: 'priest', rarity: 'epic', text: 'Legt eine Kopie eines zufälligen Dieners aus dem Deck Eures Gegners auf das Schlachtfeld.',
    canPlay: room,
    play: (g, s) => { const m = g.pick(g.deck(1 - s.owner).filter((c) => g.def(c).type === 'minion')); g.summon(s.owner, m ? m.card : 't_shadow_of_nothing'); } });
  HS.lib.E('e_shadow_madness', { triggers: { turnEnd: (g, e, ev, x) => { e.ench = e.ench.filter((y) => y !== x); if (e.owner !== x.orig) { g.control(e, x.orig); e.exhausted = false; } } } });
  S('shadow_madness', 'Shadow Madness', 4, { cls: 'priest', rarity: 'rare', text: 'Übernehmt bis zum Ende des Zuges die Kontrolle über einen feindlichen Diener mit 3 oder weniger Angriff.',
    target: { t: 'enemyMinion', f: (g, s, t) => g.atk(t) <= 3 }, canPlay: room,
    play: (g, s, t) => { const orig = t.owner; g.control(t, s.owner); if (t.owner === s.owner) { t.exhausted = false; g.buff(t, { card: 'e_shadow_madness', orig }); } } });
  M('lightspawn', 'Lightspawn', 4, 0, 5, { cls: 'priest', atkIsHp: true, text: 'Der Angriff dieses Dieners entspricht immer seinem Leben.' });
  M('auchenai_soulpriest', 'Auchenai Soulpriest', 4, 3, 5, { cls: 'priest', rarity: 'rare', text: 'Eure Karten und Fähigkeiten, die Leben wiederherstellen, verursachen stattdessen Schaden.' });
  S('holy_fire', 'Holy Fire', 6, { cls: 'priest', rarity: 'rare', text: 'Verursacht $5 Schaden. Stellt bei Eurem Helden #5 Leben wieder her.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 5)); g.heal(s, g.hero(s.owner), g.spellHeal(s, 5)); } });
  M('cabal_shadow_priest', 'Cabal Shadow Priest', 6, 4, 5, { cls: 'priest', rarity: 'epic', text: '<b>Battlecry:</b> Übernehmt die Kontrolle über einen feindlichen Diener mit 2 oder weniger Angriff.',
    target: { t: 'enemyMinion', f: (g, s, t) => g.atk(t) <= 2 }, play: (g, s, t) => { if (t) g.control(t, s.owner); } });
  M('temple_enforcer', 'Temple Enforcer', 6, 6, 6, { cls: 'priest', text: '<b>Battlecry:</b> Verleiht einem befreundeten Diener +3 Leben.',
    target: 'friendlyMinion', play: (g, s, t) => { if (t) g.buff(t, { hp: 3 }); } });
  M('prophet_velen', 'Prophet Velen', 7, 7, 7, { cls: 'priest', rarity: 'legendary', text: 'Verdoppelt den Schaden und die Heilung Eurer Zauber und Eurer Heldenfähigkeit.' });
  T('t_shadow_of_nothing', 'Shadow of Nothing', 0, 0, 1, { cls: 'priest' });

  /* ===== Schurke ===== */
  HS.lib.E('e_preparation', { type: 'effect',
    costMod: (g, ef, c) => (c.owner === ef.owner && c.zone === 'hand' && g.def(c).type === 'spell' ? -3 : 0),
    triggers: { cardPlayed: (g, ef, ev) => { if (ev.player === ef.owner && g.def(ev.card).type === 'spell') g.removeEffect(ef); } } });
  S('preparation', 'Preparation', 0, { cls: 'rogue', rarity: 'epic', text: 'Der nächste Zauber, den Ihr in diesem Zug wirkt, kostet (3) weniger.',
    play: (g, s) => g.addEffect(s.owner, 'e_preparation', { expire: g.eot() }) });
  S('shadowstep', 'Shadowstep', 0, { cls: 'rogue', text: 'Lasst einen befreundeten Diener auf Eure Hand zurückkehren. Er kostet (2) weniger.', target: 'friendlyMinion',
    play: (g, s, t) => g.bounce(t, { cost: -2 }) });
  S('cold_blood', 'Cold Blood', 1, { cls: 'rogue', text: 'Verleiht einem Diener +2 Angriff. <b>Combo:</b> Stattdessen +4 Angriff.', target: 'minion',
    play: (g, s, t, ctx) => g.buff(t, { atk: ctx.combo ? 4 : 2 }) });
  S('conceal', 'Conceal', 1, { cls: 'rogue', text: 'Verleiht Euren Dienern bis zu Eurem nächsten Zug <b>Stealth</b>.',
    play: (g, s) => { for (const m of g.board(s.owner)) g.buff(m, { kw: ['stealth'], expire: 'start:' + s.owner }); } });
  S('betrayal', 'Betrayal', 2, { cls: 'rogue', text: 'Ein feindlicher Diener fügt den benachbarten Dienern Schaden in Höhe seines Angriffs zu.', target: 'enemyMinion',
    play: (g, s, t) => { const a = g.atk(t); const adj = g.adj(t); g.batch(() => { for (const x of adj) g.damage(t, x, a); }); } });
  S('blade_flurry', 'Blade Flurry', 2, { cls: 'rogue', rarity: 'rare', text: 'Zerstört Eure Waffe und fügt allen Feinden Schaden in Höhe ihres Angriffs zu.',
    canPlay: (g, s) => !!g.weapon(s.owner),
    play: (g, s) => { const w = g.weapon(s.owner); if (!w) return; const n = g.spellDmg(s, g.atk(w)); g.destroy(w); g.aoe(s, g.chars(1 - s.owner), n); } });
  S('eviscerate', 'Eviscerate', 2, { cls: 'rogue', text: 'Verursacht $2 Schaden. <b>Combo:</b> Stattdessen $4 Schaden.', target: 'char',
    play: (g, s, t, ctx) => g.damage(s, t, g.spellDmg(s, ctx.combo ? 4 : 2)) });
  M('defias_ringleader', 'Defias Ringleader', 2, 2, 2, { cls: 'rogue', text: '<b>Combo:</b> Ruft einen Defias Bandit (2/1) herbei.',
    play: (g, s, t, ctx) => { if (ctx.combo) g.summonNext(s, 't_defias_bandit'); } });
  M('patient_assassin', 'Patient Assassin', 2, 1, 1, { cls: 'rogue', rarity: 'epic', kw: ['stealth', 'poison'], text: '<b>Stealth</b>. Vernichtet jeden Diener, dem dieser Diener Schaden zufügt.' });
  M('si7_agent', 'SI:7 Agent', 3, 3, 3, { cls: 'rogue', rarity: 'rare', text: '<b>Combo:</b> Verursacht 2 Schaden.',
    target: 'char', targetIf: (g, s, ctx) => ctx.combo, play: (g, s, t) => { if (t) g.damage(s, t, 2); } });
  HS.lib.E('e_headcrack', { type: 'effect', triggers: { turnEnd: (g, ef, ev) => { if (ev.player === ef.owner) { g.addCard(ef.owner, 'headcrack'); g.removeEffect(ef); } } } });
  S('headcrack', 'Headcrack', 3, { cls: 'rogue', rarity: 'rare', text: 'Verursacht $2 Schaden beim feindlichen Helden. <b>Combo:</b> Kehrt in Eurem nächsten Zug auf Eure Hand zurück.',
    play: (g, s, t, ctx) => { g.damage(s, g.hero(1 - s.owner), g.spellDmg(s, 2)); if (ctx.combo) g.addEffect(s.owner, 'e_headcrack'); } });
  W('perditions_blade', 'Perdition\'s Blade', 3, 2, 2, { cls: 'rogue', rarity: 'rare', text: '<b>Battlecry:</b> Verursacht 1 Schaden. <b>Combo:</b> Stattdessen 2 Schaden.',
    target: 'char', play: (g, s, t, ctx) => { if (t) g.damage(s, t, ctx.combo ? 2 : 1); } });
  M('edwin_vancleef', 'Edwin VanCleef', 3, 2, 2, { cls: 'rogue', rarity: 'legendary', text: '<b>Combo:</b> Erhält +2/+2 für jede Karte, die Ihr vorher in diesem Zug ausgespielt habt.',
    play: (g, s, t, ctx) => { const n = g.P(s.owner).played - 1; if (ctx.combo && n > 0) g.buff(s, { atk: 2 * n, hp: 2 * n }); } });
  M('master_of_disguise', 'Master of Disguise', 4, 4, 4, { cls: 'rogue', rarity: 'rare', text: '<b>Battlecry:</b> Verleiht einem befreundeten Diener <b>Stealth</b>.',
    target: 'friendlyMinion', play: (g, s, t) => { if (t) g.giveKw(t, 'stealth'); } });
  M('kidnapper', 'Kidnapper', 6, 5, 3, { cls: 'rogue', rarity: 'epic', text: '<b>Combo:</b> Lasst einen Diener auf die Hand seines Besitzers zurückkehren.',
    target: 'minion', targetIf: (g, s, ctx) => ctx.combo, play: (g, s, t) => { if (t) g.bounce(t); } });
  T('t_defias_bandit', 'Defias Bandit', 1, 2, 1, { cls: 'rogue' });

  /* ===== Schamane ===== */
  S('earth_shock', 'Earth Shock', 1, { cls: 'shaman', text: 'Wirkt <b>Silence</b> auf einen Diener und verursacht dann $1 Schaden bei ihm.', target: 'minion',
    play: (g, s, t) => { g.silence(t); g.damage(s, t, g.spellDmg(s, 1)); } });
  S('forked_lightning', 'Forked Lightning', 1, { cls: 'shaman', overload: 2, text: 'Verursacht $2 Schaden bei zwei zufälligen feindlichen Dienern. <b>Overload:</b> (2)',
    canPlay: (g, s) => g.board(1 - s.owner).length >= 2, play: (g, s) => g.aoe(s, g.pickN(g.board(1 - s.owner), 2), g.spellDmg(s, 2)) });
  S('lightning_bolt', 'Lightning Bolt', 1, { cls: 'shaman', overload: 1, text: 'Verursacht $3 Schaden. <b>Overload:</b> (1)', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 3)) });
  E('e_ancestral_spirit', { deathrattle: (g, e, info) => g.summon(e.owner, e.card, info.pos) });
  S('ancestral_spirit', 'Ancestral Spirit', 2, { cls: 'shaman', rarity: 'rare', text: 'Verleiht einem Diener „<b>Deathrattle:</b> Ruft diesen Diener erneut herbei.“', target: 'minion',
    play: (g, s, t) => g.buff(t, { card: 'e_ancestral_spirit' }) });
  M('dust_devil', 'Dust Devil', 1, 3, 1, { cls: 'shaman', overload: 2, kw: ['windfury'], text: '<b>Windfury</b>. <b>Overload:</b> (2)' });
  W('stormforged_axe', 'Stormforged Axe', 2, 2, 3, { cls: 'shaman', overload: 1, text: '<b>Overload:</b> (1)' });
  S('far_sight', 'Far Sight', 3, { cls: 'shaman', rarity: 'epic', text: 'Zieht eine Karte. Sie kostet (3) weniger.',
    play: (g, s) => { const d = g.draw(s.owner)[0]; if (d) d.ench.push({ cost: -3 }); } });
  S('feral_spirit', 'Feral Spirit', 3, { cls: 'shaman', rarity: 'rare', overload: 2, text: 'Ruft zwei Spirit Wolves (2/3) mit <b>Taunt</b> herbei. <b>Overload:</b> (2)',
    canPlay: room, play: (g, s) => { g.summon(s.owner, 't_spirit_wolf'); g.summon(s.owner, 't_spirit_wolf'); } });
  S('lava_burst', 'Lava Burst', 3, { cls: 'shaman', rarity: 'rare', overload: 2, text: 'Verursacht $5 Schaden. <b>Overload:</b> (2)', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 5)) });
  S('lightning_storm', 'Lightning Storm', 3, { cls: 'shaman', rarity: 'rare', overload: 2, text: 'Verursacht $2–$3 Schaden bei allen feindlichen Dienern. <b>Overload:</b> (2)',
    play: (g, s) => { const b = g.board(1 - s.owner); g.batch(() => { for (const m of b) g.damage(s, m, g.spellDmg(s, 2 + g.rand(2))); }); } });
  M('mana_tide_totem', 'Mana Tide Totem', 3, 0, 3, { cls: 'shaman', race: 'totem', rarity: 'rare', text: 'Zieht am Ende Eures Zuges eine Karte.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) g.draw(s.owner); } } });
  M('unbound_elemental', 'Unbound Elemental', 3, 2, 4, { cls: 'shaman', text: 'Immer wenn Ihr eine Karte mit <b>Overload</b> ausspielt, erhält dieser Diener +1/+1.',
    triggers: { cardPlayed: (g, s, ev) => { if (ev.player === s.owner && g.def(ev.card).overload) g.buff(s, { atk: 1, hp: 1 }); } } });
  M('earth_elemental', 'Earth Elemental', 5, 7, 8, { cls: 'shaman', rarity: 'epic', overload: 3, kw: ['taunt'], text: '<b>Taunt</b>. <b>Overload:</b> (3)' });
  W('doomhammer', 'Doomhammer', 5, 2, 8, { cls: 'shaman', rarity: 'epic', overload: 2, kw: ['windfury'], text: '<b>Windfury</b>. <b>Overload:</b> (2)' });
  M('alakir_the_windlord', 'Al\'Akir the Windlord', 8, 3, 5, { cls: 'shaman', rarity: 'legendary', kw: ['windfury', 'charge', 'divineShield', 'taunt'], text: '<b>Windfury</b>, <b>Charge</b>, <b>Divine Shield</b>, <b>Taunt</b>' });
  T('t_spirit_wolf', 'Spirit Wolf', 2, 2, 3, { cls: 'shaman', kw: ['taunt'], text: '<b>Taunt</b>' });

  /* ===== Hexenmeister ===== */
  E('e_power_overwhelming', { triggers: { turnEnd: (g, e) => g.destroy(e) } });
  S('power_overwhelming', 'Power Overwhelming', 1, { cls: 'warlock', text: 'Verleiht einem befreundeten Diener +4/+4. Er stirbt am Ende des Zuges.', target: 'friendlyMinion',
    play: (g, s, t) => g.buff(t, { atk: 4, hp: 4, card: 'e_power_overwhelming' }) });
  M('flame_imp', 'Flame Imp', 1, 3, 2, { cls: 'warlock', race: 'demon', text: '<b>Battlecry:</b> Verursacht 3 Schaden bei Eurem Helden.',
    play: (g, s) => g.damage(s, g.hero(s.owner), 3) });
  M('blood_imp', 'Blood Imp', 1, 0, 1, { cls: 'warlock', race: 'demon', kw: ['stealth'], text: '<b>Stealth</b>. Verleiht am Ende Eures Zuges einem anderen zufälligen befreundeten Diener +1 Leben.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) { const t = g.pick(g.others(s)); if (t) g.buff(t, { hp: 1 }); } } } });
  S('demonfire', 'Demonfire', 2, { cls: 'warlock', text: 'Verursacht $2 Schaden bei einem Diener. Ist es ein befreundeter Demon, erhält er stattdessen +2/+2.', target: 'minion',
    play: (g, s, t) => { if (t.owner === s.owner && g.isRace(t, 'demon')) g.buff(t, { atk: 2, hp: 2 }); else g.damage(s, t, g.spellDmg(s, 2)); } });
  S('sense_demons', 'Sense Demons', 3, { cls: 'warlock', text: 'Legt 2 zufällige Demons aus Eurem Deck auf Eure Hand.',
    play: (g, s) => {
      const ds = g.pickN(g.deck(s.owner).filter((c) => g.def(c).type === 'minion' && g.isRace(c, 'demon')), 2);
      for (let i = 0; i < 2; i++) {
        const d = ds[i];
        if (!d) { g.addCard(s.owner, 't_worthless_imp'); continue; }
        g.removeFromDeck(d);
        if (g.P(s.owner).hand.length < 10) { d.zone = 'hand'; g.P(s.owner).hand.push(d.id); } else d.zone = 'grave';
      }
    } });
  M('void_terror', 'Void Terror', 3, 3, 3, { cls: 'warlock', race: 'demon', rarity: 'rare', positional: true, text: '<b>Battlecry:</b> Vernichtet die benachbarten Diener und erhält deren Angriff und Leben.',
    play: (g, s) => { let a = 0, h = 0; for (const m of g.adj(s)) { a += g.atk(m); h += g.hp(m); g.destroy(m); } if (a || h) g.buff(s, { atk: a, hp: h }); } });
  M('felguard', 'Felguard', 3, 3, 5, { cls: 'warlock', race: 'demon', rarity: 'rare', kw: ['taunt'], text: '<b>Taunt</b>. <b>Battlecry:</b> Zerstört einen Eurer Manakristalle.',
    play: (g, s) => { const p = g.P(s.owner); p.maxMana = Math.max(0, p.maxMana - 1); p.mana = Math.min(p.mana, p.maxMana); } });
  S('shadowflame', 'Shadowflame', 4, { cls: 'warlock', rarity: 'rare', text: 'Vernichtet einen befreundeten Diener und fügt allen feindlichen Dienern Schaden in Höhe seines Angriffs zu.', target: 'friendlyMinion',
    play: (g, s, t) => { const a = g.atk(t); g.destroy(t); g.aoe(s, g.board(1 - s.owner), g.spellDmg(s, a)); } });
  M('pit_lord', 'Pit Lord', 4, 5, 6, { cls: 'warlock', race: 'demon', rarity: 'epic', text: '<b>Battlecry:</b> Verursacht 5 Schaden bei Eurem Helden.',
    play: (g, s) => g.damage(s, g.hero(s.owner), 5) });
  M('summoning_portal', 'Summoning Portal', 4, 0, 4, { cls: 'warlock', text: 'Eure Diener kosten (2) weniger, aber nicht weniger als (1).',
    costAura: (g, s, c) => (c.owner === s.owner && c.zone === 'hand' && g.def(c).type === 'minion' ? { delta: -2, min: 1 } : null) });
  S('bane_of_doom', 'Bane of Doom', 5, { cls: 'warlock', rarity: 'epic', text: 'Verursacht $2 Schaden. Stirbt das Ziel dadurch, ruft einen zufälligen Demon herbei.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 2)); if (g.hp(t) <= 0 || t.dead) g.summon(s.owner, g.randomCard((c) => c.type === 'minion' && c.race === 'demon')); } });
  M('doomguard', 'Doomguard', 5, 5, 7, { cls: 'warlock', race: 'demon', rarity: 'rare', kw: ['charge'], text: '<b>Charge</b>. <b>Battlecry:</b> Werft zwei zufällige Karten ab.',
    play: (g, s) => { g.discardRandom(s.owner); g.discardRandom(s.owner); } });
  S('siphon_soul', 'Siphon Soul', 6, { cls: 'warlock', rarity: 'rare', text: 'Vernichtet einen Diener. Stellt bei Eurem Helden #3 Leben wieder her.', target: 'minion',
    play: (g, s, t) => { g.destroy(t); g.heal(s, g.hero(s.owner), g.spellHeal(s, 3)); } });
  S('twisting_nether', 'Twisting Nether', 8, { cls: 'warlock', rarity: 'epic', text: 'Vernichtet alle Diener.',
    play: (g, s) => { for (const m of g.board()) g.destroy(m); } });
  M('lord_jaraxxus', 'Lord Jaraxxus', 9, 3, 15, { cls: 'warlock', race: 'demon', rarity: 'legendary', text: '<b>Battlecry:</b> Vernichtet Euren Helden und ersetzt ihn durch Lord Jaraxxus.',
    play: (g, s) => {
      g.removeFromBoard(s);
      s.zone = 'grave';
      HS.replaceHero(g, s.owner, 't_jaraxxus_hero', 'hp_inferno');
      g.equip(s.owner, 't_blood_fury');
    } });
  T('t_worthless_imp', 'Worthless Imp', 1, 1, 1, { cls: 'warlock', race: 'demon' });
  W('t_blood_fury', 'Blood Fury', 3, 3, 8, { cls: 'warlock', set: 'token', collectible: false });

  /* ===== Krieger ===== */
  S('inner_rage', 'Inner Rage', 0, { cls: 'warrior', text: 'Verursacht $1 Schaden bei einem Diener und verleiht ihm +2 Angriff.', target: 'minion',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 1)); g.buff(t, { atk: 2 }); } });
  S('shield_slam', 'Shield Slam', 1, { cls: 'warrior', rarity: 'epic', text: 'Fügt einem Diener 1 Schaden für jeden Punkt Rüstung zu, den Ihr habt.', target: 'minion',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, g.hero(s.owner).armor)) });
  S('upgrade', 'Upgrade!', 1, { cls: 'warrior', rarity: 'rare', text: 'Habt Ihr eine Waffe, erhält sie +1/+1. Rüstet anderenfalls eine Waffe (1/3) aus.',
    play: (g, s) => { const w = g.weapon(s.owner); if (w) g.buff(w, { atk: 1, hp: 1 }); else g.equip(s.owner, 't_heavy_axe'); } });
  S('battle_rage', 'Battle Rage', 2, { cls: 'warrior', text: 'Zieht eine Karte für jeden verletzten befreundeten Charakter.',
    play: (g, s) => { const n = g.chars(s.owner).filter((c) => c.damage > 0).length; if (n) g.draw(s.owner, n); } });
  S('commanding_shout', 'Commanding Shout', 2, { cls: 'warrior', rarity: 'rare', text: 'Das Leben Eurer Diener kann in diesem Zug nicht unter 1 fallen. Zieht eine Karte.',
    play: (g, s) => { g.addEffect(s.owner, 'e_commanding_shout', { expire: g.eot() }); g.draw(s.owner); } });
  S('rampage', 'Rampage', 2, { cls: 'warrior', text: 'Verleiht einem verletzten Diener +3/+3.', target: { t: 'minion', f: (g, s, t) => t.damage > 0 },
    play: (g, s, t) => g.buff(t, { atk: 3, hp: 3 }) });
  S('slam', 'Slam', 2, { cls: 'warrior', text: 'Verursacht $2 Schaden bei einem Diener. Überlebt er, zieht Ihr eine Karte.', target: 'minion',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 2)); if (g.hp(t) > 0 && !t.dead) g.draw(s.owner); } });
  M('armorsmith', 'Armorsmith', 2, 1, 4, { cls: 'warrior', rarity: 'rare', text: 'Immer wenn ein befreundeter Diener Schaden erleidet, erhaltet Ihr 1 Rüstung.',
    triggers: { damage: (g, s, ev) => { if (g.isMinion(ev.target) && ev.target.owner === s.owner) g.gainArmor(s.owner, 1); } } });
  M('cruel_taskmaster', 'Cruel Taskmaster', 2, 2, 2, { cls: 'warrior', text: '<b>Battlecry:</b> Verursacht 1 Schaden bei einem Diener und verleiht ihm +2 Angriff.',
    target: 'minion', play: (g, s, t) => { if (t) { g.damage(s, t, 1); g.buff(t, { atk: 2 }); } } });
  M('frothing_berserker', 'Frothing Berserker', 3, 2, 4, { cls: 'warrior', rarity: 'rare', text: 'Immer wenn ein Diener Schaden erleidet, erhält dieser Diener +1 Angriff.',
    triggers: { damage: (g, s, ev) => { if (g.isMinion(ev.target)) g.buff(s, { atk: 1 }); } } });
  M('arathi_weaponsmith', 'Arathi Weaponsmith', 4, 3, 3, { cls: 'warrior', text: '<b>Battlecry:</b> Rüstet eine Waffe (2/2) aus.',
    play: (g, s) => g.equip(s.owner, 't_battle_axe') });
  S('mortal_strike', 'Mortal Strike', 4, { cls: 'warrior', rarity: 'rare', text: 'Verursacht $4 Schaden. Habt Ihr 12 Leben oder weniger, stattdessen $6 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, g.hp(g.hero(s.owner)) <= 12 ? 6 : 4)) });
  S('brawl', 'Brawl', 5, { cls: 'warrior', rarity: 'epic', text: 'Vernichtet alle Diener bis auf einen (zufällig gewählt).',
    canPlay: (g) => g.board().length >= 2,
    play: (g) => { const all = g.board(); const keep = g.pick(all); for (const m of all) if (m !== keep) g.destroy(m); } });
  W('gorehowl', 'Gorehowl', 7, 7, 1, { cls: 'warrior', rarity: 'epic', gorehowl: true, text: 'Greift Euer Held einen Diener an, verliert diese Waffe 1 Angriff statt 1 Haltbarkeit.' });
  M('grommash_hellscream', 'Grommash Hellscream', 8, 4, 9, { cls: 'warrior', rarity: 'legendary', kw: ['charge'], enrage: { atk: 6 }, text: '<b>Charge</b>. <b>Enrage:</b> +6 Angriff.' });
  W('t_heavy_axe', 'Heavy Axe', 1, 1, 3, { cls: 'warrior', set: 'token', collectible: false });
  W('t_battle_axe', 'Battle Axe', 1, 2, 2, { cls: 'warrior', set: 'token', collectible: false });
  void R; void TS;
})();
