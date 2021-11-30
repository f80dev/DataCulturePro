# Generated by Django 3.2.8 on 2021-11-30 14:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0004_auto_20211130_1405'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pieceofwork',
            name='dtCreate',
            field=models.DateField(auto_now_add=True, help_text="Date d'enregistrement de l'oeuvre dans DataCulture"),
        ),
        migrations.AlterField(
            model_name='pieceofwork',
            name='prizes',
            field=models.JSONField(help_text='Liste des prix reçus', null=True),
        ),
        migrations.AlterField(
            model_name='profil',
            name='advices',
            field=models.JSONField(default=None, help_text='Conseils pour augmenter la visibilité du profil', null=True),
        ),
    ]
