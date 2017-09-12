/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/runtime', 'N/file', 'N/format' ],

function (serverWidget, search, record, runtime, file, format ){
    

	var WorkForce_Obj = {
		Env:'Undefined',
		src:{ CabHtmlTaskID:0, CabHtmlSP:0, CabJSLangEnID:0, CabJSLangSpID:0, hideNavBar: false },
		userID:0,
		userName:'',
		userRole:0,
		userDeptId:0,
		userEmail:'',
		lang:'en',
		uiType:'OLD',
		stealthyEn:false,
		auditId:0,
		rolePM:false,
		roleDBG: false,
		preferences : {},
		version: 0,
		gocomm: '',
		emb_kickoff : false,
		canReassign : false,
		onGroups : [],
		spGroups : [],
		viewTab_so : false,
		viewTab_tracing : false,
	};

	var myTeamIds = [ ];
	var WF_Disable_Team = false; // Set true for testing users wiht out team

	var rolesAsPM = [
		3, 		// Administrator
		18, 	// Full Access
		1022,	// Project Manager
		1023, 	// Sales Director
		1067,	// Ingenieria/Aprovisionamiento/Supervisor
	];
	var SpecialUsersAsPM =[0];

	var auditId = 0;
	var rolesAUDIT = [
		3, 		// Administrator
		18, 	// Full Access
	];

	var SpecialUsersAUDIT =[0];
	
	var SpecialUsersReAssign = [0];
	
	var wf_maintenance = false;
	
	var gocomm = '';
	
	var Wrike_force = false;
	
	var rolesTracing = [], usersTracing = [];
	
	var userObj = runtime.getCurrentUser();

	function setupEnvironmentWorkForce(){
		WorkForce_Obj.Env = runtime.envType;
		if (WorkForce_Obj.Env == 'SANDBOX') {
			WorkForce_Obj.src.CabHtmlTaskID = 6516954; 	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html > Task_helperv2.html
			WorkForce_Obj.src.CabHtmlSP     = 6565382;	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html > wf_snbx_head.txt
			WorkForce_Obj.src.CabJSLangEnID = 6526414; 	//= SuiteScripts > TTOpMgmt_ProjectAdmin > lib > messagesInEng.js
			WorkForce_Obj.src.CabJSLangSpID = 6526415; 	//= SuiteScripts > TTOpMgmt_ProjectAdmin > lib > messagesInEng.js
		} else {
			WorkForce_Obj.src.CabHtmlTaskID = 8215249;	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html > Task_helperv2.html
			WorkForce_Obj.src.CabHtmlSP     = 9785882;	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html >  wf_prod_head.txt
			WorkForce_Obj.src.CabJSLangEnID = 8215349; 	//= SuiteScripts > TTOpMgmt_ProjectAdmin > lib > messagesInEng.js
			WorkForce_Obj.src.CabJSLangSpID = 8215449; 	//= SuiteScripts > TTOpMgmt_ProjectAdmin > lib > messagesInEng.js
		}

		WorkForce_Obj.userID 		= userObj.id;
		WorkForce_Obj.userName      = userObj.name;
		WorkForce_Obj.userRole 		= userObj.role;
		WorkForce_Obj.userDeptId	= userObj.department;
		WorkForce_Obj.userEmail		= userObj.email;
		WorkForce_Obj.lang 			= getLanguage();
		WorkForce_Obj.gocomm  		= gocomm; // Task Id to showup on start up.

		if ((rolesAUDIT.indexOf(WorkForce_Obj.userRole) != -1) ||
			(SpecialUsersAUDIT.indexOf(WorkForce_Obj.userID) != -1))
		{
			if(auditId)
				WorkForce_Obj.auditId = auditId;
			WorkForce_Obj.stealthyEn = true;
			WorkForce_Obj.roleDBG = true; // By now, Auditors can debug...
		} else {
			auditId = 0;
		}

		if ((rolesAsPM.indexOf(WorkForce_Obj.userRole) != -1) ||
		    (SpecialUsersAsPM.indexOf(WorkForce_Obj.userID) != -1))
		{
			WorkForce_Obj.rolePM = true;
		}
		
		if (SpecialUsersReAssign.indexOf(WorkForce_Obj.userID) != -1)
		{
			WorkForce_Obj.canReassign = true;
		}
		
		if ((rolesTracing.indexOf(WorkForce_Obj.userRole) != -1) ||
			    (usersTracing.indexOf(WorkForce_Obj.userID) != -1))
		{
			WorkForce_Obj.viewTab_tracing = true;
		}

	}

	function getHTML_WorkForce(){
		var mark_insert = '<!-- SANDBOX_MARK_PRODUCTION -->';
		var main_file = file.load(WorkForce_Obj.src.CabHtmlTaskID).getContents();
		var snbx_prod_file = file.load(WorkForce_Obj.src.CabHtmlSP).getContents();
		var mark_wf_obj = 'var WorkForce_Obj = {};';
		main_file = main_file.replace(mark_wf_obj, 'const WorkForce_Obj = '+JSON.stringify(WorkForce_Obj)+';' );
		var mark_wf_obj = 'var WorkForce_MyTeam = {};';
		main_file = main_file.replace(mark_wf_obj, 'const WorkForce_MyTeam = '+JSON.stringify(myTeamIds)+';' );
		/* core.js */
		var corejs = { 
				SANDBOX: "/core/media/media.nl?id=6565694&c=3461650&h=dc046ac9f46270f7f9bc&_xt=.js",
				PRODUCTION: "/core/media/media.nl?id=10621522&c=3461650&h=81170923cecf5f021b84&_xt=.js"
			}
		var mark_wf_core = "{{WorkForce-Core-JS}}";
		main_file = main_file.replace(mark_wf_core, corejs[WorkForce_Obj.Env] );
		
		return main_file.replace(mark_insert, snbx_prod_file);
	}

	function ReadWFConfiguration(){
		var a, b;
		var fields = [
			'custrecord_wf_cfg_role_as_pm',
			'custrecord_wf_cfg_role_audit',
			'custrecord_wf_cfg_suser_as_pm',
			'custrecord_wf_cfg_suser_auditor',
			'custrecord_wf_version',
			'custrecord_wf_maintenance',
			'custrecord_wf_cfg_emb_kickoff',
			'custrecord_wf_cfg_suser_reassign',
			
		];
		var xyz_rp, xyz_au, xyz_supm, xyz_suau, xyz_emb, xyz_rea;
		try{
			var wfc = record.load({
				type : 'customrecord_sst_wf_config',
				id: 1
			});

			wf_maintenance = wfc.getValue('custrecord_wf_maintenance');
			
			Wrike_force = wfc.getValue('custrecord_wf_cfg_wrike_force');
			
			xyz_emb = wfc.getValue('custrecord_wf_cfg_emb_kickoff');
			
			a = wfc.getValue('custrecord_wf_cfg_role_as_pm');
			b = JSON.parse('['+a+']');
			//rolesAsPM = b;
			xyz_rp = b;

			a = wfc.getValue('custrecord_wf_cfg_role_audit');
			b = JSON.parse('['+a+']');
			//rolesAUDIT = b;
			xyz_au = b;

			a = wfc.getValue('custrecord_wf_cfg_suser_as_pm');
			b = JSON.parse('['+a+']');
			//SpecialUsersAsPM = b;
			xyz_supm = b;

			a = wfc.getValue('custrecord_wf_cfg_suser_auditor');
			b = JSON.parse('['+a+']');
			//SpecialUsersAUDIT = b;
			xyz_suau = b;

			//a = wfc.getField('custrecord_wf_version');
			a = wfc.getValue('custrecord_wf_version');
			WorkForce_Obj.version = a;
			
			WorkForce_Obj.emb_kickoff = xyz_emb;
			
			a = wfc.getValue('custrecord_wf_cfg_suser_reassign');
			b = JSON.parse('['+a+']');
			//SpecialUsersReAssign = b;
			xyz_rea = b;

			//throw new Error('No WorkForce configuration record found.');

		} catch(e) {
			WorkForce_Obj.version = 'NaN';
		}

		rolesAsPM = (xyz_rp) ? xyz_rp : rolesAsPM;
		rolesAUDIT = (xyz_au) ? xyz_au : rolesAUDIT;
		SpecialUsersAsPM = (xyz_supm) ? xyz_supm : SpecialUsersAsPM;
		SpecialUsersAUDIT = (xyz_suau) ? xyz_suau : SpecialUsersAUDIT;
		SpecialUsersReAssign = (xyz_rea) ? xyz_rea : SpecialUsersReAssign;
		
		return true;
	}

	function sysDate(){
		var date = new Date();
		var tdate = date.getDate();
		var month = date.getMonth() + 1; // jan = 0
		var year = date.getFullYear();
		return month + '/' + tdate + '/' + year;
	}

	function TimeStamp() {
		var str = '';
		var currentTime = new Date();
		var hours = currentTime.getHours();
		var minutes = currentTime.getMinutes();
		var seconds = currentTime.getSeconds();
		var meridian = 'am';
		if (hours > 12) meridian = 'pm';
		if (hours > 12) hours = hours - 12;
		if (minutes < 10) minutes = '0' + minutes;
		if (seconds < 10) seconds = '0' + seconds;
		str += hours + ':' + minutes + ':' + seconds + ' ';
		return str + meridian;
	}

	function getNowDateNetSuite(){
		var currentDateAndTime = sysDate() + ' ' + TimeStamp();
		return format.parse({ value: currentDateAndTime, type: format.Type.DATE });
	}

	function ReadWFUserPreferences(){
		// return true;
		var userId = userObj.id;
		var userName = userObj.name;
		var recType = 'customrecord_sst_wf_user_pref';
		var fields = [
			'internalId',
			'custrecord_wf_up_userid',
			'custrecord_wf_disabled',
			'custrecord_wf_mywork_filters',
			'custrecord_wf_workspace_filters',
			'custrecord_wf_mysalesorders_filters',
			'custrecord_wf_salesorders_filters',
			'custrecord_wf_first_login_date',
			'custrecord_wf_last_login',
			'custrecord_wf_start_main_tab'
		];
		var filters = [
						['custrecord_wf_up_userid','is', userId ]
		];
		var userPref = {};
		var exist = false;
		var custrecord_exist = false;
		var wfp_id = 0;
		var now = '';
		now = String(getNowDateNetSuite());
		//now = sysDate() + ' ' + TimeStamp();
		userPref['now'] = now;
		try{
			search.create({
				type: recType,
				filters: filters,
				columns : fields
			}).run().each(function(res){
				fields.forEach(function(f){
					//@Note: Netsuite here change var fields to object with properties as columns, then need use f.name
					var l = f.name.split('custrecord_wf_').pop();
					userPref[l] = res.getValue(f);
				});
				wfp_id = res.getValue('internalId');
				userPref['now'] = now;
				exist = true;
				custrecord_exist = true;
			});
		} catch(e) {
			userPref['error'] = e;
			userPref['message'] = 'Cannot read preferences (maybe custom-record not exist).';
		}

		if (exist) {
			if (wfp_id) {
				setUserLastLoginDate(recType, wfp_id, now, userPref);
			}
		} else {
			// Create Preference Record
			if (! custrecord_exist){
				createUserPreferences(recType, userName, userId, now, userPref);
			}
		}

		WorkForce_Obj.preferences = userPref;
		return true;
	}

	function setUserLastLoginDate(recType, wfp_id, now, userPref){
		try{
			record.submitFields({
				type: recType,
				id: wfp_id,
				values: { 'custrecord_wf_last_login': now },
				options: { enableSourcing: true, ignoreMandatoryFields : false }
			});
		} catch(e){
			userPref['error'] = e;
			userPref['message'] = 'Cannot save the last session datetime.';
		}
	}

	function createUserPreferences(recType, userName, userId, now, userPref){
		try{
			var wfp = record.create({ type : recType, isDynamic: false });
			wfp.setValue({ fieldId: 'name', value: userName, ignoreFieldChange: true });
			wfp.setValue({ fieldId: 'user', value: userId, ignoreFieldChange: true });
			wfp.setValue({ fieldId: 'custrecord_wf_up_userid', value: userId, ignoreFieldChange: true });
			wfp.setValue({ fieldId: 'custrecord_wf_start_main_tab', value: 3, ignoreFieldChange: true });
			wfp.setValue({ fieldId: 'custrecord_wf_first_login_date', value: now, ignoreFieldChange: true });
			wfp.setValue({ fieldId: 'custrecord_wf_last_login', value: now, ignoreFieldChange: true });
			wfp_id = wfp.save();
		} catch(e){
			userPref['error'] = e;
			userPref['message'] = 'Cannot create user preference record.';
		}
	}
	
	function ReadWFUserGroups(){
		var userId = userObj.id;
		var recType = 'customrecord_sst_wf_group_users';
		var fields = [
				'custrecord_sst_wf_user_groups_id',
				'custrecord_sst_wf_group_user_id'
			];
		var filters = [
				[ 'custrecord_sst_wf_group_user_id', 'is', userId ]
			];
		var userGroups = [];
		var specialGroups = [];
		try{
			search.create({
				type : recType,
				filters : filters,
				columns : fields
			}).run().each(function(gpx){
				var gpo = {
					id : gpx.getValue('custrecord_sst_wf_user_groups_id'),
					name : gpx.getText('custrecord_sst_wf_user_groups_id')
				};
				if (gpo.id <= 10) {
					specialGroups.push(gpo);
				} else {
					userGroups.push(gpo);
				}
				return true
			});
		} catch(e) {
			userPref['error'] = e;
			userPref['message'] = 'Cannot read groups belong to user.';
		}
		WorkForce_Obj.onGroups = userGroups;
		WorkForce_Obj.spGroups = specialGroups;
		return true;
	}

//---- getSalesOrderStatus>
	function getSalesOrderStatus (){
		var results = [];
		var defaultMainStatus =['SalesOrd:B','SalesOrd:D','SalesOrd:E'];
		var defaultCustomStatus =[1,6];

		var CustomStatus = '<optgroup label="TRANSACTION STATUS">\
    <option value="SalesOrd:A">	Pending Approval</option>\
    <option value="SalesOrd:B" selected> Pending Fulfillment</option>\
    <option value="SalesOrd:C">	Cancelled</option>\
    <option value="SalesOrd:D" selected> Partially Fulfilled</option>\
    <option value="SalesOrd:E" selected> Pending Billing/Partially Fulfilled</option>\
    <option value="SalesOrd:F">	Pending Billing</option>\
    <option value="SalesOrd:G">	Billed</option>\
    <option value="SalesOrd:H">	Closed</option>\
    </optgroup>';
		var MainStatus = '<optgroup label="ORDER STATUS">';


		search.create({
			type: 'customlist_estat_ovta',
			filters: [],
			columns : ['internalid','name']

		}).run().each(function(res){
			var newIntId =  parseInt(res.getValue('internalid'), 10) + 2000;
			MainStatus += '<option value="'+newIntId+'">'+res.getValue('name')+'</option>';
      // results.push({
      //   'value' 		: res.getValue('internalid'),
      //   'text'	:res.getValue('name'),
      // });
			return true;
		});

		MainStatus = MainStatus+'</optgroup>';

		return MainStatus + CustomStatus;

		return JSON.stringify(results);
	}

	function SelectAsignee(theuserID) {

		var SortName = search.createColumn({name: 'entityid', sort: 'ASC'});

		var mySearch = search.create({
			type: 'employee',
			columns: ['internalId', 'firstname', 'lastname', 'title', 'isinactive',
						'custentity_wrike_contact_id',SortName, 'email'],
			filters:[
				['isinactive','is', false]
			]
		});
		var counter = 0;
		var selectAsignee = '<select id="selectAsignee" onchange="" name="selectAsignee" class="select5picker" data-live-search="true">';
		mySearch.run().each(function(result) {
			counter++;
			var employeeId     = result.getValue('internalId');
			var employeeName   = result.getValue('firstname');
			var employeeLast   = result.getValue('lastname');
			var employeeFull   = result.getValue('entityid');

			var wrikeID   = result.getValue('custentity_wrike_contact_id');

			employeeFull = String(employeeFull).split(' ');
			var l = employeeFull.length;
			var employeeCompleteName = employeeFull[0] + ' ' +employeeFull[1] +' '+(employeeFull[2]==undefined? '' : employeeFull[2]) ;

	          //var employeeCompleteName = employeeFull;
	          //var employeeCompleteName = employeeLast + ' ' + employeeName;

			if(wrikeID != ''){
				if (employeeId == theuserID) {
					selectAsignee = selectAsignee + '<option value=' + employeeId + '>' + employeeCompleteName + '</option>';
				} else {
					selectAsignee = selectAsignee + '<option value=' + employeeId + '>' + employeeCompleteName + '</option>';
				}
			}

	          //myString = myString+ ('# Rol: ' + rol_id + '  | Asignado: ' + rol_name + ' :: ');
			return true;
		});
		selectAsignee = selectAsignee + '</select>';
	    //if (count>100) { return false; }
		return selectAsignee;
	}

	function AssignedJSON() {

		var SortName = search.createColumn({name: 'entityid', sort: 'ASC'});
		var RealDetpo = search.createColumn({name: 'department', join: 'departments'});

		var mySearch = search.create({
			type: 'employee',
			columns: ['internalId', 'firstname', 'lastname', 'title',
                	'isinactive','custentity_wrike_contact_id',
                	SortName,'subsidiary','department','email','supervisor'],
			filters:[
				['isinactive','is', false]
			]
		});
		var counter = 0;
		var selectAsignee = [];
		mySearch.run().each(function(result) {
			counter++;
			var employeeId     = result.getValue('internalId');
			var employeeName   = result.getValue('firstname');
			var employeeLast   = result.getValue('lastname');
			var employeeFull   = result.getValue('entityid');
			var subsidiaryId   = result.getValue('subsidiary');
			var wrikeID  	   = result.getValue('custentity_wrike_contact_id');
			var deptId  	   = result.getValue('department');
			var deptName  	   = result.getText ('department');
			var xemail  	   = result.getValue('email');
			var supervisor	   = result.getValue('supervisor');
			
			deptName = deptName.split(':').pop();
			
			employeeFull = String(employeeFull).split(' ');
			var l = employeeFull.length;
			if(subsidiaryId== 2 || subsidiaryId == 3 || subsidiaryId == 9) {
				var employeeCompleteName = employeeFull[0] + ' ' +employeeFull[1] +' '+(employeeFull[2]==undefined? '' : employeeFull[2]) ;
				if(!Wrike_force || (Wrike_force && (wrikeID != '')))
					selectAsignee.push({
						'employeeId'    : employeeId,
						'subsidiaryId'  : subsidiaryId,
						'employeeName'  : employeeCompleteName,
						'wrikeID'       : wrikeID,
						'deptId'		: deptId,
						'deptName'		: deptName,
						'email'			: xemail,
						'supervisor'	: supervisor,
					});
			}

			return true;
		});
		return JSON.stringify(selectAsignee);
	}

	function AssignedJSONInactive() {

		var SortName = search.createColumn({name: 'entityid', sort: 'ASC'});

		var mySearch = search.create({
			type: 'employee',
			columns: ['internalId', 'firstname', 'lastname', 'title',
                	'isinactive','custentity_wrike_contact_id',
                	SortName,'subsidiary','department'],
			filters:[
            ['isinactive','is', true]
			]
		});
		var counter = 0;
		var selectAsignee = [];
		mySearch.run().each(function(result) {
			counter++;
			var employeeId     = result.getValue('internalId');
			var employeeName   = result.getValue('firstname');
			var employeeLast   = result.getValue('lastname');
			var employeeFull   = result.getValue('entityid');
			var subsidiaryId   = result.getValue('subsidiary');
			var wrikeID  	   = result.getValue('custentity_wrike_contact_id');
			var deptId  	   = result.getValue('department');
			var deptName  	   = result.getText('department');

			employeeFull = String(employeeFull).split(' ');
			var l = employeeFull.length;
			var employeeCompleteName = employeeFull[0] + ' ' +employeeFull[1] +' '+(employeeFull[2]==undefined? '' : employeeFull[2]) ;
			if(subsidiaryId== 2 || subsidiaryId == 3 || subsidiaryId == 9)
				if(wrikeID != '')
					selectAsignee.push({
						'employeeId'    : employeeId,
						'subsidiaryId'  : subsidiaryId,
						'employeeName'  : employeeCompleteName,
						'wrikeID'       : wrikeID,
						'deptId'		: deptId,
						'deptName'		: deptName,
					});

			return true;
		});
		return JSON.stringify(selectAsignee);
	}

	function SelectStatus(){
		var count = 0;
		var mySearch = search.create({
			type: 'customlist_kpi_task_status',
			columns: ['internalId', 'name']
		});
		var selectStatu = '<select name="selectTaskStatus" id="selTaskStatus" onclick="getLastStatus.call(this)" onchange="" style="height:28px;" class="selectTaskStatus">';
		mySearch.run().each(function(result) {
			var StatusId = result.getValue('internalId');
			var StatusName = result.getValue('name');

			selectStatu = selectStatu + '<option value="'+StatusId+'">'+StatusName + '</option>';

			return true;
		});
		selectStatu = selectStatu + '</select>';
		return selectStatu;
	}

	function onlyuniques(a ){
		return a.sort().filter(function(item, pos, ary) {
			return !pos || item != ary[pos - 1];
		});
	}

	function userJobTitle(theuserID) {
		var mySearch = search.create({
			type: 'employee',
			columns: ['internalId', 'title'], //
			filters:[
                ['internalId', 'is', theuserID]
			]
		});
		var title;
		mySearch.run().each(function(result) {
			title = result.getValue('title');
			return true;
		});
		return title;
	}

	function auditUserName() {
		var mySearch = search.create({
			type: 'employee',
			columns: ['internalId', 'title','firstname','lastname'], //
			filters:[
                ['internalId', 'is', auditId]
			]
		});
		var name;
		mySearch.run().each(function(result) {
			name = result.getValue('firstname') +' '+ result.getValue('lastname') ;
			return true;
		});
		return name;
	}

	function getRole(theuserID) {
		var userRole = userObj.role;
		userRole = Math.round(userRole);
		return userRole;
	}

	function findSalesOrderOfUser(userID, taskIsOpen) {
		 // taskIsOpen will be either:
		 // 'open', 'notopen'
		 // Array to provide status states of task to set output
		var taskStatusArray = [];
		if (taskIsOpen == ''){
			// If user didn't entered the parameter taskIsOpen then we asume that are condition is for NOT OPEN
			taskIsOpen = 'notopen';
			//alert(taskIsOpen);
		}
		 // If user didn't write 'open' or 'notopen' then it will show tasks NOT OPEN
		if (taskIsOpen!='open' && taskIsOpen!='notopen') { taskIsOpen='notopen'; }
		if (taskIsOpen == 'open'){
			//alert('MODE: OPEN');
			taskStatusArray = ['PROGRESS', 'NOTSTART'];
		} else { // notopen
			//alert('MODE: NOT OPEN');
			taskStatusArray = ['COMPLETE'];
		}
		 // AN OPEN TASK  IS THE ONE THAT IS PROGRESS or NOTSTART
		//  NOT OPEN is which the tasks is COMPLETED
		taskStatusArray = [1];
		arrSearchFilters=[];
		arrSearchColumns=[];
		arrSearchFilters.push(search.createFilter({
			name: 'assigned',
			operator: search.Operator.ANYOF,
			values: [userID]
		}));

		var mySearch = search.create({
			type: 'task',
			//columns: arrSearchColumns,
			columns: ['internalid','title','assigned'],
			filters: arrSearchFilters
		});
		var so=[]; var cont=0;
		var norecfound = 0;

		mySearch.run().each(function(result) {
			var taskid = result.getValue('internalid');
			var tasktitle = result.getValue('title');
			// var taskassigned = result.getText('assigned');
			vsalesorder = tasktitle.substr(0,tasktitle.indexOf(' '));
			//console.log('Task ID: ' + taskid + ' SO: ' + vsalesorder) ;
			so.push(vsalesorder);
			norecfound++;
			//return norecfound<31;
			return true;
		});
		var mySOArray = onlyuniques(so);
		var selectSO = ' <label><select id="selectSO" name="selectSO" class="selectSO"><option value="nonselected">-Select Order Sale-</option>';
		var arrayLength = mySOArray.length;
		for (var i = 0; i < arrayLength; i++) {
			selectSO = selectSO + '<option value=' + mySOArray[i] + '>' + mySOArray[i] + '</option>';
		}
		selectSO = selectSO + '</select></label>';
		return selectSO;
	}

	function getMyTeam () {
		var CurrentUserID = userObj.id;
		var CurrentUserName = userObj.name;

		if(auditId){
			CurrentUserID = auditId;
			CurrentUserName = 'Audit: '+auditUserName();
			myTeamIds.push(auditId); // Used to able edit he is tasks.
		}

		var SortName = search.createColumn({name: 'firstname', sort: 'ASC'});

		var mySearch = search.create({
			type: 'employee',
			columns: ['internalId','supervisor',SortName, 'lastname', 'title'],
			filters:[
			['isinactive','is', false],
				'and',
				['supervisor', 'is', CurrentUserID]
			]
		});

		var selectTeamA = '<select name="selectMyTeam" id="selMyTeam" onclick="" onchange="" class="selectedMyTeam">\
			<option value="AllMyTeam">All My Team</option>\
			<option value="'+CurrentUserID+'" selected>'+CurrentUserName+'</option>';

		var selectTeamB = '<select name="selectMyTeam" id="selMyTeam" onclick="" onchange="" class="selectedMyTeam">\
			<option value="'+CurrentUserID+'" selected>'+CurrentUserName+'</option>';

		var selectTeam = '';
		if (!WF_Disable_Team)
		mySearch.run().each(function(result) {
			var employeeId  = result.getValue('internalId');
			var nombre   	= result.getValue('firstname');
			var apellido 	= result.getValue('lastname');
			selectTeam += '<option value=\''+employeeId+'\'>' +nombre+' '+ apellido+'</option>';
			myTeamIds.push(employeeId); // Used to able edit he is Tasks.
			return true;
		});

		selectTeam = ((selectTeam)? selectTeamA : selectTeamB) + selectTeam + '</select>';

		return selectTeam;
	}

	function getLanguage(){
		language = userObj.getPreference('language').split('_')[0];
		return language;
	}

/*	function DrawPageOLD(context)
    {
		var userObj = runtime.getCurrentUser();

        var form = serverWidget.createForm({
            title: 'Workforce Management'
        });

         // TO GET USER'S ROLE
        var xch_userrole = form.addField({
            id : 'custpage_userrole',
            type : serverWidget.FieldType.TEXT,
            label : 'XCH Users Role'
        });
        xch_userrole.defaultValue = getRole(userObj.id);
        xch_userrole.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});

		// TO GET language id
        var taskinator_whatid = form.addField({
            id: 'custpage_whatlang',
            type: serverWidget.FieldType.INLINEHTML,
            label:  "Language ID",
        });
        taskinator_whatid.updateDisplaySize({
            height: 60,
            width: 100
        });
		taskinator_whatid.defaultValue = getLanguage();
		taskinator_whatid.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});

		// TO GET THE MAIN HTML CONTENT OF LANGUAGES
        var taskinator_language_esp = form.addField({
            id: 'custpage_langesp',
            type: serverWidget.FieldType.INLINEHTML,
            label:  "Taskinator Language ESP",
        });
        taskinator_language_esp.updateDisplaySize({
            height: 60,
            width: 100
        });
        // Link to the file named messagesInEsp.js file id: 6526415
		// Link to the file named messagesInEng.js file id: 6526414
		if (getLanguage() == 'en') {
        	//taskinator_language_esp.defaultValue = file.load(6526414).getContents();
        	taskinator_language_esp.defaultValue = file.load(WorkForce_Obj.CabJSLangEnID).getContents();
        } else {
			//taskinator_language_esp.defaultValue = file.load(6526415).getContents();
			taskinator_language_esp.defaultValue = file.load(WorkForce_Obj.CabJSLangSpID).getContents();
		}

         // TO GET USER ID
        var xch_userID = form.addField({
            id : 'custpage_userid',
            type : serverWidget.FieldType.TEXT,
            label : 'XCH User ID'
        });
        xch_userID.defaultValue = userObj.id;
        xch_userID.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});

        //TO GET EMPLOYEES LIST IN SELECT
        var xch_ListEmployeesSelect = form.addField({
            id : 'custpage_selectempselect',
            type : serverWidget.FieldType.LONGTEXT,
            label : 'XCH Shows Employees in Select'
        });
        xch_ListEmployeesSelect.defaultValue = SelectAsignee(userObj.id);
        xch_ListEmployeesSelect.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});

        //TO GET STATUS LIST IN SELECT
        var ListSelectStatusTask = form.addField({
            id : 'custpage_selectstatustask',
            type : serverWidget.FieldType.LONGTEXT,
            label : 'XCH Shows Status in Select'
        });
        ListSelectStatusTask.defaultValue = SelectStatus();
        ListSelectStatusTask.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});
    	//TO GET MY TEAM LIST IN SELECT
        var ListSelectMyTeam = form.addField({
            id : 'custpage_selectmyteam',
            type : serverWidget.FieldType.LONGTEXT,
            label : 'XCH Shows my team in Select'
        });
        ListSelectMyTeam.defaultValue = getMyTeam();
        ListSelectMyTeam.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});

        //TO GET Sales Orders assigned to user
        var xch_getSOassignedToUser = form.addField({
            id : 'custpage_salesorderofuser',
            type : serverWidget.FieldType.LONGTEXT,
            label : 'XCH Sales Orders of Current User'
        });

        xch_getSOassignedToUser.defaultValue = findSalesOrderOfUser(userObj.id);
        xch_getSOassignedToUser.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});

    	// TO GET THE MAIN HTML CONTENT OF TASKINATOR
        var taskinator_inlinehtml = form.addField({
            id: 'taskinatorhtmlform',
            type: serverWidget.FieldType.INLINEHTML,
            label:  "Taskinator",
        });
        taskinator_inlinehtml.updateDisplaySize({
            height: 60,
            width: 100
        });
        // Link to the file named Task_helperv2.html
        //taskinator_inlinehtml.defaultValue = file.load(6516954).getContents();
        taskinator_inlinehtml.defaultValue = file.load(WorkForce_Obj.CabHtmlTaskID).getContents();


        return form;
    }
*/

	function DrawPage(context)
    {
		var userObj = runtime.getCurrentUser();

		WorkForce_Obj.userID = userObj.id;
		WorkForce_Obj.userRole = getRole(userObj.id);
		WorkForce_Obj.lang = getLanguage();

		var form = serverWidget.createForm({
			title: 'Workforce Management',
			hideNavBar: WorkForce_Obj.src.hideNavBar
		});

		// TO GET USER'S ROLE
		form.addField({
			id : 'custpage_userrole',
			type : serverWidget.FieldType.TEXT,
			label : 'XCH Users Role'
		}).updateDisplayType({
			displayType:serverWidget.FieldDisplayType.HIDDEN
		}).defaultValue = getRole(userObj.id);

		// TO GET language id
		form.addField({
			id: 'custpage_whatlang',
			type: serverWidget.FieldType.INLINEHTML,
			label:  'Language ID',
		}).updateDisplaySize({
			height: 60,
			width: 100
		}).updateDisplayType({
			displayType:serverWidget.FieldDisplayType.HIDDEN
		}).defaultValue = getLanguage();

		// TO GET THE MAIN HTML CONTENT OF LANGUAGES
		form.addField({
			id: 'custpage_langesp',
			type: serverWidget.FieldType.INLINEHTML,
			label:  'Taskinator Language ESP',
		}).updateDisplaySize({
			height: 60,
			width: 100
		}).defaultValue = file.load(
        		(getLanguage() == 'en')? WorkForce_Obj.src.CabJSLangEnID : WorkForce_Obj.src.CabJSLangSpID
        		).getContents();

		// TO GET USER ID
		var xch_userID = form.addField({
			id : 'custpage_userid',
			type : serverWidget.FieldType.TEXT,
			label : 'XCH User ID'
		}).updateDisplayType({
			displayType:serverWidget.FieldDisplayType.HIDDEN
		}).defaultValue = userObj.id;

		form.addField({
			id : 'custpage_selectempselect',
			type : serverWidget.FieldType.LONGTEXT,
			label : 'XCH Shows Employees in Select'
		}).updateDisplayType({
			displayType:serverWidget.FieldDisplayType.HIDDEN
		}).defaultValue = SelectAsignee(userObj.id);

        //--------------------------------------
		form.addField({
			id : 'custpage_employeesobj',
			type : serverWidget.FieldType.LONGTEXT,
			label : 'XCH Shows Employees object'
		}).updateDisplayType({
			displayType:serverWidget.FieldDisplayType.HIDDEN
		}).defaultValue = AssignedJSON();
        //--

      //--------------------------------------
		form.addField({
			id : 'custpage_employeesobj_inactive',
			type : serverWidget.FieldType.LONGTEXT,
			label : 'XCH Shows Employees object Inactive'
		}).updateDisplayType({
			displayType:serverWidget.FieldDisplayType.HIDDEN
		}).defaultValue = AssignedJSONInactive();
        //--

		form.addField({
			id : 'custpage_orderstatus',
			type : serverWidget.FieldType.LONGTEXT,
			label : 'list select order status'
		}).updateDisplayType({
			displayType:serverWidget.FieldDisplayType.HIDDEN
		}).defaultValue = getSalesOrderStatus();

		form.addField({
			id : 'custpage_selectstatustask',
			type : serverWidget.FieldType.LONGTEXT,
			label : 'XCH Shows Status in Select'
		}).updateDisplayType({
			displayType:serverWidget.FieldDisplayType.HIDDEN
		}).defaultValue = SelectStatus();


      //TO GET MY TEAM LIST IN SELECT
		form.addField({
			id : 'custpage_selectmyteam',
			type : serverWidget.FieldType.LONGTEXT,
			label : 'XCH Shows my team in Select'
		}).updateDisplayType({
			displayType:serverWidget.FieldDisplayType.HIDDEN
		}).defaultValue = getMyTeam();

        // DEROGATED - 2017-03-03 Ariel
//        //TO GET Sales Orders assigned to user
//        form.addField({
//            id : 'custpage_salesorderofuser',
//            type : serverWidget.FieldType.LONGTEXT,
//            label : 'XCH Sales Orders of Current User'
//        }).updateDisplayType({
//        	displayType:serverWidget.FieldDisplayType.HIDDEN
//    	}).defaultValue = findSalesOrderOfUser(userObj.id);

     // TO GET WorkForce
		form.addField({
			id: 'custpage_worfoce_obj',
			type: serverWidget.FieldType.INLINEHTML,
			label:  'WorkForce_Obj',
		}).updateDisplaySize({
			height: 60,
			width: 100
		}).updateDisplayType({
			displayType:serverWidget.FieldDisplayType.HIDDEN
		}).defaultValue = JSON.stringify(WorkForce_Obj);

     // TO GET THE MAIN HTML CONTENT OF TASKINATOR
		form.addField({
			id: 'taskinatorhtmlform',
			type: serverWidget.FieldType.INLINEHTML,
			label:  'Taskinator',
		}).updateDisplaySize({
			height: 60,
			width: 100
		}).defaultValue = getHTML_WorkForce();

        // file.load(WorkForce_Obj.CabHtmlTaskID).getContents();


		return form;
	}
	
	function DrawPageMaintenance(context)
    {
		
		var form = serverWidget.createForm({
			title: 'Workforce Management'
		});
		
		form.addField({
			id: 'taskinatorhtmlform',
			type: serverWidget.FieldType.INLINEHTML,
			label:  'Taskinator',
		}).updateDisplaySize({
			height: 60,
			width: 100
		}).defaultValue = "<h1>Maintenance</h1><p>WorkForce Managment is in maintenance, try later</p>";
		
		return form;
    }

	/**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2016.5
     */
	function onRequest(context) {
		if (context.request.method === 'GET')
    	{
			gocomm = context.request.parameters.gocomm;
			auditId = context.request.parameters.auditId;
			ReadWFConfiguration();
			ReadWFUserGroups();
			if (wf_maintenance) {
				form = DrawPageMaintenance(context);
			} else {
				ReadWFUserPreferences();
				setupEnvironmentWorkForce();
				form = DrawPage(context);
			}
			
			form.Title = 'Taskinator Workspace';
			context.response.writePage(form);
		}
	}

	return {
		onRequest: onRequest
	};

});

// LU: 2017-Feb-28 04:00PM
// LU: 2017-Mar-02 00:35AM
// LU: 2017-Mar-02 01:11AM
// LU: 2017-Mar-03 03:19PM
// LU: 2017-Mar-03 06:52PM
// LU: 2017-Mar-12 02:38PM
// LU: 2017-Mar-12 04:03PM
// LU: 2017-Mar-22 01:11PM
// LU: 2017-Mar-23 03:51PM
// LU: 2017-Apr-05 02:14PM
// LU: 2017-Apr-06 11:17AM
// LU: 2017-Apr-07 07:50AM
// LU: 2017-Apr-07 10:51AM
// LU: 2017-Apr-09 04:03AM
// LU: 2017-Apr-17 12:42AM
//LU: 2017-May-01 09:17AM add hidenavBar.
//LU: 2017-May-02 07:16PM add Special users reassign.
//LU: 2017-May-03 12:46AM add ReadWFUserGroups.