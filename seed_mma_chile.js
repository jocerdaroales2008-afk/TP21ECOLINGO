import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MMA_API_URL = 'https://economiacircular.mma.gob.cl/wp-json/mma/v1/puntos-limpios';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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
    const response = await fetch(MMA_API_URL, {
      headers: {
        'User-Agent': 'EcoLingo/1.0 (puntos limpios MMA Chile)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor del MMA: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('La respuesta del MMA no tiene el formato esperado.');
    console.log(`Se encontraron ${data.length} puntos oficiales registrados por el gobierno de Chile.`);

    const puntosFormateados = data
      .map((item) => {
        const materiales = toMaterials(item.materiales);
        return {
          name: item.nombre || item.title || 'Punto Limpio MMA',
          address: item.direccion || item.address || 'Sin dirección registrada',
          commune: item.comuna || item.city || 'Chile',
          region: item.region || item.state || 'Chile',
          latitude: toNumber(item.latitud, item.lat),
          longitude: toNumber(item.longitud, item.lng, item.lon),
          accepted_materials: materiales.length > 0 ? materiales : ['Reciclaje General'],
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
