import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistance, type GeoLocation } from '@/hooks/useGeolocation';
import { MATERIAL_LABELS, MATERIAL_COLORS, type CleanPoint } from '@/types';

interface MapViewProps {
  points: (CleanPoint & { realDistance: number })[];
  userLocation: GeoLocation | null;
  selectedPointId?: number | null;
  onSelectPoint?: (id: number) => void;
}

export function MapView({ points, userLocation, selectedPointId, onSelectPoint }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pointMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const center: [number, number] = [-33.445, -70.667];
      const map = L.map(containerRef.current, {
        zoomControl: false,
        dragging: true,
      }).setView(center, 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 50);

      return () => {
        if (mapRef.current) {
          mapRef.current.off();
          mapRef.current.remove();
          mapRef.current = null;
        }
        userMarkerRef.current = null;
        pointMarkersRef.current.clear();
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (userLocation) {
      const latlng: [number, number] = [userLocation.lat, userLocation.lng];
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(latlng, {
          icon: L.divIcon({
            className: '',
            html: '<div class="user-location-marker" aria-hidden="true"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map).bindPopup('<strong>¡Estás aquí!</strong>');
      } else {
        userMarkerRef.current.setLatLng(latlng);
      }
    }
  }, [userLocation, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    pointMarkersRef.current.forEach((m) => map.removeLayer(m));
    pointMarkersRef.current.clear();

    points.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:${MATERIAL_COLORS[p.materials[0]] ?? '#166534'};color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);transform:rotate(-45deg)"><span style="transform:rotate(45deg)">${p.name.charAt(0).toUpperCase()}</span></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        }),
      }).addTo(map);

      const popup = document.createElement('div');
      popup.className = 'recycling-popup';
      const name = document.createElement('strong');
      name.textContent = p.name;
      name.style.fontSize = '15px';
      const address = document.createElement('small');
      address.textContent = p.address;
      address.style.color = '#555';
      if (p.region) {
        const region = document.createElement('small');
        region.textContent = p.region;
        region.style.color = '#777';
        region.style.fontWeight = '600';
        popup.append(name, address, region);
      } else {
        popup.append(name, address);
      }
      const hours = document.createElement('small');
      hours.textContent = `Horario: ${p.hours}`;
      hours.style.color = '#444';
      const materialsLabel = document.createElement('small');
      materialsLabel.textContent = 'Materiales que acepta:';
      materialsLabel.style.fontWeight = '700';
      materialsLabel.style.color = '#173b2a';
      const materialsList = document.createElement('div');
      materialsList.style.display = 'flex';
      materialsList.style.flexWrap = 'wrap';
      materialsList.style.gap = '4px';
      materialsList.style.marginTop = '2px';
      p.materials.forEach((mat) => {
        const chip = document.createElement('span');
        chip.textContent = MATERIAL_LABELS[mat];
        chip.style.backgroundColor = `${MATERIAL_COLORS[mat]}18`;
        chip.style.color = MATERIAL_COLORS[mat];
        chip.style.padding = '2px 8px';
        chip.style.borderRadius = '6px';
        chip.style.fontSize = '11px';
        chip.style.fontWeight = '600';
        materialsList.appendChild(chip);
      });
      const distance = document.createElement('strong');
      distance.textContent = `Distancia: ${formatDistance(p.realDistance)}`;
      distance.style.color = '#166534';
      const link = document.createElement('a');
      link.href = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = 'Cómo llegar';
      link.style.display = 'inline-block';
      link.style.marginTop = '4px';
      popup.append(hours, materialsLabel, materialsList, distance, link);
      marker.bindPopup(popup, { maxWidth: 280, minWidth: 200 });

      if (onSelectPoint) {
        marker.on('click', () => onSelectPoint(p.id));
      }

      pointMarkersRef.current.set(p.id, marker);
    });

    if (points.length > 0) {
      const allLatLngs: [number, number][] = points.map((p) => [p.lat, p.lng]);
      if (userLocation) allLatLngs.push([userLocation.lat, userLocation.lng]);
      if (allLatLngs.length > 1) {
        map.fitBounds(L.latLngBounds(allLatLngs).pad(0.2), { animate: true, maxZoom: 14 });
      } else if (allLatLngs.length === 1) {
        map.setView(allLatLngs[0], 14, { animate: true });
      }
    }
  }, [points, userLocation, mapReady, onSelectPoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const refresh = () => map.invalidateSize({ animate: false });
    refresh();
    window.setTimeout(refresh, 100);
    window.setTimeout(refresh, 300);
    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', refresh);
    return () => {
      window.removeEventListener('resize', refresh);
      window.removeEventListener('orientationchange', refresh);
    };
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || selectedPointId == null) return;
    const marker = pointMarkersRef.current.get(selectedPointId);
    if (marker) {
      const point = points.find((p) => p.id === selectedPointId);
      if (point) {
        map.setView([point.lat, point.lng], 15, { animate: true });
        marker.openPopup();
      }
    }
  }, [selectedPointId, mapReady, points]);

  return (
    <div className="map-shell w-full overflow-hidden rounded-2xl">
      <div
        ref={containerRef}
        className="h-[55vh] min-h-[380px] w-full sm:h-[60vh] lg:h-[calc(100vh-220px)] lg:max-h-[680px]"
        aria-label="Mapa de puntos de reciclaje"
        role="application"
      />
    </div>
  );
}
