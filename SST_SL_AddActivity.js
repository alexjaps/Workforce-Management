/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/runtime', 'N/file', 'N/format'],

function (serverWidget, search, record, runtime, file, format){
	
	var WorkForce_AddAct = {
			Env:'Undefined',
			CabHtmlAddID:0,
			CabHtmlSP:0,
			userID:0,
			userName:'',
			userRole:0,
			userDeptId:0,
			lang:'en',
			uiType:'OLD'
		};
	
	// Setup WorkForce workspace
	function setupEnvironmentWorkForce(){
		WorkForce_AddAct.Env = runtime.envType;
		if (WorkForce_AddAct.Env == 'SANDBOX') {
			WorkForce_AddAct.CabHtmlAddID = 6567398; 	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html > Add_Activity_Helper.html
			WorkForce_AddAct.CabHtmlSP    = 6567400;	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html > wf_snbx_head_a.txt
		} else {
			WorkForce_AddAct.CabHtmlAddID = 9043026;	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html > Add_Activity_Helper.html
			WorkForce_AddAct.CabHtmlSP    = 10005992;	//= SuiteScripts > TTOpMgmt_ProjectAdmin > html > wf_prod_head_a.txt
		}
		WorkForce_AddAct.userID 	= runtime.getCurrentUser().id;
		WorkForce_AddAct.userName   = runtime.getCurrentUser().name;
		WorkForce_AddAct.userRole 	= runtime.getCurrentUser().role;
		WorkForce_AddAct.userDeptId	= runtime.getCurrentUser().department;
		WorkForce_AddAct.lang 		= getLanguage();
	}
	
	function getHTML_WorkForce(){
		var mark_insert = '<!-- SANDBOX_MARK_PRODUCTION -->';
		var main_file = file.load(WorkForce_AddAct.CabHtmlAddID).getContents();
		var snbx_prod_file = file.load(WorkForce_AddAct.CabHtmlSP).getContents();
		var mark_wf_obj = 'var WorkForce_AddAct = {};';
		main_file = main_file.replace(mark_wf_obj, 'const WorkForce_AddAct = '+JSON.stringify(WorkForce_AddAct)+';' );
		return main_file.replace(mark_insert, snbx_prod_file);
	}
	
    // Get prefered language of user
	function getLanguage(){
		language = runtime.getCurrentUser().getPreference('language').split('_')[0];
		return language;
	}
	
	 function AssignedJSON() {

	        var SortName = search.createColumn({name: 'entityid', sort: 'ASC'});

	          var mySearch = search.create({
	                type: 'employee',
	                columns: ['internalId', 'firstname', 'lastname', 'title', 
	                	'isinactive','custentity_wrike_contact_id',
	                	SortName,'subsidiary','department'],
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
	                var deptName  	   = result.getText('department');

	            employeeFull = String(employeeFull).split(" ");
	              var l = employeeFull.length;
	            var employeeCompleteName = employeeFull[0] + " " +employeeFull[1] +" "+(employeeFull[2]==undefined? "" : employeeFull[2]) ;
	                if(subsidiaryId== 2 || subsidiaryId == 3)
	                  if(wrikeID != "")
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

//--------
	// Create form
	function DrawPage(context)
  {
	  var userObj = runtime.getCurrentUser();
    var form = serverWidget.createForm({
        title: ' ',
        hideNavBar : true
    });

		// TO GET THE MAIN HTML CONTENT OF TASKINATOR
    var addActivityHtml = form.addField({
        id: 'addactivityhtml',
        type: serverWidget.FieldType.INLINEHTML,
        label:  "activity",
    });

    addActivityHtml.updateDisplaySize({
        height: 60,
        width: 100
    });

    // Link to the file named Add_Activity_Helper.html
    //--- addActivityHtml.defaultValue = file.load(WorkForce_AddAct.CabHtmlAddID).getContents();
    addActivityHtml.defaultValue = getHTML_WorkForce();

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
    
  //--------------------------------------
    form.addField({
        id : 'custpage_employeesobj',
        type : serverWidget.FieldType.LONGTEXT,
        label : 'XCH Shows Employees object'
    }).updateDisplayType({
    	displayType:serverWidget.FieldDisplayType.HIDDEN
	}).defaultValue = AssignedJSON();
    //-- 


    // TO GET SALES ORDER ID
    var contextSalesOrder = form.addField({
        id : 'custpage_contextsales',
        type : serverWidget.FieldType.INLINEHTML,
        label : 'XCH SO ID'
    });

    contextSalesOrder.defaultValue = context.request.parameters.SalesOrder;

    contextSalesOrder.updateDisplayType({
    	displayType:serverWidget.FieldDisplayType.HIDDEN
    });
    
    // TO GET TASKID
    var contextTaskId = form.addField({
        id : 'custpage_contexttaskid',
        type : serverWidget.FieldType.INLINEHTML,
        label : 'XCH TASK ID'
    }).updateDisplayType({
    	displayType:serverWidget.FieldDisplayType.HIDDEN
    }).defaultValue = context.request.parameters.taskId;

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
   		setupEnvironmentWorkForce();
   		form = DrawPage(context);
   		//  form.Title = '';
   		context.response.writePage(form);
    }
  }
  

    return {
        onRequest: onRequest
    };

});