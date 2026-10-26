/**
 * MÓDULO D: DISTRIBUCIÓN Y PEDIDOS WHATSAPP (Bowersox, Closs & Cooper)
 * Clic Costillas - Cocina Oculta
 */
import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Clock,
  MapPin,
  Compass,
  AlertCircle,
  CheckCircle,
  Truck,
  Flame,
  Trash2,
  Edit,
  DollarSign,
  Phone,
  Timer,
  ChevronRight,
} from 'lucide-react';
import {
  CustomerOrder,
  UserSession,
  OrderStatus,
  DeliveryZoneQuadrant,
} from '../types/logistics';
import { SAMPLE_WHATSAPP_MESSAGES } from '../data/mockData';
import {
  parseWhatsAppMessage,
  validateRbac,
  buildClicResponse,
} from '../services/logisticsEngine';

interface Props {
  session: UserSession;
  orders: CustomerOrder[];
  onAddOrder: (order: CustomerOrder) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (orderId: string) => void;
  onEditOrder: (order: CustomerOrder) => void;
  onLogAction: (response: ReturnType<typeof buildClicResponse>) => void;
  onTriggerRbacBlock: (response: ReturnType<typeof buildClicResponse>) => void;
}

export const ModuleOrders: React.FC<Props> = ({
  session,
  orders,
  onAddOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
  onEditOrder,
  onLogAction,
  onTriggerRbacBlock,
}) => {
  const [rawMessage, setRawMessage] = useState(
    SAMPLE_WHATSAPP_MESSAGES[0].texto
  );
  const [selectedQuadrantFilter, setSelectedQuadrantFilter] = useState<
    'TODOS' | DeliveryZoneQuadrant
  >('TODOS');

  // Parse & Register new order from WhatsApp
  const handleProcessMessage = () => {
    if (!rawMessage.trim()) return;

    // RBAC check: Registro
    const rbac = validateRbac(session, 'Registro', 'Distribucion_WhatsApp');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Registro',
        false,
        rbac.reason,
        'Distribucion_WhatsApp',
        null,
        ['Permisos insuficientes para registrar pedidos WhatsApp.']
      );
      onTriggerRbacBlock(resp);
      return;
    }

    const newOrder = parseWhatsAppMessage(
      rawMessage,
      session.usuario || 'asesor_clic'
    );
    onAddOrder(newOrder);

    const resp = buildClicResponse(
      session,
      'Registro',
      true,
      null,
      'Distribucion_WhatsApp',
      {
        pedido_registrado: {
          codigo: newOrder.codigoOrden,
          cliente: newOrder.clienteNombre,
          telefono: newOrder.clienteTelefono,
          direccion: newOrder.direccion,
          cuadrante: newOrder.cuadrante,
          total: newOrder.total,
          metodo_pago: newOrder.metodoPago,
          items: newOrder.items,
          sla_total_minutos: 50,
          preparacion_cocina_min: 30,
          ruta_entrega_min: 20,
        },
      },
      [
        'Pedido estructurado exitosamente desde WhatsApp.',
        `Asignado a ${newOrder.cuadrante} para optimización de ruta.`,
        'SLA iniciado: 30 min cocción al cilindro / 20 min despacho.',
      ]
    );

    onLogAction(resp);
  };

  // Attempt to Edit an order
  const handleAttemptEdit = (order: CustomerOrder) => {
    const rbac = validateRbac(session, 'Edicion', 'Distribucion_WhatsApp');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Edicion',
        false,
        rbac.reason,
        'Distribucion_WhatsApp',
        { pedido_id: order.id, codigo: order.codigoOrden },
        [
          'RECHAZO RBAC: Un asesor no está autorizado a modificar pedidos ya emitidos.',
        ]
      );
      onTriggerRbacBlock(resp);
      return;
    }

    // If Admin, proceed with edit
    const updated = {
      ...order,
      observaciones: 'Modificado por Administrador',
    };
    onEditOrder(updated);

    const resp = buildClicResponse(
      session,
      'Edicion',
      true,
      null,
      'Distribucion_WhatsApp',
      {
        pedido_modificado: order.codigoOrden,
        admin_autorizador: session.usuario,
      },
      ['Pedido modificado conforme por el Administrador.']
    );
    onLogAction(resp);
  };

  // Attempt to Cancel / Delete an order
  const handleAttemptCancel = (order: CustomerOrder) => {
    const rbac = validateRbac(session, 'Anulacion', 'Distribucion_WhatsApp');
    if (!rbac.allowed) {
      const resp = buildClicResponse(
        session,
        'Anulacion',
        false,
        rbac.reason,
        'Distribucion_WhatsApp',
        { pedido_id: order.id, codigo: order.codigoOrden },
        [
          'BLOQUEO OPERATIVO: Solo el Administrador puede anular pedidos en cocina.',
        ]
      );
      onTriggerRbacBlock(resp);
      return;
    }

    onDeleteOrder(order.id);
    const resp = buildClicResponse(
      session,
      'Anulacion',
      true,
      null,
      'Distribucion_WhatsApp',
      {
        pedido_anulado: order.codigoOrden,
        anulado_por: session.usuario,
      },
      ['Pedido anulado de cocina por Administrador.']
    );
    onLogAction(resp);
  };

  const filteredOrders = orders.filter((o) =>
    selectedQuadrantFilter === 'TODOS'
      ? true
      : o.cuadrante === selectedQuadrantFilter
  );

  return (
    <div className="space-y-6">
      {/* Module Title & Theory Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Módulo D &bull; Teoría de Bowersox, Closs & Cooper</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Distribución Urbana & Procesamiento de WhatsApp
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Conversión automática de mensajes informales de clientes en órdenes
            estructuradas, asignación por cuadrantes geográficos y control
            estricto de SLA (30m cilindro + 20m ruta).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="text-slate-400 block leading-tight">SLA Estándar:</span>
            <span className="font-bold text-white">
              30m Preparación + 20m Ruta = 50m
            </span>
          </div>
        </div>
      </div>

      {/* WhatsApp Intake Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Entrada de Mensaje Informal de WhatsApp
              </h3>
              <p className="text-[11px] text-slate-400">
                Pegue el texto recibido o use una plantilla de cliente para
                extraer automáticamente la orden.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Parser Inteligente Activo</span>
          </span>
        </div>

        {/* Quick Sample Buttons */}
        <div className="mb-3">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
            Cargar caso de prueba de cliente:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_WHATSAPP_MESSAGES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setRawMessage(sample.texto)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {sample.titulo}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            rows={3}
            value={rawMessage}
            onChange={(e) => setRawMessage(e.target.value)}
            placeholder="Pegue aquí el mensaje completo de WhatsApp..."
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 text-xs font-mono leading-relaxed focus:outline-none transition"
          />
        </div>

        {/* Action Button */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Responsable del turno:{' '}
            <strong className="text-amber-300">{session.usuario}</strong> (
            {session.rol})
          </span>

          <button
            onClick={handleProcessMessage}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950 transition"
          >
            <Send className="w-4 h-4" />
            <span>Estructurar y Enviar a Cocina / Despacho</span>
          </button>
        </div>
      </div>

      {/* Orders Dispatch Board */}
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Tablero de Despacho Operativo ({orders.length} pedidos)
            </h3>
          </div>

          {/* Quadrant Filter */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Filtrar Cuadrante:</span>
            {(
              [
                'TODOS',
                'Cuadrante Sur',
                'Cuadrante Centro-Occidente',
                'Cuadrante Norte',
                'Cuadrante Oriente',
              ] as const
            ).map((quad) => (
              <button
                key={quad}
                onClick={() => setSelectedQuadrantFilter(quad)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  selectedQuadrantFilter === quad
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {quad}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isLate = order.minutosRestantes <= 10;
            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {order.codigoOrden}
                    </span>
                    <h4 className="font-bold text-white text-sm mt-1">
                      {order.clienteNombre}
                    </h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {order.clienteTelefono}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        order.estado === 'Entregado'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : order.estado === 'En Ruta'
                          ? 'bg-blue-500/20 text-blue-300'
                          : order.estado === 'En Cilindro/Cocina'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {order.estado}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{order.horaCreacion}</span>
                    </div>
                  </div>
                </div>

                {/* Products & Accompaniments */}
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                  {order.items.map((item, i) => (
                    <div key={i} className="text-slate-200">
                      <span className="font-semibold text-white">
                        {item.porciones}x {item.producto}
                      </span>
                      <div className="text-[11px] text-amber-300/90 font-medium">
                        &bull; Acompañamiento: {item.acompanamiento}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Salsas: {item.salsas.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Address & Zone */}
                <div className="text-xs space-y-1">
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      {order.direccion} ({order.barrio})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 pl-5">
                    Zona: <strong className="text-cyan-300">{order.cuadrante}</strong>
                  </div>
                </div>

                {/* Financial info & Payment */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pago:</span>
                    <span className="font-semibold text-slate-200">
                      {order.metodoPago}
                    </span>
                    {order.cambioRequerido && (
                      <span className="text-[10px] text-amber-400 block">
                        Cambio: ${order.cambioRequerido.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Total:</span>
                    <span className="font-black text-white text-sm">
                      ${order.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* SLA Timer Indicator */}
                <div
                  className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                    isLate
                      ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                      : 'bg-slate-950 border border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                    <span>SLA Entrega: {order.horaEstimadaEntrega}</span>
                  </div>
                  <span className="font-bold text-amber-400 text-[11px]">
                    {order.minutosRestantes}m restantes
                  </span>
                </div>

                {/* Action buttons (Notice the RBAC enforcement) */}
                <div className="pt-1 flex items-center justify-between gap-1.5 border-t border-slate-800">
                  {/* Status advance */}
                  <select
                    value={order.estado}
                    onChange={(e) =>
                      onUpdateOrderStatus(
                        order.id,
                        e.target.value as OrderStatus
                      )
                    }
                    className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-[11px] px-2 py-1 focus:outline-none"
                  >
                    <option value="Recibido">Recibido</option>
                    <option value="En Cilindro/Cocina">En Cilindro</option>
                    <option value="Listo para Despacho">Listo</option>
                    <option value="En Ruta">En Ruta</option>
                    <option value="Entregado">Entregado</option>
                  </select>

                  <div className="flex items-center gap-1">
                    {/* EDIT BUTTON (Triggers RBAC check) */}
                    <button
                      onClick={() => handleAttemptEdit(order)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title={
                        session.rol === 'Asesor'
                          ? 'PROHIBIDO PARA ASESOR: Solo Admin puede editar'
                          : 'Editar Pedido'
                      }
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* CANCEL / DELETE BUTTON (Triggers RBAC check) */}
                    <button
                      onClick={() => handleAttemptCancel(order)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 hover:text-rose-200 transition"
                      title={
                        session.rol === 'Asesor'
                          ? 'PROHIBIDO PARA ASESOR: Solo Admin puede anular'
                          : 'Anular Pedido'
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
