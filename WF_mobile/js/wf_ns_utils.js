/**
 * WorkForce netsuite - javascript - conversion
 * Created by Ariel Garcia
 * 2017-May-07 12:42pm
 */
LeirAGS_NS_Utils = {}

LeirAGS_NS_Utils.options = {
		dateformat : 'MM/DD/YYYY',
		months_names : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

LeirAGS_NS_Utils.setformat = function  (s) {
	var _this = this
	_this.options.dateformat = s
}

LeirAGS_NS_Utils.setmonths = function  (m) {
	var _this = this
	_this.options.months_names = m
}

LeirAGS_NS_Utils.StrNSDateToDate = function  (s) {
	if (typeof s !== 'string') return s;
	var _this = this;
	// if (WF_DEBUG)
	// 	console.info('StringNetsuiteDateToDate ()',s,'NetSuite-Format',window.dateformat)
	// var monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var months = _this.options.months_names // window.datetime_short_months
	var newDate = new Date() // Default result...

	// console.info("Window.dateformat",window.dateformat)
	// switch (window.dateformat) {
	switch (_this.options.dateformat) {
		case 'MM/DD/YYYY':
			var parts = s.split('/')
			newDate = new Date(parts[2], parts[0] - 1, parts[1],0 ,0 ,0 ,0 )
			break
		case 'MM.DD.YYYY':
			var parts = s.split('.')
			newDate = new Date(parts[2], parts[0] - 1, parts[1],0 ,0 ,0 ,0 )
			break
		case 'DD/MM/YYYY':
			var parts = s.split('/')
			newDate = new Date(parts[2], parts[1] - 1, parts[0],0 ,0 ,0 ,0 )
			break
		case 'DD.MM.YYYY':
			var parts = s.split('.')
			newDate = new Date(parts[2], parts[1] - 1, parts[0],0 ,0 ,0 ,0 )
			break
		case 'YYYY/MM/DD':
			var parts = s.split('/')
			newDate = new Date(parts[0], parts[1] - 1, parts[2],0 ,0 ,0 ,0 )
			break
		case 'YYYY-MM-DD':
			var parts = s.split('-')
			newDate = new Date(parts[0], parts[1] - 1, parts[2],0 ,0 ,0 ,0 )
			break
		case 'YYYY.MM.DD':
			var parts = s.split('.')
			newDate = new Date(parts[0], parts[1] - 1, parts[2],0 ,0 ,0 ,0 )
			break
		case 'DD.Mon.YYYY':
			var parts = s.split('.')
			newDate = new Date(parts[2], months.indexOf(parts[1]), parts[0],0 ,0 ,0 ,0 )
			break
		case 'DD-Mon-YYYY':
			var parts = s.split('-')
			newDate = new Date(parts[2], months.indexOf(parts[1]), parts[0],0 ,0 ,0 ,0 )
			break
		case 'DD-Month-YYYY':
			var parts = s.split('-')
			newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 3)), parts[0],0 ,0 ,0 ,0 )
			break
		case 'DD-MONTH-YYYY':
			var parts = s.split('-')
			newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0],0 ,0 ,0 ,0 )
			break
		case 'DD,MONTH,YYYY':
			var parts = s.split(',')
			newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0],0 ,0 ,0 ,0 )
			break
		case 'DD MONTH, YYYY':
			var parts = s.split(' ')
			newDate = new Date(parts[2], months.indexOf(parts[1].substring(0, 1).toUpperCase() + parts[1].substring(1, 3).toLowerCase()), parts[0],0 ,0 ,0 ,0 )
			break
	}
	return newDate
}
//---StringNetsuiteDateToDate<


//---setCalendarFormatInput>
LeirAGS_NS_Utils.setCalendarFormatInput	= function () {
//			if(WF_DEBUG)
//				console.info('window.dateformat:',window.dateformat)
//	switch (window.dateformat) {
	var _this = this;
	switch (_this.options.dateformat) {
		case 'MM/DD/YYYY':
			CalendarInputFormat = "m/d/Y";
			break;
		case 'MM.DD.YYYY':
			CalendarInputFormat = "m.d.Y";
			break;
		case 'DD/MM/YYYY':
			CalendarInputFormat = "d/m/Y";
			break;
		case 'DD.MM.YYYY':
			CalendarInputFormat = "d/m/Y";
			break;
		case 'YYYY/MM/DD':
			CalendarInputFormat = "Y/m/d";
			break;
		case 'YYYY-MM-DD':
			CalendarInputFormat = "Y-m-d";
			break;
		case 'YYYY.MM.DD':
			CalendarInputFormat = "Y.m.d";
			break;
		case 'DD.Mon.YYYY':
			CalendarInputFormat = "d.M.Y";
			break;
		case 'DD-Mon-YYYY':
			CalendarInputFormat = "d-M-Y";
			break;
		case 'DD-Month-YYYY':
			CalendarInputFormat = "d-F-Y";
			break;
		case 'DD-MONTH-YYYY':
			CalendarInputFormat = "d-F-Y";
			break;
		case 'DD,MONTH,YYYY':
			CalendarInputFormat = "d,F,Y";
			break;
		case 'DD MONTH, YYYY':
			CalendarInputFormat = "d F, Y";
			break;
	}
//	if(WF_DEBUG)
//		console.info('Set CalendarInputFormat:',CalendarInputFormat)
}
//---setCalendarFormatInput<




//---dateToStringNetsuite>
LeirAGS_NS_Utils.dateToStringNetsuite =	function (datei) {
	var _this = this;
//	if (WF_DEBUG)
//		console.info("dateToStringNetsuite params:", datei);
	if (typeof datei == 'string') return false;
	
	if (datei.constructor === Number) {
		var datei = new Date(datei)
	}
	
	var d = datei.getDate(),
		m = datei.getMonth(),
		y = datei.getFullYear();
	
	var delim = '/'
	var monthsName = _this.options.months_names // ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var months =  _this.options.months_names // window.datetime_short_months;
	var strdate = ''
	m1 = m;
	d1 = d;
	m = m + 1;
	d = (d <= 9 ? '0' + d : d);
	m = (m <= 9 ? '0' + m : m);

//	switch (window.dateformat) {
	switch (_this.options.dateformat) {
		case 'MM/DD/YYYY':
		  delim = '/';
			strdate = '' + m + delim + d + delim + y;
			break;
		case 'MM.DD.YYYY':
			delim = '.';
			strdate = '' + m + delim + d + delim + y;
			break;
		case 'DD/MM/YYYY':
			delim = '/';
			strdate = '' + d + delim + m + delim + y;
			break;
		case 'DD.MM.YYYY':
			delim = '.';
			strdate = '' + d + delim + m + delim + y;
			break;
		case 'YYYY/MM/DD':
			delim = '/';
			strdate = '' + y + delim + m + delim + d;
			break;
		case 'YYYY-MM-DD':
			delim = '-';
			strdate = '' + y + delim + m + delim + d;
			break;
		case 'YYYY.MM.DD':
			delim = '.';
			strdate = '' + y + delim + m + delim + d;
			break;
		case 'DD.Mon.YYYY':
			delim = '.';
			strdate = '' + d + delim + months[m1] + delim + y;
			break;
		case 'DD-Mon-YYYY':
			delim = '-';
			strdate = '' + d + delim + months[m1] + delim + y;
			break;
		case 'DD-Month-YYYY':
			delim = '-';
			strdate = '' + d + delim + monthsName[m1] + delim + y;
			break;
		case 'DD-MONTH-YYYY':
			delim = '-';
			strdate = '' + d + delim + monthsName[m1].toUpperCase() + delim + y;
			break;
		case 'DD,MONTH,YYYY':
			delim = ',';
			strdate = '' + d + delim + monthsName[m1].toUpperCase() + delim + y;
			break;
		case 'DD MONTH, YYYY':
			delim = ' ';
			strdate = '' + d + delim + monthsName[m1].toUpperCase() + ',' + delim + y;
			break;
			//Format Date = (YYYY,MM,DD)
	}
//	if (WF_DEBUG)
//		console.info("dateToStringNetsuite return:", strdate);
	return strdate;
}
//---dateToStringNetsuite<



