bunx pm2 install pm2-logrotate
bunx pm2 set pm2-logrotate:max_size 1M
bunx pm2 set pm2-logrotate:retain 2
bunx pm2 set pm2-logrotate:compress true
bunx pm2 set pm2-logrotate:rotateInterval '0 0 * * *' # At 00:00, every day

bunx pm2 restart pm2-logrotate

bunx pm2 start lommus.ts `
	--name="LoMMuS" `
	--node-args="--enable-source-maps --trace-warnings --trace-deprecation" `
	--stop-exit-codes=0
