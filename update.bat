python manage.py makemigrations
python manage.py migrate --settings OpenAlumni.settings_dev
python manage.py search_index --settings OpenAlumni.settings_dev --rebuild

echo "Deployer le dev"
pause 0

c:
cd C:\Users\hhoar\PycharmProjects\OpenAlumni\frontend\openalumniclient
start npm run dev


cd C:\Users\hhoar\PycharmProjects\OpenAlumni
copy Dockerfile-dev Dockerfile
docker build -t f80hub/openalumni-dev . & docker push f80hub/openalumni-dev:latest

echo "Pousser sur Github et déployer l'image avec "
echo "docker rm -f openalumni-dev && docker pull f80hub/openalumni-dev:latest && docker run --restart=always -v /root/certs:/certs -p 8100:8000 --name openalumni-dev -d f80hub/openalumni-dev:latest"

