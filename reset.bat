python manage.py flush --noinput --settings OpenAlumni.settings_dev
python manage.py makemigrations
python manage.py migrate --settings OpenAlumni.settings_dev
python manage.py search_index --rebuild --settings OpenAlumni.settings_dev
python manage.py createsuperuser --settings OpenAlumni.settings_dev
