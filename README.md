# Quantum Tic-Tac-Toe — Allan Goff's Quantum Mechanics Game

An authentic, responsive implementation of **Allan Goff's Quantum Tic-Tac-Toe** (published in the *American Journal of Physics*, 2006). Features real-time quantum superposition, cyclic entanglement detection, interactive collapse cascades, opponent-controlled measurement, and Allan Goff's subscript tiebreaker rule.

Live Game URL: [https://monikaritgithub.github.io/quantun_tic_tac_toe/](https://monikaritgithub.github.io/quantun_tic_tac_toe/)

---

## ⚛️ Quantum Mechanics Principles (Allan Goff Model)

Standard classical Tic-Tac-Toe is deterministic and complete information. **Quantum Tic-Tac-Toe** introduces fundamental concepts of quantum physics:

### 1. Superposition (Two Spooky Marks Per Move)
- Players alternate turns: Player X places odd-numbered moves ($X_1, X_3, X_5 \dots$), and Player O places even-numbered moves ($O_2, O_4, O_6 \dots$).
- On each turn, a player marks **two different open squares** simultaneously (e.g., Move 1 places $X_1$ in Square 1 and Square 5).
- This represents a quantum state in equal superposition: $(|\text{Sq } 1\rangle + |\text{Sq } 5\rangle)/\sqrt{2}$.

### 2. Entanglement (Shared Squares)
- Any square can contain multiple spooky marks from different turns.
- When spooky marks share a square, they become **entangled**, forming a quantum dependency network (a multigraph where squares are vertices and moves are edges).

### 3. Cyclic Entanglement (Critical Measurement Threshold)
- As players place pairs of spooky marks, the entanglement network expands.
- When a move completes a **closed loop (cycle)** in the graph (e.g. $1 \xrightarrow{X_1} 2 \xrightarrow{O_2} 3 \xrightarrow{X_3} 1$), the quantum system reaches its critical measurement threshold.
- Normal gameplay pauses and an **immediate collapse (measurement)** is forced!

### 4. Opponent Chooses the Collapse
- The player who triggered the cycle **does not** choose the collapse.
- Instead, their **opponent** gets to select between the two possible classical configurations (Configuration A vs. Configuration B), injecting deep strategic counterplay!

### 5. Cascading Domino Collapse
- Resolving the cycle forces one mark in each cycle square to solidify into a permanent classical mark ($X$ or $O$).
- Dependent branches attached to the cycle collapse deterministically in a domino cascade.
- Collapsed squares become permanently closed classical squares.

### 6. Winning & The Subscript Tiebreaker Rule
- A player wins by achieving 3 classical marks in a row (horizontal, vertical, or diagonal).
- If a collapse causes *both* players to complete 3-in-a-row simultaneously, **Allan Goff's Subscript Tiebreaker** applies:
  - Each winning line is evaluated by the **maximum move subscript** among its 3 marks.
  - The line with the **smaller maximum subscript** was completed earlier in time: awarded **1.0 point (Winner)**.
  - The opponent receives **0.5 points**.

---

## 🎮 Game Features & Controls

- **Pass & Play (2 Players) & vs Quantum AI:** Switch smoothly between local 2-player multiplayer and intelligent Quantum AI mode.
- **Strict Turn Enforcement:** Guaranteed alternating turns; neither player can ever play multiple moves out of turn.
- **Live Entanglement Network Graph:** Real-time SVG visualization showing active quantum edges and animated pulsating cycles.
- **Interactive Collapse Dialog:** Clear side-by-side preview cards showing exactly how each spooky mark resolves into a classical square.
- **Responsive Light Theme:** Designed for both smartphones (touch targets, segmented tabs) and laptops/desktops (two-column dashboard).
- **Zero Emojis / 100% Scalable Vector SVGs:** Modern, crisp interface with real SVG icons.
- **Web Audio API Synthesizer:** Custom procedural sound effects for selections, entanglements, cycle alarms, collapse whooshes, and victory fanfares.

---

## 🚀 Live Deployment

The game is hosted on GitHub Pages:
[https://monikaritgithub.github.io/quantun_tic_tac_toe/](https://monikaritgithub.github.io/quantun_tic_tac_toe/)
