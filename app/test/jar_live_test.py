"""ELBOW LIVE · JAR on rembrandt.py (2026-11-22, the night; the owner: "not only the press on the canvas, but the moment the brush dips in the jar"):
the elbow's angle in the paint from the next dip on, within his +14 … +16° — no board.

    cd app && python3 -m unittest discover -s test -p '*_test.py'
"""
import os
import sys
import threading
import unittest
from types import SimpleNamespace

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from rembrandt import PAINT_FLOOR, PAINT_TOP, Runner  # noqa: E402


class JarLiveTest(unittest.TestCase):
    def runner(self, jar=None):
        return SimpleNamespace(jar=jar, lock=threading.Lock(), block=7, logged=[], log=None)

    def test_set_within_his_fork_by_half_degrees(self):
        r = self.runner()
        r.log = r.logged.append
        self.assertEqual((PAINT_FLOOR, PAINT_TOP), (14, 20), "his fork, +20 on top since 2026-11-22: 'a little higher'")
        self.assertEqual(Runner.set_jar(r, "15.3"), 15.5)
        self.assertEqual(Runner.set_jar(r, 9), 14, "never lower than his floor")
        self.assertEqual(Runner.set_jar(r, 30), 20)
        self.assertEqual(r.logged[-1], {"event": "jar", "deg": 20, "block": 7})
        with self.assertRaises(ValueError):
            Runner.set_jar(r, "nan")

    def test_the_paint_block_alone_takes_it(self):
        dip = {"kind": "arm", "cmd": "J 2 15 70", "fork": [14, 16], "paint": True}
        up = {"kind": "arm", "cmd": "J 2 32.5 70", "fork": [30, 35]}
        self.assertEqual(Runner._jar_block(self.runner(), dip), ("J 2 15 70", [14, 16]), "none set: the plan's")
        self.assertEqual(Runner._jar_block(self.runner(14.5), dip), ("J 2 14.5 70", (14, 15.5)))
        self.assertEqual(Runner._jar_block(self.runner(16), {**dip, "cmd": "J 2 15"}), ("J 2 16", (15, 17)))
        self.assertEqual(Runner._jar_block(self.runner(20), dip), ("J 2 20 70", (19, 20)))
        self.assertEqual(Runner._jar_block(self.runner(14), up), ("J 2 32.5 70", [30, 35]), "the elbow up: its own")


if __name__ == "__main__":
    unittest.main()
