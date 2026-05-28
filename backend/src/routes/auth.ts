import { Router } from 'express';
import { z } from 'zod';
import { sanitizeUser } from '../middleware/auth.js';
import { store } from '../store/memory-store.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = store.portalUsers.findByEmail(parsed.data.email);
  if (!user || user.password !== parsed.data.password || user.role !== 'client') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = store.sessions.create(user.id, user.clientId);
  res.json({ token, user: sanitizeUser(user) });
});
