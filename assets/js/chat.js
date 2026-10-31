/* ===== Part 1: saved Settings (Compact Interface + notification switches) ===== */
/* BSHM LMS · assets/js/prefs.js — applies saved Settings on EVERY page (loaded automatically by assets/js/chat.js).
   Reads the same key the Settings page writes:
   teacher → bshm.teacher.settings · student → bshm.student.settings */
(function () {
  if (window.bshmPrefs && typeof window.bshmPrefs.on === 'function') return;
  var b = document.body;
  var role = b.getAttribute('data-role') || ((window.tlsGet || /\(Teacher\)/.test(document.title)) ? 'teacher' : 'student');
  var K = role === 'teacher' ? 'bshm.teacher.settings' : 'bshm.student.settings';
  function get() { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { return {}; } }
  window.bshmPrefs = window.bshmPrefs || {};
  window.bshmPrefs.get = get;
  window.bshmPrefs.on = function (label) { var s = get().sw; return !(s && s[label] === false); };   /* notifications default to ON */
  var st = document.createElement('style');
  st.textContent =
    'body.compact .st,body.compact .ov-c,body.compact .pn,body.compact .tc-card,body.compact .card,body.compact .cont{padding:12px!important}' +
    'body.compact .tc-grid,body.compact .ov-grid,body.compact .dx,body.compact .stats,body.compact .col{gap:10px!important}' +
    'body.compact .row{padding-top:8px!important;padding-bottom:8px!important}' +
    'body.compact .na li,body.compact .pn .tl li,body.compact .rec li,body.compact .an{padding-top:6px!important;padding-bottom:6px!important}' +
    'body.compact .rs-t td{padding:6px 10px!important}';
  document.head.appendChild(st);
  function apply() { b.classList.toggle('compact', !!get().compact); }
  apply(); window.addEventListener('storage', apply);
})();

/* ===== Part 1b: show the saved teacher profile (name + photo) in the navbar and dashboard ===== */
(function () {
  var b = document.body;
  var role = b.getAttribute('data-role') || ((window.tlsGet || /\(Teacher\)/.test(document.title)) ? 'teacher' : 'student');
  if (role !== 'teacher') return;
  function getP() { return window.tlsTeacherProfileGet ? window.tlsTeacherProfileGet() : {}; }
  function navName(n) {                               /* "Prof. Liza Santos" -> "Santos, Liza" */
    n = String(n || '').replace(/^prof\.?\s*/i, '').trim();
    if (!n || n.indexOf(',') > -1) return n;
    var p = n.split(/\s+/); if (p.length < 2) return n;
    var last = p.pop(); return last + ', ' + p.join(' ');
  }
  var DK = 'bshm.directory', DBU = String((window.BSHM_CHAT || {}).firebaseUrl || '').replace(/\/+$/, ''), pushed = false;
  /* share name + photo so students see them in chat (same browser; also online if firebaseUrl is set) */
  function publish(P) {
    var session = null, accounts = [];
    try { session = JSON.parse(sessionStorage.getItem('aces_session') || 'null'); } catch (e) {}
    try { accounts = JSON.parse(localStorage.getItem('bshm.accounts') || '[]'); } catch (e) {}
    if (!session || !session.id) return;
    var account = accounts.filter(function (a) { return a && a.role === 'teacher' && String(a.id) === String(session.id); })[0];
    var cid = window.tlsTeacherChatIdGet ? window.tlsTeacherChatIdGet() : '';
    if (!cid) {
      cid = account && account.name || session.fullName || session.name || '';
      if (cid && window.tlsTeacherChatIdSet) window.tlsTeacherChatIdSet(cid);
    }
    if (!cid) return;
    var key = 'teacher.' + encodeURIComponent(String(session.id)), d;
    try { d = JSON.parse(localStorage.getItem(DK)) || {}; } catch (e) { d = {}; }
    var en = Object.assign({}, d[key] || {}, {
      role: 'teacher',
      teacherId: session.id,
      name: P.name || account && account.name || session.fullName || session.name || '',
      photo: P.photo || '',
      position: P.position || ''
    }), ch = JSON.stringify(d[key]) !== JSON.stringify(en);
    if (ch) { d[key] = en; try { localStorage.setItem(DK, JSON.stringify(d)); } catch (e) {} }
    if (DBU && (ch || !pushed)) {
      pushed = true;
      fetch(DBU + '/bshm_dir/' + key.replace(/[^a-z0-9]/g, '_') + '.json', { method: 'PUT', body: JSON.stringify(Object.assign({ k: key }, en)) }).catch(function () {});
    }
  }
  function apply() {
    var P = getP(), nm = navName(P.name), u = document.querySelector('header.topnav .user b');
    /* chat + course links are matched by the ORIGINAL account name, so keep it fixed before the first rename */
    if (u && window.tlsTeacherChatIdGet && window.tlsTeacherChatIdSet && !window.tlsTeacherChatIdGet() && u.textContent.trim()) {
      window.tlsTeacherChatIdSet(u.textContent.trim());
    }
    if (nm && u && u.textContent !== nm) u.textContent = nm;
    publish(P);
    var parts = nm.split(','), ini = nm ? ((parts[1] || parts[0]).trim()[0] + parts[0].trim()[0]).toUpperCase() : '';
    [].slice.call(document.querySelectorAll('header.topnav .av,.wel .av,.photo .big')).forEach(function (a) {
      if (P.photo) {
        a.style.backgroundImage = 'url("' + P.photo + '")'; a.style.backgroundSize = 'cover'; a.style.backgroundPosition = 'center'; a.style.color = 'transparent';
      } else {
        a.style.backgroundImage = ''; a.style.backgroundSize = ''; a.style.backgroundPosition = ''; a.style.color = '';
        if (ini && !a.children.length && a.textContent !== ini) a.textContent = ini;
      }
    });
  }
  window.bshmApplyProfile = apply;
  apply(); setInterval(apply, 1500); window.addEventListener('storage', apply);
})();

/* ===== Part 1c: STUDENT name = always the logged-in ACES session =====
   FIX: dati, ni-lock ng code na ito ang unang pangalan na nakita (bshm.student.chatid)
   at ibinabalik tuwing 1.5s kaya "Alcantara, Kenneth" ang naiiwan sa header.
   Ngayon ang session ang source, at ina-update nito ang chatid para laging sync. */
(function () {
  var b = document.body;
  var role = b.getAttribute('data-role') || ((window.tlsGet || /\(Teacher\)/.test(document.title)) ? 'teacher' : 'student');
  if (role !== 'student') return;
  var SID = 'bshm.student.chatid';

  /* "Last, First" galing sa session (firstName/lastName, o fullName/name) */
  function sessionName() {
    var s = null;
    try { s = JSON.parse(sessionStorage.getItem('aces_session') || 'null'); } catch (e) {}
    if (!s) return '';
    var first = String(s.firstName || '').trim(), last = String(s.lastName || '').trim();
    if (!first && !last) {
      var full = String(s.fullName || s.name || '').trim();
      if (full.indexOf(',') > -1) {
        var c = full.split(','); last = c[0].trim(); first = c.slice(1).join(',').trim();
      } else {
        var p = full.split(/\s+/); first = p[0] || ''; last = p.length > 1 ? p[p.length - 1] : '';
      }
    }
    return last ? last + ', ' + first : first;
  }
  window.bshmStudentName = sessionName;

  function apply() {
    var name = sessionName();
    if (!name) return;                                  /* walang session: huwag galawin */
    try { if (localStorage.getItem(SID) !== name) localStorage.setItem(SID, name); } catch (e) {}
    var u = document.querySelector('header.topnav .user b');
    if (!u) return;
    if (u.textContent !== name) u.textContent = name;
    var parts = name.split(','), ini = (((parts[1] || parts[0]).trim()[0] || '') + (parts[0].trim()[0] || '')).toUpperCase();
    [].slice.call(document.querySelectorAll('header.topnav .av')).forEach(function (a) {
      if (!a.children.length && !a.style.backgroundImage && a.textContent !== ini) a.textContent = ini;
    });
  }
  apply(); setInterval(apply, 1500); window.addEventListener('storage', apply);
})();

/* ===== Part 2: chat ===== */
/* BSHM LMS — Student ⇄ Teacher chat
   Add ONE line before </body> on the teacher AND student dashboards (and any other page):
   <script src="assets/js/chat.js"></script>
   Works like the rest of your LMS: messages live in localStorage ("bshm.chat"),
   so both roles see them on the same browser/origin and update live across tabs. */
(function () {
  if (window.__bshmChat) return; window.__bshmChat = 1;
  var KEY = 'bshm.chat', TEACHER = 'Prof. Santos, Liza';   /* fallback only */
  var role = (document.body.getAttribute('data-role') || ((window.tlsGet || /\(Teacher\)/.test(document.title)) ? 'teacher' : 'student')) === 'teacher' ? 'teacher' : 'student';

  /* ---------- storage ---------- */
  /* CONNECTED MODE: set this before assets/js/chat.js on every page:
       <script>window.BSHM_CHAT = { firebaseUrl: 'https://YOUR-PROJECT-default-rtdb.firebaseio.com' };</script>
     Without it, chat falls back to localStorage (same browser only). */
  var CFG = window.BSHM_CHAT || {}, DB = String(CFG.firebaseUrl || '').replace(/\/+$/, ''), NODE = DB + '/bshm_chat';
  var cache = [], M = {}, es = null;

  function load() {
    if (!DB) { try { cache = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cache = []; } }
    return cache;
  }
  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(cache.slice(-1000))); return true; }
    catch (e) { console.error('[chat] Could not save messages to browser storage.', e); return false; }
  }
  function put(m) {                                   /* add a message */
    if (!DB) {
      load(); cache.push(m);
      if (!saveLocal()) { cache.pop(); return false; }
      return true;
    }
    M[m.id] = m; rebuild();
    return fetch(NODE + '/' + m.id + '.json', { method: 'PUT', body: JSON.stringify(m) }).then(function (response) {
      if (!response.ok) throw new Error('Chat server returned HTTP ' + response.status + '.');
      return true;
    }).catch(function (error) {
      delete M[m.id]; rebuild();
      console.error('[chat] Could not deliver message to the configured chat server.', error);
      return false;
    });
  }
  function setRead(m) {                               /* mark one message read */
    m.read = 1;
    if (!DB) { saveLocal(); return; }
    fetch(NODE + '/' + m.id + '.json', { method: 'PATCH', body: JSON.stringify({ read: 1 }) }).catch(function () {});
  }
  function rebuild() {
    cache = Object.keys(M).map(function (k) { return M[k]; }).filter(function (m) { return m && m.text; })
      .sort(function (a, b) { return a.at - b.at; }).slice(-1000);
  }
  function apply(path, data, merge) {                 /* Firebase stream events */
    var p = String(path).split('/').filter(Boolean), id = p[0];
    if (!p.length) {
      if (merge && data) { for (var k in data) { if (data[k] == null) delete M[k]; else M[k] = data[k]; } } else M = data || {};
    } else if (p.length === 1) {
      if (data == null) delete M[id]; else M[id] = merge ? Object.assign(M[id] || {}, data) : data;
    } else { M[id] = M[id] || {}; M[id][p[1]] = data; }
    rebuild();
  }
  function pullDir() {                                /* teacher + student names, photos and profiles published online */
    if (!DB) return;
    fetch(DB + '/bshm_dir.json').then(function (r) { return r.json(); }).then(function (o) {
      if (!o) return;
      var d; try { d = JSON.parse(localStorage.getItem('bshm.directory')) || {}; } catch (e) { d = {}; }
      for (var k in o) if (o[k] && o[k].k) d[o[k].k] = o[k];   /* keep ALL fields (role, email, mobile, section...) */
      try { localStorage.setItem('bshm.directory', JSON.stringify(d)); } catch (e) {}
      render();
    }).catch(function () {});
  }
  function connect() {
    if (!DB) return;
    function pull() {                                 /* fallback: plain fetch if streaming is blocked */
      fetch(NODE + '.json').then(function (r) { return r.json(); }).then(function (d) {
        M = d || {}; rebuild();
        if (!primed) primeExisting();
        render();
      }).catch(function () {});
    }
    pullDir(); if (!connect.d) connect.d = setInterval(pullDir, 20000);
    pull();
    if (!window.EventSource) return;
    try {
      es = new EventSource(NODE + '.json');
      es.addEventListener('put', function (e) { try { var d = JSON.parse(e.data); apply(d.path, d.data, false); render(); } catch (x) {} });
      es.addEventListener('patch', function (e) { try { var d = JSON.parse(e.data); apply(d.path, d.data, true); render(); } catch (x) {} });
      es.onerror = function () { if (es.readyState === 2) { es = null; setTimeout(connect, 5000); } };
    } catch (e) {}
    if (!connect.t) connect.t = setInterval(function () { if (!es || es.readyState !== 1) pull(); }, 5000);
  }
  var lc = function (s) { var v = String(s == null ? '' : s).trim().toLowerCase(); return v === 'prof. santos' ? 'prof. santos, liza' : v; };  /* old test messages */
  function personKey(n) {
    var value = String(n || '').replace(/^prof\.?\s*/i, '').trim();
    if (value.indexOf(',') > -1) value = value.split(',').map(function (part) { return part.trim(); }).reverse().join(' ');
    var parts = value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    return parts.length > 1 ? parts[0] + ' ' + parts[parts.length - 1] : (parts[0] || '');
  }
  var samePerson = function (a, b) { var ka = personKey(a), kb = personKey(b); return !!ka && ka === kb; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- who am I / who can I talk to ---------- */
  function me() {
    var u = document.querySelector('.user b'), n = u ? u.textContent.trim() : '';
    if (role === 'teacher') {
      var session = null, accounts = [], directory = {};
      try { session = JSON.parse(sessionStorage.getItem('aces_session') || 'null'); } catch (e) {}
      try { accounts = JSON.parse(localStorage.getItem('bshm.accounts')) || []; } catch (e) {}
      try { directory = JSON.parse(localStorage.getItem('bshm.directory')) || {}; } catch (e) {}
      var account = accounts.filter(function (a) { return a && a.role === 'teacher' && session && String(a.id) === String(session.id); })[0];
      var entry = Object.keys(directory).map(function (k) { return directory[k]; }).filter(function (d) {
        return d && d.role === 'teacher' && session && String(d.teacherId || '') === String(session.id);
      })[0];
      n = entry && entry.name || account && account.name || session && (session.fullName || session.name) || n;
      if (!entry && !account && !session && localStorage.getItem('bshm.teacher.chatid')) n = localStorage.getItem('bshm.teacher.chatid');
      return n ? (/^prof\./i.test(n) ? n : 'Prof. ' + n) : TEACHER;              /* "Santos, Liza" -> "Prof. Santos, Liza" */
    }
    /* student: laging galing sa naka-login na session (hindi na naka-lock sa lumang pangalan) */
    var sn = '';
    try { sn = (window.bshmStudentName && window.bshmStudentName()) || ''; } catch (e) {}
    if (sn) {
      n = sn;
      try { localStorage.setItem('bshm.student.chatid', sn); } catch (e) {}
    } else {
      var sid = ''; try { sid = localStorage.getItem('bshm.student.chatid') || ''; } catch (e) {}
      if (sid) n = sid;
    }
    n = n || 'Dela Cruz, Juan';
    var m = n.match(/^([^,]+),\s*(.+)$/);
    return m ? m[2] + ' ' + m[1] : n;                /* "Baba, Bahog" -> "Bahog Baba" */
  }
  /* Student contacts are backed by active teacher accounts, not only page demo data. */
  function teachersFromPage() {
    var directory = {}, accounts = [], assignments = {}, out = [], seen = {}, hasAccountStore = false;
    try { hasAccountStore = localStorage.getItem('bshm.accounts') !== null; } catch (e) {}
    try { directory = JSON.parse(localStorage.getItem('bshm.directory')) || {}; } catch (e) {}
    try { accounts = JSON.parse(localStorage.getItem('bshm.accounts')) || []; } catch (e) {}
    try { assignments = JSON.parse(localStorage.getItem('bshm.assignments')) || {}; } catch (e) {}
    function accountFor(id) {
      return accounts.filter(function (a) { return a && a.role === 'teacher' && String(a.id) === String(id); })[0];
    }
    function directoryFor(id) {
      return Object.keys(directory).map(function (k) { return directory[k]; }).filter(function (d) {
        return d && d.role === 'teacher' && String(d.teacherId || '') === String(id);
      })[0];
    }
    function add(name, id) {
      name = String(name || '').trim();
      id = id == null ? '' : String(id);
      var key = id ? 'id:' + id : 'name:' + personKey(name);
      if (name && personKey(name) && !seen[key]) {
        seen[key] = 1;
        out.push({ name: name, id: id, role: 'teacher' });
      }
    }
    var enrolled = {};
    (window.ACES_COURSES || []).forEach(function (c) {
      if (c && c[0]) enrolled[String(c[0]).replace(/[^a-z0-9]/gi, '').toLowerCase()] = 1;
    });
    try {
      (JSON.parse(localStorage.getItem('bshm.student.courses')) || []).forEach(function (c) {
        if (c && c.code) enrolled[String(c.code).replace(/[^a-z0-9]/gi, '').toLowerCase()] = 1;
      });
    } catch (e) {}
    Object.keys(assignments).forEach(function (id) {
      var assignedClasses = assignments[id] || [];
      if (!assignedClasses.some(function (c) {
        return c && c[0] && enrolled[String(c[0]).replace(/[^a-z0-9]/gi, '').toLowerCase()];
      })) return;
      var account = accountFor(id), profile = directoryFor(id);
      if (account && account.status !== 'disabled') add(profile && profile.name || account.name || account.username, id);
    });
    accounts.forEach(function (account) {
      if (!account || account.role !== 'teacher' || account.status === 'disabled' || account.deleted) return;
      var profile = directoryFor(account.id);
      add(profile && profile.name || account.name || account.username, account.id);
    });
    Object.keys(directory).forEach(function (key) {
      var profile = directory[key], account;
      if (!profile || profile.role !== 'teacher' || !profile.teacherId) return;
      account = accountFor(profile.teacherId);
      if (hasAccountStore && !account) return;
      if (account && (account.status === 'disabled' || account.deleted)) return;
      add(profile.name || key, profile.teacherId);
    });
    try { localStorage.setItem('bshm.student.teachers', JSON.stringify(out.map(function (c) { return c.name; }))); } catch (e) {}
    return out;
  }
  function currentId() {
    var session = null;
    try { session = JSON.parse(sessionStorage.getItem('aces_session') || 'null'); } catch (e) {}
    if (!session) return '';
    return String(role === 'student' ? session.studentId || session.id || '' : session.id || '');
  }
  function personId(name, personRole) {
    if (personRole === role && samePerson(name, me())) return currentId();
    var accounts = [], students = [], directory = {};
    try { accounts = JSON.parse(localStorage.getItem('bshm.accounts')) || []; } catch (e) {}
    try { students = JSON.parse(localStorage.getItem('aces_users')) || []; } catch (e) {}
    try { directory = JSON.parse(localStorage.getItem('bshm.directory')) || {}; } catch (e) {}
    if (personRole === 'teacher') {
      var teacher = accounts.filter(function (a) {
        return a && a.role === 'teacher' && a.status !== 'disabled' &&
          (samePerson(a.name, name) || String(a.username || '').toLowerCase() === String(name || '').toLowerCase());
      })[0];
      if (teacher) return String(teacher.id);
      var teacherEntry = Object.keys(directory).map(function (k) { return directory[k]; }).filter(function (d) {
        return d && d.role === 'teacher' && samePerson(d.name, name);
      })[0];
      return teacherEntry && teacherEntry.teacherId ? String(teacherEntry.teacherId) : '';
    }
    var student = students.filter(function (s) {
      if (!s) return false;
      var studentName = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ') || s.fullName || s.name;
      return s.status !== 'disabled' && samePerson(studentName, name);
    })[0];
    return student && student.studentId ? String(student.studentId) : '';
  }
  function endpointMatches(message, side, name, personRole) {
    var roleKey = side + 'Role', idKey = side + 'Id', messageRole = message[roleKey];
    if (messageRole && messageRole !== personRole) return false;
    var label = name && typeof name === 'object' ? name.name : name;
    var wantedId = name && typeof name === 'object' && name.id ? String(name.id) : '';
    if (!wantedId && personRole === role && samePerson(label, me())) wantedId = currentId();
    if (!wantedId) wantedId = personId(label, personRole);
    if (wantedId && message[idKey]) return String(message[idKey]) === wantedId;
    return samePerson(message[side], label);
  }
  function contacts() {
    var set = {}, out = [], mine = me();
    function add(contact) {
      if (typeof contact === 'string') contact = { name: contact };
      if (!contact || !contact.name) return;
      var id = String(contact.id || personId(contact.name, contact.role || otherRole) || '');
      var key = id ? 'id:' + id : 'name:' + personKey(contact.name);
      if (personKey(contact.name) && !set[key]) {
        set[key] = { name: String(contact.name), id: id, role: contact.role || otherRole };
      }
    }
    if (role === 'student') {
      teachersFromPage().forEach(add);
      load().forEach(function (m) {
        if (endpointMatches(m, 'to', mine, role)) add({ name: m.from, id: m.fromId, role: 'teacher' });
      });
      Object.keys(set).forEach(function (k) { out.push(set[k]); });
      return out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    }
    load().forEach(function (m) {
      if (endpointMatches(m, 'to', mine, role) && (!m.fromRole || m.fromRole === 'student')) {
        add({ name: m.from, id: m.fromId, role: 'student' });
      }
    });
    Object.keys(set).forEach(function (k) { out.push(set[k]); });
    return out.sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  var otherRole = role === 'student' ? 'teacher' : 'student';
  var thread = function (a, b) { return load().filter(function (m) {
    return (endpointMatches(m, 'from', a, role) && endpointMatches(m, 'to', b, otherRole)) ||
      (endpointMatches(m, 'from', b, otherRole) && endpointMatches(m, 'to', a, role));
  }); };
  var unreadFrom = function (who) { return load().filter(function (m) { return endpointMatches(m, 'from', who, otherRole) && endpointMatches(m, 'to', me(), role) && !m.read; }).length; };
  var unreadAll = function () { return load().filter(function (m) { return endpointMatches(m, 'to', me(), role) && !m.read; }).length; };

  /* ---------- styles ---------- */
  var css = '' +
    '.bc-fab{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:9998;display:flex;align-items:center;gap:8px;height:50px;padding:0 20px 0 16px;border:0;border-radius:999px;background:#6D3FEA;color:#fff;font:600 14px/1 inherit;font-family:inherit;cursor:pointer;box-shadow:0 8px 24px rgba(79,53,210,.35)}' +
    '.bc-fab:hover{background:#5B2FD6}.bc-fab:focus-visible,.bc-x:focus-visible,.bc-send:focus-visible,.bc-in:focus-visible,.bc-ct:focus-visible{outline:3px solid #B8A4FF;outline-offset:2px}' +
    '.bc-fab svg,.bc-send svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.bc-bd{position:absolute;top:-6px;right:-4px;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#E5484D;color:#fff;font-size:11.5px;font-weight:700;display:none;align-items:center;justify-content:center;border:2px solid #fff;box-sizing:border-box}' +
    '.bc-bd.on{display:flex}' +
    'header.topnav .bc-nav{border:0;cursor:pointer;font-family:inherit}header.topnav .bc-nav svg.i{animation:none;width:20px;height:20px;fill:none;stroke:#fff}' +
    'header.topnav .bc-nav .bc-bd{top:-2px;right:-2px;border:0;background:#F5C451;color:#2A2799;box-shadow:0 0 0 2px #3F34C8;min-width:18px;height:18px;font-size:10.5px}' +
    '.bc-pn{position:fixed;right:16px;top:calc(var(--hd-h,72px) + env(safe-area-inset-top,0px) + 10px);z-index:9999;width:min(720px,calc(100vw - 32px));height:min(560px,calc(100dvh - var(--hd-h,72px) - 40px));display:none;background:#fff;border:1px solid #E6E9F2;border-radius:20px;box-shadow:0 20px 50px rgba(23,27,107,.22);overflow:hidden;color:#171B6B;font-family:inherit}' +
    '.bc-pn.open{display:flex}' +
    '.bc-side{width:240px;flex:none;border-right:1px solid #EEF0F6;background:#FAF9FF;display:flex;flex-direction:column;min-height:0}' +
    '.bc-side h3{margin:0;padding:12px 12px 8px 16px;font-size:16px;display:flex;align-items:center;justify-content:space-between}.bc-sclose{display:none}' +
    '.bc-list{flex:1;overflow-y:auto;padding:0 8px 8px}' +
    '.bc-ct{display:flex;align-items:center;gap:10px;width:100%;padding:10px;border:0;border-radius:12px;background:none;text-align:left;cursor:pointer;font-family:inherit;color:inherit}' +
    '.bc-ct:hover{background:#F0EDFF}.bc-ct.on{background:#E8E2FF}' +
    '.bc-av{flex:none;width:36px;height:36px;border-radius:50%;background:#6D3FEA;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}' +
    '.bc-ct div{min-width:0;flex:1}.bc-ct b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.bc-ct small{display:block;font-size:12.5px;color:#667085;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.bc-n{flex:none;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#E5484D;color:#fff;font-size:11.5px;font-weight:700;display:flex;align-items:center;justify-content:center;box-sizing:border-box}' +
    '.bc-main{flex:1;min-width:0;display:flex;flex-direction:column}' +
    '.bc-hd{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #EEF0F6}' +
    '.bc-hd b{flex:1;font-size:15px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bc-hd small{display:block;font-weight:400;font-size:12.5px;color:#667085}' +
    '.bc-x{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#F0EDFF;color:#6D3FEA;font-size:20px;line-height:1;cursor:pointer}' +
    '.bc-back{display:none}' +
    '.bc-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:6px;background:#fff}' +
    '.bc-m{max-width:78%;padding:9px 13px;border-radius:16px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;white-space:pre-wrap}' +
    '.bc-m.me{align-self:flex-end;background:#6D3FEA;color:#fff;border-bottom-right-radius:5px}' +
    '.bc-m.th{align-self:flex-start;background:#F0EDFF;color:#171B6B;border-bottom-left-radius:5px}' +
    '.bc-t{align-self:center;font-size:12px;color:#667085;margin:8px 0 2px}' +
    '.bc-ts{display:block;margin-top:3px;font-size:11px;opacity:.7;text-align:right}' +
    '.bc-empty{margin:auto;text-align:center;color:#667085;font-size:14px;max-width:260px}' +
    '.bc-status{padding:8px 12px;color:#9F1239;background:#FFF1F2;font-size:12px}.bc-status[hidden]{display:none}' +
    '.bc-form{display:flex;gap:8px;padding:12px;border-top:1px solid #EEF0F6;align-items:flex-end}' +
    '.bc-in{flex:1;min-height:42px;max-height:110px;resize:none;padding:10px 14px;border:1px solid #E1DAFB;border-radius:14px;font:14px/1.4 inherit;font-family:inherit;color:#171B6B;background:#fff;box-sizing:border-box}' +
    '.bc-send{flex:none;width:42px;height:42px;border:0;border-radius:12px;background:#6D3FEA;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
    '.bc-send:disabled{background:#C9CEDB;cursor:not-allowed}' +
    '.bc-pn.solo .bc-side,.bc-pn.solo .bc-back{display:none}' +
    '.bc-sm{width:30px;height:30px;font-size:11.5px;display:inline-flex;vertical-align:middle;margin-right:10px}' +
    '.bc-toast{position:fixed;top:calc(var(--hd-h,72px) + env(safe-area-inset-top,0px) + 10px);right:16px;z-index:10000;display:block;max-width:min(320px,calc(100vw - 32px));text-align:left;padding:12px 16px;border:0;border-radius:16px;background:#fff;color:#171B6B;box-shadow:0 0 0 1px rgba(60,50,160,.08),0 18px 34px -16px rgba(27,27,94,.45);cursor:pointer;font-family:inherit}' +
    '.bc-toast b{display:block;font-size:13.5px}.bc-toast span{display:block;font-size:13px;color:#667085;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '@media(prefers-reduced-motion:no-preference){.bc-pn.open{animation:bcin .18s ease-out}@keyframes bcin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}}' +
    /* ---- mobile: keep the chat inside the area above the bottom navigation ---- */
    '@media(max-width:680px){' +
    '.bc-pn{left:10px;right:10px;width:auto;top:calc(var(--hd-h,72px) + env(safe-area-inset-top,0px) + 8px);bottom:calc(78px + env(safe-area-inset-bottom,0px));height:auto;max-height:none;border:1px solid #E6E9F2;border-radius:20px;box-shadow:0 20px 50px rgba(23,27,107,.22)}' +
    '.bc-side{width:100%;border-right:0}.bc-pn.chat .bc-side{display:none}.bc-pn:not(.chat) .bc-main{display:none}' +
    '.bc-sclose{display:inline-block}' +
    '.bc-back{display:inline-block}.bc-pn.solo .bc-main{display:flex!important}' +
    '.bc-ct{padding:10px;min-height:54px}' +
    '.bc-hd{padding:8px 10px;gap:8px}' +
    '.bc-x{width:38px;height:38px}' +
    '.bc-msgs{padding:12px 12px 8px}' +
    '.bc-m{max-width:85%;font-size:14.5px}' +
    '.bc-form{padding:8px 10px;gap:6px}' +
    '.bc-in{font-size:16px;min-height:42px}' +
    '.bc-send{width:42px;height:42px}' +
    '.bc-toast{left:10px;right:10px;max-width:none}}' +
    '@media(max-width:999px){.bc-fab:not(.bc-nav){bottom:calc(84px + env(safe-area-inset-bottom,0px));right:14px;height:46px;padding:0 16px 0 14px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- markup ---------- */
  var ICON = '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>';
  var fab = document.createElement('button');
  fab.className = 'bc-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Open messages');
  fab.innerHTML = ICON + '<span>Messages</span><i class="bc-bd" id="bcBd"></i>';
  var pn = document.createElement('section');
  pn.className = 'bc-pn';
  pn.setAttribute('role', 'dialog'); pn.setAttribute('aria-label', 'Messages');
  pn.innerHTML =
    '<div class="bc-side"><h3><span>Messages</span><button class="bc-x bc-sclose" id="bcClose2" type="button" aria-label="Close messages">×</button></h3><div class="bc-list" id="bcList"></div></div>' +
    '<div class="bc-main"><div class="bc-hd"><button class="bc-x bc-back" id="bcBack" type="button" aria-label="Back to conversations">‹</button>' +
    '<b id="bcTitle">Select a conversation</b><button class="bc-x" id="bcClose" type="button" aria-label="Close messages">×</button></div>' +
    '<div class="bc-msgs" id="bcMsgs"></div><div class="bc-status" id="bcStatus" role="status" aria-live="polite" hidden></div>' +
    '<div class="bc-form" id="bcForm"><textarea class="bc-in" id="bcIn" rows="1" placeholder="Write a message" aria-label="Message"></textarea>' +
    '<button class="bc-send" id="bcSend" type="button" aria-label="Send message">' + SEND + '</button></div></div>';
  document.body.appendChild(fab); document.body.appendChild(pn);
  var $ = function (i) { return document.getElementById(i); };
  function chatStatus(message) {
    var status = $('bcStatus');
    if (!status) return;
    status.textContent = message || '';
    status.hidden = !message;
  }

  /* ---------- state + render ---------- */
  var current = null;
  function nameOf(person) { return person && typeof person === 'object' ? person.name : person; }
  function idOf(person) { return person && typeof person === 'object' ? String(person.id || '') : ''; }
  function dirEntry(n, id, personRole) {
    try {
      var d = JSON.parse(localStorage.getItem('bshm.directory')) || {};
      if (n && typeof n === 'object') {
        id = id || n.id;
        personRole = personRole || n.role;
        n = n.name;
      }
      id = id ? String(id) : '';
      personRole = personRole || (role === 'teacher' ? 'student' : 'teacher');
      var entries = Object.keys(d).map(function (k) { return { key: k, entry: d[k] }; })
        .filter(function (item) {
          return item.entry && (!item.entry.role || item.entry.role === personRole);
        });
      if (id) {
        var byId = entries.filter(function (item) {
          var entryId = personRole === 'teacher' ? item.entry.teacherId : item.entry.studentId;
          return entryId != null && String(entryId) === id;
        })[0];
        if (byId) return byId.entry;
      }
      var wanted = personKey(n), matches = entries.filter(function (item) {
        var k = item.key, entry = item.entry;
        return personKey(entry.name || k) === wanted || personKey(k) === wanted;
      });
      var withPhoto = matches.filter(function (item) { return !!item.entry.photo; })[0];
      return withPhoto ? withPhoto.entry : matches[0] ? matches[0].entry : null;
    } catch (e) { return null; }
  }
  /* display name: students are NEVER labelled "Prof."; professors get "Prof." only when a student is viewing */
  function dname(n, id, personRole) {
    var label = n && typeof n === 'object' ? n.name : n;
    var e = dirEntry(n, id, personRole), nm = (e && e.name) ? e.name : label;
    if (role === 'teacher' || (e && e.role === 'student')) return nm;
    return /^prof\./i.test(nm) ? nm : 'Prof. ' + nm;
  }
  function avHtml(n, cls, id, personRole) {
    var e = dirEntry(n, id, personRole), st = e && e.photo ? ' style="background-image:url(\'' + esc(e.photo) + '\');background-size:cover;background-position:center;color:transparent"' : '';
    return '<span class="' + (cls || 'bc-av') + '"' + st + '>' + esc(initials(dname(n, id, personRole))) + '</span>';
  }
  var initials = function (n) { return n.replace(/^Prof\.\s*/i, '').split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); };
  var fmtTime = function (t) { var d = new Date(t); return isNaN(d) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); };
  var fmtDay = function (t) { var d = new Date(t), n = new Date(); if (d.toDateString() === n.toDateString()) return 'Today'; return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };

  function markRead() {
    if (!current || !pn.classList.contains('open')) return;
    load().forEach(function (m) { if (endpointMatches(m, 'from', current, otherRole) && endpointMatches(m, 'to', me(), role) && !m.read) setRead(m); });
  }
  function canReply() {
    if (role !== 'teacher' || !current) return role === 'student';
    return load().some(function (m) {
      return endpointMatches(m, 'from', current, 'student') &&
        endpointMatches(m, 'to', me(), 'teacher') &&
        (!m.fromRole || m.fromRole === 'student');
    });
  }

  function renderBadge() {
    var n = unreadAll(), b = $('bcBd');
    if (!b) return;
    b.textContent = n > 99 ? '99+' : n; b.className = 'bc-bd' + (n ? ' on' : '');
  }

  function renderList() {
    var cs = contacts();
    var rows = cs.map(function (n) {
      var t = thread(me(), n), last = t[t.length - 1];
      return { contact: n, last: last, u: unreadFrom(n), at: last ? last.at : 0 };
    }).sort(function (a, b) { return b.at - a.at || nameOf(a.contact).localeCompare(nameOf(b.contact)); });
    $('bcList').innerHTML = rows.length ? rows.map(function (r) {
      var selected = current && ((idOf(current) && idOf(current) === idOf(r.contact)) || samePerson(nameOf(current), nameOf(r.contact)));
      return '<button type="button" class="bc-ct' + (selected ? ' on' : '') + '" data-n="' + esc(r.contact.name) + '" data-id="' + esc(r.contact.id || '') + '">' +
        avHtml(r.contact.name, '', r.contact.id, r.contact.role) + '<div><b>' + esc(dname(r.contact.name, r.contact.id, r.contact.role)) + '</b><small>' + (r.last ? esc(r.last.text) : role === 'student' ? 'Start a conversation' : 'New student message') + '</small></div>' +
        (r.u ? '<span class="bc-n">' + r.u + '</span>' : '') + '</button>';
    }).join('') : '<p class="bc-empty" style="padding:16px">' +
      (role === 'student' ? 'No active teacher accounts found yet.' : 'No student messages yet.') + '</p>';
  }

  function renderMsgs() {
    var box = $('bcMsgs'), form = $('bcForm');
    if (!current) {
      $('bcTitle').textContent = 'Select a conversation';
      box.innerHTML = '<p class="bc-empty">' + (role === 'student'
        ? 'Choose a professor to start a conversation.'
        : 'New student messages will appear here. You can reply after a student contacts you.') + '</p>';
      form.style.display = 'none'; return;
    }
    var allowedToReply = canReply();
    form.style.display = allowedToReply ? '' : 'none';
    $('bcTitle').innerHTML = avHtml(current, 'bc-av bc-sm', idOf(current), current.role) + '<span style="display:inline-block;vertical-align:middle;max-width:calc(100% - 44px);overflow:hidden;text-overflow:ellipsis">' + esc(dname(current, idOf(current), current.role)) + '<small>' + (role === 'student' ? 'Professor' : 'Student') + '</small></span>';
    var t = thread(me(), current), nearEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 80, day = '';
    box.innerHTML = t.length ? t.map(function (m) {
      var d = fmtDay(m.at), h = d !== day ? '<div class="bc-t">' + esc(d) + '</div>' : ''; day = d;
      return h + '<div class="bc-m ' + (endpointMatches(m, 'from', me(), role) ? 'me' : 'th') + '">' + esc(m.text) + '<span class="bc-ts">' + esc(fmtTime(m.at)) + '</span></div>';
    }).join('') : '<p class="bc-empty">' + (role === 'student'
      ? 'No messages yet. Ask your teacher a question about a class or activity.'
      : 'You can reply here after the student sends the first message.') + '</p>';
    if (role === 'teacher' && !allowedToReply) {
      box.innerHTML += '<p class="bc-empty" style="margin:0 auto 12px">Reply becomes available after the student messages you.</p>';
    }
    if (nearEnd || !box.dataset.init) { box.scrollTop = box.scrollHeight; box.dataset.init = 1; }
  }

  /* pop-up for new messages (respects Settings → Notifications → Chat Messages) */
  var told = {}, primed = !DB;
  function primeExisting() {
    load().forEach(function (m) { told[m.id] = 1; });
    primed = true;
  }
  if (!DB) primeExisting();
  function showToast(m) {
    var old = document.querySelector('.bc-toast'); if (old) old.remove();
    var t = document.createElement('button'); t.type = 'button'; t.className = 'bc-toast';
    t.innerHTML = '<b>' + esc(dname(m.from, m.fromId, m.fromRole)) + '</b><span>' + esc(String(m.text).slice(0, 90)) + '</span>';
    t.onclick = function () { current = { name: m.from, id: m.fromId || personId(m.from, otherRole), role: otherRole }; t.remove(); pn.classList.add('chat'); open(); };
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 6000);
  }
  function notifyNew() {
    if (!primed) return;
    var mine = me();
    load().forEach(function (m) {
      if (told[m.id] || !endpointMatches(m, 'to', mine, role)) return;
      told[m.id] = 1;
      if (m.read || (pn.classList.contains('open') && endpointMatches(m, 'from', current, otherRole))) return;
      if (window.bshmPrefs && typeof window.bshmPrefs.on === 'function' && !window.bshmPrefs.on('Chat Messages')) return;
      showToast(m);
    });
  }
  function render() {
    notifyNew();
    if (role === 'student') {           /* one professor: skip the list and open the chat; several: let the student choose */
      var cs = contacts();
      if (cs.length === 1) { current = cs[0]; pn.classList.add('solo', 'chat'); }
      else {
        pn.classList.remove('solo');
        if (current && !cs.some(function (contact) {
          return (idOf(current) && idOf(current) === idOf(contact)) || samePerson(nameOf(current), nameOf(contact));
        })) current = null;
      }
    }
    markRead(); renderBadge(); renderList(); renderMsgs(); }

  /* ---------- actions ---------- */
  function send() {
    var ta = $('bcIn'), text = ta.value.trim();
    if (!text || !current || !canReply()) return;
    var message = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      from: me(), to: nameOf(current), fromId: currentId(), toId: idOf(current) || personId(nameOf(current), otherRole),
      fromRole: role, toRole: otherRole, text: text.slice(0, 1000), at: Date.now(), read: 0
    }, result = put(message);
    function finishSend(saved) {
      ta.disabled = false; $('bcSend').disabled = false;
      if (!saved) {
        ta.value = text;
        chatStatus(DB
          ? 'Message not delivered. Check the connection and Firebase chat setup, then try again.'
          : 'Message could not be saved in this browser. Check available storage, then try again.');
        render();
        ta.focus();
        return;
      }
      ta.value = ''; ta.style.height = 'auto'; $('bcMsgs').dataset.init = '';
      chatStatus(''); render(); ta.focus();
    }
    ta.disabled = true; $('bcSend').disabled = true;
    if (result && typeof result.then === 'function') result.then(finishSend);
    else finishSend(result);
  }
  function open() { pn.classList.add('open'); fab.setAttribute('aria-expanded', 'true'); $('bcMsgs').dataset.init = ''; render(); if (current) $('bcIn').focus(); }
  function close() { pn.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); fab.focus(); }

  fab.addEventListener('click', function () { pn.classList.contains('open') ? close() : open(); });
  $('bcClose').addEventListener('click', close);
  $('bcClose2').addEventListener('click', close);
  $('bcBack').addEventListener('click', function () { current = null; pn.classList.remove('chat'); render(); });
  $('bcSend').addEventListener('click', send);
  $('bcIn').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  $('bcIn').addEventListener('input', function () {
    chatStatus(''); this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 110) + 'px';
  });
  $('bcList').addEventListener('click', function (e) {
    var b = e.target.closest('.bc-ct'); if (!b) return;
    current = { name: b.getAttribute('data-n'), id: b.getAttribute('data-id') || '', role: otherRole };
    pn.classList.add('chat'); $('bcMsgs').dataset.init = ''; render();
    if (canReply()) $('bcIn').focus();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pn.classList.contains('open')) close(); });

  /* put the chat button in the navbar, left of the bell.
     assets/js/shell.js builds the navbar, so wait for it; float the button if it never appears */
  function mountNav() {
    var r = document.querySelector('header.topnav .tn-r');
    if (!r) return false;
    if (fab.parentNode !== r) {
      fab.className = 'bell bc-nav';
      fab.innerHTML = '<svg class="i" viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/></svg><i class="bc-bd" id="bcBd"></i>';
      r.insertBefore(fab, r.querySelector('.bell') || r.firstChild);
      renderBadge();
    }
    return true;
  }
  if (!mountNav()) {
    var tries = 0, t = setInterval(function () { if (mountNav() || ++tries > 20) clearInterval(t); }, 100);
    window.addEventListener('load', mountNav);
  }

  /* live updates: other tabs (storage event) + a light poll */
  window.addEventListener('storage', function (e) {
    if (!e.key || e.key === KEY || e.key === 'bshm.directory' || e.key === 'bshm.accounts' || e.key === 'aces_users' || e.key === 'bshm.assignments') render();
  });
  setInterval(function () { mountNav(); render(); }, 4000);
  connect();
  render();
})();