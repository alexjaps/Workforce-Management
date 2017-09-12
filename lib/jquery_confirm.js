/**
 * Module Description
 * jquery_confirm.js  with steroides
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Jul 2016     Ariel
 * 1.02       22 Feb 2017     Ariel
 * 1.34		  10 May 2017	  Ariel
 * 
 * Need Include previous 
 * <!-- wf_ns_utils.js -->
 * src='/core/media/media.nl?id=6573343&c=3461650&h=ad79863fcb9a7ba6f540&_xt=.js'
 */

	jQuery.confirmar = function(params){
		if(jQuery('#confirmOverlay').length){
			// A confirm is already shown on the page:
			return false;
		}
		var buttonHTML = '';
		jQuery.each(params.buttons,function(name,obj){
			// Generating the markup for the buttons:
			buttonHTML += '<a href="#" class="button '+obj['class']+'">'+(obj['name']?obj['name']:name)+'<span></span></a>';
			if(!obj.action){ obj.action = function(){} }
		});
		var markup = [
			'<div id="confirmOverlay">',
			'<div id="confirmBox">',
			'<h1>',params.title,'</h1>',
			'<div class="msg">',params.message,'</div>',
			'<div id="confirmButtons">',
			buttonHTML,
			'</div></div></div>'
		].join('');
		jQuery(markup).hide().appendTo('body').fadeIn();
		var buttons = jQuery('#confirmBox .button'), i = 0;
		jQuery.each(params.buttons,function(name,obj){
			buttons.eq(i++).click(function(){
				// Calling the action attribute when a
				// click occurs, and hiding the confirm.
				obj.action();
				jQuery.confirmar.hide();
				return false;
			});
		});
	};
	jQuery.confirmar.hide = function(){
		jQuery('#confirmOverlay').fadeOut(function(){
			jQuery(this).remove();
		});
	};
	jQuery.confirmar.setupcss = function(){
		confirmCSS = 
"#confirmOverlay{ width:100%; height:100%; position:fixed; top:0; left:0; background:url('ie.png'); background: -moz-linear-gradient(rgba(11,11,11,0.1), rgba(11,11,11,0.6)) repeat-x rgba(11,11,11,0.2); background:-webkit-gradient(linear, 0% 0%, 0% 100%, from(rgba(11,11,11,0.1)), to(rgba(11,11,11,0.6))) repeat-x rgba(11,11,11,0.2); z-index:10000; }\
 #confirmBox{ background:url('body_bg.jpg') repeat-x left bottom #e5e5e5; width:460px; position:fixed; left:50%; top:50%; margin:-130px 0 0 -230px; border: 1px solid rgba(33, 33, 33, 0.6); -moz-box-shadow: 0 0 2px rgba(255, 255, 255, 0.6) inset; -webkit-box-shadow: 0 0 2px rgba(255, 255, 255, 0.6) inset; box-shadow: 0 0 2px rgba(255, 255, 255, 0.6) inset; }\
 #confirmBox h1, #confirmBox p, #confirmBox ul{ font:22px/1 'Cuprum','Lucida Sans Unicode', 'Lucida Grande', sans-serif; background:url('header_bg.jpg') repeat-x left bottom #f5f5f5; padding: 18px 25px; text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.6); color:#666; }\
 #confirmBox h1{ letter-spacing:0.3px; color:#888; }\
 #confirmBox .msg{ background:none; font-size:16px; line-height:1.1; margin:12px; }\
 #confirmBox .center { text-align:center }\
 #confirmBox .left { text-align:left }\
 #confirmBox .right { text-align:right }\
 #confirmBox p{ background:none; font-size:16px; line-height:1.4; padding-top: 35px; }\
 #confirmBox .msg ul li { font-size:16px; line-height:1.0; padding:0px; }\
 #confirmButtons{ padding:15px 0 25px; text-align:center; }\
 #confirmBox .button{ display:inline-block; background:url('buttons.png') no-repeat; color:white; position:relative; height: 33px; font:17px/33px 'Cuprum','Lucida Sans Unicode', 'Lucida Grande', sans-serif; margin-right: 15px; padding: 0 35px 0 40px; text-decoration:none; border:1px solid #888; }\
 #confirmBox .button:last-child{ margin-right:0;}\
 #confirmBox .button span{ position:absolute; top:0; right:-5px; background:url('buttons.png') no-repeat; width:5px; height:33px }\
 #confirmBox .blue{ background-position:left top;text-shadow:1px 1px 0 #5889a2; background-color:#9574d1;}\
 #confirmBox .blue span{ background-position:-195px 0;}\
 #confirmBox .blue:hover{ background-position:left bottom;}\
 #confirmBox .blue:hover span{ background-position:-195px bottom;}\
 #confirmBox .gray{ background-position:-200px top;text-shadow:1px 1px 0 #707070;background-color:#A0A0A0; color:#333}\
 #confirmBox .gray span{ background-position:-395px 0;}\
 #confirmBox .gray:hover{ background-position:-200px bottom;}\
 #confirmBox .gray:hover span{ background-position:-395px bottom;}";
		jQuery('<style>').prop('type','text/css').html(confirmCSS).appendTo('head');
	}


// ---- Selector de Assignee

	jQuery.popupSelect = function(params){

		if(jQuery('#popupselectOverlay').length){
			// A confirm is already shown on the page:
			return false;
		}

		var buttonHTML = '';
		jQuery.each(params.buttons,function(name,obj){
			// Generating the markup for the buttons:
			buttonHTML += '<a href="#" class="button '+obj['class']+'">'+(obj['name']?obj['name']:name)+'<span></span></a>';
			if(!obj.action){
				obj.action = function(){};
			}
		});

		var _cntx = params.content;
		
		var markup = [
			'<div id="popupselectOverlay" class="popupselectOverlay">',
			'<div id="popupselectBox" class="popupselectBox">',
			'<h1>',params.title,'</h1>',
			'<div id="popupselectContent" class="popupselectContent">',
			_cntx,
			'</div>',
			'<div id="popupselectButtons" class="popupselectButtons">',
			buttonHTML,
			'</div></div></div>'
		].join('');

		jQuery(markup).hide().appendTo('body').fadeIn();
		
		if (params.tablesearch != ''){
			jQuery.popupSelect.enabletablesearch(params.tablesearch, params.tablefilter, params.colNm);
		}

		var buttons = jQuery('#popupselectBox .button'),
			i = 0;

		jQuery.each(params.buttons,function(name,obj){
			buttons.eq(i++).click(function(){
				// Calling the action attribute when a
				// click occurs, and hiding the confirm.
				obj.action();
				jQuery.popupSelect.hide();
				return false;
			});
		});
		
		if (params.defaultValues){
			$('#popupselected_val').html(params.defaultValues.id);
			$('#popupselected_text').html(params.defaultValues.name);
			if (params.defaultValues.autoFilterDept){
				// Filter Employees of user dept belong...
				$("#"+params.tablesearch+" tbody tr").css("display", "none");
				$("#"+params.tablesearch+" tbody tr[data-deptid='"+params.defaultValues.dept+"']").css("display", "");
			}
			if(params.defaultValues.xPos){
				$('#popupselectBox').css('left',params.defaultValues.xPos+'%');
			}
			if(params.defaultValues.yPos){
				$('#popupselectBox').css('top',params.defaultValues.yPos+'%');
			}
			if(params.defaultValues.width){
				$('#popupselectBox').css('width',params.defaultValues.width+'px');
			}
		}
		
		jQuery('#popselectsearchinput').focus();
	}
	
	jQuery.popupSelect.hide = function(){
		jQuery('#popupselectOverlay').fadeOut(function(){
			jQuery(this).remove();
		});
	}
	
//---
	
	jQuery.popupSelect.enabletablesearch = function(tbl, tbl2, colNm){
		if (colNm === undefined) colNm = 0;
		// Enable search insensitive
	    $.extend($.expr[":"], {
	      "containsIN": function(elem, i, match, array) {
	        return (elem.textContent || elem.innerText || "").toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
	      }
	      });
	    // ----------------------
		$(".filtertable").on('keyup', function() {
			var tableid = $(this).data('tableid');
			var dptid = $(this).data('filter-dept');
			if (this.value.length < 1) {
				$("#"+tableid+" tbody tr").css("display", "");
				$("#"+tbl2+" tbody tr").removeClass("selected");
			} else {
				$("#"+tbl2+" tbody tr").removeClass("selected");
				$("#"+tableid+" tbody tr:not(:containsIN('"+this.value+"'))").css("display", "none");
				$("#"+tableid+" tbody tr:containsIN('"+this.value+"')").css("display", "");
			}
			if (dptid)
				$("#"+tableid+" tbody tr[data-deptid='"+dptid+'"]').css("display", "");
		});
		// ---------------------- Click on Row Employee List
		$('#'+tbl+" tbody tr").click(function() {
			var empid = $(this).data('empid');
			var empnm = $(this).find('td')[colNm].innerText; //[1].innerHTML;, innerText
			//console.info(empnm);
			$('#popupselected_val').html(empid);
			$('#popupselected_text').html(empnm);
			
			$(this).addClass('selected').siblings().removeClass("selected");
		});
		// ---------------------- Click on Row Deptartment List
		if(tbl2 != '') {
			$('#'+tbl2+" tbody tr").click(function() {
				var dptid = $(this).data('deptid');
				//console.info('clic on depto ',dptid);
				$(this).addClass('selected').siblings().removeClass("selected");
				$('#popselectsearchinput').val('');
				$("#"+tbl+" tbody tr").css("display", "none");
				$("#"+tbl+" tbody tr[data-deptid='"+dptid+"']").css("display", "");
				
			});
		}
	}
	
// --- 
	// var Latinise={};
	// Latinise.latin_map={"Á":"A","Ă":"A","Ắ":"A","Ặ":"A","Ằ":"A","Ẳ":"A","Ẵ":"A","Ǎ":"A","Â":"A","Ấ":"A","Ậ":"A","Ầ":"A","Ẩ":"A","Ẫ":"A","Ä":"A","Ǟ":"A","Ȧ":"A","Ǡ":"A","Ạ":"A","Ȁ":"A","À":"A","Ả":"A","Ȃ":"A","Ā":"A","Ą":"A","Å":"A","Ǻ":"A","Ḁ":"A","Ⱥ":"A","Ã":"A","Ꜳ":"AA","Æ":"AE","Ǽ":"AE","Ǣ":"AE","Ꜵ":"AO","Ꜷ":"AU","Ꜹ":"AV","Ꜻ":"AV","Ꜽ":"AY","Ḃ":"B","Ḅ":"B","Ɓ":"B","Ḇ":"B","Ƀ":"B","Ƃ":"B","Ć":"C","Č":"C","Ç":"C","Ḉ":"C","Ĉ":"C","Ċ":"C","Ƈ":"C","Ȼ":"C","Ď":"D","Ḑ":"D","Ḓ":"D","Ḋ":"D","Ḍ":"D","Ɗ":"D","Ḏ":"D","ǲ":"D","ǅ":"D","Đ":"D","Ƌ":"D","Ǳ":"DZ","Ǆ":"DZ","É":"E","Ĕ":"E","Ě":"E","Ȩ":"E","Ḝ":"E","Ê":"E","Ế":"E","Ệ":"E","Ề":"E","Ể":"E","Ễ":"E","Ḙ":"E","Ë":"E","Ė":"E","Ẹ":"E","Ȅ":"E","È":"E","Ẻ":"E","Ȇ":"E","Ē":"E","Ḗ":"E","Ḕ":"E","Ę":"E","Ɇ":"E","Ẽ":"E","Ḛ":"E","Ꝫ":"ET","Ḟ":"F","Ƒ":"F","Ǵ":"G","Ğ":"G","Ǧ":"G","Ģ":"G","Ĝ":"G","Ġ":"G","Ɠ":"G","Ḡ":"G","Ǥ":"G","Ḫ":"H","Ȟ":"H","Ḩ":"H","Ĥ":"H","Ⱨ":"H","Ḧ":"H","Ḣ":"H","Ḥ":"H","Ħ":"H","Í":"I","Ĭ":"I","Ǐ":"I","Î":"I","Ï":"I","Ḯ":"I","İ":"I","Ị":"I","Ȉ":"I","Ì":"I","Ỉ":"I","Ȋ":"I","Ī":"I","Į":"I","Ɨ":"I","Ĩ":"I","Ḭ":"I","Ꝺ":"D","Ꝼ":"F","Ᵹ":"G","Ꞃ":"R","Ꞅ":"S","Ꞇ":"T","Ꝭ":"IS","Ĵ":"J","Ɉ":"J","Ḱ":"K","Ǩ":"K","Ķ":"K","Ⱪ":"K","Ꝃ":"K","Ḳ":"K","Ƙ":"K","Ḵ":"K","Ꝁ":"K","Ꝅ":"K","Ĺ":"L","Ƚ":"L","Ľ":"L","Ļ":"L","Ḽ":"L","Ḷ":"L","Ḹ":"L","Ⱡ":"L","Ꝉ":"L","Ḻ":"L","Ŀ":"L","Ɫ":"L","ǈ":"L","Ł":"L","Ǉ":"LJ","Ḿ":"M","Ṁ":"M","Ṃ":"M","Ɱ":"M","Ń":"N","Ň":"N","Ņ":"N","Ṋ":"N","Ṅ":"N","Ṇ":"N","Ǹ":"N","Ɲ":"N","Ṉ":"N","Ƞ":"N","ǋ":"N","Ñ":"N","Ǌ":"NJ","Ó":"O","Ŏ":"O","Ǒ":"O","Ô":"O","Ố":"O","Ộ":"O","Ồ":"O","Ổ":"O","Ỗ":"O","Ö":"O","Ȫ":"O","Ȯ":"O","Ȱ":"O","Ọ":"O","Ő":"O","Ȍ":"O","Ò":"O","Ỏ":"O","Ơ":"O","Ớ":"O","Ợ":"O","Ờ":"O","Ở":"O","Ỡ":"O","Ȏ":"O","Ꝋ":"O","Ꝍ":"O","Ō":"O","Ṓ":"O","Ṑ":"O","Ɵ":"O","Ǫ":"O","Ǭ":"O","Ø":"O","Ǿ":"O","Õ":"O","Ṍ":"O","Ṏ":"O","Ȭ":"O","Ƣ":"OI","Ꝏ":"OO","Ɛ":"E","Ɔ":"O","Ȣ":"OU","Ṕ":"P","Ṗ":"P","Ꝓ":"P","Ƥ":"P","Ꝕ":"P","Ᵽ":"P","Ꝑ":"P","Ꝙ":"Q","Ꝗ":"Q","Ŕ":"R","Ř":"R","Ŗ":"R","Ṙ":"R","Ṛ":"R","Ṝ":"R","Ȑ":"R","Ȓ":"R","Ṟ":"R","Ɍ":"R","Ɽ":"R","Ꜿ":"C","Ǝ":"E","Ś":"S","Ṥ":"S","Š":"S","Ṧ":"S","Ş":"S","Ŝ":"S","Ș":"S","Ṡ":"S","Ṣ":"S","Ṩ":"S","Ť":"T","Ţ":"T","Ṱ":"T","Ț":"T","Ⱦ":"T","Ṫ":"T","Ṭ":"T","Ƭ":"T","Ṯ":"T","Ʈ":"T","Ŧ":"T","Ɐ":"A","Ꞁ":"L","Ɯ":"M","Ʌ":"V","Ꜩ":"TZ","Ú":"U","Ŭ":"U","Ǔ":"U","Û":"U","Ṷ":"U","Ü":"U","Ǘ":"U","Ǚ":"U","Ǜ":"U","Ǖ":"U","Ṳ":"U","Ụ":"U","Ű":"U","Ȕ":"U","Ù":"U","Ủ":"U","Ư":"U","Ứ":"U","Ự":"U","Ừ":"U","Ử":"U","Ữ":"U","Ȗ":"U","Ū":"U","Ṻ":"U","Ų":"U","Ů":"U","Ũ":"U","Ṹ":"U","Ṵ":"U","Ꝟ":"V","Ṿ":"V","Ʋ":"V","Ṽ":"V","Ꝡ":"VY","Ẃ":"W","Ŵ":"W","Ẅ":"W","Ẇ":"W","Ẉ":"W","Ẁ":"W","Ⱳ":"W","Ẍ":"X","Ẋ":"X","Ý":"Y","Ŷ":"Y","Ÿ":"Y","Ẏ":"Y","Ỵ":"Y","Ỳ":"Y","Ƴ":"Y","Ỷ":"Y","Ỿ":"Y","Ȳ":"Y","Ɏ":"Y","Ỹ":"Y","Ź":"Z","Ž":"Z","Ẑ":"Z","Ⱬ":"Z","Ż":"Z","Ẓ":"Z","Ȥ":"Z","Ẕ":"Z","Ƶ":"Z","Ĳ":"IJ","Œ":"OE","ᴀ":"A","ᴁ":"AE","ʙ":"B","ᴃ":"B","ᴄ":"C","ᴅ":"D","ᴇ":"E","ꜰ":"F","ɢ":"G","ʛ":"G","ʜ":"H","ɪ":"I","ʁ":"R","ᴊ":"J","ᴋ":"K","ʟ":"L","ᴌ":"L","ᴍ":"M","ɴ":"N","ᴏ":"O","ɶ":"OE","ᴐ":"O","ᴕ":"OU","ᴘ":"P","ʀ":"R","ᴎ":"N","ᴙ":"R","ꜱ":"S","ᴛ":"T","ⱻ":"E","ᴚ":"R","ᴜ":"U","ᴠ":"V","ᴡ":"W","ʏ":"Y","ᴢ":"Z","á":"a","ă":"a","ắ":"a","ặ":"a","ằ":"a","ẳ":"a","ẵ":"a","ǎ":"a","â":"a","ấ":"a","ậ":"a","ầ":"a","ẩ":"a","ẫ":"a","ä":"a","ǟ":"a","ȧ":"a","ǡ":"a","ạ":"a","ȁ":"a","à":"a","ả":"a","ȃ":"a","ā":"a","ą":"a","ᶏ":"a","ẚ":"a","å":"a","ǻ":"a","ḁ":"a","ⱥ":"a","ã":"a","ꜳ":"aa","æ":"ae","ǽ":"ae","ǣ":"ae","ꜵ":"ao","ꜷ":"au","ꜹ":"av","ꜻ":"av","ꜽ":"ay","ḃ":"b","ḅ":"b","ɓ":"b","ḇ":"b","ᵬ":"b","ᶀ":"b","ƀ":"b","ƃ":"b","ɵ":"o","ć":"c","č":"c","ç":"c","ḉ":"c","ĉ":"c","ɕ":"c","ċ":"c","ƈ":"c","ȼ":"c","ď":"d","ḑ":"d","ḓ":"d","ȡ":"d","ḋ":"d","ḍ":"d","ɗ":"d","ᶑ":"d","ḏ":"d","ᵭ":"d","ᶁ":"d","đ":"d","ɖ":"d","ƌ":"d","ı":"i","ȷ":"j","ɟ":"j","ʄ":"j","ǳ":"dz","ǆ":"dz","é":"e","ĕ":"e","ě":"e","ȩ":"e","ḝ":"e","ê":"e","ế":"e","ệ":"e","ề":"e","ể":"e","ễ":"e","ḙ":"e","ë":"e","ė":"e","ẹ":"e","ȅ":"e","è":"e","ẻ":"e","ȇ":"e","ē":"e","ḗ":"e","ḕ":"e","ⱸ":"e","ę":"e","ᶒ":"e","ɇ":"e","ẽ":"e","ḛ":"e","ꝫ":"et","ḟ":"f","ƒ":"f","ᵮ":"f","ᶂ":"f","ǵ":"g","ğ":"g","ǧ":"g","ģ":"g","ĝ":"g","ġ":"g","ɠ":"g","ḡ":"g","ᶃ":"g","ǥ":"g","ḫ":"h","ȟ":"h","ḩ":"h","ĥ":"h","ⱨ":"h","ḧ":"h","ḣ":"h","ḥ":"h","ɦ":"h","ẖ":"h","ħ":"h","ƕ":"hv","í":"i","ĭ":"i","ǐ":"i","î":"i","ï":"i","ḯ":"i","ị":"i","ȉ":"i","ì":"i","ỉ":"i","ȋ":"i","ī":"i","į":"i","ᶖ":"i","ɨ":"i","ĩ":"i","ḭ":"i","ꝺ":"d","ꝼ":"f","ᵹ":"g","ꞃ":"r","ꞅ":"s","ꞇ":"t","ꝭ":"is","ǰ":"j","ĵ":"j","ʝ":"j","ɉ":"j","ḱ":"k","ǩ":"k","ķ":"k","ⱪ":"k","ꝃ":"k","ḳ":"k","ƙ":"k","ḵ":"k","ᶄ":"k","ꝁ":"k","ꝅ":"k","ĺ":"l","ƚ":"l","ɬ":"l","ľ":"l","ļ":"l","ḽ":"l","ȴ":"l","ḷ":"l","ḹ":"l","ⱡ":"l","ꝉ":"l","ḻ":"l","ŀ":"l","ɫ":"l","ᶅ":"l","ɭ":"l","ł":"l","ǉ":"lj","ſ":"s","ẜ":"s","ẛ":"s","ẝ":"s","ḿ":"m","ṁ":"m","ṃ":"m","ɱ":"m","ᵯ":"m","ᶆ":"m","ń":"n","ň":"n","ņ":"n","ṋ":"n","ȵ":"n","ṅ":"n","ṇ":"n","ǹ":"n","ɲ":"n","ṉ":"n","ƞ":"n","ᵰ":"n","ᶇ":"n","ɳ":"n","ñ":"n","ǌ":"nj","ó":"o","ŏ":"o","ǒ":"o","ô":"o","ố":"o","ộ":"o","ồ":"o","ổ":"o","ỗ":"o","ö":"o","ȫ":"o","ȯ":"o","ȱ":"o","ọ":"o","ő":"o","ȍ":"o","ò":"o","ỏ":"o","ơ":"o","ớ":"o","ợ":"o","ờ":"o","ở":"o","ỡ":"o","ȏ":"o","ꝋ":"o","ꝍ":"o","ⱺ":"o","ō":"o","ṓ":"o","ṑ":"o","ǫ":"o","ǭ":"o","ø":"o","ǿ":"o","õ":"o","ṍ":"o","ṏ":"o","ȭ":"o","ƣ":"oi","ꝏ":"oo","ɛ":"e","ᶓ":"e","ɔ":"o","ᶗ":"o","ȣ":"ou","ṕ":"p","ṗ":"p","ꝓ":"p","ƥ":"p","ᵱ":"p","ᶈ":"p","ꝕ":"p","ᵽ":"p","ꝑ":"p","ꝙ":"q","ʠ":"q","ɋ":"q","ꝗ":"q","ŕ":"r","ř":"r","ŗ":"r","ṙ":"r","ṛ":"r","ṝ":"r","ȑ":"r","ɾ":"r","ᵳ":"r","ȓ":"r","ṟ":"r","ɼ":"r","ᵲ":"r","ᶉ":"r","ɍ":"r","ɽ":"r","ↄ":"c","ꜿ":"c","ɘ":"e","ɿ":"r","ś":"s","ṥ":"s","š":"s","ṧ":"s","ş":"s","ŝ":"s","ș":"s","ṡ":"s","ṣ":"s","ṩ":"s","ʂ":"s","ᵴ":"s","ᶊ":"s","ȿ":"s","ɡ":"g","ᴑ":"o","ᴓ":"o","ᴝ":"u","ť":"t","ţ":"t","ṱ":"t","ț":"t","ȶ":"t","ẗ":"t","ⱦ":"t","ṫ":"t","ṭ":"t","ƭ":"t","ṯ":"t","ᵵ":"t","ƫ":"t","ʈ":"t","ŧ":"t","ᵺ":"th","ɐ":"a","ᴂ":"ae","ǝ":"e","ᵷ":"g","ɥ":"h","ʮ":"h","ʯ":"h","ᴉ":"i","ʞ":"k","ꞁ":"l","ɯ":"m","ɰ":"m","ᴔ":"oe","ɹ":"r","ɻ":"r","ɺ":"r","ⱹ":"r","ʇ":"t","ʌ":"v","ʍ":"w","ʎ":"y","ꜩ":"tz","ú":"u","ŭ":"u","ǔ":"u","û":"u","ṷ":"u","ü":"u","ǘ":"u","ǚ":"u","ǜ":"u","ǖ":"u","ṳ":"u","ụ":"u","ű":"u","ȕ":"u","ù":"u","ủ":"u","ư":"u","ứ":"u","ự":"u","ừ":"u","ử":"u","ữ":"u","ȗ":"u","ū":"u","ṻ":"u","ų":"u","ᶙ":"u","ů":"u","ũ":"u","ṹ":"u","ṵ":"u","ᵫ":"ue","ꝸ":"um","ⱴ":"v","ꝟ":"v","ṿ":"v","ʋ":"v","ᶌ":"v","ⱱ":"v","ṽ":"v","ꝡ":"vy","ẃ":"w","ŵ":"w","ẅ":"w","ẇ":"w","ẉ":"w","ẁ":"w","ⱳ":"w","ẘ":"w","ẍ":"x","ẋ":"x","ᶍ":"x","ý":"y","ŷ":"y","ÿ":"y","ẏ":"y","ỵ":"y","ỳ":"y","ƴ":"y","ỷ":"y","ỿ":"y","ȳ":"y","ẙ":"y","ɏ":"y","ỹ":"y","ź":"z","ž":"z","ẑ":"z","ʑ":"z","ⱬ":"z","ż":"z","ẓ":"z","ȥ":"z","ẕ":"z","ᵶ":"z","ᶎ":"z","ʐ":"z","ƶ":"z","ɀ":"z","ﬀ":"ff","ﬃ":"ffi","ﬄ":"ffl","ﬁ":"fi","ﬂ":"fl","ĳ":"ij","œ":"oe","ﬆ":"st","ₐ":"a","ₑ":"e","ᵢ":"i","ⱼ":"j","ₒ":"o","ᵣ":"r","ᵤ":"u","ᵥ":"v","ₓ":"x"};
	// To ensure the above latin_map doesn't get corrupted by copy/pasting or other transformations, use this base64 encoded string, replacing the first line of the above:
	
	var latinbase64map="eyLDgSI6IkEiLCLEgiI6IkEiLCLhuq4iOiJBIiwi4bq2IjoiQSIsIuG6sCI6IkEiLCLhurIiOiJBIiwi4bq0IjoiQSIsIseNIjoiQSIsIsOCIjoiQSIsIuG6pCI6IkEiLCLhuqwiOiJBIiwi4bqmIjoiQSIsIuG6qCI6IkEiLCLhuqoiOiJBIiwiw4QiOiJBIiwix54iOiJBIiwiyKYiOiJBIiwix6AiOiJBIiwi4bqgIjoiQSIsIsiAIjoiQSIsIsOAIjoiQSIsIuG6oiI6IkEiLCLIgiI6IkEiLCLEgCI6IkEiLCLEhCI6IkEiLCLDhSI6IkEiLCLHuiI6IkEiLCLhuIAiOiJBIiwiyLoiOiJBIiwiw4MiOiJBIiwi6pyyIjoiQUEiLCLDhiI6IkFFIiwix7wiOiJBRSIsIseiIjoiQUUiLCLqnLQiOiJBTyIsIuqctiI6IkFVIiwi6py4IjoiQVYiLCLqnLoiOiJBViIsIuqcvCI6IkFZIiwi4biCIjoiQiIsIuG4hCI6IkIiLCLGgSI6IkIiLCLhuIYiOiJCIiwiyYMiOiJCIiwixoIiOiJCIiwixIYiOiJDIiwixIwiOiJDIiwiw4ciOiJDIiwi4biIIjoiQyIsIsSIIjoiQyIsIsSKIjoiQyIsIsaHIjoiQyIsIsi7IjoiQyIsIsSOIjoiRCIsIuG4kCI6IkQiLCLhuJIiOiJEIiwi4biKIjoiRCIsIuG4jCI6IkQiLCLGiiI6IkQiLCLhuI4iOiJEIiwix7IiOiJEIiwix4UiOiJEIiwixJAiOiJEIiwixosiOiJEIiwix7EiOiJEWiIsIseEIjoiRFoiLCLDiSI6IkUiLCLElCI6IkUiLCLEmiI6IkUiLCLIqCI6IkUiLCLhuJwiOiJFIiwiw4oiOiJFIiwi4bq+IjoiRSIsIuG7hiI6IkUiLCLhu4AiOiJFIiwi4buCIjoiRSIsIuG7hCI6IkUiLCLhuJgiOiJFIiwiw4siOiJFIiwixJYiOiJFIiwi4bq4IjoiRSIsIsiEIjoiRSIsIsOIIjoiRSIsIuG6uiI6IkUiLCLIhiI6IkUiLCLEkiI6IkUiLCLhuJYiOiJFIiwi4biUIjoiRSIsIsSYIjoiRSIsIsmGIjoiRSIsIuG6vCI6IkUiLCLhuJoiOiJFIiwi6p2qIjoiRVQiLCLhuJ4iOiJGIiwixpEiOiJGIiwix7QiOiJHIiwixJ4iOiJHIiwix6YiOiJHIiwixKIiOiJHIiwixJwiOiJHIiwixKAiOiJHIiwixpMiOiJHIiwi4bigIjoiRyIsIsekIjoiRyIsIuG4qiI6IkgiLCLIniI6IkgiLCLhuKgiOiJIIiwixKQiOiJIIiwi4rGnIjoiSCIsIuG4piI6IkgiLCLhuKIiOiJIIiwi4bikIjoiSCIsIsSmIjoiSCIsIsONIjoiSSIsIsSsIjoiSSIsIsePIjoiSSIsIsOOIjoiSSIsIsOPIjoiSSIsIuG4riI6IkkiLCLEsCI6IkkiLCLhu4oiOiJJIiwiyIgiOiJJIiwiw4wiOiJJIiwi4buIIjoiSSIsIsiKIjoiSSIsIsSqIjoiSSIsIsSuIjoiSSIsIsaXIjoiSSIsIsSoIjoiSSIsIuG4rCI6IkkiLCLqnbkiOiJEIiwi6p27IjoiRiIsIuqdvSI6IkciLCLqnoIiOiJSIiwi6p6EIjoiUyIsIuqehiI6IlQiLCLqnawiOiJJUyIsIsS0IjoiSiIsIsmIIjoiSiIsIuG4sCI6IksiLCLHqCI6IksiLCLEtiI6IksiLCLisakiOiJLIiwi6p2CIjoiSyIsIuG4siI6IksiLCLGmCI6IksiLCLhuLQiOiJLIiwi6p2AIjoiSyIsIuqdhCI6IksiLCLEuSI6IkwiLCLIvSI6IkwiLCLEvSI6IkwiLCLEuyI6IkwiLCLhuLwiOiJMIiwi4bi2IjoiTCIsIuG4uCI6IkwiLCLisaAiOiJMIiwi6p2IIjoiTCIsIuG4uiI6IkwiLCLEvyI6IkwiLCLisaIiOiJMIiwix4giOiJMIiwixYEiOiJMIiwix4ciOiJMSiIsIuG4viI6Ik0iLCLhuYAiOiJNIiwi4bmCIjoiTSIsIuKxriI6Ik0iLCLFgyI6Ik4iLCLFhyI6Ik4iLCLFhSI6Ik4iLCLhuYoiOiJOIiwi4bmEIjoiTiIsIuG5hiI6Ik4iLCLHuCI6Ik4iLCLGnSI6Ik4iLCLhuYgiOiJOIiwiyKAiOiJOIiwix4siOiJOIiwiw5EiOiJOIiwix4oiOiJOSiIsIsOTIjoiTyIsIsWOIjoiTyIsIseRIjoiTyIsIsOUIjoiTyIsIuG7kCI6Ik8iLCLhu5giOiJPIiwi4buSIjoiTyIsIuG7lCI6Ik8iLCLhu5YiOiJPIiwiw5YiOiJPIiwiyKoiOiJPIiwiyK4iOiJPIiwiyLAiOiJPIiwi4buMIjoiTyIsIsWQIjoiTyIsIsiMIjoiTyIsIsOSIjoiTyIsIuG7jiI6Ik8iLCLGoCI6Ik8iLCLhu5oiOiJPIiwi4buiIjoiTyIsIuG7nCI6Ik8iLCLhu54iOiJPIiwi4bugIjoiTyIsIsiOIjoiTyIsIuqdiiI6Ik8iLCLqnYwiOiJPIiwixYwiOiJPIiwi4bmSIjoiTyIsIuG5kCI6Ik8iLCLGnyI6Ik8iLCLHqiI6Ik8iLCLHrCI6Ik8iLCLDmCI6Ik8iLCLHviI6Ik8iLCLDlSI6Ik8iLCLhuYwiOiJPIiwi4bmOIjoiTyIsIsisIjoiTyIsIsaiIjoiT0kiLCLqnY4iOiJPTyIsIsaQIjoiRSIsIsaGIjoiTyIsIsiiIjoiT1UiLCLhuZQiOiJQIiwi4bmWIjoiUCIsIuqdkiI6IlAiLCLGpCI6IlAiLCLqnZQiOiJQIiwi4rGjIjoiUCIsIuqdkCI6IlAiLCLqnZgiOiJRIiwi6p2WIjoiUSIsIsWUIjoiUiIsIsWYIjoiUiIsIsWWIjoiUiIsIuG5mCI6IlIiLCLhuZoiOiJSIiwi4bmcIjoiUiIsIsiQIjoiUiIsIsiSIjoiUiIsIuG5niI6IlIiLCLJjCI6IlIiLCLisaQiOiJSIiwi6py+IjoiQyIsIsaOIjoiRSIsIsWaIjoiUyIsIuG5pCI6IlMiLCLFoCI6IlMiLCLhuaYiOiJTIiwixZ4iOiJTIiwixZwiOiJTIiwiyJgiOiJTIiwi4bmgIjoiUyIsIuG5oiI6IlMiLCLhuagiOiJTIiwixaQiOiJUIiwixaIiOiJUIiwi4bmwIjoiVCIsIsiaIjoiVCIsIsi+IjoiVCIsIuG5qiI6IlQiLCLhuawiOiJUIiwixqwiOiJUIiwi4bmuIjoiVCIsIsauIjoiVCIsIsWmIjoiVCIsIuKxryI6IkEiLCLqnoAiOiJMIiwixpwiOiJNIiwiyYUiOiJWIiwi6pyoIjoiVFoiLCLDmiI6IlUiLCLFrCI6IlUiLCLHkyI6IlUiLCLDmyI6IlUiLCLhubYiOiJVIiwiw5wiOiJVIiwix5ciOiJVIiwix5kiOiJVIiwix5siOiJVIiwix5UiOiJVIiwi4bmyIjoiVSIsIuG7pCI6IlUiLCLFsCI6IlUiLCLIlCI6IlUiLCLDmSI6IlUiLCLhu6YiOiJVIiwixq8iOiJVIiwi4buoIjoiVSIsIuG7sCI6IlUiLCLhu6oiOiJVIiwi4busIjoiVSIsIuG7riI6IlUiLCLIliI6IlUiLCLFqiI6IlUiLCLhuboiOiJVIiwixbIiOiJVIiwixa4iOiJVIiwixagiOiJVIiwi4bm4IjoiVSIsIuG5tCI6IlUiLCLqnZ4iOiJWIiwi4bm+IjoiViIsIsayIjoiViIsIuG5vCI6IlYiLCLqnaAiOiJWWSIsIuG6giI6IlciLCLFtCI6IlciLCLhuoQiOiJXIiwi4bqGIjoiVyIsIuG6iCI6IlciLCLhuoAiOiJXIiwi4rGyIjoiVyIsIuG6jCI6IlgiLCLhuooiOiJYIiwiw50iOiJZIiwixbYiOiJZIiwixbgiOiJZIiwi4bqOIjoiWSIsIuG7tCI6IlkiLCLhu7IiOiJZIiwixrMiOiJZIiwi4bu2IjoiWSIsIuG7viI6IlkiLCLIsiI6IlkiLCLJjiI6IlkiLCLhu7giOiJZIiwixbkiOiJaIiwixb0iOiJaIiwi4bqQIjoiWiIsIuKxqyI6IloiLCLFuyI6IloiLCLhupIiOiJaIiwiyKQiOiJaIiwi4bqUIjoiWiIsIsa1IjoiWiIsIsSyIjoiSUoiLCLFkiI6Ik9FIiwi4bSAIjoiQSIsIuG0gSI6IkFFIiwiypkiOiJCIiwi4bSDIjoiQiIsIuG0hCI6IkMiLCLhtIUiOiJEIiwi4bSHIjoiRSIsIuqcsCI6IkYiLCLJoiI6IkciLCLKmyI6IkciLCLKnCI6IkgiLCLJqiI6IkkiLCLKgSI6IlIiLCLhtIoiOiJKIiwi4bSLIjoiSyIsIsqfIjoiTCIsIuG0jCI6IkwiLCLhtI0iOiJNIiwiybQiOiJOIiwi4bSPIjoiTyIsIsm2IjoiT0UiLCLhtJAiOiJPIiwi4bSVIjoiT1UiLCLhtJgiOiJQIiwiyoAiOiJSIiwi4bSOIjoiTiIsIuG0mSI6IlIiLCLqnLEiOiJTIiwi4bSbIjoiVCIsIuKxuyI6IkUiLCLhtJoiOiJSIiwi4bScIjoiVSIsIuG0oCI6IlYiLCLhtKEiOiJXIiwiyo8iOiJZIiwi4bSiIjoiWiIsIsOhIjoiYSIsIsSDIjoiYSIsIuG6ryI6ImEiLCLhurciOiJhIiwi4bqxIjoiYSIsIuG6syI6ImEiLCLhurUiOiJhIiwix44iOiJhIiwiw6IiOiJhIiwi4bqlIjoiYSIsIuG6rSI6ImEiLCLhuqciOiJhIiwi4bqpIjoiYSIsIuG6qyI6ImEiLCLDpCI6ImEiLCLHnyI6ImEiLCLIpyI6ImEiLCLHoSI6ImEiLCLhuqEiOiJhIiwiyIEiOiJhIiwiw6AiOiJhIiwi4bqjIjoiYSIsIsiDIjoiYSIsIsSBIjoiYSIsIsSFIjoiYSIsIuG2jyI6ImEiLCLhupoiOiJhIiwiw6UiOiJhIiwix7siOiJhIiwi4biBIjoiYSIsIuKxpSI6ImEiLCLDoyI6ImEiLCLqnLMiOiJhYSIsIsOmIjoiYWUiLCLHvSI6ImFlIiwix6MiOiJhZSIsIuqctSI6ImFvIiwi6py3IjoiYXUiLCLqnLkiOiJhdiIsIuqcuyI6ImF2Iiwi6py9IjoiYXkiLCLhuIMiOiJiIiwi4biFIjoiYiIsIsmTIjoiYiIsIuG4hyI6ImIiLCLhtawiOiJiIiwi4baAIjoiYiIsIsaAIjoiYiIsIsaDIjoiYiIsIsm1IjoibyIsIsSHIjoiYyIsIsSNIjoiYyIsIsOnIjoiYyIsIuG4iSI6ImMiLCLEiSI6ImMiLCLJlSI6ImMiLCLEiyI6ImMiLCLGiCI6ImMiLCLIvCI6ImMiLCLEjyI6ImQiLCLhuJEiOiJkIiwi4biTIjoiZCIsIsihIjoiZCIsIuG4iyI6ImQiLCLhuI0iOiJkIiwiyZciOiJkIiwi4baRIjoiZCIsIuG4jyI6ImQiLCLhta0iOiJkIiwi4baBIjoiZCIsIsSRIjoiZCIsIsmWIjoiZCIsIsaMIjoiZCIsIsSxIjoiaSIsIsi3IjoiaiIsIsmfIjoiaiIsIsqEIjoiaiIsIsezIjoiZHoiLCLHhiI6ImR6Iiwiw6kiOiJlIiwixJUiOiJlIiwixJsiOiJlIiwiyKkiOiJlIiwi4bidIjoiZSIsIsOqIjoiZSIsIuG6vyI6ImUiLCLhu4ciOiJlIiwi4buBIjoiZSIsIuG7gyI6ImUiLCLhu4UiOiJlIiwi4biZIjoiZSIsIsOrIjoiZSIsIsSXIjoiZSIsIuG6uSI6ImUiLCLIhSI6ImUiLCLDqCI6ImUiLCLhursiOiJlIiwiyIciOiJlIiwixJMiOiJlIiwi4biXIjoiZSIsIuG4lSI6ImUiLCLisbgiOiJlIiwixJkiOiJlIiwi4baSIjoiZSIsIsmHIjoiZSIsIuG6vSI6ImUiLCLhuJsiOiJlIiwi6p2rIjoiZXQiLCLhuJ8iOiJmIiwixpIiOiJmIiwi4bWuIjoiZiIsIuG2giI6ImYiLCLHtSI6ImciLCLEnyI6ImciLCLHpyI6ImciLCLEoyI6ImciLCLEnSI6ImciLCLEoSI6ImciLCLJoCI6ImciLCLhuKEiOiJnIiwi4baDIjoiZyIsIselIjoiZyIsIuG4qyI6ImgiLCLInyI6ImgiLCLhuKkiOiJoIiwixKUiOiJoIiwi4rGoIjoiaCIsIuG4pyI6ImgiLCLhuKMiOiJoIiwi4bilIjoiaCIsIsmmIjoiaCIsIuG6liI6ImgiLCLEpyI6ImgiLCLGlSI6Imh2Iiwiw60iOiJpIiwixK0iOiJpIiwix5AiOiJpIiwiw64iOiJpIiwiw68iOiJpIiwi4bivIjoiaSIsIuG7iyI6ImkiLCLIiSI6ImkiLCLDrCI6ImkiLCLhu4kiOiJpIiwiyIsiOiJpIiwixKsiOiJpIiwixK8iOiJpIiwi4baWIjoiaSIsIsmoIjoiaSIsIsSpIjoiaSIsIuG4rSI6ImkiLCLqnboiOiJkIiwi6p28IjoiZiIsIuG1uSI6ImciLCLqnoMiOiJyIiwi6p6FIjoicyIsIuqehyI6InQiLCLqna0iOiJpcyIsIsewIjoiaiIsIsS1IjoiaiIsIsqdIjoiaiIsIsmJIjoiaiIsIuG4sSI6ImsiLCLHqSI6ImsiLCLEtyI6ImsiLCLisaoiOiJrIiwi6p2DIjoiayIsIuG4syI6ImsiLCLGmSI6ImsiLCLhuLUiOiJrIiwi4baEIjoiayIsIuqdgSI6ImsiLCLqnYUiOiJrIiwixLoiOiJsIiwixpoiOiJsIiwiyawiOiJsIiwixL4iOiJsIiwixLwiOiJsIiwi4bi9IjoibCIsIsi0IjoibCIsIuG4tyI6ImwiLCLhuLkiOiJsIiwi4rGhIjoibCIsIuqdiSI6ImwiLCLhuLsiOiJsIiwixYAiOiJsIiwiyasiOiJsIiwi4baFIjoibCIsIsmtIjoibCIsIsWCIjoibCIsIseJIjoibGoiLCLFvyI6InMiLCLhupwiOiJzIiwi4bqbIjoicyIsIuG6nSI6InMiLCLhuL8iOiJtIiwi4bmBIjoibSIsIuG5gyI6Im0iLCLJsSI6Im0iLCLhta8iOiJtIiwi4baGIjoibSIsIsWEIjoibiIsIsWIIjoibiIsIsWGIjoibiIsIuG5iyI6Im4iLCLItSI6Im4iLCLhuYUiOiJuIiwi4bmHIjoibiIsIse5IjoibiIsIsmyIjoibiIsIuG5iSI6Im4iLCLGniI6Im4iLCLhtbAiOiJuIiwi4baHIjoibiIsIsmzIjoibiIsIsOxIjoibiIsIseMIjoibmoiLCLDsyI6Im8iLCLFjyI6Im8iLCLHkiI6Im8iLCLDtCI6Im8iLCLhu5EiOiJvIiwi4buZIjoibyIsIuG7kyI6Im8iLCLhu5UiOiJvIiwi4buXIjoibyIsIsO2IjoibyIsIsirIjoibyIsIsivIjoibyIsIsixIjoibyIsIuG7jSI6Im8iLCLFkSI6Im8iLCLIjSI6Im8iLCLDsiI6Im8iLCLhu48iOiJvIiwixqEiOiJvIiwi4bubIjoibyIsIuG7oyI6Im8iLCLhu50iOiJvIiwi4bufIjoibyIsIuG7oSI6Im8iLCLIjyI6Im8iLCLqnYsiOiJvIiwi6p2NIjoibyIsIuKxuiI6Im8iLCLFjSI6Im8iLCLhuZMiOiJvIiwi4bmRIjoibyIsIserIjoibyIsIsetIjoibyIsIsO4IjoibyIsIse/IjoibyIsIsO1IjoibyIsIuG5jSI6Im8iLCLhuY8iOiJvIiwiyK0iOiJvIiwixqMiOiJvaSIsIuqdjyI6Im9vIiwiyZsiOiJlIiwi4baTIjoiZSIsIsmUIjoibyIsIuG2lyI6Im8iLCLIoyI6Im91Iiwi4bmVIjoicCIsIuG5lyI6InAiLCLqnZMiOiJwIiwixqUiOiJwIiwi4bWxIjoicCIsIuG2iCI6InAiLCLqnZUiOiJwIiwi4bW9IjoicCIsIuqdkSI6InAiLCLqnZkiOiJxIiwiyqAiOiJxIiwiyYsiOiJxIiwi6p2XIjoicSIsIsWVIjoiciIsIsWZIjoiciIsIsWXIjoiciIsIuG5mSI6InIiLCLhuZsiOiJyIiwi4bmdIjoiciIsIsiRIjoiciIsIsm+IjoiciIsIuG1syI6InIiLCLIkyI6InIiLCLhuZ8iOiJyIiwiybwiOiJyIiwi4bWyIjoiciIsIuG2iSI6InIiLCLJjSI6InIiLCLJvSI6InIiLCLihoQiOiJjIiwi6py/IjoiYyIsIsmYIjoiZSIsIsm/IjoiciIsIsWbIjoicyIsIuG5pSI6InMiLCLFoSI6InMiLCLhuaciOiJzIiwixZ8iOiJzIiwixZ0iOiJzIiwiyJkiOiJzIiwi4bmhIjoicyIsIuG5oyI6InMiLCLhuakiOiJzIiwiyoIiOiJzIiwi4bW0IjoicyIsIuG2iiI6InMiLCLIvyI6InMiLCLJoSI6ImciLCLhtJEiOiJvIiwi4bSTIjoibyIsIuG0nSI6InUiLCLFpSI6InQiLCLFoyI6InQiLCLhubEiOiJ0IiwiyJsiOiJ0IiwiyLYiOiJ0Iiwi4bqXIjoidCIsIuKxpiI6InQiLCLhuasiOiJ0Iiwi4bmtIjoidCIsIsatIjoidCIsIuG5ryI6InQiLCLhtbUiOiJ0IiwixqsiOiJ0IiwiyogiOiJ0IiwixaciOiJ0Iiwi4bW6IjoidGgiLCLJkCI6ImEiLCLhtIIiOiJhZSIsIsedIjoiZSIsIuG1tyI6ImciLCLJpSI6ImgiLCLKriI6ImgiLCLKryI6ImgiLCLhtIkiOiJpIiwiyp4iOiJrIiwi6p6BIjoibCIsIsmvIjoibSIsIsmwIjoibSIsIuG0lCI6Im9lIiwiybkiOiJyIiwiybsiOiJyIiwiyboiOiJyIiwi4rG5IjoiciIsIsqHIjoidCIsIsqMIjoidiIsIsqNIjoidyIsIsqOIjoieSIsIuqcqSI6InR6Iiwiw7oiOiJ1Iiwixa0iOiJ1Iiwix5QiOiJ1Iiwiw7siOiJ1Iiwi4bm3IjoidSIsIsO8IjoidSIsIseYIjoidSIsIseaIjoidSIsIsecIjoidSIsIseWIjoidSIsIuG5syI6InUiLCLhu6UiOiJ1IiwixbEiOiJ1IiwiyJUiOiJ1Iiwiw7kiOiJ1Iiwi4bunIjoidSIsIsawIjoidSIsIuG7qSI6InUiLCLhu7EiOiJ1Iiwi4burIjoidSIsIuG7rSI6InUiLCLhu68iOiJ1IiwiyJciOiJ1IiwixasiOiJ1Iiwi4bm7IjoidSIsIsWzIjoidSIsIuG2mSI6InUiLCLFryI6InUiLCLFqSI6InUiLCLhubkiOiJ1Iiwi4bm1IjoidSIsIuG1qyI6InVlIiwi6p24IjoidW0iLCLisbQiOiJ2Iiwi6p2fIjoidiIsIuG5vyI6InYiLCLKiyI6InYiLCLhtowiOiJ2Iiwi4rGxIjoidiIsIuG5vSI6InYiLCLqnaEiOiJ2eSIsIuG6gyI6InciLCLFtSI6InciLCLhuoUiOiJ3Iiwi4bqHIjoidyIsIuG6iSI6InciLCLhuoEiOiJ3Iiwi4rGzIjoidyIsIuG6mCI6InciLCLhuo0iOiJ4Iiwi4bqLIjoieCIsIuG2jSI6IngiLCLDvSI6InkiLCLFtyI6InkiLCLDvyI6InkiLCLhuo8iOiJ5Iiwi4bu1IjoieSIsIuG7syI6InkiLCLGtCI6InkiLCLhu7ciOiJ5Iiwi4bu/IjoieSIsIsizIjoieSIsIuG6mSI6InkiLCLJjyI6InkiLCLhu7kiOiJ5IiwixboiOiJ6Iiwixb4iOiJ6Iiwi4bqRIjoieiIsIsqRIjoieiIsIuKxrCI6InoiLCLFvCI6InoiLCLhupMiOiJ6IiwiyKUiOiJ6Iiwi4bqVIjoieiIsIuG1tiI6InoiLCLhto4iOiJ6IiwiypAiOiJ6IiwixrYiOiJ6IiwiyYAiOiJ6Iiwi76yAIjoiZmYiLCLvrIMiOiJmZmkiLCLvrIQiOiJmZmwiLCLvrIEiOiJmaSIsIu+sgiI6ImZsIiwixLMiOiJpaiIsIsWTIjoib2UiLCLvrIYiOiJzdCIsIuKCkCI6ImEiLCLigpEiOiJlIiwi4bWiIjoiaSIsIuKxvCI6ImoiLCLigpIiOiJvIiwi4bWjIjoiciIsIuG1pCI6InUiLCLhtaUiOiJ2Iiwi4oKTIjoieCJ9";
	var Latinise={};
	Latinise.latin_map=JSON.parse(decodeURIComponent(escape(atob(latinbase64map))));
	String.prototype.latinise=function(){return this.replace(/[^A-Za-z0-9\[\] ]/g,function(a){return Latinise.latin_map[a]||a})};
	String.prototype.latinize=String.prototype.latinise;
	String.prototype.isLatin=function(){return this==this.latinise()}
	
	accentsTidy = function(s){
        var r=s.toLowerCase();
        r = r.replace(new RegExp("\\s", 'g'),"");
        r = r.replace(new RegExp("[àáâãäå]", 'g'),"a");
        r = r.replace(new RegExp("æ", 'g'),"ae");
        r = r.replace(new RegExp("ç", 'g'),"c");
        r = r.replace(new RegExp("[èéêë]", 'g'),"e");
        r = r.replace(new RegExp("[ìíîï]", 'g'),"i");
        r = r.replace(new RegExp("ñ", 'g'),"n");                            
        r = r.replace(new RegExp("[òóôõö]", 'g'),"o");
        r = r.replace(new RegExp("œ", 'g'),"oe");
        r = r.replace(new RegExp("[ùúûü]", 'g'),"u");
        r = r.replace(new RegExp("[ýÿ]", 'g'),"y");
        r = r.replace(new RegExp("\\W", 'g'),"");
        return r;
	};
	
// ---
	
	WF_currFFZoom = 1;
    WF_currIEZoom = 100;
    WF_currDocWidth = 0;

    WF_Zoom = function(action){
        
        function Zplus(){
            //alert('sad');
                var step = 0.02;
                WF_currFFZoom += step;
                $('body').css('MozTransform','scale(' + WF_currFFZoom + ')');
                var stepie = 2;
                WF_currIEZoom += stepie;
                $('body').css('zoom', ' ' + WF_currIEZoom + '%');

        }
        
        function Zminus(){
            //alert('sad');
                var step = 0.02;
                WF_currFFZoom -= step;
                $('body').css('MozTransform','scale(' +WF_currFFZoom + ')');
                var stepie = 2;
                WF_currIEZoom -= stepie;
                $('body').css('zoom', ' ' + WF_currIEZoom + '%');
        }
        
        function Zautofit(){
        	var wh = $(window).height();   // returns height of browser viewport
        	var ww = $(window).width();   // returns width of browser viewport
        	var dh = $(document).height(); // returns height of HTML document (same as pageHeight in screenshot)
        	var dw = $(document).width(); // returns width of HTML document (same as pageWidth in screenshot)
        	// For screen size you can use the screen object in the following way:
        	var sh = screen.height;
        	var sw = screen.width;
        	
        	// By Default apply auto fit with screen size
        	var delta = (dw / sw) -1;
        	delta = (WF_currDocWidth / ww) -1;
        	console.info('delta',delta);
        	
        	WF_currFFZoom = 1 - delta;
            WF_currIEZoom = 100 - (delta * 100);
            $('body').css('MozTransform','scale(' + WF_currFFZoom + ')');
            $('body').css('zoom', ' ' + WF_currIEZoom + '%');
        }
        
        function ZautofitW(){
        	var wh = $(window).height();   // returns height of browser viewport
        	var ww = $(window).width();   // returns width of browser viewport
        	var dh = $(document).height(); // returns height of HTML document (same as pageHeight in screenshot)
        	var dw = $(document).width(); // returns width of HTML document (same as pageWidth in screenshot)
        	// For screen size you can use the screen object in the following way:
        	var sh = screen.height;
        	var sw = screen.width;
        	
        	// By Default apply auto fit with screen size
        	var delta = (dw / ww) -1;
        	delta = (WF_currDocWidth / ww) -1;
        	console.info('delta',delta);
        	
        	WF_currFFZoom = 1 - delta;
            WF_currIEZoom = 100 - (delta * 100);
            $('body').css('MozTransform','scale(' + WF_currFFZoom + ')');
            $('body').css('zoom', ' ' + WF_currIEZoom + '%');
        }
        
        function Zreset(){
        	WF_currFFZoom = 1;
            WF_currIEZoom = 100;
            $('body').css('MozTransform','scale(' + WF_currFFZoom + ')');
            $('body').css('zoom', ' ' + WF_currIEZoom + '%');
        }
        
        if(!WF_currDocWidth) 
        	WF_currDocWidth = $(document).width();
        
        switch (action) {
        case 'plus':
        	Zplus();
        	break;
        case 'minus':
        	 Zminus();
        	break;
        case 'fit':
        	Zautofit();
        	break;
        case 'fitw':
        	ZautofitW();
        	break;
        case 'reset':
        	Zreset();
        	break;
        default:
        	
        	break;
        }
        return true;
    }
    
    
    /*
     * Based on https://datatables.net/examples/plug-ins/dom_sort
     * 
     * Initialise the table with the required column ordering data types
     * $(document).ready(function() {
     *   $('#example').DataTable( {
     *    "columns": [
     *        null,
     *        { "orderDataType": "dom-text-numeric" },
     *        { "orderDataType": "dom-text", type: 'string' },
     *        { "orderDataType": "dom-select" }
     *        { "orderDataType": "sort_tranid" } --- created to SALESORDER tables...
     *     ]
     *   });
	 * });
     */
    window.leirags_js_debug = [];
    
    function leirags_datatable_dom_sort_special() {
	    // How we can user Sort Option in the DataTable when include html elements
	    //--- console.log('leirags_datatable_dom_sort_special');
	    /* Create an array with the values of all the input boxes in a column */
	    $.fn.dataTable.ext.order['dom-text'] = function  ( settings, col )
	    {
	        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
	            return $('input', td).val()
	        })
	    }
	     
	    /* Create an array with the values of all the input boxes in a column, parsed as numbers */
	    $.fn.dataTable.ext.order['dom-text-numeric'] = function  ( settings, col )
	    {
	        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
	            return $('input', td).val() * 1
	        })
	    }
	     
	    /* Create an array with the values of all the select options in a column */
	    $.fn.dataTable.ext.order['dom-select'] = function  ( settings, col )
	    {
	        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
	            return $('select', td).val()
	        })
	    }
	     
	    /* Create an array with the values of all the checkboxes in a column */
	    $.fn.dataTable.ext.order['dom-checkbox'] = function  ( settings, col )
	    {
	        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
	            return $('input', td).prop('checked') ? '1' : '0'
	        })
	    }
	    
	    /* 
	     * LeirAGS@hotmail.com > Create an array with the values of all SalesOrder *
	     * --------- --------- --------- --------- --------- --------- --------- --------- --------- --------- ---------
	     * 
	     * 
	     * <td align="middle" class="styleToId" style="vertical-align: middle;">
	     * 	<div style="padding: 3px; width: 100%; background: rgb(238, 238, 238);" onmouseover="this.style.background='#DDD';" onmouseout="this.style.background='#EEE';" onclick="window.open('/app/accounting/transactions/salesord.nl?id=432237&amp;whence=', '_blank'); return false">
	     * 		<span style="font-size:9px; float:left; width:32px; color:#EEE; background-color:#999">1</span>
	     * 			<img src="/core/media/media.nl?id=6521300&amp;c=3461650&amp;h=58f8ca4c67fada1f48d0" style="margin:3px; padding:3px; border:1px solid #CCC;">
	     * 			<br>
	     * 		<span class="sort_tranid" style="font-size:11px;">SO-1-2409</span>
	     * 	</div>
	     * </td>
	     * 
	     */
	    $.fn.dataTable.ext.order['dom-sort_tranid'] = function  ( settings, col )
	    {   
	        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
	            return $('.sort_tranid', td).innerText()
	        })
	    }
	   
	    /*
	     * <td class="styleToEntity" title="75401 vs 75401" style="background-color: rgba(201,114,98,0.7); text-decoration: through;">
	     *   <input type="hidden" value="75401" id="selectAsignee362" onchange="changeSelectAsignee.call(this)">
	     *   <input class="employeeSelectFly" type="text" value="García, Ariel " onclick="selectassignee(this)" data-onchg="selectAsignee362">
	     * </td>
	     * 
	     */
	    $.fn.dataTable.ext.order['dom-sort-emp'] = function  ( settings, col )
	    {   
	        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
	        	return $('input.employeeSelectFly', td).val()
	        })
	    }
	    
	    /*
	     * <td>
	     *   NetSuiteStringDate
	     * </td>
	     * 
	     */
	    $.fn.dataTable.ext.order['dom-netsuite-date'] = function  ( settings, col )
	    {   
	        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
	        	var nd = LeirAGS_NS_Utils.StrNSDateToDate( $(td).text() );
	        	return nd.getTime()
	        })
	    }
	    
    }
    
    // --------------
    //...
    //..
    //.
    
    
    (function CustomSelect($){
    	$.fn.CustomSelect = function(cls){
    		if(typeof cls === "undefined")  cls="";
    		$(this).css("display", "none")
    		var selector = this,
    		options = $("option", $(this)),
    		tplOuter = "<div class='CustomSelect-Dropdown "+cls+"'><div class='CustomerSelect-Container'></div></div>",
    		tplInner = "<div class='CustomSelect-Option "+cls+"' data-id='{id}' data-value='{value}'>{text}</div>",
    		outer = $(tplOuter),
    		selectedValue;
    		for(var i = 0; i < options.length; i++){
    			var opt = options[i];
    			var inner = $(tplInner
    				.replace("{value}", $(opt).val())
    				.replace("{text}", $(opt).text())
    				.replace("{id}", i)
    			)
    			$(inner).click(function(){
    				$(selector).val($(this).data("value")).attr("data-value", $(this).data("value"))
    				var height = ($(this).data("id")*1.12)
    				$(".CustomerSelect-Container").css("margin-top", -height+"em").data("offset", -height+"em")
    				$(window).unbind("keydown")
    			})
    			$(".CustomerSelect-Container", outer).append(inner)
    			if(opt.hasAttribute("selected")) selectedValue = inner
    		}
    		$(outer).click(function(){
    			$(this).toggleClass("Open")
    			if($(this).hasClass("Open"))
    			{
    				$(".CustomerSelect-Container").css("margin-top", "1em")
    				$(".CustomSelect-Option[data-value="+$("option:selected", selector).val()+"]").addClass("Selected")
    			}else{
    				$(".CustomSelect-Option.Selected", outer).removeClass("Selected")
    				$(".CustomerSelect-Container").css("margin-top", $(".CustomerSelect-Container").data("offset"))
    			}
    		});
    		
    		function proccessQue(que, counter){
    			var counter = (typeof counter === "undefined"? 0 : counter),
    			selectedOptions = [], options = $(".CustomSelect-Option", outer);
    			for(var i = 0; i < options.length; i++){
    				var txt = $(options[i]).text();
    				if(txt.toLowerCase().substr(0, que.length) === que.toLowerCase())
    					selectedOptions.push(options[i])
    			}
    			return selectedOptions
    		}
    		
    		$(outer).click(function(e){
    			var que = "";
    			var interval;
    			$(window).keydown(function(e){
    				if( (event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 65 && event.keyCode <= 90)){
    					clearTimeout(interval);
    					que += String.fromCharCode(e.which);
    					interval = setTimeout(function(){ 
    						var elms = proccessQue(que); 
    						var options = $(".CustomSelect-Option.Selected", outer).removeClass("Selected");
    						$(elms[0]).addClass("Selected");
    						$(selector).val($(elms[0]).data("value"));
    						que = "";
    					}, 150); 
    				}else if(e.which === 38){
    					var itm = $(".CustomSelect-Option.Selected", outer);
    					var prv = $(itm).prev();
    					if(prv.length > 0){
    						$(itm).removeClass("Selected")
    						$(prv).addClass("Selected")
    					}
    				}else if(e.which === 40){
    					var itm = $(".CustomSelect-Option.Selected", outer);
    					var nxt = $(itm).next();
    					if(nxt.length > 0){
    						$(itm).removeClass("Selected")
    						$(nxt).addClass("Selected")
    					}
    				}else if(e.which === 13){
    					var itm = $(".CustomSelect-Option.Selected", outer);
    					$(selector).val($(itm).attr("data-value")).attr($(itm).attr("data-value"));
    					var height = ($(itm).data("id")*1.12);
    					$(".CustomerSelect-Container").css("margin-top", -height+"em").data("offset", -height+"em")
    					$(outer).toggleClass("Open")
    					$(itm).removeClass("Selected")
    					$(window).unbind("keydown")
    				}
    			})
    			e.preventDefault()
    			return false
    		});
    		
    		$(document).click(function(e){
    			console.log(outer, $(outer).hasClass("Open"));
    			if($(outer).hasClass("Open")){
    				var itm = $(".CustomSelect-Option.Selected", outer);
    				var height = ($(itm).data("id")*1.12);
    				$(".CustomerSelect-Container").css("margin-top", -height+"em").data("offset", -height+"em");
    				$(outer).toggleClass("Open");
    				$(window).unbind("keydown");
    			}
    		})
    		$(this).after(outer)
    		if(typeof selectedValue !== "undefined"){
    			var height = ($(selectedValue).data("id")*1.12);
    			console.log(height)
    			$(".CustomerSelect-Container").css("margin-top", -height+"em").data("offset", -height+"em")
    		}
    	}
    })(jQuery);
    
    
    //...
    
    
 // Simple JQuery Draggable Plugin
 // https://plus.google.com/108949996304093815163/about
 // Usage: $(selector).drags();
 // Options:
 // handle            => your dragging handle.
//                       If not defined, then the whole body of the
//                       selected element will be draggable
 // cursor            => define your draggable element cursor type
 // draggableClass    => define the draggable class
 // activeHandleClass => define the active handle class
 //
 // Update: 26 February 2013
 // 1. Move the `z-index` manipulation from the plugin to CSS declaration
 // 2. Fix the laggy effect, because at the first time I made this plugin,
//     I just use the `draggable` class that's added to the element
//     when the element is clicked to select the current draggable element. (Sorry about my bad English!)
 // 3. Move the `draggable` and `active-handle` class as a part of the plugin option
 // Next update?? NEVER!!! Should create a similar plugin that is not called `simple`!

 (function($) {
     $.fn.LeirAGS_drags = function(opt) {

         opt = $.extend({
             handle: "",
             cursor: "move",
             draggableClass: "draggable",
             activeHandleClass: "active-handle"
         }, opt);
         var $selected = null, $elements = (opt.handle === "") ? this : this.find(opt.handle);
         $elements.css('cursor', opt.cursor).on("mousedown", function(e) {
             if(opt.handle === "") {
                 $selected = $(this)
                 $selected.addClass(opt.draggableClass)
             } else {
                 $selected = $(this).parent()
                 $selected.addClass(opt.draggableClass).find(opt.handle).addClass(opt.activeHandleClass)
             }
             var drg_h = $selected.outerHeight(),
                 drg_w = $selected.outerWidth(),
                 pos_y = $selected.offset().top + drg_h - e.pageY,
                 pos_x = $selected.offset().left + drg_w - e.pageX;
             $(document).on("mousemove", function(e) {
                 $selected.offset({
                     top: e.pageY + pos_y - drg_h,
                     left: e.pageX + pos_x - drg_w
                 });
             }).on("mouseup", function() {
                 $(this).off("mousemove"); // Unbind events from document
                 if ($selected !== null) {
                     $selected.removeClass(opt.draggableClass);
                     $selected = null;
                 }
             });
             e.preventDefault(); // disable selection
         }).on("mouseup", function() {
             if(opt.handle === "") {
                 $selected.removeClass(opt.draggableClass)
             } else {
                 $selected.removeClass(opt.draggableClass)
                     .find(opt.handle).removeClass(opt.activeHandleClass)
             }
             $selected = null
         });
         return this
     };
 })(jQuery);
 
 
 //---- 2017-March-9 11:35PM
 
 /*

 CollapsibleLists.js

 An object allowing lists to dynamically expand and collapse

 Created by Stephen Morley - http://code.stephenmorley.org/ - and released under
 the terms of the CC0 1.0 Universal legal code:

 http://creativecommons.org/publicdomain/zero/1.0/legalcode

 */

 const LeirAGSCollapsibleLists = (function(){
   var callbacks = { onOpen:undefined, onClose:undefined };
   // Makes all lists with the class 'collapsibleList' collapsible. The
   // parameter is:
   //
   // doNotRecurse - true if sub-lists should not be made collapsible
   function apply(doNotRecurse){
     [].forEach.call(document.getElementsByTagName('ul'), node => {
       if (node.classList.contains('collapsibleList')){
         applyTo(node, true);
         if (!doNotRecurse){
           [].forEach.call(node.getElementsByTagName('ul'), subnode => {
             subnode.classList.add('collapsibleList')
           });
         }
       }
     })
   }
   // Enclousure to applyTo by LeirAGS Develop
   function applyTwo(node, onopen, onclose, doNotRecurse){
	   applyTo(node, doNotRecurse);
	   if(typeof onopen === 'function') callbacks.onOpen = onopen;
	   if(typeof onclose === 'function') callbacks.onClose = onclose;
   }
   // Makes the specified list collapsible. The parameters are:
   //
   // node         - the list element
   // doNotRecurse - true if sub-lists should not be made collapsible
   function applyTo(node, doNotRecurse){
     [].forEach.call(node.getElementsByTagName('li'), li => {
       if (!doNotRecurse || node === li.parentNode){
         li.style.userSelect       = 'none';
         li.style.MozUserSelect    = 'none';
         li.style.msUserSelect     = 'none';
         li.style.WebkitUserSelect = 'none';
         li.addEventListener('click', handleClick.bind(null, li));
         toggle(li);
       }
     });
   }
   // Handles a click. The parameter is:
   //
   // node - the node for which clicks are being handled
   function handleClick(node, e){
     let li = e.target;
     while (li.nodeName !== 'LI'){
       li = li.parentNode;
     }
     if (li === node){
       toggle(node);
     }
   }
   // Opens or closes the unordered list elements directly within the
   // specified node. The parameter is:
   //
   // node - the node containing the unordered list elements
   function toggle(node){
     //console.info('node',node)
     const open = node.classList.contains('collapsibleListClosed');
     const uls  = node.getElementsByTagName('ul');
     if(open){
    	 if(typeof callbacks.onOpen === 'function') {
    		 callbacks.onOpen.call(null, node,'open')
    	 }
     } else {
    	 if(typeof callbacks.onClose === 'function') {
    		 callbacks.onClose.call(null, node,'close')
    	 }
    	 else if(typeof callbacks.onOpen === 'function') {
    		 callbacks.onOpen.call(null, node,'close')
    	 }
     }
     // console.info('IsOpen', open);
     [].forEach.call(uls, ul => {
       let li = ul;
       while (li.nodeName !== 'LI'){ li = li.parentNode }
       if (li === node){ ul.style.display = (open ? 'block' : 'none') }
     });
     node.classList.remove('collapsibleListOpen')
     node.classList.remove('collapsibleListClosed')
     node.classList.remove('ActiveAGS')
     if (uls.length > 0){
       node.classList.add('collapsibleList' + (open ? 'Open' : 'Closed'))
       if (open) 
    	   node.classList.add('ActiveAGS')
     }
   }
   return {apply, applyTo, applyTwo};
 })();
 
 //----2017-April-8 11:58PM
 
 
//Awesomplete - Lea Verou - MIT license
 !function(){function t(t){var e=Array.isArray(t)?{label:t[0],value:t[1]}:"object"==typeof t&&"label"in t&&"value"in t?t:{label:t,value:t};this.label=e.label||e.value,this.value=e.value}function e(t,e,i){for(var n in e){var s=e[n],r=t.input.getAttribute("data-"+n.toLowerCase());"number"==typeof s?t[n]=parseInt(r):s===!1?t[n]=null!==r:s instanceof Function?t[n]=null:t[n]=r,t[n]||0===t[n]||(t[n]=n in i?i[n]:s)}}function i(t,e){return"string"==typeof t?(e||document).querySelector(t):t||null}function n(t,e){return o.call((e||document).querySelectorAll(t))}function s(){n("input.awesomplete").forEach(function(t){new r(t)})}var r=function(t,n){var s=this;this.isOpened=!1,this.input=i(t),this.input.setAttribute("autocomplete","off"),this.input.setAttribute("aria-autocomplete","list"),n=n||{},e(this,{minChars:2,maxItems:10,autoFirst:!1,data:r.DATA,filter:r.FILTER_CONTAINS,sort:r.SORT_BYLENGTH,item:r.ITEM,replace:r.REPLACE},n),this.index=-1,this.container=i.create("div",{className:"awesomplete",around:t}),this.ul=i.create("ul",{hidden:"hidden",inside:this.container}),this.status=i.create("span",{className:"visually-hidden",role:"status","aria-live":"assertive","aria-relevant":"additions",inside:this.container}),i.bind(this.input,{input:this.evaluate.bind(this),blur:this.close.bind(this,{reason:"blur"}),keydown:function(t){var e=t.keyCode;s.opened&&(13===e&&s.selected?(t.preventDefault(),s.select()):27===e?s.close({reason:"esc"}):38!==e&&40!==e||(t.preventDefault(),s[38===e?"previous":"next"]()))}}),i.bind(this.input.form,{submit:this.close.bind(this,{reason:"submit"})}),i.bind(this.ul,{mousedown:function(t){var e=t.target;if(e!==this){for(;e&&!/li/i.test(e.nodeName);)e=e.parentNode;e&&0===t.button&&(t.preventDefault(),s.select(e,t.target))}}}),this.input.hasAttribute("list")?(this.list="#"+this.input.getAttribute("list"),this.input.removeAttribute("list")):this.list=this.input.getAttribute("data-list")||n.list||[],r.all.push(this)};r.prototype={set list(t){if(Array.isArray(t))this._list=t;else if("string"==typeof t&&t.indexOf(",")>-1)this._list=t.split(/\s*,\s*/);else if(t=i(t),t&&t.children){var e=[];o.apply(t.children).forEach(function(t){if(!t.disabled){var i=t.textContent.trim(),n=t.value||i,s=t.label||i;""!==n&&e.push({label:s,value:n})}}),this._list=e}document.activeElement===this.input&&this.evaluate()},get selected(){return this.index>-1},get opened(){return this.isOpened},close:function(t){this.opened&&(this.ul.setAttribute("hidden",""),this.isOpened=!1,this.index=-1,i.fire(this.input,"awesomplete-close",t||{}))},open:function(){this.ul.removeAttribute("hidden"),this.isOpened=!0,this.autoFirst&&this.index===-1&&this.goto(0),i.fire(this.input,"awesomplete-open")},next:function(){var t=this.ul.children.length;this.goto(this.index<t-1?this.index+1:t?0:-1)},previous:function(){var t=this.ul.children.length,e=this.index-1;this.goto(this.selected&&e!==-1?e:t-1)},goto:function(t){var e=this.ul.children;this.selected&&e[this.index].setAttribute("aria-selected","false"),this.index=t,t>-1&&e.length>0&&(e[t].setAttribute("aria-selected","true"),this.status.textContent=e[t].textContent,i.fire(this.input,"awesomplete-highlight",{text:this.suggestions[this.index]}))},select:function(t,e){if(t?this.index=i.siblingIndex(t):t=this.ul.children[this.index],t){var n=this.suggestions[this.index],s=i.fire(this.input,"awesomplete-select",{text:n,origin:e||t});s&&(this.replace(n),this.close({reason:"select"}),i.fire(this.input,"awesomplete-selectcomplete",{text:n}))}},evaluate:function(){var e=this,i=this.input.value;i.length>=this.minChars&&this._list.length>0?(this.index=-1,this.ul.innerHTML="",this.suggestions=this._list.map(function(n){return new t(e.data(n,i))}).filter(function(t){return e.filter(t,i)}).sort(this.sort).slice(0,this.maxItems),this.suggestions.forEach(function(t){e.ul.appendChild(e.item(t,i))}),0===this.ul.children.length?this.close({reason:"nomatches"}):this.open()):this.close({reason:"nomatches"})}},r.all=[],r.FILTER_CONTAINS=function(t,e){return RegExp(i.regExpEscape(e.trim()),"i").test(t)},r.FILTER_STARTSWITH=function(t,e){return RegExp("^"+i.regExpEscape(e.trim()),"i").test(t)},r.SORT_BYLENGTH=function(t,e){return t.length!==e.length?t.length-e.length:t<e?-1:1},r.ITEM=function(t,e){var n=""===e?t:t.replace(RegExp(i.regExpEscape(e.trim()),"gi"),"<mark>$&</mark>");return i.create("li",{innerHTML:n,"aria-selected":"false"})},r.REPLACE=function(t){this.input.value=t.value},r.DATA=function(t){return t},Object.defineProperty(t.prototype=Object.create(String.prototype),"length",{get:function(){return this.label.length}}),t.prototype.toString=t.prototype.valueOf=function(){return""+this.label};var o=Array.prototype.slice;return i.create=function(t,e){var n=document.createElement(t);for(var s in e){var r=e[s];if("inside"===s)i(r).appendChild(n);else if("around"===s){var o=i(r);o.parentNode.insertBefore(n,o),n.appendChild(o)}else s in n?n[s]=r:n.setAttribute(s,r)}return n},i.bind=function(t,e){if(t)for(var i in e){var n=e[i];i.split(/\s+/).forEach(function(e){t.addEventListener(e,n)})}},i.fire=function(t,e,i){var n=document.createEvent("HTMLEvents");n.initEvent(e,!0,!0);for(var s in i)n[s]=i[s];return t.dispatchEvent(n)},i.regExpEscape=function(t){return t.replace(/[-\\^$*+?.()|[\]{}]/g,"\\$&")},i.siblingIndex=function(t){for(var e=0;t=t.previousElementSibling;e++);return e},"undefined"!=typeof Document&&("loading"!==document.readyState?s():document.addEventListener("DOMContentLoaded",s)),r.$=i,r.$$=n,"undefined"!=typeof self&&(self.Awesomplete=r),"object"==typeof module&&module.exports&&(module.exports=r),r}();
//-# sourceMapping-URL=awesomplete.min.js.map

//----2017-April-15 09:42PM

//request permission on page load
 document.addEventListener('DOMContentLoaded', function () {
   if (Notification.permission !== "granted")
     Notification.requestPermission();
 });

 function notifyOnDesktop(msg) {
   if (!Notification) {
     alert('Desktop notifications not available in your browser. Try Chromium.'); 
     return;
   }

   if (Notification.permission !== "granted")
     Notification.requestPermission();
   else {
     var notification = new Notification('WorkForce Notice', {
       icon: 'https://system.netsuite.com/core/media/media.nl?id=10684283&c=3461650&h=2e5835cbf5a8f31ebfa1',
       body: msg,
       timeout: 4,
     });

     notification.onclick = function () {
       //window.open("https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=1308&deploy=1&");      
     };
     
   }

 }

//----2017-April-21 12:57PM
//----2017-April-21 04:31PM -- add desktop notifications
 
//-- --
//-- Template Engine -- LeirAGS -- 2017-May-06 01:31AM --
//-- Based On : http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line
//-- --
LeirAGS_TemplateA = function(html, options) {
	var re = /<%(.+?)%>/g, 
	    reExp = /(^( )?(var|if|for|else|switch|case|break|{|}|;))(.*)?/g,
	    code = 'with(obj) { var r=[];\n', 
	    cursor = 0, 
	    result,
	    match;
	var add = function(line, js) {
	    js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
	      (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
	    return add;
	  }
	while(match = re.exec(html)) {
	  add(html.slice(cursor, match.index))(match[1], true);
	  cursor = match.index + match[0].length;
	}
	add(html.substr(cursor, html.length - cursor));
	code = (code + 'return r.join(""); }').replace(/[\r\t\n]/g, ' ');
	try { result = new Function('obj', code).apply(options, [options]); }
	catch(err) { console.error("'" + err.message + "'", " in \n\nCode:\n", code, "\n"); }
	return result;
}
//-- Template Engine -- LeirAGS --<
/*
 * 
 *
 */
function isArray(obj){ return !!obj && obj.constructor === Array; }
LeirAGS_objType = function (o){var t = typeof(o); return (o==null)? "null" : ((t==="object") && (o.constructor===Array)) ? "array" : t; } 
/**
 * Get properties object list
 */
LeirAGS_ObjProps = function(o,d,f){
/* Get Object Properties
 * @Params
 *  o (object) 
 * 	d (boolean) deep prop (false)
 * 	f (string) prefix (internal)
 * @Return (array) properties names
 * @Notes:
 * 		Resturns all properties, not functions.
 */
	var d = (d)? d : false;
	var f = (f)? f : '';
	var result = [], prop;
	for (prop in o) {
	  if (hasOwnProperty.call(o, prop)) {
	    result.push(f+((f)?'.':'')+prop);
	    if(d) {
	    	if(LeirAGS_objType(o[prop]) == 'object')
	    		result = result.concat( LeirAGS_ObjProps(o[prop],d, f+((f)?'.':'')+prop) );
	    	if(LeirAGS_objType(o[prop]) == 'array')
	    		result = result.concat( LeirAGS_ObjProps(o[prop][0],d, f+((f)?'.':'')+prop) );
	    }
	  }
	}
	return result;
}

getVarsObject = LeirAGS_ObjProps; /* alias */

/**
 * Convert object to table...
 *
 **/
 LeirAGS_cnvObjTable = function(o){var m=[]; for(a in o){ b=o[a]; if(typeof b === 'object'){ m.push('<tr><td>'+a+'</td><td>'+LeirAGS_cnvObjTable(b)+'</td></tr>'); } else m.push('<tr><td>'+a+'</td><td>'+b+'</td></tr>'); }; return '<table class="table table-bordered table-hover table-striped">'+m.join('')+'</table>'; }

/**
 * Find in Object.
 * @param o mix (object || array)
 * @param f (field)
 * @param v (value)
 * @return array of objects.
 */
LeirAGS_findInObj = function(o,f,v){var m=[]; for(a in o){ b=o[a]; if(typeof b === 'object'){ if (b[f] == v) m.push(b); } else { if(b==v) m.push(b); } } return m};
/**
 * Create vars from all props in object or array... 
 */
LeirAGS_Tmpl = function(html,o,f){
	var m=[], f=(f)?f:''; 
	for(a in o){
		var t = LeirAGS_objType(o[a]);
		switch (t){
		case 'object':
			html = LeirAGS_Tmpl(html, o[a], f+((f)?'.':'')+a )
			break;
		case 'array':
			html = html.replace( new RegExp('{{'+a+'}}','gi') , 'array['+a+']' )
			break;
		default:
			html = html.replace( new RegExp('{{'+a+'}}','gi') , o[a] )
			break;
		}
	}
	return html;
}

LeirAGS_Flaten = function(ary, ret) {
/*
 * Get multi-dimension-array and return one array
 * @param ary (array)
 * @return (array) unidimensional 
 */
    return ary.reduce(function(ret, entry) {
        if (Array.isArray(entry)) {
        	LeirAGS_Flaten (entry, ret);
        } else {
            ret.push(entry);
        }
        return ret;
    }, ret || []);
}

/**
 * Str padZero
 */
String.prototype.padZero= function(len, c){
    var s= this, c= c || '0';
    while(s.length< len) s= c+ s;
    return s;
}

/**
 * Add Xtree based on ul´s 
 * 
 * CSS depends on
 * 
 * 
 */

$.fn.extend({
	Xtreed: function (o) {
		var openedClass = 'glyphicon-minus-sign';
		var closedClass = 'glyphicon-plus-sign';
		if (typeof o != 'undefined'){
			if (typeof o.openedClass != 'undefined'){
				openedClass = o.openedClass;
			}
			if (typeof o.closedClass != 'undefined'){
				closedClass = o.closedClass;
			}
		}
		//initialize each of the top levels
		var tree = $(this);
		tree.addClass("Xtree");
		tree.find('li').has("ul").each(function () {
			var branch = $(this); //li with children ul
			branch.prepend("<i class='Xindicator glyphicon " + closedClass + "'></i>");
			branch.addClass('branch');
			branch.on('click', function (e) {
				if (this == e.target) {
					var icon = $(this).children('i:first');
					icon.toggleClass(openedClass + " " + closedClass);
					$(this).children().children().toggle();
				}
			});
			branch.children().children().toggle();
		});
		//fire event from the dynamically added icon
		tree.find('.branch .Xindicator').each(function(){
			$(this).on('click', function () {
				$(this).closest('li').click();
			});
		});
		//fire event to open branch if the li contains an anchor instead of text
		tree.find('.branch>a').each(function () {
			$(this).on('click', function (e) {
				$(this).closest('li').click();
				e.preventDefault();
			});
		});
		//fire event to open branch if the li contains a button instead of text
		tree.find('.branch>button').each(function () {
			$(this).on('click', function (e) {
				$(this).closest('li').click();
				e.preventDefault();
			});
		});
	}
});

// //Initialization of treeviews
// 
// $('#tree1').Xtreed();
// 
// $('#tree2').Xtreed({openedClass:'glyphicon-folder-open', closedClass:'glyphicon-folder-close'});
// 
// $('#tree3').Xtreed({openedClass:'glyphicon-chevron-right', closedClass:'glyphicon-chevron-down'});
//
// Expand/Colapse all
// $('#newtasktreefinal .branch').each(function(){ $(this).click() })


//Copies a string to the clipboard. Must be called from within an 
//event handler such as click. May return false if it failed, but
//this is not always possible. Browser support for Chrome 43+, 
//Firefox 42+, Safari 10+, Edge and IE 10+.
//IE: The clipboard feature may be disabled by an administrator. By
//default a prompt is shown the first time the clipboard is 
//used (per session).
function copyToClipboard(text) {
 if (window.clipboardData && window.clipboardData.setData) {
     // IE specific code path to prevent textarea being shown while dialog is visible.
     return clipboardData.setData("Text", text); 

 } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
     var textarea = document.createElement("textarea");
     textarea.textContent = text;
     textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
     document.body.appendChild(textarea);
     textarea.select();
     try {
         return document.execCommand("copy");  // Security exception may be thrown by some browsers.
     } catch (ex) {
         console.warn("Copy to clipboard failed.", ex);
         return false;
     } finally {
         document.body.removeChild(textarea);
     }
 }
}



//----2017-May-06 01:42AM -- ADD LeirAGS_objType, LeirAGS_ObjProps, LeirAGS_cnvObjTable, LeirAGS_findInObj, LeirAGS_Tmpl, 
//----2017-May-09 11:05AM -- ADD LeirAGS_Flaten
//----2017-May-22 10:30AM -- ADD Xtree ... to be used on Add Process...creating tasks...
//----2017-May-24 03:20PM -- ADD copyToClipboard functionality... used on permalink...
//----2017-May-24 05:52PM -- ADD Datatables conversion from netsuite dates to sort columns correctly...