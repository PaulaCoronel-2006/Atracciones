import { Router, Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';
import { ReviewRepository, ReviewRatingRepository, AttractionRepository, ClientRepository } from '../repositories';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const bookingService = new BookingService();
const reviewRepo = new ReviewRepository();
const reviewRatingRepo = new ReviewRatingRepository();
const attractionRepo = new AttractionRepository();
const clientRepo = new ClientRepository();

// ====================== RESERVAS ======================

/**
 * @swagger
 * /bookings:
 *   post:
 *     tags: [Reservas]
 *     summary: Crear nueva reserva
 *     description: Registra una reserva con pasajeros, calcula el total y descuenta cupos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slotId, travelers]
 *             properties:
 *               slotId:
 *                 type: string
 *                 format: uuid
 *               specialRequirements:
 *                 type: string
 *                 example: Silla de ruedas para un pasajero
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, transfer, cash]
 *               travelers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, priceTierId]
 *                   properties:
 *                     name: { type: string, example: Juan Perez }
 *                     document: { type: string, example: "1712345678" }
 *                     age: { type: integer, example: 30 }
 *                     priceTierId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *       400:
 *         description: Error de validacion o cupo insuficiente
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { slotId, specialRequirements, travelers, paymentMethod } = req.body;

    if (!slotId || !travelers || !Array.isArray(travelers) || travelers.length === 0) {
      res.status(400).json({ success: false, message: 'slotId y travelers son requeridos' });
      return;
    }

    // Obtener clientId del usuario autenticado
    const client = await clientRepo.findByUserId(req.user!.userId);
    if (!client) {
      res.status(400).json({ success: false, message: 'No se encontro perfil de cliente para este usuario' });
      return;
    }

    const booking = await bookingService.createBooking({
      clientId: client.id,
      slotId,
      specialRequirements,
      travelers,
      paymentMethod
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    if (error.message.includes('cupos') || error.message.includes('no encontrad')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
});

/**
 * @swagger
 * /bookings:
 *   get:
 *     tags: [Reservas]
 *     summary: Consulta general de reservas (Admin) o mis reservas (Cliente)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Lista de reservas
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const isAdmin = req.user!.roles.some(r => r.toLowerCase() === 'admin');

    if (isAdmin) {
      const { BookingRepository } = await import('../repositories');
      const bookingRepo = new BookingRepository();
      const result = await bookingRepo.findAll({ page, pageSize, sortBy: 'created_at', ascending: false });
      res.json({ success: true, data: result });
    } else {
      const client = await clientRepo.findByUserId(req.user!.userId);
      if (!client) { res.status(400).json({ success: false, message: 'Perfil de cliente no encontrado' }); return; }
      const result = await bookingService.getBookingsByClient(client.id, page, pageSize);
      res.json({ success: true, data: result });
    }
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     tags: [Reservas]
 *     summary: Obtener detalle completo de una reserva
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detalle de reserva
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.getBooking(req.params.id);
    if (!booking) { res.status(404).json({ success: false, message: 'Reserva no encontrada' }); return; }
    res.json({ success: true, data: booking });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /bookings/search/{pnr}:
 *   get:
 *     tags: [Reservas]
 *     summary: Buscar reserva por codigo PNR
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pnr
 *         required: true
 *         schema: { type: string }
 *         description: Codigo alfanumerico de 8 caracteres
 *     responses:
 *       200:
 *         description: Detalle de reserva
 */
router.get('/search/:pnr', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.findByPnr(req.params.pnr);
    if (!booking) { res.status(404).json({ success: false, message: 'No se encontro reserva con ese codigo PNR' }); return; }
    res.json({ success: true, data: booking });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   patch:
 *     tags: [Reservas]
 *     summary: Cancelar reserva
 *     description: Cambia el estado a cancelled y reintegra los cupos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: Cambio de planes del cliente }
 *     responses:
 *       200:
 *         description: Reserva cancelada
 */
router.patch('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await bookingService.cancelBooking(req.params.id, req.body.reason);
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message.includes('cancelar') || error.message.includes('cancelada') || error.message.includes('completada')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
});

/**
 * @swagger
 * /bookings/{id}/payment:
 *   post:
 *     tags: [Pagos]
 *     summary: Registrar pago para una reserva
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentMethod, amount]
 *             properties:
 *               paymentMethod: { type: string, enum: [card, transfer, cash] }
 *               amount: { type: number, example: 75.00 }
 *               transactionExternalId: { type: string, example: stripe_pi_123456 }
 *     responses:
 *       201:
 *         description: Pago registrado
 */
router.post('/:id/payment', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payment = await bookingService.registerPayment(req.params.id, req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) { next(error); }
});

// ====================== RESENAS ======================

/**
 * @swagger
 * /bookings/{bookingId}/review:
 *   post:
 *     tags: [Resenas]
 *     summary: Crear resena para una reserva completada
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 4 }
 *               comment: { type: string, example: Excelente experiencia }
 *               criteria:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string, example: Limpieza }
 *                     score: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *     responses:
 *       201:
 *         description: Resena creada
 */
router.post('/:bookingId/review', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rating, comment, criteria } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Calificacion requerida (1-5)' });
      return;
    }

    const client = await clientRepo.findByUserId(req.user!.userId);
    if (!client) { res.status(400).json({ success: false, message: 'Perfil de cliente no encontrado' }); return; }

    const review = await reviewRepo.create({
      booking_id: req.params.bookingId,
      client_id: client.id,
      rating,
      comment,
      is_verified: true
    });

    // Guardar criterios individuales
    if (criteria && Array.isArray(criteria)) {
      for (const c of criteria) {
        await reviewRatingRepo.create({
          review_id: review.id,
          criteria_name: c.name,
          score: c.score
        });
      }
    }

    res.status(201).json({ success: true, data: review });
  } catch (error) { next(error); }
});

export default router;
