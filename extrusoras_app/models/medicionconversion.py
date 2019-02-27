from django.db import models
from .bobina import Bobina
from .operario import Operario

class MedicionConversion(models.Model):
    meo_id = models.BigAutoField("Código",primary_key=True)
    meo_numero = models.PositiveSmallIntegerField("Número de Medición")
    meo_fecha = models.DateField("Fecha")
    meo_hora = models.TimeField("Hora")
    meo_metro = models.FloatField("Metros")
    meo_ancho_plano = models.FloatField("Medición de Ancho Plano")
    meo_piezas = models.SmallIntegerField("Piezas", null=True, blank = True)
    meo_largo = models.CharField("Medición de Largo", max_length=1,
                    null=True, blank = True)
    meo_sell_izq = models.FloatField("Fuerza sello lateral izquierdo",
                null=True, blank = True)
    meo_sell_med = models.FloatField("Fuerza sello medio",
                null=True, blank = True)
    meo_sell_der = models.FloatField("Fuerza sello lateral derecho",
                null=True, blank = True)
    meo_distancia = models.CharField("Distancia de sello a impresión",
                max_length=1,  null=True, blank = True)
    meo_apariencia = models.CharField("Apariencia", max_length=1,
                    null=True, blank = True)
    meo_fuer_sello = models.FloatField("Medición de Fuerza de sello",
            null=True, blank = True)
    meo_calibre = models.SmallIntegerField("Medición de calibre",
                    null=True, blank = True)
    meo_burbuja = models.CharField("Prueba de burbuja", max_length=1,
                    null=True, blank = True)
    bob_id = models.ForeignKey("Bobina", on_delete=models.CASCADE,
                                db_column="bob_id",
                                related_name="medcon_bobina",
                                verbose_name = "Bobina")
    ope_id = models.ForeignKey("Operario",
             on_delete=models.CASCADE,
             db_column="ope_id",
             related_name="conversion_operario",
             verbose_name = "Operario que tomó la medida")

    def __str__(self):
        return str(self.meo_id) if self.meo_id is not None else ''

    def as_dict(self):
        return {
            'id': str(self.meo_id),
            'numero': str(self.meo_numero),
            'fecha': self.meo_fecha.strftime('%d-%m-%Y'),
            'hora': self.meo_hora.strftime('%H:%M'),
            'metro': str(self.meo_metro),
            'ancho': str(self.meo_ancho_plano)+'"',
            'piezas': str(self.meo_piezas) if self.meo_piezas is not None else '',
            'largo': self.meo_largo if self.meo_largo is not None else '',
            'sell_izq': str(self.meo_sell_izq) if self.meo_sell_izq is not None else '',
            'sell_med': str(self.meo_sell_med) if self.meo_sell_med is not None else '',
            'sell_der': str(self.meo_sell_der) if self.meo_sell_der is not None else '',
            'distancia': self.meo_distancia if self.meo_distancia is not None else '',
            'apariencia': self.meo_apariencia if self.meo_apariencia is not None else '',
            'fuer_sello': str(self.meo_fuer_sello) if self.meo_fuer_sello is not None else '',
            'calibre': str(self.meo_calibre) if self.meo_calibre is not None else '',
            'burbuja': self.meo_burbuja if self.meo_burbuja is not None else '',
        }

    def get_bobinaid(self): 
        return self.bob_id.bob_id
    get_bobinaid.short_description = 'Bobina' 
    get_bobinaid.admin_order_field = 'bobina__bob_id'

    class Meta:
        managed = True
        db_table = 'medicionconversion'
        verbose_name_plural  = 'Mediciones del Proceso Conversión'
