import QRCode from 'qrcode';

export interface QrPlacardResult {
  url: string;
  labCode: string;
  dataUrl: string;
  svg: string;
  placardText: string;
}

export class QrService {
  /**
   * Constructs the official standardized lab reporting deep link.
   * Format: ${clientUrl}/report?lab=${labCode}
   */
  public static buildLabReportUrl(clientUrl: string, labCode: string): string {
    const base = clientUrl.replace(/\/+$/, '');
    return `${base}/report?lab=${encodeURIComponent(labCode)}`;
  }

  /**
   * Extracts the lab code from a full report URL.
   */
  public static extractLabCodeFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get('lab');
    } catch {
      return null;
    }
  }

  /**
   * Generates a PNG Base64 Data URL for the given URL.
   */
  public static async generateDataUrl(
    targetUrl: string,
    options?: QRCode.QRCodeToDataURLOptions
  ): Promise<string> {
    return QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      ...options,
    });
  }

  /**
   * Generates a scalable vector SVG string for high-resolution printing.
   */
  public static async generateSvg(
    targetUrl: string,
    options?: QRCode.QRCodeToStringOptions
  ): Promise<string> {
    return QRCode.toString(targetUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      ...options,
    });
  }

  /**
   * Creates a complete printable placard payload with SVG, PNG, and formatted placard text.
   */
  public static async createPlacard(
    clientUrl: string,
    labCode: string,
    labName?: string,
    building?: string
  ): Promise<QrPlacardResult> {
    const url = this.buildLabReportUrl(clientUrl, labCode);
    const [dataUrl, svg] = await Promise.all([
      this.generateDataUrl(url),
      this.generateSvg(url),
    ]);

    const title = labName ? `Laboratory: ${labName}` : `Lab Code: ${labCode}`;
    const location = building ? `Location: ${building}` : '';
    const placardText = [
      'Official Laboratory Maintenance QR',
      title,
      location,
      'Scan using your smartphone camera to report computer issues',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      url,
      labCode,
      dataUrl,
      svg,
      placardText,
    };
  }
}
