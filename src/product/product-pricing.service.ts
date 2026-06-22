import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../generated/prisma/client';
import {
  calculateProductPrices,
  PRODUCT_PRICE_LOG_REASON,
  ProductPriceLogReason,
} from './helpers/product-pricing.helper';
import { nowJakarta } from '../common/helpers/jakarta-datetime';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class ProductPricingService {
  async recalculateProduct(
    tx: TransactionClient,
    productId: string,
    userId: string,
    reason: ProductPriceLogReason,
    referenceId?: string | null,
  ): Promise<void> {
    const product = await tx.product.findUnique({
      where: { id: productId },
      include: {
        productIngredients: {
          include: { rawMaterial: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product not found with id ${productId}`);
    }

    const { costPrice, sellingPrice } = calculateProductPrices(
      product.productIngredients.map((ingredient) => ({
        rawMaterialId: ingredient.rawMaterialId,
        quantity: ingredient.quantity,
      })),
      product.productIngredients.map((ingredient) => ({
        id: ingredient.rawMaterial.id,
        averagePrice: ingredient.rawMaterial.averagePrice,
      })),
      product.marginPercent,
      product.fixedMargin,
    );

    const now = nowJakarta();

    await tx.product.update({
      where: { id: productId },
      data: {
        costPrice,
        sellingPrice,
        updatedAt: now,
        updatedBy: userId,
      },
    });

    await this.createPriceLog(
      tx,
      productId,
      costPrice,
      sellingPrice,
      reason,
      userId,
      referenceId,
      now,
    );
  }

  async recalculateProductsByRawMaterialIds(
    tx: TransactionClient,
    rawMaterialIds: string[],
    userId: string,
    referenceId: string,
  ): Promise<void> {
    if (rawMaterialIds.length === 0) {
      return;
    }

    const affectedProducts = await tx.productIngredient.findMany({
      where: { rawMaterialId: { in: rawMaterialIds } },
      select: { productId: true },
      distinct: ['productId'],
    });

    for (const { productId } of affectedProducts) {
      await this.recalculateProduct(
        tx,
        productId,
        userId,
        PRODUCT_PRICE_LOG_REASON.RAW_MATERIAL_RECALC,
        referenceId,
      );
    }
  }

  async createPriceLog(
    tx: TransactionClient,
    productId: string,
    costPrice: number,
    sellingPrice: number,
    reason: ProductPriceLogReason,
    userId: string,
    referenceId?: string | null,
    timestamp: Date = nowJakarta(),
  ): Promise<void> {
    await tx.productPriceLog.create({
      data: {
        id: randomUUID(),
        productId,
        costPrice,
        sellingPrice,
        reason,
        referenceId: referenceId ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }
}
