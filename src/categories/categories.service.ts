import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) { }

  create(dto: any) {
    return this.prisma.category.create({ data: dto });
  }

  list() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { children: true },
    });
  }

  detail(id: string) {
    return this.prisma.category.findUnique({ where: { id }, include: { children: true } });
  }

  update(id: string, dto: any) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
