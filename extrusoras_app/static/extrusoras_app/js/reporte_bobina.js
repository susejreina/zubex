$(document).ready(function() {
	$("#loading").hide();
	$("#start_date, #end_date").datetimepicker({format: 'yyyy-mm-dd hh:ii'});	
	$("body").on("change","#dep_id",cambiarMaquinas);
	$("body").on("click","#search",search);
	$("body").on("click","#export",exportar);
	$("body").on("click","#print",function(){
		printReport();
	});
	$("body").on("click","[name=options]",function(){
		obj = $(this);
		$("[name=options]").removeClass();
		obj.addClass("selected");
		if(obj.attr("id")=="no_group"){
			$("#tabla_search_result_no_group").show();
			$("#tabla_search_result_group").hide();
		}else{
			$("#tabla_search_result_no_group").hide();
			$("#tabla_search_result_group").show();
		}
	});
	$("[name=options]").hide();
});
function printReport() {
	var contenido = '<header class="header"><img src="/static/extrusoras_app/img/logo.png" width="220" height="150" class="float-left" alt="Zubex" title="Zubex"><div class="title" id="title">Reporte de '+$("#dep_id option:selected").text()+'<br />';
	if($("#maq_id").val()!="0"){
		contenido += 'Máquina: '+$("#maq_id option:selected").text()+' <br />';
	}
	if($("#start_date").val()!="" && $("#end_date").val()!=""){
		contenido += 'Fecha: Desde el '+$("#start_date").val()+' al '+$("#end_date").val()+'<br />';
	}else if($("#start_date").val()!=""){
		contenido += 'Fecha: Desde el '+$("#start_date").val()+'<br />';
	}else if($("#end_date").val()!=""){
		contenido += 'Fecha: Hasta el '+$("#end_date").val()+'<br />';
	}	
	contenido += '</div></header>';
	contenido += '<div>';
	contenido += '<table class="impresionTabla">';
	if($(".selected").text()=="Agrupado"){
		contenido += $("#tabla_mediciones_group").html();
	}else{
		contenido += $("#tabla_mediciones").html();
	}
	contenido += '</table>';
	contenido += '</div>';
	var contenidoOriginal= document.body.innerHTML;
	document.body.innerHTML = contenido;
	window.print();
	document.body.innerHTML = contenidoOriginal;
	$("#start_date, #end_date").datetimepicker({format: 'yyyy-mm-dd hh:ii'});	
}
function search(){
	if($("#dep_id").val()=="0"){
		showMessage("msg_result","Seleccione el proceso.","alert-danger",true);
	}else{
		$("#search_result").hide();
		$("#loading").show();
		$.ajax({
			url: '/extrusoras_app/ajax/searchReporteBobina/',
			dataType: 'json',
			type: 'POST',
			data:{
				'dep_id': $("#dep_id").val(),
				'maq_id': $("#maq_id").val(),
				'start_date': $("#start_date").val(),
				'end_date': $("#end_date").val(),
			},
			success: function (data) {
				if(data["results"]!=""){
					let $msg = "Resultados para el proceso "+$("#dep_id>option:selected").text();
					$("[name=options]").show();
					if($("#maq_id").val()!="0"){
						$msg += ", en la máquina "+$("#maq_id>option:selected").text();
					}
					if($("#start_date").val()!="" && $("#end_date").val()!=""){
						$msg += ", en el rango de fechas del "+$("#start_date").val()+" al "+$("#end_date").val();
					}else if($("#start_date").val()!=""){
						$msg += ", a partir del "+$("#start_date").val();
					}else if($("#end_date").val()!=""){
						$msg += ", hasta el "+$("#end_date").val();
					}
					showMessage("msg_result",$msg,"alert-success",false);

					if($("[name=options].selected").attr("id")=="nogroup"){
						$("#tabla_search_result_group").show();
						$("#tabla_search_result_no_group").hide();
					}else{
						$("#tabla_search_result_group").hide();
						$("#tabla_search_result_no_group").show();
					}

					//no agrupado
					$("#tabla_search_result_no_group").html(headerReport());
					data["results"].sort(function (a, b) {
						if (a.id > b.id) {
							return 1;
						}
						if (a.id < b.id) {
							return -1;
						}
						// a must be equal to b
						return 0;
					});
					for($i=0;$i<data["results"].length;$i++){
						b = data["results"][$i];
						$row = rowReport(b.fecha, b.id, b.remision, b.codigo, b.numero, b.peso, b.medida, b.metro);
						$("#tabla_mediciones").append($row);
					}
					//agrupado
					$("#tabla_search_result_group").html(headerReportGroup());
					pedido = ""
					
					totalTotalPeso = 0;
					var groupMedicion = new Array();
					for($i=0;$i<data["results"].length;$i++){
						encontrado = -1;
						b = data["results"][$i];
						for($j=0;$j<groupMedicion.length;$j++){
							if(b.remision==groupMedicion[$j][1]){
								encontrado=$j;
							}
						}
						metro =  parseFloat(b.metro);
						if(b.peso!=0){
							pesoPeso = b.peso.substr(0,b.peso.length-2);
						}else{
							pesoPeso = 0
						}
						totalTotalPeso += parseFloat(pesoPeso);
						if(encontrado===-1){
							groupMedicion.push([b.fecha,b.remision,b.codigo,b.descripcion,1, parseFloat(pesoPeso),b.medida,metro]);
						}else{
							groupMedicion[encontrado][4]=groupMedicion[encontrado][4]+1;
							groupMedicion[encontrado][5]=groupMedicion[encontrado][5]+parseFloat(pesoPeso);
							groupMedicion[encontrado][7]=groupMedicion[encontrado][7]+metro;
						}
					}
					for($j=0;$j<groupMedicion.length;$j++){
						$row = rowReportGroup(groupMedicion[$j][0], groupMedicion[$j][1], groupMedicion[$j][2], groupMedicion[$j][3], groupMedicion[$j][4], groupMedicion[$j][5], groupMedicion[$j][6], groupMedicion[$j][7]);
						totalTotalBobinas = data["results"].length;
						$("#tabla_mediciones_group").append($row);
					}

					$("#tabla_mediciones_group").append(footerReportGroup(totalTotalBobinas,totalTotalPeso));
					$("#loading").hide();
					$("#search_result").show();
				}else{
					$("#loading").hide();
					$("[name=options]").hide();
					$("#tabla_search_result_no_group,#tabla_search_result_group").html("");
					showMessage("msg_result","No se encontraron resultados","alert-danger",true);
				}
			}
		});
	}
}
function cambiarMaquinas(){
	let $id = $(this).val();
	$("#maq_id>option:not([value=0])").each(function(){$(this).remove();});
	if($id!=0){
		let $arrMaquinas = $("#lista_maquinas").val().split("|");
		for($i=0;$i<$arrMaquinas.length;$i++){
			m = $arrMaquinas[$i].split(":");
			if($id==m[0]){
				$("#maq_id").append('<option value="'+m[1]+'">'+m[2]+'</option>');
			}
		}
	}
}
function headerReport(){
	let $header = '<table id="tabla_mediciones" class="user-table table100p mb15">';
	$header += '<tr>';
	$header += '<th>Fecha</th>';
	$header += '<th>ID Bobina</th>';
	$header += '<th>Pedido</th>';
	$header += '<th>Código</th>';
	$header += '<th># Bobina</th>';
	$header += '<th>Peso</th>';
	$header += '<th>Medida</th>';
	$header += '<th>Metro</th>';
	$header += '</tr>';
	$header += '</table>';
	return $header;
}
function rowReport(fecha, id, pedido, codigo, bobina, peso, medida, metro){
	if(peso==null){
		peso="";
	}
	if(medida==null){
		medida="";
	}
	let $row = '<tr>';
	$row += '<td>'+fecha+'</td>';
	$row += '<td>'+id+'</td>';
	$row += '<td>'+pedido+'</td>';
	$row += '<td>'+codigo+'</td>';
	$row += '<td>'+bobina+'</td>';
	$row += '<td>'+peso+'</td>';
	$row += '<td>'+medida+'</td>';
	$row += '<td>'+metro+'</td>';
	$row += '</tr>';
	return $row;
}
function headerReportGroup(){
	let $header = '<table id="tabla_mediciones_group" class="user-table table100p mb15">';
	$header += '<tr>';
	$header += '<th>Fecha</th>';
	$header += '<th>Pedido</th>';
	$header += '<th>Código</th>';
	$header += '<th>Descripción</th>';
	$header += '<th>Cantidad</th>';
	$header += '<th>Peso</th>';
	$header += '<th>Medida</th>';
	$header += '<th>Metro</th>';
	$header += '</tr>';
	$header += '</table>';
	return $header;
}
function rowReportGroup(fecha, pedido, codigo, descripcion, bobina, peso, medida, metro){
	if(peso==null){
		peso="";
	}
	if(medida==null){
		medida="";
	}
	let $row = '<tr>';
	$row += '<td>'+fecha+'</td>';
	$row += '<td>'+pedido+'</td>';
	$row += '<td>'+codigo+'</td>';
	$row += '<td>'+descripcion+'</td>';
	$row += '<td>'+bobina+'</td>';
	$row += '<td>'+peso.toFixed(3)+' Kg</td>';
	$row += '<td>'+medida+'</td>';
	$row += '<td>'+metro+'</td>';
	$row += '</tr>';
	return $row;
}
function footerReportGroup(totalBobinas,totalPeso){
	$footer = '<tr>';
	$footer += '<th>Total</th>';
	$footer += '<th colspan="3"></th>';
	$footer += '<th>'+totalBobinas+'</th>';
	$footer += '<th>'+totalPeso.toFixed(3)+' Kg</th>';
	$footer += '<th colspan="2"></th>';
	$footer += '</tr>';
	$footer += '</table>';
	return $footer;
}
function showMessage(objeto,msg,clase,del){
	let $obj = $("#"+objeto);
	$obj.removeClass().addClass("alert "+clase).html(msg).show();
	if(del){
		setTimeout(function(){$obj.hide();}, 3000);
	}
}
function exportar(){
	$("#form_reporte_bobina").attr("action","/extrusoras_app/reporte_bobinas_excel/");
	$("#form_reporte_bobina").submit();
}