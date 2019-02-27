function marcarMaquina(){
	let maq_id = $(this).attr("data-id");
	let maq_nombre = $(this).attr("data-nombre");
	$("ul.list_maquinas>li").removeClass("current");
	$(this).addClass("current");
	$("#maq_id").val(maq_id);
	$("#title").text(maq_nombre);
	$("[name=divmaquina]").hide();
	$("#maq_"+maq_id).show();
}
function showMessage(objeto,msg,clase){
	let $obj = $("#"+objeto);
	$obj.removeClass().addClass("alert "+clase).html(msg).show();
	setTimeout(function(){$obj.hide();}, 3000);
}
function integerNumber(e){
	let ascii = e.keyCode;
	if((ascii>=48 && ascii<=57)||(ascii==127)||(ascii==8)){
		return true;
	}else{
		return false;
	}
}
function floatNumber(e){
	let ascii = e.keyCode;
	if((ascii>=48 && ascii<=57)||(ascii==127)||(ascii==8)||(ascii==46)){
		if(ascii==46){
			n=$(this).val().indexOf(".");
			if(n>=0){
				return false;
			}
		}
		return true;
	}else{
		return false;
	}
}
function validateNumber(objeto){
	let r = false;
	objeto.val($.trim(objeto.val()));
	if(objeto.val()!=""){
		r = isNaN(objeto.val());
	}
	return r;
}
function fixed(objeto,decimales){
	let valor = parseFloat(objeto.val());
	let n = valor.toFixed(decimales);
	objeto.val(n);
}
function getDatosRemision($rem,$maq){
	$.ajax({
		url: '/extrusoras_app/ajax/getRemision/',
		dataType: 'json',
		type: 'POST',
		data:{'rem_id': $rem,},
		success: function (data) {
			if(data["encontrado"]){
				$data_rem = data["remision"];
				if($maq==-1){
					$('#pro_id').val($data_rem["pro_id"]);
					$('pro_descripcion').val($data_rem["pro_descripcion"]);
					$('#pro_medida').val($data_rem["pro_medida"]);
					$('#rem_nextid').val($data_rem["rem_nextid"]);
					$('#col_descripcion').val($data_rem["pro_color"]);
					$('#list_bobinas').val(data["bobinas"]);
				}else{
					$('#pro_id_'+$maq).val($data_rem["pro_id"]);
					$('#pro_descripcion_'+$maq).val($data_rem["pro_descripcion"]);
					$('#pro_medida_'+$maq).val($data_rem["pro_medida"]);
					$('#rem_nextid_'+$maq).val($data_rem["rem_nextid"]);
					$('#col_descripcion_'+$maq).val($data_rem["pro_color"]);
					$('#list_bobinas_'+$maq).val(data["bobinas"]);
				}
			}else{
				showMessage('msg_remision_'+$maq,"No existe el número de Orden de Trabajo "+$rem,"alert-danger");
			}
		}
	});
}