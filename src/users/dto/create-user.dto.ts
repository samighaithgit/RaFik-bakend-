import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'Mohammad Tamimi' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: 'mohammad@hebron.ps' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+970599000000' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/)
  phoneNumber?: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ enum: Role, example: Role.DEPARTMENT_STAFF })
  @IsEnum(Role)
  role: Role;
}
