import { Router, Request, Response, NextFunction } from 'express';
import { CountryRepository, CityRepository } from '../repositories';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const countryRepo = new CountryRepository();
const cityRepo = new CityRepository();

// ====================== PAISES ======================

/**
 * @swagger
 * /countries:
 *   get:
 *     tags: [Paises]
 *     summary: Listar todos los paises
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre
 *     responses:
 *       200:
 *         description: Lista de paises
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 50;
    const search = req.query.search as string;

    const result = await countryRepo.findAll({
      page,
      pageSize,
      sortBy: 'name',
      ascending: true,
      searchTerm: search,
      searchColumn: 'name'
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /countries/{id}:
 *   get:
 *     tags: [Paises]
 *     summary: Obtener pais por ID
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle del pais
 *       404:
 *         description: Pais no encontrado
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = await countryRepo.findById(req.params.id);
    if (!country) {
      res.status(404).json({ success: false, message: 'Pais no encontrado' });
      return;
    }
    res.json({ success: true, data: country });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /countries:
 *   post:
 *     tags: [Paises]
 *     summary: Agregar nuevo pais
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, iso_code]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Chile
 *               iso_code:
 *                 type: string
 *                 example: CL
 *               iso_code_3:
 *                 type: string
 *                 example: CHL
 *               nationality:
 *                 type: string
 *                 example: Chileno/a
 *               currency_code:
 *                 type: string
 *                 example: CLP
 *               phone_prefix:
 *                 type: string
 *                 example: "+56"
 *     responses:
 *       201:
 *         description: Pais creado exitosamente
 */
router.post('/', authMiddleware, requireRole('Admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, iso_code, iso_code_3, nationality, currency_code, phone_prefix } = req.body;
    if (!name || !iso_code) {
      res.status(400).json({ success: false, message: 'Nombre y codigo ISO son requeridos' });
      return;
    }

    const country = await countryRepo.create({
      name, iso_code, iso_code_3, nationality, currency_code, phone_prefix,
      created_by: req.user?.userId
    });
    res.status(201).json({ success: true, data: country });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /countries/{id}:
 *   put:
 *     tags: [Paises]
 *     summary: Modificar pais existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               iso_code:
 *                 type: string
 *               nationality:
 *                 type: string
 *               currency_code:
 *                 type: string
 *               phone_prefix:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pais actualizado
 */
router.put('/:id', authMiddleware, requireRole('Admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await countryRepo.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Pais no encontrado' });
      return;
    }

    const country = await countryRepo.update(req.params.id, {
      ...req.body,
      updated_by: req.user?.userId
    });
    res.json({ success: true, data: country });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /countries/{id}:
 *   delete:
 *     tags: [Paises]
 *     summary: Eliminar pais (borrado logico)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pais eliminado
 */
router.delete('/:id', authMiddleware, requireRole('Admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await countryRepo.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Pais no encontrado' });
      return;
    }

    await countryRepo.softDelete(req.params.id);
    res.json({ success: true, message: 'Pais eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});

// ====================== CIUDADES ======================

/**
 * @swagger
 * /countries/{countryId}/cities:
 *   get:
 *     tags: [Ciudades]
 *     summary: Listar ciudades por pais
 *     security: []
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de ciudades del pais
 */
router.get('/:countryId/cities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await cityRepo.findByCountry(req.params.countryId);
    res.json({ success: true, data: cities });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /countries/{countryId}/cities:
 *   post:
 *     tags: [Ciudades]
 *     summary: Agregar ciudad a un pais
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 example: Quito
 *               timezone:
 *                 type: string
 *                 example: America/Guayaquil
 *     responses:
 *       201:
 *         description: Ciudad creada
 */
router.post('/:countryId/cities', authMiddleware, requireRole('Admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, timezone } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Nombre de la ciudad es requerido' });
      return;
    }

    const city = await cityRepo.create({
      country_id: req.params.countryId,
      name,
      timezone: timezone || 'UTC',
      created_by: req.user?.userId
    });
    res.status(201).json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
});

export default router;
