import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
    constructor(private service: CategoriesService) { }

    @Post() create(@Body() dto: CreateCategoryDto) { return this.service.create(dto); }
    @Get() list() { return this.service.list(); }
    @Get(':id') detail(@Param('id') id: string) { return this.service.detail(id); }
    @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) { return this.service.update(id, dto); }
    @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
