export function base64urlToUint8Array(input: string): Uint8Array {
    // Replace URL-safe chars and add padding
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    if (padding) {
        base64 += '='.repeat(4 - padding);
    }
    // Decode standard base64 to Uint8Array
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export function uint8ArrayToBase64url(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    let base64 = btoa(binary);
    // Replace standard chars with URL-safe and remove padding
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return base64;
}
