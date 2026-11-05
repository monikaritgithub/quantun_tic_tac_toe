/**
 * Quantum Circuit Visualizer
 * Renders an interactive, Qiskit-style vector SVG quantum circuit schematic.
 * Developed by Quantum Software Developer
 */

class CircuitVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.wireHeight = 44;
        this.gateWidth = 60;
        this.paddingLeft = 70;
        this.paddingTop = 25;
        this.numQubits = 9;
    }

    render(circuitSteps, isMeasured = false) {
        if (!this.container) return;

        // Calculate dynamic width based on steps
        let totalColumns = 2; // Init (Reset + H) + Barrier
        for (const step of circuitSteps) {
            if (step.type === 'GATE' || step.type === 'SWAP') {
                totalColumns++;
            }
        }
        if (isMeasured) totalColumns += 2; // Barrier + Measure meters

        const totalWidth = Math.max(750, this.paddingLeft + (totalColumns + 1) * this.gateWidth + 80);
        const totalHeight = this.paddingTop + this.numQubits * this.wireHeight + 40;

        let svgHtml = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="auto" class="quantum-circuit-svg">
                <defs>
                    <linearGradient id="gateGradO" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#1e3c72" />
                        <stop offset="100%" stop-color="#2a5298" />
                    </linearGradient>
                    <linearGradient id="gateGradX" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8a1c14" />
                        <stop offset="100%" stop-color="#d32f2f" />
                    </linearGradient>
                    <linearGradient id="gateGradH" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#006699" />
                        <stop offset="100%" stop-color="#0088cc" />
                    </linearGradient>
                    <linearGradient id="gateGradNot" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#e67e22" />
                        <stop offset="100%" stop-color="#f39c12" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
        `;

        // Draw 9 Quantum Wires
        for (let q = 0; q < this.numQubits; q++) {
            const y = this.paddingTop + q * this.wireHeight + this.wireHeight / 2;
            
            // Wire label
            svgHtml += `
                <text x="12" y="${y + 4}" fill="#a0aec0" font-family="'Consolas', monospace" font-size="12" font-weight="bold">q[${q}]: |0⟩</text>
                <line x1="${this.paddingLeft - 10}" y1="${y}" x2="${totalWidth - 30}" y2="${y}" stroke="#4a5568" stroke-width="2" />
            `;
        }

        // Column pointer
        let currentX = this.paddingLeft + 15;

        // 1. Initial Reset & Hadamard column
        for (let q = 0; q < this.numQubits; q++) {
            const y = this.paddingTop + q * this.wireHeight + this.wireHeight / 2;
            
            // H gate box
            svgHtml += `
                <rect x="${currentX}" y="${y - 14}" width="28" height="28" rx="4" fill="url(#gateGradH)" stroke="#63b3ed" stroke-width="1.5" />
                <text x="${currentX + 14}" y="${y + 5}" fill="#ffffff" font-family="'Consolas', monospace" font-size="12" font-weight="bold" text-anchor="middle">H</text>
            `;
        }

        currentX += 45;

        // 2. Initial Barrier
        const barrierTop = this.paddingTop + 5;
        const barrierBottom = this.paddingTop + (this.numQubits - 1) * this.wireHeight + this.wireHeight / 2 + 10;
        svgHtml += `
            <line x1="${currentX}" y1="${barrierTop}" x2="${currentX}" y2="${barrierBottom}" stroke="#718096" stroke-width="2" stroke-dasharray="4,4" />
        `;

        currentX += 35;

        // 3. Gameplay Steps
        for (const step of circuitSteps) {
            if (step.type === 'GATE') {
                const q = step.qubit;
                const y = this.paddingTop + q * this.wireHeight + this.wireHeight / 2;
                let fill = "url(#gateGradO)";
                let stroke = "#4299e1";
                let text = step.gate;

                if (step.player === 'X') {
                    fill = "url(#gateGradX)";
                    stroke = "#fc8181";
                } else if (step.player === 'NOT') {
                    fill = "url(#gateGradNot)";
                    stroke = "#fbd38d";
                }

                svgHtml += `
                    <g class="circuit-gate-anim">
                        <rect x="${currentX}" y="${y - 15}" width="54" height="30" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="1.8" filter="url(#glow)" />
                        <text x="${currentX + 27}" y="${y + 4}" fill="#ffffff" font-family="'Consolas', monospace" font-size="10.5" font-weight="bold" text-anchor="middle">${text}</text>
                    </g>
                `;
                currentX += 65;

            } else if (step.type === 'SWAP') {
                const q1 = Math.min(step.qubit1, step.qubit2);
                const q2 = Math.max(step.qubit1, step.qubit2);
                const y1 = this.paddingTop + q1 * this.wireHeight + this.wireHeight / 2;
                const y2 = this.paddingTop + q2 * this.wireHeight + this.wireHeight / 2;
                const xCenter = currentX + 16;

                // Vertical connecting line
                svgHtml += `
                    <line x1="${xCenter}" y1="${y1}" x2="${xCenter}" y2="${y2}" stroke="#9f7aea" stroke-width="2.5" />
                `;

                // SWAP Cross on q1
                svgHtml += `
                    <line x1="${xCenter - 8}" y1="${y1 - 8}" x2="${xCenter + 8}" y2="${y1 + 8}" stroke="#b794f4" stroke-width="3" stroke-linecap="round" />
                    <line x1="${xCenter + 8}" y1="${y1 - 8}" x2="${xCenter - 8}" y2="${y1 + 8}" stroke="#b794f4" stroke-width="3" stroke-linecap="round" />
                `;

                // SWAP Cross on q2
                svgHtml += `
                    <line x1="${xCenter - 8}" y1="${y2 - 8}" x2="${xCenter + 8}" y2="${y2 + 8}" stroke="#b794f4" stroke-width="3" stroke-linecap="round" />
                    <line x1="${xCenter + 8}" y1="${y2 - 8}" x2="${xCenter - 8}" y2="${y2 + 8}" stroke="#b794f4" stroke-width="3" stroke-linecap="round" />
                `;

                currentX += 50;
            }
        }

        // 4. Measurement Barrier & Meters
        if (isMeasured) {
            currentX += 10;
            // Pre-measurement Barrier
            svgHtml += `
                <line x1="${currentX}" y1="${barrierTop}" x2="${currentX}" y2="${barrierBottom}" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="4,4" />
            `;
            currentX += 30;

            // Meters on all 9 qubits
            for (let q = 0; q < this.numQubits; q++) {
                const y = this.paddingTop + q * this.wireHeight + this.wireHeight / 2;
                svgHtml += `
                    <g class="circuit-meter-anim">
                        <rect x="${currentX}" y="${y - 15}" width="34" height="30" rx="4" fill="#2d3748" stroke="#cbd5e0" stroke-width="1.5" />
                        <path d="M ${currentX + 7} ${y + 8} A 10 10 0 0 1 ${currentX + 27} ${y + 8}" fill="none" stroke="#e2e8f0" stroke-width="1.5" />
                        <line x1="${currentX + 17}" y1="${y + 7}" x2="${currentX + 24}" y2="${y - 4}" stroke="#63b3ed" stroke-width="2" stroke-linecap="round" />
                    </g>
                `;
            }

            // Classical register line at the bottom
            const cY = this.paddingTop + this.numQubits * this.wireHeight + 10;
            svgHtml += `
                <text x="12" y="${cY + 4}" fill="#718096" font-family="'Consolas', monospace" font-size="11" font-weight="bold">c: [9]</text>
                <line x1="${this.paddingLeft - 10}" y1="${cY - 2}" x2="${totalWidth - 30}" y2="${cY - 2}" stroke="#718096" stroke-width="1.2" />
                <line x1="${this.paddingLeft - 10}" y1="${cY + 2}" x2="${totalWidth - 30}" y2="${cY + 2}" stroke="#718096" stroke-width="1.2" />
            `;
        }

        svgHtml += `</svg>`;
        this.container.innerHTML = svgHtml;
    }
}
