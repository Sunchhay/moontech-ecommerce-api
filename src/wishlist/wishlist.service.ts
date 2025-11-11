import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
    constructor(private prisma: PrismaService) { }

    list(userId: string) {
        return this.prisma.wishlistItem.findMany({
            where: { userId },
            include: { product: { include: { images: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async toggle(userId: string, productId: string) {
        const key = { userId_productId: { userId, productId } };
        const exists = await this.prisma.wishlistItem.findUnique({ where: key });
        if (exists) {
            await this.prisma.wishlistItem.delete({ where: key });
            return { liked: false };
        } else {
            await this.prisma.wishlistItem.create({ data: { userId, productId } });
            return { liked: true };
        }
    }

    remove(userId: string, productId: string) {
        return this.prisma.wishlistItem.delete({ where: { userId_productId: { userId, productId } } });
    }
}
