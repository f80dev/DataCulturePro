"""OpenAlumni URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf.urls import url
from django.contrib import admin
from django.urls import path, include
from graphene_django.views import GraphQLView
from rest_framework import routers
from rest_framework.authtoken.views import obtain_auth_token

from alumni import views
from alumni.schema import schema

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet,basename="user")
router.register(r'extrausers', views.ExtraUserViewSet,basename="permuser")
router.register(r'profils', views.ProfilViewSet)
router.register(r'extraprofils', views.ExtraProfilViewSet)
router.register(r'articles', views.ArticleViewSet)
router.register(r'pows', views.POWViewSet)
router.register(r'extraworks', views.ExtraWorkViewSet)
router.register(r'works', views.WorkViewSet)
router.register(r'awards', views.AwardViewSet)
router.register(r'extraawards', views.ExtraAwardViewSet)
router.register(r'festivals', views.FestivalViewSet)
router.register(r'extrapows', views.ExtraPOWViewSet)
router.register(r'extrapow', views.ExtraPOWViewSet)
router.register(r'profilsdoc', views.ProfilDocumentView,basename="profilsdoc")
router.register(r'powsdoc', views.PowDocumentView,basename="powsdoc")

urlpatterns = [
    path('admin/doc/', include('django.contrib.admindocs.urls')),
    path('admin/', admin.site.urls),
    path('api/',include('alumni.urls')),
    path('api/users/register/', views.UserCreate.as_view()),
    path('api/resend/', views.resend),
    path('api/add_issue/', views.add_issue),
    path('api/init_nft/', views.init_nft),
    path('api/update_dictionnary/', views.update_dictionnary),
    path('api/jobsites/', views.refresh_jobsites),
    path('api/send_to/', views.send_to),
    path('api/test/', views.test),
    path('api/write_nft/', views.write_nft),
    path('api/nfts/', views.nfts),
    path('api/batch/', views.batch),
    path('api/api_doc/', views.api_doc),
    path('api/quality_analyzer/', views.quality_filter),
    path('api/batch_movies/', views.batch_movie),
    path('api/search/', views.search),
    path('api/rebuild_index/', views.rebuild_index),
    path('api/getyaml/', views.getyaml),
    path('api/update_extrauser/', views.update_extrauser),
    path('api/infos_server/', views.infos_server),
    path('api/initdb/', views.initdb),
    path('api/helloworld/', views.helloworld),
    path('api/ask_perms/', views.ask_perms),
    path('api/set_perms/', views.set_perms),
    path('api/get_students/', views.get_students),
    path('api/social_graph/json/', views.social_graph),
    path('api/export_all/', views.export_all),
    path('api/export_profils/', views.export_profils),
    path('api/ask_for_update/', views.ask_for_update),
    path('api/show_movies/', views.show_movies),
    path('api/analyse_pow/', views.get_analyse_pow),
    url(r'^api/movie_importer/$',views.movie_importer),
    url('^api/api-token-auth/', obtain_auth_token),
    path("api/",include(router.urls)),
    url(r'^graphql$', GraphQLView.as_view(graphiql=True,schema=schema))
]
