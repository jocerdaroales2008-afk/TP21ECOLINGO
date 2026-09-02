import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistance, type GeoLocation } from '@/hooks/useGeolocation';
import { MATERIAL_LABELS, type CleanPoint } from '@/types';

interface MapViewProps {
  points: (CleanPoint & { realDistance: number })[];
  userLocation: GeoLocation | null;
}

export function MapView({ points, userLocation }: MapViewProps) {
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
      }).setView(center, 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 0);

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
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: L.divIcon({
            className: '',
            html: '<div class="user-location-marker" aria-hidden="true"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map).bindPopup('<strong>¡Estás aquí!</strong>');
      } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      }

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

      const popup = document.createElement('div');
      popup.className = 'recycling-popup';
      const name = document.createElement('strong');
      name.textContent = p.name;
      const address = document.createElement('small');
      address.textContent = p.address;
      const materials = document.createElement('small');
      materials.textContent = `Acepta: ${p.materials.map((material) => MATERIAL_LABELS[material]).join(', ')}`;
      const distance = document.createElement('strong');
      distance.textContent = formatDistance(p.realDistance);
      const link = document.createElement('a');
      link.href = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = 'Cómo llegar';
      popup.append(name, address, materials, distance, link);
      marker.bindPopup(popup, { maxWidth: 250 });
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const refresh = () => map.invalidateSize({ animate: false });
    refresh();
    window.setTimeout(refresh, 100);
    window.addEventListener('resize', refresh);
    return () => window.removeEventListener('resize', refresh);
  }, [mapReady]);

  return (
    <div className="map-shell w-full overflow-hidden rounded-2xl">
      <div ref={containerRef} className="h-[calc(100vh-180px)] min-h-[360px] max-h-[620px] w-full" aria-label="Mapa de puntos de reciclaje" role="application" />
    </div>
  );
}
