# Generated by Django 4.0.6 on 2023-06-15 17:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0005_alter_extrauser_ask'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profil',
            name='degree_year',
            field=models.CharField(help_text="Année de sortie de l'école (promotion)", max_length=4, null=True),
        ),
    ]
