import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { slugify } from 'src/common/utils/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductSort, QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    // ---------- Helpers ----------
    private D(n: number) { return new Prisma.Decimal(n.toFixed(2)); }

    private orderBy(sort: ProductSort | undefined) {
        switch (sort) {
            case ProductSort.PRICE_ASC: return { price: 'asc' } as const;
            case ProductSort.PRICE_DESC: return { price: 'desc' } as const;
            case ProductSort.RATING: return [{ rating: 'desc' }, { reviewCount: 'desc' }] as any;
            case ProductSort.NEW:
            default: return { createdAt: 'desc' } as const;
        }
    }

    // ---------- CRUD ----------
    async create(dto: CreateProductDto) {
        const slug = dto.slug ?? slugify(dto.name);
        const exists = await this.prisma.product.findUnique({ where: { slug } });
        if (exists) throw new BadRequestException('Slug already in use');

        const data: Prisma.ProductCreateInput = {
            name: dto.name,
            slug,
            sku: dto.sku ?? undefined,
            brand: dto.brand ?? undefined,
            description: dto.description ?? undefined,
            price: this.D(dto.price),
            compareAtPrice: dto.compareAtPrice != null ? this.D(dto.compareAtPrice) : undefined,
            currency: dto.currency ?? '$',
            unit: dto.unit ?? undefined,
            unitLabel: dto.unitLabel ?? undefined,
            badges: dto.badges ?? [],
            attributes: dto.attributes ?? undefined,
            stock: dto.stock ?? 0,
            isActive: dto.isActive ?? true,
            category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
            images: dto.images?.length
                ? { create: dto.images.map(i => ({ url: i.url, alt: i.alt, pos: i.pos ?? 0 })) }
                : undefined,
        };

        return this.prisma.product.create({ data, include: { images: true, category: true } });
    }

    async update(id: string, dto: UpdateProductDto) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Product not found');

        const slug = dto.slug ?? (dto.name ? slugify(dto.name) : undefined);
        if (slug && slug !== product.slug) {
            const exists = await this.prisma.product.findUnique({ where: { slug } });
            if (exists) throw new BadRequestException('Slug already in use');
        }

        const data: Prisma.ProductUpdateInput = {
            name: dto.name ?? undefined,
            slug: slug ?? undefined,
            sku: dto.sku ?? undefined,
            brand: dto.brand ?? undefined,
            description: dto.description ?? undefined,
            price: dto.price != null ? this.D(dto.price) : undefined,
            compareAtPrice: dto.compareAtPrice != null ? this.D(dto.compareAtPrice) : undefined,
            currency: dto.currency ?? undefined,
            unit: dto.unit ?? undefined,
            unitLabel: dto.unitLabel ?? undefined,
            attributes: dto.attributes ?? undefined,
            badges: dto.badges ?? undefined,
            stock: dto.stock ?? undefined,
            isActive: dto.isActive ?? undefined,
            category: dto.categoryId ? { connect: { id: dto.categoryId } } : dto.categoryId === null ? { disconnect: true } : undefined,
        };

        // optional: replace images if provided (idempotent “set”)
        if (dto.images) {
            await this.prisma.$transaction([
                this.prisma.productImage.deleteMany({ where: { productId: id } }),
                ...(dto.images.map(i =>
                    this.prisma.productImage.create({ data: { productId: id, url: i.url, alt: i.alt, pos: i.pos ?? 0 } })
                )),
            ]);
        }

        return this.prisma.product.update({
            where: { id },
            data,
            include: { images: true, category: true },
        });
    }

    async remove(id: string) {
        // hard delete; swap to soft-delete by toggling isActive if you prefer
        await this.prisma.product.delete({ where: { id } });
        return { ok: true };
    }

    async findOne(id: string) {
        const p = await this.prisma.product.findUnique({
            where: { id },
            include: { images: { orderBy: { pos: 'asc' } }, category: true },
        });
        if (!p) throw new NotFoundException('Product not found');
        return p;
    }

    async findAll(query: QueryProductDto) {
        const {
            q, categoryId, minPrice, maxPrice, sort = 'new' as any,
            page = 1, pageSize = 20, activeOnly = true,
        } = query;

        const where: Prisma.ProductWhereInput = {
            AND: [
                activeOnly ? { isActive: true } : {},
                q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { brand: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }] } : {},
                categoryId ? { categoryId } : {},
                minPrice ? { price: { gte: this.D(Number(minPrice)) } } : {},
                maxPrice ? { price: { lte: this.D(Number(maxPrice)) } } : {},
            ],
        };

        const skip = (page - 1) * pageSize;

        const [total, data] = await this.prisma.$transaction([
            this.prisma.product.count({ where }),
            this.prisma.product.findMany({
                where,
                orderBy: this.orderBy(sort as any),
                skip,
                take: pageSize,
                include: { images: { orderBy: { pos: 'asc' } }, category: true },
            }),
        ]);

        return { total, page, pageSize, data };
    }

    // ---------- Inventory / Images helpers ----------
    async setStock(id: string, stock: number) {
        return this.prisma.product.update({ where: { id }, data: { stock } });
    }

    async addImage(productId: string, url: string, alt?: string, pos = 0) {
        await this.findOne(productId);
        return this.prisma.productImage.create({ data: { productId, url, alt, pos } });
    }

    async removeImage(productId: string, imageId: string) {
        await this.prisma.productImage.delete({ where: { id: imageId } });
        return this.findOne(productId);
    }

    async activate(id: string, isActive: boolean) {
        return this.prisma.product.update({ where: { id }, data: { isActive } });
    }
}
