import csv

from django.db import connection

from OpenAlumni.Tools import log, equal_str
import jellyfish

from alumni.models import Award, PieceOfWork,Work

class WorkAnalyzer:
    def remove_bad_work(self,remove_jobs:list):
        for w in Work.objects.all():
            if w.job in remove_jobs:
                rc=w.delete()
                if rc:
                    log(w.job+" sur "+w.title +" supprimé")




class ProfilAnalyzer:
    """"
    Classe regroupant l'ensemble des méthodes pour l'analyse des profils
    """
    log=list()
    codes_postaux=None

    def __init__(self):
        log("Lancement du gestionnaire d'analyse des profils")
        self.codes_postaux = csv.DictReader(open("./static/codes_postaux.csv",))


    def find_city(self,cp:str):
        if cp is None:return ""
        if cp.startswith("75"):return "PARIS"
        for row in self.codes_postaux:
            if row["Code_postal"]==cp:
                return row["Nom_commune"]
        return ""


    def find_double(self,profils):
        """
        Recherche de profils en double
        :param profils:
        :return:
        """
        rc=[]
        for p1 in profils:
            for p2 in profils:
                if p1.id!=p2.id:
                    if equal_str(p1.firstname+p1.lastname,p2.firstname+p2.lastname) or (len(p1.email)>10 and equal_str(p1.email,p2.email)):
                        if p1.quality_score()>p2.quality_score():
                            rc.append(p2.id)
                        else:
                            rc.append(p1.id)
        return rc


    def add_bad_profil(self,profil,comment):
        self.log.append({"profil":profil,"commentaire":comment})



    def analyse(self,profils):
        """
        profils_analyzer Analyseur de profil
        :param profils:
        :return:
        """
        log("Traitement qualité sur les profils: suppression des doublons dans les links, ajustement des majuscules, suppression des prix en doubles")
        n_profils=0
        profils_to_delete=[]

        for profil in profils:
            bSave=False
            if len(profil.town)==0 or profil.town=="0":
                if len(profil.cp)>0:
                    profil.town=self.find_city(profil.cp)
                    bSave=True
                else:
                    self.add_bad_profil(profil,"Impossible de retrouver la ville")
            else:
                if profil.town!=profil.town.upper():
                    profil.town=profil.town.upper()
                    bSave = True

            if len(profil.address)>0 and len(profil.address.replace(" ",""))==0:
                profil.address=""
                self.add_bad_profil(profil,"Adresse manquante")
                bSave=True

            if profil.email=="nan":
                profil.email=""
                bSave=True
                self.add_bad_profil(profil,"Email manquant")

            if profil.cursus=="S" and profil.department_category=="":
                if len(profil.department)>0:
                    profil.department_category=profil.department
                else:
                    self.add_bad_profil(profil,"Formation manquante")

            if str(profil.lastname+profil.firstname).strip()=="":
                log("Profil "+profil.id+" sans nom ni prénom donc suppression")
                profils_to_delete.append(profil.id)

            if "'" in profil.lastname:profil.lastname=profil.lastname.replace("'","\'")
            if "'" in profil.firstname:profil.firstname=profil.firstname.replace("'","\'")

            if profil.lastname!=str(profil.lastname).upper():
                bSave=True
                profil.lastname=profil.lastname.upper()

            if profil.links:
                urls_to_keep=set([v['text'].lower() for v in profil.links])
                if len(profil.links)>len(urls_to_keep):
                    log("Suppression des doublons dans links")
                    rc=[]
                    for l in profil.links:
                        if l["text"].lower() in urls_to_keep:
                            urls_to_keep.remove(l["text"].lower())
                            rc.append(l)
                    profil.links=rc
                    bSave=True
            else:
                profil.links=[]
                bSave=True

            if bSave:
                log("Enregistrement de " + str(profil))
                profil.save()
                n_profils = n_profils + 1

        return n_profils,self.log


class PowAnalyzer:
    log=list()
    pows=list()

    def __init__(self,pows:[PieceOfWork]):
        self.pows=pows

    def fusion(self,p_old,p_new):
        try:
            log("Destruction de " + str(p_old))
            p_old.delete()
            return True
        except:
            log("Destruction de " + str(p_new))
            try:
                p_new.delete()
                return True
            except:
                log("Destruction impossible entre "+str(p_old)+" et "+str(p_new))
                return False


    def find_double(self,with_fusion=True):
        log("Recherche des doublons sur les films")
        rc=0

        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM doublons")
            for doublon in cursor.fetchall():
                try:
                    p1=PieceOfWork.objects.get(id=doublon[0])
                    p2=PieceOfWork.objects.get(id=doublon[1])
                except:
                    p1=None
                    p2=None

                if not p1 is None and not p2 is None:
                    d=jellyfish.jaro_similarity(p1.title.lower(),p2.title.lower())
                    seuil=0.98
                    if p1.nature=="série" and p2.nature=="série": seuil=0.99999995
                    if not p1.year is None and not p2.year is None and  d>seuil and abs(int(p1.year)-int(p2.year))<=2 and p1.id!=p2.id:
                        log(str(p1) + " en suspission de doublon avec "+str(p2))
                        if with_fusion:
                            if p1.quality_score()>p2.quality_score():
                                b=self.fusion(p2,p1)
                            else:
                                b=self.fusion(p1, p2)
                            if b:
                                log("Fusion réalisée")
                                rc = rc + 1

        return rc



    def quality(self):
        to_delete=[]
        for p in self.pows:
            if p.year=="[]":p.year=None
            if p.year and type(p.year)==list:
                if len(p.year)==0:
                    p.year=None
                else:
                    p.year=p.year[0]

            if p.year is None or int(p.year)<1985 or int(p.year)>2100 or p.title is None:
                log(str(p.id)+" a supprimer par absence de date ou date incohénente")
                to_delete.append(p.id)
            else:
                rc=[]
                #traitement des doublons dans les links
                for l in p.links:
                    l["url"]=l["url"].split("?")[0]
                    if not l in rc:
                        rc.append(l)
                if len(rc)<len(p.links):
                    log("Suppression de doublon dans les liens")
                    p.links=rc
                    p.save()

                if len(list(p.works.all()))==0:
                    log(p.title+" a supprimer car aucun travaux associés")
                    to_delete.append(p.id)

        return to_delete


class AwardAnalyzer():
    def __init__(self,awards:[Award]):
        self.awards=awards

    def find_double(self):
        log("Recherche de doublon sur les récompenses")
        to_delete:[Award]=[]
        a:Award
        for i,a in enumerate(self.awards):
            if i % 1000==0:log("Traitement de "+str(i)+" enregistrements")
            doublons=Award.objects.filter(pow__id=a.pow_id,festival__id=a.festival_id,year=a.year,description=a.description).all()
            if len(doublons)>1:
                if a.profil is None: #Si la récompense est directement attribué au film elle ne peut exister en double
                    log(a.description + " pour "+a.pow.title+" est en doublon, on le supprime")
                    to_delete.append(a)

                if doublons[0].profil_id==doublons[1].profil_id and doublons[0].description==doublons[1].description:
                    to_delete(doublons[1])



        log("Traitement terminé")
        return to_delete



