#!/bin/bash

#mount | grep '/dev/sd'  | awk '{ print $1" "$3; }'
DF=$(df -h)
echo "$DF" | head -n 1
echo "$DF" | grep '^/dev/'
