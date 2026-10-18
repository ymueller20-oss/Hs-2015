/* Der Schwarzfels */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : global;
  const HS = root.HS;
  const { M, S, T } = HS.lib;
  HS.setSet('brm');
  const L = 'legendary';
  const died = (g) => -g.s.diedThisTurn.length;

  M('dragon_egg', 'Drachenei', 1, 0, 2, { rarity: 'rare', text: 'Immer wenn dieser Diener Schaden erleidet, ruft einen Schwarzen Welpen (2/1) herbei.',
    triggers: { damage: (g, s, ev) => { if (ev.target === s) g.summonNext(s, 't_black_whelp'); } } });
  M('blackwing_technician', 'Techniker des Pechschwingenhorts', 3, 2, 4, { text: '<b>Kampfschrei:</b> Habt Ihr einen Drachen auf der Hand, erhält dieser Diener +1/+1.',
    play: (g, s) => { if (g.holding(s.owner, 'dragon')) g.buff(s, { atk: 1, hp: 1 }); } });
  M('dragonkin_sorcerer', 'Drachkinzauberer', 4, 3, 5, { race: 'dragon', text: 'Immer wenn Ihr einen Zauber auf diesen Diener wirkt, erhält er +1/+1.',
    triggers: { spellTarget: (g, s, ev) => { if (ev.target === s) g.buff(s, { atk: 1, hp: 1 }); } } });
  M('hungry_dragon', 'Hungriger Drache', 4, 5, 6, { race: 'dragon', text: '<b>Kampfschrei:</b> Ruft einen zufälligen Diener mit Kosten von (1) für Euren Gegner herbei.',
    play: (g, s) => g.summon(1 - s.owner, g.randomCard((c) => c.type === 'minion' && c.cost === 1)) });
  M('grim_patron', 'Grimmiger Gast', 5, 3, 3, { rarity: 'rare', text: 'Immer wenn dieser Diener Schaden erleidet und überlebt, ruft einen weiteren Grimmigen Gast herbei.',
    triggers: { damage: (g, s, ev) => { if (ev.target === s && g.hp(s) > 0 && !s.dead) g.summonNext(s, 'grim_patron'); } } });
  M('blackwing_corruptor', 'Verderber des Pechschwingenhorts', 5, 5, 4, { text: '<b>Kampfschrei:</b> Habt Ihr einen Drachen auf der Hand, verursacht 3 Schaden.',
    target: 'char', targetIf: (g, s) => g.holding(s.owner, 'dragon'), play: (g, s, t) => { if (t) g.damage(s, t, 3); } });
  M('drakonid_crusher', 'Drakonidenzermalmer', 6, 6, 6, { race: 'dragon', text: '<b>Kampfschrei:</b> Hat Euer Gegner 15 Leben oder weniger, erhält dieser Diener +3/+3.',
    play: (g, s) => { if (g.hp(g.hero(1 - s.owner)) <= 15) g.buff(s, { atk: 3, hp: 3 }); } });
  M('volcanic_drake', 'Vulkanischer Drache', 6, 6, 4, { race: 'dragon', text: 'Kostet (1) weniger für jeden Diener, der in diesem Zug gestorben ist.', selfCost: died });
  M('emperor_thaurissan', 'Imperator Thaurissan', 6, 5, 5, { rarity: L, text: 'Die Karten auf Eurer Hand kosten am Ende Eures Zuges (1) weniger.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) for (const c of g.hand(s.owner)) c.ench.push({ cost: -1 }); } } });
  M('rend_blackhand', 'Rend Schwarzfaust', 7, 8, 4, { rarity: L, text: '<b>Kampfschrei:</b> Habt Ihr einen Drachen auf der Hand, vernichtet einen legendären Diener.',
    target: { t: 'minion', f: (g, s, t) => g.def(t).rarity === 'legendary' }, targetIf: (g, s) => g.holding(s.owner, 'dragon'),
    play: (g, s, t) => { if (t) g.destroy(t); } });
  M('chromaggus', 'Chromaggus', 8, 6, 8, { race: 'dragon', rarity: L, text: 'Immer wenn Ihr eine Karte zieht, erhaltet Ihr eine weitere Kopie davon auf die Hand.',
    triggers: { draw: (g, s, ev) => { if (ev.player === s.owner && ev.card.zone === 'hand') g.addCard(s.owner, ev.card.card); } } });
  M('nefarian', 'Nefarian', 9, 8, 8, { race: 'dragon', rarity: L, text: '<b>Kampfschrei:</b> Erhaltet 2 zufällige Zauber aus der Klasse Eures Gegners auf die Hand.',
    play: (g, s) => { const cls = g.P(1 - s.owner).cls; for (let i = 0; i < 2; i++) g.addCard(s.owner, g.randomCard((c) => c.type === 'spell' && c.cls === cls)); } });
  M('majordomo_executus', 'Majordomus Exekutus', 9, 9, 7, { rarity: L, text: '<b>Todesröcheln:</b> Ersetzt Euren Helden durch Ragnaros den Feuerfürsten.',
    deathrattle: (g, s) => HS.replaceHero(g, s.owner, 't_ragnaros_hero', 'hp_die_insect') });

  /* Klassenkarten */
  M('druid_of_the_flame', 'Druide der Flamme', 3, 2, 2, { cls: 'druid', text: '<b>Wählt aus:</b> Verwandelt sich in einen Diener (5/2); oder in einen Diener (2/5).',
    choose: [
      { name: 'Feuerkatze', text: 'Verwandelt sich in einen Diener (5/2).', play: (g, s) => g.transform(s, 't_flame_cat') },
      { name: 'Feuerfalke', text: 'Verwandelt sich in einen Diener (2/5).', play: (g, s) => g.transform(s, 't_flame_bird') },
    ] });
  M('volcanic_lumberer', 'Vulkanischer Holzfäller', 9, 7, 8, { cls: 'druid', rarity: 'rare', kw: ['taunt'], text: '<b>Spott</b>. Kostet (1) weniger für jeden Diener, der in diesem Zug gestorben ist.', selfCost: died });
  S('quick_shot', 'Schneller Schuss', 2, { cls: 'hunter', text: 'Verursacht $3 Schaden. Ist Eure Hand leer, zieht Ihr eine Karte.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 3)); if (!g.P(s.owner).hand.length) g.draw(s.owner); } });
  M('core_rager', 'Kernwüterich', 4, 4, 4, { cls: 'hunter', race: 'beast', rarity: 'rare', text: '<b>Kampfschrei:</b> Ist Eure Hand leer, erhält dieser Diener +3/+3.',
    play: (g, s) => { if (!g.P(s.owner).hand.length) g.buff(s, { atk: 3, hp: 3 }); } });
  M('flamewaker', 'Flammenwirker', 3, 2, 4, { cls: 'mage', rarity: 'rare', text: 'Nachdem Ihr einen Zauber gewirkt habt, werden 2 Schaden zufällig auf alle Feinde verteilt.',
    triggers: { afterSpell: (g, s, ev) => { if (ev.player === s.owner) g.splitDamage(s, 2, () => g.chars(1 - s.owner)); } } });
  S('dragons_breath', 'Drachenatem', 5, { cls: 'mage', text: 'Verursacht $4 Schaden. Kostet (1) weniger für jeden Diener, der in diesem Zug gestorben ist.', target: 'char',
    selfCost: died, play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 4)) });
  S('solemn_vigil', 'Ernste Wacht', 5, { cls: 'paladin', text: 'Zieht 2 Karten. Kostet (1) weniger für jeden Diener, der in diesem Zug gestorben ist.',
    selfCost: died, play: (g, s) => g.draw(s.owner, 2) });
  HS.lib.E('e_dragon_consort', { type: 'effect',
    costMod: (g, ef, c) => (c.owner === ef.owner && c.zone === 'hand' && g.def(c).race === 'dragon' && g.def(c).type === 'minion' ? -2 : 0),
    triggers: { cardPlayed: (g, ef, ev) => { if (ev.player === ef.owner && g.def(ev.card).race === 'dragon') g.removeEffect(ef); } } });
  M('dragon_consort', 'Drachengemahlin', 5, 5, 5, { cls: 'paladin', race: 'dragon', rarity: 'rare', text: '<b>Kampfschrei:</b> Der nächste Drache, den Ihr ausspielt, kostet (2) weniger.',
    play: (g, s) => g.addEffect(s.owner, 'e_dragon_consort') });
  M('twilight_whelp', 'Zwielichtwelpe', 1, 2, 1, { cls: 'priest', race: 'dragon', text: '<b>Kampfschrei:</b> Habt Ihr einen Drachen auf der Hand, erhält dieser Diener +2 Leben.',
    play: (g, s) => { if (g.holding(s.owner, 'dragon')) g.buff(s, { hp: 2 }); } });
  S('resurrect', 'Wiederbelebung', 2, { cls: 'priest', rarity: 'rare', text: 'Ruft einen zufälligen befreundeten Diener herbei, der in diesem Spiel gestorben ist.',
    canPlay: (g, s) => g.P(s.owner).board.length < 7,
    play: (g, s) => { const c = g.pick(g.P(s.owner).graveyard); if (c) g.summon(s.owner, c); } });
  S('gang_up', 'Bande bilden', 2, { cls: 'rogue', text: 'Wählt einen Diener. Mischt 3 Kopien davon in Euer Deck.', target: 'minion',
    play: (g, s, t) => { for (let i = 0; i < 3; i++) g.shuffleIn(s.owner, t.card); } });
  M('dark_iron_skulker', 'Dunkeleisenschleicher', 5, 4, 3, { cls: 'rogue', rarity: 'rare', text: '<b>Kampfschrei:</b> Verursacht 2 Schaden bei allen unverletzten feindlichen Dienern.',
    play: (g, s) => g.aoe(s, g.board(1 - s.owner).filter((m) => m.damage === 0), 2) });
  S('lava_shock', 'Lavaschock', 2, { cls: 'shaman', text: 'Verursacht $2 Schaden. Hebt die Sperre Eurer überladenen Manakristalle auf.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 2)); const p = g.P(s.owner); p.mana = Math.min(10, p.mana + p.locked); p.locked = 0; p.overload = 0; } });
  M('fireguard_destroyer', 'Vernichter der Feuerwache', 4, 3, 6, { cls: 'shaman', overload: 1, text: '<b>Kampfschrei:</b> Erhält 1–4 Angriff. <b>Überladung:</b> (1)',
    play: (g, s) => g.buff(s, { atk: 1 + g.rand(4) }) });
  S('demonwrath', 'Dämonenzorn', 3, { cls: 'warlock', rarity: 'rare', text: 'Verursacht $2 Schaden bei allen Dienern, die keine Dämonen sind.',
    play: (g, s) => g.aoe(s, g.board().filter((m) => !g.isRace(m, 'demon')), g.spellDmg(s, 2)) });
  M('imp_gang_boss', 'Wichtelbandenboss', 3, 2, 4, { cls: 'warlock', race: 'demon', text: 'Immer wenn dieser Diener Schaden erleidet, ruft einen Wichtel (1/1) herbei.',
    triggers: { damage: (g, s, ev) => { if (ev.target === s) g.summonNext(s, 't_imp'); } } });
  S('revenge', 'Rache', 2, { cls: 'warrior', rarity: 'rare', text: 'Verursacht $1 Schaden bei ALLEN Dienern. Habt Ihr 12 Leben oder weniger, stattdessen $3 Schaden.',
    play: (g, s) => g.aoe(s, g.board(), g.spellDmg(s, g.hp(g.hero(s.owner)) <= 12 ? 3 : 1)) });
  M('axe_flinger', 'Axtwerfer', 4, 2, 5, { cls: 'warrior', text: 'Immer wenn dieser Diener Schaden erleidet, verursacht er 2 Schaden beim feindlichen Helden.',
    triggers: { damage: (g, s, ev) => { if (ev.target === s) g.damage(s, g.hero(1 - s.owner), 2); } } });

  T('t_black_whelp', 'Schwarzer Welpe', 1, 2, 1, { race: 'dragon' });
  T('t_flame_cat', 'Druide der Flamme', 3, 5, 2, { cls: 'druid', race: 'beast' });
  T('t_flame_bird', 'Druide der Flamme', 3, 2, 5, { cls: 'druid', race: 'beast' });
})();
