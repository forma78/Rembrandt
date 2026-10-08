# The paper test, 2026-10-08

The owner painted the machine's run by hand on an A5 page of his notebook in black and white acrylic, "repeating the brush's way with absolute precision". He did it because the simulation of the time stepped two lanes at a time where a pipe crossed itself ("they go in twos; it must be one"). These photographs are the reference for **Whole lanes, Master Flo** in `../ALU.md`. The prototype's **Paper test, 8 Oct** key loads the same run at 1 : 1 on a 148 × 210 page.

| Photo | What it shows |
|---|---|
| `01_plan_pencil_lanes_numbered.jpg` | The plan in pencil. Eight lanes come in from the left, turn up into a loop and come down across themselves. Lanes are numbered **1 on the outside of the turn, 8 on the inside**. |
| `02_marks_black_white.jpg` | The marks squeezed across the whole band before the run: black twice on the way in and once at the start of the turn, white four times round the loop (radial there), once just above the crossing and twice below it. |
| `03_lane8_way_in.jpg` | Lane 8 (the inside one) first, from the left start, through the black marks. |
| `04_lane8_round_the_turn.jpg` | Lane 8 round the turn into the loop. |
| `05_lane8_down_across_itself.jpg` | Lane 8 coming down across its own way in, grey from the white marks, to the end. |
| `06_lane7_through_the_turn.jpg` | Lane 7, again from the left start. The brush was not washed: it starts with what it carried out of lane 8. |
| `07_lane7_down_across.jpg` | Lane 7 coming down across the band. |
| `08_progress.jpg` … `12_progress.jpg` | The lanes added one by one, 8 → 1, each the whole way in one run, the brush lifting at the end and going back to the start in the air. |
| `13_finished.jpg` | All eight lanes. |
| `14_crossing_close_up.jpg` | The crossing: one lane per step. A lane coming down lies over the lanes of the way in that were painted before it and under the ones painted after it. |
| `15_paper_vs_rembrandt_result.jpg` | The finished page beside the prototype's Result of the same run. |

What the photographs fix, for the code and its tests:

- Every lane runs the whole pipe in one run, always the same way, the inside lane first: `n … 1`.
- Where the band crosses itself, lane `k` lies over the crossing lanes `j > k` and under `j ≤ k`, its own included: one lane per step, never two.
- A lane coming down through the crossing loads the wet black it passes over. Lane 1 crosses eight wet rows and comes out black; lane 8 crosses one and stays light.
- The brush is not washed between lanes: white at the left ends of lanes 7 … 1.
- White lightens black only step by step, mark after mark, round the loop; black takes over a white brush at once.
