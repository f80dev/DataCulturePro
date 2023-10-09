import csv
import os
import shutil
from os.path import exists

import pandas as pd
import requests
import gzip
from io import BytesIO

from OpenAlumni.Tools import now


class DataImporter:
    domain=""

    def __init__(self,domain="https://datasets.imdbws.com/"):
        self.domain=domain

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