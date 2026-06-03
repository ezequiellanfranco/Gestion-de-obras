/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoriaGasto =
  | 'Materiales'
  | 'Mano de Obra'
  | 'Herramientas'
  | 'Servicios'
  | 'Transporte'
  | 'Varios';

export interface Gasto {
  id: string;
  fecha: string; // Formato YYYY-MM-DD
  cat: CategoriaGasto;
  ars: number;
  dolar: number | null;
  usd: number | null;
  desc: string;
  prov: string;
  fact: string;
}

export interface FolderSyncState {
  isConnected: boolean;
  folderName: string;
  error: string | null;
  lastSyncTime: string | null;
}
