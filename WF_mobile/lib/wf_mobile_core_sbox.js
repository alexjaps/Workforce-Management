/* Ariel Garcia - Created - 2017-May-07 12:42pm */
if (typeof jQuery === "undefined") {
    throw new Error("jQuery plugins need to be before this file");
}
/* wf_mobile_core */
/**
 * 
 * WorkForce Management
 * 
 * workforce_core_snbx.js
 * 
 * Ver 1.05
 * 2017-April-17 12:25AM
 * 
 * Ariel Garcia leirags@hotmail.com
 * 
 */

$.WorkForce_Mobile_App = {};

$.WorkForce_Mobile_App.options = {
	    user : {},
	    team : {},
	    tasks_rels : {'department' : 'departments',
				'SalesOrder' : 'salesorders',
				'KpiItem' : 'items',
				'KpiAddress' : 'servicesaddresses',
				'Assigned' : 'assigned',
				'type' : 'types',
				'process' : 'process',
				'subprocess' : 'subprocess',
				'company' : 'customers',
				'Status' : 'taskstatus',
				'-' : 'cities',
				'--' : 'states',
				'---' : 'municipalities',
		},
		task_colors : {
			'today' 	: 'ligthgreen',
			'future'	: 'white',
			'thisweek'	: 'green',
			'pastdue' 	: 'red'
		}
	}

/* 
 * NetSuite - Function ====================
 *  accessing netsuite data
 *  
 */
$.WorkForce_Mobile_App.NetSuite = {
		getUrl: function(which) {
			var urls = {
					BSL: '/app/site/hosting/scriptlet.nl?script=1346&deploy=1',
					wrike: '/app/site/hosting/scriptlet.nl?script=1246&deploy=1',
					Common: '/app/site/hosting/scriptlet.nl?script=837&deploy=1',
					MLog : 'https://y16m9ssk3.transtelco.net/nslogs/debug_wfm',
					AddTask: '/app/site/hosting/scriptlet.nl?script=1351&deploy=1&',
					Cabinet : '/app/site/hosting/scriptlet.nl?script=1420&deploy=1&',
				}
			if (WorkForce_Obj.Env == 'SANDBOX') {
				var urls = {
					BSL: '/app/site/hosting/scriptlet.nl?script=1481&deploy=1',
					wrike: '/app/site/hosting/scriptlet.nl?script=1393&deploy=1',
					Common: "/app/site/hosting/scriptlet.nl?script=837&deploy=1",
					MLog : 'https://y16m9ssk3.transtelco.net/nslogs/debug_wfm',
					AddTask : '/app/site/hosting/scriptlet.nl?script=1699&deploy=1&',
					Cabinet : '/app/site/hosting/scriptlet.nl?script=1710&deploy=1&', 
				}
			}
			return urls[which]
		},
		CleanResponse: function (data) {
			// console.info(data)
			WF_NetSuite_Error = false;
			// if(WF_DEBUG)
			// 	console.info('newData', data);
			if (data.substring(0,15) == '<!DOCTYPE html>'){
				WF_NetSuite_Error = true;
				var newData = {};
				//-- window.WF_NetSuite_Error_Data = data;
				var mark_need_login ='>Could not determine customer compid<';
				if (data.indexOf(mark_need_login) != -1) {
					alert('Session with NetSuite was ended.\nNeed Reload Workforce Management\n.');
					var forceGet = true; 
					/* false - Default. Reloads the current page from the cache.
					   true - Reloads the current page from the server */
					//... window.location.reload(forceGet);
				} else {
					// try Catch Errors
					xtable = data.substring( data.indexOf('<table'), data.lastIndexOf('table>') + 6);
					xob = xtable.substring( xtable.indexOf('{'), xtable.lastIndexOf('}') + 1);
					error_obj = JSON.parse(xob);
					//--- DEROGATED, use LeirAGS_cnvObjTable var niceError = function(o){var m=[]; for(a in o){ b=o[a]; if(typeof b === 'object'){ m.push('<tr><td>'+a+'</td><td>'+niceError(b)+'</td></tr>'); } else m.push('<tr><td>'+a+'</td><td>'+b+'</td></tr>'); }; return '<table class="table table-bordered">'+m.join('')+'</table>'; }
					//--- $('#contenting').append( '<div class="col-sm-6"><h4>NetSuite error <small>'+(new Date()).toString()+'</small></h4>'+niceError(error_obj.cause)+'</div>' );
					
					//-- $('#contenting').append( '<div class="col-sm-6"><h4>NetSuite error <small>'+(new Date()).toString()+'</small></h4>'+LeirAGS_cnvObjTable(error_obj.cause)+'</div>' );
//					console.error('NetSuite return error on call.', error_obj );
//					if( $('#cnfs').is(':checked') ) {
//						alert('NetSuite return error on call.');
//					}
				}
				return newData;
			} else {
				// Fix Object when NetSuite append comments...
				var newData = String(data).split('<!--');
				if(WF_DEBUG_AJAX_DATA)
					console.info('Return Data',JSON.parse(newData[0]));
				return JSON.parse(newData[0]);
			}
		},
		Retrieve: function (url,options, callback) {
			var _this = this;
			var results = {};
			$.ajax({
				url: _this.getUrl(url),
				type: 'POST',
				data: options,
				dataType: 'text',
				complete: function() { },
				beforeSend: function() { console.info(this.url, this.data) },
				success: function(data) { 
					var data = _this.CleanResponse(data)
					if (callback && (typeof callback == 'function'))
						callback(data)
				},
				error: function(er) {
					alert('Erron on NETSuite call '+options.action,er)
					if (WF_DEBUG)
						console.log('Error on NETSuite call', er)
				}
			})
			return results
		},
		openPopup: function(url,data) {
			
		},
		openTask: function(Taskid){
			url = '/app/crm/calendar/task.nl?id=' + Taskid + '&whence=&'
			var win = window.open(url, '_blank')
			win.focus()
		},
		openSaleOrder: function(SOid){
			url = '/app/accounting/transactions/salesord.nl?id='+SOid+'&whence=&'
			var win = window.open(url, '_blank')
			win.focus()
		}
}

/* 
 * WorkForce_Mobile_Core_DB ====================
 *  core functions access object 
 *  as db_sql
 *  
 */
$.WorkForce_Mobile_Core_DB = {}
$.WorkForce_Mobile_Core_DB.databases = {
		
}

/* 
 * Main - Function ====================
 *  manage workforce interface
 *  
 */
$.WorkForce_Mobile_App.Main = {
		activate: function(){
			var _this = this;
		},
		clearWorkCached: function(){
			// Reset list values...
			Tracing_List_Items = ['all'];
			Tracing_List_Address = ['all'];
			Tracing_List_Assigned = ['all'];
			Tracing_List_Customers = ['all'];
			//----
		},
		getMyTasks: function(status,audits,dayWay){
			var _this = this;
			_this.clearWorkCached()
			var now = new Date( ),
				Yr = now.getFullYear(),
				Mh = now.getMonth(),
				Dy = now.getDate();
			var options = {
					'action'  : 'getAllMyWorkToday',
					'statusId': status,
					'auditId' : audits, // (empDt.et=='department')?JSON.stringify(empDt.ei):empDt.ei,
					'day'	  : now,
					'dayWay'  : dayWay,
					'ahora'	  : JSON.stringify( {'y':Yr,'m':Mh,'d':Dy} )
				}
			$.WorkForce_Mobile_App.NetSuite.Retrieve('BSL',options, _this.processMyTasks )
		},
		processMyTasks: function(records){
			var _this = this,
				tmpl_tsk = $('#task-template').html(),
				tasks_cnts = '',
				dspy = true;
			console.info(tmpl_tsk);
			//console.info(records);
			if (records.count) {
				LeirAGS_ObjProps(records.rrows.tasks).forEach(function(tsk){
					if (dspy) console.info( $.WorkForce_Mobile_App.Main.recreateTask( records.rrows.tasks[tsk], records.rrows ) )
					dspy = false
					/* var rTsk = $.WorkForce_Mobile_App.Main.recreateTask( records.rrows.tasks[tsk], records.rrows )
					console.info(rTsk) */
					tasks_cnts += LeirAGS_Tmpl( tmpl_tsk, $.WorkForce_Mobile_App.Main.recreateTask( records.rrows.tasks[tsk], records.rrows ) )
				})
			}
			// $('section.content .row').html( LeirAGS_cnvObjTable(records) )
			$('section.content .row').html( tasks_cnts )
			$('section.content .dropdownA-menu').toggle()
		},
		recreateTask: function(tsk, aux){
			var nTask = {}, rels = $.WorkForce_Mobile_App.options.tasks_rels;
			nTask['classDate'] = $.WorkForce_Mobile_App.Main.classDate( tsk.DueDate )
			nTask['classCard'] = $.WorkForce_Mobile_App.options.task_colors[nTask['classDate']]
			LeirAGS_ObjProps(tsk).forEach(function(fld){
				nTask[fld] = tsk[fld]
				if ( rels[fld] && aux && aux[ rels[fld] ] && aux[ rels[fld] ][ nTask[fld] ]) {
					if (fld != 'SalesOrder') 
						nTask[fld+'_txt'] = aux[ rels[fld] ][ nTask[fld] ]
					else {
						nTask[fld+'_txt'] = aux[ rels[fld] ][ nTask[fld] ]['label'];
						nTask['entI'] = aux[ rels[fld] ][ nTask[fld] ]['entI'];
						nTask['entI_txt'] = aux[ rels[fld] ][ nTask[fld] ]['entN'];
						nTask['memc'] = aux[ rels[fld] ][ nTask[fld] ]['memc'];
						nTask['memo'] = aux[ rels[fld] ][ nTask[fld] ]['memo'];
					}
				}
			})
			return nTask
		},
		classDate: function(d){
			var due = LeirAGS_NS_Utils.StrNSDateToDate(d)
			var days = LeirAGS_dates.diffDays( due, new Date())
			if (days > 0) {
				return 'future'
			} else if (days < 0) {
				return 'pastdue'
			} else
				return 'today'
		}
}

/* 
 * WorkForce_Mobile_Core_Service ====================
 *  core functions to enable communication 
 *  between users, using notifications.
 *  
 */
$.WorkForce_Mobile_Core_Service = {}

$.WorkForce_Mobile_Core_Service.options = {
	WF_Comm_State : { 'off':'OFF', 'on':'ON', 'paused':'PAUSED', 'processing':'PROCESSING', 'state':'STATE' },
	WF_Notifications_Thread : 'OFF',
	WF_Notifications_time_seed : 1000, // Seconds based.
	WF_Notifications_time : 10, // 20; 30; 16;	// How many secunds to push notifications.
	WF_Notifications_Last : {cnt:0, last_dt:0, last_id:0, last_tm:0},
	WF_Notifications_Last_Out : {cnt:0, last_dt:0, last_id:0, last_tm:0}
}

$.WorkForce_Mobile_Core_Service.notifications = {
		
}

	var Global_myTreeViewTask;
	var myWorkSOdata = {};
	var openSOfromTab = '';
	var all_mentions = {};
	var Current_Eng_Scope_Work = {soid:0, esow:'', sow:''};
	
	function messager(tit,msg){
		jQuery.confirmar({
			'title'		: tit,
			'message'	: msg,
			'buttons'	: {
				//'Cancel': { 'class'	: 'gray', 'action': function(){} },
				'OK'	: { 'class'	: 'blue', 'action': function(){} },
			},
		});
	}
		
		
//--- Communication-notifications-module		
		const WF_Comm_State = { 'off':'OFF', 'on':'ON', 'paused':'PAUSED', 'processing':'PROCESSING', 'state':'STATE' };
		var WF_Notifications_Thread = WF_Comm_State.off;
		var WF_Notifications_time_seed = 1000; // Seconds based.
		var WF_Notifications_time = 10; // 20; 30; 16;	// How many secunds to push notifications.
		var WF_Notifications_Last = {cnt:0, last_dt:0, last_id:0, last_tm:0};
		var WF_Notifications_Last_Out = {cnt:0, last_dt:0, last_id:0, last_tm:0};
		
		// Activate Dismiss for notifications...
		$("#dismiss-comm").click(clear_notifications);
		
		function show_notification(msg, mt, tm) {
			var rndId = new Date().getTime();
			mt = (mt)?mt:'info'; // info, success, warning, danger.
			msg = '<div id="'+rndId+'" class="alert alert-'+mt+'" style="margin-bottom:3px; font-size:10pt">' + 
			      '<span class="dismiss glyphicon glyphicon-remove" data-dismiss="alert" aria-hidden="true"></span>' + 
			      msg +
			      '</div>';
			if (tm) { window.setTimeout(function(){ $("#"+rndId).fadeOut('slow') }, 8000)}
			
			$("#notification-comm-cont").append(msg);
			$("#notification-comm").fadeIn("slow");
		}
		
		function clear_notifications(){
			$("#notification-comm").fadeOut("slow");
			$("#notification-comm-cont").html('');
		}
		
		function WF_Notifications_Service( newState ){
			switch(newState) {
				case WF_Comm_State.on:
					if ( WF_Notifications_Thread ==  WF_Comm_State.off) {
						WF_Notifications_Thread =  WF_Comm_State.on;
						WF_Notifications_Push( WF_Notifications_time_seed * WF_Notifications_time );
						return 'Service Started'
					}
					return 'Already is On'
					break;
				case WF_Comm_State.off:
						WF_Notifications_Thread = WF_Comm_State.off;
						return 'Service Stoped'
					break;
				case WF_Comm_State.state:
					return 'Service is '+WF_Notifications_Thread;
					break;
				default:
					return 'Undefined Action';
					break;
			}
			
		}
		
		function WF_Notifications_Push(hmt) {
		    var hmt = hmt;
		    if  ((! WF_Notifications_Thread) || 					// Service not started
		    	( WF_Notifications_Thread && 
		    	  WF_Notifications_Thread != WF_Comm_State.on))  	// Service is ON?
		    	{ return false; }
		    setTimeout(function () {
		        // Do Something Here
		        // Then recall the parent function to
		        // create a recursive loop.
		        WF_Notifications_Thread = WF_Comm_State.processing;
		        $('#notif-stat').html('Reading...');
		        getMyNotifications('incoming');
		        $('#notif-stat').html('Msgs: '+WF_Notifications_Last.cnt);
		        getMyNotifications('outgoing');
		        if ( WF_Notifications_Thread != WF_Comm_State.processing) { return false; }
		        if (WF_NetSuite_Error) { 
		        	WF_Notifications_Thread = WF_Comm_State.paused;
		        } else {
		        	WF_Notifications_Thread = WF_Comm_State.on;
		        	WF_Notifications_Push(hmt);
		        }
		        loaderEnd();
		    }, hmt);
		}
		
//--- Communication-notifications-module
/**
 * Moved this vars to main module in WF_mobile_index
 *
		var employeesobj = [{'employeeId':0, 'employeeName':'none', 'deptId':0, 'deptName':'none'}];
		var employeesobj_inactive = [{'employeeId':0, 'employeeName':'none', 'deptId':0, 'deptName':'none'}];
		var lastEmployeesObj = '';
		var departmentsobj = { 0:{'dptId':0, 'dptName':'none'} }
		var Tracing_Tasks_Obj = { count:0 };
		var Tracing_List_Items = ['all'];
		var Tracing_List_Address = ['all'];
		var Tracing_List_Assigned = ['all'];
		var Tracing_List_Customers = ['all'];
 */	
		
//---selectassignee>
		function selectassignee(elem){
			var name = $(elem).val();
			var id = $('#'+ $(elem).data('onchg') ).val();
			var defaultDept = WorkForce_Obj.userDeptId;
			jQuery.popupSelect({
				'user_id'		: '#popupselectOverlay',
				'title'		: 'Select Assignee',
				'message'	: 'Todo por servir se acaba',
				'buttons'	: {
					'Cancel': { 'class'	: 'gray', 'action': function(){
						//if(callbackNOT) callbackNOT();
					},},
					'OK'	: { 'class'	: 'blue', 'action': function(){
						var empid = $('#popupselected_val').text();
						if(empid != ''){
							var currval = $('#'+ $(elem).data('onchg') ).val();
							if(currval != empid) {
								var employee = employeesobj.find(function(emp){return emp.employeeId==empid});
								$(elem).val(employee.employeeName);
								$('#'+ $(elem).data('onchg') ).val(empid).change();
							}
						}
						// alert('Selected '+empid+' : '+employee.employeeName);
					},},
				},
				'content' : ''+createTableEmployees(),
				'tablesearch': 'empylst',
				'tablefilter': 'deptlst',
				'colNm' : 0, // Column Num to show on clic in table. Remember change if table change...
				'defaultValues' : {'id':id, 'name':name, 'dept':defaultDept, 'autoFilterDept': true }
			});
			// Enable MOVE the popup...
			$('#popupselectBox').LeirAGS_drags({handle:'h1'});
		}
		
//---createTableEmployees>
		function createTableEmployees(){
			if(lastEmployeesObj!='') {
				return lastEmployeesObj; // Get already previous calcs.
			}
			var selDept = 'Depto: <select>';
			employeesobj.map(function(emp){
				//console.info('selDept',selDept)
				if ( selDept.indexOf('e='+emp.deptId+'>') < 0) {
					selDept += '<option value='+emp.deptId+'>'+emp.deptName+'</option>';
					departmentsobj[emp.deptId]={id:emp.deptId, name:emp.deptName}
				}
			});
			selDept += '</select><br>';
			
			var tbld = '';
			tbld += '<div class="pre-scrollable" style="heigth:320px; width:40%; float:left;">';
			tbld += '<table id="deptlst" class="table table-condensed table-bordered table-hover table-striped" >';
			employeesobj.map(function(emp){
				if ( tbld.indexOf('d='+emp.deptId+'>') < 0) {
					tbld += '<tr data-deptid='+emp.deptId+'>';
					tbld += '<td>'+emp.deptName+'</td>';
					tbld += '</tr>';
				}
			});
			tbld += '</table></div>';
			
			var tblr_s = '<div class="head">\
			<span id="popupselected_val" style="color:#DEDEDE; font-size:1.0em; margin-left:6px; display:inline-block; float:left">00</span> \
			<span id="popupselected_text" style="font-size:1.2em; margin-left:6px;"></span>\
			<div style="display:inline-block; float:right; margin-right:6px;">Search: \
			<input type="text" autofocus id="popselectsearchinput" class="filtertable" data-tableid="empylst" data-colnum="2" />\
			</div></div>';
			
			var tblr = '';
			tblr += '<div class="pre-scrollable" style="heigth:320px; width:60%; float:right;">';
			tblr += '<table id="empylst" class="table table-bordered table-hover table-striped" data-filter-dept=0 >';
			employeesobj.map(function(emp){
				//tblr += '<tr>';
				tblr += '<tr data-deptid='+emp.deptId+' data-empid='+emp.employeeId+'>';
				//-- tblr += '<td>'+emp.employeeId+'</td>'; //... disable show employee id...
				tblr += '<td>'+emp.employeeName.latinize()+'</td>';
				tblr += '</tr>';
			});
			tblr += '</table>';
			tblr += '</div>';
			//return selDept+tblr_s+' <div class="row" style="margin:6px;">'+tbld+''+tblr+'</div>';
			lastEmployeesObj = tblr_s+' <div class="row" style="margin:6px;">'+tbld+''+tblr+'</div>';
			
			return lastEmployeesObj;
		}
		
//---getEmployeeData>
		// Get employee name based on ID, search in actives first, if not found, then lookup in inactives.
		function getEmployeeData(eid){
			var empObj = {}, empNull = {employeeId:0, employeeName:'', email:'', deprId:0, deptName:'', suubsidiaryId:0, supervisor:0, wrikeID:'', inactive:true };
			var inactive = '';
			empObj = employeesobj.find(function(emp){return emp.employeeId == eid});
			if(empObj != undefined){
				empObj['inactive'] = false;
			} else {
				empObj = employeesobj_inactive.find(function(emp){return emp.employeeId == eid});
				if(empObj != undefined){
				 empObj['inactive'] = true;
				} else {
					empObj = empNull;
				}
			}
			return empObj;
		}
		
//---getEmployeeName>
		// Get employee name based on ID, search in actives first, if not found, then lookup in inactives.
		function getEmployeeName(eid){
			var empObj = {};
			var inactive = '';
			empObj = employeesobj.find(function(emp){return emp.employeeId == eid});
			if(empObj != undefined){
				
			} else {
				inactive = '**';
				empObj = employeesobj_inactive.find(function(emp){return emp.employeeId == eid});
			}
			return inactive + ((empObj != undefined) ? empObj.employeeName : 'Not Found');
		}


		
//==========================================================================================================================

$(function () {
    /* $.AdminBSB.browser.activate();
    $.AdminBSB.leftSideBar.activate();
    $.AdminBSB.rightSideBar.activate();
    $.AdminBSB.navbar.activate();
    $.AdminBSB.dropdownMenu.activate();
    $.AdminBSB.input.activate();
    $.AdminBSB.select.activate();
    $.AdminBSB.search.activate(); */
	$('#leftsidebar .user-info .info-container .name').html(WorkForce_Obj.userName)
	$('#leftsidebar .user-info .info-container .email').html(WorkForce_Obj.userEmail)
	$.WorkForce_Mobile_App.Main.getMyTasks(1,WorkForce_Obj.userID,'past')
});