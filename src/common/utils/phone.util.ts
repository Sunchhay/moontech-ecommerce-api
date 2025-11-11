import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

export function normalizePhone(input: string, defaultCountry = 'KH' as any): string {
    const p = parsePhoneNumberFromString(input, defaultCountry);
    if (!p || !p.isValid()) throw new Error('Invalid phone');
    return p.number; // E.164
}
