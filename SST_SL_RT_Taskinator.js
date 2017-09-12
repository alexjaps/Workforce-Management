/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/config', 'N/format', 'N/log', 'N/email', 'N/error', 'N/record', 'N/search', 
		'N/task', 'N/transaction', 'N/runtime', 'N/https', 'N/file', './lib/leirags_html_ed'],

function(config, format, log, email, error, record, search, task, transaction, runtime, https, file, leirags_encoder) {

	var module = {
			'actions': {}
		};
	
	//-- var currentuserid = runtime.getCurrentUser().id; // Do this to void consuming gobernation units  


//---- getSincronWithWrike>
		module.actions['getSincronWithWrike'] = function (Params){
	      var idEmployee = Params.request.parameters['idEmployee'];
	      var sincron = search.create({
					type: 'customrecord_sst_cr_wrike_netsuite',
					columns: 'internalid',
					filters: [
						[ 'custrecord_sst_cr_wn_employee', 'is', runtime.getCurrentUser().id ]
					]
				});
	      var found = false;
	      sincron.run().each(function(res){
	        found = true;
	      });
	
	      Params.response.write(JSON.stringify(found));
		}
//---- getSincronWithWrike<





//---- getServiceAddressesOLD>
		module.actions['getServiceAddressesOLD'] = function (Params){
			// getServiceAddresses: Gets the Service Addresses related or involved in the selected Sales Order
			// The data that is retrieve from this function is shwon at the table myUpdatedServicesAddresses
			var sales_order,
				addresses=[],
				service_addresses=[],
				address_a,
				address_z,
				i,
				x;
	    var SalesOrder = Params.request.parameters['SO'];
			var saleord_id = '';
			var saleord_miletype = 'Not returned';
			var mySearch = search.create({
				type: 'customrecord_location_cost',
				columns: ['custrecord_location_cost_so', 'custrecord_last_mile_type'],
				filters:[
				  ['custrecord_location_cost_so', search.Operator.ANYOF, SalesOrder],
				  'and', ['custrecord_location_cost_assigned', search.Operator.IS, true]
				]
			}).run().each(function(result) {
				saleord_id       = result.getValue('custrecord_location_cost_so'),
				saleord_miletype = result.getText('custrecord_last_mile_type');
				// return true;
			});

			sales_order = record.load({
				type: 'salesorder',
				id: SalesOrder
			});

			// var EstimatedDate = [];
	    var itemx = sales_order.getLineCount({sublistId:'item'});

			for(var it=0;it < itemx; it +=1){

				address_a = sales_order.getSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_location_a_c',
					line: it
				});

				address_z = sales_order.getSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_location_z_c',
					line: it
				});
				// var preDate = sales_order.getSublistValue({
				// 	sublistId: 'item',
				// 	fieldId: 'custcol_so_est_delivery_date',
				// 	line: it
				// });
				// var Edate = format.parse({ value: preDate, type: format.Type.DATE});
				// EstimatedDate.push(Edate);
			// );

				if(addresses.indexOf(address_a) === -1 && address_a){
					addresses.push(address_a);
				}

				if(addresses.indexOf(address_z) === -1 && address_z){
					//if(address_z){
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
					'custrecord_sac_service_address.custrecord_address_is_pop',
				   'custrecord_sac_service_address.custrecord_address_status']
				});

				service_addresses.push({
					'id': address,
					'name': address_detail['name'],
					'address': address_detail['custrecord_sac_service_address.custrecord_address1'],
					'status': (address_detail['custrecord_sac_service_address.custrecord_address_status']==''?'' :address_detail['custrecord_sac_service_address.custrecord_address_status'][0].text ),
					'type': (address_detail['custrecord_sac_service_address.custrecord_address_is_pop']==true)?"Transtelco POP " : "Customer location",
					//'type': address_detail['custrecord_sac_service_address.custrecord_address_is_pop'],
					'city': (address_detail['custrecord_sac_service_address.custrecord_city']=="")? "" : address_detail['custrecord_sac_service_address.custrecord_city'][0]['text'],
					'lmt': saleord_miletype,
	        'AdZ' : address_z,
					// 'EstimatedDate' : EstimatedDate[index],
					//'type':
					   //'newbuild':
					   //'lastmiletype':
				});
			});
			//return JSON.stringify(service_addresses);

			Params.response.write(JSON.stringify(service_addresses));

		}
//---- getServiceAddressesOLD<
		
		
//---- getServiceAddresses>
		module.actions['getServiceAddresses'] = function (Params){
			// getServiceAddresses: Gets the Service Addresses related or involved in the selected Sales Order
			// The data that is retrieve from this function is shwon at the table myUpdatedServicesAddresses
			var SaleOrder = Params.request.parameters['SO'];
			var ResultsRows = [];
			var addresses=[];
			var service_addresses=[],
				address_a,
				address_z;
			var saleord_id = '';
			var saleord_miletype = 'Not returned';
			
		//-- Get All diferent Services addresses in the SO
			var filters = [];
			//-D log.debug({title: "getAllServices", details: Params.request.parameters});
			filters.push(search.createFilter({
				name:'internalid',
				operator: search.Operator.IS,
				values: SaleOrder
				}));
			//-D log.debug(Params.request.parameters['SO']);
			filters.push(search.createFilter({
				name:'type',
				join: 'item',
				operator: search.Operator.IS,
				values: 'Service'
				}));

			items = search.create({
				type: 'transaction',
				filters: filters,
				columns: ['line','item','custcol_location_a_c','custcol_location_z_c',
				'custcol_address_z_c','custcol_address_a_c']
			});

			items.run().each(function(result){
				address_a = result.getValue('custcol_location_a_c');
				address_z = result.getValue('custcol_location_z_c');
				
				if(address_a && addresses.indexOf(address_a) === -1 )
					addresses.push(address_a);

				if(address_z && addresses.indexOf(address_z) === -1 )
					addresses.push(address_z);
					
				return true;
			});
		//---
		
		//--- Read LastMyle Type
			var mySearch = search.create({
				type: 'customrecord_location_cost',
				columns: ['custrecord_location_cost_so', 'custrecord_last_mile_type'],
				filters:[
				  ['custrecord_location_cost_so', search.Operator.ANYOF, SaleOrder],
				  'and', 
				  ['custrecord_location_cost_assigned', search.Operator.IS, true]
				]
			}).run().each(function(result) {
				saleord_id       = result.getValue('custrecord_location_cost_so'),
				saleord_miletype = result.getText('custrecord_last_mile_type');
				// return true;
			});
		//---
			
		//---Read all vales to show in service address
			addresses.forEach(function(address){
				address_detail = search.lookupFields({
				type: 'customrecord_service_address_entity',
				id : address,
				columns : ['name',
				   'custrecord_sac_service_address.custrecord_address1',
				   'custrecord_sac_service_address.custrecord_city',
					'custrecord_sac_service_address.custrecord_address_is_pop',
				   'custrecord_sac_service_address.custrecord_address_status',
				   
				   'custrecord_sac_service_address.custrecord_country',
				   'custrecord_sac_service_address.custrecord_state',
				   'custrecord_sac_service_address.custrecord_sa_municipality',
				   ]
				});
				//---push carry out the necesary values
				service_addresses.push({
					'id': address,
					'soid': SaleOrder,
					'name': address_detail['name'],
					'address': address_detail['custrecord_sac_service_address.custrecord_address1'],
					'status': (address_detail['custrecord_sac_service_address.custrecord_address_status']==''
								?'' :address_detail['custrecord_sac_service_address.custrecord_address_status'][0].text ),
					'type': (address_detail['custrecord_sac_service_address.custrecord_address_is_pop']==true)
								?"Transtelco POP " : "Customer location",
					'city': (address_detail['custrecord_sac_service_address.custrecord_city']=="")
								? "" : address_detail['custrecord_sac_service_address.custrecord_city'][0]['text'],
					'lmt': saleord_miletype,
					'AdZ' : address_z,
					
					'country' :  address_detail['custrecord_sac_service_address.custrecord_country'][0],
					'state' :  address_detail['custrecord_sac_service_address.custrecord_state'][0],
					'citi' :  address_detail['custrecord_sac_service_address.custrecord_city'][0],
					'municipality' :  address_detail['custrecord_sac_service_address.custrecord_sa_municipality'][0],
				});
			});	
		//---

			Params.response.write(JSON.stringify(service_addresses));
		}
//---- getServiceAddresses<		





//---- getAllServices>
		module.actions['getAllServices'] = function (Params){
			var SO_id = Params.request.parameters['SO'];
			var ResultsRows = [];
			var filters = [];
			//-D log.debug({title: "getAllServices", details: Params.request.parameters});
			filters.push(search.createFilter({
				name:'internalid',
				operator: search.Operator.IS,
				values: SO_id
			}));
			//-D log.debug(Params.request.parameters['SO']);
			filters.push(search.createFilter({
				name:'type',
				join: 'item',
				operator: search.Operator.IS,
				values: 'Service'
			}));

			items = search.create({
				type: 'transaction',
				filters: filters,
				columns: ['line','item','custcol_ov_suscripcion','custcol_ov_capacidad',
				'custcol_ov_unidadmedida', 'custcol_location_a_c','custcol_location_z_c',
				'custcol_address_z_c','custcol_address_a_c','custcol_so_est_delivery_date',
				'options','custcol_sst_cf_actions']
			}); 

			items.run().each(function(result){
	
				var options = result.getValue('options');
				options = options.split('\u0004')
							.map(function(o){return o.split('\u0003')})
							.filter(function(o){return o[3];})
							.map(function(o){return [o[2],o[4]||o[3]].join(':&nbsp;');})
							.join('<br>');
	
				ResultsRows.push({
					"line": result.getValue('line'),
					"itemid":result.getValue('item'),
					"itemName":result.getText('item'),
					"capacity": result.getValue('custcol_ov_capacidad'),
					"UoM" : result.getText('custcol_ov_unidadmedida'),
					"LocationA" : result.getText('custcol_location_a_c'),
					"LocationZ" : result.getText('custcol_location_z_c'),
					"AddressA" : result.getValue('custcol_address_a_c'),
					"AddressZ" : result.getValue('custcol_address_z_c'),
		            "subscription" : result.getText('custcol_ov_suscripcion'),
		            "subscription_val" : result.getValue('custcol_ov_suscripcion'),
		            "EstimatedDate" : result.getValue('custcol_so_est_delivery_date'),
		            "options": options,
		            "action": result.getText('custcol_sst_cf_actions'),
				});
				return true;
			});
			
			//return JSON.stringify(ResultsRows);
			Params.response.write(JSON.stringify(ResultsRows));
		}
//---- getAllServices<





//---- getTasksTableTree>
		module.actions['getTasksTableTree'] = function (Params){
			var arrSearch,arrSearchFilters=[],count = 0;
			var columns 		= [];
			var SeeWhatOrderSale = Params.request.parameters['WhichSalesOrder'];
			if (! SeeWhatOrderSale) {Params.response.write(JSON.stringify({})); return; }
			var custevent_kpi_service_address 	= search.createColumn({name: 'custevent_kpi_service_address',	sort: search.Sort.ASC});//DESC
			var custevent_kpi_item 				= search.createColumn({name: 'custevent_kpi_item',				sort: search.Sort.ASC});//DESC
			var title 							= search.createColumn({name: 'title',							sort: search.Sort.ASC});//DESC

			columns = [ /** if you added one column you need to check te number colum in function pushArrayAddress **/
			        	'internalid', 						// column 0
			        	title,								// column 1
			        	custevent_kpi_item, 				// column 2
			        	'custevent_kpi_item_line',			// column 3
			        	custevent_kpi_service_address,		// column 4
			        	'custevent_kpi_task_type'			// column 5
			        	];
	       	//Columns For tree
			columns.push(search.createColumn({name:'custrecord_kpit_department',join:'custevent_kpi_task_type'}));                        // column 6
	       	columns.push(search.createColumn({name:'custrecord_kpit_process',	join:'custevent_kpi_task_type',sort: search.Sort.ASC}));  // column 7
	       	columns.push(search.createColumn({name:'custrecord_kpit_subprocess',join:'custevent_kpi_task_type',sort: search.Sort.ASC}));  // column 8

	       	columns.push(search.createColumn({name:'startdate'}));  						// column 9
	       	columns.push(search.createColumn({name:'duedate'}));  							// column 10
	       	columns.push(search.createColumn({name:'custevent_kpi_duration'})); 			// column 11

	       	columns.push(search.createColumn({name:'custevent_kpi_task_status'})); 			// column 12
	       	columns.push(search.createColumn({name:'custevent_kpi_planned_startdate'})); 	// column 13
	       	columns.push(search.createColumn({name:'custevent_kpi_planned_duedate'})); 		// column 14

	       	arrSearchFilters.push(['custevent_kpi_sales_order', search.Operator.ANYOF, SeeWhatOrderSale]);
			arrSearch = search.create({type: 'task',filters: arrSearchFilters,columns: columns});
			var arrayAddress 	= [];
			var arrayItem 	 	= [];
			var arrayPlan 	 	= [];
			var resultFinal 	= {};

			arrSearch.run().each(function(result){
				count++;
				var treeServAddress = result.getText({name: 'custevent_kpi_service_address'});
				var treeItem 		= result.getText({name: 'custevent_kpi_item'});


				if(treeServAddress != ''){
					arrayAddress.push( pushArrayAddress(result) );
				}else if(treeItem != ''){
					arrayItem.push( pushArrayAddress(result) );
				}else{
					arrayPlan.push( pushArrayAddress(result) );
				}
				return true;
			});

			resultFinal.arrayAddress 	= arrayAddress;
			resultFinal.arrayItem 		= arrayItem;
			resultFinal.arrayPlan 		= arrayPlan;
			//return JSON.stringify(resultFinal);
			Params.response.write(JSON.stringify(resultFinal));
			//------------------------------------------------------------------------------------
			function pushArrayAddress(result){
				var interID 		= result.getValue({name: 'internalid'});
				var title 			= result.getValue({name: 'title'});

				if ( title.indexOf(" - ") !== -1 ) {
					title =  title.substring(title.indexOf(" - ") + 3);
				} else {
					title =  title;
				}
				var taskDepto 			= result.getText(columns[6]);
				var taskProcess 		= result.getText(columns[7]);
				var taskSubProcess		= result.getText(columns[8]);
				var taskDeptoVal 		= result.getValue(columns[6]);
				var taskProcessVal 		= result.getValue(columns[7]);
				var taskSubProcessVal	= result.getValue(columns[8]);

				//Dates ---------------------
				var taskStartDate   	= result.getValue({name: 'startdate'});
				var taskDueDate			= result.getValue({name: 'duedate'});
				var taskDuration		= result.getValue({name: 'custevent_kpi_duration'});
				//by Address-----------------
				var taskKpiAddress 		= result.getValue({name: 'custevent_kpi_service_address'});
				var taskKpiAddressTex	= result.getText({name: 'custevent_kpi_service_address'});
				var taskKpiAddressCon	= 'A'+taskKpiAddress +'~'+ taskKpiAddressTex;

				//by Item -------------------
				var taskKpiItem		= result.getValue({name: 'custevent_kpi_item'});
				var taskKpiItemTex	= result.getText({name: 'custevent_kpi_item'});
				var taskKpiLine		= result.getValue({name: 'custevent_kpi_item_line'});
				var taskKpiItemCon  = 'I'+taskKpiItem +'-'+taskKpiLine +'~'+ taskKpiItemTex  ; //+ '-' + taskKpiLineTex;

				//Status --------------------
				var status			= result.getValue({name: 'custevent_kpi_task_status'});
				var drawStatus 		= (status == '4') ? "YesCancel": (status == '3')  ? "Yes" : "No" ; // 4 Cancelled;
				var statusText		= result.getText({name: 'custevent_kpi_task_status'});

				//Desviacion ----------------
				var taskStartPlanned 	= result.getValue({name: 'custevent_kpi_planned_startdate'});
				var taskDuePlanned 		= result.getValue({name: 'custevent_kpi_planned_duedate'});
				var isDes			 	= ( (taskStartPlanned ==  taskStartDate) && (taskDueDate == taskDuePlanned) ) ? "No" : "Yes" ;

				//Variable
				var taskPro 		= '';
				var taskSubPro      = '';
				var taskSubProTask	= '';
				var delimiterdates = '\t';

				if(taskKpiAddress != ''){//Address ----------------
					if(taskProcessVal != ''){
						taskPro = 'A'+taskKpiAddress +'~'+ taskProcessVal +'~'+taskProcess  ;
					}
					if(taskSubProcessVal == ''){
						taskSubPro      = '';
						taskSubProTask 	= 'A'+taskKpiAddress + '~' + taskProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + delimiterdates + taskDueDate + delimiterdates + taskDuration + delimiterdates + drawStatus + delimiterdates + isDes;
					}else{
						taskSubPro 		= 'A'+taskKpiAddress + '~' + taskProcessVal + '~' + taskSubProcessVal +	'~' + taskSubProcess;
						taskSubProTask 	= 'A'+taskKpiAddress + '~' + taskProcessVal + '~' + taskSubProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + delimiterdates + taskDueDate + delimiterdates + taskDuration + delimiterdates + drawStatus + delimiterdates + isDes;
					}
				}else if(taskKpiItem != ''){//Item ----------------
					if(taskProcessVal != ''){
						taskPro = 'I'+taskKpiItem+'-'+taskKpiLine+'~'+ taskProcessVal +'~'+taskProcess;
					}
					if(taskSubProcessVal == ''){
						taskSubProTask 	= 'I'+taskKpiItem+'-'+taskKpiLine+ '~' + taskProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + delimiterdates + taskDueDate + delimiterdates + taskDuration + delimiterdates + drawStatus + delimiterdates + isDes;
					}else{
						taskSubPro 		= 'I'+taskKpiItem+'-'+taskKpiLine + '~' + taskProcessVal + '~' + taskSubProcessVal +	'~' + taskSubProcess;
						taskSubProTask 	= 'I'+taskKpiItem+'-'+taskKpiLine + '~' + taskProcessVal + '~' + taskSubProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + delimiterdates + taskDueDate + delimiterdates + taskDuration + delimiterdates + drawStatus  + delimiterdates + isDes;
					}
				}else{//Planning ----------------
					if(taskProcessVal != ''){
						taskPro = 'P'+taskProcessVal +'~'+taskProcess;
					}
					if(taskSubProcessVal == ''){
						taskSubPro      = '';
						taskSubProTask 	= 'P'+taskProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + delimiterdates + taskDueDate + delimiterdates + taskDuration + delimiterdates + drawStatus  + delimiterdates + isDes;
					}else{
						taskSubPro 		= 'P'+taskProcessVal + '~' + taskSubProcessVal +'~'+ taskSubProcess;
						taskSubProTask 	= 'P'+taskProcessVal + '~' + taskSubProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + delimiterdates + taskDueDate + delimiterdates + taskDuration + delimiterdates + drawStatus  + delimiterdates + isDes;
					}
				}
				return ({
					'taskId'			: interID,
					'taskTitle'			: title,
					//-------------------
					'taskKpiItem'		: taskKpiItem,
					'taskKpiItemTex'	: taskKpiItemTex,
					'taskKpiLine'		: taskKpiLine,
					'taskKpiItemCon'	: taskKpiItemCon,
					//-------------------
					'taskKpiAddress'	: taskKpiAddress,
					'taskKpiAddressTex'	: taskKpiAddressTex,
					'taskKpiAddressCon'	: taskKpiAddressCon,
					//-------------------
					'taskPro' 			: taskPro,
					'taskSubPro' 		: taskSubPro,
					'taskSubProTask' 	: taskSubProTask,
					//-------------------
					'taskStartDate'		: taskStartDate,
					'taskDueDate'		: taskDueDate,

				});
			}
		};
//---- getTasksTableTree<





//---- searchItemLocation>
		module.actions['searchItemLocation'] = function (Params){
			var SeeWhatOrderSale 	= Params.request.parameters['WhichSalesOrder'];
			var WhichItem 			= Params.request.parameters['WhichItem'];
			var WhichLine 			= Params.request.parameters['WhichLine'];
			var items = [],
				noitem = {'item':'','location_a':null, 'location_z': null},
		        filters = [],
		        columns = [];
			
	    	columns = ['custcol_location_a_c','custcol_location_z_c','linesequencenumber','item'];
	    	
	       	filters.push(search.createFilter({name:'type'		, operator: search.Operator.ANYOF, values:'SalesOrd'}));
	       	filters.push(search.createFilter({name:'internalid'	, operator: search.Operator.IS, values: SeeWhatOrderSale}));
	       	filters.push(search.createFilter({name:'type'		, join:'item', operator: search.Operator.IS, values:'Service'}));
	       	//- filters.push(search.createFilter({name:'internalid'	, join:'item', operator: search.Operator.IS, values: WhichItem }));

	       	var searchTrans = search.create({type: 'transaction',filters: filters, columns: columns});

	       	searchTrans.run().each(function(result){
	       		//if(result.getValue("linesequencenumber") == WhichLine ){
	       		var name = result.getText('item')
                + " - " + (result.getText('custcol_location_a_c'))
                + ((result.getText('custcol_location_z_c')) ? (' <> ' + result.getText('custcol_location_z_c') ) : '');
	       		var location = {
	                saleorder	: SeeWhatOrderSale,
	                lineitem	: result.getValue('linesequencenumber'),
	                item 		: result.getText ('item'),
	                item_id		: result.getValue('item'),
	                location_a	: result.getValue('custcol_location_a_c'),
	                location_z	: result.getValue('custcol_location_z_c'),
	                location_as	: result.getText ('custcol_location_a_c'),
	                location_zs	: result.getText ('custcol_location_z_c'),
	                name		: name
	            }
	       		items.push(location)
	            return true
	       	})
	       	
	       	if (! items.length)
	       		items.push(noitem)
	       		
	       	Params.response.write( JSON.stringify(items) )
		};
//---- searchItemLocation<


		// New function Add //


//---- getSaleOrderData>
		module.actions['getSaleOrderData'] = function (Params){
			var WhichSalesOrder 	= Params.request.parameters['WhichSalesOrder'];
			var filters = [],
	    	columns = [
	    				'tranid','entity','memo','custbody_vtas_condcom',
	    				'custbody5','custbody_project_manager','custbody_pm_notes',
	    				'custbody_op_eng_sow','custbody_op_sow','custbody_tt_ordertype',
	    				'salesrep','custbody_prov_engineer',
	    				'custbody_so_pri_contact','custbody_so_tech_contact','custbody_so_bill_contact',
	    				'custbody_so_ar_notes', 'opportunity',
	    				];
			var SaleOrder = {};
			/* Verizon Data Gisela-Rascon add:2017-04-30 */
			var verizon = [
    				'custbody_vrz_order_num', 'custbody_vrz_circuit_id', 'custbody_vrz_nni_id',
    				'custbody_vrz_end_customer','custbody_vrz_foc_date', 'custbody_vrz_bw'];
			var use_verizon =(runtime.envType == 'PRODUCTION');
			
			if (use_verizon)
				columns = columns.concat(verizon);
	
			// Simulate console functions
		/*	class console_simulator {
					constructor(){ this.storage={ log:[], info:[], error:[], table:[] }; }
					log()	{ for (var i=0; i < arguments.length; i++) { if (typeof arguments[i] === 'object') (this.storage.log  ).push(JSON.stringify(arguments[i])); else (this.storage.log  ).push(arguments[i]); } }
					info()	{ for (var i=0; i < arguments.length; i++) { if (typeof arguments[i] === 'object') (this.storage.info ).push(JSON.stringify(arguments[i])); else (this.storage.info ).push(arguments[i]); } }
					error()	{ for (var i=0; i < arguments.length; i++) { if (typeof arguments[i] === 'object') (this.storage.error).push(JSON.stringify(arguments[i])); else (this.storage.error).push(arguments[i]); } }
					table()	{ for (var i=0; i < arguments.length; i++) { if (typeof arguments[i] === 'object') (this.storage.table).push(JSON.stringify(arguments[i])); else (this.storage.table).push(arguments[i]); } }
					getall(){ return this.storage; }
				};
				
			var consolex = new console_simulator(); */
			
			var console = {
				storage : { log:[], info:[], error:[], table:[], warn:[] },
				log: 	function () { for (var i=0; i < arguments.length; i++) { if (typeof arguments[i] === 'object') (this.storage.log  ).push(JSON.stringify(arguments[i])); else (this.storage.log  ).push(arguments[i]); } },
				info: 	function ()	{ for (var i=0; i < arguments.length; i++) { if (typeof arguments[i] === 'object') (this.storage.info ).push(JSON.stringify(arguments[i])); else (this.storage.info ).push(arguments[i]); } },
				error: 	function ()	{ for (var i=0; i < arguments.length; i++) { if (typeof arguments[i] === 'object') (this.storage.error).push(JSON.stringify(arguments[i])); else (this.storage.error).push(arguments[i]); } },
				table: 	function ()	{ for (var i=0; i < arguments.length; i++) { if (typeof arguments[i] === 'object') (this.storage.table).push(JSON.stringify(arguments[i])); else (this.storage.table).push(arguments[i]); } },
				warn: 	function ()	{ for (var i=0; i < arguments.length; i++) { if (typeof arguments[i] === 'object') (this.storage.warn ).push(JSON.stringify(arguments[i])); else (this.storage.warn ).push(arguments[i]); } },
				getAll: function ()	{ return this.storage; },
				save: 	function () {
					var FunName = Params.request.parameters['action'];
					if((this.storage.log  ).length) log.debug({title: FunName+' LOG',  details: this.storage.log   });
					if((this.storage.info ).length) log.debug({title: FunName+' INFO', details: this.storage.info  });
					if((this.storage.error).length) log.debug({title: FunName+' ERROR',details: this.storage.error });
					if((this.storage.table).length) log.debug({title: FunName+' TABLE',details: this.storage.table });
					if((this.storage.warn ).length) log.debug({title: FunName+' WARN', details: this.storage.log   });
				}
			};
			
	       	filters.push(search.createFilter({name:'type'		, operator: search.Operator.ANYOF, values:'SalesOrd'}));
	       	filters.push(search.createFilter({name:'internalid'	, operator: search.Operator.IS, values: WhichSalesOrder}));
	       	filters.push(search.createFilter({name:'mainline'	, operator: search.Operator.IS, values: 'T'}));
	       	
	       	var searchTrans = search.create({type: 'transaction',filters: filters, columns: columns});

	       	searchTrans.run().each(function(soObj){
	       		var so = JSON.stringify(soObj);
	       		// var sow= soObj.getValue('custbody_op_sow');
	       		LeirAGS_Encoder.EncodeType = "entity";
       			var sow = LeirAGS_Encoder.htmlEncode( soObj.getValue('custbody_op_sow') );
       			var esow = LeirAGS_Encoder.htmlEncode( soObj.getValue('custbody_op_eng_sow') );
	       		
	       		so = JSON.parse( so );
	       		//log.debug({title: "so..so", details:  so });
	       		
	       		SaleOrder = {
	       			'id' : so.id,
	       			'name' : so.values.tranid,
	       			'opportunity': (so.values.opportunity[0])?so.values.opportunity[0]  : {text:'-None-', value:0 },
	       			'tt_type' : so.values.custbody_tt_ordertype[0],
	       			'recordType' : so.recordType,
	       			'comercial_cond' : so.values.custbody_vtas_condcom,
	       			'customer' : so.values.entity[0],
	       			'project_manager' : (so.values.custbody_project_manager[0]) ? so.values.custbody_project_manager[0] : {text:'-None-',value:0},
	       			'project_manager_notes' : so.values.custbody_pm_notes,
	       			'provision_notes' : so.values.custbody5,
	       			'opp_scopeofwork' : sow, //so.values.custbody_op_sow,
	       			'opp_scopeofwork_eng' : esow, //so.values.custbody_op_eng_sow,
	       			'so_memo' : so.values.memo,
	       			'sales_rep' : (so.values.salesrep[0])? so.values.salesrep[0] : {text:'-None-', value:0},
	       			'provision_engineer' : (so.values.custbody_prov_engineer[0])?so.values.custbody_prov_engineer[0] : {text:'-None-', value:0},
	       			'contact_pri' : (so.values.custbody_so_pri_contact[0])? so.values.custbody_so_pri_contact[0] : {text:'-None-', value:0},
	       			'contact_tech' : (so.values.custbody_so_tech_contact[0])?so.values.custbody_so_tech_contact[0] : {text:'-None-', value:0},
	       			'contact_bill' : (so.values.custbody_so_bill_contact[0])?so.values.custbody_so_bill_contact[0] : {text:'-None-', value:0},
	       			'ar_notes' : so.values.custbody_so_ar_notes,
	       			'use_verizon' : use_verizon,
	       			'vrz_order_num'	: (use_verizon)? so.values.custbody_vrz_order_num : '',
	       			'vrz_circuit_id' : (use_verizon)? so.values.custbody_vrz_circuit_id : '',
	       			'vrz_nni_id' : (use_verizon)? so.values.custbody_vrz_nni_id : '',
    				'vrz_end_customer' : (use_verizon)? so.values.custbody_vrz_end_customer : '',
    				'vrz_foc_date' : (use_verizon)? so.values.custbody_vrz_foc_date : '',
    				'vrz_bw' : (use_verizon)? so.values.custbody_vrz_bw : '',
	       		};
	            return true;
	       	});
	       	
	       	function searchContactsData(contactIDs){
	       		var contacts = [];
	        	var resultNetSuit = search.create({
	    			type: 'contact',
	    						columns: [ 'internalId', 'entityid','email','phone'],
	    						filters: [ 	[ 'internalId', 'anyof', contactIDs] ]
	    		});
	    		
	    		resultNetSuit.run().each(function(ctc){
	    			contacts.push({ 
	    				id : ctc.getValue('internalId'), 
	    				name: ctc.getValue('entityid'), 
	    				email: ctc.getValue('email'), 
	    				phone:  ctc.getValue('phone')
	    			});
	    			return true;
	    		});

	    		return contacts;
	       	}
	       	
	       	//var contactIDs = [];
	       	
	       	if (SaleOrder.contact_pri.value) {
	       		//contactIDs.push(SaleOrder.contact_pri.value);
	       		SaleOrder.contact_pri.email = '';
	       		SaleOrder.contact_pri.phone = '';
	       		var ctact = searchContactsData([SaleOrder.contact_pri.value]);
	       		if (ctact.length) {
	       			if(ctact[0].email) SaleOrder.contact_pri.email = ctact[0].email;
	       			if(ctact[0].phone) SaleOrder.contact_pri.phone = ctact[0].phone;
	       		}
	       	}
	       	if (SaleOrder.contact_tech.value) {
	       		//contactIDs.push(SaleOrder.contact_tech.value);
	       		SaleOrder.contact_tech.email = '';
	       		SaleOrder.contact_tech.phone = '';
	       		var ctact = searchContactsData([SaleOrder.contact_tech.value]);
	       		if (ctact.length) {
	       			if(ctact[0].email) SaleOrder.contact_tech.email = ctact[0].email;
	       			if(ctact[0].phone) SaleOrder.contact_tech.phone = ctact[0].phone;
	       		}
	       	}
	       	if (SaleOrder.contact_bill.value) {
	       		//contactIDs.push(SaleOrder.contact_bill.value);
	       		SaleOrder.contact_bill.email = '';
	       		SaleOrder.contact_bill.phone = '';
	       		var ctact = searchContactsData([SaleOrder.contact_bill.value]);
	       		if (ctact.length) {
	       			if(ctact[0].email) SaleOrder.contact_bill.email = ctact[0].email;
	       			if(ctact[0].phone) SaleOrder.contact_bill.phone = ctact[0].phone;
	       		}
	       	}
	       	/*
	       	SaleOrder.contacts = [];
	       	if(contactIDs)
	       		SaleOrder.contacts = searchContactsData(contactIDs);
	       	*/
	       	Params.response.write(JSON.stringify(SaleOrder));
	   }
//---- getSaleOrderData<
		
		
		
//---- getSONetWorkDesign>
	module.actions['getSONetWorkDesign'] = function (Params){
			var	ndSearch,
			    myFilters=[],
			    myColumns=[
			    	'internalid',
			    	'name',
			    	'custrecord_sst_nd_opportunity',
			    	'custrecord_sst_net_des_so',
			    	'custrecord_sst_nd_title',
			    	'custrecord_sst_nd_sales_rep',
			    	'custrecord_sst_nd_expectedclose',
			    	'custrecord_sst_nd_probability',
			    	'custrecord_sst_nd_sales_scope_of_work',
			    	'custrecord_sst_nd_eng_scope_of_work',
			    	'custrecord_sst_nd_assigned',
			    	'custrecord_sst_nd_completed',
			    	'custrecord_sst_nd_completion_status',
			    	'custrecord_sst_nd_completed_by',
			    	'custrecord_sst_nd_completed_on',
			    	'custrecord_sst_net_des_department',
			    	'custrecord_sst_wrikeintegration_nd_id',
			    	'custrecord_sst_nd_requested_by',
			    	'custrecord_sst_nd_requested_on',
			    	'custrecord_sst_nd_deprecated',
			    	'custrecord_sst_nd_deprecated_on',
			    	'custrecord_sst_nd_escalated',
			    	'custrecord_sst_nd_esc_date',
			    	'custrecord_sst_nd_esc_completed',
			    	'custrecord_sst_nd_esc_completed_on',
			    	'custrecord_sst_nd_se_requested_reason',
			    	'custrecord_sst_nd_last_mile_type',
			    	'custrecord_sst_net_des_type',
			    	// 'custrecord238',
			    	],
			    results=[];
			var SalesOrderId = Params.request.parameters['idSO'];
			var OpportunityId = Params.request.parameters['idOP'];
			var WF_DEBUG = false;

			if(WF_DEBUG)
				log.debug({title: "getSONetWorkDesign Parameters", details:  Params.request.parameters });

			myFilters.push(search.createFilter({
						name	: 'custrecord_sst_nd_deprecated', 
						operator: search.Operator.IS, 
						values	: 'F'
						})
					);
			
			if (SalesOrderId && SalesOrderId > 0) {
				myFilters.push(search.createFilter({
						name	: 'custrecord_sst_net_des_so', 
						operator: search.Operator.IS, 
						values	: SalesOrderId 
						})
					);
				myFilters.push(search.createFilter({
					name	: 'custrecord_sst_net_des_type', 
					operator: search.Operator.IS, 
					values	: 4
					})
				);
			} else if (OpportunityId && OpportunityId > 0) {
				myFilters.push(search.createFilter({
						name:'custrecord_sst_nd_opportunity',
						operator: search.Operator.IS, 
						values:OpportunityId
						})
					);
				myFilters.push(search.createFilter({
					name	: 'custrecord_sst_net_des_type', 
					operator: search.Operator.IS, 
					values	: 3 
					})
				);
			} else 
				return [];
		
			if(WF_DEBUG)
				log.debug({title: "getSONetWorkDesign Filters", details:  myFilters });
			
		  ndSearch = search.create({
		    type:'customrecord_sst_network_design',
		    filters: myFilters,
		    columns: myColumns
		  });

		  LeirAGS_Encoder.EncodeType = "entity";
		  
		  ndSearch.run().each(function(result){
			  var nd_rec = {}
			  myColumns.forEach(function(col){ 
				  var coln = (col.name).replace('custrecord_sst_nd_','')
				  		.replace('custrecord_sst_net_','')
				  		.replace('custrecord_sst_','')
				  		.replace('custrecord238','item_subtab');
				  
				  if (coln == 'sales_scope_of_work') {
					  nd_rec[coln] = LeirAGS_Encoder.htmlEncode( result.getValue(col) );
				  } else {
					  nd_rec[coln] = result.getValue(col);
					  if (result.getText(col) != null)
						  nd_rec[coln+'_txt'] = result.getText(col);  
				  }
			  });
			  results.push(nd_rec);
		    return true;
		  });

		  if(WF_DEBUG)
				log.debug({title: "getSONetWorkDesign results", details:  results });
		  
		  Params.response.write( JSON.stringify(results) );
		}
//---- getSONetWorkDesign<


//---- getDepartmentOfProject>
		module.actions['getDepartmentOfProject'] = function (Params){
			var mySearch,
		      myFilters=[],
		      myColumns=[],
		      departments=[];
			var SalesOrderId = Params.request.parameters['idSO'];

		   // Sales Order
		   myFilters.push(search.createFilter({
		     name: 'custevent_kpi_sales_order',
		     operator: search.Operator.IS,
		     values: (SalesOrderId=="" || SalesOrderId==undefined) ? 293807 : (SalesOrderId)
		   }));

		  // GROUP Departments
		  myColumns.push(search.createColumn({
		    name: 'custevent_kpi_department',
		    summary: search.Summary.GROUP,
		  }));

		  mySearch = search.create({
		    type:'task',
		    filters: myFilters,
		    columns: myColumns
		  });

		  mySearch.run().each(function(result){
		    departments.push({
		      'DepartmentdId': result.getValue(myColumns[0]),
		      'DepartmentName': result.getText(myColumns[0])
		    });
		    return true;
		  });

		  Params.response.write( JSON.stringify(departments) );

		}
//---- getDepartmentOfProject<
		

//---- getEmployeesOfProject>
		module.actions['getEmployeesOfProject'] = function (Params){
			// getEmployeesOfProject: Gets the list of employees  related or involved in the selected Sales Order
			var ResultsRows = [];
			var assignees, filters = [],
			columns = [];
			var SalesorderId = Params.request.parameters['idSO'];

			filters.push(search.createFilter({
				name: 'custevent_kpi_workforce_task',
				operator: search.Operator.IS,
				values: "T"
			}));

			filters.push(search.createFilter({
				name: 'custevent_kpi_sales_order',
				operator: search.Operator.ANYOF,
				values: (SalesorderId=="" || SalesorderId==undefined) ? 329071 : (SalesorderId)
			}));

			columns.push(search.createColumn({
				name: 'assigned',
				summary: search.Summary.GROUP,
				sort: 'ASC'
			}));

			assignees = search.create({
				type: 'task',
				filters: filters,
				columns: columns,
			});

			assignees.run().each(function(result){
				ResultsRows.push({
					"assignedId": result.getValue(columns[0]),
					"assignedName":result.getText(columns[0])
				});
				return true;
			});

			Params.response.write( JSON.stringify(ResultsRows));
		}
//---- getEmployeesOfProject<



//---- getMySalesOrders>

		module.actions['getMySalesOrders'] = function (Params){
			var WF_DEBUG = false;
			var PageSelected= Params.request.parameters['PageSelected'];
			var nameSo 		= Params.request.parameters['nameSo'];
			var IdUser 		= Params.request.parameters['IdUser'];
			var anySOStatus = Params.request.parameters['SOStatus'];
			var isPm 		= Params.request.parameters['isPm'];
			var auditId 	= Params.request.parameters['auditId']; // is set > 0 overrides user.
			var citiesIds   = {};
			var servAddIds  = [];
			var ShowCities	= true;

			if(WF_DEBUG)
				log.debug({title: "getMySalesOrders Params", details: Params.request.parameters });

			function getLastDueDate(wichSO) {
				var filters = [],
					columns = [],
					// results = [], not used
					SearchLDD;
				var lastDueDate = {'date':''};

				filters.push(search.createFilter({name: 'custevent_kpi_sales_order',operator: search.Operator.IS ,values: wichSO}));
				filters.push(search.createFilter({name: 'custevent_kpi_workforce_task', operator: search.Operator.IS, values: true}));
				filters.push(search.createFilter({name: 'mainline',join: 'custevent_kpi_sales_order',operator: search.Operator.IS ,values: true}));
				columns.push(search.createColumn({ name: 'duedate',sort: 'DESC'})); //colum 0
				columns.push(search.createColumn({ name: 'internalid'})); //colum 1

				SearchLDD = search.create({type: 'task',filters: filters,columns: columns});
				SearchLDD.run().each(function(result){
					// var duedate 	= result.getValue(columns[0]);
					var duedate = format.parse({ value: result.getValue(columns[0]), type: format.Type.DATE});
					lastDueDate['date'] = duedate;
					//return true;
				});
				return lastDueDate;
			}

			function getMyTeam() {
				var CurrentUserID = runtime.getCurrentUser().id;
				if (auditId>0) CurrentUserID = auditId;
				var mySearch = search.create({
					type: 'employee',
					columns: ['internalId','supervisor','firstname' , 'lastname', 'title'],
					filters:[
					['isinactive','is', false],
						'and',
						['supervisor', 'is', CurrentUserID]
					]
				});
				var selectTeam=[];
				selectTeam.push(CurrentUserID);
				mySearch.run().each(function(result) {
					selectTeam.push(result.getValue('internalId'));
					return true;
				});
				//--D log.debug({title: "getMySalesOrders myTeam", details: selectTeam });
				return selectTeam;
			}

			function getProjectManagerId (internalEmployee){
				// var idPm = "";
				// search.create({
				// 	type: 'customrecord_project_manager',
				// 	filters: ['custrecord_pm_name','is',internalEmployee],
				// 	columns : ['internalid']
				// }).run().each(function(res){
				// 	idPm = res.getValue('internalid');
				// });
				// return idPm;
				return internalEmployee;
			}

			function getAllServiceAddressCities (){
				 //-- var cities_rtrn = [];
				 search.create({
				 	type: 'customrecord_service_address',
				 	filters: ['internalId','anyOf',servAddIds],
				 	columns : ['internalId','custrecord_city','custrecord_state']
				 }).run().each(function(sar){
					//-- cities_rtrn.push(sar);
				 	var xy = sar.getValue('internalId');
				 	if(xy !== null) {
				 		citiesIds[xy]={
				 			//'city': sar.getValue('custrecord_city'), 'state':sar.getValue('custrecord_state')
				 			'city': sar.getText('custrecord_city'), 'state':sar.getText('custrecord_state')
				 		};
				 	}
				 	return true;
				 });

				// log.debug ({title: 'getMySalesOrders getAllServiceAddressCities', details: citiesIds });
			}

			function getItemsAndServAddresses(wichSO, typeAction) {
				var filters = [], columns = [], LmySearch;
				var count = 0;
				var EstimatedDate = [];
				//Parameters -------------------
				filters.push(search.createFilter({name: 'type', operator: search.Operator.IS, values: 'SalesOrd'}));
				filters.push(search.createFilter({name: 'internalid', operator: search.Operator.IS, values: wichSO}));
				filters.push(search.createFilter({name: 'item', operator: search.Operator.NONEOF ,values: '@NONE@'}));
				filters.push(search.createFilter({name: 'type',join: 'item', operator: search.Operator.IS ,values: 'Service'}));
				if(typeAction == 'Item'){
					columns.push(search.createColumn({ name: 'linesequencenumber',sort: 'ASC', summary: search.Summary.GROUP })); //colum 0 //WAS COUNT CAmbiar por linesequencenumber
					// columns.push(search.createColumn({ name: 'line',sort: 'ASC', summary: search.Summary.GROUP })); //colum 0 //WAS COUNT CAmbiar por linesequencenumber
					columns.push(search.createColumn({ name: 'custcol_so_est_delivery_date',summary: search.Summary.GROUP })); //colum 1
				}else{
					columns.push(search.createColumn({ name: 'custcol_location_a_c',sort: 'ASC',summary: search.Summary.GROUP})); //colum 0
					columns.push(search.createColumn({ name: 'custcol_location_z_c',summary: search.Summary.GROUP})); //colum 1
				}
				LmySearch = search.create({type: 'transaction',filters: filters,columns: columns});
				LmySearch.run().each(function(result) {
					if(typeAction == "Item"){
						if(result.getValue(columns[1])) EstimatedDate.push(result.getValue(columns[1]));
						if(result.getValue(columns[0])) count++;
					}else{
						if(result.getValue(columns[0])) count++;
						if(result.getValue(columns[1])) count++;
					}
					return true;
				});
				return [count,EstimatedDate];
			}
			// End of function

			function getItemsAndServAddressesAll(wichSOs, typeAction) {
		        var filters = [], columns = [], AmySearch;
		        var count = 0;
		        var SOid, EstimatedDate=[];
		        var SoArray = {};

		        typeAction = (typeAction == "Item");

		        filters.push(search.createFilter({name: 'type', operator: search.Operator.IS, values: 'SalesOrd'}));
		        filters.push(search.createFilter({name: 'internalid', operator: search.Operator.ANYOF, values: wichSOs}));
		        filters.push(search.createFilter({name: 'item', operator: search.Operator.NONEOF ,values: '@NONE@'}));
		        filters.push(search.createFilter({name: 'type',join: 'item', operator: search.Operator.IS ,values: 'Service'}));

		        columns.push(search.createColumn({ name: 'internalid', summary: search.Summary.GROUP }));

		        if(typeAction){
		          columns.push(search.createColumn({ name: 'linesequencenumber',sort: 'ASC', summary: search.Summary.GROUP })); //column 1 //WAS COUNT CAmbiar por linesequencenumber
		          columns.push(search.createColumn({ name: 'custcol_so_est_delivery_date',summary: search.Summary.GROUP })); //column 2
		        }else{
		          columns.push(search.createColumn({ name: 'custcol_location_a_c',sort: 'ASC',summary: search.Summary.GROUP})); //column 1
		          columns.push(search.createColumn({ name: 'custcol_location_z_c',summary: search.Summary.GROUP})); //column 2
		          columns.push(search.createColumn({ name: 'custrecord_sac_service_address', join: 'custcol_location_a_c', sort: 'ASC',summary: search.Summary.GROUP})); //column 3
		          columns.push(search.createColumn({ name: 'custrecord_sac_service_address', join: 'custcol_location_z_c',summary: search.Summary.GROUP})); //column 4
		        }

		        AmySearch = search.create({type: 'transaction', filters: filters, columns: columns});

		        AmySearch.run().each(function(rst) {
		          count=0;
		          SOid = rst.getValue(columns[0]);

		          if(typeAction){

		        	if(rst.getValue(columns[1]) >0) count++;
		            if(rst.getValue(columns[2]))
		              EstimatedDate = [ rst.getValue(columns[2]) ];
		            if(SoArray[SOid]){
		            	SoArray[SOid] = {
		            			'internalid' : SOid,
		            			'count' : SoArray[SOid].count + count,
					            'EstimatedDate' : EstimatedDate.concat( SoArray[SOid].EstimatedDate )
					          };
			         } else
			            SoArray[SOid] = {
					            'internalid' : SOid,
					            'count' : count,
					            'EstimatedDate' : EstimatedDate
					          };

		          } else {
		        // ------- Service Address>
		            if(SoArray[SOid]){
		            	var SasP = SoArray[SOid].Sas;
		            	var SanP = SoArray[SOid].San;

		            	if(rst.getValue(columns[1]) >0 && SasP.indexOf( rst.getValue(columns[1]) ) == -1)
		            		SasP.push( rst.getValue(columns[1]) );

		            	if(rst.getValue(columns[2]) >0 && SasP.indexOf( rst.getValue(columns[2]) ) == -1)
		            		SasP.push( rst.getValue(columns[2]) );

		            	if(rst.getValue(columns[3]) >0 && SanP.indexOf( rst.getValue(columns[3]) ) == -1){
		            		SanP.push( rst.getValue(columns[3]) );
		            		if(servAddIds.indexOf( rst.getValue(columns[3]) ) == -1)
				        		 servAddIds.push( rst.getValue(columns[3]) )
		            	}

		            	if(rst.getValue(columns[4]) >0 && SanP.indexOf( rst.getValue(columns[4]) ) == -1){
		            		SanP.push( rst.getValue(columns[4]) );
		            		if(servAddIds.indexOf( rst.getValue(columns[4]) ) == -1)
				        		 servAddIds.push( rst.getValue(columns[4]) )
		            	}

		            	SoArray[SOid] = {
		            			'internalid': SOid,
					            'count' : SasP.length,
					            'Sas' : SasP,
					            'San' : SanP
					          };
			         } else {
			        	 var Sas = [];
			        	 var San = [];
			        	 if(rst.getValue(columns[1]) >0)
			        		 Sas.push( rst.getValue(columns[1]) );

				         if(rst.getValue(columns[2]) >0 &&
				        		 rst.getValue(columns[1]) != rst.getValue(columns[2]))
				        	 Sas.push( rst.getValue(columns[2]) );

				         if(rst.getValue(columns[3]) >0) {
				        	 San.push( rst.getValue(columns[3]) );
				        	 if(servAddIds.indexOf( rst.getValue(columns[3]) ) == -1)
				        		 servAddIds.push( rst.getValue(columns[3]) );
				         }

				         if(rst.getValue(columns[4]) >0 &&
				        		 rst.getValue(columns[3]) != rst.getValue(columns[4])) {
				        	 San.push( rst.getValue(columns[4]) );
				        	 if(servAddIds.indexOf( rst.getValue(columns[4]) ) == -1)
				        		 servAddIds.push( rst.getValue(columns[4]) );
				         }

			        	 SoArray[SOid] = {
				            'internalid': SOid,
				            'count' : Sas.length,
				            'Sas' : Sas,
				            'San' : San
				          };
			         }
		        // ------- Service Address<
		          }
		          return true;
		        }); // Run...


		        //---- Search all unique servAddIds
		        if(!typeAction){
		        	var newSoArray;

		        	getAllServiceAddressCities ();

		        	for(var so in SoArray){
		        		var SOcities = '';
		        		SoArray[so]['San'].forEach(function(sa){
		        			if(citiesIds[sa])
		        				if( SOcities.indexOf( citiesIds[sa]['city'] ) == -1)
		        					SOcities += citiesIds[sa]['city']+' ';
		        		});
		        		SoArray[so]['Cities'] = SOcities;
		        	};

		        	//-- log.debug ({title: 'getMySalesOrders SA_Cities', details: SoArray });
		        	//-- log.debug ({title: 'getMySalesOrders citiesIds', details: citiesIds });
		        }

		        return SoArray;
		    } // End Function....


			//------------------


			if(IdUser == 'CurrentUser' || IdUser == "" || IdUser == undefined){
				IdUser = runtime.getCurrentUser().id;
				if (auditId>0) IdUser = auditId;
			}

			var intVal = function(i) { return typeof i === 'string' ? i.replace(/[\$,]/g, '') * 1 : typeof i === 'number' ? i : 0; };

			function isInteger(x) { return x % 1 === 0;}

			var Rows = [];
			var AllInternalId = [];
			var theCont = 0;
			var intercont = 0;

			function processFilter(pmProject) {

				var filters = [],
					columns=[],
					mySearch;

				filters.push(search.createFilter({name: 'mainline',join: 'custevent_kpi_sales_order',operator: search.Operator.IS,values: true}));

//				if(WF_DEBUG)
//					log.debug ({title: 'getMySalesOrders anySOStatus', details: {'anySOStatus':anySOStatus, 'type': typeof anySOStatus} });


				var defaultMainStatus =['SalesOrd:B','SalesOrd:D','SalesOrd:E'];
				var defaultCustomStatus =[1,6];

				var vfStatus = anySOStatus.split(",");
				var fStatus = [];
				var taskStatus = [];
				var taskACK = [];
				var orderStatus = []; // custbody_tt_ordertype ... custbody_est_ovta

			if(!nameSo){

				if(IdUser != 'NotUser'){

					if(pmProject){
						IdUser = getProjectManagerId(IdUser);
						if(IdUser)
							filters.push(search.createFilter({name: 'custbody_project_manager', join: 'custevent_kpi_sales_order', operator: search.Operator.IS,values: IdUser}));
						else
							return false;
					}
					else {
						if(IdUser == 'AllMyTeam'){
							// Search employes subordinates
							myTeam =  getMyTeam(); // allways include minimum current user or audit id.
							filters.push(search.createFilter({name: 'assigned',operator: search.Operator.ANYOF,values: myTeam }));
						} else
							filters.push(search.createFilter({name: 'assigned',operator: search.Operator.ANYOF,values: IdUser}));
					}
				}

				if(vfStatus.length) {

					vfStatus.forEach(function(e){
						if(isInteger(e)){
							if (e < 1000) {
								taskStatus.push(e);
							} else if (e < 2000) {
								if(e==1001)
									taskACK.push('T');
								else
									taskACK.push('F');
							} else if (e >= 2000) {
								orderStatus.push(e - 2000);
							}
						}else{
							fStatus.push(e);
						}
					});
				}

				if (anySOStatus == 'OnPageLoad') {
					// At load start,  it shows only the E status
					filters.push(search.createFilter({name: 'status',join: 'custevent_kpi_sales_order',operator: search.Operator.ANYOF, values:defaultMainStatus}));
					// filters.push(search.createFilter({name: 'custbody_est_ovta',join: 'custevent_kpi_sales_order',operator: search.Operator.ANYOF, values:defaultCustomStatus}));
				}
				else if(anySOStatus == 'SomeSOStatus'){
					// Load all orders Tab called Sales Order; we show the status: B, D, E
						filters.push(search.createFilter({name: 'status',join: 'custevent_kpi_sales_order',operator: search.Operator.ANYOF, values: defaultMainStatus }));
						// filters.push(search.createFilter({name: 'custbody_est_ovta',join: 'custevent_kpi_sales_order',operator: search.Operator.ANYOF, values:defaultCustomStatus}));

				}else if(anySOStatus == 'AllSOStatus'){
					// Load all orders Tab called Sales Order; we show the status: G, H
					//filters.push(search.createFilter({name: 'status',join: 'custevent_kpi_sales_order',operator: search.Operator.NONEOF, values: ['SalesOrd:G','SalesOrd:H'] }));
				}else{

					if (fStatus.length) {
						filters.push(search.createFilter({name: 'status',join: 'custevent_kpi_sales_order',operator: search.Operator.ANYOF, values: fStatus }));
					}
				}

				// Default SO with Task Active...Only when no searching for specific SO..
				//-- if(!taskStatus.length && !nameSo && anySOStatus!='OnPageLoad') taskStatus.push(1);
				if(taskStatus.length){
					// custevent_kpi_task_status // task status....
					filters.push(search.createFilter({name: 'custevent_kpi_task_status', operator: search.Operator.ANYOF, values:taskStatus}));
				}

				// custevent_kpi_ack // task acknowledge
				// Only include this if ack kength = 1, if are TWO ommiting... be cancelled one to the other
				if(taskACK.length == 1){
					taskACK = (taskACK[0]=='T');
					filters.push(search.createFilter({name: 'custevent_kpi_ack', operator: search.Operator.IS, values: taskACK }));
				}

				if(orderStatus.length){
					filters.push(search.createFilter({name: 'custbody_est_ovta',join: 'custevent_kpi_sales_order',operator: search.Operator.ANYOF, values:orderStatus}));
				}
			}

			if(nameSo)
				filters.push(search.createFilter({name: 'tranid',join: 'custevent_kpi_sales_order', operator: search.Operator.IS, values: nameSo}));
			//-- filters.push(search.createFilter({name: 'tranid',join: 'custevent_kpi_sales_order', operator: search.Operator.CONTAINS, values: nameSo}));

				// Columns INTERNAL ID [0]
				columns.push(search.createColumn({name: 'internalid',join: 'custevent_kpi_sales_order',sort: 'ASC',summary: search.Summary.GROUP}));
				// columns TRAN ID [1]
				columns.push(search.createColumn({ name: 'tranid',join: 'custevent_kpi_sales_order',summary: search.Summary.GROUP}));
				// Columns Entity ID [2]
				columns.push(search.createColumn({ name: 'entity',join: 'custevent_kpi_sales_order',summary: search.Summary.GROUP}));
				// Columns Description [3]
				columns.push(search.createColumn({ name: 'memo', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));
				// columns Days Since Approved [4]
				columns.push(search.createColumn({ name: 'custbody_approved_date', join: 'custevent_kpi_sales_order', function: 'ageInDays', summary: search.Summary.GROUP }));
				// columns Project Manager [5]
				columns.push(search.createColumn({ name: 'custbody_project_manager', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));
				// columns Sales Rep  [6]
				columns.push(search.createColumn({ name: 'salesrep', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));
				// columns MRR  [7]
				columns.push(search.createColumn({ name: 'custbody_total_mrc_usd', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));
				// columns NRR  [8]
				columns.push(search.createColumn({ name: 'custbodytotal_nrc_usd', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));
				// columns Project Manager [9]
				columns.push(search.createColumn({ name: 'custbody_prov_engineer', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));
				// columns Project Manager [10]
				columns.push(search.createColumn({ name: 'custbody_addresses_cities', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));
				// Pending Mrr [11]
				columns.push(search.createColumn({ name: 'custbody_mrc_pending_fulfillment_usd', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));
				// Pending Nrr [12]
				columns.push(search.createColumn({ name: 'custbody_nrc_pending_fulfillment_usd', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));
				// Status [13]
				columns.push(search.createColumn({ name: 'status', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));
				// Custom Status [14]
				columns.push(search.createColumn({ name: 'custbody_est_ovta', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));

				if(WF_DEBUG)
					log.debug({title: "getMySalesOrders filters", details: filters });

				mySearch = search.create({
					type: 'task',
					filters: filters,
					columns: columns,
				});

				var PS_a = 500;

				if(runtime.getCurrentUser().id == 75401 ||
				   runtime.getCurrentUser().id == 75404 ||
				   runtime.getCurrentUser().id == 77739
				   ) PS_a = 1000;

				var pagedData = mySearch.runPaged({ pageSize: PS_a});

				var pageSearch = function(pageRange)
				{
					var page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function(result)
					{
						theCont++;
						var internalid = result.getValue(columns[0]);

						if(AllInternalId.indexOf(internalid)== -1) {
							var ArrayItem = [0,0]; // getItemsAndServAddresses(result.getValue(columns[0]),'Item');
							AllInternalId.push(internalid);
							Rows.push({
								"internalid": internalid, // Internal Id
								"tranid": result.getValue(columns[1]), // Tranid
								"customer": result.getText(columns[2]), // customer
								"description": result.getValue(columns[3]), // SO Memo
								"DaysSinceApproved": result.getValue(columns[4]), // Age in days
								"ProjectManager": result.getText(columns[5]),
								"SalesRep": result.getText(columns[6]),
								"MRR": result.getValue(columns[7]),
								"NRR": result.getValue(columns[8]),
								"provengineer": result.getText(columns[9]),
								"addrcities": result.getValue(columns[10]),
								"soItems": 0,
								"soSA": 0,
								"soSAname": '',
								"PendingMRR": result.getValue(columns[11]),
								"PendingNRR": result.getValue(columns[12]),
								"sostatus": result.getValue(columns[13]),
								"CustomSotatus": result.getText(columns[14]),
								"DeliveryDate": 0,
								});
						}
						return true;
					});

				} // pageSearch...

				var getTotalM = function(pageRange)
				{
					var TotalMrr = 0;
					var TotalNrr = 0;
					var TotalPendingMrr = 0;
					var TotalPendingNrr = 0;
					mySearch.run().each(function(result)
					{
						TotalMrr =  TotalMrr + intVal(result.getValue(columns[7]));
						TotalNrr =  TotalNrr + intVal(result.getValue(columns[8]));
						TotalPendingMrr =  TotalPendingMrr + intVal(result.getValue(columns[11]));
						TotalPendingNrr =  TotalPendingNrr + intVal(result.getValue(columns[12]));
						return true;
					});

					return {'MRR' : TotalMrr,'NRR' : TotalNrr,
						'PendingMRR' :TotalPendingMrr,
						'PendingNRR' : TotalPendingNrr
						};
				}

				var Total = getTotalM();

				if(pagedData.count>0){
					if (PageSelected < pagedData.pageRanges.length)
						pageSearch(pagedData.pageRanges[PageSelected]);
				}

				return [pagedData.count,Total,pagedData.pageRanges.length];
			} // Process Filter

			var contt = 0;
			contt = processFilter(false);

			// - Params.response.write(JSON.stringify([contt[0],Rows,contt[1]]));

			var NewRows = [];
			var AllItems = {};
	        var AllAddress = {};

			if(Rows.length){
		          AllItems = getItemsAndServAddressesAll(AllInternalId,'Item');
		          AllAddress = getItemsAndServAddressesAll(AllInternalId,'Serv');

		          Rows.forEach(function(row){
		        	  if(AllItems[row.internalid]){
		        		  row.soItems = AllItems[row.internalid].count;
		                  row.DeliveryDate = AllItems[row.internalid].EstimatedDate;
		        	  }
		        	  if(AllAddress[row.internalid]){
		        		  row.soSA = AllAddress[row.internalid].count;
		        		  //row.soSAname = String(AllAddress[row.internalid].San);
		        		  row.soSAname = AllAddress[row.internalid].Cities;
		        	  }
		        	  NewRows.push(row);
		          });
		      }

			// Params.response.write(JSON.stringify([contt[0],NewRows,contt[1],AllItems,AllAddress]));

			if(WF_DEBUG)
				log.debug({title: "getMySalesOrders results", details: { 'Rows':contt[0],  'Total Rows':contt[1], 'Pages Total':contt[2] } });

			Params.response.write(JSON.stringify([contt[0], NewRows, contt[1], contt[2]]));

		}
//---- getMySalesOrders<



//---- getTaskPredecessor>
		module.actions['getTaskPredecessor'] = function (Params){
			var allResults = [];
			var pred_id = Params.request.parameters['id'];

			var SearchPredecessor = search.create({
				type : "task",
				columns : ["internalid","startdate","duedate","title"],
				filters: ["internalid","is", pred_id ]
			});
			// (Params.request.parameters['id']=="" || 
			// Params.request.parameters['id']==undefined) ? 0 : parseInt(Params.request.parameters['id'])
			SearchPredecessor.run().each(function(result){
				var startdate = format.parse({ value: result.getValue({name: 'startdate'}), type: format.Type.DATE});
				var duedate = format.parse({ value: result.getValue({name: 'duedate'}), type: format.Type.DATE});
				allResults.push({
					"internalid":result.getValue({name: 'internalid'}),
					"title":result.getValue({name: 'title'}),
					"startdate":Date.parse(startdate),
					"duedate":Date.parse(duedate)
				});

				return true
			});

			Params.response.write( JSON.stringify(allResults) );
		}
//---- getTaskPredecessor<
		
		
		
//---- getTaskCurrentData>
		module.actions['getTaskCurrentData'] = function (Params){
			var allResults = [], theSO = {};
			var taskId = Params.request.parameters['id'];
			if (!taskId)
				Params.response.write( JSON.stringify(allResults) );

			var SearchTask = search.create({
				type : "task",
				columns : ["internalid","startdate","duedate","title","assigned","custevent_kpi_ack",
						"custevent_kpi_planned_startdate", "custevent_kpi_planned_duedate", 
						"custevent_kpi_planned_duration","custevent_kpi_duration",
						"custevent_kpi_work_on_weekend","custevent_kpi_wrike_id","custevent_kpi_task_status",
						"custevent_kpi_sales_order"],
				filters: ["internalid","is", taskId ]
			});
			
			SearchTask.run().each(function(result){
				allResults.push({
					"internalid"	: result.getValue({name: 'internalid'}),
					"title"			: result.getValue({name: 'title'}),
					"assigned"		: result.getValue({name: 'assigned'}),
					"assigned_n"	: result.getText ({name: 'assigned'}),
					"startdate"		: result.getValue({name: 'startdate'}),
					"duedate"		: result.getValue({name: 'duedate'}),
					"acknowledge" 	: result.getValue({name: 'custevent_kpi_ack'}),
					"duration" 		: result.getValue({name: 'custevent_kpi_duration'}),
					"wonw" 			: result.getValue({name: 'custevent_kpi_work_on_weekend'}),
					"wrikeid" 		: result.getValue({name: 'custevent_kpi_wrike_id'}),
					"status" 		: result.getValue({name: 'custevent_kpi_task_status'}),
					"soid" 			: result.getValue({name: 'custevent_kpi_sales_order'}),
					"soname" 		: result.getText ({name: 'custevent_kpi_sales_order'}),
					"planned_startdate" : result.getValue({name: 'custevent_kpi_planned_startdate'}),
					"planned_duedate" : result.getValue({name: 'custevent_kpi_planned_duedate'}),
					"planned_duration" : result.getValue({name: 'custevent_kpi_planned_duration'}),
				});
				return true
			});
			
			//----- Get All SalesOrders name...
			function GetSalesOrdersName(SOinvolved){
				var searchNso = search.create({
					type : 'transaction',
					filters : [['mainline','is','T'],'and',['internalid','is',SOinvolved]],
					columns : ['tranid','internalid','entity','memo','custbody_vtas_condcom']
				});

				searchNso.run().each(function(res){
					theSO = {
						'tso_id': res.getValue('internalid'),
						'tso_entI': res.getValue('entity'),
						'tso_entN': res.getText('entity'),
						'tso_label': res.getValue('tranid'),
						'tso_memo': res.getValue('memo'),
						'tso_memc': res.getValue('custbody_vtas_condcom'),
					};
				});
			}
			//----- Get successors for this task, used to send alerts...
			function GetSuccessorsMailers(){
				var SearchSucc, SearchSuccFilters = [], columnsA = [], resultTaskA = [];
				
				var IDType	= 'customrecord_task_successor', 
					IdParent= 'custrecord_ts_parent',
					IdField	= 'custrecord_ts_successor';
				
				columnsA = ['internalid' , IdField , 'custrecord_ts_assigned',
							'custrecord_ts_startdate', 'custrecord_ts_duedate',
							'custrecord_ts_duration','custrecord_ts_successor' ];

				columnsA.push(search.createColumn({
							name:'custevent_kpi_task_status',
							join:'custrecord_ts_successor'
						})); // column 7

				SearchSuccFilters.push([IdParent, search.Operator.IS, taskId ]);

				SearchSucc = search.create({type: IDType ,filters: SearchSuccFilters, columns: columnsA});

				SearchSucc.run().each(function(rsucc){
					resultTaskA.push({
							'internalid': rsucc.getValue({name: 'internalid'}) ,
							'title' 	: rsucc.getText ({name: IdField}) ,
							'assigned'	: rsucc.getText ({name: 'custrecord_ts_assigned'}) ,
							'assigned_id':rsucc.getValue({name: 'custrecord_ts_assigned'}) ,
							'startdate' : rsucc.getValue({name: 'custrecord_ts_startdate'}) ,
							'duedate'	: rsucc.getValue({name: 'custrecord_ts_duedate'}) ,
							'duration'	: rsucc.getValue({name: 'custrecord_ts_duration'}),
							'idTask'	: rsucc.getValue({name: 'custrecord_ts_successor'}),
							'status'	: rsucc.getText (columnsA[7]),
							'status_id'	: rsucc.getValue(columnsA[7])
						});
					return true;
				});
				return resultTaskA
			}
			//-----------------------------
			if ( allResults.length ) {
				GetSalesOrdersName(allResults[0].soid);
				allResults[0]['theSO'] = theSO;
				allResults[0]['Successors'] = GetSuccessorsMailers();
			}

			Params.response.write( JSON.stringify(allResults) );
		}
//---- getTaskCurrentData<
		


//---- getTasksTable>
		module.actions['getTasksTable'] = function (Params){
			var SeeWhatMode = Params.request.parameters['kpiordersale'];
			var SeeWhatOrderSale = Params.request.parameters['WhichSalesOrder'];
			var selectPage = Params.request.parameters['selectPage'];
			var isPm = Params.request.parameters ['pm'];

			var arrSearch;
			var arrSearchFilters=[];
			var count = 0;
			var results =[];
			var isTheLast = false;

			function createpicker (date,i,id){
				date = format.format ({
					value : date,
					type: format.Type.DATE
				});
				if (i == "StartDate_"){
					return '<div> <input type="text" class="toDatePicker1" onchange="" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
				}else if (i =="DueDate_"){
					return '<div> <input type="text"  class="toDatePicker1" onchange="" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
				}
			}
			function formatDate(date) {
				var d = new Date(date),
						month = '' + (d.getMonth() + 1),
						day = '' + d.getDate(),
						year = d.getFullYear();

				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;

				return [year,month,day].join('-');
			}
			function DateMMDDYYYY (date){
				return  format.parse ({
					value : date,
					type: format.Type.DATE
				});
			}

			function datedTaskYellow (date){
				var parsedDate = DateMMDDYYYY(date);
				var today = new Date();

				var days = ( ( ( (parsedDate - today) / 1000) / 60) / 60) / 24 ;

				if ( days <= 5 && days > 0){
					return true;
				}else { return false; }
			}

			function outdatedTask (date){
				var parsedDate = DateMMDDYYYY(date).setHours(0,0,0,0);
				var today = new Date().setHours(0,0,0,0);


				if(today < parsedDate){
					return false;
				}else{
					return true; // We will then set the background of the task row to red color
				}
			}

			function parseada (date){
				var parsDate = DateMMDDYYYY(date).setHours(0,0,0,0);
				var today = new Date().setHours(0,0,0,0);
				return parsDate + '  ' + today;
			}

			function stringselect (statu,statussearch){
				var string = '<select id="idStatusTask">';
				statussearch.run().each(function(result){
					if(statu == result.getValue('name')){
						string = string + '<option value="'+result.getValue('internalid')+'"  selected="selected" >'+result.getValue('name')+'</option>';
					}else{
						string = string + '<option value="'+result.getValue('internalid')+'">'+result.getValue('name')+ '</option>';
					}
					return true ;
				});
				string = string + '</select>';
				return string;
			}

			arrSearchFilters.push(search.createFilter({
				name: 'custevent_kpi_sales_order',
				operator: search.Operator.ANYOF,
				//values: [ (Params.request.parameters['kpiordersale']=="" || Params.request.parameters['kpiordersale']==undefined) ? 329071 : parseInt(Params.request.parameters['kpiordersale']) ]
				values: SeeWhatOrderSale
			}));

			if(!isPm){
				arrSearchFilters.push(search.createFilter({
					name: 'assigned',
					operator: search.Operator.ANYOF,
					values: runtime.getCurrentUser().id
				}));
			}
			var due = search.createColumn({name: 'duedate',	sort: search.Sort.ASC});

			arrSearch = search.create({
				type: 'task',
				filters: arrSearchFilters,
				columns: ['internalid','custevent_kpi_wrike_id','custevent_kpi_wrike_permalink',
				'custevent_kpi_ack','custevent_kpi_task_status','custevent_kpi_current_dependency',
				'title','assigned','custevent_kpi_work_on_weekend','startdate',due,'custevent_kpi_duration',
				'custevent_kpi_ack','custevent_kpi_item','custevent_kpi_item_line','custevent_kpi_service_address',
				'custevent_kpi_task_status','custevent_kpi_planned_startdate','custevent_kpi_task_status',
				'custevent_kpi_planned_duedate', 'custevent_kpi_current_predecessor','custevent_kpi_task_type']

			});
			var allRows = 0;
			//arrSearch.run().each(function(result){ allRows++; });
			//allRows = arrSearch.run().pa;

			var pagedData = arrSearch.runPaged({ pageSize: 1000});
			var salesOrders = [{ text: '', value: '' }]; // Default values

			var test = function(pageRange)
			{
				if(pageRange){
					var page = pagedData.fetch({ index: pageRange.index });
					page.data.forEach(function(result)
					{
						count++;
						//isTheLast = page.isLast;
						//var IsWorkOnWeekend = result.getValue({name: 'custevent_kpi_work_on_weekend'});
						results.push
						({
							'selectPage' 		: selectPage,
							'taskId'			: result.getValue({name: 'internalid'}),
							'taskTitle'			: result.getValue({name: 'title'}), //Merge
							'taskKpiItem'		: result.getValue({name: 'custevent_kpi_item'}),
							'taskKpiLine'		: result.getValue({name: 'custevent_kpi_item_line'}),
							'taskKpiAddress'	: result.getValue({name: 'custevent_kpi_service_address'}),
							'taskAssigned'		: result.getText({name: 'assigned'}),
							'taskAssignedID'	: result.getValue({name: 'assigned'}),
							'taskStartDate'		: createpicker((result.getValue({name: 'startdate'})),'StartDate_','StartDate_'+count),
							'taskDueDate'		: createpicker((result.getValue({name: 'duedate'})),'DueDate_','DueDate_'+count),
							'taskWorkWeekend'	: result.getValue({name: 'custevent_kpi_work_on_weekend'}),
							'taskDuration'		: result.getValue({name: 'custevent_kpi_duration'}),
							'taskDependency'	: result.getValue({name: 'custevent_kpi_current_dependency'}),
							'taskStatus'		: result.getValue({name: 'custevent_kpi_task_status'}), /// Merge
							'taskAck'			: result.getValue({name: 'custevent_kpi_ack'}),  			/// Merge
							'taskPredecessor'	: result.getValue({name: 'custevent_kpi_current_predecessor'}),
							'test' 				: result.getValue({name: 'startdate'}),
							'GlobalStartDate'	: formatDate(DateMMDDYYYY(result.getValue({name: 'startdate'}))),
							'GlobalDueDate' 	: result.getValue({name: 'duedate'}),
							'WrikeLink' 		: result.getValue({name: 'custevent_kpi_wrike_permalink'}),
							'WrikeID' 			: result.getValue({name: 'custevent_kpi_wrike_id'}),
						'setColortoRedOutDated'	: outdatedTask( String(result.getValue({name: 'duedate'})) ),
							'datoparseada'		: parseada( String (result.getValue({name: 'startdate'})) ),
							'yellow'			: datedTaskYellow( String (result.getValue({name: 'duedate'})) ),
							'KpiTaskType' 		: result.getValue('custevent_kpi_task_type'),
						});

					});
				}
			};

			if(pagedData.count>0){
				for(var it =0; it<=selectPage; it++)
				 test(pagedData.pageRanges[it]);
			}

			Params.response.write( JSON.stringify([pagedData.count, results, pagedData.pageRanges.length]) );
		};
//---- getTasksTable<





//---- getTasksTablev2>
		module.actions['getTasksTablev2'] = function (Params){
			var WF_DEBUG = false;
			var SeeWhatOrderSale = Params.request.parameters['WhichSalesOrder'];
			var selectedPage = Params.request.parameters['selectPage'];
			var auditId = Params.request.parameters['auditId'];
			var theTeam = Params.request.parameters['theTeam'];
			var count = 0,
				arrSearch,
				arrSearchFilters = [];
			var results = [];
			
			if(WF_DEBUG)
				log.debug({title: "getTasksTablev2 Params", details: Params.request.parameters });
			
			function createpicker2(date, i, id) {
				date = format.format ({
					value : date,
					type: format.Type.DATE
				});
				if(i == "StartDate_") {
					return '<div> <input type="text" onchange="" class="toDatePicker2" id="idPicker_' + id + '" value="' + date + '" data-old="' + date + '" /> </div><p style="font-size:0px;position:absolute;">' + date + '</p>';
				} else if(i == "DueDate_") {
					return '<div> <input type="text" onchange="" class="toDatePicker2" id="idPicker_' + id + '" value="' + date + '" data-old="' + date + '" /> </div><p style="font-size:0px;position:absolute;">' + date + '</p>';
				}
			}
			
			function createpicker(date, i, id) {
				if(i == "StartDate_") {
					return '<input type="text" onchange="" class="toDatePicker2" id="idPicker_' + id + '" value="' + date + '" data-old="' + date + '" />';
				} else if(i == "DueDate_") {
					return '<input type="text" onchange="" class="toDatePicker2" id="idPicker_' + id + '" value="' + date + '" data-old="' + date + '" />';
				}
			}

			function formatDate(date) {
				var d = new Date(date),
					month = '' + (d.getMonth() + 1),
					day = '' + d.getDate(),
					year = d.getFullYear();
				if(month.length < 2) month = '0' + month;
				if(day.length < 2) day = '0' + day;
				return [year, month, day].join('-');
			}

			function formatToDates(date) {
				var d = new Date(date),
					month = '' + (d.getMonth() + 1),
					day = '' + d.getDate(),
					year = d.getFullYear();
				if(month.length < 2) month = '0' + month;
				if(day.length < 2) day = '0' + day;
				return [day, month, year].join('/');
			}

			function DateMMDDYYYY(date) {
				var parseDate = format.parse({
					value: date,
					type: format.Type.DATE
				});
				return parseDate;
			}

			function datedTaskYellow (date){
				var parsedDate = DateMMDDYYYY(date);
				var today = new Date();

				var days = ( ( ( (parsedDate - today) / 1000) / 60) / 60) / 24 ;

				if ( days <= 5 && days > 0){
					return true;
				}else { return false; }
			}

			function outdatedTask (date){
				var parsedDate = DateMMDDYYYY(date).setHours(0,0,0,0);
				var today = new Date().setHours(0,0,0,0);

				if(today < parsedDate)
					return false;
				else
					return true; // We will then set the background of the task row to red color

			}

			function parseada (date){
				var parsDate = DateMMDDYYYY(date).setHours(0,0,0,0);
				var today = new Date().setHours(0,0,0,0);
				return parsDate + '  ' + today;
			}


			function FormatFormat(date) {
				return format.format({ value: date, type: 'date' });
				// return parseDate;
			}

			function stringselect(statu, statussearch) {
				var string = '<select id="idStatusTask" >';
				statussearch.run().each(function(result) {
					if(statu == result.getValue('name')) {
						string = string + '<option value="' + result.getValue('internalid') + '" selected="selected" >' + result.getValue('name') + '</option>';
					} else {
						string = string + '<option value="' + result.getValue('internalid') + '">' + result.getValue('name') + '</option>';
					}
					return true;
				});
				string = string + '</select>';
				return string;
			}
			
			arrSearchFilters.push(search.createFilter({
				name: 'custevent_kpi_sales_order',
				operator: search.Operator.ANYOF,
				values: SeeWhatOrderSale
			}));

			var assignedTo = Params.request.parameters['assignedTo'];
			if(assignedTo != 'notuser0') {
				if(assignedTo == 'AllMyTeam') {
					assignedTo = JSON.parse(theTeam);
					// Void Errors...
					/* {"type":"error.SuiteScriptError","name":"SSS_INVALID_SRCH_OPERATOR",
						"message":"Un nlobjSearchFilter contiene un operador no válido o la sintaxis no es correcta: assigned.",
						"stack":["create(N/searchPaging)",
							"<anonymous>(/SuiteScripts/TTScripts_2_0/WorkForce/SST_SL_RT_taskinator.js:1949)",
							"onRequest(/SuiteScripts/TTScripts_2_0/WorkForce/SST_SL_RT_taskinator.js:5528)"]," */
					if (assignedTo && assignedTo.length < 1)
						assignedTo = runtime.getCurrentUser().id;
				} else if(assignedTo == 'onlymytasks' || !assignedTo) {
					if (auditId)
						assignedTo = auditId;
					else
						assignedTo = runtime.getCurrentUser().id;
				} else {
					// Just leave as is.
				}
				arrSearchFilters.push(search.createFilter({
					name: 'assigned',
					operator: search.Operator.ANYOF,
					values: assignedTo
				}));
			} // end of if

			var Status = Params.request.parameters['StatusId'];
			if(Status != 'notstatus') {
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_task_status',
					operator: search.Operator.IS,
					values: Status
				}));
			} // end of if

			var DepartmentTo = Params.request.parameters['DepartmentTo'];
			if(DepartmentTo != 'notuser0') {
				//if (DepartmentTo == 'onlymytasks') { DepartmentTo = runtime.getCurrentUser().id }
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_department',
					operator: search.Operator.ANYOF,
					values: DepartmentTo
				}));
			} // end of if

			var regex = new RegExp("-", "g");
			// Add filter to dates between startDate and DueDate
			if(Params.request.parameters['StartDate'] != '') {
				// var StartDate = FormatFormat(Params.request.parameters['StartDate']);
				var StartDate = FormatFormat(new Date ((Params.request.parameters['StartDate']).replace(regex,'/')));
				arrSearchFilters.push(search.createFilter({
					name: 'startdate',
					operator: search.Operator.ONORAFTER,
					values: StartDate
				}));
			}
			
			if(Params.request.parameters['DueDate'] != '') {
				// var DueDate = FormatFormat(Params.request.parameters['DueDate']);
				var DueDate = FormatFormat(new Date((Params.request.parameters['DueDate']).replace(regex,'/')));
				// var DueDate = new Date(Params.request.parameters['DueDate']);
				arrSearchFilters.push(search.createFilter({
					name: 'enddate',
					operator: search.Operator.ONORBEFORE,
					values: DueDate
				}));
			}
			
			/*
			var Wow = Params.request.parameters['WoW'];
			arrSearchFilters.push(search.createFilter({
				name: 'custevent_kpi_work_on_weekend',
				operator: search.Operator.IS,
				values: Wow
			}));
			*/
			
			//--- include only if specified true or false
			var Wow2 = Params.request.parameters['WoW2'];
			if (Wow2 == 2)
			arrSearchFilters.push(search.createFilter({
				name: 'custevent_kpi_work_on_weekend',
				operator: search.Operator.IS,
				values: true
			}));
			if (Wow2 == 3)
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_work_on_weekend',
					operator: search.Operator.IS,
					values: false
				}));
			//----
			
			var FD = Params.request.parameters['FD'];
			var TD = Params.request.parameters['TD'];
			if(FD != '-') {
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_duration',
					operator: search.Operator.GREATERTHANOREQUALTO,
					values: FD
				}));
			}
			if(TD != '-') {
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_duration',
					operator: search.Operator.LESSTHANOREQUALTO,
					values: TD
				}));
			}
			
			var Item;
			
			if(Params.request.parameters['itemId']) {
				Item = String(Params.request.parameters['itemId']).split('_');
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_item_line',
					operator: search.Operator.EQUALTO,
					values: Item[0]
				}));
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_item',
					operator: search.Operator.IS,
					values: Item[1]
				}));
			}
			
			if(Params.request.parameters['idAdress']) {
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_service_address',
					operator: search.Operator.IS,
					values: Params.request.parameters['idAdress']
				}));
			}
			
			if(WF_DEBUG)
				log.debug({title: "getTasksTablev2 filters", details: arrSearchFilters });

			var due = search.createColumn({name: 'duedate',	sort: search.Sort.ASC});
			
			arrSearch = search.create({
				type: 'task',
				filters: arrSearchFilters,
				columns: ['internalid','custevent_kpi_wrike_id','custevent_kpi_wrike_permalink',
					'custevent_kpi_ack', 'custevent_kpi_task_status', 'custevent_kpi_current_dependency',
					'title', 'assigned', 'custevent_kpi_work_on_weekend', 'startdate', due, 'custevent_kpi_task_type',
					'custevent_kpi_duration', 'custevent_kpi_ack', 'custevent_kpi_item', 'custevent_kpi_item_line',
					'custevent_kpi_service_address', 'custevent_kpi_task_status', 'custevent_kpi_planned_startdate',
					'custevent_kpi_task_status', 'custevent_kpi_planned_duedate', 'custevent_kpi_current_predecessor',
					'custevent_kpi_sales_order']

			});

			var pagedData = arrSearch.runPaged({ pageSize: 1000});

			var pageSearch = function(pageRange)
			{
				var page = pagedData.fetch({ index: pageRange.index });
				page.data.forEach(function(result)
				{
					count++;
				//	isTheLast = page.isLast;
				//	var IsWorkOnWeekend = result.getValue({name: 'custevent_kpi_work_on_weekend'});
					results.push({
						'selectPage' 		: selectedPage,
						'taskId'			: result.getValue({name: 'internalid'}),
						'taskTitle'			: result.getValue({name: 'title'}),
						'taskKpiItem'		: result.getValue({name: 'custevent_kpi_item'}),
						'taskKpiLine'		: result.getValue({name: 'custevent_kpi_item_line'}),
						'taskKpiAddress'	: result.getValue({name: 'custevent_kpi_service_address'}),
						'taskAssigned'		: result.getText({name: 'assigned'}),
						'taskAssignedID'	: result.getValue({name: 'assigned'}),
						'taskStartDate'		: createpicker(((result.getValue({name: 'startdate'}))),'StartDate_','StartDate_'+count),
						'taskDueDate'		: createpicker(((result.getValue({name: 'duedate'}))),'DueDate_','DueDate_'+count),
						'taskWorkWeekend'	: result.getValue({name: 'custevent_kpi_work_on_weekend'}),
						'taskDuration'		: result.getValue({name: 'custevent_kpi_duration'}),
						'taskDependency'	: result.getValue({name: 'custevent_kpi_current_dependency'}),
						'taskStatus'		: result.getValue({name: 'custevent_kpi_task_status'}), /// Merge
						'taskAck'			: result.getValue({name: 'custevent_kpi_ack'}),  			/// Merge
						'taskPredecessor'	: result.getValue({name: 'custevent_kpi_current_predecessor'}),
						'test' 				: result.getValue({name: 'startdate'}),
						'GlobalStartDate'	: formatDate(DateMMDDYYYY(result.getValue({name: 'startdate'}))),
						'GlobalDueDate' 	: result.getValue({name: 'duedate'}),
						'WrikeLink'			: result.getValue({name: 'custevent_kpi_wrike_permalink'}),
						'WrikeID' 			: result.getValue({name: 'custevent_kpi_wrike_id'}),
					'setColortoRedOutDated' : outdatedTask( String(result.getValue({name: 'duedate'})) ),
						'datoparseada'		: parseada( String (result.getValue({name: 'startdate'})) ),
						// 'yellow'			: datedTaskYellow( String (result.getValue({name: 'duedate'})) )
						'ConStartDate'		: StartDate,
						'ConEndDate'		: DueDate,
						'Item'				: Item,
						'KpiTaskType' 		: result.getValue('custevent_kpi_task_type'),
						'SalesOrderID' 		: result.getValue('custevent_kpi_sales_order'),

					});

				});
			};

			if(pagedData.count>0){
				if (selectedPage < pagedData.pageRanges.length)
					pageSearch(pagedData.pageRanges[selectedPage]);
			}

			Params.response.write( JSON.stringify({'rowscount':pagedData.count, 'rows':results, 'pagescount': pagedData.pageRanges.length}) );

			//return JSON.stringify(results);
		};
//---- getTasksTablev2<



//---- getTasksTableObj>
		module.actions['getTasksTableObj'] = function (Params){
			var SeeWhatMode = Params.request.parameters['kpiordersale'];
			var isPm = Params.request.parameters ['pm'];
			var SeeWhatOrderSale = Params.request.parameters['WhichSalesOrder'];
			var selectPage = Params.request.parameters['selectPage'];
			var arrSearch,
				arrSearchFilters=[],
				count = 0,
				isTheLast = false;
			var results =[];

			function dateToNetSuiteUserFormat(date){
				return format.format ({
					value : date,
					type: format.Type.DATE
				});
			}

			arrSearchFilters.push(search.createFilter({
				name: 'custevent_kpi_sales_order',
				operator: search.Operator.ANYOF,
				values: SeeWhatOrderSale
			}));

			if(!isPm){
				arrSearchFilters.push(search.createFilter({
					name: 'assigned',
					operator: search.Operator.ANYOF,
					values: runtime.getCurrentUser().id
				}));
			}

			var due = search.createColumn({name: 'duedate',	sort: search.Sort.ASC});

			arrSearch = search.create({
				type: 'task',
				filters: arrSearchFilters,
				columns: [
							'internalid','custevent_kpi_wrike_id','custevent_kpi_wrike_permalink',
							'custevent_kpi_ack','custevent_kpi_task_status','custevent_kpi_current_dependency',
							'title','assigned','custevent_kpi_work_on_weekend','startdate',due,
							'custevent_kpi_duration','custevent_kpi_ack','custevent_kpi_item',
							'custevent_kpi_item_line','custevent_kpi_service_address',
							'custevent_kpi_task_status','custevent_kpi_planned_startdate',
							'custevent_kpi_task_status','custevent_kpi_planned_duedate',
							'custevent_kpi_current_predecessor','custevent_kpi_task_type'
						]
			});

			var allRows = 0;

				var pagedData = arrSearch.runPaged({ pageSize: 1000});
				var salesOrders = [{ text: '', value: '' }]; // Default values

				var getThisPage = function(pageRange)
				{
					if(pageRange){
						var page = pagedData.fetch({ index: pageRange.index });
						page.data.forEach(function(result){
							count++;
							results.push
							({
								'taskId': 			result.getValue({name: 'internalid'}),
								'taskTitle': 		result.getValue({name: 'title'}), //Merge
								'taskKpiItem': 		result.getValue({name: 'custevent_kpi_item'}),
								'taskKpiLine': 		result.getValue({name: 'custevent_kpi_item_line'}),
								'taskKpiAddress': 	result.getValue({name: 'custevent_kpi_service_address'}),
								'taskAssigned': 	result.getText({name: 'assigned'}),
								'taskAssignedID': 	result.getValue({name: 'assigned'}),
								'taskStartDate': 	dateToNetSuiteUserFormat(result.getValue({name: 'startdate'})),
								'taskDueDate': 		dateToNetSuiteUserFormat(result.getValue({name: 'duedate'})),
								'taskWorkWeekend': 	result.getValue({name: 'custevent_kpi_work_on_weekend'}),
								'taskDuration': 	result.getValue({name: 'custevent_kpi_duration'}),
								'taskDependency': 	result.getValue({name: 'custevent_kpi_current_dependency'}),
								'taskStatus': 		result.getValue({name: 'custevent_kpi_task_status'}), /// Merge
								'taskAck': 			result.getValue({name: 'custevent_kpi_ack'}),  			/// Merge
								'taskPredecessor':	result.getValue({name: 'custevent_kpi_current_predecessor'}),
								'WrikeLink' : 		result.getValue({name: 'custevent_kpi_wrike_permalink'}),
								'WrikeID' : 		result.getValue({name: 'custevent_kpi_wrike_id'}),
								'KpiTaskType' : 	result.getValue('custevent_kpi_task_type'),
							});

						});
					}
			};

			if(pagedData.count>0){
				if (selectPage == 'all'){
					for(var it=0; it<pagedData.pageRanges; it++)
						getThisPage(pagedData.pageRanges[it]);
				} else {
					if (selectPage < pagedData.pageRanges.length)
						getThisPage(pagedData.pageRanges[selectPage]);
				}
			 }

			 Params.response.write( JSON.stringify({'rowscount':pagedData.count,'page':selectPage,'rows':results}) );
		};
//---- getTasksTableObj<




//---- getPredecessors>
		module.actions['getPredecessors'] = function(Params){
		/*  var IDType 		= Params.request.parameters['IDType'];
			var IdField 	= Params.request.parameters['IdField'];
			var IdParent 	= Params.request.parameters['IdParent']; */
			var WhichTask 	= Params.request.parameters['WhichTask'];
			var arrSearch, arrSearchFilters = [],columns = [], resultTask = [];
			
			var IDType		= 'customrecord_task_predecessor',
				IdField 	= 'custrecord_tp_predecessor',
				IdParent 	= 'custrecord_tp_parent';
			
			columns = [	'internalid', IdField, 'custrecord_tp_assigned',
						'custrecord_tp_startdate' , 'custrecord_tp_duedate',
						'custrecord_tp_duration', 'custrecord_tp_predecessor',
						'custrecord_tp_dependency_type' ];

			columns.push(search.createColumn({
						name:'custevent_kpi_task_status',
						join:'custrecord_tp_predecessor'
					})); // column 8
			
			var duedate_sort = search.createColumn({ name: 'custrecord_tp_duedate', sort: search.Sort.DESC });

			columns.push( duedate_sort ); // column 9
					
			arrSearchFilters.push([IdParent, search.Operator.IS, WhichTask]);

			arrSearch = search.create({type: IDType ,filters: arrSearchFilters,columns: columns});

			arrSearch.run().each(function(result){

				resultTask.push({
					'internalid' 	: result.getValue({name: 'internalid'}),
					'title'			: result.getText ({name: IdField}),
					'assigned' 		: result.getText ({name: 'custrecord_tp_assigned'})+'.',
					'startdate' 	: result.getValue({name: 'custrecord_tp_startdate'}),
					'duedate' 		: result.getValue(columns[9]),
					'duration' 		: result.getValue({name: 'custrecord_tp_duration'}),
					'idTask'		: result.getValue({name: 'custrecord_tp_predecessor'}),
				   'dependency_type': result.getText ({name: 'custrecord_tp_dependency_type'}),
					'status' 		: result.getText (columns[8]),
					'duedate_a' 	: result.getValue({name: 'custrecord_tp_duedate'}),
				});

				return true;
			});

			Params.response.write( (JSON.stringify(resultTask)) );
		};
//---- getPredecessors<

		
//---- getPredecessorsMulti>
		module.actions['getPredecessorsMulti'] = function(Params){
			var WhichTask 	= Params.request.parameters['WhichTask'];
			var arrSearch, arrSearchFilters = [],columns = [], resultTask = [], reltasks = {};
			
			var IDType		= 'customrecord_task_predecessor',
				IdField 	= 'custrecord_tp_predecessor',
				IdParent 	= 'custrecord_tp_parent';
			var WF_DEBUG = false;
			
			if(WF_DEBUG)
				log.debug({title: "getPredecessorsMulti Params", details: Params.request.parameters });
			
			columns = [	'internalid', IdField, 'custrecord_tp_assigned',
						'custrecord_tp_startdate' , 'custrecord_tp_duedate',
						'custrecord_tp_duration', 'custrecord_tp_predecessor',
						'custrecord_tp_dependency_type', 'custrecord_tp_parent' ];

			columns.push(search.createColumn({
						name:'custevent_kpi_task_status',
						join:'custrecord_tp_predecessor'
					})); // column 8
			
			var duedate_sort = search.createColumn({ name: 'custrecord_tp_duedate', sort: search.Sort.DESC });

			columns.push( duedate_sort ); // column 9
			
			WhichTask = JSON.parse(WhichTask);
					
			arrSearchFilters.push([IdParent, search.Operator.ANYOF, WhichTask]);
			
			if(WF_DEBUG)
				log.debug({title: "getPredecessorsMulti Filters", details: arrSearchFilters });

			arrSearch = search.create({type: IDType ,filters: arrSearchFilters, columns: columns});

			arrSearch.run().each(function(result){
				tsk = {
					'internalid' 	: result.getValue({name: 'internalid'}),
					'title'			: result.getText ({name: IdField}),
					'assigned' 		: result.getText ({name: 'custrecord_tp_assigned'})+'.',
					'startdate' 	: result.getValue({name: 'custrecord_tp_startdate'}),
					'duedate' 		: result.getValue(columns[10]),
					'duration' 		: result.getValue({name: 'custrecord_tp_duration'}),
					'idTask'		: result.getValue({name: 'custrecord_tp_predecessor'}),
				   'dependency_type': result.getText ({name: 'custrecord_tp_dependency_type'}),
					'status' 		: result.getText (columns[9]),
					'duedate_a' 	: result.getValue({name: 'custrecord_tp_duedate'}),
				};
				
				var taskId = 'T'+result.getValue({name: 'custrecord_tp_parent'});
				if (! reltasks[taskId]){
					reltasks[taskId] = [];
				}
				reltasks[taskId].push(tsk);
				return true;
			});

			Params.response.write( (JSON.stringify(reltasks)) );
		};
//---- getPredecessorsMulti<
		
		
		
//---- getTaskNotes>
		module.actions['getTaskNotes'] = function(Params){
			var WhichTask 	= ""+Params.request.parameters['WhichTask'];
			var tskNotes = [];

			columns = [	'internalid','title','notetype','direction','notedate','note' ];

			var notesSearchFilters =[];
			
			notesSearchFilters.push(
					search.createFilter({name: 'internalid', join:'task', operator: 'is', values: WhichTask}));
			
			var notedate = search.createColumn({ name: 'notedate', sort: search.Sort.DESC });

			var notesSearch = search.create({
					type: 'note',
					filters: notesSearchFilters,
					columns: [	'internalid','title','notetype','direction', notedate ,'note','author' ]
				});
			
			// First take all current notes on task...
			notesSearch.run().each(function(result){
				var tskNote = {
					'internalid': result.getValue ({name: 'internalid' }),
					'title'		: result.getValue ({name: 'title' }),
					'notetype'	: result.getText  ({name: 'notetype' }),
					'direction' : result.getText  ({name: 'direction' }),
					'day'		: result.getValue ({name: 'notedate' }),
					'note'		: result.getValue ({name: 'note' }),
					'author'	: result.getValue ({name: 'author' }),
					'author_n'	: result.getText  ({name: 'author' }),
				};
				tskNotes.push(tskNote);
				return true;
			});
		
			//-----

			Params.response.write( (JSON.stringify(tskNotes)) );
		};
//---- getTaskNotes<


		
//---- getTaskSystemNotes>
	module.actions['getTaskSystemNotes'] = function(Params){
		var WhichTask 	= ""+Params.request.parameters['WhichTask'];
		var tskNotes = [];
	
		columns = [	'internalid','title','notetype','direction','notedate','note' ];
	
		var notesSearchFilters =[];
		
		notesSearchFilters.push(
				search.createFilter({name: 'internalid', join:'task', operator: 'is', values: WhichTask})
			);
		
		var notedate = search.createColumn({name: 'notedate', sort: search.Sort.DESC});
	
		var notesSearch = search.create({
				type: 'note',
				filters: notesSearchFilters,
				columns: [	'internalid','title','notetype','direction', notedate ,'note','author' ]
			});
		
		// First take all current notes on task...
		notesSearch.run().each(function(result){
			var tskNote = {
				'internalid': result.getValue ({name: 'internalid' }),
				'title'		: result.getValue ({name: 'title' }),
				'notetype'	: result.getText  ({name: 'notetype' }),
				'direction' : result.getText  ({name: 'direction' }),
				'day'		: result.getValue ({name: 'notedate' }),
				'note'		: result.getValue ({name: 'note' }),
				'author'	: result.getValue ({name: 'author' }),
				'author_n'	: result.getText  ({name: 'author' }),
			};
			tskNotes.push(tskNote);
			return true;
		});
	
		//-----
	
		Params.response.write( (JSON.stringify(tskNotes)) );
	};
//---- getTaskSystemNotes<



//---- getPredesesorsBranch>
		module.actions['getPredesesorsBranch'] = function(Params){
	/*
	 * Tipical CALL parameters
	 * -----------------------
			IDType:"customrecord_task_predecessor",
			IdField:"custrecord_tp_predecessor",
			IdParent:"custrecord_tp_parent",
			WhichTask:"174769",
			action :"showPress",
	*/
			var IDType 		= "customrecord_task_predecessor";
			var IdField 	= "custrecord_tp_predecessor";
			var IdParent 	= "custrecord_tp_parent";
			var WhichTask 	= Params.request.parameters['WhichTask'];
			var resultAs 	= Params.request.parameters['resultAs'];
			var columns = [];
			var asDetails = (resultAs == 'details');
			var Details = [];

			columns = [	'internalid','custrecord_tp_predecessor','custrecord_tp_dependency_type'];

			columns.push(search.createColumn({name:'custevent_kpi_task_status',join:'custrecord_tp_predecessor'})); // column 3
			columns.push(search.createColumn({name:'assigned',join:'custrecord_tp_predecessor'})); // column 4
			columns.push(search.createColumn({name:'startdate',join:'custrecord_tp_predecessor'})); // column 5
			columns.push(search.createColumn({name:'duedate',join:'custrecord_tp_predecessor'})); // column 6
			columns.push(search.createColumn({name:'custevent_kpi_process',join:'custrecord_tp_predecessor'})); // column 7
			columns.push(search.createColumn({name:'custevent_kpi_subprocess',join:'custrecord_tp_predecessor'})); // column 8
			columns.push(search.createColumn({name:'custevent_kpi_task_type', join:'custrecord_tp_predecessor'})); // column 9
			columns.push(search.createColumn({name:'custevent_kpi_duration',join:'custrecord_tp_predecessor'})); // column 10
			
			var BranchTasks = ['S'+WhichTask]; // alway start with  the root for the search.
			
			//Get the data of WichTask
			if (asDetails){
				var initSearchFilters = [ [ "internalid", 'is', WhichTask ] ];
				var col_process = search.createColumn({name:'custrecord_kpit_process', join:'custevent_kpi_task_type'});
				var col_subprocess = search.createColumn({name:'custrecord_kpit_subprocess', join:'custevent_kpi_task_type'});
				var initSearch = search.create({
						type: 'task' ,
						filters: initSearchFilters,
						columns: ['internalid', 'title', 'custevent_kpi_department', 
								'custevent_kpi_task_type', 'custevent_kpi_task_status',
								'custevent_kpi_current_dependency','assigned',
								'startdate','duedate', 'custevent_kpi_duration',
								'custevent_kpi_process','custevent_kpi_subprocess',
								'custevent_kpi_task_type', col_process, col_subprocess
								]
					});
				// First take all current predessesors...
				initSearch.run().each(function(result){
					var tsk = {
						'internalid'	: result.getValue ({name: 'internalid' }),
						'title'			: result.getValue ({name: 'title' }),
						'idTask'		: result.getValue ({name: 'internalid' }),
						'status' 		: result.getText  ({name: 'custevent_kpi_task_status' }),
						'dependency'	: result.getValue ({name: 'custevent_kpi_current_dependency' }),
						'assigned'		: result.getValue ({name: 'assigned' }),
						'assigned_n'	: result.getText  ({name: 'assigned' }),
						'startdate' 	: result.getValue ({name: 'startdate'}),
						'duedate' 		: result.getValue ({name: 'duedate'}),
						'duration' 		: result.getValue ({name: 'custevent_kpi_duration'}),
						'process'		: result.getValue ({name: 'custevent_kpi_process'}),
						'process_n'		: result.getText  ({name: 'custevent_kpi_process'}),
						'subprocess'	: result.getValue ({name: 'custevent_kpi_subprocess'}),
						'subprocess_n'	: result.getText  ({name: 'custevent_kpi_subprocess'}),
						'processx'		: result.getValue (col_process),
						'process_nx'	: result.getText  (col_process),
						'subprocessx'	: result.getValue (col_subprocess),
						'subprocess_nx'	: result.getText  (col_subprocess),
						'task_type' 	: result.getValue ('custevent_kpi_task_type'),
						'task_type_n' 	: result.getText  ('custevent_kpi_task_type'),
						'branch_pre'	: WhichTask,
						'branch_lvl'	: 0
					};
					Details.push(tsk);
					return true;
				});
			}
			//-----

			function recursive_search_predecessors( WhichTaskSearch, level ) {

				var arrSearchFilters_new = [];
				var resultTasks = [];

				// Protection for extreme recursivity....
				level++;
				if (level > 2000) return false;

				arrSearchFilters_new.push([ "custrecord_tp_parent", search.Operator.IS, WhichTaskSearch ]);

				var arrSearch = search.create({
						type: IDType ,
						filters: arrSearchFilters_new,
						columns: columns
					});

				// First take all current predessesors...
				arrSearch.run().each(function(result){
					resultTasks.push({
						'internalid'	: result.getValue ({name: 'internalid' }),
						'title'			: result.getText  ({name: IdField }),
						'idTask'		: result.getValue ({name: 'custrecord_tp_predecessor' }),
						'status' 		: result.getText  (columns[3]),
						'dependency'	: result.getText  ({name: 'custrecord_tp_dependency_type' }),
						'assigned'		: result.getValue (columns[4]),
						'assigned_n'	: result.getText  (columns[4]),
						'startdate' 	: result.getValue (columns[5]),
						'duedate' 		: result.getValue (columns[6]),
						'duration' 		: result.getValue (columns[10]),
						'process'		: result.getValue (columns[7]),
						'process_n'		: result.getText  (columns[7]),
						'subprocess'	: result.getValue (columns[8]),
						'subprocess_n'	: result.getText  (columns[8]),
						'task_type' 	: result.getValue (columns[9]),
						'task_type_n' 	: result.getText  (columns[9]),
						'branch_pre'	: WhichTaskSearch,
						'branch_lvl'	: level
					});

					return true;
				});

				arrSearch = undefined; // Free Memory...

				resultTasks.forEach(function(tsk){
					// ERROR - found circular recursion...
					if(BranchTasks.indexOf('A'+tsk.idTask) != -1){
						if ((tsk.title).indexOf('Kickoff') != -1)
							BranchTasks.push('K'+tsk.idTask);
						else
							BranchTasks.push('R'+tsk.idTask);
					} else {
						if (asDetails) Details.push(tsk);
						BranchTasks.push('A'+tsk.idTask);
						recursive_search_predecessors(tsk.idTask, level);
					}
				});

			} //--- recursive_search_predecessors< end

			recursive_search_predecessors(WhichTask, 0); // Start search.

			if (asDetails)
				Params.response.write( (JSON.stringify(Details)) );
			else
				Params.response.write( (JSON.stringify(BranchTasks)) );
		};
//---- getPredesesorsBranch<

		
		

//---- getSuccessorsBranch>
		module.actions['getSuccessorsBranch'] = function(Params){
	/*
	 * Tipical CALL parameters
	 * -----------------------
			IDType:"customrecord_task_successor",
			IdField:"custrecord_ts_successor",
			IdParent:"custrecord_ts_parent",
			WhichTask:"174769",
			action :"showSucc",
	*/
			var IDType 		= "customrecord_task_successor";
			var IdField 	= "custrecord_ts_successor";
			var IdParent 	= "custrecord_ts_parent";
			var WhichTask 	= Params.request.parameters['WhichTask'];
			var resultAs 	= Params.request.parameters['resultAs'];
			var columns = [];
			var asDetails = (resultAs == 'details');
			var Details = [];
			var asTreeFlare = (resultAs == 'treeflare');
			var TreeFlare = {};

			columns = [	'internalid','custrecord_ts_successor','custrecord_ts_dependency_type'];

			columns.push(search.createColumn({name:'custevent_kpi_task_status',join:'custrecord_ts_successor'})); // column 3
			columns.push(search.createColumn({name:'assigned',join:'custrecord_ts_successor'})); // column 4
			columns.push(search.createColumn({name:'startdate',join:'custrecord_ts_successor'})); // column 5
			columns.push(search.createColumn({name:'duedate',join:'custrecord_ts_successor'})); // column 6
			columns.push(search.createColumn({name:'custevent_kpi_process',join:'custrecord_ts_successor'})); // column 7
			columns.push(search.createColumn({name:'custevent_kpi_subprocess',join:'custrecord_ts_successor'})); // column 8
			columns.push(search.createColumn({name:'custevent_kpi_duration',join:'custrecord_ts_successor'})); // column 9

			var BranchTasks = ['S'+WhichTask]; // alway start with  the root for the search.
			
			//Get the data of WichTask
			if (asDetails || asTreeFlare){
				var initSearchFilters = [ [ "internalid", 'is', WhichTask ] ];
				var initSearch = search.create({
						type: 'task' ,
						filters: initSearchFilters,
						columns: [
									'internalid', 'title', 'custevent_kpi_department', 
									'custevent_kpi_task_type', 'custevent_kpi_task_status',
									'custevent_kpi_current_dependency','assigned','startdate',
									'duedate','custevent_kpi_process','custevent_kpi_subprocess',
									'custevent_kpi_duration'
								]
					});
				// First take all current predessesors...
				initSearch.run().each(function(result){
					var tsk = {
						'internalid': result.getValue ({name: 'internalid' }),
						'title'		: result.getValue ({name: 'title' }),
						'idTask'	: result.getValue ({name: 'internalid' }),
						'status' 	: result.getText  ({name: 'custevent_kpi_task_status' }),
						'dependency': result.getValue ({name: 'custevent_kpi_current_dependency' }),
						'assigned'	: result.getValue ({name: 'assigned' }),
						'assigned_n': result.getText  ({name: 'assigned' }),
						'startdate' : result.getValue ({name: 'startdate'}),
						'duedate' 	: result.getValue ({name: 'duedate'}),
						'duration' 	: result.getValue ({name: 'custevent_kpi_duration'}),
						'process'	: result.getValue ({name: 'custevent_kpi_process'}),
						'process_n'	: result.getText  ({name: 'custevent_kpi_process'}),
						'subprocess': result.getValue ({name: 'custevent_kpi_subprocess'}),
						'subprocess_n': result.getText({name: 'custevent_kpi_subprocess'}),
						'branch_pre'  : WhichTask,
						'branch_lvl'  : 0
					};
					Details.push(tsk);
					TreeFlare = {'id':WhichTask, 'name': tsk.title, 'task': tsk, 'children':[] };
					return true;
				});
			}
			//-----

			function recursive_search_successors( WhichTaskSearch, level ) {

				var arrSearchFilters_new = [];
				var resultTasks = [];

				// Protection for extreme recursivity....
				level++;
				if (level > 2000) return false;

				arrSearchFilters_new.push([ "custrecord_ts_parent", search.Operator.IS, WhichTaskSearch ]);

				var arrSearch = search.create({
						type: IDType ,
						filters: arrSearchFilters_new,
						columns: columns
					});

				// First take all current successors...
				arrSearch.run().each(function(result){
					resultTasks.push({
						'internalid': result.getValue ({name: 'internalid' }),
						'title'		: result.getText  ({name: IdField }),
						'idTask'	: result.getValue ({name: 'custrecord_ts_successor' }),
						'status' 	: result.getText  (columns[3]),
						'dependency': result.getText  ({name: 'custrecord_ts_dependency_type' }),
						'assigned'	: result.getValue (columns[4]),
						'assigned_n': result.getText  (columns[4]),
						'startdate' : result.getValue (columns[5]),
						'duedate' 	: result.getValue (columns[6]),
						'duration' 	: result.getValue (columns[9]),
						'process'	: result.getValue (columns[7]),
						'process_n'	: result.getText  (columns[7]),
						'subprocess': result.getValue (columns[8]),
						'subprocess_n': result.getText(columns[8]),
						'branch_pre': WhichTaskSearch,
						'branch_lvl': level
					});

					return true;
				});

				arrSearch = undefined; // Free Memory...

				resultTasks.forEach(function(tsk){
					// ERROR - found circular recursion...
					if(BranchTasks.indexOf('A'+tsk.idTask) != -1){
						if ((tsk.title).indexOf('Kickoff') != -1)
							BranchTasks.push('K'+tsk.idTask);
						else
							BranchTasks.push('R'+tsk.idTask);
					} else {
						if (asDetails) Details.push(tsk);
						BranchTasks.push('A'+tsk.idTask);
						recursive_search_successors(tsk.idTask, level);
					}
				});

			} //--- recursive_search_successors< end
			
			// Flare is special type create this structure
			//  TreeFlare = {name:'Parent', 
			//			children:[
			//				{name:'child1', size:100},
			//				{name:'child2', children: [ ... ]}
			//			]}
			//---
			function recursive_search_successors_flare( WhichTaskSearch, level ) {

				var arrSearchFilters_new = [];
				var resultTasks = [];
				var carry = [];

				// Protection for extreme recursivity....
				level++;
				if (level > 2000) return carry;

				arrSearchFilters_new.push([ "custrecord_ts_parent", search.Operator.IS, WhichTaskSearch ]);

				var arrSearch = search.create({
						type: IDType ,
						filters: arrSearchFilters_new,
						columns: columns
					});

				// First take all current successors...
				arrSearch.run().each(function(result){
					resultTasks.push({
						'internalid': result.getValue ({name: 'internalid' }),
						'title'		: result.getText  ({name: IdField }),
						'idTask'	: result.getValue ({name: 'custrecord_ts_successor' }),
						'status' 	: result.getText  (columns[3]),
						'dependency': result.getText  ({name: 'custrecord_ts_dependency_type' }),
						'assigned'	: result.getValue (columns[4]),
						'assigned_n': result.getText  (columns[4]),
						'startdate' : result.getValue (columns[5]),
						'duedate' 	: result.getValue (columns[6]),
						'duration' 	: result.getValue (columns[9]),
						'process'	: result.getValue (columns[7]),
						'process_n'	: result.getText  (columns[7]),
						'subprocess': result.getValue (columns[8]),
						'subprocess_n': result.getText(columns[8]),
						'branch_pre': WhichTaskSearch,
						'branch_lvl': level
					});

					return true;
				});

				arrSearch = undefined; // Free Memory...

				resultTasks.forEach(function(tsk){
					// ERROR - found circular recursion...
					if(BranchTasks.indexOf('A'+tsk.idTask) != -1){
						if ((tsk.title).indexOf('Kickoff') != -1)
							BranchTasks.push('K'+tsk.idTask);
						else
							BranchTasks.push('R'+tsk.idTask);
					} else {
						BranchTasks.push('A'+tsk.idTask);
						carry.push({ 
							'id':tsk.idTask,
							'name':tsk.title,
							'task':tsk,
							'children': recursive_search_successors_flare( tsk.idTask, level )
							});
					}
				});
				
				return carry;
			} //--- recursive_search_successors_flare< end

			if (!asTreeFlare) recursive_search_successors(WhichTask, 0); // Start search.

			if (asDetails)
				Params.response.write( (JSON.stringify(Details)) );
			else if (asTreeFlare){
				TreeFlare.children = recursive_search_successors_flare(WhichTask, 0 ); // Start search.
				Params.response.write( (JSON.stringify(TreeFlare)) );
			} else
				Params.response.write( (JSON.stringify(BranchTasks)) );
		};
//---- getSuccessorsBranch<

		
		

//---- getSuccessorsBranchOk>
		module.actions['getSuccessorsBranchOk'] = function(Params){
	/*
	 * Tipical CALL parameters
	 * -----------------------
			IDType:"customrecord_task_successor",
			IdField:"custrecord_ts_successor",
			IdParent:"custrecord_ts_parent",
			WhichTask:"174769",
			action :"showSucc",
	*/
			var IDType 		= "customrecord_task_successor";
			var IdField 	= "custrecord_ts_successor";
			var IdParent 	= "custrecord_ts_parent";
			var WhichTask 	= Params.request.parameters['WhichTask'];
			var resultAs 	= Params.request.parameters['resultAs'];
			var columns = [];
			var asDetails = (resultAs == 'details');
			var Details = [];

			columns = [	'internalid','custrecord_ts_successor','custrecord_ts_dependency_type'];

			columns.push(search.createColumn({name:'custevent_kpi_task_status',join:'custrecord_ts_successor'})); // column 3
			columns.push(search.createColumn({name:'assigned',join:'custrecord_ts_successor'})); // column 4

			var BranchTasks = ['S'+WhichTask]; // alway start with  the root for the search.
			
			//Get the data of WichTask
			if (asDetails){
				var initSearchFilters = [ [ "internalid", 'is', WhichTask ] ];
				var initSearch = search.create({
						type: 'task' ,
						filters: initSearchFilters,
						columns: ['internalid', 'title', 'custevent_kpi_department', 
								'custevent_kpi_task_type', 'custevent_kpi_task_status',
								'custevent_kpi_current_dependency','assigned'
								]
					});
				// First take all current predessesors...
				initSearch.run().each(function(result){
					var tsk = {
						'internalid': result.getValue ({name: 'internalid' }),
						'title'		: result.getValue ({name: 'title' }),
						'idTask'	: result.getValue ({name: 'internalid' }),
						'status' 	: result.getText  ({name: 'custevent_kpi_task_status' }),
						'dependency': result.getValue ({name: 'custevent_kpi_current_dependency' }),
						'assigned'	: result.getValue ({name: 'assigned' }),
						'assigned_n': result.getText  ({name: 'assigned' }),
						'branch_pre': WhichTask,
						'branch_lvl': 0
					};
					Details.push(tsk);
					return true;
				});
			}
			//-----

			function recursive_search_successors( WhichTaskSearch, level ) {

				var arrSearchFilters_new = [];
				var resultTasks = [];

				// Protection for extreme recursivity....
				level++;
				if (level > 2000) return false;

				arrSearchFilters_new.push([ "custrecord_ts_parent", search.Operator.IS, WhichTaskSearch ]);

				var arrSearch = search.create({
						type: IDType ,
						filters: arrSearchFilters_new,
						columns: columns
					});

				// First take all current predessesors...
				arrSearch.run().each(function(result){
					resultTasks.push({
						'internalid': result.getValue ({name: 'internalid' }),
						'title'		: result.getText  ({name: IdField }),
						'idTask'	: result.getValue ({name: 'custrecord_ts_successor' }),
						'status' 	: result.getText  (columns[3]),
						'dependency': result.getText  ({name: 'custrecord_ts_dependency_type' }),
						'assigned'	: result.getValue (columns[4]),
						'assigned_n': result.getText  (columns[4]),
						'branch_pre': WhichTaskSearch,
						'branch_lvl': level
					});

					return true;
				});

				arrSearch = undefined; // Free Memory...

				resultTasks.forEach(function(tsk){
					// ERROR - found circular recursion...
					if(BranchTasks.indexOf('A'+tsk.idTask) != -1){
						if ((tsk.title).indexOf('Kickoff') != -1)
							BranchTasks.push('K'+tsk.idTask);
						else
							BranchTasks.push('R'+tsk.idTask);
					} else {
						if (asDetails) Details.push(tsk);
						BranchTasks.push('A'+tsk.idTask);
						recursive_search_successors(tsk.idTask, level);
					}
				});

			} //--- recursive_search_predecessors< end

			recursive_search_successors(WhichTask, 0); // Start search.

			if (asDetails)
				Params.response.write( (JSON.stringify(Details)) );
			else
				Params.response.write( (JSON.stringify(BranchTasks)) );
		};
//---- getSuccessorsBranchOK<


		
//---- showSucc>
		module.actions['showSucc'] = function(Params){
		/*	var IDType 		= Params.request.parameters['IDType'];
			var IdField 	= Params.request.parameters['IdField'];
			var IdParent 	= Params.request.parameters['IdParent']; */
			var WhichTask 	= Params.request.parameters['WhichTask'];
			var arrSearch, arrSearchFilters = [],columns = [], resultTask 	= [];
			
			var IDType	= 'customrecord_task_successor', 
				IdParent= 'custrecord_ts_parent',
				IdField	= 'custrecord_ts_successor';
			
			columns = [	'internalid' , IdField , 'custrecord_ts_assigned',
						'custrecord_ts_startdate', 'custrecord_ts_duedate',
						'custrecord_ts_duration','custrecord_ts_successor' ];

			columns.push(search.createColumn({
						name:'custevent_kpi_task_status',
						join:'custrecord_ts_successor'
					})); // column 7

			arrSearchFilters.push([IdParent, search.Operator.IS, WhichTask]);

			arrSearch = search.create({type: IDType ,filters: arrSearchFilters,columns: columns});

			arrSearch.run().each(function(result){
				
				resultTask.push({
						'internalid': result.getValue({name: 'internalid'}) ,
						'title' 	: result.getText ({name: IdField}) ,
						'assigned'	: result.getText ({name: 'custrecord_ts_assigned'}) ,
						'startdate' : result.getValue({name: 'custrecord_ts_startdate'}) ,
						'duedate'	: result.getValue({name: 'custrecord_ts_duedate'}) ,
						'duration'	: result.getValue({name: 'custrecord_ts_duration'}),
						'idTask'	: result.getValue({name: 'custrecord_ts_successor'}),
						'status'	: result.getText (columns[7])
					});
				return true;
			});

			Params.response.write(JSON.stringify(resultTask));
		};
//---- showSucc<





//---- GetTaskTree>
		module.actions['GetTaskTree'] = function(Params){
			var WhichTask 	= Params.request.parameters['WhichTask'];
			var arrSearch, arrSearchFilters = [],columns = [];
			var count,counter = 0;
			var resultTask 	= [];
			
			columns = [
				'internalid','title','custevent_kpi_wrike_id','custevent_kpi_ack',
				'custevent_kpi_task_status','custevent_kpi_current_dependency','assigned',
				'custevent_kpi_work_on_weekend','startdate','duedate','custevent_kpi_duration',
				'custevent_kpi_planned_duedate','custevent_kpi_current_predecessor','custevent_kpi_task_type',
				'custevent_kpi_sales_order','custevent_kpi_service_address','custevent_kpi_item',
				'custevent_kpi_item_line'
				];
			
			columns.push(search.createColumn({name:'custrecord_kpit_process',	join:'custevent_kpi_task_type'}));  // column 16
			columns.push(search.createColumn({name:'custrecord_kpit_subprocess',join:'custevent_kpi_task_type'}));  // column 17

			//columns.push(search.createColumn({name:'custrecord_ts_successor',join:'customrecord_task_successor'}));
			arrSearchFilters.push(['internalid', search.Operator.IS, WhichTask]);
			arrSearch = search.create({type: 'task',filters: arrSearchFilters,columns: columns});

			arrSearch.run().each(function(result){
				counter++;
				count = "TreeTask"+counter;
				var title 				= result.getValue({name: 'title'});
				var internalid			= result.getValue({name: 'internalid'});
				var assignedID			= result.getValue({name: 'assigned'});
				var assigned			= result.getText({name: 'assigned'});
				var status				= result.getText({name: 'custevent_kpi_task_status'});
				var statusID			= result.getValue({name: 'custevent_kpi_task_status'});
				var taskAck				= result.getValue({name: 'custevent_kpi_ack'});
				var taskStartDate		= createpicker(formatDate(DateMMDDYYYY(result.getValue({name: 'startdate'}))),'StartDate_','StartDate_'+count);
				var taskDueDate			= createpicker(formatDate(DateMMDDYYYY(result.getValue({name: 'duedate'}))),'DueDate_','DueDate_'+count);
				var IsWorkOnWeekend 	= result.getValue({name: 'custevent_kpi_work_on_weekend'});
				var taskDuration		= result.getValue({name: 'custevent_kpi_duration'});
				var taskCDependency		= result.getValue({name: 'custevent_kpi_current_dependency'});
				var taskCPredecessor	= result.getValue({name: 'custevent_kpi_current_predecessor'});
				var taskSalesOrder		= result.getValue({name: 'custevent_kpi_sales_order'});

				var taskProcessVal 		= result.getValue(columns[16]);
				var taskSubProcessVal	= result.getValue(columns[17]);

				var taskKpiAddress 		= result.getValue({name: 'custevent_kpi_service_address'});
				var taskKpiItem			= result.getValue({name: 'custevent_kpi_item'});
				var taskKpiLine			= result.getValue({name: 'custevent_kpi_item_line'});
				var wrikeid 			= result.getValue({name: 'custevent_kpi_wrike_id'})
				var KpiTaskType  		= result.getValue('custevent_kpi_task_type');

				var interID = internalid;
				//Get IdTreetask
				var taskPro 			= '';
				var taskSubPro      	= '';
				var taskSubProTask		= '';
				var treePosition 		= '';

				if(taskKpiAddress != ''){//Address ----------------
					if(taskProcessVal != ''){
						treePosition = 'A'+taskKpiAddress +'-'+ taskProcessVal;
					}
					if(taskSubProcessVal == ''){
						treePosition 	= 'A'+taskKpiAddress + '-' + taskProcessVal + '-' + interID;
					}else{
						taskSubPro 		= 'A'+taskKpiAddress + '-' + taskProcessVal + '-' + taskSubProcessVal;
						treePosition 	= 'A'+taskKpiAddress + '-' + taskProcessVal + '-' + taskSubProcessVal + '-' + interID;
					}
				}else if(taskKpiItem != ''){//Item ----------------
					if(taskProcessVal != ''){
						treePosition = 'I'+taskKpiItem+'-'+taskKpiLine+'-'+ taskProcessVal;
					}
					if(taskSubProcessVal == ''){
						treePosition 	= 'I'+taskKpiItem+'-'+taskKpiLine+ '-' + taskProcessVal + '-' + interID;
					}else{
						treePosition 		= 'I'+taskKpiItem+'-'+taskKpiLine + '-' + taskProcessVal + '-' + taskSubProcessVal;
						treePosition 	= 'I'+taskKpiItem+'-'+taskKpiLine + '-' + taskProcessVal + '-' + taskSubProcessVal + '-' + interID;
					}
				}else{//Planning ----------------
					if(taskProcessVal != ''){
						treePosition = 'P'+taskProcessVal;
					}
					if(taskSubProcessVal == ''){
						treePosition 	= 'P'+taskProcessVal + '-' + interID;
					}else{
						treePosition 		= 'P'+taskProcessVal + '-' + taskSubProcessVal;
						treePosition 	= 'P'+taskProcessVal + '-' + taskSubProcessVal +'-'+ interID;
					}
				}//end Get IdTreetask

				resultTask.push({
						'internalid'		: internalid,
						'taskTitle'			: title,
						'assigned'			: assigned,
						'assignedID'		: assignedID,
						'status'			: status,
						'statusID'			: statusID,
						'taskAck'			: taskAck,
						'taskStartDate'		: taskStartDate,
						'taskDueDate'		: taskDueDate,
						'IsWorkOnWeekend'	: IsWorkOnWeekend,
						'taskDuration'		: taskDuration,
						'taskCDependency'	: taskCDependency,
						'taskCPredecessor'	: taskCPredecessor,
						'taskSalesOrder'	: taskSalesOrder,
						'treePosition'		: treePosition,
						'WrikeID'			: wrikeid,
						'KpiTaskType'		: KpiTaskType,
					});
			});

			Params.response.write( JSON.stringify(resultTask) );
			//Other Functions ------------------------------------------------------------------------------------

			//createpicker Function -----------------------------------------------------------------------------
			function createpicker (date,i,id){
				var string="";
				if (i == "StartDate_"){
					string = '<div> <input type="text" class="showTaskDatePick" onchange="changeidPickerStartDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
				}else if (i =="DueDate_"){
					string = '<div> <input type="text" class="showTaskDatePick" onchange="changeidPickerDueDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
				}
				return string;
			}//end createpicker
			//formatDate Function --------------------------------------------------------------------------------
			function formatDate(date) {
				var d = new Date(date),
						month = '' + (d.getMonth() + 1),
						day = '' + d.getDate(),
						year = d.getFullYear();

				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;

				return [year,month,day].join('-');
			}//end formatDate
			//formatToDates Function ------------------------------------------------------------------------------
			function formatToDates(date) {
					var d = new Date(date),
							month = '' + (d.getMonth() + 1),
							day = '' + d.getDate(),
							year = d.getFullYear();

					if (month.length < 2) month = '0' + month;
					if (day.length < 2) day = '0' + day;

					return [day,month,year].join('/');
			}//end formatToDates
			//----------------------------------------------------------------------------------------
			function DateMMDDYYYY (date){
				var parseDate = format.parse ({
					value : date,
					type: format.Type.DATE
				});
				return parseDate;
			}
			//FormatFormat --------------------------------------------------------------------------------------
			function FormatFormat(date){
				 return format.format({value:date, type:'date' });
				 // return parseDate;
			}//end FormatFormat

		};
//---- GetTaskTree<


		
//--- writeNoteOnTask>
		module.actions['writeNoteOnTask'] = function(Params){
			var taskId = Params.request.parameters["WhichTask"];
			var taskSo = Params.request.parameters["WhichSalesOrder"];
			var taskAssignee = Params.request.parameters["Assignee"];
			var tit = Params.request.parameters["title"];
			var msg = Params.request.parameters["message"];
			var notetypes = {
					'empty':0,
					'System Logged Note':1,
					'Conference Call':2,
					'E-mail':3,
					'Fax':4,
					'Letter':5,
					'Meeting':6, 
					'Hand Write Note':7,
					'Phone Call':8,
					'WorkForce':9
				};
			var directionnote = {
					'empty':0,
					'incoming':1,
					'outgoing':2
				};
			var rectype = {SANDBOX:942, PRODUCTION:816};
			
			var noteRec = record.create({type:'note', id:taskId});
			
			if (tit.length > 120) tit = tit.substring(0,119);
			
			var msg2 = msg;
			
			if (msg2.length > 3900)
				msg2 = msg2.substring(0,3900) + ' {{incomplete}}';
			
			var values = { 
				author : runtime.getCurrentUser().id,
				title  : tit,
				note   : msg2,
				direction : directionnote['outgoing'],
				recordtype :  rectype[runtime.envType],
				notetype : notetypes['WorkForce'],
				activity : taskId
			};
			
			for(var k in values) noteRec.setValue(k, values[k]);
			
			var noteId = noteRec.save();
			
			if (noteId) {
				
				var sendMsgs = module.actions['sendMessageMails'] (Params);
				
			}
			
			Params.response.write( JSON.stringify(noteId) );
		}
//--- writeNoteOnTask>

		
		
//--- sendMessageMails>
		module.actions['sendMessageMails'] = function(Params){
			var taskId = Params.request.parameters["WhichTask"];
			var taskSo = Params.request.parameters["WhichSalesOrder"];
			var taskAssignee = Params.request.parameters["Assignee"];
			var title = Params.request.parameters["title"];
			var msg = Params.request.parameters["message"];
			var mentions = Params.request.parameters["mentions"];
			var msgType = 1; // Task type
			var recipientEmails = [];
			var emailMsg = '';
			var currentuser = runtime.getCurrentUser().id;
			var Original_Message = 0;
			var AlreadyMention = [];
			var WF_scriptId = {
					SANDBOX		: '<a href="/app/site/hosting/scriptlet.nl?script=1385&deploy=1&gocomm=', 
					PRODUCTION	: '<a href="app/site/hosting/scriptlet.nl?script=1308&deploy=1&gocomm='
				}
			var emailTitle = 'New comments on task';
			
			mentions = JSON.parse(mentions);
			
			if (mentions.length) {
				mentions.map(function(usr){recipientEmails.push(usr.email);})
			}
			
			if (recipientEmails.length) {
				
				emailTitle = 'New messages on task, '+title;
				
				if( msg , indexOf('Predecessor task completed:') == 1)
					emailTitle = 'Predecessor completed: '+title;
				
				emailMsg = 'New messages on task <br><b>'+title+'</b>.<br>\n<br>\n'+
				WF_scriptId[runtime.envType] +taskId+'">Link to WorkForce Managment</a><br>\n<br>\n'+
				msg+
				'<br>\n<br>\nTranstelco Inc.<br>\n<br>\n\
				Time:'+ (new Date()).toString() +'...';
				
				email.send({
				    author: currentuser,
				    recipients: recipientEmails,
				    subject: emailTitle,
				    body: emailMsg,
				    replyTo: 'none@transtelco.net',
//				    relatedRecords: {
//				    	activityId: taskId
//				    }
				});
				
				// After emails add records to communicator...
				mentions.forEach(function(usr){
					if (AlreadyMention.indexOf(usr.userid) == -1) { // Prevent duplicate message... 
						var rec_news = record.create({type:'customrecord_sst_wf_communicator', isDynamic:false });
						// custrecord_wf_comm_msg_ack
						rec_news.setValue({ fieldId: 'custrecord_wf_comm_from_user', value: currentuser });
						rec_news.setValue({ fieldId: 'custrecord_wf_comm_to_user', value: usr.userid });
						rec_news.setValue({ fieldId: 'custrecord_wf_comm_so', value: taskSo });
						rec_news.setValue({ fieldId: 'custrecord_wf_comm_task', value: taskId });
						rec_news.setValue({ fieldId: 'custrecord_wf_comm_msg_type', value: msgType });
						
						if (!Original_Message)
							rec_news.setValue({ fieldId: 'custrecord_wf_comm_message', value: msg });
						else 
							rec_news.setValue({ fieldId: 'custrecord_wf_comm_msg_link', value: Original_Message });
						
						var MessageID = rec_news.save();
						
						if (!Original_Message)
							Original_Message = MessageID;
						
						AlreadyMention.push(usr.userid);
					}
				});
				
			}
			
			return true;
		}
//--- sendMessageMails<

		
//--- writeNotification>
		module.actions['writeNotification'] = function(Params){
			var taskId = Params.request.parameters["WhichTask"];
			var taskSo = Params.request.parameters["WhichSalesOrder"];
			var msgType = Params.request.parameters["msgType"];
			var msg = Params.request.parameters["message"];
			var mentions = Params.request.parameters["mentions"];
			var currentuser = runtime.getCurrentUser().id;
			var Original_Message = 0;
			var AlreadyMention = []; // To protect void send more than one notification to the same user.
			var WF_DEBUG = false;
			
			if(WF_DEBUG)
				log.debug({title: "writeNotification", details: {'params':Params.request.parameters } });
			/*
			 * msgType
			 * -----------
			 * 1 - Task
			 * 2 - Chat
			 * 3 - Log
			 * 
			 * The notification 'message' we will save the content in the first
			 * user in mentions.
			 * 
			 */
			mentions = JSON.parse(mentions);
			
			// add records to communicator...
			mentions.map(function(usr){
				if (AlreadyMention.indexOf(usr.userid) == -1) { // Prevent duplicate message... 
					var rec_news = record.create({type:'customrecord_sst_wf_communicator', isDynamic:false });
					rec_news.setValue({ fieldId: 'custrecord_wf_comm_from_user', value: currentuser });
					rec_news.setValue({ fieldId: 'custrecord_wf_comm_to_user', value: usr.userid });
					rec_news.setValue({ fieldId: 'custrecord_wf_comm_so', value: taskSo });
					rec_news.setValue({ fieldId: 'custrecord_wf_comm_task', value: taskId });
					rec_news.setValue({ fieldId: 'custrecord_wf_comm_message', value: msg });
					rec_news.setValue({ fieldId: 'custrecord_wf_comm_msg_type', value: msgType });
					
					if (!Original_Message)
						rec_news.setValue({ fieldId: 'custrecord_wf_comm_message', value: msg });
					else 
						rec_news.setValue({ fieldId: 'custrecord_wf_comm_msg_link', value: Original_Message });
					
					var MessageID = rec_news.save();
					
					if (!Original_Message)
						Original_Message = MessageID;
					
					AlreadyMention.push(usr.userid);
				}
			});
			
			return true;
		}
//--- writeNotification<
		
		
//--- listNotificationsType>
		module.actions['listNotificationsType'] = function(Params){
			var Rows = [];
			var Columns = ['internalid','name'];
			var WF_DEBUG = false;
			
			if(WF_DEBUG)
				log.debug({title: "listNotificationsType", details: {'params':Params.request.parameters} });

			var mySearch = search.create({
				type: 'customlist_wf_comm_msg_types',
				columns: Columns
			});
			
			mySearch.run().each(function(result) {
				Rows.push({
					"id": result.getValue(Columns[0]),
					"name": result.getValue(Columns[1])
				});
				return true;
			});
			
			Params.response.write( JSON.stringify(Rows) );
		}
//--- listNotificationsType>
		
		
//---- getCustomerfromID>
		module.actions['getCustomerfromID'] = function(Params){
			var Rows = [];
			var id = Params.request.parameters["id"];
			if (id != undefined){
				var filter = search.createFilter({name: 'internalid', operator: search.Operator.IS, values: id});
			}
			var column = search.createColumn({ name: 'entity',join: 'custevent_kpi_sales_order'});

			var mySearch = search.create({
				type: 'task',
				filters: [filter],
				columns: [column]
			});
				mySearch.run().each(function(result) {
				Rows.push({
				//	"customer": result.getText(column) // customer
					"customer": result.getText({name:'entity'}) // customer
					});
				return true;
			});
			Params.response.write( JSON.stringify(Rows) );
		}
//---- getCustomerfromID<





//---- getAllMyWork>
		module.actions['getAllMyWork'] = function(Params){
			var IdstatusPrev = Params.request.parameters["statusId"] ;
			var overrideUser = Params.request.parameters["auditId"];
			var dayQuest = Params.request.parameters["day"];
			var theTeam = Params.request.parameters["theTeam"];
			var arrSearch,
				arrSearchFilters = [],
				ancount = 0,
				count = 0;
			var results = [];
			var allSOinvolved = [];
			var allSOnames = {};
			var WF_DEBUG = false;

			if(WF_DEBUG)
				log.debug({title: "getAllMyWork Parameters", details:  Params.request.parameters });
			
			function createpicker2 (date,i,id){
				var string="";
				if (i == "StartDate_"){
					string = '<div> <input type="text" class="toDatePicker leirags" onchange="changeidPickerStartDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
				}else if (i =="DueDate_"){
					string = '<div> <input type="text" class="toDatePicker leirags" onchange="changeidPickerDueDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
				}
				return string;
			}
			
			function createpicker (date,i,id){
				var string="";
				if (i == "StartDate_"){
					string = '<input type="text" class="toDatePicker" onchange="" id="idPicker_'+id+'" value="'+date+'" data-old="'+date+'" />';
				}else if (i =="DueDate_"){
					string = '<input type="text" class="toDatePicker" onchange="" id="idPicker_'+id+'" value="'+date+'" data-old="'+date+'" />';
				}
				return string;
			}
			
			function calc_deviation(tsk){
				var start = tsk.start, due = tsk.due, start_p = tsk.start_p, due_p = tsk.due_p, dur_p = tsk.due_p;
				// var orignal_duration_calc = LeirAGS_dates.diffDays( due_p, start_p ) + 1;
				var orignal_duration_calc = LeirAGS_dates.diffWrkDays( start_p, due_p, tsk.WonW );
				var curr_duration = tsk.duration;
				// var enddate_deviation_calc = LeirAGS_dates.diffDays( due, due_p ) + 1;
				var enddate_deviation_calc = LeirAGS_dates.diffWrkDays( due_p, due, tsk.WonW );
				
				if ((dur_p - curr_duration) >= 0)
					Count_pusher('deviation', 'positive', 1 );
				else
					Count_pusher('deviation', 'negative', 1 );
				
				/*
				if ((curr_duration - orignal_duration_calc) >= 0)
					Count_pusher('deviation', 'positive', 1 );
				else
					Count_pusher('deviation', 'negative', 1 );
					*/
			}

			function formatDate(date) {
				var d = new Date(date),
						month = '' + (d.getMonth() + 1),
						day = '' + d.getDate(),
						year = d.getFullYear();

				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;

				return [year,month,day].join('-');
			}

			function DateMMDDYYYY (date){
				var parseDate = format.parse ({
					value : date,
					type: format.Type.DATE
				});
				return parseDate;
			}

			function outdatedTask (date){
				var parsedDate = DateMMDDYYYY(date).setHours(0,0,0,0);
				var today = new Date().setHours(0,0,0,0);
				if(today < parsedDate){
					return false;
				}else{
					return true; // We will then set the background of the task row to red color
				}
			}

			function datedTaskYellow (date){
				var parsedDate = DateMMDDYYYY(date);
				var today = new Date();
				var days = ( ( ( (parsedDate - today) / 1000) / 60) / 60) / 24 ;
				if ( days <= 5 && days > 0){
					return true;
				} else { return false; }
			}

			function parseada (date){
				var parsDate = DateMMDDYYYY(date).setHours(0,0,0,0);
				var today = new Date().setHours(0,0,0,0);
				return parsDate + '  ' + today;
			}

			function stringselect (statu,statussearch){
				var string = '<select id="idStatusTask">';
				statussearch.run().each(function(result){
					if(statu == result.getValue('name')){
						string = string + '<option value="'+result.getValue('internalid')+'"  selected="selected" >'+result.getValue('name')+'</option>';
					}else{
						string = string + '<option value="'+result.getValue('internalid')+'">'+result.getValue('name')+ '</option>';
					}
					return true ;
				});
				string = string + '</select>';
				return string;
			}

			var due = search.createColumn({name: 'duedate',	sort: search.Sort.ASC});
			
			if (theTeam) {
			 	theTeam = JSON.parse(theTeam);
			 	theTeam.push(runtime.getCurrentUser().id);
			}
			
			arrSearchFilters.push(
					search.createFilter({
						name: 'assigned',
						operator: search.Operator.ANYOF,
						values: (overrideUser) ? overrideUser : (theTeam)? theTeam : runtime.getCurrentUser().id
					})
				);

			arrSearchFilters.push(
					search.createFilter({
						name: 'custevent_kpi_workforce_task',
						operator: search.Operator.IS,
						values: "T"
					})
				);

			if(!IdstatusPrev){
				
				IdstatusPrev = '1';
				
			}else{
				var istatus = [];
				var ackArray = [];
				IdstatusPrev = IdstatusPrev.split(',');

				IdstatusPrev.forEach(function(it){
					if(it < 1001 )
						istatus.push(it);
					else{
						if(it == 1001)
							ackArray.push("T");
						else
							ackArray.push("F");
					}
				});

				if(istatus.length)
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_task_status',
					operator: search.Operator.IS,
					values: istatus
				}));

				if(ackArray && ackArray.length == 1)
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_ack',
					operator: search.Operator.IS,
					values: ackArray
				}));
			}
			
			//dayQuest = dayQuest * 1;
			// if(dayQuest > 0){
				
			if(dayQuest){
				
				if(WF_DEBUG)
					log.debug({title: "getAllMyWork", details: { 'dayQuest':dayQuest, 'Type': (typeof dayQuest)  } });
				
				var dayQuestDt = new Date( dayQuest );
				var dy = dayQuestDt.getFullYear(),
					dm = dayQuestDt.getMonth(), 
					dd = dayQuestDt.getDate();
				
				if(WF_DEBUG)
					log.debug({title: "getAllMyWork dayQuest", details: { 'dayQuest':dayQuest, 'dayQuestDt': dayQuestDt, 'y':dy, 'm':dm, 'd':dd  } });
				
				var today = new Date(dy,dm,dd);
				var dayFilter = format.format({
					    value: today,
					    type: format.Type.DATE
			    	});
				
				if(WF_DEBUG)
					log.debug({title: "getAllMyWork dayQuest", details: { 'dayQuest':dayQuest, 'dayFilter':dayFilter } });
				
				var startdate_moe = search.createFilter({
					name: 'startdate',
					operator: search.Operator.ONORBEFORE,
					values: dayFilter,
				});
				var duedate_loe = search.createFilter({
					name: 'enddate',
					operator: search.Operator.ONORAFTER,
					values: dayFilter,
				});
				
				arrSearchFilters.push( startdate_moe );
				arrSearchFilters.push( duedate_loe );
				
			}

			if(WF_DEBUG)
				log.debug({title: "getAllMyWork filters", details: arrSearchFilters });

			arrSearch = search.create({
				type: 'task',
				filters: arrSearchFilters ,
				columns: [
							'internalid','company','custevent_kpi_sales_order',
							'custevent_kpi_wrike_id','custevent_kpi_wrike_permalink','custevent_kpi_ack',
							'custevent_kpi_task_status','custevent_kpi_current_dependency','title',
							'assigned','custevent_kpi_work_on_weekend','startdate',
							due,'custevent_kpi_duration','custevent_kpi_ack',
							'custevent_kpi_item','custevent_kpi_item_line','custevent_kpi_service_address',
							'custevent_kpi_task_status','custevent_kpi_planned_startdate','custevent_kpi_task_status',
							'custevent_kpi_planned_duedate', 'custevent_kpi_planned_duration', 'custevent_kpi_current_predecessor',
						]
				});

			arrSearch.run().each(function(result){
				/* var include = true;
				
				if (dayQuest) {
					
					StartDate = result.getValue({name: 'startdate'});
					DueDate   = result.getValue({name: 'duedate'});
					
					include = ( (StartDate <= dayQuest) && (DueDate >= dayQuest));
				}
				
				if (include) { */
					ancount++;
					count = "myWork"+ ancount;
					// Determines if it will show a checkbox true or false symbol
					//var IsWorkOnWeekend = result.getValue({name: 'custevent_kpi_work_on_weekend'});
					var title = result.getValue({name: 'title'});
					var deviation = result.getValue({name: 'custevent_kpi_planned_duration'}) - result.getValue({name: 'custevent_kpi_duration'});
					
					results.push({
						'taskId'			: result.getValue({name: 'internalid'}),
						'taskTitle'			: title.substring(title.indexOf(" - ") + 3),
						'SalesOrder'		: result.getText({name: 'custevent_kpi_sales_order'}).substring(13),
						'company'			: result.getText({name: 'company'}),
						'SalesOrderID'		: result.getValue({name: 'custevent_kpi_sales_order'}),
						'taskKpiItem'		: result.getValue({name: 'custevent_kpi_item'}),
						'taskKpiLine'		: result.getValue({name: 'custevent_kpi_item_line'}),
						'taskKpiAddress'	: result.getValue({name: 'custevent_kpi_service_address'}),
						'taskAssigned'		: result.getText({name: 'assigned'}),
						'taskAssignedID'	: result.getValue({name: 'assigned'}),
						'taskStartDate'		: createpicker(result.getValue({name: 'startdate'}),'StartDate_','StartDate_'+count),
						'taskDueDate'		: createpicker(result.getValue({name: 'duedate'}),'DueDate_','DueDate_'+count),
						'taskWorkWeekend'	: result.getValue({name: 'custevent_kpi_work_on_weekend'}),
						'taskDuration'		: result.getValue({name: 'custevent_kpi_duration'}),
						'taskDependency'	: result.getValue({name: 'custevent_kpi_current_dependency'}),
						'taskStatus'		: result.getValue({name: 'custevent_kpi_task_status'}),
						'taskAck'			: result.getValue({name: 'custevent_kpi_ack'}),
						'taskPredecessor'	: result.getValue({name: 'custevent_kpi_current_predecessor'}),
						'test' 				: result.getValue({name: 'startdate'}),
						'GlobalStartDate'	: formatDate(DateMMDDYYYY(result.getValue({name: 'startdate'}))),
						'GlobalDueDate'		: result.getValue({name: 'duedate'}),
						'WrikeLink' 		: result.getValue({name: 'custevent_kpi_wrike_permalink'}),
						'WrikeID' 			: result.getValue({name: 'custevent_kpi_wrike_id'}),
					'setColortoRedOutDated'	: outdatedTask( String(result.getValue({name: 'duedate'})) ),
						'datoparseada'		: parseada( String (result.getValue({name: 'startdate'})) ),
						'yellow' 			: datedTaskYellow(String(result.getValue({name: 'duedate'})) ),
						'deviation'			: deviation,
					});
					
					// carry out all soales orders
					var soID = result.getValue({name: 'custevent_kpi_sales_order'});
					if (allSOinvolved.indexOf(soID) == -1)
						allSOinvolved.push(soID);
				//}
				
				return (ancount < 2001); // to many tasks... in this call. PROTECTION.
				return true;
			 });

			//----- Get All SalesOrders name...
			function GetAllSalesOrdersName(){
				var searchNso = search.create({
					type : 'transaction',
					filters : [['mainline','is','T'],'and',['internalid','anyof',allSOinvolved]],
					columns : ['tranid','internalid','entity','memo','custbody_vtas_condcom']
				});

				searchNso.run().each(function(res){
					allSOnames[res.getValue('internalid')] = {
						'tso_id': res.getValue('internalid'),
						'tso_entI': res.getValue('entity'),
						'tso_entN': res.getText('entity'),
						'tso_label': res.getValue('tranid'),
						'tso_memo': res.getValue('memo'),
						'tso_memc': res.getValue('custbody_vtas_condcom'),
					};
					return true;
				});
			}
			//-----------------------------
			if (allSOinvolved.length)
				GetAllSalesOrdersName();

			if(WF_DEBUG)
				log.debug({title: "getAllMyWork results", details: {'Tasks':results.length, 'SOdata':allSOinvolved.length} });

			Params.response.write(JSON.stringify({'Tasks':results,'SOdata':allSOnames}));
		};
//---- getAllMyWork<




//---- getAllMyWorkTodayOk>
		module.actions['getAllMyWorkTodayOk'] = function(Params){
			var IdstatusPrev = Params.request.parameters["statusId"];
			var overrideUser = Params.request.parameters["auditId"];
			var dayQuestIn = Params.request.parameters["day"];
			var dayWay = Params.request.parameters["dayWay"];
			var arrSearch,
				arrSearchFilters=[],
				ancount =0;
			var results =[];
			var allSOinvolved = [];
			var allSOnames = {};
			var dayQuest, dayQuestS;
			var NetSuite_Records = 0;
			var flag = true;
			var WF_DEBUG = false;

			if(WF_DEBUG)
				log.debug({title: "getAllMyWorkToday Params", details: Params.request.parameters });
			
			overrideUser = JSON.parse(overrideUser);
			
			function DateToS(date) {
				var d = new Date(date),
					month = '' + (d.getMonth() + 1),
					day = '' + d.getDate(),
					year = d.getFullYear();

				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;

				return [year,month,day].join('-');
			}
			
			function DateToFilter(date) {
				var d = new Date(date),
					month = '' + (d.getMonth() ),
					day = '' + d.getDate(),
					year = d.getFullYear();

				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;
				
				var nd = new Date(year, month, day);
				
				return format.format( {
				    value: nd,
				    type: format.Type.DATE		//-- DATE, CCEXPDATE, DATETIME, DATETIMETZ, MMYYDATE, TIME, TIMEOFDAY, TIMETRACK
				    });
			}
			
			var due = search.createColumn({name: 'duedate',	sort: search.Sort.ASC});
			var department	= search.createColumn({ name:'custrecord_kpit_department'	,join:'custevent_kpi_task_type'});	// column 6
	       	var process 	= search.createColumn({ name:'custrecord_kpit_process'		,join:'custevent_kpi_task_type'});	// column 7
	       	var subprocess	= search.createColumn({ name:'custrecord_kpit_subprocess'	,join:'custevent_kpi_task_type'});	// column 8


			arrSearchFilters.push(
					search.createFilter({
						name: 'assigned',
						operator: search.Operator.ANYOF,
						values: (overrideUser) ? overrideUser : runtime.getCurrentUser().id
					})
				);

			arrSearchFilters.push(
					search.createFilter({
						name: 'custevent_kpi_workforce_task',
						operator: search.Operator.IS,
						values: "T"
					})
				);
			

			if(!IdstatusPrev){
				
				IdstatusPrev = '1';
				
			}else{
				var istatus = [];
				var ackArray = [];
				IdstatusPrev = IdstatusPrev.split(',');

				IdstatusPrev.forEach(function(it){
					if(it < 1001 )
						istatus.push(it);
					else{
						if(it == 1001)
							ackArray.push("T");
						else
							ackArray.push("F");
					}
				});

				if(istatus.length)
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_task_status',
					operator: search.Operator.IS,
					values: istatus
				}));

				if(ackArray && ackArray.length == 1)
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_ack',
					operator: search.Operator.IS,
					values: ackArray
				}));
			}
			
			
			if(dayQuestIn){
				
				dayQuest = format.format( new Date( dayQuestIn ),  format.Type.DATE );
					
				dayQuestS = DateToS( dayQuestIn );
				
				if(WF_DEBUG)
	                  log.debug({title: "getAllMyWorkToday dayQuest", details: {'dayQuest': dayQuest, 'dayQuestS': dayQuestS } });

				 switch (dayWay) {
					case 'past':		// include = (DueDate < dayQuest);
						var duedate_loe = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORBEFORE,
							values: dayQuest,
						});
						arrSearchFilters.push( duedate_loe );
						break;
					case 'today':		// include = ( (StartDate <= dayQuest) && (DueDate >= dayQuest));
						var startdate_moe = search.createFilter({
							name: 'startdate',
							operator: search.Operator.ONORBEFORE,
							values: dayQuest,
						});
						var duedate_loe = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORAFTER,
							values: dayQuest,
						});
						arrSearchFilters.push( startdate_moe );
						arrSearchFilters.push( duedate_loe );
						break;
					case 'will':		// include = (DueDate > dayQuest);
						var duedate_loe = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORAFTER,
							values: dayQuest,
						});
						arrSearchFilters.push( duedate_loe );
						break;
				}
				
			}

			if(WF_DEBUG)
				log.debug({title: "getAllMyWorkToday filters", details: arrSearchFilters });

			arrSearch = search.create({
				type: 'task',
				filters: arrSearchFilters ,
				columns: [
							'internalid','company','custevent_kpi_sales_order',
							'custevent_kpi_wrike_id','custevent_kpi_wrike_permalink','custevent_kpi_ack',
							'custevent_kpi_task_status','custevent_kpi_current_dependency','title',
							'assigned','custevent_kpi_work_on_weekend','startdate',
							due,'custevent_kpi_duration','custevent_kpi_ack',
							'custevent_kpi_item','custevent_kpi_item_line','custevent_kpi_service_address',
							'custevent_kpi_task_status','custevent_kpi_planned_startdate','custevent_kpi_task_status',
							'custevent_kpi_planned_duedate', 'custevent_kpi_current_predecessor',
							'custevent_kpi_task_type', department, process, subprocess
						]
				});
			
			arrSearch.run().each(function(result){
				NetSuite_Records++;
				
				var include = true;
				//var note = '';
				
				/* if (dayQuestIn) {
					
					var StartDate = result.getValue({name: 'startdate'});
					var DueDate   = result.getValue({name: 'duedate'});
					
					StartDate = DateToS( StartDate );
					DueDate = DateToS( DueDate );
					
					if(WF_DEBUG && flag){
	                    log.debug({title: "getAllMyWorkToday flag", 
	                    	details: { 
	                    	'start':StartDate, 
	                    	'due': DueDate, 
	                    	'dayQuest': dayQuestS
	                    	} 
	                    });
	                    
	                    flag = ! flag;
	                 }
					/* note = { 
	                    	'start':StartDate, 
	                    	'due': DueDate, 
	                    	'dayQuest': dayQuest
	                    	}; * / 
					
					switch (dayWay) {
						case 'past':
							include = (DueDate < dayQuestS);
							break;
						case 'today':
							include = ( (StartDate <= dayQuestS) && (DueDate >= dayQuestS) );
							break;
						case 'will':
							include = (DueDate > dayQuestS);
							break;
					}
						
				} */
				
				if (include) {
					ancount++;
					// Determines if it will show a checkbox true or false symbol
					var title = result.getValue({name: 'title'});
					results.push({
						'Id'			: result.getValue({name: 'internalid'}),
						'Title'			: title.substring(title.indexOf(" - ") + 3),
						'SalesOrder'	: result.getText ({name: 'custevent_kpi_sales_order'}).substring(13),
						'SalesOrderID'	: result.getValue({name: 'custevent_kpi_sales_order'}),
						'company'		: result.getValue({name: 'company'}),
						'company_n'		: result.getText ({name: 'company'}),
						'KpiItem'		: result.getValue({name: 'custevent_kpi_item'}),
						'KpiItem_n'		: result.getText ({name: 'custevent_kpi_item'}),
						'KpiLine'		: result.getValue({name: 'custevent_kpi_item_line'}),
						'KpiAddress'	: result.getValue({name: 'custevent_kpi_service_address'}),
						'KpiAddress_n'	: result.getText ({name: 'custevent_kpi_service_address'}),
						'Assigned'		: result.getText ({name: 'assigned'}),
						'AssignedID'	: result.getValue({name: 'assigned'}),
						'StartDate'		: result.getValue({name: 'startdate'}),
						'DueDate'		: result.getValue({name: 'duedate'}),
						'WorkWeekend'	: result.getValue({name: 'custevent_kpi_work_on_weekend'}),
						'Duration'		: result.getValue({name: 'custevent_kpi_duration'}),
						'Dependency'	: result.getValue({name: 'custevent_kpi_current_dependency'}),
						'Status'		: result.getValue({name: 'custevent_kpi_task_status'}),
						'Ack'			: result.getValue({name: 'custevent_kpi_ack'}),
						'Predecessor'	: result.getValue({name: 'custevent_kpi_current_predecessor'}),
						'WrikeLink' 	: result.getValue({name: 'custevent_kpi_wrike_permalink'}),
						'WrikeID' 		: result.getValue({name: 'custevent_kpi_wrike_id'}),
						'type'			: result.getValue({name: 'custevent_kpi_task_type'}),
						'type_n'		: result.getText ({name: 'custevent_kpi_task_type'}),
						'department'	: result.getValue(department),
						'department_n'	: result.getText (department),
						'process'		: result.getValue(process),
						'process_n'		: result.getText (process),
						'subprocess'	: result.getValue(subprocess),
						'subprocess_n'	: result.getText (subprocess),
						//'note'			: JSON.stringify(note),
					});
	
					// carry out all soales orders
					var soID = result.getValue({name: 'custevent_kpi_sales_order'});
					if (allSOinvolved.indexOf(soID) == -1)
						allSOinvolved.push(soID);
				}
				
				return (NetSuite_Records < 3900); // This refer to how many records have processed on this search, max 4000.
				return (ancount < 3800); // to many tasks... in this call. PROTECTION.
				return (ancount < 3001); // to many tasks... in this call. PROTECTION.
				return (ancount < 2001); // to many tasks... in this call. PROTECTION.
				return true;
			 });

			//----- Get All SalesOrders name...
			function GetAllSalesOrdersName(){
				var searchNso = search.create({
					type : 'transaction',
					filters : [['mainline','is','T'],'and',['internalid','anyof',allSOinvolved]],
					columns : ['tranid','internalid','entity','memo','custbody_vtas_condcom']
				});

				searchNso.run().each(function(res){
					allSOnames[res.getValue('internalid')] = {
						'tso_id': res.getValue('internalid'),
						'tso_entI': res.getValue('entity'),
						'tso_entN': res.getText('entity'),
						'tso_label': res.getValue('tranid'),
						'tso_memo': res.getValue('memo'),
						'tso_memc': res.getValue('custbody_vtas_condcom'),
					};
					return true;
				});
			}
			//-----------------------------
			if (allSOinvolved.length)
				GetAllSalesOrdersName();

			if(WF_DEBUG)
				log.debug({title: "getAllMyWorkToday results", details: {'Tasks':results.length, 'SOdata':allSOinvolved.length} });

			Params.response.write(JSON.stringify({'Tasks':results,'SOdata':allSOnames}));
		};
//---- getAllMyWorkTodayOk<
		
		

//---- getAllMyWorkToday>
		module.actions['getAllMyWorkToday'] = function(Params){
			var statusId = Params.request.parameters["statusId"];
			var overrideUser = Params.request.parameters["auditId"];
			var dayQuestIn = Params.request.parameters["day"];
			var dayWay = Params.request.parameters["dayWay"];
			var ahora = Params.request.parameters["ahora"];
			var arrSearch,
				arrSearchFilters=[],
				ancount =0;
			var results =[];
			var allSOinvolved = [], allSAinvolved = [];
			var allSOnames = {};
			var dayQuest, dayQuestS;
			var NetSuite_Records = 0;
			var flag = true;
			var IdstatusPrev;
			var WF_DEBUG = true;
			
			WF_DEBUG = WF_DEBUG && (runtime.getCurrentUser().id == '79531'||  runtime.getCurrentUser().id == '75401');
			
			var newResults = {
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
					'cities' : {},
					'states' : {},
					'municipalities' : {},
					'taskstatus' : { 0 : '', 1:'Active', 2:'Completed', 3:'Deferred', 4:'Canceled' }
				}
			
			ahora = JSON.parse(ahora);
			
			if(WF_DEBUG)
				log.debug({title: "getAllMyWorkToday Params", details: Params.request.parameters });
			//log.debug({title: "getAllMyWorkToday Params", details: ahora });
			
			overrideUser = JSON.parse(overrideUser);
			
			// Void errors...
			if (overrideUser && overrideUser.length == 0) {
				return Params.response.write(JSON.stringify({'count':0, 'rrows':newResults }));
			}
			
			function getDateFormatUserPref () {
				var UserPref= config.load({
	                type: config.Type.USER_PREFERENCES
	            });
				if(UserPref) {
					var dateFormat = UserPref.getValue('DATEFORMAT');
					log.debug({title: "getAllMyWorkToday USER_PREFERENCES", details: {'DATEFORMAT':dateFormat} });
				}
			}
			
			//-- getDateFormatUserPref();
			
			function DateToS(date) {
				var d = new Date(date),
					month = '' + (d.getMonth() + 1),
					day = '' + d.getDate(),
					year = d.getFullYear();

				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;

				return [year,month,day].join('-');
			}
			
			function DateToFilter(date) {
				var d = new Date(date),
					month = '' + (d.getMonth() ),
					day = '' + d.getDate(),
					year = d.getFullYear();

				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;
				
				var nd = new Date(year, month, day);
				
				return format.format( {
				    value: nd,
				    type: format.Type.DATE		//-- DATE, CCEXPDATE, DATETIME, DATETIMETZ, MMYYDATE, TIME, TIMEOFDAY, TIMETRACK
				    });
			}
			
			function DateToFilterNew() {
				var nd = new Date(ahora.y, ahora.m, ahora.d);
				
				if(WF_DEBUG)
					log.debug({title: "getAllMyWorkToday DateToFilterNew", details: { DateToFilterNew: nd } });
				
				return format.format( {
					    value: nd,
					    type: format.Type.DATE
				    });
			}
			
			var due = search.createColumn({name: 'duedate',	sort: search.Sort.ASC});
			var department	= search.createColumn({ name:'custrecord_kpit_department'	,join:'custevent_kpi_task_type'});	// column 6
	       	var process 	= search.createColumn({ name:'custrecord_kpit_process'		,join:'custevent_kpi_task_type'});	// column 7
	       	var subprocess	= search.createColumn({ name:'custrecord_kpit_subprocess'	,join:'custevent_kpi_task_type'});	// column 8

			arrSearchFilters.push(
					search.createFilter({
						name: 'assigned',
						operator: search.Operator.ANYOF,
						values: (overrideUser) ? overrideUser : runtime.getCurrentUser().id
					})
				);

			arrSearchFilters.push(
					search.createFilter({
						name: 'custevent_kpi_workforce_task',
						operator: search.Operator.IS,
						values: "T"
					})
				);

			if(!statusId) statusId = '1';
			
			//----
				var istatus = [];
				var ackArray = [];
				var IdstatusPrev = statusId.split(',');

				IdstatusPrev.forEach(function(it){
					if(it < 1001 )
						istatus.push(it);
					else{
						if(it == 1001)
							ackArray.push("T");
						else
							ackArray.push("F");
					}
				});

				if(istatus.length)
					arrSearchFilters.push(search.createFilter({
						name: 'custevent_kpi_task_status',
						operator: search.Operator.IS, values: istatus
						}));

				if(ackArray && ackArray.length == 1)
					arrSearchFilters.push(search.createFilter({
						name: 'custevent_kpi_ack',
						operator: search.Operator.IS, values: ackArray
						}));
			//----
			
			if (dayQuestIn) {
				
				//dayQuest = format.format( new Date(  ),  format.Type.DATE );
				dayQuest = DateToFilterNew();
					
				dayQuestS = DateToS( dayQuestIn );
				
				if(WF_DEBUG)
	                  log.debug({title: "getAllMyWorkToday dayQuest", 
	                	  details: {
	                		  'dayQuestIn'	: dayQuestIn, 
	                		  'dayQuest'	: dayQuest, 
	                		  'dayQuestS'	: dayQuestS, 
	                		  'newDate'		: new Date( dayQuestIn ),
	                		  }
	                  });

				 switch (dayWay) {
					case 'past':		// include = (DueDate < dayQuest);
						var duedate_loe = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORBEFORE,
							values: dayQuest,
						});
						arrSearchFilters.push( duedate_loe );
						break;
					case 'today':		// include = ( (StartDate <= dayQuest) && (DueDate >= dayQuest));
						
						if (istatus.length == 1 && istatus[0] == 1) { // Include Active Tasks
							var startdate_moe = search.createFilter({
								name: 'startdate',
								operator: search.Operator.ONORBEFORE,
								values: dayQuest,
							});
							var duedate_loe = search.createFilter({
								name: 'enddate',
								operator: search.Operator.ONORAFTER,
								values: dayQuest,
							});
							arrSearchFilters.push( startdate_moe );
							arrSearchFilters.push( duedate_loe );
						} else {
							var duedate_loe = search.createFilter({
								name: 'enddate',
								operator: search.Operator.ON,
								values: dayQuest,
							});
							arrSearchFilters.push( duedate_loe );
						}
						break;
					case 'will':		// include = (DueDate > dayQuest);
						var duedate_loe = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORAFTER,
							values: dayQuest,
						});
						arrSearchFilters.push( duedate_loe );
						break;
				}
				
			}
			
			/**
			 * Push if not exist on results...
			 * tasks..... this is the main
			 * departments
			 * salesorders
			 * items
			 * servicesaddresses serviceaddresses
			 * assigned
			 * process
			 * subprocess
			 * customers
			 */
			function Results_pusher(list_name, id, values){
				if (! newResults[list_name][id] ) {
					newResults[list_name][id] = values
				}
			}

			if(WF_DEBUG)
				log.debug({title: "getAllMyWorkToday filters", details: arrSearchFilters });

			arrSearch = search.create({
				type: 'task',
				filters: arrSearchFilters ,
				columns: [
							'internalid','company','custevent_kpi_sales_order',
							'custevent_kpi_wrike_id','custevent_kpi_wrike_permalink','custevent_kpi_ack',
							'custevent_kpi_task_status','custevent_kpi_current_dependency','title',
							'assigned','custevent_kpi_work_on_weekend','startdate',
							due,'custevent_kpi_duration','custevent_kpi_ack',
							'custevent_kpi_item','custevent_kpi_item_line','custevent_kpi_service_address',
							'custevent_kpi_task_status','custevent_kpi_planned_startdate','custevent_kpi_task_status',
							'custevent_kpi_planned_duedate', 'custevent_kpi_current_predecessor','status',
							'custevent_kpi_task_type', department, process, subprocess
						]
				});
			
			arrSearch.run().each(function(result){
				NetSuite_Records++;
				
				var include = true;
				
				if (include) {
					// Determines if it will show a checkbox true or false symbol
					var title = result.getValue({name: 'title'});
					var xtask = {
						'id'			: result.getValue({name: 'internalid'}),
						'Title'			: title.substring(title.indexOf(" - ") + 3),
						'sort_due'		: ancount,
						'SalesOrder'	: result.getValue({name: 'custevent_kpi_sales_order'}),
						'company'		: result.getValue({name: 'company'}),
						'KpiItem'		: result.getValue({name: 'custevent_kpi_item'}),
						'KpiLine'		: result.getValue({name: 'custevent_kpi_item_line'}),
						'KpiAddress'	: result.getValue({name: 'custevent_kpi_service_address'}),
						'Assigned'		: result.getValue({name: 'assigned'}),
						'StartDate'		: result.getValue({name: 'startdate'}),
						'DueDate'		: result.getValue({name: 'duedate'}),
						'WorkWeekend'	: result.getValue({name: 'custevent_kpi_work_on_weekend'}),
						'Duration'		: result.getValue({name: 'custevent_kpi_duration'}),
						'Dependency'	: result.getValue({name: 'custevent_kpi_current_dependency'}),
						'Status'		: result.getValue({name: 'custevent_kpi_task_status'}),
						'Ack'			: result.getValue({name: 'custevent_kpi_ack'}),
						'Predecessor'	: result.getValue({name: 'custevent_kpi_current_predecessor'}),
						'WrikeLink' 	: result.getValue({name: 'custevent_kpi_wrike_permalink'}),
						'WrikeID' 		: result.getValue({name: 'custevent_kpi_wrike_id'}),
						'type'			: result.getValue({name: 'custevent_kpi_task_type'}),
						'department'	: result.getValue(department),
						'process'		: result.getValue(process),
						'subprocess'	: result.getValue(subprocess),
						'start_p'		: result.getValue({name: 'custevent_kpi_planned_startdate'}),
						'due_p'			: result.getValue({name: 'custevent_kpi_planned_duedate'}),
						'status_ns'		: result.getValue({name: 'ststus'}),
					};
					
					//results.push( xtask );
					Results_pusher('tasks', ancount, xtask );
					Results_pusher('customers', xtask.company, result.getText ('company') );
					Results_pusher('salesorders', xtask.SalesOrder, result.getText ('custevent_kpi_sales_order').substring(13) );
					Results_pusher('items', xtask.KpiItem, result.getText ('custevent_kpi_item') );
					Results_pusher('servicesaddresses', xtask.KpiAddress, result.getText ('custevent_kpi_service_address') );
					Results_pusher('assigned', xtask.Assigned, result.getText ('assigned') );
					Results_pusher('types', xtask.type, result.getText ({name: 'custevent_kpi_task_type'}) );
					Results_pusher('departments', xtask.department, result.getText (department) );
					Results_pusher('process', xtask.process, result.getText (process) );
					Results_pusher('subprocess', xtask.subprocess, result.getText (subprocess) );
					
					// carry out all soales orders
					var soID = xtask.SalesOrder;
					if (allSOinvolved.indexOf(soID) == -1) allSOinvolved.push(soID);
					var saID = xtask.KpiAddress;
					if (saID && allSAinvolved.indexOf(saID) == -1) allSAinvolved.push(saID);
					
					ancount++;
				}
				
				return (NetSuite_Records < 3900); // This refer to how many records have processed on this search, max 4000.
				return true;
			 });

			//----- Get All SalesOrders name...
			function GetAllSalesOrdersName(){
				var searchNso = search.create({
					type : 'transaction',
					filters : [['mainline','is','T'],'and',['internalid','anyof',allSOinvolved]],
					columns : ['tranid','internalid','entity','memo','custbody_vtas_condcom']
				});

				searchNso.run().each(function(res){
					newResults['salesorders'][res.getValue('internalid')] = {
						'id': res.getValue('internalid'),
						'entI': res.getValue('entity'),
						'entN': res.getText('entity'),
						'label': res.getValue('tranid'),
						'memo': res.getValue('memo'),
						'memc': res.getValue('custbody_vtas_condcom'),
					};
					return true;
				});
			}
			//----- Get All Cities name...
			function getAllServiceAddressCities (){
				if(WF_DEBUG)
					log.debug({title: "getAllMyWorkToday getAllServiceAddressCities", details: {'allSAinvolved': allSAinvolved} });

				 search.create({
				 	type: 'customrecord_service_address',
				 	filters: ['internalId','anyOf',allSAinvolved],
				 	columns : ['internalId','custrecord_city','custrecord_state','custrecord_sa_municipality']
				 }).run().each(function(sar){
				 	var xy = sar.getValue('internalId');
				 	if(xy !== null) {
				 		var nm = newResults['servicesaddresses'][xy];
				 		newResults['servicesaddresses'][xy]={
				 			'id'		: xy,
				 			'name'		: nm,
				 			'city'		: sar.getValue('custrecord_city'),
				 			'state'		: sar.getValue('custrecord_state'),
				 			'municipality' : sar.getValue('custrecord_sa_municipality'),
				 		};
				 		Results_pusher('cities', sar.getValue('custrecord_city'), sar.getText('custrecord_city') );
				 		Results_pusher('states', sar.getValue('custrecord_state'), sar.getText('custrecord_state') );
				 		Results_pusher('municipalities', sar.getValue('custrecord_sa_municipality'), sar.getText('custrecord_sa_municipality') );
				 	}
				 	return true;
				 });
			}
			//-----------------------------
			
			if (allSOinvolved.length) GetAllSalesOrdersName();
			if (allSAinvolved.length) getAllServiceAddressCities();

			if(WF_DEBUG)
				log.debug({title: "getAllMyWorkToday results", details: {'Tasks':results.length, 'SOdata':allSOinvolved.length} });

			Params.response.write(JSON.stringify({'count':ancount, 'rrows':newResults }));
		};
//---- getAllMyWorkToday<
				
				
				
//---- getMyNotifications>
		module.actions['getMyNotifications'] = function(Params){
			var notif_status = Params.request.parameters["status"];
			var notif_overrideUser = Params.request.parameters["auditId"];
			var notif_last_date = Params.request.parameters["last_date"];
			var notif_last_id = Params.request.parameters["last_id"];
			var notif_page = Params.request.parameters["page"];
			var notif_inout = Params.request.parameters["inout"];
			
			var notfSearch,
				notfSearchFilters=[],
				ancount =0,
				count = 0;
			
			var results =[];
			var allMSGinvolved = [];
			var allSOnames = {};
			var WF_DEBUG = false;
			var dayQuest;

			if(WF_DEBUG)
				log.debug({title: "getMyNotifications Params", details: Params.request.parameters });
			
			notif_overrideUser = JSON.parse(notif_overrideUser);
			
			function DateTimeToFilter(dt) {
				function addZero(i) { if (i < 10) { i = "0" + i; } return i; }
				var d = format.parse(dt,'date'),
					month = '' + (d.getMonth() +1 ),
					day = '' + (d.getDate()),
					year = d.getFullYear(),
					hours = addZero(d.getHours()),
					mins = addZero(d.getMinutes());
				
				if (((dt.indexOf('pm') != -1) || (dt.indexOf('PM') != -1)) && (hours < 12)) {
					hours = (hours * 1) + 12;
				}
				
				return ''+format.format(d,'date')+' '+hours+':'+mins+''
			}
			
			function DateTimeToFilterRelative(dt,dy) {
				function addZero(i) { if (i < 10) { i = "0" + i; } return i; }
				var d = format.parse(dt,'date');
				if(dy != 0)
					d.setDate( d.getDate() + dy);
				var	month = '' + (d.getMonth() +1 ),
					day = '' + (d.getDate()),
					year = d.getFullYear(),
					hours = addZero(d.getHours()),
					mins = addZero(d.getMinutes());
				
				//Override to include all day.
				hours = '00'; mins= '00';
				
				return ''+format.format(d,'date')+' '+hours+':'+mins+''
			}
			
			
			if (notif_inout == 'outgoing') {
				notfSearchFilters.push(
						search.createFilter({
							name: 'custrecord_wf_comm_from_user',
							operator: search.Operator.ANYOF,
							values: (notif_overrideUser) ? notif_overrideUser : runtime.getCurrentUser().id
						})
					);
				
				// La primera vez funciona que solo lea desde ayuer maximo
				var today = new Date();
				var yesterday = DateTimeToFilterRelative(today, -1);
				notfSearchFilters.push(
						search.createFilter({
							name: 'custrecord_wf_comm_timestamp',
							operator: search.Operator.AFTER,
							values: yesterday
						}));
				
			} else {
				notfSearchFilters.push(
						search.createFilter({
							name: 'custrecord_wf_comm_to_user',
							operator: search.Operator.ANYOF,
							values: (notif_overrideUser) ? notif_overrideUser : runtime.getCurrentUser().id
						})
					);
				notfSearchFilters.push(
						search.createFilter({
							name: 'custrecord_wf_comm_msg_status',
							operator: search.Operator.IS,
							values: "1"
						})
					);
			}
			
			if(notif_last_id && notif_last_date && notif_last_id > 0) {
				
				var filterdatetime = DateTimeToFilter(notif_last_date);
				if(WF_DEBUG)
					log.debug({title: "getMyNotifications filterdatetime", details: {'filterdatetime':filterdatetime} });
				
				notfSearchFilters.push(
						search.createFilter({
							name: 'custrecord_wf_comm_timestamp',
							operator: search.Operator.AFTER,
							values: filterdatetime
						}));
				
				// Exclude the last ID in client browser
				notfSearchFilters.push(
						search.createFilter({
							name: 'internalid',
							operator: search.Operator.NONEOF,
							values: notif_last_id
						}));
			}

			var order_by_date = search.createColumn({name: 'custrecord_wf_comm_timestamp',	sort: search.Sort.DESC });
			
			arrSearch = search.create({
				type: 'customrecord_sst_wf_communicator',
				filters: notfSearchFilters ,
				columns: [
							'internalid','custrecord_wf_comm_to_user','custrecord_wf_comm_from_user',
							'custrecord_wf_comm_so','custrecord_wf_comm_task','custrecord_wf_comm_message',
							'custrecord_wf_comm_timestamp','custrecord_wf_comm_msg_status','custrecord_wf_comm_msg_ack',
							order_by_date, 'custrecord_wf_comm_msg_link','custrecord_wf_comm_msg_type',
						]
				});

			if(WF_DEBUG)
				log.debug({title: "getMyNotifications filters", details: notfSearchFilters });
			
			var flag = true;

			var NetSuite_Records = 0;
			
			var runing = arrSearch.run();
			
			runing.each(function(result){
				NetSuite_Records++;
					
				var include = true;
				var MsgLink = result.getValue({name: 'custrecord_wf_comm_msg_link'});
				
				if (include) {
					ancount++;
					results.push({
						'id'		: result.getValue({name: 'internalid'}),
						'to'		: result.getValue({name: 'custrecord_wf_comm_to_user'}),
						'ton'		: result.getText ({name: 'custrecord_wf_comm_to_user'}),
						'from'		: result.getValue({name: 'custrecord_wf_comm_from_user'}),
						'fromn'		: result.getText ({name: 'custrecord_wf_comm_from_user'}),
						'soi'		: result.getValue({name: 'custrecord_wf_comm_so'}),
						'son'		: result.getText ({name: 'custrecord_wf_comm_so'}),
						'task'		: result.getValue({name: 'custrecord_wf_comm_task'}),
						'taskn'		: result.getText ({name: 'custrecord_wf_comm_task'}),
						'message'	: result.getValue({name: 'custrecord_wf_comm_message'}),
						'stamp'		: result.getValue({name: 'custrecord_wf_comm_timestamp'}),
						'status'	: result.getValue({name: 'custrecord_wf_comm_msg_status'}),
						'statusn'	: result.getText ({name: 'custrecord_wf_comm_msg_status'}),
						'ack'		: result.getValue({name: 'custrecord_wf_comm_msg_ack'}),
						'type'		: result.getValue({name: 'custrecord_wf_comm_msg_type'}),
						'typen'		: result.getText ({name: 'custrecord_wf_comm_msg_type'}),
						'msglink'	: MsgLink,
					});
					
					if (MsgLink)
						allMSGinvolved.push( MsgLink );
				}
				
				return (NetSuite_Records < 3900); // This refer to how many records have processed on this search, max 4000.
				return true;
			 });
			
			// Searching Original messages if is needed
			if (allMSGinvolved.length) {
				var AllContents = [];
				search.create({
					type: 'customrecord_sst_wf_communicator',
					filters: [ ['internalid', 'anyof', allMSGinvolved] ],
					columns: [ 'internalid', 'custrecord_wf_comm_message' ]
					})
				.run()
				.each(function(result){
					var oid = result.getValue({name: 'internalid'});
					var RealMessage = result.getValue({name: 'custrecord_wf_comm_message'});
					results.forEach(function(xm,idx){ if(xm.msglink == oid){ results[idx].message = RealMessage; } });
					return true;
				 });
			}

			if(WF_DEBUG)
				log.debug({title: "getMyNotifications results", details: {'Messages':results.length} });

			Params.response.write(JSON.stringify({'Messages':results}));
		};
//---- getMyNotifications<

		
//---- setViewNotifications>
		module.actions['setViewNotifications'] = function(Params){
			var id = Params.request.parameters["id"];
			var todaynow = format.format(new Date(), 'datetime');
			var viewed = 2;
			var result_id = record.submitFields({
			    type: 'customrecord_sst_wf_communicator',
			    id: id,
			    values: {
			    	custrecord_wf_comm_msg_ack : todaynow, 
			    	custrecord_wf_comm_msg_status : viewed
			    },
			    options: {
			        enableSourcing: false,
			        ignoreMandatoryFields : true
			    }
			});
			
		}
//---- setViewNotifications<
		
		
//---- setESOWonSO>
		module.actions['setESOWonSO'] = function(Params){
			var id = Params.request.parameters["WhichSalesOrder"];
			var esow = Params.request.parameters["ESOW"];
			var result_id = record.submitFields({
			    type: 'salesorder',
			    id: id,
			    values: {
			    	custbody_op_eng_sow : esow
			    },
			    options: {
			        enableSourcing: false,
			        ignoreMandatoryFields : true
			    }
			});
		}
//---- setESOWonSO<
		
		
		
//---- getStatsToday>
		module.actions['getStatsToday'] = function(Params){
			var overrideUser = Params.request.parameters["auditId"];
			var dayQuestIn = Params.request.parameters["day"];
			var dayWay = Params.request.parameters["dayWay"];
			var ahora = Params.request.parameters["ahora"];
			var arrSearch,
				arrSearchFilters=[],
				ancount =0;
			var results =[];
			var allSOinvolved = [];
			var allSOnames = {};
			var dayQuest, dayQuestS;
			var NetSuite_Records = 0;
			var flag = true;
			var istatus = '1';
			var WF_DEBUG = false;
			
			var results = {
					'tasks' : {},
					'status' : {},
					'ack' : {},
					'salesorders' : {},
					'deviation' : {},
				};
			
			//Enable DEBUG only for this user---- Ariel
			WF_DEBUG = WF_DEBUG && (runtime.getCurrentUser().id == '79531'||  runtime.getCurrentUser().id == '75401');
			
			ahora = JSON.parse(ahora);
			overrideUser = JSON.parse(overrideUser);
			
			if(WF_DEBUG) {
				log.debug({title: "getStatsToday Params", details: Params.request.parameters });
				log.debug({title: "getStatsToday Params", details: ahora });
			}
			
			function DateToFilterNew() {
				var nd = new Date(ahora.y, ahora.m, ahora.d);
				
				return format.format( {
					    value: nd,
					    type: format.Type.DATE
				    });
			}
			
			var due = search.createColumn({name: 'duedate',	sort: search.Sort.ASC});
			var department	= search.createColumn({ name:'custrecord_kpit_department',join:'custevent_kpi_task_type'});	// column 6
	       	var process 	= search.createColumn({ name:'custrecord_kpit_process'	,join:'custevent_kpi_task_type'});	// column 7
	       	var subprocess	= search.createColumn({ name:'custrecord_kpit_subprocess',join:'custevent_kpi_task_type'});	// column 8

			arrSearchFilters.push(
					search.createFilter({
						name: 'assigned',
						operator: search.Operator.ANYOF,
						values: (overrideUser) ? overrideUser : runtime.getCurrentUser().id
					})
				);

			arrSearchFilters.push(
					search.createFilter({
						name: 'custevent_kpi_workforce_task',
						operator: search.Operator.IS,
						values: "T"
					})
				);
			
			if(istatus)
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_task_status',
					operator: search.Operator.IS,
					values: istatus
				}));
			
			if (dayQuestIn) {
				
				dayQuest = DateToFilterNew();

				switch (dayWay) {
					case 'past':		// include = (DueDate < dayQuest);
						var duedate_loe = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORBEFORE,
							values: dayQuest,
						});
						arrSearchFilters.push( duedate_loe );
						break;
					case 'today':		// include = ( (StartDate <= dayQuest) && (DueDate >= dayQuest));
						var startdate_moe = search.createFilter({
							name: 'startdate',
							operator: search.Operator.ONORBEFORE,
							values: dayQuest,
						});
						var duedate_loe = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORAFTER,
							values: dayQuest,
						});
						arrSearchFilters.push( startdate_moe );
						arrSearchFilters.push( duedate_loe );
						break;
					case 'will':		// include = (DueDate > dayQuest);
						var duedate_loe = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORAFTER,
							values: dayQuest,
						});
						arrSearchFilters.push( duedate_loe );
						break;
				}
				
			}
			
			function Count_pusher(list_name, id, values){
				if (! results[list_name][id] ) {
					if (! results[list_name][id] ) {
						results[list_name][id] = values
					} else {
						results[list_name][id] = values
					}
				} else {
					results[list_name][id]++;
				}
			}
			
			function calc_deviation(tsk){
				var start = tsk.start, due = tsk.due, start_p = tsk.start_p, due_p = tsk.due_p, dur_p = tsk.duration_p;
				// var orignal_duration_calc = LeirAGS_dates.diffDays( due_p, start_p ) + 1;
				var orignal_duration_calc = LeirAGS_dates.diffWrkDays( start_p, due_p, tsk.WonW );
				var curr_duration = tsk.duration;
				// var enddate_deviation_calc = LeirAGS_dates.diffDays( due, due_p ) + 1;
				var enddate_deviation_calc = LeirAGS_dates.diffWrkDays( due_p, due, tsk.WonW );
				
				if ((dur_p - curr_duration) >= 0)
					Count_pusher('deviation', 'positive', 1 );
				else
					Count_pusher('deviation', 'negative', 1 );
				
				/*
				if ((curr_duration - orignal_duration_calc) >= 0)
					Count_pusher('deviation', 'positive', 1 );
				else
					Count_pusher('deviation', 'negative', 1 );
					*/
			}
			
			Count_pusher('ack', false, 0 );
			Count_pusher('ack', true, 0 );
			Count_pusher('salesorders', 'count', 0 );
			Count_pusher('tasks', 'count', 0 );
			Count_pusher('status', 'Active', 0 );
			Count_pusher('status', 'Completed', 0 );
			Count_pusher('deviation', 'positive', 0 );
			Count_pusher('deviation', 'negative', 0 );

			if(WF_DEBUG)
				log.debug({title: "getStatsToday filters", details: arrSearchFilters });

			arrSearch = search.create({
				type: 'task',
				filters: arrSearchFilters ,
				columns: [
							'internalid',
							'custevent_kpi_ack',
							'custevent_kpi_sales_order',
							'startdate',
							'duedate',
							'custevent_kpi_duration',
							'custevent_kpi_task_status',
							'custevent_kpi_planned_startdate',
							'custevent_kpi_planned_duedate',
							'custevent_kpi_task_type',
							'assigned',
							'custevent_kpi_work_on_weekend',
							'custevent_kpi_planned_duration',
						]
				});
			
			arrSearch.run().each(function(result){
				NetSuite_Records++;
				var xtask = {
						'id'		: result.getValue({name: 'internalid'}),
						'start'		: result.getValue({name: 'startdate'}),
						'due'		: result.getValue({name: 'duedate'}),
						'duration'	: result.getValue({name: 'custevent_kpi_duration'}),
						'status'	: result.getValue({name: 'custevent_kpi_task_status'}),
						'ack'		: result.getValue({name: 'custevent_kpi_ack'}),
						'type'		: result.getValue({name: 'custevent_kpi_task_type'}),
						'start_p'	: result.getValue({name: 'custevent_kpi_planned_startdate'}),
						'due_p'		: result.getValue({name: 'custevent_kpi_planned_duedate'}),
						'duration_p': result.getValue({name: 'custevent_kpi_planned_duration'}),
						'subprocess': result.getValue(subprocess),
						'salesorder': result.getValue({name: 'custevent_kpi_sales_order'}),
						'WonW'		: result.getValue({name: 'custevent_kpi_work_on_weekend'}),
					};
				
				// carry out all soales orders
				var soID = xtask.salesorder;
				if (allSOinvolved.indexOf(soID) == -1) {
					allSOinvolved.push(soID);
					Count_pusher('salesorders', 'count', 1 );
				}
				Count_pusher('tasks', 'count', 1 );
				Count_pusher('status', result.getText({ name: 'custevent_kpi_task_status' }) , 1 );
				Count_pusher('ack', xtask.ack, 1 );
				calc_deviation(xtask);
				
				return (NetSuite_Records < 3900); // This refer to how many records have processed on this search, max 4000.
				return true;
			 });

			if(WF_DEBUG)
				log.debug({title: "getStatsToday results", details: {'Results':results, 'SOdata':allSOinvolved} });

			Params.response.write(JSON.stringify( results ));
		};
//---- getStatsToday<

		
//---- SaveNewTask>
		module.actions['SaveNewTask'] = function (Params){
			var objF 			= JSON.parse( Params.request.parameters['objectF'] );
			var successorTask 	= Params.request.parameters['successorTask'];
			var predeccesorTask = Params.request.parameters['predeccesorTask'];
			var dependencySucc 	= Params.request.parameters['dependencySucc'];
			var dependencyPress = Params.request.parameters['dependencyPress'];
			var ResultsSave 	= [];
			var RecordsCreated  = [];
			var RecordsDeleted  = [];
			var error  = false;
			var msg = '';
			var recordTaskId = 0;
			
			function addtoWrike(id,title,assigne,start,due,wow){
				var taskObj = {
						task: 'createTask',
						sentObj: {
							opType: 'task',
							opId: id,
							wrikeFolder: 'IEAABMCWI4B3NROE',
							opObj: {
								'title': title,
								'responsibles': [ 'KUAB7YUO' ],
								'importance': 'High',
								'description': title,
								'dates': {
									'start': start, 	// '2016-08-15T07:00:00',
									'due': due, 		// '2016-08-15T07:00:00',
									'workOnWeekends': wow
								}
							}
						}
					};
				var postTask = https.post({
					url: '/app/site/hosting/restlet.nl?script=1409&deploy=1',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(taskObj)
				}).then(function(response){
					console.log(response);
				}).catch(function onReject(reason){
					console.log(reason);
				});
			}
			
			function getWrikeID_user(){
				return 'KUAB7YUO';
			}

			function addTaskDependency(typeDep, PredData){
				var recordTskID = 0;
				var error = false;
				// Add record Predecessor
				try{
					var recordTskDT = record.create({ type: typeDep, isDynamic: false });
					for (var key in PredData) {
						if (PredData.hasOwnProperty(key)) {
							recordTskDT.setValue({
								fieldId: key,
								value: PredData[key],
								ignoreFieldChange: true
							});
						}
					}
					recordTskID = recordTskDT.save({ enableSourcing: false, ignoreMandatoryFields: false });
					RecordsCreated.push( [typeDep, recordTskID ] );
				} catch (e){
					error = true;
				}
				return error
			}
			
			function deleteRecordsCreated () {
				var deletelog = [];
				RecordsCreated.forEach(function(res){
					var typeRecord	= res[0];
					var idRecord	= res[1];
					deletelog.push( record.delete({ type: typeRecord ,  id: idRecord }) );
				});
				return deletelog;
			}

			function DateMMDDYYYY (datei){ var parseDate = format.parse ({ value : datei, type: format.Type.DATE }); return parseDate; }

			var objRecord = record.create({ type: record.Type.TASK, isDynamic: false });

			objF.startdate						= DateMMDDYYYY(objF.startdate);
			objF.duedate						= DateMMDDYYYY(objF.duedate);
			objF.custevent_kpi_startdate        = DateMMDDYYYY(objF.custevent_kpi_startdate);
			objF.custevent_kpi_duedate          = DateMMDDYYYY(objF.custevent_kpi_duedate);
			objF.custevent_kpi_planned_startdate= DateMMDDYYYY(objF.custevent_kpi_planned_startdate);
			objF.custevent_kpi_planned_duedate 	= DateMMDDYYYY(objF.custevent_kpi_planned_duedate);
			//log.debug('Segundahueva',objF);
			// //
			for (var key in objF) {
				if (objF.hasOwnProperty(key)) {
					objRecord.setValue({
						fieldId: key,
						value: objF[key],
						ignoreFieldChange: true
					});
				}
			}

			//---- Try add new task...
			try{
				recordTaskId = objRecord.save({
					enableSourcing: false,
					ignoreMandatoryFields: false
				});
				RecordsCreated.push( ['task', recordTaskId] );
				msg = 'New Task saved successfully.';
			} catch (e){
				msg = 'Error on save New Task ' + e;
				error = true;
				recordTaskId = 0;
			}
			
			if(!error){ // if not have error in new task, we can proccess the dependencys
				ResultsSave.push([ recordTaskId, msg ]);
				
				var relations = [];
				
				relations.push ( { type: 'customrecord_task_predecessor', record: { 
						'custrecord_tp_parent' 			: recordTaskId, // will be replace in SL_RT by NEW TASK ID
						'custrecord_tp_predecessor' 	: predeccesorTask,
						'custrecord_tp_dependency_type' : dependencyPress,
					}} ); // NewTask to Predesessor
				
				relations.push( { type: 'customrecord_task_successor', record: { 
						'custrecord_ts_parent'			: predeccesorTask,
						'custrecord_ts_successor'		: recordTaskId, // will be replace in SL_RT by NEW TASK ID
						'custrecord_ts_dependency_type'	: dependencyPress,
					}} ); // Predessesor to NewTask
				
				relations.push( { type: 'customrecord_task_successor', record: { 
						'custrecord_ts_parent' 			: recordTaskId, // will be replace in SL_RT by NEW TASK ID
						'custrecord_ts_successor' 		: successorTask,
						'custrecord_ts_dependency_type' : dependencySucc,
					}} ); // NewTask to Successor
				
				relations.push( { type: 'customrecord_task_predecessor', record: { 
						'custrecord_tp_parent'			: successorTask,
						'custrecord_tp_predecessor'		: recordTaskId, // will be replace in SL_RT by NEW TASK ID
						'custrecord_tp_dependency_type'	: dependencySucc,
					}} ); // Successor to NewTask
				
				// The logic here is, add each relation, at the end if flag error is st true then call errase all records created.
				relations.forEach(function (rel){
					error = error || addTaskDependency(rel.type, rel.record);
				});
				
				if(error){
					RecordsDeleted = deleteRecordsCreated();
				}
			}
			
			Params.response.write( JSON.stringify( {result:!error, newTaskId:recordTaskId, records: [ ResultsSave , RecordsCreated , RecordsDeleted ]} ));
			
		}
		
//---- SaveNewTask<
		

		
//---- createTaskOnly>
		module.actions['createTaskOnly'] = function (Params){
			var objF 			= JSON.parse( Params.request.parameters['task'] );
			var action_id 		= Params.request.parameters['action_id'];
			var ResultsSave 	= [];
			var RecordsCreated  = [];
			var RecordsDeleted  = [];
			var error  = false;
			var msg = '';
			var recordTaskId = 0;
			var WF_DEBUG = false;
			
			//Enable DEBUG only for this user---- Ariel
			WF_DEBUG = WF_DEBUG && (runtime.getCurrentUser().id == '79531'||  runtime.getCurrentUser().id == '75401');
			
			if(WF_DEBUG) {
				log.debug({title: "createTaskOnly Params", details: Params.request.parameters });
			}
			
			var objRecord = record.create({ type: record.Type.TASK, isDynamic: false });
			
			var ds = objF.startdate+0, dd = objF.duedate+0;

			objF.startdate							= new Date(ds);
			objF.duedate							= new Date(dd);
			objF['custevent_kpi_startdate']        	= new Date(ds);
			objF['custevent_kpi_duedate']          	= new Date(dd);
			objF['custevent_kpi_planned_startdate']	= new Date(ds);
			objF['custevent_kpi_planned_duedate'] 	= new Date(dd);
			objF['custevent_kpi_planned_duration']  = objF.custevent_kpi_duration;
			objF['custevent_kpi_workforce_task']  	= true;
			
			for (var key in objF) {
				if (objF.hasOwnProperty(key)) {
					objRecord.setValue({
						fieldId: key,
						value: objF[key],
						ignoreFieldChange: true
					});
				}
			}

			//---- Try add new task...
			try{
				recordTaskId = objRecord.save({
					enableSourcing: false,
					ignoreMandatoryFields: false
				});
				RecordsCreated.push( ['task', recordTaskId] );
				msg = 'New Task saved successfully.';
			} catch (e){
				msg = 'Error on save New Task ' + e;
				error = true;
				recordTaskId = 0;
			}
			
			Params.response.write( JSON.stringify( {result:!error, action_id: action_id, newTaskId:recordTaskId, msg: msg } ));
			
		}
		
//---- createTaskOnly<
		
		
//---- rollBackTaskOnly>
		module.actions['rollBackTaskOnly'] = function (Params){
			var objF = JSON.parse( Params.request.parameters['todeletetasks'] );
			var error  = false;
			var msg = '';
			var WF_DEBUG = true;
			
			//Enable DEBUG only for this user---- Ariel
			WF_DEBUG = WF_DEBUG && (runtime.getCurrentUser().id == '79531'||  runtime.getCurrentUser().id == '75401');
			
			if(WF_DEBUG) {
				log.debug({title: "rollBackTaskOnly Params", details: Params.request.parameters });
			}
			
			function deleteRecords (todelete) {
				var deletelog = [];
				todelete.forEach(function(res){
					var typeRecord	= 'task';
					var idRecord	= res.newTaskId;
					if (idRecord )
						deletelog.push( record.delete({ type: typeRecord ,  id: idRecord }) );
				});
				return deletelog;
			}
			
			var bita = deleteRecords( objF );
			
			Params.response.write( JSON.stringify( { result: true, bita: bita } ));
		}
//---- rollBackTaskOnly<
		
		
//---- createDependenciesTwoTasks>
		module.actions['createDependenciesTwoTasks'] = function (Params){
			var taskA = Params.request.parameters['taskA'];
			var taskB = Params.request.parameters['taskB'];
			var dependency = Params.request.parameters['dependency'];
			var direction = Params.request.parameters['direction'];
			var RecordsCreated  = [];
			var RecordsDeleted  = [];
			var error  = false;
			var msg = '';
			var recordTaskId = 0;
			
			function addTaskDependency(typeDep, PredData){
				var recordTskID = 0;
				var error = false;
				try{
					var recordTskDT = record.create({ type: typeDep, isDynamic: false });
					for (var key in PredData) {
						if (PredData.hasOwnProperty(key)) {
							recordTskDT.setValue({
								fieldId: key,
								value: PredData[key],
								ignoreFieldChange: true
							});
						}
					}
					recordTskID = recordTskDT.save({ enableSourcing: false, ignoreMandatoryFields: false });
					RecordsCreated.push( [typeDep, recordTskID ] );
				} catch (e){
					error = true;
				}
				return error
			}
			
			function deleteRecordsCreated () {
				var deletelog = [];
				RecordsCreated.forEach(function(res){
					var typeRecord	= res[0];
					var idRecord	= res[1];
					deletelog.push( record.delete({ type: typeRecord ,  id: idRecord }) );
				});
				return deletelog;
			}
			
			var relations = [];
			
			if (direction.toLowerCase() == 'predecessor') {
				
				relations.push ( { type: 'customrecord_task_predecessor', record: { 
						'custrecord_tp_parent' 			: taskB, // will be replace in SL_RT by NEW TASK ID
						'custrecord_tp_predecessor' 	: taskA,
						'custrecord_tp_dependency_type' : dependency,
					}} ); // NewTask to Predesessor
				
				relations.push( { type: 'customrecord_task_successor', record: { 
						'custrecord_ts_parent'			: taskA,
						'custrecord_ts_successor'		: taskB, // will be replace in SL_RT by NEW TASK ID
						'custrecord_ts_dependency_type'	: dependency,
					}} ); // Predessesor to NewTask
				
			} else if (direction.toLowerCase() == 'successor') {
			
				relations.push( { type: 'customrecord_task_successor', record: { 
						'custrecord_ts_parent' 			: taskA, // will be replace in SL_RT by NEW TASK ID
						'custrecord_ts_successor' 		: taskB,
						'custrecord_ts_dependency_type' : dependency,
					}} ); // NewTask to Successor
				
				relations.push( { type: 'customrecord_task_predecessor', record: { 
						'custrecord_tp_parent'			: taskB,
						'custrecord_tp_predecessor'		: taskA, // will be replace in SL_RT by NEW TASK ID
						'custrecord_tp_dependency_type'	: dependency,
					}} ); // Successor to NewTask
				
			}
			
			// The logic here is, add each relation, at the end if flag error is st true then call errase all records created.
			relations.forEach(function (rel){
				error = error || addTaskDependency(rel.type, rel.record);
			});
			
			if(error){
				RecordsDeleted = deleteRecordsCreated();
			}
			
			Params.response.write( JSON.stringify( {result:!error, records:RecordsCreated , deleted:RecordsDeleted } ));
			
		}
		
//---- createDependenciesTwoTasks<
		
//---- createDependenciesAllProcess>
		module.actions['createDependenciesAllProcess'] = function (Params){
			var processRelations = JSON.parse( Params.request.parameters['processRelations'] );
			/* 
			var taskA = Params.request.parameters['taskA'];
			var taskB = Params.request.parameters['taskB'];
			var dependency = Params.request.parameters['dependency'];
			var direction = Params.request.parameters['direction'];
			*/
			var RecordsCreated  = [];
			var RecordsDeleted  = [];
			var RecordsErrors  = [];
			var error  = false;
			var msg = '';
			
			function addTaskDependency(typeDep, PredData, bName){
				var recordTskID = 0;
				var error = false;
				try{
					var recordTskDT = record.create({ type: typeDep, isDynamic: false });
					for (var key in PredData) {
						if (PredData.hasOwnProperty(key)) {
							recordTskDT.setValue({
								fieldId: key,
								value: PredData[key],
								ignoreFieldChange: true
							});
						}
					}
					recordTskID = recordTskDT.save({ enableSourcing: false, ignoreMandatoryFields: false });
					RecordsCreated.push( { type: typeDep, id: recordTskID, branchName: bName } );
				} catch (e){
					error = true;
					RecordsErrors.push( { type: typeDep, data: PredData, branchName: bName, err: e } );
				}
				return error
			}
			
			function deleteRecordsCreated () {
				var deletelog = [];
				for(var recDel in RecordsCreated) {
					deletelog.push( record.delete( recDel ) );
				}
				return deletelog;
			}
			
			var relations = [];
			
			processRelations.forEach( function (dependencyRecord){
			
				if (dependencyRecord.direction.toLowerCase() == 'predecessor') {
					
					relations.push ( { type: 'customrecord_task_predecessor', record: { 
							'custrecord_tp_parent' 			: dependencyRecord.taskB, // will be replace in SL_RT by NEW TASK ID
							'custrecord_tp_predecessor' 	: dependencyRecord.taskA,
							'custrecord_tp_dependency_type' : dependencyRecord.dependency,
						}, branchName:dependencyRecord.branchName } ); // NewTask to Predesessor
					
					relations.push( { type: 'customrecord_task_successor', record: { 
							'custrecord_ts_parent'			: dependencyRecord.taskA,
							'custrecord_ts_successor'		: dependencyRecord.taskB, // will be replace in SL_RT by NEW TASK ID
							'custrecord_ts_dependency_type'	: dependencyRecord.dependency,
						}, branchName:dependencyRecord.branchName } ); // Predessesor to NewTask
					
				} else if (dependencyRecord.direction.toLowerCase() == 'successor') {
				
					relations.push( { type: 'customrecord_task_successor', record: { 
							'custrecord_ts_parent' 			: dependencyRecord.taskA, // will be replace in SL_RT by NEW TASK ID
							'custrecord_ts_successor' 		: dependencyRecord.taskB,
							'custrecord_ts_dependency_type' : dependencyRecord.dependency,
						}, branchName:dependencyRecord.branchName } ); // NewTask to Successor
					
					relations.push( { type: 'customrecord_task_predecessor', record: { 
							'custrecord_tp_parent'			: dependencyRecord.taskB,
							'custrecord_tp_predecessor'		: dependencyRecord.taskA, // will be replace in SL_RT by NEW TASK ID
							'custrecord_tp_dependency_type'	: dependencyRecord.dependency,
						}, branchName:dependencyRecord.branchName } ); // Successor to NewTask
					
				}
				
			});
			
			// The logic here is, add each relation, at the end if flag error is st true then call errase all records created.
			relations.forEach(function (rel){
				error = error || addTaskDependency(rel.type, rel.record, rel.branchName);
			});
			
			if (error) {
				RecordsDeleted = deleteRecordsCreated();
			}
			
			Params.response.write( JSON.stringify( {result:!error, records:RecordsCreated, deleted:RecordsDeleted, errorRec:RecordsErrors } ));
			
		}
		
//---- createDependenciesAllProcess<		
		

//---geNametask>
		module.actions['getNameTask'] = function (Params){

			var So = Params.request.parameters['idSO'];
			var so_data = {};
			var columnsA = ['tranid','internalid','entity',
				'custbody_project_manager','custbody_tt_ordertype',
				'salesrep','custbody_prov_engineer',
				'custbody_so_pri_contact','custbody_so_tech_contact',
				'custbody_so_bill_contact', 'opportunity',
			];
			var mysearch = search.create({
				type : 'transaction',
				filters : ['internalid','is',So],
				columns : columnsA
			});

			mysearch.run().each(function(res){
				columnsA.forEach(function(cn){ 
					so_data[cn.name] = res.getValue( cn );
					so_data[cn.name +'_txt'] = res.getText( cn );
				})
			});
			
			//Params.response.write(JSON.stringify( [res.getValue('tranid'),res.getValue('entity')] ));
			Params.response.write(JSON.stringify( so_data ));
		}
		
//---getListEmployees>
		module.actions['getListEmployees'] = function (Params){
			var SortName = search.createColumn({name: 'entityid', sort: 'ASC'});
			var employees = [];
			var mySearch = search.create({
						type: 'employee',
						columns: [
									'internalId', 'firstname', 'lastname',
									'title', 'isinactive','custentity_wrike_contact_id',
									SortName
								],
						filters:[
							['isinactive','is', false]
						]
				});
			var counter = 0;
			mySearch.run().each(function(result) {
				counter++;
				var employeeId     = result.getValue('internalId');
				var employeeName   = result.getValue('firstname');
				var employeeLast   = result.getValue('lastname');
				var employeeFull   = result.getValue('entityid');
				var wrikeID   = result.getValue('custentity_wrike_contact_id');

				if(wrikeID){
					if(employeeFull){
						employeeFull = String(employeeFull).split(" ");
						var employeeCompleteName = employeeFull[0] + " " +employeeFull[1] +" "+(employeeFull[2]==undefined? "" : employeeFull[2]) ;
						employees.push({
							"id"    : employeeId,
							"name"  : employeeCompleteName
						});
					}
				}
				return true;
			});
			Params.response.write(JSON.stringify(employees));
		}
		
//---getTaskinformation>
		module.actions['getTaskInformacion'] = function (Params){
			var TaskInformacion = [];
			var idTask = Params.request.parameters['idTask'];
			var mysearch = search.create({
					type : 'customrecord_kpi_task_types',
					filters : ['internalid','is',idTask],
					columns : [
								'name','internalid','custrecord_kpit_duration',
								'custrecord_kpit_assigned','custrecord_kpit_work_on_weekend'
							]
				});

			mysearch.run().each(function(res){
				TaskInformacion.push({
					"name" : res.getValue('name'),
					"id" : res.getValue('internalid'),
					"duration" : res.getValue('custrecord_kpit_duration'),
					"assigned" : res.getValue('custrecord_kpit_assigned'),
					"WorkOnWeekend" : res.getValue('custrecord_kpit_work_on_weekend')
				});
				return true;
			});

			Params.response.write(JSON.stringify(TaskInformacion));
		}
		
		
		
//---getKpiTaskType>
		module.actions['getKpiTaskType'] = function (Params){
			var idProcess = Params.request.parameters['idProcess'];
			var idSubProcess = Params.request.parameters['idSubProcess'];
			var myfilters =[];
			
			if(idProcess == '-')  idProcess = "@NONE@";
			
			myfilters.push(search.createFilter({
				name: 'custrecord_kpit_process',
				operator: search.Operator.IS,
				values: idProcess
			}));
			

			if(idSubProcess == '-') idSubProcess="@NONE@";
			
			myfilters.push(search.createFilter({
				name: 'custrecord_kpit_subprocess',
				operator: search.Operator.IS,
				values: idSubProcess
			}));

			var AllTaskType = [];
			var mysearch = search.create({
				type : 'customrecord_kpi_task_types',
				filters : myfilters,
				columns : ['name','internalid','custrecord_kpit_process','custrecord_kpit_subprocess']
			});

			mysearch.run().each(function(res){
				AllTaskType.push({
					'id'    : res.getValue('internalid'),
					'name'  : res.getValue('name'),
					'Process'  : res.getValue('custrecord_kpit_process'),
					'subProcess'  : res.getValue('custrecord_kpit_subprocess')
				});
				return true;
			});

			Params.response.write(JSON.stringify(AllTaskType));
		}
//--- getKpiTaskType<		
		
		
		
//---getProcess>
		module.actions['getProcess'] = function (Params){
			var idType = Params.request.parameters['idType'];
			var Process = [idType,3];
			var TaskProces = [];
			var mysearch = search.create({
				type : 'customrecord_kpi_process',
				filters : ['custrecord_kpip_apply_to','is',Process],
				columns : ['name','internalid','custrecord_kpip_apply_to']
			});

			mysearch.run().each(function(res){
				TaskProces.push({
					'id'    : res.getValue('internalid'),
					'name'  : res.getValue('name'),
					'type'  : res.getValue('custrecord_kpip_apply_to')
				});
				return true;
			});

			Params.response.write(JSON.stringify(TaskProces));
		}
//--- getProcess<
		
		
//---getSubProcess>
		module.actions['getSubProcess'] = function (Params){
			var IdProcess = Params.request.parameters['IdProcess'];
			var SubProcess = [];
			var mysearch = search.create({
				type : 'customrecord_kpi_subprocess',
				filters : ['custrecord_kpisp_process','is',IdProcess],
				columns : ['name','internalid']
			});

			mysearch.run().each(function(res){
				SubProcess.push({
					'id'    : res.getValue('internalid'),
					'name'  : res.getValue('name')
				});
				return true;
			});

			Params.response.write(JSON.stringify(SubProcess));
		}
//--- getSubProcess<
		
		
//---getProcessStructure>
		module.actions['getProcessStructure'] = function (Params){
			var taskProcess = [];
			var taskSubProcess = [];
			var taskTypes = [];
			var taskTypesDepend = [];
			var taskKpiAssigned = [];
			var taskKpiAssignedCity = [];
			var taskKpiAssignedCountry = [];
			
			var searchProcess = search.create({
				type : 'customrecord_kpi_process',
				filters : [],
				columns : ['name','internalid','custrecord_kpip_apply_to',
					'custrecord_kpip_level','custrecord_kpip_show',
					'custrecord_kpip_show_table']
			});

			searchProcess.run().each(function(res){
				taskProcess.push({
					'id'    	: res.getValue('internalid'),
					'name'  	: res.getValue('name'),
					'type'  	: res.getValue('custrecord_kpip_apply_to'),
					'type_txt'	: res.getText ('custrecord_kpip_apply_to'),
					'level' 	: res.getValue('custrecord_kpip_level'),
					'show' 		: res.getValue('custrecord_kpip_show'),
					'show_table': res.getValue('custrecord_kpip_show_table'),
				});
				return true;
			});
			
			var searchSubProcess = search.create({
				type : 'customrecord_kpi_subprocess',
				filters : [],
				columns : ['internalid','custrecord_kpisp_process', search.createColumn({name:'name', sort:'ASC' })]
			});

			searchSubProcess.run().each(function(res){
				taskSubProcess.push({
					'id'    		: res.getValue('internalid'),
					'name'  		: res.getValue('name'),
					'process' 		: res.getValue('custrecord_kpisp_process'),
					'process_txt' 	: res.getText ('custrecord_kpisp_process'),
				});
				return true;
			});
			
			var searchTaskType = search.create({
				type : 'customrecord_kpi_task_types',
				filters : [],
				columns : ['name','internalid','custrecord_kpit_process','custrecord_kpit_subprocess',
					'custrecord_kpit_department', 'custrecord_kpit_duration', 'custrecord_kpit_level',
					'custrecord_kpit_assigned','custrecord_kpit_override_assigned','custrecord_kpit_work_on_weekend']
			});

			searchTaskType.run().each(function(res){
				taskTypes.push({
					'id'    	 : res.getValue('internalid'),
					'name'  	 : res.getValue('name'),
					'Process'  	 : res.getValue('custrecord_kpit_process'),
					'subProcess' : res.getValue('custrecord_kpit_subprocess'),
					'department' : res.getValue('custrecord_kpit_department'),
					'duration' 	 : res.getValue('custrecord_kpit_duration'),
					'level' 	 : res.getValue('custrecord_kpit_level'),
					'assigned'	 : res.getValue('custrecord_kpit_assigned'),
					'overide'	 : res.getValue('custrecord_kpit_override_assigned'),
					'wow'		 : res.getValue('custrecord_kpit_work_on_weekend'),
				});
				return true;
			});
			
			var searchTaskDepend = search.create({
				type : 'customrecord_kpi_task_depends_on',
				filters : [],
				columns : ['internalid','custrecord_kpitd_task','custrecord_kpitd_process',
					'custrecord_kpitd_dependency', 'custrecord_kpitd_dependency_type']
			});

			searchTaskDepend.run().each(function(res){
				taskTypesDepend.push({
					'id'    	 			: res.getValue('internalid'),
					'taskid'	 			: res.getValue('custrecord_kpitd_task'),
					'Process'  	 			: res.getValue('custrecord_kpitd_process'),
					'dependency' 			: res.getValue('custrecord_kpitd_dependency'),
					'dependency_type' 		: res.getValue('custrecord_kpitd_dependency_type'),
					'dependency_type_txt'	: res.getText ('custrecord_kpitd_dependency_type'),
				});
				return true;
			});
			
			var searchKpiAssigned = search.create({
				type : 'customrecord_kpi_assigned',
				filters : [],
				columns : ['internalid','custrecord_kpi_au_deparment','custrecord_kpi_au_default']
			});

			searchKpiAssigned.run().each(function(res){
				taskKpiAssigned.push({
					'id'    	 : res.getValue('internalid'),
					'department' : res.getValue('custrecord_kpi_au_deparment'),
				'department_txt' : res.getText ('custrecord_kpi_au_deparment'),
					'user'		 : res.getValue('custrecord_kpi_au_default'),
					'user_txt' 	 : res.getText ('custrecord_kpi_au_default'),
				});
				return true;
			});
			
			var city_kpi_ua_depart = search.createColumn({ name:'custrecord_kpi_au_deparment', join:'custrecord_kpi_auc_assigned'});
			var searchKpiAssignedCity = search.create({
				type : 'customrecord_kpi_assigned_city',
				filters : [],
				columns : ['internalid','custrecord_kpi_auc_assigned','custrecord_kpi_auc_user',
					'custrecord_kpi_auc_country', 'custrecord_kpi_auc_state', 'custrecord_kpi_auc_city',
					'custrecord_kpi_auc_municipality', city_kpi_ua_depart
					]
			});

			searchKpiAssignedCity.run().each(function(res){
				taskKpiAssignedCity.push({
					'id'    	 	: res.getValue('internalid'),
					'kpiassigned'	: res.getValue('custrecord_kpi_auc_assigned'),
					'department'	: res.getValue( city_kpi_ua_depart ),
					'department_txt': res.getText ( city_kpi_ua_depart ),
					'user'			: res.getValue('custrecord_kpi_auc_user'),
					'user_txt'		: res.getText ('custrecord_kpi_auc_user'),
					'country'		: res.getValue('custrecord_kpi_auc_country'),
					'state'	 		: res.getValue('custrecord_kpi_auc_state'),
					'city'	 		: res.getValue('custrecord_kpi_auc_city'),
					'municipality'	: res.getValue('custrecord_kpi_auc_municipality'),
				});
				return true;
			});
			
			var country_kpi_ua_depart = search.createColumn({ name:'custrecord_kpi_au_deparment', join:'custrecord_kpi_acc_assigned'});
			var searchKpiAssignedCountry = search.create({
				type : 'customrecord_kpi_assigned_country',
				filters : [],
				columns : ['internalid','custrecord_kpi_acc_assigned','custrecord_kpi_acc_user',
					'custrecord_kpi_acc_country', country_kpi_ua_depart]
			});

			searchKpiAssignedCountry.run().each(function(res){
				taskKpiAssignedCountry.push({
					'id'    	 	: res.getValue('internalid'),
					'kpiassigned'	: res.getValue('custrecord_kpi_acc_assigned'),
					'department'	: res.getValue( country_kpi_ua_depart ),
					'department_txt': res.getText ( country_kpi_ua_depart ),
					'user'			: res.getValue('custrecord_kpi_acc_user'),
					'user_txt'		: res.getText ('custrecord_kpi_acc_user'),
					'country'		: res.getValue('custrecord_kpi_acc_country'),
					'country_txt'	: res.getText ('custrecord_kpi_acc_country'),
				});
				return true;
			});
			
			Params.response.write( 
					JSON.stringify( {
						'taskProcess': taskProcess,
						'taskSubProcess': taskSubProcess, 
						'taskTypes': taskTypes, 
						'taskTypesDepend': taskTypesDepend, 
						'taskKpiAssigned': taskKpiAssigned,
						'taskKpiAssignedCity': taskKpiAssignedCity,
						'taskKpiAssignedCountry': taskKpiAssignedCountry,
						})
			);
		}
//--- getProcessStructure<
		
		
		
		
		// module to get items from Sales Order, When Item is different to ItemExclude Array
		// for Example : 646 install free
//---getItemsfromSO>
		module.actions['getItemsfromSO'] = function (Params){
			var SalesOrder = Params.request.parameters['SalesOrderId'];

			// var ItemExclude = [6,646,153,537,553,560,6604,9433,-8];
			 var ItemExclude = [6,646,153,537,553,560,6604,9433,-8,"@NONE@"];
			var mysearch = search.create({
					type : 'transaction',
					filters : [
							['internalid','is',SalesOrder]
							,'and',
							['item','noneof', ItemExclude]
							,'and',
							['mainline','is','F']
							,'and',
							['item.type','is','Service']
						],
					columns : [
								'item','name','custcol_location_a_c',
								'custcol_location_z_c','custcol_address_a_c','custcol_address_z_c',
								'linesequencenumber','custcol_ov_suscripcion',
								'custcol_ov_capacidad', 'custcol_ov_unidadmedida'
							]
				});
			var items = [];
			mysearch.run().each(function(res){
			//  if(res.getValue('item')){
					items.push({
						'id'		: res.getValue('item'),
						'name'		: res.getText('item'),
						'idlocA'	: res.getValue('custcol_location_a_c'),
						'locA'		: res.getText('custcol_location_a_c'),
						'idlocZ'	: res.getValue('custcol_location_z_c'),
						'locZ'		: res.getText('custcol_location_z_c'),
						'AddressA'	: res.getValue('custcol_address_a_c'),
						'AddressZ'	: res.getValue('custcol_address_z_c'),
						'line'		: res.getValue('linesequencenumber'),
				'subscriptionId'	: res.getValue('custcol_ov_suscripcion'),
				'subscriptionName'	: res.getText('custcol_ov_suscripcion'),
						'capacity'	: res.getValue('custcol_ov_capacidad'),
						'UoM'		: res.getText('custcol_ov_unidadmedida'),
					});
			//  }
				return true;
			});

			Params.response.write(JSON.stringify(items));
		}
//---- getItemsfromSO<

		
		
		
		
//---- getTaskCompletedDurationOne>
		module.actions['getTaskCompletedDurationOne'] = function(Params){
			var IdstatusPrev = Params.request.parameters["statusId"];
			var overrideUser = Params.request.parameters["auditId"];
			var dayQuestIn = Params.request.parameters["day"];
			var dayWay = Params.request.parameters["dayWay"];
			var ahora = {y:2017, m:2, d:1 };  // 01 March 
            var until = {y:2017, m:3, d:26 }; // 26 April
            var filterDuration = 1;
			
			IdstatusPrev = '2'; // Completed
			dayQuestIn = '1';
			dayWay = 'period';
			
			var arrSearch,
				arrSearchFilters=[],
				ancount =0;
			var results =[];
			var allSOinvolved = [], allSAinvolved = [];
			var allSOnames = {};
			var dayQuest, dayQuestS;
			var NetSuite_Records = 0;
			var flag = true;
			var WF_DEBUG = false;
			
			WF_DEBUG = WF_DEBUG && (runtime.getCurrentUser().id == '79531'||  runtime.getCurrentUser().id == '75401');
			
			var newResults = {
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
					'cities' : {},
					'states' : {},
					'municipalities' : {},
				}
			
			if(WF_DEBUG)
				log.debug({title: "getTaskCompletedDurationOne Params", details: Params.request.parameters });
			//log.debug({title: "getAllMyWorkToday Params", details: ahora });
			
			//overrideUser = JSON.parse(overrideUser);
			
			function DateToS(date) {
				var d = new Date(date),
					month = '' + (d.getMonth() + 1),
					day = '' + d.getDate(),
					year = d.getFullYear();

				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;

				return [year,month,day].join('-');
			}
			
			function DateToFilter(date) {
				var d = new Date(date),
					month = '' + (d.getMonth() ),
					day = '' + d.getDate(),
					year = d.getFullYear();

				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;
				
				var nd = new Date(year, month, day);
				
				return format.format( {
				    value: nd,
				    type: format.Type.DATE		//-- DATE, CCEXPDATE, DATETIME, DATETIMETZ, MMYYDATE, TIME, TIMEOFDAY, TIMETRACK
				    });
			}
			
			function DateToFilterNew(wd) {
				var nd = new Date(wd.y, wd.m, wd.d);
				
				if(WF_DEBUG)
					log.debug({title: "getTaskCompletedDurationOne DateToFilterNew", details: { DateToFilterNew: nd } });
				
				return format.format( {
					    value: nd,
					    type: format.Type.DATE
				    });
			}
			
			var due = search.createColumn({name: 'duedate',	sort: search.Sort.ASC});
			var department	= search.createColumn({ name:'custrecord_kpit_department'	,join:'custevent_kpi_task_type'});	// column 6
	       	var process 	= search.createColumn({ name:'custrecord_kpit_process'		,join:'custevent_kpi_task_type'});	// column 7
	       	var subprocess	= search.createColumn({ name:'custrecord_kpit_subprocess'	,join:'custevent_kpi_task_type'});	// column 8
	       	
			arrSearchFilters.push(
					search.createFilter({
						name: 'custevent_kpi_workforce_task',
						operator: search.Operator.IS,
						values: "T"
					})
				);
			
			arrSearchFilters.push(
					search.createFilter({
						name: 'custevent_kpi_duration',
						operator: search.Operator.EQUALTO, // GREATERTHANOREQUALTO,
						values: filterDuration
					})
				);
			

			if(!IdstatusPrev){
				
				IdstatusPrev = '1';
				
			}else{
				var istatus = [];
				var ackArray = [];
				IdstatusPrev = IdstatusPrev.split(',');

				IdstatusPrev.forEach(function(it){
					if(it < 1001 )
						istatus.push(it);
					else{
						if(it == 1001)
							ackArray.push("T");
						else
							ackArray.push("F");
					}
				});

				if(istatus.length)
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_task_status',
					operator: search.Operator.IS,
					values: istatus
				}));

				if(ackArray && ackArray.length == 1)
				arrSearchFilters.push(search.createFilter({
					name: 'custevent_kpi_ack',
					operator: search.Operator.IS,
					values: ackArray
				}));
			}
			
			if (dayQuestIn) {
				
				//dayQuest = format.format( new Date(  ),  format.Type.DATE );
				dayQuest = DateToFilterNew(ahora);
				var dayQuest2 = DateToFilterNew(until);
					
				dayQuestS = DateToS( dayQuestIn );
				
				if(WF_DEBUG)
	                  log.debug({title: "getTaskCompletedDurationOne dayQuest", 
	                	  details: {
	                		  'dayQuestIn'	: dayQuestIn, 
	                		  'dayQuest'	: dayQuest, 
	                		  'dayQuestS'	: dayQuestS, 
	                		  'newDate'		: new Date( dayQuestIn ),
	                		  }
	                  });

				 switch (dayWay) {
					case 'past':		// include = (DueDate < dayQuest);
						var duedate_loe = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORBEFORE,
							values: dayQuest,
						});
						arrSearchFilters.push( duedate_loe );
						break;
					case 'today':		// include = ( (StartDate <= dayQuest) && (DueDate >= dayQuest));
						var startdate_moe = search.createFilter({
							name: 'startdate',
							operator: search.Operator.ONORBEFORE,
							values: dayQuest,
						});
						var duedate_loe = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORAFTER,
							values: dayQuest,
						});
						arrSearchFilters.push( startdate_moe );
						arrSearchFilters.push( duedate_loe );
						break;
					case 'will':		// include = (DueDate > dayQuest);
						var duedate_loe = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORAFTER,
							values: dayQuest,
						});
						arrSearchFilters.push( duedate_loe );
						break;
					
					case 'period':		// include = (DueDate > dayQuest);
						var duedate_from = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORAFTER,
							values: dayQuest,
						});
						var duedate_until = search.createFilter({
							name: 'enddate',
							operator: search.Operator.ONORBEFORE,
							values: dayQuest2,
						});
						arrSearchFilters.push( duedate_from );
						arrSearchFilters.push( duedate_until );
						break;
				}
				
			}
			
			/**
			 * Push if not exist on results...
			 * tasks..... this is the main
			 * departments
			 * salesorders
			 * items
			 * servicesaddresses serviceaddresses
			 * assigned
			 * process
			 * subprocess
			 * customers
			 */
			function Results_pusher(list_name, id, values){
				if (! newResults[list_name][id] ) {
					newResults[list_name][id] = values
				}
			}

			if(WF_DEBUG)
				log.debug({title: "getTaskCompletedDurationOne filters", details: arrSearchFilters });

			arrSearch = search.create({
				type: 'task',
				filters: arrSearchFilters ,
				columns: [
							'internalid','company','custevent_kpi_sales_order',
							'custevent_kpi_wrike_id','custevent_kpi_wrike_permalink','custevent_kpi_ack',
							'custevent_kpi_task_status','custevent_kpi_current_dependency','title',
							'assigned','custevent_kpi_work_on_weekend','startdate',
							due,'custevent_kpi_duration','custevent_kpi_ack',
							'custevent_kpi_item','custevent_kpi_item_line','custevent_kpi_service_address',
							'custevent_kpi_task_status','custevent_kpi_planned_startdate','custevent_kpi_task_status',
							'custevent_kpi_planned_duedate', 'custevent_kpi_current_predecessor',
							'custevent_kpi_planned_duration','status',
							'custevent_kpi_task_type', department, process, subprocess
						]
				});
			
			arrSearch.run().each(function(result){
				NetSuite_Records++;
				
				var include = true;
				var ttype = result.getValue({name: 'custevent_kpi_task_type'});
				
				include = include && (ttype > 1);
				
				if (include) {
					// Determines if it will show a checkbox true or false symbol
					var title = result.getValue({name: 'title'});
					var xtask = {
						'id'			: result.getValue({name: 'internalid'}),
						'Title'			: title.substring(title.indexOf(" - ") + 3),
						'sort_due'		: ancount,
						'SalesOrder'	: result.getValue({name: 'custevent_kpi_sales_order'}),
						'company'		: result.getValue({name: 'company'}),
						'KpiItem'		: result.getValue({name: 'custevent_kpi_item'}),
						'KpiLine'		: result.getValue({name: 'custevent_kpi_item_line'}),
						'KpiAddress'	: result.getValue({name: 'custevent_kpi_service_address'}),
						'Assigned'		: result.getValue({name: 'assigned'}),
						'StartDate'		: result.getValue({name: 'startdate'}),
						'DueDate'		: result.getValue({name: 'duedate'}),
						'WorkWeekend'	: result.getValue({name: 'custevent_kpi_work_on_weekend'}),
						'Duration'		: result.getValue({name: 'custevent_kpi_duration'}),
						'Dependency'	: result.getValue({name: 'custevent_kpi_current_dependency'}),
						'Status'		: result.getValue({name: 'custevent_kpi_task_status'}),
						'Ack'			: result.getValue({name: 'custevent_kpi_ack'}),
						'Predecessor'	: result.getValue({name: 'custevent_kpi_current_predecessor'}),
						'WrikeLink' 	: result.getValue({name: 'custevent_kpi_wrike_permalink'}),
						'WrikeID' 		: result.getValue({name: 'custevent_kpi_wrike_id'}),
						'type'			: result.getValue({name: 'custevent_kpi_task_type'}),
						'department'	: result.getValue(department),
						'process'		: result.getValue(process),
						'subprocess'	: result.getValue(subprocess),
						'start_p'		: result.getValue({name: 'custevent_kpi_planned_startdate'}),
						'due_p'			: result.getValue({name: 'custevent_kpi_planned_duedate'}),
						'duration_p'	: result.getValue({name: 'custevent_kpi_planned_duration'}),
						'deviation'		: 0,
						'NetSuiteStatus': result.getValue({name: 'status'}),
					};
					
					xtask.deviation = xtask.duration_p - xtask.Duration;
					
					//results.push( xtask );
					Results_pusher('tasks', ancount, xtask );
					Results_pusher('customers', xtask.company, result.getText ('company') );
					Results_pusher('salesorders', xtask.SalesOrder, result.getText ('custevent_kpi_sales_order').substring(13) );
					Results_pusher('items', xtask.KpiItem, result.getText ('custevent_kpi_item') );
					Results_pusher('servicesaddresses', xtask.KpiAddress, result.getText ('custevent_kpi_service_address') );
					Results_pusher('assigned', xtask.Assigned, result.getText ('assigned') );
					Results_pusher('types', xtask.type, result.getText ({name: 'custevent_kpi_task_type'}) );
					Results_pusher('departments', xtask.department, result.getText (department) );
					Results_pusher('process', xtask.process, result.getText (process) );
					Results_pusher('subprocess', xtask.subprocess, result.getText (subprocess) );
					
					// carry out all soales orders
					var soID = xtask.SalesOrder;
					if (allSOinvolved.indexOf(soID) == -1) allSOinvolved.push(soID);
					var saID = xtask.KpiAddress;
					if (saID && allSAinvolved.indexOf(saID) == -1) allSAinvolved.push(saID);
					
					ancount++;
				}
				
				return (NetSuite_Records < 3900); // This refer to how many records have processed on this search, max 4000.
			 });

			//----- Get All SalesOrders name...
			function GetAllSalesOrdersName(){
				var searchNso = search.create({
					type : 'transaction',
					filters : [['mainline','is','T'],'and',['internalid','anyof',allSOinvolved]],
					columns : ['tranid','internalid','entity','memo','custbody_vtas_condcom']
				});

				searchNso.run().each(function(res){
					newResults['salesorders'][res.getValue('internalid')] = {
						'id': res.getValue('internalid'),
						'entI': res.getValue('entity'),
						'entN': res.getText('entity'),
						'label': res.getValue('tranid'),
						'memo': res.getValue('memo'),
						'memc': res.getValue('custbody_vtas_condcom'),
					};
					return true;
				});
			}
			//----- Get All Cities name...
			function getAllServiceAddressCities (){
				if(WF_DEBUG)
					log.debug({title: "getTaskCompletedDurationOne getAllServiceAddressCities", details: {'allSAinvolved': allSAinvolved} });

				 search.create({
				 	type: 'customrecord_service_address',
				 	filters: ['internalId','anyOf',allSAinvolved],
				 	columns : ['internalId','custrecord_city','custrecord_state','custrecord_sa_municipality']
				 }).run().each(function(sar){
				 	var xy = sar.getValue('internalId');
				 	if(xy !== null) {
				 		var nm = newResults['servicesaddresses'][xy];
				 		newResults['servicesaddresses'][xy]={
				 			'id'		: xy,
				 			'name'		: nm,
				 			'city'		: sar.getValue('custrecord_city'),
				 			'state'		: sar.getValue('custrecord_state'),
				 			'municipality' : sar.getValue('custrecord_sa_municipality'),
				 		};
				 		Results_pusher('cities', sar.getValue('custrecord_city'), sar.getText('custrecord_city') );
				 		Results_pusher('states', sar.getValue('custrecord_state'), sar.getText('custrecord_state') );
				 		Results_pusher('municipalities', sar.getValue('custrecord_sa_municipality'), sar.getText('custrecord_sa_municipality') );
				 	}
				 	return true;
				 });
			}
			//-----------------------------
			
			if (allSOinvolved.length) GetAllSalesOrdersName();
			if (allSAinvolved.length) getAllServiceAddressCities();

			if(WF_DEBUG)
				log.debug({title: "getTaskCompletedDurationOne results", details: {'Tasks':results.length, 'SOdata':allSOinvolved.length} });

			Params.response.write(JSON.stringify({'count':ancount, 'rrows':newResults }));
		};
//---- getTaskCompletedDurationOne<

		
		
		
		
//---default>
		module.actions['default'] = function(action){
			return 'There is not such action: ' + action;
		};


    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {

    	if (context.request.parameters['action'] && module.actions[context.request.parameters['action']]) {
    	    return module.actions[context.request.parameters['action']](context);
    	  } else {
    	    return module.actions['default']();
    	  }

    }

    return {
    	
        onRequest: onRequest
        
    };

});
//!-- Review: 2017-Feb-28 10:28PM --//
//!-- Review: 2017-Mar-01 04:33PM --//
//!-- Review: 2017-Mar-01 07:47PM --//
//!-- Review: 2017-Mar-02 00:03AM --//
//!-- Review: 2017-Mar-02 01:17PM --//
//!-- Review: 2017-Mar-02 02:20PM --//
//!-- Review: 2017-Mar-02 04:09PM --//
//!-- Review: 2017-Mar-02 05:47PM --//
//!-- Review: 2017-Mar-02 08:40PM --//
//!-- Review: 2017-Mar-03 02:30AM --//
//!-- Review: 2017-Mar-03 03:29AM --//
//!-- Review: 2017-Mar-03 12:03PM --//
//!-- Review: 2017-Mar-05 08:35AM --//
//!-- Review: 2017-Mar-05 06:42PM --//
//!-- Review: 2017-Mar-06 11:25AM --//
//!-- Review: 2017-Mar-09 07:06AM --//
//!-- Review: 2017-Mar-10 03:27PM --//
//!-- Review: 2017-Mar-12 01:48PM --//
//!-- Review: 2017-Mar-14 04:53AM --//
//!-- Review: 2017-Mar-17 07:02AM --//
//!-- Review: 2017-Mar-19 09:14PM --//
//!-- Review: 2017-Mar-20 00:03AM --//
//!-- Review: 2017-Mar-25 09:41PM --//
//!-- Review: 2017-Mar-31 08:46PM --//
//!-- Review: 2017-Apr-02 08:14AM --//
//!-- Review: 2017-Apr-05 02:13PM --//
//!-- Review: 2017-Apr-06 10:43AM --//
//!-- Review: 2017-Apr-07 07:52AM --//
//!-- Review: 2017-Apr-07 01:01PM --//
//!-- Review: 2017-Apr-07 01:49PM --//
//!-- Review: 2017-Apr-09 01:09PM --//
//!-- Review: 2017-Apr-10 04:59AM --//
//!-- Review: 2017-Apr-10 12:15PM --//
//!-- Review: 2017-Apr-11 02:31AM --//
//!-- Review: 2017-Apr-11 09:14PM --//
//!-- Review: 2017-Apr-16 07:31PM --//
//!-- Review: 2017-Apr-17 07:48PM --//
//!-- Review: 2017-Apr-19 07:07AM --//
//!-- Review: 2017-Apr-19 04:40PM --//
//!-- Review: 2017-Apr-20 11:33PM --//
//!-- Review: 2017-Apr-20 06:36PM --//
//!-- Review: 2017-Apr-21 12:26PM --//
//!-- Review: 2017-Apr-21 04:30PM --//
//!-- Review: 2017-Apr-23 06:99AM --//
//!-- Review: 2017-Apr-24 03:36PM  Add duration on branchs --//
//!-- Review: 2017-Apr-24 08:42PM  Add SalesOrderID on ...taskv2--//
//!-- Review: 2017-Apr-25 11:27AM  Add theSO on ...gettaskdata --//
//!-- Review: 2017-Apr-28 07:00AM  Add getpredecessorsmulti --//
//!-- Review: 2017-Apr-29 08:38PM  Add sendNotifications and Types Task, Chat, Log  --//
//!-- Review: 2017-Apr-30 07:36AM  Add verizon Data on SO  --//
//!-- Review: 2017-May-02 07:17PM  Add reassign users  --//
//!-- Review: 2017-May-04 01:35PM  Add notifications inout  --//
//!-- Review: 2017-May-04 05:07PM  Add theTeam to getAllMyWork  --//
//!-- Review: 2017-May-05 08:38AM  Add Limit date to outgoin notifications  --//
//!-- Review: 2017-May-09 07:26PM  Add NetWork Design function, fix date handle in GetAlMyWork  --//
//!-- Review: 2017-May-10 04:56PM  Remove Devops del Email  --//
//!-- Review: 2017-May-11 11:17AM  Add deviated to tasks in mywork  --//
//!-- Review: 2017-May-11 01:28PM  Fix in getTasksTablev2 and getAllMyWorkToday ehm assigned is not valid  --//
//!-- Review: 2017-May-12 06:40AM  Fix in searchItemLocation to return all location in the SO, add velocity --//
//!-- Review: 2017-May-21 11:10PM  Fix Reload SO after changes in ACK, Duration --//
//!-- Review: 2017-May-21 03:46PM  Fix email for workforce supress "compid" --//
//!-- Review: 2017-May-26 01:47PM  Add filter to SO tasks WOW better options now user WOW2 --//
//!-- Review: 2017-May-28 12:59AM  Add getTaskCurrentData() send successors to send emails in completed task --//
//!-- Review: 2017-May-28 08:24AM  Change email subject to "Predecessor completed,..." --//
//!-- Review: 2017-May-28 08:32AM  Add validation for Task Notes, limit to 3900 caracters add {{incomplete}} --//
//!-- Review: 2017-May-29 01:08PM  Add by process corrections --//