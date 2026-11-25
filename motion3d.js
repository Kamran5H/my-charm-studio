/* ==========================================================================
   my charm — Interactive 3D Scroll Background & Luxury Glass UI Engine
   Zero-dependency 60fps 3D perspective canvas (faceted rose-quartz crystals,
   18K liquid-gold rings, glass-skin droplets & morphing color atmosphere)
   + 3D card tilt glare + instant Pinterest Pin/Photo view & category filters.
   ========================================================================== */
(function () {
  "use strict";

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     1. 3D SCROLL-REACTIVE BACKGROUND CANVAS
     ------------------------------------------------------------------------ */
  const canvas = document.getElementById("bg-3d-canvas");
  const progressBar = document.getElementById("scroll-progress-bar");

  // Luxury scroll palette stops (0% -> 33% -> 66% -> 100%)
  const PALETTES = [
    {
      bgTop: [253, 248, 244],
      bgBot: [246, 234, 226],
      orb1: [242, 194, 206],
      orb2: [244, 212, 154],
      accent: [193, 78, 103],
      gold: [204, 152, 74],
    },
    {
      bgTop: [252, 234, 241],
      bgBot: [245, 219, 230],
      orb1: [232, 134, 162],
      orb2: [248, 198, 168],
      accent: [196, 68, 102],
      gold: [216, 156, 82],
    },
    {
      bgTop: [253, 244, 224],
      bgBot: [244, 226, 194],
      orb1: [238, 188, 102],
      orb2: [240, 174, 182],
      accent: [194, 136, 48],
      gold: [214, 160, 68],
    },
    {
      bgTop: [245, 231, 229],
      bgBot: [232, 214, 208],
      orb1: [214, 150, 166],
      orb2: [228, 184, 120],
      accent: [172, 76, 98],
      gold: [192, 140, 72],
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
    };
  }

  function rgb(c, a) {
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }

  // 3D Octahedron gem vertices & faces
  const GEM_VERTS = [
    [0, 1.35, 0],
    [1, 0, 0],
    [0, 0, 1],
    [-1, 0, 0],
    [0, 0, -1],
    [0, -1.35, 0],
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
    // Rotate X
    const cx = Math.cos(rx),
      sx = Math.sin(rx);
    let y1 = y * cx - z * sx;
    let z1 = y * sx + z * cx;
    y = y1;
    z = z1;
    // Rotate Y
    const cy = Math.cos(ry),
      sy = Math.sin(ry);
    let x1 = x * cy + z * sy;
    z1 = -x * sy + z * cy;
    x = x1;
    z = z1;
    // Rotate Z
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

    // Create 3D faceted rose-quartz & pearl crystals
    const gemCount = isMobile ? 6 : 11;
    for (let i = 0; i < gemCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      objects.push({
        type: "gem",
        x: side * (220 + ((i * 137) % 440)),
        y: -420 + (i / gemCount) * 1050,
        z: 180 + ((i * 211) % 760),
        size: 32 + ((i * 19) % 38),
        rx: i * 0.7,
        ry: i * 1.1,
        rz: i * 0.4,
        vrx: 0.004 + (i % 3) * 0.002,
        vry: 0.006 + (i % 4) * 0.002,
        tone: i % 2 === 0 ? "accent" : "gold",
      });
    }

    // Create 3D rotating 18K gold halo rings
    const ringCount = isMobile ? 4 : 7;
    for (let i = 0; i < ringCount; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      objects.push({
        type: "ring",
        x: side * (190 + ((i * 173) % 480)),
        y: -360 + (i / ringCount) * 960,
        z: 240 + ((i * 197) % 720),
        size: 56 + ((i * 29) % 62),
        rx: 0.6 + i * 0.45,
        ry: i * 0.9,
        rz: i * 0.3,
        vrx: 0.005,
        vry: 0.008,
        tone: i % 3 === 0 ? "accent" : "gold",
      });
    }

    // Create floating 3D glass-skin pearl/dew spheres
    const pearlCount = isMobile ? 12 : 22;
    for (let i = 0; i < pearlCount; i++) {
      objects.push({
        type: "pearl",
        x: ((i * 263) % 1300) - 650,
        y: ((i * 199) % 1100) - 550,
        z: 120 + ((i * 149) % 880),
        size: 8 + ((i * 11) % 24),
        phase: i * 0.85,
        tone: i % 2 === 0 ? "orb1" : "orb2",
      });
    }

    let scrollProgress = 0;
    let smoothScroll = 0;
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY || 0;
    let mouseX = 0;
    let mouseY = 0;
    let smoothMouseX = 0;
    let smoothMouseY = 0;

    function updateScrollTarget() {
      const maxScroll = Math.max(
        1,
        Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) -
          window.innerHeight
      );
      const sy =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      scrollVelocity += (sy - lastScrollY) * 0.0022;
      scrollVelocity = Math.max(-0.32, Math.min(0.32, scrollVelocity));
      lastScrollY = sy;
      scrollProgress = Math.max(0, Math.min(1, sy / maxScroll));
      if (progressBar) {
        progressBar.style.transform = `scaleX(${scrollProgress.toFixed(4)})`;
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
    updateScrollTarget();

    let t = 0;
    function renderFrame() {
      updateScrollTarget();
      t += prefersReduced ? 0.001 : 0.012;
      smoothScroll += (scrollProgress - smoothScroll) * 0.14;
      scrollVelocity *= 0.91;
      smoothMouseX += (mouseX - smoothMouseX) * 0.06;
      smoothMouseY += (mouseY - smoothMouseY) * 0.06;

      const pal = samplePalette(smoothScroll);

      // Base morphing gradient sky
      const sky = ctx.createLinearGradient(0, 0, W * 0.4, H);
      sky.addColorStop(0, rgb(pal.bgTop, 1));
      sky.addColorStop(1, rgb(pal.bgBot, 1));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // 3D volumetric atmospheric light orbs shifting dramatically with scroll
      const orb1X =
        W * (0.16 + Math.sin(smoothScroll * Math.PI * 1.4 + t * 0.25) * 0.28) -
        smoothMouseX * 45;
      const orb1Y =
        H * (0.22 + Math.cos(smoothScroll * Math.PI * 1.2) * 0.26) -
        smoothMouseY * 30;
      const r1 = Math.max(W, H) * 0.52;
      const g1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, r1);
      g1.addColorStop(0, rgb(pal.orb1, 0.52));
      g1.addColorStop(0.55, rgb(pal.orb1, 0.16));
      g1.addColorStop(1, rgb(pal.orb1, 0));
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      const orb2X =
        W * (0.84 - Math.sin(smoothScroll * Math.PI * 1.6 + 0.8) * 0.3) +
        smoothMouseX * 40;
      const orb2Y =
        H * (0.76 - Math.cos(smoothScroll * Math.PI * 1.3 + t * 0.2) * 0.28) +
        smoothMouseY * 30;
      const r2 = Math.max(W, H) * 0.5;
      const g2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, r2);
      g2.addColorStop(0, rgb(pal.orb2, 0.5));
      g2.addColorStop(0.55, rgb(pal.orb2, 0.15));
      g2.addColorStop(1, rgb(pal.orb2, 0));
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      // Subtle 3D perspective silk ribbon arcs driven by scroll depth
      ctx.save();
      ctx.strokeStyle = rgb(pal.gold, 0.13);
      ctx.lineWidth = 1.25;
      for (let r = 0; r < 3; r++) {
        const arcY =
          H * (0.25 + r * 0.28) +
          Math.sin(smoothScroll * Math.PI * 2 + r * 1.3) * 75;
        ctx.beginPath();
        ctx.moveTo(-40, arcY);
        ctx.bezierCurveTo(
          W * 0.3,
          arcY - 120 * Math.cos(smoothScroll * 4 + r),
          W * 0.7,
          arcY + 120 * Math.sin(smoothScroll * 4 + r),
          W + 40,
          arcY - 40
        );
        ctx.stroke();
      }
      ctx.restore();

      // 3D camera transform driven by scroll progress + pointer
      const focal = Math.min(W, H) * 0.92;
      const camYaw = smoothMouseX * 0.16 + Math.sin(smoothScroll * Math.PI * 2) * 0.22;
      const camPitch = smoothMouseY * 0.11 + (smoothScroll - 0.5) * 0.32;
      const zTravel = smoothScroll * 920;

      // Sort 3D objects back-to-front by wrapped camera Z
      const renderList = [];
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        let z = ((obj.z - zTravel) % 960 + 960) % 960 + 140;
        let ox = obj.x;
        let oy = obj.y - (smoothScroll - 0.5) * 320;
        if (obj.type === "pearl") {
          oy += Math.sin(t + obj.phase) * 18;
          ox += Math.cos(t * 0.7 + obj.phase) * 14;
        }
        // Apply global camera orbit rotation around scene center
        const camPos = rotate3D([ox, oy, z - 520], camPitch, camYaw, 0);
        const worldZ = camPos[2] + 580;
        if (worldZ < 90) continue;
        renderList.push({ obj, wx: camPos[0], wy: camPos[1], wz: worldZ });
      }
      renderList.sort((a, b) => b.wz - a.wz);

      for (let i = 0; i < renderList.length; i++) {
        const { obj, wx, wy, wz } = renderList[i];
        const scale = focal / wz;
        const sx = W * 0.5 + wx * scale;
        const sy = H * 0.5 + wy * scale;
        const depthAlpha = Math.max(
          0.08,
          Math.min(0.85, 1.15 - wz / 1050)
        );

        if (obj.type === "pearl") {
          const rad = Math.max(2, obj.size * scale);
          const col = pal[obj.tone];
          const pg = ctx.createRadialGradient(
            sx - rad * 0.32,
            sy - rad * 0.32,
            rad * 0.08,
            sx,
            sy,
            rad
          );
          pg.addColorStop(0, `rgba(255,255,255,${(depthAlpha * 0.92).toFixed(3)})`);
          pg.addColorStop(0.45, rgb(col, (depthAlpha * 0.42).toFixed(3)));
          pg.addColorStop(1, rgb(col, 0));
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(sx, sy, rad, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === "ring") {
          const rx = obj.rx + t * obj.vrx * 28 + smoothScroll * 3.4 + scrollVelocity * 6;
          const ry = obj.ry + t * obj.vry * 28 + smoothScroll * 4.2;
          const rz = obj.rz + smoothScroll * 1.8;
          const segs = 36;
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
          ctx.strokeStyle = rgb(col, (depthAlpha * 0.58).toFixed(3));
          ctx.lineWidth = Math.max(1.5, 3.8 * scale);
          ctx.stroke();

          // Inner specular gold highlight ring
          ctx.strokeStyle = `rgba(255,252,246,${(depthAlpha * 0.62).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.7, 1.3 * scale);
          ctx.stroke();
          ctx.restore();
        } else if (obj.type === "gem") {
          const rx = obj.rx + t * obj.vrx * 24 + smoothScroll * 3.8 + scrollVelocity * 7;
          const ry = obj.ry + t * obj.vry * 24 + smoothScroll * 5.0;
          const rz = obj.rz + smoothScroll * 2.1;
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
            if (nz >= 0) continue; // back-face cull
            const nLen = Math.hypot(nx, ny, nz) || 1;
            const light = Math.max(
              0.15,
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
              Math.min(255, Math.round(lerp(baseCol[0], 255, fc.light * 0.72))),
              Math.min(255, Math.round(lerp(baseCol[1], 252, fc.light * 0.72))),
              Math.min(255, Math.round(lerp(baseCol[2], 248, fc.light * 0.72))),
            ];
            ctx.beginPath();
            ctx.moveTo(fc.a.px, fc.a.py);
            ctx.lineTo(fc.b.px, fc.b.py);
            ctx.lineTo(fc.c.px, fc.c.py);
            ctx.closePath();
            ctx.fillStyle = rgb(lit, (depthAlpha * 0.44).toFixed(3));
            ctx.fill();
            ctx.strokeStyle = `rgba(255,255,255,${(depthAlpha * 0.62).toFixed(3)})`;
            ctx.lineWidth = 1.05;
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
     2. 3D INTERACTIVE CARD TILT & SPECULAR GLARE
     ------------------------------------------------------------------------ */
  if (!prefersReduced && window.matchMedia("(hover: hover)").matches) {
    const tiltEls = document.querySelectorAll(
      ".card-3d, .hero-deck-card, .spotlight-grid, .feature-card"
    );
    tiltEls.forEach((el) => {
      const maxTilt = el.classList.contains("spotlight-grid") ? 3.2 : 6.5;
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
     3. 3D SCROLL-REVEAL ENTRANCE FOR CARDS
     ------------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll(".reveal-3d");
  if (revealEls.length && "IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------------
     4. INTERACTIVE CATEGORY FILTER & PIN / PHOTO VIEW TOGGLE (1ST-TIMER UX)
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
          if (match) {
            shown++;
            card.classList.add("is-visible");
          }
        });
        if (countBadge) {
          countBadge.textContent = `${shown} curated pick${shown === 1 ? "" : "s"}`;
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
})();
