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
	leirags_datatable_dom_sort_special(); // inside of  jquery_confirm.js
	
	var Global_myTreeViewTask;
	var myWorkSOdata = {};
	var openSOfromTab = '';
	var Current_Eng_Scope_Work = {soid:0, esow:'', sow:''};
	var all_mentions = {};
	var WF_SO_Locations_data = [];
	
//--- Process Changes Vars
	var LeirAGS_Process = { obj_pro_log: 0, obj_pro_row: 0 };
	var obj_pro_log = 0, obj_pro_row = 0, obj_pro_wait = 0, obj_pro_wait_limit = 100;
	var LeirAGS_Monitoring = null;
	var LeirAGS_Monitoring_cb = null;
	var ProcessingInterval = null
//---
	
	// Pause compilation...
	function pausecomp(millis)
	{
	    var date = new Date();
	    var curDate = null;
	    do { curDate = new Date(); }
	    while(curDate-date < millis);
	}
	
	function setFooterOptions(){
		var ftu_left = '<li><label for="wf_gui_debug"><input type="checkbox" id="wf_gui_debug"> Debug</label></li>\
		<li><label for="wf_gui_debug_ajax"><input type="checkbox" id="wf_gui_debug_ajax"> Ajax</label></li>\
		<li><label for="wf_gui_debug_ajax_data"><input type="checkbox" id="wf_gui_debug_ajax_data"> Ajax Data</label></li>';
		var ftu_testing = '<li><label for="wf_gui_debug_testing"><input type="checkbox" id="wf_gui_debug_testing"> Testing</label></li>';
		
		// Si el usuario es Ariel en SandBox O Produccion
		if(WorkForce_Obj.userID == 75401 || WorkForce_Obj.userID == 79531){
			$('#leirags-test-00').show();
			ftu_left += ftu_testing;
		}
		
		if(WorkForce_Obj.roleDBG){
			$('#wffooter-uleft').html(ftu_left);
		}
	
	}
	
	function messager( title, msg, ok_func ){
		jQuery.confirmar({
			'title'		: title,
			'message'	: msg,
			'buttons'	: {
				//'Cancel': { 'class'	: 'gray', 'action': function(){} },
				'OK'	: { 'class'	: 'blue', 'action': function(){ if(typeof ok_func == 'function') { ok_func() } } },
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
		
		var employeesobj = [{'employeeId':0, 'employeeName':'none', 'deptId':0, 'deptName':'none'}];
		var employeesobj_inactive = [{'employeeId':0, 'employeeName':'none', 'deptId':0, 'deptName':'none'}];
		var employeesobj_my = [{'employeeId':0, 'employeeName':'none', 'deptId':0, 'deptName':'none'}];
		var lastEmployeesObj = '';
		var departmentsobj = { 0:{'dptId':0, 'dptName':'none'} }
		var Tracing_Tasks_Obj = { count:0 };
		var Tracing_List_Items = ['all'];
		var Tracing_List_Address = ['all'];
		var Tracing_List_Assigned = ['all'];
		var Tracing_List_Customers = ['all'];
		
		
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

//---getEmployeeData>
		// Get employee name based on ID, search in actives first, if not found, then lookup in inactives.
		function findEmployee(fld,val){
			var empObj = {}, empNull = {employeeId:0, employeeName:'', email:'', deprId:0, deptName:'', suubsidiaryId:0, supervisor:0, wrikeID:'', inactive:true };
			var inactive = '';
			empObj = employeesobj.find(function(emp){return emp[fld] == val});
			if(empObj != undefined){
				empObj['inactive'] = false;
			} else {
				empObj = employeesobj_inactive.find(function(emp){return emp[fld] == val});
				if(empObj != undefined){
				 empObj['inactive'] = true;
				} else {
					empObj = empNull;
				}
			}
			return empObj;
		}
		
		function filterEmployees(fld,val){
			var empObj = {}, empNull = [{employeeId:0, employeeName:'', email:'', deprId:0, deptName:'', suubsidiaryId:0, supervisor:0, wrikeID:'', inactive:true }];
			var inactive = '';
			empObj = employeesobj.filter(function(emp){return trim(emp[fld]) == val});
			if(empObj != undefined){
			} else {
				empObj = empNull;
			}
			return empObj;
		}

//---Traicing-module>

		var Staff_click_in_Depart = false;
		
		HierarchyOpenFunction = function HierarchyClick(e,evt,p){
			// console.info('e',e,'evt',evt,'p',p);
			//-console.info( {'evt':evt, 'data': $(e).data(), 'Staff_click_in_Depart':Staff_click_in_Depart });
			//- window.hierarchy_click = e;
			// If es is CERO, and evt is 'close' then change evt to open or click
			var edt = $(e).data();
			if (edt.eo) {
				// Employee.. OK
				if (evt=='open' || (evt=='close' && !edt.es) ){
					// when evt is close and the node not have es, convert to Open.
					getAllMyWorkToday(edt, Staff_click_in_Depart);
					setTimeout(loaderEnd,100);
				}
			} else if(edt.et == 'department'){
				if(evt=='open'){
					getAllMyWorkToday(edt, Staff_click_in_Depart);
					setTimeout(loaderEnd,100);
				}
			}
			Staff_click_in_Depart = false;
		}
		
//---createEmployeesTree>
		function createEmployeesTree(fullView){
			var employeesRoot = $('#employees-root')
			var departmentsRoot = $('#departments-root')
			var emp_Heads = {};
			var emp_Heads_arr = {};
			var eoId = 0;
			var employeesList; // = employeesobj;
			var myData = getEmployeeData( WorkForce_Obj.userID );
			var empNull = [{employeeId:0, employeeName:'', email:'', deprId:0, deptName:'', suubsidiaryId:0, supervisor:0, wrikeID:'', inactive:true }];
			
			if (!fullView) {
				var employeesList_Level0 = filterEmployees('supervisor', myData.supervisor ) // Same Level, heres appear myself.
				var employeesList_Level1 = filterEmployees('supervisor', myData.employeeId ) // My Desendants
				// Add second level of dependents
				var employeesList_Level23 = []
				employeesList_Level1.forEach(function(emp){
					if (emp.employeeId) {
						var Level2 = filterEmployees('supervisor', emp.employeeId )
						if (Level2.length) {
							employeesList_Level23 = employeesList_Level23.concat(Level2)
							// Add third level of dependents
							var employeesList_Level3 = []
							Level2.forEach(function(emp3){
								if (emp3.employeeId){
									var Level3 = filterEmployees('supervisor', emp3.employeeId )
									if (Level3.length)
										employeesList_Level23 = employeesList_Level23.concat(Level3)
								}
							})
						}
					}
				})
				if (employeesList_Level23.length)
					employeesList_Level1 = employeesList_Level1.concat(employeesList_Level23)
				var employeesList = empNull.concat(employeesList_Level0,employeesList_Level1, getEmployeeData(myData.supervisor)); // Override data.
				employeesobj_my = employeesList;
			} else {
				var employeesList = empNull.concat( employeesobj );
				employeesobj_my = employeesList;
			}
			
			employeesList.map(function(emp){
				if (!fullView) {
					if (emp.employeeId == myData.supervisor) {
						if(!emp_Heads_arr[emp.employeeId]) emp_Heads_arr[emp.employeeId] = { head:0, body:{}, subs:0, used:0 };
						emp_Heads_arr[emp.employeeId]['head'] = eoId;
					} else {
						if(!emp_Heads_arr[emp.supervisor]) emp_Heads_arr[emp.supervisor] = { head:0, body:{}, subs:0, used:0 };
						emp_Heads_arr[emp.supervisor]['body'][emp.employeeId] = eoId;
						emp_Heads_arr[emp.supervisor]['subs']++;
					}
				} else {
					if (!emp.supervisor) {
						if(!emp_Heads_arr[emp.employeeId]) emp_Heads_arr[emp.employeeId] = { head:0, body:{}, subs:0, used:0 };
						emp_Heads_arr[emp.employeeId]['head'] = eoId;
					} else {
						if(!emp_Heads_arr[emp.supervisor]) emp_Heads_arr[emp.supervisor] = { head:0, body:{}, subs:0, used:0 };
						emp_Heads_arr[emp.supervisor]['body'][emp.employeeId] = eoId;
						emp_Heads_arr[emp.supervisor]['subs']++;
					}
				}
				eoId++;
			});
			
			var tree_hierarchy = '';
			var colors_tree = ['success','info','warning','default','danger','success','info'];
			
			function recursiveHie(bodys, n, lvl){
				var sup = '<ul class="collapsibleList">', ni=0, re=[];
				lvl++;
				for(var sb in bodys){
					re.push(sb);
					ni++;
					sup += '<li';
					if(ni==n) sup += ' class="lastChild"';
					var rst = [ '',[] ];
					if (emp_Heads_arr[sb] && emp_Heads_arr[sb].subs)
						rst = recursiveHie(emp_Heads_arr[sb].body, emp_Heads_arr[sb].subs, lvl);
					sup += ' data-et="employee" data-eo="'+bodys[sb]+'" data-ei="'+sb+'" data-es="'+((emp_Heads_arr[sb])?emp_Heads_arr[sb].subs:'0')+'" ';
					sup += ' data-ed=\''+JSON.stringify(rst[1])+'\'>';
					sup += '<span>'+employeesList[bodys[sb]].employeeName+'</span>';
					sup += '<emp class="text-'+colors_tree[lvl]+' pull-right" onClick="Staff_click_in_Depart=true;">'+employeesList[bodys[sb]].deptName+'</emp>'
					sup += rst[0];
					re = re.concat(rst[1]);
					sup += '</li>';
				}
				sup += '</ul>';
				lvl--;
				return [sup, re]
			}
			var lvl = 0;
			for (var empI in emp_Heads_arr) {
				var emp = emp_Heads_arr[empI];
				if(emp.head) {
					var sup = '<li data-et="employee" data-eo="'+emp.head+'" data-ei="'+empI+'" data-es="'+emp.subs+'" ';
					if (emp.subs) {
						var rst = recursiveHie(emp.body, emp.subs, 0);
						sup += ' data-ed=\''+JSON.stringify(rst[1])+'\'>';
						sup += '<span>'+employeesList[emp.head].employeeName+'</span>'
						sup += '<emp class="text-'+colors_tree[lvl]+' pull-right" onClick="Staff_click_in_Depart=true;">'+employeesList[emp.head].deptName+'</emp>'
						sup += rst[0];
						sup += '</li>';
						tree_hierarchy += sup;
					}
				}
			}
			employeesRoot.html(tree_hierarchy)
			//---- Add section by deptos...
			var tree_hierarchy_dep = '';
			var listDeptos = {};
			var eoId = 0;
			
			employeesList.map(function(emp){
				if (emp.deptId) {
					if ( ! listDeptos[emp.deptId] ) {
						listDeptos[emp.deptId] = {name:emp.deptName, id:emp.deptId, cnt:0, personel: {} };
					}
					listDeptos[emp.deptId]['personel'][emp.employeeId] = eoId;
					listDeptos[emp.deptId]['cnt']++;
				}
				eoId++;
			});
			function recursiveHieDeptos(personels, n, lvl){
				//console.info('bodys:',bodys)
				var sup = '<ul class="collapsibleList">', ni=0;
				var re = [];
				lvl++;
				for(var sb in personels){
					//console.info('Body:',sb)
					re.push(sb);
					ni++;
					sup += '<li';
					if(ni==n) sup += ' class="lastChild"'; 
					sup += ' data-et="employee" data-eo="'+personels[sb]+'" data-ei="'+sb+'" data-es="'+((listDeptos[sb])?listDeptos[sb].cnt:'0')+'">'
					sup += '<span>'+employeesList[personels[sb]].employeeName+'<span>';
					sup += '<emp class="text-'+colors_tree[lvl]+' pull-right">'+employeesList[personels[sb]].deptName+'</emp>'
					if (listDeptos[sb] && listDeptos[sb].cnt) {
						 var ret = recursiveHieDeptos(listDeptos[sb].personel, listDeptos[sb].cnt, lvl);
						 sup += ret[0];
						 re.pusc(ret[1]);
					}
					sup += '</li>';
				}
				sup += '</ul>';
				lvl--;
				return [sup, re]
			}
			var lvl = 0;
			for (var depI in listDeptos) {
				var dep = listDeptos[depI];
				if(dep.cnt) {
					var sup = '<li data-et="department" data-eo="'+0+'" data-es="'+dep.cnt+'" data-ed="'+dep.id+'" ';
					if (dep.cnt) {
						var ret = recursiveHieDeptos(dep.personel, dep.cnt, 0);
						sup += ' data-ei=\''+JSON.stringify(ret[1])+'\'>';
						sup += '<span>'+dep.name+'<span>';
						sup += '<emp class="text-'+colors_tree[lvl]+' pull-right">'+dep.cnt+'</emp>'
						sup += ret[0];
					}
					sup += '</li>'	
					tree_hierarchy_dep += sup
				}
			}
			departmentsRoot.html(tree_hierarchy_dep);
			LeirAGSCollapsibleLists.applyTwo( document.getElementById('hr-list-tree'), HierarchyOpenFunction )
		}
		
		
//---insert_mention>
		function insert_mention() {
			var v_mi = '#addmention-id';
			var mention_id = $(v_mi).val();
			if (!mention_id) return false;
			var v_ta = '#new-msg-cont';
			var v_mn = '#addmention-name';
			var mention = $(v_mn).val();
			var cursorPos = $(v_ta).prop('selectionStart');
			var v = $(v_ta).val();
			var textBefore = v.substring(0,  cursorPos);
			var textAfter  = v.substring(cursorPos, v.length);
			if(WF_DEBUG)
				console.info("Add Mention:",mention,"id:",mention_id);
			var employeeA = employeesobj.find(function(emp){return emp.employeeId==mention_id});
			all_mentions[mention] = employeeA;
			var link_mention = "["+mention+"] ";
			$(v_ta).val(textBefore + link_mention + textAfter);
			$(v_mi).val('');
			$(v_mn).val('');
			$(v_ta).focus();
			return false;
		}
		
//---sendMessageTask>
		function sendMessageTask(){
			var taskIdmsg=$('#leirags_fileup_task').val(); 
			var taskMsg=$('#new-msg-cont').val();
			var taskSoMsg = $('#leirags_fileup_so').val();
			var taskAssignee = $('#leirags_fileup_assignee').val();
			if(taskIdmsg && taskMsg && taskSoMsg) {
				processMessage(taskIdmsg,taskSoMsg,taskMsg,taskAssignee);
				$('#new-msg-cont').val('');
				setTimeout(function(){ getTaskNotes(taskIdmsg,0,null); }, 100);
			}
			all_mentions = {};
			return false;
		}
		
//---processMessage>
		function processMessage(taskIdmsg,taskSoMsg,taskMsg,taskAssignee){
			var taskTitle = $('#leirags_fileup_tasktitle').val();
			var msg = taskMsg;
			var r_msg = msg;
			var mentions = getVarsObject(all_mentions);
			var real_mentions = [];
			// Convert urls to anchors.
			function linkify(text) {
			    var urlRegex =/(\b(http?|https|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
			    return text.replace(urlRegex, function(url) {
			        return '<a href="' + url + '" target="_blank">' + url + '</a>';
			    });
			}
			r_msg = linkify(r_msg);
			// Convert \n or \r to <br>
			r_msg = r_msg.replace(new RegExp('\r?\n','g'), '<br>');
			if (mentions) {
				//console.info('mentions',mentions);
				mentions.map(function(key){
					//console.info('key',key);
					var rgx = new RegExp('\\['+key+'\\]','gi');
					var newVal = '<a href="#" data-user="'+LeirAGS_XORCipher.encode('Transtelco Inc',all_mentions[key].employeeId)+'">'+key+'</a>';
					msg = r_msg;
					r_msg = r_msg.replace(rgx, newVal );
					if(msg.length != r_msg.length){
						real_mentions.push({name:key, userid:all_mentions[key].employeeId, email:all_mentions[key].email});
					}
				});
			}
			/* console.info('Original Msg:',taskMsg); console.info('New Msg:',r_msg); console.info('real_mentions',real_mentions); */
			writeNoteOntask(taskIdmsg, taskSoMsg, taskAssignee, taskTitle, r_msg, real_mentions);
			return true;
		}
		
//---sendSuccessorMailsCompletedTask
		function sendSuccessorMailsCompletedTask(){
			if (! WF_Enable_Notification_On_Completed) return;
			if ((taskCurrData.Successors).length) {
				if(WF_DEBUG)
					console.info('Sending mails to Successor of Completed Task')
				// Register Completed on TaskNotes
				// Register Predecessor Completed
				var msg_tmpl = ' Predecessor task completed: {{title}}, by {{assigned_n}}.';
				var complete_msg = LeirAGS_Tmpl ( msg_tmpl, {'title':taskCurrData.title, 'assigned_n':taskCurrData.assigned_n });
				var assigneedData = getEmployeeData(taskCurrData.assigned);
				var mentolmention = [];
				mentolmention.push({name:assigneedData.employeeName, email: assigneedData.email, userid: assigneedData.employeeId });
				(taskCurrData.Successors).forEach(function(suc){
					if(WF_DEBUG)
					console.info('Notification Completed', 
							{'SuccesorId':suc.idTask, 
							 'SalesOrder':taskCurrData.soid, 
							 'AssignedID':suc.assigned_id, 
							 'Title':suc.title, 
							 'Message':complete_msg, 
							 'Mentions':mentolmention });
					writeNoteOntask(suc.idTask, taskCurrData.soid, suc.assigned_id, suc.title, complete_msg,mentolmention );
				})
			} else {
				if(WF_DEBUG)
					console.info('No Successors in Task.')
			}
		}
		
		
//---getUrl>
function getUrl() {
	if (WorkForce_Obj.Env == 'SANDBOX') {
		return {
			'RT-Old': '/app/site/hosting/restlet.nl?script=1386&deploy=1',
			'RT': '/app/site/hosting/scriptlet.nl?script=1481&deploy=1',
			'BSL': '/app/site/hosting/scriptlet.nl?script=1481&deploy=1',
			'RT2-Old': '/app/site/hosting/restlet.nl?script=1413&deploy=1',
			'RT2': '/app/site/hosting/scriptlet.nl?script=1481&deploy=1',
			'RT3': '/app/site/hosting/restlet.nl?script=1427&deploy=1',
			'wrike': '/app/site/hosting/scriptlet.nl?script=1393&deploy=1',
			'Common': "/app/site/hosting/scriptlet.nl?script=837&deploy=1",
			'MLog' : 'https://y16m9ssk3.transtelco.net/nslogs/debug_wfm',
			'AddTask' : '/app/site/hosting/scriptlet.nl?script=1699&deploy=1&',
			'Cabinet' : '/app/site/hosting/scriptlet.nl?script=1710&deploy=1&', 
		}
	} else {
		return {
			'RT-Old': '/app/site/hosting/restlet.nl?script=1307&deploy=1', // Old RT
			'RT': '/app/site/hosting/scriptlet.nl?script=1346&deploy=1',
			'BSL': '/app/site/hosting/scriptlet.nl?script=1346&deploy=1',
			'RT2': '/app/site/hosting/scriptlet.nl?script=1346&deploy=1',
			'RT3': '/app/site/hosting/restlet.nl?script=1344&deploy=1',
			'wrike': '/app/site/hosting/scriptlet.nl?script=1246&deploy=1',
			'Common': '/app/site/hosting/scriptlet.nl?script=837&deploy=1',
			'MLog' : 'https://y16m9ssk3.transtelco.net/nslogs/debug_wfm',
			'AddTask': '/app/site/hosting/scriptlet.nl?script=1351&deploy=1&',
			'Cabinet' : '/app/site/hosting/scriptlet.nl?script=1420&deploy=1&',
		}
	}
}

//---getColorTaskValidate>
		function getColorTaskValidate (setColortoRedOutDated, yellow, status) {
var colors_by_state = {
'Normal': '',
'RedA': " style='background: #990000; opacity:0.1;' ",
'RedB': " style='background-color: rgba(255,0,0,0.7); text-decoration: through;' ",
'Red': " style='background-color: rgba(201,114,98,0.7); text-decoration: through;' ",
'Yellow': " style='background: #FF9900;' ",
'CompletedA': " style='background: #39AC39;' ",
'CompletedB': " style='background-color: rgba(3,250,3,0.7);' ",
'Completed': " style='background-color: #23e059;' ",
'Cancelled': " style='text-decoration: line-through; background: #D3D3D3;' "
};

var colors_by_state1 = {
'Normal'	: '',
'Red'		: " class='band-passdue' ",
'Yellow'	: " class='band-ontime' ",
'Completed'	: " class='band-onweek' ",
'Cancelled'	: " class='band-cancel' "
};

var colors_by_state2 = {
'Normal': " style='border-left:5px solid #aeaefe; border-bottom:1px solid #aeaefe;' ",
'Red': " style='border-left:5px solid #a3441a; border-bottom:1px solid #a3441a;' ",
'Yellow': " style='border-left:5px solid #ffd27f; border-bottom:1px solid #ffd27f;' ",
'Completed': " style='border-left:5px solid #2ab71d; border-bottom:1px solid #2ab71d;' ",
'Cancelled': " style='border-left:5px solid #d16637; border-bottom:1px solid #d16637;' "
};

var flagColorRedRow = 'Normal';
if (setColortoRedOutDated) flagColorRedRow = 'Red';
if (yellow) flagColorRedRow = 'Yellow';
if (status == '2') flagColorRedRow = 'Completed';
if (status == '4') flagColorRedRow = 'Cancelled';

return colors_by_state[flagColorRedRow];
		}

//---ValidateAck>
		function ValidateAck(domObjs){
		  var domObj = $(domObjs);
		  if(domObj.length){
		      var inner = domObj[0].innerHTML;
		      var ninner = inner.split('onchange="');
		      if(ninner.length>1){
		        if(ninner[1])
		        var ninner2 = ninner[1].split('"')
		        if(ninner2.length)
		          if(ninner2[0] == ""){
		            var oldAck = domObj.data('oldAck');
		            return [false,oldAck];
		          }
		      }
		  }
		  return [true,''];
		}

		function getNameSOfromField(vExtract){
			var nameSo = $('#nameSoField_'+vExtract).val();
			return nameSo;
		}

		function enterpress(e, txtName){
			if(WF_DEBUG) console.info('this',txtName);
			var code = (e.keyCode ? e.keyCode : e.which);
			if(code == 13) { //Enter keycode
				var idButton = $(txtName).attr('data-button');
				if(idButton)
					$('#'+idButton).click();
			}
		}

		function showHideTab(sh){
			if(sh){
				/* show all tables of task information */
				$("div.thetabtogants").show();
				$("table#myUpdatedSA").show();
				$("table#myUpdatedServicesAddresses").show();
				//$(".div-salesorder").show();
				$("table#mytblTasks").show();
			}else{
				/* Hide all tables of task information */
				$("div.thetabtogants").hide();
				$("table#myUpdatedSA").hide();
				$("table#myUpdatedServicesAddresses").hide();
				//$(".div-salesorder").show();
				$("table#mytblTasks").hide();

			}
		}
		
		function showAllWFImages(){
			$('#whynotLeft').html('<h4>All images</h4>'+getAllNetSuiteImage() );
		}
		
//--- mirrorLog>
		function mirrorLog (fromService, debugTitle, data) {
			if (!WF_DEBUG_AJAX_MIRROR) return;
			
			var task_id = ((data['WhichTask']) ? data['WhichTask'] 
					: ((data['id']) ? data['id']
					: '' ));
			var salesorder_id = ((data['SO']) ? data['SO'] 
					: ((data['WhichSalesOrder']) ? data['WhichSalesOrder'] 
					: ((data['idSO']) ? data['idSO'] 
					: ((data['salesorder']) ? data['salesorder'] 
					: ''))));
			// ((data['SO']) ? data['SO'] : '')
			$.ajax({
				url: getUrl().MLog,
				type: 'POST',
				data: {
					'origin'	: WorkForce_Obj.Env, // Sandbox Produccion
					'module'	: fromService, // Workforce
					'title'		: debugTitle, // Titulo para el Log
					'details'	: JSON.stringify(data), // Detalles del Error
					'nsuser' 	: WorkForce_Obj.userName , //
					'nsuserId' 	: WorkForce_Obj.userID , //
					'nsuserRole': WorkForce_Obj.userRole, //
					'salesorder_id' : salesorder_id, //
					'task_id' : task_id, //
				}
			});
		}

		mirrorLog('Login',((WorkForce_Obj.auditId)?'Auditing':'Starting'), ((WorkForce_Obj.auditId)?'Auditing: '+WorkForce_Obj.auditId: '...') );
		
//---showMyWorkEmployees>
		function showMyWorkEmployees(sh){
			if (sh) {
				$('#hr-list').removeClass('hide')
				$('#myw-cnt').removeClass('col-sm-12')
				$('#myw-cnt').addClass('col-sm-9')
			} else {
				$('#hr-list').addClass('hide')
				$('#myw-cnt').removeClass('col-sm-9')
				$('#myw-cnt').addClass('col-sm-12')
			}
			$.fn.dataTable.tables( {visible: true, api: true} ).columns.adjust().draw();
			//-- reajustar las datatable...
		}
//---showMyWorkEmployees<

//---StringNetsuiteDateToDate>
		function StringNetsuiteDateToDate (s) {

				if (typeof s === 'string') {

				} else {
					return s;
				}

				var months = window.datetime_short_months;
				var newDate = new Date(); // Default result...

				// console.info("Window.dateformat",window.dateformat)
				switch (window.dateformat) {
					case 'MM/DD/YYYY':
						var parts = s.split('/');
						newDate = new Date(parts[2], parts[0] - 1, parts[1],0 ,0 ,0 ,0 );
						break;
					case 'MM.DD.YYYY':
						var parts = s.split('.');
						newDate = new Date(parts[2], parts[0] - 1, parts[1],0 ,0 ,0 ,0 );
						break;
					case 'DD/MM/YYYY':
						var parts = s.split('/');
						newDate = new Date(parts[2], parts[1] - 1, parts[0],0 ,0 ,0 ,0 );
						break;
					case 'DD.MM.YYYY':
						var parts = s.split('.');
						newDate = new Date(parts[2], parts[1] - 1, parts[0],0 ,0 ,0 ,0 );
						break;
					case 'YYYY/MM/DD':
						var parts = s.split('/');
						newDate = new Date(parts[0], parts[1] - 1, parts[2],0 ,0 ,0 ,0 );
						break;
					case 'YYYY-MM-DD':
						var parts = s.split('-');
						newDate = new Date(parts[0], parts[1] - 1, parts[2],0 ,0 ,0 ,0 );
						break;
					case 'YYYY.MM.DD':
						var parts = s.split('.');
						newDate = new Date(parts[0], parts[1] - 1, parts[2],0 ,0 ,0 ,0 );
						break;
					case 'DD.Mon.YYYY':
						var parts = s.split('.');
						newDate = new Date(parts[2], months.indexOf(parts[1]), parts[0],0 ,0 ,0 ,0 );
						break;
					case 'DD-Mon-YYYY':
						var parts = s.split('-');
						newDate = new Date(parts[2], months.indexOf(parts[1]), parts[0],0 ,0 ,0 ,0 );
						break;
					case 'DD-Month-YYYY':
						var parts = s.split('-');
						newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 3)), parts[0],0 ,0 ,0 ,0 );
						break;
					case 'DD-MONTH-YYYY':
						var parts = s.split('-');
						newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0],0 ,0 ,0 ,0 );
						break;
					case 'DD,MONTH,YYYY':
						var parts = s.split(',');
						newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0],0 ,0 ,0 ,0 );
						break;
					case 'DD MONTH, YYYY':
						var parts = s.split(' ');
						newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0],0 ,0 ,0 ,0 );
						break;
				}
				return newDate;
			}
//---StringNetsuiteDateToDate<


	function StrNetSuiteDatetoYMD(str){
		var datei = StringNetsuiteDateToDate(str);
		var d = datei.getDate(),
			m = datei.getMonth(),
			y = datei.getFullYear();
		return ''+y+'-'+( m + 1)+'-'+d;
	}


//---YMDToDate>
		window.YMDToDate = function(s) {

			if (typeof s === 'string') {

			} else {
				return s;
			}
			var months = window.datetime_short_months;
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
			if(WF_DEBUG)
				console.info('window.dateformat:',window.dateformat)
				
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
			}
			if(WF_DEBUG)
				console.info('Set CalendarInputFormat:',CalendarInputFormat)
		}
//---setCalendarFormatInput<




//---dateToStringNetsuite>
		function dateToStringNetsuite(datei) {
			if (WF_DEBUG)
				console.info("dateToStringNetsuite params:", datei);

			if (typeof datei == 'string') {

				return false;
			}
			var d = datei.getDate(),
				m = datei.getMonth(),
				y = datei.getFullYear();
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
				  delim = '/';
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

		function boostrap_selectpicker_set_value(el,values){
			//--var values = "1,3,1001";
			// Clear Current Selected...
			$(el+' option').prop("selected", false);
			$.each(values.split(","), function(i,e){
			    $(el+" option[value='" + e + "']").prop("selected", true);
			});
			$(el).selectpicker("refresh");
		}

//--ProcessGoActions>
		var getAllMyWorkExtra;
		
		function processGoActions(goto){
			/*
			 * Used to make special automation process
			 *  
			 */
			switch(goto){
			case 'notifications':
					//Step 1 .. show my-work-tab
					selectTabOk("tabnotifications");
					window.scrollTo(0, 0);
					getMyNotifications('incoming');
					getMyNotifications('outgoing');
				break;
			case 'task-active':
					selectTabOk("tabsalesord1");
					window.scrollTo(0, 0);
					// Set filter
					boostrap_selectpicker_set_value('#multipleSelectStatus','1');
					// Uncheck today
					$('#today-tasks').prop( "checked", false );
					// Clic filter button
					$('#filterTaskStatus').trigger('click');
				break;
			case 'task-unacknowledged':
					selectTabOk("tabsalesord1");
					window.scrollTo(0, 0);
					// Set filter
					boostrap_selectpicker_set_value('#multipleSelectStatus','1002');
					// Uncheck today
					$('#today-tasks').prop( "checked", false );
					// Clic filter button
					$('#filterTaskStatus').trigger('click');
				break;
			case 'task-deviated':
					selectTabOk("tabsalesord1");
					window.scrollTo(0, 0);
					// Set filter
					boostrap_selectpicker_set_value('#multipleSelectStatus','1');
					// Uncheck today
					$('#today-tasks').prop( "checked", false );
					// Clic filter button
					//-- $('#filterTaskStatus').trigger('click');
					
					var whichStatusFilters=$('#multipleSelectStatus').val();
					console.info('task-deviated filter apply');
					loaderStart();
					setTimeout(function(){ getAllMyWorkExtra(0, String(whichStatusFilters), true, 'deviated') },100)
					
				break;
			case 'my-sales-orders':
					selectTabOk("tabsalesord2");
					window.scrollTo(0, 0);
					$('#filterButtonSO').trigger('click');
				break;
			default:
				break;
			}
		}



		

		var flatpickers_myw = {};
		
		// Wen call create instance of datepicker and open.
		function addDatePickerOnFly(e){
			var eid = '#'+$(e).attr('id');
			var currFp = flatpickers_myw[eid];
			if( currFp != undefined ){
			} else {
				var cst = $(eid).val();
				var cdt = StrNetSuiteDatetoYMD(cst);
				fp = new Flatpickr(e, { defaultDate: cdt, dateFormat: CalendarInputFormat });
				flatpickers_myw[eid] = fp;
				flatpickers_myw[eid].open();
			}
		}
		
		function destroyFlyDatePickers(type){
			for(fp in flatpickers_myw){
				if(hasOwnProperty.call(flatpickers_myw, fp)){ 
					flatpickers_myw[fp].destroy();
				}
			}
			flatpickers_myw = {}; // reset array too.
		};

//---displaySObySpan>
		function displaySObySpan (id, name, title, memo ) {
			if(WF_DEBUG)
				console.info('displaySObySpan()','id:',id,'name:',name,'title:',title,'memo',memo);
			$('#TitleSalesOrderBySpan').html(title);
			$('#IdSalesOrderBySpan').html(id);
			$('#NameSalesOrderBySpan').html(name);
			$('#workforce_top_head_so').html(name);
			if(myWorkSOdata[id]){
				/*
				tso_entI:"6"
				tso_entN:"Default Tax Agency MX : D....)"
				tso_id:"437770"
				tso_label:"SO-1-2441"
				tso_memc:"Migración de DIA de 20 Mbps de...aparece en NS: 1-13788228"
				tso_memo:"VAT"
				*/
				var spanSmall = '<span style="display:inline-block; color:#555; font-size:80%; font-weight:normal;">'+
						myWorkSOdata[id].tso_memo+"<br><i class='text-info'>"+
						((myWorkSOdata[id].tso_memo != myWorkSOdata[id].tso_memc)?myWorkSOdata[id].tso_memc:'')+
						'</i></span>';
				//title = ""+myWorkSOdata[id].tso_entN+"<br>"+spanSmall;
				title += "<br>"+spanSmall+"";
				$('#TitleSalesOrderBySpan').html(title);
			} else {
				if(memo){
					var spanSmall = '<span style="display:inline-block; color:#555; font-size:80%; font-weight:normal;">'+
							memo+'</span>';
					title += "<br>"+spanSmall+"";
					$('#TitleSalesOrderBySpan').html(title);
				}
			}
		}
		
//---openAddTask>		
		function openAddTask(elem){
			var url = getUrl().AddTask;
			var SOid = $('#IdSalesOrderBySpan').html();
			var taskId = $(elem).attr('data-taskid');
			url += 'SalesOrder='+SOid+'&taskId='+taskId+'&';
			
			var myWin = window.open(url,'WorkForce - New Process');
			/*
			window.document.body.style.overflow = "hidden";
			nlExtOpenWindow(url, 'New Activity', 980, 660);
			*/
		}
		
//---openNetSuiteTask>
		function openNetSuiteTask(Taskid){
			url = '/app/crm/calendar/task.nl?id=' + Taskid + '&whence=';
			var win = window.open(url, '_blank');
			win.focus();
		}
		
//---openWrikeComment>		
		function openWrikeComment (wrikeid, Taskid, fromtree) {
			if(WF_DEBUG)
				console.info('openWrikeComment()',{'wrikeid':wrikeid, 'Taskid':Taskid, 'fromtree':fromtree});
			//	wrikeid = 'IEAABMCWKQDM736U';
			if (!wrikeid) {
				

			} else {
				url = getUrl().wrike + '&deploy=1&pop=T&taskid=' + wrikeid + '&ifrmcntnr=T&folder=F';
				var foundSinc = false;
				
				var datos = {
					'action': 'getSincronWithWrike'
				};

				if (WF_DEBUG_AJAX)
					console.info('openWrikeComment()',"getSincronWithWrike .BSL", datos);

				mirrorLog('openWrikeComment','getSincronWithWrike .BSL', datos ); 

				$.ajax({
					url: getUrl().BSL,
					type: 'POST',
					data: datos,
					success: function(data) {
						console.log("Wrikesin " + data);
						foundSinc = data;
						loaderEnd();
					}
				});

				if (fromtree) {
					url += '&workforce=T';
					$("#wrike_comment_iframe").attr("src", url).show();
				} else {
					nlExtOpenWindow(url, 'Comment', 700, 350);
					$('.x-shadow').css('top', '150px');
				}
			}
		}
		
//---CleanResponseData>
		function CleanResponseData(data) {
			WF_NetSuite_Error = false;
			memstats.update();
			// if(WF_DEBUG)
			// 	console.info('newData', data);
			if (data.substring(0,15) == '<!DOCTYPE html>'){
				WF_NetSuite_Error = true;
				window.WF_NetSuite_Error_Data = data;
				var newData = {};
				var mark_need_login ='>Could not determine customer compid<';
				if (data.indexOf(mark_need_login) != -1) {
					alert('Session with NetSuite was ended.\nNeed Reload Workforce Management\n.');
					var forceGet = true; 
					/* false - Default. Reloads the current page from the cache.
					   true - Reloads the current page from the server */
					window.location.reload(forceGet);
				} else {
					// console.error('NetSuite return data', data );
					// try Catch Errors
					xtable = data.substring( data.indexOf('<table'), data.lastIndexOf('table>') + 6);
					xob = xtable.substring( xtable.indexOf('{'), xtable.lastIndexOf('}') + 1);
					error_obj = JSON.parse(xob);
					var niceError = function(o){var m=[]; for(a in o){ b=o[a]; if(typeof b === 'object'){ m.push('<tr><td>'+a+'</td><td>'+niceError(b)+'</td></tr>'); } else m.push('<tr><td>'+a+'</td><td>'+b+'</td></tr>'); }; return '<table class="table table-bordered">'+m.join('')+'</table>'; }
					$('#contenting').append( '<div class="col-sm-6"><h4>NetSuite error <small>'+(new Date()).toString()+'</small></h4>'+niceError(error_obj.cause)+'</div>' );
					console.error('NetSuite return error on call.', error_obj );
					if( $('#cnfs').is(':checked') ) {
						alert('NetSuite return error on call.');
					}
					loaderEnd();
				}
				return newData;
			} else {
				// Fix Object when NetSuite append comments...
				var newData = String(data).split('<!--');
				if(WF_DEBUG_AJAX_DATA)
					console.info('Return Data',JSON.parse(newData[0]));
				return JSON.parse(newData[0]);
			}
		}

		function jQScrollTo(elem){
			var target = $( '#'+elem );
		    if( target.length ) {
		        //event.preventDefault();
		        $('html, body').animate({
		            scrollTop: target.offset().top - 100
		        }, 500);
		    }
		}
		
		var logIndex = 0;
		function DhtmlTreeView_getUserData() {
			var id = Global_myTreeViewTask.getSelectedId();
			var tskid = Global_myTreeViewTask.getUserData(id, "taskId");
			//--console.info('DhtmlTreeView_getUserData id:',id,' taskId:',tskid);
			if (id != null && tskid != null) DhtmlTreeView_writeLog("taskId:"+tskid);
			//--DhtmlTreeView_search_taskId(1);
		}
		
		function DhtmlTreeView_writeLog(text) {
			//--$("#dhtml_log").html( $("#dhtml_log").html() + "<br>"+"["+(++logIndex)+"] "+text );
			//$("#dhtml_log").scrollTop = document.getElementById("logs_here").scrollHeight;
		}
		
		function DhtmlTreeView_clearLog() {
			$("#dhtml_log").html("DHTML TREE VIEW - Log<hr>");
		}
		
		function DhtmlTreeView_search_taskId(tskId, fromClick){
			//--console.info('DhtmlTreeView_search_taskId (tskId)',tskId);
			var result = [], prop, tree_taskId, tree_Id=null, type;

			for (prop in Global_myTreeViewTask.items) {
			  if (hasOwnProperty.call(Global_myTreeViewTask.items, prop)) {
			    result.push(prop);
			  }
			}
			//-- console.info('Global_myTreeViewTask.items', result);
			result.forEach(function(id){
				tree_taskId = Global_myTreeViewTask.getUserData(id, "taskId");
				if(tree_taskId == tskId)
					tree_Id = id;
				if (fromClick=='table1')
					Global_myTreeViewTask.closeItem(id); // Colapse Tree while on..
				//-- console.info('id:',id,'taskId:', tree_taskId);
			});
			//-D console.info('DhtmlTreeView_search_taskId  tskId:',tskId,'tree_Id:',tree_Id);
			if(tree_Id != null){
				type = tree_Id.substring(0, 1);
				countNode = tree_Id.split('-');
				var concaNode = [];
				countNode.forEach(function(node, index) {
					if (index < countNode.length -1) {
						concaNode.push(node);
						try{
							Global_myTreeViewTask.openItem( concaNode.join('-') );
							//console.info('DHTML-TreeView element "'+concaNode.join('-')+'" opened.');
						} catch(e){
							// Simply dont say a word.
							//console.info('DHTML-TreeView element "'+concaNode.join('-')+'" cannot be opened.');
						}
					}
				});
				Global_myTreeViewTask.selectItem(tree_Id);
			}
		}
		
		function getTreeContentPlainTxt(){
			if(Global_myTreeViewTask === undefined) return;
			var props = getVarsObject(Global_myTreeViewTask.items);
			var results = [];
			props.forEach(function(iy){
				var objN = {
					'id' : Global_myTreeViewTask.items[iy].id,
					'text' : Global_myTreeViewTask.items[iy].text,
					'taskId' : Global_myTreeViewTask.items[iy].userdata.taskId,
					'audit' : Global_myTreeViewTask.items[iy].userdata.agsL
				}
				results.push(objN);
			});
			console.table(results);
		}
		
		function getVarsObject_v0(obj){
			var result = [], prop;
			for (prop in obj) {
			  if (hasOwnProperty.call(obj, prop)) {
			    result.push(prop);
			  }
			}
			return result;
		}
		
//---enablePMroles>
		function enablePMroles(){
			// User WorkForce_Obj.rolePM instead of Pm.
			var RolesLabels = {
					'R3' 	: 'Administrator',
					'R18' 	: 'Full Access',
					'R1022' : 'Project manager',
					'R1023' : 'Sales Director',
					'R1067' : 'Ingenieria/Aprovisionamiento/Supervisor',
					'R1054' : 'Ingenieria/Infraestructura',
				}
//			if(RolesLabels['R'+WorkForce_Obj.userRole]) {
//				$('p#msgAdminSalesOrdersTab').html('As ' + RolesLabels['R'+WorkForce_Obj.userRole] + ' role, you can see this general view of Sales Orders');
//				$('.tabso5').css("display", "block");
//			} 
			$('.tabso5').css("display", "block");
			
			if (WorkForce_Obj.stealthyEn === true) {
				auditSpace="<input type='hidden' value='' id='selectAuditId'><input id='selectAuditIdName' class='employeeSelectFly inputs' type='text' value='' onClick='selectassignee(this)' data-onchg='selectAuditId' style='width:32px; background: none repeat scroll 0 0 #8097B9 !important;color: #90A7C9;'>";
				$('#auditSpace').html(auditSpace);
				$('#selectAuditId').on('change',function(){
					WorkForce_Obj.auditId=$(this).val();
					if (WorkForce_Obj.userID == WorkForce_Obj.auditId)
						$('#audit-name').html( '' );
					else
						$('#audit-name').html( $('#selectAuditIdName').val() );
					getStatsToday(); // Extract the stats...
					getStatsToday( true );
				});
				$('#tabSOfull').css('display','inline-block'); // Display Sales Orders tab in float menu.
			}
			// Si el usuario es Ariel, Hugo en SandBox O Produccion
			var TracingTasks = " '75401', '79531', '17161',  '12140', '21562', '20234' ";
			
			$('.tabso6').css("display", "block");
			
			//if (TracingTasks.indexOf(WorkForce_Obj.userID) != -1) {
			createEmployeesTree( ( TracingTasks.indexOf(WorkForce_Obj.userID) != -1 ) )
			//} else 
			//	createEmployeesTree(false);
			
			if (WorkForce_Obj.rolePM) {
				$('#addTasksProcessToSO').show();
			}
		}
		
		/*
		 * Function verify variables of task to determinates
		 * if user can edit task.
		 */
//---getEnableEdit>
		function getEnableEdit(assigned, status) {
			var enableEdit = false;
			//WHO CAN EDIT-------------------------------------------------------------
			// User is PM or is your task, and task is not cancel and  not completed. 
			enableEdit = (
					((WorkForce_Obj.rolePM) || 							// User in WF is PM...
					 (WorkForce_Obj.userID == assigned) || 				// User in WF same as asigned
					((WorkForce_MyTeam).indexOf(assigned) != -1)) && 	// assigned is of my team
					( status != 2 && 								// task status is not Completed (2)
					  status != 3 &&								// task status is not Deferred (3)
					  status != 4 )									// task status is not Canceled (4)
			) || WF_Develop_State;									// testing by developer...
			//------------
			// WHO CAN SET-ASSIGNED... 2017-Apr-03 08:00PM
			enableChangeAssigned = 
					WorkForce_Obj.rolePM || 						// User in WF is PM...
					WorkForce_Obj.canReassign || 					// Special User in WF...
					WorkForce_MyTeam.length || 						// User have a team...AT LEAST ONE
					WF_Develop_State;								// testing by developer...
			//------------
			return enableEdit;
		}
		
		//
		// * detect which sales order, 
		// * if not allready loaded, then load
		// * change tab to SO and 
		// * change to tree view then
		// * locate the task then showit...
		//
//---locate_task_on_tree>
		function locate_task_on_tree(e){
			var myCol = $(e).index();
		    var $tr = $(e).closest('tr');
		    var myRow = $tr.index();
		    var trData = $tr.data();
		    var soid = $("#IdSalesOrderBySpan").text();
		    if (soid && trData.id){
		    	//Show Tree View
		    	$('.dtab2').trigger('click');
		    	showTask(trData.id, 'tree');
		    } else {
		    	
		    }
		}
		
		/*
		 * Setup data for task Messages when called from SalesOrder Details
		 * ------
		 */
//---locate_task_messages>
		function locate_task_messages(e){
			var myCol = $(e).index();
		    var $tr = $(e).closest('tr');
		    var myRow = $tr.index();
		    var trData = $tr.data();
		    var soid = $("#IdSalesOrderBySpan").text();
		    if (soid && trData.id){
		    	//Show Tree View
		    	$('.dtab2').trigger('click');
		    	showTask(trData.id, 'tree');
		    } else {
		    	
		    }
		}
		
//---open_so_and_locate_task_on_tree>
		function open_so_and_locate_task_on_tree(e,o,t){
			var soid = $("#IdSalesOrderBySpan").text();
			if(WF_DEBUG)
				console.info('Click: open_so_and_locate_task_on_tree', o, t, soid);
			loaderStart();
			setTimeout(function(){
			    // Load the new SO if is diferent from current showing... 
			    if (soid != o){
			    	var cmp = $(e).data('cmp');
					var nameSO = $(e).data('soname');
			    	displaySObySpan (o, nameSO, cmp);
			    	clickinSO(o, false);	
			    }
			    loaderStart();
			    // Got to tab 2
			    $('#tabsalesord2').trigger('click');
		    	//Show Tree View
		    	$('.dtab2').trigger('click');
		    	showTask(t, 'tree');
		    	// Scroll to...
		    	jQScrollTo('tabtogant2');
			},200);
		}
		
//---open_so_and_locate_task_on_tree_tracing>
		function open_so_and_locate_task_on_tree_tracing(o_i,o_s,o_c,o_t){
			var soid = $("#IdSalesOrderBySpan").text();
			if(WF_DEBUG)
				console.info('Click: open_so_and_locate_task_on_tree_tracing', o_i, o_s,o_t, soid);
			loaderStart();
			setTimeout(function(){
			    // Load the new SO if is diferent from current showing... 
			    if (soid != o_i){
			    	displaySObySpan (o_i, o_s, o_c);
			    	clickinSO(o_i, false);	
			    }
			    loaderStart();
			    // Got to tab 2
			    $('#tabsalesord2').trigger('click');
		    	//Show Tree View
		    	$('.dtab2').trigger('click');
		    	showTask(o_t, 'tree');
		    	// Scroll to...
		    	jQScrollTo('tabtogant2');
			},2);
		}
		
//---getSaleOrderData>		
		function getSaleOrderData(soid){
			if (WF_DEBUG)
				console.info('getSaleOrderData(soid)', soid);
			
			//--Clear Data on Form Upload Files
				$('#leirags_fileup_so').val('0');
				$('#leirags_fileup_soname').val( '' );
				$('#leirags_fileup_task').val('0');
				$('#leirags_fileup_tasktitle').val('');
				$('#tasktitle_toup').html('');
				$('#leirags_fileup_filename').val('');
				//$('#upload-files').hide();
				$('#task-messages').html('');
				// Clear NetWork Design... tab
				$('#nddata-presale').html('');
				$('#nddata-postsale').html('');
			//--
			
			var datos = {
					'action': 'getSaleOrderData',
					'WhichSalesOrder' : soid
				};
			
			if (WF_DEBUG_AJAX)
				console.info('getSaleOrderData','getSaleOrderData .RT', datos );
				
			mirrorLog('getSaleOrderData','getSaleOrderData .RT', datos );

			$.ajax({
				url: getUrl().RT,
				data: datos,
				dataType: 'text',
				async: true,
				beforeSend: function(data) { },
				complete: function(data) { },
				success: function(data) {
					data = CleanResponseData(data);
					if(WF_DEBUG_AJAX_DATA)
						console.info('getSaleOrderData return.data',data);
					
					var general = "<dl class=\"dlagsmin\">\
					  <dt>Sale Order</dt><dd>"+data.name+"</dd>\
					  <dt>Type</dt><dd>"+data.tt_type.text+"</dd>\
					  <dt>Sales Rep.</dt><dd>"+data.sales_rep.text+"</dd>\
					  <dt>Project Manager</dt><dd>"+data.project_manager.text+"</dd>\
					  <dt>Provisioning Engineer</dt><dd>"+data.provision_engineer.text+"</dd>\
					</dl>";
					general += "<hr>";
					general += "<dl class=\"dlagsmin\">\
						  <dt>Primary Contact</dt><dd>"+data.contact_pri.text+
						  "<br/><a href=\"mailto:"+data.contact_pri.email+"?Subject="+(data.name).replace(/ /g,"%20")+"%20"+(data.tt_type.text).replace(/ /g,"%20")+"\">"+data.contact_pri.email+"</a>"+
						  "<br/>"+data.contact_pri.phone+"</dd>\
						  <dt>Tech Contact</dt><dd>"+data.contact_tech.text+
						  "<br/><a href=\"mailto:"+data.contact_tech.email+"?Subject="+(data.name).replace(/ /g,"%20")+"%20"+(data.tt_type.text).replace(/ /g,"%20")+"\">"+data.contact_tech.email+"</a>"+
						  "<br/>"+data.contact_tech.phone+"</dd>\
						  <dt>Billing Contact</dt><dd>"+data.contact_bill.text+
						  "<br/><a href=\"mailto:"+data.contact_bill.email+"?Subject="+(data.name).replace(/ /g,"%20")+"%20"+(data.tt_type.text).replace(/ /g,"%20")+"\">"+data.contact_bill.email+"</a>"+
						  "<br/>"+data.contact_bill.phone+"</dd>\
						</dl>";
					
					LeirAGS_Encoder.EncodeType = "entity";
					var sow_value = LeirAGS_Encoder.htmlDecode( data.opp_scopeofwork );
					var esow_value = LeirAGS_Encoder.htmlDecode( data.opp_scopeofwork_eng );
					var ccm_value = (data.comercial_cond).replace(/(?:\r\n|\r|\n)/g, '<br />');
					var pm_notes = (data.project_manager_notes).replace(/(?:\r\n|\r|\n)/g, '<br />');
					
					Current_Eng_Scope_Work.soid = data.id;
					Current_Eng_Scope_Work.esow = esow_value; //-- data.opp_scopeofwork_eng;
					Current_Eng_Scope_Work.sow = sow_value; //-- data.opp_scopeofwork_eng;
					
					var sow = '<p>'+ccm_value+'</p>' + '<label>Project Manager Notes:</label><p>'+pm_notes+'</p>'+ '<hr><p>'+sow_value+'</p><br>.';
					var sowe = '<div id="Current_Eng_Scope_Work_Element"><p>'+esow_value+'</p></div>' + '<label>Provisioning Notes:</label><p>'+data.provision_notes+'</p>';
					var verizon = '';
					
					if (data.use_verizon && data.vrz_order_num) {
						verizon = '<div class="panel panel-default"><div class="panel-heading">Verizon Data</div><div class="panel-body"><ul>'+
						'<li>Order number: <b>'+data.vrz_order_num+'</b></li>'+
						'<li>Circuit ID: <b>'+data.vrz_circuit_id+'</b></li>'+
						'<li>NNI ID: <b>'+data.vrz_nni_id+'</b></li>'+
						'<li>End Customer name: <b>'+data.vrz_end_customer+'</b></li>'+
						'<li>FOC Date: <b>'+data.vrz_foc_date+'</b></li>'+
						'<li>Bandwith: <b>'+data.vrz_bw+'</b></li>'+
						'</ul></div></div>';
						
						general += verizon;
					}
					
					// Pre-set height to 1px auto.
					$('#sodata-general').css('height', 'auto');
					$('#sodata-sow').css('height', 'auto');
					$('#sodata-sowe').css('height', 'auto');
					
					$('#sodata-general').html(general);
					$('#sodata-sow').html(sow);
					$('#sodata-sowe').html(sowe);
					
					// Try fix height on three 
					var hg1 = $('#sodata-general').outerHeight();
					var hg2 = $('#sodata-sow').outerHeight();
					var hg3 = $('#sodata-sowe').outerHeight();
					var hg4 = 0;
					
					hg4 = (hg1 > hg2) ? hg1 : hg2;
					hg4 = (hg3 > hg4) ? hg3 : hg4;
					hg4 = (hg4 > 460) ? 460 : hg4;
					
					$('#sodata-general').css('height', hg4);
					$('#sodata-sow').css('height', hg4);
					$('#sodata-sowe').css('height', hg4);
					
					$('#sodata-general').css('overflow-y', 'auto');
					$('#sodata-sow').css('overflow-y', 'auto');
					$('#sodata-sowe').css('overflow-y', 'auto');
					
					// Set Fields to Upload Files Form ad Comments...
					$('#leirags_fileup_so').val(soid);
					$('#leirags_fileup_soname').val( data.name );
					
					//-----
					//--- NetWork Design --- 
					var opp_id = data.opportunity.value;
					var opp_title = data.opportunity.text;
					
					setTimeout( getNetWorkDesignAll(soid, opp_id, opp_title) ,200);
					
				},
				error: function(e) {
					alert("Error on NetSuite Call getSaleOrderData");
					console.error("Error on NetSuite Call getSaleOrderData()",e);
				}
			});
		}
		
		// * ------------------------
		
		function getNetWorkDesignAll(so_id, opp_id, opp_title) {
			
			var dest_urls = {
					SANDBOX: 	'/app/common/custom/custrecordentry.nl?rectype=942&id=',
					PRODUCTION: '/app/common/custom/custrecordentry.nl?rectype=816&id='
			};
			
			// Clear current data
			$('#nddata-presale').html('loading...');
			$('#nddata-postsale').html('loading...');
			
			getSONetWorkDesign(so_id,0, function(ND_Post_Sale){
				var pts = '';
				if (ND_Post_Sale.length) {
					ND_Post_Sale.forEach(function(ndpts){
						pts += '<dl class=\"dlagsmin\">';
						pts += '<dt>Name</dt><dd><a href="'+dest_urls[WorkForce_Obj.Env]+ndpts['internalid']+'" target="_blank">'+ndpts['name']+'</a></dd>';
						pts += '<dt>Completed</dt><dd>'+ndpts['completed']+'</dd>';
						pts += '<dt>Completed By</dt><dd>'+ndpts['completed_by_txt']+'</dd>';
						pts += '<dt>Completed On</dt><dd>'+ndpts['completed_on']+'</dd>';
						pts += '<dt>Completed Status</dt><dd>'+ndpts['completion_status_txt']+'</dd>';
						pts += '<dt>Probability</dt><dd>'+ndpts['probability']+'</dd>';
						pts += '<dt>Requested By</dt><dd>'+ndpts['requested_by_txt']+'</dd>';
						pts += '<dt>Requested On</dt><dd>'+ndpts['requested_on']+'</dd>';
						pts += '<dt>SE Requested</dt><dd>'+ndpts['se_requested_reason']+'</dd>';
						pts += '<dt>last mile type</dt><dd>'+ndpts['last_mile_type']+'</dd>';
						pts += '<dt>Expected Close</dt><dd>'+ndpts['expectedclose']+'</dd>';
						pts += '<dt>Assigned</dt><dd>'+ndpts['assigned_txt']+'</dd>';
						//pts += '<dt>Sales SOW</dt><dd>'+ LeirAGS_Encoder.htmlDecode(  ndpts['sales_scope_of_work'] )+'</dd>';
						
						if (ndpts['escalated']) {
							pts += '<dt>Escalated</dt><dd>'+ndpts['escalated']+'</dd>';
							pts += '<dt>Escalated On</dt><dd>'+ndpts['esc_date']+'</dd>';
							pts += '<dt>Escalated Completed</dt><dd>'+ndpts['esc_completed']+'</dd>';
							pts += '<dt>Escalated Completed On</dt><dd>'+ndpts['esc_completed_on']+'</dd>';
						}
						pts += '</dl><hr>';
						//pts += '<p>Sales SOW</p><div style="width:99%; overflow:overlay">'+ LeirAGS_Encoder.htmlDecode(  ndpts['sales_scope_of_work'] )+'</div><hr>';
					});
					
				} else {
					pts = 'No NetWork Design Post Sale, record found.'
				}
				$('#nddata-postsale').html(pts);
			});
			
			getSONetWorkDesign(0, opp_id, function(ND_Pre_Sale){
				var pts = '';
				if (ND_Pre_Sale.length) {
					ND_Pre_Sale.forEach(function(ndpts){
						pts += '<dl class=\"dlagsmin\">';
						pts += '<dt>Name</dt><dd><a href="'+dest_urls[WorkForce_Obj.Env]+ndpts['internalid']+'" target="_blank">'+ndpts['name']+'</a></dd>';
						pts += '<dt>Completed</dt><dd>'+ndpts['completed']+'</dd>';
						pts += '<dt>Completed By</dt><dd>'+ndpts['completed_by_txt']+'</dd>';
						pts += '<dt>Completed On</dt><dd>'+ndpts['completed_on']+'</dd>';
						pts += '<dt>Completed Status</dt><dd>'+ndpts['completion_status_txt']+'</dd>';
						pts += '<dt>Probability</dt><dd>'+ndpts['probability']+'</dd>';
						pts += '<dt>Requested By</dt><dd>'+ndpts['requested_by_txt']+'</dd>';
						pts += '<dt>Requested On</dt><dd>'+ndpts['requested_on']+'</dd>';
						pts += '<dt>SE Requested</dt><dd>'+ndpts['se_requested_reason']+'</dd>';
						pts += '<dt>last mile type</dt><dd>'+ndpts['last_mile_type']+'</dd>';
						pts += '<dt>Expected Close</dt><dd>'+ndpts['expectedclose']+'</dd>';
						pts += '<dt>Assigned</dt><dd>'+ndpts['assigned_txt']+'</dd>';
						//pts += '<dt>Sales SOW</dt><dd>'+ LeirAGS_Encoder.htmlDecode(  ndpts['sales_scope_of_work'] )+'</dd>';
						
						if (ndpts['escalated']) {
							pts += '<dt>Escalated</dt><dd>'+ndpts['escalated']+'</dd>';
							pts += '<dt>Escalated On</dt><dd>'+ndpts['esc_date']+'</dd>';
							pts += '<dt>Escalated Completed</dt><dd>'+ndpts['esc_completed']+'</dd>';
							pts += '<dt>Escalated Completed On</dt><dd>'+ndpts['esc_completed_on']+'</dd>';
						}
						
						pts += '</dl><hr>';
						//pts += '<p>Sales SOW</p><div style="width:99%; overflow:overlay">'+ LeirAGS_Encoder.htmlDecode(  ndpts['sales_scope_of_work'] )+'</div><hr>';
					});
				}else {
					pts = 'No NetWork Design PreSale, record found.'
				}
				$('#nddata-presale').html(pts);
			});
			
		}
		
		
		function getSONetWorkDesign(soid,opid, callback){
			if (WF_DEBUG)
				console.info('getSONetWorkDesign(soid)', soid, opid);
			
			var datos = {
					'action': 'getSONetWorkDesign',
					'idSO' : 0,
					'idOP' : 0,
				};
			
			if (soid) 
				datos['idSO'] = soid;
			else if (opid)
				datos['idOP'] = opid;
			
			var results = [];
			
			if (WF_DEBUG_AJAX)
				console.info('getSONetWorkDesign','getSONetWorkDesign .RT', datos );
				
			mirrorLog('getSONetWorkDesign','getSONetWorkDesign .RT', datos );

			$.ajax({
				url: getUrl().RT,
				data: datos,
				dataType: 'text',
				async: true,
				beforeSend: function(data) { },
				complete: function(data) { },
				success: function(data) {
					results = CleanResponseData(data);
					if(WF_DEBUG_AJAX_DATA)
						console.info('getSONetWorkDesign results',results);
					if (callback && typeof callback == 'function')
						callback(results);
					//-----
				},
				error: function(e) {
					alert("Error on NetSuite Call getSONetWorkDesign");
					console.error("Error on NetSuite Call getSONetWorkDesign()",e);
				}
			});
		}
		
//---getPredesesorsBranch>
		function getPredesesorsBranch(taskId, show) {
			//var taskId = $(elem).attr('data-taskid');
// 			if (WF_DEBUG)
// 				debugger;
			
			if (WF_DEBUG)
				console.info("getPredesesorsBranch(idTask)", taskId);
			
			var datos = {
				'action': 'getPredesesorsBranch',
				'WhichTask': taskId,
				'resultAs': 'details',
			};
			
			if (WF_DEBUG_AJAX)
				console.info('getPredesesorsBranch',"getPredesesorsBranch .RT2", datos);
			
			mirrorLog('getPredesesorsBranch','getPredesesorsBranch .RT2', datos ); 
			
			var obstruct = true;
			
			$.ajax({
				url: getUrl().RT2,
				data: datos,
				async: false,
				dataType: 'text',
				beforeSend: function(data) {
				},
				success: function(data) {
					Branch_review = CleanResponseData(data);
					if(WF_DEBUG_AJAX_DATA)
						console.info('getPredesesorsBranch results:',results);	
					loaderEnd();
					
					if(show)
						showBranchDependency(taskId, Branch_review);
					else 
						obstruct = parseDependency(Branch_review);
				},
				error: function(err) {
					loaderEnd();
					//-alert('Error on NetSuite call');
					console.error('Error on NetSuite call getPredesesorsBranch', err);
					return false; // If cannot read cannot update.
				}
			});
			
			return obstruct;
		} // End getPredesesorsBranch
//---getPredesesorsBranch<


//---getSuccessorsBranch>
		function getSuccessorsBranch(taskId, show) {
// 			if (WF_DEBUG)
// 				debugger;
			
			if (WF_DEBUG)
				console.info("getSuccessorsBranch(idTask)", taskId);
			
			var datos = {
				'action': 'getSuccessorsBranch',
				'WhichTask': taskId,
				'resultAs': 'details',
			};
			
			if (WF_DEBUG_AJAX)
				console.info('getSuccessorsBranch',"getSuccessorsBranch .RT2", datos);

			mirrorLog('getSuccessorsBranch','getSuccessorsBranch .RT2', datos ); 
			
			$.ajax({
				url: getUrl().RT2,
				data: datos,
				async: false,
				dataType: 'text',
				beforeSend: function(data) {
				},
				success: function(data) {
					Branch_Succ_review = CleanResponseData(data);
					if(WF_DEBUG_AJAX_DATA)
						console.info('getSuccessorsBranch results:',Branch_Succ_review);	
					loaderEnd();
					if(show)
						showBranchDependencySuccessor(taskId, Branch_Succ_review); 
				},
				error: function(err) {
					loaderEnd();
					//-alert('Error on NetSuite call');
					console.error('Error on NetSuite call getPredesesorsBranch', err);
					return false; // If cannot read cannot update.
				}
			});
			return true;
		} // End getSuccessorsBranch
//---getSuccessorsBranch<


//---showBranchDependencySuccessor>
	function showBranchDependencySuccessorLarge(taskId, branch){
		if(! Object.keys(branch).length) return;
		var cont = '';
		var tmpl_row = '<tr data-taskid="{{idTask}}" {{css_class}}><td>{{process_n}}-{{subprocess_n}}</td><td>{{title}}</td><td>{{status}}</td><td>{{dependency}}</td><td>{{branch_lvl}}</td><td>{{obstruct}}</td><td>{{assigned_n}}</td><td>{{startdate}}</td><td>{{duedate}}</td><td>{{duration}}</td></tr>';
		var tmpl_head = '<table class="table table-striped table-bordered" id="whynot">\
			<tr class="success"><th>TP-SP</th><th>Task</th><th>Status</th><th>Dependency</th><th>Level</th><th>Reactive</th><th>Assignee</th><th>Start</th><th>Due</th><th>Duration</th></tr>';
		var tmpl_foot = '</table>';
		var tmpl_foot2 = '<ul>\
		<li><span class="label" style="background:#6E6"> &nbsp; </span> - Task evaluated </li>\
		<li><span class="label label-info"> &nbsp; </span> - Successor branch start</li>\
		<li><span class="label label-default"> Level </span> - Number of tasks to complete the process</li>\
		</ul>';
		branch.forEach(function(btsk){
			var row = tmpl_row;
			btsk['css_class'] = (btsk['branch_lvl'] == '1')? 'class="info"' : ((btsk['branch_lvl'] == '0')? 'style="background:#6E6"' : '');
			btsk['obstruct'] = ((btsk['branch_lvl'] == '0')? 'Current' : (btsk['status'] !== 'Active') ? '<p class="label label-danger">Yes</p>' : '<p class="label label-info">No</p>');
			var keys = getVarsObject(btsk);
			keys.forEach(function(key){
				var rgx = new RegExp('{{'+key+'}}','gi');
				row = row.replace(rgx, btsk[key] );
			});
			cont += row;
		});
		cont = tmpl_head + cont + tmpl_foot + tmpl_foot2;
		$('#whynextTable').html(cont);
		$('#whynextTab').show();
		jQScrollTo('whynextTable');
		
		getSuccessorsBranchTreeFlare(taskId,true);
	}
	
	function showBranchDependencySuccessor(taskId, branch){
		showBranchDependencySuccessorLarge(taskId, branch);
		return;
		if(! Object.keys(branch).length) return;
		var cont = '';
		var tmpl_row = '<tr data-taskid="{{idTask}}" {{css_class}}><td>{{title}}</td><td>{{status}}</td><td>{{dependency}}</td><td>{{branch_lvl}}</td><td>{{obstruct}}</td><td>{{assigned_n}}</td></tr>';
		var tmpl_head = '<table class="table table-striped table-bordered" id="whynot">\
			<tr class="success"><th>Task</th><th>Status</th><th>Dependency</th><th>Level</th><th>Reactive</th><th>Assigned</th></tr>';
		var tmpl_foot = '</table>';
		var tmpl_foot2 = '<ul>\
		<li><span class="label" style="background:#6E6"> &nbsp; </span> - Task evaluated </li>\
		<li><span class="label label-info"> &nbsp; </span> - Successor branch start</li>\
		<li><span class="label label-default"> Level </span> - Number of tasks to complete the process</li>\
		</ul>';
		branch.forEach(function(btsk){
			var row = tmpl_row;
			btsk['css_class'] = (btsk['branch_lvl'] == '1')? 'class="info"' : ((btsk['branch_lvl'] == '0')? 'style="background:#6E6"' : '');
			btsk['obstruct'] = ((btsk['branch_lvl'] == '0')? 'Current' : (btsk['status'] !== 'Active') ? '<p class="label label-danger">Yes</p>' : '<p class="label label-info">No</p>');
			var keys = getVarsObject(btsk);
			keys.forEach(function(key){
				var rgx = new RegExp('{{'+key+'}}','gi');
				row = row.replace( rgx, btsk[key] );
			});
			cont += row;
		});
		cont = tmpl_head + cont + tmpl_foot + tmpl_foot2;
		$('#whynextTable').html(cont);
		$('#whynextTab').show();
		jQScrollTo('whynextTable');
		
		getSuccessorsBranchTreeFlare(taskId,true);
	}
//---showBranchDependencySuccessor<


	var WF_Corrections_Tasks = {};

//---showCorrectionsTasksStartDate>
	function showCorrectionsTasksStartDate(DataTasks){
		if(! Object.keys(DataTasks).length) return;
		
		//console.info(data.Tasks); 
		var rowH = '<h5>';
		rowH += '</h5>';
		
		var rows = '<table id="corrections-table" class="table table-striped table-hover table-bordered">';
		rows += '<thead>';
		rows += '<tr>'+
		'<th style="width:64px"></th>'+
		'<th style="width:96px">SO</th>'+
		'<th>Task</th>'+
		'<th>Assigned</th>'+
		'<th colspan=3>Actual</th>'+
		'<th colspan=3>Planned</th>'+
		'<th>Ack</th>'+
		'<th>Process</th>'+
		'<th>Status</th>'+
		'</tr>';
		rows += '</thead>';
		rows += '<tbody>';
		var rn = 0;
		for(var idx in DataTasks.rrows.tasks){
			tsk = DataTasks.rrows.tasks[idx];
			rows += '<tr data-tracingobj=\''+idx+'\'>'+ 
			'<td><a href="#ags_popup1" onClick="showPopUpTaskData(this, true)"><i class="glyphicon glyphicon-question-sign text-info task-info-pov" aria-hidden="true"></i></a><span class="pull-right">'+(++rn)+'</span></td>'+
			'<td class="overpointer">'+DataTasks.rrows.salesorders[tsk.SalesOrder]['label']+'<i class="glyphicon glyphicon-folder-open pull-right" aria-hidden="true" style="display:none"></i></td>'+
			'<td class="overpointer">'+tsk.Title+'<i class="glyphicon glyphicon-open-file pull-right" aria-hidden="true" style="display:none"></i></td>'+
			'<td>'+DataTasks.rrows.assigned[tsk.Assigned]+'</td>'+
			'<td>'+tsk.StartDate+'</td><td>'+tsk.DueDate+'</td><td>'+tsk.Duration+'</td>'+
			'<td>'+tsk.start_p+'</td><td>'+tsk.due_p+'</td><td>'+tsk.duration_p+'</td>'+
			'<td>'+tsk.Ack+'</td><td>'+tsk.process+'</td>'+
			'<td>'+WF_G_TaskStatus[tsk.Status]+'</td>'+
			'</tr>';
		};
		rows += '</tbody>';
		rows += '</table>';
		
		$('#correctionsTable').html( rowH + rows );
		$('#correctionsTab').show();
		jQScrollTo('correctionsTable');
	}
//---showCorrectionsTasksStartDate>

//---getCorrectionsTasksStartDate>
	function getCorrectionsTasksStartDate() {	
		if (WF_DEBUG)
			console.info("getCorrectionsTasksStartDate()");
		
		var datos = {
			'action': 'getTaskCompletedDurationOne',
			'resultAs': 'details',
		};
		
		if (WF_DEBUG_AJAX)
			console.info('getCorrectionsTasksStartDate',"getTaskCompletedDurationOne .RT2", datos);

		mirrorLog('getCorrectionsTasksStartDate','getTaskCompletedDurationOne .RT2', datos ); 
		
		$.ajax({
			url: getUrl().RT2,
			data: datos,
			async: false,
			dataType: 'text',
			beforeSend: function(data) { },
			success: function(data) {
				WF_Corrections_Tasks = CleanResponseData(data);
				if(WF_DEBUG_AJAX_DATA)
					console.info('getCorrectionsTasksStartDate results:',WF_Corrections_Tasks);	
				loaderEnd();
				showCorrectionsTasksStartDate( WF_Corrections_Tasks ); 
			},
			error: function(err) {
				loaderEnd();
				//-alert('Error on NetSuite call');
				console.error('Error on NetSuite call getCorrectionsTasksStartDate', err);
				return false; // If cannot read cannot update.
			}
		});
		return true;
	} // End getCorrectionsTasksStartDate
//---getCorrectionsTasksStartDate<
	
	
//---processCorrectionsTasks>
	var processCorrectionsTasks_stop = false;
	
	var Process_Up = 0;
	var Process_Down = 0;
	
	function processCorrectionsTasks(DataTasks,changesOnly){
		if(! Object.keys(DataTasks).length) return;
		processCorrectionsTasks_stop = false;
		console.info('to stop write','processCorrectionsTasks_stop = true;');
		changesOnly = (changesOnly != undefined)? changesOnly : false;
		
		$('#correctionsTab').show();
		$('#correctionsTable').html('Processing...'+ (new Date()).toString() );
		
		var rowH = '<h5></h5>';
		
		var rowsF = '<table id="corrections-table" class="table table-striped table-hover table-bordered">';
		rowsF += '<thead>';
		rowsF += '<tr>'+
		'<th style="width:64px" rowspan=2></th>'+
		'<th style="width:96px" rowspan=2>SO</th>'+
		'<th rowspan=2>Task</th>'+
		'<th rowspan=2>Assigned<br><small>NetSuite Link</small></th>'+
		'<th colspan=3>Actual</th>'+
		'<th colspan=3>Planned</th>'+
		'<th rowspan=2>Ack</th>'+
		'<th rowspan=2>Status</th>'+
		'<th rowspan=2>ID</th>'+
		'</tr>';
		rowsF += '<tr><td>Start</td><td>Due</td><td>Days</td><td>Start</td><td>Due</td><td>Days</td></tr>'
		rowsF += '</thead>';
		rowsF += '<tbody></tbody></table>';
		
		var tasksIds = [], pred_s = {}, rows='';
		
		for(var idx in DataTasks.rrows.tasks){
			tasksIds.push(DataTasks.rrows.tasks[idx].id);
		}
		console.info('Task count ', tasksIds.length );
		if (tasksIds.length > 0) {
			pred_s = getPredecessorsMulti(JSON.stringify(tasksIds));
			console.info(pred_s);
		}
		
		$('#correctionsTable').html(rowsF);
		rowsF = '';
		
		Process_Up = 0;
		Process_Down = 0;
		
			var rn = 0, em=true, cn=0;
			loaderStart();
			
			function processOneTask(){
				rn++;
				var taskChg = false;
				var tsk = WF_Corrections_Tasks.rrows.tasks[rn];
				var newDates = '';
				//debugger
				var rows = '';
				var em = true;
				var applyLink = '';
				var tid = 'T'+tsk.id, pred = (! pred_s[tid]) ? [] : pred_s[tid];
				//console.info('Processing task id '+tid);
				if (pred.length) {
					pred.forEach(function(pd){
						var nextDay = '', newDates='', applyLink='', eneDays=0;
						if (em) {
							var oldStart = StringNetsuiteDateToDate( tsk.StartDate );
							var oldDue = StringNetsuiteDateToDate( tsk.DueDate );
							var WonW = tsk.WorkWeekend;
							switch (pd.dependency_type) {
							case 'FinishToStart':
								nextDay = LeirAGS_dates.nextWrkDay( StringNetsuiteDateToDate( pd.duedate ) );
								eneDays = LeirAGS_dates.compare(oldStart.getTime(), nextDay.getTime() );
								if (eneDays != 0) {
									var newDurationDays = LeirAGS_dates.diffWrkDays(nextDay.getTime(), oldDue.getTime(), WonW);
									newDates = '<table class="table"><tbody>'+
										'<tr><td>New Start:</td><td><b>'+ dateToStringNetsuite( nextDay )+'</b></td></tr>'+
										'<tr><td>Cur Due:</td><td><b>'+ dateToStringNetsuite( oldDue ) + '</b></td></tr>'+
										'<tr><td>New Days:</td><td><b>'+newDurationDays+'</b> </td></tr>'+
										'</tbody></table>';
									if (newDurationDays > 0) {
										// We can change when newdur is positve...
										applyLink='<span class="label label-info apply-correction" '+
											'data-tsk_id="'+tsk.id+'" data-tsk_duration="'+newDurationDays+
											'" data-tsk_date_s="'+dateToStringNetsuite( nextDay )+
											'" data-tsk_date_d="'+dateToStringNetsuite( oldDue )+
											'" data-tsk_so="'+WF_Corrections_Tasks.rrows.salesorders[tsk.SalesOrder]['id']+
											'" >Apply</label>';
									} else {
										if (newDurationDays == -1) {
											newDates = '<table class="table"><tbody>'+
											'<tr><td>New Start:</td><td><b>'+ dateToStringNetsuite( nextDay )+'</b></td></tr>'+
											'<tr><td>New Due:</td><td><b>'+ dateToStringNetsuite( nextDay )+'</b></td></tr>'+
											'<tr><td>New Days:</td><td><b>'+newDurationDays+'</b> => 1</td></tr>'+
											'</tbody></table>';
											// Fix the duedate to be the same as StartDate.
											applyLink='<span class="label label-success apply-correction" '+
											'data-tsk_id="'+tsk.id+'" data-tsk_duration="1'+
											'" data-tsk_date_s="'+dateToStringNetsuite( nextDay )+
											'" data-tsk_date_d="'+dateToStringNetsuite( nextDay )+
											'" data-tsk_so="'+WF_Corrections_Tasks.rrows.salesorders[tsk.SalesOrder]['id']+
											'" >Apply</label>';
										} else {
											// Cannot apply changes... yet.
											applyLink='<span class="label label-danger apply-correction-void" '+
											'data-tsk_id="'+tsk.id+'" data-tsk_duration="'+newDurationDays+
											'" data-tsk_date_s="'+dateToStringNetsuite( nextDay )+
											'" data-tsk_date_d="'+dateToStringNetsuite( oldDue )+
											'" data-tsk_so="'+WF_Corrections_Tasks.rrows.salesorders[tsk.SalesOrder]['id']+
											'" >Void</label>';
										}
									}
									taskChg = true; 
								} else
									newDates = '-Same FTS-';
								break;
							case 'StartToStart':
								nextDay = StringNetsuiteDateToDate( pd.startdate );
								eneDays = LeirAGS_dates.compare(oldStart.getTime(), nextDay.getTime() );
								if (eneDays != 0) {
									var newDurationDays = LeirAGS_dates.diffWrkDays(nextDay.getTime(), oldDue.getTime(), WonW);
									newDates = '<table class="table"><tbody>'+
										'<tr><td>New Start:</td><td><b>'+ dateToStringNetsuite( nextDay )+'</b></td></tr>'+
										'<tr><td>Cur Due:  </td><td><b>'+ dateToStringNetsuite( oldDue )+'</b></td></tr>'+
										'<tr><td>New Days: </td><td><b>'+newDurationDays+'</b></td></tr>'+
										'</tbody></table>';
									applyLink='<span class="label label-info apply-correction">Apply</label>';
									taskChg = true;
								} else
									newDates = '-Same STS-';
								break;
 							default:
									newDates = '...';
								break;
							}
							em = false;
						rows += '<tr>'+
						'<td></td>'+
						'<td>'+pd.dependency_type+'</td>'+
						'<td>'+pd.title+'</td>'+
						'<td>'+pd.assigned+'</td>'+
						'<td>'+pd.startdate+'</td>'+
						'<td>'+pd.duedate+'</td>'+
						'<td>'+pd.duration+'</td>'+
						'<td colspan=3 '+((newDates)?'class="danger"':'')+'>'+newDates+'</td>'+
						'<td>'+applyLink+'</td>'+
						'<td>'+pd.status+'</td>'+
						'<td>'+pd.idTask+'</td></tr>';
						}
					});
				} else {
					rows += '<tr><td></td><td></td><td colspan="11">Not Predecessor</td>';
				}
				if (!changesOnly || ((changesOnly==true) && taskChg) ) {
					if (rn < 100) {
						console.info('row ',rn);
						console.info('task',tsk)
					}
					rows += '<tr data-tracingobj="'+rn+'" class="success">'+ 
					'<td><a href="#ags_popup1" onClick="showPopUpTaskData(this, true)"><i class="glyphicon glyphicon-question-sign text-info task-info-pov" aria-hidden="true"></i></a><span class="pull-right">*numrow*</span></td>'+
					'<td class="overpointer">'+WF_Corrections_Tasks.rrows.salesorders[tsk.SalesOrder]['label']+'<i class="glyphicon glyphicon-folder-open pull-right" aria-hidden="true" style="display:none"></i></td>'+
					'<td class="overpointer">'+tsk.Title+'<i class="glyphicon glyphicon-open-file pull-right" aria-hidden="true" style="display:none"></i></td>'+
					'<td><a href="/app/crm/calendar/task.nl?id='+tsk.id+'" target="_blank" title="Open in NetSuite">'+WF_Corrections_Tasks.rrows.assigned[tsk.Assigned]+'</a></td>'+
					'<td>'+tsk.StartDate+'</td>'+
					'<td>'+tsk.DueDate+'</td>'+
					'<td>'+tsk.Duration+' '+((tsk.WorkWeekend)?'WoW':'')+'</td>'+
					'<td>'+tsk.start_p+'</td>'+
					'<td>'+tsk.due_p+'</td>'+
					'<td>'+tsk.duration_p+'</td>'+
					'<td>'+tsk.Ack+'</td>'+
					'<td>'+WF_G_TaskStatus[tsk.Status]+'</td>'+
					'<td>'+tsk.id+'</td>'+
					'</tr>';
					cn++;
					rows = rows.replace('*numrow*',cn);
					$('#correctionsTable tbody').append( rows );
				}
				// Scroll each 10 rows
				if((rn % 10) == 0) {
					console.info('Processing...',rn,' added ', cn);
					pausecomp(7);
					window.scrollTo(0,document.body.scrollHeight);
				}
				Process_Down++; 
			}
			
			for(var idx in DataTasks.rrows.tasks){
				
				if (processCorrectionsTasks_stop || rn > 2100) break; // try to go away as soon is posible...
				
				if (Process_Up < 300) {
					Process_Up++;
					setTimeout(function(){ processOneTask() }, 1);
				}
			}
			
			ProcessingInterval = setInterval( function() {
				if (Process_Up == Process_Down) {
					clearInterval(ProcessingInterval);
					ProcessingInterval = null
					//$('#correctionsTable tbody').append( rowsF );
					$('#correctionsTab').show();
					jQScrollTo('correctionsTable');
					$('.apply-correction').on('click',function(){
						console.info('Click in apply-correction');
						//var $tr = $(this).closest('tr')[0];
						var $td = $(this).closest('td')[0];
						var correct_data = $(this).data();
						console.info('Correct data', correct_data, 'testing : false');
						updateTaskOnly(correct_data, true , false);
						$($td).html('Submited');
					});
					console.info('Continue to process by hand...')
					loaderEnd();
				} else
					console.info('Waiting...')
			}, 100 );
			
	}
//---showCorrectionsTasksStartDate<
	
//---showCorrectionsTasksStartDateOLD>
	function processCorrectionsTasksOLD(DataTasks,changesOnly){
		if(! Object.keys(DataTasks).length) return;
		processCorrectionsTasks_stop = false;
		console.info('to stop write','processCorrectionsTasks_stop = true;');
		changesOnly = (changesOnly != undefined)? changesOnly : false;
		
		$('#correctionsTable').html('Processing...'+ (new Date()).toString() );
		
		var rowH = '<h5>';
		rowH += '</h5>';
		
		var rowsF = '<table id="corrections-table" class="table table-striped table-hover table-bordered">';
		rowsF += '<thead>';
		rowsF += '<tr>'+
		'<th style="width:64px" rowspan=2></th>'+
		'<th style="width:96px" rowspan=2>SO</th>'+
		'<th rowspan=2>Task</th>'+
		'<th rowspan=2>Assigned<br><small>NetSuite Link</small></th>'+
		'<th colspan=3>Actual</th>'+
		'<th colspan=3>Planned</th>'+
		'<th rowspan=2>Ack</th>'+
		'<th rowspan=2>Status</th>'+
		'<th rowspan=2>ID</th>'+
		'</tr>';
		rowsF += '<tr><td>Start</td><td>Due</td><td>Days</td><td>Start</td><td>Due</td><td>Days</td></tr>'
		rowsF += '</thead>';
		rowsF += '<tbody>';
		
		var tasksIds = [], pred_s = {}, rows='';
		
		for(var idx in DataTasks.rrows.tasks){
			tasksIds.push(DataTasks.rrows.tasks[idx].id);
		}
		console.info('Task count ', tasksIds.length );
		if (tasksIds.length > 0) {
			pred_s = getPredecessorsMulti(JSON.stringify(tasksIds));
			//console.info(pred_s);
		}
		//setTimeout( function(){
			var rn = 0, em=true, cn=0;
			var taskChg=true;
			loaderStart();
			for(var idx in DataTasks.rrows.tasks){
				if (processCorrectionsTasks_stop || rn > 2100) break; // try to go away as soon is posible...
				var tsk = DataTasks.rrows.tasks[idx];
				taskChg = false; rn++;
				rows = '<tr data-tracingobj="'+idx+'" class="success">'+ 
				'<td><a href="#ags_popup1" onClick="showPopUpTaskData(this, true)"><i class="glyphicon glyphicon-question-sign text-info task-info-pov" aria-hidden="true"></i></a><span class="pull-right">*numrow*</span></td>'+
				'<td class="overpointer">'+DataTasks.rrows.salesorders[tsk.SalesOrder]['label']+'<i class="glyphicon glyphicon-folder-open pull-right" aria-hidden="true" style="display:none"></i></td>'+
				'<td class="overpointer">'+tsk.Title+'<i class="glyphicon glyphicon-open-file pull-right" aria-hidden="true" style="display:none"></i></td>'+
				'<td><a href="/app/crm/calendar/task.nl?id='+tsk.id+'" target="_blank" title="Open in NetSuite">'+DataTasks.rrows.assigned[tsk.Assigned]+'</a></td>'+
				'<td>'+tsk.StartDate+'</td><td>'+tsk.DueDate+'</td><td>'+tsk.Duration+' '+((tsk.WorkWeekend)?'WoW':'')+'</td>'+
				'<td>'+tsk.start_p+'</td><td>'+tsk.due_p+'</td><td>'+tsk.duration_p+'</td>'+
				'<td>'+tsk.Ack+'</td><td>'+WF_G_TaskStatus[tsk.Status]+'</td>'+
				'<td>'+tsk.id+'</td>'+
				'</tr>';
				// var pred = getPredecessors(tsk.id);
				var tid = 'T'+tsk.id, pred = (! pred_s[tid]) ? [] : pred_s[tid];
				//console.info('Processing task id '+tid);
				if (pred.length) {
					em = true;
					pred.forEach(function(pd){
						var nextDay = '', newDates='', applyLink='', eneDays=0;
						if (em) {	
							var oldStart = StringNetsuiteDateToDate( tsk.StartDate );
							var oldDue = StringNetsuiteDateToDate( tsk.DueDate );
							var WonW = tsk.WorkWeekend;
							switch (pd.dependency_type) {
							case 'FinishToStart':
								nextDay = LeirAGS_dates.nextWrkDay( pd.duedate );
								eneDays = LeirAGS_dates.compare(oldStart.getTime(), nextDay.getTime() );
								if (eneDays != 0) {
									var newDurationDays = LeirAGS_dates.diffWrkDays(nextDay.getTime(), oldDue.getTime(), WonW);
									newDates = '<table class="table"><tr><td>New Start:</td><td><b>'+ dateToStringNetsuite( nextDay ) + 
										'</b></td></tr><tr><td>Cur Due:</td><td><b>'+ dateToStringNetsuite( oldDue ) + 
										'</b></td></tr><tr><td>New Days:</td><td><b>'+newDurationDays+'</b> </td></tr></table>';
									if (newDurationDays > 0) {
										// We can change when newdur is positve...
										applyLink='<span class="label label-info apply-correction" '+
											'data-tsk_id="'+tsk.id+'" data-tsk_duration="'+newDurationDays+
											'" data-tsk_date_s="'+dateToStringNetsuite( nextDay )+
											'" data-tsk_date_d="'+dateToStringNetsuite( oldDue )+
											'" data-tsk_so="'+DataTasks.rrows.salesorders[tsk.SalesOrder]['id']+
											'" >Apply</label>';
									} else {
										if (newDurationDays == -1) {
											newDates = '<table class="table"><tr><td>New Start:</td><td><b>'+ dateToStringNetsuite( nextDay ) + 
											'</b></td></tr><tr><td>New Due:</td><td><b>'+ dateToStringNetsuite( nextDay ) + 
											'</b></td></tr><tr><td>New Days:</td><td><b>'+newDurationDays+'</b> => 1</td></tr></table>';
											// Fix the duedate to be the same as StartDate.
											applyLink='<span class="label label-success apply-correction" '+
											'data-tsk_id="'+tsk.id+'" data-tsk_duration="1'+
											'" data-tsk_date_s="'+dateToStringNetsuite( nextDay )+
											'" data-tsk_date_d="'+dateToStringNetsuite( nextDay )+
											'" data-tsk_so="'+DataTasks.rrows.salesorders[tsk.SalesOrder]['id']+
											'" >Apply</label>';
										} else {
											// Cannot apply changes... yet.
											applyLink='<span class="label label-danger apply-correction-void" '+
											'data-tsk_id="'+tsk.id+'" data-tsk_duration="'+newDurationDays+
											'" data-tsk_date_s="'+dateToStringNetsuite( nextDay )+
											'" data-tsk_date_d="'+dateToStringNetsuite( oldDue )+
											'" data-tsk_so="'+DataTasks.rrows.salesorders[tsk.SalesOrder]['id']+
											'" >Void</label>';
										}
									}
									taskChg = true; 
								} else
									newDates = '-Same FTS-';
								break;
							case 'StartToStart':
								nextDay = StringNetsuiteDateToDate( pd.startdate );
								eneDays = LeirAGS_dates.compare(oldStart.getTime(), nextDay.getTime() );
								if (eneDays != 0) {
									var newDurationDays = LeirAGS_dates.diffWrkDays(nextDay.getTime(), oldDue.getTime(), WonW);
									newDates = '<table class="table"><tr><td>New Start:</td><td><b>'+ dateToStringNetsuite( nextDay ) + 
										'</b></td></tr><tr><td>Cur Due:</td><td><b>'+ dateToStringNetsuite( oldDue ) + 
										'</b></td></tr><tr><td>New Days:</td><td><b>'+newDurationDays+'</b> </td></tr></table>';
									applyLink='<span class="label label-info apply-correction">Apply</label>';
									taskChg = true;
								} else
									newDates = '-Same STS-';
								break;
 							default:
									newDates = '...';
								break;
							}
							em = !em;
						}
						rows += '<tr><td></td><td>'+pd.dependency_type+'</td><td>'+pd.title+'</td><td>'+pd.assigned+'</td><td>'+pd.startdate+'</td><td>'+pd.duedate+'</td><td>'+pd.duration+'</td>'+
						'<td colspan=3 '+((newDates)?'class="danger"':'')+'>'+newDates+'</td><td>'+applyLink+'</td><td>'+pd.status+'</td><td>'+pd.idTask+'</td></tr>';
					});
				} else {
					rows += '<tr><td></td><td></td><td colspan="11">Not Predecessor</td>';
				}
				
				if (!changesOnly || ((changesOnly==true) && taskChg) ) {
					cn++;
					rows = rows.replace('*numrow*',cn);
					//$('#correctionsTable tbody').append( rows );
					rowsF += rows;
				}
				// Scroll each 10 rows
				if((rn % 10) == 0) {
					//console.info('Processing task id '+tid);
					//window.status="Processing task row : "+rn;
					//window.scrollTo(0,document.body.scrollHeight);
				}
			}
			
			rowsF += '</tbody>';
			rowsF += '</table>';
			
			$('#correctionsTable').html( rowH + rowsF );
			$('#correctionsTab').show();
			jQScrollTo('correctionsTable');
			
			$('.apply-correction').on('click',function(){
				console.info('Click in apply-correction');
				//var $tr = $(this).closest('tr')[0];
				var $td = $(this).closest('td')[0];
				var correct_data = $(this).data();
				console.info('Correct data', correct_data, 'testing : false');
				updateTaskOnly(correct_data, true , false);
				$($td).html('Submited');
			});
			
			loaderEnd();
	}
//---showCorrectionsTasksStartDateOLD>

	
//---updateTaskOnly>
	function updateTaskOnly(values, sendNotifications, testing ) {
			if (WF_DEBUG)
				console.info("updateTaskOnly()", values);
			/*---------
			  Spected Values fields are: 
			  
			 {	tsk_so: 736346, 
			 	tsk_date_d: "03/08/2017", 
			 	tsk_date_s: "02/22/2017", 
			 	tsk_duration: 10, 
			 	tsk_id: 214621
			 	}
			 --------- */
			
			loaderStart();
			
			var taskCurrData = getTaskCurrentData(values.tsk_id)[0];
			
			if (testing) {
				// Set he same values as in taskCurrData
				values2 = {	
					tsk_so: values.tsk_so, 
				 	tsk_date_d: taskCurrData.duedate, 
				 	tsk_date_s: taskCurrData.startdate, 
				 	tsk_duration: taskCurrData.duration, 
				 	tsk_id: values.tsk_id
				 	};
				
				values = values2;
			}
			
			datos = {
				'action'		: "task.change",
				'salesorder'	: values.tsk_so,
				"assigned"		: taskCurrData.assigned,
				"ack"			: true,
				"status"		: taskCurrData.status,
				"id"			: values.tsk_id,
				"duration"		: values.tsk_duration,
				"weekend"		: taskCurrData.wonw,
				"startdate"		: StringNetsuiteDateToDate( values.tsk_date_s ).getTime(),
				"duedate"		: StringNetsuiteDateToDate( values.tsk_date_d ).getTime(),
				"wrikeid"		: taskCurrData.wrikeid,
				"workspace"		: true,
				"D_startdate"	: new Date( StringNetsuiteDateToDate( values.tsk_date_s ).getTime() ),
				"D_duedate"		: new Date( StringNetsuiteDateToDate( values.tsk_date_d ).getTime() ),
			};
				
			if (WORKFORCE_MODE == WF_MODE_TESTING) {
				messager('WARNING','WorkForce Management is in TESTING mode.<br>No updates was sended...')
				console.info('WORKFORCE_MODE is TESTING', datos);
				mirrorLog('TESTING clickdico','Send Data .Common', datos );
				loaderEnd();
				return false; // Dont Save changes...
			}
				
			mirrorLog('updateTaskOnly','Send Data .Common', datos ); 

			if (WF_DEBUG_AJAX)
				console.info('updateTaskOnly',"task.change .Common", datos );

			var Task_Updated_Secund_Pass_2 = [];
			var post_taskid = values.tsk_id;
			
			$.ajax({
				url: getUrl().Common,
				type: 'POST',
				data: datos,
				success: function(data) {
					var need_refresh = false;
					var elParsed = CleanResponseData(data);
					var size = Object.keys(elParsed).length;
					var WhichTasksWillChange = [];
					var Task_Updated_Secund_Pass = [];
					mirrorLog('updateTaskOnly','Secund Pass', elParsed ); 
					for (var key in elParsed) {
						// Protect against inherited properties.
						if (elParsed.hasOwnProperty(key)) {
							if (elParsed[key].updated) {
								// Dijo IVAN, que si venia la misma tarea en esta parte 
								// se ignore este cambio y continue con los demas.
								if (datos.id != elParsed[key].id) {
									Task_Updated_Secund_Pass.push( elParsed[key] );
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
										console.info('updateTaskOnly()',"update .Common-2", otherData );

										mirrorLog('updateTaskOnly()','Update Data .Common-2', otherData ); 
									
									need_refresh = true;
										
									$.ajax({
										url: getUrl().Common,
										type: 'POST',
										data: otherData,
										success: function(data) {
											if (WF_DEBUG)
												console.log("Returned Data step 2 :" + data);
										},
										error: function(err){
											console.log('Error on update step 2',err);
										}
									});
								} // Is diferent from initial
							} // Nedd be updated
						} // if have properties
					} // for all updated needs.
					if(Task_Updated_Secund_Pass.length){
						console.info('List delegated task updated.');
						//console.table(Task_Updated_Secund_Pass);
						//Task_Updated_Secund_Pass_2 = Task_Updated_Secund_Pass;
					} else {
						console.info('No delegated task need be update.');
						Task_Updated_Secund_Pass_2.push('No delegated task need be update.'); 
					}

					loaderEnd();
					
					if (sendNotifications) {
						//console.info(Task_Updated_Secund_Pass_2);
						// Send Message to IVAN and Ariel...
						var Ivan_id = {SANDBOX:21562, PRODUCTION: 21562};
						/*
						var str_A = JSON.stringify(taskCurrData),
							str_B = JSON.stringify(values),
							str_C = JSON.stringify(Task_Updated_Secund_Pass);
						
						var str_A = LeirAGS_cnvObjTable(taskCurrData),
							str_B = LeirAGS_cnvObjTable(values),
							str_C = LeirAGS_cnvObjTable(Task_Updated_Secund_Pass);
							
						var msg =	'Adjust Start Date on Task '+taskCurrData.title+
									'<div><br>Current Data : '+str_A+
									'<br>New Data: '+str_B+
									'<br>Dependency updates: '+str_C+'</div><br>.'; 
									
						*/
						var str_A = '<ul>'+
						'<li>Start Date : '+taskCurrData.startdate+' => <b>'+values.tsk_date_s+'</b></li>'+
						'<li>Due Date : '+taskCurrData.duedate+' => <b>'+values.tsk_date_d+'</b></li>'+
						'<li>Duration : '+taskCurrData.duration+' => <b>'+values.tsk_duration+'</b></li>'+
						'<li>TaskID : '+values.tsk_id+'</li>'+
						'<li>SalesOrder : '+taskCurrData.theSO.tso_label+'</li>'+
						'<li>Customer : '+taskCurrData.theSO.tso_entN+'</li></ul><br>';
						
						var str_B = 'Dependencies: ';
						if(Task_Updated_Secund_Pass.length){
							str_B += '<ul>';
							Task_Updated_Secund_Pass.forEach(function(ut){
								str_B += '<li>Task : '+ut.name+'<br><ul>'+
										 '<li>Task ID: '+ut.id+'</li>'+
										 '<li>Start : '+ut.startDate+' (<b>'+dateToStringNetsuite( new Date(ut.startDate) )+'</b>)</li>'+
										 '<li>Due : '+ut.dueDate+' (<b>'+dateToStringNetsuite( new Date(ut.dueDate) )+'</b>)</li>'+
										 '<li>Duration : '+ut.duration+'</li></ul></li>';
							});
							str_B += '</ul>';
						} else {
							str_B += 'No dependencies updated.';
						}
						var msg =	'Adjust Start Date on Task : '+taskCurrData.title+'<br>'+str_A+str_B;
						
						chatSendMsg (
								values.tsk_id, 
								values.tsk_so, 
								[ Ivan_id[WorkForce_Obj.Env] ], msg, 3 );
					}
					
				},// success
				error: function(err) {
					loaderEnd();
					console.log('updateTaskOnly ajax-error',err);
				} // error
			});
			
			return true;
		}
//---updateTaskOnly<
	
	
	
//---chatSendMsg>
	function chatSendMsg(WhichTask,WhichSalesOrder,to_s,message,mtype){
		// Send Message to IVAN and Ariel...
		var mentions = [];
		// We spect a to_s are users ids.
		if (to_s.length){
			to_s.forEach(function(to){
				var userData = getEmployeeData( to );
				if (userData.employeeId && (WorkForce_Obj.userID != userData.employeeId)) {
					mentions.push({
						name	: userData.employeeName, 
						email	: userData.email, 
						userid	: userData.employeeId 
					});
				}
			})
		}
		mtype = (mtype === undefined) ? 2 : mtype; // 1-Tasks, 2-Chat, 3-Log.
		mtype = (mtype > 3 || mtype < 1) ? 2 : mtype; // Protection. 
		
		// Add message to myself... only if mtype == Task
		if (mtype == 1 || mtype=='Task')
		mentions.push({ 
			name	: WorkForce_Obj.userName, 
			email	: WorkForce_Obj.userEmail, 
			userid	: WorkForce_Obj.userID 
		});
		
		// Call send function
		var datos = {
				'action': 'writeNotification',
				'WhichTask': WhichTask,
				'WhichSalesOrder': WhichSalesOrder,
				'msgType': mtype, // Chat
				'message': message,
				'mentions': JSON.stringify(mentions)
			};
		if (WF_DEBUG_AJAX)
			console.info('chatSendMsg',"writeNotification .RT2", datos);

		mirrorLog('chatSendMsg','writeNotification .RT2', datos ); 
		
		$.ajax({
			url: getUrl().RT2,
			type: 'POST',
			data: datos,
			async: false,
			dataType: 'text',
			beforeSend: function(data) { },
			success: function(data) { },
			error: function(e) { console.error('Error on NetSuite call chatSendMsg', e); }
		});
	}
	
	window.WF_sendMessage = function(to,msg){ 
		/* 
		 * Send Message to User in WorkForce
		 * @param to	(integer) user id, 
		 * @param msg 	(string) 
		 * @return	none
		 * 
		 */ 
			chatSendMsg('','',[to],msg);
			loaderEnd();
		};
//---chatSendMsg<
	

//---showTaskNotesFull>
	function getTaskNotesFull(taskId){
		if (WF_DEBUG)
			console.info("showTaskNotesFull(idTask)", taskId);
		
		var taskCurrData = getTaskCurrentData(taskId)[0];
		
		if ($('#leirags_fileup_so').val() != taskCurrData.soid ) {
			displaySObySpan (taskCurrData.soid, taskCurrData.theSO.tso_label, taskCurrData.theSO.tso_entN );
			clickinSO(taskCurrData.soid);
		}
		
		if(WF_DEBUG) 
			console.info(taskCurrData);
		
		var soname = taskCurrData.soname;
		soname = soname.split('#').pop();
		
		//--Set Data on Form Upload Files an messages...
			$('#leirags_fileup_so').val(taskCurrData.soid);
			$('#leirags_fileup_soname').val( soname );
			$('#leirags_fileup_task').val( taskCurrData.internalid );
			$('#leirags_fileup_tasktitle').val( taskCurrData.title );
			$('#tasktitle_toup').html( taskCurrData.title );
			$('#leirags_fileup_filename').val('');
			$('#task-messages').html('');
			$('#leirags_fileup_assignee').val(taskCurrData.assigned);
			// Set PermaLink..
			var permalink = 'https://system.sandbox.netsuite.com/app/site/hosting/scriptlet.nl?script=1385&deploy=1&gocomm='
			if (WorkForce_Obj.Env != 'SANDBOX'){
				permalink = 'https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=1308&deploy=1&gocomm='
			}
			$('#task-communication > div.col-sm-12 > div.col-sm-3 > h4 > a').attr('href',permalink+taskCurrData.internalid )
		//--

		getTaskNotes(taskId);
		
		jQScrollTo("task-messages");
		
		loaderEnd();
		
	}
//---showTaskNotesFull<



//---showTaskNotes>
	function getTaskNotes(taskId,xso,tsktitle,xelem){
		if (WF_DEBUG)
			console.info("getTaskNotes(idTask)", taskId);
		
		// Setup data of SO for Communication
		if(xso){
			//console.info('xso',xso);
			//console.info('xelem',xelem);
			if(xelem) {
				//window.xelem = xelem;
				var $tr = $(xelem).closest('tr')[0]; // get tr content 
				var tr_data = $($tr).data(); // get data as object
				tr_data.soid = xso;
				//==console.info('xelem',xelem);
				//--console.info('data',tr_data);
				if (! tr_data.soname ) {
					tr_data.soname = $('#NameSalesOrderBySpan').text();
				}
				//--Set Data on Form Upload Files an messages...
					$('#leirags_fileup_so').val(tr_data.soid);
					$('#leirags_fileup_soname').val( tr_data.soname );
					$('#leirags_fileup_task').val( tr_data.id );
					$('#leirags_fileup_tasktitle').val( tsktitle );
					$('#tasktitle_toup').html( tsktitle );
					$('#leirags_fileup_filename').val('');
					$('#task-messages').html('');
					// Set PermaLink..
					var permalink = 'https://system.sandbox.netsuite.com/app/site/hosting/scriptlet.nl?script=1385&deploy=1&gocomm='
					if (WorkForce_Obj.Env != 'SANDBOX'){
						permalink = 'https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=1308&deploy=1&gocomm='
					}
					$('#task-communication > div.col-sm-12 > div.col-sm-3 > h4 > a').attr('href',permalink + tr_data.id )
				//--
			}
		}
			
		// Show communication tab
		$('#task-communication').show();
		
		var datos = {
			'action': 'getTaskNotes',
			'WhichTask': taskId,
		};
		
		if (WF_DEBUG_AJAX)
			console.info('getTaskNotes',"getTaskNotes .RT2", datos);

		
		mirrorLog('getTaskNotes','getTaskNotes .RT2', datos ); 
		
		$.ajax({
			url: getUrl().RT2,
			data: datos,
			async: false,
			dataType: 'text',
			beforeSend: function(data) {
			},
			success: function(data) {
				NotesTask_review = CleanResponseData(data);
				if(WF_DEBUG_AJAX_DATA)
					console.info('getSuccessorsBranch results:',NotesTask_review);	
				loaderEnd();
				displayTaskNotes(NotesTask_review);
			},
			error: function(err) {
				loaderEnd();
				//-alert('Error on NetSuite call');
				console.error('Error on NetSuite call getTaskNotes', err);
				return false; // If cannot read cannot update.
			}
		});
		return true;
	}
	
	function displayTaskNotes(taskNotes){
		$('#task-messages').html(''); // Clear if not have messages.
		if(! taskNotes.length) return;
		var cont = '';
		var tmpl_row = '<div class="col-sm-12 tskmsg" style="max-height:180px; margin:9px 0; padding-bottom:3px; border-bottom:1px dotted silver;">\
			<div class="col-sm-2 msg-avatar"><b>{{author_n}}</b><br />{{day}}</div>\
			<div class="col-sm-9 msg-content" style="max-height:180px; overflow:auto;">{{note}}</div>\
			<div class="col-sm-1 msg-action"><a class="btn btn-default btn-sm button">A</a></div>\
		</div>';
		var tmpl_head = '';
		var tmpl_foot = '';
		var tmpl_foot2 = '';
		taskNotes.forEach(function(btsk){
			var row = tmpl_row;
			//btsk['css_class'] = (btsk['branch_lvl'] == '1')? 'class="info"' : ((btsk['branch_lvl'] == '0')? 'style="background:#6E6"' : '');
			//btsk['obstruct'] = ((btsk['branch_lvl'] == '0')? 'Current' : (btsk['status'] !== 'Active') ? '<p class="label label-danger">Yes</p>' : '<p class="label label-info">No</p>');
			var keys = getVarsObject(btsk);
			keys.forEach(function(key){
				var rgx = new RegExp('{{'+key+'}}','gi');
				row = row.replace(rgx, btsk[key] );
			});
			cont += row;
		});
		cont = tmpl_head + cont + tmpl_foot + tmpl_foot2;
		$('#task-messages').html( cont );
	}
//---showTaskNotes<


//---showGraphFlare>
// try to show the succesor dependencies in graph tree
	function showSuccessorsTreeGraph(taskId){
		if(! Object.keys(Branch_Succ_review_flare).length) return;
		// try to put in iframe graph...
		// console.info('Branch_Succ_review_flare',Branch_Succ_review_flare);
		var iframeFlare = document.getElementById("branch-graph-cont");
		
		if(iframeFlare.contentWindow)
		{
			iframeFlare.contentWindow.LeirAGSsetFlareGraphData( Branch_Succ_review_flare );
		}
		else if(iframeFlare.contentDocument)
		{
			iframeFlare.contentDocument.LeirAGSsetFlareGraphData( Branch_Succ_review_flare );
		}
		
	}
//---showGraphFlare<



//---getSuccessorsBranchTreeFlare>
		function getSuccessorsBranchTreeFlare(taskId, show) {
			if (WF_DEBUG)
				console.info("getSuccessorsBranchTreeFlare(idTask)", taskId);
			
			var datos = {
				'action': 'getSuccessorsBranch',
				'WhichTask': taskId,
				'resultAs': 'treeflare',
			};
			
			if (WF_DEBUG_AJAX)
				console.info('getSuccessorsBranchTreeFlare',"getSuccessorsBranch .RT2", datos);

			
			mirrorLog('getSuccessorsBranchTreeFlare','getSuccessorsBranch .RT2', datos ); 
			
			$.ajax({
				url: getUrl().RT2,
				data: datos,
				async: false,
				dataType: 'text',
				beforeSend: function(data) {
				},
				success: function(data) {
					Branch_Succ_review_flare = CleanResponseData(data);
					if(WF_DEBUG_AJAX_DATA)
						console.info('getSuccessorsBranch results:',results);	
					loaderEnd();
					if(show)
						showSuccessorsTreeGraph(taskId); 
				},
				error: function(err) {
					loaderEnd();
					//-alert('Error on NetSuite call');
					console.error('Error on NetSuite call getSuccessorsBranchTreeFlare', err);
					return false; // If cannot read cannot update.
				}
			});
			return true;
		} // End getSuccessorsBranch
//---getSuccessorsBranch<


//---showbranchdependency> Predecessor
	function showBranchDependencyLarge(taskId, branch){
		$('#whynotTable').html(''); // Clear before...
		if(! Object.keys(branch).length) return;
		var cont = '';
		var tmpl_row = '<tr data-taskid="{{idTask}}" data-tasktype="{{task_type}}" {{css_class}}><td>{{process_n}}-{{subprocess_n}}</td><td>{{title}}</td><td>{{status}}</td><td>{{dependency}}</td><td>{{branch_lvl}}</td><td>{{obstruct}}</td><td>{{assigned_n}}</td><td>{{startdate}}</td><td>{{duedate}}</td></tr>';
		var tmpl_head = '<table class="table table-striped table-bordered" id="whynot">\
			<tr class="warning"><th>TP-SP</th><th>Task</th><th>Status</th><th>Dependency</th><th>Level</th><th>Blocking?</th><th>Assignee</th><th>Start</th><th>Due</th></tr>';
		var tmpl_foot = '</table>';
		var tmpl_foot2 = '<ul>\
		<li><span class="label" style="background:#6E6"> &nbsp; </span> - Task evaluated </li>\
		<li><span class="label label-info"> &nbsp; </span> - Predecessor branch start</li>\
		<li><span class="label label-default"> Level </span> - Number of tasks to reach the current (Proportional to the distance from the origin)</li>\
		</ul>';
		branch.forEach(function(btsk){
			var row = tmpl_row;
			btsk['css_class'] = (btsk['branch_lvl'] == '1')? 'class="info"' : ((btsk['branch_lvl'] == '0')? 'style="background:#6E6"' : '');
			btsk['obstruct'] = ((btsk['branch_lvl'] == '0')? 'Current' : (btsk['dependency'] == 'FinishToStart' && btsk['status'] == 'Active') ? '<p class="label label-danger">Yes</p>' : '<p class="label label-info">No</p>');
			var keys = getVarsObject(btsk);
			keys.forEach(function(key){
				var rgx = new RegExp('{{'+key+'}}','gi');
				row = row.replace(rgx, btsk[key] );
			});
			cont += row;
		});
		cont = tmpl_head + cont + tmpl_foot + tmpl_foot2;
		$('#whynotTable').html(cont);
		$('#whynotTab').show();
		jQScrollTo('whynot');
	}
	
	function showBranchDependency(taskId, branch){
		showBranchDependencyLarge(taskId, branch);
		return true;
		$('#whynotTable').html(''); // Clear before...
		if(! Object.keys(branch).length) return;
		var cont = '';
		var tmpl_row = '<tr data-taskid="{{idTask}}" {{css_class}}><td>{{title}}</td><td>{{status}}</td><td>{{dependency}}</td><td>{{branch_lvl}}</td><td>{{obstruct}}</td><td>{{assigned_n}}</td></tr>';
		var tmpl_head = '<table class="table table-striped table-bordered" id="whynot">\
			<tr class="warning"><th>Task</th><th>Status</th><th>Dependency</th><th>Level</th><th>Blocking?</th><th>Assignee</th></tr>';
		var tmpl_foot = '</table>';
		var tmpl_foot2 = '<ul>\
		<li><span class="label" style="background:#6E6"> &nbsp; </span> - Task evaluated </li>\
		<li><span class="label label-info"> &nbsp; </span> - Predecessor branch start</li>\
		<li><span class="label label-default"> Level </span> - Number of tasks to reach the current (Proportional to the distance from the origin)</li>\
		</ul>';
		branch.forEach(function(btsk){
			var row = tmpl_row;
			btsk['css_class'] = (btsk['branch_lvl'] == '1')? 'class="info"' : ((btsk['branch_lvl'] == '0')? 'style="background:#6E6"' : '');
			btsk['obstruct'] = ((btsk['branch_lvl'] == '0')? 'Current' : (btsk['dependency'] == 'FinishToStart' && btsk['status'] == 'Active') ? '<p class="label label-danger">Yes</p>' : '<p class="label label-info">No</p>');
			var keys = getVarsObject(btsk);
			keys.forEach(function(key){
				var rgx = new RegExp('{{'+key+'}}','gi');
				row = row.replace(rgx, btsk[key] );
			});
			cont += row;
		});
		cont = tmpl_head + cont + tmpl_foot + tmpl_foot2;
		$('#whynotTable').html(cont);
		$('#whynotTab').show();
		jQScrollTo('whynot');
	}
	
	// trye to show deendencies using tab spaces to show level
	function showBranchDependencyA(taskId, branch){
		$('#whynotTable').html(''); // Clear before...
		if(! Object.keys(branch).length) return;
		var cont = '';
		var tmpl_row = '<tr data-taskid="{{idTask}}" {{css_class}}><td>{{title}}</td><td>{{status}}</td><td>{{dependency}}</td><td>{{branch_lvl}}</td><td>{{obstruct}}</td><td>{{assigned_n}}</td></tr>';
		var tmpl_head = '<table class="table table-striped table-bordered" id="whynot">\
			<tr class="warning"><th>Task</th><th>Status</th><th>Dependency</th><th>Level</th><th>Blocking?</th><th>Assigned</th></tr>';
		var tmpl_foot = '</table>';
		var tmpl_foot2 = '<ul>\
		<li><span class="label" style="background:#6E6"> &nbsp; </span> - Task evaluated </li>\
		<li><span class="label label-info"> &nbsp; </span> - Predecessor branch start</li>\
		<li><span class="label label-default"> Level </span> - Number of tasks to reach the current (Proportional to the distance from the origin)</li>\
		</ul>';
		branch.forEach(function(btsk){
			var row = tmpl_row;
			btsk['css_class'] = (btsk['branch_lvl'] == '1')? 'class="info"' : ((btsk['branch_lvl'] == '0')? 'style="background:#6E6"' : '');
			btsk['obstruct'] = ((btsk['branch_lvl'] == '0')? 'Current' : (btsk['dependency'] == 'FinishToStart' && btsk['status'] == 'Active') ? '<p class="label label-danger">Yes</p>' : '<p class="label label-info">No</p>');
			var keys = getVarsObject(btsk);
			keys.forEach(function(key){
				var rgx = new RegExp('{{'+key+'}}','gi');
				row = row.replace(rgx, btsk[key] );
			});
			cont += row;
		});
		cont = tmpl_head + cont + tmpl_foot + tmpl_foot2;
		$('#whynotTable').html(cont);
		$('#whynotTab').show();
		jQScrollTo('whynot');
	}
//---showbranchdependency< Predecessor


//---parseDependency>
	function parseDependency(branch){
		var obstruct = false;
		branch.forEach(function(btsk){
			if (btsk.branch_lvl > 0)
			obstruct = obstruct 
			|| (
				btsk['dependency'] == 'FinishToStart' 
					&& 
				btsk['status'] == 'Active'
				);
		});
		return obstruct;
	}
//---parseDependency<

//---reactivateTask>
	var task_reactivating_task = 0;
	var task_reactivating_vExtract = '';
	var task_reactivating_so = 0;

	function reactivateTask( taskId, vExtract, soid ){
		task_reactivating_task = taskId;
		task_reactivating_vExtract = vExtract;
		task_reactivating_so = soid;
		// data-toggle="modal" data-target=".bs-reactivatetask-modal-sm"
		// $('#reactivatetaskmodal').modal('show');
		getSuccessorsBranch(taskId, true);
		$("#reactivation-task-title").html(Branch_Succ_review_flare.name);
		$('#reactivatetaskmodal-button').trigger('click')
		if(WF_DEBUG)
			console.info('Reactivating Task',{'TaskId':taskId, 'salesorder':soid} );
	}
//---reactivateTask<
	
	
//---cancellingTask>
	var task_cancel_task = 0;
	var task_cancel_vExtract = '';
	var task_cancel_so = 0;
	
	function cancellingTask( taskId, vExtract, soid ){
		task_cancel_task = taskId;
		task_cancel_vExtract = vExtract;
		task_cancel_so = soid;
		// data-toggle="modal" data-target=".bs-reactivatetask-modal-sm"
		// $('#reactivatetaskmodal').modal('show');
		getSuccessorsBranch(taskId, true);
		$("#cancelaltion-task-title").html(Branch_Succ_review_flare.name);
		$('#canceltaskmodal-button').trigger('click')
		if(WF_DEBUG)
			console.info('cancellingTask Task',{'TaskId':taskId, 'salesorder':soid} );
	}
	
	function clearCancelingTask(){
		task_cancel_task = 0;
		task_cancel_vExtract = '';
		task_cancel_so = 0;
	}
//---cancellingTask>	
	
//--- HandleForDates
	
	// Source: http://stackoverflow.com/questions/497790
var handle_dates = {
	    convert:function(d) {
	        // Converts the date in d to a date-object. The input can be:
	        //   a date object: returned without modification
	        //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
	        //   a number     : Interpreted as number of milliseconds
	        //                  since 1 Jan 1970 (a timestamp) 
	        //   a string     : Any format supported by the javascript engine, like
	        //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
	        //  an object     : Interpreted as an object with year, month and date
	        //                  attributes.  **NOTE** month is 0-11.
	        return (
	            d.constructor === Date ? d :
	            d.constructor === Array ? new Date(d[0],d[1],d[2]) :
	            d.constructor === Number ? new Date(d) :
	            d.constructor === String ? new Date(d) :
	            typeof d === "object" ? new Date(d.year,d.month,d.date) :
	            NaN
	        );
	    },
	    compare:function(a,b) {
	        // Compare two dates (could be of any type supported by the convert
	        // function above) and returns:
	        //  -1 : if a < b
	        //   0 : if a = b
	        //   1 : if a > b
	        // NaN : if a or b is an illegal date
	        // NOTE: The code inside isFinite does an assignment (=).
	        return (
	            isFinite(a=this.convert(a).valueOf()) &&
	            isFinite(b=this.convert(b).valueOf()) ?
	            (a>b)-(a<b) :
	            NaN
	        );
	    },
	    inRange:function(d,start,end) {
	        // Checks if date in d is between dates in start and end.
	        // Returns a boolean or NaN:
	        //    true  : if d is between start and end (inclusive)
	        //    false : if d is before start or after end
	        //    NaN   : if one or more of the dates is illegal.
	        // NOTE: The code inside isFinite does an assignment (=).
	       return (
	            isFinite(d=this.convert(d).valueOf()) &&
	            isFinite(start=this.convert(start).valueOf()) &&
	            isFinite(end=this.convert(end).valueOf()) ?
	            start <= d && d <= end :
	            NaN
	        );
	    },
	    diffDays : function (a, b) {
	    	var msPerDay = 8.64e7;
	    	return ( 
	    		isFinite(a=this.convert(a).valueOf()) &&
	    		isFinite(b=this.convert(b).valueOf()) ?
	    		Math.round( (a - b) / msPerDay ) :
	    		NaN
	    	);
	    }
	}
	
//---

//---reactivateTaskProcess>
	function reactivateTaskProcess(){
		if(WF_DEBUG)
			console.info('reactivateTaskProcess',{'Tid':task_reactivating_task,'vExt':task_reactivating_vExtract,'SO':task_reactivating_so });
		var rason = $('#reactivation-note').val();
		var tasktitle = Branch_Succ_review_flare.name;
		var mentions = [];
		rason = rason.trim();
		if (rason.length > 9) {
			
			// No is necesary set StartDate and DueDate...and Duration...
			//Just set value and trigger changed.
			var elem_Stat = $('#selTaskStatus'+task_reactivating_vExtract);
			var elem_Start = $('#idPicker_StartDate_' + task_reactivating_vExtract);
			var elem_Due = $('#idPicker_DueDate_' + task_reactivating_vExtract);
			var elem_Ack = $('#Ack_' + task_reactivating_vExtract);
			var elem_Asig = $('#selectAsignee' + task_cancel_vExtract);
			var start_as_date = StringNetsuiteDateToDate( elem_Start.val() );
			var now_as_date = dateToStringNetsuite(new Date() );
			var need_move_duedate_to_now = handle_dates.compare( start_as_date, StringNetsuiteDateToDate(now_as_date) );
			
			var eid = elem_Asig.val();
			var assigneedData = getEmployeeData(eid);
			//console.info('Assigneed',eid);
			//console.info( getEmployeeData(eid) );
			//return;
			
			elem_Stat.val(1); // Set As Active...
			elem_Ack.prop('checked', false); // Set Acknowledge to false...
			if (need_move_duedate_to_now == 1) {
				// Si el startdate esta en el futuro, no cambiamos el duedate.
			} else {
				elem_Due.val( now_as_date ); // Set DueDate on today
			}
			WF_Error_on_Update = false;
			
			changeidPickerDueDate.call(elem_Due); // trigger process all changes at one time...
			
			if (! WF_Error_on_Update) {
				// Extraer los datos del usuario actual. minimo...
				mentions.push({name:WorkForce_Obj.userName, email: WorkForce_Obj.userEmail, userid: WorkForce_Obj.userID });
				if (assigneedData.employeeId && (WorkForce_Obj.userID != assigneedData.employeeId)) {
					mentions.push({name:assigneedData.employeeName, email: assigneedData.email, userid: assigneedData.employeeId });
				}
				writeNoteOntask(task_reactivating_task, task_reactivating_so, eid, 'Reactivating Task', 'Reactivating Task, rason: '+rason, mentions);
			}
			
			loaderEnd();
		} else {
			alert("Rason is mandatory (min 10 chars)");
		}
		
	}
//---reactivateTaskProcess<


//---cancelTaskProcess>
function cancelTaskProcess(){
	if (!task_cancel_task) { console.info('No Task specified'); return false; }
	if(WF_DEBUG)
		console.info('cancelTaskProcess',{'Tid':task_cancel_task,'vExt':task_cancel_vExtract,'SO':task_cancel_so });
	var rason = $('#cancelation-note').val();
	var tasktitle = Branch_Succ_review_flare.name;
	var mentions = [];
	rason = rason.trim();
	if (rason.length > 9) {
		// No is necesary set StartDate and DueDate...and Duration...
		//Just set value and trigger changed.
		var elem_Stat = $('#selTaskStatus'+task_cancel_vExtract);
		var elem_Start = $('#idPicker_StartDate_' + task_cancel_vExtract);
		var elem_Due = $('#idPicker_DueDate_' + task_cancel_vExtract);
		var elem_Ack = $('#Ack_' + task_cancel_vExtract);
		var elem_Asig = $('#selectAsignee' + task_cancel_vExtract);
		var start_as_date = StringNetsuiteDateToDate( elem_Start.val() ); //console.info('start_as_date',start_as_date);
		var now_as_date = dateToStringNetsuite( new Date() ); //console.info('now_as_date',now_as_date);
		var need_move_duedate_to_now = handle_dates.compare( start_as_date, StringNetsuiteDateToDate(now_as_date) ); //console.info('need_move_duedate_to_now',need_move_duedate_to_now);
		var eid = elem_Asig.val();
		var assigneedData = getEmployeeData(eid);
		elem_Stat.val(4); // Set As Active... ups as cancelled.
		elem_Ack.prop('checked', true); // Set Acknowledge to false... if not was ACK, ensure.
		if (need_move_duedate_to_now == 1) {
			// Si el startdate esta en el futuro, no cambiamos el duedate.
		} else {
			elem_Due.val( now_as_date ); // Set DueDate on today
		}
		WF_Error_on_Update = false;
		
		changeidPickerDueDate.call(elem_Due); // trigger process all changes at one time...
		
		if (! WF_Error_on_Update) {
			// Extraer los datos del usuario actual. minimo...
			mentions.push({name:WorkForce_Obj.userName, email: WorkForce_Obj.userEmail, userid: WorkForce_Obj.userID });
			if (assigneedData.employeeId && (WorkForce_Obj.userID != assigneedData.employeeId)) {
				mentions.push({name:assigneedData.employeeName, email: assigneedData.email, userid: assigneedData.employeeId });
			}
			writeNoteOntask(task_cancel_task, task_cancel_so, eid, 'Cancel Task', 'Cancelling Task, rason: '+rason, mentions);
		}
		
		loaderEnd();
		
	} else {
		alert("Rason is mandatory (min 10 chars)");
	}
	
}
//---cancelTaskProcess<



//--- writeNoteOnTask>
	function writeNoteOntask(taskId, taskSoMsg, taskAsignee, tit, msg, mentions) {
		if (WF_DEBUG)
			console.info("writeNoteOntask(taskId, taskSoMsg, tit, msg)", taskId, taskSoMsg, taskAsignee, tit, msg);
		
		// Verify if in mentions exist the assignee if not then add.
		// Mentions are array [ {email:'', name:'', userid:0} ]
		var cMen = LeirAGS_findInObj(mentions,'userid',taskAsignee);
		//- console.info('writeNoteOntask cMen', cMen );
		if (cMen.length < 1){
			var assigneedData = getEmployeeData(taskAsignee);
			if (assigneedData.employeeId) {
				mentions.push({name:assigneedData.employeeName, email: assigneedData.email, userid: assigneedData.employeeId });
			}
		}
		// Allways register who send the message.
		cMen = LeirAGS_findInObj(mentions,'userid',WorkForce_Obj.userID);
		if (cMen.length < 1)
			mentions.push({name:WorkForce_Obj.userName, email: WorkForce_Obj.userEmail, userid: WorkForce_Obj.userID });
		
		var datos = {
			'action': 'writeNoteOnTask',
			'WhichTask': taskId,
			'WhichSalesOrder': taskSoMsg,
			'Assignee': taskAsignee,
			'title': tit,
			'message': msg,
			'mentions': JSON.stringify(mentions),
		};
		
		if (WF_DEBUG_AJAX)
			console.info('writeNoteOntask',"writeNoteOntask .RT2", datos);
		
		mirrorLog('writeNoteOntask','writeNoteOntask .RT2', datos ); 
		
		$.ajax({
			url: getUrl().RT2,
			data: datos,
			async: false,
			dataType: 'text',
			beforeSend: function(data) {
			},
			success: function(data) {
				results = CleanResponseData(data);
				if(WF_DEBUG_AJAX_DATA)
					console.info('writeNoteOntask results:',results);
			},
			error: function(err) {
				loaderEnd();
				console.error('Error on NetSuite call results', err);
				return false; // If cannot read cannot update.
			}
		});
		return true;
	}
//--- writeNoteOnTask<

//--- uploadFiletoNetSuite('Msg Title', 'Msg Uploading File', salesorder, soid, taskid, tasktitle, filename, ftype, file64);

	function uploadFiletoNetSuite(title, msg, salesorder, soid, taskid, tasktitle, fname, ftype, file64) {
		if (WF_DEBUG)
			console.info("uploadFiletoNetSuite(title, msg, salesorder, soid, taskid, fname, ftype, file64)", 
					title, msg, salesorder, soid, taskid, tasktitle, fname, ftype);
		/*
		var salesorder =  Params.request.parameters["WhichSalesOrder"];
		var soName =  Params.request.parameters["SOName"];
		var taskId = Params.request.parameters["WhichTask"];
		var tit = Params.request.parameters["title"];
		var msg = Params.request.parameters["message"];
		var filename = Params.request.parameters["filename"];
		var filecont = Params.request.parameters["filecont"];
		*/
		 
		var fileContentRaw = atob( file64.split(',').pop() );
		
		var datos = {
			'action': 'addFileOnTask',
			'WhichSalesOrder' : soid,
			'SOName' : salesorder,
			'WhichTask': taskid,
			'TaskTitle' : tasktitle,
			'title': title,
			'message': msg,
			'filename': fname,
			'filecont': input.files[0]
		};
		
		if (WF_DEBUG_AJAX)
			console.info('uploadFiletoNetSuite',"addFileOnTask .RT2", datos);

		mirrorLog('uploadFiletoNetSuite','addFileOnTask .RT2', datos ); 
		
		$.ajax({
			url: getUrl().Cabinet,
			type: 'POST',
			data: datos,
			async: false,
			cache: false,
			contentType: false,
		    enctype: 'multipart/form-data',
		    processData: false,
			dataType: 'text',
			beforeSend: function(data) {
			},
			success: function(data) {
				results = CleanResponseData(data);
				if(WF_DEBUG_AJAX_DATA)
					console.info('uploadFiletoNetSuite results:',results);
			},
			error: function(err) {
				loaderEnd();
				console.error('Error on NetSuite call results', err);
				return false; // If cannot read cannot update.
			}
		});
		return true;
	}
//--- 
	
	require(['N/https', 'N/url', 'N/file'],
  	function(https, urlMod, file) {
		return LeirAGS_UploadX = function (salesorder, taskid, fname, ftype, file64) {
			var worforce_files_rootm = {SANDBOX:6428448, PRODUCTION: 10279782};
			var worforce_files_root = 6428449;
			var extension_type = {
				    dwg: 'AUTOCAD',
				    bmp: 'BMPIMAGE',
				    csv: 'CSV',
				    xls: 'EXCEL',
				    xlsx: 'EXCEL',
				    swf: 'FLASH',
				    gif: 'GIFIMAGE',
				    gz: 'GZIP',
				    htm: 'HTMLDOC',
				    html: 'HTMLDOC',
				    ico: 'ICON',
				    js: 'JAVASCRIPT',
				    jpg: 'JPGIMAGE',
				    eml: 'MESSAGERFC',
				    mp3: 'MP3',
				    mpg: 'MPEGMOVIE',
				    mpp: 'MSPROJECT',
				    pdf: 'PDF',
				    pjpeg: 'PJPGIMAGE',
				    txt: 'PLAINTEXT',
				    png: 'PNGIMAGE',
				    ps: 'POSTSCRIPT',
				    ppt: 'POWERPOINT',
				    pptx: 'POWERPOINT',
				    mov: 'QUICKTIME',
				    rtf: 'RTF',
				    sms: 'SMS',
				    css: 'STYLESHEET',
				    tiff: 'TIFFIMAGE',
				    vsd: 'VISIO',
				    doc: 'WORD',
				    docx: 'WORD',
				    xml: 'XMLDOC',
				    zip: 'ZIP'
				};
			console.info('fname',fname,'ftype',ftype,'extension_type',extension_type[ ftype ]);
			//console.warn(file64);
			var fileObj = file.create({
                name: fname,
                fileType: file.Type[ extension_type[ ftype ] ],
                contents: file64,
                folder : worforce_files_root,
                isOnline : true
            });
			console.info(fileObj);
		}
	});
	
	

//---setTaskActive>
	function setTaskActive(taskId) {
		var idparent = $(this)[0].id;
		var StatusID = $(this)[0].value;
		var previosStat = $(this).closest("tr").find("p.kiko").text();

		//console.log($(this));
		var StatusName = $("#" + idparent + " option:selected").text();
		//console.log("Global StartDate :"+GlobalStartDate);
		//console.log("Global DueDate :"+GlobalDueDate);
		//console.log(StatusName + " "+ StatusID);
		var vExtract = idparent.split("lTaskStatus").pop();
		
		//-- Get TaskID trying to Change....
		var post_taskid = $("#vtaskID" +	 vExtract).html();
		console.info('post_taskid',post_taskid);
		
		//-- Get if predecessors obstruct complete this task. 
		var is_obstruct = getPredesesorsBranch(post_taskid, false);
		PredecessorRealBlocking = is_obstruct;
		console.info('post_taskid_obstruct',(is_obstruct)?"PREDECESOR IS BLOCKING":"FREE TO UPDATE");
		
		// Validate Diferent to ACTIVE. if ( (StatusName != "Active" || StatusID != 1) && is_obstruct ) {
			
		function inputsset(dis){
			$('#idPicker_StartDate_' + vExtract).prop('disabled', dis);
			$('#idPicker_DueDate_' + vExtract).prop('disabled', dis);
			$('#idTask_Duration_' + vExtract).prop('disabled', dis);
			$('#WorkOnWeekends_' + vExtract).prop('disabled', dis);
		}
		
		// Validate blocking only if try to complete...
		if ( (StatusName == "Completed" || StatusID == 2) && is_obstruct ) {
			//$("#"+ idparent +" option:text='" + previosStat +"'").attr("selected", "selected");
			// Get VALUE from Select Option...
			var xval=''; 
			$("#"+ idparent +" option").map(function(e,o){ /* console.info(e,o); */ if(o.text == previosStat) xval=o.value });
			//Set Val on Select to previous...
			$("#"+ idparent +"").val(xval);
			confirm('Predecessors are not yet completed...\nClick "Dependency Chain" to see details.');
			return false;
			// Remember: return back the value of status to previous.
		}
		//-- return false;

		if ((StatusName == "Completed" || StatusID == 2) || (StatusName == "Cancelled" || StatusID == 4)) {
			// Verify if user disable confirmations....
			if( $('#cnfs').is(':checked') ) {
				if (confirm("You won\'t be able to update this task once the status changes to completed or cancelled.\n\nAre you sure to continue ?")) {
					//console.log(vExtract);
					RuleToStatus(vExtract);
					//console.log(vExtract);
					inputsset(true);
				} else {
					$(this).val(GlobalLastStatus);
					if(WF_DEBUG)
						console.info('User cancel action change status.');
					return false;
				}
			} else {
				if(WF_DEBUG)
					console.info('Confirmations was disabled by user.');
				//console.log(vExtract);
				RuleToStatus(vExtract);
				inputsset(true);
				//--- return false;
			}
			
		} else {
			inputsset(false);
		}
		changeDico(vExtract);
		return false;
	}
//---setTaskActive>


//---getTaskCurrentData>
	function getTaskCurrentData(taskId) {
		if (WF_DEBUG)
			console.info("getTaskCurrentData(taskId)", taskId);
		
		var datos = {
				'action': 'getTaskCurrentData',
				'id': taskId
			};
		
		if (WF_DEBUG_AJAX)
			console.info('getTaskCurrentData',"getTaskCurrentData .RT", datos );
		
			mirrorLog('getTaskCurrentData','getTaskCurrentData .RT', datos ); 

		var ReturnedData = [];
		
		$.ajax({
			url: getUrl().RT,
			async: false,
			data: datos,
			dataType: 'text',
			success: function(data) {
				data = CleanResponseData(data);
				ReturnedData = data;
			},
			error: function(err) {
				console.log("Error on ajax call getTaskCurrentData", err);
			}
		});

		return ReturnedData;
	}
//---getTaskCurrentData<

	
//---editESOW>
	function editESOW(){
		if (Current_Eng_Scope_Work.soid) {
			var editor = getHtmlEditor('custbody_op_sow');
			if (editor != null) // is loaded ?
		    {
				//- $('#custbody_op_sow_fs_initValue').val( Current_Eng_Scope_Work.esow );
				//- $('#custbody_op_sow').val( Current_Eng_Scope_Work.esow );
				//- console.log(Current_Eng_Scope_Work.esow);
				
				if (editor.initialized) { 
					editor.setValue(Current_Eng_Scope_Work.esow, true);
				} else {
			       setTimeout(function () { editor.setValue(Current_Eng_Scope_Work.esow, true);  }, 200);
				}
				
				$('#editESOW-button').trigger('click');
		    }	
		} else {
			
			console.info('Not Sales Order ID was loaded.')
			
		}
	}
//---editESOW<

	
//---saveESOW>
	function saveESOW(){
		if (Current_Eng_Scope_Work.soid) {
			setWindowChanged(window, false); // Disable Alert on Reload Page...
			var esow_cont = $('#custbody_op_sow').val();
			//--console.log(esow_cont);
			//esow_cont = LeirAGS_Encoder.htmlEncode(esow_cont);
			
			var datos = {
					'action': 'setESOWonSO',
					'WhichSalesOrder' : Current_Eng_Scope_Work.soid,
					'ESOW' : esow_cont,
				};
				
			if (WF_DEBUG_AJAX)
				console.info('saveESOW',"setESOWonSO .RT2", datos);
			
			mirrorLog('saveESOW','setESOWonSO .RT2', datos ); 
			
			$.ajax({
				url: getUrl().RT2,
				type: 'POST',
				data: datos,
				dataType: 'text',
				beforeSend: function(data) { },
				success: function(data) {
					$('#Current_Eng_Scope_Work_Element').html('<p>'+esow_cont+'</p>');
					loaderEnd();
					setTimeout(function(){ loaderEnd(); },20);
				},
				error: function(err) {
					loaderEnd();
					console.error('Error on NetSuite saveESOW call results', err);
					return false; // If cannot read cannot update.
				}
			});
		} else {
			console.info('Not Sales Order ID was given.')
		}
	}
//---saveESOW<
	
// DOCUMENT READY>...

		$(document).ready(function() { 

			employeesobj = JSON.parse( $('input#custpage_employeesobj').val() );
			employeesobj_inactive = JSON.parse( $('input#custpage_employeesobj_inactive').val() );
			getSalesOrderStatus();

			var arrayFilters = [];
			var GlobalEditing = false;
			var GlobalStartDate = 0;
			var GlobalDueDate = 0;
			var GlobalLastStatus = 0;
			var GlobalSalesOrderTbl;
			var GlobalSalesOrderTbl2;
			var Global_collapseFirst = [];
			var whichSOFilters = 'SalesOrd:B,SalesOrd:D,SalesOrd:E';
			var whichSOFilters2 = 'SalesOrd:B,SalesOrd:D,SalesOrd:E';
			var whichStatusFilters = '1';
			var whichStatusFilters2 = '';
		
			$("#gantt1").hide();
			
			setCalendarFormatInput();
			
			setFooterOptions();
			
			// Enable common function for ajax...
			$(document).ajaxStart(function() {
				memstats.update();
				if (WF_LOADER_AUTO) return;
				WF_LOADER_LEVEL++;
// 				if (WF_DEBUG)
// 					console.log('WF_LOADER_LEVEL', WF_LOADER_LEVEL);
				$('.loader').show();
			});

			$(document).ajaxComplete(function() {
				memstats.update();
				WF_LOADER_LEVEL--;
// 				if (WF_DEBUG)
// 					console.log('WF_LOADER_LEVEL', WF_LOADER_LEVEL);
				if (WF_LOADER_LEVEL < 1) {
					//$('.loader').hide();
					WF_LOADER_AUTO = false;
				}
			});
			
			window.loaderStart = function(){
				$('.loader').show();
			}
			
			window.loaderEnd = function(){
				$('.loader').hide();
			}
			
			// Helper functions....
			WorkForce_turnOffDebug = function() { WF_DEBUG = false; }
			WorkForce_turnOnDebug = function() { WF_DEBUG = true; }
			WorkForce_getDebugStatus = function() { return WF_DEBUG; }
			WorkForce_turnOffAjaxDebug = function() { WF_DEBUG_AJAX = false; }
			WorkForce_turnOnAjaxDebug = function() { WF_DEBUG_AJAX = true; }
			WorkForce_getAjaxDebugStatus = function() { return WF_DEBUG_AJAX; }
			WorkForce_getMode = function() { return WORKFORCE_MODE ? 'NORMAL' : 'TESTING'; }
			WorkForce_setMode = function(mode) { if (typeof mode != 'undefined') WORKFORCE_MODE = mode; }
	//------

			window.setLevelLoader = function setLevelLoader(level) {
				WF_LOADER_LEVEL = level;
				WF_LOADER_AUTO = true;
				$('.loader').show();
				if (WF_DEBUG)
					console.log('setLevelLoader() WF_LOADER_LEVEL:', WF_LOADER_LEVEL, 'WF_LOADER_AUTO:', WF_LOADER_AUTO);
			}

			window.turnOffLoader = function turnOffLoader() {
				if (WF_DEBUG)
					console.log('turnOffLoader() WF_LOADER_LEVEL:', WF_LOADER_LEVEL, 'WF_LOADER_AUTO:', WF_LOADER_AUTO);

				$('.loader').hide();
				WF_LOADER_LEVEL = 0;
				WF_LOADER_AUTO = false;
			}
			
			window.WF_Refresh_Current_SO = function WF_Refresh_Current_SO(){ $('#refreshCurrSO').trigger('click'); }
			
//-----

			$('[id^=multipleSelectSalesOrders]').on('change', function() {
				whichSOFilters = ($(this).val());
			});

			$('[id^=multipleSelectSalesOrders2]').on('change', function() {
				whichSOFilters2 = ($(this).val());
			});

			$('[id^=multipleSelectStatus]').on('change', function() {
				whichStatusFilters = ($(this).val());
			});

			$('[id^=multipleSelectStatus2]').on('change', function() {
				whichStatusFilters2 = ($(this).val());
			});

			// initialized picker
			$("input[id^=s2id_]").hide();

			// Obtains team members if there are any
			var MyTeamLength = $('input#custpage_selectmyteam').val();
			var MyTeam = $.parseHTML(MyTeamLength);
			
			MyTeamLength = MyTeam[0].length;
			$(MyTeam).appendTo(".ToMyTeam");
			$('input#custpage_selectmyteam').show();
			if (MyTeamLength > 0) {
				$('.filtersFirstBar').css("display", "block");
				$('.tabso2').css("display", "block");
				$('.tabso3').css("display", "block");
				$('.tabso4').css("display", "block");
				//$('.tabso5').css("display" , "block");
			}
			
			// Fix 18 May 2017 -- all can view this tab.
//			$('.tabso5').css("display", "block");
			
//			if (WorkForce_Obj.rolePM) enablePMroles();
			enablePMroles();

			$(".dhxtreeview_cont").css('width', '100%');
			$(".dhxtreeview_cont").css('height', '100%');

//			/* Run in main  */
//			// setLevelLoader(2);
//			loaderStart();
//			// GetSalesOrdersbyID('Customsalesorder', 'CurrentUser', 'SomeSOStatus',false);
//			if (WorkForce_Obj.gocomm) {
//				// Get task by Id and Show Communicator.
//				getTaskNotesFull(WorkForce_Obj.gocomm);
//			} else {
//				GetSalesOrdersbyID('Customsalesorder', 'CurrentUser', '1', false);
//			}

			// End of team function

			// Block to get Sales Orders assigned to the user
			var WhichSalesOrder = '';
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
			var lstEmployeeSelect = $('input#custpage_selectempselect').val();

			$('.div-selectassigned').css({ 'font-weight': 'normal', 'height': '32px' });
			$('.div-selectdepartment').css('font-weight', 'normal');

			// This variable will be used to fill the main task status filter
			var lstTaskStatusFilter = $('input#custpage_selectstatustask').val();
			var regexTask = new RegExp("selectTaskStatus", "g");
			lstTaskStatusFilter = lstTaskStatusFilter.replace(regexTask, 'filterTask');
			lstTaskStatusFilter = lstTaskStatusFilter.replace('selTaskStatus', 'filterTask');
			
// 			if(WF_DEBUG)
// 				console.info('lstTaskStatusFilter',lstTaskStatusFilter);
			
			lstTaskStatusFilter = lstTaskStatusFilter.replace('class="filterTask">', 'class="filterTask"><option value="notstatus">- Filter by Task Status -</option>');
			lstTaskStatusFilter = lstTaskStatusFilter.replace('onchange="changeselTaskStatus.call(this)"', 'onchange=""');
			//lstTaskStatusFilter = lstTaskStatusFilter.replace('changeselTaskStatus', 'changeLoadStatusTasks');
			lstTaskStatusFilter = $('.div-selecttaskstatus').html(lstTaskStatusFilter);
			var lstStatusSelect = $('input#custpage_selectstatustask').val();
			// Global Variables
			var WorkWeekend; // Stores if the selected row/taks has set if the Employee will work on Weekends
			var taskID; // Stores the task ID displayed for each row
			var targetTasks;
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

			function getSalesOrderStatus(){
				var OrderStatus = $('#custpage_orderstatus').val();
// 				if(WF_DEBUG)
// 					console.info('custpage_orderstatus',OrderStatus);
				$('#multipleSelectSalesOrders').append(OrderStatus);
				$('#multipleSelectSalesOrders2').append(OrderStatus);
			}

			function showMyWorkSalesOrdersResumen(){
				var rows="";
				var rowT='<div class="col-sm-2 TaskToSalesOrder" style="width:12.45%; height:96px; margin:1px;" data-salesorderid="{{tso_id}}" \
						data-cmp="{{tso_entN}}" data-soname="{{tso_label}}" \
						onMouseOver="this.style.background=\'#DDD\'; this.style.border=\'1px dotted #333\';" \
						onMouseOut="this.style.background=\'#EEE\'; this.style.border=\'1px solid #DDD\';" >'+
						'<h4><span style="float:left">'+getNetSuiteImage('salesorder',false)+'</span>{{tso_label}}</h4><p>{{tso_entN}}</p></div>';
				for(var ord in myWorkSOdata){
					//console.log(ord);
					var rowx = rowT;
					for(var fld in myWorkSOdata[ord]){
						var re = new RegExp('{{'+fld+'}}', 'g');
						var val = myWorkSOdata[ord][fld];
						rowx = rowx.replace(re, val);
						//console.log(fld, val);
					}
					rows += rowx;
				}
				$('#AllMyWorkResume').html(rows);
				return rows;
			}

			window.LeirAGS_Flaten = function flatten(ary, ret) {
			    return ary.reduce(function(ret, entry) {
			        if (Array.isArray(entry)) {
			            flatten(entry, ret);
			        } else {
			            ret.push(entry);
			        }
			        return ret;
			    }, ret || []);
			}
			
//---GetAllMyWorkTodayOld>
			getAllMyWorkTodayOld = function getAllMyWorkTodayOld(empDt, showDepart ) {
				if (WF_DEBUG)
					console.info('getAllMyWorkTodayOld(empDt,showDepart)', empDt, showDepart);
				
				loaderStart();
				
				$('#tracing-cnt').html('Retrieving...'); // Clear Table Content
				
				var status = String( $('#tracing-status').val() );
				var dayWay = $('#tracing-dates').val();
				var staff_group = false;
				var audits = (empDt.et=='department')?JSON.stringify(empDt.ei):empDt.ei;
				
				if (Staff_click_in_Depart && empDt.ed) {
					staff_group = true;
					// audits = (empDt.ed).reduce(function(a, b) { return a.concat(b); });
					audits = JSON.stringify( LeirAGS_Flaten(empDt.ed) );
				}
				
				var now = ''; 
				var now = dateToStringNetsuite( new Date() );
				var empDt = empDt;
				var datos = {
						'action'  : 'getAllMyWorkTodayOld',
						'statusId': status,
						'auditId' : audits, // (empDt.et=='department')?JSON.stringify(empDt.ei):empDt.ei,
						'day'	  : now,
						'dayWay'  : dayWay
					};
				
				if (WF_DEBUG_AJAX)
					console.info('getAllMyWorkTodayOld','getAllMyWorkTodayOld .RT', datos );
					
					mirrorLog('getAllMyWorkTodayOld','getAllMyWorkTodayOld .RT', datos ); 

				$.ajax({
					url: getUrl().RT,
					data: datos,
					dataType: 'text',
					async: true,
					beforeSend: function(data) { },
					complete: function(data) { },
					success: function(data) {
						data = CleanResponseData(data);
						if(WF_DEBUG_AJAX_DATA)
							console.info('getAllMyWorkToday [data]',data);
						/*
						  From now 2017-March-1 this return two arrays
						  ---------------------------------------------
						  SOdata -- All Sales Orders involved
						  			fields: 
						  				tso_id : "437770"
						  				tso_label : "SO-1-2441"
						  				tso_memo : "Migración de DIA de 20 Mbps de FO a MO recuperada en sitio Lear CC30. CID que aparece en NS: 1-13788228"

						  Tasks -- All Tasks.
						*/
						
						if(! data['Tasks'] || (! data.Tasks && (data.Tasks).length() )){
							//console.info('Edt',empDt);
							if (empDt.et=='department')
								$('#tracing-cnt').html('<p class="alert alert-info"> No task found, to department <b>"'+departmentsobj[empDt.ed].name+'"</b> for today...</p>'); // Clear Table Content
							else if (staff_group)
								$('#tracing-cnt').html('<p class="alert alert-info"> No task found, assigned for STAFF of <b>"'+employeesobj_my[empDt.eo].employeeName+'"</b> for today...</p>'); // Clear Table Content
							else 
								$('#tracing-cnt').html('<p class="alert alert-info"> No task found, assigned to <b>"'+employeesobj_my[empDt.eo].employeeName+'"</b> for today...</p>'); // Clear Table Content
							//console.info('Not Tasks Records Found');
							return;
						}
						
						//console.info(data.Tasks); 
						var rowH = '<h5>';
						if (empDt.et=='department')
							rowH += 'Tasks for department: <b>'+departmentsobj[empDt.ed].name+'</b>';
						else if(staff_group)
							rowH += 'Tasks for STAFF of <b>'+employeesobj_my[empDt.eo].employeeName+'</b>';
						else
							rowH += 'Tasks of <b>'+data.Tasks[0].Assigned+'</b>';
						rowH += '<span class="text-info pull-right">count:'+(data.Tasks).length+'</span>';
						rowH += '</h5>';
						
						var rows = '<table id="tracing-table" class="table table-striped table-hover table-bordered">';
						rows += '<thead>';
						rows += '<tr>'+
						'<th></th>'+
						'<th style="width:96px">SO</th>'+
						'<th>Task</th>'+
						((empDt.et=='department' || staff_group)?'<th>Assigned</th>' : '') +
						'<th>Start</th>'+
						'<th>Due</th>'+
						'<th>Status</th>'+
						'</tr>';
						rows += '</thead>';
						rows += '<tbody>';
						data.Tasks.forEach(function(tsk) {
							rows += '<tr data-task=\''+JSON.stringify(tsk)+'\'>'+
							'<td><i class="glyphicon glyphicon-question-sign text-info task-info-pov" aria-hidden="true"></td>'+
							'<td class="overpointer">'+tsk.SalesOrder+'<i class="glyphicon glyphicon-folder-open pull-right" aria-hidden="true" style="display:none"></i></td>'+
							'<td class="overpointer">'+tsk.Title+'<i class="glyphicon glyphicon-open-file pull-right" aria-hidden="true" style="display:none"></i></td>'+
							((empDt.et=='department' || staff_group)?'<td>'+tsk.Assigned+'</td>' : '') +
							'<td>'+tsk.StartDate+'</td>'+
							'<td>'+tsk.DueDate+'</td>'+
							'<td>'+WF_G_TaskStatus[tsk.Status]+'</td>'+
							'</tr>';
							
							//-- rows+= '<tr><td colspan=6>'+LeirAGS_cnvObjTable(tsk)+'</td></tr>';
							
							if (tsk.note) { rows+= '<tr><td colspan=6>'+tsk.note+'</td></tr>'}
						});
						rows += '</tbody>';
						rows += '</table>';
						
						$('#tracing-cnt').html( rowH + rows );
						
						$('#tracing-table tbody td.overpointer').mouseover(function(){
							$(this).find('i').show();
						}).mouseleave(function(){
							$(this).find('i').hide();
						});
						
						$('#tracing-table tbody td').on( 'click',function(){ 
							var cols = ['info','so','task','assigned','start','due','status'], 
								col_i=$(this).index(), 
								col_n=cols[col_i], 
								task=$(this).closest('tr').data('task');
							if(WF_DEBUG)
								console.info('Click on task',task);
							switch (col_n){
							case 'so':
								var curr_so_id = $("#IdSalesOrderBySpan").text();
								setTimeout(function(){
									if (curr_so_id != task.SalesOrderID) {
										displaySObySpan (task.SalesOrderID, task.SalesOrder, task.company, task.Title);
										openSOfromTab = 'tracing'; //'allsalesorder';
										clickinSO(task.SalesOrderID);
										openSOfromTab = '';
									} else {
										jQScrollTo('IdSalesOrderBySpan');
									}
								},2);
								break;
							case 'task':
								open_so_and_locate_task_on_tree_tracing(
											task.SalesOrderID,
											task.SalesOrder,
											task.company, 
											task.Id);
								break;
							default:
								break;
							}
							//--- console.info(col_i, col_n, task); 
							/* console.info(this,$(this).index(), $(this).closest('tr').data() ) */ 
						});
						
						loaderEnd();
					},
					error: function(e) {
						loaderEnd();
						alert("Error on NetSuite Call GetAllMyWorkTodayOld");
						console.error("Erron on NetSuite Call GetAllMyWorkTodayOld()",e);
					}
				});
			} // End of GetAllMyWorkTodayOld function
//---GetAllMyWorkTodayOld<

			
			
//---tracing_apply_filters>
			window.tracing_apply_filters = function tracing_apply_filters(){
				if(! Tracing_Tasks_Obj.count ) return false;
				var gui_tracing_ids = [
							['assigned','Assigned'],
							['startdate','StartDate'],
							['duedate','DueDate'],
							['departments','department'],
							['process','process'],
							['subprocess','subprocess'],
							['cities','city'],
							['states','state'],
							['customers','company'],
							['items','item'],
							['address','KpiAddress'],
							['type','type'],
						];
				var tracing_filters = [];
				gui_tracing_ids.map(function(id){
					var filter_val = $('#tracing-'+id[0]).val();
					if (filter_val && (filter_val != 'all' && filter_val != '')) {
						if(id[0] == 'startdate' || id[0] == 'duedate') 
							filter_val = StringNetsuiteDateToDate( filter_val ).getTime();
						tracing_filters.push([id[1], filter_val]);
					}
				})
				//console.info('tracing filters',tracing_filters);
				
				$('#tracing-table tbody').empty();
				
				var rows = '';
				var rpass = 0;
				var empDt = Tracing_Tasks_Obj['empDt'];
				var staff_group = Tracing_Tasks_Obj['staff_group'];
				
				for(var idx in Tracing_Tasks_Obj.rrows.tasks){
					tsk = Tracing_Tasks_Obj.rrows.tasks[idx];
					var pass = !(tracing_filters.length);
					tracing_filters.map(function(filt){
						console.info(filt[0], tsk[filt[0]], filt[1]);
						if (filt[0] == 'StartDate') {
							filt[0] = 'date_s';
							pass = pass || (tsk[filt[0]] >= filt[1]);
						} else {
							if (filt[0] == 'DueDate') {
								filt[0] = 'date_d';
								pass = pass || (tsk[filt[0]] <= filt[1]);
							} else {
								pass = pass || (tsk[filt[0]] == filt[1]);
							}
						}
					});
					if (pass) {
						rows += '<tr data-tracingobj=\''+idx+'\'>'+
						'<td><i class="glyphicon glyphicon-question-sign text-info task-info-pov" aria-hidden="true"></td>'+
						'<td class="overpointer">'+Tracing_Tasks_Obj.rrows.salesorders[tsk.SalesOrder]['label']+'<i class="glyphicon glyphicon-folder-open pull-right" aria-hidden="true" style="display:none"></i></td>'+
						'<td class="overpointer">'+tsk.Title+'<i class="glyphicon glyphicon-open-file pull-right" aria-hidden="true" style="display:none"></i></td>'+
						((empDt.et=='department' || staff_group)?'<td>'+Tracing_Tasks_Obj.rrows.assigned[tsk.Assigned]+'</td>' : '') +
						'<td>'+tsk.StartDate+'</td>'+
						'<td>'+tsk.DueDate+'</td>'+
						'<td>'+WF_G_TaskStatus[tsk.Status]+'</td>'+
						'</tr>';
						if (tsk.note) { rows+= '<tr><td colspan=6>'+tsk.note+'</td></tr>'}
						rpass++;
					}
				};
				
				rows += '</tbody>';
				
				$('#tracing-table tbody').append(rows);
				
				$('#tracing-filter-count').html('filters: '+rpass);
				
				return true;
			}

			
			
//---showPopUpTaskData>
			window.showPopUpTaskData = function showPopUpTaskData(e,c){
				// console.info(e);
				// window.pito_e = e;
				var lnk = $(e).attr('href');
				var $tr = $(e).closest('tr');
				var tdt = $($tr).data();
				var kid = tdt.tracingobj;
				
				if (c) {
					var source = WF_Corrections_Tasks;
				} else {
					var source = Tracing_Tasks_Obj;
				}
				var tsk = source.rrows.tasks[kid];
				var duration_planed = LeirAGS_dates.diffWrkDays( tsk.start_p, tsk.due_p, tsk.WorkWeekend );
				var duration_real = LeirAGS_dates.diffWrkDays( tsk.StartDate, tsk.DueDate, tsk.WorkWeekend );
				var stask = {
						'Task': tsk.Title,
						'Start': tsk.StartDate,
						'Due': tsk.DueDate,
						'Work on Weekend': tsk.WorkWeekend,
						'Duration': tsk.Duration + " day's",
						'Status': WF_G_TaskStatus[tsk.Status],
						'Ack': tsk.Ack,
						'Calc Duration': duration_real + " day's",
						'Planned Start' : tsk.start_p,
						'Planned Due': tsk.due_p,
						'Planned Duration': duration_planed + " day's",
						'NetSuite-Status': tsk.status_ns,
				}
				var staska = {
						'SalesOrder': source.rrows.salesorders[tsk.SalesOrder]['label'],
						'Company' : source.rrows.customers[tsk.company],
						'Item': source.rrows.items[tsk.KpiItem],
						'Type': source.rrows.types[tsk.type],
						'Department': source.rrows.departments[tsk.department],
						'Process': source.rrows.process[tsk.process],
						'SubProcess': source.rrows.subprocess[tsk.subprocess],
						'Address': source.rrows.servicesaddresses[tsk.KpiAddress]['name'],
						'City': source.rrows.cities[tsk.city],
						'State': source.rrows.states[tsk.state],
						// 'Municipality': Tracing_Tasks_Obj.rrows.servicesaddresses[tsk.KpiAddress]['municipality'],
						'Municipality': source.rrows.municipalities[source.rrows.servicesaddresses[tsk.KpiAddress]['municipality']],
				};
				var toStr = LeirAGS_cnvObjTable(stask);
				var toStra = LeirAGS_cnvObjTable(staska);
				var openTaskInNetSuite = '<a href="/app/crm/calendar/task.nl?id='+tsk.id+'" target="_blank"> Open Task in NetSuite '+getNetSuiteImage('netsuite15', false)+'</a>';
				var footNotes = '<p>Notes: <ul>\
					<li>Rules for calculating the duration\
						<ul>\
						<li>Working days (monday to friday)</li>\
						<li>If Work On Weekends include Saturday and Sunday</li>\
						<li>Not include Holiday\'s (default Jan 01, Dec 25)</li>\
						</ul>\
					</li>\
					<li>Values in Item and Address depends on task type</li>\
					</ul></p>';
				var tmplate_layout = '<div class="col-sm-6">'+toStra+'</div><div class="col-sm-6">'+toStr+'</div><br style="clear:both"/>'+openTaskInNetSuite+footNotes+'';
				$(lnk+' h2').html('Task Info'+ ((c)?' Corrections':'') );
				$(lnk+' .content').html( tmplate_layout );
			}
//---showPopUpTaskData<

			
//---GetAllMyWorkToday>
			getAllMyWorkToday = function getAllMyWorkToday(empDt, showDepart ) {
				if (WF_DEBUG)
					console.info('getAllMyWorkToday(empDt,showDepart)', empDt, showDepart);
				
				loaderStart();
				
				$('#tracing-cnt').html('Retrieving...'); // Clear Table Content
				
				// Reset list values...
				Tracing_List_Items = ['all'];
				Tracing_List_Address = ['all'];
				Tracing_List_Assigned = ['all'];
				Tracing_List_Customers = ['all'];
				//----
				
				var status = String( $('#tracing-status').val() );
				var dayWay = $('#tracing-dates').val();
				var staff_group = false;
				var audits = (empDt.et=='department')?JSON.stringify(empDt.ei):empDt.ei;
				
				if (Staff_click_in_Depart && empDt.ed) {
					staff_group = true;
					// audits = (empDt.ed).reduce(function(a, b) { return a.concat(b); });
					audits = JSON.stringify( LeirAGS_Flaten(empDt.ed) );
				}
				
				var now = ''; 
				var now = dateToStringNetsuite( new Date() );
				var now = new Date( );
				
				var Yr = now.getFullYear();
				var Mh = now.getMonth();
				var Dy = now.getDate();
				
				var empDt = empDt;
				var datos = {
						'action'  : 'getAllMyWorkToday',
						'statusId': status,
						'auditId' : audits, // (empDt.et=='department')?JSON.stringify(empDt.ei):empDt.ei,
						'day'	  : now,
						'dayWay'  : dayWay,
						'ahora'	  : JSON.stringify( {'y':Yr,'m':Mh,'d':Dy} )
					};
				
				if (WF_DEBUG_AJAX)
					console.info('getAllMyWorkToday','getAllMyWorkToday .RT', datos );
					
					mirrorLog('getAllMyWorkToday','getAllMyWorkToday .RT', datos ); 

				$.ajax({
					url: getUrl().RT,
					data: datos,
					dataType: 'text',
					async: true,
					beforeSend: function(data) { },
					complete: function(data) { },
					success: function(data) {
						Tracing_Tasks_Obj = CleanResponseData(data);
						if(WF_DEBUG_AJAX_DATA)
							console.info('getAllMyWorkToday [data]',data);
						/*
						  From now 2017-April-15 this return TWO values
						  ---------------------------------------------
						  count = integer
						  rrows = object {
									'tasks' : {},
									'departments' : {},
									'salesorders' : {},
									'items' : {},
									'servicesaddresses' : {},
									'assigned' : {},
									'types': {},
									'process' : {},
									'subprocess' : {},
									'customers' : {},
								}
						*/
						
						if(! Tracing_Tasks_Obj['count'] || (! Tracing_Tasks_Obj.count )){
							//console.info('Edt',empDt);
							if (empDt.et=='department')
								$('#tracing-cnt').html('<p class="alert alert-info"> No task found, to department <b>"'+departmentsobj[empDt.ed].name+'"</b> for today...</p>'); // Clear Table Content
							else if (staff_group)
								$('#tracing-cnt').html('<p class="alert alert-info"> No task found, assigned for STAFF of <b>"'+employeesobj_my[empDt.eo].employeeName+'"</b> for today...</p>'); // Clear Table Content
							else 
								$('#tracing-cnt').html('<p class="alert alert-info"> No task found, assigned to <b>"'+employeesobj_my[empDt.eo].employeeName+'"</b> for today...</p>'); // Clear Table Content
							//console.info('Not Tasks Records Found');
							return;
						}
						
						//console.info(data.Tasks); 
						var rowH = '<h5>';
						if (empDt.et=='department')
							rowH += 'Tasks for department: <b>'+departmentsobj[empDt.ed].name+'</b>';
						else if(staff_group)
							rowH += 'Tasks for STAFF of <b>'+employeesobj_my[empDt.eo].employeeName+'</b>';
						else
							rowH += 'Tasks of <b>'+employeesobj_my[empDt.eo].employeeName+'</b>';
							
						rowH += '<span class="text-info pull-right" style="margin-left:6px;">count:'+Tracing_Tasks_Obj.count+'</span>';
						rowH += '<span id="tracing-filter-count" class="text-info pull-right">filtred:'+Tracing_Tasks_Obj.count+'</span>';
						rowH += '</h5>';
						
						var rows = '<table id="tracing-table" class="table table-striped table-hover table-bordered">';
						rows += '<thead>';
						rows += '<tr>'+
						'<th></th>'+
						'<th style="width:96px">SO</th>'+
						'<th>Task</th>'+
						((empDt.et=='department' || staff_group)?'<th>Assigned</th>' : '') +
						'<th>Start</th>'+
						'<th>Due</th>'+
						'<th>Status</th>'+
						'</tr>';
						rows += '</thead>';
						rows += '<tbody>';
						
						/*
							function p(a) { console.info(a); for(var b in a){ console.info(a[b]); } } p(Tracing_Tasks_Obj.rrows.tasks)
						*/
						Tracing_Tasks_Obj['empDt'] = empDt;
						Tracing_Tasks_Obj['staff_group'] = staff_group;
						
						for(var idx in Tracing_Tasks_Obj.rrows.tasks){
							tsk = Tracing_Tasks_Obj.rrows.tasks[idx];
							//rows += '<tr data-task=\''+JSON.stringify(tsk)+'\'>'+
							rows += '<tr data-tracingobj=\''+idx+'\'>'+ 
							'<td><a href="#ags_popup1" onClick="showPopUpTaskData(this)"><i class="glyphicon glyphicon-question-sign text-info task-info-pov" aria-hidden="true"></a></td>'+
							'<td class="overpointer">'+Tracing_Tasks_Obj.rrows.salesorders[tsk.SalesOrder]['label']+'<i class="glyphicon glyphicon-folder-open pull-right" aria-hidden="true" style="display:none"></i></td>'+
							'<td class="overpointer">'+tsk.Title+'<i class="glyphicon glyphicon-open-file pull-right" aria-hidden="true" style="display:none"></i></td>'+
							((empDt.et=='department' || staff_group)?'<td>'+Tracing_Tasks_Obj.rrows.assigned[tsk.Assigned]+'</td>' : '') +
							'<td>'+tsk.StartDate+'</td>'+
							'<td>'+tsk.DueDate+'</td>'+
							'<td>'+WF_G_TaskStatus[tsk.Status]+'</td>'+
							'</tr>';
							//-- rows+= '<tr><td colspan=6>'+LeirAGS_cnvObjTable(tsk)+'</td></tr>';
							if (tsk.note) { rows+= '<tr><td colspan=6>'+tsk.note+'</td></tr>'}
							if(tsk.KpiAddress) {
								// Name: Tracing_Tasks_Obj.rrows.tasks[idx]['city'] = Tracing_Tasks_Obj.rrows.cities[  Tracing_Tasks_Obj.rrows.servicesaddresses[ tsk.KpiAddress ]['city'] ];
								Tracing_Tasks_Obj.rrows.tasks[idx]['city'] = Tracing_Tasks_Obj.rrows.servicesaddresses[ tsk.KpiAddress ]['city'];
								Tracing_Tasks_Obj.rrows.tasks[idx]['state'] = Tracing_Tasks_Obj.rrows.servicesaddresses[ tsk.KpiAddress ]['state'];
							}
							// Add dates as date obj
							Tracing_Tasks_Obj.rrows.tasks[idx]['date_s'] = StringNetsuiteDateToDate( tsk.StartDate ).getTime();
							Tracing_Tasks_Obj.rrows.tasks[idx]['date_d'] = StringNetsuiteDateToDate( tsk.DueDate ).getTime();
						};
						
						rows += '</tbody>';
						rows += '</table>';
						var ShowMark = false;
						
						if(ShowMark)console.info('Mark-1');
						$('#tracing-cnt').html( rowH + rows );
						if(ShowMark)console.info('Mark-2');
						$('#tracing-table tbody td.overpointer').mouseover(function(){
							$(this).find('i').show();
						}).mouseleave(function(){
							$(this).find('i').hide();
						});
						if(ShowMark)console.info('Mark-3');
						$('#tracing-table tbody td').on( 'click',function(){ 
							var cols = ['info','so','task','assigned','start','due','status'], 
								col_i=$(this).index(), 
								col_n=cols[col_i],
								tracingobj=$(this).closest('tr').data('tracingobj'),
								task = Tracing_Tasks_Obj.rrows.tasks[tracingobj];
								//task=$(this).closest('tr').data('task');
							if(WF_DEBUG)
								console.info('Click on task',task);
							switch (col_n){
							case 'so':
								var curr_so_id = $("#IdSalesOrderBySpan").text();
								setTimeout(function(){
									if (curr_so_id != task.SalesOrder) {
										displaySObySpan (task.SalesOrder, 
													Tracing_Tasks_Obj.rrows.salesorders[task.SalesOrder]['label'],
													Tracing_Tasks_Obj.rrows.customers[task.company], 
													task.Title);
										openSOfromTab = 'tracing'; //'allsalesorder';
										clickinSO(task.SalesOrder);
										openSOfromTab = '';
									} else {
										jQScrollTo('IdSalesOrderBySpan');
									}
								},2);
								break;
							case 'task':
								open_so_and_locate_task_on_tree_tracing(
										task.SalesOrder, 
										Tracing_Tasks_Obj.rrows.salesorders[task.SalesOrder]['label'],
										Tracing_Tasks_Obj.rrows.customers[task.company], 
										task.id);
								break;
							default:
								break;
							}
							//--- console.info(col_i, col_n, task); 
							/* console.info(this,$(this).index(), $(this).closest('tr').data() ) */ 
						});
						if(ShowMark)console.info('Mark-4');
						// Set List Values
						 Tracing_List_Items = ['all'];
						 Tracing_List_Address = ['all'];
						 Tracing_List_Assigned = ['all'];
						 Tracing_List_Customers = ['all'];
						
						for(var idx in Tracing_Tasks_Obj.rrows.assigned){
							//Tracing_List_Assigned.push( {value: idx, label: Tracing_Tasks_Obj.rrows.assigned[idx]});
							Tracing_List_Assigned.push( Tracing_Tasks_Obj.rrows.assigned[idx] );
						}
						for(var idx in Tracing_Tasks_Obj.rrows.items){
							Tracing_List_Items.push( Tracing_Tasks_Obj.rrows.items[idx]);
						}
						for(var idx in Tracing_Tasks_Obj.rrows.servicesaddresses){
							Tracing_List_Address.push( Tracing_Tasks_Obj.rrows.servicesaddresses[idx]);
						}
						for(var idx in Tracing_Tasks_Obj.rrows.customers){
							Tracing_List_Customers.push( Tracing_Tasks_Obj.rrows.customers[idx]);
						}
						
						// Setup autocompletes---
						
					    var Tracing_accentMap = {
					        "á": "a", "í":"i", "ó":"o", "é":"e", "ú":"u",
					        "ñ": "n", "Ñ":"N", "ü":"u", "ö": "o"
					      };
					    
					    var Tracing_normalize = function( term ) {
					      var ret = "";
					      for ( var i = 0; i < term.length; i++ ) {
					        ret += Tracing_accentMap[ term.charAt(i) ] || term.charAt(i);
					      }
					      return ret;
					    };
					    if(ShowMark)console.info('Mark-5');
					    if(typeof Tracing_auto_assigne !== 'undefined') {
					    	Tracing_auto_assigne.list = Tracing_List_Assigned;
					    } else 
					    Tracing_auto_assigne = new Awesomplete( document.getElementById("tracing-assigned") , { 
					    	list:  Tracing_List_Assigned, 
					    	filter: function (text, input) {
					    		var matcher = new RegExp( input, "i" );
					    		return matcher.test( text ) || matcher.test( Tracing_normalize( text ) );
					    		return Tracing_normalize(text).indexOf( input ) != -1;
					    	}
					    });
					    if(ShowMark)console.info('Mark-6');
					    if(typeof Tracing_auto_item !== 'undefined') {
					    	Tracing_auto_item.list = Tracing_List_Items;
					    } else 
					    Tracing_auto_item = new Awesomplete( document.getElementById("tracing-items-i") , { 
					    	list:  Tracing_List_Items, 
					    	filter: function (text, input) {
					    		var matcher = new RegExp( input, "i" );
					    		return matcher.test( text ) || matcher.test( Tracing_normalize( text ) );
					    		return Tracing_normalize(text).indexOf( input ) != -1;
					    	}
					    });
					    if(ShowMark)console.info('Mark-7');
					    if(typeof Tracing_auto_address !== 'undefined') {
					    	Tracing_auto_address.list = Tracing_List_Address;
					    } else 
					    Tracing_auto_address = new Awesomplete( document.getElementById("tracing-address-i") , { 
					    	list:  Tracing_List_Address, 
					    	filter: function (text, input) {
					    		var matcher = new RegExp( input, "i" );
					    		return matcher.test( text ) || matcher.test( Tracing_normalize( text ) );
								return Tracing_normalize(text).indexOf( input ) != -1;
					    	}
					    });
					    if(ShowMark)console.info('Mark-8');
					    if(typeof Tracing_auto_customers !== 'undefined') {
					    	Tracing_auto_customers.list = Tracing_List_Customers;
					    } else 
					    	Tracing_auto_customers = new Awesomplete( document.getElementById("tracing-customers-i") , { 
					    	list:  Tracing_List_Customers, 
					    	filter: function (text, input) {
					    		var matcher = new RegExp( input, "i" );
					    		return matcher.test( text ) || matcher.test( Tracing_normalize( text ) );
								return Tracing_normalize(text).indexOf( input ) != -1;
					    	}
					    });
					    if(ShowMark)console.info('Mark-9');
					    // Setup selects
					    var opts_departs = '<option value="">all</option>';
					    for(var idx in Tracing_Tasks_Obj.rrows.departments){
					    	opts_departs += '<option value="'+idx+'">'+Tracing_Tasks_Obj.rrows.departments[idx]+'</option>';
						}
					    $('#tracing-departments').html(opts_departs);
					    if(ShowMark)console.info('Mark-10');
					    var opts_process = '<option value="">all</option>';
					    for(var idx in Tracing_Tasks_Obj.rrows.process){
					    	opts_process += '<option value="'+idx+'">'+Tracing_Tasks_Obj.rrows.process[idx]+'</option>';
						}
					    $('#tracing-process').html(opts_process);
					    if(ShowMark)console.info('Mark-11');
					    var opts_subprocess = '<option value="">all</option>';
					    for(var idx in Tracing_Tasks_Obj.rrows.subprocess){
					    	opts_subprocess += '<option value="'+idx+'">'+Tracing_Tasks_Obj.rrows.subprocess[idx]+'</option>';
						}
					    $('#tracing-subprocess').html(opts_subprocess);
					    if(ShowMark)console.info('Mark-12');
					    var opts_cities = '<option value="">all</option>';
					    for(var idx in Tracing_Tasks_Obj.rrows.cities){
					    	opts_cities += '<option value="'+idx+'">'+Tracing_Tasks_Obj.rrows.cities[idx]+'</option>';
						}
					    $('#tracing-cities').html(opts_cities);
					    if(ShowMark)console.info('Mark-13');
					    var opts_states = '<option value="">all</option>';
					    for(var idx in Tracing_Tasks_Obj.rrows.states){
					    	opts_states += '<option value="'+idx+'">'+Tracing_Tasks_Obj.rrows.states[idx]+'</option>';
						}
					    $('#tracing-states').html(opts_states);
					    if(ShowMark)console.info('Mark-14');
					    var opts_items = '<option value="">all</option>';
					    for(var idx in Tracing_Tasks_Obj.rrows.items){
					    	opts_items += '<option value="'+idx+'">'+Tracing_Tasks_Obj.rrows.items[idx]+'</option>';
						}
					    $('#tracing-items').html(opts_items);
					    if(ShowMark)console.info('Mark-15');
					    var opts_address = '<option value="">all</option>';
					    for(var idx in Tracing_Tasks_Obj.rrows.servicesaddresses){
					    	opts_address += '<option value="'+idx+'">'+Tracing_Tasks_Obj.rrows.servicesaddresses[idx]['name']+'</option>';
						}
					    $('#tracing-address').html(opts_address);
					    if(ShowMark)console.info('Mark-16');
					    var opts_customers = '<option value="">all</option>';
					    for(var idx in Tracing_Tasks_Obj.rrows.customers){
					    	opts_customers += '<option value="'+idx+'">'+Tracing_Tasks_Obj.rrows.customers[idx]+'</option>';
						}
					    $('#tracing-customers').html(opts_customers);
					    if(ShowMark)console.info('Mark-17');
					    flatpickr('.toDatePickerFilter', {
							dateFormat: CalendarInputFormat
						}); // initialized picker
					    
						//---
						// Fix slectors styles
						//.4.
						
						loaderEnd();
					},
					error: function(e) {
						loaderEnd();
						alert("Error on NetSuite Call GetAllMyWorkToday");
						console.error("Erron on NetSuite Call GetAllMyWorkToday()",e);
					}
				});
			} // End of GetAllMyWorkToday function
//---GetAllMyWorkToday<
			
			
//---GetStatsToday>
	window.getStatsToday = function getStatsToday( getfullstats ) {
				if (WF_DEBUG)
					console.info('getStatsToday()');
				
				loaderStart();
				
				var status = '';
				var dayWay = 'today';
				if (getfullstats) dayWay = 'ignore';
				
				var audits = (WorkForce_Obj.auditId) ? WorkForce_Obj.auditId : WorkForce_Obj.userID;
				var now = new Date( );
				var Yr = now.getFullYear();
				var Mh = now.getMonth() + 1;
				var Dy = now.getDate();
				
				var datos = {
						'action'  : 'getStatsToday',
						'statusId': status,
						'auditId' : audits, // (empDt.et=='department')?JSON.stringify(empDt.ei):empDt.ei,
						'day'	  : now,
						'dayWay'  : dayWay,
						'ahora'	  : JSON.stringify( {'y':Yr,'m':Mh,'d':Dy} )
					};
				
				if (WF_DEBUG_AJAX)
					console.info('getStatsToday','getStatsToday .RT', datos );
					
					mirrorLog('getStatsToday','getStatsToday .RT', datos ); 

				$.ajax({
					url: getUrl().RT,
					data: datos,
					dataType: 'text',
					async: true,
					beforeSend: function(data) { },
					complete: function(data) { },
					success: function(data) {
						WF_Tasks_Stats = CleanResponseData(data);
						if(WF_DEBUG_AJAX_DATA)
							console.info('getStatsToday [data]',WF_Tasks_Stats);
							
						function p100(a,b){ return ((b!=0)?((a / b)*100).toFixed(0):'0')+'%' };
						
						var ids_prefix = (getfullstats)? '#leirags-stf-' : '#leirags-st-';  
						
						$(ids_prefix+'an').html(WF_Tasks_Stats.status.Active); 
							$(ids_prefix+'ap').html( '' /* p100(WF_Tasks_Stats.status.Active, WF_Tasks_Stats.tasks.count ) */);
						$(ids_prefix+'bn').html("" /* WF_Tasks_Stats.deviation.positive + '+' */);
							$(ids_prefix+'bp').html(WF_Tasks_Stats.deviation.negative + '');
						$(ids_prefix+'cn').html(WF_Tasks_Stats.ack.false); 
							$(ids_prefix+'cp').html( p100(WF_Tasks_Stats.ack.false, WF_Tasks_Stats.tasks.count ) );
						$(ids_prefix+'dn').html(WF_Tasks_Stats.status.Completed); 
							$(ids_prefix+'dp').html( p100(WF_Tasks_Stats.status.Completed, WF_Tasks_Stats.tasks.count ) );
						$(ids_prefix+'en').html(WF_Tasks_Stats.tasks.count); 
							$(ids_prefix+'ep').html(WF_Tasks_Stats.salesorders.count);
							
						$(ids_prefix+'fn').html('');
							$(ids_prefix+'fp').html('');
						
						loaderEnd();
					},
					error: function(e) {
						loaderEnd();
						alert("Error on NetSuite Call getStatsToday");
						console.error("Erron on NetSuite Call getStatsToday()",e);
					}
				});
			} // End of getStatsToday function
//---getStatsToday<


//---getMyNotifications>
			getMyNotifications = function getMyNotifications(inout) {
				if (WF_DEBUG_NOTIFICATIONS_CALLS)
					console.info('getMyNotifications()');
				
				var status = 1; // String( $('#tracing-status').val() );
				var dayWay = 1; // $('#tracing-dates').val();
				var now = '';
				var last_date = WF_Notifications_Last.last_dt;
				var last_id = WF_Notifications_Last.last_id;
				
				if(inout=='incoming') {
					if (! WF_Notifications_Last.last_id)
						$('#notif-cnt').html('Retrieving...'); // Clear Table Content
					
					// Update Stat bar
					var getfullstats = true;
					var ids_prefix = (getfullstats)? '#leirags-stf-' : '#leirags-st-';  	
					$(ids_prefix+'fn').html(WF_Notifications_Last.cnt);
					$(ids_prefix+'fp').html('');
				} else {
					last_date = WF_Notifications_Last_Out.last_dt;
					last_id = WF_Notifications_Last_Out.last_id;
				}
				
				var datos = {
						'action'	: 'getMyNotifications',
						'status'	: status,
						'auditId'	: (WorkForce_Obj.auditId)?WorkForce_Obj.auditId:'0',
						'day'		: now,
						'dayWay'	: dayWay,
						'last_date' : last_date,
						'last_id'	: last_id,
						'inout'		: inout
					};
				
				if (WF_DEBUG_NOTIFICATIONS_CALLS)
					console.info('getMyNotifications','getMyNotifications .RT', datos );
					
					//mirrorLog('getMyNotifications','getMyNotifications .RT', datos ); 

				$.ajax({
					url: getUrl().RT,
					data: datos,
					dataType: 'text',
					async: true,
					beforeSend: function(data) { },
					complete: function(data) { loaderEnd(); },
					success: function(data) {
						data = CleanResponseData(data);
						if(WF_DEBUG_NOTIFICATIONS_CALLS)
							console.info('Return[data]',data);
						
						if (inout == 'outgoing') {
							data.Messages.forEach(function(msj) {
								var nstamp = new Date(msj.stamp).getTime();
								if(nstamp > WF_Notifications_Last_Out.last_tm) {
									WF_Notifications_Last_Out.last_dt = msj.stamp;
									WF_Notifications_Last_Out.last_tm = nstamp;
									WF_Notifications_Last_Out.last_id = msj.id;
									WF_Chat_Obj.pushMessage(msj,inout);
								}
							});
							return true;
						}
						
						/*
						  From now 2017-March-1 this return two arrays
						  ---------------------------------------------
						  Messages -- All Messages.
						*/
						
						if(! data['Messages'] || (data.Messages && !(data.Messages).length )){
							if(! WF_Notifications_Last.last_id) {
								$('#notif-cnt').html( '<p class="info">Not Messages records found.</p>' );
							}
							if (WF_DEBUG_NOTIFICATIONS_CALLS)
								console.info('Not Messages records found.');
							return true;
						}
						
						//console.info(data.Messages);
						var rowH = '';
						var rows = '';
						var notif_add = false;
						
						if(! WF_Notifications_Last.last_id) {
							rowH = '<h5>Messages';
							rowH += '<span id="notif-counter" class="label label-info pull-right">count: '+(data.Messages).length+'</span>';
							rowH += '</h5>';
								
							rows = '<table id="notif-cnt-table" class="table table-striped table-hover table-bordered">';
							rows += '<thead>';
							rows += '<tr>'+
									'<td>From</td>'+
									'<td>Task</td>'+
									'<td>Message</td>'+
									'<td>Status</td>'+
									'</tr>';
							rows += '</thead>';
							rows += '<tbody>';
							WF_Notifications_Last.cnt = 0;
						} else {
							notif_add = !notif_add;
						}
						
						data.Messages.forEach(function(msj) {
							if (!notif_add){
								if (msj.typen == 'Chat') {
									WF_Chat_Obj.pushMessage(msj,inout);
								} else {
								// Add All...
								var msjcontent = decodeHTMLEntities(msj.message);
								rows += '<tr data-notifID="'+msj.id+'">'+
									'<td style="width:10%">'+msj.fromn+'<br>'+msj.stamp+'<br>'+msj.typen+'</td>'+
									'<td style="width:30%"><span class="label label-info" style="width : 70px; display: inline-block;">SalesOrder</span> '+(msj.son).split('#').pop()+
									'<br><span class="label label-success" style="width : 70px; display: inline-block; cursor : pointer;" onMouseOver="" onClick="getTaskNotesFull('+msj.task+')" title="Show Communication">Task</span> '+msj.taskn+'</td>'+
									'<td style="width:50%"><div>'+decodeHTMLEntities(msj.message)+'</div></td>'+
									'<td style="width:10%">'+msj.statusn+'<br><span class="label label-info message-viewed">Viewed</label></td>'+
									'</tr>';
								}
							}
							var nstamp = new Date(msj.stamp).getTime();
							if(nstamp > WF_Notifications_Last.last_tm) {
								WF_Notifications_Last.last_dt = msj.stamp;
								WF_Notifications_Last.last_tm = nstamp;
								WF_Notifications_Last.last_id = msj.id;
								if(notif_add) {
									var msjcontent = decodeHTMLEntities(msj.message);
									if (msj.typen == 'Chat') {
										WF_Chat_Obj.pushMessage(msj,inout);
									} else {
									rows += '<tr data-notifID="'+msj.id+'">'+
										'<td style="width:10%">'+msj.fromn+'<br>'+msj.stamp+'<br>'+msj.typen+'</td>'+
										'<td style="width:30%"><span class="label label-info" style="width : 70px; display: inline-block;">SalesOrder</span> '+(msj.son).split('#').pop()+
										'<br><span class="label label-success" style="width : 70px; display: inline-block; cursor : pointer;" onMouseOver="" onClick="getTaskNotesFull('+msj.task+')" title="Show Communication">Task</span> '+msj.taskn+'</td>'+
										'<td style="width:50%"><div>'+decodeHTMLEntities(msj.message)+'</div></td>'+
										'<td style="width:10%">'+msj.statusn+'<br><span class="label label-info message-viewed">Viewed</label></td>'+
										'</tr>';
									}
									var msjToText = LeirAGS_Encoder.extractText(msjcontent,'textonly');
									show_notification('From <b>'+msj.fromn+'</b><hr>'+msjToText.substring(0,160), 'info', true);
									notifyOnDesktop(msj.fromn+'\n'+msjToText.substring(0,60)+'...');
								}
								WF_Notifications_Last.cnt++;
							}
						});
						
						if(notif_add) {
							$('#notif-cnt-table tbody').prepend(rows);
						} else {
							rows += '</tbody>';
							rows += '</table>';
							$('#notif-cnt').html( rowH + rows );
						}
						$('#notif-counter').html("count: "+WF_Notifications_Last.cnt);
						$('#notif-stat').html('Msgs: '+WF_Notifications_Last.cnt);
						
						var getfullstats = true;
						var ids_prefix = (getfullstats)? '#leirags-stf-' : '#leirags-st-';  	
						$(ids_prefix+'fn').html(WF_Notifications_Last.cnt);
							$(ids_prefix+'fp').html('');
						
						$('.message-viewed').on('click',function(){
							console.info('Click in Viewed');
							var $tr = $(this).closest('tr')[0];
							var $td = $(this).closest('td')[0];
							var notif_data = $($tr).data();
							console.info('Tr', $tr, notif_data);
							$($td).html('Viewed');
							setViewNotifications(notif_data.notifid);
						});
						
						//loaderEnd();
					},
					error: function(e) {
						//loaderEnd();
						//- alert("Error on NetSuite Call getMyNotifications");
						if (WF_DEBUG)
							console.error("Erron on NetSuite Call getMyNotifications()",e);
					}
				});
			} // End of getMyNotifications function
//---getMyNotifications<
			
			
//---setViewNotifications>
			function setViewNotifications(notification_id) {
				if (WF_DEBUG)
					console.info('setViewNotifications(notification_id)', notification_id);
				var datos = {
							'action': 'setViewNotifications',
							'id'	: notification_id
						};
				if (WF_DEBUG_AJAX)
					console.info('setViewNotifications',"setViewNotifications .BSL", datos);
					mirrorLog('setViewNotifications','setViewNotifications .BSL', datos ); 
				$.ajax({
					url: getUrl().BSL,
					data: datos,
					async: false,
					dataType: 'text',
					success: function(data) { },
					error: function(err) {
						//alert('Error on NetSuite call setViewNotifications');
						//console.error('Error on NetSuite call', err);
					}
				});
				loaderEnd();
			}
//---setViewNotifications<

		function decodeHTMLEntities(text) {
		    var entities = [
		        ['amp', '&'],
		        ['apos', '\''],
		        ['#x27', '\''],
		        ['#x2F', '/'],
		        ['#39', '\''],
		        ['#47', '/'],
		        ['lt', '<'],
		        ['gt', '>'],
		        ['nbsp', ' '],
		        ['quot', '"']
		    ];
		
		    for (var i = 0, max = entities.length; i < max; ++i) 
		        text = text.replace(new RegExp('&'+entities[i][0]+';', 'g'), entities[i][1]);
		
		    return text;
		}

//---GetAllMyWork>
			function getAllMyWork(slice, status, fromFilter, deviated) {
				if (WF_DEBUG)
					console.info('getAllMyWork(slice, status, fromFilter)', slice, status, fromFilter);
				
				loaderStart();
				$('#AllMyWorkResume').html('');
				
				if (!status)
					status = 1;
				
				// tamSlice asigns the number of records to get and be added to the correspondant table
				var tamSlice = 100;
				var now = '';
				var theTeam = '';
				
				// Se hara una opcion para indicar cuales tareas son las de HOY.
				if ( $('#today-tasks').is(':checked')) {
					now = dateToStringNetsuite( new Date( ) );
					var now = new Date( ); // IMPORTANT: is necesary send as date, then use a var, here to create new type of object.
				}
				
				// Se le da la opcion al usuario.supervisor de ver las tareas de su equipo.
				if ( $('#myteam-tasks').is(':checked')) {
					theTeam = JSON.stringify(WorkForce_MyTeam);
				}
				
				var datos = {
						'action'  : 'getAllMyWork',
						'statusId': status,
						'auditId' : (WorkForce_Obj.auditId)?WorkForce_Obj.auditId:'',
						'day'	  : now,
						'theTeam' : theTeam,
					};
				
				if (WF_DEBUG_AJAX)
					console.info('getAllMyWork','getAllMyWork .RT', datos );
					
					mirrorLog('getAllMyWork','getAllMyWork .RT', datos ); 

				$.ajax({
					url: getUrl().RT,
					data: datos,
					dataType: 'text',
					async: true,
					beforeSend: function(data) {
						$('#AllMyWork').DataTable().destroy();
						$('#AllMyWork > tbody > tr').remove();
						destroyFlyDatePickers('myWork');
					},
					complete: function(data) {
						//-- $(".loader").hide('fast');
					},
					success: function(data) {
						data = CleanResponseData(data);
						if(WF_DEBUG_AJAX_DATA)
							console.info('Return[data]',data);
						/*
						  From now 2017-March-1 this return two arrays
						  ---------------------------------------------
						  SOdata -- All Sales Orders involved
						  			fields: 
						  				tso_id : "437770"
						  				tso_label : "SO-1-2441"
						  				tso_memo : "Migración de DIA de 20 Mbps de FO a MO recuperada en sitio Lear CC30. CID que aparece en NS: 1-13788228"

						  Tasks -- All Tasks.
						*/
						
						if(! data['Tasks'] ){
							console.info('Not Tasks Records Found');
							return;
						}
						
						//33333333333
						var moreslice = tamSlice;
						var AllRows = data.Tasks.length;
						
						if (slice == "all") {
							$("table#AllMyWork > tbody > tr ").remove();
							slice = 0;
							moreslice = AllRows;
						} else if (slice != undefined) {
							moreslice = parseInt(slice) + tamSlice;
						} else {
							$("table#AllMyWork > tbody > tr ").remove();
							slice = 0;
						}
						
						$('#ButtonLoadMoreAllWork').prop('disabled', (moreslice > AllRows) );

						var rows;
						var count = 0;
						var ancount = 0; // slice;
						var WorkWeekendDisplay;
						var onChangeAckEnable = "onchange='changeAck.call(this)'";
						var onChangeAssignedEnable = 'onchange="changeSelectAsignee.call(this)"';
						var onChangeStatusEnable = 'onchange="changeselTaskStatus.call(this)"';
						var onChangeStartEnable = 'onchange="changeidPickerStartDate.call(this)"';
						var onChangeDueEnable = 'onchange="changeidPickerDueDate.call(this)"';
						var onChangeWoWEnable = "onchange='changeWorkOnWeekends.call(this)'";
						var StatusTaskLabel = ['', 'Active', 'Completed', 'Deferred', 'Cancelled'];
						var BoolAck;
						var vFilteredEmployeesList;
						var vFilteredStatusList;
						var StatusTareaTexto = '';
						var disableChangeEmployee;
						var empName;
						var enableEdit;
						
						//--- Save SalesOrder Data ---
						//data.SOdata[d.SalesOrderID].tso_memc
						myWorkSOdata = data.SOdata;
						//----------------------------
						var img_url = WF_whs(	'id=6521300&c=3461650&h=58f8ca4c67fada1f48d0',
												'id=8153908&c=3461650&h=4dfa99e3b987f3f8aad9');
						//----------------------------
						data.Tasks.forEach(function(d) {
							if (deviated && d.deviation >= 0) return;
							ancount++;
							GlobalStartDate = d.GlobalStartDate;
							GlobarDueDate = d.GlobalDueDate;
							count = "myWork" + ancount;
							empName = getEmployeeName(d.taskAssignedID);
							disableChangeEmployee = false;
							
							// If the employee works on Weekends then make the check input to be marked
							if (d.taskWorkWeekend) {
								// This will input something like: $("input[id='WorkOnWeekends_7']").attr('checked', true)
								WorkWeekendDisplay = "<input type='checkbox' onchange='' id='WorkOnWeekends_" + count + "' name='check' class='check' checked /><p style='font-size:0px;position:absolute;'>true</p>"
							} else {
								WorkWeekendDisplay = "<input type='checkbox' onchange='' id='WorkOnWeekends_" + count + "' name='check' class='check' /><p style='font-size:0px;position:absolute;'>false</p>"
							}
							
							if (d.taskAck) {
								BoolAck = "<input type='checkbox' onchange='' id='Ack_" + count + "' name='check' disabled class='check' data-oldAck='true' checked />"
							} else {
								BoolAck = "<input type='checkbox' onchange='' id='Ack_" + count + "' name='check' class='check' data-oldAck='false' />"
							}
							
							vFilteredStatusList = lstStatusSelect;
							
							if (d.taskStatus) {
								vFilteredStatusList = lstStatusSelect.replace('value="'+d.taskStatus+'"', 'value="'+d.taskStatus+'" '+"selected");
							}

							vFilteredStatusList = vFilteredStatusList.replace('class="selectTaskStatus"', 'class="selectTaskStatus" title="You won\'t be able to update this task once the status changes to "completed or cancelled"');
							vFilteredStatusList = vFilteredStatusList.replace('id="selTaskStatus"', 'id="selTaskStatus' + count + '"');
							StatusTareaTexto = StatusTaskLabel[d.taskStatus];

							vFilteredStatusList = vFilteredStatusList.replace('</select>', '</select><p  class="kiko" style="font-size:0px;position:absolute;">' + StatusTareaTexto + '</p>');
							
							// Disable Start Date and Due Date if user ID don't match for the current row
							dtaskStartDate = d.taskStartDate;
							dtaskDueDate = d.taskDueDate;
							dtaskDuration = "<input id='idTask_Duration_" + count + "' onblur='blurDuration.call(this)' onkeyup='changeDuration.call(this)' data-dependency='" + d.taskDependency + "' data-task='true' data-predecessor='" + d.taskPredecessor +
								"' type='text' size='3' value=" + d.taskDuration + " data-wrikeid='" + d.WrikeID + "' data-salesorder='" + d.SalesOrderID + "'>";
							//dtaskUpdateIcon = "<div id='dico" + count + "' class='GoUpdateDisabled'></div>";
							dtaskUpdateIcon = "<div onclick='clickdico.call(this)' data-task='true' id='dico" + count + "' class='GoUpdateDisabled'></div>";
							
							//WHO CAN EDIT-------------------------------------------------------------
							enableEdit = getEnableEdit(d.taskAssignedID, d.taskStatus);
							disableChangeEmployee = ! enableChangeAssigned;
							//------------MyWorkTasks--
							
							var vFilteredStatusList_No = vFilteredStatusList;
							
							if (enableEdit){
								if (WorkForce_Obj.userID == d.taskAssignedID) 
									BoolAck = BoolAck.replace("onchange=''", onChangeAckEnable);
								else
									BoolAck = BoolAck.replace('input type', 'input disabled type');
								vFilteredStatusList_No = vFilteredStatusList.replace('select name', 'select disabled name');
								WorkWeekendDisplay = WorkWeekendDisplay.replace("onchange=''", onChangeWoWEnable);
								vFilteredStatusList = vFilteredStatusList.replace('onchange=""', onChangeStatusEnable);
								vFilteredStartDate = dtaskStartDate.replace('onchange=""', onChangeStartEnable);
								vFilteredDueDate = dtaskDueDate.replace('onchange=""', onChangeDueEnable);
								vFilteredEmployeesList = '<input type="hidden" value="'+d.taskAssignedID+'" id="selectAsignee'+count+'" '+onChangeAssignedEnable+'>'+
														 '<input class="employeeSelectFly" type="text" value="'+empName+'" '+((disableChangeEmployee)? 'disabled': ' onClick="selectassignee(this)" data-onchg="selectAsignee'+count+'"' )+' />';
								
								//DISABLE DATE FIELDS BASED ON DEPENDENCY --------------------------------------
								if ((d.taskDependency == "startToStart") || (!d.taskAck))
									vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
								
								if ((d.taskDependency == "startToFinish" || d.taskDependency == "finishToFinish") || (!d.taskAck))
									vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
								
							} else {
								disableChangeEmployee = true;
								BoolAck = BoolAck.replace('input type', 'input disabled type');
								WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
								vFilteredStatusList_No = vFilteredStatusList.replace('select name', 'select disabled name');
								vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name');
								vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
								vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
								dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
								dtaskUpdateIcon = "<div onclick='clickdico(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
								vFilteredEmployeesList = '<input type="hidden" value="'+d.taskAssignedID+'" id="selectAsignee'+count+'">'+
														 '<input class="employeeSelectFly" type="text" value="'+empName+'" disabled data-onchg="selectAsignee'+count+'">';
								
							}
							
							flagColorRedRow = getColorTaskValidate(d.setColortoRedOutDated, d.yellow, d.taskStatus);
							
							var EditStatus_No = "<td id='TaskStatus_" + count + "' " + flagColorRedRow + ">" + vFilteredStatusList_No + "</td>";
							
							var EditStatus_Yes= "<td id='TaskStatus_" + count + "' " + flagColorRedRow + "> <span style='display:none;'>" + vFilteredStatusList + "</span>" +
							'<div class="dropdownF" style="width:100%;">\
							  <p class="dropbtnF" onClick="var elem=$(\'#sss_'+count+'r\'); if($(elem).css(\'display\')==\'none\') $(elem).css(\'display\',\'block\'); else $(elem).css(\'display\',\'none\');" >'+StatusTaskLabel[d.taskStatus]+'<span class="glyphicon glyphicon-menu-down pull-right" aria-hidden="true"></span></p>\
							  <div class="dropdown-content" id="sss_'+count+'r">\
							    <a href="#" onClick="$(\'#sss_'+count+'r\').css(\'display\',\'none\'); $(\'#selTaskStatus'+count+'\').val(1).trigger(\'change\');" ><span class="glyphicon glyphicon-time" aria-hidden="true" style="margin-right:16px"></span> Active</a>\
							    <a href="#" onClick="$(\'#sss_'+count+'r\').css(\'display\',\'none\'); $(\'#selTaskStatus'+count+'\').val(2).trigger(\'change\');" ><span class="glyphicon glyphicon-check" aria-hidden="true" style="margin-right:16px"></span> Completed</a>\
							    <a href="#" onClick="$(\'#sss_'+count+'r\').css(\'display\',\'none\'); cancellingTask('+d.taskId+',\''+count+'\','+d.SalesOrderID+'); /*$(\'#selTaskStatus'+count+'\').val(4).trigger(\'change\');*/" ><span class="glyphicon glyphicon-remove" aria-hidden="true" style="margin-right:16px"></span> Cancelled</a>\
							    <!-- a href="#" onClick="$(\'#sss_'+count+'r\').css(\'display\',\'none\'); $(\'#selTaskStatus'+count+'\').val(3).trigger(\'change\');" ><span class="glyphicon glyphicon-remove-sign" aria-hidden="true" style="margin-right:16px"></span> Deferred</a -->\
							  </div>\
							</div>'+
							"</td>";
							
							
							// row-getallmywork
							rows += "<tr id='" + count + "' data-id=" + d.taskId + " data-userid=" + d.taskAssignedID + " data-toshow='" + d.taskKpiLine + "_" + d.taskKpiItem + "' data-toshowaddress='" + d.taskKpiAddress + "' data-soname='"+d.SalesOrder+"'>" +
								"<td>"+ancount + ((disableChangeEmployee)?"":" <input type='checkbox' class=\"mywork-reasigne\"/>") +"</td>"+
								"<td class='gradCell'>"+ d.company + "</td>" +
								// "<td align='center' class='gradCell'><a href='#' class='idClickToSalesOrder' data-cmp='"+d.company+"' data-salesorderID='" + d.SalesOrderID + "'> " + d.SalesOrder + " </a></td>" +
								"<td>"+
								" <div class='idClickToSalesOrder' \
								style='text-align:center;padding:3px;width:100%;heigth:100%;background-color:#EEE;' \
								onmouseover=\"this.style.background='#DDD';\" \
								onmouseout=\"this.style.background='#EEE';\" \
								data-cmp='"+d.company+"' data-salesorderID='"+d.SalesOrderID+"'>"+
								"  <img class=\"record-icon salesorder\" src=\"/uirefresh/img/recordicon/salesorder.svg\" alt=\"\" role=\"presentation\"><br/><span style='color:#3030FF; font-size:11px;'>"+d.SalesOrder+"</span>"+
								" <div>"+
								"</td>" +
								
								"<td align='left'>"+
								" <span id='vtaskID" + count + "' style='display:none'>" + d.taskId + "</span> "+
								'<div class="dropdown">\
								  <p class="dropbtn">'+d.taskTitle+'</p>\
								  <div class="dropdown-content">\
								    <a href="#" onClick="getTaskNotes('+d.taskId+','+d.SalesOrderID+',\''+(d.taskTitle).replace(/'/g,"\\'")+'\',this); jQScrollTo(\'task-messages\');">'+getNetSuiteImage('note', false)+' Open Comments Task [B]</a>\
								    <a href="#" onClick="openNetSuiteTask('+d.taskId+')">'+getNetSuiteImage('netsuite15', false)+' Open NetSuite Task</a>\
								    <a href="#" data-cmp="'+d.company+'" data-soname="'+d.SalesOrder+'" onClick="open_so_and_locate_task_on_tree(this,'+d.SalesOrderID+','+d.taskId+')">'+getNetSuiteImage('tree-structure-b', false)+' Show in Tree-View</a>\
								    <!-- '+((d.WrikeID)?'<a href="#" class="toOpenWrike" data-taskid="'+d.taskId+'" data-wrikeid="'+d.WrikeID+'">'+getNetSuiteImage('wrike', false)+' Add Comment</a>':'<p>'+getNetSuiteImage('wrike', false)+' No Write Comments</p>')+' --> \
								    <a href="#" onClick="getPredesesorsBranch('+d.taskId+',true)">'+getNetSuiteImage('tasks-c-16', false)+' Dependency Chain </a>\
								    <a href="#" onClick="getSuccessorsBranch('+d.taskId+',true)">'+getNetSuiteImage('tasks-c-16', false)+' Successor Chain</a> \
								    '+((d.taskStatus != 1 && WorkForce_Obj.rolePM)?'<a href="#" onClick="reactivateTask('+d.taskId+',\''+count+'\','+d.SalesOrderID+')">'+getNetSuiteImage('todo-list-c-24', false)+' Re-Activate Task</a>':'')+' \
								  </div>\
								</div>'+
								"</td>"+
								
								"<td class='styleToEntity' " + flagColorRedRow + ">" + vFilteredEmployeesList + "</td>" +
								"<td align='center' id='TaskAck_" + count + "' " + flagColorRedRow + ">" + BoolAck + "</td>" +
								
								(((WorkForce_Obj.userID == d.taskAssignedID || WorkForce_Obj.auditId == d.taskAssignedID || WF_Develop_State ) && (d.taskAck && d.taskStatus==1))? EditStatus_Yes : EditStatus_No) +
								
								"<td " + flagColorRedRow + ">" + vFilteredStartDate + "</td>" +
								"<td " + flagColorRedRow + ">" + vFilteredDueDate + "</td>" +
								"<td align='center' " + flagColorRedRow + ">" + WorkWeekendDisplay + "</td>" +
								"<td align='center' " + flagColorRedRow + ">" +"<p style='font-size:0px;position:absolute;'>" + d.taskDuration + "</p>" + dtaskDuration + ((deviated) ? "<br>Dev:"+d.deviation+" " : "") +"</td>" +
								// +"<td align='center' "+flagColorRedRow+" display='none'>"+dtaskUpdateIcon+"</td>"
								"</tr>";
						});
						
						$("table#AllMyWork > tbody").append(rows);
						
						$('[id^=idPicker_]').on('click',function(){
							addDatePickerOnFly( this );
						});
						
						setTimeout(function() {
							if ($.fn.dataTable.isDataTable('#AllMyWork')) {
								$('#AllMyWork').DataTable().destroy();
							}
							$('#AllMyWork').DataTable({
								"dom": '<"top"if>rt<"bottom"lp><"clear">',
								"autoWidth": true, //--evitar cambio de tamano
								"bInfo": true,
								//"deferRender": true,
								"paging": false,
								"responsive": true,
								//-- "scrollCollapse": true,
								//-- "scrollY": "600px",
								"scroller": true,
								"searching": true,
								"ordering": true,
								"columns": [
									 null, null, null, null, { "orderDataType": "dom-sort-emp", type: 'string' }, null,
						             null, null, null, null, null
						             //{ "orderDataType": "dom-text-numeric" },
						             //{ "orderDataType": "dom-text", type: 'string' },
						             //{ "orderDataType": "dom-select" }
						             //{ "orderDataType": "sort_tranid" } --- created to SALESORDER tables...
						          ],
								"order": [
									[4, "asc"]
								],
								"oLanguage": {
									 "sInfo": "Showing 1 to _END_ of "+AllRows+" entries"
								 }
							}).on( 'search.dt', function () {
							    //-- $('#contenting').html( 'Currently applied global search: '+ $('#AllMyWork').DataTable().search() );
							    // Unmark ALL checkbox's
							    $('input.mywork-reasigne').each(function(){
									$(this).prop("checked", false );
								});
							    $('#mywork_group_assigne').val('0'); // Clear Assignne Group ID
							    $('#mywork_group_assigne_name').val(''); // Clear Assignne Group Name
							    $('#select-assignee-group').fadeOut();
							} );
							if(WorkForce_Obj.Env!="SANDBOX")$('table.dataTable thead .sorting').css('background-image','none');
							showMyWorkSalesOrdersResumen();
							loaderEnd();
						}, 100); // Was 1000

					},
					error: function(e) {
						loaderEnd();
						alert("Error on NetSuite Call GetAllMyWork");
						console.error("Erron on NetSuite Call GetAllMyWork()",e);
					}
				});
			} // End of GetAllMyWork function
//---GetAllMyWork<
			getAllMyWorkExtra = getAllMyWork;

//--- GetPageSalesOrder>

			function GetPageSalesOrder(IDTable,fromfilter,addStep){
				var currentStep = $('#ButtonLoadMore_'+IDTable).attr('data-slice');
				if(fromfilter) currentStep = 0;
				if(addStep) currentStep++;
				$('#ButtonLoadMore_'+IDTable).attr('data-slice',currentStep);
				return (currentStep < 0)? 0: currentStep; // Fix when are negative.
			}

//--- GetPageSalesOrder<


//---GetSalesOrdersbyID>
			function GetSalesOrdersbyID(IDTable, idUser, SOStatus, fromfilter, nameSo) {
				if (WF_DEBUG)
					console.info('GetSalesOrdersbyID(IDTable, idUser, SOStatus, nameSo)', {'IDTable':IDTable, 'idUser':idUser, 'SOStatus':SOStatus, 'nameSo':nameSo });
				
				loaderStart();
				
				SOStatus = String(SOStatus);
				var rtotItems = 0,
					rtotLocations = 0,
					rtotMRR = 0.0,
					rtotNRR = 0.0;
				var formatter = new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD',
					minimumFractionDigits: 2,
				});
				
				nameSo = "";
				var AllRows = 0;
				var AllPages = 0;
				var addPage = false;
				var pagesel = GetPageSalesOrder(IDTable, fromfilter, addPage);
				
				var datos = {
					'action': 'getMySalesOrders',
					'IdUser': idUser,
					'SOStatus': SOStatus,
					'isPm': WorkForce_Obj.rolePM,
					'PageSelected': pagesel,
					'nameSo' : getNameSOfromField(IDTable),
					'auditId': WorkForce_Obj.auditId
				};

				if (WF_DEBUG_AJAX)
					console.info("GetSalesOrdersbyID()","getMySalesOrders .RT", datos);

					mirrorLog('GetSalesOrdersbyID()','getMySalesOrders .RT', datos ); 

				// Function to get Sales Orders at beggining of execution
				if(WF_DEBUG)console.info('Name of So ',getNameSOfromField(IDTable));
					
				$.ajax({
					url: getUrl().RT,
					data: datos,
					dataType: 'text',
					complete: function() {
						$('.dataTables_scrollFoot').hide();
					},
					beforeSend: function(data) {
						$('#' + IDTable).DataTable().destroy();
						$('#ButtonLoadMore_'+IDTable).prop('disabled', true);
						if(fromfilter)
							$('#' + IDTable + ' tbody tr').remove();
						$('.dataTables_scrollFoot').hide();
					},
					success: function(data) {
						data = CleanResponseData(data);
						displaySObyID(data, IDTable, fromfilter);
					},
					error: function(err) {
						loaderEnd();
						alert('Erron on NETSuite call GetSalesOrdersbyID',err);
						if (WF_DEBUG)
							console.log('Error on NETSuite call GetSalesOrdersbyID', err);
					}
				}); // End of Ajax
			}
//---GetSalesOrdersbyID<
			
			function displaySObyID(data, IDTable, fromfilter){
				// Validate if return records correctly
				if (data.length == 4){
					AllRows = data[0];
					// data[1] --- rows
					// data[2] --- totals
					AllPages = data[3] -1; // Fix pages index start on CERO.
				} else {
					alert('No records found.');
					console.info('getMySalesOrders, No record found.');
					//loaderEnd();
					return;
				}
				loaderStart();
				
				var AllRows = 0;
				var AllPages = 0;
				var addPage = false;
				var pagesel = GetPageSalesOrder(IDTable, fromfilter, addPage);
				
				var rtotItems = 0,
					rtotLocations = 0,
					rtotMRR = 0.0,
					rtotNRR = 0.0;
				var formatter = new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD',
					minimumFractionDigits: 2,
				});
				
				var colStatus = '';
				var colStatusLabels = {
					'SalesOrd:A': 'Pending Approval',
					'SalesOrd:B': 'Pending Fulfillment',
					'SalesOrd:C': 'Cancelled',
					'SalesOrd:D': 'Partially Fulfilled',
					'SalesOrd:E': 'Pending Billing/Partially Fulfilled',
					'SalesOrd:F': 'Pending Billing',
					'SalesOrd:G': 'Billed',
					'SalesOrd:H': 'Closed'
				};
					
				var rows = '';
				img_url = WF_whs(	'id=6521300&c=3461650&h=58f8ca4c67fada1f48d0',
									'id=8153908&c=3461650&h=4dfa99e3b987f3f8aad9');
				var   cntSOrow = 0;
				
				var tmpl_salesorder = $('#mywork-saleorder-template').html();
				
				data[1].forEach(function(d) {
					var ArrayDeliveryDate = [];
					var standardDate = '';
					cntSOrow++;
					
					if(d.DeliveryDate.length)
						ArrayDeliveryDate = d.DeliveryDate.sort( function(a,b){
					  // Turn your strings into dates, and then subtract them
					  // to get a value that is either negative, positive, or zero.
					  return StringNetsuiteDateToDate(b).getTime() - StringNetsuiteDateToDate(a).getTime();
					});

					// if(WF_DEBUG) console.info('ArrayDeliveryDate',ArrayDeliveryDate);

					if(ArrayDeliveryDate.length)
						standardDate = ArrayDeliveryDate[0];
					
					colStatus = colStatusLabels[d.sostatus];
					
					d.colStatus = colStatus;
					d.standardDate = standardDate;
					d.MRR_txt = formatter.format(d.MRR);
					d.NRR_txt = formatter.format(d.NRR);
					d.PendingMRR_txt = formatter.format(d.PendingMRR);
					d.PendingNRR_txt = formatter.format(d.PendingNRR);
					d.img_url = img_url;

					rows +=  LeirAGS_Tmpl(tmpl_salesorder, d);

				});
				
				if(rows!='') $("table#" + IDTable + " > tbody").append(rows); 
				
				$('#ButtonLoadMore_'+IDTable).html('Load More...('+pagesel+' / '+AllPages+')')
				$('#ButtonLoadMore_'+IDTable).prop('disabled', (pagesel >= AllPages) );
				
				if (pagesel < AllPages) {
					addPage= true;
					// Falta algo para indicar que se puede subir el numero de pagina.... 
					// el ultimo parametro debe ser TRUE
					pagesel = GetPageSalesOrder(IDTable,false, addPage);
				}

				if(WF_DEBUG_AJAX_DATA) console.info('totals',data[2]);
				var data2 = data[2];
				
//				setTimeout(function() {
					if ($.fn.dataTable.isDataTable('#' + IDTable)) {
						$('#' + IDTable).DataTable().destroy();
					}
					table = $('#' + IDTable + '').DataTable({
						"dom": '<"top"if>rt<"bottom"lp><"clear">',
						"autoWidth": false, //--evitar cambio de tamano
						"bInfo": true,
						//"deferRender": true,
						"paging": false,
						"responsive": false,
						"scrollCollapse": true,
						"scrollY": "600px",
						"scroller": true,
						"searching": true,
						"columns": [
									{ "orderDataType": "sort_tranid" }, null, null, null, null,
						             null, null, null, null, null,
						             { "orderDataType": "dom-netsuite-date" }, null, null, null
						             //, null, null
						             //{ "orderDataType": "dom-text-numeric" },
						             //{ "orderDataType": "dom-text", type: 'string' },
						             //{ "orderDataType": "dom-select" }
						             //{ "orderDataType": "sort_tranid" } --- created to SALESORDER tables...
						             //{ "orderDataType": "dom-netsuite-date" }
						          ],
						"order": [
							[10, "desc"]
						],
						"footerCallback": function(row, data, start, end, display) {
							var apiCustom = this.api(), data;
							// Remove the formatting to get integer data for summation
							var intVal = function(i) {
								return typeof i === 'string' ?
									i.replace(/[\$,]/g, '') * 1 :
									typeof i === 'number' ?
									i : 0;
							};
							pageTotal = apiCustom.column(4, { page: 'current' }).data().reduce(function(a, b) {
								return intVal(a) + intVal(b); }, 0);
							
							if (WF_DEBUG)
								console.log("Page Total: " + pageTotal);

							$(apiCustom.column(4).footer()).html('<span class="badge">' + pageTotal + '</span>');
							
							pageTotal = apiCustom.column(5, { page: 'current' }).data().reduce(function(a, b) {
								return intVal(a) + intVal(b); }, 0);
							
							$(apiCustom.column(5).footer()).html('<span class="badge">' + pageTotal + '</span>');

							pageTotal = data2.MRR;
							$(apiCustom.column(8).footer()).html('<span class="badge">' + formatter.format(pageTotal) + '</span>');

							pageTotal = data2.NRR;
							$(apiCustom.column(9).footer()).html('<span class="badge">' + formatter.format(pageTotal) + '</span>');

							pageTotal = data2.PendingMRR;
							$(apiCustom.column(11).footer()).html('<span class="badge">' + formatter.format(pageTotal) + '</span>');
							
							pageTotal = data2.PendingNRR;
							$(apiCustom.column(12).footer()).html('<span class="badge">' + formatter.format(pageTotal) + '</span>');
							$('.dataTables_scrollFoot').show();
						},
						"oLanguage": {
							 "sInfo": "Showing 1 to _END_ of "+AllRows+" entries"
						 }
					});
					
					loaderEnd();
//				}, 200); //Was 1000... ariel
			}


//---ChangeTableServiceAddresses>
			function ChangeTableServiceAddresses(WhichSalesOrder) {
				if (WF_DEBUG)
					console.info('ChangeTableServiceAddresses(WhichSalesOrder)', WhichSalesOrder);

				var datos = {
							'action': 'getServiceAddresses',
							'SO'	: WhichSalesOrder
						};
				
				if (WF_DEBUG_AJAX)
					console.info('ChangeTableServiceAddresses',"getServiceAddresses .BSL", datos);

				mirrorLog('ChangeTableServiceAddresses','getServiceAddresses .BSL', datos ); 
					
				$.ajax({
					url: getUrl().BSL,
					data: datos,
					async: false,
					dataType: 'text',
					success: function(data) {
						var toSelect = '<option value=""> Select Address </option>';
						data = CleanResponseData(data);
						
						WF_SO_Locations_data = data;
						var rows = '';
						var rown = 0;
						var row_bg = 'rowc-white';
						if (WF_DEBUG)
							console.log("data", data);
						//console.log('Data stream All Services: ' + data[0]);
						var tmpl_so_sas = $('#saleorder-serviceaddress-template').html();
						
						data.forEach(function(d) {
							rown++;
							toSelect += "<option value='" + d.id + "' >" + d.name + "</option>";
								
							d.rown = rown;
							d.row_bg = row_bg;
							rows +=  LeirAGS_Tmpl(tmpl_so_sas, d);
							row_bg = (row_bg =='rowc-white')? 'rowc-info' : 'rowc-white';
							
						});
						
						/*$("table#myUpdatedServicesAddresses").find('tr:not(:first)').each(function() {
							$(this).remove();
						});*/
						$("table#myUpdatedServicesAddresses tbody tr").each(function() {
							$(this).remove();
						});
						
						$("table#myUpdatedServicesAddresses > tbody").append(rows);
						$('#selAdresses').children().remove();
						$('#selAdresses').append(toSelect);
						
						// Add Funcionality when click in table of services addresses... apply filter...
						// This is not practic because disable copy text from the list.
//						$('#myUpdatedServicesAddresses tbody tr').on('click', function(){
//							var dsh = $(this).attr('data-toshow');
//							$("#selAdresses").val( dsh );
//							$("#filterButtonG").trigger('click');
//						});
						
						// Enable clic on second column of services address apply filter.
						$('#myUpdatedServicesAddresses tbody tr td').on('click', function(){
							var myCol = $(this).index();
						    var $tr = $(this).closest('tr');
						    var myRow = $tr.index();
						    // $('#filtered_message').html('['+myRow+','+myCol+']');
						    if (myCol < 2){ // First and Second Column.
						    	var dsh = $tr.attr('data-toshow');
								$("#selAdresses").val( dsh );
								$("#selServices").val( '' ); // Exclusive only once at the time
								$("#filterButtonG").trigger('click');
						    }
						});

					},
					error: function(err) {
						alert('Error on NetSuite call ChangeTableServiceAddr');
						console.error('Error on NetSuite call', err);
					}
				});
			}
//---ChangeTableServiceAddr<

// Task Tree Start
//--------------------------------------------------------------
//---GetTaskTree>
			function GetTaskTree(WhichSalesOrder) {
				if (WF_DEBUG)
					console.info('GetTaskTree(WhichSalesOrder)', WhichSalesOrder);
				
				if(!WhichSalesOrder) return false;
				
				var resFinAdd = [], resFinItem = [], resFinPla = [];
				var dateFirst = [], dateFirstStart = [];
				var dateSecond = [], dateSecondStart = [];
				var dateThird = [], dateThirdStart = [];
				var dateFourth = [], dateFourthStart = [];
				var firstCat = [], secondCat = [], thirdCat = [];
				var secondCatInd = [], thirdCatInd = [], fourthCatInd = [];
				var objArrays = {
					'firstCat': firstCat,
					'secondCat': secondCat,
					'thirdCat': thirdCat,
					'secondCatInd': secondCatInd,
					'thirdCatInd': thirdCatInd,
					'fourthCatInd': fourthCatInd
				};
				//Call ajax
				var datos = {
					'action': 'getTasksTableTree',
					'WhichSalesOrder': WhichSalesOrder
				};
				
				if (WF_DEBUG_AJAX)
					console.info('GetTaskTree',"getTasksTableTree .BSL", datos);

					mirrorLog('GetTaskTree','getTasksTableTree .BSL', datos ); 

				$.ajax({
					url: getUrl().BSL,
					data: datos,
					dataType: 'text',
					success: function(data) {
						var results = CleanResponseData(data);
						window.ariel_gettree = results; 
						if (WF_DEBUG)
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
						//return drawTreeArr;
						Global_myTreeViewTask = new dhtmlXTreeView({
							parent: "treeTasks",
							multiselect: true,
							items: drawTreeArr
						});
						
						//-- window.ariel_tree = Global_myTreeViewTask;
						//-- window.ariel_tree_items = drawTreeArr;
						
						Global_myTreeViewTask.attachEvent("onSelect", function(id, mode) {
							//console.info('Selected id:',id,' mode:', mode );
							DhtmlTreeView_getUserData();
							//- var id = Global_myTreeViewTask.getSelectedId();
							//- console.log('id Selected: ' + id);
						});
						
						//Functions
						//Call Type of tree
						function callcategories(arraCat, fieldCat, WhichSalesOrder, typeCat) {
							var executeArrays = (typeCat == 'A' || typeCat == 'I') ? getArrays(arraCat, fieldCat) : getArraysPlan(arraCat, fieldCat);
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
						//-alert('Error on NetSuite call');
						console.error('Error on NetSuite call GetTaskTree', err);
					}
				});
			} // End Tree
//---GetTaskTree<

//---createArray>
//			window.createArray = function createArray(objArrays, typeArr, WhichSalesOrder) {
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
						} else {
							rdt = convertDate(fechas).sort(date_sort_asc);
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
						//Second-------------------------------------
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
								obj2['userdata'] = {'taskId': idPro, 'agsL':'A' };
								//Third--------------------------------------------------------
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

										//	var RawStartDate = new Date(Number(separete[2])).getTime();
										//var RawDueDate = new Date(Number(separete[3])).getTime();
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

										//*************/
										dateThirdStart.push(dateInformation[0]);
										dateThird.push(dateInformation[1]);
										//***********/

										var ConstructedStartDate = startDate;
										var ConstructedDueDate = dueDate;
										
										var idNameT = startValue + "<a onclick='showTask(" + idSubproT + ",\"tree\");''>" + titleFirst + "</a>&nbsp<span class='label label-" + colorClass + ">" + ConstructedStartDate + " - " + ConstructedDueDate +
											"</span>&nbsp<span class='label label-warning'>" + cantDuration + "</span>" + endValue;
									} else {
										var idNameT = tercera[3];
									}
									if ((idAddT + '-' + idProT) == (idAdd + '-' + idPro)) {
										var obj3 = {};
										obj3['id'] = idAddT + '-' + idProT + '-' + idSubproT;
										obj3['text'] = idNameT;
										obj3['open'] = 0;
										obj3['userdata'] = {'taskId': idSubproT, 'agsL':'B:'+idAddT+'-'+idProT+'-'+idSubproT };
										//fourth-------------------------------------------------
										var arrayFourth = [];
										fourthCatInd.forEach(function(fourthCate) {
											var cuarta = fourthCate.split('~');
											var obj4 = {};
											var idAddC = cuarta[0];
											var idProC = cuarta[1];
											var idSubproC = cuarta[2];
											var idTask = cuarta[3];
											var idTasKName = cuarta[4];
											if ((idAddT + '-' + idProT + '-' + idSubproT) == (idAddC + '-' + idProC + '-' + idSubproC)) {
												startValue = "";
												endValue = "";
												colorClass = "primary'";
												var separete = idTasKName.split('|');
												var titleFirst = separete[0];
												var dateInformation = separete[1].split(delimiterdates);;
										
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
												//***************/
												dateFourthStart.push(dateInformation[0]);
												dateFourth.push(dateInformation[1]);
												//***********/
												var ConstructedStartDate = startDate;
												var ConstructedDueDate = dueDate;
												var callFunction = startValue + "<a onclick='showTask(" + idTask + ",\"tree\");''>" + titleFirst + "</a>&nbsp<span class='label label-" + colorClass + ">" + ConstructedStartDate + " - " + ConstructedDueDate +
													"</span>&nbsp<span class='label label-warning'>" + cantDuration + "</span>" + endValue;
												var obj4 = {};
												obj4['id'] = idAddC + '-' + idProC + '-' + idSubproC + '-' + idTask;
												obj4['text'] = callFunction;
												obj4['open'] = 0;
												obj4['userdata'] = {'taskId':idTask, 'agsL':'C' };
												arrayFourth.push(obj4);
											}
										}); //end fourthCatInd
										//-------------------------------------------------
										var startDatetitle = "";
										var dueDatetitle = "";
										//	console.log(dateFourthStart);
										if (dateFourthStart.length > 0) {
											var lastDates = sortDates(dateFourthStart, 'asc');
											startDatetitle = "&nbsp<span class='label label-default' style='font-weight: 400;'>" + formatDate(lastDates[0]);
											//************/
											dateThirdStart.push(lastDates[0]);
											//*************/
										}
										if (dateFourth.length > 0) {
											var lastDates = sortDates(dateFourth, 'desc');
											dueDatetitle = " - " + formatDate(lastDates[0]) + "</span>";
											//************/
											dateThird.push(lastDates[0]);
											//***********/
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
										//console.log ('statusTask tiene ' + statusTask);
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
										var obj3 = {};
										obj3['id'] = idAddT + '-' + idProT + '-' + idTask;
										obj3['text'] = callFunction;
										obj3['open'] = 0;
										obj3['userdata'] = { 'taskId':idTask, 'agsL':'D' };
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
									//*************/
									dateSecondStart.push(lastDates[0]);
									//*************/
								}
								if (dateThird.length > 0) {
									var lastDates = sortDates(dateThird, 'desc');
									//	console.info("last",lastDates);
									dueDatetitle = " - " + formatDate(lastDates[0]) + " </span>";
									//*************/
									dateSecond.push(lastDates[0]);
									//*************/
								} else {
									if (dateThirdStart.length > 0) {
										startDatetitle = startDatetitle + " </span>";
									}
								}
								obj2['text'] = idName + startDatetitle + dueDatetitle;
								obj2['open'] = 0;
								obj2['items'] = arrayThird;
								obj2['userdata'] = {'taskId':0, 'agsL':'E' };
								//End Third--------------------------------------------------
								arraySec.push(obj2);
							}
						});
						//secondundependence
						secondCatInd.forEach(function(secondCate) {
							var segunda = secondCate.split('~');
							var idAssignTask = "";

							//console.log ('secondCate vale ' + secondCate);
							if (typeArr == 'P') {
								var idAdd = segunda[0];
								var idTask = segunda[1];
								var idTasKName = segunda[2];
								idAssignTask = idAdd + '-' + idTask;
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
								if(WF_DEBUG)
									console.info('Processing level F of tree',{'typeArr':typeArr,'secondCate':secondCate,'idAssignTask':idAssignTask,'idTasKName':idTasKName,'dateInformation':dateInformation });
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
								// dateSecondStart.push(startDate);
								dateSecond.push(dateInformation[1]);
								//	dateSecond.push(dueDate);
								//***********************/
								var ConstructedStartDate = startDate;
								var ConstructedDueDate = dueDate;
								//console.log(ConstructedStartDate);
								var callFunction = startValue + "<a onclick='showTask(" + idTask + ",\"tree\");''>" + titleFirst + "</a>&nbsp<span class='label label-" + colorClass + ">" + ConstructedStartDate + " - " + ConstructedDueDate +
									"</span>&nbsp<span class='label label-warning'>" + cantDuration + "</span>" + endValue;
								var obj2 = {};
								obj2['id'] = idAssignTask;
								obj2['text'] = callFunction;
								obj2['open'] = 0;
								obj2['userdata'] = {'taskId': idTask, 'agsL':'F'  };
								arraySec.push(obj2);
							}
						}); //End secondCatInd--
						var startDatetitle = "";
						var dueDatetitle = "";
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
						obj['open'] = 0;
						resulFinal.push(obj);
						JSON.stringify(resulFinal);
					});
					return resulFinal;
				} //end createArray
//---createArray<




//---searchitemlocation>
			window.searchitemlocation = function searchitemlocation(WhichSalesOrder, itemLine) {
				var sepID = itemLine.split('-');
				var textName = '';
				var WhichItem = sepID[0].slice(1) * 1;
				var WhichLine = sepID[1] * 1;
				if (WF_SO_Locations_data.length &&  WF_SO_Locations_data[0].saleorder == WhichSalesOrder) {
					//-- Search in cache.
					WF_SO_Locations_data.forEach(function (loc){
						if (!textName && loc.lineitem == WhichLine) {
							textName = (loc.name) ? loc.name : (WhichItem + ' ('+WhichLine+')' )
						}
					})
				}
				if (WF_DEBUG)
					console.info("searchitemlocation(WhichSalesOrder, itemLine)", WhichSalesOrder, itemLine);
				
				//Get Item Text -----------------------------
				$.ajax({
					url: getUrl().BSL,
					data: {
						'action': 'searchItemLocation',
						'WhichSalesOrder': WhichSalesOrder,
						'WhichItem': WhichItem,
						'WhichLine': WhichLine
					},
					async: false,
					dataType: 'text',
					success: function(data) {
						data = CleanResponseData(data);
						WF_SO_Locations_data = data;
						if (WF_SO_Locations_data.length &&  WF_SO_Locations_data[0].saleorder == WhichSalesOrder) {
							//-- Search in cache.
							WF_SO_Locations_data.forEach(function (loc){
								if (!textName && loc.lineitem == WhichLine) {
									textName = (loc.name) ? loc.name : (WhichItem + ' ('+WhichLine+')' )
								}
							})
						}
					},
					error: function(err) {
						console.log('Error on NetSuite call searchitemlocation', err)
					}
				})
				return (textName) ? textName : (WhichItem + ' ('+WhichLine+')' );
			}
//---searchitemlocation<

//---showSecondTable>
			window.showSecondTable = function showSecondTable(empPM) {
				return false; // DEROGATE
					if (WF_DEBUG)
						console.info("showSecondTable(empPM)", empPM);
					// Second Div ----------------------------------------
					var datos = {
							'action': 'getAllTaskbyDpto',
							'WhichProjMan': empPM
						};
					
					if (WF_DEBUG_AJAX)
						console.info('showSecondTable','getAllTaskbyDpto .RT3', datos );
					mirrorLog('showSecondTable','getAllTaskbyDpto .RT3', datos );
					$.ajax({
						url: getUrl().RT3,
						data: datos,
						async: false,
						dataType: 'text',
						success: function(data) {
							data = CleanResponseData(data);
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
							console.log('Errpr on NetSuite call showSecondTable', err);
						}
					});
					// Third Div ---------------------------------------
					var datos = {
							'action': 'getAllTaskbySO',
							'WhichProjMan': empPM
						};
					
					if (WF_DEBUG_AJAX)
						console.info('showSecondTable','getAllTaskbySO .RT3', datos);
					
					
						mirrorLog('showSecondTable','getAllTaskbySO .RT3', datos ); 
					
					$.ajax({
						url: getUrl().RT3,
						data: datos,
						async: false,
						// dataType: 'json',
						dataType: 'text',
						success: function(data) {
							data = CleanResponseData(data);
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
							//alert('Error on NetSuite call');
							console.error('Error on NetSuite call showSecondTable.getAllTaskbySO', err);
						}
					});
				} //End Call first serach PM -----------------------------------
//---showSecondTable<



				
				
//---showTask>																								---WH
			window.showTask = function showTask(idTaskFuction, fromClick) {
					if (WF_DEBUG)
						console.info("showTask(idTaskFuction, fromClick)", idTaskFuction, fromClick);
					
					if(idTaskFuction === undefined){
						alert('Cannot retrieve this task, maybe need reload the SO.')
						return;
					}
					$('#whynotTable').html(''); // Clear Dependency Chain
					if(fromClick=='tree'){
						$("#contTasks").hide();
						$('.preimageTasks').show();
					} else {
						$('.preimageTasks').hide();
					}
					//--------------------------------------------
					var datos =  {
						'action': 'GetTaskTree',
						'WhichTask': idTaskFuction
					};
					if (WF_DEBUG_AJAX)
						console.info('showTask','GetTaskTree .RT', datos);
					mirrorLog('showTask','GetTaskTree .RT', datos );
					$.ajax({
						url		: getUrl().RT,
						data	: datos,
						dataType: 'text',
						success: function(data) {
							var results = CleanResponseData(data);
							var counter = 0,
								count;
							var DrawResults = results[0];
							
							//  This variable will set the ID's
							counter++;
							count = "TreeTask" + counter;
							if (DrawResults) {
								// defaults	
								var onChangeAckEnable = "onchange='changeAck.call(this)'";
								var onChangeAssignedEnable = 'onchange="changeSelectAsignee.call(this)"';
								var onChangeStatusEnable = 'onchange="changeselTaskStatus.call(this)"';
								var onChangeStartEnable = 'onchange="changeidPickerStartDate.call(this)"';
								var onChangeDueEnable = 'onchange="changeidPickerDueDate.call(this)"';
								var onChangeWoWEnable = "onchange='changeWorkOnWeekends.call(this)'";
								var vFilteredStatusList = $('input#custpage_selectstatustask').val();
								
								// Get to Local variables
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
								var KpiTaskType = DrawResults.KpiTaskType;
								var disableChangeEmployee = false;
								var dtaskStartDate = taskStartDate;
								var dtaskDueDate = taskDueDate;
								var WorkWeekend = IsWorkOnWeekend;
								var WorkWeekendDisplay;
								var dtaskDuration;
								var dtaskUpdateIcon;
								var enableEdit;
								var empName = getEmployeeName(assignedID);
								var BoolAck;
								var headRow = '';
								
								//console.log(DrawResults);
								
								//Show table-----------------
								if(fromClick=='tree')
									$('.preimageTasks').hide();
								$("#contTasks").show();
								// $("table#tableTask").show();
								$('table#tableTask thead th').remove();
								$('table#tablePreSucc thead th').remove();
								//-----
								$("table#tableTask > thead").append(headRow);
								
								//WORKWEEKEND--------------------------------------------------------------
								// If the employee works on Weekends then make the check input to be marked
								// This will input something like: $("input[id='WorkOnWeekends_7']").attr('checked', true)
								if (WorkWeekend) {
									WorkWeekendDisplay = "<input type='checkbox' onchange='' id='WorkOnWeekends_" + count + "' name='check' class='check' checked /><p style='font-size:0px;position:absolute;'>true</p>"
								} else {
									WorkWeekendDisplay = "<input type='checkbox' onchange='' id='WorkOnWeekends_" + count + "' name='check' class='check' /><p style='font-size:0px;position:absolute;'>false</p>"
								}
								//ACK----------------------------------------------------------------------
								if (taskAck) {
									BoolAck = "<input type='checkbox' onchange='' id='Ack_" + count + "' name='check' disabled class='check' data-oldAck='true' checked />"
								} else {
									BoolAck = "<input type='checkbox' onchange='' id='Ack_" + count + "' name='check' data-oldAck='false' class='check' />"
								}
								//STATUS----------------------------------------------------------------------
								// Set Current Status as Selected
								if (statusID) 
									vFilteredStatusList = lstStatusSelect.replace('value="'+statusID+'"', 'value="'+statusID+'" selected');								
								// Set Correcrt ID.
								vFilteredStatusList = vFilteredStatusList.replace('id="selTaskStatus"', 'id="selTaskStatus' + count + '"');
								// Set prevous value.
								vFilteredStatusList = vFilteredStatusList.replace('</select>', '</select><p  class="kiko" style="font-size:0px;position:absolute;">' + status + '</p>');								
								//DURATION -----------------------------------------------------------------
								dtaskDuration = "<input id='idTask_Duration_" + count + "' onblur='blurDuration.call(this)' onkeyup='changeDuration.call(this)' data-dependency='" + taskCDependency + "' data-predecessor='" + taskCPredecessor +
									"' type='text' size='3' value=" + taskDuration + " data-wrikeid='" + WrikeID + "' data-tasktype='"+KpiTaskType+"' data-salesorder='" + WhichSalesOrder + "'>";
								//UPDATE-ICON --------------------------------------------------------------
								dtaskUpdateIcon = "<div onclick='clickdico.call(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
								
								
								//WHO CAN EDIT-------------------------------------------------------------
								// User is PM or is your task, and task is not cancel and  not completed. 
								enableEdit = getEnableEdit(assignedID, statusID);
								disableChangeEmployee = ! enableChangeAssigned;
								//------------
								
								var vFilteredStatusList_No = vFilteredStatusList;
								
								if (enableEdit){
									if (WorkForce_Obj.userID == assignedID) 
										BoolAck = BoolAck.replace("onchange=''", onChangeAckEnable);
									else
										BoolAck = BoolAck.replace('input type', 'input disabled type');
									vFilteredStatusList_No = vFilteredStatusList.replace('select name', 'select disabled name');
									WorkWeekendDisplay = WorkWeekendDisplay.replace("onchange=''", onChangeWoWEnable);
									vFilteredStatusList = vFilteredStatusList.replace('onchange=""', onChangeStatusEnable);
									vFilteredStartDate = dtaskStartDate.replace('onchange=""', onChangeStartEnable);
									vFilteredDueDate = dtaskDueDate.replace('onchange=""', onChangeDueEnable);
									vFilteredEmployeesList = '<input type="hidden" value="'+assignedID+'" id="selectAsignee'+count+'" '+onChangeAssignedEnable+'>'+
															 '<input class="employeeSelectFly" type="text" value="'+empName+'" '+((disableChangeEmployee)? 'disabled':' onClick="selectassignee(this)" data-onchg="selectAsignee'+count+'"')+' />';
									//DISABLE DATE FIELDS BASED ON DEPENDENCY --------------------------------------
									if ((taskCDependency == "startToStart") || (!taskAck))
										vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
									
									if ((taskCDependency == "startToFinish" || taskCDependency == "finishToFinish") || (!taskAck))
										vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
									
								} else {
									disableChangeEmployee = true;
									BoolAck = BoolAck.replace('input type', 'input disabled type');
									WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
									vFilteredStatusList_No = vFilteredStatusList.replace('select name', 'select disabled name');
									vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name');
									vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
									vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
									dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
									dtaskUpdateIcon = "<div onclick='clickdico(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
									vFilteredEmployeesList = '<input type="hidden" value="'+assignedID+'" id="selectAsignee'+count+'">'+
															 '<input class="employeeSelectFly" type="text" value="'+empName+'" disabled data-onchg="selectAsignee'+count+'">';
									
								}
								
								var row = ''; 

								$('table#tableTask tbody tr').remove();

								var rowh = "<div class='styleToId' style='min-height:50px; background-color: aquamarine !important;'>" +
									" <span id='vtaskID" + count + "' style='display:none'>" + taskID + "</span>"+
									"<span class='badge pull-right'>"+taskID+"</span>"+
									"<label data-taskid='" + taskID + "' data-wrikeid='" + WrikeID + "' href='#' style='font-size:16px;' target='_blank'> " + titleTask + "</label>"+
									"</div>";
								$('#taskNameLabel').html(rowh);
								
								var EditStatus_No = "<td id='TaskStatus_" + count + "'>" + vFilteredStatusList_No + "</td>";
								
								var EditStatus_Yes= "<td id='TaskStatus_" + count + "'> <span style='display:none;'>" + vFilteredStatusList + "</span>" +
								'<div class="dropdown">\
								  <p class="dropbtn" style="width:220px; font-size:16px" onClick="var elem=$(\'#ssa_'+count+'r\'); if($(elem).css(\'display\')==\'none\') $(elem).css(\'display\',\'block\'); else $(elem).css(\'display\',\'none\');" >'+status+'<span class="glyphicon glyphicon-menu-down pull-right" aria-hidden="true"></span></p>\
								  <div class="dropdown-content" id="ssa_'+count+'r">\
								    <a href="#" onClick="$(\'#ssa_'+count+'r\').css(\'display\',\'none\'); $(\'#selTaskStatus'+count+'\').val(1).trigger(\'change\');" ><span class="glyphicon glyphicon-time" aria-hidden="true" style="margin-right:16px"></span> Active</a>\
								    <a href="#" onClick="$(\'#ssa_'+count+'r\').css(\'display\',\'none\'); $(\'#selTaskStatus'+count+'\').val(2).trigger(\'change\');" ><span class="glyphicon glyphicon-check" aria-hidden="true" style="margin-right:16px"></span> Completed</a>\
								    <!-- a href="#" onClick="$(\'#ssa_'+count+'r\').css(\'display\',\'none\'); $(\'#selTaskStatus'+count+'\').val(4).trigger(\'change\');" ><span class="glyphicon glyphicon-remove" aria-hidden="true" style="margin-right:16px"></span> Cancelled</a -->\
								    <a href="#" onClick="$(\'#ssa_'+count+'r\').css(\'display\',\'none\'); cancellingTask('+taskID+',\''+count+'\','+WhichSalesOrder+'); /*$(\'#selTaskStatus'+count+'\').val(4).trigger(\'change\');*/" ><span class="glyphicon glyphicon-remove" aria-hidden="true" style="margin-right:16px"></span> Cancelled</a>\
								    <!-- a href="#" onClick="$(\'#ssa_'+count+'r\').css(\'display\',\'none\'); $(\'#selTaskStatus'+count+'\').val(3).trigger(\'change\');" ><span class="glyphicon glyphicon-remove-sign" aria-hidden="true" style="margin-right:16px"></span> Deferred</a -->\
								  </div>\
								</div>'+
								"</td>";
								

								row += "<tr style='display:none;'>" +
									"  <th width='10%'><strong>Task</strong></th>" +
									"  <th class='styleToId'><span id='vtaskID" + count + "' style='display:none'>" + taskID + "</span><label data-taskid='" + taskID + "' data-wrikeid='" + WrikeID + "' href='#' style='font-size:16px;' target='_blank'> " +
									titleTask + "</label><input onclick='' id='dicoTreeTask1' class='filterButton' style='display: none' align='right' type='button' value='Save'/></th>" +
									"</tr>" +
									"<tr><td><strong>Assigned</strong></td><td>" + vFilteredEmployeesList + "</td></tr>" +
									"<tr><td><strong>ACK</strong></td><td id='TaskAck_" + count + "'>" + BoolAck + "</td></tr>" +
									
									// "<tr><td><strong>Status</strong></td><td id='TaskStatus_" + count + "'>" + vFilteredStatusList + "</td></tr>" +
									
									"<tr><td><strong>Status</strong></td>"+
									//((disableChangeEmployee)? EditStatus_No : EditStatus_Yes) +
									
									// (((WorkForce_Obj.userID == assignedID) && (taskAck))? EditStatus_Yes : EditStatus_No) +
									
									(((WorkForce_Obj.userID == assignedID || WorkForce_Obj.auditId == assignedID || WF_Develop_State ) && (taskAck))? EditStatus_Yes : EditStatus_No) +
									
									"</tr>"+
									
									"<tr><td><strong>Start Date</strong></td><td>" + vFilteredStartDate + "</td></tr>" +
									"<tr><td ><strong>Due Date</strong></td><td>" + vFilteredDueDate + "</td></tr>" +
									"<tr><td><strong>Work On Weekends</strong></td><td>" + WorkWeekendDisplay + "</td></tr>" +
									"<tr><td><strong>Duration</strong></td><td><p style='font-size:0px;position:absolute;'>" + taskDuration + "</p>" + dtaskDuration + "</td></tr>"+
									"<tr>\
										<td><strong>Add Successor Task</strong></td>\
										<td>\
											<div id='addsuccessortask' class='filterButtonSO' style='display:inline-block; width:100px' data-taskid="+taskID+"> New Task </div>\
											<div id='getbranchdependency' class='filterButtonSO' style='display:inline-block; width:170px' data-taskid="+taskID+">Dependency Chain</div>\
										</td>\
									</tr>";
									
								//-----------------------------------------------------
								row += '<tr>' +
									'<td colspan="2">' +
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
								row += '<tr>' +
									"	<td colspan='2'>" +
									'	<iframe height="600px" width="100%" frameBorder="0" and scrolling="no" id="wrike_comment_iframe" src="" style="display:none;"></iframe>';
									'	</td>' +
									'</tr>';
								//-----------------------------------------------------

								//console.log(row);
								$("table#tableTask > tbody").append(row);
								
								//--- Show Upload Files to the task -
								$('#leirags_fileup_task').val( taskID );
								$('#leirags_fileup_tasktitle').val( titleTask );
								$('#tasktitle_toup').html( titleTask );
								$('#leirags_fileup_filename').val('');
								$('#upload-files').show();								
								// Set PermaLink..
								var permalink = 'https://system.sandbox.netsuite.com/app/site/hosting/scriptlet.nl?script=1385&deploy=1&gocomm='
								if (WorkForce_Obj.Env != 'SANDBOX'){
									permalink = 'https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=1308&deploy=1&gocomm='
								}
								$('#task-communication > div.col-sm-12 > div.col-sm-3 > h4 > a').attr('href',permalink + taskID )
								//---
								
								showPress( taskID );
								showSucc ( taskID );
								
								getTaskNotes(taskID,0,null); // taskid, so, html-element
								
								// Enable Add Activity....
								$('#addsuccessortask').on('click', function() { openAddTask(this) } );
								
								// Enable Add Activity....
								$('#getbranchdependency').on('click', function() { 
									var taskId = $(this).attr('data-taskid');
									getPredesesorsBranch(taskId, true);
								});
								
								openWrikeComment(WrikeID, taskID, true);

								///5 showTaskDatePick
								flatpickr('.showTaskDatePick', {
									dateFormat: CalendarInputFormat
								}); // initialized picker

								DhtmlTreeView_search_taskId(taskID, fromClick);
								
								jQScrollTo('taskNameLabel');
								
							}; // END DrawResults<
							
							loaderEnd();
						},
						error: function(err) {
							loaderEnd();
							//-alert('Error on NetSuite call');
							console.error('Error on NetSuite call showTask', err);
						}
					});
					//-----------------------------------------------------------
				}
//---showTask<


//---showbranchdependency2>
	function showBranchDependency2(taskId, branch){
		if(! Object.keys(branch).length) return;
		var cont = '';
		var tmpl_row = '<tr data-taskid="{{idTask}}" {{css_class}}><td>{{title}}</td><td>{{status}}</td><td>{{dependency}}</td><td>{{branch_lvl}}</td><td>{{obstruct}}</td></tr>';
		var tmpl_head = '<table class="table table-striped table-bordered" id="whynot">\
			<tr class="warning"><th>Task</th><th>Status</th><th>Dependency</th><th>Level</th><th>Blocking?</th></tr>';
		var tmpl_foot = '</table>';
		var tmpl_foot2 = '<ul>\
		<li><span class="label" style="background:#6E6"> &nbsp; </span> - Task evaluated </li>\
		<li><span class="label label-info"> &nbsp; </span> - Predecessor branch start</li>\
		<li><span class="label label-default"> Level </span> - Number of tasks to reach the current (Proportional to the distance from the origin)</li>\
		</ul>';
		branch.forEach(function(btsk){
			var row = tmpl_row;
			btsk['css_class'] = (btsk['branch_lvl'] == '1')? 'class="info"' : ((btsk['branch_lvl'] == '0')? 'style="background:#6E6"' : '');
			btsk['obstruct'] = ((btsk['branch_lvl'] == '0')? 'Current' : (btsk['dependency'] == 'FinishToStart' && btsk['status'] == 'Active') ? '<p class="label label-danger">Yes</p>' : '<p class="label label-info">No</p>');
			var keys = getVarsObject(btsk);
			keys.forEach(function(key){
				var rgx = new RegExp('{{'+key+'}}','gi');
				row = row.replace(rgx, btsk[key] );
			});
			cont += row;
		});
		cont = tmpl_head + cont + tmpl_foot + tmpl_foot2;
		$('#whynotTable').html(cont);
		$('#whynotTab').show();
	}
//---showbranchdependency2<
	
	

//---parseDependency>
	function parseDependency2(branch){
		var obstruct = false;
		branch.forEach(function(btsk){
			if (btsk.branch_lvl > 0)
			obstruct = obstruct 
						|| (
							btsk['dependency'] == 'FinishToStart' 
								&& 
							btsk['status'] == 'Active'
							);
		});
		return obstruct;
	}
//---parseDependency<


//---getPredesesorsBranch2>
		function getPredesesorsBranch2(taskId, show) {
// 			if (WF_DEBUG)
// 				debugger;
			
			if (WF_DEBUG)
				console.info("getPredesesorsBranch2(idTask)", taskId);
			
			var datos = {
				'action': 'getPredesesorsBranch',
				'WhichTask': taskId,
				'resultAs': 'details',
			};
			
			if (WF_DEBUG_AJAX)
				console.info('getPredesesorsBranch2',"getPredesesorsBranch .RT2", datos);

			
			  mirrorLog('getPredesesorsBranch2','getPredesesorsBranch .RT2', datos ); 
			
			var obstruct = true;
			
			$.ajax({
				url: getUrl().RT2,
				data: datos,
				async: false,
				dataType: 'text',
				beforeSend: function(data) {
				},
				success: function(data) {
					Branch_review = CleanResponseData(data);
					if(WF_DEBUG_AJAX_DATA)
						console.info('getPredesesorsBranch2 results:',results);	
					loaderEnd();
					
					if(show)
						showBranchDependency(taskId, Branch_review);
					else 
						obstruct = parseDependency(Branch_review);
				},
				error: function(err) {
					loaderEnd();
					//-alert('Error on NetSuite call');
					console.error('Error on NetSuite call getPredesesorsBranch2', err);
					return false; // If cannot read cannot update.
				}
			});
			
			return obstruct;
		} // End getPredesesorsBranch2
//---getPredesesorsBranch2<


// Show Predecesor and Sucessor functions
//---getPredecessorsMulti>
	window.getPredecessorsMulti =function getPredecessorsMulti(idTasks) {
			if (WF_DEBUG)
				console.info("getPredecessorsMulti(idTasks)", idTasks);
			var datos = {
				'action': 'getPredecessorsMulti',
				'WhichTask': idTasks,
				};
			var results = [];
			if (WF_DEBUG_AJAX)
				console.info('getPredecessorsMulti',"getPredecessorsMulti .RT2", datos);
			mirrorLog('getPredecessorsMulti','getPredecessorsMulti .RT2', datos ); 
			$.ajax({
				url: getUrl().RT2,
				type: 'POST',
				data: datos,
				async: false,
				dataType: 'text',
				beforeSend: function(data) { },
				success: function(data) { results = CleanResponseData(data) },
				error: function(err) { console.error('Error on NetSuite call getPredecessorsMulti', err) }
			});
			return results;
		} // End getPredecessorsMulti

//---getPredecessors>
	window.getPredecessors =function getPredecessors(idTask) {
			if (WF_DEBUG)
				console.info("getPredecessors(idTask)", idTask);
			var IDType='customrecord_task_predecessor', 
				IdParent='custrecord_tp_parent', 
				IdField='custrecord_tp_predecessor', 
				parent="treePredecessor";
			var datos = {
				'action': 'getPredecessors',
				'WhichTask': idTask,
				};
			var results = [];
			if (WF_DEBUG_AJAX)
				console.info('getPredecessors',"getPredecessors .RT2", datos);
			mirrorLog('getPredecessors','getPredecessors .RT2', datos ); 
			$.ajax({
				url: getUrl().RT2,
				data: datos,
				async: false,
				dataType: 'text',
				beforeSend: function(data) { },
				success: function(data) { results = CleanResponseData(data) },
				error: function(err) { console.error('Error on NetSuite call getPredecessors', err) }
			});
			return results;
		} // End getPredecessors
		
	
	
	
//---showPress>
	function showPress(idTask, fromUpdate) {
		if (WF_DEBUG)
			console.info("showPress(idTask, fromUpdate)", idTask, fromUpdate);
		var results = getPredecessors(idTask);
		var parent="treePredecessor";
		if (fromUpdate) {
			$('#tdPredecessor').children().remove();
		}
		var rowpre = '';
		results.forEach(function(press, index) {
			if(WF_DEBUG)
				console.log("showPress() Predessesor",press);
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
				((WorkForce_Obj.rolePM)? "<button type='button' class='btn btn-xm btn-info remove-dependency-pred'>Remove</button>" : "")+
				"	</div >" +
				"</div>"+
				"<br/>"+
				"<br/>"+
				"<hr>";
		});
		$("#tdPredecessor").append(rowpre);	
	} // End Succ-Press
//---showPress<




//---showSucc>
		function showSucc(idTask, fromUpdate) {
			if (WF_DEBUG)
				console.info("showSucc(idTask, fromUpdate)", idTask, fromUpdate);
	
			var IDType='customrecord_task_successor', 
				IdParent='custrecord_ts_parent',
				IdField='custrecord_ts_successor',
				parent='treeSuccessor';
					
			var datos = {
				'action': 'showSucc',
				'WhichTask': idTask,
				'IDType': IDType,
				'IdParent': IdParent,
				'IdField': IdField
			};

			if (WF_DEBUG_AJAX)
				console.info('showSucc',"showSucc .RT2", datos);

				mirrorLog('showSucc','showSucc .RT2', datos ); 

			$.ajax({
				url: getUrl().RT2,
				data: datos,
				async: false,
				// dataType: 'json',
				dataType: 'text',
				beforeSend: function(data) {
					if (fromUpdate) {
						$('#tdSucessor').children().remove();
					}
				},
				success: function(data) {
					var results = CleanResponseData(data);
					var rowsuc = '';
					results.forEach(function(succ, index) {
						// $("#succWO").hide(); not found the ID.
						if(WF_DEBUG)
							console.log("showSucc() Press",succ);
						// rowsuc = ''; we move the append after foreach.
						rowsuc += "" +
							"<a onclick='showTask(" + succ.idTask + ",\"table\");''>" + succ.title + "</a>" +
							"<br>" +
							"<div>" +
							"	<div style='float: left'>" +
							"		<p>" + (succ.startdate) + " - " + (succ.duedate) + "</p>" +
							"		<p>" + succ.assigned + "</p>" +
							"	</div>" +
							"	<div style='float: right'>" +
							"		<p align='rigth'>" + succ.duration + " day(s) </p>" +
							"		<p align='rigth'>" + succ.status + " </p>" +
							((WorkForce_Obj.rolePM)? "<button type='button' class='btn btn-xm btn-info remove-dependency-succ'>Remove</button>" : "") +
							"	</div >" +
							"</div>"+
							"<br/>"+
							"<br/>"+
							"	<hr>";
						// $("#tdSucessor").append(rowsuc);
					});
					$("#tdSucessor").append(rowsuc);
				},
				error: function(err) {
					//-alert('Error on NetSuite call');
					console.error('Error on NetSuite call showSuccessor', err);
				}
			});
		} //End showSucc ---------------------------------------------------------
//---showSucc<




// End of pre and suce functions
// Task Tree End
// Function to get AllServices




//---ChangeTableAllServices>
			function ChangeTableAllServices(WhichSalesOrder) {
				if (WF_DEBUG)
					console.info("ChangeTableAllServices(WhichSalesOrder)", WhichSalesOrder);
				
				var datos = {
						'action': 'getAllServices',
						'SO': WhichSalesOrder
					};
				
				if (WF_DEBUG_AJAX)
					console.info('ChangeTableAllServices',"getAllServices .BSL", datos );

				
					mirrorLog('ChangeTableAllServices','getAllServices .BSL', datos ); 

				$.ajax({
					url: getUrl().BSL,
					data: datos,
					async: false,
					dataType: 'text',
					success: function(data) {
						data = CleanResponseData(data);
						var toSelect = '<option value=""> Select Services </option>';
						var rows = '', rows_conf = '';
						var rown = 0;
						var row_bg = 'rowc-white';
						var tmpl_so_sitm = $('#saleorder-serviceitems-template').html();
						var tmpl_so_sitm_conf = $('#saleorder-serviceitems-conf-template').html();
							
						data.forEach(function(d) {
							rown ++;
							toSelect += "<option value='" + d.line + "_" + d.itemid + "' >" + d.line + " - " + d.itemName + " </option>"
							
							d.rown = rown;
							d.row_bg = row_bg;
							d.action_txt = ((d.action)?
									  "<label class='label-info' style='width:100%; text-align:center;'>"+d.action+"</label>" :
									  "<label class='label-warning' style='width:100%; text-align:center;'>NO ACTION</label>"	);
							
							rows +=  LeirAGS_Tmpl(tmpl_so_sitm, d);
							rows_conf +=  LeirAGS_Tmpl(tmpl_so_sitm_conf, d);
							
							row_bg = (row_bg =='rowc-white')? 'rowc-info' : 'rowc-white';
//							
							/*
							toSelect += "<option value='" + d.line + "_" + d.itemid + "' >" + d.line + " - " + d.itemName + " </option>"
							rows += "<tr data-line='" + d.line +
								"' data-item='" + d.itemid +
								"' data-toshow='" + d.line + "_" + d.itemid + "' class='"+row_bg+"'>" +
								"<td style='border-right:1px solid #AFA;'>" + rown + "</td>" +
								//-- "<td class='styleToId'>" + d.itemName + "</td>" +
								"<td class='styleToId'>" +
								((d.action)?
								"<label class='label-info' style='width:100%; text-align:center;'>"+d.action+"</label>" :
								"<label class='label-warning' style='width:100%; text-align:center;'>NO ACTION</label>"	) +
								d.itemName + "</td>" +
								"<td align='center'>" + d.capacity + "</td>" + "<td align='center'>" + d.UoM + "</td>" +
								"<td>" + d.options + "</td>" +
								"<td>" + d.LocationA + "</td>" +
								"<td>" + d.AddressA + "</td>" +
								"<td>" + d.LocationZ + "</td>" +
								"<td>" + d.AddressZ + "</td>" +
								"<td>" + d.EstimatedDate + "</td>" +
								"<td>" + "<a href='https://system.netsuite.com/app/common/custom/custrecordentry.nl?rectype=13&id="+d.subscription_val+"' target='_blank'> "+d.subscription+" </a></td>" +
								"</tr>";
								row_bg = (row_bg =='rowc-white')? 'rowc-info' : 'rowc-white';
							//console.log( d);
							*/
							
						});
						
						/* $("table#myUpdatedSA").find('tr:not(:first)').each(function() {
							$(this).remove();
						}); */
						
						$("table#myUpdatedSA tbody tr").each(function() {
							$(this).remove();
						});
						
						$("table#myUpdatedSA > tbody").append(rows);
						
						$("#conf-circuits").html('<ul class="nav nav-pills nav-stacked" style="margin:0px; padding:0px;">'+rows_conf+'</ul>');

						$("#selServices").children().remove();
						$("#selServices").append(toSelect);
						
						// Add Funcionality when click in table of services... apply filter...
						$('33#myUpdatedSA tbody tr').on('click', function(){
							var dsh = $(this).attr('data-toshow');
							$("#selServices").val( dsh );
							$("#filterButtonG").trigger('click');
						});
						
						$('#myUpdatedSA tbody tr td').on('click', function(){
							var myCol = $(this).index();
						    var $tr = $(this).closest('tr');
						    var myRow = $tr.index();
						    // $('#filtered_message').html('['+myRow+','+myCol+']');
						    if (myCol < 2){ // First and Second Column.
						    	var dsh = $tr.attr('data-toshow');
						    	$("#selAdresses").val( '' ); // Exclusive only once at the tinem
								$("#selServices").val( dsh );
								$("#filterButtonG").trigger('click');
						    }
						});

					},
					error: function(err) {
						//-alert('Error on NetSuite call');
						console.error('Error on NetSuite call ChangeTableAllServices', err);
					}
				});
			}
//---ChangeTableAllServices<




//---pageTasks>
		function pageTasks(thefunction) {
			var slice = parseInt($('#ButtonLoadMoreTasks').attr("data-slice"));
			var lastFunction = parseInt($('#ButtonLoadMoreTasks').attr("data-function"));
			var moreslice = slice + 1;
			if (lastFunction != thefunction) {
				$('#ButtonLoadMoreTasks').attr("data-slice", -1);
				moreslice = 0;
			 }
			$('#ButtonLoadMoreTasks').attr("data-slice", moreslice);
			$('#ButtonLoadMoreTasks').attr("data-function", thefunction);
			return moreslice;
		}
//---pageTasks<





//---ResetFiltersCheckbox>
		function ResetFiltersCheckbox() {
			$(".myUpdatedSA").find('input[type=checkbox]').each(function() {
				$(this).prop('checked', false);
			});
			$(".myUpdatedServicesAddresses").find('input[type=checkbox]').each(function() {
				$(this).prop('checked', false);
			});
		}
//---ResetFiltersCheckbox<




//---ChangeTableTasks>
		function ChangeTableTasks(WhichSalesOrder, Pm, fromReload) {
			if (WF_DEBUG)
				console.info("ChangeTableTasks(WhichSalesOrder, Pm, fromReload)", WhichSalesOrder, Pm, fromReload);
			
			// 2017-March-10 01:39PM --- Now use allways applying defaults filter...
			// Set default filters...
			$('[id^=filterAsignee_]').val("notuser0");
			$('[id^=filterDepartment]').val("notuser0");
			$('[id^=filterTask]').val("notstatus");
			
			// Cuando viene del gocomm no debemos hacer esto...2017-04-26
			// if(! WorkForce_Obj.rolePM)
			//	$('[id^=filterAsignee_]').val("onlymytasks");
			
			if(openSOfromTab == 'Customsalesorder') {
				var workspace_filter_assignee = $('#selMyTeam').val();
				if( workspace_filter_assignee )
					$('[id^=filterAsignee_]').val( workspace_filter_assignee );
			}
			
			$('#filterStartDate').val('');
			$('#filterDueDate').val('');
			$("#filterWoW").attr('checked', false);
			tristate1_set( $("#filterWoW2"), 1);
			$("#filterDurationStart").val('');
			$("#filterDurationEnd").val('');
			$("#selServices").val('');
			$("#selAdresses").val('');
			
			// Clear current task in the SO
			$('#mytblTasks').DataTable().destroy();
			$('#mytblTasks > tbody > tr').remove();
			destroyFlyDatePickers('mytblTask');
			//---- ---- ---- ---- -
			
			var currentSlice = pageTasks(-9); // get page to load...
			
			// Now call 
			SetTableTasksByFilters(true, WhichSalesOrder);
			
			return true;
			
			// DEROGATE - 2017-March-10 01:39PM --- Now use allways applying defaults filter...
			
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
			$('#filterStartDate').val('');
			$('#filterDueDate').val('');

			var currentSlice = pageTasks(1); // get page to load...
			var count = 0;
			var datos =  {
				'action': 'getTasksTable',
				'WhichSalesOrder': WhichSalesOrder,
				'pm': Pm,
				'selectPage': currentSlice,
			};
			
			if (WF_DEBUG_AJAX)
				console.info('ChangeTableTasks',"getTasksTable .RT", datos );

				mirrorLog('ChangeTableTasks','getTasksTable .RT', datos ); 

			$.ajax({
				url		: getUrl().RT,
				data	: datos,
				dataType: 'text',
				async: true,
				beforeSend: function(data) {
					$('#mytblTasks').DataTable().destroy();
					$('#mytblTasks > tbody > tr').remove();
					destroyFlyDatePickers('mytblTask');
				},
				complete: function(data) {
					if (WF_DEBUG)
						console.info('datacomplete', data);
				},
				success: function(data) {
					data = CleanResponseData(data);
					if (WF_DEBUG_AJAX_DATA)
						console.log('success data:', data);
					//	window.arrayalex = data;
					var rows;
					count = 0; //  This variable will set the suffix for the iterative row on course.
					var onChangeAckEnable = "onchange='changeAck.call(this)'";
					var onChangeAssignedEnable = 'onchange="changeSelectAsignee.call(this)"';
					var onChangeStatusEnable = 'onchange="changeselTaskStatus.call(this)"';
					var onChangeStartEnable = 'onchange="changeidPickerStartDate.call(this)"';
					var onChangeDueEnable = 'onchange="changeidPickerDueDate.call(this)"';
					var onChangeWoWEnable = "onchange='changeWorkOnWeekends.call(this)'";
					var StatusTaskLabel = ['', 'Active', 'Completed', 'Deferred', 'Cancelled'];
					var lstStatusSelect = $('input#custpage_selectstatustask').val();
					var WorkWeekend;
					var WorkWeekendDisplay;
					var BoolAck;
					var disableChangeEmployee;
					var vFilteredStatusList;
					var StatusTareaTexto;
					var enableEdit;
					var empName;
					
					/* From Now: 2017-03-05 
					 * data[0] = total rows
					 * data[1] = rows
					 * data[2] = pages length
					 * Notes: all way load 
					 */
					
					data[1].forEach(function(d) {
						WorkWeekend = d.taskWorkWeekend;
						disableChangeEmployee = false;
						vFilteredStatusList = lstStatusSelect;
						StatusTareaTexto = '';
						empName = getEmployeeName(d.taskAssignedID);
						count++;
						GlobalStartDate = d.GlobalStartDate;
						GlobarDueDate = d.GlobalDueDate;
						
						// If the employee works on Weekends then make the check input to be marked
						// This will input something like: $("input[id='WorkOnWeekends_7']").attr('checked', true)
						if (WorkWeekend) {
							WorkWeekendDisplay = "<input type='checkbox' onchange='' id='WorkOnWeekends_" + count + "' name='check' class='check' checked /><p style='font-size:0px;position:absolute;'>true</p>"
						} else {
							WorkWeekendDisplay = "<input type='checkbox' onchange='' id='WorkOnWeekends_" + count + "' name='check' class='check' /><p style='font-size:0px;position:absolute;'>false</p>"
						}
						
						if (d.taskAck) {
							BoolAck = "<input type='checkbox' onchange='' id='Ack_" + count + "' name='check' disabled class='check' checked />"
						} else {
							BoolAck = "<input type='checkbox' onchange='' id='Ack_" + count + "' name='check' class='check' />"
						}
						
						if (d.taskStatus) {
							vFilteredStatusList = lstStatusSelect.replace('value="'+d.taskStatus+'"', 'value="'+d.taskStatus+'" '+"selected");
						}

						// var vFilteredStatusList = vFilteredStatusList.replace('class="selectTaskStatus"', 'class="selectTaskStatus" title="You won\'t be able to update this task once the status changes to "completed/cancelled"');
						vFilteredStatusList = vFilteredStatusList.replace('id="selTaskStatus"', 'id="selTaskStatus' + count + '"');
						StatusTareaTexto = StatusTaskLabel[d.taskStatus];
						vFilteredStatusList = vFilteredStatusList.replace('</select>', '</select><p  class="kiko" style="font-size:0px;position:absolute;">' + StatusTareaTexto + '</p>');

						dtaskStartDate = d.taskStartDate;
						dtaskDueDate = d.taskDueDate;
						dtaskDuration = "<input id='idTask_Duration_" + count + "' onblur='blurDuration.call(this)' onkeyup='changeDuration.call(this)' data-dependency='" + d.taskDependency + "' data-predecessor='" + d.taskPredecessor +
							"' type='text' size='3' value=" + d.taskDuration + " data-wrikeid='" + d.WrikeID + "' data-tasktype='"+d.KpiTaskType+"' data-salesorder='" + WhichSalesOrder + "'>";
						dtaskUpdateIcon = "<div onclick='clickdico.call(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";

						//WHO CAN EDIT-------------------------------------------------------------
						// User is PM or is your task, and task is not cancel and  not completed. 
						enableEdit = getEnableEdit(d.taskAssignedID, d.taskStatus);
						disableChangeEmployee = ! enableChangeAssigned;
						//------------
						
						if (enableEdit){
							if (WorkForce_Obj.userID == d.taskAssignedID) 
								BoolAck = BoolAck.replace("onchange=''", onChangeAckEnable);
							else
								BoolAck = BoolAck.replace('input type', 'input disabled type');
							WorkWeekendDisplay = WorkWeekendDisplay.replace("onchange=''", onChangeWoWEnable);
							vFilteredStatusList = vFilteredStatusList.replace('onchange=""', onChangeStatusEnable);
							vFilteredStartDate = dtaskStartDate.replace('onchange=""', onChangeStartEnable);
							vFilteredDueDate = dtaskDueDate.replace('onchange=""', onChangeDueEnable);
							vFilteredEmployeesList = '<input type="hidden" value="'+d.taskAssignedID+'" id="selectAsignee'+count+'" '+onChangeAssignedEnable+'>'+
													 '<input class="employeeSelectFly" type="text" value="'+empName+'" '+((disableChangeEmployee)? 'disabled':' onClick="selectassignee(this)" data-onchg="selectAsignee'+count+'"')+' />';
							//DISABLE DATE FIELDS BASED ON DEPENDENCY --------------------------------------
							if ((d.taskDependency == "startToStart") || (!d.taskAck))
								vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
							
							if ((d.taskDependency == "startToFinish" || d.taskDependency == "finishToFinish") || (!d.taskAck)) 
								vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
							
						} else {
							disableChangeEmployee = true;
							BoolAck = BoolAck.replace('input type', 'input disabled type');
							WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
							vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name');
							vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
							vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
							dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
							dtaskUpdateIcon = "<div onclick='clickdico(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
							vFilteredEmployeesList = '<input type="hidden" value="'+d.taskAssignedID+'" id="selectAsignee'+count+'">'+
													 '<input class="employeeSelectFly" type="text" value="'+empName+'" disabled data-onchg="selectAsignee'+count+'">';
							
						}

						flagColorRedRow = getColorTaskValidate(d.setColortoRedOutDated, d.yellow, d.taskStatus);
						
						rows += "<tr data-id=" + d.taskId + " data-userid=" + d.taskAssignedID + " data-toshow='" + d.taskKpiLine + "_" + d.taskKpiItem + "' data-toshowaddress='" + d.taskKpiAddress + "' >" +
							"<td>"+count+" B</td>"+
							"<td class='styleToId' " + flagColorRedRow + "><span id='vtaskID" + count + "'  style='display:none'>" + d.taskId + "</span>"+
							"<a href='#' data-taskid='" + d.taskId + "' data-wrikeid='" + d.WrikeID + "' class='toOpenWrike'> " +
							" " + d.taskTitle + "</a></td>" +
							"<td onClick='locate_task_on_tree(this)'><span style='cursor: pointer;'>"+getNetSuiteImage('tree-structure-w', false)+"</span></td>"+
							//"<td class='styleToEntity' title='" + loggedUserID + " vs " + d.taskAssignedID + "' " + flagColorRedRow + ">" + vFilteredEmployeesList + "</td>" +
							"<td class='styleToEntity' title='" + WorkForce_Obj.userID + " vs " + d.taskAssignedID + "' " + flagColorRedRow + ">" + vFilteredEmployeesList + "</td>" +
							"<td align='center' id='TaskAck_" + count + "' " + flagColorRedRow + ">" + BoolAck + "</td>" +
							"<td id='TaskStatus_" + count + "' " + flagColorRedRow + ">" + vFilteredStatusList + "</td>" +
							"<td " + flagColorRedRow + ">" + vFilteredStartDate + "</td>" +
							"<td " + flagColorRedRow + ">" + vFilteredDueDate + "</td>" +
							"<td align='center'  " + flagColorRedRow + ">" + WorkWeekendDisplay + "</td>" +
							"<td align='center' " + flagColorRedRow + ">" + "<p style='font-size:0px;position:absolute;'>" + d.taskDuration + "</p>" + dtaskDuration + "</td>" +
							"</tr>";
					}); // end foreach task...
					
					// Add some empty rows...
					rows += '<tr><td colspan="10"></td></tr>';
					rows += '<tr><td colspan="10"></td></tr>';
					
					//console.log(count);
					$("table#mytblTasks > tbody").append(rows);
					
					$('[id^=idPicker_]').on('click',function(){
						addDatePickerOnFly( this );
					});

					var AllRows = data[0];
					var moreslice = parseInt((currentSlice + 1) * 20); // add one because start in 0 and is multiply by 20 (registers)

					if (moreslice < AllRows) {
						$('#ButtonLoadMoreTasks').prop('disabled', false);
					} else {
						moreslice = AllRows;
						$('#ButtonLoadMoreTasks').prop('disabled', true);
					}

					setTimeout(function() {
						if ($.fn.dataTable.isDataTable('#mytblTasks')) {
							$('#mytblTasks').DataTable().destroy();
						}
						table = $('#mytblTasks').DataTable({
							"dom": '<"top"if>rt<"bottom"lp><"clear">',
							"autoWidth": false, //--evitar cambio de tamano
							"bInfo": true,
							//"deferRender": true,
							"paging": false,
							"responsive": false,
							"scrollCollapse": true,
							"scrollY": "600px",
							"scroller": true,
							"searching": true,
							"ordering": true,
							"columns": [
								 null, null, null, { "orderDataType": "dom-sort-emp", type: 'string' }, null,
					             null, null, null, null, null
					             //{ "orderDataType": "dom-text-numeric" },
					             //{ "orderDataType": "dom-text", type: 'string' },
					             //{ "orderDataType": "dom-select" }
					             //{ "orderDataType": "sort_tranid" } --- created to SALESORDER tables...
					          ],
					        "order": [
								[6, "asc"]
							],
							"oLanguage": {
								 "sInfo": "Showing 1 to _END_ of "+AllRows+" entries"
							 }
						});
					}, 100);

					$('table#mytblTasks').css("display", "block");
					
				},
				error: function(err) {
					console.log('Error in NetSuite Call ChangeTableTasks', err);
				}
			}); // End of ChangeTableTasks function

		} // End ChangeTableTasks
//---ChangeTableTasks<




//---ChangeTableTasksParams>
		function ChangeTableTasksParams(arrayParams, Pm, fromButton) {
			if (WF_DEBUG)
				console.info("ChangeTableTasksParams(arrayParams, Pm, fromButton)", arrayParams, Pm, fromButton);

			ResetFiltersCheckbox();
			
			WhoFilterSO 			= arrayParams[0];
			WhoFilterAsignee 		= arrayParams[1];
			WhoFilterTask 			= arrayParams[2];
			WhoFilterSD 			= arrayParams[3];
			WhoFilterDD 			= arrayParams[4];
			WhoFilterWoW 			= arrayParams[5];
			WhoFilterDurationFrom 	= arrayParams[6];
			WhoFilterDurationTo 	= arrayParams[7];
			WhoFilterDepartment 	= arrayParams[8];
			whoFilterItemId 		= arrayParams[9];
			whoFilterIdAdress 		= arrayParams[10];
			WhoFilterWoW2 			= arrayParams[11];

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

			var currentPage = pageTasks(2); // get page to load
			//console.log(currentPage);
			
			var datos = {
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
				'selectPage': currentPage,
				'itemId': whoFilterItemId,
				'idAdress': whoFilterIdAdress,
				'theTeam': JSON.stringify(WorkForce_MyTeam),
				'auditId': WorkForce_Obj.auditId,
				'WoW2': WhoFilterWoW2, // values 1,2,3 ... 
			};

			if (WF_DEBUG_AJAX)
				console.info('ChangeTableTasksParams',"getTasksTablev2 .RT", datos );

			  mirrorLog('ChangeTableTasksParams','getTasksTablev2 .RT', datos ); 

			$.ajax({
				url: getUrl().RT,
				data: datos,
				dataType: 'text',
				beforeSend: function(data) {
					$('#mytblTasks').DataTable().destroy();
					if(!fromButton){
						$('#mytblTasks tbody tr').remove();
						destroyFlyDatePickers('mytblTasks');
					}
				},
				success: function(data) {
					data = CleanResponseData(data);
					var rows = '';
					var count = 0;
					var StatusTaskLabel = ['', 'Active', 'Completed', 'Deferred', 'Cancelled'];
					var onChangeAckEnable = "onchange='changeAck.call(this)'";
					var onChangeAssignedEnable = 'onchange="changeSelectAsignee.call(this)"';
					var onChangeStatusEnable = 'onchange="changeselTaskStatus.call(this)"';
					var onChangeStartEnable = 'onchange="changeidPickerStartDate.call(this)"';
					var onChangeDueEnable = 'onchange="changeidPickerDueDate.call(this)"';
					var onChangeWoWEnable = "onchange='changeWorkOnWeekends.call(this)'";
					var lstStatusSelect = $('input#custpage_selectstatustask').val();
					var StatusTareaTexto = '';
					var BoolAck;
					var WorkWeekend;
					var WorkWeekendDisplay;
					var disableChangeEmployee;
					var enableEdit;
					var empName;
					/*
						Notes: sice 2017-03-12 11:36
						'data' is a object
						 rowscount :
						 rows :
						 pagescount :
					*/
					
					(data.rows).forEach(function(d) {
						//console.log(d);
						GlobarDueDate = d.GlobalDueDateRed;
						GlobalStartDate = d.GlobalStartDate;
						var vFilteredStatusList = lstStatusSelect;
						empName = getEmployeeName(d.taskAssignedID);

						//  This variable will set the suffix for the iterative row on course.
						count++;
						
						// We save the Work on Weekend state here
						WorkWeekend = d.taskWorkWeekend;
						disableChangeEmployee = false;

						// If the employee works on Weekends then make the check input to be marked
						// This will input something like: $("input[id='WorkOnWeekends_7']").attr('checked', true)
						if (WorkWeekend) {
							WorkWeekendDisplay = "<input type='checkbox' onchange='' id='WorkOnWeekends_" + count + "' name='check' class='check' checked />"
						} else {
							WorkWeekendDisplay = "<input type='checkbox' onchange='' id='WorkOnWeekends_" + count + "' name='check' class='check' />"
						}
						
						if (d.taskAck) {
							BoolAck = "<input type='checkbox' onchange='' id='Ack_" + count + "' name='check' disabled class='check' data-oldAck='true' checked />"
						} else {
							BoolAck = "<input type='checkbox' onchange='' id='Ack_" + count + "' name='check' class='check' data-oldAck='false' />"
						}
						
						if(d.taskStatus)
							vFilteredStatusList = lstStatusSelect.replace('value="'+d.taskStatus+'"', 'value="'+d.taskStatus+'" '+"selected");
						
						vFilteredStatusList = vFilteredStatusList.replace('selTaskStatus', 'selTaskStatus' + count); 
						vFilteredStatusList = vFilteredStatusList.replace('id="selTaskStatus"', 'id="selTaskStatus' + count + '"');
						StatusTareaTexto = StatusTaskLabel[d.taskStatus];
						vFilteredStatusList = vFilteredStatusList.replace('</select>', '</select><p  class="kiko" style="font-size:0px;position:absolute;">' + StatusTareaTexto + '</p>');
						dtaskStartDate = d.taskStartDate;
						dtaskDueDate = d.taskDueDate;
						dtaskDuration = "<input id='idTask_Duration_" + count + "' onblur='blurDuration.call(this)' onkeyup='changeDuration.call(this)' data-dependency='" + d.taskDependency + "' data-predecessor='" + d.taskPredecessor +
							"' type='text' size='2' value=" + d.taskDuration + " data-wrikeid='" + d.WrikeID + "' data-tasktype='"+d.KpiTaskType+"' data-salesorder='" + WhoFilterSO + "'>";
						dtaskUpdateIcon = "<div onclick='clickdico.call(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
						
						
						//WHO CAN EDIT-------------------------------------------------------------
						// User is PM or is your task, and task is not cancel and  not completed. 
						enableEdit = getEnableEdit(d.taskAssignedID, d.taskStatus);
						disableChangeEmployee = ! enableChangeAssigned;
						//------------
						
						var vFilteredStatusList_No = '';
						
						if (enableEdit){
							if (WorkForce_Obj.userID == d.taskAssignedID) 
								BoolAck = BoolAck.replace("onchange=''", onChangeAckEnable);
							else
								BoolAck = BoolAck.replace('input type', 'input disabled type');
							vFilteredStatusList_No = vFilteredStatusList.replace('select name', 'select disabled name');
							WorkWeekendDisplay = WorkWeekendDisplay.replace("onchange=''", onChangeWoWEnable);
							vFilteredStatusList = vFilteredStatusList.replace('onchange=""', onChangeStatusEnable);
							vFilteredStartDate = dtaskStartDate.replace('onchange=""', onChangeStartEnable);
							vFilteredDueDate = dtaskDueDate.replace('onchange=""', onChangeDueEnable);
							vFilteredEmployeesList = '<input type="hidden" value="'+d.taskAssignedID+'" data-old-assigned="'+d.taskAssignedID+'" id="selectAsignee'+count+'" '+onChangeAssignedEnable+'>'+
													 '<input class="employeeSelectFly" type="text" value="'+empName+'" '+((disableChangeEmployee)? 'disabled':' onClick="selectassignee(this)" data-onchg="selectAsignee'+count+'"')+' />';
							//DISABLE DATE FIELDS BASED ON DEPENDENCY --------------------------------------
							if ((d.taskDependency == "startToStart") || (!d.taskAck))
								vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
							
							if ((d.taskDependency == "startToFinish" || d.taskDependency == "finishToFinish") || (!d.taskAck))
								vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
							
						} else {
							disableChangeEmployee = true;
							BoolAck = BoolAck.replace('input type', 'input disabled type');
							WorkWeekendDisplay = WorkWeekendDisplay.replace('input type', 'input disabled type');
							vFilteredStatusList_No = vFilteredStatusList.replace('select name', 'select disabled name');
							vFilteredStatusList = vFilteredStatusList.replace('select name', 'select disabled name');
							vFilteredStartDate = dtaskStartDate.replace('input type', 'input disabled type');
							vFilteredDueDate = dtaskDueDate.replace('input type', 'input disabled type');
							dtaskDuration = dtaskDuration.replace('input id', 'input disabled id');
							dtaskUpdateIcon = "<div onclick='clickdico(this)' id='dico" + count + "' class='GoUpdateDisabled'></div>";
							vFilteredEmployeesList = '<input type="hidden" value="'+d.taskAssignedID+'" data-old-assigned="'+d.taskAssignedID+'" id="selectAsignee'+count+'">'+
													 '<input class="employeeSelectFly" type="text" value="'+empName+'" disabled data-onchg="selectAsignee'+count+'">';
							
						}
										
						flagColorRedRow = getColorTaskValidate(d.setColortoRedOutDated, d.yellow, d.taskStatus);
						
						var EditStatus_No = "<td id='TaskStatus_" + count + "' " + flagColorRedRow + ">" + vFilteredStatusList_No + "</td>";
						
						var EditStatus_Yes= "<td id='TaskStatus_" + count + "' " + flagColorRedRow + "> <span style='display:none;'>" + vFilteredStatusList + "</span>" +
						'<div class="dropdownF" style="width:100%;">\
						  <p class="dropbtnF" onClick="var elem=$(\'#ssb_'+count+'r\'); if($(elem).css(\'display\')==\'none\') $(elem).css(\'display\',\'block\'); else $(elem).css(\'display\',\'none\');" >'+StatusTaskLabel[d.taskStatus]+'<span class="glyphicon glyphicon-menu-down pull-right" aria-hidden="true"></span></p>\
						  <div class="dropdown-content" id="ssb_'+count+'r">\
						    <a href="#" onClick="$(\'#ssb_'+count+'r\').css(\'display\',\'none\'); $(\'#selTaskStatus'+count+'\').val(1).trigger(\'change\');" ><span class="glyphicon glyphicon-time" aria-hidden="true" style="margin-right:16px"></span> Active</a>\
						    <a href="#" onClick="$(\'#ssb_'+count+'r\').css(\'display\',\'none\'); $(\'#selTaskStatus'+count+'\').val(2).trigger(\'change\');" ><span class="glyphicon glyphicon-check" aria-hidden="true" style="margin-right:16px"></span> Completed</a>\
						    <!-- a href="#" onClick="$(\'#ssb_'+count+'r\').css(\'display\',\'none\'); $(\'#selTaskStatus'+count+'\').val(4).trigger(\'change\');" ><span class="glyphicon glyphicon-remove" aria-hidden="true" style="margin-right:16px"></span> Cancelled 6666</a -->\
						    <a href="#" onClick="$(\'#ssb_'+count+'r\').css(\'display\',\'none\'); cancellingTask('+d.taskId+',\''+count+'\','+d.SalesOrderID+'); /*$(\'#selTaskStatus'+count+'\').val(4).trigger(\'change\');*/" ><span class="glyphicon glyphicon-remove" aria-hidden="true" style="margin-right:16px"></span> Cancelled</a>\
						    <!-- a href="#" onClick="$(\'#ssb_'+count+'r\').css(\'display\',\'none\'); $(\'#selTaskStatus'+count+'\').val(3).trigger(\'change\');" ><span class="glyphicon glyphicon-remove-sign" aria-hidden="true" style="margin-right:16px"></span> Deferred</a -->\
						  </div>\
						</div>'+
						"</td>";

						rows += "<tr data-rown="+count+" data-id=" + d.taskId + " data-userid=" + d.taskAssignedID + " data-toshow='" + d.taskKpiLine + "_" + d.taskKpiItem + "' data-toshowaddress='" + d.taskKpiAddress + "' >" +
							"<td " + flagColorRedRow + ">" + count + ((disableChangeEmployee)?"_":" <input type='checkbox' class=\"tbltasks-reasigne\"/>") + "</td>" +
							"<td class='styleToId' " + flagColorRedRow + "><span id='vtaskID" + count + "' style='display:none'>" + d.taskId + "</span>"+
							"<a href='#' data-taskid='" + d.taskId + "' data-wrikeid='" + d.WrikeID + "' class='toOpenWrike'>"+ d.taskTitle +"</a></td>" +
							//"<td onClick='locate_task_on_tree(this)' style='cursor: pointer;'>"+getNetSuiteImage('tree-structure-w', false)+"</td>"+
							
							"<td align='left'>"+
							" <span id='vtaskID" + count + "' style='display:none'>" + d.taskId + "</span> "+
							'<div class="dropdown">\
							  <p class="dropbtn">'+getNetSuiteImage('details-popup-w', false)+'</p>\
							  <div class="dropdown-content">\
							    <a href="#" onClick="getTaskNotes('+d.taskId+','+$('#IdSalesOrderBySpan').text()+',\''+(d.taskTitle).replace(/'/g,"\\'")+'\',this); jQScrollTo(\'task-messages\');">'+getNetSuiteImage('note', false)+' Open Comments Task [A]</a>\
							    <a href="#" onClick="openNetSuiteTask('+d.taskId+')">'+getNetSuiteImage('netsuite15', false)+' Open NetSuite Task</a>\
							    <a href="#" onClick="locate_task_on_tree(this)">'+getNetSuiteImage('tree-structure-b', false)+' Show in Tree-View</a>\
							    <!-- '+((d.WrikeID)?'<a href="#" class="toOpenWrike" data-taskid="'+d.taskId+'" data-wrikeid="'+d.WrikeID+'">'+getNetSuiteImage('wrike', false)+' Add Comment</a>':'<p>'+getNetSuiteImage('wrike', false)+' No Write Comments</p>')+' -->\
							    <a href="#" onClick="getPredesesorsBranch('+d.taskId+',true)">'+getNetSuiteImage('tasks-c-16', false)+' Predeccesor Chain </a> \
							    <a href="#" onClick="getSuccessorsBranch('+d.taskId+',true)">'+getNetSuiteImage('tasks-c-16', false)+' Successor Chain</a> \
							    '+((d.taskStatus != 1 && WorkForce_Obj.rolePM)?'<a href="#" onClick="reactivateTask('+d.taskId+',\''+count+'\','+d.SalesOrderID+')">'+getNetSuiteImage('todo-list-c-24', false)+' Re-Activate Task</a>':'')+' \
							  </div>\
							</div>'+
							"</td>"+
							
							// "<td class='styleToEntity' title='" + loggedUserID + " vs " + d.taskAssignedID + "' " + flagColorRedRow + ">" + vFilteredEmployeesList + "</td>" +
							
							"<td class='styleToEntity' " + flagColorRedRow + ">" + vFilteredEmployeesList + "</td>" +
							
							"<td align='center' id='TaskAck_" + count + "' " + flagColorRedRow + ">" + BoolAck + "</td>" +
							
							//-- "<td id='TaskStatus_" + count + "' " + flagColorRedRow + ">" + vFilteredStatusList + "</td>" +
							
							// ((disableChangeEmployee)? EditStatus_No : EditStatus_Yes) +
							// (((WorkForce_Obj.userID == d.taskAssignedID || WorkForce_Obj.auditId == d.taskAssignedID) && (d.taskAck))? EditStatus_Yes : EditStatus_No) +
							
							(((WorkForce_Obj.userID == d.taskAssignedID || WorkForce_Obj.auditId == d.taskAssignedID || WF_Develop_State ) && (d.taskAck && d.taskStatus==1) )? EditStatus_Yes : EditStatus_No) +
							
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
					
					// Append some empty rows...
					rows += '<tr class="todelete" style="height:250px"><td style="color:#FFF">30000</td><td></td><td></td><td><input class="employeeSelectFly" type="hidden" value="ZZZZ1"></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
					
					//console.log(count);
					$("table#mytblTasks > tbody").append(rows);

					var AllRows = data.rowscount;
					
					if (rows.length < AllRows) {
						$('#ButtonLoadMoreTasks').prop('disabled', false);
					} else {
						moreslice = AllRows;
						$('#ButtonLoadMoreTasks').prop('disabled', true);
					}

					$('[id^=idPicker_]').on('click',function(){
						addDatePickerOnFly( this );
					});
					
					if(!rows.length){
						// Set message if not record founds...
						var prev_msg = $('#filtered_message').html();
						if(WorkForce_Obj.auditId)
							prev_msg += ' <p class="label label-warning">The user auditing have no Task assigne.</p>';
						$('#filtered_message').html( prev_msg );
					}
					
					//----Assignee by group ...
						// Unmark ALL checkbox's
					    $('input.tbltasks-reasigne').each(function(){
							$(this).prop("checked", false );
						});
					    $('#tbltasks_group_assigne').val('0'); // Clear Assignne Group ID
					    $('#tbltasks_group_assigne_name').val(''); // Clear Assignne Group Name
					    $('#tbltasks_select-assignee-group').fadeOut();
					//----
					
					setTimeout(function() {
						if ($.fn.dataTable.isDataTable('#mytblTasks')) {
							$('#mytblTasks').DataTable().destroy();
							destroyFlyDatePickers('mytblTasks');
						}
						table = $('#mytblTasks').DataTable({
							"dom": '<"top"if>rt<"bottom"lp><"clear">',
							"autoWidth": false, //--evitar cambio de tamano
							"bInfo": true,
							//"deferRender": true,
							"paging": false,
							"responsive": false,
							//-- "scrollCollapse": true,
							//-- "scrollY": "600px",
							"scroller": true,
							"searching": true,
							"ordering": true,
							"columns": [
								 null, null, null, { "orderDataType": "dom-sort-emp", type: 'string' }, null,
					             null, null, null, null, null
					             //{ "orderDataType": "dom-text-numeric" },
					             //{ "orderDataType": "dom-text", type: 'string' },
					             //{ "orderDataType": "dom-select" }
					             //{ "orderDataType": "sort_tranid" } --- created to SALESORDER tables...
					          ],
					        "order": [
								[3, "asc"]
							],
							"oLanguage": {
								 "sInfo": "Showing 1 to _END_ of "+AllRows+" entries"
							 }
						});
						// Esto faltaba por eso salian en ceros ERRBLANK
						$('[id^=idPicker_]').on('click',function(){
							addDatePickerOnFly( this );
						});
						

					}, 100);
				},
				complete: function(data) {

				},
				error: function(err) {
					console.log("Error on ChangeTableTasksParams call ", err);
				}
			});
			return false;
		} // End ChangeTableTasksParams
//---ChangeTableTasksParams<


			

//---hideAllNoneAssignedRows>
			function hideAllNoneAssignedRows() {
				//console.log('Function to hide all none assigned tasks rows to user');
			}
//---hideAllNoneAssignedRows<




//---findEmployeesOfProject>
			window.findEmployeesOfProject = function findEmployeesOfProject(idSO) {
					if (WF_DEBUG)
						console.info("findEmployeesOfProject(idSO)", idSO);
					
					var datos = {
						'action': 'getEmployeesOfProject',
						'idSO': idSO
					};
					
					if (WF_DEBUG_AJAX)
						console.info('findEmployeesOfProject',"getEmployeesOfProject .RT", datos );

					mirrorLog('findEmployeesOfProject','getEmployeesOfProject .RT', datos ); 

					var ReturnedData = {};
					$.ajax({
						url: getUrl().RT,
						async: false,
						data: datos,
						dataType: 'text',
						success: function(data) {
							data = CleanResponseData(data);
							var optionSelectConstructor = '';
							data.forEach(function(d) {
								optionSelectConstructor = optionSelectConstructor + '<option value=' + d.assignedId + '>' + d.assignedName + '</option>';
							});
							ReturnedData = optionSelectConstructor;
						},
						error: function(err) {
							console.log("Error on findEmployeesOfProject call", err);
						}
					});
					return ReturnedData;
				}
//---findEmployeesOfProject<




//---getSalesOrderData>
			window.getSalesOrderData = function getSalesOrderData(idSO) {
				if (WF_DEBUG)
					console.info("getSalesOrderData(idSO)", idSO);
				
				var ReturnedData = {};
				
				// Show communication tab
				$('#task-communication').hide();
				
				var datos = {
					'action': 'getSalesOrderData',
					'idSO': idSO
				};
				
				if (WF_DEBUG_AJAX)
					console.info('getSalesOrderData',"getSalesOrderData .RT", datos );

				
					mirrorLog('getSalesOrderData','getSalesOrderData .RT', datos ); 

				$.ajax({
					url: getUrl().RT,
					async: false,
					data: datos,
					success: function(data) {
						data = CleanResponseData(data);
						var optionSelectConstructor = '';
						data.forEach(function(d) {
							optionSelectConstructor = optionSelectConstructor + '<option value=' + d.DepartmentdId + '>' + d.DepartmentName + '</option>';
						});
						ReturnedData = optionSelectConstructor;
					},
					error: function(e) {
						console.error ("Error on getDepartmentOfProject call",e);
						mirrorLog('getDepartmentOfProject','ERROR', e ); 
					}
				});
			}
//---getSalesOrderData<



//---getDepartmentOfProject>
			window.getDepartmentOfProject = function getDepartmentOfProject(idSO) {
				if (WF_DEBUG)
					console.info("getDepartmentOfProject(idSO)", idSO);
				var ReturnedData = {};
				var datos = {
					'action': 'getDepartmentOfProject',
					'idSO': idSO
				};
				
				if (WF_DEBUG_AJAX)
					console.info('getDepartmentOfProject',"getDepartmentOfProject .RT", datos );

				
					mirrorLog('getDepartmentOfProject','getDepartmentOfProject .RT', datos ); 

				$.ajax({
					url: getUrl().RT,
					async: false,
					data: datos,
					success: function(data) {
						data = CleanResponseData(data);
						var optionSelectConstructor = '';
						data.forEach(function(d) {
							optionSelectConstructor = optionSelectConstructor + '<option value=' + d.DepartmentdId + '>' + d.DepartmentName + '</option>';
						});
						ReturnedData = optionSelectConstructor;
					},
					error: function(e) {
						console.error ("Error on getDepartmentOfProject call",e);
						mirrorLog('getDepartmentOfProject','ERROR', e ); 
					}
				});
				return ReturnedData;
			}
//---getDepartmentOfProject<




//---UpdateEndByDuration>
			window.UpdateEndByDuration = function UpdateEndByDuration(idInput) {
				var num = String(idInput).split('_').pop();
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
			window.UpdateStartByDuration = function UpdateStartByDuration(idInput) {
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
			window.dhm = function dhm(t) {
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
			window.getSelectText = function getSelectText(selId) {
				var sel = document.getElementById(selId);
				var i = sel.selectedIndex;
				var selected_text = sel.options[i].text;
				return selected_text;
			}
//---getSelectText<




//---formatDate>
			window.formatDate = function formatDate(date) {
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
			window.formatDatebyNetsuiteDate = function formatDatebyNetsuiteDate(date) {

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
			window.Datemasuno = function Datemasuno(date) {
				return new Date(date);
				// derogate date and calender is working ok now
				var d = new Date(date).getTime();
				d = d + (86400 * 1000); // Add one Day to Current Date
				d = new Date(d);
				return d;
			}
//---Datemasuno<




//---isHoliday>
			window.isHoliday = function isHoliday(date, weekend) {
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
			// Metodo para Obtener los dias de duracion, 
			// dependiendo de la fecha de inicio, fecha de termino y si fin de semana (False, True)
			window.recomputeDuration = function recomputeDuration(start, end, weekend) {
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
			window.computeStartByDuration = function computeStartByDuration(end, duration, weekend) {
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
			window.computeStartDate = function computeStartDate(start, weekend, plus) {
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
			window.computeStart = function computeStart(start, weekend, plus) {
				weekend = weekend || false;
				plus = plus || 12;
				return computeStartDate(start, weekend, plus).getTime();
			}
//---computeStart<




//---computeEndByDuration>
			// Metodo para Obtener la fecha de Termino apartir de 
			// la fecha de inicio, Duracion y Trabaja fin de semana (false, true)
			window.computeEndByDuration = function computeEndByDuration(start, duration, weekend, n) {
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


//---getDatafromPredecessor>
			window.getDatafromPredecessor = function getDatafromPredecessor(predecessor) {
				if (WF_DEBUG)
					console.info("getDatafromPredecessor(predecessor)", predecessor);
				var datos = {
						'action': 'getTaskPredecessor',
						'id': predecessor
					};
				
				if (WF_DEBUG_AJAX)
					console.info('getDatafromPredecessor',"getTaskPredecessor .RT", datos );
				
					mirrorLog('getDatafromPredecessor','getTaskPredecessor .RT', datos ); 

				var ReturnedData = {};
				
				$.ajax({
					url: getUrl().RT,
					async: false,
					data: datos,
					dataType: 'text',
					success: function(data) {
						data = CleanResponseData(data);
						ReturnedData = data;
					},
					error: function(err) {
						console.log("Error on ajax call, try again ", err);
					}
				});
				//console.log(ReturnedData);
				return ReturnedData;
			}
//---getDatafromPredecessor<


//---UpdatewithDurationbyDependency>
			window.UpdatewithDurationbyDependency = function UpdatewithDurationbyDependency(Input) {
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
			window.UpdateDurationbyStart = function UpdateDurationbyStart(idInput, WorkWeekend) {
				var arrayString = String(idInput).split('_');
				var p1 = arrayString[1];
				var num = arrayString[2];
				var idDueDate = '#idPicker_DueDate_' + num;
				var idStartDate = '#idPicker_StartDate_' + num;
				var idDuration = '#idTask_Duration_' + num;
				var isChecked = $('input[id=WorkOnWeekends_' + num + ']').is(':checked');
				var Start = StringNetsuiteDateToDate($(idStartDate).val());
				//	var Duration = $(idDuration).children().eq(0).val();
				var Duration = $(idDuration).val();
				var due = StringNetsuiteDateToDate($(idDueDate).val());
				//alert($(idWorkWeekend).val());
				var StarDateWithcWeekend = computeStart(Start.getTime(), isChecked);
				$(idStartDate).val(dateToStringNetsuite(new Date(StarDateWithcWeekend)));
				//var Start2 = new Date($(idStartDate).children().eq(0).val());
				//console.log('Change Start Date : ' + formatDate(StarDateWithcWeekend) + " : " + StarDateWithcWeekend);
				var Totalduration = recomputeDuration(StarDateWithcWeekend, due.getTime(), isChecked);
				if(WF_DEBUG) console.info('StarDateWithcWeekend',new Date(StarDateWithcWeekend),'due',due,'Totalduration',Totalduration);
				//$(idDuration).children().eq(0).val(Totalduration);
				$(idDuration).val(Totalduration);
				//console.log('Change Duration : ' + Totalduration);
			}
//---UpdateDurationbyStart<




//---UpdateDuration>
			window.UpdateDuration = function UpdateDuration(idInput, WorkWeekend) {
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
					var Start = StringNetsuiteDateToDate( $(idStartDate).val() );
					//var Duration = $(idDuration).children().eq(0).val();
					var Duration = $(idDuration).val();
					var StarDateWithcWeekend = computeStart(Start.getTime(), isChecked);
					var DueDate = new Date(computeEndByDuration(StarDateWithcWeekend, Duration, isChecked, 1));//1
					//alert(formatDate(DueDate));
					//	$(idDueDate).val(DueDate.toString());
					//$(idStartDate).val(StarDateWithcWeekend.toString());
					// -	$(idDueDate).children().eq(0).val(formatDate(DueDate));
					if(WF_DEBUG)
						console.info('UpdateDuration()','StarDateWithcWeekend:',StarDateWithcWeekend,'DueDate:',DueDate,'Start:',Start);

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



//---changeSelectAsignee>
			window.changeSelectAsignee = function changeSelectAsignee() {
				var idparent = $(this)[0].id;
				var vExtract = idparent.split("Asignee").pop();
				
				if(WF_DEBUG) {
					console.info('changeSelectAsignee this',this);
					console.info('changeSelectAsignee idparent',idparent);
				}
				
				changeDico(vExtract);
				return false;
				//	changeDico(vExtract);
			}
//---changeSelectAsignee<




//---changeLoadAsigneeTasksW>
			window.changeLoadAsigneeTasksW = function changeLoadAsigneeTasksW() {
				//console.log("Value :"+ $(this)[0].value);
				//console.log("Id :"+ $(this)[0].id);
				var SelectIndex = $(this)[0].value;
				//console.log(SelectIndex);
				//console.log($(this)[0].id);
				var vExtract = ($(this)[0].id).split("_").pop();
				ChangeTableTasks(vExtract, SelectIndex, 'notask', WorkForce_Obj.rolePM);
				//console.log(vExtract);
				return false;
			}
//---changeLoadAsigneeTasksW<




//---changeLoadStatusTasks>
			window.changeLoadStatusTasks = function changeLoadStatusTasks() {
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
			window.changeDico = function changeDico(vExt) {
				$('#ButtonLoadMoreTasks').attr("data-slice", -1);
				setTimeout(function() {
					clickdico(vExt);
				}, 10); // Was 500... by ariel. was 50 ... 2017-04-25-06:16
			}
//---changeDico<




//---getLastStatus>
			window.getLastStatus = function getLastStatus(e) {
				GlobalLastStatus = $(this)[0].value;
			}
//---getLastStatus<




//---changeselTaskStatus>
			window.changeselTaskStatus = function changeselTaskStatus() {
				var idparent = $(this)[0].id;
				var StatusID = $(this)[0].value;
				var previosStat = $(this).closest("tr").find("p.kiko").text();

				//console.log($(this));
				var StatusName = $("#" + idparent + " option:selected").text();
				var vExtract = idparent.split("lTaskStatus").pop();
				
				//-- Get TaskID trying to Change....
				var post_taskid = $("#vtaskID" +	 vExtract).html();
				if(WF_DEBUG)
					console.info('post_taskid',post_taskid);
				
				//-- Get if predecessors obstruct complete this task. 
				var is_obstruct = getPredesesorsBranch(post_taskid, false);
				PredecessorRealBlocking = is_obstruct;
				if(WF_DEBUG)
					console.info('post_taskid_obstruct',(is_obstruct)?"PREDECESOR IS BLOCKING":"FREE TO UPDATE");
				
				// Validate Diferent to ACTIVE. if ( (StatusName != "Active" || StatusID != 1) && is_obstruct ) {
					
				function inputsset(dis){
					$('#idPicker_StartDate_' + vExtract).prop('disabled', dis);
					$('#idPicker_DueDate_' + vExtract).prop('disabled', dis);
					$('#idTask_Duration_' + vExtract).prop('disabled', dis);
					$('#WorkOnWeekends_' + vExtract).prop('disabled', dis);
				}
				
				// Validate blocking only if try to complete...
				if ( (StatusName == "Completed" || StatusID == 2) && is_obstruct ) {
					// Get value to set on select ...
					var xval=''; $("#"+ idparent +" option").map(function(e,o){ if(o.text == previosStat) xval=o.value });
					//Restore on Select to previous...
					$("#"+ idparent +"").val(xval);
					confirm('Predecessors are not yet completed...\nClick "Dependency Chain" to see details.');
					return false;
				}
				//-- return false;

				if ((StatusName == "Completed" || StatusID == 2) || (StatusName == "Cancelled" || StatusID == 4)) {
					
					// Verify if user disable confirmations....
					if( $('#cnfs').is(':checked') ) {
						if (confirm("You won\'t be able to update this task once the status changes to completed or cancelled.\n\nAre you sure to continue ?")) {
							RuleToStatus(vExtract);
							inputsset(true);
						} else {
							//$(this).val(GlobalLastStatus);
							$(this).val(previosStat);
							if(WF_DEBUG)
								console.info('User cancel action change status.');
							return false;
						}
					} else {
						if(WF_DEBUG)
							console.info('Confirmations was disabled by user.');
						RuleToStatus(vExtract);
						inputsset(true);
					}
					
				} else {
					inputsset(false);
				}
				changeDico(vExtract);
				return false;
			}
//---changeselTaskStatus>




//---RuleToStatus>
	// Basado en el cambio de estatus.
	// Fijar la fecha duedate al dia de hoy
	// Si el start date esta en el futuro cambiarlo al dia de hoy
	// Si el Start date esta en el pasado dejarlo como esta
	// Por ultimo calcular la duracion
	// -----------
	// Recordar que las fechas estan en el formato de NetSuite "Siempre" 
	// y se leen al momento y se fijan en el formato de NetSuite tambien.
	// -----------
		window.RuleToStatus = function RuleToStatus(vExtract) {
			// Set Ids
			var idDueDate = '#idPicker_DueDate_' + vExtract;
			var idStartDate = '#idPicker_StartDate_' + vExtract;
			var idDuration = '#idTask_Duration_' + vExtract;
			var idWonW = '#WorkOnWeekends_' + vExtract;
			var idStatus = '#selTaskStatus' + vExtract;
			
			// Get Values
			var WonW 	 = $(idWonW).is(':checked');
			var Due 	 = StringNetsuiteDateToDate( $(idDueDate).val() ) .setHours(0,0,0);
			var Start 	 = StringNetsuiteDateToDate( $(idStartDate).val() ) .setHours(0,0,0);
			var Duration = $(idDuration).val();
			var Status   = $(idStatus).val();
			
			// Get Now 
			var nowT	= new Date().setHours(0, 0, 0, 0);
			
			if (Start > nowT) {
				var newStart = computeStart(nowT, WonW);
					$(idStartDate).val(dateToStringNetsuite( new Date(newStart) ) );
				var newDuration = 1;
					$(idDuration).val(newDuration); // Duration se iguala a 1
				var newDue = computeEndByDuration(newStart, newDuration, WonW, 1);
					$(idDueDate).val(dateToStringNetsuite(new Date(newDue)));
				
			} else if ((Start < nowT) && (Due >= nowT)) {
				if (Status == 1) { // On reActivating...
					var newStart = computeStart(nowT, WonW); // Fix if necesary bases on WonW
						$(idStartDate).val(dateToStringNetsuite( new Date(newStart) ) ); // Set in case of changed 
					var newDuration = recomputeDuration(newStart, nowT, WonW);
						$(idDuration).val(newDuration);
					var newDue = computeEndByDuration(newStart, newDuration, WonW, 1);
						$(idDueDate).val(dateToStringNetsuite(new Date(newDue)));
				} else {
					var newDuration = recomputeDuration(Start, nowT, WonW);
					$(idDuration).val(newDuration);
					$(idDueDate).val(dateToStringNetsuite(new Date(nowT)));
				}
			}
		}
	
//---RuleToStatus<




//---changeidPickerStartDate>
			window.changeidPickerStartDate = function changeidPickerStartDate() {
				if (WF_DEBUG)
					console.log("changeidPickerStartDate()");
				
				loaderStart();
				
				var PrevStartDate = $(this)[0].defaultValue;
				
				if (WF_DEBUG)
					console.log("Start default value", PrevStartDate);
				
				var idparent 		 = $(this)[0].id;
				var vExtract 		 = idparent.split("_").pop();
				var StartDateCurrVal = StringNetsuiteDateToDate($(this).val());
				var today 			 = new Date().setHours(0, 0, 0, 0);
				var PrevStartDateMM  = new Date(PrevStartDate + " 00:00");
				var canDoIt 		 = UpdateStartByDependency(idparent);
				var KpiTaskType 	 = $('#idTask_Duration_'+vExtract).attr('data-tasktype');
				var isChecked 		 = $('input[id=WorkOnWeekends_' + vExtract + ']').is(':checked');
				
				if(WF_DEBUG) 
					console.info('TaskType', KpiTaskType);
				
				if(WF_DEBUG)
					console.info('PrevStartDateMM >',PrevStartDateMM ,'StartDateCurrVal',StartDateCurrVal );
				
				//Si la fecha selecciondada es menor a la anterior :
				if (PrevStartDateMM.getTime() > StartDateCurrVal.getTime()) {
					//if (new Date(CurrentStartDate).getTime() > new Date($(this).val()).getTime()) {
					// si retorna False , cancelara el proceso y pondra la fecha que estaba anteriormente
					if (!canDoIt) {
						// $(this).val(dateToStringNetsuite(new Date(PrevStartDateMM))); // Se restablece la fecha anterior
						// Se restablece la fecha anterior
						$(this).val(dateToStringNetsuite(PrevStartDateMM));
						// $(this).setDate(dateToStringNetsuite(new Date(PrevStartDateMM)), false);
						// Second param are not trigger event...
						return false;
						// Si la fecha seleccionada es menor a Hoy
						
					} else if (canDoIt && StartDateCurrVal.getTime() < today ) {

						if(KpiTaskType == 1 && WorkForce_Obj.rolePM && WorkForce_Obj.emb_kickoff) {
							
							UpdateDurationbyStart(idparent,isChecked);
							
							alert('Update Task kickoff in the past.');
							
						}else{
							window.datem = this;
							if(WF_DEBUG)
								console.log('datem', datem, 'PrevStartDateMM', PrevStartDateMM, PrevStartDate);
							// Se restablece la fecha anterior
							$(this).val( dateToStringNetsuite(new Date(PrevStartDate + ' 00:00')));
							
							loaderEnd();
							
							alert("Dates in the past are not permmited.");

							return false;
						}

					} else {
						
						UpdateDurationbyStart(idparent, isChecked);
						
					}
					// Si la fecha seleccionada es mayor a la fecha inicial
				} else {
					
					UpdateDuration(idparent, isChecked);
					
				}

				changeDico(vExtract); // si hay cambios se habilita el boton de guardado
				
				return false;
			}
//---changeidPickerStartDate<




//---changeidPickerDueDate>
			window.changeidPickerDueDate = function changeidPickerDueDate() {
				//console.log("Due "+$(this)[0].defaultValue);
				var ExDate = $(this)[0].defaultValue + " 00:00";
				if (WF_DEBUG) 
					console.info("ExDate", ExDate);
				var idparent = $(this)[0].id;
				var vExtract = idparent.split("_").pop();
				var ud = UpdateDuration(idparent, WorkWeekend);
				if (WF_DEBUG)
					console.info("UpdateDuration", ud);
				if (ud == 0) {
					// alert("The Due-Date must not be less to Start-Date");
					alert("The due date cannot be less than the start date");
					$(this).val(dateToStringNetsuite(new Date(ExDate))); // DefaultValue ever is YYYY / mm / dd
					var isChecked = $('input[id=WorkOnWeekends_' + vExtract + ']').is(':checked');
					var dur = recomputeDuration(StringNetsuiteDateToDate($("#idPicker_StartDate_" + vExtract).val()).getTime(), new Date(ExDate).getTime(), isChecked);
					$("#idTask_Duration_" + vExtract).val(dur);
					WF_Error_on_Update = true;
					return false;
				}
				changeDico(vExtract);
				return false;
			}
//---changeidPickerDueDate<




//---changeWorkOnWeekends>
			window.changeWorkOnWeekends = function changeWorkOnWeekends() {
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
			window.changeAck = function changeAck() {
				var idCheck = $(this)[0].id;
				var vExtract = idCheck.split("_").pop();
				$(this).prop('disabled', true);
				clickdico(vExtract, true);
				return false;
			}
//---changeAck<




//---SetFilterToTasks>
			window.SetFilterToTasks = function SetFilterToTasks() {
					
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
	window.changeDuration = function changeDuration() {
		if(WF_DEBUG) console.info('changeDuration',this)
		/**
		 * This does not send data only show new date if so.
		 */
		var field = $(this)[0].id;
		var vExtract = field.split("_").pop()
		var PreviousValue = $(this)[0].defaultValue
		var NewValue = $(this).val()
		if(WF_DEBUG) console.info('changeDuration',{'vExtract':vExtract,'PreviousValue':PreviousValue,'NewValue':NewValue})
		// Validate if new values is diferent to previous
		if (PreviousValue != NewValue) {
			// Validate if NewValue is Positive and less than 99
			if (NewValue > 0 && NewValue < 100) {
				// Update...
				UpdatewithDurationbyDependency(field)
			} else {
				// Return previous value
				$(this).val(PreviousValue)
			}
		}
	}
//---changeDuration<




//---blurDuration>
	window.blurDuration = function blurDuration() {
		if(WF_DEBUG) console.info('blurDuration',this)
		var field = $(this)[0].id;
		var vExtract = field.split("_").pop()
		var PreviousValue = $(this)[0].defaultValue
		var NewValue = $(this).val()
		if(WF_DEBUG) console.info('blurDuration',{'vExtract':vExtract,'PreviousValue':PreviousValue,'NewValue':NewValue})
		// Validate if new values is diferent to previous
		if (PreviousValue != NewValue) {
			// Validate if NewValue is Positive and less than 99
			if (NewValue > 0 && NewValue < 100) {
				// Update...
				UpdateEndByDuration(field)
				// Send data...
				changeDico(vExtract)
			} else {
				// Return previous value
				$(this).val(PreviousValue)
			}
		}
	}
//---blurDuration<

//---clickimageContainer>
			window.clickimageContainer = function clickimageContainer() {
					$('#play').trigger('click');
				}
//---clickimageContainer<

//---ChangeStatus>
			window.ChangeStatus = function ChangeStatus() {
					var CurrentStatus = $(this);
					//console.log(CurrentStatus);
				}
//---ChangeStatus<



//---clickdico>
			window.clickdico = function clickdico(vExtract, isACK) {
					//if (WF_DEBUG)
						console.info("clickdico(vExtract, isACK)", vExtract, isACK);
					
					loaderStart();
					
					var SalesOrderId = $("#idTask_Duration_" + vExtract).attr("data-salesorder");
					var taskId = $("#vtaskID" + vExtract).html();
					var taskCurrData = getTaskCurrentData(taskId)[0];
					var Agree = false;
					var sendSuccessorMails = false;
					
					window.taskCurrData = taskCurrData;
					
					//-- Validate is task on DB is not Active @TODO...
//					if (WorkForce_Obj.userID != taskCurrData.assigned){
//						messager('Change Assigned detected','The task was re-assigned to :<b>'+taskCurrData.assigned_n+'</b><br/>need reload your Workforce.');
//						return false;
//					}
					
					if(WF_DEBUG)
						console.info('taskCurrData',taskCurrData);
					
					if (! isACK ) {
						console.info('! isACK')
						
						var validateStartDate = StringNetsuiteDateToDate( $("#idPicker_StartDate_" + vExtract).val() );
						
						if(!validateStartDate){
							mirrorLog('clickdico','Validate Dates', validateStartDate ); 
							alert('Invalid Date to Start Date, please Select Valid date');
							WF_Error_on_Update = true;
							return false;
						} else {
							if(WF_DEBUG)
								console.info('Correct date in Start Date', new Date(validateStartDate));
						}
	
						$(".myUpdatedTasks").fadeIn(4000);
						
						var TotalRows = false;
						var myworktaskBoolean = $('#idTask_Duration_' + vExtract).attr('data-task');
						
						if (WF_DEBUG)
							console.info('Tasksboolean', myworktaskBoolean);
						
						//	var vExtract = idUpdate.split("co").pop();
						var post_taskstatus = $("#selTaskStatus" + vExtract).val();
						var check_Duration = $("#idTask_Duration_" + vExtract).val();
						
						function isInteger(x) {
							return x % 1 === 0;
						}
	
						if (!isInteger(check_Duration) || check_Duration < 1) {
							if(WF_DEBUG)
								console.info('check_Duration',check_Duration);
							alert('The provided duration is not valid, must be positive number.');
							loaderEnd();
							WF_Error_on_Update = true;
							return false;
						}
	
						if (post_taskstatus == 'cancelled' || post_taskstatus == '4') {
							
							Agree = true;
							
						} else
							Agree = UpdateStartByDependency(vExtract, true);
	
						if (WF_DEBUG)
							console.info("AfterAgree", Agree);
						
						if (Agree) {
							
						} else {
							
							if (WF_DEBUG)
								console.info("myworktaskBoolean", myworktaskBoolean);
	
							if (myworktaskBoolean == 'true') {
								var whichStatusFilters=$('#multipleSelectStatus').val();
								getAllMyWork(0, String( whichStatusFilters ), true);
								if (WF_DEBUG)
									console.log("when is Updated ", whichStatusFilters);
							} else {
								clickinSO(SalesOrderId, true); // MERGE
							}
							//2017-April-20 06:36PM
							WF_Error_on_Update = true;
							
							return false;
						}
	
						if (WF_DEBUG)
							console.info("AssignedExctrac", vExtract);
						
						var post_taskid = $("#vtaskID" + vExtract).html();
						var post_id = $("#selectAsignee" + vExtract).val();
						var post_ack = $("#Ack_" + vExtract).is(':checked');
						var stringDate = String($("#idPicker_StartDate_" + vExtract).val());
						var post_startDate = StringNetsuiteDateToDate($("#idPicker_StartDate_" + vExtract).val());
						var post_dueDate = StringNetsuiteDateToDate($("#idPicker_DueDate_" + vExtract).val());
						var post_WorkOnWeekends = $("#WorkOnWeekends_" + vExtract).is(':checked');
						var post_Duration = $("#idTask_Duration_" + vExtract).val();
						var wrikeid = $("#idTask_Duration_" + vExtract).attr("data-wrikeid");
						
						post_startDate = post_startDate.getTime();
						post_dueDate = post_dueDate.getTime();
						
						//---------------------------------------------------------------------------------
						// 2017-May-25 06:17PM
						// Validation in general, DUE date cannot be less than due date, in all cases.
						if (post_dueDate < (new Date()).setHours(0,0,0,0) ) {
							alert('Due date cannot be less than today.');
							loaderEnd();
							WF_Error_on_Update = true;
							return false;
						}
						//---------------------------------------------------------------------------------
						
						datos = {
							'action': "task.change",
							'salesorder': SalesOrderId,
							"assigned": post_id,
							"ack": post_ack,
							"status": post_taskstatus,
							"id": post_taskid,
							"duration": post_Duration,
							"weekend": post_WorkOnWeekends,
							"startdate": post_startDate,
							"D_startdate": new Date(post_startDate),
							"duedate": post_dueDate,
							"D_duedate": new Date(post_dueDate),
							"wrikeid": wrikeid,
							"workspace": true
						};
						
						//--- Enable Send Mails to Successors
						sendSuccessorMails = (post_taskstatus == 'completed' || post_taskstatus == '2');
						//--- 
						//... sendSuccessorMails = true;
						
					} else {
						// if isACK	
						console.info('isACK')
						
						if (WorkForce_Obj.userID != taskCurrData.assigned){
							messager('Change Assigned detected','The task was re-assigned to :<b>'+taskCurrData.assigned_n+'</b><br/>need reload your Workforce.');
							return false;
						}
						
						datos = {
							'action': "task.change",
							'salesorder': SalesOrderId,
							"assigned": taskCurrData.assigned,
							"ack": true,
							"status": taskCurrData.status,
							"id": taskCurrData.internalid,
							"duration": taskCurrData.duration,
							"weekend": taskCurrData.wonw,
							"startdate": StringNetsuiteDateToDate(taskCurrData.startdate).getTime(),
							"D_startdate": new Date( StringNetsuiteDateToDate(taskCurrData.startdate).getTime() ),
							"duedate": StringNetsuiteDateToDate(taskCurrData.duedate).getTime(),
							"D_duedate": new Date( StringNetsuiteDateToDate(taskCurrData.duedate).getTime() ),
							"wrikeid": taskCurrData.wrikeid,
							"workspace": true
						};
						
						Agree = true
						
					}
					
					if (Agree) {

						if (WORKFORCE_MODE == WF_MODE_TESTING) {
							messager('WARNING','WorkForce Management is in TESTING mode.<br>No updates was sended...')
							//if(WF_DEBUG)
							console.info('WORKFORCE_MODE is TESTING', datos);
							mirrorLog('TESTING clickdico','Send Data .Common', datos );
							loaderEnd();
							
							// After acept, continue with next steps...
							if (myworktaskBoolean == 'true') {
								var whichStatusFilters=$('#multipleSelectStatus').val();
								getAllMyWork(0, String(whichStatusFilters), true);
							} else {
								// clickinSO(SalesOrderId, true);
								// SetTableTasksByFilters()
								$("#filterButtonG").trigger('click');
							}
							
							return false; // Dont Save changes...
						}
						
						if (myworktaskBoolean == 'true') {
							visual_process_log('start','Start...','Applying changes...',function(){
								var whichStatusFilters=$('#multipleSelectStatus').val();
								getAllMyWork(0, String(whichStatusFilters), true)
								//console.info('sendSuccessorMails',sendSuccessorMails)
								if(sendSuccessorMails)
									sendSuccessorMailsCompletedTask()
							})
						} else {
							visual_process_log('start','Start...','Applying changes...',function(){
								// clickinSO(SalesOrderId, true);
								// SetTableTasksByFilters()
								$("#filterButtonG").trigger('click');
								// Sync myWork at the same time... 2017-May-27 10:09PM...
								getAllMyWork(0, String(whichStatusFilters), true)
								//console.info('sendSuccessorMails',sendSuccessorMails)
								if(sendSuccessorMails)
									sendSuccessorMailsCompletedTask()
							})
						}
						
						datos["msg_in"] = 'Processing changes on task ';
						datos["msg_out"] = 'End processing changes on task ';
						
						var processSecundResults = true;
						
						process_task_change( datos, processSecundResults, true );
					
					}

				}
//---clickdico<




//---clickinSO>
		window.clickinSO = function clickinSO(id, Reload, fromtree) {
				if (WF_DEBUG)
					console.info("clickinSO(id, Reload, fromtree)", [id, Reload,fromtree] );
				
				loaderStart();
				
				// hide communication tab
				$('#task-communication').hide();
				
				getSaleOrderData(id);
				
				$('#whynotTab').hide(); // Clear Dependency Chain
				$('#whynextTab').hide(''); // Clear Dependency Chain
				
				jQScrollTo('NameSalesOrderBySpan');
				//$('#whynotTab').show();
				
				$('.preimageTasks').show();
				$("#contTasks").hide();
				$("#filtered_message").html(''); // Clear Filter Message.
				
				//get all departments list in the sales order
				var constructorSelect4Department = '<label><select id="filterDepartment_' + id +
					'" name="filterDepartment" class="filterDepartment" style="height:32px">'+
					'<option value="notuser0">- Filter by Deparment -</option>'+
					'<option value="notuser">All Departments</option>';
				constructorSelect4Department += getDepartmentOfProject(id);
				constructorSelect4Department += '</select></label>';
				
				$('.div-selectdepartment').html(constructorSelect4Department);
				
				//get all employees list in the sales order
				var constructorSelect4Employees = '<label><select id="filterAsignee_' + id +
					'" name="filterAsignee" class="filterAsignee" style="height:32px">'+
					'<option value="notuser0">- Filter by Assigned -</option>'+
					'<option value="notuser">All tasks</option>'+
					'<option value="onlymytasks">Only my tasks</option>'+
					'<option value="AllMyTeam">All My Team</option>';
				constructorSelect4Employees += findEmployeesOfProject(id);
				constructorSelect4Employees += '</select></label>';
				
				$('.div-selectassigned').html(constructorSelect4Employees);

				// ---- 

				if (!Reload) {
					$('#ButtonLoadMoreTasks').attr("data-slice", -1);
					$('span#msgSalesOrdersClick').fadeOut(9000); // Clears the Sales Order Message text
					showHideTab(true);
					ChangeTableAllServices(id);
					ChangeTableServiceAddresses(id);
					flatpickr('.toDatePickerFilter', {
						dateFormat: CalendarInputFormat
					}); // initialized picker
					//	NumberOfServiceAddresses(id);
					ChangeTableTasks(id, WorkForce_Obj.rolePM, true);
					$("#contTasks").hide();
					$('.preimageTasks').show();

				} else {
					if(arrayFilters.length)
						ChangeTableTasksParams(arrayFilters, WorkForce_Obj.rolePM);
					else
						ChangeTableTasks(id, WorkForce_Obj.rolePM, true);
				}
				
				// Dickenson....
				
				GetTaskTree(id);

				// Set link to gant....
				$('a#tabtogant3').attr('href', "/core/media/media.nl?id=6363364&c=3461650&h=d436a287ff7d831452fd&_xt=.html&so=" + id);
				
				//Set current Tab
				//$('#tabtogant1a').trigger('click');
				jQuery('.tabtogant-links a[href="#tabtogant1"]').trigger('click') // Select tab by name .. SI FUNCIONA
				
				jQScrollTo('NameSalesOrderBySpan');
				
				loaderEnd();
			}
//---clickinSO<

//---validateShowGroupAssignee>
		function validateShowGroupAssignee() {
			// Check is some row task selector are checked if so show GroupAssignee
			// if dont hide.
			var showit = false;
			$('input.mywork-reasigne').each(function(){
				showit = showit || $(this).is(":checked");
			});
			if (showit) {
			    $('#select-assignee-group').fadeIn();
			} else {
				$('#mywork_group_assigne').val('0'); // Clear Assignne Group ID
			    $('#mywork_group_assigne_name').val(''); // Clear Assignne Group Name
			    $('#select-assignee-group').fadeOut();
			}
		}
//---validateShowGroupAssignee<

//---validateShowGroupAssigneeInSO>
		function validateShowGroupAssigneeInSO() {
			// Check is some row task selector are checked if so show GroupAssignee
			// if dont hide.
			var showit = false;
			$('input.tbltasks-reasigne').each(function(){
				showit = showit || $(this).is(":checked");
			});
			if (showit) {
			    $('#tbltasks_select-assignee-group').fadeIn();
			} else {
				$('#tbltasks_group_assigne').val('0'); // Clear Assignne Group ID
			    $('#tbltasks_group_assigne_name').val(''); // Clear Assignne Group Name
			    $('#tbltasks_select-assignee-group').fadeOut();
			}
		}
//---validateShowGroupAssigneeInSO<

//---applyAssigneeByGroup>
			function applyAssigneeByGroup(){
				// Check is some row task selector are checked if so 
				// submit changes...
				
				var newAssignee = $('#mywork_group_assigne').val();
				
				newAssignee = parseInt(newAssignee);
				
				if (!newAssignee || newAssignee < 1) {
					alert('Assigne is not valid.!! '+newAssignee)
					return;
				}
				
				var doit = false;
				var collectChanges =[];
				var toName = $('#mywork_group_assigne_name').val();
				
				$('input.mywork-reasigne').each(function(){
					if ( $(this).is(":checked") ) 	{
						doit = doit || $(this).is(":checked");
						var tr = $(this).parent().parent()[0];
						var vExtract = tr.id;
						var post_taskstatus = $("#selTaskStatus" + vExtract).val();
						var check_Duration = $("#idTask_Duration_" + vExtract).val();
						var SalesOrderId = $("#idTask_Duration_" + vExtract).attr("data-salesorder");
						var post_taskid = $("#vtaskID" + vExtract).html();
						var post_id = $("#selectAsignee" + vExtract).val();
						var post_prev_assigne_name = $("#selectAsignee" + vExtract).next('input.employeeSelectFly').val();
						var post_ack = $("#Ack_" + vExtract).is(':checked');
						var stringDate = String($("#idPicker_StartDate_" + vExtract).val());
						var post_startDateD = StringNetsuiteDateToDate( $("#idPicker_StartDate_" + vExtract).val() );
						var post_dueDateD = StringNetsuiteDateToDate( $("#idPicker_DueDate_" + vExtract).val() );
						var post_WorkOnWeekends = $("#WorkOnWeekends_" + vExtract).is(':checked');
						var post_Duration = $("#idTask_Duration_" + vExtract).val();
						var wrikeid = $("#idTask_Duration_" + vExtract).attr("data-wrikeid");
						
						// console.info('post_startDate',post_startDate,'post_dueDate',post_dueDate);
						
						var post_startDate = post_startDateD.getTime();
						var post_dueDate = post_dueDateD.getTime();
						
						datos = {
							'action': "task.change",
							'salesorder': SalesOrderId,
							"assigned": newAssignee, // This was onle the change...
							"ack": post_ack,
							"status": post_taskstatus,
							"id": post_taskid,
							"duration": post_Duration,
							"weekend": post_WorkOnWeekends,
							"startdate": post_startDate,
							"D_startdate": new Date(post_startDate),
							"duedate": post_dueDate,
							"D_duedate": new Date(post_dueDate),
							"wrikeid": wrikeid,
							"workspace": true,
							"msg_in" : 'Reassign '+post_prev_assigne_name+' to '+toName+' on task ',
							"msg_out" : 'Changed '+toName+' on task ',
						};
						collectChanges.push(datos);
					}
				});
				
				if (doit) {
					
					visual_process_log('start','Start...','Applying changes...',function(){
						var whichStatusFilters=$('#multipleSelectStatus').val();
						getAllMyWork(0, String(whichStatusFilters), true);
					});
					
				 	var processSecundResults = true; // Enable process results on change the task.
				 	var errorsOnChanges = 0;
				 	collectChanges.forEach(function(dtx){
				 		loaderStart();
				 		setTimeout( function() { 
				 			if (! process_task_change( dtx, processSecundResults, true )){
				 			errorsOnChanges++;}
				 		},32)
				 	})
				 	
				} else {
					alert('No changes was made.');
				}
				
				$('#mywork_group_assigne').val('0'); // Clear Assignne Group ID
			    $('#mywork_group_assigne_name').val(''); // Clear Assignne Group Name
			    $('#select-assignee-group').fadeOut();
			}
			
//------------------------------
			
			function applyAssigneeByGroupOLD(){	
				// Check is some row task selector are checked if so 
				// submit changes...
				
				var newAssignee = $('#mywork_group_assigne').val();
				
				newAssignee = parseInt(newAssignee);
				
				if (!newAssignee || newAssignee < 1) {
					alert('Assigne is not valid.!! '+newAssignee)
					return;
				}
				
				var showit = false;
				var collectChanges =[];
				
				$('input.mywork-reasigne').each(function(){
					if ( $(this).is(":checked") ) {
						showit = showit || $(this).is(":checked");
						var tr = $(this).parent().parent()[0];
						var vExtract = tr.id;
						var post_taskstatus = $("#selTaskStatus" + vExtract).val();
						var check_Duration = $("#idTask_Duration_" + vExtract).val();
						var SalesOrderId = $("#idTask_Duration_" + vExtract).attr("data-salesorder");
						var post_taskid = $("#vtaskID" + vExtract).html();
						var post_id = $("#selectAsignee" + vExtract).val();
						var post_ack = $("#Ack_" + vExtract).is(':checked');
						var stringDate = String($("#idPicker_StartDate_" + vExtract).val());
						var post_startDate = StringNetsuiteDateToDate($("#idPicker_StartDate_" + vExtract).val()).getTime();
						var post_dueDate = StringNetsuiteDateToDate($("#idPicker_DueDate_" + vExtract).val()).getTime();
						var post_WorkOnWeekends = $("#WorkOnWeekends_" + vExtract).is(':checked');
						var post_Duration = $("#idTask_Duration_" + vExtract).val();
						var wrikeid = $("#idTask_Duration_" + vExtract).attr("data-wrikeid");
						
						datos = {
							'action': "task.change",
							'salesorder': SalesOrderId,
							"assigned": newAssignee, // This was onle the change...
							"ack": post_ack,
							"status": post_taskstatus,
							"id": post_taskid,
							"duration": post_Duration,
							"weekend": post_WorkOnWeekends,
							"startdate": post_startDate,
							"D_startdate": new Date(post_startDate),
							"duedate": post_dueDate,
							"D_duedate": new Date(post_dueDate),
							"wrikeid": wrikeid,
							"workspace": true
						};
						
						collectChanges.push(datos);
					}
				});
				
				if (showit) {
				 	loaderStart();
				 	var processSecundResults = false; // Enable process results on change the task.
				 	var errorsOnChanges = 0;
				 	collectChanges.forEach(function(dtx){
				 		if (! process_task_change( dtx, processSecundResults )){
				 			errorsOnChanges++;
				 		}
				 	});
				 	console.table(collectChanges);
// 				 	if(errorsOnChanges > 0) 
// 				 		alert('Some changes not applied, review again your tasks...!!');
				 	// Need Reload MyWork
				 	var whichStatusFilters=$('#multipleSelectStatus').val();
					getAllMyWork(0, String(whichStatusFilters), true);
					
					return;
					
				} else {
					alert('No changes was made.');
				}
				
				$('#mywork_group_assigne').val('0'); // Clear Assignne Group ID
			    $('#mywork_group_assigne_name').val(''); // Clear Assignne Group Name
			    $('#select-assignee-group').fadeOut();
			}
//---applyAssigneeByGroup<
			
			
			
			
			
			
			
			
			
			
			
			
			
			
//			var LeirAGS_Process = { obj_pro_log: 0, obj_pro_row: 0 };
//			var obj_pro_log = 0, obj_pro_row = 0;
//			var LeirAGS_Monitoring = null;
//			var LeirAGS_Monitoring_cb = null;
			
			function visual_process_log(action,message,title,callback){
				var inst = new Date();
				inst = new Date().toLocaleString();
				switch (action) {
				case 'start':
					obj_pro_row = 0;
					obj_pro_log = 0;
					obj_pro_wait= 0;
					title = ''+title+'<span id="objProFlag" style="font-size:8px; color:#333; float:right;">'+inst+'</span>';
					message = '<div data-rowid="'+obj_pro_row+'" style="border-bottom:1px dotted #EEE"><em>'+message+'</em><span class="logtime" style="font-size:10px; color:#666; float:right;">'+inst+'</span></div><br>';
					messager(title,message);
					pausecomp(100)
					$('#confirmBox').css('width','480px');
					var d = $('#confirmBox div.msg');
					d.css('height','280px').css('overflow','auto').css('font-size','12px').css('background-color','#FFF')
					$('div#confirmButtons a').hide();
					if (typeof callback == 'function') 
						LeirAGS_Monitoring_cb = callback
					else
						LeirAGS_Monitoring_cb = null;
					
					LeirAGS_Monitoring = setInterval(function(){
						obj_pro_wait++;
						if (obj_pro_log < 1 && obj_pro_row > 1){
							clearInterval(LeirAGS_Monitoring)
							LeirAGS_Monitoring = null;
							visual_process_log('close')
						} else {
							if (obj_pro_wait > obj_pro_wait_limit) {
								//--- alert('Process is wor...')
								var inst = new Date();
								inst = new Date().toLocaleString();
								message = '<div data-rowid="w'+obj_pro_row+'" style="border-bottom:1px dotted #EEE">+ <em>Processing, please wait...</em><span class="logtime" style="font-size:10px; color:#666; float:right;">'+inst+'</span></div><br>';
								d.append(message);
								d.scrollTop(d.prop("scrollHeight"));
								pausecomp(37)
								obj_pro_wait = 1;
							}
						}
					}, 200);
					pausecomp(400)
					$('div#confirmButtons a').hide();
					pausecomp(400)
					break
				case 'add-only':
					obj_pro_log++
					break
				case 'minus-only':
					obj_pro_log--
					break
				case 'add':		
					var d = $('#confirmBox div.msg');
					obj_pro_log++;
					obj_pro_row++;
					message = '<div data-rowid="'+obj_pro_row+'" style="border-bottom:1px dotted #EEE">+ <em>'+message+'</em><span class="logtime" style="font-size:10px; color:#666; float:right;">'+inst+'</span></div><br>';
					d.append(message);
					d.scrollTop(d.prop("scrollHeight"));
					pausecomp(100)
					break
				case 'minus':
					var d = $('#confirmBox div.msg');
					obj_pro_log--;
					obj_pro_row++;
					message = '<div data-rowid="'+obj_pro_row+'" style="border-bottom:1px dotted #EEE">- <em>'+message+'</em><span class="logtime" style="font-size:10px; color:#666; float:right;">'+inst+'</span></div><br>';
					d.append(message);
					d.scrollTop(d.prop("scrollHeight"));
					pausecomp(100)
					break
				case 'close':
					if(typeof LeirAGS_Monitoring_cb == 'function') {
						console.info('calling callback function.')
						LeirAGS_Monitoring_cb();
					}
					LeirAGS_Monitoring_cb=null;
					var d = $('#confirmBox div.msg');
					$('div#confirmButtons a').trigger('click');
					obj_pro_log = 0;
					break
				default:
					break
				}
			}

//---applyAssigneeByGroupInSO>
			function applyAssigneeByGroupInSO(){
				// Check is some row task selector are checked if so 
				// submit changes...
				
				var newAssignee = $('#tbltasks_group_assigne').val();
				
				newAssignee = parseInt(newAssignee);
				
				if (!newAssignee || newAssignee < 1) {
					alert('Assigne is not valid.!! '+newAssignee)
					return;
				}
				
				var doit = false;
				var collectChanges =[];
				var toName = $('#tbltasks_group_assigne_name').val();
				
				$('input.tbltasks-reasigne').each(function(){
					if ( $(this).is(":checked") ) {
						doit = doit || $(this).is(":checked");
						var tr = $(this).parent().parent()[0];
						var vExtract = $(tr).data('rown');
						var post_taskstatus = $("#selTaskStatus" + vExtract).val();
						var check_Duration = $("#idTask_Duration_" + vExtract).val();
						var SalesOrderId = $("#idTask_Duration_" + vExtract).attr("data-salesorder");
						var post_taskid = $("#vtaskID" + vExtract).html();
						var post_id = $("#selectAsignee" + vExtract).val();
						var post_prev_assigne_name = $("#selectAsignee" + vExtract).next('input.employeeSelectFly').val();
						var post_ack = $("#Ack_" + vExtract).is(':checked');
						var stringDate = String($("#idPicker_StartDate_" + vExtract).val());
						var post_startDate = StringNetsuiteDateToDate($("#idPicker_StartDate_" + vExtract).val()).getTime();
						var post_dueDate = StringNetsuiteDateToDate($("#idPicker_DueDate_" + vExtract).val()).getTime();
						var post_WorkOnWeekends = $("#WorkOnWeekends_" + vExtract).is(':checked');
						var post_Duration = $("#idTask_Duration_" + vExtract).val();
						var wrikeid = $("#idTask_Duration_" + vExtract).attr("data-wrikeid");
						
						datos = {
							'action': "task.change",
							'salesorder': SalesOrderId,
							"assigned": newAssignee, // This was onle the change...
							"ack": post_ack,
							"status": post_taskstatus,
							"id": post_taskid,
							"duration": post_Duration,
							"weekend": post_WorkOnWeekends,
							"startdate": post_startDate,
							"D_startdate": new Date(post_startDate),
							"duedate": post_dueDate,
							"D_duedate": new Date(post_dueDate),
							"wrikeid": wrikeid,
							"workspace": true,
							"msg_in" : 'Reassign '+post_prev_assigne_name+' to '+toName+' on task ',
							"msg_out" : 'Changed '+toName+' on task ',
						};	
						collectChanges.push(datos);
					}
				});
				
				if (doit) {
					
					visual_process_log('start','Start...','Applying changes...',function(){
						$('#refreshCurrSO').trigger('click');
						var whichStatusFilters=$('#multipleSelectStatus').val();
						getAllMyWork(0, String(whichStatusFilters), true);
					});
					
				 	var processSecundResults = true; // Enable process results on change the task.
				 	var errorsOnChanges = 0;
				 	collectChanges.forEach(function(dtx){
				 		loaderStart();
				 		setTimeout( function() { 
				 			if (! process_task_change( dtx, processSecundResults, true )){
				 			errorsOnChanges++;}
				 		},32)
				 	})
				} else {
					alert('No changes was made.');
				}
				$('#tbltasks_group_assigne').val('0'); // Clear Assignne Group ID
			    $('#tbltasks_group_assigne_name').val(''); // Clear Assignne Group Name
			    $('#tbltasks_select-assignee-group').fadeOut();
			}
//---applyAssigneeByGroupInSO>

			
			
//---process_task_change>
			function process_task_change( datos, processResults, dsplay ){
				
				if (WORKFORCE_MODE == WF_MODE_TESTING) {
					//if(WF_DEBUG)
					console.info('WORKFORCE_MODE is TESTING', datos);
					mirrorLog('TESTING clickdico','Send Data .Common', datos ); 
					return false; // Dont Save changes...
				}
				
				mirrorLog('process_task_change','Send Data .Common', datos ); 

				if (WF_DEBUG_AJAX)
					console.info('process_task_change',"task.change .Common", datos );
				
				var error_ocurr = false;
				var post_taskid = datos.id;
				
				visual_process_log('add', datos.msg_in + datos.id );
				
				$.ajax({
					url: getUrl().Common,
					type: 'POST',
					//-async: false,
					data: datos,
					success: function(data) {
						visual_process_log('minus',datos.msg_out+datos.id);
						var need_refresh = false;
						var elParsed = CleanResponseData(data);
						var size = Object.keys(elParsed).length;
						var WhichTasksWillChange = [];
						var Task_Updated_Secund_Pass = [];
						
						// console.table(elParsed);
						if (processResults) {
							
							for (var key in elParsed) {
								// Protect against inherited properties.
								if (elParsed.hasOwnProperty(key)) {
									if (elParsed[key].updated) {
										// Dijo IVAN, que si venia la misma tarea en esta parte 
										// se ignore este cambio y continue con los demas.
										if (datos.id != elParsed[key].id) {
											Task_Updated_Secund_Pass.push( elParsed[key] );
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
												console.info("process_task_change ToUpdate", otherData);
											if (WF_DEBUG_AJAX)
												console.info('process_task_change',"update .Common-2", otherData );
											mirrorLog('process_task_change','Update Data .Common-2', otherData ); 
											need_refresh = true;
											visual_process_log('add','+ Start re-processing changes on task '+otherData.id);
											$.ajax({
												url: getUrl().Common,
												type: 'POST',
												//async: false,
												data: otherData,
												before: function(){ },
												success: function(data) {
													visual_process_log('minus','- End re-processing changes on task '+otherData.id);
													if (WF_DEBUG_AJAX_DATA)
														console.log("process_task_change Returned Data step 2 :" + data);
												},
												error: function(err){
													console.log('Error on process_task_change update step 2',err);
												}
											});
										}
									}
								}
							}
							
							//console.table(elParsed);
							
//							if(Task_Updated_Secund_Pass.length){
//								console.info('List delegated task updated.');
//								console.table(Task_Updated_Secund_Pass);
//							}
//							else
//								console.info('No delegated task need be update.');
							
						} // if process_task_change
					},// success
					error: function(err) {
						error_ocurr = true;
						console.log('Error on NetSuite Call process_task_change',err);
						return false;
					} // error
				});
				
				return error_ocurr;
			}
//---process_task_change<			
	
	WF_Notifications_Service('ON')
	
//---RESTCODE>
			window.setTimeout(function() {
				
				jQScrollTo('contenting');
				
				$('#select-assignee-group').fadeOut(); // Hide Group Selector in MyWork
				$('#tbltasks_select-assignee-group').fadeOut(); // Hide Group Selector in SO
				
				// Module not in production env 
				//jQuery.leirags_resizable( 'Task', 'treeTasksr', 'width' );
				
				//$('#tabsalesord4').click();

				$('body').on('change', '.toggle-vis', function(e) {
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
				
				createTableEmployees();
				
//---Group-Assigne-mywork>
				$('body').on('change','#mywork_switch', function(e) {
					//ss = [];
					$('input.mywork-reasigne').each(function(){
						var s={};
						var tr = $(this).parent().parent()[0];
						s['TR-id'] = tr.id;
						s['TD-checked'] = ($(this).is(":checked"))?' is Checked':' Not Checked'
						$(this).prop("checked", !$(this).is(":checked"));
						//ss.push(s);
					});
					//-- console.table(ss);
					validateShowGroupAssignee();
				});
				
				//----
				$('body').on('change','.mywork-reasigne', function(e) {
					validateShowGroupAssignee();
				});
				
				//---- 
				$('#applyAssigneeByGroup').on('click', function(e) {
					applyAssigneeByGroup();
				});
//---Group-Assigne-mywork<


//---Debug-Footer-Options>
				//---- 
				$('#wf_gui_debug').on('click', function(e) {
					WF_DEBUG = ! WF_DEBUG;
				});
				//----
				$('#wf_gui_debug_ajax').on('click', function(e) {
					WF_DEBUG_AJAX = ! WF_DEBUG_AJAX;
				});
				//----
				$('#wf_gui_debug_ajax_data').on('click', function(e) {
					WF_DEBUG_AJAX_DATA = ! WF_DEBUG_AJAX_DATA;
				});
				//----
				$('#wf_gui_debug_testing').on('click', function(e) {
					WORKFORCE_MODE = ! WORKFORCE_MODE;
				});
				//----
				$('#wf_gui_debug_a').on('click', function(e) {
					getTreeContentPlainTxt();
				});
				//----
				$('#wf_gui_debug_b').on('click', function(e) {
					showBranchDependency(0, Branch_review);
				});
				$('#wf_gui_debug_c').on('click', function(e) {
					$('#workforce_top_head').fadeIn();
				});
				
				
				//----
//---Debug-Footer-Options<


//---Group-Assigne-tbltasks>
				$('body').on('change','#tbltasks_switch', function(e) {
					//ss = [];
					$('input.tbltasks-reasigne').each(function(){
						var s={};
						var tr = $(this).parent().parent()[0];
						s['TR-id'] = tr.id;
						s['TD-checked'] = ($(this).is(":checked"))?' is Checked':' Not Checked'
						$(this).prop("checked", !$(this).is(":checked"));
						//ss.push(s);
					});
					//console.table(ss);
					validateShowGroupAssigneeInSO();
				});
				
				//----
				$('body').on('change','.tbltasks-reasigne', function(e) {
					validateShowGroupAssigneeInSO();
				});
				
				//---- 
				$('#applyAssigneeByGroupInSO').on('click', function(e) {
					applyAssigneeByGroupInSO();
				});
//---Group-Assigne-tbltasks<

				
				
				// $('a.toggle-vis').on( 'click', function (e) {
				//        e.preventDefault();

				//        // Get the column API object
				//        var column = table.column( $(this).attr('data-column') );

				//        // Toggle the visibility
				//        column.visible( ! column.visible() );
				//    } );
				
		
				
				$('#refreshCurrSO').on('click', function(e) {
					if (WF_DEBUG)
						console.info('Click: refreshCurrSO');
					
					// Read values form current SO.
					var idSO = $('#IdSalesOrderBySpan').text();
					var cmp = $('#TitleSalesOrderBySpan').text();
					var nameSO = $('#NameSalesOrderBySpan').text();
					
					if(idSO != '') {
						loaderStart();
						setTimeout(function(){
							clickinSO(idSO);
						},200); // dar tiempo a que la interfase cambie el tab...
					}
					
				});
				
				$('body').on('click', '.idClickToSalesOrder', function(e) {
					if (WF_DEBUG)
						console.info('Click: .idClickToSalesOrder');
					loaderStart();
					var idSO = $(this).attr('data-salesorderID');
					var cmp = $(this).attr('data-cmp');
					var nameSO = $(this).text()
					$('#tabtwo2').trigger('click'); // switch to tab 2.
					setTimeout(function(){
						displaySObySpan (idSO, nameSO, cmp);
						GetSalesOrdersbyID('salesorder', 'CurrentUser', 'OnPageLoad',true); // Obtener Mis Sales orders (CurrentUser);
						clickinSO(idSO);
					},400); // dar tiempo a que la interfase cambie el tab... 
				});
				
				$('body').on('click', '.TaskToSalesOrder', function(e) {
					if (WF_DEBUG)
						console.info('Click: .TaskToSalesOrder');
					loaderStart();
					var idSO = $(this).attr('data-salesorderID');
					var cmp = $(this).attr('data-cmp');
					var nameSO = $(this).attr('data-soname');
					$('#tabtwo2').trigger('click'); // switch to tab 2.
					setTimeout(function(){
						displaySObySpan (idSO, nameSO, cmp);
						GetSalesOrdersbyID('salesorder', 'CurrentUser', 'OnPageLoad',true); // Obtener Mis Sales orders (CurrentUser);
						clickinSO(idSO);	
					},400); // dar tiempo a que la interfase cambie el tab... 
				});
				
				$('body').on('click', '#ButtonLoadMoreAllWork', function(e) {
					if (WF_DEBUG)
						console.info('Click: ButtonLoadMoreAllWork');
					loaderStart();
					console.log("D Slice " + $(this).attr("data-slice"));
					var slice = $(this).attr("data-slice");
					setTimeout(function(){
						getAllMyWork(slice);
						slice = (parseInt(slice) + 50);
						$('#ButtonLoadMoreAllWork').attr("data-slice", slice);
					},200);
				});

				$('body').on('click', '#ButtonLoadMoreTasks', function(e) {
					if (WF_DEBUG)
						console.info('Click: ButtonLoadMoreTasks');
					loaderStart();
					var lastFunction = $(this).attr("data-function");
					var So = $('[id^=filterAsignee_]').attr("id").split("filterAsignee_").pop();
					//--console.log(So);
					setTimeout(function(){
						if (lastFunction == 1) {
							ChangeTableTasks(So, WorkForce_Obj.rolePM);
						} else {
							SetTableTasksByFilters(true);
						}
					},200);
				});

				$('body').on('click', '#ButtonLoadMore_salesorder', function(e) {
					var wsof = $('#multipleSelectSalesOrders').val(); 
					if (WF_DEBUG)
						console.info('Click: ButtonLoadMore_salesorder','whichSOFilters',whichSOFilters,'wsof',wsof);
					loaderStart();
					setTimeout(function(){
						GetSalesOrdersbyID('salesorder', 'CurrentUser', wsof, false);
					},200);
				});

				$('body').on('click', '#ButtonLoadMore_Customsalesorder', function(e) {
					var idUser = $('#selMyTeam').val();
					var ststs = $('#multipleSelectStatus2').val();
					if (WF_DEBUG)
						console.info('Click: ButtonLoadMore_Customsalesorder',{'idUser':idUser, 'multipleSelectStatus2': ststs});
					loaderStart();
					setTimeout(function(){
						GetSalesOrdersbyID('Customsalesorder',idUser, String(ststs), false);
					},200);
				});

				$('body').on('click', '#ButtonLoadMore_allsalesorder', function(e) {
					var wsof2 = $('#multipleSelectSalesOrders2').val(); 
					if (WF_DEBUG)
						console.info('Click: ButtonLoadMore_allsalesorder whichSOFilters2:',whichSOFilters2,'wsof2',wsof2);
					loaderStart();
					setTimeout(function(){
						GetSalesOrdersbyID('allsalesorder', 'NotUser', wsof2, false);
					},200);
				});

				$('#filterButtonG').click(function(e) {
					if (WF_DEBUG)
						console.info('Click: filterButtonG','call: SetTableTasksByFilters()');
					e.preventDefault();
					loaderStart();
					//$("#filtered_message").html(''); // Clear Filter Message.
					setTimeout(function(){
						SetTableTasksByFilters();
					}, 200);
				});

				$('#filterButtonSO').click(function(e) {
					var wsof = $('#multipleSelectSalesOrders').val(); 
					if (WF_DEBUG)
						console.info('Click: filterButtonSO whichSOFilters:',whichSOFilters,'wsof',wsof);
					e.preventDefault();
					loaderStart();
					setTimeout(function(){
						GetSalesOrdersbyID('salesorder', 'CurrentUser', wsof, true);
					},200);
				});
				
				$('#filterTaskStatusEmployee').click(function(e) {
					var idUser = $('#selMyTeam').val();
					var ststs = $('#multipleSelectStatus2').val();
					if (WF_DEBUG)
						console.info('Click: filterTaskStatusEmployee', {'idUser':idUser, 'multipleSelectStatus2': ststs});
					e.preventDefault();
					loaderStart();
					setTimeout(function(){
						GetSalesOrdersbyID('Customsalesorder', idUser, String(ststs), true);
					},200);
				});

				$('#filterButtonALLSO2').click(function(e) {
					var wsof2 = $('#multipleSelectSalesOrders2').val(); 
					if (WF_DEBUG)
						console.info('Click: filterButtonALLSO2 whichSOFilters2:',whichSOFilters2,'wsof2',wsof2);
					e.preventDefault();
					loaderStart();
					setTimeout(function(){
						GetSalesOrdersbyID('allsalesorder', 'NotUser', wsof2, true);
					},200);
				});

				$('#filterTaskStatus').click(function(e) {
					var whichStatusFilters=$('#multipleSelectStatus').val();
					if (WF_DEBUG)
						console.info('Click: filterTaskStatus whichStatusFilters:',whichStatusFilters);
					e.preventDefault();
					loaderStart();
					setTimeout(function(){
						var whichStatusFilters=$('#multipleSelectStatus').val();
						getAllMyWork(0, String(whichStatusFilters), true);
					},200);
				});

				// Premium
				$('body').on('click', '#salesorder.table td', function(e) {
					var classNm = $(this)[0].className;
					if (WF_DEBUG)
						console.info( 'Click: salesorder.table classNm:', classNm );
					if (classNm == 'styleToId') return false;
					var rowz = $(this).closest("tr");

					if ($(rowz).is(':first') != true) {
						loaderStart();
						setTimeout(function(){
							GlobalEditing = true;
							//var td0 = $(rowz).find('td:eq(0)').text();
							var td1 = $(rowz).find('td:eq(1)').text();
							var id = $(rowz).attr('data-id');
							var soname = $(rowz).attr('data-soname');
							var td3 = $(rowz).find('td:eq(3)').text();
							//console.info('SO Name:',soname);
							//td0 = td0.replace(/\s+/g, '');
							displaySObySpan (id, soname, td1,  td3);
							openSOfromTab = 'salesorder';
							clickinSO(id);
							openSOfromTab = '';
						},200);
					}
				});

				$('body').on('click', '#Customsalesorder.table td', function(e) {
					var classNm = $(this)[0].className;
					if (WF_DEBUG)
						console.info( 'Click: Customsalesorder.table classNm:', classNm );
					if (classNm == 'styleToId') return false;
					var rowz = $(this).closest("tr");
					
					if ($(rowz).is(':first') != true) {
						loaderStart();
						setTimeout(function(){
							GlobalEditing = true;
							//var td0 = $(rowz).find('td:eq(0)').text();
							var td1 = $(rowz).find('td:eq(1)').text();
							var id = $(rowz).attr('data-id');
							var soname = $(rowz).attr('data-soname');
							var td3 = $(rowz).find('td:eq(3)').text();
							//console.info('SO Name:',soname);
							//td0 = td0.replace(/\s+/g, '');
							displaySObySpan (id, soname, td1, td3);
							openSOfromTab = 'Customsalesorder';
							clickinSO(id);
							openSOfromTab = '';
						},200);
					}
				});

				$('body').on('click', '#allsalesorder.table td', function(e) {
					var classNm = $(this)[0].className;
					if (WF_DEBUG)
						console.info( 'Click: allsalesorder.table classNm:', classNm );
					if (classNm == 'styleToId') return false;
					var rowz = $(this).closest("tr");

					if ($(rowz).is(':first') != true) {
						loaderStart();
						setTimeout(function(){
							window.rowz = rowz;
							GlobalEditing = true;
							//var td0 = $(rowz).find('td:eq(0)').text();
							var td1 = $(rowz).find('td:eq(1)').text();
							var id = $(rowz).attr('data-id');
							var soname = $(rowz).attr('data-soname');
							var td3 = $(rowz).find('td:eq(3)').text();
							//console.info('SO Name:',soname);
							//td0 = td0.replace(/\s+/g, '');
							displaySObySpan (id, soname, td1, td3);
							openSOfromTab = 'allsalesorder';
							clickinSO(id);
							openSOfromTab = '';
						},200);
					}
				 });


				$('body').on('click', '#tabone', function(e) {
					if (WF_DEBUG)
						console.info( 'Click: tabone');
					if (!($.fn.dataTable.isDataTable('#AllMyWork'))) {
						loaderStart();
						showHideTab(false);
						setTimeout(function(){
							getAllMyWork(0, 1);
						}, 200);
					}
				});

				$('body').on('click', '#tabtwo', function(e) {
					if (WF_DEBUG)
						console.info( 'Click: tabtwo');
					if (!($.fn.dataTable.isDataTable('#salesorder'))){
						loaderStart();
						setTimeout(function(){
							GetSalesOrdersbyID('salesorder', 'CurrentUser', 'OnPageLoad', true);
							if (GlobalEditing) 
								showHideTab(true);
						}, 200);
					}
				});
				
				$('body').on('click', '#tabfour', function(e) {
					if (WF_DEBUG)
						console.info( 'Click: tabfour');
					if (GlobalEditing) 
						showHideTab(true);
				});

				$('body').on('click', '#tabfive', function(e) {
					if (WF_DEBUG)
						console.info( 'Click: tabfive');
					if (!($.fn.dataTable.isDataTable('#allsalesorder'))) {
						loaderStart();
						setTimeout(function(){
							GetSalesOrdersbyID('allsalesorder', 'NotUser', String(whichSOFilters2), true);
						}, 200);
					}
				});

				$('body').on('click', '.tabso3', function(e) {
					return false; // DEROGATE
				});

				$('body').on('click', 'a.toOpenWrike', function(e) {
					if (WF_DEBUG)
						console.info( 'Click: a.toOpenWrike');
					e.preventDefault();
					var url = ""
					var wrikeid = $(this).attr('data-wrikeid');
					var Taskid = $(this).attr('data-taskid');
					openWrikeComment(wrikeid, Taskid);
					return false;
				});
				
				$('body').on('click', 'span.toOpenWrike', function(e) {
					if (WF_DEBUG)
						console.info( 'Click: span.toOpenWrike');
					e.preventDefault();
					var url = ""
					var wrikeid = $(this).attr('data-wrikeid');
					var Taskid = $(this).attr('data-taskid');
					openWrikeComment(wrikeid, Taskid);
					return false;
				});
				
				$('#selMyTeam').css('height', '32px'); // Work OK
				$('#selMyTeam').css('width', '250px'); // Work OK
				$('#multipleSelectSalesOrders').parent().css('width', '50%'); // Work OK
				$('#multipleSelectSalesOrders2').parent().css('width', '50%'); // Work OK
				$('#multipleSelectStatus').parent().css('width', '50%'); // Work OK
				$('#multipleSelectStatus2').parent().css('width', '30%'); // Work OK
				
				// function changeDico(vExt) {
				// 	$("#dico" + vExt).removeClass('GoUpdateDisabled');
				// 	$("#dico" + vExt).addClass('GoUpdateEnable');
				// }

				function UpdateStartByDuration(idInput) {
					var num = String(idInput).split('_').pop();
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

				function dhm(t) {
					var cd = 24 * 60 * 60 * 1000,
						ch = 60 * 60 * 1000,
						d = Math.floor(t / cd),
						h = Math.floor((t - d * cd) / ch),
						m = Math.round((t - d * cd - h * ch) / 60000);
					if (m === 60) { h++; m = 0; }
					if (h === 24) { d++; h = 0; }
					return d + 1;
				}

				function getSelectText(selId) {
					var sel = document.getElementById(selId);
					var i = sel.selectedIndex;
					var selected_text = sel.options[i].text;
					return selected_text;
				}

				function formatDate(date) {
					var d = new Date(date),
						month = '' + (d.getMonth() + 1),
						day = '' + d.getDate(),
						year = d.getFullYear();
					if (month.length < 2) month = '0' + month;
					if (day.length < 2) day = '0' + day;
					return [year, month, day].join('-');
				}

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
				
				// Metodo para Obtener los dias de duracion, 
				// dependiendo de la fecha de inicio, 
				// fecha de termino y si fin de semana (False, True)
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
				
				//Verificar Fecha de inicio, con WEEKEND, para determinar que dia recorrerla
				function computeStart(start, weekend, plus) {
					weekend = weekend || false;
					plus = plus || 12;
					return computeStartDate(start, weekend, plus).getTime();
				}
				
				// Metodo para Obtener la fecha de Termino apartir de la fecha de inicio, Duracion y Trabaja fin de semana (false, true)
				// function computeEndByDuration(start, duration, weekend, n) {
				// 	weekend = (typeof weekend === 'undefined') ? false : weekend;
				// 	var d = new Date(start);
				// 	//console.debug("computeEndByDuration start ",d,duration)
				// 	var q = duration - n;
				// 	while (q > 0) {
				// 		d.setDate(d.getDate() + 1);
				// 		if (!isHoliday(d, weekend)) q--;
				// 	}
				// 	d.setHours(23, 59, 59, 999);
				// 	return d.getTime();
				// }
				//var dates;

//---UpdateStartByDependency>
				window.UpdateStartByDependency = function(idInput, doSplit) {
					//First step : Get values from predecessor object
					if (WF_DEBUG)
						console.info("UpdateStartByDependency() IdInput ", idInput);

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
					var Start = StringNetsuiteDateToDate( $(idStartDate).val() );
					
					if(WF_DEBUG)
					 	console.info('dependency =', dependency);

					if (dependency == 'finishToStart') {
						if (WF_DEBUG)
							console.log("Start date ",Start);
						//	console.log("El predecesor no debe ser menor a la fecha seleccionada");
						//--- -Nota este trae pocos datos y se gasta lo mismo:  var p = getDatafromPredecessor(predecessor); 
						var p = getTaskCurrentData(predecessor);
						
						if (WF_DEBUG) {
							console.log("Predeccesor data",p[0]);
							console.log("Predeccesor DueDate",p[0].duedate);
							console.log("Start date gettime() ",Start.getTime());
							console.log("Predeccessor Status ",p[0].status);
							console.log("idStartDate", idStartDate, "$('"+idStartDate+"')");
						}
						
						if (p[0].status != 1) {
							if(PredecessorRealBlocking){
								alert("Predecessors are blocking this action.\n.\nNote: predeccessor are in dependency chain.");
								return false;
							}
							if (WF_DEBUG)
								console.log('UpdateStartByDependency()',"Predeccessor is not active then can go on...");
							return true;
						}
						
						if (p[0].duedate >= Start.getTime()) {
							if (WF_DEBUG)
								console.log('UpdateStartByDependency',"Alcanzo a predecesor");
							alert("The following task is preventing you to update the stardate \n\n" + p[0].title + " \nDue date : " + formatDate(p[0].duedate));
							return false;
						} else {
							if (WF_DEBUG)
								console.log('UpdateStartByDependency',"No alcanzo a predecesor");
							return true;
						}
						
					} else if (dependency == 'startToStart') {
						return true;
					} else {
						// alert("This Task has not dependency -"+idInput);
						return true;
					}
				}
//---UpdateStartByDependency>


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
				});
					
				$('[id^=idTask_Duration_]').on("focus", function(e) {
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
				
				window.EnabledAndDisabledDateFilter = function EnabledAndDisabledDateFilter() {
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
				
//---filterButtonG>
		window.SetTableTasksByFilters = function SetTableTasksByFilters(bybutton, WSO) {
			if (WF_DEBUG)
				console.info('SetTableTasksByFilters(bybutton, WSO)', bybutton, WSO);
			
			var filtered_message = '';
			arrayFilters = [];

			if (!bybutton) {
				$('#mytblTasks > tbody > tr').remove();
				$('#ButtonLoadMoreTasks').attr("data-slice", -1);
			}
			
			if (WSO)
				var WhoFilterSO = WSO;
			else
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
			var WhoFilterWoW2 = $('#filterWoW2').data('state'); // values 1,2,3...
			//console.log('Your WoW to filter is '+WhoFilterWoW);
			var WhoFilterDurationFrom = $("[id^=filterDurationStart]").val();
			//console.log('Your duration from to filter is '+WhoFilterDurationFrom);
			var WhoFilterDurationTo = $("[id^=filterDurationEnd]").val();
			var whoFilterItemId = $("#selServices").val();
			var whoFilterIdAdress = $("#selAdresses").val();
			
			//--- Create a message to be show near loadmore botton
			if (whoFilterItemId) filtered_message += ' <b>Item</b>: '+$("#selServices :selected").text();
			if (whoFilterIdAdress) filtered_message += ' <b>Service address</b>: '+$("#selAdresses :selected").text();
			if (filtered_message) filtered_message = '<span class="label label-info">Tasks filtered by</span> ' + filtered_message;
			$('#filtered_message').html(filtered_message);
			//----
			
			//console.log('Your duration until, to filter is '+WhoFilterDurationTo);
			arrayFilters.push(WhoFilterSO);
			arrayFilters.push(WhoFilterAsignee);
			arrayFilters.push(WhoFilterTask);
			if (WF_DEBUG)
				console.log('WhoFilterTask:', WhoFilterTask);
			arrayFilters.push(WhoFilterSD);
			arrayFilters.push(WhoFilterDD);
			arrayFilters.push(WhoFilterWoW);
			arrayFilters.push(WhoFilterDurationFrom);
			arrayFilters.push(WhoFilterDurationTo);
			arrayFilters.push(WhoFilterDepartment);
			arrayFilters.push(whoFilterItemId);
			arrayFilters.push(whoFilterIdAdress);
			arrayFilters.push(WhoFilterWoW2);
			//console.log(arrayFilters);

			ChangeTableTasksParams(arrayFilters, WorkForce_Obj.rolePM, bybutton);
			
			loaderEnd();
			return false;
		}
				
//-- Reset>
				window.Reset = function Reset() {
					$('[id^=filterAsignee_]').val("notuser0");
					$('[id^=filterDepartment]').val("notuser0");
					$('[id^=filterTask]').val("notstatus");
					$('#filterStartDate').val('');
					$('#filterDueDate').val('');
					$("#filterWoW").attr('checked', false);
					tristate1_set( $("#filterWoW2"), 1);
					$("#filterDurationStart").val('');
					$("#filterDurationEnd").val('');
					$("#selServices").val('');
					$("#selAdresses").val('');
					
					return false;
				}
				
				var formatter = new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD',
					minimumFractionDigits: 2,
				});
				
				$('.thetabsalesorders .tabtogsales-links a').on('click', function(e) {
					var currentAttrValue = $(this).attr('href');
					$('.thetabsalesorders ' + currentAttrValue).slideDown(400).siblings().slideUp(400);
					$(this).parent('li').addClass('active').siblings().removeClass('active');
					$.fn.dataTable.tables( {visible: true, api: true} ).columns.adjust();
					e.preventDefault();
				});
				
				$('.thetabtogants .tabtogant-links a').on('click', function(e) {
					var currentAttrValue = $(this).attr('href');
					$('.thetabtogants ' + currentAttrValue).slideDown(400).siblings().slideUp(400);
					$(this).parent('li').addClass('active').siblings().removeClass('active');
					$.fn.dataTable.tables( {visible: true, api: true} ).columns.adjust();
					e.preventDefault();
				});
				
				// No borrar $('[id^=dico'+Xs+'].GoUpdateEnable').show();
				//
				
				$("ul .dtab2").click(function() {
					$(".dhxtreeview_cont").css('width', '100%');
					$(".dhxtreeview_cont").css('height', '100%');
				});
				
				$('.dataTables_scrollBody').css('overflow-x', 'hidden');
				
				$('.select2-search__field').attr("placeholder", " * Filter by status of the Sales Orders by clicking on this field");

				// Language strings update on load
				$('#msgSalesOrdersClick').html(messages.click_any_os);
				//$('.talknow').html(messages.talk_now);

				$('#NS_MENU_ID0').hide(); // Hide Netsuite "More..." at top right page.
				
				//-- Enable ESOW -- to provisioning and fullaccess.
				if(WorkForce_Obj.Env == 'SANDBOX') {
					if (WorkForce_Obj.userDeptId == 21 || WorkForce_Obj.userRole == 18) {
						$('#btnESOWbtn').removeClass('hide');
					}
				} else {
					if (WorkForce_Obj.userDeptId == 5 || WorkForce_Obj.userRole == 18) {
						$('#btnESOWbtn').removeClass('hide');
					}
				}
				
				
	//---
				/* Changes move Stats to hedeaer line */
				var div_stats = $('#stats-area').html();
				div_stats = div_stats.replace(new RegExp('leirags-st-', 'g'), 'leirags-stf-');
				var div_stats_n = '<div id="stats-area-all" class="leirags-stats pull-right" style="font-size:9pt;margin-right:26px;">' + div_stats + '</div>';
				var wf_title = '<h1 class="uir-record-type">Workforce Management <span class="label label-success" id="audit-name"></span></h1>';
				$('#stats-area').hide();				
				
				/* if WF are launch without headers */
				var fl = $('.uir-page-title-firstline');
				// console.info(fl);
				if (fl.length < 1){
					console.info('WF - Screen Inline Activated.')
					//$('#workforce_pagetitle_firstline').show();
					// fix up space
					// div__body
					$('#workforce_pagetitle_firstline').html (div_stats_n + wf_title);
					var t = $('#div__body #main_form table');
					//- $(t[0]).css('margin-top','-42px');
					$(t[0]).css('margin-top','0px');
					$(".tblsalesorders").css('margin','0 6px');
					$('#dismiss-comm').css('top','-55px').css('left','20px');
					$('#notification-comm').addClass('alterno').css('top','106px');
				} else {
					$('.uir-page-title-firstline').html (div_stats_n + wf_title);
					if (WorkForce_Obj.src.hideNavBar) {
						var t = $('#div__body #main_form table');
						$(t[0]).css('margin-top','42px');
						$(".tblsalesorders").css('margin','0 6px');
						$('#dismiss-comm').css('top','-55px').css('left','20px');
						$('#notification-comm').addClass('alterno').css('top','106px');
					}
				}
				
				//---loaderEnd();
				setTimeout(function(){ jQScrollTo('contenting'); },20);

				show_notification('Welcome to <b>Transtelco</b> Workforce Management','info',true)
				getMyNotifications('incoming')
				getMyNotifications('outgoing')
				getStatsToday( true ); // Param true/false, when true fill full stats for user.
				getStatsToday( false );
				
				/* Run in main  */
				loaderStart();
				if (WorkForce_Obj.gocomm) {
					// Get task by Id and Show Communicator.
					getTaskNotesFull(WorkForce_Obj.gocomm);
				} else {
					GetSalesOrdersbyID('Customsalesorder', 'CurrentUser', '1', false);
				}
				
			}, 100); // Was 2800
//---RESTCODE>

		});

/* updated 2017-April-17 07:09PM */
/* updated 2017-April-19 07:08AM */
/* updated 2017-April-19 04:41PM */
/* updated 2017-April-20 11:35PM */
/* updated 2017-April-20 06:36PM  Change ClicDico, if not agree then return... */
/* updated 2017-April-20 07:10PM Change Message parse http, and <br> */
/* updated 2017-April-21 12:25PM Change Tables <br> */
/* updated 2017-April-21 04:31PM Add DesktTop Notfications */
/* updated 2017-April-23 06:00AM Add task Info on Tracing list, diffWrkDays */
/* updated 2017-April-24 03:40PM Add task duration on branchs, fix changeStatusRules */
/* updated 2017-April-24 08:43PM Add notification stats, notification-task-link-to-comm some minor-fix, add so to notifications */
/* updated 2017-April-25 03:42PM Fix when not edit statsus */
/* updated 2017-April-25 04:21PM Fix able to cancel at any time. */
/* updated 2017-April-26 11:28AM Fix gocomm and add messages. */
/* updated 2017-April-26 01:23PM Add processAction function. */
/* updated 2017-April-26 06:30PM Add rason to cancel and send email, on re-activating send email to assigneed. */
/* updated 2017-April-28 07:01AM Add getPredessesorsmulti */
/* updated 2017-April-29 03:18AM Add chatMessages, corrections apply */
/* updated 2017-April-29 12:47PM Add feature WF call param &ifrmcntnr=T */
/* updated 2017-April-29 08:43PM Add fix module for corrections and semd notifications */
/* updated 2017-April-30 07:41AM Add Verizon data to SO */
/* updated 2017-May-02   07:20PM Add Assigniee on NoteOnTask, auto-mention of user and assigned on task, add rule for special users reassign's, Edit Enginner Scope of Work */
/* updated 2017-May-02   08:13PM Add Chat Groups */
/* updated 2017-May-04   12:33PM Add Messages inout, verizon move to general and set to comercial_cond */
/* updated 2017-May-04   01:18PM Include in SOW cond_com, pm_notes, sow. */
/* updated 2017-May-04   05:08PM add TheTeam filter to My Work */
/* updated 2017-May-05   08:40AM add Logic to handle outgoin messages */
/* updated 2017-May-05   09:47AM change WF_Notifications_time to 10 */
/* updated 2017-May-06   08:30PM Update Chat to new Skin */
/* updated 2017-May-09   07:29PM Add NetWorkDesign, fix bugs in dates in getallmywork */
/* updated 2017-May-11   11:19AM Add Deviation to MyWork */
/* updated 2017-May-11   03:03PM Add displaySObyID using Templates called by GetSalesOrdersbyID */
/* updated 2017-May-12   06:38AM Fix Tracing Tree View add background */
/* updated 2017-May-12   11:48AM Fix not shoe processing image in applyAssigneeByGroupInSO */
/* updated 2017-May-16   07:53AM Add Visual Object apply changes, fix staff and departments */
/* updated 2017-May-17   10:24PM Fix Tracing to show up correct user tasks */
/* updated 2017-May-18   12:07PM Fix Show to all tabso5 */
/* updated 2017-May-18   04:05PM Fix alert "process is taking too long..." */
/* updated 2017-May-18   04:18PM Alert was void, now add message to log list */
/* updated 2017-May-21   11:08PM Fix Reload SO after changes in ACK, Duration, Add Configuration Circuits */
/* updated 2017-May-22   11:27AM Fix enable to WF_Develop_State and auditing to Change Status of TASK */
/* updated 2017-May-22   03:31PM Fix cancelling process and void Nan/Nan/Nan/Nan in due-date y Re-Activate Task*/
/* updated 2017-May-22   07:39PM Fix change assigned on MyWork, Cursor Pointer on Items and Services Address */
/* updated 2017-May-24   03:25PM Add Permalink to gocomm */
/* updated 2017-May-24   05:53PM Add DataTables Sort netsuite Dates */
/* updated 2017-May-25   06:18PM Validation in general, DUE date cannot be less than due date, in all cases. */
/* updated 2017-May-26   01:45PM Add filter to SO tasks WOW better options, issue some tasks dont open communicator, fixed  */
/* updated 2017-May-26   08:17AM Change margins in SOW, ESOW, y Data Sales order, increse font-size to 9pt (dlagsmin) */
/* updated 2017-May-28   01:01AM Add funtionality WF_Enable_Notification_On_Completed */
		