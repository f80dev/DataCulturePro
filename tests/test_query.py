import pytest
from django.contrib.auth.models import User
from django.contrib.sites import management
from rest_framework.test import APIClient

from OpenAlumni.Batch import importer_file, profils_importer, create_article, add_pows_to_profil, reindex, exec_batch
from OpenAlumni.Tools import log, index_string
from alumni.models import Profil, PieceOfWork, Article, ExtraUser, Award
from alumni.views import rebuild_index
from tests.test_api import call_api
from tests.test_scrapping import test_extract_profil

NB_RECORDS=15
IMPORT_PROFILS_FILE="spip_ancien_light.xlsx"

@pytest.fixture
def server():
	return APIClient()

@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
	with django_db_blocker.unblock():
		if ExtraUser.objects.count()==0:
			user=User.objects.create_user("hhoareau","hhoareau@gmail.com","hh")
			user.save()

		profil_before=Profil.objects.all().count()
		if profil_before==0:
			rows,n_records=importer_file(IMPORT_PROFILS_FILE)
			rc=profils_importer(rows,100)
			assert rc is not None
			assert rc[0]>profil_before


@pytest.mark.django_db
def test_import_profils(to_imports=[("spip_ancien_light.xlsx",7),("spip_anciens.xlsx",1694),("stagiaires FP 211001 jl.xlsx",2000)]):
	for file in to_imports:
		profil_before=Profil.objects.all().count()
		rows,n_records=importer_file(file[0])
		assert n_records<=file[1]
		assert n_records>0
		imported,non_imported=profils_importer(rows,limit=1000)
		assert imported>0
		assert not non_imported is None


@pytest.mark.django_db
def test_add_pow(lastname="ducournau",firstname="julia",nb_films=3,refresh_delay=3):
	query=Profil.objects.filter(name_index=index_string(firstname+lastname))
	assert query.count()>0
	rc=test_extract_profil(lastname,firstname,refresh_delay=refresh_delay)
	rc=add_pows_to_profil(query.first(),rc["links"],"",refresh_delay)
	assert not rc is None
	assert rc[0]==nb_films



@pytest.mark.django_db
def test_add_article():
	profil=Profil.objects.all()[0]

	articles_before=Article.objects.count()
	owner=User.objects.all()[0]
	create_article("new_profil",owner=owner,profil=profil)
	articles_after=Article.objects.count()
	assert articles_after==articles_before+1



@pytest.mark.django_db
def test_get_profils(db) -> [Profil]:
	profils=Profil.objects
	assert profils.count()>0, "La base ne doit pas être vide"
	return list(profils.all())



@pytest.mark.django_db
def test_reindex():
	reindex()


@pytest.mark.django_db
def test_query_profils(db,server,queries=["firstname__contains=jul","firstname__terms=julia__julien","search=department:montage","search=firstname:Julien&search=lastname:ducournau","search=Fromentin","search=Julien","promo=1995"]):
	"""
	conception des requetes voir
	https://django-elasticsearch-dsl-drf.readthedocs.io/en/0.11/filtering_usage_examples.html#search-a-single-term-on-specific-field
	remarque: le & fonctionne comme le "ou"

	:param db:
	:param server:
	:param queries:
	:return:
	"""
	max_responses=Profil.objects.count()
	for query in queries:
		log("Execution de la requete "+query)
		rc=call_api(server,"profilsdoc",query)
		assert rc["count"]>0,"Réponse vide anormale"
		assert rc["count"]<max_responses,"Le filtre n'a pas fonctionné"

@pytest.mark.django_db
def test_direct_query_awards(db,server,profils=["Julia ducournau"]):
	for profil in profils:
		_p=Profil.objects.filter(name_index__exact=index_string(profil)).first()
		rc=Award.objects.filter(profil_id=_p.id).count()
		assert rc>0




