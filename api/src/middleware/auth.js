import { validateSession } from '../../../back_end/src/services/auth.service.js';

export async function buildContext({ req }) {
  const authHeader = req?.headers?.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return { user: null, token: null };

  const user = await validateSession(token);
  return { user, token };
}
