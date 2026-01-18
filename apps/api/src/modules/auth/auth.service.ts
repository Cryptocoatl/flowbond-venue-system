import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { securityConfig } from '../../config/security.config';

export interface JwtPayload {
  sub: string;
  email?: string;
  isGuest: boolean;
  isStaff: boolean;
  isAdmin: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email?: string;
    name?: string;
    language: string;
    isGuest: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenResponse> {
    // Check if user exists
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, securityConfig.bcrypt.saltRounds);

    // Create user
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      language: dto.language || 'en',
      isGuest: false,
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<TokenResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async createGuestUser(language: string = 'en'): Promise<TokenResponse> {
    const user = await this.usersService.create({
      language,
      isGuest: true,
    });

    return this.generateTokens(user);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<TokenResponse> {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private generateTokens(user: {
    id: string;
    email?: string | null;
    name?: string | null;
    language: string;
    isGuest: boolean;
    isStaff: boolean;
    isAdmin: boolean;
  }): TokenResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || undefined,
      isGuest: user.isGuest,
      isStaff: user.isStaff,
      isAdmin: user.isAdmin,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email || undefined,
        name: user.name || undefined,
        language: user.language,
        isGuest: user.isGuest,
      },
    };
  }
}
