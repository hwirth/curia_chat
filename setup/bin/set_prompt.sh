#!/bin/bash
###############################################################################
# set_prompt.sh
###############################################################################
# Call this script from your  ~/.bash_profile  or  ~/.bashrc  in order to get
# nice colored prompts. Green/Cyan: user,  Red/yellow: root
# The second color indicates, that you are in  screen .
# In order for this script to take effect, you need to  source  it:
# .bashrc :
#   source /path/to/this/set_prompt.sh
###############################################################################

# Generate ANSI-Escape-Sequences for better readability of this script:
TEXT_UNDERLINE="\[$(tput smul)\]"
TEXT_endUNDERLINE="\[$(tput rmul)\]"
TEXT_STANDOUT="\[$(tput smso)\]"
TEXT_endSTANDOUT="\[$(tput rmso)\]"

TEXT_DIM="\[$(tput dim)\]"
TEXT_BOLD="\[$(tput bold)\]"
TEXT_BLINK="\[$(tput blink)\]"
TEXT_REVERSE="\[$(tput rev)\]"

TEXT_RED="\[$(tput setaf 1)\]"
TEXT_GREEN="\[$(tput setaf 2)\]"
TEXT_YELLOW="\[$(tput setaf 3)\]"
TEXT_BLUE="\[$(tput setaf 4)\]"
TEXT_MAGENTA="\[$(tput setaf 5)\]"
TEXT_CYAN="\[$(tput setaf 6)\]"
TEXT_WHITE="\[$(tput setaf 7)\]"

TEXT_RESET="\[$(tput sgr0)\]"


# Default is "user", with green prompt (not in  screen ):
PROMPT_SIGN="\$"
PROMPT_COLOR=$TEXT_GREEN


# For users with multiple systems, add the disk number of the current system:
DISK=$( mount | grep 'on / type' | awk '{ print $1; }' | awk -F '/' '{ print $3 }' )

if [ "$DISK" == "mapper" ] ; then
	DISK=$( mount | grep 'on / type' | awk '{ print $1; }' | awk -F '/' '{ print $4 }' )
fi


# Show return codes for programs exiting with values other than zero:
exitstatus()
{
	STATUS=$?
	if [ "$STATUS" != "0" ]; then
		echo "($STATUS) "
	fi
}


# Determine, if we are the root user
if [ "$HOME" = "/root" ] ; then
        PROMPT_SIGN="#"
	PROMPT_COLOR=$TEXT_RED
fi

# Use different colors, when the shell is run within  screen :
if [ "$STY" != "" ] ; then
	PROMPT_COLOR=$TEXT_CYAN
	if [ "$HOME" = "/root" ] ; then
		PROMPT_COLOR=$TEXT_YELLOW
	fi
fi


# Set the prompt:
#if [ "$(whoami)" = "root" ] ; then
#	export PS1="\$(exitstatus)${PROMPT_COLOR}${TEXT_BOLD}\w${TEXT_RESET} "
#else
	export PS1="\$(exitstatus)${PROMPT_COLOR}${TEXT_BOLD}\u@\h/$DISK${TEXT_RESET}:${TEXT_BOLD}\w${TEXT_RESET} ${PROMPT_SIGN} "
#fi

# Reset colors after user hits Return, in case you want user input in non-standard colors:
trap 'tput sgr0' DEBUG

