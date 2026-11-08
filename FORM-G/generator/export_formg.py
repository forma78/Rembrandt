#!/usr/bin/env python3
"""A finished picture's plan into app/formg/<id>.json, what FORM-G paints. The cells are the generator's snakes: a jar's legs that follow one another.

  python3 export_formg.py watch <plan.pkl>    (hyper.py's .pkl)
  python3 export_formg.py porsche <plan.pkl>  (hyper2.py's .pkl)
  python3 export_formg.py porsche-red <plan.pkl>  (redcar.py's .pkl)
  python3 export_formg.py gwagon <plan.pkl>   (gwagon.py's .pkl), OPM-G's: into app/opmg/

Run each in its own process: hyper.py and hyper2.py fill the same paint table on import. Coordinates in the JSON: mm from the canvas's bottom left corner, x right, y up."""
import json, os, pickle, sys
import numpy as np
which, pkl = sys.argv[1], sys.argv[2]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'app', 'opmg' if which == 'gwagon' else 'formg')
d = pickle.load(open(pkl, 'rb'))


class Plan:
    pass


# what the machine cannot reach is said here, not left to be pressed into a wall: the Porsche's exhaust, its tip past everything else, 9 mm shorter than the photo's, so that the
# carriage keeps within the 865 mm (the elbow's sweep takes it about 20 mm past a leg's end at the bottom; the owner's rule: "must never silently change")
LOWEST = {'porsche': 84.0}
pl = Plan()
pl.grid, pl.form = d['grid'], d['form']
pl.R, pl.N = pl.grid.shape
if which == 'watch':
    import hyper
    import paintrun
    from watchplan import P, PITCH, MARGIN
    pl.W, pl.H = 600, 800
    pl.pids = hyper.PIDS
    pl.forms = [dict(name='steel', idle=True, dose=1.0), dict(name='dial', air=True, rib=80.0, dose=1.15), dict(name='dark', idle=False, dose=1.3)]
    title, sub = 'Watch', 'hyperrealism, 60 × 80'
    names = {q['id']: (q['name'], q.get('code', '')) for q in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'palette54.json')))}
    jarname = lambda pid, n: names.get(pid, (P[pid].name, ''))
elif which == 'gwagon':
    import hyper2
    import paintrun
    from watchplan import P, PITCH, MARGIN
    pl.W, pl.H = 600, 600
    P.clear()
    pl.pids = []
    for i, (name, hexv, coats) in enumerate(d['jars']):
        P[f'j{i}'] = hyper2.jar(hexv, coats, name)
        P[f'j{i}'].name = name
        pl.pids.append(f'j{i}')
    pl.forms = [dict(name='body', idle=True, dose=1.0), dict(name='locked', idle=True, dose=1.0)]
    title, sub = 'G-wagon', 'hyperrealism, 60 × 60, black, 50 cm across'
    KEEP = {'chrome': 'Chrome', 'chromeM': 'Chrome, mid', 'chromeD': 'Chrome, dark', 'ink': 'Ink', 'grille': 'Grille', 'seat': 'Seats'}
    jarname = lambda pid, n: (KEEP.get(P[pid].name, f'Jar {n}'), '')
elif which == 'porsche-red':
    # the red classic 911 (redcar.py's .pkl): the green's technique, redgeo.py's geometry, its own fixed jars
    import hyper2
    import paintrun
    from watchplan import P, PITCH, MARGIN
    pl.W, pl.H = 700, 1000
    P.clear()
    pl.pids = []
    for i, (name, hexv, coats) in enumerate(d['jars']):
        P[f'j{i}'] = hyper2.jar(hexv, coats, name)
        P[f'j{i}'].name = name
        pl.pids.append(f'j{i}')
    pl.forms = [dict(name='body', idle=True, dose=1.0), dict(name='dark', idle=False, dose=1.3)]
    title, sub = 'Porsche, red', 'hyperrealism, 70 × 100, classic red, 84 cm long'
    KEEP = {'chrome': 'Chrome', 'chromeM': 'Chrome, mid', 'chromeD': 'Chrome, dark', 'ink': 'Ink', 'carbon': 'Carbon', 'tail': 'Tail light', 'amber': 'Indicator', 'seam': 'Seam', 'louvre': 'Louvre'}
    jarname = lambda pid, n: (KEEP.get(P[pid].name, f'Jar {n}'), '')
else:
    import hyper2
    import paintrun
    from watchplan import P, PITCH, MARGIN
    pl.W, pl.H = 700, 1000
    P.clear()
    pl.pids = []
    for i, (name, hexv, coats) in enumerate(d['jars']):
        P[f'j{i}'] = hyper2.jar(hexv, coats, name)
        P[f'j{i}'].name = name
        pl.pids.append(f'j{i}')
    pl.forms = [dict(name='body', idle=True, dose=1.0), dict(name='dark', idle=False, dose=1.3)]
    title, sub = 'Porsche', 'hyperrealism, 70 × 100, green, 85 cm long'
    KEEP = {'chrome': 'Chrome', 'chromeM': 'Chrome, mid', 'chromeD': 'Chrome, dark', 'ink': 'Ink', 'wood': 'Wood', 'tail': 'Tail light', 'steel': 'Steel', 'creaseL': 'Crease, light', 'creaseD': 'Crease, dark', 'seam': 'Seam', 'louvre': 'Louvre'}
    jarname = lambda pid, n: (KEEP.get(P[pid].name, f'Jar {n}'), '')
pl.xs = (pl.W - pl.N * PITCH) / 2 + PITCH * (np.arange(pl.N) + 0.5)
paintrun.STEP_MAX = 7.0
spans = paintrun.spans_of(pl)
runs = paintrun.build_runs(pl, spans)
order = sorted(range(len(pl.pids)), key=lambda i: -P[pl.pids[i]].lum)
rng = np.random.default_rng(80)
jars, total_legs = [], 0
for pi in order:
    rs = runs.get(pi, [])
    if not rs:
        continue
    pid, cells = pl.pids[pi], []
    no = len(jars) + 1
    name, code = jarname(pid, no)
    for k, run in enumerate(rs):
        legs = []
        for sp, dr in run:
            top, bot = pl.H - sp['ya'], pl.H - sp['yb']        # y up
            low = LOWEST.get(which, -1e9)
            top, bot = max(top, low), max(bot, low)
            legs.append([round(float(sp['x']), 2), round(float(top if dr > 0 else bot), 1), round(float(bot if dr > 0 else top), 1)])
            total_legs += 1
        f = pl.forms[run[0][0]['f']] if run[0][0]['f'] >= 0 else {}
        cell = dict(n=k + 1, legs=legs)
        if f.get('air'):
            # the dial's rows of dips, at one height from column to column (hyper.py: RIB, its ±2.5 mm off the row, est.): where this leg's are, the brush going down
            rib, jit = f['rib'], float(rng.uniform(-2.5, 2.5))
            ya, yb = run[0][0]['ya'], run[0][0]['yb']
            cell['air'] = True
            cell['cuts'] = [round(float(pl.H - y), 1) for y in np.arange(np.ceil((ya + jit) / rib) * rib - jit, yb - 20, rib) if y > ya + 20]
        cells.append(cell)
    jars.append(dict(id=pid, name=name, code=code, hex=P[pid].hex, coats=int(getattr(P[pid], 'coats', 1)), cells=cells))
assert total_legs == d['st']['legs'], (total_legs, d['st']['legs'])
ys = [v for j in jars for c in j['cells'] for l in c['legs'] for v in l[1:]]
xs = [l[0] for j in jars for c in j['cells'] for l in c['legs']]
out = dict(id=which, title=title, sub=sub, w=pl.W, h=pl.H, pitch=PITCH, image=f'{os.path.basename(OUT)}/{which}.jpg', columns=int(pl.N), box=[min(xs), min(ys), max(xs), max(ys)], jars=jars)
path = os.path.join(OUT, f'{which}.json')
with open(path, 'w') as f:
    json.dump(out, f, separators=(',', ':'))
print(which, 'jars', len(jars), 'of them two layers', sum(1 for j in jars if j['coats'] == 2), 'cells', sum(len(j['cells']) for j in jars), 'legs', total_legs, 'box', out['box'], 'file', os.path.getsize(path) // 1024, 'KB')
