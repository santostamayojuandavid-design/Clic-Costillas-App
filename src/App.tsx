/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserSession,
  LogisticsModuleType,
  ClicLogisticsResponse,
  CustomerOrder,
  InventoryBatch,
  InventoryItem,
  SupplierReception,
  CashShiftRecord,
  OrderStatus,
  SanitaryZoneId,
} from './types/logistics';
import {
  INITIAL_SANITARY_ZONES,
  INITIAL_BATCHES,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_SUPPLIER_RECEPTIONS,
  INITIAL_ORDERS,
  INITIAL_CASH_SHIFT,
} from './data/mockData';
import {
  VALID_CREDENTIALS,
  buildClicResponse,
  recalculateItemRop,
} from './services/logisticsEngine';

import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { JsonInspectorModal } from './components/JsonInspectorModal';
import { RbacBlockModal } from './components/RbacBlockModal';
import { ModuleOrders } from './components/ModuleOrders';
import { ModuleStorage } from './components/ModuleStorage';
import { ModuleInventory } from './components/ModuleInventory';
import { ModuleSuppliers } from './components/ModuleSuppliers';
import { ModuleCashRegister } from './components/ModuleCashRegister';
import { ModuleReports } from './components/ModuleReports';

import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  Code2,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function App() {
  // Session State - starts with Administrator for rich initial view
  const [session, setSession] = useState<UserSession>({
    autenticado: true,
    usuario: VALID_CREDENTIALS.admin.usuario,
    rol: 'Administrador',
    nombre: VALID_CREDENTIALS.admin.nombre,
  });

  // Active Navigation Module
  const [activeModule, setActiveModule] = useState<
    LogisticsModuleType | 'Reportes'
  >('Distribucion_WhatsApp');

  // Weekend Adjustment Factor (1.5x)
  const [isWeekendActive, setIsWeekendActive] = useState<boolean>(true);

  // Application Data States
  const [zones] = useState(INITIAL_SANITARY_ZONES);
  const [batches, setBatches] = useState<InventoryBatch[]>(INITIAL_BATCHES);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(
    INITIAL_INVENTORY_ITEMS
  );
  const [receptions, setReceptions] = useState<SupplierReception[]>(
    INITIAL_SUPPLIER_RECEPTIONS
  );
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS);
  const [cashShift, setCashShift] =
    useState<CashShiftRecord>(INITIAL_CASH_SHIFT);

  // JSON Stream & History (Strict Output Format)
  const [jsonHistory, setJsonHistory] = useState<ClicLogisticsResponse[]>([
    buildClicResponse(
      {
        autenticado: true,
        usuario: 'admin_clic',
        rol: 'Administrador',
      },
      'Login',
      true,
      null,
      'Almacenamiento',
      {
        sistema: 'ClicLogistics AI',
        cocina_oculta: 'Clic Costillas (Ahumados al Cilindro Peruano)',
        zonas_sanitarias_activas: 4,
        articulos_inventario: INITIAL_INVENTORY_ITEMS.length,
        pedidos_activos: INITIAL_ORDERS.length,
        politica_fin_de_semana_1_5x: true,
      },
      [
        'Sesión iniciada con privilegios totales de Administrador.',
        'Zonificación sanitaria Ronald H. Ballou operativa.',
        'Parámetros ABC y ROP Heizer & Render calculados con factor 1.5x.',
      ]
    ),
  ]);

  const [currentResponse, setCurrentResponse] =
    useState<ClicLogisticsResponse | null>(jsonHistory[0]);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [blockedRbacResponse, setBlockedRbacResponse] =
    useState<ClicLogisticsResponse | null>(null);

  // Helper to log a new JSON response
  const handleLogAction = (resp: ClicLogisticsResponse) => {
    setJsonHistory((prev) => [resp, ...prev]);
    setCurrentResponse(resp);
  };

  // Helper to trigger RBAC block
  const handleTriggerRbacBlock = (resp: ClicLogisticsResponse) => {
    handleLogAction(resp);
    setBlockedRbacResponse(resp);
  };

  // Quick switch between Admin and Asesor for easy evaluation
  const handleQuickSwitchRole = (newRole: 'Administrador' | 'Asesor') => {
    const creds =
      newRole === 'Administrador'
        ? VALID_CREDENTIALS.admin
        : VALID_CREDENTIALS.asesor;
    const newSession: UserSession = {
      autenticado: true,
      usuario: creds.usuario,
      rol: creds.rol,
      nombre: creds.nombre,
    };
    setSession(newSession);

    const resp = buildClicResponse(
      newSession,
      'Login',
      true,
      null,
      activeModule === 'Reportes' ? 'Inventario' : activeModule,
      {
        usuario: newSession.usuario,
        rol: newSession.rol,
        privilegios:
          newRole === 'Administrador'
            ? 'Acceso TOTAL (Edición, Anulación, Reportes)'
            : 'Acceso OPERATIVO (Prohibido Editar o Anular)',
      },
      [`Cambio de contexto a rol: ${newRole}`]
    );
    handleLogAction(resp);
  };

  // Toggle Weekend factor
  const handleToggleWeekend = () => {
    const nextState = !isWeekendActive;
    setIsWeekendActive(nextState);

    // Recalculate ROPs across inventory
    const updated = inventoryItems.map((item) => ({
      ...item,
      puntoReordenFinDeSemana: recalculateItemRop(item, true),
      puntoReordenNormal: recalculateItemRop(item, false),
    }));
    setInventoryItems(updated);

    const resp = buildClicResponse(
      session,
      'Edicion',
      true,
      null,
      'Inventario',
      {
        factor_ajuste_fin_de_semana: nextState ? '1.5x Demanda' : '1.0x Normal',
        vigencia: 'Viernes, Sábado y Domingo (Heizer & Render)',
      },
      [
        nextState
          ? 'Factor 1.5x activado: Puntos de Reorden (ROP) recalculados para alta demanda de fin de semana.'
          : 'Factor fin de semana desactivado: Puntos de Reorden en parámetros de entre semana.',
      ]
    );
    handleLogAction(resp);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Quick Role Switcher Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">
            Conmutador de Roles RBAC:
          </span>
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => handleQuickSwitchRole('Administrador')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                session.rol === 'Administrador'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrador (admin_clic)</span>
            </button>
            <button
              onClick={() => handleQuickSwitchRole('Asesor')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                session.rol === 'Asesor'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Asesor (asesor_clic)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {session.rol === 'Asesor' ? (
            <span className="text-amber-300 flex items-center gap-1 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Modo Asesor: Intentar EDITAR o ANULAR disparará el bloqueo RBAC y JSON estricto.
            </span>
          ) : (
            <span className="text-purple-300 flex items-center gap-1 font-medium bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              Modo Administrador: Acceso total a edición, anulación y reportes gerenciales.
            </span>
          )}
        </div>
      </div>

      {/* Main Header */}
      <Header
        session={session}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        isWeekendActive={isWeekendActive}
        onToggleWeekend={handleToggleWeekend}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenJsonInspector={() => setIsJsonModalOpen(true)}
        totalJsonEvents={jsonHistory.length}
      />

      {/* Main Application Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Module Renderers */}
        {activeModule === 'Distribucion_WhatsApp' && (
          <ModuleOrders
            session={session}
            orders={orders}
            onAddOrder={(newOrder) => setOrders([newOrder, ...orders])}
            onUpdateOrderStatus={(id, status) => {
              setOrders((prev) =>
                prev.map((o) => (o.id === id ? { ...o, estado: status } : o))
              );
            }}
            onDeleteOrder={(id) => {
              setOrders((prev) => prev.filter((o) => o.id !== id));
            }}
            onEditOrder={(updatedOrder) => {
              setOrders((prev) =>
                prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
              );
            }}
            onLogAction={handleLogAction}
            onTriggerRbacBlock={handleTriggerRbacBlock}
          />
        )}

        {activeModule === 'Almacenamiento' && (
          <ModuleStorage
            session={session}
            zones={zones}
            batches={batches}
            onAddBatch={(newBatch) => setBatches([newBatch, ...batches])}
            onDeleteBatch={(id) => {
              setBatches((prev) => prev.filter((b) => b.id !== id));
            }}
            onMoveBatchZone={(id, newZone) => {
              setBatches((prev) =>
                prev.map((b) => (b.id === id ? { ...b, zonaId: newZone } : b))
              );
            }}
            onLogAction={handleLogAction}
            onTriggerRbacBlock={handleTriggerRbacBlock}
          />
        )}

        {activeModule === 'Inventario' && (
          <ModuleInventory
            session={session}
            items={inventoryItems}
            isWeekendActive={isWeekendActive}
            onUpdateCount={(id, count) => {
              setInventoryItems((prev) =>
                prev.map((i) =>
                  i.id === id
                    ? {
                        ...i,
                        conteoFisicoRegistrado: count,
                        diferenciaConteo: count - i.stockActual,
                      }
                    : i
                )
              );
            }}
            onUpdateItemParams={(updated) => {
              setInventoryItems((prev) =>
                prev.map((i) => (i.id === updated.id ? updated : i))
              );
            }}
            onDeleteItem={(id) => {
              setInventoryItems((prev) => prev.filter((i) => i.id !== id));
            }}
            onLogAction={handleLogAction}
            onTriggerRbacBlock={handleTriggerRbacBlock}
          />
        )}

        {activeModule === 'Proveedores' && (
          <ModuleSuppliers
            session={session}
            receptions={receptions}
            onAddReception={(newRec) => setReceptions([newRec, ...receptions])}
            onDeleteReception={(id) => {
              setReceptions((prev) => prev.filter((r) => r.id !== id));
            }}
            onLogAction={handleLogAction}
            onTriggerRbacBlock={handleTriggerRbacBlock}
          />
        )}

        {activeModule === 'Cuadre_Caja' && (
          <ModuleCashRegister
            session={session}
            shiftData={cashShift}
            onUpdateShift={setCashShift}
            onLogAction={handleLogAction}
            onTriggerRbacBlock={handleTriggerRbacBlock}
          />
        )}

        {activeModule === 'Reportes' && (
          <ModuleReports
            session={session}
            items={inventoryItems}
            receptions={receptions}
            orders={orders}
            onSwitchToAdmin={() => handleQuickSwitchRole('Administrador')}
            onLogAction={handleLogAction}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">ClicLogistics AI</span>
            <span>&bull;</span>
            <span>Clic Costillas &bull; Ahumados al Cilindro Peruano</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Teorías: Ballou (Almacén) &bull; Heizer & Render (ABC/ROP) &bull; Christopher (OTIF) &bull; Bowersox (Distribución)</span>
            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="text-amber-400 hover:underline flex items-center gap-1 font-mono"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Ver Formato JSON Estricto</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={(s) => {
          setSession(s);
          const resp = buildClicResponse(
            s,
            'Login',
            true,
            null,
            activeModule === 'Reportes' ? 'Inventario' : activeModule,
            { usuario: s.usuario, rol: s.rol },
            [`Autenticación exitosa como ${s.rol}`]
          );
          handleLogAction(resp);
        }}
        currentSession={session}
        onEmitJson={handleLogAction}
      />

      <JsonInspectorModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        currentResponse={currentResponse}
        responseHistory={jsonHistory}
        onSelectHistoryItem={(item) => setCurrentResponse(item)}
      />

      <RbacBlockModal
        isOpen={!!blockedRbacResponse}
        onClose={() => setBlockedRbacResponse(null)}
        blockedResponse={blockedRbacResponse}
        onSwitchToAdmin={() => {
          handleQuickSwitchRole('Administrador');
          setBlockedRbacResponse(null);
        }}
      />
    </div>
  );
}
