echo "Mise a jour"
python manage.py makemigrations
python manage.py migrate --settings OpenAlumni.settings_dev
python manage.py search_index --settings OpenAlumni.settings_dev --rebuild
