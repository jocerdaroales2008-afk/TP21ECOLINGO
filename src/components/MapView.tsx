import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistance, type GeoLocation } from '@/hooks/useGeolocation';
import type { CleanPoint } from '@/types';

interface MapViewProps {
  points: (CleanPoint & { realDistance: number })[];
  userLocation: GeoLocation | null;
}

export function MapView({ points, userLocation }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pointMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = [-33.445, -70.667];
    const map = L.map(containerRef.current, { zoomControl: false }).setView(center, 12);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      pointMarkersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
      }).addTo(map).bindPopup('<strong>Tu ubicación actual</strong>');

      map.setView([userLocation.lat, userLocation.lng], 14, { animate: true });
    }
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
        `<strong>${p.name}</strong><br>${p.address}<br><small>${p.hours}</small><br><strong>${formatDistance(p.realDistance)}</strong>`,
      );
      pointMarkersRef.current.push(marker);
    });

    if (points.length > 0) {
      const allLatLngs: [number, number][] = points.map((p) => [p.lat, p.lng]);
      if (userLocation) allLatLngs.push([userLocation.lat, userLocation.lng]);
      if (allLatLngs.length > 1) {
        map.fitBounds(L.latLngBounds(allLatLngs).pad(0.15), { animate: true });
      }
    }
  }, [points, userLocation]);

  return (
    <div className="eco-card overflow-hidden">
      <style>{`@keyframes eco-ping{0%{transform:scale(1);opacity:0.6}100%{transform:scale(3);opacity:0}}`}</style>
      <div ref={containerRef} className="h-[380px] w-full" />
    </div>
  );
}
