/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 * /app/site/hosting/restlet.nl?script=957&deploy=1
 */
define(['N/format', 'N/log', 'N/email', 'N/error', 'N/record', 'N/search', 'N/task', 'N/transaction','N/runtime'],
/**
 * @param {email} email
 * @param {error} error
 * @param {record} record
 * @param {search} search
 * @param {task} task
 * @param {transaction} transaction
 */
function TT_projectAdministration(format, log, email, error, record, search, task, transaction,runtime) {

	var module = {
		'actions': {}
	};

	// module to get the Department
	module.actions['getDepartmentOfProject'] = function (Params){
		 var mySearch,
	      myFilters=[],
	      myColumns=[],
	      departments=[];

	   // Sales Order
	   myFilters.push(search.createFilter({
	     name: 'custevent_kpi_sales_order',
	     operator: search.Operator.IS,
	     values: (Params['idSO']=="" || Params['idSO']==undefined) ? 293807 : (Params['idSO'])
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

	  return JSON.stringify(departments);

	}

	// Definition of modules begins here
	module.actions['getEmployeesOfProject'] = function(Params){
		// getEmployeesOfProject: Gets the list of employees  related or involved in the selected Sales Order
		var ResultsRows = [];
		var assignees, filters = [],
		columns = [];

		filters.push(search.createFilter({
			name: 'custevent_kpi_workforce_task',
			operator: search.Operator.IS,
			values: "T"
		}));

		filters.push(search.createFilter({
			name: 'custevent_kpi_sales_order',
			operator: search.Operator.ANYOF,
			values: (Params['idSO']=="" || Params['idSO']==undefined) ? 329071 : (Params['idSO'])
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

	return JSON.stringify(ResultsRows);
	}

	module.actions['getServiceAddresses'] = function(params){
		// getServiceAddresses: Gets the Service Addresses related or involved in the selected Sales Order
		// The data that is retrieve from this function is shwon at the table myUpdatedServicesAddresses
		var sales_order,
			addresses=[],
			service_addresses=[],
			address_a,
			address_z,
			i,
			x;

		var saleord_miletype = 'Not returned';
		var mySearch = search.create({
			type: 'customrecord_location_cost',
			columns: ['custrecord_location_cost_so', 'custrecord_last_mile_type'],
			filters:[
			  ['custrecord_location_cost_so', search.Operator.ANYOF, '329071'],
			 // 'and', ['custrecord_location_cost_address', search.Operator.ANYOF, 'Star McAllen'],
			  'and', ['custrecord_location_cost_assigned', search.Operator.IS, true]
			]
		}).run().each(function(result) {
			saleord_id       = result.getValue('custrecord_location_cost_so'),
			saleord_miletype = result.getText('custrecord_last_mile_type');
		});

		sales_order = record.load({
			type: 'salesorder',
			id: params['SO']
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
				lmt: saleord_miletype
				//'type':
				   //'newbuild':
				   //'lastmiletype':
			});
		});

		return JSON.stringify(service_addresses);

	};

	module.actions['getAllServices'] = function(Params){
		var ResultsRows = [];
		var filters = [];

		filters.push(search.createFilter({
			name:'internalid',
			operator: search.Operator.IS,
			values: Params['SO']
			//values: a
		}));

		filters.push(search.createFilter({
			name:'type',
			join: 'item',
			operator: search.Operator.IS,
			values: 'Service'
		}));

		items = search.create({
		type: 'transaction',
		filters: filters,
		columns: ['line','item','custcol_ov_capacidad', 'custcol_location_a_c','custcol_location_z_c','custcol_address_z_c','custcol_address_a_c']
		});

		items.run().each(function(result){

			ResultsRows.push({
				"line": result.getValue('line'),
				"itemid":result.getValue('item'),
				"itemName":result.getText('item'),
				"capacity": result.getValue('custcol_ov_capacidad'),
				//"UoM" : result.getText('custcol_ov_unidadmedida'),
				"UoM" : "Hola",
				"LocationA" : result.getText('custcol_location_a_c'),
				"LocationZ" : result.getText('custcol_location_z_c'),
				"AddressA" : result.getValue('custcol_address_a_c'),
				"AddressZ" : result.getValue('custcol_address_z_c')
			});

		return true;
		});

	return JSON.stringify(ResultsRows);
	}

module.actions['getMySalesOrders'] = function(Params){

		function getLastDueDate(wichSO) {
			var filters = [],
			columns 	= [],
			results 	= [],
			mySearch;
			var lastDueDate = {'date':''};

			filters.push(search.createFilter({name: 'custevent_kpi_sales_order',operator: search.Operator.IS ,values: wichSO}));
			filters.push(search.createFilter({name: 'custevent_kpi_workforce_task', operator: search.Operator.IS, values: true}));
			filters.push(search.createFilter({name: 'mainline',join: 'custevent_kpi_sales_order',operator: search.Operator.IS ,values: true}));
			columns.push(search.createColumn({ name: 'duedate',sort: 'DESC'})); //colum 0
			columns.push(search.createColumn({ name: 'internalid'})); //colum 1

			mySearch = search.create({type: 'task',filters: filters,columns: columns});
			mySearch.run().each(function(result){
				var duedate 	= result.getValue(columns[0]);
				lastDueDate['date'] = duedate;
				//return true;
			});
			return lastDueDate;
		}

		function getItemsAndServAddresses(wichSO, typeAction) {
			var filters = [],
			columns 	= [],
			results 	= [],
			mySearch;
			var taskCount 	= {'countTk':0};
			//Parameters -------------------

			filters.push(search.createFilter({name: 'type', operator: search.Operator.IS, values: 'SalesOrd'}));
			filters.push(search.createFilter({name: 'internalid', operator: search.Operator.IS, values: wichSO}));
			filters.push(search.createFilter({name: 'item', operator: search.Operator.NONEOF ,values: '@NONE@'}));
			filters.push(search.createFilter({name: 'type',join: 'item', operator: search.Operator.IS ,values: 'Service'}));

			if(typeAction == 'Item'){
				columns.push(search.createColumn({ name: 'line',sort: 'ASC', summary: search.Summary.COUNT })); //colum 0
			}else{
				columns.push(search.createColumn({ name: 'custcol_location_a_c',sort: 'ASC',summary: search.Summary.GROUP})); //colum 0
				columns.push(search.createColumn({ name: 'custcol_location_z_c',summary: search.Summary.GROUP})); //colum 1
			}
			mySearch = search.create({type: 'transaction',filters: filters,columns: columns});

			var count = 0;
			var countTk = 0;
			mySearch.run().each(function(result) {
				if(typeAction == "Item"){
					countTk = result.getValue(columns[0]);
				}else{
					if(result.getValue(columns[0])){
						count++;
					}
					if(result.getValue(columns[1])){
						count++;
					}

				}
			//	countTk 		= result.getValue(columns[0]);

				taskCount['countTk'] = ( typeAction == 'Item') ? countTk : count;
				return true;
			});
			return taskCount;
		}
		// End of function
		var IdUser = Params['IdUser'];
		var anySOStatus = Params['SOStatus'];
		if(IdUser == 'CurrentUser' || IdUser == "" || IdUser == undefined){
			IdUser = runtime.getCurrentUser().id;
		}
		var test;
		var Rows = [];
		var filters = [],
			  columns=[],
			  mySearch;

		if(IdUser != 'NotUser'){
			filters.push(search.createFilter({name: 'assigned',operator: search.Operator.ANYOF,values: IdUser}));
		}

		filters.push(search.createFilter({name: 'mainline',join: 'custevent_kpi_sales_order',operator: search.Operator.IS,values: true}));

		log.debug ({title: 'anySOStatus', details: typeof anySOStatus});

		var fStatus = anySOStatus.split(",");

		if (anySOStatus == 'OnPageLoad') {
			// At load start,  it shows only the E status
			filters.push(search.createFilter({name: 'status',join: 'custevent_kpi_sales_order',operator: search.Operator.ANYOF, values: ['SalesOrd:B','SalesOrd:D','SalesOrd:E'] }));
		}
		else if(anySOStatus == 'SomeSOStatus'){
			// Load all orders Tab called Sales Order; we show the status: B, D, E
			filters.push(search.createFilter({name: 'status',join: 'custevent_kpi_sales_order',operator: search.Operator.ANYOF, values: ['SalesOrd:B','SalesOrd:D','SalesOrd:E'] }));
		}else if(anySOStatus == 'AllSOStatus'){
			// Load all orders Tab called Sales Order; we show the status: G, H
			//filters.push(search.createFilter({name: 'status',join: 'custevent_kpi_sales_order',operator: search.Operator.NONEOF, values: ['SalesOrd:G','SalesOrd:H'] }));
		}else if (fStatus.length > 0) {
			filters.push(search.createFilter({name: 'status',join: 'custevent_kpi_sales_order',operator: search.Operator.ANYOF, values: fStatus }));

		}

		// Columns INTERNAL ID [0]
		columns.push(search.createColumn({name: 'internalid',join: 'custevent_kpi_sales_order',sort: 'ASC',summary: search.Summary.GROUP}));
		// columns TRAIN ID [1]
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
		columns.push(search.createColumn({name: 'custbodytotal_nrc_usd', join: 'custevent_kpi_sales_order', summary: search.Summary.GROUP }));
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



		mySearch = search.create({
			type: 'task',
			filters: filters,
			columns: columns,
		});
        mySearch.run().each(function(result) {
			Rows.push({
			  "internalid": result.getValue(columns[0]), // Internal Id
			  "tranid": result.getValue(columns[1]), // Tranid
			  "customer": result.getText(columns[2]), // customer
			  "description": result.getValue(columns[3]), // Age in days
			  "DaysSinceApproved": result.getValue(columns[4]),
			  "ProjectManager": result.getText(columns[5]),
			  "SalesRep": result.getText(columns[6]),
			  "MRR": result.getValue(columns[7]),
			  "NRR": result.getValue(columns[8]),
			  "provengineer": result.getText(columns[9]),
			  "addrcities": result.getValue(columns[10]),
			  "soItems": getItemsAndServAddresses(result.getValue(columns[0]),'Item').countTk,
			  "soSA": getItemsAndServAddresses(result.getValue(columns[0]),'Serv').countTk,
			  "soDueDate": String(getLastDueDate(result.getValue(columns[0])).date),
			  "PendingMRR": result.getValue(columns[11]),
			  "PendingNRR": result.getValue(columns[12]),
			  //"sostatus": (  result.getValue(columns[13])  == undefined ) ? '' : result.getValue(columns[13])
			  "sostatus": result.getValue(columns[13])
			  //"sostatus": test
		    });
			return true;
		});
		return JSON.stringify(Rows);
	}

	module.actions['getTaskPredecessor'] = function(Params){
		var allResults = [];

		var SearchPredecessor = search.create({
			type : "task",
			columns : ["internalid","startdate","duedate","title"],
			filters: ["internalid","is",(Params['id']=="" || Params['id']==undefined) ? 0 : parseInt(Params['id'])]
		});
		SearchPredecessor.run().each(function(result){

			var startdate = format.parse({ value: result.getValue({name: 'startdate'}), type: format.Type.DATE});
			var duedate = format.parse({ value: result.getValue({name: 'duedate'}), type: format.Type.DATE});
			allResults.push({
				"internalid":result.getValue({name: 'internalid'}),
				"title":result.getValue({name: 'title'}),
				"startdate":Date.parse(startdate),
				//"startdate":String(startdate).replace("Z",""),
				"duedate":Date.parse(duedate)
				//"duedate":String(duedate).replace("Z","")
			});

			return true
		});

		return JSON.stringify(allResults);
	}

	module.actions['getTasksTable'] = function(requestParams){

		var arrSearch,
		arrSearchFilters=[],
		count = 0;
		var results =[];
		var SeeWhatMode = requestParams['kpiordersale'];
		var isPm = requestParams ['pm'];
		//SeeWhatOrderSale = 329071;
		SeeWhatOrderSale = requestParams['WhichSalesOrder'];
		var selectPage = requestParams['selectPage'];
		var isTheLast = false;

		function createpicker (date,i,id){
			var string="";
			if (i == "StartDate_"){
				// string = '<div id="idPicker_'+id+'" > <input type="date" data-date=\'{"minView": 2, "startView": 2}\' onchange="changeidPickerStartDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
				string = '<div> <input type="text" class="toDatePicker1" onchange="changeidPickerStartDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
			}else if (i =="DueDate_"){
				// string = '<div id="idPicker_'+id+'" > <input type="date" data-date=\'{"minView": 2, "startView": 2}\' onchange="changeidPickerDueDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
				string = '<div> <input type="text"  class="toDatePicker1" onchange="changeidPickerDueDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
			}

			return string;
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
					//string = string + '<option value="'+result.getValue('id')+'" select > Hola Select </option>';
					string = string + '<option value="'+result.getValue('internalid')+'"  selected="selected" >'+result.getValue('name')+'</option>';
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
			//values: [ (requestParams['kpiordersale']=="" || requestParams['kpiordersale']==undefined) ? 329071 : parseInt(requestParams['kpiordersale']) ]
			values: SeeWhatOrderSale
		}));

		if(!isPm){
			arrSearchFilters.push(search.createFilter({
				name: 'assigned',
				operator: search.Operator.ANYOF,
				values: runtime.getCurrentUser().id
			}));
		}


		arrSearch = search.create({
			type: 'task',
			filters: arrSearchFilters,
				//[
			      //   ['custevent_kpi_sales_order', search.Operator.ANYOF, 445093]
			     //['custevent_kpi_sales_order', search.Operator.ANYOF, 329071]
			    //],
			columns: ['internalid','custevent_kpi_wrike_id','custevent_kpi_wrike_permalink','custevent_kpi_ack','custevent_kpi_task_status','custevent_kpi_current_dependency','title','assigned','custevent_kpi_work_on_weekend','startdate','duedate','custevent_kpi_duration','custevent_kpi_ack','custevent_kpi_item','custevent_kpi_item_line','custevent_kpi_service_address','custevent_kpi_task_status','custevent_kpi_planned_startdate','custevent_kpi_task_status','custevent_kpi_planned_duedate', 'custevent_kpi_current_predecessor']

		});
		var allRows = 0;
		//arrSearch.run().each(function(result){ allRows++; });
		//allRows = arrSearch.run().pa;


			var pagedData = arrSearch.runPaged({ pageSize: 20});
	     var salesOrders = [{ text: '', value: '' }]; // Default values

			var test = function(pageRange)
 			{
 					var page = pagedData.fetch({ index: pageRange.index });
 					page.data.forEach(function(result)
 					{
						count++;
						//isTheLast = page.isLast;
 						var IsWorkOnWeekend = result.getValue({name: 'custevent_kpi_work_on_weekend'});
 						results.push({
 							//'id': result.getId(),
							'selectPage' : selectPage,
 							'taskId': result.getValue({name: 'internalid'}),
 							'taskTitle': result.getValue({name: 'title'}),
 							//Merge
 							'taskKpiItem': result.getValue({name: 'custevent_kpi_item'}),
 							'taskKpiLine': result.getValue({name: 'custevent_kpi_item_line'}),
 							'taskKpiAddress': result.getValue({name: 'custevent_kpi_service_address'}),

 							'taskAssigned': result.getText({name: 'assigned'}),
 							'taskAssignedID': result.getValue({name: 'assigned'}),
 							'taskStartDate': createpicker(formatDate(DateMMDDYYYY(result.getValue({name: 'startdate'}))),'StartDate_','StartDate_'+count),
 							'taskDueDate': createpicker(formatDate(DateMMDDYYYY(result.getValue({name: 'duedate'}))),'DueDate_','DueDate_'+count),
 							'taskWorkWeekend': IsWorkOnWeekend,
 							'taskDuration': result.getValue({name: 'custevent_kpi_duration'}),
 							'taskDependency': result.getValue({name: 'custevent_kpi_current_dependency'}),
 							'taskStatus': result.getValue({name: 'custevent_kpi_task_status'}), /// Merge
 							'taskAck': result.getValue({name: 'custevent_kpi_ack'}),  			/// Merge
 							'taskPredecessor': result.getValue({name: 'custevent_kpi_current_predecessor'}),
 							'test' : result.getValue({name: 'startdate'}),
 							'GlobalStartDate': formatDate(DateMMDDYYYY(result.getValue({name: 'startdate'}))),
 							'GlobalDueDate' : result.getValue({name: 'duedate'}),
 							'WrikeLink' : result.getValue({name: 'custevent_kpi_wrike_permalink'}),
 							'WrikeID' : result.getValue({name: 'custevent_kpi_wrike_id'}),
 							'setColortoRedOutDated': outdatedTask( String(result.getValue({name: 'duedate'})) ),
 							'datoparseada': parseada( String (result.getValue({name: 'startdate'})) ),
 							'yellow': datedTaskYellow( String (result.getValue({name: 'duedate'})) )

 						});

 					});
 			};

	  	if(pagedData.count>0){

				 test(pagedData.pageRanges[selectPage]);
			 }

	return JSON.stringify([pagedData.count,results]);


	};

	module.actions['getTasksTablev2'] = function(requestParams) {
		count = 0;
		var arrSearch,
			arrSearchFilters = [];
		var results = [];
		//var SeeWhatMode = requestParams['kpiordersale'];
		//SeeWhatOrderSale = 329071;
		SeeWhatOrderSale = requestParams['WhichSalesOrder'];
		var selectedPage = requestParams['selectPage'];

		function createpicker(date, i, id) {
			var string = "";
			if(i == "StartDate_") {
				string = '<div> <input type="text" onchange="changeidPickerStartDate.call(this)" class="toDatePicker2" id="idPicker_' + id + '" value="' + date + '"> </div><p style="font-size:0px;position:absolute;">' + date + '</p>';
			} else if(i == "DueDate_") {
				string = '<div> <input type="text" onchange="changeidPickerDueDate.call(this)" class="toDatePicker2" id="idPicker_' + id + '" value="' + date + '"> </div><p style="font-size:0px;position:absolute;">' + date + '</p>';
			}
			return string;
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


		function FormatFormat(date) {
			return format.format({ value: date, type: 'date' });
			// return parseDate;
		}

		function stringselect(statu, statussearch) {
			var string = '<select id="idStatusTask" >';
			statussearch.run().each(function(result) {
				if(statu == result.getValue('name')) {
					//string = string + '<option value="'+result.getValue('id')+'" select > Hola Select </option>';
					string = string + '<option value="' + result.getValue('internalid') + '" selected="selected" >' + result.getValue('name') + '</option>';
				} else {
					string = string + '<option value="' + result.getValue('internalid') + '">' + result.getValue('name') + '</option>';
					//string = string + '<option value="'+result.getValue('id')+'">Hola</option>';
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
			//values: 437770
		}));

		var assignedTo = requestParams['assignedTo'];
		if(assignedTo != 'notuser0') {
			if(assignedTo == 'onlymytasks') {
				assignedTo = runtime.getCurrentUser().id
			}
			arrSearchFilters.push(search.createFilter({
				name: 'assigned',
				operator: search.Operator.ANYOF,
				values: assignedTo
			}));
		} // end of if

		var Status = requestParams['StatusId'];
		if(Status != 'notstatus') {
			arrSearchFilters.push(search.createFilter({
				name: 'custevent_kpi_task_status',
				operator: search.Operator.IS,
				values: Status
			}));
		} // end of if

		var DepartmentTo = requestParams['DepartmentTo'];
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
		if(requestParams['StartDate'] != '') {
			// var StartDate = FormatFormat(requestParams['StartDate']);
			var StartDate = FormatFormat(new Date ((requestParams['StartDate']).replace(regex,'/')));
			arrSearchFilters.push(search.createFilter({
				name: 'startdate',
				operator: search.Operator.ONORAFTER,
				values: StartDate
			}));
		}
		if(requestParams['DueDate'] != '') {
			// var DueDate = FormatFormat(requestParams['DueDate']);
			var DueDate = FormatFormat(new Date((requestParams['DueDate']).replace(regex,'/')));
			// var DueDate = new Date(requestParams['DueDate']);
			arrSearchFilters.push(search.createFilter({
				name: 'enddate',
				operator: search.Operator.ONORBEFORE,
				values: DueDate
			}));
		}
		var Wow = requestParams['WoW'];
		arrSearchFilters.push(search.createFilter({
			name: 'custevent_kpi_work_on_weekend',
			operator: search.Operator.IS,
			values: Wow
		}));
		var FD = requestParams['FD'];
		var TD = requestParams['TD'];
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
		arrSearch = search.create({
			type: 'task',
			filters: arrSearchFilters,
			//[
			//   ['custevent_kpi_sales_order', search.Operator.ANYOF, 445093]
			//['custevent_kpi_sales_order', search.Operator.ANYOF, 329071]
			//],
			columns: ['internalid','custevent_kpi_wrike_id','custevent_kpi_wrike_permalink', 'custevent_kpi_ack', 'custevent_kpi_task_status', 'custevent_kpi_current_dependency', 'title', 'assigned', 'custevent_kpi_work_on_weekend', 'startdate', 'duedate', 'custevent_kpi_duration', 'custevent_kpi_ack', 'custevent_kpi_item', 'custevent_kpi_item_line', 'custevent_kpi_service_address', 'custevent_kpi_task_status', 'custevent_kpi_planned_startdate', 'custevent_kpi_task_status', 'custevent_kpi_planned_duedate', 'custevent_kpi_current_predecessor']

		});

			var pagedData = arrSearch.runPaged({ pageSize: 20});

			var pageSearch = function(pageRange)
			{
					var page = pagedData.fetch({ index: pageRange.index });
					page.data.forEach(function(result)
					{
						count++;
					//	isTheLast = page.isLast;
						var IsWorkOnWeekend = result.getValue({name: 'custevent_kpi_work_on_weekend'});
						results.push({
							//'id': result.getId(),

							'selectPage' : selectedPage,
							'taskId': result.getValue({name: 'internalid'}),
							'taskTitle': result.getValue({name: 'title'}),
							//Merge
							'taskKpiItem': result.getValue({name: 'custevent_kpi_item'}),
							'taskKpiLine': result.getValue({name: 'custevent_kpi_item_line'}),
							'taskKpiAddress': result.getValue({name: 'custevent_kpi_service_address'}),

							'taskAssigned': result.getText({name: 'assigned'}),
							'taskAssignedID': result.getValue({name: 'assigned'}),
							'taskStartDate': createpicker(formatDate(DateMMDDYYYY(result.getValue({name: 'startdate'}))),'StartDate_','StartDate_'+count),
							'taskDueDate': createpicker(formatDate(DateMMDDYYYY(result.getValue({name: 'duedate'}))),'DueDate_','DueDate_'+count),
							'taskWorkWeekend': IsWorkOnWeekend,
							'taskDuration': result.getValue({name: 'custevent_kpi_duration'}),
							'taskDependency': result.getValue({name: 'custevent_kpi_current_dependency'}),
							'taskStatus': result.getValue({name: 'custevent_kpi_task_status'}), /// Merge
							'taskAck': result.getValue({name: 'custevent_kpi_ack'}),  			/// Merge
							'taskPredecessor': result.getValue({name: 'custevent_kpi_current_predecessor'}),
							'test' : result.getValue({name: 'startdate'}),
							'GlobalStartDate': formatDate(DateMMDDYYYY(result.getValue({name: 'startdate'}))),
							'GlobalDueDate' : result.getValue({name: 'duedate'}),
							'WrikeLink' : result.getValue({name: 'custevent_kpi_wrike_permalink'}),
							'WrikeID' : result.getValue({name: 'custevent_kpi_wrike_id'}),
							'setColortoRedOutDated': outdatedTask( String(result.getValue({name: 'duedate'})) ),
							'datoparseada': parseada( String (result.getValue({name: 'startdate'})) ),
							// 'yellow': datedTaskYellow( String (result.getValue({name: 'duedate'})) )
							'ConStartDate': StartDate,
							'ConEndDate': DueDate,

						});

					});
			};

				if(pagedData.count>0){

					 pageSearch(pagedData.pageRanges[selectedPage]);
				 }

			return JSON.stringify([pagedData.count,results]);

		//return JSON.stringify(results);
	};

	module.actions['showPress'] = function(requestParams){
		function formatDateZ(date) {
			var parseDate = format.parse ({
			  value : date,
			  type: format.Type.DATE
		  	});
			//var d = new Date(parseDate);
			//d = d + '  ' + date;
			return parseDate;
		}

		var IDType 		= requestParams['IDType'];
		var IdField 	= requestParams['IdField'];
		var IdParent 	= requestParams['IdParent'];

		var WhichTask 	= requestParams['WhichTask'];
		var arrSearch, arrSearchFilters = [],columns = [];

		columns = ['internalid' , IdField , 'custrecord_tp_assigned' , 'custrecord_tp_startdate' , 'custrecord_tp_duedate' , 'custrecord_tp_duration','custrecord_tp_predecessor'];
		columns.push(search.createColumn({name:'custevent_kpi_task_status'	,join:'custrecord_tp_predecessor'})); // column 7

		arrSearchFilters.push([IdParent, search.Operator.IS, WhichTask]);
		arrSearch = search.create({type: IDType ,filters: arrSearchFilters,columns: columns});
		var resultTask 	= [];
		arrSearch.run().each(function(result){
			var title 				= result.getText({name: IdField});
			var internalid			= result.getValue({name: 'internalid'});
			var assigned 			= result.getText({ name: 'custrecord_tp_assigned'});
			var startdate 			= formatDateZ(result.getValue({name: 'custrecord_tp_startdate'}));
			var duedate 			= formatDateZ ( result.getValue({name: 'custrecord_tp_duedate'})) ;
			var duration 			= result.getValue({name: 'custrecord_tp_duration'});
			var idTask 				= result.getValue({name: 'custrecord_tp_predecessor'});
			var status				= result.getText(columns[7]);

			resultTask.push({'internalid'	: internalid,'title': title , 'assigned' : assigned , 'startdate' : startdate , 'duedate' : duedate , 'duration' : duration ,'idTask':idTask ,'status' : status});
		});

		return (JSON.stringify(resultTask));
	};
	//Search Press Succ ------------------------------------------------
	module.actions['showSucc'] = function(requestParams){
		var IDType 		= requestParams['IDType'];
		var IdField 	= requestParams['IdField'];
		var IdParent 	= requestParams['IdParent'];

		var WhichTask 	= requestParams['WhichTask'];

		var arrSearch, arrSearchFilters = [],columns = [];
		columns = ['internalid' , IdField , 'custrecord_ts_assigned', 'custrecord_ts_startdate', 'custrecord_ts_duedate', 'custrecord_ts_duration','custrecord_ts_successor' ];
		columns.push(search.createColumn({name:'custevent_kpi_task_status'	,join:'custrecord_ts_successor'})); // column 7
		arrSearchFilters.push([IdParent, search.Operator.IS, WhichTask]);

		arrSearch = search.create({type: IDType ,filters: arrSearchFilters,columns: columns});

		var resultTask 	= [];
		arrSearch.run().each(function(result){
			var title 				= result.getText({name: IdField});
			var internalid			= result.getValue({name: 'internalid'});
			var assigned 			= result.getText({name: 'custrecord_ts_assigned'});
			var startdate 			= result.getValue({name: 'custrecord_ts_startdate'});
			var duedate 			= result.getValue({name: 'custrecord_ts_duedate'});
			var duration 			= result.getValue({name: 'custrecord_ts_duration'});
			var idTask 				= result.getValue({name: 'custrecord_ts_successor'});
			var status				= result.getText(columns[7]);

			resultTask.push({'internalid'	: internalid,'title': title , 'assigned' : assigned , 'startdate' : startdate , 'duedate' : duedate , 'duration' : duration, 'idTask' : idTask, 'status' : status});
		});

		return (JSON.stringify(resultTask));
	};
	//Search to One Task by Internal ID --------------------------------
	module.actions['GetTaskTree'] = function(requestParams){
		var WhichTask 	= requestParams['WhichTask'];
		var arrSearch, arrSearchFilters = [],columns = [];
		//columns = ['internalid','title','custevent_kpi_ack','custevent_kpi_task_status','custevent_kpi_current_dependency','assigned','custevent_kpi_work_on_weekend','startdate','duedate','custevent_kpi_duration','custevent_kpi_planned_duedate', 'custevent_kpi_current_predecessor','custevent_kpi_sales_order'];
		columns = ['internalid','title','custevent_kpi_wrike_id','custevent_kpi_ack','custevent_kpi_task_status','custevent_kpi_current_dependency','assigned','custevent_kpi_work_on_weekend','startdate','duedate','custevent_kpi_duration','custevent_kpi_planned_duedate', 'custevent_kpi_current_predecessor','custevent_kpi_sales_order','custevent_kpi_service_address','custevent_kpi_item','custevent_kpi_item_line'];
		columns.push(search.createColumn({name:'custrecord_kpit_process',	join:'custevent_kpi_task_type'}));  // column 16
       	columns.push(search.createColumn({name:'custrecord_kpit_subprocess',join:'custevent_kpi_task_type'}));  // column 17

		//columns.push(search.createColumn({name:'custrecord_ts_successor',join:'customrecord_task_successor'}));
		arrSearchFilters.push(['internalid', search.Operator.IS, WhichTask]);
		arrSearch = search.create({type: 'task',filters: arrSearchFilters,columns: columns});

		var count,counter = 0 ;
		var resultTask 	= [];

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


			resultTask.push(
				{
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
					'WrikeID'			: wrikeid
				}
			);
		});

		return (JSON.stringify(resultTask));
		//Other Functions ------------------------------------------------------------------------------------
		//createpicker Functions -----------------------------------------------------------------------------
		function createpicker (date,i,id){
			var string="";
			if (i == "StartDate_"){
				string = '<div> <input type="text" class="showTaskDatePick" onchange="changeidPickerStartDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
			}else if (i =="DueDate_"){
				string = '<div> <input type="text" class="showTaskDatePick" onchange="changeidPickerDueDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
			}
			return string;
		}//end createpicker
		//formatDate Functions --------------------------------------------------------------------------------
		function formatDate(date) {
		  var d = new Date(date),
		      month = '' + (d.getMonth() + 1),
		      day = '' + d.getDate(),
		      year = d.getFullYear();

		  if (month.length < 2) month = '0' + month;
		  if (day.length < 2) day = '0' + day;

		  return [year,month,day].join('-');
		}//end formatDate
		//formatToDates---------------------------------------------------------------------------------------
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
	//Search to Location A <> Location Z--------------------------------
	module.actions['searchItemLocation'] = function(requestParams){
		var SeeWhatOrderSale 	= requestParams['WhichSalesOrder'];
		var WhichItem 			= requestParams['WhichItem'];
		var WhichLine 			= requestParams['WhichLine'];
		var name,
        item= {'item':'','location_a':null, 'location_z': null},
        filters = [],
        columns = [];
    	columns = ['custcol_location_a_c','custcol_location_z_c','line','item'];
       	filters.push(search.createFilter({name:'type'		, operator: search.Operator.ANYOF, values:'SalesOrd'}));
       	filters.push(search.createFilter({name:'internalid'	, operator: search.Operator.IS, values: SeeWhatOrderSale}));
       	filters.push(search.createFilter({name:'type'		, join:'item', operator: search.Operator.IS, values:'Service'}));
       	filters.push(search.createFilter({name:'internalid'	, join:'item', operator: search.Operator.IS, values: WhichItem }));

       	var searchTrans = search.create({type: 'transaction',filters: filters, columns: columns});

       	searchTrans.run().each(function(result){
       		if(result.getValue("line") == WhichLine ){
                name = result.getText('item')
                + " - " + (result.getText('custcol_location_a_c'))
                + ((result.getText('custcol_location_z_c')) ? (' <> ' + result.getText('custcol_location_z_c') ) : '');

                item['item'] = name;
                item['location_a'] = result.getValue('custcol_location_a_c');
                item['location_z'] = result.getValue('custcol_location_z_c');
            }
            return true;
       	});
       	return JSON.stringify(item);
	};
	//Search to Location A <> Location Z--------------------------------
	// module.actions['searchItemLocation'] = function(requestParams){
	// 	var SeeWhatOrderSale 	= requestParams['WhichSalesOrder'];
	// 	var WhichItem 			= requestParams['WhichItem'];
	// 	var WhichLine 			= requestParams['WhichLine'];
	// 	var name,
  //       item= {'item':'','location_a':null, 'location_z': null},
  //       filters = [],
  //       columns = [];
  //   	columns = ['custcol_location_a_c','custcol_location_z_c','line','item'];
  //      	filters.push(search.createFilter({name:'type'		, operator: search.Operator.ANYOF, values:'SalesOrd'}));
  //      	filters.push(search.createFilter({name:'internalid'	, operator: search.Operator.IS, values: SeeWhatOrderSale}));
  //      	filters.push(search.createFilter({name:'type'		, join:'item', operator: search.Operator.IS, values:'Service'}));
  //      	filters.push(search.createFilter({name:'internalid'	, join:'item', operator: search.Operator.IS, values: WhichItem }));
	//
  //      	var searchTrans = search.create({type: 'transaction',filters: filters, columns: columns});
	//
  //      	searchTrans.run().each(function(result){
  //      		if(result.getValue("line") == WhichLine ){
  //               name = result.getText('item')
  //               + " - " + (result.getText('custcol_location_a_c'))
  //               + ((result.getText('custcol_location_z_c')) ? (' <> ' + result.getText('custcol_location_z_c') ) : '');
	//
  //               item['item'] = name;
  //               item['location_a'] = result.getValue('custcol_location_a_c');
  //               item['location_z'] = result.getValue('custcol_location_z_c');
  //           }
  //           return true;
  //      	});
  //      	return JSON.stringify(item);
	// };
	//Search to Task by Sales Order(Internal ID SO)------------------------------------------------
	//Search to Task by Sales Order(Internal ID SO)------------------------------------------------
	module.actions['getTasksTableTree'] = function(requestParams){
		var arrSearch,arrSearchFilters=[],count = 0;
		var columns 		= [];
		var SeeWhatOrderSale = requestParams['WhichSalesOrder'];
		var custevent_kpi_service_address 	= search.createColumn({name: 'custevent_kpi_service_address',	sort: search.Sort.ASC});//DESC
		var custevent_kpi_item 				= search.createColumn({name: 'custevent_kpi_item',				sort: search.Sort.ASC});//DESC
		var title 							= search.createColumn({name: 'title',							sort: search.Sort.ASC});//DESC

		columns = [ /** if you added one column you need to check the column number in function pushArrayAddress **/
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
		return JSON.stringify(resultFinal);
		//------------------------------------------------------------------------------------
		function pushArrayAddress(result){
			var interID 		= result.getValue({name: 'internalid'});
			var title 			= result.getValue({name: 'title'}) + ' ' + result.getValue({name: 'custevent_kpi_task_status'});

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
			//
			if(taskKpiAddress != ''){//Address ----------------
				if(taskProcessVal != ''){
					taskPro = 'A'+taskKpiAddress +'~'+ taskProcessVal +'~'+taskProcess  ;
				}
				if(taskSubProcessVal == ''){
					taskSubPro      = '';
					taskSubProTask 	= 'A'+taskKpiAddress + '~' + taskProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + '-' + taskDueDate + "-" + taskDuration + "-" + drawStatus + "-" + isDes + '|' + custevent_kpi_task_status;
				}else{
					taskSubPro 		= 'A'+taskKpiAddress + '~' + taskProcessVal + '~' + taskSubProcessVal +	'~' + taskSubProcess;
					taskSubProTask 	= 'A'+taskKpiAddress + '~' + taskProcessVal + '~' + taskSubProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + '-' + taskDueDate + "-" + taskDuration + "-" + drawStatus + "-" + isDes + '|' + custevent_kpi_task_status;
				}
			}else if(taskKpiItem != ''){//Item ----------------
				if(taskProcessVal != ''){
					taskPro = 'I'+taskKpiItem+'-'+taskKpiLine+'~'+ taskProcessVal +'~'+taskProcess;
				}
				if(taskSubProcessVal == ''){
					taskSubProTask 	= 'I'+taskKpiItem+'-'+taskKpiLine+ '~' + taskProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + '-' + taskDueDate + "-" + taskDuration + "-" + drawStatus + "-" + isDes + '|' + custevent_kpi_task_status;
				}else{
					taskSubPro 		= 'I'+taskKpiItem+'-'+taskKpiLine + '~' + taskProcessVal + '~' + taskSubProcessVal +	'~' + taskSubProcess;
					taskSubProTask 	= 'I'+taskKpiItem+'-'+taskKpiLine + '~' + taskProcessVal + '~' + taskSubProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + '-' + taskDueDate + "-" + taskDuration + "-" + drawStatus  + "-" + isDes + '|' + custevent_kpi_task_status;
				}
			}else{//Planning ----------------
				if(taskProcessVal != ''){
					taskPro = 'P'+taskProcessVal +'~'+taskProcess;
				}
				if(taskSubProcessVal == ''){
					taskSubPro      = '';
					taskSubProTask 	= 'P'+taskProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + '-' + taskDueDate + "-" + taskDuration + "-" + drawStatus  + "-" + isDes + '|' + custevent_kpi_task_status;
				}else{
					taskSubPro 		= 'P'+taskProcessVal + '~' + taskSubProcessVal +'~'+ taskSubProcess;
					taskSubProTask 	= 'P'+taskProcessVal + '~' + taskSubProcessVal + '~' + interID +'~'+ title + '|' + taskStartDate + '-' + taskDueDate + "-" + taskDuration + "-" + drawStatus  + "-" + isDes + '|' + custevent_kpi_task_status;
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
				'taskDueDate'		: taskDueDate
			});
		}
	};
	//-------------------------------------------------------------------------------------------------------------------

	module.actions['getCustomerfromID'] = function(requestParams){
		var Rows = [];
		var id = requestParams["id"];
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
		return JSON.stringify(Rows);
	}
	module.actions['getAllMyWork'] = function(requestParams){
		var IdstatusPrev = requestParams["statusId"] ;
		var arrSearch,
		arrSearchFilters=[],
		ancount =0,
		count = 0;
		var results =[];
		// var SeeWhatMode = requestParams['kpiordersale'];

		// //SeeWhatOrderSale = 329071;
		// SeeWhatOrderSale = requestParams['WhichSalesOrder'];

		function createpicker (date,i,id){
			var string="";
			if (i == "StartDate_"){
			//	string = '<div id="idPicker_'+id+'" > <input type="date" data-date=\'{"minView": 2, "startView": 2}\' onchange="changeidPickerStartDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
				string = '<div> <input type="text" class="toDatePicker" onchange="changeidPickerStartDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
			}else if (i =="DueDate_"){
				string = '<div> <input type="text" class="toDatePicker" onchange="changeidPickerDueDate.call(this)" id="idPicker_'+id+'" value="'+date+'"> </div><p style="font-size:0px;position:absolute;">'+date+'</p>';
			}

			return string;
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
		  }else { return false; }
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
					//string = string + '<option value="'+result.getValue('id')+'" select > Hola Select </option>';
					string = string + '<option value="'+result.getValue('internalid')+'"  selected="selected" >'+result.getValue('name')+'</option>';
				}else{
					string = string + '<option value="'+result.getValue('internalid')+'">'+result.getValue('name')+ '</option>';
					//string = string + '<option value="'+result.getValue('id')+'">Hola</option>';
				}
				return true ;
			});
			string = string + '</select>';
			return string;
		}
		var due = search.createColumn({name: 'duedate',	sort: search.Sort.ASC});

		arrSearchFilters.push(search.createFilter({
			name: 'assigned',
			operator: search.Operator.ANYOF,
			values: runtime.getCurrentUser().id
		}));

		arrSearchFilters.push(search.createFilter({
			name: 'custevent_kpi_workforce_task',
			operator: search.Operator.IS,
			values: "T"
		}));
		var ackArr = [];
		if(!IdstatusPrev){
			IdstatusPrev = '1';
		}else{
			IdstatusPrev = IdstatusPrev.split(',');
			// IdstatusPrev.forEach(function(it,idx){
			// 	if(it=='1001' || it == '1002'){
			// 		ackArr.push(it);
			// 		it.splice(idx,1);
			// 	}
			// });
			var istatus = [];
			var ackArray = [];
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
			if(istatus)
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


		arrSearch = search.create({
			type: 'task',
			filters: arrSearchFilters ,
			columns: ['internalid','company','custevent_kpi_sales_order','custevent_kpi_wrike_id','custevent_kpi_wrike_permalink','custevent_kpi_ack','custevent_kpi_task_status','custevent_kpi_current_dependency','title','assigned','custevent_kpi_work_on_weekend','startdate',due,'custevent_kpi_duration','custevent_kpi_ack','custevent_kpi_item','custevent_kpi_item_line','custevent_kpi_service_address','custevent_kpi_task_status','custevent_kpi_planned_startdate','custevent_kpi_task_status','custevent_kpi_planned_duedate', 'custevent_kpi_current_predecessor']
		});
		arrSearch.run().each(function(result){
			ancount++;
			count = "myWork"+ ancount;
			// Determines if it will show a checkbox true or false symbol
			var IsWorkOnWeekend = result.getValue({name: 'custevent_kpi_work_on_weekend'});
			var title = result.getValue({name: 'title'});
			results.push({
				'taskId': result.getValue({name: 'internalid'}),
				'taskTitle': title.substring(title.indexOf(" - ") + 3),
				'SalesOrder': result.getText({name: 'custevent_kpi_sales_order'}).substring(13),
				'company': result.getText({name: 'company'}),
				'SalesOrderID': result.getValue({name: 'custevent_kpi_sales_order'}),
				'taskKpiItem': result.getValue({name: 'custevent_kpi_item'}),
				'taskKpiLine': result.getValue({name: 'custevent_kpi_item_line'}),
				'taskKpiAddress': result.getValue({name: 'custevent_kpi_service_address'}),
				'taskAssigned': result.getText({name: 'assigned'}),
				'taskAssignedID': result.getValue({name: 'assigned'}),
				'taskStartDate': createpicker(formatDate(DateMMDDYYYY(result.getValue({name: 'startdate'}))),'StartDate_','StartDate_'+count),
				'taskDueDate': createpicker(formatDate(DateMMDDYYYY(result.getValue({name: 'duedate'}))),'DueDate_','DueDate_'+count),
				'taskWorkWeekend': IsWorkOnWeekend,
				'taskDuration': result.getValue({name: 'custevent_kpi_duration'}),
				'taskDependency': result.getValue({name: 'custevent_kpi_current_dependency'}),
				'taskStatus': result.getValue({name: 'custevent_kpi_task_status'}),
				'taskAck': result.getValue({name: 'custevent_kpi_ack'}),
				'taskPredecessor': result.getValue({name: 'custevent_kpi_current_predecessor'}),
				'test' : result.getValue({name: 'startdate'}),
				'GlobalStartDate': formatDate(DateMMDDYYYY(result.getValue({name: 'startdate'}))),
				'GlobalDueDate' : result.getValue({name: 'duedate'}),
				'WrikeLink' : result.getValue({name: 'custevent_kpi_wrike_permalink'}),
				'WrikeID' : result.getValue({name: 'custevent_kpi_wrike_id'}),
				'setColortoRedOutDated': outdatedTask( String(result.getValue({name: 'duedate'})) ),
				'datoparseada': parseada( String (result.getValue({name: 'startdate'})) ),
				'send' : istatus,
				'send2' : ackArray,
				'yellow' : datedTaskYellow(String(result.getValue({name: 'duedate'})) )
			});
			return true;
		 });

		return JSON.stringify(results);
	};

	module.actions['default'] = function(action){
		return 'There is not such action: ' + action;
	};

    function doGet(requestParams) {
		if (requestParams['action'] && module.actions[requestParams['action']]) {
    	    return module.actions[requestParams['action']](requestParams);
    	  } else {
    	    return module.actions['default']();
    	  }
    }

    function doPut(requestBody) {

    }

    function doPost(requestBody) {

    }

    function doDelete(requestParams) {

    }

    return {
        'get': doGet,
        put: doPut,
        post: doPost,
        'delete': doDelete
    };
});
