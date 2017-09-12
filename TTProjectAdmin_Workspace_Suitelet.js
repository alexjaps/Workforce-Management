/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
// SUITELET related to CLIENT SCRIPT ID: 6512313 
// Purpose: The form will filter the working areas where the user has access/privileges 
// SS Developer: Jesus Camarillo
// Path: SuiteScripts > TTOpMgmt_ProjectAdmin

define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/runtime', 'N/file'],

function(serverWidget, search, record, runtime, file) { 
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
	
	/* Following classes taken form automatic generator */
	function Employee(){
		this.department;  // SELECT TYPE 

		this.load = function(id){
			var recObj = record.load({type: "employee", id: id });
			this.department = recObj.getValue("department");
			return recObj;
		}
		this.save = function(){
			var recObj = record.create({type: "employee", isDynamic: true});
			recObj.setValue({ fieldId: "department", value: this.department});
			var recordId = recObj.save({ enableSourcing: true, ignoreMandatoryFields: false });
			return recordId;
		}
	}

	function EmployeeManager(){
		this.getList = function(filter){
			var mySearch = search.create({
				type: "employee",
				columns: ['department'],
				filters: filter
			});
			var arrayObj=[];var cont=0;
			mySearch.run().each(function(result) {
				arrayObj[cont]=new Employee();
				arrayObj[cont].department = result.getValue("department");
				cont++;
				return true;
			});
			return arrayObj;
		}
	}
	
	function Department(){
		this.id;
		this.name;  // TEXT TYPE  *MANDATORY* 

		this.load = function(id){
			var recObj = record.load({type: "department", id: id });
			this.id = recObj.getValue("id");
			this.name = recObj.getText("name");
			return recObj;
		}
		this.save = function(){
			var recObj = record.create({type: "department", isDynamic: true});
			recObj.setText({ fieldId: "name", value: this.name});
			var recordId = recObj.save({ enableSourcing: true, ignoreMandatoryFields: false });
			return recordId;
		}
	}

	function DepartmentManager(){
		this.getList = function(filter){
			var mySearch = search.create({
				type: "department",
				columns: ['name'],
				filters: filter
			});
			var arrayObj=[];var cont=0;
			mySearch.run().each(function(result) {
				arrayObj[cont]=new Department();
				arrayObj[cont].name = result.getText("name");
				cont++;
				return true;
			});
			return arrayObj;
		}
	}
	
	/* End of generated classes. */
	
	/* Function to know current user's rol */

	function findCurrentRol(theuserID, userrole) {		  
		var mySearch = search.create({
	        type: 'employee',
	        columns: ['internalId', 'role'],
	        filters:[
	            ['internalId', 'is', theuserID ] 
	        ]
	    });
		var CurrentRol;
		mySearch.run().each(function(result) {
	    	var rol_id   = result.getValue('role');
	        var rol_name = result.getText('role');	        
	        // myString = myString + ('# Rol: ' + rol_id + '  | Asignado: ' + rol_name + ' :: '); 
	        if (userrole==rol_id) { CurrentRol = rol_name; }	        
	        return true;
	    });
        return CurrentRol;
	}
	
	function findRoles(theuserID, userrole) {		  
		var mySearch = search.create({
	        type: 'employee',
	        columns: ['internalId', 'role'],
	        filters:[
	            ['internalId', 'is', theuserID ] 
	        ]
	    });
		var isThereRoles = 0;
		var selectRole = ' <label><select name="selectRoles" id="selectRoles" class="roles">' +
            '<option>-Roles-</option>';
		mySearch.run().each(function(result) {
	    	var rol_id   = result.getValue('role');
	        var rol_name = result.getText('role');
	        
	        selectRole = selectRole + '<option value=' + rol_id + '>' + rol_name + '</option>';
	            
	        //myString = myString+ ('# Rol: ' + rol_id + '  | Asignado: ' + rol_name + ' :: ');
	        isThereRoles++;
	        	        
	        return true;
	    });
		selectRole = selectRole + '</select></label>';
		if (isThereRoles==0) { selectRole = 'norolesfound'; }		
		return selectRole;
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
	
	function findTeam(theuserID) {
		var employeeId=theuserID; // <-- needs a supervisor user
		var mySearch = search.create({
			type: 'employee',
			columns: ['internalId','supervisor','firstname', 'lastname', 'title'], 
			filters:[
			['isinactive','is', false],
				'and', ['supervisor', 'is', theuserID]
			]
		});
		var isThereRoles=0;
		var employees=[]; var cont=0;		
		var selectTeam = ' <label><select name="selectTeam" id="selectTeam" class="teams">' +
            '<option>-Team-</option>';
		mySearch.run().each(function(result) {
			var employeeId   = result.getValue('internalId');
			var nombre   = result.getValue('firstname');
			var apellido = result.getValue('lastname');
			var title = result.getValue('title');
			employees[cont]=employeeId;
	        
			selectTeam = selectTeam + '<option value=' + employeeId + '>' + nombre + ' ' + apellido + '</option>';
	            
	        //myString = myString+ ('# Rol: ' + rol_id + '  | Asignado: ' + rol_name + ' :: ');
	        isThereRoles++;
	        	        
	        return true;
	    });
		selectTeam = selectTeam + '</select></label>';
		if (isThereRoles==0) { selectTeam = 'Has no team'; }		
		return selectTeam;
	} 
   
	/* End of function to know current user's rol */
    function onRequest(context) {
    	if (context.request.method === 'GET') 
    	{     
			form = DrawPage(context);
			form.Title = 'Taskinator Workspace';
			
			//if(runtime.getCurrentUser().id==PutNumberHere)
			// Folder as container is SuiteScripts > SST_NearNet_Building_List
			form.clientScriptFileId = 6512313; 
			//else
			//	form.clientScriptFileId = AnytherIDHere;			
    		context.response.writePage(form);	
        }
    }
    
    function DrawPage(context)
    {
        var form = serverWidget.createForm({
            title: 'Proceso de KPIs Operacionales | Taskinator'
        });        
        var userObj = runtime.getCurrentUser();        
        var userRole = runtime.getCurrentUser().role;          
        var userDepto = runtime.getCurrentUser().department;
      
    
        /************************************************************************************/
        //    Some things to get it better in visuals
        /************************************************************************************/
        
     // We add the correspondent values in the span ID's 
        var grape_01_crunch = '<table style="width:100%; display: none;"><tr><td>' +
		  '<p style="clear: both;"><hr/>' +	
		  '<p class="myLoading" style="color: black; text-align:center;">Loading...</p>' +
		  '<div class="arrow" style="display:none;">' + 
		  '<span class="showrolesspan">Your active rol: </span><span id="userIDrol">' + 
		  findCurrentRol(userObj.id, userRole) + '</span>' +
		  '<span class="showrolesspan">ID: </span><span id="userID">' + userObj.id + '</span>' +
		  '<span class="showrolesspan">Name: </span><span id="userIDname">' + userObj.name + '</span>' +
		  '<span class="showrolesspan">E-mail: </span><span id="userIDemail">' + userObj.email + '</span>' +		  
		  '<span class="showrolesspan">Department: </span><span id="userIDdepto">' + userDepto + '</span>' +
		  '<span class="showrolesspan">Other roles: </span><span id="userIDmroles">' + 
		  findRoles(userObj.id, userRole) + '</span>' + 
		  '<span class="showrolesspan">Job Title: </span><span id="userIDjobtitle">' + userJobTitle(userObj.id) + '</span>' +
		  // '<span class="showrolesspan">Location: </span><span id="userIDlocation">' + userObj.location + '</span>' +
		  '</div>' + 	
		  '</p><hr/>' +
		  '</td></tr></table>';
        
        var grapes_01 = form.addField({
            id: 'wks_layout_grapes_01',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Wks Layout Grapes 01',
        });        
        grapes_01.updateBreakType({
        	breakType : serverWidget.FieldBreakType.STARTCOL
        	});
        grapes_01.defaultValue = grape_01_crunch;        
        grapes_01.updateDisplaySize({
            height: 60,
            width: 100
        });

    	var employee = new Employee();
    	employee.load(userObj.id);
    	var depId = employee.department
    	var department = new Department();
    	department.load(depId)
			
                
        /* We create some extra controls in order to exchange data between this Suitelet and the form loaded */
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
        // TO GET USER'S NAME        
        var xch_userIDname = form.addField({
            id : 'custpage_useridname',
            type : serverWidget.FieldType.TEXT,
            label : 'XCH User ID name'
        });
        
        xch_userIDname.defaultValue = userObj.name; 

        
        xch_userIDname.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});
        //TO GET USER'S ROLE
        var xch_userIDrole = form.addField({
            id : 'custpage_useridrole',
            type : serverWidget.FieldType.TEXT,
            label : 'XCH User ID role'
        });
        
        xch_userIDrole.defaultValue = findCurrentRol(userObj.id, userRole); 
        
        xch_userIDrole.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});
     // TO GET USER'S E-MAIL        
        var xch_userIDemail = form.addField({
            id : 'custpage_useridemail',
            type : serverWidget.FieldType.TEXT,
            label : 'XCH User ID email'
        });
        
        xch_userIDemail.defaultValue = userObj.email;

        
        xch_userIDemail.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	}); 
        //TO GET USER'S DEPARTMENT
        var xch_userIDdepto = form.addField({
            id : 'custpage_useriddepto',
            type : serverWidget.FieldType.TEXT,
            label : 'XCH User ID depto'
        });
        
        xch_userIDdepto.defaultValue = department.name; 

        
        xch_userIDdepto.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});        
        //TO GET USER'S OTHER ROLE(S)
        var xch_userIDotherroles = form.addField({
            id : 'custpage_useridotherroles',
            type : serverWidget.FieldType.LONGTEXT,
            label : 'XCH User ID Other Roles'
        });
        
        xch_userIDotherroles.defaultValue = findRoles(userObj.id, userRole); 

        
        xch_userIDotherroles.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});         
        
        // TO GET USER'S JOB TITLE        
        var xch_userIDjobtitle = form.addField({
            id : 'custpage_useridjobtitle',
            type : serverWidget.FieldType.TEXT,
            label : 'XCH User ID Job Title'
        });
        
        xch_userIDjobtitle.defaultValue = userJobTitle(userObj.id);

        
        xch_userIDjobtitle.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});
        
        //TO GET USER'S TEAM IF AVAILABLE
        var xch_userIDTeam = form.addField({
            id : 'custpage_useridteam',
            type : serverWidget.FieldType.TEXT,
            label : 'XCH User ID Team'
        });
        
        xch_userIDTeam.defaultValue = findTeam(userObj.id); 

        
        xch_userIDTeam.updateDisplayType({
        	displayType:serverWidget.FieldDisplayType.HIDDEN
    	});   
        
        
        /* We get some details of the user in order to display the information */
        
        
        
        
        
//      form.addButton({
//           	id: 'custpage_user_rol_btn',
//           	label: 'User Role is: '+ userRole
//    	});
//        
//        form.addButton({
//           	id: 'custpage_user_depto_btn',
//           	label: 'User depto is: '+ userDepto
//    	});
        
        /************************************************************************************/
        //    Loads dashboard form - Original
        /************************************************************************************/
        
//        var inlinehtml = form.addField({
//            id: 'buildingwkspace',
//            type: serverWidget.FieldType.INLINEHTML,
//            label: 'Workspace',
//        });
//        
//        inlinehtml.updateDisplaySize({
//            height: 60,
//            width: 100
//        });
//        
//        inlinehtml.defaultValue = file.load(6507106).getContents();
        
        
        /************************************************************************************/
        //    Loads dashboard SB Admin based
        /************************************************************************************/
        
        var taskinator_inlinehtml = form.addField({
            id: 'taskinatorhtmlform',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'taskinatorhtmlform',
        });
        
        taskinator_inlinehtml.updateDisplaySize({
            height: 60,
            width: 100
        });
        
        taskinator_inlinehtml.defaultValue = file.load(6512413).getContents();
        
//        var getAddressID = form.addField({
//            id: 'getaddress_id',
//            type: serverWidget.FieldType.TEXT,
//            label: 'Get Address',
//        });
//        
//        form.addSubmitButton({
//        	label: 'Lookup',
//        });
//        
//        form.addSubmitButton('Send Email');
    	
        
        
        	
        return form;
    }
    

    return {
        onRequest: onRequest
    };
    
});
