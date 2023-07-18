"C:\Program Files\7-Zip\7z.exe" a -r -t7z DataCulturePro.7z *.* -xr!.git -xr!FrontEnd/OpenAlumniClient/node_modules -xr!venv -xr!__pycache__
"C:\Program Files\7-Zip\7z.exe" t ./DataCulturePro.7z
copy DataCulturePro.7z ..
del DataCulturePro.7z






