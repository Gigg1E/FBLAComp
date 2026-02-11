(function(){
  // Respect reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.body.classList.add('has-particles');

  const canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.mixBlendMode = 'screen';
  canvas.style.opacity = '1';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let DPR = window.devicePixelRatio || 1;

  let W = window.innerWidth;
  let H = window.innerHeight;

  function resize(){
    DPR = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(W * DPR));
    canvas.height = Math.max(1, Math.floor(H * DPR));
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Particle settings
  const baseCount = Math.min(220, Math.round((W*H)/6000)); // scale to viewport
  const colors = [ [255,255,255], [0,217,255], [255,107,53] ];
  const particles = [];
  for (let i=0;i<baseCount;i++){
    const c = colors[Math.floor(Math.random()*colors.length)];
    const size = (Math.random()*3.2) + 0.8; // px
    const alpha = 0.12 + Math.random()*0.44; // 0.12 - 0.56
    particles.push({
      x: Math.random()*W,
      y: Math.random()*H,
      r: size,
      alphaBase: alpha,
      alpha: alpha,
      vx: (Math.random()-0.5) * 0.25, // slow drift
      vy: (Math.random()-0.5) * 0.25,
      color: c,
      twinkle: Math.random()*Math.PI*2,
      twinkleSpeed: 0.002 + Math.random()*0.008
n    });
  }

  let lastTime = performance.now();
  let lastScroll = window.scrollY || 0;

  function step(now){
    const dt = Math.min(40, now - lastTime);
    lastTime = now;

    // subtle parallax from scroll
    const scrollY = window.scrollY || 0;
    const scrollDiff = (scrollY - lastScroll);
    lastScroll = scrollY;

    ctx.clearRect(0,0,W,H);

    for (let p of particles){
      // update position
      p.x += p.vx * (dt/16);
      p.y += p.vy * (dt/16);

      // apply small parallax offset
      p.y += scrollDiff * 0.02 * (0.5 + p.r/4);

      // wrap
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      // twinkle
      p.twinkle += p.twinkleSpeed * dt;
      p.alpha = p.alphaBase * (0.85 + 0.15 * Math.sin(p.twinkle));

      ctx.beginPath();
      const [r,g,b] = p.color;
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (p.alpha) + ')';
      // draw soft circle using shadowBlur for subtle glow
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = Math.min(14, p.r * 3 + 2);
      ctx.shadowColor = 'rgba(' + r + ',' + g + ',' + b + ',' + (p.alpha) + ')';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(step);
  }

  // small performance safety: pause when tab hidden
  let running = true;
  document.addEventListener('visibilitychange', ()=>{
    running = !document.hidden;
    if (running) {
      lastTime = performance.now();
      requestAnimationFrame(step);
    }
  });

  requestAnimationFrame(step);

})();
