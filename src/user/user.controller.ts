import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { LoginUserDto } from './dto/login-user.dto';
import {
  UserResponseDto,
  UserSingleResponseDto,
} from './dto/user-response.dto';
import { ApiErrorResponseDto } from '../common/dto/api-response.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login user',
    description:
      'Autentikasi user berdasarkan username dan password (bcrypt). Mengembalikan data user tanpa password. Gunakan field `id` dari response sebagai Bearer token di endpoint lain.',
  })
  @ApiResponse({ status: 200, type: UserSingleResponseDto })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto })
  async login(@Body() loginUserDto: LoginUserDto): Promise<{
    success: boolean;
    message: string;
    data: UserResponseDto;
  }> {
    const data = await this.userService.login(loginUserDto);

    return {
      success: true,
      message: 'Login successful',
      data,
    };
  }
}
