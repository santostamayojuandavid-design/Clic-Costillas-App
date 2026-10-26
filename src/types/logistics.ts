/**
 * ClicLogistics AI - Type Definitions
 * Cocina Oculta "Clic Costillas" (Ahumados al Cilindro Peruano)
 */

export type UserRole = 'Administrador' | 'Asesor' | 'Ninguno';

export interface UserSession {
  autenticado: boolean;
  usuario: string | null;
  rol: UserRole;
  nombre?: string;
  avatar?: string;
}

export type OperationType =
  | 'Login'
  | 'Logout'
  | 'Registro'
  | 'Lectura'
  | 'Edicion'
  | 'Anulacion'
  | 'Reporte'
  | 'Ajuste_Inventario'
  | 'Recepcion_OTIF'
  | 'Cuadre_Caja';

export type LogisticsModuleType =
  | 'Almacenamiento'
  | 'Inventario'
  | 'Proveedores'
  | 'Distribucion_WhatsApp'
  | 'Cuadre_Caja'
  | 'Ninguno';

export interface ClicLogisticsResponse<T = unknown> {
  control_sesion: {
    autenticado: boolean;
    usuario: string | null;
    rol: UserRole;
    mensaje_seguridad: string;
  };
  autorizacion: {
    operacion_solicitada: OperationType;
    permitida: boolean;
    motivo_bloqueo: string | null;
  };
  ejecucion_logistica: {
    modulo: LogisticsModuleType;
    datos_procesados: T | null;
    alertas_operativas: string[];
  };
}

// MÓDULO A: Almacenamiento y Zonificación Sanitaria (Ronald H. Ballou)
export type SanitaryZoneId =
  | 'zona_fria_crudos'
  | 'zona_fria_precocidos'
  | 'zona_seca_alimentos'
  | 'zona_seca_no_alimentaria';

export interface SanitaryZone {
  id: SanitaryZoneId;
  nombre: string;
  ubicacion: string;
  temperaturaObjetivo: string;
  temperaturaActual: number;
  capacidadUtilizada: number; // Porcentaje 0-100
  descripcionRiesgo: string;
  productosPermitidos: string[];
}

export interface InventoryBatch {
  id: string;
  codigoLote: string;
  productoId: string;
  productoNombre: string;
  zonaId: SanitaryZoneId;
  cantidad: number;
  unidad: string;
  fechaIngreso: string;
  fechaVencimiento: string;
  diasVidaUtil: number;
  estadoPeps: 'Optimo' | 'Proximo_A_Vencer' | 'Prioridad_Despacho' | 'Vencido';
  proveedor: string;
  temperaturaIngreso?: number;
}

// MÓDULO B: Inventario ABC & ROP (Heizer, Render & Munson)
export type AbcCategory = 'A' | 'B' | 'C';

export interface InventoryItem {
  id: string;
  nombre: string;
  categoriaAbc: AbcCategory;
  zonaSanitariaId: SanitaryZoneId;
  stockActual: number;
  unidad: string;
  costoUnitario: number;
  valorTotalStock: number;
  demandaDiariaBase: number; // Unidades/día
  leadTimeDias: number; // Tiempo de entrega del proveedor en días
  stockSeguridad: number; // Unidades mínimas
  puntoReordenNormal: number;
  puntoReordenFinDeSemana: number; // Factor 1.5x
  conteoFisicoRegistrado?: number;
  diferenciaConteo?: number;
}

// MÓDULO C: Cadena de Suministro y Proveedores (Martin Christopher - OTIF)
export interface SupplierReception {
  id: string;
  proveedorNombre: string;
  numeroGuia: string;
  fechaHoraPactada: string;
  fechaHoraLlegada: string;
  aTiempo: boolean; // On Time
  cantidadPedida: number;
  cantidadRecibida: number;
  completo: boolean; // In Full
  unidad: string;
  temperaturaMedida: number; // °C
  cumpleCadenaFrio: boolean;
  precioPactado: number;
  precioFacturado: number;
  precioConsistente: boolean;
  otifAprobado: boolean;
  observaciones: string;
  registradoPor: string;
}

// MÓDULO D: Distribución y Pedidos WhatsApp (Bowersox, Closs & Cooper)
export type AccompanimentType =
  | 'Papa en espiral'
  | 'Papas a la francesa'
  | 'Tostadas de plátano verde';

export type DeliveryZoneQuadrant =
  | 'Cuadrante Norte'
  | 'Cuadrante Sur'
  | 'Cuadrante Centro-Occidente'
  | 'Cuadrante Oriente';

export type OrderStatus =
  | 'Recibido'
  | 'En Cilindro/Cocina'
  | 'Listo para Despacho'
  | 'En Ruta'
  | 'Entregado'
  | 'Anulado';

export interface OrderItem {
  producto: string;
  porciones: number;
  acompanamiento: AccompanimentType;
  salsas: string[];
}

export interface CustomerOrder {
  id: string;
  codigoOrden: string;
  clienteNombre: string;
  clienteTelefono: string;
  direccion: string;
  barrio: string;
  cuadrante: DeliveryZoneQuadrant;
  items: OrderItem[];
  metodoPago: 'Efectivo' | 'Nequi / Daviplata' | 'Datafono' | 'Transferencia';
  total: number;
  efectivoConCuantoPaga?: number;
  cambioRequerido?: number;
  estado: OrderStatus;
  horaCreacion: string;
  tiempoPreparacionMinutos: number; // Standard: 30 min
  tiempoRutaMinutos: number; // Standard: 20 min
  horaEstimadaEntrega: string;
  minutosRestantes: number;
  mensajeWhatsAppOriginal: string;
  asesorResponsable: string;
}

// Cuadre de Caja
export interface CashShiftRecord {
  id: string;
  fecha: string;
  asesor: string;
  baseInicial: number;
  ventasEfectivo: number;
  ventasElectronicas: number;
  gastosOperativos: number;
  saldoEsperadoEfectivo: number;
  efectivoRealContado: number;
  diferencia: number;
  estado: 'Cuadrado' | 'Faltante' | 'Sobrante' | 'Abierto';
  observaciones: string;
}
