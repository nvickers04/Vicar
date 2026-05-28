import type { Request, Response, NextFunction } from 'express';
import { store } from '../store/memory-store.js';

export interface AuthedRequest extends Request {
  clientId?: string;
  userId?: string;
}

export function requireClientAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = header.slice(7);
  const session = store.sessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  req.clientId = session.clientId;
  req.userId = session.userId;
  next();
}

export function sanitizeUser(user: { id: string; clientId: string; email: string; role: 'client'; name: string }) {
  return { id: user.id, clientId: user.clientId, email: user.email, role: user.role, name: user.name };
}
