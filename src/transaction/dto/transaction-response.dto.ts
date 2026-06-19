import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

export class TransactionItemResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440030' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  transactionId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440010' })
  productId?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440020' })
  rawMaterialId?: string | null;

  @ApiProperty({ example: 'Gula Pasir' })
  itemName: string;

  @ApiProperty({ example: 10 })
  quantity: number;

  @ApiProperty({
    example: 15000,
    description:
      'Harga per satuan. SALE: sellingPrice produk saat transaksi. RAW_MATERIAL_PURCHASE: harga beli per satuan.',
  })
  unitPrice: number;

  @ApiProperty({ example: 150000 })
  subTotal: number;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  createdBy?: string | null;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  updatedBy?: string | null;
}

export class TransactionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  date: Date;

  @ApiProperty({ example: 'EXPENSE', enum: ['EXPENSE', 'INCOME'] })
  type: string;

  @ApiProperty({
    example: 'RAW_MATERIAL_PURCHASE',
    enum: ['RAW_MATERIAL_PURCHASE', 'SALE'],
  })
  category: string;

  @ApiProperty({ example: 150000 })
  totalAmount: number;

  @ApiProperty({ example: 'CASH' })
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'Pembelian bahan baku bulanan' })
  notes?: string | null;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  createdBy?: string | null;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  updatedBy?: string | null;

  @ApiPropertyOptional({ type: [TransactionItemResponseDto] })
  transactionItems?: TransactionItemResponseDto[];
}

export class TransactionSingleResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Transaction created successfully' })
  message: string;

  @ApiProperty({ type: TransactionResponseDto })
  data: TransactionResponseDto;
}

export class TransactionListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Transactions retrieved successfully' })
  message: string;

  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
