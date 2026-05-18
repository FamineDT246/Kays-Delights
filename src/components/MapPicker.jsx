"use client";

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Loader2, Check, X, Search } from 'lucide-react';

// Fix for Leaflet's default icons disappearing in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const defaultCenter = { lat: 13.1939, lng: -59.5432 };

const fetchAddress = async (lat, lng, setAddress) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await response.json();
    if (data && data.display_name) {
      const shortAddress = data.display_name.split(',').slice(0, 3).join(', ');
      setAddress(shortAddress);
    } else {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  } catch (error) {
    setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  }
};

// Map Event Handler
function LocationMarker({ position, setPosition, setAddressLine, mapCenter }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchAddress(e.latlng.lat, e.latlng.lng, setAddressLine);
    },
  });

  useEffect(() => {
    if (mapCenter) {
      map.flyTo(mapCenter, 16);
    }
  }, [mapCenter, map]);

  return position === null ? null : <Marker position={position}></Marker>;
}

export default function MapPicker({ onConfirm, onCancel }) {
  const [position, setPosition] = useState(defaultCenter);
  const [mapCenter, setMapCenter] = useState(null);
  const [addressLine, setAddressLine] = useState("Locating you...");
  const [isLocating, setIsLocating] = useState(true);
  
  // New Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const exactPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(exactPos);
          setMapCenter(exactPos);
          fetchAddress(exactPos.lat, exactPos.lng, setAddressLine);
          setIsLocating(false);
        },
        (err) => {
          console.error("GPS error:", err);
          fetchAddress(defaultCenter.lat, defaultCenter.lng, setAddressLine);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  // Handle Manual Search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsSearching(true);
    try {
      // Add "Barbados" to the search to keep results local
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}, Barbados&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const newPos = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setPosition(newPos);
        setMapCenter(newPos);
        fetchAddress(newPos.lat, newPos.lng, setAddressLine);
      } else {
        alert("Location not found. Try dragging the pin instead.");
      }
    } catch (error) {
      console.error("Search error:", error);
    }
    setIsSearching(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <MapPin className="text-amber-600" /> Confirm Delivery Spot
          </h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* NEW: Search Bar */}
        <div className="bg-white p-3 z-10 border-b border-gray-100 shadow-sm relative">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search address (e.g. Redmans Village)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
            <button 
              type="submit" 
              disabled={isSearching}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-black transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Find
            </button>
          </form>
        </div>

        <div className="flex-1 relative bg-gray-100">
          <MapContainer center={defaultCenter} zoom={12} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationMarker position={position} setPosition={setPosition} setAddressLine={setAddressLine} mapCenter={mapCenter} />
          </MapContainer>

          {isLocating && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md font-bold text-sm flex items-center gap-2 text-amber-600 border border-amber-100 z-[1000]">
              <Loader2 className="w-4 h-4 animate-spin" /> Pinpointing exact location...
            </div>
          )}
        </div>

        <div className="p-6 bg-white z-10 border-t border-gray-100 space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700 font-bold mb-1 uppercase tracking-wider">Selected Address</p>
            <p className="font-medium text-gray-900">{addressLine}</p>
          </div>
          
          <button 
            onClick={() => onConfirm(addressLine)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md"
          >
            <Check className="w-5 h-5" />
            Deliver to this exact spot
          </button>
        </div>

      </div>
    </div>
  );
}