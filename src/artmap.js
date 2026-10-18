/* Liste der vorhandenen Kartenbilder (art/<karten-id>.jpg). Wird vom Bild-Skript gepflegt. */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : global;
  const HS = root.HS;
  HS.ART_IDS = [];
  const set = new Set(HS.ART_IDS);
  HS.artUrl = (id) => (set.has(id) ? 'art/' + id + '.jpg' : null);
})();
