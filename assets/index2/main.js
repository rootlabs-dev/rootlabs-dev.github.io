(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer:fine)');
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  let motion = !reducedMotion.matches;
  let lenis;
  let dirty = true;

  const started = performance.now();
  const loaderDigits = $('.loader-digits');
  function load(time) {
    const progress = Math.min(100, Math.round((time - started) / 6.5));
    loaderDigits.textContent = progress;
    if (progress < 100) requestAnimationFrame(load);
  }
  requestAnimationFrame(load);
  // Remove the entrance overlay so changing motion preferences cannot replay it.
  window.setTimeout(() => $('.loader')?.remove(), 1300);
  $('#year').textContent = new Date().getFullYear();
  function clock() {
    $('#local-time').textContent = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date()) + ' PHT';
  }
  clock();
  setInterval(clock, 60000);

  const hero = $('.hero');
  const heroStage = $('.hero-stage');
  const work = $('#work');
  const aboutStage = $('.about-stage');
  const contactStage = $('.contact-stage');
  const cards = $$('.project');
  const reveals = $$('.reveal');
  const menu = $('.menu-dialog');
  const detail = $('.project-dialog');
  const cursor = $('.cursor');
  let highlighted = -1;
  let activeProject = -1;
  let metrics = {};
  let width = innerWidth;
  let height = innerHeight;
  let mobile = width <= 600;

  // Observer transitions keep the content in its natural document flow.
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, { threshold: 0, rootMargin: '60px 0px 0px' });
  reveals.forEach(element => revealObserver.observe(element));

  function measure() {
    metrics = {
      heroTravel: Math.max(1, heroStage.offsetHeight - height),
      workTop: work.getBoundingClientRect().top + scrollY,
      workHeight: work.offsetHeight,
      aboutTop: aboutStage.offsetTop,
      contactTop: contactStage.offsetTop,
      end: Math.max(1, document.documentElement.scrollHeight - height)
    };
    dirty = true;
  }

  function openDialog(dialog) {
    dialog.showModal();
    lenis?.stop();
    document.body.style.overflow = 'hidden';
  }
  function closeDialog(dialog) { dialog.close(); }
  $('.menu-toggle').onclick = () => openDialog(menu);
  $$('dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close').onclick = () => closeDialog(dialog);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = '';
      lenis?.start();
      dirty = true;
    });
  });

  function filter(type) {
    $$('.filter').forEach(button => {
      const selected = button.dataset.filter === type;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', selected);
    });
    let index = 0;
    cards.forEach(card => {
      card.hidden = type !== 'all' && !card.dataset.type.split(' ').includes(type);
      if (!card.hidden) {
        card.dataset.side = index % 2 ? 'right' : 'left';
        // Filtering repacks the branches without leaving gaps in the grid.
        card.style.marginTop = !mobile && index % 2 ? (width <= 1100 ? '170px' : '220px') : '0';
        index++;
      }
    });
    highlighted = -1;
    measure();
    lenis?.resize();
  }
  $$('.filter').forEach(button => { button.onclick = () => filter(button.dataset.filter); });

  $$('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', event => {
    const target = $(anchor.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    if (menu.open) closeDialog(menu);
    if (anchor.dataset.category) filter(anchor.dataset.category);
    const destination = target === hero ? heroStage : target;
    if (lenis && motion) lenis.scrollTo(destination, { offset: target === hero ? 0 : -100, duration: 1.5 });
    else window.scrollTo({ top: destination.getBoundingClientRect().top + scrollY - (target === hero ? 0 : 90), behavior: 'instant' });
    history.replaceState(null, '', anchor.getAttribute('href'));
  }));

  const projects = [
    ['Rockwell Contact Tracing', 'Web app / Contact tracing', 'Healthbadge.co is a contact tracing system for Rockwell malls, built using minimal technology.', 'rockwell'],
    ['BooqBCD', 'Digital platform / Healthcare', 'An online platform connecting patients to healthcare providers for appointment scheduling anytime, anywhere.', 'booq'],
    ['Yanson Group of Bus Companies', 'Internal system / Operations', 'An internal management system built for the Yanson Group of Bus Companies.', 'ceres'],
    ['Eventstruct', 'Digital platform / Event management', 'Event management for modern teams. A streamlined platform to plan, organize, and run events efficiently.', 'eventstruct'],
    ['HOAnderful', 'Digital platform / Community management', 'Modern HOA management made simple and powerful. Everything a homeowners association needs in one place.', 'hoanderful']
  ];
  cards.forEach(card => {
    const id = Number(card.dataset.project);
    card.onclick = () => {
      const [name, category, description, image] = projects[id];
      $('#project-title').textContent = name;
      $('#project-category').textContent = category;
      $('#project-description').textContent = description;
      $('#project-image').src = 'assets/index2/images/' + image + '.webp';
      $('#project-image').alt = name + ' project preview';
      openDialog(detail);
    };
    const highlight = () => { highlighted = id; dirty = true; };
    const release = () => { highlighted = -1; dirty = true; };
    card.addEventListener('pointerenter', highlight);
    card.addEventListener('pointerleave', release);
    card.addEventListener('focus', highlight);
    card.addEventListener('blur', release);
  });

  // Cubic curves describe a real volume. Particles wrap around each branch's
  // tangent, so orbiting reveals separate limbs, roots, and a cylindrical trunk.
  let seed = 7041;
  function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  const vecMix = (a, b, t) => a.map((value, i) => mix(value, b[i], t));
  function curve(points, t) {
    const a = vecMix(points[0], points[1], t);
    const b = vecMix(points[1], points[2], t);
    const c = vecMix(points[2], points[3], t);
    return vecMix(vecMix(a, b, t), vecMix(b, c, t), t);
  }
  const trunk = [[0, .88, 0], [-.14, .44, .05], [.12, -.25, -.03], [0, -.97, 0]];
  const limbs = [];
  const roots = [];
  const particles = [];
  const air = [];
  const branchTips = [
    [-1.02, -.66, .08], [.98, -.52, .13], [-.78, -1.08, -.25],
    [.74, -1.05, -.22], [.16, -1.35, .18]
  ];
  function populate(path, count, radius, kind) {
    for (let i = 0; i < count; i++) {
      const t = random();
      const center = curve(path, t);
      const next = curve(path, Math.min(1, t + .005));
      const previous = curve(path, Math.max(0, t - .005));
      const tangent = next.map((value, axis) => value - previous[axis]);
      const length = Math.hypot(...tangent) || 1;
      const dir = tangent.map(value => value / length);
      // Two perpendicular vectors make a circular section around the limb.
      const normalLength = Math.hypot(dir[0], dir[1]) || 1;
      const normal = [-dir[1] / normalLength, dir[0] / normalLength, 0];
      const binormal = [-dir[2] * normal[1], dir[2] * normal[0], dir[0] * normal[1] - dir[1] * normal[0]];
      const angle = random() * Math.PI * 2;
      const r = radius * (1 - t * .75) * (.45 + random() * .55);
      const position = center.map((value, axis) => value + r * (Math.cos(angle) * normal[axis] + Math.sin(angle) * binormal[axis]));
      particles.push({ position, phase: random() * Math.PI * 2, size: .45 + random() * .95, light: .4 + random() * .6, kind });
    }
  }
  populate(trunk, 1200, .085, 0);
  branchTips.forEach((tip, index) => {
    const start = curve(trunk, .4 + index * .09);
    const path = [start, [start[0] + tip[0] * .15, start[1] - .2, tip[2] * .3], [tip[0] * .7, tip[1] + .02, tip[2] + .2], tip];
    limbs.push(path);
    populate(path, 540, .058, 1);
    for (let twig = 0; twig < 5; twig++) {
      const origin = curve(path, .35 + twig * .12);
      const theta = twig * 2.4 + index * 1.7;
      const end = [origin[0] + Math.cos(theta) * (.22 + twig * .026), origin[1] - .24 - random() * .21, origin[2] + Math.sin(theta) * .4];
      const twigPath = [origin, [origin[0], origin[1] - .13, origin[2]], [end[0], end[1] + .12, end[2]], end];
      limbs.push(twigPath);
      populate(twigPath, 100, .024, 2);
    }
  });
  for (let index = 0; index < 11; index++) {
    const theta = index / 11 * Math.PI * 2;
    const reach = .52 + random() * .45;
    const path = [[0, .88, 0], [Math.cos(theta) * .15, 1.02, Math.sin(theta) * .17], [Math.cos(theta) * reach * .7, 1.15, Math.sin(theta) * reach * .7], [Math.cos(theta) * reach, 1.2 + random() * .15, Math.sin(theta) * reach]];
    roots.push(path);
    populate(path, 210, .04, 3);
  }
  for (let index = 0; index < 210; index++) {
    air.push({ position: [(random() - .5) * 4.7, (random() - .5) * 3.7, (random() - .5) * 3], size: .3 + random() * .8, phase: random() * 6.28 });
  }

  const canvas = $('#sculpture');
  const context = canvas.getContext('2d', { alpha: true });
  let pointer = { x: 0, y: 0 };
  let easedPointer = { x: 0, y: 0 };
  let elapsed = 0;
  let lastFrame = 0;
  let camera;
  let workBlend = 0;
  let departure = 0;
  let cardTargets = [];
  let lastChapter = '';

  function resize() {
    width = innerWidth;
    height = innerHeight;
    mobile = width <= 600;
    const ratio = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    filter($('.filter.active').dataset.filter);
    measure();
    updateScene();
    draw();
  }

  function updateScene() {
    const y = scrollY;
    const travel = motion ? clamp(y / metrics.heroTravel) : 0;
    workBlend = smooth((y - metrics.workTop + height) / (height * .92));
    departure = smooth((y - metrics.aboutTop + height * .75) / height);
    const endBlend = smooth((y - metrics.contactTop + height * .7) / height);
    const heroExit = motion ? smooth((travel - .08) / .9) : 0;
    hero.style.opacity = 1 - heroExit;
    hero.style.transform = motion ? `translate3d(0,${-heroExit * height * .15}px,0) scale(${1 - heroExit * .08})` : '';
    hero.style.pointerEvents = heroExit > .98 ? 'none' : '';
    hero.inert = heroExit > .98;
    $('.scene-world').style.opacity = mix(1, .42, departure);
    document.documentElement.style.setProperty('--scene-progress', clamp(y / metrics.end));
    const chapter = endBlend > .35 ? '04 — Grow together' : departure > .3 ? '03 — At our core' : workBlend > .65 ? '02 — The branches' : '01 — Take root';
    if (chapter !== lastChapter) { $('#scene-name').textContent = chapter; lastChapter = chapter; }

    // The camera pushes into the crown, orbits, then settles between the work.
    const push = motion ? Math.sin(travel * Math.PI) * .32 * (1 - workBlend) : 0;
    const baseSize = Math.min(width * (mobile ? .37 : .285), height * (mobile ? .265 : .25));
    const workSize = Math.min(width * (mobile ? .25 : .225), height * .255);
    camera = {
      x: mix(width * (mobile ? .65 : .715), width * (mobile ? .11 : .5), workBlend) - departure * width * .23,
      y: mix(height * (mobile ? .66 : .53), height * .52, workBlend) + departure * height * .23,
      scale: mix(baseSize * (1 + push), workSize, workBlend) * (1 + departure * .35),
      yaw: -.3 + (motion ? Math.sin(elapsed * .17) * .24 + travel * .72 + workBlend * .34 + easedPointer.x * .32 : .2),
      pitch: -.06 + (motion ? easedPointer.y * .13 + push * .26 - departure * .16 : 0),
      alpha: 1 - departure * .45
    };
    camera.cy = Math.cos(camera.yaw); camera.sy = Math.sin(camera.yaw);
    camera.cp = Math.cos(camera.pitch); camera.sp = Math.sin(camera.pitch);

    cardTargets = [];
    let nearest = -1;
    let distance = Infinity;
    cards.forEach(card => {
      if (card.hidden) return;
      const node = card.querySelector('.branch-node').getBoundingClientRect();
      const cy = node.top + node.height / 2;
      if (cy < -height * .4 || cy > height * 1.4) return;
      const id = Number(card.dataset.project);
      cardTargets.push({ id, x: node.left + node.width / 2, y: cy, side: mobile || card.dataset.side === 'right' ? 1 : -1 });
      if (Math.abs(cy - height * .52) < distance) { distance = Math.abs(cy - height * .52); nearest = id; }
    });
    const nextActive = highlighted >= 0 ? highlighted : nearest;
    if (nextActive !== activeProject) {
      activeProject = nextActive;
      cards.forEach(card => card.classList.toggle('is-active', Number(card.dataset.project) === activeProject));
    }
  }

  function project(position, sway = 0) {
    const [x, y, z] = position;
    const rx = (x + sway) * camera.cy + z * camera.sy;
    const rz = -(x + sway) * camera.sy + z * camera.cy;
    const ry = y * camera.cp - rz * camera.sp;
    const depth = y * camera.sp + rz * camera.cp;
    const perspective = 3.8 / (3.8 - depth);
    return { x: camera.x + rx * camera.scale * perspective, y: camera.y + ry * camera.scale * perspective, depth, perspective };
  }

  function trace(points) {
    context.beginPath();
    points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
  }
  function projectedPath(path, count = 36) {
    return Array.from({ length: count }, (_, index) => project(curve(path, index / (count - 1))));
  }
  function pointAlong(points, progress) {
    // Arc-length parameterization keeps pulses steady through long connections.
    const lengths = [0];
    for (let index = 1; index < points.length; index++) lengths.push(lengths[index - 1] + Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y));
    const target = lengths[lengths.length - 1] * clamp(progress);
    let index = 1;
    while (index < lengths.length - 1 && lengths[index] < target) index++;
    const t = (target - lengths[index - 1]) / (lengths[index] - lengths[index - 1] || 1);
    return { x: mix(points[index - 1].x, points[index].x, t), y: mix(points[index - 1].y, points[index].y, t) };
  }

  function drawConnections() {
    if (workBlend < .02 || departure > .98) return;
    cardTargets.forEach(target => {
      const lit = target.id === activeProject;
      const rootPath = projectedPath(roots[(target.id * 2 + 1) % roots.length]).reverse();
      const trunkPart = Array.from({ length: 27 }, (_, index) => project(curve(trunk, index / 26 * (.4 + target.id * .09))));
      const limb = projectedPath(limbs[target.id * 6]);
      const tip = limb[limb.length - 1];
      const branch = [tip, { x: tip.x + target.side * width * .07, y: tip.y }, { x: target.x - target.side * width * .065, y: target.y }, target];
      const extension = Array.from({ length: 34 }, (_, index) => {
        const t = index / 33, u = 1 - t;
        return { x: u*u*u*branch[0].x + 3*u*u*t*branch[1].x + 3*u*t*t*branch[2].x + t*t*t*branch[3].x,
          y: u*u*u*branch[0].y + 3*u*u*t*branch[1].y + 3*u*t*t*branch[2].y + t*t*t*branch[3].y };
      });
      const points = [...rootPath, ...trunkPart, ...limb, ...extension];
      const opacity = workBlend * (1 - departure) * (lit ? .86 : .18);
      context.globalAlpha = opacity;
      trace(points);
      context.strokeStyle = lit ? '#91f5d8' : '#629d9a';
      context.lineWidth = lit ? 1.25 : .7;
      context.shadowBlur = lit ? 12 : 0;
      context.shadowColor = '#61f5ce';
      context.stroke();
      if (lit) {
        context.globalAlpha = opacity * .11;
        context.lineWidth = 7;
        context.stroke();
        if (motion) {
          const progress = (elapsed * .21 + target.id * .19) % 1;
          // A short trail makes the direction from roots to project legible.
          for (let tail = 9; tail >= 0; tail--) {
            const position = pointAlong(points, ((progress - tail * .006) % 1 + 1) % 1);
            context.globalAlpha = opacity * (1 - tail / 10);
            context.beginPath();
            context.arc(position.x, position.y, tail ? 1.35 : 2.7, 0, Math.PI * 2);
            context.fillStyle = '#e1fff5';
            context.fill();
          }
        }
      }
      context.shadowBlur = 0;
    });
    context.globalAlpha = 1;
  }

  function draw() {
    if (!context || !camera) return;
    context.clearRect(0, 0, width, height);
    const glow = context.createRadialGradient(camera.x, camera.y - camera.scale * .25, 0, camera.x, camera.y, camera.scale * 1.8);
    glow.addColorStop(0, '#275d5922'); glow.addColorStop(.5, '#12384312'); glow.addColorStop(1, '#080b1000');
    context.fillStyle = glow; context.fillRect(0, 0, width, height);

    // Ground ellipse and its far rim anchor the roots in space.
    context.globalAlpha = .24 * camera.alpha;
    context.strokeStyle = '#467d78'; context.lineWidth = .6;
    const ground = Array.from({ length: 81 }, (_, index) => {
      const angle = index / 80 * Math.PI * 2;
      return project([Math.cos(angle) * 1.02, 1.3, Math.sin(angle) * 1.02]);
    });
    trace(ground); context.stroke();
    context.globalAlpha = .12 * camera.alpha;
    [trunk, ...limbs, ...roots].forEach(path => { trace(projectedPath(path, 20)); context.stroke(); });

    const visible = [];
    const stride = mobile ? 3 : 1;
    for (let index = 0; index < particles.length; index += stride) {
      const particle = particles[index];
      const sway = motion ? Math.sin(elapsed * .65 + particle.position[1] * 2 + particle.phase * .1) * .012 * Math.max(0, -particle.position[1]) : 0;
      const projected = project(particle.position, sway);
      if (projected.x < -5 || projected.x > width + 5 || projected.y < -5 || projected.y > height + 5) continue;
      visible.push({ ...projected, particle });
    }
    // Far particles draw first; depth controls brightness, tint and point size.
    visible.sort((a, b) => a.depth - b.depth);
    for (const point of visible) {
      const particle = point.particle;
      const depthLight = clamp((point.depth + 1.2) / 2.4);
      const flicker = motion ? .85 + .15 * Math.sin(elapsed * 1.3 + particle.phase) : 1;
      context.globalAlpha = (.18 + depthLight * .72) * particle.light * flicker * camera.alpha;
      context.fillStyle = depthLight > .65 ? '#b5ffe1' : depthLight > .4 ? '#67d6be' : '#4a7997';
      const radius = Math.max(.45, particle.size * point.perspective * camera.scale / 230);
      context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2); context.fill();
      if (particle.light > .985) {
        context.globalAlpha *= .13;
        context.beginPath(); context.arc(point.x, point.y, radius * 4, 0, Math.PI * 2); context.fill();
      }
    }
    context.fillStyle = '#9bd6d2';
    air.forEach(particle => {
      const position = [...particle.position];
      if (motion) position[1] += Math.sin(elapsed * .12 + particle.phase) * .12;
      const point = project(position);
      context.globalAlpha = .1 + .15 * (motion ? (1 + Math.sin(elapsed * .4 + particle.phase)) / 2 : .5);
      context.beginPath(); context.arc(point.x, point.y, particle.size * point.perspective, 0, Math.PI * 2); context.fill();
    });
    context.globalAlpha = 1;
    drawConnections();
  }

  function setMotion(enabled) {
    motion = enabled;
    document.documentElement.classList.toggle('motion-enabled', enabled);
    document.body.classList.toggle('motion-paused', !enabled);
    $('.motion-toggle').textContent = 'Motion: ' + (enabled ? 'on' : 'off');
    $('.motion-toggle').setAttribute('aria-pressed', !enabled);
    if (enabled && window.Lenis && !lenis) lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (!enabled) { lenis?.destroy(); lenis = null; cursor.style.opacity = '0'; }
    if ((menu.open || detail.open) && lenis) lenis.stop();
    measure();
    updateScene();
    draw();
  }
  $('.motion-toggle').onclick = () => setMotion(!motion);
  reducedMotion.addEventListener('change', event => setMotion(!event.matches));
  document.addEventListener('pointermove', event => {
    if (finePointer.matches) {
      cursor.style.left = event.clientX + 'px'; cursor.style.top = event.clientY + 'px';
      cursor.style.opacity = motion ? '1' : '0';
      pointer = { x: event.clientX / width - .5, y: event.clientY / height - .5 };
    }
  }, { passive: true });
  document.addEventListener('pointerover', event => cursor.classList.toggle('hover', !!event.target.closest('a,button')));
  document.addEventListener('pointerout', event => {
    if (!event.relatedTarget) { pointer = { x: 0, y: 0 }; cursor.style.opacity = '0'; }
  });
  document.addEventListener('focusin', event => {
    if (hero.contains(event.target)) {
      hero.inert = false; hero.style.opacity = '1';
    }
  });
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', () => { dirty = true; }, { passive: true });
  document.addEventListener('visibilitychange', () => { lastFrame = 0; dirty = true; });
  document.fonts?.ready.then(measure);
  new ResizeObserver(measure).observe(work);

  function frame(time) {
    lenis?.raf(time);
    if (!document.hidden && (dirty || motion) && time - lastFrame >= (mobile ? 40 : 30)) {
      const delta = Math.min((time - lastFrame) / 1000 || .03, .065);
      if (motion && !menu.open && !detail.open) elapsed += delta;
      easedPointer.x = mix(easedPointer.x, pointer.x, .06);
      easedPointer.y = mix(easedPointer.y, pointer.y, .06);
      updateScene();
      draw();
      lastFrame = time;
      dirty = false;
    }
    requestAnimationFrame(frame);
  }
  resize();
  setMotion(motion);
  requestAnimationFrame(frame);
})();
