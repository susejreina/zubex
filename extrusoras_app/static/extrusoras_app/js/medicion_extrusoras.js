$(document).ready(function() {
	let maq_id = $("#list_maquinas>li:first").attr("data-id");
	let maq_nombre = $("#list_maquinas>li:first").attr("data-nombre");
	$("[name=msg_bobina],[name=msg_medicion]").hide();
	$('[name=divmaquina]:not(#maq_'+maq_id+')').hide();
	$("#list_maquinas>li:first").addClass("current");
	$("#maq_id").val(maq_id);
	$("#title").text(maq_nombre);
	$("#list_maquinas>li").click(marcarMaquina);

	$("[name=rem_id]").change(cargarDatosRemision);
	$("[name=nueva_bobina]").on("click",function(e){e.preventDefault();nuevaBobina($(this));});
	$("[name=guardar_bobina]").on("click",function(e){e.preventDefault();guardarBobina($(this));});
	$("[name=guardar_mediciones]").on("click",function(e){e.preventDefault();guardarMedicion($(this));});
	$("[name=cancelar_bobina]").on("click",limpiarCamposBobina);
	$("[name=historial_medicion],[name=historial_revision]").hide();
	$("#modal_revision, #modal_listar_bobinas, #modal_confirmacion, #modal_confirmacion_impresion").modal('hide');
	$("button[name=revision]").on("click",mostrarRevision);
	$("#guardar_revision").on("click",function(e){e.preventDefault();guardarRevision();});
	$("[name=listar_bobina]").on("click",function(e){e.preventDefault();listarBobinas($(this));});

	$("[name=finalizar_orden]").on("click",function(e){e.preventDefault();finalizarOrden();});
	$("#modal_confirmacion").on("click","#cerrar_orden",function(e){e.preventDefault();cerrarOrden();});

	$("[name=imprimir_extrusora]").on("click",imprimirExtrusora);
	$("#modal_confirmacion_impresion").on("click","#confirm_new_bobina",function(e){
		e.preventDefault();
		let id = $("#maq_id").val();
		$("#modal_confirmacion_impresion").modal('hide');
		nuevaBobina($("#nueva_bobina_"+id));
	});
	$("#modal_confirmacion_impresion").on("click","#confirm_close_process",function(e){
		$("#modal_confirmacion_impresion").modal('hide');
		e.preventDefault();
		$("#modal_confirmacion").modal('show');
	});

	$(".js-example-basic-single").select2();

	//Validaciones de tipo de dato
	$("[name=med_enc_hor],[name=med_enc_ver],[name=med_cal_fro],[name=med_cal_rev]").on("keypress",integerNumber);
	$("[name=med_metros],[name=med_ancho],[name=med_temperatura],[name=bob_metros],[name=bob_peso]").on("keypress",floatNumber);
	$("#mimensaje").hide();

	//Habilitando campos
	$("[name=med_metros],[name=med_ancho]").each(function(){
		if($(this).attr("id").split("_")[3]!=1){
			$(this).prop("disabled",true);
		}
	});
	$("[name=med_ancho]").on("blur",activarNuevoRegistro);
});
function activarNuevoRegistro(){
	let qtyMediciones = 5;
	let nro = parseInt($(this).attr("id").split("_")[3]);
	let maq = $(this).attr("id").split("_")[2];
	if(nro<qtyMediciones){
		if($.trim($("#med_metros_"+maq+"_"+nro).val())!="" && $.trim($("#med_ancho_"+maq+"_"+nro).val())!=""){
			nro = nro + 1;
			$("#med_metros_"+maq+"_"+nro).prop("disabled",false);
			$("#med_ancho_"+maq+"_"+nro).prop("disabled",false);
			if(nro>2){
				$("#med_metros_"+maq+"_"+nro).focus();
			}
		}
	}
}
function mostrarRevision(){
	id = $("#maq_id").val();
	$("#username>option[value=0]").prop("selected",true);
	if($.trim($('#bob_id_'+id).val())!="" && $.trim($('#bob_id_'+id).val())!="0"){
		if($('#historial_medicion_'+id+' #tabla_mediciones').length>0){
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
			showMessage('msg_medicion_'+id,"Debe haber guardado alguna medición!","alert-warning");
			$('html, body').animate({
				scrollTop: $('#msg_medicion_'+id).offset().top
			}, 1500);
		}
	}else{
		showMessage('msg_medicion_'+id,"Debe haber creado una Bobina!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+id).offset().top
		}, 1500);
	}
}
function limpiarCamposBobina(){
	var id = $("#maq_id").val();
	$('#bob_peso_'+id+',#bob_metros_'+id+',#bob_observacion_'+id).val("");
	if($('#historial_medicion_'+id+' #tabla_mediciones').length<=0){
		$.ajax({
			url: '/extrusoras_app/ajax/removeBobina/',
			dataType: 'json',
			type: 'POST',
			data:{
				'bob_id': $('#bob_id_'+id).val(),
			},
			success: function (data) {
				if(data.eliminado){
					$('#bob_id_'+id+',#bob_numero_'+id+',#bob_fecha_'+id+',#bob_hora_'+id+',#bob_lote_'+id).val("");
				}
			}
		});
	}
}
function cargarDatosRemision(){
	var id = $(this).attr("id").split("_")[2];
	if($(this).val()!=0 && $.trim($('#ope_id_'+id).val())!="0"){
		let $data_rem = $('#rem_id_'+id+'>option:selected').attr("data-rem").split("|");
		$('#pro_id_'+id).val($data_rem[0]);
		$('#pro_descripcion_'+id).val($data_rem[1]);
		$('#pro_medida_'+id).val($data_rem[2]+" "+$data_rem[3]);
		if($data_rem[4]=="None"){$data_rem[4]="";}
		$('#rem_nextid_'+id).val($data_rem[4]);
		$('#col_descripcion_'+id).val($data_rem[5]);
		getBobina(id,$('#rem_id_'+id).val(),$('#ope_id_'+id).val());
	}else{
		showMessage('msg_bobina_'+id,"Seleccione el Operario y la Orden de Trabajo!","alert-warning");
		$('#pro_id_'+id+',#pro_descripcion_'+id+',#pro_medida_'+id+',#rem_nextid_'+id+',#col_descripcion_'+id).val("");
	}
}
function getBobina(id,remid,opeid){
	$.ajax({
		url: '/extrusoras_app/ajax/nuevaBobina/',
		dataType: 'json',
		type: 'POST',
		data:{
			'rem_id': remid,
			'ope_id': opeid,
			'maq_id': id
		},
		success: function (data) {
			if(data["bobina"].numero!="1"){
				$('#msg_bobina_'+id).removeClass();
				$('#msg_bobina_'+id).addClass("alert alert-warning");
				$('#msg_bobina_'+id).text("Bobina creada satisfactoriamente!");
			}
			$('#bob_id_'+id).val(data["bobina"].id);
			$('#bob_numero_'+id).val(data["bobina"].numero);
			$('#bob_fecha_'+id).val(data["bobina"].fecha);
			$('#bob_hora_'+id).val(data["bobina"].hora);
			$('#bob_lote_'+id).val(data["bobina"].lote);
			$('#bob_metros_'+id+', #bob_peso_'+id+', #bob_observacion_'+id).val("");
			$('#historial_medicion_'+id+' #tabla_historial_medicion,#historial_revision_'+id+'#tabla_historial_revision').html("");
			$('#historial_medicion_'+id+',#historial_revision_'+id).hide();
			if(data["mediciones"].length>0){
				let $header = headerMedicionBobinas();
				$('#historial_medicion_'+id+' #tabla_historial_medicion').html($header);
				$('#historial_medicion_'+id).show();
				for($i=0;$i<data["mediciones"].length;$i++){
					$row = rowMedicionBobina($('#bob_id_'+id).val(), data["mediciones"][$i]["numero"],
					data["mediciones"][$i]["fecha"], data["mediciones"][$i]["hora"], data["mediciones"][$i]["metro"],
					data["mediciones"][$i]["ancho"], data["mediciones"][$i]["cal_fro"],	data["mediciones"][$i]["cal_rev"],
					data["mediciones"][$i]["enc_hor"], data["mediciones"][$i]["enc_ver"], data["mediciones"][$i]["deslamine"],
					data["mediciones"][$i]["temperatura"]);
					$('#historial_medicion_'+id+' #tabla_mediciones').append($row);
				}
			}
		}
	});
}
function nuevaBobina(obj){
	var id = obj.attr("id").split("_")[2];
	if($.trim($('#rem_id_'+id).val())!="0" && $.trim($('#ope_id_'+id).val())!="0"){
		getBobina(id,$('#rem_id_'+id).val(),$('#ope_id_'+id).val());
	}else{
		showMessage('msg_bobina_'+id,"Seleccione el Operario y la Orden de Trabajo!","alert-warning");
	}
}
function guardarBobina(obj){
	var id = obj.attr("id").split("_")[2];
	if($.trim($('#bob_id_'+id).val())!="" && $.trim($('#bob_id_'+id).val())!="0"){
		if($.trim($('#bob_peso_'+id).val())=="" && $.trim($('#bob_metros_'+id).val())==""
		   && $.trim($('#bob_observacion_'+id).val())==""){
				showMessage('msg_bobina_'+id,"Debe indicar los valores a almacenar.","alert-warning");
				$('html, body').animate({
					scrollTop: $('#msg_bobina_'+id).offset().top
				}, 1500);
				return false;
		}
		let intFields = ['#bob_metros_'+id, '#bob_peso_'+id];
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
			showMessage('msg_bobina_'+id,msg+" debe ser numérico!","alert-warning");
			return false;
		}
		$.ajax({
			url: '/extrusoras_app/ajax/guardarBobina/',
			dataType: 'json',
			type: 'POST',
			data:{
				'maq_id': id,
				'ope_id': $('#ope_id_'+id).val(),
				'bob_id': $('#bob_id_'+id).val(),
				'bob_metros': $('#bob_metros_'+id).val(),
				'bob_peso': $('#bob_peso_'+id).val(),
				'bob_observacion': $('#bob_observacion_'+id).val(),
				'dep_id': 8,
			},
			success: function (data) {
				if(data["guardado"]){
					$("#bobinaGuardada_"+id).val("si");
					showMessage('msg_bobina_'+id,"Se ha almacenado la Bobina correctamente!","alert-success");
					$('html, body').animate({
						scrollTop: $('#msg_bobina_'+id).offset().top
					}, 1500);
					$('#bob_lote_'+id).val(data["guardado"]["lote"]);
				}else{
					showMessage('msg_bobina_'+id,"Problemas al almacenar la Bobina. Verifique los datos e inténtelo nuevamente!","alert-danger");
					$('html, body').animate({
						scrollTop: $('#msg_bobina_'+id).offset().top
					}, 1500);
				}
			}
		});
	}else{
		showMessage('msg_bobina_'+id,"Debe haber creado una Bobina!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_bobina_'+id).offset().top
		}, 1500);
	}
}
function guardarMedicion(obj){
	var qtyMediciones = 5;
	var id = obj.attr("id").split("_")[2];
	if($.trim($('#bob_id_'+id).val())!="" && $.trim($('#bob_id_'+id).val())!="0"){
		valido = 'si';
		let intFields = ['#med_enc_hor_'+id, '#med_enc_ver_'+id, '#med_cal_fro_'+id,'#med_cal_rev_'+id, '#med_temperatura_'+id];
		let desFields = ["El encogimiento horizontal debe ser numérico!",
										"El encogimiento vertical debe ser numérico!",
										"El calibre frente debe ser numérico!",
										"El calibre reverso debe ser numérico!",
										"La temperatura de túnel debe ser numérico!"];
		let decimalFields = [0, 0, 0, 0, 1];
		for(qM=1;qM<=qtyMediciones;qM++){
			if((valido=='si') && ($.trim($('#med_metros_'+id+'_'+qM).val())=="" || $.trim($('#med_ancho_'+id+'_'+qM).val())=="")){
					showMessage('msg_medicion_'+id,"Las "+qtyMediciones+" mediciones de medida y ancho plano son obligatorias.","alert-warning");
					$('html, body').animate({
						scrollTop: $('#msg_medicion_'+id).offset().top
					}, 2000);
					valido = 'no';
			}
			intFields.push('#med_metros_'+id+'_'+qM,'#med_ancho_'+id+'_'+qM);
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
		if($('#med_enc_hor_'+id).val()!="" || $('#med_enc_ver_'+id).val()!=""){
			if(parseInt($('#med_enc_hor_'+id).val())>100){
				validado = true;
				msg = "El encogimiento horizontal debe ser menor o igual a 100";
			}
			if(validado==false && parseInt($('#med_enc_ver_'+id).val())>100){
				validado = true;
				msg = "El encogimiento vertical debe ser menor o igual a 100";
			}
		}
		if(validado){
			showMessage('msg_medicion_'+id,msg,"alert-warning");
			return false;
		}
		datos = {
			'ope_id': $('#ope_id_'+id).val(),
			'bob_id': $('#bob_id_'+id).val(),
			'rem_id': $('#rem_id_'+id).val(),
			'bob_id': $('#bob_id_'+id).val(),
			'maq_id': id,
			'med_deslamine': $('#med_deslamine_'+id).val(),
			'med_enc_hor': $('#med_enc_hor_'+id).val(),
			'med_enc_ver': $('#med_enc_ver_'+id).val(),
			'med_cal_fro': $('#med_cal_fro_'+id).val(),
			'med_cal_rev': $('#med_cal_rev_'+id).val(),
			'med_temperatura': $('#med_temperatura_'+id).val(),
		}
		datos.med_metros = $('#med_metros_'+id+'_1').val()+'|';
		datos.med_ancho = $('#med_ancho_'+id+'_1').val()+'|';
		for(qM=2;qM<=qtyMediciones;qM++){
			datos.med_metros+=$('#med_metros_'+id+'_'+qM).val()+'|';
			datos.med_ancho+=$('#med_ancho_'+id+'_'+qM).val()+'|';
		}
		$.ajax({
			url: '/extrusoras_app/ajax/guardarMedicionExtrusora/',
			dataType: 'json',
			type: 'POST',
			data: datos,
			success: function (data) {
				if(data["medicion"].length>0){
					showMessage('msg_medicion_'+id,"Mediciones almacenadas correctamente!","alert-success");
					$('html, body').animate({
						scrollTop: $('#msg_medicion_'+id).offset().top
					}, 1500);
					if($('#historial_medicion_'+id+' #tabla_mediciones').length<=0){
						let $header = headerMedicionBobinas();
						$('#historial_medicion_'+id+' #tabla_historial_medicion').html($header);
						$('#historial_medicion_'+id).show();
					}
					for(j=0;j<data["medicion"].length;j++){
						let $row = rowMedicionBobina($('#bob_id_'+id).val(),
						data["medicion"][j].numero, data["medicion"][j].fecha,
						data["medicion"][j].hora, data["medicion"][j].metro,
						data["medicion"][j].ancho, data["medicion"][j].cal_fro,
						data["medicion"][j].cal_rev, data["medicion"][j].enc_hor,
						data["medicion"][j].enc_ver, data["medicion"][j].deslamine,
						data["medicion"][j].temperatura);
						$('#historial_medicion_'+id+' #tabla_mediciones').append($row);
					}

					$('[id^=med_metros_'+id+'], [id^=med_ancho_'+id+']').val("");
					$('#med_enc_hor_'+id+', #med_enc_ver_'+id).val("");
					$('#med_cal_fro_'+id+', #med_cal_rev_'+id+', #med_temperatura_'+id).val("");
					$('#med_deslamine_'+id+'>option[value=""]').prop("selected",true);
					$('[id^=med_metros_'+id+'], [id^=med_ancho_'+id+']').each(function(){
						if($(this).attr("id").split("_")[3]!=1){
							$(this).prop("disabled",true);
						}
					});
				}else{
					showMessage('msg_medicion_'+id,"Problemas al almacenar la medición!","alert-danger");
					$('html, body').animate({
						scrollTop: $('#msg_medicion_'+id).offset().top
					}, 1500);
				}
			}
			});
	}else{
		showMessage('msg_medicion_'+id,"Debe haber creado una Bobina!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+id).offset().top
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
	$header += '<th>Calibre frente</th>';
	$header += '<th>Calibre reverso</th>';
	$header += '<th>Encog. H.</th>';
	$header += '<th>Encog V.</th>';
	$header += '<th>Deslamine</th>';
	$header += '<th>Temp Túnel</th>';
	$header += '</tr>';
	$header += '</table>';
	return $header;
}
function rowMedicionBobina(id_bobina, nro, fecha, hora, metro, ancho, cal_fro,
	cal_rev, enc_hor, enc_ver, deslamine, temperatura){
	if(deslamine=="S"){
		deslamine = "SI";
	}else if(deslamine=="N"){
		deslamine = "NO";
	}else{
		deslamine = "";
	}
	let $row = '<tr>';
	$row += '<td>'+id_bobina+'</td>';
	$row += '<td>'+nro+'</td>';
	$row += '<td>'+fecha+'</td>';
	$row += '<td>'+hora+'</td>';
	$row += '<td>'+metro+'</td>';
	$row += '<td>'+ancho+'</td>';
	$row += '<td>'+cal_fro+'</td>';
	$row += '<td>'+cal_rev+'</td>';
	$row += '<td>'+enc_hor+'</td>';
	$row += '<td>'+enc_ver+'</td>';
	$row += '<td>'+deslamine+'</td>';
	$row += '<td>'+temperatura+'</td>';
	$row += '</tr>';
	return $row;
}
function guardarRevision(){
	let id = $("#maq_id").val();
	if($.trim($('#bob_id_'+id).val())!="" && $.trim($('#bob_id_'+id).val())!="0"){
		$.ajax({
	        url: '/extrusoras_app/ajax/guardarRevision/',
	        dataType: 'json',
	        type: 'POST',
	        data:{
	            'bob_id': $('#bob_id_'+id).val(),
							'dep_id': 8,
							'username': $("#username").val(),
							'ope_password': $("#ope_password").val(),
	        },
	        success: function (data) {
						if(data["revision"]["encontrado"]){
							if($('#historial_revision_'+id+' #tabla_revisiones').length<=0){
								let $header = headerHistorialRevisiones();
								$('#historial_revision_'+id+' #tabla_historial_revision').html($header);
								$('#historial_revision_'+id).show();
							}
							let $row = rowHistorialRevisiones($('#bob_id_'+id).val(),data["revision"].id, data["revision"].fecha,data["revision"].hora, data["revision"].usuario);
							$('#historial_revision_'+id+' #tabla_revisiones').append($row);
							$("#ope_password").val("");
							$("#modal_revision").modal('hide');
							showMessage('msg_medicion_'+id,"Revisión almacenada correctamente!","alert-success");
						}else{
							showMessage('msg_medicion_'+id,"Los datos del supervisor no son correctos!","alert-danger");
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
function listarBobinas(obj){
	var id = obj.attr("id").split("_")[2];
	if($.trim($('#rem_id_'+id).val())!="0" && $.trim($('#ope_id_'+id).val())!="0"){
		$.ajax({
			url: '/extrusoras_app/ajax/listarBobinas/',
			dataType: 'json',
			type: 'POST',
			data:{
				'rem_id': $('#rem_id_'+id).val(),
			},
			success: function (data) {
				if(data.length>0){
					let $header = headerListarBobinas();
					$("#list_bobinas").html($header);
					for($i=0;$i<data.length;$i++){
						$row = rowListarBobinas(data[$i]["id"],
							data[$i]["numero"], data[$i]["fecha"],
							data[$i]["hora"], data[$i]["lote"], data[$i]["metro"],
							data[$i]["peso"],data[$i]["observacion"]);
						$("#tabla_bobinas").append($row);
					}
					$("#modal_listar_bobinas").modal('show');
				}else{
					showMessage('msg_bobina_'+id,"No existen bobinas para esta remisión!","alert-warning");
				}
			}
		});
	}else{
		showMessage('msg_bobina_'+id,"Seleccione el Operario y la Orden de Trabajo!","alert-warning");
	}
}
function headerListarBobinas(){
	let $header = '<table id="tabla_bobinas" class="user-table table100p mb15">';
	$header += '<tr>';
	$header += '<th>ID</th>';
	$header += '<th>#</th>';
	$header += '<th>Fecha</th>';
	$header += '<th>Hora</th>';
	$header += '<th>Metros</th>';
	$header += '<th>Peso</th>';
	$header += '</tr>';
	$header += '</table>';
	return $header;
}
function rowListarBobinas(id_bobina, nro, fecha, hora, lote, metros, peso, observacion){
	let $row = '<tr>';
	$row += '<td>'+id_bobina+'</td>';
	$row += '<td>'+nro+'</td>';
	$row += '<td>'+fecha+'</td>';
	$row += '<td>'+hora+'</td>';
	$row += '<td>'+metros+'</td>';
	$row += '<td>'+peso+' Kg</td>';
	$row += '</tr>';
	return $row;
}
function listarRevisiones(id){
	$.ajax({
		url: '/extrusoras_app/ajax/listarRevisiones/',
		dataType: 'json',
		type: 'POST',
		data:{
			'bob_id': $('#bob_id_'+id).val(),
		},
		success: function (data) {
			if(data.length>0){
				let $header = headerHistorialRevisiones();
				$('#historial_revision_'+id+' #tabla_historial_revision').html($header);
				$('#historial_revision_'+id).show();
				for($i=0;$i<data.length;$i++){
					$row = rowHistorialRevisiones($('#bob_id_'+id).val(), data[$i]["id"],
					data[$i]["fecha"], data[$i]["hora"], data[$i]["usuario"]);
					$('#historial_revision_'+id+' #tabla_revisiones').append($row);
				}
			}else{
				$('#historial_revision_'+id).hide();
				$('#historial_revision_'+id+' #tabla_historial_revision').html("");
			}
		}
	});
}
function listarMediciones(id){
	$.ajax({
		url: '/extrusoras_app/ajax/listarMediciones/',
		dataType: 'json',
		type: 'POST',
		data:{
			'bob_id': $('#bob_id_'+id).val(),
		},
		success: function (data) {
			if(data.length>0){
				let $header = headerMedicionBobinas();
				$('#historial_medicion_'+id+' #tabla_historial_medicion').html($header);
				$('#historial_medicion_'+id).show();
				for($i=0;$i<data.length;$i++){
					$row = rowMedicionBobina($('#bob_id_'+id).val(), data[$i]["numero"],
					data[$i]["fecha"], data[$i]["hora"], data[$i]["metro"],
					data[$i]["ancho"], data[$i]["cal_fro"],	data[$i]["cal_rev"],
					data[$i]["enc_hor"], data[$i]["enc_ver"], data[$i]["deslamine"],
					data[$i]["temperatura"]);
					$('#historial_medicion_'+id+' #tabla_mediciones').append($row);
				}
			}else{
				$('#historial_medicion_'+id).hide();
				$('#historial_medicion_'+id+' #tabla_historial_medicion').html("");
			}
		}
	});
}
function finalizarOrden(){
	maq = $("#maq_id").val();
	let mediciones = $('#historial_medicion_'+maq+' #tabla_mediciones tbody tr').length;	
	if (mediciones>5){
		$("#modal_confirmacion").modal('show');
	}else{
		showMessage('msg_medicion_'+maq,"Debe haber almacenado al menos 5 mediciones!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+id).offset().top
		}, 1500);
	}
}
function cerrarOrden(){
	id = $("#maq_id").val();
	if($.trim($('#rem_id_'+id).val())!="" && $.trim($('#rem_id_'+id).val())!="0"){
		$.ajax({
			url: '/extrusoras_app/ajax/finalizarOrdenExtrusora/',
			dataType: 'json',
			type: 'POST',
			data:{
				'rem_id': $('#rem_id_'+id).val(),
			},
			success: function (data) {
				if(data["finalizado"]){
					$("#modal_confirmacion").modal('hide');
					showMessage('msg_medicion_'+id,"La Orden de Trabajo ha finalizado exitosamente!","alert-success");
					$('#ope_id_'+id+'>option[value=0]').prop("selected",true);
					
					rem_actual = $('#rem_id_'+id+' option:selected').val();
					$('[name=rem_id] option[value='+rem_actual+']').remove();
					$('#rem_id_'+id).val('0').trigger('change.select2');
					$('#pro_id_'+id+',#pro_descripcion_'+id+',#pro_medida_'+id+',#rem_nextid_'+id+',#col_descripcion_'+id).val("");
					$('#bob_id_'+id+', #bob_numero_'+id+', #bob_fecha_'+id+', #bob_hora_'+id).val("");
					$('#bob_lote_'+id+', #bob_metros_'+id+', #bob_peso_'+id+', #bob_observacion_'+id).val("");
					$('#med_metros_'+id+', #med_ancho'+id+', #med_enc_hor'+id+', #med_enc_ver'+id).val("");
					$('#med_cal_fro_'+id+', #med_cal_rev_'+id+', #med_temperatura_'+id).val("");
					$('#med_deslamine_'+id).prop("checked",false);
					$('#historial_medicion_'+id+' #tabla_historial_medicion,#historial_revision_'+id+' #tabla_historial_revision').html("");
					$('#historial_medicion_'+id+',#historial_revision_'+id).hide();
				}else{
					showMessage('msg_medicion_'+id,"No se pudo finalizar el proceso, inténtelo nuevamente!","alert-danger");
				}
			}
		});
	}else{
		showMessage('msg_medicion_'+id,"Debe haber creado una Bobina!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+id).offset().top
		}, 1500);
	}
}
function imprimirExtrusora(){
	let id = $("#maq_id").val();
	let mediciones = $('#historial_medicion_'+id+' #tabla_mediciones tbody tr').length;
	let seguir = true;
	if($.trim($('#bob_id_'+id).val())=="" && $.trim($('#bob_id_'+id).val())=="0"){
		seguir = false;
		showMessage('msg_medicion_'+id,"Debe haber creado una Bobina!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+id).offset().top
		}, 1500);
	}
	if($.trim($('#bob_metros_'+id).val())=="" || $.trim($('#bob_metros_'+id).val())=="0" || $.trim($('#bob_peso_'+id).val())=="" || $.trim($('#bob_peso_'+id).val())=="0"){
		seguir = false;
		showMessage('msg_medicion_'+id,"Debe haber almacenado la medida y peso de la bobina, para poder imprimir su etiqueta!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+id).offset().top
		}, 1500);		
	}
	if($.trim($('#bobinaGuardada_'+id).val())!="si"){
		seguir=false;
		showMessage('msg_medicion_'+id,"No ha guardado la medición!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+id).offset().top
		}, 1500);		
	}	
	if (mediciones<6){
		seguir = false;
		showMessage('msg_medicion_'+id,"Debe haber almacenado las 5 mediciones!","alert-warning");
		$('html, body').animate({
			scrollTop: $('#msg_medicion_'+id).offset().top
		}, 1500);
	}
	if(seguir){
		seguir = false;
		window.open('/extrusoras_app/etiqueta_extrusora/'+$.trim($('#bob_id_'+id).val())+'/'+$.trim($('#rem_id_'+id).val())+'/','etiquetaExtrusora','toolbar=yes,location=yes,status=yes');
		$('#bob_id_'+id).val("");
		$('#bobinaGuardada_'+id).val("");
		$('#bob_numero_'+id).val("");
		$('#bob_fecha_'+id).val("");
		$('#bob_hora_'+id).val("");
		$('#bob_lote_'+id).val("");
		$('#bob_metros_'+id+', #bob_peso_'+id+', #bob_observacion_'+id).val("");
		$('#historial_medicion_'+id+' #tabla_historial_medicion,#historial_revision_'+id+' #tabla_historial_revision').html("");
		$('#historial_medicion_'+id+',#historial_revision_'+id).hide();
		$("#modal_confirmacion_impresion").modal('show');

	}
}
