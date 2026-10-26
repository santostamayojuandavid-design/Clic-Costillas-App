/**
 * MÓDULO B: ADMINISTRACIÓN DE INVENTARIOS (Heizer, Render & Munson)
 * Clic Costillas - Cocina Oculta
 */
import React, { useState } from 'react';
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Sliders,
  Sparkles,
  ClipboardCheck,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  InventoryItem,
  UserSession,
  AbcCategory,
} from '../types/logistics';
import {
  recalculateItemRop,
  validateRbac,
  buildClicResponse,
} from '../services/logisticsEngine';

interface Props {
  session: UserSession;
  items: InventoryItem[];
  isWeekendActive: boolean;
  onUpdateCount: (itemId: string, physicalCount: number) => void;
  onUpdateItemParams: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onLogAction: (response: ReturnType<typeof buildClicResponse>) => void;
  onTriggerRbacBlock: (response: ReturnType<typeof buildClicResponse>) => void;
}

export const ModuleInventory: React.FC<Props> = ({
  session,
  items,
  isWeekendActive,
  onUpdateCount,
  onUpdateItemParams,
  onDeleteItem,
  onLogAction,
  onTriggerRbacBlock,
}) => {
  const [selectedAbcFilter, setSelectedAbcFilter] = useState<
    'TODOS' | AbcCategory
  >('TODOS');

  // Physical count modal state
  const [countingItemId, setCountingItemId] = useState<string | null>(null);
  const [countInput, setCountInput] = useState<number>(0);

  // Totals for ABC analysis
  const totalValuation = items.reduce(
    (acc, item) => acc + item.valorTotalStock,
    0
  );
  const valCatA = items
    .filter((i) => i.categoriaAbc === 'A')
    .reduce((acc, i) => acc + i.valorTotalStock, 0);
  const valCatB = items
    .filter((i) => i.categoriaAbc === 'B')
    .reduce((acc, i) => acc + i.valorTotalStock, 0);
  const valCatC = items
    .filter((i) => i.categoriaAbc === 'C')
    .reduce((acc, i) => acc + i.valorTotalStock, 0);

  const pctA = totalValuation ? Math.round((valCatA / totalValuation) * 100) : 80;
  const pctB = totalValuation ? Math.round((valCatB / totalValuation) * 100) : 15;
  const pctC = totalValuation ? Math.round((valCatC / totalValuation) * 100) : 5;

  const filteredItems = items.filter((i) =>
    selectedAbcFilter === 'TODOS' ? true : i.categoriaAbc === selectedAbcFilter
  );

  // Submit physical count (Allowed for Asesor)
  const handleSavePhysicalCount = (item: InventoryItem) => {
    const rbac = validateRbac(session, 'Registro', 'Inventario');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Registro',
        false,
        rbac.reason,
        'Inventario',
        null,
        ['No autorizado para registrar conteo de inventario.']
      );
      onTriggerRbacBlock(resp);
      return;
    }

    onUpdateCount(item.id, countInput);
    setCountingItemId(null);

    const diff = countInput - item.stockActual;
    const resp = buildClicResponse(
      session,
      'Registro',
      true,
      null,
      'Inventario',
      {
        articulo: item.nombre,
        stock_teorico: item.stockActual,
        conteo_fisico: countInput,
        diferencia: diff,
        ajuste_requerido: diff !== 0,
      },
      [
        `Conteo físico registrado por ${session.usuario}.`,
        diff !== 0
          ? `Alerta de descuadre: ${diff > 0 ? '+' : ''}${diff} ${item.unidad}`
          : 'Inventario físico coincide al 100% con el sistema teórico.',
      ]
    );
    onLogAction(resp);
  };

  // Attempt to edit item base parameters (ROP, Lead Time, Security Stock)
  const handleAttemptEditItem = (item: InventoryItem) => {
    const rbac = validateRbac(session, 'Edicion', 'Inventario');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Edicion',
        false,
        rbac.reason,
        'Inventario',
        { item_id: item.id, item_nombre: item.nombre },
        [
          'BLOQUEO RBAC: Los Asesores no pueden modificar parámetros de reorden ni costos de inventario.',
        ]
      );
      onTriggerRbacBlock(resp);
      return;
    }

    // Admin edit
    const newLeadTime = item.leadTimeDias + 1;
    const updated = {
      ...item,
      leadTimeDias: newLeadTime,
      puntoReordenNormal: recalculateItemRop(
        { ...item, leadTimeDias: newLeadTime },
        false
      ),
      puntoReordenFinDeSemana: recalculateItemRop(
        { ...item, leadTimeDias: newLeadTime },
        true
      ),
    };
    onUpdateItemParams(updated);

    const resp = buildClicResponse(
      session,
      'Edicion',
      true,
      null,
      'Inventario',
      {
        item_modificado: item.nombre,
        nuevo_lead_time_dias: newLeadTime,
        administrador: session.usuario,
      },
      ['Parámetros de inventario actualizados por el Administrador.']
    );
    onLogAction(resp);
  };

  // Attempt to delete item (Anulación)
  const handleAttemptDeleteItem = (item: InventoryItem) => {
    const rbac = validateRbac(session, 'Anulacion', 'Inventario');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Anulacion',
        false,
        rbac.reason,
        'Inventario',
        { item_id: item.id },
        [
          'BLOQUEO OPERATIVO: Solo el Administrador puede dar de baja artículos maestros.',
        ]
      );
      onTriggerRbacBlock(resp);
      return;
    }

    onDeleteItem(item.id);
    const resp = buildClicResponse(
      session,
      'Anulacion',
      true,
      null,
      'Inventario',
      { articulo_eliminado: item.nombre, admin: session.usuario },
      ['Artículo eliminado del catálogo de inventario.']
    );
    onLogAction(resp);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Boxes className="w-4 h-4" />
            <span>Módulo B &bull; Teoría de Heizer, Render & Munson</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Administración de Inventarios ABC & Puntos de Reorden (ROP)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Clasificación económica de Pareto (A=80%, B=15%, C=5%), cálculo
            dinámico de stock de seguridad y factor multiplicador de 1.5x de
            demanda en fin de semana para la cocina oculta.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="text-slate-400 block text-[10px]">
              Multiplicador Fin de Semana:
            </span>
            <span className="font-bold text-white">
              {isWeekendActive ? '1.5x Demanda ACTIVA' : '1.0x Demanda Regular'}
            </span>
          </div>
        </div>
      </div>

      {/* ABC Valuation Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category A */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                CATEGORÍA A (Alto Control)
              </span>
              <span className="text-xs font-bold text-white">{pctA}% Valor</span>
            </div>
            <h3 className="text-base font-black text-white">
              ${valCatA.toLocaleString()} COP
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Costillas de cerdo cruda / briquetas de carbón. Concentran el 80%
              del valor del inventario. Requieren conteo continuo y estricto.
            </p>
          </div>
          <div className="mt-3 text-[11px] text-purple-300 font-semibold bg-purple-950/40 p-2 rounded-lg border border-purple-800/40">
            Regla: Cero quiebres de stock tolerados
          </div>
        </div>

        {/* Category B */}
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                CATEGORÍA B (Control Medio)
              </span>
              <span className="text-xs font-bold text-white">{pctB}% Valor</span>
            </div>
            <h3 className="text-base font-black text-white">
              ${valCatB.toLocaleString()} COP
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Papas capira, plátanos verdes, aceite para freidora industrial.
              Representan el 15% del valor económico total.
            </p>
          </div>
          <div className="mt-3 text-[11px] text-blue-300 font-semibold bg-blue-950/40 p-2 rounded-lg border border-blue-800/40">
            Regla: Revisión semanal de reorden
          </div>
        </div>

        {/* Category C */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                CATEGORÍA C (Control Básico)
              </span>
              <span className="text-xs font-bold text-white">{pctC}% Valor</span>
            </div>
            <h3 className="text-base font-black text-white">
              ${valCatC.toLocaleString()} COP
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Cajas térmicas kraft, salsas individuales, servilletas impresas,
              vasos 2oz. Representan ~5% del valor monetario total.
            </p>
          </div>
          <div className="mt-3 text-[11px] text-emerald-300 font-semibold bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
            Regla: Pedidos por lote económico (EOQ)
          </div>
        </div>
      </div>

      {/* Inventory & ROP Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>
                Cálculo de Punto de Reorden (ROP) & Stock de Seguridad
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              ROP = (Demanda Diaria &times; Lead Time) + Stock de Seguridad &bull;{' '}
              {isWeekendActive
                ? 'Multiplicador 1.5x Aplicado a Viernes, Sábado y Domingo'
                : 'Demanda de días entre semana'}
            </p>
          </div>

          {/* Filter by Category */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Categoría ABC:</span>
            {(['TODOS', 'A', 'B', 'C'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedAbcFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  selectedAbcFilter === cat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat === 'TODOS' ? 'Todos' : `Cat. ${cat}`}
              </button>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Artículo / Cat. ABC</th>
                <th className="py-3 px-3">Stock Actual</th>
                <th className="py-3 px-3">Demanda Diaria</th>
                <th className="py-3 px-3">Lead Time &bull; Seguridad</th>
                <th className="py-3 px-3">Punto Reorden (ROP)</th>
                <th className="py-3 px-3">Estado Operativo</th>
                <th className="py-3 px-3 text-right">Acciones RBAC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((item) => {
                const activeRop = isWeekendActive
                  ? item.puntoReordenFinDeSemana
                  : item.puntoReordenNormal;

                const isBelowSafety = item.stockActual <= item.stockSeguridad;
                const isBelowRop = item.stockActual <= activeRop;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            item.categoriaAbc === 'A'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : item.categoriaAbc === 'B'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {item.categoriaAbc}
                        </span>
                        <div>
                          <span className="font-semibold text-white block">
                            {item.nombre}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Costo: ${item.costoUnitario.toLocaleString()} COP / {item.unidad}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-sm font-black text-white">
                        {item.stockActual}
                      </span>{' '}
                      <span className="text-[11px] text-slate-400">
                        {item.unidad}
                      </span>
                      {item.conteoFisicoRegistrado !== undefined && (
                        <span className="block text-[10px] text-emerald-400">
                          Último conteo: {item.conteoFisicoRegistrado}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-200">
                        {isWeekendActive
                          ? (item.demandaDiariaBase * 1.5).toFixed(1)
                          : item.demandaDiariaBase}{' '}
                        {item.unidad}/día
                      </span>
                      {isWeekendActive && (
                        <span className="block text-[9px] text-amber-400 font-bold">
                          (+50% Fin de Semana)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-[11px]">
                      <div>{item.leadTimeDias} días proveedor</div>
                      <div className="text-slate-400">
                        Mínimo Seg: {item.stockSeguridad} {item.unidad}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-amber-300 text-sm">
                        {activeRop} {item.unidad}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Dispara orden de compra
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {isBelowSafety ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 w-fit animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          Riesgo Quiebre Stock
                        </span>
                      ) : isBelowRop ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Reorden Necesario
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Stock Saludable
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Conteo Físico (Permitido para Asesor) */}
                        <button
                          onClick={() => {
                            setCountingItemId(item.id);
                            setCountInput(item.stockActual);
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition"
                          title="Ingresar conteo físico del turno (Asesor & Admin)"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>Contar</span>
                        </button>

                        {/* Edit Parameters (Admin Only - Triggers RBAC block for Asesor) */}
                        <button
                          onClick={() => handleAttemptEditItem(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title={
                            session.rol === 'Asesor'
                              ? 'PROHIBIDO PARA ASESOR: Solo Admin puede editar parámetros'
                              : 'Modificar Lead Time / ROP'
                          }
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete / Anular (Admin Only) */}
                        <button
                          onClick={() => handleAttemptDeleteItem(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 hover:text-rose-200 transition"
                          title={
                            session.rol === 'Asesor'
                              ? 'PROHIBIDO PARA ASESOR: Solo Admin puede eliminar'
                              : 'Eliminar Artículo'
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

      {/* Modal for Physical Count */}
      {countingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                <span>Ingreso de Conteo Físico</span>
              </h3>
              <span className="text-[10px] text-slate-400">
                Rol: {session.rol}
              </span>
            </div>

            {items
              .filter((i) => i.id === countingItemId)
              .map((targetItem) => (
                <div key={targetItem.id} className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 block">Artículo:</span>
                    <span className="font-bold text-white text-sm">
                      {targetItem.nombre}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        Stock Teórico:
                      </span>
                      <span className="font-bold text-white">
                        {targetItem.stockActual} {targetItem.unidad}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        Categoría ABC:
                      </span>
                      <span className="font-bold text-purple-300">
                        Clase {targetItem.categoriaAbc}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Cantidad Física Contada en Cocina:
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={countInput}
                      onChange={(e) => setCountInput(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCountingItemId(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePhysicalCount(targetItem)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                    >
                      Guardar Conteo
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
