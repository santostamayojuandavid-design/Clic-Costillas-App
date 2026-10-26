/**
 * ClicLogistics AI - Authentication & Session Modal
 * RBAC Gateway for Clic Costillas
 */
import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Lock,
  Flame,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserSession, ClicLogisticsResponse } from '../types/logistics';
import { VALID_CREDENTIALS } from '../services/logisticsEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (session: UserSession) => void;
  currentSession: UserSession;
  onEmitJson: (data: ClicLogisticsResponse) => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLogin,
  currentSession,
}) => {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = usuario.trim();
    const cleanPass = clave.trim();

    if (
      cleanUser === VALID_CREDENTIALS.admin.usuario &&
      cleanPass === VALID_CREDENTIALS.admin.clave
    ) {
      onLogin({
        autenticado: true,
        usuario: VALID_CREDENTIALS.admin.usuario,
        rol: 'Administrador',
        nombre: VALID_CREDENTIALS.admin.nombre,
      });
      onClose();
      return;
    }

    if (
      cleanUser === VALID_CREDENTIALS.asesor.usuario &&
      cleanPass === VALID_CREDENTIALS.asesor.clave
    ) {
      onLogin({
        autenticado: true,
        usuario: VALID_CREDENTIALS.asesor.usuario,
        rol: 'Asesor',
        nombre: VALID_CREDENTIALS.asesor.nombre,
      });
      onClose();
      return;
    }

    setErrorMessage(
      'Credenciales incorrectas. Verifique usuario y contraseña autorizados.'
    );
  };

  const handleQuickLogin = (role: 'admin' | 'asesor') => {
    const creds =
      role === 'admin' ? VALID_CREDENTIALS.admin : VALID_CREDENTIALS.asesor;
    onLogin({
      autenticado: true,
      usuario: creds.usuario,
      rol: creds.rol,
      nombre: creds.nombre,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Smoker Brand Banner */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border-b border-amber-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-950">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Clic Costillas
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                  Cilindro Peruano
                </span>
              </div>
              <h3 className="text-lg font-black text-white">ClicLogistics AI</h3>
              <p className="text-xs text-slate-400">
                Control de Acceso y Roles de Seguridad (RBAC)
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Quick Select Buttons */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              Acceso Rápido de Prueba (Credenciales Oficiales)
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-3 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 transition text-left flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                    Rol Administrador
                  </span>
                  <p className="text-xs font-bold text-white group-hover:text-purple-200">
                    admin_clic
                  </p>
                </div>
                <span className="text-[10px] text-purple-300/80 mt-2 font-mono">
                  Acceso Total (Editar/Anular)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('asesor')}
                className="p-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 transition text-left flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    Rol Asesor
                  </span>
                  <p className="text-xs font-bold text-white group-hover:text-cyan-200">
                    asesor_clic
                  </p>
                </div>
                <span className="text-[10px] text-cyan-300/80 mt-2 font-mono">
                  Operativo (Sin Edición)
                </span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-500">
              O autenticación manual
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="admin_clic o asesor_clic"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="Admin2026* o Asesor2026*"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs focus:outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Validar Credenciales & Iniciar</span>
            </button>
          </form>

          {/* Current Session indicator if already logged */}
          {currentSession.autenticado && (
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sesión activa: {currentSession.usuario}</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white underline"
              >
                Continuar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
