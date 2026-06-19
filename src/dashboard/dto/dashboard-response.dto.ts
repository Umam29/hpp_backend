import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty({ example: 15000000, description: 'Total pemasukan (INCOME)' })
  totalIncome: number;

  @ApiProperty({ example: 8000000, description: 'Total pengeluaran (EXPENSE)' })
  totalExpense: number;

  @ApiProperty({
    example: 7000000,
    description: 'Keuntungan (totalIncome - totalExpense, bisa negatif)',
  })
  profit: number;

  @ApiProperty({
    example: 7000000,
    description: 'Saldo (totalIncome - totalExpense, minimum 0)',
  })
  balance: number;
}

export class DashboardMonthlyDto {
  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 6, description: 'Bulan (1-12)' })
  month: number;

  @ApiProperty({ example: 2500000 })
  totalIncome: number;

  @ApiProperty({ example: 1200000 })
  totalExpense: number;

  @ApiProperty({ example: 1300000, description: 'Saldo bulan ini (minimum 0)' })
  balance: number;
}

export class DashboardRawMaterialExpenseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  rawMaterialId: string;

  @ApiProperty({ example: 'Gula Pasir' })
  rawMaterialName: string;

  @ApiProperty({ example: 750000 })
  amount: number;

  @ApiProperty({ example: 35.5, description: 'Persentase dari total pengeluaran bahan baku' })
  percentage: number;
}

export class DashboardTopProductDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  productId: string;

  @ApiProperty({ example: 'Es Teh Manis' })
  productName: string;

  @ApiProperty({
    example: 45,
    description: 'Jumlah transaksi penjualan produk ini',
  })
  transactionCount: number;

  @ApiProperty({ example: 120, description: 'Total quantity terjual' })
  totalQuantitySold: number;
}

export class DashboardDataDto {
  @ApiProperty({ type: DashboardSummaryDto })
  summary: DashboardSummaryDto;

  @ApiProperty({ type: [DashboardMonthlyDto] })
  monthly: DashboardMonthlyDto[];

  @ApiProperty({ type: [DashboardTopProductDto] })
  topProducts: DashboardTopProductDto[];

  @ApiProperty({
    type: [DashboardRawMaterialExpenseDto],
    description: 'Persentase pengeluaran per bahan baku dari transaksi pembelian',
  })
  rawMaterialExpenseShares: DashboardRawMaterialExpenseDto[];
}

export class DashboardResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Dashboard data retrieved successfully' })
  message: string;

  @ApiProperty({ type: DashboardDataDto })
  data: DashboardDataDto;
}

export class DashboardQueryDto {
  @ApiPropertyOptional({
    example: 2026,
    description: 'Filter data bulanan berdasarkan tahun (opsional)',
  })
  year?: number;
}
