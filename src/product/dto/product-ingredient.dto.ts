import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNumber } from 'class-validator';
import { parseOptionalNumber } from './form-field-parsers';

export class ProductIngredientDto {
  @ApiProperty({
    example: '6e365c6f-2c0c-4252-911f-ae5b9146e40b',
    description: 'ID bahan baku yang digunakan',
  })
  @IsString()
  rawMaterialId: string;

  @ApiProperty({ example: 0.1, description: 'Jumlah bahan baku per produk' })
  @Transform(({ value }) => parseOptionalNumber(value))
  @IsNumber()
  quantity: number;
}
