/* Basis-Set */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : global;
  const HS = root.HS;
  const { M, S, W, T } = HS.lib;
  HS.setSet('basic');
  const room = (g, s) => g.P(s.owner).board.length < 7;

  /* ===== Druide ===== */
  S('innervate', 'Innervate', 0, { cls: 'druid', text: 'Erhaltet in diesem Zug 2 Manakristalle.',
    play: (g, s) => { const p = g.P(s.owner); p.mana = Math.min(10, p.mana + 2); } });
  S('moonfire', 'Moonfire', 0, { cls: 'druid', text: 'Verursacht $1 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 1)) });
  S('claw', 'Claw', 1, { cls: 'druid', text: 'Verleiht Eurem Helden +2 Angriff in diesem Zug und 2 Rüstung.',
    play: (g, s) => { g.buff(g.hero(s.owner), { atk: 2, expire: g.eot() }); g.gainArmor(s.owner, 2); } });
  S('mark_of_the_wild', 'Mark of the Wild', 2, { cls: 'druid', text: 'Verleiht einem Diener <b>Taunt</b> und +2/+2.', target: 'minion',
    play: (g, s, t) => { g.buff(t, { atk: 2, hp: 2 }); g.giveKw(t, 'taunt'); } });
  S('wild_growth', 'Wild Growth', 2, { cls: 'druid', text: 'Erhaltet einen leeren Manakristall.',
    play: (g, s) => g.gainMana(s.owner, 1, false) });
  S('healing_touch', 'Healing Touch', 3, { cls: 'druid', text: 'Stellt #8 Leben wieder her.', target: 'char',
    play: (g, s, t) => g.heal(s, t, g.spellHeal(s, 8)) });
  S('savage_roar', 'Savage Roar', 3, { cls: 'druid', text: 'Verleiht Euren Charakteren +2 Angriff in diesem Zug.',
    play: (g, s) => { for (const c of g.chars(s.owner)) g.buff(c, { atk: 2, expire: g.eot() }); } });
  S('swipe', 'Swipe', 4, { cls: 'druid', text: 'Verursacht $4 Schaden bei einem Feind und $1 Schaden bei allen anderen Feinden.', target: 'enemyChar',
    play: (g, s, t) => {
      const others = g.chars(1 - s.owner).filter((c) => c !== t);
      g.batch(() => { g.damage(s, t, g.spellDmg(s, 4)); for (const o of others) g.damage(s, o, g.spellDmg(s, 1)); });
    } });
  S('starfire', 'Starfire', 6, { cls: 'druid', text: 'Verursacht $5 Schaden. Zieht eine Karte.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 5)); g.draw(s.owner); } });
  M('ironbark_protector', 'Ironbark Protector', 8, 8, 8, { cls: 'druid', kw: ['taunt'], text: '<b>Taunt</b>' });

  /* ===== Jäger ===== */
  S('arcane_shot', 'Arcane Shot', 1, { cls: 'hunter', text: 'Verursacht $2 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 2)) });
  S('hunters_mark', 'Hunter\'s Mark', 1, { cls: 'hunter', text: 'Setzt das Leben eines Dieners auf 1.', target: 'minion',
    play: (g, s, t) => g.buff(t, { setHp: 1 }) });
  S('tracking', 'Tracking', 1, { cls: 'hunter', text: 'Seht Euch die obersten drei Karten Eures Decks an. Zieht eine davon und werft die anderen ab.',
    play: (g, s) => {
      const p = g.P(s.owner);
      const ids = [];
      for (let i = 0; i < 3 && p.deck.length; i++) ids.push(p.deck.pop());
      if (!ids.length) return;
      for (const id of ids) g.ent(id).zone = 'aside';
      if (ids.length === 1) { HS.card('tracking').resolve(g, { player: s.owner, options: ids }, 0); return; }
      g.s.pending = { card: 'tracking', player: s.owner, options: ids };
    },
    resolve: (g, pd, idx) => {
      pd.options.forEach((id, i) => {
        const e = g.ent(id);
        if (i === idx && g.P(pd.player).hand.length < 10) { e.zone = 'hand'; g.P(pd.player).hand.push(id); }
        else e.zone = 'grave';
      });
    } });
  M('timber_wolf', 'Timber Wolf', 1, 1, 1, { cls: 'hunter', race: 'beast', text: 'Eure anderen Beasts haben +1 Angriff.',
    aura: (g, s, t) => (t !== s && t.owner === s.owner && g.isMinion(t) && g.isRace(t, 'beast') ? { atk: 1 } : null) });
  S('animal_companion', 'Animal Companion', 3, { cls: 'hunter', text: 'Ruft Misha, Leokk oder Huffer herbei.', canPlay: room,
    play: (g, s) => g.summon(s.owner, g.pick(['t_misha', 't_leokk', 't_huffer'])) });
  S('kill_command', 'Kill Command', 3, { cls: 'hunter', text: 'Verursacht $3 Schaden. Habt Ihr ein Beast, stattdessen $5 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, g.board(s.owner).some((m) => g.isRace(m, 'beast')) ? 5 : 3)) });
  S('multi_shot', 'Multi-Shot', 4, { cls: 'hunter', text: 'Verursacht $3 Schaden bei zwei zufälligen feindlichen Dienern.',
    canPlay: (g, s) => g.board(1 - s.owner).length >= 2,
    play: (g, s) => { const ts = g.pickN(g.board(1 - s.owner), 2); g.aoe(s, ts, g.spellDmg(s, 3)); } });
  M('houndmaster', 'Houndmaster', 4, 4, 3, { cls: 'hunter', text: '<b>Battlecry:</b> Verleiht einem befreundeten Beast +2/+2 und <b>Taunt</b>.',
    target: { t: 'friendlyMinion', f: (g, s, t) => g.isRace(t, 'beast') },
    play: (g, s, t) => { if (t) { g.buff(t, { atk: 2, hp: 2 }); g.giveKw(t, 'taunt'); } } });
  M('starving_buzzard', 'Starving Buzzard', 5, 3, 2, { cls: 'hunter', race: 'beast', text: 'Immer wenn Ihr ein Beast herbeiruft, zieht Ihr eine Karte.',
    triggers: { summon: (g, s, ev) => { if (ev.minion !== s && ev.minion.owner === s.owner && g.isRace(ev.minion, 'beast')) g.draw(s.owner); } } });
  M('tundra_rhino', 'Tundra Rhino', 5, 2, 5, { cls: 'hunter', race: 'beast', text: 'Eure Beasts haben <b>Charge</b>.',
    auraKw: (g, s, t) => (t.owner === s.owner && g.isMinion(t) && g.isRace(t, 'beast') ? ['charge'] : null) });
  T('t_misha', 'Misha', 3, 4, 4, { cls: 'hunter', race: 'beast', kw: ['taunt'], text: '<b>Taunt</b>' });
  T('t_leokk', 'Leokk', 3, 2, 4, { cls: 'hunter', race: 'beast', text: 'Eure anderen Diener haben +1 Angriff.',
    aura: (g, s, t) => (t !== s && t.owner === s.owner && g.isMinion(t) ? { atk: 1 } : null) });
  T('t_huffer', 'Huffer', 3, 4, 2, { cls: 'hunter', race: 'beast', kw: ['charge'], text: '<b>Charge</b>' });

  /* ===== Magier ===== */
  S('arcane_missiles', 'Arcane Missiles', 1, { cls: 'mage', text: 'Verursacht $3 Schaden, zufällig auf alle Feinde verteilt.',
    play: (g, s) => g.splitDamage(s, g.spellDmg(s, 3), () => g.chars(1 - s.owner)) });
  S('mirror_image', 'Mirror Image', 1, { cls: 'mage', text: 'Ruft zwei Diener (0/2) mit <b>Taunt</b> herbei.',
    play: (g, s) => { g.summon(s.owner, 't_mirror_image'); g.summon(s.owner, 't_mirror_image'); } });
  S('arcane_explosion', 'Arcane Explosion', 2, { cls: 'mage', text: 'Verursacht $1 Schaden bei allen feindlichen Dienern.',
    play: (g, s) => g.aoe(s, g.board(1 - s.owner), g.spellDmg(s, 1)) });
  S('frostbolt', 'Frostbolt', 2, { cls: 'mage', text: 'Verursacht $3 Schaden bei einem Charakter und wirkt <b>Freeze</b> auf ihn.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 3)); g.freeze(t); } });
  S('arcane_intellect', 'Arcane Intellect', 3, { cls: 'mage', text: 'Zieht 2 Karten.', play: (g, s) => g.draw(s.owner, 2) });
  S('frost_nova', 'Frost Nova', 3, { cls: 'mage', text: 'Wirkt <b>Freeze</b> auf alle feindlichen Diener.',
    play: (g, s) => { for (const m of g.board(1 - s.owner)) g.freeze(m); } });
  S('fireball', 'Fireball', 4, { cls: 'mage', text: 'Verursacht $6 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 6)) });
  S('polymorph', 'Polymorph', 4, { cls: 'mage', text: 'Verwandelt einen Diener in ein Sheep (1/1).', target: 'minion',
    play: (g, s, t) => g.transform(t, 't_sheep') });
  M('water_elemental', 'Water Elemental', 4, 3, 6, { cls: 'mage', kw: ['freezer'], text: 'Wirkt <b>Freeze</b> auf jeden Charakter, der von diesem Diener Schaden erleidet.' });
  S('flamestrike', 'Flamestrike', 7, { cls: 'mage', text: 'Verursacht $4 Schaden bei allen feindlichen Dienern.',
    play: (g, s) => g.aoe(s, g.board(1 - s.owner), g.spellDmg(s, 4)) });
  T('t_mirror_image', 'Mirror Image', 0, 0, 2, { cls: 'mage', kw: ['taunt'], text: '<b>Taunt</b>' });
  T('t_sheep', 'Sheep', 1, 1, 1, { race: 'beast' });

  /* ===== Paladin ===== */
  S('blessing_of_might', 'Blessing of Might', 1, { cls: 'paladin', text: 'Verleiht einem Diener +3 Angriff.', target: 'minion',
    play: (g, s, t) => g.buff(t, { atk: 3 }) });
  S('hand_of_protection', 'Hand of Protection', 1, { cls: 'paladin', text: 'Verleiht einem Diener <b>Divine Shield</b>.', target: 'minion',
    play: (g, s, t) => g.giveKw(t, 'divineShield') });
  S('humility', 'Humility', 1, { cls: 'paladin', text: 'Setzt den Angriff eines Dieners auf 1.', target: 'minion',
    play: (g, s, t) => g.buff(t, { setAtk: 1 }) });
  W('lights_justice', 'Light\'s Justice', 1, 1, 4, { cls: 'paladin' });
  S('holy_light', 'Holy Light', 2, { cls: 'paladin', text: 'Stellt #6 Leben wieder her.', target: 'char',
    play: (g, s, t) => g.heal(s, t, g.spellHeal(s, 6)) });
  S('blessing_of_kings', 'Blessing of Kings', 4, { cls: 'paladin', text: 'Verleiht einem Diener +4/+4.', target: 'minion',
    play: (g, s, t) => g.buff(t, { atk: 4, hp: 4 }) });
  S('consecration', 'Consecration', 4, { cls: 'paladin', text: 'Verursacht $2 Schaden bei allen Feinden.',
    play: (g, s) => g.aoe(s, g.chars(1 - s.owner), g.spellDmg(s, 2)) });
  S('hammer_of_wrath', 'Hammer of Wrath', 4, { cls: 'paladin', text: 'Verursacht $3 Schaden. Zieht eine Karte.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 3)); g.draw(s.owner); } });
  W('truesilver_champion', 'Truesilver Champion', 4, 4, 2, { cls: 'paladin', text: 'Immer wenn Euer Held angreift, wird bei ihm 2 Leben wiederhergestellt.',
    triggers: { attack: (g, s, ev) => { if (ev.attacker === g.hero(s.owner)) g.heal(s, g.hero(s.owner), 2); } } });
  M('guardian_of_kings', 'Guardian of Kings', 7, 5, 6, { cls: 'paladin', text: '<b>Battlecry:</b> Stellt bei Eurem Helden 6 Leben wieder her.',
    play: (g, s) => g.heal(s, g.hero(s.owner), 6) });

  /* ===== Priester ===== */
  S('holy_smite', 'Holy Smite', 1, { cls: 'priest', text: 'Verursacht $2 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 2)) });
  S('mind_vision', 'Mind Vision', 1, { cls: 'priest', text: 'Legt eine Kopie einer zufälligen Karte aus der Hand Eures Gegners auf Eure Hand.',
    play: (g, s) => { const c = g.pick(g.hand(1 - s.owner)); if (c) g.addCard(s.owner, c.card); } });
  S('power_word_shield', 'Power Word: Shield', 1, { cls: 'priest', text: 'Verleiht einem Diener +2 Leben. Zieht eine Karte.', target: 'minion',
    play: (g, s, t) => { g.buff(t, { hp: 2 }); g.draw(s.owner); } });
  M('northshire_cleric', 'Northshire Cleric', 1, 1, 3, { cls: 'priest', text: 'Immer wenn ein Diener geheilt wird, zieht Ihr eine Karte.',
    triggers: { heal: (g, s, ev) => { if (g.isMinion(ev.target)) g.draw(s.owner); } } });
  S('divine_spirit', 'Divine Spirit', 2, { cls: 'priest', text: 'Verdoppelt das Leben eines Dieners.', target: 'minion',
    play: (g, s, t) => g.buff(t, { hp: g.hp(t) }) });
  S('shadow_word_pain', 'Shadow Word: Pain', 2, { cls: 'priest', text: 'Vernichtet einen Diener mit 3 oder weniger Angriff.',
    target: { t: 'minion', f: (g, s, t) => g.atk(t) <= 3 }, play: (g, s, t) => g.destroy(t) });
  S('mind_blast', 'Mind Blast', 2, { cls: 'priest', text: 'Verursacht $5 Schaden beim feindlichen Helden.',
    play: (g, s) => g.damage(s, g.hero(1 - s.owner), g.spellDmg(s, 5)) });
  S('shadow_word_death', 'Shadow Word: Death', 3, { cls: 'priest', text: 'Vernichtet einen Diener mit 5 oder mehr Angriff.',
    target: { t: 'minion', f: (g, s, t) => g.atk(t) >= 5 }, play: (g, s, t) => g.destroy(t) });
  S('holy_nova', 'Holy Nova', 5, { cls: 'priest', text: 'Verursacht $2 Schaden bei allen Feinden. Stellt bei allen befreundeten Charakteren #2 Leben wieder her.',
    play: (g, s) => { g.aoe(s, g.chars(1 - s.owner), g.spellDmg(s, 2)); g.aoeHeal(s, g.chars(s.owner), g.spellHeal(s, 2)); } });
  S('mind_control', 'Mind Control', 10, { cls: 'priest', text: 'Übernehmt die Kontrolle über einen feindlichen Diener.', target: 'enemyMinion',
    canPlay: room, play: (g, s, t) => g.control(t, s.owner) });

  /* ===== Schurke ===== */
  S('backstab', 'Backstab', 0, { cls: 'rogue', text: 'Verursacht $2 Schaden bei einem unverletzten Diener.',
    target: { t: 'minion', f: (g, s, t) => t.damage === 0 }, play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 2)) });
  S('deadly_poison', 'Deadly Poison', 1, { cls: 'rogue', text: 'Verleiht Eurer Waffe +2 Angriff.',
    canPlay: (g, s) => !!g.weapon(s.owner), play: (g, s) => { const w = g.weapon(s.owner); if (w) g.buff(w, { atk: 2 }); } });
  S('sinister_strike', 'Sinister Strike', 1, { cls: 'rogue', text: 'Verursacht $3 Schaden beim feindlichen Helden.',
    play: (g, s) => g.damage(s, g.hero(1 - s.owner), g.spellDmg(s, 3)) });
  S('sap', 'Sap', 2, { cls: 'rogue', text: 'Lasst einen feindlichen Diener auf die Hand seines Besitzers zurückkehren.', target: 'enemyMinion',
    play: (g, s, t) => g.bounce(t) });
  S('shiv', 'Shiv', 2, { cls: 'rogue', text: 'Verursacht $1 Schaden. Zieht eine Karte.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 1)); g.draw(s.owner); } });
  S('fan_of_knives', 'Fan of Knives', 3, { cls: 'rogue', text: 'Verursacht $1 Schaden bei allen feindlichen Dienern. Zieht eine Karte.',
    play: (g, s) => { g.aoe(s, g.board(1 - s.owner), g.spellDmg(s, 1)); g.draw(s.owner); } });
  S('assassinate', 'Assassinate', 5, { cls: 'rogue', text: 'Vernichtet einen feindlichen Diener.', target: 'enemyMinion',
    play: (g, s, t) => g.destroy(t) });
  W('assassins_blade', 'Assassin\'s Blade', 5, 3, 4, { cls: 'rogue' });
  S('vanish', 'Vanish', 6, { cls: 'rogue', text: 'Lasst alle Diener auf die Hand ihrer Besitzer zurückkehren.',
    play: (g, s) => { for (const m of g.board()) g.bounce(m); } });
  S('sprint', 'Sprint', 7, { cls: 'rogue', text: 'Zieht 4 Karten.', play: (g, s) => g.draw(s.owner, 4) });

  /* ===== Schamane ===== */
  S('ancestral_healing', 'Ancestral Healing', 0, { cls: 'shaman', text: 'Stellt bei einem Diener sämtliches Leben wieder her und verleiht ihm <b>Taunt</b>.', target: 'minion',
    play: (g, s, t) => { g.heal(s, t, t.damage); g.giveKw(t, 'taunt'); } });
  S('totemic_might', 'Totemic Might', 0, { cls: 'shaman', text: 'Verleiht Euren Totems +2 Leben.',
    play: (g, s) => { for (const m of g.board(s.owner)) if (g.isRace(m, 'totem')) g.buff(m, { hp: 2 }); } });
  S('frost_shock', 'Frost Shock', 1, { cls: 'shaman', text: 'Verursacht $1 Schaden bei einem feindlichen Charakter und wirkt <b>Freeze</b> auf ihn.', target: 'enemyChar',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 1)); g.freeze(t); } });
  S('rockbiter_weapon', 'Rockbiter Weapon', 1, { cls: 'shaman', text: 'Verleiht einem befreundeten Charakter +3 Angriff in diesem Zug.', target: 'friendlyChar',
    play: (g, s, t) => g.buff(t, { atk: 3, expire: g.eot() }) });
  S('windfury', 'Windfury', 2, { cls: 'shaman', text: 'Verleiht einem Diener <b>Windfury</b>.', target: 'minion',
    play: (g, s, t) => g.giveKw(t, 'windfury') });
  M('flametongue_totem', 'Flametongue Totem', 2, 0, 3, { cls: 'shaman', race: 'totem', positional: true, text: 'Benachbarte Diener haben +2 Angriff.',
    aura: (g, s, t) => (g.isMinion(t) && t.owner === s.owner && g.adj(s).includes(t) ? { atk: 2 } : null) });
  S('hex', 'Hex', 3, { cls: 'shaman', text: 'Verwandelt einen Diener in einen Frog (0/1) mit <b>Taunt</b>.', target: 'minion',
    play: (g, s, t) => g.transform(t, 't_frog') });
  M('windspeaker', 'Windspeaker', 4, 3, 3, { cls: 'shaman', text: '<b>Battlecry:</b> Verleiht einem befreundeten Diener <b>Windfury</b>.',
    target: 'friendlyMinion', play: (g, s, t) => { if (t) g.giveKw(t, 'windfury'); } });
  S('bloodlust', 'Bloodlust', 5, { cls: 'shaman', text: 'Verleiht Euren Dienern +3 Angriff in diesem Zug.',
    play: (g, s) => { for (const m of g.board(s.owner)) g.buff(m, { atk: 3, expire: g.eot() }); } });
  M('fire_elemental', 'Fire Elemental', 6, 6, 5, { cls: 'shaman', text: '<b>Battlecry:</b> Verursacht 3 Schaden.',
    target: 'char', play: (g, s, t) => { if (t) g.damage(s, t, 3); } });
  T('t_frog', 'Frog', 0, 0, 1, { race: 'beast', kw: ['taunt'], text: '<b>Taunt</b>' });

  /* ===== Hexenmeister ===== */
  S('sacrificial_pact', 'Sacrificial Pact', 0, { cls: 'warlock', text: 'Vernichtet einen Demon. Stellt bei Eurem Helden #5 Leben wieder her.',
    target: { t: 'char', f: (g, s, t) => g.isRace(t, 'demon') },
    play: (g, s, t) => {
      if (g.isHero(t)) t.damage = g.maxHp(t) + t.armor; else g.destroy(t);
      g.heal(s, g.hero(s.owner), g.spellHeal(s, 5));
    } });
  HS.lib.E('e_corruption', { triggers: { turnStart: (g, e, ev, x) => { if (ev.player === x.by) g.destroy(e); } } });
  S('corruption', 'Corruption', 1, { cls: 'warlock', text: 'Wählt einen feindlichen Diener. Zu Beginn Eures Zuges wird er vernichtet.', target: 'enemyMinion',
    play: (g, s, t) => g.buff(t, { card: 'e_corruption', by: s.owner }) });
  S('mortal_coil', 'Mortal Coil', 1, { cls: 'warlock', text: 'Verursacht $1 Schaden bei einem Diener. Zieht eine Karte, wenn er dadurch stirbt.', target: 'minion',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 1)); if (g.hp(t) <= 0 || t.dead) g.draw(s.owner); } });
  S('soulfire', 'Soulfire', 1, { cls: 'warlock', text: 'Verursacht $4 Schaden. Werft eine zufällige Karte ab.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 4)); g.discardRandom(s.owner); } });
  M('voidwalker', 'Voidwalker', 1, 1, 3, { cls: 'warlock', race: 'demon', kw: ['taunt'], text: '<b>Taunt</b>' });
  M('succubus', 'Succubus', 2, 4, 3, { cls: 'warlock', race: 'demon', text: '<b>Battlecry:</b> Werft eine zufällige Karte ab.',
    play: (g, s) => g.discardRandom(s.owner) });
  S('drain_life', 'Drain Life', 3, { cls: 'warlock', text: 'Verursacht $2 Schaden. Stellt bei Eurem Helden #2 Leben wieder her.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 2)); g.heal(s, g.hero(s.owner), g.spellHeal(s, 2)); } });
  S('shadow_bolt', 'Shadow Bolt', 3, { cls: 'warlock', text: 'Verursacht $4 Schaden bei einem Diener.', target: 'minion',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 4)) });
  S('hellfire', 'Hellfire', 4, { cls: 'warlock', text: 'Verursacht $3 Schaden bei ALLEN Charakteren.',
    play: (g, s) => g.aoe(s, g.chars(), g.spellDmg(s, 3)) });
  M('dread_infernal', 'Dread Infernal', 6, 6, 6, { cls: 'warlock', race: 'demon', text: '<b>Battlecry:</b> Verursacht 1 Schaden bei ALLEN anderen Charakteren.',
    play: (g, s) => g.aoe(s, g.chars().filter((c) => c !== s), 1) });

  /* ===== Krieger ===== */
  S('execute', 'Execute', 1, { cls: 'warrior', text: 'Vernichtet einen verletzten feindlichen Diener.',
    target: { t: 'enemyMinion', f: (g, s, t) => t.damage > 0 }, play: (g, s, t) => g.destroy(t) });
  S('whirlwind', 'Whirlwind', 1, { cls: 'warrior', text: 'Verursacht $1 Schaden bei ALLEN Dienern.',
    play: (g, s) => g.aoe(s, g.board(), g.spellDmg(s, 1)) });
  W('fiery_war_axe', 'Fiery War Axe', 2, 3, 2, { cls: 'warrior' });
  S('cleave', 'Cleave', 2, { cls: 'warrior', text: 'Verursacht $2 Schaden bei zwei zufälligen feindlichen Dienern.',
    canPlay: (g, s) => g.board(1 - s.owner).length >= 2,
    play: (g, s) => g.aoe(s, g.pickN(g.board(1 - s.owner), 2), g.spellDmg(s, 2)) });
  S('heroic_strike', 'Heroic Strike', 2, { cls: 'warrior', text: 'Verleiht Eurem Helden +4 Angriff in diesem Zug.',
    play: (g, s) => g.buff(g.hero(s.owner), { atk: 4, expire: g.eot() }) });
  S('charge', 'Charge', 3, { cls: 'warrior', text: 'Verleiht einem befreundeten Diener +2 Angriff und <b>Charge</b>.', target: 'friendlyMinion',
    play: (g, s, t) => { g.buff(t, { atk: 2 }); g.giveKw(t, 'charge'); } });
  S('shield_block', 'Shield Block', 3, { cls: 'warrior', text: 'Erhaltet 5 Rüstung. Zieht eine Karte.',
    play: (g, s) => { g.gainArmor(s.owner, 5); g.draw(s.owner); } });
  M('warsong_commander', 'Warsong Commander', 3, 2, 3, { cls: 'warrior', text: 'Immer wenn Ihr einen Diener mit 3 oder weniger Angriff herbeiruft, erhält er <b>Charge</b>.',
    triggers: { summon: (g, s, ev) => { const m = ev.minion; if (m !== s && m.owner === s.owner && g.atk(m) <= 3) g.giveKw(m, 'charge'); } } });
  M('korkron_elite', 'Kor\'kron Elite', 4, 4, 3, { cls: 'warrior', kw: ['charge'], text: '<b>Charge</b>' });
  W('arcanite_reaper', 'Arcanite Reaper', 5, 5, 2, { cls: 'warrior' });

  /* ===== Neutral ===== */
  M('elven_archer', 'Elven Archer', 1, 1, 1, { text: '<b>Battlecry:</b> Verursacht 1 Schaden.', target: 'char', play: (g, s, t) => { if (t) g.damage(s, t, 1); } });
  M('goldshire_footman', 'Goldshire Footman', 1, 1, 2, { kw: ['taunt'], text: '<b>Taunt</b>' });
  M('grimscale_oracle', 'Grimscale Oracle', 1, 1, 1, { race: 'murloc', text: 'ALLE anderen Murlocs haben +1 Angriff.',
    aura: (g, s, t) => (t !== s && g.isMinion(t) && g.isRace(t, 'murloc') ? { atk: 1 } : null) });
  M('murloc_raider', 'Murloc Raider', 1, 2, 1, { race: 'murloc' });
  M('stonetusk_boar', 'Stonetusk Boar', 1, 1, 1, { race: 'beast', kw: ['charge'], text: '<b>Charge</b>' });
  M('voodoo_doctor', 'Voodoo Doctor', 1, 2, 1, { text: '<b>Battlecry:</b> Stellt 2 Leben wieder her.', target: 'char', play: (g, s, t) => { if (t) g.heal(s, t, 2); } });
  M('acidic_swamp_ooze', 'Acidic Swamp Ooze', 2, 3, 2, { text: '<b>Battlecry:</b> Zerstört die Waffe Eures Gegners.',
    play: (g, s) => { const w = g.weapon(1 - s.owner); if (w) g.destroy(w); } });
  M('bloodfen_raptor', 'Bloodfen Raptor', 2, 3, 2, { race: 'beast' });
  M('bluegill_warrior', 'Bluegill Warrior', 2, 2, 1, { race: 'murloc', kw: ['charge'], text: '<b>Charge</b>' });
  M('frostwolf_grunt', 'Frostwolf Grunt', 2, 2, 2, { kw: ['taunt'], text: '<b>Taunt</b>' });
  M('kobold_geomancer', 'Kobold Geomancer', 2, 2, 2, { spellDamage: 1, text: '<b>Spell Damage +1</b>' });
  M('murloc_tidehunter', 'Murloc Tidehunter', 2, 2, 1, { race: 'murloc', text: '<b>Battlecry:</b> Ruft einen Murloc Scout (1/1) herbei.',
    play: (g, s) => g.summonNext(s, 't_murloc_scout') });
  M('novice_engineer', 'Novice Engineer', 2, 1, 1, { text: '<b>Battlecry:</b> Zieht eine Karte.', play: (g, s) => g.draw(s.owner) });
  M('river_crocolisk', 'River Crocolisk', 2, 2, 3, { race: 'beast' });
  M('dalaran_mage', 'Dalaran Mage', 3, 1, 4, { spellDamage: 1, text: '<b>Spell Damage +1</b>' });
  M('ironforge_rifleman', 'Ironforge Rifleman', 3, 2, 2, { text: '<b>Battlecry:</b> Verursacht 1 Schaden.', target: 'char', play: (g, s, t) => { if (t) g.damage(s, t, 1); } });
  M('ironfur_grizzly', 'Ironfur Grizzly', 3, 3, 3, { race: 'beast', kw: ['taunt'], text: '<b>Taunt</b>' });
  M('magma_rager', 'Magma Rager', 3, 5, 1);
  M('raid_leader', 'Raid Leader', 3, 2, 2, { text: 'Eure anderen Diener haben +1 Angriff.',
    aura: (g, s, t) => (t !== s && t.owner === s.owner && g.isMinion(t) ? { atk: 1 } : null) });
  M('razorfen_hunter', 'Razorfen Hunter', 3, 2, 3, { text: '<b>Battlecry:</b> Ruft einen Boar (1/1) herbei.', play: (g, s) => g.summonNext(s, 't_boar') });
  M('shattered_sun_cleric', 'Shattered Sun Cleric', 3, 3, 2, { text: '<b>Battlecry:</b> Verleiht einem befreundeten Diener +1/+1.',
    target: 'friendlyMinion', play: (g, s, t) => { if (t) g.buff(t, { atk: 1, hp: 1 }); } });
  M('silverback_patriarch', 'Silverback Patriarch', 3, 1, 4, { race: 'beast', kw: ['taunt'], text: '<b>Taunt</b>' });
  M('wolfrider', 'Wolfrider', 3, 3, 1, { kw: ['charge'], text: '<b>Charge</b>' });
  M('chillwind_yeti', 'Chillwind Yeti', 4, 4, 5);
  M('dragonling_mechanic', 'Dragonling Mechanic', 4, 2, 4, { text: '<b>Battlecry:</b> Ruft einen Mechanical Dragonling (2/1) herbei.',
    play: (g, s) => g.summonNext(s, 't_mechanical_dragonling') });
  M('gnomish_inventor', 'Gnomish Inventor', 4, 2, 4, { text: '<b>Battlecry:</b> Zieht eine Karte.', play: (g, s) => g.draw(s.owner) });
  M('oasis_snapjaw', 'Oasis Snapjaw', 4, 2, 7, { race: 'beast' });
  M('ogre_magi', 'Ogre Magi', 4, 4, 4, { spellDamage: 1, text: '<b>Spell Damage +1</b>' });
  M('senjin_shieldmasta', 'Sen\'jin Shieldmasta', 4, 3, 5, { kw: ['taunt'], text: '<b>Taunt</b>' });
  M('stormwind_knight', 'Stormwind Knight', 4, 2, 5, { kw: ['charge'], text: '<b>Charge</b>' });
  M('booty_bay_bodyguard', 'Booty Bay Bodyguard', 5, 5, 4, { kw: ['taunt'], text: '<b>Taunt</b>' });
  M('darkscale_healer', 'Darkscale Healer', 5, 4, 5, { text: '<b>Battlecry:</b> Stellt bei allen befreundeten Charakteren 2 Leben wieder her.',
    play: (g, s) => g.aoeHeal(s, g.chars(s.owner), 2) });
  M('frostwolf_warlord', 'Frostwolf Warlord', 5, 4, 4, { text: '<b>Battlecry:</b> Erhält +1/+1 für jeden anderen befreundeten Diener auf dem Schlachtfeld.',
    play: (g, s) => { const n = g.others(s).length; if (n) g.buff(s, { atk: n, hp: n }); } });
  M('gurubashi_berserker', 'Gurubashi Berserker', 5, 2, 7, { text: 'Immer wenn dieser Diener Schaden erleidet, erhält er +3 Angriff.',
    triggers: { damage: (g, s, ev) => { if (ev.target === s) g.buff(s, { atk: 3 }); } } });
  M('nightblade', 'Nightblade', 5, 4, 4, { text: '<b>Battlecry:</b> Verursacht 3 Schaden beim feindlichen Helden.',
    play: (g, s) => g.damage(s, g.hero(1 - s.owner), 3) });
  M('stormpike_commando', 'Stormpike Commando', 5, 4, 2, { text: '<b>Battlecry:</b> Verursacht 2 Schaden.', target: 'char', play: (g, s, t) => { if (t) g.damage(s, t, 2); } });
  M('archmage', 'Archmage', 6, 4, 7, { spellDamage: 1, text: '<b>Spell Damage +1</b>' });
  M('boulderfist_ogre', 'Boulderfist Ogre', 6, 6, 7);
  M('lord_of_the_arena', 'Lord of the Arena', 6, 6, 5, { kw: ['taunt'], text: '<b>Taunt</b>' });
  M('reckless_rocketeer', 'Reckless Rocketeer', 6, 5, 2, { kw: ['charge'], text: '<b>Charge</b>' });
  M('core_hound', 'Core Hound', 7, 9, 5, { race: 'beast' });
  M('stormwind_champion', 'Stormwind Champion', 7, 6, 6, { text: 'Eure anderen Diener haben +1/+1.',
    aura: (g, s, t) => (t !== s && t.owner === s.owner && g.isMinion(t) ? { atk: 1, hp: 1 } : null) });
  M('war_golem', 'War Golem', 7, 7, 7);

  T('t_murloc_scout', 'Murloc Scout', 0, 1, 1, { race: 'murloc' });
  T('t_boar', 'Boar', 1, 1, 1, { race: 'beast' });
  T('t_mechanical_dragonling', 'Mechanical Dragonling', 1, 2, 1, { race: 'mech' });
})();
