import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

interface LoginDto {
  email: string;
  password: string;
}

export class AuthService {
  async register(dto: RegisterDto) {
    const exists = await prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new AppError('Email already in use', 409);

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashed },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const tokens = this.generateTokens(user.id, user.role);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const tokens = this.generateTokens(user.id, user.role);
    const { password: _, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async refresh(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new AppError('User not found', 404);
      return this.generateTokens(user.id, user.role);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async logout(_userId: string) {
    // Invalidate refresh token (implement token blacklist / DB invalidation as needed)
  }

  private generateTokens(userId: string, role: string) {
    const secret = process.env.JWT_SECRET!;
    const accessToken = jwt.sign({ sub: userId, role }, secret, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
    });
    const refreshToken = jwt.sign({ sub: userId }, secret, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
    });
    return { accessToken, refreshToken };
  }
}
