import csv
import logging

from pymongo import MongoClient
from pymongo.database import Database


class MongoBase:

    database:Database

    def __init__(self,server="mongodb://root:hh4271@192.168.1.62:27017/?authMechanism=DEFAULT"):
        client = MongoClient(server, 27017)
        self.database=client["imdb"]

    def import_csv(self,filename:str,records=2000,step=300000):
        i=0
        collection_name=filename[filename.rindex("/")+1:]
        if collection_name not in self.database.list_collection_names():
            self.indexes(collection_name)

        with open(filename, encoding="utf-8") as csvfile:
            csvreader = csv.DictReader(csvfile,delimiter="\t")
            rows=[]
            for row in csvreader:
                # if len(str(row))>1000:
                #     logging.error(row[k])
                rows.append(row)
                if len(rows)==step:
                    try:
                        result=self.database[collection_name].insert_many(rows,ordered=False,bypass_document_validation=False)
                    except Exception as e:
                        logging.debug(e.args[0])
                    records=records-len(rows)
                    rows=[]
                    if records<0: break

            try:
                result=self.database[collection_name].insert_many(rows,ordered=False,bypass_document_validation=False)
            except Exception as e:
                logging.debug(e.args[0])





    def find_profils(self,firstname="",lastname="",name_collection="name.basics.csv",only_first=True) -> [dict]:
        firstname=firstname[0].upper()+firstname[1:].lower()
        lastname=lastname[0].upper()+lastname[1:].lower()

        pattern = firstname+" "+lastname
        query = {"primaryName": {"$regex": pattern, "$options": "i"}}
        if only_first:
            profil=self.database[name_collection].find_one(query)
            if profil is None:return []
            profils=[profil]
        else:
            profils=self.database[name_collection].find(query)

        return list(profils)

    def indexes(self,table:str):
        index_name=[("tconst",True)]

        if "principals" in table :
            index_name=[("nconst",False)]

        if "akas." in table: index_name=[]
        if "name." in table:
            index_name=[("primaryName",False),("nconst",True)]
            unique=False

        if len(index_name)>0:
            if type(index_name)==str:index_name=[index_name]
            for idx in index_name:
                self.database[table].create_index(idx[0],unique=idx[1])
        return index_name


    def find_movies(self, profil:str,with_detail=True,collection_name="title.principals.csv"):
        query_results=self.database[collection_name].find({"nconst":profil})
        if not with_detail:
            return [x["tconst"] for x in query_results]
        else:
            rc=list()
            for x in query_results:
                del x["_id"]
                rc.append(x)
            return rc



    def complete_movies(self, movies):
        rc=list()
        for m in movies:
            if "tconst" in m:
                m["movie"]=self.get_movie(m["tconst"])
                if not m is None:
                    if m["movie"]["titleType"]=="tvEpisode":
                        m["movie"]["serie"]=self.get_parent(m["movie"]["tconst"])
                    rc.append(m)
        return rc

    def get_movie(self, tconst:str,collection_name="title.basics.csv"):
        rc=self.database[collection_name].find_one({"tconst":tconst})
        if not rc is None: del rc["_id"]
        return rc

    def show_movie(self,movies:[dict]):
        for m in movies:
            logging.info(m["name"])

    def get_parent(self,episode:str or dict,collection_name="title.episode.csv"):
        rc=self.database[collection_name].find_one({"tconst":episode})
        if not rc is None:
            rc["parent"]=self.get_movie(rc["parentTconst"])
        return rc

    def filter_movies(self, exp:list, filter:str="",filter_genre="",exclude="news,documentary,talk-show"):
        rc=list()
        if type(filter)==str: filter=filter.lower().split(",")
        filter_genre=set(filter_genre.lower().split(",")) if len(filter_genre)>0 else set()
        exclude=set(exclude.lower().split(",")) if len(exclude)>0 else set()
        for e in exp:
            m=e["movie"]
            if not m is None:
                genres=set(m["genres"].lower().split(",")) if "genres" in m else set()
                if (m["titleType"].lower() in filter or len(filter)==0) and (len(filter_genre)==0 or len(filter_genre.intersection(genres))>0):
                    if len(exclude.intersection(genres))==0:
                        rc.append(e)
        return rc