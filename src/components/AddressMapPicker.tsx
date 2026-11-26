import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';

interface AddressMapPickerProps {
  isDark: boolean;
  onSelectAddress: (address: string) => void;
}

// Fix default Leaflet marker icon in Vite builds
const markerIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `<div style="width:20px;height:20px;border-radius:9999px;background:#0A0A0A;border:3px solid #FFFFFF;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  isDark,
  onSelectAddress,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          onSelectAddress(`${data.display_name} (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
          return;
        }
      }
    } catch {
      // fallback to coordinates
    }
    onSelectAddress(`Position GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  };

  const placeMarker = (lat: number, lng: number) => {
    if (!leafletMap.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: markerIcon }).addTo(
        leafletMap.current
      );
    }
    reverseGeocode(lat, lng);
  };

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [36.8065, 10.1815], // Tunis
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng);
    });

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
      markerRef.current = null;
    };
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        leafletMap.current?.setView([latitude, longitude], 15);
        placeMarker(latitude, longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-400">
          Cliquez sur la carte pour choisir votre position
        </span>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${
            isDark
              ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
              : 'border-neutral-200 bg-neutral-50 text-[#0A0A0A] hover:bg-neutral-100'
          }`}
        >
          <LocateFixed className="w-3 h-3" />
          {locating ? 'Localisation...' : 'Ma position'}
        </button>
      </div>
      <div
        ref={mapRef}
        className={`w-full h-44 rounded-2xl overflow-hidden border z-0 ${
          isDark ? 'border-white/15' : 'border-neutral-200'
        }`}
      />
    </div>
  );
};
