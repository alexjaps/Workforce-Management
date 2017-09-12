/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/format', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'],
/**
 * @param {file} file
 * @param {format} format
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(file, format, record, runtime, search, serverWidget) {
   
	var WorkForce_Obj = {
			Env:'Undefined',
			src:{ CabHtmlTaskID:0, CabHtmlSP:0, CabJSLangEnID:0, CabJSLangSpID:0, hideNavBar: true },
			userID:0,
			userName:'',
			userRole:0,
			userDeptId:0,
			userEmail:'',
			lang:'en',
			uiType:'MOBILE',
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
		
		var userObj = runtime.getCurrentUser();
		
		var language = '';

		function setupEnvironmentWorkForce(){
			
			WorkForce_Obj.Env = runtime.envType;
			
			WorkForce_Obj.src.CabIndex  	= '6572316'; // './WF_mobile_index.html'; 	//= SuiteScripts > TTOpMgmt_ProjectAdmin > WF_mobile > WF_mobile_index.html
			WorkForce_Obj.src.CabIncludesHd = '6572419'; // 'lib/wf_mobile_inc_'+( (WorkForce_Obj.Env=='SANDBOX')? 'sbox':'prod')+'.txt';	//= SuiteScripts > TTOpMgmt_ProjectAdmin > WF_mobile > lib > wf_mobile_core.js
			WorkForce_Obj.src.CabIncludesFt = '6572842'; // wf_mobile_inc_ft_sbox.txt /core/media/media.nl?id=6572842&c=3461650&h=42ddfc4ba0ae92832eeb&_xt=.txt

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

		}

		function getHTML_WorkForce(){
			var main_file = file.load(WorkForce_Obj.src.CabIndex).getContents();
			
			var mark_insert_hd = '<!-- SANDBOX_MARK_PRODUCTION -->';
			var includes_files_hd = file.load(WorkForce_Obj.src.CabIncludesHd).getContents();
			
			var mark_insert_ft = '<!-- SANDBOX_MARK_FOOTER_PRODUCTION -->';
			var includes_files_ft = file.load(WorkForce_Obj.src.CabIncludesFt).getContents();
			
			var mark_wf_obj = 'var WorkForce_Obj = {};';
			main_file = main_file.replace(mark_wf_obj, 'const WorkForce_Obj = '+JSON.stringify(WorkForce_Obj)+';' );
			
			var mark_wf_team = 'var WorkForce_MyTeam = {};';
			main_file = main_file.replace(mark_wf_team, 'const WorkForce_MyTeam = '+JSON.stringify(myTeamIds)+';' );
			
			var mark_employeesobj = "var employeesobj = [{'employeeId':0, 'employeeName':'none', 'deptId':0, 'deptName':'none'}];";
			main_file = main_file.replace(mark_employeesobj, 'var employeesobj = '+AssignedJSON()+';' );
			
			var mark_employeesobj_inactive = "var employeesobj_inactive = [{'employeeId':0, 'employeeName':'none', 'deptId':0, 'deptName':'none'}];";
			main_file = main_file.replace(mark_employeesobj_inactive, 'var employeesobj_inactive = '+AssignedJSONInactive()+';' );
			
			/* lib/wf_mobile_core_sbox.js */
			var corejs = {
					SANDBOX		: "/core/media/media.nl?id=6572421&c=3461650&h=2731fb7731021422b816&_xt=.js",
					PRODUCTION	: "/core/media/media.nl?id=6572421&c=3461650&h=2731fb7731021422b816&_xt=.js"
				}
			var mark_wf_core = "{{WorkForce-Core-JS}}";
			
			main_file = main_file.replace(mark_wf_core, corejs[WorkForce_Obj.Env] );
			main_file = main_file.replace(mark_insert_hd, includes_files_hd);
			main_file = main_file.replace(mark_insert_ft, includes_files_ft);
			
			return main_file;
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
			if (language) return language;
			language = userObj.getPreference('language').split('_')[0];
			return language;
		}
		
		function DrawMobilPage(context)
	    {

			WorkForce_Obj.userID = userObj.id;
			WorkForce_Obj.userRole = userObj.role;
			WorkForce_Obj.lang = getLanguage();

			var form = serverWidget.createForm({
				title: 'Workforce Management',
				hideNavBar: WorkForce_Obj.src.hideNavBar
			});

	      //TO GET MY TEAM LIST IN SELECT
			form.addField({
				id : 'custpage_selectmyteam',
				type : serverWidget.FieldType.LONGTEXT,
				label : 'XCH Shows my team in Select'
			}).updateDisplayType({
				displayType:serverWidget.FieldDisplayType.HIDDEN
			}).defaultValue = getMyTeam();

	     // TO GET THE MAIN HTML CONTENT OF TASKINATOR
			form.addField({
				id: 'taskinatormobilhtmlform',
				type: serverWidget.FieldType.INLINEHTML,
				label:  'Taskinator Mobil',
			}).updateDisplaySize({
				height: 60,
				width: 100
			}).defaultValue = getHTML_WorkForce();

			return form;
		}
		
		function DrawPageMaintenance(context)
	    {
			
			var form = serverWidget.createForm({
				title: 'Workforce Management'
			});
			
			form.addField({
				id: 'taskinatormobilhtmlform',
				type: serverWidget.FieldType.INLINEHTML,
				label:  'Taskinator Mobil',
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
     * @Since 2015.2
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
				form = DrawMobilPage(context);
			}
			
			form.Title = 'Taskinator Mobil Workspace';
			context.response.writePage(form);
		}
    	
    	if (context.request.method === 'POST')
    	{
    		//None...
		}
    }

    return {
        onRequest: onRequest
    };
    
});
