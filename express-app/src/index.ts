import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { appLogger } from './config/logger';
import { loggingMiddleware } from './middleware/logging.middleware';
import authRoutes from './Auth/auth.routes';
import userRoutes from './user/user.routes';
import rentRoutes from './rent/rent.routes';

connectDB();

const app = express();
const env = process.env.NODE_ENV || 'development';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(loggingMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', rentRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  appLogger.error({
    msg: 'Unhandled exception',
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  appLogger.info({
    msg: 'Application startup',
    event: 'startup',
    port: Number(PORT),
    env,
  });
});
