from django.db import models
from .bobina import Bobina

class MedicionRectificado(models.Model):
    mer_id = models.BigAutoField("Código",primary_key=True)
    mer_numero = models.PositiveSmallIntegerField("Número de Medición")
    mer_fecha = models.DateField("Fecha")
    mer_hora = models.TimeField("Hora")
    mer_metro = models.FloatField("Metros")
    mer_ancho_plano = models.FloatField("Medición de Ancho Plano")
    mer_apariencia = models.CharField("Apariencia", max_length=1,
                    null=True, blank = True)
    bob_id = models.ForeignKey("Bobina", on_delete=models.CASCADE,
                                db_column="bob_id",
                                related_name="medrec_bobina",
                                verbose_name = "Bobina")
    ope_id = models.ForeignKey("Operario",
             on_delete=models.CASCADE,
             db_column="ope_id",
             related_name="rectificado_operario",
             verbose_name = "Operario que tomó la medida")

    def __str__(self):
        return str(self.mer_id) if self.mer_id is not None else ''

    def as_dict(self):
        return {
            'id': str(self.mer_id),
            'numero': str(self.mer_numero),
            'fecha': self.mer_fecha.strftime('%d-%m-%Y'),
            'hora': self.mer_hora.strftime('%H:%M:%S'),
            'metro': str(self.mer_metro),
            'ancho': str(self.mer_ancho_plano)+'"',
            'apariencia': self.mer_apariencia if self.mer_apariencia is not None else '',
        }

    def get_bobinaid(self): 
        return self.bob_id.bob_id
    get_bobinaid.short_description = 'Bobina' 
    get_bobinaid.admin_order_field = 'bobina__bob_id'

    class Meta:
        managed = True
        db_table = 'medicionrectificado'
        verbose_name_plural  = 'Mediciones del Proceso Rectificado'
