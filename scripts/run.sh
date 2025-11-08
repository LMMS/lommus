#!/bin/bash

pm2 install pm2-logrotate

pm2 set pm2-logrotate:max_size 1M
pm2 set pm2-logrotate:retain 2
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'

pm2 restart pm2-logrotate

pm2 start lorem.js \
  --name="Lorem" \
  --node-args="--enable-source-maps --trace-warnings --trace-deprecation" \
  --stop-exit-codes=0
