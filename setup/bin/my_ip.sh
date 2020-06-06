#!/bin/sh

IF=$1

if [ "$IF" == "" ] ; then
	IF=wlan0
fi

ifconfig | grep $IF -A1 | grep inet | awk '{ print $2 }'

