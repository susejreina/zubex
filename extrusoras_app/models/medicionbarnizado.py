from django.db import models
from .bobina import Bobina
from .operario import Operario

class MedicionBarnizado(models.Model):
    meb_id = models.BigAutoField("Código",primary_key=True)
    meb_numero = models.PositiveSmallIntegerField("Número de Medición")
    meb_fecha = models.DateField("Fecha")
    meb_hora = models.TimeField("Hora")
    meb_metro = models.FloatField("Metros")
    meb_ancho_plano = models.FloatField("Medición de Ancho Plano")
    meb_dur_plas = models.CharField("Dureza de plasta", max_length=1,
                    null=True, blank = True)
    meb_cata_barniz = models.PositiveSmallIntegerField("Catalización tinta barniz",
                    null=True, blank = True)
    meb_vis_1 = models.PositiveSmallIntegerField("Viscosidad Unidad 1",
                    null=True, blank = True)
    meb_vis_2 = models.PositiveSmallIntegerField("Viscosidad Unidad 2",
                    null=True, blank = True)
    meb_temp_area = models.FloatField("Temperatura área", null=True,
                    blank = True)
    meb_hume_area = models.PositiveSmallIntegerField("Humedad del área",
                    null=True, blank = True)
    meb_prue_cura = models.CharField("Prueba de curado de tinta", max_length=1,
                    null=True, blank = True)
    bob_id = models.ForeignKey("Bobina", on_delete=models.CASCADE,
                                db_column="bob_id",
                                related_name="medbar_bobina",
                                verbose_name = "Bobina")
    ope_id = models.ForeignKey("Operario",
             on_delete=models.CASCADE,
             db_column="ope_id",
             related_name="barnizado_operario",
             verbose_name = "Operario que tomó la medida")

    def __str__(self):
        return str(self.meb_id) if self.meb_id is not None else ''

    def as_dict(self):
        return {
            'id': str(self.meb_id),
            'numero': str(self.meb_numero),
            'fecha': self.meb_fecha.strftime('%d-%m-%Y'),
            'hora': self.meb_hora.strftime('%H:%M:%S'),
            'metro': str(self.meb_metro),
            'ancho': str(self.meb_ancho_plano)+'"',
            'dur_plas': self.meb_dur_plas if self.meb_dur_plas is not None else '',
            'cata_barniz': str(self.meb_cata_barniz) if self.meb_cata_barniz is not None else '',
            'vis_1': str(self.meb_vis_1) if self.meb_vis_1 is not None else '',
            'vis_2': str(self.meb_vis_2) if self.meb_vis_2 is not None else '',
            'temp_area': str(self.meb_temp_area) if self.meb_temp_area is not None else '',
            'hume_area': str(self.meb_hume_area) if self.meb_hume_area is not None else '',
            'prue_cura': self.meb_prue_cura if self.meb_prue_cura is not None else ''
        }

    def get_bobinaid(self): 
        return self.bob_id.bob_id
    get_bobinaid.short_description = 'Bobina' 
    get_bobinaid.admin_order_field = 'bobina__bob_id'

    class Meta:
        managed = True
        db_table = 'medicionbarnizado'
        verbose_name_plural  = 'Mediciones del Proceso Barnizado'
