from django.db import models

class UnidadMedida(models.Model):
    uni_id = models.AutoField("Código", primary_key=True)
    uni_descripcion = models.CharField("Descripción",max_length=30)
    uni_conversion = models.FloatField("Conversión", default=1)
    uni_abreviacion = models.CharField("Abreviación",max_length=5, blank=True)

    def __str__(self):
        return self.uni_descripcion

    class Meta:
        managed = True
        db_table = 'unidadmedida'
        verbose_name_plural = 'Unidades de Medida'
        verbose_name = 'Unidad de Medida'
