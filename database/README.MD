#Installation 


#Divers requètes de netoyage de la base
#suppression des works
delete from alumni_work
where alumni_work.id in (select alumni_work.id from alumni_work inner join alumni_pieceofwork on alumni_work.pow_id = alumni_pieceofwork.id where alumni_pieceofwork.title NOT LIKE '% / %' AND alumni_pieceofwork.nature='Série')

#suppression des awards
delete from alumni_award where alumni_award.id in (select alumni_award.id from alumni_award inner join alumni_pieceofwork on alumni_award.pow_id = alumni_pieceofwork.id where alumni_pieceofwork.title NOT LIKE '% / %' AND alumni_pieceofwork.nature='Série')


#Netoyage des eleves qui ne devraient pas être présent
##Suppression des travaux réalisé par les éléves qui ne sont pas des anciens
delete from alumni_work
where id in (select alumni_work.id from alumni_profil join alumni_work on alumni_profil.id = alumni_work.profil_id where cursus = 'S' and degree_year::INTEGER > 2022)

##Suppression des travaux portant sur des films en anomalie
delete alumni_work from alumni_work
join alumni_pieceofwork on alumni_work.pow_id = alumni_pieceofwork.id
where alumni_pieceofwork.year::INTEGER<1980 or alumni_pieceofwork.year::INTEGER>2024


##Suppression des awards
-  delete from alumni_award
   where id in (select alumni_award.id from alumni_profil
   join alumni_award on alumni_profil.id = alumni_award.profil_id
   where cursus = 'S' and degree_year::INTEGER > 2022)

##Suppression des profils 

#Visualisation
select alumni_work.id
from alumni_work
inner join alumni_pieceofwork
on alumni_work.pow_id = alumni_pieceofwork.id
where alumni_pieceofwork.title NOT LIKE '% / %' AND alumni_pieceofwork.nature='Série'


#Visualisation des connexion avec work
select alumni_award.id
from alumni_award
inner join alumni_pieceofwork
on alumni_work.pow_id = alumni_pieceofwork.id
where alumni_pieceofwork.title NOT LIKE '% / %' AND alumni_pieceofwork.nature='Série'

#Visualisation des connexion avec award
select alumni_award.id
from alumni_award
inner join alumni_pieceofwork
on alumni_award.pow_id = alumni_pieceofwork.id
where alumni_pieceofwork.title NOT LIKE '% / %' AND alumni_pieceofwork.nature='Série'



#Suppression des films
delete
from alumni_pieceofwork
where alumni_pieceofwork.title NOT LIKE '% / %' AND alumni_pieceofwork.nature='Série'


Accès a superset
docker rm -f superset && docker run -ti -p 8080:8088 -e "SUPERSET_SECRET_KEY=4271" --name superset apache/superset:latest
docker exec -it superset superset fab create-admin --username hhoareau --firstname herve --lastname hoareau --email hhoareau@gmail.com --password hh4271
docker exec -it superset superset db upgrade && docker exec -it superset superset load_examples && docker exec -it superset superset init

Utilisation de grafana
https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/
docker run -d -p 3000:3000 -e "GF_INSTALL_PLUGINS=grafana-clock-panel, grafana-simple-json-datasource" -v /root/grafana:/var/lib/grafana --name=grafana grafana/grafana-enterprise


#Création des vues
##Awards:
select alumni_festival.title as festival_title,alumni_award.description as award_description,alumni_award.year as award_year,alumni_pieceofwork.*
from alumni_award
inner join alumni_pieceofwork on alumni_award.pow_id = alumni_pieceofwork.id
inner join alumni_festival on alumni_award.festival_id = alumni_festival.id

##Profils
select *
from alumni_pieceofwork_
inner join alumni_pieceofwork on alumni_award.pow_id = alumni_pieceofwork.id
inner join alumni_work on alumni_award.festival_id = alumni_festival.id


#Installation de d'Apache Superset
