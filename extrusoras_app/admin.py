from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.db import models

import sys
import psycopg2
from os import scandir, rename
from os.path import abspath, splitext

# Register your models here.
from .models.color import Color
from .models.departamento import Departamento
from .models.maquina import Maquina
from .models.mat import Mat
from .models.operario import Operario
from .models.producto import Producto
from .models.unidadmedida import UnidadMedida
from .models.remision import Remision
from .models.bobina import BobinaRemision, BobinaMedida
from .models.masivo import Masivo

from .models.medicionimpresion import MedicionImpresion
from .models.medicionbarnizado import MedicionBarnizado
from .models.medicionrectificado import MedicionRectificado
from .models.medicionrefilado import MedicionRefilado
from .models.medicionconversion import MedicionConversion
from .models.medicioncorrugado import MedicionCorrugado
from .models.medicionextrusora import MedicionExtrusora
from .models.medicionempaque import MedicionEmpaque

from .forms import MasivoForm

from .views import *

@admin.register(Masivo)
class MasivoAdmin(admin.ModelAdmin):
    form = MasivoForm

@admin.register(BobinaRemision)
class BobinaRemisionAdmin(admin.ModelAdmin):
    list_display = ('rem_id', 'bob_id','maq_id','ope_id')
    list_filter = ('rem_id',)
    search_fields = ('rem_id',)
    actions = ['print_label']

    def print_label(self, request, queryset):
        rem = queryset[0].rem_id
        bob = queryset[0].bob_id.bob_id
        remision = Remision.objects.get(rem_id=rem)
        dep_id = remision.pro_id.dep_id.dep_id
        if dep_id==4: #Barnizado
            return imprimir_etiqueta_barnizado(request, str(bob), rem)
        elif dep_id==5: #Refilado
            return imprimir_etiqueta_refilado(request, str(bob), rem)
        elif dep_id==6: #Rectificado
            return imprimir_etiqueta_rectificado(request, str(bob), rem)
        elif dep_id==7: #Impresion
            return imprimir_etiqueta_impresion(request, str(bob), rem)
        elif dep_id == 8: #Extrusión
            return imprimir_etiqueta_extrusora(request, str(bob), rem)
    print_label.short_description = "Imprimir etiqueta"

@admin.register(BobinaMedida)
class BobinaMedidaAdmin(admin.ModelAdmin):
    list_display = ('bob_id', 'bob_metro','bob_peso','dep_id')


@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ('col_id', 'col_descripcion',)
    list_filter = ('col_descripcion',)
    search_fields = ('col_descripcion',)

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ('dep_id', 'dep_descripcion',)
    list_filter = ('dep_descripcion',)
    search_fields = ('dep_descripcion', 'dep_bach_code',)

@admin.register(Maquina)
class MaquinaAdmin(admin.ModelAdmin):
    list_display = ('maq_id', 'maq_encabezado', 'maq_nombre', 'maq_activa',)
    list_filter = ('maq_nombre',)
    search_fields = ('maq_nombre',)

@admin.register(Mat)
class MatAdmin(admin.ModelAdmin):
    list_display = ('mat_id', 'mat_descripcion',)
    list_filter = ('mat_descripcion',)
    search_fields = ('mat_descripcion',)

@admin.register(Remision)
class RemisionAdmin(admin.ModelAdmin):
    list_display = ('rem_id', 'pro_id','rem_nextid','pro_nextid')
    search_fields = ('rem_id',)

# Define an inline admin descriptor for Employee model
# which acts a bit like a singleton
class OperarioInline(admin.StackedInline):
    model = Operario
    can_delete = False
    verbose_name_plural = 'operario'

# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = (OperarioInline, )

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(UnidadMedida)
class UnidadMedidaAdmin(admin.ModelAdmin):
    list_display = ('uni_id', 'uni_descripcion', 'uni_conversion' , 'uni_abreviacion')
    list_filter = ('uni_descripcion', 'uni_conversion' , 'uni_abreviacion')
    search_fields = ('uni_descripcion', 'uni_conversion' , 'uni_abreviacion')

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('pro_id', 'pro_descripcion', 'pro_medida', 'col_id', 'dep_id')
    list_filter = ('dep_id',)
    search_fields = ('pro_id','pro_descripcion',)

@admin.register(MedicionEmpaque)
class MedicionEmpaqueAdmin(admin.ModelAdmin):
    list_display = ('get_bobinaid', 'mem_numero', 'mem_fecha', 'mem_hora' , 'ope_id')
    list_filter = ('bob_id__bob_id',)
    search_fields = ('bob_id__bob_id',)

@admin.register(MedicionImpresion)
class MedicionImpresionAdmin(admin.ModelAdmin):
    list_display = ('get_bobinaid', 'mei_numero', 'mei_fecha', 'mei_hora' , 'ope_id')
    list_filter = ('bob_id__bob_id',)
    search_fields = ('bob_id__bob_id',)

@admin.register(MedicionBarnizado)
class MedicionBarnizadoAdmin(admin.ModelAdmin):
    list_display = ('get_bobinaid', 'meb_numero', 'meb_fecha', 'meb_hora' , 'ope_id')
    list_filter = ('bob_id__bob_id',)
    search_fields = ('bob_id__bob_id',)

@admin.register(MedicionRectificado)
class MedicionRectificadoAdmin(admin.ModelAdmin):
    list_display = ('get_bobinaid', 'mer_numero', 'mer_fecha', 'mer_hora' , 'ope_id')
    list_filter = ('bob_id__bob_id',)
    search_fields = ('bob_id__bob_id',)

@admin.register(MedicionRefilado)
class MedicionRefiladoAdmin(admin.ModelAdmin):
    list_display = ('get_bobinaid', 'mef_numero', 'mef_fecha', 'mef_hora' , 'ope_id')
    list_filter = ('bob_id__bob_id',)
    search_fields = ('bob_id__bob_id',)

@admin.register(MedicionExtrusora)
class MedicionExtrusoraAdmin(admin.ModelAdmin):
    list_display = ('get_bobinaid', 'mee_numero', 'mee_fecha', 'mee_hora' , 'ope_id')
    list_filter = ('bob_id__bob_id',)
    search_fields = ('bob_id__bob_id',)

@admin.register(MedicionConversion)
class MedicionConversionAdmin(admin.ModelAdmin):
    list_display = ('get_bobinaid', 'meo_numero', 'meo_fecha', 'meo_hora' , 'ope_id')
    list_filter = ('bob_id__bob_id',)
    search_fields = ('bob_id__bob_id',)

@admin.register(MedicionCorrugado)
class MedicionCorrugadoAdmin(admin.ModelAdmin):
    list_display = ('get_bobinaid', 'mec_numero', 'mec_fecha', 'mec_hora' , 'ope_id')
    list_filter = ('bob_id__bob_id',)
    search_fields = ('bob_id__bob_id',)
'''
@admin.register(Accion)
class AccionAdmin(admin.ModelAdmin):
    list_display = ('acc_descripcion',)
    actions = ['load']

    def ls(ruta):
        ls = []
        for arch in scandir(ruta):
            if arch.is_file():
                if splitext(arch.path)[0][-4:]!="_END":
                    ls.append({
                        'ruta' : abspath(arch.path),
                        'name': splitext(arch.path)[0],
                        'ext':splitext(arch.path)[1][1:]
                    })
        return ls    

    def load(self, request, queryset):
        if queryset[0].acc_descripcion=="CARGAR REMISIONES":
            files = ls(r'C:\Development\ZUBEX\ztela_version2\virtualextrusoras\extrusoras_v2\extrusoras_app\aqui')

            if files:
                conn = psycopg2.connect(database='control_final_v2',user='usr_extrusoras',password='usr_extrusoras', host='localhost')
                cur = conn.cursor()
                remisiones = []
                not_in = ""
                try:
                    for archivo in files:
                        with open(archivo['ruta'],'r', encoding='utf-16-le') as f:
                        #with open(archivo['ruta'],'r') as f:
                        #with open(archivo['ruta'],'r', encoding='utf-16-be') as f:
                            it=(lineas for i,lineas in enumerate(f) if i>=1)
                            for lineas in it:
                                rem_id = rem_nextid = pro_id = pro_nextid =  None
                                rem_nextid  = lineas.split("|")[0].strip() if len(lineas.split("|"))>0 else None
                                pro_nextid  = lineas.split("|")[1].strip() if len(lineas.split("|"))>1 else None
                                rem_id  = lineas.split("|")[2].strip() if len(lineas.split("|"))>2 and lineas.split("|")[2].strip()!=''  else None
                                pro_id  = lineas.split("|")[3].strip() if len(lineas.split("|"))>3 and lineas.split("|")[3].strip()!='' else None                    
                                if rem_id is not None and pro_id is not None:
                                    cur.execute("INSERT INTO remision(rem_id, rem_nextid, rem_estatus, pro_id, pro_nextid) VALUES (%(rem_id)s, %(rem_nextid)s, %(rem_estatus)s, %(pro_id)s, %(pro_nextid)s);",
                                    {'rem_id': rem_id,
                                    'rem_nextid':rem_nextid,
                                    'rem_estatus': 'E',
                                    'pro_id':pro_id,
                                    'pro_nextid': pro_nextid})
                                else:
                                    cur.execute("INSERT INTO remisiontmp(rem_id, pro_id) VALUES (%(rem_id)s, %(pro_id)s);",
                                    {'rem_id': rem_nextid,
                                    'pro_id':pro_nextid})
                        cur.execute("INSERT INTO remision (rem_id, pro_id,rem_estatus) SELECT rem_nextid, pro_nextid, 'E' FROM remision WHERE rem_nextid NOT IN (SELECT rem_id FROM remision);")
                        cur.execute("INSERT INTO remision (rem_id,pro_id,rem_estatus) SELECT rem_id, pro_id, 'E' FROM remisiontmp WHERE rem_id NOT IN (SELECT rem_id FROM remision WHERE rem_estatus='E');")
                        cur.execute("DELETE FROM remisiontmp;")
                        rename (archivo['ruta'],archivo['name']+"_END."+archivo['ext'])
                except psycopg2.Error as e:
                    print(e)
                conn.commit()
                conn.close()
                f.close()
        elif queryset[0].acc_descripcion=="CARGAR PRODUCTOS":
            print("fhifd")
    load.short_description = "Cargar"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
'''