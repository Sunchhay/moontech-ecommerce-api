import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
    @IsString() name: string;
    @IsString() slug: string;
    @IsString() @IsOptional() parentId?: string;
}
