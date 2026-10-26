/**
 * Sanitary Classification & Inbound Reception Engine (Ronald H. Ballou)
 * Clic Costillas - Cocina Oculta
 */

export interface ProcessedSanitaryItem {
  producto: string;
  categoria: 'Cárnico' | 'Perecedero' | 'Insumo Seco' | 'Empaque';
  zona_almacenamiento:
    | 'Zona Fría - Cárnicos Crudos'
    | 'Zona Fría - Precocidos/Preparados'
    | 'Zona Seca - Alimentos'
    | 'Zona Seca - No Alimentaria';
  temperatura_requerida:
    | 'Ambiente'
    | 'Refrigeración (0-4°C)'
    | 'Congelación (-18°C)';
  metodo_rotacion: 'PEPS';
  dias_vida_util_estimada: number;
  alerta_contaminacion_cruzada: string;
  cantidadDetectada?: string;
}

export interface InboundSanitaryShipment {
  ingreso_id: string;
  items_procesados: ProcessedSanitaryItem[];
}

export function classifyInboundShipment(rawText: string): InboundSanitaryShipment {
  const ingresoId = `ING-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const lines = rawText
    .split(/[\n,;]+|\by\b/i)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const processedItems: ProcessedSanitaryItem[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    // 1. Zona Fría - Cárnicos Crudos (Congelador/Refrigerador A)
    if (
      /costilla.*cruda|cruda|cerdo crudo|marinado crudo|marinada cruda|salmuera cruda|carne cruda|tocino crudo|costillitas crudas/i.test(
        lower
      )
    ) {
      const isFrozen = /congelad|bloque congelado|-18/i.test(lower);
      processedItems.push({
        producto: cleanProductName(line),
        categoria: 'Cárnico',
        zona_almacenamiento: 'Zona Fría - Cárnicos Crudos',
        temperatura_requerida: isFrozen
          ? 'Congelación (-18°C)'
          : 'Refrigeración (0-4°C)',
        metodo_rotacion: 'PEPS',
        dias_vida_util_estimada: isFrozen ? 90 : 5,
        alerta_contaminacion_cruzada:
          'ALTO RIESGO BIOLÓGICO: Almacenar en bandejas inferiores herméticas. Prohibido contacto o proximidad con alimentos cocidos o listos para servir.',
        cantidadDetectada: extractQuantity(line),
      });
      continue;
    }

    // 2. Zona Fría - Precocidos/Preparados (Refrigerador B)
    if (
      /ahumada|precocid|cocid|salsa|bbq|mayonesa|rocoto|aj[ií] preparado|aderezo|porci[oó]n congelada/i.test(
        lower
      )
    ) {
      const isFrozenPortion = /congelad/i.test(lower);
      processedItems.push({
        producto: cleanProductName(line),
        categoria: 'Perecedero',
        zona_almacenamiento: 'Zona Fría - Precocidos/Preparados',
        temperatura_requerida: isFrozenPortion
          ? 'Congelación (-18°C)'
          : 'Refrigeración (0-4°C)',
        metodo_rotacion: 'PEPS',
        dias_vida_util_estimada: isFrozenPortion ? 45 : 4,
        alerta_contaminacion_cruzada:
          'ALIMENTO LISTO PARA REGENERAR/CONSUMO: Mantener en recipientes plásticos grado alimentario con tapa hermética. Nunca ubicar bajo carnes crudas.',
        cantidadDetectada: extractQuantity(line),
      });
      continue;
    }

    // 4. Zona Seca - No Alimentaria (Bodega B)
    if (
      /empaque|caja|bolsa|servilleta|vaso|tapa|nitrilo|guante|desengrasante|cloro|jab[oó]n|aseo|limpieza|sanitizante|qu[ií]mico/i.test(
        lower
      )
    ) {
      const isChemical = /desengrasante|cloro|jab[oó]n|aseo|limpieza|sanitizante|qu[ií]mico/i.test(
        lower
      );
      processedItems.push({
        producto: cleanProductName(line),
        categoria: 'Empaque',
        zona_almacenamiento: 'Zona Seca - No Alimentaria',
        temperatura_requerida: 'Ambiente',
        metodo_rotacion: 'PEPS',
        dias_vida_util_estimada: isChemical ? 365 : 720,
        alerta_contaminacion_cruzada: isChemical
          ? 'PELIGRO QUÍMICO CRÍTICO: Almacenar en locker bajo llave exclusivo para químicos de aseo. Separación física absoluta de empaques alimentarios.'
          : 'EMPAQUE GRADO ALIMENTARIO: Mantener en cajas cerradas sobre estibas plásticas, aislado de humedad y productos químicos.',
        cantidadDetectada: extractQuantity(line),
      });
      continue;
    }

    // 3. Zona Seca - Alimentos (Bodega A)
    if (
      /papa|pl[aá]tano|aceite|carb[oó]n|briqueta|sal|especia|condimento|pimienta|az[uú]car|harina|orégano|comino/i.test(
        lower
      )
    ) {
      const isCarbohydrate = /papa|pl[aá]tano/i.test(lower);
      processedItems.push({
        producto: cleanProductName(line),
        categoria: isCarbohydrate ? 'Perecedero' : 'Insumo Seco',
        zona_almacenamiento: 'Zona Seca - Alimentos',
        temperatura_requerida: 'Ambiente',
        metodo_rotacion: 'PEPS',
        dias_vida_util_estimada: isCarbohydrate ? 10 : 180,
        alerta_contaminacion_cruzada:
          'ALMACENAMIENTO SECO: Estibar a mínimo 15cm del suelo y 20cm de la pared. Área ventilada, protegida de luz directa y humedad.',
        cantidadDetectada: extractQuantity(line),
      });
      continue;
    }

    // Default fallback: classify as Dry food or perishable with safety reminder
    processedItems.push({
      producto: cleanProductName(line),
      categoria: 'Insumo Seco',
      zona_almacenamiento: 'Zona Seca - Alimentos',
      temperatura_requerida: 'Ambiente',
      metodo_rotacion: 'PEPS',
      dias_vida_util_estimada: 30,
      alerta_contaminacion_cruzada:
        'INSPECCIÓN PREVENTIVA: Revisar rotulado y ficha técnica del proveedor para confirmar ausencia de alérgenos o necesidad de frío.',
      cantidadDetectada: extractQuantity(line),
    });
  }

  // If no items extracted, provide standard Clic Costillas reception sample
  if (processedItems.length === 0) {
    return {
      ingreso_id: ingresoId,
      items_procesados: [
        {
          producto: 'Costillas de cerdo crudas corte St. Louis',
          categoria: 'Cárnico',
          zona_almacenamiento: 'Zona Fría - Cárnicos Crudos',
          temperatura_requerida: 'Refrigeración (0-4°C)',
          metodo_rotacion: 'PEPS',
          dias_vida_util_estimada: 5,
          alerta_contaminacion_cruzada:
            'ALTO RIESGO BIOLÓGICO: Almacenar en bandejas inferiores herméticas. Prohibido contacto o proximidad con alimentos cocidos o listos para servir.',
        },
        {
          producto: 'Costillas ahumadas precocidas al cilindro',
          categoria: 'Perecedero',
          zona_almacenamiento: 'Zona Fría - Precocidos/Preparados',
          temperatura_requerida: 'Refrigeración (0-4°C)',
          metodo_rotacion: 'PEPS',
          dias_vida_util_estimada: 4,
          alerta_contaminacion_cruzada:
            'ALIMENTO LISTO PARA REGENERAR/CONSUMO: Mantener en recipientes plásticos grado alimentario con tapa hermética. Nunca ubicar bajo carnes crudas.',
        },
        {
          producto: 'Papa Capira y Plátano verde para espirales y patacones',
          categoria: 'Perecedero',
          zona_almacenamiento: 'Zona Seca - Alimentos',
          temperatura_requerida: 'Ambiente',
          metodo_rotacion: 'PEPS',
          dias_vida_util_estimada: 10,
          alerta_contaminacion_cruzada:
            'ALMACENAMIENTO SECO: Estibar a mínimo 15cm del suelo y 20cm de la pared. Área ventilada, protegida de luz directa.',
        },
        {
          producto: 'Cajas térmicas kraft y vasos de salsa 2oz',
          categoria: 'Empaque',
          zona_almacenamiento: 'Zona Seca - No Alimentaria',
          temperatura_requerida: 'Ambiente',
          metodo_rotacion: 'PEPS',
          dias_vida_util_estimada: 720,
          alerta_contaminacion_cruzada:
            'EMPAQUE GRADO ALIMENTARIO: Mantener en cajas cerradas sobre estibas plásticas, aislado de humedad y productos químicos.',
        },
      ],
    };
  }

  return {
    ingreso_id: ingresoId,
    items_procesados: processedItems,
  };
}

function cleanProductName(text: string): string {
  return text
    .replace(/^\d+[\s\w]*?\s+(?:de\s+)?/i, '')
    .replace(/^llegaron\s+/i, '')
    .replace(/^ingreso\s+/i, '')
    .trim()
    .replace(/^./, (str) => str.toUpperCase());
}

function extractQuantity(text: string): string | undefined {
  const match = text.match(/\b\d+[\s]*(?:kg|kilos?|bultos?|sacos?|cajas?|unidades?|bidones?|litros?|paquetes?)\b/i);
  return match ? match[0] : undefined;
}
