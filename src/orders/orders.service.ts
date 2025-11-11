import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function genCode() {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${ymd}-${rand}`;
}

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    async list(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { items: { include: { product: true } } },
        });
    }

    detail(userId: string, id: string) {
        return this.prisma.order.findFirst({
            where: { id, userId },
            include: { items: { include: { product: true } } },
        });
    }

    async checkout(userId: string, addressId?: string, note?: string) {
        const cart = await this.prisma.cart.findFirst({
            where: { userId, status: 'OPEN' },
            include: { items: true },
        });
        if (!cart || cart.items.length === 0) throw new BadRequestException('Cart empty');

        return this.prisma.$transaction(async (tx) => {
            // snapshot items
            const items = await Promise.all(
                cart.items.map(async (ci) => {
                    const p = await tx.product.findUnique({ where: { id: ci.productId } });
                    if (!p) throw new BadRequestException('Product not found');
                    if (p.stock < ci.qty) throw new BadRequestException('Insufficient stock');
                    await tx.product.update({ where: { id: p.id }, data: { stock: { decrement: ci.qty } } });

                    return {
                        productId: p.id,
                        qty: ci.qty,
                        unitPrice: ci.unitPrice as any,
                        currency: ci.currency,
                    };
                })
            );

            const total = cart.total;

            const order = await tx.order.create({
                data: {
                    code: genCode(),
                    userId,
                    total: total as any,
                    status: 'PAID', // or PENDING then attach payment step
                    items: { create: items },
                },
                include: { items: true },
            });

            // close cart
            await tx.cart.update({ where: { id: cart.id }, data: { status: 'CHECKED_OUT' } });
            return order;
        });
    }
}
