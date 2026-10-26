/**
 * ClicLogistics AI - RBAC Block Security Modal
 * Triggered when an Asesor attempts to EDIT or CANCEL/DELETE a record
 */
import React from 'react';
import { ShieldAlert, Lock, AlertTriangle, KeyRound, X } from 'lucide-react';
import { ClicLogisticsResponse } from '../types/logistics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  blockedResponse: ClicLogisticsResponse | null;
  onSwitchToAdmin: () => void;
}

export const RbacBlockModal: React.FC<Props> = ({
  isOpen,
  onClose,
  blockedResponse,
  onSwitchToAdmin,
}) => {
  if (!isOpen || !blockedResponse) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-rose-600/70 rounded-2xl shadow-[0_0_50px_rgba(225,29,72,0.25)] overflow-hidden">
        {/* Warning banner */}
        <div className="bg-rose-950/80 px-6 py-4 border-b border-rose-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-900/40">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                BLOQUEO DE SEGURIDAD RBAC
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-rose-900/80 text-rose-300 border border-rose-700">
                  Acceso Denegado
                </span>
              </h3>
              <p className="text-xs text-rose-300/80">
                Regla de integridad operativa para cocina oculta Clic Costillas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs leading-relaxed">
            <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">
                PROHIBICIÓN ESTRICTA PARA ROL ASESOR
              </p>
              <p className="mt-1 text-slate-300">
                {blockedResponse.autorizacion.motivo_bloqueo ||
                  'El rol Asesor tiene permisos de solo registro operativo y no puede EDITAR ni ANULAR ningún registro.'}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block mb-0.5">Operación Solicitada:</span>
              <span className="font-bold text-rose-400 uppercase">
                {blockedResponse.autorizacion.operacion_solicitada}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Usuario Activo:</span>
              <span className="font-semibold text-amber-300">
                {blockedResponse.control_sesion.usuario} ({blockedResponse.control_sesion.rol})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Módulo Afectado:</span>
              <span className="text-slate-200">
                {blockedResponse.ejecucion_logistica.modulo}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Estado Autorización:</span>
              <span className="text-rose-400 font-bold">RECHAZADA (permitida: false)</span>
            </div>
          </div>

          {/* Raw JSON snippet */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Respuesta JSON devuelta por el sistema:</span>
            </div>
            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-rose-300/90 overflow-x-auto max-h-36">
              {JSON.stringify(blockedResponse, null, 2)}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Entendido, Cerrar
          </button>

          <button
            onClick={() => {
              onClose();
              onSwitchToAdmin();
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 transition"
          >
            <KeyRound className="w-4 h-4" />
            <span>Ingresar como Administrador</span>
          </button>
        </div>
      </div>
    </div>
  );
};
