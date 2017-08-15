if [ "$USE_CONFIG_DIR" = true ]
then
	converjon --config-dir /etc/converjon/config
else
	converjon --config /etc/converjon/config.yml
fi