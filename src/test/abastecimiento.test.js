import { jest } from '@jest/globals';
import request from 'supertest';

// =====================================================
// Silenciar console en tests
// =====================================================
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});

// =====================================================
// 1. MOCKS (antes de los imports reales)
// =====================================================

jest.unstable_mockModule('../middleware/auth.middleware.js', () => ({
  authValidator: (req, _res, next) => {
    req.user = {
      user_id: 'US001',
      nombres: 'Admin',
      apellidos: 'Test',
      rol: 'ADMINISTRADOR'
    };
    next();
  },
  isAdmin: (req, _res, next) => next(),
  isAdminOrSelf: (req, _res, next) => next()
}));

jest.unstable_mockModule('../services/abastecimiento.service.js', () => ({
  getAllAbastecimientosService: jest.fn(),
  getAbastecimientoByIdService: jest.fn(),
  createAbastecimientoService: jest.fn(),
  completarAbastecimientoService: jest.fn(),
  cancelarAbastecimientoService: jest.fn()
}));

// =====================================================
// 2. IMPORTS
// =====================================================

const { default: app } = await import('../app.js');

const abastecimientoService = await import('../services/abastecimiento.service.js');

// =====================================================
// 3. DATOS DE PRUEBA
// =====================================================

const ABASTECIMIENTO_ID = 'ABS001';
const ABASTECIMIENTO_VALIDO = {
  provIdFk: 'PRV001',
  detalles: [
    {
      detAbsTip: 'PRODUCTO',
      detAbsCant: 10,
      detAbsCos: 50000,
      detAbsRefId: 'PR001'
    },
    {
      detAbsTip: 'MATERIAL',
      detAbsCant: 5,
      detAbsCos: 20000,
      detAbsRefId: 'MAT001'
    }
  ]
};

// =====================================================
// 4. TESTS: GET /abastecimientos
// =====================================================

describe('GET /abastecimientos', () => {

  beforeEach(() => { jest.clearAllMocks(); });

  test('debe retornar lista paginada con código 200', async () => {
    abastecimientoService.getAllAbastecimientosService.mockResolvedValue({
      data: [
        {
          id: ABASTECIMIENTO_ID,
          estado: 'COMPLETADO',
          fecha: '2025-01-15T10:00:00.000Z',
          observacion: null,
          provIdFk: 'PRV001',
          proveedor_nombre: 'Proveedor Test',
          usuIdFk: 'US001',
          total_items: 2,
          costo_total: 600000
        }
      ],
      meta: { pagina_actual: 1, paginas_totales: 1, total: 1, limite: 15 },
      resumen: {
        total_abastecimientos: 1,
        pendientes: 0,
        completados: 1,
        costo_total: 600000
      }
    });

    const res = await request(app).get('/abastecimientos');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toBeDefined();
    expect(res.body.resumen).toBeDefined();
    expect(res.body.resumen.completados).toBe(1);
  });

  test('debe pasar filtros al servicio', async () => {
    abastecimientoService.getAllAbastecimientosService.mockResolvedValue({
      data: [],
      meta: { pagina_actual: 1, paginas_totales: 1, total: 0, limite: 15 },
      resumen: { total_abastecimientos: 0, pendientes: 0, completados: 0, costo_total: 0 }
    });

    await request(app).get('/abastecimientos?estado=COMPLETADO&busqueda=proveedor&fecha_desde=2025-01-01&fecha_hasta=2025-12-31');

    expect(abastecimientoService.getAllAbastecimientosService).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: 'COMPLETADO',
        busqueda: 'proveedor',
        fecha_desde: '2025-01-01',
        fecha_hasta: '2025-12-31'
      })
    );
  });

  test('debe retornar 500 si el servicio falla', async () => {
    abastecimientoService.getAllAbastecimientosService.mockResolvedValue({
      err: 'Error al listar abastecimientos',
      errorCode: 500
    });

    const res = await request(app).get('/abastecimientos');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: false, error: 'Error al listar abastecimientos' });
  });
});

// =====================================================
// 5. TESTS: GET /abastecimientos/:id
// =====================================================

describe('GET /abastecimientos/:id', () => {

  beforeEach(() => { jest.clearAllMocks(); });

  test('debe retornar un abastecimiento con detalles y código 200', async () => {
    abastecimientoService.getAbastecimientoByIdService.mockResolvedValue({
      data: {
        id: ABASTECIMIENTO_ID,
        estado: 'COMPLETADO',
        fecha: '2025-01-15T10:00:00.000Z',
        observacion: null,
        provIdFk: 'PRV001',
        usuIdFk: 'US001',
        proveedor_nombre: 'Proveedor Test',
        detalles: [
          {
            id: 'DET001',
            tipo_suministro: 'PRODUCTO',
            cantidad: 10,
            costo_unitario: 50000,
            id_referencia: 'PR001',
            nombre_suministro: 'Camisa Oxford'
          },
          {
            id: 'DET002',
            tipo_suministro: 'MATERIAL',
            cantidad: 5,
            costo_unitario: 20000,
            id_referencia: 'MAT001',
            nombre_suministro: 'Tela Algodón'
          }
        ]
      }
    });

    const res = await request(app).get(`/abastecimientos/${ABASTECIMIENTO_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.id).toBe(ABASTECIMIENTO_ID);
    expect(res.body.data.detalles).toHaveLength(2);
    expect(res.body.data.proveedor_nombre).toBe('Proveedor Test');
  });

  test('debe retornar 404 si el abastecimiento no existe', async () => {
    abastecimientoService.getAbastecimientoByIdService.mockResolvedValue({
      err: 'Abastecimiento no encontrado',
      errorCode: 404
    });

    const res = await request(app).get('/abastecimientos/INEXISTENTE');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: false, error: 'Abastecimiento no encontrado' });
  });

  test('debe retornar 500 si el servicio falla', async () => {
    abastecimientoService.getAbastecimientoByIdService.mockResolvedValue({
      err: 'Error al obtener abastecimiento',
      errorCode: 500
    });

    const res = await request(app).get(`/abastecimientos/${ABASTECIMIENTO_ID}`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: false, error: 'Error al obtener abastecimiento' });
  });
});

// =====================================================
// 6. TESTS: POST /abastecimientos
// =====================================================

describe('POST /abastecimientos', () => {

  beforeEach(() => { jest.clearAllMocks(); });

  test('debe crear un abastecimiento y retornar 201', async () => {
    abastecimientoService.createAbastecimientoService.mockResolvedValue({
      msg: 'Abastecimiento creado correctamente',
      id: ABASTECIMIENTO_ID
    });

    const res = await request(app)
      .post('/abastecimientos')
      .send(ABASTECIMIENTO_VALIDO);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(true);
    expect(res.body.id).toBe(ABASTECIMIENTO_ID);
    expect(res.body.msg).toBe('Abastecimiento creado correctamente');
  });

  test('debe retornar 400 si falta provIdFk', async () => {
    const { provIdFk, ...sinProveedor } = ABASTECIMIENTO_VALIDO;
    const res = await request(app)
      .post('/abastecimientos')
      .send(sinProveedor);

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('provIdFk');
  });

  test('debe retornar 400 si falta detalles', async () => {
    const { detalles, ...sinDetalles } = ABASTECIMIENTO_VALIDO;
    const res = await request(app)
      .post('/abastecimientos')
      .send(sinDetalles);

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('detalles');
  });

  test('debe retornar 400 si detalles es un array vacío', async () => {
    const res = await request(app)
      .post('/abastecimientos')
      .send({ ...ABASTECIMIENTO_VALIDO, detalles: [] });

    expect(res.status).toBe(400);
  });

  test('debe retornar 400 si detAbsTip es inválido', async () => {
    const res = await request(app)
      .post('/abastecimientos')
      .send({
        provIdFk: 'PRV001',
        detalles: [{ detAbsTip: 'INVALIDO', detAbsCant: 5, detAbsCos: 1000, detAbsRefId: 'X' }]
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('detalles.*.detAbsTip');
  });

  test('debe retornar 400 si detAbsCant es 0 o negativo', async () => {
    const res = await request(app)
      .post('/abastecimientos')
      .send({
        provIdFk: 'PRV001',
        detalles: [{ detAbsTip: 'PRODUCTO', detAbsCant: 0, detAbsCos: 1000, detAbsRefId: 'PR001' }]
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('detalles.*.detAbsCant');
  });

  test('debe retornar 400 si falta detAbsRefId', async () => {
    const res = await request(app)
      .post('/abastecimientos')
      .send({
        provIdFk: 'PRV001',
        detalles: [{ detAbsTip: 'PRODUCTO', detAbsCant: 5, detAbsCos: 1000 }]
      });

    expect(res.status).toBe(400);
  });

  test('debe retornar el error del servicio (proveedor no existe)', async () => {
    abastecimientoService.createAbastecimientoService.mockResolvedValue({
      err: 'El proveedor no existe',
      errorCode: 400
    });

    const res = await request(app)
      .post('/abastecimientos')
      .send(ABASTECIMIENTO_VALIDO);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: false, error: 'El proveedor no existe' });
  });

  test('debe retornar 500 si el servicio falla', async () => {
    abastecimientoService.createAbastecimientoService.mockResolvedValue({
      err: 'Error al crear abastecimiento',
      errorCode: 500
    });

    const res = await request(app)
      .post('/abastecimientos')
      .send(ABASTECIMIENTO_VALIDO);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: false, error: 'Error al crear abastecimiento' });
  });

  test('debe aceptar detAbsTip en minúsculas (lo normaliza a mayúsculas)', async () => {
    abastecimientoService.createAbastecimientoService.mockResolvedValue({
      msg: 'Abastecimiento creado correctamente',
      id: ABASTECIMIENTO_ID
    });

    const res = await request(app)
      .post('/abastecimientos')
      .send({
        provIdFk: 'PRV001',
        detalles: [{ detAbsTip: 'producto', detAbsCant: 5, detAbsCos: 1000, detAbsRefId: 'PR001' }]
      });

    expect(res.status).toBe(201);
  });

  test('debe aceptar costo_unitario omitido (default 0)', async () => {
    abastecimientoService.createAbastecimientoService.mockResolvedValue({
      msg: 'Abastecimiento creado correctamente',
      id: ABASTECIMIENTO_ID
    });

    const res = await request(app)
      .post('/abastecimientos')
      .send({
        provIdFk: 'PRV001',
        detalles: [{ detAbsTip: 'MATERIAL', detAbsCant: 3, detAbsRefId: 'MAT001' }]
      });

    expect(res.status).toBe(201);
  });
});

// =====================================================
// 7. TESTS: PATCH /abastecimientos/:id/completar
// =====================================================

describe('PATCH /abastecimientos/:id/completar', () => {

  beforeEach(() => { jest.clearAllMocks(); });

  test('debe completar un abastecimiento y retornar 200', async () => {
    abastecimientoService.completarAbastecimientoService.mockResolvedValue({
      msg: 'Abastecimiento completado — stock, movimientos y actividad actualizados por el trigger'
    });

    const res = await request(app)
      .patch(`/abastecimientos/${ABASTECIMIENTO_ID}/completar`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.msg).toContain('completado');
  });

  test('debe retornar 404 si el abastecimiento no existe', async () => {
    abastecimientoService.completarAbastecimientoService.mockResolvedValue({
      err: 'Abastecimiento no encontrado',
      errorCode: 404
    });

    const res = await request(app)
      .patch('/abastecimientos/INEXISTENTE/completar');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: false, error: 'Abastecimiento no encontrado' });
  });

  test('debe retornar 400 si ya está completado', async () => {
    abastecimientoService.completarAbastecimientoService.mockResolvedValue({
      err: 'El abastecimiento ya está completado',
      errorCode: 400
    });

    const res = await request(app)
      .patch(`/abastecimientos/${ABASTECIMIENTO_ID}/completar`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: false, error: 'El abastecimiento ya está completado' });
  });

  test('debe retornar 400 si está cancelado', async () => {
    abastecimientoService.completarAbastecimientoService.mockResolvedValue({
      err: 'No se puede completar un abastecimiento cancelado',
      errorCode: 400
    });

    const res = await request(app)
      .patch(`/abastecimientos/${ABASTECIMIENTO_ID}/completar`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: false, error: 'No se puede completar un abastecimiento cancelado' });
  });

  test('debe retornar 500 si el servicio falla', async () => {
    abastecimientoService.completarAbastecimientoService.mockResolvedValue({
      err: 'Error al completar abastecimiento',
      errorCode: 500
    });

    const res = await request(app)
      .patch(`/abastecimientos/${ABASTECIMIENTO_ID}/completar`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: false, error: 'Error al completar abastecimiento' });
  });
});

// =====================================================
// 8. TESTS: PATCH /abastecimientos/:id/cancelar
// =====================================================

describe('PATCH /abastecimientos/:id/cancelar', () => {

  beforeEach(() => { jest.clearAllMocks(); });

  test('debe cancelar un abastecimiento y retornar 200', async () => {
    abastecimientoService.cancelarAbastecimientoService.mockResolvedValue({
      msg: 'Abastecimiento cancelado — stock revertido si estaba completado'
    });

    const res = await request(app)
      .patch(`/abastecimientos/${ABASTECIMIENTO_ID}/cancelar`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.msg).toContain('cancelado');
  });

  test('debe retornar 404 si el abastecimiento no existe', async () => {
    abastecimientoService.cancelarAbastecimientoService.mockResolvedValue({
      err: 'Abastecimiento no encontrado',
      errorCode: 404
    });

    const res = await request(app)
      .patch('/abastecimientos/INEXISTENTE/cancelar');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: false, error: 'Abastecimiento no encontrado' });
  });

  test('debe retornar 400 si ya está cancelado', async () => {
    abastecimientoService.cancelarAbastecimientoService.mockResolvedValue({
      err: 'El abastecimiento ya está cancelado',
      errorCode: 400
    });

    const res = await request(app)
      .patch(`/abastecimientos/${ABASTECIMIENTO_ID}/cancelar`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: false, error: 'El abastecimiento ya está cancelado' });
  });

  test('debe retornar 500 si el servicio falla', async () => {
    abastecimientoService.cancelarAbastecimientoService.mockResolvedValue({
      err: 'Error al cancelar abastecimiento',
      errorCode: 500
    });

    const res = await request(app)
      .patch(`/abastecimientos/${ABASTECIMIENTO_ID}/cancelar`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: false, error: 'Error al cancelar abastecimiento' });
  });
});
