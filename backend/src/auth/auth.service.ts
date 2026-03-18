import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(userData: Partial<User>) {
    const existingUser = await this.usersService.findOneByEmail(userData.email!);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }
    const user = await this.usersService.create(userData);
    return this.login(user);
  }

  async googleLogin(req: any) {
    if (!req.user) {
      return { message: 'No user from google' };
    }
    // Check if user exists
    let user = await this.usersService.findOneByEmail(req.user.email);
    if (!user) {
      // Create new user for OAuth
      user = await this.usersService.create({
        email: req.user.email,
        username: `${req.user.firstName}${req.user.lastName || ''}${Math.floor(Math.random() * 1000)}`,
        avatarUrl: req.user.picture,
      });
    }
    return this.login(user);
  }

  async validatePhoneUser(phone: string): Promise<any> {
    return this.usersService.findOneByPhone(phone);
  }

  async registerPhoneUser(phone: string): Promise<any> {
    return this.usersService.create({
      phone,
      username: `user_${phone.slice(-4)}${Math.floor(Math.random() * 1000)}`,
    });
  }
}
