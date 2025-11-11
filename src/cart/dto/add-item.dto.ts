import { IsNumber, IsString, Min } from 'class-validator';
export class AddItemDto {
    @IsString() productId: string;
    @IsNumber() @Min(1) qty: number;
}
