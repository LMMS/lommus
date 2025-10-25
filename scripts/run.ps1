pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 1M
pm2 set pm2-logrotate:retain 2
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '1d'

pm2 start lommus.js --name LoMMuS `
	--node-args="--enable-source-maps --trace-warnings --trace-deprecation"
