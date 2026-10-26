/**
 * ClicLogistics AI - Asistente de Gestión de Almacenamiento Sanitario (Ronald H. Ballou)
 * Cocina Oculta "Clic Costillas"
 */
import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  ThermometerSnowflake,
  QrCode,
  Tag,
  Copy,
  Check,
  Code2,
  Send,
  Boxes,
  Layers,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  classifyInboundShipment,
  InboundSanitaryShipment,
  ProcessedSanitaryItem,
} from '../services/sanitaryClassifier';
import { InventoryBatch, SanitaryZoneId, UserSession } from '../types/logistics';
import { buildClicResponse, validateRbac } from '../services/logisticsEngine';

interface Props {
  session: UserSession;
  onAddBatch: (batch: InventoryBatch) => void;
  onLogAction: (response: ReturnType<typeof buildClicResponse>) => void;
  onTriggerRbacBlock: (response: ReturnType<typeof buildClicResponse>) => void;
}

const SAMPLE_INBOUND_TEXTS = [
  {
    titulo: 'Entrada Cárnicos & Perecederos',
    texto:
      'Llegaron 120kg de costilla de cerdo cruda St. Louis, 40kg de marinada cítrica cruda, 10 bultos de papa capira para corte en espiral y 5 cajas de salsa BBQ maracuyá preparada.',
  },
  {
    titulo: 'Recepción Mixta con Químicos de Aseo',
    texto:
      'Recepción de 80kg de costilla baby back cruda, 30 porciones de costilla precocida al cilindro, 400 cajas kraft térmicas Clic Costillas y 2 bidones de desengrasante para cilindro.',
  },
  {
    titulo: 'Tubérculos, Plátano y Empaques',
    texto:
      'Entrada de 150 plátanos verdes coliseo para tostadas, 6 bidones de aceite vegetal alto rendimiento, 1000 servilletas impresas y 500 vasos salseros con tapa.',
  },
];

export const SanitaryAssistantPanel: React.FC<Props> = ({
  session,
  onAddBatch,
  onLogAction,
  onTriggerRbacBlock,
}) => {
  const [inputText, setInputText] = useState(SAMPLE_INBOUND_TEXTS[0].texto);
  const [shipmentResult, setShipmentResult] =
    useState<InboundSanitaryShipment | null>(() =>
      classifyInboundShipment(SAMPLE_INBOUND_TEXTS[0].texto)
    );
  const [showJsonView, setShowJsonView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleProcessInbound = () => {
    if (!inputText.trim()) return;

    const rbac = validateRbac(session, 'Registro', 'Almacenamiento');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Registro',
        false,
        rbac.reason,
        'Almacenamiento',
        null,
        ['Permisos insuficientes para estructurar recepción sanitaria.']
      );
      onTriggerRbacBlock(resp);
      return;
    }

    const result = classifyInboundShipment(inputText);
    setShipmentResult(result);
    setAddedSuccess(false);

    const resp = buildClicResponse(
      session,
      'Registro',
      true,
      null,
      'Almacenamiento',
      result,
      [
        `Ingreso ${result.ingreso_id} estructurado bajo principios de Ronald H. Ballou.`,
        `${result.items_procesados.length} insumos clasificados en zonas sanitarias exclusivas.`,
        'Etiquetas de rotación PEPS emitidas conforme a fecha de ingreso.',
      ]
    );
    onLogAction(resp);
  };

  const handleAddAllToWarehouse = () => {
    if (!shipmentResult) return;

    const rbac = validateRbac(session, 'Registro', 'Almacenamiento');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Registro',
        false,
        rbac.reason,
        'Almacenamiento',
        null,
        ['Permisos insuficientes para dar ingreso en bodega.']
      );
      onTriggerRbacBlock(resp);
      return;
    }

    const today = new Date();
    shipmentResult.items_procesados.forEach((item, index) => {
      const expiry = new Date();
      expiry.setDate(today.getDate() + item.dias_vida_util_estimada);

      let targetZone: SanitaryZoneId = 'zona_seca_alimentos';
      if (item.zona_almacenamiento === 'Zona Fría - Cárnicos Crudos')
        targetZone = 'zona_fria_crudos';
      else if (
        item.zona_almacenamiento === 'Zona Fría - Precocidos/Preparados'
      )
        targetZone = 'zona_fria_precocidos';
      else if (item.zona_almacenamiento === 'Zona Seca - No Alimentaria')
        targetZone = 'zona_seca_no_alimentaria';

      const newBatch: InventoryBatch = {
        id: `batch-${Date.now()}-${index}`,
        codigoLote: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
        productoId: `prod-in-${Date.now()}-${index}`,
        productoNombre: item.producto,
        zonaId: targetZone,
        cantidad: item.cantidadDetectada
          ? parseInt(item.cantidadDetectada, 10) || 50
          : 50,
        unidad: item.categoria === 'Cárnico' ? 'kg' : 'unidades',
        fechaIngreso: today.toISOString().split('T')[0],
        fechaVencimiento: expiry.toISOString().split('T')[0],
        diasVidaUtil: item.dias_vida_util_estimada,
        estadoPeps:
          item.dias_vida_util_estimada <= 3 ? 'Prioridad_Despacho' : 'Optimo',
        proveedor: 'Recepción Asistente Sanitario',
        temperaturaIngreso:
          item.temperatura_requerida === 'Congelación (-18°C)'
            ? -18
            : item.temperatura_requerida === 'Refrigeración (0-4°C)'
            ? 2.5
            : 20,
      };

      onAddBatch(newBatch);
    });

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 4000);

    const resp = buildClicResponse(
      session,
      'Registro',
      true,
      null,
      'Almacenamiento',
      {
        ingreso_id: shipmentResult.ingreso_id,
        total_lotes_ingresados: shipmentResult.items_procesados.length,
        politica_aplicada: 'PEPS (Primeras Entradas, Primeras Salidas)',
      },
      ['Todos los lotes del asistente fueron integrados al kardex PEPS.']
    );
    onLogAction(resp);
  };

  const handleCopyJson = () => {
    if (!shipmentResult) return;
    navigator.clipboard.writeText(JSON.stringify(shipmentResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-cyan-800/60 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 text-cyan-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Ronald H. Ballou &bull; Asistente Logístico Sanitario
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                Reglas Sanitarias 1 a 4
              </span>
            </div>
            <h3 className="text-lg font-black text-white">
              Estructurador y Clasificador de Mercancía en Recepción
            </h3>
            <p className="text-xs text-slate-400">
              Asignación automática de zona física, control térmico, alerta
              antioxidante/biológica y emisión de rótulos PEPS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJsonView(!showJsonView)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showJsonView ? 'Ocultar JSON' : 'Ver JSON Exclusivo'}</span>
          </button>
        </div>
      </div>

      {/* Input box & Quick Samples */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Mensaje o Lista de Insumos Recibidos:
          </label>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Cargar Ejemplo:</span>
            {SAMPLE_INBOUND_TEXTS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(sample.texto)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {sample.titulo}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ejemplo: Llegaron 80kg de costilla de cerdo cruda, 2 bultos de papa capira y 5 cajas de salsa BBQ..."
            className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 text-xs font-mono leading-relaxed focus:outline-none transition shadow-inner"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Operador:{' '}
            <strong className="text-amber-300">{session.usuario}</strong> (
            {session.rol})
          </span>

          <button
            onClick={handleProcessInbound}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition"
          >
            <Send className="w-4 h-4" />
            <span>Clasificar Insumos & Asignar Zonas Sanitarias</span>
          </button>
        </div>
      </div>

      {/* JSON Viewer Mode (Strict Schema) */}
      {showJsonView && shipmentResult && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
              <Code2 className="w-4 h-4" />
              <span>Esquema JSON Exclusivo de Entrada Sanitaria</span>
            </div>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar JSON</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-200/90 overflow-x-auto max-h-72">
            {JSON.stringify(shipmentResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Processed Items & PEPS Storage Labels */}
      {shipmentResult && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  {shipmentResult.ingreso_id}
                </span>
                <h4 className="text-sm font-bold text-white">
                  Rótulos y Asignación Sanitaria PEPS ({shipmentResult.items_procesados.length} insumos)
                </h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Organización física estricta para eliminar riesgo de
                contaminación biológica y química.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddAllToWarehouse}
                disabled={addedSuccess}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950 transition disabled:opacity-50"
              >
                <Boxes className="w-4 h-4" />
                <span>
                  {addedSuccess
                    ? '¡Lotes Registrados en Kardex PEPS!'
                    : 'Ingresar Todos los Lotes a Bodega'}
                </span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shipmentResult.items_procesados.map((item, idx) => {
              const isColdRaw =
                item.zona_almacenamiento === 'Zona Fría - Cárnicos Crudos';
              const isColdPrecooked =
                item.zona_almacenamiento ===
                'Zona Fría - Precocidos/Preparados';
              const isDryFood =
                item.zona_almacenamiento === 'Zona Seca - Alimentos';
              const isDryNonFood =
                item.zona_almacenamiento === 'Zona Seca - No Alimentaria';

              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-4 border flex flex-col justify-between space-y-3 shadow-lg ${
                    isColdRaw
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isColdPrecooked
                      ? 'bg-blue-950/20 border-blue-500/40'
                      : isDryFood
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-emerald-950/20 border-emerald-500/40'
                  }`}
                >
                  {/* Top info */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isColdRaw
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isColdPrecooked
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : isDryFood
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {item.categoria}
                        </span>
                        <h5 className="font-bold text-white text-sm mt-1.5">
                          {item.producto}
                        </h5>
                      </div>

                      {/* Rotation Method Tag */}
                      <div className="text-right">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono">
                          MÉTODO {item.metodo_rotacion}
                        </span>
                        {item.cantidadDetectada && (
                          <div className="text-[11px] font-semibold text-slate-300 mt-1">
                            {item.cantidadDetectada}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Zone Assignment */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Zona Asignada:</span>
                        <span className="font-bold text-white">
                          {item.zona_almacenamiento}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">
                          Temperatura Requerida:
                        </span>
                        <span className="font-mono text-cyan-300 font-semibold flex items-center gap-1">
                          <ThermometerSnowflake className="w-3 h-3" />
                          {item.temperatura_requerida}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">
                          Vida Útil Estimada:
                        </span>
                        <span className="font-bold text-amber-400">
                          {item.dias_vida_util_estimada} días restantes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cross-contamination alert */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] leading-relaxed">
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <ShieldAlert
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isColdRaw
                            ? 'text-rose-400'
                            : isDryNonFood
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      />
                      <span>{item.alerta_contaminacion_cruzada}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
