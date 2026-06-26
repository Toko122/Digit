const JWT_SECRET = process.env.JWT || 'digit-secret-fallback-key-12345';

export interface AuthPayload {
  id: string;
  role: 'admin' | 'business' | 'manager' | 'worker';
  is_active: boolean;
  fullname: string;
  email: string;
  exp?: number;
}


function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binString = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function signJWT(payload: Record<string, unknown>, expiresInSeconds: number = 86400): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(JWT_SECRET);
  
  const key = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const dataToSign = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const signature = await crypto.subtle.sign('HMAC', key, dataToSign);

  const signatureBytes = new Uint8Array(signature);
  let signatureBinString = "";
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    signatureBinString += String.fromCharCode(signatureBytes[i]);
  }
  const encodedSignature = btoa(signatureBinString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verifyJWT(token: string): Promise<AuthPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);

    const key = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const dataToVerify = encoder.encode(`${headerPart}.${payloadPart}`);

    let signatureBase64 = signaturePart.replace(/-/g, '+').replace(/_/g, '/');
    while (signatureBase64.length % 4) {
      signatureBase64 += '=';
    }
    const signatureBinString = atob(signatureBase64);
    const signatureBytes = new Uint8Array(signatureBinString.length);
    for (let i = 0; i < signatureBinString.length; i++) {
      signatureBytes[i] = signatureBinString.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, dataToVerify);
    if (!isValid) return null;

    const payloadStr = base64UrlDecode(payloadPart);
    const payload = JSON.parse(payloadStr) as AuthPayload;

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Token expired
    }

    return payload;
  } catch (err) {
    console.error('JWT Verification Error:', err);
    return null;
  }
}
