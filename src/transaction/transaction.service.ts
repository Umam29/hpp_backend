import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Transaction } from '../generated/prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionItemDto } from './dto/transaction-item.dto';
import { ProductPricingService } from '../product/product-pricing.service';
import { roundPrice } from '../product/helpers/product-pricing.helper';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

interface ResolvedTransactionItem {
  productId?: string | null;
  rawMaterialId?: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

@Injectable()
export class TransactionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productPricingService: ProductPricingService,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Transaction>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaService.transaction.findMany({
        skip,
        take: limit,
        include: { transactionItems: true },
        orderBy: { date: 'desc' },
      }),
      this.prismaService.transaction.count(),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async createTransaction(
    dto: CreateTransactionDto,
    userId: string,
  ): Promise<Transaction> {
    return this.prismaService.$transaction(async (tx) => {
      const createdAt = new Date();
      let resolvedItems: ResolvedTransactionItem[];

      if (dto.type === 'INCOME' && dto.category === 'SALE') {
        resolvedItems = await this.resolveSaleItems(dto.items, tx);
      } else if (
        dto.type === 'EXPENSE' &&
        dto.category === 'RAW_MATERIAL_PURCHASE'
      ) {
        resolvedItems = this.resolvePurchaseItems(dto.items);
      } else {
        throw new BadRequestException(
          'Unsupported transaction type and category combination',
        );
      }

      // SALE: totalAmount dari input user; PURCHASE: dihitung dari items
      const totalAmount =
        dto.type === 'INCOME' && dto.category === 'SALE'
          ? roundPrice(dto.totalAmount ?? 0)
          : roundPrice(
              resolvedItems.reduce((sum, item) => sum + item.subTotal, 0),
            );

      const transactionId = randomUUID();

      const transaction = await tx.transaction.create({
        data: {
          id: transactionId,
          type: dto.type,
          category: dto.category,
          totalAmount,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
          createdBy: userId,
          updatedBy: userId,
          createdAt,
          updatedAt: createdAt,
          transactionItems: {
            create: resolvedItems.map((item) => ({
              id: randomUUID(),
              productId: item.productId,
              rawMaterialId: item.rawMaterialId,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subTotal: item.subTotal,
              createdAt,
              updatedAt: createdAt,
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        },
        include: { transactionItems: true },
      });

      if (dto.type === 'EXPENSE' && dto.category === 'RAW_MATERIAL_PURCHASE') {
        const rawMaterialIds = await this.processRawMaterialPurchase(
          resolvedItems,
          tx,
          transactionId,
          userId,
        );

        await this.productPricingService.recalculateProductsByRawMaterialIds(
          tx,
          rawMaterialIds,
          userId,
          transactionId,
        );
      } else {
        await this.processSale(resolvedItems, tx, transactionId, userId);
      }

      return transaction;
    });
  }

  private async resolveSaleItems(
    items: TransactionItemDto[],
    tx: Prisma.TransactionClient,
  ): Promise<ResolvedTransactionItem[]> {
    const resolvedItems: ResolvedTransactionItem[] = [];

    for (const item of items) {
      if (!item.productId) {
        throw new BadRequestException('Each SALE item must include productId');
      }

      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Product not found for id ${item.productId}`,
        );
      }

      if (product.sellingPrice == null) {
        throw new BadRequestException(
          `Product id ${item.productId} has no selling price. Please ensure the product has ingredients and margin set.`,
        );
      }

      const unitPrice = product.sellingPrice;
      const subTotal = roundPrice(unitPrice * item.quantity);

      resolvedItems.push({
        productId: item.productId,
        rawMaterialId: null,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice,
        subTotal,
      });
    }

    return resolvedItems;
  }

  private resolvePurchaseItems(
    items: TransactionItemDto[],
  ): ResolvedTransactionItem[] {
    return items.map((item) => {
      if (!item.rawMaterialId) {
        throw new BadRequestException(
          'Each RAW_MATERIAL_PURCHASE item must include rawMaterialId',
        );
      }

      if (item.unitPrice == null) {
        throw new BadRequestException(
          'Each RAW_MATERIAL_PURCHASE item must include unitPrice',
        );
      }

      return {
        productId: null,
        rawMaterialId: item.rawMaterialId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subTotal: roundPrice(item.unitPrice * item.quantity),
      };
    });
  }

  private async processRawMaterialPurchase(
    items: ResolvedTransactionItem[],
    tx: Prisma.TransactionClient,
    referenceId: string,
    userId: string,
  ): Promise<string[]> {
    const rawMaterialIds: string[] = [];

    for (const item of items) {
      if (!item.rawMaterialId) {
        continue;
      }

      rawMaterialIds.push(item.rawMaterialId);

      const existingRawMaterial = await tx.rawMaterial.findUnique({
        where: { id: item.rawMaterialId },
      });

      if (!existingRawMaterial) {
        throw new NotFoundException(
          `RawMaterial not found for id ${item.rawMaterialId}`,
        );
      }

      const previousStock = existingRawMaterial.stock;
      const previousAveragePrice = existingRawMaterial.averagePrice;
      const newStock = previousStock + item.quantity;
      const newAveragePrice =
        newStock === 0
          ? 0
          : (previousStock * previousAveragePrice +
              item.quantity * item.unitPrice) /
            newStock;

      await tx.rawMaterial.update({
        where: { id: item.rawMaterialId },
        data: {
          stock: newStock,
          averagePrice: newAveragePrice,
          lastPurchaseQuantity: item.quantity,
          lastPurchaseTotal: item.quantity * item.unitPrice,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      await tx.inventoryLog.create({
        data: {
          id: randomUUID(),
          rawMaterialId: item.rawMaterialId,
          type: 'IN_PURCHASE',
          quantity: item.quantity,
          price: item.unitPrice,
          referenceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    return [...new Set(rawMaterialIds)];
  }

  private async processSale(
    items: ResolvedTransactionItem[],
    tx: Prisma.TransactionClient,
    referenceId: string,
    userId: string,
  ): Promise<void> {
    const now = new Date();

    for (const item of items) {
      if (!item.productId) {
        throw new BadRequestException('Each SALE item must include productId');
      }

      // Load product with ingredients
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: {
          productIngredients: {
            include: { rawMaterial: true },
          },
        },
      });

      if (!product) {
        throw new NotFoundException(
          `Product not found for id ${item.productId}`,
        );
      }

      // Validate product stock
      // const newProductStock = product.stock - item.quantity;
      // if (newProductStock < 0) {
      //   throw new BadRequestException(
      //     `Insufficient stock for product "${product.name}" (available: ${product.stock}, requested: ${item.quantity})`,
      //   );
      // }

      // Validate raw material stock for all ingredients before deducting
      for (const ingredient of product.productIngredients) {
        const requiredQty = ingredient.quantity * item.quantity;
        const rawMaterial = ingredient.rawMaterial;

        if (rawMaterial.stock < requiredQty) {
          throw new BadRequestException(
            `Insufficient raw material stock for "${rawMaterial.name}" (available: ${rawMaterial.stock} ${rawMaterial.unit}, required: ${requiredQty} ${rawMaterial.unit}) for product "${product.name}"`,
          );
        }
      }

      // Deduct product stock
      // await tx.product.update({
      //   where: { id: item.productId },
      //   data: {
      //     stock: newProductStock,
      //     updatedAt: now,
      //     updatedBy: userId,
      //   },
      // });

      // Deduct raw material stock and create inventory log per ingredient
      for (const ingredient of product.productIngredients) {
        const requiredQty = ingredient.quantity * item.quantity;
        const newRawStock = ingredient.rawMaterial.stock - requiredQty;

        await tx.rawMaterial.update({
          where: { id: ingredient.rawMaterialId },
          data: {
            stock: newRawStock,
            updatedAt: now,
            updatedBy: userId,
          },
        });

        await tx.inventoryLog.create({
          data: {
            id: randomUUID(),
            rawMaterialId: ingredient.rawMaterialId,
            type: 'OUT_SALE',
            quantity: requiredQty,
            price: ingredient.rawMaterial.averagePrice,
            referenceId,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }
    }
  }
}
