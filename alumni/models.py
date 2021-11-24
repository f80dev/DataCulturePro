import datetime

import os

import yaml

if os.environ.get("DEBUG"):
    from OpenAlumni.settings_dev import *
else:
    from OpenAlumni.settings import *

from django.contrib.auth.models import AbstractUser, User
from django.contrib.postgres.fields import ArrayField
from django.db import models

# Create your models here.
#Mise a jour du model : python manage.py makemigrations
from django.db.models import Model, CASCADE, JSONField
from django.db.models.signals import post_save
from django.dispatch import receiver
from django_elasticsearch_dsl.registries import registry

from OpenAlumni.DataQuality import eval_field
from OpenAlumni.Tools import now, log


class Profil(models.Model):
    """
    Le profil stocke l'ensemble des informations sur les anciens étudiants, issue du cursus standard ou pro
    """
    id=models.AutoField(primary_key=True)
    #company=models.ForeignKey("Company",on_delete=models.DO_NOTHING,null=True)
    gender = models.CharField(max_length=1, blank=True, default="M",
                              choices=(('M', 'Male'), ('F', 'Female'), ('A', 'Autre'), ('', 'NSP')))
    firstname=models.CharField(max_length=40, null=False, default='',help_text="Prénom du profil")
    lastname = models.CharField(max_length=70, null=False, default='', help_text="Nom du profil")

    public_photo=models.BooleanField(default=False,null=False,help_text="Indique si la photo peut être ou pas présentée sur la page publique")
    birthdate=models.DateField(null=True,help_text="Date de naissance")
    mobile=models.CharField(blank=True,max_length=20,null=True,default="06",help_text="Numéro de mobile")
    nationality=models.CharField(blank=True,max_length=30,null=False,default="Française")

    department=models.CharField(blank=True,max_length=60,null=True,default="",help_text="Cursus (pro ou standard) suivi pendant les études")
    department_category=models.CharField(blank=True,max_length=30,null=True,default="",help_text="Categorie de la formation")

    job=models.CharField(max_length=60,null=True,default="",blank=True,help_text="Profession actuelle")
    degree_year=models.IntegerField(null=True,help_text="Année de sortie de l'école")

    linkedin = models.URLField(blank=True, null=True,help_text="Adresse de la page public linkedin du profil")
    email=models.EmailField(null=False,unique=True,help_text="email du profil")
    instagram=models.URLField(blank=True, null=True,help_text="Adresse du compte instagram")
    telegram=models.URLField(blank=True, null=True,help_text="Adresse public du compte telegram")
    facebook=models.URLField(blank=True, null=True,help_text="Adresse de la page facebook du profil")
    twitter=models.URLField(blank=True, null=True,help_text="Adresse de la page twitter du profil")
    tiktok=models.URLField(blank=True, null=True)
    youtube = models.URLField(blank=True, null=True)
    vimeo=models.URLField(blank=True, null=True)
    school=models.CharField(blank=True,max_length=30,null=True,default="FEMIS",help_text="Ecole")

    acceptSponsor = models.BooleanField(null=False, default=False)
    sponsorBy = models.ForeignKey('Profil', null=True,on_delete=CASCADE)

    photo=models.TextField(blank=True,default="/assets/img/anonymous.png",help_text="Photo du profil au format Base64")

    cursus=models.CharField(max_length=1,blank=False,default="S",choices=(('S','Standard'),('P','Professionnel')),help_text="Type de formation")
    address=models.CharField(null=True,blank=True,max_length=200,help_text="Adresse postale au format numéro / rue / batiment")
    town = models.CharField(null=True,blank=True,max_length=50, help_text="Ville de l'adresse postale")
    cp=models.CharField(null=True,blank=True,max_length=5,help_text="code postal")
    country=models.CharField(null=True,default="France",blank=True,max_length=50, help_text="Pays de naissance")

    website=models.URLField(null=True,blank=True,default="")
    dtLastUpdate=models.DateTimeField(null=False,auto_now=True,help_text="Date de la dernière modification du profil")
    dtLastSearch=models.DateTimeField(null=False,default=datetime.datetime(2021,1,1,0,0,0,0),help_text="Date de la dernière recherche d'expérience pour le profil")
    dtLastNotif=models.DateTimeField(null=False,default=datetime.datetime(2021,1,1,0,0,0,0),help_text="Date de la dernière notification envoyé")
    obsolescenceScore=models.IntegerField(default=0,help_text="Indique le degré d'obsolescence probable")
    biography=models.TextField(null=True,default="",max_length=2000,help_text="Biographie du profil")
    links = JSONField(null=True, help_text="Liens vers des références externes au profil")
    auto_updates=models.CharField(max_length=300,null=False, default="0,0,0,0,0,0",help_text="Date de mise a jour")
    advices=JSONField(null=True,default=None,help_text="Liste de conseils alimenter par l'outil pour augmenter le rayonnement d'une personne")
    source=models.CharField(null=True,blank=True,max_length=50,help_text="Source de la fiche")



    blockchain=models.CharField(null=False,blank=True,default="",max_length=50,help_text="Adresse elrond du profil")

    class Meta(object):
        ordering=["lastname"]

    def delay_update(self,_type,update=False):
        """
        :return: delay de mise a jour en heure
        """
        lastUpdates = self.auto_updates.replace("[", "").replace("]", "").split(",")
        rc=(datetime.datetime.now().timestamp() - float(lastUpdates[_type]))/3600
        if update:
            lastUpdates[_type]=str(datetime.datetime.now().timestamp())
            self.auto_updates=",".join(lastUpdates)

        return rc

    def delay_lastsearch(self):
        """
        :return: delay de mise a jour en heure
        """
        rc=(datetime.datetime.now().timestamp() - self.dtLastSearch.timestamp())/3600
        return rc


    def add_link(self,url,title,description=""):
        if self.links is None:self.links=[]
        obj={"url":url,"text":title,"update":now(),"desc":description}
        for l in self.links:
            if l["url"]==url:
                self.links.remove(l)
                break

        self.links.append(obj)
        return self.links


    @property
    def public_url(self):
        return DOMAIN_APPLI+"/works/?id="+str(self.id)+"&name="+self.firstname+" "+self.lastname

    @property
    def promo(self):
        return str(self.degree_year)

    @property
    def fullname(self):
        return '%s %s' % (self.firstname, self.lastname)

    @property
    def str_links(self):
        if self.links is None:return ""
        s=""
        for l in self.links:
            s=s+l.url+";"
        return s

    def __str__(self):
        return "{'id':"+str(self.id)+",'email':'"+self.email+"','fullname':'"+self.fullname+"','address':'"+self.address+" "+self.cp+" "+self.town+"'}"

    @property
    def name_field_indexing(self):
        return {"name":self.lastname+" "+self.firstname}


class Company(models.Model):
    id = models.AutoField(primary_key=True)
    name=models.CharField(max_length=100,blank=False,null=False)
    siret=models.CharField(max_length=14,default="")
    address=models.CharField(max_length=150,default="")



class Article(models.Model):
    id = models.AutoField(primary_key=True)
    owner = models.ForeignKey(User, null=False, on_delete=models.CASCADE, related_name="Articles",help_text="Auteur de l'article")
    validate=models.BooleanField(default=False,null=False,help_text="Une fois à vrai l'article est visible de tous")
    html=models.TextField(max_length=5000, blank=True,default="",help_text="Contenu de l'article")
    dtPublish = models.DateField(null=True, help_text="Date de publication de l'article")
    dtCreate = models.DateField(auto_now=True, null=False, help_text="Date de création de l'article")
    tags=models.CharField(max_length=100,default="")
    to_publish=models.BooleanField(default=False,null=False,help_text="Demander la publication")

    class Meta:
        ordering = ["dtCreate"]


#Gestion du modele UserExtra______________________________________________________________________________________
class ExtraUser(models.Model):
    """
    Classe supplémentaire pour gérer les permissions par utilisateur
    voir https://simpleisbetterthancomplex.com/tutorial/2016/07/22/how-to-extend-django-user-model.html
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    perm = models.TextField(max_length=500, blank=True,default="")
    profil_name=models.CharField(max_length=50,default="",blank=True)
    black_list=models.TextField(help_text="Contient l'ensemble des emails ne pouvant contacter la personne",null=False,default="")
    profil=models.OneToOneField(Profil,on_delete=models.CASCADE,null=True)

    level=models.IntegerField(default=0,help_text="Niveau de l'utilisateur")
    ask=ArrayField(base_field=models.IntegerField(null=False,default=0),null=True)
    friends=ArrayField(base_field=models.IntegerField(null=False,default=0),null=True)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Création d'un utilisateur
    :param sender:
    :param instance:
    :param created:
    :param kwargs:
    :return:
    """
    if created:
        log("Creation de l'extrauser associé")
        perms = yaml.safe_load(open(STATIC_ROOT + "/profils.yaml", "r", encoding="utf-8").read())
        perm=""
        for p in perms["profils"]:
            if p["id"] == DEFAULT_PERMS_PROFIL:
                perm = p["perm"]
                break

        log("Permission par défaut pour les connectés : " + perm)
        ExtraUser.objects.create(user=instance,perm=perm)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.extrauser.save()



class Work(models.Model):
    """
    Réalisation / projets des profils
    Cet objet permet de faire le lien entre les oeuvres et les profils
    Il peut être alimenté en automatique (par scrapping des sources) ou en manuel par le profil
    """
    id = models.AutoField(primary_key=True,help_text="Clé primaire interne des projets")
    profil = models.ForeignKey('Profil', null=False, on_delete=models.CASCADE,related_name="works",help_text="Profil concerné par le projet")
    pow = models.ForeignKey('PieceOfWork', null=False, on_delete=models.CASCADE, related_name="works",help_text="oeuvre concerné par le projet")
    status=models.CharField(max_length=200,default="")
    state=models.CharField(max_length=1,default="A",help_text="etat du travail entre A=automatiquement creer,E=editer par le profil, D=supprimé par le profil")

    #creator passera à user si l'utilisateur modifie l'enregistrement
    creator=models.CharField(max_length=5,default="auto",help_text="Désigne qui est le dernier auteur de l'enregistrement dans la base de données")
    public=models.BooleanField(default=True,help_text="Indique si le projet est publique (visible de ceux qui ont les droits) ou privé")

    job=models.CharField(max_length=200,default="",help_text="Rôle dans le projet")
    duration=models.IntegerField(default=0,null=False,help_text="Durée du projet en heure")
    comment=models.TextField(max_length=400,null=False,default="",blank=True,help_text="Commentaire sur la façon dont s'est passé le projet")
    earning=models.IntegerField(default=None,null=True,help_text="Revenu percu brut pour la durée annoncée")
    source=models.CharField(max_length=100,null=False,default="",help_text="source ayant permis d'identifier le projet : imdb, unifrance, bellefaye, manuel")
    validate=models.BooleanField(default=False,help_text="Indique si l'expérience est validé ou pas")

    @property
    def title(self):
        return self.pow.title


    @property
    def year(self):
        return self.pow.year

    @property
    def nature(self):
        return self.pow.nature


    @property
    def lastname(self):
        return self.profil.lastname


    def __str__(self):
        d:dict=dict({
            "name":self.profil.firstname+" "+self.profil.lastname,
            "job":self.job,
            "comment":self.comment,
        })
        if self.pow is not None:d["pow"]={"title":self.pow.title}

        return str(d)




class PieceOfWork(models.Model):
    """
    Description des oeuvres

    """
    id = models.AutoField(primary_key=True)

    dtLastSearch = models.DateTimeField(null=False, auto_now_add=True, help_text="Date de la derniere recherche automatique sur l'oeuvre")
    visual = models.TextField(blank=True,help_text="Visuel de l'oeuvre")
    dtStart=models.DateField(auto_now=True,null=False,help_text="Date de début de la réalisation de l'oeuvre")
    dtEnd=models.DateField(auto_now=True,null=False,help_text="Date de fin de la réalisation de l'oeuvre")
    title=models.CharField(null=False,max_length=300,unique=True,default="sans titre",help_text="Titre de l'oeuvre, même temporaire")
    year=models.CharField(null=True,max_length=4,help_text="Année de sortie")
    nature=models.CharField(null=False,default='MOVIE',max_length=20,help_text="Classification de l'oeuvre")
    dtCreate = models.DateField(auto_now_add=True,help_text="Date de création de l'oeuvre")

    reference=models.CharField(null=False,default="",blank=True,max_length=50,help_text="Reference d'oeuvre")
    budget = models.IntegerField(default=0, help_text="Coût total de réalisation de l'oeuvre")
    production=models.CharField(null=False,default="",blank=True,max_length=100,help_text="Production de l'oeuvre")

    #Structure : "url" du document, "text" du lien
    links=JSONField(null=True,help_text="Liens vers des références externes à l'oeuvre")

    owner=models.CharField(max_length=150,default="public",help_text="Auteur de l'oeuvre")
    description=models.TextField(null=False,default="",max_length=3000,help_text="Description/Resumer de l'oeuvre")
    # Structure : "url" du document, "type" de document (str), "title" du document
    files=JSONField(null=True,help_text="Liens vers des documents attaché")
    category=models.TextField(null=True,max_length=200,help_text="Liste des categories auxquelles appartient le film")
    lang=models.CharField(max_length=50,null=True,help_text="Langue originale de l'oeuvre")

    apiVideoId=models.CharField(max_length=20,default="",null=False,blank=True,help_text="Version stocké sur api.video")
    distributer=models.CharField(max_length=150,default="",blank=True,null=True,help_text="Distribution de l'oeuvre")
    minutes=models.IntegerField(default=None,null=True,help_text="Durée de l'oeuvre en minutes")
    copies=models.IntegerField(default=None,null=True,help_text="Nombre de copies distribuée")
    visa=models.CharField(max_length=10,null=True,help_text="Visa d'exploitation")
    financal_partner=JSONField(null=True,help_text="Liste des partenaires financiers")
    first_week_entrances=models.IntegerField(null=True,help_text="Nombre d'entrée la première semaine")
    prizes=JSONField(null=True,help_text="Liste des prix")


    def __str__(self):
        rc=self.title
        if not self.id is None:rc=str(self.id)+" : "+rc
        if not self.year is None:rc=rc+" ("+self.year+")"
        if not self.category is None:rc=rc+" - "+self.category
        return rc


    def delay_lastsearch(self):
        if self.dtLastSearch is None:return 1e12
        rc=(datetime.datetime.now().timestamp() - self.dtLastSearch.timestamp())/3600
        return rc


    def add_link(self, url, title, description=""):
        if self.links is None: self.links = []
        if url is None:return self.links

        obj = {"url": url, "text": title, "update": now(), "desc": description}
        for l in self.links:
            if l["url"] == url:
                self.links.remove(l)
                break

        self.links.append(obj)
        return self.links


    def quality_score(self):
        """
        Défini un score de qualité de la donnée. Ce score est notamment utilisé pour les fusions
        :return: le score
        """
        score=eval_field(self.title,5)+eval_field(self.budget,2)+eval_field(self.owner,3)+2*len(self.links)+eval_field(self.visual,2)+eval_field(self.year,3)
        return score


@receiver(post_save,sender=Work)
def update_pow(sender, **kwargs):
    instance = kwargs['instance']
    registry.update(instance.profil)



# class School(models.Model):
#     name = models.TextField(max_length=100)


# class Degree(models.Model):
#     profil = models.ForeignKey('Profil',null=False,on_delete=models.CASCADE)
#     school = models.ForeignKey('School',null=False,on_delete=models.CASCADE)
#     dtCreate = models.DateField(auto_now_add=True)


