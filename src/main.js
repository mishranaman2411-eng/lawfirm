import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScrollState();
  initHeroScrub();
  initDrawers();
  initConsultationAppointmentForm();
  initSmoothScroll();
  initEditorialScrollReveals();
});

/**
 * Navbar background transition on scroll past hero
 */
function initNavbarScrollState() {
  const nav = document.getElementById('site-nav');
  const heroContainer = document.getElementById('hero-experience');
  if (!nav) return;

  function handleNavScroll() {
    if (heroContainer) {
      const heroRect = heroContainer.getBoundingClientRect();
      // Keep navbar clean and transparent during the hero sequence;
      // transition to solid state only when entering the firm sections below
      if (heroRect.bottom <= 80) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    } else if (window.scrollY > window.innerHeight * 2.5) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();
}

/**
 * Hero Canvas Scrub Controller
 * Progressively preloads 190 WebP frames of the Punjab & Haryana High Court
 * and drives rendering via GSAP ScrollTrigger.
 */
function initHeroScrub() {
  const canvas = document.getElementById('courthouse-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  const TOTAL_FRAMES = 190;
  const frames = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let currentRenderedIndex = -1;

  // DOM Elements for HUD / Knockout Stage
  const loaderEl = document.getElementById('hero-loader-status');
  const koStageEl = document.getElementById('hero-knockout-stage');
  const koSvg = document.getElementById('hero-knockout-svg');
  const dContourText = document.getElementById('ko-contour-desktop');
  const mContourText1 = document.getElementById('ko-contour-mob-1');
  const mContourText2 = document.getElementById('ko-contour-mob-2');
  const scrollIndicatorEl = document.querySelector('.hero-scroll-indicator');

  // Generate Frame URL helper
  function getFrameUrl(index) {
    const padded = String(index + 1).padStart(4, '0');
    return `/assets/courthouse-frames/frame_${padded}.webp`;
  }

  // Canvas Sizing with Aspect Ratio & Device Pixel Ratio
  let canvasWidth = 0;
  let canvasHeight = 0;

  /**
   * Calculate precise canvas frame layout and architectural building center
   * Courthouse roof span in 1600x900 frame: x=407 to 1189, architectural center is 798 (798/1600 = 0.49875)
   */
  function getFrameDrawMetrics() {
    const w = canvasWidth;
    const h = canvasHeight;
    const aspect = w / h;
    const srcW = 1600;
    const srcH = 900;

    const SAFE_LEFT = 380;
    const SAFE_RIGHT = 1240;
    const SAFE_WIDTH = SAFE_RIGHT - SAFE_LEFT; // 860px

    let drawW, drawH, drawX, drawY;

    if (w >= 900 && aspect >= 1.25) {
      // DESKTOP: Expansive immersive full-bleed coverage
      const scaleCover = Math.max(w / srcW, h / srcH);
      const testX = (w - srcW * scaleCover) / 2;
      const leftOnScreen = SAFE_LEFT * scaleCover + testX;
      const rightOnScreen = SAFE_RIGHT * scaleCover + testX;

      if (leftOnScreen >= 20 && rightOnScreen <= w - 20) {
        drawW = srcW * scaleCover;
        drawH = srcH * scaleCover;
        drawX = testX;
        drawY = (h - drawH) / 2;
      } else {
        const s = (w - 60) / SAFE_WIDTH;
        drawW = srcW * s;
        drawH = srcH * s;
        drawX = (w - drawW) / 2;
        drawY = (h - drawH) / 2;
      }
    } else {
      // MOBILE & TABLET PORTRAIT:
      // Fit building width comfortably on screen without ever cropping (~88% of screen width)
      const targetBuildingW = Math.min(w * 0.88, SAFE_WIDTH);
      const scale = targetBuildingW / SAFE_WIDTH;
      drawW = srcW * scale;
      drawH = srcH * scale;
      drawX = (w - drawW) / 2;
      drawY = (h - drawH) / 2;
    }

    // Exact horizontal and vertical center of the courthouse architecture on screen
    // Horizontal center: roof beam 407..1189, center is 798 (ratio = 798/1600 = 0.49875)
    // Vertical center: facade 369..660, upper center is 465 (ratio = 465/900 = 0.5167)
    const buildingCenterX = drawX + (798 / 1600) * drawW;
    const buildingCenterY = drawY + (465 / 900) * drawH;

    return { drawW, drawH, drawX, drawY, buildingCenterX, buildingCenterY };
  }

  function updateKnockoutTypography() {
    if (!koSvg) return;
    const w = canvasWidth;
    const h = canvasHeight;
    koSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const { buildingCenterX, buildingCenterY } = getFrameDrawMetrics();
    const isMobile = w < 860;

    if (!isMobile) {
      if (dContourText) dContourText.style.display = 'block';
      if (mContourText1) mContourText1.style.display = 'none';
      if (mContourText2) mContourText2.style.display = 'none';

      // Desktop font size scaled to span across the scene with architectural grace
      const fontSize = Math.min(Math.max(w * 0.053, 46), 92);
      // Centered precisely over the architectural center of the courthouse
      const textY = buildingCenterY;

      if (dContourText) {
        dContourText.setAttribute('font-size', `${fontSize}px`);
        // Precisely positioned at the horizontal architectural center of the courthouse
        dContourText.setAttribute('x', `${buildingCenterX}`);
        dContourText.setAttribute('y', `${textY}`);
      }
    } else {
      if (dContourText) dContourText.style.display = 'none';
      if (mContourText1) mContourText1.style.display = 'block';
      if (mContourText2) mContourText2.style.display = 'block';

      // Mobile font size scaled for 2 balanced lines without awkward wrapping or clipping
      const fontSize = Math.min(Math.max(w * 0.082, 28), 44);
      const y1 = buildingCenterY - fontSize * 0.68;
      const y2 = buildingCenterY + fontSize * 0.68;

      if (mContourText1) {
        mContourText1.setAttribute('font-size', `${fontSize}px`);
        mContourText1.setAttribute('x', `${buildingCenterX}`);
        mContourText1.setAttribute('y', `${y1}`);
      }
      if (mContourText2) {
        mContourText2.setAttribute('font-size', `${fontSize}px`);
        mContourText2.setAttribute('x', `${buildingCenterX}`);
        mContourText2.setAttribute('y', `${y2}`);
      }
    }
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = rect.width;
    canvasHeight = rect.height;

    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    updateKnockoutTypography();

    if (currentRenderedIndex >= 0) {
      drawFrame(currentRenderedIndex);
    }
  }

  window.addEventListener('resize', resizeCanvas);

  // High-performance Draw function that preserves 16:9 aspect ratio without cropping
  function drawFrame(frameIndex) {
    const targetImg = findNearestLoadedFrame(frameIndex);
    if (!targetImg || !targetImg.complete || targetImg.naturalWidth === 0) return;

    currentRenderedIndex = frameIndex;

    const w = canvasWidth;
    const h = canvasHeight;
    const { drawW, drawH, drawX, drawY } = getFrameDrawMetrics();

    // Atmospheric background gradient matching exact frame edge colors
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#C5D6D9');
    grad.addColorStop(0.35, '#CCD7DA');
    grad.addColorStop(0.65, '#C8CDC6');
    grad.addColorStop(1, '#C4C8C0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw the frame
    ctx.drawImage(targetImg, drawX, drawY, drawW, drawH);

    // Feather top and bottom edges if letterboxed on mobile or portrait
    if (drawY > 0) {
      // Soft sky transition above drawY
      const skyGrad = ctx.createLinearGradient(0, 0, 0, drawY + 65);
      skyGrad.addColorStop(0, '#C5D6D9');
      skyGrad.addColorStop(0.45, '#C5D6D9');
      skyGrad.addColorStop(1, 'rgba(197, 214, 217, 0)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, drawY + 65);

      // Soft cloud transition below drawY + drawH
      const cloudGrad = ctx.createLinearGradient(0, drawY + drawH - 65, 0, h);
      cloudGrad.addColorStop(0, 'rgba(196, 200, 192, 0)');
      cloudGrad.addColorStop(0.45, '#C4C8C0');
      cloudGrad.addColorStop(1, '#C4C8C0');
      ctx.fillStyle = cloudGrad;
      ctx.fillRect(0, drawY + drawH - 65, w, h - (drawY + drawH - 65));
    }
  }

  // Graceful fallback for rapid scrubs: finds closest loaded neighbor frame
  function findNearestLoadedFrame(index) {
    if (frames[index] && frames[index].complete) {
      return frames[index];
    }
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = index - offset;
      if (prev >= 0 && frames[prev] && frames[prev].complete) {
        return frames[prev];
      }
      const next = index + offset;
      if (next < TOTAL_FRAMES && frames[next] && frames[next].complete) {
        return frames[next];
      }
    }
    return frames[0];
  }

  // Progressive Preloading Strategy
  const tier1Indices = [0, 20, 50, 90, 120, 150, 189];
  let tier1Loaded = 0;

  function loadSingleFrame(index, onComplete) {
    if (frames[index]) {
      if (onComplete) onComplete();
      return;
    }
    const img = new Image();
    img.src = getFrameUrl(index);
    img.onload = () => {
      frames[index] = img;
      loadedCount++;
      if (index === 0 && currentRenderedIndex === -1) {
        resizeCanvas();
        drawFrame(0);
      }
      if (onComplete) onComplete();
    };
    img.onerror = () => {
      if (onComplete) onComplete();
    };
  }

  // Start Tier 1
  tier1Indices.forEach((idx) => {
    loadSingleFrame(idx, () => {
      tier1Loaded++;
      if (tier1Loaded === 1) {
        resizeCanvas();
        drawFrame(0);
      }
      if (tier1Loaded === tier1Indices.length) {
        streamRemainingFrames();
      }
    });
  });

  // Tier 2: Stream all other frames in chunks
  function streamRemainingFrames() {
    let nextIndex = 0;
    const batchSize = 6;

    function loadNextBatch() {
      if (nextIndex >= TOTAL_FRAMES) {
        if (loaderEl) {
          loaderEl.classList.add('hidden');
        }
        return;
      }

      let batchLoaded = 0;
      const countToLoad = Math.min(batchSize, TOTAL_FRAMES - nextIndex);

      for (let i = 0; i < countToLoad; i++) {
        const target = nextIndex + i;
        if (!frames[target]) {
          loadSingleFrame(target, () => {
            batchLoaded++;
            if (loaderEl) {
              const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
              loaderEl.textContent = `CHAMBERS VIEW · ${pct}%`;
            }
            if (batchLoaded === countToLoad) {
              nextIndex += batchSize;
              setTimeout(loadNextBatch, 16);
            }
          });
        } else {
          batchLoaded++;
          if (batchLoaded === countToLoad) {
            nextIndex += batchSize;
            setTimeout(loadNextBatch, 16);
          }
        }
      }
    }

    loadNextBatch();
  }

  // GSAP ScrollTrigger Sequence
  const heroTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero-scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6, // Smooth cinematic scrub with silky inertia
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        const targetFrame = Math.min(TOTAL_FRAMES - 1, Math.floor(p * TOTAL_FRAMES));
        drawFrame(targetFrame);

        // Fade scroll indicator as user scrolls
        if (scrollIndicatorEl) {
          scrollIndicatorEl.style.opacity = Math.max(0, 1 - p * 3.5);
        }
      }
    }
  });

  // MALIK & ASSOCIATES Hero Typography Trajectory:
  // Starts centered over the courthouse architecture, slowly glides downward across the facade
  // with a very subtle scale increase for depth, and smoothly dissolves into the Overview section.
  if (koStageEl && koSvg) {
    // 1. Initial emergence as the courthouse ascends through clouds (progress 0.10 -> 0.32)
    heroTimeline.fromTo(koStageEl,
      { opacity: 0 },
      { opacity: 1, ease: 'power1.out', duration: 0.22 },
      0.10
    );

    // 2. Slow, graceful downward drift across the courthouse facade with subtle scale increase for depth (progress 0.12 -> 0.78)
    // Modest translation: 54px on desktop, 34px on mobile; scale from 1.0 to 1.032
    heroTimeline.fromTo(koSvg,
      { y: 0, scale: 1.0 },
      {
        y: () => (window.innerWidth < 860 ? 34 : 54),
        scale: 1.032,
        ease: 'sine.inOut',
        duration: 0.66
      },
      0.12
    );

    // 3. Smooth dissolution toward the end of the hero sequence before entering the Overview section (progress 0.78 -> 0.96)
    heroTimeline.to(koStageEl,
      { opacity: 0, ease: 'power1.in', duration: 0.18 },
      0.78
    );

    // Subtle continuation of the downward drift during dissolution so there is zero abrupt stop (progress 0.78 -> 0.96)
    heroTimeline.to(koSvg,
      {
        y: () => (window.innerWidth < 860 ? 44 : 68),
        scale: 1.038,
        ease: 'none',
        duration: 0.18
      },
      0.78
    );
  }

  // Initial render setup
  resizeCanvas();
}

/**
 * Interactive Expandable Drawers (Firm Overview, Practices, Advocates)
 */
function initDrawers() {
  // 1. The Firm Doctrine Expand
  document.querySelectorAll('.btn-firm-expand').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetSelector = btn.getAttribute('data-target');
      const drawer = document.querySelector(targetSelector);
      if (!drawer) return;
      const isOpen = drawer.classList.contains('open');
      drawer.classList.toggle('open', !isOpen);
      btn.classList.toggle('active', !isOpen);
      btn.setAttribute('aria-expanded', !isOpen);
    });
  });

  // 2. Practice Disciplines Catalogue Toggle
  document.querySelectorAll('.btn-catalogue-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetSelector = btn.getAttribute('data-target');
      const drawer = document.querySelector(targetSelector);
      if (!drawer) return;
      const isOpen = drawer.classList.contains('open');
      drawer.classList.toggle('open', !isOpen);
      btn.classList.toggle('active', !isOpen);
      btn.setAttribute('aria-expanded', !isOpen);
      const text = btn.querySelector('.toggle-text');
      if (text) text.textContent = isOpen ? 'Examine Practice Scope' : 'Close Practice Scope';
    });
  });

  // 3. Advocates Background Details Toggle
  document.querySelectorAll('.btn-advocate-details').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetSelector = btn.getAttribute('data-target');
      const drawer = document.querySelector(targetSelector);
      if (!drawer) return;
      const isOpen = drawer.classList.contains('open');
      drawer.classList.toggle('open', !isOpen);
      btn.classList.toggle('active', !isOpen);
      btn.setAttribute('aria-expanded', !isOpen);
      const text = btn.querySelector('.btn-adv-text');
      if (text) text.textContent = isOpen ? 'View Professional Background' : 'Hide Professional Background';
    });
  });
}

/**
 * Confidential Consultation Appointment Form Handler
 */
function initConsultationAppointmentForm() {
  const form = document.getElementById('consultation-intake-form');
  const statusMsg = document.getElementById('intake-status-msg');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit-appointment');
    if (!btn) return;

    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>Checking Conflict &amp; Transmitting...</span>';
    btn.disabled = true;

    // Simulated verified intake transmission
    setTimeout(() => {
      const refCode = 'MA-' + Math.floor(1000 + Math.random() * 9000);
      btn.innerHTML = '<span>Appointment Request Registered</span>';
      
      if (statusMsg) {
        statusMsg.className = 'form-feedback-pill success';
        statusMsg.innerHTML = `
          <strong>Chambers Registry Notice:</strong> Request reference <strong>#${refCode}</strong> generated.<br />
          Counsel will conduct preliminary conflict clearance and contact your office within 4 business hours.
        `;
      }
      form.reset();

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 6000);
    }, 900);
  });
}

/**
 * Smooth Anchor Scrolling for navigation
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * Subtle GSAP ScrollTrigger Editorial Reveals
 */
function initEditorialScrollReveals() {
  // 1. Profile Band Items
  gsap.utils.toArray('.profile-band-item').forEach((item, i) => {
    gsap.from(item, {
      scrollTrigger: {
        trigger: item,
        start: 'top 88%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 20,
      duration: 0.6,
      delay: i * 0.1,
      ease: 'power2.out'
    });
  });

  // 2. Practice Catalogue Items
  gsap.utils.toArray('.catalogue-item').forEach((item, i) => {
    gsap.from(item, {
      scrollTrigger: {
        trigger: item,
        start: 'top 88%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 24,
      duration: 0.65,
      delay: (i % 3) * 0.1,
      ease: 'power2.out'
    });
  });

  // 3. Doctrine Columns
  gsap.utils.toArray('.doctrine-col').forEach((col, i) => {
    gsap.from(col, {
      scrollTrigger: {
        trigger: col,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 30,
      duration: 0.7,
      delay: i * 0.12,
      ease: 'power2.out'
    });
  });

  // 4. Advocate Profile Cards
  gsap.utils.toArray('.advocate-profile-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 24,
      duration: 0.65,
      delay: (i % 2) * 0.12,
      ease: 'power2.out'
    });
  });
}
