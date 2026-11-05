# Quantum Tic-Tac-Toe: 9-Qubit Quantum Circuit Simulator & Web Game

An interactive, responsive quantum game based on **IBM Qiskit** architecture, featuring real-time quantum circuit visualization, an interactive Bloch sphere projector, live Monte Carlo wavefunction simulation, and strategic gameplay against a Quantum AI bot or 2-Player pass & play.

Live Demo: [https://monikaritgithub.github.io/quantun_tic_tac_toe/](https://monikaritgithub.github.io/quantun_tic_tac_toe/)

---

## ⚛️ Quantum Mechanics & Physics Architecture

Unlike classical Tic-Tac-Toe where moves are discrete and deterministic, **Quantum Tic-Tac-Toe** maps each square $i \in \{0, \dots, 8\}$ to an individual qubit $q_i$ in a unified 9-qubit quantum register:

$$\begin{pmatrix} q_0 & q_1 & q_2 \\ q_3 & q_4 & q_5 \\ q_6 & q_7 & q_8 \end{pmatrix}$$

### Core Quantum Features:
1. **Superposition Initialization ($|+\rangle$):** Every round starts by applying Hadamard gates ($H$) across all 9 qubits:
   $$H|0\rangle = |+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$$
   Every tile starts in an unowned, neutral 50/50 probability state.
2. **Unitary Rotations ($R_y$):**
   - **Move 'O':** $R_y(-\pi/2)|+\rangle = |0\rangle$ (North Pole on Bloch sphere $\implies 100\%$ probability for Player O).
   - **Move 'X':** $R_y(+\pi/2)|+\rangle = |1\rangle$ (South Pole on Bloch sphere $\implies 100\%$ probability for Player X).
3. **Pauli-$X$ (Quantum NOT):**
   - Flips an owned square: $X|0\rangle = |1\rangle$ and $X|1\rangle = |0\rangle$.
   - Leaves unowned superposition invariant: $X|+\rangle = |+\rangle$.
4. **Quantum SWAP Gate:** Exchanges state vectors between two squares:
   $$\text{SWAP}(|\psi_i\rangle \otimes |\phi_j\rangle) = |\phi_j\rangle \otimes |\psi_i\rangle$$
5. **Projective Measurement ($M$):** Collapses the 9-qubit joint state into classical outcomes ($|0\rangle \to \text{O}$, $|1\rangle \to \text{X}$) according to the Born rule $P(m) = |\langle m|\psi\rangle|^2$.

---

## 🚀 Game Features

- **White / Light Theme:** Modern, high-contrast scientific laboratory aesthetic.
- **Real Vector SVG Icons:** Replaced all emojis with crisp, scalable SVG icons.
- **Live Vector Circuit Visualizer:** Automatically updates with Qiskit-style gate symbols, SWAP links, barriers, and measurement meters.
- **Interactive Bloch Sphere:** Real-time projection displaying polar angle $\theta$, azimuthal angle $\phi$, expectation value $\langle Z \rangle$, and probabilities for any selected tile.
- **Quantum AI Bot:** Evaluates potential winning lines, uses Pauli-X to steal opponent squares, uses SWAP to disrupt lines, and triggers measurement when it holds a statistical advantage.
- **Real-Time Monte Carlo Predictor:** Continuous 120-shot simulation estimating the win distribution before measurement.
- **Web Audio API Sound Effects:** Custom synthesized audio cues for gate applications, quantum collapse, and victories.
- **Zero Heavy Dependencies:** Built in pure HTML5, CSS3, and ES6 JavaScript for fast load times and zero build configuration.

---

## 🛠️ GitHub Pages Deployment

To enable GitHub Pages:
1. Navigate to repository **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
3. Select branch `main` (or `gh-pages`) and directory `/ (root)`.
4. Click **Save**. The game will be live at `https://monikaritgithub.github.io/quantun_tic_tac_toe/`.
