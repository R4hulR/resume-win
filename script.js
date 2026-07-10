(function () {

  /* ═══════════════════════════════════════════════════════════════
     RENDERERS  — read DATA (data.js) and inject HTML into windows
  ═══════════════════════════════════════════════════════════════ */

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
      </div>
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

  function renderProjects() {
    const cardsHtml = DATA.projects.map(proj => `
      <div class="proj-card sunken">
        <div class="proj-title">
          <a href="${proj.href}" target="_blank" rel="noopener">${proj.title}</a>
        </div>
        <div class="proj-meta">${proj.meta}</div>
        <p style="margin:0;">${proj.desc}</p>
        <div class="proj-tech">Tech: ${proj.tech}</div>
      </div>
    `).join('');

    document.getElementById('projects-body').innerHTML = cardsHtml;
    document.getElementById('proj-statusbar').textContent =
      `${DATA.projects.length} items`;
  }

  function renderContact() {
    const p = DATA.profile;
    document.getElementById('contact-body').innerHTML = `
      <h1 class="win-h" style="margin-top:0;">Let's talk.</h1>
      <p>Open to backend / distributed-systems roles. Reach out any time.</p>
      <ul class="contact-list">
        <li>✉ <a href="mailto:${p.email}">${p.email}</a></li>
        <li>in <a href="${p.linkedin}" target="_blank" rel="noopener">linkedin.com/in/r4hulray</a></li>
        <li>⌥ <a href="${p.github}" target="_blank" rel="noopener">github.com/R4hulR</a></li>
      </ul>
    `;
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
     RUN ALL RENDERERS before anything else touches the DOM
  ═══════════════════════════════════════════════════════════════ */
  renderAbout();
  renderExperience();
  renderSkills();
  renderProjects();
  renderContact();
  renderBlog();


  /* ═══════════════════════════════════════════════════════════════
     WINDOW MANAGEMENT (OS logic — unchanged from original)
  ═══════════════════════════════════════════════════════════════ */

  const windows = {
    about     : document.getElementById('win-about'),
    experience: document.getElementById('win-experience'),
    skills    : document.getElementById('win-skills'),
    projects  : document.getElementById('win-projects'),
    resume    : document.getElementById('win-resume'),
    contact   : document.getElementById('win-contact'),
    blog      : document.getElementById('win-blog'),
  };
  const titles = {
    about     : 'About Me',
    experience: 'Experience',
    skills    : 'Skills.txt',
    projects  : 'Projects',
    resume    : 'Resume.pdf',
    contact   : 'Contact Me',
    blog      : 'Blog (IE)',
  };
  let zTop = 100;
  const taskbarItems = document.getElementById('taskbar-items');
  const taskbarBtns  = {};

  function raise(win) {
    zTop += 1;
    win.style.zIndex = zTop;
    Object.values(windows).forEach(w => w.classList.add('inactive'));
    win.classList.remove('inactive');
    Object.keys(taskbarBtns).forEach(k => taskbarBtns[k].classList.remove('active'));
    const key = Object.keys(windows).find(k => windows[k] === win);
    if (key && taskbarBtns[key]) taskbarBtns[key].classList.add('active');
  }

  function ensureTaskbarBtn(key) {
    if (taskbarBtns[key]) return;
    const btn = document.createElement('div');
    btn.className = 'taskbar-item raised';
    btn.textContent = titles[key];
    btn.addEventListener('click', () => {
      const win = windows[key];
      if (win.style.display === 'none' || win.dataset.minimized === '1') {
        win.classList.add('open');
        win.style.display = 'flex';
        win.dataset.minimized = '0';
        raise(win);
      } else if (win.classList.contains('inactive') === false && parseInt(win.style.zIndex || 0) === zTop) {
        win.dataset.minimized = '1';
        win.style.display = 'none';
      } else {
        raise(win);
      }
    });
    taskbarItems.appendChild(btn);
    taskbarBtns[key] = btn;
  }

  function openWindow(key) {
    const win = windows[key];
    if (!win) return;
    win.classList.add('open');
    win.style.display = 'flex';
    win.dataset.minimized = '0';
    ensureTaskbarBtn(key);
    raise(win);
  }

  function closeWindow(win) {
    win.classList.remove('open');
    win.style.display = 'none';
    const key = Object.keys(windows).find(k => windows[k] === win);
    if (key && taskbarBtns[key]) {
      taskbarBtns[key].remove();
      delete taskbarBtns[key];
    }
  }

  // Desktop icon clicks (double-click on desktop, single-tap on touch)
  document.querySelectorAll('.dicon').forEach(icon => {
    let clickTimer = null;
    icon.addEventListener('click', () => {
      document.querySelectorAll('.dicon').forEach(d => d.classList.remove('selected'));
      icon.classList.add('selected');
      if (icon.dataset.href) {
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; window.open(icon.dataset.href, '_blank'); }
        else { clickTimer = setTimeout(() => { clickTimer = null; }, 350); }
        return;
      }
      const key = icon.dataset.open;
      if (!key) return;
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; openWindow(key); }
      else { clickTimer = setTimeout(() => { clickTimer = null; }, 350); }
    });
    icon.addEventListener('touchend', (e) => {
      if (icon.dataset.href) { window.open(icon.dataset.href, '_blank'); return; }
      const key = icon.dataset.open;
      if (key) { e.preventDefault(); openWindow(key); }
    });
  });

  // Window controls (close / min / max) + drag
  document.querySelectorAll('.window').forEach(win => {
    win.querySelector('[data-close]').addEventListener('click', () => closeWindow(win));
    win.querySelector('[data-min]').addEventListener('click', () => {
      win.dataset.minimized = '1';
      win.style.display = 'none';
    });
    let maxed = false, prev = {};
    win.querySelector('[data-max]').addEventListener('click', () => {
      if (!maxed) {
        prev = { top: win.style.top, left: win.style.left, width: win.style.width, height: win.style.height };
        win.style.top = '0px'; win.style.left = '0px';
        win.style.width = '100vw'; win.style.height = 'calc(100vh - 30px)';
      } else {
        win.style.top = prev.top; win.style.left = prev.left;
        win.style.width = prev.width; win.style.height = prev.height;
      }
      maxed = !maxed;
    });
    win.addEventListener('mousedown', () => raise(win));

    // Mouse drag
    const tb = win.querySelector('.titlebar');
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    tb.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = win.offsetLeft; oy = win.offsetTop;
      raise(win);
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      win.style.left = Math.max(0, ox + (e.clientX - sx)) + 'px';
      win.style.top  = Math.max(0, oy + (e.clientY - sy)) + 'px';
    });
    window.addEventListener('mouseup', () => dragging = false);

    // Touch drag
    tb.addEventListener('touchstart', (e) => {
      if (e.target.closest('button')) return;
      const t = e.touches[0];
      dragging = true; sx = t.clientX; sy = t.clientY; ox = win.offsetLeft; oy = win.offsetTop;
      raise(win);
    });
    window.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      const t = e.touches[0];
      win.style.left = Math.max(0, ox + (t.clientX - sx)) + 'px';
      win.style.top  = Math.max(0, oy + (t.clientY - sy)) + 'px';
    });
    window.addEventListener('touchend', () => dragging = false);
  });

  // Start menu
  const startMenu = document.getElementById('start-menu');
  const startBtn  = document.getElementById('start-btn');
  startBtn.addEventListener('click', (e) => {
    startMenu.classList.toggle('open');
    e.stopPropagation();
  });
  document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && e.target !== startBtn) {
      startMenu.classList.remove('open');
    }
  });
  startMenu.querySelectorAll('.sm-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.dataset.href)  { window.open(item.dataset.href, '_blank'); }
      else if (item.dataset.open) { openWindow(item.dataset.open); }
      startMenu.classList.remove('open');
    });
  });

  // Clock
  function tick() {
    const d = new Date();
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    const m = d.getMinutes().toString().padStart(2, '0');
    document.getElementById('clock').textContent = `${h}:${m} ${ampm}`;
  }
  tick(); setInterval(tick, 1000 * 10);


  // Deselect icons on desktop click
  document.body.addEventListener('click', (e) => {
    if (!e.target.closest('.dicon')) {
      document.querySelectorAll('.dicon').forEach(d => d.classList.remove('selected'));
    }
  });

  // Boot sequence → open About Me
  const fill = document.getElementById('bp-fill');
  const boot = document.getElementById('boot-screen');
  requestAnimationFrame(() => { fill.style.width = '100%'; });
  setTimeout(() => {
    boot.style.opacity = '0';
    setTimeout(() => {
      boot.style.display = 'none';
      openWindow('about');
    }, 500);
  }, 2500);
  boot.addEventListener('click', () => {
    boot.style.opacity = '0';
    setTimeout(() => { boot.style.display = 'none'; openWindow('about'); }, 300);
  });

})();