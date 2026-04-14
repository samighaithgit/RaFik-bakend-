import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

export interface UploadedFile {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns the public URL for a stored file.
   */
  getFileUrl(type: 'images' | 'audio', filename: string): string {
    const port = this.configService.get<number>('app.port', 3000);
    const host = `http://localhost:${port}`;
    return `${host}/static/${type}/${filename}`;
  }

  /**
   * Returns the absolute disk path for the uploads directory.
   */
  getUploadDir(type: 'images' | 'audio'): string {
    return path.join(process.cwd(), 'uploads', type);
  }

  /**
   * Ensure upload directories exist (called on app start).
   */
  ensureDirectories(): void {
    ['images', 'audio'].forEach((dir) => {
      const fullPath = path.join(process.cwd(), 'uploads', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.logger.log(`Created upload directory: ${fullPath}`);
      }
    });
  }

  buildImageResponse(file: Express.Multer.File): UploadedFile {
    const url = this.getFileUrl('images', file.filename);
    this.logger.log(`Image uploaded: ${file.filename} (${file.size} bytes)`);
    return {
      url,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  buildAudioResponse(file: Express.Multer.File): UploadedFile {
    const url = this.getFileUrl('audio', file.filename);
    this.logger.log(`Audio uploaded: ${file.filename} (${file.size} bytes)`);
    return {
      url,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
