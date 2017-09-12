/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/file', 'N/runtime', 'N/search', 'N/url'],
/**
 * @param {serverWidget} serverWidget
 * @param {file} file
 * @param {runtime} runtime
 * @param {search} search
 * @param {url} url
 */
function(serverWidget, file, runtime, search, url) {
	var WorkForce_ProMailer = {
			Env:'Undefined',
			CabHtmlIndexID:0,
			CabHtmlSP:0,
			userID:0,
			userName:'',
			userRole:0,
			userDeptId:0,
			lang:'en',
			uiType:'NEW'
		};
	
	// Setup WorkForce workspace
	function setupEnvironmentWorkForce(){
		WorkForce_ProMailer.Env = runtime.envType;
		if (WorkForce_ProMailer.Env == 'SANDBOX') {
			WorkForce_ProMailer.CabHtmlIndexID = 6575372; 	//= SuiteScripts > TTOpMgmt_ProjectAdmin > WF_pro_mailer > wfpm_index.html
			WorkForce_ProMailer.CabHtmlSP    = 6567400;		//= SuiteScripts > TTOpMgmt_ProjectAdmin > WF_pro_mailer > wfpm_snbx_head.txt
		} else {
			WorkForce_ProMailer.CabHtmlIndexID = 9043026;		//= SuiteScripts > TTOpMgmt_ProjectAdmin > WF_pro_mailer > wfpm_index.html
			WorkForce_ProMailer.CabHtmlSP    = 10005992;	//= SuiteScripts > TTOpMgmt_ProjectAdmin > WF_pro_mailer > wfpm_prod_head_m.txt
		}
		WorkForce_ProMailer.userID		= runtime.getCurrentUser().id;
		WorkForce_ProMailer.userName	= runtime.getCurrentUser().name;
		WorkForce_ProMailer.userRole 	= runtime.getCurrentUser().role;
		WorkForce_ProMailer.userDeptId	= runtime.getCurrentUser().department;
		WorkForce_ProMailer.lang		= 'english';
	}
	
	function getHTML_WorkForce(){
		var mark_insert = '<!-- SANDBOX_MARK_PRODUCTION -->';
		var main_file = file.load(WorkForce_ProMailer.CabHtmlIndexID).getContents();
		var snbx_prod_file = file.load(WorkForce_ProMailer.CabHtmlSP).getContents();
		var mark_wf_obj = 'var WorkForce_ProMailer = {};';
		main_file = main_file.replace(mark_wf_obj, 'const WorkForce_ProMailer = '+JSON.stringify(WorkForce_ProMailer)+';' );
		return main_file.replace(mark_insert, snbx_prod_file);
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
    	var form = serverWidget.createForm({
            title: ' ',
            hideNavBar : true
        });
    	
    	// TO GET THE MAIN HTML CONTENT OF TASKINATOR
        var ProMailerHtml = form.addField({
            id: 'promailerhtml',
            type: serverWidget.FieldType.INLINEHTML,
            label:  "ProMailerHtml",
        });

        ProMailerHtml.updateDisplaySize({
            height: 60,
            width: 100
        });

        // Link to the file named Add_Activity_Helper.html
        //--- addActivityHtml.defaultValue = file.load(WorkForce_AddAct.CabHtmlAddID).getContents();
        ProMailerHtml.defaultValue = getHTML_WorkForce();
        
        return form;
    }

    return {
        onRequest: onRequest
    };
    
});
