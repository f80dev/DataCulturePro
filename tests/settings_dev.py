"""
Django settings for OpenAlumni project.

Generated by 'django-admin startproject' using Django 3.0.8.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.0/ref/settings/
"""

import os

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import sys
from OpenAlumni.passwords import DB_PASSWORD,_SECRET_KEY

PAGEFILE_PATH="g://Projets/DataCulturePro/Temp/"
#PAGEFILE_PATH="c://Temp/"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMAIL_TESTER = ["hhoareau@gmail.com",
                "juan.neardesign@gmail.com"
                "paul.dudule@gmail.com",
                "roger.legumes@gmail.com",
                "j.lecanu@femis.fr",
                "rv@f80lab.com",
                "herve.hoareau@f80lab.com",
                "sophie.dudule@gmail.com"
                ]

EMAIL_PERM_VALIDATOR="paul.dudule@gmail.com"
LOCAL_FEDORA_SERVER='172.30.11.56'
SETTINGS_FILENAME="settings_dev.py"
VERSION="0.1"

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.0/howto/deployment/checklist/

GRAPH_MODELS = {
  'all_applications': True,
  'group_models': True,
}

SECRET_KEY=_SECRET_KEY


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
ALLOWED_HOSTS = [
    "*",
    "*.github.com",
    "server.f80lab.com",
    "localhost",
    "127.0.0.1",
    "testdcp.f80lab.com"
]
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

STATIC_URL  = "/static/"
STATIC_ROOT=os.path.join(BASE_DIR, "static").replace("//","/")
DEFAULT_PERMS_PROFIL="standard"

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'oauth2_provider',
    'django.contrib.admindocs',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'sslserver',
    'django_elasticsearch_dsl',
    'django_filters',
    'django_archive',
    'django_elasticsearch_dsl_drf',
    'django.contrib.staticfiles',
    'alumni.apps.AlumniConfig'
]


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    # 'django.middleware.cache.UpdateCacheMiddleware',
    # 'django.middleware.common.CommonMiddleware',
    # 'django.middleware.cache.FetchFromCacheMiddleware',
]


#GESTION du cache voir https://docs.djangoproject.com/en/3.2/topics/cache/
#a ajouter en middleware
# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.memcached.PyMemcacheCache',
#         'LOCATION': '127.0.0.1:8000',
#     }
# }
# CACHE_MIDDLEWARE_ALIAS = 'default'
# CACHE_MIDDLEWARE_SECONDS = 600
# CACHE_MIDDLEWARE_KEY_PREFIX = ''


DBBACKUP_STORAGE = 'django.core.files.storage.FileSystemStorage'
DBBACKUP_STORAGE_OPTIONS = {'location': './static/'}

CORS_ORIGIN_ALLOW_ALL = True
CORS_ORIGIN_WHITELIST = ['http://localhost:4200']

ROOT_URLCONF = 'OpenAlumni.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'OpenAlumni.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases

# "prod": {
#         "ENGINE": "django.db.backends.postgresql_psycopg2",
#         "NAME": "alumni_db",
#         "USER": "hhoareau",
#         "PASSWORD": "hh4271",
#         'HOST': '161.97.75.165',
#         'PORT': '5432',
#         'OPTIONS': {
#             'options': '-c statement_timeout=5000'
#         }
#     },
# "local": {
#             "ENGINE": "django.db.backends.postgresql_psycopg2",
#             "NAME": "alumni_db",
#             "USER": "hhoareau",
#             "PASSWORD": DB_PASSWORD,
#             'HOST': LOCAL_FEDORA_SERVER,
#             'PORT': '5432',
#             'OPTIONS': {
#                 'options': '-c statement_timeout=5000'
#             }
#         }
# "default": {
#     "ENGINE": "django.db.backends.postgresql_psycopg2",
#     "NAME": "test_alumni_db",
#     "USER": "hhoareau",
#     "PASSWORD": DB_PASSWORD,
#     'HOST': '161.97.75.165',
#     'PORT': '5432',
#     'OPTIONS': {
#         'options': '-c statement_timeout=5000'
#     }
# },
# "default": {
#     "ENGINE": "django.db.backends.postgresql_psycopg2",
#     "NAME": "dataculture",
#     "USER": "femis",
#     "PASSWORD": DB_PASSWORD,
#     'HOST': 'europlot.provider.eu',
#     'PORT': '30573',
#     'OPTIONS': {
#         'options': '-c statement_timeout=5000'
#     }
# },
# "dev": {
#         "ENGINE": "django.db.backends.postgresql_psycopg2",
#         "NAME": "alumni_db",
#         "USER": "hhoareau",
#         "PASSWORD": "hh4271",
#         'HOST': '207.180.198.227',
#         'PORT': '5432',
#         'OPTIONS': {
#             'options': '-c statement_timeout=5000'
#         }
#     }
# 'sqllite': {
#     'ENGINE': 'django.db.backends.sqlite3',
#     'NAME': os.path.join(BASE_DIR, 'alumni_db'),
# },


#La procédure d'installation de la base se trouve dans le README root
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": "test_dataculture",
        "USER": "femis",
        "PASSWORD": DB_PASSWORD,
        'HOST': '109.205.183.200',
        'PORT': '31509',
        'OPTIONS': {
            'options': '-c statement_timeout=50000'
        }
    },
}

#Installation d'elasticsearch dans README à la racine
#Utilisation du serveur elasticsearch sur 161.97.75.165:9210
ELASTICSEARCH_DSL = {
    'default': {
        'hosts': '173.249.41.158:9210'
    },
}

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 500,
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'ORDERING_PARAM':'ordering',
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    )
}


GRAPHENE = {
    'SCHEMA': 'alumni.profil.schema'
}



#https://django-elasticsearch-dsl-drf.readthedocs.io/en/latest/quick_start.html#installation
#chemin du répertoire document



# Password validation
# https://docs.djangoproject.com/en/3.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.0/topics/i18n/
LANGUAGE_CODE = 'fr-FR'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True



EMAIL_HOST ="smtp-mail.outlook.com"
EMAIL_PORT = 587
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_USE_TLS = True
EMAIL_HOST_USER ="contact.dcp@femis.fr"

APPNAME="Data Culture Pro (beta)"
DOMAIN_APPLI="http://localhost:4200"
DOMAIN_SERVER="http://localhost:8000"


DEBUG = (sys.argv[1] == 'runserver')


#Sécurisation
#SECURE_SSL_REDIRECT = True
#SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

MOVIE_CATEGORIES=[
    "Documentary",
    "Action",
    "Adventure",
    "Sci-Fi",
    "Mystery",
    "Horror",
    "Thriller",
    "Animation",
    "Comedy",
    "Family",
    "Fantasy",
    "Drama",
    "Music",
    "Biography",
    "Romance",
    "History",
    "Crime",
    "Western",
    "War",
    "Musical",
    "Sport"
]

MOVIE_NATURE=["Serie","TV","Short","Long","Documentary"]
MYDICT=None

DELAY_TO_AUTOSEARCH=24*0.2   #10 jours

#NFTS
TOKEN_ID='FEMIS-3ae1d3'
NFT_CREATE_COST="50000000000000000"
ADMIN_PEMFILE="./femis.pem"
NFT_CONTRACT="erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"
BC_PROXY="https://devnet-gateway.elrond.com"
BC_EXPLORER="https://devnet-explorer.elrond.com"

DEFAULT_PERMS_PROFIL="standard"