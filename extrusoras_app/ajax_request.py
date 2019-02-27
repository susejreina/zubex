import os
import json

from datetime import datetime, time, date, timedelta
from django.utils import timezone
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import authenticate
from django.db.models import Count, Value as V, CharField, DateTimeField, Max
from django.db.models.functions import Concat, Substr, ExtractHour, ExtractMinute, ExtractSecond
from django.views.decorators.csrf import csrf_exempt

from .models.bobina import Bobina, BobinaRemision, BobinaMedida
from .models.caja import Caja, CajaBobina
from .models.remision import Remision
from .models.operario import Operario
from .models.maquina import Maquina
from .models.medicionextrusora import MedicionExtrusora
from .models.medicionimpresion import MedicionImpresion
from .models.medicionbarnizado import MedicionBarnizado
from .models.medicionrectificado import MedicionRectificado
from .models.medicionrefilado import MedicionRefilado
from .models.medicioncorrugado import MedicionCorrugado
from .models.medicionempaque import MedicionEmpaque
from .models.medicionconversion import MedicionConversion
from .models.revision import Revision
from .models.departamento import Departamento
from .models.muestro import Muestro

@csrf_exempt
def nueva_bobina(request):
    data = {}
    # Look up the room from the channel session,biling if it doesn't exist
    
    rem_id = request.POST.get("rem_id")
    ope_id = request.POST.get("ope_id")
    maq_id = request.POST.get("maq_id")
    crear = False
    existe_bobina = BobinaRemision.objects.filter(maq_id=maq_id,rem_id=rem_id,bor_fecha__isnull=True,bor_hora__isnull=True).aggregate(max_bobid=Max('bob_id'))
    if existe_bobina['max_bobid'] is None:
        crear = True
    else:
        bob_id = existe_bobina['max_bobid']
        existe = BobinaMedida.objects.filter(bob_id=bob_id, dep_id=8).aggregate(qty=Count('bob_id'))
        if int(existe['qty']) > 0:
            crear = True

    if crear:
        numero = 1
        last_bobina = Bobina.objects.filter(remisiones__rem_id=rem_id).order_by('-bob_id').first()
        if last_bobina is not None:
            numero += last_bobina.bob_numero

        fecha = datetime.now().date().isoformat()

        bobina = Bobina(
            bob_numero = numero,
            bob_fecha=fecha,
            bob_hora=datetime.now().time().isoformat(),
        )
        bobina.save()

        if bobina is not None:
            bobinarem1 = BobinaRemision(
                bob_id=bobina,
                rem_id=Remision.objects.get(rem_id=rem_id),
                maq_id=Maquina.objects.get(maq_id=maq_id),
                ope_id=Operario.objects.get(ope_id=ope_id),
                bor_estatus='I',
            )
            bobinarem1.save()

        bobina.bob_lote = ""
        bobina.save()
        bob_id = bobina.bob_id

        if numero == 1:
            #Actualizamos el estatus de la Remisión
            Remision.objects.filter(rem_id=rem_id).update(rem_estatus='I')

    data["bobina"] = Bobina.objects.get(bob_id=bob_id).as_dict()
    data["mediciones"] = []
    if crear == False:
        list_mediciones = MedicionExtrusora.objects.filter(bob_id=bob_id)
        for b in list_mediciones:
            dic_mediciones = {}
            dic_mediciones = b.as_dict()
            data["mediciones"].append(dic_mediciones)
    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def guardar_bobina(request):
    data = {}
    # Look up the room from the channel session,biling if it doesn't exist
    bob_id = request.POST.get("bob_id")
    dep_id = request.POST.get("dep_id")
    maq_id = request.POST.get("maq_id")
    ope_id = request.POST.get("ope_id")

    objMaquina = Maquina.objects.get(maq_id=maq_id)
    
    operario = str(ope_id)
    if int(ope_id) < 10:
        operario = "0"+str(ope_id)
    hora = datetime.now().time().strftime("%H")
    turno = "3"
    if int(hora)>5 and int(hora)<13:
        turno = "1"
    elif int(hora)>12 and int(hora)<20:
        turno = "2"
    
    bobina = Bobina.objects.filter(bob_id=bob_id)
    lote = datetime.now().date().strftime('%m%d%y')+turno+str(objMaquina.maq_encabezado[-2:])+operario
    if int(dep_id) == 8:
        bob_observacion = request.POST.get("bob_observacion")
        bobina.update(bob_observacion=bob_observacion, bob_lote=lote)
    else:
        bobina.update(bob_lote=lote)

    bob_metro = request.POST.get("bob_metros")
    bob_peso = request.POST.get("bob_peso")
    bobinaMedida = BobinaMedida.objects.filter(bob_id=bob_id,dep_id=dep_id)
    if not bobinaMedida.count():
        bobinaMedida = BobinaMedida(
            bob_id=Bobina.objects.get(bob_id=bob_id),
            dep_id=Departamento.objects.get(dep_id=dep_id),
            bob_metro=bob_metro,
            bob_peso=bob_peso
        )
        bobinaMedida.save()
    else:
        bobinaMedida.update(bob_metro=bob_metro,bob_peso=bob_peso)

    data["guardado"] = {
        'save': True,
        'lote': lote,
    }

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def guardar_revision(request):
    data = {}
    # Look up the room from the channel session,biling if it doesn't exist
    bob_id = request.POST.get("bob_id")
    dep_id = request.POST.get("dep_id")
    ope_password = request.POST.get("ope_password")
    username = request.POST.get("username")

    user = authenticate(username=username, password=ope_password)
    if user is not None:
        operario =  Operario.objects.get(user=user)
        revision = Revision(
            rev_fecha = datetime.now().date().isoformat(),
            rev_hora = datetime.now().time().isoformat(),
            bob_id=Bobina.objects.get(bob_id=bob_id),
            dep_id=Departamento.objects.get(dep_id=dep_id),
            ope_id=operario
        )
        revision.save()

        key = revision.rev_id

        data["revision"] = Revision.objects.get(rev_id=key).as_dict()

        data["revision"].update({'encontrado': True})
    else:
        data["revision"] = {'encontrado': False}

    return HttpResponse(json.dumps(data), content_type='application/json')

"""
Función usada para buscar las órdenes de trabajo de todos los procesos,
menos el de extrusión
"""
@csrf_exempt
def serch_ordentrabajo(request):
    if 'almacen' in request.GET:
        q = Q(rem_nextid__contains=request.GET.get("search"))
        #q.add(Q(rem_estatus="F"),Q.AND)
        q.add(Q(pro_id__dep_id=request.GET.get("dep_id")),Q.AND)
        inner_rems = Remision.objects.filter(q).values('rem_nextid')
        q = Q(rem_id__in=inner_rems)
        q.add(Q(rem_estatus="E"),Q.AND)
        data = {}
        data["results"] = []

        list_remision = Remision.objects.filter(q).order_by("rem_id")

        for lr in list_remision:
            data["results"].append({'id':lr.rem_id,
                                    'text':lr.rem_id})
    else:
        q = Q(rem_id__contains=request.GET.get("search"))
        q.add(~Q(rem_estatus="F"),Q.AND)
        if 'dep_id' in request.GET:
            q.add(Q(pro_id__dep_id=request.GET.get("dep_id")),Q.AND)
            inner_rems = BobinaRemision.objects.filter(bor_estatus="A").order_by('rem_id').values('rem_id').distinct('rem_id')
            q.add(Q(rem_id__in=inner_rems),Q.AND)
        data = {}
        data["results"] = []

        list_remision = Remision.objects.filter(q).order_by("rem_id")

        for lr in list_remision:
            data["results"].append({'id':lr.rem_id,
                                    'text':lr.rem_id})
    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def get_remision(request):
    rem_id = request.POST.get("rem_id")
    try:
        data = {'encontrado': True}
        list_remision = Remision.objects.get(rem_id=rem_id).as_dict()
        data["remision"] = list_remision
        list_bobinas = BobinaRemision.objects.filter(rem_id=rem_id)
        data["bobinas"] = []
        for lb in list_bobinas:
            if lb.maq_id is None:
                data["bobinas"].append(str(lb.bob_id.bob_id)+"-"+str(lb.bob_id.bob_numero))
            else:
                data["bobinas"].append(str(lb.bob_id.bob_id)+"-"+str(lb.bob_id.bob_numero)+"-PROC")
    except ObjectDoesNotExist:
        data = {'encontrado': False}
    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def list_caja_remision(request):
    rem_id = request.POST.get("remision")
    dep_id = request.POST.get("departamento")

    data = []
    cajas = Caja.objects.filter(rem_id=rem_id,dep_id=dep_id)
    i = 0
    for c in cajas:
        idCaja = c.caj_id
        detail = {}
        detail["caja"] = c.as_dict()
        cajasbobinas = CajaBobina.objects.filter(caj_id=c.caj_id)
        detail["bobinas"] = []
        for cb in cajasbobinas:
            dic_cajasbobinas = {}
            dic_cajasbobinas = cb.as_dict()
            detail["bobinas"].append(dic_cajasbobinas)
        i = i + 1
        print(detail)
        data.append(detail)
    
    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def get_caja(request):
    id = request.POST.get("id")

    data = {}
    caja = Caja.objects.get(caj_id=id)
    data["caja"] = caja.as_dict()
    cajasbobinas = CajaBobina.objects.filter(caj_id=id)
    data["bobinas"] = []
    for c in cajasbobinas:
        dic_cajasbobinas = {}
        dic_cajasbobinas = c.as_dict()
        data["bobinas"].append(dic_cajasbobinas)
    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def listar_historico_bobina(request):
    bob_id = request.POST.get("bob_id")

    medidas = BobinaMedida.objects.filter(bob_id=bob_id)
    data = []
    for m in medidas:
        dic_bobinas = {}
        dic_bobinas = m.as_dict()
        data.append(dic_bobinas)
    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def listar_bobinas(request):
    rem_id = request.POST.get("rem_id")

    inner_bobinas = BobinaRemision.objects.filter(rem_id=rem_id).values('bob_id')
    list_bobinas = Bobina.objects.filter(remisiones__rem_id=rem_id).order_by('bob_id')
    
    data = []
    for b in list_bobinas:
        remisionBobinas = BobinaRemision.objects.get(bob_id=b.bob_id, rem_id=rem_id)
        dep_id = remisionBobinas.rem_id.pro_id.dep_id.dep_id
        peso = ''
        metro = 0
        try:
            bobina_medida = BobinaMedida.objects.get(bob_id=b.bob_id,dep_id=dep_id)
            kore = 0
            if remisionBobinas.rem_id.pro_id.pro_kore is not None:
                kore = remisionBobinas.rem_id.pro_id.pro_kore
            if bobina_medida.bob_peso is not None:
                peso = str(bobina_medida.bob_peso-kore)
            if bobina_medida.bob_metro is not None:
                metro = str(bobina_medida.bob_metro)
        except ObjectDoesNotExist:
            peso = ''
            metro = 0

        dic_bobinas = {}
        dic_bobinas = b.as_dict()
        dic_bobinas["metro"] = metro
        dic_bobinas["peso"] = peso
        data.append(dic_bobinas)

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def listar_mediciones(request):
    bob_id = request.POST.get("bob_id")

    list_mediciones = MedicionExtrusora.objects.filter(bob_id=bob_id)
    data = []
    for b in list_mediciones:
        dic_mediciones = {}
        dic_mediciones = b.as_dict()
        data.append(dic_mediciones)

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def listar_revisiones(request):
    bob_id = request.POST.get("bob_id")

    list_revisiones = Revision.objects.filter(bob_id=bob_id)
    data = []
    for b in list_revisiones:
        dic_revisiones = {}
        dic_revisiones = b.as_dict()
        data.append(dic_revisiones)

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def asignar_bobinas(request):
    data = {}
    bobinas_no = []
    bobinas_no_existe = []
    bobinas_si = []
    rem_id = request.POST.get("rem_id")
    ope_id = int(request.POST.get("ope_id"))
    bobinas = request.POST.get("bobinas")

    listBobina = bobinas.split("|")
    for b  in listBobina:
        try:
            bobina = Bobina.objects.get(bob_id=b)
            try:
                bobinarem = BobinaRemision.objects.get(bob_id=b, rem_id=rem_id)
                bobinas_no.append(b)
            except ObjectDoesNotExist:
                bobinas_si.append(b)
                bobinarem1 = BobinaRemision(
                    bob_id=Bobina.objects.get(bob_id=b),
                    rem_id=Remision.objects.get(rem_id=rem_id),
                    ope_id=Operario.objects.get(ope_id=ope_id),
                    bor_estatus='A',
                    bor_fecha = datetime.now().date().isoformat(),
                    bor_hora = datetime.now().time().isoformat(),
                )
                bobinarem1.save()
        except ObjectDoesNotExist:
            bobinas_no_existe.append(b)

    data["bobina"] = {'bobinas_no': bobinas_no,
                      'bobinas_si': bobinas_si,
                      'bobinas_no_existe': bobinas_no_existe,}

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def guardar_caja(request):
    # Look up the room from the channel session,biling if it doesn't exist

    if 'maq_id' not in request.POST:
        maquina = None
    else:
        maq_id = request.POST.get("maq_id")
        maquina = Maquina.objects.get(maq_id=maq_id)
    
    dep_id = request.POST.get("dep_id")
    ope_id = request.POST.get("ope_id")
    rem_id = request.POST.get("remision")

    nro = request.POST.get("nro")
    peso = request.POST.get("peso")

    id = request.POST.get("id_caja")
    if id == "0":
        caja = Caja(
            caj_nro = nro,
            caj_peso = peso,
            dep_id = Departamento.objects.get(dep_id=dep_id),
            ope_id = Operario.objects.get(ope_id=ope_id),
            rem_id = Remision.objects.get(rem_id=rem_id),
            maq_id = maquina
        )
    else:
        CajaBobina.objects.filter(caj_id=id).delete()
        caja = Caja.objects.get(caj_id=id)
        caja.caj_nro = nro
        caja.caj_peso = peso
        caja.dep_id = Departamento.objects.get(dep_id=dep_id)
        caja.ope_id = Operario.objects.get(ope_id=ope_id)
        caja.rem_id = Remision.objects.get(rem_id=rem_id)
        caja.maq_id = maquina
    caja.save()


    bobinas = request.POST.get("bobina")
    for b in bobinas.split("|"):
        cajabobina = CajaBobina(
            bob_id=Bobina.objects.get(bob_id=b.split(":")[0]),
            caj_id=caja,
            cbo_metros=b.split(":")[1]
        )
        cajabobina.save()

    return HttpResponse(json.dumps(caja.as_dict()), content_type='application/json')

@csrf_exempt
def guardar_medicion_extrusora(request):
    data = {}
    # Look up the room from the channel session,biling if it doesn't exist
    maq_id = request.POST.get("maq_id")
    rem_id = request.POST.get("rem_id")
    ope_id = request.POST.get("ope_id")
    bob_id = request.POST.get("bob_id")
    med_deslamine = request.POST.get("med_deslamine") if request.POST.get("med_deslamine")!='' else None
    med_metros = request.POST.get("med_metros").split("|")
    med_ancho = request.POST.get("med_ancho").split("|")
    med_enc_hor = request.POST.get("med_enc_hor") if request.POST.get("med_enc_hor") != '' else None
    med_enc_ver = request.POST.get("med_enc_ver") if request.POST.get("med_enc_ver") != '' else None
    med_cal_fro = request.POST.get("med_cal_fro") if request.POST.get("med_cal_fro") != '' else None
    med_cal_rev = request.POST.get("med_cal_rev") if request.POST.get("med_cal_rev") != '' else None
    med_temperatura = request.POST.get("med_temperatura") if request.POST.get("med_temperatura") != '' else None

    qtyM = len(med_metros)-1
    numero = 1
    objBobina = Bobina.objects.get(bob_id=bob_id)
    objOperario = Operario.objects.get(ope_id=ope_id)
    data["medicion"] = []
    for n in range(qtyM):
        last_medicion_bobina = MedicionExtrusora.objects.filter(bob_id=bob_id).order_by('mee_id').last()
        if last_medicion_bobina:
            numero = last_medicion_bobina.mee_numero + 1
        
        fecha = datetime.now().date().isoformat()
        hora = datetime.now().time().isoformat()

        if n > 0:
            med_deslamine = None
            med_enc_hor = None
            med_enc_ver = None
            med_cal_fro = None
            med_cal_rev = None
            med_temperatura = None

        medicionextrusora = MedicionExtrusora(
            mee_numero = numero,
            mee_fecha = fecha,
            mee_hora = hora,
            mee_metro = med_metros[n],
            mee_ancho_plano = med_ancho[n],
            mee_deslamine = med_deslamine,
            mee_encog_hor = med_enc_hor,
            mee_encog_ver = med_enc_ver,
            mee_calibre_frontal = med_cal_fro,
            mee_calibre_reverso = med_cal_rev,
            mee_temperatura = med_temperatura,
            bob_id=objBobina,
            ope_id = objOperario,
        )
        medicionextrusora.save()
        BobinaRemision.objects.filter(rem_id=rem_id,bob_id=bob_id).update(maq_id=maq_id)

        key = medicionextrusora.mee_id

        data["medicion"].append(MedicionExtrusora.objects.get(mee_id=key).as_dict())

    return HttpResponse(json.dumps(data), content_type='application/json')

#Hecho
@csrf_exempt
def guardar_medicion_barnizado(request):
    data = {}
    # Look up the room from the channel session,biling if it doesn't exist
    maq_id = request.POST.get("maq_id")
    ope_id = request.POST.get("ope_id")
    rem_id = request.POST.get("rem_id")
    bob_id = request.POST.get("bob_id")
    meb_metro = request.POST.get("meb_metro").split("|")
    meb_ancho_plano = request.POST.get("meb_ancho_plano").split("|")
    meb_dur_plas = request.POST.get("meb_dur_plas") if request.POST.get("meb_dur_plas")!='' else None
    meb_prue_cura = request.POST.get("meb_prue_cura") if request.POST.get("meb_prue_cura")!='' else None
    meb_cata_barniz = request.POST.get("meb_cata_barniz") if request.POST.get("meb_cata_barniz") != '' else None
    meb_hume_area = request.POST.get("meb_hume_area") if request.POST.get("meb_hume_area") != '' else None
    meb_vis1 = request.POST.get("meb_vis_1") if request.POST.get("meb_vis_1") != '' else None
    meb_vis2 = request.POST.get("meb_vis_2") if request.POST.get("meb_vis_2") != '' else None
    meb_temp_area = request.POST.get("meb_temp_area") if request.POST.get("meb_temp_area") != '' else None

    qtyM = len(meb_metro)-1
    numero = 1
    objBobina = Bobina.objects.get(bob_id=bob_id)
    objOperario = Operario.objects.get(ope_id=ope_id)
    data["medicion"] = []
    for n in range(qtyM):
        last_medicion_bobina = MedicionBarnizado.objects.filter(bob_id=bob_id).order_by('meb_id').last()
        if last_medicion_bobina:
            numero = last_medicion_bobina.meb_numero + 1

        fecha = datetime.now().date().isoformat()
        hora = datetime.now().time().isoformat()

        if n > 0:
            meb_dur_plas = None
            meb_cata_barniz = None
            meb_vis1 = None
            meb_vis2 = None
            meb_temp_area = None
            meb_hume_area = None
            meb_prue_cura = None

        medicionbarnizado = MedicionBarnizado(
            meb_numero = numero,
            meb_fecha = fecha,
            meb_hora = hora,
            meb_metro = meb_metro[n],
            meb_ancho_plano = meb_ancho_plano[n],
            meb_dur_plas = meb_dur_plas,
            meb_cata_barniz = meb_cata_barniz,
            meb_vis_1 = meb_vis1,
            meb_vis_2 = meb_vis2,
            meb_temp_area = meb_temp_area,
            meb_hume_area = meb_hume_area,
            meb_prue_cura = meb_prue_cura,
            bob_id=objBobina,
            ope_id = objOperario,
        )
        medicionbarnizado.save()
        BobinaRemision.objects.filter(rem_id=rem_id,bob_id=bob_id).update(maq_id=maq_id)
        key = medicionbarnizado.meb_id
        data["medicion"].append(MedicionBarnizado.objects.get(meb_id=key).as_dict())

    return HttpResponse(json.dumps(data), content_type='application/json')

#Hecho
@csrf_exempt
def guardar_medicion_impresion(request):
    data = {}
    # Look up the room from the channel session,biling if it doesn't exist
    maq_id = request.POST.get("maq_id")
    ope_id = request.POST.get("ope_id")
    rem_id = request.POST.get("rem_id")
    bob_id = request.POST.get("bob_id")
    mei_metro = request.POST.get("mei_metro")
    mei_ancho_plano = request.POST.get("mei_ancho_plano")
    mei_temp_infrarojo = request.POST.get("mei_temp_infrarojo") if request.POST.get("mei_temp_infrarojo") != '' else None
    mei_temp_tablero = request.POST.get("mei_temp_tablero") if request.POST.get("mei_temp_tablero") != '' else None
    mei_temp_area = request.POST.get("mei_temp_area") if request.POST.get("mei_temp_area") != '' else None
    mei_cat_blanca = request.POST.get("mei_cat_blanca") if request.POST.get("mei_cat_blanca") != '' else None
    mei_cat_color = request.POST.get("mei_cat_color") if request.POST.get("mei_cat_color") != '' else None
    mei_hume_area = request.POST.get("mei_hume_area") if request.POST.get("mei_hume_area") != '' else None
    mei_vis_1 = request.POST.get("mei_vis_1") if request.POST.get("mei_vis_1") != '' else None
    mei_vis_2 = request.POST.get("mei_vis_2") if request.POST.get("mei_vis_2") != '' else None
    mei_vis_3 = request.POST.get("mei_vis_3") if request.POST.get("mei_vis_3") != '' else None
    mei_vis_4 = request.POST.get("mei_vis_4") if request.POST.get("mei_vis_4") != '' else None
    mei_vis_5 = request.POST.get("mei_vis_5") if request.POST.get("mei_vis_5") != '' else None
    mei_vis_6 = request.POST.get("mei_vis_6") if request.POST.get("mei_vis_6") != '' else None
    mei_vis_7 = request.POST.get("mei_vis_7") if request.POST.get("mei_vis_7") != '' else None
    mei_vis_8 = request.POST.get("mei_vis_8") if request.POST.get("mei_vis_8") != '' else None

    numero = 1
    last_medicion_bobina = MedicionImpresion.objects.filter(bob_id=bob_id).order_by('mei_id').last()
    if last_medicion_bobina:
        numero = last_medicion_bobina.mei_numero + 1

    fecha = datetime.now().date().isoformat()
    hora = datetime.now().time().isoformat()

    medicionimpresion = MedicionImpresion(
        mei_numero = numero,
        mei_fecha = fecha,
        mei_hora = hora,
        mei_metro = mei_metro,
        mei_ancho_plano = mei_ancho_plano,
        mei_temp_infrarojo = mei_temp_infrarojo,
        mei_temp_tablero = mei_temp_tablero,
        mei_temp_area = mei_temp_area,
        mei_cat_blanca = mei_cat_blanca,
        mei_cat_color = mei_cat_color,
        mei_hume_area = mei_hume_area,
        mei_vis_1 = mei_vis_1,
        mei_vis_2 = mei_vis_2,
        mei_vis_3 = mei_vis_3,
        mei_vis_4 = mei_vis_4,
        mei_vis_5 = mei_vis_5,
        mei_vis_6 = mei_vis_6,
        mei_vis_7 = mei_vis_7,
        mei_vis_8 = mei_vis_8,
        bob_id=Bobina.objects.get(bob_id=bob_id),
        ope_id = Operario.objects.get(ope_id=ope_id),
    )
    medicionimpresion.save()
    BobinaRemision.objects.filter(rem_id=rem_id,bob_id=bob_id).update(maq_id=maq_id)

    key = medicionimpresion.mei_id;

    data["medicion"] = MedicionImpresion.objects.get(mei_id=key).as_dict()

    return HttpResponse(json.dumps(data), content_type='application/json')

#Hecho
@csrf_exempt
def guardar_medicion_rectificado(request):
    data = {}
    # Look up the room from the channel session,biling if it doesn't exist
    maq_id = request.POST.get("maq_id")
    ope_id = request.POST.get("ope_id")
    rem_id = request.POST.get("rem_id")
    bob_id = request.POST.get("bob_id")
    mer_metro = request.POST.get("mer_metro").split("|")
    mer_ancho_plano = request.POST.get("mer_ancho_plano").split("|")
    mer_apariencia = request.POST.get("mer_apariencia") if request.POST.get("mer_apariencia")!='' else None

    qtyM = len(mer_metro)-1
    numero = 1
    objBobina = Bobina.objects.get(bob_id=bob_id)
    objOperario = Operario.objects.get(ope_id=ope_id)
    data["medicion"] = []
    for n in range(qtyM):
        last_medicion_bobina = MedicionRectificado.objects.filter(bob_id=bob_id).order_by('mer_id').last()
        if last_medicion_bobina:
            numero = last_medicion_bobina.mer_numero + 1

        fecha = datetime.now().date().isoformat()
        hora = datetime.now().time().isoformat()

        if n > 0:
            mer_apariencia = None

        medicionrectificado = MedicionRectificado(
            mer_numero = numero,
            mer_fecha = fecha,
            mer_hora = hora,
            mer_metro = mer_metro[n],
            mer_ancho_plano = mer_ancho_plano[n],
            mer_apariencia = mer_apariencia,
            bob_id=objBobina,
            ope_id = objOperario,
        )
        medicionrectificado.save()
        BobinaRemision.objects.filter(rem_id=rem_id,bob_id=bob_id).update(maq_id=maq_id)
        key = medicionrectificado.mer_id
        data["medicion"].append(MedicionRectificado.objects.get(mer_id=key).as_dict())

    return HttpResponse(json.dumps(data), content_type='application/json')

#Hecho
@csrf_exempt
def guardar_medicion_refilado(request):
    data = {}
    # Look up the room from the channel session,biling if it doesn't exist
    maq_id = request.POST.get("maq_id")
    ope_id = request.POST.get("ope_id")
    rem_id = request.POST.get("rem_id")
    bob_id = request.POST.get("bob_id")
    mef_metro = request.POST.get("mef_metro").split("|")
    mef_ancho_plano = request.POST.get("mef_ancho_plano").split("|")

    qtyM = len(mef_metro)-1
    numero = 1
    objBobina = Bobina.objects.get(bob_id=bob_id)
    objOperario = Operario.objects.get(ope_id=ope_id)
    data["medicion"] = []
    for n in range(qtyM):
        last_medicion_bobina = MedicionRefilado.objects.filter(bob_id=bob_id).order_by('mef_id').last()
        if last_medicion_bobina:
            numero = last_medicion_bobina.mef_numero + 1

        fecha = datetime.now().date().isoformat()
        hora = datetime.now().time().isoformat()

        medicionrefilado = MedicionRefilado(
            mef_numero = numero,
            mef_fecha = fecha,
            mef_hora = hora,
            mef_metro = mef_metro[n],
            mef_ancho_plano = mef_ancho_plano[n],
            bob_id= objBobina,
            ope_id = objOperario,
        )
        medicionrefilado.save()
        BobinaRemision.objects.filter(rem_id=rem_id,bob_id=bob_id).update(maq_id=maq_id)
        key = medicionrefilado.mef_id
        data["medicion"].append(MedicionRefilado.objects.get(mef_id=key).as_dict())

    return HttpResponse(json.dumps(data), content_type='application/json')

#Hecho
@csrf_exempt
def guardar_medicion_corrugado(request):
    data = {}
    # Look up the room from the channel session,biling if it doesn't exist
    maq_id = request.POST.get("maq_id")
    ope_id = request.POST.get("ope_id")
    rem_id = request.POST.get("rem_id")
    bob_id = request.POST.get("bob_id")
    mec_metro = request.POST.get("mec_metro").split("|")
    mec_ancho_plano = request.POST.get("mec_ancho_plano").split("|")
    mec_apli_aceite = request.POST.get("mec_apli_aceite") if request.POST.get("mec_apli_aceite")!='' else None
    mec_alt_stick = request.POST.get("mec_alt_stick") if request.POST.get("mec_alt_stick")!='' else None
    mec_apariencia = request.POST.get("mec_apariencia") if request.POST.get("mec_apariencia")!='' else None
    mec_des_tinta = request.POST.get("mec_des_tinta") if request.POST.get("mec_des_tinta")!='' else None

    qtyM = len(mec_metro)-1
    numero = 1
    objBobina = Bobina.objects.get(bob_id=bob_id)
    objOperario = Operario.objects.get(ope_id=ope_id)
    data["medicion"] = []
    for n in range(qtyM):
        last_medicion_bobina = MedicionCorrugado.objects.filter(bob_id=bob_id).order_by('mec_id').last()
        if last_medicion_bobina:
            numero = last_medicion_bobina.mec_numero + 1

        fecha = datetime.now().date().isoformat()
        hora = datetime.now().time().isoformat()

        if n > 0:
            mec_apariencia = None
            mec_apli_aceite = None
            mec_alt_stick = None
            mec_des_tinta = None

        medicioncorrugado = MedicionCorrugado(
            mec_numero = numero,
            mec_fecha = fecha,
            mec_hora = hora,
            mec_metro = mec_metro[n],
            mec_ancho_plano = mec_ancho_plano[n],
            mec_apariencia = mec_apariencia,
            mec_apli_aceite = mec_apli_aceite,
            mec_alt_stick = mec_alt_stick,
            mec_des_tinta = mec_des_tinta,
            bob_id = objBobina,
            ope_id = objOperario,
        )
        medicioncorrugado.save()
        BobinaRemision.objects.filter(rem_id=rem_id,bob_id=bob_id).update(maq_id=maq_id)
        key = medicioncorrugado.mec_id
        data["medicion"].append(MedicionCorrugado.objects.get(mec_id=key).as_dict())

    return HttpResponse(json.dumps(data), content_type='application/json')

#Hecho
@csrf_exempt
def guardar_medicion_conversion(request):
    data = {}
    # Look up the room from the channel session,biling if it doesn't exist
    ope_id = request.POST.get("ope_id")
    maq_id = request.POST.get("maq_id")
    rem_id = request.POST.get("rem_id")
    bob_id = request.POST.get("bob_id")
    meo_metro = request.POST.get("meo_metro").split("|")
    meo_ancho_plano = request.POST.get("meo_ancho_plano").split("|")
    meo_piezas = request.POST.get("meo_piezas") if request.POST.get("meo_piezas")!='' else None
    meo_sell_izq = request.POST.get("meo_sell_izq") if request.POST.get("meo_sell_izq")!='' else None
    meo_sell_med = request.POST.get("meo_sell_med") if request.POST.get("meo_sell_med")!='' else None
    meo_sell_der = request.POST.get("meo_sell_der") if request.POST.get("meo_sell_der")!='' else None
    meo_fuer_sello = request.POST.get("meo_fuer_sello") if request.POST.get("meo_fuer_sello")!='' else None
    meo_calibre = request.POST.get("meo_calibre") if request.POST.get("meo_calibre")!='' else None
    meo_distancia = request.POST.get("meo_distancia") if request.POST.get("meo_distancia")!='' else None
    meo_burbuja = request.POST.get("meo_burbuja") if request.POST.get("meo_burbuja")!='' else None
    meo_apariencia = request.POST.get("meo_apariencia") if request.POST.get("meo_apariencia")!='' else None
    meo_largo = request.POST.get("meo_largo") if request.POST.get("meo_largo")!='' else None

    qtyM = len(meo_metro)-1
    numero = 1
    objBobina = Bobina.objects.get(bob_id=bob_id)
    objOperario = Operario.objects.get(ope_id=ope_id)
    data["medicion"] = []
    for n in range(qtyM):
        last_medicion_bobina = MedicionConversion.objects.filter(bob_id=bob_id).order_by('meo_id').last()
        if last_medicion_bobina:
            numero = last_medicion_bobina.meo_numero + 1

        fecha = datetime.now().date().isoformat()
        hora = datetime.now().time().isoformat()

        if n > 0:
            meo_piezas = None
            meo_sell_izq = None
            meo_sell_med = None
            meo_sell_der = None
            meo_fuer_sello = None
            meo_calibre = None
            meo_distancia = None
            meo_burbuja = None
            meo_apariencia = None
            meo_largo = None

        medicionconversion = MedicionConversion(
            meo_numero = numero,
            meo_fecha = fecha,
            meo_hora = hora,
            meo_metro = meo_metro[n],
            meo_ancho_plano = meo_ancho_plano[n],
            meo_piezas = meo_piezas,
            meo_sell_izq = meo_sell_izq,
            meo_sell_med = meo_sell_med,
            meo_sell_der = meo_sell_der,
            meo_fuer_sello = meo_fuer_sello,
            meo_calibre = meo_calibre,
            meo_distancia = meo_distancia,
            meo_burbuja = meo_burbuja,
            meo_apariencia = meo_apariencia,
            meo_largo = meo_largo,
            bob_id = objBobina,
            ope_id = objOperario,
        )
        medicionconversion.save()
        BobinaRemision.objects.filter(rem_id=rem_id,bob_id=bob_id).update(maq_id=maq_id)
        key = medicionconversion.meo_id
        data["medicion"].append(MedicionConversion.objects.get(meo_id=key).as_dict())

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def guardar_medicion_empaque(request):
    data = {}
    # Look up the room from the channel session,biling if it doesn't exist
    ope_id = request.POST.get("ope_id")
    rem_id = request.POST.get("rem_id")
    bob_id = request.POST.get("bob_id")
    mem_metro = request.POST.get("mem_metro")
    mem_kilo = request.POST.get("mem_kilo")
    mem_apariencia = request.POST.get("mem_apariencia") if request.POST.get("mem_apariencia")!='' else None

    numero = 1
    last_medicion_bobina = MedicionEmpaque.objects.filter(bob_id=bob_id).order_by('mem_id').last()
    if last_medicion_bobina:
        numero = last_medicion_bobina.mem_numero + 1

    fecha = datetime.now().date().isoformat()
    hora = datetime.now().time().isoformat()

    medicionempaque = MedicionEmpaque(
        mem_numero = numero,
        mem_fecha = fecha,
        mem_hora = hora,
        mem_metro = mem_metro,
        mem_kilo = mem_kilo,
        mem_apariencia = mem_apariencia,
        bob_id=Bobina.objects.get(bob_id=bob_id),
        ope_id = Operario.objects.get(ope_id=ope_id),
    )
    medicionempaque.save()

    key = medicionempaque.mem_id

    data["medicion"] = MedicionEmpaque.objects.get(mem_id=key).as_dict()

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def finalizar_orden_extrusora(request):
    rem_id = request.POST.get("rem_id")

    r = Remision.objects.get(rem_id=rem_id)
    r.rem_estatus='F'
    r.save()
    BobinaRemision.objects.filter(rem_id=rem_id).update(bor_estatus='F')
    data = {}
    data["finalizado"] = True

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def finalizar_orden_impresion(request):
    rem_id = request.POST.get("rem_id")
    r = Remision.objects.get(rem_id=rem_id)
    r.rem_estatus='F'
    r.save()
    inner_bobinas = BobinaRemision.objects.filter(rem_id=rem_id).values('bob_id')
    inner_bobinas = MedicionImpresion.objects.filter(bob_id__in=inner_bobinas).values('bob_id')
    BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas).update(bor_estatus="F")

    if r.rem_nextid is not None:
        if Remision.objects.get(rem_id=r.rem_nextid) is not None:
            list_bobinas = BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas)
            data = []
            for b in list_bobinas:
                dic_bobinas = {}
                dic_bobinas = b.as_dict()
                bobinarem1 = BobinaRemision(
                    bob_id=Bobina.objects.get(bob_id=dic_bobinas['bobina']),
                    rem_id=Remision.objects.get(rem_id=r.rem_nextid),
                    ope_id=Operario.objects.get(ope_id=dic_bobinas['operador']),
                    bor_estatus='A',
                    bor_fecha = datetime.now().date().isoformat(),
                    bor_hora = datetime.now().time().isoformat(),
                )
                bobinarem1.save()

    data = {}
    data["finalizado"] = True

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def finalizar_orden_barnizado(request):
    rem_id = request.POST.get("rem_id")
    r = Remision.objects.get(rem_id=rem_id)
    r.rem_estatus='F'
    r.save()
    inner_bobinas = BobinaRemision.objects.filter(rem_id=rem_id).values('bob_id')
    inner_bobinas = MedicionBarnizado.objects.filter(bob_id__in=inner_bobinas).values('bob_id')
    BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas).update(bor_estatus="F")
    if r.rem_nextid is not None:
        if Remision.objects.get(rem_id=r.rem_nextid) is not None:
            list_bobinas = BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas)
            data = []
            for b in list_bobinas:
                dic_bobinas = {}
                dic_bobinas = b.as_dict()
                bobinarem1 = BobinaRemision(
                    bob_id=Bobina.objects.get(bob_id=dic_bobinas['bobina']),
                    rem_id=Remision.objects.get(rem_id=r.rem_nextid),
                    ope_id=Operario.objects.get(ope_id=dic_bobinas['operador']),
                    bor_estatus='A',
                    bor_fecha = datetime.now().date().isoformat(),
                    bor_hora = datetime.now().time().isoformat(),
                )
                bobinarem1.save()
    data = {}
    data["finalizado"] = True

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def finalizar_orden_rectificado(request):
    rem_id = request.POST.get("rem_id")
    r = Remision.objects.get(rem_id=rem_id)
    r.rem_estatus='F'
    r.save()
    inner_bobinas = BobinaRemision.objects.filter(rem_id=rem_id).values('bob_id')
    inner_bobinas = MedicionRectificado.objects.filter(bob_id__in=inner_bobinas).values('bob_id')
    BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas).update(bor_estatus="F")
    if r.rem_nextid is not None:
        if Remision.objects.get(rem_id=r.rem_nextid) is not None:
            list_bobinas = BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas)
            data = []
            for b in list_bobinas:
                dic_bobinas = {}
                dic_bobinas = b.as_dict()
                bobinarem1 = BobinaRemision(
                    bob_id=Bobina.objects.get(bob_id=dic_bobinas['bobina']),
                    rem_id=Remision.objects.get(rem_id=r.rem_nextid),
                    ope_id=Operario.objects.get(ope_id=dic_bobinas['operador']),
                    bor_estatus='A',
                    bor_fecha = datetime.now().date().isoformat(),
                    bor_hora = datetime.now().time().isoformat(),
                )
                bobinarem1.save()
    data = {}
    data["finalizado"] = True

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def finalizar_orden_refilado(request):
    rem_id = request.POST.get("rem_id")
    r = Remision.objects.get(rem_id=rem_id)
    r.rem_estatus='F'
    r.save()
    inner_bobinas = BobinaRemision.objects.filter(rem_id=rem_id).values('bob_id')
    inner_bobinas = MedicionRefilado.objects.filter(bob_id__in=inner_bobinas).values('bob_id')
    BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas).update(bor_estatus="F")
    if r.rem_nextid is not None:
        if Remision.objects.get(rem_id=r.rem_nextid) is not None:
            list_bobinas = BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas)
            data = []
            for b in list_bobinas:
                dic_bobinas = {}
                dic_bobinas = b.as_dict()
                bobinarem1 = BobinaRemision(
                    bob_id=Bobina.objects.get(bob_id=dic_bobinas['bobina']),
                    rem_id=Remision.objects.get(rem_id=r.rem_nextid),
                    ope_id=Operario.objects.get(ope_id=dic_bobinas['operador']),
                    bor_estatus='A',
                    bor_fecha = datetime.now().date().isoformat(),
                    bor_hora = datetime.now().time().isoformat(),
                )
                bobinarem1.save()
    data = {}
    data["finalizado"] = True

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def finalizar_orden_corrugado(request):
    rem_id = request.POST.get("rem_id")
    r = Remision.objects.get(rem_id=rem_id)

    r.rem_estatus='F'
    r.save()
    inner_bobinas = BobinaRemision.objects.filter(rem_id=rem_id).values('bob_id')
    inner_bobinas = MedicionCorrugado.objects.filter(bob_id__in=inner_bobinas).values('bob_id')
    BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas).update(bor_estatus="F")

    i=0
    bobinasInvolved = BobinaRemision.objects.filter(rem_id=rem_id)
    for bI in bobinasInvolved:
        i=i+1
        bob = bI.bob_id.bob_id
        bobina_medida = BobinaMedida.objects.get(bob_id=bob, dep_id=3)
        kore = 0
        if bI.rem_id.pro_id.pro_kore is not None:
            kore = bI.rem_id.pro_id.pro_kore
        peso = ''
        if bobina_medida.bob_peso is not None:
            peso = str(bobina_medida.bob_peso-kore)+" Kg"
        medida = ''
        if bI.rem_id.pro_id.pro_medida is not None:
            medida = bI.rem_id.pro_id.pro_medida

        #Obtenemos los valores de las Mediciones
        fecha = datetime.now().date().strftime('%Y-%m-%d')
        fecha2 = datetime.now() + timedelta(seconds=i)
        hora = fecha2.strftime('%H%M%S')
        filename = settings.MEDIA_ROOT+'/txt_bachmaster/'+fecha+'_'+hora+'_Corrugado.txt'
        f = open (filename,'w')
        f.write("OP|LOTE|FECHA|HORA|USUARIO|IDBOBINA|MUESTRA|TESTCODE|TIPO|VALOR|MEDICION")
        muestro = Muestro.objects.filter(dep_id=3).order_by("mue_id")
        mediciones = MedicionCorrugado.objects.filter(bob_id=bob).order_by("mec_id")
        mec_medida = ""
        mec_apli_aceite = ""
        mec_alt_stick = ""
        mec_des_tinta = ""
        mec_apariencia = ""
        operario = ""
        for med in mediciones:
            mec_fecha = med.mec_fecha.strftime('%Y-%m-%d')
            mec_hora = med.mec_hora.strftime('%H:%M')
            mec_medida = med.mec_metro
            operario = med.ope_id.ope_nombre
            for mue in muestro:
                valido = False
                line = bI.rem_id.rem_id + "|" + bI.bob_id.bob_lote
                line += "|" + med.mec_fecha.strftime('%Y-%m-%d')
                line +=  "|" + med.mec_hora.strftime('%H:%M')
                line +=  "|" + str(med.ope_id.ope_id)
                line +=  "|" + str(bob)
                line +=  "|" + str(bI.bob_id.bob_numero)
                line +=  "|" + mue.mue_clave
                line +=  "|" + mue.mue_tipo
                if mue.mue_tipo != 'P' and med.__getattribute__(mue.mue_campo) is not None:
                    valido = True
                    line +=  "|" + str(med.__getattribute__(mue.mue_campo))
                    if mue.mue_campo == "mec_apli_aceite":
                        mec_apli_aceite = str(med.__getattribute__(mue.mue_campo))
                    if mue.mue_campo == "mec_alt_stick":
                        mec_alt_stick = str(med.__getattribute__(mue.mue_campo))
                elif med.__getattribute__(mue.mue_campo) is not None:
                    valido = True
                    line +=  "|" + 'Aprobar' if med.__getattribute__(mue.mue_campo) == "S" else  "|" +  'Rechazar'
                    if mue.mue_campo == "mec_apariencia":
                        mec_apariencia = 'Aprobar' if med.__getattribute__(mue.mue_campo) == "S" else 'Rechazar'
                    if mue.mue_campo == "mec_des_tinta":
                        mec_des_tinta = 'Aprobar' if med.__getattribute__(mue.mue_campo) == "S" else 'Rechazar'
                line +=  "|" + str(med.mec_metro)
                if valido:
                    f.write('\n' + line)
        f.close()

    if r.rem_nextid is not None:
        if Remision.objects.get(rem_id=r.rem_nextid) is not None:
            list_bobinas = BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas)
            data = []
            for b in list_bobinas:
                dic_bobinas = {}
                dic_bobinas = b.as_dict()
                bobinarem1 = BobinaRemision(
                    bob_id=Bobina.objects.get(bob_id=dic_bobinas['bobina']),
                    rem_id=Remision.objects.get(rem_id=r.rem_nextid),
                    ope_id=Operario.objects.get(ope_id=dic_bobinas['operador']),
                    bor_estatus='A',
                    bor_fecha = datetime.now().date().isoformat(),
                    bor_hora = datetime.now().time().isoformat(),
                )
                bobinarem1.save()
    data = {}
    data["finalizado"] = True

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def finalizar_orden_conversion(request):
    rem_id = request.POST.get("rem_id")
    r = Remision.objects.get(rem_id=rem_id)
    r.rem_estatus='F'
    r.save()
    inner_bobinas = BobinaRemision.objects.filter(rem_id=rem_id).values('bob_id')
    inner_bobinas = MedicionConversion.objects.filter(bob_id__in=inner_bobinas).values('bob_id')
    BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas).update(bor_estatus="F")

    i=0
    bobinasInvolved = BobinaRemision.objects.filter(rem_id=rem_id)
    for bI in bobinasInvolved:
        i=i+1
        bob = bI.bob_id.bob_id
        bobina_medida = BobinaMedida.objects.get(bob_id=bob, dep_id=1)
        kore = 0
        if bI.rem_id.pro_id.pro_kore is not None:
            kore = bI.rem_id.pro_id.pro_kore
        peso = ''
        if bobina_medida.bob_peso is not None:
            peso = str(bobina_medida.bob_peso-kore)+" Kg"
        medida = ''
        if bI.rem_id.pro_id.pro_medida is not None:
            medida = bI.rem_id.pro_id.pro_medida

        #Obtenemos los valores de las Mediciones
        fecha = datetime.now().date().strftime('%Y-%m-%d')
        fecha2 = datetime.now() + timedelta(seconds=i)
        hora = fecha2.strftime('%H%M%S')
        filename = settings.MEDIA_ROOT+'/txt_bachmaster/'+fecha+'_'+hora+'_Conversion.txt'
        f = open (filename,'w')
        f.write("OP|LOTE|FECHA|HORA|USUARIO|IDBOBINA|MUESTRA|TESTCODE|TIPO|VALOR|MEDICION")
        muestro = Muestro.objects.filter(dep_id=1).order_by("mue_id")
        mediciones = MedicionConversion.objects.filter(bob_id=bob).order_by("meo_id")
        mec_medida = ""
        mec_apli_aceite = ""
        mec_alt_stick = ""
        mec_des_tinta = ""
        mec_apariencia = ""
        operario = ""
        for med in mediciones:
            mec_fecha = med.meo_fecha.strftime('%Y-%m-%d')
            mec_hora = med.meo_hora.strftime('%H:%M')
            mec_medida = med.meo_metro
            operario = med.ope_id.ope_nombre
            for mue in muestro:
                valido = False
                line = bI.rem_id.rem_id + "|" + bI.bob_id.bob_lote
                line += "|" + med.meo_fecha.strftime('%Y-%m-%d')
                line +=  "|" + med.meo_hora.strftime('%H:%M')
                line +=  "|" + str(med.ope_id.ope_id)
                line +=  "|" + str(bob)
                line +=  "|" + str(bI.bob_id.bob_numero)
                line +=  "|" + mue.mue_clave
                line +=  "|" + mue.mue_tipo
                if mue.mue_tipo != 'P' and med.__getattribute__(mue.mue_campo) is not None:
                    valido = True
                    line +=  "|" + str(med.__getattribute__(mue.mue_campo))
                    if mue.mue_campo == "meo_fuer_sello":
                        meo_fuer_sello = str(med.__getattribute__(mue.mue_campo))
                    elif mue.mue_campo == "meo_calibre":
                        meo_calibre = str(med.__getattribute__(mue.mue_campo))
                elif med.__getattribute__(mue.mue_campo) is not None:
                    valido = True
                    line +=  "|" + 'Aprobar' if med.__getattribute__(mue.mue_campo) == "S" else  "|" +  'Rechazar'
                    if mue.mue_campo == "meo_apariencia":
                        meo_apariencia = 'Aprobar' if med.__getattribute__(mue.mue_campo) == "S" else 'Rechazar'
                    elif mue.mue_campo == "meo_burbuja":
                        meo_burbuja = 'Aprobar' if med.__getattribute__(mue.mue_campo) == "S" else 'Rechazar'
                line +=  "|" + str(med.meo_metro)
                if valido:
                    f.write('\n' + line)
        f.close()

    if r.rem_nextid is not None:
        if Remision.objects.get(rem_id=r.rem_nextid) is not None:
            list_bobinas = BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas)
            data = []
            for b in list_bobinas:
                dic_bobinas = {}
                dic_bobinas = b.as_dict()
                bobinarem1 = BobinaRemision(
                    bob_id=Bobina.objects.get(bob_id=dic_bobinas['bobina']),
                    rem_id=Remision.objects.get(rem_id=r.rem_nextid),
                    ope_id=Operario.objects.get(ope_id=dic_bobinas['operador']),
                    bor_estatus='A',
                    bor_fecha = datetime.now().date().isoformat(),
                    bor_hora = datetime.now().time().isoformat(),
                )
                bobinarem1.save()
    data = {}
    data["finalizado"] = True

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def finalizar_orden_empaque(request):
    rem_id = request.POST.get("rem_id")
    r = Remision.objects.get(rem_id=rem_id)
    r.rem_estatus='F'
    r.save()
    inner_bobinas = BobinaRemision.objects.filter(rem_id=rem_id).values('bob_id')
    inner_bobinas = MedicionEmpaque.objects.filter(bob_id__in=inner_bobinas).values('bob_id')
    BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas).update(bor_estatus="F")

    if r.rem_nextid is not None:
        if Remision.objects.get(rem_id=r.rem_nextid) is not None:
            list_bobinas = BobinaRemision.objects.filter(rem_id=rem_id,bob_id__in=inner_bobinas)
            data = []
            for b in list_bobinas:
                dic_bobinas = {}
                dic_bobinas = b.as_dict()
                bobinarem1 = BobinaRemision(
                    bob_id=Bobina.objects.get(bob_id=dic_bobinas['bobina']),
                    rem_id=Remision.objects.get(rem_id=r.rem_nextid),
                    ope_id=Operario.objects.get(ope_id=dic_bobinas['operador']),
                    bor_estatus='A',
                    bor_fecha = datetime.now().date().isoformat(),
                    bor_hora = datetime.now().time().isoformat(),
                )
                bobinarem1.save()
    data = {}
    data["finalizado"] = True

    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def reporte_bobina(request):
    dep_id = request.POST.get("dep_id")
    maq_id = request.POST.get("maq_id")
    start_date=None
    end_date = None
    filterDate = False
    if request.POST.get("start_date")!='':
        filterDate = True
        fecha, start_time = request.POST.get("start_date").split(' ')
        yearS,monthS,dayS = fecha.split('-')
        start_date = date(int(yearS),int(monthS),int(dayS))
        start_time = start_time + ":00"
    if request.POST.get("end_date")!='':
        filterDate = True
        fecha, end_time = request.POST.get("end_date").split(' ')
        yearE,monthE,dayE = fecha.split('-')
        end_date = date(int(yearE),int(monthE),int(dayE))
        end_time = end_time + ":00"

    data = {}
    data["results"] = []

    q = Q(pro_id__dep_id=dep_id)
    
    if start_date is not None or end_date is not None:
        if dep_id=="1": #Conversion
            if start_date is not None and end_date is not None:
                qdate = Q(meo_fecha__range=(start_date,end_date))
                qtime = Q(meo_hora__range=(start_time,end_time))
            elif start_date is not None:
                qdate = Q(meo_fecha__gte=start_date)
                qtime = Q(meo_hora__gte=start_time)
            elif end_date is not None:
                qdate = Q(meo_fecha__lte=end_date)
                qtime = Q(meo_hora__lte=end_time)
        elif dep_id=="2": #Empaque
            if start_date is not None and end_date is not None:
                qdate = Q(mem_fecha__range=(start_date,end_date))
                qtime = Q(mem_hora__range=(start_time,end_time))
            elif start_date is not None:
                qdate = Q(mem_fecha__gte=start_date)
                qtime = Q(mem_hora__gte=start_time)
            elif end_date is not None:
                qdate = Q(mem_fecha__lte=end_date)
                qtime = Q(mem_hora__lte=end_time)
        elif dep_id=="3": #Corrugado
            if start_date is not None and end_date is not None:
                qdate = Q(mec_fecha__range=(start_date,end_date))
                qtime = Q(mec_hora__range=(start_time,end_time))
            elif start_date is not None:
                qdate = Q(mec_fecha__gte=start_date)
                qtime = Q(mec_hora__gte=start_time)
            elif end_date is not None:
                qdate = Q(mec_fecha__lte=end_date)
                qtime = Q(mec_hora__lte=end_time)
        elif dep_id=="4": #Barnizado
            if start_date is not None and end_date is not None:
                qdate = Q(meb_fecha__range=(start_date,end_date))
                qtime = Q(meb_hora__range=(start_time,end_time))
            elif start_date is not None:
                qdate = Q(meb_fecha__gte=start_date)
                qtime = Q(meb_hora__gte=start_time)
            elif end_date is not None:
                qdate = Q(meb_fecha__lte=end_date)
                qtime = Q(meb_hora__lte=end_time)
        elif dep_id=="5": #Refilado
            if start_date is not None and end_date is not None:
                qdate = Q(mef_fecha__range=(start_date,end_date))
                qtime = Q(mef_hora__range=(start_time,end_time))
            elif start_date is not None:
                qdate = Q(mef_fecha__gte=start_date)
                qtime = Q(mef_hora__gte=start_time)
            elif end_date is not None:
                qdate = Q(mef_fecha__lte=end_date)
                qtime = Q(mef_hora__lte=end_time)
        elif dep_id=="6": #Rectificado
            if start_date is not None and end_date is not None:
                qdate = Q(mer_fecha__range=(start_date,end_date))
                qtime = Q(mer_hora__range=(start_time,end_time))
            elif start_date is not None:
                qdate = Q(mer_fecha__gte=start_date)
                qtime = Q(mer_hora__gte=start_time)
            elif end_date is not None:
                qdate = Q(mer_fecha__lte=end_date)
                qtime = Q(mer_hora__lte=end_time)
        elif dep_id=="7": #Impresion
            if start_date is not None and end_date is not None:
                qdate = Q(mei_fecha__range=(start_date,end_date))
                qtime = Q(mei_hora__range=(start_time,end_time))
            elif start_date is not None:
                qdate = Q(mei_fecha__gte=start_date)
                qtime = Q(mei_hora__gte=start_time)
            elif end_date is not None:
                qdate = Q(mei_fecha__lte=end_date)
                qtime = Q(mei_hora__lte=end_time)
        elif dep_id=="8": #Extrusion
            if start_date is not None and end_date is not None:
                qdate = Q(mee_fecha__range=(start_date,end_date))
                qtime = Q(mee_hora__range=(start_time,end_time))
            elif start_date is not None:
                qdate = Q(mee_fecha__gte=start_date)
                qtime = Q(mee_hora__gte=start_time)
            elif end_date is not None:
                qdate = Q(mee_fecha__lte=end_date)
                qtime = Q(mee_hora__lte=end_time)

    inner_remisiones = Remision.objects.filter(q)

    for remisiones in inner_remisiones:
        qbr = Q(rem_id=remisiones.rem_id)
        #qbr.add(Q(bor_estatus="F"),Q.AND)
        if maq_id != "0":
            qbr.add(Q(maq_id=maq_id),Q.AND)
        remision = remisiones.rem_id
        producto =  remisiones.pro_id.pro_id
        descripcion  =  remisiones.pro_id.pro_descripcion
        inner_bobinas = BobinaRemision.objects.filter(qbr).order_by('bob_id')
        for bobinas in inner_bobinas:
            load = False
            if bobinas.bob_id is not None:
                codigo = bobinas.bob_id.bob_id
                numero = bobinas.bob_id.bob_numero
                medida = bobinas.rem_id.pro_id.pro_medida
                try:
                    bobina_medida = BobinaMedida.objects.get(bob_id=codigo, dep_id=dep_id)
                    kore = 0
                    peso = 0
                    metro = 0
                    if bobinas.rem_id.pro_id.pro_kore is not None:
                        kore = bobinas.rem_id.pro_id.pro_kore
                    if bobina_medida.bob_peso is not None:
                        elpeso = round((bobina_medida.bob_peso - kore),2)
                        peso = str(elpeso)+" Kg"
                    if bobina_medida.bob_metro is not None:
                        metro = str(bobina_medida.bob_metro)
                except ObjectDoesNotExist:
                    kore = 0
                    peso = 0
                    metro = 0

                if dep_id=="1": #Conversion
                    qdate = ""
                    if start_date is not None and end_date is not None:
                        qdate = " AND CONCAT (meo_fecha,' ', meo_hora)>='"+str(start_date)+" "+str(start_time)+"' AND "
                        qdate = qdate + " CONCAT (meo_fecha,' ', meo_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    elif start_date is not None:
                        qdate = " AND CONCAT (meo_fecha,' ', meo_hora)>='"+str(start_date)+" "+str(start_time)+"'"
                    elif end_date is not None:
                        qdate = " AND CONCAT (meo_fecha,' ', meo_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    mediciones = MedicionConversion.objects.raw("SELECT * FROM medicionconversion WHERE bob_id="+str(codigo)+qdate+" LIMIT 1;")
                    if len(list(mediciones))>0:
                        load = True
                        fecha = mediciones[0].meo_fecha.strftime('%d/%m/%Y')
                elif dep_id=="2": #Empaque
                    qdate = ""
                    if start_date is not None and end_date is not None:
                        qdate = " AND CONCAT (mem_fecha,' ', mem_hora)>='"+str(start_date)+" "+str(start_time)+"' AND "
                        qdate = qdate + " CONCAT (mem_fecha,' ', mem_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    elif start_date is not None:
                        qdate = " AND CONCAT (mem_fecha,' ', mem_hora)>='"+str(start_date)+" "+str(start_time)+"'"
                    elif end_date is not None:
                        qdate = " AND CONCAT (mem_fecha,' ', mem_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    mediciones = MedicionEmpaque.objects.raw("SELECT * FROM medicionempaque WHERE bob_id="+str(codigo)+qdate+" LIMIT 1;")
                    if len(list(mediciones))>0:
                        load = True
                        fecha = mediciones[0].mem_fecha.strftime('%d/%m/%Y')
                elif dep_id=="3": #Corrugado
                    qdate = ""
                    if start_date is not None and end_date is not None:
                        qdate = " AND CONCAT (mec_fecha,' ', mec_hora)>='"+str(start_date)+" "+str(start_time)+"' AND "
                        qdate = qdate + " CONCAT (mec_fecha,' ', mec_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    elif start_date is not None:
                        qdate = " AND CONCAT (mec_fecha,' ', mec_hora)>='"+str(start_date)+" "+str(start_time)+"'"
                    elif end_date is not None:
                        qdate = " AND CONCAT (mec_fecha,' ', mec_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    mediciones = MedicionCorrugado.objects.raw("SELECT * FROM medicioncorrugado WHERE bob_id="+str(codigo)+qdate+" LIMIT 1;")
                    if len(list(mediciones))>0:
                        load = True
                        fecha = mediciones[0].mec_fecha.strftime('%d/%m/%Y')
                elif dep_id=="4": #Barnizado
                    qdate = ""
                    if start_date is not None and end_date is not None:
                        qdate = " AND CONCAT (meb_fecha,' ', meb_hora)>='"+str(start_date)+" "+str(start_time)+"' AND "
                        qdate = qdate + " CONCAT (meb_fecha,' ', meb_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    elif start_date is not None:
                        qdate = " AND CONCAT (meb_fecha,' ', mei_hora)>='"+str(start_date)+" "+str(start_time)+"'"
                    elif end_date is not None:
                        qdate = " AND CONCAT (meb_fecha,' ', meb_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    mediciones = MedicionBarnizado.objects.raw("SELECT * FROM medicionbarnizado WHERE bob_id="+str(codigo)+qdate+" LIMIT 1;")
                    if len(list(mediciones))>0:
                        load = True
                        fecha = mediciones[0].meb_fecha.strftime('%d/%m/%Y')
                elif dep_id=="5": #Refilado
                    qdate = ""
                    if start_date is not None and end_date is not None:
                        qdate = " AND CONCAT (mef_fecha,' ', mef_hora)>='"+str(start_date)+" "+str(start_time)+"' AND "
                        qdate = qdate + " CONCAT (mef_fecha,' ', mef_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    elif start_date is not None:
                        qdate = " AND CONCAT (mef_fecha,' ', mef_hora)>='"+str(start_date)+" "+str(start_time)+"'"
                    elif end_date is not None:
                        qdate = " AND CONCAT (mef_fecha,' ', mef_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    mediciones = MedicionRefilado.objects.raw("SELECT * FROM medicionrefilado WHERE bob_id="+str(codigo)+qdate+" LIMIT 1;")
                    if len(list(mediciones))>0:
                        load = True
                        fecha = mediciones[0].mef_fecha.strftime('%d/%m/%Y')
                elif dep_id=="6": #Rectificado
                    qdate = ""
                    if start_date is not None and end_date is not None:
                        qdate = " AND CONCAT (mer_fecha,' ', mer_hora)>='"+str(start_date)+" "+str(start_time)+"' AND "
                        qdate = qdate + " CONCAT (mer_fecha,' ', mer_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    elif start_date is not None:
                        qdate = " AND CONCAT (mer_fecha,' ', mer_hora)>='"+str(start_date)+" "+str(start_time)+"'"
                    elif end_date is not None:
                        qdate = " AND CONCAT (mer_fecha,' ', mer_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    mediciones = MedicionRectificado.objects.raw("SELECT * FROM medicionrectificado WHERE bob_id="+str(codigo)+qdate+" LIMIT 1;")
                    if len(list(mediciones))>0:
                        load = True
                        fecha = mediciones[0].mer_fecha.strftime('%d/%m/%Y')
                elif dep_id=="7": #Impresion
                    qdate = ""
                    if start_date is not None and end_date is not None:
                        qdate = " AND CONCAT (mei_fecha,' ', mei_hora)>='"+str(start_date)+" "+str(start_time)+"' AND "
                        qdate = qdate + " CONCAT (mei_fecha,' ', mei_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    elif start_date is not None:
                        qdate = " AND CONCAT (mei_fecha,' ', mei_hora)>='"+str(start_date)+" "+str(start_time)+"'"
                    elif end_date is not None:
                        qdate = " AND CONCAT (mei_fecha,' ', mei_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    mediciones = MedicionImpresion.objects.raw("SELECT * FROM medicionimpresion WHERE bob_id="+str(codigo)+qdate+" LIMIT 1;")
                    if len(list(mediciones))>0:
                        load = True
                        fecha = mediciones[0].mei_fecha.strftime('%d/%m/%Y')
                elif dep_id=="8": #Extrusión
                    qdate = ""
                    if start_date is not None and end_date is not None:
                        qdate = " AND CONCAT (mee_fecha,' ', mee_hora)>='"+str(start_date)+" "+str(start_time)+"' AND "
                        qdate = qdate + " CONCAT (mee_fecha,' ', mee_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    elif start_date is not None:
                        qdate = " AND CONCAT (mee_fecha,' ', mee_hora)>='"+str(start_date)+" "+str(start_time)+"'"
                    elif end_date is not None:
                        qdate = " AND CONCAT (mee_fecha,' ', mee_hora)<='"+str(end_date)+" "+str(end_time)+"'"
                    mediciones = MedicionExtrusora.objects.raw("SELECT * FROM medicionextrusora WHERE bob_id="+str(codigo)+qdate+" LIMIT 1;")
                    if len(list(mediciones))>0:
                        load = True
                        fecha = mediciones[0].mee_fecha.strftime('%d/%m/%Y')

                if load:
                    data["results"].append({
                        "fecha": fecha,
                        "id": codigo,
                        "descripcion": descripcion,
                        "remision": remision,
                        "codigo": producto,
                        "numero": numero,
                        "peso": peso,
                        "medida": medida,
                        "metro": metro,
                    })
    return HttpResponse(json.dumps(data), content_type='application/json')

@csrf_exempt
def remove_bobina(request):
    bob_id = request.POST.get("bob_id")
    Bobina.objects.filter(bob_id=bob_id).delete()
    BobinaRemision.objects.filter(bob_id=bob_id).delete()
    BobinaMedida.objects.filter(bob_id=bob_id).delete()

    return HttpResponse(json.dumps({'eliminado':True}), content_type='application/json')