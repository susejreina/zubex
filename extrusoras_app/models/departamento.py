from django.db import models

class Departamento(models.Model):
    dep_id = models.AutoField("Código", primary_key=True)
    dep_descripcion = models.CharField("Descripción",max_length=40)
    dep_bach_code = models.CharField("Código de Bachmaster", max_length=2,
                    blank=True, null=True)

    def __str__(self):
        return self.dep_descripcion

    class Meta:
        managed = True
        db_table = 'departamento'
