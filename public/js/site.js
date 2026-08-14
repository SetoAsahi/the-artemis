let SITE = null;
const q = (s) => document.querySelector(s);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

function setText(selector, value = '') {
  const el = q(selector);
  if (el) el.textContent = value;
}

function revealAll() {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
}

function observe() {
  if (!('IntersectionObserver' in window)) {
    revealAll();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal:not(.visible)').forEach((el) => observer.observe(el));
}

async function loadSite() {
  const res = await fetch('/api/site', { cache: 'no-store' });
  if (!res.ok) throw new Error('サイト情報を読み込めませんでした');
  SITE = await res.json();
  render();
}

function render() {
  const b = SITE?.brand || {};
  setText('#brandName', b.name || 'The Artemis');
  setText('#heroName', b.name || 'The Artemis');
  setText('#footerName', b.name || 'The Artemis');
  setText('#brandSubtitle', b.subtitle || 'LUXURY CABARET');
  setText('#heroSubtitle', b.subtitle || '');
  setText('#heroTagline', b.tagline || '');
  setText('#heroIntro', b.intro || '');

  const heroImage = q('#heroImage');
  if (heroImage) heroImage.src = b.heroImage || '/assets/hero-lounge.svg';
  document.title = `${b.name || 'The Artemis'} | Luxury Cabaret`;

  const cast = Array.isArray(SITE?.cast) ? SITE.cast : [];
  const castGrid = q('#castGrid');
  if (castGrid) {
    castGrid.innerHTML = cast.map((c, i) => `
      <article class="cast-card reveal visible">
        <div class="cast-photo">
          ${c.image
            ? `<img src="${esc(c.image)}" alt="${esc(c.name)}">`
            : `<span class="cast-placeholder">${esc(c.rank || String(i + 1).padStart(2, '0'))}</span>`}
        </div>
        <div class="cast-meta">
          <span class="rank">RANK ${esc(c.rank || '')}</span>
          <h3>${esc(c.name || '')}</h3>
          <p>${esc(c.roman || '')}</p>
          <small>${esc(c.shift || '')}</small>
        </div>
      </article>
    `).join('');
  }

  const event = SITE?.event || {};
  setText('#eventTitle', event.title || '');
  setText('#eventHeading', event.heading || '');
  setText('#eventDescription', event.description || '');
  setText('#eventDate', event.date || '');

  const newsList = q('#newsList');
  if (newsList) {
    const news = Array.isArray(SITE?.news) ? SITE.news : [];
    newsList.innerHTML = news.map((n) => `
      <article>
        <time>${esc(n.date || '')}</time>
        <span>${esc(n.category || '')}</span>
        <p>${esc(n.text || '')}</p>
      </article>
    `).join('');
  }

  const priceList = q('#priceList');
  if (priceList) {
    const prices = Array.isArray(SITE?.system) ? SITE.system : [];
    priceList.innerHTML = prices.map((p) => `
      <div><dt>${esc(p.label || '')}</dt><dd>${esc(p.price || '')}</dd></div>
    `).join('');
  }

  const access = SITE?.access || {};
  const accessInfo = q('#accessInfo');
  if (accessInfo) {
    accessInfo.innerHTML = [
      access.postal,
      access.address,
      access.route,
      access.tel ? `TEL. ${access.tel}` : '',
      access.hours
    ].filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join('');
  }
  const mapLink = q('#mapLink');
  if (mapLink) mapLink.href = access.mapUrl || 'https://maps.google.com';

  const recruit = SITE?.recruit || {};
  setText('#recruitHeading', recruit.heading || '');
  setText('#recruitLead', recruit.lead || '');
  setText('#recruitNote', recruit.note || '');

  const socials = SITE?.socials || {};
  const socialLinks = q('#socialLinks');
  if (socialLinks) {
    socialLinks.innerHTML = [
      ['Instagram', socials.instagram],
      ['X', socials.x],
      ['LINE', socials.line]
    ].filter(([, url]) => url).map(([name, url]) => `
      <a href="${esc(url)}" target="_blank" rel="noreferrer">${name}</a>
    `).join('');
  }

  revealAll();
  observe();
}

document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  if (open) {
    const modal = q(`#${open.dataset.open}Modal`);
    if (modal?.showModal) modal.showModal();
  }
  if (e.target.matches('[data-close]')) {
    e.target.closest('dialog')?.close();
  }
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
});

async function submitForm(form, url, success) {
  const msg = form.querySelector('.form-message');
  if (msg) {
    msg.classList.remove('error');
    msg.textContent = '送信中…';
  }
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || '送信できませんでした');
    if (msg) msg.textContent = success;
    form.reset();
    setTimeout(() => form.closest('dialog')?.close(), 1400);
  } catch (err) {
    if (msg) {
      msg.classList.add('error');
      msg.textContent = err.message;
    }
  }
}

q('#recruitForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  submitForm(e.currentTarget, '/api/recruit', 'ご応募を受け付けました。ありがとうございます。');
});

setText('#year', new Date().getFullYear());
revealAll();
loadSite().catch((err) => {
  console.error(err);
  setText('#heroIntro', 'サイト情報を読み込めませんでした。');
  revealAll();
});
