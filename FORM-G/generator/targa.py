#!/usr/bin/env python3
"""FORM-G: the red 911 Targa from above, graphite seats, on 70 × 100 — GEN-F's sketch the owner approved (2026-11-16: "I put together at once Graphite Seats in a
Glossy Red Targa · GEN-F · 70x100 · 30.json for FORM-G"), its screen 2, 30 colours asked, 25 by the canon; 400 × 853 mm. True to the sketch (genfpic.py): its
legs and colours, his own jars by name, the crest off and its two Black columns. (Its first make, genfcar.py's re-solve through the brush model, lost the
glass's lights and the seats: "it all turned into mush".)

  python targa.py"""
import os
from genfpic import make

HERE = os.path.dirname(os.path.abspath(__file__))

if __name__ == '__main__':
    make(os.path.join(HERE, '..', '..', 'GEN-F', 'Graphite Seats in a Glossy Red Targa · GEN-F · 70x100 · 30.json'), 'porsche-targa', 'Porsche Targa, red',
         'hyperrealism, 70 × 100, the red 911 Targa from above, graphite seats, 85 cm long; GEN-F\'s sketch, its colours by his jars', idle=None)
