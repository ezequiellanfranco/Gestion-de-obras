/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Gasto } from '../types';

interface ResumeCardsProps {
  filtrados: Gasto[];
}

export default function ResumeCards({ filtrados }: ResumeCardsProps) {
  const totalARS = filtrados.reduce((acc, g) => acc + g.ars, 0);
  const totalUSD = filtrados.filter((g) => g.usd != null).reduce((acc, g) => acc + (g.usd as number), 0);
  const count = filtrados.length;

  // Encontrar la categoría de mayor gasto
  const categorizadosMap: Record<string, number> = {};
  filtrados.forEach((g) => {
    categorizadosMap[g.cat] = (categorizadosMap[g.cat] || 0) + g.ars;
  });

  const sortedCats = Object.entries(categorizadosMap).sort((a, b) => b[1] - a[1]);
  const highestCategory = sortedCats[0]; // [nombre, totalAmount]

  // Formateadores locales elegantes
  const formatARS = (val: number) => {
    return '$' + Math.round(val).toLocaleString('es-AR');
  };

  const formatUSD = (val: number) => {
    return 'U$S ' + val.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  const highestCatText = highestCategory 
    ? `${highestCategory[0]} (${Math.round((highestCategory[1] / (totalARS || 1)) * 100)}%)`
    : '—';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="resume-cards-section">
      {/* TARJETA TOTAL ARS */}
      <div className="bg-[#131c2e] border border-[#334155] rounded-md p-4 relative overflow-hidden group hover:border-[#38bdf8]/40 transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#38bdf8]" />
        <div className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">
          Total Gastado AR$
        </div>
        <div className="font-display text-3xl tracking-[0.5px] text-[#f1f5f9] mt-2.5 leading-none truncate font-semibold" title={formatARS(totalARS)}>
          {formatARS(totalARS)}
        </div>
        <div className="text-[10px] text-[#94a3b8] mt-2 flex justify-between items-center">
          <span>Solo compras AR$</span>
          <span className="font-mono text-[9px] text-[#38bdf8]/70">Obra Activa</span>
        </div>
      </div>

      {/* TARJETA TOTAL USD */}
      <div className="bg-[#131c2e] border border-[#334155] rounded-md p-4 relative overflow-hidden group hover:border-[#10b981]/40 transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#10b981]" />
        <div className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">
          Total Gastado USD
        </div>
        <div className="font-display text-3xl tracking-[0.5px] text-[#10b981] mt-2.5 leading-none truncate font-semibold" title={formatUSD(totalUSD)}>
          {formatUSD(totalUSD)}
        </div>
        <div className="text-[10px] text-[#94a3b8] mt-2 flex justify-between items-center">
          <span>Equivalente o USD Directos</span>
          <span className="font-mono text-[9px] text-[#10b981]/70">Cotizados</span>
        </div>
      </div>

      {/* TARJETA CANTIDAD */}
      <div className="bg-[#131c2e] border border-[#334155] rounded-md p-4 relative overflow-hidden group hover:border-[#38bdf8]/40 transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0284c7]" />
        <div className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">
          Cantidad de Gastos
        </div>
        <div className="font-display text-3xl tracking-[0.5px] text-[#38bdf8] mt-2.5 leading-none font-semibold">
          {count} <span className="font-sans text-xs tracking-normal text-[#94a3b8] lowercase font-normal">ítems</span>
        </div>
        <div className="text-[10px] text-[#94a3b8] mt-2 flex justify-between items-center">
          <span>Registros procesados</span>
          <span className="font-mono text-[9px] text-[#38bdf8]/70">Contador Obra</span>
        </div>
      </div>

      {/* TARJETA CATEGORIA MAYOR GASTO */}
      <div className="bg-[#131c2e] border border-[#334155] rounded-md p-4 relative overflow-hidden group hover:border-violet-500/40 transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-violet-500" />
        <div className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold">
          Categoría Mayor Gasto
        </div>
        <div 
          className="font-display text-xl tracking-[0.5px] text-violet-400 mt-2.5 leading-none truncate font-semibold"
          title={highestCatText}
        >
          {highestCatText}
        </div>
        <div className="text-[10px] text-[#94a3b8] mt-2 flex justify-between items-center">
          <span>Mayor peso de inversión</span>
          <span className="font-mono text-[9px] text-violet-400/70">Análisis</span>
        </div>
      </div>
    </div>
  );
}
