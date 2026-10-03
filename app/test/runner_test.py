"""The job runner in rembrandt.py, against a fake board — no USB, no machine.

    cd rubens-preview && python3 -m unittest discover -s test -p '*_test.py'
"""
import json
import math
import os
import sys
import tempfile
import threading
import time
import unittest
from urllib.parse import parse_qs, unquote, urlparse

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import rembrandt as rubens  # noqa: E402  (rubens.py of RUBENS, renamed)
from rembrandt import (BRUSH_UP_DEG, REACH, STEPS_PER_MM, SWING_DEG, TICKS_PER_DEG, Arm, ArmError, Board, Park, Runner,  # noqa: E402
                    along_piece, block_end, board_get, board_line, in_english, library_delete, library_display,
                    library_list, library_save, painted_so_far, parse_look, parse_ping, path_pieces, piece_at,
                    rest_of, arm_at_piece)


class FakeBoard:
    """Answers like the draft firmware behind the bridge. Time passes only in
    sleep(): a running path eats `rate` pieces per 0.2 s."""

    SIGN, OFF, LIM = {1: -1, 2: 1, 3: 1}, {1: 5, 2: 5, 3: 0}, {1: 45, 2: 45, 3: 150}

    def __init__(self, zero=True, rate=3, edge_on=None, paths=True, stuck_x=False, knows_w=True):
        self.log, self.queue, self.running = [], [], False
        self.zero, self.rate, self.edge_on, self.paths = zero, rate, edge_on, paths
        self.stuck_x = stuck_x                 # X does not move: the path ends early
        self.knows_w = knows_w                 # False: the firmware before 2026-10-02's W
        self.max_queue, self.on_sleep = 0, None
        self.x, self.y = 800, 267
        self.goal = None                       # where the queued pieces end, steps
        # the arm as the firmware runs it: raw servo poses, a joint's zero taken
        # at its first command (or by Z), degrees with JOINT_SIGN and JOINT_OFFSET
        self.raw = {1: 2501, 2: 1759, 3: 1489}
        self.zt = {1: -1, 2: -1, 3: -1}
        self.tdeg = {1: 0, 2: 0, 3: 0}
        self.rides, self.wnext = [], None       # W: the wrist on each queued piece, and one waiting for its piece

    def send(self, path):
        u = urlparse(path)
        q = parse_qs(u.query)
        if u.path == "/ping":
            xy = f"X {self.x} Y {self.y}" if self.zero else "X ? Y ?"
            return f"ok P {xy}" + (f" путь {len(self.queue)}" if self.running else "")
        if u.path in ("/origin/x", "/origin/y"):
            a, at = u.path[-1].upper(), int(q["at"][0])
            self.log.append(f"O {a} {at}")
            setattr(self, a.lower(), at)
            self.zero = True                   # the fake keeps one flag for both axes
            return f"ok O {a} {at}"
        if u.path == "/look":
            return "ok V | X MCPWM_PCNT, Y MCPWM_PCNT | путь: пусто 0 | " + " | ".join(
                f"{j}: поза {self.raw[j]}, 11,3 В, 30 °C" for j in (1, 2, 3))
        if u.path == "/zero":
            self.log.append("Z")
            for j in (1, 2, 3):
                self.zt[j] = self.raw[j] - round(self.SIGN[j] * self.OFF[j] * TICKS_PER_DEG)
                self.tdeg[j] = 0
            return "ok Z 3"
        if u.path == "/hold":
            self.log.append("H")
            return "ok H 3"
        if u.path == "/servo":
            jid = {"shoulder": 1, "elbow": 2, "wrist": 3}[q["j"][0]]
            d = max(-self.LIM[jid], min(self.LIM[jid], int(float(q["d"][0]))))
            self.log.append(f"J {jid} {d}" + (f" v{q['v'][0]}" if "v" in q else ""))
            if self.zt[jid] < 0:
                self.zt[jid] = self.raw[jid]            # takeZero: the pose at the first command
            self.turn(jid, d)
            return f"ok J {jid} {d}"
        if u.path == "/cmd":
            a = q["a"][0]
            self.log.append(a)
            if a == "S" and self.running and self.queue and self.queue[0][0] == "L":
                # braking on the line: the carriage stops halfway along the piece it is on
                end = block_end([self.queue[0]])
                self.x = round((self.x + end[0] * STEPS_PER_MM[0]) / 2)
                self.y = round((self.y + end[1] * STEPS_PER_MM[1]) / 2)
            self.running, self.queue, self.rides, self.wnext = False, [], [], None
            return f"ok {a}"
        if u.path == "/raw":
            if not self.paths:                 # the old bridge: no /raw at all
                return "bridge answers 404 to /raw"
            c = unquote(q["c"][0])
            if c[0] in "FT":
                self.log.append(c)
                return f"ok {c[0]} {float(c.split()[1]):.1f}"
            if c[0] == "W":
                if not self.knows_w:
                    return "?"
                self.log.append(c)
                p = c.split()
                self.wnext = (int(p[1]), float(p[2]))
                return f"ok W {p[1]} {float(p[2]):.1f}"
            if c == "G":
                self.log.append("G")
                if not self.queue:
                    return "? очередь пуста"
                self.running = True
                return "ok G"
            if self.edge_on and self.edge_on in c:
                return f"край {c[0]}"
            if len(self.queue) >= 16:
                return "? очередь полна"
            self.queue.append(c)
            self.rides.append(self.wnext)
            self.wnext = None
            self.log.append(c)
            end = block_end([c])
            self.goal = (round(end[0] * STEPS_PER_MM[0]), round(end[1] * STEPS_PER_MM[1]))
            self.max_queue = max(self.max_queue, len(self.queue))
            return f"ok {c[0]} {16 - len(self.queue)}"
        return "?"

    def turn(self, jid, d):
        self.tdeg[jid] = d
        for j in (1, 2, 3):                              # moveArm: every zeroed joint, one packet
            if self.zt[j] >= 0:
                self.raw[j] = max(0, min(4095, self.zt[j] + round(self.SIGN[j] * (self.tdeg[j] + self.OFF[j]) * TICKS_PER_DEG)))


    def sleep(self, dt):
        if self.on_sleep:
            self.on_sleep()
        if self.running:
            for w in self.rides[:self.rate]:             # the board turns the joint as it reaches the piece
                if w is not None:
                    self.turn(*w)
            self.rides = self.rides[self.rate:]
            done, self.queue = self.queue[:self.rate], self.queue[self.rate:]
            if self.stuck_x:                   # the board stops the path on the fault
                self.queue = []
                self.y = self.goal[1]
            elif done:                         # the carriage is at the end of the last piece run
                end = block_end([done[-1]])
                self.x, self.y = round(end[0] * STEPS_PER_MM[0]), round(end[1] * STEPS_PER_MM[1])
            if not self.queue:
                self.running = False


def run(board, blocks, **kw):
    r = Runner(board.send, sleep=board.sleep, swing_s=0.4, **kw)
    ok, _ = r.start(blocks)
    assert ok
    r.thread.join(10)
    return r


OFF = f"J 2 {BRUSH_UP_DEG}"   # the brush off the canvas: the elbow up (the new arm, 2026-10-02)
ON = "J 2 0"                  # pressed to it


def arm(off):
    return {"kind": "arm", "cmd": OFF if off else ON, "off": off}


def travel(x, y):
    return {"kind": "move", "cmds": ["T 100", f"M {x} {y}", "G"], "paintMM": 0}


def paint(n, mm=100.0):
    return {"kind": "move", "cmds": ["F 20"] + [f"L {i}.00 50.00" for i in range(1, n + 1)] + ["G"], "paintMM": mm}


class RunnerTest(unittest.TestCase):
    def test_a_job_runs_in_order(self):
        b = FakeBoard()
        r = run(b, [arm(True), travel(10, 20), arm(False), paint(5), arm(True)])
        self.assertEqual(r.state, "done", r.message)
        self.assertEqual(b.log, ["T 100", OFF, "T 100", "M 10 20", "G", ON, "F 20"]
                         + [f"L {i}.00 50.00" for i in range(1, 6)] + ["G", OFF])
        self.assertEqual(r.status()["percent"], 100.0)
        self.assertFalse(r.brush_on)

    def test_long_pass_streams_through_a_queue_of_16(self):
        b = FakeBoard()
        r = run(b, [paint(40)])
        self.assertEqual(r.state, "done", r.message)
        sent = [c for c in b.log if c.startswith("L")]
        self.assertEqual(sent, [f"L {i}.00 50.00" for i in range(1, 41)])
        self.assertEqual(b.log.count("G"), 1)
        self.assertLessEqual(b.max_queue, 16)

    def test_the_percent_moves_while_a_long_block_is_still_being_sent(self):
        # a Brush lane is one block of some 80 pieces (2026-09-28: 0 % for most of it)
        b = FakeBoard()
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        seen = []
        b.on_sleep = lambda: seen.append((sum(c.startswith("L") for c in b.log), r.status()["percent"]))
        r.start([paint(80)])
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.assertTrue(any(sent < 80 and pct > 0 for sent, pct in seen), seen)
        pcts = [pct for _, pct in seen]
        self.assertEqual(pcts, sorted(pcts))           # never goes back
        self.assertEqual(r.status()["percent"], 100.0)

    def test_a_piece_past_the_wall_stops_everything(self):
        b = FakeBoard(edge_on="L 3.00")
        r = run(b, [arm(False), paint(5)])
        self.assertEqual(r.state, "error")
        self.assertIn("past a wall", r.message)
        self.assertEqual(b.log[-1], "S")

    def test_stop_brakes_and_says_the_brush_is_down(self):
        b = FakeBoard(rate=1)
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        ticks = {"n": 0}

        def later():
            ticks["n"] += 1
            if ticks["n"] == 5:
                r.stop()
        b.on_sleep = later
        r.start([arm(False), paint(30), arm(True), paint(5)])
        r.thread.join(10)
        self.assertEqual(r.state, "stopped")
        self.assertIn("S", b.log)
        self.assertNotIn(OFF, b.log)          # the next blocks never ran
        self.assertIn("brush on the canvas", r.message)

    def test_hard_stop_after_stop_still_reaches_the_board(self):
        b = FakeBoard(rate=1)
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        ticks = {"n": 0}

        def later():
            ticks["n"] += 1
            if ticks["n"] == 5:
                r.stop()
                r.stop(hard=True)
        b.on_sleep = later
        r.start([arm(False), paint(30)])
        r.thread.join(10)
        self.assertEqual([c for c in b.log if c in "SK"][:2], ["S", "K"])

    def test_a_stop_goes_to_the_board_even_when_idle(self):
        b = FakeBoard()
        r = Runner(b.send, sleep=b.sleep)
        r.stop(hard=True)
        self.assertEqual(b.log, ["K"])

    def test_a_stop_from_a_page_ends_the_job_too(self):
        # 2026-09-28: STOP on the Calibration tab goes to the board, not to
        # the runner; the runner took the end of the path for the end of the
        # block and would have run the next one.
        b = FakeBoard(rate=1)
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        ticks = {"n": 0}

        def later():
            ticks["n"] += 1
            if ticks["n"] == 5:
                r.board_stopped()          # what rubens.py does as S passes by
                b.send("/cmd?a=S&n=0")     # and the S itself reaches the board
        b.on_sleep = later
        r.start([arm(False), paint(30), arm(True), travel(10, 20), arm(False), paint(5)])
        r.thread.join(10)
        self.assertEqual(r.state, "stopped")
        self.assertNotIn("M 10 20", b.log)
        self.assertNotIn(OFF, b.log)

    def test_a_hard_stop_from_a_page_is_not_softened(self):
        b = FakeBoard(rate=1)
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        ticks = {"n": 0}

        def later():
            ticks["n"] += 1
            if ticks["n"] == 5:
                r.board_stopped(hard=True)
                r.board_stopped()
        b.on_sleep = later
        r.start([arm(False), paint(30)])
        r.thread.join(10)
        self.assertEqual(r._stop, "K")

    def test_a_runaway_past_a_wall_is_hard_stopped(self):
        b = FakeBoard(rate=0)                   # the path never ends by itself
        ticks = {"n": 0}

        def run_away():                         # Y counts on and on, like on 2026-09-27
            ticks["n"] += 1
            b.y = 267 + 2000 * ticks["n"]
        b.on_sleep = run_away
        r = run(b, [arm(False), paint(3)])
        self.assertEqual(r.state, "error")
        self.assertIn("runaway: Y", r.message)
        self.assertIn("K", b.log)

    def test_a_job_starts_from_home_in_the_reserve(self):
        # home is past both walls, at the stops: X −9.45 mm, Y −8.3 mm
        b = FakeBoard()
        b.x, b.y = -756, -222
        r = run(b, [arm(True), travel(10, 20), arm(False), paint(3)])
        self.assertEqual(r.state, "done", r.message)

    def test_no_zero_no_motion(self):
        b = FakeBoard(zero=False)
        r = run(b, [arm(True), travel(10, 20)])
        self.assertEqual(r.state, "error")
        self.assertIn("zero", r.message)
        self.assertEqual([c for c in b.log if c != "S"], [])

    def test_without_the_pass_firmware_nothing_moves(self):
        b = FakeBoard(paths=False)
        r = run(b, [arm(True), travel(10, 20), arm(False), paint(5)])
        self.assertEqual(r.state, "error")
        self.assertIn("cannot run a path", r.message)
        self.assertEqual([c for c in b.log if c != "S"], [])   # not even the brush

    def test_a_travel_to_where_the_carriage_is_is_skipped(self):
        b = FakeBoard()
        empty = {"kind": "move", "cmds": ["T 100", "G"], "paintMM": 0}   # its M was too short to queue
        r = run(b, [arm(True), empty, arm(False), paint(3)])
        self.assertEqual(r.state, "done", r.message)
        self.assertIn("L 3.00 50.00", b.log)

    def test_a_path_the_board_stopped_is_not_taken_for_done(self):
        # 2026-09-28: X stuck after a HARD STOP; the board stopped each path,
        # the runner went on, lowered the pencil and ran along Y only
        b = FakeBoard(stuck_x=True)             # the carriage stands at X 10 mm
        r = run(b, [arm(True), travel(100, 20), arm(False), paint(5)])
        self.assertEqual(r.state, "error")
        self.assertIn("did not get there", r.message)
        self.assertNotIn(ON, b.log)            # the brush never went down
        self.assertIn("K", b.log)

    def test_board_words_in_english(self):
        self.assertEqual(in_english("край A"), "past a wall")
        self.assertIn("restart the board", in_english("? путь: такт не берётся 0"))
        self.assertEqual(in_english("ok L 12"), "ok L 12")

    def test_the_servo_bus_scan_and_an_id_change(self):
        self.assertEqual(board_line("/scan")[0], "B")
        self.assertEqual(board_line("/servo-id?from=1&to=2")[0], "I 1 2")
        for bad in ("/servo-id?from=1&to=1", "/servo-id?from=1&to=254", "/servo-id?from=x&to=2", "/servo-id?to=2"):
            with self.assertRaises(ValueError, msg=bad):
                board_line(bad)
        self.assertEqual(in_english("? занят 2"), "that id answers on the bus already")
        self.assertEqual(in_english("? нет серво 1"), "no servo answers at that id")

    def test_block_end(self):
        self.assertEqual(block_end(["F 20", "L 1 2", "A 0 0 3.5 4 -1", "G"]), (3.5, 4.0))
        self.assertEqual(block_end(["T 100", "M 10 20", "G"]), (10.0, 20.0))
        self.assertIsNone(block_end(["T 100", "G"]))

    def test_parse_ping(self):
        self.assertEqual(parse_ping("ok P X 800 Y 267 путь 3"), {"x": 800, "y": 267, "path": 3})
        self.assertEqual(parse_ping("ok P X 0 край Y ? "), {"x": 0, "y": None, "path": None})
        self.assertIsNone(parse_ping("нет платы"))


class RunLogTest(unittest.TestCase):
    """The run journal (the owner, 2026-10-02): the settings at the start, each
    pause and Continue, the end."""

    def test_a_run_writes_its_settings_its_pauses_and_its_end(self):
        b, got = FakeBoard(), []
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2, log=got.append)
        def later():
            if r.state == "paused":
                r.resume()
        b.on_sleep = later
        ok, _ = r.start([arm(True), travel(10, 20), arm(False), paint(3), arm(True),
                         {"kind": "pause", "why": "D3, dark grey: its paint on the brush, then Continue"},
                         travel(30, 20), arm(False), paint(3), arm(True)],
                        {"page": "test", "settings": {"pattern": "D", "passes": ["D2", "D3"], "tilt": 10}})
        self.assertTrue(ok)
        r.thread.join(10)
        events = [e["event"] for e in got]
        self.assertEqual(events, ["start", "pause", "continue", "done"])
        self.assertEqual(got[0]["settings"]["passes"], ["D2", "D3"])
        self.assertEqual(got[1]["why"], "D3, dark grey: its paint on the brush, then Continue")
        self.assertEqual(got[-1]["percent"], 100.0)

    def test_the_journal_is_a_json_line_a_record_and_never_fails(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "logs", "runs.jsonl")
            rubens.run_log({"event": "start", "settings": {"rows": 18}}, path)
            rubens.run_log({"event": "done"}, path)
            lines = open(path, encoding="utf-8").read().splitlines()
            self.assertEqual([json.loads(x)["event"] for x in lines], ["start", "done"])
            self.assertIn("at", json.loads(lines[0]))
            rubens.run_log({"event": "x"}, os.path.join(d, "runs.jsonl", "no"))   # a file in the way: nothing raised


class PauseTest(unittest.TestCase):
    """Pause and Continue (the owner, 2026-09-28: a blunt pencil, sharpened
    without starting the job over)."""

    def paused_run(self, blocks, when, then=None):
        # Pause on tick `when`; `then(r, b)` runs once the runner is paused,
        # and by default presses Continue.
        b = FakeBoard(rate=1)
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        ticks = {"n": 0, "done": False}

        def later():
            ticks["n"] += 1
            if ticks["n"] == when:
                self.assertTrue(r.pause())
            if r.state == "paused" and not ticks["done"]:
                ticks["done"] = True
                (then or (lambda r, b: r.resume()))(r, b)
        b.on_sleep = later
        r.start(blocks)
        r.thread.join(10)
        return r, b

    def test_a_pass_brakes_the_brush_lifts_and_the_rest_goes_on_from_that_point(self):
        r, b = self.paused_run([arm(False), paint(12)], when=4)
        self.assertEqual(r.state, "done", r.message)
        i = b.log.index("S")
        self.assertEqual(b.log[i + 1:i + 3], [OFF, ON])                # off the canvas, and back
        after = [c for c in b.log[i:] if c.startswith("L")]
        before = [c for c in b.log[:i] if c.startswith("L")]
        self.assertEqual(after[-1], "L 12.00 50.00")                    # the pass is finished
        first = int(after[0].split()[1].split(".")[0])
        self.assertEqual(after, [f"L {k}.00 50.00" for k in range(first, 13)])   # nothing skipped
        ran = [c for c in before if int(c.split()[1].split(".")[0]) < first]
        self.assertTrue(ran, "some of the pass ran before the pause")
        self.assertNotIn("K", b.log)
        self.assertEqual(r.status()["percent"], 100.0)

    def test_continue_puts_the_brush_back_tilted_as_it_was(self):
        tilt = {"kind": "arm", "cmd": "J 2 5"}                         # pressed lighter, still on it
        r, b = self.paused_run([arm(False), tilt, paint(12)], when=4)
        self.assertEqual(r.state, "done", r.message)
        i = b.log.index("S")
        self.assertEqual(b.log[i + 1:i + 3], [OFF, "J 2 5"])           # off, and back to as light as it was

    def test_a_travel_ends_first_then_the_pause(self):
        r, b = self.paused_run([arm(True), travel(100, 20), arm(False), paint(3)], when=2)
        self.assertEqual(r.state, "done", r.message)
        self.assertNotIn("S", b.log)                                    # the travel was not braked
        self.assertLess(b.log.index("M 100 20"), b.log.index(ON))

    def test_stop_while_paused_ends_the_job(self):
        r, b = self.paused_run([arm(False), paint(12), arm(True), travel(10, 20)], when=4,
                               then=lambda r, b: r.stop())
        self.assertEqual(r.state, "stopped")
        self.assertNotIn("M 10 20", b.log)
        self.assertEqual(b.log.count(ON), 1)                            # the brush stays off

    def test_hard_stop_while_paused_reaches_the_board(self):
        r, b = self.paused_run([arm(False), paint(12)], when=4, then=lambda r, b: r.stop(hard=True))
        self.assertEqual(r.state, "stopped")
        self.assertEqual(b.log[-1], "K")

    def test_continue_only_when_paused_and_no_new_start_meanwhile(self):
        r = Runner(FakeBoard().send)
        self.assertFalse(r.resume())
        self.assertFalse(r.pause())                                     # idle: nothing to pause
        with r.lock:
            r.state = "paused"
        ok, _ = r.start([arm(True)])
        self.assertFalse(ok)                                            # a paused job is still a job

    def test_after_a_pause_the_turn_stays_slow(self):
        cmds = ["F 80", "L 10 0", "F 37", "A 10 5 10 10 1", "F 80", "L 0 10", "G"]
        self.assertEqual(rest_of(cmds, 0), cmds)
        self.assertEqual(rest_of(cmds, 1), ["F 37", "A 10 5 10 10 1", "F 80", "L 0 10", "G"])
        self.assertEqual(rest_of(cmds, 2), ["F 80", "L 0 10", "G"])

    def test_piece_at_finds_the_piece_on_lines_and_arcs(self):
        path = ["L 10 0", "A 10 5 10 10 1", "L 0 10"]                   # a U: right, a half circle up, back left
        self.assertEqual(piece_at((0, 0), path, (4, 0)), 0)
        self.assertEqual(piece_at((0, 0), path, (15, 5)), 1)            # the far side of the half circle
        self.assertIsNone(piece_at((0, 0), path, (5, 5)))               # inside the U: on no piece
        self.assertEqual(piece_at((0, 0), path, (6, 10)), 2)
        self.assertEqual(piece_at((0, 0), path, (10, 0), first=1), 1)  # a joint: the later piece, if asked


class WaitTest(unittest.TestCase):
    """A wait block (2026-10-03, INK ON on the Test tab): the brush stands in
    the cup's paint a second, everything still."""

    def slept(self, blocks):
        b, total = FakeBoard(), [0.0]
        def sleep(dt):
            total[0] += dt
            b.sleep(dt)
        r = Runner(b.send, sleep=sleep, swing_s=0.4)
        ok, msg = r.start(blocks)
        self.assertTrue(ok, msg)
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        return total[0], b

    def test_the_brush_stands_in_the_paint_that_long(self):
        dip = [travel(400, 90), {"kind": "arm", "cmd": "J 2 5"}]
        out = [{"kind": "arm", "cmd": "J 2 35"}]
        without, _ = self.slept(dip + out)
        with_it, b = self.slept(dip + [{"kind": "wait", "s": 1}] + out)
        self.assertAlmostEqual(with_it - without, 1.0, delta=0.21)
        self.assertEqual([c for c in b.log if c[0] in "MJ"], ["M 400 90", "J 2 5", "J 2 35"], "the wait adds no move")

    def test_a_wait_out_of_range_is_refused_before_anything_moves(self):
        for w in (11, -1, True, None, "1"):
            r = Runner(FakeBoard().send, sleep=lambda dt: None)
            ok, msg = r.start([{"kind": "wait", "s": w}])
            self.assertFalse(ok, w)
            self.assertIn("wait", msg)


class ArmStrokeRunTest(unittest.TestCase):
    """Rembrandt's arm strokes in a run (2026-10-02): a joint at its speed, a
    pause for paint, STOP stopping the arm too."""

    ZERO = {"shoulder": 2501, "elbow": 1759, "wrist": 1489}

    def runner(self, b):
        arm = Arm(b.send, zero=lambda: self.ZERO, sleep=b.sleep)
        return Runner(b.send, sleep=b.sleep, swing_s=0, arm=arm), arm

    def test_a_joint_block_is_checked_before_anything_moves(self):
        r, _ = self.runner(FakeBoard())
        self.assertFalse(r.start([{"kind": "joint", "joint": "shoulder", "deg": 60, "speed": 10}])[0])
        self.assertFalse(r.start([{"kind": "joint", "joint": "wrist", "deg": 0, "speed": 10}])[0])
        self.assertFalse(r.start([{"kind": "joint", "joint": "shoulder", "deg": 20, "speed": 500}])[0])

    def test_the_stroke_goes_at_its_speed_and_the_pause_waits(self):
        b = FakeBoard()
        r, arm = self.runner(b)
        blocks = [{"kind": "arm", "cmd": ON},
                  {"kind": "joint", "joint": "shoulder", "deg": 20, "speed": 10},
                  {"kind": "arm", "cmd": OFF},
                  {"kind": "pause", "why": "paint for the brush"},
                  {"kind": "joint", "joint": "shoulder", "deg": -20, "speed": 10}]
        r.blocks, r.state = blocks, "running"
        waited = []
        def sleep(s):
            if r.state == "paused" and not waited:
                waited.append(r.message)
                r.resume()
        b.sleep = sleep
        r.sleep = arm.sleep = sleep
        r.run()
        self.assertEqual(r.state, "done", r.message)
        self.assertEqual(waited, ["paint for the brush"])
        self.assertTrue(any(c.startswith("J 1") and c.endswith(" v10") for c in b.log), b.log)
        self.assertLess(abs(arm.angles()[0]["shoulder"] + 20), 0.6)

    def test_stop_stops_the_arm_too(self):
        b = FakeBoard()
        r, arm = self.runner(b)
        r.state = "running"
        r.stop()
        self.assertIn("H", b.log)
        self.assertTrue(arm.stopped.is_set())


class ElbowOnPathTest(unittest.TestCase):
    """W (2026-10-02, the new arm): the elbow lands and lifts the brush on the
    move, the board turning it as the carriage reaches each piece."""

    ZERO = {"shoulder": 2501, "elbow": 1759, "wrist": 1489}
    # a row: landing from the lift-off (10°) to pressed (0°), pressed, and up again to the lift-off
    PASS = ["F 20", "W 2 5 211", "L 1.00 50.00", "W 2 0 88", "L 2.00 50.00", "L 3.00 50.00",
            "L 4.00 50.00", "W 2 5 88", "L 5.00 50.00", "W 2 10 88", "L 6.00 50.00", "G"]

    def runner(self, b):
        b.raw[2] = 1759 - round(BRUSH_UP_DEG * TICKS_PER_DEG)        # the brush up: the elbow's plus is the firmware's minus
        return Runner(b.send, sleep=b.sleep, swing_s=0.2, arm=Arm(b.send, zero=lambda: self.ZERO, sleep=b.sleep))

    def blocks(self):
        return [arm(True), travel(100, 20), {"kind": "move", "cmds": list(self.PASS), "paintMM": 60.0, "painted": [1] * 6}, arm(True)]

    def elbow(self, b):
        return -(b.raw[2] - self.ZERO["elbow"]) / TICKS_PER_DEG

    def test_w_goes_as_steps_from_a_zero_taken_where_the_elbow_stands_before_any_piece(self):
        b = FakeBoard()
        r = self.runner(b)
        r.start(self.blocks())
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        ws = [c for c in b.log if c.startswith("W ")]
        self.assertEqual(ws, ["W 2 20.0 211", "W 2 25.0 88", "W 2 20.0 88", "W 2 15.0 88"])   # from +25°, the plus the firmware's minus: 5, 0, 5, 10
        first = b.log.index(ws[0])
        z = max(i for i, c in enumerate(b.log[:first]) if c == "Z")
        self.assertFalse([c for c in b.log[z:first] if c[0] in "LAM"], "the zero before any piece is queued")
        m = b.log.index("M 100 20")
        self.assertFalse([c for c in b.log[m:first] if c.startswith("J")], "no landing with the carriage standing")
        self.assertLess(abs(self.elbow(b) - BRUSH_UP_DEG), 1, "up at the end")
        self.assertFalse(r.brush_on)

    def test_a_pause_on_the_move_lifts_from_where_the_board_turned_the_elbow_and_goes_on_with_the_ws_still_to_come(self):
        b = FakeBoard(rate=1)
        r = self.runner(b)
        ticks = {"n": 0}

        def later():
            if any(c.startswith("W ") for c in b.log) and b.running:    # the pass under way
                ticks["n"] += 1
                if ticks["n"] == 3:
                    self.assertTrue(r.pause())
            if r.state == "paused" and not ticks.get("seen"):
                ticks["seen"] = (r.lift, r.brush_on, round(self.elbow(b)))
                r.resume()
        b.on_sleep = later
        r.start(self.blocks())
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.assertEqual(ticks["seen"], (0, False, BRUSH_UP_DEG), "the board had pressed it: up for the pause, pressed to come back to")
        after = b.log[b.log.index("S"):]
        again = [c for c in after if c.startswith("W ")]
        self.assertTrue(again and len(again) < 4, f"only the later ones again: {again}")
        self.assertIn("L 6.00 50.00", after)
        self.assertLess(abs(self.elbow(b) - BRUSH_UP_DEG), 1)

    def test_the_board_without_w_stops_it_before_a_piece_is_queued(self):
        b = FakeBoard(knows_w=False)
        r = self.runner(b)
        r.start(self.blocks())
        r.thread.join(10)
        self.assertEqual(r.state, "error")
        self.assertIn("flash the firmware", r.message)
        self.assertNotIn("L 1.00 50.00", b.log)

    def test_a_w_past_the_reach_or_on_the_shoulder_is_refused_before_anything_moves(self):
        for w, why in (("W 2 46 88", "elbow may go"), ("W 2 -6 88", "elbow may go"), ("W 1 10 88", "elbow (2) or the wrist (3)")):
            b = FakeBoard()
            bad = self.blocks()
            bad[2]["cmds"] = ["F 20", w, "L 1.00 50.00", "G"]
            ok, msg = self.runner(b).start(bad)
            self.assertFalse(ok, w)
            self.assertIn(why, msg)
            self.assertEqual(b.log, [])

    def test_a_job_that_puts_the_brush_away_with_the_wrist_is_refused(self):
        b = FakeBoard()
        ok, msg = self.runner(b).start([{"kind": "arm", "cmd": f"J 3 {SWING_DEG}"}, travel(10, 20)])
        self.assertFalse(ok)
        self.assertIn("Job tab", msg)
        self.assertEqual(b.log, [])

    def test_rest_of_keeps_the_ws_of_the_pieces_still_to_come(self):
        cmds = ["F 20", "W 2 10 211", "L 1 0", "W 2 0 88", "L 2 0", "F 10", "W 2 12 88", "A 2 5 2 10 1", "L 0 10", "G"]
        self.assertEqual(rest_of(cmds, 0), ["F 20", "L 1 0", "W 2 0 88", "L 2 0", "F 10", "W 2 12 88", "A 2 5 2 10 1", "L 0 10", "G"])
        self.assertEqual(rest_of(cmds, 1), ["F 20", "L 2 0", "F 10", "W 2 12 88", "A 2 5 2 10 1", "L 0 10", "G"])
        self.assertEqual(rest_of(cmds, 2), ["F 10", "A 2 5 2 10 1", "L 0 10", "G"])
        self.assertEqual([arm_at_piece(cmds, j) for j in range(4)], [10, 0, 12, 12])
        self.assertIsNone(arm_at_piece(["F 20", "L 1 0", "G"], 0))
        self.assertIsNone(arm_at_piece(["W 3 10 50", "L 1 0", "G"], 0), "the wrist's W is not the elbow's")


class ArmTest(unittest.TestCase):
    """The arm in RUBENS's degrees, whatever zero the board took (2026-09-28:
    twice the wrist took its zero at +90° and swung the brush to 180°)."""

    ZERO = {"shoulder": 2501, "elbow": 1759, "wrist": 1489}   # the working pose these cases were met in

    def arm(self, b):
        return Arm(b.send, zero=lambda: self.ZERO, sleep=b.sleep)

    def near(self, raw, want, ticks=7):
        self.assertLessEqual(abs(raw - want), ticks, f"{raw} instead of {want}")

    def test_the_brush_comes_back_from_180(self):
        b = FakeBoard()
        b.raw = {1: 1742, 2: 1678, 3: 3535}            # 2026-09-28: the brush upside down, the shoulder 67° off
        b.zt[3], b.tdeg[3] = 2511, 90                  # the zero the board took at +90°
        self.assertEqual(self.arm(b).angles()[0], {"shoulder": -66.7, "elbow": 7.1, "wrist": 179.8})   # the elbow's plus up since 2026-10-02
        self.arm(b).move_to("wrist", SWING_DEG)
        self.near(b.raw[3], 1489 + round(SWING_DEG * TICKS_PER_DEG))
        self.assertEqual((b.raw[1], b.raw[2]), (1742, 1678))   # the others only hold

    def test_a_slow_stroke_carries_its_speed_and_stops_on_stop(self):
        b = FakeBoard()
        arm = self.arm(b)
        arm.move_to("shoulder", 20, speed=5)                     # 2026-10-02: an arc of the brush, 5°/s
        self.assertTrue(any(c.startswith("J 1") and c.endswith(" v5") for c in b.log), b.log)
        self.assertLess(abs(arm.angles()[0]["shoulder"] - 20), 0.6)
        arm = Arm(b.send, zero=lambda: self.ZERO, sleep=lambda s: arm.stop())   # STOP while the stroke goes
        with self.assertRaises(ArmError):
            arm.move_to("shoulder", -20, speed=5)
        self.assertIn("H", b.log)

    def test_the_shoulder_comes_back_from_67_degrees_in_steps(self):
        b = FakeBoard()
        b.raw[1] = 1742
        got = self.arm(b).move_to("shoulder", 0)
        self.near(b.raw[1], 2501)
        self.assertLess(abs(got), 0.6)
        steps = [c for c in b.log if c.startswith("J 1")]
        self.assertGreaterEqual(len(steps), 2)                   # no step past the 45° limit
        self.assertTrue(all(abs(int(c.split()[2])) <= 45 for c in steps))

    def test_signs_plus_is_right_for_the_shoulder_and_the_elbow(self):
        # the owner, 2026-09-29: the shoulder's plus is the brush to the right,
        # as the elbow's; the firmware (JOINT_SIGN −1) and the pendant say minus
        b = FakeBoard()
        self.assertEqual(self.arm(b).move_to("shoulder", 15), 15)
        self.near(b.raw[1], 2501 + round(15 * TICKS_PER_DEG))      # where −15° of the firmware takes it
        self.assertTrue(all(c.startswith("J 1 -") for c in b.log if c.startswith("J 1")))
        self.assertEqual(self.arm(b).angles()[0]["shoulder"], 15)
        self.arm(b).move_to("elbow", 15)                          # the elbow lifts since 2026-10-02: plus is up, the firmware's minus
        self.near(b.raw[2], 1759 - round(15 * TICKS_PER_DEG))
        self.arm(b).move_to("wrist", -45)
        self.near(b.raw[3], 1489 - round(45 * TICKS_PER_DEG))

    def test_the_runner_swings_the_brush_in_rubens_degrees(self):
        b = FakeBoard()
        off = 1489 + round(SWING_DEG * TICKS_PER_DEG)
        b.raw[3] = off                                            # left off the canvas over the night
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2, arm=self.arm(b))
        r.start([arm(True), travel(100, 20), arm(False), paint(3), arm(True)])
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.near(b.raw[3], off)                                  # where it was, not twice as far
        self.assertFalse(r.brush_on)

    # ---- the camera on the holder, 2026-09-30: the wrist never past +10°;
    # +60° since 2026-10-02, the owner's word, for the broom at the turns ----
    def wrist_deg(self, b):
        return (b.raw[3] - self.ZERO["wrist"]) / TICKS_PER_DEG

    def test_the_brush_leaves_the_canvas_the_other_way_now(self):
        self.assertEqual(SWING_DEG, -54)
        self.assertEqual(REACH["wrist"], (-120, 90))                # the new arm, 2026-10-02: "+90, no further", "−120, not −180"

    def test_the_camera_is_named_only_past_the_plus_end(self):
        with self.assertRaisesRegex(ArmError, "camera"):
            self.arm(FakeBoard()).move_to("wrist", 95)
        with self.assertRaises(ArmError) as e:
            self.arm(FakeBoard()).move_to("wrist", -130)
        self.assertNotIn("camera", str(e.exception))

    def test_the_elbow_never_presses_past_minus_5(self):
        # the owner, 2026-10-02: "−5 max, or it tears the canvas or breaks the brush"
        self.assertEqual(REACH["elbow"], (-5, 45))
        for deg in (-6, -20, -45):
            b = FakeBoard()
            with self.assertRaises(ArmError, msg=deg):
                self.arm(b).move_to("elbow", deg)
            self.assertEqual([c for c in b.log if c.startswith("J")], [], f"{deg}°: a J was sent")

    def test_the_wrist_past_plus_90_is_refused_and_nothing_moves(self):
        for deg in (91, 131, 270):
            b = FakeBoard()
            with self.assertRaises(ArmError, msg=deg):
                self.arm(b).move_to("wrist", deg)
            self.assertEqual([c for c in b.log if c.startswith("J")], [], f"{deg}°: a J was sent")

    def test_the_wrist_goes_to_plus_90_and_never_steps_past_it(self):
        for start in (-125.6, -45.4, -90, 0, 59.4, 89.4):
            b = FakeBoard()
            b.raw[3] = self.ZERO["wrist"] + round(start * TICKS_PER_DEG)
            got = self.arm(b).move_to("wrist", 90)
            self.assertLessEqual(self.wrist_deg(b), 90.05, f"from {start}°: {self.wrist_deg(b):.2f}°")
            self.assertGreater(self.wrist_deg(b), 89.3, f"from {start}°: {self.wrist_deg(b):.2f}°: got there, in two steps if need be")
            self.assertLessEqual(got, 90.05)

    # ---- the new arm, 2026-10-02: the elbow lifts the brush; off the canvas from +15° ----
    def test_a_lighter_brush_is_still_on_the_canvas(self):
        b = FakeBoard()
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2, arm=self.arm(b))
        r.start([arm(True), travel(100, 20), arm(False), {"kind": "arm", "cmd": "J 2 5"}, paint(3)])
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.assertTrue(r.brush_on)
        self.assertEqual(r.lift, 5)
        self.assertLess(abs(-(b.raw[2] - self.ZERO["elbow"]) / TICKS_PER_DEG - 5), 0.6)

    def test_at_15_the_brush_is_off_the_canvas(self):
        b = FakeBoard()
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2, arm=self.arm(b))
        r.start([arm(True), travel(100, 20), arm(False), paint(3), {"kind": "arm", "cmd": "J 2 15"}])
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.assertFalse(r.brush_on)
        self.assertEqual(r.lift, 0)                               # Continue would bring back the last on the canvas

    def test_a_wrist_past_the_reach_does_not_start(self):
        b = FakeBoard()
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2, arm=self.arm(b))
        old = {"kind": "arm", "cmd": "J 3 190", "off": True}           # +90° before the camera; +180° the reach since the new arm
        ok, msg = r.start([old, travel(100, 20), arm(False), paint(3), old])
        self.assertFalse(ok)
        self.assertIn("camera", msg)
        self.assertEqual(r.state, "idle")
        self.assertEqual(b.log, [])                               # not even a ping

    def test_the_runner_without_an_arm_refuses_it_too(self):
        b = FakeBoard()
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        r.blocks = []
        with self.assertRaises(Exception):
            r._arm("J 3 190")
        self.assertEqual([c for c in b.log if c.startswith("J")], [])

    def test_a_job_makes_the_whole_arm_hold_before_anything_moves(self):
        b = FakeBoard()
        before = dict(b.raw)
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2, arm=self.arm(b))
        r.start([arm(True)])
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.assertTrue(all(b.zt[j] >= 0 for j in (1, 2, 3)), "all three joints were commanded")
        self.assertEqual((b.raw[1], b.raw[3]), (before[1], before[3]))   # the shoulder and the wrist did not move; the elbow put the brush up

    def test_parse_look(self):
        self.assertEqual(parse_look("ok V | X MCPWM_PCNT | 1: поза 2499, 11,3 В, 31 °C | 2: поза 1757, 11,3 В | 3: молчит"),
                         {1: 2499, 2: 1757})


class ParkTest(unittest.TestCase):
    """Shut down before the 12 V goes off, restore after power-on (2026-09-28)."""

    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.dir.name, "park.json")

    def tearDown(self):
        self.dir.cleanup()

    def park(self, b):
        return Park(self.path, b.send, sleep=b.sleep)

    def test_shut_down_hard_stops_and_saves_where_the_carriage_stands(self):
        b = FakeBoard()
        b.x, b.y = 41234, 9876
        ok, msg, park = self.park(b).shut_down(Runner(b.send, sleep=b.sleep))
        self.assertTrue(ok, msg)
        self.assertEqual(b.log, ["K"])
        with open(self.path) as f:
            saved = json.load(f)
        self.assertEqual((saved["x"], saved["y"], saved["used"]), (41234, 9876, False))

    def test_shut_down_stops_a_running_job(self):
        b = FakeBoard(rate=0)                   # the path never ends by itself
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        r.start([arm(False), paint(30)])
        deadline = time.time() + 5
        while "F 20" not in b.log and time.time() < deadline:   # the pass is under way
            time.sleep(0.001)
        ok, msg, _ = self.park(b).shut_down(r)
        r.thread.join(10)
        self.assertEqual(r.state, "stopped")
        self.assertIn("K", b.log)

    def test_shut_down_without_a_zero_saves_nothing_but_still_stops(self):
        b = FakeBoard(zero=False)
        ok, msg, park = self.park(b).shut_down(Runner(b.send, sleep=b.sleep))
        self.assertFalse(ok)
        self.assertEqual(b.log, ["K"])
        self.assertFalse(os.path.exists(self.path))

    def test_restore_puts_the_place_back_once(self):
        b = FakeBoard()
        b.x, b.y = 41234, 9876
        self.park(b).shut_down(Runner(b.send, sleep=b.sleep))
        after = FakeBoard(zero=False)           # power-on: no zero
        ok, msg, _ = self.park(after).restore()
        self.assertTrue(ok, msg)
        self.assertEqual(after.log, ["O X 41234", "O Y 9876"])
        again = FakeBoard(zero=False)           # the next power-on without Shut down
        ok, msg, _ = self.park(again).restore()
        self.assertFalse(ok)
        self.assertEqual(again.log, [])

    def test_restore_never_overwrites_a_zero_the_board_has(self):
        b = FakeBoard()
        self.park(b).shut_down(Runner(b.send, sleep=b.sleep))
        live = FakeBoard()
        ok, msg, _ = self.park(live).restore()
        self.assertFalse(ok)
        self.assertEqual(live.log, [])

    def test_a_jog_or_a_new_home_uses_the_place_up(self):
        b = FakeBoard()
        self.park(b).shut_down(Runner(b.send, sleep=b.sleep))
        self.park(b).forget()
        ok, msg, _ = self.park(FakeBoard(zero=False)).restore()
        self.assertFalse(ok)
        self.assertIn("find home", msg)


class FakePort:
    """A serial port: every line written gets `reply(line)` back on the next
    readline. Records the order of setRTS and setDTR."""

    def __init__(self, reply=lambda line: "ok " + line):
        self.reply, self.lines, self.pins, self.out = reply, [], [], []
        self.ready = threading.Event()

    def setRTS(self, v):
        self.pins.append(("RTS", v))

    def setDTR(self, v):
        self.pins.append(("DTR", v))

    def write(self, data):
        line = data.decode().rstrip("\n")
        self.lines.append(line)
        self.out.append((self.reply(line) + "\n").encode())
        self.ready.set()

    def readline(self):
        if not self.ready.wait(0.05):
            return b""
        self.ready.clear()
        return self.out.pop(0) if self.out else b""

    def close(self):
        pass


class BoardTest(unittest.TestCase):
    """The board on USB, in rubens.py since 2026-09-29 (it was bridge.py)."""

    def test_the_addresses_become_the_board_lines_of_the_bridge(self):
        self.assertEqual(board_line("/ping"), ("P", 0.25))
        self.assertEqual(board_line("/servo?j=shoulder&d=12.34&v=5"), ("J 1 12.3 5", 0.25))   # 2026-10-02
        self.assertEqual(board_line("/servo?j=wrist&d=-54"), ("J 3 -54", 0.25))
        self.assertEqual(board_line("/hold"), ("H", 0.5))
        with self.assertRaises(ValueError):
            board_line("/servo?j=shoulder&d=10&v=500")
        self.assertEqual(board_line("/look"), ("V", 2.0))
        self.assertEqual(board_line("/cmd?a=S&n=0")[0], "S")
        self.assertEqual(board_line("/cmd?a=K&n=0")[0], "K")
        self.assertEqual(board_line("/cmd?a=X&n=50")[0], "X 20")      # the jog level is held to the limit
        self.assertEqual(board_line("/cmd?a=Y&n=-50")[0], "Y -9")
        self.assertEqual(board_line("/zero")[0], "Z")
        self.assertEqual(board_line("/origin/y?at=-42")[0], "O Y -42")
        self.assertEqual(board_line("/raw?c=L 12.00 30.50")[0], "L 12.00 30.50")
        self.assertEqual(board_line("/servo?j=shoulder&d=-60")[0], "J 1 -45")
        self.assertEqual(board_line("/servo?j=wrist&d=90")[0], "J 3 90")

    def test_raw_lets_through_the_path_only(self):
        for bad in ("/raw?c=J 3 90", "/raw?c=Z", "/raw?c=", "/raw?c=L 1 2%0AK", "/servo?j=hand&d=5", "/cmd?a=Q", "/reboot"):
            with self.assertRaises(ValueError, msg=bad):
                board_line(bad)

    def test_no_reset_on_opening_rts_first(self):
        port = FakePort()
        b = Board(open_port=lambda name: port, ports=lambda: ["/dev/cu.usbserial-1"], log=lambda s: None)
        self.assertTrue(b.open())
        self.assertEqual(port.pins, [("RTS", False), ("DTR", False)])   # DTR first reset the board (2026-09-23)

    def test_one_command_one_reply(self):
        port = FakePort()
        b = Board(open_port=lambda name: port, ports=lambda: ["/dev/cu.usbserial-1"], log=lambda s: None)
        b.start()
        self.assertEqual(b.send("P"), "ok P")
        self.assertEqual(b.send("L 1.00 2.00"), "ok L 1.00 2.00")
        self.assertEqual(port.lines, ["P", "L 1.00 2.00"])

    def test_without_a_board_the_server_still_answers(self):
        b = Board(open_port=lambda name: None, ports=lambda: [], log=lambda s: None)
        self.assertFalse(b.open())
        self.assertEqual(b.send("P"), "no board")
        was = rubens.BOARD
        try:
            rubens.BOARD = None
            self.assertEqual(board_get("/ping"), "no board")
            self.assertEqual(board_get("/raw?c=Z"), "? raw")          # refused before the board is asked
        finally:
            rubens.BOARD = was


class LibraryTest(unittest.TestCase):
    """The Library: every SAVE a new drawing named by the time (2026-09-30)."""

    SVG = ('<svg xmlns="http://www.w3.org/2000/svg"><metadata id="rubens-state">'
           '{"format": "c70x100", "paths": [{"id": 1}, {"id": 2}]}</metadata></svg>')
    PNG = "data:image/png;base64," + __import__("base64").b64encode(b"\x89PNG fake").decode()
    T = time.mktime((2026, 9, 30, 1, 15, 20, 0, 0, -1))

    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def test_the_name_is_the_time_and_a_second_save_is_a_new_drawing(self):
        a = library_save(self.dir, self.SVG, self.PNG, now=self.T)
        b = library_save(self.dir, self.SVG, self.PNG, now=self.T + 10)
        c = library_save(self.dir, self.SVG, self.PNG, now=self.T + 60)
        self.assertEqual((a, b, c), ("2026-09-30 01-15", "2026-09-30 01-15 (2)", "2026-09-30 01-16"))
        self.assertEqual(library_display(b), "2026-09-30 01:15 (2)")
        for base in (a, b, c):
            self.assertTrue(os.path.exists(os.path.join(self.dir, base + ".svg")))
            self.assertTrue(os.path.exists(os.path.join(self.dir, base + ".png")))

    def test_the_list_is_newest_first_with_format_and_strokes(self):
        for dt in (0, 10, 60):
            library_save(self.dir, self.SVG, self.PNG, now=self.T + dt)
        lst = library_list(self.dir)
        self.assertEqual([i["name"] for i in lst], ["2026-09-30 01:16", "2026-09-30 01:15 (2)", "2026-09-30 01:15"])
        self.assertEqual((lst[0]["format"], lst[0]["strokes"], lst[0]["png"]), ("c70x100", 2, True))

    def test_only_a_rubens_drawing_is_saved(self):
        for svg, png in (("<svg/>", self.PNG), (self.SVG, "data:image/jpeg;base64,AAAA"), (None, self.PNG)):
            with self.assertRaises(ValueError):
                library_save(self.dir, svg, png, now=self.T)
        self.assertEqual(library_list(self.dir), [])

    def test_a_rembrandt_painting_is_saved_and_listed_with_its_format(self):
        svg = ('<svg xmlns="http://www.w3.org/2000/svg"><metadata id="rembrandt-state">'
               '{"rembrandt": "0.1", "format": "c50x70", "segs": []}</metadata></svg>')
        library_save(self.dir, svg, self.PNG, now=self.T)
        lst = library_list(self.dir)
        self.assertEqual((lst[0]["format"], lst[0]["strokes"], lst[0]["png"]), ("c50x70", None, True))

    def test_a_test_from_the_test_tab_goes_on_the_second_shelf(self):
        svg = ('<svg xmlns="http://www.w3.org/2000/svg"><metadata id="rembrandt-test">'
               '{"rembrandt": "0.1", "label": "C · 400 × 600 mm", "settings": {}}</metadata></svg>')
        library_save(self.dir, svg, self.PNG, now=self.T)
        lst = library_list(self.dir)
        self.assertEqual((lst[0]["kind"], lst[0]["label"], lst[0]["format"]), ("test", "C · 400 × 600 mm", None))

    def test_delete_moves_the_drawing_aside(self):
        base = library_save(self.dir, self.SVG, self.PNG, now=self.T)
        self.assertTrue(library_delete(self.dir, base))
        self.assertEqual(library_list(self.dir), [])
        kept = os.listdir(os.path.join(self.dir, ".deleted"))
        self.assertEqual(sorted(os.path.splitext(k)[1] for k in kept), [".png", ".svg"])
        self.assertFalse(library_delete(self.dir, base))                   # gone already
        self.assertFalse(library_delete(self.dir, "../../calibration"))     # only library names


class PercentTest(unittest.TestCase):
    """The percent by painted length, and along the piece in hand (2026-09-30:
    by counting pieces it stood still on a 602 mm line and then jumped)."""

    # a long pass, a step across (a turn, not painted), a long pass back, a half circle
    PATH = ["L 100.00 400.00", "L 105.00 400.00", "L 105.00 0.00", "A 105.00 -10.00 105.00 -20.00 1"]
    START = (100.0, 0.0)

    def test_pieces_and_how_far_along(self):
        geo = path_pieces(self.START, self.PATH)
        self.assertEqual([round(g["len"], 3) for g in geo], [400.0, 5.0, 400.0, round(math.pi * 10, 3)])
        self.assertAlmostEqual(along_piece(geo[0], (100.0, 100.0)), 100.0)
        self.assertAlmostEqual(along_piece(geo[0], (99.0, -3.0)), 0.0)          # before the start: 0
        self.assertAlmostEqual(along_piece(geo[2], (105.0, 300.0)), 100.0)      # going back down
        q = (95.0, -10.0)                                                        # a quarter round the arc (+X to +Y from the top)
        self.assertAlmostEqual(along_piece(geo[3], q), math.pi * 10 / 2, places=6)

    def test_the_turn_paints_nothing_and_the_piece_in_hand_counts(self):
        geo = path_pieces(self.START, self.PATH)
        plen = [g["len"] if m else 0.0 for g, m in zip(geo, [1, 0, 1, 1])]
        track = (geo, plen, sum(plen))
        self.assertAlmostEqual(painted_so_far(track, 0, (100.0, 200.0)), 200.0)   # halfway up the first
        self.assertAlmostEqual(painted_so_far(track, 1, (102.0, 400.0)), 400.0)   # on the step: nothing more
        self.assertAlmostEqual(painted_so_far(track, 2, (105.0, 100.0)), 700.0)   # 400 + 300 down the second
        self.assertAlmostEqual(painted_so_far(track, 4, None), sum(plen))

    def test_the_runner_percent_moves_along_a_long_piece(self):
        b = FakeBoard()
        r = Runner(b.send, sleep=b.sleep)
        geo = path_pieces(self.START, self.PATH)
        plen = [g["len"] if m else 0.0 for g, m in zip(geo, [1, 0, 1, 1])]
        track = (geo, plen, sum(plen))
        for y, want in ((100.0, 100.0), (300.0, 300.0)):
            r.pos = {"x": round(100.0 * STEPS_PER_MM[0]), "y": round(y * STEPS_PER_MM[1]), "path": 4}   # nothing run whole yet
            r._progress(0.0, 1000.0, 4, track)
            self.assertAlmostEqual(r.painted, 1000.0 * want / track[2], delta=0.1)


if __name__ == "__main__":
    unittest.main()
