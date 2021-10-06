
import yaml
from django_elasticsearch_dsl_drf.serializers import DocumentSerializer
from rest_framework import serializers
from django.contrib.auth.models import User, Group
from rest_framework.authtoken.models import Token
from rest_framework.serializers import HyperlinkedModelSerializer
from rest_framework.validators import UniqueValidator
from rest_framework_csv.renderers import CSVRenderer

from OpenAlumni.Tools import reset_password, log, sendmail
from alumni.documents import ProfilDocument, PowDocument
from alumni.models import Profil, ExtraUser, PieceOfWork, Work, Article, Company

import os
if os.environ.get("DEBUG"):
    from OpenAlumni.settings_dev import *
else:
    from OpenAlumni.settings import *


class UserSerializer(HyperlinkedModelSerializer):
    email = serializers.EmailField(required=True,validators=[UniqueValidator(queryset=User.objects.all())])
    class Meta:
        model = User
        fields = ['id','url','email','username','first_name',"last_name"]


    def create(self, data):
        """
        Création d'un profil utilisateur avec initialisation du mot de passe
        :param data:
        :return:
        """
        log("Création du password, du user et du token")
        if data["username"].startswith("___"):
            password = data["username"].replace("___","")
            data["username"]=data["email"]
            sendmail("Voici votre code de connexion via mail", [data["email"]], "welcome_google", dict({
                "email": data["email"],
                "url_appli": DOMAIN_APPLI + "/?email=" + data["email"],
                "firstname":data["first_name"],
                "code": password,
                "appname": APPNAME
            }))
        else:
            password = reset_password(data["email"], data["username"])

        if not "first_name" in data:data["first_name"]=data["email"].split(".")[0]
        if not "last_name" in data:data["last_name"]=""

        user = User.objects.create_user(
            username=data["username"],
            password=password,
            email=data["email"],
            first_name=data["first_name"],
            last_name=data["last_name"],
        )
        token = Token.objects.create(user=user)

        log("Récupération des profils")
        lp=list(Profil.objects.filter(email=data["email"]))
        profils=yaml.safe_load(open(settings.STATIC_ROOT + "/profils.yaml", "r").read())
        perm=profils["profils"][1]["perm"]

        log("Création de l'extraUser")
        if len(lp)>0:
            eu=ExtraUser.objects.create(user=user,perm=perm,profil=lp[0],black_list="",level=profils["profils"][1]["level"])
        else:
            eu = ExtraUser.objects.create(user=user, perm=perm,black_list="",level=profils["profils"][1]["level"])
        eu.save()

        user.save()

        log("Procédure de création terminée")
        return user



#http://localhost:8000/api/extrausers
class ExtraUserSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = ExtraUser
        fields  = ['id','user','perm','profil',"ask","friends","profil_name"]



class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields  = ['id','name','siret','address']




class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['url', 'name']




class POWSerializer(serializers.ModelSerializer):
    class Meta:
        model=PieceOfWork
        fields=["id","title","url","links","owner","visual","category","year","description","nature","dtLastSearch"]


class ExtraPOWSerializer(serializers.ModelSerializer):
    works = serializers.StringRelatedField(many=True, read_only=True)
    class Meta:
        model=PieceOfWork
        fields=["id","title","url","works","links","owner","visual","category","year","description","nature"]




#http://localhost:8000/api/profils/?filter{firstname}=Adrien
class ProfilSerializer(serializers.ModelSerializer):
    class Meta:
        model=Profil
        fields=["id","lastname","firstname","acceptSponsor","sponsorBy","school",
                "mobile","email","photo","gender","job",
                "facebook","youtube","tiktok","vimeo","instagram","telegram","twitter",
                "linkedin","degree_year","department",
                "dtLastUpdate","links","str_links","blockchain",
                "cp","public_url","fullname","cursus",
                "address","town","promo","dtLastSearch"]



class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model=Article
        ordering=["-dtCreate"]
        fields=["id","owner","validate","html","dtCreate","dtPublish","tags","to_publish"]


    def to_representation(self, instance):
        self.fields['owner'] = ProfilSerializer(read_only=True)
        return super(ArticleSerializer, self).to_representation(instance)


#http://localhost:8000/api/profils/?filter{firstname}=Adrien
class ExtraProfilSerializer(serializers.ModelSerializer):
    works = serializers.StringRelatedField(many=True,read_only=True)
    sponsor = ProfilSerializer(many=False,read_only=True)
    class Meta:
        model=Profil
        fields=["id","lastname","firstname","acceptSponsor","sponsorBy","sponsor",
                "facebook", "youtube", "tiktok", "vimeo", "instagram", "telegram", "twitter",
                "mobile","email","photo","gender","job",
                "linkedin","works","degree_year","department",
                "dtLastUpdate","links","str_links",
                "cp","public_url","fullname","cursus",
                "address","town","promo"]







#http://localhost:8000/api/works/
class WorkSerializer(serializers.ModelSerializer):
    class Meta:
        model=Work
        fields=["profil","pow",
                "duration","comment","job","title",
                "public","creator","id","validate",
                "source","year","nature","state"]




class WorksCSVRenderer (CSVRenderer):
    header = [
        "profil_id", "profil_genre","profil_nom", "profil_prenom", "profil_formation", "profil_cursus","profil_promotion","profil_code_postal", "profil_ville",
        "film_id","film_titre", "film_catégorie", "film_genre","film_annee","film_budget","film_production",
        "work_id", "work_job","work_comment","work_validate","work_source","work_state"
    ]


class ProfilsCSVRenderer (CSVRenderer):
    header = [
        "id","photo","genre","lastname", "firstname", "email","mobile","departement","adresse","CP", "ville","country",
        "birthdate","nationality","promotion","job","cursus"
    ]



#ProfilDocument utilisé par elasticsearch
class ProfilDocumentSerializer(DocumentSerializer):
    works=serializers.StringRelatedField(many=True, read_only=True)
    class Meta:
        document=ProfilDocument
        fields=("id","firstname","lastname","school",
                "acceptSponsor","sponsorBy",
                "name","cursus","job","links",
                "degree_year","public_url","blockchain",
                "photo","cp","department",
                "address","town","promo",
                "dtLastUpdate","dtLastSearch")


class PowDocumentSerializer(DocumentSerializer):
    class Meta:
        document=PowDocument
        fields=("id","title","nature","description",'category','year','works','links')



class ExtraWorkSerializer(serializers.ModelSerializer):
    pow= POWSerializer(many=False,read_only=True)
    profil=ProfilSerializer(many=False,read_only=True)
    class Meta:
        model=Work
        fields=["id","profil","pow","duration","comment","job","source","public"]
