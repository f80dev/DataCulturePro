import base64
import csv
from io import StringIO, BytesIO
from urllib import parse
from urllib.parse import urlparse
from json import loads

import yaml
from django.contrib.auth.models import User
from django.core import management
from django.forms import model_to_dict
from django.template.defaultfilters import urlencode
from django.utils.datetime_safe import datetime
from django.utils.timezone import make_aware
from imdb import IMDb
from pandas import read_excel
from wikipedia import wikipedia, re

from OpenAlumni.Bot import Bot
from OpenAlumni.Tools import log, translate, load_page, in_dict, load_json, remove_html, fusion, remove_ponctuation, \
    equal_str, remove_accents, index_string, extract_years, stringToUrl, dateToTimestamp

from OpenAlumni.settings import MOVIE_NATURE, STATIC_ROOT

from alumni.models import Profil, Work, PieceOfWork, Award, Festival, Article, ExtraUser

ia=IMDb()

def extract_movie_from_cnca(title:str):
    #title=title.replace(" ","+")
    obj={
        "RechercheOeuvre_1":{"Tbx_Titre":title}
    }
    #page=wikipedia.BeautifulSoup(wikipedia.requests.post("http://www.cnc-rca.fr/Pages/Page.aspx?view=RecOeuvre",),headers={'User-Agent': 'Mozilla/5.0'}).text, "html5lib")
    return title


def reindex():
    log("Ré-indexage de la base")
    return management.call_command("search_index","--rebuild","-f")


def extract_movie_from_bdfci(pow:PieceOfWork,refresh_delay=31):
    title = pow.title.replace(" ", "+")
    page=load_page("https://www.bdfci.info/?q="+title+"&pa=f&d=f&page=search&src=bdfci&startFrom=1&offset=1",refresh_delay=refresh_delay)
    articles=page.find_all("article")
    url_ref=None
    if len(articles)==0:
        entete=page.find("h1")
        if not entete is None:
            text_entete=entete.text.split("<")[0].lower()
            if text_entete==pow.title.lower():
                url_ref=page
    else:
        url = articles[0].find("a")
        if url is not None and url.attrs["title"].lower() == str(pow.title).lower():
            url_ref = "https://www.bdfci.info" + url.attrs["href"]

    if url_ref is not None:
        pow.add_link(url_ref, "BDFI")
        log("Ajout du lien BDFCI:"+url_ref+" pour "+pow.title)
        pow.dtLastSearch=datetime.now()
        pow.save()

    return title


def extract_profil_from_lefimlfrancais(firstname,lastname,refresh_delay=31):
    rc=dict()
    url="http://www.lefilmfrancais.com/index.php?option=com_papyrus&view=recherche&task=json&tmpl=rss&term="+firstname+"+"+lastname
    data=load_json(url)
    if len(data)>1:
        rc["url"]=data[0]["link"]
        page=load_page(rc["url"],refresh_delay=refresh_delay)
        rc["links"]=[]
        for l in page.find_all("a"):
            if l.attrs["href"].startswith("http://www.lefilmfrancais.com/film/"):
                link={
                    "text" :l.text,
                    "url"  :l.attrs["href"],
                    "source":"LeFilmFrancais"
                }
                if not link in rc["links"]:rc["links"].append(link)
    return rc






def extract_profil_from_cnca(title):
    """
    Extraction sur la base http://www.cnc-rca.fr/Pages/PageAccueil.aspx
    :param firstname:
    :param lastname:
    :return:
    """
    page = wikipedia.BeautifulSoup(wikipedia.requests.get("http://www.cnc-rca.fr/Pages/Page.aspx?view=RecOeuvre",
                                                          headers={'User-Agent': 'Mozilla/5.0'}).text, "html5lib")
    return title


from requests.auth import HTTPBasicAuth
def connect_to_lefilmfrancais(user:str,password:str):
    bot=Bot("http://www.lefilmfrancais.com/")
    bot.login(user,password)
    return bot

def extract_film_from_leFilmFrancais(url:str,job_for=None,all_casting=False,refresh_delay=30,bot=None):
    rc=dict({"nature":"","title":"","source":"auto:LeFilmFrancais","url":url})
    if not url.startswith("http"):
        page=load_page("http://www.lefilmfrancais.com/index.php?option=com_papyrus&view=recherche&searchword="+parse.quote(url))
        bFind=False
        fiche_film=page.find("div",{"id":"fiche_film"})
        if fiche_film:
            for l in fiche_film.find_all("a"):
                if l and l["href"].startswith("http://www.lefilmfrancais.com/film/"):
                    url=l["href"]
                    bFind=True
                    break
        if not bFind:return None

    page=load_page(url,bot=bot)
    if page.find("div",{"id":"synopsis"}):rc["synopsis"]=remove_html(page.find("div",{"id":"synopsis"}).text)

    elts=page.find_all("h1")
    if len(elts)>0:
        rc["title"]=elts[0].text.split("(")[0]

    elt=page.find("div",{"id":"detail"})
    if elt:
        for item in elt:
            if item.name is None:
                if "sortie" in item.lower():
                    pass


    for span in page.find_all("span"):
        if "class" in span.attrs and len(span.attrs["class"])>0 and span.attrs["class"][0]=="realisation":
            if not "Réalisation" in span.text.split(",")[0]:
                rc["nature"]=span.text.split(",")[0].split("(")[0]
        else:
            if ":" in span.text:
                val=span.text.split(":")[1].strip()
                if "Visa" in span.text:rc["visa"]=val
                if "Titre original" in span.text:rc["original_title"]=val
                if "Réalisation" in span.text: rc["real"] = val
                if "Sortie" in span.text:rc["sortie"]=val
                if "copies" in span.text:rc["copies"]=int(val)
                if "Nationalité" in span.text: rc["Nationality"]=val
                if "Distribution France" in span.text:rc["distribution"]=val

    for item in page.find_all("li"):
        lab=item.text.split(":")[0]
        if ":" in item.text:
            val=item.text.split(":")[1].split("|")[0].strip()
            if "production :" in lab:rc["production"]=val
            if "Partenaires" in lab:rc["financial"]=val
            if "Récompense" in lab:rc["prix"]=val
            if "Presse" in lab: rc["presse"] = val

    if "title" in rc:log("Extraction de "+rc["title"]+" : "+str(rc))
    return rc



def extract_casting_from_unifrance(url:str,refresh_delay=31):
    rc=dict()
    page=load_page(url,refresh_delay=refresh_delay)
    if page.find("div",{"id":"description"}) and page.find("div",{"id":"description"}).find("p"):
        real_links=page.find("div",{"id":"description"}).find("p").find_all("a")
        name=None
        if len(real_links)>0:
            name=real_links[0].text
        else:
            if page.find("div",{"itemprop":"director"}):
                name=page.find("div",{"itemprop":"director"}).text.lower()
        if name:
            rc[translate("Réalisation")]=[{
                "name":name,
                "source":"unifrance",
                "index":index_string(name),
                "url":real_links[0].get("href")
            }]

        #Recherche dans le générique détaillé
        section=page.find("section",{"id":"casting"})
        if not section is None:
            jobs = section.findAll("h2")
            paras = section.findAll("p")
            #if not "personne" in links[0].href:links.remove(0)
            for idx in range(len(paras)):
                links=paras[idx].findAll("a")
                for l in links:
                    job=translate(clean_line(jobs[idx].text),["jobs"],True)
                    if job:
                        #On ajoute l'ensemble du casting au systeme
                        names = str(l.getText()).split(" ")
                        lastname =names[len(names)-1]
                        if not job in rc:rc[job]=[]
                        fullname=l.getText().replace(lastname,"").strip()+" "+lastname
                        rc[job].append(
                            {
                                "name":fullname,
                                "url":l.attrs["href"],
                                "index":index_string(fullname),
                                "source":"unifrance",
                            }
                        )
                    else:
                        job=clean_line(jobs[idx].text)
                        log(job+" non présent dans le référentiel")

        #Recherche dans les acteurs
        for actor in page.find_all("div",{"itemprop":"actors"}):
            if "data-title" in actor.attrs:
                if not "actor" in rc:rc["actor"]=[]
                fullname=actor.attrs["data-title"].lower()
                rc["actor"].append({
                    "name":fullname,
                    "source":"unifrance",
                    "index":index_string(fullname)
                })

    return rc



def extract_film_from_unifrance(url:str,title="",refresh_delay=30):
    rc = dict({"casting": [], "source": "auto:unifrance", "url": url})
    if not url.startswith("http"):
        if len(url)==0:url=title
        log("On passe par la page de recherche pour retrouver le titre")
        page=load_page("https://unifrance.org/recherche?q="+parse.quote(url),refresh_delay=refresh_delay)
        _link=page.find("a",attrs={'href': wikipedia.re.compile("^https://www.unifrance.org/film/[0-9][0-9]")})
        if _link is None:return None

        url=_link.get("href")
        rc["url"]=url

    #r=wikipedia.requests.get(url, headers={'User-Agent': 'Mozilla/5.0',"accept-encoding": "gzip, deflate"})
    #page = wikipedia.BeautifulSoup(str(r.content,encoding="utf-8"),"html5lib")
    page=load_page(url,refresh_delay)
    _title=page.find('h1', attrs={'itemprop': "name"})
    if not _title is None:
        rc["title"]=_title.text
        log("Analyse du film "+rc["title"])

    for title in page.findAll('h1'):
        if title.text.startswith("Affiches"):
            section=title.parent
            _img=section.find("img",attrs={'itemprop': "image"})
            if not _img is None:
                src:str=_img.get("src")
                if not src.startswith("/ressource"):
                    rc["visual"]=src
                    log("Enregistrement de l'affiche "+src)

    _real=page.find("div",attrs={"itemprop":"director"})
    if not _real is None and not _real.find("a",attrs={"itemprop":"name"}) is None:
        rc["real"]=_real.find("a",attrs={"itemprop":"name"}).get("href")

    idx_div=0
    for div in page.findAll("div",attrs={'class': "details_bloc"}):
        if idx_div==0:
            if not ":" in div.text:rc["nature"]=div.text

        if "Numéro de visa" in div.text: rc["visa"]=div.text.split(" : ")[1].replace(".","")
        if "Langues de tournage" in div.text: rc["langue"]=div.text.split(" : ")[1]
        if "Année de production : " in div.text: rc["year"]=div.text.replace("Année de production : ","")
        if "Genre(s) : " in div.text: rc["category"]=translate(div.text.replace("Genre(s) : ",""))

        idx_div=idx_div+1

    if "category" in rc and len(rc["category"])==0:rc["category"]="inconnue"

    rc["prix"]=[]
    for section_prix in page.find_all("div",attrs={"class":"distinction palmares"}):
        if len(section_prix.find_all("div"))>0:
            content=section_prix.find_all("div")[1].text
            if content is not None:
                content=content.replace("PlusMoins", "")
                _prix={
                    "desc":content.split(")Prix")[1].split(" : ")[0]
                }

                for l in section_prix.find_all("div")[1].find_all("a"):
                    if "festivals" in l.attrs["href"]:
                        _prix["title"]=l.text.split("(")[0]
                        _prix["year"] = re.findall(r"[1-2][0-9]{3}", l.text)[0]
                    # if "person" in l.attrs["href"] and "profil" not in _prix:
                    #     _prix["profil"]=index_string(l.text)

                # if not "profil" in _prix and not job_for is None:
                #     log("Attribution du prix à "+job_for)
                #     _prix["profil"]=index_string(job_for)

                if "year" in _prix and "title" in _prix:
                    rc["prix"].append(_prix)
                    log("Ajout du prix "+str(_prix))
                else:
                    log("!Prix non conforme sur "+url)

    rc["casting"]=extract_casting_from_unifrance(url)

    _synopsis = page.find("div", attrs={"itemprop": "description"})
    if not _synopsis is None:
        rc["synopsis"]=_synopsis.getText(strip=True)

    return rc




def extract_profil_from_bellefaye(firstname,lastname):
    page = wikipedia.BeautifulSoup(wikipedia.requests.post(
        "https://www.bellefaye.com/fr/login_check",
        data="_csrf_token=c8FvlHO5q-f0XpbhG2lQJifHlmhei_qpGO3WcaLgPqE&_username=h.hoareau%40femis.fr&_password=Femis2021&_submit=",
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
            'Accept': 'text/html', 'Content-Type': 'application/x-www-form-urlencoded'
        }
    ).text, "html5lib")

    url="https://www.bellefaye.com/fr/search"
    data="name=%name%&firstName=%firstname%&searchCity=&searchZipCode=&searchEmail=&searchGender=&findPerson=&searchName=&searchCity2=&searchZipCode2=&searchEmail2="
    data=data.replace("%name%",lastname).replace("%firstname%",firstname)
    page = wikipedia.BeautifulSoup(wikipedia.requests.post(
        url,
        data=data,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
            'Accept':'text/html','Content-Type':'application/x-www-form-urlencoded'
        }
    ).text, "html5lib")
    print(page.text)
    pass



def extract_profil_from_unifrance(name="céline sciamma", refresh_delay=31):
    page=load_page("https://www.unifrance.org/recherche/personne?q=$query&sort=pertinence".replace("$query",parse.quote(name)),refresh_delay=refresh_delay)
    links=page.findAll('a', attrs={'href': wikipedia.re.compile("^https://www.unifrance.org/annuaires/personne/")})

    rc=list()
    if len(links)>0:
        u=links[0].get("href")
        page=wikipedia.BeautifulSoup(wikipedia.requests.get(u, headers={'User-Agent': 'Mozilla/5.0'}).text,"html5lib")
        if equal_str(name,page.title.text.split("-")[0]) or equal_str(name,links[0].text.split("Activités : ")[0]):
            photo = ""
            _photo = page.find('div', attrs={'class': "profil-picture pull-right"})
            if not _photo is None: photo = _photo.find("a").get("href")

            links_film=page.findAll('a', attrs={'href': wikipedia.re.compile("^https://www.unifrance.org/film/[0-9][0-9]*/")})
            for l in links_film:
                url=l.get("href")
                if not url in [x["url"] for x in rc]:
                    rc.append({"url":url,"text":l.get("text"),"nature":""})

            return {"links": rc, "photo": photo, "url": u,"fullname":name}

    return None




def add_award(festival_title:str,profil:Profil,desc:str,pow_id:int=0,film_title="",year="",win=True,url="",user:ExtraUser=None):
    """
    Ajout un award sur la base d'un titre de festival, titre de film et année de récompense
    :param festival_title:
    :param pow_id:
    :param profil_id:
    :param film_title:
    :param year:
    :return:
    """
    pow = None
    if len(film_title)>0 and len(year)>0:
        pows = PieceOfWork.objects.filter(title__iexact=film_title)
        for i in range(0,len(pows)):
            pow=pows[i]
            if pow is None or pow.year is None or year is None:
                log("Probléme de date avec le film")
            else:
                if int(pow.year)<=int(year) and int(pow.year)-int(year)<2:
                    break
    else:
        if pow_id:
            pow=PieceOfWork.objects.get(id=pow_id)

    if pow is None:
        log("Impossible de trouver le film "+film_title+" dans la base. Annulation de l'award")
        return None

    f = Festival.objects.filter(title__iexact=festival_title)
    if f.exists():
        f = f.first()
    else:
        log("Ajout d'un nouveau festival "+festival_title)
        f = Festival(title=festival_title)
        f.save()

    desc = desc.replace("\n", "").replace("Winner", "").replace("Nominee", "").strip()
    if desc.startswith("(") and ")" in desc: desc = desc.split(")")[1]
    if len(desc)<8:return None

    if profil is None:
        awards = Award.objects.filter(pow__id=pow.id, year=year).all()
    else:
        awards = Award.objects.filter(pow__id=pow.id, year=year, profil__id=profil.id).all()
    for a in awards:
        if a.description==desc: return a        #Si on trouve la meme description, on a déjà l'award
        if a.source and a.source[:15]!=url[:15]: return a    #Si on a pas la meme source, on refuse d'ajouter un nouvel award

    a = Award(description=desc[:249], year=year, pow=pow, festival=f, profil=profil, winner=win,source=url)
    try:
        a.save()
        create_article("new_award",user,profil=profil,pow=pow,award=a)
        return a
    except:
        log("!!Probleme d'enregistrement de l'award sur " + pow.title)

    return None





def extract_awards_from_imdb(profil_url):
    # Recherche des awards
    page = load_page(profil_url + "awards?ref_=nm_awd")

    awards = page.find_all("h3")
    if len(awards)>0:
        awards.pop(0)

    rc_awards=[]

    tables = page.find_all("table", {"class": "awards"})

    for i in range(0, len(tables)):
        for tr in tables[i].find_all("tr"):
            if tr:
                festival_title = translate(awards[i].text.split(",")[0].lower().strip())
                tds = tr.find_all("td")
                if len(tds)<=2:
                    log("Format non conforme "+tr.text)
                else:
                    year = tds[0].text.replace("\n","").replace(" ","").strip()
                    award=None
                    for award in tds[2].text.split("\n"):
                        if  len(award.strip())>3:
                            award=award.strip()
                            break

                    film = tds[2].find("a")
                    if film and award:
                        film_title=film.text
                        rc_awards.append({
                            "festival_title":festival_title,
                            "profil":profil_url,
                            "desc":award,
                            "film_title":film_title,
                            "year":year,
                            "win":("Winner" in award),
                            "url":profil_url+"/awards"
                        })

    return rc_awards


def extract_episode_from_serie(url,fullname="",refresh_delay=30) -> list :
    episodes=[]
    for saison in range(1,20):
        url_season=url.split("?")[0]+"episodes?season="+str(saison)
        page_episodes=load_page(url_season,refresh_delay)
        for link_episode in [x.attrs["href"] for x in page_episodes.find_all("a",attrs={'href': wikipedia.re.compile("^/title/tt")})]:
            if link_episode not in episodes:
                title=""
                year=""
                link={"url":link_episode,"fullname":fullname,"text":title.strip(),"job":"","nature":"","year":year}
                episodes.append(link)
    return episodes



def extract_profil_from_imdb(lastname:str, firstname:str,refresh_delay=31,url_profil=""):
    infos={"links":[]}
    if url_profil is None or url_profil=="":
        peoples=ia.search_person(firstname+" "+lastname)
        if len(peoples)==0: log(lastname+" inconnu sur IMDB")
        for p in peoples:
            if "headshot" in p.data and not "nopicture" in p.data["headshot"]: infos["photo"] = p.data["headshot"]
            name=remove_accents(remove_ponctuation(p.data["name"].upper()))
            if (remove_accents(firstname).upper() in name and remove_accents(lastname).upper() in name) or equal_str(lastname+firstname,name):
                url_profil = "https://imdb.com/name/nm" + p.personID + "/"
                break


    infos["url"]=url_profil
    log("Ouverture de " + infos["url"])

    page = load_page(infos["url"], refresh_delay=refresh_delay) if "url" in infos else None
    if page is None:return None

    film_zone=page.find("section",{"class":"ipc-page-section ipc-page-section--base"})
    if film_zone is None:film_zone=page

    #Contient l'ensemble des liens qui renvoi vers une oeuvre
    links = film_zone.findAll('a', attrs={'href': wikipedia.re.compile("^/title/tt")})
    for l in links:
        #log("Analyse de "+str(l))
        #tmp_obj=l.parent.parent.parent.parent

            # job:str=l.parent.parent.get("id").split("-")[0]
            # if job=="miscellaneous" or len(job)==0:
            #     temp=l.parent.parent.text.split("(")
            #     job=temp[len(temp)-1].split(")")[0]
            #     pass
            # else:
            #     if not in_dict(job,"jobs"):job=""

        url = "https://www.imdb.com" + l.get("href")
        url = url.split("?")[0]

        title_section=list(l.parent.parent.children)[1]
        title:str=list(title_section.children)[0].text
        years=extract_years(title_section.text)

        if title_section.parent.parent.parent.parent.find("a",attrs={'href': wikipedia.re.compile("^episodes")}) is None:
            link={"url":url,"fullname":firstname+" "+lastname,"text":title.strip(),"job":"","nature":"","year":"" if len(years)==0 else years[0]}
            if not link["url"] in [x["url"] for x in infos["links"]]:
                infos["links"].append(link)
        else:
            episodes=extract_episode_from_serie(url,firstname+" "+lastname,refresh_delay)
            infos["links"]=infos["links"]+episodes

    return infos


def extract_film_from_senscritique(title:str,refresh_delay=31):
    url="https://www.senscritique.com/search?q="+urlencode(title.lower())

    log("Recherche sur sens-critique : "+url)
    pages=load_page(url,save=False)
    pages=pages.find_all("div",{"data-qa":"hits"})
    if len(pages)>0:
        links=pages[0].find_all("a")
        url=""
        for l in links:
            if "href" in l.attrs and l.attrs["href"].startswith("https://www.senscritique.com/film/"):
                if l.getText().lower()==title.lower():
                    url=l["href"]
                    log("Extraction de " + url)
                    page = load_page(url,refresh_delay)
                    return url
    return None


def clean_line(text:str) -> str:
    text=text.replace(" by","").replace("...","").replace("(","").replace(")","").replace("\n","").replace("&","")
    text=text.replace("  "," ").replace(":","").strip()
    return text




def extract_casting_from_imdb(url:str,refresh_delay=31):
    rc=dict()
    url=url.split("?")[0]+"fullcredits/"
    page=load_page(url,refresh_delay)
    if not page is None:
        page=page.find("div",attrs={"id":"fullcredits_content"})
        credits=page.find_all("a",attrs={'href': wikipedia.re.compile("^/name/nm")})
        for credit in credits:
            name=clean_line(credit.text)
            if len(name)>0:
                tr=credit.parent
                job=None
                while not tr is None:
                    tr=tr.parent
                    result=clean_line(tr.text)
                    if result!=name:
                        job=result.replace(name,"").strip()
                        break

                _job=translate(job,["jobs"],must_be_in_dict=True)
                if _job:
                    if not _job in rc: rc[_job]=[]
                    rc[_job].append({"name":name,"source":"imdb","index":index_string(name)})
                else:
                    log(job+" est absent du dictionnaire")

    return rc


# findname=tds[0].text.replace("\n","").replace("  "," ").strip()
# if len(findname) ==0:findname=tds[1].text.replace("\n","").replace("  "," ").strip()
# if len(findname)>0:
#     #log("Nom identifié "+findname)
#     if equal_str(findname,name):
#         sur_job=sur_jobs[i].text.replace("\n"," ").strip().replace("  "," ").replace(" by","")
#         if "Cast" in sur_job or "Serie Cast" in sur_job:
#             if len(tds)>3 and "Self" in tds[3].text:
#                 job=""
#             else:
#                 job="Actor"
#
#         job=translate(job.split("\n")[0])
#         if len(job)==0:
#             job=translate(sur_job)
#             if len(job)==0:
#                 log("Job non identifié pour "+name+" sur "+url)
#
#         if not "job" in rc:rc["job"]=[]
#         if not job in rc["job"]:rc["job"].append(job)



#http://localhost:8000/api/batch
def extract_film_from_imdb(url:str,title:str,job="",refresh_delay=31):
    """
    :return:
    """
    if not url.startswith("http"):
        page=load_page("https://www.imdb.com/find?s=tt&q="+parse.quote(title))
        bFind=False
        links=page.find_all("a")
        for link in links:
            if (len(url)==0 or equal_str(link.text,url)) and "/title/tt" in link["href"]:
                url="https://www.imdb.com"+link["href"]
                bFind=True
                break
        if not bFind:
            log(url+" introuvable sur IMDB")
            return None

    page=load_page(url,refresh_delay)
    title=remove_ponctuation(title)
    rc = dict({"title": title,"nature":"","casting":list(),"url":url,"source":"auto:IMDB"})

    divs=dict()
    elts=page.find_all("div",recursive=True)+page.find_all("h1",recursive=True)+page.find_all("ul",recursive=True)+page.find_all("p")+page.find_all("li")
    for div in elts:
        s=div.text
        s_t=translate(s)
        if s_t in MOVIE_NATURE:
            rc["nature"]=s_t
        if s.startswith("1h") or s.startswith("2h") and s.endswith("m") and len(rc["nature"])==0:
            rc["nature"]=translate("long")
        if "data-testid" in div.attrs:
            divs[div.attrs["data-testid"]]=div

    section_detail=page.find("section",{"data-testid":"Details"})
    if section_detail:
        section_detail=section_detail.find("ul")
        for li in section_detail.contents:
            if li.name=="li":
                if "Release" in li.text: rc["year"]=extract_years(li.text)
                if "Language" in li.text: rc["lang"]=translate(li.text.replace("Language",""))
                if "Country" in li.text: rc["pays"]=translate(li.text.replace("Country of origin",""))
                if "Production companies" in li.text:
                    rc["production"]=""
                    for cie in li.find_all("a"):
                        rc["production"]=rc["production"]+cie.text+","
                    if len(rc["production"])>2: rc["production"]=rc["production"][0:len(rc["production"])-2]

    if not "year" in rc:
        section=page.find("h1")
        if not section is None and not section.parent is None:
            years=extract_years(section.text)
        if len(years)>0: rc["year"]=years[0]
        if not "year" in rc or rc["year"] is None:
            for elt in page.find_all("ul",recursive=True):
                years=extract_years(elt.text)
                if len(years)>0:
                    rc["year"]=years[0]
                    break
    if not "year" in rc or rc["year"] is None:
        pass

    #Recherche de la nature et de la catégorie
    if not "genres" in divs:
        elt=page.find("li",{"role":"presentation","class":"ipc-inline-list__item"})
        if not elt is None:
            cat=elt.text
        else:
            cat = "inconnu"
    else:
        cat=""
        for div in divs["genres"]:
            cat = cat+translate(div.text.lower())+" "
        if cat.split(" ")[0] in MOVIE_NATURE:
            rc["nature"]=cat.split(" ")[0]
            cat=cat.replace(rc["nature"],"").strip()

    rc["category"]=cat.strip()
    if rc["nature"]=="" and not page.find("div",{"data-testid":"hero-subnav-bar-season-episode-numbers-section-xs"}) is None:
        rc["nature"]="Série"

    episodes=[]
    if rc["nature"]=="Série":
        uls=page.find_all("ul",{"data-testid":"hero-title-block__metadata"})
        if len(uls)>0:
            rc["year"]=extract_years(uls[0].text)[:2]

        log("On est en présence d'une série")
        title=divs["hero-title-block__title"].text
        infos=divs["hero-title-block__title"].parent.text

        if title in infos:
            log("On cherche a compléter le titre")
            sur_title=infos.split(title)[0].strip()
            if len(sur_title)==0:
                elt=page.find("a",{"data-testid":"hero-title-block__series-link"})
                if elt:sur_title=elt.text
            if len(sur_title)>0:
                title=sur_title+" - "+title

        rc["title"]=title

    if "hero-media__poster" in divs:
        affiche = divs["hero-media__poster"]
        if not affiche is None and not affiche.find("img") is None: rc["visual"] = affiche.find("img").get("src")

    rc["synopsis"]=""
    if "plot" in divs:
        rc["synopsis"]=divs["plot"].text.replace("Read all","")

    #log("Recherche du role sur le film")
    if not "job" in rc: rc["job"]=job

    rc["casting"]=extract_casting_from_imdb(url,refresh_delay=refresh_delay)

    return rc




def extract_actor_from_wikipedia(lastname,firstname):
    wikipedia.set_lang("fr")
    searchs=wikipedia.search(lastname+" "+firstname)

    for search in searchs:
        page=wikipedia.page(search)
        rc = {"links": list({"title": "wikipedia", "url": page.url})}

        if lastname in page.title and firstname in page.title:
            rc = dict({"links": [], "name": firstname+" "+lastname})
            for img in page.images:
                if img.endswith(".jpg"):rc["photo"]=img

            save_domains=["unifrance.org","www.lefilmfrancais","www.allocine.fr","catalogue.bnf.fr","www.allmovie.com"]
            libs = ["UniFrance", "Le Film Francais", "Allocine", "La BNF", "All movie"]
            try:
                for ref in page.references:
                    domain=urlparse(ref).netloc
                    try:
                        idx = save_domains.index(domain)
                        link={
                            "title":libs[idx],
                            "url":ref
                        }
                        if not link in rc["links"]:rc["links"].append(link)
                    except:
                        pass
            except:
                pass

            html:wikipedia.BeautifulSoup= wikipedia.BeautifulSoup(page.html(),"html5lib")
            #Recherche de la section des films
            # for link in html.findAll('a', attrs={'href': wikipedia.re.compile("^http://")}):
            #     if "film" in link.text:
            #         pass


            rc["summary"]=page.summary
            rc["title"]=page.title
            rc["url"]=page.url

            return rc

    return None



def create_article(template_id:str,
                   owner:User,
                   profil:Profil=None,
                   pow:PieceOfWork=None,
                   work:Work=None,
                   award:Award=None,
                   visual=None):
    """

    :param profil:
    :param pow:
    :param work:
    :param template:
    :return:
    """
    if owner is None:return False

    rc=False
    f=open(STATIC_ROOT+"/news_template.yaml", "r",encoding="utf-8")
    templates=yaml.safe_load(f.read())["templates"]
    for template in templates:
        if template["id"]==template_id:
            for section in ["content","title","description","visual"]:
                code=template[section]
                fields=code.split("{{")[1:]
                for field in fields:
                    model=field.split(".")[0]
                    field=field.split("}}")[0].replace(model+".","")
                    if model=="profil":value=getattr(profil,field) if profil else ""
                    if model=="pow" :value=getattr(pow,field) if pow else ""
                    if model=="work":value=getattr(work,field) if work else ""
                    if model=="award":value=getattr(award,field) if award else ""
                    if not value is None:
                        if type(value)==int:value=str(value)
                        code=code.replace("{{"+model+"."+field+"}}",value)
                template[section]=code

            try:
                article=Article(
                    title=template["title"],
                    summary=template["description"],
                    visual=template["visual"] if visual is None else visual,
                    content=template["content"],
                    owner=owner,
                    to_publish=True,validate=True
                )
                save_result=article.save()
                rc=True
            except:
                rc=False

    return rc



def dict_to_pow(film:dict,content=None):
    if not "title" in film:return None

    pow = PieceOfWork(title=film["title"],title_index=index_string(film["title"]))
    pow.add_link(url=film["url"], title=film["source"])
    if not content is None and content["senscritique"]:
        pow.add_link(extract_film_from_senscritique(film["title"]), title="Sens-critique")

    for k in list(model_to_dict(pow).keys()):
        if k in film:pow.__setattr__(k,film[k])

    if "nature" in film:
        pow.nature = translate(film["nature"])
    else:
        pow.nature = "Film"

    if "category" in film: pow.category = translate(film["category"])
    if "synopsis" in film:pow.description=film["synopsis"]
    if type(pow.year)==list and len(pow.year)>0:
        pow.year=pow.year[0]

    return pow

def idx(col:str,row=None,default=None,max_len=100,min_len=0,replace_dict:dict={},header=list()):
    """
    Permet l'importation dynamique des colonnes
    version 1.0
    :param col:
    :param row:
    :param default:
    :param max_len:
    :param min_len:
    :param replace_dict:
    :param header:
    :return:
    """
    for c in col.lower().split(","):
        if c in header:
            if row is not None and len(row)>header.index(c):
                rc=str(row[header.index(c)])

                #Application des remplacement
                for old in replace_dict.keys():
                    rc=rc.replace(old,replace_dict[old])

                if max_len>0 and len(rc)>max_len:rc=rc[:max_len]
                if min_len==0 or len(rc)>=min_len:
                    return rc.strip()
            else:
                return header.index(c)
    return default


def importer_file(file):
    """
    Systeme d'importation de fichier csv ou excel
    version 1.0
    :param file:
    :return:
    """
    d=list()

    log("Importation de fichier")
    data=file
    if type(file)==str and len(file)>500:
        if "base64," in file: file=str(file).split("base64,")[1]
        data = base64.b64decode(file)

    res=None
    if type(data)==bytes:
        res = read_excel(data)
    else:
        if data.endswith("xlsx"):
            res = read_excel(data)
        else:
            delimiter = ";"
            text_delimiter = False
            log("Analyse du document")
            for _encoding in ["utf-8", "ansi"]:
                try:
                    txt = str(data, encoding=_encoding)
                    break
                except:
                    pass
            txt = txt.replace("&#8217;", "")
            log("Méthode d'encoding " + _encoding)

            if "\",\"" in txt:
                delimiter = ","
                text_delimiter = True

                log("Importation du CSV")
                res = csv.reader(StringIO(txt), delimiter=delimiter, doublequote=text_delimiter)

    if res is None:
        return None,0
    else:
        d.append(list(res))
        for k in range(1, len(res)):
            d.append(list(res.loc[k]))
        total_record = len(d) - 1
        log("Nombre d'enregistrements identifié " + str(total_record))

    return d,total_record



def profils_importer(data_rows,limit=10,dictionnary={}):
    i = 0
    record = 0
    non_import=list()

    l_department_category=[(x.lower() if not x is None else '') for x in Profil.objects.values_list("department_category",flat=True)]
    for row in data_rows[:limit+1]:

        if i==0:
            header=[x.lower().replace("[[","").replace("]]","").strip() for x in row]
            log("Liste des colonnes disponibles "+str(header))
        else:
            if type(dictionnary)==str:
                s=dictionnary.replace("'","\"").replace("\n","").strip()
                dictionnary=dict() if len(s)==0 else loads(s)

            firstname=idx("fname,firstname,prenom,prénom",row,max_len=40,header=header)
            lastname=idx("lastname,nom,lname",row,max_len=100,header=header)
            if i % 10 == 0:
                log(firstname + " " + lastname + " - " + str(i) + "/" + str(limit) + " en cours d'importation")

            email=idx("email,mail,e-mail",row,header=header,max_len=50)
            idx_photo=idx("photo,picture,image",header=header)

            #Eligibilité et evoluation du genre
            gender=idx("gender,genre,civilite,civilité",row,"",header=header)
            if len(lastname)>1 and len(lastname)+len(firstname)>4:
                if idx_photo is None or len(row[idx_photo])==0:
                    photo=None

                    if gender=="Monsieur" or gender=="M." or str(gender).startswith("Mr"):
                        photo="/assets/img/boy.png"
                        gender = "M"

                    if str(gender).lower() in ["monsieur","mme","mademoiselle","mlle"]:
                        photo="/assets/img/girl.png"
                        gender = "F"

                    if photo is None:
                        photo = "/assets/img/anonymous.png"
                        gender = ""

                else:
                    photo=stringToUrl(idx("photo",row,""))

                #Calcul
                dt_birthdate=idx("BIRTHDATE,birthday,anniversaire,datenaissance",row,header=header)
                # if len(dt_birthdate)==8:
                #     tmp=dt_birthdate.split("/")
                #     if int(tmp[2])>50:
                #         dt_birthdate=tmp[0]+"/"+tmp[1]+"/19"+tmp[2]
                #     else:
                #         dt_birthdate = tmp[0] + "/" + tmp[1] + "/20" + tmp[2]
                dt=dateToTimestamp(dt_birthdate)

                if not "promo" in dictionnary:dictionnary["promo"]=None
                promo=idx("date_start,date_end,date_exam,promo,promotion,anneesortie,degree_year,fin,code_promotion",row,dictionnary["promo"],0,4,header=header)
                if type(promo)!=str: promo=str(promo)
                if not promo is None and len(promo)>4:
                    promo=dateToTimestamp(promo)
                    if not promo is None:promo=promo.year

                standard_replace_dict={"nan":"","[vide]":""}
                cursus=idx("cursus",row,default="P" if idx("internship_type",row,"",header=header).lower()=="stage" else "S",header=header,max_len=1)

                department = idx("CODE_FORMATION_FC,CODE_TRAINING,departement,department,formation", row, "", 60,replace_dict=standard_replace_dict,header=header)
                if cursus=="P":
                    department_category=translate(department,["department_category"])
                else:
                    department_category=idx("code_regroupement,regroupement",row,"",50,replace_dict=standard_replace_dict,header=header)
                    if department_category is None or len(department_category)==0:
                        if department.lower() in l_department_category:
                            department_category=department

                profil=Profil(
                    firstname=firstname,
                    school="FEMIS",
                    lastname=lastname,
                    name_index=index_string(firstname+lastname),
                    gender=gender,
                    mobile=idx("mobile,telephone,tel2,téléphones",row,"",20,replace_dict=standard_replace_dict,header=header),
                    nationality=idx("nationality",row,"Francaise",replace_dict=standard_replace_dict,header=header),
                    country=idx("country,pays",row,"France",header=header),
                    birthdate=dt,
                    department=translate(department,sections=["departements"]),
                    job=idx("job,metier,competences",row,"",60,replace_dict=standard_replace_dict,header=header),
                    degree_year=promo,
                    address=idx("address,adresse",row,"",200,replace_dict=standard_replace_dict,header=header),
                    department_category=department_category,
                    town=idx("town,ville",row,"",50,replace_dict=standard_replace_dict,header=header),
                    source=idx("source", row, "FEMIS",50,replace_dict=standard_replace_dict,header=header),
                    cp=idx("zip,cp,codepostal,code_postal,postal_code,postalcode",row,"",5,replace_dict=standard_replace_dict,header=header),
                    website=stringToUrl(idx("website,siteweb,site,url",row,"",replace_dict=standard_replace_dict,header=header)),
                    biography=idx("biographie",row,"",header=header),
                    crm=idx("crm,oasis",row,header=header),

                    facebook=idx("facebook",row,"",header=header),
                    instagram=idx("instagram",row,"",header=header),
                    vimeo=idx("vimeo",row,"",header=header),
                    tiktok=idx("tiktok",row,"",header=header),
                    linkedin=idx("linkedin", row, "",header=header),

                    email=email,
                    photo=photo,

                    cursus=cursus
                )

                try:
                    if len(profil.email)>0:
                        res=Profil.objects.filter(email__iexact=profil.email,lastname__iexact=profil.lastname).all()
                        hasChanged=True
                        if len(res)>0:
                            #log("Le profil existe déjà")
                            profil,hasChanged=fusion(res.first(),profil)

                    if hasChanged:
                        log("Mise a jour de "+firstname+" "+lastname)
                        profil.save()

                    #log(profil.lastname + " est enregistré")
                    record=record+1
                except Exception as inst:
                    log("Probléme d'enregistrement de "+email+" :"+str(inst))
                    non_import.append(str(profil))
            else:
                log("Le profil "+str(row)+" ne peut être importée")
                non_import.append(str(profil))
        i=i+1

    return record,non_import



def add_pows_to_profil(profil,links,job_for,refresh_delay_page,bot=None,content=None,user:User=None):
    """
    Ajoute des oeuvres au profil
    :param profil:
    :param links:
    :param all_links:
    :return:
    """
    n_films=0
    n_works=0
    articles=list()
    job_for=remove_accents(remove_ponctuation(job_for))

    for l in links:
        source = "auto"
        film = None
        pow = None

        if "unifrance" in l["url"]:
            film = extract_film_from_unifrance(l["url"],refresh_delay=refresh_delay_page)

        if "source" in l and "LeFilmFrancais" in l["source"]:
            film = extract_film_from_leFilmFrancais(l["url"], job_for=job_for, refresh_delay=refresh_delay_page,bot=bot)

        if "imdb" in l["url"]:
            film = extract_film_from_imdb(l["url"], l["text"],job=l["job"],refresh_delay=refresh_delay_page)
            if film and (film["category"]=="News" or len(film["nature"])==0) \
                    or (film["nature"]=="Documentaire" and "acteurtrice" in film["job"]) \
                    or film["job"]==["Remerciements"] or film["job"]==["Casting"] \
                    or (not "year" in film):
                log("Ce type d'événement est exclue :"+str(film))
                film=None

        jobs=[]
        if not film is None:
            #Recherche les métiers qu'a exercé la personne sur le film
            for k in film["casting"].keys():
                for c in film["casting"][k]:
                    if equal_str(c["index"],profil.name_index):
                        jobs.append(k) #On ajoute le métier k à la personne

        if not film is None and len(jobs)>0:
            if not "nature" in film: film["nature"] = l["nature"]
            if "title" in film: log("Traitement de " + film["title"] + " à l'adresse " + l["url"])

            pow=dict_to_pow(film,content)

            try:
                result=PieceOfWork.objects.filter(title_index__iexact=pow.title_index)
                if len(result)>0:
                    bFindMovie=False
                    for p in result:
                        if p.year is None or abs(int(p.year)-int(pow.year))<=1:
                            bFindMovie=True
                            log("Le film existe déjà dans la base, on le met a jour avec les nouvelles données")
                            pow,hasChanged=fusion(p,pow)
                            if hasChanged:
                                pow.dtLastSearch=datetime.now()
                                pow.save()
                                break

                if len(result)==0 or (len(result)>0 and not bFindMovie):
                    n_films=n_films+1
                    pow.dtLastSearch = datetime.now()
                    pow.save()

                # TODO: a réétudier car des mises a jour de fiche pourrait nous faire rater des films
                # il faudrait désindenter le code ci-dessous mais du coup il faudrait retrouver le pow

            except Exception as inst:
                log("Impossible d'enregistrer le film: "+str(inst.args))
        else:
            log("Impossible de retrouver le film: "+str(film))


        if not pow is None:
            if not film is None and "prix" in film and not film["prix"] is None and len(film["prix"]) > 0:
                for award in film["prix"]:
                     a=add_award(
                        festival_title=award["title"],
                        year=award["year"],
                        profil=profil if "profil" in award and equal_str(award["profil"],profil.firstname+" "+profil.lastname) else None,
                        desc=award["desc"],
                        pow_id=pow.id,
                        win=True,
                        url=film["url"]
                    )

            # if "job" in film:
            #     jobs = film["job"]
            # else:
            #     jobs = [profil.job]
            #     log("Le job n'est pas présent dans le film, par defaut on reprend le job du profil")

            for job in jobs:
                t_job = translate(job)
                if len(t_job)==0:
                    if job_for and pow and pow.title: log("!Job non identifié pour "+job_for+" sur "+pow.title)
                else:
                    if not Work.objects.filter(pow_id=pow.id, profil_id=profil.id, job=t_job).exists():
                        if len(t_job)>0:
                            log("Ajout de l'experience " + job + " traduit en " + t_job + " sur " + pow.title + " à " + profil.lastname)
                            work = Work(pow=pow, profil=profil, job=t_job, source=source)
                            try:
                                work.save()
                                create_article("new_work",user,profil=profil, pow=pow, work=work)
                            except Exception as inst:
                                log("Impossible d'enregistrer le travail: " + str(inst.args))
                        else:
                            log("Pas d'enregistrement de la contribution job="+job)

            # Enregistrement du casting
            # if not film is None and "casting" in film:
            #         for p in film["casting"]:
            #             _ps = list(Profil.objects.filter(lastname=p["lastname"], firstname=p["firstname"]))
            #             if len(_ps) == 0:
            #                 log("Ajout de " + p["lastname"] + " comme externe en tant que " + p["job"])
            #                 _p = Profil(firstname=p["firstname"],
            #                             lastname=p["lastname"],
            #                             name_index=index_string(p["firstname"]+p["lastname"]),
            #                             department="Ext",
            #                             cursus="E",
            #                             school="",
            #                             email=p["firstname"] + "." + p["lastname"] + "@fictif")
            #                 _p.add_link(url=p["url"], title=p["source"])
            #                 _p.save()
            #             else:
            #                 _p = _ps[0]
            #
            #             if not Work.objects.filter(pow_id=pow.id, profil_id=_p.id, job=p["job"]).exists():
            #                 work = Work(pow=pow, profil=_p, job=p["job"], source=source)
            #
            #                 work.save()
            #                 n_works=n_works+1

    return n_films,n_works




#http://localhost:8000/api/batch_movies
def exec_batch_movies(pows,refresh_delay=31):
    for pow in list(pows):
        if pow.delay_lastsearch() / 24 > refresh_delay:
            extract_movie_from_bdfci(pow)
        pass
    return 0,0








#http://localhost:8000/api/batch
def exec_batch(profils,refresh_delay_profil=31,
               refresh_delay_pages=31,limit=2000,
               limit_contrib=10,
               content={"unifrance":True,"imdb":True,"lefilmfrancais":False,"senscritique":False},
               remove_works=False):
    """
    Scan des profils
    :param profils:
    :param refresh_delay:
    :return:
    """
    bot = None
    n_films = 0
    n_works=0
    rc_articles=list()

    # all_links=list()
    # for pow in PieceOfWork.objects.all():
    #     for l in pow.links:
    #         all_links.append(l["url"])

    for profil in profils:
        limit=limit-1
        if limit<0 or len(rc_articles)>=limit_contrib:break

        links=[]
        job_for=None

        log("Traitement de " + profil.firstname+" "+profil.lastname+". Dernière recherche "+profil.dtLastSearch.isoformat(" "))
        transact = Profil.objects.filter(id=profil.id)
        if profil.delay_lastsearch()/24 > refresh_delay_profil or len(profils)==1:
            log("mise a jour de "+profil.lastname+" dont la dernière recherche est "+str(profil.delay_lastsearch()/24)+" jours")
            profil.dtLastSearch=datetime.now()

            #infos = extract_profil_from_bellefaye(firstname=profil.firstname, lastname=profil.lastname)
            #log("Extraction bellefaye " + str(infos))

            try:
                imdb_profil_url=None
                if content["imdb"]:
                    infos = extract_profil_from_imdb(firstname=profil.firstname, lastname=profil.lastname.lower(),refresh_delay=refresh_delay_pages,url_profil=profil.get_home("IMDB"))
                    if infos is None:
                        infos=extract_profil_from_imdb(firstname=remove_accents(profil.firstname), lastname=remove_accents(profil.lastname),refresh_delay=refresh_delay_pages,url_profil=profil.get_home("IMDB"))
                    log("Extraction d'imdb " + str(infos))
                    if "url" in infos:
                        profil.add_link(infos["url"], "IMDB")
                        imdb_profil_url = infos["url"]

                    if "photo" in infos and len(profil.photo)==0:profil.photo=infos["photo"]
                    if "links" in infos:
                        if not infos["links"] in links: links=links+infos["links"]
                        if len(infos["links"])==0:
                            log("Aucune info trouvé pour https://www.imdb.com/find?q="+profil.lastname+"&ref_=nv_sr_sm")

                        for film in infos["links"]:
                            for e in film["episodes"]:
                                casting=extract_casting_from_imdb(e["url"])
                                pass

            except Exception as inst:
                log("Probleme d'extration du profil pour "+profil.lastname+" sur imdb"+str(inst.args))

            try:
                if content["lefilmfrancais"]:
                    infos=extract_profil_from_lefimlfrancais(firstname=profil.firstname,lastname=profil.lastname)
                    if "url" in infos:profil.add_link(infos["url"],"LeFilmF")
                    if len(infos["links"])>0:
                        bot=connect_to_lefilmfrancais("jerome.lecanu@gmail.com", "UALHa")
                    links=links+infos["links"]
            except:
                log("Probleme d'extration du profil pour " + profil.lastname + " sur leFilmFrancais")

            if content["unifrance"]:
                infos = extract_profil_from_unifrance(remove_accents(profil.firstname + " " + profil.lastname), refresh_delay=refresh_delay_pages)
                log("Extraction d'un profil d'unifrance "+str(infos))
                if infos is None:
                    advices = dict({"ref": "Vous devriez créer votre profil sur UniFrance"})
                    transact.update(advices=advices)
                else:
                    if len(infos["photo"]) > 0 and not profil.photo.startswith("http"): transact.update(photo=infos["photo"])
                    transact.update(links=profil.add_link(infos["url"], "UniFrance"))
                    if "links" in infos:
                        links=links+infos["links"]
                    #job_for=infos["url"]
                    job_for=profil.firstname+" "+profil.lastname

            if remove_works:
                Work.objects.filter(profil_id=profil.id,source__contains="auto").delete()

            rc_films,rc_works=add_pows_to_profil(profil,links,job_for=job_for,refresh_delay_page=refresh_delay_pages,bot=bot)
            if imdb_profil_url:
                awards=extract_awards_from_imdb(imdb_profil_url)
                for award in awards:
                    add_award(
                        festival_title=award["festival_title"],
                        profil=profil,
                        desc=award["desc"],
                        film_title=award["film_title"],
                        year=award["year"],
                        win=award["win"],
                        url=imdb_profil_url+"/awards"
                    )


            n_films=n_films+rc_films
            n_works=n_works+rc_works

            # log("Extraction de wikipedia")
            # try:
            #     infos = extract_actor_from_wikipedia(firstname=profil.firstname,lastname=profil.lastname)
            #     sleep(random() * 5)
            #     if not infos is None:
            #         if "photo" in infos and profil.photo is None: transact.update(photo=infos["photo"])
            #         if "summary" in infos and profil.biography is None: transact.update(biography=infos["summary"])
            #         if "links" in infos and len(infos["links"])>0:
            #             links=profil.add_link(url=infos["links"][0]["url"], title=infos["links"][0]["title"],description="")
            #             transact.update(links=links)
            # except:
            #     pass

            try:
                transact.update(dtLastSearch=make_aware(profil.dtLastSearch))
            except:
                pass
        else:
            log(profil.lastname+" est déjà à jour")

    #clear_directory("./Temp","html")

    return n_films,n_works


# def find_double():
#     titles=[]
#     for p in Profil.objects.all():
#         titles.append(p.title.lower())
#
#     X = numpy.array(titles)
#     Y=pdist(X,'levinstein')


def analyse_pows(pows,search_with="link",bot=None,cat="unifrance,imdb,lefilmfrancais"):
    """
	Recherche de nouvelles informations issue d'autres source pour un ensemble de films
	:param pows:
	:param search_with:
	:param bot:
	:param cat:
	:return:
	"""
    infos=list()
    for pow in pows:

        pow.dtLastSearch=datetime.now()
        pow.save()

        if search_with=="link":
            for l in pow.links:
                if "auto:IMDB" in l["text"]:info=extract_film_from_imdb(l["url"],pow.title)
                if "auto:unifrance" in l["text"]:info=extract_film_from_unifrance(l["url"],pow.title)

            infos.append(info)

        if search_with=="title":
            title=pow.title
            year=pow.year
            if title and year:
                for source in cat.split(","):
                    log("Analyse de "+source)
                    if source=="unifrance":film=extract_film_from_unifrance(title)
                    if source=="imdb":film=extract_film_from_imdb(title,title=title)
                    if source=="lefilmfrancais":
                        if bot is None:bot = connect_to_lefilmfrancais("jerome.lecanu@gmail.com", "UALHa")
                        film=extract_film_from_leFilmFrancais(title,bot=bot)

                    if film:
                        pow_2=dict_to_pow(film)
                        if pow_2.year==year and equal_str(pow_2.title,title):
                            pow,hasChanged=fusion(pow,pow_2)
                            if hasChanged:pow.save()

    if not bot is None: bot.quit()

    return infos
