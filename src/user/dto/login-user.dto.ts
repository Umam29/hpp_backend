import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'admin', description: 'Username pengguna' })
  @IsString()
  username: string;

  @ApiProperty({ example: '123456', description: 'Password pengguna' })
  @IsString()
  @MinLength(1)
  password: string;
}
