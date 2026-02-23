import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

export class UserService {
  async findAll() {
    return prisma.user.findMany({ select: safeSelect, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: safeSelect });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async update(id: string, data: { name?: string; email?: string }) {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: safeSelect,
    });
    return user;
  }

  async remove(id: string) {
    await prisma.user.delete({ where: { id } });
  }
}
