from django.db import models
from .departamento import Departamento
from .operario import Operario
from .bobina import Bobina

class Revision(models.Model):
    rev_id = models.BigAutoField("Código", primary_key=True)
    rev_fecha = models.DateField("Fecha")
    rev_hora = models.TimeField("Hora")
    dep_id = models.ForeignKey("Departamento", on_delete=models.CASCADE,
                                db_column="dep_id",
                                related_name="revision_departamento",
                                verbose_name = "Departamento")
    ope_id = models.ForeignKey("Operario", on_delete=models.CASCADE,
                                db_column="ope_id",
                                related_name="revision_operario",
                                verbose_name = "Operario")
    bob_id = models.ForeignKey("Bobina", on_delete=models.CASCADE,
                                db_column="bob_id",
                                related_name="revision_bobina",
                                verbose_name = "Bobina")

    def __str__(self):
        return self.rev_id

    def as_dict(self):
        return {
            'id': str(self.rev_id),
            'fecha': self.rev_fecha.strftime('%d-%m-%Y'),
            'hora': self.rev_hora.strftime('%H:%M:%S'),
            'bobina': self.bob_id.bob_id,
            'usuario': self.ope_id.ope_nombre,
        }

    class Meta:
        managed = True
        db_table = 'revision'
