/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Gasto, CategoriaGasto } from '../types';

interface ChartsPanelProps {
  filtrados: Gasto[];
}

export default function ChartsPanel({ filtrados }: ChartsPanelProps) {
  // Constantes de colores para cada categoría
  const categoryColors: Record<CategoriaGasto, string> = {
    'Materiales': '#38bdf8',
    'Mano de Obra': '#f43f5e',
    'Herramientas': '#10b981',
    'Servicios': '#8b5cf6',
    'Transporte': '#f59e0b',
    'Varios': '#94a3b8',
  };

  // 1. Procesar Categorías
  const sumByCategory: Record<string, number> = {};
  let totalARS = 0;
  
  filtrados.forEach((g) => {
    sumByCategory[g.cat] = (sumByCategory[g.cat] || 0) + g.ars;
    totalARS += g.ars;
  });

  const categoriesData = Object.entries(sumByCategory)
    .map(([cat, amount]) => ({
      cat: cat as CategoriaGasto,
      amount,
      pct: totalARS > 0 ? (amount / totalARS) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const maxCategoryAmount = categoriesData[0]?.amount || 1;

  // 2. Procesar Gastos por Mes (Evolución)
  const sumByMonth: Record<string, number> = {};
  filtrados.forEach((g) => {
    if (!g.fecha) return;
    const mesKey = g.fecha.slice(0, 7); // YYYY-MM
    sumByMonth[mesKey] = (sumByMonth[mesKey] || 0) + g.ars;
  });

  // Ordenar los meses cronológicamente y tomar los últimos 5
  const normalizedMonthData = Object.entries(sumByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-5);

  const maxMonthAmount = normalizedMonthData.length > 0 
    ? Math.max(...normalizedMonthData.map(([_, amount]) => amount)) 
    : 1;

  // Formateadores estéticos
  const formatCompactARS = (val: number) => {
    if (val >= 1_000_000) {
      return `$${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return `$${(val / 1_000).toFixed(0)}k`;
    }
    return `$${val}`;
  };

  const getMonthName = (monthString: string) => {
    const [y, mo] = monthString.split('-');
    const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${nombres[parseInt(mo) - 1]} '${y.slice(2)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="charts-panel">
      {/* DISTRIBUCIÓN POR CATEGORÍA */}
      <div className="bg-[#131c2e] border border-[#334155] rounded-md p-5">
        <h3 className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold mb-5 flex items-center justify-between">
          <span>Distribución por Categorías</span>
          <span className="font-mono text-[#38bdf8] text-[11px]">Total AR$</span>
        </h3>
        
        {categoriesData.length === 0 ? (
          <div className="h-[140px] flex items-center justify-center text-xs text-[#94a3b8] font-sans">
            Sin datos en el periodo seleccionado
          </div>
        ) : (
          <div className="space-y-4">
            {categoriesData.map(({ cat, amount, pct }) => {
              const color = categoryColors[cat] || '#94a3b8';
              return (
                <div key={cat} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-[#f1f5f9] font-medium group-hover:text-[#38bdf8] transition-colors">
                      {cat}
                    </span>
                    <div className="space-x-2 text-right">
                      <span className="font-mono text-[#f1f5f9] font-medium">
                        {amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[#94a3b8] text-[10px]">
                        ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="h-2 bg-[#1e293b] rounded overflow-hidden flex items-center border border-[#334155]">
                    <div 
                      className="h-full rounded-sm transition-all duration-500 ease-out"
                      style={{ 
                        width: `${(amount / maxCategoryAmount) * 100}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 6px ${color}40`
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EVOLUCIÓN MENSUAL */}
      <div className="bg-[#131c2e] border border-[#334155] rounded-md p-5">
        <h3 className="text-[10px] tracking-[1.5px] uppercase text-[#94a3b8] font-bold mb-5 flex items-center justify-between">
          <span>Evolución Mensual</span>
          <span className="font-mono text-[#10b981] text-[11px]">Últimos 5 Meses Activos</span>
        </h3>

        {normalizedMonthData.length === 0 ? (
          <div className="h-[140px] flex items-center justify-center text-xs text-[#94a3b8] font-sans">
            Registre gastos con diferentes fechas para ver el progreso mensual
          </div>
        ) : (
          <div className="space-y-4">
            {normalizedMonthData.map(([monthKey, val]) => {
              const label = getMonthName(monthKey);
              return (
                <div key={monthKey} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-[#f1f5f9] font-medium group-hover:text-sky-400 transition-colors">
                      {label}
                    </span>
                    <span className="font-mono text-[#e2e8f0] font-medium">
                      ${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="h-2 bg-[#1e293b] rounded overflow-hidden flex items-center border border-[#334155]">
                    <div 
                      className="h-full rounded-sm transition-all duration-500 ease-out bg-[#38bdf8]"
                      style={{ 
                        width: `${(val / maxMonthAmount) * 100}%`,
                        boxShadow: '0 0 6px rgba(56, 189, 248, 0.25)'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
