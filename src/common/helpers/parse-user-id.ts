import { BadRequestException } from '@nestjs/common';

export function parseUserId(authorization?: string): string {
  if (!authorization?.trim()) {
    throw new BadRequestException('Authorization header is required');
  }

  return authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : authorization.trim();
}
