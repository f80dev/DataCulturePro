import csv
import jellyfish
from OpenAlumni.Tools import log


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



    def add_bad_profil(self,profil,comment):
        self.log.append({"profil":profil,"commentaire":comment})



    def analyse(self,profils):
        n_profils=0
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
        except:
            log("Destruction de " + str(p_new))
            try:
                p_new.delete()
            except:
                log("Destruction impossible entre "+str(p_old)+" et "+str(p_new))


    def find_double(self,with_fusion=True):
        rc=0
        for p1 in self.pows:
            for p2 in self.pows:
                d=jellyfish.jaro_similarity(p1.title.lower(),p2.title.lower())
                if d>0.95 and p1.year==p2.year and p1.id!=p2.id:
                    log("Suspission de doublon entre "+str(p1)+" et "+str(p2))
                    rc=rc+1
                    if with_fusion:
                        if p1.quality_score()>p2.quality_score():
                            self.fusion(p2,p1)
                        else:
                            self.fusion(p1, p2)

        return rc
