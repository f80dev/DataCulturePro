# build_dev.sh
#!/usr/bin/env bash
DJANGO_SETTINGS_MODULE=alumni.settings.dev
DJANGO_SECRET_KEY="42714271"
DATABASE_NAME=myproject
DATABASE_USER=myproject
DATABASE_PASSWORD="change-this-too"
PIP_REQUIREMENTS=dev.txt
docker-compose up --detach --build