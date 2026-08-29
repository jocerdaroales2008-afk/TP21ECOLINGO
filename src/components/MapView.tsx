import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistance, type GeoLocation } from '@/hooks/useGeolocation';
import { MATERIAL_LABELS, type CleanPoint } from '@/types';
import { MapPin, AlertCircle } from 'lucide-react';

interface MapViewProps {
  points: (CleanPoint & { realDistance: number })[];
  userLocation: GeoLocation | null;
  onUseLocation: () => void;
  isLoadingLocation: boolean;
  locationError: string | null;
}

export function MapView({ points, userLocation, onUseLocation, isLoadingLocation, locationError }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pointMarkersRef = useRef<L.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Inicializar mapa una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const center: [number, number] = [-33.445, -70.667];
      const map = L.map(containerRef.current, { 
        zoomControl: false,
        dragging: true,
        tap: true,
      }).setView(center, 12);
      
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);

      return () => {
        if (mapRef.current) {
          mapRef.current.off();
          mapRef.current.remove();
          mapRef.current = null;
        }
        userMarkerRef.current = null;
        pointMarkersRef.current = [];
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);

  // Actualizar marcador de usuario
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (userLocation) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="position:relative"><div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px #0006;position:relative;z-index:2"></div><div style="position:absolute;inset:-8px;border-radius:50%;background:#2563eb33;animation:eco-ping 1.5s ease-out infinite"></div></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      }).addTo(map).bindPopup('<strong>¡Estás aquí!</strong>');

      map.setView([userLocation.lat, userLocation.lng], 14, { animate: true });
    }
  }, [userLocation, mapReady]);

  // Actualizar marcadores de puntos limpios
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    pointMarkersRef.current.forEach((m) => map.removeLayer(m));
    pointMarkersRef.current = [];

    points.forEach((p, i) => {
      const marker = L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:32px;height:32px;border-radius:50%;background:#166534;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;border:3px solid white;box-shadow:0 2px 8px #0004">${i + 1}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      }).addTo(map);

      marker.bindPopup(
        `<div style="max-width:200px"><strong>${p.name}</strong><br/><small>${p.address}</small><br/><small style="color:#666">Acepta: ${p.materials.map((material) => MATERIAL_LABELS[material]).join(', ')}</small><br/><small>${p.hours}</small><br/><strong style="color:#2563eb">${formatDistance(p.realDistance)}</strong><br/><a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noreferrer" style="color:#2563eb;text-decoration:underline">Cómo llegar →</a></div>`,
        { maxWidth: 250 }
      );
      pointMarkersRef.current.push(marker);
    });

    // Ajustar vista
    if (points.length > 0) {
      const allLatLngs: [number, number][] = points.map((p) => [p.lat, p.lng]);
      if (userLocation) allLatLngs.push([userLocation.lat, userLocation.lng]);
      if (allLatLngs.length > 1) {
        map.fitBounds(L.latLngBounds(allLatLngs).pad(0.15), { animate: true, maxZoom: 15 });
      }
    }
  }, [points, userLocation, mapReady]);

  return (
    <div className="flex flex-col h-full w-full bg-forest-50 dark:bg-forest-950 rounded-xl overflow-hidden border border-forest-200 dark:border-forest-800">
      <style>{`@keyframes eco-ping{0%{transform:scale(1);opacity:0.6}100%{transform:scale(3);opacity:0}}`}</style>
      
      {/* Botón de geolocalización */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={onUseLocation}
          disabled={isLoadingLocation}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-forest-800 text-forest-900 dark:text-white rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-50 border border-forest-200 dark:border-forest-700"
        >
          <MapPin size={18} />
          <span className="text-sm font-semibold">
            {isLoadingLocation ? '📍 Localizando...' : '📍 Mi ubicación'}
          </span>
        </button>
        
        {locationError && (
          <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg text-xs max-w-xs border border-red-200 dark:border-red-800">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{locationError}</span>
          </div>
        )}
      </div>

      {/* Contenedor del mapa */}
      <div ref={containerRef} className="flex-1 w-full min-h-[400px]" />
    </div>
  );
}
