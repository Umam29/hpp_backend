import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const RAW_MATERIAL_UPLOAD_DIR = join(
  process.cwd(),
  'public',
  'uploads',
  'raw-materials',
);

export const rawMaterialImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    if (!existsSync(RAW_MATERIAL_UPLOAD_DIR)) {
      mkdirSync(RAW_MATERIAL_UPLOAD_DIR, { recursive: true });
    }
    cb(null, RAW_MATERIAL_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${extname(file.originalname)}`);
  },
});

export const rawMaterialImageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    cb(new BadRequestException('Only image files are allowed'), false);
    return;
  }
  cb(null, true);
};

export function toRawMaterialImagePath(filename: string): string {
  return `/uploads/raw-materials/${filename}`;
}

export async function deleteRawMaterialImageFile(
  imagePath?: string | null,
): Promise<void> {
  if (!imagePath?.startsWith('/uploads/raw-materials/')) {
    return;
  }

  const filename = imagePath.replace('/uploads/raw-materials/', '');
  const filePath = join(RAW_MATERIAL_UPLOAD_DIR, filename);

  try {
    await unlink(filePath);
  } catch {
    // File may already be removed; ignore.
  }
}
