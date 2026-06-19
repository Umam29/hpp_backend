export const PRODUCT_PRICE_LOG_REASON = {
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  RAW_MATERIAL_RECALC: 'RAW_MATERIAL_RECALC',
} as const;

export type ProductPriceLogReason =
  (typeof PRODUCT_PRICE_LOG_REASON)[keyof typeof PRODUCT_PRICE_LOG_REASON];

export interface ProductIngredientPriceInput {
  rawMaterialId: string;
  quantity: number;
}

export interface RawMaterialPriceInput {
  id: string;
  averagePrice: number;
}

export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateCostPrice(
  ingredients: ProductIngredientPriceInput[],
  rawMaterials: RawMaterialPriceInput[],
): number {
  if (ingredients.length === 0) {
    return 0;
  }

  const priceMap = new Map(
    rawMaterials.map((rawMaterial) => [
      rawMaterial.id,
      rawMaterial.averagePrice,
    ]),
  );

  const total = ingredients.reduce((sum, ingredient) => {
    const averagePrice = priceMap.get(ingredient.rawMaterialId) ?? 0;
    return sum + ingredient.quantity * averagePrice;
  }, 0);

  return roundPrice(total);
}

export function calculateSellingPrice(
  costPrice: number,
  marginPercent?: number | null,
  fixedMargin?: number | null,
): number {
  if (fixedMargin != null && fixedMargin !== 0) {
    return roundPrice(costPrice + fixedMargin);
  }

  if (marginPercent != null && marginPercent !== 0) {
    return roundPrice(costPrice * (1 + marginPercent / 100));
  }

  return roundPrice(costPrice);
}

export function calculateProductPrices(
  ingredients: ProductIngredientPriceInput[],
  rawMaterials: RawMaterialPriceInput[],
  marginPercent?: number | null,
  fixedMargin?: number | null,
): { costPrice: number; sellingPrice: number } {
  const costPrice = calculateCostPrice(ingredients, rawMaterials);
  const sellingPrice = calculateSellingPrice(
    costPrice,
    marginPercent,
    fixedMargin,
  );

  return { costPrice, sellingPrice };
}
