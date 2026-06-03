/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Gasto, CategoriaGasto } from '../types';
import { Plus, Edit3, X, HelpCircle } from 'lucide-react';

interface GastoFormProps {
  editandoGasto: Gasto | null;
  onGuardar: (gasto: Omit<Gasto, 'id'> & { id?: string }) => void;
  onCancelarEdicion: () => void;
  isConnected: boolean;
}

export default function GastoForm({
  editandoGasto,
  onGuardar,
  onCancelarEdicion,
  isConnected,
}: GastoFormProps) {
  const [fecha, setFecha] = useState('');
  const [cat, setCat] = useState<CategoriaGasto>('Materiales');
  const [ars, setArs] = useState('');
  const [dolar, setDolar] = useState('');
  const [desc, setDesc] = useState('');
  const [prov, setProv] = useState('');
  const [fact, setFact] = useState('');

  // 1. Efecto: Cargar datos de edición si existe
  useEffect(() => {
    if (editandoGasto) {
      setFecha(editandoGasto.fecha);
      setCat(editandoGasto.cat);
      setArs(editandoGasto.ars.toString());
      setDolar(editandoGasto.dolar ? editandoGasto.dolar.toString() : '');
      setDesc(editandoGasto.desc);
      setProv(editandoGasto.prov || '');
      setFact(editandoGasto.fact || '');
    } else {
      limpiarFormulario();
    }
  }, [editandoGasto]);

  // Inicializar fecha de hoy si está vacío
  useEffect(() => {
    if (!fecha && !editandoGasto) {
      const today = new Date().toISOString().split('T')[0];
      setFecha(today);
    }
  }, [fecha, editandoGasto]);

  const limpiarFormulario = () => {
    const today = new Date().toISOString().split('T')[0];
    setFecha(today);
    setCat('Materiales');
    setArs('');
    setDolar('');
    setDesc('');
    setProv('');
    setFact('');
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fecha) {
      alert('Por favor, seleccione una fecha válida.');
      return;
    }
    const arsNum = parseFloat(ars);
    if (isNaN(arsNum) || arsNum <= 0) {
      alert('Por favor, ingrese un importe válido en Pesos (AR$) mayor a cero.');
      return;
    }
    if (!desc.trim()) {
      alert('Por favor, brinde una breve descripción del gasto.');
      return;
    }

    const dolarNum = parseFloat(dolar);
    const hasDolar = !isNaN(dolarNum) && dolarNum > 0;
    const finalDolar = hasDolar ? dolarNum : null;
    const finalUsd = hasDolar ? arsNum / dolarNum : null;

    onGuardar({
      id: editandoGasto?.id,
      fecha,
      cat,
      ars: arsNum,
      dolar: finalDolar,
      usd: finalUsd,
      desc: desc.trim(),
      prov: prov.trim(),
      fact: fact.trim(),
    });

    limpiarFormulario();
  };

  // Conversión interactiva
  const arsValue = parseFloat(ars);
  const dolarValue = parseFloat(dolar);
  const usdEquiv = !isNaN(arsValue) && !isNaN(dolarValue) && dolarValue > 0 ? arsValue / dolarValue : null;

  return (
    <div className="bg-[#131c2e] border border-[#334155] rounded-md p-5 relative" id="gasto-form">
      {/* Indicador de edición */}
      {editandoGasto && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 rounded-t-md" />
      )}

      <h2 className="font-display tracking-[1.5px] text-lg text-[#38bdf8] mb-4 flex items-center gap-2 font-medium">
        {editandoGasto ? <Edit3 className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-[#38bdf8]" />}
        {editandoGasto ? 'MODIFICAR GASTO REGISTRADO' : 'REGISTRAR NUEVO GASTO'}
      </h2>

      <form onSubmit={handleGuardar} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">Fecha de Pago</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded px-3 py-1.5 text-xs focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/35 outline-none transition-colors"
              required
            />
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">Categoría</label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as CategoriaGasto)}
              className="bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded px-3 py-1.5 text-xs focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/35 outline-none transition-colors cursor-pointer"
            >
              <option value="Materiales">Materiales</option>
              <option value="Mano de Obra">Mano de Obra</option>
              <option value="Herramientas">Herramientas</option>
              <option value="Servicios">Servicios</option>
              <option value="Transporte">Transporte</option>
              <option value="Varios">Varios</option>
            </select>
          </div>

          {/* Importe Pesos */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">Importe (AR$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1.5 text-[#94a3b8] text-xs font-semibold select-none">$</span>
              <input
                type="number"
                value={ars}
                onChange={(e) => setArs(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded pl-7 pr-3 py-1.5 text-xs focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/35 outline-none transition-colors w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>
          </div>

          {/* Dólar Cotización */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold flex items-center gap-1">
              Cotización USD del día
              <span className="group relative cursor-help">
                <HelpCircle className="w-3 h-3 text-[#94a3b8] hover:text-[#38bdf8]" />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 bg-[#0f172a] border border-[#334155] text-[9px] text-[#f1f5f9] rounded px-2.5 py-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 leading-snug font-sans uppercase tracking-normal">
                  Valor del dólar blue o de referencia para calcular el impacto en dólares.
                </span>
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1.5 text-[#94a3b8] text-xs select-none">U$S</span>
              <input
                type="number"
                value={dolar}
                onChange={(e) => setDolar(e.target.value)}
                placeholder="ej: 1350"
                min="0"
                step="0.1"
                className="bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded pl-10 pr-3 py-1.5 text-xs focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/35 outline-none transition-colors w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Descripción (Ancho completo) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">Descripción del Gasto</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Ej: Compra de 80 bolsas de cemento Loma Negra en Corralón Central..."
            rows={2}
            className="bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded px-3 py-1.5 text-xs focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/35 outline-none transition-colors resize-y w-full"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Proveedor / Persona */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">Proveedor / Persona (Opcional)</label>
            <input
              type="text"
              value={prov}
              onChange={(e) => setProv(e.target.value)}
              placeholder="Ej: Corralón El Puente S.A."
              className="bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded px-3 py-1.5 text-xs focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/35 outline-none transition-colors"
            />
          </div>

          {/* Factura / Remito */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">N° de Remito / Factura (Opcional)</label>
            <input
              type="text"
              value={fact}
              onChange={(e) => setFact(e.target.value)}
              placeholder="Ej: FAC-B-0004-12903"
              className="bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded px-3 py-1.5 text-xs focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/35 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Equivalencia reactiva en dólares */}
        {usdEquiv !== null && (
          <div className="p-2.5 bg-[#14532d]/10 rounded border border-[#10b981]/20 flex items-center justify-between text-xs text-[#10b981]">
            <span className="font-sans">Cálculo equivalente en USD:</span>
            <span className="font-mono font-bold tracking-wider text-[#10b981]">
              U$S {usdEquiv.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-primary cursor-pointer text-xs py-1.5 px-4 font-medium flex items-center gap-1.5"
            >
              {editandoGasto ? 'Actualizar Gasto' : 'Guardar Gasto'}
            </button>
            {editandoGasto && (
              <button
                type="button"
                onClick={onCancelarEdicion}
                className="btn-secondary cursor-pointer text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            )}
          </div>

          <div className="text-[10px] text-[#94a3b8] italic">
            {isConnected 
              ? '✓ Los cambios se guardarán automáticamente en gastos_obra.json en su PC'
              : '⚠ Los cambios se guardarán en la memoria del navegador de forma temporal'}
          </div>
        </div>
      </form>
    </div>
  );
}
