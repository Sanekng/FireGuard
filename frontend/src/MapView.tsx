import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { type Camera } from './types';

const defaultIcon = L.divIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #4CAF50, #45a049);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 16px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      cursor: pointer;
      transition: all 0.3s ease;
    ">📷</div>
  `,
  className: 'camera-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const alertIcon = L.divIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #FF5722, #E64A19);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 16px rgba(255, 87, 34, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 18px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      cursor: pointer;
    ">🔥</div>
  `,
  className: 'alert-marker',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

export default function MapView({ cameras, onMapClick, onMarkerClick }:
  { cameras: Camera[], onMapClick: (lat:number,lng:number)=>void, onMarkerClick: (cam: Camera)=>void }) {

  const [mneGeo, setMneGeo] = useState<any>(null);

  useEffect(() => {
    axios.get((import.meta.env.VITE_API_BASE || 'http://localhost:4000') + '/geojson/mne')
      .then(r => setMneGeo(r.data))
      .catch(err => console.warn('Could not load montenegro geojson', err));
  }, []);

  const validCameras = cameras.filter(cam => 
    cam.lat != null && cam.lng != null && !isNaN(cam.lat) && !isNaN(cam.lng)
  );

  const center = [42.7, 19.3] as [number, number]; // Montenegro center approx

  return (
    <MapContainer center={center} zoom={8} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mneGeo && <GeoJSON data={mneGeo} style={{ color: '#2b7bff', weight: 2, fillOpacity: 0.05 }} />}

      {validCameras.map(cam => (
        <Marker
          key={cam._id}
          position={[cam.lat, cam.lng]}
          icon={cam.isAlert ? alertIcon : defaultIcon}
          eventHandlers={{
            click: () => onMarkerClick(cam)
          }}
        >
          <Popup>
            <b>{cam.name}</b><br/>
            {cam.description}<br/>
            <small>{cam.lat.toFixed(5)}, {cam.lng.toFixed(5)}</small><br/>
            {cam.isAlert ? <span style={{ color: 'red', fontWeight: 'bold' }}>🔥 FIRE ALERT</span> : null}
          </Popup>
        </Marker>
      ))}
      <MapClickHandler onMapClick={onMapClick} />
    </MapContainer>
  );
}

function MapClickHandler({ onMapClick }:{ onMapClick:(lat:number,lng:number)=>void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}
