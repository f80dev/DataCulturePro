python manage.py makemigrations
python manage.py migrate --settings OpenAlumni.settings_dev
python manage.py search_index --settings OpenAlumni.settings_dev --rebuild
python manage.py createsuperuser --settings OpenAlumni.settings_dev