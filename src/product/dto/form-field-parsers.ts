import { BadRequestException } from '@nestjs/common';
import { ProductIngredientDto } from './product-ingredient.dto';

export function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return undefined;
    }
    return Number(trimmed);
  }

  return Number(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeIngredient(value: unknown): ProductIngredientDto {
  if (!isRecord(value)) {
    throw new BadRequestException('each ingredient must be an object');
  }

  const rawMaterialId = value.rawMaterialId;
  const quantity = parseOptionalNumber(value.quantity);

  const normalizedRawMaterialId =
    typeof rawMaterialId === 'string'
      ? rawMaterialId.trim()
      : rawMaterialId != null
        ? String(rawMaterialId).trim()
        : '';

  if (!normalizedRawMaterialId) {
    throw new BadRequestException('each ingredient must include rawMaterialId');
  }

  if (quantity === undefined || Number.isNaN(quantity)) {
    throw new BadRequestException('each ingredient must include quantity');
  }

  return {
    rawMaterialId: normalizedRawMaterialId,
    quantity,
  };
}

function parseArrayIngredients(value: unknown[]): ProductIngredientDto[] {
  const nonEmpty = value.filter(
    (item) => item !== undefined && item !== null && item !== '',
  );

  if (nonEmpty.length === 0) {
    return [];
  }

  if (!nonEmpty.every((item) => isRecord(item))) {
    throw new BadRequestException(
      'ingredients must be an array of objects with rawMaterialId and quantity',
    );
  }

  return nonEmpty.map((item) => normalizeIngredient(item));
}

export function parseIngredients(
  value: unknown,
): ProductIngredientDto[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const parsed = parseArrayIngredients(value);
    return parsed.length > 0 ? parsed : undefined;
  }

  if (isRecord(value)) {
    const keys = Object.keys(value);
    const isIndexedObject =
      keys.length > 0 && keys.every((key) => /^\d+$/.test(key));

    if (isIndexedObject) {
      const parsed = parseArrayIngredients(
        keys.sort((a, b) => Number(a) - Number(b)).map((key) => value[key]),
      );
      return parsed.length > 0 ? parsed : undefined;
    }

    if ('rawMaterialId' in value || 'quantity' in value) {
      return [normalizeIngredient(value)];
    }
  }

  throw new BadRequestException(
    'ingredients must be an array of objects with rawMaterialId and quantity',
  );
}
