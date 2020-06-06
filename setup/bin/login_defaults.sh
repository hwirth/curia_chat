#!/bin/bash

HISTCONTROL=ignoreboth
HISTSIZE=1000
HISTFILESIZE=2000
shopt -s histappend

if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi

PATH=$PATH:~/bin

export LESS="-XF"

alias ls="LC_COLLATE=C ls -p --color --group-directories-first"
alias ll="LC_COLLATE=C ls -halpX --group-directories-first --color"
alias ccze="ccze -A -o nolookups"
alias www="cd /srv/www/<DOMAIN>/server/ ; ll"
alias journal="journalctl --no-pager"

if [[ $- == *i* ]] ; then
	. ~/bin/set_prompt.sh
	screen -list
	vnstat
fi
