import { AppError } from '../utils/appError.js';
import {
  getAllAbastecimientosService,
  getAbastecimientoByIdService,
  createAbastecimientoService,
  completarAbastecimientoService,
  cancelarAbastecimientoService,
} from '../services/abastecimiento.service.js';

// ── GET /api/abastecimientos — Listar paginado con filtros + resumen ──
const ctlGetAll = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 15;
    const { busqueda, fecha_desde, fecha_hasta, estado } = req.query;

    const result = await getAllAbastecimientosService({
      pagina,
      limite,
      busqueda,
      fecha_desde,
      fecha_hasta,
      estado,
    });
    if (result.err) return next(new AppError(result.err, result.errorCode));

    res.status(200).json({
      status: true,
      data: result.data,
      meta: result.meta,
      resumen: result.resumen,
    });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

// ── GET /api/abastecimientos/:id — Obtener con detalles ──
const ctlGetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getAbastecimientoByIdService({ id });
    if (result.err) return next(new AppError(result.err, result.errorCode));

    res.status(200).json({ status: true, data: result.data });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

// ── POST /api/abastecimientos — Crear (dispara trigger) ──
const ctlCreate = async (req, res, next) => {
  try {
    const { provIdFk, detalles } = req.body;
    const usuIdFk = req.user?.user_id || null;

    const result = await createAbastecimientoService({ provIdFk, detalles, usuIdFk });
    if (result.err) {
      console.error('[ctlCreate] Error del servicio:', result.err);
      return next(new AppError(result.err, result.errorCode));
    }

    res.status(201).json({
      status: true,
      msg: result.msg,
      id: result.id,
    });
  } catch (error) {
    console.error('[ctlCreate] Error inesperado:', error.sqlMessage || error.message);
    console.error('[ctlCreate] Stack:', error.stack);
    next(new AppError('Error interno del servidor', 500));
  }
};

// ── PATCH /api/abastecimientos/:id/completar — Completar (dispara trigger) ──
const ctlCompletar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await completarAbastecimientoService({ id });
    if (result.err) return next(new AppError(result.err, result.errorCode));

    res.status(200).json({ status: true, msg: result.msg });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

// ── PATCH /api/abastecimientos/:id/cancelar — Cancelar ──
const ctlCancelar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuIdFk = req.user?.user_id || null;
    const result = await cancelarAbastecimientoService({ id, usuIdFk });
    if (result.err) return next(new AppError(result.err, result.errorCode));

    res.status(200).json({ status: true, msg: result.msg });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

export { ctlGetAll, ctlGetById, ctlCreate, ctlCompletar, ctlCancelar };
