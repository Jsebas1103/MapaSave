import { GraphNode, GraphEdge, RouteResult, RouteType } from '../types';

export const findRoute = (
  startId: string, 
  endId: string, 
  nodes: GraphNode[], 
  edges: GraphEdge[],
  type: RouteType
): RouteResult | null => {
  
  // Distances/Costs map
  const costs: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  nodes.forEach(node => {
    costs[node.id] = Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  });

  costs[startId] = 0;

  while (unvisited.size > 0) {
    // Get node with min cost
    let closestNodeId: string | null = null;
    let minCost = Infinity;

    unvisited.forEach(id => {
      if (costs[id] < minCost) {
        minCost = costs[id];
        closestNodeId = id;
      }
    });

    // If we can't reach any more nodes or reached the end
    if (closestNodeId === null || costs[closestNodeId] === Infinity) break;
    if (closestNodeId === endId) break;

    unvisited.delete(closestNodeId);

    // Explore neighbors
    const currentEdges = edges.filter(e => e.from === closestNodeId);
    
    for (const edge of currentEdges) {
      if (!unvisited.has(edge.to)) continue;

      // CORE LOGIC: 
      // If RouteType is SAFEST, we multiply distance by safetyWeight.
      // If RouteType is SHORTEST, we just use distance (weight is implicitly 1).
      
      const edgeCost = type === RouteType.SAFEST 
        ? edge.distance * edge.safetyWeight 
        : edge.distance;

      const newCost = costs[closestNodeId] + edgeCost;

      if (newCost < costs[edge.to]) {
        costs[edge.to] = newCost;
        previous[edge.to] = closestNodeId;
      }
    }
  }

  // Reconstruct path
  if (previous[endId] === null && startId !== endId) {
    return null; // No path found
  }

  const path: string[] = [];
  let current: string | null = endId;
  
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  // Calculate real stats for the found path
  let totalDist = 0;
  let totalSafety = 0;
  let edgeCount = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(e => e.from === path[i] && e.to === path[i+1]);
    if (edge) {
      totalDist += edge.distance;
      totalSafety += edge.safetyWeight;
      edgeCount++;
    }
  }

  return {
    path,
    totalDistance: totalDist,
    averageSafetyScore: edgeCount > 0 ? totalSafety / edgeCount : 1
  };
};