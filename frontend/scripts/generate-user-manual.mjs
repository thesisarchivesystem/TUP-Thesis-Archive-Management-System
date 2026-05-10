import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const outputPath = path.join(repoRoot, 'docs', 'TUP-Thesis-Archive-User-Manual.pdf');

const colors = {
  ink: rgb(0.13, 0.08, 0.08),
  muted: rgb(0.42, 0.34, 0.33),
  lightMuted: rgb(0.6, 0.5, 0.5),
  accent: rgb(0.55, 0.14, 0.2),
  accentDark: rgb(0.35, 0.08, 0.13),
  cream: rgb(0.98, 0.95, 0.91),
  line: rgb(0.88, 0.8, 0.78),
  white: rgb(1, 1, 1),
};

const manual = [
  {
    title: '1. System Overview',
    body: [
      'The TUP Thesis Archive Management System is a web-based repository for managing thesis submissions, archived manuscripts, student and faculty activity, academic structure records, support tickets, and Best Thesis appointments.',
      'The system is divided into public pages and authenticated role-based portals. Each role only sees the pages and actions assigned to that role. Protected pages redirect unauthenticated users back to the homepage or the correct sign-in page.',
    ],
    bullets: [
      'Public users can browse the homepage and sign in as Student, Faculty, or Admin.',
      'Students can upload theses, track submissions, browse archived theses, favorite items, request extensions, send messages, and manage profile/support pages.',
      'Faculty can review submissions, manage thesis records, share department files, communicate with students, view activity logs, and manage advisees.',
      'Chairpersons have the additional Best Thesis module for appointing one Best Thesis per school year.',
      'Admins manage users, academic structures, categories, thesis records, support tickets, activity logs, and system configuration.',
    ],
  },
  {
    title: '2. Access, Accounts, and Security',
    body: [
      'Users sign in through role-specific pages. Student and Faculty users use the public sign-in choices; Admin users use the admin login page. The system keeps users within their allowed area and prevents cross-role access.',
    ],
    bullets: [
      'Inactive accounts are automatically signed out when the system detects that the account has been disabled.',
      'Forgot password and reset password pages are available for account recovery.',
      'The Remember Me option keeps the session active according to the configured authentication behavior.',
      'Users should sign out from shared devices and protect account credentials.',
      'Only administrators can create, edit, disable, or assign roles to user accounts.',
    ],
  },
  {
    title: '3. Shared Interface Features',
    body: [
      'Most authenticated pages share the same navigation pattern: sidebar links, top search, notification/message controls, profile menu, light/dark mode, and a color theme picker.',
    ],
    bullets: [
      'Global search supports title, author, adviser, department, program, school year, category, and keywords when available.',
      'The color wheel changes the selected accent color across dashboards, homepage, and sign-in pages.',
      'Light and dark mode can be toggled from the top bar or sign-in pages.',
      'The chatbot can answer general guidance questions about navigating the system.',
      'Dashboard cards include recently added theses, top searches, favorites, and Best Thesis highlights when records are available.',
    ],
  },
  {
    title: '4. Student Role Manual',
    body: [
      'Students use the system mainly to submit thesis work, track review status, browse archived research, and communicate with faculty or support.',
    ],
    table: {
      headers: ['Area', 'Student Actions', 'Notes and Limits'],
      rows: [
        ['Dashboard', 'View stats, Best Thesis carousel, favorites, recently added theses, top searches, and all theses.', 'Favorites display up to five items on the dashboard; View All opens the full list.'],
        ['Categories', 'Browse thesis records by category and open category detail pages.', 'Only records available to the student role are shown.'],
        ['Upload Thesis', 'Submit thesis title, authors, abstract, category, program/department details, files, and required confirmations.', 'Incomplete forms or missing confirmation statements prevent submission.'],
        ['My Submissions', 'Track submitted thesis records and open submission details.', 'Status may include pending, under review, revision needed, approved, rejected, or archived depending on workflow.'],
        ['Extension Request', 'Request more time when revisions are required.', 'Requests are subject to faculty review and approval.'],
        ['Messages', 'Communicate with faculty or other allowed contacts.', 'Messaging depends on available configured recipients.'],
        ['Profile, About, Support, Terms', 'Manage profile information, read help pages, create support requests, and review terms.', 'Some profile fields may be controlled by admin records.'],
      ],
    },
  },
  {
    title: '5. Faculty Role Manual',
    body: [
      'Faculty accounts support thesis review, thesis management, advising, file sharing, search, and communication. Faculty users may have a faculty role of Adviser, Chairperson, or Dean/Head. The faculty role affects what modules are visible.',
    ],
    table: {
      headers: ['Area', 'Faculty Actions', 'Notes and Limits'],
      rows: [
        ['Dashboard', 'View workload summaries, Best Thesis highlights, favorites, recently added theses, top searches, and all theses.', 'Content is filtered according to role and available thesis records.'],
        ['Categories and Search', 'Browse and search thesis records.', 'Search results depend on available indexed fields and permissions.'],
        ['Add Files', 'Upload and share department learning or reference files.', 'Files may be shared by scope such as all departments, specific department, college, or users.'],
        ['Manage Thesis - Add Thesis', 'Create thesis records from the faculty side.', 'Required fields and manuscript files must be provided.'],
        ['Manage Thesis - Approved Theses', 'View approved records.', 'Only available records are shown.'],
        ['Manage Thesis - In Archive', 'View archived thesis records.', 'Archived status is required for archive listings.'],
        ['Manage Thesis - Review Submissions', 'Review student submissions and extension requests.', 'Review actions should follow department policy.'],
        ['Activity Log', 'Track faculty-related events and actions.', 'Logs are system-generated.'],
        ['My Advisees', 'View advisee records and related activity.', 'Available only when advisees are assigned or linked.'],
        ['My Submissions', 'View thesis records created or associated with the faculty account.', 'Visibility depends on ownership and role configuration.'],
      ],
    },
  },
  {
    title: '6. Chairperson Best Thesis Module',
    body: [
      'The Best Thesis tab appears only for faculty users whose faculty role is Chairperson. This module lets the chairperson appoint one Best Thesis for a selected school year.',
    ],
    bullets: [
      'School Year choices are based on distinct school_year values stored in the theses database.',
      'When a school year is selected, the Eligible Thesis dropdown updates to approved archived theses from the chairperson department for that year.',
      'Only one thesis can be appointed as Best Thesis per school year.',
      'Changing the Best Thesis replaces the current appointment for that school year.',
      'The current appointment appears in the Current Status and Current Appointment cards.',
      'Best Thesis History lists School Year, Title, Authors, Adviser, Status, and Date.',
      'Appointed records appear in dashboard Best Thesis carousels and reports where the feature is displayed.',
    ],
  },
  {
    title: '7. Admin Role Manual',
    body: [
      'Admins manage the operational backbone of the system. The admin portal includes dashboard monitoring, thesis management, user management, academic structure management, categories, support tickets, and activity review.',
    ],
    table: {
      headers: ['Admin Area', 'Admin Actions', 'Notes and Limits'],
      rows: [
        ['Dashboard', 'View system metrics, recent activity, and administrative summaries.', 'Data reflects records currently stored in the database.'],
        ['Thesis Management', 'View, filter, add, edit, and open thesis records; mark/unmark Best Thesis from the edit modal.', 'The Best column displays a star for records appointed as Best Thesis.'],
        ['User Management', 'Create and manage student, faculty, and admin users; set faculty role as Adviser, Chairperson, or Dean/Head.', 'Disabled users are blocked from continuing active sessions.'],
        ['Program Management', 'Manage colleges, departments, programs, chairpersons, deans/heads, descriptions, contacts, and related details.', 'Chairperson and Dean/Head user roles can be reflected in program management records.'],
        ['Categories', 'Create and manage thesis categories used in submissions and browsing.', 'Changing categories affects future organization and filtering.'],
        ['Tickets', 'Review and manage support tickets.', 'Ticket handling depends on internal support procedures.'],
        ['Recent Activity', 'View system activity and audit-style events.', 'Logs are for monitoring and accountability.'],
        ['About, Support, Terms', 'Access administrative help and policy pages.', 'Content should be kept updated with institutional policy.'],
      ],
    },
  },
  {
    title: '8. Thesis Status and Workflow',
    body: [
      'Thesis records move through statuses based on submission and review activity. Exact review decisions depend on faculty/admin action and department rules.',
    ],
    bullets: [
      'Pending or Under Review: the submission has not yet reached final approval.',
      'Revision Needed: the student should revise the submission; extension request features may apply.',
      'Approved: the thesis passed review and can be managed further.',
      'Rejected: the thesis did not pass review; rejection reason or remarks may be shown where available.',
      'Archived: the thesis is in the archive and can appear in archive, browse, search, and Best Thesis candidate lists when eligible.',
    ],
  },
  {
    title: '9. Searching, Browsing, and Favorites',
    body: [
      'The system provides several discovery tools for research access. Users can browse by category, search from top bars, inspect thesis details, and save favorites.',
    ],
    bullets: [
      'Search can match title, authors, adviser, keywords, department, program, school year, and category when fields are available.',
      'Category pages show thesis records grouped by research category.',
      'Thesis detail pages show available metadata and links to files/details where permitted.',
      'Dashboard favorite strips are horizontally scrollable and limited to five visible cards before View All appears.',
      'Best Thesis cards can be swiped or advanced through carousel navigation when multiple school years exist.',
    ],
  },
  {
    title: '10. Messages, Notifications, and Support',
    body: [
      'Communication tools are included to reduce off-system coordination. Users should still follow department rules for formal approvals and deadlines.',
    ],
    bullets: [
      'Messages allow role-appropriate communication between users.',
      'Notifications alert users to relevant events and unread activity.',
      'Support pages and tickets are used for help requests, bug reports, or access issues.',
      'Activity logs help faculty and admins trace important actions.',
    ],
  },
  {
    title: '11. Limitations and Rules',
    body: [
      'The system enforces role-based visibility and several business rules. Some limits are intentional safeguards to keep academic records consistent.',
    ],
    bullets: [
      'Users cannot access pages outside their role.',
      'The Faculty Best Thesis tab is only visible to Chairperson faculty accounts.',
      'Only one Best Thesis can exist for each school year.',
      'Best Thesis candidates must be approved and archived, and for chairpersons are limited to the chairperson department.',
      'Dropdown choices depend on database values; inconsistent school_year, department, or program spelling can affect filtering.',
      'Deleted or disabled accounts may affect ownership, adviser, or awarded-by display names.',
      'Uploaded files must satisfy the configured form requirements and server file rules.',
      'The chatbot provides guidance but does not replace official review, approval, or administrative decisions.',
      'Color theme changes are local user preferences and do not alter database records.',
    ],
  },
  {
    title: '12. Troubleshooting',
    body: [
      'If something does not appear as expected, use the checks below before escalating to an administrator or developer.',
    ],
    bullets: [
      'Cannot sign in: verify the correct role sign-in page, password, and whether the account is active.',
      'Best Thesis year missing: confirm that a thesis record exists with that school_year value.',
      'Best Thesis candidate missing: confirm the thesis is approved, archived, in the selected school year, and in the chairperson department.',
      'Faculty Best Thesis tab missing: confirm the faculty_role is Chairperson.',
      'Program chair/dean missing: confirm faculty users have Chairperson or Dean/Head role and are assigned to the correct department/college.',
      'Submission cannot be saved: review required fields, authors, category, program, file attachment, and confirmation checkboxes.',
      'Theme color does not change: refresh the page and confirm local storage is enabled in the browser.',
    ],
  },
  {
    title: '13. Recommended Operating Practices',
    body: [
      'For clean records and fewer support issues, administrators and department staff should follow consistent data-entry practices.',
    ],
    bullets: [
      'Use consistent school year formats such as 2026 or 2025-2026 across thesis records.',
      'Keep department and program names aligned with Program Management.',
      'Assign faculty roles carefully because Chairperson unlocks Best Thesis privileges.',
      'Review user accounts regularly and disable accounts that should no longer access the system.',
      'Archive only records that are ready for public/repository discovery.',
      'Use activity logs when investigating unexpected changes.',
    ],
  },
];

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function sanitize(text) {
  return String(text).replace(/[–—]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/•/g, '-');
}

const pdf = await PDFDocument.create();
pdf.setTitle('TUP Thesis Archive Management System User Manual');
pdf.setAuthor('TUP Thesis Archive Management System');
pdf.setSubject('Role-based user manual, actions, limitations, and feature guide');
pdf.setKeywords(['TUP', 'Thesis Archive', 'User Manual', 'Student', 'Faculty', 'Admin']);
pdf.setCreationDate(new Date('2026-05-10T00:00:00+08:00'));

const font = await pdf.embedFont(StandardFonts.Helvetica);
const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);

const pageSize = [612, 792];
const margin = 54;
let page;
let y;
let pageNumber = 0;

function addPage() {
  page = pdf.addPage(pageSize);
  pageNumber += 1;
  y = pageSize[1] - margin;

  page.drawText('TUP Thesis Archive Management System', {
    x: margin,
    y: 28,
    size: 8,
    font,
    color: colors.lightMuted,
  });
  page.drawText(String(pageNumber), {
    x: pageSize[0] - margin - 10,
    y: 28,
    size: 8,
    font,
    color: colors.lightMuted,
  });
}

function ensureSpace(height) {
  if (y - height < margin + 28) {
    addPage();
  }
}

function drawWrapped(text, options = {}) {
  const size = options.size ?? 10;
  const activeFont = options.font ?? font;
  const color = options.color ?? colors.ink;
  const x = options.x ?? margin;
  const width = options.width ?? pageSize[0] - (margin * 2);
  const lineHeight = options.lineHeight ?? size + 4;
  const lines = wrapText(sanitize(text), activeFont, size, width);
  ensureSpace(lines.length * lineHeight + 4);
  for (const line of lines) {
    page.drawText(line, { x, y, size, font: activeFont, color });
    y -= lineHeight;
  }
}

function drawParagraph(text) {
  drawWrapped(text, { size: 10.2, lineHeight: 15, color: colors.muted });
  y -= 5;
}

function drawBullet(text) {
  const bulletX = margin + 8;
  const textX = margin + 22;
  const width = pageSize[0] - margin - textX;
  const lines = wrapText(sanitize(text), font, 9.6, width);
  ensureSpace(lines.length * 14 + 4);
  page.drawText('-', { x: bulletX, y, size: 10, font: bold, color: colors.accent });
  for (const line of lines) {
    page.drawText(line, { x: textX, y, size: 9.6, font, color: colors.ink });
    y -= 14;
  }
  y -= 2;
}

function drawTable(table) {
  const availableWidth = pageSize[0] - (margin * 2);
  const colWidth = availableWidth / table.headers.length;
  const cellPadding = 6;
  const headerHeight = 24;
  ensureSpace(headerHeight + 20);
  page.drawRectangle({
    x: margin,
    y: y - headerHeight + 6,
    width: availableWidth,
    height: headerHeight,
    color: colors.cream,
    borderColor: colors.line,
    borderWidth: 0.5,
  });
  table.headers.forEach((header, index) => {
    page.drawText(sanitize(header), {
      x: margin + (index * colWidth) + cellPadding,
      y: y - 10,
      size: 8.5,
      font: bold,
      color: colors.accentDark,
    });
  });
  y -= headerHeight;

  for (const row of table.rows) {
    const wrapped = row.map((cell) => wrapText(sanitize(cell), font, 8.4, colWidth - (cellPadding * 2)));
    const rowHeight = Math.max(28, Math.max(...wrapped.map((lines) => lines.length)) * 12 + 12);
    ensureSpace(rowHeight + 6);
    page.drawRectangle({
      x: margin,
      y: y - rowHeight + 6,
      width: availableWidth,
      height: rowHeight,
      borderColor: colors.line,
      borderWidth: 0.4,
    });
    wrapped.forEach((lines, index) => {
      let cellY = y - 8;
      for (const line of lines) {
        page.drawText(line, {
          x: margin + (index * colWidth) + cellPadding,
          y: cellY,
          size: 8.4,
          font,
          color: colors.ink,
        });
        cellY -= 12;
      }
    });
    y -= rowHeight;
  }
  y -= 12;
}

addPage();
page.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: pageSize[1], color: colors.cream });
page.drawRectangle({ x: 0, y: 0, width: 162, height: pageSize[1], color: colors.accent });
page.drawRectangle({ x: 0, y: 0, width: 28, height: pageSize[1], color: colors.accentDark });
page.drawText('TUP', { x: 54, y: 690, size: 24, font: serif, color: colors.white });
page.drawText('Thesis Archive', { x: 190, y: 610, size: 36, font: serif, color: colors.ink });
page.drawText('Management System', { x: 190, y: 570, size: 28, font: serif, color: colors.accent });
page.drawText('User Manual', { x: 190, y: 510, size: 18, font: bold, color: colors.ink });
page.drawText('Roles, actions, limitations, workflows, and feature guide', {
  x: 190,
  y: 486,
  size: 11,
  font,
  color: colors.muted,
});
page.drawText('Prepared: May 10, 2026', { x: 190, y: 438, size: 10, font, color: colors.muted });
page.drawText('For Students, Faculty, Chairpersons, Dean/Head users, and System Admins', {
  x: 190,
  y: 420,
  size: 10,
  font,
  color: colors.muted,
});

addPage();
page.drawText('Table of Contents', { x: margin, y, size: 22, font: serif, color: colors.ink });
y -= 32;
manual.forEach((section, index) => {
  ensureSpace(18);
  page.drawText(`${index + 1}. ${section.title.replace(/^\d+\.\s*/, '')}`, {
    x: margin,
    y,
    size: 10.5,
    font,
    color: colors.ink,
  });
  y -= 18;
});

for (const section of manual) {
  addPage();
  page.drawText(section.title, { x: margin, y, size: 18, font: serif, color: colors.accentDark });
  y -= 28;

  for (const paragraph of section.body ?? []) {
    drawParagraph(paragraph);
  }

  for (const bullet of section.bullets ?? []) {
    drawBullet(bullet);
  }

  if (section.table) {
    drawTable(section.table);
  }
}

addPage();
page.drawText('Quick Reference by Role', { x: margin, y, size: 20, font: serif, color: colors.accentDark });
y -= 30;
const quickReference = [
  ['Public Visitor', 'Open homepage, review system information, choose Student/Faculty/Admin sign-in, change homepage color theme.'],
  ['Student', 'Upload thesis, view submissions, request extensions, browse/search/favorite theses, message, support, profile.'],
  ['Faculty Adviser', 'Review submissions, manage thesis records, advisees, files, activity, messaging, support.'],
  ['Chairperson', 'All faculty actions plus Best Thesis appointment per school year.'],
  ['Dean/Head', 'Faculty role used by program management and administrative reporting; visible actions depend on assigned portal permissions.'],
  ['Admin', 'Manage users, roles, structures, categories, theses, support tickets, activity, and Best Thesis from thesis edit.'],
];
for (const [role, actions] of quickReference) {
  ensureSpace(48);
  page.drawText(role, { x: margin, y, size: 12, font: bold, color: colors.accent });
  y -= 16;
  drawWrapped(actions, { x: margin + 16, width: pageSize[0] - (margin * 2) - 16, size: 9.5, lineHeight: 13 });
  y -= 8;
}

const bytes = await pdf.save();
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, bytes);
console.log(outputPath);
