import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
    constructor(private service: OrdersService) { }

    @Get() list(@CurrentUser() u: any) { return this.service.list(u.id); }
    @Get(':id') detail(@CurrentUser() u: any, @Param('id') id: string) { return this.service.detail(u.id, id); }
    @Post('checkout') checkout(@CurrentUser() u: any, @Body() dto: CheckoutDto) {
        return this.service.checkout(u.id, dto.addressId, dto.note);
    }
}
