"""HOLO's pictures in the owner's jars (2026-11-12). Not part of the app: it writes app/holo/<id>.json and its two renders.

The owner, 2026-11-12, of cloud-Claude's sheets (HOLO-Claude/HOLO/): "very beautiful, but I would like to stay within the range where our jars are
already mixed and there is paint" — HOLO-Claude/IMAGE 2026-11-12 12:32:52.jpg, the jars of today, "I can easily add four more colours".

The compositions are cloud-Claude's, untouched (holo_study.py: the same slats, bands, puddles and seeds; the owner: "all is excellent"); only every
jar of a picture is one of his, by hand, light for light and dark for dark, each family kept (a shadow only over its own family or white):
  - a numbered jar: its hex as FORM-G's red classic has it (app/formg/porsche-red-k.json), the colour it was mixed to — the photo's wet, glossy
    darks read 8 … 10 L lighter (COLORS' note); but Jar 6 and Jar 12 by the photo, which shows another colour on the lid (est.; asked);
  - a jar with no number on its lid: by the photo, white-balanced on the empty aluminium lids, est.;
  - four new jars, the four empty ones: straight from tubes on the shelf (colorlib.js, measured dry, est.), one a mix COLORS already knows.

python holo_jars.py [id …]       (a venv with numpy, pillow and scipy; the working directory this one)
"""
import sys, json, os, importlib.util
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('holo_study', os.path.join(HERE, '..', 'HOLO', 'study', 'holo_study.py'))
H = importlib.util.module_from_spec(spec); spec.loader.exec_module(H)
OUT = os.path.join(HERE, '..', '..', 'app', 'holo')

# the owner's jars: id, name, his number (None: none on the lid yet), hex, seen ('formg', 'photo', 'tube'), a note
JARS = [
    ('j1', 'Jar 1', 1, '#E6E5DF', 'formg', ''),
    ('j6', 'Jar 6', 6, '#FF4600', 'photo', "the lid reads a red orange; FORM-G's hex is the amber #EE8A22 (asked)"),
    ('j12', 'Jar 12', 12, '#BCCBEE', 'photo', "the lid reads a pale periwinkle; FORM-G's hex is the blue grey #757C91 (asked)"),
    ('j13', 'Jar 13', 13, '#D4462F', 'formg', ''),
    ('j20', 'Jar 20', 20, '#C12614', 'formg', ''),
    ('j27', 'Jar 27', 27, '#9D0D0D', 'formg', ''),
    ('j39', 'Jar 39', 39, '#5A0D0D', 'formg', ''),
    ('j45', 'Jar 45', 45, '#3C0608', 'formg', ''),
    ('j48', 'Jar 48', 48, '#280D0D', 'formg', ''),
    ('cream', 'Cream', None, '#FCE2A0', 'photo', 'no number on its lid yet'),
    ('paleyellow', 'Pale yellow', None, '#FFD064', 'photo', 'no number on its lid yet'),
    ('amber', 'Amber', None, '#FFA401', 'photo', 'no number on its lid yet'),
    ('sky', 'Sky', None, '#58BCF6', 'photo', 'no number on its lid yet'),
    ('darkblue', 'Dark blue', None, '#33366B', 'photo', 'no number on its lid yet; a photo reads a dark lighter than it is'),
    # the four empty jars, new: from the tubes on the shelf (colorlib.js, PAINTS, dry in daylight), 1 : 1 with pouring medium as every jar
    ('orange', 'New · Orange', None, '#EE8A22', 'tube', "Orange Yellow 50 : Orange 1, COLORS' recipe of the indicator's amber (ΔE 5, est.)"),
    ('skyblue', 'New · Sky Blue', None, '#4090C0', 'tube', 'Sky Blue straight from the tube'),
    ('blue04', 'New · Blue 04', None, '#1653AA', 'tube', "the blue marked 04 on the palette sheet, straight from the tube"),
    ('ultra', 'New · Ultramarine', None, '#101F7E', 'tube', 'Ultramarine straight from the tube'),
]
JAR = {j[0]: j for j in JARS}

# every picture: cloud-Claude's colour → the owner's jar, by its role (a ground light, a shadow dark, the family kept)
MAP = {
    'holo-40-warm': {'#F2E9DC': 'j1', '#FAD321': 'paleyellow', '#F0AC26': 'amber', '#EB870F': 'orange',
                     '#E45C06': 'j6', '#C22303': 'j13', '#791406': 'j39', '#3B0807': 'j45', '#2B49C7': 'blue04', '#141A55': 'darkblue'},
    'holo-60-blue': {'#F1F3F2': 'j1', '#C6E7FA': 'j12', '#EDDAC9': 'cream', '#46A4EF': 'sky', '#1C77E8': 'skyblue',
                     '#134BC9': 'blue04', '#0F1DC2': 'ultra', '#09116C': 'ultra', '#0E0820': 'j48', '#F15518': 'j6', '#80241C': 'j39'},
    'holo-60-tiers': {'#E6D9C3': 'j1', '#D98A4E': 'orange', '#A43E20': 'j20', '#622019': 'j39', '#33140F': 'j45',
                      '#8DBDE1': 'sky', '#3D8BD3': 'skyblue', '#0539A5': 'blue04', '#02036C': 'ultra', '#090715': 'j48', '#C3271B': 'j13'},
}
SUB = {'holo-40-warm': 'the fan, warm', 'holo-60-blue': 'the fan, blue', 'holo-60-tiers': 'the tiers'}


def lab(h):
    lin = H.hexlin(h); M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]); t = (M @ lin) / np.array([0.95047, 1, 1.08883])
    f = np.where(t > 216 / 24389, np.cbrt(t), (24389 / 27 * t + 16) / 116); return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])]


def recolour(pid):
    """holo_study's palettes, every colour its jar's hex; the compositions drawn by index or by seed, so nothing else moves"""
    m = {k: JAR[v][3] for k, v in MAP[pid].items()}
    sub = lambda c: None if c is None else m[c]
    kinds = lambda K: dict(light=sub(K['light']), dark=[sub(c) for c in K['dark']])
    if pid == 'holo-60-tiers':
        H.TIERS = dict(warm=dict(ground=[sub(c) for c in H.TIERS0['warm']['ground']], dark=[sub(c) for c in H.TIERS0['warm']['dark']]),
                       cool=dict(ground=[sub(c) for c in H.TIERS0['cool']['ground']], dark=[sub(c) for c in H.TIERS0['cool']['dark']]),
                       pins=[sub(c) for c in H.TIERS0['pins']])
    else:
        pal = 'warm' if pid == 'holo-40-warm' else 'blue'
        H.PAL = dict(H.PAL0); H.PAL[pal] = dict(kinds=[kinds(K) for K in H.PAL0[pal]['kinds']], accent=kinds(H.PAL0[pal]['accent']))
    return {JAR[v][3]: v for v in MAP[pid].values()}


H.PAL0, H.TIERS0 = H.PAL, H.TIERS


def make(pid):
    byhex = recolour(pid)
    make_, title = H.PICTURES[pid]
    st = make_()
    p = st.plan(pid, title)
    # every hex in the plan its jar's id; the jars light to dark, as the study counted them
    for s in p['slats']:
        s['ground'] = byhex[s['ground']] if s['ground'] else None
        for b in s['bands']: b['jar'] = byhex[b['jar']]
    src = {}
    for k, v in MAP[pid].items(): src.setdefault(v, []).append(k)
    jars = []
    for q in p['jars']:
        j = JAR[byhex[q['hex']]]
        jars.append(dict(id=j[0], name=j[1], number=j[2], hex=j[3], L=round(lab(j[3])[0]), seen=j[4], new=j[4] == 'tube', note=j[5],
                         study=src[j[0]], run1_dabs=q['run1_dabs'], run2_dabs=q['run2_dabs']))
    p.update(title=f'HOLO · {p["w"] // 10} × {p["h"] // 10}, {SUB[pid]}', sub=f'{SUB[pid]}, in our jars', jars=jars,
             note='HOLO, a study in the owner\'s jars: every number est., nothing run on the machine',
             image=f'holo/{pid}.jpg', after1=f'holo/{pid}-run1.jpg')
    os.makedirs(OUT, exist_ok=True)
    json.dump(p, open(os.path.join(OUT, pid + '.json'), 'w'), separators=(',', ':'))
    for stage, name in (('r2', pid), ('r1', pid + '-run1')):
        im = st.render(stage); im = im.resize((1200, 1200), resample=1); im.save(os.path.join(OUT, name + '.jpg'), quality=88)
    return p


if __name__ == '__main__':
    for pid in sys.argv[1:] or list(MAP):
        p = make(pid)
        print(pid, p['count'], [(j['name'], j['run1_dabs'], j['run2_dabs']) for j in p['jars']])
        for k, v in MAP[pid].items():
            a, b = lab(k), lab(JAR[v][3])
            print(f'   {k} L{a[0]:3.0f} → {JAR[v][1]:<18} {JAR[v][3]} L{b[0]:3.0f}  ΔE76 {np.linalg.norm(np.subtract(a, b)):4.1f}')
