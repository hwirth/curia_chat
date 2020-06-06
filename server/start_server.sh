#!/bin/sh
##################################################################################################################119:#
#
#   CURIA CHAT SERVER - CONFIG FILE PARSER and RESTART WRAPPER
#
#   This file is meant to be started as a service on boot.
#
##################################################################################################################119:#


##################################################################################################################119:#
# PARSE CONFIG FILE
##################################################################################################################119:#

test -f ./secrets/curia_chat.conf && export config_file=./secrets/curia_chat.conf
test -f /etc/curia_chat.conf && export config_file=/etc/curia_chat.conf

while read -r key value; do
	[[ $key == \#* ]] && continue;
	[[ $key == '' ]] && continue;
	export "$key=$value"
done < $config_file


##################################################################################################################119:#
# RESTART AFTER (ERROR/REQUESTED) ABORTS
##################################################################################################################119:#

path=$(dirname $0)

nr_crashes=0

while [ 1 ] ; do
	node $path/main.js
	case $? in
	2)
		exit
		;;
	1)
		nr_crashes=0
		;;
	*)
		nr_crashes=$(($nr_crashes + 1))
		if [ $nr_crashes -gt 30 ] ; then
			nr_crashes=30
		fi
		sleep $nr_crashes
		;;
	esac
done


#EOF