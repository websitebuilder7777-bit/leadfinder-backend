import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load keys from .env or .env.txt if present
function loadEnv() {
  for (const file of ['.env', '.env.txt']) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = (match[2] || '').trim();
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

// ====================================================
// PERSISTENT USER DATA STORE
// ====================================================
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function initDataStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify({}), 'utf-8');
    }
  } catch (err) {
    console.warn('[DataStore Init Error]', err.message);
  }
}
initDataStore();

function getUsers() {
  try {
    initDataStore();
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.warn('[DataStore Read Error]', err.message);
    return {};
  }
}

function saveUsers(users) {
  try {
    initDataStore();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DataStore Write Error]', err.message);
  }
}

// User Session Cryptographic Signatures
const SESSION_SECRET = process.env.SESSION_SECRET || 'xyz_secret_lead_vault_2026';

function generateSessionToken(userId) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(String(userId)).digest('hex');
}

function verifySession(userId, token) {
  if (!userId || !token) return false;
  try {
    const expected = generateSessionToken(userId);
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch (e) {
    return false;
  }
}

// ====================================================
// PASSWORD HASHING & OTP AUTHENTICATION SYSTEM
// ====================================================
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  try {
    const [salt, originalHash] = stored.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
  } catch (e) {
    return false;
  }
}

// In-memory OTP store: email -> { otp, name, hashedPassword, type, expiresAt, userId }
const otpStore = new Map();

// SMTP / Mail Gateway configuration
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || (SMTP_USER ? `"XYZ Intelligence" <${SMTP_USER}>` : '"XYZ Intelligence" <noreply@leadfinder.io>');

let mailTransporter = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  try {
    mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    console.log('[Email Gateway] SMTP Transporter active for:', SMTP_USER);
  } catch (err) {
    console.warn('[Email Gateway] Failed to configure SMTP:', err.message);
  }
} else {
  console.log('[Email Gateway] SMTP credentials not set. OTP codes will be logged and returned for instant verification.');
}

async function sendOtpEmail(toEmail, otpCode, type = 'signup') {
  const isReset = type === 'forgot_password';
  const subject = isReset 
    ? `🔐 ${otpCode} is your XYZ password reset code` 
    : `🚀 ${otpCode} is your XYZ account verification code`;

  console.log(`\n======================================================`);
  console.log(`[EMAIL DISPATCH] To: ${toEmail} | Type: ${type} | OTP CODE: ${otpCode}`);
  console.log(`======================================================\n`);

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: EMAIL_FROM,
        to: toEmail,
        subject: subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 20px;">
              XYZ <span style="color: #4338ca;">Lead Intelligence</span>
            </div>
            <h2 style="font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 12px;">
              ${isReset ? 'Reset Your Password' : 'Verify Your Email Address'}
            </h2>
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px;">
              ${isReset 
                ? 'We received a request to reset your password. Use the verification code below to authorize your password change:' 
                : 'Thank you for registering with XYZ Lead Intelligence! Enter this verification code to activate your account and start discovering high-converting B2B leads:'}
            </p>
            <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px; border: 1px dashed #cbd5e1;">
              <span style="font-family: monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #312e81;">${otpCode}</span>
              <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for 10 minutes</div>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0;">
              If you did not make this request, you can safely ignore this email.
            </p>
          </div>
        `
      });
      console.log('[Email Gateway] Message sent successfully:', info.messageId);
      return { success: true, delivered: true };
    } catch (sendErr) {
      console.error('[Email Gateway Error]', sendErr.message);
      return { success: false, delivered: false, error: sendErr.message };
    }
  }

  return { success: true, delivered: false, note: 'dev_mock' };
}

// MIME type map for static serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Fallback priority for Gemini models
const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite'
];

/**
 * Call Gemini API with automatic fallback across high-performance models
 */
async function callGemini(prompt, responseJson = true) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server environment.');
  }

  let lastError = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      
      const payload = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 8192
        }
      };

      if (responseJson) {
        payload.generationConfig.responseMimeType = 'application/json';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(`Model ${model} returned ${res.status}: ${errBody.error?.message || res.statusText}`);
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error(`Model ${model} returned empty response.`);
      }

      return rawText;
    } catch (err) {
      console.warn(`[Gemini Engine] ${model} attempt failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini model fallbacks exhausted.');
}

/**
 * STEP 1: Gemini Query Planner & Intent Decomposer
 */
async function planQueryWithGemini(rawPrompt, fallbackNiche, fallbackCity, fallbackFilter) {
  const userQuery = rawPrompt || `${fallbackNiche || 'Cosmetic Dentists'} in ${fallbackCity || 'Austin, TX'}`;
  console.log(`[Pipeline Step 1] Deconstructing user intent for: "${userQuery}"...`);

  const prompt = `
You are an expert Lead Generation Search Strategist.
A user requested leads with this query: "${userQuery}"

Deconstruct this into an exact Google Maps extraction plan:
1. targetNiche: Clean industry or business type (e.g. "Clinic", "Dental Clinic", "Ayurvedic Doctor", "Roofing Contractor", "Newly Opened Restaurant")
2. targetLocation: Geographic location. If user said "near me" or "in india", specify a vibrant Indian commercial hub (e.g. "Bangalore, India", "Delhi, India", "Mumbai, India"). If US/UK specified, keep that exact city.
3. mapsQueries: Array of 1 to 2 precise, natural search queries to execute on Google Maps (e.g. ["clinics in Indiranagar Bangalore", "dental clinics in Indiranagar Bangalore"])
4. requiredGaps: Array of digital gaps requested by user (e.g. ["no_website", "unclaimed_gmb", "newly_opened", "low_rating"])
5. currency: Currency symbol for revenue leakage calculation ("₹" for India, "$" for USA, "£" for UK, "€" for Europe)
6. averageTicketHint: Typical transaction or lifetime value for this niche in local currency (e.g. "₹2,500" or "$4,500")

Return ONLY valid JSON matching this schema. No markdown formatting.
`;

  try {
    const raw = await callGemini(prompt, true);
    const parsed = JSON.parse(raw);
    return {
      targetNiche: parsed.targetNiche || fallbackNiche || 'Local Business',
      targetLocation: parsed.targetLocation || fallbackCity || 'Bangalore, India',
      mapsQueries: Array.isArray(parsed.mapsQueries) && parsed.mapsQueries.length > 0 ? parsed.mapsQueries : [`${parsed.targetNiche || 'businesses'} in ${parsed.targetLocation || 'Bangalore'}`],
      requiredGaps: parsed.requiredGaps || [fallbackFilter || 'all'],
      currency: parsed.currency || (parsed.targetLocation?.toLowerCase().includes('india') ? '₹' : '$'),
      averageTicketHint: parsed.averageTicketHint || (parsed.targetLocation?.toLowerCase().includes('india') ? '₹3,000' : '$3,500')
    };
  } catch (e) {
    console.warn('[Query Plan Fallback]', e.message);
    const isIndia = (userQuery.toLowerCase().includes('india') || userQuery.toLowerCase().includes('delhi') || userQuery.toLowerCase().includes('bangalore') || userQuery.toLowerCase().includes('mumbai'));
    return {
      targetNiche: fallbackNiche || 'Clinics & Healthcare',
      targetLocation: fallbackCity || (isIndia ? 'Bangalore, India' : 'Austin, TX'),
      mapsQueries: [userQuery],
      requiredGaps: [fallbackFilter || 'no_website'],
      currency: isIndia ? '₹' : '$',
      averageTicketHint: isIndia ? '₹2,500' : '$3,500'
    };
  }
}

/**
 * STEP 2A: Google Places API (New) Fast Extractor
 */
async function extractGooglePlacesApi(searchQuery, maxCount = 6, filter = 'all') {
  if (!GOOGLE_MAPS_API_KEY) return [];
  console.log(`[Pipeline Step 2A] Querying Google Places API (New) for: "${searchQuery}"...`);

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus'
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        pageSize: Math.min(maxCount * 2, 20)
      })
    });

    if (!res.ok) {
      console.warn(`[Places API New] HTTP ${res.status}: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    if (!data.places || !Array.isArray(data.places)) return [];

    let places = data.places.map(p => ({
      name: p.displayName?.text || 'Local Business',
      mapsUrl: p.googleMapsUri || '',
      hasWebsite: Boolean(p.websiteUri),
      websiteUrl: p.websiteUri || null,
      rating: p.rating || 4.7,
      reviews: p.userRatingCount || 24,
      phone: p.nationalPhoneNumber || '',
      address: p.formattedAddress || '',
      rawText: `${p.displayName?.text} | ${p.formattedAddress} | ${p.websiteUri ? 'Has Website: ' + p.websiteUri : 'No Website'}`
    }));

    if (filter === 'no_website') {
      places.sort((a, b) => (a.hasWebsite === b.hasWebsite ? 0 : a.hasWebsite ? 1 : -1));
    }

    console.log(`[Pipeline Step 2A] Successfully extracted ${places.length} live places via Google Places API (New).`);
    return places.slice(0, maxCount);
  } catch (err) {
    console.warn('[Places API New Error]', err.message);
    return [];
  }
}

/**
 * STEP 2B: Playwright Live Google Maps Headless Extractor
 */
async function extractGoogleMapsWithPlaywright(searchQuery, maxCount = 6, filter = 'all') {
  console.log(`[Pipeline Step 2] Launching Playwright to extract live Google Maps for: "${searchQuery}"...`);

  let browser = null;
  const isWindows = process.platform === 'win32';

  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ];

  try {
    if (isWindows) {
      // Local Windows machine: use local Chrome
      browser = await chromium.launch({
        headless: true,
        channel: 'chrome',
        args: launchArgs
      });
    } else {
      // Cloud container (Render / Linux): use installed Chromium
      browser = await chromium.launch({
        headless: true,
        args: launchArgs
      });
    }
  } catch (launchErr) {
    console.warn('[Playwright] Primary launch failed, attempting fallback:', launchErr.message);
    try {
      browser = await chromium.launch({
        headless: true,
        args: launchArgs
      });
    } catch (fallbackErr) {
      console.warn('[Playwright] Headless browser unavailable on host:', fallbackErr.message);
      return [];
    }
  }

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
    await page.goto(mapsUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2500);

    const places = await page.evaluate(({ limit, requiredFilter }) => {
      const results = [];
      const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
      const seen = new Set();

      for (const a of links) {
        const name = a.getAttribute('aria-label') || a.innerText.trim();
        if (!name || seen.has(name) || name.includes('Directions') || name.includes('Website')) continue;
        seen.add(name);

        const card = a.closest('div[jsaction*="mouseover"]') || a.parentElement;
        const text = card ? card.innerText : '';
        
        const websiteLink = card ? card.querySelector('a[href*="http"]:not([href*="google.com"])') : null;
        const hasWebsite = Boolean(websiteLink) || text.includes('Website');

        // Filter optimization: if user specifically wants no_website, prioritize non-website listings
        const ratingMatch = text.match(/([1-5]\.[0-9])/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.6;

        const reviewMatch = text.match(/\(([0-9,]+)\)/);
        const reviews = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, ''), 10) : 15;

        // Extract phone number pattern
        const phoneMatch = text.match(/(\+?[0-9]{2,4}[-\s]?[0-9]{3,5}[-\s]?[0-9]{4,6}|[0-9]{10,11})/);
        const phone = phoneMatch ? phoneMatch[0] : '';

        // Extract address / street line
        const lines = text.split('\n').filter(Boolean);
        const addressLine = lines.find(l => 
          l.includes('Rd') || l.includes('Street') || l.includes('Road') || 
          l.includes('Nagar') || l.includes('Sector') || l.includes('Ave') || 
          l.includes('Blvd') || l.includes('Floor') || l.includes('Marg') || l.includes('Layout')
        ) || lines[2] || lines[1] || '';

        results.push({
          name,
          mapsUrl: a.href,
          hasWebsite,
          websiteUrl: websiteLink ? websiteLink.href : null,
          rating,
          reviews,
          phone,
          address: addressLine,
          rawText: lines.slice(0, 4).join(' | ')
        });

        if (results.length >= limit * 2) break;
      }

      // Sort: if user requested missing website, put hasWebsite=false at top
      if (requiredFilter === 'no_website') {
        results.sort((x, y) => (x.hasWebsite === y.hasWebsite ? 0 : x.hasWebsite ? 1 : -1));
      }

      return results.slice(0, limit);
    }, { limit: maxCount, requiredFilter: filter });

    await browser.close();
    console.log(`[Pipeline Step 2] Successfully extracted ${places.length} live places from Google Maps.`);
    return places;
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('[Pipeline Step 2 Error]', err.message);
    return [];
  }
}

/**
 * STEP 3: Gemini Structured Enrichment, Financial Leakage & Consultative Outreach Kit
 */
async function enrichAndAuditWithGemini(plan, rawPlaces, userQuery) {
  console.log(`[Pipeline Step 3] Gemini auditing ${rawPlaces.length} live extracted records...`);

  const prompt = `
You are an enterprise B2B Lead Intelligence Diagnostic Engine for marketing agencies, web developers, and growth consultants.

User Query: "${userQuery}"
Strategy Plan: ${JSON.stringify(plan)}
Raw Extracted Google Maps Listings (Extracted live via Playwright):
${JSON.stringify(rawPlaces, null, 2)}

TASK:
Convert these live business listings into a complete, structured B2B lead generation audit.
If the raw list is empty or has fewer than 4 items, supplement with authentic, realistic local businesses in "${plan.targetLocation}" for "${plan.targetNiche}".

STRICT RULES:
1. Keep the EXACT business names, phone numbers, addresses, ratings, and review counts from the scraped data.
2. For businesses where hasWebsite is false or missing, tag gapType as "no_website" and gapLabel as "Missing Website".
3. Calculate estimated revenue loss using the currency "${plan.currency}".
   - For India (₹): e.g. "₹5,40,000 / yr" (monthly: "₹45,000 / mo")
   - For US/Global ($): e.g. "$72,000 / yr" (monthly: "$6,000 / mo")
4. Assign an opportunity score from 88 to 99.
5. Create a 3-part consultative cold outreach kit for each account:
   - emailPitch: High-converting, non-spam cold email (Subject line + 3 short paragraphs + soft CTA) highlighting their exact Google rating, review count, and missing digital door.
   - phoneScript: 30-second conversational phone script for an agency caller.
   - linkedinDm: A casual, high-reply DM for LinkedIn, Instagram, or WhatsApp.
6. Technical diagnostics:
   - websiteStatus: e.g. "No Domain Linked" or "Active but Missing Online Booking"
   - gmbStatus: e.g. "Active Google Listing" or "Unclaimed Profile Flagged"
   - sslStatus: e.g. "None (No Website)" or "Active"
   - bookingStatus: e.g. "Phone/Walk-in Only" or "Missing Lead Capture"

Return ONLY a valid JSON array of account objects matching this exact schema:
[
  {
    "id": "lead-1",
    "name": "Exact Business Name",
    "category": "${plan.targetNiche}",
    "city": "${plan.targetLocation}",
    "address": "Street Address",
    "phone": "Phone Number",
    "rating": 4.8,
    "reviews": 124,
    "gapType": "no_website",
    "gapLabel": "Missing Website",
    "score": 96,
    "estLostRevenue": "${plan.currency}8,50,000 / yr",
    "monthlyLoss": "${plan.currency}70,800 / mo",
    "avgTicket": "${plan.averageTicketHint}",
    "missedLeadsCount": "25–35 missed clients/mo",
    "diagnostics": {
      "websiteStatus": "No Website Listed on Google Maps",
      "gmbStatus": "Active Map Listing",
      "sslStatus": "None",
      "bookingStatus": "Phone Only (No Digital Intake)"
    },
    "pitchHook": "Strong reputation on Google Maps but zero digital booking front-door.",
    "emailPitch": "Subject: ...\\n\\nHi Dr. / Team at ...,\\n\\n...",
    "phoneScript": "Hi, is this the office manager at ...? My name is ...",
    "linkedinDm": "Hi! Stumbled across your listing on Google Maps..."
  }
]
`;

  const aiResponseText = await callGemini(prompt, true);
  let leads = [];

  try {
    leads = JSON.parse(aiResponseText);
    if (!Array.isArray(leads) && leads.leads && Array.isArray(leads.leads)) {
      leads = leads.leads;
    }
  } catch (parseErr) {
    console.error('[Enrichment Parse Error]:', parseErr.message, 'Raw:', aiResponseText.slice(0, 200));
    throw new Error('Failed to parse AI lead intelligence payload.');
  }

  return leads;
}

/**
 * Helper to parse JSON body from incoming request
 */
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response helper
 */
function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(payload);
}

// Create HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // ----------------------------------------------------
  // API ROUTE: Health & Config
  // ----------------------------------------------------
  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'active',
      engine: 'XYZ Enterprise AI + Google Maps Pipeline',
      playwrightActive: true,
      placesApiConfigured: Boolean(GOOGLE_MAPS_API_KEY),
      geminiKeyConfigured: Boolean(GEMINI_API_KEY),
      googleOAuthClientConfigured: Boolean(GOOGLE_CLIENT_ID)
    });
  }

  if (pathname === '/api/config' && req.method === 'GET') {
    return sendJson(res, 200, {
      googleClientId: GOOGLE_CLIENT_ID
    });
  }

  // ----------------------------------------------------
  // API ROUTE: Unified AI Lead Pipeline
  // ----------------------------------------------------
  if ((pathname === '/api/leads/ai-pipeline' || pathname === '/api/leads/scan') && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const userPrompt = (body.prompt || '').trim();
      const niche = (body.niche || '').trim();
      const city = (body.city || '').trim();
      const filter = (body.filter || 'all').trim();
      const count = Math.min(Math.max(parseInt(body.count) || 6, 3), 10);

      console.log(`\n======================================================`);
      console.log(`[Pipeline] New Lead Request Received: "${userPrompt || `${niche} in ${city}`}"`);
      console.log(`======================================================`);

      // 1. Gemini Intent Plan
      const plan = await planQueryWithGemini(userPrompt, niche, city, filter);
      console.log('[Pipeline] Search Strategy:', JSON.stringify(plan));

      // 2. Dual-Engine Extraction (Google Places API New + Playwright Scraper)
      const searchQuery = plan.mapsQueries[0] || `${plan.targetNiche} in ${plan.targetLocation}`;
      let rawPlaces = [];
      let sourceEngine = 'playwright_live_google_maps';

      if (GOOGLE_MAPS_API_KEY) {
        rawPlaces = await extractGooglePlacesApi(searchQuery, count, filter);
        if (rawPlaces.length > 0) {
          sourceEngine = 'google_places_api_new';
        }
      }

      if (rawPlaces.length === 0) {
        rawPlaces = await extractGoogleMapsWithPlaywright(searchQuery, count, filter);
        if (rawPlaces.length > 0) {
          sourceEngine = 'playwright_live_google_maps';
        }
      }

      // 3. Gemini Audit & Structuring
      const leads = await enrichAndAuditWithGemini(plan, rawPlaces, userPrompt || searchQuery);

      return sendJson(res, 200, {
        success: true,
        count: leads.length,
        dataSource: rawPlaces.length > 0 ? sourceEngine : 'ai_synthesis',
        plan,
        scrapedCount: rawPlaces.length,
        leads
      });

    } catch (err) {
      console.error('[Pipeline Error]', err);
      return sendJson(res, 500, {
        success: false,
        error: err.message || 'Internal lead generation error'
      });
    }
  }

  // ----------------------------------------------------
  // API ROUTE: Custom Pitch Regenerator
  // ----------------------------------------------------
  if (pathname === '/api/leads/custom-pitch' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const { leadName, category, city, gapLabel, angle } = body;

      const prompt = `
You are an elite B2B consultative copywriter.
Prospect: "${leadName}"
Industry: "${category}" in "${city}"
Vulnerability: "${gapLabel}"
Strategic Pitch Angle Requested: "${angle || 'Web Redesign & Mobile Intake'}"

Write a tailored, high-converting outreach kit:
1. email: Cold email with subject line, 3 short conversational paragraphs, and a low-friction soft CTA.
2. phone: 30-second conversational phone script.
3. dm: 4-sentence LinkedIn/Instagram DM.

Return ONLY a JSON object with keys: "email", "phone", "dm". No markdown code blocks.
`;

      const raw = await callGemini(prompt, true);
      const parsed = JSON.parse(raw);
      return sendJson(res, 200, { success: true, ...parsed });
    } catch (err) {
      console.error('[Custom Pitch Error]', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ----------------------------------------------------
  // API ROUTE: Send OTP for Email Signup
  // ----------------------------------------------------
  if (pathname === '/api/auth/send-otp' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const password = (body.password || '').trim();
      const name = (body.name || '').trim();

      if (!email || !email.includes('@') || !email.includes('.')) {
        return sendJson(res, 400, { success: false, error: 'Please enter a valid email address.' });
      }
      if (!password || password.length < 6) {
        return sendJson(res, 400, { success: false, error: 'Password must be at least 6 characters long.' });
      }

      const users = getUsers();
      const existing = Object.values(users).find(u => u.email && u.email.toLowerCase() === email);
      if (existing && existing.passwordHash) {
        return sendJson(res, 400, { 
          success: false, 
          error: 'An account with this email already exists. Please sign in or use Forgot Password.' 
        });
      }

      // Generate 6-digit numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(email, {
        otp,
        name: name || email.split('@')[0],
        hashedPassword: hashPassword(password),
        type: 'signup',
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      await sendOtpEmail(email, otp, 'signup');

      return sendJson(res, 200, {
        success: true,
        message: `Verification code sent to ${email}`,
        email,
        devOtp: mailTransporter ? undefined : otp
      });
    } catch (err) {
      console.error('[Auth Send-OTP Error]', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ----------------------------------------------------
  // API ROUTE: Verify OTP & Activate New Account
  // ----------------------------------------------------
  if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const otp = (body.otp || '').trim();

      if (!email || !otp) {
        return sendJson(res, 400, { success: false, error: 'Email and 6-digit verification code are required.' });
      }

      const pending = otpStore.get(email);
      if (!pending || pending.type !== 'signup') {
        return sendJson(res, 400, { 
          success: false, 
          error: 'No pending registration found for this email. Please sign up again.' 
        });
      }

      if (Date.now() > pending.expiresAt) {
        otpStore.delete(email);
        return sendJson(res, 400, { 
          success: false, 
          error: 'Verification code has expired. Please request a new code.' 
        });
      }

      if (pending.otp !== otp) {
        return sendJson(res, 400, { 
          success: false, 
          error: 'Incorrect verification code. Please check your email and try again.' 
        });
      }

      // Create permanent verified user
      const users = getUsers();
      const userId = 'usr_' + crypto.createHash('sha256').update(email).digest('hex').slice(0, 16);
      
      const newUser = {
        id: userId,
        email: email,
        name: pending.name || email.split('@')[0],
        passwordHash: pending.hashedPassword,
        isVerified: true,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pending.name || email)}`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        authProvider: 'email_password',
        savedLeads: [],
        history: []
      };

      users[userId] = newUser;
      saveUsers(users);
      otpStore.delete(email);

      const token = generateSessionToken(userId);
      console.log(`[Auth] User registered and verified: ${email} (${userId})`);

      return sendJson(res, 200, {
        success: true,
        message: 'Account successfully verified! Welcome aboard.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          picture: newUser.picture,
          sessionToken: token
        },
        sessionToken: token,
        savedLeads: [],
        history: []
      });
    } catch (err) {
      console.error('[Auth Verify-OTP Error]', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ----------------------------------------------------
  // API ROUTE: Email & Password Login
  // ----------------------------------------------------
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const password = (body.password || '').trim();

      if (!email || !password) {
        return sendJson(res, 400, { success: false, error: 'Email and password are required.' });
      }

      const users = getUsers();
      const user = Object.values(users).find(u => u.email && u.email.toLowerCase() === email);

      if (!user) {
        return sendJson(res, 404, { 
          success: false, 
          error: 'No account found with this email. Please create an account first.' 
        });
      }

      if (!user.passwordHash) {
        return sendJson(res, 400, { 
          success: false, 
          error: 'This account was registered without a password. Please use Forgot Password to set one.' 
        });
      }

      if (!verifyPassword(password, user.passwordHash)) {
        return sendJson(res, 401, { 
          success: false, 
          error: 'Incorrect password. Try again or click Forgot Password.' 
        });
      }

      user.lastLoginAt = new Date().toISOString();
      saveUsers(users);

      const token = generateSessionToken(user.id);
      console.log(`[Auth] User logged in: ${user.email} (${user.id})`);

      return sendJson(res, 200, {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          sessionToken: token
        },
        sessionToken: token,
        savedLeads: user.savedLeads || [],
        history: user.history || []
      });
    } catch (err) {
      console.error('[Auth Login Error]', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ----------------------------------------------------
  // API ROUTE: Forgot Password Request (Sends OTP)
  // ----------------------------------------------------
  if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const email = (body.email || '').trim().toLowerCase();

      if (!email) {
        return sendJson(res, 400, { success: false, error: 'Email address is required.' });
      }

      const users = getUsers();
      const user = Object.values(users).find(u => u.email && u.email.toLowerCase() === email);

      if (!user) {
        return sendJson(res, 404, { 
          success: false, 
          error: 'No registered account found with this email address.' 
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(email, {
        otp,
        userId: user.id,
        type: 'forgot_password',
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      await sendOtpEmail(email, otp, 'forgot_password');

      return sendJson(res, 200, {
        success: true,
        message: `Password reset verification code sent to ${email}`,
        email,
        devOtp: mailTransporter ? undefined : otp
      });
    } catch (err) {
      console.error('[Auth Forgot-Password Error]', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ----------------------------------------------------
  // API ROUTE: Reset Password with Verified OTP
  // ----------------------------------------------------
  if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const otp = (body.otp || '').trim();
      const newPassword = (body.newPassword || '').trim();

      if (!email || !otp || !newPassword) {
        return sendJson(res, 400, { success: false, error: 'Email, verification code, and new password are required.' });
      }

      if (newPassword.length < 6) {
        return sendJson(res, 400, { success: false, error: 'New password must be at least 6 characters long.' });
      }

      const pending = otpStore.get(email);
      if (!pending || pending.type !== 'forgot_password') {
        return sendJson(res, 400, { 
          success: false, 
          error: 'No active password reset request found. Please request a new code.' 
        });
      }

      if (Date.now() > pending.expiresAt) {
        otpStore.delete(email);
        return sendJson(res, 400, { 
          success: false, 
          error: 'Verification code has expired. Please request a new code.' 
        });
      }

      if (pending.otp !== otp) {
        return sendJson(res, 400, { 
          success: false, 
          error: 'Incorrect verification code. Please check your email and try again.' 
        });
      }

      const users = getUsers();
      const user = users[pending.userId] || Object.values(users).find(u => u.email && u.email.toLowerCase() === email);
      if (!user) {
        return sendJson(res, 404, { success: false, error: 'User account not found.' });
      }

      user.passwordHash = hashPassword(newPassword);
      user.lastPasswordReset = new Date().toISOString();
      user.lastLoginAt = new Date().toISOString();
      saveUsers(users);
      otpStore.delete(email);

      const token = generateSessionToken(user.id);
      console.log(`[Auth] Password successfully reset for: ${email}`);

      return sendJson(res, 200, {
        success: true,
        message: 'Password successfully changed! You are now logged in.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          sessionToken: token
        },
        sessionToken: token,
        savedLeads: user.savedLeads || [],
        history: user.history || []
      });
    } catch (err) {
      console.error('[Auth Reset-Password Error]', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ----------------------------------------------------
  // API ROUTE: Resend OTP Code
  // ----------------------------------------------------
  if (pathname === '/api/auth/resend-otp' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const email = (body.email || '').trim().toLowerCase();
      if (!email) return sendJson(res, 400, { success: false, error: 'Email is required.' });

      const pending = otpStore.get(email);
      if (!pending) {
        return sendJson(res, 400, { success: false, error: 'No active verification pending. Please start over.' });
      }

      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      pending.otp = newOtp;
      pending.expiresAt = Date.now() + 10 * 60 * 1000;
      otpStore.set(email, pending);

      await sendOtpEmail(email, newOtp, pending.type);

      return sendJson(res, 200, {
        success: true,
        message: `A fresh verification code was sent to ${email}`,
        devOtp: mailTransporter ? undefined : newOtp
      });
    } catch (err) {
      console.error('[Auth Resend-OTP Error]', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ----------------------------------------------------
  // API ROUTE: Google Auth / User Sync
  // ----------------------------------------------------
  if (pathname === '/api/auth/google' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      let user = null;

      // 1. If Google JWT credential provided from GIS
      if (body.credential) {
        try {
          const parts = body.credential.split('.');
          if (parts.length >= 2) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
            user = {
              id: payload.sub || 'usr_' + Buffer.from(payload.email || '').toString('hex').slice(0, 16),
              email: payload.email,
              name: payload.name || (payload.email ? payload.email.split('@')[0] : 'Google User'),
              picture: payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name || payload.email || 'User')}`,
              authProvider: 'google_gis_oauth'
            };
          }
        } catch (jwtErr) {
          console.warn('[Auth] JWT decode fallback:', jwtErr.message);
        }
      }

      // 2. Direct user object payload (SSO / One-click profile)
      if (!user && body.user) {
        const email = (body.user.email || 'user@agency.com').trim().toLowerCase();
        user = {
          id: body.user.id || 'usr_' + Buffer.from(email).toString('hex').slice(0, 16),
          email: email,
          name: body.user.name || email.split('@')[0],
          picture: body.user.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(body.user.name || email)}`,
          authProvider: 'google_sso'
        };
      }

      if (!user || !user.email) {
        return sendJson(res, 400, { success: false, error: 'Invalid user credentials.' });
      }

      const users = getUsers();
      const existing = users[user.id] || {
        ...user,
        createdAt: new Date().toISOString(),
        savedLeads: [],
        history: []
      };

      existing.lastLoginAt = new Date().toISOString();
      existing.name = user.name || existing.name;
      existing.email = user.email || existing.email;
      existing.picture = user.picture || existing.picture;
      users[user.id] = existing;
      saveUsers(users);

      console.log(`[Auth] User authenticated: ${existing.email} (${existing.id}) | Saved leads: ${(existing.savedLeads || []).length}`);

      const token = generateSessionToken(existing.id);

      return sendJson(res, 200, {
        success: true,
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          picture: existing.picture,
          sessionToken: token
        },
        sessionToken: token,
        savedLeads: existing.savedLeads || [],
        history: existing.history || []
      });
    } catch (err) {
      console.error('[Auth Error]', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ----------------------------------------------------
  // API ROUTE: Get User Data (Saved Leads & Search History)
  // ----------------------------------------------------
  if (pathname === '/api/user/data' && req.method === 'GET') {
    const userId = parsedUrl.searchParams.get('userId');
    if (!userId) return sendJson(res, 400, { success: false, error: 'Missing userId parameter' });
    const users = getUsers();
    const user = users[userId];
    if (!user) return sendJson(res, 404, { success: false, error: 'User not found' });
    return sendJson(res, 200, {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture
      },
      savedLeads: user.savedLeads || [],
      history: user.history || []
    });
  }

  // ----------------------------------------------------
  // API ROUTE: Save / Bookmark Lead
  // ----------------------------------------------------
  if (pathname === '/api/user/save-lead' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const { userId, lead } = body;
      if (!userId || !lead) {
        return sendJson(res, 400, { success: false, error: 'Missing userId or lead payload' });
      }

      const users = getUsers();
      if (!users[userId]) {
        users[userId] = {
          id: userId,
          email: body.email || 'user@agency.com',
          name: body.name || 'User',
          picture: body.picture || `https://api.dicebear.com/7.x/initials/svg?seed=User`,
          savedLeads: [],
          history: [],
          createdAt: new Date().toISOString()
        };
      }

      const user = users[userId];
      user.savedLeads = user.savedLeads || [];

      // Check if already saved
      const existingIdx = user.savedLeads.findIndex(l => l.id === lead.id || l.name === lead.name);
      let action = 'saved';

      if (existingIdx >= 0) {
        // Toggle off
        user.savedLeads.splice(existingIdx, 1);
        action = 'removed';
      } else {
        // Add with timestamp
        const savedItem = { ...lead, savedAt: new Date().toISOString() };
        user.savedLeads.unshift(savedItem);
        action = 'saved';
      }

      saveUsers(users);
      console.log(`[User Storage] Lead "${lead.name}" ${action} for user ${userId}. Total: ${user.savedLeads.length}`);

      return sendJson(res, 200, {
        success: true,
        action,
        savedCount: user.savedLeads.length,
        savedLeads: user.savedLeads
      });
    } catch (err) {
      console.error('[Save Lead Error]', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ----------------------------------------------------
  // API ROUTE: Record Search History
  // ----------------------------------------------------
  if (pathname === '/api/user/record-history' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const { userId, query, count } = body;
      if (userId && query) {
        const users = getUsers();
        if (users[userId]) {
          users[userId].history = users[userId].history || [];
          users[userId].history.unshift({
            query,
            count: count || 0,
            timestamp: new Date().toISOString()
          });
          if (users[userId].history.length > 50) {
            users[userId].history = users[userId].history.slice(0, 50);
          }
          saveUsers(users);
        }
      }
      return sendJson(res, 200, { success: true });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ----------------------------------------------------
  // STATIC FILE SERVING — HARDENED SECURITY WHITELIST
  // ----------------------------------------------------
  const cleanPath = pathname.toLowerCase();

  // 1. Strictly block any access to private data, server source code, or environment files
  if (
    cleanPath.startsWith('/data') ||
    cleanPath.startsWith('/.private_data') ||
    cleanPath.startsWith('/.') ||
    cleanPath.includes('server') ||
    cleanPath.includes('package') ||
    cleanPath.includes('docker') ||
    cleanPath.includes('yaml') ||
    cleanPath.includes('node_modules')
  ) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Access Denied: Protected System Resource' }));
  }

  // 2. Strict Whitelist of allowed public frontend files
  const ALLOWED_PUBLIC_FILES = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/styles.css': 'styles.css',
    '/app.js': 'app.js',
    '/favicon.ico': 'favicon.ico',
    '/robots.txt': 'robots.txt'
  };

  const targetFile = ALLOWED_PUBLIC_FILES[pathname] || 'index.html';
  const filePath = path.join(__dirname, targetFile);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error');
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      });
      res.end(content);
    });
  });
});

// Start listening
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[XYZ Gateway] Running on http://0.0.0.0:${PORT}`);
  console.log(`[XYZ Gateway] Gemini API Key configured: ${Boolean(GEMINI_API_KEY)}`);
  console.log(`[XYZ Gateway] Playwright Web Extractor: Active & Ready`);
});
