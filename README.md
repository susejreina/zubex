#Pasos de instalación
Instalar python; pendiente de instalar pip e incorporarlo al PATH
Instalar PostgreSQL
Instalar virtualenv >> pip install virtualenv
Se crea un directorio en el que se instalará el programa
Crear un directorio virtual >> virtualenv virenv_ztela_v2
Activar el directorio virtual, ir a la carpeta Scripts y luego "activate"
Instalar Dependencias "pip install -r requirements.txt"
Aplicar las migraciones "python manage.py migrate"
Crear super admin "python manage.py createsuperuser"
Correr el servidor "python manage.py runserver"

#Notas JC:
* Admin: http://127.0.0.1:8000/admin/
* Extrusoras: http://127.0.0.1:8000/control/#/extrusora
* Reporte: http://127.0.0.1:8000/control/#/reporte
* Hay que crear, un operario, un producto y una extrusora para poder probar
* Al crear un material el formato de Toleranciamm es N/N
* Al parecer las remisiones se generan desde el admin para que jale la alta de bobinas ( esto cambiará en la nueva etapa )
