import { useEffect, useState } from 'react';
import MapView from './MapView.tsx';
import { type Camera } from './types.ts';
import axios from 'axios';
import { io } from 'socket.io-client';

export default function App() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selected, setSelected] = useState<Camera | null>(null);
  const [draft, setDraft] = useState<Partial<Camera> | null>(null);

  const backend = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

  useEffect(() => {
  fetchCameras();
  const socket = io(backend);

  socket.on('cameraUpdate', (updatedCam: Camera) => {
    setCameras(prev =>
      prev.map(c => c._id === updatedCam._id ? updatedCam : c)
    );
  });

  socket.on('cameraRemoved', (id: string) => {
    setCameras(prev => prev.filter(c => c._id !== id));
  });

  socket.on('cameraAlert', (alertCam: Camera) => {
    setCameras(prev =>
      prev.map(c => c._id === alertCam._id ? { ...alertCam, isAlert: true } : c)
    );
    console.warn(`🔥 Fire detected at ${alertCam.name || alertCam._id}`);
  });

  return () => {
    socket.disconnect();
  };
}, []);

  async function fetchCameras() {
    const res = await axios.get(`${backend}/api/cameras`);
    setCameras(res.data);
  }

  async function createCamera(payload: Partial<Camera>) {
    const res = await axios.post(`${backend}/api/cameras`, payload);
    setCameras(prev => [res.data, ...prev]);
    setDraft(null);
  }

  async function updateCamera(id: string, payload: Partial<Camera>) {
    const res = await axios.put(`${backend}/api/cameras/${id}`, payload);
    setCameras(prev => prev.map(c => c._id === id ? res.data : c));
    setSelected(res.data);
  }

  async function deleteCamera(id: string) {
    await axios.delete(`${backend}/api/cameras/${id}`);
    setCameras(prev => prev.filter(c => c._id !== id));
    setSelected(null);
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h2>FireGuard — Camera Manager</h2>
        <p>Click map to add a camera. Click a camera marker to edit or delete it.</p>

        <div style={{ marginTop: 12 }}>
          <button onClick={() => { setDraft({ name: '', description: '', lat: 0, lng: 0 }); setSelected(null); }}>
            Add new camera (click map to set coords)
          </button>
        </div>

        <hr/>
        {draft && (
          <CameraForm
            initial={draft}
            onCancel={() => setDraft(null)}
            onSave={(payload) => {
              if ((payload as any)._id) updateCamera((payload as any)._id, payload);
              else createCamera(payload as Partial<Camera>);
            }}
          />
        )}

        {selected ? (
          <div>
            <h3>Selected Camera</h3>
            <p><b>{selected.name}</b></p>
            <p>{selected.description}</p>
            <p>Lat: {selected.lat.toFixed(5)} | Lng: {selected.lng.toFixed(5)}</p>
            <button onClick={() => setDraft(selected)}>Edit</button>
            <button onClick={() => deleteCamera(selected._id)} style={{ marginLeft: 8 }}>Delete</button>
          </div>
        ) : null}

        <hr/>
        <h4>All Cameras</h4>
        <ul>
          {cameras.map(c => (
            <li key={c._id}><a href="#" onClick={(e)=>{
              e.preventDefault();
              setSelected(c);
            }}>{c.name || `${c.lat.toFixed(3)}, ${c.lng.toFixed(3)}`}</a></li>
          ))}
        </ul>
      </div>

      <div className="map-container">
        <MapView
          cameras={cameras}
          onMapClick={(lat,lng) => {
            // open draft with coordinates
            setDraft({ name: `Camera ${new Date().toISOString()}`, lat, lng, description: '' });
            setSelected(null);
          }}
          onMarkerClick={(cam) => setSelected(cam)}
        />
      </div>
    </div>
  );
}

function CameraForm({ initial, onCancel, onSave }: { initial: Partial<Camera>, onCancel: ()=>void, onSave: (p: Partial<Camera>)=>void }) {
  const [data, setData] = useState<Partial<Camera>>(initial);

  useEffect(()=> setData(initial), [initial]);

  return (
    <div style={{ marginTop: 8 }}>
      <h3>{(data as any)._id ? 'Edit Camera' : 'New Camera'}</h3>
      <label>Name</label>
      <input value={data.name || ''} onChange={e=> setData({...data, name: e.target.value})} />
      <label>Description</label>
      <input value={data.description || ''} onChange={e=> setData({...data, description: e.target.value})} />
      <label>Latitude</label>
      <input type="number" value={data.lat ?? 0} onChange={e=> setData({...data, lat: parseFloat(e.target.value)})} />
      <label>Longitude</label>
      <input type="number" value={data.lng ?? 0} onChange={e=> setData({...data, lng: parseFloat(e.target.value)})} />
      <div style={{ marginTop: 8 }}>
        <button onClick={()=> onSave(data)}>Save</button>
        <button style={{ marginLeft: 8 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
