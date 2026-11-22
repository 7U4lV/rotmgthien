const tipEl = document.getElementById('ui-tooltip');
let tipTimer = null;
function showTip(el) {
    const t = el.getAttribute('data-tip');
    if (!t) return;
    tipEl.textContent = t;
    tipEl.style.display = 'block';
    const r = el.getBoundingClientRect();
    tipEl.style.left = Math.min(window.innerWidth - tipEl.offsetWidth - 8, Math.max(8, r.left + r.width / 2 - tipEl.offsetWidth / 2)) + 'px';
    tipEl.style.top = Math.max(8, r.bottom + 6) + 'px';
    clearTimeout(tipTimer);
    tipTimer = setTimeout(hideTip, 2000);
}
function hideTip() { tipEl.style.display = 'none'; }

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
function resizeCanvas() {
    const r = document.getElementById('game-frame').getBoundingClientRect();
    canvas.width = Math.max(360, Math.round(r.width));
    canvas.height = Math.max(640, Math.round(r.height));
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let myName = 'Hành Giả', myX = 900, myY = 760, tx = 900, ty = 760;
let isMed = false, walk = 0, chatMsg = '', chatTicks = 0;
const keys = {};

window.addEventListener('keydown', e => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    const k = e.key.toLowerCase(); keys[k] = true;
    if (e.code === 'Space') { e.preventDefault(); toggleMeditate(); }
    else if (k === 'm') toggleMusic();
    else if (e.key === 'Enter') document.getElementById('chat-input').focus();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

canvas.addEventListener('pointerdown', e => {
    if (isMed) return;
    const r = canvas.getBoundingClientRect();
    tx = (e.clientX - r.left) - (canvas.width / 2 - myX);
    ty = (e.clientY - r.top) - (canvas.height / 2 - myY);
});

function toggleMeditate() {
    isMed = !isMed;
    document.getElementById('btn-meditate').classList.toggle('active', isMed);
    if (isMed) { tx = myX; ty = myY; }
}

function sendChat() {
    const inp = document.getElementById('chat-input');
    const v = inp.value.trim();
    if (v) { chatMsg = v; chatTicks = 300; }
    inp.value = ''; inp.blur();
}
function onChatKey(e) { if (e.key === 'Enter') sendChat(); }

function enterGame() {
    myName = (document.getElementById('name-input').value || '').trim() || 'Hành Giả';
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-dock').style.display = 'flex';
    startP2P();
}

function stepSim() {
    if (!isMed) {
        let vx = 0, vy = 0; const spd = 3.5;
        if (keys['w'] || keys['arrowup']) vy -= 1;
        if (keys['s'] || keys['arrowdown']) vy += 1;
        if (keys['a'] || keys['arrowleft']) vx -= 1;
        if (keys['d'] || keys['arrowright']) vx += 1;
        if (vx || vy) {
            const l = Math.hypot(vx, vy);
            myX = Math.max(30, Math.min(MAP_W - 30, myX + (vx / l) * spd));
            myY = Math.max(190, Math.min(MAP_H - 30, myY + (vy / l) * spd));
            tx = myX; ty = myY; walk += 0.25;
        } else {
            const dx = tx - myX, dy = ty - myY, d = Math.hypot(dx, dy);
            if (d > spd) { myX += (dx / d) * spd; myY += (dy / d) * spd; walk += 0.25; }
            else walk = 0;
        }
    }
    for (const id in remotes) {
        const rp = remotes[id], dx = rp.tx - rp.x, dy = rp.ty - rp.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) { rp.x += dx * 0.25; rp.y += dy * 0.25; rp.walk += 0.22; }
        else { rp.x = rp.tx; rp.y = rp.ty; rp.walk = 0; }
    }
    if (chatTicks > 0 && --chatTicks === 0) chatMsg = '';
}

let lastIdleFrame = 0, fpsCnt = 0, fpsTick = performance.now();
const list = [];

function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) return;

    const isMoving = !isMed && (walk > 0 || keys['w'] || keys['a'] || keys['s'] || keys['d'] || keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'] || Math.hypot(tx - myX, ty - myY) > 3.5);
    if (!isMoving && (now - lastIdleFrame < IDLE_FRAME_MS)) return;
    lastIdleFrame = now;

    fpsCnt++;
    if (now - fpsTick >= 1000) {
        document.getElementById('hud-fps').textContent = fpsCnt + ' FPS';
        fpsCnt = 0; fpsTick = now;
    }

    const d = new Date(Date.now() + 7 * 3600000);
    const h = d.getUTCHours(), m = d.getUTCMinutes();
    document.getElementById('hud-clock').textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    const night = (h >= 18 || h < 6);

    stepSim();
    buildMap(night);

    const camX = Math.floor(canvas.width / 2 - myX);
    const camY = Math.floor(canvas.height / 2 - myY);
    const left = -camX, top = -camY, right = left + canvas.width, bottom = top + canvas.height;

    ctx.save();
    ctx.translate(camX, camY);
    const sx = Math.max(0, left), sy = Math.max(0, top);
    const sw = Math.min(MAP_W, right) - sx, sh = Math.min(MAP_H, bottom) - sy;
    if (sw > 0 && sh > 0) ctx.drawImage(staticCanvas, sx, sy, sw, sh, sx, sy, sw, sh);

    list.length = 0;
    list.push({ x: myX, y: myY, name: myName, cfg, med: isMed, walk, chat: chatMsg });
    for (const id in remotes) {
        const rp = remotes[id];
        if (rp.x >= left - 72 && rp.x <= right + 72 && rp.y >= top - 90 && rp.y <= bottom + 72) {
            list.push(rp);
            if (list.length >= MAX_RENDER) break;
        }
    }
    list.sort((a, b) => a.y - b.y);
    for (let i = 0; i < list.length; i++) drawPerson(ctx, list[i], now);
    ctx.restore();
}

initCreator();
requestAnimationFrame(loop);
