/* Basis-Set */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : global;
  const HS = root.HS;
  const { M, S, W, T } = HS.lib;
  HS.setSet('basic');
  const room = (g, s) => g.P(s.owner).board.length < 7;

  /* ===== Druide ===== */
  S('innervate', 'Anregen', 0, { cls: 'druid', text: 'Erhaltet in diesem Zug 2 Manakristalle.',
    play: (g, s) => { const p = g.P(s.owner); p.mana = Math.min(10, p.mana + 2); } });
  S('moonfire', 'Mondfeuer', 0, { cls: 'druid', text: 'Verursacht $1 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 1)) });
  S('claw', 'Klaue', 1, { cls: 'druid', text: 'Verleiht Eurem Helden +2 Angriff in diesem Zug und 2 Rüstung.',
    play: (g, s) => { g.buff(g.hero(s.owner), { atk: 2, expire: g.eot() }); g.gainArmor(s.owner, 2); } });
  S('mark_of_the_wild', 'Mal der Wildnis', 2, { cls: 'druid', text: 'Verleiht einem Diener <b>Spott</b> und +2/+2.', target: 'minion',
    play: (g, s, t) => { g.buff(t, { atk: 2, hp: 2 }); g.giveKw(t, 'taunt'); } });
  S('wild_growth', 'Wildwuchs', 2, { cls: 'druid', text: 'Erhaltet einen leeren Manakristall.',
    play: (g, s) => g.gainMana(s.owner, 1, false) });
  S('healing_touch', 'Heilende Berührung', 3, { cls: 'druid', text: 'Stellt #8 Leben wieder her.', target: 'char',
    play: (g, s, t) => g.heal(s, t, g.spellHeal(s, 8)) });
  S('savage_roar', 'Wildes Brüllen', 3, { cls: 'druid', text: 'Verleiht Euren Charakteren +2 Angriff in diesem Zug.',
    play: (g, s) => { for (const c of g.chars(s.owner)) g.buff(c, { atk: 2, expire: g.eot() }); } });
  S('swipe', 'Prankenhieb', 4, { cls: 'druid', text: 'Verursacht $4 Schaden bei einem Feind und $1 Schaden bei allen anderen Feinden.', target: 'enemyChar',
    play: (g, s, t) => {
      const others = g.chars(1 - s.owner).filter((c) => c !== t);
      g.batch(() => { g.damage(s, t, g.spellDmg(s, 4)); for (const o of others) g.damage(s, o, g.spellDmg(s, 1)); });
    } });
  S('starfire', 'Sternenfeuer', 6, { cls: 'druid', text: 'Verursacht $5 Schaden. Zieht eine Karte.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 5)); g.draw(s.owner); } });
  M('ironbark_protector', 'Eisenborkenbeschützer', 8, 8, 8, { cls: 'druid', kw: ['taunt'], text: '<b>Spott</b>' });

  /* ===== Jäger ===== */
  S('arcane_shot', 'Arkaner Schuss', 1, { cls: 'hunter', text: 'Verursacht $2 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 2)) });
  S('hunters_mark', 'Mal des Jägers', 1, { cls: 'hunter', text: 'Setzt das Leben eines Dieners auf 1.', target: 'minion',
    play: (g, s, t) => g.buff(t, { setHp: 1 }) });
  S('tracking', 'Fährtenlesen', 1, { cls: 'hunter', text: 'Seht Euch die obersten drei Karten Eures Decks an. Zieht eine davon und werft die anderen ab.',
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
  M('timber_wolf', 'Waldwolf', 1, 1, 1, { cls: 'hunter', race: 'beast', text: 'Eure anderen Wildtiere haben +1 Angriff.',
    aura: (g, s, t) => (t !== s && t.owner === s.owner && g.isMinion(t) && g.isRace(t, 'beast') ? { atk: 1 } : null) });
  S('animal_companion', 'Tiergefährte', 3, { cls: 'hunter', text: 'Ruft einen zufälligen Tiergefährten herbei.', canPlay: room,
    play: (g, s) => g.summon(s.owner, g.pick(['t_misha', 't_leokk', 't_huffer'])) });
  S('kill_command', 'Befehl zum Töten', 3, { cls: 'hunter', text: 'Verursacht $3 Schaden. Habt Ihr ein Wildtier, stattdessen $5 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, g.board(s.owner).some((m) => g.isRace(m, 'beast')) ? 5 : 3)) });
  S('multi_shot', 'Mehrfachschuss', 4, { cls: 'hunter', text: 'Verursacht $3 Schaden bei zwei zufälligen feindlichen Dienern.',
    canPlay: (g, s) => g.board(1 - s.owner).length >= 2,
    play: (g, s) => { const ts = g.pickN(g.board(1 - s.owner), 2); g.aoe(s, ts, g.spellDmg(s, 3)); } });
  M('houndmaster', 'Hundemeister', 4, 4, 3, { cls: 'hunter', text: '<b>Kampfschrei:</b> Verleiht einem befreundeten Wildtier +2/+2 und <b>Spott</b>.',
    target: { t: 'friendlyMinion', f: (g, s, t) => g.isRace(t, 'beast') },
    play: (g, s, t) => { if (t) { g.buff(t, { atk: 2, hp: 2 }); g.giveKw(t, 'taunt'); } } });
  M('starving_buzzard', 'Hungriger Bussard', 5, 3, 2, { cls: 'hunter', race: 'beast', text: 'Immer wenn Ihr ein Wildtier herbeiruft, zieht Ihr eine Karte.',
    triggers: { summon: (g, s, ev) => { if (ev.minion !== s && ev.minion.owner === s.owner && g.isRace(ev.minion, 'beast')) g.draw(s.owner); } } });
  M('tundra_rhino', 'Tundranashorn', 5, 2, 5, { cls: 'hunter', race: 'beast', text: 'Eure Wildtiere haben <b>Ansturm</b>.',
    auraKw: (g, s, t) => (t.owner === s.owner && g.isMinion(t) && g.isRace(t, 'beast') ? ['charge'] : null) });
  T('t_misha', 'Misha', 3, 4, 4, { cls: 'hunter', race: 'beast', kw: ['taunt'], text: '<b>Spott</b>' });
  T('t_leokk', 'Leokk', 3, 2, 4, { cls: 'hunter', race: 'beast', text: 'Eure anderen Diener haben +1 Angriff.',
    aura: (g, s, t) => (t !== s && t.owner === s.owner && g.isMinion(t) ? { atk: 1 } : null) });
  T('t_huffer', 'Huffer', 3, 4, 2, { cls: 'hunter', race: 'beast', kw: ['charge'], text: '<b>Ansturm</b>' });

  /* ===== Magier ===== */
  S('arcane_missiles', 'Arkane Geschosse', 1, { cls: 'mage', text: 'Verursacht $3 Schaden, zufällig auf alle Feinde verteilt.',
    play: (g, s) => g.splitDamage(s, g.spellDmg(s, 3), () => g.chars(1 - s.owner)) });
  S('mirror_image', 'Spiegelbild', 1, { cls: 'mage', text: 'Ruft zwei Diener (0/2) mit <b>Spott</b> herbei.',
    play: (g, s) => { g.summon(s.owner, 't_mirror_image'); g.summon(s.owner, 't_mirror_image'); } });
  S('arcane_explosion', 'Arkane Explosion', 2, { cls: 'mage', text: 'Verursacht $1 Schaden bei allen feindlichen Dienern.',
    play: (g, s) => g.aoe(s, g.board(1 - s.owner), g.spellDmg(s, 1)) });
  S('frostbolt', 'Frostblitz', 2, { cls: 'mage', text: 'Verursacht $3 Schaden bei einem Charakter und <b>friert</b> ihn <b>ein</b>.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 3)); g.freeze(t); } });
  S('arcane_intellect', 'Arkane Intelligenz', 3, { cls: 'mage', text: 'Zieht 2 Karten.', play: (g, s) => g.draw(s.owner, 2) });
  S('frost_nova', 'Frostnova', 3, { cls: 'mage', text: '<b>Friert</b> alle feindlichen Diener <b>ein</b>.',
    play: (g, s) => { for (const m of g.board(1 - s.owner)) g.freeze(m); } });
  S('fireball', 'Feuerball', 4, { cls: 'mage', text: 'Verursacht $6 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 6)) });
  S('polymorph', 'Verwandlung', 4, { cls: 'mage', text: 'Verwandelt einen Diener in ein Schaf (1/1).', target: 'minion',
    play: (g, s, t) => g.transform(t, 't_sheep') });
  M('water_elemental', 'Wasserelementar', 4, 3, 6, { cls: 'mage', kw: ['freezer'], text: '<b>Friert</b> jeden Charakter <b>ein</b>, der von diesem Diener Schaden erleidet.' });
  S('flamestrike', 'Flammenstoß', 7, { cls: 'mage', text: 'Verursacht $4 Schaden bei allen feindlichen Dienern.',
    play: (g, s) => g.aoe(s, g.board(1 - s.owner), g.spellDmg(s, 4)) });
  T('t_mirror_image', 'Spiegelbild', 0, 0, 2, { cls: 'mage', kw: ['taunt'], text: '<b>Spott</b>' });
  T('t_sheep', 'Schaf', 1, 1, 1, { race: 'beast' });

  /* ===== Paladin ===== */
  S('blessing_of_might', 'Segen der Macht', 1, { cls: 'paladin', text: 'Verleiht einem Diener +3 Angriff.', target: 'minion',
    play: (g, s, t) => g.buff(t, { atk: 3 }) });
  S('hand_of_protection', 'Hand des Schutzes', 1, { cls: 'paladin', text: 'Verleiht einem Diener <b>Gottesschild</b>.', target: 'minion',
    play: (g, s, t) => g.giveKw(t, 'divineShield') });
  S('humility', 'Demut', 1, { cls: 'paladin', text: 'Setzt den Angriff eines Dieners auf 1.', target: 'minion',
    play: (g, s, t) => g.buff(t, { setAtk: 1 }) });
  W('lights_justice', 'Gerechtigkeit des Lichts', 1, 1, 4, { cls: 'paladin' });
  S('holy_light', 'Heiliges Licht', 2, { cls: 'paladin', text: 'Stellt #6 Leben wieder her.', target: 'char',
    play: (g, s, t) => g.heal(s, t, g.spellHeal(s, 6)) });
  S('blessing_of_kings', 'Segen der Könige', 4, { cls: 'paladin', text: 'Verleiht einem Diener +4/+4.', target: 'minion',
    play: (g, s, t) => g.buff(t, { atk: 4, hp: 4 }) });
  S('consecration', 'Weihe', 4, { cls: 'paladin', text: 'Verursacht $2 Schaden bei allen Feinden.',
    play: (g, s) => g.aoe(s, g.chars(1 - s.owner), g.spellDmg(s, 2)) });
  S('hammer_of_wrath', 'Hammer des Zorns', 4, { cls: 'paladin', text: 'Verursacht $3 Schaden. Zieht eine Karte.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 3)); g.draw(s.owner); } });
  W('truesilver_champion', 'Wahrsilberchampion', 4, 4, 2, { cls: 'paladin', text: 'Immer wenn Euer Held angreift, wird bei ihm 2 Leben wiederhergestellt.',
    triggers: { attack: (g, s, ev) => { if (ev.attacker === g.hero(s.owner)) g.heal(s, g.hero(s.owner), 2); } } });
  M('guardian_of_kings', 'Wächter der Könige', 7, 5, 6, { cls: 'paladin', text: '<b>Kampfschrei:</b> Stellt bei Eurem Helden 6 Leben wieder her.',
    play: (g, s) => g.heal(s, g.hero(s.owner), 6) });

  /* ===== Priester ===== */
  S('holy_smite', 'Heiliger Schlag', 1, { cls: 'priest', text: 'Verursacht $2 Schaden.', target: 'char',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 2)) });
  S('mind_vision', 'Gedankensicht', 1, { cls: 'priest', text: 'Legt eine Kopie einer zufälligen Karte aus der Hand Eures Gegners auf Eure Hand.',
    play: (g, s) => { const c = g.pick(g.hand(1 - s.owner)); if (c) g.addCard(s.owner, c.card); } });
  S('power_word_shield', 'Machtwort: Schild', 1, { cls: 'priest', text: 'Verleiht einem Diener +2 Leben. Zieht eine Karte.', target: 'minion',
    play: (g, s, t) => { g.buff(t, { hp: 2 }); g.draw(s.owner); } });
  M('northshire_cleric', 'Klerikerin von Nordhain', 1, 1, 3, { cls: 'priest', text: 'Immer wenn ein Diener geheilt wird, zieht Ihr eine Karte.',
    triggers: { heal: (g, s, ev) => { if (g.isMinion(ev.target)) g.draw(s.owner); } } });
  S('divine_spirit', 'Göttlicher Willen', 2, { cls: 'priest', text: 'Verdoppelt das Leben eines Dieners.', target: 'minion',
    play: (g, s, t) => g.buff(t, { hp: g.hp(t) }) });
  S('shadow_word_pain', 'Schattenwort: Schmerz', 2, { cls: 'priest', text: 'Vernichtet einen Diener mit 3 oder weniger Angriff.',
    target: { t: 'minion', f: (g, s, t) => g.atk(t) <= 3 }, play: (g, s, t) => g.destroy(t) });
  S('mind_blast', 'Gedankenschlag', 2, { cls: 'priest', text: 'Verursacht $5 Schaden beim feindlichen Helden.',
    play: (g, s) => g.damage(s, g.hero(1 - s.owner), g.spellDmg(s, 5)) });
  S('shadow_word_death', 'Schattenwort: Tod', 3, { cls: 'priest', text: 'Vernichtet einen Diener mit 5 oder mehr Angriff.',
    target: { t: 'minion', f: (g, s, t) => g.atk(t) >= 5 }, play: (g, s, t) => g.destroy(t) });
  S('holy_nova', 'Heilige Nova', 5, { cls: 'priest', text: 'Verursacht $2 Schaden bei allen Feinden. Stellt bei allen befreundeten Charakteren #2 Leben wieder her.',
    play: (g, s) => { g.aoe(s, g.chars(1 - s.owner), g.spellDmg(s, 2)); g.aoeHeal(s, g.chars(s.owner), g.spellHeal(s, 2)); } });
  S('mind_control', 'Gedankenkontrolle', 10, { cls: 'priest', text: 'Übernehmt die Kontrolle über einen feindlichen Diener.', target: 'enemyMinion',
    canPlay: room, play: (g, s, t) => g.control(t, s.owner) });

  /* ===== Schurke ===== */
  S('backstab', 'Meucheln', 0, { cls: 'rogue', text: 'Verursacht $2 Schaden bei einem unverletzten Diener.',
    target: { t: 'minion', f: (g, s, t) => t.damage === 0 }, play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 2)) });
  S('deadly_poison', 'Tödliches Gift', 1, { cls: 'rogue', text: 'Verleiht Eurer Waffe +2 Angriff.',
    canPlay: (g, s) => !!g.weapon(s.owner), play: (g, s) => { const w = g.weapon(s.owner); if (w) g.buff(w, { atk: 2 }); } });
  S('sinister_strike', 'Finsterer Stoß', 1, { cls: 'rogue', text: 'Verursacht $3 Schaden beim feindlichen Helden.',
    play: (g, s) => g.damage(s, g.hero(1 - s.owner), g.spellDmg(s, 3)) });
  S('sap', 'Kopfnuss', 2, { cls: 'rogue', text: 'Lasst einen feindlichen Diener auf die Hand seines Besitzers zurückkehren.', target: 'enemyMinion',
    play: (g, s, t) => g.bounce(t) });
  S('shiv', 'Messerstich', 2, { cls: 'rogue', text: 'Verursacht $1 Schaden. Zieht eine Karte.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 1)); g.draw(s.owner); } });
  S('fan_of_knives', 'Dolchfächer', 3, { cls: 'rogue', text: 'Verursacht $1 Schaden bei allen feindlichen Dienern. Zieht eine Karte.',
    play: (g, s) => { g.aoe(s, g.board(1 - s.owner), g.spellDmg(s, 1)); g.draw(s.owner); } });
  S('assassinate', 'Ermorden', 5, { cls: 'rogue', text: 'Vernichtet einen feindlichen Diener.', target: 'enemyMinion',
    play: (g, s, t) => g.destroy(t) });
  W('assassins_blade', 'Klinge des Assassinen', 5, 3, 4, { cls: 'rogue' });
  S('vanish', 'Verschwinden', 6, { cls: 'rogue', text: 'Lasst alle Diener auf die Hand ihrer Besitzer zurückkehren.',
    play: (g, s) => { for (const m of g.board()) g.bounce(m); } });
  S('sprint', 'Sprinten', 7, { cls: 'rogue', text: 'Zieht 4 Karten.', play: (g, s) => g.draw(s.owner, 4) });

  /* ===== Schamane ===== */
  S('ancestral_healing', 'Heilung der Ahnen', 0, { cls: 'shaman', text: 'Stellt bei einem Diener sämtliches Leben wieder her und verleiht ihm <b>Spott</b>.', target: 'minion',
    play: (g, s, t) => { g.heal(s, t, t.damage); g.giveKw(t, 'taunt'); } });
  S('totemic_might', 'Totemische Macht', 0, { cls: 'shaman', text: 'Verleiht Euren Totems +2 Leben.',
    play: (g, s) => { for (const m of g.board(s.owner)) if (g.isRace(m, 'totem')) g.buff(m, { hp: 2 }); } });
  S('frost_shock', 'Frostschock', 1, { cls: 'shaman', text: 'Verursacht $1 Schaden bei einem feindlichen Charakter und <b>friert</b> ihn <b>ein</b>.', target: 'enemyChar',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 1)); g.freeze(t); } });
  S('rockbiter_weapon', 'Felsbeißerwaffe', 1, { cls: 'shaman', text: 'Verleiht einem befreundeten Charakter +3 Angriff in diesem Zug.', target: 'friendlyChar',
    play: (g, s, t) => g.buff(t, { atk: 3, expire: g.eot() }) });
  S('windfury', 'Windzorn', 2, { cls: 'shaman', text: 'Verleiht einem Diener <b>Windzorn</b>.', target: 'minion',
    play: (g, s, t) => g.giveKw(t, 'windfury') });
  M('flametongue_totem', 'Totem der Flammenzunge', 2, 0, 3, { cls: 'shaman', race: 'totem', positional: true, text: 'Benachbarte Diener haben +2 Angriff.',
    aura: (g, s, t) => (g.isMinion(t) && t.owner === s.owner && g.adj(s).includes(t) ? { atk: 2 } : null) });
  S('hex', 'Verhexung', 3, { cls: 'shaman', text: 'Verwandelt einen Diener in einen Frosch (0/1) mit <b>Spott</b>.', target: 'minion',
    play: (g, s, t) => g.transform(t, 't_frog') });
  M('windspeaker', 'Windsprecher', 4, 3, 3, { cls: 'shaman', text: '<b>Kampfschrei:</b> Verleiht einem befreundeten Diener <b>Windzorn</b>.',
    target: 'friendlyMinion', play: (g, s, t) => { if (t) g.giveKw(t, 'windfury'); } });
  S('bloodlust', 'Kampfrausch', 5, { cls: 'shaman', text: 'Verleiht Euren Dienern +3 Angriff in diesem Zug.',
    play: (g, s) => { for (const m of g.board(s.owner)) g.buff(m, { atk: 3, expire: g.eot() }); } });
  M('fire_elemental', 'Feuerelementar', 6, 6, 5, { cls: 'shaman', text: '<b>Kampfschrei:</b> Verursacht 3 Schaden.',
    target: 'char', play: (g, s, t) => { if (t) g.damage(s, t, 3); } });
  T('t_frog', 'Frosch', 0, 0, 1, { race: 'beast', kw: ['taunt'], text: '<b>Spott</b>' });

  /* ===== Hexenmeister ===== */
  S('sacrificial_pact', 'Opferpakt', 0, { cls: 'warlock', text: 'Vernichtet einen Dämon. Stellt bei Eurem Helden #5 Leben wieder her.',
    target: { t: 'char', f: (g, s, t) => g.isRace(t, 'demon') },
    play: (g, s, t) => {
      if (g.isHero(t)) t.damage = g.maxHp(t) + t.armor; else g.destroy(t);
      g.heal(s, g.hero(s.owner), g.spellHeal(s, 5));
    } });
  HS.lib.E('e_corruption', { triggers: { turnStart: (g, e, ev, x) => { if (ev.player === x.by) g.destroy(e); } } });
  S('corruption', 'Verderbnis', 1, { cls: 'warlock', text: 'Wählt einen feindlichen Diener. Zu Beginn Eures Zuges wird er vernichtet.', target: 'enemyMinion',
    play: (g, s, t) => g.buff(t, { card: 'e_corruption', by: s.owner }) });
  S('mortal_coil', 'Todesmantel', 1, { cls: 'warlock', text: 'Verursacht $1 Schaden bei einem Diener. Zieht eine Karte, wenn er dadurch stirbt.', target: 'minion',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 1)); if (g.hp(t) <= 0 || t.dead) g.draw(s.owner); } });
  S('soulfire', 'Seelenfeuer', 1, { cls: 'warlock', text: 'Verursacht $4 Schaden. Werft eine zufällige Karte ab.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 4)); g.discardRandom(s.owner); } });
  M('voidwalker', 'Leerwandler', 1, 1, 3, { cls: 'warlock', race: 'demon', kw: ['taunt'], text: '<b>Spott</b>' });
  M('succubus', 'Sukkubus', 2, 4, 3, { cls: 'warlock', race: 'demon', text: '<b>Kampfschrei:</b> Werft eine zufällige Karte ab.',
    play: (g, s) => g.discardRandom(s.owner) });
  S('drain_life', 'Lebenssauger', 3, { cls: 'warlock', text: 'Verursacht $2 Schaden. Stellt bei Eurem Helden #2 Leben wieder her.', target: 'char',
    play: (g, s, t) => { g.damage(s, t, g.spellDmg(s, 2)); g.heal(s, g.hero(s.owner), g.spellHeal(s, 2)); } });
  S('shadow_bolt', 'Schattenblitz', 3, { cls: 'warlock', text: 'Verursacht $4 Schaden bei einem Diener.', target: 'minion',
    play: (g, s, t) => g.damage(s, t, g.spellDmg(s, 4)) });
  S('hellfire', 'Höllenfeuer', 4, { cls: 'warlock', text: 'Verursacht $3 Schaden bei ALLEN Charakteren.',
    play: (g, s) => g.aoe(s, g.chars(), g.spellDmg(s, 3)) });
  M('dread_infernal', 'Schreckensinfernal', 6, 6, 6, { cls: 'warlock', race: 'demon', text: '<b>Kampfschrei:</b> Verursacht 1 Schaden bei ALLEN anderen Charakteren.',
    play: (g, s) => g.aoe(s, g.chars().filter((c) => c !== s), 1) });

  /* ===== Krieger ===== */
  S('execute', 'Hinrichten', 1, { cls: 'warrior', text: 'Vernichtet einen verletzten feindlichen Diener.',
    target: { t: 'enemyMinion', f: (g, s, t) => t.damage > 0 }, play: (g, s, t) => g.destroy(t) });
  S('whirlwind', 'Wirbelwind', 1, { cls: 'warrior', text: 'Verursacht $1 Schaden bei ALLEN Dienern.',
    play: (g, s) => g.aoe(s, g.board(), g.spellDmg(s, 1)) });
  W('fiery_war_axe', 'Feurige Kriegsaxt', 2, 3, 2, { cls: 'warrior' });
  S('cleave', 'Spalten', 2, { cls: 'warrior', text: 'Verursacht $2 Schaden bei zwei zufälligen feindlichen Dienern.',
    canPlay: (g, s) => g.board(1 - s.owner).length >= 2,
    play: (g, s) => g.aoe(s, g.pickN(g.board(1 - s.owner), 2), g.spellDmg(s, 2)) });
  S('heroic_strike', 'Heldenhafter Stoß', 2, { cls: 'warrior', text: 'Verleiht Eurem Helden +4 Angriff in diesem Zug.',
    play: (g, s) => g.buff(g.hero(s.owner), { atk: 4, expire: g.eot() }) });
  S('charge', 'Sturmangriff', 3, { cls: 'warrior', text: 'Verleiht einem befreundeten Diener +2 Angriff und <b>Ansturm</b>.', target: 'friendlyMinion',
    play: (g, s, t) => { g.buff(t, { atk: 2 }); g.giveKw(t, 'charge'); } });
  S('shield_block', 'Schildblock', 3, { cls: 'warrior', text: 'Erhaltet 5 Rüstung. Zieht eine Karte.',
    play: (g, s) => { g.gainArmor(s.owner, 5); g.draw(s.owner); } });
  M('warsong_commander', 'Kommandant der Kriegshymnenfeste', 3, 2, 3, { cls: 'warrior', text: 'Immer wenn Ihr einen Diener mit 3 oder weniger Angriff herbeiruft, erhält er <b>Ansturm</b>.',
    triggers: { summon: (g, s, ev) => { const m = ev.minion; if (m !== s && m.owner === s.owner && g.atk(m) <= 3) g.giveKw(m, 'charge'); } } });
  M('korkron_elite', 'Elitekämpfer der Kor\'kron', 4, 4, 3, { cls: 'warrior', kw: ['charge'], text: '<b>Ansturm</b>' });
  W('arcanite_reaper', 'Arkanitschnitter', 5, 5, 2, { cls: 'warrior' });

  /* ===== Neutral ===== */
  M('elven_archer', 'Elfenschützin', 1, 1, 1, { text: '<b>Kampfschrei:</b> Verursacht 1 Schaden.', target: 'char', play: (g, s, t) => { if (t) g.damage(s, t, 1); } });
  M('goldshire_footman', 'Fußsoldat aus Goldhain', 1, 1, 2, { kw: ['taunt'], text: '<b>Spott</b>' });
  M('grimscale_oracle', 'Orakel der Grimmschuppen', 1, 1, 1, { race: 'murloc', text: 'ALLE anderen Murlocs haben +1 Angriff.',
    aura: (g, s, t) => (t !== s && g.isMinion(t) && g.isRace(t, 'murloc') ? { atk: 1 } : null) });
  M('murloc_raider', 'Murlocräuber', 1, 2, 1, { race: 'murloc' });
  M('stonetusk_boar', 'Steinhauereber', 1, 1, 1, { race: 'beast', kw: ['charge'], text: '<b>Ansturm</b>' });
  M('voodoo_doctor', 'Voodoodoktor', 1, 2, 1, { text: '<b>Kampfschrei:</b> Stellt 2 Leben wieder her.', target: 'char', play: (g, s, t) => { if (t) g.heal(s, t, 2); } });
  M('acidic_swamp_ooze', 'Säureschlammer', 2, 3, 2, { text: '<b>Kampfschrei:</b> Zerstört die Waffe Eures Gegners.',
    play: (g, s) => { const w = g.weapon(1 - s.owner); if (w) g.destroy(w); } });
  M('bloodfen_raptor', 'Blutsumpfraptor', 2, 3, 2, { race: 'beast' });
  M('bluegill_warrior', 'Blaukiemenkrieger', 2, 2, 1, { race: 'murloc', kw: ['charge'], text: '<b>Ansturm</b>' });
  M('frostwolf_grunt', 'Grunzer der Frostwölfe', 2, 2, 2, { kw: ['taunt'], text: '<b>Spott</b>' });
  M('kobold_geomancer', 'Koboldgeomant', 2, 2, 2, { spellDamage: 1, text: '<b>Zauberschaden +1</b>' });
  M('murloc_tidehunter', 'Murlocgezeitenjäger', 2, 2, 1, { race: 'murloc', text: '<b>Kampfschrei:</b> Ruft einen Murlocspäher (1/1) herbei.',
    play: (g, s) => g.summonNext(s, 't_murloc_scout') });
  M('novice_engineer', 'Ingenieurlehrling', 2, 1, 1, { text: '<b>Kampfschrei:</b> Zieht eine Karte.', play: (g, s) => g.draw(s.owner) });
  M('river_crocolisk', 'Flusskrokilisk', 2, 2, 3, { race: 'beast' });
  M('dalaran_mage', 'Magier von Dalaran', 3, 1, 4, { spellDamage: 1, text: '<b>Zauberschaden +1</b>' });
  M('ironforge_rifleman', 'Schütze aus Eisenschmiede', 3, 2, 2, { text: '<b>Kampfschrei:</b> Verursacht 1 Schaden.', target: 'char', play: (g, s, t) => { if (t) g.damage(s, t, 1); } });
  M('ironfur_grizzly', 'Eisenpelzgrizzly', 3, 3, 3, { race: 'beast', kw: ['taunt'], text: '<b>Spott</b>' });
  M('magma_rager', 'Magmawüterich', 3, 5, 1);
  M('raid_leader', 'Schlachtzugsleiter', 3, 2, 2, { text: 'Eure anderen Diener haben +1 Angriff.',
    aura: (g, s, t) => (t !== s && t.owner === s.owner && g.isMinion(t) ? { atk: 1 } : null) });
  M('razorfen_hunter', 'Jäger der Klingenhauer', 3, 2, 3, { text: '<b>Kampfschrei:</b> Ruft einen Eber (1/1) herbei.', play: (g, s) => g.summonNext(s, 't_boar') });
  M('shattered_sun_cleric', 'Klerikerin der Zerschmetterten Sonne', 3, 3, 2, { text: '<b>Kampfschrei:</b> Verleiht einem befreundeten Diener +1/+1.',
    target: 'friendlyMinion', play: (g, s, t) => { if (t) g.buff(t, { atk: 1, hp: 1 }); } });
  M('silverback_patriarch', 'Silberrückenpatriarch', 3, 1, 4, { race: 'beast', kw: ['taunt'], text: '<b>Spott</b>' });
  M('wolfrider', 'Wolfsreiter', 3, 3, 1, { kw: ['charge'], text: '<b>Ansturm</b>' });
  M('chillwind_yeti', 'Yeti des Frostwinds', 4, 4, 5);
  M('dragonling_mechanic', 'Drachenmechaniker', 4, 2, 4, { text: '<b>Kampfschrei:</b> Ruft einen Mechanischen Drachling (2/1) herbei.',
    play: (g, s) => g.summonNext(s, 't_mechanical_dragonling') });
  M('gnomish_inventor', 'Gnomischer Erfinder', 4, 2, 4, { text: '<b>Kampfschrei:</b> Zieht eine Karte.', play: (g, s) => g.draw(s.owner) });
  M('oasis_snapjaw', 'Oasenschnappkiefer', 4, 2, 7, { race: 'beast' });
  M('ogre_magi', 'Ogermagier', 4, 4, 4, { spellDamage: 1, text: '<b>Zauberschaden +1</b>' });
  M('senjin_shieldmasta', 'Schildmeister von Sen\'jin', 4, 3, 5, { kw: ['taunt'], text: '<b>Spott</b>' });
  M('stormwind_knight', 'Ritter von Sturmwind', 4, 2, 5, { kw: ['charge'], text: '<b>Ansturm</b>' });
  M('booty_bay_bodyguard', 'Leibwächter von Beutebucht', 5, 5, 4, { kw: ['taunt'], text: '<b>Spott</b>' });
  M('darkscale_healer', 'Heilerin der Dunkelschuppen', 5, 4, 5, { text: '<b>Kampfschrei:</b> Stellt bei allen befreundeten Charakteren 2 Leben wieder her.',
    play: (g, s) => g.aoeHeal(s, g.chars(s.owner), 2) });
  M('frostwolf_warlord', 'Kriegsfürst der Frostwölfe', 5, 4, 4, { text: '<b>Kampfschrei:</b> Erhält +1/+1 für jeden anderen befreundeten Diener auf dem Schlachtfeld.',
    play: (g, s) => { const n = g.others(s).length; if (n) g.buff(s, { atk: n, hp: n }); } });
  M('gurubashi_berserker', 'Berserker der Gurubashi', 5, 2, 7, { text: 'Immer wenn dieser Diener Schaden erleidet, erhält er +3 Angriff.',
    triggers: { damage: (g, s, ev) => { if (ev.target === s) g.buff(s, { atk: 3 }); } } });
  M('nightblade', 'Nachtklinge', 5, 4, 4, { text: '<b>Kampfschrei:</b> Verursacht 3 Schaden beim feindlichen Helden.',
    play: (g, s) => g.damage(s, g.hero(1 - s.owner), 3) });
  M('stormpike_commando', 'Kommandosoldat der Sturmlanzen', 5, 4, 2, { text: '<b>Kampfschrei:</b> Verursacht 2 Schaden.', target: 'char', play: (g, s, t) => { if (t) g.damage(s, t, 2); } });
  M('archmage', 'Erzmagier', 6, 4, 7, { spellDamage: 1, text: '<b>Zauberschaden +1</b>' });
  M('boulderfist_ogre', 'Felsfaustoger', 6, 6, 7);
  M('lord_of_the_arena', 'Herr der Arena', 6, 6, 5, { kw: ['taunt'], text: '<b>Spott</b>' });
  M('reckless_rocketeer', 'Tollkühner Raketenreiter', 6, 5, 2, { kw: ['charge'], text: '<b>Ansturm</b>' });
  M('core_hound', 'Kernhund', 7, 9, 5, { race: 'beast' });
  M('stormwind_champion', 'Champion von Sturmwind', 7, 6, 6, { text: 'Eure anderen Diener haben +1/+1.',
    aura: (g, s, t) => (t !== s && t.owner === s.owner && g.isMinion(t) ? { atk: 1, hp: 1 } : null) });
  M('war_golem', 'Kriegsgolem', 7, 7, 7);

  T('t_murloc_scout', 'Murlocspäher', 0, 1, 1, { race: 'murloc' });
  T('t_boar', 'Eber', 1, 1, 1, { race: 'beast' });
  T('t_mechanical_dragonling', 'Mechanischer Drachling', 1, 2, 1, { race: 'mech' });
})();
