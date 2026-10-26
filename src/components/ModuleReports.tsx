/**
 * ClicLogistics AI - Financial Reports & Supplier Analytics (Admin Only)
 * Clic Costillas - Cocina Oculta
 */
import React from 'react';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Lock,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';
import {
  UserSession,
  InventoryItem,
  SupplierReception,
  CustomerOrder,
} from '../types/logistics';
import { buildClicResponse } from '../services/logisticsEngine';

interface Props {
  session: UserSession;
  items: InventoryItem[];
  receptions: SupplierReception[];
  orders: CustomerOrder[];
  onSwitchToAdmin: () => void;
  onLogAction: (response: ReturnType<typeof buildClicResponse>) => void;
}

export const ModuleReports: React.FC<Props> = ({
  session,
  items,
  receptions,
  orders,
  onSwitchToAdmin,
  onLogAction,
}) => {
  const isAdmin = session.rol === 'Administrador';

  // Financial aggregates
  const totalInventoryValue = items.reduce(
    (acc, i) => acc + i.valorTotalStock,
    0
  );
  const totalSalesRevenue = orders.reduce((acc, o) => acc + o.total, 0);

  // Supplier metrics
  const totalReceptions = receptions.length;
  const otifPassed = receptions.filter((r) => r.otifAprobado).length;
  const otifRate = totalReceptions
    ? Math.round((otifPassed / totalReceptions) * 100)
    : 100;

  // If Asesor attempts to view restricted financial reports
  if (!isAdmin) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto my-12 space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-mono">
            Control de Seguridad RBAC
          </span>
          <h2 className="text-xl font-bold text-white mt-2">
            Módulo Reservado para Administrador
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            El rol <strong className="text-cyan-300">"Asesor"</strong> tiene
            privilegios estrictamente operativos (registro de ventas, conteos y
            recepción). Los reportes de valoración económica y métricas de
            proveedores requieren autorización gerencial.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onSwitchToAdmin}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition"
          >
            Autenticarse como Administrador (admin_clic)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Módulo Gerencial &bull; Acceso Total Administrador</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Reportes Financieros & Métricas Estratégicas de Proveedores
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Visión holística de costos de inventario, márgenes de ventas de
            ahumados al cilindro y desempeño de la cadena de suministro bajo
            parámetros formalizados.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-950/60 p-2.5 rounded-xl border border-purple-800/60 text-xs">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-purple-200 font-semibold">
            Autorizado como Administrador
          </span>
        </div>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Valoración Total Inventario
          </span>
          <div className="text-xl font-black text-white mt-1">
            ${totalInventoryValue.toLocaleString()} COP
          </div>
          <span className="text-[10px] text-purple-400 font-medium">
            80% concentrado en Clase A
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Ventas Registradas Domicilio
          </span>
          <div className="text-xl font-black text-white mt-1">
            ${totalSalesRevenue.toLocaleString()} COP
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">
            {orders.length} pedidos procesados hoy
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Tasa Global OTIF Proveedores
          </span>
          <div className="text-xl font-black text-white mt-1">{otifRate}%</div>
          <span className="text-[10px] text-amber-400 font-medium">
            {otifPassed} recepciones óptimas
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            SLA Cumplimiento Despacho
          </span>
          <div className="text-xl font-black text-white mt-1">94.2%</div>
          <span className="text-[10px] text-cyan-400 font-medium">
            Ventana 50 min (30m prep / 20m ruta)
          </span>
        </div>
      </div>

      {/* Supplier Performance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Truck className="w-4 h-4 text-purple-400" />
          <span>Ranking y Cumplimiento de Proveedores de la Cadena</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Proveedor</th>
                <th className="py-3 px-3">Insumo Principal</th>
                <th className="py-3 px-3">Cumplimiento Horario</th>
                <th className="py-3 px-3">Control Temperatura</th>
                <th className="py-3 px-3">Estado Comercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white">
                  Carnes del Valle SAS
                </td>
                <td className="py-3 px-3">Costilla de Cerdo Cruda (St. Louis)</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">
                  100% On-Time
                </td>
                <td className="py-3 px-3 text-cyan-400 font-mono">
                  1.4°C &bull; Impecable
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    Proveedor Preferente A+
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white">
                  Agrícola del Oriente
                </td>
                <td className="py-3 px-3">Papa Capira & Plátano Verde</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">
                  96% On-Time
                </td>
                <td className="py-3 px-3 text-slate-400">Ambiente (18°C)</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    Calidad Conforme
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white">
                  Carbón & Briquetas El Fuego
                </td>
                <td className="py-3 px-3">Briquetas de Carbón de Coco</td>
                <td className="py-3 px-3 text-rose-400 font-semibold">
                  75% On-Time (Demoras)
                </td>
                <td className="py-3 px-3 text-slate-400">Bodega Seca</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    En Plan de Mejora
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
