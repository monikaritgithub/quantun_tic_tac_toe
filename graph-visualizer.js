/**
 * Entanglement Graph Visualizer
 * Renders Allan Goff's Quantum Tic-Tac-Toe state as an interactive SVG Network Graph.
 * Nodes represent board squares (1-9); edges represent entangled pairs of spooky marks.
 */

class EntanglementGraphVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        // Position 9 nodes in a 3x3 topological matrix for intuitive correspondence with board
        // Coordinates normalized for a 360x300 viewBox
        this.nodePositions = [
            { id: 0, x: 60,  y: 50,  label: '1' },
            { id: 1, x: 180, y: 50,  label: '2' },
            { id: 2, x: 300, y: 50,  label: '3' },
            { id: 3, x: 60,  y: 150, label: '4' },
            { id: 4, x: 180, y: 150, label: '5' },
            { id: 5, x: 300, y: 150, label: '6' },
            { id: 6, x: 60,  y: 250, label: '7' },
            { id: 7, x: 180, y: 250, label: '8' },
            { id: 8, x: 300, y: 250, label: '9' }
        ];
    }

    render(engine, cycleInfo = null) {
        if (!this.container) return;

        const activeMoves = engine.getActiveMoves();
        const cycleEdgeIds = cycleInfo ? new Set(cycleInfo.cycleEdges.map(e => e.id)) : new Set();
        const cycleVertexIds = cycleInfo ? new Set(cycleInfo.cycleVertices) : new Set();

        let svgHtml = `
            <svg viewBox="0 0 360 300" class="graph-svg" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#64748b" flood-opacity="0.15"/>
                    </filter>
                    <filter id="cycle-glow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="3" result="blur"/>
                        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                    </filter>
                </defs>
        `;

        // Draw structural faint grid background lines
        svgHtml += `
            <g class="graph-grid" stroke="#f1f5f9" stroke-width="1.5">
                <line x1="60" y1="50" x2="300" y2="50"/>
                <line x1="60" y1="150" x2="300" y2="150"/>
                <line x1="60" y1="250" x2="300" y2="250"/>
                <line x1="60" y1="50" x2="60" y2="250"/>
                <line x1="180" y1="50" x2="180" y2="250"/>
                <line x1="300" y1="50" x2="300" y2="250"/>
            </g>
        `;

        // Render Edges (Entangled Spooky Marks)
        svgHtml += `<g class="graph-edges">`;
        activeMoves.forEach(move => {
            const p1 = this.nodePositions[move.sq1];
            const p2 = this.nodePositions[move.sq2];
            const isCycle = cycleEdgeIds.has(move.id);
            const isPlayerX = move.player === 'X';

            const strokeColor = isCycle ? '#f59e0b' : (isPlayerX ? '#2563eb' : '#e11d48');
            const strokeWidth = isCycle ? '3.5' : '2.5';
            const strokeDash = isCycle ? 'none' : '4 3';

            // Quadratic curve control point for aesthetics
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const norm = Math.hypot(dx, dy) || 1;
            // Slight curvature to prevent overlapping edges
            const curveOffset = ((move.id % 3) - 1) * 14;
            const cx = midX - (dy / norm) * curveOffset;
            const cy = midY + (dx / norm) * curveOffset;

            svgHtml += `
                <path d="M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}"
                      fill="none"
                      stroke="${strokeColor}"
                      stroke-width="${strokeWidth}"
                      stroke-dasharray="${strokeDash}"
                      class="edge-path ${isCycle ? 'cycle-pulse' : ''}"
                      ${isCycle ? 'filter="url(#cycle-glow)"' : ''} />
            `;

            // Edge badge / label
            const labelX = (p1.x + 2 * cx + p2.x) / 4;
            const labelY = (p1.y + 2 * cy + p2.y) / 4;
            const badgeBg = isCycle ? '#f59e0b' : (isPlayerX ? '#2563eb' : '#e11d48');

            svgHtml += `
                <g class="edge-label-group" transform="translate(${labelX}, ${labelY})">
                    <circle r="9" fill="${badgeBg}" filter="url(#node-shadow)"/>
                    <text text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-size="9" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
                        ${move.player}${move.id}
                    </text>
                </g>
            `;
        });
        svgHtml += `</g>`;

        // Render Nodes (Squares 1-9)
        svgHtml += `<g class="graph-nodes">`;
        this.nodePositions.forEach(node => {
            const classicalMark = engine.classical[node.id];
            const isCycleNode = cycleVertexIds.has(node.id);
            const spookyCount = engine.getSpookyMarksForSquare(node.id).length;

            let fillColor = '#ffffff';
            let strokeColor = '#cbd5e1';
            let strokeWidth = '2';
            let textColor = '#64748b';
            let displayText = node.label;
            let subText = '';

            if (classicalMark) {
                if (classicalMark.player === 'X') {
                    fillColor = '#eff6ff';
                    strokeColor = '#2563eb';
                    strokeWidth = '3';
                    textColor = '#2563eb';
                    displayText = 'X';
                    subText = `${classicalMark.moveId}`;
                } else {
                    fillColor = '#fff1f2';
                    strokeColor = '#e11d48';
                    strokeWidth = '3';
                    textColor = '#e11d48';
                    displayText = 'O';
                    subText = `${classicalMark.moveId}`;
                }
            } else if (isCycleNode) {
                strokeColor = '#f59e0b';
                strokeWidth = '3.5';
                fillColor = '#fef3c7';
                textColor = '#b45309';
            } else if (spookyCount > 0) {
                strokeColor = '#94a3b8';
                strokeWidth = '2';
                fillColor = '#f8fafc';
            }

            svgHtml += `
                <g class="graph-node-group" transform="translate(${node.x}, ${node.y})">
                    <circle r="18" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" filter="url(#node-shadow)"/>
                    <text text-anchor="middle" dominant-baseline="central" fill="${textColor}" font-size="${classicalMark ? '16' : '12'}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
                        ${displayText}
                    </text>
                    ${subText ? `
                        <text x="8" y="9" font-size="8" fill="${textColor}" font-weight="800">${subText}</text>
                    ` : ''}
                    <text y="-23" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="monospace">Sq ${node.label}</text>
                </g>
            `;
        });
        svgHtml += `</g>`;

        svgHtml += `</svg>`;
        this.container.innerHTML = svgHtml;
    }
}
