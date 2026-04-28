import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Sistema de Atracciones',
      version: '1.0.0',
      description: `API RESTful para el Sistema de Gestion de Atracciones Turisticas.
      
Desarrollado como proyecto de Integracion de Sistemas - PUCE.

## Modulos:
- **Seguridad**: Autenticacion JWT, gestion de usuarios y roles RBAC.
- **Geografico**: Paises y ciudades.
- **Catalogo**: Categorias, subcategorias y atracciones con multimedia.
- **Inventario**: Modalidades, disponibilidad y tarifas.
- **Transacciones**: Reservas, detalle de pasajeros y pagos.
- **Feedback**: Resenas y calificaciones por criterio.
- **Auditoria**: Registro centralizado de cambios.`,
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'admin@atracciones.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000/api/v1',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrese el token JWT obtenido del endpoint /auth/login'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.ts', './src/dto/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
