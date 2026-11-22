import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Webhooks need the RAW body for signature checks, so mount them BEFORE express.json():
// app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
