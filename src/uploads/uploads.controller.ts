import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { UploadsService } from './uploads.service';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const AUDIO_MIME_TYPES = [
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/aac',
  'audio/ogg',
  'audio/wav',
  'audio/x-m4a',
  'audio/3gpp',
];

function imageStorage() {
  return diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), 'uploads', 'images');
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `img-${uuid()}${ext}`);
    },
  });
}

function audioStorage() {
  return diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), 'uploads', 'audio');
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // Force .m4a extension for compatibility
      const mimeExt: Record<string, string> = {
        'audio/m4a': '.m4a',
        'audio/mp4': '.m4a',
        'audio/x-m4a': '.m4a',
        'audio/aac': '.aac',
        'audio/mpeg': '.mp3',
        'audio/ogg': '.ogg',
        'audio/wav': '.wav',
        'audio/3gpp': '.3gp',
      };
      const ext = mimeExt[file.mimetype] || path.extname(file.originalname) || '.m4a';
      cb(null, `audio-${uuid()}${ext}`);
    },
  });
}

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload a complaint image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: imageStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (req, file, cb) => {
        // Accept all images; also accept when mimetype starts with image/
        if (
          IMAGE_MIME_TYPES.includes(file.mimetype) ||
          file.mimetype.startsWith('image/')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Unsupported image type: ${file.mimetype}`), false);
        }
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    return this.uploadsService.buildImageResponse(file);
  }

  @Post('audio')
  @ApiOperation({ summary: 'Upload a voice note recording' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        durationSeconds: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: audioStorage(),
      limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
      fileFilter: (req, file, cb) => {
        if (
          AUDIO_MIME_TYPES.includes(file.mimetype) ||
          file.mimetype.startsWith('audio/')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Unsupported audio type: ${file.mimetype}`), false);
        }
      },
    }),
  )
  uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }
    return this.uploadsService.buildAudioResponse(file);
  }
}
