/**
 * prisma/seed.ts
 * Seed script for NestJS + Prisma e-commerce.
 *
 * Run:
 *   npm i -D tsx typescript
 *   npm i @prisma/client slugify bcrypt
 *   # package.json (top level):
 *   # "prisma": { "seed": "tsx prisma/seed.ts" }
 *   npx prisma db push
 *   npx prisma db seed
 */

import { PrismaClient, AuthProvider, UserRole, CartStatus, OrderStatus, Prisma } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import slugify from "slugify";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

/** ---------- JSON Types ---------- */
type CatalogMedia = { id?: string; uri?: string; fullUrl?: string | null };

type CatalogItem = {
    id?: string;
    code?: string;
    tag?: string | null;
    nameEn: string;
    nameKm?: string | null;
    nameZh?: string | null;
    descriptionEn?: string | null;

    // pricing/stock
    price?: number | null;
    salePrice?: number | null;
    compareAtPrice?: number | null;
    stock?: number | null;

    // UI/meta
    rating?: number | null;         // 1..100 (now in your JSON)
    badges?: string[] | null;       // optional array (fallback to tag)
    unit?: string | null;           // e.g., "piece", "pack"
    unitLabel?: string | null;      // e.g., "/piece", "/pack"

    type?: "ITEM" | string | null;  // we only import "ITEM"
    displayOrder?: number | null;
    medias?: CatalogMedia[];
};

type CatalogCategory = {
    id?: string;
    nameEn: string;
    enabled?: boolean;
    displayOrder?: number | null;
    items?: CatalogItem[];
};

/** ---------- Helpers ---------- */
const s = (t: string) =>
    slugify(String(t || ""), { lower: true, trim: true, strict: true });

const L = (...args: any[]) => console.log("[seed]", ...args);

function readCatalog(): CatalogCategory[] {
    const jsonPath = process.env.DATA_JSON_PATH || path.join(process.cwd(), "prisma", "data.json");
    L("Reading catalog from:", jsonPath);

    const raw = fs.readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(raw) as CatalogCategory[];
    if (!Array.isArray(data)) throw new Error("Catalog JSON root is not an array.");
    return data.filter((c) => c && c.enabled !== false);
}

const toDecimal = (n: number | null | undefined): Prisma.Decimal | undefined =>
    typeof n === "number" && !Number.isNaN(n) ? new Prisma.Decimal(n) : undefined;

/** ---------- Hard reset in FK-safe order ---------- */
async function reset() {
    L("Resetting tables…");
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.address.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verificationCode.deleteMany();
    await prisma.user.deleteMany();
    L("Reset completed.");
}

/** ---------- Users ---------- */
async function seedUsers() {
    L("Seeding users…");
    const admin = await prisma.user.create({
        data: {
            email: "sunchhay768@gmail.com",
            phone: "+85512345678",
            fullName: "Store Admin",
            avatarUrl: "https://i.pravatar.cc/256?img=1",
            role: UserRole.ADMIN,
            isActive: true,
            accounts: {
                create: {
                    provider: AuthProvider.EMAIL,
                    providerUserId: "sunchhay768@gmail.com",
                    email: "sunchhay768@gmail.com",
                    passwordHash: await bcrypt.hash("12345678", 10),
                },
            },
            addresses: {
                create: [
                    {
                        label: "Home",
                        receiver: "Store Admin",
                        phone: "+85512345678",
                        line1: "#12, Street 123",
                        city: "Phnom Penh",
                        country: "KH",
                        isDefault: true,
                    },
                ],
            },
        },
    });

    const user = await prisma.user.create({
        data: {
            email: "user@example.com",
            phone: "+85598765432",
            fullName: "Sok Dara",
            avatarUrl: "https://i.pravatar.cc/256?img=5",
            role: UserRole.USER,
            isActive: true,
            accounts: {
                create: {
                    provider: AuthProvider.EMAIL,
                    providerUserId: "user@example.com",
                    email: "user@example.com",
                    passwordHash: await bcrypt.hash("User@123", 10),
                },
            },
        },
    });

    L("Users seeded:", { admin: admin.email, user: user.email });
    return { admin, user };
}

/** ---------- Categories & Products from JSON (English-only) ---------- */
async function seedCategoriesAndProductsFromJSON() {
    L("Seeding categories & products from JSON…");
    const root = await prisma.category.create({ data: { name: "All", slug: "all" } });

    const catalog = readCatalog();

    let catCount = 0;
    let prodCount = 0;

    for (const c of catalog) {
        const catName = (c.nameEn || "").trim();
        if (!catName) continue;

        const cat = await prisma.category.create({
            data: { name: catName, slug: s(catName), parentId: root.id },
        });
        catCount++;

        const items = (c.items || []).filter((it) => (it?.type ?? "ITEM") === "ITEM");
        for (const it of items) {
            const name = (it.nameEn || "").trim();
            if (!name) continue;

            // Choose salePrice over price when present
            const priceNum =
                typeof it.salePrice === "number" ? it.salePrice :
                    typeof it.price === "number" ? it.price : 0;

            const compareNum =
                typeof it.compareAtPrice === "number" && it.compareAtPrice > priceNum
                    ? it.compareAtPrice
                    : undefined;

            const ratingNum =
                typeof it.rating === "number" && it.rating >= 1 && it.rating <= 100
                    ? it.rating
                    : undefined;

            const badgesArr =
                Array.isArray(it.badges) && it.badges.length
                    ? it.badges
                    : it.tag?.trim() ? [it.tag.trim()] : [];

            const imgs =
                (it.medias || []).map((m, pos) => ({
                    url:
                        (m?.fullUrl && m.fullUrl.trim()) ||
                        (m?.uri && m.uri.trim()) ||
                        "https://picsum.photos/seed/noimg/800/800",
                    alt: name,
                    pos,
                })) || [];

            const created = await prisma.product.create({
                data: {
                    name,
                    slug: s(name),
                    sku: it.code?.trim() || undefined,
                    brand: undefined,
                    description: (it.descriptionEn || undefined) || undefined,
                    price: toDecimal(priceNum)!,                          // required
                    compareAtPrice: toDecimal(compareNum),               // optional
                    currency: "USD",
                    unit: it.unit || "piece",
                    unitLabel: it.unitLabel || undefined,
                    stock: Number(it.stock ?? 0),
                    badges: badgesArr,
                    rating: ratingNum !== undefined ? toDecimal(ratingNum) : undefined,
                    reviewCount: 0,
                    attributes: undefined,
                    categoryId: cat.id,
                    isActive: true,
                    images: {
                        createMany: {
                            data: imgs.length
                                ? imgs
                                : [{ url: "https://picsum.photos/seed/noimg/800/800", alt: name, pos: 0 }],
                        },
                    },
                },
            });

            prodCount++;
            L(` + Product: ${created.name}${ratingNum ? ` (rating ${ratingNum}/100)` : ""}`);
        }
    }

    L(`Categories & products seeded: ${catCount} categories, ${prodCount} products`);
    return { catCount, prodCount };
}

/** ---------- Sample Cart, Wishlist, and Order ---------- */
async function seedCartWishlistAndOrder(userId: string) {
    L("Seeding sample cart + wishlist + order…");

    const products = await prisma.product.findMany({
        take: 3,
        orderBy: { createdAt: "asc" },
    });

    const cart = await prisma.cart.create({
        data: { userId, status: CartStatus.OPEN, currency: "USD" },
    });

    let subtotal = 0;
    for (const p of products) {
        subtotal += Number(p.price);
        await prisma.cartItem.create({
            data: { cartId: cart.id, productId: p.id, qty: 1, unitPrice: p.price, currency: "USD" },
        });
        await prisma.wishlistItem.create({ data: { userId, productId: p.id } });
    }
    await prisma.cart.update({ where: { id: cart.id }, data: { subtotal, total: subtotal } });

    const prods2 = await prisma.product.findMany({ take: 2 });
    const code = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const total = prods2.reduce((sum, p) => sum + Number(p.price), 0);

    await prisma.order.create({
        data: {
            code,
            userId,
            total,
            status: OrderStatus.PAID,
            items: {
                create: prods2.map((p) => ({
                    productId: p.id,
                    qty: 1,
                    unitPrice: p.price,
                    currency: "USD",
                })),
            },
        },
    });

    L("Sample cart, wishlist, and order seeded.");
}

/** ---------- Main ---------- */
async function main() {
    console.log("🚀 Starting seed…");
    await reset();

    const users = await seedUsers();
    await seedCategoriesAndProductsFromJSON();
    await seedCartWishlistAndOrder(users.user.id);

    console.log("✅ Seed completed");
}

/** ---------- Execute ---------- */
main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
