import { ApiProperty } from '@nestjs/swagger';

export class ProductIngredientSwaggerDto {
  @ApiProperty({
    example: '6e365c6f-2c0c-4252-911f-ae5b9146e40b',
    description: 'ID bahan baku yang digunakan',
  })
  rawMaterialId: string;

  @ApiProperty({ example: 0.1, description: 'Jumlah bahan baku per produk' })
  quantity: number;
}
