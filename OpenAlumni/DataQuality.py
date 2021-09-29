import csv

from OpenAlumni.Tools import log


class ProfilFilter:
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
