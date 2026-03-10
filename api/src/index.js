import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { buildContext } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const httpServer = createServer(app);

// ─── Upload de fichiers (remplace Firebase Storage) ──────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.folder || 'uploads';
    const dest = path.join(uploadsDir, folder);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const corsMiddleware = cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true });

// Servir les fichiers uploadés
app.use('/uploads', express.static(uploadsDir));

// POST /upload — upload d'une image
app.post('/upload', corsMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
  const folder = req.body.folder || 'uploads';
  const apiUrl = process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
  const url = `${apiUrl}/uploads/${folder}/${req.file.filename}`;
  res.json({ url });
});

// DELETE /upload — suppression d'un fichier uploadé
app.delete('/upload', corsMiddleware, express.json(), (req, res) => {
  try {
    const { url } = req.body ?? {};
    if (url) {
      const apiUrl = process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
      const relativePath = url.replace(`${apiUrl}/uploads/`, '');
      const filePath = path.join(uploadsDir, relativePath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  } catch {
    // Ignorer les erreurs de suppression
  }
  res.json({ success: true });
});

// ─── GraphQL + WebSockets ─────────────────────────────────────────────────────
const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
const serverCleanup = useServer(
  {
    schema,
    context: async (ctx) => {
      // Accepte la clé en minuscule ou majuscule (cross-platform)
      const raw =
        ctx.connectionParams?.authorization ??
        ctx.connectionParams?.Authorization ??
        null;
      const token = raw?.replace('Bearer ', '') ?? null;
      if (!token) return { user: null, token: null };
      try {
        const { validateSession } = await import('../../back_end/src/services/auth.service.js');
        const user = await validateSession(token);
        return { user, token };
      } catch {
        return { user: null, token: null };
      }
    },
  },
  wsServer
);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
  introspection: process.env.NODE_ENV !== 'production',
});

await server.start();

app.use(
  '/graphql',
  corsMiddleware,
  express.json(),
  expressMiddleware(server, { context: buildContext })
);

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT ?? 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 GraphQL API ready at http://localhost:${PORT}/graphql`);
  console.log(`📡 Subscriptions ready at ws://localhost:${PORT}/graphql`);
  console.log(`📁 Upload endpoint at http://localhost:${PORT}/upload`);
});
