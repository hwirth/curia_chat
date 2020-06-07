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

curia_config_file=/etc/curia_chat.conf
coturn_config_file=/etc/turnserver.conf
coturn_default_file=/etc/default/coturn

curia_service_name=curia_chat.service
curia_log_dir=/var/log/curia
curia_repository=https://github.com/hwirth/curia_chat/

CURIA_USER="curia"
CURIA_GROUP="curia"
CURIA_ROOT="/srv/curia"
CURIA_DOMAIN=YOUR.DOMAIN.COM
HTTPS_PORT=443
TURN_PORT=8001
TURN_USER_PASSWORD=$(openssl rand -hex 32)
TURN_STATIC_SECRET=$(openssl rand -hex 32)
EMAIL_SENDER_NAME=CURIA@MAILPROVIDER.COM
SMTP_HOST=SMTP.MAILPROVIDER.COM
SMTP_PORT=587
SMTP_AUTH_USER=CURIA@MAILPROVIDER.COM
SMTP_AUTH_PASS=SMTP_PASSWORD

actions=(
	"UNDEFINED"\
	"Verify the script's configuraion"\
	"Upload the install script to the server"\
	"Log in to the server and continue the setup process there"\
	"Switch to root account"\
	"Update the server's operating system"\
	"Install required packages"\
	"Create configuration files"\
	"Create coturn user"\
	"Create directory structure"\
	"Create user for curia server"\
	"Create letsencrypt SSL keys"\
	"Upgrade npm"\
	"Clone Curia GIT repository"\
	"Install node modules"\
	"Start server for the first time"\
	"Create systemd service file"\
	"Enable systemd service"\
	"Done!"\
)

if [ "$use_ansi_colors" == "true" ] ; then
	red="\e[1;31m"
	green="\e[1;32m"
	blue="\e[1;34m"
	yellow="\e[1;33m"
	bright="\e[1;37m"
	normal="\e[0;37m"
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
		prompt=$red
	else
		prompt=$green
	fi

	prompt="${prompt}$(whoami)@$(hostname)${normal}"

	if [ "$(whoami)" == "root" ] ; then
		prompt="$prompt # "
	else
		prompt="$prompt \$ "
	fi

	command=$1


	answer=""
	while [ "$answer" != "y" ] && [ "$answer" != "n" ] ; do
		echo -en "${yellow}> ${prompt}${yellow}${command}${normal} (y/n=skip) "
		read answer
	done

	if [ "$answer" == "y" ] ; then
		eval $command

		error_code=$?
		if [ "$error_code" != "0" ] ; then
			exit $error_code
		fi
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
# CAT_HIGHLIGHTED
##################################################################################################################119:#

function cat_highlighted () {
	echo "Contents of $1:"
	echo -en $blue
	cat $1
	echo -en $normal
}


##################################################################################################################119:#
# CREATE CURIA CONFIG FILE
##################################################################################################################119:#

function create_curia_config_file () {
	cat << EOF > $1
# $1
##################################################################################################################119:#
# CURIA CHAT CONFIGURATION
##################################################################################################################119:#

CURIA_USER		${CURIA_USER}
CURIA_GROUP		${CURIA_GROUP}
CURIA_ROOT              ${CURIA_ROOT}
CURIA_DOMAIN		${CURIA_DOMAIN}

LOG_TO_FILE		true
LOG_TO_CONSOLE		true

SSL_PUBLIC_KEY_FILE	/etc/letsencrypt/live/${CURIA_DOMAIN}/cert.pem
SSL_PRIVATE_KEY_FILE	/etc/letsencrypt/live/${CURIA_DOMAIN}/privkey.pem

HTTPS_PORT		${HTTPS_PORT}

TURN_DOMAIN		${CURIA_DOMAIN}
TURN_PORT		${TURN_PORT}
TURN_LEASE_TIME		3600
TURN_ALGORITHM		sha1
TURN_USER_NAME		curia
TURN_USER_PASSWORD	${TURN_USER_PASSWORD}
TURN_STATIC_SECRET	${TURN_STATIC_SECRET}

EMAIL_SENDER_NAME	${EMAIL_SENDER_NAME}
SMTP_HOST		${SMTP_HOST}
SMPT_PORT		${SMTP_PORT}
SMTP_SECURE		false
SMTP_AUTH_USER		${SMTP_AUTH_USER}
SMTP_AUTH_PASS		${SMTP_AUTH_PASS}

NOTIFY_OWNER_ENABLED	false
NOTIFY_OWNER_DOMAIN	MY_HOME_SERVER.COM
NOTIFY_OWNER_PATH	/NOTIFY_ME.php

#EOF
EOF
}


##################################################################################################################119:#
# CREATE CLIENT CONFIG JSON
##################################################################################################################119:#

function create_client_config_json () {
	cat << EOF > $1
{
	"webSocketPort": ${HTTPS_PORT}
}
EOF
	chown $CURIA_USER:$CURIA_GROUP $1
}


##################################################################################################################119:#
# CREATE SYSTEMD SERCVICE FILE
##################################################################################################################119:#

function create_systemd_service_file () {
	cat << EOF > $1
[Unit]
Description=Curia Chat Server

[Service]
ExecStart=${CURIA_ROOT}/server/start_server.sh
Type=simple

[Install]
WantedBy=network.target
EOF
}


##################################################################################################################119:#
# CREATE COTURN CONFIG FILE
##################################################################################################################119:#

function create_coturn_config_file () {
	mv $1 $1.ORIG

	cat << EOF >> $1
listening-port=${TURN_PORT}
#tls-listening-port=${TURN_PORT}
fingerprint
use-auth-secret
static-auth-secret=${TURN_STATIC_SECRET}
cert=${SSL_PUBLIC_KEY_FILE}
pkey=${SSL_PRIVATE_KEY_FILE}
#total-quota=100
#stale-nonce=600
server-name=${CURIA_DOMAIN}
realm=${CURIA_DOMAIN}
proc-user=turnserver
proc-group=turnserver
EOF
}


##################################################################################################################119:#
# CREATE COTURN DEFAULT FILE
##################################################################################################################119:#

function create_coturn_default_file () {
	cat << EOF > $1
TURNSERVER_ENABLED=1
EOF
}


##################################################################################################################119:#
# PARSE CONFIG FILE - Gather settings from  curia_chat.conf
##################################################################################################################119:#

function parse_config_file () {
	if [ -f $curia_config_file ] ; then
		while read -r key value; do
			[[ $key == \#* ]] && continue;
			[[ $key == '' ]] && continue;
			export "$key=$value"
		done < $curia_config_file
	fi
}


##################################################################################################################119:#
#
#   M A I N   P R O G R A M
#
##################################################################################################################119:#

current_host=$(hostname)
script_name=$(basename $0)

#
# Find out, which step to execute
#
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

#
# Show overwiew
#
echo -e "$normal.------------------------------------------------------------------------------"
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

#
# Try to read /etc/curia_chat.conf
#
parse_config_file

#
# Execute selected step
#
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
		confirm "ssh -t -p $port $user@$server \"echo -e '\\n\${blue}You are now logged in to $server\${normal}\\n'; ./$script_name 4\""
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
			input "server user ($blue$CURIA_USER$normal): " "$CURIA_USER"
			new_curia_user=$input_text

			input "server group ($blue$CURIA_GROUP$normal): " "$CURIA_GROUP"
			new_curia_group=$input_text

			input "Server directory ($blue$CURIA_ROOT$normal): " "$CURIA_ROOT"
			new_curia_root=$input_text

			input "Server domain ($blue$CURIA_DOMAIN$normal): " "$CURIA_DOMAIN"
			new_curia_domain=$input_text

			input "HTTPS port ($blue$HTTPS_PORT$normal): " "$HTTPS_PORT"
			new_https_port=$input_text

			input "TURN port ($blue$TURN_PORT$normal): " "$TURN_PORT"
			new_turn_port=$input_text

			input "TURN user password ($blue$TURN_USER_PASSWORD$normal): " "$TURN_USER_PASSWORD"
			new_turn_user_password=$input_text

			input "Curia email address ($blue$EMAIL_SENDER_NAME$normal): " "$EMAIL_SENDER_NAME"
			new_email_sender_name=$input_text

			input "SMTP host ($blue$SMTP_HOST$normal): " "$SMTP_HOST"
			new_smtp_host=$input_text

			input "SMTP port ($blue$SMTP_PORT$normal): " "$SMTP_PORT"
			new_smtp_port=$input_text

			input "SMTP auth user ($blue$SMTP_AUTH_USER$normal): " "$SMTP_AUTH_USER"
			new_smtp_user=$input_text

			input "SMTP password ($blue$SMTP_AUTH_PASS$normal): " "$SMTP_AUTH_PASS"
			new_smtp_pass=$input_text

			echo
			echo "You chose the following settings:"
			echo "  Server user:      $new_curia_user"
			echo "  Server group:     $new_curia_group"
			echo "  Curia directory:  $new_curia_root"
			echo "  Curia domain:     $new_curia_domain"
			echo "  HTTPS port:       $new_https_port"
			echo "  TURN port:        $new_turn_port"
			echo "  TURN user passwd: $new_turn_user_password"
			echo "  Curia email:      $new_email_sender_name"
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

		CURIA_USER=$new_curia_user
		CURIA_GROUP=$new_curia_group
		CURIA_ROOT=$new_curia_root
		CURIA_DOMAIN=$new_curia_domain
		HTTPS_PORT=$new_https_port
		TURN_PORT=$new_turn_port
		TURN_USER_PASSWORD=$new_turn_user_password
		EMAIL_SENDER_NAME=$new_email_sender_name
		SMTP_HOST=$new_smtp_host
		SMTP_PORT=$new_smtp_port
		SMTP_AUTH_USER=$new_smtp_user
		SMTP_AUTH_PASS=$new_smtp_pass

		confirm "create_curia_config_file $curia_config_file"
		cat_highlighted "$curia_config_file"

		confirm "create_client_config_json ${CURIA_ROOT}/client/config.json"
		cat_highlighted "${CURIA_ROOT}/client/config.json"

		confirm "create_coturn_config_file /etc/turnserver.conf"
		cat_highlighted "/etc/turnserver.conf"

		confirm "create_coturn_default_file $coturn_default_file"
		cat_highlighted $coturn_default_file

		next_step
		;;
	8)
		confirm "turnadmin -a -u curia -r ${CURIA_DOMAIN} -p ${TURN_USER_PASSWORD}"
		next_step
		;;
	9)
		confirm "mkdir -p $CURIA_ROOT; chown $CURIA_USER:$CURIA_GROUP $CURIA_ROOT"
		confirm "mkdir -p $curia_log_dir; chown $CURIA_USER:$CURIA_GROUP $curia_log_dir"
		next_step
		;;
	10)
		confirm "adduser --no-create-home --disabled-password --disabled-login $CURIA_USER"
		#confirm "adduser --home=$CURIA_ROOT/home $CURIA_USER"
		next_step
		;;
	11)
		#confirm "certbot certonly --dry-run --standalone --preferred-challenges http -d $CURIA_DOMAIN"
		confirm "certbot certonly --standalone --preferred-challenges http -d $CURIA_DOMAIN"
		next_step
		;;
	12)
		confirm "npm install npm@latest -g"
		next_step
		;;
	13)
		confirm "su $CURIA_USER -c \"cd $CURIA_ROOT; git clone $curia_repository; mv curia_chat/* .; rm -rf curia_chat\""
		next_step
		;;
	14)
		confirm "su $CURIA_USER -c \"cd $CURIA_ROOT/server; npm install\""
		next_step
		;;
	15)
		confirm "cd $CURIA_ROOT/server; node main.js --first-run"
		next_step
		;;
	16)
		confirm "create_systemd_service_file /etc/systemd/system/$curia_service_name"
		cat_highlighted /etc/systemd/system/$curia_service_name
		next_step
		;;
	17)
		confirm "systemctl enable $curia_service_name"
		next_step
		;;
	18)
		# Done!
		;;
	*)
		echo "Unknown option: $@"
esac


#EOF