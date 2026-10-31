/* ACES Polytechnic College – Student Settings (functional) */
(function () {
  var K = 'bshm.student.settings', PK = 'bshm.student.profile', DK = 'bshm.directory';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function read(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var S = read(K, {}); S.sw = S.sw || {};
  var session = null;
  try { session = JSON.parse(sessionStorage.getItem('aces_session') || 'null'); } catch (e) {}
  var users = read('aces_users', []);
  var student = session && Array.isArray(users) ? users.find(function (u) { return u && String(u.studentId).toLowerCase() === String(session.studentId).toLowerCase(); }) : null;
  var profileKey = session && session.studentId ? PK + '.' + session.studentId : PK;
  var fullName = student ? [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') : '';
  fullName = fullName || (session && (session.fullName || session.name)) || '';
  var directory = read(DK, {});
  var directoryEntry = fullName ? directory[fullName.trim().toLowerCase()] || {} : {};
  function store() {
    if (!write(K, S)) return false;
    if (window.bshmPrefs) bshmPrefs.apply();
    return true;
  }

  /* "Saved" pill */
  var pill = document.createElement('div'), pt;
  pill.setAttribute('role', 'status');
  pill.style.cssText = 'position:fixed;right:16px;top:84px;z-index:400;padding:8px 14px;border-radius:999px;background:#171B6B;color:#fff;font:600 13px Inter,sans-serif;opacity:0;transform:translateY(-6px);transition:opacity .2s,transform .2s;pointer-events:none';
  document.body.appendChild(pill);
  function saved(t) { pill.textContent = t || 'Saved'; pill.style.opacity = 1; pill.style.transform = 'none'; clearTimeout(pt); pt = setTimeout(function () { pill.style.opacity = 0; }, 1600); }

  /* ---------- tabs (remember last) ---------- */
  var tabs = $$('.tabs button');
  function show(key) {
    tabs.forEach(function (t) { var on = t.dataset.t === key; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    $$('.panel').forEach(function (p) { p.hidden = p.id !== 'p-' + key; });
    S.tab = key;
    if (!write(K, S)) saved('Could not save settings');
  }
  tabs.forEach(function (t, i) {
    t.onclick = function () { show(t.dataset.t); };
    t.onkeydown = function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); show(n.dataset.t); }
    };
  });
  show(S.tab && $('#p-' + S.tab) ? S.tab : 'account');

  /* ---------- account: synced with the profile page ---------- */
  var P = read(profileKey, session && session.studentId ? {} : read(PK, {}));
  var dl = {};
  $$('.dl > div').forEach(function (d) { dl[$('small', d).textContent.trim()] = $('b', d); });
  function setDetail(label, value) {
    if (dl[label]) dl[label].textContent = value || '—';
  }
  setDetail('Full Name', fullName);
  setDetail('Student ID', (student && student.studentId) || (session && session.studentId));
  setDetail('Email Address', P.email || (student && student.email) || (session && session.email) || directoryEntry.email);
  setDetail('Mobile Number', P.mobile || (student && (student.mobile || student.phone)) || directoryEntry.mobile);
  setDetail('Program', (student && student.program) || P.program || directoryEntry.program);
  setDetail('Year Level', (student && (student.yearLevel || student.year)) || P.year || directoryEntry.year);
  setDetail('Section', (student && student.section) || P.section || directoryEntry.section);
  var big = $('.acc .big');
  if (fullName) big.textContent = fullName.split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  function setPhoto(photo) {
    if (photo) { big.style.backgroundImage = 'url("' + photo + '")'; big.style.backgroundSize = 'cover'; big.style.backgroundPosition = 'center'; big.style.color = 'transparent'; }
    else { big.style.backgroundImage = ''; big.style.color = ''; }
  }
  setPhoto(P.photo);

  var edit = $('.ch .ghost');
  if (edit) edit.onclick = function () { location.href = 'profile.html'; };

  /* change profile photo right from Settings */
  var fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.hidden = true; document.body.appendChild(fi);
  var cam = $('.acc .photo button'); if (cam) cam.onclick = function () { fi.click(); };
  fi.onchange = function () {
    var f = fi.files[0]; fi.value = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) return saved('Choose an image file');
    if (f.size > 5 * 1024 * 1024) return saved('Photo must be under 5 MB');
    var r = new FileReader();
    r.onerror = function () { saved('Could not read image'); };
    r.onload = function () {
      var im = new Image();
      im.onerror = function () { saved('Could not read image'); };
      im.onload = function () {
        var c = document.createElement('canvas'), m = Math.min(im.width, im.height);
        c.width = c.height = 256;
        c.getContext('2d').drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, 256, 256);
        var photo = c.toDataURL('image/jpeg', 0.82);
        var p = read(profileKey, read(PK, {})); p.photo = photo;
        if (!write(profileKey, p)) return saved('Storage full – try a smaller photo');
        setPhoto(photo);
        /* push to shared directory so teachers/chat see it too */
        var name = fullName || 'student', key = name.trim().toLowerCase(), d = read(DK, {});
        d[key] = Object.assign({}, d[key] || {}, {
          role: 'student',
          studentId: session && session.studentId || '',
          name: name,
          photo: photo,
          updated: Date.now()
        });
        if (!write(DK, d)) return saved('Photo saved, but could not sync the shared directory');
        var DBU = String((window.BSHM_CHAT || {}).firebaseUrl || '').replace(/\/+$/, '');
        if (DBU) fetch(DBU + '/bshm_dir/' + key.replace(/[^a-z0-9]/g, '_') + '.json', { method: 'PATCH', body: JSON.stringify({ photo: photo, updated: Date.now() }) }).catch(function () { saved('Photo saved here, but online sync failed'); });
        if (window.bshmPrefs) bshmPrefs.avatar();
        saved('Profile photo updated');
      };
      im.src = r.result;
    };
    r.readAsDataURL(f);
  };

  /* ---------- switches ---------- */
  $$('.sw').forEach(function (s) {
    var l = s.getAttribute('aria-label');
    if (l in S.sw) s.setAttribute('aria-checked', !!S.sw[l]);
    s.onclick = function () {
      var on = s.getAttribute('aria-checked') !== 'true';
      var previous = s.getAttribute('aria-checked') === 'true';
      s.setAttribute('aria-checked', on);
      S.sw[l] = on;
      if (!store()) { S.sw[l] = previous; s.setAttribute('aria-checked', previous); return saved('Could not save notification settings'); }
      saved(l + (on ? ' on' : ' off'));
    };
  });

  /* ---------- show / hide password ---------- */
  $$('.eye').forEach(function (b) { b.onclick = function () { var i = b.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; }; });

  /* ---------- real password change (salted SHA-256, never plain text) ---------- */
  function hash(salt, pw) {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.reject(new Error('crypto-unavailable'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pw)).then(function (b) {
      return [].map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  function newSalt() {
    if (!(window.crypto && crypto.getRandomValues)) throw new Error('crypto-unavailable');
    var bytes = crypto.getRandomValues(new Uint8Array(16));
    return [].map.call(bytes, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  $('#pwf').onsubmit = function (e) {
    e.preventDefault();
    var form = e.target, v = ['#pw0', '#pw1', '#pw2'].map(function (s) { return $(s).value; }), m = $('#msg');
    function say(t, ok) { m.textContent = t; m.className = 'msg ' + (ok ? 'ok' : 'err'); }
    if (!v[0] || !v[1] || !v[2]) return say('Please fill in all password fields.');
    if (v[1].length < 8 || !/[A-Z]/.test(v[1]) || !/\d/.test(v[1]) || !/[^A-Za-z0-9\s]/.test(v[1])) return say('Use 8+ characters, one uppercase letter, one number, and one special character.');
    if (v[1] !== v[2]) return say('New password and confirmation do not match.');
    if (v[1] === v[0]) return say('New password must be different from the current one.');
    if (!student || !student.salt || !student.passwordHash) return say('Could not find the signed-in student account. Sign out and sign in again.');
    var submit = form.querySelector('[type="submit"]'); submit.disabled = true;
    hash(student.salt, v[0]).then(function (currentHash) {
      if (currentHash !== student.passwordHash) throw new Error('wrong-password');
      var salt = newSalt();
      return hash(salt, v[1]).then(function (newHash) {
        var latest = read('aces_users', []);
        var current = Array.isArray(latest) && latest.find(function (u) { return u && String(u.studentId).toLowerCase() === String(session.studentId).toLowerCase(); });
        if (!current || current.status !== 'verified') throw new Error('account-unavailable');
        current.salt = salt;
        current.passwordHash = newHash;
        if (!write('aces_users', latest)) throw new Error('storage-failed');
        student = current;
        say('Password updated.', true); form.reset(); saved('Password updated');
      });
    }).catch(function (err) {
      say(err.message === 'wrong-password' ? 'Current password is incorrect.'
        : err.message === 'crypto-unavailable' ? 'Secure password updates require HTTPS or localhost.'
        : err.message === 'account-unavailable' ? 'Student account is no longer active. Sign out and contact the administrator.'
        : err.message === 'storage-failed' ? 'Could not save the new password. Browser storage may be full or blocked.'
        : 'Could not update the password. Please try again.');
    }).then(function () { submit.disabled = false; });
  };
})();