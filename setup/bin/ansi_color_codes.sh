#!/bin/bash

echo "ANSI ESCAPE SEQUENCES:"
for c in {31..37} ; do
	echo -e "$c\t[0;"$c"m^[[0;"$c"m\t[1;"$c"m^[[1;"$c"m[0;37m"
done

echo
echo "TERMINFO COLORS: (Reported colors: $(tput colors))"

cat << "EOF"
TEXT_UNDERLINE="$(tput smul)"
TEXT_endUNDERLINE="$(tput rmul)"
TEXT_STANDOUT="$(tput smso)"
TEXT_endSTANDOUT="$(tput rmso)"
TEXT_DIM="$(tput dim)"
TEXT_BOLD="$(tput bold)"
TEXT_BLINK="$(tput blink)"
TEXT_REVERSE="$(tput rev)"
TEXT_RED="$(tput setaf 1)"
TEXT_GREEN="$(tput setaf 2)"
TEXT_YELLOW="$(tput setaf 3)"
TEXT_BLUE="$(tput setaf 4)"
TEXT_MAGENTA="$(tput setaf 5)"
TEXT_CYAN="$(tput setaf 6)"
TEXT_WHITE="$(tput setaf 7)"
TEXT_RESET="$(tput sgr0)"
EOF

echo "[0;37m"
