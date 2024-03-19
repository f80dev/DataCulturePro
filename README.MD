##Architecture générale

DataCulture repose sur 4 composants:
    - une base de données SQL : PostgreSQL
    - un serveur d'API développé sur le framework Flask
    - un front-end web compatible avec tout type de terminaux (ordinateur, téléphone)
    - un moteur de recherche orienté BigData

l'hébergement du front-end est assuré par le service github page. Les trois autres composants peuvent être déployer sur un seul ou plusieurs serveurs.
Le déploiement est assuré par des images Docker.


##Sécurité
Les mots de passes d'accès aux bases de données sont renseignés uniquement au moment de l'installation. 
Les informations sensible sur les anciens élèves sont cryptés dans la base de données. Seul le serveur peut les décrypter.

#PyCharm
##dev
Configuration en mode django server

Environnement variable: 
    - dev: PYTHONUNBUFFERED=1;DJANGO_SETTINGS_MODULE=OpenAlumni.settings_dev;DEBUG=True;API_SERVER=http://localhost:8000
    - prod: PYTHONUNBUFFERED=1;DJANGO_SETTINGS_MODULE=OpenAlumni.settings;DEBUG=False 


#Configuration de développpement

##Installation d'un serveur
Le projet repose pour sur un serveur virtuel sous Fedora.
Depuis la connexion Root, on lance

<pre>
dnf install podman
firewall-cmd --zone=public --add-port=9090/tcp
</pre>


##Renouvellement des certificats Let's encrypt
Installation pour fedora
<pre>
dnf install certbot
désactiver le firewall
certbot certonly --standalone --email hhoareau@gmail.com -d api.f80.fr
certbot certonly --standalone --email hhoareau@gmail.com -d api.nfluent.io
certbot certonly --standalone --email hhoareau@gmail.com -d femis.f80.fr
certbot certonly --standalone --email hhoareau@gmail.com -d homeserver.f80.fr
mkdir /root/certs_dataculture
cp /etc/letsencrypt/live/api.f80.fr/* /root/certs_dataculture
cp /etc/letsencrypt/live/api.nfluent.io/* /root/certs_dataculture
cp /etc/letsencrypt/live/homeserver.nfluent.io/* /root/certs_dataculture
</pre>
test du serveur : https://api.f80.fr/api



##Netoyage préalable
Il peut être nécessaire de netoyer la base prélablement:
<pre>
python manage.py flush --settings OpenAlumni.settings 
python ../manage.py search_index --rebuild --settings OpenAlumni.settings 
</pre>

##Installation d'une version locale de mongodb
Instalation en local
<pre>
docker rm -f mongodb && docker run -d -p 27017:27017 -v /root/mongodb:/data/db --name mongodb -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=hh4271 mongo:4.4
</pre>
Instalation sur l'ordi home
docker rm -f mongodb && docker run -d --cpus 2 -p 27017:27017 -v /root/mongodb:/data/db --name mongodb -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=hh4271 mongo:4.4




##Installation
Après avoir récupérer le code, on installe une version locale de postgres
puis on execute
<pre>
python manage.py makemigrations --settings OpenAlumni.settings_dev
python manage.py flush
python manage.py migrate --settings OpenAlumni.settings_dev 
python manage.py search_index --rebuild --settings OpenAlumni.settings_dev
</pre><br>

##Création de la base de données et du compte

Le compte de super utilisateur permet une gestion fine de la plateforme d'exposition des API

voir https://docs.djangoproject.com/fr/1.8/intro/tutorial02/

python manage.py createsuperuser --settings OpenAlumni.settings

Pour l'environnement de développement on utilisera
python manage.py createsuperuser --settings OpenAlumni.settings_dev

Si besoin il est possible de faire cela sur le serveur
docker run -it openalumni /bin/bash



#Version d'installation propre :
voir https://github.com/testdrivenio/django-on-docker


 



#Tester la sécurisation
##Tester l'obtention des token
<pre>http://127.0.0.1:8000/api/token/</pre>





#Installation sur un serveur
## La base de données
### L'importation de gros fichiers via nifi
Lancement de NIFI

<pre>
cp /root/certs/cert.pem /root/certs/server-cert.pem 
cp /root/certs/privkey.pem /root/certs/server-key.pem 
ufw allow 8443
docker rm -f nifi
docker pull apache/nifi:latest
docker rm -f nifi && docker run --name nifi --memory 1024Mb -v /root/nifi/conf:/opt/conf -v /root/nifi/state:/data/nifi/state -p 8443:8443 -e SINGLE_USER_CREDENTIALS_USERNAME=admin -e NIFI_WEB_HTTP_HOST=0.0.0.0 -e NIFI_WEB_HTTP_PORT=8443 -e SINGLE_USER_CREDENTIALS_PASSWORD=hh427142714271 -ti apache/nifi:latest
</pre>

pour windows : 
<pre>
docker run --name nifi --memory 1024Mb -p 8443:8443 -v c:/temp/nifi_files:/mnt -e SINGLE_USER_CREDENTIALS_USERNAME=admin -e NIFI_WEB_HTTP_HOST=127.0.0.1:8443 -e SINGLE_USER_CREDENTIALS_PASSWORD=hh427142714271 -d apache/nifi:latest
</pre>

### Installation de la base
Executer la commande 
<pre>
firewall-cmd --zone=public --add-port=5432/tcp ou ufw allow 5432
docker rm -f postgres & docker run --name postgres -p 5432:5432  -v /root/postgre:/var/lib/postgresql/data --restart=always --network=dcpnetwork -e POSTGRES_PASSWORD=hh4271 -e POSTGRES_DB=alumni_db -e POSTGRES_USER=hhoareau -d postgres:13-alpine
</pre>
ou avec podman
<pre>
setenforce 0 
mkdir /root/postgre
docker rm -f postgre
docker run --name postgre -p 5432:5432 --cpus 2 -v /root/postgre:/var/lib/postgresql/data --network=dcpnetwork --restart=always  -e POSTGRES_PASSWORD=hh4271 -e POSTGRES_DB=alumni_db -e POSTGRES_USER=hhoareau -d postgres:13-alpine
</pre>

Depuis windows
<pre>
docker rm -f postgre
docker run --name postgre -p 5432:5432  -v c:/temp/postgre:/var/lib/postgresql/data -e POSTGRES_PASSWORD=hh4271 -e POSTGRES_DB=alumni_db -e POSTGRES_USER=hhoareau -d postgres:13-alpine
</pre>

Si probléme d'accès au répertoire /root/postgres, il faut fixer avec su -c "setenforce 0"

Créer les utilisateurs admin & anonymous


##Le serveur Django
A priori le serveur djando s'installe sur le MainServer
<pre>
cd /root
mkdir nginx
wget https://raw.githubusercontent.com/f80defv/OpenAlumni/master/nginx.conf nginx.conf && mv nginx.conf /root/nginx
wget https://raw.githubusercontent.com/f80dev/OpenAlumni/master/Dockerfile ./nginx/ 
wget https://raw.githubusercontent.com/f80dev/OpenAlumni/master/docker-compose.yml
docker-compose up -d --build
</pre>


##Elasticsearch
démarrer le noeud elasticsearch pour la production
<pre>

firewall-cmd --zone=public --add-port=9200/tcp ou ufw allow 9200
firewall-cmd --zone=public --add-port=9300/tcp ou ufw allow 9300
docker rm -f elastic_search_server
Non SSL: docker run -m 4GB -p 9200:9200 -p 9300:9300 --restart=always -e "xpack.security.enabled=false" -e "discovery.type=single-node" --name elastic_search_server -d docker.elastic.co/elasticsearch/elasticsearch:8.10.2
SSL: docker run -m 4GB -p 9200:9200 -p 9300:9300 --restart=always -e "discovery.type=single-node" --name elastic_search_server -d docker.elastic.co/elasticsearch/elasticsearch:8.10.2
</pre>


ou avec docker pour l'environnement de dev
<pre>
hors ubuntu:
apt install firewalld
firewall-cmd --zone=public --add-port=9210/tcp
firewall-cmd --zone=public --add-port=9310/tcp


depuis ubuntu:
apt install ufw
ufw allow 9210
ufw allow 9310
ufw reload


docker rm -f elastic_search_server-dev
docker run -p 9210:9200 -p 9310:9300 -e "xpack.security.enabled=false" --restart=always -e "discovery.type=single-node" --name elastic_search_server-dev -ti docker.elastic.co/elasticsearch/elasticsearch:8.3.2
</pre>

l'option xpack.security.enabled=false permet de faire la connexion sans SSL
l'activation de la sécurité se fait pas https://www.elastic.co/guide/en/elasticsearch/reference/7.17/configuring-tls-docker.html


Vérifier l'installation en ouvrant le serveur : http://<server>:9210


puis reconstruire l'index par 
<pre>
python manage.py search_index --rebuild 
</pre>

#Netoyage du cache
Suppression des fichiers ayant plus de 100 jours:
<pre>
cd G:\Projets\DataCulturePro\Temp
Get-ChildItem -Path "." | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-100) } | Remove-Item -Force
</pre>


#Développement
##Utilisation d'elasticsearch
Voir https://django-elasticsearch-dsl.readthedocs.io/en/latest/about.html
et l'intégration avec le rest framework : https://django-elasticsearch-dsl-drf.readthedocs.io/en/latest/quick_start.html


#Tests
##tester en production
Ouverture via https://dcp.f80lab.com/search

##tester en local
Ouverture via http://localhost:4200/admin

#Divers

https://bezkoder.com/django-angular-crud-rest-framework/

Accès aux information LinkedIn:

Demande d'accès au profil complet : https://docs.microsoft.com/en-us/linkedin/shared/references/v2/profile/full-profile?context=linkedin/consumer/context


#Installation du serveur
##Installation de cockpit
<pre>
dnf install cockpit
dnf install cockpit-dashboard cockpit-podman cockpit-machines cockpit-networkmanager cockpit-packagekit cockpit-storaged
systemctl restart cockpit.socket
</pre>

##Configuration des sous domaines
###paramaitrage du nom de domaine
Connexion à https://my.ionos.fr/domain-details/dcp.f80lab.com
Paramétrage du dns : 
    Sous domaine de production:
    - dcp : 185.199.108.153 & 185.199.109.153
    
    Sous domaine de developpement:
    - dcp-dev : 185.199.108.153 & 185.199.109.153

###Paramaitrage du github

    

##Installation du firewall
<pre>
dnf install 
systemctl unmask firewalld
systemctl start firewalld
systemctl enable firewalld
</pre>



##Installation de podman (remplacent de docker pour fedora)
 <pre>
 yum -y install podman
 </pre>
 

##Installation de docker-ce
<pre>
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo sed -i 's/$releasever/31/g' /etc/yum.repos.d/docker-ce.repo
sudo dnf install docker-ce
sudo systemctl enable --now docker
</pre>


#Déploiement de la version de production
Produire le fichier 

#Chargement des données



#Références
##Analyse du graph social
Utilisation de l'appli Gephi
Manuel : http://gephi.michalnovak.eu/Mastering%20Gephi%20Network%20Visualization.pdf


