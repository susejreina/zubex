from django.db import models
from .remision import Remision
from .maquina import Maquina
from .operario import Operario
from .departamento import Departamento

ESTATUS_BOBINA = (
    ('A', 'Asignada'),
    ('F', 'Finalizado'),
)
class BobinaMedida(models.Model):
    bob_metro = models.FloatField("Metros Totales", blank=True, null=True)
    bob_peso = models.FloatField("Peso", blank=True, null=True)
    bob_id =  models.ForeignKey("Bobina",
              on_delete=models.CASCADE,
              blank=True, null=True,
              db_column="bob_id",
              related_name="bobinamedida_bobina",
              verbose_name = "Bobina")
    dep_id = models.ForeignKey("Departamento", 
                                on_delete=models.CASCADE,
                                blank=True, null=True,
                                db_column="dep_id",
                                related_name="bobinamedida_departamento",
                                verbose_name = "Departamento")

    def as_dict(self):
        return {
            'peso': str(self.bob_peso),
            'metro': str(self.bob_metro),
            'departamento': str(self.dep_id),
            'bobina': str(self.bob_id.bob_id),
        }

    class Meta:
        managed = True
        verbose_name = "Metro/Peso Bobinas"
        verbose_name_plural = "Metro/Peso Bobinas"

class BobinaRemision(models.Model):
    rem_id =  models.ForeignKey("Remision",
              on_delete=models.CASCADE,
              blank=True, null=True,
              db_column="rem_id",
              related_name="bobinaremision_remision",
              verbose_name = "Remisión")
    bob_id =  models.ForeignKey("Bobina",
              on_delete=models.CASCADE,
              blank=True, null=True,
              db_column="bob_id",
              related_name="bobinaremision_bobina",
              verbose_name = "Bobina")
    maq_id = models.ForeignKey("Maquina",
             on_delete=models.CASCADE,
             blank=True, null=True,
             db_column="maq_id",
             related_name="bobinaremision_maquina",
             verbose_name = "Maquina")
    ope_id = models.ForeignKey("Operario",
             on_delete=models.CASCADE,
             blank=True, null=True,
             db_column="ope_id",
             related_name="bobinaremision_operario",
             verbose_name = "Operario que asignó la bobina")
    bor_fecha = models.DateField("Fecha", blank=True, null=True)
    bor_hora = models.TimeField("Hora", blank=True, null=True)
    bor_estatus = models.CharField(max_length=1, choices=ESTATUS_BOBINA,
              default='I')

    def __str__(self):
        return self.bor_estatus

    def as_dict(self):
        return {
            'id': str(self.id),
            'fecha': self.bor_fecha.strftime('%d-%m-%Y') if self.bor_fecha is not None else '',
            'hora': self.bor_hora.strftime('%H:%M:%S') if self.bor_hora is not None else '',
            'estatus': self.bor_estatus,
            'bobina': str(self.bob_id.bob_id) if self.bob_id is not None else '',
            'maquina': str(self.maq_id.maq_id) if self.maq_id is not None else '',
            'operador': str(self.ope_id.ope_id) if self.ope_id is not None else '',
            'remision': str(self.rem_id.rem_id) if self.rem_id is not None else '',
        }

    class Meta:
        managed = True
        db_table = 'bobinaremision'
        verbose_name = "Bobina Remisión"
        verbose_name_plural = "Bobinas Remisiones"

class Bobina(models.Model):
    bob_id = models.BigAutoField("Código",primary_key=True)
    bob_numero = models.IntegerField("Número de Bobina")
    bob_fecha = models.DateField("Fecha")
    bob_hora = models.TimeField("Hora")
    bob_lote = models.CharField("Lote",max_length=100, blank=True, null=True)
    bob_observacion = models.CharField("Observaciones", max_length=300,
                      blank=True, null=True)
    remisiones = models.ManyToManyField(Remision, through='BobinaRemision')

    def __str__(self):
        return str(self.bob_id)

    def as_dict(self):
        return {
            'id': str(self.bob_id),
            'numero': str(self.bob_numero),
            'fecha': self.bob_fecha.strftime('%d-%m-%Y'),
            'hora': self.bob_hora.strftime('%H:%M:%S'),
            'lote': self.bob_lote,
            'observacion': str(self.bob_observacion) if self.bob_observacion is not None else '',
        }

    class Meta:
        managed = True
        db_table = 'bobina'
