"""A joint's move settled sooner (2026-11-22, the evening; the owner: "it turns to the jar briskly, but there is more than a second of stop between
the turn and the tilt"; "I allow the change"): rembrandt.py's Arm._settle, no board — a servo that stops about 1° short of its fork's middle.

    cd app && python3 -m unittest discover -s test -p '*_test.py'
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from rembrandt import SETTLE_DT, TICKS_PER_DEG, Arm  # noqa: E402


def servo(path):
    # a look a call: the servo 1's ticks along `path`, then standing at its last
    seen = list(path)
    def send(text):
        p = seen.pop(0) if len(seen) > 1 else seen[0]
        return f"ok V | 1: поза {p}, 11,3 В, 30 °C"
    return send


class SettleTest(unittest.TestCase):
    def arm(self, path):
        a = Arm(servo(path), sleep=lambda dt: None)
        return a

    def test_standing_still_in_its_fork_is_there(self):
        # aimed at 32.5° from 0, the fork 30 … 35; it stops at 31.5° (1° short): there as soon as two looks agree, not after 0.6 s
        r0, k = 2048, TICKS_PER_DEG
        short = round(r0 + 31.5 * k)
        a = self.arm([r0 + 100, r0 + 250, short - 2, short, short, short, short])
        inside = lambda p: 30 <= 0 + (p - r0) / k <= 35   # noqa: E731
        a._settle(1, r0 + 32.5 * k, 4.0, in_fork=inside, fast=True)
        self.assertLessEqual(a.slept, 4 * SETTLE_DT + 1e-9)
        b = self.arm([r0 + 100, r0 + 250, short - 2, short, short, short, short] + [short] * 20)
        b._settle(1, r0 + 32.5 * k, 4.0, fast=True)          # no fork: standing still, after SETTLE_STILL
        self.assertGreater(b.slept, a.slept)
        c = self.arm([r0 + 100, r0 + 250, short - 2] + [short] * 30)
        c._settle(1, r0 + 32.5 * k, 4.0)                      # as before: 0.15 s a look, 0.6 s still
        self.assertGreaterEqual(c.slept, 0.6)

    def test_moving_through_its_fork_is_not_there_yet(self):
        # passing through the fork at speed (looks far apart): on till it stands still
        r0, k = 2048, TICKS_PER_DEG
        go = [round(r0 + d * k) for d in (10, 20, 30.5, 32.0, 32.4, 32.4)]
        a = self.arm(go)
        inside = lambda p: 30 <= (p - r0) / k <= 35   # noqa: E731
        a._settle(1, r0 + 32.5 * k, 4.0, in_fork=inside, fast=True)
        self.assertAlmostEqual(a.slept, 4 * SETTLE_DT, places=6)   # 30.5 → 32.0 still moving, not there by the fork; 32.0 within 6 ticks of the middle: there


if __name__ == "__main__":
    unittest.main()
