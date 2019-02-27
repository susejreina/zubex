from django.db import models
from django.contrib.auth.models import User
from .departamento import Departamento

TIPO_OPERARIO = (
    ('O', 'Operario'),
    ('S', 'Supervisor'),
    ('C', 'Calidad'),
)

class Operario(models.Model):
    ope_id = models.AutoField("Código", primary_key=True)
    ope_nombre = models.CharField("Nombre",max_length=50)
    ope_type = models.CharField("Tipo usuario", max_length=1, choices=TIPO_OPERARIO, default='O')
    dep_id = models.ManyToManyField("Departamento",
                                db_column="dep_id",
                                related_name="operario_departamento",
                                verbose_name = "Departamento")
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.ope_nombre