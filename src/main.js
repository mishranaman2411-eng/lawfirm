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

  // DOM Elements for HUD / Hero Opening / Knockout Stage
  const loaderEl = document.getElementById('hero-loader-status');
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

    // Sync live frame rendering inside the knockout typography
    if (koLiveImg) {
      koLiveImg.setAttribute('href', getFrameUrl(frameIndex));
      koLiveImg.setAttribute('x', `${drawX}`);
      koLiveImg.setAttribute('y', `${drawY}`);
      koLiveImg.setAttribute('width', `${drawW}`);
      koLiveImg.setAttribute('height', `${drawH}`);
    }

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
      advCards.forEach((card, idx) => {
        const content = card.querySelector('.advocate-card-content') || card;
        advTl.fromTo(
          content,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' },
          idx === 0 ? '-=0.15' : '-=0.45'
        );
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
    const sLines = statsSection.querySelectorAll('.reveal-line');
    const sDesc = statsSection.querySelector('.stats-intro-desc');
    const sCards = statsSection.querySelectorAll('.stat-card');

    const statsTl = gsap.timeline({
      scrollTrigger: {
        trigger: statsSection,
        start: 'top 80%',
        end: 'bottom 10%',
        toggleActions: 'play reverse play reverse'
      }
    });

    if (sLines.length) {
      statsTl.fromTo(
        sLines,
        { y: '115%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.85, stagger: 0.12, ease: 'power3.out' }
      );
    }
    if (sDesc) {
      statsTl.fromTo(
        sDesc,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.4'
      );
    }
    if (sCards.length) {
      statsTl.fromTo(
        sCards,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        '-=0.2'
      );
    }
  }

  // 4. The Firm Section (#the-firm)
  const firmSection = document.getElementById('the-firm');
  if (firmSection) {
    const firmLines = firmSection.querySelectorAll('.editorial-split-header .reveal-line');
    const firmParas = firmSection.querySelectorAll('.firm-narrative-col .reveal-paragraph');
    const firmExpand = firmSection.querySelector('.firm-expandable-box');
    const firmSlate = firmSection.querySelector('.parameters-slate');

    const firmTl = gsap.timeline({
      scrollTrigger: {
        trigger: firmSection,
        start: 'top 80%',
        end: 'bottom 10%',
        toggleActions: 'play reverse play reverse'
      }
    });

    firmTl.fromTo(firmLines,
      { y: '115%', opacity: 0 },
      { y: '0%', opacity: 1, duration: 0.85, stagger: 0.1, ease: 'power3.out' }
    );
    if (firmParas.length) {
      firmTl.fromTo(firmParas,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' },
        '-=0.3'
      );
    }
    if (firmSlate) {
      firmTl.fromTo(firmSlate,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.52, ease: 'power2.out' },
        '<+=0.1'
      );
    }
    if (firmExpand) {
      firmTl.fromTo(firmExpand,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
        '<+=0.15'
      );
    }
  }

  // Colonnade subtle scroll parallax
  const perspectiveImg = document.getElementById('perspective-parallax-img');
  if (perspectiveImg) {
    gsap.fromTo(perspectiveImg,
      { scale: 1.0, y: -25 },
      {
        scale: 1.06,
        y: 25,
        ease: 'none',
        scrollTrigger: {
          trigger: '#chambers-perspective',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  }

  // Profile Band Items (#firm-profile)
  const profileBand = document.getElementById('firm-profile');
  if (profileBand) {
    gsap.fromTo('.profile-band-item',
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: profileBand,
          start: 'top 85%',
          end: 'bottom 10%',
          toggleActions: 'play reverse play reverse'
        }
      }
    );
  }

  // 5. Litigation Doctrine Section (#approach)
  const doctrineSection = document.getElementById('approach');
  if (doctrineSection) {
    const dEyebrow = doctrineSection.querySelector('.eyebrow-tag');
    const dLines = doctrineSection.querySelectorAll('.editorial-main-heading .reveal-line');
    const dCols = doctrineSection.querySelectorAll('.doctrine-col');

    const doctrineTl = gsap.timeline({
      scrollTrigger: {
        trigger: doctrineSection,
        start: 'top 80%',
        end: 'bottom 10%',
        toggleActions: 'play reverse play reverse'
      }
    });

    if (dLines.length) {
      doctrineTl.fromTo(
        dLines,
        { y: '115%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.85, stagger: 0.12, ease: 'power3.out' }
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
    if (dCols.length) {
      dCols.forEach((col, idx) => {
        const num = col.querySelector('.doctrine-num');
        const text = col.querySelector('.doctrine-text-content') || col;
        doctrineTl.fromTo(
          [num, text].filter(Boolean),
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          idx === 0 ? '-=0.2' : '-=0.42'
        );
      });
    }
  }

  // 6. Contact Section (#consultation)
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
