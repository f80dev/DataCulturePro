from django.urls import path, include
from . import views

urlpatterns = [
    path('raz/',views.api_raz),
    path('importer/',views.api_importer),
]
