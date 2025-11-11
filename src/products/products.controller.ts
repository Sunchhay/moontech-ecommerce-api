import {
    Body, Controller, Delete, Get, Param, Patch, Post, Query
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@ApiTags('Products')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
    constructor(private service: ProductsService) { }

    // List with filters/sort/pagination
    @Get()
    list(@Query() q: QueryProductDto) {
        return this.service.findAll(q);
    }

    @Get(':id')
    detail(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateProductDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }

    // Inventory / activation
    @Patch(':id/stock')
    setStock(@Param('id') id: string, @Body('stock') stock: number) {
        return this.service.setStock(id, Number(stock));
    }

    @Patch(':id/activate')
    activate(@Param('id') id: string, @Body('isActive') isActive: boolean) {
        return this.service.activate(id, !!isActive);
    }

    // Images management
    @Post(':id/images')
    addImage(
        @Param('id') id: string,
        @Body() body: { url: string; alt?: string; pos?: number },
    ) {
        return this.service.addImage(id, body.url, body.alt, body.pos ?? 0);
    }

    @Delete(':id/images/:imageId')
    removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
        return this.service.removeImage(id, imageId);
    }
}
