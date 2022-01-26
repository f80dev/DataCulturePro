# Generated by Django 3.2.8 on 2022-01-26 18:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0018_award_source'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='sumary',
            field=models.CharField(default='', help_text="Résumé de l'article", max_length=250),
        ),
        migrations.AddField(
            model_name='article',
            name='title',
            field=models.CharField(default='', help_text="Titre de l'article", max_length=100),
        ),
        migrations.AlterField(
            model_name='article',
            name='html',
            field=models.TextField(blank=True, default='', help_text="Contenu de l'article", max_length=500000),
        ),
    ]
