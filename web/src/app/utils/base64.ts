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

const encode_regex = /[\+=\/]/g;
const decode_regex = /[\._\-]/g;

export function base64_encode(text: string) {
  return btoa(text).replace(encode_regex, encodeChar);
}

export function base64_decode(text: string) {
  return atob(text.replace(decode_regex, decodeChar));
}

function encodeChar(c: string) {
  switch (c) {
    case '+': return '.';
    case '=': return '-';
    case '/': return '_';
  }
  return c;
}

function decodeChar(c: string) {
  switch (c) {
    case '.': return '+';
    case '-': return '=';
    case '_': return '/';
  }
  return c;
}
