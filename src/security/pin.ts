const PIN_ITERATIONS = 120_000

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function derivePin(pin: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: PIN_ITERATIONS,
    },
    material,
    256,
  )
  return bytesToBase64(new Uint8Array(bits))
}

export function validPin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

export async function createPin(pin: string): Promise<{ hash: string; salt: string }> {
  if (!validPin(pin)) throw new Error('Die PIN muss aus vier Ziffern bestehen.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { hash: await derivePin(pin, salt), salt: bytesToBase64(salt) }
}

export async function verifyPin(pin: string, hash: string, salt: string): Promise<boolean> {
  if (!validPin(pin)) return false
  return (await derivePin(pin, base64ToBytes(salt))) === hash
}
