/* ==========================================================================
   my charm — Vivid 60fps 3D Scroll-Motion Background & Interactive 3D UI
   - True 3D perspective camera fly-through driven by scroll (laptop + mobile)
   - 4 unmistakable luxury atmosphere chapters (Ivory Pearl -> Rose-Quartz ->
     18K Liquid Gold -> Velvet Twilight) with 3D perspective silk grid,
     faceted rose/gold crystals, double-beveled 3D gold halo rings & bokeh
   - Scroll-reactive 3D Hero Pin Deck + desktop 3D tilt glare + mobile 3D tap
   - Zero-delay always-visible cards + instant category & Pin/Photo switcher
   ========================================================================== */
(function () {
  "use strict";

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.getElementById("bg-3d-canvas");
  const progressBar = document.getElementById("scroll-progress-bar");
  const heroDeck = document.querySelector(".hero-deck");

  // 4 distinct, unmistakable luxury scroll chapters (high-contrast safe for dark ink & glass cards)
  const PALETTES = [
    {
      // 0% — Sunlit Ivory Pearl & Rose-Gold
      bgTop: [253, 245, 238],
      bgBot: [246, 224, 219],
      orb1: [238, 152, 174],
      orb2: [242, 198, 120],
      accent: [193, 74, 102],
      gold: [202, 146, 56],
      grid: [196, 134, 118],
    },
    {
      // 33% — Luminous Rose-Quartz Glass Skin
      bgTop: [252, 224, 235],
      bgBot: [242, 192, 214],
      orb1: [224, 96, 138],
      orb2: [248, 176, 156],
      accent: [188, 52, 92],
      gold: [212, 148, 72],
      grid: [194, 88, 122],
    },
    {
      // 66% — Radiant 18K Liquid Champagne Gold
      bgTop: [254, 241, 208],
      bgBot: [242, 209, 146],
      orb1: [232, 172, 62],
      orb2: [238, 148, 162],
      accent: [186, 124, 34],
      gold: [204, 144, 42],
      grid: [184, 132, 48],
    },
    {
      // 100% — Velvet Mauve-Rose & Gold Dusk
      bgTop: [238, 220, 234],
      bgBot: [218, 190, 214],
      orb1: [188, 112, 158],
      orb2: [224, 172, 108],
      accent: [152, 68, 114],
      gold: [188, 136, 60],
      grid: [156, 98, 134],
    },
  ];

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpColor(c1, c2, t) {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t)),
    ];
  }

  function samplePalette(p) {
    const clamped = Math.max(0, Math.min(1, p));
    const scaled = clamped * (PALETTES.length - 1);
    const idx = Math.min(PALETTES.length - 2, Math.floor(scaled));
    const localT = scaled - idx;
    const A = PALETTES[idx];
    const B = PALETTES[idx + 1];
    return {
      bgTop: lerpColor(A.bgTop, B.bgTop, localT),
      bgBot: lerpColor(A.bgBot, B.bgBot, localT),
      orb1: lerpColor(A.orb1, B.orb1, localT),
      orb2: lerpColor(A.orb2, B.orb2, localT),
      accent: lerpColor(A.accent, B.accent, localT),
      gold: lerpColor(A.gold, B.gold, localT),
      grid: lerpColor(A.grid, B.grid, localT),
    };
  }

  function rgb(c, a) {
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }

  // 3D Octahedron crystal mesh
  const GEM_VERTS = [
    [0, 1.42, 0],
    [1, 0, 0],
    [0, 0, 1],
    [-1, 0, 0],
    [0, 0, -1],
    [0, -1.42, 0],
  ];
  const GEM_FACES = [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 1],
    [5, 2, 1],
    [5, 3, 2],
    [5, 4, 3],
    [5, 1, 4],
  ];

  function rotate3D(v, rx, ry, rz) {
    let [x, y, z] = v;
    const cx = Math.cos(rx),
      sx = Math.sin(rx);
    let y1 = y * cx - z * sx;
    let z1 = y * sx + z * cx;
    y = y1;
    z = z1;

    const cy = Math.cos(ry),
      sy = Math.sin(ry);
    let x1 = x * cy + z * sy;
    z1 = -x * sy + z * cy;
    x = x1;
    z = z1;

    const cz = Math.cos(rz),
      sz = Math.sin(rz);
    x1 = x * cz - y * sz;
    y1 = x * sz + y * cz;
    return [x1, y1, z];
  }

  if (canvas) {
    const ctx = canvas.getContext("2d", { alpha: false });
    let W = window.innerWidth;
    let H = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const isMobile = W < 768;
    const objects = [];
    const spreadX = isMobile ? 250 : 540;

    // 3D Faceted Crystals (positioned across foreground & margins so clearly visible on mobile & laptop)
    const gemCount = isMobile ? 8 : 14;
    for (let i = 0; i < gemCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const xPos =
        i % 3 === 0
          ? ((i * 97) % (spreadX * 1.4)) - spreadX * 0.7
          : side * ((isMobile ? 95 : 210) + ((i * 113) % (spreadX * 0.85)));
      objects.push({
        type: "gem",
        x: xPos,
        y: -440 + (i / gemCount) * 1020,
        z: 140 + ((i * 191) % 820),
        size: (isMobile ? 28 : 42) + ((i * 17) % (isMobile ? 24 : 38)),
        rx: i * 0.65,
        ry: i * 1.15,
        rz: i * 0.35,
        vrx: 0.008 + (i % 3) * 0.003,
        vry: 0.011 + (i % 4) * 0.003,
        tone: i % 2 === 0 ? "accent" : "gold",
      });
    }

    // 3D Metallic 18K Gold & Rose Halo Rings
    const ringCount = isMobile ? 6 : 9;
    for (let i = 0; i < ringCount; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      objects.push({
        type: "ring",
        x: side * ((isMobile ? 80 : 180) + ((i * 149) % spreadX)),
        y: -380 + (i / ringCount) * 920,
        z: 190 + ((i * 173) % 760),
        size: (isMobile ? 48 : 74) + ((i * 23) % (isMobile ? 42 : 64)),
        rx: 0.5 + i * 0.48,
        ry: i * 0.85,
        rz: i * 0.28,
        vrx: 0.009,
        vry: 0.013,
        tone: i % 3 === 0 ? "accent" : "gold",
      });
    }

    // 3D Glass-Skin Dew Pearls & Luminous Bokeh
    const pearlCount = isMobile ? 16 : 26;
    for (let i = 0; i < pearlCount; i++) {
      objects.push({
        type: "pearl",
        x: ((i * 227) % (spreadX * 2.4)) - spreadX * 1.2,
        y: ((i * 181) % 1080) - 540,
        z: 110 + ((i * 137) % 860),
        size: 10 + ((i * 13) % 26),
        phase: i * 0.8,
        tone: i % 2 === 0 ? "orb1" : "orb2",
      });
    }

    let scrollProgress = 0;
    let smoothScroll = 0;
    let scrollVelocity = 0;
    let lastScrollY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let smoothMouseX = 0;
    let smoothMouseY = 0;

    function readScrollY() {
      return (
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      );
    }

    function updateScrollTarget() {
      const maxScroll = Math.max(
        1,
        Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        ) - window.innerHeight
      );
      const sy = readScrollY();
      const delta = sy - lastScrollY;
      scrollVelocity += delta * 0.0032;
      scrollVelocity = Math.max(-0.45, Math.min(0.45, scrollVelocity));
      lastScrollY = sy;
      scrollProgress = Math.max(0, Math.min(1, sy / maxScroll));
      if (progressBar) {
        progressBar.style.transform = `scaleX(${scrollProgress.toFixed(4)})`;
      }
      // Subtle 3D scroll reaction on Hero Pin Deck (works smoothly on both laptop & mobile!)
      if (heroDeck && !prefersReduced) {
        const heroShift = Math.min(1, sy / 520);
        heroDeck.style.setProperty("--hero-scroll", heroShift.toFixed(3));
      }
    }

    window.addEventListener("scroll", updateScrollTarget, { passive: true });
    window.addEventListener(
      "pointermove",
      (e) => {
        mouseX = (e.clientX / Math.max(1, W) - 0.5) * 2;
        mouseY = (e.clientY / Math.max(1, H) - 0.5) * 2;
      },
      { passive: true }
    );
    lastScrollY = readScrollY();
    updateScrollTarget();
    smoothScroll = scrollProgress;

    // Draw a subtle 3D perspective floor/horizon grid that flies toward the viewer as you scroll
    function draw3DHorizonGrid(pal, sProg, camPitch, camYaw) {
      const focal = Math.min(W, H) * 0.85;
      const horizonY = H * 0.62 - camPitch * 120;
      ctx.save();
      ctx.strokeStyle = rgb(pal.grid, 0.16);
      ctx.lineWidth = 1;

      const zOffset = (sProg * 1400) % 160;
      // Horizontal depth lines flying toward camera
      for (let zi = 1; zi <= 10; zi++) {
        const z = zi * 160 - zOffset;
        if (z < 60) continue;
        const scale = focal / z;
        const y = horizonY + 260 * scale;
        if (y > H + 30 || y < horizonY - 10) continue;
        ctx.globalAlpha = Math.max(0.05, Math.min(0.32, 1 - z / 1550));
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      // Radial perspective lines converging at moving 3D vanishing point
      const vpX = W * 0.5 - camYaw * 360;
      ctx.globalAlpha = 0.14;
      for (let xi = -6; xi <= 6; xi++) {
        const bx = vpX + xi * (W * 0.22);
        ctx.beginPath();
        ctx.moveTo(vpX, horizonY);
        ctx.lineTo(bx, H + 40);
        ctx.stroke();
      }
      ctx.restore();
    }

    let t = 0;
    function renderFrame() {
      updateScrollTarget();
      t += prefersReduced ? 0 : 0.015;
      smoothScroll += (scrollProgress - smoothScroll) * 0.22;
      scrollVelocity *= 0.88;
      smoothMouseX += (mouseX - smoothMouseX) * 0.07;
      smoothMouseY += (mouseY - smoothMouseY) * 0.07;

      const pal = samplePalette(smoothScroll);

      // 1. Dynamic 4-chapter background sky gradient
      const angleShift = Math.sin(smoothScroll * Math.PI * 2) * W * 0.25;
      const sky = ctx.createLinearGradient(
        W * 0.2 + angleShift,
        0,
        W * 0.8 - angleShift,
        H
      );
      sky.addColorStop(0, rgb(pal.bgTop, 1));
      sky.addColorStop(1, rgb(pal.bgBot, 1));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // 2. Vivid volumetric light spheres sweeping across viewport with scroll
      const orb1X =
        W * (0.18 + Math.sin(smoothScroll * Math.PI * 2.1 + t * 0.35) * 0.36) -
        smoothMouseX * 55;
      const orb1Y =
        H * (0.24 + Math.cos(smoothScroll * Math.PI * 1.7) * 0.32) -
        smoothMouseY * 35;
      const r1 = Math.max(W, H) * 0.58;
      const g1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, r1);
      g1.addColorStop(0, rgb(pal.orb1, 0.56));
      g1.addColorStop(0.5, rgb(pal.orb1, 0.18));
      g1.addColorStop(1, rgb(pal.orb1, 0));
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      const orb2X =
        W * (0.82 - Math.sin(smoothScroll * Math.PI * 2.3 + 0.9) * 0.36) +
        smoothMouseX * 50;
      const orb2Y =
        H * (0.76 - Math.cos(smoothScroll * Math.PI * 1.8 + t * 0.25) * 0.32) +
        smoothMouseY * 35;
      const r2 = Math.max(W, H) * 0.56;
      const g2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, r2);
      g2.addColorStop(0, rgb(pal.orb2, 0.54));
      g2.addColorStop(0.5, rgb(pal.orb2, 0.18));
      g2.addColorStop(1, rgb(pal.orb2, 0));
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      // 3. 3D perspective camera parameters
      const focal = Math.min(W, H) * 0.92;
      const camYaw =
        smoothMouseX * 0.18 + Math.sin(smoothScroll * Math.PI * 2.2) * 0.34;
      const camPitch =
        smoothMouseY * 0.12 + (smoothScroll - 0.5) * 0.42;
      const zTravel = smoothScroll * 1650 + t * 18;

      // 4. 3D Horizon Perspective Grid flying forward on scroll
      draw3DHorizonGrid(pal, smoothScroll, camPitch, camYaw);

      // 5. Flowing 3D silk ribbons
      ctx.save();
      ctx.strokeStyle = rgb(pal.gold, 0.24);
      ctx.lineWidth = 1.6;
      for (let r = 0; r < 3; r++) {
        const arcY =
          H * (0.2 + r * 0.3) +
          Math.sin(smoothScroll * Math.PI * 3 + r * 1.4 + t * 0.5) * 95;
        ctx.beginPath();
        ctx.moveTo(-40, arcY);
        ctx.bezierCurveTo(
          W * 0.3,
          arcY - 145 * Math.cos(smoothScroll * 5 + r),
          W * 0.7,
          arcY + 145 * Math.sin(smoothScroll * 5 + r),
          W + 40,
          arcY - 35
        );
        ctx.stroke();
      }
      ctx.restore();

      // 6. Depth-sorted 3D Objects (Crystals, 18K Gold Rings, Dew Pearls)
      const renderList = [];
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const z = (((obj.z - zTravel) % 980) + 980) % 980 + 130;
        let ox = obj.x;
        let oy = obj.y - (smoothScroll - 0.5) * 420;
        if (obj.type === "pearl") {
          oy += Math.sin(t * 1.2 + obj.phase) * 20;
          ox += Math.cos(t * 0.8 + obj.phase) * 16;
        }
        const camPos = rotate3D([ox, oy, z - 520], camPitch, camYaw, 0);
        const worldZ = camPos[2] + 580;
        if (worldZ < 85) continue;
        renderList.push({ obj, wx: camPos[0], wy: camPos[1], wz: worldZ });
      }
      renderList.sort((a, b) => b.wz - a.wz);

      for (let i = 0; i < renderList.length; i++) {
        const { obj, wx, wy, wz } = renderList[i];
        const scale = focal / wz;
        const sx = W * 0.5 + wx * scale;
        const sy = H * 0.5 + wy * scale;
        const depthAlpha = Math.max(0.12, Math.min(0.92, 1.2 - wz / 1020));

        if (obj.type === "pearl") {
          const rad = Math.max(3, obj.size * scale);
          const col = pal[obj.tone];
          const pg = ctx.createRadialGradient(
            sx - rad * 0.32,
            sy - rad * 0.32,
            rad * 0.08,
            sx,
            sy,
            rad
          );
          pg.addColorStop(
            0,
            `rgba(255,255,255,${(depthAlpha * 0.96).toFixed(3)})`
          );
          pg.addColorStop(0.45, rgb(col, (depthAlpha * 0.58).toFixed(3)));
          pg.addColorStop(1, rgb(col, 0));
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(sx, sy, rad, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === "ring") {
          const rx =
            obj.rx +
            t * obj.vrx * 32 +
            smoothScroll * 5.2 +
            scrollVelocity * 8;
          const ry = obj.ry + t * obj.vry * 32 + smoothScroll * 6.4;
          const rz = obj.rz + smoothScroll * 2.6;
          const segs = 38;
          const col = pal[obj.tone];
          ctx.save();
          ctx.beginPath();
          for (let s = 0; s <= segs; s++) {
            const ang = (s / segs) * Math.PI * 2;
            const pt = rotate3D(
              [Math.cos(ang) * obj.size, Math.sin(ang) * obj.size, 0],
              rx,
              ry,
              rz
            );
            const ps = focal / (wz + pt[2]);
            const px = W * 0.5 + (wx + pt[0]) * ps;
            const py = H * 0.5 + (wy + pt[1]) * ps;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.strokeStyle = rgb(col, (depthAlpha * 0.68).toFixed(3));
          ctx.lineWidth = Math.max(2, 4.6 * scale);
          ctx.stroke();

          ctx.strokeStyle = `rgba(255,253,248,${(depthAlpha * 0.72).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.8, 1.5 * scale);
          ctx.stroke();
          ctx.restore();
        } else if (obj.type === "gem") {
          const rx =
            obj.rx +
            t * obj.vrx * 28 +
            smoothScroll * 5.6 +
            scrollVelocity * 9;
          const ry = obj.ry + t * obj.vry * 28 + smoothScroll * 7.2;
          const rz = obj.rz + smoothScroll * 3.0;
          const baseCol = pal[obj.tone];

          const transformed = GEM_VERTS.map((v) => {
            const rv = rotate3D(
              [v[0] * obj.size, v[1] * obj.size, v[2] * obj.size],
              rx,
              ry,
              rz
            );
            const ps = focal / (wz + rv[2]);
            return {
              x: rv[0],
              y: rv[1],
              z: rv[2],
              px: W * 0.5 + (wx + rv[0]) * ps,
              py: H * 0.5 + (wy + rv[1]) * ps,
            };
          });

          const faces = [];
          for (let f = 0; f < GEM_FACES.length; f++) {
            const [ia, ib, ic] = GEM_FACES[f];
            const a = transformed[ia],
              b = transformed[ib],
              c = transformed[ic];
            const ux = b.x - a.x,
              uy = b.y - a.y,
              uz = b.z - a.z;
            const vx = c.x - a.x,
              vy = c.y - a.y,
              vz = c.z - a.z;
            const nx = uy * vz - uz * vy;
            const ny = uz * vx - ux * vz;
            const nz = ux * vy - uy * vx;
            if (nz >= 0) continue;
            const nLen = Math.hypot(nx, ny, nz) || 1;
            const light = Math.max(
              0.12,
              (-nx * 0.45 - ny * 0.55 - nz * 0.7) / nLen
            );
            faces.push({
              a,
              b,
              c,
              zAvg: (a.z + b.z + c.z) / 3,
              light,
            });
          }
          faces.sort((p1, p2) => p2.zAvg - p1.zAvg);

          for (let f = 0; f < faces.length; f++) {
            const fc = faces[f];
            const lit = [
              Math.min(255, Math.round(lerp(baseCol[0], 255, fc.light * 0.65))),
              Math.min(255, Math.round(lerp(baseCol[1], 252, fc.light * 0.65))),
              Math.min(255, Math.round(lerp(baseCol[2], 248, fc.light * 0.65))),
            ];
            ctx.beginPath();
            ctx.moveTo(fc.a.px, fc.a.py);
            ctx.lineTo(fc.b.px, fc.b.py);
            ctx.lineTo(fc.c.px, fc.c.py);
            ctx.closePath();
            ctx.fillStyle = rgb(lit, (depthAlpha * 0.54).toFixed(3));
            ctx.fill();
            ctx.strokeStyle = `rgba(255,255,255,${(depthAlpha * 0.75).toFixed(3)})`;
            ctx.lineWidth = 1.15;
            ctx.stroke();
          }
        }
      }

      if (!prefersReduced) {
        requestAnimationFrame(renderFrame);
      }
    }

    renderFrame();
    if (prefersReduced) {
      window.addEventListener("scroll", renderFrame, { passive: true });
    }
  }

  /* ------------------------------------------------------------------------
     2. 3D INTERACTIVE CARD TILT & SPECULAR GLARE (Desktop Hover + Touch Press)
     ------------------------------------------------------------------------ */
  if (!prefersReduced && window.matchMedia("(hover: hover)").matches) {
    const tiltEls = document.querySelectorAll(
      ".card-3d, .hero-deck-card, .spotlight-grid, .feature-card"
    );
    tiltEls.forEach((el) => {
      const maxTilt = el.classList.contains("spotlight-grid") ? 3 : 6.5;
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - py) * maxTilt * 2;
        const ry = (px - 0.5) * maxTilt * 2;
        el.style.setProperty("--rx", rx.toFixed(2) + "deg");
        el.style.setProperty("--ry", ry.toFixed(2) + "deg");
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        el.classList.add("is-tilting");
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        el.classList.remove("is-tilting");
      });
    });
  }

  /* ------------------------------------------------------------------------
     3. INSTANT CATEGORY FILTER & PIN / PHOTO VIEW TOGGLE
     ------------------------------------------------------------------------ */
  const filterBtns = document.querySelectorAll("[data-filter]");
  const catalogCards = document.querySelectorAll(".card[data-category]");
  const countBadge = document.getElementById("filter-count");

  if (filterBtns.length && catalogCards.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter");
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        let shown = 0;
        catalogCards.forEach((card) => {
          const cat = card.getAttribute("data-category");
          const price = parseFloat(card.getAttribute("data-price") || "99");
          const match =
            filter === "all" ||
            filter === cat ||
            (filter === "under15" && price <= 15.5);
          card.style.display = match ? "" : "none";
          if (match) shown++;
        });
        if (countBadge) {
          countBadge.textContent = `${shown} pick${shown === 1 ? "" : "s"}`;
        }
      });
    });
  }

  const viewToggleBtns = document.querySelectorAll("[data-view-mode]");
  if (viewToggleBtns.length && catalogCards.length) {
    viewToggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-view-mode");
        viewToggleBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        catalogCards.forEach((card) => {
          const media = card.querySelector(".card-media");
          const img = card.querySelector(".card-media img");
          if (!media || !img) return;
          const pinSrc = img.getAttribute("data-pin-src");
          const photoSrc = img.getAttribute("data-photo-src");
          if (mode === "pin" && pinSrc) {
            img.src = pinSrc;
            media.classList.add("pin-ratio");
          } else if (mode === "photo" && photoSrc) {
            img.src = photoSrc;
            media.classList.remove("pin-ratio");
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     4. VIDEO REELS SOUND TOGGLE & PRODUCT SPOTLIGHT REEL/PIN MEDIA SWITCHER
     ------------------------------------------------------------------------ */
  document.querySelectorAll(".reel-sound-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wrap = btn.closest(".reel-media, .spotlight-media");
      const vid = wrap ? wrap.querySelector("video") : null;
      if (!vid) return;
      vid.muted = !vid.muted;
      if (!vid.muted) {
        vid.play().catch(() => {});
      }
      btn.textContent = vid.muted ? "🔇 Sound" : "🔊 Sound On";
    });
  });

  document.querySelectorAll(".spotlight-media-tabs").forEach((tabGroup) => {
    const mediaBox = tabGroup.closest(".spotlight-media");
    const vid = mediaBox ? mediaBox.querySelector("video") : null;
    const img = mediaBox ? mediaBox.querySelector("img") : null;
    const soundBtn = mediaBox ? mediaBox.querySelector(".reel-sound-btn") : null;
    tabGroup.querySelectorAll(".media-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-media-tab");
        tabGroup.querySelectorAll(".media-tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (target === "reel" && vid && img) {
          vid.style.display = "block";
          img.style.display = "none";
          if (soundBtn) soundBtn.style.display = "";
          vid.play().catch(() => {});
        } else if (vid && img) {
          vid.pause();
          vid.style.display = "none";
          img.style.display = "block";
          if (soundBtn) soundBtn.style.display = "none";
        }
      });
    });
  });
})();
