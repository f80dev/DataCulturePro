import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from OpenAlumni.Batch import importer_file, profils_importer, create_article
from OpenAlumni.Tools import log
from alumni.models import Profil, PieceOfWork, Article, ExtraUser
from tests.test_api import call_api

NB_RECORDS=50

@pytest.fixture
def server():
	return APIClient()


@pytest.mark.django_db
def init_db(limit=NB_RECORDS,filename="spip_anciens.xlsx",add_new_profil=False):
	if ExtraUser.objects.count()==0:
		user=User.objects.create_user("hhoareau","hhoareau@gmail.com","hh")
		user.save()

	profil_before=Profil.objects.all().count()
	if profil_before==0 or add_new_profil:
		rows,n_records=importer_file(filename)
		rc=profils_importer(rows,limit)
		assert rc is not None
		assert rc[0]==limit+profil_before

	profils=test_get_profils(limit)
	for p in profils:
		log("Profil "+str(p)+" chargé")

	return profils






@pytest.mark.django_db
def test_add_article():
	init_db()
	profil=Profil.objects.all()[0]

	articles_before=Article.objects.count()
	owner=User.objects.all()[0]
	create_article("new_profil",owner=owner,profil=profil)
	articles_after=Article.objects.count()
	assert articles_after==articles_before+1



@pytest.mark.django_db
def test_get_profils(db,min=NB_RECORDS) -> [Profil]:
	profils=Profil.objects
	assert profils.count()>=min, "La base ne doit pas être vide"
	return list(profils.all())


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



