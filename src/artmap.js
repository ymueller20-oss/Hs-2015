/* Liste der vorhandenen Kartenbilder (art/<karten-id>.jpg). Wird vom Bild-Skript gepflegt. */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : global;
  const HS = root.HS;
  HS.ART_IDS = ['abusive_sergeant','aldor_peacekeeper','ancient_of_lore','ancient_of_war','animal_companion','annoy_o_tron','arcane_golem','arcane_missiles','arcane_shot','archmage_antonidas','auchenai_soulpriest','avenging_wrath','azure_drake','big_game_hunter','chillwind_yeti','circle_of_healing','clockwork_gnome','cogmaster','consecration','deathlord','dr_boom','druid_of_the_claw','eaglehorn_bow','emperor_thaurissan','equality','explosive_trap','fireball','flamecannon','force_of_nature','freezing_trap','frostbolt','goblin_blastmage','haunted_creeper','holy_nova','innervate','ironbeak_owl','keeper_of_the_grove','kill_command','knife_juggler','leeroy_jenkins','leper_gnome','loatheb','mad_scientist','mechwarper','mind_control_tech','muster_for_battle','northshire_cleric','piloted_shredder','piloted_sky_golem','power_word_shield','quartermaster','quick_shot','ragnaros_the_firelord','savage_roar','shadow_word_death','shadow_word_pain','shielded_minibot','sludge_belcher','snowchugger','solemn_vigil','spider_tank','swipe','sylvanas_windrunner','tirion_fordring','truesilver_champion','unleash_the_hounds','unstable_portal','velens_chosen','wild_growth','wrath','zombie_chow'];
  const set = new Set(HS.ART_IDS);
  HS.artUrl = (id) => (set.has(id) ? 'art/' + id + '.jpg' : null);
})();
