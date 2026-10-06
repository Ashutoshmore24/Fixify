import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthService, JwtTokenPayload } from '../../modules/auth/auth.service';
import { AUTH_COOKIE_NAME } from '../../modules/auth/auth.middleware';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

const parseCookieString = (cookieString?: string): Record<string, string> => {
  if (!cookieString) return {};
  return cookieString.split(';').reduce<Record<string, string>>((acc, pair) => {
    const [key, value] = pair.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
};

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket.IO Handshake Authentication Middleware
  io.use((socket: Socket, next: (err?: Error) => void) => {
    // 1. Validate Origin against CLIENT_URL
    const origin = socket.handshake.headers.origin || socket.handshake.headers.referer;
    if (origin) {
      try {
        const originUrl = new URL(origin).origin;
        const clientOrigin = new URL(env.CLIENT_URL).origin;
        if (originUrl !== clientOrigin) {
          return next(new Error('Authentication error: Origin not allowed'));
        }
      } catch {
        return next(new Error('Authentication error: Invalid Origin header'));
      }
    } else if (env.NODE_ENV === 'production') {
      return next(new Error('Authentication error: Origin header is required'));
    }

    try {
      const cookies = parseCookieString(socket.handshake.headers.cookie);
      let token = cookies[AUTH_COOKIE_NAME];

      // Fallback to auth header or query token for test fixtures
      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        return next(new Error('Authentication error: Missing session token'));
      }

      const payload = AuthService.verifyToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as JwtTokenPayload | undefined;
    if (user) {
      // Join personal room and role room
      socket.join(`user:${user.id}`);
      socket.join(`role:${user.role}`);
      logger.debug(`Socket connected for user ${user.email} (${user.role}) [ID: ${socket.id}]`);
    }

    socket.on('join:lab', (labId: string) => {
      socket.join(`lab:${labId}`);
    });

    socket.on('leave:lab', (labId: string) => {
      socket.leave(`lab:${labId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected [ID: ${socket.id}]`);
    });
  });

  return io;
};

export const getSocketServer = (): SocketIOServer | null => io;

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToRole = (role: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

export const emitToLab = (labId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`lab:${labId}`).emit(event, data);
  }
};

export const emitToAll = (event: string, data: unknown): void => {
  if (io) {
    io.emit(event, data);
  }
};
