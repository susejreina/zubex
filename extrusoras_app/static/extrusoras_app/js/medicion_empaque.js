$(document).ready(function() {
	$("#id_caja_bobina").val("");
	$("#msg_bobina,#msg_medicion,#msg_remision").hide();

	$('.js-rem-id').select2({
	  minimumInputLength: 3,
	  ajax: {
	    url: '/extrusoras_app/ajax/searchOrdenTrabajo/',
	    dataType: 'json',
		data: function (params) {
	      var query = {
	        search: params.term,
	        type: 'public',
					dep_id: 2,
	      }
	      return query;
	    }
	  }
	});

	$("#rem_id").change(cargarDatosRemision);

	$("#bob_id").on("keypress",getNroBobina);
	$("#bob_id").on("focus",function(){$(this).val("");});
	$("#mimensaje").hide();
	$("[name=guardar_bobina]").on("click",function(e){e.preventDefault();guardarBobina();});
	$("[name=historico_bobina]").on("click",function(e){e.preventDefault();listarHistoricoBobinas($(this));});
	$("#guardar_mediciones").on("click",function(e){e.preventDefault();guardarMedicion($(this));});
	$("#historial_medicion,#historial_revision").hide();
	$("#modal_revision, #modal_confirmacion").modal('hide');
	$("button[name=revision]").on("click",mostrarRevision);
	$("#guardar_revision").on("click",function(e){e.preventDefault();guardarRevision();});
	$("#modal_confirmacion").on("click","#cerrar_orden",function(e){e.preventDefault();cerrarProceso();});
	$("#finalizar_proceso").on("click",function(e){e.preventDefault();finalizarProceso();});
	//Validaciones de tipo de dato
	$("#mem_metro,#mem_kilo").on("keypress",floatNumber);
	$("[name=nro_caja],[name=id_caja_bobina]").on("keypress",integerNumber);
	$("[name=peso],[name=metros]").on("keypress",floatNumber);

	//Agregando las cajas
	$("[name=add_box]").on("click",addBobinaCaja);
	$("[name=save_caja]").on("click",saveCaja);
	$("[name=involved_bobinas]").on("click","[name=del_caja]",deleteBobinaCaja);
	$("[name=cajas]").on("click","[name=edit_caja]",editCajaBobina);
	$("[name=cajas]").on("click","[name=print_label_caja]",imprimeEtiqueta);
});
function imprimeEtiqueta(){
	let caja = $(this).attr("id").split("_")[3];
	window.open('/extrusoras_app/etiqueta_empaque/'+caja+'/'+$.trim($('#rem_id').val())+'/','etiquetaEmpaque','toolbar=yes,location=yes,status=yes');
}
function listarCajas(){
	$.ajax({
		url: '/extrusoras_app/ajax/listarCajas/',
		dataType: 'json',
		type: 'POST',
		data:{
			'departamento': 2,
			'remision': $('#rem_id').val(),
		},
		success: function (data) {
			for(i=0;i<data.length;i++){
				rw = addRowCaja(data[i]["caja"]["id"],data[i]["caja"]["caja"]);
				$('#bobinas_por_cajas').append(rw);
			}
		}
	});
}
function editCajaBobina(){
	let idCaja = $(this).attr("id").split("_")[2];
	$.ajax({
		url: '/extrusoras_app/ajax/editarCajas/',
		dataType: 'json',
		type: 'POST',
		data:{
			'id': idCaja,
		},
		success: function (data) {
			$("#id_caja").val(data.caja.id);
			$("#nro_caja").val(data.caja.caja);
			$("#peso").val(data.caja.peso);
			for(i=0;i<data.bobinas.length;i++){
				let li = addRowBobinaCaja(data.bobinas[i]["bobina"],data.bobinas[i]["metros"]);
				$('#bobinas_involved').append(li);
			}
			$('#cjb_${idCaja}').remove();
		}
	});
}
function deleteBobinaCaja(){
	$(this).parents("li").remove();
}
function saveCaja(){
	if($.trim($('#nro_caja').val())==""){
		showMessage('msg_add_box',"Debe indicar el número de la caja!","alert-warning");
	}else if($.trim($('#peso').val())==""){
		showMessage('msg_add_box',"Debe indicar el peso de la caja!","alert-warning");
	}else if($('#bobinas_involved>li').length<=0){
		showMessage('msg_add_box',"Debe indicar las bobinas involucradas!","alert-warning");
	}else if($("#rem_id").val()==null){
		showMessage("msg_add_box","Seleccione la Orden de Trabajo!","alert-warning");
	}else if($.trim($("#ope_id").val())=="0"){
		showMessage("msg_add_box","Seleccione el Operario!","alert-warning");		
	}else{
		let bobinas = "";
		$('#bobinas_involved>li').each(function(){
			bobinas += $(this).attr("data-id")+":"+$(this).attr("data-metro")+"|";
		});
		bobinas = bobinas.substring(0,bobinas.length-1);
		$.ajax({
			url: '/extrusoras_app/ajax/guardarCajas/',
			dataType: 'json',
			type: 'POST',
			data:{
				'dep_id': 2,
				'id_caja': $('#id_caja').val(),
				'ope_id': $('#ope_id').val(),
				'nro': $('#nro_caja').val(),
				'peso': $('#peso').val(),
				'remision': $('#rem_id').val(),
				'bobina': bobinas
			},
			success: function (data) {
				showMessage('msg_add_box',"Se ha almacenado la caja correctamente!","alert-success");
				rw = addRowCaja(data.id,data.caja);
				$('#bobinas_por_cajas').append(rw);
				$('#nro_caja, #peso').val("");
				$('#id_caja_bobina, #metros').val("");
				$('#id_caja').val("0");
				$('#bobinas_involved>li').each(function(){
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
	rw += '<td><button id="edit_caja_${id}" name="edit_caja" class="btn btn-default grey-box btn-block mb15" type="button">Editar Caja</button></td>';
	rw += '</tr>';
	return rw;
}
function addBobinaCaja(){
	if($("#rem_id").val()==null){
		showMessage("msg_add_box","Seleccione la Orden de Trabajo!","alert-warning");
	}else if($.trim($('#id_caja_bobina').val())==""){
		showMessage('msg_add_box',"Debe indicar el ID de la bobina!","alert-warning");
	}else if($.trim($('#metros').val())==""){
		showMessage('msg_add_box',"Debe indicar los metros de la bobina!","alert-warning");
	}else{
		let $list_bobinas = $('#list_bobinas').val().split(",");
		let found = false;
		for($i=0;$i<$list_bobinas.length;$i++){
			$l = $list_bobinas[$i].split("-");
			if($.trim($('#id_caja_bobina').val())==$l[0]){
				found = true;
				break;
			}
		}
		if(found==false){
			showMessage('msg_add_box',"El número de Bobina "+$('#id_caja_bobina').val()+" no ha sido asignada a esta Orden de Trabajo!","alert-danger");
		}else{
			var encontrado = false;
			$('#bobinas_involved>li').each(function(){
				if($(this).attr("data-id")==$('#id_caja_bobina').val()){
					encontrado = true;
					return;
				}
			});
			if(encontrado==false){
				let id = $('#id_caja_bobina').val();
				let metros = $('#metros').val();
				let li = addRowBobinaCaja(id,metros);
				$('#bobinas_involved').append(li);
				$('#id_caja_bobina').val("");
				$('#metros').val("");
			}else{
				showMessage('msg_add_box',"La bobina ya se había asignado a la caja!","alert-warning");
			}
		}

	}
}
function addRowBobinaCaja(id,metros){
	let li = '<li data-id="'+id+'" data-metro="'+metros+'">';
	li += id;
	li += '&nbsp;<img name="del_caja" id="del_caja_${id}" src="/static/extrusoras_app/img/trash.png" width="17" height="17" alt="Eliminar Bobina" title="Eliminar Bobina"/>';
	li += '</li>';	
	return li;
}
function getNroBobina(e){
	let ascii = e.keyCode;
	if(ascii==13){
		$("#tabla_historial_medicion,#tabla_historial_revision").html("");
		$("#historial_medicion,#historial_revision").hide();
		let v = validarBobina();
		return v;
	}
}
function guardarBobina(){
	if($.trim($('#bob_id').val())!="" && $.trim($('#bob_id').val())!="0"){
		if($.trim($('#bob_metro_imp').val())=="" || $.trim($('#bob_peso_imp').val())==""){
				showMessage('msg_bobina',"Debe indicar los metros y el peso de la bobina.","alert-warning");
				return false;
		}
		let intFields = ['#bob_metro_imp', '#bob_peso_imp'];
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
			showMessage('msg_bobina',msg+" debe ser numérico!","alert-warning");
			return false;
		}
		$.ajax({
	        url: '/extrusoras_app/ajax/guardarBobina/',
	        dataType: 'json',
	        type: 'POST',
	        data:{
						'maq_id': maq,
						'ope_id': $('#ope_id_'+maq),
						'bob_id': $('#bob_id').val(),
						'bob_metros': $('#bob_metro_imp').val(),
						'bob_peso': $('#bob_peso_imp').val(),
						'dep_id': 2,
	        },
	        success: function (data) {
						if(data["guardado"]){
							$("#bobinaGuardada").val("si");
							showMessage('msg_bobina_'+maq,"Se ha almacenado la Bobina correctamente!","alert-success");
							$('html, body').animate({
								scrollTop: $('#msg_bobina_'+maq).offset().top
							}, 1500);
						}else{
							showMessage('msg_bobina',"Problemas al almacenar la Bobina. Verifique los datos e inténtelo nuevamente!","alert-danger");
						}
	        }
    	});
	}else{
		showMessage('msg_bobina',"Debe haber creado una Bobina!","alert-warning");
	}
}
function validarBobina(){
	let $list_bobinas = $("#list_bobinas").val().split(",");
	let $numero = "";
	for($i=0;$i<$list_bobinas.length;$i++){
		$l = $list_bobinas[$i].split("-");
		if($("#bob_id").val()==$l[0]){
			$numero = $l[1];
			break;
		}
	}
	if($numero==""){
		showMessage("msg_bobina","El número de Bobina "+$("#bob_id").val()+" no ha sido asignada a esta Orden de Trabajo!","alert-danger");
		$("#bob_id").val("");
	}
	$("#bob_numero").val($numero);
	$('#bob_metro_imp,#bob_peso_imp,#bobinaGuardada').val("");
	$("#bob_metro_imp").focus();
}
function mostrarRevision(){
	$("#username>option[value=0]").prop("selected",true);
	if($.trim($("#bob_id").val())!="" && $.trim($("#bob_id").val())!="0"){
		if($("#tabla_mediciones").length>0){
			let $tipo = $(this).attr("id");
			if($tipo=="coordinador"){
				$("#username>option[data-type=C]").hide();
				$("#username>option[data-type=S]").show();
			}else{
				$("#username>option[data-type=S]").hide();
				$("#username>option[data-type=C]").show();
			}
			$("#modal_revision").modal('show');
		}else{
			showMessage("msg_medicion","Debe haber guardado alguna medición!","alert-warning");
		}
	}else{
		showMessage("msg_medicion","Debe haber creado una Bobina!","alert-warning");
	}
}
function cargarDatosRemision(){
	if($("#rem_id").val()!=null && $.trim($("#ope_id").val())!="0"){
		let $data_rem = getDatosRemision($("#rem_id").val(),-1);
		listarCajas();
		limpiarFormulario();
	}else{
		showMessage("msg_bobina","Seleccione el Operario y la Orden de Trabajo!","alert-warning");
		$("#pro_id,#pro_descripcion,#pro_medida,#rem_nextid,#col_descripcion").val("");
	}
}
function guardarMedicion(obj){
	if($.trim($("#bob_id").val())!="" && $.trim($("#bob_numero").val())!=""){
		if($.trim($("#mem_metro").val())=="" || $.trim($("#mem_kilo").val())==""){
				showMessage("msg_medicion","La medida y el kilo son obligatorios.","alert-warning");
				return false;
		}

		let intFields = ["#mem_metro", "#mem_kilo",];
		let desFields = ["La medida debe ser numérico!",
						"El kilo plano debe ser numérico!",];
		let decimalFields = [2, 2,];
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
			showMessage("msg_medicion",msg,"alert-warning");
			return false;
		}
		$.ajax({
	        url: '/extrusoras_app/ajax/guardarMedicionEmpaque/',
	        dataType: 'json',
	        type: 'POST',
	        data:{
						'ope_id': $("#ope_id").val(),
						'rem_id': $("#rem_id").val(),
						'bob_id': $("#bob_id").val(),
						'mem_metro': $("#mem_metro").val(),
						'mem_kilo': $("#mem_kilo").val(),
						'mem_apariencia': $("#mem_apariencia").val(),
	        },
	        success: function (data) {
				if(data["medicion"]){
					showMessage("msg_medicion","Medición almacenada correctamente!","alert-success");
					if($("#tabla_mediciones").length<=0){
						let $header = headerMedicionBobinas();
						$("#tabla_historial_medicion").html($header);
						$("#historial_medicion").show();
					}
					let $row = rowMedicionBobina($("#bob_id").val(),
						data["medicion"].numero, data["medicion"].fecha,
						data["medicion"].hora, data["medicion"].metro,
						data["medicion"].kilo, data["medicion"].apariencia);
					$("#tabla_mediciones").append($row);
					$("#mem_metro, #mem_kilo").val("");
					$("#mem_apariencia>option[value='']").prop("selected",true);
				}else{
					showMessage("msg_medicion","Problemas al almacenar la medición!","alert-danger");
				}
	        }
    	});
	}else{
		showMessage("msg_medicion","Debe haber creado una Bobina!","alert-warning");
	}
}
function headerMedicionBobinas(){
	let $header = '<table id="tabla_mediciones" class="user-table table100p mb15">';
	$header += '<tr>';
	$header += '<th>ID</th>';
	$header += '<th>#</th>';
	$header += '<th>Fecha</th>';
	$header += '<th>Hora</th>';
	$header += '<th>Medida</th>';
	$header += '<th>Kilo</th>';
	$header += '<th>Apariencia</th>';
	$header += '</tr>';
	$header += '</table>';
	return $header;
}
function rowMedicionBobina(id_bobina, nro, fecha, hora, medida, kilo, apa){
	if(apa=="S"){
		apa = "SI";
	}else if(apa=="N"){
		apa = "NO";
	}else{
		apa = "";
	}
	let $row = '<tr>';
	$row += '<td>'+id_bobina+'</td>';
	$row += '<td>'+nro+'</td>';
	$row += '<td>'+fecha+'</td>';
	$row += '<td>'+hora+'</td>';
	$row += '<td>'+medida+'</td>';
	$row += '<td>'+kilo+'</td>';
	$row += '<td>'+apa+'</td>';
	$row += '</tr>';
	return $row;
}
function guardarRevision(){
	if($.trim($("#bob_id").val())!="" && $.trim($("#bob_id").val())!="0"){
		$.ajax({
	        url: '/extrusoras_app/ajax/guardarRevision/',
	        dataType: 'json',
	        type: 'POST',
	        data:{
	            'bob_id': $("#bob_id").val(),
							'dep_id': 2,
							'username': $("#username").val(),
							'ope_password': $("#ope_password").val(),
	        },
	        success: function (data) {
				if(data["revision"]["encontrado"]){
					if($("#tabla_revisiones").length<=0){
						let $header = headerHistorialRevisiones();
						$("#tabla_historial_revision").html($header);
						$("#historial_revision").show();
					}
					let $row = rowHistorialRevisiones($("#bob_id").val(),
					    data["revision"].id, data["revision"].fecha,
						data["revision"].hora, data["revision"].usuario);
					$("#tabla_revisiones").append($row);
					$("#ope_password").val("");
					$("#modal_revision").modal('hide');
					showMessage("msg_medicion","Revisión almacenada correctamente!","alert-success");
				}else{
					showMessage("msg_medicion","Los datos del supervisor no son correctos!","alert-danger");
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
	let mediciones = $("#historial_medicion #tabla_mediciones tbody tr").length;
	if (mediciones>1){	
		$("#modal_confirmacion").modal('show');
	}else{
		showMessage('msg_medicion',"Debe haber almacenado al menos 1 mediciones!","alert-warning");
	}
}
function cerrarProceso(){
	if($("#rem_id").val()==null){
		showMessage("msg_medicion","Debe haber procesado una Bobina!","alert-warning");
	}else {
		$.ajax({
			url: '/extrusoras_app/ajax/finalizarOrdenEmpaque/',
			dataType: 'json',
			type: 'POST',
			data:{
				'rem_id': $("#rem_id").val(),
			},
			success: function (data) {
				if(data["finalizado"]){
					$("#modal_confirmacion").modal('hide');
					showMessage("msg_medicion","La Orden de Trabajo ha finalizado exitosamente!","alert-success");
					limpiarFormulario();
					$("#rem_id option:selected").remove();
					$('#rem_id').val('0').trigger('change.select2');
					$("#ope_id>option[value=0]").prop("selected",true);
					$("#bobinas_por_cajas>tbody> tr").each(function(){
						$(this).remove();
					});
				}else{
					showMessage("msg_medicion","No se pudo finalizar el proceso, inténtelo nuevamente!","alert-danger");
				}
			}
		});
	}
}
function limpiarFormulario(){
	$("#pro_id,#pro_descripcion,#pro_medida,#rem_nextid,#col_descripcion").val("");
	$("#bob_id, #bob_numero, #bob_metro_imp, #bob_peso_imp").val("");
	$("#mem_metro, #mem_kilo").val("");
	$("#mem_apariencia>option[value='']").prop("selected",true);
	$("#tabla_historial_medicion,#tabla_historial_revision").html("");
	$("#historial_medicion,#historial_revision").hide();
}
function listarHistoricoBobinas(obj){
	if($.trim($('#bob_id').val())!="" && $.trim($('#bob_id').val())!="0"){
		$.ajax({
			url: '/extrusoras_app/ajax/listarHistoricoBobina/',
			dataType: 'json',
			type: 'POST',
			data:{
				'bob_id': $('#bob_id').val(),
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
					showMessage('msg_bobina',"No existe la bobina o su historico de medidas!","alert-warning");
				}
			}
		});
	}else{
		showMessage('msg_bobina',"Introduzca el número de la bobina!","alert-warning");
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