let peer = null, syncTimer = null, seq = 0;
const conns = {}, remotes = {}, profiles = {}, seen = new Set();

function makePeer(id) {
    const p = id ? new Peer(id) : new Peer();
    p.on('open', () => {
        if (p.id !== ROOM_ID) connectTo(ROOM_ID);
        startSync();
    });
    p.on('disconnected', () => { try { if (!p.destroyed) p.reconnect(); } catch (_) {} });
    p.on('error', err => {
        if (err && err.type === 'unavailable-id' && id) { try { p.destroy(); } catch (_) {} peer = makePeer(null); }
        else startSync();
    });
    p.on('connection', bindConn);
    return p;
}

function startP2P() {
    if (typeof Peer === 'undefined') return;
    peer = makePeer(ROOM_ID);
}

function connectTo(id) {
    if (!id || !peer || peer.destroyed || conns[id] || id === peer.id || Object.keys(conns).length >= MAX_CONNS) return;
    try { bindConn(peer.connect(id, { reliable: false })); } catch (_) {}
}

function bindConn(conn) {
    conns[conn.peer] = conn;
    conn.on('open', () => {
        if (conn.open) conn.send({ t: 'P', id: peer.id, n: myName, c: cfg });
        const peers = Object.keys(conns).filter(x => x !== conn.peer).slice(0, 10);
        if (peers.length && conn.open) conn.send({ t: 'L', l: peers });
    });
    conn.on('data', d => {
        if (!d || !d.t) return;
        if (d.t === 'L' && Array.isArray(d.l)) d.l.forEach(connectTo);
        else if (d.t === 'P') {
            profiles[d.id] = { n: d.n || 'Hành Giả', c: d.c || cfg };
            if (remotes[d.id]) { remotes[d.id].name = profiles[d.id].n; remotes[d.id].cfg = profiles[d.id].c; }
        } else if (d.t === 'M') {
            if (d.mid) {
                if (seen.has(d.mid)) return;
                seen.add(d.mid);
                if (seen.size > 1200) seen.delete(seen.values().next().value);
            }
            const pr = profiles[d.id] || { n: 'Hành Giả', c: cfg };
            let rp = remotes[d.id];
            if (!rp) {
                rp = remotes[d.id] = { id: d.id, name: pr.n, cfg: pr.c, x: d.x, y: d.y, tx: d.x, ty: d.y, med: !!(d.f & 1), walk: 0, chat: d.ch || '', ts: Date.now() };
                if (!profiles[d.id] && conn.open) conn.send({ t: 'QP', target: d.id });
            } else {
                rp.tx = d.x; rp.ty = d.y; rp.med = !!(d.f & 1); rp.chat = d.ch || ''; rp.ts = Date.now();
            }
            if ((d.h || 0) < 3) {
                for (const k in conns) if (k !== conn.peer && conns[k] && conns[k].open) conns[k].send(Object.assign({}, d, { h: (d.h || 0) + 1 }));
            }
            document.getElementById('hud-online').textContent = '● ' + (1 + Object.keys(remotes).length);
        } else if (d.t === 'QP' && conn.open) {
            if (d.target === peer.id) conn.send({ t: 'P', id: peer.id, n: myName, c: cfg });
            else if (profiles[d.target]) conn.send({ t: 'P', id: d.target, n: profiles[d.target].n, c: profiles[d.target].c });
        }
    });
    conn.on('close', () => { delete conns[conn.peer]; });
    conn.on('error', () => { delete conns[conn.peer]; });
}

function startSync() {
    if (syncTimer) return;
    syncTimer = setInterval(() => {
        if (!peer || peer.destroyed || !peer.id) return;
        if (peer.disconnected) { try { peer.reconnect(); } catch (_) {} }
        const flags = (isMed ? 1 : 0) | ((!isMed && walk > 0) ? 2 : 0);
        const pkt = { t: 'M', mid: `${peer.id}_${++seq}`, id: peer.id, x: Math.round(myX), y: Math.round(myY), f: flags, ch: chatMsg, h: 0 };
        for (const k in conns) if (conns[k] && conns[k].open) conns[k].send(pkt);

        const now = Date.now();
        let remChanged = false;
        for (const id in remotes) if (now - remotes[id].ts > 22000) { delete remotes[id]; remChanged = true; }
        if (remChanged) document.getElementById('hud-online').textContent = '● ' + (1 + Object.keys(remotes).length);
        if (peer.id !== ROOM_ID && (!conns[ROOM_ID] || !conns[ROOM_ID].open)) { delete conns[ROOM_ID]; connectTo(ROOM_ID); }
    }, 250);
}
