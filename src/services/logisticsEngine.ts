/**
 * ClicLogistics AI - Core Logistics & RBAC Engine
 * Cocina Oculta "Clic Costillas" (Ahumados al Cilindro Peruano)
 */

import {
  UserSession,
  OperationType,
  LogisticsModuleType,
  ClicLogisticsResponse,
  CustomerOrder,
  OrderItem,
  AccompanimentType,
  DeliveryZoneQuadrant,
  InventoryItem,
  SupplierReception,
  SanitaryZoneId,
} from '../types/logistics';

// Valid Credentials
export const VALID_CREDENTIALS = {
  admin: {
    usuario: 'admin_clic',
    clave: 'Admin2026*',
    rol: 'Administrador' as const,
    nombre: 'Jefe de Operaciones Clic',
  },
  asesor: {
    usuario: 'asesor_clic',
    clave: 'Asesor2026*',
    rol: 'Asesor' as const,
    nombre: 'Asesor de Logística & WhatsApp',
  },
};

/**
 * Builds the strict JSON response required by ClicLogistics AI
 */
export function buildClicResponse<T = unknown>(
  session: UserSession,
  operation: OperationType,
  isAllowed: boolean,
  blockingReason: string | null,
  moduleName: LogisticsModuleType,
  processedData: T | null,
  operationalAlerts: string[] = []
): ClicLogisticsResponse<T> {
  let securityMessage = '';
  if (!session.autenticado) {
    securityMessage =
      'Acceso denegado: Usuario no autenticado. Ingrese credenciales autorizadas.';
  } else if (session.rol === 'Administrador') {
    securityMessage =
      'Acceso TOTAL concedido. Privilegios de Administrador de Operaciones vigentes.';
  } else {
    securityMessage =
      'Acceso OPERATIVO concedido. Rol Asesor restringido a registro y consulta básica.';
  }

  return {
    control_sesion: {
      autenticado: session.autenticado,
      usuario: session.usuario,
      rol: session.rol,
      mensaje_seguridad: securityMessage,
    },
    autorizacion: {
      operacion_solicitada: operation,
      permitida: isAllowed,
      motivo_bloqueo: blockingReason,
    },
    ejecucion_logistica: {
      modulo: moduleName,
      datos_procesados: processedData,
      alertas_operativas: operationalAlerts,
    },
  };
}

/**
 * Validates RBAC permissions for a given operation
 */
export function validateRbac(
  session: UserSession,
  operation: OperationType,
  moduleName: LogisticsModuleType
): { allowed: boolean; reason: string | null } {
  if (!session.autenticado || !session.usuario) {
    return {
      allowed: false,
      reason:
        'SEGURIDAD ESTRICTA: El usuario no ha iniciado sesión. Debe autenticarse con credenciales válidas.',
    };
  }

  if (session.rol === 'Administrador') {
    // Administrator has total access to everything
    return { allowed: true, reason: null };
  }

  if (session.rol === 'Asesor') {
    // Asesor PROHIBITION: CANNOT EDIT OR CANCEL/DELETE ANY RECORD
    if (operation === 'Edicion' || operation === 'Anulacion') {
      return {
        allowed: false,
        reason: `BLOQUEO RBAC ESTRICTO: El rol "Asesor" tiene prohibido ejecutar acciones de ${operation.toUpperCase()} en ${moduleName}. Acción reservada exclusivamente para el Administrador.`,
      };
    }

    // Prohibit viewing financial reports if restricted
    if (operation === 'Reporte' && moduleName === 'Inventario') {
      return {
        allowed: false,
        reason:
          'BLOQUEO RBAC: Los reportes de márgenes y valoración económica requieren rol de Administrador.',
      };
    }

    // Permitted operations for Asesor:
    // Registrar ventas WhatsApp, ingresar conteo inventario, registrar recepción proveedores, cuadres de caja, lectura básica.
    return { allowed: true, reason: null };
  }

  return {
    allowed: false,
    reason: 'Rol desconocido o sin privilegios asignados.',
  };
}

/**
 * Intelligent WhatsApp message parser for Clic Costillas
 * Theory: Bowersox, Closs & Cooper (Demand Fulfillment & Distribution)
 */
export function parseWhatsAppMessage(
  rawText: string,
  user: string
): CustomerOrder {
  const textLower = rawText.toLowerCase();

  // Extract phone number (e.g. 312 458 9912 or 3007821104)
  const phoneMatch = rawText.match(/(?:3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\b3\d{9}\b)/);
  const clienteTelefono = phoneMatch ? phoneMatch[0].trim() : '310 000 0000';

  // Extract customer name
  let clienteNombre = 'Cliente WhatsApp';
  const nameMatch = rawText.match(
    /(?:nombre[:\s]+|para[:\s]+)([a-záéíóúñ\s]+?)(?:cel|tel|cra|calle|carrera|circular|cll|pago|\.|\n|$)/i
  );
  if (nameMatch && nameMatch[1].trim().length > 2) {
    clienteNombre = nameMatch[1].trim();
  } else {
    // fallback look for "para [Name]"
    const paraMatch = rawText.match(/para\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/);
    if (paraMatch) {
      clienteNombre = paraMatch[1].trim();
    }
  }

  // Extract Address
  let direccion = 'Dirección no identificada - Confirmar';
  const addressMatch = rawText.match(
    /(?:cra\.?|carrera|calle|cll|circular|diagonal|transversal|av\.?|avenida)\s+[\d\w\s#-]+?(?:apto\s*\d+|int\s*\d+|casa\s*\d+|(?=[,\.]|\s+(?:barrio|poblado|laureles|belen|envigado|pago|cel)))/i
  );
  if (addressMatch) {
    direccion = addressMatch[0].trim();
  }

  // Extract Neighborhood & Quadrant
  let barrio = 'Centro';
  let cuadrante: DeliveryZoneQuadrant = 'Cuadrante Centro-Occidente';

  if (/poblado|patio bonito|astorga|manila|castropol/i.test(textLower)) {
    barrio = 'El Poblado';
    cuadrante = 'Cuadrante Sur';
  } else if (/envigado|sabaneta|itagu[ií]|la magnolia/i.test(textLower)) {
    barrio = 'Envigado / Sur';
    cuadrante = 'Cuadrante Sur';
  } else if (/laureles|estadio|conquistadores|san joaqu[ií]n|bolivariana/i.test(textLower)) {
    barrio = 'Laureles';
    cuadrante = 'Cuadrante Centro-Occidente';
  } else if (/bel[eé]n|rosales|f[aá]tima|granada/i.test(textLower)) {
    barrio = 'Belén';
    cuadrante = 'Cuadrante Centro-Occidente';
  } else if (/bello|castilla|robledo|aranjuez|manrique/i.test(textLower)) {
    barrio = 'Zona Norte';
    cuadrante = 'Cuadrante Norte';
  } else if (/boston|prado|buenos aires|centro|la playa/i.test(textLower)) {
    barrio = 'Boston / Centro';
    cuadrante = 'Cuadrante Oriente';
  }

  // Detect Accompaniments
  let acompanamiento: AccompanimentType = 'Papa en espiral';
  if (/espiral|espirales|papa espiral/i.test(textLower)) {
    acompanamiento = 'Papa en espiral';
  } else if (/francesa|francesas|papas a la francesa/i.test(textLower)) {
    acompanamiento = 'Papas a la francesa';
  } else if (/pl[aá]tano|platano|tostada|tostadas|patacon|patacones/i.test(textLower)) {
    acompanamiento = 'Tostadas de plátano verde';
  }

  // Detect Salsas
  const salsas: string[] = [];
  if (/maracuy[aá]|bbq/i.test(textLower)) salsas.push('BBQ Maracuyá');
  if (/rocoto|mayonesa/i.test(textLower)) salsas.push('Mayonesa de Rocoto');
  if (/aj[ií]|criollo|picante/i.test(textLower)) salsas.push('Ají Criollo');
  if (salsas.length === 0) salsas.push('BBQ Maracuyá', 'Ají Criollo');

  // Detect Quantity & Product
  const isFamiliar = /familiar|1\s*kg|1\s*kilo|kilo/i.test(textLower);
  let portions = 1;
  const numMatch = textLower.match(/(\d+)\s*(?:combos?|costillas?|porciones?|personales?)/i);
  if (numMatch) {
    portions = parseInt(numMatch[1], 10) || 1;
  }

  const items: OrderItem[] = [];
  let total = 0;

  if (isFamiliar) {
    items.push({
      producto: 'Costilla Familiar al Cilindro (1 Kilogramo)',
      porciones: 1,
      acompanamiento,
      salsas,
    });
    total += 85000;
  } else {
    items.push({
      producto: 'Combo Costilla Ahumada Personal (400g)',
      porciones: portions,
      acompanamiento,
      salsas,
    });
    total += 39000 * portions;
  }

  // Detect Payment Method
  let metodoPago: CustomerOrder['metodoPago'] = 'Efectivo';
  let efectivoConCuantoPaga: number | undefined;
  let cambioRequerido: number | undefined;

  if (/nequi/i.test(textLower)) {
    metodoPago = 'Nequi / Daviplata';
  } else if (/daviplata/i.test(textLower)) {
    metodoPago = 'Nequi / Daviplata';
  } else if (/datafono|dat[aá]fono|tarjeta/i.test(textLower)) {
    metodoPago = 'Datafono';
  } else if (/transferencia|bancolombia/i.test(textLower)) {
    metodoPago = 'Transferencia';
  } else {
    metodoPago = 'Efectivo';
    const cashMatch = textLower.match(/(?:paga con|billete de|con)\s*\$?(\d+)(?:k|\.000|000)/i);
    if (cashMatch) {
      let val = parseInt(cashMatch[1], 10);
      if (val < 1000) val *= 1000;
      efectivoConCuantoPaga = val;
      if (efectivoConCuantoPaga > total) {
        cambioRequerido = efectivoConCuantoPaga - total;
      }
    }
  }

  // Time calculations (SLA 30m prep + 20m route = 50 min)
  const now = new Date();
  const horaCreacion = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const deliveryDate = new Date(now.getTime() + 50 * 60000);
  const horaEstimadaEntrega = deliveryDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const randomCode = Math.floor(100 + Math.random() * 900);

  return {
    id: `ord-${Date.now()}`,
    codigoOrden: `CC-${randomCode}`,
    clienteNombre,
    clienteTelefono,
    direccion,
    barrio,
    cuadrante,
    items,
    metodoPago,
    total,
    efectivoConCuantoPaga,
    cambioRequerido,
    estado: 'Recibido',
    horaCreacion,
    tiempoPreparacionMinutos: 30,
    tiempoRutaMinutos: 20,
    horaEstimadaEntrega,
    minutosRestantes: 50,
    mensajeWhatsAppOriginal: rawText,
    asesorResponsable: user,
  };
}

/**
 * Calculates ROP and weekend 1.5x factor for inventory (Heizer, Render & Munson)
 */
export function recalculateItemRop(item: InventoryItem, isWeekend: boolean) {
  const demand = isWeekend
    ? item.demandaDiariaBase * 1.5
    : item.demandaDiariaBase;
  const rop = demand * item.leadTimeDias + item.stockSeguridad;
  return Math.ceil(rop);
}

/**
 * Evaluates OTIF for supplier delivery (Martin Christopher)
 */
export function evaluateOtifReception(data: {
  aTiempo: boolean;
  cantidadPedida: number;
  cantidadRecibida: number;
  temperatura: number;
  isColdChainItem: boolean;
  precioPactado: number;
  precioFacturado: number;
}): {
  completo: boolean;
  cumpleCadenaFrio: boolean;
  precioConsistente: boolean;
  otifAprobado: boolean;
  alertas: string[];
} {
  const completo = data.cantidadRecibida >= data.cantidadPedida;
  // Cold chain rule: Raw meats must be <= 4.0 °C
  const cumpleCadenaFrio = data.isColdChainItem ? data.temperatura <= 4.0 : true;
  const precioConsistente = data.precioFacturado <= data.precioPactado;

  const alertas: string[] = [];

  if (!data.aTiempo) {
    alertas.push('INCUMPLIMIENTO ON-TIME: Proveedor llegó fuera de la ventana horaria pactada.');
  }
  if (!completo) {
    alertas.push(
      `INCUMPLIMIENTO IN-FULL: Faltan ${data.cantidadPedida - data.cantidadRecibida} unidades en la entrega.`
    );
  }
  if (data.isColdChainItem && !cumpleCadenaFrio) {
    alertas.push(
      `ALERTA SANITARIA CRÍTICA: Temperatura ${data.temperatura}°C supera el límite de seguridad (máx 4.0°C). Riesgo de contaminación biológica.`
    );
  }
  if (!precioConsistente) {
    alertas.push(
      `DISCREPANCIA FINANCIERA: Precio facturado ($${data.precioFacturado}) excede el valor pactado ($${data.precioPactado}).`
    );
  }

  const otifAprobado = data.aTiempo && completo && cumpleCadenaFrio && precioConsistente;

  return {
    completo,
    cumpleCadenaFrio,
    precioConsistente,
    otifAprobado,
    alertas,
  };
}

/**
 * Ronald H. Ballou - Checks sanitary zoning compliance
 */
export function checkSanitaryZoneCompatibility(
  productoNombre: string,
  targetZoneId: SanitaryZoneId
): { compatible: boolean; advertencia?: string } {
  const lower = productoNombre.toLowerCase();
  const isRawMeat = /cruda|cerdo|marinado|salmuera/i.test(lower);
  const isPrecooked = /ahumada|precocida|salsa/i.test(lower);
  const isChemicalOrClean = /sanitizante|desengrasante|qu[ií]mico/i.test(lower);

  if (isRawMeat && targetZoneId !== 'zona_fria_crudos') {
    return {
      compatible: false,
      advertencia:
        'PELIGRO DE CONTAMINACIÓN CRUZADA: Cárnicos crudos no pueden ubicarse fuera de la Zona Fría - Cárnicos Crudos.',
    };
  }

  if (isPrecooked && targetZoneId === 'zona_fria_crudos') {
    return {
      compatible: false,
      advertencia:
        'PELIGRO SANITARIO CRÍTICO: Alimentos preparados/precocidos nunca deben estar en contacto con cárnicos crudos.',
    };
  }

  if (isChemicalOrClean && targetZoneId !== 'zona_seca_no_alimentaria') {
    return {
      compatible: false,
      advertencia:
        'INFRACCIÓN DE BODEGA: Químicos y productos de aseo deben estar aislados en Zona Seca - No Alimentaria.',
    };
  }

  return { compatible: true };
}
