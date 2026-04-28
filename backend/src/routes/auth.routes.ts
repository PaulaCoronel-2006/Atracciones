import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const authService = new AuthService();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Registrar nuevo usuario
 *     description: Crea un nuevo usuario con rol Client y su perfil asociado
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName, firstName, lastName]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@ejemplo.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: MiPassword123
 *               fullName:
 *                 type: string
 *                 example: Juan Perez
 *               firstName:
 *                 type: string
 *                 example: Juan
 *               lastName:
 *                 type: string
 *                 example: Perez
 *               phone:
 *                 type: string
 *                 example: "+593991234567"
 *               documentId:
 *                 type: string
 *                 example: "1712345678"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error de validacion
 *       409:
 *         description: El email ya esta registrado
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, firstName, lastName, phone, documentId } = req.body;

    if (!email || !password || !fullName || !firstName || !lastName) {
      res.status(400).json({ success: false, message: 'Campos obligatorios: email, password, fullName, firstName, lastName' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'La contrasena debe tener al menos 6 caracteres' });
      return;
    }

    const result = await authService.register({ email, password, fullName, firstName, lastName, phone, documentId });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error.message.includes('ya esta registrado')) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Iniciar sesion
 *     description: Autentica un usuario y retorna un token JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@atracciones.com
 *               password:
 *                 type: string
 *                 example: Admin123!
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales invalidas
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email y password son requeridos' });
      return;
    }

    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message.includes('invalidas') || error.message.includes('bloqueada')) {
      res.status(401).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags: [Autenticacion]
 *     summary: Obtener perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autenticado
 */
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }

    const profile = await authService.getProfile(req.user.userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

export default router;
