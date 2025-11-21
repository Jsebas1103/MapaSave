import { GraphNode, GraphEdge, DangerZone, Coordinate } from './types';

// Central Popayán Data Mock
// We represent intersections as nodes.

export const POPAYAN_CENTER: [number, number] = [2.4419, -76.6063]; // Parque Caldas

export const NODES: GraphNode[] = [
  { id: 'n1', label: 'Parque Caldas', coordinate: { lat: 2.4419, lng: -76.6063 } },
  { id: 'n2', label: 'Iglesia San Francisco', coordinate: { lat: 2.4425, lng: -76.6055 } },
  { id: 'n3', label: 'Unicauca (Santo Domingo)', coordinate: { lat: 2.4445, lng: -76.6050 } }, // University
  { id: 'n4', label: 'Banco de la República', coordinate: { lat: 2.4410, lng: -76.6070 } },
  { id: 'n5', label: 'Puente del Humilladero', coordinate: { lat: 2.4435, lng: -76.6040 } },
  { id: 'n6', label: 'Teatro Municipal', coordinate: { lat: 2.4415, lng: -76.6045 } },
  { id: 'n7', label: 'Sector Tulcán (Entrada)', coordinate: { lat: 2.4460, lng: -76.6020 } },
  { id: 'n8', label: 'Hospital San José', coordinate: { lat: 2.4480, lng: -76.5990 } },
  { id: 'n9', label: 'Esquina Peligrosa (Mock)', coordinate: { lat: 2.4390, lng: -76.6090 } },
  { id: 'n10', label: 'Terminal de Transportes (Cerca)', coordinate: { lat: 2.4380, lng: -76.6110 } },
  { id: 'n11', label: 'Parque Carantanta', coordinate: { lat: 2.4450, lng: -76.5980 } },
  { id: 'n12', label: 'Facultad de Salud', coordinate: { lat: 2.4470, lng: -76.6000 } },
  { id: 'n13', label: 'Calle 5 - Sector Histórico', coordinate: { lat: 2.4430, lng: -76.6080 } },
  { id: 'n14', label: 'Barrio Bolívar (Mercado)', coordinate: { lat: 2.4490, lng: -76.6070 } }, // Often considered chaotic/busy
];

// Danger Zones (Polygons for visualization and weight calculation)
export const DANGER_ZONES: DangerZone[] = [
  {
    id: 'dz1',
    name: 'Zona Bolívar (Noche)',
    polygon: [
      { lat: 2.4485, lng: -76.6080 },
      { lat: 2.4500, lng: -76.6080 },
      { lat: 2.4500, lng: -76.6060 },
      { lat: 2.4485, lng: -76.6060 },
    ],
    riskLevel: 8,
    description: 'Zona de mercado, poca iluminación en la noche, alto flujo vehicular desordenado.'
  },
  {
    id: 'dz2',
    name: 'Periferia Sur-Occidente',
    polygon: [
      { lat: 2.4380, lng: -76.6120 },
      { lat: 2.4400, lng: -76.6120 },
      { lat: 2.4400, lng: -76.6085 },
      { lat: 2.4380, lng: -76.6085 },
    ],
    riskLevel: 7,
    description: 'Callejones solitarios, reportes de hurtos recientes.'
  }
];

// Helper to calculate distance between coords (Haversine approximation for short distances)
function getDistance(c1: Coordinate, c2: Coordinate): number {
  const R = 6371e3; // metres
  const φ1 = c1.lat * Math.PI/180;
  const φ2 = c2.lat * Math.PI/180;
  const Δφ = (c2.lat - c1.lat) * Math.PI/180;
  const Δλ = (c2.lng - c1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// Generate Edges based on proximity (simplified mesh for demo)
const generateEdges = (): GraphEdge[] => {
  const edges: GraphEdge[] = [];
  
  // Manually connecting some logical streets for the demo graph
  const connections = [
    ['n1', 'n2'], ['n1', 'n4'], ['n1', 'n6'], ['n1', 'n13'],
    ['n2', 'n3'], ['n2', 'n5'],
    ['n3', 'n7'], ['n3', 'n5'],
    ['n5', 'n11'],
    ['n7', 'n11'], ['n7', 'n12'],
    ['n11', 'n12'],
    ['n12', 'n8'],
    ['n4', 'n9'], ['n4', 'n13'],
    ['n9', 'n10'],
    ['n13', 'n14'], // Path to danger
    ['n2', 'n14'],
    ['n14', 'n8'], // Path through danger to hospital
    ['n6', 'n9']
  ];

  connections.forEach(([fromId, toId]) => {
    const nodeFrom = NODES.find(n => n.id === fromId)!;
    const nodeTo = NODES.find(n => n.id === toId)!;
    const dist = getDistance(nodeFrom.coordinate, nodeTo.coordinate);
    
    // Determine safety weight
    // If either node is close to a danger zone, increase weight drastically
    let safetyMultiplier = 1;
    
    const isInDanger = (c: Coordinate) => {
       return DANGER_ZONES.some(dz => {
         // Simple bounding box check for demo efficiency
         const lats = dz.polygon.map(p => p.lat);
         const lngs = dz.polygon.map(p => p.lng);
         return c.lat >= Math.min(...lats) && c.lat <= Math.max(...lats) &&
                c.lng >= Math.min(...lngs) && c.lng <= Math.max(...lngs);
       });
    };

    if (isInDanger(nodeFrom.coordinate) || isInDanger(nodeTo.coordinate)) {
      safetyMultiplier = 10; // High penalty for danger
    } else if (toId === 'n14' || fromId === 'n14') {
        safetyMultiplier = 5; // Specific node penalty
    } else if (toId === 'n9' || fromId === 'n9') {
        safetyMultiplier = 4;
    }

    edges.push({
      from: fromId,
      to: toId,
      distance: dist,
      safetyWeight: safetyMultiplier
    });
    // Bidirectional
    edges.push({
      from: toId,
      to: fromId,
      distance: dist,
      safetyWeight: safetyMultiplier
    });
  });

  return edges;
};

export const EDGES = generateEdges();