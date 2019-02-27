from django.db import models

from .departamento import Departamento

class Maquina(models.Model):
    maq_id = models.AutoField("Código", primary_key=True)
    maq_encabezado = models.CharField("Encabezado",max_length=6)
    maq_nombre = models.CharField("Nombre",max_length=40)
    maq_activa = models.BooleanField("Activa",default=True);
    dep_id =  models.ForeignKey("Departamento",
              on_delete=models.CASCADE,
              db_column="dep_id",
              related_name="maquina_departamento",
              verbose_name = "Departamento")

    def __str__(self):
        return self.maq_encabezado+" "+self.maq_nombre

    class Meta:
        managed = True
        db_table = 'maquina'
        verbose_name_plural = "Máquinas"
