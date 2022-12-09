import pytest

from OpenAlumni.Batch import extract_profil_from_imdb, extract_profil_from_unifrance, extract_film_from_imdb, \
	add_pows_to_profil, extract_film_from_unifrance
from OpenAlumni.Tools import equal_str, log
from alumni.models import Profil


def test_extract_profil(lastname="ducournau",firstname="julia",refresh_delay=0,_return=None):
	rc=extract_profil_from_imdb(lastname,firstname,refresh_delay=refresh_delay)
	assert not rc is None
	assert len(rc["links"])>0
	if _return=="imdb": return rc

	rc=extract_profil_from_unifrance(firstname+" "+lastname,refresh_delay=refresh_delay)
	assert not rc is None
	assert len(rc["links"])>0
	return rc


def test_extract_awards(url=""):
	raise(NotImplementedError)


@pytest.mark.django_db(database="test2_dataculture")
def test_add_pow(lastname="ducournau",firstname="julia",refresh_delay=3):
	p=Profil.objects.filter(lastname=lastname,firstname=firstname)
	rc=test_extract_profil(lastname,firstname,refresh_delay=refresh_delay)
	add_pows_to_profil(p,rc["links"],"",refresh_delay)


def test_extract_movies(title="titane",url="",refresh_delay=3,sources=["unifrance","imdb"]):
	for src in sources:
		if src=="imdb":	rc=extract_film_from_imdb(url=url,title=title,refresh_delay=refresh_delay)
		if src=="unifrance": rc=extract_film_from_unifrance(url=url,title=title,refresh_delay=refresh_delay)

	assert equal_str(rc["title"],title)
	assert len(rc["title"])>0
	assert len(rc["nature"])>0
	assert len(rc["year"])>0
	assert len(rc["casting"])>0
	return rc

def test_profils(profils=["béatrice Colombier","francois ozon","julia ducournau"]):
	for profil in profils:
		log("Test de "+profil)
		test_extract_profil(profil.split(" ")[1],profil.split(" ")[0])

def test_movies(pows=["Plus belle la vie"]):
	for pow in pows:
		rc=test_extract_movies(pow,refresh_delay=3)