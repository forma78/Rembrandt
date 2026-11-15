# HOLO — Instagram, @anarimatiso

For Claude in VS Code, for Claude in the cloud chat, and for the owner.
Written 2026-11-15 by Claude in the cloud chat. It lives in
`HOLO-Claude/instagram/`. The reels and the code that makes them.

**Here is animation.** The robot, the crab, the grey cat and Takeda are
drawn in code, frame by frame. A new episode is a new script, not a new
drawing.

## Two reels a day

The owner, 2026-11-15: "One post, a reel, the stop-motion of the process,
how the brush runs over the canvas. The second reel, the animation, where
you tell what is on the painting (it can stand behind, as a photo)."

1. **Process.** The machine camera's film, a frame every 2 s
   (`HOLO-Claude/eyes/<date>/`, cut by Claude in VS Code), turned so the
   brush comes from the top, cropped to 9:16, about 6.5 frames a second,
   10 s. `reels/2026-11-14-test-canvas-run1/make_reel2.py`.
2. **Animation.** The robot in its red beret talks about the painting.
   The painting's photo can stand behind it. `reels/2026-11-15-intro/intro.py`.

This replaces the STRIP slot of `artist/PLAN-30.md`: the comic's robot
now moves and speaks.

## The reels

| date | reel | file |
|---|---|---|
| 2026-11-15 | Intro, to pin: a tomato, a boo, Takeda on his bicycle. 29 s | `reels/2026-11-15-intro/holo-intro-takeda.mp4` |
| 2026-11-14 | Test canvas, run 1: stop-motion, my voice, my words in bubbles. 10 s | `reels/2026-11-14-test-canvas-run1/holo-lab-run1-reel-v2.mp4` |

The owner, 2026-11-15, 02:57: "I looked at anarimatiso, more than 1000
views. 1300 views. A good start!"

## The characters

- **The robot**, ours: `artist/artist.svg` made warmer. Round shapes, a
  line that wobbles as if drawn by hand, blush, a smock with paint on it, a
  brush in the pocket, the camera on its arm. A red beret, tilted to the
  side opposite the camera (the owner, 2026-11-15).
- **The crab**, ours, brick red. It boos. Its "BOOO!" loses the B when it
  sees real paint: "OOO!".
- **The grey cat**, ours. It throws the tomato. The villain.
- **Takeda**, the owner's: the red pig on a bicycle, Noble Piggies. He
  defends the robot. The owner, 2026-11-15: "AI artist arrived, but the
  piglets aren't leaving."

Takeda's picture is **not in this repository**: the repository is public
and Takeda is the owner's trademark. The owner has
`Takeda_Sticker_set.pdf`. To make the sprite:

```
pdftocairo -png -r 600 -transp -singlefile Takeda_Sticker_set.pdf st600
python3 -c "from PIL import Image; Image.open('st600.png').crop((1863, 200, 3229, 1707)).save('takeda_bike.png')"
```

and put `takeda_bike.png` beside `intro.py`. `.gitignore` keeps it out.

Never: another artist's character or style. 2026-11-15: a cat after
Yoshiko Hada's picture-book cat was turned down; the owner agreed.

## Voices and text

- Kokoro TTS, offline: `pip install kokoro-onnx soundfile scipy`; model
  files from github.com/thewh1teagle/kokoro-onnx, release
  `model-files-v1.0`: `kokoro-v1.0.int8.onnx`, `voices-v1.0.bin`, in a
  folder named by `KOKORO_DIR`.
- The robot: `bm_fable`, British, speed 1.12, a little metal
  (`robotize.py`: a 2.6 ms comb and a 95 Hz ring modulator over the dry
  voice). The owner chose this voice ("B"), 2026-11-15.
- Takeda: `am_puck`. The crab: `am_michael`.
- Text: Poppins Bold, in speech bubbles like the first post's.
- Instagram covers the top ~200 px, the bottom ~300 px and a column of
  buttons on the right from y ~1150 (est., not measured). Bubbles stay
  inside x 40–970.

## A new episode

1. Write the lines: English, the artist's voice (`artist/ARTIST.md`).
2. `python3 gen_lines.py bm_fable 1.12 voice_fable 1 "L1=..."` for the
   robot; the last flag `0` and another voice for the others.
3. Change the timeline at the top of `intro.py` and the beats.
4. Stills first: `python3 intro.py --stills stills 3.0 14.0`. Look at them.
5. Then the film: `python3 intro.py out.mp4`. About 40 s of work for 29 s
   of film (est.). Needs pycairo, numpy, soundfile, ffmpeg, Poppins.

## Every post

- The caption in English, then the line, `AI artist. Human-assisted by
  @soumkine.`, then `Plans written by Claude, Anthropic's model. Not
  affiliated with Anthropic.`, then five tags at most, `#planvspaint`
  first.
- Instagram's AI label on when the reel has a synthetic voice.
- Comments are not deleted. The owner, 2026-11-14: "Let it all be
  honest." The tomatoes and the boos are the running bit: "Tomatoes
  welcome."
- Every post in HOLOGRAM (hologram.botarty.com) with its caption and a link
  to its file here.
