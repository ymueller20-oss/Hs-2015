const path = require('path');
const files = ['engine.js','cards/_lib.js','cards/basic.js','cards/classic_class.js','cards/classic_neutral.js','cards/naxx.js','cards/gvg.js','cards/brm.js','cards/conditions.js','ai.js','decks.js'];
for (const f of files) { const p = path.join(__dirname,'..','src',f); try { require(p); } catch(e) { if (e.code!=='MODULE_NOT_FOUND') throw e; } }
module.exports = global.HS;
