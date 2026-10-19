/* KI im Hintergrund-Thread, damit die Oberfläche nicht einfriert */
importScripts('engine.js', 'cards/_lib.js', 'cards/basic.js', 'cards/classic_class.js', 'cards/classic_neutral.js', 'cards/naxx.js', 'cards/gvg.js', 'cards/brm.js', 'cards/conditions.js', 'ai.js');
onmessage = (e) => {
  const g = new self.HS.Game(e.data.s);
  let a;
  try { a = self.HS.AI.choose(g, e.data.pi); } catch (err) { a = { type: 'end' }; }
  postMessage({ id: e.data.id, a });
};
