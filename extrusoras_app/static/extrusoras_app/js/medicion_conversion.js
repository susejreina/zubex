$(document).ready(function() {
	$('[name=msg_bobina],[name=msg_medicion],[name=msg_remision]').hide();
	$("#mimensaje").hide();
	let maq_id = $("#list_maquinas>li:first").attr("data-id");
	let maq_nombre = $("#list_maquinas>li:first").attr("data-nombre");
	$("#list_maquinas>li:first").addClass("current");
	$("#maq_id").val(maq_id);
	$('[name=divmaquina]:not(#maq_'+maq_id+')').hide();
	$("#title").text(maq_nombre);
	$("#list_maquinas>li").click(marcarMaquina);

	$('.js-rem-id').select2({
	  minimumInputLength: 3,
	  ajax: {
	    url: '/extrusoras_app/ajax/searchOrdenTrabajo/',
	    dataType: 'json',
			data: function (params) {
	      var query = {
	        search: params.term,
	        type: 'public',
					dep_id: 1,
	      }
	      return query;
	    }
	  }
	});

	$("[name=rem_id]").change(cargarDatosRemision);

	$("[name=bob_id]").on("keypress",getNroBobina);
	$("[name=bob_id]").on("focus",function(){$(this).val("");});

	$("[name=guardar_bobina]").on("click",function(e){e.preventDefault();guardarBobina();});
	$("[name=historico_bobina]").on("click",function(e){e.preventDefault();listarHistoricoBobinas($(this));});
	$("[name=guardar_mediciones]").on("click",function(e){e.preventDefault();guardarMedicion($(this));});
	$("[name=historial_medicion],[name=historial_revision]").hide();
	$("#modal_revision, #modal_confirmacion").modal('hide');
	$("[name=revision]").on("click",mostrarRevision);
	$("#guardar_revision").on("click",function(e){e.preventDefault();guardarRevision();});
	$("#modal_confirmacion").on("click","#cerrar_orden",function(e){e.preventDefault();cerrarProceso();});
	$("[name=finalizar_proceso]").on("click",function(e){e.preventDefault();finalizarProceso();});

	//Validaciones de tipo de dato
	$("[name=meo_piezas],[name=meo_calibre]").on("keypress",integerNumber);
	$("[name=meo_metro],[name=meo_ancho_plano],[name=meo_sell_izq],[name=meo_sell_med],[name=meo_sell_der],[name=meo_fuer_sello]").on("keypress",floatNumber);	
	$("[name=nro_caja],[name=id_caja_bobina],[name=metros]").on("keypress",integerNumber);
	$("[name=peso]").on("keypress",floatNumber);

	//Agregando las cajas
	$("[name=add_box]").on("click",addBobinaCaja);
	$("[name=save_caja]").on("click",saveCaja);
	$("[name=involved_bobinas]").on("click","[name=del_caja]",deleteBobinaCaja);
	$("[name=cajas]").on("click","[name=edit_caja]",editCajaBobina);
	$("[name=cajas]").on("click","[name=print_label_caja]",imprimeEtiqueta);

	//Habilitando campos
	$("[name=meo_metro],[name=meo_ancho_plano]").each(function(){
		if(($(this).attr("name")=="meo_metro" && $(this).attr("id").split("_")[3]!=1) || ($(this).attr("name")=="meo_ancho_plano" && $(this).attr("id").split("_")[4]!=1))
		{
			$(this).prop("disabled",true);
		}
	});
	$("[name=meo_ancho_plano]").on("blur",activarNuevoRegistro);	
});
function activarNuevoRegistro(){
	let qtyMediciones = 3;
	let nro = parseInt($(this).attr("id").split("_")[4]);
	let maq = $(this).attr("id").split("_")[3];
	if(nro<qtyMediciones){
		if($.trim($("#meo_metro_"+maq+"_"+nro).val())!="" && $.trim($("#meo_ancho_plano_"+maq+"_"+nro).val())!=""){
			nro = nro + 1;
			$("#meo_metro_"+maq+"_"+nro).prop("disabled",false);
			$("#meo_ancho_plano_"+maq+"_"+nro).prop("disabled",false);
			if(nro>2){
				$("#meo_metro_"+maq+"_"+nro).focus();
			}
		}
	}
}
function imprimeEtiqueta(){
	let maq = $("#maq_id").val();
	let caja = $(this).attr("id").split("_")[3];
	window.open('/extrusoras_app/etiqueta_conversion/'+caja+'/'+$.trim($('#rem_id_'+maq).val())+'/','etiquetaConversion','toolbar=yes,location=yes,status=yes');
}
function listarCajas(){
	let maq = $("#maq_id").val();
	$.ajax({
		url: '/extrusoras_app/ajax/listarCajas/',
		dataType: 'json',
		type: 'POST',
		data:{
			'departamento': 1,
			'remision': $('#rem_id_'+maq).val(),
		},
		success: function (data) {
			for(i=0;i<data.length;i++){
				rw = addRowCaja(data[i]["caja"]["id"],data[i]["caja"]["caja"]);
				$('#bobinas_por_cajas_'+maq).append(rw);
			}
		}
	});
}
function editCajaBobina(){
	let maq = $("#maq_id").val();
	let idCaja = $(this).attr("id").split("_")[2];
	$.ajax({
		url: '/extrusoras_app/ajax/editarCajas/',
		dataType: 'json',
		type: 'POST',
		data:{
			'id': idCaja,
		},
		success: function (data) {
			$('#id_caja_'+maq).val(data.caja.id);
			$('#nro_caja_'+maq).val(data.caja.caja);
			$('#peso_'+maq).val(data.caja.peso);
			for(i=0;i<data.bobinas.length;i++){
				let li = addRowBobinaCaja(data.bobinas[i]["bobina"],data.bobinas[i]["metros"]);
				$('#bobinas_involved_'+maq).append(li);
			}
			$('#bobinas_por_cajas_${maq} > tbody > #cjb_${idCaja}').remove();
		}
	});
}
function deleteBobinaCaja(){
	$(this).parents("li").remove();
}
function saveCaja(){
	let maq = $("#maq_id").val();
	if($.trim($('#nro_caja_'+maq).val())==""){
		showMessage('msg_add_box_'+maq,"Debe indicar el número de la caja!","alert-warning");
	}else if($.trim($('#peso_'+maq).val())==""){
		showMessage('msg_add_box_'+maq,"Debe indicar el peso de la caja!","alert-warning");
	}else if($('#bobinas_involved_'+maq+'>li').length<=0){
		showMessage('msg_add_box_'+maq,"Debe indicar las bobinas involucradas!","alert-warning");
	}else if($('#rem_id_'+maq).val()==null){
		showMessage('msg_add_box_'+maq,"Seleccione la Orden de Trabajo!","alert-warning");
	}else if($.trim($('#ope_id_'+maq).val())=="0"){
		showMessage('msg_add_box_'+maq,"Seleccione el Operario!","alert-warning");
	}else{
		let bobinas = "";
		$('#bobinas_involved_'+maq+'>li').each(function(){
			bobinas += $(this).attr("data-id")+":"+$(this).attr("data-metro")+"|";
		});
		bobinas = bobinas.substring(0,bobinas.length-1);
		$.ajax({
			url: '/extrusoras_app/ajax/guardarCajas/',
			dataType: 'json',
			type: 'POST',
			data:{
				'dep_id': 1,
				'id_caja': $('#id_caja_'+maq).val(),
				'ope_id': $('#ope_id_'+maq).val(),
				'nro': $('#nro_caja_'+maq).val(),
				'peso': $('#peso_'+maq).val(),
				'remision': $('#rem_id_'+maq).val(),
				'bobina': bobinas,
				'maq_id': maq,
			},
			success: function (data) {
				showMessage('msg_add_box_'+maq,"Se ha almacenado la caja correctamente!","alert-success");
				rw = addRowCaja(data.id,data.caja);
				$('#bobinas_por_cajas_'+maq).append(rw);
				$('#id_caja_'+maq).val("0");
				$('#nro_caja_'+maq+', #peso_'+maq).val("");
				$('#id_caja_bobina_'+maq+', #metros_'+maq).val("");
				$('#bobinas_involved_'+maq+'>li').each(function(){
					$(this).remove();
				});
			}
		});
	}
}
function addRowCaja(id,caja){
	let rw = '<tr id="cjb_'+id+'">';
	rw += '<td scope="row">'+caja+'</td>';
	rw += '<td><button id="print_label_caja_'+id+'" name="print_label_caja" class="btn btn-default grey-box btn-block mb15" type="button">Imprimir Etiqueta Caja</button></td>';
	rw += '<td><button id="edit_caja_'+id+'" name="edit_caja" class="btn btn-default grey-box btn-block mb15" type="button">Editar Caja</button></td>';
	rw += '</tr>';
	return rw;
}
function addBobinaCaja(){
	let maq = $("#maq_id").val();
	if($('#rem_id_'+maq).val()==null){
		showMessage("msg_add_box","Seleccione la Orden de Trabajo!","alert-warning");
	}else if($.trim($('#id_caja_bobina_'+maq).val())==""){
		showMessage('msg_add_box_'+maq,"Debe indicar el ID de la bobina!","alert-warning");
	}else if($.trim($('#metros_'+maq).val())==""){
		showMessage('msg_add_box_'+maq,"Debe indicar la cantidad de piezas de la bobina!","alert-warning");
	}else{
		let $list_bobinas = $('#list_bobinas_'+maq).val().split(",");
		let found = false;
		for($i=0;$i<$list_bobinas.length;$i++){
			$l = $list_bobinas[$i].split("-");
			if($.trim($('#id_caja_bobina_'+maq).val())==$l[0]){
				found = true;
				break;
			}
		}
		if(found==false){
			showMessage('msg_add_box_'+maq,"El número de Bobina "+$('#id_caja_bobina_'+maq).val()+" no ha sido asignada a esta Orden de Trabajo!","alert-danger");
		}else{
			var encontrado = false;
			$('#bobinas_involved_'+maq+'>li').each(function(){
				if($(this).attr("data-id")==$('#id_caja_bobina_'+maq).val()){
					encontrado = true;
					return;
				}
			});
			if(encontrado==false){
				let id = $('#id_caja_bobina_'+maq).val();
				let metros = $('#metros_'+maq).val();
				let li = addRowBobinaCaja(id,metros,maq);
				$('#bobinas_involved_'+maq).append(li);
				$('#id_caja_bobina_'+maq).val("");
				$('#metros_'+maq).val("");
			}else{
				showMessage('msg_add_box_'+maq,"La bobina ya se había asignado a la caja!","alert-warning");
			}
		}

	}
}
function addRowBobinaCaja(id,metros,maq){
	let li = '<li data-id="'+id+'" data-metro="'+metros+'">';
	li += id;
	li += '&nbsp;<img name="del_caja" id="del_caja_'+maq+'_'+id+'" src="/static/extrusoras_app/img/trash.png" width="17" height="17" alt="Eliminar Bobina" title="Eliminar Bobina"/>';
	li += '</li>';	
	return li;
}
function getNroBobina(e){
	let ascii = e.keyCode;
	if(ascii==13){
		let maq = $("#maq_id").val();
		$('#historial_medicion_'+maq+' #tabla_historial_medicion,#historial_revision_'+maq+' #tabla_historial_revision').html("");
		$('#historial_medicion_'+maq+',#historial_revision_'+maq).hide();
		let v = validarBobina(maq);
		return v;
	}
}
function guardarBobina(){
	let maq = $("#maq_id").val();
	if($.trim($('#bob_id_'+maq).val())!="" && $.trim($('#bob_id_'+maq).val())!="0"){
		if($.trim($('#bob_metro_imp_'+maq).val())=="" || $.trim($('#bob_peso_imp_'+maq).val())==""){
				showMessage('msg_bobina_'+maq,"Debe indicar los metros y el peso de la bobina.","alert-warning");
				return false;
		}
		let intFields = ['#bob_metro_imp_'+maq, '#bob_peso_imp_'+maq];
		let desFields = ["Los metros totales","El peso"];
		let msg = "";
		for($i=0;$i<intFields.length;$i++){
			validado = validateNumber($(intFields[$i]));
			if (validado){
				msg = desFields[$i];
				break;
			}
		}
		if(validado){
			showMessage('msg_bobina_'+maq,msg+" debe ser numérico!","alert-warning");
			return false;
		}
		$.ajax({
			url: '/extrusoras_app/ajax/guardarBobina/',
			dataType: 'json',
			type: 'POST',
			data:{
				'maq_id': maq,
				'ope_id': $('#ope_id_'+maq).val(),
				'bob_id': $('#bob_id_'+maq).val(),
				'bob_metros': $('#bob_metros_'+maq).val(),
				'bob_peso': $('#bob_peso_'+maq).val(),
				'bob_observacion': $('#bob_observacion_'+maq).val(),
				'dep_id': 1,
			},
			success: function (data) {
				if(data["guardado"]){
					$("#bobinaGuardada_"+maq).val("si");
					showMessage('msg_bobina_'+maq,"Se ha almacenado la Bobina correctamente!","alert-success");
					$('html, body').animate({
						scrollTop: $('#msg_bobina_'+maq).offset().top
					}, 1500);
					$('#bob_lote_'+maq).val(data["guardado"]["lote"]);
				}else{
					showMessage('msg_bobina_'+maq,"Problemas al almacenar la Bobina. Verifique los datos e inténtelo nuevamente!","alert-danger");
					$('html, body').animate({
						scrollTop: $('#msg_bobina_'+maq).offset().top
					}, 1500);
				}
			}
		});
	}else{
		showMessage('msg_bobina_'+maq,"Debe haber creado una Bobina!","alert-warning");
	}
}
function validarBobina(maq){
	let $list_bobinas = $('#list_bobinas_'+maq).val().split(",");
	let $numero = "";
	let $procesada = "";
	for($i=0;$i<$list_bobinas.length;$i++){
		$l = $list_bobinas[$i].split("-");
		if($('#bob_id_'+maq).val()==$l[0]){
			if($l.length==3){
				$procesada = "Procesada";
			}else{
				$numero = $l[1];
			}
			break;
		}
	}
	if($numero==""){
		showMessage('msg_bobina_'+maq,"El número de Bobina "+$('#bob_id_'+maq).val()+" no ha sido asignada a esta Orden de Trabajo!","alert-danger");
		$('#bob_id_'+maq).val("");
	}
	if($procesada=="Procesada"){
		showMessage('msg_bobina_'+maq,"El número de Bobina "+$('#bob_id_'+maq).val()+" ya fue procesada en esta Orden de Trabajo!","alert-danger");
		$('#bob_id_'+maq).val("");
	}	
	$('#bob_numero_'+maq).val($numero);
	$('#bob_metro_imp_'+maq+',#bob_peso_imp_'+maq+',#bobinaGuardada_'+maq).val("");
	$('#bob_metro_imp_'+maq).focus();
}
function mostrarRevision(){
	let maq = $("#maq_id").val();
	$("#username>option[value=0]").prop("selected",true);
	if($.trim($('#bob_id_'+maq).val())!="" && $.trim($('#bob_id_'+maq).val())!="0"){
		if($('#historial_medicion_'+maq+' #tabla_mediciones').length>0){
			let $tipo = $(this).attr("id").split("_")[0];
			if($tipo=="coordinador"){
				$("#username>option[data-type=C]").hide();
				$("#username>option[data-type=S]").show();
			}else{
				$("#username>option[data-type=S]").hide();
				$("#username>option[data-type=C]").show();
			}
			$("#modal_revision").modal('show');
		}else{
			showMessage('msg_medicion_'+maq,"Debe haber guardado alguna medición!","alert-warning");
		}
	}else{
		showMessage('msg_medicion_'+maq,"Debe haber creado una Bobina!","alert-warning");
	}
}
function cargarDatosRemision(){
	let maq = $("#maq_id").val();
	if($('#rem_id_'+maq).val()!="" && $.trim($('#ope_id_'+maq).val())!="0"){
		let $data_rem = getDatosRemision($('#rem_id_'+maq).val(),maq);
		listarCajas();
		limpiarFormulario();
	}else{
		showMessage('msg_bobina_'+maq,"Seleccione el Operario y la Orden de Trabajo!","alert-warning");
		$('#pro_id_'+maq+',#pro_descripcion_'+maq+',#pro_medida_'+maq+',#rem_nextid_'+maq+',#col_descripcion_'+maq).val("");
	}
}
function guardarMedicion(obj){
	var qtyMediciones = 3;
	let maq = $("#maq_id").val();
	if($.trim($('#bob_id_'+maq).val())!="" && $.trim($('#bob_numero_'+maq).val())!=""){
		valido = 'si';
		let intFields = ['#meo_sell_izq_'+maq,'#meo_sell_med_'+maq,'#meo_sell_der_'+maq,'#meo_fuer_sello_'+maq,'#meo_piezas_'+maq,
											'#meo_calibre_'+maq];
		let desFields = ["La fuerza sello lateral izquierdo debe ser numérico!",
			"La fuerza sello medio debe ser numérico!",
			"La fuerza sello lateral derecho debe ser numérico!",
			"La Medición de Fuerza de sello debe ser numérico!",
			"Las piezas debe ser numérico!",
			"La Medición de calibre debe ser numérico!",];
		let decimalFields = [1, 0, 0, 0, 0, 0];
		for(qM=1;qM<=qtyMediciones;qM++){
			if((valido=='si') && ($.trim($('#meo_metro_'+maq+'_'+qM).val())=="" || $.trim($('#meo_ancho_plano_'+maq+'_'+qM).val())=="")){
					showMessage('msg_medicion_'+maq,"Las "+qtyMediciones+" mediciones de medida y ancho plano son obligatorias.","alert-warning");
					$('html, body').animate({
						scrollTop: $('#msg_medicion_'+maq).offset().top
					}, 2000);
					valido = 'no';
			}
			intFields.push('#meo_metro_'+id+'_'+qM,'#meo_ancho_plano_'+id+'_'+qM);
			desFields.push("La medida debe ser numérico!","El ancho plano debe ser numérico!");
			decimalFields.push(2,2);
		}
		let msg = "";
		for($i=0;$i<intFields.length;$i++){
			validado = validateNumber($(intFields[$i]));
			if (validado){
				msg = desFields[$i];
				break;
			}else{
				if(decimalFields[$i]>0 && $(intFields[$i]).val()!=""){
					fixed($(intFields[$i]),decimalFields[$i]);
				}
			}
		}
		if(validado){
			showMessage('msg_medicion_'+maq,msg,"alert-warning");
			return false;
		}
		datos = {
			'ope_id': $('#ope_id_'+maq).val(),
			'maq_id': maq,
			'rem_id': $('#rem_id_'+maq).val(),
			'bob_id': $('#bob_id_'+maq).val(),
			'meo_sell_izq': $('#meo_sell_izq_'+maq).val(),
			'meo_sell_med': $('#meo_sell_med_'+maq).val(),
			'meo_sell_der': $('#meo_sell_der_'+maq).val(),
			'meo_fuer_sello': $('#meo_fuer_sello_'+maq).val(),
			'meo_piezas': $('#meo_piezas_'+maq).val(),
			'meo_calibre': $('#meo_calibre_'+maq).val(),
			'meo_largo': $('#meo_largo_'+maq).val(),
			'meo_distancia': $('#meo_distancia_'+maq).val(),
			'meo_apariencia': $('#meo_apariencia_'+maq).val(),
			'meo_burbuja': $('#meo_burbuja_'+maq).val(),
		}
		datos.meo_metro = $('#meo_metro_'+maq+'_1').val()+'|';
		datos.meo_ancho_plano = $('#meo_ancho_plano_'+maq+'_1').val()+'|';
		for(qM=2;qM<=qtyMediciones;qM++){
			datos.meo_metro+=$('#meo_metro_'+maq+'_'+qM).val()+'|';
			datos.meo_ancho_plano+=$('#meo_ancho_plano_'+maq+'_'+qM).val()+'|';
		}		
		$.ajax({
	        url: '/extrusoras_app/ajax/guardarMedicionConversion/',
	        dataType: 'json',
	        type: 'POST',
	        data: datos,
	        success: function (data) {
						if(data["medicion"].length>0){
							showMessage('msg_medicion_'+maq,"Medición almacenada correctamente!","alert-success");
							$('html, body').animate({
								scrollTop: $('#msg_medicion_'+maq).offset().top
							}, 1500);
							if($('#historial_medicion_'+maq+' #tabla_mediciones').length<=0){
								let $header = headerMedicionBobinas();
								$('#historial_medicion_'+maq+' #tabla_historial_medicion').html($header);
								$('#historial_medicion_'+maq).show();
							}
							for(j=0;j<data["medicion"].length;j++){
								let $row = rowMedicionBobina($('#bob_id_'+maq).val(),data["medicion"][j].numero, data["medicion"][j].fecha,
								data["medicion"][j].hora, data["medicion"][j].piezas, data["medicion"][j].ancho, data["medicion"][j].largo,
								data["medicion"][j].sell_izq,	data["medicion"][j].sell_med, data["medicion"][j].sell_der,data["medicion"][j].distancia,
								data["medicion"][j].calibre,data["medicion"][j].burbuja, data["medicion"][j].apariencia,data["medicion"][j].fuer_sello);
								$('#historial_medicion_'+maq+' #tabla_mediciones').append($row);
							}
							$('#meo_piezas_'+maq).val("");
							$('#meo_sell_izq_'+maq+', #meo_sell_med_'+maq+', #meo_sell_der_'+maq).val("");
							$('#meo_fuer_sello_'+maq+', #meo_calibre_'+maq).val("");
							$('#meo_largo_'+maq+'>option[value=""]').prop("selected",true);
							$('#meo_distancia_'+maq+'>option[value=""]').prop("selected",true);
							$('#meo_apariencia_'+maq+'>option[value=""]').prop("selected",true);
							$('#meo_burbuja_'+maq+'>option[value=""]').prop("selected",true);

							$('[id^=meo_metro_'+maq+'], [id^=meo_ancho_plano_'+maq+']').val("");
							$('[id^=meo_metro_'+maq+'], [id^=meo_ancho_plano_'+maq+']').each(function(){
								if(($(this).attr("name")=="meo_metro" && $(this).attr("id").split("_")[3]!=1) || ($(this).attr("name")=="meo_ancho_plano" && $(this).attr("id").split("_")[4]!=1))
								{
									$(this).prop("disabled",true);
								}
							});
						}else{
							showMessage('msg_medicion_'+maq,"Problemas al almacenar la medición!","alert-danger");
							$('html, body').animate({
								scrollTop: $('#msg_medicion_'+maq).offset().top
							}, 1500);
						}
	        }
    	});
	}else{
		showMessage('msg_medicion_'+maq,"Debe haber creado una Bobina!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+maq).offset().top
		}, 1500);
	}
}
function headerMedicionBobinas(){
	let $header = '<table id="tabla_mediciones" class="user-table table100p mb15">';
	$header += '<tr>';
	$header += '<th>ID</th>';
	$header += '<th>#</th>';
	$header += '<th>Fecha</th>';
	$header += '<th>Hora</th>';
	$header += '<th>Piezas</th>';
	$header += '<th>AP</th>';
	$header += '<th>Largo</th>';
	$header += '<th>FS Lat IZQ</th>';
	$header += '<th>FS Medio</th>';
	$header += '<th>FS Lat Derecho</th>';
	$header += '<th>Distancia a impresión</th>';
	$header += '<th>Medición de calibre</th>';
	$header += '<th>Prueba burbuja</th>';
	$header += '<th>Apariencia</th>';
	$header += '<th>Fuerza de sello</th>';
	$header += '</tr>';
	$header += '</table>';
	return $header;
}
function rowMedicionBobina(id_bobina, nro, fecha, hora, piezas, ancho, largo, fs_lat_izq,
	fs_medio, fs_lat_der, distancia, calibre, burbuja, apa, fue_sello){
	distancia = (distancia=="S")?"SI":((distancia=="N")?"NO":"");
	apa = (apa=="S")?"SI":((apa=="N")?"NO":"");
	burbuja = (burbuja=="S")?"SI":((burbuja=="N")?"NO":"");
	let $row = '<tr>';
	$row += '<td>'+id_bobina+'</td>';
	$row += '<td>'+nro+'</td>';
	$row += '<td>'+fecha+'</td>';
	$row += '<td>'+hora+'</td>';
	$row += '<td>'+piezas+'</td>';
	$row += '<td>'+ancho+'</td>';
	$row += '<td>'+largo+'</td>';
	$row += '<td>'+fs_lat_izq+'</td>';
	$row += '<td>'+fs_medio+'</td>';
	$row += '<td>'+fs_lat_der+'</td>';
	$row += '<td>'+distancia+'</td>';
	$row += '<td>'+calibre+'</td>';
	$row += '<td>'+burbuja+'</td>';
	$row += '<td>'+apa+'</td>';
	$row += '<td>'+fue_sello+'</td>';
	$row += '</tr>';
	return $row;
}
function guardarRevision(){
	let maq = $("#maq_id").val();
	if($.trim($('#bob_id_'+maq).val())!="" && $.trim($('#bob_id_'+maq).val())!="0"){
		$.ajax({
	        url: '/extrusoras_app/ajax/guardarRevision/',
	        dataType: 'json',
	        type: 'POST',
	        data:{
	            'bob_id': $('#bob_id_'+maq).val(),
							'dep_id': 1,
							'username': $("#username").val(),
							'ope_password': $("#ope_password").val(),
	        },
	        success: function (data) {
						if(data["revision"]["encontrado"]){
							if($('#historial_revision_'+maq+' #tabla_revisiones').length<=0){
								let $header = headerHistorialRevisiones();
								$('#historial_revision_'+maq+' #tabla_historial_revision').html($header);
								$('#historial_revision_'+maq).show();
							}
							let $row = rowHistorialRevisiones($('#bob_id_'+maq).val(),
									data["revision"].id, data["revision"].fecha,
								data["revision"].hora, data["revision"].usuario);
							$('#historial_revision_'+maq+' #tabla_revisiones').append($row);
							$("#ope_password").val("");
							$("#modal_revision").modal('hide');
							showMessage('msg_medicion_'+maq,"Revisión almacenada correctamente!","alert-success");
						}else{
							showMessage('msg_medicion_'+maq,"Los datos del supervisor no son correctos!","alert-danger");
						}
	        }
    	});
	}
}
function headerHistorialRevisiones(){
	let $header = '<table id="tabla_revisiones" class="user-table table100p mb15">';
	$header += '<tr>';
	$header += '<th>ID</th>';
	$header += '<th>#</th>';
	$header += '<th>Fecha</th>';
	$header += '<th>Hora</th>';
	$header += '<th>Usuario</th>';
	$header += '</tr>';
	$header += '</table>';
	return $header;
}
function rowHistorialRevisiones(id_bobina, nro, fecha, hora, usuario){
	let $row = '<tr>';
	$row += '<td>'+id_bobina+'</td>';
	$row += '<td>'+nro+'</td>';
	$row += '<td>'+fecha+'</td>';
	$row += '<td>'+hora+'</td>';
	$row += '<td>'+usuario+'</td>';
	$row += '</tr>';
	return $row;
}
function finalizarProceso(){
	let maq = $("#maq_id").val();
	let en = qtyAsignadasVsProcesadas();
	let mediciones = $('#historial_medicion_'+maq+' #tabla_mediciones tbody tr').length;	
	if (mediciones>3 || (mediciones<1 && $("#bob_id_"+maq).val()=="" && en==0)){
		$("#modal_confirmacion").modal('show');
	}else{
		showMessage('msg_medicion_'+maq,"Debe haber almacenado al menos 3 mediciones!","alert-warning");
	}
}
function qtyAsignadasVsProcesadas(){
	let maq = $("#maq_id").val();
	let arrBob = $('#list_bobinas_'+maq).val().split(",");
	let en = 0;
	for(i=0;i<arrBob.length;i++){
		element = arrBob[i].split("-");
		if(element.length<3){
			en++;
		}
	}
	if(en>0){
		$("#mimensaje").text("La cantidad de bobinas asignadas a esta Orden de Trabajo es mayor a la cantidad de Bobinas procesadas").show();
	}	else{
		$("#mimensaje").text("").hide();
	}
	return en;
}
function cerrarProceso(){
	let maq = $("#maq_id").val();
	if($.trim($('#rem_id_'+maq).val())!="" && $.trim($('#rem_id_'+maq).val())!="0"){
		$.ajax({
			url: '/extrusoras_app/ajax/finalizarOrdenConversion/',
			dataType: 'json',
			type: 'POST',
			data:{
				'rem_id': $('#rem_id_'+maq).val(),
			},
			success: function (data) {
				if(data["finalizado"]){
					$("#modal_confirmacion").modal('hide');
					showMessage('msg_medicion_'+maq,"La Orden de Trabajo ha finalizado exitosamente!","alert-success");
					limpiarFormulario();
					$('#rem_id_'+maq+' option:selected').remove();
					$('#rem_id_'+maq).val('0').trigger('change.select2');
					$('#ope_id_'+maq+'>option[value=0]').prop("selected",true);
				}else{
					showMessage('msg_medicion_'+maq,"No se pudo finalizar el proceso, inténtelo nuevamente!","alert-danger");
				}
			}
		});
	}else{
		showMessage('msg_medicion_'+maq,"Debe haber creado una Bobina!","alert-warning");
	}
}

function limpiarFormulario(){
	let maq = $("#maq_id").val();
	$('#pro_id_'+maq+', #pro_descripcion_'+maq+', #pro_medida_'+maq+', #rem_nextid_'+maq+', #col_descripcion_'+maq).val("");
	$('#bob_id_'+maq+', #bob_numero_'+maq).val("");
	$('#bob_metro_imp_'+maq+',#bob_peso_imp_'+maq).val("");
	$('#meo_piezas_'+maq).val("");
	$('[id^=meo_metro_'+maq+'], [id^=meo_ancho_plano_'+maq+']').val("");
	$('#meo_sell_izq_'+maq+', #meo_sell_med_'+maq+', #meo_sell_der_'+maq).val("");
	$('#meo_fuer_sello_'+maq+', #meo_calibre_'+maq).val("");
	$('#meo_largo_'+maq+'>option[value=""]').prop("selected",true);
	$('#meo_distancia_'+maq+'>option[value=""]').prop("selected",true);
	$('#meo_apariencia_'+maq+'>option[value=""]').prop("selected",true);
	$('#meo_burbuja_'+maq+'>option[value=""]').prop("selected",true);

	$('#historial_medicion_'+maq+' #tabla_historial_medicion_'+maq+', #historial_revision_'+maq+' #tabla_historial_revision').html("");
	$('#historial_medicion_'+maq+', #historial_revision_'+maq).hide();
}
function listarHistoricoBobinas(obj){
	var id = obj.attr("id").split("_")[2];
	if($.trim($('#bob_id_'+id).val())!="" && $.trim($('#bob_id_'+id).val())!="0"){
		$.ajax({
			url: '/extrusoras_app/ajax/listarHistoricoBobina/',
			dataType: 'json',
			type: 'POST',
			data:{
				'bob_id': $('#bob_id_'+id).val(),
			},
			success: function (data) {
				if(data.length>0){
					let $header = headerListarBobinas();
					$("#historico_bobinas").html($header);
					for($i=0;$i<data.length;$i++){
						$row = rowListarBobinas(data[$i]["bobina"],
							data[$i]["departamento"], data[$i]["metro"],
							data[$i]["peso"]);
						$("#tabla_bobinas").append($row);
					}
					$("#modal_listar_bobinas").modal('show');
				}else{
					showMessage('msg_bobina_'+id,"No existe la bobina o su historico de medidas!","alert-warning");
				}
			}
		});
	}else{
		showMessage('msg_bobina_'+id,"Introduzca el número de la bobina!","alert-warning");
	}
}
function headerListarBobinas(){
	let $header = '<table id="tabla_bobinas" class="user-table table100p mb15">';
	$header += '<tr>';
	$header += '<th>ID BOBINA</th>';
	$header += '<th>DEPARTAMENTO</th>';
	$header += '<th>METRO</th>';
	$header += '<th>PESO</th>';
	$header += '</tr>';
	$header += '</table>';
	return $header;
}
function rowListarBobinas(bobina, departamento,metro,peso){
	let $row = '<tr>';
	$row += '<td>'+bobina+'</td>';
	$row += '<td>'+departamento+'</td>';
	$row += '<td>'+metro+'</td>';
	$row += '<td>'+peso+' Kg</td>';
	$row += '</tr>';
	return $row;
}