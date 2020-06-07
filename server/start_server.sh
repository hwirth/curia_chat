#!/bin/sh
##################################################################################################################119:#
# CURIA CHAT SERVER - CONFIG FILE PARSER and RESTART WRAPPER
# This file is meant to be started as a service.
##################################################################################################################119:#

cd $(dirname $0)

nr_crashes=0

while [ 1 ] ; do
	node main.js
	case $? in
	2|3|4)
		# Conditions that need this loop to end
		exit
		;;
	1)
		# Requested restart
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