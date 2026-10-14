(function(){
  var $=function(i){return document.getElementById(i)};

  /* ---------- config ---------- */
  var TEACHER_KEY='bshm.materials';   /* same key used by the teacher Learning Materials page */
  var USE_MOCK=true;                  /* set to false to hide the sample resources and show only teacher uploads */

  /* ---------- static data ---------- */
  var CATS=[
    {k:'all',l:'All Resources'},{k:'lecture',l:'Lecture Notes'},{k:'reading',l:'Reading Materials'},
    {k:'template',l:'Templates'},{k:'link',l:'External Links'},{k:'other',l:'Others'}];
  var BADGE={lecture:'Lecture Notes',reading:'Reading Material',template:'Template',link:'External Link',other:'Other'};
  var CFULL={lecture:'Lecture Notes',reading:'Reading Materials',template:'Templates',link:'External Links',other:'Others'};
  var TYPE={pdf:'PDF Document',docx:'Word Document',pptx:'PowerPoint Presentation',xlsx:'Excel Spreadsheet',link:'External Link',video:'Video',module:'Module (PDF / ZIP)'};
  var SEM={'1':'1st Semester','2':'2nd Semester'};

  /* c = category, type = file type, sem = semester, act = primary action (download | view | link) */
  var MOCK=[
   {id:'r1',t:'Food and Beverage Service Procedures',c:'lecture',type:'pdf',date:'Apr 28, 2025',size:'2.5 MB',sem:'2',act:'download',desc:'Detailed lecture notes on food and beverage service procedures, including mise en place, service sequence, and guest interaction.'},
   {id:'r2',t:'Tourism Marketing Plan Template',c:'template',type:'docx',date:'Apr 25, 2025',size:'1.2 MB',sem:'2',act:'download',desc:'Template for creating a tourism marketing plan. Includes market analysis, strategies, and expected impact.'},
   {id:'r3',t:'Housekeeping Operations Presentation',c:'reading',type:'pptx',date:'Apr 20, 2025',size:'4.8 MB',sem:'2',act:'view',desc:'Slides covering the fundamentals of housekeeping operations, room types, and cleaning procedures.'},
   {id:'r4',t:'Hotel Management Association (AHLA)',c:'link',type:'link',url:'https://www.ahla.com',sem:'2',act:'link',desc:'Official website of the American Hotel & Lodging Association. Provides industry news, career opportunities, and learning resources.'},
   {id:'r5',t:'Beverage Service Menu Guide',c:'reading',type:'pdf',date:'Apr 18, 2025',size:'3.1 MB',sem:'2',act:'download',desc:'A guide to common beverage types, preparation methods, and service standards.'},
   {id:'r6',t:'OJT Logbook Template',c:'template',type:'xlsx',date:'Apr 15, 2025',size:'0.8 MB',sem:'2',act:'download',desc:"Logbook template for your On-the-Job Training (OJT). Include daily activities, skills learned, and supervisor's remarks."},
   {id:'r7',t:'Front Office Reservation Procedures',c:'lecture',type:'pdf',date:'Apr 10, 2025',size:'1.9 MB',sem:'2',act:'download',desc:'Lecture notes on taking, confirming, and modifying guest reservations in the front office.'},
   {id:'r8',t:'Tourism Management: Destination Planning',c:'lecture',type:'pdf',date:'Apr 3, 2025',size:'2.2 MB',sem:'2',act:'download',desc:'Notes on destination planning, tourism stakeholders, and visitor management.'},
   {id:'r9',t:'Housekeeping Cleaning Procedures',c:'lecture',type:'pdf',date:'Mar 27, 2025',size:'1.6 MB',sem:'2',act:'download',desc:'Step-by-step cleaning procedures for guest rooms and public areas.'},
   {id:'r10',t:'Tourism and Hospitality Law: Key Provisions',c:'lecture',type:'pdf',date:'Mar 20, 2025',size:'2.0 MB',sem:'2',act:'download',desc:'Summary of key legal provisions that affect tourism and hospitality operations.'},
   {id:'r11',t:'Beverage Service Techniques',c:'lecture',type:'pdf',date:'Nov 14, 2024',size:'1.4 MB',sem:'1',act:'download',desc:'Lecture notes on pouring, serving, and presenting beverages to guests.'},
   {id:'r12',t:'Guest Relations and Communication',c:'lecture',type:'pdf',date:'Oct 29, 2024',size:'1.1 MB',sem:'1',act:'download',desc:'Notes on professional communication, handling requests, and resolving guest complaints.'},
   {id:'r13',t:'Kitchen Safety and Sanitation Basics',c:'lecture',type:'pdf',date:'Sep 17, 2024',size:'1.8 MB',sem:'1',act:'download',desc:'Introductory notes on kitchen safety rules and basic sanitation practices.'},
   {id:'r14',t:'Introduction to the Hospitality Industry',c:'reading',type:'pdf',date:'Mar 12, 2025',size:'5.2 MB',sem:'2',act:'download',desc:'Reading material on the structure of the hospitality industry and its career paths.'},
   {id:'r15',t:'Sustainable Tourism Practices',c:'reading',type:'pdf',date:'Feb 26, 2025',size:'3.4 MB',sem:'2',act:'download',desc:'Overview of sustainable practices for hotels, restaurants, and tourism destinations.'},
   {id:'r16',t:'Front Desk Etiquette Handbook',c:'reading',type:'pdf',date:'Nov 5, 2024',size:'2.7 MB',sem:'1',act:'download',desc:'Handbook on greeting guests, check-in etiquette, and professional conduct at the front desk.'},
   {id:'r17',t:'Events Management Overview',c:'reading',type:'pptx',date:'Oct 8, 2024',size:'6.3 MB',sem:'1',act:'view',desc:'Slides introducing event planning, budgeting, and logistics.'},
   {id:'r18',t:'Research Paper Format Template',c:'template',type:'docx',date:'Feb 14, 2025',size:'0.6 MB',sem:'2',act:'download',desc:'Formatting template for research papers, including title page, headings, and references.'},
   {id:'r19',t:'UN Tourism (World Tourism Organization)',c:'link',type:'link',url:'https://www.unwto.org',sem:'2',act:'link',desc:'Official website of the United Nations specialized agency for tourism. Reports, statistics, and guidance on global tourism.'},
   {id:'r20',t:'Department of Tourism (Philippines)',c:'link',type:'link',url:'https://tourism.gov.ph',sem:'2',act:'link',desc:'Official website of the Philippine Department of Tourism. Programs, advisories, and industry information.'},
   {id:'r21',t:'Hospitality Net',c:'link',type:'link',url:'https://www.hospitalitynet.org',sem:'1',act:'link',desc:'Industry news and articles covering hotels, hospitality operations, and careers.'},
   {id:'r22',t:'Student Code of Conduct Summary',c:'other',type:'pdf',date:'Aug 26, 2024',size:'0.9 MB',sem:'1',act:'download',desc:'A short summary of student rules, responsibilities, and expected conduct.'},
   {id:'r23',t:'Library Access Guide',c:'other',type:'pdf',date:'Aug 30, 2024',size:'0.7 MB',sem:'1',act:'download',desc:'How to borrow books and access library services and online references.'},
   {id:'r24',t:'Academic Calendar SY 2025–2026',c:'other',type:'pdf',date:'Apr 22, 2025',size:'0.5 MB',sem:'2',act:'download',desc:'Important dates for the upcoming school year, including enrollment and examination periods.'}];

  /* Popular Resources (static): id of the resource + the stats line shown in the card */
  var POP=[
   {id:'r1',m:'2.5 MB · 1.2k downloads'},
   {id:'r2',m:'1.2 MB · 980 downloads'},
   {id:'r3',m:'4.8 MB · 856 downloads'},
   {id:'r6',m:'0.8 MB · 732 downloads'},
   {id:'r4',m:'External Link · 620 clicks'}];

  /* ---------- teacher materials -> student resources ---------- */
  var R=[],BY={};

  function bytes(n){return n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB'}
  function dstr(s){var d=new Date(s+'T00:00');return isNaN(d)?(s||''):d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
  function okUrl(u){return /^https?:\/\//i.test(u||'')}

  /* teacher type -> student type. ck = which existing colour class to reuse, lbl = badge text */
  var MAP={
    pdf:{type:'pdf',ck:'pdf',act:'download'},
    ppt:{type:'pptx',ck:'pptx',act:'view'},
    doc:{type:'docx',ck:'docx',act:'download'},
    video:{type:'video',ck:'pptx',lbl:'VIDEO',act:'download'},
    module:{type:'module',ck:'pdf',lbl:'MOD',act:'download'},
    link:{type:'link',ck:'link',act:'link'}
  };
  /* used only when the teacher did not pick a category */
  var AUTOCAT={pdf:'lecture',ppt:'lecture',doc:'lecture',video:'reading',module:'reading',link:'link'};

  function readTeacher(){
    var raw;
    try{raw=JSON.parse(localStorage.getItem(TEACHER_KEY)||'[]')}catch(e){raw=[]}
    if(!Array.isArray(raw))return [];
    return raw.filter(function(m){return m&&m.vis==='pub'&&MAP[m.type]})
      .sort(function(a,b){return b.id-a.id})
      .map(function(m){
        var mp=MAP[m.type],isLink=m.type==='link';
        var mo=m.added?+m.added.slice(5,7):new Date().getMonth()+1;
        var r={
          id:'t'+m.id,t:m.title||'Untitled',
          c:isLink?'link':(CFULL[m.cat]?m.cat:AUTOCAT[m.type]),
          type:mp.type,ck:mp.ck,lbl:mp.lbl,act:mp.act,
          sem:(mo>=7&&mo<=12)?'1':'2',
          desc:m.desc||'',course:(m.course||'').split(' · ')[0],topic:m.topic||'',
          teacher:true
        };
        if(isLink){
          if(!okUrl(m.url))return null;
          r.url=m.url;
        }else{
          r.date=dstr(m.added);r.size=m.size?bytes(m.size):'';
          r.fname=m.fname;r.data=m.data||null;r.big=!!m.big;
          /* only accept real data URLs */
          if(r.data&&r.data.indexOf('data:')!==0)r.data=null;
        }
        return r;
      }).filter(Boolean);
  }

  function rebuild(){
    R=readTeacher().concat(USE_MOCK?MOCK:[]);
    BY={};
    R.forEach(function(r){
      BY[r.id]=r;
      r.hay=(r.t+' '+r.desc+' '+BADGE[r.c]+' '+CFULL[r.c]+' '+(r.course||'')+' '+(r.topic||'')).toLowerCase();
    });
  }

  var st={c:'all',q:'',s:'all'};

  /* ---------- helpers ---------- */
  function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function ic(n){return '<svg class="i rs-ic"><use href="#'+n+'"/></svg>'}
  function fileName(r){return r.fname||(r.t.replace(/[^\w]+/g,'-').replace(/^-+|-+$/g,'')+'.'+r.type)}
  function fi(r,small){
    var link=r.type==='link';
    return '<span class="rs-fi rs-t-'+(r.ck||r.type)+(small?' rs-fi-s':'')+'">'+ic(link?'link':'file')+(link?'':'<em>'+esc(r.lbl||r.type.toUpperCase())+'</em>')+'</span>';
  }
  function actBtn(r){
    if(r.act==='view')return '<button type="button" class="rs-btn rs-sec" data-a="view">'+ic('eye')+'View</button>';
    if(r.act==='link')return '<button type="button" class="rs-btn rs-sec" data-a="link">'+ic('ext')+'Open Link</button>';
    return '<button type="button" class="rs-btn" data-a="download">'+ic('download')+'Download</button>';
  }
  var tm;
  function toast(title,msg){
    var t=$('rs-toast');t.textContent='';
    var b=document.createElement('b');b.textContent=title;t.appendChild(b);
    if(msg)t.appendChild(document.createTextNode(msg));
    t.classList.add('on');clearTimeout(tm);tm=setTimeout(function(){t.classList.remove('on')},3000);
  }

  /* ---------- render ---------- */
  function card(r){
    var meta=r.type==='link'
      ?'<a class="rs-url" href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+ic('link')+esc(r.url)+'</a>'
      :'<span>'+ic('cal')+esc(r.date)+'</span>'+(r.size?'<span class="rs-sep"></span><span>'+esc(r.size)+'</span>':'');
    if(r.teacher&&(r.course||r.topic)){
      meta+='<span class="rs-sep"></span><span>'+esc([r.course,r.topic].filter(Boolean).join(' · '))+'</span>';
    }
    return '<article class="rs-card" data-id="'+esc(r.id)+'">'+fi(r,false)+
      '<div class="rs-body"><div class="rs-top"><h3>'+esc(r.t)+'</h3><span class="rs-bd rs-b-'+r.c+'">'+BADGE[r.c]+'</span></div>'+
      (r.desc?'<p class="rs-desc">'+esc(r.desc)+'</p>':'')+'<div class="rs-meta">'+meta+'</div></div>'+
      '<div class="rs-act">'+actBtn(r)+'<button type="button" class="rs-dots" data-a="menu" aria-haspopup="menu" aria-expanded="false" aria-label="More actions for '+esc(r.t)+'">'+ic('dots')+'</button></div></article>';
  }
  function bySem(){return R.filter(function(r){return st.s==='all'||r.sem===st.s})}
  function updateTabs(base){
    var n={all:base.length};
    base.forEach(function(r){n[r.c]=(n[r.c]||0)+1});
    [].forEach.call($('rs-tabs').children,function(b){
      b.querySelector('.rs-n').textContent='('+(n[b.getAttribute('data-c')]||0)+')';
    });
  }
  function render(){
    var q=st.q.trim().toLowerCase(),base=bySem();
    var L=base.filter(function(r){return (st.c==='all'||r.c===st.c)&&(!q||r.hay.indexOf(q)>-1)});
    $('rs-list').innerHTML=L.map(card).join('');
    $('rs-empty').hidden=L.length>0;
    $('rs-rc').textContent=L.length?'Showing '+L.length+' of '+base.length+' resources':'';
    updateTabs(base);
  }
  function buildTabs(){
    $('rs-tabs').innerHTML=CATS.map(function(c){
      return '<button type="button" data-c="'+c.k+'" aria-pressed="'+(c.k===st.c)+'"'+(c.k===st.c?' class="on"':'')+'>'+c.l+' <span class="rs-n"></span></button>';
    }).join('');
  }
  function buildPopular(){
    $('rs-pop').innerHTML=POP.filter(function(p){return BY[p.id]}).map(function(p){
      var r=BY[p.id];
      return '<li><button type="button" class="rs-pi" data-id="'+r.id+'">'+fi(r,true)+'<span class="rs-pt"><b>'+esc(r.t)+'</b><small>'+esc(p.m)+'</small></span></button></li>';
    }).join('');
  }

  /* ---------- actions ---------- */
  function download(r){
    if(r.teacher){
      if(r.data){
        var a=document.createElement('a');
        a.href=r.data;a.download=fileName(r);
        document.body.appendChild(a);a.click();document.body.removeChild(a);
        toast('Download started',fileName(r));
      }else{
        toast('File not available','This file was too large to store. Please ask your teacher for a link.');
      }
      return;
    }
    toast('Download started',fileName(r));   /* sample resources only */
  }
  function openLink(r){
    window.open(r.url,'_blank','noopener,noreferrer');
    toast('Opening external link',r.t);
  }
  function copyText(t,ok,fail){
    function fallback(){
      var ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');
      ta.style.cssText='position:fixed;opacity:0;top:0;left:0';document.body.appendChild(ta);ta.select();
      var done=false;try{done=document.execCommand('copy')}catch(x){}
      document.body.removeChild(ta);done?ok():fail();
    }
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,fallback);
    else fallback();
  }
  function copyLink(r){
    var url=r.type==='link'?r.url:'https://lms.acespolytechnic.example/resources/'+r.id;
    copyText(url,function(){toast('Link copied',r.t)},function(){toast('Could not copy link','Please copy it manually.')});
  }

  /* ---------- three-dot menu ---------- */
  var menu=$('rs-menu'),mId=null,mBtn=null;
  function closeMenu(ret){
    if(menu.hidden)return;
    menu.hidden=true;
    if(mBtn){mBtn.setAttribute('aria-expanded','false');if(ret&&mBtn.isConnected)mBtn.focus()}
    mBtn=null;mId=null;
  }
  function openMenu(btn,id){
    closeMenu();mId=id;mBtn=btn;
    menu.hidden=false;btn.setAttribute('aria-expanded','true');
    var br=btn.getBoundingClientRect(),w=menu.offsetWidth,h=menu.offsetHeight;
    var left=Math.min(Math.max(8,br.right-w),window.innerWidth-w-8),top=br.bottom+4;
    if(top+h>window.innerHeight-8)top=Math.max(8,br.top-h-4);
    menu.style.left=left+'px';menu.style.top=top+'px';
    menu.querySelector('button').focus();
  }
  menu.addEventListener('click',function(e){
    var b=e.target.closest('[data-m]');if(!b)return;
    var id=mId,btn=mBtn,m=b.getAttribute('data-m');
    if(m==='details'){closeMenu();openM(id,btn)}
    else{closeMenu(true);copyLink(BY[id])}
  });
  menu.addEventListener('keydown',function(e){
    var items=[].slice.call(menu.querySelectorAll('button')),i=items.indexOf(document.activeElement);
    if(e.key==='ArrowDown'){e.preventDefault();items[(i+1)%items.length].focus()}
    else if(e.key==='ArrowUp'){e.preventDefault();items[(i-1+items.length)%items.length].focus()}
    else if(e.key==='Tab')closeMenu();
  });
  document.addEventListener('mousedown',function(e){
    if(!menu.hidden&&!menu.contains(e.target)&&!e.target.closest('.rs-dots'))closeMenu();
  });
  window.addEventListener('scroll',function(){closeMenu()},true);
  window.addEventListener('resize',function(){closeMenu()});

  /* ---------- preview / details modal ---------- */
  var md=$('rs-modal'),opener=null;
  function row(k,v,raw){return '<dt>'+k+'</dt><dd>'+(raw?v:esc(v))+'</dd>'}
  function openM(id,from){
    var r=BY[id];if(!r)return;
    opener=from||document.activeElement;
    $('rs-m-title').textContent=r.t;
    var h='';
    if(r.type!=='link'){
      h+='<div class="rs-pv">'+fi(r,false)+'<div class="rs-lines"><i style="width:92%"></i><i style="width:78%"></i><i style="width:85%"></i><i style="width:52%"></i></div></div>'+
         '<p class="rs-pvn">'+(r.teacher?'Preview is not available. Use Download to open the file.':'Mock preview. No real file is loaded in this prototype.')+'</p>';
    }
    h+='<dl class="rs-dl">'+
      row('Category','<span class="rs-bd rs-b-'+r.c+'">'+BADGE[r.c]+'</span>',true)+
      row('Type',TYPE[r.type]||r.type)+
      (r.course?row('Class',r.course):'')+
      (r.topic?row('Week / Topic',r.topic):'')+
      (r.date?row('Date',r.date):'')+
      (r.size?row('Size',r.size):'')+
      row('Semester',SEM[r.sem])+
      (r.url?row('Link','<a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.url)+'</a>',true):'')+
      (r.desc?row('Description',r.desc):'')+'</dl>';
    $('rs-m-body').innerHTML=h;
    var p=$('rs-m-p');p.setAttribute('data-id',id);
    p.innerHTML=r.type==='link'?ic('ext')+'Open Link':ic('download')+'Download';
    md.hidden=false;document.body.classList.add('rs-modal-open');
    $('rs-m-close').focus();
  }
  function closeM(){
    md.hidden=true;document.body.classList.remove('rs-modal-open');
    if(opener&&opener.isConnected)opener.focus();
  }
  $('rs-m-x').addEventListener('click',closeM);
  $('rs-m-close').addEventListener('click',closeM);
  md.addEventListener('mousedown',function(e){if(e.target===md)closeM()});
  $('rs-m-p').addEventListener('click',function(){
    var r=BY[this.getAttribute('data-id')];if(!r)return;
    if(r.type==='link')openLink(r);else download(r);
  });

  /* ---------- page events ---------- */
  $('rs-q').addEventListener('input',function(e){st.q=e.target.value;render()});
  $('rs-sem').addEventListener('change',function(e){st.s=e.target.value;render()});
  $('rs-tabs').addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    st.c=b.getAttribute('data-c');
    [].forEach.call($('rs-tabs').children,function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
    render();
  });
  $('rs-list').addEventListener('click',function(e){
    var b=e.target.closest('[data-a]');if(!b)return;
    var r=BY[b.closest('.rs-card').getAttribute('data-id')],a=b.getAttribute('data-a');
    if(!r)return;
    if(a==='download')download(r);
    else if(a==='view')openM(r.id,b);
    else if(a==='link')openLink(r);
    else if(a==='menu'){
      if(!menu.hidden&&mBtn===b)closeMenu(true);else openMenu(b,r.id);
    }
  });
  $('rs-pop').addEventListener('click',function(e){
    var b=e.target.closest('.rs-pi');if(b)openM(b.getAttribute('data-id'),b);
  });

  /* live refresh: when the teacher saves in another tab, or when this tab regains focus */
  window.addEventListener('storage',function(e){
    if(e.key===TEACHER_KEY||e.key===null){rebuild();buildPopular();render()}
  });
  document.addEventListener('visibilitychange',function(){
    if(!document.hidden&&md.hidden&&menu.hidden){rebuild();buildPopular();render()}
  });

  /* one keydown listener: menu first, then modal (Esc + focus trap), then the drawer */
  document.addEventListener('keydown',function(e){
    if(!menu.hidden){if(e.key==='Escape'){closeMenu(true);return}return}
    if(!md.hidden){
      if(e.key==='Escape'){closeM();return}
      if(e.key==='Tab'){
        var f=md.querySelectorAll('button,a[href]'),first=f[0],last=f[f.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
        else if(!md.contains(document.activeElement)){e.preventDefault();first.focus()}
      }
      return;
    }
  });

  rebuild();buildTabs();buildPopular();render();
})();