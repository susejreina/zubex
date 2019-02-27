import sys
import psycopg2
from os import scandir, rename
from os.path import abspath, splitext

from django.db import models

from datetime import datetime, time, date

from .color import Color
from .departamento import Departamento
from .unidadmedida import UnidadMedida
from .producto import Producto
from .remision import Remision, RemisionTmp
from .mat import Mat

TIPO_MASIVO = (
    ('R', 'Remisiones'),
    ('P', 'Productos'),
)
class Masivo(models.Model):
    mas_id = models.AutoField("Código", primary_key=True)
    mas_descripcion = models.TextField("Contenido")
    mas_file = models.FileField("Archivo",upload_to='masivos/')
    mas_fecha = models.DateField("Fecha", auto_now_add=True)
    mas_type = models.CharField("Tipo archivo masivo", max_length=1, choices=TIPO_MASIVO, default='P')

    def __str__(self):
        return self.mas_fecha.strftime('%Y-%m-%d')

    def save(self, *args, **kwargs):
        uploadedfile = self.mas_file.read().decode("utf-8")
        if self.mas_type=="P":
            txtFile = str(uploadedfile)
            i = 0
            for line in txtFile.split('\n'):
                if i == 0:
                    i = 1
                    continue
                arrObj = line.split("|")
                idProducto = arrObj[0]
                desProducto = arrObj[1]
                desDepartamento = arrObj[2]
                desMaterial = arrObj[3]
                desColor = arrObj[4]
                anchoPlano = arrObj[5]
                medida = arrObj[6]
                peso = arrObj[7]
                kore = arrObj[8]
                guardado = True
                color = Color.objects.filter(col_descripcion=desColor)
                if not color.count():
                    color = Color(
                        col_descripcion = desColor,
                    )
                    color.save()
                else:
                    color = color[0]

                material = Mat.objects.filter(mat_descripcion=desMaterial)
                if not material.count():
                    material = Mat(
                        mat_descripcion = desMaterial,
                    )
                    material.save()
                else:
                    material = material[0]

                departamento = Departamento.objects.filter(dep_descripcion=desDepartamento)
                if not departamento.count():
                    departamento = Departamento(
                        dep_descripcion = desMaterial,
                    )
                    departamento.save()
                else:
                    departamento = departamento[0]

                producto = Producto.objects.filter(pro_id=idProducto)
                if not producto.count():
                    producto = Producto(
                        pro_id = idProducto,
                        pro_descripcion = desProducto,
                        pro_medida = medida,
                        col_id = color,
                        dep_id = departamento,
                        pro_kore = kore,
                        pro_kgs = peso,
                        mat_id = material
                    )
                    producto.save()
                else:
                    producto.update(
                        pro_descripcion = desProducto,
                        pro_medida = medida,
                        col_id = color,
                        dep_id = departamento,
                        pro_kore = kore,
                        pro_kgs = peso,
                        mat_id = material
                    )
            super().save(*args, **kwargs) 
        else:
            guardar = True
            txtFile = str(uploadedfile)
            i = 0
            for line in txtFile.split('\n'):
                if i == 0:
                    i = 1
                    continue
                rem_id = rem_nextid = pro_id = pro_nextid =  None
                rem_nextid  = line.split("|")[0].strip() if len(line.split("|"))>0 else None
                pro_nextid  = line.split("|")[1].strip() if len(line.split("|"))>1 else None
                rem_id  = line.split("|")[2].strip() if len(line.split("|"))>2 and line.split("|")[2].strip()!=''  else None
                pro_id  = line.split("|")[3].strip() if len(line.split("|"))>3 and line.split("|")[3].strip()!='' else None
                try:
                    if pro_id is not None:
                        producto = Producto.objects.get(pro_id=pro_id)
                    if pro_nextid is not None:
                        producto = Producto.objects.get(pro_id=pro_nextid)
                except Producto.DoesNotExist:
                    print("No existe el producto, debemos guardarlo ")
                    guardar = False
                    break
            if guardar:
                i = 0
                for line in txtFile.split('\n'):
                    if i == 0:
                        i = 1
                        continue
                    rem_id = rem_nextid = pro_id = pro_nextid =  None
                    rem_nextid  = line.split("|")[0].strip() if len(line.split("|"))>0 else None
                    pro_nextid  = line.split("|")[1].strip() if len(line.split("|"))>1 else None
                    rem_id  = line.split("|")[2].strip() if len(line.split("|"))>2 and line.split("|")[2].strip()!=''  else None
                    pro_id  = line.split("|")[3].strip() if len(line.split("|"))>3 and line.split("|")[3].strip()!='' else None
                    if rem_id is not None and pro_id is not None:
                        try:
                            producto = Producto.objects.get(pro_id=pro_id)
                            productoNext = Producto.objects.get(pro_id=pro_nextid)
                            remision = Remision(
                                rem_id = rem_id,
                                pro_id = producto,
                                rem_nextid = rem_nextid,
                                rem_estatus = 'E',
                                pro_nextid = productoNext,
                            )
                            remision.save()
                        except Producto.DoesNotExist:
                            continue
                    else:
                        try:
                            productoNext = Producto.objects.get(pro_id=pro_nextid)
                            remisiontemp = RemisionTmp(
                                rem_id = rem_nextid,
                                pro_id = productoNext,
                            )
                            remisiontemp.save()
                        except Producto.DoesNotExist:
                            continue
                for p in Remision.objects.raw('SELECT rem_id, pro_id, rem_nextid, pro_nextid FROM  remision WHERE rem_nextid NOT IN (SELECT rem_id FROM remision);'):
                    try:
                        producto = Producto.objects.get(pro_id=p.pro_nextid.pro_id)
                        remision = Remision(
                            rem_id = p.rem_nextid,
                            pro_id = producto,
                            rem_estatus = 'E',
                            rem_nextid = None,
                            pro_nextid = None,
                        )
                        remision.save()
                    except Producto.DoesNotExist:
                        print("No existe el producto, debemos guardarlo "+p.pro_nextid.pro_id)
                        continue
                for p in RemisionTmp.objects.raw("SELECT rem_id, pro_id FROM remisiontmp WHERE rem_id NOT IN (SELECT rem_id FROM remision WHERE rem_estatus='E');"):
                    try:
                        producto = Producto.objects.get(pro_id=p.pro_id.pro_id)
                        remision = Remision(
                            rem_id = p.rem_id,
                            pro_id = producto,
                            rem_estatus = 'E',
                            rem_nextid = None,
                            pro_nextid = None
                        )
                        remision.save()
                    except Producto.DoesNotExist:
                        print("No existe el producto, debemos guardarlo "+p.pro_id.pro_id)
                        continue
                RemisionTmp.objects.all().delete()
                super().save(*args, **kwargs) 

    class Meta:
        managed = True
        db_table = 'archivosmasivos'
        verbose_name_plural = 'Archivos masivos'
        verbose_name = 'Archivo Masivo'
