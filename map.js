const staticCanvas = document.createElement('canvas');
staticCanvas.width = MAP_W;
staticCanvas.height = MAP_H;
const staticCtx = staticCanvas.getContext('2d', { alpha: false });
let cachedNight = null;

function buildMap(night) {
    if (cachedNight === night) return;
    cachedNight = night;
    const s = staticCtx;
    s.fillStyle = night ? '#142014' : '#356e35';
    s.fillRect(0, 0, MAP_W, MAP_H);
    s.fillStyle = night ? '#0d1829' : '#8ec5f5';
    s.fillRect(0, 0, MAP_W, 180);
    s.strokeStyle = night ? '#4a382e' : '#9e6b4b';
    s.lineWidth = 56;
    s.beginPath(); s.moveTo(900, 460); s.lineTo(900, 1420); s.stroke();
    s.fillStyle = night ? '#143f59' : '#4682be';
    s.fillRect(0, 1020, MAP_W, 84);
    s.fillStyle = night ? '#3e2723' : '#6d4c41';
    s.fillRect(855, 1012, 90, 100);
    s.fillStyle = night ? '#4a3d31' : '#d7bfa0';
    s.fillRect(660, 210, 480, 250);
    s.strokeStyle = '#111'; s.lineWidth = 3; s.strokeRect(660, 210, 480, 250);
}
