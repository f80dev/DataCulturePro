# Generated by Django 3.2.8 on 2021-12-07 17:49

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0006_award_festival'),
    ]

    operations = [
        migrations.AlterField(
            model_name='award',
            name='pow',
            field=models.ForeignKey(help_text='Oeuvre récompensé', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='award', to='alumni.pieceofwork'),
        ),
    ]
