"""GEN-V's APPROVE 🐾 in rembrandt.py (2026-11-22): the sketch into GOGH/, its card into GOGH's library — in temporary folders, nothing else touched.

    cd app && python3 -m unittest discover -s test -p '*_test.py'
"""
import base64
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from rembrandt import genv_approve  # noqa: E402

JPG = "data:image/jpeg;base64," + base64.b64encode(b"\xff\xd8\xff\xe0 a jpg \xff\xd9").decode()


def body(pid="bear-20x20-2mm-14", name="bear · GEN-V · 20x20 · 2 mm · 14.json"):
    pic = {"id": "gen-v", "w": 200, "h": 200, "pitch": 2, "kind": "dabs", "jars": [{"id": "c0", "name": "Colour 1", "hex": "#CC2222", "coats": 1, "cells": [{"n": 1, "legs": [[5, 150, 138]]}]}]}
    return {"sketch": {"tool": "GEN-V", "format": "20x20", "pic": pic}, "name": name, "card": {**pic, "id": pid, "title": "bear · dabs", "image": "x"}, "jpg": JPG}


class GenvApproveTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.sk, self.cards = os.path.join(self.tmp.name, "GOGH"), os.path.join(self.tmp.name, "gogh")

    def tearDown(self):
        self.tmp.cleanup()

    def approve(self, b):
        return genv_approve(b, sketches=self.sk, cards=self.cards)

    def test_the_sketch_the_card_and_the_list(self):
        out = self.approve(body())
        self.assertEqual(out, {"ok": True, "id": "bear-20x20-2mm-14", "sketch": "bear · GEN-V · 20x20 · 2 mm · 14.json", "title": "bear · dabs"})
        with open(os.path.join(self.sk, out["sketch"]), encoding="utf-8") as f:
            self.assertEqual(json.load(f)["tool"], "GEN-V")
        with open(os.path.join(self.cards, "bear-20x20-2mm-14.json"), encoding="utf-8") as f:
            card = json.load(f)
        self.assertEqual((card["id"], card["image"], card["kind"]), ("bear-20x20-2mm-14", "gogh/bear-20x20-2mm-14.jpg", "dabs"))
        with open(os.path.join(self.cards, "bear-20x20-2mm-14.jpg"), "rb") as f:
            self.assertTrue(f.read().startswith(b"\xff\xd8"))
        with open(os.path.join(self.cards, "local.json"), encoding="utf-8") as f:
            self.assertEqual(json.load(f)["ids"], ["bear-20x20-2mm-14"])
        self.assertFalse([n for n in os.listdir(self.cards) if n.endswith(".tmp")])

    def test_a_second_approval_never_overwrites(self):
        os.makedirs(self.cards)
        with open(os.path.join(self.cards, "local.json"), "w", encoding="utf-8") as f:
            json.dump({"ids": ["cola"]}, f)
        a, b = self.approve(body()), self.approve(body())
        self.assertEqual((a["id"], b["id"]), ("bear-20x20-2mm-14", "bear-20x20-2mm-14-2"))
        self.assertEqual(b["sketch"], "bear · GEN-V · 20x20 · 2 mm · 14 (2).json")
        with open(os.path.join(self.cards, "local.json"), encoding="utf-8") as f:
            self.assertEqual(json.load(f)["ids"], ["bear-20x20-2mm-14-2", "bear-20x20-2mm-14", "cola"], "the newest first, the others kept")
        with open(os.path.join(self.cards, "bear-20x20-2mm-14-2.json"), encoding="utf-8") as f:
            self.assertEqual(json.load(f)["image"], "gogh/bear-20x20-2mm-14-2.jpg")

    def test_refuses_what_is_not_a_sketch(self):
        for bad in [{**body(), "sketch": {"tool": "GEN-F", "pic": {}}}, {**body(), "card": {"kind": "legs", "jars": [1]}}, {**body(), "jpg": "data:image/png;base64,AA=="},
                    body(name="../evil.json"), body(name="a/b.json"), body(name=".hidden.json"), body(name="x.txt"), body(pid="../x"), body(pid="Bear")]:
            with self.assertRaises(ValueError):
                self.approve(bad)
        self.assertFalse(os.path.exists(os.path.join(self.cards, "local.json")))


if __name__ == "__main__":
    unittest.main()
