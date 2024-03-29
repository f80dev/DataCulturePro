#Analyse des relations

import networkx as nx
from django.core.files import File
from django.core.files.storage import FileSystemStorage
from django.db import connection
from networkx import floyd_warshall_numpy
from numpy import ndarray, save, load

from OpenAlumni.Tools import log, now
from alumni.models import PieceOfWork


class SocialGraph:

    fs = FileSystemStorage(location='./temp')

    def __init__(self,profils=None):
        self.G = nx.Graph()
        self.edge_prop=[]
        if profils:
            self.load(profils)


    def filter(self,critere="pagerank",threshold=0):
        _G=self.G.copy()
        for idx in self.G.nodes:
            if not critere in self.G.nodes[idx] or self.G.nodes[idx][critere]<threshold:
                _G.remove_node(idx)
        self.G=_G


    def extract_subgraph(self):
        res=nx.shortest_path(self.G)

    def idx_node(self,profil_id):
        if profil_id:
            for i in range(1,self.G.number_of_nodes()+1):
                if self.G.nodes[i]["id"]==int(profil_id):
                    return i
        return None


    def load(self,profils,with_film=False):
        ids = []

        for p in profils:
            self.G.add_node(p.id,
                            label=p.firstname + " " + p.lastname,
                            formation=p.department,
                            photo=p.photo,
                            lastname=p.lastname,
                            firstname=p.firstname,
                            promo=str(p.promo),
                            id=p.id
                            )
            ids.append(p.id)

        if len(ids)>0:
            with connection.cursor() as cursor:
                cursor.execute("DROP TABLE IF EXISTS social_matrix")
                if with_film:
                    cursor.execute("""
                                               CREATE TABLE Social_Matrix AS
                                               SELECT alumni_work.profil_id AS Profil1, alumni_work1.profil_id AS Profil2, alumni_work.pow_id AS powid
                                               FROM alumni_work INNER JOIN alumni_work AS alumni_work1 ON alumni_work.pow_id = alumni_work1.pow_id
                                               GROUP BY alumni_work.profil_id, alumni_work1.profil_id, alumni_work.pow_id
                                               HAVING (((alumni_work.profil_id)<>alumni_work1.profil_id));
                                           """)
                else:
                    cursor.execute("""
                           CREATE TABLE Social_Matrix AS
                           SELECT alumni_work.profil_id AS Profil1, alumni_work1.profil_id AS Profil2, COUNT (alumni_work.pow_id) AS n_pows,
                           FROM alumni_work INNER JOIN alumni_work AS alumni_work1 ON alumni_work.pow_id = alumni_work1.pow_id
                           GROUP BY alumni_work.profil_id, alumni_work1.profil_id
                           HAVING alumni_work.profil_id<>alumni_work1.profil_id
                       """)

                cursor.execute("SELECT * FROM Social_Matrix")



                for row in cursor.fetchall():
                    if row[0] in ids and row[1] in ids:
                        if with_film:
                            _pow = PieceOfWork.objects.get(id=row[2])
                            self.G.add_edge(row[0], row[1],title=_pow.title,id=_pow.id,year=_pow.year)
                        else:
                            self.G.add_edge(row[0], row[1], weight=row[2])

        return len(self.G.nodes)



    def eval(self,critere="pagerank"):
        if "pagerank" in critere:
            ranks=nx.pagerank(self.G)
            for k in ranks.keys():
                self.G.nodes[k]["pagerank"]=ranks.get(k)

        if "centrality" in critere:
            props=nx.betweenness_centrality(self.G)
            for k in props.keys():
                self.G.nodes[k]["centrality"]=props.get(k)


    def distance(self,filename="social_distance_matrix",delayInHour=2):
        if self.fs.exists(filename) and (now()-self.fs.get_modified_time(filename).timestamp())/(60*60)<delayInHour:
            file:File=self.fs.open(filename)
            rc=load(file,allow_pickle=True)
        else:
            log("Lancement du calcul de la matrice de distance")
            rc:ndarray=floyd_warshall_numpy(self.G)
            self.fs.delete(filename)
            save(self.fs.open(filename,"wb"),rc,allow_pickle=True)

        return rc



    #http://localhost:8000/api/social_graph/
    def export(self,format="graphml"):
        if format=="gxf":
            filename="./static/test.gefx"
            nx.write_gexf(self.G, filename,encoding="utf-8")

        if format=="graphml":
            filename="./static/femis.graphml"
            nx.write_graphml(self.G,filename,encoding="utf-8")

        if format=="json":
            nodes_with_attr = list()
            for n in self.G.nodes.data():
                n[1]["id"]=n[0]
                nodes_with_attr.append(n[1])

            edges=[]
            for edge in self.G.edges.data():
                edges.append({"source":edge[0],"target":edge[1],"data":edge[2]})

            rc={"graph":{"nodes":nodes_with_attr,"edges":edges},"edge_props":self.edge_prop}
            return rc

        return filename




