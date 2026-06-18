import { body } from 'express-validator';

// ============================================================
// Campos reutilizables
// ============================================================

const provIdFk = body('provIdFk')
  .notEmpty()
  .withMessage('El ID del proveedor es requerido')
  .isString()
  .withMessage('El ID del proveedor debe ser texto')
  .trim()
  .isLength({ min: 1, max: 50 })
  .withMessage('El ID del proveedor debe tener entre 1 y 50 caracteres');

const detalles = body('detalles')
  .notEmpty()
  .withMessage('Los detalles del abastecimiento son requeridos')
  .isArray({ min: 1 })
  .withMessage('Debe incluir al menos un detalle');

const detAbsTip = body('detalles.*.detAbsTip')
  .notEmpty()
  .withMessage('El tipo de suministro es requerido en cada detalle')
  .isString()
  .withMessage('El tipo de suministro debe ser texto')
  .trim()
  .toUpperCase()
  .isIn(['PRODUCTO', 'MATERIAL'])
  .withMessage('El tipo de suministro debe ser PRODUCTO o MATERIAL');

const detAbsCant = body('detalles.*.detAbsCant')
  .notEmpty()
  .withMessage('La cantidad es requerida en cada detalle')
  .isInt({ min: 1 })
  .withMessage('La cantidad debe ser un número entero mayor a 0');

const detAbsCos = body('detalles.*.detAbsCos')
  .optional({ values: 'falsy' })
  .isFloat({ min: 0 })
  .withMessage('El costo unitario debe ser un número positivo o 0');

const detAbsRefId = body('detalles.*.detAbsRefId')
  .notEmpty()
  .withMessage('El ID de referencia es requerido en cada detalle')
  .isString()
  .withMessage('El ID de referencia debe ser texto')
  .trim()
  .isLength({ min: 1, max: 50 })
  .withMessage('El ID de referencia debe tener entre 1 y 50 caracteres');

// ============================================================
// Conjuntos de reglas
// ============================================================

export const createAbastecimientoRules = [
  provIdFk,
  detalles,
  detAbsTip,
  detAbsCant,
  detAbsCos,
  detAbsRefId,
];
