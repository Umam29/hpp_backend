import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from '../generated/prisma/client';
import {
  TransactionListResponseDto,
  TransactionSingleResponseDto,
} from './dto/transaction-response.dto';
import { ApiErrorResponseDto } from '../common/dto/api-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserId } from '../common/decorators/user-id.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { serializeDatesToJakarta } from '../common/helpers/serialize-jakarta-datetime';

@ApiTags('Transaction')
@ApiBearerAuth('access-token')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Ambil daftar transaksi (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, type: TransactionListResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  async findAll(@Query() query: PaginationQueryDto): Promise<{
    success: boolean;
    message: string;
    data: Transaction[];
    meta: TransactionListResponseDto['meta'];
  }> {
    const { data, meta } = await this.transactionService.findAll(query);

    return {
      success: true,
      message: 'Transactions retrieved successfully',
      data: serializeDatesToJakarta(data),
      meta,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Ambil transaksi berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID transaksi' })
  @ApiResponse({ status: 200, type: TransactionSingleResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async findOne(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: Transaction;
  }> {
    const data = await this.transactionService.findOne(id);

    return {
      success: true,
      message: 'Transaction retrieved successfully',
      data: serializeDatesToJakarta(data),
    };
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Buat transaksi baru',
    description:
      'EXPENSE: subTotal per item wajib, unitPrice dihitung server. INCOME/SALE: tidak mengubah stok produk/bahan baku.',
  })
  @ApiResponse({ status: 201, type: TransactionSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async create(
    @UserId() userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<{ success: boolean; message: string; data: Transaction }> {
    const data = await this.transactionService.createTransaction(
      createTransactionDto,
      userId,
    );

    return {
      success: true,
      message: 'Transaction created successfully',
      data,
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Perbarui transaksi',
    description:
      'Revert stok bahan baku (EXPENSE) lalu apply ulang items baru. INCOME tidak memanipulasi stok.',
  })
  @ApiParam({ name: 'id', description: 'ID transaksi' })
  @ApiResponse({ status: 200, type: TransactionSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<{ success: boolean; message: string; data: Transaction }> {
    const data = await this.transactionService.updateTransaction(
      id,
      updateTransactionDto,
      userId,
    );

    return {
      success: true,
      message: 'Transaction updated successfully',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Hapus transaksi',
    description:
      'EXPENSE: kurangi stok bahan baku & hapus inventory log. INCOME: hapus data saja.',
  })
  @ApiParam({ name: 'id', description: 'ID transaksi' })
  @ApiResponse({ status: 200, type: TransactionSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async remove(
    @UserId() userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; data: Transaction }> {
    const data = await this.transactionService.deleteTransaction(id, userId);

    return {
      success: true,
      message: 'Transaction deleted successfully',
      data,
    };
  }
}
