import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload } from '../types/index.js';

const COOKIE_NAME = 'receipt_session';

let io: SocketIOServer | undefined;

function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (decodeURIComponent(part.slice(0, eq).trim()) === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  io.on('connection', (socket) => {
    // The socket's admin status is resolved once at connect time from the same
    // httpOnly session cookie the REST API uses — sockets never accept a token in payloads.
    let isAdmin = false;
    const token = parseCookie(socket.handshake.headers.cookie, COOKIE_NAME);
    if (token) {
      try {
        const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
        isAdmin = payload.role === 'super_admin';
      } catch {
        isAdmin = false;
      }
    }

    socket.on('join-receipt-room', (payload: { receiptId?: string }) => {
      if (payload?.receiptId) socket.join(`support:${payload.receiptId}`);
    });

    socket.on('leave-receipt-room', (payload: { receiptId?: string }) => {
      if (payload?.receiptId) socket.leave(`support:${payload.receiptId}`);
    });

    socket.on('join-admin-room', () => {
      if (isAdmin) socket.join('support:admin');
    });
  });

  return io;
}

export function getIO(): SocketIOServer | undefined {
  return io;
}
