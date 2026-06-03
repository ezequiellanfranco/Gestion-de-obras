/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Gasto, FolderSyncState } from './types';
import {
  readGastosFromDirectory,
  writeGastosToDirectory,
  saveDirectoryHandle,
  loadDirectoryHandle,
  clearSavedDirectoryHandle,
  verifyPermission
} from './lib/fileSystem';

// Importar componentes modulares
import FolderSyncPanel from './components/FolderSyncPanel';
import ResumeCards from './components/ResumeCards';
import ChartsPanel from './components/ChartsPanel';
import GastoForm from './components/GastoForm';
import GastoTable from './components/GastoTable';

import { 
  FileDown, 
  FileUp, 
  HardDriveDownload, 
  Trash2,
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'obra_gastos_react_v1';

export default function App() {
  // Estado principal de gastos
  const [gastos, setGastos] = useState<Gasto[]>([]);
  
  // Estado de edición activa
  const [editandoGasto, setEditandoGasto] = useState<Gasto | null>(null);

  // Estados de sincronización con carpetas de PC
  const [syncState, setSyncState] = useState<FolderSyncState>({
    isConnected: false,
    folderName: '',
    error: null,
    lastSyncTime: null,
  });

  // Guardar el control de la carpeta local fuera del estado de React para evitar re-renders cíclicos
  const directoryHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  // Sistema de notificaciones TOAST
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' | null }>({
    msg: '',
    type: null,
  });

  // Modal para eliminar
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; targetId: string | null }>({
    isOpen: false,
    targetId: null,
  });

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast({ msg: '', type: null });
    }, 3000);
  };

  // 1. Carga inicial: Cargar datos desde LocalStorage y buscar si hay un directorio acordado en IndexedDB
  useEffect(() => {
    const initApp = async () => {
      // Intentar cargar primero de LocalStorage como base
      let localData: Gasto[] = [];
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          localData = JSON.parse(raw);
          setGastos(localData);
        }
      } catch (err) {
        console.error('Error cargando localStorage:', err);
      }

      // Intentar recuperar el handle de directorio de IndexedDB
      try {
        const savedHandle = await loadDirectoryHandle();
        if (savedHandle) {
          // Consultar permisos, requerirá clic en Chrome pero podemos intentarlo
          const hasPermission = await verifyPermission(savedHandle, true);
          if (hasPermission) {
            directoryHandleRef.current = savedHandle;
            const dirGastos = await readGastosFromDirectory(savedHandle);
            
            setSyncState({
              isConnected: true,
              folderName: savedHandle.name,
              error: null,
              lastSyncTime: new Date().toLocaleTimeString(),
            });

            // Si hay datos en la carpeta, los priorizamos
            if (dirGastos.length > 0) {
              setGastos(dirGastos);
              triggerToast('Conectado a carpeta local. Datos importados de PC.', 'success');
            } else if (localData.length > 0) {
              // Si la carpeta está vacía pero el navegador tiene datos, los volcamos en la carpeta
              await writeGastosToDirectory(savedHandle, localData);
              setSyncState(prev => ({
                ...prev,
                lastSyncTime: new Date().toLocaleTimeString()
              }));
              triggerToast('Conectado a carpeta nueva. Sus datos han sido respaldados en su disco.', 'success');
            }
          }
        }
      } catch (err: any) {
        console.warn('No se pudo reactivar el handle de almacenamiento automáticamente:', err.message);
      }
    };

    initApp();
  }, []);

  // Auxiliar para escribir gastos en la computadora local y en el backup LocalStorage
  const persistGastos = async (nuevosGastos: Gasto[]) => {
    setGastos(nuevosGastos);
    
    // Backup en navegador
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nuevosGastos));
    } catch (e) {
      console.error('Error al guardar fallback LocalStorage:', e);
    }

    // Guardar en disco duro si está conectado
    if (syncState.isConnected && directoryHandleRef.current) {
      try {
        await writeGastosToDirectory(directoryHandleRef.current, nuevosGastos);
        setSyncState(prev => ({
          ...prev,
          error: null,
          lastSyncTime: new Date().toLocaleTimeString()
        }));
      } catch (err: any) {
        setSyncState(prev => ({
          ...prev,
          error: `Error al escribir archivo local: ${err.message}`
        }));
        triggerToast('No se pudo guardar el archivo en PC', 'error');
      }
    }
  };

  // Conectar carpeta al elegir con el buscador de directorios nativo de PC
  const handleConnectFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        triggerToast('Su navegador no soporta la API de archivos.', 'error');
        return;
      }

      const handle = await (window as any).showDirectoryPicker();
      const hasPermission = await verifyPermission(handle, true);
      
      if (!hasPermission) {
        triggerToast('Permiso denegado por el usuario', 'error');
        return;
      }

      directoryHandleRef.current = handle;
      await saveDirectoryHandle(handle);

      // Leer o inicializar gastos_obra.json en la nueva carpeta
      const fileGastos = await readGastosFromDirectory(handle);

      let dataToAdopt = fileGastos;

      // Resolver colisiones de datos si ambos lados tienen información distinta
      if (fileGastos.length === 0 && gastos.length > 0) {
        const confirmar = window.confirm(
          `La carpeta seleccionada está vacía.\n¿Desea respaldar los ${gastos.length} gastos que tiene en pantalla dentro de la carpeta local de su PC?`
        );
        if (confirmar) {
          await writeGastosToDirectory(handle, gastos);
          dataToAdopt = gastos;
        }
      } else if (fileGastos.length > 0 && gastos.length > 0) {
        const confirmar = window.confirm(
          `Se encontraron ${fileGastos.length} gastos en la carpeta seleccionada de su PC.\n¿Desea SOBREESCRIBIR la pantalla con los datos de su PC?\n\n(Presione "Aceptar" para usar los datos de la PC.\nPresione "Cancelar" para conservar la información en pantalla y subirla a su PC)`
        );
        if (confirmar) {
          dataToAdopt = fileGastos;
        } else {
          await writeGastosToDirectory(handle, gastos);
          dataToAdopt = gastos;
        }
      }

      setSyncState({
        isConnected: true,
        folderName: handle.name,
        error: null,
        lastSyncTime: new Date().toLocaleTimeString(),
      });

      setGastos(dataToAdopt);
      triggerToast(`Carpeta "${handle.name}" conectada con éxito ✔`, 'success');

    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Cancelado por el usuario de forma natural
        return;
      }
      setSyncState(prev => ({
        ...prev,
        error: `Error de conexión: ${err.message}`
      }));
      triggerToast('Error al conectar carpeta', 'error');
    }
  };

  // Desconectar sistema de carpetas físicas
  const handleDisconnectFolder = async () => {
    directoryHandleRef.current = null;
    await clearSavedDirectoryHandle();
    setSyncState({
      isConnected: false,
      folderName: '',
      error: null,
      lastSyncTime: null,
    });
    triggerToast('Carpeta local desconectada. Modo navegador activo.', 'info');
  };

  // Forzar escritura manual en disco
  const handleManualSync = async () => {
    if (!syncState.isConnected || !directoryHandleRef.current) {
      triggerToast('No hay una carpeta local conectada', 'error');
      return;
    }
    try {
      await writeGastosToDirectory(directoryHandleRef.current, gastos);
      setSyncState(prev => ({
        ...prev,
        error: null,
        lastSyncTime: new Date().toLocaleTimeString(),
      }));
      triggerToast('Sincronización manual en disco completada ✔', 'success');
    } catch (err: any) {
      triggerToast(`Error de escritura: ${err.message}`, 'error');
    }
  };

  // ─── OPERACIONES CRUD ─────────────────────────────────────────
  const handleGuardarGasto = async (gInput: Omit<Gasto, 'id'> & { id?: string }) => {
    let nuevosGastos = [...gastos];
    
    if (gInput.id) {
      // Modificar existente
      nuevosGastos = nuevosGastos.map((g) => (g.id === gInput.id ? (gInput as Gasto) : g));
      triggerToast('Gasto actualizado ✔', 'success');
      setEditandoGasto(null);
    } else {
      // Crear uno nuevo
      const nuevoId = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const nuevo: Gasto = {
        id: nuevoId,
        fecha: gInput.fecha,
        cat: gInput.cat,
        ars: gInput.ars,
        dolar: gInput.dolar,
        usd: gInput.usd,
        desc: gInput.desc,
        prov: gInput.prov,
        fact: gInput.fact,
      };
      // Insertar ordenado o al final
      nuevosGastos.push(nuevo);
      triggerToast('Gasto registrado con éxito ✔', 'success');
    }

    await persistGastos(nuevosGastos);
  };

  const handleIniciarEdicion = (gasto: Gasto) => {
    setEditandoGasto(gasto);
    // Hacer scroll suave hacia el formulario
    document.getElementById('gasto-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelarEdicion = () => {
    setEditandoGasto(null);
  };

  const handleSolicitarEliminar = (id: string) => {
    setDeleteModal({ isOpen: true, targetId: id });
  };

  const confirmarEliminarGasto = async () => {
    const id = deleteModal.targetId;
    if (id) {
      const nuevosGastos = gastos.filter((g) => g.id !== id);
      await persistGastos(nuevosGastos);
      triggerToast('Gasto eliminado exitosamente', 'info');
      
      // Si el gasto que se estaba editando fue eliminado, cancelar edición
      if (editandoGasto?.id === id) {
        setEditandoGasto(null);
      }
    }
    setDeleteModal({ isOpen: false, targetId: null });
  };

  // ─── IMPORTAR / EXPORTAR CSV ─────────────────────────────────
  const handleExportarCSV = () => {
    if (gastos.length === 0) {
      triggerToast('No hay gastos registrados para exportar', 'error');
      return;
    }

    const cols = ['id', 'fecha', 'cat', 'ars', 'dolar', 'usd', 'desc', 'prov', 'fact'];
    const headers = ['ID', 'Fecha', 'Categoria', 'Importe AR$', 'Cotizacion Referencia USD', 'Equivalente USD', 'Descripcion Gasto', 'Proveedor', 'Factura o Comprobante'];

    const contentRows = gastos.map((g) =>
      cols
        .map((colName) => {
          const val = g[colName as keyof Gasto];
          const text = val !== null && val !== undefined ? String(val) : '';
          // Escapar comillas dobles y encerrar entre comillas para CSV seguro
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    // BOM UTF-8 para garantizar acentos en Windows Excel local
    const csvContent = '\uFEFF' + [headers.join(','), ...contentRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `gastos_obra_pc_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Reporte CSV descargado ✔', 'success');
  };

  const handleImportarCSVClick = () => {
    document.getElementById('csv-file-input')?.click();
  };

  const handleProcesarCSVInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text
          .replace(/^\ufeff/, '') // Quitar BOM si existe
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l !== '');

        if (lines.length < 2) {
          triggerToast('El archivo CSV está vacío o incompleto', 'error');
          return;
        }

        // Parseador básico de líneas CSV respetando comillas dobles
        const parseCsvLine = (line: string) => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
              result.push(current);
              current = '';
            } else {
              current += ch;
            }
          }
          result.push(current);
          return result;
        };

        const headers = parseCsvLine(lines[0]).map((h) => h.replace(/"/g, '').trim().toLowerCase());
        
        let importadosCount = 0;
        const nuevosGastos = [...gastos];

        for (let i = 1; i < lines.length; i++) {
          const vals = parseCsvLine(lines[i]).map((v) => v.replace(/^"|"$/g, '').trim());
          if (vals.length < 3) continue;

          // Mapear dinámicamente según encabezado para flexibilizar la importación
          const rowData: Record<string, string> = {};
          headers.forEach((headerName, index) => {
            rowData[headerName] = vals[index] || '';
          });

          // Verificar campos mínimos
          const rawFecha = rowData['fecha'] || rowData['fecha_pago'] || '';
          const rawCat = (rowData['categoria'] || rowData['cat'] || 'Varios') as any;
          const rawArs = parseFloat(rowData['importe ar$'] || rowData['ars'] || rowData['importe'] || '0');
          const rawDesc = rowData['descripcion gasto'] || rowData['descripcion'] || rowData['desc'] || '';

          if (!rawFecha || isNaN(rawArs) || rawArs <= 0 || !rawDesc) {
            continue;
          }

          // Resolver tipos o cotización opcional
          const rawDolar = parseFloat(rowData['cotizacion referencia usd'] || rowData['cotizacion usd del dia'] || rowData['dolar'] || '0');
          const finalDolar = !isNaN(rawDolar) && rawDolar > 0 ? rawDolar : null;
          const finalUsd = finalDolar ? rawArs / finalDolar : null;

          const gId = rowData['id'] || Date.now().toString(36) + Math.random().toString(36).slice(2);

          // Evitar colisiones duplicadas de ID
          if (nuevosGastos.some((x) => x.id === gId)) {
            continue;
          }

          nuevosGastos.push({
            id: gId,
            fecha: rawFecha,
            cat: ['Materiales', 'Mano de Obra', 'Herramientas', 'Servicios', 'Transporte', 'Varios'].includes(rawCat) ? rawCat : 'Varios',
            ars: rawArs,
            dolar: finalDolar,
            usd: finalUsd,
            desc: rawDesc,
            prov: rowData['proveedor'] || '',
            fact: rowData['factura o comprobante'] || rowData['factura'] || '',
          });
          importadosCount++;
        }

        if (importadosCount > 0) {
          await persistGastos(nuevosGastos);
          triggerToast(`Se importaron ${importadosCount} gastos desde el CSV ✔`, 'success');
        } else {
          triggerToast('No se encontraron registros nuevos válidos en el CSV', 'info');
        }

      } catch (err) {
        console.error('Error parseando CSV:', err);
        triggerToast('Error de formato al cargar el CSV', 'error');
      }
      
      // Limpiar input file
      e.target.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col justify-between selection:bg-[#38bdf8]/30 selection:text-[#38bdf8]">
      {/* DECORACIÓN TOP BAR DE ESCRITORIO (ESTILO ELECTRON DESKTOP) */}
      <div className="bg-[#1e293b] border-b border-[#334155] px-4 py-1.5 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          <span className="text-[#94a3b8] font-mono text-[10px] ml-1.5">ObraForge Desktop &bull; Electron Active</span>
        </div>
        <div className="text-[#64748b] text-[10px] uppercase tracking-wider font-semibold font-mono hidden sm:block">
          {syncState.isConnected ? 'LOCAL DRIVE ENGINE v1.0.4' : 'VOLATILE MEMORY CLIENT v1.0.4'}
        </div>
        <div className="w-16" />
      </div>

      {/* MENÚ SUPERIOR DE ESCRITORIO ESTILO IDE */}
      <div className="bg-[#111827] border-b border-[#334155] px-6 py-1 flex gap-5 text-[11px] text-[#94a3b8] select-none font-sans font-medium uppercase tracking-wider">
        <span className="hover:text-[#f1f5f9] cursor-pointer">Archivo</span>
        <span className="hover:text-[#f1f5f9] cursor-pointer">Edición</span>
        <span className="hover:text-[#f1f5f9] cursor-pointer">Visualizar</span>
        <span className="hover:text-[#f1f5f9] cursor-pointer" onClick={handleManualSync}>Sincronizar</span>
        <span className="hover:text-[#f1f5f9] cursor-pointer text-[#e8b84b]">Obra actual</span>
        <span className="hover:text-[#f1f5f9] cursor-pointer ml-auto text-[10px] lowercase normal-case tracking-normal">
          Ref: 2026-06-03
        </span>
      </div>

      {/* CABECERA (HEADER) */}
      <header className="bg-[#1e293b] border-b border-[#334155] py-3.5 px-6 sticky top-0 z-40 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-[1.5px] text-[#38bdf8] leading-none flex items-center gap-2 select-none">
            ⚒ OBRA DIGITAL
          </h1>
          <div className="text-[10px] tracking-[1.5px] text-[#94a3b8] uppercase font-semibold mt-1">
            CONTROL DE COSTOS DE CONSTRUCCIÓN &bull; PERSISTENCIA INDEPENDIENTE EN PC
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BOTÓN CSV EXPORT */}
          <button
            onClick={handleExportarCSV}
            className="btn-secondary cursor-pointer text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Exportar base actual de gastos a planilla de Excel (CSV)"
            id="btn-app-export"
          >
            <FileDown className="w-3.5 h-3.5 text-[#38bdf8]" />
            Descargar CSV
          </button>

          {/* BOTÓN CSV IMPORT */}
          <button
            onClick={handleImportarCSVClick}
            className="btn-secondary cursor-pointer text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Importar gastos desde planilla CSV"
            id="btn-app-import"
          >
            <FileUp className="w-3.5 h-3.5 text-[#10b981]" />
            Cargar CSV
          </button>
          
          <input
            type="file"
            id="csv-file-input"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleProcesarCSVInput}
          />

          <button
            onClick={() => {
              document.getElementById('gasto-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-primary cursor-pointer text-xs py-1.5 px-4 shadow-sm"
            id="btn-scroll-new"
          >
            + Registrar Gasto
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-[1200px] w-full mx-auto p-4 sm:p-5 lg:p-6 space-y-5 flex-grow">
        
        {/* PANEL CONECTOR DE CARPETA LOCAL (ELECTRON / FILE SYSTEM API) */}
        <FolderSyncPanel
          syncState={syncState}
          onConnectFolder={handleConnectFolder}
          onDisconnectFolder={handleDisconnectFolder}
          onManualSync={handleManualSync}
        />

        {/* TARJETAS RESUMEN METRICAS */}
        <ResumeCards filtrados={gastos} />

        {/* GRÁFICOS VISUALIZADORES */}
        <ChartsPanel filtrados={gastos} />

        {/* FORMULARIO DE REGISTRO */}
        <GastoForm
          editandoGasto={editandoGasto}
          onGuardar={handleGuardarGasto}
          onCancelarEdicion={handleCancelarEdicion}
          isConnected={syncState.isConnected}
        />

        {/* TABLA HISTORIAL DE REGISTROS */}
        <GastoTable
          gastos={gastos}
          onEditar={handleIniciarEdicion}
          onEliminar={handleSolicitarEliminar}
        />
      </main>

      {/* PIE DE PÁGINA (FOOTER) */}
      <footer className="bg-[#111827] border-t border-[#334155] py-3.5 px-6 text-center text-xs text-[#94a3b8]">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p>&copy; {new Date().getFullYear()} Control de Gastos de Obra Independiente.</p>
          <p className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>Estado del Almacenamiento:</span>
            {syncState.isConnected ? (
              <span className="text-[#10b981] font-semibold">● DIRECTO AL DISCO ({syncState.folderName})</span>
            ) : (
              <span className="text-[#ea580c] font-semibold">● TEMPORAL DEL NAVEGADOR</span>
            )}
          </p>
        </div>
      </footer>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn" id="delete-confirm-modal">
          <div className="bg-[#1a1915] border border-red-500 rounded-[10px] p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-display tracking-[1.5px] text-lg text-red-500 mb-2.5 uppercase flex items-center gap-1.5">
              <Trash2 className="w-5 h-5" />
              ¿Confirmar Eliminación?
            </h3>
            <p className="text-[#7a7668] text-xs leading-relaxed mb-5">
              ¿Está completamente seguro de eliminar este gasto de obra de manera permanente? Esta acción se guardará directamente en su PC y no se puede deshacer.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setDeleteModal({ isOpen: false, targetId: null })}
                className="btn btn-secondary cursor-pointer py-1.5 px-3 text-xs"
                id="btn-delete-cancel"
              >
                No, mantener
              </button>
              <button
                onClick={confirmarEliminarGasto}
                className="btn btn-danger cursor-pointer py-1.5 px-4 text-xs bg-red-600/10 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                id="btn-delete-confirm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENTE TOAST EN PANTALLA */}
      {toast.type && (
        <div 
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border shadow-xl z-50 text-xs font-medium font-sans flex items-center gap-2.5 animate-fadeIn ${
            toast.type === 'success' 
              ? 'bg-[#1a1915] border-[#2ecc71] text-[#2ecc71]' 
              : toast.type === 'error'
              ? 'bg-[#1a1915] border-red-500 text-red-400'
              : 'bg-[#1a1915] border-[#e8b84b] text-[#e8b84b]'
          }`}
          id="toast-notification-toast"
        >
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-[#2ecc71]" />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
          {toast.type === 'info' && <AlertTriangle className="w-4 h-4 text-[#e8b84b]" />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
