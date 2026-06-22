import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { nowJakarta } from '../common/helpers/jakarta-datetime';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async login(dto: LoginUserDto): Promise<UserResponseDto> {
    const user = await this.prismaService.user.findUnique({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLoginAt: nowJakarta() },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      lastLoginAt: updatedUser.lastLoginAt,
    };
  }
}
