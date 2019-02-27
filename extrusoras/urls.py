"""extrusoras URL Configuration
"""
from django.contrib import admin
from django.urls import include, path

admin.site.site_header = 'Ztela'
admin.site.site_title  = 'Sistema Administrativo Ztela'
admin.site.index_title = 'Administrador'

urlpatterns = [
    path('admin/', admin.site.urls, name='admin'),
    path('extrusoras_app/', include('extrusoras_app.urls'))
]