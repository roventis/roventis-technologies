/**
 * ROVENTIS TECHNOLOGIES — Core Application Script
 * Orchestrating the Live Meeting Transcripts, 3D Perspective Transforms,
 * Spotlight Glow Physics, and Interactive System Demos.
 */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initRecordingClock();
  init3DAppWindow(prefersReducedMotion);
  initSpotlightAndTilt(prefersReducedMotion);
  initWorkingAppScreens();
  initProcessPinnedScreen();
  initCountingStats(prefersReducedMotion);
  initRedactionSandbox();
  initPricingAndScopeCalculator();
  initFaqAccordion();
  initProjectInquiryForm();
  initSmoothScroll();
});

/**
 * 1. Live Recording Clock in Navigation
 * Counts up as you scroll and ticks in real time
 */
function initRecordingClock() {
  const display = document.getElementById('recCounterDisplay');
  if (!display) return;

  let baseSeconds = 84; // Starts at 00:01:24
  let scrollSeconds = 0;

  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Regular real-time clock tick
  setInterval(() => {
    baseSeconds++;
    display.textContent = formatTime(baseSeconds + scrollSeconds);
  }, 1000);

  // Sync with scroll depth: scrolling further advances the meeting recording clock
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollFraction = docHeight > 0 ? scrollTop / docHeight : 0;
    
    // Add up to 34 minutes of meeting recording as you scroll to the end
    scrollSeconds = Math.floor(scrollFraction * 2040);
    display.textContent = formatTime(baseSeconds + scrollSeconds);
  }, { passive: true });
}

/**
 * 2. 3D App Window: Lies back in perspective and sits upright as you scroll
 */
function init3DAppWindow(prefersReducedMotion) {
  if (prefersReducedMotion) return;

  const appWindow = document.getElementById('heroAppWindow');
  if (!appWindow) return;

  const updateWindowTransform = () => {
    const rect = appWindow.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // When the top of window reaches near center of viewport, it sits up (rotateX: 0deg)
    const progress = Math.min(Math.max((windowHeight - rect.top) / (windowHeight * 0.9), 0), 1);
    const rotX = 22 * (1 - progress);
    const scale = 0.94 + 0.06 * progress;

    appWindow.style.transform = `rotateX(${rotX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    
    if (progress >= 0.85) {
      appWindow.classList.add('seated');
    } else {
      appWindow.classList.remove('seated');
    }
  };

  window.addEventListener('scroll', updateWindowTransform, { passive: true });
  updateWindowTransform();
}

/**
 * 3. Spotlight Light & 3D Tilt on Live App Grid
 * Soft light follows the mouse, catching tile edges; tiles lean gently toward it;
 * with no mouse, the light drifts smoothly across as you scroll
 */
function initSpotlightAndTilt(prefersReducedMotion) {
  const grid = document.getElementById('spotlightGrid');
  const glow = document.getElementById('spotlightGlow');
  const tiles = document.querySelectorAll('.app-tile[data-tilt]');

  if (!grid || !glow || prefersReducedMotion) return;

  let isMouseOverGrid = false;
  let mouseX = 0;
  let mouseY = 0;

  // Track mouse movement
  grid.addEventListener('mouseenter', () => {
    isMouseOverGrid = true;
    glow.style.opacity = '1';
  });

  grid.addEventListener('mouseleave', () => {
    isMouseOverGrid = false;
    // Reset tile tilts
    tiles.forEach(tile => {
      tile.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    });
  });

  grid.addEventListener('mousemove', (e) => {
    const rect = grid.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    glow.style.left = `${mouseX}px`;
    glow.style.top = `${mouseY}px`;

    // 3D Tilt each tile toward the cursor
    tiles.forEach(tile => {
      const tileRect = tile.getBoundingClientRect();
      const tileCenterX = tileRect.left + tileRect.width / 2;
      const tileCenterY = tileRect.top + tileRect.height / 2;

      const deltaX = (e.clientX - tileCenterX) / (tileRect.width / 2);
      const deltaY = (e.clientY - tileCenterY) / (tileRect.height / 2);

      // Gentle tilt limit: max 4 degrees
      const rotY = Math.min(Math.max(deltaX * 3.5, -4), 4);
      const rotX = Math.min(Math.max(-deltaY * 3.5, -4), 4);

      tile.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(4px)`;
    });
  });

  // When no mouse is over the grid, drift the spotlight smoothly with scroll
  window.addEventListener('scroll', () => {
    if (!isMouseOverGrid) {
      const rect = grid.getBoundingClientRect();
      const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const clamped = Math.min(Math.max(scrollPercent, 0), 1);
      
      const driftX = rect.width * (0.2 + 0.6 * clamped);
      const driftY = rect.height * (0.15 + 0.7 * clamped);

      glow.style.left = `${driftX}px`;
      glow.style.top = `${driftY}px`;
      glow.style.opacity = clamped > 0.05 && clamped < 0.95 ? '0.7' : '0';
    }
  }, { passive: true });
}

/**
 * 4. Working App Screens (Signature Move)
 * - Scrolling transcript simulation
 * - Checklist progression
 * - Interactive timestamp seeks
 */
function initWorkingAppScreens() {
  // Tile 1: Append transcript lines periodically
  const streamList = document.getElementById('transcriptStreamList');
  if (streamList) {
    const pool = [
      { spk: 'ENG_LEAD [09:05:22]:', txt: 'Configuring Razorpay automated refund webhook handlers...' },
      { spk: 'AI_AGENT [09:05:26]:', txt: 'Schema migration verified on staging database. Zero lock contention detected.' },
      { spk: 'CLIENT [09:05:31]:', txt: 'Excellent. Can the admin dashboard export real-time CSV analytics?' },
      { spk: 'ROVENTIS_BOT [09:05:35]:', txt: 'Yes. Streaming parquet generation pipeline deployed on AWS Lambda.' }
    ];
    let poolIdx = 0;

    setInterval(() => {
      if (poolIdx < pool.length) {
        const item = pool[poolIdx];
        const div = document.createElement('div');
        div.className = 'trans-item';
        div.innerHTML = `<span class="spk">${item.spk}</span><span class="txt">${item.txt}</span>`;
        streamList.appendChild(div);
        
        // Keep list bounded to 5 items max for clean viewport
        if (streamList.children.length > 5) {
          streamList.removeChild(streamList.firstElementChild);
        }
        poolIdx++;
      }
    }, 4500);
  }

  // Tile 2: Checklist Cycle Button
  const btnTrigger = document.getElementById('btnTriggerTaskCycle');
  const task3 = document.getElementById('taskItem3');
  const task4 = document.getElementById('taskItem4');
  const box3 = document.getElementById('taskBox3');
  const box4 = document.getElementById('taskBox4');
  const status3 = document.getElementById('taskStatus3');
  const status4 = document.getElementById('taskStatus4');
  const countDisplay = document.getElementById('actionItemsCount');

  if (btnTrigger && task3 && task4) {
    btnTrigger.addEventListener('click', () => {
      // Step A: Complete Task 3
      status3.textContent = 'BUILDING';
      status3.className = 'task-status status-prog';
      box3.textContent = '⏳';
      task3.classList.remove('completed');
      
      status4.textContent = 'PENDING';
      status4.className = 'task-status';
      box4.textContent = '○';
      task4.classList.remove('completed');
      if (countDisplay) countDisplay.textContent = '2 of 4';

      setTimeout(() => {
        status3.textContent = 'DONE';
        status3.className = 'task-status';
        box3.textContent = '✔';
        task3.classList.add('completed');
        if (countDisplay) countDisplay.textContent = '3 of 4';

        // Step B: Start & Complete Task 4
        status4.textContent = 'SCANNING';
        status4.className = 'task-status status-prog';
        box4.textContent = '⏳';

        setTimeout(() => {
          status4.textContent = 'PASSED';
          status4.className = 'task-status';
          box4.textContent = '✔';
          task4.classList.add('completed');
          if (countDisplay) countDisplay.textContent = '4 of 4';
        }, 1200);
      }, 1000);
    });
  }

  // Tile 3: Clickable Timestamp Links
  const timeLinks = document.querySelectorAll('.timestamp-link');
  const seekAlert = document.getElementById('respSeekAlert');

  timeLinks.forEach(link => {
    link.addEventListener('click', () => {
      const timestamp = link.dataset.seek;
      if (seekAlert) {
        seekAlert.hidden = false;
        seekAlert.innerHTML = `✦ Navigated playback to meeting timecode: <strong>${timestamp}</strong>`;
        setTimeout(() => {
          seekAlert.hidden = true;
        }, 3200);
      }
    });
  });
}

/**
 * 5. Pinned Cockpit Screen: Changes view per Step in How It Works
 */
function initProcessPinnedScreen() {
  const steps = document.querySelectorAll('.process-step-item');
  const screenTitle = document.getElementById('cockpitScreenTitle');
  const footerText = document.getElementById('cockpitFooterText');
  const views = {
    1: document.getElementById('cockpitView1'),
    2: document.getElementById('cockpitView2'),
    3: document.getElementById('cockpitView3')
  };

  const titles = {
    1: 'STAGE 01 // ARCHITECTURAL SCHEMATIC & WIREFRAME',
    2: 'STAGE 02 // FULL-STACK REPOSITORY & AUTOMATION',
    3: 'STAGE 03 // CLOUD DEPLOYMENT & ZERO-TRUST COCKPIT'
  };

  const footers = {
    1: 'Displaying Step 01 Architecture Mapping',
    2: 'Displaying Step 02 Codebase & Automated Tests',
    3: 'Displaying Step 03 Production Edge Telemetry'
  };

  const activateStep = (stepNum) => {
    steps.forEach(s => s.classList.toggle('active-step', s.dataset.step === String(stepNum)));

    Object.keys(views).forEach(key => {
      if (views[key]) {
        views[key].classList.toggle('active', key === String(stepNum));
      }
    });

    if (screenTitle && titles[stepNum]) screenTitle.textContent = titles[stepNum];
    if (footerText && footers[stepNum]) footerText.textContent = footers[stepNum];
  };

  // Click on step
  steps.forEach(step => {
    step.addEventListener('click', () => {
      activateStep(step.dataset.step);
    });
  });

  // Scroll spy for steps
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stepNum = entry.target.dataset.step;
          activateStep(stepNum);
        }
      });
    }, {
      rootMargin: '-30% 0px -40% 0px',
      threshold: 0.1
    });

    steps.forEach(step => observer.observe(step));
  }
}

/**
 * 6. Four Counting Stats Animation
 */
function initCountingStats(prefersReducedMotion) {
  const statsSection = document.getElementById('statsCounterGrid');
  const counters = document.querySelectorAll('.counter-val');
  if (!statsSection || !counters.length) return;

  let hasAnimated = false;

  const runCounterAnimation = () => {
    counters.forEach(counter => {
      const target = parseFloat(counter.dataset.target);
      const decimals = parseInt(counter.dataset.decimals || '0', 10);

      if (prefersReducedMotion) {
        counter.textContent = target.toFixed(decimals);
        return;
      }

      const duration = 1800; // ms
      const startTime = performance.now();

      const updateVal = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing: easeOutExpo
        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = target * easeOut;

        counter.textContent = currentVal.toFixed(decimals);

        if (progress < 1) {
          requestAnimationFrame(updateVal);
        } else {
          counter.textContent = target.toFixed(decimals);
        }
      };

      requestAnimationFrame(updateVal);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        runCounterAnimation();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  observer.observe(statsSection);
}

/**
 * 7. Live Redaction Sandbox
 * Toggles revealing/hiding sensitive strings (API Keys, Bank Tokens, DB URIs)
 */
function initRedactionSandbox() {
  const btn = document.getElementById('btnToggleRedact');
  const btnText = document.getElementById('redactBtnText');
  const statusMsg = document.getElementById('redactionStatusMsg');
  const redactedElements = document.querySelectorAll('.redacted-str');

  if (!btn || !redactedElements.length) return;

  let isRevealed = false;

  btn.addEventListener('click', () => {
    isRevealed = !isRevealed;

    redactedElements.forEach(el => {
      if (isRevealed) {
        el.textContent = el.dataset.real;
        el.classList.add('revealed');
      } else {
        el.textContent = el.getAttribute('data-placeholder') || el.textContent;
        // Reset to masked placeholder based on element
        if (el.dataset.real.includes('sk_live')) el.textContent = '[REDACTED_API_KEY]';
        else if (el.dataset.real.includes('GSTIN')) el.textContent = '[REDACTED_TAX_IDENTIFIER]';
        else if (el.dataset.real.includes('IBAN')) el.textContent = '[REDACTED_BANK_ACCOUNT]';
        else if (el.dataset.real.includes('postgresql')) el.textContent = '[REDACTED_CONNECTION_URI]';
        el.classList.remove('revealed');
      }
    });

    if (btnText) {
      btnText.textContent = isRevealed ? 'Hide & Redact Strings' : 'Reveal Sensitive Strings';
    }

    if (statusMsg) {
      statusMsg.textContent = isRevealed 
        ? 'PERIMETER NOTICE: 4 items unmasked for authorized audit' 
        : 'AUTOMATIC REDACTION ACTIVE: 4 sensitive items masked';
      statusMsg.style.color = isRevealed ? '#FFBD2E' : 'var(--color-mint)';
    }
  });
}

/**
 * 8. Pricing Mode Switch & Interactive Scope Estimator
 */
function initPricingAndScopeCalculator() {
  const btnProject = document.getElementById('btnScopeProject');
  const btnRetainer = document.getElementById('btnScopeRetainer');
  const sub1 = document.getElementById('priceSubtext1');
  const sub2 = document.getElementById('priceSubtext2');
  const sub3 = document.getElementById('priceSubtext3');

  if (btnProject && btnRetainer) {
    btnProject.addEventListener('click', () => {
      btnProject.classList.add('active');
      btnRetainer.classList.remove('active');
      if (sub1) sub1.textContent = 'Milestone-based delivery · Typically 3 to 6 weeks';
      if (sub2) sub2.textContent = 'Staged sprint milestones · Typically 6 to 12 weeks';
      if (sub3) sub3.textContent = 'Dedicated sprint pods or long-term engagement';
    });

    btnRetainer.addEventListener('click', () => {
      btnRetainer.classList.add('active');
      btnProject.classList.remove('active');
      if (sub1) sub1.textContent = 'Monthly dedicated engineer allocation (Part-time pod)';
      if (sub2) sub2.textContent = 'Monthly full-stack pod (Senior Engineer + QA + PM)';
      if (sub3) sub3.textContent = 'Enterprise dedicated engineering organization & SLA';
    });
  }

  // Interactive Scope Estimator Pills
  const pills = document.querySelectorAll('.calc-pill');
  const sprintEstimate = document.getElementById('calcSprintEstimate');

  const recalculateScope = () => {
    const checked = Array.from(document.querySelectorAll('.calc-pill input[type="checkbox"]:checked'));
    const count = checked.length;

    pills.forEach(pill => {
      const input = pill.querySelector('input');
      const checkSpan = pill.querySelector('.pill-check');
      if (input.checked) {
        pill.classList.add('active');
        if (checkSpan) checkSpan.textContent = '✔';
      } else {
        pill.classList.remove('active');
        if (checkSpan) checkSpan.textContent = '○';
      }
    });

    if (sprintEstimate) {
      if (count <= 2) {
        sprintEstimate.textContent = '2 to 3 Weeks (Rapid MVP / Focused Module)';
      } else if (count <= 4) {
        sprintEstimate.textContent = '4 to 6 Weeks (Full Application + Pay & Database)';
      } else {
        sprintEstimate.textContent = '7 to 10 Weeks (Complete Multi-Platform & AI System)';
      }
    }
  };

  pills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      // Toggle checkbox
      const input = pill.querySelector('input');
      if (e.target !== input) {
        input.checked = !input.checked;
      }
      recalculateScope();
    });
  });

  const forwardBtn = document.getElementById('btnForwardScope');
  if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
      const selected = Array.from(document.querySelectorAll('.calc-pill input[type="checkbox"]:checked'))
        .map(i => i.dataset.name)
        .join(', ');
      const descArea = document.getElementById('projectDetails');
      if (descArea) {
        descArea.value = `Selected Scope from Estimator:\n- ${selected}\n\nAdditional Requirements: `;
        descArea.focus();
      }
    });
  }
}

/**
 * 9. FAQ Accordion
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    const icon = item.querySelector('.faq-icon');

    btn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all others
      faqItems.forEach(other => {
        other.classList.remove('active');
        other.querySelector('.faq-question-btn').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-icon').textContent = '+';
      });

      if (!isActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        icon.textContent = '−';
      }
    });
  });
}

/**
 * 10. Project Inquiry Form Submission
 */
function initProjectInquiryForm() {
  const form = document.getElementById('projectInquiryForm');
  const successCard = document.getElementById('formSuccessCard');
  const btnDismiss = document.getElementById('btnDismissSuccess');

  if (!form || !successCard) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const company = document.getElementById('contactCompany').value.trim() || 'Undisclosed';
    const typeSelect = document.getElementById('projectType');
    const typeName = typeSelect.options[typeSelect.selectedIndex].text;
    const details = document.getElementById('projectDetails').value.trim();

    if (!name || !email || !details) {
      alert('Please fill in your name, business email, and project details.');
      return;
    }

    // Populate success card
    document.getElementById('successName').textContent = name;
    document.getElementById('successEmail').textContent = email;

    const summaryBox = document.getElementById('successMetaSummary');
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div><strong>Organization:</strong> ${company}</div>
        <div><strong>Scope Domain:</strong> ${typeName}</div>
        <div style="margin-top: 0.35rem; color: var(--color-mint);">
          ✦ Inbound logged to roventistechnologies@gmail.com
        </div>
      `;
    }

    form.hidden = true;
    successCard.hidden = false;
  });

  if (btnDismiss) {
    btnDismiss.addEventListener('click', () => {
      form.reset();
      form.hidden = false;
      successCard.hidden = true;
    });
  }
}

/**
 * 11. Smooth scrolling for internal anchors
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
