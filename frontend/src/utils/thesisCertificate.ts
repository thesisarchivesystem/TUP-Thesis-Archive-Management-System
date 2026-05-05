import type { Thesis } from '../types/thesis.types';

const TUP_LOGO_URL = '/tup.png';
const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;

const bytesToArrayBuffer = (bytes: Uint8Array) => {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
};

const formatCertificateDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const getAuthors = (thesis: Thesis) => {
  const authors = thesis.authors?.filter(Boolean) ?? [];
  return authors.length ? authors : [thesis.submitter?.name || thesis.submitter_name || 'Student Researcher'];
};

const wrapText = (text: string, font: { widthOfTextAtSize: (value: string, size: number) => number }, fontSize: number, maxWidth: number) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(nextLine, fontSize) <= maxWidth) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);
  return lines;
};

const drawCenteredText = (
  page: {
    drawText: (text: string, options: Record<string, unknown>) => void;
  },
  text: string,
  font: { widthOfTextAtSize: (value: string, size: number) => number },
  y: number,
  size: number,
  options: Record<string, unknown>,
) => {
  page.drawText(text, {
    ...options,
    x: (PAGE_WIDTH - font.widthOfTextAtSize(text, size)) / 2,
    y,
    size,
  });
};

const drawCenteredTextAt = (
  page: {
    drawText: (text: string, options: Record<string, unknown>) => void;
  },
  text: string,
  font: { widthOfTextAtSize: (value: string, size: number) => number },
  centerX: number,
  y: number,
  size: number,
  options: Record<string, unknown>,
) => {
  page.drawText(text, {
    ...options,
    x: centerX - font.widthOfTextAtSize(text, size) / 2,
    y,
    size,
  });
};

const formatAuthorGroup = (authors: string[], hasMoreAuthors = false) =>
  `${authors.join(', ')}${hasMoreAuthors ? ',' : ''}`;

const groupAuthorsByLine = (
  authors: string[],
  font: { widthOfTextAtSize: (value: string, size: number) => number },
  fontSize: number,
  maxWidth: number,
) => {
  const lines: string[][] = [];
  let currentLine: string[] = [];

  authors.forEach((author, index) => {
    const nextLine = [...currentLine, author];
    const hasMoreAuthors = index < authors.length - 1;
    const nextLineText = formatAuthorGroup(nextLine, hasMoreAuthors);

    if (!currentLine.length || font.widthOfTextAtSize(nextLineText, fontSize) <= maxWidth) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = [author];
  });

  if (currentLine.length) lines.push(currentLine);

  return lines.map((line, index) => formatAuthorGroup(line, index < lines.length - 1));
};

const authorLinesFit = (
  lines: string[],
  font: { widthOfTextAtSize: (value: string, size: number) => number },
  fontSize: number,
  maxWidth: number,
) => lines.length <= 2 && lines.every((line) => font.widthOfTextAtSize(line, fontSize) <= maxWidth);

const wrapAuthorLines = (
  authors: string[],
  font: { widthOfTextAtSize: (value: string, size: number) => number },
  maxWidth: number,
) => {
  const safeAuthors = authors.map((author) => author.trim()).filter(Boolean);

  for (let fontSize = 24; fontSize >= 16; fontSize -= 1) {
    const lines = safeAuthors.length > 1
      ? groupAuthorsByLine(safeAuthors, font, fontSize, maxWidth)
      : wrapText(safeAuthors[0] || 'Student Researcher', font, fontSize, maxWidth);

    if (authorLinesFit(lines, font, fontSize, maxWidth)) {
      return { lines, fontSize };
    }
  }

  if (safeAuthors.length > 1) {
    const fallbackLines = groupAuthorsByLine(safeAuthors, font, 14, maxWidth);

    if (authorLinesFit(fallbackLines, font, 14, maxWidth)) {
      return { lines: fallbackLines, fontSize: 14 };
    }
  }

  return {
    lines: wrapText(formatAuthorGroup(safeAuthors), font, 14, maxWidth).slice(0, 2),
    fontSize: 14,
  };
};

export const createThesisCertificatePdfBlob = async (thesis: Thesis) => {
  const [{ PDFDocument, StandardFonts, rgb }, logoBytes] = await Promise.all([
    import('pdf-lib'),
    fetch(TUP_LOGO_URL).then((response) => {
      if (!response.ok) {
        throw new Error('Unable to load the TUP logo for the certificate.');
      }

      return response.arrayBuffer();
    }),
  ]);

  const pdfDocument = await PDFDocument.create();
  const page = pdfDocument.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const titleFont = await pdfDocument.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const bodyBoldFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdfDocument.embedPng(logoBytes);

  const margin = 46;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: PAGE_WIDTH - margin * 2,
    height: PAGE_HEIGHT - margin * 2,
    borderColor: rgb(0.68, 0.08, 0.12),
    borderWidth: 1.25,
  });
  page.drawRectangle({
    x: margin + 10,
    y: margin + 10,
    width: PAGE_WIDTH - (margin + 10) * 2,
    height: PAGE_HEIGHT - (margin + 10) * 2,
    borderColor: rgb(0.86, 0.72, 0.58),
    borderWidth: 0.75,
  });

  page.drawImage(logo, {
    x: (PAGE_WIDTH - 76) / 2,
    y: 462,
    width: 76,
    height: 76,
  });

  const departmentLine = thesis.department || thesis.program || 'TUP Manila';

  drawCenteredText(page, 'TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES - MANILA', bodyBoldFont, 428, 13, {
    font: bodyBoldFont,
    color: rgb(0.13, 0.08, 0.08),
  });
  drawCenteredText(page, departmentLine, bodyFont, 409, 11, {
    font: bodyFont,
    color: rgb(0.36, 0.27, 0.27),
  });
  drawCenteredText(page, 'Certificate of Thesis Approval', titleFont, 344, 34, {
    font: titleFont,
    color: rgb(0.24, 0.08, 0.08),
  });

  drawCenteredText(page, 'This certifies that', bodyFont, 303, 12, {
    font: bodyFont,
    color: rgb(0.38, 0.31, 0.31),
  });

  const authors = getAuthors(thesis);
  const authorBlock = wrapAuthorLines(authors, titleFont, PAGE_WIDTH - margin * 2 - 52);
  const authorLineHeight = authorBlock.fontSize + 7;
  const authorStartY = authorBlock.lines.length > 1 ? 276 : 270;

  authorBlock.lines.forEach((line, index) => {
    drawCenteredText(page, line, titleFont, authorStartY - index * authorLineHeight, authorBlock.fontSize, {
      font: titleFont,
      color: rgb(0.12, 0.08, 0.08),
    });
  });

  const agreement = authors.length > 1 ? 'have' : 'has';
  const bodyStartY = authorStartY - authorBlock.lines.length * authorLineHeight - 20;
  const approvalLines = wrapText(`${agreement} successfully completed and received faculty approval for the thesis entitled`, bodyFont, 13, 570);
  approvalLines.forEach((line, index) => {
    drawCenteredText(page, line, bodyFont, bodyStartY - index * 20, 13, {
      font: bodyFont,
      color: rgb(0.28, 0.22, 0.22),
    });
  });

  const thesisTitleLines = wrapText(`"${thesis.title}".`, bodyFont, 13, 570);
  thesisTitleLines.forEach((line, index) => {
    drawCenteredText(page, line, bodyFont, bodyStartY - approvalLines.length * 20 - 2 - index * 20, 13, {
      font: bodyFont,
      color: rgb(0.28, 0.22, 0.22),
    });
  });

  const approvedDate = formatCertificateDate(thesis.reviewed_at || thesis.approved_at || thesis.created_at);

  drawCenteredText(page, `Approved on ${approvedDate}`, bodyFont, 143, 11, {
    font: bodyFont,
    color: rgb(0.44, 0.36, 0.36),
  });

  const signatureCenterX = PAGE_WIDTH / 2;
  const signatureLineWidth = 180;

  page.drawLine({
    start: { x: signatureCenterX - signatureLineWidth / 2, y: 107 },
    end: { x: signatureCenterX + signatureLineWidth / 2, y: 107 },
    thickness: 0.75,
    color: rgb(0.4, 0.28, 0.28),
  });
  drawCenteredTextAt(page, thesis.adviser?.name || thesis.adviser_name || 'Faculty Adviser', bodyBoldFont, signatureCenterX, 88, 11, {
    font: bodyBoldFont,
    color: rgb(0.2, 0.14, 0.14),
  });
  drawCenteredTextAt(page, 'Faculty Approval', bodyFont, signatureCenterX, 72, 9, {
    font: bodyFont,
    color: rgb(0.46, 0.38, 0.38),
  });

  const certificateBytes = await pdfDocument.save();
  return new Blob([bytesToArrayBuffer(certificateBytes)], { type: 'application/pdf' });
};

export const getCertificatePdfFileName = (thesis: Thesis) => {
  const baseName = thesis.title
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim() || 'thesis';

  return `${baseName}-approval-certificate.pdf`;
};
