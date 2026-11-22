function pad20(rows) {
    return rows.map(s => s.length === 20 ? s : s.padEnd(20, '.').slice(0, 20));
}

function bakePixelMatrix(grid, pal, ps = 3, outline = true) {
    const clean = pad20(grid);
    const h = clean.length, w = 20, pad = outline ? 1 : 0;
    const c = document.createElement('canvas');
    c.width = (w + pad * 2) * ps;
    c.height = (h + pad * 2) * ps;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;

    if (outline) {
        cx.fillStyle = '#0c0e0c';
        for (let r = 0; r < h; r++) {
            for (let col = 0; col < w; col++) {
                const ch = clean[r][col];
                if (ch !== '.' && pal[ch]) {
                    const gx = (col + pad) * ps, gy = (r + pad) * ps;
                    cx.fillRect(gx - ps, gy, ps, ps);
                    cx.fillRect(gx + ps, gy, ps, ps);
                    cx.fillRect(gx, gy - ps, ps, ps);
                    cx.fillRect(gx, gy + ps, ps, ps);
                }
            }
        }
    }

    for (let r = 0; r < h; r++) {
        for (let col = 0; col < w; col++) {
            const ch = clean[r][col];
            if (ch !== '.' && pal[ch]) {
                cx.fillStyle = pal[ch];
                cx.fillRect((col + pad) * ps, (r + pad) * ps, ps, ps);
            }
        }
    }
    return c;
}

function buildCharGrid20x24(c, pose) {
    const isMed = (pose === 3);
    const isFemale = (c.gender === 'female');
    const eyeTop = isMed ? '....SS.ll...ll.SS....' : '....SS.EE...EE.SS....';
    const eyeBot = isMed ? '....SS.ll...ll.SS....' : '....SS.EW...EW.SS....';

    const g = [
        '.......HHHHHH.......',
        '.....HHhHHHHHHhHH...',
        '....HHhHHHHHHHHhHH..',
        '....HHHHHHHHHHHHHH..',
        '....SSSSSSSSSSSSSS..',
        '....SS.BB...BB.SS...',
        eyeTop,
        eyeBot,
        '....SSSSSSNNSSSSSS..',
        '....SSSSSSNNSSSSSS..',
        '....SSSS.MMMM.SSSS..',
        '.....SSSSSSSSSSSS...',
        '........SSSSSS......',
        '.....TTTCCCCCCCTT...',
        '....TT.CCCCCCCC.TT..',
        '....T..CCCCCCCC..T..',
        '....S..CCCCCCCC..S..',
        '.......PPPPPPPP.....',
        '.......PPP..PPP.....',
        '.......PPP..PPP.....',
        '.......PPP..PPP.....',
        '.......PPP..PPP.....',
        '.......FFF..FFF.....',
        '.......FFF..FFF.....'
    ];

    const st = c.hairStyle % 5;
    if (st === 0) {
        g[2] = '....HHhHHHHHHHhHH...';
        g[3] = '....HHHHHHHHHHHHHH..';
        g[4] = '....SSHHHHHHHHHHSS..';
    } else if (st === 1) {
        g[2] = '....HHh.HHHHHHhHH...';
        g[3] = '....HH..HHHHHHHHHH..';
        g[4] = '....SS..SHHHHHHHSS..';
    } else if (st === 2) {
        g[0] = '.........HHHH.......';
        g[1] = '........HHhhHH......';
        g[2] = '....HHhHHHHHHHHhHH..';
    } else if (st === 3) {
        for (let r = 4; r <= 15; r++) {
            const a = g[r].split('');
            a[3] = 'H'; a[16] = 'H';
            g[r] = a.join('');
        }
    } else if (st === 4) {
        g[0] = '.......SSSSSSSS.....';
        g[1] = '.....SSSSSSSSSSSS...';
        g[2] = '....SSSSSSSSSSSSSS..';
        g[3] = '....SSSSSSSSSSSSSS..';
    }

    if (isFemale && st !== 4) {
        for (let r = 5; r <= 8; r++) {
            const a = g[r].split('');
            a[3] = (r % 2 === 0) ? 'H' : 'h';
            a[16] = (r % 2 === 0) ? 'H' : 'h';
            g[r] = a.join('');
        }
    }

    if (pose === 1) {
        g[18] = '.......PPPP..PP.....';
        g[19] = '.......PPP...PP.....';
        g[20] = '.......PPP...PP.....';
        g[21] = '.......PPP...PP.....';
        g[22] = '.......FFF....FF....';
        g[23] = '.......FFF....FF....';
    } else if (pose === 2) {
        g[18] = '.......PP..PPPP.....';
        g[19] = '.......PP...PPP.....';
        g[20] = '.......PP...PPP.....';
        g[21] = '.......PP...PPP.....';
        g[22] = '......FF....FFF.....';
        g[23] = '......FF....FFF.....';
    } else if (isMed) {
        return pad20(g.slice(0, 13).concat([
            '....TTTCCCCCCCTT....',
            '...TTT.CCCCCCCC.TTT.',
            '....PPPPPPPPPPPPPP..',
            '...PPPPPPPPPPPPPPPP.',
            '....FFFFFFFFFFFFFF..'
        ]));
    }

    return pad20(g);
}

const charCache = new Map();
function getCharFrames(name, c) {
    const key = `${name}|${c.gender}|${c.skin}|${c.hairStyle}|${c.outfitId}`;
    if (charCache.has(key)) return charCache.get(key);
    if (charCache.size > 600) charCache.delete(charCache.keys().next().value);

    const out = OUTFIT_LIST[c.outfitId] || OUTFIT_LIST[0];
    const pal = {
        S: c.skin, H: c.hairColor, h: c.hairShade, B: c.hairColor,
        E: '#141716', W: '#ffffff', l: '#2b2420', N: '#a8644c',
        M: '#df687a', C: out.main, T: out.trim, P: out.pants, F: '#0f1211'
    };

    const frames = [0, 1, 2, 3].map(pose => {
        const spr = bakePixelMatrix(buildCharGrid20x24(c, pose), pal, 3, true);
        const cv = document.createElement('canvas');
        cv.width = 144;
        cv.height = 104;
        const cx = cv.getContext('2d');
        cx.imageSmoothingEnabled = false;

        cx.fillStyle = 'rgba(0,0,0,0.4)';
        cx.beginPath();
        cx.ellipse(72, 86, pose === 3 ? 22 : 15, 5, 0, 0, Math.PI * 2);
        cx.fill();

        const topY = Math.round(86 - spr.height + ((pose === 1 || pose === 2) ? -2 : 0));
        cx.drawImage(spr, Math.round(72 - spr.width / 2), topY);

        if (name) {
            cx.font = 'bold 10px "Courier New", monospace';
            cx.textAlign = 'center';
            cx.fillStyle = '#ffeb3b';
            cx.fillText(name, 72, Math.max(12, topY - 6));
        }
        return cv;
    });

    charCache.set(key, frames);
    return frames;
}

function drawHeadHalo(ctx, cx, cy, t) {
    const r = 24 + Math.sin(t * 0.004) * 2;
    ctx.strokeStyle = '#ffca28';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
}

function drawPerson(ctx, e, t) {
    const rx = Math.round(e.x), ry = Math.round(e.y);
    const frames = getCharFrames(e.name, e.cfg);
    const idx = e.med ? 3 : (e.walk > 0.01 ? (Math.sin(e.walk) >= 0 ? 1 : 2) : 0);
    if (e.med) drawHeadHalo(ctx, rx, ry - 48, t);
    ctx.drawImage(frames[idx], rx - 72, ry - 86);
    if (e.chat) {
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'center';
        const w = Math.max(ctx.measureText(e.chat).width + 12, 32), by = ry - 104;
        ctx.fillStyle = '#fff';
        ctx.fillRect(Math.round(rx - w / 2), by, Math.round(w), 18);
        ctx.fillStyle = '#111';
        ctx.fillText(e.chat, rx, by + 13);
    }
}

function renderPreview() {
    const pc = document.getElementById('previewCanvas');
    if (!pc) return;
    const px = pc.getContext('2d');
    px.imageSmoothingEnabled = false;
    px.clearRect(0, 0, pc.width, pc.height);
    const out = OUTFIT_LIST[cfg.outfitId] || OUTFIT_LIST[0];
    const spr = bakePixelMatrix(buildCharGrid20x24(cfg, 0), {
        S: cfg.skin, H: cfg.hairColor, h: cfg.hairShade, B: cfg.hairColor,
        E: '#141716', W: '#ffffff', l: '#2b2420', N: '#a8644c',
        M: '#df687a', C: out.main, T: out.trim, P: out.pants, F: '#0f1211'
    }, 3, true);
    px.drawImage(spr, Math.round(38 - spr.width / 2), Math.round(43 - spr.height / 2));
}

function initCreator() {
    const sr = document.getElementById('skin-row');
    SKIN_LIST.forEach((col, i) => {
        const d = document.createElement('div'); d.className = 'swatch' + (i === 0 ? ' active' : ''); d.style.background = col;
        d.onclick = () => { cfg.skin = col; sr.querySelectorAll('.swatch').forEach(x => x.classList.remove('active')); d.classList.add('active'); renderPreview(); };
        sr.appendChild(d);
    });
    const hr = document.getElementById('hair-row');
    HAIR_LIST.forEach((h, i) => {
        const b = document.createElement('button'); b.className = 'mini-btn' + (i === 0 ? ' active' : ''); b.textContent = h;
        b.onclick = () => { cfg.hairStyle = i; hr.querySelectorAll('.mini-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); renderPreview(); };
        hr.appendChild(b);
    });
    const or = document.getElementById('outfit-row');
    OUTFIT_LIST.forEach((o, i) => {
        const b = document.createElement('button'); b.className = 'mini-btn' + (i === 0 ? ' active' : ''); b.textContent = o.name;
        b.onclick = () => { cfg.outfitId = i; or.querySelectorAll('.mini-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); renderPreview(); };
        or.appendChild(b);
    });
    renderPreview();
}

function setGender(g, btn) {
    cfg.gender = g;
    document.querySelectorAll('#gender-row .mini-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderPreview();
}
