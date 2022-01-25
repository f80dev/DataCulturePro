import base64
import csv

from datetime import datetime, timedelta
from io import StringIO, BytesIO
from json import loads

from urllib.request import urlopen

import pandasql
import yaml
import pandas as pd
from github import Github

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

import requests
from django.contrib.auth.models import User, Group

# Create your views here.
from django.shortcuts import redirect
from rest_framework import viewsets, generics

from OpenAlumni.Batch import exec_batch, exec_batch_movies, fusion,  analyse_pows
from OpenAlumni.Tools import dateToTimestamp, stringToUrl, reset_password, log, sendmail, to_xml, translate, \
    levenshtein, getConfig, remove_accents, remove_ponctuation, index_string
from OpenAlumni.nft import NFTservice
import os

if os.environ.get("DEBUG"):
    from OpenAlumni.settings_dev import *

    import logging

    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    # logging.getLogger('engineio.server').setLevel(logging.ERROR)
    # logging.getLogger('urllib3.connectionpool').setLevel(logging.ERROR)
    # logging.getLogger('environments').setLevel(logging.ERROR)
else:
    from OpenAlumni.settings import *


from OpenAlumni.social import SocialGraph
from alumni.documents import ProfilDocument, PowDocument
from alumni.models import Profil, ExtraUser, PieceOfWork, Work, Article, Company, Award, Festival
from alumni.serializers import UserSerializer, GroupSerializer, ProfilSerializer, ExtraUserSerializer, POWSerializer, \
    WorkSerializer, ExtraPOWSerializer, ExtraWorkSerializer, ProfilDocumentSerializer, \
    PowDocumentSerializer, WorksCSVRenderer, ArticleSerializer, ExtraProfilSerializer, ProfilsCSVRenderer, \
    CompanySerializer, AwardSerializer, FestivalSerializer, ExtraAwardSerializer


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
    search_fields = ["lastname","email","degree_year","department","department_category"]
    filter_fields=("lastname","firstname","email","degree_year","department","department_category",)



class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,)
    search_fields = ["autor"]





#http://localhost:8000/api/pow
class POWViewSet(viewsets.ModelViewSet):
    queryset = PieceOfWork.objects.all()
    serializer_class = POWSerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,DjangoFilterBackend,)
    search_fields=["title","category","nature","year"]
    filter_fields = ("id", "title","owner", "category", "year","nature",)


#http://localhost:8000/api/extraworks/
class ExtraWorkViewSet(viewsets.ModelViewSet):
    queryset = Work.objects.all()
    serializer_class = ExtraWorkSerializer
    filter_backends = (DjangoFilterBackend,)
    permission_classes = [AllowAny]
    filter_fields = ['pow__id','profil__id']
    #search_fields=["pow__id","profil__id"]


class WorkViewSet(viewsets.ModelViewSet):
    queryset = Work.objects.all()
    serializer_class = WorkSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)
    filter_fields=("profil","pow","job")

#http://localhost:8000/api/awards/?format=json&profil=12313
class AwardViewSet(viewsets.ModelViewSet):
    queryset = Award.objects.all().order_by("-year")
    serializer_class = AwardSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)
    filter_fields=("profil","pow","festival")

class ExtraAwardViewSet(viewsets.ModelViewSet):
    queryset = Award.objects.all().order_by("-year")
    serializer_class = ExtraAwardSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)
    filter_fields=("profil","pow","festival")

#http://localhost:8000/api/awards/?format=json&profil=12313
class FestivalViewSet(viewsets.ModelViewSet):
    queryset = Festival.objects.all().order_by("title")
    serializer_class = FestivalSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)
    filter_fields=("title","country",)


#http://localhost:8000/api/extrapows
class ExtraPOWViewSet(viewsets.ModelViewSet):
    queryset = PieceOfWork.objects.all()
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
        log("Recherche du nouvel utilisateur dans les profils FEMIS")
        profils=Profil.objects.filter(email__exact=email)
        if len(profils)>0:
            log("Mise a jour du profil de l'utilisateur se connectant")
            user=ExtraUser.objects.get(user__email=email)
            if not user is None:
                log("On enregistre un lien vers le profil FEMIS de l'utilisateur")
                user.profil=profils.first()
                user.save()
                return JsonResponse({"message":"Profil FEMIS lié"})

    return JsonResponse({"message": "Pas de profil FEMIS identifié"})





@api_view(["GET"])
@permission_classes([AllowAny])
def resend(request):
    email=request.GET.get("email")
    users=User.objects.filter(email=email)
    if len(users)==1:
        users[0].set_password(reset_password(users[0].email,users[0].username))
        users[0].save()
    return Response({"message":"Check your email"})



@api_view(["POST"])
@permission_classes([AllowAny])
def add_issue(request):
    g=Github("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")
    r=g.get_repo("f80dev/DataCulturePro")
    body=loads(str(request.body,"utf8"))
    r.create_issue(body["title"],body["body"])
    return Response({"message":"problème loggé"})




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
@api_view(["POST"])
@permission_classes([AllowAny])
def batch(request):
    content=loads(str(request.body,"utf8"))
    filter= request.GET.get("filter", "*")
    limit= request.GET.get("limit", 2000)
    limit_contrib=request.GET.get("contrib", 2000)
    profils=Profil.objects.order_by("dtLastSearch").all()
    refresh_delay_profil=int(request.GET.get("refresh_delay_profil", 31))
    refresh_delay_page=int(request.GET.get("refresh_delay_page", 31))
    if filter!="*":
        profils=Profil.objects.filter(id=filter,school="FEMIS")
        profils.update(auto_updates="0,0,0,0,0,0")
        refresh_delay=0.1

    f=open(STATIC_ROOT+"/news_template.yaml", "r",encoding="utf-8")
    templates=yaml.safe_load(f.read())
    f.close()

    profils=profils.order_by("dtLastSearch")

    n_films,n_works,articles=exec_batch(profils,refresh_delay_profil,
                                        refresh_delay_page,int(limit),int(limit_contrib),
                                        templates["templates"],
                                        content=content,remove_works=request.GET.get("remove_works","false")=="true")
    articles=[x for x in articles if x]

    return Response({"message":"ok","films":n_films,"works":n_works,"articles":articles})


@api_view(["GET"])
@permission_classes([AllowAny])
def api_doc(request):
    rc=[]
    for field in list(Profil._meta.fields)+list(Work._meta.fields)+list(PieceOfWork._meta.fields)+list(Award._meta.fields)+list(Festival._meta.fields):
        help_text=field.help_text
        if len(help_text)>0 and not help_text.startswith("@"):
            rc.append({
                "field":field.name,
                "description":help_text,
                "table":str(field).split(".")[1]
            })

    return JsonResponse({"version":"1","content":rc},safe=False)



#http://localhost:8000/api/quality_filter
#https://server.f80.fr:8000/api/quality_filter
@api_view(["GET"])
@permission_classes([AllowAny])
def quality_filter(request):
    filter= request.GET.get("filter", "*")
    ope = request.GET.get("ope", "profils,films")
    profils=Profil.objects.order_by("dtLastSearch").all()
    n_profils=0
    n_pows=0
    if filter!="*":
        profils=Profil.objects.filter(id=filter,school="FEMIS")

    if "profils" in ope:
        profil_filter = ProfilAnalyzer()
        n_profils,log=profil_filter.analyse(profils)

    if "films" in ope:
        pow_analyzer=PowAnalyzer(PieceOfWork.objects.all())
        n_pows=pow_analyzer.find_double()

    return Response({"message":"ok","profils modifies":n_profils,"films modifiés":n_pows})



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
    user_id=int(request.GET.get("user"))
    log("Modification des permissions de "+str(user_id)+" pour " + profil_id)
    ext_users = ExtraUser.objects.filter(user__id=user_id)
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



#
#
# @api_view(["GET"])
# @permission_classes([IsAuthenticatedOrReadOnly])
# def rebuild_index_old(request):
#     index_name=request.GET.get("name","profils")
#     es = Index(index_name,using="default")
#     if es.exists():es.delete()
#     es.create("default")
#     es.save("default")
#     return Response({"message": "Reconstruction de l'index "+index_name+" terminée"})
#
#
#
# @api_view(["GET"])
# def scrap_linkedin(request):
#     """
#     test: http://localhost:8000/api/scrap_linkedin
#     :return:
#     """
#     proxy=request.GET.get("proxy","")
#     capabilities = DesiredCapabilities.CHROME
#     if len(proxy) > 0:
#         p = Proxy()
#         p.proxy_type = ProxyType.MANUAL
#         p.http_proxy = proxy
#         p.socks_proxy = proxy
#         p.ssl_proxy = proxy
#         p.add_to_capabilities(capabilities)
#
#     url="https://www.linkedin.com/in/hhoareau/"
#     driver:WebDriver = WebDriver(command_executor="http://127.0.0.1:9515", desired_capabilities=capabilities)
#     driver.implicitly_wait(1)
#     driver.get(url)
#     sections=driver.find_elements_by_tag_name("section")
#     return Response("scrapped",200)


#tag analyse_movie
#http://localhost:8000/api/analyse_pow/
@api_view(["GET"])
@permission_classes([AllowAny])
def get_analyse_pow(request):

    ids=[]
    if request.GET.get("id",None):ids=[request.GET.get("id")]
    if request.GET.get("ids", None):ids = request.GET.get("ids").split(",")
    search_by = request.GET.get("search_by","title")
    cat=request.GET.get("cat","unifrance,imdb")

    if len(ids)==0:
        pows = PieceOfWork.objects.order_by("dtLastSearch").all()
    else:
        pows=PieceOfWork.objects.filter(id__in=ids).order_by("dtLastSearch")

    return JsonResponse({"message":"ok","pow":analyse_pows(pows,search_with=search_by,cat=cat)})



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
        Work.objects.all().delete()
        Award.objects.all().delete()
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

    log("Extraction des profils")
    filter=request.GET.get("filter")
    degree_filter = filter.split("_")[0]
    department_filter = filter.split("_")[1]

    profils = Profil.objects.filter(department__contains=department_filter)
    if degree_filter != "0":
        profils = Profil.objects.filter(degree_filter=int(degree_filter), department__contains=department_filter)

    G=SocialGraph()
    G.load(profils,request.GET.get("film")!="false")
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
    """
    Exportation des profils vers OASIS
    :param request:
    :return:
    """
    cursus:str=request.GET.get("cursus","S")
    profils=Profil.objects.filter(cursus__exact=cursus)
    df: pd.DataFrame = pd.DataFrame.from_records(list(profils.values(
        "id", "photo","gender", "lastname", "firstname", "email","mobile","department","department_category","address","cp", "town","country",
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
    df.to_csv(response,sep=";",encoding="utf8")
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
#http://localhost:8000/api/export_all/?out=json
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

    table = request.GET.get("table", "work").lower()

    df=None
    if table.startswith("award"):
        awards = Award.objects.all()
        df: pd.DataFrame = pd.DataFrame.from_records(list(awards.values(
            "profil__id", "profil__gender", "profil__lastname",
            "profil__firstname", "profil__department", "profil__cursus",
            "profil__degree_year", "profil__cp", "profil__town", "profil__dtLastUpdate", "profil__dtLastSearch",

            "pow__id", "pow__title", "pow__nature",
            "pow__category", "pow__year", "pow__budget",
            "pow__production",

            "festival__id","festival__title","festival__country","festival__url",

            "id", "description", "winner","year"
        )))

    if table.startswith("work"):
        works=Work.objects.all()
        df:pd.DataFrame = pd.DataFrame.from_records(list(works.values(
            "profil__id","profil__gender","profil__lastname",
            "profil__firstname","profil__department","profil__cursus",
            "profil__degree_year","profil__cp","profil__town","profil__dtLastUpdate","profil__dtLastSearch",

            "pow__id","pow__title","pow__nature",
            "pow__category","pow__year","pow__budget",
            "pow__production",

            "id","job","comment","validate","source","state"
        )))
        #df.columns=WorksCSVRenderer.header

    if df is None:
        values = request.GET.get("data_cols").split(",")

        if table.startswith("profil"): data = Profil.objects.all().values(*values)
        if table.startswith("pieceofwork"): data = PieceOfWork.objects.all().values(*values)
        if table.startswith("work"): data = Work.objects.all().values(*values)
        if table.startswith("festival"): data = Festival.objects.all().values(*values)

        df=pd.DataFrame.from_records(data)
        if len(data)>0:
            df.columns=list(request.GET.get("cols").split(","))

    if len(df) == 0: return HttpResponse("Aucune donnée disponible", status=404)

    title=request.GET.get("title","Reporting FEMIS")
    lib_columns=",".join(list(df.columns))

    format=request.GET.get("out","json")

    cols=request.GET.get("cols")
    if not cols is None and cols!="undefined":
        log("On ne conserve que "+cols+" dans "+","+lib_columns)
        df=df[cols.split(",")].drop_duplicates()

    sql:str=request.GET.get("sql")
    if not sql is None:
        filter_clause=request.GET.get("filter_value","")
        if len(filter_clause)>0:
            title=title+" ("+request.GET.get("filter")+": "+filter_clause+")"
            filter_clause=request.GET.get("filter")+"='"+filter_clause+"'"
            sql=sql.replace("where","WHERE")
            if "WHERE" in sql:
                sql=sql.replace("WHERE ","WHERE "+filter_clause+" AND ")
            else:
                pos=sql.index(" FROM ")+6
                pos=sql.index(" ",pos)
                sql=sql[:pos]+" WHERE "+filter_clause+" "+sql[pos:]

        if "from df" in sql.lower():
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

    dictionnary=request.GET.get("replace")
    if dictionnary:
        dictionnary=loads(dictionnary)
        for k in dictionnary.keys():
            df=df.replace(str(k),str(dictionnary[k]))


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
        response["Content-Disposition"]='attachment; filename="'+title+'".csv"'
        df.to_csv(response,sep=";",encoding="utf-8")
        return response

    if format=="json":
        return HttpResponse(content=df.to_json(orient="index",force_ascii=False),content_type='application/json')

    if "xls" in format or "excel" in format:
        output = BytesIO()
        writer = pd.ExcelWriter(output, engine='xlsxwriter')
        df.to_excel(writer,sheet_name="FEMIS")
        writer.save()
        output.seek(0)

        response = HttpResponse(content=output.getvalue(),content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response["Content-Disposition"] = 'attachment; filename='+title+'.xlsx'
        return response

    if format.startswith("graph"):
        graph=StatGraph(df)
        graph.trace(
            request.GET.get("x",df.columns[0]),
            request.GET.get("y",df.columns[1]),
            request.GET.get("color",None),
            request.GET.get("height",400),
            style=request.GET.get("chart","bar"),
            title=title,
            template=request.GET.get("template","seaborn")
        )
        rc = graph.to_html()

        filter = request.GET.get("filter")
        if filter:
            rc["filter_values"] = list(set(df[filter].values))

        if format=="graph":
            return JsonResponse(rc)
        else:
            return HttpResponse(content=rc["code"])




def idx(col:str,row=None,default=None,max_len=100,min_len=0,replace_dict:dict={},header=list()):
    """
    Permet l'importation dynamique des colonnes
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




#tag /importer
#http://localhost:8000/api/movie_importer/
@api_view(["POST"])
@permission_classes([AllowAny])
def movie_importer(request):
    """
    Importation du catalogue des films
    :param request:
    :return:
    """
    d,total_record=importer_file(request)

    i = 0
    record = 0

    #if txt.startswith("visa"):
    if False:
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

        for row in d:
            pow=None
            if len(row)>10:
                if i==0:
                    header = [x.lower().replace("[[", "").replace("]]", "").strip() for x in row]
                    log("Liste des colonnes disponibles " + str(header))
                if i>0:
                    title=idx("title",row,"",50,header=header)

                    if len(title)>2:
                        duration=idx("DURATION",row,max_len=20,header=header)
                        name = idx("STUDENT_NAME", row, "", header=header)

                        pow:PieceOfWork=PieceOfWork(
                            title=title.replace(u'\xa0', u' '),
                            title_index=index_string(title.replace(u'\xa0', u' ')),
                            description=idx("FR_SYNOPSIS",row,max_len=3000,header=header),
                            visual="",
                            nature=translate(idx("LEVEL_PROJECT",row,max_len=50,header=header)),
                            category=translate(idx("FILM_CLASSIFICATION",row,"",max_len=50, header=header)),
                            links=[],
                            lang="US",
                            year=idx("YEAR_FILM",row,max_len=4,header=header),
                            owner=name
                        )

                        if not pow is None:
                            result = PieceOfWork.objects.filter(title__iexact=pow.title, year__exact=pow.year)
                            hasChanged=True
                            if len(result) > 0:
                                pow,hasChanged = fusion(result.first(), pow)

                            try:
                                if hasChanged:
                                    pow.save()
                                    log("Ajout de " + pow.title)
                                    record = record + 1

                                #Ajout de la contribution
                                if len(name) > 0 and " " in name:
                                    profils = Profil.objects.filter(lastname__icontains=name.split(" ")[1],
                                                                    firstname__icontains=name.split(" ")[0])
                                    if len(profils) > 0:
                                        work = Work(pow_id=pow.id, job=translate(row[5]), profil_id=profils.first().id)
                                        log("Ajout de l'experience " + str(work) + " a " + name)
                                        work.save()

                            except Exception as inst:
                                log("Probléme d'enregistrement" + str(inst)+" pour "+pow.title)


            i=i+1

    log("Importation terminé de "+str(record)+" films")
    return Response(str(record) + " films importés",200)




def importer_file(request):
    d=list()

    log("Importation de fichier")
    data = base64.b64decode(str(request.data["file"]).split("base64,")[1])

    log("Analyse du document")
    for _encoding in ["utf-8", "ansi"]:
        try:
            txt = str(data, encoding=_encoding)
            break
        except:
            pass

    txt = txt.replace("&#8217;", "")
    log("Méthode d'encoding " + _encoding)

    if str(request.data["filename"]).endswith("xlsx"):
        res = pd.read_excel(data)
        d.append(list(res))
        for k in range(1, len(res)):
            d.append(list(res.loc[k]))
        total_record = len(d) - 1
    else:
        delimiter = ";"
        text_delimiter = False
        if "\",\"" in txt:
            delimiter = ","
            text_delimiter = True

        log("Importation du CSV")
        d = csv.reader(StringIO(txt), delimiter=delimiter, doublequote=text_delimiter)
        total_record = sum(1 for line in d)
        log("Nombre d'enregistrements identifié " + str(total_record))

        # Répétion de la ligne pour remettre le curseur au début du fichier
        d = csv.reader(StringIO(txt), delimiter=delimiter, doublequote=text_delimiter)

    return d,total_record


#http://localhost:8000/api/importer/
#Importation des profils
@api_view(["POST"])
@permission_classes([AllowAny])
def importer(request):
    """
    Importation des profils
    :param request:
    :param format:
    :return:
    """
    i = 0
    record = 0
    non_import=list()

    d,total_record=importer_file(request)

    l_department_category=[x.lower() for x in Profil.objects.values_list("department_category",flat=True)]
    for row in d:

        if i==0:
            header=[x.lower().replace("[[","").replace("]]","").strip() for x in row]
            log("Liste des colonnes disponibles "+str(header))
        else:
            s=request.data["dictionnary"].replace("'","\"").replace("\n","").strip()
            dictionnary=dict() if len(s)==0 else loads(s)

            firstname=idx("fname,firstname,prenom,prénom",row,max_len=40,header=header)
            lastname=idx("lastname,nom,lname",row,max_len=100,header=header)
            if i % 10 == 0:
                log(firstname + " " + lastname + " - " + str(i) + "/" + str(total_record) + " en cours d'importation")

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

                standard_replace_dict={"nan":""}

                department_category=idx("code_regroupement,regroupement",row,"",50,replace_dict=standard_replace_dict,header=header)
                department = idx("CODE_TRAINING,departement,department,formation", row, "", 60,replace_dict=standard_replace_dict,header=header)
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
                    department=department,
                    job=idx("job,metier,competences",row,"",60,replace_dict=standard_replace_dict,header=header),
                    degree_year=promo,
                    address=idx("address,adresse",row,"",200,replace_dict=standard_replace_dict,header=header),
                    department_category=department_category,
                    town=idx("town,ville",row,"",50,replace_dict=standard_replace_dict,header=header),
                    source=idx("source", row, "FEMIS",50,replace_dict=standard_replace_dict,header=header),
                    cp=idx("zip,cp,codepostal,code_postal,postal_code,postalcode",row,"",5,replace_dict=standard_replace_dict,header=header),
                    website=stringToUrl(idx("website,siteweb,site,url",row,"",replace_dict=standard_replace_dict,header=header)),
                    biography=idx("biographie",row,"",header=header),

                    facebook=idx("facebook",row,"",header=header),
                    instagram=idx("instagram",row,"",header=header),
                    vimeo=idx("vimeo",row,"",header=header),
                    tiktok=idx("tiktok",row,"",header=header),
                    linkedin=idx("linkedin", row, "",header=header),

                    email=email,
                    photo=photo,

                    cursus=idx("cursus",row,default=dictionnary["cursus"],header=header,max_len=1),
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

    return JsonResponse({"imports":str(record),"abort":non_import})




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
    search_fields = ('lastname','firstname','department','promo','school','town','department_category',)


    filter_fields = {
        'name': 'name',
        'lastname':'lastname',
        'firstname': 'firstname',
        'categorie': 'department_category',
        'cursus':'cursus',
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

