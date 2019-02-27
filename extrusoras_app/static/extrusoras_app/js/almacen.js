$(document).ready(function() {
	$('.js-rem-id').select2({
	  minimumInputLength: 3,
	  ajax: {
	    url: '/extrusoras_app/ajax/searchOrdenTrabajo/',
	    dataType: 'json',
		data: function (params) {
	      var query = {
	        search: params.term,
					type: 'public',
					dep_id: 8,
					almacen: true,
				}
	      return query;
	    }
	  }
	});
	$("#nro_bobina").on("keypress",getNroBobina);
	$("#add_bobina").on("click",addBobina)
	$("#lista_bobinas").on("click","[name=delete_bobina]",deleteBobina);
	$("#asignar_bobina").on("click",asignarBobina);
	$("#panel_list_bobinas").hide();
});
function asignarBobina(){
	let $enviar = true;
	if($("#rem_id").val()=="0"){
		showMessage("msg_bobinas","Debe indicar la orden de trabajo!","alert-warning");
	}
	if($("#ope_id").val()=="0"){
		showMessage("msg_bobinas","Debe indicar el operario!","alert-warning");
	}
	let cant = $("#tabla_bobinas tr").length;
	if (cant<2){
		$enviar=false;
		showMessage("msg_bobinas","Debe indicar las bobinas que va a asignar!","alert-warning");
	}
	if($enviar){
		let $bobinas ="";
		$("#tabla_bobinas tr").each(function(){
			if($(this).attr("id") != undefined){
				$bobinas += ($bobinas!=="") ? "|" : "";
				$bobinas += $(this).attr("id").split("_")[1];
			}
		});
		$.ajax({
	        url: '/extrusoras_app/ajax/asignarBobinas/',
	        dataType: 'json',
	        type: 'POST',
	        data:{
		        'rem_id': $("#rem_id").val(),
						'ope_id': $("#ope_id").val(),
						'bobinas': $bobinas,
	        },
	        success: function (data) {
				let $msg = "";
				if(data["bobina"]["bobinas_no_existe"]!=""){
					$msg += "<span class='text-danger'>";
					$msg += "La(s) siguiente(s) bobina(s) no existe(n) "+data["bobina"]["bobinas_no_existe"]+"<br />";
					$msg += "</span>";
				}
				if(data["bobina"]["bobinas_no"]!=""){
					$msg += "<span class='text-warning'>";
					$msg += "Las bobinas "+data["bobina"]["bobinas_no"]+" ya estaban asignadas. <br />";
					$msg += "</span>";
				}
				if(data["bobina"]["bobinas_si"]!=""){
					$msg += "<span class='text-success'>";
					$msg += "Las bobinas "+data["bobina"]["bobinas_si"]+" han sido asignadas correctamente!.";
					$msg += "</span>";
				}
				showMessage("msg_bobinas",$msg,"alert-success");

				$('#rem_id').val('0').trigger('change.select2');
				$("#lista_bobinas").html("");
				$("#panel_list_bobinas").hide();
	        }
	    });
	}
}
function getNroBobina(e){
	let ascii = e.keyCode;
	if(ascii==13){
		addBobina();
	}
}
function addBobina(){
	if($("#rem_id>option:selected").val()=="0"){
		showMessage("msg_bobinas","Seleccione la orden de trabajo!","alert-warning");
	}else{
		let $nro=$("#nro_bobina").val();
		if($("#tabla_bobinas").length<=0){
			let $h = headerBobinas();
			$("#lista_bobinas").html($h);
			$("#panel_list_bobinas").show();
		}
		let find = false;
		$("#tabla_bobinas>tbody>tr").each(function(){
			if($nro==$(this).attr("id").split("_")[1]){
				find=true;
				return;
			}
		});
		if(find===false){
			let $row = rowBobinas($nro);
			$("#tabla_bobinas>tbody").append($row);
		}
		$("#nro_bobina").val("");
	}
}
function headerBobinas(){
	let $header = '<table id="tabla_bobinas" class="user-table table100p mb15">';
	$header += '<thead>';
	$header += '<tr>';
	$header += '<th scope="col">Número de Bobina</th>';
	$header += '<th scope="col">Eliminar</th>';
	$header += '</tr>';
	$header += '</thead>';
	$header += '<tbody>';
	$header += '</tbody>';
	$header += '</table>';
	return $header;
}
function rowBobinas($nro){
	let $row= '<tr id="bob_'+$nro+'">';
	$row += '<td scope="row">'+$nro+'</td>';
	$row += '<td>';
	$row += '<button id="delete_bobina_'+$nro+'" name="delete_bobina" class="btn btn-primary">';
	$row += '<em class="glyphicon glyphicon-trash"></em></button>';
	$row += '</td>';
	$row += '</tr>';
	return $row;
}
function deleteBobina(){
	let $bobina = $(this).attr("id").split("_")[2];
	$("#bob_"+$bobina).remove();
	if($("#tabla_bobinas>tbody>tr").length<=0){
		$("#panel_list_bobinas").hide();
		$("#lista_bobinas").html("");
	}
}
