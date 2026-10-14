(function(){
  var $=function(i){return document.getElementById(i)};

  /* ---------- Shared storage (same keys as the teacher page) ---------- */
  var SK='bshm.student.courses';
  function lsGet(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
  function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  /* BSHM 106 -> BSHM-106-2026 (must match the teacher page) */
  function jcode(code){return String(code).trim().toUpperCase().replace(/\s+/g,'-')+'-2026'}

  /* Find a class the teacher has, by join code.
     Looks in ALL published classes (bshm.class.all) and teacher-added ones (bshm.class.custom). */
  function teacherClass(v){
    var t=lsGet('bshm.teacher.name')||'Your Instructor';
    var L=(lsGet('bshm.class.all')||[]).concat(lsGet('bshm.class.custom')||[]);
    for(var i=0;i<L.length;i++){
      if(jcode(L[i][0])===v)return {code:L[i][0],name:L[i][1],ins:t,icon:'bld'};
    }
    return null;
  }

  /* rec = "recently accessed" rank; lower = more recent. Kept in course-code order (101 → 105) */
  var C=[
   {code:'BSHM 101',name:'Food & Beverage Services',ins:'Prof. Santos, Liza',pct:78,icon:'fork',next:'Practical Activity #4',due:'Due May 3',rec:1},
   {code:'BSHM 102',name:'Front Office Operations',ins:'Prof. Dela Cruz, Maria Angelica',pct:65,icon:'desk',next:'Quiz 4',due:'Due May 3',rec:2},
   {code:'BSHM 103',name:'Tourism Management',ins:'Prof. Ramos, John Patrick',pct:40,icon:'plane',next:'Activity 5',due:'Due May 5',rec:3},
   {code:'BSHM 104',name:'Housekeeping Operations',ins:'Prof. Villanueva, Christine',pct:25,icon:'bed',next:'Module 3: Room Inspection',due:'',rec:4},
   {code:'BSHM 105',name:'Tourism and Hospitality Law',ins:'Prof. Santos, Alyssa Marie',pct:10,icon:'law',next:'Module 1: Introduction',due:'',rec:5}];

  /* Mock joinable courses (built-in demo codes, used only if the teacher doesn't have that code) */
  var AV={
   'BSHM-106-2026':{code:'BSHM 106',name:'Hospitality Management Principles',ins:'Prof. Santos, Liza',icon:'bld'},
   'BSHM-107-2026':{code:'BSHM 107',name:'Events Management',ins:'Prof. Dela Cruz, Maria',icon:'cal'},
   'BSHM-108-2026':{code:'BSHM 108',name:'Food Safety and Sanitation',ins:'Prof. Ramos, John',icon:'check'}};

  /* Restore previously joined courses (saved newest first) */
  var joinedSaved=lsGet(SK)||[];
  joinedSaved.forEach(function(s,i){
    if(C.some(function(c){return c.code===s.code}))return;
    C.push({code:s.code,name:s.name,ins:s.ins,pct:0,icon:s.icon,next:'No activities yet',due:'',rec:-(i+1),st:'prog',joined:true});
  });

  var LBL={prog:'In Progress',done:'Completed',attn:'Needs Attention'};
  function setStatus(){C.forEach(function(c){if(!c.st)c.st=c.pct>=100?'done':c.pct<20?'attn':'prog'})}
  setStatus();

  /* ---------- Sync with the teacher page ---------- */
  /* Activities the teacher created for a course */
  function teacherActs(code){
    var a=(lsGet('bshm.act.custom')||[]).filter(function(x){return x&&x.act&&x.act.course===code}).map(function(x){return x.act});
    var p=(lsGet('bshm.pos.custom')||[]).filter(function(x){return x&&x.course===code});
    return a.concat(p);
  }
  function sync(){
    var all=lsGet('bshm.class.all'),cus=lsGet('bshm.class.custom')||[];
    var teacher=lsGet('bshm.teacher.name');

    /* drop student-joined courses the teacher has deleted */
    if(all){
      var codes=all.concat(cus).map(function(c){return c[0]});
      C=C.filter(function(c){
        if(!c.joined)return true;
        return codes.indexOf(c.code)>-1||!!AV[jcode(c.code)];
      });
    }

    C.forEach(function(c){
      /* latest class name / instructor from the teacher */
      var t=teacherClass(jcode(c.code));
      if(t){c.name=t.name;if(teacher)c.ins=t.ins}
      /* latest activity from the teacher becomes the "next activity" (field names: title/name, due) */
      var A=teacherActs(c.code);
      if(A.length){
        var x=A[A.length-1];
        c.next=x.title||x.name||'New activity';
        c.due=x.due||'';   /* teacher page already saves it as "Due May 3" */
      }
    });
  }

  var st={q:'',f:'all',s:'recent'};
  function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function norm(t){return t.toLowerCase().replace(/\s+/g,'')}
  function card(c){
    return '<article class="cc"><div class="tp"><span class="cd">'+esc(c.code)+'</span><span class="sb '+c.st+'">'+LBL[c.st]+'</span></div>'+
    '<div class="mn"><span class="img"><svg class="i"><use href="#'+c.icon+'"/></svg></span><div><h3>'+esc(c.name)+'</h3><p class="ins">'+esc(c.ins)+'</p></div></div>'+
    '<div><div class="pg-row"><span>Progress</span><b>'+c.pct+'% complete</b></div><div class="bar" role="progressbar" aria-valuenow="'+c.pct+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+c.pct+'%"></i></div></div>'+
    '<div class="na"><div><small>Next activity</small><b>'+esc(c.next)+'</b></div><time class="'+(c.due?'':'nd')+'">'+esc(c.due||'No due date')+'</time></div>'+
    '<a class="go" href="#" data-code="'+esc(c.code)+'">Continue Course <span class="ar">&nbsp;→</span></a></article>';
  }
  function render(){
    var q=norm(st.q);
    var L=C.filter(function(c){return (st.f==='all'||c.st===st.f)&&(!q||norm(c.code+c.name+c.ins).indexOf(q)>-1)});
    L.sort({recent:function(a,b){return a.rec-b.rec},hi:function(a,b){return b.pct-a.pct},lo:function(a,b){return a.pct-b.pct},az:function(a,b){return a.name.localeCompare(b.name)}}[st.s]);
    $('grid').innerHTML=L.map(card).join('');
    $('empty').hidden=L.length>0;
    $('rc').textContent=L.length?'Showing '+L.length+' of '+C.length+' courses':'';
  }
  /* Safe to call repeatedly: updates the existing <em> in each tab instead of appending new ones */
  function counts(){
    var n={all:C.length,prog:0,attn:0,done:0};C.forEach(function(c){n[c.st]++});
    ['all','prog','attn','done'].forEach(function(k){$('n-'+k).textContent=n[k]});
    [].forEach.call($('flt').children,function(b){
      var f=b.getAttribute('data-f'),e=b.querySelector('em');
      if(!e){e=document.createElement('em');b.appendChild(e)}
      e.textContent=n[f];
    });
  }
  function setFilter(f){
    st.f=f;
    [].forEach.call($('flt').children,function(x){var on=x.getAttribute('data-f')===f;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
  }
  /* Shared toast (existing element). Optional bold title line. */
  var tm;
  function toast(msg,title){
    var t=$('toast');t.textContent='';
    if(title){var b=document.createElement('b');b.textContent=title;t.appendChild(b)}
    t.appendChild(document.createTextNode(msg));
    t.classList.add('on');clearTimeout(tm);tm=setTimeout(function(){t.classList.remove('on')},3500);
  }

  $('q').addEventListener('input',function(e){st.q=e.target.value;render()});
  $('sort').addEventListener('change',function(e){st.s=e.target.value;render()});
  $('flt').addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    setFilter(b.getAttribute('data-f'));render();
  });
  /* Continue Course → go straight to the Activities page for that course */
  $('grid').addEventListener('click',function(e){
    var a=e.target.closest('.go');if(!a)return;e.preventDefault();
    var code=a.getAttribute('data-code');
    lsSet('bshm.activities.course',code);
    location.href='activities.html?course='+encodeURIComponent(code);
  });

  /* ---------- Join Course (teacher classes first, then demo codes) ---------- */
  var md=$('md'),jc=$('jc'),je=$('je'),jo=$('join-open');
  function showErr(msg,title){
    $('je-t').textContent=title||'';$('je-t').hidden=!title;
    $('je-m').textContent=msg;je.hidden=false;jc.setAttribute('aria-invalid','true');
  }
  function clearErr(){je.hidden=true;jc.removeAttribute('aria-invalid')}
  function openM(){clearErr();jc.value='';md.hidden=false;document.body.classList.add('md-open');jc.focus()}
  function closeM(){md.hidden=true;document.body.classList.remove('md-open');jo.focus()}
  jo.addEventListener('click',openM);
  $('md-x').addEventListener('click',closeM);
  $('md-c').addEventListener('click',closeM);
  md.addEventListener('mousedown',function(e){if(e.target===md)closeM()});
  jc.addEventListener('input',clearErr);
  document.addEventListener('keydown',function(e){
    if(md.hidden)return;
    if(e.key==='Escape'){closeM();return}
    if(e.key==='Tab'){ /* keep focus inside the dialog */
      var f=md.querySelectorAll('button,input'),first=f[0],last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      else if(!md.contains(document.activeElement)){e.preventDefault();first.focus()}
    }
  });
  $('jf').addEventListener('submit',function(e){
    e.preventDefault();
    var v=jc.value.trim().toUpperCase();jc.value=v;
    if(!v)return showErr('Please enter a course code.');
    var m=teacherClass(v)||AV[v];   /* teacher's data wins over demo codes */
    if(!m)return showErr('Please check the code provided by your instructor.','Invalid course code.');
    if(C.some(function(c){return c.code===m.code}))return showErr('You are already enrolled in this course.','Course Already Added');

    /* newest course = most recently accessed (lowest rec) */
    var top=Math.min.apply(null,C.map(function(c){return c.rec}));
    C.push({code:m.code,name:m.name,ins:m.ins,pct:0,icon:m.icon,next:'No activities yet',due:'',rec:top-1,st:'prog',joined:true});

    /* remember the join for this student */
    var sv=lsGet(SK)||[];
    sv.unshift({code:m.code,name:m.name,ins:m.ins,icon:m.icon});
    lsSet(SK,sv);

    /* register the student in the teacher's roster */
    var jn=lsGet('bshm.joined')||{},me=lsGet('bshm.student.name')||'Student';
    jn[m.code]=jn[m.code]||[];
    if(jn[m.code].indexOf(me)<0)jn[m.code].push(me);
    lsSet('bshm.joined',jn);

    st.q='';$('q').value='';setFilter('all');
    sync();counts();render();closeM();
    toast(m.code+' — '+m.name+' has been added to your courses.','✓ Course Joined Successfully');
  });

  /* Live update when the teacher changes something in another tab */
  window.addEventListener('storage',function(){sync();setStatus();counts();render()});

  sync();counts();render();

  /* Sidebar toggle / drawer: handled once by shell.js */
})();