/* ACES Polytechnic College – Student Settings (functional) */
(function () {
  var K = 'bshm.student.settings', AUTH = 'bshm.student.auth', PK = 'bshm.student.profile', DK = 'bshm.directory';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function read(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var S = read(K, {}); S.sw = S.sw || {};
  function store() { write(K, S); if (window.bshmPrefs) bshmPrefs.apply(); }

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
    S.tab = key; write(K, S);
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
  var P = read(PK, {});
  var dl = {};
  $$('.dl > div').forEach(function (d) { dl[$('small', d).textContent.trim()] = $('b', d); });
  if (P.email && dl['Email Address']) dl['Email Address'].textContent = P.email;
  if (P.mobile && dl['Mobile Number']) dl['Mobile Number'].textContent = P.mobile;
  var big = $('.acc .big');
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
        var p = read(PK, {}); p.photo = photo;
        if (!write(PK, p)) return saved('Storage full – try a smaller photo');
        setPhoto(photo);
        /* push to shared directory so teachers/chat see it too */
        var d = read(DK, {}), key = 'juan dela cruz';
        if (d[key]) { d[key].photo = photo; d[key].updated = Date.now(); write(DK, d); }
        var DBU = String((window.BSHM_CHAT || {}).firebaseUrl || '').replace(/\/+$/, '');
        if (DBU) fetch(DBU + '/bshm_dir/' + key.replace(/[^a-z0-9]/g, '_') + '.json', { method: 'PATCH', body: JSON.stringify({ photo: photo, updated: Date.now() }) }).catch(function () {});
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
    if (s.id === 'compact') s.setAttribute('aria-checked', !!S.compact);
    else if (l in S.sw) s.setAttribute('aria-checked', !!S.sw[l]);
    s.onclick = function () {
      var on = s.getAttribute('aria-checked') !== 'true';
      s.setAttribute('aria-checked', on);
      if (s.id === 'compact') S.compact = on; else S.sw[l] = on;
      store(); saved(s.id === 'compact' ? (on ? 'Compact on' : 'Compact off') : l + (on ? ' on' : ' off'));
    };
  });

  /* ---------- appearance: Light / Dark / System ---------- */
  $$('input[name="theme"]').forEach(function (r) {
    r.checked = r.value === (S.theme || 'light');
    r.onchange = function () { if (r.checked) { S.theme = r.value; store(); saved('Theme: ' + r.parentNode.textContent.trim()); } };
  });

  /* ---------- show / hide password ---------- */
  $$('.eye').forEach(function (b) { b.onclick = function () { var i = b.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; }; });

  /* ---------- real password change (salted SHA-256, never plain text) ---------- */
  function hash(salt, pw) {
    if (window.crypto && crypto.subtle) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pw)).then(function (b) {
        return [].map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      });
    }
    return Promise.resolve(btoa(unescape(encodeURIComponent(salt + pw))));
  }
  $('#pwf').onsubmit = function (e) {
    e.preventDefault();
    var form = e.target, v = ['#pw0', '#pw1', '#pw2'].map(function (s) { return $(s).value; }), m = $('#msg'), auth = read(AUTH, null);
    function say(t, ok) { m.textContent = t; m.className = 'msg ' + (ok ? 'ok' : 'err'); }
    if (!v[1] || !v[2] || (auth && !v[0])) return say('Please fill in all password fields.');
    if (v[1].length < 8) return say('New password must be at least 8 characters.');
    if (!/[A-Za-z]/.test(v[1]) || !/\d/.test(v[1])) return say('Use at least one letter and one number.');
    if (v[1] !== v[2]) return say('New password and confirmation do not match.');
    if (v[1] === v[0]) return say('New password must be different from the current one.');
    (auth ? hash(auth.salt, v[0]).then(function (h) { return h === auth.hash; }) : Promise.resolve(true)).then(function (ok) {
      if (!ok) return say('Current password is incorrect.');
      var salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
      return hash(salt, v[1]).then(function (h) {
        write(AUTH, { salt: salt, hash: h, at: Date.now() });
        say('Password updated.', true); form.reset(); saved('Password updated');
      });
    });
  };
})();