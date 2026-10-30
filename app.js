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
let savedLeadIds = new Set();

// Load saved leads from localStorage
try {
  const stored = localStorage.getItem('xyz_saved_lead_ids');
  if (stored) {
    savedLeadIds = new Set(JSON.parse(stored));
  }
} catch (e) {
  console.warn('localStorage read error:', e);
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

  renderTable();
  updateDrawer(activeLead);
  updateSavedCountBadge();
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
      const promptVal = promptInput.value.trim();
      if (!promptVal) return;
      executeAiPipeline({ prompt: promptVal });
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
      executeAiPipeline({ prompt: text });
    });
  });
}

function initScanner() {
  const runBtn = document.getElementById('btn-run-scan');
  const nicheInput = document.getElementById('scanner-niche-input');
  const cityInput = document.getElementById('scanner-city-input');
  const vulnSelect = document.getElementById('scanner-vulnerability-select');

  if (!runBtn) return;

  const triggerScan = async () => {
    const niche = nicheInput.value.trim() || 'Clinics & Healthcare';
    const city = cityInput.value.trim() || 'Delhi, India';
    const filter = vulnSelect.value || 'no_website';

    await executeAiPipeline({ niche, city, filter });
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

  // 2. Save Lead
  const saveBtn = document.getElementById('btn-save-lead');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!activeLead) return;

      if (savedLeadIds.has(activeLead.id)) {
        savedLeadIds.delete(activeLead.id);
      } else {
        savedLeadIds.add(activeLead.id);
      }

      try {
        localStorage.setItem('xyz_saved_lead_ids', JSON.stringify([...savedLeadIds]));
      } catch (e) {}

      updateSaveLeadButtonState();
      updateSavedCountBadge();
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

  const filtered = currentLeads.filter(lead => {
    if (activeFilter === 'all') return true;
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
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
          No accounts matched this filter in the current scan.
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
        <div style="font-weight: 700; color: var(--text-black);">${escapeHtml(lead.name)}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${escapeHtml(lead.category)} · ${escapeHtml(lead.city)}</div>
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
  document.getElementById('inspector-lead-name').textContent = lead.name;
  document.getElementById('inspector-lead-category').textContent = `${lead.category} · ${lead.city}`;
  
  // Contact
  const phoneEl = document.getElementById('inspector-lead-phone');
  if (phoneEl) {
    phoneEl.textContent = lead.phone || 'Phone on File';
    phoneEl.href = `tel:${(lead.phone || '').replace(/[^0-9+]/g, '')}`;
  }
  
  const addrEl = document.getElementById('inspector-lead-address');
  if (addrEl) {
    addrEl.textContent = lead.address || lead.city;
    addrEl.title = lead.address || lead.city;
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

  pitchBox.textContent = getActivePitchText();
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
  if (!currentLeads || currentLeads.length === 0) {
    alert('No leads available to export.');
    return;
  }

  const headers = [
    'Business Name',
    'Category',
    'City',
    'Street Address',
    'Phone',
    'Rating',
    'Reviews',
    'Digital Vulnerability',
    'Opportunity Score',
    'Estimated Lost Revenue',
    'Monthly Revenue Loss',
    'Consultative Cold Pitch'
  ];

  const rows = currentLeads.map(lead => [
    sanitizeCsvField(lead.name),
    sanitizeCsvField(lead.category),
    sanitizeCsvField(lead.city),
    sanitizeCsvField(lead.address || ''),
    sanitizeCsvField(lead.phone || ''),
    lead.rating,
    lead.reviews,
    sanitizeCsvField(lead.gapLabel || lead.gapType),
    lead.score,
    sanitizeCsvField(lead.estLostRevenue || ''),
    sanitizeCsvField(lead.monthlyLoss || ''),
    sanitizeCsvField(lead.emailPitch || lead.pitch || lead.pitchHook || '')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const citySlug = (currentLeads[0]?.city || 'Market').replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `XYZ_Leads_${citySlug}_${timestamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  const modal = document.getElementById('auth-modal');
  const openButtons = document.querySelectorAll('.open-auth-modal');
  const closeButton = document.getElementById('close-auth-modal');

  if (!modal) return;

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
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
