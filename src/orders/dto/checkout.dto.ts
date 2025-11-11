import { IsOptional, IsString } from 'class-validator';
export class CheckoutDto {
    @IsString() @IsOptional() addressId?: string;
    @IsString() @IsOptional() note?: string;
}
