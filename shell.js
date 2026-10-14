/* ACES BSHM LMS · Shared shell (top navbar) · refined icon set
   Builds the navbar, user dropdown and toast helper on every portal page.
   Styling lives in topnav.css (one file: responsive + animations included).

   FIX: ang pangalan sa header ay galing na sa PAREHONG session ng greeting
   (ACES session sa aces-store.js). Dati, iba ang hinahanap nitong localStorage
   key kaya lumang user (Kenneth Alcantara) ang lumalabas.

   AVATAR SYNC (nasa pinaka-ilalim): bawat role may sariling profile photo. */
(function(){
  'use strict';
  var d=document,b=d.body;

  /* ============ SETTINGS: palitan kung iba ang pangalan ng login page mo ============ */
  var LOGIN_PAGE='index.html';
  /* Fallback lang ito (kung walang window.ACES). Mga key na posibleng ginagamit ng login */
  var SESSION_KEYS=['bshm.user','bshm.session','bshm.auth','currentUser','loggedInUser','user','session'];
  /* Dagdag na key na buburahin pag nag-logout */
  var EXTRA_LOGOUT_KEYS=['token','role','isLoggedIn','bshm.loggedIn'];
  /* ================================================================================== */

  var file=location.pathname.split('/').pop()||'index.html';
  var role=(b.dataset.role==='teacher'||/^teacher/i.test(file))?'teacher':'student';
  b.dataset.role=role;

  /* ---------- Viewport meta + navbar CSS ---------- */
  if(!d.querySelector('meta[name="viewport"]')){
    var vp=d.createElement('meta');vp.name='viewport';
    vp.content='width=device-width,initial-scale=1,viewport-fit=cover';d.head.appendChild(vp);
  }
  if(!d.querySelector('link[href$="topnav.css"]')){
    var lk=d.createElement('link');lk.rel='stylesheet';lk.href='topnav.css';d.head.appendChild(lk);
  }

  /* ---------- Toast ---------- */
  var tbox;
  window.ACESToast=function(msg,type,title){
    if(!tbox){tbox=d.createElement('div');tbox.className='sh-toasts';tbox.setAttribute('aria-live','polite');b.appendChild(tbox)}
    var t=d.createElement('div');t.className='sh-toast '+(type||'');t.setAttribute('role',type==='error'?'alert':'status');
    var mark={success:'✓',warn:'⚠',error:'✕'}[type]||'ℹ';
    var m=d.createElement('span');m.className='ti';m.textContent=mark;
    var x=d.createElement('span');x.textContent=(title?title+' — ':'')+msg;
    t.appendChild(m);t.appendChild(x);tbox.appendChild(t);
    setTimeout(function(){t.classList.add('out');setTimeout(function(){t.remove()},200)},3200);
  };

  /* ---------- Icons ---------- */
  var ICONS={
    home:'<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.5H5.5A1.5 1.5 0 0 1 4 19z"/>',
    classes:'<path d="M3.5 5.5A1.5 1.5 0 0 1 5 4h4.5A2.5 2.5 0 0 1 12 6.5V20a2 2 0 0 0-2-2H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M20.5 5.5A1.5 1.5 0 0 0 19 4h-4.5A2.5 2.5 0 0 0 12 6.5V20a2 2 0 0 1 2-2h5a1.5 1.5 0 0 0 1.5-1.5z"/>',
    activities:'<path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1z"/><path d="M8 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H16"/><path d="m9 13.5 2 2 4-4.5"/>',
    calendar:'<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/><path d="M8.5 14h.01M12 14h.01M15.5 14h.01"/>',
    materials:'<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V7a1 1 0 0 0 1 1h3.5"/><path d="M9 12.5h6M9 16h4"/>',
    pos:'<rect x="5" y="3.5" width="14" height="6" rx="1.5"/><path d="M12 9.5V13"/><path d="M4 14.5A1.5 1.5 0 0 1 5.5 13h13a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M8 16.5h.01M12 16.5h.01M16 16.5h.01"/>',
    gradebook:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M9.5 10v9.5"/><path d="M13 13.5h4M13 16.5h2.5"/>',
    results:'<circle cx="12" cy="9" r="5.5"/><path d="m8.7 13.4-1.2 7.1L12 18l4.5 2.5-1.2-7.1"/><path d="m12 6.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/>',
    reports:'<path d="M4 4v16h16"/><rect x="7.5" y="11" width="3" height="6" rx="1"/><rect x="13" y="7" width="3" height="10" rx="1"/>',
    bell:'<path d="M6 9a6 6 0 0 1 12 0c0 5.5 2 7.2 2 7.2H4S6 14.5 6 9z"/><path d="M10 19.5a2 2 0 0 0 4 0"/>',
    user:'<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.6-3.6 3.8-6 7.5-6s6.9 2.4 7.5 6"/>',
    settings:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    out:'<path d="M9.5 20.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5h3.5"/><path d="m15.5 8 4 4-4 4M19.5 12h-10"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.9-3.9"/>'
  };
  if(!d.getElementById('nv-defs')){
    var sym='';
    Object.keys(ICONS).forEach(function(id){sym+='<symbol id="nv-'+id+'" viewBox="0 0 24 24">'+ICONS[id]+'</symbol>'});
    b.insertAdjacentHTML('afterbegin','<svg id="nv-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+sym+'</defs></svg>');
  }

  /* Legacy shared symbols (added only when the page does not define them) */
  var LEGACY={
    home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    book:'<path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/>',
    task:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 12l2 2 4-4"/>',
    star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    mega:'<path d="M3 11v3a1 1 0 0 0 1 1h3l8 4V6L7 10H4a1 1 0 0 0-1 1zM19 9a4 4 0 0 1 0 6"/>',
    bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/>',
    reg:'<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M6 9l2-5h8l2 5M8 14h8"/>',
    cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6"/>',
    grade:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>',
    chart:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
  };
  var miss='';
  Object.keys(LEGACY).forEach(function(id){
    if(!d.getElementById(id))miss+='<symbol id="'+id+'" viewBox="0 0 24 24">'+LEGACY[id]+'</symbol>';
  });
  if(miss)b.insertAdjacentHTML('afterbegin','<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+miss+'</defs></svg>');

  function ic(id){return '<svg class="i" aria-hidden="true"><use href="#nv-'+id+'"/></svg>'}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

  /* ---------- Navbar data ---------- */
  var NAV={
    student:[
      ['student.html','home','Dashboard'],
      ['courses.html','classes','Courses'],
      ['activities.html','activities','Activities'],
      ['calendar.html','calendar','Calendar']
    ]
  };

  var TGROUPS=[
    ['teacher.html','home','Dashboard'],
    {label:'Teaching',icon:'classes',items:[
      ['teacher-courses.html','classes','Classes'],
      ['teacher-activities.html','activities','Activities'],
      ['teacher-materials.html','materials','Materials']
    ]},
    {label:'Assessment',icon:'gradebook',items:[
      ['teacher-gradebook.html','gradebook','Gradebook'],
      ['teacher-results.html','results','Results'],
      ['teacher-reports.html','reports','Reports']
    ]},
    ['teacher-pos.html','pos','POS']
  ];

  /* Default na user (ginagamit lang kung walang naka-login na nakita) */
  var USER={
    student:{name:'Dela Cruz, Juan',role:'STUDENT',ini:'JD',
      home:'student.html',news:'announcement.html',prof:'profile.html',set:'settings.html',
      more:[['resources.html','Resources']]},
    teacher:{name:'Santos, Liza',role:'INSTRUCTOR',ini:'LS',
      home:'teacher.html',news:'teacher-announcement.html',prof:'teacher-profile.html',set:'teacher-settings.html',
      more:null}
  };
  var u=USER[role];

  /* ============================================================
     SESSION
     1) Una: ACES session (aces-store.js) — pareho sa greeting ng dashboard
     2) Fallback: localStorage/sessionStorage scan (kung walang ACES)
     ============================================================ */

  /* Kunin ang session mula sa ACES. Return: object | null (walang naka-login) | undefined (walang ACES) */
  function acesSession(){
    if(!window.ACES)return undefined;
    var fns=['getSession','session','currentUser','getUser','getCurrentUser'];
    for(var i=0;i<fns.length;i++){
      try{
        var f=window.ACES[fns[i]];
        var s=(typeof f==='function')?f.call(window.ACES):f;
        if(s&&typeof s==='object'){
          if(s.user&&typeof s.user==='object')s=s.user;
          return s;
        }
      }catch(e){}
    }
    return null;
  }

  function nameOf(o){
    return o.firstName||o.first_name||o.firstname||o.fullName||o.full_name||o.name||o.username||'';
  }

  function storageSession(){
    var stores=[localStorage,sessionStorage];
    for(var i=0;i<SESSION_KEYS.length;i++){
      for(var j=0;j<stores.length;j++){
        var raw=null;
        try{raw=stores[j].getItem(SESSION_KEYS[i])}catch(e){}
        if(!raw||raw==='null'||raw==='undefined')continue;
        try{
          var o=JSON.parse(raw);
          if(o&&typeof o==='object'){
            if(o.user&&typeof o.user==='object')o=o.user;
            return o;
          }
          if(typeof o==='string'&&o)return {name:o};
        }catch(e){
          return {name:raw};
        }
      }
    }
    return scanStorage();
  }

  function scanStorage(){
    var stores=[localStorage,sessionStorage];
    var SKIP=/^bshm\.(ann|seen|poshist|notif|hist|exam|retake|gb|act|pos)/;
    var LIKELY=/user|session|auth|login|current|account|profile|student|member/i;
    for(var pass=0;pass<2;pass++){
      for(var j=0;j<stores.length;j++){
        var st=stores[j],n=0;
        try{n=st.length}catch(e){continue}
        for(var i=0;i<n;i++){
          var k=null,raw=null;
          try{k=st.key(i);raw=st.getItem(k)}catch(e){continue}
          if(!k||!raw||SKIP.test(k))continue;
          if(pass===0&&!LIKELY.test(k))continue;
          try{
            var o=JSON.parse(raw);
            if(!o||typeof o!=='object'||Array.isArray(o))continue;
            if(o.user&&typeof o.user==='object')o=o.user;
            else if(o.data&&typeof o.data==='object'&&!Array.isArray(o.data))o=o.data;
            if(nameOf(o)&&(o.email||o.role||o.id||o.studentId||o.student_id||o.username||o.lastName||o.last_name)){
              console.info('[shell] user galing sa key:',k);
              return o;
            }
          }catch(e){}
        }
      }
    }
    return null;
  }

  /* Gawing standard na {first,last,full,nav,ini,id} ang kahit anong hugis ng session */
  function normalize(s){
    if(!s)return null;
    var full=String(s.fullName||s.full_name||s.name||s.username||'').trim();
    var first=String(s.firstName||s.first_name||s.firstname||s.givenName||'').trim();
    var last =String(s.lastName ||s.last_name ||s.lastname ||s.surname||s.familyName||'').trim();

    if(!first&&!last&&full){
      if(full.indexOf(',')>-1){                      /* "Baba, Bahog" */
        var c=full.split(',');
        last=c[0].trim();first=c.slice(1).join(',').trim();
      }else{                                         /* "Bahog Baba" */
        var p=full.split(/\s+/);
        first=p[0]||'';
        last=p.length>1?p[p.length-1]:'';
      }
    }
    var nav=(first&&last)?(last+', '+first):(first||last||full);
    var ini=((first[0]||'')+(last[0]||'')).toUpperCase();
    if(!ini&&nav)ini=String(nav).split(/[ ,]+/).filter(Boolean).slice(0,2).map(function(w){return w[0]}).join('').toUpperCase();
    if(!ini)ini=String(s.initials||'').toUpperCase();
    return {
      first:first,last:last,
      full:(first&&last)?(first+' '+last):(full||first||last),
      nav:nav,ini:ini||'?',
      id:s.studentId||s.student_id||s.id||''
    };
  }

  var CUR=null;
  (function(){
    var s=acesSession();
    var src='ACES';
    if(s===undefined){s=storageSession();src='storage'}
    if(!s){
      var ks=[];
      try{ks=Object.keys(localStorage)}catch(e){}
      console.warn('[shell] Walang naka-login na user na nakita. Mga key sa localStorage:',ks);
      return;
    }
    /* Kung teacher ang naka-login pero student page ito (o vice versa), huwag gamitin */
    var r=String(s.role||s.type||s.userType||'').toLowerCase();
    if(r){
      var isT=/teacher|instructor|faculty/.test(r);
      if((role==='teacher')!==isT)return;
    }
    CUR=normalize(s);
    if(!CUR||!CUR.nav)return;
    console.info('[shell] user source:',src,'→',CUR.nav);
    u.name=CUR.nav;
    u.ini=CUR.ini;
  })();

  /* Para magamit ng ibang script (halimbawa recordPOS) ang parehong user */
  window.ACESCurrentUser=function(){return CUR};

  /* data-nav lets a page highlight another tab */
  var here=b.dataset.nav||file;

  function tabLink(n){
    var on=(n[0]===here)?' class="on" aria-current="page"':'';
    return '<a'+on+' title="'+n[2]+'" href="'+n[0]+'">'+ic(n[1])+'<span>'+n[2]+'</span></a>';
  }

  var tabs=(role==='teacher'
    ? TGROUPS.map(function(n){
        if(!Array.isArray(n)){
          var active=n.items.some(function(i){return i[0]===here});
          return '<div class="tn-g'+(active?' on':'')+'">'+
            '<button type="button" class="tn-gb" aria-haspopup="true" aria-expanded="false">'+ic(n.icon)+'<span>'+n.label+'</span></button>'+
            '<div class="tn-gm">'+n.items.map(tabLink).join('')+'</div>'+
          '</div>';
        }
        return tabLink(n);
      })
    : NAV.student.map(tabLink)
  ).join('');

  var more=u.more||[];
  var moreOn=more.some(function(m){return m[0]===here});
  var moreLink=more.map(function(m){
    var cur=(m[0]===here)?' aria-current="page"':'';
    return '<a role="menuitem" href="'+m[0]+'"'+cur+'>'+ic('materials')+m[1]+'</a>';
  }).join('');

  var html=
    '<header class="topnav">'+
      '<a class="tn-l" href="'+u.home+'" aria-label="ACES DineLearn home">'+
        '<img class="crest" src="assets/nbg (2).png" alt="ACES logo">'+
        '<div class="tn-brand"><b>ACES DINELEARN</b><small>BSHM Learning Management System</small></div></a>'+
      '<nav class="tn-c'+(role==='teacher'?' many grp':(NAV.student.length>6?' many':''))+'" aria-label="Main">'+tabs+'</nav>'+
      '<div class="tn-r">'+
        '<a class="bell'+(here===u.news?' on':'')+'" href="'+u.news+'" title="Announcements" aria-label="Announcements"'+(here===u.news?' aria-current="page"':'')+'>'+ic('bell')+'<em style="display:none"></em></a>'+
        '<div class="user'+(moreOn?' on':'')+'" tabindex="0" role="button" aria-haspopup="menu" aria-expanded="false">'+
          '<div><b>'+esc(u.name)+'</b><small>'+u.role+'</small></div>'+
          '<div class="av">'+esc(u.ini)+'</div>'+
          '<div class="tn-menu" role="menu">'+
            '<a role="menuitem" href="'+u.prof+'">'+ic('user')+'Profile</a>'+
            moreLink+
            '<a role="menuitem" href="'+u.set+'">'+ic('settings')+'Settings</a>'+
            '<hr>'+
            '<a role="menuitem" class="dg" href="'+LOGIN_PAGE+'">'+ic('out')+'Logout</a>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</header>';

  /* replace any old header, remove old sidebar leftovers */
  var old=d.querySelector('.app > header');
  if(old)old.outerHTML=html;
  else (d.querySelector('.app')||b).insertAdjacentHTML('afterbegin',html);
  ['side','scrim','menu'].forEach(function(id){var e=d.getElementById(id);if(e)e.remove()});
  b.classList.remove('sb-collapsed','nav-open');

  /* ---------- Header compacts when the page content scrolls ---------- */
  var hdr=d.querySelector('header.topnav');
  d.addEventListener('scroll',function(e){
    var t=e.target,y;
    if(t===d||t===d.documentElement)y=window.scrollY||0;
    else if(t&&t.tagName==='MAIN')y=t.scrollTop;
    else return;
    if(hdr)hdr.classList.toggle('scrolled',y>4);
  },true);

  /* ---------- User dropdown ---------- */
  var usr=d.querySelector('header.topnav .user');
  function setMenu(o){usr.setAttribute('aria-expanded',o?'true':'false')}
  usr.addEventListener('click',function(e){
    if(e.target.closest('.tn-menu a'))return;
    setMenu(usr.getAttribute('aria-expanded')!=='true');
  });
  usr.addEventListener('keydown',function(e){
    if(e.target===usr&&(e.key==='Enter'||e.key===' ')){e.preventDefault();usr.click()}
  });
  d.addEventListener('click',function(e){if(!usr.contains(e.target))setMenu(false)});
  d.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});
  window.addEventListener('resize',function(){setMenu(false)});
  window.addEventListener('orientationchange',function(){setMenu(false)});

  /* ---------- Logout: gumagana sa LAHAT ng page ---------- */
  window.ACESLogout=function(){
    /* Linisin muna ang mga key para walang matirang lumang user */
    SESSION_KEYS.concat(EXTRA_LOGOUT_KEYS).forEach(function(k){
      try{localStorage.removeItem(k)}catch(e){}
      try{sessionStorage.removeItem(k)}catch(e){}
    });
    /* Tapos ACES logout (siya ang may hawak ng tunay na session) */
    try{
      if(window.ACES&&typeof window.ACES.logout==='function'){window.ACES.logout();return}
    }catch(e){}
    location.replace(LOGIN_PAGE);
  };
  var lo=d.querySelector('header.topnav .tn-menu .dg');
  if(lo)lo.addEventListener('click',function(e){
    e.preventDefault();
    window.ACESLogout();
  });

  /* ---------- Teacher group dropdowns (click-to-open) ---------- */
  (function(){
    var bar=d.querySelector('header.topnav .tn-c.grp');
    if(!bar)return;
    var btns=[].slice.call(bar.querySelectorAll('.tn-gb'));

    function closeAll(except){
      btns.forEach(function(x){if(x!==except)x.setAttribute('aria-expanded','false')});
    }
    btns.forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var open=btn.getAttribute('aria-expanded')==='true';
        closeAll(btn);
        setMenu(false);
        btn.setAttribute('aria-expanded',open?'false':'true');
      });
    });
    d.addEventListener('click',function(e){if(!bar.contains(e.target))closeAll()});
    d.addEventListener('keydown',function(e){
      if(e.key==='Escape'){
        var o=bar.querySelector('.tn-gb[aria-expanded="true"]');
        closeAll();if(o)o.focus();
      }
    });
    window.addEventListener('resize',function(){closeAll()});
    window.addEventListener('orientationchange',function(){closeAll()});
    usr.addEventListener('click',function(){closeAll()});
  })();

  /* ---------- Bell badge: shows only UNREAD announcements ---------- */
  (function(){
    var bell=d.querySelector('header.topnav .bell');
    if(!bell)return;
    var em=bell.querySelector('em');
    var SEEN='bshm.seen.'+role;
    var SRC=role==='teacher'?'bshm.notif.teacher':'bshm.ann.custom';

    function read(k){
      try{var v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:[]}
      catch(e){return []}
    }
    function ids(){
      return read(SRC).map(function(a,i){
        if(!a)return null;
        return String(a.id!=null?a.id:(a.when||'')+'|'+(a.title||i));
      }).filter(Boolean);
    }
    function markRead(){
      try{localStorage.setItem(SEEN,JSON.stringify(ids()))}catch(e){}
    }
    function paint(){
      if(here===u.news)markRead();
      var seen=read(SEEN).map(String);
      var n=ids().filter(function(id){return seen.indexOf(id)<0}).length;
      em.textContent=n>9?'9+':n;
      em.style.display=n?'':'none';
      bell.setAttribute('aria-label',n?'Announcements, '+n+' unread':'Announcements');
    }

    bell.addEventListener('click',function(){markRead();paint()});
    window.addEventListener('storage',paint);
    d.addEventListener('visibilitychange',function(){if(!d.hidden)paint()});
    paint();
  })();
})();

/* Saves a finished POS training so the teacher Gradebook can read it. */
window.recordPOS = function (activity, score) {
  /* Kunin ang pangalan sa session (hindi na sa navbar text) para laging tama */
  var student = 'Student';
  var cu = window.ACESCurrentUser && window.ACESCurrentUser();
  if (cu && cu.full) {
    student = cu.full;                          // "Bahog Baba"
  } else {
    var nameEl = document.querySelector('.user b');
    var n = nameEl ? nameEl.textContent.trim() : 'Student';
    var m = n.match(/^([^,]+),\s*(.+)$/);
    student = m ? m[2] + ' ' + m[1] : n;        // "Baba, Bahog" -> "Bahog Baba"
  }

  score = Math.max(0, Math.min(100, Math.round(+score || 0)));
  var pass = +activity.pass || 75;

  var key = 'bshm.poshist.' + activity.id, h = [];
  try { h = JSON.parse(localStorage.getItem(key)) || []; } catch (e) {}

  h.push({
    id: activity.id + '-' + (h.length + 1),
    activity_id: activity.id,
    activity_title: activity.title,
    student: student,
    attempt_number: h.length + 1,
    score: score,
    status: score >= pass ? 'PASSED' : 'FAILED',
    submitted_at: new Date().toISOString()
  });

  try { localStorage.setItem(key, JSON.stringify(h)); } catch (e) {}
};

/* =====================================================================
   AVATAR SYNC · bawat role may sariling profile photo
   - student: bshm.student.profile  → #avInit, .wel .av, navbar avatar
   - teacher: bshm.teacher.profile (o ang teacher entry sa bshm.directory)
              → .wel .av, navbar avatar
   Walang photo? Babalik sa initials. Sumusunod din sa pagbabago sa ibang tab.
   ===================================================================== */
(function () {
  'use strict';
  var ROLE = document.body.dataset.role === 'teacher' ? 'teacher' : 'student';

  var KEYS = {
    student: ['bshm.student.profile'],
    /* palitan o dagdagan kapag nakita ang tunay na key ng teacher-profile.js */
    teacher: ['bshm.teacher.profile', 'bshm.instructor.profile']
  };
  var TARGETS = {
    student: '#avInit, .wel .av, header.topnav .av',
    teacher: '.wel .av, header.topnav .av'
  };
  var DIR_KEY = 'bshm.directory';

  function readJSON(k) {
    try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; }
  }

  function photo() {
    var list = KEYS[ROLE];
    for (var i = 0; i < list.length; i++) {
      var p = readJSON(list[i]);
      if (p && typeof p.photo === 'string' && p.photo) return p.photo;
    }
    /* Teacher fallback: kunin sa shared directory (role: 'teacher') */
    if (ROLE === 'teacher') {
      var dir = readJSON(DIR_KEY) || {};
      var me = window.ACESCurrentUser && window.ACESCurrentUser();
      var mine = me && me.full ? String(me.full).toLowerCase() : '';
      var found = '';
      Object.keys(dir).forEach(function (k) {
        var e = dir[k];
        if (!e || e.role !== 'teacher' || !e.photo) return;
        if (!found || (mine && String(e.name || k).toLowerCase() === mine)) found = e.photo;
      });
      return found;
    }
    return '';
  }

  function paint(el, src) {
    var s = el.style;
    if (src) {
      s.backgroundImage = 'url("' + src + '")';
      s.backgroundSize = 'cover';
      s.backgroundPosition = 'center';
      s.backgroundRepeat = 'no-repeat';
      s.color = 'transparent';
    } else {
      s.backgroundImage = s.backgroundSize = s.backgroundPosition = s.backgroundRepeat = s.color = '';
    }
  }

  function apply() {
    var src = photo();
    [].forEach.call(document.querySelectorAll(TARGETS[ROLE]), function (el) { paint(el, src); });
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; apply(); });
  }

  apply();
  document.addEventListener('DOMContentLoaded', apply);
  window.addEventListener('load', apply);
  window.addEventListener('pageshow', apply);
  window.addEventListener('storage', function (e) {
    if (!e.key || KEYS[ROLE].indexOf(e.key) > -1 || e.key === DIR_KEY) apply();
  });
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();