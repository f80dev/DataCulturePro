rem voir https://www.postgresql.org/docs/current/app-pgdump.html
cd ./dbbackup
set PGPASSWORD=%1
pg_dump.exe --host=192.168.1.62 --port=5432 --username=hhoareau alumni_db > backup_alumni_%2.out
dir *.out
cd ..