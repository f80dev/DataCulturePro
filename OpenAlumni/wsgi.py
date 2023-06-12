"""
WSGI config for OpenAlumni project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

from OpenAlumni import settings, settings_dev
from OpenAlumni.Tools import log

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'OpenAlumni.settings')

application = get_wsgi_application()

log("Environnement server : "+str(os.environ._data))
log("Settings appliqués : "+str(os.environ._data["DJANGO_SETTINGS_MODULE"]))

if str(os.environ._data["DJANGO_SETTINGS_MODULE"])=="OpenAlumni.settings_dev":
	sets=settings_dev.__dict__
else:
	sets=settings.__dict__
log("Environnement django "+str(sets).replace(",","\n"))
log("Base de données="+str(sets["DATABASES"]).replace(",","\n"))
log("Elasticsearch="+str(sets["ELASTICSEARCH_DSL"]).replace(",","\n"))
