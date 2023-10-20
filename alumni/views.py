import base64
import subprocess
from os.path import exists

from OpenAlumni.data_importer import DataImporter
from OpenAlumni.mongo_tools import MongoBase
from OpenAlumni.passwords import RESET_PASSWORD
from datetime import datetime
from io import StringIO, BytesIO
from json import loads, load
from urllib.parse import  quote

from urllib.request import urlopen

import pandasql
import yaml
import pandas as pd
from django.core import management
from django.db import connection

from github import Github
from numpy import inf

from OpenAlumni.DataQuality import ProfilAnalyzer, PowAnalyzer, AwardAnalyzer, WorkAnalyzer
from OpenAlumni.analytics import StatGraph
from OpenAlumni.giphy_search import ImageSearchEngine

pd.options.plotting.backend = "plotly"

from django.http import JsonResponse, HttpResponse

from django_elasticsearch_dsl_drf.constants import SUGGESTER_COMPLETION
from django_elasticsearch_dsl_drf.filter_backends import FilteringFilterBackend, OrderingFilterBackend, \
    DefaultOrderingFilterBackend, \
    SimpleQueryStringSearchFilterBackend, CompoundSearchFilterBackend, MultiMatchSearchFilterBackend
from django_elasticsearch_dsl_drf.pagination import LimitOffsetPagination
from django_elasticsearch_dsl_drf.viewsets import  DocumentViewSet
from django_filters.rest_framework import DjangoFilterBackend
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search

from rest_framework.decorators import api_view,  permission_classes, renderer_classes

from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

import requests
from django.contrib.auth.models import User, Group

# Create your views here.
from django.shortcuts import redirect
from rest_framework import viewsets, generics

from OpenAlumni.Batch import exec_batch, exec_batch_movies, fusion, analyse_pows, reindex, importer_file, \
    profils_importer, idx, raz
from OpenAlumni.Tools import dateToTimestamp,  reset_password, log, sendmail, to_xml, translate, \
    levenshtein, getConfig,   index_string, init_dict
from OpenAlumni.nft import NFTservice

import os
if os.environ.get("DJANGO_SETTINGS_MODULE")=="OpenAlumni.settings_dev_server": from OpenAlumni.settings_dev_server import *
if os.environ.get("DJANGO_SETTINGS_MODULE")=="OpenAlumni.settings_dev": from OpenAlumni.settings_dev import *
if os.environ.get("DJANGO_SETTINGS_MODULE")=="OpenAlumni.settings": from OpenAlumni.settings import *


if os.environ.get("DEBUG"):
    import logging
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    # logging.getLogger('engineio.server').setLevel(logging.ERROR)
    # logging.getLogger('urllib3.connectionpool').setLevel(logging.ERROR)
    # logging.getLogger('environments').setLevel(logging.ERROR)


from OpenAlumni.social import SocialGraph
from alumni.documents import ProfilDocument, PowDocument, FestivalDocument
from alumni.models import Profil, ExtraUser, PieceOfWork, Work, Article, Company, Award, Festival
from alumni.serializers import UserSerializer, GroupSerializer, ProfilSerializer, ExtraUserSerializer, POWSerializer, \
    WorkSerializer, ExtraPOWSerializer, ExtraWorkSerializer, ProfilDocumentSerializer, \
    PowDocumentSerializer, WorksCSVRenderer, ArticleSerializer, ExtraProfilSerializer, ProfilsCSVRenderer, \
    CompanySerializer, AwardSerializer, FestivalSerializer, ExtraAwardSerializer, FestivalDocumentSerializer

STYLE_TABLE="""
                <style>
                    table {width:100%;}
                    tr {width:100%;}
                    td {color: black;padding:7px;text-align:center;background-color: lightgray;}
                    th {color: white;padding:10px;text-align:center;background-color:black;}
                    
                    .mainform {
                        padding: 5px;
                    }
                </style>
            """


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
    filterset_fields =("email",)



class ExtraUserViewSet(viewsets.ModelViewSet):
    """
    Permet la consultation des informations sur le model user enrichie (extra user)
    """
    queryset = ExtraUser.objects.all()
    serializer_class = ExtraUserSerializer
    permission_classes = (AllowAny,)
    filter_backends = (SearchFilter,DjangoFilterBackend,)
    search_fields=["user__email"]
    filterset_fields = ("user__email","id")

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
    queryset = Profil.objects.all().order_by('-lastname')
    serializer_class = ProfilSerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,DjangoFilterBackend)
    search_fields = ["email"]
    filterset_fields=("school","email","firstname",)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,)
    filterset_fields=("name","siret",)


class ExtraProfilViewSet(viewsets.ModelViewSet):
    """
    http://localhost:8000/api/extraprofils/12
    """
    queryset = Profil.objects.all()
    serializer_class = ExtraProfilSerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,DjangoFilterBackend)
    search_fields = ["lastname","email","degree_year","department","department_category"]
    filterset_fields=("id","lastname","firstname","email","degree_year","department","department_category",)



class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,)
    search_fields = ["owner","tags"]



#http://localhost:8000/api/pow
class POWViewSet(viewsets.ModelViewSet):
    queryset = PieceOfWork.objects.all()
    serializer_class = POWSerializer
    permission_classes = [AllowAny]
    filter_backends = (SearchFilter,DjangoFilterBackend,)
    search_fields=["title","category","nature","year"]
    filterset_fields = ["id", "title","owner", "category", "year","nature",]


#http://localhost:8000/api/extraworks/
class ExtraWorkViewSet(viewsets.ModelViewSet):
    queryset = Work.objects.all()
    serializer_class = ExtraWorkSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ['pow__id','profil__id',]


class WorkViewSet(viewsets.ModelViewSet):
    queryset = Work.objects.all()
    serializer_class = WorkSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)
    filterset_fields=("profil","pow","job")

#http://localhost:8000/api/awards/?format=json&profil=12313
class AwardViewSet(viewsets.ModelViewSet):
    queryset = Award.objects.all().order_by("-year")
    serializer_class = AwardSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)
    filterset_fields=("profil","pow","festival")


class ExtraAwardViewSet(viewsets.ModelViewSet):
    """
    voir https://api.f80.fr:8100/api/extraawards/?format=json&profil=3017

    """
    queryset = Award.objects.all().order_by("-year")
    serializer_class = ExtraAwardSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)
    filterset_fields=["profil__id","profil__lastname","profil__name_index","pow__title","festival__title","description","winner"]


#http://localhost:8000/api/awards/?format=json&profil=12313
class FestivalViewSet(viewsets.ModelViewSet):
    queryset = Festival.objects.all().order_by("title")
    serializer_class = FestivalSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,SearchFilter,)
    filterset_fields =["title","country","id",]
    search_fields=["title"]


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


#http://localhost:8000/api/backup_files
@api_view(["GET","POST"])
@permission_classes([AllowAny])
def list_backup_file(request):
    prefix=request.GET.get("prefix","dataculture_db_")
    work_dir=request.GET.get("work_dir","./dbbackup")

    if request.method=="GET":
        rc=[]
        for f in os.listdir(work_dir):
            if f.startswith(prefix):
                rc.append({"filename":f,"label":f,"value":f})
        return JsonResponse({"files":rc})

    if request.method=="POST":
        file=loads(request.body)
        path=work_dir+"/"+prefix+file["filename"]
        hFile=open(path,"wb")
        hFile.write(base64.b64decode(file["file"].split("base64,")[1]))
        hFile.close()

        return JsonResponse({"path":path})





#http://localhost:8000/api/backup?command=save
#http://localhost:8000/api/backup?command=load
@api_view(["GET"])
@permission_classes([AllowAny])
def run_backup(request):
    command=request.GET.get("command","save")
    prefix=request.GET.get("prefix","dataculture_db_")
    work_dir=request.GET.get("work_dir","./dbbackup")
    engine=request.GET.get("engine","pg_dump")
    filename=request.GET.get(
        "file",
        prefix+datetime.now().strftime("%d-%m-%Y_%H%M")+".json"
    )
    os.environ["PGPASSWORD"]=DB_PASSWORD
    backup_file=request.GET.get("file",filename)
    if not backup_file.endswith(".json"):backup_file=backup_file+".json"

    url=request.build_absolute_uri('/')
    exclude_table=["auth.permission","contenttypes","alumni.extrauser"]

    if engine=="pg_dump": backup_file=backup_file.replace(".json",".out")

    if command=="save":
        log("Enregistrement de la base dans "+backup_file)
        if engine=="dumpdata":
            with open(work_dir+"/"+backup_file, 'w',encoding="utf8") as f:
                management.call_command("dumpdata","alumni",
                                        stdout=f,exclude=exclude_table,
                                        indent=2)
        if engine=="pg_dump":
            #voir https://www.postgresql.org/docs/current/app-pgdump.html
            args=["./dbbackup/pg_dump.exe" if os.name=="nt" else "pg_dump", "--format=t","--blobs","--host="+DATABASES["default"]["HOST"],"--port="+DATABASES["default"]["PORT"],"--username="+DB_USER,DATABASES["default"]["NAME"]]

            with open(work_dir+"/"+backup_file,'wb') as f:
                subprocess_result = subprocess.run(args, stdout=f)
            log("Enregistrement terminé, consulter "+work_dir)

        return JsonResponse({"message":"Backup effectué, rechargement par "+url+"api/backup?command=load"})


    if command=="load":
        if Profil.objects.count()>0 or PieceOfWork.objects.count()>0 or Work.objects.count()>0:
            return JsonResponse({"message":"La base doit avoir été préalablement vidé"},status=500)

        if exists(work_dir+"/"+backup_file):
            if engine=="django":
                management.call_command("loaddata",work_dir+"/"+backup_file,verbosity=3,app_label="alumni")
            else:
                #voir https://www.postgresql.org/docs/current/app-pgrestore.html
                args=["./dbbackup/pg_restore.exe" if os.name=="nt" else "pg_restore", "--clean","--create","--host="+DATABASES["default"]["HOST"],"--port="+DATABASES["default"]["PORT"],"--username="+DB_USER,"--dbname="+DATABASES["default"]["NAME"]]
                with open(work_dir+"/"+backup_file,"r") as f:
                    subprocess_result = subprocess.run(args, stdin=f)


            return JsonResponse({"message":"Chargement terminé, réindexation par "+url+"api/reindex/"})
        else:
            return JsonResponse({"message":"fichier de backup introuvable"},status=500)




#https://api.f80.fr:8000/api/infos_server
@api_view(["GET"])
@permission_classes([AllowAny])
def infos_server(request):
    """
    tags: /info /server_info
    voir https://server.f80.fr:8100/api/infos_server
    voir http://localhost:8000/api/infos_server

    :param request:
    :return:
    """
    rc=dict()
    log("début de lecture Infos serveur")
    rc["domain"]={"appli":DOMAIN_APPLI,"server":DOMAIN_SERVER}
    rc["search"]={"server":ELASTICSEARCH_DSL}
    rc["settings_file"]=SETTINGS_FILENAME
    rc["server_version"]=VERSION
    rc["database"]=DATABASES
    rc["imdb_database_server"]=IMDB_DATABASE_SERVER
    rc["debug"]=DEBUG
    log("Fin de lecture")

    try:
        rc["content"]={
            "articles":Article.objects.count(),
            "users":User.objects.count(),
            "films":PieceOfWork.objects.count(),
            "works":Work.objects.count(),
            "festivals":Festival.objects.count(),
            "awards":Award.objects.count(),
            "profils":Profil.objects.count()}
        rc["message"]="Tout est ok"
    except:
        log("Problème de connexion à la base avec "+DB_USER+" / "+DB_PASSWORD)
        rc["message"]="Connexion impossible à la base de données "+rc["database"]

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
        user=ExtraUser.objects.get(user__email=email)
        log("Recherche du nouvel utilisateur dans les profils FEMIS")
        profils=Profil.objects.filter(email__exact=email)
        if len(profils)>0:
            log("Mise a jour du profil de l'utilisateur se connectant")
            if not user is None:
                log("On enregistre un lien vers le profil FEMIS de l'utilisateur")
                user.profil=profils.first()
                user.profil_name="student"
        else:
            user.profil_name="standard"     #Connecté

        perms = yaml.safe_load(open(STATIC_ROOT + "/profils.yaml", "r", encoding="utf-8").read())
        for p in perms["profils"]:
            if p["id"]==user.profil_name:
                user.perm=p["perm"]
                break

        user.save()
        return JsonResponse({"message":"Profil FEMIS lié"})

    return JsonResponse({"message": "Pas de profil FEMIS identifié"})





@api_view(["GET"])
@permission_classes([AllowAny])
def resend(request):
    email=request.GET.get("email")
    users=User.objects.filter(email=email)
    if len(users)==1:
        code=reset_password(users[0].email,users[0].username)
        users[0].set_password(code)
        users[0].save()
        sendmail("Renvoi de votre code",email,"resend_code.html",{
            "email":email,
            "appname":APPNAME,
            "code":code,
            "url_appli":DOMAIN_APPLI
        })
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
    return JsonResponse({"message":"ok"})



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
    # _u=Account(pem_file=ADMIN_PEMFILE)
    # url=BC_PROXY+"/address/"+_u.address.bech32()+"/esdt/"
    # r=requests.get(url).json()
    rc=[]
    # for t in r["data"]["esdts"]:
    #     if t.startswith(TOKEN_ID):
    #         nft=r["data"]["esdts"][t]
    #         try:
    #             nft["attributes"]=str(base64.b64decode(nft["attributes"]),"utf8")
    #             rc.append(nft)
    #         except:
    #             pass
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

    text = text.replace("%job%", quote(job))
    text = text.replace("%lastname%", quote(profil.lastname))
    text = text.replace("%firstname%", quote(profil.firstname))

    sites=yaml.load(text,Loader=yaml.Loader)
    return JsonResponse({"sites":sites,"job":profil.job})



@api_view(["GET"])
@permission_classes([AllowAny])
def api_imdb_importer(request):
    """
    test : http://localhost:8000/api/imdb_importer/?files=title.ratings&update_delay=0
    :param request:
    :return:
    """
    files_to_import=request.GET.get("files","title.crew,title.episode,title.principals,title.ratings,name.basics,title.akas,title.basics")
    update_delay=int(request.GET.get("update_delay","10"))
    di=DataImporter()
    log("Récupération des fichiers imdb")
    imdbBase=MongoBase(IMDB_DATABASE_SERVER)
    rc=""
    for filename in files_to_import.split(","):
        if di.download_file(filename, IMDB_FILES_DIRECTORY,update_delay=update_delay):
            log("Intégration de "+filename)
            rc=rc+imdbBase.import_csv(IMDB_FILES_DIRECTORY+filename,2e9,replace=True)

    return Response({"log":rc})









#http://localhost:8000/api/update_dictionnary/?levenshtein=3
@api_view(["GET"])
@permission_classes([AllowAny])
def update_dictionnary(request):
    """
    Consiste à uniformiser la terminologie des métiers en fonction de l'état du dictionnaire
    :param request:
    :return:
    """
    log("Application du dictionnaire sur les métiers")
    levenshtein_tolerance=int(request.GET.get("levenshtein","0"))
    njob_analyzed=0
    for w in Work.objects.all():
        njob_analyzed=njob_analyzed+1
        job=translate(w.job,["jobs"],True,levenshtein_tolerance)
        if job!=w.job:
            if job is None:
                log(w.job+" absent du dictionnaire")
            else:
                log("Traitement de "+str(w.job))
                if job!=w.job:
                    w.job=job
                    w.save()
    log("Nombre de job analysé "+str(njob_analyzed))

    log("Application du dictionnaire sur les oeuvres")
    for p in PieceOfWork.objects.all():
        category=translate(p.category,["categories"],True,1)
        if category and category!=p.category:
            log("Changement de catégorie " + str(p.title))
            p.category=category
            p.save()

        nature=translate(p.nature,["categories"],True,1)
        if nature and nature!=p.nature:
            log("Changement de nature pour " + str(p.title))
            p.nature=nature
            p.save()



    return Response({"message":"ok"})


#http://localhost:8000/api/search?q=hoareau
@api_view(["GET"])
@permission_classes([AllowAny])
def search(request):
    q=request.GET.get("q","")
    s=Search().using(Elasticsearch()).query("match",title=q)
    return s.execute()



#http://localhost:8000/api/reindex
@api_view(["GET"])
@permission_classes([AllowAny])
def rebuild_index(request):
    """
    Relance l'indexation d'elasticsearch
    TODO: mettre en place un échéancier pour déclenchement régulier
    voir
    :param request:
    :return:
    """
    index_name=request.GET.get("index_name","")
    reindex(index_name)
    return JsonResponse({"message":"Re-indexage terminé"})




#http://localhost:8000/api/batch
#https://api.f80.fr:8000/api/batch
@api_view(["POST"])
@permission_classes([AllowAny])
def batch(request):
    """

    :param request:
    :return:
    """
    try:
        content=loads(str(request.body,"utf8"))
    except:
        content=None

    filter:str= request.GET.get("filter", "*")
    limit= request.GET.get("limit", 2000)
    limit_contrib=request.GET.get("contrib", 2000)
    offline=request.GET.get("offline", False)
    profils=Profil.objects.order_by("dtLastSearch").all()
    refresh_delay_profil=int(request.GET.get("refresh_delay_profil", 31))
    refresh_delay_page=int(request.GET.get("refresh_delay_page", 31))

    n_films=0
    n_works=0
    if filter!="*":
        if filter.isnumeric():
            profils=Profil.objects.filter(id=filter,school="FEMIS").order_by("dtLastSearch")
            profils.update(auto_updates="0,0,0,0,0,0")
        else:
            for f in filter.split(","):
                profils=Profil.objects.filter(lastname__istartswith=f.strip(),school="FEMIS").order_by("dtLastSearch")
                n_f,n_w=exec_batch(profils,refresh_delay_profil,
                                           refresh_delay_page,int(limit),int(limit_contrib),
                                           content=content,
                                   remove_works=request.GET.get("remove_works","false")=="true",offline=offline)
                n_films+=n_f
                n_works+=n_w

            return Response({"message":"ok","films":n_films,"works":n_works})


    n_films,n_works=exec_batch(profils,refresh_delay_profil,
                                    refresh_delay_page,int(limit),int(limit_contrib),
                                    content=content,remove_works=request.GET.get("remove_works","false")=="true")

    return Response({"message":"ok","films":n_films,"works":n_works})


@api_view(["GET"])
@permission_classes([AllowAny])
def api_doc(request):
    complete=request.GET.get("complete",False)
    format=request.GET.get("out","json")
    rc=[]
    old_table=""
    for field in list(Profil._meta.fields)+list(Work._meta.fields)+list(PieceOfWork._meta.fields)+list(Award._meta.fields)+list(Festival._meta.fields):
        help_text=field.help_text
        if len(help_text)>0 and not help_text.startswith("@") and not help_text.startswith("!"):
            table=str(field).split(".")[1]
            if old_table==table:
                if not complete: table=""
            else:
                old_table=table

            if format=="json":
                rc.append({
                    "field":field.name,
                    "description":help_text,
                    "table":table
                })
            else:
                rc.append(field.name+";"+help_text+";"+table)

    if format=="json":
        return JsonResponse({"version":"1","content":rc},safe=False)

    if format=="csv":
        output=StringIO()
        output.write("\r".join(rc))
        output.seek(0)
        response = HttpResponse(content=output.getvalue(),content_type='text/csv; charset=utf-8')
        response["Content-Disposition"] = 'attachment; filename=dictionnaire_data.csv'
        return response




#http://localhost:8000/api/quality_filter
#https://api.f80.fr:8000/api/quality_filter
@api_view(["GET"])
@permission_classes([AllowAny])
def quality_filter(request):
    filter= request.GET.get("filter", "*")
    ope = request.GET.get("ope", "profils,films,works")
    profils=Profil.objects.order_by("dtLastSearch").all()
    report_email=request.GET.get("report_email", "")
    n_profils=0
    n_pows=0
    if filter!="*":
        profils=Profil.objects.filter(id=filter,school="FEMIS")

    if "awards" in ope:
        award_analyzer:AwardAnalyzer=AwardAnalyzer(Award.objects.all())
        to_delete=award_analyzer.find_double()
        for a in to_delete:
            a.delete()

    if "works" in ope:
        work_analyzer=WorkAnalyzer()
        work_analyzer.remove_bad_work(["?","Elle/lui même","Repérages","Droits","Collaboration"])


    if "profils" in ope:
        profil_filter = ProfilAnalyzer()

        n_profils,log,to_delete=profil_filter.analyse(profils)
        to_delete=to_delete+profil_filter.find_double(profils)

        for id in to_delete:
            _p=Profil.objects.get(id=id)
            log("Suppression du profil "+_p.name)
            _p.delete()

        if len(report_email)>0:
            sendmail("DataCulture: Traitement qualité sur les profils",report_email,"quality_report.html",{"log":log})


    if "films" in ope:
        pow_analyzer=PowAnalyzer(PieceOfWork.objects.all())
        n_pows=pow_analyzer.find_double()

        to_delete=pow_analyzer.quality()
        count=0
        for id in to_delete:
            count=count+1
            _p=PieceOfWork.objects.get(id=id)
            #log("Destruction de "+str(count)+"/"+str(len(to_delete)))
            _p.delete()


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


@api_view(["POST"])
@permission_classes([AllowAny])
def api_sendmail(request):
    body=request.data
    sendmail(body["subject"],body["to"],body["template"],body["replacement"])
    return Response("ok",200)



#test: http://localhost:8000/api/set_perms/?user=6&perm=statistique&response=accept
#Accepter la demande de changement de status
@api_view(["POST"])
@permission_classes([AllowAny])
def send_report_by_email(request):
    user_id=int(request.GET.get("userid",None))
    if not user_id is None:
        _user=ExtraUser.objects.filter(user_id=user_id).get()
        sendmail("Vos rapports",_user.user.email,"instant_report",request.data)
        return Response("ok",200)
    else:
        return Response("Utilisateur inconnu",500)


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
            ext_user.ask=p["id"]
            ext_user.save()
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

    PowAnalyzer(pows).quality()

    return JsonResponse({"message":"ok","pow":analyse_pows(pows,search_with=search_by,cat=cat)})



#http://localhost:8000/api/raz/
@api_view(["GET"])
@permission_classes([AllowAny])
def api_raz(request):
    filter=request.GET.get("tables","all")
    if request.GET.get("password","")!=RESET_PASSWORD:
        return Response({"message":"Password incorrect","error":1})

    raz(filter)

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


#http://localhost:8000/api/send/
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



#Exemple : http://localhost:8000/api/social_distance/?profil_id=1
@api_view(["GET"])
@permission_classes([AllowAny])
def social_distance(request):
    profils=Profil.objects.filter(department__iexact=request.GET.get("department","")) if request.GET.get("department","")!="" else Profil.objects.all()
    if len(profils)>0:
        G = SocialGraph(profils)
        matrix=G.distance()

        idx=G.idx_node(request.GET.get("profil_id"))
        if idx:
            rc=list()
            for id in range(1,len(profils)):
                _d=G.G.nodes[id]
                _d["distance"]=matrix[idx][id] if matrix[idx][id]!=inf else -1
                rc.append(_d)
            return Response(rc)

    return Response("Error")



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
    filter=request.GET.get("filter","0")
    degree_filter = filter.split("_")[0]
    department_filter = "" if not "_" in filter else filter.split("_")[1]

    if degree_filter != "0" and degree_filter!="null":
        profils = Profil.objects.filter(degree_year=int(degree_filter), department__contains=department_filter)
    else:
        profils = Profil.objects.filter(department__contains=department_filter)

    log("Récupération des profils ok")

    G=SocialGraph()
    log("Initialisation du graph ok")

    G.load(profils,request.GET.get("film")!="false")
    log("Chargement des profils dans le graphe ok")

    G.eval(request.GET.get("eval",""))
    log("Evaluation du critère ok")

    G.filter("pagerank",0.0005)
    log("Filtrage sur le pagerank")

    if format=="json":
        return JsonResponse(G.export(format))
    else:
        with open(G.export(format), 'rb') as f:
            file_data = f.read()

        response = HttpResponse(content=file_data,content_type='plain/text')
        response["Content-Disposition"] = 'attachment; filename="femis.'+format+'"'
        return response



@api_view(["GET"])
@permission_classes([AllowAny])
def export_dict(request):
    """
    test:
    :param request:
    :return:
    """
    _d=init_dict()
    df=pd.DataFrame(data=_d["jobs"].values(),index=_d["jobs"].keys(),columns=["dest"])

    output = BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    df.to_excel(writer,sheet_name="Dictionnaire")
    writer.save()
    output.seek(0)

    response = HttpResponse(content=output.getvalue(),content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response["Content-Disposition"] = 'attachment; filename=dictionnaire.xlsx'
    return response



#http://localhost:8000/api/export_profils/?cursus=P
#http://localhost:8000/api/export_profils/?cursus=S
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

    response = HttpResponse(content_type='application/vnd.ms-excel; charset=utf-8')
    response["Content-Disposition"]='attachment; filename="profils.xlsx"'
    df.to_excel(response,encoding="utf8")
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


#http://localhost:8000/api/export_all/?out=json
#http://localhost:8000/api/export_all/xls/
#http://localhost:8000/api/export_all/xml/
#http://localhost:8000/api/export_all/json/
@api_view(["GET","POST"])
@renderer_classes((WorksCSVRenderer,))
@permission_classes([AllowAny])
def export_all(request):
    """
    Exportation statistiques pour consolidation /stats /stat
    :param request:
    :return:
    """

    table = request.GET.get("table","sql").lower()
    limit=int(request.GET.get("limit", "0"))
    title=request.GET.get("title","Reporting FEMIS")
    format=request.GET.get("out","json")
    description=request.GET.get("description","")+"<br>"
    cols=request.GET.get("cols")
    sql:str=request.GET.get("sql")

    log("Chargement de la table "+table)

    df=None
    # if table.startswith("award"):
    #     awards = Award.objects.all()
    #     df: pd.DataFrame = pd.DataFrame.from_records(list(awards.values(
    #         "profil__id", "profil__gender", "profil__lastname",
    #         "profil__firstname", "profil__department", "profil__cursus",
    #         "profil__degree_year", "profil__cp", "profil__town", "profil__dtLastUpdate", "profil__dtLastSearch",
    #
    #         "pow__id", "pow__title", "pow__nature",
    #         "pow__category", "pow__year", "pow__budget",
    #         "pow__production",
    #
    #         "festival__id","festival__title","festival__country","festival__url",
    #
    #         "id", "description", "winner","year"
    #     )))
    #
    # if table.startswith("work"):
    #     works=Work.objects.all()
    #     df:pd.DataFrame = pd.DataFrame.from_records(list(works.values(
    #         "profil__id","profil__gender","profil__lastname",
    #         "profil__firstname","profil__department","profil__cursus",
    #         "profil__degree_year","profil__cp","profil__town","profil__dtLastUpdate","profil__dtLastSearch",
    #
    #         "pow__id","pow__title","pow__nature",
    #         "pow__category","pow__year","pow__budget",
    #         "pow__production",
    #
    #         "id","job","comment","validate","source","state"
    #     )))

    # if df is None and table!="sql":
    #     values = request.GET.get("data_cols").split(",")
    #
    #     if table.startswith("profil"): data = Profil.objects.all().values(*values)
    #     if table.startswith("pieceofwork"): data = PieceOfWork.objects.all().values(*values)
    #     if table.startswith("work"): data = Work.objects.all().values(*values)
    #     if table.startswith("festival"): data = Festival.objects.all().values(*values)
    #     if table.startswith("award"): data = Award.objects.all().values(*values)
    #
    #     df=pd.DataFrame.from_records(data,columns=values)
        # if len(data)>0:
        #     df.columns=list(request.GET.get("cols").split(","))

    if limit>0:
        df=df[:limit]

    log("Chargement des données terminées")


    if not sql is None:
        log("Chargement de la requete "+sql)
        filters=request.GET.get("filters","")
        if len(filters)>0:
            filter_clause=""
            for f in filters.split(","):
                if ":" in f and f.split(":")[1]!="undefined":
                    if len(filter_clause)>0: filter_clause=filter_clause+" AND "
                    filter_clause=filter_clause+f.split(":")[0]+"='"+f.split(":")[1]+"'"

            if len(filter_clause)>0:
                sql=sql.replace("where","WHERE")
                if "WHERE" in sql:
                    sql=sql.replace("WHERE ","WHERE "+filter_clause+" AND ")
                else:
                    pos=sql.index(" FROM ")+6
                    try:
                        pos=sql.index(" ",pos+1)
                    except:
                        pos=len(sql)
                    sql=sql[:pos]+" WHERE "+filter_clause+" "+sql[pos:]

        if "from df" in sql.lower():
            df=pandasql.sqldf(sql)
        else:
            cursor=connection.cursor()
            cursor.execute(sql)
            rows=cursor.fetchall()
            if cols is None:
                cols=[x.name for x in list(cursor.cursor.description)]
            else:
                cols=cols.split(",")
            df=pd.DataFrame.from_records(rows,columns=cols)


    if not df is None:
        if len(df) == 0: return HttpResponse("Aucune donnée disponible", status=404)
        lib_columns=",".join(list(df.columns))

        if not cols is None and cols!="undefined":
            log("On ne conserve que "+",".join(cols)+" dans "+","+lib_columns)
            df=df[cols].drop_duplicates()


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
        log("Chargement du dictionnaire de substitution")


    if request.method=="POST":
        pivot_obj=loads(str(request.body,"utf8"))
        params_pivot=[pivot_obj["row"],pivot_obj["col"],pivot_obj["val"],pivot_obj["fun"]]

    if len(params_pivot)>0:
        df=pd.pivot_table(df,index=params_pivot[0],columns=params_pivot[1],values=params_pivot[2],aggfunc=params_pivot[3].split("/"))

    log("Exportation en mode "+format)
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
        writer.close()
        output.seek(0)

        response = HttpResponse(content=output.getvalue(),content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response["Content-Disposition"] = 'attachment; filename='+title+'.xlsx'
        return response

    if format.startswith("graph"):
        if request.GET.get("chart","none")=="none" or request.GET.get("chart","none")=="undefined":
            code=STYLE_TABLE+"<div class='mainform'><h3 style='color:grey'>"+title+"</h3><small>"+description+"</small>"+df.to_html(index=False,justify="center",border=0,render_links=True)+"</div>"
            rc={"code":code,"values":code}
        else:
            graph=StatGraph(df)
            height=request.GET.get("height","400").replace(",",".").split(".")[0]
            graph.trace(
                request.GET.get("x",df.columns[0]),
                request.GET.get("y",df.columns[1]),
                request.GET.get("color",None),
                int(height),
                style=request.GET.get("chart","bar"),
                title=title,
                template=request.GET.get("template","seaborn")
            )
            rc = graph.to_html()

        log("Construction du graph terminée")

        filter = request.GET.get("filter")
        if filter:
            col_filter=0
            for i,cl in enumerate(sql.split(",")):
                if filter in cl.split(" as ")[0]:
                    col_filter=i
                    break
            rc["filter_values"] = list(set(df[cols[col_filter]].values))

        if format=="graph":
            return JsonResponse(rc)
        else:
            return HttpResponse(content=rc["code"])






@api_view(["GET"])
@permission_classes([AllowAny])
def image_search(request):
    rc=ImageSearchEngine().search(request.GET.get("q"),request.GET.get("type"))
    return JsonResponse(rc,safe=False)



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
    d,total_record=importer_file(request.data["file"],request.data["filename"])

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






#http://localhost:8000/api/importer/
#profils importer profil_importer profils_importer
@api_view(["POST"])
@permission_classes([AllowAny])
def api_importer(request):
    """

    Importation des profils /import
    :param request:
    :param format:
    :return:
    """
    dictionnary=request.data["dictionnary"]
    rows,total_record=importer_file(request.data["file"])
    record,non_import=profils_importer(rows,total_record,dictionnary)
    if record>0: reindex()

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
class FestivalDocumentView(DocumentViewSet):
    document=FestivalDocument
    serializer_class = FestivalDocumentSerializer
    pagination_class = LimitOffsetPagination
    lookup_field = "id"
    filter_backends = [
        FilteringFilterBackend,
        DefaultOrderingFilterBackend,
        SimpleQueryStringSearchFilterBackend,
        # MultiMatchSearchFilterBackend
    ]

    filter_fields ={
        "title":"title.raw",
        "year":"year"
    }

    simple_query_string_search_fields = {
        'title': {'boost': 4},
        'year':{'boost':3},
        'description':{'boost':1}
    }

    simple_query_string_options = {
        "default_operator": "and",
    }

    #search_fields = ('title','year',"award__pow__title","description","award__profil__lastname")



#http://localhost:8000/api/profilsdoc
#http://localhost:8000/api/profilsdoc/?search_simple_query_string=julia
#http://localhost:8000/api/profilsdoc/?search_simple_query_string=titane

@permission_classes([AllowAny])
class ProfilDocumentView(DocumentViewSet):
    document=ProfilDocument
    serializer_class = ProfilDocumentSerializer
    pagination_class = LimitOffsetPagination
    lookup_field = "id"
    filter_backends = [
        FilteringFilterBackend,
        # CompoundSearchFilterBackend,
        OrderingFilterBackend,
        DefaultOrderingFilterBackend,
        SimpleQueryStringSearchFilterBackend,
        #MultiMatchSearchFilterBackend
    ]
    #voir la documentation : https://django-elasticsearch-dsl-drf.readthedocs.io/en/0.22.2/search_backends.html
    #

    #On utilisera dans la requete : search_simple_query_string
    simple_query_string_search_fields = {
        'lastname': {'boost': 4},
        'department_category': {'boost': 4},
        'degree_year': {'boost': 4},
        'firstname': {'boost': 1},
        'department': {'boost': 3},
        'works__job': {'boost': 2},
        'works__pow__title': {'boost': 2},
        'awards__title': {'boost': 2},
        'town':{'boost':1}
    }

    simple_query_string_options = {
        "default_operator": "and",
    }

    # multi_match_search_fields = {
    #     'lastname': {'boost': 4},
    #     'degree_year': {'boost': 4},
    #     'department_category': {'boost': 3},
    # }

    #voir https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-phrase
    # multi_match_options = {
    #     'type': 'best_fields'
    # }


    # search_fields = ('lastname',
    #                  'firstname',
    #                  'department',
    #                  'degree_year'
    #                  'department_category',
    #                  'works__job',
    #                  'works__pow__title',
    #                  'awards__festival__title',
    #                  'awards__description',
    #                  'awards__year'
    #                  )

    filter_fields = {
        'profil':'id',
        'name': 'name',
        'lastname':'lastname',
        'firstname': 'firstname',
        'categorie': 'department_category',
        'cursus':'cursus',
        'promo':'degree_year',
        'school':'school',
        'town':'town',
        'formation':'department'
    }

    ordering_fields = {
        'lastname':None,
        'degree_year':None,
        'update':None
    }


    # suggester_fields = {
    #     'name_suggest': {
    #         'field': 'lastname',
    #         'suggesters': [SUGGESTER_COMPLETION,],
    #     },
    # }



#exemples de requete
#http://localhost:8000/api/powsdoc/?format=json&limit=200&search_simple_query_string="les%20chansons"
#http://localhost:8000/api/powsdoc
@permission_classes([AllowAny])
class PowDocumentView(DocumentViewSet):
    document=PowDocument
    serializer_class = PowDocumentSerializer
    pagination_class = LimitOffsetPagination
    lookup_field = "id"

    filter_backends = [
        OrderingFilterBackend,
        DefaultOrderingFilterBackend,
        CompoundSearchFilterBackend,
        SimpleQueryStringSearchFilterBackend
    ]

    search_fields = ("works__job", "works__lastname", "award__festival__title","award__description",)

    simple_query_string_search_fields  = {
        'title':{
            "default_operator":"and",
            "analyze_wildcard":True,
            "flags":"OR|AND|PREFIX",
            },
        'category': None,
        'year':None,
        'nature':None,
    }


    # filter_fields = {
    #     'title':{
    #         'field':'title',
    #         'lookups':[LOOKUP_QUERY_STARTSWITH,LOOKUP_FILTER_TERMS,LOOKUP_FILTER_PREFIX,LOOKUP_FILTER_WILDCARD,]
    #     },
    #     'category': {
    #         'field': 'category',
    #         'lookups': [LOOKUP_FILTER_TERM, LOOKUP_FILTER_TERMS, LOOKUP_FILTER_PREFIX, LOOKUP_FILTER_WILDCARD,
    #                     LOOKUP_QUERY_IN, LOOKUP_QUERY_EXCLUDE, ]
    #     }
    # }

    ordering_fields = {
        'year':'year',
        'title': 'title'
    }

