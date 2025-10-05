import { base64urlToUint8Array, uint8ArrayToBase64url } from './base64';


export async function pbkdf2HmacUrlSafe(
    password: string,
    salt: string,
    iterations: number,
    keyLength: number, // In bits (e.g., 256 for 32 bytes)
    digest: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<string> {
    // Decode salt from URL-safe base64 to Uint8Array
    const saltBytes = base64urlToUint8Array(salt);

    // Encode password to Uint8Array (UTF-8)
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    // Import password as CryptoKey for PBKDF2
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        passwordBytes.slice(0),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    // Derive bits using PBKDF2
    const keyBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBytes.slice(0),
            iterations: iterations,
            hash: digest
        },
        passwordKey,
        keyLength,
    );

    // Convert ArrayBuffer to Uint8Array and encode to URL-safe base64
    const keyBytes = new Uint8Array(keyBuffer);
    return uint8ArrayToBase64url(keyBytes);
}
