import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Transaction } from '../generated/prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionItemDto } from './dto/transaction-item.dto';
import { ProductPricingService } from '../product/product-pricing.service';
import { roundPrice } from '../product/helpers/product-pricing.helper';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { nowJakarta, parseJakartaDate } from '../common/helpers/jakarta-datetime';

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

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id },
      include: { transactionItems: true },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction not found with id ${id}`);
    }

    return transaction;
  }

  async createTransaction(
    dto: CreateTransactionDto,
    userId: string,
  ): Promise<Transaction> {
    return this.prismaService.$transaction(async (tx) => {
      const now = nowJakarta();
      const transactionDate = dto.date ? parseJakartaDate(dto.date) : now;
      const transactionId = randomUUID();

      const resolvedItems = await this.resolveItems(dto, tx, userId);
      const totalAmount = this.calculateTotalAmount(dto, resolvedItems);

      const transaction = await tx.transaction.create({
        data: {
          id: transactionId,
          date: transactionDate,
          type: dto.type,
          category: dto.category,
          totalAmount,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
          updatedAt: now,
          transactionItems: {
            create: resolvedItems.map((item) => ({
              id: randomUUID(),
              productId: item.productId,
              rawMaterialId: item.rawMaterialId,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subTotal: item.subTotal,
              createdAt: now,
              updatedAt: now,
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        },
        include: { transactionItems: true },
      });

      if (dto.type === 'EXPENSE' && dto.category === 'RAW_MATERIAL_PURCHASE') {
        const rawMaterialIds = await this.applyPurchaseInventoryEffects(
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
      }

      return transaction;
    });
  }

  async updateTransaction(
    id: string,
    dto: UpdateTransactionDto,
    userId: string,
  ): Promise<Transaction> {
    return this.prismaService.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: { id },
        include: { transactionItems: true },
      });

      if (!existing) {
        throw new NotFoundException(`Transaction not found with id ${id}`);
      }

      if (
        existing.type === 'EXPENSE' &&
        existing.category === 'RAW_MATERIAL_PURCHASE'
      ) {
        await this.revertPurchaseInventoryEffects(tx, id, existing, userId);
      }

      await tx.transactionItem.deleteMany({ where: { transactionId: id } });

      const createDto: CreateTransactionDto = {
        type: existing.type,
        category: existing.category,
        paymentMethod: dto.paymentMethod ?? existing.paymentMethod,
        notes: dto.notes ?? existing.notes ?? undefined,
        totalAmount: dto.totalAmount ?? existing.totalAmount,
        items: dto.items ?? [],
      };

      if (!createDto.items.length) {
        throw new BadRequestException('Items are required for update');
      }

      const resolvedItems = await this.resolveItems(createDto, tx, userId);
      const totalAmount = this.calculateTotalAmount(createDto, resolvedItems);
      const now = nowJakarta();

      await tx.transaction.update({
        where: { id },
        data: {
          date: dto.date ? parseJakartaDate(dto.date) : existing.date,
          totalAmount,
          paymentMethod: createDto.paymentMethod,
          notes: createDto.notes,
          updatedBy: userId,
          updatedAt: now,
          transactionItems: {
            create: resolvedItems.map((item) => ({
              id: randomUUID(),
              productId: item.productId,
              rawMaterialId: item.rawMaterialId,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subTotal: item.subTotal,
              createdAt: now,
              updatedAt: now,
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        },
      });

      if (
        existing.type === 'EXPENSE' &&
        existing.category === 'RAW_MATERIAL_PURCHASE'
      ) {
        const rawMaterialIds = await this.applyPurchaseInventoryEffects(
          resolvedItems,
          tx,
          id,
          userId,
        );

        await this.productPricingService.recalculateProductsByRawMaterialIds(
          tx,
          rawMaterialIds,
          userId,
          id,
        );
      }

      return this.findOneInTx(tx, id);
    });
  }

  async deleteTransaction(id: string, userId: string): Promise<Transaction> {
    return this.prismaService.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: { id },
        include: { transactionItems: true },
      });

      if (!existing) {
        throw new NotFoundException(`Transaction not found with id ${id}`);
      }

      const affectedRawMaterialIds: string[] = [];

      if (
        existing.type === 'EXPENSE' &&
        existing.category === 'RAW_MATERIAL_PURCHASE'
      ) {
        for (const item of existing.transactionItems) {
          if (item.rawMaterialId) {
            affectedRawMaterialIds.push(item.rawMaterialId);
          }
        }
        await this.revertPurchaseInventoryEffects(tx, id, existing, userId);
      }

      await tx.transactionItem.deleteMany({ where: { transactionId: id } });
      await tx.transaction.delete({ where: { id } });

      if (affectedRawMaterialIds.length > 0) {
        await this.productPricingService.recalculateProductsByRawMaterialIds(
          tx,
          [...new Set(affectedRawMaterialIds)],
          userId,
          id,
        );
      }

      return existing;
    });
  }

  private async findOneInTx(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<Transaction> {
    const transaction = await tx.transaction.findUnique({
      where: { id },
      include: { transactionItems: true },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction not found with id ${id}`);
    }

    return transaction;
  }

  private calculateTotalAmount(
    dto: CreateTransactionDto,
    resolvedItems: ResolvedTransactionItem[],
  ): number {
    const itemsTotal = roundPrice(
      resolvedItems.reduce((sum, item) => sum + item.subTotal, 0),
    );

    if (dto.type === 'INCOME' && dto.category === 'SALE') {
      return roundPrice(dto.totalAmount ?? itemsTotal);
    }

    return itemsTotal;
  }

  private async resolveItems(
    dto: CreateTransactionDto,
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<ResolvedTransactionItem[]> {
    if (dto.type === 'INCOME' && dto.category === 'SALE') {
      return this.resolveSaleItems(dto.items, tx);
    }

    if (dto.type === 'EXPENSE' && dto.category === 'RAW_MATERIAL_PURCHASE') {
      return this.resolvePurchaseItems(dto.items, tx, userId);
    }

    throw new BadRequestException(
      'Unsupported transaction type and category combination',
    );
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
          `Product id ${item.productId} has no selling price.`,
        );
      }

      const unitPrice = product.sellingPrice;
      const subTotal = roundPrice(unitPrice * item.quantity);

      resolvedItems.push({
        productId: item.productId,
        rawMaterialId: null,
        itemName: item.itemName || product.name,
        quantity: item.quantity,
        unitPrice,
        subTotal,
      });
    }

    return resolvedItems;
  }

  private async resolvePurchaseItems(
    items: TransactionItemDto[],
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<ResolvedTransactionItem[]> {
    const resolvedItems: ResolvedTransactionItem[] = [];

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new BadRequestException('Item quantity must be greater than 0');
      }

      if (item.subTotal == null || item.subTotal <= 0) {
        throw new BadRequestException(
          'Each RAW_MATERIAL_PURCHASE item must include subTotal',
        );
      }

      let rawMaterialId = item.rawMaterialId;

      if (!rawMaterialId) {
        if (!item.newRawMaterialName?.trim() || !item.newRawMaterialUnit?.trim()) {
          throw new BadRequestException(
            'Each purchase item must include rawMaterialId or newRawMaterialName + newRawMaterialUnit',
          );
        }

        rawMaterialId = await this.createRawMaterialInline(
          tx,
          item.newRawMaterialName.trim(),
          item.newRawMaterialUnit.trim(),
          userId,
        );
      }

      const unitPrice = roundPrice(item.subTotal / item.quantity);
      const subTotal = roundPrice(item.subTotal);

      resolvedItems.push({
        productId: null,
        rawMaterialId,
        itemName: item.itemName || item.newRawMaterialName || 'Bahan baku',
        quantity: item.quantity,
        unitPrice,
        subTotal,
      });
    }

    return resolvedItems;
  }

  private async createRawMaterialInline(
    tx: Prisma.TransactionClient,
    name: string,
    unit: string,
    userId: string,
  ): Promise<string> {
    const rawMaterialId = randomUUID();
    const now = nowJakarta();

    await tx.rawMaterial.create({
      data: {
        id: rawMaterialId,
        name,
        unit,
        stock: 0,
        averagePrice: 0,
        reorderPoint: 0,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    return rawMaterialId;
  }

  private async applyPurchaseInventoryEffects(
    items: ResolvedTransactionItem[],
    tx: Prisma.TransactionClient,
    referenceId: string,
    userId: string,
  ): Promise<string[]> {
    const rawMaterialIds: string[] = [];
    const now = nowJakarta();

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
          lastPurchaseTotal: item.subTotal,
          updatedAt: now,
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
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    return [...new Set(rawMaterialIds)];
  }

  private async revertPurchaseInventoryEffects(
    tx: Prisma.TransactionClient,
    referenceId: string,
    transaction: Transaction & {
      transactionItems: Prisma.TransactionItemGetPayload<object>[];
    },
    userId: string,
  ): Promise<void> {
    const now = nowJakarta();

    for (const item of transaction.transactionItems) {
      if (!item.rawMaterialId) {
        continue;
      }

      const existingRawMaterial = await tx.rawMaterial.findUnique({
        where: { id: item.rawMaterialId },
      });

      if (!existingRawMaterial) {
        throw new NotFoundException(
          `RawMaterial not found for id ${item.rawMaterialId}`,
        );
      }

      const newStock = existingRawMaterial.stock - item.quantity;
      if (newStock < 0) {
        throw new BadRequestException(
          `Cannot revert purchase: insufficient stock for "${existingRawMaterial.name}"`,
        );
      }

      await tx.rawMaterial.update({
        where: { id: item.rawMaterialId },
        data: {
          stock: newStock,
          updatedAt: now,
          updatedBy: userId,
        },
      });
    }

    await tx.inventoryLog.deleteMany({
      where: {
        referenceId,
        type: 'IN_PURCHASE',
      },
    });
  }
}
