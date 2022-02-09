import requests

from OpenAlumni.passwords import GIPHY_API_KEY, UNSPLASH_API_KEY


class ImageSearchEngine:
    giphy_api_key=GIPHY_API_KEY
    unsplash_api_key=UNSPLASH_API_KEY

    def __init__(self):
        pass

    def search(self,query,_type):
        """

        :param query:
        :param _type:
        :see https://developers.giphy.com/docs/api/endpoint#search
        :return:
        """

        url=""
        if _type=="gif":url="v1/gifs"
        if _type=="sticker":url = "v1/stickers"

        rc = []
        if len(url)>0:
            url="https://api.giphy.com/"+url+"/search?api_key="+self.giphy_api_key+"&q="+query
            results=requests.get(url).json()

            for result in results["data"]:
                rc.append({"preview":result["images"]["preview_webp"]["url"],"src":result["images"]["preview_webp"]["url"]})


        if _type=="pictures":
            url="https://api.unsplash.com/search/photos?page=1&query="+query+"&per_page=50&client_id="+self.unsplash_api_key
            results=requests.get(url).json()
            for result in results["results"]:
                rc.append({"preview": result["urls"]["small"],"src":  result["urls"]["regular"]})

        return rc
