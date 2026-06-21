// create-wireflow.js
// Creates a low-fidelity mobile wireflow for DriveBook student + instructor journeys
// Writes two separate FigJam files via the Figma REST API.
//
// Usage: node scripts/create-wireflow.js
// Requires: FIGMA_TOKEN environment variable (your Personal Access Token)
//
// Set your token: set FIGMA_TOKEN=your_token_here  (Windows CMD)
//                 $env:FIGMA_TOKEN="your_token"    (PowerShell)

const https = require('https');

const TOKEN = process.env.FIGMA_TOKEN;
if (!TOKEN) {
  console.error('\n❌  FIGMA_TOKEN environment variable not set.');
  console.error('   Run: set FIGMA_TOKEN=your_figma_pat_here\n');
  process.exit(1);
}

// ── Figma API helper ─────────────────────────────────────────────────────────

function figmaRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.figma.com',
      path,
      method,
      headers: {
        'X-Figma-Token': TOKEN,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.err || (parsed.status && parsed.status !== 200)) {
            reject(new Error(parsed.err || parsed.message || `HTTP ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`Invalid JSON: ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Layout constants ─────────────────────────────────────────────────────────

const FRAME_W      = 390;   // iPhone 14 width
const FRAME_H      = 844;   // iPhone 14 height
const GAP_X        = 80;    // horizontal gap between frames
const GAP_Y        = 120;   // vertical gap between rows
const COLS         = 6;     // screens per row
const SECTION_PAD  = 60;    // padding inside section frame

// Colours
const C_FRAME_FILL    = { r: 1,    g: 1,    b: 1    }; // white
const C_FRAME_STROKE  = { r: 0.2,  g: 0.2,  b: 0.2  }; // dark grey
const C_NOTCH_FILL    = { r: 0.15, g: 0.15, b: 0.15 }; // near-black notch
const C_TITLE_TEXT    = { r: 0.1,  g: 0.1,  b: 0.1  };
const C_SUB_TEXT      = { r: 0.4,  g: 0.4,  b: 0.4  };
const C_ARROW         = { r: 0.2,  g: 0.2,  b: 0.8  }; // blue arrows
const C_SECTION_STUDENT  = { r: 0.9, g: 0.95, b: 1.0 }; // light blue tint
const C_SECTION_INSTRUCTOR = { r: 0.95, g: 1.0, b: 0.9 }; // light green tint

// ── Screen definitions ───────────────────────────────────────────────────────

// Each screen: { id, label, sublabel, group }
// group = section header key

const STUDENT_SCREENS = [
  // Onboarding
  { id:'S01', label:'S01', sublabel:'Splash', group:'Onboarding' },
  { id:'S02', label:'S02', sublabel:'Welcome carousel', group:'Onboarding' },
  { id:'S03', label:'S03', sublabel:'Sign Up / Log In', group:'Onboarding' },
  { id:'S04', label:'S04', sublabel:'Signup form', group:'Onboarding' },
  { id:'S05', label:'S05', sublabel:'Email verification pending', group:'Onboarding' },
  { id:'S06', label:'S06', sublabel:'Login form', group:'Onboarding' },
  { id:'S07', label:'S07', sublabel:'Forgot password', group:'Onboarding' },
  { id:'S08', label:'S08', sublabel:'Profile setup', group:'Onboarding' },
  // Home
  { id:'S09', label:'S09', sublabel:'Home (logged in)', group:'Home' },
  { id:'S10', label:'S10', sublabel:'Home (guest mode)', group:'Home' },
  // Search
  { id:'S11', label:'S11', sublabel:'Search filters', group:'Search & Discovery' },
  { id:'S12', label:'S12', sublabel:'Search results', group:'Search & Discovery' },
  { id:'S13', label:'S13', sublabel:'Empty results', group:'Search & Discovery' },
  { id:'S14', label:'S14', sublabel:'Instructor profile', group:'Search & Discovery' },
  { id:'S15', label:'S15', sublabel:'Slot picker', group:'Search & Discovery' },
  // Booking
  { id:'S16', label:'S16', sublabel:'Pickup pin map', group:'Booking' },
  { id:'S17', label:'S17', sublabel:'Booking review', group:'Booking' },
  { id:'S18', label:'S18', sublabel:'Payment', group:'Booking' },
  { id:'S19', label:'S19', sublabel:'Instant Booking warning', group:'Booking' },
  { id:'S20', label:'S20', sublabel:'Booking confirmed', group:'Booking' },
  { id:'S21', label:'S21', sublabel:'Booking pending', group:'Booking' },
  { id:'S22', label:'S22', sublabel:'Booking expired', group:'Booking' },
  { id:'S23', label:'S23', sublabel:'Booking declined', group:'Booking' },
  // My Bookings
  { id:'S24', label:'S24', sublabel:'My Bookings', group:'My Bookings' },
  { id:'S25', label:'S25', sublabel:'Booking detail', group:'My Bookings' },
  { id:'S26', label:'S26', sublabel:'Cancellation review', group:'My Bookings' },
  { id:'S27', label:'S27', sublabel:'Cancellation confirmed', group:'My Bookings' },
  { id:'S34', label:'S34', sublabel:'Credits', group:'My Bookings' },
  // Lesson Day
  { id:'S28', label:'S28', sublabel:'Pre-lesson screen', group:'Lesson Day' },
  { id:'S29', label:'S29', sublabel:'Instructor en route', group:'Lesson Day' },
  { id:'S30', label:'S30', sublabel:'Leave now alert', group:'Lesson Day' },
  { id:'S31', label:'S31', sublabel:'Lesson in progress', group:'Lesson Day' },
  // Post-Lesson
  { id:'S32', label:'S32', sublabel:'Rate your lesson', group:'Post-Lesson' },
  { id:'S33', label:'S33', sublabel:'Rating submitted', group:'Post-Lesson' },
  { id:'S35', label:'S35', sublabel:'Dispute form', group:'Post-Lesson' },
  { id:'S36', label:'S36', sublabel:'Dispute submitted', group:'Post-Lesson' },
  // Settings
  { id:'S37', label:'S37', sublabel:'Account settings', group:'Settings & Support' },
  { id:'S38', label:'S38', sublabel:'Edit profile', group:'Settings & Support' },
  { id:'S39', label:'S39', sublabel:'Payment methods', group:'Settings & Support' },
  { id:'S40', label:'S40', sublabel:'Notification preferences', group:'Settings & Support' },
  { id:'S41', label:'S41', sublabel:'Help / Support', group:'Settings & Support' },
  // Error & Edge
  { id:'S42', label:'S42', sublabel:'Error - network', group:'Error & Edge States' },
  { id:'S43', label:'S43', sublabel:'Error - payment failed', group:'Error & Edge States' },
  { id:'S44', label:'S44', sublabel:'Account suspended', group:'Error & Edge States' },
];

const INSTRUCTOR_SCREENS = [
  // Onboarding
  { id:'I01', label:'I01', sublabel:'Splash', group:'Onboarding' },
  { id:'I02', label:'I02', sublabel:'Welcome carousel', group:'Onboarding' },
  { id:'I03', label:'I03', sublabel:'Sign Up / Log In', group:'Onboarding' },
  { id:'I04', label:'I04', sublabel:'Signup form', group:'Onboarding' },
  { id:'I05', label:'I05', sublabel:'Email verification pending', group:'Onboarding' },
  { id:'I06', label:'I06', sublabel:'Login form', group:'Onboarding' },
  { id:'I07', label:'I07', sublabel:'Forgot password', group:'Onboarding' },
  { id:'I08', label:'I08', sublabel:'Onboarding intro', group:'Onboarding' },
  { id:'I09', label:'I09', sublabel:'Profile basics', group:'Onboarding' },
  { id:'I10', label:'I10', sublabel:'Vehicle details', group:'Onboarding' },
  { id:'I11', label:'I11', sublabel:'Service area picker', group:'Onboarding' },
  { id:'I12', label:'I12', sublabel:'Upload MTO cert', group:'Onboarding' },
  { id:'I13', label:'I13', sublabel:'Upload Gov ID', group:'Onboarding' },
  { id:'I14', label:'I14', sublabel:'Upload Insurance', group:'Onboarding' },
  { id:'I15', label:'I15', sublabel:'Onboarding review', group:'Onboarding' },
  { id:'I16', label:'I16', sublabel:'Submission confirmation', group:'Onboarding' },
  { id:'I17', label:'I17', sublabel:'Pending approval', group:'Onboarding' },
  { id:'I18', label:'I18', sublabel:'Approval notification', group:'Onboarding' },
  { id:'I19', label:'I19', sublabel:'Rejection notification', group:'Onboarding' },
  // Home & Availability
  { id:'I20', label:'I20', sublabel:'Home dashboard', group:'Home & Availability' },
  { id:'I21', label:'I21', sublabel:'Availability calendar', group:'Home & Availability' },
  { id:'I22', label:'I22', sublabel:'Add availability slot', group:'Home & Availability' },
  { id:'I23', label:'I23', sublabel:'Edit / delete slot', group:'Home & Availability' },
  // Booking Mode Settings
  { id:'I24', label:'I24', sublabel:'Auto-Confirm toggle', group:'Booking Mode' },
  { id:'I25', label:'I25', sublabel:'Auto-Confirm consent modal', group:'Booking Mode' },
  { id:'I26', label:'I26', sublabel:'Instant Booking toggle', group:'Booking Mode' },
  { id:'I27', label:'I27', sublabel:'Instant Booking consent modal', group:'Booking Mode' },
  // Booking Management
  { id:'I28', label:'I28', sublabel:'New booking request', group:'Booking Management' },
  { id:'I29', label:'I29', sublabel:'Booking accepted', group:'Booking Management' },
  { id:'I30', label:'I30', sublabel:'Booking declined', group:'Booking Management' },
  { id:'I31', label:'I31', sublabel:'Bookings inbox', group:'Booking Management' },
  { id:'I32', label:'I32', sublabel:'Booking detail', group:'Booking Management' },
  { id:'I33', label:'I33', sublabel:'Auto-confirmed notification', group:'Booking Management' },
  // Lesson Day
  { id:'I34', label:'I34', sublabel:'2-hour check-in prompt', group:'Lesson Day' },
  { id:'I35', label:'I35', sublabel:'Check-in confirmed', group:'Lesson Day' },
  { id:'I36', label:'I36', sublabel:'At-risk warning', group:'Lesson Day' },
  { id:'I37', label:'I37', sublabel:'Pre-lesson screen', group:'Lesson Day' },
  { id:'I38', label:'I38', sublabel:'Lesson in progress', group:'Lesson Day' },
  { id:'I39', label:'I39', sublabel:'Mark student no-show', group:'Lesson Day' },
  { id:'I40', label:'I40', sublabel:'Lesson completed', group:'Lesson Day' },
  // Cancellation & Strikes
  { id:'I41', label:'I41', sublabel:'Cancel booking', group:'Cancellation & Strikes' },
  { id:'I42', label:'I42', sublabel:'Cancellation confirmed', group:'Cancellation & Strikes' },
  { id:'I46', label:'I46', sublabel:'Strike notification', group:'Cancellation & Strikes' },
  { id:'I47', label:'I47', sublabel:'Strike history', group:'Cancellation & Strikes' },
  { id:'I48', label:'I48', sublabel:'Account flagged (2 strikes)', group:'Cancellation & Strikes' },
  { id:'I49', label:'I49', sublabel:'Account suspended (3 strikes)', group:'Cancellation & Strikes' },
  // Earnings
  { id:'I43', label:'I43', sublabel:'Earnings dashboard', group:'Earnings & Payouts' },
  { id:'I44', label:'I44', sublabel:'Payout schedule', group:'Earnings & Payouts' },
  { id:'I45', label:'I45', sublabel:'Stripe Connect onboarding', group:'Earnings & Payouts' },
  // Disputes
  { id:'I50', label:'I50', sublabel:'Dispute received', group:'Disputes' },
  { id:'I51', label:'I51', sublabel:'Dispute response form', group:'Disputes' },
  { id:'I52', label:'I52', sublabel:'Dispute resolved', group:'Disputes' },
  // Settings
  { id:'I53', label:'I53', sublabel:'Account settings', group:'Settings & Support' },
  { id:'I54', label:'I54', sublabel:'Edit profile', group:'Settings & Support' },
  { id:'I55', label:'I55', sublabel:'Notification preferences', group:'Settings & Support' },
  { id:'I56', label:'I56', sublabel:'Help / Support', group:'Settings & Support' },
  // Errors
  { id:'I57', label:'I57', sublabel:'Error - network', group:'Error States' },
  { id:'I58', label:'I58', sublabel:'Error - document upload', group:'Error States' },
];

// ── Connection definitions ────────────────────────────────────────────────────
// { from, to, label } — used to draw arrows

const STUDENT_CONNECTIONS = [
  // Onboarding
  { from:'S01', to:'S02', label:'first open' },
  { from:'S01', to:'S03', label:'returning' },
  { from:'S02', to:'S03', label:'' },
  { from:'S03', to:'S04', label:'Sign Up' },
  { from:'S03', to:'S06', label:'Log In' },
  { from:'S03', to:'S10', label:'Browse first' },
  { from:'S04', to:'S05', label:'submit' },
  { from:'S05', to:'S08', label:'email verified' },
  { from:'S08', to:'S09', label:'done' },
  { from:'S06', to:'S09', label:'valid' },
  { from:'S06', to:'S07', label:'forgot pw' },
  { from:'S07', to:'S06', label:'reset done' },
  // Home → Search
  { from:'S09', to:'S11', label:'Search' },
  { from:'S09', to:'S19', label:'Instant slot tap' },
  { from:'S09', to:'S14', label:'recent instructor' },
  { from:'S09', to:'S24', label:'My Bookings' },
  { from:'S09', to:'S37', label:'Account' },
  { from:'S10', to:'S11', label:'Search' },
  { from:'S10', to:'S03', label:'try to book' },
  // Search
  { from:'S11', to:'S12', label:'apply filters' },
  { from:'S12', to:'S13', label:'no results' },
  { from:'S13', to:'S11', label:'widen filters' },
  { from:'S12', to:'S14', label:'tap instructor' },
  { from:'S14', to:'S15', label:'Book Now' },
  // Standard Booking
  { from:'S15', to:'S16', label:'select slot' },
  { from:'S16', to:'S17', label:'confirm pin' },
  { from:'S17', to:'S18', label:'proceed to pay' },
  { from:'S18', to:'S21', label:'pay success' },
  { from:'S18', to:'S43', label:'pay failed' },
  { from:'S43', to:'S18', label:'retry' },
  { from:'S21', to:'S20', label:'instructor confirms' },
  { from:'S21', to:'S22', label:'1hr SLA missed' },
  { from:'S21', to:'S23', label:'instructor declines' },
  // Instant Booking
  { from:'S19', to:'S15', label:'agree & continue' },
  { from:'S19', to:'S09', label:'cancel' },
  // Credits at checkout
  { from:'S34', to:'S17', label:'apply credit' },
  { from:'S17', to:'S34', label:'view credits' },
  // My Bookings
  { from:'S24', to:'S25', label:'tap booking' },
  { from:'S25', to:'S26', label:'Cancel' },
  { from:'S26', to:'S27', label:'confirm cancel' },
  { from:'S26', to:'S25', label:'go back' },
  { from:'S25', to:'S35', label:'Dispute' },
  { from:'S35', to:'S36', label:'submit' },
  // Lesson Day
  { from:'S25', to:'S28', label:'lesson day' },
  { from:'S28', to:'S29', label:'instructor en route' },
  { from:'S29', to:'S30', label:'leave now alert' },
  { from:'S30', to:'S31', label:'lesson starts' },
  { from:'S31', to:'S32', label:'lesson ends' },
  // Post-Lesson
  { from:'S32', to:'S33', label:'submit rating' },
  { from:'S33', to:'S09', label:'book again' },
  // Settings
  { from:'S37', to:'S38', label:'Edit profile' },
  { from:'S37', to:'S39', label:'Payment methods' },
  { from:'S37', to:'S40', label:'Notifications' },
  { from:'S37', to:'S41', label:'Help' },
  // Errors
  { from:'S42', to:'S09', label:'retry' },
  { from:'S20', to:'S24', label:'view booking' },
  { from:'S22', to:'S09', label:'back home' },
  { from:'S23', to:'S09', label:'back home' },
];

const INSTRUCTOR_CONNECTIONS = [
  // Onboarding
  { from:'I01', to:'I02', label:'first open' },
  { from:'I01', to:'I03', label:'returning' },
  { from:'I02', to:'I03', label:'' },
  { from:'I03', to:'I04', label:'Sign Up' },
  { from:'I03', to:'I06', label:'Log In' },
  { from:'I04', to:'I05', label:'submit' },
  { from:'I05', to:'I08', label:'email verified' },
  { from:'I08', to:'I09', label:'Start' },
  { from:'I09', to:'I10', label:'' },
  { from:'I10', to:'I11', label:'' },
  { from:'I11', to:'I12', label:'' },
  { from:'I12', to:'I13', label:'valid upload' },
  { from:'I12', to:'I58', label:'bad file' },
  { from:'I58', to:'I12', label:'retry' },
  { from:'I13', to:'I14', label:'' },
  { from:'I14', to:'I15', label:'' },
  { from:'I15', to:'I16', label:'submit' },
  { from:'I16', to:'I17', label:'' },
  { from:'I17', to:'I18', label:'admin approves' },
  { from:'I17', to:'I19', label:'admin rejects' },
  { from:'I19', to:'I12', label:'resubmit' },
  { from:'I18', to:'I20', label:'continue' },
  { from:'I06', to:'I20', label:'valid login' },
  { from:'I06', to:'I07', label:'forgot pw' },
  // Home & Availability
  { from:'I20', to:'I21', label:'Availability' },
  { from:'I20', to:'I31', label:'Bookings' },
  { from:'I20', to:'I43', label:'Earnings' },
  { from:'I20', to:'I53', label:'Settings' },
  { from:'I20', to:'I47', label:'Strike count' },
  { from:'I21', to:'I22', label:'Add slot' },
  { from:'I21', to:'I23', label:'tap slot' },
  { from:'I22', to:'I21', label:'saved' },
  { from:'I23', to:'I21', label:'saved/deleted' },
  // Booking Mode
  { from:'I53', to:'I24', label:'Auto-Confirm' },
  { from:'I24', to:'I25', label:'Enable' },
  { from:'I25', to:'I24', label:'agreed/declined' },
  { from:'I53', to:'I26', label:'Instant Booking' },
  { from:'I26', to:'I27', label:'Enable' },
  { from:'I27', to:'I26', label:'agreed/declined' },
  // Booking Management
  { from:'I31', to:'I28', label:'pending request' },
  { from:'I28', to:'I29', label:'confirm' },
  { from:'I28', to:'I30', label:'decline' },
  { from:'I29', to:'I32', label:'view detail' },
  { from:'I30', to:'I31', label:'back' },
  { from:'I33', to:'I32', label:'tap notification' },
  // Lesson Day
  { from:'I32', to:'I34', label:'2hr before lesson' },
  { from:'I34', to:'I35', label:'on my way' },
  { from:'I34', to:'I36', label:'no response' },
  { from:'I34', to:'I41', label:'cancel' },
  { from:'I35', to:'I37', label:'continue' },
  { from:'I37', to:'I38', label:'start lesson' },
  { from:'I38', to:'I40', label:'auto-completes' },
  { from:'I38', to:'I39', label:'15min no student' },
  { from:'I39', to:'I40', label:'confirmed no-show' },
  // Cancellation & Strikes
  { from:'I41', to:'I42', label:'confirmed' },
  { from:'I42', to:'I46', label:'strike issued' },
  { from:'I46', to:'I47', label:'view history' },
  { from:'I46', to:'I48', label:'2nd strike' },
  { from:'I48', to:'I49', label:'3rd strike' },
  { from:'I49', to:'I56', label:'appeal' },
  // Earnings
  { from:'I43', to:'I44', label:'payout schedule' },
  { from:'I44', to:'I45', label:'setup Stripe' },
  { from:'I45', to:'I44', label:'complete' },
  // Disputes
  { from:'I50', to:'I51', label:'respond' },
  { from:'I51', to:'I52', label:'submitted' },
  // Settings
  { from:'I53', to:'I54', label:'Edit profile' },
  { from:'I53', to:'I55', label:'Notifications' },
  { from:'I53', to:'I56', label:'Help' },
  { from:'I53', to:'I44', label:'Payout' },
  // Errors
  { from:'I57', to:'I20', label:'retry' },
  { from:'I40', to:'I20', label:'back home' },
];

// ── Node builder ─────────────────────────────────────────────────────────────

function buildScreenNode(screen, x, y) {
  const notchW = 120, notchH = 30, cornerR = 28;

  return {
    id: screen.id,
    type: 'FRAME',
    name: `${screen.id}: ${screen.sublabel}`,
    x,
    y,
    width:  FRAME_W,
    height: FRAME_H,
    cornerRadius: cornerR,
    fills: [{ type:'SOLID', color: C_FRAME_FILL }],
    strokes: [{ type:'SOLID', color: C_FRAME_STROKE }],
    strokeWeight: 2,
    children: [
      // Notch
      {
        type: 'RECTANGLE',
        name: 'notch',
        x: (FRAME_W - notchW) / 2,
        y: 8,
        width: notchW,
        height: notchH,
        cornerRadius: notchH / 2,
        fills: [{ type:'SOLID', color: C_NOTCH_FILL }],
        strokes: [],
      },
      // Screen ID label
      {
        type: 'TEXT',
        name: 'id-label',
        x: 20,
        y: 55,
        width: FRAME_W - 40,
        height: 48,
        characters: screen.label,
        style: { fontFamily:'Inter', fontWeight: 700, fontSize: 32, textAlignHorizontal:'LEFT' },
        fills: [{ type:'SOLID', color: C_TITLE_TEXT }],
      },
      // Screen name
      {
        type: 'TEXT',
        name: 'screen-name',
        x: 20,
        y: 108,
        width: FRAME_W - 40,
        height: 80,
        characters: screen.sublabel,
        style: { fontFamily:'Inter', fontWeight: 400, fontSize: 22, textAlignHorizontal:'LEFT' },
        fills: [{ type:'SOLID', color: C_SUB_TEXT }],
      },
      // Divider line
      {
        type: 'RECTANGLE',
        name: 'divider',
        x: 20,
        y: 200,
        width: FRAME_W - 40,
        height: 2,
        fills: [{ type:'SOLID', color: { r:0.85, g:0.85, b:0.85 } }],
        strokes: [],
      },
      // Content placeholder block
      {
        type: 'RECTANGLE',
        name: 'content-area',
        x: 20,
        y: 220,
        width: FRAME_W - 40,
        height: FRAME_H - 320,
        cornerRadius: 12,
        fills: [{ type:'SOLID', color: { r:0.94, g:0.94, b:0.94 } }],
        strokes: [],
      },
      // Bottom nav bar placeholder
      {
        type: 'RECTANGLE',
        name: 'bottom-bar',
        x: 0,
        y: FRAME_H - 80,
        width: FRAME_W,
        height: 80,
        fills: [{ type:'SOLID', color: { r:0.97, g:0.97, b:0.97 } }],
        strokes: [{ type:'SOLID', color: { r:0.85, g:0.85, b:0.85 } }],
        strokeWeight: 1,
      },
    ],
  };
}

// ── Layout calculator ────────────────────────────────────────────────────────

function layoutScreens(screens) {
  // Group by section, then lay out in rows within each group
  const groups = {};
  screens.forEach((s) => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });

  const positioned = []; // { screen, x, y }
  let sectionY = 0;

  Object.entries(groups).forEach(([groupName, groupScreens]) => {
    const rowCount = Math.ceil(groupScreens.length / COLS);
    groupScreens.forEach((s, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      positioned.push({
        screen: s,
        x: col * (FRAME_W + GAP_X) + SECTION_PAD,
        y: sectionY + row * (FRAME_H + GAP_Y) + SECTION_PAD + 80,
        group: groupName,
      });
    });
    const totalHeight = rowCount * (FRAME_H + GAP_Y);
    sectionY += totalHeight + SECTION_PAD * 3 + 80; // extra space for section label
  });

  return positioned;
}

// ── FigJam page builder ──────────────────────────────────────────────────────

function buildPageNodes(screens, connections, sectionColor) {
  const positioned = layoutScreens(screens);
  const posMap = {}; // id → {x, y, cx, cy} (center x/y for connectors)

  positioned.forEach(({ screen, x, y }) => {
    posMap[screen.id] = {
      x,
      y,
      cx: x + FRAME_W / 2,
      cy: y + FRAME_H / 2,
    };
  });

  const nodes = [];

  // Section label frames (backgrounds)
  const groups = {};
  positioned.forEach(({ screen, x, y, group }) => {
    if (!groups[group]) groups[group] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    groups[group].minX = Math.min(groups[group].minX, x);
    groups[group].minY = Math.min(groups[group].minY, y);
    groups[group].maxX = Math.max(groups[group].maxX, x + FRAME_W);
    groups[group].maxY = Math.max(groups[group].maxY, y + FRAME_H);
  });

  Object.entries(groups).forEach(([name, bounds]) => {
    nodes.push({
      type: 'FRAME',
      name: `Section: ${name}`,
      x: bounds.minX - SECTION_PAD,
      y: bounds.minY - SECTION_PAD - 70,
      width: bounds.maxX - bounds.minX + SECTION_PAD * 2,
      height: bounds.maxY - bounds.minY + SECTION_PAD * 2 + 70,
      fills: [{ type:'SOLID', color: sectionColor, opacity: 0.5 }],
      strokes: [{ type:'SOLID', color: { r:0.7, g:0.7, b:0.8 } }],
      strokeWeight: 1,
      cornerRadius: 16,
      children: [
        {
          type: 'TEXT',
          name: 'section-label',
          x: SECTION_PAD,
          y: 16,
          width: 600,
          height: 50,
          characters: name,
          style: { fontFamily:'Inter', fontWeight: 700, fontSize: 28 },
          fills: [{ type:'SOLID', color: { r:0.2, g:0.2, b:0.5 } }],
        },
      ],
    });
  });

  // Screen frames
  positioned.forEach(({ screen, x, y }) => {
    nodes.push(buildScreenNode(screen, x, y));
  });

  // Connector arrows
  connections.forEach(({ from, to, label }) => {
    const f = posMap[from];
    const t = posMap[to];
    if (!f || !t) return;

    nodes.push({
      type: 'CONNECTOR',
      name: label || `${from}→${to}`,
      connectorStart: { endpointNodeId: from, position: { x: 0.5, y: 1 } },
      connectorEnd:   { endpointNodeId: to,   position: { x: 0.5, y: 0 } },
      connectorStartStrokeCap: 'NONE',
      connectorEndStrokeCap: 'ARROW_LINES',
      strokes: [{ type:'SOLID', color: C_ARROW }],
      strokeWeight: 2,
      ...(label ? {
        annotations: [{
          label: { plainText: label },
          offset: { x: 0, y: -12 },
        }]
      } : {}),
    });
  });

  return nodes;
}

// ── Create FigJam file via API ────────────────────────────────────────────────

async function createWireflow(title, screens, connections, sectionColor) {
  console.log(`\n📐  Creating: ${title}`);
  console.log(`   ${screens.length} screens · ${connections.length} connections`);

  // Create the FigJam file
  const created = await figmaRequest('POST', '/v1/files', {
    name: title,
    editor_type: 'figjam',
  });

  const fileKey = created.key;
  console.log(`   ✅ File created: https://www.figma.com/board/${fileKey}`);

  // Build nodes
  const nodes = buildPageNodes(screens, connections, sectionColor);

  // Post nodes to the file canvas
  await figmaRequest('POST', `/v1/files/${fileKey}/nodes`, {
    nodes: nodes.map((n) => ({ ...n, parentId: 'canvas' })),
  });

  console.log(`   ✅ ${nodes.length} nodes written to canvas`);
  return `https://www.figma.com/board/${fileKey}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  DriveBook Wireflow Generator');
  console.log('════════════════════════════════');

  try {
    const studentUrl = await createWireflow(
      'DriveBook — Student Wireflow',
      STUDENT_SCREENS,
      STUDENT_CONNECTIONS,
      C_SECTION_STUDENT
    );

    const instructorUrl = await createWireflow(
      'DriveBook — Instructor Wireflow',
      INSTRUCTOR_SCREENS,
      INSTRUCTOR_CONNECTIONS,
      C_SECTION_INSTRUCTOR
    );

    console.log('\n════════════════════════════════');
    console.log('✅  Both wireflows created!\n');
    console.log('📱  Student Journey:');
    console.log('   ', studentUrl);
    console.log('\n👨‍🏫  Instructor Journey:');
    console.log('   ', instructorUrl);
    console.log('\nOpen both links in your browser to view in FigJam.\n');
  } catch (err) {
    console.error('\n❌  Error:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check your FIGMA_TOKEN is set and valid');
    console.error('  2. Make sure your token has "File content" write scope');
    console.error('  3. Run: set FIGMA_TOKEN=your_token  then try again\n');
    process.exit(1);
  }
}

main();
