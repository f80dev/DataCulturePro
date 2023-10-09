import csv
import logging

from pymongo import MongoClient, ASCENDING
from pymongo.collation import Collation, CollationStrength, CollationAlternate, CollationMaxVariable
from pymongo.database import Database


class MongoBase:

    database:Database
    compare_strings=Collation(
        locale="fr",
        strength=CollationStrength.PRIMARY,
        alternate=CollationAlternate.SHIFTED,
        maxVariable=CollationMaxVariable.PUNCT,
        normalization=True
    )

    def __init__(self,server="mongodb://root:hh4271@192.168.1.62:27017/"):
        logging.info("Initialisation de la base sur "+server)
        client = MongoClient(server, 27017)
        self.database=client["imdb"]

    def import_csv(self,filename:str,records=2000,step=300000,replace=False):
        if not filename.endswith(".csv"): filename=filename+".csv"
        log=""
        collection_name=filename[filename.rindex("/")+1:]

        if replace and collection_name in self.database.list_collection_names():
            log=log+"Destruction de "+collection_name+"\n"
            self.database[collection_name].drop()

        if collection_name not in self.database.list_collection_names():
            log=log+"Création de l'index de "+collection_name+"\n"
            self.create_indexes(collection_name)

        with open(filename, encoding="utf-8") as csvfile:
            csvreader = csv.DictReader(csvfile,delimiter="\t")
            rows=[]
            for row in csvreader:
                rows.append(row)
                if len(rows)==step:
                    try:
                        result=self.database[collection_name].insert_many(rows,ordered=False,bypass_document_validation=False)
                        log=log+str(len(rows))+" intégrées\n"
                    except Exception as e:
                        log=log+"Error: "+e.args[0]+"\n"

                    records=records-len(rows)
                    rows=[]
                    if records<0: break

            try:
                result=self.database[collection_name].insert_many(rows,ordered=False,bypass_document_validation=False)
                log=log+str(len(rows))+" intégrées\n"
            except Exception as e:
                log=log+"Error: "+e.args[0]+"\n"

        return log



    def isFrench(self,nconst:str):
        movies=self.find_movies(nconst,False)
        for m in movies:
            regions=[]
            m_versions=list(self.database["title.akas.csv"].find({"titleId":m}))
            for m_version in m_versions:
                region=(m_version["region"]+m_version["language"]).replace("\\N","")
                if len(region)>0 and not region in regions:regions.append(region)

            if len(regions)==1 and regions[0]=="FR":
                return True

        return False


    def find_profils(self,firstname="",lastname="",name_collection="name.basics.csv",only_first=True,exclude=[]) -> [dict]:
        firstname=firstname[0].upper()+firstname[1:].lower()
        lastname=lastname[0].upper()+lastname[1:].lower()

        pattern = firstname+" "+lastname

        query={"$text":{"$search":pattern}}
        if only_first:
            profil=self.database[name_collection].find_one(query)
            if profil is None:return []
            profils=[profil]
        else:
            result=list(self.database[name_collection].find({"$text":{"$search":"\""+pattern+"\""}}))
            if len(result)==0: result=list(self.database[name_collection].find({"$text":{"$search":lastname}}))

            profils=[]
            for p in result:
                prof=p["primaryProfession"]
                if len(prof)==0 or not prof in exclude:
                    profils.append(p)

        rc=list(profils)

        return rc

    def create_indexes(self,table:str,indexes=[("tconst",True)]):
        logging.info("Création de l'index de "+table)
        index_name=""

        if len(indexes)>0:
            if type(indexes)==str:indexes=[indexes]
            for idx in self.database[table].list_indexes():
                if idx["name"]!="_id_":
                    logging.info("Suppression de l'index "+idx["name"])
                    self.database[table].drop_index(idx["name"])

            for idx in indexes:
                index_name=idx[0]
                if type(idx[0])==list:
                    rc=self.database[table].create_index(idx[0],unique=idx[1])
                else:
                    if "const" in idx[0]:
                        #Aucune méthode strict à mettre en place
                        rc=self.database[table].create_index([(index_name,ASCENDING)],unique=idx[1])
                    else:
                        rc=self.database[table].create_index([(index_name,ASCENDING)],unique=idx[1],collation=self.compare_strings)

        return rc

    def find_movies(self, profil:str,with_detail=True,collection_name="title.principals.csv"):
        query_results=self.database[collection_name].find({"nconst":profil})
        txt=query_results.explain()
        if not with_detail:
            return [x["tconst"] for x in query_results]
        else:
            rc=list()
            for x in query_results:
                del x["_id"]
                rc.append(x)
            return rc


    def find_doublons(self,table:str,field_name:str):
        collection=self.database[table]
        pipeline = [
            {'$group': {"_id": {field_name: "$"+field_name}, 'count': {'$sum': 1}}},
            {'$match': {'count': {'$gt': 1}}},
            {'$project': {'documents': '$documents'}},
        ]
        for result in collection.aggregate(pipeline):
            logging.info(str(result))


    def complete_movies(self, movies,casting_filter="",cache={}):
        rc=list()
        for m in movies:
            if "tconst" in m:
                m["movie"]=self.get_movie(m["tconst"])
                m["casting"]=self.get_casting(m["tconst"],filter=casting_filter)
                if not m is None:
                    if m["movie"]["titleType"]=="tvEpisode":
                        serie=self.get_parent(m["tconst"])
                        title=serie["parent"]["primaryTitle"]
                        m["movie"]["primaryTitle"]=title + " / "+ m["movie"]["primaryTitle"]
                        m["movie"]["originalTitle"]=serie["parent"]["originalTitle"] + " / "+ m["movie"]["originalTitle"]

                    rc.append(m)
        return rc

    def get_movie(self, tconst:str,collection_name="title.basics.csv"):
        rc=self.database[collection_name].find_one({"tconst":tconst})
        if not rc is None: del rc["_id"]
        return rc

    def show_movie(self,movies:[dict]):
        for m in movies:
            logging.info(m["movie"]["primaryTitle"])

    def get_parent(self,episode:str or dict,collection_name="title.episode.csv"):
        rc=self.database[collection_name].find_one({"tconst":episode})
        if not rc is None:
            rc["parent"]=self.get_movie(rc["parentTconst"])
        return rc

    def filter_movies(self,movies:list,exclude_category="self"):
        rc=[]
        for m in movies:
            if not m["category"].lower() in exclude_category:
                rc.append(m)
        return rc

    def filter_movies_old(self, exp:list, filter:str="",filter_genre="",exclude="news,documentary,talk-show",exclude_title="Episode dated,Episode #"):
        rc=list()
        if type(filter)==str: filter=filter.lower().split(",")
        filter_genre=set(filter_genre.lower().split(",")) if len(filter_genre)>0 else set()
        exclude=set(exclude.lower().split(",")) if len(exclude)>0 else set()
        for e in exp:
            m=e["movie"]
            if not m is None:
                genres=set(m["genres"].lower().split(",")) if "genres" in m else set()
                if (m["titleType"].lower() in filter or len(filter)==0) and (len(filter_genre)==0 or len(filter_genre.intersection(genres))>0):
                    if len(exclude.intersection(genres))==0 and m['primaryTitle'].lower() not in exclude_title.lower().split(","):
                        rc.append(e)
        return rc

    def get_casting(self, movie:str,collection_name="title.principals.csv",with_detail=True,filter="") -> [dict]:
        rc=list()
        if filter=="":
            cast=list(self.database[collection_name].find({"tconst":movie}))
        else:
            cast=list(self.database[collection_name].find({"tconst":movie,"nconst":filter}))

        director=self.database["title.crew.csv"].find_one({"tconst":movie})
        if not director is None:
            cast.append(director)

        if with_detail:
            for c in cast:
                c["profil"]=self.database["name.basics.csv"].find_one({"nconst":c["nconst"]})
                if "Self" in c["characters"] and c["job"]=="\\N": c["job"]="Actor"
                rc.append(c)
        else:
            rc=cast

        return rc

