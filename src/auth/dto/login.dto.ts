import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'email@example.com OR +85512345678' })
    @IsString() @IsNotEmpty()
    identifier: string;

    @ApiProperty({ minLength: 6 })
    @IsString() @MinLength(6)
    password: string;
}
