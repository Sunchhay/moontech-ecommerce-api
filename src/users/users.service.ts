import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByIdentifier(identifier: string) {
    // identifier may be email or phone or providerUserId
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { phone: identifier },
          { accounts: { some: { providerUserId: identifier } } },
        ],
      },
      include: { accounts: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { accounts: true } });
  }
}
