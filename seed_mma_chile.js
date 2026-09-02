import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MMA_API_URL = 'https://puntoslimpios.mma.gob.cl/api/points/geo';

const REGION_CENTERS = [
  [-20.214, -70.152], [-23.650, -70.400], [-27.367, -70.332], [-29.904, -71.249],
  [-32.890, -71.252], [-33.448, -70.669], [-34.170, -70.740], [-35.426, -71.655],
  [-36.827, -73.050], [-36.606, -72.103], [-37.469, -72.352], [-38.736, -72.590],
  [-39.814, -73.245], [-41.469, -72.942], [-43.118, -73.620], [-53.163, -70.917],
];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.includes('your_')) {
  throw new Error('Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY antes de ejecutar el seed.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function toMaterials(value) {
  if (Array.isArray(value)) return value.map(String).map((material) => material.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((material) => material.trim()).filter(Boolean);
  return [];
}

function toNumber(...values) {
  for (const value of values) {
    const number = Number.parseFloat(String(value ?? '').replace(',', '.'));
    if (Number.isFinite(number)) return number;
  }
  return Number.NaN;
}

async function cargarPuntosOficialesMMA() {
  console.log('Conectando a la base de datos oficial del Ministerio del Medio Ambiente...');

  try {
    const responses = await Promise.all(REGION_CENTERS.map(async ([lat, lng]) => {
      const url = new URL(MMA_API_URL);
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lng', String(lng));
      url.searchParams.set('distance', '100');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'EcoLingo/1.0 (puntos limpios MMA Chile)',
          Accept: 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Error en el servidor del MMA: ${response.status} ${response.statusText}`);
      return response.json();
    }));

    const data = [...new Map(responses.flat().map((item) => [`${item.lat},${item.lng}`, item])).values()];
    console.log(`Se encontraron ${data.length} puntos oficiales registrados por el gobierno de Chile.`);

    const puntosFormateados = data
      .map((item) => {
        const materiales = toMaterials(item.materiales);
        return {
          name: item.manager || item.owner || (item.type === 'pl' ? 'Punto Limpio MMA' : 'Punto Verde MMA'),
          address: [item.address_type, item.address_name, item.address_number].filter(Boolean).join(' ') || 'Sin dirección registrada',
          commune: item.commune?.name || 'Chile',
          region: item.region?.name || 'Chile',
          latitude: toNumber(item.lat),
          longitude: toNumber(item.lng),
          accepted_materials: materiales.length > 0 ? materiales : ['Reciclaje General'],
          hours: item.status ? `Estado: ${item.status}` : 'Horario no disponible',
          created_at: new Date().toISOString(),
        };
      })
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

    console.log(`Insertando ${puntosFormateados.length} puntos limpios validados en Supabase...`);

    const chunkSize = 100;
    for (let i = 0; i < puntosFormateados.length; i += chunkSize) {
      const chunk = puntosFormateados.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('recycling_points')
        .upsert(chunk, { onConflict: 'latitude,longitude' });

      if (error) throw new Error(`Error en el lote ${i / chunkSize + 1}: ${error.message}`);
      console.log(`Lote ${i / chunkSize + 1} cargado (${chunk.length} puntos).`);
    }

    console.log('Carga oficial completada.');
  } catch (error) {
    console.error('Ocurrió un error durante la descarga:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

cargarPuntosOficialesMMA();
