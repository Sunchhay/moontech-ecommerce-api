// users/users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // only if UsersService needs AuthService

@Module({
    imports: [
        PrismaModule,
        // only add forwardRef if there is a circular dependency with AuthModule
        forwardRef(() => AuthModule),
    ],
    providers: [UsersService],
    controllers: [UsersController],
    exports: [UsersService],               
})
export class UsersModule { }
