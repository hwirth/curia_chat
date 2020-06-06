<?php
	$command = 'wget -qO- orf.at';
	exec( $command, $result, $return_value );
	foreach ($result as $line) echo "$line\n";