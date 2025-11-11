import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, ValidateNested, IsObject
} from 'class-validator';
import { Type } from 'class-transformer';

class ImageInput {
    @IsString() url: string;
    @IsString() @IsOptional() alt?: string;
    @IsNumber() @IsOptional() pos?: number;
}

export class CreateProductDto {
    @ApiProperty() @IsString() name: string;

    @ApiPropertyOptional() @IsString() @IsOptional() slug?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() sku?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() brand?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() description?: string;

    @ApiProperty() @IsNumber() @Min(0) price: number;
    @ApiPropertyOptional() @IsNumber() @IsOptional() compareAtPrice?: number;
    @ApiPropertyOptional() @IsString() @IsOptional() currency?: string;

    @ApiPropertyOptional() @IsString() @IsOptional() unit?: string;        // "piece", "bag"
    @ApiPropertyOptional() @IsString() @IsOptional() unitLabel?: string;   // "/110g"

    @ApiPropertyOptional() @IsString() @IsOptional() categoryId?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsArray() @IsOptional() badges?: string[];

    @ApiPropertyOptional({ type: Object, example: { color: 'red', origin: 'TH' } })
    @IsObject() @IsOptional() attributes?: Record<string, any>;

    @ApiPropertyOptional({ type: [ImageInput] })
    @ValidateNested({ each: true }) @Type(() => ImageInput)
    @IsArray() @IsOptional() images?: ImageInput[];

    @ApiPropertyOptional() @IsNumber() @IsOptional() stock?: number;
    @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
}
