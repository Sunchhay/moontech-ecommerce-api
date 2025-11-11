import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
export class RegisterPhoneDto {
    @ApiProperty({ example: '+85512345678' }) @IsString() phone: string;
    @ApiProperty() @IsString() @IsNotEmpty() fullName: string;
    @ApiProperty() @IsString() @MinLength(6) password: string;
}
