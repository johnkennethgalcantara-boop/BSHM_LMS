(function () {
  var $ = function (i) { return document.getElementById(i); };

  /* ---------- Session guard ---------- */
  if (!window.ACES) { location.replace('login-page.html?role=student'); return; }
  var session = ACES.requireStudent();
  if (!session) return;                       // redirected to login

  // Any element with data-user-name shows the student's first name
  [].forEach.call(document.querySelectorAll('[data-user-name]'), function (el) {
    el.textContent = session.name;
  });

  // Any element with data-logout signs the student out
  [].forEach.call(document.querySelectorAll('[data-logout]'), function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); ACES.logout(); });
  });

  /* ---------- Courses ---------- */
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  var C = [];
  function refreshDashboardCourses() {
  var enrollments = read('bshm.enrollments') || {};
  var enrolledCodes = session.studentId && Array.isArray(enrollments[String(session.studentId)])
    ? enrollments[String(session.studentId)] : [];
  var classRows = (read('bshm.class.all') || []).concat(read('bshm.class.custom') || []);
  var directory = {};
  classRows.forEach(function (row) {
    if (row && row[0]) directory[row[0]] = { code: row[0], name: row[1] || row[0], teacher: row[5] || 'Your Instructor' };
  });
  var colors = [
    ['#EEEAFE','#4F35D2','fork'], ['#E8EAFB','#3B47B8','desk'], ['#E6F0FD','#2F6FD0','plane'],
    ['#F3EFFE','#7B5FE0','bed'], ['#EEEAFE','#3B2F9E','law']
  ];
  C = enrolledCodes.map(function (code, index) {
    var course = directory[code];
    if (!course) return null;
    var acts = (read('bshm.act.custom') || []).filter(function (item) {
      return item && item.act && item.act.course === code;
    }).map(function (item) { return item.act; }).concat(
      (read('bshm.pos.custom') || []).filter(function (item) { return item && item.course === code; })
    );
    var done = 0, next = null, studentName = String(session.name || '').toLowerCase();
    acts.forEach(function (activity) {
      var key = (activity.type === 'pos-training' ? 'bshm.poshist.' : 'bshm.hist.') + activity.id;
      var records = read(key) || [];
      var completed = records.some(function (record) {
        return (session.studentId && record.student_account_id
          ? String(record.student_account_id) === String(session.studentId)
          : String(record.student_id || record.student || '').toLowerCase() === studentName) && record.submitted_at;
      });
      if (completed) done++;
      else if (!next) next = activity;
    });
    var palette = colors[index % colors.length];
    return [
      course.code, course.name, course.teacher,
      acts.length ? Math.round(done / acts.length * 100) : 0,
      palette[2], [palette[0], palette[1]],
      next ? (next.title || next.name || 'Available activity') : 'No activities yet',
      next && next.due || ''
    ];
  }).filter(Boolean);

  // The dashboard's Weekly Learning Activity card reads this list
  window.ACES_COURSES = C;

  // Course cards: only rendered if a page has a #courses container
  var AR = '<span class="ar">→</span>';
  var box = $('courses');
  if (box) {
    box.innerHTML = C.map(function (c) {
      var n = c[1].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return '<article class="c">' +
        '<span class="cb" aria-hidden="true" style="background:linear-gradient(135deg,' + c[5][1] + ',#151A3A)"><svg><use href="#' + c[4] + '"/></svg></span>' +
        '<div class="ct"><span class="img" style="background:' + c[5][0] + ';color:' + c[5][1] + '"><svg class="i"><use href="#' + c[4] + '"/></svg></span><span class="cd">' + c[0] + '</span><b class="pc">' + c[3] + '%</b></div>' +
        '<h3 class="t" title="' + n + '">' + n + '</h3>' +
        '<p class="ins">' + String(c[2]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>' +
        '<div class="bar"><i style="width:' + c[3] + '%"></i></div>' +
        '<p class="nx"><b>Next</b> ' + String(c[6]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + (c[7] ? ' · ' + String(c[7]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '') + '</p>' +
        '<a class="vc" href="activities.html?course=' + encodeURIComponent(c[0]) + '">Continue Course ' + AR + '</a>' +
      '</article>';
    }).join('') +
    '<a class="c all" href="courses.html"><b>All courses</b><small>' + C.length + ' enrolled this semester</small><span class="vc" style="position:static">View all ' + AR + '</span></a>';
  }
  window.dispatchEvent(new Event('aces-courses-changed'));
  }
  refreshDashboardCourses();
  window.addEventListener('storage', function (e) {
      if (!e.key || /^(bshm\.enrollments|bshm\.class\.(all|custom)|bshm\.act\.custom|bshm\.pos\.custom|bshm\.(hist|poshist)\.)/.test(e.key)) refreshDashboardCourses();
  });
  document.addEventListener('visibilitychange', function () {
      if (!document.hidden) refreshDashboardCourses();
  });

  /* ---------- Featured carousel: only runs if the page has it ---------- */
  var B = window.ACESBanners ? ACESBanners.read('student') : [], i = 0;
  var tr = $('track'), dt = $('dots'), feat = $('o-feat');

  function buildFeatured() {
    if (!feat || !tr || !dt) return;
    if (!B.length) { feat.style.display = 'none'; return; }
    feat.style.display = '';
    var fh = feat.querySelector('.fh b'), cap = feat.querySelector('.ff > span'), lk = feat.querySelector('.ff a');

    tr.innerHTML = B.map(function (b) {
      return '<div class="sl" style="background:' + ACESBanners.bg(b) +
             ';font-weight:600;font-size:14px;text-shadow:0 1px 6px rgba(0,0,0,.45)">' + ACESBanners.esc(b.title) + '</div>';
    }).join('');

    dt.innerHTML = B.map(function (_, k) {
      return '<button aria-label="Slide ' + (k + 1) + '" data-k="' + k + '"></button>';
    }).join('');
    $('prev').style.display = $('next').style.display = dt.style.display = B.length > 1 ? '' : 'none';

    function go(n) {
      i = (n + B.length) % B.length;
      tr.style.transform = 'translateX(-' + i * 100 + '%)';
      [].forEach.call(dt.children, function (d, k) { d.className = k == i ? 'on' : ''; });
      var b = B[i], l = ACESBanners.safeLink(b.link);
      if (fh) fh.textContent = b.title;
      if (cap) cap.textContent = b.caption || '';
      if (lk) { lk.style.display = l ? '' : 'none'; if (l) lk.setAttribute('href', l); }
    }
    $('prev').onclick = function () { go(i - 1); };
    $('next').onclick = function () { go(i + 1); };
    dt.onclick = function (e) { var k = e.target.getAttribute('data-k'); if (k !== null) go(+k); };
    go(0);
  }
  buildFeatured();
  if (window.ACESBanners && feat) ACESBanners.onChange(function () { B = ACESBanners.read('student'); buildFeatured(); });

  /* ---------- Mini calendar: only runs if the page has #mg ---------- */
  var mg = $('mg');
  if (mg) {
    var h = '', ev = {27:1,28:1,29:1,30:1};
    'SMTWTFS'.split('').forEach(function (d) { h += '<span class="dn">' + d + '</span>'; });
    h += '<span></span><span></span>';
    for (var n = 1; n <= 30; n++) h += '<span class="dy' + (n == 27 ? ' today' : '') + (ev[n] ? ' has' : '') + '">' + n + '</span>';
    mg.innerHTML = h;
  }
})();