/**
 * Leaflet Map Component — drop-in replacement for the Google Maps version.
 * Uses OpenStreetMap tiles (free, no API key required).
 * Dark tile layer from CartoDB to match the site's dark theme.
 */
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    L?: any;
  }
}

let leafletLoaded: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (window.L) return Promise.resolve();
  if (leafletLoaded) return leafletLoaded;

  leafletLoaded = new Promise((resolve, reject) => {
    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Leaflet"));
    document.head.appendChild(script);
  });

  return leafletLoaded;
}

export interface LeafletMap {
  panTo: (lat: number, lng: number) => void;
  setZoom: (zoom: number) => void;
  setView: (lat: number, lng: number, zoom: number) => void;
  addMarker: (lat: number, lng: number, opts?: { title?: string; html?: string; onClick?: () => void }) => any;
  removeMarker: (marker: any) => void;
  raw: any; // underlying L.map instance
}

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: LeafletMap) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 43.5, lng: 22 },
  initialZoom = 6,
  onMapReady,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then(() => {
      if (cancelled || !containerRef.current || mapInstanceRef.current) return;

      const L = window.L;
      const map = L.map(containerRef.current, {
        center: [initialCenter.lat, initialCenter.lng],
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark tile layer from CartoDB
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstanceRef.current = map;

      // Build wrapper
      const wrapper: LeafletMap = {
        panTo: (lat, lng) => map.panTo([lat, lng]),
        setZoom: (z) => map.setZoom(z),
        setView: (lat, lng, z) => map.setView([lat, lng], z),
        addMarker: (lat, lng, opts) => {
          const markerOpts: any = {};
          if (opts?.html) {
            markerOpts.icon = L.divIcon({
              html: opts.html,
              className: "evo-custom-marker",
              iconSize: [36, 36],
              iconAnchor: [18, 36],
            });
          }
          const marker = L.marker([lat, lng], markerOpts).addTo(map);
          if (opts?.title) marker.bindTooltip(opts.title);
          if (opts?.onClick) marker.on("click", opts.onClick);
          return marker;
        },
        removeMarker: (marker) => {
          if (marker) map.removeLayer(marker);
        },
        raw: map,
      };

      if (onMapReady) onMapReady(wrapper);
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <style>{`
        .evo-custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      <div ref={containerRef} className={cn("w-full h-[500px]", className)} />
    </>
  );
}
