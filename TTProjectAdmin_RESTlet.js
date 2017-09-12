/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 * 
 * /app/site/hosting/restlet.nl?script=957&deploy=1
 */
define(['N/format', 'N/log', 'N/email', 'N/error', 'N/record', 'N/search', 'N/task', 'N/transaction'],
/**
 * @param {email} email
 * @param {error} error
 * @param {record} record
 * @param {search} search
 * @param {task} task
 * @param {transaction} transaction
 */
function TT_projectAdministration(format, log, email, error, record, search, task, transaction) {
   
	var module = {
		'actions': {}
	};
	
	module.actions['getActiveSalesOrder'] = function(requestParams){
					
		var arrSearch,
			arrSearchFilters=[],
			arrSearchColumns=[],
			arrSearchResults,
			results =[],
			i,
			x;
		
		arrSearchFilters.push(search.createFilter({
			name: 'custbody_est_ovta',
			operator: search.Operator.ANYOF,
			values: ['6']
		}));
		
		arrSearchColumns.push(search.createColumn({
			name: 'tranid'
		}));
		
		arrSearch = search.create({
			type: 'salesorder',		
			//filters: arrSearchFilters,
			filters: [
			   ['custbody_est_ovta', search.Operator.ANYOF, ['6']], // This is the status of the sale order FROM ordersales
			   'and', ['entity', search.Operator.ANYOF, ['4097']], // In progress
			   'and', ['mainline', search.Operator.IS, 'T']
			   ],
			//columns: arrSearchColumns
			columns:['internalid', 'tranid', 'entity', 'custbody_vtas_condcom', 'custbody_project_manager', 'salesrep']
		});
						
		arrSearch.run().each(function(result){
			
			results.push({
				//'id': result.getId(),
				'id': result.getValue({name: 'internalid'}),
				'tranid': result.getValue({name: 'tranid'}),
				'entity': result.getText({name: 'entity'}),
				'description': result.getValue({name: 'custbody_vtas_condcom'}),
				'projectManager': result.getText({name: 'custbody_project_manager'}),
				'salesRep': result.getText({name: 'salesrep'}),
					
			});
			return true;
		});
	
		
		return JSON.stringify(results);
			
	};
	
	module.actions['getPendingAck'] = function(requestParams){
		
		var arrSearch,
			count = 0;
		
		arrSearch = search.create({
			type: 'task',
			filters: [
			   ['assigned', search.Operator.ANYOF, [requestParams['user']]],
			   'and',['custevent_kpi_ack', search.Operator.IS, 'F']],
			//columns: arrSearchColumns
			columns: ['internalid']
		});
		
		arrSearch.run().each(function(result){
			count++;
			return true;
		});
		
		return JSON.stringify({'count': count});
	};
	/*
	 * 
	 */
	module.actions['getNewTasks'] = function(requestParams){
		// These tasks will be the ones that the Created Date is today and that are not completed.
		var arrSearch,		
			arrSearchFilters=[],
			today,
			count = 0;

		today = format.format({
			value: new Date(),
			type: format.Type.DATE
		});
	
		arrSearchFilters.push(search.createFilter({
			name: 'assigned',
			operator: search.Operator.ANYOF,
			values: [requestParams['user']]
		}));
		
		arrSearchFilters.push(search.createFilter({
			name: 'createddate',
			operator: search.Operator.ON,
			values: [today]
		}));
		
		arrSearchFilters.push(search.createFilter({
			name: 'status',
			operator: search.Operator.NONEOF,
			values: ['COMPLETED']
		}));
			
		arrSearch = search.create({
			type: 'task',
			filters: arrSearchFilters,
			columns: ['internalid', 'title']
		});
		
		arrSearch.run().each(function(result){
			count++;
			return true;
		});
		
		return JSON.stringify({'count': count});
	};
	/*
	 * 
	 */
	module.actions['getTodayTasks'] = function(requestParams){
		
		var arrSearch,		
		arrSearchFilters=[],
		today,
		count = 0;

		today = format.format({
			value: new Date(),
			type: format.Type.DATE
		});		
		
		arrSearchFilters.push(search.createFilter({
			name: 'assigned',
			operator: search.Operator.ANYOF,
			values: [requestParams['user']]
		}));
		
		arrSearchFilters.push(search.createFilter({
			name: 'startdate',
			operator: search.Operator.ONORBEFORE,
			values: [today]
		}));

		arrSearchFilters.push(search.createFilter({
			name: 'enddate',
			operator: search.Operator.ONORAFTER,
			values: [today]
		}));
		
		
		arrSearchFilters.push(search.createFilter({
			name: 'status',
			operator: search.Operator.NONEOF,
			values: ['COMPLETED']
		}));
			
		arrSearch = search.create({
			type: 'task',
			filters: arrSearchFilters,
			columns: ['internalid', 'title']
		});
		
		arrSearch.run().each(function(result){
			count++;
			return true;
		});
		
		return JSON.stringify({'count': count});
	};
	/*
	 * 
	 */
	module.actions['getOverdueTasks'] = function(requestParams){
		
		var arrSearch,		
		arrSearchFilters=[],
		today,
		count = 0;

		today = format.format({
			value: new Date(),
			type: format.Type.DATE
		});
	
		arrSearchFilters.push(search.createFilter({
			name: 'assigned',
			operator: search.Operator.ANYOF,
			values: [requestParams['user']]
		}));
		
		arrSearchFilters.push(search.createFilter({
			name: 'createddate',
			operator: search.Operator.ON,
			values: [today]
			//operator: search.Operator.BEFORE,
			//values: [today], ['enddate']]
		}));
		
		arrSearchFilters.push(search.createFilter({
			name: 'status',
			operator: search.Operator.NONEOF,
			values: ['COMPLETED']
		}));
			
		arrSearch = search.create({
			type: 'task',
			filters: arrSearchFilters,
			columns: ['internalid', 'title']
		});
		
		arrSearch.run().each(function(result){
			count++;
			return true;
		});
		
		return JSON.stringify({'count': count});
	};
	/*
	 * 
	 */

	module.actions['getServiceAddresses'] = function(params){
		
		var sales_order,
			addresses=[],
			service_addresses=[],
			address_a,
			address_z,
			i,
			x;
		
		sales_order = record.load({
			type: 'salesorder',
			id: params['so']
		});
		
		for(i=0, x = sales_order.getLineCount({sublistId:'item'}); i < x; i +=1){
			address_a = sales_order.getSublistValue({
				sublistId: 'item',
				fieldId: 'custcol_location_a_c',
				line: i
			});			
			
			address_z = sales_order.getSublistValue({
				sublistId: 'item',
				fieldId: 'custcol_address_a_z',
				line: i
			});
			
			if(addresses.indexOf(address_a) === -1 && address_a){
				addresses.push(address_a);
			}
			
			if(addresses.indexOf(address_z) === -1 && address_z){
				addresses.push(address_z);
			}
		}
		
		addresses.forEach(function(address){
			address_detail = search.lookupFields({
				type: 'customrecord_service_address_entity',
				id : address,
				columns : ['name', 
				    'custrecord_sac_service_address.custrecord_address1',
				    'custrecord_sac_service_address.custrecord_city',
				    'custrecord_sac_service_address.custrecord_address_tt_pop']
			});
			
			service_addresses.push({
				'id': address,
				'name': address_detail['name'],
				'address': address_detail['custrecord_sac_service_address.custrecord_address1'],
				'city': address_detail['custrecord_sac_service_address.custrecord_city'][0]['text'],
			});
		});
		
		return JSON.stringify(service_addresses);
		
	};
	
	/*
	 * 
	 */
	module.actions['getServiceItems'] = function(params){
		
		var sales_order,
			items=[],
			i,
			x;
		
		sales_order = record.load({
			type: 'salesorder',
			id: params['so']
		});
		
		for(i=0, x = sales_order.getLineCount({sublistId:'item'}); i < x; i +=1){
			
			items.push({
				id: sales_order.getSublistValue({
						sublistId: 'item',
						fieldId: 'item',
						line: i
					}),
				name: sales_order.getSublistValue({
					sublistId: 'item',
					fieldId: 'description',
					line: i
				}),
				capacity: sales_order.getSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_ov_capacidad',
					line: i
				}),
				uom: sales_order.getSublistText({
					sublistId: 'item',
					fieldId: 'custcol_ov_unidadmedida',
					line: i
				}),
				locationa: sales_order.getSublistText({
					sublistId: 'item',
					fieldId: 'custcol_location_a_c',
					line: i
				}) || "" ,				
				locationz: sales_order.getSublistText({
					sublistId: 'item',
					fieldId: 'custcol_address_z_c',
					line: i
				}) || "",

				
			});		
		}
			
		return JSON.stringify(items);
		
	};
	
	/*
	 * 
	 */
	module.actions['getTasks'] = function(params){
		
		var arrSearch,		
			arrSearchFilters=[],
			columns=[],
			tasks={'planning':[],'address':{},'service':{}},
			curAddress,
			curItem;
		var statusOptions=[];
		var SelectStatusTask = '<select id="idStatusTask">';

		today = format.format({
			value: new Date(),
			type: format.Type.DATE
		});
		
		//search for get status options 
		
		var statussearch = search.create ({
			type :'customlist_kpi_task_status',
			columns :['internalid','name']
		});
		
		function createpicker (date){
			var string = '<input type="text" class="datepicker" value="'+date+'">';
			return string;
		}
		
		function stringselect (statu,statussearch){
			var string = '<select id="idStatusTask">';
			statussearch.run().each(function(result){
				if(statu == result.getValue('name')){
					//string = string + '<option value="'+result.getValue('id')+'" select > Hola Select </option>';
					string = string + '<option value="'+result.getValue('internalid')+'" selected="selected" >'+result.getValue('name')+'</option>';
				}else{
					string = string + '<option value="'+result.getValue('internalid')+'">'+result.getValue('name')+ '</option>';
					//string = string + '<option value="'+result.getValue('id')+'">Hola</option>';
				}
				return true ;
			});
			
			string = string + '</select>';
			
			return string;
		}

		arrSearchFilters.push(search.createFilter({
			name: 'custevent_kpi_sales_order',
			operator: search.Operator.ANYOF,
			values: [params['so']]
		}));
			
		columns.push('internalid');
		columns.push('title');
		columns.push('assigned');
		columns.push('startdate');
		columns.push('duedate');
		columns.push('custevent_kpi_duration');
		columns.push('custevent_kpi_ack');
		columns.push('custevent_kpi_item');
		columns.push('custevent_kpi_item_line');
		columns.push('custevent_kpi_service_address');
		columns.push('status');
		
		arrSearch = search.create({
			type: 'task',
			filters: arrSearchFilters,
			columns: columns
		});
	

		arrSearch.run().each(function(result){
				var Select = stringselect(result.getText({name: 'status'}),statussearch);
			task = {
				id: result.getValue({name: 'internalid'}),
				title: result.getValue({name: 'title'}),
				duration: result.getValue({name: 'custevent_kpi_duration'}),
				assigned: result.getText({name: 'assigned'}),
				ack: result.getValue({name: 'custevent_kpi_ack'}),
				start: createpicker( result.getValue({name: 'startdate'})),
				due: createpicker (result.getValue({name: 'duedate'})),
				status : Select
				//status: '<select><option>'+result.getText({name: 'status'}) + '</option></select>',
			};
			
			if(!result.getValue({name: 'custevent_kpi_service_address'}) &&
				!result.getValue({name: 'custevent_kpi_item'}) ){
				tasks['planning'].push(task);
			}
			
			if(result.getValue({name: 'custevent_kpi_service_address'})){
				curAddress = result.getValue({name: 'custevent_kpi_service_address'});
				tasks['address'][curAddress] = tasks['address'][curAddress] || {'name': result.getText({name: 'custevent_kpi_service_address'}), 'tasks':[]};
				tasks['address'][curAddress]['tasks'].push(task);
			}
			
			if(result.getValue({name: 'custevent_kpi_item'})){
				curItem = result.getValue({name: 'custevent_kpi_item'}) + 'L' + result.getValue({name: 'custevent_kpi_item_line'});
				tasks['service'][curItem] = tasks['service'][curAddress] || {'name': result.getText({name: 'custevent_kpi_item'}), 'tasks':[]};
				tasks['service'][curItem]['tasks'].push(task);
			}
						
			
			return true;
		});
	
		return JSON.stringify(tasks);

		
	};
	
	module.actions['default'] = function(action){
		return 'There is not such action: ' + action;
	};
	
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function doGet(requestParams) {
    	
    	
    	if (requestParams['action'] && module.actions[requestParams['action']]) {
    	    return module.actions[requestParams['action']](requestParams);
    	  } else {
    	    return module.actions['default']();
    	  }
    	
    	
    }

    /**
     * Function called upon sending a PUT request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPut(requestBody) {

    }


    /**
     * Function called upon sending a POST request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPost(requestBody) {

    }

    /**
     * Function called upon sending a DELETE request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doDelete(requestParams) {

    }

    return {
        'get': doGet,
        put: doPut,
        post: doPost,
        'delete': doDelete
    };
    
});
