import { Body, Controller, Get, Headers, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { RegisterPhoneDto } from './dto/register-phone.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
    constructor(private auth: AuthService) { }

    // --- Register ---
    @Post('register/email')
    registerEmail(@Body() dto: RegisterEmailDto) {
        return this.auth.registerEmail(dto);
    }

    @Post('register/phone')
    registerPhone(@Body() dto: RegisterPhoneDto) {
        return this.auth.registerPhone(dto);
    }

    // --- Login (email or phone) ---
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(
        @Req() req: any,
        @Body() _dto: LoginDto,
        @Headers('user-agent') ua?: string,
        @Ip() ip?: string,
    ) {
        return this.auth.login(req.user, ua, ip);
    }

    // --- Refresh (rotation) ---
    @Post('refresh')
    refresh(
        @Body() dto: RefreshTokenDto,
        @Headers('x-session-id') sessionId?: string,
        @Headers('user-agent') ua?: string,
        @Ip() ip?: string,
    ) {
        return this.auth.refresh(dto.refreshToken, sessionId, ua, ip);
    }

    // --- Logout ---
    @Post('logout')
    logout(@Headers('x-session-id') sessionId?: string, @Body('refreshToken') token?: string) {
        return this.auth.logout(sessionId, token);
    }

    // --- Me (protected) ---
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: any) {
        return this.auth.me(req.user.id);
    }
}
