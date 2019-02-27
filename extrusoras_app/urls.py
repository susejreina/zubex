from django.urls import include, path

from . import views

urlpatterns = [
    #Generales
    path('ajax/guardarRevision/', views.guardar_revision),
    path('ajax/listarRevisiones/', views.listar_revisiones),
    path('ajax/searchOrdenTrabajo/', views.serch_ordentrabajo),
    path('ajax/getRemision/', views.get_remision),
    path('ajax/listarHistoricoBobina/', views.listar_historico_bobina), 
    #Extrusión
    path('extrusoras/', views.ProcesoExtrusora.as_view()),
    path('ajax/nuevaBobina/', views.nueva_bobina),
    path('ajax/removeBobina/', views.remove_bobina),
    path('ajax/guardarBobina/', views.guardar_bobina),
    path('ajax/guardarMedicionExtrusora/', views.guardar_medicion_extrusora),
    path('ajax/listarBobinas/', views.listar_bobinas),
    path('ajax/listarMediciones/', views.listar_mediciones),
    path('ajax/finalizarOrdenExtrusora/', views.finalizar_orden_extrusora),
    path('etiqueta_extrusora/<int:bob>/<str:rem>/',views.imprimir_extrusora),
    #Almacen
    path('almacen/', views.ProcesoAlmacen.as_view()),
    path('ajax/asignarBobinas/', views.asignar_bobinas),
    #Impresion
    path('impresion/', views.ProcesoImpresion.as_view()),
    path('ajax/guardarMedicionImpresion/', views.guardar_medicion_impresion),
    path('etiqueta_impresion/<int:bob>/<str:rem>/',views.imprimir_impresion),
    path('ajax/finalizarOrdenImpresion/', views.finalizar_orden_impresion),
    #Barnizado
    path('barnizado/', views.ProcesoBarnizado.as_view()),
    path('ajax/guardarMedicionBarnizado/', views.guardar_medicion_barnizado),
    path('etiqueta_barnizado/<int:bob>/<str:rem>/',views.imprimir_barnizado),
    path('ajax/finalizarOrdenBarnizado/', views.finalizar_orden_barnizado),
    #Refilado
    path('refilado/', views.ProcesoRefilado.as_view()),
    path('ajax/guardarMedicionRefilado/', views.guardar_medicion_refilado),
    path('etiqueta_refilado/<int:bob>/<str:rem>/',views.imprimir_refilado),
    path('ajax/finalizarOrdenRefilado/', views.finalizar_orden_refilado),
    #Rectificado
    path('rectificado/', views.ProcesoRectificado.as_view()),
    path('ajax/guardarMedicionRectificado/', views.guardar_medicion_rectificado),
    path('etiqueta_rectificado/<int:bob>/<str:rem>/',views.imprimir_rectificado),
    path('ajax/finalizarOrdenRectificado/', views.finalizar_orden_rectificado),
    #Estos son los últimos procesos
    #Conversion
    path('conversion/', views.ProcesoConversion.as_view()),
    path('ajax/guardarMedicionConversion/', views.guardar_medicion_conversion),
    path('etiqueta_conversion/<int:caj>/<str:rem>/',views.imprimir_conversion),
    path('ajax/finalizarOrdenConversion/', views.finalizar_orden_conversion),
    #Corrugado
    path('corrugado/', views.ProcesoCorrugado.as_view()),
    path('ajax/guardarMedicionCorrugado/', views.guardar_medicion_corrugado),
    path('etiqueta_corrugado/<int:caj>/<str:rem>/',views.imprimir_corrugado),
    path('ajax/finalizarOrdenCorrugado/', views.finalizar_orden_corrugado),
    #Empaque
    path('empaque/', views.ProcesoEmpaque.as_view()),
    path('ajax/guardarMedicionEmpaque/', views.guardar_medicion_empaque),
    path('etiqueta_empaque/<int:caj>/<str:rem>/',views.imprimir_empaque),
    path('ajax/finalizarOrdenEmpaque/', views.finalizar_orden_empaque),
    #Cajas
    path('ajax/guardarCajas/', views.guardar_caja),
    path('ajax/editarCajas/', views.get_caja),
    path('ajax/listarCajas/', views.list_caja_remision),
    
    #Reportes
    path('reportes/', views.Reportes.as_view()),
    path('reportes/estatusbobina/', views.ReporteEstatus.as_view()),
    path('reportes/bobina/', views.ReporteBobina.as_view()),
    path('ajax/searchReporteBobina/', views.reporte_bobina),
    path('reporte_bobinas_excel/',views.ReporteBobinasExcel.as_view()),
    path('reporte_estatus_excel/',views.ReporteEstatusExcel.as_view()),
]
