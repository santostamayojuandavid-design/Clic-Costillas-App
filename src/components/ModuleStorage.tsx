/**
 * MÓDULO A: ALMACENAMIENTO Y ZONIFICACIÓN SANITARIA (Ronald H. Ballou)
 * Clic Costillas - Cocina Oculta
 */
import React, { useState } from 'react';
import {
  Warehouse,
  ThermometerSnowflake,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ArrowRightLeft,
  PlusCircle,
  Trash2,
  Edit,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  SanitaryZone,
  InventoryBatch,
  UserSession,
  SanitaryZoneId,
} from '../types/logistics';
import {
  checkSanitaryZoneCompatibility,
  validateRbac,
  buildClicResponse,
} from '../services/logisticsEngine';
import { SanitaryAssistantPanel } from './SanitaryAssistantPanel';

interface Props {
  session: UserSession;
  zones: SanitaryZone[];
  batches: InventoryBatch[];
  onAddBatch: (batch: InventoryBatch) => void;
  onDeleteBatch: (batchId: string) => void;
  onMoveBatchZone: (batchId: string, newZoneId: SanitaryZoneId) => void;
  onLogAction: (response: ReturnType<typeof buildClicResponse>) => void;
  onTriggerRbacBlock: (response: ReturnType<typeof buildClicResponse>) => void;
}

export const ModuleStorage: React.FC<Props> = ({
  session,
  zones,
  batches,
  onAddBatch,
  onDeleteBatch,
  onMoveBatchZone,
  onLogAction,
  onTriggerRbacBlock,
}) => {
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<
    'TODAS' | SanitaryZoneId
  >('TODAS');

  // Form for registering a new incoming batch (PEPS)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBatchName, setNewBatchName] = useState('Costilla Baby Back Cruda');
  const [newBatchQty, setNewBatchQty] = useState(60);
  const [newBatchUnit, setNewBatchUnit] = useState('kg');
  const [newBatchZone, setNewBatchZone] =
    useState<SanitaryZoneId>('zona_fria_crudos');
  const [newBatchSupplier, setNewBatchSupplier] =
    useState('Carnes del Valle SAS');
  const [newBatchTemp, setNewBatchTemp] = useState(1.5);
  const [newBatchDaysLife, setNewBatchDaysLife] = useState(7);

  // Filtered batches sorted by PEPS (earliest expiry first)
  const sortedBatches = [...batches].sort(
    (a, b) =>
      new Date(a.fechaVencimiento).getTime() -
      new Date(b.fechaVencimiento).getTime()
  );

  const filteredBatches = sortedBatches.filter((b) =>
    selectedZoneFilter === 'TODAS' ? true : b.zonaId === selectedZoneFilter
  );

  const handleRegisterBatch = (e: React.FormEvent) => {
    e.preventDefault();

    // Check RBAC
    const rbac = validateRbac(session, 'Registro', 'Almacenamiento');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Registro',
        false,
        rbac.reason,
        'Almacenamiento',
        null,
        ['Permiso denegado para registrar lote.']
      );
      onTriggerRbacBlock(resp);
      return;
    }

    // Check sanitary compatibility
    const compat = checkSanitaryZoneCompatibility(newBatchName, newBatchZone);
    if (!compat.compatible) {
      alert(`VIOLACIÓN SANITARIA: ${compat.advertencia}`);
      return;
    }

    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + newBatchDaysLife);

    const newBatch: InventoryBatch = {
      id: `batch-${Date.now()}`,
      codigoLote: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      productoId: `prod-${Date.now()}`,
      productoNombre: newBatchName,
      zonaId: newBatchZone,
      cantidad: newBatchQty,
      unidad: newBatchUnit,
      fechaIngreso: today.toISOString().split('T')[0],
      fechaVencimiento: expiry.toISOString().split('T')[0],
      diasVidaUtil: newBatchDaysLife,
      estadoPeps: newBatchDaysLife <= 3 ? 'Prioridad_Despacho' : 'Optimo',
      proveedor: newBatchSupplier,
      temperaturaIngreso: newBatchTemp,
    };

    onAddBatch(newBatch);
    setShowAddForm(false);

    const resp = buildClicResponse(
      session,
      'Registro',
      true,
      null,
      'Almacenamiento',
      {
        lote_registrado: newBatch.codigoLote,
        producto: newBatch.productoNombre,
        zona: newBatch.zonaId,
        metodologia_peps: 'Primeras Entradas, Primeras Salidas asignado',
        dias_vida_util: newBatch.diasVidaUtil,
      },
      [
        `Lote ${newBatch.codigoLote} ingresado en ${newBatch.zonaId}.`,
        'Asignado a rotación PEPS prioritaria según fecha de vencimiento.',
      ]
    );

    onLogAction(resp);
  };

  const handleAttemptDeleteBatch = (batch: InventoryBatch) => {
    const rbac = validateRbac(session, 'Anulacion', 'Almacenamiento');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Anulacion',
        false,
        rbac.reason,
        'Almacenamiento',
        { lote_id: batch.id, codigoLote: batch.codigoLote },
        [
          'BLOQUEO RBAC: Los Asesores no pueden dar de baja lotes de inventario.',
        ]
      );
      onTriggerRbacBlock(resp);
      return;
    }

    onDeleteBatch(batch.id);
    const resp = buildClicResponse(
      session,
      'Anulacion',
      true,
      null,
      'Almacenamiento',
      {
        lote_dado_de_baja: batch.codigoLote,
        administrador: session.usuario,
      },
      ['Lote eliminado de la bodega por el Administrador.']
    );
    onLogAction(resp);
  };

  const handleAttemptMoveZone = (
    batch: InventoryBatch,
    targetZoneId: SanitaryZoneId
  ) => {
    const rbac = validateRbac(session, 'Edicion', 'Almacenamiento');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Edicion',
        false,
        rbac.reason,
        'Almacenamiento',
        {
          lote_id: batch.id,
          zona_origen: batch.zonaId,
          zona_destino: targetZoneId,
        },
        [
          'RECHAZO RBAC: La reubicación física de lotes requiere autorización de Administrador.',
        ]
      );
      onTriggerRbacBlock(resp);
      return;
    }

    // Sanitary compatibility check (Ballou)
    const compat = checkSanitaryZoneCompatibility(
      batch.productoNombre,
      targetZoneId
    );
    if (!compat.compatible) {
      const resp = buildClicResponse(
        session,
        'Edicion',
        false,
        `VIOLACIÓN SANITARIA (Ballou): ${compat.advertencia}`,
        'Almacenamiento',
        null,
        ['Operación cancelada para evitar contaminación cruzada de alimentos.']
      );
      onTriggerRbacBlock(resp);
      return;
    }

    onMoveBatchZone(batch.id, targetZoneId);
    const resp = buildClicResponse(
      session,
      'Edicion',
      true,
      null,
      'Almacenamiento',
      {
        lote: batch.codigoLote,
        nueva_zona: targetZoneId,
      },
      ['Lote reubicado en zona sanitaria conforme a normativa.']
    );
    onLogAction(resp);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Warehouse className="w-4 h-4" />
            <span>Módulo A &bull; Teoría de Ronald H. Ballou</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Almacenamiento, Zonificación Sanitaria & PEPS
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Zonificación física estricta en 4 cuadrantes para prevenir
            contaminación cruzada (cárnicos crudos vs cocidos vs químicos),
            control de cadena de frío y rotación FIFO / PEPS.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ingresar Lote de Entrada (PEPS)</span>
        </button>
      </div>

      {/* 4 Sanitary Zones Grid (Ballou) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((zone) => {
          const isColdZone = zone.id.includes('fria');
          return (
            <div
              key={zone.id}
              className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
                isColdZone
                  ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900 border-cyan-800/50'
                  : 'bg-gradient-to-b from-amber-950/30 to-slate-900 border-amber-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isColdZone
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {isColdZone ? 'Cadena de Frío' : 'Bodega Seca'}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-mono text-white">
                    <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{zone.temperaturaActual}°C</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white">{zone.nombre}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {zone.ubicacion}
                </p>

                <p className="text-[11px] text-slate-300/80 mt-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <strong className="text-slate-200">Protocolo Sanitario:</strong>{' '}
                  {zone.descripcionRiesgo}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Ocupación de Zona</span>
                  <span className="font-bold text-white">
                    {zone.capacidadUtilizada}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      zone.capacidadUtilizada > 80
                        ? 'bg-amber-500'
                        : isColdZone
                        ? 'bg-cyan-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${zone.capacidadUtilizada}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Batch Form (Collapsible) */}
      {showAddForm && (
        <form
          onSubmit={handleRegisterBatch}
          className="bg-slate-900 border border-cyan-800/50 rounded-2xl p-5 shadow-2xl animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>Registro de Lote de Mercancía con Protocolo PEPS</span>
            </h3>
            <span className="text-xs text-slate-400">
              Operador: <strong className="text-amber-300">{session.usuario}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Nombre del Producto
              </label>
              <input
                type="text"
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Zona Sanitaria de Destino
              </label>
              <select
                value={newBatchZone}
                onChange={(e) =>
                  setNewBatchZone(e.target.value as SanitaryZoneId)
                }
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="zona_fria_crudos">Zona Fría - Cárnicos Crudos</option>
                <option value="zona_fria_precocidos">
                  Zona Fría - Precocidos/Preparados
                </option>
                <option value="zona_seca_alimentos">Zona Seca - Alimentos</option>
                <option value="zona_seca_no_alimentaria">
                  Zona Seca - No Alimentaria
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Cantidad y Unidad
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newBatchQty}
                  onChange={(e) => setNewBatchQty(Number(e.target.value))}
                  className="w-2/3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
                <input
                  type="text"
                  value={newBatchUnit}
                  onChange={(e) => setNewBatchUnit(e.target.value)}
                  className="w-1/3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Días de Vida Útil Restantes
              </label>
              <input
                type="number"
                value={newBatchDaysLife}
                onChange={(e) => setNewBatchDaysLife(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Proveedor de Origen
              </label>
              <input
                type="text"
                value={newBatchSupplier}
                onChange={(e) => setNewBatchSupplier(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Temperatura al Ingreso (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={newBatchTemp}
                onChange={(e) => setNewBatchTemp(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg"
            >
              Registrar Lote en PEPS
            </button>
          </div>
        </form>
      )}

      {/* Asistente de Gestión de Almacenamiento Sanitario (Ronald H. Ballou) */}
      <SanitaryAssistantPanel
        session={session}
        onAddBatch={onAddBatch}
        onLogAction={onLogAction}
        onTriggerRbacBlock={onTriggerRbacBlock}
      />

      {/* PEPS (FIFO) Lot Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>
                Control PEPS (Primeras Entradas, Primeras Salidas) &bull; Días de Vida Útil
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Ordenados cronológicamente por vencimiento para garantizar despacho
              prioritario de los lotes más antiguos.
            </p>
          </div>

          {/* Zone filter */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] self-center">Zona:</span>
            {(
              [
                'TODAS',
                'zona_fria_crudos',
                'zona_fria_precocidos',
                'zona_seca_alimentos',
                'zona_seca_no_alimentaria',
              ] as const
            ).map((zid) => (
              <button
                key={zid}
                onClick={() => setSelectedZoneFilter(zid)}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                  selectedZoneFilter === zid
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {zid === 'TODAS'
                  ? 'Todas'
                  : zid === 'zona_fria_crudos'
                  ? 'Crudos'
                  : zid === 'zona_fria_precocidos'
                  ? 'Precocidos'
                  : zid === 'zona_seca_alimentos'
                  ? 'Seca Alimentos'
                  : 'Seca No Alim.'}
              </button>
            ))}
          </div>
        </div>

        {/* Table of Batches */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Lote / Producto</th>
                <th className="py-3 px-3">Zona Sanitaria</th>
                <th className="py-3 px-3">Stock</th>
                <th className="py-3 px-3">Ingreso &bull; Vencimiento</th>
                <th className="py-3 px-3">Vida Útil (PEPS)</th>
                <th className="py-3 px-3 text-right">Acciones RBAC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBatches.map((batch) => {
                const isUrgent = batch.diasVidaUtil <= 3;
                return (
                  <tr
                    key={batch.id}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-3">
                      <span className="font-mono text-amber-300 font-bold block text-[11px]">
                        {batch.codigoLote}
                      </span>
                      <span className="font-semibold text-white">
                        {batch.productoNombre}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {batch.proveedor}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 border border-slate-800 text-slate-300">
                        {batch.zonaId === 'zona_fria_crudos'
                          ? 'Zona Fría Crudos'
                          : batch.zonaId === 'zona_fria_precocidos'
                          ? 'Zona Fría Precocidos'
                          : batch.zonaId === 'zona_seca_alimentos'
                          ? 'Zona Seca Alimentos'
                          : 'Zona Seca No Alim.'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-white">
                        {batch.cantidad}
                      </span>{' '}
                      <span className="text-[11px] text-slate-400">
                        {batch.unidad}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[11px]">
                      <div>In: {batch.fechaIngreso}</div>
                      <div className="text-slate-400">
                        Venc: {batch.fechaVencimiento}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isUrgent
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {isUrgent
                            ? `Prioridad Despacho (${batch.diasVidaUtil}d)`
                            : `Óptimo (${batch.diasVidaUtil}d)`}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Move Zone (Simulates Cross Contamination & RBAC) */}
                        <button
                          onClick={() =>
                            handleAttemptMoveZone(
                              batch,
                              batch.zonaId === 'zona_fria_crudos'
                                ? 'zona_fria_precocidos'
                                : 'zona_fria_crudos'
                            )
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Simular Reubicación de Zona (Prueba Sanitaria Ballou & RBAC)"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete / Anular (RBAC restricted for Asesor) */}
                        <button
                          onClick={() => handleAttemptDeleteBatch(batch)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 hover:text-rose-200 transition"
                          title={
                            session.rol === 'Asesor'
                              ? 'PROHIBIDO PARA ASESOR: Solo Admin puede dar de baja'
                              : 'Dar de baja Lote'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
