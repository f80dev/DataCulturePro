import logging
import os
import random

from pymongo import TEXT

from OpenAlumni.mongo_tools import MongoBase

PROFILS:[(str,str)]=[
    ("julia","ducournau"),
    ("Marie Mars","Prieur"),
    ("Frédéric","Chansel"),
    ("William","Martin"),
    ("claire","ubac"),
    ("Manele","labidi"),
    ("claudio","descalzi"),

    ("Marie Mars","Prieur"),
    ("Elena","von saucken"),
    ("Sylvia", "Vargas Gomez"),
    ("ines","leraud"),
    ("Rabah","Zanoun"),
    ("françois","ozon")
]

class TestClass:

    db:MongoBase=MongoBase("mongodb://root:hh4271@192.168.1.62:27017/")
    #db:MongoBase=MongoBase("mongodb://root:hh4271@109.205.183.200:27017/")


    def test_find_profil(self,profils=PROFILS):
        for profil in profils:
            rc=self.db.find_profils(profil[0],profil[1],only_first=False,exclude=["actor"])
            assert len(rc)>0,"Probleme de recherche de "+str(profil[0])

    def test_find_french_profils(self,profils=PROFILS):
        for profil in profils:
            ps=self.db.find_profils(profil[0],profil[1],only_first=False)
            if len(ps)==1:
                logging.info(ps[0]["nconst"]+" is French")
            else:
                for p in ps:
                    rc=self.db.isFrench(p["nconst"])
                    if rc:
                        logging.info(p["nconst"]+" is French")

    def test_find_doublon(self):
        self.db.find_doublons("name.basics.csv","primaryName")

    def test_get_casting(self):
        profils=self.db.get_casting("tt10944760",with_detail=True)
        assert len(list(profils))>0

    def custom_tokenizer(self,text):
        # Replace hyphens with spaces and split on spaces
        return text.replace('-', ' ').split()

    def test_reindex(self):
        #self.db.create_indexes("title.principals.csv",[("tconst",False),("nconst",False)])
        #self.db.create_indexes("name.basics.csv",[("nconst",False),("primaryName",False)])
        # self.db.create_indexes("name.basics.csv",[("nconst",False)])
        # collection=self.db.database["name.basics.csv"]
        # if "name_idx" in list(collection.index_information().keys()): collection.drop_index("name_idx")
        # collection.create_index([("primaryName", TEXT)],name="name_idx",
        #                         default_language="french",language_override="none",
        #                         textIndexVersion=1)

        #self.db.create_indexes("title.basics.csv",[("tconst",False)])
        # self.db.create_indexes("title.ratings.csv",[("tconst",False)])
        # self.db.create_indexes("title.episode.csv",[("tconst",False)])
        #self.db.create_indexes("title.akas.csv",[([("titleId",1),("isOriginalTitle",1)],False)])
        return True


    def test_find_movies(self,profils=PROFILS):
        for fullname in profils:
            ps=self.db.find_profils(fullname[0],fullname[1],only_first=False)
            assert len(ps)>0,"Aucun profil trouvé pour "+fullname[1]
            p=ps[0]
            movies=self.db.filter_movies(self.db.find_movies(p["nconst"]))
            self.db.show_movie(self.db.complete_movies(movies))
            assert len(movies)>0

    def test_import_file(self,work_dir:str="i:/temp/nifi_files/",filter=""):
        l_files=os.listdir(work_dir)
        if filter=="":
            while len(l_files)>0:
                filename=l_files[random.randint(0,len(l_files)-1)]
                self.db.import_csv(work_dir+filename,2e9)
                l_files.remove(filename)
        else:
            self.db.import_csv(work_dir+filter,2e9)
