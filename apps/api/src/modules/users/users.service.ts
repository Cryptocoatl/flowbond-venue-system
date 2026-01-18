import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

export interface CreateUserData {
  email?: string;
  phone?: string;
  passwordHash?: string;
  name?: string;
  language?: string;
  isGuest?: boolean;
  isStaff?: boolean;
  isAdmin?: boolean;
}

export interface UpdateUserData {
  email?: string;
  phone?: string;
  passwordHash?: string;
  name?: string;
  language?: string;
  isGuest?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        name: data.name,
        language: data.language || 'en',
        isGuest: data.isGuest ?? true,
        isStaff: data.isStaff ?? false,
        isAdmin: data.isAdmin ?? false,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateLanguage(id: string, language: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { language },
    });
  }

  async convertGuestToUser(
    id: string,
    data: { email: string; passwordHash: string; name?: string },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        isGuest: false,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async getUserWithProgress(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        questProgress: {
          include: {
            quest: {
              include: {
                sponsor: true,
                tasks: true,
              },
            },
          },
        },
        taskCompletions: true,
        drinkPasses: {
          include: {
            reward: true,
            venue: true,
          },
        },
      },
    });
  }
}
