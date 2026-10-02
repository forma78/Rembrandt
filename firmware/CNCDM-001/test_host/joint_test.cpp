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
  CHECK(joint::parseWrist("55", c) && c.j == 3 && c.deg == 55.0f && c.speed == joint::SPEED_DEFAULT,
        "W 55: the wrist, the speed of always");
  CHECK(joint::parseWrist(" -54 105", c) && c.j == 3 && c.deg == -54.0f && c.speed == 1195, "W -54 105: 105 deg/s");
  CHECK(joint::parseWrist(" 10 180", c) && c.speed == 2048, "W goes faster than J: 180 deg/s");
  CHECK(joint::parseWrist(" 10 900", c) && c.speed == joint::WRIST_SPEED_MAX && joint::parse(" 3 10 900", c) && c.speed == joint::SPEED_MAX,
        "each its own fastest");
  CHECK(!joint::parseWrist("", c) && !joint::parseWrist(" x", c), "W without an angle: refused");
  std::printf(fails ? "%d FAILED\n" : "all good\n", fails);
  return fails ? 1 : 0;
}
