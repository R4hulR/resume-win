/**
 * games.js — Original mini-games for the desktop.
 * Each game is a function mount(body, statusbar, win) → { stop() }.
 * script.js mounts a game when its window opens and stops it on close.
 */
const GAMES = (function () {

  function loadBest(key) {
    try { return +localStorage.getItem('rr-best-' + key) || 0; } catch (e) { return 0; }
  }
  function saveBest(key, v) {
    try { localStorage.setItem('rr-best-' + key, v); } catch (e) { /* private mode */ }
  }
  const isActive = win => win.style.display === 'flex' && !win.classList.contains('inactive');
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);


  /* ─── BUG SQUASH — whack the bugs, spare the features ──────── */
  function bugSquash(body, status) {
    const ROUND = 30;
    let score = 0, timeLeft = ROUND, running = false, best = loadBest('bugsquash');
    let tickTimer = null, spawnTimer = null;

    body.innerHTML = `
      <div class="game-bar">
        <span>Score: <b data-score>0</b></span>
        <span>Time: <b data-time>${ROUND}</b>s</span>
        <button class="win95" data-start>Start</button>
      </div>
      <div class="bug-grid">
        ${Array.from({ length: 9 }, (_, i) =>
          `<div class="bug-hole sunken"><span class="bug-ln">${(i + 1) * 10}</span></div>`).join('')}
      </div>
      <p class="game-help">Squash the 🐛 bugs before they hit production. Don't squash the ✨ features!</p>
    `;
    const scoreEl = body.querySelector('[data-score]');
    const timeEl  = body.querySelector('[data-time]');
    const startBtn = body.querySelector('[data-start]');
    const holes = [...body.querySelectorAll('.bug-hole')];
    status.textContent = `Best: ${best}`;

    function clearHole(h) {
      clearTimeout(h._timer);
      delete h.dataset.kind;
      const c = h.querySelector('.critter');
      if (c) c.remove();
    }

    // Critters appear faster and vanish sooner as the round goes on
    function spawn() {
      if (!running) return;
      const elapsed = ROUND - timeLeft;
      const free = holes.filter(h => !h.dataset.kind);
      if (free.length) {
        const h = free[Math.floor(Math.random() * free.length)];
        const kind = Math.random() < 0.2 ? 'feature' : 'bug';
        h.dataset.kind = kind;
        const critter = document.createElement('span');
        critter.className = 'critter';
        critter.textContent = kind === 'bug' ? '🐛' : '✨';
        h.appendChild(critter);
        h._timer = setTimeout(() => clearHole(h), Math.max(450, 1100 - elapsed * 20));
      }
      spawnTimer = setTimeout(spawn, Math.max(280, 700 - elapsed * 14));
    }

    holes.forEach(h => h.addEventListener('pointerdown', () => {
      if (!running || !h.dataset.kind) return;
      const isBug = h.dataset.kind === 'bug';
      SFX.play(isBug ? 'squash' : 'oops');
      score += isBug ? 1 : -2;
      scoreEl.textContent = score;
      h.classList.add(isBug ? 'hit' : 'oops');
      setTimeout(() => h.classList.remove('hit', 'oops'), 200);
      clearHole(h);
    }));

    function start() {
      score = 0; timeLeft = ROUND; running = true;
      scoreEl.textContent = 0; timeEl.textContent = ROUND;
      startBtn.disabled = true;
      status.textContent = 'Squash!';
      spawn();
      tickTimer = setInterval(() => {
        timeEl.textContent = --timeLeft;
        if (timeLeft <= 0) end();
      }, 1000);
    }

    function halt() {
      running = false;
      clearInterval(tickTimer);
      clearTimeout(spawnTimer);
      holes.forEach(clearHole);
    }

    function end() {
      halt();
      SFX.play('win');
      if (score > best) { best = score; saveBest('bugsquash', best); }
      status.textContent = `Game over — ${score} point${score !== 1 ? 's' : ''}. Best: ${best}`;
      startBtn.textContent = 'Play again';
      startBtn.disabled = false;
    }

    startBtn.addEventListener('click', start);
    return { stop: halt };
  }


  /* ─── STAR DODGER — endless asteroid dodger on a canvas ────── */
  function starDodger(body, status, win) {
    body.innerHTML = '<canvas class="dodger-canvas"></canvas>';
    const canvas = body.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;
    function resize() {
      W = canvas.width  = body.clientWidth;
      H = canvas.height = body.clientHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(body);

    const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), z: rand(0.2, 1) }));
    const keys = { up: false, down: false };
    let best = loadBest('dodger');
    let state = 'ready';  // ready | playing | paused | over
    let ship, rocks, bonuses, score, speed, spawnIn, pointerY, raf, last = 0;

    function reset() {
      ship = { x: 60, y: H / 2, r: 9 };
      rocks = []; bonuses = [];
      score = 0; speed = 170; spawnIn = 0; pointerY = null;
    }
    reset();
    status.textContent = `Best: ${best}`;

    function play() {
      if (state === 'over' || state === 'ready') reset();
      state = 'playing';
      status.textContent = '↑/↓, W/S or mouse to steer';
    }

    function gameOver() {
      state = 'over';
      SFX.play('crash');
      const s = Math.floor(score);
      if (s > best) { best = s; saveBest('dodger', best); }
      status.textContent = `Crashed at ${s}. Best: ${best}`;
    }

    function update(dt) {
      speed += dt * 7;
      score += dt * 10;

      const dir = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (dir) ship.y += dir * 260 * dt;
      else if (pointerY !== null) ship.y += (pointerY - ship.y) * Math.min(1, dt * 10);
      ship.y = Math.max(ship.r, Math.min(H - ship.r, ship.y));

      spawnIn -= dt;
      if (spawnIn <= 0) {
        rocks.push({ x: W + 30, y: rand(0, H), r: rand(8, 22), vy: rand(-25, 25), a: 0, spin: rand(-2, 2) });
        if (Math.random() < 0.18) bonuses.push({ x: W + 30, y: rand(15, H - 15) });
        spawnIn = Math.max(0.22, 0.9 - speed / 900);
      }

      for (const r of rocks) {
        r.x -= speed * dt; r.y += r.vy * dt; r.a += r.spin * dt;
        if (Math.hypot(r.x - ship.x, r.y - ship.y) < r.r + ship.r * 0.75) { gameOver(); return; }
      }
      for (const b of bonuses) {
        b.x -= speed * 0.8 * dt;
        if (!b.taken && Math.hypot(b.x - ship.x, b.y - ship.y) < ship.r + 8) {
          b.taken = true;
          score += 25;
          SFX.play('bonus');
        }
      }
      rocks   = rocks.filter(r => r.x > -40);
      bonuses = bonuses.filter(b => b.x > -20 && !b.taken);
    }

    function drawRock(r) {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.a);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const rad = r.r * (i % 2 ? 0.82 : 1);
        ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      ctx.closePath();
      ctx.fillStyle = '#8a6d5a';
      ctx.strokeStyle = '#4a3a30';
      ctx.lineWidth = 2;
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6e5545';
      ctx.beginPath(); ctx.arc(r.r * 0.25, -r.r * 0.2, r.r * 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawShip(t) {
      const { x, y } = ship;
      ctx.fillStyle = '#7fd1ff';
      ctx.globalAlpha = 0.5 + Math.sin(t / 40) * 0.3;
      ctx.beginPath(); ctx.ellipse(x - 16, y, 8 + Math.random() * 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#cfd8e6';
      ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x, y - 4); ctx.lineTo(x + 14, y); ctx.lineTo(x, y + 4); ctx.fill();
      ctx.fillStyle = '#8fa4c2';
      ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x, y - 8); ctx.lineTo(x + 4, y); ctx.fill();
      ctx.fillStyle = '#ffdf8a';
      ctx.beginPath(); ctx.arc(x - 7, y, 1.6, 0, Math.PI * 2); ctx.fill();
    }

    function banner(title, sub) {
      ctx.fillStyle = 'rgba(0,0,40,0.55)';
      ctx.fillRect(0, H / 2 - 40, W, 80);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffdf8a';
      ctx.font = 'bold 20px Tahoma, sans-serif';
      ctx.fillText(title, W / 2, H / 2 - 6);
      ctx.fillStyle = '#fff';
      ctx.font = '12px Tahoma, sans-serif';
      ctx.fillText(sub, W / 2, H / 2 + 18);
      ctx.textAlign = 'left';
    }

    function draw(dt, t) {
      ctx.fillStyle = '#05051a';
      ctx.fillRect(0, 0, W, H);

      const drift = (state === 'playing' ? speed : 40) * dt / Math.max(W, 1);
      for (const s of stars) {
        s.x -= s.z * drift;
        if (s.x < 0) { s.x += 1; s.y = Math.random(); }
        ctx.fillStyle = `rgba(255,255,255,${s.z})`;
        ctx.fillRect(s.x * W, s.y * H, s.z * 2, s.z * 2);
      }

      for (const b of bonuses) {
        ctx.fillStyle = '#ffdf8a';
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - 7); ctx.lineTo(b.x + 5, b.y); ctx.lineTo(b.x, b.y + 7); ctx.lineTo(b.x - 5, b.y);
        ctx.fill();
      }
      rocks.forEach(drawRock);
      if (state !== 'over' || Math.floor(t / 150) % 2) drawShip(t);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillText(`SCORE ${Math.floor(score)}`, 10, 18);
      ctx.fillStyle = '#9ab';
      ctx.fillText(`BEST ${best}`, 10, 34);

      if (state === 'ready')  banner('STAR DODGER', 'Click or press Space to launch');
      if (state === 'paused') banner('PAUSED', 'Click or press Space to resume');
      if (state === 'over')   banner('GAME OVER', 'Click or press Space to try again');
    }

    function loop(t) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      if (!body.offsetParent) return;                         // minimized
      if (state === 'playing' && !isActive(win)) state = 'paused';
      if (state === 'playing') update(dt);
      draw(dt, t);
    }
    raf = requestAnimationFrame(loop);

    function onKey(e, down) {
      if (!isActive(win)) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w')        keys.up = down;
      else if (k === 'arrowdown' || k === 's') keys.down = down;
      else if ((k === ' ' || k === 'enter') && down) { if (state !== 'playing') play(); }
      else if (k === 'p' && down && state === 'playing') state = 'paused';
      else return;
      e.preventDefault();
    }
    const keydown = e => onKey(e, true);
    const keyup   = e => onKey(e, false);
    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);
    canvas.addEventListener('pointermove', e => { pointerY = e.offsetY; });
    canvas.addEventListener('pointerdown', e => {
      pointerY = e.offsetY;
      if (state !== 'playing') play();
    });

    return {
      stop() {
        cancelAnimationFrame(raf);
        ro.disconnect();
        document.removeEventListener('keydown', keydown);
        document.removeEventListener('keyup', keyup);
      },
    };
  }


  /* ─── TECH MATCH — memory pairs built from DATA.skills ─────── */
  function techMatch(body, status) {
    const labels = [...new Set(DATA.skills.flatMap(g => g.chips))]
      .map(l => l.replace(/\s*\(.*\)/, ''))
      .slice(0, 8);
    let best = loadBest('match');  // fewest moves; 0 = not played yet
    let first = null, lock = false, moves = 0, found = 0, pending = null;

    function shuffle(a) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function deal() {
      clearTimeout(pending);
      first = null; lock = false; moves = 0; found = 0;
      const deck = shuffle([...labels, ...labels]);
      body.innerHTML = `
        <div class="game-bar">
          <span>Moves: <b data-moves>0</b></span>
          <span>Pairs: <b data-pairs>0</b>/${labels.length}</span>
          <button class="win95" data-new>New game</button>
        </div>
        <div class="match-grid">
          ${deck.map(l => `<button class="match-card" data-label="${l}"><span>${l}</span></button>`).join('')}
        </div>
      `;
      status.textContent = best ? `Best: ${best} moves` : 'Find all the matching pairs';
      body.querySelector('[data-new]').addEventListener('click', deal);
      body.querySelectorAll('.match-card').forEach(card => card.addEventListener('click', () => flip(card)));
    }

    function flip(card) {
      if (lock || card.classList.contains('up')) return;
      card.classList.add('up');
      SFX.play('flip');
      if (!first) { first = card; return; }

      body.querySelector('[data-moves]').textContent = ++moves;
      if (first.dataset.label === card.dataset.label) {
        first.classList.add('matched'); card.classList.add('matched');
        first = null;
        body.querySelector('[data-pairs]').textContent = ++found;
        SFX.play(found === labels.length ? 'win' : 'match');
        if (found === labels.length) {
          if (!best || moves < best) { best = moves; saveBest('match', best); }
          status.textContent = `Solved in ${moves} moves! Best: ${best}`;
        }
      } else {
        const a = first;
        first = null; lock = true;
        pending = setTimeout(() => { a.classList.remove('up'); card.classList.remove('up'); lock = false; }, 700);
      }
    }

    deal();
    return { stop() { clearTimeout(pending); } };
  }


  return {
    bugsquash: bugSquash,
    dodger   : starDodger,
    match    : techMatch,
  };

})();
