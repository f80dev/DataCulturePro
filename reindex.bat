python manage.py makemigrations --settings OpenAlumni.settings_dev
python manage.py migrate --settings OpenAlumni.settings_dev
python manage.py search_index --settings OpenAlumni.settings_dev --rebuild --parallel


