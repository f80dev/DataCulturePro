import hashlib
import html
import os
import re
from platform import system
from time import sleep, strptime, struct_time
from os import remove, scandir, stat
from os.path import exists

import py7zr
import wikipedia
import random
from io import BytesIO

import yaml
import PyPDF2
from django.core.mail import send_mail
from django.db.models import Model
from django.forms import model_to_dict
from requests import get
from selenium.webdriver.chrome.webdriver import WebDriver

from OpenAlumni import passwords
from OpenAlumni.Bot import Bot
import Levenshtein

if os.environ.get("DEBUG"):
    from OpenAlumni.settings_dev import *
else:
    from OpenAlumni.settings import *



# authentication = linkedin.LinkedInAuthentication(
#     LINKEDIN_API_KEY,
#     LINKEDIN_API_SECRET,
#     LINKEDIN_RETURN_URL,
#     permissions="r_basicprofil"
# )
# print(authentication.authorization_url)
# LinkedInApplication(authentication)


def to_xml(df,row_separator="row"):
    def row_to_xml(row):
        xml = ['<'+row_separator+'>']

        for i, col_name in enumerate(row.index):
            val=html.escape(str(row.iloc[i]))
            if len(col_name)>0:
                xml.append('<field name="{0}">{1}</field>'.format(col_name, val))
            else:
                log("Un champs vide")

        xml.append('</'+row_separator+'>')

        return '\n'.join(xml)

    res = '\n'.join(df.apply(row_to_xml, axis=1))
    return res


def stringToUrl(txt:str):
    """
    S'assure de la conformité d'une adresse web
    :param txt:
    :return:
    """
    if txt is None:return None
    if txt=="http://":return ""
    if not txt.startswith("http"):txt="http://"+txt
    return txt


def extract_text_from_pdf(blob):
    reader=PyPDF2.PdfFileReader(BytesIO(blob))
    rc=list()
    for page in reader.pages:
        txt=page.extractText()
        if "(promotion" in txt:
            for line in txt.split("(promotion"):
                words=line.split(" ")
                index=len(words)-1
                while True:
                    name=words[index]
                    if len(name)>3 or index==1:break
                    index=index-1
                rc.append[name]
    return rc



def reset_password(email,username):
    """
    Initialisation / RéInitialisation du mot de passe
    :param email:
    :param username:
    :return:
    """
    if email in EMAIL_TESTER:
        password="123456"
    else:
        password = str(tirage(999999,100000))

    sendmail("Voici votre code",[email],"welcome",dict({
        "email": email,
        "url_appli":DOMAIN_APPLI+"/login?email="+email,
        "username": username,
        "code": password,
        "appname": APPNAME
    }))
    print("passowrd=" + password)
    return password




def extract(text:str,start:str,end:str):
    """
    retourne le texte contenu entre deux chaines
    :param text:
    :param start:
    :param end:
    :return:
    """
    if text is None or len(text)==0:return text
    start = text.index(start) + len(start)
    end = (text[start:].index(end) + start) if end in text[start:] else len(text)
    return text[start:end]



def get_faqs(filters="",domain_appli=DOMAIN_APPLI,domain_server=DOMAIN_SERVER,color="gray",format="json",summary=False,sort=True):
    with open("./faq.yaml", 'r', encoding='utf8') as f:
        body = f.read()

    # Remplacement des champs types
    body = body.replace("{{domain_appli}}", domain_appli).replace("{{appname}}", APPNAME).replace("{{appli_domain}}", domain_appli).replace("{{domain}}",domain_server)

    while ("{{link:" in body):
        signet = extract(body, "{{link:", "}}")
        url = domain_server+ "/api/faqs/"+signet+"?format=html"
        body = body.replace("{{link:" + signet + "}}", "(<a href='" + url + "'>voir</a>)")

    try:
        l_faqs: list = yaml.load(body)["content"]
    except:
        log("Le fichier de FAQ n'est pas conforme")
        return list()

    if sort:l_faqs.sort(key=lambda faq: faq["order"] if 'order' in faq else 100)

    if len(filters) > 0:
        rc=list()
        for f in l_faqs:
            for filter in filters.split(","):
                if f["index"] == filter:
                    rc.append(f)
        l_faqs=rc

    if format=="json":
        return l_faqs
    else:
        rc="<style>" \
           "body {font-family:Serif;} " \
           "h3 {font-weight:lighter;color:DarkBlue !important;} " \
           "a {text-decoration: none;color:Blue;}" \
           ".tm {font-size:large;text-decoration: none;font-weight:lighter;font-style: normal;color:DarkBlue;padding-top:3px;}" \
           "</style>"

        if summary:
            for f in l_faqs:
                rc=rc+"<a class='tm' href='#"+f["index"]+"'>"+f["title"]+"</a><br>"
            rc=rc+"<br><br>"

        for f in l_faqs:
            rc = rc + "<a name='"+f["index"]+"'><h3 style='color:"+color+"'>" + f["title"] + "</h3></a>" + f["content"] + "<br><br>"
        return rc


def levenshtein(s:str, t:str):
    """
        iterative_levenshtein(s, t) -> ldist
        ldist is the Levenshtein distance between the strings
        s and t.
        For all i and j, dist[i,j] will contain the Levenshtein
        distance between the first i characters of s and the
        first j characters of t
    """

    rows = len(s) + 1
    cols = len(t) + 1
    dist = [[0 for x in range(cols)] for x in range(rows)]

    # source prefixes can be transformed into empty strings
    # by deletions:
    for i in range(1, rows):
        dist[i][0] = i

    # target prefixes can be created from an empty source string
    # by inserting the characters
    for i in range(1, cols):
        dist[0][i] = i

    for col in range(1, cols):
        for row in range(1, rows):
            if s[row - 1] == t[col - 1]:
                cost = 0
            else:
                cost = 1
            dist[row][col] = min(dist[row - 1][col] + 1,  # deletion
                                 dist[row][col - 1] + 1,  # insertion
                                 dist[row - 1][col - 1] + cost)  # substitution

    return dist[row][col]


def sendmail(subject, _to, template, field):
    field["appname"]=APPNAME
    field["equipe"]=TEAM
    html=open_html_file(template,field)
    log("Envoi de "+html)
    _dest=[]
    if type(_to)==str:_to=[_to]
    for c in _to:
        field["email"]=c
        if not c in EMAIL_TESTER or len(EMAIL_TESTER) == 0:
            _dest.append(c)

    if len(EMAIL_HOST_USER)>0:
        rc=send_mail(subject,message="",
                     from_email=EMAIL_HOST_USER,
                     recipient_list=_dest,
                     auth_user=EMAIL_HOST_USER,
                     html_message=html,
                     auth_password=passwords.EMAIL_HOST_PASSWORD)
    else:
        log("Pas de boite mail paramétrer pour l'instant")
        rc=True

    return rc


def open_html_file(name:str,replace=dict(),domain_appli=DOMAIN_APPLI):
    if not name.endswith("html"):name=name+".html"
    name=STATIC_ROOT+"/"+name

    log("Ouverture du fichier de mail "+name)

    with open(name, 'r', encoding='utf-8') as f: body = f.read()

    style="""
        <style>
        .button {
         border: none;
         background: #d9d9d9;
         color: #fff;
         padding: 10px;
         display: inline-block;
         margin: 10px 0px;
         font-family: Helvetica, Arial, sans-serif;
         font-weight: lighter;
         font-size: large;
         -webkit-border-radius: 3px;
         -moz-border-radius: 3px;
         border-radius: 3px;
         text-decoration: none;
        }

     .button:hover {
        color: #fff;
        background: #666;
     }
    </style>
    """

    for k in list(replace.keys()):
        body=body.replace("{{"+k+"}}",str(replace.get(k)))

    body=body.replace("</head>",style+"</head>")

    while "{{faq:" in body:
        index_faq=extract(body,"{{faq:","}}")
        faq=get_faqs(filters=index_faq,domain_appli=domain_appli,color="blue",format="html")
        body=body.replace("{{faq:"+index_faq+"}}",faq)

    return body



# def send_mail(body:str,_to="paul.dudule@gmail.com",_from:str="ticketshare@f80lab.com",subject=""):
#     if _to is None or len(_to)==0:return None
#     with smtplib.SMTP(SMTP_SERVER, 587) as server:
#         server.ehlo()
#         server.starttls()
#         try:
#             log("Tentative de connexion au serveur de messagerie")
#             server.login(USERNAME, PASSWORD)
#             log("Connexion réussie. Tentative d'envoi")
#
#             msg = MIMEMultipart()
#             msg.set_charset("utf-8")
#             msg['From'] = _from
#             msg['To'] = _to
#             msg['Subject'] = subject
#             msg.attach(MIMEText(body,"html"))
#
#             log("Send to "+_to+" <br><div style='font-size:x-small;max-height:300px>"+body+"</div>'")
#             server.sendmail(msg=msg.as_string(), from_addr=_from, to_addrs=[_to])
#             return True
#         except Exception as inst:
#             log("Echec de fonctionement du mail"+str(type(inst))+str(inst.args))
#             return False


def tirage(indice_sup,indice_inf=0):
    i=int(indice_sup)
    if i>0:
        return random.randrange(start=indice_inf,stop=i)

    return 0



import datetime
def now(format="dec"):
    rc= datetime.datetime.now(tz=None).timestamp()
    if format=="hex":return hex(int(rc*10000))
    if format=="random":return hex(int(rc*10000)+random.randint(0,1000000))
    return rc



start=now()
store_log=""
def log(text:str,sep='\n'):
    global store_log
    delay=int(now()-start)
    line:str=str(int(delay/60))+":"+str(delay % 60)+" : "+text
    try:
        print(line)
    except:
        pass
    store_log = line+sep+store_log[0:10000]
    return text


def get_perms_for_profil(profil_id:str):
    """
    Retourne les permissions d'un profil
    :param profil_id:
    :return:
    """
    perms = yaml.safe_load(open(STATIC_ROOT + "/profils.yaml", "r", encoding="utf-8").read())
    perm=""
    for p in perms["profils"]:
        if p["id"] == profil_id:
            perm = p["perm"]
            break

    log("Permission par défaut pour les connectés : " + perm)
    return perm




def dateToTimestamp(txt):
    """
    Tentative d'interpretation des dates du fichier de configuration
    :param txt:
    :return:
    """
    if txt is None:return None
    if txt=="00/00/00" or txt=="0000-00-00":return None

    if type(txt)==str and (txt.startswith('+') or txt.startswith("-")):
        txt=float(txt) #Le comptage se fait en heure

    if type(txt)==str and "," in txt:
        txt=float(txt.replace(",","."))

    if type(txt)==int or type(txt)==float:
        if txt<100000:
            rc = datetime.now().timestamp() + float(txt) * 3600
            return rc
        else:
            return txt

    if type(txt) is datetime:
        return txt.timestamp()

    txt=str(txt)
    txt=txt.strip()

    if " " not in txt:
        if not ":" in txt:
            txt=txt+" 00:00"
        else:
            txt=datetime.now().strftime("%d/%m/%Y")+" "+txt

    #Traitement du format dd/mm HH:MM
    if len(txt.split("/"))==2:
        if " " in txt:
            txt=txt.split(" ")[0]+"/"+str(datetime.now().year)+" "+txt.split(" ")[1]
        else:
            txt=txt+str(datetime.now().year)


    formats=[
        "%d_%m %H:%M",
        "%d_%m-%y %H:%M",
        "%d/%m/%Y %H:%M",
        "%-d/%-m/%Y %H:%M",
        "%d/%m/%Y %-H:%-M",
        "%d/%m/%Y %H",
        "%d/%m %H",
        "%d/%m",
        "%d %H:%M",
        "%d/%m/%y %H:%M",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%y-%m-%d %H:%M %p",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%d-%m-%Y_%H:%M",
    ]
    for format in formats:
        try:
            dt:struct_time=strptime(txt,format)
            return datetime.datetime(*dt[:6])
        except Exception as inst:
            pass

    log("Probleme de conversion de " + str(txt) + " en date")
    return None




def fusion(p1: Model, p2: Model,withLog=False):
    hasChanged=False
    if withLog: log("On opére la fusion de "+str(p1)+" avec "+str(p2))
    attrs_p1=list(model_to_dict(p1).keys())
    attrs_p2=list(model_to_dict(p2).keys())

    for attr in attrs_p2:
        # On remplace tous les None
        if attr not in ["id"] and attr in attrs_p1:
            val = p2.__getattribute__(attr)
            if not val is None:
                if type(p1.__getattribute__(attr)) == str:
                    if len(val)>0:
                        if (p1.__getattribute__(attr) is None or len(p1.__getattribute__(attr))==0):
                            p1.__setattr__(attr, val)
                            hasChanged=True
                else:
                    if type(p1.__getattribute__(attr)) == list:
                        for it in p1.__getattribute__(attr):
                            if not it in val:
                                val.append(it)
                                hasChanged=True
                        p1.__setattr__(attr,val)
                    else:
                        if p1.__getattribute__(attr) is None:
                            p1.__setattr__(attr,val)
                            hasChanged=True

    return p1,hasChanged



def init_dict():
    global MYDICT
    if MYDICT is None:
        with open(STATIC_ROOT+"/dictionnary.yaml", 'r', encoding='utf8') as f:
            body = f.read()
        MYDICT = yaml.load(body.lower(), Loader=yaml.Loader)
    return MYDICT


def in_dict(key:str,section="jobs"):
    init_dict()
    if key is None or len(key)<2:return False

    key=key[0].upper() + key[1:].lower()
    return key.lower() in MYDICT[section].keys()

def apply_dictionnary_on_each_words(section:str,text:str):
    rc=[]
    for wrd in text.split(" "):
        rc.append(translate(wrd,sections=[section],must_be_in_dict=False))
    return " ".join(rc)


def translate(wrd:str,sections=["jobs","categories","abreviations","department_category","departements","languages","festivals"],must_be_in_dict=False,levenstein_tolerance=0):
    """
    Remplacement de certains termes
    :param wrd:
    :param dictionnary:
    :return:
    """
    init_dict()

    if wrd is None:
        return None

    key=wrd.lower().replace(",","").replace("(","").replace(")","").replace(":","").replace(" by","").replace("/"," ").strip()
    key=key.replace("\n"," ").replace("  "," ")
    for i in range(10):
        key=key.replace("   "," ").replace("  "," ")

    rc = key
    find=False
    for section in sections:
        if wrd.lower() in MYDICT[section].values():
            return wrd

        if key in MYDICT[section].keys():
            rc = MYDICT[section][key]
            find=True
            break

        if must_be_in_dict and not find:
            if levenstein_tolerance>0:
                for dict_word in MYDICT[section].keys():
                    if Levenshtein.distance(key,dict_word)<=levenstein_tolerance:
                        key=dict_word

            if not key in MYDICT[section].values():
                return None

    if not rc is None and len(rc)>1:
        return (rc[0].upper()+rc[1:].lower()).strip()
    else:
        return rc



def clear_directory(dir, ext):
    log("Netoyage du répertoire des films")
    for file in scandir(dir):
        if file.name.endswith("."+ext):
            remove(file.path)


def remove_ponctuation(text):
    if text:
        text=text.replace(","," ").replace("-"," ")
        text=text.replace("  "," ").replace("   "," ")
    return text

def getConfig(varname=""):
    rc=os.environ[varname]
    return rc


def load_json(url:str):
    data=get(url)
    return data.json()


def load_with_selenium(url,username,password):
    bot=Bot(url)
    bot.login(username,password)

def remove_html(text):
    for balise in ["<a>","<br>","\n","\r","</a>","<p>","</p>","\t"]:
        text=text.replace(balise,"")
    return text

def remove_accents(s:str):
    if s is None:return None
    for p in ["ée","àa","èe","âa","îi","ôo","êe","àa","ïi","öo","äa","ëe","çc"]:
        s=s.replace(p[0],p[1]).replace(p[0].upper(),p[1].upper())
    return s

def equal_str(s1:str,s2:str):
    if s1 and s2:
        s1=remove_accents(remove_ponctuation(s1).replace(" ","").upper()).strip()
        s2=remove_accents(remove_ponctuation(s2).replace(" ","").upper()).strip()
    return (s1==s2)


def index_string(s):
    """
    permet de créer une chaine de caractères pour la recherche
    :param s: prenom+nom
    :return: le fullname sans accent, ponctuation ou espace
    """
    if not s is None:
        while " " in s: s=s.replace(" ","")
        s=remove_accents(remove_ponctuation(s)).upper()
        while " " in s: s=s.replace(" ","")
    return s


def isWindows():
    return system()=="Windows"



def extract_years(txt:str,index=None):
    rc=re.findall(r"[1-2][0-9]{3}", txt)
    if not index is None:
        if len(rc)>index:
            return rc[index]
        else:
            return None
    else:
        return rc


def remove_string_between_delimiters(s:str,start_delimiter,end_delimiter):
    return re.sub(f'{start_delimiter}.*?{end_delimiter}', '', s)

    # while True:
    #     start_index = s.find(start_delimiter)
    #     if start_index == -1: break
    #     end_index = s.find(end_delimiter, start_index + len(start_delimiter))
    #     if end_index == -1: break
    #     s=s[:start_index] + s[end_index + len(end_delimiter):]
    # return s



def clean_page(code:str,balises=["script","style","path","noscript"]) -> str:
    if code is None: return None
    if type(code)!=str:code=str(code)
    if len(code)==0: return ""

    lenCode=len(code)
    if "<body" in code:
        code="<body" + code.split("<body")[1]

    for balise in balises:
        code=remove_string_between_delimiters(code,"<"+balise,"</"+balise+">")

    gain=100-100*len(code)/lenCode
    #log("Compression de "+str(gain)+"%")

    return code



def file_duration(filepath:str,unite: str="day") -> int:
    """
    Evalue depuis combien de jour un fichier a été modifié
    :param filepath:
    :unite indique
    :return:
    """
    if not exists(filepath): return 1e18

    scale=3600*24
    if unite=="hrs": scale=3600
    if unite=="min": scale=60

    delay=(datetime.datetime.now().timestamp()-stat(filepath).st_mtime)/(scale)
    return int(delay)





def load_page(url:str,refresh_delay=31,save=True,bot=None,timeout=3600,
              agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
              offline=False,
              cleaning=True,
              selenium_driver:WebDriver=None,format="text"):
    """
    tags #open_page open page
    :param url:
    :param refresh_delay:
    :param save:
    :param bot:
    :param timeout:
    :param agent:
    :param offline:
    :return:
    """
    if url is None:return None
    if url.startswith("/"):url="https://www.imdb.com/"+url

    filename=hashlib.sha224(bytes(url,"utf8")).hexdigest()+".html"

    if isWindows():
        if not exists(PAGEFILE_PATH + filename) :
            if exists("./Temp/html.7z"):
                with py7zr.SevenZipFile(PAGEFILE_PATH + "/html.7z", 'r') as archive:
                    archive.extract(path=PAGEFILE_PATH,targets=filename)

        delay=file_duration(PAGEFILE_PATH+filename,"day")

    if  isWindows() and exists(PAGEFILE_PATH + filename) and delay<refresh_delay:
        #log("Utilisation du fichier cache "+filename+" pour "+url)
        try:
            if format=="text":
                with open(PAGEFILE_PATH + filename, 'r', encoding='utf8') as f:
                    html=f.read()
                    f.close()
            else:
                with open(PAGEFILE_PATH + filename, 'rb') as f:
                    html=f.read()
                    f.close()

        except:
            os.remove(PAGEFILE_PATH + filename)
            return load_page(url)

        if type(html)==str:
            page=wikipedia.BeautifulSoup(html,"html5lib")
        else:
            page=wikipedia.BeautifulSoup(html)

        if page is None or len(page.contents)==0:
            log("Le fichier ./Temp/"+filename+" est corrompu")
            os.remove(PAGEFILE_PATH + filename)
            return load_page(url)

        return page
    else:
        rc=None
        if not offline:
            log("Chargement de la page "+url)
            for itry in range(5):
                try:
                    if bot:
                        rc = wikipedia.BeautifulSoup(bot.download_page(url), "html5lib")
                        sleep(random.randint(1000, 2000) / 1000)
                    else:
                        if selenium_driver:
                            selenium_driver.maximize_window()
                            selenium_driver.get(url)
                            sleep(random.randint(1000, 2000) / 1000)
                            rc=wikipedia.BeautifulSoup(selenium_driver.page_source,"html5lib")
                        else:
                            rc= wikipedia.BeautifulSoup(wikipedia.requests.get(url, headers={'User-Agent': agent}).text, "html5lib")
                            sleep(random.randint(1000, 2000) / 1000)
                    break
                except:
                    pass

        if not rc is None and save and isWindows():
            path=PAGEFILE_PATH + filename
            #log("Enregistrement sur  " + path)
            if format=="text":
                with open(path, 'w', encoding='utf8') as f:
                    f.write(clean_page(str(rc)) if cleaning else str(rc))
                    f.close()
            else:
                with open(path, 'wb') as f:
                    f.write(rc.encode())
                    f.close()

            if exists(PAGEFILE_PATH + "html.7z"):
                with py7zr.SevenZipFile(PAGEFILE_PATH + "html.7z", 'a') as archive:
                    archive.write(PAGEFILE_PATH + filename,filename)

        return rc

