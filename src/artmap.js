/* Liste der vorhandenen Kartenbilder (art/<karten-id>.jpg). Wird vom Bild-Skript gepflegt. */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : global;
  const HS = root.HS;
  HS.ART_IDS = ['abusive_sergeant','ancient_of_lore','ancient_of_war','animal_companion','annoy_o_tron','arcane_golem','arcane_missiles','arcane_shot','archmage_antonidas','azure_drake','big_game_hunter','chillwind_yeti','clockwork_gnome','cogmaster','dr_boom','druid_of_the_claw','eaglehorn_bow','emperor_thaurissan','explosive_trap','fireball','flamecannon','force_of_nature','freezing_trap','frostbolt','goblin_blastmage','haunted_creeper','innervate','ironbeak_owl','keeper_of_the_grove','kill_command','knife_juggler','leeroy_jenkins','leper_gnome','loatheb','mad_scientist','mechwarper','mind_control_tech','piloted_shredder','piloted_sky_golem','quick_shot','savage_roar','snowchugger','spider_tank','swipe','sylvanas_windrunner','unleash_the_hounds','unstable_portal','wild_growth','wrath','zombie_chow'];
  const set = new Set(HS.ART_IDS);
  HS.artUrl = (id) => (set.has(id) ? 'art/' + id + '.jpg' : null);
})();
