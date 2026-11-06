import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Unified, Hardware-Accelerated Scroll UI Manager
 * Consolidates navbar solid state, ScrollSpy navigation highlighting, and back-to-top button
 * into a single requestAnimationFrame-throttled loop without layout thrashing.
 */
let cachedHeroThreshold = 0;
let cachedBackToTopThreshold = 0;
let cachedSections = [];
let cachedNavLinks = [];
let scrollTicking = false;

function updateScrollMetrics() {
  const heroContainer = document.getElementById('hero-experience');
  cachedHeroThreshold = heroContainer ? heroContainer.offsetHeight - 80 : window.innerHeight * 2.5;
  cachedBackToTopThreshold = window.innerHeight * 1.8;

  const sectionIds = ['advocates', 'practice-areas', 'firm-statistics', 'approach', 'consultation'];
  cachedSections = sectionIds
    .map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      return {
        id,
        top: el.offsetTop,
        height: el.offsetHeight
      };
    })
    .filter(Boolean);

  cachedNavLinks = Array.from(document.querySelectorAll('.site-nav__link, .mobile-nav-link'));
}

function handleUnifiedScroll() {
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;

      // 1. Navbar Solid State
      const nav = document.getElementById('site-nav');
      if (nav) {
        if (scrollY >= cachedHeroThreshold) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      }

      // 2. Back to Top Button
      const backBtn = document.getElementById('back-to-top');
      if (backBtn) {
        if (scrollY > cachedBackToTopThreshold) {
          backBtn.classList.add('visible');
        } else {
          backBtn.classList.remove('visible');
        }
      }

      // 3. ScrollSpy Active Link
      const scrollPos = scrollY + window.innerHeight * 0.35;
      let currentId = '';
      for (let i = 0; i < cachedSections.length; i++) {
        const sec = cachedSections[i];
        if (scrollPos >= sec.top && scrollPos < sec.top + sec.height) {
          currentId = sec.id;
          break;
        }
      }

      for (let i = 0; i < cachedNavLinks.length; i++) {
        const link = cachedNavLinks[i];
        const href = link.getAttribute('href');
        if (currentId && href === '#' + currentId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }

      scrollTicking = false;
    });
  }
}

function initScrollUIManager() {
  updateScrollMetrics();
  window.addEventListener('scroll', handleUnifiedScroll, { passive: true });
  window.addEventListener('resize', updateScrollMetrics, { passive: true });
  ScrollTrigger.addEventListener('refresh', updateScrollMetrics);

  const backBtn = document.getElementById('back-to-top');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  handleUnifiedScroll();
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollUIManager();
  initMobileNav();
  initHeroScrub();
  initDrawers();
  initInteractiveMatterScrubber();
  initInteractiveDoctrinePleading();
  initConsultationAppointmentForm();
  initSmoothScroll();
  initEditorialScrollReveals();
  init3DCardTilt();
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

  // DOM Elements for HUD / Hero Opening / Knockout Stage
  const preloaderEl = document.getElementById('site-preloader');
  const preloaderBar = document.getElementById('preloader-circle-bar');
  const preloaderPercent = document.getElementById('preloader-percent');
  const preloaderStatus = document.getElementById('preloader-status');
  const heroOpeningEl = document.getElementById('hero-opening-content');
  const koStageEl = document.getElementById('hero-knockout-stage');
  const koSvg = document.getElementById('hero-knockout-svg');
  const koLiveImg = document.getElementById('ko-live-image');
  const clipDesk = document.getElementById('ko-clip-desktop');
  const contourDesk = document.getElementById('ko-contour-desktop');
  const subDesk = document.getElementById('ko-sub-desktop');
  const clipMob = document.getElementById('ko-clip-mob');
  const contourMob = document.getElementById('ko-contour-mob');
  const subMob = document.getElementById('ko-sub-mob');
  const scrollIndicatorEl = document.querySelector('.hero-scroll-indicator');

  // Generate Frame URL helper
  function getFrameUrl(index) {
    const padded = String(index + 1).padStart(4, '0');
    return `/assets/courthouse-frames/frame_${padded}.webp`;
  }

  // Canvas Sizing with Aspect Ratio & Device Pixel Ratio
  let canvasWidth = 0;
  let canvasHeight = 0;
  let cachedMetrics = null;
  let cachedDesktopBgGrad = null;
  let cachedSkyGrad = null;
  let cachedCloudGrad = null;
  let cachedAmbGrad = null;
  let cachedTopFeatherGrad = null;
  let cachedBotFeatherGrad = null;
  let lastSvgFrameIndex = -1;

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
      // Fit building width comfortably on screen without ever cropping (~94% of screen width)
      const targetBuildingW = Math.min(w * 0.94, SAFE_WIDTH);
      const scale = targetBuildingW / SAFE_WIDTH;
      drawW = srcW * scale;
      drawH = srcH * scale;
      drawX = (w - drawW) / 2;
      drawY = (h - drawH) / 2;
    }

    // Exact horizontal and vertical center of the courthouse architecture on screen
    const buildingCenterX = drawX + (798 / 1600) * drawW;
    const buildingCenterY = drawY + (465 / 900) * drawH;

    return { drawW, drawH, drawX, drawY, buildingCenterX, buildingCenterY };
  }

  function updateKnockoutTypography() {
    if (!koSvg) return;
    const w = canvasWidth;
    const h = canvasHeight;
    koSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const { buildingCenterX, buildingCenterY } = cachedMetrics || getFrameDrawMetrics();
    const isMobile = w < 860;

    if (!isMobile) {
      if (clipDesk) clipDesk.style.display = 'block';
      if (contourDesk) contourDesk.style.display = 'block';
      if (subDesk) subDesk.style.display = 'block';

      if (clipMob) clipMob.style.display = 'none';
      if (contourMob) contourMob.style.display = 'none';
      if (subMob) subMob.style.display = 'none';

      // Giant architectural typography matching reference
      const mainFontSize = Math.min(Math.max(w * 0.105, 68), 150);
      const subFontSize = Math.min(Math.max(w * 0.022, 16), 32);

      const mainY = buildingCenterY - mainFontSize * 0.12;
      const subY = buildingCenterY + mainFontSize * 0.58;

      [clipDesk, contourDesk].forEach(el => {
        if (el) {
          el.setAttribute('font-size', `${mainFontSize}px`);
          el.setAttribute('x', `${buildingCenterX}`);
          el.setAttribute('y', `${mainY}`);
        }
      });

      if (subDesk) {
        subDesk.setAttribute('font-size', `${subFontSize}px`);
        subDesk.setAttribute('x', `${buildingCenterX}`);
        subDesk.setAttribute('y', `${subY}`);
      }
    } else {
      if (clipDesk) clipDesk.style.display = 'none';
      if (contourDesk) contourDesk.style.display = 'none';
      if (subDesk) subDesk.style.display = 'none';

      if (clipMob) clipMob.style.display = 'block';
      if (contourMob) contourMob.style.display = 'block';
      if (subMob) subMob.style.display = 'block';

      const mainFontSize = Math.min(Math.max(w * 0.16, 44), 82);
      const subFontSize = Math.min(Math.max(w * 0.045, 13), 22);

      const mainY = buildingCenterY - mainFontSize * 0.18;
      const subY = buildingCenterY + mainFontSize * 0.52;

      [clipMob, contourMob].forEach(el => {
        if (el) {
          el.setAttribute('font-size', `${mainFontSize}px`);
          el.setAttribute('x', `${buildingCenterX}`);
          el.setAttribute('y', `${mainY}`);
        }
      });

      if (subMob) {
        subMob.setAttribute('font-size', `${subFontSize}px`);
        subMob.setAttribute('x', `${buildingCenterX}`);
        subMob.setAttribute('y', `${subY}`);
      }
    }
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const isMobile = window.innerWidth < 860;
    // On mobile screens, use 1.0 DPR to eliminate fillrate lag on high-DPI retina devices
    const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.25);
    canvasWidth = rect.width;
    canvasHeight = rect.height;

    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cachedMetrics = getFrameDrawMetrics();
    const { drawW, drawH, drawX, drawY } = cachedMetrics;
    const w = canvasWidth;
    const h = canvasHeight;

    // Pre-create and cache desktop gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#C5D6D9');
    grad.addColorStop(0.35, '#CCD7DA');
    grad.addColorStop(0.65, '#C8CDC6');
    grad.addColorStop(1, '#C4C8C0');
    cachedDesktopBgGrad = grad;

    if (drawY > 0) {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, drawY + 65);
      skyGrad.addColorStop(0, '#C5D6D9');
      skyGrad.addColorStop(0.45, '#C5D6D9');
      skyGrad.addColorStop(1, 'rgba(197, 214, 217, 0)');
      cachedSkyGrad = skyGrad;

      const cloudGrad = ctx.createLinearGradient(0, drawY + drawH - 65, 0, h);
      cloudGrad.addColorStop(0, 'rgba(196, 200, 192, 0)');
      cloudGrad.addColorStop(0.45, '#C4C8C0');
      cloudGrad.addColorStop(1, '#C4C8C0');
      cachedCloudGrad = cloudGrad;
    } else {
      cachedSkyGrad = null;
      cachedCloudGrad = null;
    }

    const aGrad = ctx.createLinearGradient(0, 0, 0, h);
    aGrad.addColorStop(0, 'rgba(197, 214, 217, 0.40)');
    aGrad.addColorStop(0.26, 'rgba(24, 21, 19, 0.04)');
    aGrad.addColorStop(0.74, 'rgba(24, 21, 19, 0.04)');
    aGrad.addColorStop(1, 'rgba(196, 200, 192, 0.48)');
    cachedAmbGrad = aGrad;

    const fH = Math.ceil(drawH);
    const topFeather = fH * 0.20;
    const tGrad = ctx.createLinearGradient(0, 0, 0, topFeather);
    tGrad.addColorStop(0, 'rgba(0,0,0,1)');
    tGrad.addColorStop(0.65, 'rgba(0,0,0,0.4)');
    tGrad.addColorStop(1, 'rgba(0,0,0,0)');
    cachedTopFeatherGrad = tGrad;

    const botFeather = fH * 0.22;
    const bGrad = ctx.createLinearGradient(0, fH - botFeather, 0, fH);
    bGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bGrad.addColorStop(0.65, 'rgba(0,0,0,0.4)');
    bGrad.addColorStop(1, 'rgba(0,0,0,1)');
    cachedBotFeatherGrad = bGrad;

    // Set static SVG bounds on resize instead of every scroll frame
    if (koLiveImg) {
      koLiveImg.setAttribute('x', `${drawX}`);
      koLiveImg.setAttribute('y', `${drawY}`);
      koLiveImg.setAttribute('width', `${drawW}`);
      koLiveImg.setAttribute('height', `${drawH}`);
    }

    updateKnockoutTypography();

    const frameToRedraw = currentRenderedIndex >= 0 ? currentRenderedIndex : 0;
    currentRenderedIndex = -1;
    drawFrame(frameToRedraw);
  }

  window.addEventListener('resize', resizeCanvas);

  // Pre-allocated offscreen buffers for mobile full-screen atmospheric rendering
  let ambientCanvas = null;
  let ambientCtx = null;
  let featherCanvas = null;
  let featherCtx = null;

  // Fast lookup for loaded frame with capped search radius
  function findNearestLoadedFrame(index) {
    if (frames[index] && frames[index].complete && frames[index].naturalWidth > 0) {
      return frames[index];
    }
    const maxSearch = Math.min(25, TOTAL_FRAMES);
    for (let offset = 1; offset < maxSearch; offset++) {
      const prev = index - offset;
      if (prev >= 0 && frames[prev] && frames[prev].complete && frames[prev].naturalWidth > 0) {
        return frames[prev];
      }
      const next = index + offset;
      if (next < TOTAL_FRAMES && frames[next] && frames[next].complete && frames[next].naturalWidth > 0) {
        return frames[next];
      }
    }
    return frames[0] || null;
  }

  // High-performance Draw function with direct GPU blitting (zero offscreen canvas overhead)
  function drawFrame(frameIndex) {
    if (frameIndex === currentRenderedIndex) return;

    const targetImg = findNearestLoadedFrame(frameIndex);
    if (!targetImg || !targetImg.complete || targetImg.naturalWidth === 0) return;

    currentRenderedIndex = frameIndex;

    const w = canvasWidth;
    const h = canvasHeight;
    const { drawW, drawH, drawX, drawY } = cachedMetrics || getFrameDrawMetrics();

    // 1. Background sky-to-cloud gradient
    if (cachedDesktopBgGrad) {
      ctx.fillStyle = cachedDesktopBgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Direct hardware image blit
    ctx.drawImage(targetImg, drawX, drawY, drawW, drawH);

    // 3. Cached seamless feathering for top sky and bottom cloud edges
    if (drawY > 0 && cachedSkyGrad && cachedCloudGrad) {
      ctx.fillStyle = cachedSkyGrad;
      ctx.fillRect(0, 0, w, drawY + 45);

      ctx.fillStyle = cachedCloudGrad;
      ctx.fillRect(0, drawY + drawH - 45, w, h - (drawY + drawH - 45));
    }
  }

  // Progressive Preloading & Full-Screen Chambers Preloader Setup
  const CIRCLE_CIRCUMFERENCE = 188.5; // 2 * Math.PI * 30
  const criticalFrameIndices = [0, 1, 2, 3, 4, 5, 20, 50, 90, 120, 150, 189];
  const advocatePortraits = [
    '/assets/advocates/sapna-malik.jpg',
    '/assets/advocates/priyanka-priyadarshini.jpg',
    '/assets/advocates/manjunatha-ht.jpg',
    '/assets/advocates/sheetal-sharma.jpg'
  ];

  const totalCriticalUnits = criticalFrameIndices.length + advocatePortraits.length + 1; // +1 for fonts
  let loadedCriticalUnits = 0;
  let preloaderCompleted = false;

  function onCriticalUnitLoaded() {
    loadedCriticalUnits++;
  }

  // Track fonts
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      onCriticalUnitLoaded();
    }).catch(() => {
      onCriticalUnitLoaded();
    });
  } else {
    onCriticalUnitLoaded();
  }

  // Track advocate portraits
  advocatePortraits.forEach((src) => {
    const img = new Image();
    img.src = src;
    img.onload = () => onCriticalUnitLoaded();
    img.onerror = () => onCriticalUnitLoaded();
  });

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

  // Load critical frames
  criticalFrameIndices.forEach((idx) => {
    loadSingleFrame(idx, () => {
      onCriticalUnitLoaded();
    });
  });

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startTime = performance.now();
  const minDuration = prefersReduced ? 250 : 1200; // Controlled luxury minimum duration
  const safetyTimeout = 5000; // Safety fallback prevents indefinite stall

  let displayProgress = 0;
  let rafId = null;

  function updatePreloaderStatusText(pct) {
    if (!preloaderStatus) return;
    let label = 'INITIALIZING CHAMBERS ARCHIVE';
    if (pct >= 100) {
      label = 'CHAMBERS PREPARED · ADMITTING';
    } else if (pct >= 85) {
      label = 'PREPARING BENCH ADMISSION';
    } else if (pct >= 55) {
      label = 'CALIBRATING APPELLATE ARCHIVE';
    } else if (pct >= 25) {
      label = 'LOADING JURISDICTION ASSETS';
    }
    if (preloaderStatus.textContent !== label) {
      preloaderStatus.textContent = label;
    }
  }

  function finishPreloader() {
    if (preloaderCompleted) return;
    preloaderCompleted = true;
    cancelAnimationFrame(rafId);

    // Pre-draw pristine frame 0 while preloader curtain is still opaque
    resizeCanvas();
    drawFrame(0);

    // Lock to 100%
    if (preloaderPercent) preloaderPercent.textContent = '100';
    if (preloaderBar) preloaderBar.style.strokeDashoffset = '0';
    updatePreloaderStatusText(100);

    // Brief 300ms hold at 100% for prestige perception
    const holdDuration = prefersReduced ? 50 : 300;

    setTimeout(() => {
      if (!preloaderEl) {
        document.body.classList.remove('is-loading');
        document.body.style.overflow = '';
        streamRemainingFrames();
        return;
      }

      if (prefersReduced) {
        preloaderEl.style.display = 'none';
        preloaderEl.setAttribute('aria-busy', 'false');
        document.body.classList.remove('is-loading');
        document.body.style.overflow = '';
        streamRemainingFrames();
        ScrollTrigger.refresh();
        return;
      }

      const exitTl = gsap.timeline({
        onComplete: () => {
          preloaderEl.style.display = 'none';
          preloaderEl.setAttribute('aria-busy', 'false');
          document.body.classList.remove('is-loading');
          document.body.style.overflow = '';
          streamRemainingFrames();
          ScrollTrigger.refresh();
        }
      });

      exitTl.to('.preloader-inner', {
        y: -24,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut'
      })
      .to(preloaderEl, {
        opacity: 0,
        duration: 0.65,
        ease: 'power2.inOut'
      }, '-=0.2');
    }, holdDuration);
  }

  function preloaderLoop(currentTime) {
    if (preloaderCompleted) return;
    const elapsed = currentTime - startTime;
    const isTimeout = elapsed >= safetyTimeout;

    // Actual progress from real asset tracking
    const realProgress = isTimeout ? 1.0 : Math.min(1.0, loadedCriticalUnits / totalCriticalUnits);
    const timeProgress = Math.min(1.0, elapsed / minDuration);

    // Target progress slows near 90% until real assets finish
    let targetPct;
    if (realProgress >= 1.0) {
      targetPct = timeProgress >= 1.0 ? 100 : timeProgress * 100;
    } else {
      // Hold back at ~88-92% while waiting for assets
      targetPct = Math.min(realProgress * 100, 88 + timeProgress * 6);
    }

    // Smoothly step towards target
    const diff = targetPct - displayProgress;
    const step = Math.max(diff * 0.12, 0.45);
    displayProgress += step;

    if (displayProgress >= 99.5 && realProgress >= 1.0 && (timeProgress >= 1.0 || isTimeout)) {
      displayProgress = 100;
      finishPreloader();
      return;
    }

    const currentRounded = Math.min(99, Math.floor(displayProgress));
    if (preloaderPercent) {
      preloaderPercent.textContent = String(currentRounded);
    }
    if (preloaderBar) {
      const offset = CIRCLE_CIRCUMFERENCE * (1 - displayProgress / 100);
      preloaderBar.style.strokeDashoffset = String(Math.max(0, offset.toFixed(2)));
    }
    updatePreloaderStatusText(currentRounded);

    rafId = requestAnimationFrame(preloaderLoop);
  }

  rafId = requestAnimationFrame(preloaderLoop);

  // Tier 2: Stream all other frames quietly in background batches
  function streamRemainingFrames() {
    let nextIndex = 0;
    const batchSize = 6;

    function loadNextBatch() {
      if (nextIndex >= TOTAL_FRAMES) return;

      let batchLoaded = 0;
      const countToLoad = Math.min(batchSize, TOTAL_FRAMES - nextIndex);

      for (let i = 0; i < countToLoad; i++) {
        const target = nextIndex + i;
        if (!frames[target]) {
          loadSingleFrame(target, () => {
            batchLoaded++;
            if (batchLoaded === countToLoad) {
              nextIndex += batchSize;
              setTimeout(loadNextBatch, 32);
            }
          });
        } else {
          batchLoaded++;
          if (batchLoaded === countToLoad) {
            nextIndex += batchSize;
            setTimeout(loadNextBatch, 32);
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
      scrub: 0.1, // Near-instant 100ms scrub response — eliminates 600ms trailing lag
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        const targetFrame = Math.min(TOTAL_FRAMES - 1, Math.floor(p * TOTAL_FRAMES));
        drawFrame(targetFrame);

        const isMobileDevice = window.innerWidth < 860;
        // Only update knockout SVG href on desktop where clip-path is active
        if (!isMobileDevice && koLiveImg && p >= 0.18 && p <= 0.98 && targetFrame !== lastSvgFrameIndex) {
          lastSvgFrameIndex = targetFrame;
          koLiveImg.setAttribute('href', getFrameUrl(targetFrame));
        }

        // Fade scroll indicator as user scrolls
        if (scrollIndicatorEl) {
          scrollIndicatorEl.style.opacity = Math.max(0, 1 - p * 3.5);
        }
      }
    }
  });

  // 1. Initial hero opening content slides up and dissolves as user begins scrolling (0 -> 0.22)
  if (heroOpeningEl) {
    heroTimeline.to(heroOpeningEl, {
      y: -75,
      opacity: 0,
      ease: 'power1.out',
      duration: 0.22
    }, 0);
  }

  // 2. MALIK & ASSOCIATES Hero Typography Trajectory:
  // Starts centered over the courthouse architecture, slowly glides downward across the facade
  // with a very subtle scale increase for depth, and smoothly dissolves into Chambers Perspective.
  if (koStageEl && koSvg) {
    // Emergence as the courthouse ascends into center view (progress 0.20 -> 0.35)
    heroTimeline.fromTo(koStageEl,
      { opacity: 0 },
      { opacity: 1, ease: 'power1.out', duration: 0.15 },
      0.20
    );

    // Slow, graceful downward drift across the courthouse facade with subtle scale increase for depth (progress 0.20 -> 0.78)
    // Modest translation: 54px on desktop, 34px on mobile; scale from 1.0 to 1.032
    heroTimeline.fromTo(koSvg,
      { y: 0, scale: 1.0 },
      {
        y: () => (window.innerWidth < 860 ? 34 : 54),
        scale: 1.032,
        ease: 'sine.inOut',
        duration: 0.58
      },
      0.20
    );

    // Smooth dissolution toward the end of the hero sequence before entering Chambers Perspective (progress 0.78 -> 0.96)
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
  // 1. Practice Disciplines Catalogue Toggle
  document.querySelectorAll('.btn-catalogue-toggle').forEach((btn) => {
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

  // 2. Advocates Background Details Toggle
  document.querySelectorAll('.btn-advocate-details').forEach((btn) => {
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
}

/**
 * Mobile Navigation Drawer Controller
 */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const drawer = document.getElementById('mobile-nav-drawer');
  const closeBtn = document.getElementById('mobile-nav-close');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  if (!toggleBtn || !drawer) return;

  function openMenu() {
    drawer.classList.add('open');
    toggleBtn.classList.add('open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    drawer.classList.remove('open');
    toggleBtn.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) closeMenu();
    else openMenu();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  drawer.querySelectorAll('.mobile-nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeMenu();
    }
  });
}

/**
 * ScrollSpy: Highlights active navigation link based on current viewport section
 */
function initScrollSpy() {
  const sectionIds = ['advocates', 'practice-areas', 'firm-statistics', 'approach', 'consultation'];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;

  function updateActiveNav() {
    const scrollPos = window.scrollY + window.innerHeight * 0.35;
    let currentId = '';

    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    document.querySelectorAll('.site-nav__link, .mobile-nav-link').forEach((link) => {
      const href = link.getAttribute('href');
      if (currentId && href === `#${currentId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();
}

/**
 * Floating Back-to-Top Button Controller
 */
function initBackToTop() {
  const backBtn = document.getElementById('back-to-top');
  if (!backBtn) return;

  function handleScroll() {
    if (window.scrollY > window.innerHeight * 1.8) {
      backBtn.classList.add('visible');
    } else {
      backBtn.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  backBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Confidential Consultation Appointment Form Handler
 */
/**
 * Interactive Matter Scrubber: Walk a matter through court
 * Inspired by malik-interactive.html, elevated with luxury architectural styling
 */
function initInteractiveMatterScrubber() {
  const scroller = document.getElementById('matter-scroller');
  const picker = document.getElementById('matter-picker');
  const trackRow = document.getElementById('matter-track-row');
  const fill = document.getElementById('matter-track-fill');
  const whereEl = document.getElementById('matter-detail-where');
  const titleEl = document.getElementById('matter-detail-title');
  const descEl = document.getElementById('matter-detail-desc');
  const hintEl = document.getElementById('matter-scroll-hint');

  if (!scroller || !picker || !trackRow) return;

  const MATTERS = [
    {
      name: 'Commercial Litigation',
      steps: [
        ['Pre-suit review', 'Chambers', 'We inspect contracts, correspondence, and payment ledgers before issuing a formal demand notice under statute.'],
        ['Plaint & indexing', 'Delhi High Court', 'The commercial suit is drafted with an exhaustive document schedule, statement of truth, and urgent listing application.'],
        ['Interim relief', 'Commercial Bench', 'We press for an ad-interim injunction or asset freeze to protect client rights while the dispute proceeds.'],
        ['Trial & arguments', 'Commercial Court', 'Concise propositions of law grounded in the Commercial Courts Act and binding precedents.'],
        ['Decree or settlement', 'Commercial Decree', 'A formal decree on merits, or a judicially recorded settlement if that serves business objectives faster.']
      ]
    },
    {
      name: 'Property & HARERA',
      steps: [
        ['Title forensics', 'Chambers', 'We audit builder-buyer agreements, allotment letters, and payment receipts before issuing statutory notice.'],
        ['Complaint filing', 'HARERA Gurugram', 'A formal complaint or civil suit is registered with indexed evidence and escrow compliance records.'],
        ['Interim stay', 'Authority Bench', 'We press for an immediate stay or status quo to prevent third-party property transfers or coercive cancellation.'],
        ['Oral arguments', 'Regulatory Bench', 'Fact-based oral submissions and cross-examination on project delay milestones and sanctioned plans.'],
        ['Possession or refund', 'Final Order', 'An enforceable order for physical possession, delayed-period interest, or refund with execution warrants.']
      ]
    },
    {
      name: 'Commercial Arbitration',
      steps: [
        ['Section 21 notice', 'Chambers', 'We draft and serve the formal notice invoking the arbitration agreement and identifying core claims.'],
        ['Section 9 protection', 'Delhi High Court', 'Urgent petition for security of amount in dispute, bank guarantee stays, or asset preservation.'],
        ['Tribunal constitution', 'Appellate Bench / DIAC', 'Section 11 application for arbitrator appointment, or formal institution before arbitral centres.'],
        ['Statement of claim', 'Arbitral Tribunal', 'Pleadings, witness affidavits, and expert quantum reports submitted under strict procedural orders.'],
        ['Award & enforcement', 'Commercial Division', 'A reasoned arbitral award, defended or enforced under Section 34/36 of the Arbitration Act.']
      ]
    },
    {
      name: 'Insolvency & NCLT',
      steps: [
        ['Section 8 notice', 'Chambers', 'Statutory demand notice demanding repayment with proof of invoices and debt crystallization.'],
        ['Section 7/9 petition', 'NCLT New Delhi', 'Insolvency petition supported by bank certificates, debt ledgers, and proof of operational default.'],
        ['Admission hearing', 'Tribunal Bench', 'Focused arguments establishing undisputed default, seeking formal admission into resolution.'],
        ['Moratorium order', 'NCLT Bench', 'Imposition of Section 14 statutory moratorium, safeguarding debtor assets during resolution.'],
        ['Resolution or exit', 'Judicial Order', 'Approval of a compliant resolution plan, or formal Section 12A withdrawal upon structured settlement.']
      ]
    }
  ];

  let currentCategory = 0;
  let activeStepIndex = -1;

  function calculateTotalScroll() {
    return Math.max(1, scroller.offsetHeight - window.innerHeight);
  }

  function calculateProgress() {
    const rect = scroller.getBoundingClientRect();
    const topOffset = rect.top - 80; // Offset by header height
    const total = calculateTotalScroll();
    return Math.max(0, Math.min(1, (-topOffset / total) * 1.05));
  }

  function renderCategory(index) {
    currentCategory = index;
    activeStepIndex = -1;

    // Update picker buttons
    picker.querySelectorAll('.matter-pick-btn').forEach((btn, k) => {
      btn.setAttribute('aria-pressed', k === index ? 'true' : 'false');
    });

    // Remove existing nodes
    trackRow.querySelectorAll('.matter-node').forEach((n) => n.remove());

    // Build timeline nodes
    MATTERS[index].steps.forEach((step, k) => {
      const nodeBtn = document.createElement('button');
      nodeBtn.className = 'matter-node';
      nodeBtn.setAttribute('type', 'button');
      nodeBtn.setAttribute('aria-label', `Step ${k + 1}: ${step[0]} at ${step[1]}`);
      nodeBtn.innerHTML = `<span class="matter-dot" aria-hidden="true"></span><b>${step[0]}</b><small>${step[1]}</small>`;

      nodeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const rawProgress = (k / 4 + 0.01) / 1.05;
        const targetScrollTop = scroller.getBoundingClientRect().top + window.scrollY - 80 + rawProgress * calculateTotalScroll();
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
          top: targetScrollTop,
          behavior: prefersReduced ? 'auto' : 'smooth'
        });
      });

      trackRow.appendChild(nodeBtn);
    });

    updateScrollState();
  }

  function updateScrollState() {
    const p = calculateProgress();
    const k = Math.min(4, Math.floor(p * 4 + 0.05));

    if (fill) {
      fill.style.setProperty('--p', `${(p * 100).toFixed(1)}%`);
    }

    if (hintEl) {
      hintEl.style.opacity = p > 0.05 && p < 0.92 ? '0' : '1';
      hintEl.innerHTML = p >= 0.92 ? '<span>Procedural cycle complete</span>' : '<span>Scroll to advance matter</span> <span class="hint-arrow">&darr;</span>';
    }

    if (k === activeStepIndex) return;
    activeStepIndex = k;

    const currentStep = MATTERS[currentCategory].steps[k];
    const nodes = trackRow.querySelectorAll('.matter-node');

    nodes.forEach((n, j) => {
      n.classList.toggle('done', j <= k);
      n.classList.toggle('cur', j === k);
    });

    if (whereEl) whereEl.textContent = currentStep[1];
    if (titleEl) titleEl.textContent = currentStep[0];
    if (descEl) descEl.textContent = currentStep[2];
  }

  // Populate picker buttons
  MATTERS.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.className = 'matter-pick-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('role', 'tab');
    btn.textContent = item.name;
    btn.addEventListener('click', () => renderCategory(i));
    picker.appendChild(btn);
  });

  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });

  renderCategory(0);
}

/**
 * Interactive Court Pleading Brief: Read a pleading the way we write one
 * Inspired by malik-interactive.html, elevated with authentic courtroom typography & highlighter sweep
 */
function initInteractiveDoctrinePleading() {
  const container = document.getElementById('approach');
  const prsList = document.getElementById('pleading-principles-list');
  const paper = document.getElementById('pleading-paper');
  const noteEl = document.getElementById('pleading-note');

  if (!container || !prsList || !paper || !noteEl) return;

  const marks = paper.querySelectorAll('.pleading-mark');

  const PRINCIPLES = [
    {
      title: 'Evidentiary precision',
      desc: 'Every factual assertion cites document and page number. If it cannot be proven by indexed admissible evidence, it does not go into court pleadings.'
    },
    {
      title: 'Focused courtroom advocacy',
      desc: 'One statutory rule, one contract clause. The judicial bench never has to search for our legal proposition amid crowded daily causelists.'
    },
    {
      title: 'Commercial realism',
      desc: 'Litigation serves business strategy. We formulate practical settlement pathways before prolonged hearings begin, protecting client commercial viability.'
    }
  ];

  function selectPrinciple(index) {
    prsList.querySelectorAll('.pleading-pr-btn').forEach((btn, i) => {
      btn.classList.toggle('on', i === index);
      btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });

    marks.forEach((mark) => {
      const k = parseInt(mark.getAttribute('data-k'), 10);
      mark.classList.toggle('on', k === index);
    });

    paper.classList.add('has-on');

    const p = PRINCIPLES[index];
    noteEl.innerHTML = `<strong>${p.title}</strong><span>${p.desc}</span>`;
  }

  PRINCIPLES.forEach((item, k) => {
    const btn = document.createElement('button');
    btn.className = 'pleading-pr-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('role', 'tab');
    btn.textContent = item.title;

    btn.addEventListener('mouseenter', () => selectPrinciple(k));
    btn.addEventListener('focus', () => selectPrinciple(k));
    btn.addEventListener('click', () => selectPrinciple(k));

    prsList.appendChild(btn);
  });

  selectPrinciple(0);
}

function initConsultationAppointmentForm() {
  const form = document.getElementById('consultation-intake-form');
  const container = document.getElementById('consultation-mcq-container');
  if (!form || !container) return;

  const stepIndicatorNum = document.getElementById('mcq-step-num');
  const stepIndicatorTitle = document.getElementById('mcq-step-title');
  const progressBar = document.getElementById('mcq-progress-bar');
  const progressHeader = container.querySelector('.mcq-progress-header');
  const statusMsg = document.getElementById('intake-status-msg');
  const summaryBox = document.getElementById('mcq-confirmation-summary');
  const resetBtn = document.getElementById('mcq-reset-btn');

  const steps = container.querySelectorAll('.mcq-step');
  const stepTitles = {
    1: 'Matter domain',
    2: 'Matter stage',
    3: 'Consultation venue',
    4: 'Contact & brief',
    5: 'Confirmation'
  };

  let currentStep = 1;

  function showStep(stepNum) {
    currentStep = stepNum;
    steps.forEach((step) => {
      const stepIndex = parseInt(step.getAttribute('data-step'), 10);
      if (stepIndex === stepNum) {
        step.style.display = 'block';
        step.classList.add('is-active');
      } else {
        step.style.display = 'none';
        step.classList.remove('is-active');
      }
    });

    if (stepNum <= 4) {
      if (progressHeader) progressHeader.style.display = 'block';
      if (stepIndicatorNum) stepIndicatorNum.textContent = String(stepNum);
      if (stepIndicatorTitle) stepIndicatorTitle.textContent = stepTitles[stepNum] || '';
      if (progressBar) progressBar.style.width = `${stepNum * 25}%`;
    } else {
      if (progressHeader) progressHeader.style.display = 'none';
    }

    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  }

  // Handle Next buttons
  container.querySelectorAll('.btn-mcq-next').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const nextStep = parseInt(btn.getAttribute('data-next'), 10);
      if (nextStep) {
        showStep(nextStep);
      }
    });
  });

  // Handle Back buttons
  container.querySelectorAll('.btn-mcq-back').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const prevStep = parseInt(btn.getAttribute('data-prev'), 10);
      if (prevStep) {
        showStep(prevStep);
      }
    });
  });

  // Form submission on Step 4
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('client-name');
    const phoneInput = document.getElementById('client-phone');
    const emailInput = document.getElementById('client-email');

    if (!nameInput || !nameInput.value.trim()) {
      if (nameInput) nameInput.focus();
      if (statusMsg) {
        statusMsg.className = 'form-feedback-pill error';
        statusMsg.innerHTML = '<strong>Name required:</strong> Please enter your full name or entity name.';
      }
      return;
    }

    if (phoneInput) {
      const cleanPhone = phoneInput.value.replace(/[^0-9+]/g, '');
      if (cleanPhone.length < 10) {
        phoneInput.focus();
        if (statusMsg) {
          statusMsg.className = 'form-feedback-pill error';
          statusMsg.innerHTML = '<strong>Telephone required:</strong> Please enter a valid telephone or mobile number with country code.';
        }
        return;
      }
    }

    if (!emailInput || !emailInput.value.includes('@')) {
      if (emailInput) emailInput.focus();
      if (statusMsg) {
        statusMsg.className = 'form-feedback-pill error';
        statusMsg.innerHTML = '<strong>Email required:</strong> Please enter a valid email address for confidential correspondence.';
      }
      return;
    }

    const submitBtn = document.getElementById('mcq-submit-btn');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.innerHTML = '<span>Verifying conflict status &amp; submitting...</span>';
      submitBtn.disabled = true;
    }

    // Retrieve selected MCQ values
    const selectedDomain = (form.querySelector('input[name="practice_domain"]:checked') || {}).value || 'Commercial litigation & arbitration';
    const selectedStage = (form.querySelector('input[name="matter_stage"]:checked') || {}).value || 'Urgent interim relief needed';
    const selectedVenue = (form.querySelector('input[name="consultation_venue"]:checked') || {}).value || 'Delhi litigation chambers';
    const clientName = nameInput.value.trim();

    setTimeout(() => {
      const refCode = 'MA-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

      if (summaryBox) {
        summaryBox.innerHTML = `
          <div class="mcq-summary-item">
            <span class="mcq-summary-lbl">Reference</span>
            <span class="mcq-summary-val">#${refCode}</span>
          </div>
          <div class="mcq-summary-item">
            <span class="mcq-summary-lbl">Instructing party</span>
            <span class="mcq-summary-val">${clientName}</span>
          </div>
          <div class="mcq-summary-item">
            <span class="mcq-summary-lbl">Practice domain</span>
            <span class="mcq-summary-val">${selectedDomain}</span>
          </div>
          <div class="mcq-summary-item">
            <span class="mcq-summary-lbl">Matter stage</span>
            <span class="mcq-summary-val">${selectedStage}</span>
          </div>
          <div class="mcq-summary-item">
            <span class="mcq-summary-lbl">Chambers venue</span>
            <span class="mcq-summary-val">${selectedVenue}</span>
          </div>
        `;
      }

      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }

      showStep(5);
    }, 600);
  });

  // Handle Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      if (statusMsg) {
        statusMsg.className = 'form-feedback-pill';
        statusMsg.innerHTML = '';
      }
      showStep(1);
    });
  }

  showStep(1);
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
 * GSAP ScrollTrigger Text & Editorial Reveals
 * Implements line-by-line heading reveal from invisible clipping masks,
 * immediate introductory paragraph transitions, numbered item staggers,
 * sequenced practice discipline reveals, and advocate portrait-to-credentials reveal.
 * Naturally reverses when scrolling upward.
 */
function initEditorialScrollReveals() {
  // 1. Advocates Section (#advocates) - Immediately after Hero
  const advocatesSection = document.getElementById('advocates');
  if (advocatesSection) {
    const advLines = advocatesSection.querySelectorAll('.editorial-main-heading .reveal-line');
    const advIntro = advocatesSection.querySelector('.firm-paragraph-lead');
    const advCards = advocatesSection.querySelectorAll('.advocate-profile-card');

    const advTl = gsap.timeline({
      scrollTrigger: {
        trigger: advocatesSection,
        start: 'top 80%',
        end: 'bottom 10%',
        toggleActions: 'play reverse play reverse'
      }
    });

    if (advLines.length) {
      advTl.fromTo(
        advLines,
        { y: '115%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.85, ease: 'power3.out' }
      );
    }
    if (advIntro) {
      advTl.fromTo(
        advIntro,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.4'
      );
    }
    if (advCards.length) {
      // 4. Scroll animation: Cards stagger in as user scrolls (fade + 20px rise, 100ms apart)
      advTl.fromTo(
        advCards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.1, // Exactly 100ms apart
          ease: 'power2.out'
        },
        '-=0.25'
      );
    }

    // Subtle 3D background watermark parallax
    const advWatermark = advocatesSection.querySelector('.advocates-judicial-watermark');
    if (advWatermark) {
      gsap.to(advWatermark, {
        y: 50,
        rotation: -4,
        ease: 'none',
        scrollTrigger: {
          trigger: advocatesSection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }
  }

  // 2. Practice Areas Section (#practice-areas)
  const practiceHeading = document.querySelector('#practice-areas .editorial-main-heading');
  if (practiceHeading) {
    const practiceLines = practiceHeading.querySelectorAll('.reveal-line');
    gsap.fromTo(
      practiceLines,
      { y: '115%', opacity: 0 },
      {
        y: '0%',
        opacity: 1,
        duration: 0.85,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#practice-areas',
          start: 'top 80%',
          end: 'bottom 10%',
          toggleActions: 'play reverse play reverse'
        }
      }
    );
  }

  const practiceDesc = document.querySelector('#practice-areas .practice-intro-desc');
  if (practiceDesc) {
    gsap.fromTo(
      practiceDesc,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#practice-areas',
          start: 'top 80%',
          end: 'bottom 10%',
          toggleActions: 'play reverse play reverse'
        }
      }
    );
  }

  // Item 1 ("Commercial Litigation") title and description together
  const firstItem = document.querySelector('#practice-item-1');
  if (firstItem) {
    const itemContent = firstItem.querySelector('.catalogue-text-content');
    if (itemContent) {
      gsap.fromTo(
        itemContent,
        { y: '105%', opacity: 0 },
        {
          y: '0%',
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: firstItem,
            start: 'top 85%',
            end: 'bottom 10%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }
  }

  // Remaining four practice area items: Arbitration, Property & HARERA, Insolvency & NCLT, Constitutional Litigation
  const remainingPracticeItems = [
    '#practice-item-2',
    '#practice-item-3',
    '#practice-item-4',
    '#practice-item-5'
  ];

  remainingPracticeItems.forEach((sel, idx) => {
    const item = document.querySelector(sel);
    if (!item) return;
    const content = item.querySelector('.catalogue-text-content');
    if (!content) return;

    gsap.fromTo(
      content,
      { y: '105%', opacity: 0 },
      {
        y: '0%',
        opacity: 1,
        duration: 0.8,
        delay: idx * 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          end: 'bottom 10%',
          toggleActions: 'play reverse play reverse'
        }
      }
    );
  });

  // 3. Firm Statistics Section (#firm-statistics)
  const statsSection = document.getElementById('firm-statistics');
  if (statsSection) {
    const sCards = statsSection.querySelectorAll('.matter-fact-card');
    const sNote = statsSection.querySelector('.matter-compliance-note');

    if (sCards.length) {
      gsap.fromTo(
        sCards,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.matter-after-section',
            start: 'top 85%',
            end: 'bottom 15%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }
    if (sNote) {
      gsap.fromTo(
        sNote,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sNote,
            start: 'top 90%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }
  }

  // 4. Litigation Doctrine Section (#approach)
  const doctrineSection = document.getElementById('approach');
  if (doctrineSection) {
    const dEyebrow = doctrineSection.querySelector('.eyebrow-tag');
    const dTitle = doctrineSection.querySelector('.editorial-main-heading');
    const dGrid = doctrineSection.querySelector('.pleading-interactive-grid');

    const doctrineTl = gsap.timeline({
      scrollTrigger: {
        trigger: doctrineSection,
        start: 'top 80%',
        end: 'bottom 10%',
        toggleActions: 'play reverse play reverse'
      }
    });

    if (dTitle) {
      doctrineTl.fromTo(
        dTitle,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }
    if (dEyebrow) {
      doctrineTl.fromTo(
        dEyebrow,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' },
        '-=0.5'
      );
    }
    if (dGrid) {
      doctrineTl.fromTo(
        dGrid,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' },
        '-=0.25'
      );
    }
  }

  // 5. Contact Section (#consultation)
  const contactSection = document.getElementById('consultation');
  if (contactSection) {
    const cLines = contactSection.querySelectorAll('.editorial-main-heading .reveal-line');
    const cSupport = contactSection.querySelector('.consultation-supporting');
    const cLocationBoxes = contactSection.querySelectorAll('.location-box');
    const cForm = contactSection.querySelector('.appointment-form-card');

    const contactTl = gsap.timeline({
      scrollTrigger: {
        trigger: contactSection,
        start: 'top 80%',
        end: 'bottom 10%',
        toggleActions: 'play reverse play reverse'
      }
    });

    if (cLines.length) {
      contactTl.fromTo(
        cLines,
        { y: '115%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.85, ease: 'power3.out' }
      );
    }
    if (cSupport) {
      contactTl.fromTo(
        cSupport,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.4'
      );
    }
    if (cLocationBoxes.length) {
      contactTl.fromTo(
        cLocationBoxes,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.12, ease: 'power2.out' },
        '-=0.2'
      );
    }
    if (cForm) {
      contactTl.fromTo(
        cForm,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.25'
      );
    }
  }
}

/**
 * 6. Subtle 3D Card Tilt Toward Cursor
 * Tactile, restrained 3D card tilt with specular glare lighting on hover.
 */
function init3DCardTilt() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const cards = document.querySelectorAll('.advocate-profile-card');
  cards.forEach((card) => {
    let bounds = null;
    const glare = card.querySelector('.card-glare');

    gsap.set(card, { transformPerspective: 1200, transformStyle: 'preserve-3d' });

    function onPointerMove(e) {
      if (!bounds) bounds = card.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;

      const xNorm = Math.max(-1, Math.min(1, (x / bounds.width - 0.5) * 2));
      const yNorm = Math.max(-1, Math.min(1, (y / bounds.height - 0.5) * 2));

      // Subtle tilt: max 5 deg rotation
      const rotateX = -yNorm * 5;
      const rotateY = xNorm * 5;

      gsap.to(card, {
        rotationX: rotateX,
        rotationY: rotateY,
        y: -6,
        duration: 0.22,
        ease: 'power1.out',
        overwrite: 'auto'
      });

      if (glare) {
        const xPct = ((x / bounds.width) * 100).toFixed(1);
        const yPct = ((y / bounds.height) * 100).toFixed(1);
        glare.style.background = `radial-gradient(circle at ${xPct}% ${yPct}%, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0) 65%)`;
      }
    }

    card.addEventListener('pointerenter', () => {
      bounds = card.getBoundingClientRect();
    });

    card.addEventListener('pointermove', onPointerMove);

    card.addEventListener('pointerleave', () => {
      bounds = null;
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        y: 0,
        duration: 0.55,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });
  });
}
