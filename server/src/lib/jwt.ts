import { SignJWT, jwtVerify } from 'jose'

export interface AccessTokenPayload {
  sub: string  // user id
  email: string
  type: 'access'
}

export interface RefreshTokenPayload {
  sub: string  // user id
  jti: string  // stored in DB for revocation
  type: 'refresh'
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const accessSecret = new TextEncoder().encode(requireEnv('JWT_SECRET'))
const refreshSecret = new TextEncoder().encode(requireEnv('JWT_REFRESH_SECRET'))

export async function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(accessSecret)
}

export async function signRefreshToken(
  payload: Omit<RefreshTokenPayload, 'type'>,
): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshSecret)
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret)
  if (payload['type'] !== 'access') throw new Error('Not an access token')
  return payload as unknown as AccessTokenPayload
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret)
  if (payload['type'] !== 'refresh') throw new Error('Not a refresh token')
  return payload as unknown as RefreshTokenPayload
}
