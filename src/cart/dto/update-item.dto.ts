import { IsNumber, Min } from 'class-validator';
export class UpdateItemDto {
    @IsNumber() @Min(0) qty: number; // 0 = remove
}
