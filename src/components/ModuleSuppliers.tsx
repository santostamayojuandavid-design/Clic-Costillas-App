/**
 * MÓDULO C: CADENA DE SUMINISTRO Y PROVEEDORES (Martin Christopher)
 * Clic Costillas - Cocina Oculta
 */
import React, { useState } from 'react';
import {
  PackageSearch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ThermometerSnowflake,
  Clock,
  DollarSign,
  PlusCircle,
  FileText,
  Trash2,
  Edit,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { SupplierReception, UserSession } from '../types/logistics';
import {
  evaluateOtifReception,
  validateRbac,
  buildClicResponse,
} from '../services/logisticsEngine';

interface Props {
  session: UserSession;
  receptions: SupplierReception[];
  onAddReception: (reception: SupplierReception) => void;
  onDeleteReception: (receptionId: string) => void;
  onLogAction: (response: ReturnType<typeof buildClicResponse>) => void;
  onTriggerRbacBlock: (response: ReturnType<typeof buildClicResponse>) => void;
}

export const ModuleSuppliers: React.FC<Props> = ({
  session,
  receptions,
  onAddReception,
  onDeleteReception,
  onLogAction,
  onTriggerRbacBlock,
}) => {
  const [showNewReceptionForm, setShowNewReceptionForm] = useState(false);

  // Reception Form State
  const [proveedor, setProveedor] = useState('Carnes del Valle SAS');
  const [numeroGuia, setNumeroGuia] = useState('FAC-99201');
  const [aTiempo, setATiempo] = useState(true);
  const [cantidadPedida, setCantidadPedida] = useState(120);
  const [cantidadRecibida, setCantidadRecibida] = useState(120);
  const [unidad, setUnidad] = useState('kg Costilla Cruda St. Louis');
  const [temperatura, setTemperatura] = useState(1.8);
  const [isColdChainItem, setIsColdChainItem] = useState(true);
  const [precioPactado, setPrecioPactado] = useState(34000);
  const [precioFacturado, setPrecioFacturado] = useState(34000);
  const [observaciones, setObservaciones] = useState(
    'Recepción en muelle conforme a especificación.'
  );

  // Overall OTIF statistics
  const totalReceptions = receptions.length;
  const otifPassed = receptions.filter((r) => r.otifAprobado).length;
  const onTimeCount = receptions.filter((r) => r.aTiempo).length;
  const inFullCount = receptions.filter((r) => r.completo).length;
  const coldChainCount = receptions.filter((r) => r.cumpleCadenaFrio).length;

  const otifRate = totalReceptions
    ? Math.round((otifPassed / totalReceptions) * 100)
    : 100;
  const onTimeRate = totalReceptions
    ? Math.round((onTimeCount / totalReceptions) * 100)
    : 100;
  const inFullRate = totalReceptions
    ? Math.round((inFullCount / totalReceptions) * 100)
    : 100;

  const handleRegisterReception = (e: React.FormEvent) => {
    e.preventDefault();

    // Check RBAC: Registro
    const rbac = validateRbac(session, 'Recepcion_OTIF', 'Proveedores');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Recepcion_OTIF',
        false,
        rbac.reason,
        'Proveedores',
        null,
        ['Permisos insuficientes para registrar recepción.']
      );
      onTriggerRbacBlock(resp);
      return;
    }

    // Evaluate OTIF (Martin Christopher)
    const evalResult = evaluateOtifReception({
      aTiempo,
      cantidadPedida,
      cantidadRecibida,
      temperatura,
      isColdChainItem,
      precioPactado,
      precioFacturado,
    });

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newRec: SupplierReception = {
      id: `rec-${Date.now()}`,
      proveedorNombre: proveedor,
      numeroGuia,
      fechaHoraPactada: `${now.toISOString().split('T')[0]} 08:00 AM`,
      fechaHoraLlegada: formattedDate,
      aTiempo,
      cantidadPedida,
      cantidadRecibida,
      completo: evalResult.completo,
      unidad,
      temperaturaMedida: temperatura,
      cumpleCadenaFrio: evalResult.cumpleCadenaFrio,
      precioPactado,
      precioFacturado,
      precioConsistente: evalResult.precioConsistente,
      otifAprobado: evalResult.otifAprobado,
      observaciones,
      registradoPor: session.usuario || 'asesor_clic',
    };

    onAddReception(newRec);
    setShowNewReceptionForm(false);

    const resp = buildClicResponse(
      session,
      'Recepcion_OTIF',
      true,
      null,
      'Proveedores',
      {
        recepcion_id: newRec.id,
        proveedor: newRec.proveedorNombre,
        otif_global_aprobado: newRec.otifAprobado,
        on_time: newRec.aTiempo,
        in_full: newRec.completo,
        cadena_frio_conforme: newRec.cumpleCadenaFrio,
        temperatura_celsius: newRec.temperaturaMedida,
        precio_consistente: newRec.precioConsistente,
      },
      evalResult.alertas.length > 0
        ? evalResult.alertas
        : ['Recepción 100% conforme a indicadores OTIF de Christopher.']
    );

    onLogAction(resp);
  };

  const handleAttemptDelete = (rec: SupplierReception) => {
    const rbac = validateRbac(session, 'Anulacion', 'Proveedores');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Anulacion',
        false,
        rbac.reason,
        'Proveedores',
        { recepcion_id: rec.id, guia: rec.numeroGuia },
        [
          'BLOQUEO OPERATIVO: Los registros de recepción y auditoría de proveedores no pueden ser anulados por un Asesor.',
        ]
      );
      onTriggerRbacBlock(resp);
      return;
    }

    onDeleteReception(rec.id);
    const resp = buildClicResponse(
      session,
      'Anulacion',
      true,
      null,
      'Proveedores',
      {
        recepcion_anulada: rec.numeroGuia,
        autorizado_por: session.usuario,
      },
      ['Registro de recepción eliminado por el Administrador.']
    );
    onLogAction(resp);
  };

  const handleAttemptEdit = (rec: SupplierReception) => {
    const rbac = validateRbac(session, 'Edicion', 'Proveedores');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Edicion',
        false,
        rbac.reason,
        'Proveedores',
        { recepcion_id: rec.id },
        [
          'BLOQUEO RBAC: Modificar una auditoría de recepción requiere perfil de Administrador.',
        ]
      );
      onTriggerRbacBlock(resp);
      return;
    }

    alert('Edición de recepción habilitada para Administrador.');
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <PackageSearch className="w-4 h-4" />
            <span>Módulo C &bull; Teoría de Martin Christopher</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Cadena de Suministro & Evaluación OTIF de Proveedores
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Control integral On-Time In-Full (Puntualidad en entrega, cantidades
            completas, control estricto de temperatura de cadena de frío y
            consistencia comercial pactada).
          </p>
        </div>

        <button
          onClick={() => setShowNewReceptionForm(!showNewReceptionForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Recepción de Mercancía (OTIF)</span>
        </button>
      </div>

      {/* OTIF Key Performance Indicators (Christopher) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall OTIF */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Índice General OTIF
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {otifRate}%
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">
              {otifPassed} de {totalReceptions} entregas conformes
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* On Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Puntualidad (On-Time)
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {onTimeRate}%
            </div>
            <span className="text-[10px] text-cyan-400 font-medium">
              Ventana horaria de descarga
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* In Full */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Cumplimiento (In-Full)
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {inFullRate}%
            </div>
            <span className="text-[10px] text-amber-400 font-medium">
              Cantidades según orden compra
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Cold Chain Integrity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Cadena de Frío (&le; 4.0°C)
            </span>
            <div className="text-2xl font-black text-white mt-0.5">100%</div>
            <span className="text-[10px] text-blue-400 font-medium">
              Inocuidad cárnica auditada
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <ThermometerSnowflake className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* New Reception Form (Collapsible) */}
      {showNewReceptionForm && (
        <form
          onSubmit={handleRegisterReception}
          className="bg-slate-900 border border-emerald-600/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>
                Auditoría de Recepción en Muelle &bull; Verificación OTIF
              </span>
            </h3>
            <span className="text-xs text-slate-400">
              Registrado por:{' '}
              <strong className="text-amber-300">{session.usuario}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Proveedor
              </label>
              <select
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Carnes del Valle SAS">Carnes del Valle SAS</option>
                <option value="Carbón & Briquetas El Fuego">
                  Carbón & Briquetas El Fuego
                </option>
                <option value="Agrícola del Oriente">Agrícola del Oriente</option>
                <option value="Empaques Ecológicos del Pacífico">
                  Empaques Ecológicos del Pacífico
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Número de Factura / Guía
              </label>
              <input
                type="text"
                value={numeroGuia}
                onChange={(e) => setNumeroGuia(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                ¿Llegó Dentro de la Ventana Horaria (On-Time)?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setATiempo(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    aTiempo
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  Sí (A Tiempo)
                </button>
                <button
                  type="button"
                  onClick={() => setATiempo(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    !aTiempo
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  No (Retraso)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Cantidad Pedida vs Recibida (In-Full)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={cantidadPedida}
                  onChange={(e) => setCantidadPedida(Number(e.target.value))}
                  placeholder="Pedida"
                  className="w-1/2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
                <input
                  type="number"
                  value={cantidadRecibida}
                  onChange={(e) => setCantidadRecibida(Number(e.target.value))}
                  placeholder="Recibida"
                  className="w-1/2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Temperatura Medida Sensor Muelle (°C)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={temperatura}
                  onChange={(e) => setTemperatura(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
                <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-slate-400">
                  <input
                    type="checkbox"
                    checked={isColdChainItem}
                    onChange={(e) => setIsColdChainItem(e.target.checked)}
                    className="rounded"
                  />
                  <span>Es Cárnico (&le;4°C)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Precio Pactado vs Facturado
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={precioPactado}
                  onChange={(e) => setPrecioPactado(Number(e.target.value))}
                  className="w-1/2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
                <input
                  type="number"
                  value={precioFacturado}
                  onChange={(e) => setPrecioFacturado(Number(e.target.value))}
                  className="w-1/2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-slate-300 mb-1 font-medium">
                Observaciones y Novedades de Descarga
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowNewReceptionForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg"
            >
              Evaluar y Guardar Recepción
            </button>
          </div>
        </form>
      )}

      {/* Historical Receptions Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Histórico de Recepciones y Auditorías OTIF</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Registro inmutable de cumplimiento de proveedores con validación de
            tiempos, mermas y temperatura.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Proveedor / Guía</th>
                <th className="py-3 px-3">Fecha & Ventana</th>
                <th className="py-3 px-3">Puntualidad</th>
                <th className="py-3 px-3">Cantidades (In-Full)</th>
                <th className="py-3 px-3">Cadena Frío</th>
                <th className="py-3 px-3">Precios</th>
                <th className="py-3 px-3">Dictamen OTIF</th>
                <th className="py-3 px-3 text-right">Acciones RBAC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {receptions.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <span className="font-bold text-white block">
                      {rec.proveedorNombre}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Guía: {rec.numeroGuia} &bull; Reg: {rec.registradoPor}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-[11px]">
                    <div>{rec.fechaHoraLlegada}</div>
                    <div className="text-slate-400">
                      Pactada: {rec.fechaHoraPactada}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {rec.aTiempo ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        On-Time
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                        Retraso
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200">
                      {rec.cantidadRecibida} / {rec.cantidadPedida}
                    </div>
                    <div className="text-[10px] text-slate-400">{rec.unidad}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div
                      className={`font-mono text-xs font-bold ${
                        rec.cumpleCadenaFrio
                          ? 'text-cyan-400'
                          : 'text-rose-400 animate-pulse'
                      }`}
                    >
                      {rec.temperaturaMedida}°C
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {rec.cumpleCadenaFrio ? 'Conforme' : 'PELIGRO'}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {rec.precioConsistente ? (
                      <span className="text-emerald-400 font-semibold">
                        ${rec.precioFacturado.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold">
                        ${rec.precioFacturado.toLocaleString()} (Discrepancia)
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {rec.otifAprobado ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        OTIF APROBADO
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        NO CONFORME
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAttemptEdit(rec)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title={
                          session.rol === 'Asesor'
                            ? 'PROHIBIDO PARA ASESOR: Solo Admin puede editar recepción'
                            : 'Editar Auditoría'
                        }
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleAttemptDelete(rec)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 hover:text-rose-200 transition"
                        title={
                          session.rol === 'Asesor'
                            ? 'PROHIBIDO PARA ASESOR: Solo Admin puede anular'
                            : 'Anular Recepción'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
