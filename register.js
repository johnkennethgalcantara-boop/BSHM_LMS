/* ACES BSHM LMS · Student registration (front-end prototype)
   Saves a pending account via aces-store.js, then opens the OTP page. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);

  if (!window.ACES) { ACES_missing(); return; }
  function ACES_missing() {
    const t = $('toast');
    if (t) { t.textContent = 'aces-store.js is missing. Add it before register.js.'; t.classList.add('show'); }
    console.error('aces-store.js did not load');
  }

  const { readUsers, writeUsers, norm, hashPw, newSalt, newOtp, routes } = ACES;
  const verifiedUsers = () => readUsers().filter(u => u.status === 'verified' || u.status === 'disabled');

  /* ---------- Toast ---------- */
  const toast = $('toast');
  let tt;
  const say = m => {
    toast.textContent = m; toast.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2800);
  };

  /* ---------- Show / hide password ---------- */
  document.querySelectorAll('.eye').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const input = $(btn.dataset.target), show = input.type === 'password';
    const pos = input.selectionStart;
    input.type = show ? 'text' : 'password';
    btn.classList.toggle('on', show);
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    btn.setAttribute('aria-pressed', show ? 'true' : 'false');
    input.focus();
    try { input.setSelectionRange(pos, pos); } catch (_) {}
  }));

  /* ---------- Password requirements + strength ---------- */
  const reqTests = {
    len: v => v.length >= 8,
    upper: v => /[A-Z]/.test(v),
    num: v => /\d/.test(v),
    special: v => /[^A-Za-z0-9\s]/.test(v)
  };
  const passMet = v => Object.keys(reqTests).filter(k => reqTests[k](v)).length;

  // Empty = neutral, 0-2 met = Weak, 3 = Medium, 4 = Strong
  function updatePass() {
    const v = $('pass').value, met = passMet(v);
    document.querySelectorAll('#reqs li').forEach(li => {
      const ok = reqTests[li.dataset.req](v);
      li.classList.toggle('met', ok);
      li.classList.toggle('bad', !!v && !ok);
    });
    const level = !v ? 0 : met <= 2 ? 1 : met === 3 ? 2 : 3;
    $('strength').dataset.level = level;
    $('strengthLbl').textContent = ['', 'Weak', 'Medium', 'Strong'][level];
  }

  /* ---------- Validation rules (return an error string, or '' when valid) ---------- */
  const rules = {
    sid: v => !v.trim() ? 'Student ID is required.'
      : !/^[A-Za-z0-9][A-Za-z0-9-]{3,19}$/.test(v.trim()) ? 'Enter a valid Student ID (e.g. 2026-00001).'
      : verifiedUsers().some(u => norm(u.studentId) === norm(v)) ? 'Student ID is already registered.' : '',
    first: v => v.trim() ? '' : 'First name is required.',
    middle: () => '',
    last: v => v.trim() ? '' : 'Last name is required.',
    email: v => !v.trim() ? 'Email address is required.'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Please enter a valid email (e.g. name@gmail.com).'
      : verifiedUsers().some(u => norm(u.email) === norm(v)) ? 'Email address is already registered.' : '',
    pass: v => !v ? 'Password is required.' : passMet(v) < 4 ? 'Password does not meet all requirements.' : '',
    confirm: v => !v ? 'Please confirm your password.' : v !== $('pass').value ? '✗ Passwords do not match' : ''
  };
  const ids = Object.keys(rules);
  const touched = {};

  function setMsg(m, err, id, v) {
    if (err) { m.textContent = err; m.className = 'msg err'; }
    else if (id === 'confirm' && v) { m.textContent = '✓ Passwords match'; m.className = 'msg ok'; }
    else { const h = m.dataset.hint || ''; m.textContent = h; m.className = 'msg' + (h ? ' hint' : ''); }
  }

  function check(id, force) {
    if (!touched[id] && !force) return true;
    const v = $(id).value, err = rules[id](v), g = $(id).closest('.group');
    g.classList.toggle('invalid', !!err);
    g.classList.toggle('valid', !err && !!v.trim());
    setMsg($(id + '-msg'), err, id, v);
    $(id).setAttribute('aria-invalid', err ? 'true' : 'false');
    return !err;
  }

  const terms = $('terms'), submit = $('submit');
  function checkTerms(show) {
    const m = $('terms-msg');
    if (show && !terms.checked) { m.textContent = 'Please accept the Terms and Privacy Policy.'; m.className = 'msg err'; }
    else { m.textContent = ''; m.className = 'msg'; }
    return terms.checked;
  }

  /* ---------- Live events (input, change, keyup cover typing, paste and autofill) ---------- */
  ids.forEach(id => {
    const el = $(id);
    const live = () => {
      if (id === 'pass') updatePass();
      if (id === 'confirm' && el.value) touched.confirm = true;
      if (touched[id]) check(id);
      if (id === 'pass' && touched.confirm) check('confirm');
    };
    el.addEventListener('input', live);
    el.addEventListener('change', live);
    el.addEventListener('keyup', live);
    el.addEventListener('blur', () => { touched[id] = true; check(id); });
  });
  terms.addEventListener('change', () => checkTerms(true));

  /* ---------- Submit ---------- */
  const lbl = b => b.querySelector('.lbl');
  let busy = false;

  $('regForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;

    ids.forEach(id => touched[id] = true);
    updatePass();
    const results = ids.map(id => check(id, true));
    const bad = ids[results.indexOf(false)];
    if (bad) { $(bad).focus(); say('Please fix the highlighted fields.'); return; }
    if (!checkTerms(true)) { terms.focus(); say('Please accept the Terms and Privacy Policy.'); return; }

    busy = true; submit.disabled = true;
    submit.classList.add('loading'); lbl(submit).textContent = 'Creating Account…';
    try {
      const salt = newSalt();
      const hash = await hashPw($('pass').value, salt);
      await new Promise(r => setTimeout(r, 600));
      const sid = $('sid').value.trim(), email = $('email').value.trim();

      // drop earlier unverified attempts with the same Student ID / email; keep every verified account
      const users = readUsers().filter(u => u.status === 'verified' || u.status === 'disabled' ||
        (norm(u.studentId) !== norm(sid) && norm(u.email) !== norm(email)));
      users.push({
        studentId: sid,
        firstName: $('first').value.trim(),
        middleName: $('middle').value.trim(),
        lastName: $('last').value.trim(),
        email, passwordHash: hash, salt, role: 'student', status: 'pending',
        createdAt: new Date().toISOString(), otp: newOtp()
      });
      writeUsers(users);

      submit.classList.remove('loading'); submit.classList.add('done');
      lbl(submit).textContent = 'Account Created ✓';
      setTimeout(() => {
        location.href = routes.otp + '?flow=register&sid=' + encodeURIComponent(sid);
      }, 700);
    } catch (err) {
      busy = false; submit.disabled = false;
      submit.classList.remove('loading'); lbl(submit).textContent = 'Create Account';
      say(err.message === 'crypto-unavailable'
        ? 'Open this page over https or localhost (e.g. Live Server) to continue.'
        : 'Something went wrong. Please try again.');
    }
  });

  // Run once on load (covers browser autofill and restored form values)
  updatePass();
})();