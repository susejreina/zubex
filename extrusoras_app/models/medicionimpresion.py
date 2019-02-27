from django.db import models
from .bobina import Bobina
from .operario import Operario

class MedicionImpresion(models.Model):
    mei_id = models.BigAutoField("Código",primary_key=True)
    mei_numero = models.PositiveSmallIntegerField("Número de Medición")
    mei_fecha = models.DateField("Fecha")
    mei_hora = models.TimeField("Hora")
    mei_metro = models.FloatField("Metros")
    mei_ancho_plano = models.FloatField("Medición de Ancho Plano")
    mei_cat_blanca = models.PositiveSmallIntegerField("Catalización tinta blanca",
                    null=True, blank = True)
    mei_cat_color = models.PositiveSmallIntegerField("Catalización tinta colores",
                    null=True, blank = True)
    mei_vis_1 = models.PositiveSmallIntegerField("Viscosidad Unidad 1",
                    null=True, blank = True)
    mei_vis_2 = models.PositiveSmallIntegerField("Viscosidad Unidad 2",
                    null=True, blank = True)
    mei_vis_3 = models.PositiveSmallIntegerField("Viscosidad Unidad 3",
                    null=True, blank = True)
    mei_vis_4 = models.PositiveSmallIntegerField("Viscosidad Unidad 4",
                    null=True, blank = True)
    mei_vis_5 = models.PositiveSmallIntegerField("Viscosidad Unidad 5",
                    null=True, blank = True)
    mei_vis_6 = models.PositiveSmallIntegerField("Viscosidad Unidad 6",
                    null=True, blank = True)
    mei_vis_7 = models.PositiveSmallIntegerField("Viscosidad Unidad 7",
                    null=True, blank = True)
    mei_vis_8 = models.PositiveSmallIntegerField("Viscosidad Unidad 8",
                    null=True, blank = True)
    mei_temp_infrarojo = models.FloatField("Temperatura infrarojo", null=True,
                    blank = True)
    mei_temp_tablero = models.FloatField("Temperatura tablero", null=True,
                    blank = True)
    mei_temp_area = models.FloatField("Temperatura área", null=True,
                    blank = True)
    mei_hume_area = models.PositiveSmallIntegerField("Humedad del área",
                    null=True, blank = True)
    bob_id = models.ForeignKey("Bobina", on_delete=models.CASCADE,
                                db_column="bob_id",
                                related_name="medimp_bobina",
                                verbose_name = "Bobina")
    ope_id = models.ForeignKey("Operario",
             on_delete=models.CASCADE,
             db_column="ope_id",
             related_name="impresion_operario",
             verbose_name = "Operario que tomó la medida")

    def __str__(self):
        return str(self.mei_id) if self.mei_id is not None else ''

    def as_dict(self):
        return {
            'id': str(self.mei_id),
            'numero': str(self.mei_numero),
            'fecha': self.mei_fecha.strftime('%d-%m-%Y'),
            'hora': self.mei_hora.strftime('%H:%M'),
            'metro': str(self.mei_metro),
            'ancho': str(self.mei_ancho_plano)+'"',
            'cat_blanca': str(self.mei_cat_blanca)+'%' if self.mei_cat_blanca is not None else '',
            'cat_color': str(self.mei_cat_color)+'%' if self.mei_cat_color is not None else '',
            'vis_1': str(self.mei_vis_1) if self.mei_vis_1 is not None else '',
            'vis_2': str(self.mei_vis_2) if self.mei_vis_2 is not None else '',
            'vis_3': str(self.mei_vis_3) if self.mei_vis_3 is not None else '',
            'vis_4': str(self.mei_vis_4) if self.mei_vis_4 is not None else '',
            'vis_5': str(self.mei_vis_5) if self.mei_vis_5 is not None else '',
            'vis_6': str(self.mei_vis_6) if self.mei_vis_6 is not None else '',
            'vis_7': str(self.mei_vis_7) if self.mei_vis_7 is not None else '',
            'vis_8': str(self.mei_vis_8) if self.mei_vis_8 is not None else '',
            'temp_infrarojo': str(self.mei_temp_infrarojo) if self.mei_temp_infrarojo is not None else '',
            'temp_tablero': str(self.mei_temp_tablero) if self.mei_temp_tablero is not None else '',
            'temp_area': str(self.mei_temp_area) if self.mei_temp_area is not None else '',
            'hume_area': str(self.mei_hume_area)+'%' if self.mei_hume_area is not None else '',
        }

    def get_bobinaid(self): 
        return self.bob_id.bob_id
    get_bobinaid.short_description = 'Bobina' 
    get_bobinaid.admin_order_field = 'bobina__bob_id'

    class Meta:
        managed = True
        db_table = 'medicionimpresion'
        verbose_name_plural  = 'Mediciones del Proceso Impresión'
