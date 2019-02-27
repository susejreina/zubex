from django.db import models
from .bobina import Bobina
from .maquina import Maquina
from .operario import Operario
from .departamento import Departamento
from .remision import Remision

class CajaBobina(models.Model):
  bob_id =  models.ForeignKey("Bobina",
            on_delete=models.CASCADE,
            blank=True, null=True,
            db_column="bob_id",
            related_name="cajabobina_bobina",
            verbose_name = "Bobina")
  caj_id =  models.ForeignKey("Caja",
            on_delete=models.CASCADE,
            blank=True, null=True,
            db_column="caj_id",
            related_name="cajabobina_caja",
            verbose_name = "Caja")
  cbo_metros = models.FloatField("Metros", blank=True, null=True)

  def __str__(self):
      return self.cbo_metros

  def as_dict(self):
      return {
          'bobina': str(self.bob_id.bob_id),
          'caja': str(self.caj_id.caj_nro),
          'metros': str(self.cbo_metros) if self.cbo_metros is not None else '',
      }

  class Meta:
      managed = True
      db_table = 'cajabobina'
      verbose_name = "Bobina por Caja"
      verbose_name_plural = "Bobinas por Cajas"

class Caja(models.Model):
  caj_id = models.BigAutoField("Código",primary_key=True)
  caj_nro = models.IntegerField("Número de Caja")
  caj_peso = models.FloatField("Peso")
  rem_id =  models.ForeignKey("Remision",
            on_delete=models.CASCADE,
            blank=True, null=True,
            db_column="rem_id",
            related_name="caja_remision",
            verbose_name = "Remisión")
  dep_id = models.ForeignKey("Departamento", 
          on_delete=models.CASCADE,
          blank=True, null=True,
          db_column="dep_id",
          related_name="caja_departamento",
          verbose_name = "Departamento")
  ope_id = models.ForeignKey("Operario",
          on_delete=models.CASCADE,
          db_column="ope_id",
          related_name="caja_operario",
          verbose_name = "Operario que introdujo la caja")
  maq_id = models.ForeignKey("Maquina",
            on_delete=models.CASCADE,
            blank=True, null=True,
            db_column="maq_id",
            related_name="caja_maquina",
            verbose_name = "Maquina")
  bobinas = models.ManyToManyField(Bobina, through='CajaBobina')

  def as_dict(self):
      return {
          'id': str(self.caj_id),
          'caja': str(self.caj_nro),
          'peso': str(self.caj_peso),
          'departamento': str(self.dep_id),
          'operador': str(self.ope_id),
          'maquina': str(self.maq_id),
          'bobina': str(self.bobinas),
      }

  class Meta:
      managed = True
      db_table = 'caja'