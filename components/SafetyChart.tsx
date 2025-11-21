import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RouteResult, GraphNode, GraphEdge } from '../types';

interface SafetyChartProps {
  route: RouteResult;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const SafetyChart: React.FC<SafetyChartProps> = ({ route, nodes, edges }) => {
  
  // Prepare data: Risk level per segment
  const data = route.path.map((nodeId, index) => {
    if (index === 0) return { name: 'Inicio', risk: 1 };
    
    const prevId = route.path[index - 1];
    const edge = edges.find(e => e.from === prevId && e.to === nodeId);
    const nodeLabel = nodes.find(n => n.id === nodeId)?.label.substring(0, 10) + '...' || nodeId;
    
    return {
      name: nodeLabel,
      risk: edge ? edge.safetyWeight : 1
    };
  });

  return (
    <div className="h-48 w-full bg-white rounded-lg p-2 shadow-sm border border-gray-100">
      <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Perfil de Riesgo del Trayecto</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
          <XAxis dataKey="name" hide />
          <YAxis hide domain={[0, 10]} />
          <Tooltip 
            contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Area 
            type="monotone" 
            dataKey="risk" 
            stroke="#ef4444" 
            fillOpacity={1} 
            fill="url(#colorRisk)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};