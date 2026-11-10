#!/usr/bin/env python3
"""FORM-G: the red classic 911 on 70 × 100, v.2 Kuzya — redcar.py's RedCar, its form, target and kept jars the same, and Kuzya's audit
(FORM-G/Rembrandt_FORM-G_GT_Color_Tone_Audit_2026-11-10.pdf, p. 5, written for the GT) laid on it as on the GT's face (racecark.py); the owner, 2026-11-11:
"can what Kuzya wrote be applied to the classic Porsche, 100 × 70? Maybe make a v.2 to compare?" — a card of its own, the first kept as it is (he paints it).

  B  no hue apart between the columns on the red body (JIT 0 there);
  C  a cut's cost by the form: dear where the body's light is flat, cheap where it turns;
  D  jars whose dried legs the brush model cannot tell apart (dE under MERGE_DE) one: of the classic's 49, 23 are steps of red alone (#RR0D0D, the audit).
The glossy colour of the GT's face (racecar.py's VOLUME, GLOSS) not: it was not the audit's, and the classic's light is the owner's canon."""
import numpy as np
from scipy import ndimage as ndi
from distance_core import to_lab
from redcar import RedCar, main
from racecar import RaceFace
from racecark import RaceFaceK


class RedCarK(RedCar):
    JIT_BODY = 0
    SURFACE = RaceFaceK.SURFACE
    MERGE_DE = RaceFaceK.MERGE_DE
    SLOPE_MM = RaceFace.SLOPE_MM

    def make_target(self):
        T = super().make_target()
        self.cut = self.key                                                      # RedCar's key cuts its columns and gates its carry both
        Lb = to_lab(T)[..., 0]
        w = self.body.astype(np.float32)
        sm = ndi.gaussian_filter1d(Lb * w, self.SLOPE_MM, axis=0) / np.maximum(ndi.gaussian_filter1d(w, self.SLOPE_MM, axis=0), 1e-3)
        self.slope = np.where(self.body, np.abs(np.gradient(sm, axis=0)), 0.0)
        return T

    plan = RaceFace.plan                                                         # the GT's planner: B and C as switches on it
    merge = RaceFaceK.merge

    def prune(self):
        """hyper2's prune; when it has nothing more to take out, D"""
        d = RedCar.prune(self)
        return d if d else self.merge()


if __name__ == '__main__':
    main(RedCarK, 'porsche-red-k.jpg')
