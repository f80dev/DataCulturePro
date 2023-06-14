echo "Mise a jour"
python manage.py makemigrations --settings OpenAlumni.settings
python manage.py migrate --settings OpenAlumni.settings

set PYTHONIOENCODING=utf-8

echo "Déploiement du client"
copy CNAME-prod CNAME
cd C:\Users\hhoar\PycharmProjects\OpenAlumni\frontend\openalumniclient
start npm run prod

echo "Déploiement du serveur"
cd C:\Users\hhoar\PycharmProjects\OpenAlumni
copy Dockerfile-prod Dockerfile
docker build -t f80hub/openalumni . & docker push f80hub/openalumni:latest


echo "Backup de la base de données"
python -Xutf8 manage.py dumpdata --settings OpenAlumni.settings > db_backup_prod.json

echo "reconstruction de l'index"
python manage.py search_index --settings OpenAlumni.settings --rebuild
#putty -load MainServer -l root