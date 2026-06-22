import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  CreateProductFormSwaggerDto,
  UpdateProductFormSwaggerDto,
} from './dto/product-form.swagger.dto';
import { Product } from '../generated/prisma/client';
import {
  ProductListResponseDto,
  ProductSingleResponseDto,
} from './dto/product-response.dto';
import { ProductPriceLogListResponseDto } from './dto/product-price-log-response.dto';
import { ProductPriceLog } from '../generated/prisma/client';
import { ApiErrorResponseDto } from '../common/dto/api-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserId } from '../common/decorators/user-id.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { serializeDatesToJakarta } from '../common/helpers/serialize-jakarta-datetime';
import { MultipartNestedBodyInterceptor } from '../common/interceptors/multipart-nested-body.interceptor';
import {
  productImageFileFilter,
  productImageStorage,
  toProductImagePath,
  deleteProductImageFile,
} from './config/product-upload.config';

@ApiTags('Product')
@ApiBearerAuth('access-token')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductFormSwaggerDto })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: productImageStorage,
      fileFilter: productImageFileFilter,
    }),
    MultipartNestedBodyInterceptor,
  )
  @ApiOperation({ summary: 'Buat produk baru' })
  @ApiResponse({ status: 201, type: ProductSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  async create(
    @UserId() userId: string,
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<{ success: boolean; message: string; data: Product }> {
    const imagePath = image ? toProductImagePath(image.filename) : undefined;

    try {
      const data = await this.productService.create(
        createProductDto,
        userId,
        imagePath,
      );

      return {
        success: true,
        message: 'Product created successfully',
        data,
      };
    } catch (error) {
      if (imagePath) {
        await deleteProductImageFile(imagePath);
      }
      throw error;
    }
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Ambil daftar produk (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, type: ProductListResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  async findAll(@Query() query: PaginationQueryDto): Promise<{
    success: boolean;
    message: string;
    data: Product[];
    meta: ProductListResponseDto['meta'];
  }> {
    const { data, meta } = await this.productService.findAll(query);

    return {
      success: true,
      message: 'Products retrieved successfully',
      data: serializeDatesToJakarta(data),
      meta,
    };
  }

  @Get(':id/price-logs')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Riwayat perubahan harga produk' })
  @ApiParam({ name: 'id', description: 'ID produk' })
  @ApiResponse({ status: 200, type: ProductPriceLogListResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async findPriceLogs(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: ProductPriceLog[];
  }> {
    const data = await this.productService.findPriceLogs(id);

    return {
      success: true,
      message: 'Product price logs retrieved successfully',
      data: serializeDatesToJakarta(data),
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Ambil produk berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID produk' })
  @ApiResponse({ status: 200, type: ProductSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async findOne(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; data: Product }> {
    const data = await this.productService.findOne(id);

    return {
      success: true,
      message: 'Product retrieved successfully',
      data: serializeDatesToJakarta(data),
    };
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProductFormSwaggerDto })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: productImageStorage,
      fileFilter: productImageFileFilter,
    }),
    MultipartNestedBodyInterceptor,
  )
  @ApiOperation({ summary: 'Perbarui produk' })
  @ApiParam({ name: 'id', description: 'ID produk' })
  @ApiResponse({ status: 200, type: ProductSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<{ success: boolean; message: string; data: Product }> {
    const imagePath = image ? toProductImagePath(image.filename) : undefined;

    try {
      const data = await this.productService.update(
        id,
        updateProductDto,
        userId,
        imagePath,
      );

      return {
        success: true,
        message: 'Product updated successfully',
        data,
      };
    } catch (error) {
      if (imagePath) {
        await deleteProductImageFile(imagePath);
      }
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus produk' })
  @ApiParam({ name: 'id', description: 'ID produk' })
  @ApiResponse({ status: 200, type: ProductSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async remove(
    @UserId() userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; data: Product }> {
    const data = await this.productService.remove(id, userId);

    return {
      success: true,
      message: 'Product deleted successfully',
      data,
    };
  }
}
