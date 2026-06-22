import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: '2026-06-15T08:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'CASH' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Catatan transaksi' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 150000,
    description: 'Total nominal untuk SALE (opsional, default jumlah subTotal item)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 4 })
  totalAmount?: number;

  @ApiPropertyOptional({ type: [TransactionItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items?: TransactionItemDto[];
}
