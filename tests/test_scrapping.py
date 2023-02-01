import pytest

from OpenAlumni.Batch import extract_profil_from_imdb, extract_profil_from_unifrance, extract_film_from_imdb, \
	extract_film_from_unifrance, extract_awards_from_imdb, imdb_search, extract_episodes_from_profil, \
	extract_casting_from_imdb, exec_batch
from OpenAlumni.Tools import equal_str, log, remove_string_between_delimiters, index_string
from alumni.models import Profil

MOVIES={
	"sam":{"url":"https://www.imdb.com/title/tt5085178/?ref_=ttep_ep_tt"},
	"servant":{"url":"https://www.imdb.com/title/tt8068860/?ref_=nv_sr_srsg_0"},
	"Liberté":{"url":"https://www.imdb.com/title/tt5099262/?ref_=ttep_ep5"},
	"Titane":{"url":"https://www.imdb.com/title/tt10944760/?ref_=fn_al_tt_1"},
}


PROFILS=[
	{
		"name":"julia ducournau",
		"unifrance":{"links":3},
		"imdb":{"links":4},
	},
	{
		"name":"Sandrine gregor",
		"unifrance":{"links":2},
		"imdb":{"links":4}
	},
	{
		"name":"arnaud surel",
		"unifrance":None,
		"imdb":{"links":2}
	},
	{
		"name":"béatrice Colombier",
		"unifrance":{},
		"imdb":{}
	},
	{
		"name":"francois ozon",
		"unifrance":{},
		"imdb":{}
	},

]


def test_search_imdb(names=["julia ducournau","françois ozon","cyril nakash","hervé hadmar"]):
	rc=""
	for name in names:
		rc=imdb_search(name,refresh_delay=1)
		assert len(rc)>0
	return rc[0]

def test_extract_profil(query={"name":"julia ducournau","imdb":{"links":3},"unifrance":{"links":3}},refresh_delay=10):
	firstname=query["name"].split(" ")[0]
	lastname=query["name"].replace(firstname+" ","")
	rc=None
	if "imdb" in query:
		rc_imdb=extract_profil_from_imdb(lastname,firstname,refresh_delay=refresh_delay)
		if not query["imdb"] is None:
			assert not rc_imdb is None
			assert len(rc_imdb["links"])>=query["imdb"]["links"]

	if "unifrance" in query:
		rc_unifrance=extract_profil_from_unifrance(firstname+" "+lastname,refresh_delay=refresh_delay)
		if not query["unifrance"] is None:
			assert not rc_unifrance is None
			assert len(rc_unifrance["links"])>=query["unifrance"]["links"]

	return {"links":rc_unifrance["links"]+rc_imdb["links"]}


def test_extract_awards(url="julia ducournau",result=53):
	if not url.startswith("http"):
		rc=extract_profil_from_imdb(url.split(" ")[1],url.split(" ")[0])
		url=rc["url"]
	awards=extract_awards_from_imdb(url)
	assert not awards is None
	assert len(awards)>=result
	return awards


def test_extract_episodes(movies=MOVIES):
	for title in movies.keys():
		rc=test_extract_movies(url=MOVIES[title]["url"],title=title,src="imdb")
		assert len(rc["episodes"])>0
	return rc


def test_extract_episode_from_profil(name="Claire Lemaréchal",title="sam"):
	rc=test_extract_movies(url=MOVIES[title]["url"],title=title,src="imdb")
	rc=extract_episodes_from_profil(rc["episodes"],name)
	assert len(rc)>0


def test_extract_casting_from_imdb(titles=["sam","servant","Liberté"]):
	for title in titles:
		casting=extract_casting_from_imdb(MOVIES[title]["url"])
		assert not casting is None


def test_remove_string_between_delimiters():
	assert remove_string_between_delimiters("avant<a>milieu</a>apres","<a>","</a>")=="avantapres"
	assert remove_string_between_delimiters("avant<a>1</a>_milieu_<a>2</a>apres","<a>","</a>")=="avant_milieu_apres"
	assert remove_string_between_delimiters("avant<p>milieu</p>apres","<a>","</a>")=="avant<p>milieu</p>apres"
	assert remove_string_between_delimiters("avant<a>milieu</p>apres","<a>","</a>")=="avant<a>milieu</p>apres"


def test_extract_movies(title="titane",url="",refresh_delay=3,src="imdb"):
	if "imdb" in url or src=="imdb":	rc=extract_film_from_imdb(url=url,title=title,refresh_delay=refresh_delay)
	if "unifrance" in url or src=="unifrance": rc=extract_film_from_unifrance(url=url,title=title,refresh_delay=refresh_delay)

	assert equal_str(rc["title"],title)
	assert len(rc["title"])>0
	assert len(rc["nature"])>0
	assert rc["nature"]=="Série" or len(rc["episodes"])==0
	assert len(rc["year"])>0
	assert len(rc["casting"])>0

	return rc


def test_profils(profils=PROFILS):
	rc=[]
	for profil in profils:
		log("Test de "+profil["name"])
		rc.append(
			test_extract_profil(profil)
		)
	return rc


def test_movies(titles=["servant"]):
	for title in titles:
		rc=test_extract_movies(url=MOVIES[title]["url"],refresh_delay=10)
		assert not rc is None

@pytest.mark.django_db
def test_batch(name="julia ducournau"):
	profils=Profil.objects.filter(name_index=index_string(name))
	n_films,n_works=exec_batch(profils)
	assert n_films>0
	assert n_works>0

