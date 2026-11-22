let audioCtx = null;
let isMusicOn = false;
let musicTimer = null;
const NOTES = [261.63, 293.66, 329.63, 392.00, 440.00];

function toggleMusic() {
    const btn = document.getElementById('btn-music');
    isMusicOn = !isMusicOn;
    btn.classList.toggle('active', isMusicOn);
    btn.classList.toggle('muted', !isMusicOn);

    if (isMusicOn) {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        if (!musicTimer) {
            let i = 0;
            musicTimer = setInterval(() => {
                if (!isMusicOn || document.hidden || !audioCtx || audioCtx.state !== 'running') return;
                const now = audioCtx.currentTime;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(NOTES[i++ % NOTES.length], now);
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.exponentialRampToValueAtTime(0.025, now + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 2.05);
            }, 2600);
        }
    }
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isMusicOn && audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
});
