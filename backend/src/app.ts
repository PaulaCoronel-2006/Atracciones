import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';

import authRoutes from './routes/auth.routes';
import countryRoutes from './routes/country.routes';
import attractionRoutes from './routes/attraction.routes';
import bookingRoutes from './routes/booking.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ====================== MIDDLEWARES GLOBALES ======================

// Seguridad HTTP headers
app.use(helmet());

// CORS configurado para el frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting para prevencion de ataques
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { success: false, message: 'Demasiadas solicitudes, intente mas tarde' }
});
app.use(limiter);

// Parseo de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ====================== SWAGGER DOCUMENTATION ======================

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Atracciones - Swagger',
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Endpoint para obtener el JSON de OpenAPI
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ====================== RUTAS API v1 ======================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/countries', countryRoutes);
app.use('/api/v1/attractions', attractionRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// ====================== HEALTH CHECK ======================

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Sistema]
 *     summary: Health check del servidor
 *     security: []
 *     responses:
 *       200:
 *         description: Servidor funcionando
 */
app.get('/api/v1', (_req, res) => {
  res.json({
    success: true,
    message: 'API Sistema de Atracciones v1.0',
    documentation: '/api/docs',
    timestamp: new Date().toISOString()
  });
});

// ====================== ERROR HANDLER GLOBAL ======================

app.use(errorHandler);

// ====================== INICIAR SERVIDOR ======================

app.listen(PORT, () => {
  console.log(`
  ========================================
    API Sistema de Atracciones
    Puerto: ${PORT}
    Swagger: http://localhost:${PORT}/api/docs
    API Base: http://localhost:${PORT}/api/v1
    Entorno: ${process.env.NODE_ENV || 'development'}
  ========================================
  `);
});

export default app;
