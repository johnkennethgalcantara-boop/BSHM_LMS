(function(){
  var $=function(i){return document.getElementById(i)};

  /* ---------- TYPES / TABS ---------- */
  var TYPES={
    assignment:'Assignment',
    quiz:'Quiz',
    exam:'Exam',
    practical:'Practical Activity',
    'pos-training':'POS Training'
  };

  var TABS=[
    ['all','All Activities'],
    ['assignment','Assignments'],
    ['quiz','Quizzes'],
    ['exam','Exams'],
    ['practical','Practical Activities'],
    ['pos-training','POS Training']
  ];

  var TAB_ALIAS={pos:'pos-training'};

  var SC={
    'Not Started':'ns',
    'In Progress':'ip',
    'Completed':'cp',
    'Due Soon':'du',
    'Restricted':'fl',
    'Retake Available':'du'
  };

  var SESSION_TYPES=['quiz','exam','practical'];

  /* ---------- ANTI-CHEAT SETTINGS ----------
     The teacher saves these per activity under bshm.cfg.<activityId>
     (teacher-activities.html writes them when an activity is published).
     These are the defaults when nothing is saved.
       on   = anti-cheat monitoring ON/OFF
       fs   = fullscreen required ON/OFF
       max  = maximum violations allowed
       auto = auto-submit (restrict) when max is reached ON/OFF
     Right-click is always disabled during an active exam. */
  var DEF_CFG={on:true,fs:true,max:1,auto:true};

  /* Percentage needed for PASSED on quizzes and exams. Adjust as needed.
     (teacher-activities.html uses the same value: PASS) */
  var PASSING_PERCENT=75;

  /* Single-active-session lock (localStorage prototype). */
  var LOCK_KEY='bshm.exam.lock';
  var LOCK_BEAT=2000;
  var LOCK_STALE=6000;

  /* One physical tab switch can fire several browser events
     (visibilitychange + blur + fullscreenchange). Count it once. */
  var VIOLATION_COOLDOWN=2000;

  var ACTIVE_KEY='bshm.exam.active';

  /* Quizzes and exams published by the teacher (teacher-activities.html). */
  var CUSTOM_KEY='bshm.act.custom';

  var VLABEL={
    TAB_SWITCH:'Tab switch',
    WINDOW_BLUR:'Window lost focus',
    EXIT_FULLSCREEN:'Fullscreen exited'
  };

  /* ---------- URL PARAMETERS (read once, up front) ----------
     ?course=BSHM 101  -> opened from "Continue Course": list only that course.
     ?tab=..., ?open=..., ?done=...  -> as before. */
  var qs=new URLSearchParams(location.search);
  var courseFilter=(qs.get('course')||'').trim();

  /* ---------- MOCK DATA ---------- */
  var activities=[
    {
      id:'assignment-001',
      type:'assignment',
      category:'Assignments',
      title:'Food & Beverage Service Reflection',
      desc:'Write a one-page reflection on service standards observed during your dining lab.',
      course:'BSHM 101',
      due:'Due May 3',
      points:50,
      status:'In Progress',
      instructions:[
        'Write one page (250 to 300 words).',
        'Describe at least three service standards you observed.',
        'Reflect on what you would do differently as a server.',
        'Submit as a PDF or Word file.'
      ]
    },
    {
      id:'assignment-002',
      type:'assignment',
      category:'Assignments',
      title:'Housekeeping Procedure Checklist',
      desc:'Prepare a room inspection checklist following standard housekeeping procedures.',
      course:'BSHM 104',
      due:'Due May 8',
      points:40,
      status:'Completed',
      instructions:[
        'List all areas of a guest room to be inspected.',
        'Group items by area (bathroom, bed, furniture, floor).',
        'Add a pass/fail column and a remarks column.',
        'Submit as a PDF or Word file.'
      ]
    },
    {
      id:'quiz-001',
      type:'quiz',
      category:'Quizzes',
      title:'Hospitality Operations Quiz',
      desc:'Short quiz on front office procedures, guest handling and reservations.',
      course:'BSHM 102',
      due:'Due May 3',
      points:30,
      status:'Due Soon',
      questions:15,
      time:20
    },
    {
      id:'quiz-002',
      type:'quiz',
      category:'Quizzes',
      title:'Tourism Basics Quiz',
      desc:'Check your understanding of tourism concepts, sectors and destinations.',
      course:'BSHM 103',
      due:'Due May 6',
      points:20,
      status:'Not Started',
      questions:10,
      time:15
    },
    {
      id:'exam-001',
      type:'exam',
      category:'Exams',
      title:'Midterm Examination',
      desc:'Covers Modules 1 to 4 including theory, terminology and case scenarios.',
      course:'BSHM 103',
      due:'Due May 12',
      points:100,
      status:'Not Started',
      questions:50,
      time:90,
      coverage:'Modules 1 to 4: hospitality industry overview, guest service principles, front office and housekeeping operations, and case scenarios.'
    },
    {
      id:'practical-001',
      type:'practical',
      category:'Practical Activities',
      title:'Table Setting Practical',
      desc:'Demonstrate a proper formal table setting within the allotted time.',
      course:'BSHM 101',
      due:'Due May 5',
      points:50,
      status:'Due Soon',
      objective:'Set a complete formal cover accurately and neatly within the time allowed.',
      requirements:[
        'Complete uniform and grooming',
        'Tablecloth, plates, cutlery and glassware',
        'Napkin fold of your choice',
        'Finish within 10 minutes'
      ]
    },
    {
      id:'practical-002',
      type:'practical',
      category:'Practical Activities',
      title:'Bed Making Demonstration',
      desc:'Perform a standard hotel bed-making procedure with correct linen handling.',
      course:'BSHM 104',
      due:'Due May 10',
      points:50,
      status:'Not Started',
      objective:'Make a bed to hotel standard with correct linen handling and corners.',
      requirements:[
        'Complete uniform and grooming',
        'Fitted sheet, flat sheet, blanket, pillows',
        'Hospital corners on all sides',
        'Finish within 8 minutes'
      ]
    }
  ];

  /* ---------- POS TRAINING DATA ---------- */
  var posActivities=(window.POS_ACTIVITIES||[]).map(function(p){
    var item=Object.assign(
      {status:'Not Started'},
      p,
      {type:'pos-training',category:'POS Training'}
    );

    /* A saved POS result (written by recordPOS) keeps the card Completed after a reload. */
    try{
      var h=JSON.parse(localStorage.getItem('bshm.poshist.'+p.id));
      if(h&&h.length){item.status='Completed';}
    }catch(e){}

    return item;
  });

  /* ---------- STATE ---------- */
  var tab='all';
  var current=null;
  var nt;
  var query='';
  var stat='all';

  var all=function(){
    return activities.concat(posActivities);
  };

  /* Same course? (ignores case and extra spaces) */
  function sameCourse(a){
    return String(a.course||'').replace(/\s+/g,'').toLowerCase()===
           courseFilter.replace(/\s+/g,'').toLowerCase();
  }

  /* All activities, narrowed to the chosen course when opened from "Continue Course". */
  var scoped=function(){
    var L=all();

    return courseFilter?L.filter(sameCourse):L;
  };

  var badge=function(s){
    return '<span class="sb '+(SC[s]||'')+'">'+s+'</span>';
  };

  var isPOS=function(a){
    return a&&a.type==='pos-training';
  };

  /* Status filter: add the two new statuses without touching the HTML. */
  (function(){
    var sel=$('st');

    if(!sel){return;}

    ['Restricted','Retake Available'].forEach(function(t){
      var o=document.createElement('option');

      o.textContent=t;
      sel.appendChild(o);
    });
  })();

  /* ---------- LOCAL STORAGE HELPERS ---------- */
  function lsGet(k){
    try{
      return JSON.parse(localStorage.getItem(k));
    }catch(e){
      return null;
    }
  }

  function lsSet(k,v){
    try{
      localStorage.setItem(k,JSON.stringify(v));
    }catch(e){}
  }

  function lsDel(k){
    try{
      localStorage.removeItem(k);
    }catch(e){}
  }

  /* Storage layout (prototype; move to the backend later):
       bshm.exam.<id>    current attempt (answers, timer, violations, result)
       bshm.hist.<id>    array of ALL attempts (includes the answers the teacher
                         reviews and grades). Never overwritten or deleted.
       bshm.retake.<id>  teacher approval for one retake (single-use)
       bshm.cfg.<id>     anti-cheat configuration saved with the activity
       bshm.act.custom   quizzes/exams published by the teacher */
  var skey=function(id){return 'bshm.exam.'+id;};
  var hkey=function(id){return 'bshm.hist.'+id;};
  var rkey=function(id){return 'bshm.retake.'+id;};
  var ckey=function(id){return 'bshm.cfg.'+id;};

  function cfgFor(id){
    var c=Object.assign({},DEF_CFG,lsGet(ckey(id))||{});

    c.max=Math.max(1,parseInt(c.max,10)||1);

    return c;
  }

  function newState(){
    return {
      examAnswers:{},
      examStartTime:Date.now(),
      currentQuestion:0,
      antiCheatViolationCount:0,
      antiCheatLogs:[],
      submitted:false,
      result:null,
      attemptNumber:1,
      isRetake:false,
      approvedBy:null,
      approvedAt:null
    };
  }

  /* ---------- CURRENT STUDENT ---------- */
  function getStudent(){
    var u=document.querySelector('.user b');

    return {
      name:u?u.textContent.trim():'Student',
      course:'BSHM'
    };
  }

  /* The navbar shows "Dela Cruz, Juan". The teacher Gradebook and Reports
     match results by "Juan Dela Cruz", so records are saved that way. */
  function studentKey(){
    var n=getStudent().name;
    var m=n.match(/^([^,]+),\s*(.+)$/);

    return m?m[2]+' '+m[1]:n;
  }

  /* Upsert one attempt record by attempt number. Old attempts stay untouched. */
  function histUpsert(a,s,patch){
    var h=lsGet(hkey(a.id))||[];
    var n=s.attemptNumber||1;
    var e=null;

    h.forEach(function(r){
      if(r.attempt_number===n){e=r;}
    });

    if(!e){
      e={
        id:a.id+'-'+n,
        exam_id:a.id,
        exam_title:a.title,
        student_id:studentKey(),
        attempt_number:n,
        score:null,
        total:null,
        percentage:null,
        status:'IN_PROGRESS',
        violation_count:0,
        violation_reason:null,
        violation_log:[],
        started_at:new Date(s.examStartTime).toISOString(),
        submitted_at:null,
        is_retake:!!s.isRetake,
        approved_by:s.approvedBy||null,
        approved_at:s.approvedAt||null
      };

      h.push(e);
    }

    Object.assign(e,patch||{});

    lsSet(hkey(a.id),h);
  }

  function lastResult(id){
    var s=lsGet(skey(id));

    return s&&s.submitted&&s.result;
  }

  /* A retake is available only when the teacher approved it AND the
     latest attempt is RESTRICTED. Students can never approve themselves. */
  function retakeOK(id){
    var r=lsGet(rkey(id));
    var l=lastResult(id);

    return !!(r&&l&&l.status==='RESTRICTED');
  }

  function statusFor(a){
    var st=lsGet(skey(a.id));

    if(!st){return a.status;}

    if(!st.submitted){return 'In Progress';}

    if(retakeOK(a.id)){return 'Retake Available';}

    return(st.result&&st.result.status==='RESTRICTED')?'Restricted':'Completed';
  }

  /* ---------- QUESTION BANK ----------
     Built-in quizzes/exams use window.EXAM_QUESTIONS: [text, options, correctIndex].
     Teacher-published ones carry their own questions:
       [text, options, correctIndex, 'mc'|'essay', points, gradingGuide]
     The answer key is used ONLY to calculate the score. It is never rendered
     to the student, and the teacher's essay grading guide is never loaded here.
     Normalised shape: {q:text, o:options, a:correctIndex, t:'mc'|'es', p:points} */
  var BANK=window.EXAM_QUESTIONS||{};
  var customQs={};

  function bankFor(id){
    if(customQs[id]){
      return customQs[id].map(function(r){
        var es=r[3]==='essay';

        return {
          q:r[0],
          o:es?[]:(r[1]||[]),
          a:es?-1:r[2],
          t:es?'es':'mc',
          p:Math.max(1,+r[4]||1)
        };
      });
    }

    return (BANK[id]||[]).map(function(r){
      return {q:r[0],o:r[1],a:r[2],t:'mc',p:1};
    });
  }

  activities.forEach(function(a){
    if(a.type!=='quiz'&&a.type!=='exam')return;

    if(BANK[a.id]&&BANK[a.id].length){
      a.questions=BANK[a.id].length;
    }

    if(lsGet(skey(a.id))){
      a.status=statusFor(a);
    }
  });

  /* ---------- TEACHER-PUBLISHED ACTIVITIES ----------
     Reads bshm.act.custom ([{act, qs}]) and adds each quiz/exam to the list.
     Safe to call again: it first removes the previously loaded ones. */
  function loadCustom(){
    for(var i=activities.length-1;i>=0;i--){
      if(activities[i].custom){activities.splice(i,1);}
    }

    customQs={};

    (lsGet(CUSTOM_KEY)||[]).forEach(function(c){
      if(!c||!c.act||!c.act.id||!c.qs||!c.qs.length)return;
      if(c.act.type!=='quiz'&&c.act.type!=='exam')return;

      var a=Object.assign({},c.act,{custom:true,status:'Not Started'});

      a.questions=c.qs.length;
      a.time=+a.time||0;                 /* 0 = no time limit */
      customQs[a.id]=c.qs;

      if(lsGet(skey(a.id))){
        a.status=statusFor(a);
      }

      activities.push(a);
    });
  }

  loadCustom();

  /* ---------- WATERMARK ---------- */
  function esc(s){
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function removeAssessmentWatermark(){
    var watermark=document.querySelector('.assessment-watermark');

    if(watermark){
      watermark.remove();
    }
  }

  function createAssessmentWatermark(activity){
    removeAssessmentWatermark();

    var student=getStudent();
    var d=new Date();

    var when=
      d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+
      ' '+
      d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});

    var text=esc([
      student.name,
      student.course,
      'ACES Polytechnic College',
      activity.id,
      when
    ].join(' \u2022 ').toUpperCase());

    var row=
      '<div class="wmr">'+
      new Array(6).join(text+'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')+
      '</div>';

    var w=document.createElement('div');

    w.className='assessment-watermark';
    w.setAttribute('aria-hidden','true');
    w.setAttribute('data-activity',activity.title);

    w.innerHTML='<div class="wmi">'+new Array(19).join(row)+'</div>';

    document.body.appendChild(w);
  }

  /* ---------- VIEWS / NOTIFICATIONS ---------- */
  function show(v){
    ['list','overview','session'].forEach(function(k){
      var el=$('view-'+k);

      if(el){
        el.hidden=k!==v;
      }
    });

    if(v!=='session'){
      removeAssessmentWatermark();
    }

    window.scrollTo(0,0);

    var m=document.querySelector('main');

    if(m){
      m.scrollTop=0;
    }
  }

  function note(msg,kind){
    var t=$('atoast');

    if(!t)return;

    t.textContent=msg;
    t.className='atoast on '+(kind||'');

    clearTimeout(nt);

    nt=setTimeout(function(){
      t.classList.remove('on');
    },2600);
  }

  /* =====================================================
     ACTIVITIES LIST
     ===================================================== */

  function filterActivities(){
    var q=query.trim().toLowerCase();

    return scoped().filter(function(a){

      if(tab!=='all'&&a.type!==tab){
        return false;
      }

      if(stat!=='all'&&a.status!==stat){
        return false;
      }

      return !q||
        (a.title+' '+a.desc+' '+a.course+' '+TYPES[a.type])
          .toLowerCase()
          .indexOf(q)>-1;
    });
  }

  function renderTabs(){
    var base=scoped();

    $('tabs').innerHTML=TABS.map(function(t){

      var n=base.filter(function(a){
        return t[0]==='all'||a.type===t[0];
      }).length;

      return(
        '<button '+
        'role="tab" '+
        'data-t="'+t[0]+'" '+
        'aria-selected="'+(t[0]===tab)+'" '+
        'class="'+(t[0]===tab?'on':'')+'">'+
        t[1]+
        '<em>'+n+'</em>'+
        '</button>'
      );

    }).join('');
  }

  /* ---------- SUMMARY ---------- */
  function renderSummary(){
    var L=scoped();

    var c=function(s){
      return L.filter(function(a){
        return a.status===s;
      }).length;
    };

    var items=[
      ['Total',L.length],
      ['In Progress',c('In Progress')],
      ['Completed',c('Completed')],
      ['Due Soon',c('Due Soon')]
    ];

    var sum=$('sum');

    if(sum){
      sum.innerHTML=items.map(function(i){
        return(
          '<div>'+
            '<span>'+i[0]+'</span>'+
            '<b>'+i[1]+'</b>'+
            '<small>Activities</small>'+
          '</div>'
        );
      }).join('');
    }
  }

  /* ---------- COURSE BANNER ("Continue Course" filter) ---------- */
  function renderCourseBar(){
    var bar=$('course-bar');

    if(!courseFilter){
      if(bar){bar.remove();}
      return;
    }

    if(!bar){
      bar=document.createElement('div');
      bar.id='course-bar';
      bar.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 16px;padding:12px 16px;border:1px solid #E3E1F2;border-radius:14px;background:#F0EDFF;color:#4B2FC4;font-size:14px';

      var host=$('view-list'),tabsEl=$('tabs');

      if(host){
        host.insertBefore(bar,tabsEl||host.children[1]||null);
      }
    }

    bar.innerHTML=
      '<span>Showing activities for <b>'+esc(courseFilter)+'</b></span>'+
      '<button type="button" data-act="showall" '+
      'style="border:1px solid #C9C1F5;background:#fff;color:#4B2FC4;border-radius:10px;padding:6px 12px;font:600 13px Inter,sans-serif;cursor:pointer">'+
      'Show all courses</button>';
  }

  /* ---------- CARD CTA ---------- */
  var CTA={
    assignment:'View Activity',
    quiz:'View Quiz',
    exam:'View Exam',
    practical:'View Activity',
    'pos-training':'Start Training'
  };

  function ctaFor(a){
    if((a.type==='quiz'||a.type==='exam')&&a.status==='Retake Available'){
      return 'Take Retake';
    }

    return CTA[a.type];
  }

  /* ---------- CARD METRICS ---------- */
  function metrics(a){
    var m=['<b>'+a.points+'</b> Points'];

    if(a.type==='exam'){
      m.push('<b>'+a.questions+'</b> Questions');

      if(a.time){
        m.push('<b>'+a.time+'</b> Minutes');
      }
    }

    if(a.type==='quiz'){
      if(a.questions){
        m.push('<b>'+a.questions+'</b> Questions');
      }

      if(a.time){
        m.push('<b>'+a.time+'</b> Minutes');
      }
    }

    if(isPOS(a)){
      m.push(
        '<b>'+a.time+'</b> Minutes',
        '<b>'+a.steps+'</b> Steps'
      );
    }

    return m.join('<span class="dot">\u00B7</span>');
  }

  /* ---------- ACTIVITY CARD ---------- */
  function cardHTML(a){
    var icon=isPOS(a)
      ?'<svg class="i"><use href="#check"/></svg>'
      :'';

    var meta=a.course+(a.due?' \u00B7 '+a.due:'');

    return(
      '<article class="card ac t-'+a.type+'">'+

        '<span class="ty">'+icon+TYPES[a.type]+'</span>'+

        '<h3>'+esc(a.title)+'</h3>'+

        '<p class="ds">'+esc(a.desc)+'</p>'+

        '<p class="mt">'+esc(meta)+'</p>'+

        '<div class="mx">'+metrics(a)+'</div>'+

        '<div class="ft">'+
          badge(a.status)+
          '<button class="go" data-open="'+esc(a.id)+'">'+
            ctaFor(a)+
            ' <span aria-hidden="true">\u2192</span>'+
          '</button>'+
        '</div>'+

      '</article>'
    );
  }

  /* ---------- RENDER ACTIVITIES ---------- */
  function renderActivities(){
    renderCourseBar();
    renderTabs();
    renderSummary();

    var s=$('sec');

    if(s){
      s.hidden=tab!=='pos-training';

      s.innerHTML=
        tab==='pos-training'
        ?'<p>Practice activities designed to prepare you for actual POS performance.</p>'
        :'';
    }

    var rows=filterActivities();

    var cnt=$('cnt');

    if(cnt){
      cnt.textContent=rows.length+' total';
    }

    var grid=$('grid');

    if(!grid)return;

    var emptyMsg=
      (courseFilter&&!scoped().length)
      ?'Your teacher has not posted any activities for '+esc(courseFilter)+' yet.'
      :'No activities match your search or filter.';

    grid.innerHTML=
      rows.length
      ?rows.map(cardHTML).join('')
      :'<div class="none">'+emptyMsg+'</div>';
  }

  /* =====================================================
     OVERVIEW BUILDERS
     ===================================================== */

  function info(pairs){
    return(
      '<div class="info">'+
      pairs.map(function(p){
        return '<div>'+p[0]+'<b>'+p[1]+'</b></div>';
      }).join('')+
      '</div>'
    );
  }

  function list(items){
    return(
      '<ul class="bl">'+
      items.map(function(x){
        return '<li>'+x+'</li>';
      }).join('')+
      '</ul>'
    );
  }

  function section(title,body){
    return '<div><h4>'+title+'</h4>'+body+'</div>';
  }

  function head(a){
    return(
      '<div class="ovh">'+
        '<div>'+
          '<span class="ty">'+TYPES[a.type]+'</span>'+
          '<h2>'+esc(a.title)+'</h2>'+
        '</div>'+
        badge(a.status)+
      '</div>'
    );
  }

  function wrap(a,body,btn,act){
    return(
      '<a class="back" href="#" data-act="close">\u2190 Back to Activities</a>'+

      '<div class="ov one">'+
        '<div class="card ovc">'+

          head(a)+
          body+

          '<div>'+
            '<button class="btn solid" data-act="'+(act||'mock')+'" data-label="'+btn+'">'+
              btn.toUpperCase()+
            '</button>'+
          '</div>'+

        '</div>'+
      '</div>'
    );
  }

  /* ---------- START / RESUME LABEL ----------
     Completed attempts never reach this: they show the result summary. */
  function examBtn(a){
    return (lsGet(skey(a.id))?'Resume ':'Start ')+TYPES[a.type];
  }

  function timeTxt(a){
    return a.time?a.time+' minutes':'No limit';
  }

  /* =====================================================
     RESULT HELPERS (student side: summary only)
     ===================================================== */

  function isDone(a){
    var st=lsGet(skey(a.id));
    return !!(st&&st.submitted&&st.result);
  }

  function resultParts(r){
    var pct=(r.percentage!=null)
      ?r.percentage
      :(r.total?Math.round(r.correct/r.total*100):null);

    var status=r.status||(pct>=PASSING_PERCENT?'PASSED':'FAILED');

    var d=new Date(r.submittedAt);

    var when=
      d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+
      ' \u00B7 '+
      d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});

    var col=status==='PASSED'?'#217A4D':(status==='PENDING'?'#B54708':'#B42318');

    var tiles=
      '<div class="info" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">'+
        '<div>Score<b>'+(r.total?r.correct+' / '+r.total:'\u2014')+'</b></div>'+
        '<div>Percentage<b>'+(pct==null?'\u2014':pct+'%')+'</b></div>'+
        '<div>Status<b style="color:'+col+'">'+status+'</b></div>'+
      '</div>';

    /* essayPending is set to 0 once the teacher saves the grade. */
    var extra=r.essayPending
      ?'<p>'+r.essayPending+' essay answer'+(r.essayPending>1?'s':'')+
       ' will be graded by your teacher. The score above covers the multiple-choice questions only.</p>'
      :(r.graded
        ?'<p>Your teacher has finished grading this '+'attempt. The score above is your final grade.</p>'
        :'');

    return {pct:pct,status:status,when:when,tiles:tiles,note:extra};
  }

  /* Overview of an already-submitted quiz/exam:
     no questions, no answers. Shows TAKE RETAKE only after teacher approval. */
  function completedOverview(a){
    var p=resultParts(lsGet(skey(a.id)).result);
    var extra='';

    if(retakeOK(a.id)){
      extra=
        '<p><b>Status: Retake Available.</b> Your teacher has approved another attempt. '+
        'Your previous attempt stays in your records.</p>'+
        '<div><button class="btn solid" data-act="retake">TAKE RETAKE</button></div>';
    }else if(p.status==='RESTRICTED'){
      extra=
        '<p><b>Reason:</b> Maximum anti-cheat violations reached. '+
        'Only your teacher can allow a retake.</p>';
    }

    return(
      '<a class="back" href="#" data-act="close">\u2190 Back to Activities</a>'+

      '<div class="ov one">'+
        '<div class="card ovc">'+
          head(a)+
          section('Result',p.tiles)+
          '<p>Submitted: '+p.when+'</p>'+
          p.note+
          extra+
        '</div>'+
      '</div>'
    );
  }

  var BUILD={

    assignment:function(a){
      return wrap(
        a,
        section('Description','<p>'+a.desc+'</p>')+
        section('Information',info([
          ['Course',a.course],
          ['Due Date',a.due.replace('Due ','')],
          ['Points',a.points]
        ]))+
        section('Instructions',list(a.instructions)),
        'Submit Assignment'
      );
    },

    quiz:function(a){
      if(isDone(a)){return completedOverview(a);}

      return wrap(
        a,
        section('Description','<p>'+esc(a.desc)+'</p>')+
        section('Information',info([
          ['Course',esc(a.course)],
          ['Questions',a.questions],
          ['Points',a.points],
          ['Time Limit',timeTxt(a)]
        ])),
        examBtn(a),
        'begin'
      );
    },

    exam:function(a){
      if(isDone(a)){return completedOverview(a);}

      return wrap(
        a,
        section('Coverage','<p>'+esc(a.coverage||a.desc)+'</p>')+
        section('Information',info([
          ['Course',esc(a.course)],
          ['Questions',a.questions],
          ['Points',a.points],
          ['Time Limit',timeTxt(a)]
        ])),
        examBtn(a),
        'begin'
      );
    },

    practical:function(a){
      return wrap(
        a,
        section('Description','<p>'+a.desc+'</p>')+
        section('Objective','<p>'+a.objective+'</p>')+
        section('Requirements',list(a.requirements))+
        section('Information',info([
          ['Course',a.course],
          ['Due Date',a.due.replace('Due ','')],
          ['Points',a.points]
        ])),
        'Start Practical Activity',
        'begin'
      );
    },

    'pos-training':function(a){
      return(
        '<a class="back" href="#" data-act="close">\u2190 Back to Activities</a>'+

        '<div class="ov wide">'+
          '<div class="card ovc">'+

            head(a)+

            '<div>'+
              '<h4>Description</h4>'+
              '<p>'+a.desc+'</p>'+
            '</div>'+

            '<div class="info">'+
              '<div>Course<b>'+a.course+'</b></div>'+
              '<div>Points<b>'+a.points+'</b></div>'+
              '<div>Passing Score<b>'+a.pass+'%</b></div>'+
              '<div>Steps<b>'+a.steps+'</b></div>'+
              '<div>Time Limit<b>'+a.time+' minutes</b></div>'+
              '<div>Status<b>'+a.status+'</b></div>'+
            '</div>'+

            '<div class="two">'+
              '<div>'+
                '<h4>Training Objective</h4>'+
                '<p>'+a.objective+'</p>'+
              '</div>'+
              '<div>'+
                '<h4>Before You Begin</h4>'+
                '<ul class="bl">'+
                  (window.POS_BEFORE||[]).map(function(x){
                    return '<li>'+x+'</li>';
                  }).join('')+
                '</ul>'+
              '</div>'+
            '</div>'+

            '<div>'+
              '<button class="btn solid" data-act="start">START POS TRAINING</button>'+
            '</div>'+

          '</div>'+
        '</div>'
      );
    }
  };

  /* ---------- OPEN ACTIVITY ---------- */
  function openActivity(id){
    current=all().filter(function(a){
      return a.id===id;
    })[0];

    if(!current||!BUILD[current.type]){
      return;
    }

    /* Keep the badge in sync with the stored attempt / teacher approval. */
    if(current.type==='quiz'||current.type==='exam'){
      if(lsGet(skey(current.id))){current.status=statusFor(current);}
    }

    $('view-overview').innerHTML=BUILD[current.type](current);

    show('overview');
  }

  function closeActivity(){
    /* Pick up newly published teacher activities. */
    loadCustom();

    /* Refresh statuses so teacher approvals and grades show up. */
    activities.forEach(function(a){
      if((a.type==='quiz'||a.type==='exam')&&lsGet(skey(a.id))){
        a.status=statusFor(a);
      }
    });

    renderActivities();
    show('list');
  }

  /* =====================================================
     FULLSCREEN HELPERS
     ===================================================== */

  function fsEl(){
    return document.fullscreenElement||
      document.webkitFullscreenElement||
      null;
  }

  function fsSupported(){
    var e=document.documentElement;

    return !!(e.requestFullscreen||e.webkitRequestFullscreen);
  }

  function reqFS(){
    var e=document.documentElement;

    var f=e.requestFullscreen||e.webkitRequestFullscreen;

    if(!f){
      return Promise.reject(new Error('unsupported'));
    }

    try{
      var r=f.call(e);

      return(r&&r.then?r:Promise.resolve());
    }catch(err){
      return Promise.reject(err);
    }
  }

  function exitFS(){
    var f=document.exitFullscreen||document.webkitExitFullscreen;

    if(f&&fsEl()){
      try{
        var r=f.call(document);

        if(r&&r.catch){
          r.catch(function(){});
        }
      }catch(e){}
    }
  }

  /* =====================================================
     SINGLE ACTIVE SESSION (prototype lock)
     Isolated here so it can be replaced by a real backend
     session lock later: only acquireLock / releaseLock /
     lostLock need to change.
     ===================================================== */

  var PAGE_ID=Math.random().toString(36).slice(2);
  var hb=null;

  function readLock(){
    return lsGet(LOCK_KEY);
  }

  function lockFresh(l){
    return !!(l&&Date.now()-l.ts<LOCK_STALE);
  }

  /* Another live page owns the lock? */
  function lockedElsewhere(){
    var l=readLock();

    return !!(lockFresh(l)&&l.page&&l.page!==PAGE_ID);
  }

  function acquireLock(id){

    if(lockedElsewhere()){
      return false;
    }

    lsSet(LOCK_KEY,{id:id,page:PAGE_ID,ts:Date.now()});

    clearInterval(hb);

    hb=setInterval(function(){

      if(lockedElsewhere()){
        lostLock();
        return;
      }

      lsSet(LOCK_KEY,{id:id,page:PAGE_ID,ts:Date.now()});

    },LOCK_BEAT);

    return true;
  }

  function releaseLock(){
    clearInterval(hb);
    hb=null;

    var l=readLock();

    if(l&&l.page===PAGE_ID){
      lsDel(LOCK_KEY);
    }
  }

  /* Refresh / close: free the lock for the next page load right away. */
  window.addEventListener('pagehide',function(){
    var l=readLock();

    if(l&&l.page===PAGE_ID){
      lsSet(LOCK_KEY,{id:l.id,page:null,ts:l.ts});
    }
  });

  /* =====================================================
     EXAM-MODE GUARDS (active ONLY during an exam)

     IMPORTANT: these are DETERRENTS, not enforcement.
     Browser JavaScript cannot guarantee blocking of developer
     tools, screenshots, Alt+Tab, the Android home button,
     the app switcher, or any other OS-level action. These
     guards raise the effort needed, and the real safeguard is
     the violation detection (visibility / blur / fullscreen).

     Listeners are added when an exam opens and removed when it
     closes, so right-click and selection work normally on the
     rest of the LMS.
     ===================================================== */

  var guardsOn=false;
  var GUARD_EVENTS=['contextmenu','dragstart','copy','cut','paste','selectstart'];

  function guardStop(e){
    var t=e.target;

    if(t&&t.nodeType===3){t=t.parentNode;}

    /* Let students select their own text inside an essay answer box. */
    if(e.type==='selectstart'&&t&&t.closest&&t.closest('textarea')){
      return;
    }

    e.preventDefault();
  }

  function guardKey(e){
    var k=(e.key||'').toLowerCase();
    var c=e.ctrlKey||e.metaKey;
    var blocked=false;

    if(e.key==='F12'){
      blocked=true;                                   /* dev tools */
    }else if(c&&k.length===1){
      if(e.shiftKey||e.altKey){
        blocked='ijc'.indexOf(k)>-1;                  /* Ctrl+Shift+I / J / C */
      }else{
        blocked='cvxau'.indexOf(k)>-1;                /* copy, paste, cut, select all, view source */
      }
    }

    if(blocked){
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function guardsEnable(){
    if(guardsOn){return;}

    guardsOn=true;

    GUARD_EVENTS.forEach(function(t){
      document.addEventListener(t,guardStop);
    });

    document.addEventListener('keydown',guardKey,true);
  }

  function guardsDisable(){
    if(!guardsOn){return;}

    guardsOn=false;

    GUARD_EVENTS.forEach(function(t){
      document.removeEventListener(t,guardStop);
    });

    document.removeEventListener('keydown',guardKey,true);
  }

  /* =====================================================
     FULLSCREEN EXAM + ANTI-CHEAT
     ===================================================== */

  var X=null;

  /* Fullscreen is enforced only if the teacher turned it on AND the
     browser supports the Fullscreen API. Otherwise the exam falls back
     to the normal full-viewport exam layout (still monitored). */
  function fsRequired(){
    return !!(X&&X.cfg.fs&&fsSupported());
  }

  /* This tab lost the lock to another tab: stop it from continuing. */
  function lostLock(){
    clearInterval(hb);
    hb=null;

    if(!X||X.done){
      return;
    }

    X.leaving=true;          /* no anti-cheat violation for this */
    clearInterval(X.timer);

    modal({
      tone:'warn',
      icon:'\u26A0',
      title:'EXAM OPEN IN ANOTHER TAB',
      lines:[
        'This '+examWord()+' is already active in another tab or window.',
        'This tab can no longer be used to continue it.'
      ],
      btns:[
        ['LEAVE THIS TAB','dupexit','solid']
      ]
    });
  }

  function save(){
    if(X){
      lsSet(skey(X.a.id),X.s);
    }
  }

  /* No time limit (time = 0) never runs out. */
  function remaining(){
    if(!X.a.time){return Infinity;}

    return X.s.examStartTime+X.a.time*60000-Date.now();
  }

  function fmt(ms){
    ms=Math.max(0,Math.ceil(ms/1000));

    var m=Math.floor(ms/60);
    var s=ms%60;

    return m+':'+(s<10?'0':'')+s;
  }

  function answeredCount(){
    return Object.keys(X.s.examAnswers).length;
  }

  function examWord(){
    return X.a.type==='exam'?'examination':'quiz';
  }

  function buildShell(a){
    var d=document.createElement('div');

    d.className='xm';
    d.id='xm';

    d.innerHTML=
      '<header class="xmh">'+
        '<div class="xmt">'+
          '<small>'+TYPES[a.type]+'</small>'+
          '<b>'+esc(a.title)+'</b>'+
          '<span>'+esc(a.course)+'</span>'+
        '</div>'+
        '<div class="xmr">'+
          '<span class="xmac" id="xmac"></span>'+
          '<span class="xmtm" id="xmtmw">TIME<b id="xmtm">--:--</b></span>'+
          '<button class="btn sm" id="xmexit" data-x="exit" aria-label="Exit '+TYPES[a.type]+'">Exit<span class="xmlong"> '+TYPES[a.type]+'</span></button>'+
        '</div>'+
      '</header>'+

      '<div class="xmnote" id="xmnote" hidden></div>'+

      '<main class="xmb" id="xmbody"></main>'+

      '<div class="xmmod" id="xmmod" hidden></div>';

    document.body.appendChild(d);

    document.body.classList.add('xm-lock');

    d.addEventListener('click',onXClick);
    d.addEventListener('change',onXChange);
    d.addEventListener('input',onXInput);

    createAssessmentWatermark(a);

    guardsEnable();
  }

  function updateChip(){
    var c=$('xmac');

    if(!c||!X){
      return;
    }

    if(!X.cfg.on){
      c.hidden=true;
      return;
    }

    var n=X.s.antiCheatViolationCount;

    c.className='xmac'+(n>0?' warn':'');

    c.innerHTML=
      '<span>\u26A0 Anti-Cheat Active</span>'+
      '<em>Violations: <b>'+n+'/'+X.cfg.max+'</b></em>';
  }

  function updateFsNote(){
    var n=$('xmnote');

    if(!n){
      return;
    }

    var hide=!X||X.done||fsEl()||!X.cfg.fs;

    n.hidden=!!hide;

    if(!hide){
      n.textContent=
        fsSupported()
        ?'Fullscreen is not active. Use the button when prompted, or your browser\u2019s fullscreen control.'
        :'Fullscreen is not supported in this browser. Please stay on this page; tab switching and window focus loss are still monitored.';
    }
  }

  /* ---------- MODAL ---------- */
  function modal(o){
    var m=$('xmmod');

    if(!m){
      return;
    }

    m.innerHTML=
      '<div class="xmcard" role="alertdialog" aria-modal="true">'+

        '<div class="xmi '+(o.tone||'')+'">'+o.icon+'</div>'+

        '<h3>'+o.title+'</h3>'+

        (o.lines||[]).map(function(p){
          return '<p>'+p+'</p>';
        }).join('')+

        (o.detail?'<span class="xmdet">'+o.detail+'</span>':'')+

        (o.count?'<span class="xmv">'+o.count+'</span>':'')+

        '<div class="xmbt">'+
          o.btns.map(function(b){
            return(
              '<button class="btn'+(b[2]?' '+b[2]:'')+'" data-x="'+b[1]+'">'+
                b[0]+
              '</button>'
            );
          }).join('')+
        '</div>'+

      '</div>';

    m.hidden=false;

    var f=m.querySelector('button.solid')||m.querySelector('button');

    if(f){
      f.focus();
    }
  }

  function closeModal(){
    var m=$('xmmod');

    if(m){
      m.hidden=true;
      m.innerHTML='';
    }
  }

  function modalOpen(){
    var m=$('xmmod');

    return !!(m&&!m.hidden);
  }

  /* ---------- WARNINGS ---------- */
  function showFsRequired(){
    if(!X||X.done||X.leaving){return;}

    modal({
      tone:'warn',
      icon:'\u26A0',
      title:'FULLSCREEN REQUIRED',
      lines:['Please return to fullscreen mode to continue the examination.'],
      count:X.cfg.on?'Violations: '+X.s.antiCheatViolationCount+' / '+X.cfg.max:'',
      btns:[['RETURN TO FULLSCREEN','fs','solid']]
    });
  }

  function showWarning(type){
    if(type==='EXIT_FULLSCREEN'){
      showFsRequired();
      return;
    }

    var n=X.s.antiCheatViolationCount;

    modal({
      tone:'warn',
      icon:'\u26A0',
      title:'ANTI-CHEAT WARNING',
      lines:[
        'You left the exam screen.',
        'This action has been recorded as a violation.',
        'Your exam will be restricted if the maximum violation limit is reached.'
      ],
      count:'Violations: '+n+' / '+X.cfg.max,
      btns:[[
        (fsRequired()&&!fsEl())?'RETURN TO FULLSCREEN':'RETURN TO EXAM',
        'fs',
        'solid'
      ]]
    });
  }

  function returnFS(btn){
    if(fsEl()||!fsSupported()||!X||!X.cfg.fs){
      closeModal();
      return;
    }

    reqFS().then(
      closeModal,
      function(){
        var c=btn.closest('.xmcard');

        if(c&&!c.querySelector('.xmhint')){
          var p=document.createElement('p');

          p.className='xmhint';

          p.textContent='Your browser did not enter fullscreen. Tap the button again, or use your browser\u2019s fullscreen control.';

          c.insertBefore(p,c.querySelector('.xmbt'));
        }
        /* Fullscreen is required, so the exam does not continue without it. */
      }
    );
  }

  /* ---------- VIOLATION ----------
     Returns true only when a NEW violation was actually recorded. */
  function violation(type){
    if(!X||X.done||X.leaving||!X.cfg.on){
      return false;
    }

    var now=Date.now();

    /* Debounce: one incident often fires visibilitychange, blur and
       fullscreenchange together. Count it once. */
    if(now-X.last<VIOLATION_COOLDOWN){
      return false;
    }

    X.last=now;

    var s=X.s;

    s.antiCheatViolationCount++;

    s.antiCheatLogs.push({
      type:type,
      timestamp:new Date().toISOString(),
      question:s.currentQuestion+1
    });

    save();

    histUpsert(X.a,s,{
      violation_count:s.antiCheatViolationCount,
      violation_log:s.antiCheatLogs
    });

    updateChip();

    /* Limit reached: restrict and auto-submit (if the teacher enabled it). */
    if(X.cfg.auto&&s.antiCheatViolationCount>=X.cfg.max){
      submitExam('violations');
      return true;
    }

    showWarning(type);

    return true;
  }

  document.addEventListener('visibilitychange',function(){
    if(document.hidden){
      violation('TAB_SWITCH');
    }
  });

  window.addEventListener('blur',function(){
    setTimeout(function(){
      if(!X||X.done||X.leaving){
        return;
      }

      if(document.hidden){
        violation('TAB_SWITCH');
      }else if(!document.hasFocus()){
        violation('WINDOW_BLUR');
      }
    },150);
  });

  window.addEventListener('focus',updateFsNote);

  function onFS(){
    updateFsNote();

    if(!X||X.done||X.leaving){
      return;
    }

    if(!fsEl()&&fsRequired()){
      violation('EXIT_FULLSCREEN');

      /* Violation may have been de-duplicated or anti-cheat may be off:
         fullscreen is still required, so make sure the prompt is visible. */
      if(X&&!X.done&&!fsEl()&&!modalOpen()){
        showFsRequired();
      }
    }
  }

  document.addEventListener('fullscreenchange',onFS);
  document.addEventListener('webkitfullscreenchange',onFS);

  /* ---------- EXAM RENDERING ---------- */
  function render(){
    if(!X){
      return;
    }

    var b=$('xmbody');

    if(!b){
      return;
    }

    b.innerHTML=questionHTML();

    b.scrollTop=0;
  }

  /* Navigation is Previous / Next only. On the last question, Next becomes
     Submit so the student can still finish. There is no question overview. */
  function questionHTML(){
    var s=X.s;
    var i=s.currentQuestion;
    var n=X.qs.length;
    var q=X.qs[i];
    var sel=s.examAnswers[i];
    var body;

    if(q.t==='es'){
      body=
        '<textarea name="xe" rows="8" placeholder="Type your answer here" '+
        'style="width:100%;min-height:180px;padding:12px;border:1px solid #cfd5dd;border-radius:10px;font:inherit;box-sizing:border-box;resize:vertical">'+
        esc(typeof sel==='string'?sel:'')+
        '</textarea>';
    }else{
      body=
        '<div class="xmopts">'+
        q.o.map(function(t,j){
          return(
            '<label class="xmo'+(sel===j?' on':'')+'">'+
              '<input type="radio" name="xq" value="'+j+'"'+(sel===j?' checked':'')+'>'+
              '<span class="xmk">'+'ABCD'.charAt(j)+'</span>'+
              '<span>'+esc(t)+'</span>'+
            '</label>'
          );
        }).join('')+
        '</div>';
    }

    return(
      '<div class="card xmq">'+

        '<div class="xmqh">'+
          '<b>Question '+(i+1)+' of '+n+(q.t==='es'?' \u00B7 Essay':'')+'</b>'+
          '<span id="xmans">Answered '+answeredCount()+' / '+n+'</span>'+
        '</div>'+

        '<div class="xmbar"><i style="width:'+Math.round((i+1)/n*100)+'%"></i></div>'+

        '<h3>'+esc(q.q)+'</h3>'+

        body+

        '<div class="xmnav">'+
          '<button class="btn" data-x="prev"'+(i===0?' disabled':'')+'>Previous</button>'+
          (i===n-1
            ?'<button class="btn solid" data-x="submit">Submit</button>'
            :'<button class="btn solid" data-x="next">Next</button>')+
        '</div>'+

      '</div>'
    );
  }

  function tick(){
    if(!X||X.done){
      return;
    }

    var r=remaining();

    var el=$('xmtm');

    if(el){
      el.textContent=isFinite(r)?fmt(r):'No limit';

      el.parentNode.classList.toggle('low',r<300000);
    }

    if(r<=0){
      submitExam('time');
    }
  }

  /* ---------- EXAM INPUT ---------- */
  function onXChange(e){
    var t=e.target;

    if(!X||X.done||!t||t.name!=='xq'){
      return;
    }

    X.s.examAnswers[X.s.currentQuestion]=+t.value;

    save();

    Array.prototype.forEach.call(
      document.querySelectorAll('#xm .xmo'),
      function(l){
        l.classList.toggle('on',l.querySelector('input').checked);
      }
    );

    var c=$('xmans');

    if(c){
      c.textContent='Answered '+answeredCount()+' / '+X.qs.length;
    }
  }

  /* Essay answers: saved as the student types. */
  function onXInput(e){
    var t=e.target;

    if(!X||X.done||!t||t.name!=='xe'){
      return;
    }

    var i=X.s.currentQuestion;

    if(t.value.trim()){
      X.s.examAnswers[i]=t.value;
    }else{
      delete X.s.examAnswers[i];
    }

    save();

    var c=$('xmans');

    if(c){
      c.textContent='Answered '+answeredCount()+' / '+X.qs.length;
    }
  }

  /* ---------- EXAM BUTTON EVENTS ---------- */
  function onXClick(e){
    var b=e.target.closest('[data-x]');

    if(!b||!X){
      return;
    }

    var a=b.getAttribute('data-x');
    var s=X.s;

    if(a==='fs'){
      returnFS(b);
      return;
    }

    if(a==='close'){
      closeModal();
      return;
    }

    if(a==='finish'){
      teardown();
      closeActivity();
      return;
    }

    if(a==='dupexit'){
      teardown();
      closeActivity();
      return;
    }

    if(X.done){
      return;
    }

    if(a==='prev'&&s.currentQuestion>0){
      s.currentQuestion--;
      save();
      render();
    }

    else if(a==='next'&&s.currentQuestion<X.qs.length-1){
      s.currentQuestion++;
      save();
      render();
    }

    else if(a==='submit'){
      var left=X.qs.length-answeredCount();

      modal({
        icon:'?',
        title:'Submit '+TYPES[X.a.type]+'?',
        lines:[
          left
            ?'You have '+left+' unanswered question'+(left>1?'s':'')+'. They will be marked incorrect.'
            :'You have answered every question.',
          'Once submitted, you cannot change your answers.'
        ],
        btns:[
          ['Cancel','close'],
          ['Submit','confirmsubmit','solid']
        ]
      });
    }

    else if(a==='confirmsubmit'){
      submitExam('manual');
    }

    else if(a==='exit'){
      modal({
        icon:'?',
        title:'Exit '+(X.a.type==='exam'?'Examination':'Quiz')+'?',
        lines:[
          'Your current answers will be saved.',
          'Are you sure you want to leave?'
        ],
        detail:X.a.time?'The timer keeps running while you are away.':'',
        btns:[
          ['Cancel','close'],
          ['Exit '+TYPES[X.a.type],'confirmexit','solid']
        ]
      });
    }

    else if(a==='confirmexit'){
      exitExam();
    }
  }

  /* =====================================================
     SUBMIT / RESULT
     ===================================================== */

  function submitExam(reason){
    if(!X||X.done){
      return;
    }

    X.done=true;               /* locks answer changes (onXChange checks X.done) */

    clearInterval(X.timer);    /* stop the timer */

    var s=X.s;
    var earned=0;              /* points earned on multiple-choice questions */
    var mcTotal=0;             /* points available on multiple-choice questions */
    var allPts=0;              /* points of every question, essays included */
    var essayN=0;
    var essays=[];

    /* Copy of the student's answers, saved in the attempt history ONLY so the
       teacher can review and grade. It is never shown to the student. */
    var answersCopy=Object.assign({},s.examAnswers);

    /* Answers are used here, in memory, to calculate the score.
       Essays are not scored: the answer text is kept for the teacher. */
    X.qs.forEach(function(q,i){
      allPts+=q.p;

      if(q.t==='es'){
        essayN++;

        essays.push({
          question:i+1,
          text:q.q,
          answer:typeof s.examAnswers[i]==='string'?s.examAnswers[i]:''
        });
      }else{
        mcTotal+=q.p;

        if(s.examAnswers[i]===q.a){
          earned+=q.p;
        }
      }
    });

    var pct=mcTotal?Math.round(earned/mcTotal*100):null;

    /* A restricted attempt can NEVER become PASSED, whatever the score.
       PENDING = only essay questions, waiting for the teacher to grade. */
    var restricted=(reason==='violations');
    var status=restricted
      ?'RESTRICTED'
      :(pct==null?'PENDING':(pct>=PASSING_PERCENT?'PASSED':'FAILED'));
    var nowIso=new Date().toISOString();

    s.submitted=true;
    s.examAnswers={};          /* the student's selected answers are not kept on the student's own state */

    s.result={
      correct:earned,
      total:mcTotal,
      percentage:pct,
      status:status,
      points:Math.round(earned/allPts*X.a.points*10)/10,
      reason:reason,
      submittedAt:nowIso,
      essayPending:essayN
    };

    save();                    /* persists status, score, %, timestamp */

    /* Update THIS attempt in the history. Earlier attempts are untouched. */
    histUpsert(X.a,s,{
      score:earned,
      total:mcTotal,
      mc_score:earned,         /* multiple-choice points, used by the teacher grading screen */
      percentage:pct,
      status:status,
      violation_count:s.antiCheatViolationCount,
      violation_reason:restricted
        ?'Anti-cheat violation limit reached'
        :(reason==='time'?'Time expired':null),
      violation_log:s.antiCheatLogs,
      essay_answers:essays,
      essay_pending:essayN,
      answers:answersCopy,     /* only the teacher page reads this */
      submitted_at:nowIso
    });

    lsDel(ACTIVE_KEY);
    releaseLock();             /* release the single-session lock */

    X.a.status=restricted?'Restricted':'Completed';

    closeModal();

    exitFS();

    showResult();
  }

  function showResult(){
    var s=X.s;
    var a=X.a;
    var n=examWord();
    var p=resultParts(s.result);
    var word=a.type==='exam'?'EXAM':'QUIZ';

    var title;
    var msg;

    if(s.result.status==='RESTRICTED'){
      title=word+' RESTRICTED';

      msg='<b>Reason:</b><br>Maximum anti-cheat violations reached.';
    }else if(s.result.reason==='time'){
      title='TIME IS UP';

      msg='Your '+n+' was automatically submitted when the time limit ended.';
    }else{
      title=word+' SUBMITTED';

      msg='Your answers have been recorded.';
    }

    var good=s.result.status==='PASSED'||s.result.status==='PENDING';

    /* Summary only: title, score, percentage, status, submission time.
       No answers, answer key, per-question results or explanations. */
    $('xmbody').innerHTML=
      '<div class="card res">'+

        '<div class="tk'+(good?'':' bad')+'"><svg class="i"><use href="#tick"/></svg></div>'+

        '<h2>'+title+'</h2>'+

        '<p><b>'+esc(a.title)+'</b></p>'+

        '<p>'+msg+'</p>'+

        p.tiles+

        '<p>Submitted: '+p.when+'</p>'+

        p.note+

        '<div class="row">'+
          '<button class="btn solid" data-x="finish">RETURN TO ACTIVITIES</button>'+
        '</div>'+

      '</div>';

    var t=$('xmtmw');
    if(t){t.hidden=true;}

    var x=$('xmexit');
    if(x){x.hidden=true;}

    var ac=$('xmac');
    if(ac){ac.hidden=true;}

    updateFsNote();
  }

  /* =====================================================
     LEAVING EXAM
     ===================================================== */

  function teardown(){
    releaseLock();

    if(X){
      X.leaving=true;

      clearInterval(X.timer);
    }

    exitFS();

    guardsDisable();          /* restore normal right-click / selection / shortcuts */

    var d=$('xm');

    if(d){
      d.remove();
    }

    document.body.classList.remove('xm-lock');

    removeAssessmentWatermark();

    X=null;
  }

  function exitExam(){
    /* Intentional exit does not count as an anti-cheat violation. */
    save();

    lsDel(ACTIVE_KEY);

    releaseLock();

    teardown();

    closeActivity();
  }

  /* =====================================================
     START / RESUME EXAM
     ===================================================== */

  function startExam(a,resume){
    var s=lsGet(skey(a.id));

    /* Completed = permanently completed. Never reopen the questions.
       A retake first replaces the stored state with a NEW attempt (see
       the "retake" action), so this guard still protects everything else. */
    if(s&&s.submitted){
      note('This '+TYPES[a.type].toLowerCase()+' has already been submitted.','warn');

      return;
    }

    var bank=bankFor(a.id);

    if(!bank.length){
      note(
        'No questions have been added to this '+TYPES[a.type].toLowerCase()+' yet.',
        'warn'
      );

      return;
    }

    /* One active session: refuse if another tab/window holds the lock. */
    if(!acquireLock(a.id)){
      note(
        'This '+TYPES[a.type].toLowerCase()+
        ' is already open in another tab or window. Close it there first.',
        'warn'
      );

      return;
    }

    var cfg=cfgFor(a.id);

    /* Request fullscreen directly from the user's click (Start / Take Retake).
       If unsupported or refused, the exam still works in the full-viewport layout. */
    if(!resume&&cfg.fs&&fsSupported()){
      reqFS().then(updateFsNote,function(){
        updateFsNote();

        if(X&&!X.done&&fsRequired()&&!fsEl()){
          showFsRequired();
        }
      });
    }

    if(!s){
      s=newState();
    }

    X={
      a:a,
      qs:bank,
      s:s,
      cfg:cfg,
      last:Date.now(),
      done:false,
      leaving:false,
      timer:null
    };

    lsSet(ACTIVE_KEY,a.id);

    a.status='In Progress';

    save();

    histUpsert(a,s,{});        /* creates the attempt record if it does not exist yet */

    buildShell(a);

    updateChip();

    if(remaining()<=0){
      submitExam('time');
      return;
    }

    render();

    tick();

    X.timer=setInterval(tick,1000);

    if(resume){
      updateFsNote();

      modal({
        tone:'',
        icon:'\u2139',
        title:'EXAMINATION RESTORED',
        lines:[
          'Your answers, timer and anti-cheat record were restored.',
          fsRequired()?'Return to fullscreen to continue.':'Continue when you are ready.'
        ],
        count:cfg.on?'Violations: '+s.antiCheatViolationCount+' of '+cfg.max:'',
        btns:[
          [
            fsRequired()?'RETURN TO FULLSCREEN':'CONTINUE EXAM',
            'fs',
            'solid'
          ]
        ]
      });
    }
  }

  /* =====================================================
     RETAKE (teacher-approved only)
     ===================================================== */

  function startRetake(){
    if(!current){return;}

    var ap=lsGet(rkey(current.id));
    var old=lsGet(skey(current.id));

    /* Only a teacher approval + a RESTRICTED latest attempt allows this. */
    if(!ap||!old||!retakeOK(current.id)){
      note('A retake has not been approved by your teacher.','warn');
      return;
    }

    var ns=newState();                          /* fresh timer, 0 violations, no answers */

    ns.attemptNumber=(old.attemptNumber||1)+1;
    ns.isRetake=true;
    ns.approvedBy=ap.by||null;
    ns.approvedAt=ap.at||null;

    lsSet(skey(current.id),ns);                 /* previous attempt stays in bshm.hist.<id> */
    lsDel(rkey(current.id));                    /* approval is single-use */

    startExam(current,false);
  }

  /* =====================================================
     LIVE SESSION
     ===================================================== */

  function startSession(){
    if(!current||SESSION_TYPES.indexOf(current.type)<0){
      return;
    }

    if(current.type==='quiz'||current.type==='exam'){
      startExam(current,false);
      return;
    }

    var a=current;

    var body=
      section('Objective','<p>'+a.objective+'</p>')+
      section('Requirements',list(a.requirements))+
      section('Information',info([
        ['Course',a.course],
        ['Due Date',a.due.replace('Due ','')],
        ['Points',a.points]
      ]));

    $('view-session').innerHTML=
      '<a class="back" href="#" data-act="leave">\u2190 Exit '+TYPES[a.type]+'</a>'+

      '<div class="ov one">'+
        '<div class="card ovc">'+
          head(a)+
          body+
          '<div>'+
            '<button class="btn" data-act="leave">Exit '+TYPES[a.type]+'</button>'+
          '</div>'+
        '</div>'+
      '</div>';

    show('session');

    createAssessmentWatermark(a);
  }

  function leaveSession(){
    removeAssessmentWatermark();

    closeActivity();
  }

  /* =====================================================
     POS TRAINING
     ===================================================== */

  function launchTraining(){
    if(!isPOS(current)){
      return;
    }

    location.href='pos-training.html?activity='+encodeURIComponent(current.id);
  }

  /* =====================================================
     EVENTS
     ===================================================== */

  /* Activity tabs */
  $('tabs').addEventListener('click',function(e){
    var b=e.target.closest('button');

    if(!b){
      return;
    }

    tab=b.getAttribute('data-t');

    renderActivities();
  });

  /* Activity cards */
  $('grid').addEventListener('click',function(e){
    var b=e.target.closest('[data-open]');

    if(b){
      openActivity(b.getAttribute('data-open'));
    }
  });

  /* "Show all courses" button in the course banner */
  $('view-list').addEventListener('click',function(e){
    var b=e.target.closest('[data-act="showall"]');

    if(!b){
      return;
    }

    courseFilter='';

    try{
      history.replaceState(null,'','activities.html');
    }catch(err){}

    renderActivities();
  });

  /* Search */
  var searchInput=$('q');

  if(searchInput){
    searchInput.addEventListener('input',function(){
      query=this.value;

      renderActivities();
    });
  }

  /* Status filter */
  var statusSelect=$('st');

  if(statusSelect){
    statusSelect.addEventListener('change',function(){
      stat=this.value;

      renderActivities();
    });
  }

  /* Overview / session actions */
  document.querySelector('main').addEventListener('click',function(e){
    var b=e.target.closest('[data-act]');

    if(!b){
      return;
    }

    var a=b.getAttribute('data-act');

    if(a==='showall'){
      return;                   /* handled by the list-view listener above */
    }

    e.preventDefault();

    if(a==='close'){
      closeActivity();
    }

    else if(a==='start'){
      launchTraining();
    }

    else if(a==='begin'){
      startSession();
    }

    else if(a==='retake'){
      startRetake();
    }

    else if(a==='leave'){
      leaveSession();
    }

    else if(a==='mock'){
      note(
        (b.getAttribute('data-label')||'This activity')+
        ' is a preview for now. It will open from the course page later.'
      );
    }
  });

  /* If the teacher publishes an activity, approves a retake or saves a grade
     in another tab, refresh the list (only while the student is on the list view). */
  window.addEventListener('storage',function(e){
    if(!e.key||e.key.indexOf('bshm.')!==0||X){return;}

    var listView=$('view-list');

    if(listView&&!listView.hidden){
      closeActivity();
    }
  });

  /* =====================================================
     OTHER URL PARAMETERS (qs was read at the top)
     ===================================================== */

  var qd=qs.get('done');

  if(qd){
    var dx=posActivities.filter(function(a){
      return a.id===qd;
    })[0];

    if(dx){
      dx.status='Completed';
    }
  }

  var qt=qs.get('tab');

  qt=TAB_ALIAS[qt]||qt;

  if(qt&&TABS.some(function(t){return t[0]===qt;})){
    tab=qt;
  }

  /* =====================================================
     INITIAL RENDER
     ===================================================== */

  renderActivities();

  /* =====================================================
     RESTORE EXAM AFTER PAGE REFRESH
     ===================================================== */

  var activeId=lsGet(ACTIVE_KEY);

  var restored=false;

  if(activeId){
    var ra=all().filter(function(a){
      return a.id===activeId;
    })[0];

    var rs=ra&&lsGet(skey(ra.id));

    if(ra&&rs&&!rs.submitted){
      current=ra;

      startExam(ra,true);

      restored=!!X;
    }else{
      lsDel(ACTIVE_KEY);
    }
  }

  if(!restored){
    var qo=qs.get('open');

    if(qo&&all().some(function(a){return a.id===qo;})){
      openActivity(qo);
    }
  }

})();