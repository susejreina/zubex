from django import forms
from django.contrib import admin

from .models.masivo import Masivo

class MasivoForm(forms.ModelForm):
  class Meta:
      model = Masivo
      exclude = ['mas_descripcion','mas_fecha']