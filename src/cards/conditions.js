/* Bedingungen für den Gold-Glanz auf der Hand: true = der Zusatzeffekt würde jetzt greifen */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : global;
  const HS = root.HS;
  const C = (ids, fn) => { for (const id of ids) if (HS.CARDS[id]) HS.CARDS[id].cond = fn; };
  const hasRace = (g, pi, race) => g.board(pi).some((m) => g.isRace(m, race));
  const holdingOther = (g, e, race) => g.hand(e.owner).some((c) => c !== e && g.def(c).type === 'minion' && g.def(c).race === race);

  C(['goblin_blastmage', 'tinkertown_technician'], (g, e) => hasRace(g, e.owner, 'mech'));
  C(['kill_command', 'druid_of_the_fang'], (g, e) => hasRace(g, e.owner, 'beast'));
  C(['twilight_whelp', 'blackwing_technician', 'blackwing_corruptor', 'rend_blackhand'], (g, e) => holdingOther(g, e, 'dragon'));
  C(['quick_shot', 'core_rager'], (g, e) => g.P(e.owner).hand.length === 1);
  C(['mortal_strike', 'revenge'], (g, e) => g.hp(g.hero(e.owner)) <= 12);
  C(['drakonid_crusher'], (g, e) => g.hp(g.hero(1 - e.owner)) <= 15);
  C(['mind_control_tech'], (g, e) => g.board(1 - e.owner).length >= 4);
  C(['execute', 'rampage'], (g) => g.board().some((m) => m.damage > 0));
  C(['shield_slam'], (g, e) => g.hero(e.owner).armor > 0);
  C(['backstab'], (g) => g.board().some((m) => m.damage === 0));
  /* Combo-Karten */
  for (const c of Object.values(HS.CARDS)) if (/<b>Combo:<\/b>/.test(c.text || '')) c.cond = (g, e) => g.P(e.owner).played > 0;
})();
