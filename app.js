/**
 * Quantum Tic-Tac-Toe - Main Application Controller & Quantum AI
 * Fixed Step Budget (Auto-Measure) & Mobile-Optimized Edition
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

        this.maxSteps = 9; // Fixed step limit: 9 moves total (matching 9 squares of 3x3 board)
        this.currentStep = 0;

        this.currentTurn = 'O'; // 'O' or 'X'
        this.selectedAction = null; // 'O', 'X', 'Not', 'SWAP'
        this.swapTarget = null;
        this.inspectedCell = 4; // Center square default
        this.vsAI = false;
        this.aiThinking = false;
        this.stats = { xWins: 0, oWins: 0, ties: 0, total: 0 };

        this.initDOM();
        this.renderAll();
        this.updateStepTracker();
    }

    initDOM() {
        // Tile grid
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

        // Mobile Segmented Tab Controls
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active-panel'));
                btn.classList.add('active');
                
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.add('active-panel');
                }
                
                if (targetId === 'panel-bloch') {
                    setTimeout(() => {
                        this.blochViz.resize();
                        this.blochViz.render(this.board.qubits[this.inspectedCell], `Square ${this.inspectedCell}`);
                    }, 50);
                } else if (targetId === 'panel-circuit') {
                    this.circuitViz.render(this.board.circuitSteps, this.board.isMeasured);
                }
            });
        });

        // Mode switch with real icons
        const modeBtn = document.getElementById('mode-btn');
        if (modeBtn) {
            modeBtn.addEventListener('click', () => {
                this.vsAI = !this.vsAI;
                modeBtn.classList.toggle('active', this.vsAI);
                if (this.vsAI) {
                    modeBtn.innerHTML = `
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/>
                        </svg>
                        <span class="btn-text">vs AI</span>
                    `;
                } else {
                    modeBtn.innerHTML = `
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span class="btn-text">2-Player</span>
                    `;
                }
                this.resetGame();
            });
        }

        // Sound toggle with real icons
        const soundBtn = document.getElementById('sound-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.sound.enabled = !this.sound.enabled;
                if (this.sound.enabled) {
                    soundBtn.innerHTML = `
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                        </svg>
                        <span class="btn-text">Sound</span>
                    `;
                } else {
                    soundBtn.innerHTML = `
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                        </svg>
                        <span class="btn-text">Mute</span>
                    `;
                }
            });
        }

        // Reset / Replay
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetGame());

        // Measure button (Manual early measurement)
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

        window.addEventListener('resize', () => {
            this.blochViz.resize();
            this.blochViz.render(this.board.qubits[this.inspectedCell], `Square ${this.inspectedCell}`);
        });
    }

    updateStepTracker() {
        const badge = document.getElementById('step-counter-badge');
        const fill = document.getElementById('step-progress-fill');
        if (badge) {
            badge.textContent = `Step ${this.currentStep} / ${this.maxSteps}`;
        }
        if (fill) {
            const pct = Math.min(100, Math.round((this.currentStep / this.maxSteps) * 100));
            fill.style.width = `${pct}%`;
            if (pct >= 88) fill.style.background = '#dc2626'; // Red when 1 step remains
            else if (pct >= 55) fill.style.background = '#d97706'; // Amber midway
            else fill.style.background = '#2563eb'; // Blue early
        }
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
            this.setStatusMessage(`Square #${cellIndex} inspected. Select a move action.`);
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
                this.setStatusMessage(`SWAP: First square #${cellIndex}. Click second square.`);
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
                this.afterMoveMade(`SWAP executed between Square ${target} and ${cellIndex}`);
            }
        }
    }

    afterMoveMade(desc) {
        this.currentStep++;
        this.updateStepTracker();
        this.selectedAction = null;
        this.swapTarget = null;
        this.updateActionButtons();
        this.renderAll();
        this.addLog(desc);

        // Check if fixed step budget reached -> Auto-measure!
        if (this.currentStep >= this.maxSteps) {
            this.setStatusMessage(`Step limit reached (${this.currentStep}/${this.maxSteps})! Automatically collapsing wavefunction...`, 'normal');
            setTimeout(() => {
                this.executeMeasure();
            }, 550);
            return;
        }

        // Turn toggle
        this.currentTurn = this.currentTurn === 'O' ? 'X' : 'O';

        if (this.vsAI && this.currentTurn === 'X' && !this.board.isMeasured) {
            this.executeAIMove();
        } else {
            this.setStatusMessage(`Turn: Player ${this.currentTurn} (Step ${this.currentStep}/${this.maxSteps}). Select action.`);
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
            this.setStatusMessage(`Wavefunction Collapsed: Player X WINS! (Lines: ${this.board.winsX} to ${this.board.winsO})`, 'win-x');
            this.sound.playWin();
        } else if (this.board.winsO > this.board.winsX) {
            this.stats.oWins++;
            this.setStatusMessage(`Wavefunction Collapsed: Player O WINS! (Lines: ${this.board.winsO} to ${this.board.winsX})`, 'win-o');
            this.sound.playWin();
        } else if (this.board.winsX > 0 && this.board.winsX === this.board.winsO) {
            this.stats.ties++;
            this.setStatusMessage(`QUANTUM TIE! Both players formed lines (${this.board.winsX} each).`, 'tie');
            this.sound.playWin();
        } else {
            this.setStatusMessage(`Measurement Complete: No lines completed (Draw). Click Reset.`, 'draw');
        }

        this.addLog(`Measured at Step ${this.currentStep}. Final lines - O: ${this.board.winsO}, X: ${this.board.winsX}`);
        this.updateScoreboard();
    }

    executeAIMove() {
        this.aiThinking = true;
        this.setStatusMessage(`Quantum AI is calculating state transformation...`);

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
                this.addLog(`AI applied Ry(+π/2) on Square ${aiMove.cell}`);
            } else if (aiMove.action === 'NOT') {
                this.board.playNot(aiMove.cell);
                this.sound.playNot();
                this.addLog(`AI applied Pauli-X on Square ${aiMove.cell}`);
            } else if (aiMove.action === 'SWAP') {
                this.board.playSwap(aiMove.cell1, aiMove.cell2);
                this.sound.playSwap();
                this.addLog(`AI executed SWAP between Square ${aiMove.cell1} and ${aiMove.cell2}`);
            }

            this.currentStep++;
            this.updateStepTracker();
            this.aiThinking = false;

            // Check if step budget reached after AI move
            if (this.currentStep >= this.maxSteps) {
                this.renderAll();
                this.setStatusMessage(`Step limit reached (${this.currentStep}/${this.maxSteps})! Automatically collapsing wavefunction...`, 'normal');
                setTimeout(() => {
                    this.executeMeasure();
                }, 550);
                return;
            }

            this.currentTurn = 'O';
            this.renderAll();
            this.setStatusMessage(`Turn: Player O (Step ${this.currentStep}/${this.maxSteps}). Select action.`);
        }, 550);
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

            if (pX_a > 0.8 && pX_b > 0.8 && pX_c < 0.8) {
                if (this.board.qubits[c].prob0() > 0.8) return { action: 'NOT', cell: c };
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

        // 5. Claim any open square
        const openSquares = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(s => this.board.qubits[s].prob1() < 0.8);
        if (openSquares.length > 0) {
            return { action: 'X', cell: openSquares[0] };
        }

        return { action: 'MEASURE' };
    }

    resetGame() {
        this.board.reset();
        this.currentStep = 0;
        this.currentTurn = 'O';
        this.selectedAction = null;
        this.swapTarget = null;
        this.aiThinking = false;
        this.inspectedCell = 4;
        this.updateActionButtons();
        this.updateStepTracker();
        this.renderAll();
        this.setStatusMessage(`New round started. All 9 squares in superposition |+⟩. Player O's turn.`);
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
                        <span>${history || 'collapsed'}</span>
                    </div>
                `;
            } else {
                let stateBadge = '|+⟩';
                if (p0 >= 95) stateBadge = '|0⟩';
                else if (p1 >= 95) stateBadge = '|1⟩';
                else if (p0 > 55) stateBadge = `~|0⟩`;
                else if (p1 > 55) stateBadge = `~|1⟩`;

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
                            <span class="p-o">O ${p0}%</span>
                            <span class="p-x">X ${p1}%</span>
                        </div>
                    </div>
                    <div class="tile-footer">
                        <span>${history || 'neutral'}</span>
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
