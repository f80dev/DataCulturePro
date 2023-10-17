#install docker : sudo curl -sSL get.docker.com | sh
#effacer toutes les images : docker rmi $(docker images -a -q)
#effacer tous les containers : docker rm  $(docker ps -a -f status=exited -q) / podman rm  $(podman ps -a -f status=exited -q)

#Renouvellement des certificats
#Pour le server F80: certbot certonly --standalone --email hhoareau@gmail.com -d api.f80.fr && cp /etc/letsencrypt/live/api.f80.fr/* /root/certs_dataculture


FROM python:3.11

#prod
#fabrication: docker build -t f80hub/openalumni . & docker push f80hub/openalumni:latest
#installation: docker rm -f openalumni && docker pull f80hub/openalumni:latest && docker run --restart=always -v /root/certs_dataculture:/certs -p 8000:8000 --name openalumni --env DJANGO_SETTINGS_MODULE=OpenAlumni.settings -d f80hub/openalumni:latest



# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

#RUN apk update && apk add postgresql-dev gcc python3-dev musl-dev libxml2-dev libxslt-dev

RUN apt-get install libpq-dev

RUN pip3 install Django==4.2.6
RUN pip3 install markdown
RUN pip3 install django-oauth-toolkit
RUN pip3 install oauthlib
RUN pip3 install requests
RUN pip3 install selenium
RUN pip3 install djangorestframework
RUN pip3 install django-cors-headers
RUN pip3 install psycopg2
RUN pip3 install elasticsearch_dsl
RUN pip3 install django-sslserver
RUN pip3 install django-elasticsearch-dsl
RUN pip3 install django-elasticsearch-dsl-drf
RUN pip3 install python-linkedin-v2
RUN pip3 install graphene-django
RUN pip3 install PyYAML
RUN pip3 install django-filter
RUN pip3 install PyPDF2
RUN pip3 install wikipedia
RUN pip3 install rsa
RUN pip3 install html5lib
RUN pip3 install wheel
RUN pip3 install imdbpy
RUN pip3 install djangorestframework-csv
RUN pip3 install djangorestframework-xml
RUN pip3 install dict2xml
RUN pip3 install django-dbbackup
RUN pip3 install django-filter
RUN pip3 install numpy
RUN pip3 install pandas
RUN pip3 install xlsxwriter
RUN pip3 install docutils
RUN pip3 install networkx
RUN pip3 install py7zr
RUN pip3 install multiversx-sdk-core
RUN pip3 install multiversx-sdk-wallet
RUN pip3 install multiversx-sdk-network-providers
RUN pip3 install pandasql
RUN pip3 install plotly
RUN pip3 install jellyfish
RUN pip3 install PyGithub
RUN pip3 install openpyxl
RUN pip3 install django-archive
RUN pip3 install scipy
RUN pip3 install pymongo
RUN pip3 install Levenshtein

ENV APP_HOME=/home/app
RUN mkdir $APP_HOME
RUN mkdir $APP_HOME/staticfiles
RUN mkdir $APP_HOME/mediafiles
RUN mkdir $APP_HOME/Temp
RUN mkdir $APP_HOME/dbbackup
RUN mkdir $APP_HOME/Temp/imdb_files

WORKDIR $APP_HOME
COPY ./static $APP_HOME/static
COPY ./OpenAlumni $APP_HOME/OpenAlumni
COPY ./alumni $APP_HOME/alumni
COPY ./manage.py $APP_HOME
#COPY ./Temp $APP_HOME/Temp on ne fait pas la copie sur le serveur


# chown all the files to the app user
#RUN addgroup -S app && adduser -S app -G app
#RUN chown -R app:app $APP_HOME
#USER app

EXPOSE 8000

ENV DJANGO_SETTINGS_MODULE=OpenAlumni.settings
ENV DEBUG=False


CMD ["python3", "manage.py", "runsslserver","--certificate","/certs/cert.pem","--key","/certs/privkey.pem","0.0.0.0:8000"]


