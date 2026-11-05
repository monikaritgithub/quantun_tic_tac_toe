/**
 * Quantum Tic-Tac-Toe - Mathematical Quantum Simulation Engine
 * Developed by Quantum Software Developer
 * 
 * Implements complex state vectors, unitary operators (H, X, Ry, SWAP),
 * Bloch vector transformations, Born-rule projective measurement,
 * and Monte Carlo multi-shot quantum circuit evaluation.
 */

class Complex {
    constructor(re = 0, im = 0) {
        this.re = re;
        this.im = im;
    }

    static fromPolar(r, theta) {
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }

    add(other) {
        return new Complex(this.re + other.re, this.im + other.im);
    }

    sub(other) {
        return new Complex(this.re - other.re, this.im - other.im);
    }

    mul(other) {
        if (typeof other === 'number') {
            return new Complex(this.re * other, this.im * other);
        }
        return new Complex(
            this.re * other.re - this.im * other.im,
            this.re * other.im + this.im * other.re
        );
    }

    absSq() {
        return this.re * this.re + this.im * this.im;
    }

    abs() {
        return Math.sqrt(this.absSq());
    }

    phase() {
        return Math.atan2(this.im, this.re);
    }
}

class QubitState {
    constructor(alpha = new Complex(1, 0), beta = new Complex(0, 0)) {
        this.alpha = alpha; // Amplitude for |0>
        this.beta = beta;   // Amplitude for |1>
        this.normalize();
    }

    clone() {
        return new QubitState(
            new Complex(this.alpha.re, this.alpha.im),
            new Complex(this.beta.re, this.beta.im)
        );
    }

    normalize() {
        const norm = Math.sqrt(this.alpha.absSq() + this.beta.absSq());
        if (norm > 1e-12) {
            this.alpha = this.alpha.mul(1 / norm);
            this.beta = this.beta.mul(1 / norm);
        } else {
            this.alpha = new Complex(1, 0);
            this.beta = new Complex(0, 0);
        }
    }

    // Probability of measuring |0> (Player O)
    prob0() {
        return Math.min(1.0, Math.max(0.0, this.alpha.absSq()));
    }

    // Probability of measuring |1> (Player X)
    prob1() {
        return Math.min(1.0, Math.max(0.0, this.beta.absSq()));
    }

    // Apply single-qubit 2x2 unitary matrix [[u00, u01], [u10, u11]]
    applyMatrix(u00, u01, u10, u11) {
        const newAlpha = u00.mul(this.alpha).add(u01.mul(this.beta));
        const newBeta = u10.mul(this.alpha).add(u11.mul(this.beta));
        this.alpha = newAlpha;
        this.beta = newBeta;
        this.normalize();
    }

    // Hadamard Gate: H |0> = |+>, H |1> = |->
    applyH() {
        const invSqrt2 = 1 / Math.SQRT2;
        const u = new Complex(invSqrt2, 0);
        const uNeg = new Complex(-invSqrt2, 0);
        this.applyMatrix(u, u, u, uNeg);
    }

    // Pauli-X (NOT) Gate: |0> <-> |1>, leaves |+> invariant
    applyX() {
        const zero = new Complex(0, 0);
        const one = new Complex(1, 0);
        this.applyMatrix(zero, one, one, zero);
    }

    // Rotation around Y-axis by angle theta
    // Ry(theta) = [[cos(theta/2), -sin(theta/2)], [sin(theta/2), cos(theta/2)]]
    applyRy(theta) {
        const half = theta / 2;
        const c = new Complex(Math.cos(half), 0);
        const s = new Complex(Math.sin(half), 0);
        const negS = new Complex(-Math.sin(half), 0);
        this.applyMatrix(c, negS, s, c);
    }

    // Projective measurement in computational Z-basis
    measure(randomVal = Math.random()) {
        const p0 = this.prob0();
        const outcome = randomVal < p0 ? '0' : '1';
        if (outcome === '0') {
            this.alpha = new Complex(1, 0);
            this.beta = new Complex(0, 0);
        } else {
            this.alpha = new Complex(0, 0);
            this.beta = new Complex(1, 0);
        }
        return outcome;
    }

    // Calculate Bloch sphere vector coordinates (x, y, z)
    getBlochVector() {
        // z = <Z> = |alpha|^2 - |beta|^2
        const z = this.prob0() - this.prob1();
        
        // x = <X> = 2 * Re(alpha* * beta)
        // alpha* = (a_re - i*a_im), beta = (b_re + i*b_im)
        // Re = a_re*b_re + a_im*b_im
        const x = 2 * (this.alpha.re * this.beta.re + this.alpha.im * this.beta.im);
        
        // y = <Y> = 2 * Im(alpha* * beta)
        // Im = a_re*b_im - a_im*b_re
        const y = 2 * (this.alpha.re * this.beta.im - this.alpha.im * this.beta.re);

        const r = Math.sqrt(x*x + y*y + z*z);
        const theta = Math.acos(Math.max(-1, Math.min(1, z / (r || 1))));
        const phi = Math.atan2(y, x);

        return { x, y, z, theta, phi };
    }
}

class QuantumTicTacToeBoard {
    static WINNING_TRIPLES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    constructor() {
        this.reset();
    }

    reset() {
        this.qubits = [];
        this.historyTags = [];
        this.circuitSteps = []; // Sequence of gate operations applied for visualizer
        this.isMeasured = false;
        this.collapsedBoard = Array(9).fill(null);
        this.winsX = 0;
        this.winsO = 0;
        this.winningLinesX = [];
        this.winningLinesO = [];

        // Initialize 9 qubits in superposition |+>
        for (let i = 0; i < 9; i++) {
            const q = new QubitState();
            q.applyH(); // |0> -> |+>
            this.qubits.push(q);
            this.historyTags.push([]);
        }

        // Initial circuit step: Reset + Hadamard on all 9 wires + Barrier
        this.circuitSteps.push({
            type: 'INIT',
            gates: Array(9).fill('H')
        });
    }

    clone() {
        const copy = new QuantumTicTacToeBoard();
        copy.qubits = this.qubits.map(q => q.clone());
        copy.historyTags = this.historyTags.map(tags => [...tags]);
        copy.circuitSteps = JSON.parse(JSON.stringify(this.circuitSteps));
        copy.isMeasured = this.isMeasured;
        copy.collapsedBoard = [...this.collapsedBoard];
        copy.winsX = this.winsX;
        copy.winsO = this.winsO;
        copy.winningLinesX = this.winningLinesX.map(l => [...l]);
        copy.winningLinesO = this.winningLinesO.map(l => [...l]);
        return copy;
    }

    // Move 'O': Apply Ry(-pi/2) to rotate |+> -> |0>
    playO(cell) {
        if (this.isMeasured) return false;
        this.qubits[cell].applyRy(-Math.PI / 2);
        this.historyTags[cell].push('O');
        this.circuitSteps.push({
            type: 'GATE',
            gate: 'Ry(-π/2)',
            qubit: cell,
            player: 'O'
        });
        return true;
    }

    // Move 'X': Apply Ry(+pi/2) to rotate |+> -> |1>
    playX(cell) {
        if (this.isMeasured) return false;
        this.qubits[cell].applyRy(Math.PI / 2);
        this.historyTags[cell].push('X');
        this.circuitSteps.push({
            type: 'GATE',
            gate: 'Ry(+π/2)',
            qubit: cell,
            player: 'X'
        });
        return true;
    }

    // Move 'Not': Apply Pauli-X to flip |0> <-> |1> (leaves |+> invariant)
    playNot(cell) {
        if (this.isMeasured) return false;
        this.qubits[cell].applyX();
        this.historyTags[cell].push('N');
        this.circuitSteps.push({
            type: 'GATE',
            gate: 'X',
            qubit: cell,
            player: 'NOT'
        });
        return true;
    }

    // Move 'SWAP': Transpose states between two squares
    playSwap(cell1, cell2) {
        if (this.isMeasured || cell1 === cell2) return false;
        const temp = this.qubits[cell1];
        this.qubits[cell1] = this.qubits[cell2];
        this.qubits[cell2] = temp;

        this.historyTags[cell1].push(`S(${cell2})`);
        this.historyTags[cell2].push(`S(${cell1})`);

        this.circuitSteps.push({
            type: 'SWAP',
            qubit1: cell1,
            qubit2: cell2
        });
        return true;
    }

    // Move 'Measure': Execute projective measurement and collapse
    measure() {
        if (this.isMeasured) return this.collapsedBoard;

        this.circuitSteps.push({
            type: 'MEASURE'
        });

        for (let i = 0; i < 9; i++) {
            const outcome = this.qubits[i].measure();
            // '0' -> Player O, '1' -> Player X
            this.collapsedBoard[i] = outcome === '0' ? 'O' : 'X';
        }

        this.isMeasured = true;
        this.evaluateWinners();
        return this.collapsedBoard;
    }

    evaluateWinners() {
        this.winsX = 0;
        this.winsO = 0;
        this.winningLinesX = [];
        this.winningLinesO = [];

        for (const triple of QuantumTicTacToeBoard.WINNING_TRIPLES) {
            const [a, b, c] = triple;
            const valA = this.collapsedBoard[a];
            const valB = this.collapsedBoard[b];
            const valC = this.collapsedBoard[c];

            if (valA && valA === valB && valB === valC) {
                if (valA === 'X') {
                    this.winsX++;
                    this.winningLinesX.push(triple);
                } else if (valA === 'O') {
                    this.winsO++;
                    this.winningLinesO.push(triple);
                }
            }
        }
    }

    // Monte Carlo simulation: run N shots on current quantum state to calculate win expectations
    simulateMonteCarlo(shots = 500) {
        let xWinsCount = 0;
        let oWinsCount = 0;
        let tieCount = 0;
        let drawCount = 0;

        for (let s = 0; s < shots; s++) {
            const testBoard = [];
            for (let i = 0; i < 9; i++) {
                const p0 = this.qubits[i].prob0();
                testBoard[i] = Math.random() < p0 ? 'O' : 'X';
            }

            let xWins = 0;
            let oWins = 0;
            for (const [a, b, c] of QuantumTicTacToeBoard.WINNING_TRIPLES) {
                if (testBoard[a] === testBoard[b] && testBoard[b] === testBoard[c]) {
                    if (testBoard[a] === 'X') xWins++;
                    if (testBoard[a] === 'O') oWins++;
                }
            }

            if (xWins > oWins) xWinsCount++;
            else if (oWins > xWins) oWinsCount++;
            else if (xWins > 0 && xWins === oWins) tieCount++;
            else drawCount++;
        }

        return {
            shots,
            probX: xWinsCount / shots,
            probO: oWinsCount / shots,
            probTie: tieCount / shots,
            probDraw: drawCount / shots
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Complex, QubitState, QuantumTicTacToeBoard };
}
