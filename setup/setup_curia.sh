#!/bin/bash
##################################################################################################################119:#
#
#   CURIA CHAT SETUP HELPER
#
###################################################################################################################119:#
#
#   This script will install Curia Chat on your Debian server.
#   You can download it to your local machine and start it from there (it will log in to your server):
#
#       me@home:~ $ ./setup_curia.sh
#
#   You can also store it on your server, in which case you will have to start it from step 4:
#
#       me@server $ ./setup_curia.sh 4
#
##################################################################################################################119:#


##################################################################################################################119:#
#
#   S E T T I N G S   -   A D J U S T   T H E S E   T O   Y O U R   N E E D S
#
##################################################################################################################119:#

#
# If you start with step 1 (from your local machine), the following settings will be used:
#
server=YOUR.SERVER.COM
port=22
user=YOUR_USER_NAME

#
# Whether to use colored output
#
use_ansi_colors=true


##################################################################################################################119:#
#
#   S C R I P T   I N I T I A L I Z A T I O N
#
##################################################################################################################119:#

#
# File names
#
curia_config_file=/etc/curia_chat.conf
coturn_config_file=/etc/turnserver.conf
coturn_default_file=/etc/default/coturn

#
# Other names
#
curia_service_name=curia_chat.service
curia_log_dir=/var/log/curia
curia_repository=https://github.com/hwirth/curia_chat

#
# /etc/curia_chat.conf settings
#
CURIA_USER="curia"
CURIA_GROUP="curia"
CURIA_ROOT="/srv/curia"
CURIA_DOMAIN=YOUR.SERVER.COM
HTTPS_PORT=443
TURN_PORT=8001
TURN_USER_PASSWORD=$(openssl rand -hex 32)
TURN_STATIC_SECRET=$(openssl rand -hex 32)
EMAIL_SENDER_NAME=CURIA@MAILPROVIDER.COM
SMTP_HOST=SMTP.MAILPROVIDER.COM
SMTP_PORT=587
SMTP_AUTH_USER=CURIA@MAILPROVIDER.COM
SMTP_AUTH_PASS=SMTP_PASSWORD

#
# Install steps
#
actions=(
	"UNDEFINED"\
	"Verify the script's configuraion (if on your local computer)"\
	"Upload the install script to the server"\
	"Log in to the server and continue the setup process there"\
	"Switch to root account"\
	"Update the server's operating system"\
	"Install required packages"\
	"Create configuration files"\
	"Create coturn user"\
	"Create curia server user"\
	"Create directory structure"\
	"Create letsencrypt SSL keys"\
	"Upgrade npm"\
	"Clone Curia GIT repository"\
	"Install node modules"\
	"Create client config file (config.json)"\
	"Start server for the first time (Create admin account)"\
	"Create systemd service file"\
	"Enable and start systemd services"\
	"Clean up"\
	"Done!"\
)

#
# Nice output
#
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
# INPUT - Print a question and let the user type an answer
##################################################################################################################119:#

function input () {
	echo -en "$1"
	read input_text

	[ "$input_text" == "" ] && input_text=$2

	export input_text
}


##################################################################################################################119:#
# CAT_HIGHLIGHTED - Show contents of a created file
##################################################################################################################119:#

function cat_highlighted () {
	echo "Contents of $1:"
	echo -en $blue
	cat $1
	echo -en $normal
}


##################################################################################################################119:#
#
#   C R E A T E   F I L E S
#
##################################################################################################################119:#


##################################################################################################################119:#
# /etc/curia_chat.conf
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
# /srv/curia/client/config.json
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
# /etc/systemd/system/curia_chat.service
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
# /etc/turnserver.conf
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
# /etc/default/coturn
##################################################################################################################119:#

function create_coturn_default_file () {
	cat << EOF > $1
TURNSERVER_ENABLED=1
EOF
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
# Show overwiew (current step/help)
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
		echo "| You are logged in at: $current_host"
		echo "| Step 2 SSH command:   ssh -p $port $user@$server"
	fi
	echo "'------------------------------------------------------------------------------"
fi

#
# If the file already exists, import settings from  /etc/curia_chat.conf
#
if [ "$(whoami)" == "root" ] ; then
	if [ -f $curia_config_file ] ; then
		while read -r key value; do
			[[ $key == \#* ]] && continue;
			[[ $key == '' ]] && continue;
			export "$key=$value"
		done < $curia_config_file
	fi
fi

#
# Execute selected step
#
case $action in
	1)
		echo "Check the values above and adjust the variables in this script as needed."
		echo
		echo "Then call"
		echo "  $script_name 2          to continue with the next step (when on your local computer)"
		echo
		echo "If you are already logged in on your server (not as root!):"
		echo "  $script_name 4          to continue with the next step (when logged in to your server)"
		echo
		echo "Alternatively,"
		echo "  $script_name <number>   to execute a specific step at your will"
		echo
		list_steps
		exit
		;;

	2)
		echo "Confirm commands by pressing Return or press CTRL+C to abort."
		confirm "scp -P $port $0 $user@$server:~"
		;;
	3)
		confirm "ssh -t -p $port $user@$server \"echo -e '\\n\${blue}You are now logged in to $server\${normal}\\n'; ./$script_name 4\""
		exit
		;;
	4)
		confirm "su -c \"mv $script_name ~; cd; ./$script_name 5\""
		exit
		;;
	5)
		confirm "apt update && apt upgrade"
		;;
	6)
		confirm "apt install git nodejs npm certbot coturn"
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

		confirm "create_coturn_config_file /etc/turnserver.conf"
		cat_highlighted "/etc/turnserver.conf"

		confirm "create_coturn_default_file $coturn_default_file"
		cat_highlighted $coturn_default_file
		;;
	8)
		confirm "turnadmin -a -u curia -r ${CURIA_DOMAIN} -p ${TURN_USER_PASSWORD}"
		;;
	9)
		confirm "addgroup curia"
		confirm "adduser --system --shell=/bin/sh --disabled-password --home=$CURIA_ROOT --no-create-home --ingroup $CURIA_GROUP $CURIA_USER"
		#confirm "adduser --home=$CURIA_ROOT/home $CURIA_USER"
		#confirm "adduser --no-create-home --disabled-password --disabled-login $CURIA_USER"
		#confirm "adduser --system --no-create-home --group $CURIA_USER"
		;;
	10)
		confirm "mkdir -p $curia_log_dir; chown $CURIA_USER:$CURIA_GROUP $curia_log_dir"
		;;
	11)
		#confirm "certbot certonly --dry-run --standalone --preferred-challenges http -d $CURIA_DOMAIN"
		confirm "certbot certonly --standalone --preferred-challenges http -d $CURIA_DOMAIN"
		;;
	12)
		confirm "npm install npm@latest -g"
		;;
	13)
		#confirm "su $CURIA_USER -c \"cd $CURIA_ROOT; git clone $curia_repository; mv curia_chat/* .; rm -rf curia_chat\""
		confirm "su $CURIA_USER -c \"cd $CURIA_ROOT; git clone $curia_repository .\""
		;;
	14)
		confirm "su $CURIA_USER -c \"cd $CURIA_ROOT/server; npm install\""
		;;
	15)
		confirm "create_client_config_json ${CURIA_ROOT}/client/config.json"
		cat_highlighted "${CURIA_ROOT}/client/config.json"
		;;
	16)
		confirm "cd $CURIA_ROOT/server; node main.js --first-run"
		;;
	17)
		confirm "create_systemd_service_file /etc/systemd/system/$curia_service_name"
		cat_highlighted /etc/systemd/system/$curia_service_name
		;;
	18)
		confirm "systemctl enable coturn"
		confirm "systemctl enable $curia_service_name"
		confirm "systemctl start coturn"
		confirm "systemctl status coturn"
		confirm "systemctl start $curia_service_name"
		confirm "systemctl status $curia_service_name"
		next_step
		;;
	19)
		confirm "rm $script_name"
		;;
	20)
		# Done!
		exit
		;;
	*)
		echo "Unknown option: $@"
		exit
esac

next_step


#EOF