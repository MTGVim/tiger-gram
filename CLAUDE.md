# CLAUDE.md

# Web Logic Puzzle Platform
Version: 6.0
Games: Nonogram + Sudoku
Platform: Web / Mobile Web / PWA
Storage: Local-first (IndexedDB + localStorage)
Monetization: None

---

# 1. PRODUCT VISION

Build a deterministic, skill-based puzzle platform:

- Zero guessing
- Fully solver-verified
- Competitive streak system
- Advanced difficulty modeling
- High-performance mobile UX
- Offline-first architecture

---

# 2. RELEASE-LEVEL POLISH (A)

## UX Micro-Polish

```json
{
  "ux_enhancements": {
    "cell_feedback": {
      "press_scale_animation": true,
      "conflict_shake": true,
      "soft_vibration_mobile": true
    },
    "completion_animation": {
      "board_wave_reveal": true,
      "confetti_lightweight": true
    },
    "hint_completion_color_transition": true,
    "dark_mode": true,
    "adaptive_font_scaling": true
  }
}
```

## Perceived Performance

```json
{
  "performance_polish": {
    "optimistic_ui_updates": true,
    "validation_debounced_ms": 8,
    "lazy_board_render": true,
    "web_worker_generators": true
  }
}
```

---

# 3. ADVANCED NONOGRAM SOLVER (B)

## Multi-Layer Deduction Engine

```json
{
  "nonogram_solver_levels": [
    "single_line_overlap",
    "boundary_fill",
    "block_push",
    "cross_line_constraint",
    "contradiction_propagation",
    "recursive_assumption_limited"
  ]
}
```

## Solve Simulation for Difficulty

```json
{
  "solve_simulation": {
    "track_steps": true,
    "record_logic_depth": true,
    "count_forced_moves": true,
    "measure_backtracking_usage": true
  }
}
```

Difficulty determined by:

```json
{
  "difficulty_model": {
    "easy": "no recursion required",
    "medium": "minor cross constraints",
    "hard": "deep multi-line deduction",
    "expert": "recursive reasoning required"
  }
}
```

---

# 4. IMAGE → NONOGRAM AUTO BALANCER (B+)

After image conversion:

```json
{
  "auto_balance": {
    "adjust_threshold_until_solvable": true,
    "auto_reduce_noise": true,
    "ensure_minimum_forced_moves": true,
    "reject_if_solver_depth_exceeds_limit": true
  }
}
```

Goal:
- Avoid impossible puzzles
- Avoid trivial puzzles
- Produce balanced difficulty

---

# 5. SUDOKU ADVANCED DIFFICULTY ENGINE (B)

Track solving techniques used during simulation:

```json
{
  "technique_tracking": [
    "naked_single",
    "hidden_single",
    "naked_pair",
    "hidden_pair",
    "box_line_reduction",
    "x_wing",
    "swordfish"
  ]
}
```

Difficulty mapping:

```json
{
  "difficulty_classification": {
    "easy": ["naked_single"],
    "medium": ["hidden_single"],
    "hard": ["naked_pair", "hidden_pair"],
    "expert": ["x_wing", "swordfish"]
  }
}
```

---

# 6. STREAK + RANKING SYSTEM (D)

## Philosophy

Reward skill.
No luck.
Loss breaks streak only if logical error made.

---

## Streak Model

```json
{
  "streak_system": {
    "track_per_game": true,
    "break_condition": "mistake_limit_exceeded OR puzzle_abandoned",
    "daily_streak": true,
    "best_streak_recorded": true
  }
}
```

---

## Skill Rating (ELO-Like)

```json
{
  "rating_system": {
    "base_rating": 1000,
    "rating_change_formula": "K * (actual - expected)",
    "difficulty_weighted": true,
    "speed_modifier": true
  }
}
```

Expected score:

```
expected = 1 / (1 + 10^((puzzle_difficulty - player_rating)/400))
```

---

## Performance Score Formula

```json
{
  "performance_score": {
    "base": 100,
    "time_penalty": "log(seconds)",
    "mistake_penalty": 20,
    "difficulty_multiplier": 1.5
  }
}
```

---

# 7. LEADERBOARD (LOCAL)

```json
{
  "leaderboard": {
    "type": "local_only",
    "categories": [
      "fastest_time",
      "highest_streak",
      "highest_rating"
    ],
    "separate_by_game": true
  }
}
```

---

# 8. HIGH-PERFORMANCE ARCHITECTURE (A+B)

```json
{
  "performance_engine": {
    "render_strategy": "canvas_for_large_boards",
    "batch_state_updates": true,
    "memoized_selectors": true,
    "generator_threading": "web_worker",
    "large_dataset_storage": "IndexedDB"
  }
}
```

---

# 9. IMAGE PROCESSING (RECAP)

```json
{
  "image_pipeline": [
    "resize",
    "grayscale",
    "adaptive_threshold",
    "dither_optional",
    "morphology_cleanup",
    "solver_verify",
    "difficulty_classify"
  ]
}
```

---

# 10. OFFLINE STRATEGY

```json
{
  "pwa": {
    "cache_strategy": "cache_first",
    "runtime": "stale_while_revalidate",
    "generator_available_offline": true
  }
}
```

---

# 11. PLAYER PROGRESSION SYSTEM

```json
{
  "progression": {
    "unlock_by_rating": true,
    "unlock_by_completed_count": true,
    "expert_mode_hidden_initially": true
  }
}
```

---

# 12. COMPLETION FLOW (UPGRADED)

```json
[
  "stop_timer",
  "calculate_performance_score",
  "update_rating",
  "update_streak",
  "update_statistics",
  "animate_victory"
]
```

---

# 13. SYSTEM GUARANTEES

- All puzzles solver-verified
- No random guessing required
- Difficulty algorithmically measured
- Generators non-blocking
- UI 60fps target
- Fully offline playable
- Skill-based streak & rating system

---

# FINAL STATE

Platform now includes:

- Nonogram (manual + generator + image conversion)
- Sudoku (unique generator + advanced rating)
- Multi-level solvers
- Difficulty simulation engine
- Skill-based ELO rating
- Streak system
- Local leaderboard
- Daily puzzle
- Offline PWA
- Release-level polish
- High-performance architecture

This is no longer a toy project.
This is a full deterministic puzzle platform.

---

# BRAND SPEC

App Name: tigoku-gram

Meaning:
- "tigoku" inspired by "지옥" (hell difficulty)
- "gram" from Nonogram
- Suggests hardcore deterministic logic puzzle platform

Tagline Options:
- "Pure Logic. No Luck."
- "Skill Over Chance."
- "No Guessing Allowed."
- "Welcome to Logic Hell."

Tone:
- Sharp
- Minimal
- Skill-driven
- Slightly hardcore

Visual Identity:

Primary Colors:
- Background: #0F0F14
- Accent: #FF3B3B (inferno red)
- Secondary Accent: #FFD166 (logic highlight)
- Success: #4CAF50
- Conflict/Error: #FF3B3B

Typography:
- Bold geometric sans-serif
- Monospaced numerals for timers
- Tight letter spacing

Icon Concept:
- Minimal square grid
- One filled red cell glowing
- Subtle flame corner accent

---

# TIGOKU-GRAM MODES

```json
{
  "modes": {
    "standard": {
      "mistake_limit": null,
      "rating_enabled": true
    },
    "hell_mode": {
      "mistake_limit": 1,
      "timer_visible": true,
      "rating_multiplier": 1.5
    },
    "zen_mode": {
      "mistake_limit": null,
      "timer_visible": false,
      "rating_enabled": false
    }
  }
}
```

---

# TIGOKU RATING TITLE SYSTEM

```json
{
  "titles": [
    { "min_rating": 800, "title": "Novice" },
    { "min_rating": 1000, "title": "Solver" },
    { "min_rating": 1200, "title": "Strategist" },
    { "min_rating": 1400, "title": "Logician" },
    { "min_rating": 1600, "title": "Infernal Mind" },
    { "min_rating": 1800, "title": "Tigoku Master" }
  ]
}
```

---

# COMPETITIVE PHILOSOPHY

- No RNG in puzzles.
- Loss only caused by player mistake.
- Rating reflects real logical capability.
- Difficulty mathematically classified.
- Image-generated puzzles still solver-verified.

---

# FUTURE EXPANSION RESERVED

- 30x30 Inferno Boards
- Weekly Hardcore Challenge
- Time Attack Mode
- Ranked Ladder Season Reset
- Custom Puzzle Sharing (offline QR export)

---

END BRAND SPEC


---

# NONOGRAM SIZE TIER POLICY (IMPLEMENTED)

Based on gameplay onboarding guidance:

- Easy: around 10x10 (current implementation default: 10x10)
- Medium: around 15x15 (current implementation default: 15x15)
- Hard: around 20x20 (current implementation default: 20x20)
- Expert: 25x25 or larger (current implementation default: 25x25)

Notes:
- Board size tier and logic difficulty classification are tracked separately.
- Logic difficulty remains solver-metric based.
