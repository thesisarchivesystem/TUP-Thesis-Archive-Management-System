import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const docsDir = path.join(repoRoot, 'docs');
const pdfOutputPath = path.join(docsDir, 'TUP-Thesis-Archive-User-Manual.pdf');
const markdownOutputPath = path.join(docsDir, 'TUP-Thesis-Archive-User-Manual.md');
const logoPath = path.join(repoRoot, 'frontend', 'public', 'tup.png');
const botPath = path.join(repoRoot, 'frontend', 'src', 'assets', 'tams-bot.png');

const preparedDate = 'May 10, 2026';

const colors = {
  ink: rgb(0.12, 0.09, 0.08),
  muted: rgb(0.38, 0.34, 0.32),
  lightMuted: rgb(0.63, 0.56, 0.52),
  accent: rgb(0.55, 0.12, 0.18),
  accentDark: rgb(0.32, 0.06, 0.09),
  gold: rgb(0.78, 0.55, 0.18),
  green: rgb(0.12, 0.38, 0.31),
  cream: rgb(0.98, 0.95, 0.9),
  soft: rgb(0.99, 0.98, 0.96),
  line: rgb(0.86, 0.78, 0.74),
  white: rgb(1, 1, 1),
};

const manual = [
  {
    title: '1. Introduction',
    body: [
      'The TUP Thesis Archive Management System is a web-based archive for thesis submission, review, storage, discovery, support, and administrative monitoring.',
      'This manual is written for students, faculty members, chairpersons, deans or heads, and system administrators. It follows the system navigation and labels used in the current application.',
    ],
    bullets: [
      'Public visitors can open the homepage and choose the correct sign-in portal.',
      'Students can upload theses, track submissions, browse the archive, save favorites, request extensions, send messages, and create support tickets.',
      'Faculty users can review submissions, add thesis records, manage archive records, share files, communicate with students, and view activity logs.',
      'Chairperson faculty accounts can appoint one Best Thesis per school year.',
      'System administrators can manage users, thesis records, categories, academic structures, support tickets, and recent activity.',
    ],
  },
  {
    title: '2. Getting Started',
    body: [
      'Open the system in a supported browser, then select the proper sign-in option. Use only the account type assigned to you by the institution.',
    ],
    table: {
      headers: ['User Type', 'Sign-In Area', 'First Page After Login'],
      rows: [
        ['Student', 'Student sign-in from the homepage', 'Student Dashboard'],
        ['Faculty', 'Faculty sign-in from the homepage', 'Faculty Dashboard'],
        ['Admin', 'Admin Login', 'Admin Dashboard'],
      ],
    },
    steps: [
      'Go to the system homepage.',
      'Choose Student, Faculty, or Admin sign-in.',
      'Enter your registered email and password.',
      'Use Remember Me only on a private device.',
      'After signing in, confirm that your name and role appear in the profile area.',
    ],
    notes: [
      'If an account is disabled by an administrator, the system automatically signs the user out.',
      'Use Forgot Password or Reset Password when account recovery is needed.',
    ],
  },
  {
    title: '3. Shared Screen Controls',
    body: [
      'Authenticated pages share a similar application shell. The exact menu items change by role, but the main controls remain consistent.',
    ],
    table: {
      headers: ['Control', 'Purpose', 'Where It Appears'],
      rows: [
        ['Sidebar', 'Move between dashboard, categories, thesis work areas, and help pages.', 'Student, Faculty, Admin'],
        ['Search Bar', 'Search thesis records, authors, advisers, departments, programs, school years, categories, or keywords when available.', 'Top bar'],
        ['Messages', 'Open role-appropriate conversations.', 'Student and Faculty top bar'],
        ['Notifications', 'Review recent alerts and open related records.', 'Top bar'],
        ['Theme Toggle', 'Switch between light and dark mode.', 'Top bar and sign-in areas'],
        ['Color Theme Picker', 'Change the accent color used by the dashboard and archive interface.', 'Page toolbar'],
        ['Profile Menu', 'Open profile options or sign out.', 'Top bar'],
        ['Archie Assistant', 'Ask general questions about uploads, reviews, archive access, and support.', 'Student and Faculty dashboards'],
      ],
    },
  },
  {
    title: '4. Student Portal',
    body: [
      'Students use the portal to submit thesis work, monitor review progress, explore archived research, and contact faculty or support.',
    ],
    table: {
      headers: ['Menu', 'What Students Can Do', 'Important Notes'],
      rows: [
        ['Home', 'View dashboard summaries, Best Thesis highlights, recently added theses, top searches, all theses, and favorites.', 'Dashboard lists are summaries; View All opens the complete page when available.'],
        ['Categories', 'Browse thesis records by category and open category detail pages.', 'Only available records for the student role are shown.'],
        ['Upload Thesis', 'Submit thesis metadata, authors, abstract, category, program details, manuscript files, and confirmations.', 'Required fields and confirmations must be completed before submission.'],
        ['My Submissions', 'Track submitted theses and open submission detail pages.', 'Status may include pending, under review, revision needed, approved, rejected, or archived.'],
        ['Extension Request', 'Request additional time when revision deadlines apply.', 'Extension requests are reviewed by faculty.'],
        ['Messages', 'Communicate with allowed faculty or system users.', 'Recipients depend on configured records and permissions.'],
        ['Profile', 'Review and update available personal profile information.', 'Some fields may be controlled by administrative records.'],
        ['Support', 'Create a support concern and attach evidence when needed.', 'Use clear subjects and include screenshots for technical issues.'],
      ],
    },
    steps: [
      'To upload a thesis, open Upload Thesis.',
      'Fill in the title, authors, abstract, school year, program or department, adviser, keywords, and category information.',
      'Attach the required thesis file or related documents.',
      'Read and check the confirmation statements.',
      'Submit the form and monitor the record from My Submissions.',
    ],
  },
  {
    title: '5. Student Submission Status',
    body: [
      'The submission status shows where a thesis is in the review process. Always read faculty remarks or revision notes when they are available.',
    ],
    table: {
      headers: ['Status', 'Meaning', 'Recommended Action'],
      rows: [
        ['Pending or Under Review', 'The thesis has been submitted and is awaiting or undergoing review.', 'Wait for updates and check notifications.'],
        ['Revision Needed', 'The reviewer requires changes before approval.', 'Open the submission details, read remarks, revise the document, and request an extension if needed.'],
        ['Approved', 'The thesis passed review.', 'Monitor whether it is archived or needs final processing.'],
        ['Rejected', 'The thesis did not pass review.', 'Review the reason and coordinate with the adviser or department.'],
        ['Archived', 'The thesis is stored in the archive and can appear in archive discovery areas when allowed.', 'No action is usually required.'],
      ],
    },
  },
  {
    title: '6. Faculty Portal',
    body: [
      'Faculty users manage academic review and archive-related tasks. The available functions depend on the faculty account and assigned faculty role.',
    ],
    table: {
      headers: ['Menu', 'What Faculty Can Do', 'Important Notes'],
      rows: [
        ['Home', 'View workload summaries, Best Thesis highlights, favorites, recently added theses, top searches, and all theses.', 'Content is filtered by available records and permissions.'],
        ['Categories', 'Browse thesis records by category.', 'Category detail pages show related thesis records.'],
        ['Best Thesis', 'Appoint a Best Thesis for a selected school year.', 'Visible only to Chairperson faculty accounts.'],
        ['Add Files', 'Upload and share reference files with departments, colleges, or selected users.', 'Use correct sharing scope to avoid exposing files to unintended users.'],
        ['Manage Thesis - Add Thesis', 'Create thesis records directly from the faculty portal.', 'Required metadata and files must be complete.'],
        ['Manage Thesis - Approved Theses', 'View approved thesis records.', 'Used for records that have passed review.'],
        ['Manage Thesis - In Archive Theses', 'View archived thesis records.', 'Archived records are available for archive workflows.'],
        ['Manage Thesis - Review Submissions', 'Review student submissions and extension requests.', 'Review decisions should follow department policy.'],
        ['Activity Log', 'View faculty-related system actions.', 'Logs are system-generated.'],
        ['My Advisees', 'View assigned advisee information.', 'Available records depend on advising links.'],
        ['My Submissions', 'View thesis records created by or associated with the faculty account.', 'Visibility depends on ownership and role configuration.'],
      ],
    },
  },
  {
    title: '7. Chairperson Best Thesis Module',
    body: [
      'The Best Thesis module is restricted to faculty users whose faculty role is Chairperson. It is used to appoint one recognized thesis per school year.',
    ],
    steps: [
      'Open Best Thesis from the Faculty sidebar.',
      'Select the School Year.',
      'Choose an eligible thesis from the Eligible Thesis dropdown.',
      'Review the current status and appointment information.',
      'Save the appointment.',
    ],
    bullets: [
      'School year choices come from thesis records already stored in the system.',
      'Eligible thesis records must be approved and archived.',
      'Chairperson candidate lists are limited to the chairperson department.',
      'Only one Best Thesis can be active per school year.',
      'Changing the appointment replaces the existing Best Thesis for that school year.',
      'Best Thesis records can appear in dashboard highlights and administrative thesis views.',
    ],
  },
  {
    title: '8. Administrator Portal',
    body: [
      'Administrators maintain the operational records of the system. Admin access should be limited to authorized personnel because changes affect users, academic structures, categories, thesis records, and support handling.',
    ],
    table: {
      headers: ['Menu', 'Admin Tasks', 'Notes'],
      rows: [
        ['Dashboard', 'View system metrics, recent activity, and administrative summaries.', 'The top search can locate thesis and related records.'],
        ['Thesis', 'View, filter, open, add, edit, archive, and manage thesis records.', 'Best Thesis indicators are visible where records are marked.'],
        ['Users', 'Create, edit, disable, and manage student, faculty, and admin accounts.', 'Faculty role assignment affects visible faculty modules.'],
        ['Program', 'Manage colleges, departments, programs, chairpersons, deans or heads, descriptions, and contact details.', 'Keep naming consistent because thesis filters depend on these values.'],
        ['Categories', 'Create and manage thesis categories used in submission and browsing.', 'Category changes affect organization and filtering.'],
        ['Tickets', 'Search, filter, view, update status, open attachments, and add admin resolution notes.', 'Statuses include Open, In Progress, Resolved, and Closed.'],
        ['Recent Activity', 'Review system events for monitoring and accountability.', 'Use activity logs when investigating unexpected changes.'],
        ['About, Support, Terms', 'Review help and policy pages from the admin portal.', 'Institutional policy text should be kept current.'],
      ],
    },
  },
  {
    title: '9. Ticket Management',
    body: [
      'Support tickets collect issues or requests submitted by students and faculty. Admins can manage the ticket list and add resolution notes.',
    ],
    steps: [
      'Open Tickets from the Admin sidebar.',
      'Use the search field to find a ticket by reference, requester, email, category, subject, or message.',
      'Filter by status or change the sort order when needed.',
      'Select View to open the ticket details modal.',
      'Review requester information, concern details, attachments, and existing admin notes.',
      'Add a note, then mark the ticket In Progress or Resolved when appropriate.',
    ],
  },
  {
    title: '10. Searching, Browsing, and Favorites',
    body: [
      'The archive is designed for discovery. Users can search from the top bar, browse by categories, open thesis details, and save favorite theses.',
    ],
    bullets: [
      'Search may match thesis title, authors, adviser, department, program, school year, category, and keywords.',
      'Category pages group thesis records by research area.',
      'Thesis detail pages show available metadata and file access controls.',
      'Favorite thesis records appear in dashboard favorites and the dedicated Favorites page.',
      'Recently Added and Top Searches provide quick access to current archive activity.',
    ],
  },
  {
    title: '11. Messages, Notifications, and Archie',
    body: [
      'Communication features reduce off-system coordination but do not replace official academic policies, deadlines, and approval rules.',
    ],
    bullets: [
      'Messages support role-appropriate conversations.',
      'Notifications alert users about relevant updates and can link to related records.',
      'Admins use recent activity notifications to monitor system changes.',
      'Archie, the Archive Assistant, can answer general navigation and workflow questions.',
      'Archie is guidance only and does not approve submissions, change records, or replace official review decisions.',
    ],
  },
  {
    title: '12. Data Rules and Limitations',
    body: [
      'The system enforces several rules to keep academic records consistent and protect access.',
    ],
    bullets: [
      'Users cannot access pages outside their assigned role.',
      'Inactive accounts are signed out and blocked from continuing active sessions.',
      'The Faculty Best Thesis tab is visible only to Chairperson accounts.',
      'Only one Best Thesis can exist for each school year.',
      'Best Thesis candidates must be approved and archived.',
      'Dropdown choices depend on database values, so inconsistent school year, department, program, or category spelling can affect filtering.',
      'Uploaded files must satisfy configured form and server requirements.',
      'Color theme changes are local preferences and do not alter database records.',
    ],
  },
  {
    title: '13. Troubleshooting',
    body: [
      'Use the checks below before escalating a concern. If the problem continues, create a support ticket with details and an attachment when possible.',
    ],
    table: {
      headers: ['Issue', 'Possible Cause', 'What To Do'],
      rows: [
        ['Cannot sign in', 'Wrong portal, incorrect credentials, or disabled account.', 'Use the correct role sign-in page, reset the password if needed, or contact an admin.'],
        ['Submission will not save', 'Required fields, file attachment, category, authors, or confirmations are incomplete.', 'Review the form and complete all required items.'],
        ['Best Thesis tab missing', 'Faculty account is not assigned the Chairperson role.', 'Ask an admin to verify the faculty role.'],
        ['Best Thesis year missing', 'No thesis record exists for that school year value.', 'Confirm that thesis records use the expected school year format.'],
        ['Best Thesis candidate missing', 'The thesis is not approved, not archived, outside the department, or in a different school year.', 'Check the thesis status, department, and school year.'],
        ['Program chair/dean missing', 'Faculty role or academic structure assignment is incomplete.', 'Verify User Management and Program records.'],
        ['Search results seem incomplete', 'Metadata or category values are inconsistent.', 'Check spelling and record fields in thesis management.'],
        ['Theme does not persist', 'Browser storage is blocked or cleared.', 'Enable local browser storage or reselect the theme.'],
      ],
    },
  },
  {
    title: '14. Recommended Practices',
    body: [
      'Consistent data entry makes the archive easier to search, manage, and audit.',
    ],
    bullets: [
      'Use one school year format consistently, such as 2025-2026.',
      'Keep department, program, and college names aligned with Program Management.',
      'Assign faculty roles carefully because Chairperson unlocks Best Thesis privileges.',
      'Review accounts regularly and disable accounts that should no longer have access.',
      'Archive only records that are ready for repository discovery.',
      'Use support tickets and activity logs when investigating problems.',
      'Attach screenshots to support tickets when reporting visual, upload, or access issues.',
    ],
  },
  {
    title: '15. Visual Reference Appendix',
    body: [
      'The manual generator includes a visual-reference appendix for system screenshots. Authenticated screenshots were not embedded automatically because they require valid local accounts and application data. The placeholders below identify the recommended screenshots to insert when preparing a final printed copy.',
    ],
    screenshotPlaceholders: [
      'Homepage with role sign-in choices',
      'Student Dashboard',
      'Student Upload Thesis form',
      'Student My Submissions details page',
      'Faculty Dashboard',
      'Faculty Review Submissions page',
      'Chairperson Best Thesis page',
      'Admin Dashboard',
      'Admin Thesis Management page',
      'Admin Ticket Management modal',
    ],
  },
];

function sanitize(text) {
  return String(text)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/[•]/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

function escapeMarkdownCell(text) {
  return sanitize(text).replace(/\|/g, '\\|');
}

function buildMarkdown() {
  const lines = [
    '# TUP Thesis Archive Management System User Manual',
    '',
    `Prepared: ${preparedDate}`,
    '',
    'For Students, Faculty, Chairpersons, Dean/Head users, and System Admins.',
    '',
    '## Table of Contents',
    '',
    ...manual.map((section) => `- ${section.title}`),
    '',
  ];

  for (const section of manual) {
    lines.push(`## ${section.title}`, '');
    for (const paragraph of section.body ?? []) lines.push(sanitize(paragraph), '');
    if (section.steps) {
      section.steps.forEach((step, index) => lines.push(`${index + 1}. ${sanitize(step)}`));
      lines.push('');
    }
    if (section.bullets) {
      section.bullets.forEach((bullet) => lines.push(`- ${sanitize(bullet)}`));
      lines.push('');
    }
    if (section.notes) {
      lines.push('Notes:', '');
      section.notes.forEach((note) => lines.push(`- ${sanitize(note)}`));
      lines.push('');
    }
    if (section.table) {
      lines.push(`| ${section.table.headers.map(escapeMarkdownCell).join(' | ')} |`);
      lines.push(`| ${section.table.headers.map(() => '---').join(' | ')} |`);
      for (const row of section.table.rows) {
        lines.push(`| ${row.map(escapeMarkdownCell).join(' | ')} |`);
      }
      lines.push('');
    }
    if (section.screenshotPlaceholders) {
      section.screenshotPlaceholders.forEach((label, index) => {
        lines.push(`Figure ${index + 1}: ${sanitize(label)} - insert screenshot here.`);
      });
      lines.push('');
    }
  }

  return `${lines.join('\n')}\n`;
}

function wrapText(text, font, size, maxWidth) {
  const words = sanitize(text).split(/\s+/).filter(Boolean);
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

async function optionalPng(pdf, imagePath) {
  try {
    const bytes = await fs.readFile(imagePath);
    return await pdf.embedPng(bytes);
  } catch {
    return null;
  }
}

async function generatePdf() {
  const pdf = await PDFDocument.create();
  pdf.setTitle('TUP Thesis Archive Management System User Manual');
  pdf.setAuthor('TUP Thesis Archive Management System');
  pdf.setSubject('Role-based user manual and workflow guide');
  pdf.setKeywords(['TUP', 'Thesis Archive', 'User Manual', 'Student', 'Faculty', 'Admin']);
  pdf.setCreationDate(new Date('2026-05-10T00:00:00+08:00'));

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const logo = await optionalPng(pdf, logoPath);
  const bot = await optionalPng(pdf, botPath);

  const pageSize = [612, 792];
  const margin = 50;
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
    if (y - height < margin + 28) addPage();
  }

  function drawWrapped(text, options = {}) {
    const size = options.size ?? 10;
    const activeFont = options.font ?? font;
    const color = options.color ?? colors.ink;
    const x = options.x ?? margin;
    const width = options.width ?? pageSize[0] - (margin * 2);
    const lineHeight = options.lineHeight ?? size + 4;
    const lines = wrapText(text, activeFont, size, width);
    ensureSpace((lines.length * lineHeight) + 4);
    for (const line of lines) {
      page.drawText(line, { x, y, size, font: activeFont, color });
      y -= lineHeight;
    }
  }

  function drawParagraph(text) {
    drawWrapped(text, { size: 10.2, lineHeight: 15, color: colors.muted });
    y -= 5;
  }

  function drawBullet(text, orderedNumber = null) {
    const markerX = margin + 7;
    const textX = margin + 25;
    const width = pageSize[0] - margin - textX;
    const marker = orderedNumber === null ? '-' : `${orderedNumber}.`;
    const lines = wrapText(text, font, 9.4, width);
    ensureSpace((lines.length * 13.5) + 4);
    page.drawText(marker, { x: markerX, y, size: 9.5, font: bold, color: colors.accent });
    for (const line of lines) {
      page.drawText(line, { x: textX, y, size: 9.4, font, color: colors.ink });
      y -= 13.5;
    }
    y -= 2;
  }

  function drawTable(table) {
    const availableWidth = pageSize[0] - (margin * 2);
    const colWidth = availableWidth / table.headers.length;
    const cellPadding = 5;
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
        size: 8,
        font: bold,
        color: colors.accentDark,
      });
    });
    y -= headerHeight;

    for (const row of table.rows) {
      const wrapped = row.map((cell) => wrapText(cell, font, 8, colWidth - (cellPadding * 2)));
      const rowHeight = Math.max(30, Math.max(...wrapped.map((lines) => lines.length)) * 11.5 + 12);
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
            size: 8,
            font,
            color: colors.ink,
          });
          cellY -= 11.5;
        }
      });
      y -= rowHeight;
    }
    y -= 12;
  }

  function drawCallout(title, text) {
    const boxHeight = 58;
    ensureSpace(boxHeight + 10);
    page.drawRectangle({
      x: margin,
      y: y - boxHeight + 8,
      width: pageSize[0] - (margin * 2),
      height: boxHeight,
      color: colors.soft,
      borderColor: colors.line,
      borderWidth: 0.6,
    });
    page.drawText(sanitize(title), { x: margin + 14, y: y - 12, size: 10, font: bold, color: colors.accent });
    const lines = wrapText(text, font, 8.8, pageSize[0] - (margin * 2) - 28);
    let textY = y - 28;
    for (const line of lines.slice(0, 2)) {
      page.drawText(line, { x: margin + 14, y: textY, size: 8.8, font, color: colors.muted });
      textY -= 12;
    }
    y -= boxHeight + 8;
  }

  addPage();
  page.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: pageSize[1], color: colors.cream });
  page.drawRectangle({ x: 0, y: 0, width: 158, height: pageSize[1], color: colors.accent });
  page.drawRectangle({ x: 0, y: 0, width: 28, height: pageSize[1], color: colors.accentDark });

  if (logo) {
    page.drawImage(logo, { x: 56, y: 632, width: 72, height: 72 });
  } else {
    page.drawText('TUP', { x: 54, y: 670, size: 24, font: serif, color: colors.white });
  }
  if (bot) {
    page.drawImage(bot, { x: 468, y: 88, width: 74, height: 74 });
  }
  page.drawText('TUP Thesis Archive', { x: 190, y: 610, size: 33, font: serif, color: colors.ink });
  page.drawText('Management System', { x: 190, y: 570, size: 26, font: serif, color: colors.accent });
  page.drawText('User Manual', { x: 190, y: 510, size: 18, font: bold, color: colors.ink });
  page.drawText('Role-based guide for students, faculty, chairpersons, and administrators', {
    x: 190,
    y: 486,
    size: 10.5,
    font,
    color: colors.muted,
  });
  page.drawText(`Prepared: ${preparedDate}`, { x: 190, y: 438, size: 10, font, color: colors.muted });
  page.drawText('Technological University of the Philippines', { x: 190, y: 420, size: 10, font, color: colors.muted });

  addPage();
  page.drawText('Table of Contents', { x: margin, y, size: 22, font: serif, color: colors.ink });
  y -= 30;
  manual.forEach((section) => {
    ensureSpace(17);
    page.drawText(section.title, { x: margin, y, size: 10, font, color: colors.ink });
    y -= 17;
  });

  for (const section of manual) {
    addPage();
    page.drawText(section.title, { x: margin, y, size: 18, font: serif, color: colors.accentDark });
    y -= 28;

    for (const paragraph of section.body ?? []) drawParagraph(paragraph);
    if (section.steps) {
      page.drawText('Procedure', { x: margin, y, size: 11, font: bold, color: colors.green });
      y -= 17;
      section.steps.forEach((step, index) => drawBullet(step, index + 1));
      y -= 4;
    }
    for (const bullet of section.bullets ?? []) drawBullet(bullet);
    if (section.notes) {
      section.notes.forEach((note) => drawCallout('Note', note));
    }
    if (section.table) drawTable(section.table);
    if (section.screenshotPlaceholders) {
      section.screenshotPlaceholders.forEach((label, index) => {
        drawCallout(`Figure ${index + 1}: ${label}`, 'Insert an authenticated system screenshot in this space when preparing the final printed copy.');
      });
    }
  }

  addPage();
  page.drawText('Quick Reference by Role', { x: margin, y, size: 20, font: serif, color: colors.accentDark });
  y -= 28;
  const quickReference = [
    ['Student', 'Dashboard, Categories, Upload Thesis, My Submissions, Extension Request, Messages, Profile, Support.'],
    ['Faculty', 'Dashboard, Categories, Add Files, Manage Thesis, Review Submissions, Activity Log, My Advisees, My Submissions.'],
    ['Chairperson', 'All faculty actions plus Best Thesis appointment for one thesis per school year.'],
    ['Admin', 'Dashboard, Thesis, Users, Program, Categories, Tickets, Recent Activity, About, Support, Terms.'],
  ];
  for (const [role, actions] of quickReference) {
    ensureSpace(42);
    page.drawText(role, { x: margin, y, size: 12, font: bold, color: colors.accent });
    y -= 16;
    drawWrapped(actions, { x: margin + 16, width: pageSize[0] - (margin * 2) - 16, size: 9.4, lineHeight: 13 });
    y -= 8;
  }

  const bytes = await pdf.save();
  await fs.writeFile(pdfOutputPath, bytes);
}

await fs.mkdir(docsDir, { recursive: true });
await fs.writeFile(markdownOutputPath, buildMarkdown(), 'utf8');
await generatePdf();

console.log(pdfOutputPath);
console.log(markdownOutputPath);
