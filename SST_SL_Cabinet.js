/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @File SST_SL_Cabinet.js
 */
define(['N/file', 'N/record', 'N/search', 'N/runtime'],
/**
 * @param {file} file
 * @param {record} record
 * @param {search} search
 */
function(file, record, search, runtime) {
   
	var module = {
			'actions': {}
		};
	
//---default>
	module.actions['default'] = function(action){
		return 'There is not such action: ' + action;
	};
	
//---addFileOnTask>
	module.actions['addFileOnTask'] = function (Params) {
		var salesorder =  Params.request.parameters["WhichSalesOrder"];
		var soName =  Params.request.parameters["SOName"];
		var taskId = Params.request.parameters["WhichTask"];
		var taskTitle = Params.request.parameters["TaskTitle"];
		var filename = Params.request.parameters["filename"];
		var ftype = '';
		var worforce_files_root = {SANDBOX:6428448, PRODUCTION: 10279782}; // SandBox / Prod
		var results = {
				preview : '',
				ftype : '',
				fileurl : '',
				fileId : 0,
				filename : '',
				file : 'Error Not Saved'
			};
		var DEBUG = false;
		var allReadyExist = false;
		var Environtment = runtime.envType;
		
		// Fix soname
		soName = soName.trim()
		
		if (DEBUG)
			log.error({title: "addFileOnTask", details: Params.request.parameters});
		
		// Los Folders son custom record type 'folder'
		function createFolder(dirname, parentdir) {
            var dirObj = record.create({ type: 'folder' });
            var id = 0;
            try{
	            dirObj.setValue('name', dirname );
	            dirObj.setValue('parent', parentdir );
	            id = dirObj.save();
            } catch (e) {
            	log.error({title: "Create Folder", details: {'exeption':e, 'dirname':dirname, 'parentdir':parentdir}  });
            	allReadyExist = true;
            }
            return id;
        }
		
		// Buscar si existe el folder.
		function existFolder(dirname, parentdir) {
			var folder_so = {internalid:0, parent:0, name:'not exist'};
			var folderSrch = search.create({
			type: 'folder',
					filters: [
							['name','is',dirname],
							'and',
							['parent','is',  parentdir ]
						],
					columns: ['internalid','parent','name',]
				});
            folderSrch.run().each(function(rec){
  				folder_so = {
	                internalid: rec.getValue('internalid'),
	                parent: rec.getValue('parent'),
	                name: rec.getValue('name')
                }
  			});
            if (!folder_so.internalid)
            	log.error({title: "Folder not exist", details: {'dirname':dirname, 'parentdir':parentdir}  });
            return folder_so;
  		}
		
		// File Encoding...
		var fileEncoding = {
				'UTF8' : 'Unicode',
				'WINDOWS_12​5​2' : 'Western',
				'ISO_8859_1' : 'Western',
				'GB18030' : 'Chinese Simplified',
				'SHIFT_JIS' : 'Japanese',
				'MAC_ROMAN' : 'Western',
				'GB2312' : 'Chinese Simplified',
				'BIG5' : 'Chinese Traditional',
			}
		
		// extension file type...
		var extension_type = {
			    dwg: 'AUTOCAD',
			    bmp: 'BMPIMAGE',
			    csv: 'CSV',
			    xls: 'EXCEL',
			    xlsx: 'EXCEL',
			    swf: 'FLASH',
			    gif: 'GIFIMAGE',
			    gz: 'GZIP',
			    htm: 'HTMLDOC',
			    html: 'HTMLDOC',
			    ico: 'ICON',
			    js: 'JAVASCRIPT',
			    jpg: 'JPGIMAGE',
			    eml: 'MESSAGERFC',
			    mp3: 'MP3',
			    mpg: 'MPEGMOVIE',
			    mpp: 'MSPROJECT',
			    pdf: 'PDF',
			    pjpeg: 'PJPGIMAGE',
			    txt: 'PLAINTEXT',
			    png: 'PNGIMAGE',
			    ps: 'POSTSCRIPT',
			    ppt: 'POWERPOINT',
			    pptx: 'POWERPOINT',
			    mov: 'QUICKTIME',
			    rtf: 'RTF',
			    sms: 'SMS',
			    css: 'STYLESHEET',
			    tiff: 'TIFFIMAGE',
			    vsd: 'VISIO',
			    doc: 'WORD',
			    docx: 'WORD',
			    xml: 'XMLDOC',
			    zip: 'ZIP'
			}
		
		function getFileExtension(filename) {  
			return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
		}
		
		// Just Testing...
		function createAndSaveFile(){
			var fileObj = file.create({
                name: 'test.txt',
                fileType: file.Type.PLAINTEXT,
                contents: 'Hello World\nHello World',
                folder : worforce_files_root,
                isOnline : true
            });
 
            var id = fileObj.save();
            fileObj = file.load({
                id: id
            });
		}
		
		function createFileonOnCabinet(filename, ftype, filecont){
			var fileObj = file.create({
                name: filename,
                fileType: file.Type[ extension_type[ ftype ] ],
                contents: filecont,
                folder : worforce_files_root,
                isOnline : true
            });
			
			return fileObj;
		}
		
		ftype = getFileExtension(filename);
		
		results.exist_folder_so = existFolder(soName, worforce_files_root[Environtment] );
		
		if (results.exist_folder_so.internalid) {
			parentFolder = results.exist_folder_so.internalid;
		} else {
			parentFolder = createFolder(soName, worforce_files_root[Environtment] );
			results.create_folder_so = {internalid : parentFolder , name: soName };
			if (allReadyExist && !parentFolder) {
				// second try to read
				results.exist_folder_so = existFolder(soName, worforce_files_root[Environtment] );
				parentFolder = results.exist_folder_so.internalid;
			}
		}
		
		if (parentFolder) {
			
			if(taskId) {
				results.exist_folder_task = existFolder(taskId,  parentFolder );
				
				if (results.exist_folder_task.internalid) {
					parentFolderTask = results.exist_folder_task.internalid;
				} else {
					parentFolderTask = createFolder(taskId, parentFolder);
					results.exist_folder_task = {internalid : parentFolderTask , name: taskId };
				}
			} else {
				// if task == 0, then save on SO folder root.
				parentFolderTask = parentFolder;
				results.exist_folder_task =  { internalid:0, parent:parentFolder, name:'SO Root' };
			}
			
			// results.file = createFileonOnCabinet(filename, ftype, filecont);
			// {"files":{"type":"file.File","id":null,"name":"wrike-circle.jpeg","description":null,"path":"wrike-circle.jpeg","url":null,"folder":-1,"fileType":"JPGIMAGE","isText":false,"size":804,"encoding":null,"isInactive":false,"isOnline":false}}
			
			var fileToSave = Params.request.files['files'];
			fileToSave.folder = parentFolderTask;
			var timestamp   = (new Date()).getTime();
			filename = fileToSave.name;
			fileToSave.name = timestamp + ' - ' + fileToSave.name;
			fileToSave.description = '['+soName+'] - '+taskTitle;
			var ftype = fileToSave.fileType;
			var preview = '';
			var fileurl = '';
			
			var fileid = fileToSave.save();
			
			if (fileid){
				var fileObj = file.load({ id: fileid });
				fileurl = fileObj.url;
				
				if (['BMPIMAGE','GIFIMAGE','JPGIMAGE','PNGIMAGE','PJPGIMAGE'].indexOf(ftype) != -1){
					preview = '<img src="'+fileurl+'" alt="" width="240" />';
				}
				
				results.preview = preview;
				results.ftype = ftype;
				results.fileurl = fileurl;
				results.fileId = fileid;
				results.filename = filename;
				results.taskId = taskId;
				results.file = 'Saved';
			}
		}
		
		Params.response.write(JSON.stringify(results));
	}
//---addFileOnTask>
	
	
//---addScreenShotOnTask>
	module.actions['addScreenShotOnTask'] = function (Params) {
		var salesorder =  Params.request.parameters["WhichSalesOrder"];
		var soName =  Params.request.parameters["SOName"];
		var taskId = Params.request.parameters["WhichTask"];
		var taskTitle = Params.request.parameters["TaskTitle"];
		var filename = Params.request.parameters["filename"];
		var timestamp   = (new Date()).getTime();
		var rav = 'screenshot';
		var worforce_files_root = {SANDBOX:6428448, PRODUCTION: 10279782}; // SandBox / Prod
		var ftype = '';
		var results = {
				preview : '',
				ftype : '',
				fileurl : '',
				fileId : 0,
				filename : '',
				file : 'Error Not Saved'
			};
		soName = soName.trim();
		
		if(! Params.request.parameters[rav]) { Params.response.write(JSON.stringify(results)); return; }
		
		// Los Folders son custom record type 'folder'
		function createFolder(namex, parentdir) {
            var dirObj = record.create({ type: 'folder' });
            dirObj.setValue('name',namex);
            dirObj.setValue('parent', parentdir );
            var id = dirObj.save();
            return id;
        }
		
		// Buscar si existe el folder.
		function existFolder(dirname, parentdir) {
			var folder_so = {internalid:0, parent:0, name:'not exist'};
			var folderSrch = search.create({
			type: 'folder',
					filters: [
							['name','is',dirname],
							'and',
							['parent','is',  parentdir ]
						],
					columns: ['internalid','parent','name',]
				});
            folderSrch.run().each(function(rec){
  				folder_so = {
	                internalid: rec.getValue('internalid'),
	                parent: rec.getValue('parent'),
	                name: rec.getValue('name')
                }
  			});
            return folder_so;
  		}
		
		//--- log.error({title: "Params", details: Params.request.parameters});
    	//-- log.error({title: "Files", details: Params.request.files});
    
    	results.exist_folder_so = existFolder(soName, worforce_files_root[runtime.envType] );
		
		if (results.exist_folder_so.internalid) {
			parentFolder = results.exist_folder_so.internalid;
		} else {
			parentFolder = createFolder(soName, worforce_files_root[runtime.envType] );
			results.create_folder_so = {internalid : parentFolder , name: soName };
		}
		
		if (parentFolder) {
			
			if(taskId) {
				results.exist_folder_task = existFolder(taskId,  parentFolder );
				
				if (results.exist_folder_task.internalid) {
					parentFolderTask = results.exist_folder_task.internalid;
				} else {
					parentFolderTask = createFolder(taskId, parentFolder);
					results.exist_folder_task = {internalid : parentFolderTask , name: taskId };
				}
			} else {
				// if task == 0, then save on SO folder root.
				parentFolderTask = parentFolder;
				results.exist_folder_task =  { internalid:0, parent:parentFolder, name:'SO Root' };
			}
			
			
			//----- Save ScreenShot ---
			
			filename = rav+'-'+timestamp+'.png';
			fsize = Params.request.parameters[rav].length;
			
			try{
    			var fileObj = file.create({
	    			    name: filename,
	    			    fileType: file.Type.PNGIMAGE,
	    			    contents: Params.request.parameters[rav],
	    			    folder: parentFolderTask,
    				});
			} catch(e) {
				
				log.error({title: "Save Error S0", details: e });
				
				Params.response.write(JSON.stringify(results)); return;
			}
			
			var fileId = -1;
			
			try{
				
				fileId = fileObj.save();
				
			} catch(e) {
				
				log.error({title: "Save Error S1", details: e });
				Params.response.write(JSON.stringify(results)); return;
			}
			
			
			if (fileId){
				var fileObj = file.load({ id: fileId });
				fileurl = fileObj.url;
				ftype = 'PNGIMAGE';
				
				if (['BMPIMAGE','GIFIMAGE','JPGIMAGE','PNGIMAGE','PJPGIMAGE'].indexOf(ftype) != -1){
					preview = '<img src="'+fileurl+'" alt="" width="240" />';
				}
				
				results.preview = preview;
				results.ftype = ftype;
				results.fileurl = fileurl;
				results.fileId = fileId;
				results.filename = filename;
				results.taskId = taskId;
				results.file = 'Saved';
			}
			
		}
			
		Params.response.write(JSON.stringify(results));
			
	}
//---addScreenShotOnTask<
	
	
//---addFileOnCab>
	module.actions['addFileOnCab'] = function (Params) {
		var salesorder =  Params.request.parameters["WhichSalesOrder"];
		var soName =  Params.request.parameters["SOName"];
		var taskId = Params.request.parameters["WhichTask"];
		var taskTitle = Params.request.parameters["TaskTitle"];
		var filename = Params.request.parameters["filename"];
		var timestamp   = (new Date()).getTime();
		
		var worforce_files_root = {SANDBOX:6428448, PRODUCTION: 10279782}; // SandBox / Prod
		
		var ftype = '';
		
		var results = {
				preview : '',
				ftype : '',
				fileurl : '',
				fileId : 0,
				filename : '',
				file : 'Error Not Saved'
			};
		
		//--- log.error({title: "Params", details: Params.request.parameters});
    	//-- log.error({title: "Files", details: Params.request.files});
    	
    	for(var rav in Params.request.parameters){
    		if (rav=="screenshot") {
    			log.error({title: "SH-Content", details: Params.request.parameters[rav] });
    			//-- log.error({title: "SH-Length", details: Params.request.parameters[rav].length });
    			filename = 'screenshot-'+timestamp+'.png';
    			fsize = Params.request.parameters[rav].length;
    			
    			try{
	    			var fileObj = file.create({
	    			    name: filename,
	    			    fileType: file.Type.PNGIMAGE,
	    			    contents: Params.request.parameters[rav],
	    			    //description: 'WorkForce ScreenShot Upload.',
	    			    folder: worforce_files_root['SANDBOX'],
	    			    //size: fsize,
	    			    //isOnline: false
	    			});
    			} catch(e) {
    				
    				log.error({title: "Save Error S0", details: e });
    				
    				return;
    			}
    			
    			var fileId = -1;
    			
    			try{
    				
    				fileId = fileObj.save();
    				
    			} catch(e) {
    				
    				log.error({title: "Save Error S1", details: e });
    				
    			}
    			
    			if(fileId > 0) {
    				log.error({title: "SH-Saved", details:{filename: filename, size:fsize, id: fileId } });
        			results.ftype = 'PNGIMAGE';
        			results.fileId = fileId;
        			results.file = filename;
        			results.size = fsize;
    			}
    			
    		}
    	}
    	
		var fileToSave = Params.request.files['files'];
		
		if(fileToSave)
		var resultsNew = {"type":fileToSave.type, 
				"id":fileToSave.id, 
				"name":fileToSave.name,
				"description":fileToSave.description,
				"path":fileToSave.path,
				"url":fileToSave.url,
				"folder":fileToSave.folder,
				"fileType":fileToSave.fileType,
				"isText":fileToSave.isText,
				"size":fileToSave.size,
				"encoding":fileToSave.encoding,
				"isInactive":fileToSave.isInactive,
				"isOnline":fileToSave.isOnline
			};
		else
			var resultsNew = results;
			
		Params.response.write(JSON.stringify(resultsNew));
			
	}
//---addFileOnCab<
	
	
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	
    	//-- log.error({title: "Params", details: context.request.parameters});
    	//-- log.error({title: "Files", details: context.request.files});
    	
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

// Autor: Ariel Garcia Serna (leirags@hotmail.com)
// Update: 31-March-2017 08:49PM
// Update: 08-April-2017 11:40AM
// Update: 23-May-2017 12:45AM add try-catch to create folder...
// Update: 23-May-2017 09:32AM add trim function to soName...