from django.db import models
from .bobina import Bobina
from .operario import Operario

class MedicionEmpaque(models.Model):
    mem_id = models.BigAutoField("Código",primary_key=True)
    mem_numero = models.PositiveSmallIntegerField("Número de Medición")
    mem_fecha = models.DateField("Fecha")
    mem_hora = models.TimeField("Hora")
    mem_metro = models.FloatField("Metros")
    mem_kilo = models.FloatField("Kilos")
    mem_apariencia = models.CharField("Apariencia", max_length=1,
                    null=True, blank = True)
    bob_id = models.ForeignKey("Bobina", on_delete=models.CASCADE,
                                db_column="bob_id",
                                related_name="medemp_bobina",
                                verbose_name = "Bobina")
    ope_id = models.ForeignKey("Operario",
             on_delete=models.CASCADE,
             db_column="ope_id",
             related_name="empaque_operario",
             verbose_name = "Operario que tomó la medida")

    def __str__(self):
        return str(self.mem_id) if self.mem_id is not None else ''

    def as_dict(self):
        return {
            'id': str(self.mem_id),
            'numero': str(self.mem_numero) if self.mem_numero is not None else '',
            'fecha': self.mem_fecha.strftime('%d-%m-%Y'),
            'hora': self.mem_hora.strftime('%H:%M:%S'),
            'metro': str(self.mem_metro) if self.mem_metro is not None else '',
            'kilo': str(self.mem_kilo) if self.mem_kilo is not None else '',
            'apariencia': self.mem_apariencia if self.mem_apariencia is not None else '',
        }

    def get_bobinaid(self): 
        return self.bob_id.bob_id
    get_bobinaid.short_description = 'Bobina' 
    get_bobinaid.admin_order_field = 'bobina__bob_id'

    class Meta:
        managed = True
        db_table = 'medicionempaque'
        verbose_name_plural  = 'Mediciones del Proceso Empaque'
