# Generated by Django 3.2.8 on 2021-10-14 09:50

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0011_auto_20211014_1142'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profil',
            name='dtLastNotif',
            field=models.DateTimeField(default=datetime.datetime(2021, 1, 1, 0, 0), help_text='Date de la dernière notification envoyé'),
        ),
        migrations.AlterField(
            model_name='profil',
            name='dtLastSearch',
            field=models.DateTimeField(default=datetime.datetime(2021, 1, 1, 0, 0), help_text="Date de la dernière recherche d'expérience pour le profil"),
        ),
    ]