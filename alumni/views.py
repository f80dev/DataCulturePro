import base64
import csv

from datetime import datetime, timedelta
from io import StringIO, BytesIO
from json import loads

from urllib.request import urlopen

import pandasql
import yaml
import pandas as pd
from django.core.serializers import json

from OpenAlumni.DataQuality import  ProfilAnalyzer, PowAnalyzer
from OpenAlumni.analytics import StatGraph

pd.options.plotting.backend = "plotly"

from django.http import JsonResponse, HttpResponse
from django.utils.http import urlquote
from django_elasticsearch_dsl import Index
from django_elasticsearch_dsl_drf.constants import LOOKUP_QUERY_IN, \
    SUGGESTER_COMPLETION, LOOKUP_FILTER_TERMS, \
    LOOKUP_FILTER_PREFIX, LOOKUP_FILTER_WILDCARD, LOOKUP_QUERY_EXCLUDE, LOOKUP_FILTER_TERM
from django_elasticsearch_dsl_drf.filter_backends import FilteringFilterBackend, IdsFilterBackend, \
    OrderingFilterBackend, DefaultOrderingFilterBackend, SearchFilterBackend
from django_elasticsearch_dsl_drf.pagination import PageNumberPagination, LimitOffsetPagination
from django_elasticsearch_dsl_drf.viewsets import  DocumentViewSet
from django_filters.rest_framework import DjangoFilterBackend
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from erdpy.accounts import Account
from rest_framework.decorators import api_view,  permission_classes, renderer_classes

from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from selenium.webdriver import DesiredCapabilities
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.proxy import ProxyType, Proxy

import requests
from django.contrib.auth.models import User, Group

# Create your views here.
from django.shortcuts import redirect
from rest_framework import viewsets, generics

from OpenAlumni.Batch import exec_batch, exec_batch_movies
from OpenAlumni.Tools import dateToTimestamp, stringToUrl, reset_password, log, sendmail, to_xml, translate, levenshtein, getConfig
from OpenAlumni.nft import NFTservice
import os

if os.environ.get("DEBUG"):
    from OpenAlumni.settings_dev import *
else:
    from OpenAlumni.settings import *


from OpenAlumni.social import SocialGraph
from alumni.documents import ProfilDocument, PowDocument
from alumni.models import Profil, ExtraUser, PieceOfWork, Work, Article, Company
from alumni.serializers import UserSerializer, GroupSerializer, ProfilSerializer, ExtraUserSerializer, POWSerializer, \
    WorkSerializer, ExtraPOWSerializer, ExtraWorkSerializer, ProfilDocumentSerializer, \
    PowDocumentSerializer, WorksCSVRenderer, ArticleSerializer, ExtraProfilSerializer, ProfilsCSVRenderer, \
    CompanySerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    exemples:
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = (AllowAny,)
    filter_backends = (SearchFilter,DjangoFilterBackend)
    search_fields = ["email","id"]
    filter_fields =("email",)



class ExtraUserViewSet(viewsets.ModelViewSet):
    """
    Permet la consultation des informations sur le model user enrichie (extra user)
    """
    queryset = ExtraUser.objects.all()
    serializer_class = ExtraUserSerializer
    permission_classes = (AllowAny,)
    filter_backends = (SearchFilter,DjangoFilterBackend,)
    search_fields=["user__email"]
    filter_fields = ("user__email","id")

    def partial_update(self, request, pk=None):
        pass



class UserCreate(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (AllowAny, )



class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer



#http://localhost:8000/api/profils?firstname=aline
class ProfilViewSet(viewsets.ModelViewSet):
    """
    API de gestion des profils
    """
    queryset = Profil.objects.all()
    serializer_class = ProfilSerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,DjangoFilterBackend)
    search_fields = ["email"]
    filter_fields=("school","email","firstname",)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,)
    filter_fields=("name","siret",)


class ExtraProfilViewSet(viewsets.ModelViewSet):
    queryset = Profil.objects.all()
    serializer_class = ExtraProfilSerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,DjangoFilterBackend)
    search_fields = ["lastname","email","degree_year","department"]
    filter_fields=("lastname","firstname","email","degree_year","department")



class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,)
    search_fields = ["autor"]





#http://localhost:8000/api/pow
class POWViewSet(viewsets.ModelViewSet):
    queryset = PieceOfWork.objects.filter(works__source__in=SOURCES).all()
    serializer_class = POWSerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,DjangoFilterBackend,)
    search_fields=["title","category","nature","year"]
    filter_fields = ("id", "title","owner", "category", "year","nature",)


#http://localhost:8000/api/extraworks/
class ExtraWorkViewSet(viewsets.ModelViewSet):
    queryset = Work.objects.all()
    serializer_class = ExtraWorkSerializer
    permission_classes = [AllowAny]
    filter_fields = ('job',"pow__id","profil__id","profil__email","profil__school")


class WorkViewSet(viewsets.ModelViewSet):
    queryset = Work.objects.all()
    serializer_class = WorkSerializer
    permission_classes = [AllowAny]
    search_fields=["id"]
    filter_fields=("profil","pow","job")


#http://localhost:8000/api/extrapows
class ExtraPOWViewSet(viewsets.ModelViewSet):
    queryset = Work.objects.all()
    serializer_class = ExtraPOWSerializer
    permission_classes = [AllowAny]


@api_view(["GET"])
@permission_classes([AllowAny])
def getyaml(request):
    """
    Permet la récupération d'un fichier yaml
    :param request:
    :return:
    """
    url=request.GET.get("url","")
    if len(url)==0:
        name=request.GET.get("name","profil")
        f=open(STATIC_ROOT+"/"+name+".yaml", "r",encoding="utf-8")
    else:
        f=urlopen(url)
    result=yaml.safe_load(f.read())
    return JsonResponse(result,safe=False)



@api_view(["GET"])
@permission_classes([AllowAny])
def infos_server(request):
    rc=dict()
    rc["films"]["nombre"]=PieceOfWork.objects.count()
    rc["profils"]["nombre"]=Profil.objects.count()
    return JsonResponse(rc)


@api_view(["GET"])
@permission_classes([AllowAny])
def update_extrauser(request):
    """

    :param request:
    :return:
    """
    email=request.GET.get("email","")
    if len(email)>0:
        profils=Profil.objects.filter(email__exact=email)
        if len(profils)>0:
            log("Mise a jour du profil de l'utilisateur se connectant")
            user=ExtraUser.objects.get(user__email=email)
            if not user is None:
                user.profil=profils.first()
                user.save()
                return JsonResponse({"message":"User update"})

    return JsonResponse({"message": "No update"})





@api_view(["GET"])
@permission_classes([AllowAny])
def resend(request):
    email=request.GET.get("email")
    users=User.objects.filter(email=email)
    if len(users)==1:
        users[0].set_password(reset_password(users[0].email,users[0].username))
        users[0].save()
    return Response({"message":"Check your email"})



#http://localhost:8000/api/init_nft
@api_view(["GET"])
@permission_classes([AllowAny])
def init_nft(request):
    nft=NFTservice()
    rc=nft.init_token()
    return JsonResponse({"result":rc})


#http://localhost:8000/api/test
@api_view(["GET"])
@permission_classes([AllowAny])
def test(request):
    profil = Profil(
        firstname='paul',
        school="FEMIS",
        lastname="dudule",
        gender="M",
        mobile="0619750804",
        birthdate=datetime(1971,2,4,13,0,0,0),
        department="",
        degree_year="2022",
        address="12 rue martel",
        town="paris",
        cp="75010",
        email="paul.dudule@gmail.com"
    )
    profil.save()
    return JsonResponse({"result":profil})



@api_view(["GET"])
@permission_classes([AllowAny])
def askfriend(request):
    u=ExtraUser.objects.filter(id=request.GET.get("to"))
    asks=u.ask
    asks.append(request.GET.get("from"))
    u.update(ask=asks)
    return JsonResponse(u)



@api_view(["GET"])
@permission_classes([AllowAny])
def write_nft(request):
    p=Profil.objects.get(id= request.GET.get("id"))
    if len(p.blockchain)==0:
        rc=NFTservice().post("FEMIS:"+p.firstname+" "+p.lastname,p.department+" ("+p.promo+")",occ=10)
        if len(rc)>0:
            if len(rc[0]["result"])>1:
                p.blockchain=str(rc[0]["result"][1]).encode().hex()
                p.save()
                return JsonResponse({"nft_id":p.blockchain})
            else:
                return rc[0]["returnMessage"], 500
    else:
        return "déjà présent",500





@api_view(["GET"])
@permission_classes([AllowAny])
def nfts(request):
    _u=Account(pem_file=ADMIN_PEMFILE)
    url=BC_PROXY+"/address/"+_u.address.bech32()+"/esdt/"
    r=requests.get(url).json()
    rc=[]
    for t in r["data"]["esdts"]:
        if t.startswith(TOKEN_ID):
            nft=r["data"]["esdts"][t]
            try:
                nft["attributes"]=str(base64.b64decode(nft["attributes"]),"utf8")
                rc.append(nft)
            except:
                pass
    return JsonResponse({"results":rc})





#http://localhost:8000/api/jobsites/12/
@api_view(["GET"])
@permission_classes([AllowAny])
def refresh_jobsites(request):
    with open(STATIC_ROOT+"/jobsites.yaml", 'r', encoding='utf8') as f:
        text:str=f.read()

    profil=Profil.objects.get(id=request.GET.get("profil"))
    job=request.GET.get("job","")
    if len(job)==0:job=profil.job

    text = text.replace("%job%", urlquote(job))
    text = text.replace("%lastname%", urlquote(profil.lastname))
    text = text.replace("%firstname%", urlquote(profil.firstname))

    sites=yaml.load(text)
    return JsonResponse({"sites":sites,"job":profil.job})




#http://localhost:8000/api/update_dictionnary/
@api_view(["GET"])
@permission_classes([AllowAny])
def update_dictionnary(request):
    """
    Consiste à uniformiser la terminologie des métiers en fonction de l'état du dictionnaire
    :param request:
    :return:
    """
    log("Application du dictionnaire sur les métiers")
    for w in Work.objects.all():
        job=translate(w.job)
        if job!=w.job:
            log("Traitement de "+str(w.job))
            if not job is None:
                w.job=job
                w.save()

    log("Application du dictionnaire sur les oeuvres")
    for p in PieceOfWork.objects.all():
        category=translate(p.category)
        if category!=p.category:
            log("Traitement de " + str(p.title))
            p.category=category
            p.save()

    return Response({"message":"ok"})


#http://localhost:8000/api/search?q=hoareau
@api_view(["GET"])
@permission_classes([AllowAny])
def search(request):
    q=request.GET.get("q","")
    s=Search().using(Elasticsearch()).query("match",title=q)
    return s.execute()



#http://localhost:8000/api/reindex/
@api_view(["GET"])
@permission_classes([AllowAny])
def rebuild_index(request):
    """
    Relance l'indexation d'elasticsearch
    TODO: en chantier
    :param request:
    :return:
    """
    p=ProfilDocument()
    p.init("profils")

    m=PowDocument()
    m.init("pows")

    return JsonResponse({"message":"Re-indexage terminé"})





#http://localhost:8000/api/batch
#https://server.f80.fr:8000/api/batch
@api_view(["GET"])
@permission_classes([AllowAny])
def batch(request):
    filter= request.GET.get("filter", "*")
    limit= request.GET.get("limit", 2000)
    limit_contrib=request.GET.get("contrib", 2000)

    profils=Profil.objects.order_by("dtLastSearch").all()
    refresh_delay=31
    if filter!="*":
        profils=Profil.objects.filter(id=filter,school="FEMIS")
        profils.update(auto_updates="0,0,0,0,0,0")
        refresh_delay=0.1

    f=open(STATIC_ROOT+"/news_template.yaml", "r",encoding="utf-8")
    templates=yaml.safe_load(f.read())
    f.close()

    profils=profils.order_by("dtLastSearch")

    n_films,n_works,articles=exec_batch(profils,refresh_delay,int(limit),int(limit_contrib),templates["templates"])
    articles=[x for x in articles if x]

    return Response({"message":"ok","films":n_films,"works":n_works,"articles":articles})


#http://localhost:8000/api/quality_filter
#https://server.f80.fr:8000/api/quality_filter
@api_view(["GET"])
@permission_classes([AllowAny])
def quality_filter(request):
    filter= request.GET.get("filter", "*")
    ope = request.GET.get("ope", "profils,films")
    profils=Profil.objects.order_by("dtLastSearch").all()
    if filter!="*":
        profils=Profil.objects.filter(id=filter,school="FEMIS")

    if "profils" in ope:
        profil_filter = ProfilAnalyzer()
        n_profils,log=profil_filter.analyse(profils)

    if "films" in ope:
        pow_analyzer=PowAnalyzer(PieceOfWork.objects.all())
        pow_analyzer.find_double()

    return Response({"message":"ok","profils modifies":n_profils,"anomalie":log})



@api_view(["GET"])
@permission_classes([AllowAny])
def batch_movie(request):
    filter=request.GET.get("filter", "*")
    refresh_delay=31
    if filter!="*":
        pows=PieceOfWork.objects.filter(id=filter,school="FEMIS")
        refresh_delay=0.1
    else:
        pows=PieceOfWork.objects.all()

    n_films,n_works=exec_batch_movies(pows,refresh_delay)
    return Response({"message":"ok","films":n_films,"works":n_works})


@api_view(["GET"])
@permission_classes([AllowAny])
def get_students(request):
    sponsor_id = request.GET.get("sponsor", "")
    profils=Profil.objects.filter(sponsorBy__id=sponsor_id)
    return JsonResponse(list(profils.values()),safe=False)


@api_view(["GET"])
@permission_classes([AllowAny])
def initdb(request):
    return Response({"message": "Base initialisée"})



@api_view(["GET"])
@permission_classes([IsAuthenticatedOrReadOnly])
def helloworld(request):
    return Response({"message": "Hello world"})


#test: http://localhost:8000/api/set_perms/?user=6&perm=statistique&response=accept
#Accepter la demande de changement de status
@api_view(["GET"])
@permission_classes([IsAuthenticatedOrReadOnly])
def set_perms(request):
    profil_id = request.GET.get("perm")
    response = request.GET.get("response")
    ext_users = ExtraUser.objects.filter(user__id=int(request.GET.get("user")))
    if len(ext_users.values())>0:
        ext_user=ext_users.first()
        if response=="accept":
            perms = yaml.safe_load(open(STATIC_ROOT + "/profils.yaml", "r", encoding="utf-8").read())
            for p in perms["profils"]:
                if p["id"]==profil_id:
                    ext_user.perm=p["perm"]
                    ext_user.save()
                    sendmail("Acces à '" + profil_id + "'", ext_user.user.email,"accept_perm",
                             dict(
                                 {
                                     "ask_user": ext_user.user.email,
                                     "ask_perm": profil_id,
                                 }
                             ))
                    break

            return Response({"message": "perm Accepted"})
        else:
            sendmail("Refus d'acces à '"+ profil_id + "'",ext_user.user.email,"refuse_perm",
                     dict(
                         {
                             "ask_user": ext_user.user.email,
                            "ask_perm": profil_id,
                        }
                     ))
            return Response({"message": "perm rejected"})






@api_view(["GET"])
@permission_classes([IsAuthenticatedOrReadOnly])
def ask_perms(request):
    perm_id=request.GET.get("perm")
    ext_user = ExtraUser.objects.filter(id=request.GET.get("user")).first()

    sel_profil=dict()
    profils = yaml.safe_load(open(STATIC_ROOT + "/profils.yaml", "r", encoding="utf-8").read())
    for p in profils["profils"]:
        if p["id"]==perm_id:
            sel_profil=p
            break

    sendmail("Votre demande d'acces à DataCulturePro'", ext_user.user.email, "confirm_ask_perm", dict(
        {
            "profil":sel_profil["title"]
        }
    ))

    sendmail("Demande d'acces '"+perm_id+"' pour "+ext_user.user.email,EMAIL_PERM_VALIDATOR,"ask_perm",dict(
                             {
                                "ask_user":ext_user.user.email,
                                "ask_perm":perm_id,
                                "detail_perm":sel_profil["perm"],
                                "url_ok":getConfig("API_SERVER")+"/api/set_perms/?user="+str(ext_user.user.id)+"&perm="+perm_id+"&response=accept",
                                "url_cancel": getConfig("API_SERVER") + "/api/set_perms/?user=" + str(ext_user.user.id) + "&perm=" + perm_id + "&response=refuse"
                              })
             )

    return Response({"message": "Hello world"})





@api_view(["GET"])
@permission_classes([IsAuthenticatedOrReadOnly])
def rebuild_index_old(request):
    index_name=request.GET.get("name","profils")
    es = Index(index_name,using="default")
    if es.exists():es.delete()
    es.create("default")
    es.save("default")
    return Response({"message": "Reconstruction de l'index "+index_name+" terminée"})



@api_view(["GET"])
def scrap_linkedin(request):
    """
    test: http://localhost:8000/api/scrap_linkedin
    :return:
    """
    proxy=request.GET.get("proxy","")
    capabilities = DesiredCapabilities.CHROME
    if len(proxy) > 0:
        p = Proxy()
        p.proxy_type = ProxyType.MANUAL
        p.http_proxy = proxy
        p.socks_proxy = proxy
        p.ssl_proxy = proxy
        p.add_to_capabilities(capabilities)

    url="https://www.linkedin.com/in/hhoareau/"
    driver:WebDriver = WebDriver(command_executor="http://127.0.0.1:9515", desired_capabilities=capabilities)
    driver.implicitly_wait(1)
    driver.get(url)
    sections=driver.find_elements_by_tag_name("section")
    return Response("scrapped",200)




#http://localhost:8000/api/raz/
@api_view(["GET"])
@permission_classes([AllowAny])
def raz(request):
    filter=request.GET.get("tables","all")
    log("Effacement de "+filter)

    if "profils" in filter or filter=="all":
        log("Effacement des profils")
        Profil.objects.all().delete()

    if "users" in filter  or filter=="all":
        log("Effacement des utilisateurs")
        User.objects.all().delete()

    if "pows" in filter  or filter=="all":
        log("Effacement des oeuvres")
        PieceOfWork.objects.all().delete()

    if "work" in filter or filter=="all":
        log("Effacement des contributions")
        if "imdb" in filter:
            Work.objects.filter(source="imdb").delete()
        elif "unifrance" in filter:
            Work.objects.filter(source="unifrance").delete()
        else:
            Work.objects.all().delete()

    log("Effacement de la base terminée")
    return Response({"message":"Compte effacé"})



@api_view(["GET"])
@permission_classes([AllowAny])
def show_movies(request):
    year=request.GET.get("year",10)
    department=request.GET.get("department","image")
    films=list(PieceOfWork.objects.filter(works__profil__degree_year=year,works__profil__department=department))
    return JsonResponse({"movies":films},status=200)



@api_view(["GET"])
@permission_classes([AllowAny])
def ask_for_update(request):
    delay_notif=request.GET.get("delay_notif",10)
    obso_max = request.GET.get("obso_max", 20)
    now=datetime.timestamp(datetime.now())
    count=0
    for profil in Profil.objects.all():
        days=(now-dateToTimestamp(profil.dtLastUpdate))/(3600*24)
        days_notif=(now-dateToTimestamp(profil.dtLastNotif))/(3600*24)

        #TODO: a compléter avec d'autres criteres
        profil.obsolescenceScore=days*2

        if profil.obsolescenceScore>obso_max and days_notif>delay_notif:
            Profil.objects.filter(id=profil.id).update(dtLastNotif=datetime.now(),obsolescenceScore=profil.obsolescenceScore)
            sendmail("Mettre a jour votre profil",[profil.email],"update",{
                "name":profil.firstname,
                "appname":APPNAME,
                "url":DOMAIN_APPLI+"/edit?id="+str(profil.id)+"&email="+profil.email,
                "lastUpdate":str(profil.dtLastUpdate)
            })
            count=count+1
        else:
            Profil.objects.filter(id=profil.id).update(obsolescenceScore=profil.obsolescenceScore)

    return Response("Message envoyé à "+str(count)+" comptes", status=200)


#http://localhost:8000/api/importer/
@api_view(["POST"])
@permission_classes([AllowAny])
def send_to(request):
    body=request.data
    text=body["text"].replace("&#8217;","")

    social_link=""
    if "social" in body and "value" in body["social"] and len(body["social"]["value"])>0:
        social_link="<br>Vous pouvez répondre directement via <a href='"+body["social"]["value"]+"'>"+body["social"]["label"]+"</a>"

    log("Envoie du mail " + text)

    _from=User.objects.get(id=body["_from"])
    _profil=Profil.objects.get(id=body['_to'])

    #TODO vérifier la black liste

    cc=""
    if "send_copy" in body and body["send_copy"]: cc = _from["email"]
    fullname=_from.first_name+" "+_from.last_name
    sendmail(
        subject="["+APPNAME+"] Message de "+fullname,
        template="contact.html",
        field={"text":text,"social_link":social_link,"fullname":fullname},
        _to=[_profil.email,cc]
    )

    return Response("Message envoyé", status=200)


#Exemple : http://localhost:8000/api/social_graph/
@api_view(["GET"])
@renderer_classes((WorksCSVRenderer,))
@permission_classes([AllowAny])
def social_graph(request,format="json"):
    """
    Retourne la matrice des relations
    :param request:
    :return:
    """
    G=SocialGraph()
    G.load(request.GET.get("filter"),request.GET.get("film")!="false")
    G.eval(request.GET.get("eval"))
    G.filter("pagerank",0.0005)

    if format=="json":
        return JsonResponse(G.export(format))
    else:
        with open(G.export(format), 'rb') as f:
            file_data = f.read()

        response = HttpResponse(content=file_data,content_type='plain/text')
        response["Content-Disposition"] = 'attachment; filename="femis.'+format+'"'
        return response



#http://localhost:8000/api/export_profils/
@api_view(["GET"])
@renderer_classes((ProfilsCSVRenderer,))
@permission_classes([AllowAny])
def export_profils(request):
    cursus:str=request.GET.get("cursus","S")
    profils=Profil.objects.filter(cursus__exact=cursus)
    df: pd.DataFrame = pd.DataFrame.from_records(list(profils.values(
        "id", "photo","gender", "lastname", "firstname", "email","mobile","department","address","cp", "town","country",
        "birthdate","nationality","degree_year" ,"job","cursus"
    )))
    df.columns = ProfilsCSVRenderer.header

    #Formatage du fichier d'export pour OASIS
    df=df.replace("/assets/img/boy.png","")
    df=df.replace("/assets/img/girl.png","")
    df = df.replace("/assets/img/anonymous.png", "")
    df["mobile"]=df["mobile"].replace(" ","")
    df["email"] = df["email"].replace(" ", "")
    df["nationality"]=df["nationality"].replace("","France")
    df["source"]="DCP"

    response = HttpResponse(content_type='text/csv; charset=ansi')
    response["Content-Disposition"]='attachment; filename="profils.csv"'
    df.to_csv(response,sep=";",encoding="ansi")
    return response

def compare(lst,val,ope):
    rc=[]
    val=float(val)
    for i in lst:
        if i is None:
            rc.append(False)
        else:
            i=float(i)
            if ope==">":
                rc.append(i>val)
            else:
                rc.append(i < val)
    return rc


from dict2xml import dict2xml as xmlify
#http://localhost:8000/api/export_all/csv/
#http://localhost:8000/api/export_all/xls/
#http://localhost:8000/api/export_all/xml/
#http://localhost:8000/api/export_all/json/
@api_view(["GET","POST"])
@renderer_classes((WorksCSVRenderer,))
@permission_classes([AllowAny])
def export_all(request):
    """
    Exportation statistiques pour consolidation
    :param request:
    :return:
    """
    headers=WorksCSVRenderer.header
    works=Work.objects.all()
    df:pd.DataFrame = pd.DataFrame.from_records(list(works.values(
        "profil__id","profil__gender","profil__lastname","profil__firstname","profil__department","profil__cursus","profil__degree_year","profil__cp","profil__town",
        "pow__id","pow__title","pow__nature","pow__category","pow__year","pow__budget","pow__production",
        "id","job","comment","validate","source","state"
    )))
    df.columns=headers
    lib_columns=",".join(list(df.columns))

    format=request.GET.get("out","json")

    cols=request.GET.get("cols")
    if not cols is None and cols!="undefined":
        log("On ne conserve que "+cols+" dans "+","+lib_columns)
        df=df[cols.split(",")].drop_duplicates()

    sql=request.GET.get("sql")
    if not sql is None:
        if "from df" not in sql.lower():sql=sql+" FROM df"
        df=pandasql.sqldf(sql)

    if request.GET.get("percent","False")=="True":
        sum=df.groupby(request.GET.get("x",df.columns[0])).sum().apply(lambda x: 100 * x / float(x.sum())).values
        pass

    pivot=request.GET.get("pivot")
    params_pivot=[]
    if not pivot is None:
        # exemple : http://localhost:8000/api/export_all/?out=graph&fields=profil_nom,profil_prenom,film_titre&pivot=profil_formation,film_annee,film_titre,sum
        log("On applique un pivot sur "+lib_columns)
        params_pivot= pivot.split(",")

    #Aggregation
    group_by=request.GET.get("group_by")
    if not group_by is None:
        # exemple : http://localhost:8000/api/export_all/?out=graph&cols=profil_formation,film_annee,profil_id&group_by=profil_formation,film_annee&func=count&color=film_annee
        group_fields=group_by.split(",")
        funcname=request.GET.get("func","count")
        log("On regroupe sur  "+str(group_fields)+" avec la fonction "+funcname)
        df=df.groupby(by=group_fields,dropna=True,as_index=False).agg(funcname)

    if request.method=="POST":
        pivot_obj=loads(str(request.body,"utf8"))
        params_pivot=[pivot_obj["row"],pivot_obj["col"],pivot_obj["val"],pivot_obj["fun"]]

    if len(params_pivot)>0:
        df=pd.pivot_table(df,index=params_pivot[0],columns=params_pivot[1],values=params_pivot[2],aggfunc=params_pivot[3].split("/"))

    if format=="xml":
        d="<root>"+to_xml(df,"record")+"</root>"
        #d="<root>"+xmlify(df.to_,wrap="list-items",indent="  ")+"</root>"
        return HttpResponse(d,content_type="text/xml")

    if format=="csv":
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response["Content-Disposition"]='attachment; filename="works.csv"'
        df.to_csv(response,sep=";",encoding="utf-8")
        return response

    if format=="json":
        return HttpResponse(content=df.to_json(orient="index",force_ascii=False),content_type='application/json')

    if "xls" in format:
        output = BytesIO()
        writer = pd.ExcelWriter(output, engine='xlsxwriter')
        df.to_excel(writer,sheet_name="FEMIS")
        response = HttpResponse(content=writer,content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response["Content-Disposition"] = 'attachment; filename="femis.xlsx"'
        return response

    if format.startswith("graph"):
        graph=StatGraph(df)
        graph.trace(request.GET.get("x",df.columns[0]),request.GET.get("y",df.columns[1]),request.GET.get("color"),request.GET.get("height",400),style=request.GET.get("chart","bar"))
        rc = graph.to_html()

        if format=="graph":
            return JsonResponse(rc)
        else:
            return HttpResponse(content=rc["code"])



#http://localhost:8000/api/movie_importer/
@api_view(["POST"])
@permission_classes([AllowAny])
def movie_importer(request):
    """
    Importation du catalogue des films
    :param request:
    :return:
    """
    log("Importation de films")
    content = str(request.body).split("base64,")[1]
    b64_content = base64.b64decode(content)

    try:
        txt = str(b64_content,encoding="utf-8")
    except:
        txt = str(b64_content,encoding="ansi")


    d = csv.reader(StringIO(txt), delimiter=";")
    i = 0
    record = 0

    if txt.startswith("visa"):
        log("Fichier extrait du CNC")
        for row in list(d):
            if i>0:
                title:str=row[1].replace("(le)","").replace("(la)","").replace("(les)","")
                pows=list(PieceOfWork.objects.filter(title__icontains=title))
                for pow in pows:
                    if levenshtein(title.lower(),pow.title.lower())<4:
                        pow.reference=row[0]
                        pow.production=row[3]
                        pow.budget=int(row[4])
                        pow.save()
                        log("Mise a jour de "+title)
                    else:
                        log("Les titre "+title+" / "+pow.title+" sont trop éloignés")
            i=i+1
    else:
        log("Fichier extrait de la base des films")

        for row in list(d):
            pow=None
            if len(row)>10:
                if i>0:
                    if row[6]=="":row[6]="0"
                    if row[11]=="":row[11]="1800"

                    pow:PieceOfWork=PieceOfWork(
                        title=row[0].replace(u'\xa0', u' '),
                        description=row[1],
                        visual=row[4],
                        nature=row[5],
                        dtStart=row[2],
                        budget=int(row[6]),
                        category=row[7],
                        links=[{"url":row[9],"text":row[8]}],
                        lang="US",
                        year=int(row[11]),
                        owner=row[10]
                    )

                    if not pow is None:
                        try:
                            pow.category = pow.category.replace("|", " ")
                            rc = pow.save()
                            log("Ajout de " + pow.title)
                            record = record + 1
                        except Exception as inst:
                            log("Probléme d'enregistrement" + str(inst))

            else:
                pows=PieceOfWork.objects.filter(title__iexact=row[0])
                if len(pows)==0:
                    pow: PieceOfWork = PieceOfWork(
                        title=row[0],
                        description=translate(row[4]),
                        nature=translate(row[2]),
                        category=row[3],
                        lang="FR"
                    )
                    if len(row[1])>0:pow.year=int(str(row[1]).split(",")[0])
                    pow.add_link("","FEMIS","Film ajouter depuis le référencement FEMIS")
                    pow.save()
                    log("Ajout de "+pow.title)
                else:
                    pow=pows.first()

                name=row[6].replace("\n","")
                if " " in name:
                    profils = Profil.objects.filter(lastname__icontains=name.split(" ")[1],firstname__icontains=name.split(" ")[0])
                    if len(profils)>0:
                        work=Work(pow_id=pow.id,job=translate(row[5]),profil_id=profils.first().id)
                        work.save()
            i=i+1

    log("Importation terminé de "+str(record)+" films")

    return Response(str(record) + " films importés", 200)




#http://localhost:8000/api/importer/
@api_view(["POST"])
@permission_classes([AllowAny])
def importer(request):
    """
    Importation des profils
    :param request:
    :param format:
    :return:
    """

    header=list()
    def idx(col:str,row=None,default=None,max_len=0,min_len=0):
        for c in col.lower().split(","):
            if c in header:
                if row is not None:
                    rc=row[header.index(c)]
                    if max_len>0 and len(rc)>max_len:rc=rc[:max_len]
                    if min_len==0 or len(rc)>=min_len:
                        return rc
                else:
                    return header.index(c)
        return default


    log("Importation de profil")
    data=base64.b64decode(str(request.data["file"]).split("base64,")[1])

    for _encoding in ["utf-8","ansi"]:
        try:
            txt=str(data, encoding=_encoding)
            break
        except:
            pass

    txt=txt.replace("&#8217;","")

    delimiter=";"
    text_delimiter=False
    if "\",\"" in txt:
        delimiter=","
        text_delimiter=True
    d=csv.reader(StringIO(txt), delimiter=delimiter,doublequote=text_delimiter)
    i=0
    record=0
    for row in d:
        if i==0:
            header=[x.lower() for x in row]
        else:
            s=request.data["dictionnary"].replace("'","\"")
            dictionnary=loads(s)

            firstname=row[idx("fname,firstname,prenom")]
            lastname=row[idx("lastname,nom,lname")]
            email=idx("email,mail",row)
            idx_photo=idx("photo,picture,image")
            #Eligibilité
            if len(lastname)>2 and len(lastname)+len(firstname)>5 and len(email)>4 and "@" in email:
                if idx_photo is None or len(row[idx_photo])==0:
                    photo=None
                    idx_gender=idx("gender,genre,civilite")
                    gender=row[idx_gender]
                    if gender=="":
                        photo="/assets/img/anonymous.png"
                        row[idx_gender] = ""

                    if gender=="Monsieur" or gender=="M." or gender.startswith("Mr"):
                        photo="/assets/img/boy.png"
                        row[idx_gender] = "M"

                    if photo is None:
                        row[idx_gender]="F"
                        photo = "/assets/img/girl.png"
                else:
                    photo=stringToUrl(idx("photo",row,""))

                #Calcul
                dt_birthdate=idx("BIRTHDATE,birthday,anniversaire,datenaissance",row)
                if len(dt_birthdate)==8:
                    tmp=dt_birthdate.split("/")
                    if int(tmp[2])>50:
                        dt_birthdate=tmp[0]+"/"+tmp[1]+"/19"+tmp[2]
                    else:
                        dt_birthdate = tmp[0] + "/" + tmp[1] + "/20" + tmp[2]
                ts=dateToTimestamp(dt_birthdate)

                dt = None
                if not ts is None:dt=datetime.fromtimestamp(ts)

                promo=idx("date_start,date_end,date_exam,promo,promotion,anneesortie",row,dictionnary["promo"],0,4)
                profil=Profil(
                    firstname=firstname,
                    school="FEMIS",
                    lastname=lastname,
                    gender=idx("gender,genre,civilite",row,""),
                    mobile=idx("mobile,telephone,tel",row,"",20),
                    nationality=idx("nationality",row,"Francaise"),
                    country=idx("country,pays",row,"France"),
                    birthdate=dt,
                    department=idx("departement,department,formation",row,"",60),
                    job=idx("job,metier,competences",row,"",60),
                    degree_year=promo,
                    address=idx("address,adresse",row,"",200),
                    town=idx("town,ville",row,"")[:50],
                    cp=idx("cp,codepostal,code_postal,postal_code,postalcode",row,"",5),
                    website=stringToUrl(idx("website,siteweb,site,url",row,"")),
                    biography=idx("biographie",row,""),

                    facebook=idx("facebook",row,""),
                    instagram=idx("instagram",row,""),
                    vimeo=idx("vimeo",row,""),
                    tiktok=idx("tiktok",row,""),
                    linkedin=idx("linkedin", row, ""),

                    email=email,
                    photo=photo,

                    cursus=idx("cursus",row,dictionnary["cursus"]),
                )
                try:
                    rc=profil.save()
                    record=record+1
                except Exception as inst:
                    log("Probléme d'enregistrement de "+email+" :"+str(inst))
        i=i+1

    cr=str(record)+" profils importés"
    log(cr)
    return Response(cr,200)




@api_view(["GET"])
def oauth(request):
    """
    voir https://docs.microsoft.com/fr-fr/linkedin/shared/authentication/authorization-code-flow?context=linkedin/context
    :param request:
    :return:
    """
    code=request.GET.get("code")
    r = requests.post('https://www.linkedin.com/oauth/v2/accessToken', data={
        'grant_type': 'authorization_code',
        'code': code,
        'client_id':'86sko2r66j8l8k',
        'client_secret':'5daYMxKMEvWvfiuX',
        'redirect_uri':'http://localhost:8000/api/oauth',
    })
    if r.status_code==200:
        access_token=r.json()["access_token"]
        headers={'Authorization':'Bearer '+access_token}
        res_profil=requests.get("https://api.linkedin.com/v2/me?fields=id,firstName,lastName,educations",headers=headers)
        if res_profil.status_code==200:
            profil=res_profil.json()
        else:
            print(res_profil.text)
    else:
        print(r.status_code)

    return redirect("http://localhost:4200")




@permission_classes([AllowAny])
class ProfilDocumentView(DocumentViewSet):
    document=ProfilDocument
    serializer_class = ProfilDocumentSerializer
    pagination_class = LimitOffsetPagination
    lookup_field = "id"
    filter_backends = [
        FilteringFilterBackend,
        IdsFilterBackend,
        OrderingFilterBackend,
        DefaultOrderingFilterBackend,
        SearchFilterBackend,
    ]
    search_fields = ('works__title','works__job','lastname','firstname','department','promo','school')
    #multi_match_search_fields = ('works__title','works__job','lastname','firstname','department','promo','school')

    filter_fields = {
        'name': 'name',
        'lastname':'lastname',
        'firstname': 'firstname',
        'cursus':'cursus',
        'title':'works__title',
        'promo':'promo',
        'school':'school',
        'town':'town',
        'formation':'department'
    }
    ordering_fields = {
        'id':'id',
        'promo':'degree_year',
        'update':'dtLastUpdate'
    }
    suggester_fields = {
        'name_suggest': {
            'field': 'lastname',
            'suggesters': [SUGGESTER_COMPLETION,],
        },
    }




#http://localhost:8000/api/powsdoc
@permission_classes([AllowAny])
class PowDocumentView(DocumentViewSet):
    document=PowDocument
    serializer_class = PowDocumentSerializer
    pagination_class = LimitOffsetPagination
    lookup_field = "id"

    filter_backends = [
        FilteringFilterBackend,
        IdsFilterBackend,
        OrderingFilterBackend,
        DefaultOrderingFilterBackend,
        SearchFilterBackend,
    ]

    search_fields = ('title','category',"nature","year","works")
    filter_fields = {
        'title':{
            'field':'title',
            'lookups':[LOOKUP_FILTER_TERM,LOOKUP_FILTER_TERMS,LOOKUP_FILTER_PREFIX,LOOKUP_FILTER_WILDCARD,LOOKUP_QUERY_IN,LOOKUP_QUERY_EXCLUDE,]
        },
        'category': {
            'field': 'category',
            'lookups': [LOOKUP_FILTER_TERM, LOOKUP_FILTER_TERMS, LOOKUP_FILTER_PREFIX, LOOKUP_FILTER_WILDCARD,
                        LOOKUP_QUERY_IN, LOOKUP_QUERY_EXCLUDE, ]
        }
    }
    ordering_fields = {
        'year':'year',
        'title': 'title'
    }

