(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Show requested path ---------- */
    var requested = decodeURIComponent(location.pathname + location.search);
    document.getElementById('req-path').textContent = requested;

    /* ---------- Back button (only when there is somewhere to go) ---------- */
    var back = document.getElementById('go-back');
    var cameFromSite = document.referrer && new URL(document.referrer).origin === location.origin;
    if (cameFromSite || history.length > 1) {
        back.hidden = false;
        back.addEventListener('click', function (e) {
            e.preventDefault();
            history.back();
        });
    }

    /* ---------- Closest-match suggestion ---------- */
    var pages = [
        { id: 'home',  href: '/',                keys: ['home', 'index', 'main', 'sadeq', 'isaac'] },
        { id: 'works', href: '/html/works.html', keys: ['works', 'work', 'projects', 'project', 'portfolio'] },
        { id: 'pubs',  href: '/html/pubs.html',  keys: ['pubs', 'pub', 'publications', 'publication', 'papers', 'paper', 'research', 'articles'] },
        { id: 'cv',    href: '/html/cv.html',    keys: ['cv', 'resume', 'curriculum', 'vitae', 'academiccv'] }
    ];

    function distance(a, b) {
        var prev = [], i, j;
        for (j = 0; j <= b.length; j++) prev[j] = j;
        for (i = 1; i <= a.length; i++) {
            var cur = [i];
            for (j = 1; j <= b.length; j++) {
                cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            }
            prev = cur;
        }
        return prev[b.length];
    }

    function score(token, key) {
        if (token === key) return 1;
        if (token.length > 2 && (key.indexOf(token) === 0 || token.indexOf(key) === 0)) return 0.85;
        return 1 - distance(token, key) / Math.max(token.length, key.length);
    }

    var tokens = location.pathname.toLowerCase()
        .replace(/\.[a-z0-9]+$/, '')
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

    var best = null, bestScore = 0;
    pages.forEach(function (p) {
        tokens.forEach(function (t) {
            p.keys.forEach(function (k) {
                var s = score(t, k);
                if (s > bestScore) { bestScore = s; best = p; }
            });
        });
    });

    if (best && bestScore >= 0.6) {
        var card = document.querySelector('.waypoint[data-page="' + best.id + '"]');
        if (card) card.classList.add('suggested');
        var link = document.getElementById('nearest-link');
        link.href = best.href;
        link.textContent = best.href;
        document.getElementById('nearest-line').hidden = false;
    }

    /* ---------- Eye follows the cursor ---------- */
    var eye = document.querySelector('.eye-blob');
    var pupil = document.querySelector('.pupil');
    var tx = 0, ty = 0;

    function look(x, y) {
        var r = eye.getBoundingClientRect();
        var dx = x - (r.left + r.width / 2);
        var dy = y - (r.top + r.height / 2);
        var dist = Math.hypot(dx, dy) || 1;
        var max = r.width * 0.13;
        var k = Math.min(max, dist) / dist;
        tx = dx * k;
        ty = dy * k;
        pupil.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
    }

    window.addEventListener('pointermove', function (e) { look(e.clientX, e.clientY); });

    /* ---------- Starfield with parallax and shooting stars ---------- */
    var canvas = document.getElementById('starfield');
    var ctx = canvas.getContext('2d');
    var stars = [], streaks = [], w, h, mx = 0, my = 0;
    var colors = ['255,255,255', '135,206,250', '76,201,240', '255,176,32'];

    function resize() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var count = Math.round((w * h) / 7000);
        stars = [];
        for (var i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                z: Math.random() * 0.9 + 0.1,
                c: colors[Math.random() < 0.75 ? 0 : Math.floor(Math.random() * colors.length)],
                p: Math.random() * Math.PI * 2
            });
        }
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', function (e) {
        mx = (e.clientX / w - 0.5) * 2;
        my = (e.clientY / h - 0.5) * 2;
    });

    function frame(t) {
        ctx.clearRect(0, 0, w, h);

        stars.forEach(function (s) {
            var x = s.x - mx * 14 * s.z;
            var y = s.y - my * 14 * s.z;
            if (!reduceMotion) s.x = (s.x - 0.04 * s.z + w) % w;
            var a = 0.35 + 0.65 * Math.abs(Math.sin(t / 1400 + s.p));
            ctx.fillStyle = 'rgba(' + s.c + ',' + (a * s.z).toFixed(2) + ')';
            ctx.fillRect(x, y, s.z * 2, s.z * 2);
        });

        if (!reduceMotion) {
            if (Math.random() < 0.006) {
                streaks.push({ x: Math.random() * w, y: Math.random() * h * 0.5, vx: -9 - Math.random() * 6, vy: 4 + Math.random() * 3, life: 1 });
            }
            streaks = streaks.filter(function (s) { return s.life > 0; });
            streaks.forEach(function (s) {
                var g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 6, s.y - s.vy * 6);
                g.addColorStop(0, 'rgba(76,201,240,' + s.life + ')');
                g.addColorStop(1, 'rgba(76,201,240,0)');
                ctx.strokeStyle = g;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.vx * 6, s.y - s.vy * 6);
                ctx.stroke();
                s.x += s.vx;
                s.y += s.vy;
                s.life -= 0.02;
            });
            requestAnimationFrame(frame);
        }
    }

    resize();
    requestAnimationFrame(frame);
})();
