python manage.py makemigrations --settings OpenAlumni.settings
python manage.py migrate --settings OpenAlumni.settings
python manage.py search_index --settings OpenAlumni.settings --rebuild --parallel


