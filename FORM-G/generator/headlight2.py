#!/usr/bin/env python3
"""FORM-G: the classic red 911's headlight on 60 × 80, v.2 — true to its GEN-F sketch (genfpic.py), the owner, 2026-11-16, of "the headlight was made the old
way; when we come to the new frame I will remake it as strictly": "Oh, let's! Only v.2". Its sketch's jars, colours and legs as he approved them, his own jars
as hints beside them; no crest on it. v.1 (headlight.py, the brush model's re-solve) kept as it is.

  python headlight2.py"""
import os
from genfpic import make

HERE = os.path.dirname(os.path.abspath(__file__))

if __name__ == '__main__':
    make(os.path.join(HERE, '..', '..', 'GEN-F', 'Classic Red Porsche Headlight Detail · GEN-F · 60x80 · 14.json'), 'porsche-headlight-v2', 'Porsche, red · headlight · v.2',
         'hyperrealism, 60 × 80, the classic red 911\'s headlight, a detail, 54 × 72 cm; GEN-F\'s sketch as approved, its 14 colours', crest=False, idle=None)
