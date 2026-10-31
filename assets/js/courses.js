(function(){
  var $=function(i){return document.getElementById(i)};

  /* ---------- Shared storage (same keys as the teacher page) ---------- */
  var ENROLLMENTS_KEY='bshm.enrollments';
  function lsGet(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
  function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  function studentSession(){try{return JSON.parse(sessionStorage.getItem('aces_session')||'null')}catch(e){return null}}
  function studentId(){var s=studentSession();return s&&s.studentId?String(s.studentId):''}
  function studentName(){var s=studentSession();return s?[s.firstName,s.middleName,s.lastName].filter(Boolean).join(' ')||s.fullName||s.name||'':''}
  function classDirectory(){
    var rows=(lsGet('bshm.class.all')||[]).concat(lsGet('bshm.class.custom')||[]),out={},i,r;
    for(i=0;i<rows.length;i++){r=rows[i];if(r&&r[0])out[r[0]]={code:r[0],name:r[1]||r[0],section:r[2]||'',info:r[3]||{},teacherId:r[4]||'',teacherName:r[5]||''}}
    return out;
  }
  /* BSHM 106 -> BSHM-106-2026 (must match the teacher page) */
  function jcode(code){return String(code).trim().toUpperCase().replace(/\s+/g,'-')+'-2026'}

  /* Find a class published in the shared directory by its student join code. */
  function teacherClass(v){
    var directory=classDirectory();
    for(var code in directory)if(Object.prototype.hasOwnProperty.call(directory,code)&&jcode(code)===v){
      var c=directory[code];return {code:c.code,name:c.name,ins:c.teacherName||'Your Instructor',icon:'bld'};
    }
    return null;
  }

  var C=[];

  var LBL={prog:'In Progress',done:'Completed',attn:'Needs Attention'};

  /* ---------- Sync with the teacher page ---------- */
  /* Activities the teacher created for a course */
  function teacherActs(code){
    var a=(lsGet('bshm.act.custom')||[]).filter(function(x){return x&&x.act&&x.act.course===code}).map(function(x){return x.act});
    var p=(lsGet('bshm.pos.custom')||[]).filter(function(x){return x&&x.course===code});
    return a.concat(p);
  }
  function sync(){
    var id=studentId(),session=studentSession(),all=classDirectory(),enrollments=lsGet(ENROLLMENTS_KEY)||{},codes=id&&Array.isArray(enrollments[id])?enrollments[id]:[];
    C=codes.map(function(code,index){
      var row=all[code];if(!row)return null;
      var A=teacherActs(code),items=A.filter(function(x){return x&&x.id}),done=0,next=null;
      items.forEach(function(a){
        var records=lsGet((a.type==='pos-training'?'bshm.poshist.':'bshm.hist.')+a.id)||[];
        var completed=records.some(function(r){return (id&&r.student_account_id?String(r.student_account_id)===id:String(r.student_id||r.student).toLowerCase()===String(session&&session.fullName||studentName()).toLowerCase())&&r.submitted_at});
        if(completed)done++;else next=next||a;
      });
      var pct=items.length?Math.round(done/items.length*100):0;
      return {code:row.code,name:row.name,ins:row.teacherName||'Your Instructor',pct:pct,icon:'bld',next:next&&(next.title||next.name)||'No activities yet',due:next&&next.due||'',rec:index+1,st:pct>=100&&items.length?'done':pct<20?'attn':'prog',joined:true};
    }).filter(Boolean);
  }

  var st={f:'all'};
  function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function card(c){
    return '<article class="cc"><div class="tp"><span class="cd">'+esc(c.code)+'</span><span class="sb '+c.st+'">'+LBL[c.st]+'</span></div>'+
    '<div class="mn"><span class="img"><svg class="i"><use href="#'+c.icon+'"/></svg></span><div><h3>'+esc(c.name)+'</h3><p class="ins">'+esc(c.ins)+'</p></div></div>'+
    '<div><div class="pg-row"><span>Progress</span><b>'+c.pct+'% complete</b></div><div class="bar" role="progressbar" aria-valuenow="'+c.pct+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+c.pct+'%"></i></div></div>'+
    '<div class="na"><div><small>Next activity</small><b>'+esc(c.next)+'</b></div><time class="'+(c.due?'':'nd')+'">'+esc(c.due||'No due date')+'</time></div>'+
    '<a class="go" href="#" data-code="'+esc(c.code)+'">Continue Course <span class="ar">&nbsp;→</span></a></article>';
  }
  function render(){
    var L=C.filter(function(c){return st.f==='all'||c.st===st.f});
    L.sort(function(a,b){return a.rec-b.rec});
    $('grid').innerHTML=L.map(card).join('');
    $('empty').hidden=L.length>0;
    $('rc').textContent=L.length?'Showing '+L.length+' of '+C.length+' courses':'';
  }
  /* Safe to call repeatedly: updates the existing <em> in each tab instead of appending new ones */
  var filterLabels={all:'All Courses',prog:'In Progress',done:'Completed',attn:'Needs Attention'};
  function counts(){
    var n={all:C.length,prog:0,attn:0,done:0};C.forEach(function(c){n[c.st]++});
    ['all','prog','attn','done'].forEach(function(k){$('n-'+k).textContent=n[k]});
    [].forEach.call($('flt').children,function(b){
      var f=b.getAttribute('data-f'),e=b.querySelector('em');
      if(!e){e=document.createElement('em');b.appendChild(e)}
      e.textContent=n[f];
    });
    [].forEach.call($('mobile-filter').options,function(o){
      o.textContent=filterLabels[o.value]+' ('+n[o.value]+')';
    });
  }
  function setFilter(f){
    st.f=f;
    [].forEach.call($('flt').children,function(x){var on=x.getAttribute('data-f')===f;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
    $('mobile-filter').value=f;
  }
  /* Shared toast (existing element). Optional bold title line. */
  var tm;
  function toast(msg,title){
    var t=$('toast');t.textContent='';
    if(title){var b=document.createElement('b');b.textContent=title;t.appendChild(b)}
    t.appendChild(document.createTextNode(msg));
    t.classList.add('on');clearTimeout(tm);tm=setTimeout(function(){t.classList.remove('on')},3500);
  }

  $('flt').addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    setFilter(b.getAttribute('data-f'));render();
  });
  $('mobile-filter').addEventListener('change',function(e){
    setFilter(e.target.value);render();
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
    var m=teacherClass(v);
    if(!m)return showErr('Please check the code provided by your instructor.','Invalid course code.');
    if(C.some(function(c){return c.code===m.code}))return showErr('You are already enrolled in this course.','Course Already Added');
    var id=studentId();
    if(!id)return showErr('Sign in again before joining a class.','Student account not found.');

    var enrollments=lsGet(ENROLLMENTS_KEY)||{};
    if(!Array.isArray(enrollments[id]))enrollments[id]=[];
    enrollments[id].push(m.code);
    if(!lsSet(ENROLLMENTS_KEY,enrollments))return showErr('Could not save your enrollment. Check available browser storage.');

    var joined=lsGet('bshm.joined')||{},me=studentName(),legacy=joined[m.code]||[];
    if(me&&legacy.indexOf(me)<0){legacy.push(me);joined[m.code]=legacy;if(!lsSet('bshm.joined',joined))toast('You are enrolled, but the teacher roster could not refresh.','Enrollment saved');}

    setFilter('all');
    sync();counts();render();closeM();
    toast(m.code+' — '+m.name+' has been added to your courses.','✓ Course Joined Successfully');
  });

  /* Live update when the teacher changes something in another tab */
  window.addEventListener('storage',function(){sync();setStatus();counts();render()});

  sync();counts();render();

  /* Sidebar toggle / drawer: handled once by assets/js/shell.js */
})();