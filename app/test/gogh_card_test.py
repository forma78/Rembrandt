"""GOGH's brush in rembrandt.py (2026-11-23, the owner: "with the repainting — I just need orange indicators — this is v.1.2.9"): a card's dabs given other jars
of its own, the card's file written again — nothing added, nothing lost, not while a run is on; in a temporary folder.

    cd app && python3 -m unittest discover -s test -p '*_test.py'
"""
import base64
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from rembrandt import gogh_card_edit  # noqa: E402

JPG = "data:image/jpeg;base64," + base64.b64encode(b"\xff\xd8\xff\xe0 a jpg \xff\xd9").decode()
CARD = {"id": "porsche-led-20-4", "title": "Porsche", "w": 200, "h": 200, "pitch": 2, "kind": "dabs", "dab": {"seed": 6},
        "jars": [{"id": "l1", "name": "C2", "hex": "#DCBDBB", "coats": 1, "cells": [{"n": 1, "legs": [[10, 150, 138]]}, {"n": 2, "legs": [[14, 150, 144]]}]},
                 {"id": "l6", "name": "C15", "hex": "#BC3E12", "coats": 1, "cells": [{"n": 1, "legs": [[18, 150, 138]]}]},
                 {"id": "l9", "name": "C9", "hex": "#9F0303", "coats": 1, "cells": [{"n": 1, "legs": [[22, 150, 144]]}]}]}


class GoghCardTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.cards = self.tmp.name
        with open(os.path.join(self.cards, "porsche-led-20-4.json"), "w") as f:
            json.dump(CARD, f)

    def tearDown(self):
        self.tmp.cleanup()

    def read(self):
        with open(os.path.join(self.cards, "porsche-led-20-4.json")) as f:
            return json.load(f)

    def test_a_dab_into_another_jar(self):
        jars = [{"id": "l1", "cells": [{"legs": [[10, 150, 138]]}]}, {"id": "l6", "cells": [{"legs": [[18, 150, 138]]}, {"legs": [[14, 150, 144]]}]}, {"id": "l9", "cells": [{"legs": [[22, 150, 144]]}]}]
        out = gogh_card_edit({"id": "porsche-led-20-4", "jars": jars, "jpg": JPG}, cards=self.cards)
        self.assertTrue(out["ok"]); self.assertEqual(out["dabs"], 4)
        card = self.read()
        self.assertEqual([j["id"] for j in card["jars"]], ["l1", "l6", "l9"], "the card's own order")
        self.assertEqual(card["jars"][1]["cells"], [{"n": 1, "legs": [[18, 150, 138]]}, {"n": 2, "legs": [[14, 150, 144]]}])
        self.assertEqual(card["jars"][1]["hex"], "#BC3E12", "every jar as it was but its cells")
        self.assertEqual(card["dab"], {"seed": 6}); self.assertEqual(card["title"], "Porsche")
        self.assertTrue(os.path.exists(os.path.join(self.cards, "porsche-led-20-4.jpg")))

    def test_a_jar_left_with_no_dab_goes(self):
        jars = [{"id": "l1", "cells": [{"legs": [[10, 150, 138]]}, {"legs": [[14, 150, 144]]}]}, {"id": "l6", "cells": [{"legs": [[18, 150, 138]]}, {"legs": [[22, 150, 144]]}]}, {"id": "l9", "cells": []}]
        gogh_card_edit({"id": "porsche-led-20-4", "jars": jars}, cards=self.cards)
        self.assertEqual([j["id"] for j in self.read()["jars"]], ["l1", "l6"])

    def test_a_jar_added(self):
        jars = [{"id": "l1", "cells": [{"legs": [[10, 150, 138]]}, {"legs": [[14, 150, 144]]}]}, {"id": "l6", "cells": [{"legs": [[18, 150, 138]]}]},
                {"id": "l9", "cells": []}, {"id": "a1", "name": "Jar 3", "hex": "#a9aaa8", "cells": [{"legs": [[22, 150, 144]]}]}]
        gogh_card_edit({"id": "porsche-led-20-4", "jars": jars}, cards=self.cards)
        card = self.read()
        self.assertEqual([j["id"] for j in card["jars"]], ["l1", "l6", "a1"], "the added jar after the card's own, l9 left with none out")
        self.assertEqual(card["jars"][2], {"id": "a1", "name": "Jar 3", "code": "", "hex": "#A9AAA8", "coats": 1, "cells": [{"n": 1, "legs": [[22, 150, 144]]}]})
        for bad in [{"id": "a1", "name": "Jar 3", "hex": "grey"}, {"id": "zz", "name": "Jar 3", "hex": "#A9AAA8"}, {"id": "a1", "hex": "#A9AAA8"}]:
            with self.assertRaises(ValueError):
                gogh_card_edit({"id": "porsche-led-20-4", "jars": [*jars[:3], {**bad, "cells": [{"legs": [[22, 150, 144]]}]}]}, cards=self.cards)

    def test_a_background(self):
        same = [{"id": j["id"], "cells": j["cells"]} for j in CARD["jars"]]
        g1 = {"id": "g1", "name": "C2", "hex": "#dcbdbb", "ground": True, "of": "l1", "cells": [{"legs": [[50, 30, 18], [50, 18, 6]]}]}
        out = gogh_card_edit({"id": "porsche-led-20-4", "jars": [g1, *same], "jpg": JPG}, cards=self.cards)
        self.assertEqual(out["dabs"], 6)
        card = self.read()
        self.assertEqual([j["id"] for j in card["jars"]], ["g1", "l1", "l6", "l9"], "before the figure's jars")
        self.assertEqual(card["jars"][0], {"id": "g1", "name": "C2", "code": "", "hex": "#DCBDBB", "coats": 1, "under": True, "ground": True, "of": "l1", "cells": [{"n": 1, "legs": [[50, 30, 18], [50, 18, 6]]}]})
        # its dabs its own: another stroke, less of it, a second colour, none — the figure's the same
        gogh_card_edit({"id": "porsche-led-20-4", "jars": [{"id": "g1", "cells": [{"legs": [[50, 30, 18]]}]}, {"id": "g2", "name": "Jar 3", "hex": "#A9AAA8", "ground": True, "cells": [{"legs": [[54, 40, 28]]}]}, *same]}, cards=self.cards)
        self.assertEqual([(j["id"], len(j["cells"])) for j in self.read()["jars"]][:2], [("g2", 1), ("g1", 1)])
        with self.assertRaises(ValueError, msg="the figure's dab lost beside a background"):
            gogh_card_edit({"id": "porsche-led-20-4", "jars": [{"id": "g1", "cells": [{"legs": [[50, 30, 18]]}]}, {"id": "g2", "cells": []}, *same[:2]]}, cards=self.cards)
        for legs, why in [([[50, 230, 218]], "off the canvas"), ([[50, 60, 10]], "too long"), ([[50, 18, 30]], "upside down"), ([[50, 30, 18], [50, 30, 18]], "twice")]:
            with self.assertRaises(ValueError, msg=why):
                gogh_card_edit({"id": "porsche-led-20-4", "jars": [{"id": "g1", "cells": [{"legs": legs}]}, {"id": "g2", "cells": []}, *same]}, cards=self.cards)
        for bad in [{"id": "g3", "name": "C2", "hex": "#DCBDBB"}, {"id": "g3", "ground": True, "hex": "#DCBDBB"}, {"id": "x3", "ground": True, "name": "C2", "hex": "#DCBDBB"}]:
            with self.assertRaises(ValueError, msg="not a background's line"):
                gogh_card_edit({"id": "porsche-led-20-4", "jars": [{**bad, "cells": [{"legs": [[60, 30, 18]]}]}, {"id": "g1", "cells": []}, {"id": "g2", "cells": []}, *same]}, cards=self.cards)
        gogh_card_edit({"id": "porsche-led-20-4", "jars": [{"id": "g1", "cells": []}, {"id": "g2", "cells": []}, *same]}, cards=self.cards)
        self.assertEqual(self.read()["jars"], CARD["jars"], "all of it taken away: the card as it was")

    def test_refused(self):
        same = [{"id": j["id"], "cells": j["cells"]} for j in CARD["jars"]]
        for body, why in [({"id": "porsche-led-20-4", "jars": same[:2]}, "a dab lost"),
                          ({"id": "porsche-led-20-4", "jars": same + [{"id": "l9", "cells": []}]}, "a jar twice"),
                          ({"id": "porsche-led-20-4", "jars": [*same[:2], {"id": "l9", "cells": [{"legs": [[22, 150, 144]]}, {"legs": [[30, 150, 144]]}]}]}, "a dab added"),
                          ({"id": "porsche-led-20-4", "jars": [*same[:2], {"id": "zz", "cells": same[2]["cells"]}]}, "a jar not its own"),
                          ({"id": "../x", "jars": same}, "not an id")]:
            with self.assertRaises(ValueError, msg=why):
                gogh_card_edit(body, cards=self.cards)
        with self.assertRaises(ValueError):
            gogh_card_edit({"id": "porsche-led-20-4", "jars": same}, cards=self.cards, live=True)
        self.assertEqual(self.read(), CARD, "the card untouched")


if __name__ == "__main__":
    unittest.main()
