"""Run Rembrandt from the project's root: python3 rembrandt.py

The server itself is app/rembrandt.py (http://localhost:5164); this only
starts it from here, so the command works in either folder (the owner,
2026-10-02, typed it in the root).
"""
import os
import runpy
import sys

APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")
sys.path.insert(0, APP)
os.chdir(APP)
runpy.run_path(os.path.join(APP, "rembrandt.py"), run_name="__main__")
