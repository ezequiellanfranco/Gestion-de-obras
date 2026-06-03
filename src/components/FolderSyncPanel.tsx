/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Folder, RefreshCw, FolderCheck, AlertTriangle, Cpu, Terminal, ShieldAlert } from 'lucide-react';
import { FolderSyncState } from '../types';
import { isFileSystemApiSupported } from '../lib/fileSystem';

interface FolderSyncPanelProps {
  syncState: FolderSyncState;
  onConnectFolder: () => Promise<void>;
  onDisconnectFolder: () => void;
  onManualSync: () => Promise<void>;
}

export default function FolderSyncPanel({
  syncState,
  onConnectFolder,
  onDisconnectFolder,
  onManualSync,
}: FolderSyncPanelProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showElectronGuide, setShowElectronGuide] = useState(false);
  
  const apiSupported = isFileSystemApiSupported();
  
  // Detectar si estamos en un iframe
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleManualSyncClick = async () => {
    setIsSyncing(true);
    try {
      await onManualSync();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  return (
    <div className="bg-[#131c2e] border border-[#334155] rounded-md p-5 relative overflow-hidden" id="folder-sync-panel">
      {/* Indicador de estado superior */}
      <div className="absolute top-0 right-0 left-0 h-[3px] bg-[#38bdf8] opacity-80" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded ${syncState.isConnected ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]' : 'bg-[rgba(56,189,248,0.08)] text-[#38bdf8]'}`}>
            {syncState.isConnected ? <FolderCheck className="w-5.5 h-5.5 animate-pulse" /> : <Folder className="w-5.5 h-5.5" />}
          </div>
          <div>
            <h3 className="font-display font-medium text-sm tracking-[1.5px] uppercase text-[#f1f5f9] flex items-center gap-2">
              ALMACENAMIENTO LOCAL EN PC
              {syncState.isConnected ? (
                <span className="text-[10px] bg-[rgba(16,185,129,0.12)] text-[#10b981] px-2 py-0.5 rounded font-sans tracking-normal capitalize font-semibold border border-[rgba(16,185,129,0.2)] select-none">
                  Sincronizado
                </span>
              ) : (
                <span className="text-[10px] bg-[rgba(234,88,12,0.1)] text-[#ea580c] px-2 py-0.5 rounded font-sans tracking-normal capitalize font-semibold border border-[rgba(234,88,12,0.2)] select-none">
                  Navegador temporal
                </span>
              )}
            </h3>
            <p className="text-xs text-[#94a3b8] mt-1 max-w-xl">
              {syncState.isConnected
                ? `Los datos se escriben automáticamente en el archivo "gastos_obra.json" dentro de su carpeta local: "${syncState.folderName}"`
                : 'La aplicación está usando la memoria de este navegador. Conecte una carpeta de su PC para persistir sus gastos localmente de forma indefinida y fuera del navegador.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {syncState.isConnected ? (
            <>
              <button
                onClick={handleManualSyncClick}
                disabled={isSyncing}
                className="btn-secondary flex items-center gap-2 text-xs py-1.5 px-3 hover:border-[#10b981] hover:text-[#10b981]"
                id="btn-manual-sync"
                title="Sincronizar archivo local"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Guardando...' : 'Escribir ahora'}
              </button>
              <button
                onClick={onDisconnectFolder}
                className="btn-danger text-xs py-1.5 px-3"
                id="btn-disconnect-folder"
              >
                Desconectar
              </button>
            </>
          ) : (
            <button
              onClick={onConnectFolder}
              disabled={!apiSupported}
              className="btn-primary flex items-center gap-2 text-xs py-1.5 px-3.5 cursor-pointer"
              id="btn-connect-folder"
            >
              <Folder className="w-4 h-4" />
              Seleccionar Carpeta
            </button>
          )}

          <button
            onClick={() => setShowElectronGuide(!showElectronGuide)}
            className="btn-secondary flex items-center gap-2 text-xs py-1.5 px-3"
            id="btn-toggle-guide"
          >
            <Cpu className="w-3.5 h-3.5 text-[#38bdf8]" />
            {showElectronGuide ? 'Ocultar Guía' : 'Guía Electron'}
          </button>
        </div>
      </div>

      {/* Alertas de soporte de navegadores */}
      {!apiSupported && (
        <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 rounded flex items-start gap-2.5">
          <ShieldAlert className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs text-red-200/90 leading-relaxed">
            <strong>Su navegador no soporta la API nativa de Archivos:</strong> Para seleccionar carpetas directamente en el disco, utilice un navegador derivado de Chromium (Google Chrome, Microsoft Edge, Opera) en versiones de escritorio de Windows, macOS o Linux. Puede seguir registrando y exportando como CSV de todos modos.
          </div>
        </div>
      )}

      {apiSupported && isIframe && !syncState.isConnected && (
        <div className="mt-4 p-3 bg-[#0284c7]/10 border border-[#38bdf8]/20 rounded flex items-start gap-2.5">
          <AlertTriangle className="w-4.5 h-4.5 text-[#38bdf8] shrink-0 mt-0.5" />
          <div className="text-xs text-[#cbd5e1]/90 leading-relaxed">
            <strong>Restricciones de Sandbox:</strong> Al estar visualizando esto dentro de un panel integrado, es posible que el navegador bloquee el acceso directo a sus carpetas. Si el botón no abre el selector de carpetas: 
            <a 
              href={window.location.href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-1.5 font-bold text-[#38bdf8] underline hover:text-[#0284c7]"
            >
              Abra la aplicación en una pestaña nueva completa aquí ↗
            </a>.
          </div>
        </div>
      )}

      {syncState.error && (
        <div className="mt-3 text-xs text-red-400 bg-red-950/20 px-3 py-2 rounded border border-red-900/35 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span>{syncState.error}</span>
        </div>
      )}

      {syncState.lastSyncTime && syncState.isConnected && (
        <div className="mt-3 text-[10px] text-[#64748b] font-mono text-right">
          Ultima sincronización exitosa en disco: {syncState.lastSyncTime}
        </div>
      )}

      {/* GUÍA DE ESCRITORIO (ELECTRON) */}
      {showElectronGuide && (
        <div className="mt-5 pt-4 border-t border-[#334155] animate-fadeIn text-xs">
          <h4 className="font-display font-medium text-xs text-[#38bdf8] tracking-[1.5px] uppercase mb-2">
            CONVERTIR ESTA WEB EN UN PROGRAMA DE ESCRITORIO (.EXE / .APP)
          </h4>
          <p className="text-[#94a3b8] leading-relaxed mb-3">
            Para convertir esta aplicación de control de gastos de obra en un programa de escritorio independiente de PC, utilizaremos <strong>Electron</strong>. Siga este proceso de 3 pasos sencillos para tener el ejecutable instalado localmente:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#1e293b]/50 border border-[#334155] rounded p-3">
              <div className="font-bold text-[#38bdf8] flex items-center gap-1.5 mb-1.5">
                <span className="bg-[#38bdf8]/10 text-[#38bdf8] w-4 h-4 rounded-full flex items-center justify-center text-[10px]">1</span>
                Crear archivo principal
              </div>
              <p className="text-[#94a3b8] text-[11px] leading-snug">
                Cree una carpeta vacía en su PC (ej: <code>gastos-obra-app</code>) y guarde un archivo de texto llamado <code>main.js</code> con este código básico:
              </p>
              <pre className="bg-[#0f172a] text-[#f1f5f9] p-1.5 rounded font-mono text-[9px] mt-2 overflow-x-auto select-all max-h-[100px] border border-[#334155]">
{`const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 850,
    title: "Gastos Obra",
    webPreferences: {
      nodeIntegration: true
    },
    backgroundColor: '#0f172a',
    autoHideMenuBar: true
  });
  win.loadURL('${window.location.protocol}//${window.location.host}');
}

app.whenReady().then(createWindow);`}
              </pre>
            </div>

            <div className="bg-[#1e293b]/50 border border-[#334155] rounded p-3">
              <div className="font-bold text-[#38bdf8] flex items-center gap-1.5 mb-1.5">
                <span className="bg-[#38bdf8]/10 text-[#38bdf8] w-4 h-4 rounded-full flex items-center justify-center text-[10px]">2</span>
                Definir Manifest
              </div>
              <p className="text-[#94a3b8] text-[11px] leading-snug">
                Cree el manifesto de NPM con un archivo de texto llamado <code>package.json</code> en la misma carpeta:
              </p>
              <pre className="bg-[#0f172a] text-[#f1f5f9] p-1.5 rounded font-mono text-[9px] mt-2 overflow-x-auto select-all max-h-[100px] border border-[#334155]">
{`{
  "name": "gastos-obra",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "dependencies": {
    "electron": "^28.0.0"
  }
}`}
              </pre>
            </div>

            <div className="bg-[#1e293b]/50 border border-[#334155] rounded p-3">
              <div className="font-bold text-[#38bdf8] flex items-center gap-1.5 mb-1.5">
                <span className="bg-[#38bdf8]/10 text-[#38bdf8] w-4 h-4 rounded-full flex items-center justify-center text-[10px]">3</span>
                Ejecutar y Empaquetar
              </div>
              <p className="text-[#94a3b8] text-[11px] leading-snug">
                Abra una consola en esa carpeta y corra los siguientes comandos. Puede empaquetar con <code>electron-packager</code> o <code>electron-builder</code>:
              </p>
              <div className="bg-[#0f172a] text-[#10b981] p-1.5 rounded font-mono text-[9px] mt-1.5 leading-snug border border-[#334155]">
                <p># Instalar Electron</p>
                <p className="text-[#f1f5f9]">npm install</p>
                <p className="mt-1"># Probar la app</p>
                <p className="text-[#f1f5f9]">npm start</p>
                <p className="mt-1"># Compilar un .exe (.app en Mac)</p>
                <p className="text-[#f1f5f9]">npx electron-packager . GastosObra --platform=win32 --arch=x64 --out=dist</p>
              </div>
            </div>
          </div>
          <div className="mt-3.5 p-2 bg-[#3b82f6]/5 rounded text-[11px] text-[#38bdf8]/80 border border-[#334155] flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span><strong>Ventaja Clave de usar Carpeta Sincronizada:</strong> Tanto la web como su app compilada de Electron pueden usar carpetas idénticas de su PC. Sus datos estarán en un directorio de su disco duro como un archivo JSON común, permitiendo editarlo con Excel, Visualizarlo, o copiarlo como backup en un pendrive de forma instantánea.</span>
          </div>
        </div>
      )}
    </div>
  );
}
