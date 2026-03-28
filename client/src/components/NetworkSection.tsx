/*
  EVO Maritime Network Section - Interactive Map
  Uses Leaflet with CartoDB dark tiles (no API key required).
  4 cyan glowing office pins, click-to-reveal detail panel on the left.
*/
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { MapPin, Phone, Anchor, Ship, Building, Navigation, X, Mail } from "lucide-react";
import { MapView } from "@/components/Map";
import type { LeafletMap } from "@/components/Map";

// -- Office data
const locations = [
  {
    id: "bulgaria",
    country: "Bulgaria",
    city: "Varna",
    address: "Gen. Kolev 113, Varna",
    phone: "+359 52 300098",
    email: "office@evo-maritime.com",
    role: "Port HQ & Black Sea Operations",
    icon: Anchor,
    flag: "\ud83c\udde7\ud83c\uddec",
    lat: 43.2141,
    lng: 27.9147,
    detail: "Our founding office and Black Sea operations hub. Direct access to the Port of Varna \u2014 Bulgaria's largest port on the Black Sea.",
  },
  {
    id: "romania",
    country: "Romania",
    city: "Constanta",
    address: "Constanta Port, Gate 1",
    phone: "+40 372 903325",
    email: "office@evo-maritime.com",
    role: "Port Operations & River Gateway",
    icon: Ship,
    flag: "\ud83c\uddf7\ud83c\uddf4",
    lat: 44.1598,
    lng: 28.6348,
    detail: "Located inside the Port of Constanta \u2014 the largest port on the Black Sea and a key gateway to the Danube river network.",
  },
  {
    id: "serbia",
    country: "Serbia",
    city: "Belgrade",
    address: "Bul. Oslobodjenja 235, Belgrade",
    phone: "+381 114540071",
    email: "office@evo-maritime.com",
    role: "Central Balkans Inland Hub",
    icon: Building,
    flag: "\ud83c\uddf7\ud83c\uddf8",
    lat: 44.8176,
    lng: 20.4633,
    detail: "Our inland hub at the confluence of the Sava and Danube rivers \u2014 serving Central Balkans project cargo and multimodal operations.",
  },
  {
    id: "slovenia",
    country: "Slovenia",
    city: "Koper",
    address: "Smarska 7a, Koper",
    phone: "+381 114540071",
    email: "office@evo-maritime.com",
    role: "Adriatic Gateway to Western Europe",
    icon: Navigation,
    flag: "\ud83c\uddf8\ud83c\uddee",
    lat: 45.5469,
    lng: 13.7294,
    detail: "Established in 2025 at the Port of Koper \u2014 Slovenia's only sea port and the fastest Adriatic gateway to Central and Western Europe.",
  },
];

// -- Cyan SVG pin for markers
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36"><circle cx="18" cy="14" r="8" fill="oklch(0.82 0.18 200 / 25%)" stroke="oklch(0.82 0.18 200)" stroke-width="2"/><circle cx="18" cy="14" r="4" fill="oklch(0.82 0.18 200)"/><path d="M18 22 L18 32" stroke="oklch(0.82 0.18 200)" stroke-width="2" stroke-linecap="round"/></svg>`;
const PIN_SVG_ACTIVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36"><circle cx="18" cy="14" r="10" fill="oklch(0.82 0.18 200 / 40%)" stroke="oklch(0.82 0.18 200)" stroke-width="2.5"/><circle cx="18" cy="14" r="5" fill="oklch(0.82 0.18 200)"/><path d="M18 24 L18 34" stroke="oklch(0.82 0.18 200)" stroke-width="2.5" stroke-linecap="round"/></svg>`;

// -- Detail Panel
function DetailPanel({ loc, onClose }: { loc: typeof locations[0] | null; onClose: () => void }) {
  if (!loc) return null;
  const Icon = loc.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute top-4 left-4 z-[1000] w-[340px] max-w-[calc(100%-2rem)]"
      style={{
        background: "oklch(0.13 0.03 240 / 95%)",
        border: "1px solid oklch(0.82 0.18 200 / 40%)",
        backdropFilter: "blur(12px)",
        borderRadius: "8px",
        padding: "1.5rem",
      }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, oklch(0.82 0.18 200), transparent)" }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{loc.flag}</span>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "white" }}>{loc.country}</h3>
          </div>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.82 0.18 200)" }}>{loc.city}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
      </div>

      {/* Role badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4" style={{ background: "oklch(0.82 0.18 200 / 12%)", border: "1px solid oklch(0.82 0.18 200 / 30%)" }}>
        <Icon className="w-3.5 h-3.5" style={{ color: "oklch(0.82 0.18 200)" }} />
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "oklch(0.82 0.18 200)" }}>{loc.role}</span>
      </div>

      {/* Detail */}
      <p className="text-sm leading-relaxed mb-4" style={{ color: "oklch(0.7 0.02 240)" }}>{loc.detail}</p>

      <div className="h-px w-full mb-4" style={{ background: "oklch(1 0 0 / 8%)" }} />

      {/* Contact */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2" style={{ color: "oklch(0.6 0.02 240)" }}>
          <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.82 0.18 200)" }} />
          <span>{loc.address}</span>
        </div>
        <a href={`tel:${loc.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:underline" style={{ color: "oklch(0.82 0.18 200)" }}>
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span>{loc.phone}</span>
        </a>
        <a href={`mailto:${loc.email}`} className="flex items-center gap-2 hover:underline" style={{ color: "oklch(0.82 0.18 200)" }}>
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <span>{loc.email}</span>
        </a>
      </div>
    </motion.div>
  );
}

// -- Location Tab Buttons
function LocationTabs({ active, onSelect }: { active: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {locations.map((loc) => (
        <button
          key={loc.id}
          onClick={() => onSelect(loc.id)}
          className="flex items-center gap-2 px-4 py-2 transition-all duration-200"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "0.78rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            background: active === loc.id ? "oklch(0.82 0.18 200 / 15%)" : "oklch(0.14 0.04 240)",
            border: `1px solid ${active === loc.id ? "oklch(0.82 0.18 200 / 70%)" : "oklch(1 0 0 / 10%)"}`,
            color: active === loc.id ? "oklch(0.82 0.18 200)" : "oklch(0.65 0.02 240)",
            boxShadow: active === loc.id ? "0 0 12px oklch(0.82 0.18 200 / 20%)" : "none",
          }}
        >
          <span>{loc.flag}</span>
          <span>{loc.city}</span>
        </button>
      ))}
    </div>
  );
}

// -- Main Section
export default function NetworkSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeLocation = locations.find((l) => l.id === activeId) ?? null;

  const handleSelect = useCallback((id: string) => {
    setActiveId((prev) => {
      const next = prev === id ? null : id;
      // Update marker icons
      markersRef.current.forEach((m, i) => {
        if (m && m.setIcon && window.L) {
          const isActive = locations[i].id === next;
          m.setIcon(window.L.divIcon({
            html: isActive ? PIN_SVG_ACTIVE : PIN_SVG,
            className: "evo-custom-marker",
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          }));
        }
      });
      const loc = locations.find((l) => l.id === id);
      if (loc && mapRef.current) {
        mapRef.current.setView(loc.lat, loc.lng, 10);
      }
      return next;
    });
  }, []);

  const handleMapReady = useCallback((map: LeafletMap) => {
    mapRef.current = map;
    locations.forEach((loc, i) => {
      const marker = map.addMarker(loc.lat, loc.lng, {
        title: `${loc.city}, ${loc.country}`,
        html: PIN_SVG,
        onClick: () => handleSelect(loc.id),
      });
      markersRef.current[i] = marker;
    });
  }, [handleSelect]);

  return (
    <section ref={ref} id="network" className="relative py-24 overflow-hidden" style={{ background: "oklch(0.10 0.03 240)" }}>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="text-center mb-12 px-6"
      >
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", letterSpacing: "0.04em", textTransform: "uppercase", color: "white", lineHeight: 1.2 }}>
          4 Strategic Hubs.<br />
          <span style={{ color: "oklch(0.82 0.18 200)" }}>One Seamless Network.</span>
        </h2>
        <p className="mt-4 max-w-2xl mx-auto" style={{ color: "oklch(0.6 0.02 240)", fontSize: "1rem", lineHeight: 1.6 }}>
          Strategically positioned at the crossroads of Central, Eastern, and Southern Europe &mdash; covering the Black Sea, Danube, and Adriatic corridors.
        </p>
      </motion.div>

      {/* Location Tabs */}
      <div className="mb-6 px-6">
        <LocationTabs active={activeId} onSelect={handleSelect} />
      </div>

      {/* Map Container */}
      <div className="relative mx-6 rounded-lg overflow-hidden" style={{ border: "1px solid oklch(0.82 0.18 200 / 20%)" }}>
        <DetailPanel loc={activeLocation} onClose={() => { setActiveId(null); markersRef.current.forEach((m, i) => { if (m && m.setIcon && window.L) { m.setIcon(window.L.divIcon({ html: PIN_SVG, className: "evo-custom-marker", iconSize: [36, 36], iconAnchor: [18, 36] })); } }); }} />

        <MapView
          className="h-[500px] md:h-[600px]"
          initialCenter={{ lat: 43.5, lng: 22 }}
          initialZoom={6}
          onMapReady={handleMapReady}
        />

        {/* Hint overlay */}
        {!activeId && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
            <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: "oklch(0.13 0.03 240 / 80%)", color: "oklch(0.6 0.02 240)", border: "1px solid oklch(1 0 0 / 10%)" }}>Click a pin to view office details</span>
          </div>
        )}
      </div>

      {/* Bottom tagline */}
      <div className="text-center mt-8">
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "oklch(0.45 0.02 240)" }}>
          Black Sea &middot; Danube &middot; Adriatic &middot; Mediterranean
        </p>
      </div>
    </section>
  );
}
