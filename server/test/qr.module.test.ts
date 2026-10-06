import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { QrService } from '../src/modules/qr/qr.service';

describe('BR-1 Decoupled QR Code Module', () => {
  const app = createApp();
  const clientUrl = 'http://localhost:5173';

  it('builds standard laboratory report deep link', () => {
    const url = QrService.buildLabReportUrl(clientUrl, 'COMP-LAB-01');
    expect(url).toBe('http://localhost:5173/report?lab=COMP-LAB-01');
  });

  it('extracts labCode from a valid report URL', () => {
    const url = 'http://localhost:5173/report?lab=MECH-CAD-02';
    const labCode = QrService.extractLabCodeFromUrl(url);
    expect(labCode).toBe('MECH-CAD-02');
  });

  it('generates high-resolution PNG data URL and vector SVG', async () => {
    const url = 'http://localhost:5173/report?lab=LAB-TEST';
    const dataUrl = await QrService.generateDataUrl(url);
    const svg = await QrService.generateSvg(url);

    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(svg.includes('<svg')).toBe(true);
  });

  it('generates printable placard via POST /api/v1/qr/generate', async () => {
    const res = await request(app)
      .post('/api/v1/qr/generate')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        labCode: 'COMP-101',
        labName: 'Advanced Computing Lab',
        building: 'Academic Block B',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.labCode).toBe('COMP-101');
    expect(res.body.data.url).toContain('/report?lab=COMP-101');
    expect(res.body.data.placardText).toContain('Advanced Computing Lab');
    expect(res.body.data.dataUrl).toBeDefined();
    expect(res.body.data.svg).toBeDefined();
  });

  it('parses labCode via GET /api/v1/qr/parse', async () => {
    const targetUrl = 'http://localhost:5173/report?lab=ELEC-204';
    const res = await request(app)
      .get(`/api/v1/qr/parse?url=${encodeURIComponent(targetUrl)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.labCode).toBe('ELEC-204');
  });
});
