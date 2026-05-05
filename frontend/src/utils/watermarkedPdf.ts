const WATERMARK_TEXT = 'Technological University of the Philippines - Manila';
const WATERMARK_FONT_SIZE = 18;
const WATERMARK_OPACITY = 0.18;
const WATERMARK_ROTATION_DEGREES = -45;

const bytesToArrayBuffer = (bytes: Uint8Array) => {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
};

export const createWatermarkedThesisPdfBlob = async (sourcePdf: Blob) => {
  const [{ PDFDocument, StandardFonts, degrees, rgb }, sourcePdfBytes] = await Promise.all([
    import('pdf-lib'),
    sourcePdf.arrayBuffer(),
  ]);

  const pdfDocument = await PDFDocument.load(sourcePdfBytes, { ignoreEncryption: true });
  const watermarkFont = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const watermarkTextWidth = watermarkFont.widthOfTextAtSize(WATERMARK_TEXT, WATERMARK_FONT_SIZE);
  const columnGap = watermarkTextWidth + 80;
  const rowGap = 108;

  pdfDocument.getPages().forEach((page) => {
    const { width, height } = page.getSize();

    for (let row = 0, y = -height * 0.35; y < height * 1.35; row += 1, y += rowGap) {
      const rowOffset = row % 2 === 0 ? 0 : columnGap / 2;

      for (let x = -width - rowOffset; x < width * 1.5; x += columnGap) {
        page.drawText(WATERMARK_TEXT, {
          x,
          y,
          size: WATERMARK_FONT_SIZE,
          font: watermarkFont,
          color: rgb(0, 0, 0),
          opacity: WATERMARK_OPACITY,
          rotate: degrees(WATERMARK_ROTATION_DEGREES),
        });
      }
    }
  });

  const watermarkedBytes = await pdfDocument.save();
  return new Blob([bytesToArrayBuffer(watermarkedBytes)], { type: 'application/pdf' });
};

export const getWatermarkedPdfFileName = (name: string) => {
  const baseName = name
    .replace(/\.pdf$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim() || 'thesis';

  return `${baseName}-watermarked.pdf`;
};
