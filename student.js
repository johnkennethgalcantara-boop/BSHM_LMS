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
  var C = [
    ['BSHM 101','Food & Beverage Services','Prof. Santos, Liza',78,'fork',['#EEEAFE','#4F35D2'],'Practical Activity #4 · Due May 3'],
    ['BSHM 102','Front Office Operations','Prof. Dela Cruz, Maria Angelica',65,'desk',['#E8EAFB','#3B47B8'],'Quiz 4 · Due May 3'],
    ['BSHM 103','Tourism Management','Prof. Ramos, John Patrick',40,'plane',['#E6F0FD','#2F6FD0'],'Activity 5 · Due May 5'],
    ['BSHM 104','Housekeeping Operations','Prof. Villanueva, Christine',25,'bed',['#F3EFFE','#7B5FE0'],'Module 3: Room Inspection'],
    ['BSHM 105','Tourism and Hospitality Law','Prof. Santos, Alyssa Marie',10,'law',['#EEEAFE','#3B2F9E'],'Module 1: Legal Foundations']
  ];
  var AR = '<span class="ar">→</span>';
  $('courses').innerHTML = C.map(function (c) {
    var n = c[1].replace('&', '&amp;');
    return '<article class="c">' +
      '<span class="cb" aria-hidden="true" style="background:linear-gradient(135deg,' + c[5][1] + ',#151A3A)"><svg><use href="#' + c[4] + '"/></svg></span>' +
      '<div class="ct"><span class="img" style="background:' + c[5][0] + ';color:' + c[5][1] + '"><svg class="i"><use href="#' + c[4] + '"/></svg></span><span class="cd">' + c[0] + '</span><b class="pc">' + c[3] + '%</b></div>' +
      '<h3 class="t" title="' + n + '">' + n + '</h3>' +
      '<p class="ins">' + c[2] + '</p>' +
      '<div class="bar"><i style="width:' + c[3] + '%"></i></div>' +
      '<p class="nx"><b>Next</b> ' + c[6] + '</p>' +
      '<a class="vc" href="#">Continue Course ' + AR + '</a>' +
    '</article>';
  }).join('') +
  '<a class="c all" href="courses.html"><b>All courses</b><small>5 enrolled this semester</small><span class="vc" style="position:static">View all ' + AR + '</span></a>';

  /* ---------- Featured carousel (with images) ---------- */
  // Slides come from the admin (admin.html > Homepage Banners) via banners.js
  var B = window.ACESBanners ? ACESBanners.read('student') : [], i = 0;
  var tr = $('track'), dt = $('dots'), feat = $('o-feat');

  function buildFeatured() {
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
  if (window.ACESBanners) ACESBanners.onChange(function () { B = ACESBanners.read('student'); buildFeatured(); });

  /* ---------- Mini calendar: April 2025 starts on Tuesday ---------- */
  var h = '', ev = {27:1,28:1,29:1,30:1};
  'SMTWTFS'.split('').forEach(function (d) { h += '<span class="dn">' + d + '</span>'; });
  h += '<span></span><span></span>';
  for (var n = 1; n <= 30; n++) h += '<span class="dy' + (n == 27 ? ' today' : '') + (ev[n] ? ' has' : '') + '">' + n + '</span>';
  $('mg').innerHTML = h;
})();