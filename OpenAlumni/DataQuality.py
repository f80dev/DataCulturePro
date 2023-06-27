import csv
from OpenAlumni.Tools import log, equal_str
import jellyfish

from alumni.models import Award, PieceOfWork


class ProfilAnalyzer:
    """"
    Classe regroupant l'ensemble des méthodes pour l'analyse des profils
    """
    log=list()
    codes_postaux=None

    def __init__(self):
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

            if profil.lastname!=str(profil.lastname).upper():
                bSave=True
                profil.lastname=profil.lastname.upper()

            if profil.links:
                if len(profil.links)>len(list({v['url']:v for v in profil.links}.values())):
                    log("Suppression des doublons dans links")
                    profil.links=list({v['url']:v for v in profil.links}.values())
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
        total=len(self.pows)
        for p1 in self.pows:
            total=total-1
            log(str(total)+" - Recherche sur "+str(p1))
            for p2 in self.pows:
                d=jellyfish.jaro_similarity(p1.title.lower(),p2.title.lower())
                seuil=0.98
                if p1.nature=="Série" and p2.nature=="Série": seuil=0.999995
                if not p1.year is None and not p2.year is None and  d>seuil and abs(int(p1.year)-int(p2.year))<2 and p1.id!=p2.id:
                    log("Suspission de doublon entre avec "+str(p2))
                    if with_fusion:
                        if p1.quality_score()>p2.quality_score():
                            b=self.fusion(p2,p1)
                        else:
                            b=self.fusion(p1, p2)
                        if b:
                            log("Fusion réalisée")
                            rc = rc + 1
                            break

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


            if p.year is None or int(p.year)<1970 or p.title is None:
                to_delete.append(p.id)
            else:
                rc=[]
                log("Traitement qualité de "+p.title)

                #traitement des doublons dans les links
                for l in p.links:
                    l["url"]=l["url"].split("?")[0]
                    if not l in rc:
                        rc.append(l)
                if len(rc)<len(p.links):
                    log("Suppression de doublon dans les liens")
                    p.links=rc
                    p.save()

                #traitement des doublons sur les awards
                # rc=[]
                # for a in p.award.all():
                #      pass

                if len(list(p.works.all()))==0:
                    log("A supprimer")
                    to_delete.append(p.id)

        return to_delete


class AwardAnalyzer():
    def __init__(self,awards:[Award]):
        self.awards=awards

    def find_double(self):
        log("Recherche de doublon sur les récompenses")
        to_delete:[Award]=[]
        a:Award
        for a in self.awards:
            doublons=Award.objects.filter(pow__id=a.pow_id,festival__id=a.festival_id,year=a.year,description=a.description).all()
            if len(doublons)>1:
                if a.profil is None:
                    log(a.description + " pour "+a.pow.title+" est en doublon, on le supprime")
                    to_delete.append(a)
        log("Traitement terminé")
        return to_delete



