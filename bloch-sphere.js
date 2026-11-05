/**
 * Interactive 3D/2D Bloch Sphere Visualizer - Light Theme Edition
 * Developed by Quantum Software Developer
 * 
 * Projects the single-qubit state vector on the Bloch sphere,
 * calculating polar/azimuthal angles and quantum expectation values.
 */

class BlochSphereVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
        }
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const size = Math.min(260, Math.max(180, rect.width - 20));
        this.canvas.width = size * window.devicePixelRatio || size;
        this.canvas.height = size * window.devicePixelRatio || size;
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;
        this.scale = window.devicePixelRatio || 1;
    }

    render(qubitState, label = "Square 0") {
        if (!this.canvas || !this.ctx) return;
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = (width / 2) * 0.72;

        ctx.clearRect(0, 0, width, height);

        // 1. Sphere background radial gradient (White / Soft Slate Light Theme)
        const bgGrad = ctx.createRadialGradient(
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            radius * 0.1,
            centerX,
            centerY,
            radius
        );
        bgGrad.addColorStop(0, '#ffffff');
        bgGrad.addColorStop(0.7, '#f8fafc');
        bgGrad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Sphere Outer Ring
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2 * this.scale;
        ctx.stroke();

        // 3. Equator Ellipse (X-Y plane)
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius, radius * 0.35, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5 * this.scale;
        ctx.setLineDash([4 * this.scale, 4 * this.scale]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4. Z-Axis (Vertical)
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius * 1.15);
        ctx.lineTo(centerX, centerY + radius * 1.15);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5 * this.scale;
        ctx.stroke();

        // 5. X-Axis (Projected Forward-Right)
        const xProjX = centerX + radius * 0.7 * Math.cos(Math.PI / 4);
        const xProjY = centerY + radius * 0.35 * Math.sin(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(xProjX, xProjY);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2 * this.scale;
        ctx.stroke();

        // Labels on Poles
        ctx.font = `bold ${11 * this.scale}px 'Consolas', monospace`;
        ctx.fillStyle = '#2563eb'; // Deep Blue for O
        ctx.textAlign = 'center';
        ctx.fillText('|0⟩ (O)', centerX, centerY - radius * 1.2);

        ctx.fillStyle = '#dc2626'; // Red for X
        ctx.fillText('|1⟩ (X)', centerX, centerY + radius * 1.32);

        ctx.fillStyle = '#16a34a'; // Green for |+>
        ctx.textAlign = 'left';
        ctx.fillText('|+⟩', xProjX + 4 * this.scale, xProjY + 4 * this.scale);

        // 6. State Vector Projection
        const bloch = qubitState.getBlochVector();
        // 3D to 2D isometric projection
        const isoX = bloch.x * 0.7071 - bloch.y * 0.7071;
        const isoY = (bloch.x * 0.7071 + bloch.y * 0.7071) * 0.35 - bloch.z;

        const tipX = centerX + isoX * radius;
        const tipY = centerY + isoY * radius;

        // Shadow vector line on equator plane
        const shadowIsoY = (bloch.x * 0.7071 + bloch.y * 0.7071) * 0.35;
        const shadowTipY = centerY + shadowIsoY * radius;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(tipX, shadowTipY);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.lineWidth = 1.2 * this.scale;
        ctx.setLineDash([2 * this.scale, 2 * this.scale]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Vertical drop line from tip to shadow
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX, shadowTipY);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
        ctx.stroke();

        // Main State Vector Arrow
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(tipX, tipY);

        // Color based on bias toward 0 or 1
        const p0 = qubitState.prob0();
        let arrowColor = '#16a34a'; // Green for neutral |+>
        if (p0 > 0.6) arrowColor = '#2563eb'; // Blue for O
        else if (p0 < 0.4) arrowColor = '#dc2626'; // Red for X

        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 3 * this.scale;
        ctx.stroke();

        // Arrow tip head circle
        ctx.beginPath();
        ctx.arc(tipX, tipY, 5 * this.scale, 0, Math.PI * 2);
        ctx.fillStyle = arrowColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * this.scale;
        ctx.stroke();

        // Center origin dot
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3.5 * this.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#475569';
        ctx.fill();
    }
}
