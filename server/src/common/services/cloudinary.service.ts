import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { BadRequestError, AppError } from '../errors/app-error';

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: Record<string, unknown>[];
  resourceType?: 'image' | 'raw' | 'auto';
}

export class CloudinaryService {
  private static configured = false;

  /**
   * Initializes Cloudinary SDK with current environment credentials
   */
  public static init(): void {
    if (this.isConfigured()) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      this.configured = true;
      logger.info('Cloudinary SDK initialized successfully');
    } else {
      logger.warn('Cloudinary credentials not provided. Using local filesystem fallback.');
      this.configured = false;
    }
  }

  /**
   * Checks whether Cloudinary environment variables are available
   */
  public static isConfigured(): boolean {
    return Boolean(
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    );
  }

  /**
   * Uploads an in-memory file buffer directly to Cloudinary via stream.
   * Falls back to local filesystem storage if Cloudinary is not configured.
   */
  public static async uploadBuffer(
    buffer: Buffer,
    originalFilename = 'upload.jpg',
    mimeType = 'image/jpeg',
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestError('Cannot upload empty file');
    }

    // Ensure Cloudinary is initialized
    if (!this.configured && this.isConfigured()) {
      this.init();
    }

    const folder = options.folder || 'fixify/tickets';
    const tags = options.tags || ['fixify', 'ticket-attachment'];

    if (this.configured) {
      try {
        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              tags,
              resource_type: options.resourceType || 'image',
              transformation: options.transformation || [
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
              ],
            },
            (error, response) => {
              if (error) {
                return reject(error);
              }
              if (!response) {
                return reject(new Error('Empty response from Cloudinary'));
              }
              resolve(response);
            }
          );

          // Pipe buffer to Cloudinary upload stream
          Readable.from(buffer).pipe(uploadStream);
        });

        logger.info(
          { publicId: result.public_id, url: result.secure_url },
          'Image uploaded to Cloudinary successfully'
        );

        return {
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        };
      } catch (err: unknown) {
        const error = err as { message?: string };
        logger.error({ error: err }, 'Failed to upload image to Cloudinary');
        throw new AppError(
          `Cloudinary upload failed: ${error.message || 'Unknown error'}`,
          502,
          'UPLOAD_PROVIDER_ERROR'
        );
      }
    }

    // Local filesystem fallback (per IMPLEMENTATION_PLAN.md REQ-1.6)
    return this.saveToLocalFallback(buffer, originalFilename, mimeType);
  }

  /**
   * Uploads multiple buffers concurrently
   */
  public static async uploadMultiple(
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      return [];
    }
    return Promise.all(
      files.map((file) =>
        this.uploadBuffer(file.buffer, file.originalname, file.mimetype, options)
      )
    );
  }

  /**
   * Deletes an asset from Cloudinary by its public ID
   */
  public static async deleteImage(publicId: string): Promise<boolean> {
    if (!publicId) {
      return false;
    }

    if (!this.configured && this.isConfigured()) {
      this.init();
    }

    // If local fallback image
    if (publicId.startsWith('local:')) {
      const filename = publicId.replace('local:', '');
      const uploadsDir = path.resolve(__dirname, '../../../public/uploads');
      const targetPath = path.join(uploadsDir, filename);
      if (fs.existsSync(targetPath)) {
        try {
          fs.unlinkSync(targetPath);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }

    if (!this.configured) {
      return false;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
      return result.result === 'ok';
    } catch (err) {
      logger.error({ error: err, publicId }, 'Failed to delete asset from Cloudinary');
      return false;
    }
  }

  /**
   * Fallback for offline development or missing Cloudinary credentials
   */
  private static saveToLocalFallback(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): UploadResult {
    const uploadsDir = path.resolve(__dirname, '../../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(originalFilename) || (mimeType.includes('png') ? '.png' : '.jpg');
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${uniqueName}`;
    const fullUrl = `${env.SERVER_URL}${relativeUrl}`;

    logger.info({ filePath, fullUrl }, 'Saved file to local fallback storage');

    return {
      url: fullUrl,
      secureUrl: fullUrl,
      publicId: `local:${uniqueName}`,
      format: ext.replace('.', ''),
      bytes: buffer.length,
    };
  }
}

// Auto-initialize Cloudinary at startup if credentials exist
CloudinaryService.init();
