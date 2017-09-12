/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @File SST_UE_Tasks.js
 * @Notes: Disable Remove on Notes Created by WorkForce Notes.
 */
define(['N/ui/serverWidget'],
/**
 * @param {serverWidget} serverWidget
 */
function(serverWidget) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
    	
    	overrideRemoveLinks(scriptContext);
    	
    }
    
    /**
	 * Change the behavior of remove link on electronic sublists
	 * @param  {context} context Netsuite context
	 */
	function overrideRemoveLinks(context){
		var jQueryField  = context.form.addField({id:'custpage_jquery', label:'jquery', type:'inlinehtml'});
		jQueryField.defaultValue = '\
<script>\
$(document).ready(function(){\
\
/* \
 * LeirAGS .. explain.. \
 * Each time user click on "User Notes" sub-subtab \
 * NetSuite load the content of sub-subtab \
 * Then we remove onclick event for remove or edit \
 * anchor links, before they used. \
 * --- Now based on content of table column 6 we can \
 * --- disable only for "WrokForce Note" value \
 * --- we limit anchor to "usernotes__tab" \
 */ \
$(document).on("click", "#usernotestxt", function(){\
		console.log("Click in user-notes-txt");\
		setTimeout(overrideLinks(\'Remove\',\'WorkForce Note\'), 500)\
	});\
\
});\
\
/* $(document).on("click", "#usernotes__tab tbody a", function(){\
	$(this).attr("href","#");\
	$(this).prop("href","#");\
	$(this).attr("onclick","");\
	$(this).prop("onclick","");\
	alert(\'Cannot edit user notes here, use WorkForce management\');\
}); */\
\
function overrideLinksTest(){\
	$("#usernotes__tab tbody a.dottedlink:contains(\'Edit\')").removeAttr("onclick").off().click(function(event){\
		event.preventDefault();\
	    var rowz = $(this).closest("td").closest("tr");\
		var td_7 = $(rowz).find("td:eq(7)").text();\
		var td_6 = $(rowz).find("td:eq(6)").text();\
		console.info("rowz",rowz);\
		console.info("td_6",td_6); /* This is the correct. TYPE column */\
		console.info("td_7",td_7);\
		alert("Cannot Edit "+td_7);\
	});\
}\
\
function overrideLinks(label,disable_on){ \
	/*console.info("label",label); \
	console.info("disable_on",disable_on);*/ \
	setTimeout(function(){ \
		$("#usernotes__tab tbody a:contains(\'"+label+"\')").map(function(){\
			var rowz = $(this).closest("td").closest("tr");\
			var td_6 = $(rowz).find("td:eq(6)").text();\
			if (td_6 == disable_on) {\
				/*console.info("rowz",rowz); \
				console.info("td_6",td_6);*/ \
				$(this).removeAttr("onclick")\
				.off()\
				.click(function(event){event.preventDefault();console.info("Option Disable by WorkForce.");});\
			}\
		});\
	}, 500);\
}\
</script>';
	}

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
    	
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
