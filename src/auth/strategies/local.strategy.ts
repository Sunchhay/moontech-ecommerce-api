import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

// usernameField = identifier (email or phone)
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private auth: AuthService) {
        super({ usernameField: 'identifier', passwordField: 'password' });
    }
    async validate(identifier: string, password: string) {
        const user = await this.auth.validateUser(identifier, password);
        if (!user) throw new UnauthorizedException();
        return user;
    }
}
