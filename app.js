/**
 * Quantum Tic-Tac-Toe — Main Application Controller
 * Allan Goff's Authentic Quantum Mechanics Engine
 * Modern Esports & Tabletop Gaming UI Edition
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
        this.playTone(540, 0.08, 'sine', 0.12);
    }

    playEntangle() {
        if (!this.enabled) return;
        this.playTone(480, 0.1, 'sine', 0.14);
        setTimeout(() => this.playTone(720, 0.18, 'sine', 0.14), 70);
    }

    playCycleAlert() {
        if (!this.enabled) return;
        this.playTone(320, 0.15, 'triangle', 0.22);
        setTimeout(() => this.playTone(480, 0.2, 'triangle', 0.25), 110);
        setTimeout(() => this.playTone(640, 0.35, 'sine', 0.28), 220);
    }

    playCollapse() {
        if (!this.enabled) return;
        this.playTone(200, 0.25, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(350, 0.3, 'sine', 0.22), 90);
        setTimeout(() => this.playTone(580, 0.45, 'sine', 0.28), 200);
    }

    playWin() {
        if (!this.enabled) return;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.3, 'sine', 0.22), i * 100);
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
        this.firstSelectedSquare = null;

        // Cumulative Scores
        this.scores = {
            X: 0,
            O: 0,
            draws: 0,
            totalMatches: 0
        };

        this.initDOM();
        this.renderAll();

        // Check if user is first-time visitor
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
        // Mode toggle
        const mode2P = document.getElementById('mode-2p');
        const modeAI = document.getElementById('mode-ai');
        const playerOName = document.getElementById('player-o-name');

        if (mode2P && modeAI) {
            mode2P.addEventListener('click', () => {
                if (this.vsAI) {
                    this.vsAI = false;
                    mode2P.classList.add('active');
                    modeAI.classList.remove('active');
                    if (playerOName) playerOName.textContent = 'Player O';
                    this.resetGame();
                }
            });
            modeAI.addEventListener('click', () => {
                if (!this.vsAI) {
                    this.vsAI = true;
                    modeAI.classList.add('active');
                    mode2P.classList.remove('active');
                    if (playerOName) playerOName.textContent = 'Quantum AI';
                    this.resetGame();
                }
            });
        }

        // Sound button
        const soundBtn = document.getElementById('sound-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.sound.enabled = !this.sound.enabled;
                const label = soundBtn.querySelector('.btn-label');
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

        // Rematch button in victory modal
        const rematchBtn = document.getElementById('rematch-btn');
        if (rematchBtn) {
            rematchBtn.addEventListener('click', () => {
                this.hideVictoryModal();
                this.resetGame();
            });
        }

        // Help Modal
        const helpBtn = document.getElementById('help-btn');
        const modal = document.getElementById('help-modal');
        const closeModal = document.getElementById('close-modal');
        if (helpBtn && modal) {
            helpBtn.addEventListener('click', () => modal.classList.add('visible'));
        }
        if (closeModal && modal) {
            closeModal.addEventListener('click', () => modal.classList.remove('visible'));
        }

        // Mobile Segmented Tabs
        const tabBtns = document.querySelectorAll('.mobile-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tabTarget = btn.getAttribute('data-tab');
                this.switchMobileTab(tabTarget);
            });
        });

        // Initialize 3x3 Board Grid
        const boardEl = document.getElementById('quantum-board');
        if (boardEl) {
            boardEl.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div');
                cell.className = 'quantum-tile';
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
        this.hideVictoryModal();
        this.renderAll();
        this.addLogEntry('Match initialized. Player X opens with Move X₁.');
    }

    handleSquareClick(sqIndex) {
        if (this.engine.isGameOver || this.aiThinking || this.engine.pendingCycle) return;

        // Ignore clicks if AI turn
        if (this.vsAI && this.engine.currentTurn === 'O') return;

        // Reject if square is already classical
        if (this.engine.classical[sqIndex] !== null) {
            this.sound.playSelect();
            this.flashStatus(`Square #${sqIndex + 1} is already collapsed into classical reality!`, 'warning');
            return;
        }

        // First square selection
        if (this.firstSelectedSquare === null) {
            this.firstSelectedSquare = sqIndex;
            this.sound.playSelect();
            this.renderBoard();
            this.updateBattleHUD();
            return;
        }

        // Same square deselects
        if (this.firstSelectedSquare === sqIndex) {
            this.firstSelectedSquare = null;
            this.sound.playSelect();
            this.renderBoard();
            this.updateBattleHUD();
            return;
        }

        // Second square selected: commit quantum move!
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
            this.updateBattleHUD();
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
            }, 600);
        }
    }

    showCollapseModal(pendingCycle) {
        const modal = document.getElementById('collapse-modal');
        if (!modal) return;

        const chooserBadge = document.getElementById('collapse-chooser');
        const narrativeText = document.getElementById('collapse-narrative-text');
        const cyclePathSpan = document.getElementById('collapse-cycle-path');
        const opt1Details = document.getElementById('collapse-opt1-details');
        const opt2Details = document.getElementById('collapse-opt2-details');
        const opt1Btn = document.getElementById('collapse-btn-1');
        const opt2Btn = document.getElementById('collapse-btn-2');

        const chooser = pendingCycle.chooser;
        const isAIChooser = chooser === 'O' && this.vsAI;

        if (chooserBadge) {
            chooserBadge.textContent = isAIChooser ? 'QUANTUM AI (OBSERVER)' : `PLAYER ${chooser} (DEFENDER)`;
            chooserBadge.className = `chooser-badge player-${chooser.toLowerCase()}`;
        }

        if (narrativeText) {
            if (isAIChooser) {
                narrativeText.textContent = 'Opponent closed an entanglement loop! Quantum AI holds observer privilege and is selecting the measurement basis...';
            } else {
                narrativeText.textContent = 'Opponent closed an entanglement loop! You command the observer basis. Tap a tactical state below to collapse reality:';
            }
        }

        if (cyclePathSpan) {
            const pathStr = pendingCycle.cycleVertices.map(v => `#${v + 1}`).join(' ⟷ ');
            cyclePathSpan.textContent = pathStr;
        }

        // Mini 3x3 Arena Board Preview Generator
        const renderMiniBoardPreview = (option) => {
            const assignment = option.assignment; // { [moveId]: sq }
            const details = option.details; // [ { moveId, player, square } ]

            const newAtSq = {};
            for (const d of details) {
                newAtSq[d.square] = d;
            }

            let cellsHtml = '';
            for (let sq = 0; sq < 9; sq++) {
                const existing = this.engine.classical[sq];
                if (existing) {
                    cellsHtml += `
                        <div class="mini-cell mini-solid mini-${existing.player.toLowerCase()}">
                            <span class="mini-coord">${sq + 1}</span>
                            <span class="mini-token">${existing.player}<sub>${existing.moveId}</sub></span>
                        </div>`;
                } else if (newAtSq[sq]) {
                    const d = newAtSq[sq];
                    cellsHtml += `
                        <div class="mini-cell mini-collapsing mini-${d.player.toLowerCase()}">
                            <span class="mini-coord">${sq + 1}</span>
                            <span class="mini-token">${d.player}<sub>${d.moveId}</sub></span>
                        </div>`;
                } else {
                    cellsHtml += `
                        <div class="mini-cell mini-empty">
                            <span class="mini-coord">${sq + 1}</span>
                        </div>`;
                }
            }

            const chipsHtml = details.map(d => `
                <div class="tactical-item-chip chip-${d.player.toLowerCase()}">
                    <span class="chip-token">${d.player}<sub>${d.moveId}</sub></span>
                    <span class="chip-arrow">➔</span>
                    <span class="chip-target">Square #${d.square + 1}</span>
                </div>
            `).join('');

            return `
                <div class="mini-tactical-board-wrap">
                    <div class="mini-tactical-board">
                        ${cellsHtml}
                    </div>
                </div>
                <div class="mini-tactical-chips">
                    ${chipsHtml}
                </div>
            `;
        };

        if (opt1Details) opt1Details.innerHTML = renderMiniBoardPreview(pendingCycle.option1);
        if (opt2Details) opt2Details.innerHTML = renderMiniBoardPreview(pendingCycle.option2);

        // Bind button actions
        if (opt1Btn) opt1Btn.onclick = () => this.handleCollapseChoice(1);
        if (opt2Btn) opt2Btn.onclick = () => this.handleCollapseChoice(2);

        // Interactive hover previews on main board
        const cardA = modal.querySelector('.option-card-a');
        const cardB = modal.querySelector('.option-card-b');

        if (cardA) {
            cardA.onmouseenter = () => this.previewCollapseAssignment(pendingCycle.option1.assignment);
            cardA.onmouseleave = () => this.clearPreviewCollapse();
        }
        if (cardB) {
            cardB.onmouseenter = () => this.previewCollapseAssignment(pendingCycle.option2.assignment);
            cardB.onmouseleave = () => this.clearPreviewCollapse();
        }

        modal.classList.add('visible');

        // AI decision logic
        if (isAIChooser) {
            if (opt1Btn) opt1Btn.disabled = true;
            if (opt2Btn) opt2Btn.disabled = true;
            this.setStatusMessage('Quantum AI is evaluating optimal wavefunction collapse...', 'thinking');

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
                    this.clearPreviewCollapse();
                    this.handleCollapseChoice(bestChoice);
                }, 450);
            }, 750);
        } else {
            if (opt1Btn) opt1Btn.disabled = false;
            if (opt2Btn) opt2Btn.disabled = false;
            this.setStatusMessage(`Defender Player ${chooser}: Choose how to collapse the cyclic entanglement!`, 'active');
        }
    }

    previewCollapseAssignment(assignment) {
        const boardEl = document.getElementById('quantum-board');
        if (!boardEl) return;
        const tiles = boardEl.querySelectorAll('.quantum-tile');
        for (const [mIdStr, sq] of Object.entries(assignment)) {
            const tile = tiles[sq];
            if (tile && !tile.classList.contains('collapsed')) {
                tile.classList.add('preview-highlight');
            }
        }
    }

    clearPreviewCollapse() {
        const boardEl = document.getElementById('quantum-board');
        if (!boardEl) return;
        const tiles = boardEl.querySelectorAll('.quantum-tile');
        tiles.forEach(t => t.classList.remove('preview-highlight'));
    }

    hideCollapseModal() {
        const modal = document.getElementById('collapse-modal');
        if (modal) modal.classList.remove('visible');
        this.clearPreviewCollapse();
    }

    handleCollapseChoice(optionIndex) {
        this.hideCollapseModal();
        this.sound.playCollapse();

        const result = this.engine.resolveCollapse(optionIndex);
        if (!result.success) return;

        this.addLogEntry(`Wavefunction collapsed (State ${optionIndex === 1 ? 'A' : 'B'}). Squares solidified.`);
        this.renderAll();

        if (result.winStatus.isGameOver) {
            this.handleGameOver(result.winStatus);
        } else {
            this.checkAndExecuteAITurn();
        }
    }

    handleGameOver(result) {
        this.sound.playWin();
        this.scores.totalMatches++;

        if (result.winner === 'X') {
            this.scores.X += result.scores ? result.scores.X : 1;
            if (result.scores && result.scores.O) this.scores.O += result.scores.O;
        } else if (result.winner === 'O') {
            this.scores.O += result.scores ? result.scores.O : 1;
            if (result.scores && result.scores.X) this.scores.X += result.scores.X;
        } else {
            this.scores.draws++;
        }

        this.updateScoreboard();
        this.renderBoard();
        this.showVictoryModal(result);
        this.addLogEntry(`Match finished: ${result.winner} (${result.reason})`);
    }

    showVictoryModal(result) {
        const modal = document.getElementById('victory-modal');
        if (!modal) return;

        const title = document.getElementById('victory-title');
        const reason = document.getElementById('victory-reason');
        const matrix = document.getElementById('victory-scores-matrix');

        if (title) {
            if (result.winner === 'X') {
                title.textContent = 'PLAYER X WINS!';
                title.className = 'victory-headline win-x-text';
            } else if (result.winner === 'O') {
                title.textContent = this.vsAI ? 'QUANTUM AI WINS!' : 'PLAYER O WINS!';
                title.className = 'victory-headline win-o-text';
            } else {
                title.textContent = "MATCH DRAW (CAT'S GAME)!";
                title.className = 'victory-headline win-draw-text';
            }
        }

        if (reason) reason.textContent = result.reason;

        if (matrix) {
            matrix.innerHTML = `
                <div class="score-summary-card x-summary">
                    <span class="summary-label">Player X</span>
                    <span class="summary-score">${Number.isInteger(this.scores.X) ? this.scores.X : this.scores.X.toFixed(1)}</span>
                </div>
                <div class="score-summary-card draws-summary">
                    <span class="summary-label">Draws</span>
                    <span class="summary-score">${this.scores.draws}</span>
                </div>
                <div class="score-summary-card o-summary">
                    <span class="summary-label">${this.vsAI ? 'Quantum AI' : 'Player O'}</span>
                    <span class="summary-score">${Number.isInteger(this.scores.O) ? this.scores.O : this.scores.O.toFixed(1)}</span>
                </div>
            `;
        }

        modal.classList.add('visible');
    }

    hideVictoryModal() {
        const modal = document.getElementById('victory-modal');
        if (modal) modal.classList.remove('visible');
    }

    renderAll() {
        this.renderBoard();
        this.updateBattleHUD();
        this.graphViz.render(this.engine, this.engine.pendingCycle);
        this.updateScoreboard();
    }

    renderBoard() {
        const boardEl = document.getElementById('quantum-board');
        if (!boardEl) return;

        const tiles = boardEl.querySelectorAll('.quantum-tile');
        tiles.forEach((tile, idx) => {
            const classical = this.engine.classical[idx];
            const spookyMarks = this.engine.getSpookyMarksForSquare(idx);
            const isSelected = this.firstSelectedSquare === idx;

            tile.className = 'quantum-tile';
            tile.innerHTML = '';

            // Square number indicator in corner
            const sqNum = document.createElement('span');
            sqNum.className = 'tile-corner-num';
            sqNum.textContent = `${idx + 1}`;
            tile.appendChild(sqNum);

            if (isSelected) {
                tile.classList.add('tile-selected');
            }

            if (classical) {
                tile.classList.add('tile-collapsed');
                tile.classList.add(classical.player === 'X' ? 'collapsed-x' : 'collapsed-o');

                const markEl = document.createElement('div');
                markEl.className = 'classical-token';
                markEl.innerHTML = `
                    <span class="token-char">${classical.player}</span>
                    <span class="token-sub">${classical.moveId}</span>
                `;
                tile.appendChild(markEl);

                // Highlight winning cell
                if (this.engine.gameResult && this.engine.gameResult.winningLines) {
                    for (const line of this.engine.gameResult.winningLines) {
                        if (line.includes(idx)) {
                            tile.classList.add('winning-cell-aura');
                        }
                    }
                }
            } else {
                const spookyBox = document.createElement('div');
                spookyBox.className = 'tile-spooky-box';

                spookyMarks.forEach(sm => {
                    const chip = document.createElement('span');
                    chip.className = `spooky-chip chip-${sm.player.toLowerCase()}`;
                    chip.innerHTML = `${sm.player}<sub>${sm.id}</sub>`;
                    spookyBox.appendChild(chip);
                });

                tile.appendChild(spookyBox);
            }
        });
    }

    updateBattleHUD() {
        const turn = this.engine.currentTurn;
        const moveNum = this.engine.moveNum;
        const hudX = document.getElementById('hud-player-x');
        const hudO = document.getElementById('hud-player-o');
        const turnPill = document.getElementById('hud-turn-pill');
        const bannerText = document.getElementById('turn-banner-text');
        const actionPrompt = document.getElementById('hud-action-prompt');

        if (hudX && hudO) {
            hudX.classList.toggle('active-turn', turn === 'X' && !this.engine.isGameOver);
            hudO.classList.toggle('active-turn', turn === 'O' && !this.engine.isGameOver);
        }

        if (turnPill && bannerText && actionPrompt) {
            if (this.engine.isGameOver) {
                turnPill.className = 'hud-turn-pill turn-pill-gameover';
                bannerText.textContent = 'MATCH COMPLETED';
                actionPrompt.textContent = this.engine.gameResult ? this.engine.gameResult.reason : 'Game concluded.';
                return;
            }

            const isAITurn = this.vsAI && turn === 'O';
            turnPill.className = `hud-turn-pill turn-pill-${turn.toLowerCase()}`;

            if (this.firstSelectedSquare !== null) {
                bannerText.textContent = `PLAYER ${turn}'S TURN (MOVE ${turn}${moveNum})`;
                actionPrompt.innerHTML = `Square <strong>#${this.firstSelectedSquare + 1}</strong> chosen. <strong>Tap 2nd square</strong> to entangle!`;
            } else if (isAITurn) {
                bannerText.textContent = `QUANTUM AI'S TURN (MOVE O${moveNum})`;
                actionPrompt.textContent = `Calculating optimal superposition states...`;
            } else {
                bannerText.textContent = `PLAYER ${turn}'S TURN (MOVE ${turn}${moveNum})`;
                actionPrompt.innerHTML = `Tap <strong>Square 1 of 2</strong> to place quantum marks.`;
            }
        }
    }

    setStatusMessage(msg, type = 'normal') {
        const msgEl = document.getElementById('status-message');
        if (msgEl) {
            msgEl.textContent = msg;
            msgEl.className = `arena-status-banner status-${type}`;
        }
    }

    flashStatus(msg, type = 'warning') {
        this.setStatusMessage(msg, type);
        setTimeout(() => {
            this.updateBattleHUD();
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
        entry.className = 'telemetry-entry';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        entry.innerHTML = `<span class="entry-time">[${time}]</span> <span class="entry-text">${text}</span>`;
        logContainer.prepend(entry);
    }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new QuantumGameApp();
});
