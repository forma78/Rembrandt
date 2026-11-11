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
        if getattr(self, "elbow_cap", None) is not None:  # something under the elbow: its raw no further
            self.raw[2] = min(self.raw[2], self.elbow_cap)


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

    def test_a_pass_marked_pause_at_end_runs_to_its_end_then_the_pause(self):
        # ALU's DRAG (the owner, 2026-10-10: "the pause works only at the ends of
        # a line"): no braking on the line; held, the brush off, before the next
        whole = lambda n: {**paint(n), "pauseAtEnd": True}
        r, b = self.paused_run([arm(False), whole(12), whole(5)], when=4)
        self.assertEqual(r.state, "done", r.message)
        self.assertNotIn("S", b.log, "not braked on the line")
        i = b.log.index(OFF, b.log.index("L 12.00 50.00"))
        self.assertEqual(b.log[i:i + 3], [OFF, ON, "F 20"], "the line done, then off the canvas, back, and on")
        self.assertEqual([c for c in b.log if c.startswith("L")], [f"L {k}.00 50.00" for k in range(1, 13)] + [f"L {k}.00 50.00" for k in range(1, 6)])
        self.assertEqual(r.status()["percent"], 100.0)

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

    def test_the_pencils_pause_brakes_on_the_line_and_leaves_the_pencil_on_the_paper(self):
        # DACHE (the owner, 2026-10-27): Pause to sharpen a pencil, the tip left on the paper
        b = FakeBoard(rate=1)
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        ticks = {"n": 0, "done": False}
        def later():
            ticks["n"] += 1
            if ticks["n"] == 4:
                self.assertTrue(r.pause(pencil=True))
            if r.state == "paused" and not ticks["done"]:
                ticks["done"] = True
                r.resume()
        b.on_sleep = later
        r.start([arm(False), paint(12), arm(True)])
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        i = b.log.index("S")
        self.assertEqual(b.log.count(OFF), 1, "lifted only at the end")
        self.assertEqual(b.log.count(ON), 1, "never put down again")
        after = [c for c in b.log[i:] if c.startswith("L")]
        self.assertEqual(after[-1], "L 12.00 50.00")                    # the pass is finished from where it braked
        self.assertEqual(r.status()["percent"], 100.0)

    def test_a_p_pause_block_waits_with_the_pencil_down_and_a_pause_after_it_lifts_again(self):
        # DACHE: at a colour's end the pencil stays on the paper to be changed;
        # the brush's pause later in the run lifts as ever
        b, got = FakeBoard(rate=1), []
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2, log=got.append)
        def later():
            if r.state == "paused":
                r.resume()
        b.on_sleep = later
        why = "Pencil 2 · Orange: in the holder, its tip on the paper, then Continue"
        r.start([arm(False), paint(3), {"kind": "p-pause", "why": why}, arm(True), travel(30, 20), arm(False), paint(3),
                 {"kind": "pause", "why": "the brush's"}, paint(3), arm(True)])
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        seg = b.log[b.log.index("L 3.00 50.00"):b.log.index("M 30 20")]
        self.assertEqual(seg.count(OFF), 1, "only the next colour's own lift: the p-pause lifted nothing")
        self.assertNotIn(ON, seg, "and put nothing back")
        self.assertEqual([e["event"] for e in got], ["start", "pause", "continue", "pause", "continue", "done"])
        self.assertEqual((got[1]["why"], got[1].get("pencil")), (why, True))
        self.assertNotIn("pencil", got[3])
        second = [j for j, c in enumerate(b.log) if c == "L 3.00 50.00"][1]
        self.assertEqual(b.log[second + 1:second + 4], ["G", OFF, ON], "the brush's pause: off the canvas, and back")

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


class DipTest(unittest.TestCase):
    """OPM-N's DIP from the iPhone (OPM-N.md: "the brush lifts at once, flies to
    the cup, dips, flies back to the same point, lands and goes on")."""

    CUP = {"x": 300.0, "y": 20.0, "rim": 27, "dip": -4, "dwell": 1}

    def dipped_run(self, blocks, when, note=None, then=None):
        b, got = FakeBoard(rate=1), []
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2, log=got.append)
        ticks = {"n": 0, "done": False}

        def later():
            ticks["n"] += 1
            if ticks["n"] == when:
                ticks["asked"] = r.dip()
            if then and r.state == "paused" and not ticks["done"]:
                ticks["done"] = True
                then(r, b)
        b.on_sleep = later
        r.start(blocks, {"page": "opmn", "cup": self.CUP, "travel": 150, **(note or {})})
        r.thread.join(10)
        return r, b, got, ticks

    def test_a_pass_brakes_dips_comes_back_to_the_same_point_and_goes_on(self):
        r, b, got, t = self.dipped_run([arm(False), paint(12)], when=4)
        self.assertTrue(t["asked"])
        self.assertEqual(r.state, "done", r.message)
        i = b.log.index("S")
        self.assertEqual(b.log[i + 1:i + 3], [OFF, "J 2 27"], "off the canvas, over the rim")
        j = b.log.index("M 300.00 20.00")
        self.assertEqual([c for c in b.log[j:] if c.startswith("J 2")][:3], ["J 2 -4", "J 2 27", ON], "in the paint, over the rim, down on the canvas")
        back = next(c for c in b.log[j + 1:] if c.startswith("M "))
        self.assertLess(b.log.index(back), b.log.index(ON, j))
        after = [c for c in b.log[j:] if c.startswith("L")]
        self.assertEqual(after[-1], "L 12.00 50.00", "the pass finished after it")
        self.assertNotIn("K", b.log)
        self.assertEqual(r.status()["dips"], 1)
        self.assertEqual(r.status()["percent"], 100.0)
        ev = [e for e in got if e.get("event") == "dip"]
        self.assertEqual(len(ev), 1)
        self.assertEqual(ev[0]["by"], "hand")
        self.assertFalse([e for e in got if e.get("event") == "pause"], "a dip is no pause in the journal")

    def test_paused_it_dips_and_stays_paused_till_continue(self):
        # the hook runs in the runner's own sleep: it asks, and Continues a tick after the dip
        b = FakeBoard(rate=1)
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        seen = {}

        def later():
            if r.state == "paused" and "dip" not in seen:
                seen["dip"] = r.dip()
            elif "dip" in seen and r.dips == 1 and "state" not in seen:
                seen["state"] = r.state
                r.resume()
        b.on_sleep = later
        r.start([arm(False), paint(3), {"kind": "pause", "why": "the next colour"}, arm(False), paint(3)],
                {"page": "opmn", "cup": self.CUP})
        r.thread.join(10)
        self.assertTrue(seen["dip"])
        self.assertEqual(r.state, "done", r.message)
        self.assertIn("M 300.00 20.00", b.log)
        self.assertEqual(seen["state"], "paused", "still paused after the dip")

    def test_no_cup_no_dip(self):
        b = FakeBoard(rate=1)
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        self.assertFalse(r.dip(), "nothing running")
        for bad in (None, {}, {"x": 1, "y": 2, "rim": 27}, {**self.CUP, "dip": 30}, {**self.CUP, "rim": 90}, {**self.CUP, "x": float("nan")}):
            self.assertIsNone(rubens.cup_of(bad), bad)
        self.assertEqual(rubens.cup_of(self.CUP)["dip"], -4)

    def test_the_colour_and_the_cell_now_and_the_next_colour_at_a_pause(self):
        rows = {"colours": [{"name": "Deep blue", "hex": "#123456"}, {"name": "Cream", "hex": "#FFF0D0"}],
                "rows": [{"c": 0, "cells": [[1, 0], [2, 4.0], [3, 9.0]]}, {"c": 1, "cells": [[1, 0]]}]}
        b = FakeBoard(rate=1)
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2)
        r.start([{**paint(12, mm=12.0), "row": 1}, {"kind": "pause", "why": "Cream"}, {**paint(3, mm=3.0), "row": 2}], {"remote": rows, "cup": self.CUP})
        r.thread.join(0.01)
        r.stop(hard=True)
        r.thread.join(10)
        with r.lock:
            r.row, r.row_base, r.painted, r.block, r.state = 1, {1: 0.0}, 5.0, 0, "running"
        w = r.where()
        self.assertEqual((w["colour"]["name"], w["colour_n"], w["colours"], w["cell"]), ("Deep blue", 1, 2, 2))
        with r.lock:
            r.painted, r.block, r.state = 12.0, 1, "paused"
        w = r.where()
        self.assertEqual((w["cell"], w["next"]["name"]), (3, "Cream"))


class HandDipTest(unittest.TestCase):
    """INK-Y (the owner, 2026-11-03; README, How to dip): the cup at hand, on
    the carriage by the arm — the elbow up into its fork, only then the
    shoulder over the jar, the elbow in, up first, the shoulder back to 0; the
    carriage standing. Turned back the same way by itself before a jump and at
    the next run's start. "If the shoulder turns instead of the elbow lifting,
    we can break the brush or knock the jar over." """

    CUP = {"hand": True, "up": [30, 35], "to": [30, 35], "dip": 15, "dwell": 1, "swing": 40}
    GUARD = {"up": (30.0, 35.0), "floor": 14}

    def runner(self, b, log=None, guard=True):
        # the runner with an arm, its turns and flights written down as they end, and the elbow's angle at every turn of the shoulder sent
        arm = Arm(b.send, zero=lambda: ArmStrokeRunTest.ZERO, sleep=b.sleep, guard=(lambda: self.GUARD) if guard else (lambda: None))
        r = Runner(b.send, sleep=b.sleep, swing_s=0, arm=arm, log=log)
        seen, arm_, joint_, move_ = [], r._arm, r._joint, r._move
        self.elbow_at_turns, send = [], b.send

        def told(path):
            if path.startswith("/servo?j=shoulder"):
                self.elbow_at_turns.append(arm.angles()[0]["elbow"])
            return send(path)
        b.send = told
        arm.send = r.send = told

        def a(cmd, fork=None):
            out = arm_(cmd, fork)
            seen.append(cmd)
            return out

        def j(blk):
            out = joint_(blk)
            seen.append(f"{blk['joint']} {float(blk['deg']):g}")
            return out

        def m(blk):
            out, end = move_(blk), block_end(blk["cmds"])
            if end and not blk.get("paintMM"):
                seen.append(f"M {end[0]:.2f} {end[1]:.2f}")
            return out
        r._arm, r._joint, r._move = a, j, m
        return r, arm, seen

    def plan(self):
        # as plotRun lays a dip at hand (strokes.js, handDip): the arm straight first, the flight to the row, the dip there
        up = lambda **k: {"kind": "arm", "cmd": "J 2 32.5", "fork": [30, 35], **k}
        dip = lambda **k: {**k, "dip": True, "row": 1}
        return [up(row=0), {"kind": "joint", "joint": "shoulder", "deg": 0, "speed": 40, "within": 1.5, "row": 0}, {"kind": "arm", "cmd": "J 3 0", "row": 0},
                {"kind": "move", "cmds": ["T 180", "M 99.00 50.00", "G"], "paintMM": 0, "row": 1},
                dip(**up()), dip(kind="joint", joint="shoulder", deg=32.5, speed=40, fork=[30, 35], rim=32.5, up=[30, 35]),
                dip(kind="arm", cmd="J 2 15", fork=[14, 16]), dip(kind="wait", s=1), dip(**up()),
                dip(kind="joint", joint="shoulder", deg=0, speed=40, within=1.5), {"kind": "arm", "cmd": ON, "row": 1},
                {**paint(6), "row": 1}, {"kind": "arm", "cmd": OFF, "row": 1}]

    def test_the_cup_at_hand_from_a_note(self):
        c = rubens.cup_of(self.CUP)
        self.assertEqual(c, {"hand": True, "up": (30.0, 35.0), "to": (30.0, 35.0), "dip": 15.0, "paint": (14.0, 16.0), "dwell": 1.0, "swing": 40.0, "rim": 32.5})
        self.assertEqual(rubens.cup_of({**self.CUP, "dip": 14})["paint"], (14.0, 15.0), "never below +14")
        for bad in ({**self.CUP, "up": [30, 30.5]}, {**self.CUP, "up": [10, 15]}, {**self.CUP, "to": [-1, 3]}, {**self.CUP, "to": [30, 60]},
                    {**self.CUP, "dip": 13}, {**self.CUP, "dip": 17}, {**self.CUP, "swing": 500}, {k: v for k, v in self.CUP.items() if k != "to"}):
            self.assertIsNone(rubens.cup_of(bad), bad)
        self.assertGreaterEqual(Runner(FakeBoard().send).status()["hand"], 1, "the pages ask before a run at hand")

    def test_the_plans_dip_lifts_the_elbow_before_every_turn_of_the_shoulder(self):
        b = FakeBoard(rate=1)
        r, arm, seen = self.runner(b)
        self.assertTrue(r.start(self.plan(), {"page": "opmn", "cup": self.CUP})[0])
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.assertEqual([c for c in seen if not c.startswith("M")][:8], ["J 2 32.5", "shoulder 0", "J 3 0", "J 2 32.5", "shoulder 32.5", "J 2 15", "J 2 32.5", "shoulder 0"])
        self.assertTrue(self.elbow_at_turns and all(30 <= e <= 35 for e in self.elbow_at_turns), f"the elbow up at every turn: {self.elbow_at_turns}")
        flights = [c for c in seen if c.startswith("M")]
        self.assertEqual(flights, ["M 99.00 50.00"], "the carriage stands while the arm dips")
        self.assertLess(abs(arm.angles()[0]["shoulder"]), 1.5)
        self.assertIsNone(r._swung)

    def test_a_shoulder_that_stops_short_and_will_not_be_nudged_still_lands_in_its_fork(self):
        # the shoulder ~1° short on every big turn and no nudge at all, as on the machine (2026-11-03, the beam's runs)
        class Sticky(FakeBoard):
            def turn(self, jid, d):
                before = self.raw[1]
                FakeBoard.turn(self, jid, d)
                if jid == 1:
                    moved = self.raw[1] - before
                    self.raw[1] = before if abs(moved) <= 12 else self.raw[1] - (11 if moved > 0 else -11)
        b = Sticky(rate=1)
        r, arm, seen = self.runner(b)
        r.start(self.plan(), {"page": "opmn", "cup": self.CUP})
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.assertLess(abs(arm.angles()[0]["shoulder"]), 1.5)

    def test_the_guard_refuses_the_shoulder_with_the_elbow_down_and_the_elbow_into_the_jar_past_its_floor(self):
        b = FakeBoard(rate=1)
        arm = Arm(b.send, zero=lambda: ArmStrokeRunTest.ZERO, sleep=b.sleep, guard=lambda: self.GUARD)
        arm.move_to("elbow", 2.5)
        with self.assertRaisesRegex(ArmError, "only with the elbow up"):
            arm.move_to("shoulder", 32.5)
        self.assertLess(abs(arm.angles()[0]["shoulder"]), 0.6, "nothing turned")
        with self.assertRaisesRegex(ArmError, "only with the elbow up"):
            arm.move_to("shoulder", -10)
        arm.move_to("elbow", 45)
        with self.assertRaisesRegex(ArmError, "only with the elbow up"):
            arm.move_to("shoulder", 32.5)
        arm.move_to("elbow", 32.5, fork=(30, 35))
        arm.move_to("shoulder", 32.5, fork=(30, 35))
        with self.assertRaisesRegex(ArmError, "no lower than"):
            arm.move_to("elbow", 5)
        with self.assertRaisesRegex(ArmError, "the wrist turns only"):
            arm.move_to("wrist", 10)
        got = arm.move_to("elbow", 15, fork=(14, 16))
        self.assertTrue(14 <= got <= 16 or 14 <= arm.angles()[0]["elbow"] <= 16)
        arm.move_to("elbow", 32.5, fork=(30, 35))
        arm.move_to("shoulder", 0, within=1.5)
        arm.move_to("elbow", 0)
        free = Arm(b.send, zero=lambda: ArmStrokeRunTest.ZERO, sleep=b.sleep)
        free.move_to("shoulder", 5)
        self.assertGreater(free.angles()[0]["shoulder"], 4, "the cup at hand off: as before")
        free.move_to("shoulder", 0)

    def test_the_guard_reads_inkjson_while_the_cup_at_hand_is_on(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "ink.json")
            with open(p, "w") as f:
                json.dump({"cup": {"x": 1, "y": 1}}, f)
            self.assertIsNone(rubens.hand_guard(p))
            for k, (h, want) in enumerate([({"on": True}, (30.0, 35.0)), ({"on": True, "up": [31, 34]}, (31.0, 34.0)),
                                           ({"on": True, "up": [31, 31.2]}, (30.0, 35.0)), ({"on": False, "up": [31, 34]}, None)]):
                with open(p, "w") as f:
                    json.dump({"hand": h}, f)
                os.utime(p, ns=(1, (k + 1) * 10 ** 18))        # read again when the file changes
                got = rubens.hand_guard(p)
                self.assertEqual(got and got["up"], want, h)
            self.assertIsNone(rubens.hand_guard(os.path.join(d, "none.json")))

    def test_a_run_stopped_over_the_jar_lifts_the_elbow_then_turns_the_shoulder_back_at_the_next_start(self):
        b = FakeBoard(rate=1)
        r, arm, seen = self.runner(b)
        b.on_sleep = lambda: r._swung and r.state == "running" and r.block == 7 and r.stop()   # in the paint
        r.start(self.plan(), {"page": "opmn", "cup": self.CUP})
        r.thread.join(10)
        self.assertIn(r.state, ("stopped", "error"))
        self.assertIsNotNone(r._swung, "stopped with the brush over the jar")
        self.assertGreater(arm.angles()[0]["shoulder"], 20)
        b.on_sleep, n = None, len(seen)
        r.start([{"kind": "arm", "cmd": OFF}, {**travel(5, 5), "home": True}], {"page": "opmn", "label": "OPM-N · HOME"})
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.assertEqual(seen[n:n + 2], ["J 2 32.5", "shoulder 0"], "the elbow up into its fork, then the shoulder back, before anything else")
        self.assertTrue(all(30 <= e <= 35 for e in self.elbow_at_turns), self.elbow_at_turns)
        self.assertLess(abs(arm.angles()[0]["shoulder"]), 1.5)

    def test_a_jump_from_the_jar_lifts_the_elbow_then_turns_the_shoulder_back(self):
        b = FakeBoard(rate=1)
        r, arm, seen = self.runner(b)
        arm.move_to("elbow", 32.5, fork=(30, 35))
        arm.move_to("shoulder", 32.5, 40, fork=(30, 35))
        arm.move_to("elbow", 15, fork=(14, 16))               # the brush in the paint
        r.blocks, r.state, r._swung, r._jump = self.plan(), "running", (32.5, 40.0, (30.0, 35.0)), (11, None, "back")
        self.assertEqual(r._do_jump(), 11)
        self.assertEqual(seen[:2], ["J 2 32.5", "shoulder 0"])
        self.assertLess(abs(arm.angles()[0]["shoulder"]), 1.5)
        self.assertIsNone(r._swung)

    def test_the_iphones_dip_at_hand_the_carriage_standing(self):
        b = FakeBoard(rate=1)
        r, arm, seen = self.runner(b)
        ticks = {}

        def later():
            if "asked" not in ticks and r.state == "running" and r.block == 1 and b.running and len(b.queue) < 9:
                ticks["asked"] = r.dip()
        b.on_sleep = later
        r.start([{"kind": "arm", "cmd": ON}, paint(12)], {"page": "opmn", "cup": self.CUP, "travel": 150})
        r.thread.join(10)
        self.assertTrue(ticks["asked"])
        self.assertEqual(r.state, "done", r.message)
        i = seen.index("shoulder 32.5")
        self.assertEqual(seen[i - 1:i + 5], ["J 2 32.5", "shoulder 32.5", "J 2 15", "J 2 32.5", "J 2 32.5", "shoulder 0"])
        self.assertFalse([c for c in seen if c.startswith("M")], "no flight: the jar is at hand")
        self.assertTrue(all(30 <= e <= 35 for e in self.elbow_at_turns), self.elbow_at_turns)
        self.assertLess(abs(arm.angles()[0]["shoulder"]), 1.5)
        self.assertEqual(r.status()["dips"], 1)


class GotoTest(unittest.TestCase):
    """⏮ Back, ⏭ Skip and Go to № (OPM-N.md: "of course there is no ⌘Z in the
    physical world: repeat DRAG in the current cell"): the brush up at once,
    through the air to the cell's first track, down as the plan has it, on."""

    ROWS = {"colours": [{"name": "Deep Blue", "hex": "#24408F", "cells": 2}, {"name": "Cream", "hex": "#F5E6C8", "cells": 1}],
            "rows": [{"c": 0, "cells": [[1, 0], [2, 3.0]]}, {"c": 1, "cells": [[1, 0]]}]}

    def blocks(self):
        # as plotRun lays OPM-N's: a row's flight, the brush over the canvas, its paint — cell 1, a turn through the air, cell 2 — up; the pause; the next colour
        row1 = {"kind": "move", "row": 1, "paintMM": 6.0, "painted": [1, 1, 1, 0, 0, 1, 1, 1],
                "cmds": ["F 25", "W 2 0 200", "L 11.00 50.00", "L 12.00 50.00", "L 13.00 50.00", "W 2 25 211", "L 13.50 50.00",
                         "W 2 10 211", "L 14.00 50.00", "W 2 0 200", "L 15.00 50.00", "L 16.00 50.00", "L 17.00 50.00", "G"]}
        row2 = {"kind": "move", "row": 2, "paintMM": 3.0, "painted": [1, 1, 1], "cmds": ["F 25", "W 2 0 200", "L 21.00 50.00", "L 22.00 50.00", "L 23.00 50.00", "G"]}
        return [{"kind": "move", "row": 1, "cmds": ["T 180", "M 10.00 50.00", "G"], "paintMM": 0}, {"kind": "arm", "cmd": "J 2 12", "row": 1}, row1,
                {"kind": "arm", "cmd": OFF, "row": 1}, {"kind": "pause", "why": "wipe the brush, put Cream in the cup, then Continue", "row": 0},
                {"kind": "move", "row": 2, "cmds": ["T 180", "M 20.00 50.00", "G"], "paintMM": 0}, {"kind": "arm", "cmd": "J 2 12", "row": 2}, row2,
                {"kind": "arm", "cmd": OFF, "row": 2}]

    def jumped(self, press, at_x):
        # press(r) once the carriage is at_x mm along row 1; Continue at the colours' pause
        b, got, seen = FakeBoard(rate=1), [], {}
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2, log=got.append)

        def later():
            if "asked" not in seen and r.state == "running" and r.block == 2 and b.x >= at_x * STEPS_PER_MM[0]:
                seen["where"] = r.where()
                seen["asked"] = press(r)
            if r.state == "paused" and (r.message or "").startswith("wipe") and "paused" not in seen:
                seen["paused"] = r.where()
                r.resume()
        b.on_sleep = later
        r.start(self.blocks(), {"page": "opmn", "remote": self.ROWS, "cup": DipTest.CUP})
        r.thread.join(10)
        return r, b, got, seen

    def test_back_paints_this_cell_again_from_its_first_track(self):
        r, b, got, seen = self.jumped(lambda r: r.back(), 14.5)
        self.assertEqual(seen["where"]["cell"], 2)
        self.assertEqual(seen["asked"], (True, "ok"))
        self.assertEqual(r.state, "done", r.message)
        i = b.log.index("S")
        self.assertEqual(b.log[i + 1], OFF, "the brush up at once")
        j = b.log.index("M 14.00 50.00", i)
        self.assertEqual(b.log[j + 2], "J 2 10", "over the canvas as the plan has it after the turn")
        self.assertEqual([c for c in b.log[j:] if c.startswith("L 1")], ["L 15.00 50.00", "L 16.00 50.00", "L 17.00 50.00"], "cell 2 from its first track, to its end")
        self.assertIn("W 2 0.0 200", b.log[j:], "down as the plan lands it")
        self.assertNotIn("L 11.00 50.00", b.log[j:], "cell 1 not again")
        self.assertEqual([c for c in b.log if c.startswith("L 2")], ["L 21.00 50.00", "L 22.00 50.00", "L 23.00 50.00"], "the next colour after it")
        self.assertEqual([e["event"] for e in got if e["event"] in ("back", "pause")], ["back", "pause"], "Back is no pause in the journal")
        self.assertEqual(r.status()["percent"], 100.0)

    def test_go_to_a_cell_that_starts_its_row_flies_there_as_the_row_does(self):
        r, b, got, seen = self.jumped(lambda r: r.goto(0, 1), 14.5)
        self.assertEqual(r.state, "done", r.message)
        i = b.log.index("S")
        self.assertEqual(b.log[i + 1], OFF)
        self.assertEqual(b.log.count("M 10.00 50.00"), 2, "the row's own flight again")
        self.assertEqual(b.log.count("L 11.00 50.00"), 2, "cell 1 painted again")
        self.assertNotIn("DIP:", "".join(e.get("why", "") for e in got), "no dip by itself")

    def test_skip_after_the_colours_last_cell_goes_on_to_its_pause(self):
        r, b, got, seen = self.jumped(lambda r: r.skip(), 14.5)
        self.assertEqual(seen["asked"], (True, "ok"))
        self.assertEqual(r.state, "done", r.message)
        i = b.log.index("S")
        self.assertNotIn("L 17.00 50.00", b.log[i:], "the rest of cell 2 skipped")
        self.assertEqual(seen["paused"]["next"]["name"], "Cream", "at the colours' pause, the next one named")
        self.assertIn("L 23.00 50.00", b.log)

    def test_no_such_cell_nothing_running_refused(self):
        r = Runner(FakeBoard().send)
        self.assertFalse(r.goto(0, 1)[0])
        r, b, got, seen = self.jumped(lambda r: r.goto(0, 9), 14.5)
        self.assertEqual(seen["asked"], (False, "no cell 9 in colour 1"))
        self.assertEqual(r.state, "done", r.message)
        self.assertNotIn("S", b.log)

    # BACK ONE CELL: as OPM-N's plan lays a colour's change — the next colour's flight, the brush up, the pause, then its paint
    ROWS3 = {"colours": [{"name": "Deep Blue", "hex": "#24408F", "cells": 2}, {"name": "Brown", "hex": "#6B3F2A", "cells": 1}, {"name": "Cream", "hex": "#F5E6C8", "cells": 1}],
             "rows": [{"c": 0, "cells": [[1, 0]]}, {"c": 0, "cells": [[2, 0]]}, {"c": 1, "cells": [[1, 0]]}, {"c": 2, "cells": [[1, 0]]}]}

    def blocks3(self):
        def row(r, x, why=None):
            paint = {"kind": "move", "row": r, "paintMM": 3.0, "painted": [1, 1, 1], "cmds": ["F 25", "W 2 0 200", f"L {x + 1}.00 50.00", f"L {x + 2}.00 50.00", f"L {x + 3}.00 50.00", "G"]}
            return [{"kind": "move", "row": r, "cmds": ["T 180", f"M {x}.00 50.00", "G"], "paintMM": 0}, {"kind": "arm", "cmd": "J 2 33" if why else "J 2 12", "row": r},
                    *([{"kind": "pause", "why": why, "row": 0}, {"kind": "arm", "cmd": "J 2 12", "row": r}] if why else []), paint, {"kind": "arm", "cmd": OFF, "row": r}]
        return [*row(1, 10), *row(2, 20), *row(3, 30, "wipe the brush, put Brown in the cup, then Continue"), *row(4, 40, "wipe the brush, put Cream in the cup, then Continue")]

    def backed(self, when, press):
        # press(r) once, when(r, b) true; every plan pause Continued but the one pressed at
        b, got, seen = FakeBoard(rate=1), [], {"said": []}
        r = Runner(b.send, sleep=b.sleep, swing_s=0.2, log=got.append)

        def later():
            if "asked" not in seen and when(r, b):
                seen["where"] = r.where()
                seen["asked"] = press(r)
                return
            if r.state == "paused" and (r.message or "").startswith("wipe") and r._jump is None:
                seen["said"].append(r.message)
                seen.setdefault("pct", []).append(r.status()["percent"])
                r.resume()
        b.on_sleep = later
        r.start(self.blocks3(), {"page": "opmn", "remote": self.ROWS3, "cup": DipTest.CUP})
        r.thread.join(10)
        return r, b, got, seen

    def test_back_one_while_the_brush_paints_this_cell_again(self):
        r, b, got, seen = self.backed(lambda r, b: r.state == "running" and r.block == 6 and b.x >= 22.5 * STEPS_PER_MM[0], lambda r: r.back_one())
        self.assertEqual(seen["asked"], (True, "cell 2 of Deep Blue", None))
        self.assertEqual(r.state, "done", r.message)
        self.assertEqual(b.log.count("L 21.00 50.00"), 2, "cell 2 again from its first track")
        self.assertEqual(b.log.count("L 11.00 50.00"), 1, "cell 1 not")

    def test_back_one_in_the_air_the_cell_before(self):
        r, b, got, seen = self.backed(lambda r, b: r.state == "running" and r.block == 5, lambda r: r.back_one())
        self.assertEqual(seen["where"]["cell"], 2)
        self.assertEqual(seen["asked"], (True, "cell 1 of Deep Blue", None))
        self.assertEqual(r.state, "done", r.message)
        self.assertEqual(b.log.count("L 11.00 50.00"), 2, "cell 1 again")
        self.assertEqual(b.log.count("L 21.00 50.00"), 1, "cell 2 once, after it")

    def test_back_one_at_a_colours_pause_goes_to_the_last_colour_by_its_own_pause(self):
        # the owner's case of 2026-11-05: Brown done, the pause for Cream, the row Cream's already
        at = lambda r, b: r.state == "paused" and "Cream" in (r.message or "")
        r, b, got, seen = self.backed(at, lambda r: r.back_one())
        self.assertEqual(seen["where"]["colour"]["name"], "Cream", "at this pause the row is the next colour's")
        self.assertEqual(seen["asked"], (True, "cell 1 of Brown", None), "Brown's own pause on the way: no question")
        self.assertEqual(seen["where"]["percent"], 75.0)
        self.assertEqual(seen["pct"], [50.0, 50.0, 75.0], "the % goes back with the jump, to Brown's start, then on")
        self.assertEqual(r.state, "done", r.message)
        self.assertEqual(seen["said"], ["wipe the brush, put Brown in the cup, then Continue", "wipe the brush, put Brown in the cup, then Continue", "wipe the brush, put Cream in the cup, then Continue"], "Brown named again, then Cream")
        self.assertEqual(b.log.count("L 31.00 50.00"), 2, "Brown painted again")
        self.assertEqual(b.log.count("L 41.00 50.00"), 1, "Cream after it, once")
        self.assertEqual(b.log.count("L 21.00 50.00"), 1, "the blue not again")
        self.assertEqual(r.status()["percent"], 100.0)

    def test_back_one_into_a_colour_past_its_first_cell_asks_for_the_paint(self):
        at = lambda r, b: r.state == "paused" and "Brown" in (r.message or "")
        r, b, got, seen = self.backed(at, lambda r: (r.back_one(), r.back_one(sure=True)))
        self.assertEqual(seen["asked"][0], (False, "cell 2 of Deep Blue: is it in the cup?", {"colour": "Deep Blue", "cell": 2}))
        self.assertEqual(seen["asked"][1], (True, "cell 2 of Deep Blue", None))
        self.assertEqual(r.state, "done", r.message)
        self.assertEqual(b.log.count("L 21.00 50.00"), 2, "the blue's last cell again")
        self.assertEqual(b.log.count("L 11.00 50.00"), 1, "its first not")
        self.assertEqual(b.log.count("L 31.00 50.00"), 1)

    def test_back_one_nothing_running_refused(self):
        self.assertEqual(Runner(FakeBoard().send).back_one(), (False, "no cell now", None))

    def test_from_piece_keeps_the_landing_of_its_piece(self):
        c = ["F 25", "W 2 0 200", "L 1 0", "W 2 25 211", "L 2 0", "W 2 10 211", "L 3 0", "W 2 0 200", "L 4 0", "G"]
        self.assertEqual(rubens.from_piece(c, 3), ["F 25", "W 2 0 200", "L 4 0", "G"])
        self.assertEqual(rest_of(c, 3), ["F 25", "L 4 0", "G"], "Continue's own: the W turned already")


class LateReplyTest(unittest.TestCase):
    """The evening of 2026-11-04, a six-hour run stopped twice on one reply: "the shoulder does
    not answer" at 1.7 %, "shoulder: ok Z 3" at 48 %. The arm was fine both times."""

    class Port:
        def __init__(self, answers):
            self.answers, self.lines = answers, []
        def setRTS(self, v): pass
        def setDTR(self, v): pass
        def close(self): pass
        def write(self, b):
            self.lines += [x.encode() + b"\n" for x in self.answers.pop(0)]
        def readline(self):
            if self.lines:
                return self.lines.pop(0)
            time.sleep(0.002)
            return b""

    def board(self, *answers):
        b = Board(open_port=lambda p: self.Port(list(answers)), ports=lambda: ["x"], log=lambda s: None)
        b.start()
        return b

    def test_a_late_line_is_not_taken_for_this_command_s_reply(self):
        b = self.board(["ok J 1 -32", "ok V | 1: поза 2500"])
        self.assertEqual(b.send("V", 1.0), "ok V | 1: поза 2500")

    def test_a_late_line_alone_is_no_answer(self):
        b = self.board(["ok Z 3"])
        self.assertEqual(b.send("J 1 -32 40", 0.05), rubens.NO_REPLY)

    def test_the_board_s_refusal_is_its_answer(self):
        b = self.board(["? идёт путь, сначала S"], ["нет серво 2"])
        self.assertEqual(b.send("J 1 5", 1.0), "? идёт путь, сначала S")
        self.assertEqual(b.send("J 2 5", 1.0), "нет серво 2")

    def test_the_path_s_lines_as_before(self):
        b = self.board(["ok L 7"], [])
        self.assertEqual(b.send("L 1 2", 1.0), "ok L 7")
        self.assertEqual(b.send("L 1 3", 0.02), "ok L 7", "no new line: the last one, as ever")

    def arm(self, b, script=None, notes=None, **kw):
        # script: path prefix → the replies to give before the fake board's own
        script = script or {}
        def send(path):
            for k, v in script.items():
                if path.startswith(k) and v:
                    return v.pop(0)
            return b.send(path)
        return Arm(send, zero=lambda: ArmStrokeRunTest.ZERO, sleep=b.sleep, note=(notes.append if notes is not None else lambda w: None), **kw)

    def test_one_silent_read_is_read_again_and_noted(self):
        notes = []
        a = self.arm(FakeBoard(), {"/look": ["ok V | 1: молчит | 2: поза 1759, 11,3 В, 30 °C"]}, notes)
        a.move_to("shoulder", 0)
        self.assertTrue(any("silent" in n for n in notes), notes)

    def test_a_stale_line_for_a_look_is_read_again(self):
        self.arm(FakeBoard(), {"/look": [rubens.NO_REPLY, "ok Z 3"]}).move_to("shoulder", 0)

    def test_silent_for_a_second_it_is_waited_for(self):
        # the owner, 2026-11-11: the arm silent about 80 s at a lift, then answering by itself — waited for, not an error
        notes = []
        a = self.arm(FakeBoard(), {"/look": ["ok V | 1: молчит"] * (rubens.BUS_TRIES * 3)}, notes)
        a.move_to("shoulder", 0)
        self.assertTrue(any("waiting" in n for n in notes), notes)

    def test_silent_past_the_wait_it_does_not_answer(self):
        a = self.arm(FakeBoard(), {"/look": ["ok V | 1: молчит"] * 2000})
        with self.assertRaisesRegex(ArmError, "shoulder does not answer"):
            a.move_to("shoulder", 0)
        self.assertGreaterEqual(a.slept, rubens.SILENT_WAIT)

    def test_the_wait_is_by_the_clock_not_by_the_sleeps(self):
        # the night of 2026-11-11: a read of a silent bus slower than its gaps, "50 s of 90" at 86 s; here every read 10 s by the clock
        t, notes = [0.0], []
        def clock():
            t[0] += 10.0
            return t[0]
        a = self.arm(FakeBoard(), {"/look": ["ok V | 1: молчит"] * 2000}, notes, clock=clock)
        with self.assertRaisesRegex(ArmError, "shoulder does not answer"):
            a.move_to("shoulder", 0)
        self.assertLess(a.slept, 20, "gave up by the clock, not after 90 s of sleeps")
        waits = [n for n in notes if "waiting" in n]
        self.assertTrue(waits and len(waits) <= 10, waits)

    def test_the_elbow_lifts_in_the_air_slower_and_goes_down_as_before(self):
        b = FakeBoard()
        a = self.arm(b)
        a.move_to("elbow", 20)
        up = [c for c in b.log if c.startswith("J 2")]
        self.assertTrue(up and all(c.split()[-1].lstrip("v") == f"{rubens.ELBOW_UP_SPEED:g}" for c in up), up)
        b.log.clear()
        a.move_to("elbow", 5)
        down = [c for c in b.log if c.startswith("J 2")]
        self.assertTrue(down and not any(t.startswith("v") for c in down for t in c.split()), down)

    def test_a_late_reply_to_J_does_not_stop_it(self):
        b, notes = FakeBoard(), []
        a = self.arm(b, {"/servo": [rubens.NO_REPLY]}, notes)
        a.move_to("elbow", 10, within=1.5)
        self.assertTrue(any("no answer to J" in n for n in notes), notes)
        self.assertTrue(any(c.startswith("J 2") for c in b.log), "the step sent again, the joint not there")

    def test_the_board_s_refusal_of_J_still_stops_it(self):
        with self.assertRaisesRegex(ArmError, "elbow:"):
            self.arm(FakeBoard(), {"/servo": ["нет серво 2"]}).move_to("elbow", 10)

    def test_no_step_from_a_zero_not_taken_of_all_three(self):
        b = FakeBoard()
        a = self.arm(b, {"/zero": ["ok Z 2"]})
        a.rezero()
        self.assertEqual(b.log.count("Z"), 1, "asked again: the fake's own, all three")
        with self.assertRaisesRegex(ArmError, "arm zero"):
            self.arm(FakeBoard(), {"/zero": ["ok Z 2"] * rubens.BUS_TRIES}).rezero()

    def test_a_ping_lost_is_asked_again(self):
        b, n = FakeBoard(), [rubens.NO_REPLY]
        r = Runner(lambda p: n.pop() if p == "/ping" and n else b.send(p))
        self.assertIsNotNone(r._ping())


class RemoteGateTest(unittest.TestCase):
    """The iPhone on the Wi-Fi (OPM-N, the owner, 2026-11-02: "yes, with the
    key"): from another address only /remote and its calls, those with the key."""

    def ask(self, method, path, addr, headers=None):
        h = object.__new__(rubens.Handler)
        h.path, h.client_address, h.headers, got = path, (addr, 50000), headers or {}, {}
        h.reply = lambda code, body, ctype="text/plain", board=None: got.update(code=code, body=body)
        h.rfile = None
        getattr(h, method)()
        return got

    def setUp(self):
        self.was = rubens.REMOTE_KEY, rubens.RUNNER, rubens._LAN.copy()
        rubens.REMOTE_KEY = "k3y-of-the-test"
        rubens.RUNNER = Runner(FakeBoard().send)
        rubens._LAN.update(ip="192.168.0.227", at=time.time())

    def tearDown(self):
        rubens.REMOTE_KEY, rubens.RUNNER = self.was[0], self.was[1]
        rubens._LAN.update(self.was[2])

    def test_another_address_gets_the_remote_alone_and_its_calls_with_the_key(self):
        phone = "192.168.0.31"
        self.assertEqual(self.ask("do_GET", "/run", phone)["code"], 403)
        self.assertEqual(self.ask("do_GET", "/calibration", phone)["code"], 403)
        self.assertEqual(self.ask("do_GET", "/remote.key", phone)["code"], 403)
        self.assertEqual(self.ask("do_POST", "/run/stop", phone)["code"], 403)
        self.assertEqual(self.ask("do_PUT", "/calibration", phone)["code"], 403)
        self.assertEqual(self.ask("do_DELETE", "/library/x", phone)["code"], 403)
        self.assertEqual(self.ask("do_GET", "/remote/state", phone)["code"], 403)
        self.assertEqual(self.ask("do_GET", "/remote/state?k=wrong", phone)["code"], 403)
        self.assertEqual(self.ask("do_POST", "/remote/dip", phone)["code"], 403)
        self.assertEqual(self.ask("do_GET", "/remote/link", phone)["code"], 403, "the key's link for this Mac only")
        got = self.ask("do_GET", "/remote/state?k=k3y-of-the-test", phone)
        self.assertEqual((got["code"], json.loads(got["body"])["state"]), (200, "idle"))
        self.assertEqual(self.ask("do_GET", "/remote/state", phone, {"X-Key": "k3y-of-the-test"})["code"], 200)
        self.assertEqual(self.ask("do_POST", "/remote/dip?k=k3y-of-the-test", phone)["code"], 409, "nothing running: no dip")
        self.assertEqual(self.ask("do_GET", "/remote", phone)["code"], 200, "the page itself for anyone on the Wi-Fi")
        for path in ("/remote/back", "/remote/skip", "/remote/goto?n=3"):
            self.assertEqual(self.ask("do_POST", path, phone)["code"], 403, path)
            self.assertEqual(self.ask("do_POST", path + ("&" if "?" in path else "?") + "k=k3y-of-the-test", phone)["code"], 409, f"{path}: nothing running")

    def test_the_mini_screen_behind_the_key_and_from_the_blocks_it_runs(self):
        phone, key = "192.168.0.31", "k=k3y-of-the-test"
        self.assertEqual(self.ask("do_GET", "/remote/plan", phone)["code"], 403)
        self.assertEqual(json.loads(self.ask("do_GET", f"/remote/plan?{key}", phone)["body"])["ok"], False, "no run")
        rows = {"colours": [{"name": "Cream", "hex": "#F5E6C8", "cells": 1}, {"name": "Blue", "hex": "#24408F", "cells": 1}],
                "rows": [{"c": 0, "cells": [[1, 0]]}, {"c": 1, "cells": [[1, 0]]}]}
        blocks = [{"kind": "arm", "cmd": "J 2 25", "row": 0},
                  {"kind": "move", "cmds": ["T 180", "M 10 10", "G"], "paintMM": 0, "row": 1},
                  # a row: two pieces of one stretch, a turn through the air, a second stretch
                  {"kind": "move", "cmds": ["F 25", "L 10 20", "L 10 40", "M 20 40", "L 20 10", "G"], "paintMM": 60, "painted": [1, 1, 0, 1], "row": 1},
                  {"kind": "move", "cmds": ["T 180", "M 50 50", "G"], "paintMM": 0, "row": 2},
                  {"kind": "move", "cmds": ["F 25", "A 50 60 60 60 1", "G"], "paintMM": 15.7, "row": 2}]
        rubens.RUNNER.start = None   # never run: the blocks alone
        r = rubens.RUNNER
        r.blocks, r.rows, r.started = blocks, rows, 123.0
        r.note = {"label": "OPM-N · 1 blend · 600 × 400 mm · brush 6 mm", "here": {"x": 300, "y": 200}, "estimate_s": 77}
        pic = json.loads(self.ask("do_GET", f"/remote/plan?{key}", phone)["body"])
        self.assertEqual((pic["ok"], pic["started"], pic["blocks"], pic["paint_mm"], pic["estimate_s"], pic["canvas"]), (True, 123.0, 5, 75.7, 77, [600.0, 400.0]))
        self.assertEqual(pic["rows"][0], {"c": 0, "mm": 60.0, "p": [[20, 20, 20, 80], [40, 80, 40, 20]]}, "half millimetres, the turn left out")
        arc = pic["rows"][1]["p"][0]
        self.assertEqual((arc[:2], arc[-2:]), ([100, 100], [120, 120]), "an arc from its start to its end")
        self.assertGreater(len(arc), 4, "with points between")
        self.assertEqual(json.loads(self.ask("do_GET", f"/remote/state?{key}", phone)["body"])["estimate_s"], 77)
        self.assertIs(r.picture(), r.picture(), "worked out once")

    def test_a_snake_turning_back_along_itself_keeps_its_turn(self):
        pic = rubens.plan_picture([{"kind": "move", "cmds": ["T 180", "M 0 0", "G"], "row": 1}, {"kind": "move", "cmds": ["F 25", "L 0 50", "L 0 10", "G"], "paintMM": 90, "row": 1}], {"rows": [{"c": 0}]}, None)
        self.assertEqual(pic["rows"][0]["p"], [[0, 0, 0, 100, 0, 20]], "out and back: all three points")
        self.assertIsNone(pic["canvas"])

    def test_this_mac_as_before_and_its_link_with_the_key(self):
        for me in ("127.0.0.1", "::1", "192.168.0.227"):
            self.assertEqual(self.ask("do_GET", "/run", me)["code"], 200, me)
        link = json.loads(self.ask("do_GET", "/remote/link", "127.0.0.1")["body"])
        if rubens.LISTEN != "127.0.0.1":
            self.assertEqual(link["url"], f"http://192.168.0.227:{rubens.PORT}/remote?k=k3y-of-the-test")

    def test_the_key_made_once_and_kept(self):
        with tempfile.TemporaryDirectory() as d:
            f = os.path.join(d, "remote.key")
            k = rubens.remote_key(f)
            self.assertGreaterEqual(len(k), 8)
            self.assertEqual(rubens.remote_key(f), k)
            self.assertEqual(os.stat(f).st_mode & 0o777, 0o600)


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

    def test_a_pause_on_a_snake_goes_on_from_its_own_lane_never_the_next_one(self):
        # A braked pass on a path back and forth (ALU's snake, 2026-10-10, as it
        # would be without pauseAtEnd): three lanes 3.7 mm apart in one block,
        # paused on the middle one, run back — it goes on from there
        lanes = [[f"L {k}.00 50.00" for k in range(1, 11)], [f"L {k}.00 53.70" for k in range(10, 0, -1)], [f"L {k}.00 57.40" for k in range(1, 11)]]
        path = lanes[0] + lanes[1] + lanes[2]
        cmds = ["F 20", "W 2 0 211"] + path[:-1] + ["W 2 10 88", path[-1], "G"]
        blocks = [arm(True), travel(0, 50), {"kind": "move", "cmds": cmds, "paintMM": 66.0, "painted": [1] * len(path)}, arm(True)]
        b = FakeBoard(rate=1)
        r = self.runner(b)
        seen = {}

        def later():
            if b.running and b.queue and b.queue[0] == "L 5.00 53.70" and "asked" not in seen:
                seen["asked"] = r.pause()
            if r.state == "paused" and "held" not in seen:
                seen["held"] = (r.brush_on, round(self.elbow(b)))
                r.resume()
        b.on_sleep = later
        r.start(blocks)
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.assertTrue(seen.get("asked"), "paused while on the lane run back")
        self.assertEqual(seen["held"], (False, BRUSH_UP_DEG), "the brush off the canvas while paused")
        i = b.log.index("S")
        self.assertGreaterEqual(len([c for c in b.log[i:b.log.index("F 20", i)] if c.startswith("J 2")]), 2, "up, and pressed again to go on")
        after = [c for c in b.log[i:] if c.startswith("L")]
        self.assertTrue(after[0].endswith("53.70"), f"goes on along its own lane: {after[0]}")
        k = path.index(after[0])
        self.assertEqual(after, path[k:], "the rest of the snake, nothing skipped, no lane twice")
        self.assertLessEqual(abs(k - path.index("L 5.00 53.70")), 1)
        self.assertNotIn("K", b.log)
        self.assertEqual(r.status()["percent"], 100.0)

    def test_a_snake_cut_at_its_lane_ends_pauses_at_the_next_end_the_brush_lifted_there(self):
        # ALU's snake as DRAG sends it since 2026-10-10: a block a lane, the brush
        # down between them, each pauseAtEnd; paused on the middle lane
        lanes = [[f"L {k}.00 50.00" for k in range(1, 11)], [f"L {k}.00 53.70" for k in range(10, 0, -1)], [f"L {k}.00 57.40" for k in range(1, 11)]]
        cmds = [["F 20", "W 2 0 211"] + lanes[0] + ["G"], ["F 20"] + lanes[1] + ["G"], ["F 20"] + lanes[2][:-1] + ["W 2 10 88", lanes[2][-1], "G"]]
        blocks = [arm(True), travel(0, 50)] + [{"kind": "move", "cmds": c, "paintMM": 22.0, "painted": [1] * 10, "pauseAtEnd": True} for c in cmds] + [arm(True)]
        b = FakeBoard(rate=1)
        r = self.runner(b)
        seen = {}

        def later():
            if b.running and b.queue and b.queue[0] == "L 5.00 53.70" and "asked" not in seen:
                seen["asked"] = r.pause()
            if r.state == "paused" and "held" not in seen:
                seen["held"] = (r.brush_on, round(self.elbow(b)), b.x, b.y)
                r.resume()
        b.on_sleep = later
        r.start(blocks)
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.assertTrue(seen.get("asked"))
        self.assertNotIn("S", b.log, "not braked on the line")
        self.assertEqual(seen["held"][:2], (False, BRUSH_UP_DEG), "the brush off the canvas while paused")
        self.assertEqual(seen["held"][2:], (round(1 * STEPS_PER_MM[0]), round(53.7 * STEPS_PER_MM[1])), "held at the lane's end")
        self.assertEqual([c for c in b.log if c.startswith("L")], lanes[0] + lanes[1] + lanes[2], "every lane once, in order")
        self.assertLess(abs(self.elbow(b) - BRUSH_UP_DEG), 1)

    def test_alu_cut_holds_at_the_stop_between_parts_the_brush_up_and_goes_on(self):
        # ALU-CUT (the owner, 2026-10-11): a part, the brush up, a pause block —
        # wipe the brush, squeeze the next part's paints — then the next part
        part = lambda y: {"kind": "move", "cmds": ["F 20", "W 2 0 211"] + [f"L {k}.00 {y}" for k in range(1, 6)] + ["W 2 10 88", f"L 6.00 {y}", "G"],
                          "paintMM": 6.0, "painted": [1] * 6, "pauseAtEnd": True}
        why = "Pipe 1, part 2 of 2: wipe or wash the brush, squeeze its paints, then Continue"
        blocks = [arm(True), travel(0, 50.0), part("50.00"), arm(True), {"kind": "pause", "why": why}, travel(0, 60.0), part("60.00"), arm(True)]
        b = FakeBoard(rate=2)
        r = self.runner(b)
        seen = {}

        def later():
            if r.state == "paused" and "held" not in seen:
                seen["held"] = (r.status()["message"], r.brush_on, round(self.elbow(b)), [c for c in b.log if c.startswith("L")][-1])
                r.resume()
        b.on_sleep = later
        r.start(blocks)
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        self.assertEqual(seen["held"], (why, False, BRUSH_UP_DEG, "L 6.00 50.00"), "held after the first part, the brush up, the stop named")
        self.assertEqual([c for c in b.log if c.startswith("L")], [f"L {k}.00 50.00" for k in range(1, 7)] + [f"L {k}.00 60.00" for k in range(1, 7)], "each part once")

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


class TrimTest(unittest.TestCase):
    """ELBOW LIVE (the owner, 2026-10-28: "pull a slider while it draws"): a
    trim on every W 2 as it goes to the board, never on a J; within reach; 0 at
    a start."""

    def setUp(self):
        self.t = ElbowOnPathTest()

    def run_with(self, trim):
        b = FakeBoard()
        r = self.t.runner(b)
        b.on_sleep = lambda: r.trim == trim or r.set_trim(trim)     # once the run is under way, before its pass
        r.start(self.t.blocks())
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        return b, r

    def test_a_trim_rides_on_every_w_2_of_the_pass(self):
        b, r = self.run_with(1.0)
        self.assertEqual([c for c in b.log if c.startswith("W ")], ["W 2 19.0 211", "W 2 24.0 88", "W 2 19.0 88", "W 2 14.0 88"])   # 6, 1, 6, 11 from +25°
        self.assertLess(abs(self.t.elbow(b) - BRUSH_UP_DEG), 1, "a J where it says: up at the end")
        self.assertEqual(r.status()["trim"], 1.0)

    def test_never_past_the_elbows_reach(self):
        b, _ = self.run_with(-6.0)
        self.assertEqual([c for c in b.log if c.startswith("W ")], ["W 2 26.0 211", "W 2 30.0 88", "W 2 26.0 88", "W 2 21.0 88"])   # -1, -5 (not -6), -1, 4

    def test_set_rounded_and_held_within_trim_max_and_0_at_a_start(self):
        r = Runner(FakeBoard().send)
        self.assertEqual(r.set_trim("0.26"), 0.3)
        self.assertEqual(r.set_trim(40), rubens.TRIM_MAX)
        self.assertRaises(ValueError, r.set_trim, "nan")
        r.start([travel(10, 10)]); r.thread.join(5)
        self.assertEqual(r.trim, 0.0)


class RestTest(unittest.TestCase):
    """A pencil's elbow resting on the paper above the pose it was sent to
    (2026-10-28, OPM): the run goes on — a pencil's run only, going down, so
    far above at most."""

    def blocks(self):
        return [{"kind": "arm", "cmd": "J 2 25", "row": 0}, travel(100, 20), {"kind": "arm", "cmd": "J 2 5", "row": 1},
                {"kind": "move", "cmds": ["F 20", "W 2 6 211", "L 1.00 20.00", "G"], "paintMM": 1.0, "painted": [1]}, {"kind": "arm", "cmd": "J 2 25", "row": 1}]

    def run_on(self, page, rest_at):
        b = FakeBoard()
        t = ElbowOnPathTest()
        r = t.runner(b)
        b.elbow_cap = t.ZERO["elbow"] - round(rest_at * TICKS_PER_DEG)          # the elbow no lower than rest_at
        r.start(self.blocks(), {"page": page})
        r.thread.join(60)
        return r, b, t

    def test_a_pencil_resting_a_degree_above_goes_on(self):
        r, b, t = self.run_on("opm", 6.1)
        self.assertEqual(r.state, "done", r.message)
        self.assertGreaterEqual(t.elbow(b), 5.9)

    def test_opm_b_s_w_p_and_n_are_pencil_pages_too(self):
        for page in ("opmb", "opms", "opmw", "opmp", "opmn"):
            r, b, t = self.run_on(page, 6.1)
            self.assertEqual(r.state, "done", f"{page}: {r.message}")

    def test_the_brush_or_too_far_above_stops_as_before(self):
        r, _, _ = self.run_on("ccd", 6.1)
        self.assertEqual(r.state, "error"); self.assertIn("J 2 5", r.message)
        r, _, _ = self.run_on("opm", 18)
        self.assertEqual(r.state, "error"); self.assertIn("does not get to", r.message)


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
        self.assertEqual(board_line("/servo?j=shoulder&d=12.34&v=5"), ("J 1 12.3 5", 1.0))   # 2026-10-02
        self.assertEqual(board_line("/servo?j=wrist&d=-54"), ("J 3 -54", 1.0))
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


class SilentArmTest(unittest.TestCase):
    """A silent arm pauses the run (the owner, 2026-11-11: all three servos silent at once mid-run, back when the carriage
    was moved; "yes, I allow it"): Continue makes the same move again, STOP ends the run as stopped, the servos' volts in
    the journal."""

    SILENT = "ok V | X MCPWM_PCNT, Y MCPWM_PCNT | путь: пусто 0 | 1: молчит | 2: молчит | 3: молчит"

    def runner(self, blocks, when, act):
        # the bus silent from the moment `when(b)` says so; `act(r, b, s)` at every sleep while the run is paused on it
        b, logs, s = FakeBoard(), [], {"on": False, "seen": []}
        def send(path):
            if s["on"] and path.startswith("/look"):
                return self.SILENT
            if s["on"] and path.startswith("/zero"):
                return "ok Z 0"
            return b.send(path)
        arm = Arm(send, zero=lambda: ArmStrokeRunTest.ZERO, sleep=b.sleep)
        r = Runner(send, sleep=b.sleep, swing_s=0, arm=arm, log=logs.append)
        def later():
            if not s["on"] and not s.get("was") and when(b):
                s["on"] = s["was"] = True
            if r.state == "paused" and r._silent:
                s["seen"].append(r.message)
                act(r, b, s)
        b.on_sleep = later
        self.assertTrue(r.start(blocks)[0])
        r.thread.join(10)
        return r, b, logs, s

    BLOCKS = [arm(False), paint(3), arm(True), travel(30, 60)]

    def test_silent_past_the_wait_the_run_pauses_and_continue_makes_the_same_move(self):
        def act(r, b, s):
            if s["on"]:
                s["on"] = False                  # the contact back: the arm answers
            elif r.message.startswith("The arm answers again"):
                r.resume()
        r, b, logs, s = self.runner(self.BLOCKS, lambda b: "G" in b.log, act)
        self.assertEqual(r.state, "done", r.message)
        self.assertTrue(s["seen"][0].startswith("ARM SILENT: the shoulder, the elbow and the wrist do not answer"), s["seen"][0])
        self.assertIn("The arm answers again (11.3 V): Continue", s["seen"][-1])
        self.assertTrue(any(c == f"J 2 {BRUSH_UP_DEG}" or c.startswith("J 2 ") and c != "J 2 0" for c in b.log[b.log.index("G"):]), b.log)
        ev = [e["event"] for e in logs]
        self.assertIn("silent", ev); self.assertIn("arm back", ev)
        silent = next(e for e in logs if e["event"] == "silent")
        self.assertEqual(silent["volts"], {"shoulder": 11.3, "elbow": 11.3, "wrist": 11.3}, silent)
        self.assertEqual(next(e for e in logs if e["event"] == "continue")["after"], "silent")
        self.assertEqual(ev[-1], "done")
        self.assertIsNone(r.status()["silent"])

    def test_stop_while_paused_on_a_silent_arm_ends_it_as_stopped(self):
        r, b, logs, s = self.runner(self.BLOCKS, lambda b: "G" in b.log, lambda r, b, s: r.stop())
        self.assertEqual(r.state, "stopped", r.message)
        self.assertNotIn("M 30.00 60.00", b.log, "nothing after the stop")

    def test_no_dip_and_no_jump_while_it_is_silent_and_no_paint_to_change(self):
        said = {}
        def act(r, b, s):
            if not said:
                said.update(dip=r.dip(), goto=r.goto(0, 1), status=r.status(), next=r.where()["next"])
                r.stop()
        r, b, logs, s = self.runner(self.BLOCKS, lambda b: "G" in b.log, act)
        self.assertFalse(said["dip"]); self.assertFalse(said["goto"][0])
        self.assertEqual(said["status"]["silent"], ["shoulder", "elbow", "wrist"]); self.assertEqual(said["status"]["state"], "paused")
        self.assertIsNone(said["next"])

    def test_silent_at_a_stroke_s_landing_on_the_path_pauses_too(self):
        # W on the path reads where the joints stand: silent there, paused, not "W: the elbow does not answer"
        row = {"kind": "move", "cmds": ["F 20", "W 2 5 211", "L 1.00 50.00", "W 2 0 88", "L 2.00 50.00", "G"], "paintMM": 2}
        def act(r, b, s):
            if s["on"]:
                s["on"] = False
            elif r.message.startswith("The arm answers again"):
                r.resume()
        r, b, logs, s = self.runner([arm(True), travel(1, 50), row, arm(True)], lambda b: any(c.startswith("M ") for c in b.log), act)
        self.assertEqual(r.state, "done", r.message)
        self.assertIn("W:", next(e for e in logs if e["event"] == "silent")["why"])
        self.assertTrue(any(c.startswith("W 2") for c in b.log), b.log)

    def test_the_carriage_moved_meanwhile_the_brush_up_and_back_to_its_place_first(self):
        moved = {}
        def act(r, b, s):
            if s["on"]:
                moved["at"] = (b.x, b.y)
                b.x += round(40 * STEPS_PER_MM[0])            # a jog of 40 mm along X while paused
                s["on"] = False
            elif r.message.startswith("The arm answers again"):
                r.resume()
        r, b, logs, s = self.runner(self.BLOCKS, lambda b: "G" in b.log, act)
        self.assertEqual(r.state, "done", r.message)
        x, y = moved["at"][0] / STEPS_PER_MM[0], moved["at"][1] / STEPS_PER_MM[1]
        back = [i for i, c in enumerate(b.log) if c == f"M {x:.2f} {y:.2f}"]
        self.assertTrue(back, b.log)
        up = [i for i, c in enumerate(b.log) if c.startswith("J 2 ") and i > b.log.index("G")]   # the firmware's degrees: the elbow up, at its slower lift
        self.assertTrue(up and up[0] < back[0] and b.log[up[0]].endswith(f" v{rubens.ELBOW_UP_SPEED:g}"), f"the brush up before the carriage goes back: {b.log}")
        self.assertTrue(any(e["event"] == "back to" for e in logs))

    def test_stop_while_a_silent_arm_is_waited_for_ends_it_as_stopped(self):
        # STOP within the SILENT_WAIT, before the pause: stopped, not an error
        n = {"k": 0}
        def when(b):
            return "G" in b.log
        b, logs, s = FakeBoard(), [], {"on": False}
        def send(path):
            if s["on"] and path.startswith("/look"):
                n["k"] += 1
                if n["k"] == 20:
                    r.stop()
                return self.SILENT
            return b.send(path)
        arm_ = Arm(send, zero=lambda: ArmStrokeRunTest.ZERO, sleep=b.sleep)
        r = Runner(send, sleep=b.sleep, swing_s=0, arm=arm_, log=logs.append)
        b.on_sleep = lambda: s.update(on=s["on"] or when(b))
        self.assertTrue(r.start(self.BLOCKS)[0])
        r.thread.join(10)
        self.assertEqual(r.state, "stopped", r.message)
        self.assertNotIn("silent", [e["event"] for e in logs])

    def test_silent_again_at_the_brush_s_lift_it_still_goes_back_to_where_it_first_went_silent(self):
        b, logs, st = FakeBoard(), [], {"phase": 0, "looks": 0}
        def send(path):
            if path.startswith("/look"):
                if st["phase"] == 3:                      # after the first Continue: the look before the lift answers, the lift's own does not
                    st["looks"] += 1
                    if st["looks"] == 2:
                        st["phase"] = 4
                if st["phase"] in (1, 4):
                    return self.SILENT
            if path.startswith("/zero") and st["phase"] in (1, 4):
                return "ok Z 0"
            return b.send(path)
        arm_ = Arm(send, zero=lambda: ArmStrokeRunTest.ZERO, sleep=b.sleep)
        r = Runner(send, sleep=b.sleep, swing_s=0, arm=arm_, log=logs.append)
        def later():
            if st["phase"] == 0 and "G" in b.log:
                st["phase"] = 1
            elif st["phase"] == 1 and r._silent:
                st["at"] = (b.x, b.y)
                b.x += round(40 * STEPS_PER_MM[0])          # a jog while paused
                st["phase"] = 2
            elif st["phase"] == 2 and r._silent and r.message.startswith("The arm answers again"):
                st["phase"] = 3
                r.resume()
            elif st["phase"] == 4 and r._silent:
                st["phase"] = 5
            elif st["phase"] == 5 and r._silent and r.message.startswith("The arm answers again"):
                st["phase"] = 6
                r.resume()
        b.on_sleep = later
        self.assertTrue(r.start(self.BLOCKS)[0])
        r.thread.join(10)
        self.assertEqual(r.state, "done", r.message)
        silent = [e for e in logs if e["event"] == "silent"]
        self.assertEqual(len(silent), 2, [e["event"] for e in logs])
        self.assertIn(f"J 2 {BRUSH_UP_DEG}", silent[1]["why"])
        x, y = st["at"][0] / STEPS_PER_MM[0], st["at"][1] / STEPS_PER_MM[1]
        self.assertEqual(silent[1]["at_mm"], [round(x, 1), round(y, 1)], "the first place kept")
        self.assertIn(f"M {x:.2f} {y:.2f}", b.log)

    def test_every_dip_in_the_journal_carries_the_servos_volts(self):
        self.assertEqual(rubens.parse_power("ok V | 1: поза 2499, 11,3 В, 31 °C | 2: молчит | 3: поза 1, 12,0 В, -2 °C"), {1: (11.3, 31), 3: (12.0, -2)})
        b = FakeBoard()
        a = Arm(b.send, zero=lambda: ArmStrokeRunTest.ZERO, sleep=b.sleep)
        self.assertEqual(a.power_note(), {})
        a.angles()
        n = a.power_note()
        self.assertEqual(n["volts"], {"shoulder": 11.3, "elbow": 11.3, "wrist": 11.3}); self.assertEqual(n["temp_c"]["elbow"], 30)
        r = Runner(b.send, sleep=b.sleep, swing_s=0, arm=a)
        self.assertEqual(r._dip_note()["volts"]["wrist"], 11.3)


if __name__ == "__main__":
    unittest.main()
