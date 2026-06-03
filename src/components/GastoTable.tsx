/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Gasto, CategoriaGasto } from '../types';
import { Search, Calendar, Filter, Edit2, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GastoTableProps {
  gastos: Gasto[];
  onEditar: (gasto: Gasto) => void;
  onEliminar: (id: string) => void;
}

type SortField = 'fecha' | 'ars';
type SortDir = 'asc' | 'desc';

export default function GastoTable({ gastos, onEditar, onEliminar }: GastoTableProps) {
  // Estados de Filtros
  const [filCat, setFilCat] = useState<string>('');
  const [filDesde, setFilDesde] = useState<string>('');
  const [filHasta, setFilHasta] = useState<string>('');
  const [filBuscar, setFilBuscar] = useState<string>('');

  // Sorter
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Paginación
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 15;

  // Clases CSS mapeadas por categoría (como en el HTML original)
  const getCatClass = (cat: CategoriaGasto) => {
    const map: Record<CategoriaGasto, string> = {
      'Materiales': 'bg-[rgba(56,189,248,0.1)] text-[#38bdf8] border border-[#38bdf8]/20',
      'Mano de Obra': 'bg-[rgba(244,63,94,0.1)] text-[#f43f5e] border border-[#f43f5e]/20',
      'Herramientas': 'bg-[rgba(16,185,129,0.1)] text-[#10b981] border border-[#10b981]/20',
      'Servicios': 'bg-[rgba(139,92,246,0.1)] text-[#8b5cf6] border border-[#8b5cf6]/20',
      'Transporte': 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border border-[#f59e0b]/20',
      'Varios': 'bg-[rgba(148,163,184,0.1)] text-[#94a3b8] border border-[#94a3b8]/20',
    };
    return map[cat] || 'bg-slate-800 text-slate-400';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPagina(1);
  };

  // Limpiar todos los filtros en un clic
  const limpiarFiltros = () => {
    setFilCat('');
    setFilDesde('');
    setFilHasta('');
    setFilBuscar('');
    setPagina(1);
  };

  // Filtrado de Datos Reactivo
  const filtrados = gastos.filter((g) => {
    if (filCat && g.cat !== filCat) return false;
    if (filDesde && g.fecha < filDesde) return false;
    if (filHasta && g.fecha > filHasta) return false;
    if (filBuscar.trim()) {
      const matchText = filBuscar.toLowerCase();
      const haystack = `${g.desc} ${g.prov || ''} ${g.fact || ''}`.toLowerCase();
      if (!haystack.includes(matchText)) return false;
    }
    return true;
  });

  // Ordenamiento de Datos
  const ordenados = [...filtrados].sort((a, b) => {
    let va = a[sortField];
    let vb = b[sortField];
    
    if (sortField === 'ars') {
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    } else {
      // Fecha string
      return sortDir === 'asc' 
        ? (va as string).localeCompare(vb as string) 
        : (vb as string).localeCompare(va as string);
    }
  });

  // Paginación reactiva
  const totalItems = ordenados.length;
  const totalPaginas = Math.ceil(totalItems / POR_PAGINA) || 1;
  const actualPagina = Math.min(pagina, totalPaginas);
  const indexInicio = (actualPagina - 1) * POR_PAGINA;
  const itemsPaginados = ordenados.slice(indexInicio, indexInicio + POR_PAGINA);

  // Formateadores estéticos
  const formatARS = (val: number) => {
    return '$' + Math.round(val).toLocaleString('es-AR');
  };

  const formatUSD = (val: number) => {
    return 'U$S ' + val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatFechaShow = (fechaStr: string) => {
    if (!fechaStr) return '—';
    const parts = fechaStr.split('-');
    if (parts.length !== 3) return fechaStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-4" id="gasto-table-container">
      {/* SECCIÓN INTERACTIVA DE FILTROS */}
      <div className="bg-[#131c2e] border border-[#334155] rounded-md p-5">
        <h3 className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold mb-4 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#38bdf8]" />
          Filtros de Búsqueda
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[1px] uppercase text-[#94a3b8] font-semibold">Filtrar por Categoría</label>
            <select
              value={filCat}
              onChange={(e) => { setFilCat(e.target.value); setPagina(1); }}
              className="bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded px-3 py-1.5 text-xs focus:border-[#38bdf8] outline-none transition-colors cursor-pointer w-full"
            >
              <option value="">Todas las categorías</option>
              <option value="Materiales">Materiales</option>
              <option value="Mano de Obra">Mano de Obra</option>
              <option value="Herramientas">Herramientas</option>
              <option value="Servicios">Servicios</option>
              <option value="Transporte">Transporte</option>
              <option value="Varios">Varios</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div className="flex flex-col gap-1.5 animate-fadeIn">
            <label className="text-[10px] tracking-[1px] uppercase text-[#94a3b8] font-semibold">Fecha Desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2 w-3.5 h-3.5 text-[#94a3b8]" />
              <input
                type="date"
                value={filDesde}
                onChange={(e) => { setFilDesde(e.target.value); setPagina(1); }}
                className="bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded pl-9 pr-3 py-1.5 text-xs focus:border-[#38bdf8] outline-none transition-colors w-full"
              />
            </div>
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[1px] uppercase text-[#94a3b8] font-semibold">Fecha Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2 w-3.5 h-3.5 text-[#94a3b8]" />
              <input
                type="date"
                value={filHasta}
                onChange={(e) => { setFilHasta(e.target.value); setPagina(1); }}
                className="bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded pl-9 pr-3 py-1.5 text-xs focus:border-[#38bdf8] outline-none transition-colors w-full"
              />
            </div>
          </div>

          {/* Buscador de Texto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-[1px] uppercase text-[#94a3b8] font-semibold">Buscar Palabra Clave</label>
            <div className="relative">
              <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-[#94a3b8]" />
              <input
                type="text"
                value={filBuscar}
                onChange={(e) => { setFilBuscar(e.target.value); setPagina(1); }}
                placeholder="Descripción, proveedor, factura..."
                className="bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded pl-9 pr-3 py-1.5 text-xs focus:border-[#38bdf8] outline-none transition-colors w-full"
              />
            </div>
          </div>
        </div>

        {/* Botón de Limpiar si hay filtros activos */}
        {(filCat || filDesde || filHasta || filBuscar) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={limpiarFiltros}
              className="btn-secondary flex items-center gap-1.5 text-[10px] py-1 px-2.5 border-[#38bdf8]/20 text-[#38bdf8] hover:bg-[#38bdf8]/5 cursor-pointer"
            >
              <X className="w-3 h-3" />
              Limpiar filtros aplicados
            </button>
          </div>
        )}
      </div>

      {/* TABLA PRINCIPAL DE GASTOS */}
      <div className="bg-[#131c2e] border border-[#334155] rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-[#334155] flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display tracking-[1.5px] text-sm text-[#38bdf8] uppercase font-semibold">
            REGISTRO CRONOLÓGICO DE GASTOS
          </h2>
          <span className="text-[11px] text-[#94a3b8] font-mono">
            {totalItems} resultado{totalItems !== 1 ? 's' : ''} encontrado{totalItems !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="table-gastos">
            <thead>
              <tr className="bg-[#1e293b] border-b border-[#334155]">
                {/* ID de Obra escondido o implícito en el código */}
                <th 
                  onClick={() => handleSort('fecha')}
                  className="px-4 py-2.5 text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold select-none cursor-pointer hover:text-[#38bdf8] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Fecha
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="px-4 py-2.5 text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">Categoría</th>
                <th className="px-4 py-2.5 text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold w-1/4">Descripción</th>
                <th className="px-4 py-2.5 text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">Proveedor</th>
                <th 
                  onClick={() => handleSort('ars')}
                  className="px-4 py-2.5 text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold select-none cursor-pointer hover:text-[#38bdf8] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Importe AR$
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="px-4 py-2.5 text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold text-right">Cotización USD</th>
                <th className="px-4 py-2.5 text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold text-right">Equiv. USD</th>
                <th className="px-4 py-2.5 text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">N° Comp.</th>
                <th className="px-4 py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/40 text-xs">
              {itemsPaginados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[#94a3b8] sm:py-20">
                    <div className="text-3xl mb-3 opacity-55 select-none" id="table-empty-emoji">🧱</div>
                    <p className="text-sm font-medium text-[#f1f5f9]/70">No se encontraron gastos</p>
                    <p className="text-xs text-[#94a3b8] mt-1 max-w-md mx-auto">
                      Registre un gasto o limpie los filtros de búsqueda activos para mostrar la información.
                    </p>
                  </td>
                </tr>
              ) : (
                itemsPaginados.map((g) => (
                  <tr key={g.id} className="hover:bg-[#38bdf8]/[0.02] transition-colors group">
                    <td className="px-4 py-2.5 font-mono text-[#f1f5f9] whitespace-nowrap">
                      {formatFechaShow(g.fecha)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase select-none ${getCatClass(g.cat)}`}>
                        {g.cat}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#f1f5f9] max-w-xs truncate" title={g.desc}>
                      {g.desc}
                    </td>
                    <td className="px-4 py-2.5 text-[#94a3b8] max-w-xs truncate" title={g.prov || '—'}>
                      {g.prov || <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-[#f1f5f9]">
                      {formatARS(g.ars)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[#94a3b8] text-right">
                      {g.dolar ? formatARS(g.dolar) : <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-medium text-[#10b981] text-right">
                      {g.usd != null ? formatUSD(g.usd) : <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-[#94a3b8] font-mono max-w-[120px] truncate" title={g.fact || '—'}>
                      {g.fact || <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditar(g)}
                          className="p-1 px-1.5 rounded bg-[#1e293b] border border-[#334155] hover:border-[#38bdf8] hover:text-[#38bdf8] text-[#94a3b8] transition-colors cursor-pointer"
                          title="Editar este gasto"
                          id={`btn-edit-${g.id}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onEliminar(g.id)}
                          className="p-1 px-1.5 rounded bg-[#1e293b] border border-[#334155] hover:border-red-500 hover:text-red-400 text-[#94a3b8] transition-colors cursor-pointer"
                          title="Eliminar este gasto"
                          id={`btn-del-${g.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* BARRA DE PAGINACIÓN */}
        {totalItems > 0 && (
          <div className="px-5 py-2.5 bg-[#1e293b]/40 border-t border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#94a3b8] font-sans">
            <div>
              Mostrando <span className="text-[#f1f5f9] font-medium">{indexInicio + 1}</span> al{' '}
              <span className="text-[#f1f5f9] font-medium">
                {Math.min(indexInicio + POR_PAGINA, totalItems)}
              </span>{' '}
              de <span className="text-[#f1f5f9] font-medium">{totalItems}</span> registros
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagina((prev) => Math.max(1, prev - 1))}
                disabled={actualPagina <= 1}
                className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                id="btn-pagination-prev"
              >
                <ChevronLeft className="w-3 h-3" />
                Anterior
              </button>
              
              <span className="font-mono px-2 py-0.5 bg-[#1e293b] rounded border border-[#334155] text-xs text-[#f1f5f9]">
                {actualPagina} / {totalPaginas}
              </span>

              <button
                onClick={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
                disabled={actualPagina >= totalPaginas}
                className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                id="btn-pagination-next"
              >
                Siguiente
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
