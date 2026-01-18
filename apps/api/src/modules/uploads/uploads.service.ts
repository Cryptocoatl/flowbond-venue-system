import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LocalStorageProvider } from './storage/local.storage';
import { UploadResult } from './storage/storage.interface';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class UploadsService {
  private storage: LocalStorageProvider;

  constructor(private readonly prisma: PrismaService) {
    this.storage = new LocalStorageProvider();
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    entityType?: string,
    entityId?: string,
  ): Promise<UploadResult> {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File too large. Maximum size is 10MB');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP',
      );
    }

    // Determine storage path based on entity type
    const subPath = entityType ? `${entityType.toLowerCase()}s` : 'general';

    // Upload to storage
    const storagePath = await this.storage.upload(file, subPath);
    const url = this.storage.getUrl(storagePath);

    // Create database record
    const upload = await this.prisma.fileUpload.create({
      data: {
        filename: storagePath,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        uploadedById: userId,
        entityType,
        entityId,
      },
    });

    return {
      filename: upload.filename,
      originalName: upload.originalName,
      mimeType: upload.mimeType,
      size: upload.size,
      url: upload.url,
      path: storagePath,
    };
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.prisma.fileUpload.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Only allow owner or admin to delete
    // Admin check should be done at controller level via guard

    // Delete from storage
    await this.storage.delete(file.filename);

    // Delete database record
    await this.prisma.fileUpload.delete({
      where: { id: fileId },
    });
  }

  async getFile(fileId: string) {
    const file = await this.prisma.fileUpload.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async getFilesByEntity(entityType: string, entityId: string) {
    return this.prisma.fileUpload.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async linkFileToEntity(
    fileId: string,
    entityType: string,
    entityId: string,
  ) {
    return this.prisma.fileUpload.update({
      where: { id: fileId },
      data: {
        entityType,
        entityId,
      },
    });
  }
}
