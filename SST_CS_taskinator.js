/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search'],

function(search) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
	
    function pageInit(scriptContext) {
    	// Sets the mouse pointer to be a hand icon when hovering
    	jQuery('table#salesorder tr[data-id]').css('cursor', 'pointer');
    	// Animates the USER bar
    	jQuery('div.arrow').fadeIn(3000);
    	jQuery('.myLoading').hide();
    	jQuery('table#salesorder tr[data-id]').click(function() {
    		jQuery('.hotTitles-grey').show();
    		jQuery('div.row').show('slow');
    	});
    	
    	
    	 /**********Codigo Nuevo*************/
    	var newID = jQuery('input#custpage_userid').val();
    	// my ID: 75408
    	//var newID = 12140;
		var employeeId = newID; // <-- current user id
		newID = Math.round(newID);
		console.log('The ID: ' + newID);
//		var mySearch = search.create({
//            type: 'task',
//            columns: ['internalid', 'title', 'status','custevent_kpi_sales_order', 'custevent_kpi_startdate', 'custevent_kpi_duedate'], 
//            filters:[
//				['assigned', 'is', employeeId],
//				//'and', ['status', 'is', 'NOTSTART'], 
//				//'and', ['startdate', 'greaterthanorequalto', '23/5/2016']
//				'and', ['status', 'is', 'PROGRESS']
//				//SO ID: 329071 Task ID: 202995 Task Title: SO-1-1867 - Bestel McAllen - Tr�mite CUS Task Status: NOTSTART Task SD: 23/5/2016 Task ED: 10/6/2016 
//			]
//        });
//		
//		var tasks=[]; var cont=0;
//        mySearch.run().each(function(result) {        	
//        	var taskid = result.getValue('internalid');
//        	var tasktitle = result.getValue('title');
//        	var taskstatus = result.getValue('status');
//        	var salesorderid = result.getValue('custevent_kpi_sales_order');
//        	var taskStartDate = result.getValue('custevent_kpi_startdate');
//        	var taskDueDate   = result.getValue('custevent_kpi_duedate');
//        	tasks[cont]=salesorderid;
//        	console.log('SO ID: ' + salesorderid + ' Task ID: ' + taskid + ' Task Title: ' + tasktitle + ' Task Status: ' + taskstatus + ' Task SD: ' + taskStartDate + ' Task ED: ' + taskDueDate);
//        	cont++;
//        	return true;
//        });
//                
//        tasks.forEach(function(element, index) {
//            var mySearch = search.create({
//                type: 'salesorder',
//                columns: ['title','status'], 
//                filters:[
//    				['internalId', 'is', element]
//    			]
//            });
//            mySearch.run().each(function(result) {
//            	var title = result.getValue('title');
//            	var status = result.getValue('status');
//            	console.log('title: '+ title + 'status: ' + status);
//            	return true;
//            });
//		});		
//		/**********Codigo Nuevo*************/
    	
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {
    	return true;
    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
    	return true;
    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {
    	return true;
    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {
    	return true;
    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	return true;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        lineInit: lineInit,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
