/* Duell-Server ohne Abhängigkeiten: node server.js  (Port über PORT, Standard 8080)
 * - liefert das Spiel als statische Seite aus
 * - Räume mit 5-stelligem Code; beide Spieler schicken nur Aktionen
 * - der Server spielt jede Aktion mit derselben Engine nach und lehnt ungültige ab
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
for (const f of ['engine.js', 'cards/_lib.js', 'cards/basic.js', 'cards/classic_class.js', 'cards/classic_neutral.js', 'cards/naxx.js', 'cards/gvg.js', 'cards/brm.js', 'cards/conditions.js', 'ai.js', 'decks.js']) {
  require(path.join(ROOT, 'src', f));
}
const HS = global.HS;

const rooms = new Map();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

function code() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c;
  do { c = Array.from({ length: 5 }, () => A[crypto.randomInt(A.length)]).join(''); } while (rooms.has(c));
  return c;
}
function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function body(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => { d += c; if (d.length > 1e5) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (e) { resolve({}); } });
  });
}
function cleanDeck(d) {
  if (!d || typeof d !== 'object') return null;
  const cls = String(d.cls || '');
  const cards = Array.isArray(d.cards) ? d.cards.map(String) : [];
  if (HS.validateDeck(cls, cards).length) return null;
  return { cls, cards, name: String(d.player || HS.CLASSES[cls].name).slice(0, 24) };
}
function broadcast(room, ev) {
  room.events.push(ev);
  const line = `data: ${JSON.stringify(ev)}\n\n`;
  for (const c of room.clients) c.res.write(line);
}
function start(room) {
  const seed = crypto.randomInt(1, 2147483646);
  const first = crypto.randomInt(2);
  room.game = HS.Game.create({ decks: room.decks, seed, first });
  broadcast(room, { type: 'start', seed, first, decks: room.decks });
}

async function api(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // api, room, CODE, action
  if (req.method === 'POST' && parts.length === 2 && parts[1] === 'room') {
    const b = await body(req);
    const deck = cleanDeck(b.deck);
    if (!deck) return send(res, 400, { error: 'Ungültiges Deck.' });
    const id = code();
    const room = { id, decks: [deck, null], tokens: [crypto.randomUUID(), null], events: [], clients: new Set(), game: null, touched: Date.now() };
    rooms.set(id, room);
    return send(res, 200, { room: id, seat: 0, token: room.tokens[0] });
  }
  const room = rooms.get((parts[2] || '').toUpperCase());
  if (!room) return send(res, 404, { error: 'Raum nicht gefunden.' });
  room.touched = Date.now();
  const action = parts[3];
  if (req.method === 'POST' && action === 'join') {
    const b = await body(req);
    if (room.tokens[1]) return send(res, 409, { error: 'Der Raum ist bereits voll.' });
    const deck = cleanDeck(b.deck);
    if (!deck) return send(res, 400, { error: 'Ungültiges Deck.' });
    room.decks[1] = deck;
    room.tokens[1] = crypto.randomUUID();
    send(res, 200, { room: room.id, seat: 1, token: room.tokens[1] });
    start(room);
    return;
  }
  if (req.method === 'GET' && action === 'events') {
    const seat = room.tokens.indexOf(url.searchParams.get('token'));
    if (seat < 0) return send(res, 403, { error: 'Kein Zugriff.' });
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write(`data: ${JSON.stringify({ type: 'hello', seat, room: room.id, waiting: !room.game })}\n\n`);
    for (const ev of room.events) res.write(`data: ${JSON.stringify(ev)}\n\n`);
    const client = { res, seat };
    room.clients.add(client);
    const ping = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => { clearInterval(ping); room.clients.delete(client); });
    return;
  }
  if (req.method === 'POST' && action === 'action') {
    const b = await body(req);
    const seat = room.tokens.indexOf(b.token);
    if (seat < 0) return send(res, 403, { error: 'Kein Zugriff.' });
    if (!room.game) return send(res, 409, { error: 'Das Spiel hat noch nicht begonnen.' });
    const a = b.action;
    if (!a || typeof a !== 'object') return send(res, 400, { error: 'Aktion fehlt.' });
    let ok = false;
    try { ok = HS.applyAction(room.game, seat, a); } catch (e) { ok = false; console.error(e); }
    if (!ok) return send(res, 409, { error: 'Ungültige Aktion.' });
    broadcast(room, { type: 'action', seat, action: a, n: room.events.length });
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: 'Unbekannt.' });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/ping') return send(res, 200, { duel: true });
  if (url.pathname.startsWith('/api/')) {
    api(req, res, url).catch((e) => { console.error(e); send(res, 500, { error: 'Serverfehler.' }); });
    return;
  }
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep) || /[\\/]\./.test(path.relative(ROOT, file)) || p.startsWith('/test') || p === '/server.js') {
    res.writeHead(404); return res.end('Nicht gefunden');
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Nicht gefunden'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [id, r] of rooms) if (now - r.touched > 3 * 3600 * 1000 && !r.clients.size) rooms.delete(id);
}, 600000).unref();

const PORT = +process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server läuft: http://localhost:${PORT}`));
