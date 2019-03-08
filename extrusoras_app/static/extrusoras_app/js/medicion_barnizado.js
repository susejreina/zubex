$(document).ready(function() {
	$('[name=msg_bobina],[name=msg_medicion],[name=msg_remision]').hide();

	let maq_id = $("#list_maquinas>li:first").attr("data-id");
	let maq_nombre = $("#list_maquinas>li:first").attr("data-nombre");
	$("#list_maquinas>li:first").addClass("current");
	$("#maq_id").val(maq_id);
	$('[name=divmaquina]:not(#maq_'+maq_id+')').hide();
	$("#title").text(maq_nombre);
	$("#list_maquinas>li").click(marcarMaquina);
	$("#mimensaje").hide();
	$('.js-rem-id').select2({
	  minimumInputLength: 3,
	  ajax: {
	    url: '/extrusoras_app/ajax/searchOrdenTrabajo/',
	    dataType: 'json',
		data: function (params) {
	      var query = {
	        search: params.term,
	        type: 'public',
			dep_id: 4,
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
	$("[name=finalizar_proceso]").on("click",function(e){e.preventDefault();finalizarProceso(false);});
	$("[name=imprimir_etiqueta]").on("click",imprimirEtiqueta);	
	$("#modal_confirmacion_etiqueta").on("click","#imprime_etiqueta",function(e){e.preventDefault();imprimeEtiqueta();});
	$("#modal_confirmacion_etiqueta").on("click","#finalizarorden",function(e){e.preventDefault();finalizarProceso(true);});

	//Validaciones de tipo de dato
	$("[name=meb_cata_barniz],[name=meb_vis_1],[name=meb_vis_2],[name=meb_hume_area]").on("keypress",integerNumber);
	$("[name=meb_temp_area],[name=meb_metro],[name=meb_ancho_plano]").on("keypress",floatNumber);

	//Habilitando campos
	$("[name=meb_metros],[name=meb_ancho_plano]").each(function(){
		if(($(this).attr("name")=="meb_metros" && $(this).attr("id").split("_")[3]!=1) || ($(this).attr("name")=="meb_ancho_plano" && $(this).attr("id").split("_")[4]!=1))
		{
			$(this).prop("disabled",true);
		}
	});
	$("[name=meb_ancho_plano]").on("blur",activarNuevoRegistro);
});
function activarNuevoRegistro(){
	let qtyMediciones = 5;
	let nro = parseInt($(this).attr("id").split("_")[4]);
	let maq = $(this).attr("id").split("_")[3];
	if(nro<qtyMediciones){
		if($.trim($("#meb_metros_"+maq+"_"+nro).val())!="" && $.trim($("#meb_ancho_plano_"+maq+"_"+nro).val())!=""){
			nro = nro + 1;
			$("#meb_metros_"+maq+"_"+nro).prop("disabled",false);
			$("#meb_ancho_plano_"+maq+"_"+nro).prop("disabled",false);
			if(nro>2){
				$("#meb_metros_"+maq+"_"+nro).focus();
			}
		}
	}
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
				'bob_metros': $('#bob_metro_imp_'+maq).val(),
				'bob_peso': $('#bob_peso_imp_'+maq).val(),
				'dep_id': 4,
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
		$('html, body').animate({
			scrollTop: $('#msg_bobina_'+maq).offset().top
		}, 1500);
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
		let intFields = ['#meb_temp_area_'+maq, '#meb_cata_barniz_'+maq, '#meb_hume_area_'+maq, '#meb_vis_1_'+maq, '#meb_vis_2_'+maq,];
		let desFields = ["La temperatua del área debe ser numérico!", "La catalización de tinta de barniz debe ser numérico!",
					"La humedad del área debe ser numérico!", "La Viscosidad Unidad 1 debe ser numérico!", "La Viscosidad Unidad 2 debe ser numérico!",];
		let decimalFields = [1, 0, 0, 0, 0];
		for(qM=1;qM<=qtyMediciones;qM++){
			if((valido=='si') && ($.trim($('#meb_metros_'+maq+'_'+qM).val())=="" || $.trim($('#meb_ancho_plano_'+maq+'_'+qM).val())=="")){
					showMessage('msg_medicion_'+maq,"Las "+qtyMediciones+" mediciones de medida y ancho plano son obligatorias.","alert-warning");
					$('html, body').animate({
						scrollTop: $('#msg_medicion_'+maq).offset().top
					}, 2000);
					valido = 'no';
			}
			intFields.push('#meb_metros_'+maq+'_'+qM,'#meb_ancho_plano_'+maq+'_'+qM);
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
		if($('#meb_cata_barniz_'+maq).val()!="" || $('#meb_hume_area_'+maq).val()!=""){
			if(parseInt($('#meb_cata_barniz_'+maq).val())>100){
				validado = true;
				msg = "La catalización de tinta de barniz debe ser menor o igual a 100";
			}
			if(validado==false && parseInt($('#meb_hume_area_'+maq).val())>100){
				validado = true;
				msg = "La humedad del área debe ser menor o igual a 100";
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
			'meb_temp_area': $('#meb_temp_area_'+maq).val(),
			'meb_cata_barniz': $('#meb_cata_barniz_'+maq).val(),
			'meb_hume_area': $('#meb_hume_area_'+maq).val(),
			'meb_vis_1': $('#meb_vis_1_'+maq).val(),
			'meb_vis_2': $('#meb_vis_2_'+maq).val(),
			'meb_dur_plas': $('#meb_dur_plas_'+maq).val(),
			'meb_prue_cura': $('#meb_prue_cura_'+maq).val(),
		}
		datos.meb_metro = $('#meb_metros_'+maq+'_1').val()+'|';
		datos.meb_ancho_plano = $('#meb_ancho_plano_'+maq+'_1').val()+'|';
		for(qM=2;qM<=qtyMediciones;qM++){
			datos.meb_metro+=$('#meb_metros_'+maq+'_'+qM).val()+'|';
			datos.meb_ancho_plano+=$('#meb_ancho_plano_'+maq+'_'+qM).val()+'|';
		}
		$.ajax({
	        url: '/extrusoras_app/ajax/guardarMedicionBarnizado/',
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
								let $row = rowMedicionBobina($('#bob_id_'+maq).val(),
									data["medicion"][j].numero, data["medicion"][j].fecha,
									data["medicion"][j].hora, data["medicion"][j].ancho,
									data["medicion"][j].cata_barniz,
									data["medicion"][j].vis_1,	data["medicion"][j].vis_2,
									data["medicion"][j].temp_area,data["medicion"][j].hume_area,
									data["medicion"][j].prue_cura,data["medicion"][j].dur_plas);
									$('#historial_medicion_'+maq+' #tabla_mediciones').append($row);
							}
							$('[id^=meb_metros_'+maq+'], [id^=meb_ancho_plano_'+maq+']').val("");
							$('#meb_temp_area_'+maq).val("");
							$('#meb_cata_barniz_'+maq+', #meb_hume_area_'+maq+', #meb_vis_1_'+maq+', #meb_vis_2_'+maq).val("");
							$('#meb_dur_plas_'+maq+'>option[value=""]').prop("selected",true);
							$('#meb_prue_cura_'+maq+'>option[value=""]').prop("selected",true);
							$('[id^=meb_metros_'+maq+'], [id^=meb_ancho_plano_'+maq+']').each(function(){
								if(($(this).attr("name")=="meb_metros" && $(this).attr("id").split("_")[3]!=1) || ($(this).attr("name")=="meb_ancho_plano" && $(this).attr("id").split("_")[4]!=1))
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
	$header += '<th>Ancho plano</th>';
	$header += '<th>Catalización tinta barniz</th>';
	$header += '<th>V1</th>';
	$header += '<th>V2</th>';
	$header += '<th>Temp área</th>';
	$header += '<th>Humedad área</th>';
	$header += '<th>Prueba de curado de tinta</th>';
	$header += '<th>Dureza de plasta</th>';
	$header += '</tr>';
	$header += '</table>';
	return $header;
}
function rowMedicionBobina(id_bobina, nro, fecha, hora, ancho, tin_blan,
	v1,v2, temp_area,hum_area, curado, plasta){
	if(curado=="S"){
		curado = "SI";
	}else if(curado=="N"){
		curado = "NO";
	}else{
		curado = "";
	}
	if(plasta=="S"){
		plasta = "SI";
	}else if(plasta=="N"){
		plasta = "NO";
	}else{
		plasta = "";
	}
	let $row = '<tr>';
	$row += '<td>'+id_bobina+'</td>';
	$row += '<td>'+nro+'</td>';
	$row += '<td>'+fecha+'</td>';
	$row += '<td>'+hora+'</td>';
	$row += '<td>'+ancho+'</td>';
	$row += '<td>'+tin_blan+'</td>';
	$row += '<td>'+v1+'</td>';
	$row += '<td>'+v2+'</td>';
	$row += '<td>'+temp_area+'</td>';
	$row += '<td>'+hum_area+'</td>';
	$row += '<td>'+curado+'</td>';
	$row += '<td>'+plasta+'</td>';
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
							'dep_id': 4,
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
function finalizarProceso(etiqueta){
	let maq = $("#maq_id").val();
	if(etiqueta==false){
		let en = qtyAsignadasVsProcesadas();
		let mediciones = $('#historial_medicion_'+maq+' #tabla_mediciones tbody tr').length;	
		if (mediciones>4 || (mediciones<1 && $("#bob_id_"+maq).val()=="" && en==0)){
			$("#modal_confirmacion").modal('show');
		}else{
			showMessage('msg_medicion_'+maq,"Debe haber almacenado al menos 3  mediciones!","alert-warning");
		}
	}else{
		imprimeEtiqueta();
		qtyAsignadasVsProcesadas();
		$("#modal_confirmacion").modal('show');
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
			url: '/extrusoras_app/ajax/finalizarOrdenBarnizado/',
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
function imprimirEtiqueta(){
	let maq = $("#maq_id").val();
	let mediciones = $('#historial_medicion_'+maq+' #tabla_mediciones tbody tr').length;	
	let seguir = true;
	if($.trim($('#bob_id_'+maq).val())=="" && $.trim($('#bob_id_'+maq).val())=="0"){
		seguir = false;
		showMessage('msg_medicion_'+maq,"Debe haber creado una Bobina!","alert-warning");
	}
	if($.trim($('#bobinaGuardada_'+maq).val())!="si"){
		seguir=false;
		showMessage('msg_medicion_'+maq,"No ha guardado la medición!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+maq).offset().top
		}, 1500);
	}	
	if (mediciones<4){
		seguir = false;
		showMessage('msg_medicion_'+maq,"Debe haber almacenado al menos 3 mediciones!","alert-warning");
	}
	if(seguir){
		$("#modal_confirmacion_etiqueta").modal('show');
	}	
}
function imprimeEtiqueta(){
	let maq = $("#maq_id").val();
	let arrBob = $('#list_bobinas_'+maq).val().split(",");
	let new_list="";
	for(i=0;i<arrBob.length;i++){
		element = arrBob[i].split("-");
		new_list+=arrBob[i];
		if(element[0]==$.trim($('#bob_id_'+maq).val())){
			new_list+="-PROC";
		}
		if(i!=arrBob.length-1){
			new_list+=",";
		}
	}
	$('#list_bobinas_'+maq).val(new_list);
	$("#modal_confirmacion_etiqueta").modal('hide');
	window.open('/extrusoras_app/etiqueta_barnizado/'+$.trim($('#bob_id_'+maq).val())+'/'+$.trim($('#rem_id_'+maq).val())+'/','etiquetaBarnizado','toolbar=yes,location=yes,status=yes');
	$('#bobinaGuardada_'+maq).val("");
	$('#bob_id_'+maq+',#bob_numero_'+maq+',#bob_metro_imp_'+maq+',#bob_peso_imp_'+maq).val("");
	$('#historial_medicion_'+maq+' #tabla_historial_medicion,#historial_revision_'+maq+' #tabla_historial_revision').html("");
	$('#historial_medicion_'+maq+',#historial_revision_'+maq).hide();	
}
function limpiarFormulario(){
	let maq = $("#maq_id").val();
	$('#pro_id_'+maq+', #pro_descripcion_'+maq+', #pro_medida_'+maq+', #rem_nextid_'+maq+', #col_descripcion_'+maq).val("");
	$('#bob_id_'+maq+', #bob_numero_'+maq+',#bob_metro_imp_'+maq+',#bob_peso_imp_'+maq).val("");
	$('[id^=meb_metros_'+maq+'], [id^=meb_ancho_plano_'+maq+']').val("");
	$('#meb_temp_area_'+maq).val("");
	$('#meb_cata_barniz_'+maq+', #meb_hume_area_'+maq+', #meb_vis_1_'+maq+', #meb_vis_2_'+maq).val("");
	$('#meb_dur_plas_'+maq+'>option[value=""]').prop("selected",true);
	$('#meb_prue_cura_'+maq+'>option[value=""]').prop("selected",true);

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