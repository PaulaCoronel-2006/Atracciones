import { Router, Request, Response, NextFunction } from 'express';
import { AttractionRepository, CategoryRepository, SubcategoryRepository, MediaRepository, ProductOptionRepository, AvailabilitySlotRepository, PriceTierRepository } from '../repositories';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const attractionRepo = new AttractionRepository();
const categoryRepo = new CategoryRepository();
const subcategoryRepo = new SubcategoryRepository();
const mediaRepo = new MediaRepository();
const productRepo = new ProductOptionRepository();
const slotRepo = new AvailabilitySlotRepository();
const priceTierRepo = new PriceTierRepository();

// ====================== CATEGORIAS ======================

/**
 * @swagger
 * /attractions/categories:
 *   get:
 *     tags: [Categorias]
 *     summary: Listar categorias con subcategorias
 *     security: []
 *     responses:
 *       200:
 *         description: Lista de categorias
 */
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryRepo.findAllWithSubcategories();
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /attractions/categories:
 *   post:
 *     tags: [Categorias]
 *     summary: Crear nueva categoria
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Turismo Ecologico
 *               description:
 *                 type: string
 *               icon_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoria creada
 */
router.post('/categories', authMiddleware, requireRole('Admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, icon_url } = req.body;
    if (!name) { res.status(400).json({ success: false, message: 'Nombre requerido' }); return; }
    const cat = await categoryRepo.create({ name, description, icon_url, created_by: req.user?.userId });
    res.status(201).json({ success: true, data: cat });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /attractions/categories/{id}:
 *   put:
 *     tags: [Categorias]
 *     summary: Modificar categoria
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoria actualizada
 */
router.put('/categories/:id', authMiddleware, requireRole('Admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cat = await categoryRepo.update(req.params.id, { ...req.body, updated_by: req.user?.userId });
    res.json({ success: true, data: cat });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /attractions/categories/{categoryId}/subcategories:
 *   post:
 *     tags: [Categorias]
 *     summary: Crear subcategoria
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Senderismo
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subcategoria creada
 */
router.post('/categories/:categoryId/subcategories', authMiddleware, requireRole('Admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    if (!name) { res.status(400).json({ success: false, message: 'Nombre requerido' }); return; }
    const sub = await subcategoryRepo.create({ name, description, category_id: req.params.categoryId, created_by: req.user?.userId });
    res.status(201).json({ success: true, data: sub });
  } catch (error) { next(error); }
});

// ====================== ATRACCIONES ======================

/**
 * @swagger
 * /attractions:
 *   get:
 *     tags: [Atracciones]
 *     summary: Consulta general de atracciones
 *     description: Lista paginada de atracciones con filtros por ciudad, categoria y busqueda por nombre
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: cityId
 *         schema: { type: string }
 *       - in: query
 *         name: subcategoryId
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Buscar por nombre de atraccion
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: created_at }
 *     responses:
 *       200:
 *         description: Lista paginada de atracciones
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await attractionRepo.findAllWithRelations({
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 10,
      cityId: req.query.cityId as string,
      subcategoryId: req.query.subcategoryId as string,
      searchTerm: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'created_at',
      ascending: req.query.ascending === 'true'
    });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /attractions/{id}:
 *   get:
 *     tags: [Atracciones]
 *     summary: Obtener detalle completo de una atraccion
 *     description: Incluye multimedia, modalidades, tarifas y horarios
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detalle completo
 *       404:
 *         description: Atraccion no encontrada
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attraction = await attractionRepo.findWithDetails(req.params.id);
    if (!attraction) {
      res.status(404).json({ success: false, message: 'Atraccion no encontrada' });
      return;
    }
    res.json({ success: true, data: attraction });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /attractions:
 *   post:
 *     tags: [Atracciones]
 *     summary: Agregar nueva atraccion
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, city_id, subcategory_id, address]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Volcan Cotopaxi
 *               city_id:
 *                 type: string
 *               subcategory_id:
 *                 type: string
 *               description_short:
 *                 type: string
 *               description_full:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               capacity_max:
 *                 type: integer
 *               opening_time:
 *                 type: string
 *                 example: "08:00"
 *               closing_time:
 *                 type: string
 *                 example: "17:00"
 *               languages_available:
 *                 type: array
 *                 items: { type: string }
 *               audioguide_languages:
 *                 type: array
 *                 items: { type: string }
 *               route_info:
 *                 type: string
 *     responses:
 *       201:
 *         description: Atraccion creada
 */
router.post('/', authMiddleware, requireRole('Admin', 'Partner'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, city_id, subcategory_id, address } = req.body;
    if (!name || !city_id || !subcategory_id || !address) {
      res.status(400).json({ success: false, message: 'Campos obligatorios: name, city_id, subcategory_id, address' });
      return;
    }

    const attraction = await attractionRepo.create({ ...req.body, created_by: req.user?.userId });
    res.status(201).json({ success: true, data: attraction });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /attractions/{id}:
 *   put:
 *     tags: [Atracciones]
 *     summary: Modificar atraccion existente
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
 *             properties:
 *               name: { type: string }
 *               description_short: { type: string }
 *               description_full: { type: string }
 *               address: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       200:
 *         description: Atraccion actualizada
 */
router.put('/:id', authMiddleware, requireRole('Admin', 'Partner'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await attractionRepo.findById(req.params.id);
    if (!existing) { res.status(404).json({ success: false, message: 'Atraccion no encontrada' }); return; }

    const updated = await attractionRepo.update(req.params.id, { ...req.body, updated_by: req.user?.userId });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /attractions/{id}:
 *   delete:
 *     tags: [Atracciones]
 *     summary: Eliminar atraccion (borrado logico)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Atraccion desactivada
 */
router.delete('/:id', authMiddleware, requireRole('Admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await attractionRepo.findById(req.params.id);
    if (!existing) { res.status(404).json({ success: false, message: 'Atraccion no encontrada' }); return; }

    await attractionRepo.softDelete(req.params.id);
    res.json({ success: true, message: 'Atraccion desactivada exitosamente' });
  } catch (error) { next(error); }
});

// ====================== MULTIMEDIA ======================

/**
 * @swagger
 * /attractions/{attractionId}/media:
 *   post:
 *     tags: [Multimedia]
 *     summary: Agregar foto/video a una atraccion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attractionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url, media_type]
 *             properties:
 *               url: { type: string }
 *               media_type: { type: string, enum: [image, video] }
 *               description: { type: string }
 *               is_main: { type: boolean }
 *               display_order: { type: integer }
 *     responses:
 *       201:
 *         description: Medio creado
 */
router.post('/:attractionId/media', authMiddleware, requireRole('Admin', 'Partner'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const media = await mediaRepo.create({
      ...req.body,
      attraction_id: req.params.attractionId,
      created_by: req.user?.userId
    });
    res.status(201).json({ success: true, data: media });
  } catch (error) { next(error); }
});

// ====================== MODALIDADES (PRODUCT OPTIONS) ======================

/**
 * @swagger
 * /attractions/{attractionId}/products:
 *   get:
 *     tags: [Modalidades]
 *     summary: Listar modalidades de una atraccion con tarifas y disponibilidad
 *     security: []
 *     parameters:
 *       - in: path
 *         name: attractionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de modalidades
 */
router.get('/:attractionId/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productRepo.findByAttraction(req.params.attractionId);
    res.json({ success: true, data: products });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /attractions/{attractionId}/products:
 *   post:
 *     tags: [Modalidades]
 *     summary: Crear modalidad para una atraccion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attractionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: Tour VIP Privado }
 *               description: { type: string }
 *               duration_minutes: { type: integer, example: 120 }
 *               includes: { type: string, example: Guia bilingue, almuerzo }
 *               not_includes: { type: string, example: Transporte al punto de partida }
 *               cancel_policy_hours: { type: integer, example: 24 }
 *     responses:
 *       201:
 *         description: Modalidad creada
 */
router.post('/:attractionId/products', authMiddleware, requireRole('Admin', 'Partner'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title } = req.body;
    if (!title) { res.status(400).json({ success: false, message: 'Titulo requerido' }); return; }

    const product = await productRepo.create({
      ...req.body,
      attraction_id: req.params.attractionId,
      created_by: req.user?.userId
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
});

// ====================== TARIFAS ======================

/**
 * @swagger
 * /attractions/products/{productId}/prices:
 *   post:
 *     tags: [Tarifas]
 *     summary: Agregar tarifa a una modalidad
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label, price]
 *             properties:
 *               label: { type: string, example: Adulto }
 *               age_range_min: { type: integer, example: 18 }
 *               age_range_max: { type: integer, example: 65 }
 *               price: { type: number, example: 25.00 }
 *               currency: { type: string, example: USD }
 *     responses:
 *       201:
 *         description: Tarifa creada
 */
router.post('/products/:productId/prices', authMiddleware, requireRole('Admin', 'Partner'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tier = await priceTierRepo.create({
      ...req.body,
      product_id: req.params.productId,
      created_by: req.user?.userId
    });
    res.status(201).json({ success: true, data: tier });
  } catch (error) { next(error); }
});

// ====================== DISPONIBILIDAD ======================

/**
 * @swagger
 * /attractions/products/{productId}/availability:
 *   get:
 *     tags: [Disponibilidad]
 *     summary: Consultar disponibilidad de una modalidad por fecha
 *     security: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *         description: Fecha en formato YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Slots disponibles
 */
router.get('/products/:productId/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date as string;
    if (!date) { res.status(400).json({ success: false, message: 'Fecha requerida (date=YYYY-MM-DD)' }); return; }

    const slots = await slotRepo.findAvailable(req.params.productId, date);
    res.json({ success: true, data: slots });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /attractions/products/{productId}/availability:
 *   post:
 *     tags: [Disponibilidad]
 *     summary: Crear slot de disponibilidad
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slot_date, start_time, capacity_total]
 *             properties:
 *               slot_date: { type: string, format: date, example: "2026-05-15" }
 *               start_time: { type: string, example: "09:00" }
 *               end_time: { type: string, example: "11:00" }
 *               capacity_total: { type: integer, example: 30 }
 *     responses:
 *       201:
 *         description: Slot creado
 */
router.post('/products/:productId/availability', authMiddleware, requireRole('Admin', 'Partner'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { slot_date, start_time, capacity_total } = req.body;
    if (!slot_date || !start_time || !capacity_total) {
      res.status(400).json({ success: false, message: 'Campos requeridos: slot_date, start_time, capacity_total' });
      return;
    }

    const slot = await slotRepo.create({
      product_id: req.params.productId,
      slot_date,
      start_time,
      end_time: req.body.end_time,
      capacity_total,
      capacity_available: capacity_total,
      is_active: true,
      is_deleted: false
    });
    res.status(201).json({ success: true, data: slot });
  } catch (error) { next(error); }
});

export default router;
