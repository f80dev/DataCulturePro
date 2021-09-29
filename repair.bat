echo "Mise a jour"
python manage.py makemigrations
python manage.py migrate --settings OpenAlumni.settings
python manage.py search_index --settings OpenAlumni.settings --rebuild