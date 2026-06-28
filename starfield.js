(function () {
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w, h, stars, shootingStars;
  const STAR_COUNT_DENSITY = 0.00012; // stars per px^2

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = document.documentElement.scrollHeight;
    initStars();
  }

  function initStars() {
    const count = Math.floor(w * window.innerHeight * STAR_COUNT_DENSITY);
    stars = new Array(count).fill(0).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.2,
      baseAlpha: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    }));
    shootingStars = [];
  }

  function spawnShootingStar() {
    if (prefersReducedMotion) return;
    const startX = Math.random() * w * 0.7 + w * 0.15;
    const startY = Math.random() * h * 0.3;
    const angle = (Math.PI / 4) + (Math.random() * 0.3 - 0.15);
    const speed = Math.random() * 6 + 8;
    shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: Math.random() * 30 + 40,
      length: Math.random() * 80 + 60,
    });
  }

  function scheduleShootingStar() {
    const delay = Math.random() * 4000 + 2500;
    setTimeout(() => {
      spawnShootingStar();
      scheduleShootingStar();
    }, delay);
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);

    // twinkling stars
    for (const s of stars) {
      const alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.25;
      ctx.beginPath();
      ctx.fillStyle = `rgba(237,239,245,${Math.max(alpha, 0)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life++;

      const progress = ss.life / ss.maxLife;
      const alpha = Math.max(1 - progress, 0);

      const tailX = ss.x - (ss.vx / Math.hypot(ss.vx, ss.vy)) * ss.length;
      const tailY = ss.y - (ss.vy / Math.hypot(ss.vx, ss.vy)) * ss.length;

      const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      if (ss.life > ss.maxLife || ss.y > h) {
        shootingStars.splice(i, 1);
      }
    }

    if (!prefersReducedMotion) {
      requestAnimationFrame(draw);
    }
  }

  window.addEventListener("resize", resize);
  resize();

  if (!prefersReducedMotion) {
    requestAnimationFrame(draw);
    scheduleShootingStar();
  } else {
    draw(0);
  }
})();
