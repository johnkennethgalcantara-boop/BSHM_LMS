    /* ACES LMS · shared storage + routes (front-end prototype)
    Loaded by login-page, register, otp, the student dashboard and every teacher page. */
    window.ACES = (() => {
    const USERS_KEY = 'aces_users';
    const SESSION_KEY = 'aces_session';

    const routes = {
        login: 'login-page.html?role=student',
        loginTeacher: 'login-page.html?role=teacher',
        register: 'register.html',
        otp: 'otp.html',
        studentHome: 'student.html',
        teacherHome: 'teacher.html'    // must match your teacher page filename
    };

    /* Teacher accounts are created ONLY by the admin (admin.html > Faculty).
        They are stored under 'bshm.accounts'. There is no teacher sign-up page. */
    const ACCOUNTS_KEY = 'bshm.accounts';
    const readTeachers = () => {
        try {
            const v = JSON.parse(localStorage.getItem(ACCOUNTS_KEY));
            return Array.isArray(v) ? v.filter(a => a && a.role === 'teacher') : [];
        } catch { return []; }
    };

    /* ---------- Users (students) ---------- */
    const readUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } };
    const writeUsers = u => localStorage.setItem(USERS_KEY, JSON.stringify(u));
    const norm = s => (s || '').trim().toLowerCase();

    // Find by Student ID or email; a verified account wins over a pending one
    const findUser = idOrEmail => {
        const v = norm(idOrEmail);
        const hits = readUsers().filter(u => norm(u.studentId) === v || norm(u.email) === v);
        return hits.find(u => u.status === 'verified') || hits[0] || null;
    };

    /* ---------- Session ---------- */
    const getSession = () => {
        try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
    };
    const setSession = s => { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {} };
    const clearSession = () => { try { sessionStorage.removeItem(SESSION_KEY); } catch {} };

    // A session is only valid while the account still exists and is not disabled by the admin
    const accountOk = s => {
        if (!s) return false;
        if (s.role === 'teacher') {
            const t = readTeachers().find(a => String(a.id) === String(s.id));
            return !!t && t.status !== 'disabled';
        }
        if (s.role === 'student') {
            const u = readUsers().find(x => norm(x.studentId) === norm(s.studentId));
            return !!u && u.status === 'verified';
        }
        return false;
    };
    const requireStudent = () => {
        const s = getSession();
        if (s && s.role === 'student' && accountOk(s)) return s;
        clearSession();
        location.replace(routes.login);
        return null;
    };
    const requireTeacher = () => {
        const s = getSession();
        if (s && s.role === 'teacher' && accountOk(s)) return s;
        clearSession();
        location.replace(routes.loginTeacher);
        return null;
    };

    /* ---------- Logout ---------- */
    let loggingOut = false;
    const logout = () => {
        if (loggingOut) return;                       // ignore double calls
        loggingOut = true;
        const wasTeacher = (getSession() || {}).role === 'teacher';
        clearSession();
        location.replace(wasTeacher ? routes.loginTeacher : routes.login);
    };

    /* Any logout button works: data-logout, #logout, #logoutBtn, .logout,
        or any link/button/menu item whose text is "Log out", "Logout" or "Sign out". */
    document.addEventListener('click', e => {
        const el = e.target.closest && e.target.closest('[data-logout], .logout, #logout, #logoutBtn, a, button, li');
        if (!el) return;
        const text = (el.textContent || '').trim();
        const isLogout = el.matches('[data-logout], .logout, #logout, #logoutBtn') ||
                        /^(log\s?out|sign\s?out)$/i.test(text);
        if (isLogout) { e.preventDefault(); logout(); }
    });

    /* Pressing Back after logout must not show the old dashboard from cache */
    window.addEventListener('pageshow', e => {
        const role = document.body && document.body.dataset.role;
        if (e.persisted && (role === 'student' || role === 'teacher') && !getSession()) location.reload();
    });

    /* ---------- Crypto (PROTOTYPE: a real backend must hash server-side) ---------- */
    async function sha256(str) {
        if (!(window.crypto && crypto.subtle)) throw new Error('crypto-unavailable');
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    const hashPw = (pw, salt) => sha256(salt + pw);            // students (aces_users)
    const newSalt = () => [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(16).padStart(2, '0')).join('');

    // Teacher sign-in. Accepts username, email, employee ID or account id.
    // Returns the account if the password is right, null if not.
    // Throws 'account-disabled' if the admin disabled the account.
    // (Admin stores the hash as SHA-256(salt + ':' + password).)
    const checkTeacher = async (idOrEmail, pw) => {
        const v = norm(idOrEmail);
        const t = readTeachers().find(x => [x.username, x.email, x.empId, x.id].some(f => f && norm(f) === v));
        if (!t) return null;
        if ((await sha256(t.salt + ':' + pw)) !== t.hash) return null;
        if (t.status === 'disabled') throw new Error('account-disabled');
        return t;
    };

    // PROTOTYPE: demo one-time code (shown on screen because no email service exists)
    const newOtp = () => ({
        code: String(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000),
        expiresAt: Date.now() + 10 * 60 * 1000
    });

    // Shown if a page forgot to load this file
    const missing = () => {
        const t = document.getElementById('toast');
        if (t) { t.textContent = 'aces-store.js is missing. Add it before this page\'s script.'; t.classList.add('show'); }
        console.error('aces-store.js did not load');
    };

    return {
        routes, readUsers, writeUsers, norm, findUser,
        getSession, setSession, clearSession, requireStudent, requireTeacher, logout,
        checkTeacher, readTeachers, accountOk, hashPw, newSalt, newOtp, missing
    };
    })();

    /* ---------- Auto-fill ng user info sa kahit anong page ---------- */
(() => {
  'use strict';
  if (!window.ACES) return;

  const getSession = () => {
    try {
      if (typeof ACES.getSession === 'function') return ACES.getSession();
      if (typeof ACES.session === 'function') return ACES.session();
    } catch (_) {}
    return null;
  };

  const run = () => {
    const s = getSession();
    const needsLogin = document.body && document.body.hasAttribute('data-require-login');

    // Mag-redirect lang sa mga page na may data-require-login sa <body>
    if (!s) {
      if (needsLogin) location.href = 'login-page.html?role=student';
      return;
    }

    const first = s.firstName || s.name || '';
    const full = s.fullName || s.name || first;
    const initials = s.initials ||
      full.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();

    const fill = (attr, value) =>
      document.querySelectorAll('[' + attr + ']').forEach(el => { el.textContent = value; });

    fill('data-user-first', first);
    fill('data-user-name', full);
    fill('data-user-initials', initials);
    fill('data-user-email', s.email || '');
    fill('data-user-id', s.studentId || s.id || '');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

/* ---------- Palitan ang hardcoded na "Juan Dela Cruz" ng totoong user ---------- */
(() => {
  'use strict';
  if (!window.ACES) return;

  const run = () => {
    let s = null;
    try {
      s = typeof ACES.getSession === 'function' ? ACES.getSession()
        : typeof ACES.session === 'function' ? ACES.session() : null;
    } catch (_) {}

    if (!s) {
      if (document.body.hasAttribute('data-require-login')) location.href = 'login-page.html?role=student';
      return;
    }

    const first = s.firstName || (s.name || '').split(' ')[0] || '';
    const last = s.lastName || '';
    const full = s.fullName || [first, last].filter(Boolean).join(' ');
    const initials = (s.initials || ((first[0] || '') + (last[0] || ''))).toUpperCase();

    // 1) Para sa mga element na may data-user-* (kung gusto mong gamitin)
    const fill = (attr, v) => document.querySelectorAll('[' + attr + ']').forEach(el => el.textContent = v);
    fill('data-user-first', first);
    fill('data-user-name', full);
    fill('data-user-initials', initials);
    fill('data-user-email', s.email || '');
    fill('data-user-id', s.studentId || s.id || '');

    // 2) Para sa hardcoded na text: hanapin at palitan sa buong page
    const replacements = [
      [/Dela Cruz,\s*Juan/g, last ? `${last}, ${first}` : first],
      [/Juan Dela Cruz/g, full],
      [/\bJuan\b/g, first]
    ];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => {
        const p = n.parentNode && n.parentNode.nodeName;
        return (p === 'SCRIPT' || p === 'STYLE') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(n => {
      let t = n.nodeValue;
      if (t.trim() === 'JD') { n.nodeValue = t.replace('JD', initials); return; }
      replacements.forEach(([re, val]) => { t = t.replace(re, val); });
      if (t !== n.nodeValue) n.nodeValue = t;
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();



