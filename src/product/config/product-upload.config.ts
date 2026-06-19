import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const PRODUCT_UPLOAD_DIR = join(
  process.cwd(),
  'public',
  'uploads',
  'products',
);

export const productImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    if (!existsSync(PRODUCT_UPLOAD_DIR)) {
      mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });
    }
    cb(null, PRODUCT_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${extname(file.originalname)}`);
  },
});

export const productImageFileFilter = (
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

export function toProductImagePath(filename: string): string {
  return `/uploads/products/${filename}`;
}

export async function deleteProductImageFile(
  imagePath?: string | null,
): Promise<void> {
  if (!imagePath?.startsWith('/uploads/products/')) {
    return;
  }

  const filename = imagePath.replace('/uploads/products/', '');
  const filePath = join(PRODUCT_UPLOAD_DIR, filename);

  try {
    await unlink(filePath);
  } catch {
    // File may already be removed; ignore.
  }
}
