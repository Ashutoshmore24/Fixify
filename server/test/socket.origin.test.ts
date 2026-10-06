import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { initSocketServer } from '../src/common/socket/socket.server';
import { AuthService } from '../src/modules/auth/auth.service';
import { User } from '../src/modules/auth/auth.model';
import { env } from '../src/common/config/env';

describe('Socket.IO Handshake Security & Origin Validation', () => {
  let httpServer: http.Server;
  let port: number;
  let validToken: string;

  beforeAll(async () => {
    httpServer = http.createServer();
    initSocketServer(httpServer);
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        if (typeof addr === 'object' && addr) {
          port = addr.port;
        }
        resolve();
      });
    });

    const user = new User({
      name: 'Socket Test User',
      email: 'socket.user@pccoe.org',
      role: 'STUDENT',
      isActive: true,
    });
    await user.save();
    validToken = AuthService.generateToken(user);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it('permits socket connection when Origin matches CLIENT_URL', async () => {
    const client: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      extraHeaders: {
        Origin: env.CLIENT_URL,
        Cookie: `fixify_token=${validToken}`,
      },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      client.on('connect', () => {
        client.disconnect();
        resolve();
      });
      client.on('connect_error', (err) => {
        client.disconnect();
        reject(err);
      });
    });
  });

  it('rejects socket connection when Origin does not match CLIENT_URL', async () => {
    const client: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      extraHeaders: {
        Origin: 'http://malicious-site.com',
        Cookie: `fixify_token=${validToken}`,
      },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      client.on('connect_error', (err) => {
        expect(err.message).toMatch(/Origin not allowed/);
        client.disconnect();
        resolve();
      });
      client.on('connect', () => {
        client.disconnect();
        throw new Error('Should not have connected from unauthorized origin');
      });
    });
  });
});
