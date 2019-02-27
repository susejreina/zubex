from django.db import models
from .departamento import Departamento

class Muestro(models.Model):
    mue_id = models.AutoField("Código", primary_key=True)
    mue_clave =  models.CharField("Clave de Muestro",max_length=10)
    mue_descripcion = models.CharField("Nombre",max_length=100)
    mue_tipo = models.CharField("Nombre",max_length=100)
    mue_campo = models.CharField("Campo en la base de datos",max_length=100)
    dep_id = models.ForeignKey("Departamento", on_delete=models.CASCADE,
                                db_column="dep_id",
                                related_name="muestro_departamento",
                                verbose_name = "Departamento")

    def __str__(self):
        return self.mue_descripcion

    class Meta:
        managed = True
        db_table = 'muestro'
