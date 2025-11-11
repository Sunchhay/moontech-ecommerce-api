import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { normalizePhone } from 'src/common/utils/phone.util';
import { UserRole, AuthProvider } from '@prisma/client';

const RT_SALT_ROUNDS = 12;
const PW_SALT_ROUNDS = 12;

function addDays(d: number) {
    const t = new Date();
    t.setDate(t.getDate() + d);
    return t;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private users: UsersService,
        private jwt: JwtService,
    ) { }

    // ---------- REGISTER ----------
    async registerEmail({ email, password, fullName }: { email: string; password: string; fullName: string; }) {
        const lower = email.toLowerCase();

        return this.prisma.$transaction(async (tx) => {
            // if user exists by email, block
            const existingUser = await tx.user.findUnique({ where: { email: lower } });
            if (existingUser) throw new BadRequestException('Email already registered');

            const user = await tx.user.create({
                data: { email: lower, fullName, role: UserRole.USER },
            });

            await tx.account.create({
                data: {
                    userId: user.id,
                    provider: AuthProvider.EMAIL,
                    providerUserId: lower,
                    email: lower,
                    passwordHash: await bcrypt.hash(password, PW_SALT_ROUNDS),
                },
            });
            return user;
        });
    }

    async registerPhone({ phone, password, fullName }: { phone: string; password: string; fullName: string; }) {
        const normalized = normalizePhone(phone);

        return this.prisma.$transaction(async (tx) => {
            const accExists = await tx.account.findUnique({
                where: { provider_providerUserId: { provider: AuthProvider.PHONE, providerUserId: normalized } },
            });
            if (accExists) throw new BadRequestException('Phone already registered');

            // reuse user row if profile phone exists; else create
            const user =
                (await tx.user.findUnique({ where: { phone: normalized } })) ??
                (await tx.user.create({ data: { phone: normalized, fullName, role: UserRole.USER } }));

            await tx.account.create({
                data: {
                    userId: user.id,
                    provider: AuthProvider.PHONE,
                    providerUserId: normalized,
                    phone: normalized,
                    passwordHash: await bcrypt.hash(password, PW_SALT_ROUNDS),
                },
            });

            // mirror phone to user if missing
            if (!user.phone) {
                await tx.user.update({ where: { id: user.id }, data: { phone: normalized } });
            }
            return user;
        });
    }

    // ---------- VALIDATION ----------
    async validateUser(identifier: string, password: string) {
        const id = this.isEmail(identifier) ? identifier.toLowerCase()
            : this.isMaybePhone(identifier) ? normalizePhone(identifier)
                : identifier;

        const user = await this.users.findByIdentifier(id);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const acc = user.accounts.find(a => a.providerUserId === id);
        if (!acc?.passwordHash) throw new UnauthorizedException('Invalid credentials');

        const ok = await bcrypt.compare(password, acc.passwordHash);
        if (!ok) throw new UnauthorizedException('Invalid credentials');
        return user;
    }

    // ---------- TOKENS ----------
    private signAccess(user: { id: string; role: UserRole }) {
        const payload = { sub: user.id, role: user.role };
        return this.jwt.sign(payload, { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' as any });
    }

    private async createSession(userId: string, ua?: string, ip?: string) {
        // 1) create random refresh token (opaque)
        const refreshToken = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(refreshToken, RT_SALT_ROUNDS);
        const ttlDays = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS ?? '7', 10);

        // 2) store hashed in DB
        const session = await this.prisma.session.create({
            data: {
                userId,
                token: crypto.randomUUID(),        // optional opaque access entry id
                refreshToken: crypto.randomUUID(), // not used for JWT here—kept unique if column requires
                userAgent: ua,
                ip,
                expiresAt: addDays(ttlDays),
            },
        });

        // store hash in a separate table/column if you prefer; here we overload 'token' storage via metadata:
        await this.prisma.session.update({
            where: { id: session.id },
            data: { token: hash }, // token column holds hashed RT for simplicity
        });

        return { refreshToken, sessionId: session.id, expiresAt: session.expiresAt };
    }

    // login returns access + refresh (stored hashed)
    async login(user: { id: string; role: UserRole }, ua?: string, ip?: string) {
        const accessToken = this.signAccess(user);
        const { refreshToken, sessionId, expiresAt } = await this.createSession(user.id, ua, ip);
        return { accessToken, refreshToken, sessionId, refreshExpiresAt: expiresAt };
    }

    // ---------- REFRESH with rotation ----------
    async refresh(oldRefreshToken: string, sessionId?: string, ua?: string, ip?: string) {
        if (!oldRefreshToken) throw new UnauthorizedException('Missing token');

        // locate session by id if provided, else search all (better with id)
        const session = sessionId
            ? await this.prisma.session.findUnique({ where: { id: sessionId } })
            : null;

        const targetSessions = session
            ? [session]
            : await this.prisma.session.findMany({ where: { expiresAt: { gt: new Date() } } });

        let matched: { id: string; userId: string } | null = null;

        for (const s of targetSessions) {
            if (await bcrypt.compare(oldRefreshToken, s.token)) {
                matched = { id: s.id, userId: s.userId };
                break;
            }
        }
        if (!matched) throw new UnauthorizedException('Invalid refresh token');

        // rotate: delete old + create new in a transaction
        return this.prisma.$transaction(async (tx) => {
            await tx.session.delete({ where: { id: matched!.id } });
            const user = await tx.user.findUnique({ where: { id: matched!.userId } });
            if (!user) throw new UnauthorizedException();

            const accessToken = this.signAccess({ id: user.id, role: user.role });
            const { refreshToken, sessionId: newSessionId, expiresAt } = await this.createSession(
                user.id,
                ua,
                ip,
            );
            return { accessToken, refreshToken, sessionId: newSessionId, refreshExpiresAt: expiresAt };
        });
    }

    async logout(sessionId?: string, refreshToken?: string) {
        if (sessionId) {
            await this.prisma.session.delete({ where: { id: sessionId } }).catch(() => { });
            return { ok: true };
        }
        if (refreshToken) {
            // brute cleanup: delete any session that matches this token hash
            const all = await this.prisma.session.findMany();
            for (const s of all) {
                if (await bcrypt.compare(refreshToken, s.token)) {
                    await this.prisma.session.delete({ where: { id: s.id } }).catch(() => { });
                    break;
                }
            }
        }
        return { ok: true };
    }

    // ---------- helpers ----------
    private isEmail(v: string) { return /\S+@\S+\.\S+/.test(v); }
    private isMaybePhone(v: string) { return /[0-9+\s\-()]{6,}/.test(v); }

    // convenience for controller “me” if you want to return full user
    async me(userId: string) {
        return this.users.findById(userId);
    }
}
