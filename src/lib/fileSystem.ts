/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Gasto } from '../types';

// Comprobar soporte de la API en el cliente
export function isFileSystemApiSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

// Interfaz para persistir el handle en IndexedDB (para intentar recuperar la conexión si es posible)
const DB_NAME = 'ObraFileSystemDB';
const STORE_NAME = 'handles';

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(handle, 'root_directory');
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e);
    };
    request.onerror = (e) => reject(e);
  });
}

export async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get('root_directory');
      getReq.onsuccess = () => {
        resolve(getReq.result || null);
      };
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}

export async function clearSavedDirectoryHandle(): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete('root_directory');
      tx.oncomplete = () => resolve();
    };
    request.onerror = () => resolve();
  });
}

// Verificar o solicitar permisos de lectura/escritura en el handle
export async function verifyPermission(
  fileHandle: any,
  readWrite: boolean = true
): Promise<boolean> {
  const options: any = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }

  // Comprobar si ya tenemos permiso
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }

  // Solicitar permiso al usuario
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }

  return false;
}

// Leer gastos desde el archivo gastos_obra.json en la carpeta dada
export async function readGastosFromDirectory(
  dirHandle: FileSystemDirectoryHandle
): Promise<Gasto[]> {
  try {
    const fileHandle = await dirHandle.getFileHandle('gastos_obra.json', { create: true });
    const file = await fileHandle.getFile();
    const text = await file.text();
    
    if (!text || text.trim() === '') {
      return [];
    }

    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error leyendo gastos_obra.json:', error);
    throw new Error('No se pudo leer el archivo de gastos en el directorio seleccionado.');
  }
}

// Escribir los gastos en el archivo gastos_obra.json en la carpeta seleccionada
export async function writeGastosToDirectory(
  dirHandle: FileSystemDirectoryHandle,
  gastos: Gasto[]
): Promise<void> {
  try {
    const fileHandle = await dirHandle.getFileHandle('gastos_obra.json', { create: true });
    const writable = await fileHandle.createWritable();
    
    // Formatear JSON con espacios para que sea legible en el editor de PC del usuario
    await writable.write(JSON.stringify(gastos, null, 2));
    await writable.close();
  } catch (error) {
    console.error('Error escribiendo en gastos_obra.json:', error);
    throw new Error('Error al guardar datos directamente en el disco. Verifique los permisos.');
  }
}

// Exportar un archivo de texto de backup de configuración rápida para Electron
export function downloadElectronAssets(gastos: Gasto[]): void {
  // Generar un zip de mentira o un bundle html + main para descarga directa
  // El usuario puede crear esta estructura en su computadora de forma sencilla
  const electronMain = `const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    title: "Gastos de Obra Local",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#0f0e0c'
  });

  // Carga la app
  mainWindow.loadURL('https://ezequiellanfranco.github.io/gastos-obra/' || \`file://\${path.join(__dirname, 'index.html')}\`);

  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
`;

  const blobMain = new Blob([electronMain], { type: 'text/javascript' });
  const urlMain = URL.createObjectURL(blobMain);
  const a = document.createElement('a');
  a.href = urlMain;
  a.download = 'electron-main.js';
  a.click();
  URL.revokeObjectURL(urlMain);
}
