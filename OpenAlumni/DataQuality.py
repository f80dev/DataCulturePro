import csv
from OpenAlumni.Tools import log, equal_str, fusion

import jellyfish


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
        log("Traitement qualité sur les profils: suppression des doublons dans les links, ajustement des majuscules")
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
                bSave=True

            if profil.email=="nan":
                profil.email=""
                bSave=True

            if profil.cursus=="S" and profil.department_category=="":
                if len(profil.department)>0:
                    profil.department_category=profil.department
                else:
                    log("Profil "+profil.lastname+" incomplet")

            if str(profil.lastname+profil.firstname).strip()=="":
                log("Profil "+profil.id+" sans nom ni prénom donc suppression")
                profils_to_delete.append(profil.id)

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

    def __init__(self,pows):
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
        for p1 in self.pows:
            for p2 in self.pows:
                d=jellyfish.jaro_similarity(p1.title.lower(),p2.title.lower())
                seuil=0.97
                if p1.nature=="Série" and p2.nature=="Série": seuil=0.99
                if d>seuil and p1.year==p2.year and p1.id!=p2.id:
                    log("Suspission de doublon entre "+str(p1)+" et "+str(p2))
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
            rc=[]

            #traitement des doublons dans les links
            for l in p.links:
                if not l in rc:rc.append(l)
            if len(rc)<len(p.links):
                p.links=rc
                p.save()

            if len(list(p.works.all()))==0:
                to_delete.append(p.id)

        return to_delete