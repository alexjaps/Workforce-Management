/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format'],
/**
 * @param {file} file
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {widget} srvWidget
 * @param {format} format
 */
function(file, record, runtime, search, srvWidget, format) {
	
	var WorkForce_Obj = {
			Env:'Undefined',
			src:{ CabHtmlTaskID:0, CabHtmlSP:0, CabJSLangEnID:0, CabJSLangSpID:0},
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
	
	var wf_maintenance = false;
	
	var gocomm = '';
	
	var Wrike_force = false;

	function setupEnvironmentWorkForce(){
		WorkForce_Obj.Env = runtime.envType;
		if (WorkForce_Obj.Env == 'SANDBOX') {
			WorkForce_Obj.src.CabHtmlTaskID = 6516954; 	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html > Task_helperv2.html
			WorkForce_Obj.src.CabHtmlSP     = 6565382;	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html > wf_snbx_head.txt
		} else {
			WorkForce_Obj.src.CabHtmlTaskID = 8215249;	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html > Task_helperv2.html
			WorkForce_Obj.src.CabHtmlSP     = 9785882;	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html >  wf_prod_head.txt
		}

		WorkForce_Obj.userID 		= runtime.getCurrentUser().id;
		WorkForce_Obj.userName      = runtime.getCurrentUser().name;
		WorkForce_Obj.userRole 		= runtime.getCurrentUser().role;
		WorkForce_Obj.userDeptId	= runtime.getCurrentUser().department;
		WorkForce_Obj.userEmail		= runtime.getCurrentUser().email;
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
			'custrecord_wf_maintenance'
		];
		var xyz_rp, xyz_au, xyz_supm, xyz_suau, xyz_emb;
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

			//throw new Error('No WorkForce configuration record found.');

		} catch(e) {
			WorkForce_Obj.version = 'NaN';
		}

		rolesAsPM = (xyz_rp) ? xyz_rp : rolesAsPM;
		rolesAUDIT = (xyz_au) ? xyz_au : rolesAUDIT;
		SpecialUsersAsPM = (xyz_supm) ? xyz_supm : SpecialUsersAsPM;
		SpecialUsersAUDIT = (xyz_suau) ? xyz_suau : SpecialUsersAUDIT;

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
		var userId = runtime.getCurrentUser().id;
		var userName = runtime.getCurrentUser().name;
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
		}).defaultValue = "<h1>Maintenance</h1><p>WorkForce Management is in Maintenance, try later</p>";
		
		return form;
    }
	
	
	function DrawPage(context)
    {
		var userObj = runtime.getCurrentUser();

		WorkForce_Obj.userID = userObj.id;
		WorkForce_Obj.userRole = getRole(userObj.id);
		WorkForce_Obj.lang = getLanguage();

		var form = serverWidget.createForm({
			title: 'Workforce Management'
		});

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

		return form;
	}
	
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	if (context.request.method === 'GET')
    	{
			gocomm = context.request.parameters.gocomm;
			auditId = context.request.parameters.auditId;
			ReadWFConfiguration();
			
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
