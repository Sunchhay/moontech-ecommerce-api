import { Controller, Get, Param, Post, UseGuards, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WishlistService } from './wishlist.service';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'wishlist', version: '1' })
export class WishlistController {
    constructor(private service: WishlistService) { }

    @Get() list(@CurrentUser() u: any) { return this.service.list(u.id); }
    @Post(':productId') toggle(@CurrentUser() u: any, @Param('productId') pid: string) {
        return this.service.toggle(u.id, pid);
    }
    @Delete(':productId') remove(@CurrentUser() u: any, @Param('productId') pid: string) {
        return this.service.remove(u.id, pid);
    }
}
