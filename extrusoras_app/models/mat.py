from django.db import models

class Mat(models.Model):
    mat_id = models.AutoField("Código", primary_key=True)
    mat_descripcion = models.CharField("Nombre",max_length=30)

    def __str__(self):
        return self.mat_descripcion

    class Meta:
        managed = True
        db_table = 'mat'
        verbose_name_plural = 'Materiales'
        verbose_name = 'Material'
