import type { CleanPoint, MaterialCategory } from '@/types';

// Configuración: Reemplazar con tu API key de Google Maps
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

interface PlacesSearchResult {
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now: boolean;
  };
  rating?: number;
  place_id: string;
}

export async function searchRecyclingCenters(
  lat: number,
  lng: number,
  radius = 5000
): Promise<CleanPoint[]> {
  if (!GOOGLE_API_KEY) {
    console.warn('Google API Key not configured. Set VITE_GOOGLE_API_KEY in .env');
    return [];
  }

  try {
    // Buscar en Google Places API con palabras clave de reciclaje
    const keywords = [
      'punto limpio',
      'centro de reciclaje',
      'reciclaje',
      'basura selectiva',
      'residuos',
    ];

    const results: CleanPoint[] = [];
    const seenPlaces = new Set<string>();

    for (const keyword of keywords) {
      const url = new URL(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
      );
      url.searchParams.set('location', `${lat},${lng}`);
      url.searchParams.set('radius', radius.toString());
      url.searchParams.set('keyword', keyword);
      url.searchParams.set('type', 'establishment');
      url.searchParams.set('key', GOOGLE_API_KEY);

      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error('Error fetching from Google Places API:', response.status);
        continue;
      }

      const data = (await response.json()) as {
        results: PlacesSearchResult[];
        status: string;
      };

      if (data.status === 'OK' && data.results) {
        for (const place of data.results) {
          if (seenPlaces.has(place.place_id)) continue;
          seenPlaces.add(place.place_id);

          const cleanPoint: CleanPoint = {
            id: results.length + 1,
            name: place.name,
            address: place.vicinity,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            materials: inferMaterialsFromName(place.name),
            distance: 0, // Will be calculated by caller
            hours: place.opening_hours?.open_now ? 'Abierto ahora' : 'Horario variable',
          };

          results.push(cleanPoint);

          if (results.length >= 10) break; // Limitar a 10 resultados
        }
      }

      if (results.length >= 10) break;
    }

    return results;
  } catch (error) {
    console.error('Error in searchRecyclingCenters:', error);
    return [];
  }
}

function inferMaterialsFromName(name: string): MaterialCategory[] {
  const lowerName = name.toLowerCase();
  const materials: MaterialCategory[] = [];

  const categoryKeywords: Record<MaterialCategory, string[]> = {
    papel: ['papel', 'cardboard', 'cartón', 'cartón'],
    plastico: ['plástico', 'plastic', 'pet'],
    vidrio: ['vidrio', 'glass', 'botellas'],
    metal: ['metal', 'aluminio', 'lata', 'latería'],
    organico: ['orgánico', 'compost', 'organic'],
    raee: ['electrónico', 'eléctrico', 'raee', 'electronic'],
    pilas: ['pilas', 'batteries', 'batería'],
    textil: ['textil', 'ropa', 'clothing'],
    peligroso: ['peligroso', 'hazardous', 'químico'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => lowerName.includes(kw))) {
      materials.push(category as MaterialCategory);
    }
  }

  // Si no detectó nada específico, asumir que acepta todo
  if (materials.length === 0) {
    return [
      'papel',
      'plastico',
      'vidrio',
      'metal',
      'organico',
      'raee',
      'pilas',
      'textil',
    ];
  }

  return materials;
}

export async function getPlaceDetails(placeId: string) {
  if (!GOOGLE_API_KEY) return null;

  try {
    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/details/json'
    );
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'name,opening_hours,formatted_address,website,formatted_phone_number');
    url.searchParams.set('key', GOOGLE_API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}
