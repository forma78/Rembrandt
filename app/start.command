#!/bin/bash
# Rembrandt — the pages on port 5164 and the board on USB, one program (rembrandt.py)
cd "$(dirname "$0")"
(sleep 1; open http://localhost:5164/) &   # TYPE, the first tab (index.html)
exec python3 rembrandt.py
