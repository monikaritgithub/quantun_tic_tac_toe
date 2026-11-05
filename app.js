/**
 * Quantum Tic-Tac-Toe - Main Application Controller
 * Allan Goff's Authentic Quantum Mechanics Model
 * Responsive Web Application for Desktop & Mobile
 */

class SoundFX {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, duration, type = 'sine', gainVal = 0.15) {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Audio policy fallback
        }
    }

    playSelect() {
        this.playTone(520, 0.08, 'sine', 0.1);
    }

    playEntangle() {
        if (!this.enabled) return;
        this.playTone(440, 0.12, 'sine', 0.12);
        setTimeout(() => this.playTone(660, 0.18, 'sine', 0.12), 60);
    }

    playCycleAlert() {
        if (!this.enabled) return;
        this.playTone(320, 0.15, 'triangle', 0.2);
        setTimeout(() => this.playTone(480, 0.2, 'triangle', 0.22), 120);
        setTimeout(() => this.playTone(640, 0.3, 'sine', 0.25), 240);
    }

    playCollapse() {
        if (!this.enabled) return;
        this.playTone(220, 0.25, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(330, 0.3, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(550, 0.4, 'sine', 0.25), 220);
    }

    playWin() {
        if (!this.enabled) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.3, 'sine', 0.2), i * 110);
        });
    }
}

class QuantumGameApp {
    constructor() {
        this.engine = new QuantumTicTacToeEngine();
        this.graphViz = new EntanglementGraphVisualizer('graph-container');
        this.sound = new SoundFX();
        this.tutorial = new InteractiveTutorial(this.sound);

        this.vsAI = true; // Default: Player vs Quantum AI
        this.aiThinking = false;

        // Current turn's first selected square (0..8) or null
        this.firstSelectedSquare = null;

        // Scores
        this.scores = {
            X: 0,
            O: 0,
            draws: 0,
            totalGames: 0
        };

        this.initDOM();
        this.renderAll();

        // Check if user is new, offer tutorial
        try {
            const hasSeen = localStorage.getItem('qt3_tutorial_seen');
            if (!hasSeen) {
                setTimeout(() => {
                    this.tutorial.open(0);
                    localStorage.setItem('qt3_tutorial_seen', 'true');
                }, 800);
            }
        } catch (e) {
            // LocalStorage fallback
        }
    }

    initDOM() {
        // Mode toggle (Pass & Play vs AI)
        const mode2P = document.getElementById('mode-2p');
        const modeAI = document.getElementById('mode-ai');

        if (mode2P && modeAI) {
            mode2P.addEventListener('click', () => {
                if (this.vsAI) {
                    this.vsAI = false;
                    mode2P.classList.add('active');
                    modeAI.classList.remove('active');
                    this.resetGame();
                }
            });
            modeAI.addEventListener('click', () => {
                if (!this.vsAI) {
                    this.vsAI = true;
                    modeAI.classList.add('active');
                    mode2P.classList.remove('active');
                    this.resetGame();
                }
            });
        }

        // Sound toggle
        const soundBtn = document.getElementById('sound-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.sound.enabled = !this.sound.enabled;
                const label = soundBtn.querySelector('.btn-text');
                if (this.sound.enabled) {
                    soundBtn.classList.remove('muted');
                    if (label) label.textContent = 'Sound: ON';
                } else {
                    soundBtn.classList.add('muted');
                    if (label) label.textContent = 'Sound: OFF';
                }
            });
        }

        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetGame());

        // Quick Rules Modal
        const helpBtn = document.getElementById('help-btn');
        const modal = document.getElementById('help-modal');
        const closeModal = document.getElementById('close-modal');
        if (helpBtn && modal) {
            helpBtn.addEventListener('click', () => modal.classList.add('visible'));
        }
        if (closeModal && modal) {
            closeModal.addEventListener('click', () => modal.classList.remove('visible'));
        }

        // Segmented Mobile Tabs
        const tabBtns = document.querySelectorAll('.mobile-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tabTarget = btn.getAttribute('data-tab');
                this.switchMobileTab(tabTarget);
            });
        });

        // Initialize 3x3 Board Grid click listeners
        const boardEl = document.getElementById('quantum-board');
        if (boardEl) {
            boardEl.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div');
                cell.className = 'board-tile';
                cell.setAttribute('data-index', i);
                cell.addEventListener('click', () => this.handleSquareClick(i));
                boardEl.appendChild(cell);
            }
        }
    }

    switchMobileTab(tabName) {
        const boardCol = document.getElementById('board-column');
        const graphCol = document.getElementById('graph-column');
        const historyCol = document.getElementById('history-column');

        if (!boardCol || !graphCol || !historyCol) return;

        // Hide all first on mobile
        boardCol.classList.remove('mobile-active');
        graphCol.classList.remove('mobile-active');
        historyCol.classList.remove('mobile-active');

        if (tabName === 'board') {
            boardCol.classList.add('mobile-active');
        } else if (tabName === 'graph') {
            graphCol.classList.add('mobile-active');
        } else if (tabName === 'history') {
            historyCol.classList.add('mobile-active');
        }
    }

    resetGame() {
        this.engine.reset();
        this.firstSelectedSquare = null;
        this.aiThinking = false;
        this.hideCollapseModal();
        this.renderAll();
        this.addLogEntry('New game started. Player X begins.');
    }

    handleSquareClick(sqIndex) {
        if (this.engine.isGameOver || this.aiThinking || this.engine.pendingCycle) return;

        // If in vs AI mode and it's AI's turn, ignore clicks
        if (this.vsAI && this.engine.currentTurn === 'O') return;

        // Check if square is already collapsed
        if (this.engine.classical[sqIndex] !== null) {
            this.sound.playSelect();
            this.flashStatus(`Square #${sqIndex + 1} is already collapsed! Choose an open square.`, 'warning');
            return;
        }

        // First square selection
        if (this.firstSelectedSquare === null) {
            this.firstSelectedSquare = sqIndex;
            this.sound.playSelect();
            this.renderBoard();
            this.setStatusMessage(
                `Square #${sqIndex + 1} selected (1/2). Tap a second square to complete Move ${this.engine.currentTurn}${this.engine.moveNum}.`,
                'active'
            );
            return;
        }

        // Tapping the same square deselects it
        if (this.firstSelectedSquare === sqIndex) {
            this.firstSelectedSquare = null;
            this.sound.playSelect();
            this.renderBoard();
            this.setStatusMessage(
                `Selection cancelled. Player ${this.engine.currentTurn}: Tap square 1 of 2.`,
                'normal'
            );
            return;
        }

        // Second square selected: commit move!
        const sq1 = this.firstSelectedSquare;
        const sq2 = sqIndex;
        this.firstSelectedSquare = null;

        this.sound.playEntangle();
        const result = this.engine.playMove(sq1, sq2);

        if (!result.success) {
            this.flashStatus(result.error || 'Invalid move', 'warning');
            this.renderBoard();
            return;
        }

        const movePlayer = result.cycle ? result.pendingCycle.triggerMove.player : (this.engine.currentTurn === 'X' ? 'O' : 'X');
        const moveId = this.engine.moveNum - 1;
        this.addLogEntry(`Move ${movePlayer}${moveId}: Entangled Squares #${sq1 + 1} and #${sq2 + 1}`);

        if (result.cycle) {
            // Cyclic entanglement triggered!
            this.sound.playCycleAlert();
            this.renderAll();
            this.showCollapseModal(result.pendingCycle);
        } else {
            this.renderAll();
            this.checkAndExecuteAITurn();
        }
    }

    checkAndExecuteAITurn() {
        if (this.engine.isGameOver || this.engine.pendingCycle) return;

        if (this.vsAI && this.engine.currentTurn === 'O') {
            this.aiThinking = true;
            this.setStatusMessage(`Quantum AI is evaluating entanglement states...`, 'thinking');
            this.renderBoard();

            setTimeout(() => {
                const aiMove = this.engine.computeBestAIMove();
                if (!aiMove) {
                    this.aiThinking = false;
                    return;
                }

                this.sound.playEntangle();
                const result = this.engine.playMove(aiMove.sq1, aiMove.sq2);
                this.aiThinking = false;

                const moveId = this.engine.moveNum - 1;
                this.addLogEntry(`AI Move O${moveId}: Entangled Squares #${aiMove.sq1 + 1} and #${aiMove.sq2 + 1}`);

                if (result.cycle) {
                    this.sound.playCycleAlert();
                    this.renderAll();
                    this.showCollapseModal(result.pendingCycle);
                } else {
                    this.renderAll();
                }
            }, 550);
        }
    }

    showCollapseModal(pendingCycle) {
        const modal = document.getElementById('collapse-modal');
        if (!modal) return;

        const chooserBadge = document.getElementById('collapse-chooser');
        const cyclePathSpan = document.getElementById('collapse-cycle-path');
        const opt1Details = document.getElementById('collapse-opt1-details');
        const opt2Details = document.getElementById('collapse-opt2-details');
        const opt1Btn = document.getElementById('collapse-btn-1');
        const opt2Btn = document.getElementById('collapse-btn-2');

        const chooser = pendingCycle.chooser;

        if (chooserBadge) {
            chooserBadge.textContent = `Player ${chooser}`;
            chooserBadge.className = `chooser-badge player-${chooser.toLowerCase()}`;
        }

        if (cyclePathSpan) {
            const pathStr = pendingCycle.cycleVertices.map(v => `#${v + 1}`).join(' ↔ ');
            cyclePathSpan.textContent = `Loop: ${pathStr}`;
        }

        const formatDetails = (details) => {
            return details.map(d => `
                <div class="collapse-item">
                    <span class="collapse-mark mark-${d.player.toLowerCase()}">${d.player}<sub>${d.moveId}</sub></span>
                    <span class="collapse-arrow">→</span>
                    <span class="collapse-dest">Square #${d.square + 1}</span>
                </div>
            `).join('');
        };

        if (opt1Details) opt1Details.innerHTML = formatDetails(pendingCycle.option1.details);
        if (opt2Details) opt2Details.innerHTML = formatDetails(pendingCycle.option2.details);

        // Bind buttons
        if (opt1Btn) {
            opt1Btn.onclick = () => this.handleCollapseChoice(1);
        }
        if (opt2Btn) {
            opt2Btn.onclick = () => this.handleCollapseChoice(2);
        }

        modal.classList.add('visible');

        // If in vs AI mode and AI is the chooser:
        if (this.vsAI && chooser === 'O') {
            if (opt1Btn) opt1Btn.disabled = true;
            if (opt2Btn) opt2Btn.disabled = true;
            this.setStatusMessage(`Quantum AI is selecting optimal collapse resolution...`, 'thinking');

            setTimeout(() => {
                const bestChoice = this.engine.computeBestCollapseChoice();
                if (bestChoice === 1 && opt1Btn) opt1Btn.classList.add('ai-highlight');
                if (bestChoice === 2 && opt2Btn) opt2Btn.classList.add('ai-highlight');

                setTimeout(() => {
                    if (opt1Btn) {
                        opt1Btn.disabled = false;
                        opt1Btn.classList.remove('ai-highlight');
                    }
                    if (opt2Btn) {
                        opt2Btn.disabled = false;
                        opt2Btn.classList.remove('ai-highlight');
                    }
                    this.handleCollapseChoice(bestChoice);
                }, 400);
            }, 650);
        } else {
            if (opt1Btn) opt1Btn.disabled = false;
            if (opt2Btn) opt2Btn.disabled = false;
            this.setStatusMessage(`Player ${chooser}: Choose how to collapse the cyclic entanglement!`, 'active');
        }
    }

    hideCollapseModal() {
        const modal = document.getElementById('collapse-modal');
        if (modal) modal.classList.remove('visible');
    }

    handleCollapseChoice(optionIndex) {
        this.hideCollapseModal();
        this.sound.playCollapse();

        const result = this.engine.resolveCollapse(optionIndex);
        if (!result.success) return;

        this.addLogEntry(`Cycle resolved (Option ${optionIndex}). Squares collapsed into classical reality.`);
        this.renderAll();

        if (result.winStatus.isGameOver) {
            this.handleGameOver(result.winStatus);
        } else {
            this.checkAndExecuteAITurn();
        }
    }

    handleGameOver(result) {
        this.sound.playWin();
        this.scores.totalGames++;

        if (result.winner === 'X') {
            this.scores.X += result.scores ? result.scores.X : 1;
            if (result.scores && result.scores.O) this.scores.O += result.scores.O;
            this.setStatusMessage(`🎉 Game Over: Player X WINS! ${result.reason}`, 'win-x');
        } else if (result.winner === 'O') {
            this.scores.O += result.scores ? result.scores.O : 1;
            if (result.scores && result.scores.X) this.scores.X += result.scores.X;
            this.setStatusMessage(`🎉 Game Over: Player O WINS! ${result.reason}`, 'win-o');
        } else {
            this.scores.draws++;
            this.setStatusMessage(`Game Over: Draw! ${result.reason}`, 'draw');
        }

        this.updateScoreboard();
        this.renderBoard();
        this.addLogEntry(`Match finished. Result: ${result.winner} (${result.reason})`);
    }

    renderAll() {
        this.renderBoard();
        this.renderTurnStatus();
        this.graphViz.render(this.engine, this.engine.pendingCycle);
        this.updateScoreboard();
    }

    renderBoard() {
        const boardEl = document.getElementById('quantum-board');
        if (!boardEl) return;

        const cells = boardEl.querySelectorAll('.board-tile');
        cells.forEach((cell, idx) => {
            const classical = this.engine.classical[idx];
            const spookyMarks = this.engine.getSpookyMarksForSquare(idx);
            const isSelected = this.firstSelectedSquare === idx;

            // Reset classes
            cell.className = 'board-tile';
            cell.innerHTML = '';

            // Square number indicator in top-left
            const sqNum = document.createElement('span');
            sqNum.className = 'tile-number';
            sqNum.textContent = `${idx + 1}`;
            cell.appendChild(sqNum);

            if (isSelected) {
                cell.classList.add('selected');
            }

            if (classical) {
                // Square has collapsed into classical reality!
                cell.classList.add('collapsed');
                cell.classList.add(classical.player === 'X' ? 'collapsed-x' : 'collapsed-o');

                const markEl = document.createElement('div');
                markEl.className = 'classical-symbol';
                markEl.innerHTML = `
                    <span class="symbol-char">${classical.player}</span>
                    <span class="symbol-sub">${classical.moveId}</span>
                `;
                cell.appendChild(markEl);

                // Highlight winning lines
                if (this.engine.gameResult && this.engine.gameResult.winningLines) {
                    for (const line of this.engine.gameResult.winningLines) {
                        if (line.includes(idx)) {
                            cell.classList.add('winning-cell');
                        }
                    }
                }
            } else {
                // Superposition state: render spooky marks container
                const spookyContainer = document.createElement('div');
                spookyContainer.className = 'spooky-container';

                spookyMarks.forEach(sm => {
                    const chip = document.createElement('span');
                    chip.className = `spooky-chip chip-${sm.player.toLowerCase()}`;
                    chip.innerHTML = `${sm.player}<sub>${sm.id}</sub>`;
                    spookyContainer.appendChild(chip);
                });

                cell.appendChild(spookyContainer);
            }
        });
    }

    renderTurnStatus() {
        if (this.engine.isGameOver) return;

        const turn = this.engine.currentTurn;
        const moveNum = this.engine.moveNum;
        const banner = document.getElementById('turn-banner');

        if (banner) {
            banner.className = `turn-banner turn-${turn.toLowerCase()}`;
            const isHumanTurn = !this.vsAI || turn === 'X';

            if (this.firstSelectedSquare !== null) {
                banner.innerHTML = `
                    <div class="turn-indicator-badge">
                        <span class="turn-player">Player ${turn}</span>
                        <span class="turn-move">Move ${turn}<sub>${moveNum}</sub></span>
                    </div>
                    <div class="turn-prompt">Square #${this.firstSelectedSquare + 1} chosen. <strong>Tap 2nd square</strong> to entangle!</div>
                `;
            } else if (!isHumanTurn) {
                banner.innerHTML = `
                    <div class="turn-indicator-badge">
                        <span class="turn-player">Quantum AI</span>
                        <span class="turn-move">Move O<sub>${moveNum}</sub></span>
                    </div>
                    <div class="turn-prompt">Calculating quantum superposition...</div>
                `;
            } else {
                banner.innerHTML = `
                    <div class="turn-indicator-badge">
                        <span class="turn-player">Player ${turn}</span>
                        <span class="turn-move">Move ${turn}<sub>${moveNum}</sub></span>
                    </div>
                    <div class="turn-prompt">Tap <strong>Square 1 of 2</strong> to place spooky mark.</div>
                `;
            }
        }
    }

    setStatusMessage(msg, type = 'normal') {
        const msgEl = document.getElementById('status-message');
        if (msgEl) {
            msgEl.textContent = msg;
            msgEl.className = `status-message status-${type}`;
        }
    }

    flashStatus(msg, type = 'warning') {
        this.setStatusMessage(msg, type);
        setTimeout(() => {
            this.renderTurnStatus();
        }, 1800);
    }

    updateScoreboard() {
        const scoreX = document.getElementById('score-x');
        const scoreO = document.getElementById('score-o');
        const scoreDraws = document.getElementById('score-draws');

        if (scoreX) scoreX.textContent = Number.isInteger(this.scores.X) ? this.scores.X : this.scores.X.toFixed(1);
        if (scoreO) scoreO.textContent = Number.isInteger(this.scores.O) ? this.scores.O : this.scores.O.toFixed(1);
        if (scoreDraws) scoreDraws.textContent = this.scores.draws;
    }

    addLogEntry(text) {
        const logContainer = document.getElementById('move-log');
        if (!logContainer) return;

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-text">${text}</span>`;
        logContainer.prepend(entry);
    }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new QuantumGameApp();
});
