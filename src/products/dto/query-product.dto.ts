import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

export enum ProductSort {
    NEW = 'new',
    PRICE_ASC = 'price_asc',
    PRICE_DESC = 'price_desc',
    RATING = 'rating',
}

export class QueryProductDto {
    @ApiPropertyOptional() @IsOptional() @IsString() q?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;

    @ApiPropertyOptional() @IsOptional() @IsNumberString() minPrice?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumberString() maxPrice?: string;

    @ApiPropertyOptional({ enum: ProductSort })
    @IsOptional() @IsEnum(ProductSort) sort?: ProductSort;

    @ApiPropertyOptional({ example: 1 }) @IsOptional() @Transform(({ value }) => Number(value) || 1)
    page?: number;

    @ApiPropertyOptional({ example: 20 }) @IsOptional() @Transform(({ value }) => Number(value) || 20)
    pageSize?: number;

    @ApiPropertyOptional({ example: true }) @IsOptional()
    @Transform(({ value }) => (value === 'false' ? false : true))
    activeOnly?: boolean;
}
