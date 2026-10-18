/* Der Fluch von Naxxramas */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : global;
  const HS = root.HS;
  const { M, S, W, T, E, SEC } = HS.lib;
  HS.setSet('naxx');
  const L = 'legendary';
  const hasDR = (g, m) => (!m.silenced && !!g.def(m).deathrattle) || m.ench.some((x) => x.card && HS.CARDS[x.card] && HS.CARDS[x.card].deathrattle);
  HS.hasDeathrattle = hasDR;

  M('zombie_chow', 'Zombiefraß', 1, 2, 3, { text: '<b>Todesröcheln:</b> Stellt beim feindlichen Helden 5 Leben wieder her.',
    deathrattle: (g, s) => g.heal(s, g.hero(1 - s.owner), 5) });
  M('undertaker', 'Totengräber', 1, 1, 2, { text: 'Immer wenn Ihr einen Diener mit <b>Todesröcheln</b> herbeiruft, erhält dieser Diener +1 Angriff.',
    triggers: { summon: (g, s, ev) => { if (ev.minion !== s && ev.minion.owner === s.owner && hasDR(g, ev.minion)) g.buff(s, { atk: 1 }); } } });
  E('e_echoing_ooze', { triggers: { turnEnd: (g, e, ev, x) => { e.ench = e.ench.filter((y) => y !== x); g.copyMinion(e, e.owner, g.pos(e) + 1); } } });
  M('echoing_ooze', 'Echoschlammer', 2, 1, 2, { rarity: 'epic', text: '<b>Kampfschrei:</b> Ruft am Ende des Zuges eine exakte Kopie dieses Dieners herbei.',
    play: (g, s) => g.buff(s, { card: 'e_echoing_ooze' }) });
  M('haunted_creeper', 'Spukkriecher', 2, 1, 2, { race: 'beast', text: '<b>Todesröcheln:</b> Ruft zwei Spektralspinnen (1/1) herbei.',
    deathrattle: (g, s, info) => { g.summon(s.owner, 't_spectral_spider', info.pos); g.summon(s.owner, 't_spectral_spider', info.pos); } });
  M('mad_scientist', 'Verrückter Wissenschaftler', 2, 2, 2, { text: '<b>Todesröcheln:</b> Legt ein <b>Geheimnis</b> aus Eurem Deck auf das Schlachtfeld.',
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
      g.fire('secretPlayed', { secret: c, player: s.owner });
    } });
  M('nerubar_weblord', 'Weberfürst der Nerub\'ar', 2, 1, 4, { text: 'Diener mit <b>Kampfschrei</b> kosten (2) mehr.',
    costAura: (g, s, c) => { const d = g.def(c); return c.zone === 'hand' && d.type === 'minion' && (d.play || d.choose) && !d.noBattlecry ? 2 : 0; } });
  M('nerubian_egg', 'Nerubisches Ei', 2, 0, 2, { rarity: 'rare', text: '<b>Todesröcheln:</b> Ruft einen Neruber (4/4) herbei.',
    deathrattle: (g, s, info) => g.summon(s.owner, 't_nerubian', info.pos) });
  M('unstable_ghoul', 'Instabiler Ghul', 2, 1, 3, { kw: ['taunt'], text: '<b>Spott</b>. <b>Todesröcheln:</b> Verursacht 1 Schaden bei allen Dienern.',
    deathrattle: (g, s) => g.aoe(s, g.board(), 1) });
  M('dancing_swords', 'Tanzende Schwerter', 3, 4, 4, { text: '<b>Todesröcheln:</b> Euer Gegner zieht eine Karte.', deathrattle: (g, s) => g.draw(1 - s.owner) });
  M('deathlord', 'Todesfürst', 3, 2, 8, { rarity: 'rare', kw: ['taunt'], text: '<b>Spott</b>. <b>Todesröcheln:</b> Euer Gegner legt einen Diener aus seinem Deck auf das Schlachtfeld.',
    deathrattle: (g, s) => {
      const o = 1 - s.owner;
      const c = g.pick(g.deck(o).filter((x) => g.def(x).type === 'minion'));
      if (!c || g.P(o).board.length >= 7) return;
      g.removeFromDeck(c);
      g.place(c, null, true);
    } });
  M('shade_of_naxxramas', 'Schemen von Naxxramas', 3, 2, 2, { rarity: 'epic', kw: ['stealth'], text: '<b>Verstohlenheit</b>. Erhält zu Beginn Eures Zuges +1/+1.',
    triggers: { turnStart: (g, s, ev) => { if (ev.player === s.owner) g.buff(s, { atk: 1, hp: 1 }); } } });
  M('stoneskin_gargoyle', 'Steinhautgargoyle', 3, 1, 4, { text: 'Stellt zu Beginn Eures Zuges bei diesem Diener sämtliches Leben wieder her.',
    triggers: { turnStart: (g, s, ev) => { if (ev.player === s.owner && s.damage) g.heal(s, s, s.damage); } } });
  M('baron_rivendare', 'Baron Totenschwur', 4, 1, 7, { rarity: L, text: 'Die <b>Todesröcheln</b> Eurer Diener werden zweimal ausgelöst.' });
  M('wailing_soul', 'Wehklagende Seele', 4, 3, 5, { rarity: 'rare', text: '<b>Kampfschrei:</b> Bringt Eure anderen Diener zum <b>Schweigen</b>.',
    play: (g, s) => { for (const m of g.others(s)) g.silence(m); } });
  const thaddius = (other) => (g, s) => { if (g.P(s.owner).graveyard.includes(other)) g.summon(s.owner, 't_thaddius'); };
  M('feugen', 'Feugen', 5, 4, 7, { rarity: L, text: '<b>Todesröcheln:</b> Ist Stalagg in diesem Spiel ebenfalls gestorben, ruft Thaddius herbei.', deathrattle: thaddius('stalagg') });
  M('stalagg', 'Stalagg', 5, 7, 4, { rarity: L, text: '<b>Todesröcheln:</b> Ist Feugen in diesem Spiel ebenfalls gestorben, ruft Thaddius herbei.', deathrattle: thaddius('feugen') });
  HS.lib.E('e_loatheb', { type: 'effect', costMod: (g, ef, c) => (c.owner === ef.owner && c.zone === 'hand' && g.def(c).type === 'spell' ? 5 : 0) });
  M('loatheb', 'Loatheb', 5, 5, 5, { rarity: L, text: '<b>Kampfschrei:</b> Die Zauber des Gegners kosten im nächsten Zug (5) mehr.',
    play: (g, s) => g.addEffect(1 - s.owner, 'e_loatheb', { expire: 'end:' + (1 - s.owner) }) });
  M('sludge_belcher', 'Schlickspucker', 5, 3, 5, { rarity: 'rare', kw: ['taunt'], text: '<b>Spott</b>. <b>Todesröcheln:</b> Ruft einen Schleim (1/2) mit <b>Spott</b> herbei.',
    deathrattle: (g, s, info) => g.summon(s.owner, 't_slime', info.pos) });
  M('spectral_knight', 'Spektraler Ritter', 5, 4, 6, { kw: ['elusive'], text: 'Kann nicht als Ziel von Zaubern oder Heldenfähigkeiten gewählt werden.' });
  M('maexxna', 'Maexxna', 6, 2, 8, { race: 'beast', rarity: L, kw: ['poison'], text: 'Vernichtet jeden Diener, dem dieser Diener Schaden zufügt.' });
  M('kelthuzad', 'Kel\'Thuzad', 8, 6, 8, { rarity: L, text: 'Ruft am Ende jedes Zuges alle befreundeten Diener herbei, die in diesem Zug gestorben sind.',
    triggers: { turnEnd: (g, s) => { for (const d of g.s.diedThisTurn.filter((x) => x.owner === s.owner)) g.summon(s.owner, d.card); } } });

  /* Klassenkarten */
  S('poison_seeds', 'Giftige Samen', 4, { cls: 'druid', text: 'Vernichtet alle Diener und ruft für jeden einen Treant (2/2) als Ersatz herbei.',
    play: (g) => {
      const n = [g.board(0).length, g.board(1).length];
      for (const m of g.board()) g.destroy(m);
      g.processDeaths();
      for (let i = 0; i < 2; i++) for (let k = 0; k < n[i]; k++) g.summon(i, 't_treant');
    } });
  M('webspinner', 'Netzweberin', 1, 1, 1, { cls: 'hunter', race: 'beast', text: '<b>Todesröcheln:</b> Erhaltet eine zufällige Wildtierkarte auf die Hand.',
    deathrattle: (g, s) => g.addCard(s.owner, g.randomCard((c) => c.type === 'minion' && c.race === 'beast')) });
  SEC('duplicate', 'Duplikat', 3, 'death', (g, s, ev) => ev.owner === s.owner,
    (g, s, ev) => { g.addCard(s.owner, ev.minion.card); g.addCard(s.owner, ev.minion.card); },
    { cls: 'mage', text: '<b>Geheimnis:</b> Wenn ein befreundeter Diener stirbt, erhaltet 2 Kopien davon auf die Hand.' });
  SEC('avenge', 'Rächen', 1, 'death', (g, s, ev) => ev.owner === s.owner && g.board(s.owner).length > 0,
    (g, s) => { const t = g.pick(g.board(s.owner)); if (t) g.buff(t, { atk: 3, hp: 2 }); },
    { cls: 'paladin', text: '<b>Geheimnis:</b> Wenn einer Eurer Diener stirbt, erhält ein zufälliger befreundeter Diener +3/+2.' });
  M('dark_cultist', 'Dunkler Kultist', 3, 3, 4, { cls: 'priest', text: '<b>Todesröcheln:</b> Verleiht einem zufälligen befreundeten Diener +3 Leben.',
    deathrattle: (g, s) => { const t = g.pick(g.board(s.owner)); if (t) g.buff(t, { hp: 3 }); } });
  M('anubar_ambusher', 'Lauerer der Anub\'ar', 4, 5, 5, { cls: 'rogue', text: '<b>Todesröcheln:</b> Lasst einen zufälligen befreundeten Diener auf Eure Hand zurückkehren.',
    deathrattle: (g, s) => { const t = g.pick(g.board(s.owner)); if (t) g.bounce(t); } });
  S('reincarnate', 'Reinkarnation', 2, { cls: 'shaman', text: 'Vernichtet einen Diener und belebt ihn danach mit vollem Leben wieder.', target: 'minion',
    play: (g, s, t) => { const owner = t.owner, card = t.card; g.destroy(t); g.processDeaths(); g.summon(owner, card); } });
  M('voidcaller', 'Leerenrufer', 4, 3, 4, { cls: 'warlock', race: 'demon', text: '<b>Todesröcheln:</b> Legt einen zufälligen Dämon von Eurer Hand auf das Schlachtfeld.',
    deathrattle: (g, s, info) => {
      const c = g.pick(g.hand(s.owner).filter((x) => g.def(x).type === 'minion' && g.isRace(x, 'demon')));
      if (!c || g.P(s.owner).board.length >= 7) return;
      g.removeFromHand(c);
      g.place(c, info.pos, true);
    } });
  W('deaths_bite', 'Todesbiss', 4, 4, 2, { cls: 'warrior', text: '<b>Todesröcheln:</b> Verursacht 1 Schaden bei allen Dienern.',
    deathrattle: (g, s) => g.aoe(s, g.board(), 1) });

  T('t_spectral_spider', 'Spektralspinne', 1, 1, 1);
  T('t_nerubian', 'Neruber', 4, 4, 4);
  T('t_slime', 'Schleim', 1, 1, 2, { kw: ['taunt'], text: '<b>Spott</b>' });
  T('t_thaddius', 'Thaddius', 10, 11, 11, { rarity: L });
})();
