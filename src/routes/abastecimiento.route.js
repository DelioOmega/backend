import express from 'express';
import {
  ctlGetAll,
  ctlGetById,
  ctlCreate,
  ctlCompletar,
  ctlCancelar,
} from '../controllers/abastecimiento.controller.js';
import { authValidator } from '../middleware/auth.middleware.js';
import validateFields from '../middleware/validator.middleware.js';
import { createAbastecimientoRules } from '../validators/abastecimiento.validator.js';

const router = express.Router();

// GET  /api/abastecimientos         — Listar paginado
router.get('/', authValidator, ctlGetAll);

// GET  /api/abastecimientos/:id     — Detalle con items
router.get('/:id', authValidator, ctlGetById);

// POST /api/abastecimientos         — Crear (el trigger actualiza stock al completar)
router.post('/', authValidator, createAbastecimientoRules, validateFields, ctlCreate);

// PATCH /api/abastecimientos/:id/completar — Completar (el trigger actualiza stock, movimientos y actividad)
router.patch('/:id/completar', authValidator, ctlCompletar);

// PATCH /api/abastecimientos/:id/cancelar — Cancelar
router.patch('/:id/cancelar', authValidator, ctlCancelar);

export { router };
