/**
 * 
 * WorkForce Management
 * 
 * Ver 1.02
 * 2017-Feb-7
 * 
 * Alejandro Perez	alex@solutionseekers.xyz
 * Ariel Garcia leirags@hotmail.com
 * 
 */
var CurrentIP;
var GlobalEditing = false;
var GlobalStartDate = 0;
var GlobalDueDate = 0;
var GlobalLastStatus = 0;
var GlobalSalesOrderTbl;
var GlobalSalesOrderTbl2;
//var Global_myTreeViewTask;
var Global_collapseFirst = [];
var Pm = false;
var whichSOFilters = 'SalesOrd:E';
var whichSOFilters2 = 'SalesOrd:E';
var whichStatusFilters = '1';
var flat1 = null;
var lstEmployeeSelect = '';
var lstTaskStatusFilter = '';
var lstStatusSelect = '';
var WorkWeekend; // Stores if the selected row/taks has set if the Employee will work on Weekends
var taskID; // Stores the task ID displayed for each row
var targetTasks;
var newRole = 0;
var txtRole = '';
var role_labels = {	'3'		:'Administrator',
					'18'	:'Full Access',
					'1023'	:'Sales Director'
					}

function getColorTaskValidate(setColortoRedOutDated, yellow, status) {
	var colors_by_state = {
			'Normal' 	: '',
			'RedA'		: " style='background: #990000; opacity:0.1;' ",
			'Red'		: " style='background-color: rgba(255,0,0,0.7); text-decoration: through;' ",
			'Yellow'	: " style='background: #FF9900;' ",
			'CompletedA': " style='background: #39AC39;' ",
			'Completed' : " style='background-color: rgba(3,250,3,0.7);' ",
			'Cancelled'	: " style='text-decoration: line-through;' "
		};
	
	var flagColorRedRow = 'Normal';

	if (setColortoRedOutDated) 
		flagColorRedRow = 'Red';
	
	if (yellow)
		flagColorRedRow = 'Yellow';
	
	if (status == '2') 
		flagColorRedRow = 'Completed';
	
	if (status == '4') 
		flagColorRedRow = 'Cancelled';
	
	return colors_by_state[flagColorRedRow];
}



/*   $("#contenting").load("/app/site/hosting/scriptlet.nl?script=1393&deploy=1"); */

function getUrl() {
	if(WorkForce_Obj.Env=='SANDBOX'){
		return {
				'RT': '/app/site/hosting/restlet.nl?script=1386&deploy=1',
				'BSL': '/app/site/hosting/scriptlet.nl?script=1481&deploy=1',
				'RT2': '/app/site/hosting/restlet.nl?script=1413&deploy=1',
				'RT3': '/app/site/hosting/restlet.nl?script=1427&deploy=1',
				'wrike': '/app/site/hosting/scriptlet.nl?script=1393&deploy=1',
				'Common':'/app/site/hosting/scriptlet.nl?script=837&deploy=1'
			}
	} else {	
		return {
				'RT': '/app/site/hosting/restlet.nl?script=1307&deploy=1',
				'BSL': '/app/site/hosting/scriptlet.nl?script=1346&deploy=1',
				'RT2': '/app/site/hosting/scriptlet.nl?script=1346&deploy=1',
				'RT3': '/app/site/hosting/restlet.nl?script=1344&deploy=1',
				'wrike': '/app/site/hosting/scriptlet.nl?script=1246&deploy=1',
				'Common':'/app/site/hosting/scriptlet.nl?script=837&deploy=1'
			}
	}
}


// Helper functions....
window.WorkForce_turnOffDebug = function (){ WF_DEBUG = false; }
window.WorkForce_turnOnDebug = function (){ WF_DEBUG = true; }
window.WorkForce_getDebugStatus = function(){ return WF_DEBUG; }
window.WorkForce_turnOffAjaxDebug = function (){ WF_DEBUG_AJAX = false; }
window.WorkForce_turnOnAjaxDebug = function (){ WF_DEBUG_AJAX = true; }
window.WorkForce_getAjaxDebugStatus = function(){ return WF_DEBUG_AJAX; }
window.WorkForce_getMode = function(){ return WORKFORCE_MODE ? 'NORMAL':'TESTING'; }
//------

window.setLevelLoader = function setLevelLoader(level){
	WF_LOADER_LEVEL=level;
	WF_LOADER_AUTO=true;
	$('.loader').show();
	if(WF_DEBUG)
		console.log('setLevelLoader() WF_LOADER_LEVEL:',WF_LOADER_LEVEL,'WF_LOADER_AUTO:',WF_LOADER_AUTO);
}

window.turnOffLoader = function turnOffLoader(){
	if(WF_DEBUG)
		console.log('turnOffLoader() WF_LOADER_LEVEL:',WF_LOADER_LEVEL,'WF_LOADER_AUTO:',WF_LOADER_AUTO);
	
	$('.loader').hide();
	WF_LOADER_LEVEL=0;
	WF_LOADER_AUTO=false;
}
//-----

//---GetAllMyWork>
function getAllMyWork(slice, status, fromFilter) {
	if(WF_DEBUG)
		console.info('getAllMyWork(slice, status, fromFilter)',slice, status, fromFilter);
	if (!status) 
		status = 1;
	// tamSlice asigns the number of records to get and be added to the correspondant table
	var tamSlice = 50;
	$.ajax({
		url: getUrl().RT,
		data: {
			'action': 'getAllMyWork',
			'statusId': status
		}
		// ,
		// headers : {"Authorization" : 'NLAuth nlauth_email="alejandro@solutionseekers.xyz", nlauth_signature="Ordnajela14", nlauth_account="3461650", nlauth_role="18"'}
		,
		dataType: 'json',
		async: true,
		beforeSend: function(data) {
			// if(flat1) 
			// 	flat1.destroy();
			$('.AllMyWork').DataTable().destroy();
			//  if(fromFilter)
			$('.AllMyWork > tbody > tr').remove();
		},
		complete: function(data) {

			//-- $(".loader").hide('fast');
			setTimeout(function() {
				if ($.fn.dataTable.isDataTable('.AllMyWork')) {
					// if(flat1)
					// 	flat1.destroy();
					$('.AllMyWork').DataTable().destroy();
				}
				$('.AllMyWork').DataTable({
					//	"scrollY": "600px"
					"scrollCollapse": true,
					"paging": false,
					"info": true,
					"deferRender": true,
					"order": [
						[4, "asc"]
					],
					"columnDefs": [{
						"width": "10",
						"targets": 8
					}]
				});
				$('table#AllMyWork td:nth-child(11)').hide();
				$('table#AllMyWork th:nth-child(11)').hide();
				//	var flat1 = flatpickr('.toDatePicker');

				flat1 = flatpickr('.toDatePicker', {
					dateFormat: CalendarInputFormat
				}); // initialized picker
			}, 1000);
		},
		success: function(data) {
			//33333333333
			var AllRows = 0;
			var moreslice = tamSlice;
			data.forEach(function(e) {
				AllRows++;
			});

			if (slice == "all") {
				$("table.AllMyWork > tbody > tr ").remove();
				slice = 0;
				moreslice = AllRows;
			} else if (slice != undefined) {
				moreslice = parseInt(slice) + tamSlice;
			} else {
				$("table.AllMyWork > tbody > tr ").remove();
				slice = 0;
			}

			//console.log("There are: " + AllRows + " records");
			if (moreslice < AllRows) {
				$('#AllRegistersMyWorkH1').text(moreslice + " / " + AllRows + " tasks");
				$('#AllRegistersMyWorkH2').text(moreslice + " / " + AllRows + " tasks");
				$('#ButtonLoadMoreAllWork').prop('disabled', false);
			} else {
				$('#AllRegistersMyWorkH1').text(AllRows + " / " + AllRows + " tasks");
				$('#AllRegistersMyWorkH2').text(AllRows + " / " + AllRows + " tasks");
				$('#ButtonLoadMoreAllWork').prop('disabled', true);
			}
			var row;
			var count = 0;
			var ancount = slice
				//data.slice(slice,moreslice).forEach(function (d) {
			data.slice(0, moreslice).forEach(function(d) {
				GlobalStartDate = d.GlobalStartDate;
				GlobarDueDate = d.GlobalDueDate;
				// We get the logged user ID
				var loggedUserID = $('input#custpage_userid').val();
				if (loggedUserID == '') {
					alert('Undetermined user, please login');
				}
				//  console.log(d);
				// We collect the user ID which is current in the active session
				loggedUserID = Math.round(loggedUserID);
				//  This variable will set the suffix for the iterative row on course.
				ancount++;
				count = "myWork" + ancount;
				// Assigment of Work on Weekend status for current task
				WorkWeekend = d.taskWorkWeekend;
				var WorkWeekendDisplay;
				// We save the Work on Weekend state here
				var WorkWeekend = d.taskWorkWeekend;

				// If the employee works on Weekends then make the check input to be marked
				if (WorkWeekend) {
					// This will input something like: $("input[id='WorkOnWeekends_7']").attr('checked', true)
					WorkWeekendDisplay = "<input type='checkbox' onchange='changeWorkOnWeekends.call(this)' id='WorkOnWeekends_" + count + "' name='check' class='check' checked /><p style='font-size:0px;position:absolute;'>true</p>"
				} else {
					WorkWeekendDisplay = "<input type='checkbox' onchange='changeWorkOnWeekends.call(this)' id='WorkOnWeekends_" + count + "' name='check' class='check' /><p style='font-size:0px;position:absolute;'>false</p>"
				}
				var BoolAck;
				if (d.taskAck) {
					BoolAck = "<input type='checkbox' onchange='changeAck.call(this)' id='Ack_" + count + "' name='check' disabled class='check' checked />"
				} else {
					BoolAck = "<input type='checkbox' onchange='changeAck.call(this)' id='Ack_" + count + "' name='check' class='check' />"
				}
				var vFilteredEmployeesList = lstEmployeeSelect.replace(d.taskAssignedID, d.taskAssignedID + ' selected');

				var vFilteredStatusList = lstStatusSelect;
				if (d.taskStatus) {
					vFilteredStatusList = lstStatusSelect.replace(d.taskStatus, d.taskStatus + " selected");
				}

				var vFilteredStatusList = vFilteredStatusList.replace('class="selectTaskStatus"', 'class="selectTaskStatus" title="You won\'t be able to update this task once the status changes to "completed/cancelled"');
				var vFilteredStatusList = vFilteredStatusList.replace('id="selTaskStatus"', 'id="selTaskStatus' + count + '"');
				var StatusTareaTexto = '';
				var StatusTaskLabel = ['','Active','Completed','Deferred','Cancelled'];
				StatusTareaTexto = StatusTaskLabel[d.taskStatus];
				
				var vFilteredStatusList = vFilteredStatusList.replace('</select>', '</select><p  class="kiko" style="font-size:0px;position:absolute;">' + StatusTareaTexto + '</p>');
				//console.log("Status "+count + " : "+d.taskStatus)
				// Impersoned Logged user
				//loggedUserID = 21562;
				// Disable Start Date and Due Date if user ID don't match for the current row
				dtaskStartDate = d.taskStartDate;
				dtaskDueDate = d.taskDueDate;
				dtaskDuration = "<input id='idTask_Duration_" + count + "' onblur='blurDuration.call()' onkeyup='changeDuration.call(this)' data-dependency='" + d.taskDependency + "' data-task='true' data-predecessor='" + d.taskPredecessor +
					"' type='text' size='3' value=" + d.taskDuration + " data-wrikeid='" + d.WrikeID + "' data-salesorder='" + d.SalesOrderID + "'>";
				//dtaskUpdateIcon = "<div id='dico" + count + "' class='GoUpdateDisabled'></div>";
				dtaskUpdateIcon = "<div onclick='clickdico.call(this)' data-task='true' id='dico" + count + "' class='GoUpdateDisabled'></div>";
				//console.log('count = ' + count + ' loggedUserID = ' + loggedUserID + ' d.taskAssignedID = ' +  d.taskAssignedID);
				//console.log('dtaskStarte: ' + dtaskStartDate);
				//console.log("PM : "+Pm);
				if (Pm == false) {
					if ((loggedUserID != d.taskAssignedID) || (d.taskStatus == 2) || (d.taskStatus == 4)) {
						//console.log(vFilteredEmployeesList);
						// Disable Asigned field if user ID don't match for the current row
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="+++" disabled id');
						vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
						vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
						WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
						BoolAck = BoolAck.replace('input type', 'input disabled type');
						vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name'); //selTaskStatus
						dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
						dtaskUpdateIcon = "<div onclick='clickdico.call(this)' data-task='true' id='dico" + count + "' class='GoUpdateDisabled'></div>";
						//dtaskUpdateIcon = "<div id='dico" + count + "' ><button onclick='clickdico()'>Go</button></div>";
					} else {
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="***" id');
						vFilteredStartDate = d.taskStartDate;
						vFilteredDueDate = d.taskDueDate;
					}
				} else {
					if ((d.taskStatus == 2) || (d.taskStatus == 4)) {
						//console.log(vFilteredEmployeesList);
						// Disable Asigned field if user ID don't match for the current row
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="+++" disabled id');
						vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
						vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
						WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
						BoolAck = BoolAck.replace('input type', 'input disabled type');
						vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name'); //selTaskStatus
						dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
						dtaskUpdateIcon = "<div onclick='clickdico.call(this)' data-task='true' id='dico" + count + "' class='GoUpdateDisabled'></div>";
						//dtaskUpdateIcon = "<div id='dico" + count + "' ><button onclick='clickdico()'>Go</button></div>";
					} else {
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="***" id');
						vFilteredStartDate = d.taskStartDate;
						vFilteredDueDate = d.taskDueDate;
					}
				}
				if (d.taskDependency == "startToStart") { // Si la dependencia es startToStart, se desabilita el picker StartDate
					vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
				} else if (d.taskDependency == "startToFinish" || d.taskDependency == "finishToFinish") {
					vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
				}
				//  vFilteredEmployeesList = vFilteredEmployeesList.replace('selectAsignee"', 'selectAsignee" data-rowid="' + count+'"');
				vFilteredEmployeesList = vFilteredEmployeesList.replace('selectAsignee', 'selectAsignee' + count);
				vFilteredEmployeesList = vFilteredEmployeesList.replace('selected >', 'selected>');
				var fTx = vFilteredEmployeesList.split("selected>").pop();
				fTx = fTx.substring(0, fTx.indexOf('<'));
				//	if (d.WrikeLink==undefined) d.WrikeLink = '/app/crm/calendar/task.nl?id='+ d.taskId + '&whence=';

				//console.log ('GlobalStartDate from GetAllMyWork: ' + GlobalStartDate);
				//console.log ('Con el metodo datoparseada sale como ' + d.datoparseada);

				//console.log ('d.setColortoRedOutDated vienen como :' + d.setColortoRedOutDated);
				//console.log ('El tipo de d.setColortoRedOutDated es: ' + typeof d.setColortoRedOutDated)

				//						if (d.setColortoRedOutDated == true) {
				//							console.log ('este dato lo marcamos como Rojo')
				//						} else {
				//							console.log ('este dato se deja normal ')
				//						}

				flagColorRedRow = getColorTaskValidate(d.setColortoRedOutDated, d.yellow, d.taskStatus);


				vFilteredEmployeesList = vFilteredEmployeesList.replace('</label>', '</label><p style="font-size:0px;position:absolute;">' + fTx + '</p>');
				row += "<tr id='" + count + "' data-id=" + d.taskId + " data-userid=" + d.taskAssignedID + " data-toshow='" + d.taskKpiLine + "_" + d.taskKpiItem + "' data-toshowaddress='" + d.taskKpiAddress + "'>" +
					"<td class='gradCell'><b>" + ancount + "</b> - " + d.company + "</td>" +
					"<td align='center' class='gradCell'><a href='#' class='idClickToSalesOrder' data-salesorderID='" + d.SalesOrderID + "'>" + d.SalesOrder + "</a></td>" +
					"<td class='styleToId'" + flagColorRedRow + " align='left'><span id='vtaskID" + count + "' style='display:none'>" + d.taskId + "</span><a href='#' data-taskid='" + d.taskId + "' data-wrikeid='" + d.WrikeID +
					"' class='toOpenWrike'> " + d.taskTitle + "</a></td>" +
					"<td class='styleToEntity' title='" + loggedUserID + " vs " + d.taskAssignedID + "' " + flagColorRedRow + ">" + vFilteredEmployeesList + "</td>" +
					"<td align='center' id='TaskAck_" + count + "' " + flagColorRedRow + ">" + BoolAck + "</td>" +
					"<td id='TaskStatus_" + count + "' " + flagColorRedRow + ">" + vFilteredStatusList + "</td>" +
					"<td " + flagColorRedRow + ">" + vFilteredStartDate + "</td>" +
					"<td " + flagColorRedRow + ">" + vFilteredDueDate + "</td>" +
					"<td align='center' " + flagColorRedRow + ">" + WorkWeekendDisplay + "</td>" +
					"<td align='center' " + flagColorRedRow + ">" + "<p style='font-size:0px;position:absolute;'>" + d.taskDuration + "</p>" + dtaskDuration + "</td>" +
					// +"<td align='center' "+flagColorRedRow+" display='none'>"+dtaskUpdateIcon+"</td>"
					"</tr>";
				// if(WF_DEBUG) console.info('vFilteredStartDate', vFilteredStartDate );
				// if(WF_DEBUG) console.info('vFilteredDueDate', vFilteredDueDate );
			});
			$("table.AllMyWork > tbody").append(row);
		},
		error: function(e) {
			//alert("Ocurrio un error, vuelva a intentarlo! ");
			console.error("GetAllMyWork() error ", e);
		}
	}); 
} // End of GetAllMyWork function
//---GetAllMyWork<

//---GetSalesOrdersbyID>
function GetSalesOrdersbyID(IDTable, idUser, SOStatus, slice) {
	if(WF_DEBUG)
		console.info('GetSalesOrdersbyID(IDTable, idUser, SOStatus, slice)', IDTable, idUser, SOStatus, slice); 	

	if (SOStatus === null && typeof SOStatus === "object") {
		SOStatus = 'AllSOStatus'
		if(WF_DEBUG)
			console.log ('SOStatus = AllSOStatus');
	}
	SOStatus = String(SOStatus)
		//	console.log('SOStatus has been received with the value **: ' + SOStatus + ' of type: ' + typeof (SOStatus));
		//$("table#"+IDTable+"").find('tr:not(:first)').each(function () {
		//$(this).remove();
		//});
	var rtotItems = 0,
		rtotLocations = 0,
		rtotMRR = 0.0,
		rtotNRR = 0.0;
	var formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
	});

	var AllRows = 0;
	var row = '';
	var moreslice = 100;
	
	if (WF_DEBUG_AJAX)
		console.info("ajax action: getMySalesOrders", getUrl().RT );
	
	// Function to get Sales Orders at beggining of execution
	$.ajax({
		url: getUrl().RT,
		data: {
			'action': 'getMySalesOrders',
			'IdUser': idUser,
			'SOStatus': SOStatus
		}
		//, async: true
		,
		dataType: 'json',
		complete: function() {
			//console.log ('You are firing the method GetSalesOrdersbyID on this table: #' + IDTable);
			$('.dataTables_scrollFoot').hide();
			//--$(".loader").fadeOut();

			setTimeout(function() {
				if ($.fn.dataTable.isDataTable('#' + IDTable)) {
					$('#' + IDTable).DataTable().destroy();
				}
				table = $('#' + IDTable + '').DataTable({
					"scrollY": "380px",
					"scrollCollapse": true,
					"paging": false,
					"responsive": true,
					"order": [
						[11, "desc"]
					],
					"footerCallback": function(row, data, start, end, display) {

						var apiCustom = this.api(),
							data;
						// Remove the formatting to get integer data for summation
						var intVal = function(i) {
							return typeof i === 'string' ?
								i.replace(/[\$,]/g, '') * 1 :
								typeof i === 'number' ?
								i : 0;
						};

						pageTotal = apiCustom.column(4, {
							page: 'current'
						}).data().reduce(function(a, b) {
							return intVal(a) + intVal(b);
						}, 0);
						if(WF_DEBUG)
							console.log("Page Total: " + pageTotal);
						$(apiCustom.column(4).footer()).html('<span class="badge">' + pageTotal + '</span>');
						pageTotal = apiCustom.column(5, {
							page: 'current'
						}).data().reduce(function(a, b) {
							return intVal(a) + intVal(b);
						}, 0);
						$(apiCustom.column(5).footer()).html('<span class="badge">' + pageTotal + '</span>');
						pageTotal = apiCustom.column(10, {
							page: 'current'
						}).data().reduce(function(a, b) {
							return intVal(a) + intVal(b);
						}, 0);
						$(apiCustom.column(10).footer()).html('<span class="badge">' + formatter.format(pageTotal) + '</span>');
						pageTotal = apiCustom.column(11, {
							page: 'current'
						}).data().reduce(function(a, b) {
							return intVal(a) + intVal(b);
						}, 0);
						$(apiCustom.column(11).footer()).html('<span class="badge">' + formatter.format(pageTotal) + '</span>');
						pageTotal = apiCustom.column(13, {
							page: 'current'
						}).data().reduce(function(a, b) {
							return intVal(a) + intVal(b);
						}, 0);
						$(apiCustom.column(13).footer()).html('<span class="badge">' + formatter.format(pageTotal) + '</span>');
						pageTotal = apiCustom.column(14, {
							page: 'current'
						}).data().reduce(function(a, b) {
							return intVal(a) + intVal(b);
						}, 0);
						$(apiCustom.column(14).footer()).html('<span class="badge">' + formatter.format(pageTotal) + '</span>');
						$('.dataTables_scrollFoot').show();

					}

				});

				$('[id^=selTaskStatus]').qtip({
					style: {
						classes: 'myCustomClass'
					}
				});
				$('input[type="search"]').attr("placeholder", " SO/Task/Date/Text");
				$('input[type="search"]').css('height', '50%');
				$('input[type="search"]').css('display', 'inline-block');
				$('.select2-search__field').attr("placeholder", " Filter by status of the Sales Orders by clicking on this field");

				// if ($('.tabsalesorder-content img#mymicrophone').length < 1) {
				// 	$('span.select2.select2-container.select2-container--default').after('  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'salesorder\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');
				// }
				// if ($('.tabsalesorder-content img#mymicrophone').length < 2) {
				//
				// 	$('#tableSOcount_filter input[type="search"]').after('  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'salesorder\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');
				// 	$('#salesorder_filter input[type="search"]').after('  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'salesorder\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');
				// }
				// if ($('#mytblTasks_wrapper img#mymicrophone').length < 1) {
				// 	$('#mytblTasks_wrapper input[type="search"]').after('  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'mytblTasks\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');
				// }
				// if ($('#Customsalesorder_wrapper img#mymicrophone').length < 1) {
				// 	$('#Customsalesorder_wrapper input[type="search"]').after('  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'Customsalesorder\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');
				// }
				var DoWeHaveRecords = $("#salesorder td.dataTables_empty").html();
				if (DoWeHaveRecords == 'No data available in table') {
					$("#salesorder td.dataTables_empty").html('<span style="font-size: 16px;">   No records found with this filter, try with another...   </span>');
				}
				//}
			}, 100); //Was 1000... ariel
			//} // End of if IDTable == 'salesorder'

			if (moreslice < AllRows) {
				$('#AllRegistersSalesH1').text(moreslice + " / " + AllRows);
				$('#AllRegistersSalesH2').text(moreslice + " / " + AllRows);
				$('#ButtonLoadMore').prop('disabled', false);
			} else {
				$('#AllRegistersSalesH1').text(AllRows + " / " + AllRows);
				$('#AllRegistersSalesH2').text(AllRows + " / " + AllRows);
				$('#ButtonLoadMore').prop('disabled', true);
			}
			// setTimeout(function () {
			// 		// Readjust the Sales Order table width
			// 		//$('#salesorder_wrapper').css('display','block');
			// 		/* $('.dataTables_scrollHeadInner').css('width','1450px');
			// 		$('.dataTables_scrollFootInner').css('width','1450px'); */
			//
			//
			//
			// 	}, 500);
		},
		beforeSend: function(data) {
			//--$(".loader").fadeIn();
			$('#' + IDTable).DataTable().destroy();
			$('#' + IDTable + ' tbody tr').remove();
			$('.dataTables_scrollFoot').hide();
		},
		success: function(data) {

			WithoutReturnedRecords = data.length;

			//console.log ('En la tabla '+IDTable+' contamos con '+WithoutReturnedRecords+' registros');

			if (slice != undefined) {
				moreslice = parseInt(slice) + 50;
			}
			if (slice == undefined) {
				slice = 0;
			}
			//console.log("slice ="+slice +" moreslice="+moreslice );
			if (IDTable == 'allsalesorder') {
				data.forEach(function(e) {
					AllRows++;
				});
				//console.log("Hay: "+AllRows+"Registros en "+IDTable+"Alex");

			}
			//$('#salesorder_wrapper').css("display", "block");
			//$('#salesorder').css("display", "block");
			data.forEach(function(d) {
				//data.slice(slice,moreslice).forEach(function (d) {
				//	var NumItem = NumberOfItems(d.internalid);
				//	var NumSerAddress = NumberOfServiceAddresses(d.internalid);
				//var NumItem = 0;
				//var NumSerAddress = 0;
				var standardDate = formatDatebyNetsuiteDate(d.soDueDate);
				//console.log('d.sostatus: ' + d.sostatus);
				var colStatus = '';
				var colStatusLabels = {
						'SalesOrd:A' : 'Pending Approval',
						'SalesOrd:B' : 'Pending Fulfillment',
						'SalesOrd:C' : 'Cancelled',
						'SalesOrd:D' : 'Partially Fulfilled',
						'SalesOrd:E' : 'Pending Billing/Partially Fulfilled',
						'SalesOrd:F' : 'Pending Billing',
						'SalesOrd:G' : 'Billed',
						'SalesOrd:H' : 'Closed'
				};
				//console.log('d.sostatus:',d.sostatus,' Label:'+colStatusLabels[d.sostatus]);
				colStatus = colStatusLabels[d.sostatus];
				
				img_url_sanbbox = 'id=6521300&c=3461650&h=58f8ca4c67fada1f48d0';
				img_url_production = 'id=8153908&c=3461650&h=4dfa99e3b987f3f8aad9';
				
				if(WorkForce_Obj.Env=='SANDBOX')
					img_url = img_url_sanbbox;
				else
					img_url = img_url_production;
					
				row += "<tr data-id=" + d.internalid + " data-so='" + d.tranid + "' data-osstatus='" + d.sostatus + "'>" +
					"<td align='middle' class='styleToId' style='vertical-align: middle;'>" +
					"<a href='/app/accounting/transactions/salesord.nl?id=" + d.internalid + "&whence=' title='Click here to edit this sales order' target='_blank' style='z-index:900;'>" +
					"<img src='/core/media/media.nl?"+img_url_sanbbox+"' />" + "</a><br/><span style='font-size:11px;'>" + d.tranid + "</span></td>" +
					"<td style='vertical-align: middle;'>" + d.customer + "</td>" +
					"<td>" + colStatus + "</td>" +
					"<td align='justify' style='vertical-align: middle;'>" + d.description + "</td>" +
					"<td class='rowDataSd' align='center' style='vertical-align: middle;'>" + d.soItems + " </td>" +
					"<td class='rowDataSd' align='center' style='vertical-align: middle;'>" + d.soSA + "</td>" +
					"<td align='middle'>" + d.DaysSinceApproved + "</td>" +
					"<td style='vertical-align: middle;'>" + d.ProjectManager + "</td>" + "<td style='vertical-align: middle;'>" + d.SalesRep + "</td>" +
					"<td style='vertical-align: middle;'>" + d.provengineer + "</td>" +
					"<td class='rowDataSd' title='Monthly Recurring Revenue' align='right' style='vertical-align: middle;'>" + formatter.format(d.MRR) + "</td>" +
					"<td class='rowDataSd' title='Non Recurring Revenue' align='right' style='vertical-align: middle;'>" + formatter.format(d.NRR) + "</td>" +
					"<td style='vertical-align: middle;'>" + dateToStringNetsuite(new Date(standardDate)) + "</td>" +
					"<td style='vertical-align: middle;text-align: right'>" + formatter.format(d.PendingMRR) + "</td>" +
					"<td style='vertical-align: middle;text-align: right'>" + formatter.format(d.PendingNRR) + "</td>" +
					"<td align='justify' style='vertical-align: middle;display:none'> " + d.addrcities + "</td>" +
					"</tr>";


				if(WF_DEBUG)
					console.log("Status " + d.sostatus);
			});
			// console.log(row);
			//console.log("ID TABLE  _______________  "+IDTable);
			$("table#" + IDTable + " > tbody").append(row);
			// console.log("make Append");
			//$("#salesorder.table > tbody").append(row);
		},
		error: function(err) {
			if(WF_DEBUG)
				console.log('err',err);
		}
	}); // End of Ajax
}
//---GetSalesOrdersbyID<


// Function to  list Services Addresses: myUpdatedServicesAddresses
//---ChangeTableServiceAddresses>
function ChangeTableServiceAddresses(WhichSalesOrder) {
	if(WF_DEBUG)
		console.info('ChangeTableServiceAddresses(WhichSalesOrder)', WhichSalesOrder); 	

	if (WF_DEBUG_AJAX)
		console.info("ajax action: getServiceAddresses", getUrl().BSL );
	
	//console.log('WhichSalesOrder para Service Address es: ' + WhichSalesOrder);
	$.ajax({
		//url: '/app/site/hosting/restlet.nl?script=1386&deploy=1'
		url: getUrl().BSL,
		data: {
			'action': 'getServiceAddresses',
			'SO': WhichSalesOrder
		},
		async: false,
		dataType: 'json',
		success: function(data) {
			var row = '';
			if(WF_DEBUG)
				console.log("data", data);
			//console.log('Data stream All Services: ' + data[0]);
			data.forEach(function(d) {
				row += "<tr data-toshow='" + d.id + "'>" +
					"<td align='justify'><input type='checkbox' onchange='SetFilterToTasks.call(this)'/></td>" +
					"<td align='left' class='styleToId' style='vertical-align: middle;'>" + d.name + "</td>" +
					"<td style='vertical-align: middle;'>" + d.address + "</td>" +
					"<td align='justify'>" + d.city + "</td>" +
					"<td align='left'>" + d.type + "</td>" +
					"<td align='left'>" + d.status + "</td>" +
					"<td align='left'>" + d.lmt + "</td>" +
					"</tr>";
				//console.log( d);
			});
			$("table#myUpdatedServicesAddresses").find('tr:not(:first)').each(function() {
				$(this).remove();
			});
			$("table#myUpdatedServicesAddresses > tbody").append(row);
		},
		error: function(err) {
			console.log("error", err);
		}
	});
}
//---ChangeTableServiceAddresses<

// Function to  get how many Services Addresses are in the selected sales order
//---NumberOfServiceAddresses>
function NumberOfServiceAddresses(WhichSalesOrder) {
	if(WF_DEBUG)
		console.info('NumberOfServiceAddresses(WhichSalesOrder)', WhichSalesOrder); 	

	if (WF_DEBUG_AJAX)
		console.info("ajax action: getNumServiceAddresses", getUrl().RT );
	
	var NumberOfSAFound;
	$.ajax({
		url: getUrl().RT,
		data: {
			'action': 'getNumServiceAddresses',
			'SO': WhichSalesOrder
		},
		async: false,
		dataType: 'json',
		success: function(data) {
			var MyNumberServiceAddresses;
			//console.log('Data stream Number of Services Addr: ');
			//console.log(data);
			NumberOfSAFound = data;
		},
		error: function(data) {
			return 0;
		}
	});
	return NumberOfSAFound;
}
//---NumberOfServiceAddresses<

// Function to  get how many ITEMS are in the selected sales order
//---NumberOfItems>	
function NumberOfItems(WhichSalesOrder) {
	if(WF_DEBUG)
		console.info('NumberOfItems(WhichSalesOrder)', WhichSalesOrder); 	

	if (WF_DEBUG_AJAX)
		console.info("ajax action: getNumAllServices", getUrl().RT );
	
	var NumberOfItemsFound;
	$.ajax({
		url: getUrl().RT,
		data: {
			'action': 'getNumAllServices',
			'SO': WhichSalesOrder
		},
		async: false,
		dataType: 'json',
		success: function(data) {
			var MyNumberServiceAddresses;
			//console.log('Data stream Number of Items: ');
			//console.log(data);
			NumberOfItemsFound = data;
		},
		error: function(data) {
			return 0;
		}
	});
	return NumberOfItemsFound;
}
//---NumberOfItems<

// Task Tree Start
//--------------------------------------------------------------
//---GetTaskTree>				
function GetTaskTree(WhichSalesOrder) {
	if(WF_DEBUG)
		console.info('GetTaskTree(WhichSalesOrder)', WhichSalesOrder);
	
	var resFinAdd = [],
		resFinItem = [],
		resFinPla = [];
	var dateFirst = [],
		dateFirstStart = [];
	var dateSecond = [],
		dateSecondStart = [];
	var dateThird = [],
		dateThirdStart = [];
	var dateFourth = [],
		dateFourthStart = [];
	var firstCat = [],
		secondCat = [],
		thirdCat = [],
		secondCatInd = [],
		thirdCatInd = [],
		fourthCatInd = [];
	var objArrays = {
		'firstCat': firstCat,
		'secondCat': secondCat,
		'thirdCat': thirdCat,
		'secondCatInd': secondCatInd,
		'thirdCatInd': thirdCatInd,
		'fourthCatInd': fourthCatInd
	};
	//Call ajax 	

	if (WF_DEBUG_AJAX)
		console.info("ajax action: getTasksTableTree", getUrl().BSL );
	
	$.ajax({
		url: getUrl().BSL,
		data: {
			'action': 'getTasksTableTree',
			'WhichSalesOrder': WhichSalesOrder
		},
		dataType: 'json',
		success: function(results) {
			if(WF_DEBUG)
				console.info("Results", results);
			//console.log('WhichSalesOrder Adentro: ' + WhichSalesOrder);
			resFinAdd = callcategories(results.arrayAddress, 'taskKpiAddressCon', WhichSalesOrder, 'A');
			resFinItem = callcategories(results.arrayItem, 'taskKpiItemCon', WhichSalesOrder, 'I');
			resFinPla = callcategories(results.arrayPlan, 'taskPro', WhichSalesOrder, 'P');
			//Draw tree with all information
			//var drawTreeArr = resFinAdd.concat(resFinItem,resFinPla);
			/*
			resFinAdd = [
						 {id: 1, text: "Books", open: 1, items:
							 [
								{id: 2, text: "Turned at Dark / C. C. Hunter",items:
									[{id: 7, text: "Otro Valor"}]
								},
								{id: 3, text: "Daire Meets Ever / Alyson NoÃ«l"},
								{id: 4, text: "Socs and Greasers / Rob Lowe"},
								{id: 5, text: "Privacy and Terms.pdf"},
								{id: 6, text: "Licence Agreement.pdf"}
							 ],open:0
						 }
					 ];
			*/
			var drawTreeArr = resFinAdd.concat(resFinItem, resFinPla);
			
			console.info('GetTaskTree', 'drawTreeArr',drawTreeArr);
			//return drawTreeArr;
			Global_myTreeViewTask = new dhtmlXTreeView({
				parent: "treeTasks",
				multiselect: true,
				items: drawTreeArr
			});
			
			Global_myTreeViewTask.attachEvent("onSelect", function(id, mode) {
				var id = Global_myTreeViewTask.getSelectedId();
				var taskID = Global_myTreeViewTask.getUserData(id, "taskid");
				var level = Global_myTreeViewTask.getUserData(id, "level");
				//if(WF_DEBUG)
					console.log('Global_myTreeViewTask Selected ID: ',id, 'TaskID: ',taskID, 'Level: ',level);
				if (taskID)
					showTask(taskID,'tree');
			});
			//Functions
			
			//Call Type of tree
			function callcategories(arraCat, fieldCat, WhichSalesOrder, typeCat) {
				var executeArrays = (typeCat == 'A' || typeCat == 'I') ? 
									getArrays(arraCat, fieldCat) : 
									getArraysPlan(arraCat, fieldCat);
				//console.log(firstCat,secondCat,thirdCat,secondCatInd,thirdCatInd,fourthCatInd);
				objArrays = {
					'firstCat': firstCat,
					'secondCat': secondCat,
					'thirdCat': thirdCat,
					'secondCatInd': secondCatInd,
					'thirdCatInd': thirdCatInd,
					'fourthCatInd': fourthCatInd
				};
				var result = createArray(objArrays, typeCat, WhichSalesOrder);
				Global_collapseFirst.push(firstCat);
				resetArrays(objArrays);
				return result;
			}
			
			//resetArrays
			function resetArrays(objArrays) {
				firstCat = [];
				secondCat = [];
				secondCatInd = [];
				thirdCat = [];
				thirdCatInd = [];
				fourthCatInd = [];
			}
			
			//getArrays
			function getArrays(arrayAddress, field) {
				arrayAddress.forEach(function(task, index) {
					var taskKpiAddressCon = task[field];
					if (firstCat.indexOf(taskKpiAddressCon) == -1) {
						firstCat.push(taskKpiAddressCon);
					}
					//Second Array - second Category
					var taskPro = task.taskPro;
					var taskSubProTask = task.taskSubProTask;
					if (taskPro != '') {
						if (secondCat.indexOf(taskPro) == -1) {
							secondCat.push(taskPro);
						}
					} else {
						secondCatInd.push(taskSubProTask);
					}
					//Third Array - Third Category
					var taskSubPro = task.taskSubPro;
					if (taskSubPro != '') {
						if (thirdCat.indexOf(taskSubPro) == -1) {
							thirdCat.push(taskSubPro);
						}
						fourthCatInd.push(taskSubProTask);
					} else {
						thirdCatInd.push(taskSubProTask);
					}
				});
			}
			
			//getArraysPlan
			function getArraysPlan(arrayAddress, field) {
				arrayAddress.forEach(function(task, index) {
					var taskKpiAddressCon = task[field];
					if (firstCat.indexOf(taskKpiAddressCon) == -1) {
						firstCat.push(taskKpiAddressCon);
					}
					var taskSubPro = task.taskSubPro;
					var taskSubProTask = task.taskSubProTask;
					if (taskSubPro != '') {
						if (secondCat.indexOf(taskSubPro) == -1) {
							secondCat.push(taskSubPro);
						}
						thirdCat.push(taskSubProTask);
					} else {
						secondCatInd.push(taskSubProTask);
					}
					//--------------------------------------------
				});
			}
			
		},
		error: function(e) {
			console.log("Someting happend 1778! ", e);
		}
			//	},error: function (data){console.log(data);}
	});
} // End Tree
//---GetTaskTree<


//---StringNetsuiteDateToDate>
function StringNetsuiteDateToDate(s) {

	if (typeof s === 'string') {

	} else {
		return s;
	}
	// var monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var months = window.datetime_short_months;
	var newDate = new Date(); // Default result...
	
	// console.info("Window.dateformat",window.dateformat)
	switch (window.dateformat) {
		case 'MM/DD/YYYY':
			var parts = s.split('/');
			newDate = new Date(parts[2], parts[0] - 1, parts[1]);
			break;
		case 'MM.DD.YYYY':
			var parts = s.split('.');
			newDate = new Date(parts[2], parts[0] - 1, parts[1]);
			break;
		case 'DD/MM/YYYY':
			var parts = s.split('/');
			newDate = new Date(parts[2], parts[1] - 1, parts[0]);
			break;
		case 'DD.MM.YYYY':
			var parts = s.split('.');
			newDate = new Date(parts[2], parts[1] - 1, parts[0]);
			break;
		case 'YYYY/MM/DD':
			var parts = s.split('/');
			newDate = new Date(parts[0], parts[1] - 1, parts[2]);
			break;
		case 'YYYY-MM-DD':
			var parts = s.split('-');
			newDate = new Date(parts[0], parts[1] - 1, parts[2]);
			break;
		case 'YYYY.MM.DD':
			var parts = s.split('.');
			newDate = new Date(parts[0], parts[1] - 1, parts[2]);
			break;
		case 'DD.Mon.YYYY':
			var parts = s.split('.');
			newDate = new Date(parts[2], months.indexOf(parts[1]), parts[0]);
			break;
		case 'DD-Mon-YYYY':
			var parts = s.split('-');
			newDate = new Date(parts[2], months.indexOf(parts[1]), parts[0]);
			break;
		case 'DD-Month-YYYY':
			var parts = s.split('-');
			newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 3)), parts[0]);
			break;
		case 'DD-MONTH-YYYY':
			var parts = s.split('-');
			newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0]);
			break;
		case 'DD,MONTH,YYYY':
			var parts = s.split(',');
			newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0]);
			break;
		case 'DD MONTH, YYYY':
			var parts = s.split(' ');
			newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0]);
			break;
	}
	return newDate;
}
//---StringNetsuiteDateToDate<

//---YMDToDate>
function YMDToDate(s) {

	if (typeof s === 'string') {

	} else {
		return s;
	}
	// var monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var months = window.datetime_short_months;
	// console.info("Window.dateformat",window.dateformat)
	switch (window.dateformat) {
		case 'MM/DD/YYYY':
			var parts = s.split('/');
			return newDate = new Date(parts[2], parts[0] - 1, parts[1]);
			break;
		case 'MM.DD.YYYY':
			var parts = s.split('.');
			return newDate = new Date(parts[2], parts[0] - 1, parts[1]);
			break;
		case 'DD/MM/YYYY':
			var parts = s.split('/');
			return newDate = new Date(parts[2], parts[1] - 1, parts[0]);
			break;
		case 'DD.MM.YYYY':
			var parts = s.split('.');
			return newDate = new Date(parts[2], parts[1] - 1, parts[0]);
			break;
		case 'YYYY/MM/DD':
			var parts = s.split('/');
			return newDate = new Date(parts[0], parts[1] - 1, parts[2]);
			break;
		case 'YYYY-MM-DD':
			var parts = s.split('-');
			return newDate = new Date(parts[0], parts[1] - 1, parts[2]);
			break;
		case 'YYYY.MM.DD':
			var parts = s.split('.');
			return newDate = new Date(parts[0], parts[1] - 1, parts[2]);
			break;
		case 'DD.Mon.YYYY':
			var parts = s.split('.');
			return newDate = new Date(parts[2], months.indexOf(parts[1]), parts[0]);
			break;
		case 'DD-Mon-YYYY':
			var parts = s.split('-');
			return newDate = new Date(parts[2], months.indexOf(parts[1]), parts[0]);
			break;
		case 'DD-Month-YYYY':
			var parts = s.split('-');
			return newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 3)), parts[0]);
			break;
		case 'DD-MONTH-YYYY':
			var parts = s.split('-');
			return newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0]);
			break;
		case 'DD,MONTH,YYYY':
			var parts = s.split(',');
			return newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0]);
			break;
		case 'DD MONTH, YYYY':
			var parts = s.split(' ');
			return newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0]);
			break;
			//Format Date = (YYYY,MM,DD)
	}
}

//---YMDToDate<

//---setCalendarFormatInput>
function setCalendarFormatInput() {

	switch (window.dateformat) {
		case 'MM/DD/YYYY':
			CalendarInputFormat = "m/d/Y";
			break;
		case 'MM.DD.YYYY':
			CalendarInputFormat = "m.d.Y";
			break;
		case 'DD/MM/YYYY':
			CalendarInputFormat = "d/m/Y";
			break;
		case 'DD.MM.YYYY':
			CalendarInputFormat = "d/m/Y";
			break;
		case 'YYYY/MM/DD':
			CalendarInputFormat = "Y/m/d";
			break;
		case 'YYYY-MM-DD':
			CalendarInputFormat = "Y-m-d";
			break;
		case 'YYYY.MM.DD':
			CalendarInputFormat = "Y.m.d";
			break;
		case 'DD.Mon.YYYY':
			CalendarInputFormat = "d.M.Y";
			break;
		case 'DD-Mon-YYYY':
			CalendarInputFormat = "d-M-Y";
			break;
		case 'DD-Month-YYYY':
			CalendarInputFormat = "d-F-Y";
			break;
		case 'DD-MONTH-YYYY':
			CalendarInputFormat = "d-F-Y";
			break;
		case 'DD,MONTH,YYYY':
			CalendarInputFormat = "d,F,Y";
			break;
		case 'DD MONTH, YYYY':
			CalendarInputFormat = "d F, Y";
			break;
			//Format Date = (YYYY,MM,DD)
	}
}
//---setCalendarFormatInput<

//---dateToStringNetsuite>
function dateToStringNetsuite(date) {
	if (WF_DEBUG)
		console.info("dateToStringNetsuite params:", date);
	if (typeof date == 'string') {

		return false;
	}
	var d = date.getDate(),
		m = date.getMonth(),
		y = date.getFullYear();
	var delim = '/';
	var monthsName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var months = window.datetime_short_months;
	var strdate = '';
	m1 = m;
	d1 = d;
	m = m + 1;
	d = (d <= 9 ? '0' + d : d);
	m = (m <= 9 ? '0' + m : m);

	switch (window.dateformat) {
		case 'MM/DD/YYYY':
			strdate = '' + m + delim + d + delim + y;
			break;
		case 'MM.DD.YYYY':
			delim = '.';
			strdate = '' + m + delim + d + delim + y;
			break;
		case 'DD/MM/YYYY':
			delim = '/';
			strdate = '' + d + delim + m + delim + y;
			break;
		case 'DD.MM.YYYY':
			delim = '.';
			strdate = '' + d + delim + m + delim + y;
			break;
		case 'YYYY/MM/DD':
			delim = '/';
			strdate = '' + y + delim + m + delim + d;
			break;
		case 'YYYY-MM-DD':
			delim = '-';
			strdate = '' + y + delim + m + delim + d;
			break;
		case 'YYYY.MM.DD':
			delim = '.';
			strdate = '' + y + delim + m + delim + d;
			break;
		case 'DD.Mon.YYYY':
			delim = '.';
			strdate = '' + d + delim + months[m1] + delim + y;
			break;
		case 'DD-Mon-YYYY':
			delim = '-';
			strdate = '' + d + delim + months[m1] + delim + y;
			break;
		case 'DD-Month-YYYY':
			delim = '-';
			strdate = '' + d + delim + monthsName[m1] + delim + y;
			break;
		case 'DD-MONTH-YYYY':
			delim = '-';
			strdate = '' + d + delim + monthsName[m1].toUpperCase() + delim + y;
			break;
		case 'DD,MONTH,YYYY':
			delim = ',';
			strdate = '' + d + delim + monthsName[m1].toUpperCase() + delim + y;
			break;
		case 'DD MONTH, YYYY':
			delim = ' ';
			strdate = '' + d + delim + monthsName[m1].toUpperCase() + ',' + delim + y;
			break;
			//Format Date = (YYYY,MM,DD)
	}
	if (WF_DEBUG)
		console.info("dateToStringNetsuite return:", strdate);
	return strdate;
}
//---dateToStringNetsuite<

//---createArray>
function createArray(objArrays, typeArr, WhichSalesOrder) {
		var tree = 'tree';
		//function sortDates

		//function convertDate
		function convertDate(fechas) {
			var arrayFechas = [];
			fechas.forEach(function(fecha, ind) {
				arrayFechas.push(StringNetsuiteDateToDate(fecha));
			});
			return arrayFechas;
		};
		
		function sortDates(fechas, typesort) {
			var date_sort_asc = function(date1, date2) {
				if (date1 > date2) return 1;
				if (date1 < date2) return -1;
				return 0;
			};
			var date_sort_desc = function(date1, date2) {
				if (date1 > date2) return -1;
				if (date1 < date2) return 1;
				return 0;
			};
			//	console.info("fechas",fechas);
			if (typesort == 'desc') {
				rdt = convertDate(fechas).sort(date_sort_desc);
				// var rdt = fechas.sort(date_sort_desc);
				//
				// console.info("SortDates Dec ",rdt);
			} else {
				rdt = convertDate(fechas).sort(date_sort_asc);
				// var rdt = fechas.sort(date_sort_asc);
				//
				// console.info("SortDates ASC",rdt);

			}
			//console.info("rdt",rdt);
			return rdt;
		}


		//function changeDateformat
		function changeDateformat(date) {
			var fechas = [];
			fechas.push(date);
			var returnDate = sortDates(fechas, 'desc');
			var lastdate = formatDate(returnDate[0]);
			return lastdate;
		}
		//End Functions
		
		var firstCat = objArrays.firstCat;
		var secondCat = objArrays.secondCat;
		var secondCatInd = objArrays.secondCatInd;
		var thirdCat = objArrays.thirdCat;
		var thirdCatInd = objArrays.thirdCatInd;
		var fourthCatInd = objArrays.fourthCatInd;
		var resulFinal = [];
		var startValue = "";
		var endValue = "";
		var colorClass = "primary'";
		/*
		//Format Date
		Date.prototype.ddmmyyyy = function() {
			var yyyy = this.getFullYear();
			var mm = this.getMonth() < 9 ? "0" + (this.getMonth() + 1) : (this.getMonth() + 1); // getMonth() is zero-based
			var dd = this.getDate() < 10 ? "0" + this.getDate() : this.getDate();
			return "".concat(dd).concat("/").concat(mm).concat("/").concat(yyyy);
		}; //End Format Date
		*/
		firstCat.forEach(function(taskDraw) {
			var arraySec = [];
			dateSecond = [];
			dateSecondStart = [];
			var obj = {};
			var textName = '';
			var sepPro = taskDraw.split('~');
			textName = (typeArr == 'A' || typeArr == 'P') ? sepPro[1] : (typeArr == 'I') ? searchitemlocation(WhichSalesOrder, sepPro[0]) : '';
			obj['id'] = sepPro[0];
			obj['text'] = textName;
			obj['open'] = 0;
			obj['userdata'] = { taskid: sepPro[0], level: 0 }
			//Second----------------------------------------------------
			secondCat.forEach(function(secondCate) {
				//	console.info("secondCat",secondCate)
				var segunda = secondCate.split('~');
				var idAdd = segunda[0];
				var idPro = segunda[1];
				var idName = segunda[2];

				//console.log ('secondCate vale ' + secondCate);
				if (idAdd == sepPro[0]) {
					var obj2 = {};
					obj2['id'] = idAdd + '-' + idPro;
					obj2['text'] = idName;
					obj2['open'] = 0;
					obj2['userdata'] = { taskid:idAdd + '-' + idPro, level:1 }
					//Third-------------------------------------------------------------------------------
					var arrayThird = [];
					dateThird = []; //reset arrays dates
					dateThirdStart = []; //reset arrays dates
					thirdCat.forEach(function(thirdCate) {
						//	console.info("thirdCat",thirdCate);
						var tercera = [];
						dateFourth = []; //reset arrays dates
						dateFourthStart = []; //reset arrays dates
						startValue = "";
						endValue = "";
						colorClass = "primary'";
						tercera = thirdCate.split('~');
						var idAddT = tercera[0];
						var idProT = tercera[1];
						var idSubproT = tercera[2];

						//console.log ('thirdCate 1 vale ' + thirdCate);
						if (typeArr == 'P') {
							var separete = tercera[3].split('|');
							var titleFirst = separete[0];
							var dateInformation = separete[1].split(delimiterdates);
							var startDate = formatDate(dateInformation[0]); //call function changeDateformat
							var dueDate = formatDate(dateInformation[1]); //call function changeDateformat
							var cantDuration = dateInformation[2];
							var statusTask = dateInformation[3];
							var idDesTask = dateInformation[4];
							if (statusTask == 'Yes' || statusTask == 'YesCancel') {
								startValue = "<s>";
								endValue = "</s>";
								var cancelMode = (statusTask == 'YesCancel') ? " style='background-color:#cccccc'" : "";
								colorClass = "success'" + cancelMode;
							}
							var RawStartDate = new Date((dateInformation[0]));
							var RawDueDate = new Date((dateInformation[1]));

							var today = new Date().setHours(0, 0, 0, 0);
							if (RawStartDate.getTime() <= today) { colorClass = "danger'"; }
							if (statusTask <= 'Completed') { colorClass = "completed'"; }
							if (statusTask == 'Yes' || statusTask == 'YesCancel') {
								startValue = "<s>";
								endValue = "</s>";
								var cancelMode = (statusTask == 'YesCancel') ? " style='background-color:#cccccc'" : "";
								colorClass = "success'" + cancelMode;
							}

							//***********************/
							dateThirdStart.push(dateInformation[0]);
							dateThird.push(dateInformation[1]);
							//***********************/
							var ConstructedStartDate = startDate;
							var ConstructedDueDate = dueDate;

							var idNameT = startValue + "<a onclick='showTask(" + idSubproT + ",\"tree\");''>" + titleFirst + "</a>&nbsp<span class='label label-" + colorClass + ">" + ConstructedStartDate + " - " + ConstructedDueDate +
								"</span>&nbsp<span class='label label-warning'>" + cantDuration + "</span>" + endValue;
							
							var idNameT = startValue + '' + titleFirst + "&nbsp;<span class='label label-" + colorClass + ">" + ConstructedStartDate + " - " + ConstructedDueDate +
							"</span>&nbsp<span class='label label-warning'>" + cantDuration + "</span>" + endValue+'';
						
							
						} else {
							var idNameT = tercera[3];
						}
						
						if ((idAddT + '-' + idProT) == (idAdd + '-' + idPro)) {
							var obj3 = {};
							obj3['id'] = idAddT + '-' + idProT + '-' + idSubproT;
							//console.log(idAddT+'-'+idProT+'-'+idSubproT);
							obj3['text'] = idNameT;
							obj3['userdata'] = { taskid: idAddT + '-' + idProT + '-' + idSubproT, level: 3 }
							obj3['open'] = 0;
							//fourth---------------------------------------------------------------------
							var arrayFourth = [];
							fourthCatInd.forEach(function(fourthCate) {
								var cuarta = fourthCate.split('~');
								var obj4 = {};
								var idAddC = cuarta[0];
								var idProC = cuarta[1];
								var idSubproC = cuarta[2];
								var idTask = cuarta[3];
								var idTasKName = cuarta[4];

								//console.log ('fourthCate vale ' + fourthCate);
								//console.log ('idTasKName vale ' + idTasKName);
								if ((idAddT + '-' + idProT + '-' + idSubproT) == (idAddC + '-' + idProC + '-' + idSubproC)) {
									startValue = "";
									endValue = "";
									colorClass = "primary'";
									var separete = idTasKName.split('|');
									var titleFirst = separete[0];
									var dateInformation = separete[1].split(delimiterdates);
									//var startDate 		= changeDateformat(dateInformation[0]); //call function changeDateformat
									//var dueDate 		= changeDateformat(dateInformation[1]); //call function changeDateformat

									var startDate = formatDate(dateInformation[0]); //call function changeDateformat
									var dueDate = formatDate(dateInformation[1]); //call function changeDateformat
									var cantDuration = dateInformation[2];
									var statusTask = dateInformation[3];
									var idDesTask = dateInformation[4];
									var RawStartDate = new Date(Number(separete[2]));
									var RawDueDate = new Date(Number(separete[3]));

									var today = new Date().setHours(0, 0, 0, 0);
									if (RawStartDate <= today) { colorClass = "danger'"; }
									if (statusTask <= 'Completed') { colorClass = "completed'"; }
									if (statusTask == 'Yes' || statusTask == 'YesCancel') {
										startValue = "<s>";
										endValue = "</s>";
										var cancelMode = (statusTask == 'YesCancel') ? " style='background-color:#cccccc'" : "";
										colorClass = "success'" + cancelMode;
									}

									//***********************/
									dateFourthStart.push(dateInformation[0]);
									dateFourth.push(dateInformation[1]);
									//***********************/
									
									var ConstructedStartDate = startDate;
									var ConstructedDueDate = dueDate;

									var callFunction = startValue + "<a onclick='showTask(" + idTask + ",\"tree\");''>" + titleFirst + "</a>&nbsp<span class='label label-" + colorClass + ">" + ConstructedStartDate + " - " + ConstructedDueDate +
										"</span>&nbsp<span class='label label-warning'>" + cantDuration + "</span>" + endValue;
									
									var callFunction = startValue + '' + titleFirst + "&nbsp;<span class='label label-" + colorClass + ">" + ConstructedStartDate + " - " + ConstructedDueDate +
									"</span>&nbsp<span class='label label-warning'>" + cantDuration + "</span>" + endValue + '';

									var obj4 = {};
									obj4['id'] = idAddC + '-' + idProC + '-' + idSubproC + '-' + idTask;
									obj4['text'] = callFunction;
									obj4['userdata'] = { taskid : idTask , level : 4 };
									arrayFourth.push(obj4);
								}
							}); //end fourthCatInd
							//---------------------------------------------------------------------------
							var startDatetitle = "";
							var dueDatetitle = "";
							//	console.log(dateFourthStart);
							if (dateFourthStart.length > 0) {
								var lastDates = sortDates(dateFourthStart, 'asc');
								//console.log(" >>>> Format Date :"+formatDate(lastDates[0]));
								startDatetitle = "&nbsp<span class='label label-default' style='font-weight: 400;'>" + formatDate(lastDates[0]);
								//***********************/
								dateThirdStart.push(lastDates[0]);
								//***********************/
							}
							if (dateFourth.length > 0) {
								var lastDates = sortDates(dateFourth, 'desc');
								dueDatetitle = " - " + formatDate(lastDates[0]) + "</span>";
								//***********************/
								//	dateThird.push(lastDates[0].ddmmyyyy());
								dateThird.push(lastDates[0]);
								//***********************/
							} else {
								if (dateFourthStart.length > 0) {
									startDatetitle = startDatetitle + "</span>";
								}
							}
							if (typeArr != 'P') {
								obj3['text'] = idNameT + startDatetitle + dueDatetitle; //re-assign text in category
							}
							obj3['items'] = arrayFourth;
							arrayThird.push(obj3);
						}
					}); //end third
					//thirdundependence
					thirdCatInd.forEach(function(thirdCate) {
						//console.info("thirdCatInd",thirdCate);
						var tercera = thirdCate.split('~');
						var obj3 = {};
						var idAddT = tercera[0];
						var idProT = tercera[1];
						var idTask = tercera[2];
						var idTasKName = tercera[3];

						//console.log ('thirdCate 2 vale ' + thirdCate);
						//console.log ('idTasKName vale ' + idTasKName);
						//console.log ('Aqui startDate contiene ' + startDate);
						if ((idAddT + '-' + idProT) == (idAdd + '-' + idPro)) {
							startValue = "";
							endValue = "";
							colorClass = "primary'";
							var separete = idTasKName.split('|');
							var titleFirst = separete[0];
							var dateInformation = separete[1].split(delimiterdates);
							var startDate = formatDate(dateInformation[0]); //call function changeDateformat
							var dueDate = formatDate(dateInformation[1]); //call function changeDateformat
							var statusTask = dateInformation[3];
							var idDesTask = dateInformation[4];
							if (statusTask == 'Yes' || statusTask == 'YesCancel') {
								startValue = "<s>";
								endValue = "</s>";
								var cancelMode = (statusTask == 'YesCancel') ? " style='background-color:#cccccc'" : "";
								colorClass = "success'" + cancelMode;
							}
							var RawStartDate = new Date(Number(separete[2]));
							var RawDueDate = new Date(Number(separete[3]));
							var today = new Date().setHours(0, 0, 0, 0);
							if (RawStartDate <= today) { colorClass = "danger'"; }
							if (statusTask <= 'Completed') { colorClass = "completed'"; }

							//***********************/
							dateThirdStart.push(dateInformation[0]);
							dateThird.push(dateInformation[1]);
							//***********************/
							var ConstructedStartDate = startDate;
							var ConstructedDueDate = dueDate;
							var cantDuration = dateInformation[2];
							
							var callFunction = startValue + "<a onclick='showTask(" + idTask + ",\"tree\");''>" + titleFirst + "</a>&nbsp<span style='font-weight:400;' class='label label-" + colorClass + ">" + ConstructedStartDate + " - " +
								ConstructedDueDate + "</span>&nbsp<span class='label label-warning'>" + cantDuration + "</span>" + endValue;
						
							var callFunction = startValue + '' + titleFirst + "&nbsp;<span style='font-weight:400;' class='label label-" + colorClass + ">" + ConstructedStartDate + " - " +
							ConstructedDueDate + "</span>&nbsp<span class='label label-warning'>" + cantDuration + "</span>" + endValue + '';
							
							var obj3 = {};
							obj3['id'] = idAddT + '-' + idProT + '-' + idTask;
							obj3['text'] = callFunction;
							obj3['userdata'] = { taskid : idTask, level : 3 };
							//obj3['open'] 	= 0;
							arrayThird.push(obj3);
						}
					}); //end thirdundependence
					//------------------------
					var startDatetitle = "";
					var dueDatetitle = "";
					if (dateThirdStart.length > 0) {
						var lastDates = sortDates(dateThirdStart, 'asc');
						//console.log(" >>>> Format Date :"+formatDate(lastDates[0]));
						startDatetitle = "&nbsp<span class='label label-default' style='font-weight: 400;'>" + formatDate(lastDates[0]);
						//***********************/
						dateSecondStart.push(lastDates[0]);
						//***********************/
					}
					if (dateThird.length > 0) {
						var lastDates = sortDates(dateThird, 'desc');
						//	console.info("last",lastDates);
						dueDatetitle = " - " + formatDate(lastDates[0]) + " </span>";
						//***********************/
						dateSecond.push(lastDates[0]);
						//***********************/
					} else {
						if (dateThirdStart.length > 0) {
							startDatetitle = startDatetitle + " </span>";
						}
					}
					obj2['text'] = idName + startDatetitle + dueDatetitle;
					obj2['items'] = arrayThird;
					//End Third---------------------------------------------------------------------------
					arraySec.push(obj2);
				}
			});
			//secondundependence
			secondCatInd.forEach(function(secondCate) {
				var segunda = secondCate.split('~');
				var idAssignTask = "";

				//console.log ('secondCate vale ' + secondCate);
				if (typeArr == 'P') {
					var idAdd = segunda[0]
					var idTasKName = segunda[2];
					idAssignTask = idAdd + '-' + segunda[1];
				} else {
					var idAdd = segunda[0];
					var idPro = segunda[1]; //is empty
					var idTask = segunda[2];
					var idTasKName = segunda[3];
					idAssignTask = idAdd + '-' + idTask;
				}
				if (idAdd == sepPro[0]) {
					startValue = "";
					endValue = "";
					colorClass = "primary'";
					var idTaskFuction = idAssignTask.split('-');
					var separete = idTasKName.split('|');
					var titleFirst = separete[0];
					var dateInformation = separete[1].split(delimiterdates);
					var startDate = formatDate(dateInformation[0]); //call function changeDateformat
					var dueDate = formatDate(dateInformation[1]); //call function changeDateformat
					var cantDuration = dateInformation[2];
					var statusTask = dateInformation[3];
					var idDesTask = dateInformation[4];
					if (statusTask == 'Yes' || statusTask == 'YesCancel') {
						startValue = "<s>";
						endValue = "</s>";
						var cancelMode = (statusTask == 'YesCancel') ? " style='background-color:#cccccc'" : "";
						colorClass = "success'" + cancelMode;
					}
					var RawStartDate = new Date(Number(separete[2]));
					var RawDueDate = new Date(Number(separete[3]));

					var today = new Date().setHours(0, 0, 0, 0);

					if (RawStartDate <= today) { colorClass = "danger'"; }
					if (statusTask <= 'Completed') { colorClass = "completed'"; }

					//***********************/
					dateSecondStart.push(dateInformation[0]);
					dateSecond.push(dateInformation[1]);
					//***********************/
					var ConstructedStartDate = startDate;
					var ConstructedDueDate = dueDate;
					
					var callFunction = startValue + "<a onclick='showTask(" + idTaskFuction[1] + ",\"tree\");''>" + titleFirst + "</a>&nbsp<span class='label label-" + colorClass + ">" + ConstructedStartDate + " - " + ConstructedDueDate +
						"</span>&nbsp<span class='label label-warning'>" + cantDuration + "</span>" + endValue;
					
					var callFunction = startValue + '' + titleFirst + "&nbsp;<span class='label label-" + colorClass + ">" + ConstructedStartDate + " - " + ConstructedDueDate +
						"</span>&nbsp<span class='label label-warning'>" + cantDuration + "</span>" + endValue + '';
					
					var obj2 = {};
					obj2['id'] = idAssignTask;
					obj2['text'] = callFunction;
					obj2['userdata'] = { taskid: idTaskFuction[1], level:2 };
					arraySec.push(obj2);
				}
			}); //End secondCatInd--
			var startDatetitle = "";
			var dueDatetitle = "";

			// console.log("Second", dateSecond);

			if (dateSecondStart.length > 0) {
				var lastDates = sortDates(dateSecondStart, 'asc');
				//console.log(" >>>> Format Date :"+formatDate(lastDates[0]));
				startDatetitle = "&nbsp<span class='label label-default' style='font-weight: 400;'>" + formatDate(lastDates[0]);
			}
			if (dateSecond.length > 0) {
				var lastDates = sortDates(dateSecond, 'desc');
				// console.log(lastDates);
				dueDatetitle = " - " + formatDate(lastDates[0]) + "</span>";
			} else {
				if (dateSecondStart.length > 0) {
					startDatetitle = startDatetitle + "</span>";
				}
			}
			obj['text'] = textName + startDatetitle + dueDatetitle; //+ "&nbsp<span class='label label-danger'>fecha</span>";
			obj['items'] = arraySec;
			resulFinal.push(obj);
			JSON.stringify(resulFinal);
		});
		return resulFinal;
	} //end createArray
//---createArray<

//---searchitemlocation>
function searchitemlocation(WhichSalesOrder, itemLine) {
	if (WF_DEBUG)
		console.info("searchitemlocation(WhichSalesOrder, itemLine)", WhichSalesOrder, itemLine);
		var sepID = itemLine.split('-');
		var textName = '';
		//Get Item Text ----------------------------------------------
		$.ajax({
			//  url: getUrl().RT2,
			url: getUrl().BSL,
			data: {
				'action': 'searchItemLocation',
				'WhichSalesOrder': WhichSalesOrder,
				'WhichItem': sepID[0].slice(1),
				'WhichLine': sepID[1]
			},
			async: false,
			dataType: 'json',
			success: function(data) {
				if (data.item != '') {
					textName = data.item;
				} else {
					//textName 	= sepPro[1] + ' (' + sepID[1]+ ')';
					textName = sepID[0] + ' (' + sepID[1] + ')';
				}
			},
			error: function(err) {
				console.log('err',err);
			}
		});
		return textName;
	}
//---searchitemlocation<

//Call first serach PM --------------------------------------------------

//---showSecondTable>
function showSecondTable(empPM) {
	if (WF_DEBUG)
		console.info("showSecondTable(empPM)", empPM);
		// Second Div -------------------------------------------------------
		if (WF_DEBUG_AJAX)
			console.info("ajax action: getAllTaskbyDpto", getUrl().RT3);
		$.ajax({
			url: getUrl().RT3,
			data: {
				'action': 'getAllTaskbyDpto',
				'WhichProjMan': empPM
			},
			async: false,
			dataType: 'json',
			success: function(data) {
				var emp = data.emp;
				var results = data.results;
				$('#allSecondPanel').hide();
				$('#secondPanel_all').show();
				$('#secondPanel').show();
				var row = '';
				var howTask = '<span class="label label-warning">(TASKS NOT FOUND)</span>';
				results.forEach(function(result, index) {
					if (index == 0) {
						$('#allSecondPanel').show();
						$('allSecondPanel').show();
						$('#secondDiv').show();
						$('#thirdDiv').show();
						$('#ulListdpto').show();
						$('#secondPanle').show();
					}
					var deptoId = result.deptoId;
					var deptoText = result.deptoText;
					var countTask = result.countTask;
					row += '<li class="list-group-item">';
					row += '<span class="badge" style="background-color: #5bc0de">' + countTask + '</span>';
					row += '<strong>' + deptoText + '</strong>';
					row += '</li>';
					howTask = '';
				});
				$("#ulListdpto li").remove();
				$("#secondPanel div").remove();
				$("#secondPanel").append('<div>' + emp + ' ' + howTask + '</div>');
				$("#ulListdpto").append(row);
			},
			error: function(err) {
				console.log('err',err);
			}
		});
		// Third Div -------------------------------------------------------
		if (WF_DEBUG_AJAX)
			console.info("ajax action: getAllTaskbySO", getUrl().RT3);
		$.ajax({
			url: getUrl().RT3,
			data: {
				'action': 'getAllTaskbySO',
				'WhichProjMan': empPM
			},
			async: false,
			dataType: 'json',
			success: function(data) {
				var UniqueSO = data.UniqueSO;
				var results = data.results;
				var resulFinal = [];
				//console.log(UniqueSO);
				UniqueSO.forEach(function(taskSO, index) {
					var obj = {};
					var itemsresulFinal = [];
					var primera = taskSO.split('~');
					obj['id'] = 'SO-' + primera[0];
					var npos = primera[1].indexOf("#") + 1; //('#')
					var text = primera[1].slice(npos);
					obj['open'] = 0;
					var separateTask = results.filter(function(indTask) {
						return (indTask.SoId + "~" + indTask.SoIdText == taskSO);
					});
					//console.log(separateTask);
					separateTask.forEach(function(oneTask, indice) {
						var objSec = {};
						objSec['id'] = 'TK-' + oneTask.internalId;
						var titleTask = oneTask.title;
						var titlehead;
						if (titleTask.indexOf(" - ") !== -1) {
							titlehead = titleTask.substring(titleTask.indexOf(" - ") + 3);
						} else {
							titlehead = titleTask;
						}
						objSec['text'] = titlehead;
						objSec['open'] = 0;
						itemsresulFinal.push(objSec);
					});
					obj['text'] = text + ' <span class="label label-info">' + separateTask.length + '</span>';
					obj['items'] = itemsresulFinal;
					resulFinal.push(obj);
					//console.log(JSON.stringify(separateTask));
				});
				//console.log(resulFinal);
				var myTree;
				myTreeView = new dhtmlXTreeView({
					parent: "treeTasksMyTeam",
					items: resulFinal
				});
				$('#thirdDiv').show();
			},
			error: function(err) {
				console.log('err',err);
			}
		});
	} //End Call first serach PM --------------------------------------------------
//---showSecondTable<						
	
	//Function Out
	
//---showTask>
function showTask(idTaskFuction, fromClick) {
		if (WF_DEBUG)
			console.info("showTask(idTaskFuction, fromClick)", idTaskFuction, fromClick);
		//console.log('WhichSalesOrder: ' + WhichSalesOrder);
		$('.preimageTasks').hide();
		//	console.log('Task ID in Tree: ' + idTaskFuction + " - " + fromClick);
		//-----------------------------------------------------------
		if (WF_DEBUG_AJAX)
			console.info("ajax action: GetTaskTree", getUrl().RT );
		$.ajax({
			url: getUrl().RT,
			data: {
				'action': 'GetTaskTree',
				'WhichTask': idTaskFuction
			},
			dataType: 'json',
			success: function(results) {
				//console.log(results[0]);
				var counter = 0,
					count;
				var DrawResults = results[0];
				var loggedUserID = $('input#custpage_userid').val();
				if (loggedUserID == '') {
					alert('Undetermined user, please login');
				} else {
					// We collect the user ID which is current in the active session
					loggedUserID = Math.round(loggedUserID);
					//  This variable will set the ID's
					counter++;
					count = "TreeTask" + counter;
					if (results[0]) {
						var taskID = DrawResults.internalid;
						var titleTask = DrawResults.taskTitle;
						var assigned = DrawResults.assigned;
						var assignedID = DrawResults.assignedID;
						var status = DrawResults.status;
						var statusID = DrawResults.statusID;
						var taskAck = DrawResults.taskAck;
						var taskStartDate = DrawResults.taskStartDate;
						var taskDueDate = DrawResults.taskDueDate;
						var IsWorkOnWeekend = DrawResults.IsWorkOnWeekend;
						var taskDuration = DrawResults.taskDuration;
						var taskCDependency = DrawResults.taskCDependency;
						var taskCPredecessor = DrawResults.taskCPredecessor;
						var WhichSalesOrder = DrawResults.taskSalesOrder;
						var treePosition = DrawResults.treePosition;
						var WrikeID = DrawResults.WrikeID;
						//console.log(DrawResults);
						//Show table
						$("table#tableTask").show();
						$('table#tableTask thead th').remove();
						$('table#tablePreSucc thead th').remove();
						var headRow = '';
						//	var titleForTask = 'Task Details';
						var listofStatusSelect = $('input#custpage_selectstatustask').val();
						// headRow += '<tr>';
						// headRow += '<th colspan="1" align="center" valign="left"><strong>' + titleTaks + '</strong></th><th><div align="right"><input onclick="" id="dicoTreeTask1" class="filterButton" style="display: none" align="right" type="button" value="Save"/></th></div>';
						// headRow += '</tr>';
						$("table#tableTask > thead").append(headRow);
						//WORKWEEKEND--------------------------------------------------------------
						var WorkWeekendDisplay;
						// We save the Work on Weekend state here
						var WorkWeekend = IsWorkOnWeekend;
						// If the employee works on Weekends then make the check input to be marked
						if (WorkWeekend) {
							WorkWeekendDisplay = "<input type='checkbox' onchange='changeWorkOnWeekends.call(this)' id='WorkOnWeekends_" + count + "' name='check' class='check' checked /><p style='font-size:0px;position:absolute;'>true</p>"
								// This will input something like: $("input[id='WorkOnWeekends_7']").attr('checked', true)
						} else {
							WorkWeekendDisplay = "<input type='checkbox' onchange='changeWorkOnWeekends.call(this)' id='WorkOnWeekends_" + count + "' name='check' class='check' /><p style='font-size:0px;position:absolute;'>false</p>"
						}
						//ACK----------------------------------------------------------------------
						var BoolAck;
						if (taskAck) {
							BoolAck = "<input type='checkbox' onchange='changeAck.call(this)' id='Ack_" + count + "' name='check' disabled class='check' checked />"
						} else {
							BoolAck = "<input type='checkbox' onchange='changeAck.call(this)' id='Ack_" + count + "' name='check' class='check' />"
						}
						//EMPLOYEE SELECT AND STATUS TASK------------------------------------------
						var vFilteredEmployeesList = lstEmployeeSelect.replace(assignedID, assignedID + ' selected');

						var vFilteredStatusList = listofStatusSelect;
						if (statusID) {
							console.log("statusid" + statusID + "is");
							vFilteredStatusList = vFilteredStatusList.replace(statusID, statusID + ' selected');
						}

						//	console.log(listofStatusSelect);
						var vFilteredStatusList = vFilteredStatusList.replace('selTaskStatus', 'selTaskStatus'); //selTaskStatus
						var vFilteredStatusList = vFilteredStatusList.replace('class="selectTaskStatus"', 'class="selectTaskStatus" title="You won\'t be able to update this task once the status changes to "completed/cancelled"');
						var vFilteredStatusList = vFilteredStatusList.replace('id="selTaskStatus"', 'id="selTaskStatus' + count + '"');
						var vFilteredStatusList = vFilteredStatusList.replace('</select>', '</select><p  class="kiko" style="font-size:0px;position:absolute;">' + status + '</p>');
						var dtaskStartDate = taskStartDate;
						var dtaskDueDate = taskDueDate;
						//DURATION -----------------------------------------------------------------
						var dtaskDuration = "<input id='idTask_Duration_" + count + "' onblur='blurDuration.call()' onkeyup='changeDuration.call(this)' data-dependency='" + taskCDependency + "' data-predecessor='" + taskCPredecessor +
							"' type='text' size='3' value=" + taskDuration + " data-wrikeid='" + WrikeID + "' data-salesorder='" + WhichSalesOrder + "'>";
						//UPDATE-ICON --------------------------------------------------------------
						var dtaskUpdateIcon = "<div onclick='clickdico.call(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
						//console.log(statusID);
						//console.log("PM Tree: "+Pm);
						if (Pm == false) {
							if ((loggedUserID != assignedID) || (statusID == 2) || (statusID == 4)) {
								BoolAck = BoolAck.replace('input type', 'input disabled type');
								WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
								vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="+++" disabled id');
								vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name'); //selTaskStatus
								vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
								vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
								dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
								dtaskUpdateIcon = "<div onclick='clickdico(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
							} else {
								vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="***" id');
								vFilteredStartDate = taskStartDate;
								vFilteredDueDate = taskDueDate;
							}
						} else {
							if ((statusID == 2) || (statusID == 4)) {
								BoolAck = BoolAck.replace('input type', 'input disabled type');
								WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
								vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="+++" disabled id');
								vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name'); //selTaskStatus
								vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
								vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
								dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
								dtaskUpdateIcon = "<div onclick='clickdico(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
							} else {
								vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="***" id');
								vFilteredStartDate = taskStartDate;
								vFilteredDueDate = taskDueDate;
							}
						}
						//AVAILABLE DATE FIELDS------------------------------------------------------
						if (taskCDependency == "startToStart") { // Si la dependencia es startToStart, se desabilita el picker StartDate
							vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
						} else if (taskCDependency == "startToFinish" || taskCDependency == "finishToFinish") {
							vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
						}
						vFilteredEmployeesList = vFilteredEmployeesList.replace('selectAsignee', 'selectAsignee' + count);
						vFilteredEmployeesList = vFilteredEmployeesList.replace('selected >', 'selected>');
						var fTx = vFilteredEmployeesList.split("selected>").pop();
						//console.log('Antes: ' + fTx[0]);
						fTx = fTx.substring(0, fTx.indexOf('<'));
						//console.log('Despues: ' + fTx);
						vFilteredEmployeesList = vFilteredEmployeesList.replace('</label>', '</label><p style="font-size:0px;position:absolute;">' + fTx + '</p>');
						var row = '';

						$('table#tableTask tbody tr').remove();
						
						row += "<tr>" +
						"  <th width='10%'><strong>Task</strong></th>" +
						"  <th class='styleToId'><span id='vtaskID" + count + "' style='display:none'>" + taskID + "</span><label data-taskid='" + taskID + "' data-wrikeid='" + WrikeID + "' href='#' style='font-size:16px;' target='_blank'> " +
							titleTask + "</label><input onclick='' id='dicoTreeTask1' class='filterButton' style='display: none' align='right' type='button' value='Save'/></th>" +
						"</tr>" +
						"<tr>" +
						"  <td><strong>Assigned</strong></td>" +
						"  <td>" + vFilteredEmployeesList + "</td>" +
						"</tr>" +
						"<tr>" +
						"  <td><strong>ACK</strong></td>" +
						"  <td id='TaskAck_" + count + "'>" + BoolAck + "</td>" +
						"</tr>" +
						"<tr>" +
						"  <td><strong>Status</strong></td>" +
						"  <td id='TaskStatus_" + count + "'>" + vFilteredStatusList + "</td>" +
						"</tr>" +
						"<tr>" +
						"  <td><strong>Start Date</strong></td>" +
						"  <td>" + vFilteredStartDate + "</td>" +
						"</tr>" +
						"<tr>" +
						"  <td ><strong>Due Date</strong></td>" +
						"  <td>" + vFilteredDueDate + "</td>" +
						"</tr>" +
						"<tr>" +
						"  <td><strong>Work On Weekends</strong></td>" +
						"  <td>" + WorkWeekendDisplay + "</td>" +
						"</tr>" +
						"<tr>" +
						"  <td><strong>Duration</strong></td>" +
						"  <td><p style='font-size:0px;position:absolute;'>" + taskDuration + "</p>" + dtaskDuration + "</td>" +
						"</tr>";
						
						rowA = "<tr>" +
						"  <th width='10%'><strong>Task</strong></th>" +
						"  <th colspan=\"3\" class='styleToId'><span id='vtaskID" + count + "' style='display:none'>" + taskID + "</span><label data-taskid='" + taskID + "' data-wrikeid='" + WrikeID + "' href='#' style='font-size:16px;' target='_blank'> " +
							titleTask + "</label><input onclick='' id='dicoTreeTask1' class='filterButton' style='display: none' align='right' type='button' value='Save'/></th>" +
						"</tr>" +
						"<tr>" +
						"  <td><strong>Assigned</strong></td>" +
						"  <td colspan=\"3\">" + vFilteredEmployeesList + "</td>" +
						"</tr>" +
						"<tr>" +
						"  <td><strong>ACK</strong></td>" +
						"  <td colspan=\"3\" id='TaskAck_" + count + "'>" + BoolAck + "</td>" +
						"</tr>" +
						"<tr>" +
						"  <td><strong>Status</strong></td>" +
						"  <td colspan=\"3\" id='TaskStatus_" + count + "'>" + vFilteredStatusList + "</td>" +
						"</tr>" +
						"<tr>" +
						"  <td><strong>Start Date</strong></td>" +
						"  <td width='40%'>" + vFilteredStartDate + "</td>" +
						"  <td ><strong>Due Date</strong></td>" +
						"  <td width='40%'>" + vFilteredDueDate + "</td>" +
						"</tr>" +
						"<tr>" +
						"  <td><strong>Work On Weekends</strong></td>" +
						"  <td>" + WorkWeekendDisplay + "</td>" +
						"  <td><strong>Duration</strong></td>" +
						"  <td><p style='font-size:0px;position:absolute;'>" + taskDuration + "</p>" + dtaskDuration + "</td>" +
						"</tr>";
						
						
						//-----------------------------------------------------
						row += '<tr>' +
						'<td colspan="4">' +
						'	<div class="row">' +
						'		<div class="col-sm-6 col-md-6">' +
						'			<div class="panel panel-primary">' +
						'				<div class="panel-heading">' +
						'					<h4 class="panel-title">Predecessor</h4>' +
						'				</div>' +
						'				<div class="panel-body" id="tdPredecessor">' +
						' 					' +
						'				</div>' +
						'			</div>' +
						'		</div>' +
						'			<div class="col-sm-6 col-md-6">' +
						'			<div class="panel panel-primary">' +
						'				<div class="panel-heading">' +
						'					<h4 class="panel-title">Successor</h4>' +
						'				</div>' +
						'				<div class="panel-body" id="tdSucessor">' +
						'				</div>' +
						'			</div>' +
						'		</div>' +
						'	</div>' +
						'</td>' +
						'</tr>';
						//-----------------------------------------------------
						row += "<tr>" +
						"	<td colspan='4'>" +
						'	<iframe height="600px" width="100%" frameBorder="0" and scrolling="no" id="wrike_comment_iframe" src="" style="display:none;"></iframe>';
						"		" +
						"	</td>" +
						"</tr>";
						//-----------------------------------------------------
						//console.log(row);
						$("table#tableTask > tbody").append(row);
						showPress(taskID, 'customrecord_task_predecessor', 'custrecord_tp_parent', 'custrecord_tp_predecessor', "treePredecessor");
						showSucc(taskID, 'customrecord_task_successor', 'custrecord_ts_parent', 'custrecord_ts_successor', 'treeSuccessor');

						openWrikeComment(WrikeID, taskID, true);

						///5 showTaskDatePick
						flatpickr('.showTaskDatePick', {
							dateFormat: CalendarInputFormat
						}); // initialized picker


						if (fromClick == 'table') {
							//Select Item
							//Colapse all Tree Categories
							Global_collapseFirst.forEach(function(firstCat, index) {
								firstCat.forEach(function(valCat, index) {
									Global_myTreeViewTask.closeItem(valCat.split('~')[0]);
								});
							}); //End Colapse all Tree
							setTimeout(function() {
								//Open Nodes
								var type = treePosition.substring(0, 1);
								var countNode = [];
								switch (type) {
									case 'A':
										countNode = treePosition.split('-');
										var concaNode = [];
										countNode.forEach(function(node, index) {
											if (index != countNode.length - 1) {
												concaNode.push(node);
												Global_myTreeViewTask.openItem([concaNode.join('-')]);
											}
										});
										Global_myTreeViewTask.selectItem(treePosition);
										//Global_myTreeViewTask.focusItem(treePosition);
										break;
									case 'I':
										countNode = treePosition.split('-');
										var concaNode = [];
										countNode.forEach(function(node, index) {
											if (index != countNode.length - 1) {
												concaNode.push(node);
												if (index != 0) {
													Global_myTreeViewTask.openItem([concaNode.join('-')]);
												}
											}
										});
										Global_myTreeViewTask.selectItem(treePosition);
										//Global_myTreeViewTask.focusItem(treePosition);
										break;
									case 'P':
										countNode = treePosition.split('-');
										var concaNode = [];
										countNode.forEach(function(node, index) {
											if (index != countNode.length - 1) {
												concaNode.push(node);
												Global_myTreeViewTask.openItem([concaNode.join('-')]);
											}
										});
										Global_myTreeViewTask.selectItem(treePosition);
										//Global_myTreeViewTask.focusItem(treePosition);															
										break;
									default:
										if(WF_DEBUG)
											console.log('Nothing count Node');
										break;
								}
								//End Open Nodes
							}, 200);
						}
					};
				};
			},
			error: function(err) {
				console.log('err',err);
			}
		});
		//-----------------------------------------------------------
	}
//---showTask<

	// Show Predecesor and Sucessor functions
//---showPress>
function showPress(idTask, IDType, IdParent, IdField, parent, fromUpdate) {
	if (WF_DEBUG)
		console.info("showPress(idTask, IDType, IdParent, IdField, parent, fromUpdate)",idTask, IDType, IdParent, IdField, parent, fromUpdate);
	
	if (WF_DEBUG_AJAX)
		console.info("ajax action: showPress", getUrl().RT2 );

		$.ajax({
			url: getUrl().RT2,
			data: {
				'action': 'showPress',
				'WhichTask': idTask,
				'IDType': IDType,
				'IdParent': IdParent,
				'IdField': IdField
			},
			async: false,
			dataType: 'json',
			beforeSend: function(data) {
				if (fromUpdate) {
					$('#tdPredecessor').children().remove();
				}
			},
			success: function(results) {
				var rowpre = '';
				console.log("showPress Results",results);
				results.forEach(function(press, index) {
					$('#preWO').hide();
					console.log("Predecesor",press);
					rowpre = '';
					rowpre += " " +
					"<a onclick='showTask(" + press.idTask + ",\"table\");''>" + press.title + "</a>" +
					"<br>" +
					"<div>" +
					"	<div style='float: left'>" +
					"		<p>" + (press.startdate) + " - " + (press.duedate) + "</p>" +
					"		<p>" + press.assigned + "</p>" +
					"	</div>" +
					"	<div style='float: right'>" +
					"		<p align='rigth'>" + press.duration + " day(s) </p>" +
					"		<p align='rigth'>" + press.status + " </p>" +
					"	</div >" +
					"</div>";
					$("#tdPredecessor").append(rowpre);
				});
			},
			error: function(err) {
				console.log('err',err);
			}
		});
	} // End Succ-Press
//---showPress<

//---showSucc>
function showSucc(idTask, IDType, IdParent, IdField, parent, fromUpdate) {
		if (WF_DEBUG)
			console.info("showSucc(idTask, IDType, IdParent, IdField, parent, fromUpdate)", idTask, IDType, IdParent, IdField, parent, fromUpdate );
		
		var table = 'table';
		
		if (WF_DEBUG_AJAX)
			console.info("ajax action: showPress", getUrl().RT2 );
		
		$.ajax({
			url: getUrl().RT2,
			data: {
				'action': 'showSucc',
				'WhichTask': idTask,
				'IDType': IDType,
				'IdParent': IdParent,
				'IdField': IdField
			},
			async: false,
			dataType: 'json',
			beforeSend: function(data) {
				if (fromUpdate) {
					$('#tdSucessor').children().remove();
				}
			},
			success: function(results) {
				console.log("showPress Results",results);
				var rowpre = '';
				results.forEach(function(press, index) {
					//	$('#tdSucessor').children().delayed();
					//	$('#tdSucessor').children().remove();
					rowpre = '';
					$("#succWO").hide();
					rowpre += "" +
					"<a onclick='showTask(" + press.idTask + ",\"table\");''>" + press.title + "</a>" +
					"<br>" +
					"<div>" +
					"	<div style='float: left'>" +
					"		<p>" + (press.startdate) + " - " + (press.duedate) + "</p>" +
					"		<p>" + press.assigned + "</p>" +
					"	</div>" +
					"	<div style='float: right'>" +
					"		<p align='rigth'>" + press.duration + " day(s) </p>" +
					"		<p align='rigth'>" + press.status + " </p>" +
					"	</div >" +
					"</div>";
					$("#tdSucessor").append(rowpre);
				});
			},
			error: function(err) {
				console.log('err',err);
			}
		});
	} //End showSucc ---------------------------------------------------------
//---showPress<

//-- Task Tree End

// Function to get AllServices	
//---ChangeTableAllServices>						
function ChangeTableAllServices(WhichSalesOrder) {
	if (WF_DEBUG)
		console.info("ChangeTableAllServices(WhichSalesOrder)", WhichSalesOrder );
	
	if (WF_DEBUG_AJAX)
		console.info("ajax action: getAllServices", getUrl().BSL );
	
	//console.log('WhichSalesOrder is now: ' + WhichSalesOrder);
	//headers = new Array();
	//headers["Content-Type"]="application/json";
	$.ajax({
		//url: 'https://rest.sandbox.netsuite.com/app/site/hosting/restlet.nl?script=1386&deploy=1'
		//url: '/app/site/hosting/restlet.nl?script=1386&deploy=1'
		url: getUrl().BSL,
		data: {
			'action': 'getAllServices',
			'SO': WhichSalesOrder
		}
		//,
		// beforeSend: function (xhr){
		//       xhr.setRequestHeader('Authorization', 'NLAuth nlauth_email="ibo2@transtelco.net", nlauth_signature="TTCO-ibo2013", nlauth_account="3461650", nlauth_role="3"');
		//   }
		// headers : {"Authorization" : 'NLAuth nlauth_email="alejandro@solutionseekers.xyz", nlauth_signature="Ordnajela14", nlauth_account="3461650", nlauth_role="18"'}


		// headers : {"Authorization" : 'NLAuth nlauth_email="ibo2@transtelco.net", nlauth_signature="TTCO-ibo2013", nlauth_account="3461650", nlauth_role="3"'}
		,
		async: false,
		dataType: 'json',
		success: function(data) {
			var row = '';
			var count = 0;
			//console.log('Data stream All Services: ' + data[0]);
			data.forEach(function(d) {
				row += "<tr data-line='" + d.line +
					"' data-item='" + d.itemid +
					"' data-toshow='" + d.line + "_" + d.itemid + "'>" +
					"<td align='justify'><input type='checkbox' onchange='SetFilterToTasks.call(this)'/></td>" +
					"<td class='styleToId' style='vertical-align: middle;'>" + d.itemName + "</td>" +
					"<td align='center'>" + d.capacity + "</td>" + "<td align='center'>" + d.UoM + "</td>" +
					"<td>" + d.LocationA + "</td>" +
					"<td>" + d.AddressA + "</td>" +
					"<td>" + d.LocationZ + "</td>" +
					"<td>" + d.AddressZ + "</td>" +
					"<td>" + d.subscription + "</td>" + 
					"</tr>";
				//console.log( d);
			});
			$("table#myUpdatedSA").find('tr:not(:first)').each(function() {
				$(this).remove();
			});
			$("table#myUpdatedSA > tbody").append(row);
		},
		error: function(err) {
			console.log('err',err);
		}
	});
}
//---ChangeTableAllServices<

//---pageTasks>
function pageTasks(thefunction) {
	//	var tamSlice = 20;

	var slice = parseInt($('#ButtonLoadMoreTasks').attr("data-slice"));

	var lastFunction = parseInt($('#ButtonLoadMoreTasks').attr("data-function"));

	var moreslice = slice + 1;
	//
	// if(moreOrAll == "all"){
	//
	// $("table#mytblTasks > tbody > tr ").remove();
	// 	slice = 0;
	// 	moreslice = 8000;
	//
	// }else if(!moreOrAll){
	// 	moreslice = parseInt(slice)+tamSlice;
	// }
	// else
	// {
	// 	$("table#mytblTasks > tbody > tr ").remove();
	// 	slice = 0;
	// }

	if (lastFunction != thefunction) {
		$('#ButtonLoadMoreTasks').attr("data-slice", -1);
		moreslice = 0;
	} else {
		$('#ButtonLoadMoreTasks').attr("data-slice", moreslice);
	}

	$('#ButtonLoadMoreTasks').attr("data-function", thefunction);

	return moreslice;

}
//---pageTasks<

//---ResetFiltersCheckbox>
function ResetFiltersCheckbox () {
	$(".myUpdatedSA").find('input[type=checkbox]').each(function() {
		$(this).prop('checked',false);
	});
	$(".myUpdatedServicesAddresses").find('input[type=checkbox]').each(function() {
		$(this).prop('checked',false);
	});
}
//---ResetFiltersCheckbox<

//---ChangeTableTasks>
function ChangeTableTasks(WhichSalesOrder, Pm, fromReload) {
	if (WF_DEBUG)
		console.info("ChangeTableTasks(WhichSalesOrder, Pm, fromReload)", WhichSalesOrder, Pm, fromReload );
	
	//$('table#mytblTasks tbody tr').remove();
	ResetFiltersCheckbox();
	//1111111
	$('.filtersBar').slideDown("7000");
	$('.div-selectassigned').css("display", "inline-block");
	$('.div-selectdepartment').css("display", "inline-block");
	$('.div-selecttaskstatus').css("display", "inline-block");
	$('.div-selectStartDate').css("display", "inline-block");
	$('.div-selectDueDate').css("display", "inline-block");
	$('.div-selectWoW').css("display", "inline-block");
	$('.div-selectDuration').css("display", "inline-block");
	//$('#filterStartDate').prop("disabled", true);
	//$('#filterDueDate').prop("disabled", true);
	$('#filterStartDate').val('');
	$('#filterDueDate').val('');
	
	//--Ariel buscando el selecyt dentro de aqui ... $('.div-selectassigned').css({'font-weight':'normal','height':'32px'});

	var currentSlice = pageTasks(1);
	var count = 0;
	
	if (WF_DEBUG_AJAX)
		console.info("ajax action: getTasksTable", getUrl().RT );
	
	$.ajax({
		"info": true,
		//url: '/app/site/hosting/restlet.nl?script=1386&deploy=1'
		url: getUrl().RT,
		data: {
			'action': 'getTasksTable',
			'WhichSalesOrder': WhichSalesOrder,
			'pm': Pm,
			'selectPage': currentSlice,
		},
		dataType: 'json',
		async: true,
		beforeSend: function(data) {
			$('#mytblTasks').DataTable().destroy();
			//if (fromReload) {
				$('#mytblTasks > tbody > tr').remove();
			//}
		},
		complete: function(data) {

			setTimeout(function() {
				if ($.fn.dataTable.isDataTable('#mytblTasks')) {
					$('#mytblTasks').DataTable().destroy();
				}
				// else {
				table = $('#mytblTasks').DataTable({
					"scrollY": "600px",
					"scrollCollapse": true,
					"paging": false,
					"info": true,
					"info": true,
					"deferRender": true,
					"order": [
						[4, "asc"]
					]
				});
				//}
				$('input[type="search"]').attr("placeholder", " SO/Task/Date/Text");
				$('input[type="search"]').css('height', '50%');
				$('input[type="search"]').css('display', 'inline-block');
				$('.select2-search__field').attr("placeholder", " Filter by status of the Sales Orders by clicking on this field");

				if ($('.tabsalesorder-content img#mymicrophone').length < 1) {
					$('span.select2.select2-container.select2-container--default').after(
						'  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'salesorder\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');
				}

				if ($('.tabsalesorder-content img#mymicrophone').length < 2) {

					//$('.tabsalesorder-content input[type="search"]').after('  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'salesorder\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');
					$('#tableSOcount_filter input[type="search"]').after(
						'  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'salesorder\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');

					$('#salesorder_filter input[type="search"]').after(
						'  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'salesorder\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');
				}
				if ($('#mytblTasks_wrapper img#mymicrophone').length < 1) {
					$('#mytblTasks_wrapper input[type="search"]').after(
						'  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'mytblTasks\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');
				}
				if ($('#Customsalesorder_wrapper img#mymicrophone').length < 1) {
					$('#Customsalesorder_wrapper input[type="search"]').after(
						'  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'Customsalesorder\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');
				}
				webshims.setOptions('forms-ext', {
					types: 'date'
				});
				webshims.polyfill('forms forms-ext');
				$.webshims.formcfg = {
					en: {
						dFormat: '/',
						dateSigns: '/',
						patterns: {
							d: "mm/dd/yy"
						}
					}
				};
				webshims.activeLang('en');
				// Colouring in red the first task that is the earliest
				//$("#mytblTasks tr:nth-child(1) td").css('background-color','#FF8086');
			}, 1000);

			//--$(".loader").hide('fast');
			$('table#mytblTasks').css("display", "block");
			// console.log(data);
			// window.arrayalex = data;
			// window.alex = data.responseJSON;
			var AllRows = data.responseJSON[0];
			var moreslice = parseInt((currentSlice + 1) * 20); // add one because start in 0 and is multiply by 20 (registers)

			if (moreslice < AllRows) {
				$('#RegistersfromTaskTable1').text(moreslice + " / " + AllRows + " tasks");
				$('#RegistersfromTaskTable2').text(moreslice + " / " + AllRows + " tasks");
				$('#ButtonLoadMoreTasks').prop('disabled', false);
			} else {
				$('#RegistersfromTaskTable1').text(AllRows + " / " + AllRows + " tasks");
				$('#RegistersfromTaskTable2').text(AllRows + " / " + AllRows + " tasks");
				$('#ButtonLoadMoreTasks').prop('disabled', true);
			}

		},
		success: function(data) {
			if(WF_DEBUG)
				console.log('success data:',data);
			//	window.arrayalex = data;
			var row;
			count = 0;

			data[1].forEach(function(d) {
				GlobalStartDate = d.GlobalStartDate;
				GlobarDueDate = d.GlobalDueDate;

				// We get the logged user ID
				var loggedUserID = Math.round($('input#custpage_userid').val());

				//  This variable will set the suffix for the iterative row on course.
				count++;
				WorkWeekend = d.taskWorkWeekend; // Assigment of Work on Weekend status for current task
				var WorkWeekendDisplay;
				// We save the Work on Weekend state here
				var WorkWeekend = d.taskWorkWeekend;
				// If the employee works on Weekends then make the check input to be marked
				if (WorkWeekend) {
					WorkWeekendDisplay = "<input type='checkbox' onchange='changeWorkOnWeekends.call(this)' id='WorkOnWeekends_" + count + "' name='check' class='check' checked /><p style='font-size:0px;position:absolute;'>true</p>"
						// This will input something like: $("input[id='WorkOnWeekends_7']").attr('checked', true)
				} else {
					WorkWeekendDisplay = "<input type='checkbox' onchange='changeWorkOnWeekends.call(this)' id='WorkOnWeekends_" + count + "' name='check' class='check' /><p style='font-size:0px;position:absolute;'>false</p>"
				}
				var BoolAck;
				if (d.taskAck) {
					BoolAck = "<input type='checkbox' onchange='changeAck.call(this)' id='Ack_" + count + "' name='check' disabled class='check' checked />"
				} else {
					BoolAck = "<input type='checkbox' onchange='changeAck.call(this)' id='Ack_" + count + "' name='check' class='check' />"
				}
				
				var vFilteredEmployeesList = lstEmployeeSelect.replace(d.taskAssignedID, d.taskAssignedID + ' selected');

				var vFilteredStatusList = lstStatusSelect;
				if (d.taskStatus) {
					vFilteredStatusList = lstStatusSelect.replace(d.taskStatus, d.taskStatus + " selected");
				}

				var vFilteredStatusList = vFilteredStatusList.replace('class="selectTaskStatus"', 'class="selectTaskStatus" title="You won\'t be able to update this task once the status changes to "completed/cancelled"');
				var vFilteredStatusList = vFilteredStatusList.replace('id="selTaskStatus"', 'id="selTaskStatus' + count + '"');
				var StatusTareaTexto = '';
				var StatusTaskLabel = ['','Active','Completed','Deferred','Cancelled'];
				StatusTareaTexto = StatusTaskLabel[d.taskStatus];
				
				var vFilteredStatusList = vFilteredStatusList.replace('</select>', '</select><p  class="kiko" style="font-size:0px;position:absolute;">' + StatusTareaTexto + '</p>');
				//console.log("Status "+count + " : "+d.taskStatus)
				// Impersoned Logged user
				//loggedUserID = 21562;
				// Disable Start Date and Due Date if user ID don't match for the current row
				dtaskStartDate = d.taskStartDate;
				dtaskDueDate = d.taskDueDate;
				dtaskDuration = "<input id='idTask_Duration_" + count + "' onblur='blurDuration.call()' onkeyup='changeDuration.call(this)' data-dependency='" + d.taskDependency + "' data-predecessor='" + d.taskPredecessor +
					"' type='text' size='3' value=" + d.taskDuration + " data-wrikeid='" + d.WrikeID + "' data-salesorder='" + WhichSalesOrder + "'>";
				//dtaskUpdateIcon = "<div id='dico" + count + "' class='GoUpdateDisabled'></div>";
				dtaskUpdateIcon = "<div onclick='clickdico.call(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
				//console.log('count = ' + count + ' loggedUserID = ' + loggedUserID + ' d.taskAssignedID = ' +  d.taskAssignedID);
				//console.log('dtaskStarte: ' + dtaskStartDate);
				//console.log("PM : "+Pm);
				if (Pm == false) {
					if ((loggedUserID != d.taskAssignedID) || (d.taskStatus == 2) || (d.taskStatus == 4)) {
						//console.log(vFilteredEmployeesList);
						// Disable Asigned field if user ID don't match for the current row
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="+++" disabled id');
						vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
						vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
						WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
						BoolAck = BoolAck.replace('input type', 'input disabled type');
						vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name'); //selTaskStatus
						dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
						dtaskUpdateIcon = "<div onclick='clickdico(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
						//dtaskUpdateIcon = "<div id='dico" + count + "' ><button onclick='clickdico()'>Go</button></div>";
					} else {
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="***" id');
						vFilteredStartDate = d.taskStartDate;
						vFilteredDueDate = d.taskDueDate;
					}
				} else {
					if ((d.taskStatus == 2) || (d.taskStatus == 4)) {
						//console.log(vFilteredEmployeesList);
						// Disable Asigned field if user ID don't match for the current row
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="+++" disabled id');
						vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
						vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
						WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
						BoolAck = BoolAck.replace('input type', 'input disabled type');
						vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name'); //selTaskStatus
						dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
						dtaskUpdateIcon = "<div onclick='clickdico(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
						//dtaskUpdateIcon = "<div id='dico" + count + "' ><button onclick='clickdico()'>Go</button></div>";
					} else {
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="***" id');
						vFilteredStartDate = d.taskStartDate;
						vFilteredDueDate = d.taskDueDate;
					}
				}

				if (d.taskDependency == "startToStart") { // Si la dependencia es startToStart, se desabilita el picker StartDate
					vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
				} else if (d.taskDependency == "startToFinish" || d.taskDependency == "finishToFinish") {
					vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
				}
				vFilteredEmployeesList = vFilteredEmployeesList.replace('selectAsignee', 'selectAsignee' + count);
				vFilteredEmployeesList = vFilteredEmployeesList.replace('selected >', 'selected>');
				var fTx = vFilteredEmployeesList.split("selected>").pop();
				fTx = fTx.substring(0, fTx.indexOf('<'));

				flagColorRedRow = getColorTaskValidate(d.setColortoRedOutDated, d.yellow, d.taskStatus);

				vFilteredEmployeesList = vFilteredEmployeesList.replace('</label>', '</label><p style="font-size:0px;position:absolute;">' + fTx + '</p>');
				row += "<tr data-id=" + d.taskId + " data-userid=" + d.taskAssignedID + " data-toshow='" + d.taskKpiLine + "_" + d.taskKpiItem + "' data-toshowaddress='" + d.taskKpiAddress + "' >" +
					"<td class='styleToId' " + flagColorRedRow + "><span id='vtaskID" + count + "'  style='display:none'>" + d.taskId + "</span><a href='#' data-taskid='" + d.taskId + "' data-wrikeid='" + d.WrikeID + "' class='toOpenWrike'> " + d.taskTitle +
					"</a></td>" +
					"<td class='styleToEntity' title='" + loggedUserID + " vs " + d.taskAssignedID + "' " + flagColorRedRow + ">" + vFilteredEmployeesList + "</td>" +
					"<td align='center' id='TaskAck_" + count + "' " + flagColorRedRow + ">" + BoolAck + "</td>" +
					"<td id='TaskStatus_" + count + "' " + flagColorRedRow + ">" + vFilteredStatusList + "</td>" +
					"<td " + flagColorRedRow + ">" + vFilteredStartDate + "</td>" +
					"<td " + flagColorRedRow + ">" + vFilteredDueDate + "</td>" +
					"<td align='center'  " + flagColorRedRow + ">" + WorkWeekendDisplay + "</td>" +
					"<td align='center' " + flagColorRedRow + ">" + "<p style='font-size:0px;position:absolute;'>" + d.taskDuration + "</p>" + dtaskDuration + "</td>"
					// "<td align='center' " + flagColorRedRow + ">" + dtaskUpdateIcon + "</td>" +
					"</tr>";
				//return (count < 100);							//console.log(d.taskPredecessor);
			});
			//console.log(count);
			$("table.mytblTasks > tbody").append(row);
			
			flatpickr('.toDatePicker1', {
				dateFormat: CalendarInputFormat
			}); // initialized picker
			
		},
		error: function(err) {
			//	alert("Ocurrio un error, vuelva a intentarlo! ");
			console.log('err',err);
		}
	}); // End of ChangeTableTasks function

} // End ChangeTableTasks
//---ChangeTableTasks<

//---ChangeTableTasksParams>
function ChangeTableTasksParams(arrayParams, Pm) {
	if (WF_DEBUG)
		console.info("ChangeTableTasksParams(arrayParams, Pm)", arrayParams, Pm );

	ResetFiltersCheckbox();
	// Loop the provided loop in array to get list parameters
	// Si FD.length = 0 || FD==0  :"-"	en FD y TD
	WhoFilterSO = arrayParams[0];
	WhoFilterAsignee = arrayParams[1];
	WhoFilterTask = arrayParams[2];
	WhoFilterSD = arrayParams[3];
	WhoFilterDD = arrayParams[4];
	WhoFilterWoW = arrayParams[5];
	WhoFilterDurationFrom = arrayParams[6];
	WhoFilterDurationTo = arrayParams[7];
	WhoFilterDepartment = arrayParams[8];

	if (WhoFilterDurationFrom.length == 0 || WhoFilterDurationFrom == 0) {
		WhoFilterDurationFrom = '-';
	}
	if (WhoFilterDurationTo == '' || WhoFilterDurationTo == 0) {
		WhoFilterDurationTo = '-';
	}
	$('table#mytblTasks tbody tr').remove();
	$('table#mytblTasks').css("display", "block");
	$('.filtersBar').slideDown("7000");
	$('.div-selectassigned').css("display", "inline-block");
	$('.div-selectdepartment').css("display", "inline-block");
	$('.div-selecttaskstatus').css("display", "inline-block");
	$('.div-selectStartDate').css("display", "inline-block");
	$('.div-selectDueDate').css("display", "inline-block");
	$('.div-selectWoW').css("display", "inline-block");
	$('.div-selectDuration').css("display", "inline-block");

	var currentPage = pageTasks(2);
	console.log(currentPage);
	
	if (WF_DEBUG_AJAX)
		console.info("ajax action: getTasksTablev2", getUrl().RT );
	
	$.ajax({
		"info": true,
		//url: '/app/site/hosting/restlet.nl?script=1386&deploy=1',
		url: getUrl().RT,
		data: {
			'action': 'getTasksTablev2',
			'WhichSalesOrder': WhoFilterSO,
			'assignedTo': WhoFilterAsignee,
			'DepartmentTo': WhoFilterDepartment,
			'StatusId': WhoFilterTask,
			'StartDate': WhoFilterSD,
			'DueDate': WhoFilterDD,
			'WoW': WhoFilterWoW,
			'FD': WhoFilterDurationFrom,
			'TD': WhoFilterDurationTo,
			'selectPage': currentPage
		},
		dataType: 'json',
		beforeSend: function(data) {
			$('#mytblTasks').DataTable().destroy();
			$('#mytblTasks tbody tr').remove();

		},
		success: function(data) {
			var row = '';
			var count = 0;
			//console.log(data);
			//console.log(data[0]);

			data[1].forEach(function(d) {
				//console.log(d);
				GlobarDueDate = d.GlobalDueDateRed;
				GlobalStartDate = d.GlobalStartDate;

				// We get the logged user ID
				var loggedUserID = $('input#custpage_userid').val();
				if (loggedUserID == '') {
					alert('Undetermined user, please login');
				}
				// We collect the user ID which is current in the active session
				loggedUserID = Math.round(loggedUserID);
				//  This variable will set the suffix for the iterative row on course.
				count++;
				WorkWeekend = d.taskWorkWeekend; // Assigment of Work on Weekend status for current task
				var WorkWeekendDisplay;
				// We save the Work on Weekend state here
				var WorkWeekend = d.taskWorkWeekend;
				// If the employee works on Weekends then make the check input to be marked
				if (WorkWeekend) {
					WorkWeekendDisplay = "<input type='checkbox' onchange='changeWorkOnWeekends.call(this)' id='WorkOnWeekends_" + count + "' name='check' class='check' checked />"
						// This will input something like: $("input[id='WorkOnWeekends_7']").attr('checked', true)
				} else {
					WorkWeekendDisplay = "<input type='checkbox' onchange='changeWorkOnWeekends.call(this)' id='WorkOnWeekends_" + count + "' name='check' class='check' />"
				}
				var BoolAck;
				if (d.taskAck) {
					BoolAck = "<input type='checkbox' onchange='changeAck.call(this)' id='Ack_" + count + "' name='check' disabled class='check' checked />"
				} else {
					BoolAck = "<input type='checkbox' onchange='changeAck.call(this)' id='Ack_" + count + "' name='check' class='check' />"
				}
				var vFilteredEmployeesList = lstEmployeeSelect.replace(d.taskAssignedID, d.taskAssignedID + ' selected');
				//var vFilteredStatusList = lstStatusSelect.replace(d.taskStatus + '"', d.taskStatus + '" selected');
				//console.log('lstStatusSelect: '+lstStatusSelect);
				var vFilteredStatusList = lstStatusSelect.replace(d.taskStatus, d.taskStatus + " selected");
				var vFilteredStatusList = vFilteredStatusList.replace('selTaskStatus', 'selTaskStatus' + count); //selTaskStatus
				var vFilteredStatusList = vFilteredStatusList.replace('id="selTaskStatus"', 'id="selTaskStatus' + count + '"');
				var StatusTareaTexto = '';
				var StatusTaskLabel = ['','Active','Completed','Deferred','Cancelled'];
				StatusTareaTexto = StatusTaskLabel[d.taskStatus];
				
				var vFilteredStatusList = vFilteredStatusList.replace('</select>', '</select><p  class="kiko" style="font-size:0px;position:absolute;">' + StatusTareaTexto + '</p>');
				//console.log("Status "+count + " : "+d.taskStatus)
				// Impersoned Logged user
				//loggedUserID = 21562;
				// Disable Start Date and Due Date if user ID don't match for the current row
				dtaskStartDate = d.taskStartDate;
				dtaskDueDate = d.taskDueDate;
				dtaskDuration = "<input id='idTask_Duration_" + count + "' onblur='blurDuration.call()' onkeyup='changeDuration.call(this)' data-dependency='" + d.taskDependency + "' data-predecessor='" + d.taskPredecessor +
					"' type='text' size='2' value=" + d.taskDuration + " data-wrikeid='" + d.WrikeID + "' data-salesorder='" + WhoFilterSO + "'>";
				//dtaskUpdateIcon = "<div id='dico" + count + "' class='GoUpdateDisabled'></div>";
				dtaskUpdateIcon = "<div onclick='clickdico.call(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
				//console.log('count = ' + count + ' loggedUserID = ' + loggedUserID + ' d.taskAssignedID = ' +  d.taskAssignedID);
				//console.log('dtaskStarte: ' + dtaskStartDate);
				//console.log("PM : "+Pm);
				if (Pm == false) {
					if ((loggedUserID != d.taskAssignedID) || (d.taskStatus == 2) || (d.taskStatus == 4)) {
						//console.log(vFilteredEmployeesList);
						// Disable Asigned field if user ID don't match for the current row
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="+++" disabled id');
						vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
						vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
						WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
						BoolAck = BoolAck.replace('input type', 'input disabled type');
						vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name'); //selTaskStatus
						dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
						dtaskUpdateIcon = "<div onclick='clickdico(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
						//dtaskUpdateIcon = "<div id='dico" + count + "' ><button onclick='clickdico()'>Go</button></div>";
					} else {
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="***" id');
						vFilteredStartDate = d.taskStartDate;
						vFilteredDueDate = d.taskDueDate;
					}
				} else {
					if ((d.taskStatus == 2) || (d.taskStatus == 4)) {
						//console.log(vFilteredEmployeesList);
						// Disable Asigned field if user ID don't match for the current row
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="+++" disabled id');
						vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
						vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
						WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
						BoolAck = BoolAck.replace('input type', 'input disabled type');
						vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name'); //selTaskStatus
						dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
						dtaskUpdateIcon = "<div onclick='clickdico(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
						//dtaskUpdateIcon = "<div id='dico" + count + "' ><button onclick='clickdico()'>Go</button></div>";
					} else {
						vFilteredEmployeesList = vFilteredEmployeesList.replace('select id', 'select mytag="***" id');
						vFilteredStartDate = d.taskStartDate;
						vFilteredDueDate = d.taskDueDate;
					}
				}
				if (d.taskDependency == "startToStart") { // Si la dependencia es startToStart, se desabilita el picker StartDate
					vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
				} else if (d.taskDependency == "startToFinish" || d.taskDependency == "finishToFinish") {
					vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
				}
				vFilteredEmployeesList = vFilteredEmployeesList.replace('selectAsignee', 'selectAsignee' + count);
				vFilteredEmployeesList = vFilteredEmployeesList.replace('selected >', 'selected>');
				var fTx = vFilteredEmployeesList.split("selected>").pop();
				fTx = fTx.substring(0, fTx.indexOf('<'));

				flagColorRedRow = getColorTaskValidate(d.setColortoRedOutDated, d.yellow, d.taskStatus)

				vFilteredEmployeesList = vFilteredEmployeesList.replace('</label>', '</label><p style="font-size:0px;position:absolute;">' + fTx + '</p>');

				row += "<tr data-id=" + d.taskId + " data-userid=" + d.taskAssignedID + " data-toshow='" + d.taskKpiLine + "_" + d.taskKpiItem + "' data-toshowaddress='" + d.taskKpiAddress + "' >" +
					// "<td align='center' " + flagColorRedRow + ">" + d.taskCompany + "</td>" +
					"<td class='styleToId' " + flagColorRedRow + "><span id='vtaskID" + count + "' style='display:none'>" + d.taskId + "</span><a href='#' data-taskid='" + d.taskId + "' data-wrikeid='" + d.WrikeID + "' class='toOpenWrike'> " + d.taskTitle +
					"</a></td>" +
					"<td class='styleToEntity' title='" + loggedUserID + " vs " + d.taskAssignedID + "' " + flagColorRedRow + ">" + vFilteredEmployeesList + "</td>" +
					"<td align='center' id='TaskAck_" + count + "' " + flagColorRedRow + ">" + BoolAck + "</td>" +
					"<td id='TaskStatus_" + count + "' " + flagColorRedRow + ">" + vFilteredStatusList + "</td>" +
					//"<td id='TaskPredecessor_"+count+"'>" + d.taskPredecessor + "</td>" +
					//"<td id='TaskDependency_"+count+"'>" + d.taskDependency + "</td>" +
					"<td " + flagColorRedRow + ">" + vFilteredStartDate + "</td>" +
					"<td " + flagColorRedRow + ">" + vFilteredDueDate + "</td>" +
					"<td align='center'  " + flagColorRedRow + ">" + WorkWeekendDisplay + "</td>" +
					"<td align='center' " + flagColorRedRow + ">" + "<p style='font-size:0px;position:absolute;'>" + d.taskDuration + "</p>" + dtaskDuration + "</td>"
					// "<td align='center' " + flagColorRedRow + ">" + dtaskUpdateIcon + "</td>" +
				"</tr>";

				//console.log(d.taskPredecessor);
			});
			//console.log(count);
			$("table.mytblTasks > tbody").append(row);
		},
		complete: function(data) {

			var AllRows = data.responseJSON[0];
			var moreslice = parseInt((currentPage + 1) * 20); // add one because start in 0 and is multiply by 20 (registers)

			if (moreslice < AllRows) {
				$('#RegistersfromTaskTable1').text(moreslice + " / " + AllRows + " tasks");
				$('#RegistersfromTaskTable2').text(moreslice + " / " + AllRows + " tasks");
				$('#ButtonLoadMoreTasks').prop('disabled', false);
			} else {
				$('#RegistersfromTaskTable1').text(AllRows + " / " + AllRows + " tasks");
				$('#RegistersfromTaskTable2').text(AllRows + " / " + AllRows + " tasks");
				$('#ButtonLoadMoreTasks').prop('disabled', true);
			}

			flatpickr('.toDatePicker2', {
				dateFormat: CalendarInputFormat
			}); // initialized picke

			setTimeout(function() {
				if ($.fn.dataTable.isDataTable('#mytblTasks')) {
					$('#mytblTasks').DataTable().destroy();
				}
				// else {
				table = $('#mytblTasks').DataTable({
					"scrollY": "600px",
					"scrollCollapse": true,
					"paging": false,
					"info": true,
					"order": [
						[4, "asc"]
					]
				});

			}, 1000);
		},
		error: function(err) {
			console.log("Ocurrio un error, vuelva a intentarlo! ",err);
		}
	});
	return false;
} // End ChangeTableTasksParams
//---ChangeTableTasksParams<


//ChangeTableTasks (WhichSalesOrder); // Function to Change in each row Click of Sales Order's Table

//---hideAllNoneAssignedRows>
function hideAllNoneAssignedRows() {
	//console.log('Function to hide all none assigned tasks rows to user');
}
//---hideAllNoneAssignedRows<

//---findEmployeesOfProject>
function findEmployeesOfProject(idSO) {
	if (WF_DEBUG)
		console.info("findEmployeesOfProject(idSO)", idSO );
	
	if (WF_DEBUG_AJAX)
		console.info("ajax action: getEmployeesOfProject", getUrl().RT );
	
	var ReturnedData = {};
	//console.log('The ID for Select is '+idSO)
	//return true;
	$.ajax({
		//url: '/app/site/hosting/restlet.nl?script=1386&deploy=1'
		url: getUrl().RT,
		async: false,
		data: {
			'action': 'getEmployeesOfProject',
			'idSO': idSO
		},
		dataType: 'json',
		success: function(data) {
			//console.log(data);
			var optionSelectConstructor = '';
			data.forEach(function(d) {
				//console.log(d.assignedId);
				//console.log(d.assignedName);
				optionSelectConstructor = optionSelectConstructor + '<option value=' + d.assignedId + '>' + d.assignedName + '</option>';
			});
			ReturnedData = optionSelectConstructor;
		},
		error: function(data) {
			console.log("Someting happend! ");
		}
	});
	return ReturnedData;
}
//---findEmployeesOfProject<

//---getDepartmentOfProject>
function getDepartmentOfProject(idSO) {
	if (WF_DEBUG)
		console.info("getDepartmentOfProject(idSO)", idSO );
	
	if (WF_DEBUG_AJAX)
		console.info("ajax action: getDepartmentOfProject", getUrl().RT );
	
	var ReturnedData = {};
	//console.log('The ID for Select is '+idSO)
	//return true;
	$.ajax({
		//url: '/app/site/hosting/restlet.nl?script=1386&deploy=1'
		url: getUrl().RT,
		async: false,
		data: {
			'action': 'getDepartmentOfProject',
			'idSO': idSO
		},
		dataType: 'json',
		success: function(data) {
			//console.log(data);
			var optionSelectConstructor = '';
			data.forEach(function(d) {
				//console.log(d.assignedId);
				//console.log(d.assignedName);
				optionSelectConstructor = optionSelectConstructor + '<option value=' + d.DepartmentdId + '>' + d.DepartmentName + '</option>';
			});
			ReturnedData = optionSelectConstructor;
		},
		error: function(data) {
			console.log("Someting happend! ");
		}
	});
	return ReturnedData;
}
//---getDepartmentOfProject<

//---UpdateEndByDuration>
function UpdateEndByDuration(idInput) {
	var num = String(idInput).split('_').pop();
	//console.log("IN Num :"+ num);
	/* var p1 = arrayString[1];
	var num = arrayString[2]; */
	var idDueDate = '#idPicker_DueDate_' + num;
	var idStartDate = '#idPicker_StartDate_' + num;
	var idDuration = '#idTask_Duration_' + num;
	var isChecked = $('#WorkOnWeekends_' + num).is(':checked');
	var due = StringNetsuiteDateToDate($(idDueDate).val());
	var Start = StringNetsuiteDateToDate($(idStartDate).val());
	var Duration = $(idDuration).val();
	var DueDate = new Date(computeEndByDuration(Start.getTime(), Duration, isChecked, 0));
	$(idDueDate).val(dateToStringNetsuite(DueDate));
}
//---UpdateEndByDuration<

//---UpdateStartByDuration>
function UpdateStartByDuration(idInput) {
	var num = String(idInput).split('_').pop();
	/* var p1 = arrayString[1];
	var num = arrayString[2]; */
	var idDueDate = '#idPicker_DueDate_' + num;
	var idStartDate = '#idPicker_StartDate_' + num;
	var idDuration = '#idTask_Duration_' + num;
	var isChecked = $('#WorkOnWeekends_' + num).is(':checked');
	var due = StringNetsuiteDateToDate($(idDueDate).val());
	var Start = StringNetsuiteDateToDate($(idStartDate).val());
	var Duration = $(idDuration).val();
	var StartDate = new Date(computeStartByDuration(due.getTime(), Duration, isChecked, 0));

	$(idStartDate).val(dateToStringNetsuite(StartDate));
	// $(idStartDate).children().eq(0).val(formatDate(StartDate));
}
//---UpdateStartByDuration>

//---dhm>
function dhm(t) {
	var cd = 24 * 60 * 60 * 1000,
		ch = 60 * 60 * 1000,
		d = Math.floor(t / cd),
		h = Math.floor((t - d * cd) / ch),
		m = Math.round((t - d * cd - h * ch) / 60000),
		pad = function(n) {
			return n < 10 ? '0' + n : n;
		};
	if (m === 60) {
		h++;
		m = 0;
	}
	if (h === 24) {
		d++;
		h = 0;
	}
	return d + 1;
}
//---dhm<

//---getSelectText>
function getSelectText(selId) {
	var sel = document.getElementById(selId);
	var i = sel.selectedIndex;
	var selected_text = sel.options[i].text;
	return selected_text;
}
//---getSelectText<

//---formatDate>
//function formatDate
function formatDate(date) {
	//	console.log(date);
	if (typeof date === 'string') {

		var d = new Date(StringNetsuiteDateToDate(date));
	} else {
		var d = new Date(date);
	}

	var month = '' + (d.getMonth()),
		day = '' + d.getDate(),
		year = d.getFullYear();
	//year = year.toString().substr(2,2);
	var monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	//if (month.length < 2) month = '0' + month;
	month = monthName[month];
	if (day.length < 2) day = '0' + day;
	return [day, month, year].join('-');
}

function formatDate_OLD(date) {
	var d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear();
	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;
	return [year, month, day].join('-');
}
//---formatDate<

//---formatDatebyNetsuiteDate>
function formatDatebyNetsuiteDate(date) {

	if (typeof date === 'string') {
		var d = new Date(StringNetsuiteDateToDate(date));
	} else {
		var d = new Date(date);
	}

	var d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear();
	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;
	return [year, month, day].join('-');
}
//---formatDatebyNetsuiteDate<

//---Datemasuno>
function Datemasuno(date) {
	return new Date(date);
	// derogate date and calender is working ok now
	var d = new Date(date).getTime();
	d = d + (86400 * 1000); // Add one Day to Current Date
	d = new Date(d);
	return d;
}
//---Datemasuno<

//---isHoliday>
function isHoliday(date, weekend) {
		var friIsHoly = false;
		var satIsHoly = !weekend;
		var sunIsHoly = !weekend;
		pad = function(val) {
			val = "0" + val;
			return val.substr(val.length - 2);
		};
		var holidays = "#01_01#12_25#";
		var ymd = "#" + date.getFullYear() + "_" + pad(date.getMonth() + 1) + "_" + pad(date.getDate()) + "#";
		var md = "#" + pad(date.getMonth() + 1) + "_" + pad(date.getDate()) + "#";
		var day = date.getDay();
		return (day == 5 && friIsHoly) || (day == 6 && satIsHoly) || (day == 0 && sunIsHoly) || holidays.indexOf(ymd) > -1 || holidays.indexOf(md) > -1;
	}
//---isHoliday<

//---recomputeDuration>
//Metodo para Obtener los dias de duracion, dependiendo de la fecha de inicio, fecha de termino y si fin de semana (False, True)
function recomputeDuration(start, end, weekend) {
		Date.prototype.distanceInWorkingDays = function(toDate) {
			var pos = new Date(this.getTime());
			pos.setHours(23, 59, 59, 999);
			var days = 0;
			var nd = new Date(toDate.getTime());
			nd.setHours(23, 59, 59, 999);
			var end = nd.getTime();
			while (pos.getTime() <= end) {
				days = days + (isHoliday(pos, weekend) ? 0 : 1);
				pos.setDate(pos.getDate() + 1);
			}
			return days;
		};
		//console.debug("recomputeDuration");
		return new Date(start).distanceInWorkingDays(new Date(end));
	}
//---recomputeDuration<

//---computeStartByDuration>
//Componer fecha Inicio
function computeStartByDuration(end, duration, weekend) {
	weekend = (typeof weekend === 'undefined') ? false : weekend;
	var d = new Date(end);
	//console.debug("computeStartByDuration start ",d,duration)
	var q = duration - 1;
	while (q > 0) {
		d.setDate(d.getDate() - 1);
		if (!isHoliday(d, weekend)) q--;
	}
	d.setHours(23, 59, 59, 999);
	return d.getTime();
}
//---computeStartByDuration<

//---computeStartDate>
function computeStartDate(start, weekend, plus) {
		var d = new Date(start + 3600000 * plus);
		d.setHours(0, 0, 0, 0);
		//move to next working day
		/*
		while (isHoliday(d)) {
			d.setDate(d.getDate() + 1);
		}*/
		for (; isHoliday(d, weekend) != false;) {
			d.setDate(d.getDate() + 1);
		}
		d.setHours(0, 0, 0, 0);
		return d;
	}
//---computeStartDate<

//---computeStart>
//Verificar Fecha de inicio, con WEEKEND, para determinar que dia recorrerla
function computeStart(start, weekend, plus) {
		weekend = weekend || false;
		plus = plus || 12;
		return computeStartDate(start, weekend, plus).getTime();
}
//---computeStart<

//---computeEndByDuration>
// Metodo para Obtener la fecha de Termino apartir de la fecha de inicio, Duracion y Trabaja fin de semana (false, true)
function computeEndByDuration(start, duration, weekend, n) {
		weekend = (typeof weekend === 'undefined') ? false : weekend;
		var d = new Date(start);
		//console.debug("computeEndByDuration start ",d,duration)
		var q = duration - 1;
		while (q > 0) {
			d.setDate(d.getDate() + 1);
			if (!isHoliday(d, weekend)) q--;
		}
		d.setHours(23, 59, 59, 999);
		return d.getTime();
	}
//---computeEndByDuration<

	//var dates;
	// window.UpdateStartByDependency = function UpdateStartByDependency(idInput) {
	// 	//First step : Get values from predecessor object
	// 	var arrayString = String(idInput).split('_');
	// 	var p1 = arrayString[1];
	// 	var num = arrayString[2];
	// 	var idStartDate = '#idPicker_StartDate_' + num;
	// 	var idDuration = '#idTask_Duration_' + num;
	// 	var dependency = $(idDuration).attr("data-dependency");
	// 	var predecessor = $(idDuration).attr("data-predecessor");
	// 	var Start = new Date($(idStartDate).children().eq(0).val());
	// 	if (dependency == 'finishToStart') {
	// 		//	console.log("El predecesor no debe ser menor a la fecha seleccionada");
	// 		var p = getDatafromPredecessor(predecessor);
	// 		if (p[0].duedate >= Start.getTime()) {
	// 			//	console.log("Alcanzo a predecesor");
	// 			alert("The following task is preventing you to update the stardate \n" + p[0].title + " \nDue date : " + formatDate(p[0].duedate));
	// 			return false;
	// 		}
	// 		else {
	// 			console.log("Didn't catch the predecesor")
	// 		}
	// 	}
	// 	else if (dependency == 'startToStart') {
	// 		console.log("Start date can not be modified");
	// 	}else{
	// 		// alert("no dependency");
	// 	}
	// 	//console.log("Duedate : "+new Date(p[0].duedate) + " : " + Start);
	// }
	
//---getDatafromPredecessor>
function getDatafromPredecessor(predecessor) {
	if (WF_DEBUG)
		console.info("getDatafromPredecessor(predecessor)", predecessor );
	
	if (WF_DEBUG_AJAX)
		console.info("ajax action: getTaskPredecessor", getUrl().RT );
	
	var ReturnedData = {};
	$.ajax({
		//url: '/app/site/hosting/restlet.nl?script=1386&deploy=1'
		url: getUrl().RT,
		async: false,
		data: {
			'action': 'getTaskPredecessor',
			'id': predecessor
		},
		dataType: 'json',
		success: function(data) {
			//console.log(data);
			ReturnedData = data;
		},
		error: function(err) {
			console.log("Ocurrio un error, vuelva a intentarlo! ",err);
		}
	});
	//console.log(ReturnedData);
	return ReturnedData;
}
//---getDatafromPredecessor<

//---UpdatewithDurationbyDependency>
function UpdatewithDurationbyDependency(Input) {
	//First step : Get values from predecessor object
	var arrayString = String(Input).split('_');
	var p1 = arrayString[1];
	var num = arrayString[2];
	var idDuration = '#idTask_Duration_' + num;
	var dependency = $(idDuration).attr("data-dependency");
	var predecessor = $(idDuration).attr("data-predecessor");
	if (dependency == "finishToStart" || dependency == "startToStart") {
		UpdateEndByDuration(Input);
	} else if (dependency == "finishToFinish" || dependency == "startToFinish") {
		UpdateStartByDuration(Input);
	} else {
		UpdateEndByDuration(Input);
	}
}
//---UpdatewithDurationbyDependency<

//---UpdateDurationbyStart>
function UpdateDurationbyStart(idInput, WorkWeekend) {
	var arrayString = String(idInput).split('_');
	var p1 = arrayString[1];
	var num = arrayString[2];
	var idDueDate = '#idPicker_DueDate_' + num;
	var idStartDate = '#idPicker_StartDate_' + num;
	var idDuration = '#idTask_Duration_' + num;
	var isChecked = $('input[id=WorkOnWeekends_' + num + ']').is(':checked');
	var Start = new Date($(idStartDate).children().eq(0).val());
	//	var Duration = $(idDuration).children().eq(0).val();
	var Duration = $(idDuration).val();
	var due = new Date($(idDueDate).children().eq(0).val());
	//alert($(idWorkWeekend).val());
	var StarDateWithcWeekend = computeStart(Start.getTime(), isChecked);
	$(idStartDate).children().eq(0).val(formatDate(StarDateWithcWeekend));
	//var Start2 = new Date($(idStartDate).children().eq(0).val());
	//console.log('Change Start Date : ' + formatDate(StarDateWithcWeekend) + " : " + StarDateWithcWeekend);
	var Totalduration = recomputeDuration(StarDateWithcWeekend, due.getTime(), isChecked);
	//$(idDuration).children().eq(0).val(Totalduration);
	$(idDuration).val(Totalduration);
	//console.log('Change Duration : ' + Totalduration);
}
//---UpdateDurationbyStart<

//---UpdateDuration>
function UpdateDuration(idInput, WorkWeekend) {
		// Takes index contents from idInput
		var arrayString = String(idInput).split('_');
		var p1 = arrayString[1];
		var num = arrayString[2];
		if (p1 == 'StartDate') {
			var idDueDate = '#idPicker_DueDate_' + num;
			var idStartDate = '#idPicker_StartDate_' + num;
			var idDuration = '#idTask_Duration_' + num;
			var isChecked = $('input[id=WorkOnWeekends_' + num + ']').is(':checked');
			// -	var Start = new Date($(idStartDate).children().eq(0).val());
			var Start = new Date($(idStartDate).val());
			//var Duration = $(idDuration).children().eq(0).val();
			var Duration = $(idDuration).val();
			var StarDateWithcWeekend = computeStart(Start.getTime(), isChecked);
			var DueDate = new Date(computeEndByDuration(StarDateWithcWeekend, Duration, isChecked, 1));
			//alert(formatDate(DueDate));
			//	$(idDueDate).val(DueDate.toString());
			//$(idStartDate).val(StarDateWithcWeekend.toString());
			// -	$(idDueDate).children().eq(0).val(formatDate(DueDate));
			$(idDueDate).val(dateToStringNetsuite(DueDate));
			// -	$(idStartDate).children().eq(0).val(formatDate(StarDateWithcWeekend));
			$(idStartDate).val(dateToStringNetsuite(new Date(StarDateWithcWeekend)));
			//alert(	computeStartByDuration(due.getTime(),Duration,WorkWeekend) );
			return 0;
		} else if (p1 == 'DueDate') {
			var idDueDate = '#idPicker_DueDate_' + num;
			var idStartDate = '#idPicker_StartDate_' + num;
			var idDuration = '#idTask_Duration_' + num;
			var isChecked = $('input[id=WorkOnWeekends_' + num + ']').is(':checked');
			// var due = new Date($(idDueDate).children().eq(0).val());
			// var Start = new Date($(idStartDate).children().eq(0).val());

			var due = StringNetsuiteDateToDate($(idDueDate).val());
			var Start = StringNetsuiteDateToDate($(idStartDate).val());
			if (WF_DEBUG)
				console.info("Start StringNetsuiteDateToDate", Start);
			if (WF_DEBUG)
				console.info("Due StringNetsuiteDateToDate", due);
			// var due = new Date($(idDueDate).val());
			// var Start = new Date($(idStartDate).val());
			var Duration = $(idDuration).val();
			//var Duration = $(idDuration).children().eq(0).val();
			var Totalduration = recomputeDuration(Start.getTime(), due.getTime(), isChecked);
			var DueDateWithcWeekend = computeStart(due.getTime(), isChecked);
			//alert(Totalduration);
			if (Totalduration > 0) {
				$(idDuration).val(Totalduration);
				//$(idDuration).children().eq(0).val(Totalduration);
				// $(idDueDate).children().eq(0).val(formatDate(DueDateWithcWeekend));
				$(idDueDate).val(dateToStringNetsuite(new Date(DueDateWithcWeekend)));
			}
			return Totalduration;
		}
	} // function close - UpdateDuration
//---UpdateDuration<
	
function Myfun() {
	//console.log("Param "+JSON.stringify (parameter));
	//console.log($(this)[0].value);
	//console.log($(this));
}
	
//---changeSelectAsignee>		
function changeSelectAsignee() {
	//var vExtract = $(this).attr('data-rowid');
	// var dataTr = $(this).parent().parent().parent(); // parent(label).parent(TD).Parent(Row)
	//
	// var vExtract = $(this).parent().parent().parent()[0].id; // parent(label).parent(TD).Parent(Row)
	// console.log(vExtract);
	// console.log($('#'+vExtract+' > td .selectAsignee'));
	// window.alex2 = $('#'+vExtract+' > td .selectAsignee');
	// window.alex = vExtract;

	var idparent = $(this)[0].id;
	var vExtract = idparent.split("Asignee").pop();
	changeDico(vExtract);
	return false;
	//	changeDico(vExtract);
}
//---changeSelectAsignee<

//---changeLoadAsigneeTasksW>
function changeLoadAsigneeTasksW() {
	//console.log("Value :"+ $(this)[0].value);
	//console.log("Id :"+ $(this)[0].id);
	var SelectIndex = $(this)[0].value;
	//console.log(SelectIndex);
	//console.log($(this)[0].id);
	var vExtract = ($(this)[0].id).split("_").pop();
	ChangeTableTasks(vExtract, SelectIndex, 'notask', Pm);
	//console.log(vExtract);
	return false;
}
//---changeLoadAsigneeTasksW<

//---changeLoadStatusTasks>
function changeLoadStatusTasks() {
	fldId = $(this)[0].id;
	var WhatStatusIs = $("#" + fldId + " option:selected").text();
	//console.log(WhatStatusIs);
	if (WhatStatusIs == 'Active') {
		$("p.kiko:contains('Active')").closest("tr").show();
		$("p.kiko:contains('Completed')").closest("tr").hide();
		$("p.kiko:contains('Deferred')").closest("tr").hide();
		$("p.kiko:contains('Cancelled')").closest("tr").hide();
	} else if (WhatStatusIs == 'Completed') {
		$("p.kiko:contains('Active')").closest("tr").hide();
		$("p.kiko:contains('Completed')").closest("tr").show();
		$("p.kiko:contains('Deferred')").closest("tr").hide();
		$("p.kiko:contains('Cancelled')").closest("tr").hide();
	} else if (WhatStatusIs == 'Deferred') {
		$("p.kiko:contains('Active')").closest("tr").hide();
		$("p.kiko:contains('Completed')").closest("tr").hide();
		$("p.kiko:contains('Deferred')").closest("tr").show();
		$("p.kiko:contains('Cancelled')").closest("tr").hide();
	} else if (WhatStatusIs == 'Cancelled') {
		$("p.kiko:contains('Active')").closest("tr").hide();
		$("p.kiko:contains('Completed')").closest("tr").hide();
		$("p.kiko:contains('Deferred')").closest("tr").hide();
		$("p.kiko:contains('Cancelled')").closest("tr").show();
	}
	return false;
}
//---changeLoadStatusTasks<

//---changeDico>
function changeDico(vExt) {
	$('#ButtonLoadMoreTasks').attr("data-slice", -1);

	//ooooo
	setTimeout(function() {
		// $("#dico" + vExt).click();
		clickdico(vExt);
	}, 500);

	//  $("#dico" + vExt).removeClass('GoUpdateDisabled');
	// if (vExt == "TreeTask1"){
	// 	$("#dico" + vExt).show();
	// }else{
	// 	$("#dico" + vExt).addClass('GoUpdateEnable');
	// }
}
//---changeDico<

//---getLastStatus>
function getLastStatus(e) {
	/* console.log($(this)[0].value);
	//console.log(e.target.);
	e = e || window.event;
	e = e.target || e.srcElement;
	console.log(e.value); */
	GlobalLastStatus = $(this)[0].value;
}
//---getLastStatus<

//---changeselTaskStatus>
function changeselTaskStatus() {
	var idparent = $(this)[0].id;
	var StatusID = $(this)[0].value;
	//console.log($(this));
	var StatusName = $("#" + idparent + " option:selected").text();
	//console.log("Global StartDate :"+GlobalStartDate);
	//console.log("Global DueDate :"+GlobalDueDate);
	//console.log(StatusName + " "+ StatusID);
	var vExtract = idparent.split("lTaskStatus").pop();

	if ((StatusName == "Completed" || StatusID == 2) || (StatusName == "Cancelled" || StatusID == 4)) {
		if (confirm("You won\'t be able to update this task once the status changes to 'completed/cancelled'")) {
			//console.log(vExtract);
			RuleToStatus(vExtract);
			//console.log(vExtract);
			$('#idPicker_StartDate_' + vExtract).children().eq(0).prop('disabled', true);
			$('#idPicker_DueDate_' + vExtract).children().eq(0).prop('disabled', true);
			$('#idTask_Duration_' + vExtract).prop('disabled', true);
			$('#WorkOnWeekends_' + vExtract).prop('disabled', true);
		} else {
			$(this).val(GlobalLastStatus);
			//return false;
		}
	} else {
		$('#idPicker_StartDate_' + vExtract).children().eq(0).prop('disabled', false);
		$('#idPicker_DueDate_' + vExtract).children().eq(0).prop('disabled', false);
		$('#idTask_Duration_' + vExtract).prop('disabled', false);
		$('#WorkOnWeekends_' + vExtract).prop('disabled', false);
	}
	changeDico(vExtract);
	return false;
}
//---changeselTaskStatus>

//---RuleToStatus>
function RuleToStatus(num) {
	var idDueDate = '#idPicker_DueDate_' + num;
	var idStartDate = '#idPicker_StartDate_' + num;
	var idDuration = '#idTask_Duration_' + num;
	var isChecked = $('input[id=WorkOnWeekends_' + num + ']').is(':checked');
	var due = new Date($(idDueDate).children().eq(0).val());
	var Start = new Date($(idStartDate).children().eq(0).val());
	var Duration = $(idDuration).val();
	if (Start.setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0)) {
		//console.log(GlobalStartDate);
		var StarDateWithcWeekend = computeStart(new Date(GlobalStartDate).getTime(), isChecked);
		$(idStartDate).children().eq(0).val(formatDate(StarDateWithcWeekend));
		$(idDuration).val(1); // Duration se iguala a 1
		var DueDateWithcWeekend = computeEndByDuration(StarDateWithcWeekend, 1, isChecked, 1);
		$(idDueDate).children().eq(0).val(formatDate(DueDateWithcWeekend));
	} else if ((Start.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) && (due.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0))) {
		var StarDateWithcWeekend = computeStart(new Date(GlobalStartDate).getTime(), isChecked);
		var Totalduration = recomputeDuration(StarDateWithcWeekend, new Date().setHours(0, 0, 0, 0), isChecked);
		var DueDateWithcWeekend = computeEndByDuration(StarDateWithcWeekend, Totalduration, isChecked, 1);
		$(idDuration).val(Totalduration);
		$(idDueDate).children().eq(0).val(formatDate(DueDateWithcWeekend));
	}
}
//---RuleToStatus<

//---changeidPickerStartDate>
function changeidPickerStartDate() {
	if(WF_DEBUG)
		console.log("Startdefault " + $(this)[0].defaultValue);
	var PrevStartDate = $(this)[0].defaultValue;
	var idparent = $(this)[0].id;
	var vExtract = idparent.split("_").pop();
	var StartDateCurrVal = new Date($(this).val()).setHours(0, 0, 0, 0);
	var today = new Date().setHours(0, 0, 0, 0);
	var PrevStartDateMM = new Date(PrevStartDate).setHours(0, 0, 0, 0)
	var canDoIt = UpdateStartByDependency(idparent);
	//	alert('StartDate ' + vExtract);
	//return false;
	//Si la fecha selecciondada es menor a la anterior :
	if (PrevStartDateMM > StartDateCurrVal) {
		//if (new Date(CurrentStartDate).getTime() > new Date($(this).val()).getTime()) {
		// si retorna False , cancelara el proceso y pondra la fecha que estaba anteriormente
		if (!canDoIt) {

			// $(this).val(dateToStringNetsuite(new Date(PrevStartDateMM))); // Se restablece la fecha anterior
			// Se restablece la fecha anterior
			$(this).setDate(dateToStringNetsuite(new Date(PrevStartDateMM)), false);
			// Second param are not trigger event...
			
			return false;
			// Si la fecha seleccionada es menor a Hoy
		} else if (canDoIt && StartDateCurrVal < today) {
			window.datem = this;
			console.log('datem',datem,'PrevStartDateMM',PrevStartDateMM, PrevStartDate);
			// Se restablece la fecha anterior
			//-- $(this).val( dateToStringNetsuite(new Date(PrevStartDateMM)) );
			$(this).val( dateToStringNetsuite(new Date(PrevStartDate+' 00:00')) );
			// Second param are not trigger event...
			
			/* var Now = new Date().setHours(0,0,0,0);
			console.log("La fecha Es menor A Hoy : "+Now + " > "+new Date($(this).val()).setHours(0,0,0,0)); */
			alert("The selected date is less than current day");
			
			//--$(this).val(dateToStringNetsuite(new Date(PrevStartDateMM))); // Se restablece la fecha anterior
			
			return false;
		}
		//UpdateDurationbyStart(idparent, WorkWeekend);// Esto se pondra en el metodo de UpdateStartByDependency
		// Si la fecha seleccionada es mayor a la fecha inicial
	} else {
		//var idparent = event.target.id;
		//alert('avanzo');
		UpdateDuration(idparent, WorkWeekend);
	}

	changeDico(vExtract); // si hay cambios se habilita el boton de guardado
	return false;
}
//---changeidPickerStartDate<

//---changeidPickerDueDate>
function changeidPickerDueDate() {
	//console.log("Due "+$(this)[0].defaultValue);
	var ExDate = $(this)[0].defaultValue + " 00:00";
	if (WF_DEBUG) console.info("ExDate", ExDate);
	var idparent = $(this)[0].id;
	//alert(UpdateDuration(idparent));
	var vExtract = idparent.split("_").pop();
	//alert("Due Date " + $(this).val());

	var ud = UpdateDuration(idparent, WorkWeekend);
	if (WF_DEBUG)
		console.info("UpdateDuration", ud);
	if (ud == 0) {
		alert("The Due Data must not be less to Start Date");
		$(this).val(dateToStringNetsuite(new Date(ExDate))); // DefaultValue ever is YYYY / mm / dd
		var isChecked = $('input[id=WorkOnWeekends_' + vExtract + ']').is(':checked');
		var dur = recomputeDuration(StringNetsuiteDateToDate($("#idPicker_StartDate_" + vExtract).val()).getTime(), new Date(ExDate).getTime(), isChecked);
		// var dur = recomputeDuration($("#idPicker_StartDate_" + vExtract).children().eq(0).val(),new Date(ExDate).getTime(),isChecked);
		$("#idTask_Duration_" + vExtract).val(dur);
		return false;
	}

	changeDico(vExtract);
	return false;
}
//---changeidPickerDueDate<

//---changeWorkOnWeekends>
function changeWorkOnWeekends() {
	var idCheck = $(this)[0].id;
	var vExtract = idCheck.split("_").pop();
	var isChecked = $('#WorkOnWeekends_' + vExtract).is(':checked');
	if (WF_DEBUG)
		console.info("WorkOnWeekend", isChecked);
	//If the field WorkWeeken is Checked the Dates should be Update to beyond date
	var idDueDate = '#idPicker_DueDate_' + vExtract;
	var idStartDate = '#idPicker_StartDate_' + vExtract;
	var idDuration = '#idTask_Duration_' + vExtract;
	var due = StringNetsuiteDateToDate($(idDueDate).val());
	var Start = StringNetsuiteDateToDate($(idStartDate).val());
	//var Duration = $(idDuration).children().eq(0).val();
	var Duration = $(idDuration).val();
	var StarDateWithcWeekend = computeStart(Start.getTime(), isChecked); //

	$(idStartDate).val(dateToStringNetsuite(new Date(StarDateWithcWeekend)));
	var dependency = $(idDuration).attr("data-dependency");
	var predecessor = $(idDuration).attr("data-predecessor");
	/* if(dependency=="finishToStart" || dependency=="startToStart"){
		var Start2 = new Date($(idStartDate).children().eq(0).val());
		var DueDateWithcWeekend = computeEndByDuration(Start2.getTime(), Duration, isChecked, 0);
		$(idDueDate).children().eq(0).val(formatDate(DueDateWithcWeekend));
	}else if (dependency=="finishToFinish" || dependency=="startToFinish"){
	} */
	if (dependency == "finishToStart" || dependency == "startToStart") { //5
		UpdateEndByDuration(idCheck);
		//console.log("Arrive! " + idCheck);
	} else if (dependency == "finishToFinish" || dependency == "startToFinish") {
		UpdateStartByDuration(idCheck);
	} else { // En caso de no tener DEPENDENCY
		UpdateEndByDuration(idCheck); // Actualiza Fecha Final con la duracion
	}
	changeDico(vExtract);
	return false;
}
//---changeWorkOnWeekends<

//---changeAck>
function changeAck() {
	var idCheck = $(this)[0].id;
	var vExtract = idCheck.split("_").pop();
	$(this).prop('disabled', true);
	clickdico(vExtract, true);
	return false;
}
//---changeAck<

//---SetFilterToTasks>
function SetFilterToTasks() {
	$(".mytblTasks").find('tr:not(:first)').each(function() {
		$(this).hide();
	});
	var filter = [];
	$(".myUpdatedSA").find('input[type=checkbox]').each(function() {
		var toshow = "-";
		if ($(this).is(':checked')) {
			toshow = $(this).parent().parent().attr("data-toshow");
			//line = $(this).parent().parent().attr("data-line");
			if (WF_DEBUG)
				console.info("toshow", toshow);
			filter.push({
				"type": "Services",
				"toshow": toshow
			});
		}
	});
	$(".myUpdatedServicesAddresses").find('input[type=checkbox]').each(function() {
		var Address = "-";
		if ($(this).is(':checked')) {
			Address = $(this).parent().parent().attr("data-toshow");
			if (WF_DEBUG)
				console.info("Address", Address);
			filter.push({
				"type": "ServicesAddress",
				"toshow": Address
			});
		}
	});
	var toShow = "-"
	for (var i = 0; i < filter.length; i++) {
		if (filter[i].type == "Services") {
			toShow = filter[i].toshow;
			$(".mytblTasks tr[data-toshow='" + toShow + "']").show();
		} else if (filter[i].type == "ServicesAddress") {
			toShow = filter[i].toshow;
			$(".mytblTasks tr[data-toshowaddress='" + toShow + "']").show();
		}
		//	console.log(toShow);
	}
	if (filter[0] == undefined) {
		$(".mytblTasks").find('tr:not(:first)').each(function() {
			$(this).show();
		});
	}
}
//---SetFilterToTasks>

var DurationValue;
var field;

//---changeDuration>
function changeDuration() {
	field = $(this)[0].id;
	// console.log($(this)[0].id);
	DurationValue = $(this)[0].defaultValue;
	var idparent = $(this)[0].id;
	var vExtract = idparent.split("_").pop();
	var CurrentDurationValue = $(this).val();
	// console.log("Last Duration : "+ DurationValue + " New Duration :"+CurrentDurationValue);
	if (CurrentDurationValue.length > 0 && CurrentDurationValue < 1) {
		$(this).val(DurationValue);
	} else if (CurrentDurationValue >= 100) {
		$(this).val(DurationValue);
	} else if (CurrentDurationValue.length == 0) {} else {
		//console.log('else '+ idparent);
		UpdatewithDurationbyDependency(idparent);
		//UpdateEndByDuration(e.target.id);
		//console.log(e.target.id);
	}
	//console.log('change : ' + CurrentDurationValue);
}
//---changeDuration<

//---blurDuration>
function blurDuration() {
	//console.log(DurationValue);
	//var DurationValue = $(this)[0].defaultValue;
	if (!field)
		return false;
	console.log("Fiel " + field);
	var vExtract = field.split("_").pop();
	//console.log($("#"+field).val());
	if ($("#" + field).val().length <= 0) $("#" + field).val(DurationValue);
	UpdateEndByDuration(field);

	changeDico(vExtract);
}
//---blurDuration<

//---clickimageContainer>
function clickimageContainer() {
	$('#play').trigger('click');
}
//---clickimageContainer<

//---ChangeStatus>
function ChangeStatus() {
	var CurrentStatus = $(this);
	//console.log(CurrentStatus);
}
//---ChangeStatus<					

//---clickdico>	
function clickdico(vExtract, isACK) {
	if (WF_DEBUG)
		console.info("clickdico(vExtract, isACK)", vExtract, isACK );

	var Agree = false;
	$(".myUpdatedTasks").fadeIn(4000);
	//$(".loader").show();
	//	$(".image-container1").show();
	$(".myUpdatedTasks").find('tr:not(:first)').each(function() {
		$(this).remove();
	});
	var TotalRows = false;
	//var idUpdate = $(this)[0].id;
	var myworktaskBoolean = $('#idTask_Duration_' + vExtract).attr('data-task');
	if (WF_DEBUG)
		console.info('Tasksboolean', myworktaskBoolean);
	//console.log(myworktaskBoolean);
	//	var vExtract = idUpdate.split("co").pop();
	var post_taskstatus = $("#selTaskStatus" + vExtract).val();
	var check_Duration = $("#idTask_Duration_" + vExtract).val();
	var SalesOrderId = $("#idTask_Duration_" + vExtract).attr("data-salesorder");

	function isInteger(x) {
		return x % 1 === 0;
	}

	if (!isInteger(check_Duration)) {
		alert('The provided duration is not an integer/digit(s).');
		return false;
	}

	if (WF_DEBUG)
		console.info("beforeAgre", Agree);

	Agree = UpdateStartByDependency(vExtract, true);

	if (WF_DEBUG)
		console.info("AfterAgree", Agree);

	if (Agree) {
		if (post_taskstatus == 2 || post_taskstatus == 4) {
			if (confirm("You won\'t be able to update this task once the status changes to 'completed/cancelled'")) {
				Agree = true;
			} else {
				Agree = false;
				return false;
			}
		} else {
			Agree = true;
		}
	} else {

		if (WF_DEBUG)
			console.info("myworktaskBoolean", myworktaskBoolean);

		if (myworktaskBoolean == 'true') {
			// var slice = $('#ButtonLoadMoreAllWork').attr("data-slice");
			// slice = parseInt(slice-50);
			// getAllMyWork(0,whichStatusFilters,true);
			getAllMyWork(0, String(whichStatusFilters), true);
			if(WF_DEBUG)
				console.log("when is Updated ", whichStatusFilters);
		} else {
			clickinSO(SalesOrderId, true); // MERGE
		}
	}


	if (WF_DEBUG)
		console.info("AssignedExctrac", vExtract);
	//88888
	if (Agree) {
		var post_taskid = $("#vtaskID" + vExtract).html();
		var post_id = $("#selectAsignee" + vExtract).val();
		var post_ack = $("#Ack_" + vExtract).is(':checked');
		// var post_name = getSelectText("#selectAsignee" + vExtract);
		//var post_startDate = $("#idPicker_StartDate_" + vExtract).children().eq(0).val();
		var stringDate = String($("#idPicker_StartDate_" + vExtract).val());
		//	var post_startDate = Datemasuno($("#idPicker_StartDate_" + vExtract).children().eq(0).val()).setHours(0, 0, 0, 0);
		var post_startDate = StringNetsuiteDateToDate($("#idPicker_StartDate_" + vExtract).val()).getTime();
		//var post_dueDate = Datemasuno($("#idPicker_DueDate_" + vExtract).children().eq(0).val()).setHours(23, 59, 59, 999);
		var post_dueDate = StringNetsuiteDateToDate($("#idPicker_DueDate_" + vExtract).val()).getTime();
		//var post_dueDate = Datemasuno($("#idPicker_DueDate_" + vExtract).children().eq(0).val()).setHours(0, 0, 0, 0);
		var post_WorkOnWeekends = $("#WorkOnWeekends_" + vExtract).is(':checked');
		var post_Duration = $("#idTask_Duration_" + vExtract).val();
		var wrikeid = $("#idTask_Duration_" + vExtract).attr("data-wrikeid");

		data = {
			'action': "task.change", //'salesorder': 329071,
			'salesorder': SalesOrderId,
			"assigned": post_id,
			"ack": post_ack,
			"status": post_taskstatus,
			"id": post_taskid,
			"duration": post_Duration,
			"weekend": post_WorkOnWeekends,
			"startdate": post_startDate,
			"duedate": post_dueDate,
			"wrikeid": wrikeid,
			"workspace": true
		};
		if(WF_DEBUG)
			console.info("Send Data:", data);

		if(WORKFORCE_MODE == WF_MODE_TESTING){
			//if(WF_DEBUG)
				console.info('WORKFORCE_MODE is TESTING');
			return false; // Dont Save changes...
		}

		if (WF_DEBUG_AJAX)
			console.info("ajax action: task.change", getUrl().Common );
		
		$.ajax({
			url: getUrl().Common,
			type: 'POST',
			data: data,
			success: function(data) {
				if (isACK) {
					return false;
				}
				// console.log('*************************************');
				console.log(JSON.parse(data));
				// console.log('*************************************');
				var elParsed = JSON.parse(data);
				var size = Object.keys(elParsed).length;
				//console.log('Size: ' + size);
				//$(".loader").fadeOut();
				$('[id^=dico]').removeClass('GoUpdateEnable');
				$('[id^=dico]').addClass('GoUpdateDisabled');
				var WhichTasksWillChange = [];
				//if (size > 1) {
				for (var key in elParsed) {
					// Protect against inherited properties.
					if (elParsed.hasOwnProperty(key)) {
						if (elParsed[key].updated) {
							otherData = {
								'action': "update",
								"id": elParsed[key].id,
								"duration": elParsed[key].duration,
								"startdate": elParsed[key].startDate,
								"duedate": elParsed[key].dueDate,
								"currentpredecessor": elParsed[key].currentPredecessor,
								"currentdependency": elParsed[key].currentDependency,
								"updatedbytask": post_taskid,
								"pdstartdate": elParsed[key].pdStartDate,
								"pdduedate": elParsed[key].pdDueDate,
							};

							if (WF_DEBUG)
								console.info("ToUpdate", otherData);
							
							if (WF_DEBUG_AJAX)
								console.info("ajax action: update", getUrl().Common );
							
							$.ajax({
								url: getUrl().Common,
								type: 'POST',
								data: otherData,
								success: function(data) {
									if (WF_DEBUG)
										console.log("Returned Data 2 :" + data);
								}
							});

						}
					}
				}
				
				if (WF_DEBUG) console.info('myworktaskBoolean', myworktaskBoolean);
				if (myworktaskBoolean == 'true') {
					// var slice = $('#ButtonLoadMoreAllWork').attr("data-slice");
					// slice = parseInt(slice-50);
					// getAllMyWork(0,whichStatusFilters,true);
					getAllMyWork(0, String(whichStatusFilters), true);
					if(WF_DEBUG)
						console.log("when is Updated " + whichStatusFilters);
				} else {
					clickinSO(SalesOrderId, true); // MERGE
				}
				//$( "#play" ).trigger('click');
			},
			error: function(err) {
					console.log(err);
				} // success
		});
		return false;
	}
}
//---clickdico<

//---clickinSO>
function clickinSO(id, Reload) {

	if (WF_DEBUG)
		console.info("clickinSO(id, Reload)", id, Reload );
	
		if (!Reload) {
			setLevelLoader(7);
			$('span#msgSalesOrdersClick').fadeOut(9000); // Clears the Sales Order Message text
			//				$('span#msgSalesOrdersClick2').delay(9000);
			//				$('span#msgSalesOrdersClick2').fadeIn(3000);
			//				$('span#msgSalesOrdersClick2').delay(3000).fadeOut(4000);
			$("div.thetabtogants").show();
			$("table#myUpdatedSA").show();
			$("table#myUpdatedServicesAddresses").show();
			//$(".div-salesorder").show();
			$("table#mytblTasks").show();
			// llamada removida onchange="changeLoadAsigneeTasks.call(this)
			var constructorSelect4Employees = '<label><select id="filterAsignee_' + id +
				'" name="filterAsignee" class="filterAsignee" style="height:32px"><option value="notuser0">- Filter by Assigned -</option><option value="notuser">All tasks</option><option value="onlymytasks">Only my tasks</option>';
			constructorSelect4Employees = constructorSelect4Employees + findEmployeesOfProject(id);
			constructorSelect4Employees = constructorSelect4Employees + '</select></label>';
			$('.div-selectassigned').html(constructorSelect4Employees);
			//Para Obtener lista de los Departamentos disponibles en la SALES ORDER
			var constructorSelect4Department = '<label><select id="filterDepartment_' + id + '" name="filterDepartment" class="filterDepartment" style="height:32px"><option value="notuser0">- Filter by Deparment -</option><option value="notuser">All Departments</option>';
			constructorSelect4Department = constructorSelect4Department + getDepartmentOfProject(id);
			constructorSelect4Department = constructorSelect4Department + '</select></label>';
			$('.div-selectdepartment').html(constructorSelect4Department);
			ChangeTableAllServices(id);
			ChangeTableServiceAddresses(id);
			flatpickr('.toDatePickerFilter', {
				dateFormat: CalendarInputFormat
			}); // initialized picker
			//	NumberOfServiceAddresses(id);
		} else {
			setLevelLoader(4);
		}

		GetTaskTree(id);
		ChangeTableTasks(id, Pm, true);

		$('a#tabtogant3').attr('href', "/core/media/media.nl?id=6363364&c=3461650&h=d436a287ff7d831452fd&_xt=.html&so=" + id);
		$("html, body").animate({
			scrollTop: $('#NameSalesorderBySpan').offset().top
		}, 1000);

	}
//---clickinSO<



				
				
//---- Second Functions>
function UpdateStartByDuration_2(idInput) {
	var num = String(idInput).split('_').pop();
	/* var p1 = arrayString[1];
	var num = arrayString[2]; */
	var idDueDate = '#idPicker_DueDate_' + num;
	var idStartDate = '#idPicker_StartDate_' + num;
	var idDuration = '#idTask_Duration_' + num;
	var isChecked = $('input[id=WorkOnWeekends_' + num + ']').is(':checked');
	var due = new Date($(idDueDate).children().eq(0).val());
	var Start = new Date($(idStartDate).children().eq(0).val());
	var Duration = $(idDuration).val();
	var StartDate = new Date(computeStartByDuration(due.getTime(), Duration, isChecked, 0));
	$(idStartDate).children().eq(0).val(formatDate(StartDate));
}

function getSelectText_2(selId) {
	var sel = document.getElementById(selId);
	var i = sel.selectedIndex;
	var selected_text = sel.options[i].text;
	return selected_text;
}

function formatDate_2(date) {
	var d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear();
	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;
	return [year, month, day].join('-');
}

function isHoliday_2(date, weekend) {
	var friIsHoly = false;
	var satIsHoly = !weekend;
	var sunIsHoly = !weekend;
	pad = function(val) {
		val = "0" + val;
		return val.substr(val.length - 2);
	};
	var holidays = "#01_01#12_25#";
	var ymd = "#" + date.getFullYear() + "_" + pad(date.getMonth() + 1) + "_" + pad(date.getDate()) + "#";
	var md = "#" + pad(date.getMonth() + 1) + "_" + pad(date.getDate()) + "#";
	var day = date.getDay();
	return (day == 5 && friIsHoly) || (day == 6 && satIsHoly) || (day == 0 && sunIsHoly) || holidays.indexOf(ymd) > -1 || holidays.indexOf(md) > -1;
}

//Metodo para Obtener los dias de duracion, dependiendo de la fecha de inicio, fecha de termino y si fin de semana (False, True)
function recomputeDuration_2(start, end, weekend) {
	Date.prototype.distanceInWorkingDays = function(toDate) {
		var pos = new Date(this.getTime());
		pos.setHours(23, 59, 59, 999);
		var days = 0;
		var nd = new Date(toDate.getTime());
		nd.setHours(23, 59, 59, 999);
		var end = nd.getTime();
		while (pos.getTime() <= end) {
			days = days + (isHoliday(pos, weekend) ? 0 : 1);
			pos.setDate(pos.getDate() + 1);
		}
		return days;
	};
	//console.debug("recomputeDuration");
	return new Date(start).distanceInWorkingDays(new Date(end));
}
//Componer fecha Inicio
function computeStartByDuration_2(end, duration, weekend) {
	weekend = (typeof weekend === 'undefined') ? false : weekend;
	var d = new Date(end);
	//console.debug("computeStartByDuration start ",d,duration)
	var q = duration - 1;
	while (q > 0) {
		d.setDate(d.getDate() - 1);
		if (!isHoliday(d, weekend)) q--;
	}
	d.setHours(23, 59, 59, 999);
	return d.getTime();
}

function computeStartDate_2(start, weekend, plus) {
	var d = new Date(start + 3600000 * plus);
	d.setHours(0, 0, 0, 0);
	//move to next working day
	/*
	while (isHoliday(d)) {
		d.setDate(d.getDate() + 1);
	}*/
	for (; isHoliday(d, weekend) != false;) {
		d.setDate(d.getDate() + 1);
	}
	d.setHours(0, 0, 0, 0);
	return d;
}
//Verificar Fecha de inicio, con WEEKEND, para determinar que dia recorrerla
function computeStart_2(start, weekend, plus) {
	weekend = weekend || false;
	plus = plus || 12;
	return computeStartDate(start, weekend, plus).getTime();
}
// Metodo para Obtener la fecha de Termino apartir de la fecha de inicio, Duracion y Trabaja fin de semana (false, true)
function computeEndByDuration_2(start, duration, weekend, n) {
	weekend = (typeof weekend === 'undefined') ? false : weekend;
	var d = new Date(start);
	//console.debug("computeEndByDuration start ",d,duration)
	var q = duration - n;
	while (q > 0) {
		d.setDate(d.getDate() + 1);
		if (!isHoliday(d, weekend)) q--;
	}
	d.setHours(23, 59, 59, 999);
	return d.getTime();
}

function UpdateStartByDependency(idInput, doSplit) { // fixed si se utiliza...
	//First step : Get values from predecessor object
	if (WF_DEBUG)
		console.info("IdInput ", idInput);

	var p1 = "";
	var num = idInput;

	if (!doSplit) {
		arrayString = String(idInput).split('_');
		p1 = arrayString[1];
		num = arrayString[2];
	}

	var idStartDate = '#idPicker_StartDate_' + num;
	var idDuration = '#idTask_Duration_' + num;
	if (WF_DEBUG)
		console.info("idDuration", idDuration);

	var dependency = $(idDuration).attr("data-dependency");
	var predecessor = $(idDuration).attr("data-predecessor");
	//	var Start = new Date($(idStartDate).children().eq(0).val());
	var Start = StringNetsuiteDateToDate($(idStartDate).val());
	// if(WF_DEBUG)
	// 	dependency = "finishToStart";

	if (dependency == 'finishToStart') {
		//	console.log("El predecesor no debe ser menor a la fecha seleccionada");
		var p = getDatafromPredecessor(predecessor);
		if (p[0].duedate >= Start.getTime()) {
			//console.log("Alcanzo a predecesor");
			alert("The following task is preventing you to update the stardate \n" + p[0].title + " \nDue date : " + formatDate(p[0].duedate));
			return false;
		} else {
			if (WF_DEBUG)
				console.log("No alcanzo a predecesor");
			return true;
		}
	} else if (dependency == 'startToStart') {
		if(WF_DEBUG)
			console.log("Start date was not be able to be modified");
		return false;
	} else {
		// alert("This Task has not dependency -"+idInput);
		return true;
	}
	//console.log("Duedate : "+new Date(p[0].duedate) + " : " + Start);
}

function getDatafromPredecessor_2(predecessor) {
	var ReturnedData = {};
	$.ajax({
		//url: '/app/site/hosting/restlet.nl?script=1386&deploy=1'
		url: getUrl().RT,
		async: false,
		data: {
			'action': 'getTaskPredecessor',
			'id': predecessor
		},
		dataType: 'json',
		success: function(data) {
			console.info("Predecesor", data);
			ReturnedData = data;
		},
		error: function(err) {
			alert("Ocurrio un error, vuelva a intentarlo! ");
			console.log("Ocurrio un error, vuelva a intentarlo! ",err);
		}
	});
	//console.log(ReturnedData);
	return ReturnedData;
}

function UpdatewithDurationbyDependency_2(Input) {
	//First step : Get values from predecessor object
	var arrayString = String(Input).split('_');
	var p1 = arrayString[1];
	var num = arrayString[2];
	var idDuration = '#idTask_Duration_' + num;
	var dependency = $(idDuration).attr("data-dependency");
	var predecessor = $(idDuration).attr("data-predecessor");
	if (dependency == "finishToStart" || dependency == "startToStart") {
		UpdateEndByDuration(Input);
	} else if (dependency == "finishToFinish" || dependency == "startToFinish") {
		UpdateStartByDuration(Input);
	} else {
		UpdateEndByDuration(Input);
	}
}
////////////////////////////////
function UpdateDurationbyStart_2(idInput, WorkWeekend) {
	var arrayString = String(idInput).split('_');
	var p1 = arrayString[1];
	var num = arrayString[2];
	var idDueDate = '#idPicker_DueDate_' + num;
	var idStartDate = '#idPicker_StartDate_' + num;
	var idDuration = '#idTask_Duration_' + num;
	var isChecked = $('input[id=WorkOnWeekends_' + num + ']').is(':checked');
	var Start = new Date($(idStartDate).children().eq(0).val());
	//	var Duration = $(idDuration).children().eq(0).val();
	var Duration = $(idDuration).val();
	var due = new Date($(idDueDate).children().eq(0).val());
	//alert($(idWorkWeekend).val());
	var StarDateWithcWeekend = computeStart(Start.getTime(), isChecked);
	$(idStartDate).children().eq(0).val(formatDate(StarDateWithcWeekend));
	//var Start2 = new Date($(idStartDate).children().eq(0).val());
	//console.log('Change Start Date : ' + formatDate(StarDateWithcWeekend) + " : " + StarDateWithcWeekend);
	var Totalduration = recomputeDuration(StarDateWithcWeekend, due.getTime(), isChecked);
	//$(idDuration).children().eq(0).val(Totalduration);
	$(idDuration).val(Totalduration);
	//console.log('Change Duration : ' + Totalduration);
}


//---- Secund Functions<





//---- WriteFunction>
function openWrikeComment(wrikeid, Taskid, fromtree) {
	//	wrikeid = 'IEAABMCWKQDM736U';
	if (!wrikeid) {
		if (!fromtree) {
			//777
			url = '/app/crm/calendar/task.nl?id=' + Taskid + '&whence=';
			var win = window.open(url, '_blank');
			win.focus();
		}
	} else {
		//	url = '/app/site/hosting/scriptlet.nl?script=1393&deploy=1&pop=T&taskid='+wrikeid+'&ifrmcntnr=T&folder=F';
		//	url = getUrl().wrike+'&pop=T&taskid=IEAABMCWKQDM736U&ifrmcntnr=T&folder=F';
		console.log()
		url = getUrl().wrike + '&deploy=1&pop=T&taskid=' + wrikeid + '&ifrmcntnr=T&folder=F';
		var foundSinc = false;
		var datos = {
			'action': 'getSincronWithWrike'
		};
		
		if (WF_DEBUG_AJAX)
			console.info("ajax action: getSincronWithWrike", url );
		
		$.ajax({
			url: getUrl().BSL,
			type: 'POST',
			data: datos,
			success: function(data) {
				console.log("Wrikesin" + data);
				foundSinc = data;
			}
		});

		// if(foundSinc){
		if (fromtree) {
			url += '&workforce=T';
			$("#wrike_comment_iframe").attr("src", url).show();
		} else {
			nlExtOpenWindow(url, 'Comment', 700, 350);
			$('.x-shadow').css('top', '150px');
		}
	}
}
//---- WriteFunction<




//--- ThreeFunctions>
function EnabledAndDisabledDateFilter_3() {
	var DatesEnabled = $(this).is(':checked');
	//console.log(DatesEnabled);
	if (!DatesEnabled) {
		$('#filterStartDate').prop("disabled", true);
		$('#filterDueDate').prop("disabled", true);
	} else {
		$('#filterStartDate').prop("disabled", false);
		$('#filterDueDate').prop("disabled", true);
	}
}

function getIp_3() {
	var userIP = '127.0.0.1';
	$.getJSON("https://api.ipify.org?format=json", function(data) {
		//console.log(data.ip);
		userIP = data.ip;
	});
	return userIP;
}

function SetTableTasksByFilters_3(bybutton) {
	if(WF_DEBUG)
		console.info('SetTableTasksByFilters(bybutton)',bybutton);
	//alert('Calling function...');
	arrayFilters = [];
	if (!bybutton) {
		$('#mytblTasks tbody tr').remove();
		$('#ButtonLoadMoreTasks').attr("data-slice", -1);
	}
	var WhoFilterSO = $('[id^=filterAsignee_]').attr("id").split("filterAsignee_").pop();
	//console.log('Your SO selected to filter is '+WhoFilterSO);
	var WhoFilterAsignee = $("[id^=filterAsignee_]").val();
	var WhoFilterDepartment = $("[id^=filterDepartment_]").val();
	//console.log('Your asigneed person to filter is '+WhoFilterAsignee);
	var WhoFilterTask = $("#filterTask").val();
	//console.log('Your task status  to filter is '+WhoFilterTask);
	var regex = new RegExp("-", "g");
	var WhoFilterSD = ($('#filterStartDate').val() != '') ? formatDate(StringNetsuiteDateToDate($('#filterStartDate').val()).getTime()) : '';
	//console.log('Your start date to filter is '+WhoFilterSD);
	var WhoFilterDD = ($('#filterDueDate').val() != '') ? formatDate(StringNetsuiteDateToDate($('#filterDueDate').val()).getTime()) : '';
	//console.log('Your due date to filter is '+WhoFilterDD);
	var WhoFilterWoW = $('#filterWoW').is(':checked');
	//console.log('Your WoW to filter is '+WhoFilterWoW);
	var WhoFilterDurationFrom = $("[id^=filterDurationStart]").val();
	//console.log('Your duration from to filter is '+WhoFilterDurationFrom);
	var WhoFilterDurationTo = $("[id^=filterDurationEnd]").val();
	//console.log('Your duration until, to filter is '+WhoFilterDurationTo);
	arrayFilters.push(WhoFilterSO);
	arrayFilters.push(WhoFilterAsignee);
	arrayFilters.push(WhoFilterTask);
	if(WF_DEBUG)
		console.log('WhoFilterTask:',WhoFilterTask);
	arrayFilters.push(WhoFilterSD);
	arrayFilters.push(WhoFilterDD);
	arrayFilters.push(WhoFilterWoW);
	arrayFilters.push(WhoFilterDurationFrom);
	arrayFilters.push(WhoFilterDurationTo);
	arrayFilters.push(WhoFilterDepartment);
	//console.log(arrayFilters);

	ChangeTableTasksParams(arrayFilters, Pm);
	return false;
}

function Reset_3() {
	$('[id^=filterAsignee_]').val("notuser0");
	$('[id^=filterDepartment]').val("notuser0");
	$('[id^=filterTask]').val("notstatus");
	$('#filterStartDate').val('');
	$('#filterDueDate').val('');
	$("#filterWoW").attr('checked', false);
	$("#filterDurationStart").val('');
	$("#filterDurationEnd").val('');
	return false;
}
//--- ThreeFunctions<


//--- LastFunction>
function getFields(vExtract) {
	var post_taskid = $("#vtaskID" + vExtract).html();
	var post_id = $("#selectAsignee" + vExtract).val();
	var post_ack = $("#Ack_" + vExtract).is(':checked');
	var post_name = getSelectText("#selectAsignee" + vExtract);
	//var post_startDate = $("#idPicker_StartDate_" + vExtract).children().eq(0).val();
	var stringDate = String($("#idPicker_StartDate_" + vExtract).children().eq(0).val());
	//console.log("Fecha desde String "+ new Date(stringDate));
	var post_startDate = Datemasuno($("#idPicker_StartDate_" + vExtract).children().eq(0).val()).setHours(0, 0, 0, 0);
	//var post_dueDate = Datemasuno($("#idPicker_DueDate_" + vExtract).children().eq(0).val()).setHours(23, 59, 59, 999);
	var post_dueDate = Datemasuno($("#idPicker_DueDate_" + vExtract).children().eq(0).val()).setHours(0, 0, 0, 0);
	var post_WorkOnWeekends = $("#WorkOnWeekends_" + vExtract).is(':checked');
	var post_Duration = $("#idTask_Duration_" + vExtract).val();
	var SalesOrderId = $("#idTask_Duration_" + vExtract).attr("data-salesorder");
	var wrikeid = $("#idTask_Duration_" + vExtract).attr("data-wrikeid");

	return {
		'post_taskid': post_taskid,
		'post_id': post_id,
		'post_ack': post_ack,
		'post_name': post_name,
		'stringDate': stringDate,
		'post_startDate': post_startDate,
		'post_dueDate': post_dueDate,
		'post_WorkOnWeekends': post_WorkOnWeekends,
		'post_Duration': post_Duration,
		'SalesOrderId': SalesOrderId,
		'wrikeid': wrikeid,
	}
}
//--- LastFunction<



//-- Document Ready>
				
				$(document).ready(function() {
					
					$.getJSON("https://api.ipify.org?format=json", function(data) {
						CurrentIP = data.ip;
					});
					
					$("#gantt1").hide();
					
					if(WF_DEBUG)
						console.info("Window.dateformat", window.dateformat);

					window.CalendarInputFormat = "F j, Y";
					
					setCalendarFormatInput();

					
					// Enable common function for ajax...
					$(document).ajaxStart(function() {
						if(WF_LOADER_AUTO) return;
						WF_LOADER_LEVEL++;
						if(WF_DEBUG)
							console.log('WF_LOADER_LEVEL',WF_LOADER_LEVEL);
						$('.loader').show();
					});

					$(document).ajaxComplete(function() {
						//..console.log('loader HIDE');
						//$('.loader').css("display", "none");
						WF_LOADER_LEVEL--;
						
						if(WF_DEBUG)
							console.log('WF_LOADER_LEVEL',WF_LOADER_LEVEL);
						
						if (WF_LOADER_LEVEL<1){
							$('.loader').hide();
							WF_LOADER_AUTO=false;
						}
					});

					// We read the content of the variable from suitelet | Takes the SO of the user and puts them in custpage_salesorderofuser
					var selOrderSalesOfUser = $('input#custpage_salesorderofuser').val();
					
					// We make the Order Sales Status select element functionality
					// Select processor of Sales Orders
					// $('[id^=multipleSelectSalesOrders]').select2();
					$('[id^=multipleSelectSalesOrders]').on('change', function() {
						whichSOFilters = ($(this).val());
					});

					//$('[id^=multipleSelectSalesOrders2]').select2();
					$('[id^=multipleSelectSalesOrders2]').on('change', function() {
						whichSOFilters = ($(this).val());
					});

					// $('[id^=multipleSelectStatus]').select2();
					$('[id^=multipleSelectStatus]').on('change', function() {
						whichStatusFilters = ($(this).val());
					});

					/* Run in main  */
					setLevelLoader(2);
					GetSalesOrdersbyID('Customsalesorder', 'CurrentUser', 'SomeSOStatus');
					
					// initialized picker
					$("input[id^=s2id_]").hide();
					
					// Obtains team members if there are any
					var MyTeamLength = $('input#custpage_selectmyteam').val();
					//console.log(MyTeamLength);
					var MyTeam = $.parseHTML(MyTeamLength);
					MyTeamLength = MyTeam[0].length;
					$(MyTeam).appendTo(".ToMyTeam");
					$('input#custpage_selectmyteam').show();
					if (MyTeamLength > 1) {
						$('.filtersFirstBar').css("display", "block");
						$('.tabso2').css("display", "block");
						$('.tabso3').css("display", "block");
						$('.tabso4').css("display", "block");
						//$('.tabso5').css("display" , "block");
						Pm = true;
					}
					
					newRole = $('input#custpage_userrole').val();
					newRole = Math.round(newRole);
					//console.log ('The role of this user is '  +  newRole);

					txtRole = (role_labels[newRole] != undefined)? role_labels[newRole] : 'Normal';
					
					if (role_labels[newRole] != undefined) {
						//alert('Hi! you are a valid user able to see the Sales Order Tab; for now only Administrators, Full Access and Sales Director will be able to see it.');
						$('p#msgAdminSalesOrdersTab').html('As ' + txtRole + ' role, you can see this General View of Sales Orders');
						$('.tabso5').css("display", "block");
					}
					
					$(".dhxtreeview_cont").css('width', '100%');
					$(".dhxtreeview_cont").css('height', '100%');
					// End of team function
					
					//console.log(selOrderSalesOfUser);
					// Block to get Sales Orders assigned to the user
					var WhichSalesOrder = 329071;
					var date = new Date();
					var day = date.getDate();
					var month = date.getMonth() + 1;
					var year = date.getFullYear();
					// Set correct format for date.. in a string way
					if (month < 10) month = "0" + month;
					if (day < 10) day = "0" + day;
					var today = year + "-" + month + "-" + day;
					//var today = month + "/" + day + "/" + year;
					$('#filterStartDate').attr("value", today);
					$('#filterDueDate').attr("value", today);
					lstEmployeeSelect = $('input#custpage_selectempselect').val();

					$('.div-selectassigned').css({'font-weight':'normal','height':'32px'});
					$('.div-selectdepartment').css('font-weight', 'normal');

					// This variable will be used to fill the main task status filter
					lstTaskStatusFilter = $('input#custpage_selectstatustask').val();
					var regexTask = new RegExp("selectTaskStatus", "g");
					lstTaskStatusFilter = lstTaskStatusFilter.replace(regexTask, 'filterTask');
					lstTaskStatusFilter = lstTaskStatusFilter.replace('selTaskStatus', 'filterTask');
					lstTaskStatusFilter = lstTaskStatusFilter.replace('class="filterTask">', 'class="filterTask" style="height:32px"><option value="notstatus">- Filter by Task Status -</option>');
					lstTaskStatusFilter = lstTaskStatusFilter.replace('onchange="changeselTaskStatus.call(this)"', 'onchange=""');
					//lstTaskStatusFilter = lstTaskStatusFilter.replace('changeselTaskStatus', 'changeLoadStatusTasks');
					lstTaskStatusFilter = $('.div-selecttaskstatus').html(lstTaskStatusFilter);
					lstStatusSelect = $('input#custpage_selectstatustask').val();
					
					// Hide Tables
					$("table#myUpdatedSA").hide();
					$("table#myUpdatedServicesAddresses").hide();
					$(".filtersBar").hide();
					$(".div-selectassigned").hide();
					$(".div-selectdepartment").hide();
					$(".div-selecttaskstatus").hide();
					$(".div-selectStartDate").hide();
					$(".div-selectDueDate").hide();
					$(".div-selectWoW").hide();
					$(".div-selectDuration").hide();
					$("table#mytblTasks").hide();
					$('select.div-salesorder').change(function() {
						var targetTasks = $(this).val();
						if (targetTasks == 'showalltasks') {
							targetTasks = 'showalltasks';
							$('select[mytag="***"]').closest("tr").show();
							$('select[mytag="+++"]').closest("tr").show();
							// In case you want to have alternate row backgrounds use these lines
							//$("#mytblTasks tr:odd").children('td').css("background-color","#ffffff");
							//$("#mytblTasks tr:even").children('td').css("background-color","#f2f2f2");
						} else {
							targetTasks = 'showonlymytasks';
							$('select[mytag="+++"]').closest("tr").hide();
							$('select[mytag="***"]').closest("tr").show();
						}
					});



//---RESTCODE>
					
					window.setTimeout(function() {

						$('body').on('change', '.toggle-vis', function(e) {
							e.preventDefault();
							var selectColumn = $(this).attr('data-column');
							//console.log(selectColumn);
							var val = $(this)[0].checked;
							//console.log(table);
							if (selectColumn == "all") {
								for (var i = 2; i < 15; i++) {
									var column = table.column(i);
									column.visible(val);
									if (val) {
										$('.toggle-vis').prop('checked', true);
									} else {
										$('.toggle-vis').removeAttr('checked');
									}

								}
							} else {
								var column = table.column(selectColumn);
								//console.log(column);
								column.visible(val);
							}
							//return false;
						});
						// $('a.toggle-vis').on( 'click', function (e) {
						//        e.preventDefault();

						//        // Get the column API object
						//        var column = table.column( $(this).attr('data-column') );

						//        // Toggle the visibility
						//        column.visible( ! column.visible() );
						//    } );
						$('body').on('click', '.idClickToSalesOrder', function(e) {
							//$('.loader').fadein();
							//setTimeout(function() {
								//..setLevelLoader(6);
								var idSO = $(this).attr('data-salesorderID');
								//console.log("Data SO "+idSO);
								$('#tabtwo2').trigger('click');
								GetSalesOrdersbyID('salesorder', 'CurrentUser', 'OnPageLoad'); // Obtener Mis Sales orders (CurrentUser);
								clickinSO(idSO);
							//},80);
						});
						//
						// $('body').on('click','#ButtonLoadAllMyWork',function(e){
						// 	getAllMyWork('all');
						// });

						$('body').on('click', '#ButtonLoadMore', function(e) {
							//console.log("D Slice "+$(this).attr("data-slice"));
							var slice = $(this).attr("data-slice");
							GetSalesOrdersbyID('allsalesorder', 'NotUser', 'SomeSOStatus', slice); // Obtener Todas las Sales Orders;
							slice = (parseInt(slice) + 50);
							$('#ButtonLoadMore').attr("data-slice", slice);
						});

						$('body').on('click', '#ButtonLoadMoreAllWork', function(e) {
							console.log("D Slice " + $(this).attr("data-slice"));
							var slice = $(this).attr("data-slice");
							getAllMyWork(slice);
							slice = (parseInt(slice) + 50);
							$('#ButtonLoadMoreAllWork').attr("data-slice", slice);
						});

						$('body').on('click', '#ButtonLoadMoreTasks', function(e) {
							var lastFunction = $(this).attr("data-function");
							var So = $('[id^=filterAsignee_]').attr("id").split("filterAsignee_").pop();
							console.log(So);
							if (lastFunction == 1) {
								ChangeTableTasks(So, Pm);
							} else {
								SetTableTasksByFilters(true);
							}
						});

						$('body').on('change', 'input[type="date"]', function(e) {
							//	console.log($(this));
							var id = $(this)[0].id;
							var vExtract = id.split("_").pop();
							var currentDate = $(this)[0].value;
							if (currentDate.length == 0) {
								var post_WorkOnWeekends = $("#WorkOnWeekends_" + vExtract).is(':checked');
								//console.log($("#WorkOnWeekends_" + vExtract));
								var startDate = ($("#idPicker_StartDate_" + vExtract).children().eq(0))[0].defaultValue;
								$("#idPicker_StartDate_" + vExtract).children().eq(0).val(formatDate(computeStart(new Date(startDate).getTime(), post_WorkOnWeekends)));
								var dueDate = $("#idPicker_DueDate_" + vExtract).children().eq(0).val();
								//$("#idPicker_DueDate_" + vExtract).children().eq(0).val(dueDate);
								//var duration = $("#idTask_Duration_" + vExtract)[0].defaultValue;
								//var post_Duration = $("#idTask_Duration_" + vExtract).val(duration);
								//UpdateEndByDuration(id);
								// var dur = recomputeDuration($("#idPicker_StartDate_" + vExtract).children().eq(0).val(),new Date(dueDate).getTime(),post_WorkOnWeekends);
								// $("#idTask_Duration_" + vExtract).val(dur);
							}
						});

						$('#filterButtonG').click(function(e) {
							e.preventDefault();
							SetTableTasksByFilters();
						});

						$('#filterButtonSO').click(function(e) {
							e.preventDefault();
							//var SOSelectionCurrUser = $('#multipleSelectSalesOrders').val();
							if(WF_DEBUG)
								console.log('whichSOFilters vale ' + String(whichSOFilters));
							GetSalesOrdersbyID('salesorder', 'CurrentUser', whichSOFilters);
						});

						$('#filterButtonALLSO2').click(function(e) {
							e.preventDefault();
							//var SOSelectionCurrUser = $('#multipleSelectSalesOrders').val();
							if(WF_DEBUG)
								console.log('whichSOFilters2 vale ' + String(whichSOFilters));
							GetSalesOrdersbyID('allsalesorder', 'NotUser', whichSOFilters);
						});

						$('#filterTaskStatus').click(function(e) {
							e.preventDefault();
							//var SOSelectionCurrUser = $('#multipleSelectSalesOrders').val();
							if(WF_DEBUG)
								console.log('whichStatusFilters vale ' + String(whichStatusFilters));
							getAllMyWork(0, String(whichStatusFilters), true);
						});

						// Premium
						$('body').on('click', '#salesorder.table > tbody > tr', function(e) {
							if ($(this).is(':first') != true) {
								GlobalEditing = true;
								// console.log($(this).attr('data-id'));
								var td0 = $(this).find('td:eq(0)').text();
								var td1 = $(this).find('td:eq(1)').text();
								var id = $(this).attr('data-id');
								//console.log(td0 + " " + td1);
								td0 = td0.replace(/\s+/g, '');
								$('#NameSalesorderBySpan').html("<span class='badge' style='font-size: 150%; text-align: left; font-weight: bold;  padding: 9px 12px; margin-right:4px;+'>" + td0.replace('&nbsp;&nbsp;', '') + "</span> " + td1);
								$('#IdSalesorderBySpan').text(id);
								clickinSO(id);
								// Updates the viewSOLink with the SO ID to see the correspondant Gantt View
								// $('a#viewSOLink').attr('href', '/core/media/media.nl?id=6531035&c=3461650&h=3551c980d8dcec6efcfd&mv=isgcft6g&_xt=.html&whence=&ganttSOID='+id+'&ganttSONumber='+td0.replace('&nbsp;&nbsp;','')+'&ganttSOTitle='+td1);
								// // Gantt
								// //console.log('Here the id variable has this value: ' + id);
								// $.ajax({
								// 	method: "GET",
								// 	dataType: "json",
								// 	beforeSend: function(){
								// 		$("#gantt1").hide();
								// 		//alert('Gant hidden');
								// 	},
								// 	url: '/app/site/hosting/restlet.nl?script=873&deploy=1&so=' + id,
								// }).done(function( data ) {
								// 	if(data.data.length > 0){
								// 		//alert('Gant has data');
								// 		$("#gantt1").show();
								// 	}
								// 	//gantt.parse(data);
								// });
							}
							//$(".loader").fadeOut();
						});
						
						$('table#Customsalesorder tr').not(':first').click(function() {
							//$(".loader").fadeOut();
						});
						
						$('body').on('click', '#Customsalesorder.table > tbody > tr', function(e) {
							GlobalEditing = true;
							if ($(this).is(':first') != true) {
								var td0 = $(this).find('td:eq(0)').text();
								var td1 = $(this).find('td:eq(1)').text();
								var id = $(this).attr('data-id');
								//console.log(td0 + " " + td1);
								td0 = td0.replace(/\s+/g, '');
								$('#NameSalesorderBySpan').html("<span class='badge' style='font-size: 150%; text-align: left; font-weight: bold;  padding: 9px 12px; margin-right:4px;+'>" + td0.replace('&nbsp;&nbsp;', '') + "</span> " + td1);
								$('#IdSalesorderBySpan').text(id);
								clickinSO(id);
							}
						});

						$('body').on('click', '#allsalesorder.table > tbody > tr', function(e) {
								GlobalEditing = true;
								if ($(this).is(':first') != true) {
									var td0 = $(this).find('td:eq(0)').text();
									var td1 = $(this).find('td:eq(1)').text();
									var id = $(this).attr('data-id');
									//console.log(td0 + " " + td1);
									td0 = td0.replace(/\s+/g, '');
									$('#NameSalesorderBySpan').html("<span class='badge' style='font-size: 150%; text-align: left; font-weight: bold;  padding: 9px 12px; margin-right:4px;+'>" + td0.replace('&nbsp;&nbsp;', '') + "</span> " + td1);
									$('#IdSalesorderBySpan').text(id);
									clickinSO(id);
								}
							});
						
							// $('#tooglegroup').on('click',function(e){
							// 	var status = $(this).attr('data-status');
							// 	$('.toggle-vis').click();
							// 	if(status=='on'){
							// 	}
							// });

						$('body').on('click', '#tabone', function(e) {
							if (!($.fn.dataTable.isDataTable('.AllMyWork'))) {
								getAllMyWork(0, 1);
							}
							/* Hide all tables of task information */
							$("div.thetabtogants").hide();
							$("table#myUpdatedSA").hide();
							$("table#myUpdatedServicesAddresses").hide();
							//$(".div-salesorder").show();
							$("table#mytblTasks").hide();
						});

						$('body').on('click', '#tabtwo', function(e) {

							if (!($.fn.dataTable.isDataTable('#allsalesorder'))) {
								GetSalesOrdersbyID('salesorder', 'CurrentUser', 'OnPageLoad'); 
								// Obtener Mis Sales orders (CurrentUser);
							}

							if (GlobalEditing) {
								/*Show all tables of task information */
								$("div.thetabtogants").show();
								$("table#myUpdatedSA").show();
								$("table#myUpdatedServicesAddresses").show();
								//$(".div-salesorder").show();
								$("table#mytblTasks").show();
							}

						});
						
						$('body').on('click', '#tabfour', function(e) {
							if (GlobalEditing) {
								/*Show all tables of task information */
								$("div.thetabtogants").show();
								$("table#myUpdatedSA").show();
								$("table#myUpdatedServicesAddresses").show();
								//$(".div-salesorder").show();
								$("table#mytblTasks").show();

							}
							//alert("here");
						});

						$('body').on('click', '#tabfive', function(e) {
							if (!($.fn.dataTable.isDataTable('#allsalesorder'))) {
								// Obtener Todas las Sales Orders;
								GetSalesOrdersbyID('allsalesorder', 'NotUser', 'SomeSOStatus', 0);
							}
						});

						$('body').on('click', '.tabso3', function(e) {
							//	$('#selecttab').hide();
							/* Hide all tables of task information */
							$("div.thetabtogants").hide();
							$("table#myUpdatedSA").hide();
							$("table#myUpdatedServicesAddresses").hide();
							//$(".div-salesorder").show();
							$("table#mytblTasks").hide();
							// Start of My Team Tab //
							var counSO = 0;
							var counSA = 0;
							var counADD = 0;
							var counPLA = 0;
							if (!($.fn.dataTable.isDataTable('#tableSOcount'))) {
								var tablaPint = $('#tableSOcount').DataTable({
									"searching": true,
									"scrollCollapse": true,
									"paging": false,
									"order": [
										[1, 'asc']
									],
									"footerCallback": function(row, data, start, end, display) {
										var apiSoMyTeam = this.api(),
											data;
										// Remove the formatting to get integer data for summation
										var intVal = function(i) {
											return typeof i === 'string' ?
												i.replace(/[\$,]/g, '') * 1 :
												typeof i === 'number' ?
												i : 0;
										};
										pageTotal = apiSoMyTeam.column(4, {
											page: 'current'
										}).data().reduce(function(a, b) {
											return intVal(a) + intVal(b);
										}, 0);
										$(apiSoMyTeam.column(4).footer()).html('<span class="badge">' + pageTotal + '</span>');
										pageTotal = apiSoMyTeam.column(3, {
											page: 'current'
										}).data().reduce(function(a, b) {
											return intVal(a) + intVal(b);
										}, 0);
										$(apiSoMyTeam.column(3).footer()).html('<span class="badge">' + pageTotal + '</span>');
										pageTotal = apiSoMyTeam.column(2, {
											page: 'current'
										}).data().reduce(function(a, b) {
											return intVal(a) + intVal(b);
										}, 0);
										$(apiSoMyTeam.column(2).footer()).html('<span class="badge">' + pageTotal + '</span>');
										pageTotal = apiSoMyTeam.column(1, {
											page: 'current'
										}).data().reduce(function(a, b) {
											return intVal(a) + intVal(b);
										}, 0);
										$(apiSoMyTeam.column(1).footer()).html('<span class="badge">' + pageTotal + '</span>');
									}
								}); // END of My Team Tab ( tablaPint )
								
								if (WF_DEBUG_AJAX)
									console.info("ajax action: getAllSalesOrder", getUrl().RT3 );
								
								//Call first serach PM ----------------------------------------
								$.ajax({

									//url: '/app/site/hosting/restlet.nl?script=1427&deploy=1'
									url: getUrl().RT3,
									data: {
										'action': 'getAllSalesOrder'
									},
									async: true,
									dataType: 'json',
									success: function(data) {
										var row = '';
										var counter = 0;
										data.forEach(function(result) {
											var empPM = result.empPM;
											var empPMText = result.empPMText;
											var countSO = result.countSO;
											var add = result.add;
											var items = result.items;
											var plan = result.plan;
											var callFunction = "<a class='myTeamLink' onclick='showSecondTable(" + empPM + ");''>" + empPMText + "</a>";
											var row = tablaPint.row.add([callFunction, countSO, add, items, plan]).draw(false);
											//SUM ALL Quantites
											counSO += parseInt(result.countSO);
											counSA += parseInt(result.add);
											counADD += parseInt(result.items);
											counPLA += parseInt(result.plan);
										});
										$('#tableSOcount').show();
									},
									error: function(err) {
										console.log('err',err);
									},
									complete: function() {
										$("#tableSOcount tbody tr").addClass("firstTdSoCount");
									}
								});
							}
						});

						$('body').on('click', '#dicoTreeTask1', function(e) {
							//$(".image-container1").show();
							var TotalRows = false;
							var idUpdate = $(this)[0].id;
							var vExtract = idUpdate.split("co").pop();
							var post_taskid = $("#vtaskID" + vExtract).html();
							var post_id = $("#selectAsignee" + vExtract).val();
							var post_ack = $("#Ack_" + vExtract).is(':checked');
							var post_taskstatus = $("#selTaskStatus" + vExtract).val();
							// var post_name = getSelectText("#selectAsignee" + vExtract);
							var stringDate = String($("#idPicker_StartDate_" + vExtract).children().eq(0).val());
							var post_startDate = Datemasuno($("#idPicker_StartDate_" + vExtract).children().eq(0).val()).setHours(0, 0, 0, 0);
							var post_dueDate = Datemasuno($("#idPicker_DueDate_" + vExtract).children().eq(0).val()).setHours(0, 0, 0, 0);
							var post_WorkOnWeekends = $("#WorkOnWeekends_" + vExtract).is(':checked');
							var post_Duration = $("#idTask_Duration_" + vExtract).val();
							var SalesOrderId = $("#idTask_Duration_" + vExtract).attr("data-salesorder");
							var wrikeid = $("#idTask_Duration_" + vExtract).attr("data-wrikeid");
							//console.log("Wrikeid "+wrikeid)
							data = {
								'action': "task.change",
								'salesorder': SalesOrderId,
								"assigned": post_id,
								"ack": post_ack,
								"status": post_taskstatus,
								"id": post_taskid,
								"duration": post_Duration,
								"weekend": post_WorkOnWeekends,
								"startdate": post_startDate,
								"duedate": post_dueDate,
								"wrikeid": wrikeid,
								"workspace": true
							};
							//console.info("se envia ", data);
							
							if (WF_DEBUG)
								console.info("sending data", data );
							
							if (WF_DEBUG_AJAX)
								console.info("ajax action: task.change", getUrl().Common );
							
							$.ajax({
								url: getUrl().Common,
								type: 'POST',
								data: data,
								success: function(data) {
									GetTaskTree(SalesOrderId);
									showPress(post_taskid, 'customrecord_task_predecessor', 'custrecord_tp_parent', 'custrecord_tp_predecessor', "treePredecessor", true);
									showSucc(post_taskid, 'customrecord_task_successor', 'custrecord_ts_parent', 'custrecord_ts_successor', 'treeSuccessor', true);

									var elParsed = JSON.parse(data);
									var size = Object.keys(elParsed).length;
									$('[id^=dico]').removeClass('GoUpdateEnable');
									$('[id^=dico]').removeClass('GoUpdateDisabled');
									//	var elParsed = JSON.parse(data);
									var TotalRows = false;
									var size = Object.keys(elParsed).length;
									//console.log('Size: ' + size);
									//$(".loader").fadeOut();
									$('[id^=dico]').removeClass('GoUpdateEnable');
									$('[id^=dico]').removeClass('GoUpdateDisabled');
									var WhichTasksWillChange = [];
									//if (size > 1) {
									for (var key in elParsed) {
										// Protect against inherited properties.
										if (elParsed.hasOwnProperty(key)) {
											if (elParsed[key].updated) {
												// //console.log("Cambio StartDate :"+new Date(elParsed[key].odStartDate) + " -> "+ new Date(elParsed[key].startDate));
												// 		var toWoW = true;
												// 		if(elParsed[key].weekend == true){
												// 			toWoW = "<input disabled='disabled' type='checkbox' checked = 'checked'/>";
												// 		}else{
												// 			toWoW = "<input disabled='disabled' type='checkbox' />";
												// 		}
												// 		var toAck = true;
												// 		if(elParsed[key].ack == true){
												// 			toAck = "<input disabled='disabled' type='checkbox' checked = 'checked'/>";
												// 		}else{
												// 			toAck = "<input disabled='disabled' type='checkbox' />";
												// 		}
												// 		TotalRows = true;
												// 		//console.log(elParsed[key]);
												// 		var UpdateRow = $('tr[data-id=' + elParsed[key].id + ']');
												// 		var NewRow = '';
												// 		NewRow += '<tr>';
												// 		NewRow += '<td align="left">'+elParsed[key].name+'</td>';
												// 		NewRow += '<td align="center">' + elParsed[key].assigned+ '</td>';
												// 		NewRow += '<td align="center">' + toAck +'</td>';
												// 		NewRow += '<td align="center">' + elParsed[key].status+ '</td>';
												// 		NewRow += '<td align="center">' + formatDate(elParsed[key].odStartDate) + '</td>';
												// 		NewRow += '<td align="center">' + formatDate(elParsed[key].odDueDate) + '</td>';
												// 		NewRow += '<td align="center">' + formatDate(elParsed[key].startDate) + '</td>';
												// 		NewRow += '<td align="center">' + formatDate(elParsed[key].dueDate) + '</td>';
												// 		NewRow += '<td align="center">' + toWoW + '</td>';
												// 		NewRow += '<td align="center">' + elParsed[key].duration + '</td>';
												// 		NewRow += '</tr>';
												// 		$("table.myUpdatedTasks > tbody").append(NewRow);
												otherData = {
													'action': "update",
													"id": elParsed[key].id,
													"duration": elParsed[key].duration,
													"startdate": elParsed[key].startDate,
													"duedate": elParsed[key].dueDate,
													"currentpredecessor": elParsed[key].currentPredecessor,
													"currentdependency": elParsed[key].currentDependency,
													"updatedbytask": post_taskid,
													"pdstartdate": elParsed[key].pdStartDate,
													"pdduedate": elParsed[key].pdDueDate,
												};
												
												if (WF_DEBUG_AJAX)
													console.info("ajax action: update", getUrl().Common );
												
												$.ajax({
													url: getUrl().Common,
													type: 'POST',
													data: otherData,
													success: function(data) {
														if (WF_DEBUG_AJAX)
															console.log("Returned Data 2 :" + data);
													}
												});
											}
										}
									}
									// 						if (($("#selTaskStatus" + vExtract).val() == 4) || ($("#selTaskStatus" + vExtract).val() == 2)) {
									// 							$("#selectAsignee" + vExtract).prop('disabled', true);
									// 							$("#Ack_" + vExtract).prop('disabled', true);
									// 							$("#selTaskStatus" + vExtract).prop('disabled', true);
									// 							$("#idPicker_StartDate_" + vExtract).prop('disabled', true);
									// 							$("#idPicker_DueDate_" + vExtract).prop('disabled', true);
									// 							$("#WorkOnWeekends_" + vExtract).prop('disabled', true);
									// 							$("#idTask_Duration_" + vExtract).prop('disabled', true);
									// 						}
									// 						if (!TotalRows) {
									// 							//$(".myUpdatedTasks").show();
									// 							$(".myUpdatedTasks").find('tr:not(:first)').each(function () {
									// 								$(this).remove();
									// 							});
									// 						//	var thisRow = "<tr><td align='center' colspan ='10'>No successor(s) found</td></tr>";
									// 						//	$("table.myUpdatedTasks > tbody").append(thisRow);
									// 							//$('.image-container1').fadeOut(3000);
									// //							$(".myUpdatedTasks").fadeOut(3000);
									// 						}
									// 						// $( "#play" ).trigger('click');


								},
								error: function(e) {
									console.info("Can Not Update Data", e);
								}
							});
							// $("#dicoTreeTask1").removeClass('GoUpdateEnable'); // MERGE
							// $("#dicoTreeTask1").addClass('filterButton'); 	// MERGE
							// $("#dicoTreeTask1").hide(); // MERGE
							//		GetTaskTree(SalesOrderId);
						});
						
						$('body').on('click', 'a.toOpenWrike', function(e) {
							e.preventDefault();
							var url = ""
							var wrikeid = $(this).attr('data-wrikeid');
							var Taskid = $(this).attr('data-taskid');

							openWrikeComment(wrikeid, Taskid);

							return false;
						});

						//-- here was WRITE function ...
						
						$('#selMyTeam').css('height','32px');	// Work OK
						$('#selMyTeam').css('width','320px');	// Work OK
						$('#multipleSelectSalesOrders').parent().css('width','90%'); // Work OK
						$('#multipleSelectSalesOrders2').parent().css('width','90%'); // Work OK
						$('#multipleSelectStatus').parent().css('width','90%'); // Work OK

						$('body').on('change', '#selMyTeam', function(e) {
							//console.log($(this)[0].value);
							var id = $(this)[0].value;
							$('.dataTables_scrollFoot').hide();
							//console.log("ID selected from list is: " + id);
							//GetSalesOrdersbyID('Customsalesorder',id);
							GetSalesOrdersbyID('Customsalesorder', id, 'SomeSOStatus'); 
							//Alex 75404   Jesus  75408
						});

						//---- Second Functions Was HERE ----- LEIRAGS ---
						
						var CurrentDueDate, CurrentStartDate, DurationValue;
						
						$('[id^=selectAsignee]').on("change", function(e) {
							var idparent = e.target.id;
							var vExtract = idparent.split("Asignee").pop();
							changeDico(vExtract);
							return false;
						});
						$('[id^=selTaskStatus]').on("change", function(e) {
							var idparent = e.target.id;
							var vExtract = idparent.split("lTaskStatus").pop();
							changeDico(vExtract);
							return false;
						});
						$('[id^=idPicker_DueDate]').on("focus", function(e) {
							CurrentDueDate = $(this).val();
						});
						$('[id^=idPicker_StartDate]').on("focus", function(e) {
							CurrentStartDate = $(this).val();
							//console.log(CurrentStartDate);
						});
						$('[id^=idPicker_DueDate]').on("change", function(e) {
							var idparent = e.target.id;
							//alert(UpdateDuration(idparent));
							var vExtract = idparent.split("_").pop();

							if (UpdateDuration(idparent, WorkWeekend) == 0) {
								alert("La fecha final no puede ser menor a la fecha de inicio");
								$(this).val(CurrentDueDate);
								return false;
							}
							changeDico(vExtract);
							return false;
						});
						$('[id^=WorkOnWeekends_]').on("change", function(e) {
							var idCheck = e.target.id;
							var vExtract = idCheck.split("_").pop();
							var isChecked = $('input[id=WorkOnWeekends_' + vExtract + ']').is(':checked');
							//If the field WorkWeeken is Checked the Dates should be Update to beyond date
							var idDueDate = '#idPicker_DueDate_' + vExtract;
							var idStartDate = '#idPicker_StartDate_' + vExtract;
							var idDuration = '#idTask_Duration_' + vExtract;
							var due = new Date($(idDueDate).children().eq(0).val());
							var Start = new Date($(idStartDate).children().eq(0).val());
							//var Duration = $(idDuration).children().eq(0).val();
							var Duration = $(idDuration).val();
							var StarDateWithcWeekend = computeStart(Start.getTime(), isChecked);

							$(idStartDate).children().eq(0).val(formatDate(StarDateWithcWeekend));
							var dependency = $(idDuration).attr("data-dependency");
							var predecessor = $(idDuration).attr("data-predecessor");
							/* if(dependency=="finishToStart" || dependency=="startToStart"){
								var Start2 = new Date($(idStartDate).children().eq(0).val());
								var DueDateWithcWeekend = computeEndByDuration(Start2.getTime(), Duration, isChecked, 0);
								$(idDueDate).children().eq(0).val(formatDate(DueDateWithcWeekend));
							}else if (dependency=="finishToFinish" || dependency=="startToFinish"){
							} */
							if (dependency == "finishToStart" || dependency == "startToStart") {
								UpdateEndByDuration(idCheck);
								//console.log("Llego" + idCheck);
							} else if (dependency == "finishToFinish" || dependency == "startToFinish") {
								UpdateStartByDuration(idCheck);
							}
							changeDico(vExtract);
							return false;
						});
						$('[id^=Ack_]').on("change", function(e) {
								var idCheck = e.target.id;
								var vExtract = idCheck.split("_").pop();
								changeDico(vExtract);
								return false;
							})
							// $('[id^=idPicker_StartDate]').on('change', function (event) {
							// 	var idparent = event.target.id;
							// 	var vExtract = idparent.split("_").pop();
							//
							// 	//Si la fecha selecciondada es menor a la anterior :
							// 	if (new Date(CurrentStartDate).setHours(0, 0, 0, 0) > new Date($(this).val()).setHours(0, 0, 0, 0)) {
							// 		//if (new Date(CurrentStartDate).getTime() > new Date($(this).val()).getTime()) {
							// 		// si retorna False , cancelara el proceso y pondra la fecha que estaba anteriormente
							// 		if (!UpdateStartByDependency(idparent)) {
							// 			var milidate = new Date(CurrentStartDate).setHours(0, 0, 0, 0);
							// 			$(this).val(CurrentStartDate); // Se restablece la fecha anterior
							// 			// Si la fecha seleccionada es menor a Hoy
							// 		}
							// 		else if (UpdateStartByDependency(idparent) && new Date($(this).val()).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
							// 			/* var Now = new Date().setHours(0,0,0,0);
							// 			//console.log("La fecha Es menor A Hoy : "+Now + " > "+new Date($(this).val()).setHours(0,0,0,0)); */
							// 			alert("The Selected date is less than current day");
							// 			$(this).val(CurrentStartDate); // Se restablece la fecha anterior
							// 		}
							// 		//UpdateDurationbyStart(idparent, WorkWeekend);// Esto se pondra en el metodo de UpdateStartByDependency
							// 		// Si la fecha seleccionada es mayor a la fecha inicial
							// 	}
							// 	else {
							// 		//var idparent = event.target.id;
							// 		//alert('avanzo');
							// 		UpdateDuration(idparent, WorkWeekend);
							// 	}
							//
							// 	changeDico(vExtract); // si hay cambios se habilita el boton de guardado
							// 	return false;
							// });
						$('[idTask_Duration_]').on("focus", function(e) {
							DurationValue = $(this).val();
							//console.log("Se obtuvo :" + DurationValue);
						});
						$('[id^=idTask_Duration_]').bind('keyup', function(e) {
							var idparent = e.target.id;
							var vExtract = idparent.split("_").pop();

							var CurrentDurationValue = $(this).val();
							//console.log("Last Duration : "+ DurationValue + " New Duration :"+CurrentDurationValue);
							if (CurrentDurationValue.length > 0 && CurrentDurationValue < 1) {
								$(this).val(DurationValue);
							} else if (CurrentDurationValue >= 100) {
								$(this).val(DurationValue);
							} else if (CurrentDurationValue.length == 0) {} else {
								UpdatewithDurationbyDependency(e.target.id);
								//UpdateEndByDuration(e.target.id);
								//console.log(e.target.id);
							}
							changeDico(vExtract);
							//console.log('change : ' + CurrentDurationValue);
						});
						$('[id^=idTask_Duration_]').on('blur', function(event) {
							if ($(this).val().length <= 0) $(this).val(DurationValue);
						});
						//			$('.image-container1').on("click", function (e) {
						//				$(this).fadeOut(2000);
						//				$(".myUpdatedTasks").fadeOut(2000);
						//			});
						
						
						
						//--- Here WAS Three functions -- Leirags
						
						
						var formatter = new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'USD',
							minimumFractionDigits: 2,
						});
						/* GlobalSalesOrderTbl = $("#salesorder").DataTable({
				"scrollY": "380px"
				, "scrollCollapse": true
				, "deferRender": true
				, "paging": false
				, "order": [
					[11, "desc"]
				],
				//merge luis lopez
				"footerCallback":function ( row, data, start, end, display ){
		            var api = this.api(), data;
		            // Remove the formatting to get integer data for summation
		            var intVal = function ( i ) {
		                return typeof i === 'string' ?
		                    i.replace(/[\$,]/g, '')*1 :
		                    typeof i === 'number' ?
		                        i : 0;
		            };
		            pageTotal = api.column( 3, { page: 'current'} ).data().reduce( function (a, b) {return intVal(a) + intVal(b);}, 0 );
		            $(api.column(3).footer()).html('<span class="badge">' + pageTotal+'</span>');
		            pageTotal = api.column( 4, { page: 'current'} ).data().reduce( function (a, b) {return intVal(a) + intVal(b);}, 0 );
		            $(api.column(4).footer()).html('<span class="badge">' + pageTotal+'</span>');
		            pageTotal = api.column( 9, { page: 'current'} ).data().reduce( function (a, b) {return intVal(a) + intVal(b);}, 0 );
		            $(api.column(9).footer()).html('<span class="badge">' + formatter.format(pageTotal) +'</span>');
		            pageTotal = api.column( 10, { page: 'current'} ).data().reduce( function (a, b) {return intVal(a) + intVal(b);}, 0 );
		            $(api.column(10).footer()).html('<span class="badge">' + formatter.format(pageTotal) +'</span>');
				}
				//end merge luis lopez
			}); */
						$('.thetabsalesorders .tabtogsales-links a').on('click', function(e) {
							var currentAttrValue = $(this).attr('href');
							// Show/Hide thetabsalesorders
							//  jQuery('.thetabsalesorders ' + currentAttrValue).show().siblings().hide();
							// Show/Hide Tabs
							$('.thetabsalesorders ' + currentAttrValue).slideDown(400).siblings().slideUp(400);
							// Change/remove current tabtogant to active
							$(this).parent('li').addClass('active').siblings().removeClass('active');
							e.preventDefault();
						});
						$('.thetabtogants .tabtogant-links a').on('click', function(e) {
							var currentAttrValue = $(this).attr('href');
							// Show/Hide thetabtogants
							//  jQuery('.thetabtogants ' + currentAttrValue).show().siblings().hide();
							// Show/Hide Tabs
							$('.thetabtogants ' + currentAttrValue).slideDown(400).siblings().slideUp(400);
							// Change/remove current tabtogant to active
							$(this).parent('li').addClass('active').siblings().removeClass('active');
							e.preventDefault();
						});
						// No borrar $('[id^=dico'+Xs+'].GoUpdateEnable').show();
						//
						$("ul .dtab2").click(function() {
							$(".dhxtreeview_cont").css('width', '100%');
							$(".dhxtreeview_cont").css('height', '100%');
							//				$('html, body').animate({
							//					scrollTop: $("ul .dtab2").offset().top
							//				}, 400);
						});
						$('.dataTables_scrollBody').css('overflow-x', 'hidden');
						/* $('.bg-success-z').click(function() {
							$('.dataTables_scrollHeadInner').css('width','1450px');
							$('#salesorder_wrapper').css('width','1450px');
							$('.dataTables_scrollFootInner').css('width','1450px');
						}); */

						$('.select2-search__field').attr("placeholder", " * Filter by status of the Sales Orders by clicking on this field");

						$('#tableSOcount_filter input[type="search"]').after(
							'  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'salesorder\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');

						$('#salesorder_filter input[type="search"]').after(
							'  <img id="mymicrophone" style="width:14px;height: 50%;" onclick="startDictation(\'salesorder\')" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=6526112&c=3461650&h=270cf9836f9974d10a59">');
						
						var DoWeHaveRecords = $("#salesorder td.dataTables_empty").html();
						
						if (DoWeHaveRecords == 'No data available in table') {
							$("#salesorder td.dataTables_empty").html('<span style="font-size: 16px;">  Not found recordswith this filter, try with another...   </span>');
						}

						// Language strings update on load
						$('#msgSalesOrdersClick').html(messages.click_any_os);
						$('.talknow').html(messages.talk_now);

						//			gantt.init("gantt1");
						//		    gantt.config.columns = [
						//			{ name:"text", label:"Task", width:180, tree:true, resize: true },
						//			{ name:"start_time", label:"Start time", template:function(obj){
						//				return gantt.templates.date_grid(obj.start_date);
						//			},
						//			align: "center", width:100 },
						//			{ name:"assigned", label:"Assigned", align:"center", width:100, template: function(item){
						//				if (!item.users) return "Nobody";
						//					return item.users.join(", ");
						//					}},
						//				{	name:"duration", label:"Duration", align:"center", width:60},
						//			];
						
						//--- Was Here Last Function...


						

					}, 2800);
//---RESTCODE>

				});
				
//<!-- Review: 2017-Feb-05 01:58AM -->