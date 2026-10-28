(function () {

  /* ═══════════════════════════════════════════════════════════════
     SETTINGS  — theme / wallpaper / effects, persisted per browser
  ═══════════════════════════════════════════════════════════════ */

  const THEMES = {
    standard: 'Windows Standard',
    plum    : 'Plum',
    marine  : 'Marine',
    desert  : 'Desert',
    hotdog  : 'Hot Dog Stand',
  };
  const WALLPAPERS = {
    photo: 'Space photo',
    scene: 'Retro space scene',
    teal : 'Classic teal',
  };
  const DEFAULTS = { theme: 'standard', wallpaper: 'photo', crt: false, skipBoot: false, sound: false, screensaver: true };
  const SETTINGS_KEY = 'rr-settings';

  function loadSettings() {
    try {
      const s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
      if (!THEMES[s.theme]) s.theme = DEFAULTS.theme;
      if (!WALLPAPERS[s.wallpaper]) s.wallpaper = DEFAULTS.wallpaper;
      return s;
    } catch (e) {
      return { ...DEFAULTS };
    }
  }
  const settings = loadSettings();

  function applySettings(patch) {
    Object.assign(settings, patch);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* private mode */ }

    document.documentElement.dataset.theme = settings.theme;
    const bg = document.getElementById('space-bg');
    bg.classList.toggle('has-photo', settings.wallpaper === 'photo');
    bg.classList.toggle('teal', settings.wallpaper === 'teal');
    document.body.classList.toggle('crt', settings.crt);

    SFX.enabled = settings.sound;
    const soundBtn = document.getElementById('sound-btn');
    soundBtn.classList.toggle('on', settings.sound);
    soundBtn.setAttribute('aria-pressed', settings.sound);
    soundBtn.title = `Sound: ${settings.sound ? 'on' : 'off'}`;

    syncDisplay();
  }


  /* ═══════════════════════════════════════════════════════════════
     RENDERERS  — read DATA (data.js) and inject HTML into windows
  ═══════════════════════════════════════════════════════════════ */

  const techList = proj => proj.tech.split('·').map(t => t.trim());
  const stripTags = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');

  function renderAbout() {
    const p = DATA.profile;
    document.getElementById('about-body').innerHTML = `
      <div class="profile-row">
        <div class="avatar sunken"
             style="display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:bold;color:var(--accent);">
          ${p.initials}
        </div>
        <div>
          <h1 class="win-h">${p.name}</h1>
          <div style="font-weight:bold;color:#333;">${p.title}</div>
          <div style="font-size:11px;color:#555;margin-top:2px;">${p.org}</div>
        </div>
      </div>
      <hr class="divider">
      ${p.bio.map(b => `<p>${b}</p>`).join('')}
      <div class="links-row">
        <a class="link-chip raised" href="mailto:${p.email}">✉ Email</a>
        <a class="link-chip raised" href="${p.linkedin}" target="_blank" rel="noopener">in LinkedIn</a>
        <a class="link-chip raised" href="${p.github}" target="_blank" rel="noopener">⌥ GitHub</a>
        <a class="link-chip raised" href="resume.html">📃 Plain view</a>
      </div>
      <p class="hint">Tip: double-click the desktop icons, right-click the desktop, or try the MS-DOS Prompt.</p>
    `;
  }

  function renderExperience() {
    const expHtml = DATA.experience.map(job => `
      <div class="job">
        <span class="job-date">${job.date}</span>
        <div class="job-title">
          ${job.title}
          ${job.subtitle ? `<span style="font-weight:normal;color:#555;">${job.subtitle}</span>` : ''}
        </div>
        <div class="job-org">${job.org}</div>
        <ul>${job.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>
    `).join('');

    const eduHtml = DATA.education.map(edu => `
      <div class="job">
        <span class="job-date">${edu.date}</span>
        <div class="job-title">${edu.degree}</div>
        <div class="job-org">${edu.org}</div>
        <div style="font-size:11px;color:#555;margin-top:4px;">${edu.gpa}</div>
      </div>
    `).join('');

    document.getElementById('experience-body').innerHTML = `
      <h2 class="win-h" style="margin-top:0;">Work Experience</h2>
      ${expHtml}
      <h2 class="win-h">Education</h2>
      ${eduHtml}
    `;

    const total = DATA.experience.length;
    document.getElementById('exp-statusbar').textContent =
      `${total} position${total !== 1 ? 's' : ''}, ${DATA.education.length} degree`;
  }

  function renderSkills() {
    const groupsHtml = DATA.skills.map(sg => `
      <div class="skill-group">
        <div class="skill-group-title">${sg.group}</div>
        <div class="chips">
          ${sg.chips.map(c => `<span class="chip raised">${c}</span>`).join('')}
        </div>
      </div>
    `).join('');

    document.getElementById('skills-body').innerHTML = groupsHtml;

    const total = DATA.skills.reduce((s, g) => s + g.chips.length, 0);
    document.getElementById('skills-statusbar').textContent =
      `skills.txt — ${total} entries`;
  }

  // Live repo stats, fetched from the GitHub API the first time Projects opens
  const ghStats = {};
  const repoOf = proj => ((proj.href.match(/github\.com\/([^/]+\/[^/#?]+)/i) || [])[1] || '').toLowerCase();
  const monthYear = iso => new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  // Zero counts are left out rather than shown as "★ 0"
  const ghSummary = gh => [
    gh.stars ? `★ ${gh.stars}` : '',
    gh.forks ? `⑂ ${gh.forks}` : '',
    `updated ${monthYear(gh.pushed)}`,
  ].filter(Boolean).join(' · ');
  let projFilter = null;

  function loadGitHubStats() {
    try {
      const cached = JSON.parse(sessionStorage.getItem('rr-gh') || 'null');
      if (cached) { Object.assign(ghStats, cached); renderProjects(projFilter); return; }
    } catch (e) { /* ignore */ }

    const repos = DATA.projects.map(repoOf).filter(Boolean);
    Promise.all(repos.map(r =>
      fetch('https://api.github.com/repos/' + r)
        .then(res => (res.ok ? res.json() : null))
        .catch(() => null)
    )).then(results => {
      results.forEach((d, i) => {
        if (d) ghStats[repos[i]] = { stars: d.stargazers_count, forks: d.forks_count, pushed: d.pushed_at };
      });
      if (!Object.keys(ghStats).length) return;  // offline or rate-limited: keep the static view
      try { sessionStorage.setItem('rr-gh', JSON.stringify(ghStats)); } catch (e) { /* ignore */ }
      renderProjects(projFilter);
    });
  }

  // Clicking a tech tag filters the list; clicking it again clears the filter.
  function renderProjects(filter) {
    projFilter = filter || null;
    const list = filter ? DATA.projects.filter(p => techList(p).includes(filter)) : DATA.projects;

    const cardsHtml = list.map(proj => {
      const gh = ghStats[repoOf(proj)];
      return `
      <div class="proj-card sunken">
        <div class="proj-title">
          <a href="${proj.href}" target="_blank" rel="noopener">${proj.title}</a>
        </div>
        <div class="proj-meta">
          ${proj.meta}
          ${gh ? `<span class="gh-stats" title="Live from GitHub">${ghSummary(gh)}</span>` : ''}
        </div>
        <p style="margin:0;">${proj.desc}</p>
        <div class="proj-tech">
          ${techList(proj).map(t =>
            `<button class="win95 tech-chip${t === filter ? ' active' : ''}" data-tech="${t}">${t}</button>`).join('')}
        </div>
      </div>
    `;
    }).join('');

    const body = document.getElementById('projects-body');
    body.innerHTML = (filter
      ? `<div class="filter-bar">Filtered by <b>${filter}</b><button class="win95" data-clear>Show all</button></div>`
      : '') + cardsHtml;

    body.querySelectorAll('[data-tech]').forEach(btn => {
      btn.addEventListener('click', () => renderProjects(btn.dataset.tech === filter ? null : btn.dataset.tech));
    });
    const clearBtn = body.querySelector('[data-clear]');
    if (clearBtn) clearBtn.addEventListener('click', () => renderProjects());

    document.getElementById('proj-statusbar').textContent = (filter
      ? `${list.length} of ${DATA.projects.length} items`
      : `${DATA.projects.length} items — click a tag to filter`)
      + (Object.keys(ghStats).length ? ' · stats live from GitHub' : '');
  }

  function renderContact() {
    const p = DATA.profile;
    const status = document.getElementById('contact-statusbar');
    const body = document.getElementById('contact-body');
    body.innerHTML = `
      <h1 class="win-h" style="margin-top:0;">Let's talk.</h1>
      <p>Open to backend / distributed-systems roles. Reach out any time.</p>
      <ul class="contact-list">
        <li>✉ <a href="mailto:${p.email}">${p.email}</a></li>
        <li>in <a href="${p.linkedin}" target="_blank" rel="noopener">linkedin.com/in/r4hulray</a></li>
        <li>⌥ <a href="${p.github}" target="_blank" rel="noopener">github.com/R4hulR</a></li>
      </ul>
      <hr class="divider">
      <form class="mail-form" id="mail-form">
        <label><span>To:</span><input class="sunken" value="${p.email}" readonly></label>
        <label><span>Subject:</span><input class="sunken" name="subject" placeholder="Let's work together"></label>
        <textarea class="sunken" name="message" rows="5" placeholder="Write your message…"></textarea>
        <div class="mail-actions">
          <button class="win95" type="button" id="copy-email">Copy address</button>
          <button class="win95" type="submit"><b>✉ Send</b></button>
        </div>
      </form>
    `;

    const form = document.getElementById('mail-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const subject = encodeURIComponent(form.subject.value);
      const message = encodeURIComponent(form.message.value);
      window.location.href = `mailto:${p.email}?subject=${subject}&body=${message}`;
      status.textContent = 'Opening your mail client…';
    });
    document.getElementById('copy-email').addEventListener('click', () => {
      if (!navigator.clipboard) { status.textContent = p.email; return; }
      navigator.clipboard.writeText(p.email)
        .then(() => { status.textContent = 'Email address copied to clipboard'; })
        .catch(() => { status.textContent = p.email; });
    });
  }

  function renderBin() {
    const items = DATA.recycleBin || [];
    const body = document.getElementById('bin-body');
    body.innerHTML = `
      <table class="list-view">
        <thead><tr>
          <th class="raised">Name</th><th class="raised">Original Location</th><th class="raised">Why it's gone</th>
        </tr></thead>
        <tbody>
          ${items.map(i => `
            <tr tabindex="0">
              <td>${i.name.endsWith('/') ? '📁' : '📄'} ${i.name}</td>
              <td>${i.from}</td>
              <td>${i.note}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    `;
    body.querySelectorAll('tbody tr').forEach(row => {
      row.addEventListener('click', () => row.focus());
    });
    document.getElementById('bin-statusbar').textContent = `${items.length} object(s)`;
  }

  function renderDisplay() {
    const body = document.getElementById('display-body');
    body.innerHTML = `
      <div class="disp-preview raised">
        <div class="disp-screen sunken" id="disp-screen">
          <div class="disp-win raised"><div class="disp-tb"></div></div>
        </div>
      </div>
      <fieldset class="group">
        <legend>Scheme</legend>
        <select id="opt-theme">
          ${Object.entries(THEMES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
        </select>
      </fieldset>
      <fieldset class="group">
        <legend>Wallpaper</legend>
        ${Object.entries(WALLPAPERS).map(([k, v]) =>
          `<label class="opt-row"><input type="radio" name="wallpaper" value="${k}"> ${v}</label>`).join('')}
      </fieldset>
      <fieldset class="group">
        <legend>Effects</legend>
        <label class="opt-row"><input type="checkbox" id="opt-crt"> CRT scanlines</label>
        <label class="opt-row"><input type="checkbox" id="opt-sound"> Sound effects</label>
        <label class="opt-row"><input type="checkbox" id="opt-saver"> Screensaver after 1 minute idle</label>
        <label class="opt-row"><input type="checkbox" id="opt-skipboot"> Skip boot screen</label>
      </fieldset>
      <div class="dlg-actions">
        <button class="win95" id="disp-reset">Reset</button>
        <button class="win95" id="disp-ok">OK</button>
      </div>
    `;

    document.getElementById('opt-theme').addEventListener('change', e => applySettings({ theme: e.target.value }));
    body.querySelectorAll('input[name="wallpaper"]').forEach(r => {
      r.addEventListener('change', () => applySettings({ wallpaper: r.value }));
    });
    document.getElementById('opt-crt').addEventListener('change', e => applySettings({ crt: e.target.checked }));
    document.getElementById('opt-sound').addEventListener('change', e => applySettings({ sound: e.target.checked }));
    document.getElementById('opt-saver').addEventListener('change', e => applySettings({ screensaver: e.target.checked }));
    document.getElementById('opt-skipboot').addEventListener('change', e => applySettings({ skipBoot: e.target.checked }));
    document.getElementById('disp-reset').addEventListener('click', () => applySettings({ ...DEFAULTS }));
    document.getElementById('disp-ok').addEventListener('click', () => closeWindow(windows.display));
  }

  function syncDisplay() {
    const theme = document.getElementById('opt-theme');
    if (!theme) return;
    theme.value = settings.theme;
    document.querySelectorAll('#display-body input[name="wallpaper"]').forEach(r => {
      r.checked = (r.value === settings.wallpaper);
    });
    document.getElementById('opt-crt').checked = settings.crt;
    document.getElementById('opt-sound').checked = settings.sound;
    document.getElementById('opt-saver').checked = settings.screensaver;
    document.getElementById('opt-skipboot').checked = settings.skipBoot;
    document.getElementById('disp-screen').dataset.wallpaper = settings.wallpaper;
  }

  function renderBlog() {
    const addrBar    = document.getElementById('blog-addr');
    const statusText = document.getElementById('blog-status-text');
    const backBtn    = document.getElementById('blog-back');
    const fwdBtn     = document.getElementById('blog-fwd');
    const body       = document.getElementById('blog-body');
    const defaultUrl = 'https://medium.com/@R4hulRay';

    // ── Navigation history stack ──────────────────────────────
    const navHistory = [];
    let pos = -1;

    function updateNavBtns() {
      backBtn.disabled = (pos <= 0);
      fwdBtn.disabled  = (pos >= navHistory.length - 1);
    }

    function navigate(entry, pushHistory = true) {
      if (pushHistory) {
        navHistory.splice(pos + 1);
        navHistory.push(entry);
        pos = navHistory.length - 1;
      }
      updateNavBtns();
      if (entry.type === 'list') {
        addrBar.textContent    = defaultUrl;
        statusText.textContent = 'Done';
        showList();
      } else {
        addrBar.textContent    = entry.post.url;
        statusText.textContent = entry.post.title;
        showArticle(entry.post);
      }
    }

    backBtn.addEventListener('click', () => {
      if (pos > 0) { pos--; navigate(navHistory[pos], false); }
    });
    fwdBtn.addEventListener('click', () => {
      if (pos < navHistory.length - 1) { pos++; navigate(navHistory[pos], false); }
    });

    // ── List view ─────────────────────────────────────────────
    function showList() {
      if (!DATA.blog || DATA.blog.length === 0) {
        body.innerHTML = '<p class="blog-empty">No posts yet — add entries to DATA.blog in data.js</p>';
        return;
      }
      const headerHtml = `
        <div class="blog-header">
          <svg class="blog-header-globe" width="20" height="20" viewBox="0 0 34 34">
            <circle cx="17" cy="17" r="15" fill="#fff" opacity="0.25"/>
            <ellipse cx="17" cy="17" rx="6" ry="15" fill="none" stroke="#fff" stroke-width="1.5"/>
            <line x1="2" y1="17" x2="32" y2="17" stroke="#fff" stroke-width="1.5"/>
            <path d="M5 10 Q17 14 29 10" fill="none" stroke="#fff" stroke-width="1"/>
            <path d="M5 24 Q17 20 29 24" fill="none" stroke="#fff" stroke-width="1"/>
          </svg>
          Rahul Ray — Writing &amp; Articles
        </div>`;
      const cardsHtml = DATA.blog.map((post, i) => `
        <div class="blog-card" data-idx="${i}">
          <a class="blog-card-title blog-card-open" href="#" data-idx="${i}">${post.title}</a>
          <div class="blog-card-meta">${post.date}</div>
          <p class="blog-card-summary">${post.summary}</p>
          ${post.content
            ? `<a class="blog-card-visit blog-card-open" href="#" data-idx="${i}">Read inside ➜</a>`
            : `<a class="blog-card-visit" href="${post.url}" target="_blank" rel="noopener">Read on Medium ➜</a>`}
        </div>`).join('');
      body.innerHTML = headerHtml + cardsHtml;

      body.querySelectorAll('.blog-card').forEach(card => {
        const post = DATA.blog[+card.dataset.idx];
        card.addEventListener('mouseenter', () => { addrBar.textContent = post.url; statusText.textContent = post.title; });
        card.addEventListener('mouseleave', () => { addrBar.textContent = defaultUrl; statusText.textContent = 'Done'; });
      });
      body.querySelectorAll('.blog-card-open').forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault();
          const post = DATA.blog[+link.dataset.idx];
          if (post && post.content) navigate({ type: 'article', post });
        });
      });
    }

    // ── Article view ──────────────────────────────────────────
    function showArticle(post) {
      body.innerHTML = `
        <div class="article-view">
          <div class="article-meta-bar">
            <span class="article-date">${post.date}</span>
            <a class="article-ext-link" href="${post.url}" target="_blank" rel="noopener">Open on Medium ↗</a>
          </div>
          <h1 class="article-title">${post.title}</h1>
          <div class="article-body">${post.content}</div>
        </div>`;
    }

    // ── Boot: start on list view ──────────────────────────────
    navigate({ type: 'list' });
  }


  /* ═══════════════════════════════════════════════════════════════
     WINDOW MANAGEMENT
  ═══════════════════════════════════════════════════════════════ */

  const windows = {
    about     : document.getElementById('win-about'),
    experience: document.getElementById('win-experience'),
    skills    : document.getElementById('win-skills'),
    projects  : document.getElementById('win-projects'),
    resume    : document.getElementById('win-resume'),
    contact   : document.getElementById('win-contact'),
    blog      : document.getElementById('win-blog'),
    terminal  : document.getElementById('win-terminal'),
    display   : document.getElementById('win-display'),
    bin       : document.getElementById('win-bin'),
    games     : document.getElementById('win-games'),
    bugsquash : document.getElementById('win-bugsquash'),
    dodger    : document.getElementById('win-dodger'),
    match     : document.getElementById('win-match'),
  };
  const titles = {
    about     : 'About Me',
    experience: 'Experience',
    skills    : 'Skills.txt',
    projects  : 'Projects',
    resume    : 'Resume.pdf',
    contact   : 'Contact Me',
    blog      : 'Blog (IE)',
    terminal  : 'MS-DOS Prompt',
    display   : 'Display Properties',
    bin       : 'Recycle Bin',
    games     : 'Games',
    bugsquash : 'Bug Squash',
    dodger    : 'Star Dodger',
    match     : 'Tech Match',
  };
  let zTop = 100;
  const taskbarItems = document.getElementById('taskbar-items');
  const taskbarBtns  = {};
  const keyOf = win => Object.keys(windows).find(k => windows[k] === win);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const isVisible = win => win.style.display === 'flex' && !win.classList.contains('closing');

  // #projects etc. — shareable deep links to a window
  function setHash(key) {
    const url = location.pathname + location.search + (key ? '#' + key : '');
    try { history.replaceState(null, '', url); } catch (e) { /* file:// */ }
  }
  function keyFromHash() {
    const k = location.hash.slice(1);
    return windows[k] ? k : null;
  }

  function raise(win) {
    zTop += 1;
    win.style.zIndex = zTop;
    Object.values(windows).forEach(w => w.classList.add('inactive'));
    win.classList.remove('inactive');
    Object.keys(taskbarBtns).forEach(k => taskbarBtns[k].classList.remove('active'));
    const key = keyOf(win);
    if (key && taskbarBtns[key]) taskbarBtns[key].classList.add('active');
    if (key) setHash(key);
    if (key === 'terminal') setTimeout(() => document.getElementById('term-in').focus(), 0);
  }

  // After a close/minimize, hand focus to the next window down the stack.
  function focusTopWindow() {
    const next = Object.values(windows)
      .filter(isVisible)
      .sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
    if (next) { raise(next); return; }
    Object.keys(taskbarBtns).forEach(k => taskbarBtns[k].classList.remove('active'));
    setHash(null);
  }

  function showWin(win) {
    clearTimeout(win._hideTimer);
    win.classList.remove('closing', 'opening');
    win.classList.add('open');
    win.style.display = 'flex';
    win.dataset.minimized = '0';
    void win.offsetWidth;  // restart the animation
    win.classList.add('opening');
  }

  function hideWin(win, after) {
    win.classList.remove('opening');
    win.classList.add('closing');
    clearTimeout(win._hideTimer);
    win._hideTimer = setTimeout(() => {
      win.classList.remove('closing');
      win.style.display = 'none';
      if (after) after();
    }, 140);
  }

  function minimizeWindow(win) {
    SFX.play('click');
    win.dataset.minimized = '1';
    win.classList.add('closing');  // excluded from focusTopWindow immediately
    hideWin(win);
    focusTopWindow();
  }

  function ensureTaskbarBtn(key) {
    if (taskbarBtns[key]) return;
    const btn = document.createElement('div');
    btn.className = 'taskbar-item raised';
    const icon = windows[key].querySelector('.tb-left svg');
    if (icon) btn.appendChild(icon.cloneNode(true));
    btn.appendChild(document.createTextNode(titles[key]));
    btn.addEventListener('click', () => {
      const win = windows[key];
      if (!isVisible(win) || win.dataset.minimized === '1') {
        showWin(win);
        raise(win);
      } else if (!win.classList.contains('inactive') && parseInt(win.style.zIndex || 0) === zTop) {
        minimizeWindow(win);
      } else {
        raise(win);
      }
    });
    taskbarItems.appendChild(btn);
    taskbarBtns[key] = btn;
  }

  // Games (games.js) start fresh each time their window is opened, and stop on close
  const gameInstances = {};
  function mountGame(key) {
    if (typeof GAMES === 'undefined' || !GAMES[key] || gameInstances[key]) return;
    const win = windows[key];
    gameInstances[key] = GAMES[key](win.querySelector('.window-body'), win.querySelector('.statusbar'), win);
  }

  // Work deferred until a window is first opened, so boot stays fast
  const onFirstOpen = {
    projects: loadGitHubStats,
    resume  : initResumeViewer,
  };

  function initResumeViewer() {
    const frame = document.getElementById('resume-frame');
    // Phones (and browsers with PDF viewing disabled) get the download fallback instead
    const canShowPdf = navigator.pdfViewerEnabled !== false && !window.matchMedia('(max-width: 640px)').matches;
    if (canShowPdf) frame.src = frame.dataset.src;
    else windows.resume.classList.add('no-pdf');
  }

  function openWindow(key) {
    const win = windows[key];
    if (!win) return;
    if (!isVisible(win)) { showWin(win); SFX.play('open'); }
    if (onFirstOpen[key]) { onFirstOpen[key](); delete onFirstOpen[key]; }
    mountGame(key);
    ensureTaskbarBtn(key);
    raise(win);
  }

  function closeWindow(win) {
    SFX.play('close');
    win.classList.add('closing');
    hideWin(win, () => win.classList.remove('open'));
    const key = keyOf(win);
    if (gameInstances[key]) {
      gameInstances[key].stop();
      delete gameInstances[key];
    }
    if (key && taskbarBtns[key]) {
      taskbarBtns[key].remove();
      delete taskbarBtns[key];
    }
    focusTopWindow();
  }

  function toggleMax(win) {
    const maxed = win.classList.toggle('maxed');
    win.querySelector('[data-max]').textContent = maxed ? '❐' : '▢';
  }

  // Desktop icon clicks (double-click on desktop, single-tap on touch, Enter on keyboard)
  document.querySelectorAll('.dicon').forEach(icon => {
    let clickTimer = null;
    const activate = () => {
      if (icon.dataset.href) window.open(icon.dataset.href, '_blank');
      else if (icon.dataset.open) openWindow(icon.dataset.open);
    };
    icon.addEventListener('click', () => {
      if (icon._dragged) return;  // a drag just ended on this icon
      document.querySelectorAll('.dicon').forEach(d => d.classList.remove('selected'));
      icon.classList.add('selected');
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; activate(); }
      else { clickTimer = setTimeout(() => { clickTimer = null; }, 350); }
    });
    icon.addEventListener('touchend', (e) => {
      if (icon.dataset.href || icon.dataset.open) { e.preventDefault(); activate(); }
    });
    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') activate();
    });
  });

  /* Draggable desktop icons (mouse only — touch keeps tap-to-open).
     The first drag switches the desktop from the flex column layout to free
     absolute positions; positions snap to a grid and persist per browser.
     "Arrange Icons" in the right-click menu restores the default layout. */
  const desk = document.getElementById('desktop-icons');
  const deskIcons = [...desk.querySelectorAll(':scope > .dicon')];
  const ICONS_KEY = 'rr-icons';
  const GRID_X = 96, GRID_Y = 78;
  const iconId = icon => icon.dataset.open || icon.dataset.href;
  const narrowScreen = () => window.matchMedia('(max-width: 640px)').matches;

  function freeLayout() {
    if (desk.classList.contains('free')) return;
    const pos = deskIcons.map(i => i.getBoundingClientRect());
    desk.classList.add('free');
    deskIcons.forEach((icon, n) => {
      icon.style.left = pos[n].left + 'px';
      icon.style.top  = pos[n].top + 'px';
    });
  }

  function saveIcons() {
    const pos = {};
    deskIcons.forEach(i => { pos[iconId(i)] = [parseInt(i.style.left), parseInt(i.style.top)]; });
    try { localStorage.setItem(ICONS_KEY, JSON.stringify(pos)); } catch (e) { /* ignore */ }
  }

  function arrangeIcons() {
    try { localStorage.removeItem(ICONS_KEY); } catch (e) { /* ignore */ }
    desk.classList.remove('free');
    deskIcons.forEach(i => { i.style.left = ''; i.style.top = ''; });
  }

  function restoreIcons() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(ICONS_KEY) || 'null'); } catch (e) { /* ignore */ }
    if (!saved || narrowScreen()) return;
    freeLayout();
    deskIcons.forEach(icon => {
      const p = saved[iconId(icon)];
      if (!p) return;
      icon.style.left = Math.min(p[0], window.innerWidth - GRID_X) + 'px';
      icon.style.top  = Math.min(p[1], window.innerHeight - 30 - GRID_Y) + 'px';
    });
  }

  deskIcons.forEach(icon => {
    icon.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || narrowScreen()) return;
      const sx = e.clientX, sy = e.clientY;
      let dragging = false, ox = 0, oy = 0;

      const move = (ev) => {
        if (!dragging) {
          if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
          dragging = true;
          freeLayout();
          ox = icon.offsetLeft; oy = icon.offsetTop;
          icon.classList.add('dragging');
        }
        icon.style.left = ox + ev.clientX - sx + 'px';
        icon.style.top  = oy + ev.clientY - sy + 'px';
      };

      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        if (!dragging) return;
        icon.classList.remove('dragging');
        icon._dragged = true;
        setTimeout(() => { icon._dragged = false; }, 0);

        // Snap to the grid; if the cell is taken, go back where it came from
        const x = clamp(Math.round(icon.offsetLeft / GRID_X) * GRID_X + 6, 6, window.innerWidth - GRID_X);
        const y = clamp(Math.round(icon.offsetTop / GRID_Y) * GRID_Y + 10, 10, window.innerHeight - 30 - GRID_Y);
        const taken = deskIcons.some(o => o !== icon &&
          Math.abs(parseInt(o.style.left) - x) < GRID_X * 0.7 &&
          Math.abs(parseInt(o.style.top) - y) < GRID_Y * 0.7);
        icon.style.left = (taken ? ox : x) + 'px';
        icon.style.top  = (taken ? oy : y) + 'px';
        saveIcons();
      };

      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });
  });
  restoreIcons();

  // Window controls (close / min / max) + drag + resize
  document.querySelectorAll('.window').forEach(win => {
    win.querySelector('[data-close]').addEventListener('click', () => closeWindow(win));
    win.querySelector('[data-min]').addEventListener('click', () => minimizeWindow(win));
    win.querySelector('[data-max]').addEventListener('click', () => toggleMax(win));
    win.addEventListener('pointerdown', () => { if (win.classList.contains('inactive')) raise(win); });

    // Shared pointer-drag helper: calls onMove(dx, dy) until release
    function track(handle, e, onMove) {
      const sx = e.clientX, sy = e.clientY;
      handle.setPointerCapture(e.pointerId);
      const move = ev => onMove(ev.clientX - sx, ev.clientY - sy);
      const up = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
      e.preventDefault();
    }

    // Drag by the titlebar; double-click it to maximize
    const tb = win.querySelector('.titlebar');
    tb.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || win.classList.contains('maxed')) return;
      const ox = win.offsetLeft, oy = win.offsetTop;
      raise(win);
      track(tb, e, (dx, dy) => {
        win.style.left = clamp(ox + dx, 80 - win.offsetWidth, window.innerWidth - 80) + 'px';
        win.style.top  = clamp(oy + dy, 0, window.innerHeight - 60) + 'px';
      });
    });
    tb.addEventListener('dblclick', (e) => {
      if (!e.target.closest('button')) toggleMax(win);
    });

    // Resize from the bottom-right grip
    const grip = document.createElement('div');
    grip.className = 'resize-grip';
    win.appendChild(grip);
    grip.addEventListener('pointerdown', (e) => {
      const ow = win.offsetWidth, oh = win.offsetHeight;
      raise(win);
      track(grip, e, (dx, dy) => {
        win.style.width  = clamp(ow + dx, 300, window.innerWidth - win.offsetLeft) + 'px';
        win.style.height = clamp(oh + dy, 180, window.innerHeight - 30 - win.offsetTop) + 'px';
      });
    });
  });

  // Start menu + desktop context menu
  const startMenu = document.getElementById('start-menu');
  const startBtn  = document.getElementById('start-btn');
  const ctxMenu   = document.getElementById('ctx-menu');

  function closeMenus() {
    startMenu.classList.remove('open');
    ctxMenu.classList.remove('open');
  }

  function runItem(item) {
    if (item.dataset.href)            window.open(item.dataset.href, '_blank');
    else if (item.dataset.hrefSelf)   window.location.href = item.dataset.hrefSelf;
    else if (item.dataset.open)       openWindow(item.dataset.open);
    else if (item.dataset.action === 'shutdown') shutDown();
    else if (item.dataset.action === 'refresh')  refreshDesktop();
    else if (item.dataset.action === 'arrange')  arrangeIcons();
    closeMenus();
  }

  startBtn.addEventListener('click', (e) => {
    SFX.play('click');
    ctxMenu.classList.remove('open');
    startMenu.classList.toggle('open');
    e.stopPropagation();
  });
  document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && e.target !== startBtn) startMenu.classList.remove('open');
    if (!ctxMenu.contains(e.target)) ctxMenu.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenus();
  });
  document.querySelectorAll('.sm-item, .ctx-item').forEach(item => {
    item.addEventListener('click', () => runItem(item));
  });

  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.window, #taskbar, #start-menu, #ctx-menu')) return;
    e.preventDefault();
    startMenu.classList.remove('open');
    ctxMenu.classList.add('open');
    ctxMenu.style.left = clamp(e.clientX, 0, window.innerWidth - ctxMenu.offsetWidth - 2) + 'px';
    ctxMenu.style.top  = clamp(e.clientY, 0, window.innerHeight - ctxMenu.offsetHeight - 32) + 'px';
  });

  function refreshDesktop() {
    const icons = document.getElementById('desktop-icons');
    icons.style.visibility = 'hidden';
    setTimeout(() => { icons.style.visibility = ''; }, 120);
  }

  function shutDown() {
    const soundOn = SFX.enabled;
    SFX.enabled = false;  // one shutdown jingle instead of a close blip per window
    Object.values(windows).filter(isVisible).forEach(closeWindow);
    SFX.enabled = soundOn;
    SFX.play('shutdown');
    const screen = document.getElementById('shutdown-screen');
    setTimeout(() => screen.classList.add('show'), 400);
    screen.addEventListener('click', () => {
      try { sessionStorage.removeItem('rr-booted'); } catch (e) { /* ignore */ }
      location.reload();
    }, { once: true });
  }

  // Clock (hover for the full date)
  function tick() {
    const d = new Date();
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    const m = d.getMinutes().toString().padStart(2, '0');
    const clock = document.getElementById('clock');
    clock.textContent = `${h}:${m} ${ampm}`;
    clock.title = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  tick(); setInterval(tick, 1000 * 10);

  // Deselect icons on desktop click
  document.body.addEventListener('click', (e) => {
    if (!e.target.closest('.dicon')) {
      document.querySelectorAll('.dicon').forEach(d => d.classList.remove('selected'));
    }
  });

  window.addEventListener('hashchange', () => {
    const key = keyFromHash();
    if (key) openWindow(key);
  });


  document.getElementById('sound-btn').addEventListener('click', () => {
    applySettings({ sound: !settings.sound });
    SFX.play('click');
  });


  /* ═══════════════════════════════════════════════════════════════
     SCREENSAVER  — starfield warp after a minute of no input
  ═══════════════════════════════════════════════════════════════ */

  const saver = document.getElementById('screensaver');
  const IDLE_MS = 60 * 1000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let idleTimer = null, saverRaf = null;

  function resetIdle() {
    if (saverRaf) stopSaver();
    clearTimeout(idleTimer);
    if (settings.screensaver && !reduceMotion.matches) idleTimer = setTimeout(startSaver, IDLE_MS);
  }

  function startSaver() {
    if (!settings.screensaver) return;
    // Not during boot, in a background tab, or while a game window is in focus
    const focused = Object.keys(windows).find(k => isVisible(windows[k]) && !windows[k].classList.contains('inactive'));
    if (!booted || document.hidden || (focused && typeof GAMES !== 'undefined' && GAMES[focused])) {
      idleTimer = setTimeout(startSaver, IDLE_MS);
      return;
    }

    const ctx = saver.getContext('2d');
    const W = saver.width = window.innerWidth;
    const H = saver.height = window.innerHeight;
    const name = DATA.profile.name.toUpperCase();
    const newStar = () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: 1 });
    const stars = Array.from({ length: 260 }, () => ({ ...newStar(), z: Math.random() }));
    const label = { x: W * 0.3, y: H * 0.4, vx: 90, vy: 65, hue: 210 };
    let last = performance.now();

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    saver.classList.add('show');

    function frame(t) {
      saverRaf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      ctx.fillStyle = 'rgba(0,0,0,0.3)';  // leaves short trails
      ctx.fillRect(0, 0, W, H);

      for (const s of stars) {
        s.z -= dt * 0.3;
        const k = 0.6 / Math.max(s.z, 0.01);
        const px = W / 2 + s.x * (W / 2) * k * 0.3;
        const py = H / 2 + s.y * (H / 2) * k * 0.3;
        if (s.z <= 0.01 || px < 0 || px > W || py < 0 || py > H) { Object.assign(s, newStar()); continue; }
        const size = (1 - s.z) * 2.6 + 0.4;
        ctx.fillStyle = `rgba(255,255,255,${1 - s.z * 0.8})`;
        ctx.fillRect(px, py, size, size);
      }

      // Name drifts and bounces off the edges, changing colour on each bounce
      ctx.font = 'bold 30px Tahoma, sans-serif';
      const w = ctx.measureText(name).width;
      label.x += label.vx * dt;
      label.y += label.vy * dt;
      if (label.x < 0 || label.x + w > W) {
        label.vx *= -1; label.hue = (label.hue + 67) % 360; label.x = clamp(label.x, 0, W - w);
      }
      if (label.y < 30 || label.y + 20 > H) {
        label.vy *= -1; label.hue = (label.hue + 67) % 360; label.y = clamp(label.y, 30, H - 20);
      }
      ctx.fillStyle = `hsl(${label.hue} 90% 65%)`;
      ctx.fillText(name, label.x, label.y);
      ctx.font = '13px Tahoma, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(DATA.profile.title, label.x, label.y + 20);
    }
    saverRaf = requestAnimationFrame(frame);
  }

  function stopSaver() {
    cancelAnimationFrame(saverRaf);
    saverRaf = null;
    saver.classList.remove('show');
  }

  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => {
    document.addEventListener(ev, resetIdle, { passive: true });
  });


  /* ═══════════════════════════════════════════════════════════════
     MS-DOS PROMPT  — a tiny shell over DATA
  ═══════════════════════════════════════════════════════════════ */

  function initTerminal() {
    const out   = document.getElementById('term-out');
    const input = document.getElementById('term-in');
    const body  = document.getElementById('term-body');
    const p     = DATA.profile;
    const history = [];
    let hpos = 0;

    function print(lines, cls) {
      [].concat(lines).forEach(text => {
        const line = document.createElement('div');
        if (cls) line.className = cls;
        line.textContent = text;
        out.appendChild(line);
      });
    }

    const commands = {
      help: () => [
        'Available commands:',
        '  about          Who is Rahul?',
        '  experience     Work history',
        '  skills         Tech stack',
        '  projects       Side projects',
        '  contact        How to reach me',
        '  games          Open the Games folder',
        '  open <app>     Open a window (' + Object.keys(windows).join(', ') + ')',
        '  theme <name>   Change colour scheme (' + Object.keys(THEMES).join(', ') + ')',
        '  sound on|off   Toggle sound effects',
        '  dir            List the desktop',
        '  date           Current date and time',
        '  cls            Clear the screen',
        '  exit           Close this window',
      ],
      about: () => [`${p.name} — ${p.title}`, p.org, '', ...p.bio.map(stripTags)],
      whoami: () => ['guest — but you can call me Rahul'],
      experience: () => DATA.experience.map(j => `[${j.date}] ${j.title} @ ${stripTags(j.org)}`),
      skills: () => DATA.skills.flatMap(g => [`${g.group}:`, '  ' + g.chips.join(', ')]),
      projects: () => DATA.projects.flatMap(pr => [`* ${pr.title}`, `  ${pr.tech}`, `  ${pr.href}`, '']),
      contact: () => [`Email     ${p.email}`, `LinkedIn  ${p.linkedin}`, `GitHub    ${p.github}`],
      games: () => { openWindow('games'); return ['Opening Games…  (try: open bugsquash, open dodger, open match)']; },
      dir: () => [' Directory of C:\\RAHUL\\DESKTOP', '', ...Object.values(titles).map(t => '   ' + t)],
      date: () => [new Date().toString()],
      cls: () => { out.innerHTML = ''; return []; },
      exit: () => { closeWindow(windows.terminal); return []; },
      open: arg => {
        if (windows[arg]) { openWindow(arg); return [`Opening ${titles[arg]}…`]; }
        return [`Unknown app "${arg || ''}". Try one of: ${Object.keys(windows).join(', ')}`];
      },
      theme: arg => {
        if (THEMES[arg]) { applySettings({ theme: arg }); return [`Theme set to ${THEMES[arg]}.`]; }
        return [`Available themes: ${Object.keys(THEMES).join(', ')}`];
      },
      sound: arg => {
        if (arg === 'on' || arg === 'off') { applySettings({ sound: arg === 'on' }); SFX.play('click'); }
        return [`Sound is ${settings.sound ? 'on' : 'off'}. Usage: sound on | sound off`];
      },
      sudo: () => ['guest is not in the sudoers file. This incident will be reported.'],
    };
    commands.clear = commands.cls;
    commands.ls    = commands.dir;

    function run(raw) {
      print('C:\\RAHUL>' + raw, 'term-echo');
      const [cmd, ...args] = raw.trim().split(/\s+/);
      if (!cmd) return;
      const fn = commands[cmd.toLowerCase()];
      if (fn) print(fn(args.join(' ').toLowerCase()));
      else {
        print(`'${cmd}' is not recognized as a command. Type 'help' for a list.`, 'term-err');
        SFX.play('error');
      }
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const raw = input.value;
        input.value = '';
        if (raw.trim()) history.push(raw);
        hpos = history.length;
        run(raw);
        body.scrollTop = body.scrollHeight;
      } else if (e.key === 'ArrowUp' && hpos > 0) {
        input.value = history[--hpos];
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        hpos = Math.min(history.length, hpos + 1);
        input.value = history[hpos] || '';
        e.preventDefault();
      }
    });
    // Click anywhere in the console to type — unless the user is selecting text
    body.addEventListener('click', () => {
      if (!window.getSelection().toString()) input.focus();
    });

    print(['RahulOS [Version 1.0]', "Type 'help' to see what you can do here.", '']);
  }


  /* ═══════════════════════════════════════════════════════════════
     RUN ALL RENDERERS, then boot
  ═══════════════════════════════════════════════════════════════ */
  renderAbout();
  renderExperience();
  renderSkills();
  renderProjects();
  renderContact();
  renderBlog();
  renderBin();
  renderDisplay();
  initTerminal();
  applySettings({});

  // Boot sequence → open About Me (or the window named in the URL hash)
  const fill = document.getElementById('bp-fill');
  const boot = document.getElementById('boot-screen');
  const bootMsg = boot.querySelector('.bs');
  const initial = keyFromHash() || 'about';
  const messages = ['Starting up…', 'Loading kernel modules…', 'Mounting /dev/experience…',
                    'Warming up FastAPI workers…', 'Electing a Raft leader…'];
  let booted = false, msgTimer = null;

  function finishBoot(delay) {
    if (booted) return;
    booted = true;
    clearInterval(msgTimer);
    try { sessionStorage.setItem('rr-booted', '1'); } catch (e) { /* ignore */ }
    boot.style.opacity = '0';
    SFX.play('startup');
    setTimeout(() => { boot.style.display = 'none'; openWindow(initial); }, delay);
  }

  let skipBoot = settings.skipBoot;
  try { skipBoot = skipBoot || sessionStorage.getItem('rr-booted') === '1'; } catch (e) { /* ignore */ }

  if (skipBoot) {
    boot.style.display = 'none';
    booted = true;
    openWindow(initial);
  } else {
    requestAnimationFrame(() => { fill.style.width = '100%'; });
    let i = 0;
    msgTimer = setInterval(() => { bootMsg.textContent = messages[++i % messages.length]; }, 500);
    setTimeout(() => finishBoot(500), 2500);
    boot.addEventListener('click', () => finishBoot(300));
  }
  resetIdle();

})();
