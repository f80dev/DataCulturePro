# Generated by Django 4.0.6 on 2023-07-12 06:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0006_alter_profil_degree_year'),
    ]

    operations = [
        migrations.AddField(
            model_name='profil',
            name='department_pro',
            field=models.CharField(blank=True, default='', help_text='Cursus (pro ou standard) suivi pendant les études', max_length=60, null=True),
        ),
    ]
