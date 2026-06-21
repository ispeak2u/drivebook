// code.js
// Figma Plugin to auto-generate low-fidelity mobile wireframes for DriveBook

async function main() {
  console.log("🚀 Starting DriveBook Wireframe Generator");

  // Load standard fonts
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  const FRAME_W = 390;
  const FRAME_H = 844;
  const GAP_X = 80;
  const GAP_Y = 120;
  const COLS = 6;
  const SECTION_PAD = 80;

  // Colors
  const colors = {
    white: { r: 1, g: 1, b: 1 },
    bgLight: { r: 0.96, g: 0.96, b: 0.98 },
    border: { r: 0.88, g: 0.88, b: 0.90 },
    textDark: { r: 0.09, g: 0.09, b: 0.11 },
    textMuted: { r: 0.45, g: 0.45, b: 0.50 },
    primary: { r: 0.05, g: 0.4, b: 0.9 }, // DriveBook Blue
    primaryText: { r: 1, g: 1, b: 1 },
    accent: { r: 0.9, g: 0.95, b: 1.0 }, // Light blue tint
    accentGreen: { r: 0.92, g: 0.98, b: 0.94 }, // Light green tint
    accentRed: { r: 1.0, g: 0.93, b: 0.93 }, // Light red tint
    mapGrid: { r: 0.9, g: 0.9, b: 0.92 }
  };

  // Screen Lists
  const studentScreens = [
    // Onboarding
    { id: "S01", title: "Splash Screen", template: "splash", group: "Onboarding" },
    { id: "S02", title: "Welcome Carousel", template: "carousel", group: "Onboarding" },
    { id: "S03", title: "Sign Up / Log In Choice", template: "choice", group: "Onboarding" },
    { id: "S04", title: "Student Signup Form", template: "form", group: "Onboarding", fields: ["Full Name", "Email", "Password", "Phone"] },
    { id: "S05", title: "Verification Email Sent", template: "message", group: "Onboarding", msg: "Please check your inbox to verify your email." },
    { id: "S06", title: "Student Login Form", template: "form", group: "Onboarding", fields: ["Email", "Password"] },
    { id: "S07", title: "Forgot Password", template: "form", group: "Onboarding", fields: ["Email Address"] },
    { id: "S08", title: "Student Profile Setup", template: "form", group: "Onboarding", fields: ["Upload Profile Photo", "Service Area (Postal Code)", "Language Preference"] },
    // Home
    { id: "S09", title: "Student Home (Logged In)", template: "dashboard", group: "Home" },
    { id: "S10", title: "Student Home (Guest Mode)", template: "dashboard", group: "Home", guest: true },
    // Search
    { id: "S11", title: "Search Filters Page", template: "filters", group: "Search & Discovery" },
    { id: "S12", title: "Search Results List", template: "list", group: "Search & Discovery", items: ["Michael R. - $60/hr", "Sarah M. - $65/hr", "David K. - $58/hr"] },
    { id: "S13", title: "Empty Search Results", template: "message", group: "Search & Discovery", msg: "No instructors match your filters. Try widening your search." },
    { id: "S14", title: "Public Instructor Profile", template: "profile", group: "Search & Discovery" },
    { id: "S15", title: "Availability Slot Picker", template: "slots", group: "Search & Discovery" },
    // Booking
    { id: "S16", title: "Pickup Pin Map Selector", template: "map", group: "Booking Flow" },
    { id: "S17", title: "Booking Confirmation Review", template: "checkout", group: "Booking Flow" },
    { id: "S18", title: "Stripe Checkout Payment", template: "form", group: "Booking Flow", fields: ["Cardholder Name", "Card Number", "Expiry & CVC"] },
    { id: "S19", title: "Instant Booking Alert", template: "alert", group: "Booking Flow", alertTitle: "Instant Booking Policy", alertText: "Instant Bookings are auto-confirmed and cannot be cancelled by the student after confirmation." },
    { id: "S20", title: "Booking Confirmed Screen", template: "message", group: "Booking Flow", msg: "Your lesson has been confirmed! Details sent to email." },
    { id: "S21", title: "Booking Request Pending", template: "message", group: "Booking Flow", msg: "Request sent. Waiting for instructor response (1hr SLA)." },
    { id: "S22", title: "Booking Request Expired", template: "message", group: "Booking Flow", msg: "Request expired. The instructor did not respond in time." },
    { id: "S23", title: "Booking Request Declined", template: "message", group: "Booking Flow", msg: "The instructor declined your request. Choose another slot." },
    // My Bookings
    { id: "S24", title: "My Bookings List", template: "list", group: "My Bookings", items: ["June 25: Michael R. (Confirmed)", "June 12: Sarah M. (Completed)"] },
    { id: "S25", title: "Booking Details Screen", template: "details", group: "My Bookings" },
    { id: "S26", title: "Cancel Booking Warning", template: "alert", group: "My Bookings", alertTitle: "Late Cancellation Penalty", alertText: "Cancelling within 24 hours of the lesson forfeits 50% of the booking fee." },
    { id: "S27", title: "Cancellation Confirmed", template: "message", group: "My Bookings", msg: "Booking successfully cancelled. Refund processed." },
    { id: "S34", title: "Student Credits Balance", template: "list", group: "My Bookings", items: ["Available Credit: $30.00", "Promo Credit: $10.00"] },
    // Lesson Day
    { id: "S28", title: "Pre-Lesson Status Screen", template: "details", group: "Lesson Day" },
    { id: "S29", title: "Instructor En Route Map", template: "map", group: "Lesson Day" },
    { id: "S30", title: "Student 'Leave Now' Alert", template: "alert", group: "Lesson Day", alertTitle: "Instructor Has Arrived", alertText: "Your instructor is at the pickup location. Please head outside." },
    { id: "S31", title: "Lesson in Progress Screen", template: "details", group: "Lesson Day" },
    // Post-Lesson
    { id: "S32", title: "Rate Your Lesson Form", template: "feedback", group: "Post-Lesson" },
    { id: "S33", title: "Rating Submission Confirmed", template: "message", group: "Post-Lesson", msg: "Thank you! Your feedback helps keep DriveBook safe." },
    { id: "S35", title: "Submit Dispute Form", template: "feedback", group: "Post-Lesson", dispute: true },
    { id: "S36", title: "Dispute Submission Confirmed", template: "message", group: "Post-Lesson", msg: "Dispute received. DriveBook Admin will contact you within 24 hours." },
    // Settings
    { id: "S37", title: "Student Account Settings", template: "list", group: "Settings & Support", items: ["Edit Profile", "Payment Methods", "Notifications", "Help & Support"] },
    { id: "S38", title: "Edit Student Profile", template: "form", group: "Settings & Support", fields: ["Full Name", "Email Address", "Phone Number"] },
    { id: "S39", title: "Saved Payment Methods", template: "list", group: "Settings & Support", items: ["Visa ending in 4242", "Add New Card"] },
    { id: "S40", title: "Notification Preferences", template: "form", group: "Settings & Support", fields: ["Enable Push", "Enable SMS Reminders", "Email Updates"] },
    { id: "S41", title: "Help & Support Tickets", template: "list", group: "Settings & Support", items: ["Support Ticket #1002 (Closed)", "Open New Ticket"] },
    // Errors
    { id: "S42", title: "Network Error Screen", template: "message", group: "Error & Edge States", msg: "No internet connection. Please retry." },
    { id: "S43", title: "Payment Failed Screen", template: "alert", group: "Error & Edge States", alertTitle: "Transaction Declined", alertText: "Stripe was unable to charge your card. Check balance or try another card." },
    { id: "S44", title: "Student Account Suspended", template: "message", group: "Error & Edge States", msg: "Your account is suspended due to booking policy violations." }
  ];

  const instructorScreens = [
    // Onboarding
    { id: "I01", title: "Splash Screen", template: "splash", group: "Onboarding" },
    { id: "I02", title: "Welcome Carousel", template: "carousel", group: "Onboarding" },
    { id: "I03", title: "Sign Up / Log In Choice", template: "choice", group: "Onboarding" },
    { id: "I04", title: "Instructor Signup Form", template: "form", group: "Onboarding", fields: ["Full Name", "Email", "Password", "Phone"] },
    { id: "I05", title: "Verification Email Pending", template: "message", group: "Onboarding", msg: "Please verify your email to begin setup." },
    { id: "I06", title: "Instructor Login Form", template: "form", group: "Onboarding", fields: ["Email", "Password"] },
    { id: "I07", title: "Forgot Password Form", template: "form", group: "Onboarding", fields: ["Email Address"] },
    { id: "I08", title: "Instructor Onboarding Intro", template: "message", group: "Onboarding", msg: "Welcome! Set up your business profile in 5 quick steps." },
    { id: "I09", title: "Instructor Profile Basics", template: "form", group: "Onboarding", fields: ["Bio / Tagline", "Hourly Rate (CAD)", "Years of Experience"] },
    { id: "I10", title: "Vehicle Details Form", template: "form", group: "Onboarding", fields: ["Vehicle Make", "Vehicle Model", "License Plate"] },
    { id: "I11", title: "Service Area Prefix Picker", template: "form", group: "Onboarding", fields: ["Service areas (M1, M2, M3...)"] },
    { id: "I12", title: "Upload MTO Certificate", template: "form", group: "Onboarding", fields: ["MTO Cert Number", "Upload Certificate PDF/Image"] },
    { id: "I13", title: "Upload Government ID", template: "form", group: "Onboarding", fields: ["Gov ID Document Type", "Upload Photo ID File"] },
    { id: "I14", title: "Upload Proof of Insurance", template: "form", group: "Onboarding", fields: ["Insurance Provider", "Upload Insurance Copy"] },
    { id: "I15", title: "Onboarding Review Submission", template: "checkout", group: "Onboarding" },
    { id: "I16", title: "Application Confirmed", template: "message", group: "Onboarding", msg: "Application submitted. Our admins are reviewing your documents." },
    { id: "I17", title: "Account Pending Approval", template: "message", group: "Onboarding", msg: "Review takes up to 48 hours. We will notify you via email." },
    { id: "I18", title: "Approval Welcome Notification", template: "message", group: "Onboarding", msg: "Congratulations! Your account is active. Set up availability." },
    { id: "I19", title: "Rejection Resolution Guide", template: "alert", group: "Onboarding", alertTitle: "Application Rejected", alertText: "Your MTO certificate could not be verified. Please upload a clear photo of the back." },
    // Home & Availability
    { id: "I20", title: "Instructor Home Dashboard", template: "dashboard", group: "Home & Availability" },
    { id: "I21", title: "Availability Calendar Grid", template: "slots", group: "Home & Availability" },
    { id: "I22", title: "Add Availability Slot", template: "form", group: "Home & Availability", fields: ["Start Time", "End Time", "Recurrence (Weekly/None)"] },
    { id: "I23", title: "Edit / Delete Active Slot", template: "alert", group: "Home & Availability", alertTitle: "Modify Active Slot", alertText: "Deleting this slot will cancel any unconfirmed bookings." },
    // Booking Mode
    { id: "I24", title: "Auto-Confirm Switch Page", template: "form", group: "Booking Mode Settings", fields: ["Enable Auto-Confirm (Saves 1hr SLA)"] },
    { id: "I25", title: "Auto-Confirm Consent Dialog", template: "alert", group: "Booking Mode Settings", alertTitle: "Auto-Confirm Mode", alertText: "All incoming standard requests matching your availability will be auto-confirmed." },
    { id: "I26", title: "Instant Booking Switch Page", template: "form", group: "Booking Mode Settings", fields: ["Enable Instant Booking (Same-day)"] },
    { id: "I27", title: "Instant Booking Consent Dialog", template: "alert", group: "Booking Mode Settings", alertTitle: "Instant Booking", alertText: "Students can book you with a 2-hour lead time. No cancellation permitted." },
    // Booking Management
    { id: "I28", title: "New Booking Request Card", template: "details", group: "Booking Management", isRequest: true },
    { id: "I29", title: "Booking Request Accepted", template: "message", group: "Booking Management", msg: "Booking accepted! Added to calendar." },
    { id: "I30", title: "Booking Request Declined", template: "form", group: "Booking Management", fields: ["Select decline reason"] },
    { id: "I31", title: "Bookings Inbox list", template: "list", group: "Booking Management", items: ["Pending: Alex Chen (2h)", "Confirmed: Priya K. (June 24)"] },
    { id: "I32", title: "Assigned Booking Detail Page", template: "details", group: "Booking Management" },
    { id: "I33", title: "Auto-Confirmed Notification", template: "message", group: "Booking Management", msg: "Booking automatically confirmed. View details." },
    // Lesson Day
    { id: "I34", title: "2-Hour Pre-Lesson Check-In", template: "alert", group: "Lesson Day Flow", alertTitle: "Confirm Availability", alertText: "Please confirm you are en route. Failure to check in triggers a warning." },
    { id: "I35", title: "Check-In Confirmed Success", template: "message", group: "Lesson Day Flow", msg: "Check-in successful. Student notified you are en route." },
    { id: "I36", title: "At-Risk Status Warning", template: "alert", group: "Lesson Day Flow", alertTitle: "Late Check-in Warning", alertText: "No check-in received. 15 minutes remaining before cancellation penalty." },
    { id: "I37", title: "Pre-Lesson Navigation Map", template: "map", group: "Lesson Day Flow" },
    { id: "I38", title: "Lesson in Progress Dashboard", template: "details", group: "Lesson Day Flow" },
    { id: "I39", title: "Mark Student No-Show Form", template: "alert", group: "Lesson Day Flow", alertTitle: "Student No-Show", alertText: "Has student failed to arrive after 15 minutes? Submit to charge full fee." },
    { id: "I40", title: "Lesson Completed Screen", template: "message", group: "Lesson Day Flow", msg: "Lesson finished. Earnings added to account." },
    // Cancellation & Strikes
    { id: "I41", title: "Cancel Active Booking Form", template: "form", group: "Cancellation & Strikes", fields: ["Reason for cancellation"] },
    { id: "I42", title: "Instructor Cancel Confirmed", template: "message", group: "Cancellation & Strikes", msg: "Booking cancelled. Student notified." },
    { id: "I46", title: "Strike Notification Alert", template: "alert", group: "Cancellation & Strikes", alertTitle: "Strike Issued", alertText: "A strike has been recorded against your profile for late cancellation." },
    { id: "I47", title: "Active Strike History List", template: "list", group: "Cancellation & Strikes", items: ["Strike 1: Late cancellation (June 10)", "Active Strikes: 1 / 3"] },
    { id: "I48", title: "Account Flagged Warning", template: "alert", group: "Cancellation & Strikes", alertTitle: "Profile Flagged (2 Strikes)", alertText: "Next violation will suspend your listing. Please review the cancellation policy." },
    { id: "I49", title: "Account Suspended Page", template: "message", group: "Cancellation & Strikes", msg: "Account suspended due to 3 active strikes. Contact support." },
    // Earnings
    { id: "I43", title: "Instructor Earnings Dashboard", template: "list", group: "Earnings & Payouts", items: ["Total Balance: $480.00", "Pending Payout: $120.00"] },
    { id: "I44", title: "Payout Schedule Settings", template: "list", group: "Earnings & Payouts", items: ["Payout Method: Stripe Connect", "Weekly transfer enabled"] },
    { id: "I45", title: "Stripe Connect Onboarding", template: "form", group: "Earnings & Payouts", fields: ["Routing Number", "Account Number", "Confirm Bank details"] },
    // Disputes
    { id: "I50", title: "Student Dispute Received", template: "alert", group: "Disputes Management", alertTitle: "Dispute Opened", alertText: "A student has disputed booking DB-20250809. Please respond with details." },
    { id: "I51", title: "Dispute Response Form", template: "form", group: "Disputes Management", fields: ["Your statement / explanation", "Upload dashcam/GPS proof"] },
    { id: "I52", title: "Dispute Resolution Card", template: "message", group: "Disputes Management", msg: "Dispute resolved by Admin. Payout released." },
    // Settings
    { id: "I53", title: "Instructor Settings Menu", template: "list", group: "Settings & Support", items: ["Edit Public Profile", "Notification Prefs", "Payout Settings", "Help Desk"] },
    { id: "I54", title: "Edit Public Profile Details", template: "form", group: "Settings & Support", fields: ["Hourly Rate (CAD)", "Service Areas", "Biography"] },
    { id: "I55", title: "Notification Preferences", template: "form", group: "Settings & Support", fields: ["New booking alerts", "Push notifications", "SMS summaries"] },
    { id: "I56", title: "Help & Support Tickets", template: "list", group: "Settings & Support", items: ["Ticket #2001 (Open)", "Submit New Request"] },
    // Errors
    { id: "I57", title: "Network Disconnect Alert", template: "message", group: "Error States", msg: "Connection lost. Checking server status." },
    { id: "I58", title: "Document Upload Failed", template: "alert", group: "Error States", alertTitle: "Upload Error", alertText: "Supported file formats are PDF, PNG, and JPG. Max size 10MB." }
  ];

  // Helper function to build text
  function drawText(parent, x, y, w, h, characters, size = 12, weight = "Regular", align = "LEFT", color = colors.textDark) {
    const text = figma.createText();
    parent.appendChild(text);
    text.x = x;
    text.y = y;
    text.resize(w, h);
    text.fontName = { family: "Inter", style: weight };
    text.fontSize = size;
    text.characters = characters;
    text.textAlignHorizontal = align;
    text.textAlignVertical = "CENTER";
    text.fills = [{ type: "SOLID", color: color }];
    return text;
  }

  // Helper function to draw rectangle
  function drawRect(parent, x, y, w, h, fill = colors.white, radius = 0, stroke = null, strokeWeight = 1) {
    const rect = figma.createRectangle();
    parent.appendChild(rect);
    rect.x = x;
    rect.y = y;
    rect.resize(w, h);
    rect.cornerRadius = radius;
    rect.fills = [{ type: "SOLID", color: fill }];
    if (stroke) {
      rect.strokes = [{ type: "SOLID", color: stroke }];
      rect.strokeWeight = strokeWeight;
    } else {
      rect.strokes = [];
    }
    return rect;
  }

  // Helper function to draw circles
  function drawCircle(parent, x, y, r, fill = colors.border) {
    const ellipse = figma.createEllipse();
    parent.appendChild(ellipse);
    ellipse.x = x;
    ellipse.y = y;
    ellipse.resize(r * 2, r * 2);
    ellipse.fills = [{ type: "SOLID", color: fill }];
    ellipse.strokes = [];
    return ellipse;
  }

  // Master wireframe renderer
  function renderWireframe(frame, screen) {
    // 1. Draw Notch
    drawRect(frame, (FRAME_W - 120) / 2, 8, 120, 30, colors.textDark, 15);
    
    // 2. Draw Status Bar
    drawText(frame, 24, 15, 60, 20, "9:41", 12, "Bold");
    drawText(frame, FRAME_W - 80, 15, 60, 20, "[📶 🔋]", 12, "Regular", "RIGHT", colors.textMuted);

    // 3. Draw Header
    const isSplash = screen.template === "splash";
    if (!isSplash) {
      // Back arrow
      drawText(frame, 20, 50, 40, 40, "◀", 18, "Bold", "LEFT", colors.primary);
      // Screen title
      drawText(frame, 60, 50, FRAME_W - 120, 40, screen.title, 16, "Bold", "CENTER");
      // Divider
      drawRect(frame, 0, 95, FRAME_W, 1, colors.border);
    }

    // 4. Render templates
    switch (screen.template) {
      case "splash":
        drawRect(frame, (FRAME_W - 120) / 2, 280, 120, 120, colors.primary, 24);
        drawText(frame, (FRAME_W - 120) / 2, 280, 120, 120, "DB", 48, "Bold", "CENTER", colors.white);
        drawText(frame, 20, 440, FRAME_W - 40, 40, "DriveBook", 36, "Bold", "CENTER");
        drawText(frame, 20, 490, FRAME_W - 40, 24, "Certified Driving Marketplace", 16, "Regular", "CENTER", colors.textMuted);
        drawRect(frame, (FRAME_W - 160) / 2, 650, 160, 6, colors.border, 3);
        drawRect(frame, (FRAME_W - 160) / 2, 650, 90, 6, colors.primary, 3);
        break;

      case "carousel":
        drawRect(frame, 20, 140, FRAME_W - 40, 300, colors.accent, 16);
        drawText(frame, 40, 240, FRAME_W - 80, 100, "📷 Wireframe Image Placeholder", 16, "Bold", "CENTER", colors.primary);
        drawText(frame, 20, 480, FRAME_W - 40, 40, "Ontario G2/G Test Ready", 24, "Bold", "CENTER");
        drawText(frame, 40, 530, FRAME_W - 80, 60, "Book top-rated, certified instructors matching your schedule, location, and preferred language.", 14, "Regular", "CENTER", colors.textMuted);
        drawCircle(frame, FRAME_W / 2 - 20, 630, 4, colors.primary);
        drawCircle(frame, FRAME_W / 2 - 5, 630, 4, colors.border);
        drawCircle(frame, FRAME_W / 2 + 10, 630, 4, colors.border);
        drawRect(frame, 20, 710, FRAME_W - 40, 50, colors.primary, 12);
        drawText(frame, 20, 710, FRAME_W - 40, 50, "Get Started", 16, "Bold", "CENTER", colors.white);
        break;

      case "choice":
        drawText(frame, 20, 160, FRAME_W - 40, 80, "Let's Get Started", 28, "Bold", "CENTER");
        drawRect(frame, (FRAME_W - 80) / 2, 260, 80, 80, colors.primary, 16);
        drawText(frame, (FRAME_W - 80) / 2, 260, 80, 80, "DB", 32, "Bold", "CENTER", colors.white);
        drawRect(frame, 20, 420, FRAME_W - 40, 60, colors.white, 12, colors.primary, 2);
        drawText(frame, 40, 420, FRAME_W - 80, 60, "Register as a Student", 16, "Bold", "CENTER", colors.primary);
        drawRect(frame, 20, 500, FRAME_W - 40, 60, colors.white, 12, colors.border, 1.5);
        drawText(frame, 40, 500, FRAME_W - 80, 60, "Apply as an Instructor", 16, "Bold", "CENTER", colors.textDark);
        drawText(frame, 20, 680, FRAME_W - 40, 40, "Already have an account? Log In", 14, "Regular", "CENTER", colors.textMuted);
        break;

      case "form":
        let inputY = 140;
        if (screen.fields) {
          screen.fields.forEach((field) => {
            drawText(frame, 20, inputY, FRAME_W - 40, 20, field, 12, "Bold", "LEFT", colors.textMuted);
            drawRect(frame, 20, inputY + 25, FRAME_W - 40, 48, colors.bgLight, 8, colors.border);
            drawText(frame, 36, inputY + 25, FRAME_W - 72, 48, `Enter ${field.toLowerCase()}...`, 14, "Regular", "LEFT", colors.textMuted);
            inputY += 95;
          });
        }
        drawRect(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, colors.primary, 12);
        drawText(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, "Save & Continue", 16, "Bold", "CENTER", colors.white);
        break;

      case "dashboard":
        drawCircle(frame, 20, 120, 20, colors.primary);
        drawText(frame, 20, 120, 40, 40, "P", 16, "Bold", "CENTER", colors.white);
        drawText(frame, 70, 110, 180, 20, screen.guest ? "Hello, Guest" : "Hello, Paul", 16, "Bold");
        drawText(frame, 70, 130, 180, 20, "Scarborough, Toronto", 12, "Regular", "LEFT", colors.textMuted);
        drawRect(frame, FRAME_W - 60, 120, 40, 40, colors.bgLight, 20);
        drawText(frame, FRAME_W - 60, 120, 40, 40, "🔔", 16, "Regular", "CENTER");
        drawRect(frame, 20, 180, FRAME_W - 40, 48, colors.white, 12, colors.border);
        drawText(frame, 36, 180, FRAME_W - 72, 48, "🔍 Search by language, rate, date...", 14, "Regular", "LEFT", colors.textMuted);
        drawRect(frame, 20, 248, FRAME_W - 40, 120, colors.primary, 16);
        drawText(frame, 40, 268, FRAME_W - 80, 30, "Instant Booking Active", 18, "Bold", "LEFT", colors.white);
        drawText(frame, 40, 298, FRAME_W - 80, 40, "Book a same-day lesson instantly with a verified instructor in your area.", 12, "Regular", "LEFT", colors.accent);
        drawText(frame, 20, 395, 200, 30, "Upcoming Lessons", 16, "Bold");
        drawText(frame, FRAME_W - 80, 395, 60, 30, "View All", 12, "Bold", "RIGHT", colors.primary);
        drawRect(frame, 20, 435, FRAME_W - 40, 96, colors.white, 12, colors.border);
        drawCircle(frame, 40, 451, 24, colors.accent);
        drawText(frame, 40, 451, 48, 48, "MR", 14, "Bold", "CENTER", colors.primary);
        drawText(frame, 100, 451, 200, 24, "Michael R. (MTO Approved)", 14, "Bold");
        drawText(frame, 100, 475, 200, 20, "Saturday, June 27 at 10:00 AM", 12, "Regular", "LEFT", colors.primary);
        drawText(frame, 100, 495, 200, 20, "Pickup: Scarborough Town Centre", 11, "Regular", "LEFT", colors.textMuted);
        drawRect(frame, 0, FRAME_H - 80, FRAME_W, 80, colors.white, 0, colors.border);
        drawText(frame, 0, FRAME_H - 70, FRAME_W / 3, 40, "🏠\nHome", 11, "Bold", "CENTER", colors.primary);
        drawText(frame, FRAME_W / 3, FRAME_H - 70, FRAME_W / 3, 40, "📅\nBookings", 11, "Regular", "CENTER", colors.textMuted);
        drawText(frame, (FRAME_W / 3) * 2, FRAME_H - 70, FRAME_W / 3, 40, "👤\nAccount", 11, "Regular", "CENTER", colors.textMuted);
        break;

      case "filters":
        drawText(frame, 20, 120, FRAME_W - 40, 30, "Sort By", 14, "Bold");
        drawRect(frame, 20, 160, (FRAME_W - 60) / 2, 40, colors.accent, 8, colors.primary);
        drawText(frame, 20, 160, (FRAME_W - 60) / 2, 40, "Proximity (Default)", 12, "Bold", "CENTER", colors.primary);
        drawRect(frame, 30 + (FRAME_W - 60) / 2, 160, (FRAME_W - 60) / 2, 40, colors.white, 8, colors.border);
        drawText(frame, 30 + (FRAME_W - 60) / 2, 160, (FRAME_W - 60) / 2, 40, "Rating (High-Low)", 12, "Regular", "CENTER", colors.textDark);
        drawText(frame, 20, 220, FRAME_W - 40, 30, "Language spoken", 14, "Bold");
        let languages = ["English", "Mandarin", "Hindi", "Cantonese"];
        let langY = 260;
        languages.forEach((lang) => {
          drawRect(frame, 20, langY + 8, 20, 20, colors.white, 4, colors.border);
          drawText(frame, 55, langY, 200, 36, lang, 14, "Regular");
          langY += 45;
        });
        drawText(frame, 20, 460, FRAME_W - 40, 30, "Max Hourly Rate (CAD)", 14, "Bold");
        drawRect(frame, 20, 505, FRAME_W - 40, 6, colors.border, 3);
        drawRect(frame, 20, 505, (FRAME_W - 40) * 0.7, 6, colors.primary, 3);
        drawCircle(frame, 20 + (FRAME_W - 40) * 0.7 - 8, 498, 10, colors.primary);
        drawText(frame, 20, 520, FRAME_W - 40, 20, "$30/hr - $75/hr (Selected: $60/hr)", 12, "Regular", "LEFT", colors.textMuted);
        drawRect(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, colors.primary, 12);
        drawText(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, "Apply Filters", 16, "Bold", "CENTER", colors.white);
        break;

      case "list":
        drawRect(frame, 20, 110, 80, 28, colors.accent, 14, colors.primary);
        drawText(frame, 20, 110, 80, 28, "Scarborough", 11, "Bold", "CENTER", colors.primary);
        drawRect(frame, 110, 110, 70, 28, colors.bgLight, 14, colors.border);
        drawText(frame, 110, 110, 70, 28, "English", 11, "Regular", "CENTER", colors.textMuted);
        let cardY = 155;
        if (screen.items) {
          screen.items.forEach((item) => {
            drawRect(frame, 20, cardY, FRAME_W - 40, 96, colors.white, 12, colors.border);
            drawCircle(frame, 36, cardY + 24, 24, colors.border);
            drawText(frame, 90, cardY + 16, 200, 24, item, 14, "Bold");
            drawText(frame, 90, cardY + 40, 200, 20, "English, Cantonese · 8 yrs exp", 12, "Regular", "LEFT", colors.textMuted);
            drawText(frame, 90, cardY + 60, 200, 20, "⭐⭐⭐⭐⭐ (142 completed)", 11, "Regular", "LEFT", colors.primary);
            drawText(frame, FRAME_W - 50, cardY + 36, 30, 30, "▶", 16, "Bold", "CENTER", colors.primary);
            cardY += 112;
          });
        }
        drawRect(frame, 0, FRAME_H - 80, FRAME_W, 80, colors.white, 0, colors.border);
        drawText(frame, 0, FRAME_H - 70, FRAME_W / 3, 40, "🏠\nHome", 11, "Regular", "CENTER", colors.textMuted);
        drawText(frame, FRAME_W / 3, FRAME_H - 70, FRAME_W / 3, 40, "📅\nBookings", 11, "Bold", "CENTER", colors.primary);
        drawText(frame, (FRAME_W / 3) * 2, FRAME_H - 70, FRAME_W / 3, 40, "👤\nAccount", 11, "Regular", "CENTER", colors.textMuted);
        break;

      case "profile":
        drawRect(frame, 0, 96, FRAME_W, 160, colors.accent, 0);
        drawCircle(frame, (FRAME_W - 96) / 2, 170, 48, colors.primary);
        drawText(frame, (FRAME_W - 96) / 2, 170, 96, 96, "MR", 32, "Bold", "CENTER", colors.white);
        drawText(frame, 20, 280, FRAME_W - 40, 30, "Michael R. (Verified Badged)", 20, "Bold", "CENTER");
        drawText(frame, 20, 310, FRAME_W - 40, 20, "MTO Certified Instructor · Scarborough", 12, "Regular", "CENTER", colors.textMuted);
        drawText(frame, 20, 335, FRAME_W - 40, 20, "⭐⭐⭐⭐⭐ (4.8 rating · 142 bookings)", 13, "Bold", "CENTER", colors.primary);
        drawRect(frame, 20, 370, FRAME_W - 40, 60, colors.bgLight, 12);
        drawText(frame, 20, 370, (FRAME_W - 40) / 3, 60, "$60.00\nHourly Rate", 12, "Bold", "CENTER");
        drawText(frame, 20 + (FRAME_W - 40) / 3, 370, (FRAME_W - 40) / 3, 60, "8 yrs\nExperience", 12, "Bold", "CENTER");
        drawText(frame, 20 + ((FRAME_W - 40) / 3) * 2, 370, (FRAME_W - 40) / 3, 60, "2\nCancellations", 12, "Bold", "CENTER");
        drawText(frame, 20, 450, 100, 24, "Biography", 14, "Bold");
        drawText(frame, 20, 480, FRAME_W - 40, 80, "Hi, I am Michael. I have been an MTO-certified driving instructor in Toronto for 8 years. I specialize in Scarborough and North York test route prep.", 13, "Regular");
        drawText(frame, 20, 580, 200, 24, "Vehicle: Toyota Corolla (Automatic)", 13, "Bold");
        drawRect(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, colors.primary, 12);
        drawText(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, "Select Available Slot", 16, "Bold", "CENTER", colors.white);
        break;

      case "slots":
        let days = ["Mon 22", "Tue 23", "Wed 24", "Thu 25", "Fri 26"];
        let dayX = 20;
        days.forEach((day, index) => {
          let selected = index === 2;
          drawRect(frame, dayX, 115, 60, 50, selected ? colors.primary : colors.bgLight, 8);
          drawText(frame, dayX, 115, 60, 50, day, 11, selected ? "Bold" : "Regular", "CENTER", selected ? colors.white : colors.textDark);
          dayX += 70;
        });
        drawText(frame, 20, 185, 200, 30, "Available Slots for Wed June 24", 14, "Bold");
        let slots = ["09:00 AM - 11:00 AM (2 hrs)", "11:30 AM - 01:30 PM (2 hrs)", "02:00 PM - 04:00 PM (2 hrs)", "04:30 PM - 06:30 PM (2 hrs)"];
        let slotY = 225;
        slots.forEach((slot, index) => {
          let isSelected = index === 0;
          drawRect(frame, 20, slotY, FRAME_W - 40, 56, colors.white, 8, isSelected ? colors.primary : colors.border, isSelected ? 2 : 1);
          drawText(frame, 40, slotY, FRAME_W - 80, 56, slot, 14, isSelected ? "Bold" : "Regular", "LEFT", isSelected ? colors.primary : colors.textDark);
          slotY += 72;
        });
        drawRect(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, colors.primary, 12);
        drawText(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, "Select Pickup Location", 16, "Bold", "CENTER", colors.white);
        break;

      case "map":
        drawRect(frame, 0, 96, FRAME_W, FRAME_H - 240, colors.bgLight);
        let gridLines = 10;
        for (let i = 0; i < gridLines; i++) {
          drawRect(frame, 0, 96 + i * 50, FRAME_W, 1, colors.mapGrid);
          drawRect(frame, i * 40, 96, 1, FRAME_H - 240, colors.mapGrid);
        }
        drawCircle(frame, FRAME_W / 2 - 16, FRAME_H / 2 - 80, 16, colors.primary);
        drawText(frame, FRAME_W / 2 - 16, FRAME_H / 2 - 80, 32, 32, "📍", 18, "Regular", "CENTER");
        drawRect(frame, 20, 115, FRAME_W - 40, 48, colors.white, 12, colors.border);
        drawText(frame, 40, 115, FRAME_W - 80, 48, "🔍 Enter pickup address...", 13, "Regular", "LEFT", colors.textMuted);
        drawRect(frame, 0, FRAME_H - 170, FRAME_W, 170, colors.white, 16, colors.border);
        drawText(frame, 20, FRAME_H - 150, FRAME_W - 40, 20, "📍 SELECTED PICKUP ADDRESS", 11, "Bold", "LEFT", colors.primary);
        drawText(frame, 20, FRAME_H - 130, FRAME_W - 40, 24, "2750 Eglinton Ave E, Scarborough", 14, "Bold");
        drawRect(frame, 20, FRAME_H - 95, FRAME_W - 40, 50, colors.primary, 12);
        drawText(frame, 20, FRAME_H - 95, FRAME_W - 40, 50, "Confirm Location", 16, "Bold", "CENTER", colors.white);
        break;

      case "checkout":
        drawText(frame, 20, 115, FRAME_W - 40, 24, "BOOKING SUMMARY", 12, "Bold", "LEFT", colors.textMuted);
        drawRect(frame, 20, 145, FRAME_W - 40, 80, colors.bgLight, 12);
        drawCircle(frame, 40, 161, 24, colors.primary);
        drawText(frame, 100, 155, 200, 24, "Michael R. (Instructor)", 14, "Bold");
        drawText(frame, 100, 178, 200, 20, "MTO Approved · ⭐ 4.8", 12, "Regular", "LEFT", colors.textMuted);
        let detailY = 245;
        let details = [
          { label: "Date & Time", val: "Wed June 24 at 09:00 AM" },
          { label: "Duration", val: "2 hours (Standard)" },
          { label: "Pickup Address", val: "2750 Eglinton Ave E, Scarborough" },
          { label: "Rate", val: "$60.00 CAD / hr" },
          { label: "Subtotal", val: "$120.00 CAD" },
          { label: "Taxes / Fees", val: "$0.00 CAD" }
        ];
        details.forEach((det) => {
          drawText(frame, 20, detailY, 120, 30, det.label, 13, "Bold", "LEFT", colors.textMuted);
          drawText(frame, 140, detailY, FRAME_W - 160, 30, det.val, 13, "Regular", "RIGHT");
          detailY += 35;
        });
        drawRect(frame, 20, detailY + 10, FRAME_W - 40, 1, colors.border);
        drawText(frame, 20, detailY + 25, 120, 30, "Total Cost", 16, "Bold");
        drawText(frame, 140, detailY + 25, FRAME_W - 160, 30, "$120.00 CAD", 18, "Bold", "RIGHT", colors.primary);
        drawRect(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, colors.primary, 12);
        drawText(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, "Proceed to Payment", 16, "Bold", "CENTER", colors.white);
        break;

      case "details":
        drawText(frame, 20, 115, 200, 24, "BOOKING DB-20250809", 14, "Bold", "LEFT", colors.textMuted);
        drawRect(frame, 20, 145, 96, 28, colors.accentGreen, 14);
        drawText(frame, 20, 145, 96, 28, "Confirmed", 12, "Bold", "CENTER", colors.primary);
        drawRect(frame, 20, 190, FRAME_W - 40, 120, colors.bgLight, 12);
        drawText(frame, 40, 205, 120, 24, "Date", 12, "Bold", "LEFT", colors.textMuted);
        drawText(frame, 40, 225, 200, 24, "Wed June 24 at 9:00 AM", 14, "Bold");
        drawText(frame, 40, 255, 120, 24, "Location", 12, "Bold", "LEFT", colors.textMuted);
        drawText(frame, 40, 275, 300, 24, "2750 Eglinton Ave E, Scarborough", 13, "Bold");
        drawRect(frame, 20, 335, FRAME_W - 40, 180, colors.accent, 12);
        drawText(frame, 40, 410, FRAME_W - 80, 30, "📍 Embedded Map Preview", 14, "Bold", "CENTER", colors.primary);
        let btnY = FRAME_H - 180;
        if (screen.isRequest) {
          drawRect(frame, 20, btnY, (FRAME_W - 55) / 2, 50, colors.primary, 12);
          drawText(frame, 20, btnY, (FRAME_W - 55) / 2, 50, "Accept Request", 14, "Bold", "CENTER", colors.white);
          drawRect(frame, 35 + (FRAME_W - 55) / 2, btnY, (FRAME_W - 55) / 2, 50, colors.white, 12, colors.border);
          drawText(frame, 35 + (FRAME_W - 55) / 2, btnY, (FRAME_W - 55) / 2, 50, "Decline", 14, "Bold", "CENTER", colors.textDark);
        } else {
          drawRect(frame, 20, btnY, FRAME_W - 40, 50, colors.accentRed, 12);
          drawText(frame, 20, btnY, FRAME_W - 40, 50, "Cancel Booking", 16, "Bold", "CENTER", colors.textDark);
          drawRect(frame, 20, btnY + 65, FRAME_W - 40, 50, colors.bgLight, 12);
          drawText(frame, 20, btnY + 65, FRAME_W - 40, 50, "File Dispute / Support Ticket", 14, "Bold", "CENTER", colors.textMuted);
        }
        break;

      case "feedback":
        drawText(frame, 20, 130, FRAME_W - 40, 30, screen.dispute ? "Open a dispute for DB-20250809" : "How was your driving lesson?", 16, "Bold", "CENTER");
        drawText(frame, 20, 160, FRAME_W - 40, 20, screen.dispute ? "Select categories and submit details" : "Please rate Michael R. on standard guidelines.", 12, "Regular", "CENTER", colors.textMuted);
        let selectY = 200;
        if (screen.dispute) {
          let categories = ["Instructor No-Show", "Safety Violation", "Vehicle Issue", "Other Issues"];
          categories.forEach((cat) => {
            drawRect(frame, 20, selectY + 8, 20, 20, colors.white, 4, colors.border);
            drawText(frame, 55, selectY, 200, 36, cat, 13, "Regular");
            selectY += 45;
          });
        } else {
          let starX = (FRAME_W - 220) / 2;
          for (let i = 0; i < 5; i++) {
            drawRect(frame, starX, 210, 36, 36, colors.accent, 6, colors.primary);
            drawText(frame, starX, 210, 36, 36, "⭐", 16, "Regular", "CENTER", colors.primary);
            starX += 45;
          }
          selectY = 270;
        }
        drawText(frame, 20, selectY + 10, FRAME_W - 40, 20, screen.dispute ? "Dispute Description" : "Written Review (Optional)", 12, "Bold", "LEFT", colors.textMuted);
        drawRect(frame, 20, selectY + 35, FRAME_W - 40, 140, colors.bgLight, 8, colors.border);
        drawText(frame, 36, selectY + 35, FRAME_W - 72, 60, "Write your comments here...", 13, "Regular", "LEFT", colors.textMuted);
        drawRect(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, colors.primary, 12);
        drawText(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, "Submit Feedback", 16, "Bold", "CENTER", colors.white);
        break;

      case "message":
        drawCircle(frame, (FRAME_W - 80) / 2, 240, 40, colors.accentGreen);
        drawText(frame, (FRAME_W - 80) / 2, 240, 80, 80, "✔", 36, "Bold", "CENTER", colors.primary);
        drawText(frame, 20, 350, FRAME_W - 40, 30, "Action Complete", 22, "Bold", "CENTER");
        drawText(frame, 40, 395, FRAME_W - 80, 80, screen.msg || "Operation succeeded.", 15, "Regular", "CENTER", colors.textMuted);
        drawRect(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, colors.primary, 12);
        drawText(frame, 20, FRAME_H - 120, FRAME_W - 40, 50, "Return to Dashboard", 16, "Bold", "CENTER", colors.white);
        break;

      case "alert":
        drawRect(frame, 20, 130, FRAME_W - 40, 600, colors.white, 12, colors.border);
        drawRect(frame, 36, 170, FRAME_W - 72, 80, colors.bgLight, 8);
        drawRect(frame, 36, 280, FRAME_W - 72, 140, colors.bgLight, 8);
        drawRect(frame, 0, 0, FRAME_W, FRAME_H, { r: 0.1, g: 0.1, b: 0.1 });
        const overlay = frame.children[frame.children.length - 1];
        overlay.opacity = 0.4;
        const modalW = 320;
        const modalH = 260;
        const modalX = (FRAME_W - modalW) / 2;
        const modalY = (FRAME_H - modalH) / 2;
        drawRect(frame, modalX, modalY, modalW, modalH, colors.white, 16);
        drawCircle(frame, modalX + (modalW - 48) / 2, modalY + 24, 24, colors.accentRed);
        drawText(frame, modalX + (modalW - 48) / 2, modalY + 24, 48, 48, "⚠", 20, "Bold", "CENTER", colors.textDark);
        drawText(frame, modalX + 20, modalY + 80, modalW - 40, 24, screen.alertTitle || "Warning Alert", 16, "Bold", "CENTER");
        drawText(frame, modalX + 24, modalY + 110, modalW - 48, 60, screen.alertText || "Are you sure you want to proceed?", 12, "Regular", "CENTER", colors.textMuted);
        drawRect(frame, modalX + 20, modalY + 190, (modalW - 50) / 2, 44, colors.primary, 8);
        drawText(frame, modalX + 20, modalY + 190, (modalW - 50) / 2, 44, "Confirm", 13, "Bold", "CENTER", colors.white);
        drawRect(frame, modalX + 30 + (modalW - 50) / 2, modalY + 190, (modalW - 50) / 2, 44, colors.bgLight, 8);
        drawText(frame, modalX + 30 + (modalW - 50) / 2, modalY + 190, (modalW - 50) / 2, 44, "Cancel", 13, "Bold", "CENTER", colors.textMuted);
        break;
    }
  }

  // Generates sections and layout
  async function generateJourney(title, screens, bgTint) {
    console.log(`Creating canvas workspace for: ${title}`);
    const sections = {};
    screens.forEach((s) => {
      if (!sections[s.group]) sections[s.group] = [];
      sections[s.group].push(s);
    });

    let currentY = 0;
    for (const [sectionName, groupScreens] of Object.entries(sections)) {
      const rowCount = Math.ceil(groupScreens.length / COLS);
      const sectionW = COLS * (FRAME_W + GAP_X) + SECTION_PAD * 2;
      const sectionH = rowCount * (FRAME_H + GAP_Y) + SECTION_PAD * 2;

      // Section Wrapper Frame
      const sectionFrame = figma.createFrame();
      figma.currentPage.appendChild(sectionFrame);
      sectionFrame.name = `📂 SECTION: ${sectionName}`;
      sectionFrame.x = 0;
      sectionFrame.y = currentY;
      sectionFrame.resize(sectionW, sectionH);
      sectionFrame.fills = [{ type: "SOLID", color: bgTint }];
      sectionFrame.strokes = [{ type: "SOLID", color: colors.border }];
      sectionFrame.strokeWeight = 2;
      sectionFrame.cornerRadius = 24;

      // Section Title label
      drawText(sectionFrame, SECTION_PAD, 24, 600, 48, sectionName, 28, "Bold", "LEFT", colors.primary);

      // Render screens in grid
      groupScreens.forEach((screen, index) => {
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        const screenX = col * (FRAME_W + GAP_X) + SECTION_PAD;
        const screenY = row * (FRAME_H + GAP_Y) + SECTION_PAD + 40;

        // Screen Mockup Frame
        const screenFrame = figma.createFrame();
        sectionFrame.appendChild(screenFrame);
        screenFrame.name = `📱 [${screen.id}] ${screen.title}`;
        screenFrame.x = screenX;
        screenFrame.y = screenY;
        screenFrame.resize(FRAME_W, FRAME_H);
        screenFrame.fills = [{ type: "SOLID", color: colors.white }];
        screenFrame.strokes = [{ type: "SOLID", color: colors.textDark }];
        screenFrame.strokeWeight = 1;
        screenFrame.cornerRadius = 28;

        renderWireframe(screenFrame, screen);
      });
      currentY += sectionH + 200;
    }
  }

  // Generate both journeys
  await generateJourney("DriveBook Student App Wireflow", studentScreens, colors.accent);
  await generateJourney("DriveBook Instructor App Wireflow", instructorScreens, colors.accentGreen);

  console.log("🎉 Generated all 102 wireframes successfully!");
}

main().then(() => figma.closePlugin("DriveBook Wireframes generated successfully!"));
