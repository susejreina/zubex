$(document).ready(function() {
	let maq_id = $("#list_maquinas>li:first").attr("data-id");
	let maq_nombre = $("#list_maquinas>li:first").attr("data-nombre");
	$("#list_maquinas>li:first").addClass("current");
	$("#maq_id").val(maq_id);
	$('[name=msg_bobina],[name=msg_medicion],[name=msg_remision]').hide();
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
						dep_id: 7,
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
	$("#modal_revision, #modal_confirmacion, #modal_listar_bobinas").modal('hide');
	$("[name=revision]").on("click",mostrarRevision);
	$("#guardar_revision").on("click",function(e){e.preventDefault();guardarRevision();});
	$("#modal_confirmacion").on("click","#cerrar_orden",function(e){e.preventDefault();cerrarProceso();});
	$("#modal_confirmacion_etiqueta").on("click","#imprime_etiqueta",function(e){e.preventDefault();imprimeEtiqueta();});
	$("#modal_confirmacion_etiqueta").on("click","#finalizarorden",function(e){e.preventDefault();finalizarProceso(true);});
	
	$("[name=finalizar_proceso]").on("click",function(e){e.preventDefault();finalizarProceso(false);});
	$("[name=imprimir_etiqueta]").on("click",imprimirEtiqueta);

	//Validaciones de tipo de dato
	$("[name=mei_vis_1],[name=mei_vis_2],[name=mei_vis_3],[name=mei_vis_4],[name=mei_vis_5],[name=mei_vis_6]").on("keypress",integerNumber);
	$("[name=mei_vis_7],[name=mei_vis_8],[name=mei_cat_blanca],[name=mei_cat_color],[name=mei_hume_area]").on("keypress",integerNumber);
	$("[name=mei_metro],[name=mei_ancho_plano],[name=mei_temp_infrarojo],[name=mei_temp_tablero],[name=mei_temp_area]").on("keypress",floatNumber);
	$("[name=bob_metro_imp],[name=bob_peso_imp]").on("keypress",floatNumber);
});
function getNroBobina(e){
	let ascii = e.keyCode;
	if(ascii==13){
		let maq = $("#maq_id").val();
		$('#bob_metro_imp_'+maq+',#bob_peso_imp_'+maq).val("");
		$('#historial_medicion_'+maq+' #tabla_historial_medicion,#historial_revision_'+maq+' #tabla_historial_revision').html("");
		$('#historial_medicion_'+maq+',#historial_revision_'+maq).hide();
		let v = validarBobina(maq);
		return v;
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
			$('html, body').animate({
				scrollTop: $('#msg_medicion_'+maq).offset().top
			}, 1500);
		}
	}else{
		showMessage('msg_medicion_'+maq,"Debe haber creado una Bobina!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+maq).offset().top
		}, 1500);
	}
}
function cargarDatosRemision(){
	let maq = $("#maq_id").val();
	if($('#rem_id_'+maq).val()!="" && $.trim($('#ope_id_'+maq).val())!="0"){
		let $data_rem = getDatosRemision($('#rem_id_'+maq).val(),maq);
	}else{
		showMessage('msg_bobina_'+maq,"Seleccione el Operario y la Orden de Trabajo!","alert-warning");
		$('#pro_id_'+maq+',#pro_descripcion_'+maq+',#pro_medida_'+maq+',#rem_nextid_'+maq+',#col_descripcion_'+maq).val("");
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
					'dep_id': 7,
					},
					success: function (data) {
						if(data["guardado"]){
							$("#bobinaGuardada_"+maq).val("si");
							showMessage('msg_bobina_'+maq,"Se ha almacenado la Bobina correctamente!","alert-success");
							$('html, body').animate({
								scrollTop: $('#msg_bobina_'+maq).offset().top
							}, 1500);
						}else{
							showMessage('msg_bobina_'+maq,"Problemas al almacenar la Bobina. Verifique los datos e inténtelo nuevamente!","alert-danger");
						}
	        }
    	});
	}else{
		showMessage('msg_bobina_'+maq,"Debe haber creado una Bobina!","alert-warning");
	}
}
function guardarMedicion(obj){
	let maq = $("#maq_id").val();
	if($.trim($('#bob_id_'+maq).val())!="" && $.trim($('#bob_numero_'+maq).val())!=""){
		if($.trim($('#mei_metro_'+maq).val())=="" || $.trim($('#mei_ancho_plano_'+maq).val())==""){
				showMessage('msg_medicion_'+maq,"La medida y el ancho plano son obligatorios.","alert-warning");
				$('html, body').animate({
					scrollTop: $('#msg_medicion_'+maq).offset().top
				}, 1500);
				return false;
		}

		$('#mei_vis_1_'+maq+',#mei_vis_2_'+maq+',#mei_vis_3_'+maq+',#mei_vis_4_'+maq+', #mei_vis_5_'+maq+',#mei_vis_6_'+maq).on("keypress",integerNumber);
		$('#mei_vis_7_'+maq+',#mei_vis_8_'+maq+', #mei_cat_blanca_'+maq+',#mei_cat_color_'+maq+',#mei_hume_area_'+maq).on("keypress",integerNumber);
		$('#mei_metro_'+maq+',#mei_ancho_plano_'+maq+',#mei_temp_infrarojo_'+maq+',#mei_temp_tablero_'+maq+',#mei_temp_area_'+maq).on("keypress",floatNumber);

		let intFields = ['#mei_vis_1_'+maq, '#mei_vis_2_'+maq, '#mei_vis_3_'+maq, '#mei_vis_4_'+maq,
						 '#mei_vis_5_'+maq, '#mei_vis_6_'+maq, '#mei_vis_7_'+maq, '#mei_vis_8_'+maq,
						 '#mei_cat_blanca_'+maq, '#mei_cat_color_'+maq, '#mei_hume_area_'+maq,
					 	 '#mei_metro_'+maq, '#mei_ancho_plano_'+maq, '#mei_temp_infrarojo_'+maq,
							'#mei_temp_tablero_'+maq, '#mei_temp_area_'+maq,];
		let desFields = ["La viscosidad Unidad 1 debe ser numérico!",
						"La viscosidad Unidad 2 debe ser numérico!",
						"La viscosidad Unidad 3 debe ser numérico!",
						"La viscosidad Unidad 4 debe ser numérico!",
						"La viscosidad Unidad 5 debe ser numérico!",
						"La viscosidad Unidad 6 debe ser numérico!",
						"La viscosidad Unidad 7 debe ser numérico!",
						"La viscosidad Unidad 8 debe ser numérico!",
						"La catalización de tinta blanca debe ser numérico!",
						"La catalización de tinta de colores debe ser numérico!",
						"La humedad del área debe ser numérico!",
						"La medida debe ser numérico!",
						"El ancho plano debe ser numérico!",
						"La temperatura de infrarojo debe ser numérico!",
						"La temperatura de tablero debe ser numérico!",
						"La temperatura de área debe ser numérico!",];
		let decimalFields = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1];
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
		if($('#mei_cat_blanca_'+maq).val()!="" || $('#mei_cat_color_'+maq).val()!="" || $('#mei_hume_area_'+maq).val()!=""){
			if(parseInt($('#mei_cat_blanca_'+maq).val())>100){
				validado = true;
				msg = "La catalización de tinta blanca debe ser menor o igual a 100";
			}
			if(validado==false && parseInt($('#mei_cat_color_'+maq).val())>100){
				validado = true;
				msg = "La catalización de tinta de colores debe ser menor o igual a 100";
			}
			if(validado==false && parseInt($('#mei_hume_area_'+maq).val())>100){
				validado = true;
				msg = " La humedad de área debe ser menor o igual a 100";
			}
		}
		if(validado){
			showMessage('msg_medicion_'+maq,msg,"alert-warning");
			$('html, body').animate({
				scrollTop: $('#msg_medicion_'+maq).offset().top
			}, 1500);
			return false;
		}
		$.ajax({
	        url: '/extrusoras_app/ajax/guardarMedicionImpresion/',
	        dataType: 'json',
	        type: 'POST',
	        data:{
						'ope_id': $('#ope_id_'+maq).val(),
						'maq_id': maq,
						'rem_id': $('#rem_id_'+maq).val(),
						'bob_id': $('#bob_id_'+maq).val(),
						'mei_vis_1': $('#mei_vis_1_'+maq).val(),
						'mei_vis_2': $('#mei_vis_2_'+maq).val(),
						'mei_vis_3': $('#mei_vis_3_'+maq).val(),
						'mei_vis_4': $('#mei_vis_4_'+maq).val(),
						'mei_vis_5': $('#mei_vis_5_'+maq).val(),
						'mei_vis_6': $('#mei_vis_6_'+maq).val(),
						'mei_vis_7': $('#mei_vis_7_'+maq).val(),
						'mei_vis_8': $('#mei_vis_8_'+maq).val(),
						'mei_cat_blanca': $('#mei_cat_blanca_'+maq).val(),
						'mei_cat_color': $('#mei_cat_color_'+maq).val(),
						'mei_hume_area': $('#mei_hume_area_'+maq).val(),
						'mei_metro': $('#mei_metro_'+maq).val(),
						'mei_ancho_plano': $('#mei_ancho_plano_'+maq).val(),
						'mei_temp_infrarojo': $('#mei_temp_infrarojo_'+maq).val(),
						'mei_temp_tablero': $('#mei_temp_tablero_'+maq).val(),
						'mei_temp_area': $('#mei_temp_area_'+maq).val(),
	        },
	        success: function (data) {
						if(data["medicion"]){
							showMessage('msg_medicion_'+maq,"Medición almacenada correctamente!","alert-success");
							$('html, body').animate({
								scrollTop: $('#msg_medicion_'+maq).offset().top
							}, 1500);
							if($('#historial_medicion_'+maq+' #tabla_mediciones').length<=0){
								let $header = headerMedicionBobinas();
								$('#historial_medicion_'+maq+' #tabla_historial_medicion').html($header);
								$('#historial_medicion_'+maq).show();
							}
							let $row = rowMedicionBobina($('#bob_id_'+maq).val(),
								data["medicion"].numero, data["medicion"].fecha,
								data["medicion"].hora, data["medicion"].metro,
								data["medicion"].ancho, data["medicion"].cat_blanca,
								data["medicion"].cat_color, data["medicion"].vis_1,
								data["medicion"].vis_2, data["medicion"].vis_3,
								data["medicion"].vis_4,data["medicion"].vis_5,
								data["medicion"].vis_6,data["medicion"].vis_7,
								data["medicion"].vis_8,data["medicion"].temp_infrarojo,
								data["medicion"].temp_tablero,data["medicion"].temp_area,
								data["medicion"].hume_area);
							$('#historial_medicion_'+maq+' #tabla_mediciones').append($row);
							$('#mei_metro_'+maq+', #mei_ancho_plano_'+maq+', #mei_cat_blanca_'+maq+', #mei_cat_color_'+maq).val("");
							$('#mei_vis_1_'+maq+', #mei_vis_2_'+maq+', #mei_vis_3_'+maq).val("");
							$('#mei_vis_4_'+maq+', #mei_vis_5_'+maq+', #mei_vis_6_'+maq).val("");
							$('#mei_vis_7_'+maq+', #mei_vis_8_'+maq+', #mei_temp_infrarojo_'+maq).val("");
							$('#mei_temp_tablero_'+maq+', #mei_temp_area_'+maq+', #mei_hume_area_'+maq).val("");
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
	$header += '<th>Metros</th>';
	$header += '<th>Ancho plano</th>';
	$header += '<th>Tinta blanca</th>';
	$header += '<th>Tinta colores</th>';
	$header += '<th>V1</th>';
	$header += '<th>V2</th>';
	$header += '<th>V3</th>';
	$header += '<th>V4</th>';
	$header += '<th>V5</th>';
	$header += '<th>V6</th>';
	$header += '<th>V7</th>';
	$header += '<th>V8</th>';
	$header += '<th>Temp Infrarrojo</th>';
	$header += '<th>Temp Tablero</th>';
	$header += '<th>Temp área</th>';
	$header += '<th>Humedad área</th>';
	$header += '</tr>';
	$header += '</table>';
	return $header;
}
function rowMedicionBobina(id_bobina, nro, fecha, hora, metro, ancho, tin_blan,
	tin_col, v1,v2,v3,v4,v5,v6,v7,v8,temp_infra,temp_tabl,temp_area,hum_area){
	let $row = '<tr>';
	$row += '<td>'+id_bobina+'<td>';
	$row += '<td>'+nro+'<td>';
	$row += '<td>'+fecha+'<td>';
	$row += '<td>'+hora+'<td>';
	$row += '<td>'+metro+'<td>';
	$row += '<td>'+ancho+'<td>';
	$row += '<td>'+tin_blan+'<td>';
	$row += '<td>'+tin_col+'<td>';
	$row += '<td>'+v1+'<td>';
	$row += '<td>'+v2+'<td>';
	$row += '<td>'+v3+'<td>';
	$row += '<td>'+v4+'<td>';
	$row += '<td>'+v5+'<td>';
	$row += '<td>'+v6+'<td>';
	$row += '<td>'+v7+'<td>';
	$row += '<td>'+v8+'<td>';
	$row += '<td>'+temp_infra+'<td>';
	$row += '<td>'+temp_tabl+'<td>';
	$row += '<td>'+temp_area+'<td>';
	$row += '<td>'+hum_area+'<td>';
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
							'dep_id': 7,
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
							$('html, body').animate({
								scrollTop: $('#msg_medicion_'+maq).offset().top
							}, 1500);
						}else{
							showMessage('msg_medicion_'+maq,"Los datos del supervisor no son correctos!","alert-danger");
							$('html, body').animate({
								scrollTop: $('#msg_medicion_'+maq).offset().top
							}, 1500);
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
		if (mediciones>1 || (mediciones<1 && $("#bob_id_"+maq).val()=="" && en==0)){
			$("#modal_confirmacion").modal('show');
		}else{
			showMessage('msg_medicion_'+maq,"Debe haber almacenado mediciones!","alert-warning");
			$('html, body').animate({
				scrollTop: $('#msg_medicion_'+maq).offset().top
			}, 1500);
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
			url: '/extrusoras_app/ajax/finalizarOrdenImpresion/',
			dataType: 'json',
			type: 'POST',
			data:{
				'rem_id': $('#rem_id_'+maq).val(),
			},
			success: function (data) {
				if(data["finalizado"]){
					$("#modal_confirmacion").modal('hide');
					showMessage('msg_medicion_'+maq,"La Orden de Trabajo ha finalizado exitosamente!","alert-success");
					$('html, body').animate({
						scrollTop: $('#msg_medicion_'+maq).offset().top
					}, 1500);
					$('#ope_id_'+maq+'>option[value=0]').prop("selected",true);
					$('#rem_id_'+maq+' option:selected').remove();
					$('#rem_id_'+maq).val('0').trigger('change.select2');
					$('#pro_id_'+maq+',#pro_descripcion_'+maq+',#pro_medida_'+maq+',#rem_nextid_'+maq+',#col_descripcion_'+maq).val("");
					$('#bob_id_'+maq+', #bob_numero_'+maq).val("");
					$('#bob_metro_imp_'+maq+',#bob_peso_imp_'+maq).val("");
					$('#mei_metro_'+maq+', #mei_ancho_plano_'+maq+', #mei_cat_blanca_'+maq+', #mei_cat_color_'+maq).val("");
					$('#mei_vis_1_'+maq+', #mei_vis_2_'+maq+', #mei_vis_3_'+maq).val("");
					$('#mei_vis_4_'+maq+', #mei_vis_5_'+maq+', #mei_vis_6_'+maq).val("");
					$('#mei_vis_7_'+maq+', #mei_vis_8_'+maq+', #mei_temp_infrarojo_'+maq).val("");
					$('#mei_temp_tablero_'+maq+', #mei_temp_area_'+maq+', #mei_hume_area_'+maq).val("");
					$('#historial_medicion_'+maq+' #tabla_historial_medicion,#historial_revision_'+maq+' #tabla_historial_revision').html("");
					$('#historial_medicion_'+maq+',#historial_revision_'+maq).hide();
				}else{
					showMessage('msg_medicion_'+maq,"No se pudo finalizar el proceso, inténtelo nuevamente!","alert-danger");
					$('html, body').animate({
						scrollTop: $('#msg_medicion_'+maq).offset().top
					}, 1500);
				}
			}
		});
	}else{
		showMessage('msg_medicion_'+maq,"Debe haber seleccionado una Orden de Trabajo!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+maq).offset().top
		}, 1500);
	}
}
function imprimirEtiqueta(){
	let maq = $("#maq_id").val();
	let mediciones = $('#historial_medicion_'+maq+' #tabla_mediciones tbody tr').length;	
	let seguir = true;
	if($.trim($('#bob_id_'+maq).val())=="" && $.trim($('#bob_id_'+maq).val())=="0"){
		seguir = false;
		showMessage('msg_medicion_'+maq,"Debe haber creado una Bobina!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+maq).offset().top
		}, 1500);
	}
	if($.trim($('#bobinaGuardada_'+maq).val())!="si"){
		seguir=false;
		showMessage('msg_medicion_'+maq,"No ha guardado la medición!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+maq).offset().top
		}, 1500);
	}	
	if (mediciones<1){
		seguir = false;
		showMessage('msg_medicion_'+maq,"Debe haber almacenado mediciones!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+maq).offset().top
		}, 1500);
	}
	if($.trim($('#bob_metro_imp_'+maq).val())=="" || $.trim($('#bob_metro_imp_'+maq).val())=="0" || $.trim($('#bob_peso_imp_'+maq).val())=="" || $.trim($('#bob_peso_imp_'+maq).val())=="0"){
		seguir = false;
		showMessage('msg_medicion_'+maq,"Debe haber almacenado la medida y peso de la bobina, para poder imprimir su etiqueta!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+maq).offset().top
		}, 1500);
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
	window.open('/extrusoras_app/etiqueta_impresion/'+$.trim($('#bob_id_'+maq).val())+'/'+$.trim($('#rem_id_'+maq).val())+'/','etiquetaImpresion','toolbar=yes,location=yes,status=yes');
	$('#bob_id_'+maq+',#bob_numero_'+maq).val("");
	$('#bobinaGuardada_'+maq).val("");
	$('#bob_metro_imp_'+maq+',#bob_peso_imp_'+maq).val("");
	$('#historial_medicion_'+maq+' #tabla_historial_medicion,#historial_revision_'+maq+' #tabla_historial_revision').html("");
	$('#historial_medicion_'+maq+',#historial_revision_'+maq).hide();	
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