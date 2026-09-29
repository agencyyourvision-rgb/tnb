/* TNBuilt West v2 — Apple-inspired motion (vanilla + GSAP ScrollTrigger). Your Vision Agency. */
(function(){
'use strict';
var d = document, root = d.documentElement;
root.classList.remove('no-js');
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) root.classList.add('reduced');

/* Local preview (file://): folder links -> index.html */
if (location.protocol === 'file:') {
  d.querySelectorAll('a[href]').forEach(function(a){
    var h = a.getAttribute('href');
    if (!/^(https?:|mailto:|tel:|#|javascript:)/.test(h) && /\/$/.test(h.split('#')[0])) {
      var p = h.split('#'); a.setAttribute('href', p[0] + 'index.html' + (p[1] ? '#' + p[1] : ''));
    }
  });
}

/* Central ref-counted scroll lock (iOS-safe) */
var _lc = 0, _ly = 0;
function lockScroll(){ if (_lc++ === 0){ _ly = window.scrollY; d.body.style.position='fixed'; d.body.style.top=-_ly+'px'; d.body.style.width='100%'; } }
function unlockScroll(){ if (--_lc <= 0){ _lc = 0; d.body.style.position=''; d.body.style.top=''; d.body.style.width=''; window.scrollTo(0,_ly); } }

/* Preloader — hide on video "playing" (fallback timeout) */
var pre = d.querySelector('.pre'), started = false;
/* start motion only after the whole script has run (all section modules registered), even if the hero video is already playing from cache */
function start(){ if (started) return; started = true; setTimeout(motion, 0); }
if (pre){
  lockScroll();
  var done = false, hv = d.querySelector('.hero-card video');
  var hide = function(){ if (done) return; done = true; pre.classList.add('done'); unlockScroll(); start(); };
  if (hv){
    if (!hv.paused && hv.readyState > 2) hide();
    hv.addEventListener('playing', hide, { once:true });
    hv.addEventListener('error', hide, { once:true });
    var pp = hv.play && hv.play(); if (pp && pp.catch) pp.catch(hide);
  }
  setTimeout(hide, hv ? 4000 : 500);
} else { d.addEventListener('DOMContentLoaded', start); }

/* Mobile menu */
var burger = d.querySelector('.burger');
if (burger){
  burger.addEventListener('click', function(){
    var open = !d.body.classList.contains('menu-open');
    d.body.classList.toggle('menu-open', open); burger.setAttribute('aria-expanded', open);
    open ? lockScroll() : unlockScroll();
  });
  d.querySelectorAll('.mmenu .mt[aria-expanded]').forEach(function(b){
    b.addEventListener('click', function(){ var li = b.parentElement; li.classList.toggle('open'); b.setAttribute('aria-expanded', li.classList.contains('open')); });
  });
  d.querySelectorAll('.mmenu a').forEach(function(a){ a.addEventListener('click', function(){ if (d.body.classList.contains('menu-open')){ d.body.classList.remove('menu-open'); unlockScroll(); } }); });
}

/* Videos below the fold: play only in view */
if ('IntersectionObserver' in window){
  var vio = new IntersectionObserver(function(es){ es.forEach(function(e){ var v = e.target; if (e.isIntersecting){ var p = v.play(); if (p && p.catch) p.catch(function(){}); } else v.pause(); }); }, { threshold:.15 });
  d.querySelectorAll('video[data-inview]').forEach(function(v){ vio.observe(v); });
}

/* Rails with arrow buttons (gallery / categories on touch) */
d.querySelectorAll('[data-rail-ctrl]').forEach(function(c){
  var rail = d.getElementById(c.dataset.railCtrl); if (!rail) return;
  var step = function(dir){ rail.scrollBy({ left: dir * rail.clientWidth * .7, behavior:'smooth' }); };
  c.querySelector('.prev').onclick = function(){ step(-1); };
  c.querySelector('.next').onclick = function(){ step(1); };
});

/* Lightbox */
var items = [].slice.call(d.querySelectorAll('[data-lb]'));
if (items.length){
  var ic = function(p){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">'+p+'</svg>'; };
  var lb = d.createElement('div'); lb.className='lb'; lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true');
  lb.innerHTML = '<img alt=""><div class="lb-cap"></div><div class="lb-count"></div><button class="lb-x" aria-label="Close">'+ic('<path d="M6 6l12 12M18 6L6 18"/>')+'</button><button class="lb-p" aria-label="Previous">'+ic('<path d="M15 5l-7 7 7 7"/>')+'</button><button class="lb-n" aria-label="Next">'+ic('<path d="M9 5l7 7-7 7"/>')+'</button>';
  d.body.appendChild(lb);
  var li = lb.querySelector('img'), lc = lb.querySelector('.lb-cap'), ln = lb.querySelector('.lb-count'), cur = 0, on = false;
  var show = function(i){ cur = (i + items.length) % items.length; var a = items[cur], im = a.querySelector('img'); li.src = a.getAttribute('href'); li.alt = im.alt; lc.textContent = a.dataset.cap || im.alt; ln.textContent = (cur+1)+' / '+items.length; };
  var open = function(i){ show(i); lb.classList.add('on'); if (!on){ on = true; lockScroll(); } };
  var close = function(){ lb.classList.remove('on'); if (on){ on = false; unlockScroll(); } };
  items.forEach(function(a,i){ a.addEventListener('click', function(e){ e.preventDefault(); open(i); }); });
  lb.querySelector('.lb-x').onclick = close; lb.querySelector('.lb-p').onclick = function(){ show(cur-1); }; lb.querySelector('.lb-n').onclick = function(){ show(cur+1); };
  lb.addEventListener('click', function(e){ if (e.target === lb) close(); });
  d.addEventListener('keydown', function(e){ if (!lb.classList.contains('on')) return; if (e.key==='Escape') close(); if (e.key==='ArrowLeft') show(cur-1); if (e.key==='ArrowRight') show(cur+1); });
  var tx = 0; lb.addEventListener('touchstart', function(e){ tx = e.touches[0].clientX; }, { passive:true });
  lb.addEventListener('touchend', function(e){ var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); });
}

/* Showreel modal */
var vm = d.querySelector('.vm');
if (vm){
  var vv = vm.querySelector('video');
  var vclose = function(){ vm.classList.remove('on'); vv.pause(); unlockScroll(); };
  var vdef = vm.querySelector('source') ? vm.querySelector('source').src : vv.currentSrc;
  d.querySelectorAll('[data-showreel]').forEach(function(b){ b.addEventListener('click', function(e){
    e.preventDefault();
    /* a trigger can name its own film (data-video); otherwise the default showreel plays */
    var want = b.getAttribute('data-video') ? new URL(b.getAttribute('data-video'), location.href).href : vdef;
    if ((vv.currentSrc || vv.src) !== want){ vv.src = want; vv.load(); }
    vm.classList.add('on'); lockScroll(); try { vv.currentTime = 0; } catch(_){}
    var p = vv.play(); if (p && p.catch) p.catch(function(){}); }); });
  vm.querySelector('button').onclick = vclose;
  vm.addEventListener('click', function(e){ if (e.target === vm) vclose(); });
  d.addEventListener('keydown', function(e){ if (e.key==='Escape' && vm.classList.contains('on')) vclose(); });
}

/* Contact form -> contact.php */
var form = d.querySelector('form.form');
if (form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var msg = form.querySelector('.form-msg'), btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    fetch(form.action, { method:'POST', body:new FormData(form), headers:{ 'Accept':'application/json' } })
      .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
      .then(function(j){ if (!j.ok) throw 0; msg.className='form-msg ok'; msg.textContent=form.dataset.ok; form.reset(); })
      .catch(function(){ msg.className='form-msg err'; msg.textContent=form.dataset.err; })
      .finally(function(){ btn.disabled = false; });
  });
}

/* Process steps (works with or without GSAP) */
var steps = d.querySelectorAll('.pstep'), pimgs = d.querySelectorAll('.proc-media img');
if (steps.length && 'IntersectionObserver' in window){
  var sio = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ var i = +e.target.dataset.i; steps.forEach(function(s,k){ s.classList.toggle('on', k===i); }); pimgs.forEach(function(im,k){ im.classList.toggle('on', k===i); }); } }); }, { rootMargin:'-45% 0px -45% 0px' });
  steps.forEach(function(s){ sio.observe(s); });
}

/* ───────── GSAP choreography ───────── */
function motion(){
  if (reduced || !window.gsap || !window.ScrollTrigger){
    d.querySelectorAll('.rv').forEach(function(el){ el.style.opacity=1; el.style.transform='none'; });
    d.querySelectorAll('.lines .ln').forEach(function(l){ l.classList.add('on'); });
    root.classList.add('reduced');
    return;
  }
  var gsap = window.gsap; gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize:true });

  /* Hero: text rises in, then the film shrinks into a rounded card while text fades */
  var hero = d.querySelector('.hero');
  if (hero){
    gsap.from('.hero-txt > *', { y:40, opacity:0, duration:1.3, ease:'power3.out', stagger:.12, delay:.1 });
    var tl = gsap.timeline({ scrollTrigger:{ trigger:hero, start:'top top', end:'+=70%', scrub:true, pin:true, anticipatePin:1 } });
    tl.to('.hero-card', { scale:.86, borderRadius:32, ease:'none' }, 0)
      .to('.hero-txt', { opacity:0, y:-80, ease:'none' }, 0)
      .to('.hero-cue', { opacity:0, ease:'none', duration:.2 }, 0);
  }

  /* Statement lines light up one by one */
  var lines = d.querySelector('.lines');
  if (lines){
    var ls = lines.querySelectorAll('.ln');
    ScrollTrigger.create({ trigger:lines, start:'top top', end:'bottom bottom', onUpdate:function(s){
      var n = Math.min(ls.length, Math.floor(s.progress * (ls.length + .6) + .15));
      ls.forEach(function(l,i){ l.classList.toggle('on', i < n); });
    }});
  }

  /* Zoom: small rounded image grows to full-bleed, then copy appears */
  var zoom = d.querySelector('.zoom');
  if (zoom){
    var zm = zoom.querySelector('.zoom-media');
    var zt = gsap.timeline({ scrollTrigger:{ trigger:zoom, start:'top top', end:'bottom bottom', scrub:.6 } });
    if (zoom.classList.contains('yz')){
      /* One yacht: card grows to full-bleed → first copy → camera pushes into the detail → second copy */
      /* portrait screens: show the whole yacht first (fit to width), then push into the same detail point */
      var qz = zoom.querySelector('.qual-zoom'), qb = zoom.querySelector('.qual-box');
      var fit = function(){ var w = window.innerWidth, h = window.innerHeight; if (w >= h) return { s:1, x:0, y:0 };
        var Wb = qb.offsetWidth, Hb = qb.offsetHeight, s = w / Wb, ox = .1561 * Wb, oy = .5345 * Hb;
        var bl = w / 2 - Wb / 2; return { s:s, x:-(bl + ox * (1 - s)), y:(Hb / 2 - oy) * (1 - s) }; };
      zt.scrollTrigger.vars.invalidateOnRefresh = true;
      zt.fromTo(zm, { scale:.42, borderRadius:44 }, { scale:1, borderRadius:0, ease:'power1.inOut', duration:1 })
        .fromTo(zm, { '--shade':0 }, { '--shade':1, duration:.3 }, .7)
        .fromTo(zoom.querySelectorAll('.z1'), { opacity:0, y:40 }, { opacity:1, y:0, duration:.3, stagger:.08 }, .72)
        .to({}, { duration:.35 })
        .to(zoom.querySelectorAll('.z1'), { opacity:0, y:-40, duration:.25 })
        .fromTo(qz, { scale:function(){ return fit().s; }, x:function(){ return fit().x; }, y:function(){ return fit().y; } }, { scale:3, x:0, y:0, duration:1.1, ease:'power2.inOut', immediateRender:true }, '<.05')
        /* the detail photo is the exact 3× crop of the same shot, so it only sharpens — it starts once the push-in has landed */
        .to(zoom.querySelector('.qual-detail'), { opacity:1, duration:.25, ease:'none' }, '>-.02')
        .fromTo(zoom.querySelectorAll('.z2'), { opacity:0, y:40 }, { opacity:1, y:0, duration:.3, stagger:.08, onStart:function(){ zoom.querySelectorAll('.z2').forEach(function(z){ z.classList.add('on'); }); }, onReverseComplete:function(){ zoom.querySelectorAll('.z2').forEach(function(z){ z.classList.remove('on'); }); } }, '-=.05')
        .to({}, { duration:.4 });
    } else {
      zt.fromTo(zm, { scale:.42, borderRadius:44 }, { scale:1, borderRadius:0, ease:'power1.inOut', duration:1 })
        .fromTo(zm, { '--shade':0 }, { '--shade':1, duration:.3 }, .7)
        .fromTo(zoom.querySelector('.zoom-txt'), { opacity:0, y:40 }, { opacity:1, y:0, duration:.3 }, .72)
        .fromTo(zoom.querySelector('.zoom-foot'), { opacity:0, y:40 }, { opacity:1, y:0, duration:.3 }, .8)
        .to({}, { duration:.25 });
    }
  }

  /* Reveal-on-scroll */
  gsap.utils.toArray('.rv').forEach(function(el){
    gsap.to(el, { opacity:1, y:0, duration:1.2, ease:'power3.out', scrollTrigger:{ trigger:el, start:'top 88%' } });
  });
  gsap.utils.toArray('[data-stagger]').forEach(function(g){
    gsap.from(g.children, { y:60, opacity:0, duration:1.1, ease:'power3.out', stagger:.08, scrollTrigger:{ trigger:g, start:'top 85%' } });
  });

  /* Count-ups in bento */
  d.querySelectorAll('[data-count]').forEach(function(el){
    var txt = el.textContent, m = txt.match(/[\d,]+/); if (!m) return;
    var end = parseInt(m[0].replace(/,/g,''),10), o = { v:0 }, comma = m[0].indexOf(',') > -1;
    ScrollTrigger.create({ trigger:el, start:'top 90%', once:true, onEnter:function(){
      gsap.to(o, { v:end, duration:1.8, ease:'power2.out', onUpdate:function(){ var n = Math.round(o.v); el.textContent = txt.replace(m[0], comma ? n.toLocaleString('en-US') : n); } });
    }});
  });

  var mm = gsap.matchMedia();

  /* Category rail: horizontal pin on desktop */
  mm.add('(min-width: 1069px)', function(){
    var rw = d.querySelector('.rail-wrap'), rail = rw && rw.querySelector('.rail');
    if (!rail) return;
    var dist = function(){ return Math.max(0, rail.scrollWidth - window.innerWidth); };
    gsap.to(rail, { x:function(){ return -dist(); }, ease:'none', scrollTrigger:{ trigger:rw, start:'center center', end:function(){ return '+=' + dist(); }, pin:true, scrub:.6, invalidateOnRefresh:true } });
  });
  mm.add('(max-width: 1068px)', function(){
    var rail = d.querySelector('.rail'); if (rail){ rail.style.overflowX = 'auto'; rail.style.scrollSnapType = 'x mandatory'; rail.style.scrollbarWidth = 'none'; }
  });

  /* Stacking cards: previous card recedes as the next arrives */
  var cards = gsap.utils.toArray('.scard');
  cards.forEach(function(c, i){
    if (i === cards.length - 1) return;
    /* no CSS filter here: filter + backdrop-filter renders the glass card black in Chromium/Safari */
    var dim = c.querySelector('.sc-shade');
    var st = { trigger:cards[i+1], start:'top 70%', end:function(){ return 'top ' + (d.querySelector('.gnav').offsetHeight + window.innerHeight * .05) + 'px'; }, scrub:true, invalidateOnRefresh:true };
    gsap.fromTo(c, { scale:1 }, { scale:.94, ease:'none', scrollTrigger:st });
    if (dim) gsap.fromTo(dim, { opacity:0 }, { opacity:.55, ease:'none', scrollTrigger:st });
  });

  /* Clip reveal (digital band + inner hero media) */
  gsap.utils.toArray('[data-clip]').forEach(function(el){
    gsap.fromTo(el, { clipPath:'inset(8% 10% 8% 10% round 36px)' }, { clipPath:'inset(0% 0% 0% 0% round 0px)', ease:'none', scrollTrigger:{ trigger:el.parentElement, start:'top 85%', end:'top 15%', scrub:true } });
  });
  gsap.utils.toArray('[data-grow]').forEach(function(el){
    gsap.fromTo(el, { scale:.9 }, { scale:1, ease:'none', scrollTrigger:{ trigger:el, start:'top 95%', end:'top 25%', scrub:true } });
  });

  /* Subtle parallax */
  gsap.utils.toArray('[data-parallax] img').forEach(function(img){
    gsap.fromTo(img, { yPercent:-6, scale:1.12 }, { yPercent:6, scale:1.12, ease:'none', scrollTrigger:{ trigger:img.parentElement, start:'top bottom', end:'bottom top', scrub:true } });
  });

  window.__motionReady = { gsap:gsap, ST:ScrollTrigger };
  if (window.__v3 && !window.__v3done){ window.__v3done = true; window.__v3(gsap, ScrollTrigger); }
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
}
})();

/* ═══════════ v3 motion & interactions ═══════════ */
(function(){
var d = document;
var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* 3D tilt + glare */
if (fine) d.querySelectorAll('[data-tilt]').forEach(function(el){
  var r;
  el.addEventListener('pointerenter', function(){ r = el.getBoundingClientRect(); el.style.transition = 'transform .15s ease-out'; });
  el.addEventListener('pointermove', function(ev){
    if (!r) r = el.getBoundingClientRect();
    var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
    el.style.transform = 'perspective(1000px) rotateX(' + ((.5 - y) * 10).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 12).toFixed(2) + 'deg) translateZ(0)';
    el.style.setProperty('--gx', (x * 100) + '%'); el.style.setProperty('--gy', (y * 100) + '%');
  });
  el.addEventListener('pointerleave', function(){ el.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; r = null; });
});

/* Upload dropzone */
var drop = d.querySelector('.drop');
if (drop){
  var inp = drop.querySelector('input'), lab = drop.querySelector('.drop-l'), form = drop.closest('form');
  var upd = function(){ var t = 0, n = []; [].forEach.call(inp.files, function(f){ t += f.size; n.push(f.name); });
    lab.textContent = n.length ? n.join(', ') + ' · ' + (t / 1048576).toFixed(1) + ' MB' : '';
    drop.classList.toggle('too', t > 25 * 1048576); };
  inp.addEventListener('change', upd);
  ['dragenter','dragover'].forEach(function(ev){ drop.addEventListener(ev, function(){ drop.classList.add('over'); }); });
  ['dragleave','drop'].forEach(function(ev){ drop.addEventListener(ev, function(){ drop.classList.remove('over'); }); });
  form.addEventListener('submit', function(e){ if (drop.classList.contains('too')){ e.preventDefault(); e.stopImmediatePropagation(); var m = form.querySelector('.form-msg'); m.className = 'form-msg err'; m.textContent = form.dataset.toobig; } }, true);
}

window.__v3 = function(gsap, ST){
  window.__v3done = true;
  /* Hero line fade with shrink */
  var hl = d.querySelector('.hero-line');
  if (hl) gsap.to(hl, { opacity:0, ease:'none', scrollTrigger:{ trigger:'.hero', start:'top top', end:'+=30%', scrub:true } });

  /* 1 · Plans → Renderings → Model */
  var des = d.querySelector('.desire');
  if (des){
    var paths = des.querySelectorAll('.blueprint .bp');
    paths.forEach(function(p){ var L = p.getTotalLength ? p.getTotalLength() : 600; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    var caps = des.querySelectorAll('.dc');
    var tl = gsap.timeline({ defaults:{ ease:'none' }, scrollTrigger:{ trigger:des, start:'top top', end:'bottom bottom', scrub:.5 } });
    tl.to('.d-intro', { opacity:0, y:-60, duration:.06 }, .08)
      .fromTo('.d-plan', { opacity:0, rotateX:18, scale:.94 }, { opacity:1, rotateX:0, scale:1, duration:.06 }, .12)
      .to(paths, { strokeDashoffset:0, duration:.2, stagger:{ amount:.14 } }, .14)
      .fromTo(caps[0], { opacity:0, y:30 }, { opacity:1, y:0, duration:.04 }, .16)
      .to('.d-plan', { opacity:0, scale:.92, duration:.05 }, .42)
      .to(caps[0], { opacity:0, y:-30, duration:.04 }, .42)
      .fromTo('.d-render', { opacity:0, y:60, rotateY:-14 }, { opacity:1, y:0, rotateY:0, duration:.08 }, .45)
      .fromTo(caps[1], { opacity:0, y:30 }, { opacity:1, y:0, duration:.04 }, .47)
      .to('.d-render', { opacity:0, y:-40, scale:.9, duration:.05 }, .64)
      .to(caps[1], { opacity:0, y:-30, duration:.04 }, .64)
      .fromTo('.d-model', { opacity:0, rotateX:58, y:80, scale:.72 }, { opacity:1, rotateX:0, y:0, scale:1, duration:.14, ease:'power2.out' }, .67)
      .fromTo(caps[2], { opacity:0, y:30 }, { opacity:1, y:0, duration:.05 }, .74)
      .to({}, { duration:.12 });
  }

  /* Canvas slow zoom */
  var cv = d.querySelector('.canvas img');
  if (cv) gsap.fromTo(cv, { scale:1.18 }, { scale:1, ease:'none', scrollTrigger:{ trigger:'.canvas', start:'top bottom', end:'bottom top', scrub:true } });

  /* 2 · 3D ring rotates with scroll */
  var ring = d.querySelector('.ring');
  if (ring){
    gsap.set(ring, { rotationX:-7 });
    gsap.fromTo(ring, { rotationY:18 }, { rotationY:-342, ease:'none', scrollTrigger:{ trigger:'.ringsec', start:'top top', end:'bottom bottom', scrub:.8 } });
    gsap.from('.ring-h', { opacity:0, y:40, scrollTrigger:{ trigger:'.ringsec', start:'top 60%', end:'top top', scrub:true } });
  }

  /* 3 · How big — dimensions */
  var big = d.querySelector('.bigsec');
  if (big){
    var bw = big.querySelector('.dim-w b'), bh = big.querySelector('.dim-h b'), o = { w:0, h:0 };
    var bt = gsap.timeline({ defaults:{ ease:'none' }, scrollTrigger:{ trigger:big, start:'top top', end:'bottom bottom', scrub:.5 } });
    bt.to('.big-q', { opacity:0, scale:.9, duration:.08 }, .1)
      .fromTo('.big-media', { scale:.22, opacity:0, rotateX:35 }, { scale:1, opacity:1, rotateX:0, duration:.32, ease:'power2.out' }, .12)
      .to('.bigsec .dim', { opacity:1, duration:.06 }, .44)
      .to(o, { w:18, h:12, duration:.22, onUpdate:function(){ bw.textContent = Math.round(o.w); bh.textContent = Math.round(o.h); } }, .46)
      .fromTo('.big-t', { opacity:0, y:40 }, { opacity:1, y:0, duration:.1 }, .66)
      .to({}, { duration:.2 });
  }

  /* 4 · Quality — extreme zoom */
  var q = d.querySelector('.qual');
  if (q){
    var qt = gsap.timeline({ defaults:{ ease:'none' }, scrollTrigger:{ trigger:q, start:'top top', end:'bottom bottom', scrub:.6 } });
    qt.to('.qual-zoom', { scale:3, duration:.5, ease:'power2.inOut' }, .12)
      .to('.q1', { opacity:0, y:-40, duration:.08 }, .22)
      .to('.qual-detail', { opacity:1, duration:.08 }, .58)
      .fromTo('.q2', { opacity:0, y:40 }, { opacity:1, y:0, duration:.08 }, .66)
      .fromTo('.qual-tech', { opacity:0, y:20 }, { opacity:1, y:0, duration:.08 }, .76)
      .to({}, { duration:.16 });
  }

  /* 5 · Can we build yours? */
  var can = d.querySelector('.can');
  if (can){
    var ws = can.querySelectorAll('.cw'), bgs = can.querySelectorAll('.can-bg img'), ctas = can.querySelectorAll('.can-cta'), last = -1, N = bgs.length, W = ws.length, K = W + .8;
    /* one word per "notch": each word owns an equal slice of the scroll and the scroll gently snaps to its centre */
    var snaps = []; for (var j = 0; j < W; j++) snaps.push(Math.min(1, (j + .5) / K));
    snaps[W - 1] = Math.min(1, (W - .5) / K + .2 / K);
    ST.create({ trigger:can, start:'top top', end:'bottom bottom',
      snap:{ snapTo:snaps, duration:{ min:.25, max:.6 }, delay:.12, ease:'power2.inOut', directional:false },
      onUpdate:function(s){
        var i = Math.min(W - 1, Math.floor(s.progress * K));
        if (i === last) return;
        ws.forEach(function(w, k){ w.classList.toggle('on', k === i); w.classList.toggle('out', k < i); });
        bgs.forEach(function(b, k){ b.classList.toggle('on', k === Math.min(i, N - 1)); });
        ctas.forEach(function(c, k){ c.classList.toggle('on', k === i); });
        last = i;
    }});
  }

  /* 6 · Timeline fill */
  var tlE = d.querySelector('.tl');
  if (tlE){
    var sts = tlE.querySelectorAll('.ts');
    gsap.to('.tl-fill', { width:'100%', ease:'none', scrollTrigger:{ trigger:tlE, start:'top 80%', end:'bottom 45%', scrub:true, onUpdate:function(s){
      sts.forEach(function(el, k){ el.classList.toggle('on', s.progress >= k / (sts.length - 1) - .02); });
    }}});
    ST.create({ trigger:tlE, start:'top 80%', onEnter:function(){ sts[0].classList.add('on'); } });
  }

  /* 7 · Chat messages arrive */
  var chat = d.querySelector('.chat');
  if (chat){
    ST.create({ trigger:'.phone', start:'top 70%', once:true, onEnter:function(){
      chat.querySelectorAll('.msg').forEach(function(m, k){ setTimeout(function(){ m.classList.add('on'); }, 350 + k * 900); });
    }});
  }

  /* Portfolio: staggered rise with slight 3D */
  gsap.utils.toArray('.pf').forEach(function(p, i){
    gsap.from(p, { opacity:0, y:80, rotateX:12, transformPerspective:900, duration:1.1, ease:'power3.out', delay:(i % 4) * .06, scrollTrigger:{ trigger:p, start:'top 92%' } });
  });

};
})();

if (window.__motionReady && !window.__v3done) window.__v3(window.__motionReady.gsap, window.__motionReady.ST);

/* ═══════════ v6: nav flyout hover-intent + in-place language switch ═══════════ */
(function(){
var d = document;
/* Flyout: stays open while the pointer is over the link OR the panel; closes with a short grace delay */
d.querySelectorAll('.has-fly').forEach(function(li){
  var t, open = function(){ clearTimeout(t); li.classList.add('open'); }, close = function(){ clearTimeout(t); t = setTimeout(function(){ li.classList.remove('open'); }, 260); };
  li.addEventListener('pointerenter', open); li.addEventListener('pointerleave', close);
  var fly = li.querySelector('.fly'); if (fly){ fly.addEventListener('pointerenter', open); fly.addEventListener('pointerleave', close); }
  li.addEventListener('focusin', open); li.addEventListener('focusout', function(e){ if (!li.contains(e.relatedTarget)) close(); });
  d.addEventListener('keydown', function(e){ if (e.key === 'Escape') li.classList.remove('open'); });
  li.querySelectorAll('.fly a').forEach(function(a){ a.addEventListener('click', function(){ li.classList.remove('open'); }); });
});
/* Language dropdown: click to toggle on touch */
d.querySelectorAll('.lang-btn').forEach(function(b){ b.addEventListener('click', function(e){ e.preventDefault(); b.parentElement.classList.toggle('open'); }); });
d.addEventListener('click', function(e){ d.querySelectorAll('.lang.open').forEach(function(l){ if (!l.contains(e.target)) l.classList.remove('open'); }); });

/* In-place language switch: fetch the other-language page and swap texts/attributes without reloading.
   Pages share the same template, so elements are matched in document order. Falls back to normal navigation. */
var SKIP_ATTR = { 'class':1, 'style':1, 'aria-expanded':1, 'aria-hidden':0 };
function elems(root){ return [].filter.call(root.querySelectorAll('*'), function(el){ return !el.classList.contains('pin-spacer') && !el.closest('.lb,.vm-dyn'); }); }
function syncAttrs(a, b){
  [].slice.call(a.attributes).forEach(function(at){ if (!SKIP_ATTR[at.name] && at.name !== 'aria-hidden' && !b.hasAttribute(at.name)) a.removeAttribute(at.name); });
  [].forEach.call(b.attributes, function(at){ if (SKIP_ATTR[at.name]) return; if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value); });
}
function syncText(a, b){
  var at = [].filter.call(a.childNodes, function(n){ return n.nodeType === 3; }), bt = [].filter.call(b.childNodes, function(n){ return n.nodeType === 3; });
  if (at.length === bt.length) at.forEach(function(n, i){ if (n.nodeValue !== bt[i].nodeValue) n.nodeValue = bt[i].nodeValue; });
}
function swap(url){
  return fetch(url, { credentials:'same-origin' }).then(function(r){ if (!r.ok) throw 0; return r.text(); }).then(function(html){
    var nd = new DOMParser().parseFromString(html, 'text/html');
    var parts = ['.gnav', '.mmenu', '.lnav', 'main', '.foot'];
    var pairs = [];
    for (var i = 0; i < parts.length; i++){
      var A = d.querySelector(parts[i]), B = nd.querySelector(parts[i]);
      if (!A && !B) continue; if (!A || !B) throw 0;
      var ea = [A].concat(elems(A)), eb = [B].concat(elems(B));
      if (ea.length !== eb.length) throw 0;
      for (var k = 0; k < ea.length; k++){ if (ea[k].tagName !== eb[k].tagName) throw 0; pairs.push([ea[k], eb[k]]); }
    }
    d.documentElement.classList.add('lang-swapping');
    setTimeout(function(){
      pairs.forEach(function(p){ syncAttrs(p[0], p[1]); syncText(p[0], p[1]); });
      d.title = nd.title; d.documentElement.lang = nd.documentElement.lang;
      ['meta[name="description"]', 'link[rel="canonical"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:url"]'].forEach(function(s){ var a = d.querySelector(s), b = nd.querySelector(s); if (a && b) syncAttrs(a, b); });
      var wa = d.querySelector('.wa'), wb = nd.querySelector('.wa'); if (wa && wb) syncAttrs(wa, wb);
      history.pushState({ tnbLang:true }, '', url);
      d.documentElement.classList.remove('lang-swapping');
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 180);
  });
}
if (location.protocol !== 'file:' && window.fetch && window.DOMParser){
  d.addEventListener('click', function(e){
    var a = e.target.closest('a[hreflang]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (a.getAttribute('aria-current') === 'true') { e.preventDefault(); return; }
    e.preventDefault();
    var href = a.href, lang = d.querySelector('.lang.open'); if (lang) lang.classList.remove('open');
    if (d.body.classList.contains('menu-open')) { var bg = d.querySelector('.burger'); if (bg) bg.click(); }
    swap(href).catch(function(){ location.href = href; });
  });
  window.addEventListener('popstate', function(){ location.reload(); });
}
})();
