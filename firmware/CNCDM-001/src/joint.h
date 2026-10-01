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

namespace joint {

static const float    TICKS_PER_DEG = 4096.0f / 360.0f;   // 11.378 ticks a degree
static const uint16_t SPEED_DEFAULT = 600;                 // ticks/s, about 53°/s
static const uint16_t SPEED_MIN     = 6;                   // ticks/s, about 0.5°/s
static const uint16_t SPEED_MAX     = 1200;                // ticks/s, about 105°/s

struct Cmd { int j; float deg; uint16_t speed; };

// false when the line is not "J <j> <deg> [<deg/s>]"; the joint and the
// limit are checked by the caller. strtol and strtof, as the path pieces
// are read (main.cpp): float sscanf is not to be trusted on every libc.
static inline bool parse(const char *args, Cmd &c) {
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
    if (t > SPEED_MAX) t = SPEED_MAX;
    c.speed = (uint16_t)lroundf(t);
  } else {
    c.speed = SPEED_DEFAULT;
  }
  return true;
}

}  // namespace joint
