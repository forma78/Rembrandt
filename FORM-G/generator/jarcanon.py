#!/usr/bin/env python3
"""The canon of the jars on a finished FORM-G plan (README, "How many jars — the canvas's long side"), jar by jar on the owner's word: a jar out, its cells to
the jar named, every leg still painted, none moved; the names kept as they are (no jar renumbered — Kuzya's audit: "do not renumber jars in existing plans").
The plan's json changed in place, its render painted again from the generator's grid with the same moves.

  python jarcanon.py <id> <plan .pkl> <out jpg> Jar9=Jar15 Jar29=Jar25 …"""
import sys, os, json, pickle
import numpy as np
from PIL import Image
import hyper2 as H
from watchplan import P
import paintrun

which, pkl, out = sys.argv[1:4]
moves = [a.split('=') for a in sys.argv[4:]]
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'app', 'formg', f'{which}.json')
pic = json.load(open(path))
byname = {j['name'].replace(' ', ''): j for j in pic['jars']}
d = pickle.load(open(pkl, 'rb'))
grid = d['grid'].copy()
for a, b in moves:
    ja, jb = byname[a], byname[b]
    ia, ib = int(ja['id'][1:]), int(jb['id'][1:])          # a json jar's id is its index in the plan's jars (export_formg.py)
    assert d['jars'][ia][1] == ja['hex'] and d['jars'][ib][1] == jb['hex'], (a, b)
    jb['cells'] += ja['cells']
    for n, c in enumerate(jb['cells']):
        c['n'] = n + 1
    pic['jars'].remove(ja)
    grid[grid == ia] = ib
    print(f'{ja["name"]} {ja["hex"]} → {jb["name"]} {jb["hex"]}: {len(ja["cells"])} cells')
json.dump(pic, open(path, 'w'), separators=(',', ':'))
print(which, 'jars', len(pic['jars']), 'of them two layers', sum(1 for j in pic['jars'] if j['coats'] == 2))


class Plan:
    pass


pl = Plan()
pl.grid, pl.form = grid, d['form']
pl.R, pl.N = grid.shape
pl.W, pl.H = pic['w'], pic['h']
pl.xs = (pl.W - pl.N * 5.0) / 2 + 5.0 * (np.arange(pl.N) + 0.5)
pl.forms = [dict(name='body', idle=True, dose=1.0), dict(name='dark', idle=False, dose=1.3)]
P.clear()
pl.pids = []
for i, (name, hexv, coats) in enumerate(d['jars']):
    P[f'j{i}'] = H.jar(hexv, coats, name)
    P[f'j{i}'].name = name
    pl.pids.append(f'j{i}')
paintrun.STEP_MAX = 7.0
img, st = H.paint_all(pl, 6)
Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize((pl.W * 3, pl.H * 3), Image.LANCZOS).save(out, quality=93, subsampling=0)
pickle.dump(dict(grid=grid, form=d['form'], st=st, jars=d['jars']), open(out + '.pkl', 'wb'))
print('render', out, 'jars painted', len(st['per']))
