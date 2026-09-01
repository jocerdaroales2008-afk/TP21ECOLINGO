import { createClient } from '@supabase/supabase-js';
import type { CleanPoint, MaterialCategory } from '@/types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const client = url && key ? createClient(url, key) : null;

interface OfficialPointRow {
  id: number;
  name: string;
  address: string;
  commune: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  accepted_materials: string[] | null;
  hours: string | null;
}

const materialKeywords: Record<MaterialCategory, string[]> = {
  organico: ['orgánico', 'organico', 'compost'],
  papel: ['papel', 'cartón', 'carton'],
  plastico: ['plástico', 'plastico', 'pet'],
  vidrio: ['vidrio'],
  metal: ['metal', 'aluminio', 'lata'],
  raee: ['electrónico', 'electronico', 'raee'],
  pilas: ['pila', 'batería', 'bateria'],
  textil: ['textil', 'ropa'],
  peligroso: ['peligroso', 'químico', 'quimico'],
};

function normalizeMaterials(values: string[] | null): MaterialCategory[] {
  const source = (values ?? []).join(' ').toLowerCase();
  const materials = (Object.entries(materialKeywords) as [MaterialCategory, string[]][]) 
    .filter(([, keywords]) => keywords.some((keyword) => source.includes(keyword)))
    .map(([category]) => category);

  return materials.length > 0 ? materials : ['papel', 'plastico', 'vidrio', 'metal', 'raee', 'pilas', 'textil'];
}

export async function getOfficialRecyclingPoints(): Promise<CleanPoint[]> {
  if (!client) throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para cargar los puntos oficiales.');

  const { data, error } = await client
    .from('recycling_points')
    .select('id, name, address, commune, region, latitude, longitude, accepted_materials, hours')
    .order('region')
    .order('commune')
    .returns<OfficialPointRow[]>();

  if (error) throw new Error(`No se pudieron cargar los puntos oficiales: ${error.message}`);

  return (data ?? [])
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    .map((point) => ({
      id: point.id,
      name: point.name,
      address: [point.address, point.commune, point.region].filter(Boolean).join(', '),
      lat: point.latitude,
      lng: point.longitude,
      materials: normalizeMaterials(point.accepted_materials),
      distance: 0,
      hours: point.hours || 'Horario no disponible',
    }));
}