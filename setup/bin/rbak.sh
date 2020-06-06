#!/bin/bash
###############################################################################
# rbak.sh - Creates a backup of the current system with rsync
###############################################################################

# Base settings
backup_basename="/data/backup/$(hostname).rbak"
exclude_dirs='{"/dev/*","/proc/*","/sys/*","/tmp/*","/run/*","/mnt/*","/media/*","/lost+found","/data/*"}'
exclude_notify='(/dev|/proc|/sys|/tmp|/run|/mnt|/media|/lost+found|/data)'
rsync_cmd="rsync -axHAWX --info=progress2 --delete --exclude=$exclude_dirs /"
halt_users="harald"   # Pause all processes of these user(s) while running rsync. Space delimited list.
halt_services=(vnstat)

# Colored output
TEXT_UNDERLINE="$(tput smul)"
TEXT_endUNDERLINE="$(tput rmul)"
TEXT_STANDOUT="$(tput smso)"       # Inverse colors on my terminal
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

sanity_checks()
{
	if [ "$(whoami)" != "root" ] ; then
		echo "Error: This script must be run as root!"
		exit 1
	fi

	if [ "$1" != "" ] ; then
		backup_dir="$backup_basename.$1"
	else
		echo "Usage: $(basename $0) <suffix>"
		echo "Backup directory base name: $backup_basename"
		echo "Excluded directories: $exclude_dirs"
		echo "Example: '$(basename $0) 1' will rsync the current system to $backup_basename.1"
		if ls -U "$backup_basename".* 1> /dev/null 2>&1 ; then
			echo "Existing backups:"
			ls -lad "$backup_basename".*
		else
			echo "Warning: No backup directories found: $backup_basename.*"
		fi
		exit
	fi

	if [ ! -d "$backup_dir" ] ; then
		echo "Error: Backup directory not found: $backup_dir"
		echo "mkdir -p $backup_dir"
		exit 2
	fi

	if [ $DISPLAY ] ; then
		echo "Error: This script must not be run from an X terminal!"
		exit 3
	fi
}

halt_user_processes()
{
	echo "Halting user processes:"
	echo $halt_users | tr ' ' "\n" | xargs -I % sh -c 'echo -n "%: " ; pkill -e -STOP -u % | wc -l'
}

resume_user_processes()
{
	echo "Resuming user processes:"
	echo $halt_users | tr ' ' "\n" | xargs -I % sh -c 'echo -n "%: " ; pkill -e -CONT -u % | wc -l'
}

halt_services()
{
	for service in "${halt_services[@]}" ; do
		echo "Halting service $service.service"
		systemctl stop $service.service
	done
}

resume_services()
{
	for service in "${halt_services[@]}" ; do
		echo "Resuming service $service.service"
		systemctl start $service.service
	done
}

do_backup()
{
	echo "About to ${TEXT_BOLD}CREATE BACKUP${TEXT_RESET} of sda8 (/) and sda9 (/boot) to ${TEXT_BOLD}${backup_dir}${TEXT_RESET}"
	echo "${TEXT_YELLOW}$rsync_cmd $backup_dir${TEXT_RESET}"

	halt_services

	echo "Showing files, that are being written while rsync is running:"
	echo "${TEXT_YELLOW}inotifywait -e modify -e attrib -e move -e create -e delete -m -r --exclude \"$exclude_notify\" > >(ts) &${TEXT_RESET}"

	echo "Wait for watches to be established, then press Enter to continue or Ctrl+C to abort"

	echo 999999 > /proc/sys/fs/inotify/max_user_watches
	inotifywait \
		-e modify -e attrib -e move -e create -e delete -m -r / \
		--exclude "$exclude_notify" \
		> >(ts ' %H:%M:%S') &
	inotify_pid=$!

	read
	tput cuu1

	echo -e $(halt_user_processes)
	halted_user_processes=true

	echo "Backing up ${TEXT_BOLD}${TEXT_YELLOW}/${TEXT_RESET}"
	eval $rsync_cmd $backup_dir
}

cleanup()
{
	kill -9 $inotify_pid
	[ $halted_user_processes ] && echo -e $(resume_user_processes)

	resume_services

	touch $backup_dir
	echo "Done."
	exit
}


echo "${TEXT_YELLOW}${TEXT_BOLD}$(basename $0)${TEXT_RESET} (Backup the current system via rsync)"
sanity_checks $1
trap cleanup SIGINT
do_backup
cleanup