define(['N/runtime', 'N/search', 'N/https', 'N/url'],

function(runtime, search, https, url) {
	
	function getUser()
	{
		return runtime.getCurrentUser();
	}
	
	messages = {
			
			btn_request_access: {en: 'Request Wrike Access', es: 'Solicitar Acceso a Wrike'},
			btn_recreateWrikeFolders: {en: 'Recreate Wrike Folders', es: 'Re-crear Folders de Wrike'},
			btn_recreate_task: { en:'Recreate Write Task', es: 'Recrear Tarea en Wrike' },
			lbl_talk_now: { en: 'Speak now', es: 'Hable ahora' },
						
	};
	
	function getRuntimeLanguage(){
		language = runtime.getCurrentUser().getPreference('language').split('_')[0];
		return language;
	}
	
	function getTranslation(strlook){
		return messages[strlook][getRuntimeLanguage()];
	}
	
	return {
		getText: getTranslation,
		getUser: getUser
    };
    
});
