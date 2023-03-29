import pytest

from OpenAlumni.Batch import extract_profil_from_imdb, extract_profil_from_unifrance, extract_film_from_imdb, \
	extract_film_from_unifrance, extract_awards_from_imdb, imdb_search, extract_episodes_from_profil, \
	extract_casting_from_imdb, extract_tags_from_imdb, extract_nature_from_imdb
from OpenAlumni.Tools import equal_str, log, remove_string_between_delimiters, index_string
from OpenAlumni.settings import MOVIE_NATURE

MOVIES={
	"L'histoire du samedi":{"url":"https://www.imdb.com/title/tt3805856/"},
	"Jocelyn":{"url":"https://www.imdb.com/title/tt15235788/?ref_=ttep_ep2"},
	"Episode 258":{"url":"https://www.imdb.com/title/tt15803534/?ref_=ttep_ep43"},
	"sam":{"url":"https://www.imdb.com/title/tt5085178/?ref_=ttep_ep_tt","episodes":16,"casting":9},
	"Emmanuelle Laborit, éclats de signes": {"url":"https://www.imdb.com/title/tt11850060/?ref_=nm_flmg_c_14_dr"},
	"Personne ne s’aimera jamais comme on s’aime":{"url":"https://www.unifrance.org/film/45837/personne-ne-s-aimera-jamais-comme-on-s-aime"},
	"Truckstop":{"url":"https://www.imdb.com/title/tt0507501/"},
	"Junior":{"url":"https://www.imdb.com/title/tt1937202/"},
	"Les liens (autant que faire se peut)":{"url":"https://www.imdb.com/title/tt0323054/"},
	"Grave":{"url":"https://www.imdb.com/title/tt4954522/","casting":14},
	"Titane":{"url":"https://www.imdb.com/title/tt10944760/?ref_=fn_al_tt_1","awards":20},
	"Liberté":{"url":"https://www.imdb.com/title/tt5099262/?ref_=ttep_ep5"},
	"servant":{"url":"https://www.imdb.com/title/tt8068860/?ref_=nv_sr_srsg_0","casting":9},
	"top gun":{"url":"https://www.imdb.com/title/tt0092099/?ref_=nv_sr_srsg_5"},
	"Un monde sans fin":{"url":"https://www.imdb.com/title/tt1878805/?ref_=nm_flmg_t_10_prd"},
	"Être et avoir":{"url":"https://www.imdb.com/title/tt0318202/?ref_=nv_sr_srsg_0"}
}



PROFILS=[
	{
		"name":"julia ducournau",
		"unifrance":{"links":3},
		"imdb":{"links":4},
		"awards":20
	},
	{
		"name":"béatrice Colombier",
		"unifrance":{},
		"imdb":{}
	},
	{
		"name":"arnaud surel",
		"unifrance":None,
		"imdb":{"links":2}
	},
	{
		"name":"Sandrine gregor",
		"unifrance":{"links":2},
		"imdb":{"links":4}
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


def test_extract_movies_from_profil(query={"name": "julia ducournau", "imdb": {"links": 3}, "unifrance": {"links": 3}}, refresh_delay=10):
	firstname=query["name"].split(" ")[0]
	lastname=query["name"].replace(firstname+" ","")
	log("Extraction des films pour "+firstname+" "+lastname)
	rc= {"links":[]}
	if "imdb" in query:
		rc_imdb=extract_profil_from_imdb(lastname,firstname,refresh_delay=refresh_delay)
		if not query["imdb"] is None:
			assert not rc_imdb is None
			nb_link_to_find=query["imdb"]["links"] if "links" in query["imdb"] else 0
			assert len(rc_imdb["links"])>=nb_link_to_find,"Il manque des liens pour "+lastname
		if rc_imdb: rc["links"]=rc["links"]+rc_imdb["links"]

	if "unifrance" in query:
		rc_unifrance=extract_profil_from_unifrance(firstname+" "+lastname,refresh_delay=refresh_delay)
		if not query["unifrance"] is None:
			assert not rc_unifrance is None
			nb_link_to_find=query["unifrance"]["links"] if "links" in query["unifrance"] else 0
			assert len(rc_unifrance["links"])>=nb_link_to_find
		if rc_unifrance: rc["links"]=rc["links"]+rc_unifrance["links"]

	return rc


def test_extract_awards_from_profils(profils=PROFILS):
	for p in profils:
		url=test_search_imdb([p["name"]])
		log("Extract award pour "+url["href"])
		awards=extract_awards_from_imdb("https://imdb.com"+url["href"])
		assert not awards is None
		assert len(awards)>=(p["awards"] if "awards" in p else 0)
		if len(profils)==1: return awards


def test_extract_episodes(movies=MOVIES):
	for title in movies.keys():
		log("Recherche des épisodes de "+title)
		rc=test_extract_movies(url=MOVIES[title]["url"],title=title,src="imdb",refresh_delay=1)
		assert len(rc["episodes"])>=(MOVIES[title]["episodes"] if "episodes" in MOVIES[title] else 0)
	return rc


def test_extract_episode_from_profil(name="Claire Lemaréchal",title="sam"):
	rc=test_extract_movies(url=MOVIES[title]["url"],title=title,src="imdb")
	rc=extract_episodes_from_profil(rc["episodes"],name)
	assert len(rc)>0


def test_extract_casting_from_imdb(titles=["Grave","sam","servant","Liberté"]):
	for title in titles:
		casting=extract_casting_from_imdb(MOVIES[title]["url"],refresh_delay=1)
		assert not casting is None
		assert len(casting)>=(MOVIES[title]["casting"] if "casting" in MOVIES[title] else 0)

def test_extract_casting_with_filter_from_imdb(titles=["Grave","Titane","servant"]):
	for title in titles:
		url=MOVIES[title]["url"]
		log("Lecture du casting : "+url)
		casting=extract_casting_from_imdb(url,casting_filter=index_string("julia ducournau"),refresh_delay=1)
		assert not casting is None
		assert len(casting)>=1


def test_remove_string_between_delimiters():
	assert remove_string_between_delimiters("avant<a>milieu</a>apres","<a>","</a>")=="avantapres"
	assert remove_string_between_delimiters("avant<a>1</a>_milieu_<a>2</a>apres","<a>","</a>")=="avant_milieu_apres"
	assert remove_string_between_delimiters("avant<p>milieu</p>apres","<a>","</a>")=="avant<p>milieu</p>apres"
	assert remove_string_between_delimiters("avant<a>milieu</p>apres","<a>","</a>")=="avant<a>milieu</p>apres"


def test_extract_movies(title="titane",url="",refresh_delay=3,src="imdb"):
	if "imdb" in url or src=="imdb": rc=extract_film_from_imdb(url=url,title=title,refresh_delay=refresh_delay)
	if "unifrance" in url or src=="unifrance": rc=extract_film_from_unifrance(url=url,title=title,refresh_delay=refresh_delay)

	assert equal_str(rc["title"],title)
	assert len(rc["title"])>0
	assert len(rc["nature"])>0
	if rc["nature"]=="Série":
		assert len(rc["episodes"])>0
	else:
		assert len(rc["casting"])>0

	assert len(rc["year"])>0


	return rc




def test_profils(profils=PROFILS):
	rc=[]
	for profil in profils:
		log("Test de "+profil["name"])
		rc.append(test_extract_movies_from_profil(profil))
	return rc


def test_movies(titles=["servant"]):
	for title in titles:
		rc=test_extract_movies(url=MOVIES[title]["url"],refresh_delay=10)
		assert not rc is None


def test_tags():
	for title in MOVIES.keys():
		url=MOVIES[title]["url"]
		tags=extract_tags_from_imdb(url)
		assert not tags is None
		log(title+" ("+url+") -> "+",".join(tags))


def test_nature():
	for title in MOVIES.keys():
		url=MOVIES[title]["url"]
		nature=extract_nature_from_imdb(url)
		log(title+" ("+url+") est de nature"+nature)
		assert nature in MOVIE_NATURE,nature + " n'est pas référencée dans la liste des natures"

# @pytest.mark.django_db
# def test_batch(name="julia ducournau"):
# 	profils=Profil.objects.filter(name_index=index_string(name))
# 	n_films,n_works=exec_batch(list(profils))
# 	assert n_films>0
# 	assert n_works>0

