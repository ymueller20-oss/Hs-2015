/* Konstruktoren, Helden, Heldenfähigkeiten und gemeinsame Effekte */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : global;
  const HS = root.HS;

  const M = (id, name, cost, atk, hp, o) => HS.def(Object.assign({ id, name, type: 'minion', cost, atk, hp }, o || {}));
  const S = (id, name, cost, o) => HS.def(Object.assign({ id, name, type: 'spell', cost }, o || {}));
  const W = (id, name, cost, atk, hp, o) => HS.def(Object.assign({ id, name, type: 'weapon', cost, atk, hp }, o || {}));
  const T = (id, name, cost, atk, hp, o) => M(id, name, cost, atk, hp, Object.assign({ set: 'token', collectible: false }, o || {}));
  const TS = (id, name, cost, o) => S(id, name, cost, Object.assign({ set: 'token', collectible: false }, o || {}));
  const E = (id, o) => HS.def(Object.assign({ id, name: id, type: 'enchant', set: 'token', collectible: false }, o || {}));
  const SEC = (id, name, cost, on, cond, fire, o) =>
    S(id, name, cost, Object.assign({ secret: { on, cond, fire } }, o || {}));
  HS.lib = { M, S, W, T, TS, E, SEC };

  /* gemeinsame Hilfen */
  const L = HS.lib;
  L.me = (e) => e.owner;
  L.op = (e) => 1 - e.owner;
  L.eot = (g) => g.eot();
  L.hasRoom = (g, e) => g.P(e.owner).board.length < 7;
  L.isMine = (g, self, ev) => ev.player === self.owner;
  L.enemyHeroDmg = (g, self, n) => g.damage(self, g.hero(1 - self.owner), n);
  L.drawFor = (g, e, n) => g.draw(e.owner, n || 1);

  /* ---------- Helden ---------- */
  for (const k of Object.keys(HS.CLASSES)) {
    HS.def({ id: HS.CLASSES[k].hero, name: HS.CLASSES[k].name, type: 'hero', hp: 30, cls: k, set: 'token', collectible: false });
  }
  HS.def({ id: 't_jaraxxus_hero', name: 'Lord Jaraxxus', type: 'hero', hp: 15, cls: 'warlock', race: 'demon', set: 'token', collectible: false });
  HS.def({ id: 't_ragnaros_hero', name: 'Ragnaros der Feuerfürst', type: 'hero', hp: 8, cls: 'neutral', set: 'token', collectible: false });

  const P = (id, name, cls, o) => HS.def(Object.assign({ id, name, type: 'power', cost: 2, cls, set: 'token', collectible: false }, o));

  P('hp_fireblast', 'Feuerschlag', 'mage', {
    text: 'Verursacht $1 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 1)),
  });
  P('hp_lesser_heal', 'Geringe Heilung', 'priest', {
    text: 'Stellt #2 Leben wieder her.', target: 'char',
    play: (g, s, t) => g.heal(s, t, g.spellHeal(s, 2)),
  });
  P('hp_mind_spike', 'Gedankenstachel', 'priest', {
    text: 'Verursacht $2 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 2)),
  });
  P('hp_mind_shatter', 'Gedankenzertrümmerung', 'priest', {
    text: 'Verursacht $3 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 3)),
  });
  P('hp_armor_up', 'Rüstung hoch!', 'warrior', {
    text: 'Erhaltet 2 Rüstung.',
    play: (g, s) => g.gainArmor(s.owner, 2),
  });
  P('hp_steady_shot', 'Zuverlässiger Schuss', 'hunter', {
    text: 'Verursacht $2 Schaden beim feindlichen Helden.',
    target: (g, s) => (g.board(s.owner).some((m) => m.card === 'steamwheedle_sniper' && !m.silenced) ? 'char' : null),
    play: (g, s, t) => g.damage(s, t || g.hero(1 - s.owner), g.spellDmg(s, 2)),
  });
  P('hp_dagger_mastery', 'Dolchkunde', 'rogue', {
    text: 'Rüstet einen Dolch (1/2) aus.',
    play: (g, s) => g.equip(s.owner, 't_wicked_knife'),
  });
  const TOTEMS = ['t_healing_totem', 't_searing_totem', 't_stoneclaw_totem', 't_wrath_of_air_totem'];
  P('hp_totemic_call', 'Totemruf', 'shaman', {
    text: 'Ruft ein zufälliges Totem herbei.',
    canUse: (g, s) => L.hasRoom(g, s) && TOTEMS.some((t) => !g.board(s.owner).some((m) => m.card === t)),
    play: (g, s) => {
      const opts = TOTEMS.filter((t) => !g.board(s.owner).some((m) => m.card === t));
      if (opts.length) g.summon(s.owner, g.pick(opts));
    },
  });
  P('hp_life_tap', 'Lebensentzug', 'warlock', {
    text: 'Zieht eine Karte und erleidet $2 Schaden.',
    play: (g, s) => {
      g.draw(s.owner);
      g.damage(s, g.hero(s.owner), g.spellDmg(s, 2));
    },
  });
  P('hp_reinforce', 'Verstärkung', 'paladin', {
    text: 'Ruft einen Rekruten der Silbernen Hand (1/1) herbei.',
    canUse: (g, s) => L.hasRoom(g, s),
    play: (g, s) => g.summon(s.owner, 't_silver_hand_recruit'),
  });
  P('hp_shapeshift', 'Gestaltwandel', 'druid', {
    text: '+1 Angriff in diesem Zug. +1 Rüstung.',
    play: (g, s) => {
      g.buff(g.hero(s.owner), { atk: 1, expire: g.eot() });
      g.gainArmor(s.owner, 1);
    },
  });
  P('hp_inferno', 'INFERNO!', 'warlock', {
    text: 'Ruft eine Höllenbestie (6/6) herbei.',
    canUse: (g, s) => L.hasRoom(g, s),
    play: (g, s) => g.summon(s.owner, 't_infernal'),
  });
  P('hp_die_insect', 'STERBT, INSEKTEN!', 'neutral', {
    text: 'Verursacht $8 Schaden bei einem zufälligen Feind.',
    play: (g, s) => {
      const t = g.pick(g.chars(1 - s.owner));
      if (t) g.damage(s, t, g.spellDmg(s, 8));
    },
  });

  HS.replaceHero = function (g, pi, heroId, powerId) {
    const p = g.P(pi);
    const old = g.hero(pi);
    const h = g.newEnt(heroId, pi, 'hero');
    h.armor = old.armor;
    h.order = old.order;
    h.exhausted = false;
    h.attacks = old.attacks;
    old.zone = 'grave';
    p.hero = h.id;
    if (powerId) {
      const pw = g.newEnt(powerId, pi, 'power');
      g.ent(p.power).zone = 'grave';
      p.power = pw.id;
      p.powerUses = 0;
    }
    return h;
  };

  /* ---------- Gemeinsame Token ---------- */
  L.TS('t_the_coin', 'Die Münze', 0, {
    text: 'Erhaltet in diesem Zug 1 Manakristall.',
    play: (g, s) => { const p = g.P(s.owner); p.mana = Math.min(10, p.mana + 1); },
  });
  L.TS('t_excess_mana', 'Überschüssiges Mana', 0, { cls: 'druid', text: 'Zieht eine Karte.', play: (g, s) => g.draw(s.owner) });
  W('t_wicked_knife', 'Dolch', 1, 1, 2, { set: 'token', collectible: false, cls: 'rogue' });
  T('t_healing_totem', 'Totem der Heilung', 1, 0, 2, {
    cls: 'shaman', race: 'totem', text: 'Stellt am Ende Eures Zuges bei allen befreundeten Dienern 1 Leben wieder her.',
    triggers: { turnEnd: (g, s, ev) => { if (ev.player === s.owner) g.aoeHeal(s, g.board(s.owner), 1); } },
  });
  T('t_searing_totem', 'Totem der Verbrennung', 1, 1, 1, { cls: 'shaman', race: 'totem' });
  T('t_stoneclaw_totem', 'Totem der Steinklaue', 1, 0, 2, { cls: 'shaman', race: 'totem', kw: ['taunt'], text: '<b>Spott</b>' });
  T('t_wrath_of_air_totem', 'Totem des Luftzorns', 1, 0, 2, { cls: 'shaman', race: 'totem', spellDamage: 1, text: '<b>Zauberschaden +1</b>' });
  T('t_silver_hand_recruit', 'Rekrut der Silbernen Hand', 1, 1, 1, { cls: 'paladin' });
  T('t_infernal', 'Höllenbestie', 6, 6, 6, { cls: 'warlock', race: 'demon' });

  E('e_commanding_shout', { type: 'effect' });
})();
