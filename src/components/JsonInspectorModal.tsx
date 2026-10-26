/**
 * ClicLogistics AI - JSON Stream Inspector Modal
 * Displays the strict single JSON format required by ClicLogistics AI
 */
import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { ClicLogisticsResponse } from '../types/logistics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentResponse: ClicLogisticsResponse | null;
  responseHistory: ClicLogisticsResponse[];
  onSelectHistoryItem: (item: ClicLogisticsResponse) => void;
}

export const JsonInspectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentResponse,
  responseHistory,
  onSelectHistoryItem,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = currentResponse
    ? JSON.stringify(currentResponse, null, 2)
    : '{\n  "mensaje": "No hay eventos registrados aún"\n}';

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBlocked = currentResponse && !currentResponse.autorizacion.permitida;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Consola JSON en Tiempo Real (Formato Único de Salida)
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  Strict JSON Contract
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Auditoría y respuesta estructurada sin texto explicativo externo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Copiar JSON"
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
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* History Sidebar */}
          <div className="p-4 bg-slate-950/60 overflow-y-auto max-h-[350px] md:max-h-[600px] flex flex-col gap-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Registro de Eventos ({responseHistory.length})</span>
            </div>

            {responseHistory.map((item, idx) => {
              const active = item === currentResponse;
              const allowed = item.autorizacion.permitida;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectHistoryItem(item)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition flex flex-col gap-1 ${
                    active
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      {item.autorizacion.operacion_solicitada}
                    </span>
                    {allowed ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                        PERMITIDA
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono">
                        BLOQUEADA
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Módulo: {item.ejecucion_logistica.modulo}</span>
                    <span className="text-[10px] text-slate-500">
                      {item.control_sesion.rol}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main JSON Viewer */}
          <div className="md:col-span-2 p-5 flex flex-col overflow-hidden bg-slate-900/90">
            {/* Status bar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                {isBlocked ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-slate-300">
                  Operación:{' '}
                  <strong className="text-white">
                    {currentResponse?.autorizacion.operacion_solicitada || 'N/A'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  Usuario:{' '}
                  <span className="text-amber-300 font-mono">
                    {currentResponse?.control_sesion.usuario || 'Anónimo'}
                  </span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    currentResponse?.control_sesion.rol === 'Administrador'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : currentResponse?.control_sesion.rol === 'Asesor'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {currentResponse?.control_sesion.rol || 'Sin Rol'}
                </span>
              </div>
            </div>

            {/* Code container */}
            <div className="flex-1 overflow-auto rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-amber-200/90 leading-relaxed shadow-inner">
              <pre className="whitespace-pre">{jsonString}</pre>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              Estructura canónica validada según requerimientos de ClicLogistics AI
            </span>
          </div>
          <span className="text-slate-500 font-mono">RFC-8259 JSON</span>
        </div>
      </div>
    </div>
  );
};
