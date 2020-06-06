#!/bin/bash

do_as_su()
{
	if [ "$1" = "-x" ] ; then
		extra_dirs="\
                        |/home/hmw/.mozilla/firefox \
                        |/home/hmw/.cache/mozilla/firefox \
			|/home/hme/.cache/thunderbird \
                        |/home/hmw/.thunderbird \
                        |/home/hmw/.purple \
                        |/var/lib/vnstat/ \
		"
	fi

	exclude_dirs=$(echo "\
		 /tmp
		|/dev \
		|/proc \
		|/sys \
		|/run \
		|/mnt \
		|/data/backup \
		$extra_dirs \
	" | tr -d " \t\n\r" )

	echo 999999 > /proc/sys/fs/inotify/max_user_watches
	inotifywait \
		-e modify -e attrib -e move -e create -e delete \
		-m -r / \
		--exclude "($exclude_dirs)" \
	;

}

DECL=$(declare -f do_as_su)
sudo bash -c "$DECL; do_as_su $1"
