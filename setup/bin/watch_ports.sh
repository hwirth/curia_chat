#!/bin/sh

while [ 1 ] ; do
	clear
	netstat -tulpe | ccze -A -o nolookups
	netstat -tupe  | ccze -A -o nolookups
	sleep 10
done
