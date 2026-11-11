#!/usr/bin/env python3
"""Rembrandt server (rubens.py of RUBENS a143fbc): serves this folder on http://localhost:5164 and talks to
the machine on USB (Rubens_v2.md, section 6). One program, one address:
since 2026-09-29 it owns the serial port itself (class Board); before, the
bridge.py of the old machine repo held it on port 8765.

- Static files: the Create page (index.html), Calibration (calibration.html)
  and Job (job.html).
- /machine/<command> goes to the board (board_line: the page's address →
  the board's line). Only the commands in PASS get through: the ping, the
  look, the axes, and the axis zero. The arm is not among them.
- /calibration and /job: GET returns calibration.json / job.json, PUT saves
  it. The Job tab writes job.json — the job in mm, in the order it runs.
  /tubes and /ink the same: the tubes of the Create tab, the cup of the Ink tab.
- /library: the Library tab's drawings (library/, on this Mac only). GET is
  the list, newest first; POST {svg, png} saves a new drawing named by the
  time (💾 SAVE on the Create tab); GET /library/<name>.svg|.png gives one;
  DELETE /library/<name> moves it to library/.deleted/.
- /arm: GET the arm in RUBENS's degrees (0° = the working pose); POST
  /arm?j=<joint>&d=<deg> moves one joint there (class Arm). /brush/off and
  /brush/on go through it too: the elbow up to +25° or down to 0° since the
  new arm (2026-10-02).
- /park (GET), POST /shutdown and /restore: the place where the carriage
  stood when the motors were shut down, put back after power-on (class Park).
- /run: the runner (class Runner) — GET is its state; POST starts the machine
  blocks of job.json, or the blocks in its body (a calibration run); POST /run/stop brakes along the path, /run/kill stops at
  once; /run/pause and /run/continue pause a run and go on from the same point — a block marked
  pauseAtEnd (ALU's DRAG) runs to its end first; /run/p-pause, and a block of kind p-pause, the
  pencil's pause (DACHE, 2026-10-27): the same, the pencil left on the paper.
  POST /run/trim?deg=<d>: the elbow's live trim, added to every W 2 of the
  run as it goes to the board (PRISMA and OPM's ELBOW LIVE, 2026-10-28).
  POST /run/dip: the brush to the cup the run was started with and back to
  the same point (OPM-N's DIP, 2026-11-02); into the cup at hand where the
  carriage stands, the elbow up before the shoulder turns (INK-Y, 2026-11-03).
- /remote: the iPhone's remote (OPM-N, 2026-11-02): GET /remote the page,
  GET /remote/state?k=<key> where the run is — its colour, its cell, its pace (s a step, PACE_MIN_S) —
  GET /remote/plan?k=<key> the run's lines for the mini-screen (2026-11-04; reads only) —
  POST /remote/dip|pause|continue|stop|back|skip?k=<key>, /remote/goto?n=<cell>&k=<key>
  (a cell of the colour now); GET /remote/link (this Mac)
  POST /run/back[?sure=1] BACK ONE CELL, OPM-N's key (this Mac)
  the address with the key, for OPM-N's QR code. POST /brush/off and /brush/on lift the brush with the elbow to +25° or press it at 0° (within REACH)
  (only the wrist, only these two, not while a job runs — the owner asked for
  them on the Job tab, 2026-09-27). A board without the pass firmware
  (../firmware/CNCDM-001) fails a start on the first path command, and
  nothing moves.

Run:  python3 rubens.py   (needs pyserial for the board)
Listens on the home Wi-Fi too since 2026-11-02, for the iPhone (the owner:
"yes, with the key"): from any other address than this Mac's only /remote
and its calls get through, those with the key of remote.key (made at the
first start, kept off git). REMBRANDT_LISTEN=127.0.0.1 keeps it on this Mac
alone, as before.
"""

import base64
import glob
import hmac
import json
import math
import os
import re
import secrets
import socket
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, quote, unquote, urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 5164   # the owner's lucky number (2026-10-01); RUBENS is on 8766
# tubes.json: the owner's tubes — names, shades, pigments, their order — from
# the Create tab, kept on this Mac (the owner, 2026-10-01). ink.json: the cup
# the brush dips into, from the Ink tab (2026-10-03), and INK-Y's cup at hand,
# whose forks every turn of the arm is checked by while it is on (hand_guard).
FILES = {"/calibration": os.path.join(HERE, "calibration.json"), "/job": os.path.join(HERE, "job.json"),
         "/tubes": os.path.join(HERE, "tubes.json"), "/ink": os.path.join(HERE, "ink.json")}
PARK_FILE = os.path.join(HERE, "park.json")   # class Park; written by rubens.py only
BACK_BEGUN_MM = 0.5                 # BACK ONE CELL: more paint than this in a cell, the brush has begun it
LOG_FILE = os.path.join(HERE, "logs", "runs.jsonl")   # run_log: the run journal, on this Mac, not in git
LISTEN = os.environ.get("REMBRANDT_LISTEN", "0.0.0.0")   # the home Wi-Fi too, for the iPhone (2026-11-02); 127.0.0.1 this Mac alone
KEY_FILE = os.path.join(HERE, "remote.key")              # the iPhone's key, made at the first start; not in git
REMOTE_KEY = None                                        # read at the start (remote_key)
PASS = {"/ping", "/look", "/cmd", "/origin/x", "/origin/y", "/hold", "/scan", "/servo-id"}
STEPS_PER_MM = (80.0, 3200.0 / 120.0)   # X, Y — the same as src/machine.js
# The walls in mm (src/machine.js, the firmware). A carriage counted more
# than RUNAWAY_MM past one means the board is sending steps it should not:
# the runner stops the motors at once (2026-09-27: the watchdog could not,
# because the runner kept pinging while the Y motor ground on the stop).
# The line is the board's own (RUNAWAY_STEPS in the firmware): the reserve up
# to the stop plus 2 mm. Home itself lies in the reserve, at X −9.45 and
# Y −8.3; with 5 mm here the runner took home for a runaway (2026-09-28).
WALLS_MM = ((0.0, 865.0), (0.0, 15160 / (3200.0 / 120.0)))
RUNAWAY_MM = 12.0
# After every move block the carriage must stand where the block ends. The
# board stops a path by itself on a fault (a motor that does not take a
# slice); the runner used to take that for the end of the block and went on,
# brush down, from the wrong place (2026-09-28: X stuck after a HARD STOP,
# three passes ran along Y only). An arc's end is recomputed by the board
# from its start radius, a tenth of a mm at most.
# The owner, 2026-11-11, of "X 26.4 instead of X 23.2" and a HARD STOP on the red
# classic's v.3: "no HARD STOP when X is 26.4 and 23.2 is wanted — is that a
# punishment? a trip to STOP / HOME only makes it worse. A miss up to 4 mm can be
# forgiven." A miss up to ARRIVAL_MM goes on (the next block goes from where the
# carriage stands to its own ends), noted in the journal ("short") past
# ARRIVAL_NOTE_MM; past ARRIVAL_MM the path was stopped (171.6 mm off at 20:00
# the same evening): HARD STOP, as before.
ARRIVAL_MM, ARRIVAL_NOTE_MM = 4.0, 1.0

# The pace (the owner, 2026-11-12, of three PROGRESS screens: LEFT 9 h 57, 8 h 01,
# 8 h 30 within half an hour; "measuring by steps is a great idea"): the time goes
# by steps, not by paint — the journal's jars 1.22 … 1.49 s a step, but 3.6 … 8.7
# mm a second. The runner's own clock, while it runs: from one block's start to
# the next; a pause, a jump (Back, Skip, Go to), a silent arm's wait break it and
# are not counted. Its seconds a step once it has PACE_MIN_S of them over
# PACE_MIN_STEPS steps (/run's pace_s; the plan's own before that, on the pages).
PACE_MIN_S, PACE_MIN_STEPS = 120, 30

# What the board answers, in the words of the Job tab.
BOARD_WORDS = [
    (re.compile(r"^край ([A-Z])"), "past a wall"),
    (re.compile(r"такт не берётся"), "a motor does not take the path (restart the board)"),
    (re.compile(r"нет нуля осей"), "no zero on the axes"),
    (re.compile(r"тормозим"), "the board is braking"),
    (re.compile(r"едет, сначала стоп"), "the carriage is moving: stop it first"),
    (re.compile(r"очередь полна"), "the path queue is full"),
    (re.compile(r"очередь пуста"), "nothing to run"),
    (re.compile(r"занят (\d+)"), "that id answers on the bus already"),
    (re.compile(r"нет серво"), "no servo answers at that id"),
    (re.compile(r"не отвечает"), "the servo does not answer at its new id"),
    (re.compile(r"скорость"), "speed out of what the board takes: 1…250 mm/s (1…200 on the firmware before 2026-10-02)"),
]


def in_english(reply):
    for pat, words in BOARD_WORDS:
        if pat.search(reply or ""):
            return words
    return reply


def block_end(cmds):
    """Where a move block leaves the carriage, in mm: the end of its last
    piece (L x y, M x y, A cx cy x y ±1), or None if it has no pieces."""
    for c in reversed(cmds):
        p = c.split()
        if p[0] in ("L", "M") and len(p) == 3:
            return float(p[1]), float(p[2])
        if p[0] == "A" and len(p) == 6:
            return float(p[3]), float(p[4])
    return None
# Runs were off on 2026-09-27 after a diagonal pass ran the Y axis away;
# on again the same night once the pass core ran on FastAccelStepper 1.3.4
# and passed the air tests (CALIBRATION.md). Set to False to lock them.
RUNS_ENABLED = True


# ---------- the board, on USB ----------
# The board speaks lines: one command, one reply. What was bridge.py's (the
# old machine repo, 2026-09-20…29), in the same words, now here.
PORT_GLOB = "/dev/cu.usbserial-*"
BAUD = 115200
AXIS_LIMIT = {"X": 20, "Y": 9}   # jog levels, 10 mm/s each (X_LEVEL_MAX, Y_LEVEL_MAX in the firmware)
PATH_LETTERS = "FTLAMGW"         # speeds, path pieces, the wrist on the path (W, 2026-10-02), go: the only lines /raw lets through


def board_line(path):
    """A machine address → (the line for the board, seconds to wait for its
    reply). ValueError with the reply when the address is refused."""
    u = urlparse(path)
    q = parse_qs(u.query)
    p = u.path
    if p == "/ping":
        return "P", 0.25
    if p == "/look":
        return "V", 2.0              # a silent servo answers by its own timeout, and there are three
    if p == "/cmd":
        a = (q.get("a", ["S"])[0] or "S").upper()[0]
        if a in ("S", "K"):          # stop braking; stop at once
            return a, 0.25
        if a in AXIS_LIMIT:
            try:
                level = max(-AXIS_LIMIT[a], min(AXIS_LIMIT[a], int(q.get("n", ["0"])[0])))
            except ValueError:
                level = 0
            return f"{a} {level}", 0.25
        raise ValueError("?")
    if p == "/zero":                 # the arm's zero where it stands: nothing moves
        return "Z", 1.0
    if p == "/hold":                 # the arm stays where it stands: a slow stroke stopped half way (2026-10-02)
        return "H", 0.5
    if p == "/scan":                 # who answers on the servo bus, 0…253: nothing moves (new ST3235s, 2026-10-02)
        return "B", 3.0
    if p == "/servo-id":             # a servo's id changed, ?from=&to= — one servo at that id on the bus
        try:
            a, b = int(q.get("from", [""])[0]), int(q.get("to", [""])[0])
        except ValueError:
            raise ValueError("? from, to")
        if not (0 <= a <= 253 and 0 <= b <= 253) or a == b:
            raise ValueError("? from, to: 0…253, not the same")
        return f"I {a} {b}", 1.0
    if p in ("/origin/x", "/origin/y"):   # the carriage's place becomes the axis zero, or ?at=<steps>
        try:
            at = int(q.get("at", ["0"])[0])
        except ValueError:
            raise ValueError("? at")
        return f"O {p[-1].upper()} {at}", 0.25
    if p == "/raw":
        # the pass: a speed, a piece of path, go — the line as it is, but only
        # with these letters and no control characters: no arm, jog or zero
        line = q.get("c", [""])[0]
        if (not line or len(line) > 60 or line[0].upper() not in PATH_LETTERS
                or any(ord(ch) < 32 for ch in line)):
            raise ValueError("? raw")
        return line, 0.25
    if p == "/servo":
        joint = q.get("j", ["?"])[0]
        if joint not in JOINTS:
            raise ValueError("? joint")
        jid, _, lim = JOINTS[joint]   # the firmware's degrees: its sign is its own
        try:
            deg = max(-lim, min(lim, round(float(q.get("d", ["0"])[0]), 1)))
        except ValueError:
            deg = 0
        speed = ""                    # degrees a second (the firmware since 2026-10-02), else its 53°/s
        if q.get("v"):
            try:
                v = float(q["v"][0])
            except ValueError:
                raise ValueError("? v")
            if not 0.5 <= v <= 100:
                raise ValueError("? v: 0.5 to 100 degrees a second")
            speed = f" {v:g}"
        return f"J {jid} {deg:g}{speed}", 1.0     # 0.25 until 2026-11-04: the run of 21:50 stopped on a reply later than that
    raise ValueError(f"? {p}")


# What the arm's and the carriage's questions answer (firmware main.cpp). The board has one line of
# reply and no numbers on it: a reply come late used to be taken for the next command's, and one such
# stopped a run twice on the evening of 2026-11-04 ("the shoulder does not answer", "shoulder: ok Z 3").
# Waiting for its own line, or the board's refusal, the late one passes by; none in time: NO_REPLY.
REPLY = {"V": "ok V", "P": "ok P", "Z": "ok Z", "H": "ok H", "J": "ok J"}
REFUSAL = ("?", "нет серво")
NO_REPLY = "no answer"


def pyserial(port):
    import serial                    # pyserial: the server needs it, the tests do not
    return serial.Serial(port, BAUD, timeout=0.2, write_timeout=0.3)


class Board:
    """The serial port. Opens the first /dev/cu.usbserial-*, and keeps
    looking while there is none or it drops (the USB pulled, the board reset,
    the 12 V switched): the server runs without a board all the same.

    open_port(name) is pyserial's Serial; the tests pass a fake.
    """

    def __init__(self, open_port=pyserial, ports=lambda: sorted(glob.glob(PORT_GLOB)),
                 sleep=time.sleep, log=lambda s: print(s, flush=True)):
        self.open_port, self.ports, self.sleep, self.log = open_port, ports, sleep, log
        self.ser, self.last, self.seen = None, "", 0
        self.lock = threading.Lock()

    def start(self):
        if not self.open():
            self.log(f"no board at {PORT_GLOB} — waiting for one")
        threading.Thread(target=self._reader, daemon=True).start()

    def open(self):
        ports = self.ports()
        if not ports:
            return False
        try:
            ser = self.open_port(ports[0])
            # No reset at every opening. The order matters: RTS without DTR
            # is the board's reset (the upload resets it so). DTR used to go
            # first, and the board rebooted at every start of the bridge and
            # forgot the axis zero (found 2026-09-23).
            ser.setRTS(False)
            ser.setDTR(False)
        except Exception as e:
            self.log(f"{ports[0]} did not open: {e}")
            return False
        self.ser = ser
        self.log(f"board: {ports[0]}")
        return True

    def drop(self, why):
        try:
            self.ser.close()
        except Exception:
            pass
        self.ser = None
        self.log(f"board lost: {why}")

    def _reader(self):
        while True:
            if self.ser is None:
                self.sleep(2.0)
                self.open()
                continue
            try:
                line = self.ser.readline()
                if line:
                    self.last = line.decode("utf-8", "replace").strip()
                    self.seen += 1
            except Exception as e:
                self.drop(e)

    def send(self, text, wait=0.25):
        # The lock holds through the wait for the reply too: one command, one
        # reply, or a page's ping could slip in and take another command's
        # reply — a piece of path lost or sent twice is a bent line on the
        # canvas (2026-09-27).
        if self.ser is None:
            return "no board"
        own = REPLY.get(text[:1])
        with self.lock:
            try:
                was = self.seen
                self.ser.write((text + "\n").encode())
            except Exception as e:
                self.drop(e)
                return "no board"
            t0 = time.time()
            while time.time() - t0 < wait:
                if self.seen != was:
                    line, was = self.last, self.seen
                    if own is None or line.startswith(own) or line.startswith(REFUSAL):
                        return line
                time.sleep(0.005)
            return self.last if own is None else NO_REPLY


BOARD = None   # the Board once the server runs (__main__); nothing opens a port on import


def board_get(path):
    """What the pages, the arm and the runner send: a machine address, and
    the board's reply."""
    try:
        line, wait = board_line(path)
    except ValueError as e:
        return str(e)
    if BOARD is None:
        return "no board"
    return BOARD.send(line, wait)


# The arm (../firmware/CNCDM-001/src/main.cpp: JOINT_ID, JOINT_SIGN,
# JOINT_LIMIT): servo id, the firmware's sign, limit in degrees.
# The wrist's 150 is a step, from −90° to +60° in one (the firmware since
# 2026-10-02; 90 before, and a longer move went in two).
JOINTS = {"shoulder": (1, -1, 45), "elbow": (2, +1, 45), "wrist": (3, +1, 150)}
# RUBENS's degrees against the firmware's. Plus is the brush to the right
# for the shoulder as for the elbow (the owner, 2026-09-29: the shoulder
# stands face down, and the pose that reaches the right edge read −15.5°).
# The firmware's −1 for the shoulder was meant to give just that ("right
# plus everywhere"), yet on the machine its minus goes right, as on the MELNICOMM
# pendant (images_CNC_drawing_machine/servo direction.png). RUBENS turns it
# round; once the firmware is flashed with its sign put right, this is +1.
# The wrist: minus left, plus right, as on the pendant.
# The elbow, remounted to lift the brush (new ST3235s, 2026-10-02): plus is
# up — the owner: "at −19.8 it goes up; swap minus and plus".
TURN = {"shoulder": -1, "elbow": -1, "wrist": +1}
# How far RUBENS lets each joint go, in its own degrees. The firmware's
# JOINT_LIMIT is wider (the wrist ±90°) and is not trusted with this: every
# joint move goes through Arm.move_to, and it refuses anything outside.
# The wrist: a USB camera on the holder (2026-09-30, photos
# images_CNC_drawing_machine/photo_2026-09-30 00.42.*) is in the way past
# +10°, clockwise — the owner: "the arm would break the camera". The brush
# now leaves the canvas at −54°, the other way (SWING_DEG; it was +90°).
# Degrees from the brush upright: the wrist's zero was set there the same
# night (it had been 9.4° off); −54° is the brush-off pose he found safe (it
# read −45° on the old zero). +45° since 2026-10-02, for the broom at the
# turns of the Test tab — the owner, on Calibration: "the camera lets it
# squeeze past to +45° the other way; I was careful, there is room up to +45";
# +60° the same afternoon: "add a reserve, ±60° — the camera will take it".
# +180° the same night, the new arm (the owner: "give me the WRIST slider more
# to the plus, to +180 — there is nowhere to grip on the left to lower the
# brush, bristles to the canvas"); a move longer than the firmware's 150° step
# goes in two. Then the working pose taken as zero — the active mode, the
# bristles pressed to the canvas, the wrist +129° from where it had been: from
# there the servo's own 0…4095 is −224…+136°, so −180…+130; and +90 the
# same night, the owner: "cut it boldly to +90°, no further — that is the limit".
# The elbow −5° at most below the active pose (the owner: "−5 max, or it tears
# the canvas or breaks the brush"). With its zero raised 4.7° after midnight,
# −5…0° is the reserve — "the fuel tank, remember? You may, but better not",
# as at the walls: the old zero, −4.7°, lies in it.
# The wrist −120° at most the other way ("not −180").
REACH = {"shoulder": (-45, 45), "elbow": (-5, 45), "wrist": (-120, 90)}
# Where the brush leaves the canvas from the active pose (the owner,
# measured 2026-10-02): the elbow at +15°, plus up; the wrist at +60° — "but
# that is the broom again", so the brush is lifted by the elbow.
# The elbow's +15° was from the first zero; its zero raised 4.7° after
# midnight ("it presses too hard"), so +10° now — measured too, +9.8°: "better
# round it to +10" (the owner).
ELBOW_LIFT_DEG, WRIST_LIFT_DEG = 10, 60
# The brush on and off by the elbow since the new arm: 0° pressed, put away
# at +25° (est.: where the owner left it, 10° past the lift-off).
BRUSH_UP_DEG = 25
# ELBOW LIVE (the owner, 2026-10-28, OPM on the machine: "isn't it time for
# an elbow adjustment right while it draws? Quicker to pull a slider than to
# switch the machine off, take a screwdriver, re-set the pencil or put card
# under the canvas, and DRAW again"): degrees added to every W 2 of the run
# as it is sent — the pressure of the pencil drawing and its height between
# strokes, never the poses a J goes to (a pencil goes in where it always
# does). Within the elbow's reach; this far either way at most; 0 at a start.
TRIM_MAX = 6
# A pencil's elbow resting on the paper (2026-10-28, OPM: "J 2 5: the elbow
# does not get to 5.0°", it stood at +6.1° — a pencil in the holder already
# on the paper above the pose a pencil goes in at; the owner, of the check:
# "can this rule be ignored?"): on a pencil's run (DACHE, PRISMA, OPM) the
# elbow going down and stopped so many degrees above where it was sent at
# most rests on what is under it, and the run goes on — the pencil's pause
# next, the old one out, the elbow down to its pose. The brush, every other
# J: as before, it gets there or the run stops.
REST_MAX = 10
PENCIL_PAGES = ("dache", "prisma", "opm", "opmb", "opms", "opmw", "opmp", "form", "opmn")   # OPM-B, OPM-S and OPM-W OPM's too (2026-10-28); OPM-P's FRAME and DRAW BW (2026-10-29); FORM's, OPM-P's (2026-10-30); OPM-N's, its brush (2026-11-01)
# A wait block's longest: the brush in the cup's paint for a second (the
# owner, 2026-10-03: "1 second is perfect"); ten at most.
WAIT_MAX_S = 10
# The joints a run turns, by J <j> in an arm block and W <j> on a path.
ARM_JOINT = {2: "elbow", 3: "wrist"}
# The brush leaves the canvas with the wrist at ±45° (the owner, on
# Calibration, 2026-10-02: +15° was not enough, it stayed on the canvas);
# short of that it is still on it, tilted.
LIFT_DEG = 45
TICKS_PER_DEG = 4096 / 360
# The working pose, raw servo poses (4096 a turn). calibration.json "arm" is
# the one in use; this is its copy for when the file has none. 2026-09-28,
# late: the owner set the arm to the middle of the field with the handles —
# the elbow 24.6° from the pose of the evening before (2501 · 1759 · 1489).
ARM_ZERO = {"shoulder": 2498, "elbow": 2039, "wrist": 1599}   # the wrist: the brush upright, 2026-09-30


def parse_look(text):
    """'ok V | … | 1: поза 2499, 11,3 В, 31 °C | 2: …' → {1: 2499, 2: …}"""
    return {int(j): int(p) for j, p in re.findall(r"(\d): поза (\d+)", text or "")}


def parse_power(text):
    """the same look → {1: (11.3, 31), …}: every servo's own volts and °C, as it reads them"""
    return {int(j): (int(v) + int(t) / 10, int(c)) for j, v, t, c in re.findall(r"(\d): поза \d+, (\d+),(\d) В, (-?\d+) °C", text or "")}


class ArmError(Exception):
    pass


class ArmSilent(ArmError):
    """A joint, or the zero of all three, the bus would not read past SILENT_WAIT: the servos' 12 V or ground off
    (the owner, 2026-11-11). The runner pauses on it, it does not end the run."""


BUS_TRIES, BUS_GAP = 5, 0.2   # a read or a reply lost: asked again, about a second in all, before it counts
# The owner, 2026-11-11, the arm silent at the elbow's lifts on the red classic's run (00:34, J 2 12; 01:36, J 2 32.5; the night before in DRAW BW): "it looks like
# there is no [lack of] 12 V, just a heavy load; I touch nothing, the wire is well in" — asked to lift the elbow slower and wait longer before an error: "both".
# ELBOW_UP_SPEED: the elbow up in the air (a dip, the brush up after a row) at so many °/s, not the firmware's ~53, the peak current less (est.); the lift on
# the move (W on the path) untouched, it is the stroke's own. SILENT_WAIT: a joint silent at a move is waited for so long, asked every second, before it
# counts — at 00:34 all three were silent about 80 s, then answered by themselves (est.).
ELBOW_UP_SPEED, SILENT_WAIT, SILENT_GAP = 28.0, 90.0, 1.0


class Arm:
    """The arm in RUBENS's own degrees: 0° is the working pose (ARM_ZERO).

    The firmware takes a joint's zero from wherever it stands at the first
    command after power-on; twice on 2026-09-28 that sent the brush to 180°.
    The servos read their own pose, so RUBENS never sends the firmware an
    absolute angle: it reads where the joint really is, sets the firmware's
    zero there (Z — nothing moves, the other joints hold where they are) and
    sends the difference, in steps within the joint's limit. Whatever zero the
    board took, the arm goes where RUBENS says. Servos cannot be stopped by
    STOP; a move takes up to about 2 s (MOVE_SPEED, ~53°/s).
    """

    def __init__(self, send, zero=lambda: ARM_ZERO, sleep=time.sleep, guard=lambda: None, note=lambda what: None, clock=None):
        # guard() → the cup at hand's forks while it is on (hand_guard), else None: hand_refuses
        # note(what): a read or a reply the bus lost and got over, for the journal
        # clock(): seconds, for the waits of a silent arm (patient): the real clock; with a sleep not the real one (the tests), the time slept
        self.send, self.zero, self.guard, self.note = send, zero, guard, note
        self.slept = 0.0
        def nap(dt):
            self.slept += dt
            sleep(dt)
        self.sleep = nap
        self.clock = clock or (time.monotonic if sleep is time.sleep else lambda: self.slept)
        self.lock = threading.Lock()
        self.stopped = threading.Event()   # set by stop(): a move under way gives up
        self.power, self.power_t = {}, None   # the servos' own volts and °C at the last look that read them, and when (time.time())

    def stop(self):
        """STOP for the arm (2026-10-02): a slow stroke stays where it is.
        Not under the lock — it must get through while a move waits."""
        self.stopped.set()
        return self.send("/hold")

    def angles(self, need=()):
        # need: joints worth asking again for (the owner, 2026-11-04: one silent read stopped a
        # six-hour run). Silent for about a second, the 12 V may well be off: the caller's to say.
        for n in range(BUS_TRIES):
            text = self.send("/look")
            raw, z = parse_look(text), self.zero()
            pw = parse_power(text)
            if pw:
                self.power = {k: pw[jid] for k, (jid, _, _) in JOINTS.items() if jid in pw}
                self.power_t = time.time()
            out = {}
            for k, (jid, sign, _) in JOINTS.items():
                out[k] = None if jid not in raw else round(TURN[k] * sign * (raw[jid] - z[k]) / TICKS_PER_DEG, 1)
            silent = [k for k in need if out[k] is None]
            if not silent or self.stopped.is_set() or n == BUS_TRIES - 1:
                break
            self.note(f"look: {', '.join(silent)} silent, asked again")
            self.sleep(BUS_GAP)
        return out, raw

    def power_note(self):
        # for the journal: every servo's volts and °C at the last look that read them, and how long ago (the owner, 2026-11-11, "yes":
        # to see whether the 12 V sags before the bus goes silent)
        if not self.power:
            return {}
        return {"volts": {k: v for k, (v, _) in self.power.items()}, "temp_c": {k: c for k, (_, c) in self.power.items()},
                **({"look_s_ago": round(time.time() - self.power_t, 1)} if self.power_t else {})}

    def patient(self, need, joint):
        # angles(need); a joint still silent waited for, SILENT_WAIT at most by the clock, noted every 10 s, then given back as it is (the
        # caller says it does not answer). The wait by the clock, not by the sleeps counted: a read of a silent bus is slower than its
        # gaps, and the count had said "50 s of 90" at 86 s (the night of 2026-11-11)
        t0, noted = self.clock(), None
        while True:
            ang, raw = self.angles(need=need)
            silent = [k for k in need if ang[k] is None]
            waited = self.clock() - t0
            if not silent or self.stopped.is_set() or waited >= SILENT_WAIT:
                return ang, raw
            if noted is None or waited - noted >= 10:
                noted = waited
                self.note(f"{', '.join(silent)} silent at the {joint}'s move: waiting, {waited:.0f} s of {SILENT_WAIT:.0f}")
            self.sleep(SILENT_GAP)

    def rezero_patient(self):
        # rezero; a joint the board could not read waited for as patient() does, by the clock
        t0, noted = self.clock(), False
        while True:
            try:
                return self.rezero()
            except ArmError:
                if self.stopped.is_set() or self.clock() - t0 >= SILENT_WAIT:
                    raise
                if not noted:
                    noted = True
                    self.note(f"zero: a joint silent, waiting up to {SILENT_WAIT:.0f} s")
                self.sleep(SILENT_GAP)

    def rezero(self):
        # Z: the zero of all three where they stand, nothing moves. A joint the board could not read
        # keeps its old zero and answers "ok Z 2": the step after it would count from there.
        for n in range(BUS_TRIES):
            r = self.send("/zero")
            if r.strip() == f"ok Z {len(JOINTS)}":
                return
            if not (r == NO_REPLY or r.startswith("ok Z")) or self.stopped.is_set():
                break
            self.note(f"zero: {in_english(r)}, asked again")
            self.sleep(BUS_GAP)
        silent = (r == NO_REPLY or r.startswith("ok Z")) and not self.stopped.is_set()   # a joint the board could not read: the bus silent
        raise (ArmSilent if silent else ArmError)(f"arm zero: {in_english(r)}")

    def move_to(self, joint, deg, speed=None, within=0.6, fork=None):
        """speed: degrees a second, for a slow stroke of the brush; None — the
        firmware's own, about 53°/s. within: how near counts as there — the
        firmware turns whole degrees; the shoulder back from a dip is let off
        more (DIP_WITHIN). fork (lo, hi): there anywhere in it, every step
        landing in it — the cup at hand's dips (README, How to dip). Refused
        when the cup at hand forbids it (hand_refuses). → the angle it stands at."""
        jid, sign, lim = JOINTS[joint]
        lo, hi = REACH[joint]
        if not lo <= deg <= hi:
            raise ArmError(f"the {joint} may go {lo}…+{hi}° only, not {deg:+g}°"
                           + (f": the camera is in the way past +{hi}°" if joint == "wrist" and deg > hi else ""))
        with self.lock:
            self.stopped.clear()
            for _ in range(6):
                if self.stopped.is_set():
                    raise ArmError(f"the {joint} stopped: STOP")
                g = self.guard()
                ang, raw = self.patient(tuple(JOINTS) if g else (joint,), joint)
                if ang[joint] is None:
                    if self.stopped.is_set():
                        raise ArmError(f"the {joint} stopped: STOP")
                    raise ArmSilent(f"the {joint} does not answer: is the 12 V on?")
                a = ang[joint]
                d = deg - a
                # whole degrees from where it stands, and no step past the reach
                step = round(d)
                if fork and abs(d) <= lim:                 # a fork 1° wide or more: some whole step lands in it
                    step += 1 if a + step < fork[0] else -1 if a + step > fork[1] else 0
                step = min(step, math.floor(hi - a + 1e-9)) if step > 0 else max(step, math.ceil(lo - a - 1e-9))
                step = max(-lim, min(lim, step))
                if (fork[0] <= a <= fork[1] if fork else abs(d) < within) or step == 0:
                    if fork and not fork[0] <= a <= fork[1]:
                        raise ArmError(f"the {joint} stands at {a:+.1f}°, not in {fork[0]:+g}…{fork[1]:+g}°")
                    return a
                why = g and hand_refuses(joint, a, a + step, ang, g)
                if why:
                    raise ArmError(why)
                self.rezero_patient()
                fw = TURN[joint] * step                    # the firmware's degrees
                v = speed or (ELBOW_UP_SPEED if joint == "elbow" and step > 0 else None)   # the elbow up in the air, slower (ELBOW_UP_SPEED)
                r = self.send(f"/servo?j={joint}&d={fw}" + (f"&v={v:g}" if v else ""))
                if r == NO_REPLY:                          # on its way or not, the next look tells; this loop sends it again if not
                    self.note(f"{joint}: no answer to J, looking where it stands")
                elif not r.startswith("ok J"):
                    raise ArmError(f"{joint}: {in_english(r)}")
                self._settle(jid, raw[jid] + sign * fw * TICKS_PER_DEG, abs(fw) / v + 2 if v else 4.0)
            raise ArmError(f"the {joint} does not get to {deg}°")

    def hold(self):
        # After power-on the shoulder and elbow hold only once commanded
        # (2026-09-28: the shoulder was dragged 67°). Z moves nothing, and a
        # zero step of the wrist then makes the board send all three poses.
        with self.lock:
            self.rezero()
            for n in range(BUS_TRIES):                     # a zero step: asked again it does no harm
                r = self.send("/servo?j=wrist&d=0")
                if r.startswith("ok J"):
                    return
                if r != NO_REPLY:
                    break
                self.sleep(BUS_GAP)
            raise ArmError(f"wrist: {in_english(r)}")

    def _settle(self, jid, target, longest=4.0):
        # until the servo is there, or stands still (held back by something),
        # or STOP; a slow stroke may take longer than 4 s
        last, t = None, 0.0
        while t < longest and not self.stopped.is_set():
            self.sleep(0.15)
            t += 0.15
            p = parse_look(self.send("/look")).get(jid)
            if p is None:                                  # a read lost: the servo is no less on its way
                continue
            if abs(p - target) <= 6 or (last is not None and abs(p - last) <= 1 and t > 0.6):
                return
            last = p


# The cup at hand (INK-Y; README, How to dip — the owner, 2026-11-03: "if the
# shoulder turns instead of the elbow lifting, we can break the brush or knock
# the jar over, and then the paint spills onto the canvas"): while it is on,
# every turn of the arm, a run's or a jog's, is checked here first. The
# shoulder turns only with the elbow up in its fork; with the shoulder off 0
# the elbow goes no lower than the paint's +14° and the wrist stays.
GUARD_SLACK = 0.2      # the servo's read a tick or two either side of where it was let off


def hand_refuses(joint, at, to, ang, g):
    """Why the cup at hand forbids this turn of `joint` from `at` to `to`
    (the arm's angles `ang`, the forks `g`), or None."""
    e, s = ang.get("elbow"), ang.get("shoulder")
    lo, hi = g["up"]
    if joint == "shoulder" and (e is None or not lo - GUARD_SLACK <= e <= hi + GUARD_SLACK):
        return (f"the shoulder turns only with the elbow up, +{lo:g}…+{hi:g}° (it is at {'—' if e is None else f'{e:+.1f}°'}): "
                "the jar is by the brush — lift the elbow first (README, How to dip)")
    turned = s is None or abs(s) > DIP_WITHIN
    if joint == "elbow" and turned and to < g["floor"] - 1e-9:
        return f"the elbow goes no lower than +{g['floor']:g}° with the shoulder off 0 ({'—' if s is None else f'{s:+.1f}°'}): the jar"
    if joint == "wrist" and turned:
        return f"the wrist turns only with the shoulder at 0 ({'—' if s is None else f'{s:+.1f}°'}): the brush may be in the jar"
    return None


def hand_guard(path=None):
    # ink.json's cup at hand while it is on: {"up": (lo, hi), "floor": 14}, else None — read again when
    # the file changes; on with a fork it cannot read, his own (HAND_UP): never off by a typo
    path = path or FILES["/ink"]
    try:
        t = os.stat(path).st_mtime_ns
    except OSError:
        return None
    if _HAND[0] != (path, t):
        try:
            with open(path, encoding="utf-8") as f:
                h = (json.load(f) or {}).get("hand") or {}
            on = h.get("on") is True
        except (OSError, ValueError, AttributeError):
            h, on = {}, False
        _HAND[:] = [(path, t), {"up": fork_of(h.get("up"), "elbow") or HAND_UP, "floor": PAINT_FLOOR} if on else None]
    return _HAND[1]


_HAND = [None, None]


def parse_ping(text):
    """'ok P X <steps>[ край] Y <steps>[ край][ путь <n>]' → dict, or None.
    x, y are None without a zero; path is None when no path is running."""
    m = re.match(r"^ok P X (\S+)(?: край)? Y (\S+)(?: край)?(?: путь (\d+))?", text or "")
    if not m:
        return None
    num = lambda v: None if v == "?" else int(v)
    return {"x": num(m.group(1)), "y": num(m.group(2)),
            "path": None if m.group(3) is None else int(m.group(3))}


class Abort(Exception):
    pass


LIVE = ("running", "stopping", "pausing", "paused")   # a run the page must not start over
# A silent arm pauses the run (the owner, 2026-11-11, of all three servos silent at once mid-run and back when the carriage was moved: "yes, I allow
# it" — the run paused in place, Continue the same move again, no STOP and HOME, no cell lost; the servos' volts in the journal). What the pause says:
ARM_SILENT_SAY = ("ARM SILENT: {who} — the servos' 12 V or ground is off. Check the board's 12 V terminal and its switch, "
                  "the servo cable's plugs at the board and at the arm. When they answer, Continue: the same move again"
                  " (the carriage moved meanwhile: the brush up and back to its place first)")
ARM_BACK_SAY = "The arm answers again{volts}: Continue — the same move again"
SILENT_LOOK_S = 2.0      # paused on a silent arm: asked every so many seconds whether it answers again
MOVED_MM = 0.5           # the carriage farther than this from where the arm went silent: back there before the move again
SWING_DEG = -54                                         # brush off: the wrist to −54° (src/machine.js; +90° until the camera, 2026-09-30)
ON_PATH_MM = 0.5                                        # a braked carriage stands on its path


def _near_line(q, a, b):
    ab = (b[0] - a[0], b[1] - a[1])
    L2 = ab[0] ** 2 + ab[1] ** 2
    t = 0.0 if L2 == 0 else max(0.0, min(1.0, ((q[0] - a[0]) * ab[0] + (q[1] - a[1]) * ab[1]) / L2))
    return math.hypot(q[0] - a[0] - ab[0] * t, q[1] - a[1] - ab[1] * t)


def _near_arc(q, a, c, b, turn):
    # the board's arc: radius from its start, from the start angle to the
    # end's angle, turning from +X towards +Y when turn > 0
    r = math.hypot(a[0] - c[0], a[1] - c[1])
    a0, a1, aq = (math.atan2(p[1] - c[1], p[0] - c[0]) for p in (a, b, q))
    TAU = 2 * math.pi
    sweep = (a1 - a0) % TAU if turn > 0 else -((a0 - a1) % TAU)
    along = (aq - a0) % TAU if turn > 0 else (a0 - aq) % TAU
    if along <= abs(sweep):
        return abs(math.hypot(q[0] - c[0], q[1] - c[1]) - r)
    return min(math.hypot(q[0] - a[0], q[1] - a[1]), math.hypot(q[0] - b[0], q[1] - b[1]))


def path_pieces(start, path):
    """The pieces of a path (L, M, A commands, the first from `start`) as the
    board runs them: start, end, length in mm; an arc's radius from its
    start, its sweep from the start angle to the end's (firmware path.h)."""
    TAU = 2 * math.pi
    out, at = [], start
    for c in path:
        p = c.split()
        if p[0] in ("L", "M"):
            end = (float(p[1]), float(p[2]))
            out.append({"a": at, "b": end, "len": math.hypot(end[0] - at[0], end[1] - at[1])})
        else:
            cen, end, turn = (float(p[1]), float(p[2])), (float(p[3]), float(p[4])), int(p[5])
            r = math.hypot(at[0] - cen[0], at[1] - cen[1])
            a0 = math.atan2(at[1] - cen[1], at[0] - cen[0])
            s = math.atan2(end[1] - cen[1], end[0] - cen[0]) - a0
            if turn > 0:
                while s <= 0:
                    s += TAU
                while s > TAU:
                    s -= TAU
            else:
                while s >= 0:
                    s -= TAU
                while s < -TAU:
                    s += TAU
            out.append({"a": at, "b": end, "c": cen, "r": r, "a0": a0, "sweep": s, "len": abs(s) * r})
        at = end
    return out


def plan_picture(blocks, info, note=None):
    """The iPhone's mini-screen (the owner, 2026-11-04: "a tab with the yellow
    PROGRESS and a mini-screen with the picture; in six and a half hours I may
    be anywhere"): the run as the brush paints it, read off its blocks. Every
    row of the page's rows: its colour `c`, its paint `mm`, `b` its last block, and `p`, its painted
    lines, each a flat [x, y, x, y …] of the carriage in half millimetres, a
    straight stretch two points. Reads only; nothing here moves."""
    rows = (info or {}).get("rows") or []
    out = [{"c": r.get("c") if isinstance(r, dict) else None, "mm": 0.0, "p": []} for r in rows]

    def thin(line):
        # the tails' pieces one stretch; a snake's turn back along itself stays
        kept = line[:2]
        for q in line[2:]:
            a, b = kept[-2], kept[-1]
            u, v = (b[0] - a[0], b[1] - a[1]), (q[0] - b[0], q[1] - b[1])
            if abs(u[0] * v[1] - u[1] * v[0]) <= math.hypot(*u) + math.hypot(*v) and u[0] * v[0] + u[1] * v[1] >= 0:
                kept[-1] = q
            else:
                kept.append(q)
        return [n for q in kept for n in q]

    at = None
    for b in blocks:
        path = [c for c in b.get("cmds") or [] if c[0] in "LAM"] if b.get("kind") == "move" else []
        if not path:
            continue
        r, mm = b.get("row"), b.get("paintMM") or 0
        if isinstance(r, int) and not isinstance(r, bool) and 0 < r <= len(out) and mm > 0:
            row, marks, line = out[r - 1], b.get("painted") or [], []
            row["mm"] += mm
            for j, g in enumerate(path_pieces(at or block_end(path[:1]), path)):
                if not (marks[j] if j < len(marks) else True):
                    if len(line) > 1:
                        row["p"].append(thin(line))
                    line = []
                    continue
                pts = [g["b"]]
                if "c" in g:      # an arc, a point every ~5 mm
                    n = max(1, math.ceil(g["len"] / 5))
                    pts = [(g["c"][0] + g["r"] * math.cos(g["a0"] + g["sweep"] * k / n),
                            g["c"][1] + g["r"] * math.sin(g["a0"] + g["sweep"] * k / n)) for k in range(1, n)] + pts
                if not line:
                    pts = [g["a"]] + pts
                line += [(round(p[0] * 2), round(p[1] * 2)) for p in pts]
            if len(line) > 1:
                row["p"].append(thin(line))
        at = block_end(path) or at
    for i, blk in enumerate(blocks):     # `b`: the row's last block, for the steps to a colour's end (PACE_MIN_S, 2026-11-12)
        r = blk.get("row")
        if isinstance(r, int) and not isinstance(r, bool) and 0 < r <= len(out):
            out[r - 1]["b"] = i
    for row in out:
        row["mm"] = round(row["mm"], 1)
    note = note or {}
    m = re.search(r"(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) mm", str(note.get("label") or ""))
    return {"ok": True, "blocks": len(blocks), "paint_mm": round(sum(b.get("paintMM") or 0 for b in blocks if b.get("kind") == "move"), 1),
            "estimate_s": note.get("estimate_s"), "here": note.get("here"), "canvas": [float(m[1]), float(m[2])] if m else None,
            "colours": (info or {}).get("colours") or [], "rows": out}


def along_piece(pc, q):
    """How far along a piece (path_pieces) the point q is, mm, held to the piece."""
    if "c" not in pc:
        (ax, ay), (bx, by), L = pc["a"], pc["b"], pc["len"]
        if L == 0:
            return 0.0
        return max(0.0, min(1.0, ((q[0] - ax) * (bx - ax) + (q[1] - ay) * (by - ay)) / (L * L))) * L
    TAU = 2 * math.pi
    ang = math.atan2(q[1] - pc["c"][1], q[0] - pc["c"][0])
    d = (ang - pc["a0"]) % TAU if pc["sweep"] > 0 else (pc["a0"] - ang) % TAU
    S = abs(pc["sweep"])
    if d > S:                                    # just before the start, or past the end
        d = 0.0 if d > (S + TAU) / 2 else S
    return d * pc["r"]


def painted_so_far(track, done, here):
    """The painted length of a block by now, mm: the pieces the board has run
    whole, and on the piece it is running, how far along it the carriage is.
    track: (pieces, painted length of each — 0 for a turn —, their sum)."""
    geo, plen, _ = track
    done = max(0, min(len(geo), done))
    got = sum(plen[:done])
    if done < len(geo) and plen[done] and here is not None:
        got += min(plen[done], along_piece(geo[done], here))
    return got


def rest_of(cmds, j):
    """A move block's commands from its piece j on, with the speed in force
    at that piece first: speeds change inside a pass (a tight arc slower),
    and a pass that goes on after a pause must keep them. A W rides on the
    piece after it: those on pieces up to j have turned the wrist already
    (Continue puts it back), the later ones go on with their pieces."""
    rest, speed, k, wrist = [], None, -1, []
    for c in cmds:
        if c == "G":
            continue
        if c[0] in "FT":
            if k < j:
                speed = c
            else:
                rest.append(c)
            continue
        if c[0] == "W":
            wrist.append(c)
            continue
        k += 1
        if k > j:
            rest.extend(wrist)
        wrist = []
        if k >= j:
            rest.append(c)
    return ([speed] if speed else []) + rest + ["G"]


def from_piece(cmds, j):
    """A move block's commands from its piece j on, as rest_of, and the W
    riding on piece j itself too: a cell gone back to lands as the plan has
    it there (OPM-N's Back, Skip, Go to, 2026-11-02)."""
    rest, speed, k, wrist = [], None, -1, []
    for c in cmds:
        if c == "G":
            continue
        if c[0] in "FT":
            if k < j:
                speed = c
            else:
                rest.append(c)
            continue
        if c[0] == "W":
            wrist.append(c)
            continue
        k += 1
        if k >= j:
            rest.extend(wrist)
            rest.append(c)
        wrist = []
    return ([speed] if speed else []) + rest + ["G"]


def arm_at_piece(cmds, j, joint=2):
    """A joint's angle in force on piece j of a move block, in RUBENS's
    degrees: the last W <joint> riding on a piece up to j — the elbow by
    default, which lifts the brush. None — no W for it so far."""
    deg, k, wait = None, -1, None
    for c in cmds:
        if c[0] == "W":
            p = c.split()
            if int(p[1]) == joint:
                wait = float(p[2])
        elif c[0] in "LAM":
            k += 1
            if k > j:
                break
            if wait is not None:
                deg, wait = wait, None
    return deg


def arm_check(cmd):
    """Why a run's J or W is refused, or None: a joint a run does not turn,
    an angle past REACH."""
    p = cmd.split()
    try:
        name, deg = ARM_JOINT.get(int(p[1])), float(p[2])
    except (IndexError, ValueError):
        return f"{cmd}: J or W <2|3> <degrees>"
    if name is None:
        return f"{cmd}: a run turns the elbow (2) or the wrist (3), nothing else"
    lo, hi = REACH[name]
    if not lo <= deg <= hi:
        return f"{cmd}: the {name} may go {lo}…+{hi}° only" + (f", the camera is in the way past +{hi}°" if name == "wrist" and deg > hi else "")
    return None


def piece_at(start, path, here, first=0):
    """Which piece of a path (L, M, A commands, the first starting at
    `start`) the carriage stands on, from piece `first` on — where a braked
    pass goes on from. None if it is on none of them."""
    at = start
    for j, c in enumerate(path):
        p = c.split()
        if p[0] in ("L", "M"):
            end = (float(p[1]), float(p[2]))
            d = _near_line(here, at, end)
        else:
            end = (float(p[3]), float(p[4]))
            d = _near_arc(here, at, (float(p[1]), float(p[2])), end, int(p[5]))
        if j >= first and d <= ON_PATH_MM:
            return j
        at = end
    return None


# DIP's travel to the cup and back when the run's note has none, mm/s (the pages' 180)
TRAVEL_DIP = 180
# DIP's turn of the shoulder to the cup at hand when the note has none, °/s (the pages' HAND.swing, est.)
SWING_DIP = 40
# The elbow in the cup at hand: never lower (the owner, 2026-11-03: "the jar stands over the canvas, so the
# ELBOW can go down to +15° at most … the fork set by the paint in the jar, but at most +14° +16°")
PAINT_FLOOR, PAINT_TOP = 14, 16
HAND_UP = (30.0, 35.0)   # the elbow up, before the shoulder turns: his fork (the pages' HAND.up)
# How near the shoulder back from a dip counts as at 0°, degrees (the pages' SHOULDER_WITHIN, est.). The owner,
# 2026-11-03, the first run with INK-Y: back from the cup it stood at −0.6°, a 1° nudge did not move it, and
# the run stopped ("does not get to 0.0°") — "maybe just ignore such deviations?". Whole degrees' steps
# leave up to 0.5° and the servo ~0.6° more; every one off 0.6° or more goes to the journal ("near").
DIP_WITHIN = 1.5


def fork_of(f, joint):
    # a fork [lo, hi] a joint counts as there in: numbers, 1° wide at least (a whole step always lands in it), within reach
    try:
        lo, hi = (float(v) for v in f)
    except (TypeError, ValueError):
        return None
    ok = math.isfinite(lo) and math.isfinite(hi) and hi - lo >= 1 and REACH[joint][0] <= lo and hi <= REACH[joint][1]
    return (lo, hi) if ok else None


def cup_of(c):
    # the cup a run note carries, where the brush dips: the Ink tab's — its
    # carriage mm, the elbow over its rim and in it — or INK-Y's at hand (the
    # owner, 2026-11-03; README, How to dip): on the carriage by the arm, no
    # place, the elbow's fork up, the shoulder's to the jar, the elbow in the
    # paint, the shoulder's speed; the dwell; None if anything is missing or
    # out of reach
    try:
        if c.get("hand") is True:
            up, to = fork_of(c.get("up"), "elbow"), fork_of(c.get("to"), "shoulder")
            dip, dwell, swing = float(c["dip"]), float(c.get("dwell", 1)), float(c.get("swing", SWING_DIP))
            if not (up and to and math.isfinite(dip + dwell + swing)) or not 0 <= dwell <= WAIT_MAX_S or not 0.5 <= swing <= 100:
                return None
            if not PAINT_FLOOR <= dip <= PAINT_TOP or up[0] < PAINT_TOP + 5 or (to[0] <= DIP_WITHIN and to[1] >= -DIP_WITHIN):
                return None
            return {"hand": True, "up": up, "to": to, "dip": dip, "paint": (max(PAINT_FLOOR, dip - 1), min(PAINT_TOP, dip + 1)),
                    "dwell": dwell, "swing": swing, "rim": (up[0] + up[1]) / 2}
        y, rim, dip = (float(c[k]) for k in ("y", "rim", "dip"))
        x = float(c["x"])
        dwell = float(c.get("dwell", 1))
    except (TypeError, KeyError, ValueError, AttributeError):
        return None
    if not all(math.isfinite(v) for v in (x, y, rim, dip, dwell)) or not 0 <= dwell <= WAIT_MAX_S:
        return None
    if arm_check(f"J 2 {rim:g}") or arm_check(f"J 2 {dip:g}") or dip >= rim:
        return None
    return {"x": x, "y": y, "rim": rim, "dip": dip, "dwell": dwell}


def remote_key(path=None):
    # the iPhone's key: the one in remote.key, or a new one written there —
    # the same across restarts, so the iPhone's icon keeps working
    path = path or KEY_FILE
    try:
        with open(path, encoding="utf-8") as f:
            k = f.read().strip()
        if len(k) >= 8:
            return k
    except OSError:
        pass
    k = secrets.token_urlsafe(9)
    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(k + "\n")
        os.chmod(path, 0o600)
    except OSError:
        pass
    return k


_LAN = {"ip": None, "at": 0.0}


def lan_ip():
    # this Mac's address on the home network (nothing is sent: a UDP socket
    # only looks the way out up); looked again a minute later
    if _LAN["ip"] and time.time() - _LAN["at"] < 60:
        return _LAN["ip"]
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.254.254.254", 1))
        _LAN["ip"], _LAN["at"] = s.getsockname()[0], time.time()
    except OSError:
        _LAN["ip"] = None
    finally:
        s.close()
    return _LAN["ip"]


def run_log(entry, path=None):
    """The run journal (the owner, 2026-10-02: "maybe keep logs, a journal of
    the settings?"): a JSON line for each start — with the settings the page
    sent — pause, Continue and end, appended to logs/runs.jsonl. It never
    fails a run."""
    path = path or LOG_FILE
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps({"at": time.strftime("%Y-%m-%d %H:%M:%S"), **entry}, ensure_ascii=False) + "\n")
    except (OSError, TypeError, ValueError):
        pass


class Runner:
    """Runs the machine blocks of job.json on the board (Rubens_v2.md,
    section 6: the job is run here, not by the page).

    A block is either {"kind": "arm", "cmd": "J 3 <deg>"} — the wrist swings
    the brush off or onto the canvas — or, for Rembrandt's arm strokes
    (2026-10-02), {"kind": "joint", "joint": "shoulder"|"elbow", "deg": d,
    "speed": deg/s} — a joint turns at that speed, the brush on or off as it
    is, the axes still — or {"kind": "pause", "why": "..."}: the brush off,
    the run waits for Continue (paint for the brush); or {"kind": "wait", "s": 1}:
    everything stands that long — the brush in the cup's paint (INK ON on the
    Test tab, 2026-10-03); or {"kind": "move", "cmds": [...]}: a
    speed (F or T), path pieces (L, A, M) and G. Pieces go to the board until
    its queue is full; then G, and the rest follow as the queue empties. The
    block is over when the ping no longer says "путь". Every command and ping
    feeds the board's watchdog, so a dead runner stops the axes by itself.

    send(path) -> reply is board_get, a machine address; the tests pass a
    fake board.
    """

    def __init__(self, send, sleep=time.sleep, swing_s=1.8, arm=None, log=None, clock=time.monotonic):
        self.send, self.sleep, self.swing_s, self.arm, self.clock = send, sleep, swing_s, arm, clock
        self.log = log or (lambda entry: None)     # run_log in the server
        self.lock = threading.Lock()
        self.state, self.message = "idle", ""
        self.blocks, self.block = [], 0
        self.paint_total = self.painted = 0.0
        self.pos = None                  # last ping: {"x", "y", "path"}
        self.started = None              # time.time() of the last start
        self.brush_on = False
        self.lift = 0                    # the elbow's last angle with the brush on: Continue puts it back
        self._stop = None                # None, "S" or "K"
        self._pause = False              # Pause asked for; Continue clears it
        self._pencil = False             # that pause the pencil's, p-pause: nothing lifted (DACHE, 2026-10-27)
        self.trim = 0.0                  # ELBOW LIVE: degrees on every W 2 as it is sent (2026-10-28)
        self.page = None                 # the page that started the run (its log note): a pencil's, the elbow may rest
        self._wbase = {}                 # the joints where a move's W were taken from (_arm_steps)
        # OPM-N's DIP (the owner, 2026-11-01: "I will press the button 'dip into paint' as the
        # cells get painted"): the cup the run was started with, and its travel speed
        self.cup, self.travel = None, TRAVEL_DIP
        self._dip = False                # a dip asked for
        self._auto = False               # that pause the dip's own: Continue by itself after it
        self.dips = 0                    # the dips asked for in this run
        self.rows = None                 # the page's rows, for the iPhone: {"colours": [...], "rows": [{"c", "cells"}]}
        self.note, self._picture = None, None   # the run's label, Here and estimate, and its picture once asked (plan_picture)
        self._jump = None                # Back, Skip, Go to: (block, piece or None, what) to go on from
        self.row, self.row_base = 0, {}  # the row run last, and the paint done before every row
        # INK-Y: (rim, °/s, the elbow's fork up) while a dip holds the shoulder turned over the cup at
        # hand — the elbow up, then the shoulder back, by itself before a jump and at the next run's start
        self._swung = None
        self._silent = None              # paused on a silent arm: the joints silent (_silent_pause)
        self._pace_s, self._pace_n, self._mark = 0.0, 0, None   # PACE_MIN_S: the seconds run, the steps in them, the last block's start (clock, block)

    def _pace_break(self):
        # a pause, a jump, a silent arm: the time from the last block's start not counted
        with self.lock:
            self._mark = None

    def pace(self):
        # seconds a step on this run's own clock, once there are enough of them
        return round(self._pace_s / self._pace_n, 3) if self._pace_s >= PACE_MIN_S and self._pace_n >= PACE_MIN_STEPS else None

    def set_trim(self, deg):
        # ELBOW LIVE: from the next W 2 sent on, the board's queue of pieces
        # still as it was
        d = float(deg)
        if not math.isfinite(d):
            raise ValueError(deg)
        t = max(-TRIM_MAX, min(TRIM_MAX, round(d, 1)))
        with self.lock:
            self.trim = t
        self.log({"event": "trim", "deg": t, "block": self.block})
        return t

    def _trimmed(self, c):
        # a W 2 as _arm_steps made it (the firmware's degrees from where the
        # elbow stood), the trim on it, the elbow kept within its reach
        p = c.split()
        if len(p) < 3 or p[0] != "W" or p[1] != "2" or not self.trim:
            return c
        turn, a = (TURN["elbow"], self._wbase.get("elbow", 0.0)) if self.arm else (1, 0.0)
        lo, hi = REACH["elbow"]
        deg = min(hi, max(lo, a + float(p[2]) / turn + self.trim))
        p[2] = f"{turn * (deg - a):.1f}"
        return " ".join(p)

    def status(self):
        with self.lock:
            pct = 100.0 * self.painted / self.paint_total if self.paint_total else 0.0
            pos = self.pos or {}
            mm = lambda a, i: None if pos.get(a) is None else pos[a] / STEPS_PER_MM[i]
            return {"state": self.state, "message": self.message, "block": self.block,
                    "blocks": len(self.blocks), "painted_mm": round(self.painted, 1),
                    "paint_mm": round(self.paint_total, 1), "percent": round(pct, 1),
                    "x_mm": mm("x", 0), "y_mm": mm("y", 1), "brush_on": self.brush_on,
                    "started": self.started, "trim": self.trim, "row": self.row,
                    "in_row": round(self.painted - self.row_base.get(self.row, self.painted), 1),
                    "dips": self.dips, "cup": bool(self.cup), "silent": self._silent,
                    "pace_s": self.pace(), "run_s": round(self._pace_s), "run_steps": self._pace_n,
                    "hand": 1}   # this runner knows the cup at hand (INK-Y), its forks and its guard: the pages ask before such a run

    def where(self):
        # the colour and the cell now, by the page's rows: the row run last,
        # the paint done in it; at a pause the next colour too (the iPhone)
        st = self.status()
        info = self.rows or {}
        rows, cols = info.get("rows") or [], info.get("colours") or []
        here = rows[st["row"] - 1] if 0 < st["row"] <= len(rows) else None
        k = here.get("c") if isinstance(here, dict) else None
        col = cols[k] if isinstance(k, int) and 0 <= k < len(cols) else None
        cell = None
        for q in (here or {}).get("cells") or []:
            if q[1] <= st["in_row"] + 0.05:
                cell = q[0]
        nxt = None
        if st["state"] in ("pausing", "paused") and not self._silent:      # a silent arm's pause is no change of paint
            for b in self.blocks[self.block:]:
                r = b.get("row") or 0
                if 0 < r <= len(rows) and rows[r - 1].get("c") != k:
                    c2 = rows[r - 1].get("c")
                    nxt = cols[c2] if isinstance(c2, int) and 0 <= c2 < len(cols) else None
                    break
        return {**st, "colour": col, "colour_n": None if k is None else k + 1, "colours": len(cols), "cell": cell, "next": nxt,
                "estimate_s": (self.note or {}).get("estimate_s")}

    def picture(self):
        # the iPhone's mini-screen, worked out once a run, when it is asked for
        with self.lock:
            blocks, info, note, pic, started = self.blocks, self.rows, self.note, self._picture, self.started
        if pic is not None:
            return pic
        if not blocks or not info:
            return {"ok": False, "message": "no run with rows"}
        pic = {**plan_picture(blocks, info, note), "started": started}
        with self.lock:
            if self.started == started:
                self._picture = pic
        return pic

    def start(self, blocks, note=None):
        # Every J and W within reach, before anything is sent. A job that puts
        # the brush away with the wrist (−54°, before the new arm of
        # 2026-10-02) would only turn it on the canvas now: refused too.
        for b in blocks:
            for c in (b.get("cmds") or []) if b.get("kind") == "move" else []:
                if c[0] == "W" and arm_check(c):
                    return False, arm_check(c)
            if b.get("kind") in ("arm", "joint") and "fork" in b:
                # the cup at hand's: the joint there anywhere in it, its angle inside
                j = b.get("joint") if b["kind"] == "joint" else ARM_JOINT.get(int(b["cmd"].split()[1])) if not arm_check(b["cmd"]) else None
                f = fork_of(b["fork"], j) if j in ("elbow", "shoulder") else None
                deg = b.get("deg") if b["kind"] == "joint" else float(b["cmd"].split()[2]) if j else None
                if f is None or not isinstance(deg, (int, float)) or not f[0] <= deg <= f[1]:
                    return False, f"a fork must be the elbow's or the shoulder's, 1° wide at least, within reach, round its angle: {b.get('cmd') or b.get('joint')} {b['fork']}"
            if b.get("kind") == "arm":
                if arm_check(b["cmd"]):
                    return False, arm_check(b["cmd"])
                if b["cmd"].split()[1] == "3" and float(b["cmd"].split()[2]) == SWING_DEG:
                    return False, (f"{b['cmd']}: this job puts the brush away with the wrist, as before the new arm; "
                                   "the elbow lifts it now (2026-10-02) — the Job tab is not made for it yet.")
            if b.get("kind") == "wait":
                w = b.get("s")
                if isinstance(w, bool) or not isinstance(w, (int, float)) or not 0 <= w <= WAIT_MAX_S:
                    return False, f"a wait must be 0…{WAIT_MAX_S} s, not {w}"
            if b.get("kind") == "joint":
                j, d, v = b.get("joint"), b.get("deg"), b.get("speed")
                if j not in ("shoulder", "elbow") or not isinstance(d, (int, float)) or not REACH[j][0] <= d <= REACH[j][1]:
                    return False, f"a joint block out of reach: {j} {d}° (the shoulder and the elbow go {REACH['shoulder'][0]}…+{REACH['shoulder'][1]}°)"
                if not isinstance(v, (int, float)) or not 0.5 <= v <= 100:
                    return False, f"a joint block's speed must be 0.5…100°/s, not {v}"
                w = b.get("within", 0.6)
                if isinstance(w, bool) or not isinstance(w, (int, float)) or not 0.6 <= w <= 2:
                    return False, f"a joint block's within must be 0.6…2°, not {w}"
                if not self.arm:
                    return False, "no arm"
        with self.lock:
            if self.state in LIVE:
                return False, "already running"
            self.blocks, self.block, self.painted = list(blocks), 0, 0.0
            self.paint_total = sum(b.get("paintMM") or 0 for b in blocks if b.get("kind") == "move")
            self.state, self.message, self._stop, self._pause, self._pencil = "running", "", None, False, False
            self.started, self.trim = time.time(), 0.0
            self.page = note.get("page") if isinstance(note, dict) else None
            self.cup = cup_of(note.get("cup")) if isinstance(note, dict) else None
            t = note.get("travel") if isinstance(note, dict) else None
            self.travel = t if isinstance(t, (int, float)) and not isinstance(t, bool) and 10 <= t <= 250 else TRAVEL_DIP
            self.rows = note.get("remote") if isinstance(note, dict) and isinstance(note.get("remote"), dict) else None
            self.note, self._picture = ({k: note.get(k) for k in ("label", "here", "estimate_s")} if isinstance(note, dict) else None), None
            self._dip = self._auto = False
            self._jump = None
            self.dips, self.row, self.row_base = 0, 0, {}
            self._pace_s, self._pace_n, self._mark = 0.0, 0, None
        self.log({"event": "start", "blocks": len(self.blocks), "paint_mm": round(self.paint_total, 1),
                  **({k: v for k, v in note.items() if k != "remote"} if isinstance(note, dict) else {})})
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()
        return True, "started"

    def stop(self, hard=False):
        # A stop is never refused and never depends on what the runner thinks
        # is going on: the board always gets it. (2026-09-27: HARD STOP after
        # STOP did nothing, because STOP had already moved the state on.)
        with self.lock:
            if self.state in LIVE:
                self._stop = "K" if hard else "S"
                self.state = "stopping"
        r = self.send("/cmd?a=K&n=0" if hard else "/cmd?a=S&n=0")
        if self.arm:
            self.arm.stop()      # an arm stroke under way stays where it is (2026-10-02)
        return r

    def board_stopped(self, hard=False):
        # A STOP or HARD STOP sent to the board by a page, not through the
        # runner (the Calibration tab): the board stops, and the runner must
        # not take the end of the path for the end of a block and send the
        # next one. The command itself goes on to the board as it is.
        with self.lock:
            if self.state in LIVE:
                if hard or self._stop != "K":
                    self._stop = "K" if hard else "S"
                self.state = "stopping"

    def pause(self, pencil=False):
        # Pause (the owner, 2026-09-28: a pencil gone blunt, to be sharpened
        # without starting the job over). On a pass the carriage brakes on
        # its line and the brush leaves the canvas; elsewhere the step in
        # hand ends first. STOP and HARD STOP work while paused.
        # pencil, p-pause (DACHE, the owner, 2026-10-27: "the pencil has to be
        # changed, its tip resting on the paper, not going in the air"; "p-pause
        # is better"): the same, but nothing lifted — the new pencil goes into
        # the holder with its tip on the paper, at the right height.
        with self.lock:
            if self.state != "running":
                return False
            self._pause, self._pencil, self.state = True, pencil, "pausing"
        return True

    def resume(self):
        with self.lock:
            if self.state not in ("pausing", "paused"):
                return False
            self._pause, self.state = False, "running"
        return True

    def dip(self):
        # DIP (OPM-N.md: "the brush lifts at once, flies to the cup, dips, flies
        # back to the same point, lands and goes on"): a pass brakes on its line
        # as for Pause, elsewhere the step in hand ends first; then the cup the
        # run was started with, and on by itself. Paused, it dips and stays
        # paused. False: nothing running, or no cup in the run.
        with self.lock:
            if self.state not in ("running", "pausing", "paused") or not self.cup or self._stop or (self.cup.get("hand") and not self.arm) or self._silent:
                return False
            self._dip = True
            if self.state == "running":
                self._pause, self._auto, self._pencil, self.state = True, True, False, "pausing"
        return True

    def goto(self, colour, num, what="goto"):
        # Go to № (OPM-N.md: "go back three spaces"): the run on from the first
        # track of cell `num` of colour `colour` (0 the first) — the brush up at
        # once, a pass braked on its line, through the air there, down, on.
        # Back and Skip are this one with the cell now and the next. No dip by
        # itself. False and why: nothing running, or no such cell.
        with self.lock:
            if self.state not in ("running", "pausing", "paused") or self._stop:
                return False, f"the runner is {self.state}"
            if self._silent:
                return False, "the arm is silent: Continue once it answers"
        t = self._target(colour, num)
        if t is None:
            return False, f"no cell {num} in colour {colour + 1}"
        with self.lock:
            self._jump = (*t, what)
            self._pause, self._auto = True, True
            if self.state == "running":
                self._pencil, self.state = False, "pausing"
        return True, "ok"

    def back(self):
        w = self.where()
        if not w["cell"] or not w["colour_n"]:
            return False, "no cell now"
        return self.goto(w["colour_n"] - 1, w["cell"], "back")

    def back_one(self, sure=False):
        # BACK ONE CELL, OPM-N's key (the owner, 2026-11-05: "the third paint
        # came out badly … a key before STOP and HOME?"), as a player's ⏮: the
        # brush already painting this cell, this cell again from its first track;
        # not yet — in the air, in the cup, at a colour's pause, where the row is
        # the next colour's already — the cell before it, the last of the colour
        # before if this is its colour's first. Into another colour: where that
        # cell's own way there has a pause, it says what to put in the cup; else
        # the paint in the cup is not the machine's to know, so not without sure.
        # → ok, why, and what to ask (the colour and the cell), or None
        w = self.where()
        if not w["cell"] or not w["colour_n"]:
            return False, "no cell now", None
        c, n = w["colour_n"] - 1, w["cell"]
        t = self._target(c, n)
        if t is None:
            return False, f"no cell {n} in colour {c + 1}", None
        if self._paint_before(*t) >= w["painted_mm"] - BACK_BEGUN_MM:
            c2, n2 = self._cell_before(c, n) or (c, n)
            if c2 != c and not sure and not self._pause_on_way(self._target(c2, n2)):
                name = ((self.rows or {}).get("colours") or [])[c2].get("name")
                return False, f"cell {n2} of {name}: is it in the cup?", {"colour": name, "cell": n2}
            c, n = c2, n2
        ok, why = self.goto(c, n, "back")
        name = ((self.rows or {}).get("colours") or [{}] * (c + 1))[c].get("name")
        return ok, f"cell {n} of {name}" if ok else why, None          # the key says where it goes

    def _cell_before(self, c, n):
        # the cell before cell `n` of colour `c` that has a place in the plan; None: none
        cols = (self.rows or {}).get("colours") or []
        while c >= 0:
            n -= 1
            if n < 1:
                c -= 1
                n = (cols[c].get("cells") or 0) + 1 if c >= 0 else 0
                continue
            if self._target(c, n) is not None:
                return c, n
        return None

    def _pause_on_way(self, t):
        # from a jump's target to the first paint: a pause in the plan on the way? (a colour's first cell: its flight comes before it)
        if t[1] is not None:
            return False
        for b in self.blocks[t[0]:]:
            if b.get("kind") in ("pause", "p-pause"):
                return True
            if b.get("kind") == "move" and (b.get("paintMM") or 0) > 0:
                return False
        return False

    def skip(self):
        # the next cell of this colour; after its last, on to the next colour's pause
        w = self.where()
        if not w["cell"] or not w["colour_n"]:
            return False, "no cell now"
        ok, why = self.goto(w["colour_n"] - 1, w["cell"] + 1, "skip")
        if ok or not w["colour"] or w["cell"] < (w["colour"].get("cells") or 0):
            return ok, why
        end = self._colour_end(w["colour_n"] - 1)
        if end is None:
            return False, "the last colour's last cell"
        with self.lock:
            if self.state not in ("running", "pausing", "paused") or self._stop:
                return False, f"the runner is {self.state}"
            self._jump = (end, None, "skip")
            self._pause, self._auto = True, True
            if self.state == "running":
                self._pencil, self.state = False, "pausing"
        return True, "ok"

    def _rows_of(self, colour):
        rows = (self.rows or {}).get("rows") or []
        return [r for r in range(1, len(rows) + 1) if isinstance(rows[r - 1], dict) and rows[r - 1].get("c") == colour]

    def _colour_end(self, colour):
        # the first block after the colour's last row
        rs = self._rows_of(colour)
        if not rs:
            return None
        last = max(i for i, b in enumerate(self.blocks) if b.get("row") == rs[-1])
        return last + 1 if last + 1 < len(self.blocks) else None

    def _target(self, colour, num):
        # where cell `num` of `colour` starts: (block, piece) in its row's paint,
        # or (its row's flight there, None) when it starts the row
        rows = (self.rows or {}).get("rows") or []
        for r in self._rows_of(colour):
            mm0 = next((q[1] for q in rows[r - 1].get("cells") or [] if q[0] == num), None)
            if mm0 is None:
                continue
            paints = [i for i, b in enumerate(self.blocks) if b.get("row") == r and b.get("kind") == "move" and (b.get("paintMM") or 0) > 0]
            if not paints:
                return None
            if mm0 <= 0.05:
                fly = next((i for i in range(paints[0] - 1, -1, -1) if self.blocks[i].get("kind") == "move" and not self.blocks[i].get("dip")
                            and str((self.blocks[i].get("cmds") or [""])[0]).startswith("T")), None)
                return (fly, None) if fly is not None else (paints[0], None)
            # a cell inside a row starts right after a turn through the air: of those landings, the one
            # nearest its mm (the tails' slivers leave a hair off the page's count)
            # — or, where the last cell ended on its start and no turn is left between, the first piece at its mm
            done, best, first = 0.0, None, None
            for i in paints:
                b = self.blocks[i]
                start = self._block_start(i)
                if start is None:
                    return None
                geo, marks = path_pieces(start, [c for c in b["cmds"] if c[0] in "LAM"]), b.get("painted") or []
                on = [marks[j] if j < len(marks) else True for j in range(len(geo))]
                for j, g in enumerate(geo):
                    if on[j] and j > 0 and not on[j - 1] and (best is None or abs(done - mm0) < best[0]):
                        best = (abs(done - mm0), i, j)
                    if on[j] and j > 0 and first is None and done >= mm0 - 0.05:
                        first = (i, j)
                    if on[j]:
                        done += g["len"]
            return (best[1], best[2]) if best and best[0] <= 1.0 else first
        return None

    def _block_start(self, i):
        # where a move block starts: the end of the move before it
        for k in range(i - 1, -1, -1):
            if self.blocks[k].get("kind") == "move":
                return block_end(self.blocks[k]["cmds"])
        return None

    def _paint_before(self, i, j=None):
        # the plan's paint before block i (and its piece j): the per cent there
        got = sum(b.get("paintMM") or 0 for b in self.blocks[:i] if b.get("kind") == "move")
        if j:
            b, start = self.blocks[i], self._block_start(i)
            if start is not None:
                geo, marks = path_pieces(start, [c for c in b["cmds"] if c[0] in "LAM"]), b.get("painted") or []
                got += sum(g["len"] for k, g in enumerate(geo[:j]) if (marks[k] if k < len(marks) else True))
        return got

    def _do_jump(self):
        # through the air to the cell's start, the brush up, and on from there;
        # → the block to go on with
        i, j, what = self._jump
        self._pace_break()
        w = self.where()
        with self.lock:
            self._jump = None
            if not self._stop:
                self.state = "running"
        self.log({"event": what, "block": self.block, "to_block": i, **({"from_cell": w["cell"]} if w["cell"] else {}),
                  **({"colour": w["colour"].get("name")} if isinstance(w["colour"], dict) else {})})
        if self.brush_on:
            self._arm(f"J 2 {BRUSH_UP_DEG}")
        self._unswing()
        r = self.blocks[i].get("row")
        with self.lock:
            self.painted = self._paint_before(i, j)
            if isinstance(r, int) and r > 0:                 # a row not run yet: its paint from its first block
                self.row_base.setdefault(r, self._paint_before(min(k for k, q in enumerate(self.blocks) if q.get("row") == r)))
        if j is None:
            return i
        b = self.blocks[i]
        at = block_end([[c for c in b["cmds"] if c[0] in "LAM"][j - 1]])
        self._move({"kind": "move", "cmds": [f"T {self.travel:g}", f"M {at[0]:.2f} {at[1]:.2f}", "G"], "paintMM": 0})
        if self._stop:
            return len(self.blocks)
        prev = arm_at_piece(b["cmds"], j - 1)
        if prev is not None:
            self._arm(f"J 2 {prev:g}")
        with self.lock:
            self.block, self.row = i, r if isinstance(r, int) and r > 0 else self.row
        geo = path_pieces(at, [c for c in b["cmds"] if c[0] in "LAM"][j:])
        marks = (b.get("painted") or [])[j:]
        left = sum(g["len"] for k, g in enumerate(geo) if (marks[k] if k < len(marks) else True))
        self._move({"kind": "move", "cmds": from_piece(b["cmds"], j), "paintMM": left, "painted": marks})
        return i + 1

    # ---- the run ----
    def run(self):
        try:
            p = self._ping()
            if p is None or p["x"] is None or p["y"] is None:
                raise Abort("no zero on the axes: set home on the Calibration tab")
            # Before anything moves, even the brush: can the board run a path?
            # A speed command changes nothing on the canvas; the pendant
            # firmware did not know it.
            probe = next((c for b in self.blocks if b.get("kind") == "move" for c in b["cmds"][:1]), "T 100")
            r = self._raw(probe)
            if not r.startswith("ok "):
                raise Abort("the board cannot run a path (" + r + "): flash the firmware, "
                            "firmware/CNCDM-001")
            if self.arm:
                self.arm.stopped.clear()   # a STOP of the run before: not this one's (a silent arm waited for, _arm_steps)
                try:
                    self.arm.hold()     # nothing moves; the whole arm holds from here on
                except ArmSilent as e:
                    raise Abort(f"{e}: the arm does not answer — the servos' 12 V or ground (the board's terminal and switch, the servo cable)")
                except ArmError as e:
                    raise Abort(str(e))
            self._unswing()             # a run stopped over the jar at hand: the elbow up, the shoulder back first
            i = 0
            while i < len(self.blocks):
                if self._stop:
                    break
                if self._pause and not self._hold():
                    break
                if self._jump is not None:
                    i = self._do_jump()
                    continue
                b = self.blocks[i]
                i += 1
                with self.lock:
                    self.block = i - 1
                    now = self.clock()
                    if self._mark is not None and self.block > self._mark[1]:     # PACE_MIN_S: the steps since the last start, in its time
                        self._pace_s += now - self._mark[0]
                        self._pace_n += self.block - self._mark[1]
                    self._mark = (now, self.block)
                    r = b.get("row")
                    if isinstance(r, int) and r > 0 and b["kind"] == "move":
                        self.row_base.setdefault(r, self.painted)
                        self.row = r
                if b.get("dip") and (b["kind"] == "move" or (b["kind"] == "joint" and b.get("rim") is not None)):
                    self.log({"event": "dip", "by": "plan", **self._dip_note()})   # the plan's own, for the journal: to the cup, or the shoulder to the jar at hand
                if b["kind"] == "arm":
                    self._arm(b["cmd"], b.get("fork"))
                elif b["kind"] == "joint":
                    if b.get("dip") and b.get("rim") is not None and not self._stop:
                        self._mark_swing(b)      # over the jar as far as a stop is concerned, from the turn's start
                    self._joint(b)
                    self._mark_swing(b)
                elif b["kind"] == "wait":
                    self._wait(float(b["s"]))     # the axes still, the arm where it is; pinging, so STOP still gets through
                elif b["kind"] in ("pause", "p-pause"):
                    with self.lock:
                        self._pause, self._pencil, self.message = True, b["kind"] == "p-pause", b.get("why") or "paused"
                    if not self._hold():
                        break
                    with self.lock:
                        self.message = ""
                else:
                    self._move(b)
            with self.lock:
                self.state = "stopped" if self._stop else "done"
                if self._stop and self.brush_on:
                    self.message = "stopped with the brush on the canvas"
        except Abort as e:
            self.send("/cmd?a=S&n=0")
            with self.lock:
                self.state, self.message = "error", str(e)
        with self.lock:
            pct = 100.0 * self.painted / self.paint_total if self.paint_total else 0.0
            end = {"event": self.state, "message": self.message, "block": self.block, "blocks": len(self.blocks),
                   "percent": round(pct, 1), "seconds": round(time.time() - self.started) if self.started else None}
        self.log(end)

    def _ping(self):
        for n in range(3):                     # a reply lost is no board lost
            r = self.send("/ping")
            if r != NO_REPLY:
                break
        p = parse_ping(r)
        with self.lock:
            self.pos = p
        if p and p["x"] is not None and p["y"] is not None:
            for i, v in enumerate((p["x"], p["y"])):
                lo, hi = WALLS_MM[i]
                mm = v / STEPS_PER_MM[i]
                if mm < lo - RUNAWAY_MM or mm > hi + RUNAWAY_MM:
                    self.send("/cmd?a=K&n=0")
                    raise Abort(f"runaway: {'XY'[i]} at {mm:.1f} mm, past the wall — HARD STOP sent")
        return p

    def _wait(self, seconds):
        # waiting also pings, five times a second, like the pages
        t = 0.0
        while t < seconds and not self._stop:
            self.sleep(0.2)
            t += 0.2
            self._ping()

    def _arm(self, cmd, fork=None):
        # J 2 <deg>, the elbow — the brush down or up — or J 3 <deg>, the
        # wrist; tenths too: a pause in a tail puts the elbow back as a W left it.
        # fork: there anywhere in it (the cup at hand), never resting short
        why = arm_check(cmd)
        if why:
            raise Abort(why)
        p = cmd.split()
        name, deg = ARM_JOINT[int(p[1])], float(p[2])
        if self.arm:
            # in RUBENS's degrees, from where the joint really is (class Arm)
            was = self.arm.angles(need=(name,))[0].get(name) if name == "elbow" and self.page in PENCIL_PAGES and not fork else None
            try:
                while True:
                    try:
                        self.arm.move_to(name, deg, fork=fork)
                        break
                    except ArmSilent as e:              # paused till Continue, then the same move again; STOP ends the run
                        if not self._silent_pause(f"{cmd}: {e}"):
                            return
            except ArmError as e:
                if self._stop and (fork or "stopped: STOP" in str(e)):    # STOP while a silent arm was waited for: stopped, not an error
                    return
                got = self.arm.angles(need=(name,))[0].get(name) if was is not None and "does not get to" in str(e) else None
                if got is None or not (was > deg and deg < got <= deg + REST_MAX and got < was):
                    raise Abort(f"{cmd}: {e}")
                self.log({"event": "rests", "joint": name, "deg": deg, "at": got, "block": self.block})   # on the paper above it: on
            if name == "elbow":
                self._brush_at(deg)
            self._ping()
            return
        r = self.send(f"/servo?j={name}&d={deg:g}")
        if not r.startswith("ok J"):
            raise Abort(f"{cmd}: {in_english(r)}")
        if name == "elbow":
            self._brush_at(deg)
        self._wait(self.swing_s)

    def _brush_at(self, deg):
        # the elbow (the new arm, 2026-10-02): short of ELBOW_LIFT_DEG the brush
        # is on the canvas, 0° pressed
        self.brush_on = deg < ELBOW_LIFT_DEG
        if self.brush_on:
            self.lift = deg

    def _joint(self, b):
        # An arm stroke (2026-10-02): the shoulder or the elbow turns at its
        # speed; the axes stand. STOP stops it where it is (Arm.stop, H).
        # `within`: as near as counts (the shoulder back from a dip, INK-Y), the miss in the journal;
        # `fork`: there anywhere in it (the shoulder to the jar at hand)
        deg, fork = float(b["deg"]), b.get("fork")
        try:
            while True:
                try:
                    got = self.arm.move_to(b["joint"], deg, float(b["speed"]), float(b.get("within", 0.6)), fork=fork and fork_of(fork, b["joint"]))
                    break
                except ArmSilent as e:                  # paused till Continue, then the same turn again; STOP ends the run
                    if not self._silent_pause(f"{b['joint']} to {b['deg']}°: {e}"):
                        return
        except ArmError as e:
            if self._stop:
                return
            raise Abort(f"{b['joint']} to {b['deg']}°: {e}")
        if not fork and isinstance(got, (int, float)) and abs(got - deg) >= 0.6:
            self.log({"event": "near", "joint": b["joint"], "deg": deg, "at": got, "block": self.block})
        self._ping()

    def _raw(self, cmd):
        return self.send("/raw?c=" + quote(cmd))

    def _go(self):
        # False: nothing to run — every piece was too short to queue (a travel
        # to where the carriage already is)
        r = self._raw("G")
        if "очередь пуста" in r:
            return False
        if r != "ok G":
            raise Abort(f"G: {in_english(r)}")
        return True

    def _move(self, b):
        pieces = [c for c in b["cmds"] if c != "G"]
        base, share = self.painted, b.get("paintMM") or 0
        # A joint on the path (W, 2026-10-02): the elbow lands and lifts the
        # brush as the carriage runs, the board turning it where the plan says.
        wrists = [c for c in pieces if c[0] == "W"]
        # A pass (brush on, or landing on the way) can be paused on its line; a travel ends first.
        # So does a pass marked pauseAtEnd (ALU's DRAG, the owner, 2026-10-10: "the pause works
        # only at the ends of a line"): it runs to its end, the pause held before the next block.
        pausable = (self.brush_on or bool(wrists)) and any(c[0] == "F" for c in pieces) and not b.get("pauseAtEnd")
        start = self._here() if pausable or share else None
        if wrists:
            pieces = self._arm_steps(pieces)
        # The percent goes by painted length (job.json marks each piece
        # painted or a turn; without the marks every piece counts).
        track = None
        if share and start:
            geo = path_pieces(start, [c for c in pieces if c[0] in "LAM"])
            marks = b.get("painted") or []
            plen = [g["len"] if (marks[i] if i < len(marks) else 1) else 0.0 for i, g in enumerate(geo)]
            if sum(plen) > 0:
                track = (geo, plen, sum(plen))
        started, sent = False, 0
        for c in pieces:
            while True:
                if self._stop:
                    self._finish(started)
                    if wrists:
                        self._brush_where(b, start)
                    return
                if pausable and started and self._pause:
                    return self._brake(b, start, sent, base)
                r = self._raw(self._trimmed(c) if wrists else c)
                if r.startswith("ok "):
                    break
                if "очередь полна" in r:
                    if not started:
                        started = self._go()
                    self._wait(0.1)
                    self._progress(base, share, sent, track)
                    continue
                if c[0] == "W" and r.strip() == "?":
                    raise Abort("W: the board does not know it yet — flash the firmware (firmware/CNCDM-001)")
                raise Abort(f"{c}: {in_english(r)}")
            if c[0] in "LAM":
                sent += 1
                room = int(r.split()[-1])
                if room == 0 and not started:
                    started = self._go()
        if not started:
            started = self._go()
        if not self._finish(started, base, share, sent, track, pausable):
            return self._brake(b, start, sent, base)
        if self._stop:
            if wrists:
                self._brush_where(b, start)
            return
        self._arrived(b)
        last = arm_at_piece(b["cmds"], len(b["cmds"]))
        if last is not None:
            self._brush_at(last)

    def _arm_steps(self, pieces):
        # W turns a joint from the firmware's zero: take it where the joints
        # stand (Z moves nothing; it comes before the pieces, for it drops
        # any queued without a G) and send RUBENS's degrees as steps from it.
        # Without an arm the degrees go as they are, like /servo.
        names = {ARM_JOINT[int(c.split()[1])] for c in pieces if c[0] == "W"}
        a = {k: 0.0 for k in names}
        if self.arm:
            while True:                                  # a silent arm waited for, then the run paused till Continue (_silent_pause)
                ang, _ = self.arm.patient(tuple(names), "path")
                miss = [k for k in sorted(names) if ang.get(k) is None]
                if not miss:
                    try:
                        self.arm.rezero_patient()
                        break
                    except ArmSilent as e:
                        miss, why = [], f"W: {e}"
                    except ArmError as e:
                        raise Abort(str(e))
                else:
                    why = f"W: the {', '.join(miss)} does not answer: is the 12 V on?"
                if self._stop or not self._silent_pause(why):
                    return pieces                        # STOP: _move sends none of them
            for k in names:
                a[k] = ang[k]
            self._wbase = dict(a)
        out = []
        for c in pieces:
            if c[0] == "W":
                p = c.split()
                k = ARM_JOINT[int(p[1])]
                fw = (TURN[k] * (float(p[2]) - a[k])) if self.arm else float(p[2])
                out.append(f"W {p[1]} {fw:.1f}" + (f" {p[3]}" if len(p) > 3 else ""))
            else:
                out.append(c)
        return out

    def _brush_where(self, b, start):
        # A block with W stopped on its way: the elbow is as the last W on a
        # piece the carriage has reached left it.
        if start is None:
            return
        p = self._ping()
        if p is None or p["x"] is None or p["y"] is None:
            return
        here = (p["x"] / STEPS_PER_MM[0], p["y"] / STEPS_PER_MM[1])
        j = piece_at(start, [c for c in b["cmds"] if c[0] in "LAM"], here)
        deg = None if j is None else arm_at_piece(b["cmds"], j)
        if deg is not None:
            self._brush_at(deg)

    def _here(self):
        p = self._ping()
        if p is None or p["x"] is None or p["y"] is None:
            raise Abort("lost the board")
        return p["x"] / STEPS_PER_MM[0], p["y"] / STEPS_PER_MM[1]

    def _brake(self, b, start, sent, base):
        # Pause on a pass: brake on the line (S keeps the X driver well; K may
        # not), find the piece the carriage stands on, hold with the brush off,
        # then run the rest of the pass from right there: a piece sent again
        # from a point on it goes on to its own end.
        queued = (self.pos or {}).get("path") or 0
        self.send("/cmd?a=S&n=0")
        while not self._stop:
            p = self._ping()
            if p is None:
                raise Abort("lost the board")
            if p["path"] is None:
                break
            self.sleep(0.1)
        self._wait(0.4)
        if self._stop:
            return
        path = [c for c in b["cmds"] if c[0] in "LAM"]
        here = self._here()
        j = piece_at(start, path, here, first=max(0, sent - queued - 1))
        if j is None:
            self.send("/cmd?a=K&n=0")
            raise Abort(f"paused off the path, at X {here[0]:.1f} Y {here[1]:.1f}: HARD STOP sent")
        deg = arm_at_piece(b["cmds"], j)                 # the board turned the elbow on the way (W)
        if deg is not None:
            self._brush_at(deg)
        if not self._hold() or self._jump is not None:
            return
        left = max(0.0, (b.get("paintMM") or 0) - (self.painted - base))
        self._move({"kind": "move", "cmds": rest_of(b["cmds"], j), "paintMM": left,
                    "painted": (b.get("painted") or [])[j:]})

    def _silent_pause(self, why, at=None):
        # The arm silent past SILENT_WAIT (the owner, 2026-11-11: all three servos silent at once mid-run, back when the carriage
        # was moved; "yes, I allow it"): the run paused where it is, nothing lifted — the arm cannot be — the message says what to
        # check; asked every SILENT_LOOK_S whether it answers again, said so with its volts. Continue: True, the caller makes the
        # same move again — the carriage, moved meanwhile, first back where it was, the brush up if it was over the canvas.
        # STOP: False, the run ends as stopped. The journal: "silent" with the servos' last volts, "arm back", "continue".
        self._pace_break()
        if self._stop:
            return False
        p = self._ping()                                 # where the arm went silent; `at` given: silent again before the carriage went back there
        at = at or ((p["x"] / STEPS_PER_MM[0], p["y"] / STEPS_PER_MM[1]) if p and p["x"] is not None and p["y"] is not None else None)
        ang = self.arm.angles()[0]
        joints = [k for k in JOINTS if ang.get(k) is None] or [k for k in JOINTS if k in why] or list(JOINTS)   # who is silent now, by a look
        who = f"the {joints[0]} does not answer" if len(joints) == 1 else f"the {', the '.join(joints[:-1])} and the {joints[-1]} do not answer"
        say = ARM_SILENT_SAY.format(who=who)
        with self.lock:
            if self._stop:
                return False
            self._silent, self._pause, self._auto, self.state, self.message = joints, True, False, "paused", say
        self.log({"event": "silent", "why": why, "block": self.block, **({"at_mm": [round(at[0], 1), round(at[1], 1)]} if at else {}), **self.arm.power_note()})
        t, back = 0.0, False
        while True:
            with self.lock:
                if self._stop or not self._pause:
                    break
            self.sleep(0.2)
            t += 0.2
            if t < SILENT_LOOK_S:
                self._ping()                             # the board's watchdog fed, as a pause does
                continue
            t = 0.0
            ang = self.arm.angles()[0]
            now = all(ang.get(k) is not None for k in JOINTS)
            if now != back:
                back = now
                v = self.arm.power_note().get("volts") or {}
                with self.lock:
                    if self._pause and not self._stop:
                        self.message = ARM_BACK_SAY.format(volts=f" ({min(v.values()):.1f} V)" if v else "") if now else say
                if now:
                    self.log({"event": "arm back", "block": self.block, **self.arm.power_note()})
        with self.lock:
            stopped = bool(self._stop)
            self._silent = None
            if not stopped:
                self.message = ""
        if stopped:
            return False
        self.log({"event": "continue", "block": self.block, "after": "silent"})
        q = self._ping()
        here = (q["x"] / STEPS_PER_MM[0], q["y"] / STEPS_PER_MM[1]) if q and q["x"] is not None and q["y"] is not None else None
        if at and here and max(abs(here[0] - at[0]), abs(here[1] - at[1])) > MOVED_MM:
            # moved by hand meanwhile (a jog): the brush up if it is over the canvas — the shoulder at 0, not over the jar at hand — and
            # back through the air to where the arm went silent, so that the move again starts where the plan has it
            ang = self.arm.angles(need=("shoulder", "elbow"))[0]
            if ang.get("shoulder") is not None and abs(ang["shoulder"]) < 2 and ang.get("elbow") is not None and ang["elbow"] < BRUSH_UP_DEG:
                try:
                    self.arm.move_to("elbow", BRUSH_UP_DEG)
                    self._brush_at(BRUSH_UP_DEG)
                except ArmSilent as e:
                    return self._silent_pause(f"J 2 {BRUSH_UP_DEG}: {e}", at)
                except ArmError as e:
                    raise Abort(f"the brush up before going back: {e}")
            self.log({"event": "back to", "block": self.block, "from_mm": [round(here[0], 1), round(here[1], 1)], "to_mm": [round(at[0], 1), round(at[1], 1)]})
            self._move({"kind": "move", "cmds": [f"T {self.travel:g}", f"M {at[0]:.2f} {at[1]:.2f}", "G"], "paintMM": 0})
            if self._stop:
                return False
        return True

    def _hold(self):
        # Paused: the brush off the canvas, the motors still, the watchdog fed
        # by the pings. Continue puts the brush back as it was, tilted too.
        # The pencil's pause lifts nothing and puts nothing back.
        self._pace_break()                               # PACE_MIN_S: a pause's time no step's
        was_on, lift = self.brush_on and not self._pencil, self.lift
        if was_on:
            self._arm(f"J 2 {BRUSH_UP_DEG}")
        with self.lock:
            if self._pause and not self._stop:
                self.state = "paused"
            why = self.message or "Pause"
            auto = self._auto
        if not auto:
            self.log({"event": "pause", "why": why, "block": self.block, **({"pencil": True} if self._pencil else {})})
        while self._pause and not self._stop:
            if self._jump is not None:                   # Back, Skip, Go to: the run goes on from there, the brush up
                with self.lock:
                    self._pause = self._auto = False
                break
            if self._dip:                                # DIP: to the cup and back here; its own pause ends with it
                self._dip_now()
                with self.lock:
                    if self._auto and not self._stop:
                        self._pause = self._auto = False
                        self.state = "running"
                continue
            self.sleep(0.2)
            self._ping()
        if self._stop:
            return False
        self._pencil = False
        if not auto:
            self.log({"event": "continue", "block": self.block})
        if was_on and self._jump is None:
            self._arm(f"J 2 {lift:g}")
        return True

    def _dip_note(self):
        # where a dip falls: the block, the row, the paint done in it, the colour and the cell (the journal)
        w = self.where()
        return {"block": self.block, "row": w["row"], "in_row": w["in_row"], "painted_mm": w["painted_mm"],
                **({"colour": w["colour"].get("name")} if isinstance(w["colour"], dict) else {}),
                **({"cell": w["cell"]} if w["cell"] is not None else {}),
                **(self.arm.power_note() if self.arm else {})}     # the servos' volts and °C at the last look (2026-11-11)

    def _dip_now(self):
        # the brush over the cup's rim, to the cup, into its paint for its
        # dwell, over the rim again, back to where it stood. The cup at hand
        # (INK-Y; README, How to dip): the carriage stands — the elbow up, the
        # shoulder over the jar, the elbow in, up, the shoulder back to 0;
        # already over it — a pause in the plan's own dip there — into the
        # paint and up, and nothing else
        c, here = self.cup, self._here()
        with self.lock:
            self._dip, why = False, self.message
            self.message = "DIP: the brush to the cup and back"
        note = self._dip_note()
        if c.get("hand"):
            self._hand_dip(c, over=self._swung is not None)
        else:
            self._arm(f"J 2 {c['rim']:g}")
            self._move({"kind": "move", "cmds": [f"T {self.travel:g}", f"M {c['x']:.2f} {c['y']:.2f}", "G"], "paintMM": 0})
            if not self._stop:
                self._arm(f"J 2 {c['dip']:g}")
                self._wait(c["dwell"])
                self._arm(f"J 2 {c['rim']:g}")
                self._move({"kind": "move", "cmds": [f"T {self.travel:g}", f"M {here[0]:.2f} {here[1]:.2f}", "G"], "paintMM": 0})
        with self.lock:
            self.dips += 1
            if self.message.startswith("DIP:"):
                self.message = why
        self.log({"event": "dip", "by": "hand", "x": round(here[0], 2), "y": round(here[1], 2), **note})

    def _hand_dip(self, c, over=False):
        # the cup at hand, every step there before the next (the plan's handDip, strokes.js)
        rim = c["rim"]
        if not over:
            self._arm(f"J 2 {rim:g}", c["up"])
            if self._stop:
                return
            b = {"joint": "shoulder", "deg": (c["to"][0] + c["to"][1]) / 2, "speed": c["swing"], "fork": c["to"], "rim": rim, "up": c["up"], "dip": True}
            self._mark_swing(b)
            self._joint(b)
        if self._stop:
            return
        self._arm(f"J 2 {c['dip']:g}", c["paint"])
        self._wait(c["dwell"])
        if self._stop:
            return
        self._arm(f"J 2 {rim:g}", c["up"])
        if not over:
            self._unswing()

    def _mark_swing(self, b):
        # INK-Y: the shoulder over the jar at hand, or back from it
        if b.get("joint") == "shoulder" and b.get("dip"):
            turned = abs(float(b["deg"])) >= 0.6
            if turned or not self._stop:
                up = fork_of(b.get("up"), "elbow")
                self._swung = (float(b.get("rim", BRUSH_UP_DEG)), float(b["speed"]), up) if turned else None

    def _unswing(self):
        # INK-Y: the shoulder back to 0 from over the jar at hand, the elbow up
        # into its fork first (README, How to dip), before it goes anywhere else
        if self._swung is None or not self.arm:
            return
        rim, speed, up = self._swung
        self._arm(f"J 2 {rim:g}", up)
        if self._stop:
            return
        self._joint({"joint": "shoulder", "deg": 0, "speed": speed, "within": DIP_WITHIN})
        if not self._stop:
            self._swung = None

    def _arrived(self, b):
        # Before the next block — above all before the brush goes down — the
        # carriage must be where this one ends.
        end = block_end(b["cmds"])
        if end is None:
            return
        p = self._ping()
        if p is None or p["x"] is None or p["y"] is None:
            raise Abort("lost the board")
        x, y = p["x"] / STEPS_PER_MM[0], p["y"] / STEPS_PER_MM[1]
        miss = math.hypot(x - end[0], y - end[1])
        if ARRIVAL_NOTE_MM < miss <= ARRIVAL_MM:      # forgiven (the owner, 2026-11-11: up to 4 mm)
            self.log({"event": "short", "block": self.block, "miss_mm": round(miss, 1),
                      "here_mm": [round(x, 1), round(y, 1)], "end_mm": [round(end[0], 1), round(end[1], 1)]})
        if miss > ARRIVAL_MM:
            self.send("/cmd?a=K&n=0")
            raise Abort(f"the carriage did not get there: X {x:.1f} Y {y:.1f} mm instead of "
                        f"X {end[0]:.1f} Y {end[1]:.1f}. The board stopped the path itself "
                        "(a restart of the board clears it). HARD STOP sent")

    def _progress(self, base, share, sent, track):
        # What the block has painted by the last ping, by length: the pieces
        # the board has run (those sent less those still queued), and on the
        # piece it is running, how far along it the carriage is. Counted also
        # while the rest is still being sent (a Brush lane stood at 0 %,
        # 2026-09-28). By counting pieces the percent stood still for the
        # whole of a long line and jumped at its end (2026-09-30: 89.5 % shown
        # with the carriage at 92.8 %).
        pos = self.pos or {}
        queued = pos.get("path")
        if not track or queued is None:
            return
        here = None if pos.get("x") is None or pos.get("y") is None else \
            (pos["x"] / STEPS_PER_MM[0], pos["y"] / STEPS_PER_MM[1])
        got = painted_so_far(track, sent - queued, here) / track[2]
        with self.lock:
            self.painted = max(self.painted, base + share * got)

    def _finish(self, started, base=None, share=0, sent=0, track=None, pausable=False):
        # the block is over when the board no longer reports a path; False:
        # a pause came first, the path is still running
        while started:
            p = self._ping()
            if p is None:
                raise Abort("lost the board")
            if p["path"] is None:
                break
            if pausable and self._pause and not self._stop:
                return False
            if base is not None:
                self._progress(base, share, sent, track)
            self.sleep(0.2)
        if started:
            # the flag can drop while the motors still run the last queued
            # slices (older firmware): give them a moment before the arm moves
            self._wait(0.4)
        if base is not None and not self._stop:
            with self.lock:
                self.painted = base + share
        return True


def write_json(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)
    os.replace(tmp, path)


# ---------- the Library: the drawings saved from the Create tab ----------
# The owner, 2026-09-30: every 💾 SAVE is a new drawing, named by the date and
# time ("2026-09-30 01:15"); an older one stays as it was. The drawings are
# the owner's own work: they live on this Mac only, not in git (library/ is
# ignored). A drawing is two files: <name>.svg — the drawing with its whole
# state, as Export SVG writes it — and <name>.png, its preview. The file name
# has "01-15" for "01:15" (a colon is no good in a file name on a Mac).
# Deleting moves both into library/.deleted/, so nothing is lost by a slip.
LIBRARY_DIR = os.path.join(HERE, "library")
LIBRARY_NAME = re.compile(r"^\d{4}-\d\d-\d\d \d\d-\d\d(?: \((\d+)\))?$")
PNG_DATA = "data:image/png;base64,"


def library_display(base):
    """'2026-09-30 01-15 (2)' → '2026-09-30 01:15 (2)'."""
    return base[:13] + ":" + base[14:]


def library_list(folder):
    """The saved drawings, newest first: name, file name, format, strokes."""
    out = []
    try:
        names = os.listdir(folder)
    except OSError:
        return out
    for f in names:
        base, ext = os.path.splitext(f)
        if ext != ".svg" or not LIBRARY_NAME.match(base):
            continue
        info = {"file": base, "name": library_display(base), "format": None, "strokes": None,
                "png": os.path.exists(os.path.join(folder, base + ".png")), "kind": "painting", "label": None}
        try:
            with open(os.path.join(folder, f), encoding="utf-8") as fh:
                m = re.search(r'<metadata id="(rubens-state|rembrandt-state|rembrandt-test)">(.*?)</metadata>', fh.read(), re.S)
            if m:
                st = json.loads(m.group(2).replace("- -", "--"))
                if m.group(1) == "rembrandt-test":       # a test from the Test tab (2026-10-02): the Library's second shelf
                    info["kind"], info["label"] = "test", st.get("label")
                info["format"] = st.get("format")
                info["strokes"] = len(st["paths"]) if isinstance(st.get("paths"), list) else None   # RUBENS's strokes; a Rembrandt painting has one curve
        except (OSError, ValueError):
            pass
        out.append(info)
    # newest first: the name is the time; "(2)" is later than none, "(10)" than "(9)"
    key = lambda i: (i["file"][:16], int((LIBRARY_NAME.match(i["file"]).group(1)) or 1))
    return sorted(out, key=key, reverse=True)


def library_save(folder, svg, png, now=None):
    """Save a drawing under a new name from the time; returns the file name.
    ValueError when it is not a Rembrandt (or RUBENS) drawing."""
    if not isinstance(svg, str) or "<svg" not in svg or not any(f'id="{k}"' in svg for k in ("rembrandt-state", "rembrandt-test", "rubens-state")):
        raise ValueError("not a Rembrandt drawing")
    if not isinstance(png, str) or not png.startswith(PNG_DATA):
        raise ValueError("no preview")
    image = base64.b64decode(png[len(PNG_DATA):], validate=True)
    os.makedirs(folder, exist_ok=True)
    stem = time.strftime("%Y-%m-%d %H-%M", time.localtime(now))
    base, n = stem, 1
    while os.path.exists(os.path.join(folder, base + ".svg")):
        n += 1
        base = f"{stem} ({n})"
    with open(os.path.join(folder, base + ".png"), "wb") as f:
        f.write(image)
    tmp = os.path.join(folder, base + ".svg.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(svg)
    os.replace(tmp, os.path.join(folder, base + ".svg"))   # the .svg last: it is what makes it a drawing
    return base


def library_delete(folder, base):
    """Move a drawing into .deleted/. False if there is no such drawing."""
    if not LIBRARY_NAME.match(base or "") or not os.path.exists(os.path.join(folder, base + ".svg")):
        return False
    bin_ = os.path.join(folder, ".deleted")
    os.makedirs(bin_, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    for ext in (".svg", ".png"):
        src = os.path.join(folder, base + ext)
        if os.path.exists(src):
            os.replace(src, os.path.join(bin_, f"{base} · deleted {stamp}{ext}"))
    return True


class Park:
    """Where the carriage stood when the motors were shut down, so the zero
    lives through the 12 V going off. The owner, 2026-09-28: the carriage and
    the arm on it do not move at night; the motors wake up where they fell
    asleep. One button before power-off (shut_down), one after power-on
    (restore).

    The place is good for one zero only. Restoring it, setting home at the
    stops, a jog or a job — anything that moves the carriage or sets a zero
    through rubens.py — uses it up, so a place from an older evening is never
    put back after a power-off without Shut down.
    """

    def __init__(self, path, send, sleep=time.sleep):
        self.path, self.send, self.sleep = path, send, sleep

    def read(self):
        try:
            with open(self.path, encoding="utf-8") as f:
                return json.load(f)
        except (OSError, ValueError):
            return None

    def forget(self):
        p = self.read()
        if p and not p.get("used"):
            p["used"] = True
            write_json(self.path, p)

    def shut_down(self, runner):
        # HARD STOP first, whatever is running: a stop is never refused.
        r = runner.stop(hard=True)
        if r == "no board":
            return False, "No board: the motors were not reached, nothing saved.", None
        prev = None
        for _ in range(15):
            self.sleep(0.2)
            p = parse_ping(self.send("/ping"))
            if p is None:
                return False, "No answer from the board: nothing saved.", None
            if p["x"] is None or p["y"] is None:
                return False, ("Motors stopped. No zero on the axes, so there is nothing to remember: "
                               "after power-on find home at the stops."), None
            if prev and p["path"] is None and (p["x"], p["y"]) == (prev["x"], prev["y"]):
                park = {"x": p["x"], "y": p["y"], "at": time.strftime("%Y-%m-%d %H:%M:%S"), "used": False}
                write_json(self.path, park)
                return True, "Motors stopped, the place is saved. Now switch off the 12 V.", park
            prev = p
        return False, "The carriage does not stand still: nothing saved.", None

    def restore(self):
        park = self.read()
        if not park or park.get("used"):
            return False, "No parked place: find home at the stops.", park
        p = parse_ping(self.send("/ping"))
        if p is None:
            return False, "No answer from the board.", park
        if p["x"] is not None or p["y"] is not None:
            return False, "The board already has a zero: nothing changed.", park
        rx = self.send(f"/origin/x?at={park['x']}")
        ry = self.send(f"/origin/y?at={park['y']}")
        ok_x, ok_y = rx.startswith("ok O"), ry.startswith("ok O")
        if not ok_x and not ok_y:
            return False, f"Not restored ({rx} · {ry}).", park
        park["used"] = True
        write_json(self.path, park)
        if ok_x and ok_y:
            return True, "The parked place is back: the walls are on.", park
        axis = "Y" if ok_x else "X"
        return False, f"Only {'X' if ok_x else 'Y'} restored: find {axis} home at its stop.", park


def arm_zero():
    try:
        with open(FILES["/calibration"], encoding="utf-8") as f:
            z = json.load(f).get("arm") or {}
        return {k: int(z.get(k, v)) for k, v in ARM_ZERO.items()}
    except (OSError, ValueError, TypeError):
        return dict(ARM_ZERO)


ARM = Arm(board_get, arm_zero, guard=hand_guard, note=lambda what: run_log({"event": "bus", "what": what}))
RUNNER = Runner(board_get, arm=ARM, log=run_log)
PARK = Park(PARK_FILE, board_get)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=HERE, **kwargs)

    def log_message(self, *args):
        pass  # the page pings five times a second

    def end_headers(self):
        # Always the files on disk: no stale modules after an edit.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def reply(self, code, body, ctype="text/plain; charset=utf-8", board=None):
        data = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        if board:
            self.send_header("X-Board", board)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def local(self):
        # this Mac: the loopback, or its own address on the Wi-Fi
        a = self.client_address[0]
        a = a[7:] if a.startswith("::ffff:") else a
        return a in ("127.0.0.1", "::1") or a == lan_ip()

    def keyed(self, u):
        k = parse_qs(u.query).get("k", [""])[0] or self.headers.get("X-Key", "")
        return bool(REMOTE_KEY) and hmac.compare_digest(k.encode(), REMOTE_KEY.encode())

    def remote(self, u, post):
        # the iPhone (OPM-N, 2026-11-02): the page for anyone on the Wi-Fi, its
        # calls with the key only; the link with the key for this Mac's page
        if u.path == "/remote" and not post:
            with open(os.path.join(HERE, "remote.html"), "rb") as f:
                return self.reply(200, f.read(), "text/html; charset=utf-8")
        if u.path == "/remote/link" and not post:
            if not self.local():
                return self.reply(403, "this Mac only")
            ip = lan_ip()
            on = LISTEN != "127.0.0.1" and bool(ip)
            return self.reply(200, json.dumps({"url": f"http://{ip}:{PORT}/remote?k={REMOTE_KEY}" if on else None, "ip": ip, "lan": on}), "application/json")
        if not self.keyed(u):
            return self.reply(403, json.dumps({"ok": False, "message": "no key: scan the QR code on OPM-N"}), "application/json")
        if u.path == "/remote/state" and not post:
            return self.reply(200, json.dumps(RUNNER.where()), "application/json")
        if u.path == "/remote/plan" and not post:
            return self.reply(200, json.dumps(RUNNER.picture(), separators=(",", ":")), "application/json")
        if post and u.path in ("/remote/back", "/remote/skip", "/remote/goto"):
            if u.path == "/remote/goto":                 # a number in the colour now
                w = RUNNER.where()
                try:
                    n = int(parse_qs(u.query).get("n", [""])[0])
                except ValueError:
                    return self.reply(400, json.dumps({"ok": False, "message": "goto?n=<cell>"}), "application/json")
                ok, why = RUNNER.goto(w["colour_n"] - 1, n) if w["colour_n"] else (False, "no colour now")
            else:
                ok, why = RUNNER.back() if u.path == "/remote/back" else RUNNER.skip()
            return self.reply(200 if ok else 409, json.dumps({"ok": ok, "message": why, "state": RUNNER.state}), "application/json")
        act = {"/remote/dip": RUNNER.dip, "/remote/pause": RUNNER.pause, "/remote/continue": RUNNER.resume}.get(u.path) if post else None
        if post and u.path == "/remote/stop":
            RUNNER.stop()
            return self.reply(200, json.dumps({"ok": True, "state": RUNNER.state}), "application/json")
        if act is None:
            return self.reply(404, json.dumps({"ok": False}), "application/json")
        ok = act()
        return self.reply(200 if ok else 409, json.dumps({"ok": ok, "state": RUNNER.state}), "application/json")

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/remote" or u.path.startswith("/remote/"):
            return self.remote(u, False)
        if not self.local():
            return self.reply(403, "this Mac only: the iPhone's remote is /remote")
        if u.path.startswith("/machine/"):
            return self.machine(u)
        if u.path == "/run":
            return self.reply(200, json.dumps(RUNNER.status()), "application/json")
        if u.path == "/park":
            return self.reply(200, json.dumps(PARK.read() or {}), "application/json")
        if u.path == "/library":
            return self.reply(200, json.dumps(library_list(LIBRARY_DIR)), "application/json")
        if u.path.startswith("/library/"):
            # a drawing or its preview, by its library name only
            base, ext = os.path.splitext(unquote(u.path[len("/library/"):]))
            f = os.path.join(LIBRARY_DIR, base + ext)
            if ext not in (".svg", ".png") or not LIBRARY_NAME.match(base) or not os.path.exists(f):
                return self.reply(404, "no such drawing")
            with open(f, "rb") as fh:
                return self.reply(200, fh.read(), "image/svg+xml" if ext == ".svg" else "image/png")
        if u.path == "/arm":
            ang, raw = ARM.angles()
            return self.reply(200, json.dumps({"angles": ang, "raw": raw, "zero": arm_zero()}), "application/json")
        if u.path in FILES:
            if not os.path.exists(FILES[u.path]):
                return self.reply(200, "{}", "application/json")
            with open(FILES[u.path], "rb") as f:
                return self.reply(200, f.read(), "application/json")
        return super().do_GET()

    def machine(self, u):
        cmd = u.path[len("/machine"):]
        if cmd not in PASS:
            return self.reply(403, "not passed to the machine")
        q = parse_qs(u.query)
        if cmd == "/cmd" and q.get("a", [""])[0] in ("S", "K"):
            RUNNER.board_stopped(hard=q["a"][0] == "K")
        if cmd in ("/origin/x", "/origin/y") or (
                cmd == "/cmd" and q.get("a", [""])[0] in ("X", "Y") and q.get("n", ["0"])[0] != "0"):
            PARK.forget()   # a new zero or a jog: the parked place is no longer where the carriage is
        answer = board_get(cmd + ("?" + u.query if u.query else ""))
        return self.reply(200, answer, board="ok" if BOARD is not None and BOARD.ser is not None else "lost")

    def do_POST(self):
        path = urlparse(self.path).path
        if path.startswith("/remote/"):
            return self.remote(urlparse(self.path), True)
        if not self.local():
            return self.reply(403, "this Mac only")
        if path == "/library":
            # 💾 SAVE on the Create tab: {"svg": the drawing, "png": its preview as a data URL}
            try:
                body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0) or 0)))
                base = library_save(LIBRARY_DIR, body.get("svg"), body.get("png"))
            except (ValueError, TypeError, AttributeError) as e:
                return self.reply(400, json.dumps({"ok": False, "message": str(e) or "not a drawing"}), "application/json")
            return self.reply(200, json.dumps({"ok": True, "file": base, "name": library_display(base)}), "application/json")
        if path in ("/brush/off", "/brush/on"):
            if RUNNER.state in LIVE:
                return self.reply(409, "a job is running")
            deg = BRUSH_UP_DEG if path == "/brush/off" else 0     # the elbow, the new arm
            try:
                ARM.move_to("elbow", deg)
            except ArmError as e:
                return self.reply(200, str(e))
            RUNNER._brush_at(deg)
            return self.reply(200, f"ok J 2 {deg}")
        if path == "/arm/hold":
            # STOP for the arm (2026-10-02): a slow stroke stays where it is
            return self.reply(200, ARM.stop())
        if path == "/arm":
            # the arm jog of the Calibration tab: a joint to an angle, in
            # RUBENS's degrees (class Arm); not while a job runs
            if RUNNER.state in LIVE:
                return self.reply(409, "a job is running")
            q = parse_qs(urlparse(self.path).query)
            jn = q.get("j", [""])[0]
            if jn not in JOINTS:
                return self.reply(400, "which joint?")
            try:
                v = float(q["v"][0]) if q.get("v") else None
                got = ARM.move_to(jn, float(q.get("d", ["0"])[0]), v if v and v > 0 else None)
            except (ArmError, ValueError) as e:
                return self.reply(200, json.dumps({"ok": False, "message": str(e)}), "application/json")
            if jn == "elbow":
                RUNNER._brush_at(round(got))
            return self.reply(200, json.dumps({"ok": True, "angle": got}), "application/json")
        if path == "/run/stop":
            return self.reply(200, RUNNER.stop())
        if path == "/run/kill":
            return self.reply(200, RUNNER.stop(hard=True))
        if path == "/run/trim":
            try:
                t = RUNNER.set_trim(parse_qs(urlparse(self.path).query)["deg"][0])
            except (KeyError, IndexError, ValueError):
                return self.reply(400, "trim: /run/trim?deg=<degrees>")
            return self.reply(200, json.dumps({"ok": True, "trim": t}), "application/json")
        if path == "/run/back":
            ok, why, ask = RUNNER.back_one(sure="sure" in parse_qs(urlparse(self.path).query))
            return self.reply(200 if ok else 409, json.dumps({"ok": ok, "message": why, "state": RUNNER.state, **({"ask": ask} if ask else {})}), "application/json")
        if path == "/run/dip":
            ok = RUNNER.dip()
            return self.reply(200 if ok else 409, "ok" if ok else f"not now: the runner is {RUNNER.state}, or no cup in the run")
        if path in ("/run/pause", "/run/p-pause", "/run/continue"):
            ok = RUNNER.resume() if path == "/run/continue" else RUNNER.pause(pencil=path == "/run/p-pause")
            return self.reply(200 if ok else 409, "ok" if ok else f"not now: the runner is {RUNNER.state}")
        if path in ("/shutdown", "/restore"):
            ok, msg, park = PARK.shut_down(RUNNER) if path == "/shutdown" else PARK.restore()
            return self.reply(200, json.dumps({"ok": ok, "message": msg, "park": park}), "application/json")
        if path != "/run":
            return self.reply(404, "")
        if not RUNS_ENABLED:
            return self.reply(503, "runs are off: the pass firmware is being fixed after a diagonal pass ran the Y axis away (2026-09-27)")
        # A body {"blocks": [...]} runs those blocks (a calibration run, such
        # a calibration run); no body runs the machine blocks of job.json.
        body = self.rfile.read(int(self.headers.get("Content-Length", 0) or 0))
        note = None
        try:
            if body:
                sent = json.loads(body)
                blocks, note = sent["blocks"], sent.get("log")    # the page's settings, for the run journal
            else:
                with open(FILES["/job"], encoding="utf-8") as f:
                    blocks = json.load(f)["machine"]["blocks"]
            if not isinstance(blocks, list) or not blocks:
                raise ValueError
        except (OSError, ValueError, KeyError, TypeError):
            return self.reply(400, "no machine blocks: record the canvas corners, then Save job.json")
        ok, msg = RUNNER.start(blocks, note)
        if ok:
            PARK.forget()
        return self.reply(200 if ok else 409, msg)

    def do_DELETE(self):
        if not self.local():
            return self.reply(403, "this Mac only")
        path = unquote(urlparse(self.path).path)
        if not path.startswith("/library/"):
            return self.reply(404, "")
        ok = library_delete(LIBRARY_DIR, path[len("/library/"):])
        return self.reply(200 if ok else 404, "moved to library/.deleted" if ok else "no such drawing")

    def do_PUT(self):
        if not self.local():
            return self.reply(403, "this Mac only")
        path = FILES.get(urlparse(self.path).path)
        if not path:
            return self.reply(404, "")
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        try:
            json.loads(body)
        except ValueError:
            return self.reply(400, "not JSON")
        if path == FILES["/calibration"]:
            # The Calibration tab saves the corners with whatever arm zero it
            # loaded; a tab opened before the arm zero changed would put the
            # old one back (2026-09-30: the wrist's zero was set right while
            # the tab was open). The arm zero is never the page's: keep the file's.
            new = json.loads(body)
            try:
                with open(path, encoding="utf-8") as f:
                    old = json.load(f)
            except (OSError, ValueError):
                old = {}
            if "arm" in old:
                new["arm"] = old["arm"]
            else:
                new.pop("arm", None)
            body = json.dumps(new, indent=2).encode("utf-8")
        tmp = path + ".tmp"
        with open(tmp, "wb") as f:
            f.write(body)
        os.replace(tmp, path)
        return self.reply(200, "saved")


if __name__ == "__main__":
    server = ThreadingHTTPServer((LISTEN, PORT), Handler)   # the port first: a second copy stops here
    REMOTE_KEY = remote_key()
    BOARD = Board()
    BOARD.start()
    print(f"Rembrandt: http://localhost:{PORT}  (the board on USB, {PORT_GLOB})", flush=True)
    if LISTEN != "127.0.0.1" and lan_ip():
        print(f"The iPhone's remote: http://{lan_ip()}:{PORT}/remote — its key by the QR code on OPM-N", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
