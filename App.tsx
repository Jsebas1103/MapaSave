import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Shield, AlertTriangle, MapPin, Navigation, Info, Footprints, BrainCircuit } from 'lucide-react';
import { NODES, EDGES, POPAYAN_CENTER, DANGER_ZONES } from './constants';
import { findRoute } from './utils/pathfinding';
import { getSafetyAdvice } from './services/geminiService';
import { RouteType, RouteResult, GeminiAdvice } from './types';
import { SafetyChart } from './components/SafetyChart';

// Fix Leaflet icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Inner component to handle map view updates
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

function App() {
  const [startNode, setStartNode] = useState<string>('n1'); // Parque Caldas
  const [endNode, setEndNode] = useState<string>('n3'); // Unicauca
  const [routeType, setRouteType] = useState<RouteType>(RouteType.SAFEST);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [advice, setAdvice] = useState<GeminiAdvice | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Calculate Route
  useEffect(() => {
    if (startNode && endNode) {
      const result = findRoute(startNode, endNode, NODES, EDGES, routeType);
      setRoute(result);
    }
  }, [startNode, endNode, routeType]);

  // Fetch Advice when route changes significantly
  useEffect(() => {
    if (route && route.path.length > 0) {
      const fetchAdvice = async () => {
        setLoadingAdvice(true);
        const sNode = NODES.find(n => n.id === startNode);
        const eNode = NODES.find(n => n.id === endNode);
        
        if (sNode && eNode) {
            const data = await getSafetyAdvice(sNode.label, eNode.label, route.averageSafetyScore);
            setAdvice(data);
        }
        setLoadingAdvice(false);
      };
      
      // Debounce/Delay slightly to simulate processing and avoid spamming API on rapid clicks
      const timer = setTimeout(fetchAdvice, 800);
      return () => clearTimeout(timer);
    }
  }, [route, startNode, endNode]);

  // Visual helper: Convert path IDs to Coordinates for Polyline
  const routeCoordinates = useMemo(() => {
    if (!route) return [];
    return route.path.map(id => {
      const node = NODES.find(n => n.id === id);
      return node ? [node.coordinate.lat, node.coordinate.lng] as [number, number] : [0,0] as [number, number];
    });
  }, [route]);

  // Danger Zone Polygons for rendering
  const dangerPolygons = useMemo(() => {
    return DANGER_ZONES.map(dz => ({
      positions: dz.polygon.map(p => [p.lat, p.lng] as [number, number]),
      color: 'red',
      name: dz.name,
      description: dz.description
    }));
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600 fill-blue-100" />
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-800">RutaSegura Popayán</h1>
            <p className="text-xs text-slate-500">Navegación estudiantil inteligente</p>
          </div>
        </div>
        <div className="hidden sm:flex gap-2">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 font-medium">Beta</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar / Control Panel */}
        <aside className="w-full md:w-96 bg-white flex flex-col border-r border-slate-200 z-20 overflow-y-auto shadow-xl md:shadow-none">
          <div className="p-4 space-y-6">
            
            {/* Route Selection */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4" /> Configurar Ruta
              </h2>
              
              <div className="space-y-3">
                <div className="relative">
                  <label className="text-xs font-medium text-slate-600 mb-1 block ml-1">Punto de Partida</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-green-500 absolute left-3 top-3" />
                    <select 
                      value={startNode} 
                      onChange={(e) => setStartNode(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                    >
                      {NODES.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <label className="text-xs font-medium text-slate-600 mb-1 block ml-1">Destino</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                    <select 
                      value={endNode} 
                      onChange={(e) => setEndNode(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                    >
                      {NODES.filter(n => n.id !== startNode).map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 p-1 rounded-lg flex">
                <button
                  onClick={() => setRouteType(RouteType.SHORTEST)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${routeType === RouteType.SHORTEST ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Más Corta
                </button>
                <button
                  onClick={() => setRouteType(RouteType.SAFEST)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${routeType === RouteType.SAFEST ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Shield className="w-3 h-3" /> Más Segura
                </button>
              </div>
            </div>

            {/* Route Info */}
            {route && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <div className="text-blue-500 text-xs font-medium mb-1 flex items-center gap-1">
                      <Footprints className="w-3 h-3" /> Distancia
                    </div>
                    <div className="text-xl font-bold text-blue-900">
                      {(route.totalDistance / 1000).toFixed(2)} <span className="text-sm font-normal">km</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${route.averageSafetyScore < 2 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className={`${route.averageSafetyScore < 2 ? 'text-green-600' : 'text-amber-600'} text-xs font-medium mb-1 flex items-center gap-1`}>
                      <AlertTriangle className="w-3 h-3" /> Riesgo
                    </div>
                    <div className={`text-xl font-bold ${route.averageSafetyScore < 2 ? 'text-green-900' : 'text-amber-900'}`}>
                      {route.averageSafetyScore < 1.5 ? 'Bajo' : route.averageSafetyScore < 4 ? 'Medio' : 'Alto'}
                    </div>
                  </div>
                </div>

                 {/* Chart */}
                 <SafetyChart route={route} nodes={NODES} edges={EDGES} />

                {/* AI Advice */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                     <BrainCircuit className="w-16 h-16 text-indigo-900" />
                  </div>
                  <h3 className="text-indigo-900 font-bold text-sm mb-2 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" /> Gemini Insights
                  </h3>
                  
                  {loadingAdvice ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 bg-indigo-200 rounded w-3/4"></div>
                      <div className="h-3 bg-indigo-200 rounded w-1/2"></div>
                    </div>
                  ) : advice ? (
                    <div className="relative z-10">
                      <p className="text-xs text-indigo-800 mb-3 font-medium leading-relaxed">
                        "{advice.summary}"
                      </p>
                      <ul className="space-y-1">
                        {advice.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                             <span className="mt-0.5 text-indigo-500">•</span>
                             {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Generando recomendaciones...</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 text-center leading-tight">
              Los datos de seguridad son simulados para fines académicos. En caso de emergencia real, contacte al 123.
            </p>
          </div>
        </aside>

        {/* Map Area */}
        <main className="flex-1 relative h-[50vh] md:h-auto">
          <MapContainer 
            center={POPAYAN_CENTER} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles"
            />
            
            <MapUpdater center={POPAYAN_CENTER} />

            {/* Danger Zones */}
            {dangerPolygons.map((poly, idx) => (
              <Polygon 
                key={`dz-${idx}`}
                positions={poly.positions}
                pathOptions={{ 
                  color: '#ef4444', 
                  fillColor: '#ef4444', 
                  fillOpacity: 0.2, 
                  weight: 1,
                  dashArray: '5, 10' 
                }}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Zona Insegura
                    </h3>
                    <p className="text-xs font-semibold">{poly.name}</p>
                    <p className="text-[10px] mt-1 text-slate-600">{poly.description}</p>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Graph Edges (Streets) - Visual Aid */}
            {EDGES.map((edge, idx) => {
               const n1 = NODES.find(n => n.id === edge.from);
               const n2 = NODES.find(n => n.id === edge.to);
               if(!n1 || !n2) return null;
               
               // Don't render all edges to avoid clutter, only render if debugging or path not found
               return null; 
            })}

            {/* The Calculated Path */}
            {routeCoordinates.length > 1 && (
              <Polyline 
                positions={routeCoordinates}
                pathOptions={{ 
                  color: routeType === RouteType.SAFEST ? '#10b981' : '#3b82f6', 
                  weight: 6,
                  opacity: 0.8,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            )}
             {/* Path Outline for contrast */}
             {routeCoordinates.length > 1 && (
              <Polyline 
                positions={routeCoordinates}
                pathOptions={{ 
                  color: 'white', 
                  weight: 9,
                  opacity: 0.4,
                }}
              />
            )}

            {/* Nodes / Markers */}
            {NODES.map((node) => {
              const isStart = node.id === startNode;
              const isEnd = node.id === endNode;
              const isRouteNode = route?.path.includes(node.id);

              if (!isStart && !isEnd && !isRouteNode) return null; // Only show relevant nodes

              return (
                <Marker 
                  key={node.id} 
                  position={[node.coordinate.lat, node.coordinate.lng]}
                  opacity={isStart || isEnd ? 1 : 0.7}
                >
                  <Popup>
                    <span className="font-semibold text-sm">{node.label}</span>
                  </Popup>
                </Marker>
              );
            })}

          </MapContainer>

          {/* Mobile floating hint */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg z-[400] text-xs md:hidden">
             <div className="flex items-center gap-2">
               <span className="w-3 h-1 bg-green-500 rounded-full"></span> Segura
               <span className="w-3 h-1 bg-red-500/50 border border-red-500 rounded-full"></span> Peligro
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;