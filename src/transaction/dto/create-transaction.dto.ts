import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
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
    example: '2026-06-15T08:00:00+07:00',
    description: 'Tanggal transaksi (ISO 8601, timezone Jakarta +07:00). Default: sekarang.',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    example: 150000,
    description:
      'Total nominal transaksi. Untuk SALE opsional (default jumlah subTotal item). Untuk PURCHASE dihitung server dari subTotal items.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 4 })
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
