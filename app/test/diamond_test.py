"""💎 on rembrandt.py (2026-11-22, the night; the owner: "by every picture a place as an NFT, with such an icon 💎 … painted two or three times, they are
simply added: 💎💎💎"): a canvas finished, its passport from the journal — in a temporary folder and a journal of its own.

    cd app && python3 -m unittest discover -s test -p '*_test.py'
"""
import json
import os
import sys
import tempfile
import time
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from rembrandt import gogh_diamond_add, gogh_diamond_delete, gogh_diamonds, gogh_passport  # noqa: E402

LOG = [
    {"at": "2026-11-22 18:35:52", "event": "start", "tab": "gogh", "pass": "test", "settings": {"pic": "bear"}},
    {"at": "2026-11-22 18:35:56", "event": "dip", "colour": None},
    {"at": "2026-11-22 18:36:21", "event": "done"},
    {"at": "2026-11-22 19:04:36", "event": "start", "tab": "gogh", "pass": "drag", "settings": {"pic": "bear"}},
    {"at": "2026-11-22 19:04:38", "event": "dip", "colour": "Jar 1"},
    {"at": "2026-11-22 19:04:48", "event": "near", "joint": "shoulder", "at_": 0.6},
    {"at": 0.6, "event": "near"},
    {"at": "2026-11-22 19:04:58", "event": "dip", "colour": "C2"},
    {"at": "2026-11-22 19:05:36", "event": "stopped"},
    {"at": "2026-11-22 19:06:00", "event": "start", "tab": "formg", "pass": "drag", "settings": {"pic": "bear"}},
    {"at": "2026-11-22 19:06:05", "event": "dip", "colour": "Jar 99"},
    {"at": "2026-11-22 19:07:00", "event": "done"},
    {"at": "2026-11-22 20:00:00", "event": "start", "tab": "gogh", "pass": "drag", "settings": {"pic": "bear"}},
    {"at": "2026-11-22 20:00:02", "event": "dip", "colour": "C2"},
    {"at": "2026-11-22 20:00:12", "event": "dip", "colour": "Jar 5"},
    {"at": "2026-11-22 20:01:00", "event": "done"},
]


class DiamondTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.cards = self.tmp.name
        self.log = os.path.join(self.cards, "runs.jsonl")
        with open(self.log, "w") as f:
            f.write("".join(json.dumps(e) + "\n" for e in LOG) + "not json\n")
        open(os.path.join(self.cards, "bear.json"), "w").write("{}")

    def tearDown(self):
        self.tmp.cleanup()

    def test_the_passport_gogh_drags_of_the_picture_alone(self):
        p = gogh_passport("bear", log=self.log)
        self.assertEqual(p, {"from": "2026-11-22 19:04:36", "to": "2026-11-22 20:01:00", "runs": 2, "dabs": 4, "jars": ["Jar 1", "C2", "Jar 5"], "seconds": 60 + 60})
        self.assertEqual(gogh_passport("bear", since="2026-11-22 19:30:00", log=self.log)["dabs"], 2, "since the last 💎 alone")

    def test_added_numbered_taken_away(self):
        a = gogh_diamond_add("bear", cards=self.cards, log=self.log, now=time.mktime(time.strptime("2026-11-22 21:00:00", "%Y-%m-%d %H:%M:%S")))
        self.assertEqual((a["n"], a["dabs"], a["runs"]), (1, 4, 2))
        b = gogh_diamond_add("bear", cards=self.cards, log=self.log)
        self.assertEqual((b["n"], b["dabs"], b["runs"]), (2, 0, 0), "a second canvas: only the runs after the first 💎")
        self.assertEqual([g["n"] for g in gogh_diamonds(os.path.join(self.cards, "diamonds.json"))["bear"]], [1, 2])
        self.assertTrue(gogh_diamond_delete("bear", 1, cards=self.cards))
        self.assertEqual([g["n"] for g in gogh_diamonds(os.path.join(self.cards, "diamonds.json"))["bear"]], [1])
        self.assertFalse(gogh_diamond_delete("bear", 5, cards=self.cards))
        self.assertTrue(gogh_diamond_delete("bear", 1, cards=self.cards))
        self.assertEqual(gogh_diamonds(os.path.join(self.cards, "diamonds.json")), {})
        with self.assertRaises(ValueError):
            gogh_diamond_add("nope", cards=self.cards, log=self.log)
        with self.assertRaises(ValueError):
            gogh_diamond_add("../bear", cards=self.cards, log=self.log)


if __name__ == "__main__":
    unittest.main()
