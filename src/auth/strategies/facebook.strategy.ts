import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor() {
        super({
            clientID: process.env.FB_APP_ID ?? 'FB_ID',
            clientSecret: process.env.FB_APP_SECRET ?? 'FB_SECRET',
            callbackURL: process.env.FB_CALLBACK_URL ?? 'http://localhost:3000/api/v1/auth/facebook/callback',
            profileFields: ['id', 'displayName', 'photos', 'email'],
        });
    }
    async validate(_accessToken: string, _refreshToken: string, profile: any) {
        const { id, displayName, photos, emails } = profile;
        return { id, name: displayName, picture: photos?.[0]?.value, email: emails?.[0]?.value };
        // controller should upsert account ↔ user
    }
}
