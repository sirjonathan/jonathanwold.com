(function () {
  if (typeof gsap === 'undefined') return;

  const link = document.querySelector('.portal-link');
  const wrapper = document.querySelector('#background-wrapper');
  if (!link || !wrapper) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const overlay = document.createElement('div');
  overlay.className = 'warp-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="warp-vignette"></div>
    <div class="warp-particles"></div>
    <div class="warp-fade"></div>
  `;
  document.body.appendChild(overlay);

  const vignette = overlay.querySelector('.warp-vignette');
  const particlesLayer = overlay.querySelector('.warp-particles');
  const fade = overlay.querySelector('.warp-fade');

  const PARTICLE_COUNT = 60;
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('span');
    p.className = 'warp-particle';
    particlesLayer.appendChild(p);
    particles.push(p);
  }

  const MAP_W = 400;
  const MAP_H = 300;
  const MAX_SCALE = 360;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const XLINK_NS = 'http://www.w3.org/1999/xlink';
  const FLAG_KEY = 'portalWarpIn';

  function pinchMapDataURL(w, h, cx, cy) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const maxR = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(w - cx, cy),
      Math.hypot(cx, h - cy),
      Math.hypot(w - cx, h - cy)
    );
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = cx - x;
        const dy = cy - y;
        const r = Math.hypot(dx, dy) || 1;
        const t = r / maxR;
        const strength = Math.sin(t * Math.PI);
        const i = (y * w + x) * 4;
        d[i]     = 128 - Math.round((dx / r) * strength * 127);
        d[i + 1] = 128 - Math.round((dy / r) * strength * 127);
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function buildPinchFilter(dataUrl) {
    const prev = document.getElementById('portal-pinch-svg');
    if (prev) prev.remove();

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('id', 'portal-pinch-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';

    const defs = document.createElementNS(SVG_NS, 'defs');
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', 'portal-pinch');
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', '100%');
    filter.setAttribute('height', '100%');

    const feImage = document.createElementNS(SVG_NS, 'feImage');
    feImage.setAttribute('result', 'map');
    feImage.setAttribute('preserveAspectRatio', 'none');
    feImage.setAttribute('href', dataUrl);
    feImage.setAttributeNS(XLINK_NS, 'xlink:href', dataUrl);

    const feDisp = document.createElementNS(SVG_NS, 'feDisplacementMap');
    feDisp.setAttribute('id', 'portal-pinch-disp');
    feDisp.setAttribute('in', 'SourceGraphic');
    feDisp.setAttribute('in2', 'map');
    feDisp.setAttribute('scale', '0');
    feDisp.setAttribute('xChannelSelector', 'R');
    feDisp.setAttribute('yChannelSelector', 'G');

    filter.appendChild(feImage);
    filter.appendChild(feDisp);
    defs.appendChild(filter);
    svg.appendChild(defs);
    document.body.appendChild(svg);

    return feDisp;
  }

  function portalCoords() {
    const wrapperRect = wrapper.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const cx = linkRect.left + linkRect.width / 2;
    const cy = linkRect.top + linkRect.height / 2;
    const relX = (cx - wrapperRect.left) / wrapperRect.width;
    const relY = (cy - wrapperRect.top) / wrapperRect.height;
    return { cx, cy, relX, relY };
  }

  function installFilter(relX, relY) {
    const url = pinchMapDataURL(MAP_W, MAP_H, relX * MAP_W, relY * MAP_H);
    return buildPinchFilter(url);
  }

  let warping = false;

  link.addEventListener('click', function (e) {
    e.preventDefault();
    if (warping) return;
    warping = true;

    const href = link.getAttribute('href');
    const { cx, cy, relX, relY } = portalCoords();
    const displaceNode = installFilter(relX, relY);

    overlay.style.setProperty('--warp-x', cx + 'px');
    overlay.style.setProperty('--warp-y', cy + 'px');
    overlay.classList.add('is-active');
    wrapper.style.filter = 'url(#portal-pinch)';

    try { sessionStorage.setItem(FLAG_KEY, '1'); } catch (_) {}

    const DUR = 1.7;
    const tl = gsap.timeline({
      onComplete: function () { window.location.href = href; }
    });

    tl.to(displaceNode, { attr: { scale: MAX_SCALE }, duration: DUR, ease: 'power3.in' }, 0);
    tl.to(vignette, { opacity: 1, duration: DUR * 0.8, ease: 'power2.in' }, 0);
    tl.to(fade, { opacity: 1, duration: 0.55, ease: 'power2.in' }, DUR - 0.55);

    particles.forEach(function (p) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 350 + Math.random() * 700;
      const delay = Math.random() * 0.4;
      const dur = 0.9 + Math.random() * 0.5;

      gsap.set(p, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0 });
      tl.to(p, { opacity: 1, duration: 0.25, delay: delay }, 0);
      tl.to(p, { x: 0, y: 0, duration: dur, ease: 'power3.in', delay: delay }, 0);
      tl.to(p, { opacity: 0, duration: 0.15 }, delay + dur - 0.08);
    });
  });

  let inbound = false;
  try { inbound = !!sessionStorage.getItem(FLAG_KEY); } catch (_) {}
  if (inbound) {
    try { sessionStorage.removeItem(FLAG_KEY); } catch (_) {}

    const { cx, cy, relX, relY } = portalCoords();
    const displaceNode = installFilter(relX, relY);
    displaceNode.setAttribute('scale', String(MAX_SCALE));

    overlay.style.setProperty('--warp-x', cx + 'px');
    overlay.style.setProperty('--warp-y', cy + 'px');
    overlay.classList.add('is-active');
    wrapper.style.filter = 'url(#portal-pinch)';
    gsap.set(vignette, { opacity: 1 });
    gsap.set(fade, { opacity: 1 });
    document.documentElement.classList.remove('warp-inbound');

    const DUR = 1.4;
    const tl = gsap.timeline({
      onComplete: function () {
        wrapper.style.filter = '';
        overlay.classList.remove('is-active');
      }
    });

    tl.to(fade, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0);
    tl.to(displaceNode, { attr: { scale: 0 }, duration: DUR, ease: 'power2.out' }, 0);
    tl.to(vignette, { opacity: 0, duration: DUR, ease: 'power2.out' }, 0.1);

    particles.forEach(function (p) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 350 + Math.random() * 700;
      const delay = Math.random() * 0.2;
      const dur = 0.8 + Math.random() * 0.4;

      gsap.set(p, { x: 0, y: 0, opacity: 0 });
      tl.to(p, { opacity: 1, duration: 0.2, delay: delay }, 0);
      tl.to(p, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        duration: dur,
        ease: 'power3.out',
        delay: delay
      }, 0);
      tl.to(p, { opacity: 0, duration: 0.25 }, delay + dur - 0.15);
    });
  }
})();
