"""
WSGI config for OpenAlumni project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

from OpenAlumni import settings, settings_dev
from OpenAlumni.Batch import bootloader
from OpenAlumni.Tools import log

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'OpenAlumni.settings')

log("Environnement server : "+str(os.environ._data))
sets=settings_dev.__dict__ if "DJANGO_SETTINGS_MODULE" in os.environ._data and str(os.environ._data["DJANGO_SETTINGS_MODULE"])=="OpenAlumni.settings_dev" else settings.__dict__
log("Environnement django "+str(sets).replace(",","\n"))
log("Base de données="+str(sets["DATABASES"]).replace(",","\n"))
log("Elasticsearch="+str(sets["ELASTICSEARCH_DSL"]).replace(",","\n"))

#if not "DEBUG" in os.environ._data or not os.environ._data["DEBUG"]: bootloader()

application = get_wsgi_application()


