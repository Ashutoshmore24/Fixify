import QRCode from 'qrcode';

export interface PlacardLabInfo {
  labName: string;
  code: string;
  labCode: string;
  building: string;
  reportUrl: string;
}

function escapePdfString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' '); // Clean non-ASCII for standard Helvetica
}

/**
 * Builds a stream string for a single A4 placard page.
 * A4 dimensions in points: 595.28 width x 841.89 height.
 */
function buildPlacardPageStream(info: PlacardLabInfo): string {
  const qr = QRCode.create(info.reportUrl, { errorCorrectionLevel: 'H' });
  const moduleCount = qr.modules.size;
  const qrBoxSize = 320; // 320 points width & height
  const cellSize = qrBoxSize / moduleCount;
  const qrX = (595.28 - qrBoxSize) / 2;
  const qrY = 310; // Vertically centered

  let stream = '';

  // Background card / decorative outer border
  stream += 'q\n';
  // Outer decorative border
  stream += '0.85 0.88 0.92 RG\n'; // Light slate border
  stream += '1.5 w\n';
  stream += '30 30 535.28 781.89 re S\n';

  // Inner margin accent header band
  stream += '0.145 0.388 0.922 rg\n'; // Blue #2563eb
  stream += '30 760 535.28 51.89 re f\n';

  // Header Title Text
  stream += '1 1 1 rg\n'; // White text
  stream += 'BT\n';
  stream += '/F2 20 Tf\n';
  stream += '50 780 Td\n';
  stream += `(${escapePdfString('FIXIFY  |  CAMPUS IT MAINTENANCE')}) Tj\n`;
  stream += 'ET\n';

  // Lab Name & Location Header
  stream += '0.08 0.12 0.20 rg\n'; // Dark navy text
  stream += 'BT\n';
  stream += '/F2 26 Tf\n';
  stream += `50 715 Td\n`;
  stream += `(${escapePdfString(info.labName)}) Tj\n`;
  stream += 'ET\n';

  stream += '0.35 0.40 0.48 rg\n'; // Muted slate text
  stream += 'BT\n';
  stream += '/F1 14 Tf\n';
  stream += `50 688 Td\n`;
  stream += `(${escapePdfString(`Code: ${info.code}   |   ${info.building}`)}) Tj\n`;
  stream += 'ET\n';

  // Horizontal divider
  stream += '0.88 0.90 0.93 RG\n';
  stream += '1 w\n';
  stream += '50 668 m 545.28 668 l S\n';

  // QR Code Quiet Zone Background Card
  stream += '0.98 0.99 1.0 rg\n'; // Soft crisp background
  stream += '0.80 0.85 0.92 RG\n';
  stream += '1.5 w\n';
  stream += `${qrX - 18} ${qrY - 18} ${qrBoxSize + 36} ${qrBoxSize + 36} re B\n`;

  // Draw Vector QR Code Modules (Black Rectangles)
  stream += '0 0 0 rg\n'; // Black fill
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.modules.get(row, col)) {
        const x = (qrX + col * cellSize).toFixed(2);
        const y = (qrY + (moduleCount - 1 - row) * cellSize).toFixed(2);
        const w = (cellSize + 0.1).toFixed(2); // Slight overlap to avoid rendering seams
        const h = (cellSize + 0.1).toFixed(2);
        stream += `${x} ${y} ${w} ${h} re f\n`;
      }
    }
  }

  // Primary Call-To-Action Banner under QR
  stream += '0.93 0.96 1.0 rg\n'; // Light blue pill
  stream += '0.23 0.51 0.96 RG\n';
  stream += '1.5 w\n';
  stream += '50 215 495.28 62 re B\n';

  stream += '0.11 0.32 0.82 rg\n'; // Vibrant blue bold text
  stream += 'BT\n';
  stream += '/F2 16 Tf\n';
  stream += '70 252 Td\n';
  stream += `(${escapePdfString('Scan with your phone camera to report a computer problem')}) Tj\n`;
  stream += 'ET\n';

  stream += '0.30 0.36 0.45 rg\n';
  stream += 'BT\n';
  stream += '/F1 11 Tf\n';
  stream += '70 230 Td\n';
  stream += `(${escapePdfString(`Direct URL: ${info.reportUrl}`)}) Tj\n`;
  stream += 'ET\n';

  // Instructions bullet points card
  stream += '0.40 0.45 0.53 rg\n';
  stream += 'BT\n';
  stream += '/F1 11 Tf\n';
  stream += '50 160 Td\n';
  stream += `(${escapePdfString('1. Open your phone camera or QR scanner application.')}) Tj\n`;
  stream += '0 -18 Td\n';
  stream += `(${escapePdfString('2. Tap the link to open the Fixify complaint portal for this laboratory.')}) Tj\n`;
  stream += '0 -18 Td\n';
  stream += `(${escapePdfString('3. Select the affected PC number, choose the issue category, and submit.')}) Tj\n`;
  stream += 'ET\n';

  // Footer
  stream += '0.88 0.90 0.93 RG\n';
  stream += '1 w\n';
  stream += '50 90 m 545.28 90 l S\n';

  stream += '0.55 0.60 0.68 rg\n';
  stream += 'BT\n';
  stream += '/F1 9 Tf\n';
  stream += '50 72 Td\n';
  stream += `(${escapePdfString('Fixify IT Asset & Maintenance Management System  *  Pimpri Chinchwad College of Engineering')}) Tj\n`;
  stream += 'ET\n';

  stream += 'Q\n';
  return stream;
}

/**
 * Generates a valid multi-page or single-page PDF 1.4 document buffer.
 */
export function generatePlacardsPdf(labs: PlacardLabInfo[]): Buffer {
  if (labs.length === 0) {
    throw new Error('At least one laboratory is required to generate placards PDF');
  }

  const objects: string[] = [];
  const byteOffsets: number[] = [];

  // Object 1: Catalog (placeholder, updated at end)
  // Object 2: Pages root
  // Fonts:
  // F1: Helvetica
  // F2: Helvetica-Bold

  // We will structure:
  // Obj 1: Catalog
  // Obj 2: Pages
  // Obj 3: Font F1
  // Obj 4: Font F2
  // Then for each lab i:
  // Obj (5 + 2*i): Page
  // Obj (6 + 2*i): Contents Stream

  const fontF1Obj = 3;
  const fontF2Obj = 4;

  const pageObjectRefs: string[] = [];

  // Generate streams and pages
  const pageEntries: { pageObj: number; streamObj: number; streamContent: string }[] = [];

  let nextObjNum = 5;
  for (let i = 0; i < labs.length; i++) {
    const pageObjNum = nextObjNum++;
    const streamObjNum = nextObjNum++;
    const streamContent = buildPlacardPageStream(labs[i]!);

    pageObjectRefs.push(`${pageObjNum} 0 R`);
    pageEntries.push({
      pageObj: pageObjNum,
      streamObj: streamObjNum,
      streamContent,
    });
  }

  // Obj 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages Root
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectRefs.join(' ')}] /Count ${labs.length} >>\nendobj\n`
  );

  // Obj 3: Font F1 (Helvetica)
  objects.push(
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n'
  );

  // Obj 4: Font F2 (Helvetica-Bold)
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n'
  );

  // Now add each Page and Stream
  for (const entry of pageEntries) {
    const streamBuffer = Buffer.from(entry.streamContent, 'utf-8');
    const pageObj =
      `${entry.pageObj} 0 obj\n` +
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] ` +
      `/Resources << /Font << /F1 ${fontF1Obj} 0 R /F2 ${fontF2Obj} 0 R >> >> ` +
      `/Contents ${entry.streamObj} 0 R >>\n` +
      `endobj\n`;
    objects.push(pageObj);

    const streamObj =
      `${entry.streamObj} 0 obj\n` +
      `<< /Length ${streamBuffer.length} >>\n` +
      `stream\n` +
      entry.streamContent +
      `\nendstream\n` +
      `endobj\n`;
    objects.push(streamObj);
  }

  // Build complete PDF with exact byte offsets
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let currentOffset = Buffer.byteLength(pdf, 'utf-8');

  for (let i = 0; i < objects.length; i++) {
    byteOffsets.push(currentOffset);
    const objStr = objects[i]!;
    pdf += objStr;
    currentOffset += Buffer.byteLength(objStr, 'utf-8');
  }

  // Cross-reference table (xref)
  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 0; i < byteOffsets.length; i++) {
    const offsetStr = String(byteOffsets[i]).padStart(10, '0');
    xref += `${offsetStr} 00000 n \n`;
  }

  // Trailer
  const trailer =
    `trailer\n` +
    `<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n` +
    `${xrefOffset}\n` +
    `%%EOF\n`;

  pdf += xref + trailer;

  return Buffer.from(pdf, 'utf-8');
}
