from django.db import models
from .bobina import Bobina

class MedicionRefilado(models.Model):
    mef_id = models.BigAutoField("Código",primary_key=True)
    mef_numero = models.PositiveSmallIntegerField("Número de Medición")
    mef_fecha = models.DateField("Fecha")
    mef_hora = models.TimeField("Hora")
    mef_metro = models.FloatField("Metros")
    mef_ancho_plano = models.FloatField("Medición de Ancho Plano")
    bob_id = models.ForeignKey("Bobina", on_delete=models.CASCADE,
                                db_column="bob_id",
                                related_name="medref_bobina",
                                verbose_name = "Bobina")
    ope_id = models.ForeignKey("Operario",
             on_delete=models.CASCADE,
             db_column="ope_id",
             related_name="refilado_operario",
             verbose_name = "Operario que tomó la medida")

    def __str__(self):
        return str(self.mef_id) if self.mef_id is not None else ''

    def as_dict(self):
        return {
            'id': str(self.mef_id),
            'numero': str(self.mef_numero),
            'fecha': self.mef_fecha.strftime('%d-%m-%Y'),
            'hora': self.mef_hora.strftime('%H:%M:%S'),
            'metro': str(self.mef_metro),
            'ancho': str(self.mef_ancho_plano)+'"',
        }

    def get_bobinaid(self): 
        return self.bob_id.bob_id
    get_bobinaid.short_description = 'Bobina' 
    get_bobinaid.admin_order_field = 'bobina__bob_id'

    class Meta:
        managed = True
        db_table = 'medicionrefilado'
        verbose_name_plural  = 'Mediciones del Proceso Refilado'
