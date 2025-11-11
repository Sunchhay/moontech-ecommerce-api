import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CartController } from './cart/cart.controller';
import { CartModule } from './cart/cart.module';
import { WishlistService } from './wishlist/wishlist.service';
import { WishlistController } from './wishlist/wishlist.controller';
import { WishlistModule } from './wishlist/wishlist.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CartModule,
    WishlistModule,
  ],
  controllers: [CartController, WishlistController],
  providers: [WishlistService],
})
export class AppModule { }
