// Taper terminal twigs along their last 80cm without extending them outside
// the already validated growth volume. Keep branching joints at their full size.
export function branchTaper(nodes) {
  const children = nodes.map(() => []), distance = nodes.map(() => Infinity);
  nodes.forEach((n, i) => { if (i && n.active) children[n.parent].push(i); });
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (!nodes[i].active || nodes[i].trunk) continue;
    if (!children[i].length) distance[i] = 0;
    else if (children[i].length === 1) {
      const child = children[i][0];
      distance[i] = distance[child] + Math.hypot(...nodes[i].p.map((v, k) => v - nodes[child].p[k]));
    }
  }
  return nodes.map((n, i) => ({
    terminal: n.active && !n.trunk && children[i].length === 0,
    radius: n.radius * Math.min(1, distance[i] / .8),
  }));
}
