/**
 * XYZ Lead Intelligence — Production Workspace & AI Engine Controller
 * Manages Real-time Local Market Scanner, Deep Diagnostic Dossier,
 * Pitch Format Kit, CSV Export, and Pipeline Persistence.
 */

// Direct backend URL for Render cloud fallback
const RENDER_BACKEND_URL = 'https://leadfinder-backend-k1a9.onrender.com';

/**
 * Universal resilient API fetcher (supports local / Vercel proxy rewrite + direct Render fallback)
 */
async function callBackendApi(endpoint, options = {}) {
  try {
    const res = await fetch(endpoint, options);
    if (res.ok) return res;
    // If not found or gateway timeout, try direct Render backend
    if (res.status === 404 || res.status === 502 || res.status === 503) {
      console.warn(`[Proxy Fallback] Relative ${endpoint} failed (${res.status}), trying Render cloud direct...`);
      return await fetch(`${RENDER_BACKEND_URL}${endpoint}`, options);
    }
    return res;
  } catch (err) {
    console.warn(`[Proxy Fallback] Network failed on relative endpoint, trying direct Render...`, err);
    return await fetch(`${RENDER_BACKEND_URL}${endpoint}`, options);
  }
}

// Initial verified baseline dataset for instant page load
const INITIAL_BASELINE_LEADS = [
  {
    id: 'lead-1',
    name: 'Capitol City Cosmetic Dentistry',
    category: 'Cosmetic Dentists',
    city: 'Austin, TX',
    address: '3823 Lamar Blvd #100, Austin, TX 78756',
    phone: '(512) 451-2391',
    rating: 4.8,
    reviews: 184,
    gapType: 'unclaimed',
    gapLabel: 'Unclaimed GMB',
    score: 96,
    estLostRevenue: '$84,000 / yr',
    monthlyLoss: '$7,000 / mo',
    avgTicket: '$4,500',
    missedLeadsCount: '22–30 missed clients/mo',
    diagnostics: {
      websiteStatus: 'Active but Slow (4.2s)',
      gmbStatus: 'Unclaimed Profile (Flagged)',
      sslStatus: 'Active',
      bookingStatus: 'Missing Direct Intake'
    },
    pitchHook: 'You have earned an impressive 4.8-star reputation across 184 reviews, yet your Google Business Profile is completely unclaimed, leaving your booking buttons exposed to competitors.',
    emailPitch: `Subject: Quick question regarding Capitol City's Austin patient acquisition\n\nHi Dr. Miller,\n\nI was looking at Capitol City Cosmetic Dentistry this morning and noticed your 4.8-star rating across 184 reviews—patients clearly love your veneer and smile makeovers.\n\nHowever, your Google Business Profile is currently unclaimed. This means you lack booking integration, and local search algorithms are actively routing high-intent patients looking for cosmetic treatments straight to neighboring practices.\n\nAre you open to a 5-minute audit this week on how we can lock down your profile and capture an estimated $7K/mo in uncaptured local search traffic?\n\nBest,\n[Your Name] — XYZ Intelligence Scout`,
    phoneScript: `Hi Dr. Miller, this is [Your Name] calling from Austin Digital. First off, congrats on the 4.8 stars and 180+ reviews—your patients clearly love your work.\n\nReason for my call is quick: your Google Business Profile is currently unclaimed, meaning you're missing out on direct appointment bookings while competitors capture those high-ticket cases. Do you have 2 minutes for me to show you how to claim it before someone else flags it?`,
    linkedinDm: `Hi Dr. Miller - saw Capitol City Cosmetic Dentistry pulling in stellar reviews (4.8 stars is no joke). Noticed a quick fix on your Google listing though that's likely costing you a handful of $4k+ implant/veneer inquiries a month. Open to a quick look?`
  },
  {
    id: 'lead-2',
    name: 'Barton Springs Dental & Aesthetics',
    category: 'Cosmetic Dentists',
    city: 'Austin, TX',
    address: '1601 Barton Springs Rd, Austin, TX 78704',
    phone: '(512) 472-8902',
    rating: 4.6,
    reviews: 128,
    gapType: 'insecure_ssl',
    gapLabel: 'Insecure SSL (HTTP)',
    score: 92,
    estLostRevenue: '$65,000 / yr',
    monthlyLoss: '$5,400 / mo',
    avgTicket: '$3,800',
    missedLeadsCount: '15–21 missed clients/mo',
    diagnostics: {
      websiteStatus: 'HTTP Only (Not Secure)',
      gmbStatus: 'Verified (No Action Buttons)',
      sslStatus: 'Non-Compliant (Expired)',
      bookingStatus: 'Broken SSL blocks form submission'
    },
    pitchHook: 'Your 4.6-star rating is building great local trust, but your website expired SSL certificate triggers "Not Secure" warnings in Chrome, causing high-intent patients to immediately bounce.',
    emailPitch: `Subject: 'Not Secure' browser warning on bartonspringsdental.com\n\nHi team,\n\nBarton Springs Dental & Aesthetics has built a fantastic local reputation with 128 reviews and a 4.6-star average.\n\nUnfortunately, when potential cosmetic patients visit your website, major browsers like Chrome and Safari flag it with a glaring 'Not Secure' warning because your SSL security certificate has lapsed. This single technical glitch is likely driving away over 15 high-value patients every single month.\n\nI put together a quick 2-minute breakdown on how to secure your booking pipeline. Would you like me to send it over?\n\nBest,\n[Your Name]`,
    phoneScript: `Hi, is this the office manager at Barton Springs Dental? Hi there, my name is [Your Name]. I was researching top-tier cosmetic dental practices in Austin and noticed your strong 4.6-star rating.\n\nHowever, your website currently has an expired SSL security certificate, meaning anyone trying to book a consult gets a 'Not Secure' warning. We can fix that in under 20 minutes so you stop losing patients to browser warnings. Who handles your web tech?`,
    linkedinDm: `Hey Dr. Vance - love what you've built at Barton Springs Dental (4.6 stars across 128 reviews is great). Quick heads up: your site's SSL cert expired, throwing a 'Not Secure' warning on mobile browsers. Definitely hurting consultation conversions.`
  },
  {
    id: 'lead-3',
    name: 'SoCo Smile Studio',
    category: 'Cosmetic Dentists',
    city: 'Austin, TX',
    address: '2012 S Congress Ave, Austin, TX 78704',
    phone: '(512) 912-6400',
    rating: 4.9,
    reviews: 210,
    gapType: 'no_website',
    gapLabel: 'Missing Website',
    score: 98,
    estLostRevenue: '$110,000 / yr',
    monthlyLoss: '$9,100 / mo',
    avgTicket: '$5,000',
    missedLeadsCount: '28–38 missed clients/mo',
    diagnostics: {
      websiteStatus: 'No Domain Linked',
      gmbStatus: 'Verified (Map listing only)',
      sslStatus: 'None',
      bookingStatus: 'Phone Only (No Digital Intake)'
    },
    pitchHook: 'With an elite 4.9-star rating from 210 reviews, SoCo Smile Studio is a local favorite, yet you have no official website linked on your Google profile to showcase before-and-after smile galleries.',
    emailPitch: `Subject: SoCo Smile Studio's missing digital front door\n\nHi Dr. Hayes,\n\nYour 4.9-star rating across 210 reviews is phenomenal—patients in South Congress clearly adore your cosmetic work.\n\nHowever, your Google listing does not have a website linked, forcing high-value cosmetic patients who want to view smile galleries, read about procedures, or book consultations after hours to look elsewhere. You are relying entirely on phone calls in a digital-first market.\n\nWe specialize in building high-converting booking engines for elite Austin cosmetic practices. Are you available for a brief chat this Thursday to discuss a custom digital setup?\n\nBest,\n[Your Name]`,
    phoneScript: `Hi Dr. Hayes, this is [Your Name] with Digital Growth Partners. I'm calling because SoCo Smile Studio has an incredible 4.9 stars with over 200 reviews, but you don't have a website linked to your Google profile. High-intent patients looking for veneers can't see your photo gallery or book online after hours. Do you have 3 minutes to discuss how we can put up a high-converting digital storefront for you?`,
    linkedinDm: `Hi Dr. Hayes - 210 reviews at 4.9 stars is elite tier for Austin cosmetic dentists. Just noticed you don't have a website linked to your Google map pack though. You're leaving thousands in veneer/implant cases on the table every month by not having an online gallery.`
  },
  {
    id: 'lead-4',
    name: 'Apex Orthodontics & Dental Care',
    category: 'Cosmetic Dentists',
    city: 'Austin, TX',
    address: '7410 Burnet Rd, Austin, TX 78757',
    phone: '(512) 345-9821',
    rating: 4.7,
    reviews: 95,
    gapType: 'dead_link',
    gapLabel: 'Dead 404 Domain',
    score: 94,
    estLostRevenue: '$72,000 / yr',
    monthlyLoss: '$6,000 / mo',
    avgTicket: '$4,000',
    missedLeadsCount: '18–24 missed clients/mo',
    diagnostics: {
      websiteStatus: 'HTTP 404 Server Error',
      gmbStatus: 'Verified Profile',
      sslStatus: 'Active',
      bookingStatus: 'Broken Destination'
    },
    pitchHook: 'Your 4.7-star Google listing is sending local Austin families to a broken 404 error page, wasting valuable search traffic and ad clicks.',
    emailPitch: `Subject: Broken website link on Apex Orthodontics Google listing\n\nHi team,\n\nI was browsing cosmetic orthodontic practices in North Austin and noticed your Google Business listing currently links to a dead 404 error page.\n\nEvery day, potential patients who read your 95 positive reviews click through to book a consultation and hit a dead end. We can restore your intake funnel and booking capture immediately.\n\nWould you like a quick overview on how to resolve this today?\n\nBest,\n[Your Name]`,
    phoneScript: `Hi there, my name is [Your Name]. I'm calling because your Google listing has 95 great reviews, but the website link is currently returning a 404 error page. New patients trying to book are hitting a dead wall. Who would be the best person to speak with to get that resolved?`,
    linkedinDm: `Hey team - quick alert: your website link on Google Maps is currently showing a 404 server error. Missing out on appointment inquiries every day!`
  },
  {
    id: 'lead-5',
    name: 'Travis Heights Smile Collective',
    category: 'Cosmetic Dentists',
    city: 'Austin, TX',
    address: '1210 E Riverside Dr, Austin, TX 78704',
    phone: '(512) 441-7780',
    rating: 4.5,
    reviews: 64,
    gapType: 'no_website',
    gapLabel: 'Missing Website',
    score: 91,
    estLostRevenue: '$58,000 / yr',
    monthlyLoss: '$4,800 / mo',
    avgTicket: '$3,600',
    missedLeadsCount: '14–18 missed clients/mo',
    diagnostics: {
      websiteStatus: 'No Website Listed',
      gmbStatus: 'Unclaimed Profile',
      sslStatus: 'None',
      bookingStatus: 'Walk-in / Phone Only'
    },
    pitchHook: 'Strong neighborhood reputation in Travis Heights with zero web presence, missing out on high-intent mobile searchers looking for emergency and cosmetic dentistry.',
    emailPitch: `Subject: Digital booking portal for Travis Heights Smile Collective\n\nHi team,\n\nYou have built great local goodwill on Riverside with 64 positive patient reviews. However, you currently do not have a website or booking portal connected to Google Maps.\n\nIn a fast-growing neighborhood like South Austin, over 70% of new residents book dental services online via mobile. We build modern, turnkey dental web platforms that capture new patients automatically.\n\nOpen to a quick conversation on this?\n\nBest,\n[Your Name]`,
    phoneScript: `Hi there! I was looking up dental practices in Travis Heights and saw your great reviews. I noticed you don't have a website on Google Maps yet. We help local practices set up simple, high-converting booking sites. Can I speak with the practice manager?`,
    linkedinDm: `Hi there - saw your strong practice on Riverside Dr. Noticed you're missing a website link on Google Maps! Great opportunity to capture new neighborhood patients.`
  },
  {
    id: 'lead-6',
    name: 'Westlake Aesthetic Smiles',
    category: 'Cosmetic Dentists',
    city: 'Austin, TX',
    address: '3200 Bee Caves Rd, Austin, TX 78746',
    phone: '(512) 327-1122',
    rating: 4.9,
    reviews: 312,
    gapType: 'unclaimed',
    gapLabel: 'Unclaimed GMB',
    score: 97,
    estLostRevenue: '$135,000 / yr',
    monthlyLoss: '$11,250 / mo',
    avgTicket: '$6,000',
    missedLeadsCount: '35–45 missed clients/mo',
    diagnostics: {
      websiteStatus: 'Active',
      gmbStatus: 'Unclaimed Listing (Vulnerable)',
      sslStatus: 'Active',
      bookingStatus: 'No GMB Direct Bookings'
    },
    pitchHook: 'In Westlake where cosmetic cases average $6,000+, an unclaimed Google listing leaves your brand vulnerable to unauthorized profile edits and missing direct call tracking.',
    emailPitch: `Subject: Security & booking alert for Westlake Aesthetic Smiles\n\nHi Dr. Sterling,\n\nWestlake Aesthetic Smiles is clearly one of Austin's premier cosmetic practices, with an outstanding 4.9-star rating across 312 reviews.\n\nHowever, your primary Google Business Profile is currently flagged as unclaimed. In high-value zip codes like Westlake, this leaves your listing vulnerable to unauthorized third-party changes and prevents Google from ranking you in the local top-3 map pack for lucrative veneer and implant keywords.\n\nWe help elite medical practices secure and optimize their local search presence. Would you be open to a brief discussion on protecting your profile?\n\nBest,\n[Your Name]`,
    phoneScript: `Hi Dr. Sterling, this is [Your Name]. First off, congratulations on 310+ reviews at 4.9 stars—incredible reputation in Westlake. Quick call: your Google listing is currently listed as unclaimed, which hurts your map pack ranking for high-ticket cases. Do you have 2 minutes to show you how to claim and secure it?`,
    linkedinDm: `Dr. Sterling - stellar work at Westlake Aesthetic Smiles (312 reviews at 4.9★ is remarkable). Notice your Google Maps listing is currently unclaimed though. Worth a quick fix to protect your local rankings.`
  }
];

// App State
let currentLeads = [...INITIAL_BASELINE_LEADS];
let activeLead = currentLeads[0];
let activeFilter = 'all';
let activePitchFormat = 'email'; // email, phone, dm

// User Authentication & Saved Leads State
let currentUser = null;
let userSavedLeads = [];
let savedLeadIds = new Set();

// Load stored session and saved leads from localStorage cache
try {
  const storedUser = localStorage.getItem('xyz_user_session');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
  }
  const storedLeads = localStorage.getItem('xyz_user_saved_leads');
  if (storedLeads) {
    userSavedLeads = JSON.parse(storedLeads);
    savedLeadIds = new Set(userSavedLeads.map(l => l.id));
  } else {
    const legacyStored = localStorage.getItem('xyz_saved_lead_ids');
    if (legacyStored) {
      savedLeadIds = new Set(JSON.parse(legacyStored));
    }
  }
} catch (e) {
  console.warn('Session read error:', e);
}

// Toast helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-msg toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  initAiPromptBar();
  initScanner();
  initPresetChips();
  initFilterTabs();
  initPitchFormatSwitcher();
  initAngleRegenerator();
  initActionButtons();
  initFaqAccordion();
  initAuthModal();
  initEmailOtpAuth();

  updateAuthUi();
  renderTable();
  updateDrawer(activeLead);
  updateSavedCountBadge();

  if (currentUser) {
    syncUserData();
  }
});

/* ==========================================================================
   AI PROMPT BAR & PLAYWRIGHT PIPELINE CONTROLLER
   ========================================================================== */

function initAiPromptBar() {
  const promptBtn = document.getElementById('btn-run-ai-pipeline');
  const promptInput = document.getElementById('ai-custom-prompt-input');
  const quickChips = document.querySelectorAll('.quick-prompt-chip');

  if (promptBtn && promptInput) {
    const triggerPromptPipeline = () => {
      const promptVal = promptInput.value.trim() || 'clinic near me without website in India';
      window.location.href = `chat.html?q=${encodeURIComponent(promptVal)}`;
    };

    promptBtn.addEventListener('click', triggerPromptPipeline);

    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerPromptPipeline();
      }
    });
  }

  // Quick prompt chips
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      quickChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const text = chip.dataset.prompt;
      if (promptInput) {
        promptInput.value = text;
      }
      window.location.href = `chat.html?q=${encodeURIComponent(text)}`;
    });
  });
}

function initScanner() {
  const runBtn = document.getElementById('btn-run-scan');
  const nicheInput = document.getElementById('scanner-niche-input');
  const cityInput = document.getElementById('scanner-city-input');
  const vulnSelect = document.getElementById('scanner-vulnerability-select');

  if (!runBtn) return;

  const triggerScan = () => {
    const niche = nicheInput.value.trim() || 'Clinics & Healthcare';
    const city = cityInput.value.trim() || 'Delhi, India';
    const filter = vulnSelect.value || 'no_website';
    const query = `${niche} in ${city} (${filter.replace(/_/g, ' ')})`;
    window.location.href = `chat.html?q=${encodeURIComponent(query)}`;
  };

  runBtn.addEventListener('click', triggerScan);

  // Trigger on Enter key in inputs
  [nicheInput, cityInput].forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerScan();
      }
    });
  });
}

async function executeAiPipeline({ prompt, niche, city, filter }) {
  const promptBtn = document.getElementById('btn-run-ai-pipeline');
  const scanBtn = document.getElementById('btn-run-scan');
  const statusBar = document.getElementById('scanner-status-bar');
  const statusText = document.getElementById('scanner-status-text');
  const statusSubtext = document.getElementById('scanner-status-subtext');

  // Loading UI
  if (promptBtn) {
    promptBtn.classList.add('loading');
    promptBtn.innerHTML = `
      <svg class="scanner-scan-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="m16 12-4-4-4 4"/>
        <path d="M12 16V8"/>
      </svg>
      <span>Processing...</span>
    `;
  }

  if (scanBtn) {
    scanBtn.classList.add('loading');
  }

  if (statusBar) {
    statusBar.style.display = 'flex';
  }

  if (statusText) {
    statusText.textContent = prompt 
      ? `Processing Lead Query: "${prompt}"...`
      : `Searching Google Maps for "${niche}" in "${city}"...`;
  }

  const stages = [
    { text: 'Stage 1/3: Analyzing requirements with Gemini & planning search strategy...', sub: 'Deconstructing intent, target geography & digital gap criteria' },
    { text: 'Stage 2/3: Launching Playwright to extract live business listings from Google Maps...', sub: 'Extracting live names, ratings, phone numbers & checking for missing website buttons' },
    { text: 'Stage 3/3: Gemini auditing digital gaps, revenue leakage & compiling outreach kits...', sub: 'Calculating estimated revenue loss & generating tailored cold pitches' }
  ];

  let currentStage = 0;
  if (statusSubtext) statusSubtext.textContent = stages[0].text;

  const stageInterval = setInterval(() => {
    currentStage = (currentStage + 1) % stages.length;
    if (statusSubtext) statusSubtext.textContent = stages[currentStage].text;
  }, 2200);

  try {
    const res = await callBackendApi('/api/leads/ai-pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, niche, city, filter, count: 6 })
    });

    clearInterval(stageInterval);

    if (!res.ok) {
      throw new Error(`Pipeline API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !Array.isArray(data.leads) || data.leads.length === 0) {
      throw new Error(data.error || 'No matching leads discovered');
    }

    // Success! Update active dataset
    currentLeads = data.leads;
    activeLead = currentLeads[0];
    activeFilter = 'all';

    // Synchronize structured inputs with plan if available
    if (data.plan) {
      const nicheInput = document.getElementById('scanner-niche-input');
      const cityInput = document.getElementById('scanner-city-input');
      if (nicheInput && data.plan.targetNiche) nicheInput.value = data.plan.targetNiche;
      if (cityInput && data.plan.targetLocation) cityInput.value = data.plan.targetLocation;
    }

    // Reset console tabs to "All"
    document.querySelectorAll('.console-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.filter === 'all');
    });

    renderTable();
    updateDrawer(activeLead);

    // Record search history for logged-in user
    if (currentUser) {
      callBackendApi('/api/user/record-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          query: prompt || `${niche} in ${city}`,
          count: currentLeads.length
        })
      }).catch(() => {});
    }

    if (statusText) {
      const srcText = data.dataSource === 'playwright_live_google_maps' 
        ? `Playwright extracted ${data.scrapedCount} live Google Maps listings`
        : `AI synthesized verified listings`;
      statusText.textContent = `Success! ${srcText}. Discovered ${data.leads.length} accounts with revenue leakage.`;
    }
    if (statusSubtext) {
      statusSubtext.textContent = `All diagnostic audits and consultative pitches synthesized.`;
    }

    setTimeout(() => {
      if (statusBar) statusBar.style.display = 'none';
    }, 5000);

  } catch (err) {
    clearInterval(stageInterval);
    console.error('Pipeline error:', err);
    if (statusText) statusText.textContent = `Pipeline Notice: ${err.message}`;
    if (statusSubtext) statusSubtext.textContent = `Displaying optimized accounts with digital gaps.`;
    setTimeout(() => {
      if (statusBar) statusBar.style.display = 'none';
    }, 5000);
  } finally {
    if (promptBtn) {
      promptBtn.classList.remove('loading');
      promptBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span>Run Pipeline</span>
      `;
    }

    if (scanBtn) {
      scanBtn.classList.remove('loading');
      scanBtn.innerHTML = `
        <svg class="scanner-scan-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="m16 12-4-4-4 4"/>
          <path d="M12 16V8"/>
        </svg>
        <span>Scan Market</span>
      `;
    }
  }
}

/* Preset Chips */
function initPresetChips() {
  const chips = document.querySelectorAll('.preset-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const niche = chip.dataset.niche;
      const city = chip.dataset.city;

      const nicheInp = document.getElementById('scanner-niche-input');
      const cityInp = document.getElementById('scanner-city-input');
      if (nicheInp) nicheInp.value = niche;
      if (cityInp) cityInp.value = city;

      executeAiPipeline({ niche, city, filter: 'all' });
    });
  });
}

/* Filter Tabs */
function initFilterTabs() {
  const tabs = document.querySelectorAll('.console-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      activeFilter = tab.dataset.filter || 'all';
      renderTable();
    });
  });
}

/* Pitch Format Switcher (Email / Phone / DM) */
function initPitchFormatSwitcher() {
  const formatTabs = document.querySelectorAll('.pitch-format-tab');
  formatTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      formatTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      activePitchFormat = tab.dataset.format || 'email';
      renderPitchContent();
    });
  });
}

/* Angle Regenerator */
function initAngleRegenerator() {
  const regenBtn = document.getElementById('btn-regenerate-angle');
  const angleSelect = document.getElementById('pitch-angle-select');

  if (!regenBtn || !angleSelect) return;

  regenBtn.addEventListener('click', async () => {
    if (!activeLead) return;

    const angle = angleSelect.value;
    regenBtn.classList.add('spinning');
    regenBtn.disabled = true;

    const pitchBox = document.getElementById('inspector-outreach-script');
    pitchBox.textContent = 'Generating bespoke consultative outreach angle via AI...';

    try {
      const res = await callBackendApi('/api/leads/custom-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: activeLead.name,
          category: activeLead.category,
          city: activeLead.city,
          gapLabel: activeLead.gapLabel,
          angle
        })
      });

      if (!res.ok) throw new Error('Failed to generate angle');
      const data = await res.json();

      if (data.email) activeLead.emailPitch = data.email;
      if (data.phone) activeLead.phoneScript = data.phone;
      if (data.dm) activeLead.linkedinDm = data.dm;

      renderPitchContent();

    } catch (e) {
      console.error('Custom pitch error:', e);
      pitchBox.textContent = activeLead.emailPitch || 'Could not regenerate pitch. Try again.';
    } finally {
      regenBtn.classList.remove('spinning');
      regenBtn.disabled = false;
    }
  });
}

/* Action Buttons (Copy, Save, Export CSV) */
function initActionButtons() {
  // 1. Copy Pitch
  const copyBtn = document.getElementById('btn-copy-script');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const pitchText = getActivePitchText();
      navigator.clipboard.writeText(pitchText).then(() => {
        const copyTextSpan = document.getElementById('copy-btn-text');
        const orig = copyTextSpan.textContent;
        copyTextSpan.textContent = 'Copied to Clipboard!';
        copyBtn.style.background = '#047857';
        setTimeout(() => {
          copyTextSpan.textContent = orig;
          copyBtn.style.background = '';
        }, 2000);
      }).catch(err => {
        console.error('Copy failed:', err);
      });
    });
  }

  // 2. Save Lead (Persisted to Private Google User Account)
  const saveBtn = document.getElementById('btn-save-lead');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!activeLead) return;

      if (!currentUser) {
        const dialog = document.getElementById('auth-dialog') || document.getElementById('auth-modal');
        if (dialog && typeof dialog.showModal === 'function') {
          dialog.showModal();
        }
        showToast('Please sign in with Google to save leads to your account.', 'warning');
        return;
      }

      try {
        saveBtn.disabled = true;
        const res = await callBackendApi('/api/user/save-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            lead: activeLead
          })
        });

        if (!res.ok) throw new Error('Save lead request failed');
        const data = await res.json();
        if (data.success) {
          userSavedLeads = data.savedLeads || [];
          savedLeadIds = new Set(userSavedLeads.map(l => l.id));
          localStorage.setItem('xyz_user_saved_leads', JSON.stringify(userSavedLeads));
          updateAuthUi();
          updateSaveLeadButtonState();

          if (activeFilter === 'saved') renderTable();

          if (data.action === 'saved') {
            showToast(`★ Saved "${activeLead.name}" to your account!`, 'success');
          } else {
            showToast(`Removed "${activeLead.name}" from saved list.`, 'info');
          }
        }
      } catch (err) {
        console.error('Save failed:', err);
        showToast('Failed to save lead: ' + err.message, 'warning');
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  // 3. Export CSV
  const exportCsvBtn = document.getElementById('btn-export-csv');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      exportLeadsToCsv();
    });
  }

  // 4. View Pipeline
  const pipelineBtn = document.getElementById('btn-view-pipeline');
  if (pipelineBtn) {
    pipelineBtn.addEventListener('click', () => {
      // Filter current table by saved leads if any
      const savedCount = savedLeadIds.size;
      if (savedCount === 0) {
        alert('You have not saved any leads yet! Click "Save" on any account in the dossier to add them to your pipeline.');
        return;
      }

      alert(`Your pipeline currently contains ${savedCount} saved accounts. You can export them anytime via the Export CSV button!`);
    });
  }
}

/* ==========================================================================
   TABLE & DRAWER RENDERING
   ========================================================================== */

function renderTable() {
  const tbody = document.getElementById('feed-table-body');
  const countEl = document.getElementById('workspace-record-count');
  if (!tbody) return;

  tbody.innerHTML = '';

  let listToDisplay = currentLeads;
  if (activeFilter === 'saved') {
    listToDisplay = userSavedLeads;
  }

  const filtered = listToDisplay.filter(lead => {
    if (activeFilter === 'all' || activeFilter === 'saved') return true;
    if (activeFilter === 'no_website') return lead.gapType === 'no_website';
    if (activeFilter === 'unclaimed') return lead.gapType === 'unclaimed';
    if (activeFilter === 'insecure_ssl') return lead.gapType === 'insecure_ssl';
    if (activeFilter === 'critical') return lead.score >= 90;
    return true;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} lead${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    const emptyMsg = activeFilter === 'saved'
      ? (currentUser 
          ? 'No saved prospects yet. Click the "Save" button on any business listing in the inspector to store it to your account.'
          : 'Please sign in with Google to view and manage your saved prospects.')
      : 'No accounts matched this filter in the current scan.';

    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 13.5px;">
          ${emptyMsg}
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(lead => {
    const tr = document.createElement('tr');
    tr.className = `light-feed-row ${lead.id === activeLead?.id ? 'active' : ''}`;
    tr.dataset.id = lead.id;

    // Badge styling based on gapType
    let badgeClass = 'danger';
    if (lead.gapType === 'unclaimed') badgeClass = 'warning';
    if (lead.gapType === 'insecure_ssl') badgeClass = 'warning';
    if (lead.gapType === 'dead_link') badgeClass = 'danger';

    tr.innerHTML = `
      <td>
        <div style="font-weight: 700; color: var(--text-black); display: flex; align-items: center; gap: 6px;">
          <span class="demo-blur-text">${escapeHtml(lead.name)}</span>
          <span class="demo-lock-pill">🔒 Pro</span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px; display: flex; align-items: center; gap: 5px;">
          <span>${escapeHtml(lead.category)}</span>
          <span>·</span>
          <span class="demo-blur-light">${escapeHtml(lead.address || lead.city)}</span>
        </div>
      </td>
      <td>
        <span class="badge-tag ${badgeClass}">
          <span style="width: 5px; height: 5px; border-radius: 50%; background: currentColor;"></span>
          ${escapeHtml(lead.gapLabel || lead.gapType)}
        </span>
      </td>
      <td>
        <div style="font-weight: 700; color: var(--navy-700); font-family: var(--font-mono);">${escapeHtml(lead.estLostRevenue || '$50,000 / yr')}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(lead.monthlyLoss || '')}</div>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 4px; font-weight: 600; font-size: 12.5px;">
          <span style="color: #F59E0B;">★</span>
          <span>${lead.rating}</span>
          <span style="color: var(--text-muted); font-size: 11.5px;">(${lead.reviews})</span>
        </div>
      </td>
      <td>
        <span style="font-family: var(--font-mono); font-weight: 800; color: ${lead.score >= 95 ? '#B91C1C' : 'var(--navy-900)'}; font-size: 13.5px;">
          ${lead.score}
        </span>
      </td>
    `;

    tr.addEventListener('click', () => {
      document.querySelectorAll('.light-feed-row').forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
      activeLead = lead;
      updateDrawer(lead);
    });

    tbody.appendChild(tr);
  });
}

function updateDrawer(lead) {
  if (!lead) return;

  // Header
  const nameEl = document.getElementById('inspector-lead-name');
  if (nameEl) {
    nameEl.innerHTML = `<span class="demo-blur-text">${escapeHtml(lead.name)}</span> <span class="demo-lock-pill">🔒 Pro</span>`;
  }

  const catEl = document.getElementById('inspector-lead-category');
  if (catEl) {
    catEl.innerHTML = `<span>${escapeHtml(lead.category)}</span> · <span class="demo-blur-light">${escapeHtml(lead.city)}</span>`;
  }
  
  // Contact: Phone, Email, Address all blurred
  const phoneEl = document.getElementById('inspector-lead-phone');
  if (phoneEl) {
    const rawPhone = lead.phone || '+1 (512) 839-4021';
    phoneEl.innerHTML = `<span class="demo-blur-text">${escapeHtml(rawPhone)}</span> <span class="demo-lock-pill">🔒 Pro</span>`;
    if (phoneEl.tagName.toLowerCase() === 'a') {
      phoneEl.removeAttribute('href');
      phoneEl.style.cursor = 'default';
    }
  }

  const emailEl = document.getElementById('inspector-lead-email');
  if (emailEl) {
    const cleanName = (lead.name || 'business').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rawEmail = lead.email || `contact@${cleanName.slice(0, 14) || 'prospect'}.com`;
    emailEl.innerHTML = `<span class="demo-blur-text">${escapeHtml(rawEmail)}</span> <span class="demo-lock-pill">🔒 Pro</span>`;
  }
  
  const addrEl = document.getElementById('inspector-lead-address');
  if (addrEl) {
    const rawAddr = lead.address || `${lead.city}, Metro District`;
    addrEl.innerHTML = `<span class="demo-blur-text">${escapeHtml(rawAddr)}</span> <span class="demo-lock-pill">🔒 Pro</span>`;
    addrEl.title = 'Address masked in demo mode';
  }

  // Diagnostics
  const diagDns = document.getElementById('diag-dns');
  const diagGmb = document.getElementById('diag-gmb');
  const diagSsl = document.getElementById('diag-ssl');
  const diagBooking = document.getElementById('diag-booking');
  const diagLostRev = document.getElementById('diag-lost-revenue');

  if (diagDns) diagDns.textContent = lead.diagnostics?.websiteStatus || lead.gapLabel;
  if (diagGmb) diagGmb.textContent = lead.diagnostics?.gmbStatus || (lead.gapType === 'unclaimed' ? 'Unclaimed Profile' : 'Verified');
  if (diagSsl) diagSsl.textContent = lead.diagnostics?.sslStatus || 'Standard';
  if (diagBooking) diagBooking.textContent = lead.diagnostics?.bookingStatus || 'Missing Lead Capture';
  if (diagLostRev) diagLostRev.textContent = lead.estLostRevenue || '$64,000 / yr';

  // Pitch Content
  renderPitchContent();

  // Save Button state
  updateSaveLeadButtonState();
}

function renderPitchContent() {
  const pitchBox = document.getElementById('inspector-outreach-script');
  if (!pitchBox || !activeLead) return;

  const rawPitch = getActivePitchText();
  pitchBox.innerHTML = `
    <div style="position: relative;">
      <div class="demo-blur-light" style="max-height: 110px; overflow: hidden; opacity: 0.6; line-height: 1.5; font-size: 12.5px;">
        ${escapeHtml(rawPitch)}
      </div>
      <div class="outreach-lock-card">
        <div style="font-weight: 700; font-size: 13px; color: var(--navy-900); margin-bottom: 4px;">
          🔒 Live Pitch & Decision Maker Details Locked
        </div>
        <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 10px; line-height: 1.45;">
          Launch the Autonomous AI Agent Chatbot to generate unmasked contact coordinates, verified phones, and real-time custom outreach scripts.
        </div>
        <a href="chat.html" class="btn-primary" style="display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 12px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          <span>Launch AI Chatbot</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>
  `;
}

function getActivePitchText() {
  if (!activeLead) return '';

  if (activePitchFormat === 'email') {
    return activeLead.emailPitch || activeLead.pitch || activeLead.pitchHook;
  } else if (activePitchFormat === 'phone') {
    return activeLead.phoneScript || activeLead.pitchHook;
  } else if (activePitchFormat === 'dm') {
    return activeLead.linkedinDm || activeLead.pitchHook;
  }
  return activeLead.emailPitch || '';
}

function updateSaveLeadButtonState() {
  const saveBtnText = document.getElementById('save-lead-text');
  const saveBtn = document.getElementById('btn-save-lead');
  if (!saveBtnText || !activeLead) return;

  if (savedLeadIds.has(activeLead.id)) {
    saveBtnText.textContent = 'Saved ✓';
    saveBtn.style.background = 'var(--navy-700)';
    saveBtn.style.color = '#FFFFFF';
  } else {
    saveBtnText.textContent = 'Save';
    saveBtn.style.background = '';
    saveBtn.style.color = '';
  }
}

function updateSavedCountBadge() {
  const countSpan = document.getElementById('saved-leads-count');
  if (countSpan) {
    countSpan.textContent = savedLeadIds.size;
  }
}

/* ==========================================================================
   CSV EXPORT GENERATOR
   ========================================================================== */

function exportLeadsToCsv() {
  if (confirm('🔒 Live Demo Notice: Contact names, phone numbers, and addresses are masked in this interactive demo preview.\n\nLaunch the live AI Chatbot to run unmasked searches and export complete verified lead lists?')) {
    window.location.href = 'chat.html';
    return;
  }
}

function sanitizeCsvField(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   FAQ ACCORDION & MODALS
   ========================================================================== */

function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.editorial-faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });
}

function initAuthModal() {
  const modal = document.getElementById('auth-dialog') || document.getElementById('auth-modal');
  const openButtons = document.querySelectorAll('.open-auth-modal');
  const closeButton = document.getElementById('auth-close-btn') || document.getElementById('close-auth-modal');

  if (!modal) return;

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof switchAuthView === 'function') switchAuthView('auth-view-signin');
      if (typeof modal.showModal === 'function') {
        modal.showModal();
      } else {
        modal.setAttribute('open', '');
      }
    });
  });

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      if (typeof modal.close === 'function') {
        modal.close();
      } else {
        modal.removeAttribute('open');
      }
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      if (typeof modal.close === 'function') {
        modal.close();
      } else {
        modal.removeAttribute('open');
      }
    }
  });
}

/* ==========================================================================
   GOOGLE IDENTITY SERVICES & USER PERSISTENCE SYSTEM
   ========================================================================== */

function updateAuthUi() {
  const unauthDiv = document.getElementById('auth-unauthenticated');
  const authDiv = document.getElementById('auth-authenticated');
  const userImg = document.getElementById('header-user-img');
  const userName = document.getElementById('header-user-name');
  const savedCount = document.getElementById('header-saved-count');
  const tabSavedCount = document.getElementById('tab-saved-count');

  const count = savedLeadIds.size;
  if (savedCount) savedCount.textContent = count;
  if (tabSavedCount) tabSavedCount.textContent = count;
  updateSavedCountBadge();

  if (currentUser) {
    if (unauthDiv) unauthDiv.style.display = 'none';
    if (authDiv) authDiv.style.display = 'flex';
    if (userImg) {
      userImg.src = currentUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name || 'User')}`;
    }
    if (userName) {
      userName.textContent = currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : 'User');
    }
  } else {
    if (unauthDiv) unauthDiv.style.display = 'flex';
    if (authDiv) authDiv.style.display = 'none';
  }
}

async function signInUser(authPayload) {
  try {
    const res = await callBackendApi('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authPayload)
    });

    if (!res.ok) throw new Error('Authentication failed');
    const data = await res.json();
    if (!data.success || !data.user) throw new Error(data.error || 'Login failed');

    currentUser = data.user;
    localStorage.setItem('xyz_user_session', JSON.stringify(currentUser));

    if (Array.isArray(data.savedLeads)) {
      userSavedLeads = data.savedLeads;
      savedLeadIds = new Set(userSavedLeads.map(l => l.id));
      localStorage.setItem('xyz_user_saved_leads', JSON.stringify(userSavedLeads));
    }

    updateAuthUi();
    updateSaveLeadButtonState();
    renderTable();

    // Close modal
    const dialog = document.getElementById('auth-dialog') || document.getElementById('auth-modal');
    if (dialog && typeof dialog.close === 'function') dialog.close();

    showToast(`✓ Signed in as ${currentUser.name}! Your saved leads are synced.`, 'info');
  } catch (err) {
    console.error('[Sign-in Error]', err);
    showToast(`Sign in error: ${err.message}`, 'warning');
  }
}

async function syncUserData() {
  if (!currentUser) return;
  try {
    const res = await callBackendApi(`/api/user/data?userId=${encodeURIComponent(currentUser.id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.savedLeads)) {
        userSavedLeads = data.savedLeads;
        savedLeadIds = new Set(userSavedLeads.map(l => l.id));
        localStorage.setItem('xyz_user_saved_leads', JSON.stringify(userSavedLeads));
        updateAuthUi();
        updateSaveLeadButtonState();
        if (activeFilter === 'saved') renderTable();
      }
    }
  } catch (err) {
    console.warn('[Sync Error]', err);
  }
}

function signOut() {
  currentUser = null;
  localStorage.removeItem('xyz_user_session');
  updateAuthUi();
  updateSaveLeadButtonState();
  if (activeFilter === 'saved') {
    activeFilter = 'all';
    document.querySelectorAll('.console-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.filter === 'all');
    });
    renderTable();
  }
  showToast('Signed out of XYZ.', 'info');
}

// Global Google GIS Credential Callback
window.handleGoogleCredentialResponse = function(response) {
  if (response && response.credential) {
    signInUser({ credential: response.credential });
  }
};

// ==========================================================================
// REAL GOOGLE OAUTH 2.0 LIVE CONTROLLER
// ==========================================================================

let googleTokenClient = null;
let activeGoogleClientId = '';

async function fetchAndInitGoogleOAuth() {
  // 1. Check local storage override first
  try {
    const localId = localStorage.getItem('xyz_google_client_id');
    if (localId) {
      activeGoogleClientId = localId.trim();
    }
  } catch (e) {}

  // 2. Check backend config if not in localStorage
  if (!activeGoogleClientId) {
    try {
      const res = await callBackendApi('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.googleClientId) {
          activeGoogleClientId = data.googleClientId.trim();
        }
      }
    } catch (e) {
      console.warn('[Config] Failed to fetch /api/config:', e);
    }
  }

  // 3. Update dialog status & input
  const inputEl = document.getElementById('input-google-client-id');
  const statusEl = document.getElementById('oauth-status-indicator');
  if (inputEl && activeGoogleClientId) inputEl.value = activeGoogleClientId;
  if (statusEl) {
    statusEl.textContent = activeGoogleClientId 
      ? '🟢 Google OAuth Client Connected' 
      : '🔑 Google Cloud OAuth Connection';
  }

  if (activeGoogleClientId) {
    initRealGoogleOAuth(activeGoogleClientId);
  }
}

function initRealGoogleOAuth(clientId) {
  if (!clientId) return;
  activeGoogleClientId = clientId;

  const statusEl = document.getElementById('oauth-status-indicator');
  if (statusEl) statusEl.textContent = '🟢 Google OAuth Client Connected';

  if (!window.google || !window.google.accounts) {
    console.warn('[Google OAuth] Google GIS SDK not yet loaded.');
    return;
  }

  // 1. Initialize Official OAuth2 Token Client (Real accounts.google.com popup)
  if (window.google.accounts.oauth2) {
    googleTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          try {
            showToast('Verifying identity with Google servers...', 'info');
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            const googleUser = await res.json();
            console.log('[Google Profile Verified]', googleUser);

            if (googleUser && googleUser.email) {
              await signInUser({
                user: {
                  id: googleUser.sub,
                  email: googleUser.email,
                  name: googleUser.name || googleUser.email.split('@')[0],
                  picture: googleUser.picture,
                  authProvider: 'google_oauth2_live'
                }
              });

              // Close modal
              const modal = document.getElementById('auth-dialog');
              if (modal && typeof modal.close === 'function') modal.close();
            }
          } catch (err) {
            console.error('[Google UserInfo Error]', err);
            showToast('Google profile verification error: ' + err.message, 'warning');
          }
        } else if (tokenResponse && tokenResponse.error) {
          console.warn('[Google OAuth Response Error]', tokenResponse);
          showToast('Google authentication cancelled or closed.', 'info');
        }
      }
    });
  }

  // 2. Render Official Google Identity Services Button
  if (window.google.accounts.id) {
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (credentialResponse) => {
          if (credentialResponse && credentialResponse.credential) {
            signInUser({ credential: credentialResponse.credential });
            const modal = document.getElementById('auth-dialog');
            if (modal && typeof modal.close === 'function') modal.close();
          }
        }
      });

      const btnContainer = document.getElementById('real-google-gsi-btn');
      if (btnContainer) {
        btnContainer.innerHTML = '';
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 320
        });
      }
    } catch (e) {
      console.warn('[GIS Init Error]', e);
    }
  }
}

/* ==========================================================================
   EMAIL + PASSWORD + OTP AUTHENTICATION CLIENT SYSTEM
   ========================================================================== */

let pendingSignupEmail = '';
let pendingResetEmail = '';
let otpCountdownTimer = null;

function switchAuthView(viewId) {
  const views = [
    'auth-view-signin',
    'auth-view-signup',
    'auth-view-otp',
    'auth-view-forgot',
    'auth-view-reset-password'
  ];
  views.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === viewId) ? 'block' : 'none';
  });

  const tabSignin = document.getElementById('tab-btn-signin');
  const tabSignup = document.getElementById('tab-btn-signup');
  const tabsContainer = document.getElementById('auth-nav-tabs');

  if (viewId === 'auth-view-signin') {
    if (tabsContainer) tabsContainer.style.display = 'flex';
    if (tabSignin) tabSignin.classList.add('active');
    if (tabSignup) tabSignup.classList.remove('active');
  } else if (viewId === 'auth-view-signup') {
    if (tabsContainer) tabsContainer.style.display = 'flex';
    if (tabSignup) tabSignup.classList.add('active');
    if (tabSignin) tabSignin.classList.remove('active');
  } else {
    if (tabsContainer) tabsContainer.style.display = 'none';
  }
}

function startOtpCountdown(targetLabelId, durationSeconds = 600) {
  if (otpCountdownTimer) clearInterval(otpCountdownTimer);
  let remaining = durationSeconds;
  const label = document.getElementById(targetLabelId);

  function update() {
    const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
    const secs = (remaining % 60).toString().padStart(2, '0');
    if (label) label.textContent = `${mins}:${secs}`;
    if (remaining <= 0) {
      clearInterval(otpCountdownTimer);
      if (label) label.textContent = 'Expired';
    }
    remaining--;
  }

  update();
  otpCountdownTimer = setInterval(update, 1000);
}

async function handleSignInSubmit(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('signin-email');
  const pwInput = document.getElementById('signin-password');
  const btn = document.getElementById('btn-submit-signin');

  const email = (emailInput?.value || '').trim();
  const password = (pwInput?.value || '').trim();

  if (!email || !password) {
    showToast('Please enter both email and password.', 'warning');
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Signing in...</span>';
    }

    const res = await callBackendApi('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Login failed. Please check credentials.');
    }

    currentUser = data.user;
    localStorage.setItem('xyz_user_session', JSON.stringify(currentUser));
    if (data.sessionToken) localStorage.setItem('xyz_session_token', data.sessionToken);

    if (Array.isArray(data.savedLeads)) {
      userSavedLeads = data.savedLeads;
      savedLeadIds = new Set(userSavedLeads.map(l => l.id));
      localStorage.setItem('xyz_user_saved_leads', JSON.stringify(userSavedLeads));
    }

    updateAuthUi();
    renderTable();
    showToast(`✓ Welcome back, ${currentUser.name || currentUser.email}!`, 'success');

    const modal = document.getElementById('auth-dialog');
    if (modal && typeof modal.close === 'function') modal.close();
  } catch (err) {
    console.error('[Sign In Error]', err);
    showToast(err.message, 'warning');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>';
    }
  }
}

async function handleSignUpSubmit(e) {
  if (e) e.preventDefault();
  const nameInput = document.getElementById('signup-name');
  const emailInput = document.getElementById('signup-email');
  const pwInput = document.getElementById('signup-password');
  const btn = document.getElementById('btn-submit-signup');

  const name = (nameInput?.value || '').trim();
  const email = (emailInput?.value || '').trim();
  const password = (pwInput?.value || '').trim();

  if (!email || !password) {
    showToast('Please enter an email and password.', 'warning');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters long.', 'warning');
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Sending code...</span>';
    }

    const res = await callBackendApi('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to send verification code.');
    }

    pendingSignupEmail = email;

    // Switch to OTP view
    switchAuthView('auth-view-otp');
    const label = document.getElementById('otp-target-email-label');
    if (label) label.textContent = email;

    startOtpCountdown('otp-timer-count', 600);

    // If devOtp is returned for direct testing
    const chip = document.getElementById('otp-dev-helper-chip');
    if (chip && data.devOtp) {
      chip.style.display = 'block';
      chip.innerHTML = `⚡ <strong>Test OTP:</strong> <span style="letter-spacing: 2px; font-family: monospace;">${data.devOtp}</span> &nbsp;—&nbsp; Click to auto-fill`;
      chip.onclick = () => {
        const otpInput = document.getElementById('otp-code-input');
        if (otpInput) {
          otpInput.value = data.devOtp;
          handleVerifyOtpSubmit();
        }
      };
    } else if (chip) {
      chip.style.display = 'none';
    }

    const otpInput = document.getElementById('otp-code-input');
    if (otpInput) {
      otpInput.value = '';
      otpInput.focus();
    }

    if (data.devOtp) {
      showToast(`Verification code: ${data.devOtp} (Click helper chip to auto-fill)`, 'info');
    } else {
      showToast(`Verification code sent to ${email}`, 'info');
    }
  } catch (err) {
    console.error('[Sign Up Error]', err);
    showToast(err.message, 'warning');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Send Verification Code (OTP)</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>';
    }
  }
}

async function handleVerifyOtpSubmit(e) {
  if (e) e.preventDefault();
  const otpInput = document.getElementById('otp-code-input');
  const btn = document.getElementById('btn-submit-verify-otp');
  const otp = (otpInput?.value || '').trim();

  if (!otp || otp.length < 6) {
    showToast('Please enter the 6-digit verification code.', 'warning');
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Verifying...</span>';
    }

    const res = await callBackendApi('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingSignupEmail, otp })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Verification failed. Code may be incorrect or expired.');
    }

    currentUser = data.user;
    localStorage.setItem('xyz_user_session', JSON.stringify(currentUser));
    if (data.sessionToken) localStorage.setItem('xyz_session_token', data.sessionToken);

    if (Array.isArray(data.savedLeads)) {
      userSavedLeads = data.savedLeads;
      savedLeadIds = new Set(userSavedLeads.map(l => l.id));
      localStorage.setItem('xyz_user_saved_leads', JSON.stringify(userSavedLeads));
    }

    updateAuthUi();
    renderTable();
    showToast('🎉 Account verified! Welcome to XYZ Lead Intelligence.', 'success');

    const modal = document.getElementById('auth-dialog');
    if (modal && typeof modal.close === 'function') modal.close();
  } catch (err) {
    console.error('[Verify OTP Error]', err);
    showToast(err.message, 'warning');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Verify & Activate Account</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>';
    }
  }
}

async function handleForgotSubmit(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('forgot-email');
  const btn = document.getElementById('btn-submit-forgot');
  const email = (emailInput?.value || '').trim();

  if (!email) {
    showToast('Please enter your registered email.', 'warning');
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Sending code...</span>';
    }

    const res = await callBackendApi('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to send reset code.');
    }

    pendingResetEmail = email;

    // Switch to Reset Password view
    switchAuthView('auth-view-reset-password');
    const label = document.getElementById('reset-target-email-label');
    if (label) label.textContent = email;

    const chip = document.getElementById('reset-dev-helper-chip');
    if (chip && data.devOtp) {
      chip.style.display = 'block';
      chip.innerHTML = `⚡ <strong>Reset OTP:</strong> <span style="letter-spacing: 2px; font-family: monospace;">${data.devOtp}</span> &nbsp;—&nbsp; Click to auto-fill`;
      chip.onclick = () => {
        const otpInput = document.getElementById('reset-otp-input');
        if (otpInput) otpInput.value = data.devOtp;
      };
    } else if (chip) {
      chip.style.display = 'none';
    }

    const otpInput = document.getElementById('reset-otp-input');
    if (otpInput) {
      otpInput.value = '';
      otpInput.focus();
    }

    if (data.devOtp) {
      showToast(`Reset code: ${data.devOtp} (Click helper chip to auto-fill)`, 'info');
    } else {
      showToast(`Password reset code sent to ${email}`, 'info');
    }
  } catch (err) {
    console.error('[Forgot Password Error]', err);
    showToast(err.message, 'warning');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Send Reset OTP Code</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>';
    }
  }
}

async function handleResetPasswordSubmit(e) {
  if (e) e.preventDefault();
  const otpInput = document.getElementById('reset-otp-input');
  const pwInput = document.getElementById('reset-new-password');
  const btn = document.getElementById('btn-submit-reset-password');

  const otp = (otpInput?.value || '').trim();
  const newPassword = (pwInput?.value || '').trim();

  if (!otp || !newPassword) {
    showToast('Please enter both the OTP code and your new password.', 'warning');
    return;
  }
  if (newPassword.length < 6) {
    showToast('New password must be at least 6 characters long.', 'warning');
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Updating password...</span>';
    }

    const res = await callBackendApi('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingResetEmail, otp, newPassword })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Password reset failed.');
    }

    currentUser = data.user;
    localStorage.setItem('xyz_user_session', JSON.stringify(currentUser));
    if (data.sessionToken) localStorage.setItem('xyz_session_token', data.sessionToken);

    if (Array.isArray(data.savedLeads)) {
      userSavedLeads = data.savedLeads;
      savedLeadIds = new Set(userSavedLeads.map(l => l.id));
      localStorage.setItem('xyz_user_saved_leads', JSON.stringify(userSavedLeads));
    }

    updateAuthUi();
    renderTable();
    showToast('✓ Password updated successfully! You are now signed in.', 'success');

    const modal = document.getElementById('auth-dialog');
    if (modal && typeof modal.close === 'function') modal.close();
  } catch (err) {
    console.error('[Reset Password Error]', err);
    showToast(err.message, 'warning');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Update Password & Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>';
    }
  }
}

function initEmailOtpAuth() {
  // Password Show / Hide toggles
  document.querySelectorAll('.auth-pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🔒';
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
        }
      }
    });
  });

  // Tab buttons
  const tabSignin = document.getElementById('tab-btn-signin');
  const tabSignup = document.getElementById('tab-btn-signup');
  if (tabSignin) tabSignin.addEventListener('click', () => switchAuthView('auth-view-signin'));
  if (tabSignup) tabSignup.addEventListener('click', () => switchAuthView('auth-view-signup'));

  // Navigation Links between views
  const linkGotoSignup = document.getElementById('link-goto-signup');
  if (linkGotoSignup) linkGotoSignup.addEventListener('click', () => switchAuthView('auth-view-signup'));

  const linkGotoSignin = document.getElementById('link-goto-signin');
  if (linkGotoSignin) linkGotoSignin.addEventListener('click', () => switchAuthView('auth-view-signin'));

  const btnGotoForgot = document.getElementById('btn-goto-forgot');
  if (btnGotoForgot) btnGotoForgot.addEventListener('click', () => switchAuthView('auth-view-forgot'));

  const linkForgotToSignin = document.getElementById('link-forgot-to-signin');
  if (linkForgotToSignin) linkForgotToSignin.addEventListener('click', () => switchAuthView('auth-view-signin'));

  const linkResetToSignin = document.getElementById('link-reset-to-signin');
  if (linkResetToSignin) linkResetToSignin.addEventListener('click', () => switchAuthView('auth-view-signin'));

  const btnBackToSignup = document.getElementById('btn-back-to-signup');
  if (btnBackToSignup) btnBackToSignup.addEventListener('click', () => switchAuthView('auth-view-signup'));

  // Form Submissions
  const formSignin = document.getElementById('form-signin');
  if (formSignin) formSignin.addEventListener('submit', handleSignInSubmit);

  const formSignup = document.getElementById('form-signup');
  if (formSignup) formSignup.addEventListener('submit', handleSignUpSubmit);

  const formVerifyOtp = document.getElementById('form-verify-otp');
  if (formVerifyOtp) formVerifyOtp.addEventListener('submit', handleVerifyOtpSubmit);

  const formForgot = document.getElementById('form-forgot');
  if (formForgot) formForgot.addEventListener('submit', handleForgotSubmit);

  const formResetPassword = document.getElementById('form-reset-password');
  if (formResetPassword) formResetPassword.addEventListener('submit', handleResetPasswordSubmit);

  // Resend OTP buttons
  const btnResendSignupOtp = document.getElementById('btn-resend-signup-otp');
  if (btnResendSignupOtp) {
    btnResendSignupOtp.addEventListener('click', async () => {
      if (!pendingSignupEmail) return;
      showToast('Requesting fresh verification code...', 'info');
      try {
        const res = await callBackendApi('/api/auth/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingSignupEmail })
        });
        const data = await res.json();
        if (data.success) {
          startOtpCountdown('otp-timer-count', 600);
          const chip = document.getElementById('otp-dev-helper-chip');
          if (chip && data.devOtp) {
            chip.style.display = 'block';
            chip.innerHTML = `⚡ <strong>New Code:</strong> <span style="letter-spacing: 2px; font-family: monospace;">${data.devOtp}</span> &nbsp;—&nbsp; Click to auto-fill`;
          }
          showToast('Fresh code sent to your email!', 'success');
        } else {
          showToast(data.error || 'Failed to resend code', 'warning');
        }
      } catch (e) {
        showToast(e.message, 'warning');
      }
    });
  }

  const btnResendResetOtp = document.getElementById('btn-resend-reset-otp');
  if (btnResendResetOtp) {
    btnResendResetOtp.addEventListener('click', async () => {
      if (!pendingResetEmail) return;
      showToast('Requesting fresh reset code...', 'info');
      try {
        const res = await callBackendApi('/api/auth/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingResetEmail })
        });
        const data = await res.json();
        if (data.success) {
          const chip = document.getElementById('reset-dev-helper-chip');
          if (chip && data.devOtp) {
            chip.style.display = 'block';
            chip.innerHTML = `⚡ <strong>New Reset Code:</strong> <span style="letter-spacing: 2px; font-family: monospace;">${data.devOtp}</span> &nbsp;—&nbsp; Click to auto-fill`;
          }
          showToast('Fresh reset code sent to your email!', 'success');
        } else {
          showToast(data.error || 'Failed to resend reset code', 'warning');
        }
      } catch (e) {
        showToast(e.message, 'warning');
      }
    });
  }

  // Header Sign In button
  const headerSignInBtn = document.getElementById('header-signin-btn');
  if (headerSignInBtn) {
    headerSignInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchAuthView('auth-view-signin');
      const modal = document.getElementById('auth-dialog');
      if (modal && typeof modal.showModal === 'function') modal.showModal();
    });
  }

  // Header Sign Out button
  const signOutBtn = document.getElementById('header-signout-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      signOut();
    });
  }

  // Header Saved Leads Pill click
  const savedPill = document.getElementById('header-saved-pill');
  if (savedPill) {
    savedPill.addEventListener('click', (e) => {
      e.preventDefault();
      activeFilter = 'saved';
      document.querySelectorAll('.console-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === 'saved');
      });
      renderTable();
      const consoleEl = document.getElementById('console');
      if (consoleEl) consoleEl.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Tab Saved button click in console
  const tabSavedBtn = document.getElementById('tab-saved-btn');
  if (tabSavedBtn) {
    tabSavedBtn.addEventListener('click', () => {
      activeFilter = 'saved';
      document.querySelectorAll('.console-tab').forEach(t => t.classList.remove('active'));
      tabSavedBtn.classList.add('active');
      renderTable();
    });
  }
}
