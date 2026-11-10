#!/usr/bin/env python3
"""FORM-G: the racing 911's face, v.2 Kuzya — racecar.py's RaceFace, its target, geometry and starting jars the same, and Kuzya's audit
(FORM-G/Rembrandt_FORM-G_GT_Color_Tone_Audit_2026-11-10.pdf, p. 5) laid on it; the owner, 2026-11-10: "honestly I do not quite see the problem between what we
have now and what Kuzya proposes. What if it gets worse? So it is safer to make v.2 Kuzya" — a card of its own, the first version kept as it is.

  B  no hue apart between the columns on the red body (JIT 0 there): smooth paint, not a painterly shimmer;
  C  a cut's cost by the form: dear where the body's light is flat (long legs, less grain), cheap where it turns (the cut where the form is);
  D  jars whose dried legs the brush model cannot tell apart (CIELAB dE under MERGE_DE) one jar: the one with the most line, or a fixed one, stays; "collapse nearly
     identical predicted dried colors, not merely identical hexes". The machine's motion as it was: the 5 mm grid, legs along X, the dips, the idle runs."""
import numpy as np
import hyper2 as H
from distance_core import to_lab
from redcar import main
from racecar import RaceFace


class RaceFaceK(RaceFace):
    JIT_BODY = 0
    SURFACE = (2800.0, 700.0, 0.4, 1.4)   # LAM on flat paint, LAM where the form turns; the slope from, to, L* a mm (the body's: median 0.36, 90 % 1.34) (est.)
    MERGE_DE = 2.5                         # dried legs closer than this one jar (est.)

    def prune(self):
        """hyper2's prune; when it has nothing more to take out, D: the jars the eye cannot tell apart after the brush, one"""
        d = super().prune()
        return d if d else self.merge()

    def merge(self):
        lens = np.zeros(self.pal.K)
        for c in range(self.N):
            col = self.grid[:, c]
            cuts = np.flatnonzero(np.diff(col)) + 1
            for a, b in zip(np.r_[0, cuts], np.r_[cuts, self.R]):
                if col[a] >= 0:
                    lens[col[a]] += (b - a) / 1000
        jars = self.pal.jars
        fixed = len(self.FIXED)
        dried = np.array([to_lab(H.leg_colour(p, 40.0).astype(np.float32)[None])[0] for p in jars])
        order = list(range(fixed)) + sorted(range(fixed, len(jars)), key=lambda k: -lens[k])
        keep = []
        for k in order:
            if k >= fixed and any(np.sqrt(((dried[k] - dried[q]) ** 2).sum()) < self.MERGE_DE for q in keep):
                continue
            keep.append(k)
        out = len(jars) - len(keep)
        if out:
            print('merged', out, 'jars the eye cannot tell apart after the brush', flush=True)
            self.use([jars[k] for k in sorted(keep)])
        return out


if __name__ == '__main__':
    main(RaceFaceK, 'porsche-race-k.jpg')
