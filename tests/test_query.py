import base64

import pytest
from rest_framework.test import APIClient

from OpenAlumni.Batch import importer_file, profils_importer
from OpenAlumni.Tools import log
from alumni.models import Profil
from tests.test_api import call_api

NB_RECORDS=50

@pytest.fixture
def server():
	return APIClient()


@pytest.fixture()
@pytest.mark.django_db
def db(limit=NB_RECORDS):
	filename="spip_anciens.xlsx"
	rows,n_records=importer_file(filename)
	rc=profils_importer(rows,limit)
	assert rc is not None
	profils=test_count_profils(limit)
	for p in profils.all():
		log("Profil "+str(p)+" chargé")


@pytest.mark.django_db
def test_count_profils(db,min=NB_RECORDS):
	profils=Profil.objects
	assert profils.count()>=min, "La base ne doit pas être vide"
	return profils.all()


@pytest.mark.django_db
def test_query(db,server,queries=["search=montage","search=bozon","firstname=agnès","promo=1997","firstname__contains=agn"]):
	"""
	conception des requetes voir
	:param db:
	:param server:
	:param queries:
	:return:
	"""
	for query in queries:
		log("Execution de la requete "+query)
		rc=call_api(server,"profilsdoc",query)
		assert rc["count"]>0,"Réponse vide anormale"
		assert rc["count"]<NB_RECORDS,"Le filtre n'a pas fonctionné"



