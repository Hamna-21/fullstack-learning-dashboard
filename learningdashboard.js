// Cursor
var cur=document.getElementById('cur'),ring=document.getElementById('cur-ring');
document.addEventListener('mousemove',function(e){
  cur.style.left=e.clientX+'px';cur.style.top=e.clientY+'px';
  ring.style.left=e.clientX+'px';ring.style.top=e.clientY+'px';
});

var pages=['home','courses','dashboard','tasks','analytics','certs','auth'];
var built={};
function showPage(p){
  if(p==='dashboard'&&typeof window.requirePageAccess==='function'&&window.requirePageAccess(p)===false){return;}
  pages.forEach(function(id){var el=document.getElementById('page-'+id);if(el)el.classList.remove('active')});
  var t=document.getElementById('page-'+p);if(t)t.classList.add('active');
  window.currentPage=p;
  document.querySelectorAll('.nav-link').forEach(function(l){l.classList.remove('active')});
  var m=document.querySelector('.nav-link[onclick*="\''+p+'\'"]');if(m)m.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(p==='dashboard'&&!built.act)buildAct();
  if(p==='analytics'&&!built.month)buildMonth();
  if(p==='dashboard'&&typeof window.refreshDashboard==='function'){window.refreshDashboard();}
  notify(p);
}

function buildAct(){
  var el=document.getElementById('act-chart');if(!el)return;
  [3,5,4,7,6,2,4].forEach(function(v,i){
    var b=document.createElement('div');b.className='bar'+(i===3?' hi':'');
    b.style.height=Math.round(v/7*100)+'%';el.appendChild(b);
  });built.act=true;
}
function buildMonth(){
  var ca=document.getElementById('mchart'),cl=document.getElementById('mlabels');if(!ca)return;
  var ms=['Jan','Feb','Mar','Apr','May','Jun'],vs=[18,24,20,32,28,36],mx=Math.max.apply(null,vs);
  vs.forEach(function(v,i){
    var w=document.createElement('div');w.className='mb-wrap';
    var l=document.createElement('div');l.className='mb-lbl';l.textContent=v+'h';
    var b=document.createElement('div');b.className='mb'+(i===vs.length-1?' hi':'');
    b.style.height=Math.round(v/mx*100)+'%';w.appendChild(l);w.appendChild(b);ca.appendChild(w);
  });
  ms.forEach(function(m){var s=document.createElement('span');s.textContent=m;cl.appendChild(s)});
  built.month=true;
}

var nd={courses:{i:'📚',t:'Course Library',s:'6 modules ready'},dashboard:{i:'📊',t:'Dashboard',s:'3 tasks due today'},tasks:{i:'✅',t:'Task Board',s:'5 active tasks'},analytics:{i:'📈',t:'Analytics',s:'Score: 94/100'},certs:{i:'🏆',t:'Certificates',s:'3 credentials earned'},auth:{i:'🔐',t:'Secure Login',s:'DecodeLabs · Batch 2026'}};
var nt;
function notify(p){
  if(!nd[p])return;
  var w=document.getElementById('nw'),m=nd[p];
  var n=document.createElement('div');n.className='notif';
  n.innerHTML='<div class="n-icon">'+m.i+'<\/div><div style="flex:1"><div class="n-title">'+m.t+'<\/div><div class="n-text">'+m.s+'<\/div><\/div><span class="n-close" onclick="this.parentElement.remove()">×<\/span>';
  w.innerHTML='';w.appendChild(n);
  clearTimeout(nt);nt=setTimeout(function(){n.style.opacity='0';n.style.transition='opacity 0.4s';setTimeout(function(){n.remove()},400)},3000);
}

function fTab(btn){
  btn.closest('.tab-bar').querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
}
