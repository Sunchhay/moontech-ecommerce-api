import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
    constructor(private readonly prisma: PrismaService) { }

    // Ensure user has an OPEN cart
    private async ensureOpenCart(userId: string) {
        let cart = await this.prisma.cart.findFirst({
            where: { userId, status: 'OPEN' },
        });
        if (!cart) cart = await this.prisma.cart.create({ data: { userId } });
        return cart;
    }

    async get(userId: string) {
        const cart = await this.ensureOpenCart(userId);
        return this.prisma.cart.findUnique({
            where: { id: cart.id },
            include: {
                items: {
                    include: { product: { include: { images: true } } },
                },
            },
        });
    }

    async addItem(userId: string, productId: string, qty: number) {
        if (qty <= 0) qty = 1;

        const cart = await this.ensureOpenCart(userId);
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new NotFoundException('Product not found');

        await this.prisma.cartItem.upsert({
            where: { cartId_productId: { cartId: cart.id, productId } },
            update: { qty: { increment: qty } },
            create: {
                cartId: cart.id,
                productId,
                qty,
                // product.price is Prisma.Decimal in schema; assign directly
                unitPrice: product.price as Prisma.Decimal,
                currency: product.currency,
            },
        });

        await this.recompute(cart.id);
        return this.get(userId);
    }

    async updateItem(userId: string, productId: string, qty: number) {
        const cart = await this.ensureOpenCart(userId);

        if (qty <= 0) {
            await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
        } else {
            await this.prisma.cartItem.update({
                where: { cartId_productId: { cartId: cart.id, productId } },
                data: { qty },
            });
        }

        await this.recompute(cart.id);
        return this.get(userId);
    }

    async removeItem(userId: string, productId: string) {
        const cart = await this.ensureOpenCart(userId);
        await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
        await this.recompute(cart.id);
        return this.get(userId);
    }

    async clear(userId: string) {
        const cart = await this.ensureOpenCart(userId);
        await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await this.recompute(cart.id);
        return this.get(userId);
    }

    // ---- helpers ----
    private toDec(n: number) {
        // keep 2dp for money; adjust if your schema has different precision
        return new Prisma.Decimal(n.toFixed(2));
    }

    private asNumber(d: unknown) {
        // cartItem.unitPrice is Decimal in DB; be defensive
        if (d instanceof Prisma.Decimal) return d.toNumber();
        return Number(d);
    }

    private async recompute(cartId: string) {
        const items = await this.prisma.cartItem.findMany({ where: { cartId } });

        const subtotalNum = items.reduce(
            (sum, i) => sum + this.asNumber(i.unitPrice) * i.qty,
            0,
        );

        // extend here (coupons, deliveryFee, etc.)
        const discountNum = 0;
        const deliveryNum = 0;
        const totalNum = subtotalNum - discountNum + deliveryNum;

        await this.prisma.cart.update({
            where: { id: cartId },
            data: {
                subtotal: this.toDec(subtotalNum),
                discount: this.toDec(discountNum),
                deliveryFee: this.toDec(deliveryNum),
                total: this.toDec(totalNum),
            },
        });
    }
}
