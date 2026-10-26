/**
 * ClicLogistics AI - Cuadre de Caja & Turno Operativo
 * Clic Costillas - Cocina Oculta
 */
import React, { useState } from 'react';
import {
  DollarSign,
  Receipt,
  CreditCard,
  MinusCircle,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { CashShiftRecord, UserSession } from '../types/logistics';
import { validateRbac, buildClicResponse } from '../services/logisticsEngine';

interface Props {
  session: UserSession;
  shiftData: CashShiftRecord;
  onUpdateShift: (updated: CashShiftRecord) => void;
  onLogAction: (response: ReturnType<typeof buildClicResponse>) => void;
  onTriggerRbacBlock: (response: ReturnType<typeof buildClicResponse>) => void;
}

export const ModuleCashRegister: React.FC<Props> = ({
  session,
  shiftData,
  onUpdateShift,
  onLogAction,
  onTriggerRbacBlock,
}) => {
  const [baseInicial, setBaseInicial] = useState(shiftData.baseInicial);
  const [ventasEfectivo, setVentasEfectivo] = useState(shiftData.ventasEfectivo);
  const [ventasElectronicas, setVentasElectronicas] = useState(
    shiftData.ventasElectronicas
  );
  const [gastosOperativos, setGastosOperativos] = useState(
    shiftData.gastosOperativos
  );
  const [efectivoRealContado, setEfectivoRealContado] = useState(
    shiftData.efectivoRealContado
  );
  const [observaciones, setObservaciones] = useState(shiftData.observaciones);

  const saldoEsperado = baseInicial + ventasEfectivo - gastosOperativos;
  const diferencia = efectivoRealContado - saldoEsperado;

  let estadoCuadre: 'Cuadrado' | 'Faltante' | 'Sobrante' = 'Cuadrado';
  if (diferencia < 0) estadoCuadre = 'Faltante';
  else if (diferencia > 0) estadoCuadre = 'Sobrante';

  const handleCierreCaja = (e: React.FormEvent) => {
    e.preventDefault();

    // RBAC Check for Cuadre_Caja
    const rbac = validateRbac(session, 'Cuadre_Caja', 'Cuadre_Caja');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Cuadre_Caja',
        false,
        rbac.reason,
        'Cuadre_Caja',
        null,
        ['No autorizado para ejecutar cierre de caja.']
      );
      onTriggerRbacBlock(resp);
      return;
    }

    const updated: CashShiftRecord = {
      ...shiftData,
      baseInicial,
      ventasEfectivo,
      ventasElectronicas,
      gastosOperativos,
      saldoEsperadoEfectivo: saldoEsperado,
      efectivoRealContado,
      diferencia,
      estado: estadoCuadre,
      observaciones,
      asesor: session.usuario || 'asesor_clic',
    };

    onUpdateShift(updated);

    const resp = buildClicResponse(
      session,
      'Cuadre_Caja',
      true,
      null,
      'Cuadre_Caja',
      {
        turno_id: updated.id,
        fecha: updated.fecha,
        responsable: updated.asesor,
        base_inicial: updated.baseInicial,
        ventas_efectivo: updated.ventasEfectivo,
        ventas_electronicas: updated.ventasElectronicas,
        gastos_turno: updated.gastosOperativos,
        saldo_esperado: updated.saldoEsperadoEfectivo,
        efectivo_contado: updated.efectivoRealContado,
        diferencia: updated.diferencia,
        dictamen_caja: updated.estado,
      },
      [
        `Cuadre de caja registrado exitosamente por ${session.usuario}.`,
        diferencia === 0
          ? 'Caja cuadrada sin diferencias.'
          : `Alerta financiera: ${diferencia < 0 ? 'Faltante' : 'Sobrante'} de $${Math.abs(diferencia).toLocaleString()} COP.`,
      ]
    );

    onLogAction(resp);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            <span>Módulo Operativo &bull; Control Financiero de Turno</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Cuadre de Caja & Arqueo de Ventas
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Conciliación de base en efectivo, ventas presenciales/domicilios en
            efectivo, transacciones electrónicas (Nequi/Daviplata/Datafono) y
            gastos menores de cocina.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Responsable Turno:</span>
          <span className="font-bold text-amber-400">{session.usuario}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            {session.rol}
          </span>
        </div>
      </div>

      {/* Cash Reconciliation Form & Live Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Ingreso de Movimientos de Turno</span>
          </h3>

          <form onSubmit={handleCierreCaja} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Base Inicial de Caja (Apertura)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={baseInicial}
                    onChange={(e) => setBaseInicial(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Ventas en Efectivo del Turno
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={ventasEfectivo}
                    onChange={(e) => setVentasEfectivo(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Ventas Electrónicas (Nequi / Daviplata / Datáfono)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={ventasElectronicas}
                    onChange={(e) =>
                      setVentasElectronicas(Number(e.target.value))
                    }
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Gastos Menores / Salidas de Turno
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={gastosOperativos}
                    onChange={(e) =>
                      setGastosOperativos(Number(e.target.value))
                    }
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-200 font-bold text-sm mb-1">
                Efectivo Real Físico Contado en el Cajón:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-emerald-400 font-black text-base">
                  $
                </span>
                <input
                  type="number"
                  value={efectivoRealContado}
                  onChange={(e) =>
                    setEfectivoRealContado(Number(e.target.value))
                  }
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border-2 border-emerald-500/40 text-emerald-300 text-base font-mono font-bold focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Observaciones del Arqueo
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Sin novedades, billetes ordenados..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registrar Cuadre & Generar Reporte JSON</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Arqueo Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-3 pb-2 border-b border-slate-800">
              Resumen Financiero del Cuadre
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>(+) Base Inicial:</span>
                <span className="font-mono text-white">
                  ${baseInicial.toLocaleString()} COP
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>(+) Ventas Efectivo:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  +${ventasEfectivo.toLocaleString()} COP
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>(-) Gastos de Turno:</span>
                <span className="font-mono text-rose-400 font-semibold">
                  -${gastosOperativos.toLocaleString()} COP
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                <span>(=) Saldo Teórico Esperado:</span>
                <span className="font-mono text-amber-300 text-sm">
                  ${saldoEsperado.toLocaleString()} COP
                </span>
              </div>

              <div className="flex justify-between font-bold text-white">
                <span>Efectivo Físico Contado:</span>
                <span className="font-mono text-emerald-300 text-sm">
                  ${efectivoRealContado.toLocaleString()} COP
                </span>
              </div>
            </div>
          </div>

          {/* Difference Badge */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              diferencia === 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : diferencia > 0
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold block">
                Estado del Cuadre
              </span>
              <span className="text-base font-black">
                {diferencia === 0
                  ? 'Caja Exacta / Cuadrada'
                  : diferencia > 0
                  ? `Sobrante de Dinero`
                  : `Faltante de Dinero`}
              </span>
            </div>
            <div className="text-right font-mono font-bold text-lg">
              {diferencia > 0 && '+'}
              ${diferencia.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
