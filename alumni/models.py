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
from django.db.models import Model, CASCADE, JSONField, SET_NULL
from django.db.models.signals import post_save
from django.dispatch import receiver
from django_elasticsearch_dsl.registries import registry

from OpenAlumni.Tools import now, log

def eval_field(s,score=1):
    """
    Evalue la qualité d'un champs
    :param s:
    :param score:
    :return:
    """
    if s is None:return 0
    if type(s)==str and len(s)==0:return 0
    if (type(s)==int or type(s)==float) and int(s)==0:return 0
    return score


#http://localhost:8000/api/profils/?lastname=ducournau
class Profil(models.Model):
    """
    Le profil stocke l'ensemble des informations sur les anciens étudiants, issue du cursus standard ou pro
    """
    id=models.AutoField(primary_key=True)
    #company=models.ForeignKey("Company",on_delete=models.DO_NOTHING,null=True)

    gender = models.CharField(max_length=1, blank=True, default="M",
                              choices=(('M', 'Male'), ('F', 'Female'), ('A', 'Autre'), ('', 'NSP')),help_text="Genre du profil")
    firstname=models.CharField(max_length=40, null=False, default='',help_text="Prénom du profil")
    lastname = models.CharField(max_length=70, null=False, default='', help_text="Nom du profil")
    name_index=models.CharField(max_length=70, null=False, default='', help_text="Index du nomprenom du profil")

    public_photo=models.BooleanField(default=False,null=False,help_text="Indique si la photo peut être ou pas présentée sur la page publique")
    birthdate=models.DateField(null=True,help_text="Date de naissance du profil")
    mobile=models.CharField(blank=True,max_length=20,null=True,default="06",help_text="@Numéro de mobile")
    nationality=models.CharField(blank=True,max_length=30,null=False,default="Française",help_text="Nationnalité du profil")

    department=models.CharField(blank=True,max_length=60,null=True,default="",help_text="Cursus (pro ou standard) suivi pendant les études")
    department_category=models.CharField(blank=True,max_length=30,null=True,default="",help_text="Categorie / code de regroupement de la formation")

    job=models.CharField(max_length=60,null=True,default="",blank=True,help_text="Profession actuelle")
    degree_year=models.IntegerField(null=True,help_text="Année de sortie de l'école (promotion)")

    linkedin = models.URLField(blank=True, null=True,help_text="Adresse de la page public linkedin du profil")
    email=models.EmailField(null=True,unique=False,help_text="@email du profil")
    instagram=models.URLField(blank=True, null=True,help_text="Adresse du compte instagram")
    telegram=models.URLField(blank=True, null=True,help_text="Adresse public du compte telegram")
    facebook=models.URLField(blank=True, null=True,help_text="Adresse de la page facebook du profil")
    twitter=models.URLField(blank=True, null=True,help_text="Adresse de la page twitter du profil")
    tiktok=models.URLField(blank=True, null=True,help_text="Adresse de la page tiktok du profil")
    youtube = models.URLField(blank=True, null=True,help_text="Adresse de la page youtube du profil")
    vimeo=models.URLField(blank=True, null=True,help_text="Adresse de la page vimeo du profil")
    school=models.CharField(blank=True,max_length=30,null=True,default="FEMIS",help_text="Ecole")

    #Liste des annuaires
    unifrance = models.URLField(blank=True, null=True, help_text="Adresse de la page sur unifrance")
    imdb = models.URLField(blank=True, null=True, help_text="Adresse de la page sur imdb")
    wikipedia = models.URLField(blank=True, null=True, help_text="Adresse de la page sur wikipedia")
    allocine = models.URLField(blank=True, null=True, help_text="Adresse de la page sur allocine")

    crm=models.URLField(blank=True, null=True,help_text="Lien avec l'outil de CRM")

    acceptSponsor = models.BooleanField(null=False, default=False,help_text="Le profil accepte les demandes de mentorat")
    sponsorBy = models.ForeignKey('Profil', null=True,on_delete=CASCADE,help_text="Nom du mentor")

    photo=models.TextField(blank=True,default="/assets/img/anonymous.png",help_text="Photo du profil au format Base64")

    cursus=models.CharField(max_length=1,blank=False,default="S",choices=(('S','Standard'),('P','Professionnel')),help_text="Type de formation")
    address=models.CharField(null=True,blank=True,max_length=200,help_text="Adresse postale au format numéro / rue / batiment")
    town = models.CharField(null=True,blank=True,max_length=50, help_text="Ville de l'adresse postale de résidence")
    cp=models.CharField(null=True,blank=True,max_length=5,help_text="code postal de résidence")
    country=models.CharField(null=True,default="France",blank=True,max_length=50, help_text="Pays de naissance")

    website=models.URLField(null=True,blank=True,default="",help_text="Site web du profil")
    dtLastUpdate=models.DateTimeField(null=False,auto_now=True,help_text="Date de la dernière modification du profil")
    dtLastSearch=models.DateTimeField(null=False,default=datetime.datetime(2021,1,1,0,0,0,0),help_text="Date de la dernière recherche d'expérience pour le profil")
    dtLastNotif=models.DateTimeField(null=False,default=datetime.datetime(2021,1,1,0,0,0,0),help_text="Date de la dernière notification envoyée")
    obsolescenceScore=models.IntegerField(default=0,help_text="Indique le degré d'obsolescence probable (utilisé pour les relances)")
    biography=models.TextField(null=True,default="",max_length=2000,help_text="Biographie du profil")
    links = JSONField(null=True, help_text="Liens vers des références externes au profil")
    auto_updates=models.CharField(max_length=300,null=False, default="0,0,0,0,0,0",help_text="Date de mise a jour")
    advices=JSONField(null=True,default=None,help_text="Conseils pour augmenter la visibilité du profil")
    source=models.CharField(null=True,blank=True,max_length=50,help_text="Source de la fiche")
    blockchain=models.CharField(null=False,blank=True,default="",max_length=50,help_text="Adresse elrond du profil")

    class Meta(object):
        ordering=["lastname","degree_year"]

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


    def get_home(self,site):
        if not self.links is None:
            for l in self.links:
                if l["text"]==site: return l["url"]
        return None

    # @property
    # def in_school(self):
    #     dtEndSchool=datetime.datetime(int(self.degree_year),8,1,0,0,0,0).timestamp()
    #     return now()>dtEndSchool


    @property
    def public_url(self):
        return "./public/?id="+str(self.id)+"&name="+self.firstname+" "+self.lastname+"&toolbar=false"

    @property
    def fullname(self):
        return '%s %s' % (self.firstname, self.lastname.upper())

    @property
    def promo(self):
        return str(self.degree_year)

    @property
    def str_links(self):
        if self.links is None:return ""
        s=""
        for l in self.links:
            s=s+l.url+";"
        return s


    def __str__(self):
        s="{'id':"+str(self.id)+",'email':'"+self.email+"','fullname':'"+self.fullname+"',"
        s=s+"'address':'"+self.address+" "+self.cp+" "+self.town+"','promo':"+str(self.degree_year)+"}"
        return s


    @property
    def name_field_indexing(self):
        return {"name":self.lastname.upper()+" "+self.firstname}


    def quality_score(self):
        score=0
        if len(self.lastname)>0 and len(self.firstname)>0:score=score+20
        if len(self.email)>0:score=score+30
        if len(self.department)>0:score=score+10
        if len(self.department_category)>0:score=score+1
        if len(self.address)>0:score=score+5
        return score



class Company(models.Model):
    id = models.AutoField(primary_key=True)
    name=models.CharField(max_length=100,blank=False,null=False)
    siret=models.CharField(max_length=14,default="")
    address=models.CharField(max_length=150,default="")



class Article(models.Model):
    id = models.AutoField(primary_key=True)
    owner = models.ForeignKey(User, null=False, on_delete=models.CASCADE, related_name="Articles",help_text="Auteur de l'article")
    validate=models.BooleanField(default=False,null=False,help_text="Une fois à vrai l'article est visible de tous")
    content=models.TextField(blank=True,default="",help_text="Contenu de l'article")
    visual=models.CharField(max_length=200,default="",help_text="visuel associé à l'article sous forme de lien web")
    title=models.CharField(max_length=100,default="",help_text="Titre de l'article")
    summary=models.CharField(max_length=250,default="",help_text="Résumé de l'article")
    dtPublish = models.DateField(null=True, help_text="Date de publication de l'article")
    dtCreate = models.DateField(auto_now=True, null=False, help_text="Date de création de l'article")
    tags=models.CharField(max_length=100,default="",help_text="Etiquettes de classification thématique")
    to_publish=models.BooleanField(default=False,null=False,help_text="Demander la publication")

    class Meta:
        ordering = ["dtCreate"]


class Training(models.Model):
    title=models.CharField(max_length=100,blank=False,null=False)
    url=models.CharField(max_length=150,null=True)
    #https://www.femis.fr/presentation-de-l-atelier-ludwig

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
    dtLogin=models.DateField(blank=True,null=True, help_text="Date de la dernière connexion")
    nbLogin=models.IntegerField(default=0,help_text="Nombre de connexions")
    dtCreate = models.DateField(auto_now_add=True,null=True, help_text="Date de creation du compte")



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
        ExtraUser.objects.create(user=instance,perm=perm,profil_name=DEFAULT_PERMS_PROFIL)
    else:
        pass


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.extrauser.save()


class Work(models.Model):
    """
    Réalisation / projets des profils
    Cet objet permet de faire le lien entre les oeuvres et les profils
    Il peut être alimenté en automatique (par scrapping des sources) ou en manuel par le profil
    """
    id = models.AutoField(primary_key=True,help_text="!Clé primaire interne des projets")
    profil = models.ForeignKey('Profil', null=False, on_delete=models.CASCADE,related_name="works",help_text="Profil ayant réalisé le travail")
    pow = models.ForeignKey('PieceOfWork', null=False, on_delete=models.CASCADE, related_name="works",help_text="Oeuvre concernée par le travail")
    status=models.CharField(max_length=200,default="")
    state=models.CharField(max_length=1,default="A",help_text="etat du travail entre A=automatiquement creer,E=editer par le profil, D=supprimé par le profil")

    #creator passera à user si l'utilisateur modifie l'enregistrement
    creator=models.CharField(max_length=5,default="auto",help_text="Désigne qui est le dernier auteur de l'enregistrement du travail dans la base de données")
    public=models.BooleanField(default=True,help_text="Indique si le projet est public (visible de ceux qui ont les droits) ou privé")

    dtCreate = models.DateField(auto_now_add=True,null=True, help_text="!Date d'enregistrement de la contribution")

    job=models.CharField(max_length=200,default="",help_text="Désignation du travail réalisé : production, scénariste ...")
    duration=models.IntegerField(default=0,null=False,help_text="Durée du travail (exprmimé en heure)")
    comment=models.TextField(max_length=400,null=False,default="",blank=True,help_text="Commentaire libre sur la façon dont s'est passé le travail")
    earning=models.IntegerField(default=None,null=True,help_text="Revenu percu brut pour la durée annoncée")
    source=models.CharField(max_length=100,null=False,default="",help_text="source ayant permis d'identifier le projet : imdb, unifrance, lefilmfrancais, bellefaye, manuel")
    validate=models.BooleanField(default=False,help_text="!Indique si l'expérience est validé ou pas")

    score_salary=models.IntegerField(default=None,null=True,help_text="Votre revenu correspondait t'il à vos attentes (1-4)")
    score_school=models.IntegerField(default=None,null=True,help_text="La formation à la FEMIS vous a t'elle aidé pour ce travail (1-4)")
    score_skill=models.IntegerField(default=None,null=True,help_text="Vous sentez vous a l'aise pour ce travail (1-4)")


    @property
    def title(self):
        return self.pow.title

    @property
    def lastname(self):
        return self.profil.lastname.upper()

    @property
    def firstname(self):
        return self.profil.firstname


    def __str__(self):
        d:dict=dict({
            "name":self.profil.firstname+" "+self.profil.lastname.upper(),
            "job":self.job,
            "comment":self.comment,
            "public":self.public,
            "earning":self.earning
        })

        if self.pow is not None:
            d["pow"]={
                "title":self.pow.title,
                "year":self.pow.year,
                "link":self.pow.links,
                "nature":self.pow.nature,
                "category":self.pow.category,
                "awards":list()
            }
            d["year"]=self.pow.year
            if self.pow.award.exists():
                for a in self.pow.award.all():
                    d["pow"]["awards"].append({"title":a.festival.title.replace("'"," "),"description":a.description.replace("'"," "),"year":a.year})

        return str(d)



class Festival(models.Model):
    """

    """
    id = models.AutoField(primary_key=True)
    title = models.CharField(null=False, max_length=300, unique=True, default="sans titre",help_text="Nom du festival")
    country = models.CharField(null=True, max_length=100, help_text="Pays du festival")
    url=models.CharField(null=False,blank=True, default="",max_length=150, help_text="URL de la page d'acceuil du festival")
    dtCreate = models.DateField(auto_now=True, null=True, help_text="Date de création de l'article")


class Survey(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.TextField(blank=True,max_length=50, help_text="Titre du sondage")
    description = models.TextField(blank=True,max_length=200, help_text="Description / message d'intro pour les profils")
    html=models.TextField(blank=True,max_length=200, help_text="Code ou URL du sondage")
    dtCreate = models.DateField(auto_now_add=True, help_text="Date de création du sondage")
    dtStart = models.DateField(auto_now_add=True, null=False,blank=False,help_text="Date de début d'apparition du sondage")
    dtEnd = models.DateField(auto_now_add=True, null=False,blank=False,help_text="Date de fin du sondage")



class PieceOfWork(models.Model):
    """
    Description des oeuvres

    """
    id = models.AutoField(primary_key=True)

    dtLastSearch = models.DateTimeField(null=False, auto_now_add=True, help_text="Date de la derniere recherche automatique sur l'oeuvre")
    visual = models.TextField(blank=True,help_text="Visuel de l'oeuvre")
    dtStart=models.DateField(auto_now=True,null=False,help_text="Date de début de la réalisation de l'oeuvre")
    dtEnd=models.DateField(auto_now=True,null=False,help_text="Date de fin de la réalisation de l'oeuvre")
    title=models.CharField(null=False,max_length=300,default="sans titre",help_text="Titre de l'oeuvre, même temporaire")
    title_index=models.CharField(null=False,max_length=300,default="",help_text="!Titre de l'oeuvre simplifier pour gestion de la recherche")

    year=models.CharField(null=True,max_length=4,help_text="Année de sortie de l'oeuvre")
    nature=models.CharField(null=False,default='MOVIE',max_length=50,help_text="Nature de l'oeuvre (long, court, docu)")
    dtCreate = models.DateField(auto_now_add=True,help_text="!Date d'enregistrement de l'oeuvre dans DataCulture")

    reference=models.CharField(null=False,default="",blank=True,max_length=50,help_text="Reference de l'oeuvre")
    budget = models.IntegerField(default=0, help_text="Coût total de réalisation de l'oeuvre")
    production=models.CharField(null=False,default="",blank=True,max_length=100,help_text="Production de l'oeuvre")

    #Structure : "url" du document, "text" du lien
    links=JSONField(null=True,help_text="Liens vers des références externes à l'oeuvre")

    owner=models.CharField(max_length=150,default="public",help_text="Auteur de l'oeuvre")
    description=models.TextField(null=False,default="",max_length=3000,help_text="Synopsis/Description/Résumé de l'oeuvre")
    # Structure : "url" du document, "type" de document (str), "title" du document
    files=JSONField(null=True,help_text="Liens vers des documents attaché")
    category=models.TextField(null=True,max_length=50,help_text="Liste des categories auxquelles appartient le film")
    lang=models.CharField(max_length=50,null=True,help_text="Langue originale de l'oeuvre")

    apiVideoId=models.CharField(max_length=20,default="",null=False,blank=True,help_text="Version stocké sur api.video")
    distributer=models.CharField(max_length=150,default="",blank=True,null=True,help_text="Distribution de l'oeuvre")
    minutes=models.IntegerField(default=None,null=True,help_text="Durée de l'oeuvre en minutes")
    copies=models.IntegerField(default=None,null=True,help_text="Nombre de copies distribuée")
    visa=models.CharField(max_length=10,null=True,help_text="Visa d'exploitation de l'oeuvre")
    financal_partner=JSONField(null=True,help_text="Liste des partenaires financiers")
    first_week_entrances=models.IntegerField(null=True,help_text="Nombre d'entrée la première semaine")
    prizes=JSONField(null=True,help_text="!Liste des prix reçus")

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
        score=eval_field(self.title,5)\
              +eval_field(self.budget,2)\
              +eval_field(self.owner,3)\
              +2*len(self.links)\
              +eval_field(self.visual,2)\
              +eval_field(self.year,3)

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


class Award(models.Model):
    id = models.AutoField(primary_key=True)
    winner = models.BooleanField(null=False,default=True, help_text="Indique s'il s'agit d'une nomination ou d'une victoire")
    festival = models.ForeignKey('Festival', null=True, on_delete=models.CASCADE, related_name="award",help_text="Festival correspondant au prix reçu")
    profil = models.ForeignKey('Profil', null=True, on_delete=models.SET_NULL, related_name="award",help_text="Profil destinataire du prix")
    pow = models.ForeignKey('PieceOfWork', null=True, on_delete=models.CASCADE, related_name="award",help_text="Oeuvre récompensé")
    description = models.CharField(null=False,blank=True, max_length=250, default="sans titre", help_text="Nom de la récompense obtenue")
    year = models.IntegerField(null=True, help_text="Date de la remise du prix")
    dtCreate = models.DateField(auto_now=True, null=True, help_text="Date de référencement du prix dans DataCulture")
    source = models.CharField(null=True, blank=True, max_length=150, help_text="URL de la source")
    state = models.CharField(max_length=1, default="A",
                             help_text="etat du travail entre A=automatiquement creer,E=editer par le profil, D=supprimé par le profil")
