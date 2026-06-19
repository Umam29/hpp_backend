import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductIngredientSwaggerDto } from './product-ingredient.swagger.dto';

const INGREDIENTS_EXAMPLE: ProductIngredientSwaggerDto[] = [
  {
    rawMaterialId: '6e365c6f-2c0c-4252-911f-ae5b9146e40b',
    quantity: 0.1,
  },
  {
    rawMaterialId: 'c341306a-f9f1-42b2-a873-cf194a17e2b8',
    quantity: 2,
  },
];

export class CreateProductFormSwaggerDto {
  @ApiProperty({ example: 'Minuman', description: 'Kategori produk' })
  productCategory: string;

  @ApiProperty({ example: 'Es Teh Manis', description: 'Nama produk' })
  name: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'File gambar produk (jpg, jpeg, png, gif, webp)',
  })
  image?: string;

  @ApiPropertyOptional({ example: 0, description: 'Stok awal produk' })
  stock?: number;

  @ApiPropertyOptional({ example: 30, description: 'Margin persentase (%)' })
  marginPercent?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Margin tetap (Rp)' })
  fixedMargin?: number;

  @ApiPropertyOptional({
    type: ProductIngredientSwaggerDto,
    isArray: true,
    example: INGREDIENTS_EXAMPLE,
    description: 'Daftar bahan baku komposisi produk',
  })
  ingredients?: ProductIngredientSwaggerDto[];
}

export class UpdateProductFormSwaggerDto {
  @ApiPropertyOptional({ example: 'Minuman', description: 'Kategori produk' })
  productCategory?: string;

  @ApiPropertyOptional({ example: 'Es Teh Manis', description: 'Nama produk' })
  name?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'File gambar produk baru (jpg, jpeg, png, gif, webp)',
  })
  image?: string;

  @ApiPropertyOptional({ example: 50, description: 'Stok produk' })
  stock?: number;

  @ApiPropertyOptional({ example: 30, description: 'Margin persentase (%)' })
  marginPercent?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Margin tetap (Rp)' })
  fixedMargin?: number;

  @ApiPropertyOptional({
    type: ProductIngredientSwaggerDto,
    isArray: true,
    example: INGREDIENTS_EXAMPLE,
    description: 'Daftar bahan baku (mengganti seluruh komposisi jika diisi)',
  })
  ingredients?: ProductIngredientSwaggerDto[];
}
