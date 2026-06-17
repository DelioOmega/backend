import { AppError } from '../utils/appError.js';
import {
  getAllProductosService,
  getProductoByIdService,
  createProductoService,
  updateProductoService,
  changeProductoEstadoService
} from '../services/productos.service.js';

// Obtener todos los productos con paginación y filtros
const ctlGetAllProductos = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 15;
    const { nombre, estado, categoria, tipoProducto } = req.query;

    const result = await getAllProductosService({ pagina, limite, nombre, estado, categoria, tipoProducto });
    if (result.err) return next(new AppError(result.err, result.errorCode));
    res.status(200).json({ status: true, data: result.data, meta: result.meta, resumen: result.resumen });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

// Obtener un producto por ID
const ctlGetProductoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getProductoByIdService({ id });
    if (result.err) return next(new AppError(result.err, result.errorCode));
    res.status(200).json({ status: true, data: result.data });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

// Crear producto
const ctlCreateProducto = async (req, res, next) => {
  try {
    const { nombre, precioUnitario, descripcion, genero, categoriaId, tipoPrenda, tipoProducto, umbralMinimo, talla } = req.body;

    const result = await createProductoService({ nombre, precioUnitario, descripcion, genero, categoriaId, tipoPrenda, tipoProducto, umbralMinimo, talla });
    if (result.err) return next(new AppError(result.err, result.errorCode));
    res.status(201).json({ status: true, msg: result.msg, id: result.id });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

// Actualizar producto
const ctlUpdateProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, precioUnitario, descripcion, genero, categoriaId, tipoPrenda, umbralMinimo, talla } = req.body;

    const result = await updateProductoService({ id, nombre, precioUnitario, descripcion, genero, categoriaId, tipoPrenda, umbralMinimo, talla });
    if (result.err) return next(new AppError(result.err, result.errorCode));
    res.status(200).json({ status: true, msg: result.msg });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

// Cambiar estado del producto
const ctlChangeProductoEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const result = await changeProductoEstadoService({ id, estado });
    if (result.err) return next(new AppError(result.err, result.errorCode));
    res.status(200).json({ status: true, msg: result.msg });
  } catch (error) {
    next(new AppError('Error interno del servidor', 500));
  }
};

export { ctlGetAllProductos, ctlGetProductoById, ctlCreateProducto, ctlUpdateProducto, ctlChangeProductoEstado };