echo "Mise a jour"

echo "Déploiement du serveur sur le NFluentServer"
cd C:\Users\hhoar\IdeaProjects\DataCulturePro
copy Dockerfile-prod Dockerfile
docker build -t f80hub/openalumni .
docker push f80hub/openalumni:latest

echo "Installation sur le serveur"
putty -pw %1 -ssh root@38.242.210.208 -m "install_server"