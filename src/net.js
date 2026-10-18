/* Online-Duell: spricht mit server.js (Räume, Server-Sent Events) */
(function () {
  'use strict';
  const HS = window.HS;

  async function post(url, data) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Verbindungsfehler');
    return j;
  }

  HS.Net = {
    session: null,
    es: null,
    handlers: null,
    available() { return location.protocol.startsWith('http'); },
    async create(deck, handlers) {
      const r = await post('/api/room', { deck });
      this.connect(r, handlers);
      return r;
    },
    async join(code, deck, handlers) {
      const r = await post(`/api/room/${encodeURIComponent(code.trim().toUpperCase())}/join`, { deck });
      this.connect(r, handlers);
      return r;
    },
    connect(sess, handlers) {
      this.close();
      this.session = sess;
      this.handlers = handlers;
      try { sessionStorage.setItem('hs2015_session', JSON.stringify(sess)); } catch (e) { /* egal */ }
      const es = new EventSource(`/api/room/${sess.room}/events?token=${encodeURIComponent(sess.token)}`);
      this.es = es;
      es.onmessage = (m) => {
        let ev;
        try { ev = JSON.parse(m.data); } catch (e) { return; }
        if (this.handlers && this.handlers.event) this.handlers.event(ev);
      };
      es.onerror = () => { if (this.handlers && this.handlers.error) this.handlers.error(); };
    },
    resume(handlers) {
      let s = null;
      try { s = JSON.parse(sessionStorage.getItem('hs2015_session') || 'null'); } catch (e) { s = null; }
      if (!s) return false;
      this.connect(s, handlers);
      return true;
    },
    async send(action) {
      const s = this.session;
      if (!s) throw new Error('Keine Verbindung');
      return post(`/api/room/${s.room}/action`, { token: s.token, action });
    },
    close() {
      if (this.es) this.es.close();
      this.es = null;
      this.session = null;
    },
    forget() {
      this.close();
      try { sessionStorage.removeItem('hs2015_session'); } catch (e) { /* egal */ }
    },
  };
})();
