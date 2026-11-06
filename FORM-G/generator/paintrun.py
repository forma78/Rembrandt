#!/usr/bin/env python3
"""From the plan's cells to legs, runs and paint: spans on one grid, light under dark, snakes, dips, an idle run; rendered by brushsim."""
import sys, time, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import watchplan as WP
from watchplan import Plan, P, PITCH, MARGIN
from brushsim import Sim

JOIN = 45.0     # mm: a light leg runs on under a darker piece up to this long (the second try, OPM-G notes)
UNDER = 3.0     # mm: a lighter span runs this far under the darker one it butts (README, "the brush lands and lifts on the move", est.)
STEP_MAX = 13.0 # mm: a step of the snake on the paper along the leg, farther and the brush lifts (a long diagonal step eats a neighbour's shape)
IDLE_RATIO = 4.38 / 5.83   # the idle run's spacing against the first run's (LAB)
HW = 2.5


def spans_of(pl):
    lum = np.array([P[p].lum for p in pl.pids] + [2.0])   # the last: bare canvas, -1, stops every join
    out = []
    for c in range(pl.N):
        col, fm = pl.grid[:, c], pl.form[:, c]
        cuts = np.flatnonzero(np.diff(col)) + 1
        a = np.concatenate([[0], cuts])
        b = np.concatenate([cuts, [pl.R]])
        sp = [dict(c=c, a=int(i), b=int(j), p=int(col[i]), f=int(np.bincount(fm[i:j] + 1).argmax()) - 1) for i, j in zip(a, b)]
        # numerical crumbs, inside one form only (no form's detail is ever under 3 mm on purpose)
        changed = True
        while changed:
            changed = False
            for k, s in enumerate(sp):
                if s['b'] - s['a'] < 3 and len(sp) > 1:
                    nb = [q for q in (k - 1, k + 1) if 0 <= q < len(sp) and sp[q]['f'] == s['f']]
                    if nb:
                        q = nb[0]
                        sp[q]['a'] = min(sp[q]['a'], s['a'])
                        sp[q]['b'] = max(sp[q]['b'], s['b'])
                        sp.pop(k)
                        changed = True
                        break
        # the same paint on along a column joins
        i = 0
        while i < len(sp) - 1:
            if sp[i]['p'] == sp[i + 1]['p']:
                sp[i]['b'] = sp[i + 1]['b']
                sp.pop(i + 1)
            else:
                i += 1
        # a light leg runs on under darker pieces
        i = 0
        while i < len(sp):
            j = i + 1
            while j < len(sp) and lum[sp[j]['p']] < lum[sp[i]['p']] and sp[j]['p'] != sp[i]['p']:
                j += 1
            if j < len(sp) and j > i + 1 and sp[j]['p'] == sp[i]['p'] and sp[j]['a'] - sp[i]['b'] <= JOIN:
                sp[i]['b'] = sp[j]['b']
                sp[i]['under'] = True
                sp.pop(j)
                continue
            i += 1
        # butting: the lighter under the darker
        sp.sort(key=lambda s: s['a'])
        for k in range(len(sp) - 1):
            s, t = sp[k], sp[k + 1]
            if s['b'] <= t['a']:
                if lum[s['p']] > lum[t['p']]:
                    s['b'] = min(pl.R, s['b'] + UNDER)
                elif lum[t['p']] > lum[s['p']]:
                    t['a'] = max(0, t['a'] - UNDER)
        out += sp
    out = [s for s in out if s['p'] >= 0]
    for s in out:
        s['ya'], s['yb'] = MARGIN + s['a'], MARGIN + s['b']
        s['x'] = float(pl.xs[s['c']])
    return out


def build_runs(pl, spans):
    """Every paint's spans into runs: a snake column after column, the next leg entered at its nearer end."""
    runs = {}
    for pi, pid in enumerate(pl.pids):
        mine = [s for s in spans if s['p'] == pi]
        by_col = {}
        for s in mine:
            by_col.setdefault(s['c'], []).append(s)
        for v in by_col.values():
            v.sort(key=lambda s: s['ya'])
        used = set()
        out = []
        for s0 in sorted(mine, key=lambda s: (s['c'], s['ya'])):
            if id(s0) in used:
                continue
            f0 = pl.forms[s0['f']] if s0['f'] >= 0 else {}
            if f0.get('free') or f0.get('air') or f0.get('stripes'):
                used.add(id(s0))
                out.append([(s0, 1)])
                continue
            used.add(id(s0))
            run = [(s0, 1)]
            cur, d = s0, 1
            while True:
                end = cur['yb'] if d > 0 else cur['ya']
                best = None
                for step, cc in enumerate((cur['c'] + 1,)):
                    for t in by_col.get(cc, []):
                        if id(t) in used:
                            continue
                        ft = pl.forms[t['f']] if t['f'] >= 0 else {}
                        if ft.get('free') or ft.get('air') or ft.get('stripes'):
                            continue
                        da, db = abs(t['ya'] - end), abs(t['yb'] - end)
                        dist = min(da, db) + step * 6
                        if min(da, db) <= STEP_MAX and (best is None or dist < best[0]):
                            best = (dist, t, 1 if da <= db else -1)
                    if best:
                        break
                if not best:
                    break
                _, t, nd = best
                used.add(id(t))
                run.append((t, nd))
                cur, d = t, nd
            out.append(run)
        runs[pi] = out
    return runs


def paint(pl, ppm, seed=11, log=None):
    t0 = time.time()
    spans = spans_of(pl)
    runs = build_runs(pl, spans)
    sim = Sim(pl.W, pl.H, ppm=ppm, seed=seed)
    order = sorted(range(len(pl.pids)), key=lambda i: -P[pl.pids[i]].lum)
    stats = dict(per={}, line=0.0, idle=0.0, legs=0, runs=0, dips=0, shortlegs=0)
    idle_step = PITCH * IDLE_RATIO
    for pi in order:
        rs = runs.get(pi, [])
        if not rs:
            continue
        T = np.zeros((sim.h, sim.w), np.float32)
        line = 0.0
        idle_line = 0.0
        legs = 0
        for run in rs:
            s = 0.0
            for k, (sp, d) in enumerate(run):
                f = pl.forms[sp['f']] if sp['f'] >= 0 else {}
                dose = f.get('dose', 1.0)
                L = sp['yb'] - sp['ya']
                air, free = f.get('air'), f.get('free')
                stats['dips'] += L / f.get('rib', 95.0) if air else L / 95.0
                first, last = k == 0, k == len(run) - 1
                solid = L < 14                # a short leg comes out a drop, no window in it (IMG_2415)
                if free:
                    sim.leg(T, sp['x'], sp['ya'], sp['yb'], 0, L, 'turn', 'turn', dose=dose, solid=solid)
                elif air:
                    rib = f.get('rib', 95.0)
                    jit = float(sim.rng.uniform(-2.5, 2.5))
                    c = 'turn' if solid else 'free'
                    sim.leg(T, sp['x'], sp['ya'], sp['yb'], sp['ya'] + jit, sp['yb'] + jit, c, c, dose=dose, every=rib, solid=solid)
                else:
                    cap_in = 'turn' if (solid or not first) else 'free'
                    cap_out = 'turn' if (solid or not last) else 'free'
                    if d > 0:
                        sim.leg(T, sp['x'], sp['ya'], sp['yb'], s, s + L, cap_in, cap_out, dose=dose, solid=solid)
                    else:
                        sim.leg(T, sp['x'], sp['ya'], sp['yb'], s + L, s, cap_out, cap_in, dose=dose, solid=solid)
                s += L
                legs += 1
                line += L
                if L < 12:
                    stats['shortlegs'] += 1
                if not last and not free and not air:
                    nx, nd = run[k + 1]
                    end = sp['yb'] if d > 0 else sp['ya']
                    start = nx['ya'] if nd > 0 else nx['yb']
                    side = 1 if d > 0 else -1
                    a1 = end - side * HW * 0.8
                    a2 = start + (HW * 0.8 if nd > 0 else -HW * 0.8)
                    load = float(sim.loader.load(np.array(s))) * dose
                    sim.turn(T, sp['x'], a1, nx['x'], a2, side, min(load, 1.3))
                    st = np.hypot(nx['x'] - sp['x'], start - end)
                    s += st
                    line += st
            # the idle run, the same snake again closer together, no dip, over legs that have neighbours
            f = pl.forms[run[0][0]['f']] if run[0][0]['f'] >= 0 else {}
            if f.get('idle') and len(run) >= 3:
                bycol = {}
                for sp, d in run:
                    bycol.setdefault(sp['c'], []).append(sp)
                cols = sorted(bycol)
                x = bycol[cols[0]][0]['x']
                xend = bycol[cols[-1]][0]['x']
                while x <= xend + 1e-6:
                    c = int(round((x - pl.xs[0]) / PITCH))
                    for sp in bycol.get(c, []):
                        # only on legs with a neighbour of the same run on a side
                        if (c - 1 in bycol or c + 1 in bycol) and sp['yb'] - sp['ya'] > 14:
                            sim.leg(T, x, sp['ya'] - 0.5, sp['yb'] + 0.5, 300, 300 + sp['yb'] - sp['ya'], 'free', 'free', dose=0.5, idle=True)
                            idle_line += sp['yb'] - sp['ya']
                    x += idle_step
        sim.lay(T, P[pl.pids[pi]])
        del T
        stats['per'][pl.pids[pi]] = dict(legs=legs, line_m=round(line / 1000, 2), runs=len(rs))
        stats['line'] += line
        stats['idle'] += idle_line
        stats['legs'] += legs
        stats['runs'] += len(rs)
        if log:
            print(f"  {pl.pids[pi]:10s} legs {legs:5d} runs {len(rs):4d} line {line/1000:7.2f} m  [{time.time()-t0:5.0f}s]", flush=True)
    img = sim.finish()
    return img, stats


if __name__ == '__main__':
    name = sys.argv[1]
    ppm = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    out = sys.argv[3] if len(sys.argv) > 3 else f'try_{name}.jpg'
    pl = Plan(name).build()
    img, st = paint(pl, ppm, log=True)
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(out, quality=93, subsampling=0)
    st['line_m'] = round(st.pop('line') / 1000, 1)
    st['idle_m'] = round(st.pop('idle') / 1000, 1)
    st['columns'] = pl.N
    st['dips'] = int(st['dips'])
    st['paints'] = len(st['per'])
    json.dump(st, open(out + '.json', 'w'), indent=1)
    print(name, 'columns', pl.N, 'legs', st['legs'], 'runs', st['runs'], 'line', st['line_m'], 'm, idle', st['idle_m'], 'm, dips', st['dips'], 'short legs', st['shortlegs'])
