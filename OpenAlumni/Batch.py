from asyncio import sleep
from urllib import parse
from urllib.parse import urlparse

#import numpy as np
from django.template.defaultfilters import urlencode
from django.utils.datetime_safe import datetime
from imdb import IMDb
from wikipedia import wikipedia, re

from OpenAlumni.Tools import log, translate, load_page, in_dict
from OpenAlumni.settings import MOVIE_NATURE, DELAY_TO_AUTOSEARCH
from alumni.models import Profil, Work, PieceOfWork

#from scipy import pdist

ia=IMDb()


def extract_movie_from_cnca(title:str):
    #title=title.replace(" ","+")
    obj={
        "RechercheOeuvre_1":{"Tbx_Titre":title}
    }
    #page=wikipedia.BeautifulSoup(wikipedia.requests.post("http://www.cnc-rca.fr/Pages/Page.aspx?view=RecOeuvre",),headers={'User-Agent': 'Mozilla/5.0'}).text, "html5lib")
    return title


def extract_movie_from_bdfci(pow:PieceOfWork):
    title = pow.title.replace(" ", "+")
    page=load_page("https://www.bdfci.info/?q="+title+"&pa=f&d=f&page=search&src=bdfci&startFrom=1&offset=1")
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




def extract_film_from_unifrance(url:str,job_for=None,all_casting=False,refresh_delay=30):
    rc=dict({"casting":[]})
    if not url.startswith("http"):
        log("On passe par la page de recherche pour retrouver le titre")
        page=load_page("https://unifrance.org/recherche?q="+parse.quote(url),refresh_delay=refresh_delay)
        _link=page.find("a",attrs={'href': wikipedia.re.compile("^https://www.unifrance.org/film/[0-9][0-9]")})
        if _link is None:return rc

        url=_link.get("href")

    #r=wikipedia.requests.get(url, headers={'User-Agent': 'Mozilla/5.0',"accept-encoding": "gzip, deflate"})
    #page = wikipedia.BeautifulSoup(str(r.content,encoding="utf-8"),"html5lib")
    page=load_page(url,refresh_delay)
    _title=page.find('h1', attrs={'itemprop': "name"})
    if not _title is None:
        rc["title"]=_title.text
        log("Analyse du film "+rc["title"])

    for title in page.findAll('h1'):
        if "Affiches" in title.text:
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

        if "Année de production : " in div.text:
            rc["year"]=div.text.replace("Année de production : ","")
        if "Genre(s) : " in div.text:
            rc["category"]=translate(div.text.replace("Genre(s) : ",""))
        idx_div=idx_div+1

    if "category" in rc and len(rc["category"])==0:rc["category"]="inconnue"


    if not job_for is None:
        if "real" in rc and rc["real"]==job_for:
            rc["job"]="Réalisation"
        else:
            section=page.find("section",{"id":"casting"})

            if not section is None:
                jobs = section.findAll("h2")
                paras = section.findAll("p")
                #if not "personne" in links[0].href:links.remove(0)
                for idx in range(len(paras)):
                    links=paras[idx].findAll("a")
                    for l in links:
                        job=jobs[idx].text.replace("<h2>","").replace("</h2>","").replace(" : ","")
                        if "/personne" in l.get("href"):
                            if l.get("href")==job_for:
                                rc["job"]=job
                                break
                            else:
                                if all_casting:
                                    #On ajoute l'ensemble du casting au systeme
                                    names = str(l.getText()).split(" ")
                                    lastname =names[len(names)-1]
                                    rc["casting"].append({
                                        "lastname":lastname,
                                        "url":l.attrs["href"],
                                        "source":"unifrance",
                                        "firstname":l.getText().replace(lastname,"").strip(),
                                        "job":job})

    if not "job" in rc:
        pass

    _synopsis = page.find("div", attrs={"itemprop": "description"})
    if not _synopsis is None:rc["synopsis"]=_synopsis.getText(strip=True)

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



def extract_actor_from_unifrance(name="céline sciamma",refresh_delay=31):
    page=load_page("https://www.unifrance.org/recherche/personne?q=$query&sort=pertinence".replace("$query",parse.quote(name)),refresh_delay=refresh_delay)
    links=page.findAll('a', attrs={'href': wikipedia.re.compile("^https://www.unifrance.org/annuaires/personne/")})

    rc=list()
    if len(links)>0:
        u=links[0].get("href")
        page=wikipedia.BeautifulSoup(wikipedia.requests.get(u, headers={'User-Agent': 'Mozilla/5.0'}).text,"html5lib")

        photo = ""
        _photo = page.find('div', attrs={'class': "profil-picture pull-right"})
        if not _photo is None: photo = _photo.find("a").get("href")

        links_film=page.findAll('a', attrs={'href': wikipedia.re.compile("^https://www.unifrance.org/film/[0-9][0-9]*/")})
        for l in links_film:
            rc.append({"url":l.get("href"),"text":l.get("text"),"nature":""})
    else:
        return None

    return {"links":rc,"photo":photo,"url":u}



def extract_profil_from_imdb(lastname:str, firstname:str,refresh_delay=31):
    peoples=ia.search_person(firstname+" "+lastname)
    infos=dict()
    for p in peoples:
        name=p.data["name"].upper()
        if firstname.upper() in name and lastname.upper() in name:
            if not "nopicture" in p.data["headshot"]:
                infos["photo"]=p.data["headshot"]
            if not "url" in infos:
                infos["url"]="https://imdb.com/name/nm"+p.personID+"/"
                log("Ouverture de " + infos["url"])
                page=load_page(infos["url"],refresh_delay=refresh_delay)
                film_zone=page.find("div",{"id":"filmography"})
                if film_zone is None:film_zone=page

                links = film_zone.findAll('a', attrs={'href': wikipedia.re.compile("^/title/tt")})
                infos["links"]=[]
                for l in links:
                    if len(l.getText())>3 and l.parent.parent.parent.parent and l.parent.parent.parent.parent["id"]=="filmography":
                        texts=l.parent.parent.text.split("(")
                        nature="long"
                        job:str=l.parent.parent.get("id").split("-")[0]
                        if job=="miscellaneous" or len(job)==0:
                            temp=l.parent.parent.text.split("(")
                            job=temp[len(temp)-1].split(")")[0]
                            pass

                        url = "https://www.imdb.com" + l.get("href")
                        url = url.split("?")[0]

                        if len(texts)>1:
                            nature = ""
                            for tmp in texts[1:]:
                                tmp=tmp.split(")")[0].lower()
                                if in_dict(tmp,"jobs"):
                                    job=translate(tmp)
                                else:
                                    log("Job absent du dictionnaire "+tmp)

                                if in_dict(tmp,"categories"):
                                    nature=translate(tmp)
                                else:
                                    log("Nature absent du dictionnaire "+tmp)

                            # for nat in MOVIE_NATURE:
                            #     if nat.lower() in texts[1].lower():
                            #         nature=nat
                            #         break
                            # if nature=="":
                            #     log("Nature inconnue depuis "+texts[1]+" pour "+url)


                        infos["links"].append({"url":url,"text":l.getText(),"job":job,"nature":nature})


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



#http://localhost:8000/api/batch
def extract_film_from_imdb(url:str,title:str,name="",job="",all_casting=False,refresh_delay=31):
    """

    :return:
    """
    page=load_page(url,refresh_delay)

    rc = dict({"title": title,"nature":translate("film"),"casting":list()})

    divs=dict()
    elts=page.find_all("div",recursive=True)+page.find_all("h1",recursive=True)+page.find_all("ul",recursive=True)+page.find_all("p")
    for div in elts:
        if "data-testid" in div.attrs:
            divs[div.attrs["data-testid"]]=div

    if not "genres" in divs:
        elt=page.find("li",{"role":"presentation","class":"ipc-inline-list__item"})
        if not elt is None:
            cat=elt.text
        else:
            cat = "inconnu"
    else:
        cat = translate(divs["genres"].text.lower())

    try:
        title=divs["hero-title-block__title"].text
        year=divs["hero-title-block__metadata"].text
        if not year is None:rc["year"]=re.search(r"(\d{4})", year).group(1)
    except:
        log("Erreur sur title="+title)
        return None

    if title.startswith("Episode"):
        section_title = page.find("div", {"class": "titleParent"})
        if not section_title is None: title = section_title.find("a").text + " " + title
        #Recherche de l'épisode
        rc["nature"]=MOVIE_NATURE[0]
        zone_info_comp=page.find("div",{"class":"button_panel navigation_panel"})
        if not zone_info_comp is None and "Season" in zone_info_comp.getText():
            extract_text="S"+zone_info_comp.getText().split("Season")[1].replace("Episode ","E").replace(" | ","").replace(" ","")
            rc["title"]=title+" "+extract_text.split("\n")[0]

    if "storyline-genres" in divs:
        rc["nature"]=translate(divs["storyline-genres"].text)
    else:
        rc["nature"] = MOVIE_NATURE[0]
    rc["category"]=cat
    # if not "category" in rc:
    #     rc["category"]="Inconnue"
    #     log("Pas de categorie pour "+url)

    affiche = divs["hero-media__poster"]
    if not affiche is None and not affiche.find("img") is None: rc["visual"] = affiche.find("img").get("src")

    rc["synopsis"]=""
    if "plot" in divs:
        rc["synopsis"]=divs["plot"].text.replace("Read all","")

    log("Recherche du role sur le film")

    credits=load_page(url+"fullcredits",refresh_delay)
    if not credits is None:
        credits=credits.find("div",{"id":"fullcredits_content"})
        if not credits is None:
            jobs=credits.find_all("h4")
            profils=credits.find_all("table")

            for i in range(0,len(jobs)):
                job = str(jobs[i].getText().replace("\n", "")).replace("by","").strip()
                if "(in credits order)" in job:job="Actor"

                links=profils[i].find_all("a")
                for l in links:
                    if "/name/nm" in l.attrs["href"]:
                        if name.upper() in l.text.upper():
                            rc["job"]=job
                        else:
                            if all_casting:
                                names=l.text.replace("\n","").split(" ")
                                lastname=names[len(names)-1]
                                rc["casting"].append({
                                    "firstname":l.text.replace("\n","").replace(lastname,""),
                                    "lastname":lastname,
                                    "url":l.attrs["href"],
                                    "source":"imdb",
                                    "job":job})

    if not "job" in rc: rc["job"]=job

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
                        rc["links"].append({
                            "title":libs[idx],
                            "url":ref
                        })
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


def create_article(profil:Profil, pow:PieceOfWork, work:Work, template:str):
    rc=template["code"]
    fields=rc.split("{{")[1:]
    for field in fields:
        model=field.split(".")[0]
        field=field.split("}}")[0].replace(model+".","")
        if model=="profil":value=getattr(profil,field)
        if model=="pow" :value=getattr(pow,field)
        if model=="work":value=getattr(work,field)
        if not value is None:
            if type(value)==int:value=str(value)
            rc=rc.replace("{{"+model+"."+field+"}}",value)

    return rc



def add_pows_to_profil(profil,links,all_links,job_for,refresh_delay,templates=[]):
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

    for l in links:
        source = "auto"
        pow = None
        for p in PieceOfWork.objects.filter(title__iexact=l["text"]):
            for link in p.links:
                if l["url"] == link["url"]:
                    pow=p
                    break

        if not pow:
            film=None
            if "unifrance" in l["url"]:
                source = "auto:unifrance"
                film = extract_film_from_unifrance(l["url"], job_for=job_for,refresh_delay=refresh_delay)

            if "imdb" in l["url"]:
                source = "auto:IMDB"
                film = extract_film_from_imdb(l["url"], l["text"], name=profil.firstname + " " + profil.lastname,job=l["job"],refresh_delay=refresh_delay)

            if not film is None and "title" in film:
                if not "nature" in film: film["nature"] = l["nature"]
                if "title" in film: log("Traitement de " + film["title"] + " à l'adresse " + l["url"])

                pow = PieceOfWork(title=film["title"])
                pow.add_link(url=l["url"], title=source)
                pow.add_link(extract_film_from_senscritique(film["title"]),title="Sens-critique")
                if "nature" in film:
                    pow.nature=translate(film["nature"])
                else:
                    pow.nature="Film"

                if "synopsis" in film: pow.description = film["synopsis"]
                if "visual" in film: pow.visual = film["visual"]
                if "category" in film: pow.category = translate(film["category"])
                if "year" in film: pow.year = film["year"]

                try:
                    result=PieceOfWork.objects.filter(title__iexact=pow.title)
                    if len(result)>0:
                        log("Le film existe déjà dans la base, on le récupére")
                        pow=result.first()
                        pow.add_link(l["url"],source)
                    else:
                        n_films=n_films+1

                    pow.save()

                    # TODO: a réétudier car des mises a jour de fiche pourrait nous faire rater des films
                    # il faudrait désindenter le code ci-dessous mais du coup il faudrait retrouver le pow
                    job = profil.job
                    if "job" in film: job = film["job"]

                except Exception as inst:
                    log("Impossible d'enregistrer le film: "+str(inst.args))
            else:
                job = l["job"]
                film = dict()

            if not pow is None:
                t_job = translate(job)
                if not Work.objects.filter(pow_id=pow.id, profil_id=profil.id, job=t_job).exists():
                    if job is not None and t_job is not None:
                        log("Ajout de l'experience " + job + " traduit en " + t_job + " sur " + pow.title + " à " + profil.lastname)
                        work = Work(pow=pow, profil=profil, job=t_job, source=source)
                        work.save()
                        if len(templates) > 0: articles.append(create_article(profil, pow, work, templates[0]))
                    else:
                        log("Pas d'enregistrement de la contribution")

                # Enregistrement du casting
                if "casting" in film:
                    for p in film["casting"]:
                        _ps = list(Profil.objects.filter(lastname=p["lastname"], firstname=p["firstname"]))
                        if len(_ps) == 0:
                            log("Ajout de " + p["lastname"] + " comme externe en tant que " + p["job"])
                            _p = Profil(firstname=p["firstname"],
                                        lastname=p["lastname"],
                                        department="Ext",
                                        cursus="E",
                                        school="",
                                        email=p["firstname"] + "." + p["lastname"] + "@fictif")
                            _p.add_link(url=p["url"], title=p["source"])
                            _p.save()
                        else:
                            _p = _ps[0]

                        if not Work.objects.filter(pow_id=pow.id, profil_id=_p.id, job=p["job"]).exists():
                            work = Work(pow=pow, profil=_p, job=p["job"], source=source)

                            work.save()
                            n_works=n_works+1

    return n_films,n_works,articles




#http://localhost:8000/api/batch_movies
def exec_batch_movies(pows,refresh_delay=31):
    for pow in list(pows):
        if pow.delay_lastsearch() / 24 > DELAY_TO_AUTOSEARCH:
            extract_movie_from_bdfci(pow)
        pass
    return 0,0


#http://localhost:8000/api/batch
def exec_batch(profils,refresh_delay=31,limit=2000,limit_contrib=10,templates=list()):
    """
    Scan des profils
    :param profils:
    :param refresh_delay:
    :return:
    """
    n_films = 0
    n_works=0
    rc_articles=list()
    all_links=list()
    for pow in PieceOfWork.objects.all():
        for l in pow.links:
            all_links.append(l["url"])

    for profil in profils:
        limit=limit-1
        if limit<0 or len(rc_articles)>=limit_contrib:break

        links=[]
        job_for=None

        log("Traitement de " + profil.firstname+" "+profil.lastname+". Dernière recherche "+profil.dtLastSearch.isoformat(" "))
        transact = Profil.objects.filter(id=profil.id)
        if profil.delay_lastsearch()/24 > DELAY_TO_AUTOSEARCH or len(profils)==1:
            log("mise a jour de "+profil.lastname+" dont la dernière recherche est "+str(profil.delay_lastsearch()/24)+" jours")
            profil.dtLastSearch=datetime.now()

            #infos = extract_profil_from_bellefaye(firstname=profil.firstname, lastname=profil.lastname)
            #log("Extraction bellefaye " + str(infos))

            try:
                infos = extract_profil_from_imdb(firstname=profil.firstname, lastname=profil.lastname,refresh_delay=refresh_delay)
                log("Extraction d'imdb " + str(infos))
                if "url" in infos:profil.add_link(infos["url"], "IMDB")
                if "photo" in infos and len(profil.photo)==0:profil.photo=infos["photo"]
                if "links" in infos: links=links+infos["links"]
            except:
                log("Probleme d'extration du profil pour "+profil.lastname+" sur imdb")

            infos = extract_actor_from_unifrance(profil.firstname + " " + profil.lastname,refresh_delay=refresh_delay)
            log("Extraction d'un profil d'unifrance "+str(infos))
            if infos is None:
                advices = dict({"ref": "Vous devriez créer votre profil sur UniFrance"})
                transact.update(advices=advices)
            else:
                if len(infos["photo"]) > 0 and not profil.photo.startswith("http"): transact.update(photo=infos["photo"])
                transact.update(links=profil.add_link(infos["url"], "UniFrance"))
                if "links" in infos:
                    links=links+infos["links"]
                job_for=infos["url"]


            rc_films,rc_works,articles=add_pows_to_profil(profil,links,all_links,job_for=job_for,refresh_delay=refresh_delay,templates=templates)
            rc_articles.append(articles)
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

            transact.update(dtLastSearch=profil.dtLastSearch)
        else:
            log(profil.lastname+" est déjà à jour")

    #clear_directory("./Temp","html")

    return n_films,n_works,rc_articles


# def find_double():
#     titles=[]
#     for p in Profil.objects.all():
#         titles.append(p.title.lower())
#
#     X = numpy.array(titles)
#     Y=pdist(X,'levinstein')



