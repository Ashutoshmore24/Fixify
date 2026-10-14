import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { env } from '../src/common/config/env';
import { isTrustedGateway } from '../src/common/middleware/gateway.middleware';

describe('Cloudflare gateway protection', () => {
  const originalSecret = env.EDGE_PROXY_SECRET;
  afterEach(() => { env.EDGE_PROXY_SECRET = originalSecret; });
  it('blocks direct origin requests while keeping the health check public', async () => {
    env.EDGE_PROXY_SECRET = 'test-only-gateway-key';
    const app = createApp();
    expect((await request(app).get('/health')).status).toBe(200);
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(403);
    expect((await request(app).get('/api/v1/auth/me').set('x-fixify-gateway', env.EDGE_PROXY_SECRET)).status).toBe(401);
  });
  it('rejects wrong gateway secrets and preserves ordinary local development', () => {
    env.EDGE_PROXY_SECRET = 'test-only-gateway-key';
    expect(isTrustedGateway('wrong')).toBe(false);
    expect(isTrustedGateway(undefined)).toBe(false);
    expect(isTrustedGateway(env.EDGE_PROXY_SECRET)).toBe(true);
    env.EDGE_PROXY_SECRET = '';
    expect(isTrustedGateway(undefined)).toBe(true);
  });
});
