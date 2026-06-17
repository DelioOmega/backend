import { AppError } from '../utils/appError.js';
import {
  getAllMaterialesService,
  getMaterialByIdService,
  createMaterialService,
  updateMaterialService,
  changeMaterialEstadoService
} from '../services/materiales.service.js';

// Obtener todos los materiales con paginación y filtros
const ctlGetAllMateriales = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 15;
    const { nombre, estado, tipoMaterial } = req.query;

    const result = await getAllMaterialesService({ pagina, limite, nombre, estado, tipoMaterial });
    if (result.err) return next(new AppError(result.err, result.errorCode));
    res.status(200).json({ status: true, data: result.data, meta: result.meta, resumen: result.resumen });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

// Obtener un material por ID
const ctlGetMaterialById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getMaterialByIdService({ id });
    if (result.err) return next(new AppError(result.err, result.errorCode));
    res.status(200).json({ status: true, data: result.data });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

// Crear material
const ctlCreateMaterial = async (req, res, next) => {
  try {
    const { nombre, descripcion, umbralMinimo, unidadMedida, tipoMaterial } = req.body;

    const result = await createMaterialService({ nombre, descripcion, umbralMinimo, unidadMedida, tipoMaterial });
    if (result.err) return next(new AppError(result.err, result.errorCode));
    res.status(201).json({ status: true, msg: result.msg, id: result.id });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

// Actualizar material
const ctlUpdateMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, umbralMinimo, unidadMedida, tipoMaterial } = req.body;

    const result = await updateMaterialService({ id, nombre, descripcion, umbralMinimo, unidadMedida, tipoMaterial });
    if (result.err) return next(new AppError(result.err, result.errorCode));
    res.status(200).json({ status: true, msg: result.msg });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

// Cambiar estado del material
const ctlChangeMaterialEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const result = await changeMaterialEstadoService({ id, estado });
    if (result.err) return next(new AppError(result.err, result.errorCode));
    res.status(200).json({ status: true, msg: result.msg });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

export { ctlGetAllMateriales, ctlGetMaterialById, ctlCreateMaterial, ctlUpdateMaterial, ctlChangeMaterialEstado };