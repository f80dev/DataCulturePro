from OpenAlumni.data_importer import DataImporter
from tests.settings_dev import STATIC_ROOT


class TestClass:

    di=DataImporter()

    def test_download_file(self):
        size=10000
        for filename in ["title.principals","title.crew","title.episode","title.ratings","name.basics","title.akas","title.basics"]:
            self.di.download_file(filename, STATIC_ROOT+"/imdb_files",update_delay=0 )
        result=self.di.extract_file(offset=20000000,size=size)
        assert len(result)==size

    def test_split_file(self):
        self.di.split_file()

