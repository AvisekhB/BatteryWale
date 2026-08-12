document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================
     TAB NAVIGATION
     ===================================================== */
  const sections   = document.querySelectorAll('.tab-section');
  const navLinks   = document.querySelectorAll('[data-tab-link]');
  const hamburger  = document.getElementById('hamburger');
  const mobileNav  = document.getElementById('main-nav-mobile');
  const VALID_TABS = Array.from(sections).map(s => s.dataset.tab);

  function activateTab(tabName, updateHash = true) {
    if (!VALID_TABS.includes(tabName)) tabName = 'home';

    sections.forEach(section => {
      section.hidden = section.dataset.tab !== tabName;
    });

    navLinks.forEach(link => {
      if (link.tagName === 'A') return; // brand link, skip active styling
      link.classList.toggle('is-active', link.dataset.tabLink === tabName);
    });

    if (updateHash) {
      history.replaceState(null, '', '#' + tabName);
    }

    mobileNav.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      activateTab(link.dataset.tabLink);
    });
  });

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Initial tab from URL hash (supports direct links / GitHub Pages deep-linking)
  const initialTab = window.location.hash.replace('#', '') || 'home';
  activateTab(initialTab, false);


  /* =====================================================
     CONTACT FORM — Google Apps Script integration
     Submits Name / Email / Contact number / Message to a Google Sheet
     (with a timestamp) and emails you a notification. No backend server
     needed — Apps Script does both jobs for free.

     SETUP: deploy the included apps-script/Code.gs as a Web App, then
     paste the resulting /exec URL below. See README.md for full steps.
     ===================================================== */
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxHdfxv0jTugdE3eo2G_mT3Lr_21TdQ8jo0t2kZaJHvvxWgY9easSipuK2cSryeSbUh/exec';

  const contactForm = document.getElementById('contact-form');
  const formNote = document.getElementById('form-note');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('PASTE_YOUR') === 0) {
        showFormNote('error', 'Form isn\u2019t connected yet — see README.md to add your Apps Script URL. Meanwhile, please call or email us directly below.');
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      formNote.hidden = true;

      try {
        const formData = new FormData(contactForm);
        const response = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          body: formData
        });
        const result = await response.json();

        if (result && result.result === 'success') {
          showFormNote('success', 'Thanks! Your message has been sent — we\u2019ll get back to you soon.');
          contactForm.reset();
        } else {
          throw new Error((result && result.error) || 'Unknown error');
        }
      } catch (err) {
        console.error('Contact form submission failed:', err);
        showFormNote('error', 'Something went wrong sending your message. Please call or email us directly below.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    });
  }

  function showFormNote(type, message) {
    formNote.textContent = message;
    formNote.className = 'form-note form-note--' + type;
    formNote.hidden = false;
  }

  const footerYear = document.getElementById('footer-year');
  if (footerYear) footerYear.textContent = new Date().getFullYear();


  /* =====================================================
     LIVE TESTIMONIAL COMMENTS
     Stored in this browser's localStorage only — there is no backend
     on GitHub Pages, so comments are not shared between visitors.
     ===================================================== */
  const COMMENTS_KEY = 'batterywale_comments';
  const testimonialGrid = document.getElementById('testimonial-grid');
  const commentForm     = document.getElementById('comment-form');
  const commentNameInput = document.getElementById('comment-name');
  const commentRoleSelect = document.getElementById('comment-role');
  const commentTextInput = document.getElementById('comment-text');
  const clearCommentsBtn = document.getElementById('clear-comments-btn');

  function loadComments() {
    try {
      return JSON.parse(localStorage.getItem(COMMENTS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveComments(comments) {
    try {
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
    } catch (e) {
      // localStorage unavailable (private browsing etc.) — comment still shows for this session
    }
  }

  function buildTestimonialCard(comment) {
    const article = document.createElement('article');
    article.className = 'testimonial-card testimonial-card--new';
    article.dataset.commentId = comment.id;

    const initial = comment.name.trim().charAt(0).toUpperCase() || '?';

    article.innerHTML = `
      <p>“${escapeHtml(comment.text)}”</p>
      <div class="testimonial-author">
        <span class="avatar">${escapeHtml(initial)}</span>
        <div>
          <strong>${escapeHtml(comment.name)}</strong>
          <span>${escapeHtml(comment.role)}</span>
        </div>
      </div>
      <button type="button" class="testimonial-remove">Remove my comment</button>
    `;

    article.querySelector('.testimonial-remove').addEventListener('click', () => {
      removeComment(comment.id);
    });

    return article;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderStoredComments() {
    if (!testimonialGrid) return;
    const comments = loadComments();
    comments.forEach(comment => {
      testimonialGrid.prepend(buildTestimonialCard(comment));
    });
  }

  function removeComment(id) {
    const comments = loadComments().filter(c => c.id !== id);
    saveComments(comments);
    const card = testimonialGrid.querySelector(`[data-comment-id="${id}"]`);
    if (card) card.remove();
  }

  if (commentForm) {
    renderStoredComments();

    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = commentNameInput.value.trim();
      const text = commentTextInput.value.trim();
      const role = commentRoleSelect.value;
      if (!name || !text) return;

      const comment = { id: Date.now().toString(36), name, role, text };
      const comments = loadComments();
      comments.unshift(comment);
      saveComments(comments);

      testimonialGrid.prepend(buildTestimonialCard(comment));
      commentForm.reset();
      commentNameInput.focus();
    });
  }

  if (clearCommentsBtn) {
    clearCommentsBtn.addEventListener('click', () => {
      const comments = loadComments();
      comments.forEach(c => {
        const card = testimonialGrid.querySelector(`[data-comment-id="${c.id}"]`);
        if (card) card.remove();
      });
      saveComments([]);
    });
  }


  /* =====================================================
     INVERTER & BATTERY CALCULATOR
     ===================================================== */

  // --- Appliance Data ---
  const appliancesData = [
    { name: 'Ceiling Fan', wattage: 80 },
    { name: 'Exhaust Fan Kitchen', wattage: 40 },
    { name: 'Fridge (Upto 500L)', wattage: 335 },
    { name: 'Laptop', wattage: 45 },
    { name: 'LED Bulb 8W', wattage: 8 },
    { name: 'LED Bulb 12W', wattage: 12 },
    { name: 'LED Tubelight', wattage: 18 },
    { name: 'LED TV 42 Inch', wattage: 60 },
    { name: 'LED TV 55 Inch', wattage: 80 },
    { name: 'Phone Charger', wattage: 40 },
    { name: 'Set Top Box', wattage: 50 },
    { name: 'WiFi Router', wattage: 20 },
    { name: 'Water Purifier Home', wattage: 80 },
    { name: 'Air Conditioner (1.5 Ton)', wattage: 1700 },
    { name: 'Air Purifier', wattage: 215 },
    { name: 'Blender', wattage: 420 },
    { name: 'Old Model Filament Bulb', wattage: 65 },
    { name: 'CCTV Camera Single', wattage: 30 },
    { name: 'CFL', wattage: 15 },
    { name: 'Coffee Maker', wattage: 1300 },
    { name: 'Computer', wattage: 200 },
    { name: 'Dishwasher', wattage: 1800 },
    { name: 'Electric Iron', wattage: 1200 },
    { name: 'Fridge (Upto 200L)', wattage: 180 },
    { name: 'Game Console', wattage: 75 },
    { name: 'Geyser', wattage: 2000 },
    { name: 'Hair Appliances', wattage: 1600 },
    { name: 'Induction Cooktop', wattage: 2500 },
    { name: 'Kettle', wattage: 1200 },
    { name: 'Microwave Oven Kitchen', wattage: 1000 },
    { name: 'Mixer/Grinder Kitchen', wattage: 500 },
    { name: 'Panel Lights', wattage: 14 },
    { name: 'Printer Laser', wattage: 500 },
    { name: 'Room Cooler (BLDC)', wattage: 120 },
    { name: 'Room Heater', wattage: 2200 },
    { name: 'Speaker', wattage: 80 },
    { name: 'Toaster', wattage: 800 },
    { name: 'Vacuum Cleaner', wattage: 1400 },
    { name: 'Washing Machine', wattage: 500 }
  ];

  // --- DOM Elements ---
  const appliancesContainer      = document.getElementById('appliances-container');
  const totalRunningWattsDisplay = document.getElementById('total-running-watts');
  const backupHoursInput         = document.getElementById('backup-hours');
  const systemVoltageSelect      = document.getElementById('system-voltage');
  const calculateBtn             = document.getElementById('calculate-btn');
  const resetBtn                 = document.getElementById('reset-btn');
  const recommendedInverterSpan  = document.getElementById('recommended-inverter');
  const requiredAhSpan           = document.getElementById('required-ah');
  const batterySuggestionsDiv    = document.getElementById('battery-suggestions');
  const gaugeFill                = document.getElementById('gauge-fill');
  const gaugeWatts                = document.getElementById('gauge-watts');

  if (!appliancesContainer) return; // calculator markup not on this page

  // --- State ---
  let applianceQuantities = {};
  appliancesData.forEach(app => { applianceQuantities[app.name] = 0; });

  // --- Constants ---
  const POWER_FACTOR = 0.8;
  const BATTERY_EFFICIENCY = 0.85;
  const DEPTH_OF_DISCHARGE = 0.5;
  const SAFETY_MARGIN_INVERTER = 1.25;
  const COMMON_12V_BATTERY_AHS = [100, 120, 130, 150, 160, 180, 200, 220];
  const GAUGE_MAX_WATTS = 6000; // full-scale reference for the visual gauge
  const GAUGE_CIRCUMFERENCE = 251; // matches the SVG arc's path length

  function renderAppliances() {
    appliancesContainer.innerHTML = '';
    appliancesData.forEach(app => {
      const row = document.createElement('div');
      row.classList.add('appliance-row');
      row.dataset.applianceName = app.name;
      row.setAttribute('role', 'listitem');

      const currentQty = applianceQuantities[app.name];
      const currentTotalWattsAppliance = currentQty * app.wattage;

      row.innerHTML = `
        <span class="appliance-name">${app.name}</span>
        <span class="appliance-watt">${app.wattage}W</span>
        <span class="qty-controls">
          <button type="button" class="qty-minus" aria-label="Decrease ${app.name}" data-appliance="${app.name}">−</button>
          <span class="qty-display">${currentQty}</span>
          <button type="button" class="qty-plus" aria-label="Increase ${app.name}" data-appliance="${app.name}">+</button>
        </span>
        <span class="appliance-total"><span class="appliance-total-watts">${currentTotalWattsAppliance}</span>W</span>
      `;
      appliancesContainer.appendChild(row);
    });
    updateTotalRunningWatts();
    addEventListenersToQtyButtons();
  }

  function addEventListenersToQtyButtons() {
    document.querySelectorAll('.qty-minus').forEach(button => {
      button.onclick = (e) => adjustQuantity(e.currentTarget.dataset.appliance, -1);
    });
    document.querySelectorAll('.qty-plus').forEach(button => {
      button.onclick = (e) => adjustQuantity(e.currentTarget.dataset.appliance, 1);
    });
  }

  function adjustQuantity(applianceName, change) {
    let currentQty = applianceQuantities[applianceName];
    currentQty = Math.max(0, currentQty + change);
    applianceQuantities[applianceName] = currentQty;

    const row = document.querySelector(`.appliance-row[data-appliance-name="${applianceName}"]`);
    if (row) {
      const qtyDisplay = row.querySelector('.qty-display');
      const applianceTotalWattsSpan = row.querySelector('.appliance-total-watts');
      const applianceData = appliancesData.find(app => app.name === applianceName);

      qtyDisplay.textContent = currentQty;
      applianceTotalWattsSpan.textContent = currentQty * applianceData.wattage;
    }
    updateTotalRunningWatts();
  }

  function updateTotalRunningWatts() {
    let totalWatts = 0;
    appliancesData.forEach(app => {
      totalWatts += applianceQuantities[app.name] * app.wattage;
    });
    totalRunningWattsDisplay.textContent = totalWatts;
    updateGauge(totalWatts);
  }

  function updateGauge(totalWatts) {
    if (!gaugeFill) return;
    const ratio = Math.min(totalWatts / GAUGE_MAX_WATTS, 1);
    const offset = GAUGE_CIRCUMFERENCE * (1 - ratio);
    gaugeFill.style.strokeDashoffset = offset;
    if (gaugeWatts) gaugeWatts.textContent = totalWatts;
  }

  function calculateRequirements() {
    const totalWatts = parseInt(totalRunningWattsDisplay.textContent, 10);
    const backupHours = parseInt(backupHoursInput.value, 10);
    const systemVoltage = parseInt(systemVoltageSelect.value, 10);

    if (isNaN(totalWatts) || totalWatts <= 0) {
      alert('Please select at least one appliance with quantity to calculate.');
      return;
    }
    if (isNaN(backupHours) || backupHours <= 0) {
      alert('Please enter a valid number of backup hours (must be positive).');
      return;
    }
    if (isNaN(systemVoltage) || systemVoltage <= 0) {
      alert('Please select a valid system voltage (must be positive).');
      return;
    }

    const totalVA = totalWatts / POWER_FACTOR;
    const recommendedInverterVA = totalVA * SAFETY_MARGIN_INVERTER;

    const energyWhRequired = totalWatts * backupHours;
    const divisorAhCalc = systemVoltage * BATTERY_EFFICIENCY * DEPTH_OF_DISCHARGE;
    const requiredAh = energyWhRequired / divisorAhCalc;

    recommendedInverterSpan.textContent = Math.round(recommendedInverterVA);
    requiredAhSpan.textContent = Math.round(requiredAh);

    batterySuggestionsDiv.innerHTML = '';
    const batterySuggestions = [];
    const num12VSeriesBatteries = systemVoltage / 12;

    if (num12VSeriesBatteries !== Math.floor(num12VSeriesBatteries)) {
      batterySuggestionsDiv.innerHTML = '<p>Cannot provide specific 12V battery suggestions for this system voltage. Please choose 12V, 24V, or 48V.</p>';
    } else {
      const numSeriesBatteries = parseInt(num12VSeriesBatteries, 10);
      COMMON_12V_BATTERY_AHS.sort((a, b) => a - b);

      for (const batteryAhOption of COMMON_12V_BATTERY_AHS) {
        const totalAhProvided = batteryAhOption * numSeriesBatteries;
        if (totalAhProvided >= requiredAh) {
          batterySuggestions.push({
            voltage: 12,
            ah: batteryAhOption,
            numbers: numSeriesBatteries,
            total_ah: totalAhProvided
          });
        }
      }

      if (batterySuggestions.length > 0) {
        batterySuggestions.forEach(suggestion => {
          const p = document.createElement('p');
          p.textContent = `${suggestion.voltage}V ${suggestion.ah}Ah battery x ${suggestion.numbers} = Total ${suggestion.total_ah}Ah`;
          batterySuggestionsDiv.appendChild(p);
        });
      } else {
        batterySuggestionsDiv.innerHTML = '<p>No specific battery suggestions available for this configuration that meet the required capacity.</p>';
      }
    }
  }

  function resetAll() {
    appliancesData.forEach(app => { applianceQuantities[app.name] = 0; });
    backupHoursInput.value = 1;
    systemVoltageSelect.value = 24;
    renderAppliances();
    recommendedInverterSpan.textContent = '0';
    requiredAhSpan.textContent = '0';
    batterySuggestionsDiv.innerHTML = '';
    totalRunningWattsDisplay.textContent = '0';
    updateGauge(0);
  }

  renderAppliances();
  calculateBtn.addEventListener('click', calculateRequirements);
  resetBtn.addEventListener('click', resetAll);
});
