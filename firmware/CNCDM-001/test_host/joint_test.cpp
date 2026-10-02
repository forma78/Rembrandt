// The J command on the Mac, no board:
//   c++ -std=c++17 -O1 -o /tmp/joint_test test_host/joint_test.cpp && /tmp/joint_test
#include <stdint.h>
#include <cstdio>
#include <cstdlib>
#include "../src/joint.h"

static int fails = 0;
#define CHECK(cond, what) do { if (!(cond)) { std::printf("FAIL %s\n", what); fails++; } else std::printf("ok   %s\n", what); } while (0)

int main() {
  joint::Cmd c{};
  CHECK(joint::parse(" 3 -54", c) && c.j == 3 && c.deg == -54.0f && c.speed == joint::SPEED_DEFAULT,
        "J 3 -54: as before, the speed of always");
  CHECK(joint::parse(" 1 12.34", c) && c.j == 1 && c.deg == 12.3f, "tenths of a degree count");
  CHECK(joint::parse(" 1 20 5", c) && c.speed == 57, "5 deg/s is 57 ticks/s");
  CHECK(joint::parse(" 1 20 0.1", c) && c.speed == joint::SPEED_MIN, "too slow: the slowest");
  CHECK(joint::parse(" 1 20 500", c) && c.speed == joint::SPEED_MAX, "too fast: the fastest");
  CHECK(!joint::parse(" 1 20 0", c) && !joint::parse(" 1 20 -5", c), "no speed of zero or below");
  CHECK(!joint::parse(" 1", c) && !joint::parse("", c) && !joint::parse(" x 3", c), "no angle: refused");
  CHECK(joint::turnsWithRail(3) && !joint::turnsWithRail(1) && !joint::turnsWithRail(2),
        "on a path only the wrist may turn");
  CHECK(joint::parseOnPath(" 2 25", c) && c.j == 2 && c.deg == 25.0f && c.speed == joint::SPEED_DEFAULT,
        "W 2 25: the elbow, the speed of always");
  CHECK(joint::parseOnPath(" 3 -54 105", c) && c.j == 3 && c.deg == -54.0f && c.speed == 1195, "W 3 -54 105: the wrist at 105 deg/s");
  CHECK(!joint::parseOnPath(" 1 10", c), "W never turns the shoulder");
  CHECK(!joint::parseOnPath("", c) && !joint::parseOnPath(" 2", c) && !joint::parseOnPath(" x", c), "W without a joint or an angle: refused");
  CHECK(joint::parseOnPath(" 2 10 180", c) && c.speed == 2048, "W goes faster than J: 180 deg/s");
  CHECK(joint::parseOnPath(" 2 10 900", c) && c.speed == joint::ON_PATH_SPEED_MAX && joint::parse(" 2 10 900", c) && c.speed == joint::SPEED_MAX,
        "each its own fastest");
  int f = -1, t = -1;
  CHECK(joint::parseIds(" 1 3", f, t) && f == 1 && t == 3, "I 1 3");
  CHECK(!joint::parseIds(" 1 1", f, t) && !joint::parseIds(" 1 254", f, t) && !joint::parseIds(" 1", f, t) && !joint::parseIds(" -1 2", f, t),
        "I: the same, past 253, one id, below zero — refused");
  std::printf(fails ? "%d FAILED\n" : "all good\n", fails);
  return fails ? 1 : 0;
}
