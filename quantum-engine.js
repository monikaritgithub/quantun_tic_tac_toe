/**
 * Allan Goff's Quantum Tic-Tac-Toe Engine
 * Pure mathematical implementation of superposition, cyclic entanglement,
 * measurement collapse cascade, and subscript tiebreaker rules.
 * Reference: Allan Goff, American Journal of Physics 74, 962 (2006).
 */

class QuantumTicTacToeEngine {
    static WINNING_LINES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    constructor() {
        this.reset();
    }

    reset() {
        // 9 squares: index 0 to 8 (display 1 to 9)
        // classical[i] = null | { player: 'X'|'O', moveId: number }
        this.classical = new Array(9).fill(null);

        // List of all moves played
        // Each move: { id: number, player: 'X'|'O', sq1: number, sq2: number, collapsedTo: number|null }
        this.moves = [];

        this.moveNum = 1; // 1-indexed: 1, 3, 5... = X; 2, 4, 6... = O
        this.currentTurn = 'X';
        this.isGameOver = false;
        this.gameResult = null;
        this.pendingCycle = null; // Stored when collapse must be chosen
    }

    /**
     * Get list of square indices that have not collapsed classically.
     */
    getOpenSquares() {
        const open = [];
        for (let i = 0; i < 9; i++) {
            if (this.classical[i] === null) open.push(i);
        }
        return open;
    }

    /**
     * Get all active (uncollapsed) moves.
     */
    getActiveMoves() {
        return this.moves.filter(m => m.collapsedTo === null);
    }

    /**
     * Get list of spooky move IDs occupying a given square.
     */
    getSpookyMarksForSquare(sq) {
        if (this.classical[sq] !== null) return [];
        return this.getActiveMoves()
            .filter(m => m.sq1 === sq || m.sq2 === sq)
            .map(m => ({ id: m.id, player: m.player }));
    }

    /**
     * Find path in the active graph between start and target using DFS.
     * Returns array of [squareIndex, edgeThatLedHere] or null.
     */
    findPath(start, target, visited, activeEdges) {
        if (start === target) {
            return [{ sq: start, edge: null }];
        }
        visited.add(start);

        for (const e of activeEdges) {
            let nxt = null;
            if (e.sq1 === start && !visited.has(e.sq2)) {
                nxt = e.sq2;
            } else if (e.sq2 === start && !visited.has(e.sq1)) {
                nxt = e.sq1;
            }

            if (nxt !== null) {
                const subPath = this.findPath(nxt, target, visited, activeEdges);
                if (subPath !== null) {
                    return [{ sq: start, edge: e }, ...subPath];
                }
            }
        }
        return null;
    }

    /**
     * Play a quantum move: places spooky mark on sq1 and sq2.
     * Returns: { success: boolean, cycle: boolean, pendingCycle: object|null, error?: string }
     */
    playMove(sq1, sq2) {
        if (this.isGameOver) return { success: false, error: 'Game is already over' };
        if (this.pendingCycle) return { success: false, error: 'Must resolve pending collapse first' };
        if (sq1 === sq2) return { success: false, error: 'Spooky marks must be placed in two different squares' };
        if (this.classical[sq1] !== null || this.classical[sq2] !== null) {
            return { success: false, error: 'Cannot place marks in an already collapsed square' };
        }

        const player = this.currentTurn;
        const move = {
            id: this.moveNum,
            player: player,
            sq1: sq1,
            sq2: sq2,
            collapsedTo: null
        };

        const activeEdges = this.getActiveMoves();
        const path = this.findPath(sq1, sq2, new Set(), activeEdges);

        this.moves.push(move);
        this.moveNum++;

        if (path !== null) {
            // Cyclic entanglement created!
            // path is [{sq: v0, edge: e0}, {sq: v1, edge: e1}, ..., {sq: target, edge: null}]
            // move connects target back to v0
            const cycleVertices = path.map(p => p.sq);
            const cycleEdges = path.slice(0, -1).map(p => p.edge).concat([move]);

            // Opponent of player who created the cycle chooses collapse
            const chooser = player === 'X' ? 'O' : 'X';

            const option1 = this.buildCollapseOption(cycleVertices, cycleEdges, 0);
            const option2 = this.buildCollapseOption(cycleVertices, cycleEdges, 1);

            this.pendingCycle = {
                triggerMove: move,
                cycleVertices,
                cycleEdges,
                chooser,
                option1,
                option2
            };

            return {
                success: true,
                cycle: true,
                pendingCycle: this.pendingCycle
            };
        } else {
            // No cycle: turn switches directly
            this.currentTurn = this.currentTurn === 'X' ? 'O' : 'X';
            return {
                success: true,
                cycle: false,
                pendingCycle: null
            };
        }
    }

    /**
     * Build one of the two binary collapse assignments for the cycle and its connected trees.
     * direction 0: edge[i] -> cycleVertices[i]
     * direction 1: edge[i] -> cycleVertices[(i + 1) % n]
     */
    buildCollapseOption(cycleVertices, cycleEdges, direction) {
        const n = cycleVertices.length;
        const assignment = {}; // moveId -> squareIndex
        const sqOccupied = {}; // squareIndex -> moveId

        for (let i = 0; i < n; i++) {
            const edge = cycleEdges[i];
            const sq = direction === 0 ? cycleVertices[i] : cycleVertices[(i + 1) % n];
            assignment[edge.id] = sq;
            sqOccupied[sq] = edge.id;
        }

        // Cascade down any hanging branches (trees) attached to the cycle
        const queue = Object.keys(sqOccupied).map(s => parseInt(s, 10));
        const activeMoves = this.getActiveMoves();

        while (queue.length > 0) {
            const currSq = queue.shift();
            for (const e of activeMoves) {
                if (assignment[e.id] !== undefined) continue;

                // If e touches currSq, it cannot occupy currSq because currSq is already occupied!
                if (e.sq1 === currSq || e.sq2 === currSq) {
                    const otherSq = e.sq1 === currSq ? e.sq2 : e.sq1;
                    assignment[e.id] = otherSq;
                    sqOccupied[otherSq] = e.id;
                    queue.push(otherSq);
                }
            }
        }

        // Build preview summary: list of { moveId, player, square }
        const details = [];
        for (const [mIdStr, sq] of Object.entries(assignment)) {
            const mId = parseInt(mIdStr, 10);
            const mv = this.moves.find(m => m.id === mId);
            if (mv) {
                details.push({
                    moveId: mId,
                    player: mv.player,
                    square: sq
                });
            }
        }
        details.sort((a, b) => a.moveId - b.moveId);

        return {
            assignment,
            details
        };
    }

    /**
     * Resolve the pending cycle with the chosen option (1 or 2).
     */
    resolveCollapse(optionIndex) {
        if (!this.pendingCycle) {
            return { success: false, error: 'No pending cycle to resolve' };
        }

        const chosen = optionIndex === 1 ? this.pendingCycle.option1 : this.pendingCycle.option2;
        const assignment = chosen.assignment;

        // Apply collapse to moves and classical board
        for (const [mIdStr, sq] of Object.entries(assignment)) {
            const mId = parseInt(mIdStr, 10);
            const mv = this.moves.find(m => m.id === mId);
            if (mv) {
                mv.collapsedTo = sq;
                this.classical[sq] = {
                    player: mv.player,
                    moveId: mv.id
                };
            }
        }

        // Clear pending cycle
        const resolvedTrigger = this.pendingCycle.triggerMove;
        this.pendingCycle = null;

        // Check for game over (3-in-a-row or full board)
        const winStatus = this.checkWinCondition();
        if (winStatus.isGameOver) {
            this.isGameOver = true;
            this.gameResult = winStatus;
        } else {
            // Turn switches to opponent of the player who made the trigger move
            this.currentTurn = resolvedTrigger.player === 'X' ? 'O' : 'X';
        }

        return {
            success: true,
            assignment,
            winStatus
        };
    }

    /**
     * Check 3-in-a-row classical marks and apply Allan Goff's subscript tiebreaker rule.
     */
    checkWinCondition() {
        const winsX = [];
        const winsO = [];

        for (const line of QuantumTicTacToeEngine.WINNING_LINES) {
            const [a, b, c] = line;
            const ca = this.classical[a];
            const cb = this.classical[b];
            const cc = this.classical[c];

            if (ca && cb && cc) {
                if (ca.player === 'X' && cb.player === 'X' && cc.player === 'X') {
                    const maxSub = Math.max(ca.moveId, cb.moveId, cc.moveId);
                    winsX.push({ line, maxSub, marks: [ca, cb, cc] });
                } else if (ca.player === 'O' && cb.player === 'O' && cc.player === 'O') {
                    const maxSub = Math.max(ca.moveId, cb.moveId, cc.moveId);
                    winsO.push({ line, maxSub, marks: [ca, cb, cc] });
                }
            }
        }

        if (winsX.length > 0 && winsO.length === 0) {
            return {
                isGameOver: true,
                winner: 'X',
                winningLines: winsX.map(w => w.line),
                reason: 'Player X completed 3-in-a-row!'
            };
        } else if (winsO.length > 0 && winsX.length === 0) {
            return {
                isGameOver: true,
                winner: 'O',
                winningLines: winsO.map(w => w.line),
                reason: 'Player O completed 3-in-a-row!'
            };
        } else if (winsX.length > 0 && winsO.length > 0) {
            // Simultaneous win! Apply Goff's subscript tiebreaker:
            // Whichever player achieved their line earlier in time (lower maximum subscript) wins!
            const bestX = Math.min(...winsX.map(w => w.maxSub));
            const bestO = Math.min(...winsO.map(w => w.maxSub));

            if (bestX < bestO) {
                return {
                    isGameOver: true,
                    winner: 'X',
                    scores: { X: 1.0, O: 0.5 },
                    winningLines: winsX.map(w => w.line),
                    reason: `Simultaneous win! Player X completed line earlier (subscript ${bestX} vs ${bestO}).`
                };
            } else if (bestO < bestX) {
                return {
                    isGameOver: true,
                    winner: 'O',
                    scores: { O: 1.0, X: 0.5 },
                    winningLines: winsO.map(w => w.line),
                    reason: `Simultaneous win! Player O completed line earlier (subscript ${bestO} vs ${bestX}).`
                };
            } else {
                return {
                    isGameOver: true,
                    winner: 'Draw',
                    winningLines: [...winsX.map(w => w.line), ...winsO.map(w => w.line)],
                    reason: 'True simultaneous draw!'
                };
            }
        }

        // Check if all 9 squares have collapsed
        const open = this.getOpenSquares();
        if (open.length === 0) {
            return {
                isGameOver: true,
                winner: 'Draw',
                winningLines: [],
                reason: 'All squares collapsed without a 3-in-a-row.'
            };
        }

        return {
            isGameOver: false,
            winner: null
        };
    }

    /**
     * Strategic AI Engine for Player O (or X)
     */
    computeBestAIMove() {
        const open = this.getOpenSquares();
        if (open.length < 2) return null;

        const player = this.currentTurn;
        const opponent = player === 'X' ? 'O' : 'X';

        // 1. Check if completing any cycle allows AI to win immediately
        for (let i = 0; i < open.length; i++) {
            for (let j = i + 1; j < open.length; j++) {
                const sq1 = open[i];
                const sq2 = open[j];
                const active = this.getActiveMoves();
                const path = this.findPath(sq1, sq2, new Set(), active);
                if (path !== null) {
                    // This creates a cycle. Note: Opponent will choose collapse!
                    // So we must check if BOTH collapse options are favorable or at least one is safe.
                    const cycleVertices = path.map(p => p.sq);
                    const dummyMove = { id: this.moveNum, player, sq1, sq2, collapsedTo: null };
                    const cycleEdges = path.slice(0, -1).map(p => p.edge).concat([dummyMove]);

                    const opt1 = this.buildCollapseOption(cycleVertices, cycleEdges, 0);
                    const opt2 = this.buildCollapseOption(cycleVertices, cycleEdges, 1);

                    const sim1 = this.simulateCollapse(opt1.assignment);
                    const sim2 = this.simulateCollapse(opt2.assignment);

                    // If both options give AI a win, this is an unstoppable win!
                    if (sim1.winner === player && sim2.winner === player) {
                        return { sq1, sq2, reason: 'Forced collapse winning fork' };
                    }
                }
            }
        }

        // 2. Score candidate pairs based on positional strength
        // Squares sorted by strategic classical value: Center (4) > Corners (0,2,6,8) > Edges (1,3,5,7)
        const squareWeights = [3, 2, 3, 2, 5, 2, 3, 2, 3];
        let bestPair = null;
        let bestScore = -9999;

        // Shuffle open squares slightly to avoid deterministic repetitive openings
        const candidates = [];
        for (let i = 0; i < open.length; i++) {
            for (let j = i + 1; j < open.length; j++) {
                candidates.push([open[i], open[j]]);
            }
        }
        candidates.sort(() => Math.random() - 0.5);

        for (const [sq1, sq2] of candidates) {
            let score = squareWeights[sq1] + squareWeights[sq2];

            // Bonus if squares share a winning line
            for (const line of QuantumTicTacToeEngine.WINNING_LINES) {
                if (line.includes(sq1) && line.includes(sq2)) {
                    score += 4;
                    // Extra bonus if third square has our marks or is empty
                    const third = line.find(s => s !== sq1 && s !== sq2);
                    if (this.classical[third] && this.classical[third].player === player) {
                        score += 6;
                    }
                }
            }

            // Penalty if this move gives opponent a cycle that guarantees them a win
            const active = this.getActiveMoves();
            const path = this.findPath(sq1, sq2, new Set(), active);
            if (path !== null) {
                // If creating a cycle, opponent chooses! If opponent can win, heavily penalize!
                const cycleVertices = path.map(p => p.sq);
                const dummyMove = { id: this.moveNum, player, sq1, sq2, collapsedTo: null };
                const cycleEdges = path.slice(0, -1).map(p => p.edge).concat([dummyMove]);
                const opt1 = this.buildCollapseOption(cycleVertices, cycleEdges, 0);
                const opt2 = this.buildCollapseOption(cycleVertices, cycleEdges, 1);
                const sim1 = this.simulateCollapse(opt1.assignment);
                const sim2 = this.simulateCollapse(opt2.assignment);

                if (sim1.winner === opponent || sim2.winner === opponent) {
                    score -= 50; // Dangerous cycle
                } else if (sim1.winner === player || sim2.winner === player) {
                    score += 15;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestPair = { sq1, sq2 };
            }
        }

        return bestPair || { sq1: open[0], sq2: open[1] };
    }

    /**
     * AI choice when AI is the chooser for a cyclic collapse.
     */
    computeBestCollapseChoice() {
        if (!this.pendingCycle) return 1;

        const player = this.pendingCycle.chooser;
        const opponent = player === 'X' ? 'O' : 'X';

        const sim1 = this.simulateCollapse(this.pendingCycle.option1.assignment);
        const sim2 = this.simulateCollapse(this.pendingCycle.option2.assignment);

        // Priority 1: Pick the option where AI wins
        if (sim1.winner === player && sim2.winner !== player) return 1;
        if (sim2.winner === player && sim1.winner !== player) return 2;

        // Priority 2: Avoid the option where opponent wins
        if (sim1.winner === opponent && sim2.winner !== opponent) return 2;
        if (sim2.winner === opponent && sim1.winner !== opponent) return 1;

        // Priority 3: Count classical lines or squares owned by AI
        const countOwned = (sim) => sim.classical.filter(c => c && c.player === player).length;
        if (countOwned(sim1) >= countOwned(sim2)) return 1;
        return 2;
    }

    /**
     * Simulate board state under a potential collapse assignment.
     */
    simulateCollapse(assignment) {
        const simClassical = [...this.classical];
        for (const [mIdStr, sq] of Object.entries(assignment)) {
            const mId = parseInt(mIdStr, 10);
            const mv = this.moves.find(m => m.id === mId);
            if (mv) {
                simClassical[sq] = { player: mv.player, moveId: mv.id };
            }
        }

        // Check winners on simulated board
        let winX = false;
        let winO = false;
        for (const [a, b, c] of QuantumTicTacToeEngine.WINNING_LINES) {
            const ca = simClassical[a], cb = simClassical[b], cc = simClassical[c];
            if (ca && cb && cc) {
                if (ca.player === 'X' && cb.player === 'X' && cc.player === 'X') winX = true;
                if (ca.player === 'O' && cb.player === 'O' && cc.player === 'O') winO = true;
            }
        }

        let winner = null;
        if (winX && !winO) winner = 'X';
        else if (winO && !winX) winner = 'O';
        else if (winX && winO) winner = 'Both';

        return { classical: simClassical, winner };
    }
}
