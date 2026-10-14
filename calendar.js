(function(){
  var $=function(i){return document.getElementById(i)};
  var MO=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var DS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var DL=DW; /* full weekday names for the column headers */

  /* "Today" for the calendar.
     true  = use the real date (needed to see teacher deadlines that are due now).
     false = use the old mock date of April 27, 2025 (matches the sample events below). */
  var USE_REAL_TODAY=true;
  var TODAY=USE_REAL_TODAY
    ?(function(){var n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())})()
    :new Date(2025,3,27);

  var CAT={
    lecture:{full:'Lecture'},practical:{full:'Practical Activity'},quiz:{full:'Quiz'},
    assignment:{full:'Assignment'},exam:{full:'Exam'},general:{full:'General Event'}};

  /* d = date (YYYY-MM-DD), t = title, s = short title for the calendar pill, c = category,
     co = course, sub = label under the title in Upcoming Events (falls back to co),
     st/en = start/end, dl = true for deadlines (st is the due time) */
  var E=[
   {d:'2025-04-01',t:'F&B Services Practical',s:'F&B Services (Practical)',c:'practical',co:'BSHM 101',st:'10:00 AM',en:'12:00 PM',loc:'Room 101',desc:'Hands-on practice of table setting and food service procedures.'},
   {d:'2025-04-02',t:'Quiz: Food & Beverage Service Procedures',s:'Quiz: Food & Beverage Service Procedures',c:'quiz',co:'BSHM 101',st:'11:59 PM',dl:true,loc:'Online (LMS)',desc:'Short quiz covering food and beverage service procedures. Closes at 11:59 PM.'},
   {d:'2025-04-03',t:'Tourism Management',s:'Tourism Management',c:'lecture',co:'BSHM 103',st:'3:00 PM',en:'5:00 PM',loc:'Room 203',desc:'Lecture on tourism planning, destinations and stakeholders.'},
   {d:'2025-04-04',t:'Assignment: Marketing Plan',s:'Assignment: Marketing Plan',c:'assignment',co:'BSHM 103',st:'11:59 PM',dl:true,loc:'Submit via LMS',desc:'Submit your tourism destination marketing plan.'},
   {d:'2025-04-07',t:'Housekeeping Operations Practical',s:'Housekeeping Ops (Practical)',c:'practical',co:'BSHM 104',st:'1:00 PM',en:'3:00 PM',loc:'Room 104',desc:'Practical session on room preparation and inspection.'},

   {d:'2025-04-09',t:'Tourism and Hospitality Law',s:'Tourism Law',c:'lecture',co:'BSHM 105',st:'10:00 AM',en:'12:00 PM',loc:'Room 202',desc:'Lecture on laws and regulations affecting tourism and hospitality.'},
   {d:'2025-04-11',t:'Beverage Service Lab',s:'Beverage Service (Lab)',c:'practical',co:'BSHM 101',st:'1:00 PM',en:'3:00 PM',loc:'Beverage Lab',desc:'Laboratory session on beverage preparation and service.'},
   {d:'2025-04-14',t:'Quiz: Tourism Management',s:'Quiz: Tourism Management',c:'quiz',co:'BSHM 103',st:'11:59 PM',dl:true,loc:'Online (LMS)',desc:'Quiz on the tourism management lessons so far. Closes at 11:59 PM.'},
   {d:'2025-04-16',t:'General Education',s:'General Education',c:'general',co:'General Education',st:'8:00 AM',en:'10:00 AM',loc:'Room 205',desc:'General education class session.'},
   {d:'2025-04-18',t:'F&B Services Theory',s:'F&B Services (Theory)',c:'lecture',co:'BSHM 101',st:'10:00 AM',en:'12:00 PM',loc:'Room 101',desc:'Theory session on food and beverage service standards.'},
   {d:'2025-04-21',t:'Assignment: Research Paper',s:'Assignment: Research Paper',c:'assignment',co:'BSHM 105',st:'11:59 PM',dl:true,loc:'Submit via LMS',desc:'Submit your research paper on a hospitality law topic.'},
   {d:'2025-04-23',t:'Front Office Operations',s:'Front Office Operations',c:'lecture',co:'BSHM 102',st:'10:00 AM',en:'12:00 PM',loc:'Room 203',desc:'Lecture on reservations, check-in and guest handling.'},
   {d:'2025-04-25',t:'Quiz: Front Office Operations',s:'Quiz: Front Office Ops',c:'quiz',co:'BSHM 102',st:'11:59 PM',dl:true,loc:'Online (LMS)',desc:'Quiz on front office procedures. Closes at 11:59 PM.'},
   {d:'2025-04-28',t:'Practical Assessment',s:'Practical Assessment (F&B Services)',c:'practical',co:'BSHM 101',sub:'F&B Services',st:'9:00 AM',en:'11:00 AM',loc:'Room 101',desc:'Practical assessment for food and beverage service procedures.'},

   {d:'2025-05-02',t:'Enrollment for SY 2025–2026',s:'Enrollment for SY 2025–2026',c:'general',co:'College',sub:'College',st:'8:00 AM',en:'5:00 PM',loc:"Registrar's Office",desc:'Enrollment period for school year 2025–2026.'}];

  var BASE=E.length;   /* events above are fixed; teacher deadlines are added after them */

  /* Today's schedule (static mock) */
  var TS=[
   {t:'8:00 AM – 10:00 AM',n:'F&B Services (Practical)',r:'Room 101',c:'practical'},
   {t:'10:00 AM – 12:00 PM',n:'Tourism Management (Lecture)',r:'Room 203',c:'lecture'},
   {t:'1:00 PM – 3:00 PM',n:'Housekeeping Operations (Practical)',r:'Room 104',c:'practical'}];

  /* ---------- helpers ---------- */
  function pad(n){return n<10?'0'+n:''+n}
  function key(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function parse(k){var p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2])}
  function addDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n)}
  function mins(s){var m=/(\d+):(\d+)\s*(AM|PM)/.exec(s),h=(+m[1])%12;if(m[3]==='PM')h+=12;return h*60+(+m[2])}
  function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function fmt(d){return MO[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear()}
  function timeText(e){return e.dl?'Due '+e.st:(e.en?e.st+' – '+e.en:e.st)}
  function lsGet(k){try{return JSON.parse(localStorage.getItem(k))}catch(x){return null}}

  /* events grouped by date key, sorted by start time */
  var BY={};
  function index(){
    BY={};
    E.forEach(function(e,i){e.i=i;(BY[e.d]=BY[e.d]||[]).push(e)});
    Object.keys(BY).forEach(function(k){BY[k].sort(function(a,b){return mins(a.st)-mins(b.st)})});
  }

  /* ---------- TEACHER ACTIVITIES WITH A DEADLINE ----------
     Reads the quizzes and exams the teacher published (bshm.act.custom) and adds
     each one that has a due date as a deadline on the calendar. */
  function dueFromText(txt){
    /* older activities only saved text like "Due May 3" (no year) */
    var m=/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})/.exec(String(txt||''));
    if(!m)return '';
    var mo=MS.indexOf(m[1].charAt(0).toUpperCase()+m[1].slice(1,3).toLowerCase());
    if(mo<0)return '';
    var y=TODAY.getFullYear(),d=new Date(y,mo,+m[2]);
    if(d<addDays(TODAY,-180))d=new Date(y+1,mo,+m[2]);   /* "May 3" seen in October means next May */
    return key(d);
  }
  function loadTeacher(){
    E.length=BASE;                                        /* drop the previously loaded ones */
    (lsGet('bshm.act.custom')||[]).forEach(function(c){
      var a=c&&c.act;
      if(!a||!a.title)return;
      var d=a.dueDate||dueFromText(a.due);
      if(!d)return;                                       /* no deadline = not on the calendar */
      var type=a.type==='exam'?'exam':'quiz';
      var name=(type==='exam'?'Exam: ':'Quiz: ')+a.title;
      E.push({
        d:d,t:name,s:name,c:type,co:a.course||'Course',
        st:'11:59 PM',dl:true,loc:'Online (LMS)',
        desc:'Posted by your teacher'+(a.course?' for '+a.course:'')+'. Closes at 11:59 PM.',
        teacher:true
      });
    });
    index();
  }

  var V={v:'month',a:new Date(TODAY)};
  var board=$('cx-board');

  /* ---------- calendar rendering ---------- */
  function pill(e){
    return '<button type="button" class="cx-ev cx-c-'+e.c+'" data-i="'+e.i+'" title="'+esc(e.t+' · '+timeText(e))+'" aria-label="'+esc(e.t+', '+timeText(e))+'">'+
      '<i></i><span class="cx-et">'+esc(e.s||e.t)+'</span><span class="cx-tm">'+esc(e.st)+'</span></button>';
  }
  function label(){
    var a=V.a;
    if(V.v==='month')return MO[a.getMonth()]+' '+a.getFullYear();
    if(V.v==='day')return DS[a.getDay()]+', '+MS[a.getMonth()]+' '+a.getDate()+', '+a.getFullYear();
    var s=addDays(a,-a.getDay()),e=addDays(s,6);
    return MS[s.getMonth()]+' '+s.getDate()+(s.getFullYear()!==e.getFullYear()?', '+s.getFullYear():'')+' – '+MS[e.getMonth()]+' '+e.getDate()+', '+e.getFullYear();
  }

  /* 1) build one empty cell per date, each tagged with data-date */
  function buildGrid(days,inMonth){
    var tk=key(TODAY);
    var h='<div class="cx-dow">'+DL.map(function(d){return '<span>'+d.slice(0,3)+'</span>'}).join('')+'</div><div class="cx-grid">';
    days.forEach(function(d){
      var k=key(d);
      var cls='cx-cell'+(inMonth&&d.getMonth()!==V.a.getMonth()?' out':'')+(k===tk?' td':'');
      h+='<div class="'+cls+'" data-date="'+k+'"><div class="cx-dn"><span class="cx-num">'+d.getDate()+'</span></div><div class="cx-list"></div></div>';
    });
    board.innerHTML=h+'</div>';
  }
  /* 2) put each event into the cell whose data-date matches */
  function placeEvents(limit){
    Object.keys(BY).forEach(function(k){
      var list=board.querySelector('.cx-cell[data-date="'+k+'"] .cx-list');
      if(!list)return;                       /* date not visible in this view */
      var L=BY[k],n=limit?Math.min(limit,L.length):L.length,h='';
      for(var i=0;i<n;i++)h+=pill(L[i]);
      if(L.length>n)h+='<button type="button" class="cx-more" data-date="'+k+'">+'+(L.length-n)+' more</button>';
      list.innerHTML=h;
    });
  }
  function dayHTML(){
    var L=BY[key(V.a)]||[];
    if(!L.length)return '<div class="cx-empty"><b>No events scheduled</b><p>You have nothing on your calendar for this day.</p></div>';
    return '<div class="cx-dv">'+L.map(function(e){
      return '<div class="cx-dr"><div class="cx-tc">'+esc(e.dl?'Due '+e.st:e.st)+'</div>'+
        '<button type="button" class="cx-ev cx-c-'+e.c+'" data-i="'+e.i+'"><i></i><span class="cx-et">'+esc(e.t)+'</span><span class="cx-tm">'+esc(e.co+' · '+e.loc)+'</span></button></div>';
    }).join('')+'</div>';
  }
  function renderCal(){
    var a=V.a;
    $('cx-cal').className='cx-cal '+(V.v==='month'?'cx-m':V.v==='week'?'cx-w':'cx-d');
    $('cx-label').textContent=label();
    $('cx-prev').setAttribute('aria-label','Previous '+V.v);
    $('cx-next').setAttribute('aria-label','Next '+V.v);
    if(V.v==='day'){board.innerHTML=dayHTML();return}
    var days=[],i;
    if(V.v==='month'){
      var f=new Date(a.getFullYear(),a.getMonth(),1),dim=new Date(a.getFullYear(),a.getMonth()+1,0).getDate();
      var start=addDays(f,-f.getDay()),n=Math.ceil((f.getDay()+dim)/7)*7;
      for(i=0;i<n;i++)days.push(addDays(start,i));
      buildGrid(days,true);placeEvents(3);
    }else{
      var s=addDays(a,-a.getDay());
      for(i=0;i<7;i++)days.push(addDays(s,i));
      buildGrid(days,false);placeEvents(0);
    }
  }
  function setView(v){
    V.v=v;
    [].forEach.call($('cx-seg').children,function(b){var on=b.getAttribute('data-v')===v;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
    renderCal();
  }
  function step(dir){
    var a=V.a;
    if(V.v==='month')V.a=new Date(a.getFullYear(),a.getMonth()+dir,1);
    else V.a=addDays(a,dir*(V.v==='week'?7:1));
    renderCal();
  }

  /* ---------- right-hand cards ---------- */
  function renderSide(){
    $('cx-t-date').textContent=fmt(TODAY);
    $('cx-t-day').textContent=DW[TODAY.getDay()];
    $('cx-ts').innerHTML=TS.length?TS.map(function(s){
      return '<li class="cx-c-'+s.c+'"><span class="cx-dot"></span><div><span class="cx-tt">'+esc(s.t)+'</span><span class="cx-nm">'+esc(s.n)+'</span><span class="cx-rm">'+esc(s.r)+'</span></div></li>';
    }).join(''):'<li class="none">No scheduled classes today.</li>';

    var tk=key(TODAY);
    var up=E.filter(function(e){return e.d>=tk}).sort(function(a,b){return a.d<b.d?-1:a.d>b.d?1:mins(a.st)-mins(b.st)}).slice(0,3);
    $('cx-upc').innerHTML=up.length?up.map(function(e){
      var d=parse(e.d);
      return '<li><button type="button" class="cx-ui" data-i="'+e.i+'"><span class="cx-dch"><small>'+MS[d.getMonth()]+'</small><b>'+d.getDate()+'</b></span>'+
        '<span class="cx-ut"><b>'+esc(e.t)+'</b><small>'+esc(e.sub||e.co)+' · '+esc(e.dl?'Due '+e.st:e.st)+'</small></span></button></li>';
    }).join(''):'<li class="none">No upcoming events.</li>';
  }

  /* ---------- event detail modal ---------- */
  var md=$('cx-modal'),opener=null;
  function openEv(i,from){
    var e=E[i];opener=from||document.activeElement;
    if(!e)return;
    $('cx-m-title').textContent=e.t;
    $('cx-m-dot').className='cx-cdot cx-c-'+e.c;
    $('cx-m-cat').textContent=CAT[e.c].full;
    $('cx-m-co').textContent=e.co;
    $('cx-m-d').textContent=fmt(parse(e.d));
    $('cx-m-t').textContent=e.dl?e.st+' (deadline)':timeText(e);
    $('cx-m-l').textContent=e.loc;
    $('cx-m-ds').textContent=e.desc;
    md.hidden=false;document.body.classList.add('cx-modal-open');
    $('cx-m-c').focus();
  }
  function closeEv(){
    md.hidden=true;document.body.classList.remove('cx-modal-open');
    if(opener&&opener.isConnected)opener.focus();
  }
  $('cx-m-x').addEventListener('click',closeEv);
  $('cx-m-c').addEventListener('click',closeEv);
  md.addEventListener('mousedown',function(e){if(e.target===md)closeEv()});

  /* ---------- controls ---------- */
  $('cx-prev').addEventListener('click',function(){step(-1)});
  $('cx-next').addEventListener('click',function(){step(1)});
  $('cx-today').addEventListener('click',function(){V.a=new Date(TODAY);renderCal()});
  $('cx-seg').addEventListener('click',function(e){var b=e.target.closest('button');if(b)setView(b.getAttribute('data-v'))});
  $('cx-full').addEventListener('click',function(){V.a=new Date(TODAY);setView('week')});
  $('cx-all').addEventListener('click',function(){V.a=new Date(TODAY);setView('month')});
  $('cx-upc').addEventListener('click',function(e){var b=e.target.closest('.cx-ui');if(b)openEv(+b.getAttribute('data-i'),b)});
  board.addEventListener('click',function(e){
    var p=e.target.closest('.cx-ev');
    if(p){openEv(+p.getAttribute('data-i'),p);return}
    var m=e.target.closest('.cx-more');
    if(m){V.a=parse(m.getAttribute('data-date'));setView('day')}
  });

  /* ---------- sidebar toggle / drawer: handled once by shell.js ---------- */

  /* one keydown listener: modal first (Esc + focus trap), otherwise the drawer */
  document.addEventListener('keydown',function(e){
    if(!md.hidden){
      if(e.key==='Escape'){closeEv();return}
      if(e.key==='Tab'){
        var f=md.querySelectorAll('button'),first=f[0],last=f[f.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
        else if(!md.contains(document.activeElement)){e.preventDefault();first.focus()}
      }
      return;
    }
  });

  /* teacher publishes or deletes an activity in another tab: refresh the calendar */
  window.addEventListener('storage',function(e){
    if(!e.key||e.key.indexOf('bshm.')!==0||!md.hidden)return;
    loadTeacher();renderSide();renderCal();
  });

  loadTeacher();renderSide();renderCal();
})();