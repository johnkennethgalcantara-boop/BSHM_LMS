/* ACES Polytechnic College – Student Profile (functional, teacher-connected)
   - Edit Profile modal + photo upload, saved in localStorage ("bshm.student.profile")
   - Profile Completion ring is computed from filled fields
   - Publishes the profile to the shared directory ("bshm.directory", + Firebase if
     window.BSHM_CHAT.firebaseUrl is set) so the teacher side can see name, photo, contact info
   - Name / Student ID / academic info are read-only (managed by registrar / teacher) */
(function () {
  var PK = 'bshm.student.profile', DK = 'bshm.directory';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(function () {
    /* ---------- map the fields on the page ---------- */
    var rows = {};
    $$('.fl .f').forEach(function (f) {
      var label = $('small', f).textContent.trim();
      rows[label] = $('b', f);
    });
    var F = { id: rows['Student ID'], email: rows['Email Address'], dob: rows['Date of Birth'], mobile: rows['Mobile Number'], gender: rows['Gender'], address: rows['Address'], civil: rows['Civil Status'] };
    var whoName = $('.who h2');
    var fullName = whoName.childNodes[0].textContent.trim();         /* "Juan Dela Cruz" - fixed, matches chat identity */
    var pill = $('.who h2 .pill');
    var acad = {};
    $$('.al li').forEach(function (li) { acad[$('small', li).textContent.trim()] = $('b', li).textContent.trim(); });

    /* defaults = what is written in the HTML */
    var DEFAULTS = {
      email: F.email.textContent.trim(), dob: F.dob.textContent.trim(), mobile: F.mobile.textContent.trim(),
      gender: F.gender.textContent.trim(), address: F.address.textContent.trim(), civil: F.civil.textContent.trim(), photo: ''
    };

    function get() { try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(PK)) || {}); } catch (e) { return Object.assign({}, DEFAULTS); } }
    function save(p) { try { localStorage.setItem(PK, JSON.stringify(p)); return true; } catch (e) { return false; } }

    /* ---------- date helpers ---------- */
    function toISO(txt) {                                            /* "May 15, 2006" -> "2006-05-15" */
      var m = String(txt).match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
      if (!m) return '';
      var mi = MONTHS.findIndex(function (x) { return x.toLowerCase() === m[1].toLowerCase(); });
      return mi < 0 ? '' : m[3] + '-' + ('0' + (mi + 1)).slice(-2) + '-' + ('0' + m[2]).slice(-2);
    }
    function fromISO(iso) {
      var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return m ? MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1] : '';
    }

    /* ---------- render ---------- */
    function setAvatar(el, p) {
      if (p.photo) { el.style.backgroundImage = 'url("' + p.photo + '")'; el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center'; el.style.color = 'transparent'; }
      else { el.style.backgroundImage = ''; el.style.backgroundSize = ''; el.style.backgroundPosition = ''; el.style.color = ''; }
    }
    function completion(p) {
      var keys = ['photo', 'email', 'dob', 'mobile', 'gender', 'address', 'civil'];
      var done = keys.filter(function (k) { return String(p[k] || '').trim(); }).length;
      return Math.round(done / keys.length * 100);
    }
    function render() {
      var p = get();
      F.email.textContent = p.email; F.dob.textContent = p.dob; F.mobile.textContent = p.mobile;
      F.gender.textContent = p.gender; F.address.textContent = p.address; F.civil.textContent = p.civil;
      setAvatar($('.photo .big'), p);
      $$('header.topnav .av').forEach(function (a) { setAvatar(a, p); });
      var pct = completion(p), C = 2 * Math.PI * 18;
      var ring = $('.ring'), v = $('.ring .v');
      if (v) v.setAttribute('stroke-dasharray', (pct * C / 100).toFixed(1) + ' ' + C.toFixed(1));
      if (ring) { var t = $('text', ring); if (t) t.textContent = pct + '%'; ring.setAttribute('aria-label', pct + ' percent complete'); }
      var msg = $('.pc p');
      if (msg) msg.textContent = pct >= 100 ? 'Your profile is complete. Great job!' : pct >= 70 ? 'Your profile is almost complete!' : 'Add more details to complete your profile.';
      publish(p);
    }

    /* ---------- share with teacher side ---------- */
    var DBU = String((window.BSHM_CHAT || {}).firebaseUrl || '').replace(/\/+$/, ''), pushed = false, lastSent = '';
    function publish(p) {
      var key = fullName.toLowerCase();
      var entry = {
        role: 'student', name: fullName, photo: p.photo || '', position: 'Student',
        studentId: F.id.textContent.trim(), email: p.email, mobile: p.mobile, gender: p.gender, address: p.address, civil: p.civil,
        program: acad['Program'] || '', year: acad['Year Level'] || '', section: acad['Section'] || '',
        status: acad['Enrollment Status'] || '', updated: Date.now()
      };
      var sig = JSON.stringify(Object.assign({}, entry, { updated: 0 }));
      if (sig === lastSent) return; lastSent = sig;
      var d; try { d = JSON.parse(localStorage.getItem(DK)) || {}; } catch (e) { d = {}; }
      d[key] = entry; try { localStorage.setItem(DK, JSON.stringify(d)); } catch (e) {}
      if (DBU) {
        fetch(DBU + '/bshm_dir/' + key.replace(/[^a-z0-9]/g, '_') + '.json', { method: 'PUT', body: JSON.stringify(Object.assign({ k: key }, entry)) }).catch(function () {});
      }
    }

    /* ---------- modal ---------- */
    var css = document.createElement('style');
    css.textContent =
      '.pm-bg{position:fixed;inset:0;z-index:10001;background:rgba(23,27,107,.45);display:flex;align-items:center;justify-content:center;padding:16px}' +
      '.pm{background:#fff;color:#171B6B;border-radius:20px;width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;box-shadow:0 20px 50px rgba(23,27,107,.3);font-family:inherit}' +
      '.pm h3{margin:0;padding:18px 20px 4px;font-size:18px}.pm>p{margin:0;padding:0 20px 8px;font-size:13px;color:#667085}' +
      '.pm form{padding:8px 20px 20px;display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
      '.pm label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:600}.pm .w{grid-column:1/-1}' +
      '.pm input,.pm select,.pm textarea{font:14px/1.4 inherit;font-family:inherit;padding:10px 12px;border:1px solid #E1DAFB;border-radius:12px;color:#171B6B;background:#fff;box-sizing:border-box;width:100%}' +
      '.pm input[readonly]{background:#F4F5FA;color:#667085}' +
      '.pm input:focus,.pm select:focus,.pm textarea:focus{outline:3px solid #B8A4FF;outline-offset:1px}' +
      '.pm .er{color:#C0262B;font-size:12px;font-weight:500;min-height:0}' +
      '.pm .ph{grid-column:1/-1;display:flex;align-items:center;gap:12px}.pm .pv{width:56px;height:56px;border-radius:50%;background:#6D3FEA;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex:none}' +
      '.pm .b{padding:9px 14px;border-radius:12px;border:1px solid #E1DAFB;background:#F0EDFF;color:#6D3FEA;font:600 13px inherit;font-family:inherit;cursor:pointer}' +
      '.pm .ft{grid-column:1/-1;display:flex;justify-content:flex-end;gap:10px;margin-top:6px}' +
      '.pm .ft .sv{background:#6D3FEA;color:#fff;border-color:#6D3FEA}' +
      '.pm-t{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:10002;background:#171B6B;color:#fff;padding:11px 18px;border-radius:12px;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.25)}' +
      '@media(max-width:520px){.pm form{grid-template-columns:1fr}}';
    document.head.appendChild(css);

    function toast(t) { var e = document.createElement('div'); e.className = 'pm-t'; e.setAttribute('role', 'status'); e.textContent = t; document.body.appendChild(e); setTimeout(function () { e.remove(); }, 2600); }

    function resize(file, cb) {
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var s = 256, c = document.createElement('canvas'), min = Math.min(img.width, img.height);
          c.width = c.height = s;
          c.getContext('2d').drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, s, s);
          cb(c.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = function () { cb(null); };
        img.src = r.result;
      };
      r.onerror = function () { cb(null); };
      r.readAsDataURL(file);
    }

    var opener = null;
    function openEdit(focusPhoto) {
      if ($('.pm-bg')) return;
      opener = document.activeElement;
      var p = get(), photo = p.photo;
      var bg = document.createElement('div'); bg.className = 'pm-bg';
      bg.innerHTML =
        '<div class="pm" role="dialog" aria-modal="true" aria-labelledby="pmT"><h3 id="pmT">Edit Profile</h3>' +
        '<p>Name, Student ID and academic details are managed by your school and can’t be changed here.</p>' +
        '<form novalidate>' +
        '<div class="ph"><span class="pv" id="pmPv"></span><div><button type="button" class="b" id="pmUp">Upload photo</button> <button type="button" class="b" id="pmRm">Remove</button>' +
        '<input type="file" id="pmFile" accept="image/*" hidden><div class="er" id="pmPe"></div></div></div>' +
        '<label>Full Name<input value="' + esc(fullName) + '" readonly></label>' +
        '<label>Student ID<input value="' + esc(F.id.textContent.trim()) + '" readonly></label>' +
        '<label class="w">Email Address<input type="email" id="pmEmail" value="' + esc(p.email) + '" autocomplete="email"><span class="er" id="pmEe"></span></label>' +
        '<label>Date of Birth<input type="date" id="pmDob" value="' + esc(toISO(p.dob)) + '" max="' + new Date().toISOString().slice(0, 10) + '"><span class="er" id="pmDe"></span></label>' +
        '<label>Mobile Number<input type="tel" id="pmMob" value="' + esc(p.mobile) + '" autocomplete="tel"><span class="er" id="pmMe"></span></label>' +
        '<label>Gender<select id="pmGen">' + ['Male', 'Female', 'Prefer not to say'].map(function (o) { return '<option' + (o === p.gender ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></label>' +
        '<label>Civil Status<select id="pmCiv">' + ['Single', 'Married', 'Widowed', 'Separated'].map(function (o) { return '<option' + (o === p.civil ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></label>' +
        '<label class="w">Address<textarea id="pmAdd" rows="2">' + esc(p.address) + '</textarea><span class="er" id="pmAe"></span></label>' +
        '<div class="ft"><button type="button" class="b" id="pmCancel">Cancel</button><button type="submit" class="b sv">Save changes</button></div>' +
        '</form></div>';
      document.body.appendChild(bg);
      var q = function (id) { return document.getElementById(id); };
      function pv() { var el = q('pmPv'); el.textContent = fullName.split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); setAvatar(el, { photo: photo }); }
      pv();
      function close() { bg.remove(); document.removeEventListener('keydown', onKey); if (opener && opener.focus) opener.focus(); }
      function onKey(e) { if (e.key === 'Escape') close(); }
      document.addEventListener('keydown', onKey);
      bg.addEventListener('mousedown', function (e) { if (e.target === bg) close(); });
      q('pmCancel').onclick = close;
      q('pmUp').onclick = function () { q('pmFile').click(); };
      q('pmRm').onclick = function () { photo = ''; pv(); };
      q('pmFile').onchange = function () {
        var f = this.files[0]; if (!f) return;
        if (!/^image\//.test(f.type)) { q('pmPe').textContent = 'Please choose an image file.'; return; }
        resize(f, function (d) { if (d) { photo = d; q('pmPe').textContent = ''; pv(); } else q('pmPe').textContent = 'Could not read that image.'; });
      };
      $('form', bg).addEventListener('submit', function (e) {
        e.preventDefault();
        var email = q('pmEmail').value.trim(), dob = q('pmDob').value, mob = q('pmMob').value.trim().replace(/[\s-]/g, ''), add = q('pmAdd').value.trim(), ok = true;
        function err(id, m) { q(id).textContent = m; if (m) ok = false; }
        err('pmEe', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email address.');
        err('pmDe', dob && dob <= new Date().toISOString().slice(0, 10) ? '' : 'Choose a valid date of birth.');
        err('pmMe', /^(\+63|0)9\d{9}$/.test(mob) ? '' : 'Use a PH mobile number, e.g. +63 912 345 6789.');
        err('pmAe', add ? '' : 'Address is required.');
        if (!ok) { var first = $('.er:not(:empty)', bg); if (first && first.previousElementSibling) first.previousElementSibling.focus(); return; }
        var m2 = mob.replace(/^0/, '+63'); m2 = m2.replace(/^(\+63)(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3 $4');
        var np = { email: email, dob: fromISO(dob), mobile: m2, gender: q('pmGen').value, civil: q('pmCiv').value, address: add, photo: photo };
        if (!save(np)) { q('pmPe').textContent = 'Storage is full – try a smaller photo.'; return; }
        render(); close(); toast('Profile saved. Your teachers can now see the update.');
      });
      (focusPhoto ? q('pmUp') : q('pmEmail')).focus();
    }

    var editBtn = $('.pc .btn'); if (editBtn) editBtn.addEventListener('click', function () { openEdit(false); });
    var camBtn = $('.photo button'); if (camBtn) camBtn.addEventListener('click', function () { openEdit(true); });

    render();
    /* shell.js builds the navbar after load, so re-apply the avatar once it exists, and sync across tabs */
    var n = 0, t = setInterval(function () { render(); if (++n > 15) clearInterval(t); }, 300);
    window.addEventListener('storage', function (e) { if (!e.key || e.key === PK) render(); });
  });
})();