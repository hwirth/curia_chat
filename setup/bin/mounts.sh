#!/bin/bash

tab="[52G"
awkcmd="{ print \$1\"$tab\"\$3 }"

mount	\
	| grep -v	\
		-e proc		\
		-e sysfs	\
		-e tmpfs	\
		-e cgroup	\
		-e devpts	\
		-e pstore	\
		-e securityfs	\
		-e bpf		\
		-e mqueu	\
		-e debugfs	\
		-e hugetlbfs	\
		-e configfs	\
		-e fusectl	\
		-e gvfsd-fuse	\
	| awk "$awkcmd"


