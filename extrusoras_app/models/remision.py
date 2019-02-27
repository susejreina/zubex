from django.db import models
from .producto import Producto

ESTATUS_REMISION = (
    ('E', 'En espera'),
    ('I', 'Iniciado'),
    ('F', 'Finalizado'),
)

class Remision(models.Model):
    rem_id = models.CharField("Número de Remisión",max_length=12,
            primary_key = True)
    pro_id = models.ForeignKey("Producto", on_delete=models.CASCADE,
             db_column="pro_id",
             related_name="remision_producto",
             verbose_name = "Producto")
    rem_nextid = models.CharField("Remisión Siguiente",max_length=12,
                blank=True, null=True)
    rem_estatus = models.CharField(max_length=1, choices=ESTATUS_REMISION,
                  default='E')
    pro_nextid = models.ForeignKey(Producto, on_delete=models.CASCADE,
             blank=True, null=True,
             db_column="pro_nextid",
             related_name="remision_nextproducto",
             verbose_name = "Producto Siguiente")

    def __str__(self):
        return self.rem_id

    def as_dict(self):
        return {
            'rem_id': self.rem_id,
            'pro_id': self.pro_id.pro_id,
            'pro_descripcion': self.pro_id.pro_descripcion,
            'pro_medida': self.pro_id.medida,
            'pro_color': self.pro_id.col_id.col_descripcion,
            'rem_nextid': self.rem_nextid if self.rem_nextid is not None else '',
        }

    class Meta:
        managed = True
        db_table = 'remision'
        verbose_name = 'Remisión'
        verbose_name_plural = 'Remisiones'

class RemisionTmp(models.Model):
    rem_id = models.CharField("Número de Remisión",max_length=12,
            primary_key = True)
    pro_id = models.ForeignKey("Producto", on_delete=models.CASCADE,
             db_column="pro_id",
             related_name="remisiontmp_producto",
             verbose_name = "Producto")

    def __str__(self):
        return self.rem_id

    def as_dict(self):
        return {
            'rem_id': self.rem_id,
            'pro_id': self.pro_id.pro_id,
        }

    class Meta:
        managed = True
        db_table = 'remisiontmp'
        verbose_name = 'Remisión Temporal'
        verbose_name_plural = 'Remisiones Temporales'