/**
 * ClicLogistics AI - Navigation Header & Operational Controls
 */
import React from 'react';
import {
  Flame,
  ShieldCheck,
  UserCheck,
  Calendar,
  Code2,
  PackageSearch,
  Warehouse,
  Boxes,
  Truck,
  DollarSign,
  BarChart3,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { UserSession, LogisticsModuleType } from '../types/logistics';

interface Props {
  session: UserSession;
  activeModule: LogisticsModuleType | 'Reportes';
  onSelectModule: (module: LogisticsModuleType | 'Reportes') => void;
  isWeekendActive: boolean;
  onToggleWeekend: () => void;
  onOpenAuthModal: () => void;
  onOpenJsonInspector: () => void;
  totalJsonEvents: number;
}

export const Header: React.FC<Props> = ({
  session,
  activeModule,
  onSelectModule,
  isWeekendActive,
  onToggleWeekend,
  onOpenAuthModal,
  onOpenJsonInspector,
  totalJsonEvents,
}) => {
  const isAdmin = session.rol === 'Administrador';

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-900">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Flame className="w-6 h-6 text-slate-950 fill-amber-950 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                ClicLogistics <span className="text-amber-400">AI</span>
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Clic Costillas
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cocina Oculta &bull; Ahumados al Cilindro Peruano &bull; Gestión Logística
            </p>
          </div>
        </div>

        {/* Operational toggles & User Session */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Weekend Factor 1.5x Toggle (Heizer, Render & Munson) */}
          <button
            onClick={onToggleWeekend}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              isWeekendActive
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Factor de ajuste Heizer & Render: 1.5x de demanda esperada para Viernes, Sábado y Domingo"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Fin de Semana (1.5x Demanda)</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                isWeekendActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isWeekendActive ? 'ACTIVO' : 'NORMAL'}
            </span>
          </button>

          {/* JSON Inspector trigger */}
          <button
            onClick={onOpenJsonInspector}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition"
            title="Ver Formato Único de Salida en JSON"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-sans font-medium text-slate-200">Consola JSON</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
              {totalJsonEvents}
            </span>
          </button>

          {/* Active Session & RBAC Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              onClick={onOpenAuthModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition ${
                isAdmin
                  ? 'bg-purple-950/60 border-purple-600/50 text-purple-200 hover:bg-purple-900/60'
                  : 'bg-cyan-950/60 border-cyan-600/50 text-cyan-200 hover:bg-cyan-900/60'
              }`}
            >
              {isAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <div className="text-left">
                <span className="font-bold text-white block leading-none">
                  {session.usuario || 'Sin sesión'}
                </span>
                <span className="text-[10px] opacity-80 leading-none">
                  Rol: {session.rol}
                </span>
              </div>
              <RefreshCw className="w-3 h-3 text-slate-400 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 text-xs font-semibold scrollbar-none">
          {/* Módulo D */}
          <button
            onClick={() => onSelectModule('Distribucion_WhatsApp')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition ${
              activeModule === 'Distribucion_WhatsApp'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Módulo D: Pedidos WhatsApp</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 opacity-80">
              Bowersox
            </span>
          </button>

          {/* Módulo A */}
          <button
            onClick={() => onSelectModule('Almacenamiento')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition ${
              activeModule === 'Almacenamiento'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            <span>Módulo A: Almacén & PEPS</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 opacity-80">
              Ballou
            </span>
          </button>

          {/* Módulo B */}
          <button
            onClick={() => onSelectModule('Inventario')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition ${
              activeModule === 'Inventario'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Módulo B: Inventario ABC & ROP</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 opacity-80">
              Heizer & Render
            </span>
          </button>

          {/* Módulo C */}
          <button
            onClick={() => onSelectModule('Proveedores')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition ${
              activeModule === 'Proveedores'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <PackageSearch className="w-4 h-4" />
            <span>Módulo C: Proveedores OTIF</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 opacity-80">
              Christopher
            </span>
          </button>

          {/* Cuadre de Caja */}
          <button
            onClick={() => onSelectModule('Cuadre_Caja')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition ${
              activeModule === 'Cuadre_Caja'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cuadre de Caja</span>
          </button>

          {/* Reportes Gerenciales */}
          <button
            onClick={() => onSelectModule('Reportes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition ${
              activeModule === 'Reportes'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reportes & Finanzas</span>
            {isAdmin && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-bold">
                ADMIN
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
