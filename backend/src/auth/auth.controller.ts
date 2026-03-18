import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Body,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { OtpService } from '../otp/otp.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private otpService: OtpService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth(@Req() req: any) {
    // Check google strategy logic
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/redirect')
  async googleAuthRedirect(@Req() req: any) {
    return this.authService.googleLogin(req);
  }

  @Post('phone/send-otp')
  async sendOtp(@Body('phone') phone: string) {
    const otp = await this.otpService.sendOtp(phone);
    // Returning the OTP here just for local testing / mock. 
    // In production, NEVER return it in the response body.
    return { message: 'OTP sent successfully', otp: process.env.NODE_ENV !== 'production' ? otp : undefined };
  }

  @Post('phone/verify-otp')
  async verifyOtp(@Body('phone') phone: string, @Body('otp') otp: string) {
    await this.otpService.verifyOtp(phone, otp);
    
    // Find or create user by phone
    let user = await this.authService.validatePhoneUser(phone);
    if (!user) {
      user = await this.authService.registerPhoneUser(phone);
    }
    
    return this.authService.login(user);
  }
}
