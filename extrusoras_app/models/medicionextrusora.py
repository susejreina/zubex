from django.db import models
from .bobina import Bobina
from .operario import Operario

class MedicionExtrusora(models.Model):
    mee_id = models.BigAutoField("Código",primary_key=True)
    mee_numero = models.PositiveSmallIntegerField("Número de Medición")
    mee_fecha = models.DateField("Fecha")
    mee_hora = models.TimeField("Hora")
    mee_metro = models.FloatField("Metros")
    mee_ancho_plano = models.CharField("Ancho Plano",max_length=8)
    mee_deslamine = models.CharField("Deslamine",max_length=1, null=True)
    mee_encog_hor = models.PositiveSmallIntegerField("Encogimiento horizontal",
                    null=True)
    mee_encog_ver = models.PositiveSmallIntegerField("Encogimiento vertical",
                    null=True)
    mee_calibre_frontal = models.SmallIntegerField("Calibre Frontal", null=True)
    mee_calibre_reverso = models.SmallIntegerField("Calibre Reverso", null=True)
    mee_temperatura = models.FloatField("Temperatura de tunel", null=True)
    bob_id = models.ForeignKey("Bobina", on_delete=models.CASCADE,
                                db_column="bob_id",
                                related_name="medext_bobina",
                                verbose_name = "Bobina")
    ope_id = models.ForeignKey("Operario",
             on_delete=models.CASCADE,
             db_column="ope_id",
             related_name="extrusion_operario",
             verbose_name = "Operario que tomó la medida")

    def __str__(self):
        return str(self.mee_id) if self.mee_id is not None else ''

    def as_dict(self):
        return {
            'id': str(self.mee_id),
            'numero': str(self.mee_numero),
            'fecha': self.mee_fecha.strftime('%d-%m-%Y'),
            'hora': self.mee_hora.strftime('%H:%M'),
            'metro': str(self.mee_metro),
            'ancho': str(self.mee_ancho_plano)+'"',
            'deslamine': str(self.mee_deslamine),
            'enc_hor': str(self.mee_encog_hor)+'%' if self.mee_encog_hor is not None else '',
            'enc_ver': str(self.mee_encog_ver)+'%' if self.mee_encog_ver is not None else '',
            'cal_fro': str(self.mee_calibre_frontal) if self.mee_calibre_frontal is not None else '',
            'cal_rev': str(self.mee_calibre_reverso) if self.mee_calibre_reverso is not None else '',
            'temperatura': str(self.mee_temperatura) if self.mee_temperatura is not None else '',
        }

    def get_bobinaid(self): 
        return self.bob_id.bob_id
    get_bobinaid.short_description = 'Bobina' 
    get_bobinaid.admin_order_field = 'bobina__bob_id'

    class Meta:
        managed = True
        db_table = 'medicionextrusora'
        verbose_name_plural  = 'Mediciones del Proceso Extrusión'
