#/bin/bash


function do_as_su()
{
	user=curia
	group=curia

	find . -exec chown $user:$group {} \;
	find . -type f -exec chmod 0660 {} \;
	find . -type d -exec chmod 0770 {} \;
	find . -name *.sh -exec chmod 0770 {} \;
}

if [ "$(whoami)" = "root" ] ; then
	do_as_su
else
	DECL=$(declare -f do_as_su)
	sudo bash -c "$DECL; do_as_su"
fi
