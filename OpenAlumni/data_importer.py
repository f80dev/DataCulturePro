import csv
import os
import platform
import shutil
import subprocess
from os.path import exists

import pandas as pd
import requests
import gzip

from OpenAlumni.Tools import now, log, file_duration


class DataImporter:
    domain=""

    def __init__(self,domain="https://datasets.imdbws.com/"):
        self.domain=domain

    def count_rows(self,filepath:str) -> dict:
        log("Calcul du nombre de ligne de "+filepath)
        rc=dict()
        if file_duration(filepath+"/result.txt")>10: os.remove(filepath+"/result.txt")
        if platform.system()=="Windows":
            if not exists(filepath+"/result.txt"):
                result = subprocess.run([filepath+'/line_counter.bat',filepath], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,timeout=2000000)

            if exists(filepath+"/result.txt"):
                with open(filepath+"/result.txt","r") as f:
                    for l in f.readlines():
                        if "--------" in l:
                            filename=l.split(":")[0].split("---- ")[1].lower()
                            rc[filename]=int(l.split(":")[1])
            return rc
        else:
            result = subprocess.run(['wc', '-l', filepath], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if result.returncode == 0:return rc

        log("Impossible de compter les lignes de "+filepath)
        return rc



    def split_file(self,filename="name.basics.csv",chunk_size=3000000):
        csv_file_path="C:/Users/hhoar/Downloads/"
        chunk_number = 0
        for chunk in pd.read_csv(csv_file_path+filename, chunksize=chunk_size,delimiter="\t",quotechar="\""):
            chunk_number += 1
            chunk.to_csv(f'{csv_file_path}chunk_{chunk_number}.csv', index=False)


    def extract_file(self,filename="name.basics.csv",offset=0,size=100000):
        csv_file_path="C:/Users/hhoar/Downloads/"+filename
        data_list=list()
        with open(csv_file_path, encoding="utf-8") as csvfile:
            csvreader = csv.DictReader(csvfile,delimiter="\t")

            for _ in range(offset - 1):
                next(csvreader)

            for row in csvreader:
                data_list.append(row)
                size=size-1
                if size==0: return data_list

        return data_list


    def download_file(self, filename:str= "title.principals", dest_dir="i:/temp/nifi_files/",update_delay=10) -> bool:
        if not filename.endswith("gz"):filename=filename+".tsv.gz"
        if not dest_dir.endswith("/"):dest_dir=dest_dir+"/"
        output_file=dest_dir+filename.replace(".gz","").replace(".tsv",".csv")

        if exists(output_file):
            creation_time=os.path.getatime(output_file)
            if (now()-creation_time)/(3600*24)>update_delay: os.remove(output_file)

        if not exists(output_file):
            url=self.domain+filename
            with requests.get(url,stream=True) as response:
                if response.status_code == 200:
                    with gzip.GzipFile(fileobj=response.raw, mode="rb") as gz_file:
                        with open(output_file, "wb") as output:
                            shutil.copyfileobj(gz_file,output)
                            return True
        return False