import pytest
from django.contrib.auth.models import User
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from rest_framework.test import APIClient

from OpenAlumni.Batch import importer_file, profils_importer, create_article, add_pows_to_profil, reindex, raz
from OpenAlumni.Tools import log, index_string
from alumni.documents import ProfilDocument
from alumni.models import Profil, Article, ExtraUser, Award, PieceOfWork, Work, Festival

from tests.test_scrapping import test_extract_movies_from_profil, PROFILS

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

		for p in Profil.objects.all():
			log(str(p))

@pytest.mark.django_db
def test_raz():
	raz("all")
	assert Profil.objects.all().count()==0
	assert Work.objects.all().count()==0
	assert PieceOfWork.objects.all().count()==0
	assert Award.objects.all().count()==0
	assert Festival.objects.all().count()==0

@pytest.mark.django_db
def test_import_profils(to_imports=[("spip_ancien_light.xlsx",7),("spip_anciens.xlsx",1694),("stagiaires FP 211001 jl.xlsx",2000)],raz_before=True):
	if raz_before:test_raz()
	profil_before=Profil.objects.all().count()
	for file in to_imports:
		rows,n_records=importer_file(file[0])
		assert n_records<=file[1]
		assert n_records>0
		imported,non_imported=profils_importer(rows,limit=10)
		assert imported>0
		assert not non_imported is None
	profil_after=Profil.objects.all().count()
	assert profil_before<profil_after


@pytest.mark.django_db
def test_remove_pows_from_profil(profil_index=0):
	works=Work.objects.filter(profil__name_index=index_string(PROFILS[profil_index]["name"])).all()
	for w in works:
		powid=w.pow.id
		Work.objects.filter(id=w.id).delete()
		rc=PieceOfWork.objects.filter(id=powid).delete()
		assert not rc is None
		if rc[0]>0:
			assert rc[1]["alumni.Work"]==1
			assert rc[1]["alumni.PieceOfWork"]==1
	assert len(test_get_movies_for_profils(profil_index=profil_index))==0


@pytest.mark.django_db
def test_add_pows_to_profils(profil_index=0,refresh_delay=3):
	name_profil=index_string(PROFILS[profil_index]["name"])
	log("Chargement de "+name_profil)
	profils=Profil.objects.filter(name_index=name_profil)
	if profils.count()>0:
		movies=test_extract_movies_from_profil(PROFILS[profil_index], refresh_delay=refresh_delay)

		test_remove_pows_from_profil(profil_index)
		rc=add_pows_to_profil(profils.first(),movies["links"][:1],"",refresh_delay)
		assert not rc is None
		assert rc[0]>0
		assert rc[1]>0
	else:
		log("Profil "+name_profil+" n'est pas référencé dans la base")


@pytest.mark.django_db
def test_get_movies_for_profils(profil_index=0):
	works=Work.objects.filter(profil__name_index=index_string(PROFILS[profil_index]["name"])).all()
	movies=[]
	for w in works:
		if not w.pow.id in movies:movies.append(w.pow.id)
	return movies




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
def test_query_profils(db,server,queries=["firstname__contains=julia",
                                          "firstname__terms=julia__julien",
                                          "search=department:montage",
                                          "search=firstname:Julien&search=lastname:ducournau",
                                          "search=Fromentin",
                                          "search=Julien",
                                          "promo=1995"]):
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
	if max_responses>0:
		assert ProfilDocument.search().filter("term",firstname="julia").count()>0
		assert ProfilDocument.search().filter("term",lastname="ducournau").count()>0
		assert ProfilDocument.search().filter("contain",lastname="ducou").count()>0
		assert ProfilDocument.search().filter("term",degree_year="2011").count()>0
		assert ProfilDocument.search().filter("contain",email="free.fr").count()>0



	# for query in queries:
	# 	log("Execution de la requete "+query)


@pytest.mark.django_db
def test_direct_query_awards(db,server,profils=["Julia ducournau"]):
	for profil in profils:
		_p=Profil.objects.filter(name_index__exact=index_string(profil)).first()

		rc=Award.objects.filter(profil_id=_p.id).count()
		assert rc>0




