from django.db import models
from .color import Color
from .departamento import Departamento
from .unidadmedida import UnidadMedida
from .mat import Mat

class Producto(models.Model):
    pro_id = models.CharField("Código",max_length=30, primary_key=True)
    pro_descripcion = models.CharField("Descripción",max_length=100)
    pro_medida = models.CharField("Medida",max_length=15,blank=True,null=True)
    col_id = models.ForeignKey("Color", on_delete=models.CASCADE,
             blank=True,null=True,
             db_column="col_id",
             related_name="producto_color",
             verbose_name="Color")
    dep_id = models.ForeignKey("Departamento", on_delete=models.CASCADE,
                                db_column="dep_id",
                                related_name="producto_departamento",
                                verbose_name = "Departamento")
    pro_kore = models.FloatField("Kore",blank=True,null=True)
    pro_kgs = models.FloatField("Peso Kgs",blank=True,null=True)
    mat_id = models.ForeignKey("Mat", on_delete=models.CASCADE,
             blank=True,null=True,
             db_column="mat_id",
             related_name="producto_mat",
             verbose_name = "Mat")

    def __str__(self):
        return self.pro_id + str(self.pro_descripcion)

    @property
    def medida(self):
        pro_medida = self.pro_medida
        return pro_medida

    class Meta:
        managed = True
        db_table = 'producto'
