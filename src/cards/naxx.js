/* Der Fluch von Naxxramas */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : global;
  const HS = root.HS;
  const { M, S, W, T, E, SEC } = HS.lib;
  HS.setSet('naxx');
  const L = 'legendary';
  const hasDR = (g, m) => (!m.silenced && !!g.def(m).deathrattle) || m.ench.some((x) => x.card && HS.CARDS[x.card] && HS.CARDS[x.card].deathrattle);
  HS.hasDeathrattle = hasDR;

  M('zombie_chow', 'Zombie Chow', 1, 2, 3, { text: '<b>Deathrattle:</b> Stellt beim feindlichen Helden 5 Leben wieder her.',
    deathrattle: (g, s) => g.heal(s, g.hero(1 - s.owner), 5) });
  M('undertaker', 'Undertaker', 1, 1, 2, { text: 'Immer wenn Ihr einen Diener mit <b>Deathrattle</b> herbeiruft, erhält dieser Diener +1 Angriff.',
    triggers: { summon: (g, s, ev) => { if (ev.minion !== s && ev.minion.owner === s.owner && hasDR(g, ev.minion)) g.buff(s, { atk: 1 }); } } });
  E('e_echoing_ooze', { triggers: { turnEnd: (g, e, ev, x) => { e.ench = e.ench.filter((y) => y !== x); g.copyMinion(e, e.owner, g.pos(e) + 1); } } });
  M('echoing_ooze', 'Echoing Ooze', 2, 1, 2, { rarity: 'epic', text: '<b>Battlecry:</b> Ruft am Ende des Zuges eine exakte Kopie dieses Dieners herbei.',
    play: (g, s) => g.buff(s, { card: 'e_echoing_ooze' }) });
  M('haunted_creeper', 'Haunted Creeper', 2, 1, 2, { race: 'beast', text: '<b>Deathrattle:</b> Ruft zwei Spectral Spiders (1/1) herbei.',
    deathrattle: (g, s, info) => { g.summon(s.owner, 't_spectral_spider', info.pos); g.summon(s.owner, 't_spectral_spider', info.pos); } });
  M('mad_scientist', 'Mad Scientist', 2, 2, 2, { text: '<b>Deathrattle:</b> Legt ein <b>Secret</b> aus Eurem Deck auf das Schlachtfeld.',
    deathrattle: (g, s) => {
      const p = g.P(s.owner);
      if (p.secrets.length >= 5) return;
      const have = p.secrets.map((id) => g.ent(id).card);
      const c = g.pick(g.deck(s.owner).filter((x) => g.def(x).secret && !have.includes(x.card)));
      if (!c) return;
      g.removeFromDeck(c);
      c.zone = 'secret';
      c.order = g.s.order++;
      p.secrets.push(c.id);
    } });
  M('nerubar_weblord', 'Nerub\'ar Weblord', 2, 1, 4, { text: 'Diener mit <b>Battlecry</b> kosten (2) mehr.',
    costAura: (g, s, c) => { const d = g.def(c); return c.zone === 'hand' && d.type === 'minion' && d.play && /<b>Battlecry:/.test(d.text) && !d.noBattlecry ? 2 : 0; } });
  M('nerubian_egg', 'Nerubian Egg', 2, 0, 2, { rarity: 'rare', text: '<b>Deathrattle:</b> Ruft einen Nerubian (4/4) herbei.',
    deathrattle: (g, s, info) => g.summon(s.owner, 't_nerubian', info.pos) });
  M('unstable_ghoul', 'Unstable Ghoul', 2, 1, 3, { kw: ['taunt'], text: '<b>Taunt</b>. <b>Deathrattle:</b> Verursacht 1 Schaden bei allen Dienern.',
    deathrattle: (g, s) => g.aoe(s, g.board(), 1) });
  M('dancing_swords', 'Dancing Swords', 3, 4, 4, { text: '<b>Deathrattle:</b> Euer Gegner zieht eine Karte.', deathrattle: (g, s) => g.draw(1 - s.owner) });
  M('deathlord', 'Deathlord', 3, 2, 8, { rarity: 'rare', kw: ['taunt'], text: '<b>Taunt</b>. <b>Deathrattle:</b> Euer Gegner legt einen Diener aus seinem Deck auf das Schlachtfeld.',
    deathrattle: (g, s) => {
      const o = 1 - s.owner;
      const c = g.pick(g.deck(o).filter((x) => g.def(x).type === 'minion'));
      if (!c || g.P(o).board.length >= 7) return;
      g.removeFromDeck(c);
      g.place(c, null, true);
    } });
  M('shade_of_naxxramas', 'Shade of Naxxramas', 3, 2, 2, { rarity: 'epic', kw: ['stealth'], text: '<b>Stealth</b>. Erhält zu Beginn Eures Zuges +1/+1.',
    triggers: { turnStart: (g, s, ev) => { if (ev.player === s.owner) g.buff(s, { atk: 1, hp: 1 }); } } });
  M('stoneskin_gargoyle', 'Stoneskin Gargoyle', 3, 1, 4, { text: 'Stellt zu Beginn Eures Zuges bei diesem Diener sämtliches Leben wieder her.',
    triggers: { turnStart: (g, s, ev) => { if (ev.player === s.owner && s.damage) g.heal(s, s, s.damage); } } });
  M('baron_rivendare', 'Baron Rivendare', 4, 1, 7, { rarity: L, text: 'Die <b>Deathrattle</b> Eurer Diener werden zweimal ausgelöst.' });
  M('wailing_soul', 'Wailing Soul', 4, 3, 5, { rarity: 'rare', text: '<b>Battlecry:</b> Wirkt <b>Silence</b> auf Eure anderen Diener.',
    play: (g, s) => { for (const m of g.others(s)) g.silence(m); } });
  const thaddius = (other) => (g, s, info) => { if (g.P(0).graveyard.includes(other) || g.P(1).graveyard.includes(other)) g.summon(s.owner, 't_thaddius', info.pos); };
  M('feugen', 'Feugen', 5, 4, 7, { rarity: L, text: '<b>Deathrattle:</b> Ist Stalagg in diesem Spiel ebenfalls gestorben, ruft Thaddius herbei.', deathrattle: thaddius('stalagg') });
  M('stalagg', 'Stalagg', 5, 7, 4, { rarity: L, text: '<b>Deathrattle:</b> Ist Feugen in diesem Spiel ebenfalls gestorben, ruft Thaddius herbei.', deathrattle: thaddius('feugen') });
  HS.lib.E('e_loatheb', { type: 'effect', costMod: (g, ef, c) => (c.owner === ef.owner && c.zone === 'hand' && g.def(c).type === 'spell' ? 5 : 0) });
  M('loatheb', 'Loatheb', 5, 5, 5, { rarity: L, text: '<b>Battlecry:</b> Die Zauber des Gegners kosten im nächsten Zug (5) mehr.',
    play: (g, s) => g.addEffect(1 - s.owner, 'e_loatheb', { expire: 'end:' + (1 - s.owner) }) });
  M('sludge_belcher', 'Sludge Belcher', 5, 3, 5, { rarity: 'rare', kw: ['taunt'], text: '<b>Taunt</b>. <b>Deathrattle:</b> Ruft einen Slime (1/2) mit <b>Taunt</b> herbei.',
    deathrattle: (g, s, info) => g.summon(s.owner, 't_slime', info.pos) });
  M('spectral_knight', 'Spectral Knight', 5, 4, 6, { kw: ['elusive'], text: 'Kann nicht als Ziel von Zaubern oder Heldenfähigkeiten gewählt werden.' });
  M('maexxna', 'Maexxna', 6, 2, 8, { race: 'beast', rarity: L, kw: ['poison'], text: 'Vernichtet jeden Diener, dem dieser Diener Schaden zufügt.' });
  M('kelthuzad', 'Kel\'Thuzad', 8, 6, 8, { rarity: L, text: 'Ruft am Ende jedes Zuges alle befreundeten Diener herbei, die in diesem Zug gestorben sind.',
    triggers: { turnEnd: (g, s) => { for (const d of g.s.diedThisTurn.filter((x) => x.owner === s.owner)) g.summon(s.owner, d.card); } } });

  /* Klassenkarten */
  S('poison_seeds', 'Poison Seeds', 4, { cls: 'druid', text: 'Vernichtet alle Diener und ruft für jeden einen Treant (2/2) als Ersatz herbei.',
    play: (g) => {
      const n = [g.board(0).length, g.board(1).length];
      for (const m of g.board()) g.destroy(m);
      g.processDeaths();
      for (let i = 0; i < 2; i++) for (let k = 0; k < n[i]; k++) g.summon(i, 't_treant');
    } });
  M('webspinner', 'Webspinner', 1, 1, 1, { cls: 'hunter', race: 'beast', text: '<b>Deathrattle:</b> Erhaltet eine zufällige Beast-Karte auf die Hand.',
    deathrattle: (g, s) => g.addCard(s.owner, g.randomCard((c) => c.type === 'minion' && c.race === 'beast')) });
  SEC('duplicate', 'Duplicate', 3, 'death', (g, s, ev) => ev.owner === s.owner,
    (g, s, ev) => { g.addCard(s.owner, ev.minion.card); g.addCard(s.owner, ev.minion.card); },
    { cls: 'mage', text: '<b>Secret:</b> Wenn ein befreundeter Diener stirbt, erhaltet 2 Kopien davon auf die Hand.' });
  SEC('avenge', 'Avenge', 1, 'death', (g, s, ev) => ev.owner === s.owner && g.board(s.owner).length > 0,
    (g, s) => { const t = g.pick(g.board(s.owner)); if (t) g.buff(t, { atk: 3, hp: 2 }); },
    { cls: 'paladin', text: '<b>Secret:</b> Wenn einer Eurer Diener stirbt, erhält ein zufälliger befreundeter Diener +3/+2.' });
  M('dark_cultist', 'Dark Cultist', 3, 3, 4, { cls: 'priest', text: '<b>Deathrattle:</b> Verleiht einem zufälligen befreundeten Diener +3 Leben.',
    deathrattle: (g, s) => { const t = g.pick(g.board(s.owner)); if (t) g.buff(t, { hp: 3 }); } });
  M('anubar_ambusher', 'Anub\'ar Ambusher', 4, 5, 5, { cls: 'rogue', text: '<b>Deathrattle:</b> Lasst einen zufälligen befreundeten Diener auf Eure Hand zurückkehren.',
    deathrattle: (g, s) => { const t = g.pick(g.board(s.owner)); if (t) g.bounce(t); } });
  S('reincarnate', 'Reincarnate', 2, { cls: 'shaman', text: 'Vernichtet einen Diener und belebt ihn danach mit vollem Leben wieder.', target: 'minion',
    play: (g, s, t) => { const owner = t.owner, card = t.card; g.destroy(t); g.processDeaths(); g.summon(owner, card); } });
  M('voidcaller', 'Voidcaller', 4, 3, 4, { cls: 'warlock', race: 'demon', text: '<b>Deathrattle:</b> Legt einen zufälligen Demon von Eurer Hand auf das Schlachtfeld.',
    deathrattle: (g, s, info) => {
      const c = g.pick(g.hand(s.owner).filter((x) => g.def(x).type === 'minion' && g.isRace(x, 'demon')));
      if (!c || g.P(s.owner).board.length >= 7) return;
      g.removeFromHand(c);
      g.place(c, info.pos, true);
    } });
  W('deaths_bite', 'Death\'s Bite', 4, 4, 2, { cls: 'warrior', text: '<b>Deathrattle:</b> Verursacht 1 Schaden bei allen Dienern.',
    deathrattle: (g, s) => g.aoe(s, g.board(), 1) });

  T('t_spectral_spider', 'Spectral Spider', 1, 1, 1);
  T('t_nerubian', 'Nerubian', 3, 4, 4);
  T('t_slime', 'Slime', 1, 1, 2, { kw: ['taunt'], text: '<b>Taunt</b>' });
  T('t_thaddius', 'Thaddius', 10, 11, 11, { rarity: L });
})();
