/**
 * Interactive Game Tutorial Controller
 * Modern gaming walkthrough for Allan Goff's Quantum Tic-Tac-Toe
 */

class InteractiveTutorial {
    constructor(soundFX) {
        this.sound = soundFX;
        this.currentSlide = 0;
        this.totalSlides = 6;
        this.isOpen = false;
        this.interactiveState = {};

        this.initDOM();
    }

    initDOM() {
        const modal = document.getElementById('tutorial-modal');
        const openBtn = document.getElementById('tutorial-btn');
        const closeBtn = document.getElementById('close-tutorial');
        const nextBtn = document.getElementById('tut-next-btn');
        const prevBtn = document.getElementById('tut-prev-btn');
        const skipBtn = document.getElementById('tut-skip-btn');

        if (openBtn) {
            openBtn.addEventListener('click', () => this.open());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.close());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prev());
        }

        // Keyboard navigation
        window.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            if (e.key === 'ArrowRight' || e.key === 'Space') {
                this.next();
            } else if (e.key === 'ArrowLeft') {
                this.prev();
            } else if (e.key === 'Escape') {
                this.close();
            }
        });
    }

    open(slideIndex = 0) {
        this.isOpen = true;
        this.currentSlide = slideIndex;
        const modal = document.getElementById('tutorial-modal');
        if (modal) modal.classList.add('visible');
        if (this.sound) this.sound.playSelect();
        this.render();
    }

    close() {
        this.isOpen = false;
        const modal = document.getElementById('tutorial-modal');
        if (modal) modal.classList.remove('visible');
        if (this.sound) this.sound.playSelect();
    }

    next() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.currentSlide++;
            if (this.sound) this.sound.playSelect();
            this.render();
        } else {
            // Finished tutorial
            if (this.sound) this.sound.playWin();
            this.close();
        }
    }

    prev() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            if (this.sound) this.sound.playSelect();
            this.render();
        }
    }

    goTo(idx) {
        if (idx >= 0 && idx < this.totalSlides) {
            this.currentSlide = idx;
            if (this.sound) this.sound.playSelect();
            this.render();
        }
    }

    render() {
        // Update progress bar
        const progressBar = document.getElementById('tut-progress-fill');
        const badge = document.getElementById('tut-step-badge');
        const nextBtn = document.getElementById('tut-next-btn');
        const prevBtn = document.getElementById('tut-prev-btn');
        const dotsContainer = document.getElementById('tut-dots');

        const pct = Math.round(((this.currentSlide + 1) / this.totalSlides) * 100);
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (badge) badge.textContent = `Lesson ${this.currentSlide + 1} of ${this.totalSlides}`;

        if (prevBtn) {
            prevBtn.disabled = this.currentSlide === 0;
            prevBtn.style.visibility = this.currentSlide === 0 ? 'hidden' : 'visible';
        }

        if (nextBtn) {
            if (this.currentSlide === this.totalSlides - 1) {
                nextBtn.innerHTML = `<span>Start Playing!</span>
                    <svg class="icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>`;
                nextBtn.className = 'btn btn-success';
            } else {
                nextBtn.innerHTML = `<span>Next</span>
                    <svg class="icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>`;
                nextBtn.className = 'btn btn-primary';
            }
        }

        // Render step dots
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            for (let i = 0; i < this.totalSlides; i++) {
                const dot = document.createElement('button');
                dot.className = `tut-dot ${i === this.currentSlide ? 'active' : ''}`;
                dot.title = `Jump to Step ${i + 1}`;
                dot.addEventListener('click', () => this.goTo(i));
                dotsContainer.appendChild(dot);
            }
        }

        // Render slide content
        const titleEl = document.getElementById('tut-title');
        const visualEl = document.getElementById('tut-visual-pane');
        const textEl = document.getElementById('tut-text-pane');

        const slideData = this.getSlideData(this.currentSlide);

        if (titleEl) titleEl.textContent = slideData.title;
        if (visualEl) visualEl.innerHTML = slideData.visualHtml;
        if (textEl) textEl.innerHTML = slideData.textHtml;

        // Attach any interactive listeners for this slide
        if (slideData.onRender) {
            slideData.onRender(this);
        }
    }

    getSlideData(slideIndex) {
        switch (slideIndex) {
            case 0:
                return {
                    title: "1. Quantum Superposition — The Two-Square Move",
                    visualHtml: `
                        <div class="tut-mini-board-wrapper">
                            <div class="tut-mini-board">
                                <div class="tut-mini-cell" id="tut-c1"><span class="cell-num">1</span></div>
                                <div class="tut-mini-cell active-pulse-x" id="tut-c2">
                                    <span class="cell-num">2</span>
                                    <span class="spooky-chip chip-x">X<sub>1</sub></span>
                                </div>
                                <div class="tut-mini-cell" id="tut-c3"><span class="cell-num">3</span></div>
                                <div class="tut-mini-cell" id="tut-c4"><span class="cell-num">4</span></div>
                                <div class="tut-mini-cell active-pulse-x" id="tut-c5">
                                    <span class="cell-num">5</span>
                                    <span class="spooky-chip chip-x">X<sub>1</sub></span>
                                </div>
                                <div class="tut-mini-cell" id="tut-c6"><span class="cell-num">6</span></div>
                                <div class="tut-mini-cell" id="tut-c7"><span class="cell-num">7</span></div>
                                <div class="tut-mini-cell" id="tut-c8"><span class="cell-num">8</span></div>
                                <div class="tut-mini-cell" id="tut-c9"><span class="cell-num">9</span></div>
                            </div>
                            <div class="tut-action-bar">
                                <button id="tut-sim-btn-1" class="btn btn-sm btn-subtle">
                                    <svg class="icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                    <span>Replay Move Animation</span>
                                </button>
                            </div>
                        </div>
                    `,
                    textHtml: `
                        <div class="tut-explanation">
                            <div class="tut-callout">
                                <strong>Every move puts a mark in TWO places at once!</strong>
                            </div>
                            <p>In classical Tic-Tac-Toe, you place a single permanent mark per turn. In Quantum Tic-Tac-Toe, each move places <strong>two "spooky" marks</strong> into two <em>different</em> open squares.</p>
                            <ul class="tut-list">
                                <li>Player X plays odd moves (X<sub>1</sub>, X<sub>3</sub>, X<sub>5</sub>...).</li>
                                <li>Player O plays even moves (O<sub>2</sub>, O<sub>4</sub>, O<sub>6</sub>...).</li>
                                <li>Your mark is in true <strong>superposition</strong>: half in Square 2 and half in Square 5 until measured!</li>
                            </ul>
                        </div>
                    `,
                    onRender: (tut) => {
                        const btn = document.getElementById('tut-sim-btn-1');
                        if (btn) {
                            btn.onclick = () => {
                                const c2 = document.getElementById('tut-c2');
                                const c5 = document.getElementById('tut-c5');
                                if (c2 && c5) {
                                    c2.classList.remove('active-pulse-x');
                                    c5.classList.remove('active-pulse-x');
                                    void c2.offsetWidth;
                                    c2.classList.add('active-pulse-x');
                                    c5.classList.add('active-pulse-x');
                                    if (tut.sound) tut.sound.playEntangle();
                                }
                            };
                        }
                    }
                };

            case 1:
                return {
                    title: "2. Quantum Entanglement — Shared Squares",
                    visualHtml: `
                        <div class="tut-mini-board-wrapper">
                            <div class="tut-mini-board">
                                <div class="tut-mini-cell"><span class="cell-num">1</span></div>
                                <div class="tut-mini-cell">
                                    <span class="cell-num">2</span>
                                    <span class="spooky-chip chip-x">X<sub>1</sub></span>
                                </div>
                                <div class="tut-mini-cell"><span class="cell-num">3</span></div>
                                <div class="tut-mini-cell"><span class="cell-num">4</span></div>
                                <div class="tut-mini-cell highlighted-shared">
                                    <span class="cell-num">5</span>
                                    <div class="spooky-container">
                                        <span class="spooky-chip chip-x">X<sub>1</sub></span>
                                        <span class="spooky-chip chip-o">O<sub>2</sub></span>
                                    </div>
                                </div>
                                <div class="tut-mini-cell"><span class="cell-num">6</span></div>
                                <div class="tut-mini-cell"><span class="cell-num">7</span></div>
                                <div class="tut-mini-cell">
                                    <span class="cell-num">8</span>
                                    <span class="spooky-chip chip-o">O<sub>2</sub></span>
                                </div>
                                <div class="tut-mini-cell"><span class="cell-num">9</span></div>
                            </div>
                            <div class="tut-tag-banner">
                                <span class="tag-entangled">Square #5 is Entangled!</span>
                            </div>
                        </div>
                    `,
                    textHtml: `
                        <div class="tut-explanation">
                            <div class="tut-callout">
                                <strong>Squares can hold multiple marks from different turns!</strong>
                            </div>
                            <p>Here, Player O plays move <strong>O<sub>2</sub></strong> into Square 5 and Square 8. Notice Square 5 now holds <em>both</em> X<sub>1</sub> and O<sub>2</sub>.</p>
                            <ul class="tut-list">
                                <li>Because they share Square 5, Move 1 and Move 2 are now <strong>entangled</strong>.</li>
                                <li>If X<sub>1</sub> later solidifies in Square 5, O<sub>2</sub> will be booted out to Square 8!</li>
                                <li>The board behaves like an interconnected web of possibilities.</li>
                            </ul>
                        </div>
                    `
                };

            case 2:
                return {
                    title: "3. Cyclic Entanglement — The Measurement Trap!",
                    visualHtml: `
                        <div class="tut-mini-board-wrapper">
                            <div class="tut-mini-board">
                                <div class="tut-mini-cell"><span class="cell-num">1</span></div>
                                <div class="tut-mini-cell cycle-loop-cell">
                                    <span class="cell-num">2</span>
                                    <div class="spooky-container">
                                        <span class="spooky-chip chip-x">X<sub>1</sub></span>
                                        <span class="spooky-chip chip-x active-new">X<sub>3</sub></span>
                                    </div>
                                </div>
                                <div class="tut-mini-cell"><span class="cell-num">3</span></div>
                                <div class="tut-mini-cell"><span class="cell-num">4</span></div>
                                <div class="tut-mini-cell cycle-loop-cell">
                                    <span class="cell-num">5</span>
                                    <div class="spooky-container">
                                        <span class="spooky-chip chip-x">X<sub>1</sub></span>
                                        <span class="spooky-chip chip-o">O<sub>2</sub></span>
                                    </div>
                                </div>
                                <div class="tut-mini-cell"><span class="cell-num">6</span></div>
                                <div class="tut-mini-cell"><span class="cell-num">7</span></div>
                                <div class="tut-mini-cell cycle-loop-cell">
                                    <span class="cell-num">8</span>
                                    <div class="spooky-container">
                                        <span class="spooky-chip chip-o">O<sub>2</sub></span>
                                        <span class="spooky-chip chip-x active-new">X<sub>3</sub></span>
                                    </div>
                                </div>
                                <div class="tut-mini-cell"><span class="cell-num">9</span></div>
                            </div>
                            <div class="tut-tag-banner cycle-warning-banner">
                                <span class="tag-cycle-alert">Loop Closed: #2 ↔ #5 ↔ #8 ↔ #2</span>
                            </div>
                        </div>
                    `,
                    textHtml: `
                        <div class="tut-explanation">
                            <div class="tut-callout warning">
                                <strong>A closed loop forces an IMMEDIATE measurement collapse!</strong>
                            </div>
                            <p>On Move 3, Player X connects Square 8 back to Square 2 with <strong>X<sub>3</sub></strong>. This forms a closed cycle:</p>
                            <p style="text-align:center; font-family:var(--font-mono); font-weight:700; color:var(--accent-amber);">
                                Sq 2 &larr;X<sub>1</sub>&rarr; Sq 5 &larr;O<sub>2</sub>&rarr; Sq 8 &larr;X<sub>3</sub>&rarr; Sq 2
                            </p>
                            <ul class="tut-list">
                                <li>The quantum system becomes over-determined.</li>
                                <li>Normal play pauses instantly and a <strong>wavefunction collapse</strong> is forced!</li>
                            </ul>
                        </div>
                    `
                };

            case 3:
                return {
                    title: "4. Opponent's Choice — Selecting Reality",
                    visualHtml: `
                        <div class="tut-choice-preview-grid">
                            <div class="tut-choice-card">
                                <h5>Configuration A</h5>
                                <div class="tut-mini-outcomes">
                                    <span class="outcome-chip chip-x">X<sub>1</sub> &rarr; Sq 2</span>
                                    <span class="outcome-chip chip-o">O<sub>2</sub> &rarr; Sq 5</span>
                                    <span class="outcome-chip chip-x">X<sub>3</sub> &rarr; Sq 8</span>
                                </div>
                                <span class="tut-choice-hint">Player O owns Center (Sq 5)!</span>
                            </div>
                            <div class="tut-choice-card">
                                <h5>Configuration B</h5>
                                <div class="tut-mini-outcomes">
                                    <span class="outcome-chip chip-x">X<sub>1</sub> &rarr; Sq 5</span>
                                    <span class="outcome-chip chip-o">O<sub>2</sub> &rarr; Sq 8</span>
                                    <span class="outcome-chip chip-x">X<sub>3</sub> &rarr; Sq 2</span>
                                </div>
                                <span class="tut-choice-hint">Player X owns Center (Sq 5)!</span>
                            </div>
                        </div>
                    `,
                    textHtml: `
                        <div class="tut-explanation">
                            <div class="tut-callout primary">
                                <strong>The OPPONENT chooses how the cycle resolves!</strong>
                            </div>
                            <p>Player X created the cycle with Move 3, so <strong>Player O</strong> gets to choose how the cycle collapses!</p>
                            <ul class="tut-list">
                                <li>Every cycle has exactly <strong>two possible classical configurations</strong> (direct or inverted).</li>
                                <li>Player O will naturally pick <strong>Configuration A</strong>, securing the critical Center square (Square 5) for themselves!</li>
                                <li>This strategic counterplay prevents players from recklessly creating cycles.</li>
                            </ul>
                        </div>
                    `
                };

            case 4:
                return {
                    title: "5. Cascading Domino Collapse",
                    visualHtml: `
                        <div class="tut-mini-board-wrapper">
                            <div class="tut-mini-board">
                                <div class="tut-mini-cell"><span class="cell-num">1</span></div>
                                <div class="tut-mini-cell collapsed-classical-x">
                                    <span class="cell-num">2</span>
                                    <span class="solid-mark mark-x">X<sub>1</sub></span>
                                </div>
                                <div class="tut-mini-cell"><span class="cell-num">3</span></div>
                                <div class="tut-mini-cell"><span class="cell-num">4</span></div>
                                <div class="tut-mini-cell collapsed-classical-o">
                                    <span class="cell-num">5</span>
                                    <span class="solid-mark mark-o">O<sub>2</sub></span>
                                </div>
                                <div class="tut-mini-cell"><span class="cell-num">6</span></div>
                                <div class="tut-mini-cell"><span class="cell-num">7</span></div>
                                <div class="tut-mini-cell collapsed-classical-x">
                                    <span class="cell-num">8</span>
                                    <span class="solid-mark mark-x">X<sub>3</sub></span>
                                </div>
                                <div class="tut-mini-cell"><span class="cell-num">9</span></div>
                            </div>
                            <div class="tut-tag-banner">
                                <span class="tag-success">Collapsed into Classical Reality!</span>
                            </div>
                        </div>
                    `,
                    textHtml: `
                        <div class="tut-explanation">
                            <div class="tut-callout success">
                                <strong>Spooky marks solidify into permanent classical squares!</strong>
                            </div>
                            <p>Once Configuration A is chosen:</p>
                            <ul class="tut-list">
                                <li>Square 2 becomes a solid classical <strong>X</strong> (from X<sub>1</sub>).</li>
                                <li>Square 5 becomes a solid classical <strong>O</strong> (from O<sub>2</sub>).</li>
                                <li>Square 8 becomes a solid classical <strong>X</strong> (from X<sub>3</sub>).</li>
                                <li>Their alternate halves disappear from the board forever!</li>
                                <li>Squares 2, 5, and 8 are now closed. Future quantum moves cannot be placed in collapsed squares.</li>
                            </ul>
                        </div>
                    `
                };

            case 5:
                return {
                    title: "6. Victory & The Subscript Tiebreaker Rule",
                    visualHtml: `
                        <div class="tut-sim-win-box">
                            <div class="win-line-example win-x-line">
                                <div class="win-line-title">Player X's Line</div>
                                <div class="win-squares-row">
                                    <span class="win-tile">X<sub>1</sub></span>
                                    <span class="win-tile">X<sub>3</sub></span>
                                    <span class="win-tile">X<sub>5</sub></span>
                                </div>
                                <span class="win-sub-label">Max Subscript: <strong>5</strong> &larr; EARLIER!</span>
                            </div>
                            <div class="win-vs-badge">VS</div>
                            <div class="win-line-example win-o-line">
                                <div class="win-line-title">Player O's Line</div>
                                <div class="win-squares-row">
                                    <span class="win-tile">O<sub>2</sub></span>
                                    <span class="win-tile">O<sub>4</sub></span>
                                    <span class="win-tile">O<sub>6</sub></span>
                                </div>
                                <span class="win-sub-label">Max Subscript: <strong>6</strong> &larr; Later</span>
                            </div>
                        </div>
                    `,
                    textHtml: `
                        <div class="tut-explanation">
                            <div class="tut-callout victory">
                                <strong>Get 3 classical marks in a row to win!</strong>
                            </div>
                            <p>Because collapses resolve multiple squares at once, it is possible for <em>both</em> players to complete 3-in-a-row in the same collapse! When that happens:</p>
                            <ul class="tut-list">
                                <li><strong>Allan Goff's Subscript Tiebreaker:</strong> Look at the maximum move subscript in each player's line.</li>
                                <li>The player with the <strong>smaller maximum subscript</strong> (5 vs 6) completed their line earlier in time!</li>
                                <li><strong>Winner (Player X):</strong> Awarded <strong>1.0 point</strong>.</li>
                                <li><strong>Runner-up (Player O):</strong> Awarded <strong>0.5 points</strong>.</li>
                            </ul>
                        </div>
                    `
                };

            default:
                return { title: "", visualHtml: "", textHtml: "" };
        }
    }
}
