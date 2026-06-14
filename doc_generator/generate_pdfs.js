const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Define output folders
const rootDir = path.resolve(__dirname, '..', 'documents');
const docDir = path.join(rootDir, 'Project Documentation');
const phaseDir = path.join(rootDir, 'Phase Wise Templets');
const ideationDir = path.join(phaseDir, 'Brainstorming & Ideation Phase');
const planningDir = path.join(phaseDir, 'Project Planning Phase');
const reqDir = path.join(phaseDir, 'Requirement Analysis');
const designDir = path.join(phaseDir, 'Project Design Phase');
const devDir = path.join(phaseDir, 'Project Developement');

// Ensure directories exist
[
  rootDir,
  docDir,
  phaseDir,
  ideationDir,
  planningDir,
  reqDir,
  designDir,
  path.join(designDir, 'Problem - Solution Fit Template'),
  path.join(designDir, 'Proposed Solution'),
  path.join(designDir, 'Solution Architecture'),
  devDir
].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Color Palette
const COLORS = {
  primary: '#1E3A8A',    // Dark Navy
  secondary: '#0D9488',  // Teal
  accent: '#F59E0B',     // Amber
  dark: '#1F2937',       // Charcoal Text
  light: '#F3F4F6',      // Light gray backgrounds
  white: '#FFFFFF',
  border: '#E5E7EB',
  muted: '#6B7280'
};

// Global active document pointer
let doc;

// Common helper functions for drawing PDF content
function drawCoverPage(title, subtitle, phase) {
  // Draw gradient bar at the left
  doc.rect(0, 0, 30, doc.page.height).fill(COLORS.primary);
  doc.rect(30, 0, 10, doc.page.height).fill(COLORS.secondary);

  // Logo icon (vector circles)
  const logoX = 100;
  const logoY = 150;
  doc.circle(logoX, logoY, 25).fill(COLORS.primary);
  doc.circle(logoX + 18, logoY, 15).fill(COLORS.secondary);
  doc.circle(logoX + 28, logoY, 8).fill(COLORS.accent);

  doc.fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .fontSize(14)
     .text('SHOPEZ PLATFORM SUITE', logoX + 50, logoY - 10);

  // Document Phase
  doc.fillColor(COLORS.muted)
     .font('Helvetica-Bold')
     .fontSize(12)
     .text(phase.toUpperCase(), 100, 260);

  // Large Document Title
  doc.fillColor(COLORS.dark)
     .font('Helvetica-Bold')
     .fontSize(28)
     .text(title, 100, 290, { width: 450 });

  // Subtitle
  if (subtitle) {
    doc.fillColor(COLORS.secondary)
       .font('Helvetica')
       .fontSize(14)
       .text(subtitle, 100, 380, { width: 450, lineGap: 4 });
  }

  // Metadata block box
  const metaY = doc.page.height - 185;
  doc.rect(100, metaY, 400, 110).fill(COLORS.light);
  
  doc.fillColor(COLORS.dark)
     .font('Helvetica-Bold')
     .fontSize(9)
     .text('PROJECT NAME:', 120, metaY + 12)
     .font('Helvetica')
     .text('ShopEZ Premium E-Commerce Platform', 240, metaY + 12)
     
     .font('Helvetica-Bold')
     .text('REPOSITORY NAME:', 120, metaY + 30)
     .font('Helvetica')
     .text('VIP-C2-ShopEZ-E-commerce-Application', 240, metaY + 30)

     .font('Helvetica-Bold')
     .text('PREPARED BY:', 120, metaY + 48)
     .font('Helvetica')
     .text('P Pranay', 240, metaY + 48)
     
     .font('Helvetica-Bold')
     .text('DATE:', 120, metaY + 66)
     .font('Helvetica')
     .text('June 2026', 240, metaY + 66)

     .font('Helvetica-Bold')
     .text('VERSION / STATUS:', 120, metaY + 84)
     .font('Helvetica')
     .text('v1.0.0 / Final Approved', 240, metaY + 84);

  doc.addPage();
}

function addPageNumbers(title) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    
    // Suppress on cover page (page index 0)
    if (i === 0) continue;

    // Header
    doc.fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(8)
       .text('SHOPEZ DEVELOPMENT LIFECYCLE', 54, 30)
       .text(title.toUpperCase(), 300, 30, { align: 'right', width: 250 });
    
    doc.moveTo(54, 42).lineTo(doc.page.width - 54, 42).strokeColor(COLORS.border).lineWidth(1).stroke();

    // Footer
    doc.moveTo(54, doc.page.height - 42).lineTo(doc.page.width - 54, doc.page.height - 42).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(8)
       .text('Confidential - ShopEZ Documentation Suite', 54, doc.page.height - 34)
       .text(`Page ${i + 1} of ${range.count}`, 300, doc.page.height - 34, { align: 'right', width: 250 });
  }
}

function drawHeading(text, level) {
  doc.moveDown(1.5);
  if (level === 1) {
    doc.fillColor(COLORS.primary)
       .font('Helvetica-Bold')
       .fontSize(16)
       .text(text)
       .moveDown(0.5);
  } else if (level === 2) {
    doc.fillColor(COLORS.secondary)
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(text)
       .moveDown(0.4);
  } else {
    doc.fillColor(COLORS.dark)
       .font('Helvetica-Bold')
       .fontSize(10)
       .text(text)
       .moveDown(0.3);
  }
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.dark);
}

function drawParagraph(text) {
  doc.fillColor(COLORS.dark)
     .font('Helvetica')
     .fontSize(10)
     .text(text, { align: 'justify', lineGap: 3 })
     .moveDown(0.8);
}

function drawBulletList(items) {
  items.forEach(item => {
    doc.fillColor(COLORS.dark)
       .font('Helvetica')
       .fontSize(10)
       .text('•  ' + item, { indent: 15, lineGap: 2 })
       .moveDown(0.3);
  });
  doc.moveDown(0.5);
}

function drawTable(startX, startY, headers, rows, colWidths) {
  let currentY = startY;
  const rowHeight = 22;

  // Draw Header Background
  doc.rect(startX, currentY, colWidths.reduce((a,b)=>a+b, 0), rowHeight).fill(COLORS.primary);

  // Draw Header Text
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(9);
  let currentX = startX;
  headers.forEach((header, index) => {
    doc.text(header, currentX + 6, currentY + 6, { width: colWidths[index] - 12, align: 'left' });
    currentX += colWidths[index];
  });

  currentY += rowHeight;

  // Draw Rows
  doc.font('Helvetica').fontSize(9);
  rows.forEach((row, rowIndex) => {
    // Alternating rows background
    if (rowIndex % 2 === 1) {
      doc.rect(startX, currentY, colWidths.reduce((a,b)=>a+b, 0), rowHeight).fill(COLORS.light);
    } else {
      doc.rect(startX, currentY, colWidths.reduce((a,b)=>a+b, 0), rowHeight).fill(COLORS.white);
    }

    doc.fillColor(COLORS.dark);
    currentX = startX;
    row.forEach((cell, cellIndex) => {
      doc.text(String(cell), currentX + 6, currentY + 6, { width: colWidths[cellIndex] - 12, align: 'left', lineBreak: false });
      currentX += colWidths[cellIndex];
    });

    // Bottom border for the row
    doc.moveTo(startX, currentY + rowHeight).lineTo(startX + colWidths.reduce((a,b)=>a+b,0), currentY + rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();

    currentY += rowHeight;
  });

  doc.moveDown(1);
}

function drawDiagramContainer(title, height) {
  doc.moveDown(1);
  const startY = doc.y;
  const startX = 54;
  const width = doc.page.width - 108;

  // Draw outer container border
  doc.rect(startX, startY, width, height)
     .fillAndStroke(COLORS.light, COLORS.border);

  // Diagram Title
  doc.fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text(title.toUpperCase(), startX + 15, startY + 12);

  doc.moveDown(1);
  return { startX, startY, width };
}

// ----------------------------------------------------
// PDF 1: FSD Documentation Format.pdf
// ----------------------------------------------------
function buildFsdDocumentationFormat() {
  const title = 'FSD Documentation Format';
  const filePath = path.join(docDir, 'FSD Documentation Format.pdf');
  doc = new PDFDocument({ bufferPages: true, margin: 54 });
  doc.pipe(fs.createWriteStream(filePath));

  drawCoverPage('Functional Specification Document (FSD)', 'System Specifications, Features & Functional Flowcharts', 'Project Documentation');

  drawHeading('1. Project Overview & Scope', 1);
  drawParagraph('The ShopEZ platform is a premium full-stack MERN e-commerce application designed to emulate state-of-the-art consumer shopping marketplaces like Amazon and Flipkart. The application focuses on delivering rich customer experience modules including interactive search autocomplete, responsive visual category mappings, robust multi-step checkout sequences, coupon promotions, user wallets, and direct seller/administrative content controls.');

  drawHeading('1.1 System Actors & Permissions', 2);
  drawBulletList([
    'Guest Visitors: Browse products, search the catalog, filter by attributes, and view product details/FAQ lists.',
    'Registered Customers: Manage personal profiles, select/store multiple delivery addresses, add items to cart and wishlist, apply valid coupon codes, execute payments using simulated wallets or UPI, and track order timeline status.',
    'System Administrators: Full catalog management (CRUD products), order status progression updates, customer status management (toggle block/unblock), coupon management, and analytics tracking.'
  ]);

  drawHeading('2. Detailed System Features', 1);
  drawParagraph('ShopEZ includes several premium modules designed for visual excellence and optimal operational throughput:');
  drawBulletList([
    'Premium UI Aesthetics: Utilizes modern CSS structures, smooth hover animations, and skeleton loaders to bridge the gap during database transactions.',
    'Autocompleting Search Bar: Suggests matching products in real-time as users type, keeping track of local user search histories.',
    'Multi-Step Checkout: Separates address confirmation, order overview with coupon application, and payment simulations (Wallet, UPI, Credit Card, COD).',
    'Administrative Controls: Built-in Chart.js analytics dashboard tracking monthly revenue, category inventory distributions, and active coupon triggers.'
  ]);

  // Diagram: Full System Flowchart
  const { startX, startY } = drawDiagramContainer('System Functional Flowchart Diagram', 180);
  const diagY = startY + 30;

  // Shapes
  doc.rect(startX + 30, diagY + 40, 80, 40).fillAndStroke(COLORS.secondary, COLORS.primary);
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8);
  doc.text('User Logged In', startX + 35, diagY + 55, { width: 70, align: 'center' });

  doc.rect(startX + 150, diagY + 40, 90, 40).fillAndStroke(COLORS.white, COLORS.primary);
  doc.fillColor(COLORS.dark).text('Search / Browse', startX + 155, diagY + 55, { width: 80, align: 'center' });

  doc.rect(startX + 280, diagY + 40, 80, 40).fillAndStroke(COLORS.white, COLORS.primary);
  doc.text('Checkout Wizard', startX + 285, diagY + 55, { width: 70, align: 'center' });

  // Diamond shape for decision (Wallet Payment?)
  const diamondX = startX + 410;
  const diamondY = diagY + 60;
  doc.polygon(
    [diamondX, diamondY - 25], // top
    [diamondX + 45, diamondY], // right
    [diamondX, diamondY + 25], // bottom
    [diamondX - 45, diamondY]  // left
  ).fillAndStroke(COLORS.accent, COLORS.primary);
  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(8);
  doc.text('Wallet Pay?', diamondX - 30, diamondY - 5, { width: 60, align: 'center' });

  // Connectors
  doc.strokeColor(COLORS.primary).lineWidth(1.5);
  doc.moveTo(startX + 110, diagY + 60).lineTo(startX + 150, diagY + 60).stroke();
  doc.moveTo(startX + 240, diagY + 60).lineTo(startX + 280, diagY + 60).stroke();
  doc.moveTo(startX + 360, diagY + 60).lineTo(diamondX - 45, diagY + 60).stroke();

  // Yes arrow down
  doc.moveTo(diamondX, diamondY + 25).lineTo(diamondX, diamondY + 60).lineTo(startX + 400, diagY + 120).stroke();
  doc.rect(startX + 350, diagY + 120, 100, 25).fillAndStroke(COLORS.light, COLORS.primary);
  doc.fillColor(COLORS.dark).text('Wallet Deduct & Seed', startX + 355, diagY + 128);

  doc.y = startY + 195; // reset cursor after diagram

  addPageNumbers(title);
  doc.end();
}

// ----------------------------------------------------
// PDF 2: Brainstorming- Idea Generation- Prioritizaation Template.pdf
// ----------------------------------------------------
function buildBrainstormingTemplate() {
  const title = 'Brainstorming & Prioritization Template';
  const filePath = path.join(ideationDir, 'Brainstorming- Idea Generation- Prioritizaation Template.pdf');
  doc = new PDFDocument({ bufferPages: true, margin: 54 });
  doc.pipe(fs.createWriteStream(filePath));

  drawCoverPage('Brainstorming, Idea Generation & Prioritization', 'Feature Mapping, Evaluation Metrics & Core Innovations', 'Brainstorming & Ideation Phase');

  drawHeading('1. Core Idea Log & Concept Generation', 1);
  drawParagraph('The primary objective during initial ideation sessions was identifying the critical shortcomings of typical vanilla e-commerce websites and developing robust, premium features for ShopEZ:');
  drawBulletList([
    'Simulated Wallet System: Provides an immediate sandbox credit wallet loaded with Rs. 500 per customer to facilitate seamless transaction testing and mock purchases.',
    'Administrative Activity Control: Empowers administrators to lock and block suspicious users in real time. Features a custom endpoint validation blocking active user API tokens.',
    'JSON Database Fallback: Prevents app-level failure when connection to local MongoDB is severed. Dynamically falls back to read-only operation parsing local mock database configurations.',
    'Indian Rupee Localization: Complete translation of pricing structures from standard USD formats to localized INR calculations, matching realistic Indian merchant profiles.'
  ]);

  drawHeading('2. Feature Prioritization Matrix', 1);
  drawParagraph('Features were evaluated on business value (Customer wow factor) versus execution complexity (development duration):');
  
  const headers = ['Feature Name', 'Target User Benefit', 'Complexity (1-5)', 'Priority Score'];
  const rows = [
    ['INR Pricing Localization', 'Seamless conversion values & currency tags', '2', 'High (P0)'],
    ['Wallet Transaction Log', 'Mock wallet billing operations', '3', 'High (P0)'],
    ['Admin User Blocking', 'Real-time database authorization restriction', '3', 'Medium (P1)'],
    ['JSON Database Fallback', 'High Availability database failover protection', '4', 'Medium (P1)'],
    ['Category Megamenu Circle', 'Premium, visually stunning navigation', '2', 'High (P0)']
  ];
  drawTable(54, doc.y, headers, rows, [130, 200, 90, 80]);

  // Diagram: Mind Map
  const { startX, startY } = drawDiagramContainer('Feature Mind Map Diagram', 180);
  const centerBoxX = startX + 180;
  const centerBoxY = startY + 70;

  // Center Node
  doc.rect(centerBoxX, centerBoxY, 120, 40).fillAndStroke(COLORS.secondary, COLORS.primary);
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(9);
  doc.text('ShopEZ Core Ideas', centerBoxX + 10, centerBoxY + 15, { width: 100, align: 'center' });

  // Branch 1 (Wallet)
  doc.rect(startX + 20, centerBoxY - 40, 100, 30).fillAndStroke(COLORS.white, COLORS.primary);
  doc.fillColor(COLORS.dark).font('Helvetica').fontSize(8);
  doc.text('Wallet & UPI Sandbox', startX + 25, centerBoxY - 30);
  doc.moveTo(centerBoxX, centerBoxY + 10).lineTo(startX + 120, centerBoxY - 25).stroke();

  // Branch 2 (JSON DB Fallback)
  doc.rect(startX + 20, centerBoxY + 50, 100, 30).fillAndStroke(COLORS.white, COLORS.primary);
  doc.text('Local DB Fallback', startX + 25, centerBoxY + 60);
  doc.moveTo(centerBoxX, centerBoxY + 30).lineTo(startX + 120, centerBoxY + 65).stroke();

  // Branch 3 (Admin Control)
  doc.rect(startX + 350, centerBoxY - 40, 100, 30).fillAndStroke(COLORS.white, COLORS.primary);
  doc.text('Token Block Middleware', startX + 355, centerBoxY - 30);
  doc.moveTo(centerBoxX + 120, centerBoxY + 10).lineTo(startX + 350, centerBoxY - 25).stroke();

  // Branch 4 (Aesthetic UI)
  doc.rect(startX + 350, centerBoxY + 50, 100, 30).fillAndStroke(COLORS.white, COLORS.primary);
  doc.text('Responsive Megamenu', startX + 355, centerBoxY + 60);
  doc.moveTo(centerBoxX + 120, centerBoxY + 30).lineTo(startX + 350, centerBoxY + 65).stroke();

  doc.y = startY + 195;

  addPageNumbers(title);
  doc.end();
}

// ----------------------------------------------------
// PDF 3: Define Problem Statements Template.pdf
// ----------------------------------------------------
function buildDefineProblemStatementsTemplate() {
  const title = 'Define Problem Statements Template';
  const filePath = path.join(ideationDir, 'Define Problem Statements Template.pdf');
  doc = new PDFDocument({ bufferPages: true, margin: 54 });
  doc.pipe(fs.createWriteStream(filePath));

  drawCoverPage('Define Problem Statements Template', 'Customer Pain Points, System Friction & Core Architecture Problems', 'Brainstorming & Ideation Phase');

  drawHeading('1. Core Problem Definitions', 1);
  drawParagraph('Standard e-commerce deployments suffer from systemic issues in usability, localized payment setups, and high-availability failure modes. Below are the key problems defined for ShopEZ:');
  
  drawHeading('Problem 1: Foreign Currency Confusion (Usability)', 2);
  drawParagraph('Most development templates default to US Dollar pricing ($). For domestic Indian shoppers, displaying prices in USD leads to cognitive load, currency conversion concerns, and cart abandonment.');

  drawHeading('Problem 2: Fatal Database Disconnection Failures (High Availability)', 2);
  drawParagraph('If a local MongoDB database drops offline due to network limits or memory bottlenecks, typical MERN apps crash. Users are met with catastrophic loading spinner hangs or raw network stack errors.');

  drawHeading('Problem 3: Simple, Flat User Interface Layout (Engagement)', 2);
  drawParagraph('Basic grids without promotional banners, deals, animations, or sliding carousels look unpolished, leading to low visitor retention and poor user engagement.');

  // Diagram: Venn Diagram / Problem Canvas
  const { startX, startY } = drawDiagramContainer('Problem Statement Venn Diagram', 180);
  const diagX = startX + 150;
  const diagY = startY + 95;

  // Intersecting circles
  doc.strokeColor(COLORS.primary).lineWidth(2);
  doc.circle(diagX, diagY, 55).stroke();
  doc.circle(diagX + 80, diagY, 55).stroke();

  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(8);
  doc.text('USER PAIN', diagX - 45, diagY - 20, { width: 50, align: 'center' });
  doc.font('Helvetica').text('Currency confusion\nStale layouts\nSlow checks', diagX - 50, diagY - 5, { width: 60, align: 'center' });

  doc.fillColor(COLORS.secondary).font('Helvetica-Bold');
  doc.text('TECH RISK', diagX + 70, diagY - 20, { width: 50, align: 'center' });
  doc.font('Helvetica').text('DB crashing\nStatic seeding\nSecurity flaws', diagX + 65, diagY - 5, { width: 60, align: 'center' });

  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(9);
  doc.text('ShopEZ\nTarget\nFocus', diagX + 25, diagY - 20, { width: 35, align: 'center' });

  doc.y = startY + 195;

  addPageNumbers(title);
  doc.end();
}

// ----------------------------------------------------
// PDF 4: Empathy Map Canvas.pdf
// ----------------------------------------------------
function buildEmpathyMapCanvas() {
  const title = 'Empathy Map Canvas';
  const filePath = path.join(ideationDir, 'Empathy Map Canvas.pdf');
  doc = new PDFDocument({ bufferPages: true, margin: 54 });
  doc.pipe(fs.createWriteStream(filePath));

  drawCoverPage('Empathy Map Canvas', 'Understanding the Customer Persona (Rahul) & Platform Admin Persona', 'Brainstorming & Ideation Phase');

  drawHeading('1. Customer Empathy Mapping (Persona: Rahul)', 1);
  drawParagraph('Understanding the mindset of a typical domestic Indian online shopper helps focus UX developments:');

  const headers = ['Dimension', 'Customer Persona (Rahul) Observations'];
  const rows = [
    ['SAYS', '"I want to buy accessories in Indian Rupees and check out instantly without typing card details."'],
    ['THINKS', '"Is this site secure? Are these discount coupon percentages calculated automatically? Is COD available?"'],
    ['DOES', 'Enters coupon codes, filters by category chips, loads up wallet balance, views order delivery estimates.'],
    ['FEELS', 'Excited by the autocompletion suggestions, reassured by the transparent timeline status tracking.']
  ];
  drawTable(54, doc.y, headers, rows, [100, 400]);

  // Diagram: Empathy Map Grid
  const { startX, startY } = drawDiagramContainer('Persona Empathy Map Canvas Layout', 180);
  const midX = startX + widthOffset(doc.page.width) / 2;
  const midY = startY + 95;
  const boxW = 180;
  const boxH = 55;

  // Grid Lines
  doc.strokeColor(COLORS.border).lineWidth(2);
  doc.moveTo(midX - 220, midY).lineTo(midX + 220, midY).stroke();
  doc.moveTo(midX, midY - 65).lineTo(midX, midY + 65).stroke();

  // Draw Quadrants
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(10);
  doc.text('SAYS (EXTERNAL)', midX - 210, midY - 55);
  doc.fillColor(COLORS.dark).font('Helvetica').fontSize(8)
     .text('"Can I apply the coupon FLASHSALE30 directly?"', midX - 210, midY - 40, { width: boxW });

  doc.fillColor(COLORS.primary).font('Helvetica-Bold')
     .text('THINKS (INTERNAL)', midX + 15, midY - 55);
  doc.fillColor(COLORS.dark).font('Helvetica').fontSize(8)
     .text('"Hope the wallet payment updates the product stock immediately."', midX + 15, midY - 40, { width: boxW });

  doc.fillColor(COLORS.primary).font('Helvetica-Bold')
     .text('DOES (BEHAVIOR)', midX - 210, midY + 15);
  doc.fillColor(COLORS.dark).font('Helvetica').fontSize(8)
     .text('Filters by "Beauty & Grooming" category, adds item variations to cart.', midX - 210, midY + 30, { width: boxW });

  doc.fillColor(COLORS.primary).font('Helvetica-Bold')
     .text('FEELS (EMOTIONS)', midX + 15, midY + 15);
  doc.fillColor(COLORS.dark).font('Helvetica').fontSize(8)
     .text('Anxious about checkouts but relieved by step-by-step wizard.', midX + 15, midY + 30, { width: boxW });

  doc.y = startY + 195;

  addPageNumbers(title);
  doc.end();
}

function widthOffset(w) {
  return w - 108;
}

// ----------------------------------------------------
// PDF 5: Project Planning Template.pdf
// ----------------------------------------------------
function buildProjectPlanningTemplate() {
  const title = 'Project Planning Template';
  const filePath = path.join(planningDir, 'Project Planning Template.pdf');
  doc = new PDFDocument({ bufferPages: true, margin: 54 });
  doc.pipe(fs.createWriteStream(filePath));

  drawCoverPage('Project Planning & Risk Matrix', 'Development Lifecycles, Timelines, Milestones & Mitigation Strategies', 'Project Planning Phase');

  drawHeading('1. Project Milestones & Phase Lifecycles', 1);
  drawParagraph('The ShopEZ development plan follows an iterative MERN architecture roadmap designed to deploy features systematically:');
  drawBulletList([
    'Phase 1: Brainstorming & Requirement Specification (Days 1 - 3)',
    'Phase 2: Database Schema Refinement & Model extensions (Days 4 - 6)',
    'Phase 3: Backend REST API Controller Development & Router configuration (Days 7 - 9)',
    'Phase 4: Frontend Component Integration & State management setup (Days 10 - 14)',
    'Phase 5: User Acceptance Testing (UAT) & Performance optimization (Days 15 - 17)'
  ]);

  drawHeading('2. Risk Assessment & Management Matrix', 1);
  const headers = ['Identified Risk', 'Impact Level', 'Likelihood', 'Mitigation Strategy'];
  const rows = [
    ['MongoDB Database crash', 'Critical', 'Low', 'Deploy JSON fallback helper to read mock local collections.'],
    ['Third-party payment failures', 'High', 'Medium', 'Use mock client-side Wallet and UPI QR simulator.'],
    ['Slow image loading checks', 'Medium', 'Medium', 'Cache recent category imagery and use Unsplash CDNs.'],
    ['Token hijacking vulnerability', 'High', 'Low', 'Add active customer token check middleware. Admin blocking.']
  ];
  drawTable(54, doc.y, headers, rows, [140, 70, 70, 220]);

  // Diagram: Gantt Chart
  const { startX, startY } = drawDiagramContainer('Project Timeline Gantt Chart', 180);
  const barX = startX + 100;
  const barY = startY + 45;

  // Labels
  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(8);
  doc.text('Ideation', startX + 10, barY + 5);
  doc.text('DB Modeling', startX + 10, barY + 30);
  doc.text('API Development', startX + 10, barY + 55);
  doc.text('UI / Context', startX + 10, barY + 80);
  doc.text('UAT / Deploy', startX + 10, barY + 105);

  // Bars
  doc.rect(barX, barY, 60, 15).fill(COLORS.secondary);
  doc.rect(barX + 50, barY + 25, 80, 15).fill(COLORS.accent);
  doc.rect(barX + 120, barY + 50, 100, 15).fill(COLORS.primary);
  doc.rect(barX + 210, barY + 75, 120, 15).fill(COLORS.secondary);
  doc.rect(barX + 320, barY + 100, 60, 15).fill(COLORS.accent);

  doc.y = startY + 195;

  addPageNumbers(title);
  doc.end();
}

// ----------------------------------------------------
// PDF 6: Requirement Analysis Template.pdf
// ----------------------------------------------------
function buildRequirementAnalysisTemplate() {
  const title = 'Requirement Analysis Template';
  const filePath = path.join(reqDir, 'Requirement Analysis Template.pdf');
  doc = new PDFDocument({ bufferPages: true, margin: 54 });
  doc.pipe(fs.createWriteStream(filePath));

  drawCoverPage('Requirement Analysis Document (RAD)', 'Functional Specs, Performance Limits & Traceability Matrices', 'Requirement Analysis');

  drawHeading('1. Core Functional Requirements', 1);
  drawParagraph('The features implemented in ShopEZ represent complex, production-grade logic partitioned into primary epics:');
  
  drawHeading('Epic A: Core Catalog & Merchandising', 2);
  drawBulletList([
    'FR-1: Real-time title matching query for client autocomplete inputs.',
    'FR-2: Dynamic category grids navigating user straight to specific collection links.',
    'FR-3: Item variations (sizes, color, storage) rendering specific stock check checks.'
  ]);

  drawHeading('Epic B: Secure Checkouts & Wallet Systems', 2);
  drawBulletList([
    'FR-4: Coupon calculations logic deducting flat or percentage savings (e.g. coupon Welcome10).',
    'FR-5: Customer sandbox wallet subtracting balance on checkout submit.',
    'FR-6: Timeline steps displaying Processing -> Packed -> Shipped -> Out for Delivery -> Delivered.'
  ]);

  drawHeading('2. Non-Functional Performance Limits', 1);
  drawBulletList([
    'Security: User token blacklisting via blocked middleware inside Express server routes.',
    'Availability: Failover response from local JSON files when connection to main MongoDB fails.',
    'Portability: Responsive, device-agnostic interface styled via vanilla CSS parameters.'
  ]);

  // Diagram: Requirement Traceability Matrix
  const { startX, startY } = drawDiagramContainer('Requirement Verification Mapping Matrix', 180);
  const matrixHeaders = ['Req ID', 'Feature Name', 'UAT Test Scenario', 'Status'];
  const matrixRows = [
    ['FR-1', 'Search Autocomplete', 'Enter text in navbar search and assert suggests', 'Verified'],
    ['FR-3', 'Product Variations', 'Choose Size/Color and assert cart item contains choice', 'Verified'],
    ['FR-4', 'Coupon Deductions', 'Apply FLASHSALE30 and assert 30% savings calculated', 'Verified'],
    ['FR-5', 'Sandbox Wallet Pay', 'Assert user wallet balance decreases by order total', 'Verified']
  ];
  doc.y = startY + 35; // move table start down
  drawTable(startX + 15, doc.y, matrixHeaders, matrixRows, [60, 130, 200, 70]);

  doc.y = startY + 195;

  addPageNumbers(title);
  doc.end();
}

// ----------------------------------------------------
// PDF 7: Problem - Solution Fit Template v1.pdf
// ----------------------------------------------------
function buildProblemSolutionFitTemplate() {
  const title = 'Problem - Solution Fit Template';
  const filePath = path.join(designDir, 'Problem - Solution Fit Template', 'Problem - Solution Fit Template v1.pdf');
  doc = new PDFDocument({ bufferPages: true, margin: 54 });
  doc.pipe(fs.createWriteStream(filePath));

  drawCoverPage('Problem - Solution Fit Template v1', 'Addressing E-Commerce Challenges through Target Engineering Solutions', 'Project Design Phase');

  drawHeading('1. Problem - Solution Fit Mapping', 1);
  drawParagraph('This document maps out how the specific features designed in the ShopEZ Premium application address the targeted user frustration points:');

  const headers = ['Identified Pain Point', 'ShopEZ Engineering Solution', 'Impact / Success Metric'];
  const rows = [
    ['USD Currency displays confuse users', 'Localized INR symbols & price calculations', 'Increased cart conversion rates'],
    ['Static, uninspiring layouts', 'Category chips grids & sliding hero banner', 'Higher customer interaction levels'],
    ['Database disconnect breaks user experience', 'Built-in local JSON DB data fallback', '99.9% application-level uptime'],
    ['Suspicious activities or fraud', 'Token block auth middleware in Express', 'Instant user status revoking capabilities'],
    ['Manual checkout card friction', 'Mock sandbox wallet & UPI QR payments code', 'Reduced time-to-purchase during test flows']
  ];
  drawTable(54, doc.y, headers, rows, [145, 200, 155]);

  // Diagram: Problem-Solution Canvas
  const { startX, startY } = drawDiagramContainer('Problem - Solution Fit Canvas', 180);
  const midX = startX + widthOffset(doc.page.width) / 2;
  const boxY = startY + 45;

  // Draw Boxes
  doc.rect(startX + 15, boxY, 210, 110).fillAndStroke(COLORS.white, COLORS.primary);
  doc.rect(midX + 10, boxY, 210, 110).fillAndStroke(COLORS.white, COLORS.primary);

  // Content for left box (Customer Problems)
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(9)
     .text('CUSTOMER PROBLEMS / FRICTION', startX + 25, boxY + 10);
  doc.fillColor(COLORS.dark).font('Helvetica').fontSize(8)
     .text('1. USD pricing formats confuse users.\n2. Database disconnect crashes checkout.\n3. Flat page layouts reduce page views.', startX + 25, boxY + 30, { width: 190, lineGap: 4 });

  // Content for right box (Product Solutions)
  doc.fillColor(COLORS.primary).font('Helvetica-Bold')
     .text('platform SOLUTIONS / FIT', midX + 20, boxY + 10);
  doc.fillColor(COLORS.dark).font('Helvetica').fontSize(8)
     .text('1. Complete INR localization metrics.\n2. Automated JSON database fallback.\n3. Beautiful category circles & banners.', midX + 20, boxY + 30, { width: 190, lineGap: 4 });

  doc.y = startY + 195;

  addPageNumbers(title);
  doc.end();
}

// ----------------------------------------------------
// PDF 8: Proposed Solution.pdf
// ----------------------------------------------------
function buildProposedSolution() {
  const title = 'Proposed Solution';
  const filePath = path.join(designDir, 'Proposed Solution', 'Proposed Solution Template.pdf');
  doc = new PDFDocument({ bufferPages: true, margin: 54 });
  doc.pipe(fs.createWriteStream(filePath));

  drawCoverPage('Proposed Platform Solution Blueprint', 'System Components, Logic Workflows & High-Level Execution Specifications', 'Project Design Phase');

  drawHeading('1. Core Proposed Architecture', 1);
  drawParagraph('The proposed solution replaces static e-commerce operations with a highly dynamic, failure-tolerant architecture:');
  drawBulletList([
    'Frontend Interface: Single Page Application built on React with Vite. Styled with vanilla CSS. Leverages CartContext and AuthContext to handle state changes dynamically.',
    'Backend Server: Express-Node API gateway handling security routing, file uploading using Multer, JSON data fallbacks, and JWT validation checks.',
    'Database Layer: MongoDB instance holding model collections. Equipped with a custom JSON reader fallback to ensure stable catalog rendering if database connectivity drops.'
  ]);

  drawHeading('2. Process Integration Workflows', 1);
  drawParagraph('The system workflow guides the user seamlessly through navigation, cart operations, variant selection, and payment transactions, while checking block status parameters dynamically on each request.');

  // Diagram: Proposed Solution Flowchart
  const { startX, startY } = drawDiagramContainer('Proposed Solution Sequence Flow', 180);
  const flowY = startY + 35;

  doc.rect(startX + 10, flowY + 30, 90, 40).fillAndStroke(COLORS.white, COLORS.primary);
  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(8)
     .text('1. User Profile', startX + 15, flowY + 45, { width: 80, align: 'center' });

  doc.rect(startX + 130, flowY + 30, 90, 40).fillAndStroke(COLORS.white, COLORS.primary);
  doc.text('2. API Block check', startX + 135, flowY + 45, { width: 80, align: 'center' });

  doc.rect(startX + 250, flowY + 30, 90, 40).fillAndStroke(COLORS.white, COLORS.primary);
  doc.text('3. DB fallback validation', startX + 255, flowY + 45, { width: 80, align: 'center' });

  doc.rect(startX + 370, flowY + 30, 90, 40).fillAndStroke(COLORS.white, COLORS.primary);
  doc.text('4. Wallet Deduct', startX + 375, flowY + 45, { width: 80, align: 'center' });

  // Connectors
  doc.strokeColor(COLORS.primary).lineWidth(1.5);
  doc.moveTo(startX + 100, flowY + 50).lineTo(startX + 130, flowY + 50).stroke();
  doc.moveTo(startX + 220, flowY + 50).lineTo(startX + 250, flowY + 50).stroke();
  doc.moveTo(startX + 340, flowY + 50).lineTo(startX + 370, flowY + 50).stroke();

  doc.y = startY + 195;

  addPageNumbers(title);
  doc.end();
}

// ----------------------------------------------------
// PDF 9: Solution Architecture.pdf
// ----------------------------------------------------
function buildSolutionArchitecture() {
  const title = 'Solution Architecture';
  const filePath = path.join(designDir, 'Solution Architecture', 'Solution Architecture.pdf');
  doc = new PDFDocument({ bufferPages: true, margin: 54 });
  doc.pipe(fs.createWriteStream(filePath));

  drawCoverPage('Solution Architecture Document', 'Data Models, API Endpoints, Middlewares & Tier Architecture Diagrams', 'Project Design Phase');

  drawHeading('1. Database Layer Models & Relations', 1);
  drawParagraph('The Mongo database is configured with 4 key collections designed with strict validations:');
  drawBulletList([
    'User Schema: Holds authentication data (name, email, password), address entries, blocked indicator flag, wishlist references, and current sandbox wallet balance.',
    'Product Schema: Stores item descriptors (brand, category, brand name), variants, prices (originalPrice, localized converted INR calculations), reviews, and FAQs.',
    'Coupon Schema: Manages code strings, discount properties, expiration limits, and target restrictions.',
    'Order Schema: Records tracking status tags, item variant specs, address choice, and coupon details.'
  ]);

  drawHeading('2. API Gateway Endpoints', 1);
  const headers = ['Method', 'Endpoint Route', 'Auth Level', 'Description'];
  const rows = [
    ['GET', '/api/products', 'Public', 'Fetch product catalog with page details'],
    ['GET', '/api/products/:id/related', 'Public', 'Fetch related products'],
    ['POST', '/api/coupons/apply', 'User Token', 'Validate coupon code discount'],
    ['PUT', '/api/auth/customers/:id/block', 'Admin Token', 'Toggle active customer block status'],
    ['PUT', '/api/orders/:id/status', 'Admin Token', 'Step forward order tracking stage']
  ];
  drawTable(54, doc.y, headers, rows, [60, 160, 95, 185]);

  // Diagram: Solution Architecture Layers
  const { startX, startY } = drawDiagramContainer('System Solution Architecture Layers', 180);
  const layerY = startY + 35;
  const layerW = doc.page.width - 138; // subtract margins

  // Layer 1: Client
  doc.rect(startX + 15, layerY + 20, layerW, 25).fillAndStroke(COLORS.secondary, COLORS.primary);
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8)
     .text('PRESENTATION TIER: React SPA Client (CartContext / AuthContext / Megamenu)', startX + 25, layerY + 28);

  // Layer 2: API
  doc.rect(startX + 15, layerY + 55, layerW, 25).fillAndStroke(COLORS.white, COLORS.primary);
  doc.fillColor(COLORS.dark)
     .text('LOGIC TIER: Node-Express API (Auth / Block check / Multer upload middleware)', startX + 25, layerY + 63);

  // Layer 3: Data Tier
  doc.rect(startX + 15, layerY + 90, layerW, 25).fillAndStroke(COLORS.accent, COLORS.primary);
  doc.fillColor(COLORS.dark)
     .text('DATA TIER: MongoDB Collections (Products / Orders) + Local JSON DB Failover Fallback', startX + 25, layerY + 98);

  doc.y = startY + 195;

  addPageNumbers(title);
  doc.end();
}

// ----------------------------------------------------
// PDF 10: User Acceptance Testing FSD.pdf
// ----------------------------------------------------
function buildUserAcceptanceTestingTemplate() {
  const title = 'User Acceptance Testing FSD';
  const filePath = path.join(devDir, 'User Acceptance Testing FSD.pdf');
  doc = new PDFDocument({ bufferPages: true, margin: 54 });
  doc.pipe(fs.createWriteStream(filePath));

  drawCoverPage('User Acceptance Testing (UAT) Specifications', 'Testing Scenarios, Execution Metrics & Assert Results log', 'Project Developement');

  drawHeading('1. UAT Execution Scope', 1);
  drawParagraph('User Acceptance Testing asserts that the application behaves exactly as expected during critical user operations. Testing scenarios map out all client-to-backend transactional features:');
  
  drawHeading('Test Scenario 1: Authentication & Block Checking', 2);
  drawParagraph('Assert that a blocked user is immediately logged out of their session. Verify that subsequent API requests are rejected with a 403 Forbidden validation status code.');

  drawHeading('Test Scenario 2: Checkout Wallet & Coupon Calculation', 2);
  drawParagraph('Assert that applying coupon FESTIVAL20 validates correctly against cart subtotal value. Verify that selecting Wallet payment decreases user balance and immediately updates product inventories.');

  drawHeading('2. UAT TestCase Matrix Log', 1);
  const headers = ['Test Case ID', 'Scenario Detail', 'Expected Result', 'Pass/Fail'];
  const rows = [
    ['UAT-TC-1', 'Input search query "laptop"', 'Autocomplete suggestions dropdown opens', 'PASS'],
    ['UAT-TC-2', 'Apply Welcome10 Coupon', 'Cart subtotal displays 10% deduction values', 'PASS'],
    ['UAT-TC-3', 'Order payment with wallet', 'Wallet decreases, order status: Processing', 'PASS'],
    ['UAT-TC-4', 'Admin blocks customer token', 'Customer session revoked, api: 403 status', 'PASS'],
    ['UAT-TC-5', 'Sever DB local connection', 'Fallback reads products from json dataset', 'PASS']
  ];
  drawTable(54, doc.y, headers, rows, [70, 150, 210, 70]);

  // Diagram: UAT Journey flow
  const { startX, startY } = drawDiagramContainer('UAT User Test Journey sequence', 180);
  const journeyY = startY + 35;

  doc.rect(startX + 10, journeyY + 40, 80, 35).fillAndStroke(COLORS.white, COLORS.primary);
  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(7)
     .text('1. Add Variations', startX + 15, journeyY + 52, { width: 70, align: 'center' });

  doc.rect(startX + 100, journeyY + 40, 80, 35).fillAndStroke(COLORS.white, COLORS.primary);
  doc.text('2. Apply Welcome10', startX + 105, journeyY + 52, { width: 70, align: 'center' });

  doc.rect(startX + 190, journeyY + 40, 80, 35).fillAndStroke(COLORS.white, COLORS.primary);
  doc.text('3. Choose Wallet Pay', startX + 195, journeyY + 52, { width: 70, align: 'center' });

  doc.rect(startX + 280, journeyY + 40, 85, 35).fillAndStroke(COLORS.white, COLORS.primary);
  doc.text('4. Check Timeline Status', startX + 285, journeyY + 52, { width: 75, align: 'center' });

  doc.rect(startX + 375, journeyY + 40, 80, 35).fillAndStroke(COLORS.secondary, COLORS.primary);
  doc.fillColor(COLORS.white)
     .text('5. Order Success', startX + 380, journeyY + 52, { width: 70, align: 'center' });

  // Arrows
  doc.strokeColor(COLORS.primary).lineWidth(1.5);
  doc.moveTo(startX + 90, journeyY + 57).lineTo(startX + 100, journeyY + 57).stroke();
  doc.moveTo(startX + 180, journeyY + 57).lineTo(startX + 190, journeyY + 57).stroke();
  doc.moveTo(startX + 270, journeyY + 57).lineTo(startX + 280, journeyY + 57).stroke();
  doc.moveTo(startX + 365, journeyY + 57).lineTo(startX + 375, journeyY + 57).stroke();

  doc.y = startY + 195;

  addPageNumbers(title);
  doc.end();
}

// ----------------------------------------------------
// Execution Orchestrator
// ----------------------------------------------------
function main() {
  console.log('Starting PDF generation suite for ShopEZ...');
  try {
    buildFsdDocumentationFormat();
    console.log('Generated: FSD Documentation Format.pdf');

    buildBrainstormingTemplate();
    console.log('Generated: Brainstorming- Idea Generation- Prioritizaation Template.pdf');

    buildDefineProblemStatementsTemplate();
    console.log('Generated: Define Problem Statements Template.pdf');

    buildEmpathyMapCanvas();
    console.log('Generated: Empathy Map Canvas.pdf');

    buildProjectPlanningTemplate();
    console.log('Generated: Project Planning Template.pdf');

    buildRequirementAnalysisTemplate();
    console.log('Generated: Requirement Analysis Template.pdf');

    buildProblemSolutionFitTemplate();
    console.log('Generated: Problem - Solution Fit Template v1.pdf');

    buildProposedSolution();
    console.log('Generated: Proposed Solution Template.pdf');

    buildSolutionArchitecture();
    console.log('Generated: Solution Architecture.pdf');

    buildUserAcceptanceTestingTemplate();
    console.log('Generated: User Acceptance Testing FSD.pdf');

    console.log('Successfully completed PDF generation.');
  } catch (error) {
    console.error('Error generating PDF documentation:', error);
    process.exit(1);
  }
}

// Execute
main();
