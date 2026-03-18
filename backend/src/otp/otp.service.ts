import { Injectable, BadRequestException } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpService {
  private redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis(this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'));
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(phone: string): Promise<string> {
    const otp = this.generateOtp();
    // In production, integrate MSG91 or Twilio API here
    console.log(`Sending OTP ${otp} to phone ${phone}`);
    
    // Store in Redis with 5 minute TTL
    await this.redis.set(`otp:${phone}`, otp, 'EX', 300);
    return otp;
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const storedOtp = await this.redis.get(`otp:${phone}`);
    if (!storedOtp) {
      throw new BadRequestException('OTP expired or invalid');
    }
    if (storedOtp !== otp) {
      throw new BadRequestException('Incorrect OTP');
    }
    // Delete OTP after successful verification
    await this.redis.del(`otp:${phone}`);
    return true;
  }
}

