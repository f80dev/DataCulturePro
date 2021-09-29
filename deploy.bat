echo "Mise a jour"
python manage.py makemigrations
python manage.py migrate --settings OpenAlumni.settings
python manage.py search_index --settings OpenAlumni.settings --rebuild

echo "Déploiement ?"
pause 0
c:
cd C:\Users\hhoareau\PycharmProjects\OpenAlumni

copy Dockerfile-prod Dockerfile
docker build -t f80hub/openalumni .

cd frontend/openalumniclient
start npm run prod
cd ..
cd ..

docker push f80hub/openalumni:latest
echo "Exécuter cette ligne sur le serveur"
echo "docker rm -f openalumni && docker pull f80hub/openalumni:latest && docker run --restart=always -v /root/certs:/certs -p 8000:8000 --name openalumni -d f80hub/openalumni:latest"

putty -load MainServer -l root