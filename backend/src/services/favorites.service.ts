import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

export class FavoritesService {
  async list(userId: string) {
    return prisma.favorite.findMany({
      where: { userId },
      include: {
        guide: { include: { vehicle: true, part: true, steps: { take: 1, orderBy: { stepNumber: 'asc' } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(userId: string, guideId: string) {
    const guide = await prisma.repairGuide.findUnique({ where: { id: guideId } });
    if (!guide) throw new AppError('Guide not found', 404);

    return prisma.favorite.upsert({
      where: { userId_guideId: { userId, guideId } },
      create: { userId, guideId },
      update: {},
      include: { guide: { include: { vehicle: true, part: true } } },
    });
  }

  async remove(userId: string, guideId: string) {
    await prisma.favorite.deleteMany({ where: { userId, guideId } });
  }
}

export const favoritesService = new FavoritesService();
