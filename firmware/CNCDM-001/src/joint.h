// The J command, read without the board, so the Mac can test it
// (test_host/joint_test.cpp).
//
//   J <j> <deg> [<deg/s>]
//
// j: 1 shoulder, 2 elbow, 3 wrist. deg: from the joint's zero, tenths of a
// degree count (the servo turns in 0.088° ticks). deg/s: how fast — new on
// 2026-10-02 for Rembrandt's arm strokes, a slow arc of the brush; without
// it the joint goes as it always went, 600 ticks/s (about 53°/s).
#pragma once
#include <stdlib.h>
#include <math.h>
#include <stdio.h>

namespace joint {

static const float    TICKS_PER_DEG = 4096.0f / 360.0f;   // 11.378 ticks a degree
static const uint16_t SPEED_DEFAULT = 600;                 // ticks/s, about 53°/s
static const uint16_t SPEED_MIN     = 6;                   // ticks/s, about 0.5°/s
static const uint16_t SPEED_MAX     = 1200;                // ticks/s, about 105°/s
// W, the wrist on the move (2026-10-02): it must keep up with the carriage
// along a tail, so faster — the ST3235 makes about 250°/s at 12 V (est.)
static const uint16_t WRIST_SPEED_MAX = 2400;              // ticks/s, about 211°/s
static const uint8_t  WRIST_ACC       = 150;               // the servo's acceleration register for W (est.; 30 for J)

struct Cmd { int j; float deg; uint16_t speed; };

// The one joint that may turn while the carriage runs a path (2026-10-02):
// the wrist, so the brush lands and lifts where it stands while the
// carriage moves back under it. The shoulder and the elbow never move with
// the rail.
static inline bool turnsWithRail(int j) { return j == 3; }

// false when the line is not "J <j> <deg> [<deg/s>]"; the joint and the
// limit are checked by the caller. strtol and strtof, as the path pieces
// are read (main.cpp): float sscanf is not to be trusted on every libc.
static inline bool parse(const char *args, Cmd &c, uint16_t fastest = SPEED_MAX) {
  char *e;
  const long j = strtol(args, &e, 10);
  if (e == args) return false;
  const char *p = e;
  const float deg = strtof(p, &e);
  if (e == p || isnan(deg) || isinf(deg)) return false;
  p = e;
  const float dps = strtof(p, &e);
  const bool hasSpeed = e != p;
  c.j = (int)j;
  c.deg = roundf(deg * 10.0f) / 10.0f;
  if (hasSpeed) {
    if (!(dps > 0) || isinf(dps)) return false;
    float t = dps * TICKS_PER_DEG;
    if (t < SPEED_MIN) t = SPEED_MIN;
    if (t > fastest) t = fastest;
    c.speed = (uint16_t)lroundf(t);
  } else {
    c.speed = SPEED_DEFAULT;
  }
  return true;
}

// W <deg> [<deg/s>] (2026-10-02): the wrist, as J 3 takes it, but turned
// when the carriage reaches the next piece of path (main.cpp, path.h).
static inline bool parseWrist(const char *args, Cmd &c) {
  char line[80];
  snprintf(line, sizeof line, "3 %s", args);
  return parse(line, c, WRIST_SPEED_MAX);
}

// I <from> <to> (2026-10-02, new ST3235 servos): a servo's id on the bus,
// 0…253 each, not the same; false otherwise.
static inline bool parseIds(const char *args, int &from, int &to) {
  char *e;
  const long a = strtol(args, &e, 10);
  if (e == args) return false;
  const char *p = e;
  const long b = strtol(p, &e, 10);
  if (e == p || a < 0 || a > 253 || b < 0 || b > 253 || a == b) return false;
  from = (int)a; to = (int)b;
  return true;
}

}  // namespace joint
