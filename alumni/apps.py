from django.apps import AppConfig
from django.core import management

from OpenAlumni.Tools import log


class AlumniConfig(AppConfig):
    name = 'alumni'

    def ready(self):
        log("Lancement")
        #management.call_command("search_index","--rebuild","--traceback","-f","--parallel","-v3")


