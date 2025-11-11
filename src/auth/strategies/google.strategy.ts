import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID ?? 'GOOGLE_ID',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'GOOGLE_SECRET',
            callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/api/v1/auth/google/callback',
            scope: ['profile', 'email'],
        });
    }

    async validate(_accessToken: string, _refreshToken: string, profile: any) {
        // return minimal profile for controller to upsert
        const { id, displayName, photos, emails } = profile;
        return { id, name: displayName, picture: photos?.[0]?.value, email: emails?.[0]?.value };
    }
}
