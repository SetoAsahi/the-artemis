let SITE = null;
const q = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

async function loadSite(){
  const res = await fetch('/api/site', { cache: 'no-store' });
  if(!res.ok) throw new Error('site load failed');
  SITE = await res.json();
  render();
}
function render(){
  const b=SITE.brand||{};
  ['brandName','heroName','footerName'].forEach(id=>q('#'+id).textContent=b.name||'The Artemis');
  q('#brandSubtitle').textContent=b.subtitle||'LUXURY CABARET';q('#heroSubtitle').textContent=b.subtitle||'';q('#heroTagline').textContent=b.tagline||'';q('#heroIntro').textContent=b.intro||'';q('#heroImage').src=b.heroImage||'/assets/hero-lounge.svg';document.title=`${b.name||'The Artemis'} | Luxury Cabaret`;
  const cast=SITE.cast||[];q('#castGrid').innerHTML=cast.map((c,i)=>`<article class="cast-card reveal"><div class="cast-photo">${c.image?`<img src="${esc(c.image)}" alt="${esc(c.name)}">`:`<span class="cast-placeholder">${esc(c.rank||String(i+1).padStart(2,'0'))}</span>`}</div><div class="cast-meta"><span class="rank">RANK ${esc(c.rank||'')}</span><h3>${esc(c.name)}</h3><p>${esc(c.roman)}</p><small>${esc(c.shift)}</small></div></article>`).join('');
  q('#castSelect').innerHTML='<option value="">指定なし</option>'+cast.map(c=>`<option>${esc(c.name)}</option>`).join('');
  const e=SITE.event||{};q('#eventTitle').textContent=e.title||'';q('#eventHeading').textContent=e.heading||'';q('#eventDescription').textContent=e.description||'';q('#eventDate').textContent=e.date||'';
  q('#newsList').innerHTML=(SITE.news||[]).map(n=>`<article><time>${esc(n.date)}</time><span>${esc(n.category)}</span><p>${esc(n.text)}</p></article>`).join('');
  q('#priceList').innerHTML=(SITE.system||[]).map(p=>`<div><dt>${esc(p.label)}</dt><dd>${esc(p.price)}</dd></div>`).join('');
  const a=SITE.access||{};q('#accessInfo').innerHTML=[a.postal,a.address,a.route,`TEL. ${a.tel||''}`,a.hours].filter(Boolean).map(x=>`<p>${esc(x)}</p>`).join('');q('#reservationTel').textContent=a.tel?`TEL. ${a.tel}`:'';q('#mapLink').href=a.mapUrl||'https://maps.google.com';
  const r=SITE.recruit||{};q('#recruitHeading').textContent=r.heading||'';q('#recruitLead').textContent=r.lead||'';q('#recruitNote').textContent=r.note||'';
  const socials=SITE.socials||{};q('#socialLinks').innerHTML=[['Instagram',socials.instagram],['X',socials.x],['LINE',socials.line]].filter(x=>x[1]).map(([n,u])=>`<a href="${esc(u)}" target="_blank" rel="noreferrer">${n}</a>`).join('');
  observe();
}

function setReservationDateMin(){
  const input=q('#reservationForm input[name="date"]');
  if(!input)return;
  const now=new Date();
  const local=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
  input.min=local;
}

function observe(){const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');o.unobserve(e.target)}}),{threshold:.1});document.querySelectorAll('.reveal:not(.visible)').forEach(el=>o.observe(el));}

document.addEventListener('click',e=>{const open=e.target.closest('[data-open]');if(open){q(`#${open.dataset.open}Modal`).showModal()}if(e.target.matches('[data-close]'))e.target.closest('dialog').close();});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));

async function submitForm(form, url, success){
  const msg=form.querySelector('.form-message');msg.classList.remove('error');msg.textContent='送信中…';
  const data=Object.fromEntries(new FormData(form).entries());data.vip=form.elements.vip?.checked||false;
  try{const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const out=await res.json();if(!res.ok)throw new Error(out.error||'送信できませんでした');msg.textContent=success;form.reset();setTimeout(()=>form.closest('dialog').close(),1400);}catch(err){msg.classList.add('error');msg.textContent=err.message;}
}
q('#reservationForm').addEventListener('submit',e=>{e.preventDefault();submitForm(e.currentTarget,'/api/reservations','ご予約を受け付けました。お店からの連絡をお待ちください。')});
q('#recruitForm').addEventListener('submit',e=>{e.preventDefault();submitForm(e.currentTarget,'/api/recruit','ご応募を受け付けました。ありがとうございます。')});
q('#year').textContent=new Date().getFullYear();
setReservationDateMin();
loadSite().catch(()=>{q('#heroIntro').textContent='サイト情報を読み込めませんでした。';observe();});
