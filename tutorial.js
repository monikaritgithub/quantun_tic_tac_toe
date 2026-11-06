/**
 * Interactive Game Tutorial Controller
 * Modern gaming walkthrough for Allan Goff's Quantum Tic-Tac-Toe
 * With automated animation playback on every lesson slide!
 */

class InteractiveTutorial {
    constructor(soundFX) {
        this.sound = soundFX;
        this.currentSlide = 0;
        this.totalSlides = 6;
        this.isOpen = false;
        this.animTimers = [];

        this.initDOM();
    }

    clearTimers() {
        if (this.animTimers && this.animTimers.length > 0) {
            this.animTimers.forEach(id => clearTimeout(id));
        }
        this.animTimers = [];
    }

    addTimer(fn, delayMs) {
        const id = setTimeout(() => {
            fn();
        }, delayMs);
        this.animTimers.push(id);
        return id;
    }

    initDOM() {
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
        this.clearTimers();
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

    goTo(index) {
        if (index >= 0 && index < this.totalSlides) {
            this.currentSlide = index;
            if (this.sound) this.sound.playSelect();
            this.render();
        }
    }

    render() {
        this.clearTimers();

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
                nextBtn.className = 'btn btn-gaming-success';
            } else {
                nextBtn.innerHTML = `<span>Next</span>
                    <svg class="icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>`;
                nextBtn.className = 'btn btn-gaming-primary';
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

        // Wire up replay button and launch automatic animation!
        if (slideData.runAnimation) {
            const replayBtn = document.getElementById(`tut-sim-btn-${this.currentSlide}`);
            if (replayBtn) {
                replayBtn.onclick = () => {
                    this.clearTimers();
                    slideData.runAnimation(this);
                };
            }
            // Automatically trigger animation playback on entry!
            this.addTimer(() => {
                slideData.runAnimation(this);
            }, 260);
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
                                <div class="tut-mini-cell" id="tut-c2"><span class="cell-num">2</span></div>
                                <div class="tut-mini-cell" id="tut-c3"><span class="cell-num">3</span></div>
                                <div class="tut-mini-cell" id="tut-c4"><span class="cell-num">4</span></div>
                                <div class="tut-mini-cell" id="tut-c5"><span class="cell-num">5</span></div>
                                <div class="tut-mini-cell" id="tut-c6"><span class="cell-num">6</span></div>
                                <div class="tut-mini-cell" id="tut-c7"><span class="cell-num">7</span></div>
                                <div class="tut-mini-cell" id="tut-c8"><span class="cell-num">8</span></div>
                                <div class="tut-mini-cell" id="tut-c9"><span class="cell-num">9</span></div>
                            </div>
                            <div class="tut-tag-banner">
                                <span id="tut-banner-0" class="tag-entangled">Auto-Playing Superposition Move...</span>
                            </div>
                            <div class="tut-action-bar">
                                <button id="tut-sim-btn-0" class="btn-replay-anim">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                    <span>Replay Move Animation</span>
                                </button>
                            </div>
                        </div>
                    `,
                    textHtml: `
                        <div class="tut-explanation">
                            <div class="tut-callout primary">
                                <strong>Every move puts a mark in TWO places at once!</strong>
                            </div>
                            <p>In classical Tic-Tac-Toe, you place a single permanent mark per turn. In Quantum Tic-Tac-Toe, each move places <strong>two spooky marks</strong> into two <em>different</em> open squares.</p>
                            <ul class="tut-list">
                                <li>Player X plays odd moves (X<sub>1</sub>, X<sub>3</sub>, X<sub>5</sub>...).</li>
                                <li>Player O plays even moves (O<sub>2</sub>, O<sub>4</sub>, O<sub>6</sub>...).</li>
                                <li>Your mark is in true <strong>superposition</strong>: half in Square 2 and half in Square 5 until measured!</li>
                            </ul>
                        </div>
                    `,
                    runAnimation: (tut) => {
                        const c2 = document.getElementById('tut-c2');
                        const c5 = document.getElementById('tut-c5');
                        const banner = document.getElementById('tut-banner-0');
                        if (!c2 || !c5) return;

                        // Step 0: Reset
                        c2.innerHTML = '<span class="cell-num">2</span>';
                        c5.innerHTML = '<span class="cell-num">5</span>';
                        c2.classList.remove('active-pulse-x');
                        c5.classList.remove('active-pulse-x');
                        if (banner) {
                            banner.className = 'tag-entangled';
                            banner.textContent = 'Player X placing Move 1 in superposition...';
                        }

                        // Step 1: Place first half in Square 2
                        tut.addTimer(() => {
                            c2.innerHTML = '<span class="cell-num">2</span><span class="spooky-chip chip-x pop-chip-anim">X<sub>1</sub></span>';
                            c2.classList.add('active-pulse-x');
                            if (tut.sound) tut.sound.playPlace();
                            if (banner) banner.textContent = '1st spooky mark placed in Square #2...';
                        }, 350);

                        // Step 2: Place second half in Square 5
                        tut.addTimer(() => {
                            c5.innerHTML = '<span class="cell-num">5</span><span class="spooky-chip chip-x pop-chip-anim">X<sub>1</sub></span>';
                            c5.classList.add('active-pulse-x');
                            if (tut.sound) tut.sound.playEntangle();
                            if (banner) {
                                banner.className = 'tag-success';
                                banner.textContent = '✓ Superposition established across Squares #2 & #5!';
                            }
                        }, 1250);
                    }
                };

            case 1:
                return {
                    title: "2. Quantum Entanglement — Shared Squares",
                    visualHtml: `
                        <div class="tut-mini-board-wrapper">
                            <div class="tut-mini-board">
                                <div class="tut-mini-cell" id="tut2-c1"><span class="cell-num">1</span></div>
                                <div class="tut-mini-cell" id="tut2-c2">
                                    <span class="cell-num">2</span>
                                    <span class="spooky-chip chip-x">X<sub>1</sub></span>
                                </div>
                                <div class="tut-mini-cell" id="tut2-c3"><span class="cell-num">3</span></div>
                                <div class="tut-mini-cell" id="tut2-c4"><span class="cell-num">4</span></div>
                                <div class="tut-mini-cell" id="tut2-c5">
                                    <span class="cell-num">5</span>
                                    <div class="spooky-container" id="tut2-box-5">
                                        <span class="spooky-chip chip-x">X<sub>1</sub></span>
                                    </div>
                                </div>
                                <div class="tut-mini-cell" id="tut2-c6"><span class="cell-num">6</span></div>
                                <div class="tut-mini-cell" id="tut2-c7"><span class="cell-num">7</span></div>
                                <div class="tut-mini-cell" id="tut2-c8"><span class="cell-num">8</span></div>
                                <div class="tut-mini-cell" id="tut2-c9"><span class="cell-num">9</span></div>
                            </div>
                            <div class="tut-tag-banner">
                                <span id="tut-banner-1" class="tag-entangled">Player O placing Move 2...</span>
                            </div>
                            <div class="tut-action-bar">
                                <button id="tut-sim-btn-1" class="btn-replay-anim">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                    <span>Replay Move Animation</span>
                                </button>
                            </div>
                        </div>
                    `,
                    textHtml: `
                        <div class="tut-explanation">
                            <div class="tut-callout primary">
                                <strong>Squares can hold multiple marks from different turns!</strong>
                            </div>
                            <p>Here, Player O plays move <strong>O<sub>2</sub></strong> into Square 5 and Square 8. Notice Square 5 now holds <em>both</em> X<sub>1</sub> and O<sub>2</sub>.</p>
                            <ul class="tut-list">
                                <li>Because they share Square 5, Move 1 and Move 2 are now <strong>entangled</strong>.</li>
                                <li>If X<sub>1</sub> later solidifies in Square 5, O<sub>2</sub> will be booted out to Square 8!</li>
                                <li>The board behaves like an interconnected web of possibilities.</li>
                            </ul>
                        </div>
                    `,
                    runAnimation: (tut) => {
                        const box5 = document.getElementById('tut2-box-5');
                        const c5 = document.getElementById('tut2-c5');
                        const c8 = document.getElementById('tut2-c8');
                        const banner = document.getElementById('tut-banner-1');
                        if (!c5 || !c8 || !box5) return;

                        // Reset
                        box5.innerHTML = '<span class="spooky-chip chip-x">X<sub>1</sub></span>';
                        c8.innerHTML = '<span class="cell-num">8</span>';
                        c5.classList.remove('highlighted-shared');
                        if (banner) {
                            banner.className = 'tag-entangled';
                            banner.textContent = 'Player O targeting Squares #5 and #8...';
                        }

                        // Step 1: O2 enters Square 5
                        tut.addTimer(() => {
                            box5.innerHTML = '<span class="spooky-chip chip-x">X<sub>1</sub></span><span class="spooky-chip chip-o pop-chip-anim">O<sub>2</sub></span>';
                            c5.classList.add('highlighted-shared');
                            if (tut.sound) tut.sound.playPlace();
                            if (banner) banner.textContent = 'Player O drops O₂ into Square #5 alongside X₁...';
                        }, 400);

                        // Step 2: O2 enters Square 8
                        tut.addTimer(() => {
                            c8.innerHTML = '<span class="cell-num">8</span><span class="spooky-chip chip-o pop-chip-anim">O<sub>2</sub></span>';
                            if (tut.sound) tut.sound.playEntangle();
                            if (banner) {
                                banner.className = 'tag-entangled';
                                banner.textContent = '⚡ Square #5 is Entangled! Move 1 & Move 2 are bound!';
                            }
                        }, 1250);
                    }
                };

            case 2:
                return {
                    title: "3. Cyclic Entanglement — The Measurement Trap!",
                    visualHtml: `
                        <div class="tut-mini-board-wrapper">
                            <div class="tut-mini-board">
                                <div class="tut-mini-cell" id="tut3-c1"><span class="cell-num">1</span></div>
                                <div class="tut-mini-cell" id="tut3-c2">
                                    <span class="cell-num">2</span>
                                    <div class="spooky-container" id="tut3-box-2">
                                        <span class="spooky-chip chip-x">X<sub>1</sub></span>
                                    </div>
                                </div>
                                <div class="tut-mini-cell" id="tut3-c3"><span class="cell-num">3</span></div>
                                <div class="tut-mini-cell" id="tut3-c4"><span class="cell-num">4</span></div>
                                <div class="tut-mini-cell" id="tut3-c5">
                                    <span class="cell-num">5</span>
                                    <div class="spooky-container">
                                        <span class="spooky-chip chip-x">X<sub>1</sub></span>
                                        <span class="spooky-chip chip-o">O<sub>2</sub></span>
                                    </div>
                                </div>
                                <div class="tut-mini-cell" id="tut3-c6"><span class="cell-num">6</span></div>
                                <div class="tut-mini-cell" id="tut3-c7"><span class="cell-num">7</span></div>
                                <div class="tut-mini-cell" id="tut3-c8">
                                    <span class="cell-num">8</span>
                                    <div class="spooky-container" id="tut3-box-8">
                                        <span class="spooky-chip chip-o">O<sub>2</sub></span>
                                    </div>
                                </div>
                                <div class="tut-mini-cell" id="tut3-c9"><span class="cell-num">9</span></div>
                            </div>
                            <div class="tut-tag-banner">
                                <span id="tut-banner-2" class="tag-entangled">Player X preparing Move 3...</span>
                            </div>
                            <div class="tut-action-bar">
                                <button id="tut-sim-btn-2" class="btn-replay-anim">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                    <span>Replay Move Animation</span>
                                </button>
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
                    `,
                    runAnimation: (tut) => {
                        const box2 = document.getElementById('tut3-box-2');
                        const box8 = document.getElementById('tut3-box-8');
                        const c2 = document.getElementById('tut3-c2');
                        const c5 = document.getElementById('tut3-c5');
                        const c8 = document.getElementById('tut3-c8');
                        const banner = document.getElementById('tut-banner-2');
                        if (!box2 || !box8 || !c2 || !c5 || !c8) return;

                        // Reset
                        box2.innerHTML = '<span class="spooky-chip chip-x">X<sub>1</sub></span>';
                        box8.innerHTML = '<span class="spooky-chip chip-o">O<sub>2</sub></span>';
                        [c2, c5, c8].forEach(c => {
                            c.classList.remove('cycle-loop-cell', 'cycle-flash-anim');
                        });
                        if (banner) {
                            banner.className = 'tag-entangled';
                            banner.textContent = 'Player X placing Move 3 into Squares #8 & #2...';
                        }

                        // Step 1: X3 into Square 8
                        tut.addTimer(() => {
                            box8.innerHTML = '<span class="spooky-chip chip-o">O<sub>2</sub></span><span class="spooky-chip chip-x pop-chip-anim">X<sub>3</sub></span>';
                            if (tut.sound) tut.sound.playPlace();
                            if (banner) banner.textContent = 'Player X places X₃ into Square #8...';
                        }, 400);

                        // Step 2: X3 into Square 2 -> Loop Closed!
                        tut.addTimer(() => {
                            box2.innerHTML = '<span class="spooky-chip chip-x">X<sub>1</sub></span><span class="spooky-chip chip-x pop-chip-anim">X<sub>3</sub></span>';
                            [c2, c5, c8].forEach(c => {
                                c.classList.add('cycle-loop-cell', 'cycle-flash-anim');
                            });
                            if (tut.sound) tut.sound.playCycleAlert();
                            if (banner) {
                                banner.className = 'tag-cycle-alert';
                                banner.textContent = '🚨 CLOSED LOOP DETECTED: #2 ⟷ #5 ⟷ #8! MEASUREMENT FORCED!';
                            }
                        }, 1250);
                    }
                };

            case 3:
                return {
                    title: "4. Opponent's Choice — Selecting Reality",
                    visualHtml: `
                        <div class="tut-choice-preview-grid">
                            <div class="tut-choice-card" id="tut4-card-a">
                                <h5>Configuration A</h5>
                                <div class="tut-mini-outcomes">
                                    <span class="outcome-chip chip-x" id="tut4-a1">X<sub>1</sub> &rarr; Sq 2</span>
                                    <span class="outcome-chip chip-o" id="tut4-a2">O<sub>2</sub> &rarr; Sq 5</span>
                                    <span class="outcome-chip chip-x" id="tut4-a3">X<sub>3</sub> &rarr; Sq 8</span>
                                </div>
                                <span class="tut-choice-hint">Player O secures Center Square #5!</span>
                            </div>
                            <div class="tut-choice-card" id="tut4-card-b">
                                <h5>Configuration B</h5>
                                <div class="tut-mini-outcomes">
                                    <span class="outcome-chip chip-x" id="tut4-b1">X<sub>1</sub> &rarr; Sq 5</span>
                                    <span class="outcome-chip chip-o" id="tut4-b2">O<sub>2</sub> &rarr; Sq 8</span>
                                    <span class="outcome-chip chip-x" id="tut4-b3">X<sub>3</sub> &rarr; Sq 2</span>
                                </div>
                                <span class="tut-choice-hint">Player X secures Center Square #5!</span>
                            </div>
                        </div>
                        <div class="tut-tag-banner">
                            <span id="tut-banner-3" class="tag-entangled">Evaluating Strategic Collapses...</span>
                        </div>
                        <div class="tut-action-bar">
                            <button id="tut-sim-btn-3" class="btn-replay-anim">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                                <span>Replay Decision Preview</span>
                            </button>
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
                    `,
                    runAnimation: (tut) => {
                        const cardA = document.getElementById('tut4-card-a');
                        const cardB = document.getElementById('tut4-card-b');
                        const banner = document.getElementById('tut-banner-3');
                        if (!cardA || !cardB) return;

                        // Reset
                        cardA.style.borderColor = '';
                        cardA.style.background = '';
                        cardB.style.borderColor = '';
                        cardB.style.background = '';
                        if (banner) {
                            banner.className = 'tag-entangled';
                            banner.textContent = 'Player O examining Configuration A vs B...';
                        }

                        // Step 1: Highlight Configuration A
                        tut.addTimer(() => {
                            cardA.style.borderColor = '#2563eb';
                            cardA.style.background = '#eff6ff';
                            cardA.style.boxShadow = '0 0 15px rgba(37, 99, 235, 0.25)';
                            if (tut.sound) tut.sound.playSelect();
                            if (banner) {
                                banner.className = 'tag-success';
                                banner.textContent = '✓ Player O picks Configuration A to capture Square #5!';
                            }
                        }, 500);

                        // Allow interactive click preview
                        cardA.onclick = () => {
                            cardA.style.borderColor = '#2563eb';
                            cardA.style.background = '#eff6ff';
                            cardB.style.borderColor = '';
                            cardB.style.background = '';
                            if (tut.sound) tut.sound.playSelect();
                            if (banner) {
                                banner.className = 'tag-success';
                                banner.textContent = 'Selected Configuration A: O secures Center (#5)!';
                            }
                        };
                        cardB.onclick = () => {
                            cardB.style.borderColor = '#2563eb';
                            cardB.style.background = '#eff6ff';
                            cardA.style.borderColor = '';
                            cardA.style.background = '';
                            if (tut.sound) tut.sound.playSelect();
                            if (banner) {
                                banner.className = 'tag-entangled';
                                banner.textContent = 'Selected Configuration B: X secures Center (#5)!';
                            }
                        };
                    }
                };

            case 4:
                return {
                    title: "5. Cascading Domino Collapse",
                    visualHtml: `
                        <div class="tut-mini-board-wrapper">
                            <div class="tut-mini-board">
                                <div class="tut-mini-cell" id="tut5-c1"><span class="cell-num">1</span></div>
                                <div class="tut-mini-cell" id="tut5-c2"><span class="cell-num">2</span></div>
                                <div class="tut-mini-cell" id="tut5-c3"><span class="cell-num">3</span></div>
                                <div class="tut-mini-cell" id="tut5-c4"><span class="cell-num">4</span></div>
                                <div class="tut-mini-cell" id="tut5-c5"><span class="cell-num">5</span></div>
                                <div class="tut-mini-cell" id="tut5-c6"><span class="cell-num">6</span></div>
                                <div class="tut-mini-cell" id="tut5-c7"><span class="cell-num">7</span></div>
                                <div class="tut-mini-cell" id="tut5-c8"><span class="cell-num">8</span></div>
                                <div class="tut-mini-cell" id="tut5-c9"><span class="cell-num">9</span></div>
                            </div>
                            <div class="tut-tag-banner">
                                <span id="tut-banner-4" class="tag-entangled">Collapsing Spooky Wavefunction...</span>
                            </div>
                            <div class="tut-action-bar">
                                <button id="tut-sim-btn-4" class="btn-replay-anim">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                    <span>Replay Collapse Simulation</span>
                                </button>
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
                    `,
                    runAnimation: (tut) => {
                        const c2 = document.getElementById('tut5-c2');
                        const c5 = document.getElementById('tut5-c5');
                        const c8 = document.getElementById('tut5-c8');
                        const banner = document.getElementById('tut-banner-4');
                        if (!c2 || !c5 || !c8) return;

                        // Reset to spooky state
                        c2.className = 'tut-mini-cell';
                        c5.className = 'tut-mini-cell';
                        c8.className = 'tut-mini-cell';
                        c2.innerHTML = '<span class="cell-num">2</span><span class="spooky-chip chip-x">X<sub>1</sub></span>';
                        c5.innerHTML = '<span class="cell-num">5</span><span class="spooky-chip chip-o">O<sub>2</sub></span>';
                        c8.innerHTML = '<span class="cell-num">8</span><span class="spooky-chip chip-x">X<sub>3</sub></span>';
                        if (banner) {
                            banner.className = 'tag-entangled';
                            banner.textContent = 'Triggering Quantum Measurement Collapse...';
                        }

                        // Step 1: Square 2 collapses to solid X
                        tut.addTimer(() => {
                            c2.className = 'tut-mini-cell collapsed-classical-x';
                            c2.innerHTML = '<span class="cell-num">2</span><span class="solid-mark mark-x stamp-mark-anim">X<sub>1</sub></span>';
                            if (tut.sound) tut.sound.playCollapse();
                            if (banner) banner.textContent = 'Square #2 collapses into classical X₁!';
                        }, 400);

                        // Step 2: Square 5 collapses to solid O
                        tut.addTimer(() => {
                            c5.className = 'tut-mini-cell collapsed-classical-o';
                            c5.innerHTML = '<span class="cell-num">5</span><span class="solid-mark mark-o stamp-mark-anim">O<sub>2</sub></span>';
                            if (tut.sound) tut.sound.playCollapse();
                            if (banner) banner.textContent = 'Square #5 collapses into classical O₂!';
                        }, 950);

                        // Step 3: Square 8 collapses to solid X
                        tut.addTimer(() => {
                            c8.className = 'tut-mini-cell collapsed-classical-x';
                            c8.innerHTML = '<span class="cell-num">8</span><span class="solid-mark mark-x stamp-mark-anim">X<sub>3</sub></span>';
                            if (tut.sound) tut.sound.playCollapse();
                            if (banner) {
                                banner.className = 'tag-success';
                                banner.textContent = '✓ Classical Reality Solidified! Squares #2, #5, #8 locked!';
                            }
                        }, 1500);
                    }
                };

            case 5:
                return {
                    title: "6. Victory & The Subscript Tiebreaker Rule",
                    visualHtml: `
                        <div class="tut-sim-win-box">
                            <div class="win-line-example win-x-line" id="tut6-line-x">
                                <div class="win-line-title">Player X's Line</div>
                                <div class="win-squares-row">
                                    <span class="win-tile">X<sub>1</sub></span>
                                    <span class="win-tile">X<sub>3</sub></span>
                                    <span class="win-tile" id="tut6-x-max">X<sub>5</sub></span>
                                </div>
                                <span class="win-sub-label" id="tut6-x-sub">Max Subscript: <strong>5</strong></span>
                            </div>
                            <div class="win-vs-badge">VS</div>
                            <div class="win-line-example win-o-line" id="tut6-line-o">
                                <div class="win-line-title">Player O's Line</div>
                                <div class="win-squares-row">
                                    <span class="win-tile">O<sub>2</sub></span>
                                    <span class="win-tile">O<sub>4</sub></span>
                                    <span class="win-tile" id="tut6-o-max">O<sub>6</sub></span>
                                </div>
                                <span class="win-sub-label" id="tut6-o-sub">Max Subscript: <strong>6</strong></span>
                            </div>
                        </div>
                        <div class="tut-tag-banner">
                            <span id="tut-banner-5" class="tag-entangled">Analyzing Simultaneous 3-in-a-Row Lines...</span>
                        </div>
                        <div class="tut-action-bar">
                            <button id="tut-sim-btn-5" class="btn-replay-anim">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                                <span>Replay Tiebreaker Analysis</span>
                            </button>
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
                    `,
                    runAnimation: (tut) => {
                        const lineX = document.getElementById('tut6-line-x');
                        const lineO = document.getElementById('tut6-line-o');
                        const xMax = document.getElementById('tut6-x-max');
                        const oMax = document.getElementById('tut6-o-max');
                        const banner = document.getElementById('tut-banner-5');
                        if (!lineX || !lineO || !xMax || !oMax) return;

                        // Reset
                        lineX.classList.remove('win-celebrate-aura');
                        xMax.style.transform = '';
                        oMax.style.transform = '';
                        if (banner) {
                            banner.className = 'tag-entangled';
                            banner.textContent = 'Comparing completed lines: Player X (max: 5) vs Player O (max: 6)...';
                        }

                        // Step 1: Highlight X's max subscript
                        tut.addTimer(() => {
                            xMax.style.transform = 'scale(1.25)';
                            xMax.style.boxShadow = '0 0 10px rgba(37, 99, 235, 0.5)';
                            if (tut.sound) tut.sound.playPlace();
                        }, 400);

                        // Step 2: Highlight O's max subscript
                        tut.addTimer(() => {
                            oMax.style.transform = 'scale(1.25)';
                            oMax.style.boxShadow = '0 0 10px rgba(225, 29, 72, 0.5)';
                            if (tut.sound) tut.sound.playPlace();
                        }, 1000);

                        // Step 3: Announce Player X Winner by earlier time
                        tut.addTimer(() => {
                            lineX.classList.add('win-celebrate-aura');
                            if (tut.sound) tut.sound.playWin();
                            if (banner) {
                                banner.className = 'tag-success';
                                banner.textContent = '🏆 WINNER: Player X (5 < 6: Completed Earlier in Time!) +1.0 pt';
                            }
                        }, 1700);
                    }
                };

            default:
                return { title: "", visualHtml: "", textHtml: "" };
        }
    }
}
