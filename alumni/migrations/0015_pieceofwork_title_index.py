# Generated by Django 3.2.8 on 2022-01-13 11:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0014_auto_20220104_2045'),
    ]

    operations = [
        migrations.AddField(
            model_name='pieceofwork',
            name='title_index',
            field=models.CharField(default='', help_text="Titre de l'oeuvre simplifier pour gestion de la recherche", max_length=300),
        ),
    ]
