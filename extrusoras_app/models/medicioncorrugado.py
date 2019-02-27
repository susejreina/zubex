from django.db import models
from .bobina import Bobina
from .operario import Operario

class MedicionCorrugado(models.Model):
    mec_id = models.BigAutoField("Código",primary_key=True)
    mec_numero = models.PositiveSmallIntegerField("Número de Medición")
    mec_fecha = models.DateField("Fecha")
    mec_hora = models.TimeField("Hora")
    mec_metro = models.FloatField("Metros")
    mec_ancho_plano = models.FloatField("Medición de Ancho Plano")
    mec_apli_aceite = models.PositiveSmallIntegerField("Aplicación de Aceite",
                blank = True, null=True)
    mec_alt_stick = models.FloatField("Altitud del stick", null=True,
                blank = True)
    mec_des_tinta = models.CharField("Prueba de desprendimiento de tinta",
                max_length=1, null=True, blank = True)
    mec_apariencia = models.CharField("Apariencia", max_length=1,
                    null=True, blank = True)
    bob_id = models.ForeignKey("Bobina", on_delete=models.CASCADE,
                                db_column="bob_id",
                                related_name="medcor_bobina",
                                verbose_name = "Bobina")
    ope_id = models.ForeignKey("Operario",
             on_delete=models.CASCADE,
             db_column="ope_id",
             related_name="corrugado_operario",
             verbose_name = "Operario que tomó la medida")

    def __str__(self):
        return str(self.mec_id) if self.mec_id is not None else ''

    def as_dict(self):
        return {
            'id': str(self.mec_id),
            'numero': str(self.mec_numero),
            'fecha': self.mec_fecha.strftime('%d-%m-%Y'),
            'hora': self.mec_hora.strftime('%H:%M'),
            'metro': str(self.mec_metro),
            'ancho': str(self.mec_ancho_plano)+'"',
            'apli_aceite': str(self.mec_apli_aceite) if self.mec_apli_aceite is not None else '',
            'alt_stick': str(self.mec_alt_stick) if self.mec_alt_stick is not None else '',
            'des_tinta': self.mec_des_tinta if self.mec_des_tinta is not None else '',
            'apariencia': self.mec_apariencia if self.mec_apariencia is not None else '',
        }

    def get_bobinaid(self): 
        return self.bob_id.bob_id
    get_bobinaid.short_description = 'Bobina' 
    get_bobinaid.admin_order_field = 'bobina__bob_id'

    class Meta:
        managed = True
        db_table = 'medicioncorrugado'
        verbose_name_plural  = 'Mediciones del Proceso Corrugado'
