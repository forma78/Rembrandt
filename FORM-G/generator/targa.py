#!/usr/bin/env python3
"""FORM-G: the red 911 Targa from above, graphite seats, on 70 × 100 — GEN-F's sketch the owner approved (2026-11-16: "I put together at once Graphite Seats in a
Glossy Red Targa · GEN-F · 70x100 · 30.json for FORM-G"), its screen 2, 30 colours asked, 25 by the canon; 400 × 853 mm. genfcar.py's GenFCar: the ground bare,
the right half the left's mirror, the crest off and its two Black columns.

  python targa.py 6 2 porsche-targa.jpg
  python export_formg.py porsche-targa porsche-targa.jpg.pkl"""
from redcar import main
from genfcar import GenFCar


class Targa(GenFCar):
    SKETCH = '../../GEN-F/Graphite Seats in a Glossy Red Targa · GEN-F · 70x100 · 30.json'
    KEEP = 'porsche-targa.jars.json'
    MIRROR = True
    CREST = True


if __name__ == '__main__':
    main(Targa, 'porsche-targa.jpg')
