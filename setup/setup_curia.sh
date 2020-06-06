#!/bin/bash
##################################################################################################################119:#
#   CURIA CHAT SETUP HELPER
##################################################################################################################119:#
#
#   S E T T I N G S   -   A D J U S T   T H E S E   T O   Y O U R   N E E D S
#
##################################################################################################################119:#

server=classroom.enslavers.com
port=22
user=harald

use_ansi_colors=true


##################################################################################################################119:#
#
#   S C R I P T   I N I T I A L I Z A T I O N
#
##################################################################################################################119:#

config_file_name="/etc/curia_chat.conf"
curia_user="curia"
curia_group="curia"
curia_root="/srv/curia"
curia_domain=YOUR.DOMAIN.COM
https_port=334
turn_port=8001
curia_email=CURIA@MAILPROVIDER.COM
smtp_host=SMTP.MAILPROVIDER.COM
smtp_port=587
smtp_auth_user=CURIA@MAILPROVIDER.COM
smtp_auth_pass=SMTP_PASSWORD

actions=(
	"UNDEFINED"\
	"Verify the script's configuraion"\
	"Upload the install script to the server"\
	"Log in to the server and continue the setup process there"\
	"Switch to root account"\
	"Update the server's operating system"\
	"Install required packages"\
	"Create $config_file_name"\
	"Create directory struction"\
	"Create user for curia server"\
	"Create letsencrypt SSL keys"\
	"Clone Curia GIT repository"\
	"Start server for the first time"\
)

if [ "$use_ansi_colors" == "true" ] ; then
	color_red="\e[1;31m"
	color_green="\e[1;32m"
	color_blue="\e[1;34m"
	color_yellow="\e[1;33m"
	color_bright="\e[1;37m"
	color_normal="\e[0;37m"
fi


##################################################################################################################119:#
#
#   H E L P E R S
#
##################################################################################################################119:#

##################################################################################################################119:#
# STEPS - Manage step wise execution of the installation procedure
##################################################################################################################119:#

function list_steps () {
	echo -e " Step\tDescription"
	nr=0
	for a in "${actions[@]}" ; do
		[ "$a" != "UNDEFINED" ] && echo -e "  $nr\t$a"
		nr=$((nr + 1))
	done
}

function next_step () {
	./$script_name $(($action + 1))
	exit;
}


##################################################################################################################119:#
# CONFIRM - Wait for user to press Return before commencing a shell command
##################################################################################################################119:#

function confirm () {
	if [ "$(whoami)" == "root" ] ; then
		prompt=$color_red
	else
		prompt=$color_green
	fi

	prompt="${prompt}$(whoami)@$(hostname)${color_normal}"

	if [ "$(whoami)" == "root" ] ; then
		prompt="$prompt # "
	else
		prompt="$prompt \$ "
	fi

	command=$1

	echo -en "${color_yellow}> ${prompt}${color_yellow}${command}${color_normal} (Enter/CTRL+C) "
	read

	eval $command

	error_code=$?
	if [ "$error_code" != "0" ] ; then
		exit $error_code
	fi
}


##################################################################################################################119:#
# INPUT - Print a question and let the user type and answer
##################################################################################################################119:#

function input () {
	echo -en "$1"
	read input_text

	[ "$input_text" == "" ] && input_text=$2

	export input_text
}


##################################################################################################################119:#
# CREATE CONFIG FILE
##################################################################################################################119:#

function create_config_file () {
	cat << EOF > $config_file_name
# ${config_file_name}
##################################################################################################################119:#
# CURIA CHAT CONFIGURATION
##################################################################################################################119:#

CURIA_USER		${curia_user}
CURIA_GROUP		${curia_group}
CURIA_ROOT              ${curia_root}
CURIA_DOMAIN		${curia_domain}

SSL_PUBLIC_KEY_FILE	/etc/letsencrypt/live/${curia_domain}/cert.pem
SSL_PRIVATE_KEY_FILE	/etc/letsencrypt/live/${curia_domain}/privkey.pem

HTTPS_DOCUMENT_ROOT     ${curia_root}/client
HTTPS_PORT		${https_port}

TURN_SERVER_DOMAIN	${curia_domain}
TURN_SERVER_PORT	${turn_port}
TURN_LEASE_TIME		3600
TURN_ALGORITHM		sha1
TURN_USER_NAME		curia
TURN_SECRET_KEY		0x00000000000000000000000000000000
TURN_STATIC_SECRET	MY_STATIC_SECRET

EMAIL_SENDER_NAME	${curia_email}
EMAIL_SMTP_HOST		${smtp_host}
EMAIL_SMPT_PORT		${smtp_port}
EMAIL_SMTP_SECURE	false
EMAIL_SMPT_AUTH_USER	${smtp_auth_user}
EMAIL_SMPT_AUTH_PASS	${smtp_auth_pass}

NOTIFY_OWNER_ENABLED	false
NOTIFY_OWNER_DOMAIN	MY_HOME_SERVER.COM
NOTIFY_OWNER_PATH	/NOTIFY_ME.php

#EOF
EOF
}


##################################################################################################################119:#
# PARSE CONFIG FILE - Gather settings from  curia_chat.conf
##################################################################################################################119:#

function parse_config_file () {
	test -f ./secrets/curia_chat.conf && export config_file_name=./curia_chat.conf
	#test -f ./secrets/curia_chat.conf && export config_file_name=./secrets/curia_chat.conf
	#test -f /etc/curia_chat.conf && export config_file_name=/etc/curia_chat.conf

	while read -r key value; do
		[[ $key == \#* ]] && continue;
		[[ $key == '' ]] && continue;
		export "$key=$value"
	done < $config_file_name
}


##################################################################################################################119:#
#
#   M A I N   P R O G R A M
#
##################################################################################################################119:#

current_host=$(hostname)
script_name=$(basename $0)

description=${actions["$1"]}
case "$1" in
	"")
		action=1
		;;
	*)
		action=$1

		if [ "$description" == "UNDEFINED" ] ; then
			echo "Unknown parameter '$1'"
			exit
		fi
esac



step="STEP $action: ${actions[$action]}"

echo -e "$color_normal.------------------------------------------------------------------------------"
if [ "$action" == "1" ] ; then
	echo "| CURIA SERVER SETUP"
fi
if [ "$description" == "" ] ; then
	echo "'------------------------------------------------------------------------------"
	list_steps
	exit
else
	echo "| $step"
	if [ "$action" == "1" ] ; then
		echo "|------------------------------------------------------------------------------"
		echo "| Host name: $current_host"
		echo "| SSH login: ssh -p $port $user@$server"
	fi
	echo "'------------------------------------------------------------------------------"
fi



case $action in
	1)
		echo "Check the values above and adjust the variables in this script as needed."
		echo
		echo "Then call"
		echo "  $script_name 2          to continue with the next step"
		echo
		echo "Alternatively,"
		echo "  $script_name <number>   to execute a specific step at your will"
		echo
		list_steps
		;;

	2)
		echo "Confirm commands by pressing Return or press CTRL+C to abort."
		confirm "scp -P $port $0 $user@$server:~"
		next_step
		;;
	3)
		confirm "ssh -t -p $port $user@$server \"echo -e '\\n\${color_blue}You are now logged in to $server\${color_normal}\\n'; ./$script_name 4\""
		;;
	4)
		confirm "su -c \"cp $script_name ~; cd; ./$script_name 5\""
		;;
	5)
		confirm "apt update && apt upgrade"
		next_step
		;;
	6)
		confirm "apt install git nodejs npm certbot coturn"
		next_step
		;;
	7)
		answer=""
		while [ "$answer" != 'y' ] ; do
			echo -e "Press enter to keep the values:"
			input "server user ($color_blue$curia_user$color_normal): " "$curia_user"
			new_user=$input_text

			input "server group ($color_blue$curia_group$color_normal): " "$curia_group"
			new_group=$input_text

			input "Server directory ($color_blue$curia_root$color_normal): " "$curia_root"
			new_curia_root=$input_text

			input "Server domain ($color_blue$curia_domain$color_normal): " "$curia_domain"
			new_curia_domain=$input_text

			input "HTTPS port ($color_blue$https_port$color_normal): " "$https_port"
			new_https_port=$input_text

			input "TURN port ($color_blue$turn_port$color_normal): " "$turn_port"
			new_turn_port=$input_text

			input "Curia email address ($color_blue$curia_email$color_normal): " "$curia_email"
			new_email=$input_text

			input "SMTP host ($color_blue$smtp_host$color_normal): " "$smtp_host"
			new_smtp_host=$input_text

			input "SMTP port ($color_blue$smtp_port$color_normal): " "$smtp_port"
			new_smtp_port=$input_text

			input "SMTP auth user ($color_blue$smtp_auth_user$color_normal): " "$smtp_auth_user"
			new_smtp_user=$input_text

			input "SMTP password ($color_blue$smtp_auth_pass$color_normal): " "$smtp_auth_pass"
			new_smtp_pass=$input_text

			echo
			echo "You chose the following settings:"
			echo "  Server user:      $new_user"
			echo "  Server group:     $new_group"
			echo "  Curia directory:  $new_curia_root"
			echo "  Curia domain:     $new_curia_domain"
			echo "  HTTPS port:       $new_https_port"
			echo "  TURN port:        $new_turn_port"
			echo "  Curia email:      $new_email"
			echo "  SMTP host:        $new_smtp_host"
			echo "  SMTP port:        $new_smtp_port"
			echo "  SMTP login:       $new_smtp_user"
			echo "  SMTP password:    $new_smtp_pass"
			echo

			answer=""
			while [ "$answer" != 'y' ] && [ "$answer" != 'n' ] ; do
				read -p "Accept these values? (y/n) " answer
			done
		done

		curia_user=$new_user
		curia_group=$new_group
		curia_root=$new_curia_root
		curia_domain=$new_curia_domain
		https_port=$new_https_port
		turn_port=$new_turn_port
		curia_email=$new_email
		smtp_host=$new_smtp_host
		smtp_port=$new_smtp_port
		smtp_auth_user=$new_smtp_user
		smtp_auth_pass=$new_smtp_pass

		confirm "create_config_file $config_file_name"

		echo -en $color_blue
		cat $config_file_name
		echo -en $color_normal

		next_step
		;;
	8)
		parse_config_file
		confirm "mkdir -p $CURIA_ROOT"
		next_step
		;;
	9)
		parse_config_file
		#confirm "adduser --no-create-home --disabled-password --disabled-login $curia_user"
		confirm "adduser --home=$CURIA_ROOT/home $CURIA_USER"
		next_step
		;;
	10)
		parse_config_file
		certbot certonly --dry-run --standalone --preferred-challenges http -d $CURIA_DOMAIN
		next_step
		;;
	11)
		;;
	*)
		echo "Unknown option: $@"
esac