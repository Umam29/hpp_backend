import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { roundPrice } from '../product/helpers/product-pricing.helper';

interface MonthlyAccumulator {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  async getDashboard(year?: number) {
    const transactions = await this.prismaService.transaction.findMany({
      select: {
        date: true,
        type: true,
        totalAmount: true,
      },
      orderBy: { date: 'asc' },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const monthlyMap = new Map<string, MonthlyAccumulator>();

    for (const transaction of transactions) {
      const txDate = new Date(transaction.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth() + 1;
      const amount = transaction.totalAmount;

      const includeInSummary = year === undefined || txYear === year;

      if (includeInSummary) {
        if (transaction.type === 'INCOME') {
          totalIncome += amount;
        } else if (transaction.type === 'EXPENSE') {
          totalExpense += amount;
        }
      }

      if (year !== undefined && txYear !== year) {
        continue;
      }

      const key = `${txYear}-${txMonth}`;
      const existing = monthlyMap.get(key) ?? {
        year: txYear,
        month: txMonth,
        totalIncome: 0,
        totalExpense: 0,
      };

      if (transaction.type === 'INCOME') {
        existing.totalIncome += amount;
      } else if (transaction.type === 'EXPENSE') {
        existing.totalExpense += amount;
      }

      monthlyMap.set(key, existing);
    }

    const profit = roundPrice(totalIncome - totalExpense);
    const balance = Math.max(0, profit);

    const monthly = Array.from(monthlyMap.values())
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map((item) => {
        const monthBalance = roundPrice(item.totalIncome - item.totalExpense);
        return {
          year: item.year,
          month: item.month,
          totalIncome: roundPrice(item.totalIncome),
          totalExpense: roundPrice(item.totalExpense),
          balance: Math.max(0, monthBalance),
        };
      });

    const topProducts = await this.getTopProducts();
    const rawMaterialExpenseShares =
      await this.getRawMaterialExpenseShares(year);

    return {
      summary: {
        totalIncome: roundPrice(totalIncome),
        totalExpense: roundPrice(totalExpense),
        profit,
        balance,
      },
      monthly,
      topProducts,
      rawMaterialExpenseShares,
    };
  }

  private async getRawMaterialExpenseShares(year?: number) {
    const items = await this.prismaService.transactionItem.findMany({
      where: {
        rawMaterialId: { not: null },
        transaction: {
          type: 'EXPENSE',
          category: 'RAW_MATERIAL_PURCHASE',
          ...(year !== undefined
            ? {
                date: {
                  gte: new Date(year, 0, 1),
                  lt: new Date(year + 1, 0, 1),
                },
              }
            : {}),
        },
      },
      select: {
        rawMaterialId: true,
        subTotal: true,
        itemName: true,
      },
    });

    const amountMap = new Map<string, number>();
    for (const item of items) {
      if (!item.rawMaterialId) continue;
      const current = amountMap.get(item.rawMaterialId) ?? 0;
      amountMap.set(item.rawMaterialId, current + item.subTotal);
    }

    const rawMaterialIds = Array.from(amountMap.keys());
    const rawMaterials = await this.prismaService.rawMaterial.findMany({
      where: { id: { in: rawMaterialIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(
      rawMaterials.map((material) => [material.id, material.name]),
    );

    const total = Array.from(amountMap.values()).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    return Array.from(amountMap.entries())
      .map(([rawMaterialId, amount]) => ({
        rawMaterialId,
        rawMaterialName: nameMap.get(rawMaterialId) ?? 'Unknown',
        amount: roundPrice(amount),
        percentage:
          total === 0 ? 0 : roundPrice((amount / total) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  private async getTopProducts() {
    const grouped = await this.prismaService.transactionItem.groupBy({
      by: ['productId'],
      where: {
        productId: { not: null },
        transaction: {
          type: 'INCOME',
          category: 'SALE',
        },
      },
      _count: { id: true },
      _sum: { quantity: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const productIds = grouped
      .map((item) => item.productId)
      .filter((id): id is string => id !== null);

    const products = await this.prismaService.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productNameMap = new Map(
      products.map((product) => [product.id, product.name]),
    );

    return grouped
      .filter((item) => item.productId !== null)
      .map((item) => ({
        productId: item.productId as string,
        productName: productNameMap.get(item.productId as string) ?? 'Unknown',
        transactionCount: item._count.id,
        totalQuantitySold: roundPrice(item._sum.quantity ?? 0),
      }));
  }
}
