"""A run's J at its own speed, the elbow's and the shoulder's to 220°/s (2026-11-22, the evening; the owner: "220 is the ceiling … test 70, then step by
step to 220"; "SHOULDER too") — rembrandt.py's checks, no board.

    cd app && python3 -m unittest discover -s test -p '*_test.py'
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from rembrandt import ARM_SPEED_MAX, arm_check, cup_of  # noqa: E402

HAND = {"hand": True, "up": [30, 35], "to": [30, 35], "dip": 15, "dwell": 1, "swing": 40}


class ArmSpeedTest(unittest.TestCase):
    def test_a_j_with_its_speed(self):
        self.assertEqual(ARM_SPEED_MAX, 220.0)
        for ok in ("J 2 32.5", "J 2 32.5 70", "J 2 15 220", "J 3 0", "W 2 12 180", "W 2 12 300"):
            self.assertIsNone(arm_check(ok), ok)               # W's own speed the firmware's to cap, as before
        for bad in ("J 2 32.5 230", "J 2 32.5 0", "J 2 32.5 -5", "J 2 32.5 nan", "J 1 10", "J 2 99"):
            self.assertIsNotNone(arm_check(bad), bad)

    def test_the_cup_at_hand_carries_the_elbow(self):
        self.assertNotIn("elbow", cup_of(HAND))
        self.assertEqual(cup_of({**HAND, "elbow": 70})["elbow"], 70.0)
        self.assertEqual(cup_of({**HAND, "swing": 220})["swing"], 220.0)
        self.assertIsNone(cup_of({**HAND, "swing": 221}))
        self.assertIsNone(cup_of({**HAND, "elbow": 0}))
        self.assertIsNone(cup_of({**HAND, "elbow": 400}))


if __name__ == "__main__":
    unittest.main()
