import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { TransactionItemDto } from './transaction-item.dto';

export class CreateTransactionDto {
  @ApiProperty({
    example: 'EXPENSE',
    enum: ['EXPENSE', 'INCOME'],
    description: 'Tipe transaksi',
  })
  @IsString()
  @IsIn(['EXPENSE', 'INCOME'])
  type: string;

  @ApiProperty({
    example: 'RAW_MATERIAL_PURCHASE',
    enum: ['RAW_MATERIAL_PURCHASE', 'SALE'],
    description: 'Kategori transaksi',
  })
  @IsString()
  @IsIn(['RAW_MATERIAL_PURCHASE', 'SALE'])
  category: string;

  @ApiPropertyOptional({
    example: 150000,
    description:
      'Total nominal transaksi. Untuk SALE wajib diisi sesuai nominal yang dibayar pelanggan. Untuk RAW_MATERIAL_PURCHASE dihitung server dari items.',
  })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiProperty({ example: 'CASH', description: 'Metode pembayaran' })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({
    example: 'Pembelian bahan baku bulanan',
    description: 'Catatan tambahan',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [TransactionItemDto],
    description: 'Daftar item transaksi',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items: TransactionItemDto[];
}
