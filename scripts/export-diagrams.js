// export-diagrams.js
// Extracts all Mermaid diagrams from one or more markdown files and exports
// each as a PNG using the Mermaid Ink online API — no Chrome or Puppeteer needed.
//
// Usage:
//   node scripts/export-diagrams.js                  (runs all configured files)
//
// Output: docs/diagrams/<prefix>_<label>.png

const fs    = require('fs');
const path  = require('path');
const https = require('https');

// ── Files to process ─────────────────────────────────────────────────────────
// Add any new markdown file here. prefix = short name used in output filenames.
const FILES = [
  {
    prefix: 'instructor',
    src: path.join(__dirname, '../docs/DriveBook_Instructor_Journey.md'),
    labels: [
      '5.1_First_Time_Open_and_Signup',
      '5.2_Onboarding_Flow',
      '5.3_Approval_Outcome',
      '5.4_Publishing_Availability',
      '5.5_Auto_Confirm_Toggle',
      '5.6_Instant_Booking_Toggle',
      '5.7_Manual_Booking_Request',
      '5.8_Auto_Confirmed_Booking',
      '5.9_Instant_Booking_Received',
      '5.10_Pre_Lesson_Check_In',
      '5.11_Conducting_the_Lesson',
      '5.12_Cancelling_a_Booking',
      '5.13_Strike_System_Progression',
      '5.14_Earnings_and_Payout',
      '5.15_Dispute_Flow',
      '5.16_Home_Dashboard_Day_in_the_Life',
      '5.17_Account_Settings',
      '5.18_Empty_and_Error_States',
    ],
  },
  {
    prefix: 'student',
    src: path.join(__dirname, '../docs/DriveBook_Student_Journey_1.md'),
    labels: [
      '5.1_First_Time_Open_and_Account_Creation',
      '5.2_Login_and_Forgot_Password',
      '5.3_Home_Screen_and_Instant_Booking_Section',
      '5.4_Search_and_Filter',
      '5.5_View_Instructor_Profile',
      '5.6_Standard_Booking_Flow',
      '5.7_Instant_Booking_Flow',
      '5.8_Pre_Lesson_Reminder_Cadence',
      '5.9_Lesson_Day_Pickup_and_Execution',
      '5.10_Post_Lesson_Rating',
      '5.11_Cancellation_Within_Grace_Period',
      '5.12_Cancellation_Outside_Grace_Period',
      '5.13_Instructor_Cancels_on_Student',
      '5.14_Using_Student_Credits_at_Checkout',
      '5.15_Dispute_Submission',
      '5.16_Booking_History_and_Re_Booking',
      '5.17_Account_Settings',
      '5.18_Empty_and_Error_States',
    ],
  },
];

const OUTPUT_DIR = path.join(__dirname, '../docs/diagrams');

// ── Helpers ───────────────────────────────────────────────────────────────────

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

function buildMermaidInkUrl(code) {
  const encoded = Buffer.from(code).toString('base64url');
  return `https://mermaid.ink/img/${encoded}?bgColor=white&width=1600`;
}

function extractDiagrams(markdown) {
  const regex = /```mermaid\r?\n([\s\S]*?)```/g;
  const diagrams = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    diagrams.push(match[1].trim());
  }
  return diagrams;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function processFile({ prefix, src, labels }) {
  if (!fs.existsSync(src)) {
    console.error(`\n❌  File not found: ${src}\n`);
    return { ok: 0, fail: 0 };
  }

  const markdown = fs.readFileSync(src, 'utf8');
  const diagrams = extractDiagrams(markdown);

  console.log(`\n📄  ${path.basename(src)} — ${diagrams.length} diagrams found`);
  console.log('─'.repeat(60));

  let ok = 0, fail = 0;

  for (let i = 0; i < diagrams.length; i++) {
    const label   = labels[i] || `diagram_${String(i + 1).padStart(2, '0')}`;
    const outFile = path.join(OUTPUT_DIR, `${prefix}_${label}.png`);
    const url     = buildMermaidInkUrl(diagrams[i]);

    process.stdout.write(`  [${i + 1}/${diagrams.length}] ${prefix}_${label} ... `);
    try {
      await downloadFile(url, outFile);
      console.log('✅');
      ok++;
    } catch (err) {
      console.log(`❌  ${err.message}`);
      fail++;
    }
  }

  return { ok, fail };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let totalOk = 0, totalFail = 0;

  for (const file of FILES) {
    const { ok, fail } = await processFile(file);
    totalOk   += ok;
    totalFail += fail;
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✅  ${totalOk} PNGs saved to: docs/diagrams/`);
  if (totalFail > 0) console.log(`❌  ${totalFail} failed — check errors above.`);
  console.log('\nDrag the PNGs from docs/diagrams/ into FigJam!');
}

main();
