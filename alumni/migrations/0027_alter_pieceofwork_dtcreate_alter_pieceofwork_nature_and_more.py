# Generated by Django 4.0.2 on 2022-06-01 09:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0026_alter_award_dtcreate_alter_award_festival'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pieceofwork',
            name='dtCreate',
            field=models.DateField(auto_now_add=True, help_text="!Date d'enregistrement de l'oeuvre dans DataCulture"),
        ),
        migrations.AlterField(
            model_name='pieceofwork',
            name='nature',
            field=models.CharField(default='MOVIE', help_text="Nature de l'oeuvre (long, court, docu)", max_length=50),
        ),
        migrations.AlterField(
            model_name='pieceofwork',
            name='prizes',
            field=models.JSONField(help_text='!Liste des prix reçus', null=True),
        ),
        migrations.AlterField(
            model_name='pieceofwork',
            name='reference',
            field=models.CharField(blank=True, default='', help_text="Reference de l'oeuvre", max_length=50),
        ),
        migrations.AlterField(
            model_name='pieceofwork',
            name='title_index',
            field=models.CharField(default='', help_text="!Titre de l'oeuvre simplifier pour gestion de la recherche", max_length=300),
        ),
        migrations.AlterField(
            model_name='pieceofwork',
            name='visa',
            field=models.CharField(help_text="Visa d'exploitation de l'oeuvre", max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name='pieceofwork',
            name='year',
            field=models.CharField(help_text="Année de sortie de l'oeuvre", max_length=4, null=True),
        ),
        migrations.AlterField(
            model_name='work',
            name='dtCreate',
            field=models.DateField(auto_now_add=True, help_text="!Date d'enregistrement de la contribution", null=True),
        ),
        migrations.AlterField(
            model_name='work',
            name='duration',
            field=models.IntegerField(default=0, help_text='Durée du travail (exprmimé en heure)'),
        ),
        migrations.AlterField(
            model_name='work',
            name='id',
            field=models.AutoField(help_text='!Clé primaire interne des projets', primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='work',
            name='job',
            field=models.CharField(default='', help_text='Désignation du travail réalisé : production, scénariste ...', max_length=200),
        ),
        migrations.AlterField(
            model_name='work',
            name='public',
            field=models.BooleanField(default=True, help_text='Indique si le projet est public (visible de ceux qui ont les droits) ou privé'),
        ),
        migrations.AlterField(
            model_name='work',
            name='validate',
            field=models.BooleanField(default=False, help_text="!Indique si l'expérience est validé ou pas"),
        ),
    ]