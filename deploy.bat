echo "Mise a jour"
python manage.py makemigrations --settings OpenAlumni.settings
python manage.py migrate --settings OpenAlumni.settings

set PYTHONIOENCODING=utf-8

echo "Déploiement du client"
c:
cd C:\Users\hhoar\IdeaProjects\DataCulturePro\frontend\openalumniclient
copy .\src\CNAME-prod .\src\CNAME
start npm run dev

echo "Déploiement du serveur sur le Prestashop Server"
cd C:\Users\hhoar\IdeaProjects\DataCulturePro
copy Dockerfile-prod Dockerfile
docker build -t f80hub/openalumni . & docker push f80hub/openalumni:latest
putty -pw %1 -ssh root@109.205.183.200 -m "install_server"

echo "Backup de la base de données"
python -Xutf8 manage.py dumpdata --settings OpenAlumni.settings > db_backup_prod.json

echo "reconstruction de l'index"
python manage.py search_index --settings OpenAlumni.settings --rebuild

