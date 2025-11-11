import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@ApiTags('Carts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'cart', version: '1' })
export class CartController {
    constructor(private service: CartService) { }

    @Get() get(@CurrentUser() u: any) { return this.service.get(u.id); }

    @Post('items') add(@CurrentUser() u: any, @Body() dto: AddItemDto) {
        return this.service.addItem(u.id, dto.productId, dto.qty);
    }

    @Patch('items/:productId') update(@CurrentUser() u: any, @Param('productId') pid: string, @Body() dto: UpdateItemDto) {
        return this.service.updateItem(u.id, pid, dto.qty);
    }

    @Delete('items/:productId') remove(@CurrentUser() u: any, @Param('productId') pid: string) {
        return this.service.removeItem(u.id, pid);
    }

    @Post('clear') clear(@CurrentUser() u: any) { return this.service.clear(u.id); }
}
