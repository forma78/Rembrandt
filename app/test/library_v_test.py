"""LIBRARY-V on rembrandt.py (2026-11-22, the evening; the owner: "make Library-V as here"; of 💾 SAVE's file in Downloads: "I need it in the
library"): a picture's jars saved, listed, and × — in a temporary folder.

    cd app && python3 -m unittest discover -s test -p '*_test.py'
"""
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from rembrandt import gogh_delete, gogh_jars_save, gogh_library  # noqa: E402


def jars(pic="bear-20", saved="2026-11-22T20:19:30Z"):
    return {"tool": "GOGH", "kind": "FORM-G jars", "pic": pic, "title": "Gummy bear, the head · dabs", "saved": saved,
            "swaps": {"c8": {"name": "Jar 1", "hex": "#E6E5DF"}}, "mine": {}, "colours": [{"id": "c8"}, {"id": "c4"}]}


class LibraryVTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.cards = self.tmp.name
        for pid in ("bear-20", "mine-1"):
            open(os.path.join(self.cards, pid + ".json"), "w").write("{}")
            open(os.path.join(self.cards, pid + ".jpg"), "wb").write(b"\xff\xd8")
        json.dump({"ids": ["mine-1"]}, open(os.path.join(self.cards, "local.json"), "w"))

    def tearDown(self):
        self.tmp.cleanup()

    def test_saved_listed_newest_first_never_over_another(self):
        a = gogh_jars_save(jars(saved="2026-11-22T20:19:30Z"), cards=self.cards, now=0)
        b = gogh_jars_save(jars(saved="2026-11-22T21:00:00Z"), cards=self.cards, now=0)
        self.assertNotEqual(a, b)
        self.assertTrue(a.startswith("Gummy bear, the head · dabs · jars · ") and b.endswith(" (2).json"))
        lib = gogh_library(cards=self.cards)
        self.assertEqual(lib["local"], ["mine-1"])
        self.assertEqual([q["file"] for q in lib["jars"]], [b, a], "the newest first")
        self.assertEqual((lib["jars"][0]["pic"], lib["jars"][0]["swaps"], lib["jars"][0]["colours"]), ("bear-20", 1, 2))

    def test_refused(self):
        for bad in ({**jars(), "kind": "x"}, jars(pic="../x"), jars(pic="nope"), {**jars(), "title": "../../etc"}):
            if bad.get("title") == "../../etc":
                name = gogh_jars_save(bad, cards=self.cards)          # a title is only a name: no way out of jars/
                self.assertTrue(os.path.exists(os.path.join(self.cards, "jars", name)) and "/" not in name)
                continue
            with self.assertRaises(ValueError):
                gogh_jars_save(bad, cards=self.cards)

    def test_delete_moves_into_deleted_mine_only(self):
        name = gogh_jars_save(jars(), cards=self.cards)
        self.assertTrue(gogh_delete("jars", name, cards=self.cards))
        self.assertFalse(gogh_delete("jars", name, cards=self.cards))
        self.assertFalse(gogh_delete("jars", "../local.json", cards=self.cards))
        self.assertFalse(gogh_delete("pic", "bear-20", cards=self.cards), "a picture not of this Mac's (git's): no ×")
        self.assertTrue(gogh_delete("pic", "mine-1", cards=self.cards))
        self.assertFalse(os.path.exists(os.path.join(self.cards, "mine-1.json")))
        self.assertEqual(json.load(open(os.path.join(self.cards, "local.json")))["ids"], [])
        self.assertEqual(len(os.listdir(os.path.join(self.cards, ".deleted"))), 3)


if __name__ == "__main__":
    unittest.main()
