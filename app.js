/**
 * Quantum Tic-Tac-Toe - Main Application Controller & Quantum AI
 * Developed by Quantum Software Developer
 */

class SoundFX {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
    }

    playTone(freq, type = 'sine', duration = 0.15, vol = 0.1) {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Audio policy fallback
        }
    }

    playMove() {
        this.playTone(520, 'sine', 0.12, 0.08);
    }

    playNot() {
        this.playTone(320, 'triangle', 0.2, 0.1);
        setTimeout(() => this.playTone(640, 'sine', 0.15, 0.08), 80);
    }

    playSwap() {
        this.playTone(400, 'sawtooth', 0.1, 0.06);
        setTimeout(() => this.playTone(600, 'sine', 0.15, 0.08), 90);
        setTimeout(() => this.playTone(800, 'sine', 0.2, 0.06), 180);
    }

    playMeasure() {
        this.playTone(200, 'sawtooth', 0.4, 0.12);
        setTimeout(() => this.playTone(440, 'sine', 0.3, 0.1), 100);
        setTimeout(() => this.playTone(880, 'sine', 0.5, 0.09), 250);
    }

    playWin() {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.3, 0.1), i * 120);
        });
    }
}

class QuantumGameApp {
    constructor() {
        this.board = new QuantumTicTacToeBoard();
        this.circuitViz = new CircuitVisualizer('circuit-container');
        this.blochViz = new BlochSphereVisualizer('bloch-canvas');
        this.sound = new SoundFX();

        this.currentTurn = 'O'; // 'O' or 'X'
        this.selectedAction = null; // 'O', 'X', 'Not', 'SWAP'
        this.swapTarget = null;
        this.inspectedCell = 4; // Start inspecting center square
        this.vsAI = false;
        this.aiThinking = false;
        this.stats = { xWins: 0, oWins: 0, ties: 0, total: 0 };

        this.initDOM();
        this.renderAll();
    }

    initDOM() {
        // Tile buttons
        const grid = document.getElementById('board-grid');
        grid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const tile = document.createElement('div');
            tile.className = 'quantum-tile';
            tile.id = `tile-${i}`;
            tile.dataset.index = i;
            tile.addEventListener('click', () => this.handleTileClick(i));
            grid.appendChild(tile);
        }

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.handleActionSelect(action);
            });
        });

        // Mode switch
        const modeBtn = document.getElementById('mode-btn');
        if (modeBtn) {
            modeBtn.addEventListener('click', () => {
                this.vsAI = !this.vsAI;
                modeBtn.textContent = this.vsAI ? "🤖 Mode: vs Quantum AI" : "👥 Mode: 2-Player Local";
                modeBtn.classList.toggle('active', this.vsAI);
                this.resetGame();
            });
        }

        // Reset / Replay
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetGame());

        // Measure button
        const measureBtn = document.getElementById('measure-btn');
        if (measureBtn) measureBtn.addEventListener('click', () => this.executeMeasure());

        // Help modal
        const helpBtn = document.getElementById('help-btn');
        const modal = document.getElementById('help-modal');
        const closeBtn = document.getElementById('close-modal');
        if (helpBtn && modal) {
            helpBtn.addEventListener('click', () => modal.classList.add('visible'));
        }
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
        }

        // Sound toggle
        const soundBtn = document.getElementById('sound-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.sound.enabled = !this.sound.enabled;
                soundBtn.textContent = this.sound.enabled ? "🔊 Sound ON" : "🔇 Sound OFF";
            });
        }

        window.addEventListener('resize', () => {
            this.blochViz.resize();
            this.blochViz.render(this.board.qubits[this.inspectedCell], `Square ${this.inspectedCell}`);
        });
    }

    handleActionSelect(action) {
        if (this.board.isMeasured || this.aiThinking) return;

        if (this.selectedAction === action) {
            this.selectedAction = null;
            this.swapTarget = null;
            this.setStatusMessage(`Cancelled. Select an action.`);
        } else {
            this.selectedAction = action;
            this.swapTarget = null;

            if (action === 'SWAP') {
                this.setStatusMessage(`SWAP Selected: Click the first square to swap.`);
            } else if (action === 'O') {
                this.setStatusMessage(`Move O: Click a square to rotate toward |0⟩ (Player O).`);
            } else if (action === 'X') {
                this.setStatusMessage(`Move X: Click a square to rotate toward |1⟩ (Player X).`);
            } else if (action === 'Not') {
                this.setStatusMessage(`NOT Gate: Click an owned square to flip its state.`);
            }
        }
        this.updateActionButtons();
    }

    handleTileClick(cellIndex) {
        // Always update inspected cell for Bloch sphere
        this.inspectedCell = cellIndex;
        this.blochViz.render(this.board.qubits[cellIndex], `Square ${cellIndex}`);
        this.updateTelemetry(cellIndex);

        if (this.board.isMeasured || this.aiThinking) return;

        if (!this.selectedAction) {
            this.setStatusMessage(`Square ${cellIndex} inspected on Bloch sphere. Select a move button above!`);
            return;
        }

        if (this.selectedAction === 'O') {
            this.board.playO(cellIndex);
            this.sound.playMove();
            this.afterMoveMade(`Player O applied Ry(-π/2) to Square ${cellIndex}`);

        } else if (this.selectedAction === 'X') {
            this.board.playX(cellIndex);
            this.sound.playMove();
            this.afterMoveMade(`Player X applied Ry(+π/2) to Square ${cellIndex}`);

        } else if (this.selectedAction === 'Not') {
            this.board.playNot(cellIndex);
            this.sound.playNot();
            this.afterMoveMade(`Pauli-X (NOT) applied to Square ${cellIndex}`);

        } else if (this.selectedAction === 'SWAP') {
            if (this.swapTarget === null) {
                this.swapTarget = cellIndex;
                this.setStatusMessage(`SWAP: First square is ${cellIndex}. Now click the second square to swap!`);
                this.highlightTile(cellIndex, true);
                return;
            } else if (this.swapTarget === cellIndex) {
                this.swapTarget = null;
                this.setStatusMessage(`SWAP cancelled for same square. Select first square again.`);
                this.highlightTile(cellIndex, false);
                return;
            } else {
                const target = this.swapTarget;
                this.board.playSwap(target, cellIndex);
                this.sound.playSwap();
                this.swapTarget = null;
                this.afterMoveMade(`Quantum SWAP executed between Square ${target} and Square ${cellIndex}`);
            }
        }
    }

    afterMoveMade(desc) {
        this.selectedAction = null;
        this.swapTarget = null;
        this.updateActionButtons();
        this.renderAll();
        this.addLog(desc);

        // Turn toggle
        this.currentTurn = this.currentTurn === 'O' ? 'X' : 'O';

        if (this.vsAI && this.currentTurn === 'X' && !this.board.isMeasured) {
            this.executeAIMove();
        } else {
            this.setStatusMessage(`Turn: Player ${this.currentTurn}. Select an action.`);
        }
    }

    executeMeasure() {
        if (this.board.isMeasured || this.aiThinking) return;

        this.sound.playMeasure();
        this.board.measure();
        this.renderAll();

        this.stats.total++;
        if (this.board.winsX > this.board.winsO) {
            this.stats.xWins++;
            this.setStatusMessage(`⚡ Wavefunction Collapsed! Player X WINS! (Lines: ${this.board.winsX} to ${this.board.winsO})`, 'win-x');
            this.sound.playWin();
        } else if (this.board.winsO > this.board.winsX) {
            this.stats.oWins++;
            this.setStatusMessage(`⚡ Wavefunction Collapsed! Player O WINS! (Lines: ${this.board.winsO} to ${this.board.winsX})`, 'win-o');
            this.sound.playWin();
        } else if (this.board.winsX > 0 && this.board.winsX === this.board.winsO) {
            this.stats.ties++;
            this.setStatusMessage(`⚡ QUANTUM TIE! Both players formed winning lines simultaneously! (${this.board.winsX} each)`, 'tie');
            this.sound.playWin();
        } else {
            this.setStatusMessage(`⚡ Measurement Complete: No 3-in-a-row formed (Draw). Click New Game!`, 'draw');
        }

        this.addLog(`Measurement executed. Final lines - Player O: ${this.board.winsO}, Player X: ${this.board.winsX}`);
        this.updateScoreboard();
    }

    executeAIMove() {
        this.aiThinking = true;
        this.setStatusMessage(`🤖 Quantum AI is calculating optimal state transformation...`);

        setTimeout(() => {
            const aiMove = this.calculateAIMove();
            if (aiMove.action === 'MEASURE') {
                this.aiThinking = false;
                this.executeMeasure();
                return;
            }

            if (aiMove.action === 'X') {
                this.board.playX(aiMove.cell);
                this.sound.playMove();
                this.addLog(`🤖 AI applied Ry(+π/2) on Square ${aiMove.cell}`);
            } else if (aiMove.action === 'NOT') {
                this.board.playNot(aiMove.cell);
                this.sound.playNot();
                this.addLog(`🤖 AI applied Pauli-X on Square ${aiMove.cell}`);
            } else if (aiMove.action === 'SWAP') {
                this.board.playSwap(aiMove.cell1, aiMove.cell2);
                this.sound.playSwap();
                this.addLog(`🤖 AI executed SWAP between Square ${aiMove.cell1} and ${aiMove.cell2}`);
            }

            this.aiThinking = false;
            this.currentTurn = 'O';
            this.renderAll();
            this.setStatusMessage(`Turn: Player O. Select an action.`);
        }, 600);
    }

    calculateAIMove() {
        // AI Strategy:
        // 1. Check Monte Carlo expectation: if AI (X) already has > 65% win probability, trigger MEASURE!
        const mc = this.board.simulateMonteCarlo(150);
        if (mc.probX > 0.65) {
            return { action: 'MEASURE' };
        }

        // 2. Check if AI can secure a win on a line:
        for (const [a, b, c] of QuantumTicTacToeBoard.WINNING_TRIPLES) {
            const pX_a = this.board.qubits[a].prob1();
            const pX_b = this.board.qubits[b].prob1();
            const pX_c = this.board.qubits[c].prob1();

            // Two squares strongly X, third square unowned or O
            if (pX_a > 0.8 && pX_b > 0.8 && pX_c < 0.8) {
                if (this.board.qubits[c].prob0() > 0.8) {
                    return { action: 'NOT', cell: c }; // Flip O to X!
                }
                return { action: 'X', cell: c };
            }
            if (pX_a > 0.8 && pX_c > 0.8 && pX_b < 0.8) {
                if (this.board.qubits[b].prob0() > 0.8) return { action: 'NOT', cell: b };
                return { action: 'X', cell: b };
            }
            if (pX_b > 0.8 && pX_c > 0.8 && pX_a < 0.8) {
                if (this.board.qubits[a].prob0() > 0.8) return { action: 'NOT', cell: a };
                return { action: 'X', cell: a };
            }
        }

        // 3. Block opponent (Player O) line:
        for (const [a, b, c] of QuantumTicTacToeBoard.WINNING_TRIPLES) {
            const pO_a = this.board.qubits[a].prob0();
            const pO_b = this.board.qubits[b].prob0();
            const pO_c = this.board.qubits[c].prob0();

            if (pO_a > 0.8 && pO_b > 0.8 && pO_c < 0.8) {
                return { action: 'X', cell: c };
            }
            if (pO_a > 0.8 && pO_c > 0.8 && pO_b < 0.8) {
                return { action: 'X', cell: b };
            }
            if (pO_b > 0.8 && pO_c > 0.8 && pO_a < 0.8) {
                return { action: 'X', cell: a };
            }
        }

        // 4. Claim strategic Center (4) or Corners (0, 2, 6, 8)
        if (this.board.qubits[4].prob1() < 0.8 && this.board.qubits[4].prob0() < 0.8) {
            return { action: 'X', cell: 4 };
        }

        const corners = [0, 2, 6, 8].filter(c => this.board.qubits[c].prob1() < 0.8 && this.board.qubits[c].prob0() < 0.8);
        if (corners.length > 0) {
            const chosen = corners[Math.floor(Math.random() * corners.length)];
            return { action: 'X', cell: chosen };
        }

        // 5. Claim any unowned or counter an O
        const openSquares = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(s => this.board.qubits[s].prob1() < 0.8);
        if (openSquares.length > 0) {
            return { action: 'X', cell: openSquares[0] };
        }

        return { action: 'MEASURE' };
    }

    resetGame() {
        this.board.reset();
        this.currentTurn = 'O';
        this.selectedAction = null;
        this.swapTarget = null;
        this.aiThinking = false;
        this.inspectedCell = 4;
        this.updateActionButtons();
        this.renderAll();
        this.setStatusMessage(`New round started! All 9 squares in superposition |+⟩. Player O's turn.`);
        this.addLog(`Game reset. Initialized 9 qubits in superposition |+⟩.`);
    }

    renderAll() {
        this.renderBoard();
        this.circuitViz.render(this.board.circuitSteps, this.board.isMeasured);
        this.blochViz.resize();
        this.blochViz.render(this.board.qubits[this.inspectedCell], `Square ${this.inspectedCell}`);
        this.updateTelemetry(this.inspectedCell);
        this.updateMonteCarlo();
        this.updateScoreboard();
    }

    renderBoard() {
        for (let i = 0; i < 9; i++) {
            const tile = document.getElementById(`tile-${i}`);
            if (!tile) continue;

            const q = this.board.qubits[i];
            const p0 = Math.round(q.prob0() * 100);
            const p1 = Math.round(q.prob1() * 100);
            const history = this.board.historyTags[i].join(' ');

            tile.className = 'quantum-tile';
            if (i === this.inspectedCell) tile.classList.add('inspected');

            if (this.board.isMeasured) {
                const owner = this.board.collapsedBoard[i];
                tile.classList.add('measured', owner === 'O' ? 'tile-o' : 'tile-x');

                // Check if part of winning line
                const isWinO = this.board.winningLinesO.some(l => l.includes(i));
                const isWinX = this.board.winningLinesX.some(l => l.includes(i));
                if (isWinO || isWinX) tile.classList.add('winning-tile');

                tile.innerHTML = `
                    <div class="tile-header">
                        <span class="tile-idx">#${i}</span>
                        <span class="tile-state">|${owner === 'O' ? '0' : '1'}⟩</span>
                    </div>
                    <div class="tile-body">
                        <div class="collapsed-symbol ${owner === 'O' ? 'sym-o' : 'sym-x'}">${owner}</div>
                    </div>
                    <div class="tile-footer">
                        <span class="tile-tags">${history || 'no gates'}</span>
                    </div>
                `;
            } else {
                let stateBadge = '|+⟩';
                if (p0 >= 95) stateBadge = '|0⟩ (O)';
                else if (p1 >= 95) stateBadge = '|1⟩ (X)';
                else if (p0 > 55) stateBadge = `~|0⟩ ${p0}%`;
                else if (p1 > 55) stateBadge = `~|1⟩ ${p1}%`;

                tile.innerHTML = `
                    <div class="tile-header">
                        <span class="tile-idx">#${i}</span>
                        <span class="tile-state">${stateBadge}</span>
                    </div>
                    <div class="tile-body">
                        <div class="prob-bars">
                            <div class="prob-bar bar-o" style="width: ${p0}%" title="P(O) = ${p0}%"></div>
                            <div class="prob-bar bar-x" style="width: ${p1}%" title="P(X) = ${p1}%"></div>
                        </div>
                        <div class="prob-text">
                            <span class="p-o">O: ${p0}%</span>
                            <span class="p-x">X: ${p1}%</span>
                        </div>
                    </div>
                    <div class="tile-footer">
                        <span class="tile-tags">${history || 'neutral'}</span>
                    </div>
                `;
            }
        }
    }

    updateTelemetry(cellIdx) {
        const q = this.board.qubits[cellIdx];
        const bloch = q.getBlochVector();
        const p0 = (q.prob0() * 100).toFixed(1);
        const p1 = (q.prob1() * 100).toFixed(1);

        document.getElementById('tel-target').textContent = `Square #${cellIdx}`;
        document.getElementById('tel-theta').textContent = `${(bloch.theta * 180 / Math.PI).toFixed(1)}°`;
        document.getElementById('tel-phi').textContent = `${(bloch.phi * 180 / Math.PI).toFixed(1)}°`;
        document.getElementById('tel-z').textContent = bloch.z.toFixed(2);
        document.getElementById('tel-p0').textContent = `${p0}%`;
        document.getElementById('tel-p1').textContent = `${p1}%`;
    }

    updateMonteCarlo() {
        if (this.board.isMeasured) {
            document.getElementById('mc-bar-container').style.display = 'none';
            return;
        }
        document.getElementById('mc-bar-container').style.display = 'block';

        const mc = this.board.simulateMonteCarlo(120);
        const pX = Math.round(mc.probX * 100);
        const pO = Math.round(mc.probO * 100);
        const pTie = Math.round(mc.probTie * 100);
        const pDraw = Math.round(mc.probDraw * 100);

        document.getElementById('mc-fill-o').style.width = `${pO}%`;
        document.getElementById('mc-fill-x').style.width = `${pX}%`;
        document.getElementById('mc-fill-tie').style.width = `${pTie}%`;
        document.getElementById('mc-fill-draw').style.width = `${pDraw}%`;

        document.getElementById('mc-label-o').textContent = `O: ${pO}%`;
        document.getElementById('mc-label-x').textContent = `X: ${pX}%`;
        document.getElementById('mc-label-tie').textContent = `Tie: ${pTie}%`;
        document.getElementById('mc-label-draw').textContent = `Draw: ${pDraw}%`;
    }

    updateActionButtons() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.action === this.selectedAction);
        });
    }

    highlightTile(cellIdx, active) {
        const tile = document.getElementById(`tile-${cellIdx}`);
        if (tile) tile.classList.toggle('swap-target', active);
    }

    setStatusMessage(msg, type = 'normal') {
        const el = document.getElementById('status-msg');
        if (!el) return;
        el.textContent = msg;
        el.className = 'status-banner';
        if (type !== 'normal') el.classList.add(`status-${type}`);
    }

    addLog(text) {
        const log = document.getElementById('game-log');
        if (!log) return;
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const time = new Date().toLocaleTimeString().split(' ')[0];
        entry.innerHTML = `<span class="log-time">[${time}]</span> ${text}`;
        log.insertBefore(entry, log.firstChild);
    }

    updateScoreboard() {
        document.getElementById('score-o').textContent = this.stats.oWins;
        document.getElementById('score-x').textContent = this.stats.xWins;
        document.getElementById('score-ties').textContent = this.stats.ties;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new QuantumGameApp();
});
