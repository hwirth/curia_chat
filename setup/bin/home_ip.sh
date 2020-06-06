#!/bin/bash

#curl -Ls -o /dev/null -w %{url_effective} http://harald.ist.org/home/ | awk -F '/' '{ print $3 }'
LC_ALL=C wget harald.ist.org/.home 2>&1 | grep Location | tail -n 1 | cut -d'/' -f 3
