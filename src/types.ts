export type MaterialCategory =
  | 'organico'
  | 'papel'
  | 'plastico'
  | 'vidrio'
  | 'metal'
  | 'raee'
  | 'pilas';

export interface RecyclingItem {
  id: string;
  name: string;
  category: MaterialCategory;
  keywords: string[];
  steps: string[];
  tip: string;
  icon: string;
}

export interface MaterialGuide {
  category: MaterialCategory;
  title: string;
  icon: string;
  color: string;
  description: string;
  instructions: {
    separation: string;
    limpieza: string;
    compactacion: string;
  };
  examples: string[];
  notRecyclable: string[];
}

export interface CleanPoint {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  materials: MaterialCategory[];
  distance: number;
  hours: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  threshold: number;
}

export interface RecyclingLog {
  id: string;
  itemId: string;
  itemName: string;
  category: MaterialCategory;
  quantity: number;
  timestamp: number;
}

export const MATERIAL_LABELS: Record<MaterialCategory, string> = {
  organico: 'Orgánico',
  papel: 'Papel/Cartón',
  plastico: 'Plástico',
  vidrio: 'Vidrio',
  metal: 'Metal',
  raee: 'Electrónicos',
  pilas: 'Pilas',
};

export const MATERIAL_COLORS: Record<MaterialCategory, string> = {
  organico: '#8d6e63',
  papel: '#1976d2',
  plastico: '#f57c00',
  vidrio: '#43a047',
  metal: '#757575',
  raee: '#7b1fa2',
  pilas: '#d32f2f',
};
