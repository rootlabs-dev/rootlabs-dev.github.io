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
  const heroTreeSpace = $('.hero-tree-space');
  const phoneLayout = matchMedia('(max-width: 600px), (max-width: 950px) and (max-height: 500px)');
  const heroStage = $('.hero-stage');
  const work = $('#work');
  const workStage = $('.work-stage');
  const aboutStage = $('.about-stage');
  const contactStage = $('.contact-stage');
  const gallery = $('.project-gallery');
  const workTree = $('.work-tree');
  const projectPanels = $$('.project-panel');
  const projectChoices = $$('.work-choice');
  const reveals = $$('.reveal');
  const menu = $('.menu-dialog');
  const detail = $('.project-dialog');
  const cursor = $('.cursor');
  let activeProject = 0;
  let treeRotation = 0;
  let treePitch = 0;
  let branchColor = '#a9daed';
  let metrics = {};
  let width = innerWidth;
  let height = innerHeight;
  let mobile = phoneLayout.matches;
  let savedScroll = null;

  // Observer transitions keep the content in its natural document flow.
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, { threshold: 0, rootMargin: '60px 0px 0px' });
  reveals.forEach(element => revealObserver.observe(element));

  function measure() {
    const treeSpace = heroTreeSpace.getBoundingClientRect();
    const galleryTree = workTree.getBoundingClientRect();
    metrics = {
      heroTravel: Math.max(1, mobile ? hero.offsetHeight : heroStage.offsetHeight - height),
      treeTop: treeSpace.top + scrollY,
      treeX: treeSpace.left + treeSpace.width / 2,
      treeHeight: treeSpace.height,
      treeWidth: treeSpace.width,
      workTop: workStage.getBoundingClientRect().top + scrollY,
      workHeight: workStage.offsetHeight,
      workTravel: Math.max(1, workStage.offsetHeight - height),
      workTreeSize: Math.min(galleryTree.width / 3.8, (galleryTree.height - 35) / 4),
      aboutTop: aboutStage.offsetTop,
      contactTop: contactStage.offsetTop,
      footerTop: $('footer').getBoundingClientRect().top + scrollY,
      headerHeight: $('.header').offsetHeight,
      end: Math.max(1, document.documentElement.scrollHeight - height)
    };
    dirty = true;
  }

  function openDialog(dialog) {
    savedScroll = scrollY;
    lenis?.stop();
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = -savedScroll + 'px';
    document.body.style.width = '100%';
    dialog.showModal();
    dialog.scrollTop = 0;
  }
  function unlockPage() {
    if (savedScroll === null || menu.open || detail.open) return;
    const y = savedScroll;
    savedScroll = null;
    ['overflow', 'position', 'top', 'width'].forEach(property => { document.body.style[property] = ''; });
    window.scrollTo({ top: y, behavior: 'instant' });
    lenis?.start();
    smoothY = scrollY;
    measure();
  }
  function closeDialog(dialog) { dialog.close(); unlockPage(); }
  $('.menu-toggle').onclick = () => openDialog(menu);
  $$('dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close').onclick = () => closeDialog(dialog);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
    dialog.addEventListener('close', unlockPage);
  });

  function setActiveProject(id, revealChoice = true) {
    activeProject = (id + projectPanels.length) % projectPanels.length;
    projectChoices.forEach((button, index) => button.setAttribute('aria-pressed', index === activeProject));
    const selected = projectChoices[activeProject];
    gallery.dataset.theme = projectPanels[activeProject].dataset.theme;
    branchColor = getComputedStyle(gallery).getPropertyValue('--project-accent').trim();
    $('#work-current').textContent = String(activeProject + 1).padStart(2, '0');
    $('#work-announcement').textContent = ' — ' + selected.querySelector('.choice-name').textContent;
    // Only move the horizontal selector strip as the current project changes.
    const strip = $('.work-choices');
    if (revealChoice && strip.scrollWidth > strip.clientWidth) {
      const left = selected.offsetLeft - strip.offsetLeft - (strip.clientWidth - selected.offsetWidth) / 2;
      strip.scrollTo({ left, behavior: motion ? 'smooth' : 'instant' });
    }
    dirty = true;
  }
  function selectProject(id) {
    const next = (id + projectPanels.length) % projectPanels.length;
    if (document.documentElement.classList.contains('cinematic-work')) {
      const destination = metrics.workTop + metrics.workTravel * (next + .2) / projectPanels.length;
      if (lenis) lenis.scrollTo(destination, { duration: 1.2 });
      else window.scrollTo({ top: destination, behavior: 'instant' });
      return;
    }
    const browser = $('.work-browser');
    const pinned = getComputedStyle(browser).position === 'sticky';
    const stacked = matchMedia('(max-width: 900px)').matches;
    const offset = -(metrics.headerHeight + (stacked && pinned ? browser.offsetHeight : 0) + 24);
    if (lenis && motion) lenis.scrollTo(projectPanels[next], { offset, duration: 1.2 });
    else window.scrollTo({ top: projectPanels[next].getBoundingClientRect().top + scrollY + offset, behavior: 'instant' });
    setActiveProject(next);
  }
  projectChoices.forEach((button, index) => {
    button.addEventListener('click', () => selectProject(index));
    button.addEventListener('keydown', event => {
      const directions = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
      let next;
      if (event.key in directions) next = (index + directions[event.key] + projectChoices.length) % projectChoices.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = projectChoices.length - 1;
      else return;
      event.preventDefault();
      selectProject(next);
      projectChoices[next].focus({ preventScroll: true });
    });
  });
  $$('.gallery-step').forEach(button => button.addEventListener('click', () => selectProject(activeProject + Number(button.dataset.step))));
  gallery.classList.add('gallery-ready');

  // The same particle tree moves into the gallery. Direct rotation also works
  // with ambient motion disabled, and vertical touch gestures still scroll.
  let treeDrag;
  workTree.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    treeDrag = { x: event.clientX, rotation: treeRotation, id: event.pointerId };
    workTree.setPointerCapture(event.pointerId);
    workTree.classList.add('is-dragging');
  });
  workTree.addEventListener('pointermove', event => {
    if (!treeDrag || event.pointerId !== treeDrag.id) return;
    treeRotation = treeDrag.rotation + (event.clientX - treeDrag.x) * .012;
    dirty = true;
  });
  const releaseTree = () => { treeDrag = null; workTree.classList.remove('is-dragging'); };
  workTree.addEventListener('pointerup', releaseTree);
  workTree.addEventListener('pointercancel', releaseTree);
  workTree.addEventListener('lostpointercapture', releaseTree);
  workTree.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') treeRotation -= .25;
    if (event.key === 'ArrowRight') treeRotation += .25;
    if (event.key === 'ArrowUp') treePitch = clamp(treePitch - .1, -.5, .5);
    if (event.key === 'ArrowDown') treePitch = clamp(treePitch + .1, -.5, .5);
    if (event.key === 'Home') { treeRotation = 0; treePitch = 0; }
    dirty = true;
  });

  $$('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', event => {
    const target = $(anchor.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    if (menu.open) closeDialog(menu);
    if (anchor.dataset.category) { selectProject(anchor.dataset.category === 'platform' ? 1 : 0); history.replaceState(null, '', '#work'); return; }
    const destination = target === hero ? heroStage : target;
    const offset = target === hero ? 0 : -($('.header').getBoundingClientRect().height + 16);
    if (lenis && motion) lenis.scrollTo(destination, { offset, duration: 1.5 });
    else window.scrollTo({ top: destination.getBoundingClientRect().top + scrollY + offset, behavior: 'instant' });
    history.replaceState(null, '', anchor.getAttribute('href'));
  }));

  const projects = [
    ['Rockwell Contact Tracing', 'Web app / Contact tracing', 'Healthbadge.co is a contact tracing system for Rockwell malls, built using minimal technology.', 'rockwell'],
    ['BooqBCD', 'Digital platform / Healthcare', 'An online platform connecting patients to healthcare providers for appointment scheduling anytime, anywhere.', 'booq'],
    ['Yanson Group of Bus Companies', 'Internal system / Operations', 'An internal management system built for the Yanson Group of Bus Companies.', 'ceres'],
    ['Eventstruct', 'Digital platform / Event management', 'Event management for modern teams. A streamlined platform to plan, organize, and run events efficiently.', 'eventstruct'],
    ['HOAnderful', 'Digital platform / Community management', 'Modern HOA management made simple and powerful. Everything a homeowners association needs in one place.', 'hoanderful']
  ];
  $$('.project-detail').forEach(button => {
    button.addEventListener('click', () => {
      const [name, category, description, image] = projects[Number(button.dataset.project)];
      $('#project-title').textContent = name;
      $('#project-category').textContent = category;
      $('#project-description').textContent = description;
      $('#project-image').src = 'assets/index2/images/' + image + '.webp';
      $('#project-image').alt = name + ' project preview';
      openDialog(detail);
    });
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
  const primaryLimbs = [];
  const roots = [];
  const rootlets = [];
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
    primaryLimbs.push(path);
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
    const bend = (index % 2 ? 1 : -1) * (.5 + random() * .4);
    const radial = (distance, angle, y) => [Math.cos(angle) * distance, y, Math.sin(angle) * distance];
    // Off-axis handles give each root a winding, uneven sweep across the ground.
    const path = [trunk[0], radial(reach * .36, theta + bend, .96 + random() * .14),
      radial(reach * .72, theta - bend, 1.34 + random() * .12),
      radial(reach, theta + bend * .2, 1.18 + random() * .17)];
    roots.push(path);
    populate(path, 210, .04, 3);
    for (let fork = 0; fork < 2; fork++) {
      const t = .46 + fork * .24;
      const origin = curve(path, t);
      const direction = curve(path, t + .06).map((value, axis) => value - origin[axis]);
      const angle = theta + (fork ? -1 : 1) * (.5 + random() * .4);
      const end = radial(reach * (.85 + random() * .3), angle, 1.27 + random() * .13);
      const forkPath = [origin, origin.map((value, axis) => value + direction[axis] * 2),
        radial(reach * .82, angle + bend * .35, end[1] + .06), end];
      rootlets.push(forkPath);
      populate(forkPath, 72, .018, 3);
    }
  }
  for (let index = 0; index < 210; index++) {
    air.push({ position: [(random() - .5) * 4.7, (random() - .5) * 3.7, (random() - .5) * 3], size: .3 + random() * .8, phase: random() * 6.28 });
  }

  // Overlapping rings of boughs give the crown the logo's broad, rounded shape.
  // Branches fill the front and back too, so the silhouette stays full in orbit.
  const crownStart = limbs.length;
  const crownLayers = [
    { count: 9, radius: 1.04, y: -.48, attachment: .43 },
    { count: 10, radius: 1.02, y: -.94, attachment: .59 },
    { count: 7, radius: .64, y: -1.34, attachment: .76 }
  ];
  crownLayers.forEach((layer, level) => {
    for (let index = 0; index < layer.count; index++) {
      const angle = index / layer.count * Math.PI * 2 + level * 1.17;
      const reach = layer.radius * (.94 + random() * .12);
      const origin = curve(trunk, layer.attachment + (random() - .5) * .06);
      const end = [Math.cos(angle) * reach, layer.y + (random() - .5) * .1, Math.sin(angle) * reach];
      const path = [origin, [origin[0] + end[0] * .18, origin[1] - .18, origin[2] + end[2] * .18],
        [end[0] * .75, end[1] + .06, end[2] * .75], end];
      limbs.push(path);
      populate(path, 95, .032 - level * .005, 1);
      for (let fork = 0; fork < 3; fork++) {
        const t = .5 + fork * .19;
        const start = curve(path, t);
        const turn = angle + (fork % 2 ? -1 : 1) * (.65 + random() * .45);
        const spread = .18 + random() * .1;
        const tip = [start[0] + Math.cos(turn) * spread, start[1] - .1 - random() * .13,
          start[2] + Math.sin(turn) * spread];
        const twigPath = [start, vecMix(start, curve(path, t + .1), .8),
          [tip[0], tip[1] + .07, tip[2]], tip];
        limbs.push(twigPath);
        populate(twigPath, 32, .014, 2);
      }
    }
  });

  // Leaf clusters grow out of the outer twigs and finer crown branches.
  // Each leaf keeps its twig anchor so a stem can visibly attach it to
  // real wood instead of floating disconnected in the canopy.
  limbs.forEach((path, limbIndex) => {
    // 20% fewer leaves than the original density for a faster frame rate.
    const leafCount = limbIndex < crownStart ? 34 : 26;
    for (let index = 0; index < leafCount; index++) {
      const center = curve(path, .72 + random() * .28);
      const azimuth = random() * Math.PI * 2;
      const elevation = random() * 2 - 1;
      const spread = Math.cbrt(random());
      const ring = Math.sqrt(1 - elevation * elevation) * spread;
      const position = [
        center[0] + Math.cos(azimuth) * ring * .14,
        center[1] + elevation * spread * .1 - .02,
        center[2] + Math.sin(azimuth) * ring * .13
      ];
      const angle = random() * Math.PI * 2;
      const tilt = (random() - .5) * 1.4;
      // Leaves run 20% larger than the original size for a fuller canopy.
      const length = .0264 + random() * .0264;
      // Each leaf has its own plane in 3D, so it turns edge-on as we orbit.
      const axis = [Math.cos(angle) * Math.cos(tilt), Math.sin(angle), Math.cos(angle) * Math.sin(tilt)];
      const across = [-Math.sin(angle) * Math.cos(tilt), Math.cos(angle), -Math.sin(angle) * Math.sin(tilt)];
      particles.push({
        position, anchor: center, sun: clamp((.1 - position[1]) / 1.5),
        phase: random() * Math.PI * 2, size: 1,
        light: .55 + random() * .45, kind: 4,
        tip: axis.map(value => value * length),
        edge: across.map(value => value * length * .55)
      });
    }
  });

  const canvas = $('#sculpture');
  const context = canvas.getContext('2d', { alpha: true });
  const connectionCanvas = $('#project-connections');
  const connectionContext = connectionCanvas.getContext('2d', { alpha: true });
  const workTreeCanvas = $('.work-tree-canvas');
  const workTreeContext = workTreeCanvas.getContext('2d', { alpha: true });
  let pointer = { x: 0, y: 0 };
  let easedPointer = { x: 0, y: 0 };
  let elapsed = 0;
  let lastFrame = 0;
  let lastTime = 0;
  // Smoothed scroll position. The camera follows this instead of raw
  // scrollY so slow wheel ticks can't make the tree jump in steps.
  let smoothY = scrollY;
  let camera;
  let workBlend = 0;
  let departure = 0;
  let lastChapter = '';
  let galleryTreeRect;
  let galleryAlpha = 0;
  let canvasRatio = 1;

  function resize() {
    width = innerWidth;
    height = innerHeight;
    mobile = phoneLayout.matches;
    document.documentElement.classList.toggle('cinematic-work', motion && height > 650);
    const ratio = canvasRatio = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    connectionCanvas.width = canvas.width;
    connectionCanvas.height = canvas.height;
    connectionContext?.setTransform(ratio, 0, 0, ratio, 0, 0);
    workTreeCanvas.width = Math.round(workTree.clientWidth * ratio);
    workTreeCanvas.height = Math.round(workTree.clientHeight * ratio);
    workTreeContext?.setTransform(ratio, 0, 0, ratio, 0, 0);
    setActiveProject(activeProject, false);
    measure();
    smoothY = scrollY;
    updateScene();
    draw();
  }

  function updateScene() {
    const y = smoothY;
    const travel = motion ? clamp(y / metrics.heroTravel) : 0;
    workBlend = smooth((y - metrics.workTop + height) / (height * .92));
    departure = smooth((y - metrics.aboutTop + height * .75) / height);
    const endStart = metrics.contactTop - height * .7;
    const endBlend = smooth((y - endStart) / Math.max(1, Math.min(height, metrics.end - endStart)));
    const heroExit = motion ? smooth((travel - (mobile ? .6 : .08)) / (mobile ? .4 : .9)) : 0;
    hero.style.opacity = 1 - heroExit;
    hero.style.transform = motion && !mobile ? `translate3d(0,${-heroExit * height * .15}px,0) scale(${1 - heroExit * .08})` : '';
    hero.style.pointerEvents = heroExit > .98 ? 'none' : '';
    hero.inert = heroExit > .98;
    galleryAlpha = workBlend * (1 - departure);
    $('.scene-world').style.opacity = mix(1, .85, departure) * (1 - galleryAlpha);
    connectionCanvas.style.opacity = 1 - galleryAlpha;
    $('.scene-readout').style.opacity = 1 - galleryAlpha;
    document.documentElement.style.setProperty('--scene-progress', clamp(y / metrics.end));
    const chapter = endBlend > .35 ? '04 — Grow together' : departure > .3 ? '03 — At our core' : workBlend > .65 ? '02 — Ideas, made real' : '01 — Take root';
    if (chapter !== lastChapter) { $('#scene-name').textContent = chapter; lastChapter = chapter; }

    // The camera follows the tree into its reserved gallery space.
    const push = motion && !mobile ? Math.sin(travel * Math.PI) * .32 * (1 - workBlend) : 0;
    const baseSize = mobile ? Math.min(metrics.treeWidth * .32, metrics.treeHeight / 3.8) : Math.min(width * .2, height * .225);
    galleryTreeRect = workTree.getBoundingClientRect();
    const workSize = metrics.workTreeSize;
    const cinematic = document.documentElement.classList.contains('cinematic-work');
    if (cinematic) {
      // Crossfade both projects together over a short scroll interval.
      // The branch switches as soon as the incoming project starts appearing.
      const timeline = clamp((y - metrics.workTop) / metrics.workTravel) * projectPanels.length;
      const chapter = Math.min(projectPanels.length - 1, Math.floor(timeline));
      const fraction = timeline % 1;
      const finalChapter = chapter === projectPanels.length - 1;
      const incoming = finalChapter ? 0 : smooth((fraction - .55) / .2);
      const outgoing = 1 - incoming;
      const current = incoming > 0 ? chapter + 1 : outgoing > 0 ? chapter : activeProject;
      projectPanels.forEach((panel, index) => {
        const opacity = index === chapter ? outgoing : index === chapter + 1 ? incoming : 0;
        panel.style.setProperty('--project-opacity', opacity.toFixed(4));
        panel.classList.toggle('is-current', index === current && opacity > 0);
        panel.inert = index !== current || opacity < .05;
        panel.setAttribute('aria-hidden', index !== current || opacity < .05);
      });
      if (current !== activeProject) setActiveProject(current);
    } else {
      const browser = $('.work-browser');
      const stacked = width <= 900;
      const pinnedBrowser = getComputedStyle(browser).position === 'sticky';
      const readingLine = stacked && pinnedBrowser
        ? metrics.headerHeight + browser.offsetHeight + (height - metrics.headerHeight - browser.offsetHeight) * .4
        : height * .5;
      let current = 0;
      projectPanels.forEach((panel, index) => {
        const rect = panel.getBoundingClientRect();
        if (rect.top <= readingLine) current = index;
        const progress = motion ? smooth((height - rect.top) / (height * .55)) : 1;
        panel.style.setProperty('--project-enter', (1 - progress).toFixed(3));
        panel.inert = false;
        panel.removeAttribute('aria-hidden');
      });
      if (current !== activeProject) setActiveProject(current);
    }
    // Keep a complete tree beside the about copy, or behind it on stacked layouts.
    const stackedAbout = mobile || width <= 900;
    const aboutSize = Math.max(12, Math.min(width * (stackedAbout ? .235 : .095), height * .18,
      (height - metrics.headerHeight - 48) / 4));
    const sceneMargin = Math.max(width * .06, 16);
    const aboutX = stackedAbout ? width - sceneMargin - aboutSize * 1.6 : sceneMargin + aboutSize * 1.6;
    const aboutY = Math.min(height * .6, height - 24 - aboutSize * 1.8);
    // Bring the whole tree back for contact, with its roots above the footer.
    const endFloor = Math.min(height - 24, metrics.footerTop - y - 16);
    const endSize = Math.max(12, Math.min(width * (mobile ? .235 : .16), height * .2,
      (endFloor - metrics.headerHeight - 24) / 4));
    camera = {
      x: mix(mix(mix(mobile ? metrics.treeX : width * .715, galleryTreeRect.left + galleryTreeRect.width / 2, workBlend), aboutX, departure),
        width - sceneMargin - endSize * 1.6, endBlend),
      y: mix(mix(mix(mobile ? metrics.treeTop + metrics.treeHeight * .54 - y : height * .53, galleryTreeRect.top + galleryTreeRect.height * .49, workBlend), aboutY, departure),
        endFloor - endSize * 1.8, endBlend),
      scale: mix(mix(mix(baseSize * (1 + push), workSize, workBlend), aboutSize, departure), endSize, endBlend),
      yaw: -.3 + treeRotation * workBlend * (1 - departure) + (motion ? Math.sin(elapsed * .17) * .24 + travel * .72 + workBlend * .34 + easedPointer.x * .32 : .2),
      pitch: -.06 + treePitch * workBlend * (1 - departure) + (motion ? easedPointer.y * .13 + push * .26 : 0),
      alpha: mix(1, .85, departure)
    };
    camera.cy = Math.cos(camera.yaw); camera.sy = Math.sin(camera.yaw);
    camera.cp = Math.cos(camera.pitch); camera.sp = Math.sin(camera.pitch);
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

  function trace(points, targetContext = context) {
    targetContext.beginPath();
    points.forEach((point, index) => index ? targetContext.lineTo(point.x, point.y) : targetContext.moveTo(point.x, point.y));
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
    const context = connectionContext;
    if (!context) return;
    context.clearRect(0, 0, width, height);
    if (workBlend < .02 || departure > .98) return;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    // Selecting a project illuminates its own root-to-branch path.
    const rootPath = projectedPath(roots[(activeProject * 2 + 1) % roots.length]).reverse();
    const trunkPart = Array.from({ length: 27 }, (_, index) => project(curve(trunk, index / 26 * (.4 + activeProject * .09))));
    const limb = projectedPath(primaryLimbs[activeProject]);
    const points = [...rootPath, ...trunkPart, ...limb];
    // A steady stroke makes the selected branch clear, even with motion off;
    // the travelling pulse is an accent, never the only visible connection.
    const opacity = workBlend * (1 - departure) * .9;
    trace(points, context);
    // A narrow dark edge separates the path from the leaves.
    context.globalAlpha = opacity * .65;
    context.strokeStyle = '#081a16';
    context.lineWidth = 3.5;
    context.stroke();
    context.globalAlpha = opacity;
    context.strokeStyle = branchColor;
    context.lineWidth = 1.35;
    context.shadowBlur = 12;
    context.shadowColor = branchColor;
    context.stroke();
    context.globalAlpha = opacity * .11;
    context.lineWidth = 7;
    context.stroke();
    if (motion) {
      const progress = (elapsed * .21 + activeProject * .19) % 1;
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
    context.shadowBlur = 0;
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
    context.strokeStyle = '#927963';
    [trunk, ...limbs, ...roots, ...rootlets].forEach(path => { trace(projectedPath(path, 28)); context.stroke(); });

    const visible = [];
    for (let index = 0; index < particles.length; index++) {
      const particle = particles[index];
      // Preserve the canopy on phones while keeping the wood particle budget low.
      if (mobile && index % (particle.kind === 4 ? 2 : 3)) continue;
      const sway = motion ? Math.sin(elapsed * .65 + particle.position[1] * 2 + particle.phase * .1) * .012 * Math.max(0, -particle.position[1]) : 0;
      const projected = project(particle.position, sway);
      if (projected.x < -5 || projected.x > width + 5 || projected.y < -5 || projected.y > height + 5) continue;
      visible.push({ ...projected, particle, sway });
    }
    // Far particles draw first; depth controls brightness, tint and point size.
    visible.sort((a, b) => a.depth - b.depth);
    // Petioles: one batched pass of short stems attaches every leaf to its
    // twig, so the canopy reads as growing branches, not floating confetti.
    context.globalAlpha = .32 * camera.alpha;
    context.strokeStyle = '#55785f';
    context.lineWidth = .6;
    context.beginPath();
    for (const point of visible) {
      const stem = point.particle;
      if (stem.kind !== 4 || !stem.anchor) continue;
      const base = project(stem.anchor, point.sway);
      context.moveTo(base.x, base.y);
      context.lineTo(point.x, point.y);
    }
    context.stroke();
    for (const point of visible) {
      const particle = point.particle;
      const depthLight = clamp((point.depth + 1.2) / 2.4);
      const flicker = motion ? .85 + .15 * Math.sin(elapsed * 1.3 + particle.phase) : 1;
      context.globalAlpha = (.18 + depthLight * .72) * particle.light * flicker * camera.alpha;
      if (particle.kind === 4) {
        const flutter = motion ? Math.sin(elapsed * 1.1 + particle.phase) * .22 : 0;
        const leafPoint = (tip, edge) => project(particle.position.map((value, axis) =>
          value + particle.tip[axis] * tip + particle.edge[axis] * edge
        ), point.sway);
        const start = leafPoint(-1, 0);
        const end = leafPoint(1, 0);
        const left = leafPoint(flutter, 1);
        const right = leafPoint(-flutter, -1);
        // Sun-kissed top leaves run yellow-green; shaded depth stays deep teal.
        context.fillStyle = particle.sun > .82 && depthLight > .45 ? '#c9eaa6'
          : particle.sun > .6 && depthLight > .45 ? '#a9dfa4'
          : depthLight > .65 ? '#b8f2bc' : depthLight > .4 ? '#72cda2' : '#398f83';
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.quadraticCurveTo(left.x, left.y, end.x, end.y);
        context.quadraticCurveTo(right.x, right.y, start.x, start.y);
        context.fill();
        if (particle.light > .88) {
          context.globalAlpha *= .45;
          context.strokeStyle = '#d4ffdb';
          context.lineWidth = .45;
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.stroke();
        }
        continue;
      }
      context.fillStyle = depthLight > .65 ? '#dcc5a7' : depthLight > .4 ? '#b09376' : '#786b60';
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
    // Reuse the rendered particles in the pinned gallery viewport. This keeps
    // the tree above scrolling posters without drawing the particle system twice.
    if (workTreeContext && galleryTreeRect) {
      workTreeContext.clearRect(0, 0, workTree.clientWidth, workTree.clientHeight);
      if (galleryAlpha > 0) {
        workTreeContext.globalAlpha = galleryAlpha;
        for (const source of [canvas, connectionCanvas]) {
          workTreeContext.drawImage(source,
            galleryTreeRect.left * canvasRatio, galleryTreeRect.top * canvasRatio,
            galleryTreeRect.width * canvasRatio, galleryTreeRect.height * canvasRatio,
            0, 0, galleryTreeRect.width, galleryTreeRect.height);
        }
        workTreeContext.globalAlpha = 1;
      }
    }
  }

  function setMotion(enabled) {
    motion = enabled;
    document.documentElement.classList.toggle('motion-enabled', enabled);
    document.documentElement.classList.toggle('cinematic-work', enabled && height > 650);
    document.body.classList.toggle('motion-paused', !enabled);
    $('.motion-toggle').textContent = 'Motion: ' + (enabled ? 'on' : 'off');
    $('.motion-toggle').setAttribute('aria-pressed', !enabled);
    if (enabled && window.Lenis && !lenis) lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (!enabled) { lenis?.destroy(); lenis = null; cursor.style.opacity = '0'; }
    if ((menu.open || detail.open) && lenis) lenis.stop();
    measure();
    smoothY = scrollY;
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
  new ResizeObserver(() => {
    workTreeCanvas.width = Math.round(workTree.clientWidth * canvasRatio);
    workTreeCanvas.height = Math.round(workTree.clientHeight * canvasRatio);
    workTreeContext?.setTransform(canvasRatio, 0, 0, canvasRatio, 0, 0);
    measure();
  }).observe(workTree);

  function frame(time) {
    lenis?.raf(time);
    if (document.hidden || menu.open || detail.open) { lastTime = time; requestAnimationFrame(frame); return; }
    const delta = Math.min((time - (lastTime || time - 16)) / 1000 || .016, .065);
    lastTime = time;
    // Ease the rendered scroll position toward the real one with a
    // frame-rate independent damper (~110ms). Small/slow wheel deltas
    // then move the tree continuously instead of in visible steps.
    const targetY = scrollY;
    // Phone layouts take the hero out of flow, so the fixed canvas has to
    // follow the document exactly; easing it made the tree trail the gesture.
    if (!motion || mobile) smoothY = targetY;
    else if (Math.abs(targetY - smoothY) > height) smoothY = targetY;
    else if (smoothY !== targetY) {
      smoothY += (targetY - smoothY) * (1 - Math.exp(-delta / .11));
      if (Math.abs(targetY - smoothY) < .1) smoothY = targetY;
    }
    if (Math.abs(targetY - smoothY) > .1) dirty = true;
    const settling = dirty || Math.abs(targetY - smoothY) > .1;
    // While scrolling/setting render every rAF for smooth motion; only
    // the idle sway stays throttled to save battery.
    if ((motion || settling) && (settling || time - lastFrame >= (mobile ? 40 : 30))) {
      if (motion) elapsed += delta;
      const pointerK = 1 - Math.exp(-delta / .18);
      easedPointer.x = mix(easedPointer.x, pointer.x, pointerK);
      easedPointer.y = mix(easedPointer.y, pointer.y, pointerK);
      updateScene();
      draw();
      lastFrame = time;
      dirty = Math.abs(scrollY - smoothY) > .1;
    }
    requestAnimationFrame(frame);
  }
  resize();
  setMotion(motion);
  requestAnimationFrame(frame);
})();
