#!/bin/sh
while true
do
	node lommus.js
        echo "Ctrl^C to terminate!"
        echo "Coming back in:"
        for i in 1
        do
                echo "$i"
                sleep 1
        done
        echo "Restarting"
done
