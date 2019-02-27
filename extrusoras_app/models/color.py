from django.db import models

class Color(models.Model):
    col_id = models.AutoField("Código", primary_key=True)
    col_descripcion = models.CharField("Descripción", max_length=20)

    def __str__(self):
        return self.col_descripcion

    class Meta:
        managed = True
        db_table = 'color'
        verbose_name = "Color"
        verbose_name_plural = "Colores"
