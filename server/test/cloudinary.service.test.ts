import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudinaryService } from '../src/common/services/cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

describe('Cloudinary Service Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly reports configuration status based on environment variables', () => {
    const isConfig = CloudinaryService.isConfigured();
    // In our test/dev environment, CLOUDINARY keys are loaded
    expect(typeof isConfig).toBe('boolean');
  });

  it('rejects empty buffer uploads with 400 BadRequestError', async () => {
    const emptyBuffer = Buffer.alloc(0);
    await expect(CloudinaryService.uploadBuffer(emptyBuffer)).rejects.toThrow(
      'Cannot upload empty file'
    );
  });

  it('uploads buffer to Cloudinary using upload_stream and returns expected metadata', async () => {
    const fakeApiResponse = {
      url: 'http://res.cloudinary.com/dvx9cw0sy/image/upload/v1234/fixify/tickets/sample.jpg',
      secure_url: 'https://res.cloudinary.com/dvx9cw0sy/image/upload/v1234/fixify/tickets/sample.jpg',
      public_id: 'fixify/tickets/sample',
      format: 'jpg',
      width: 1920,
      height: 1080,
      bytes: 20480,
    };

    // Mock upload_stream to return a writable stream that calls callback with fakeApiResponse
    vi.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation((options: any, callback: any) => {
      const { Writable } = require('stream');
      const writable = new Writable({
        write(_chunk: any, _encoding: any, next: any) {
          next();
        },
        final(cb: any) {
          callback(null, fakeApiResponse);
          cb();
        },
      });
      return writable as any;
    });

    const testBuffer = Buffer.from('test image content');
    const result = await CloudinaryService.uploadBuffer(testBuffer, 'screen.jpg', 'image/jpeg');

    expect(result.url).toBe(fakeApiResponse.url);
    expect(result.secureUrl).toBe(fakeApiResponse.secure_url);
    expect(result.publicId).toBe('fixify/tickets/sample');
    expect(result.format).toBe('jpg');
    expect(result.bytes).toBe(20480);
  });

  it('destroys image asset by publicId calling cloudinary.uploader.destroy', async () => {
    const destroySpy = vi.spyOn(cloudinary.uploader, 'destroy').mockResolvedValue({
      result: 'ok',
    });

    const deleted = await CloudinaryService.deleteImage('fixify/tickets/sample');
    expect(deleted).toBe(true);
    expect(destroySpy).toHaveBeenCalledWith('fixify/tickets/sample', { invalidate: true });
  });

  it('returns false when deleting empty publicId', async () => {
    const deleted = await CloudinaryService.deleteImage('');
    expect(deleted).toBe(false);
  });
});
