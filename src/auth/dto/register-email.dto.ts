import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
export class RegisterEmailDto {
    @ApiProperty() @IsEmail() email: string;
    @ApiProperty() @IsString() @IsNotEmpty() fullName: string;
    @ApiProperty() @IsString() @MinLength(6) password: string;
}
