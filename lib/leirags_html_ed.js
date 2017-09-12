/**
 * A Javascript object to encode and/or decode html characters using HTML or Numeric entities that handles double or partial encoding
 * Author: R Reid
 * source: http://www.strictly-software.com/htmlencode
 * Licences: GPL, The MIT License (MIT)
 * Copyright: (c) 2011 Robert Reid - Strictly-Software.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 * Revision:
 *  2011-07-14, Jacques-Yves Bleau: 
 *       - fixed conversion error with capitalized accentuated characters
 *       + converted arr1 and arr2 to object property to remove redundancy
 *
 * Revision:
 *  2011-11-10, Ce-Yi Hio: 
 *       - fixed conversion error with a number of capitalized entity characters
 *
 * Revision:
 *  2011-11-10, Rob Reid: 
 *		 - changed array format
 *
 * Revision:
 *  2012-09-23, Alex Oss: 
 *		 - replaced string concatonation in numEncode with string builder, push and join for peformance with ammendments by Rob Reid
 */


/*
 * //example of using the html encode object

// set the type of encoding to numerical entities e.g & instead of &
LeirAGS_Encoder.EncodeType = "numerical";

// or to set it to encode to html entities e.g & instead of &
LeirAGS_Encoder.EncodeType = "entity";

// HTML encode text from an input element
// This will prevent double encoding.
var encoded = LeirAGS_Encoder.htmlEncode(document.getElementById('input'));

// To encode but to allow double encoding which means any existing entities such as
// &amp; will be converted to &amp;amp;
var dblEncoded = LeirAGS_Encoder.htmlEncode(document.getElementById('input'),true);

// Decode the now encoded text
var decoded = LeirAGS_Encoder.htmlDecode(encoded);

// Check whether the text still contains HTML/Numerical entities
var containsEncoded = LeirAGS_Encoder.hasEncoded(decoded);
 */
LeirAGS_Encoder = {

	// When encoding do we convert characters into html or numerical entities
	EncodeType : "entity",  // entity OR numerical

	isEmpty : function(val){
		if(val){
			return ((val===null) || val.length==0 || /^\s+$/.test(val));
		}else{
			return true;
		}
	},
	
	// arrays for conversion from HTML Entities to Numerical values
	arr1: ['&nbsp;','&iexcl;','&cent;','&pound;','&curren;','&yen;','&brvbar;','&sect;','&uml;','&copy;','&ordf;','&laquo;','&not;','&shy;','&reg;','&macr;','&deg;','&plusmn;','&sup2;','&sup3;','&acute;','&micro;','&para;','&middot;','&cedil;','&sup1;','&ordm;','&raquo;','&frac14;','&frac12;','&frac34;','&iquest;','&Agrave;','&Aacute;','&Acirc;','&Atilde;','&Auml;','&Aring;','&AElig;','&Ccedil;','&Egrave;','&Eacute;','&Ecirc;','&Euml;','&Igrave;','&Iacute;','&Icirc;','&Iuml;','&ETH;','&Ntilde;','&Ograve;','&Oacute;','&Ocirc;','&Otilde;','&Ouml;','&times;','&Oslash;','&Ugrave;','&Uacute;','&Ucirc;','&Uuml;','&Yacute;','&THORN;','&szlig;','&agrave;','&aacute;','&acirc;','&atilde;','&auml;','&aring;','&aelig;','&ccedil;','&egrave;','&eacute;','&ecirc;','&euml;','&igrave;','&iacute;','&icirc;','&iuml;','&eth;','&ntilde;','&ograve;','&oacute;','&ocirc;','&otilde;','&ouml;','&divide;','&oslash;','&ugrave;','&uacute;','&ucirc;','&uuml;','&yacute;','&thorn;','&yuml;','&quot;','&amp;','&lt;','&gt;','&OElig;','&oelig;','&Scaron;','&scaron;','&Yuml;','&circ;','&tilde;','&ensp;','&emsp;','&thinsp;','&zwnj;','&zwj;','&lrm;','&rlm;','&ndash;','&mdash;','&lsquo;','&rsquo;','&sbquo;','&ldquo;','&rdquo;','&bdquo;','&dagger;','&Dagger;','&permil;','&lsaquo;','&rsaquo;','&euro;','&fnof;','&Alpha;','&Beta;','&Gamma;','&Delta;','&Epsilon;','&Zeta;','&Eta;','&Theta;','&Iota;','&Kappa;','&Lambda;','&Mu;','&Nu;','&Xi;','&Omicron;','&Pi;','&Rho;','&Sigma;','&Tau;','&Upsilon;','&Phi;','&Chi;','&Psi;','&Omega;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigmaf;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&thetasym;','&upsih;','&piv;','&bull;','&hellip;','&prime;','&Prime;','&oline;','&frasl;','&weierp;','&image;','&real;','&trade;','&alefsym;','&larr;','&uarr;','&rarr;','&darr;','&harr;','&crarr;','&lArr;','&uArr;','&rArr;','&dArr;','&hArr;','&forall;','&part;','&exist;','&empty;','&nabla;','&isin;','&notin;','&ni;','&prod;','&sum;','&minus;','&lowast;','&radic;','&prop;','&infin;','&ang;','&and;','&or;','&cap;','&cup;','&int;','&there4;','&sim;','&cong;','&asymp;','&ne;','&equiv;','&le;','&ge;','&sub;','&sup;','&nsub;','&sube;','&supe;','&oplus;','&otimes;','&perp;','&sdot;','&lceil;','&rceil;','&lfloor;','&rfloor;','&lang;','&rang;','&loz;','&spades;','&clubs;','&hearts;','&diams;'],
	arr2: ['&#160;','&#161;','&#162;','&#163;','&#164;','&#165;','&#166;','&#167;','&#168;','&#169;','&#170;','&#171;','&#172;','&#173;','&#174;','&#175;','&#176;','&#177;','&#178;','&#179;','&#180;','&#181;','&#182;','&#183;','&#184;','&#185;','&#186;','&#187;','&#188;','&#189;','&#190;','&#191;','&#192;','&#193;','&#194;','&#195;','&#196;','&#197;','&#198;','&#199;','&#200;','&#201;','&#202;','&#203;','&#204;','&#205;','&#206;','&#207;','&#208;','&#209;','&#210;','&#211;','&#212;','&#213;','&#214;','&#215;','&#216;','&#217;','&#218;','&#219;','&#220;','&#221;','&#222;','&#223;','&#224;','&#225;','&#226;','&#227;','&#228;','&#229;','&#230;','&#231;','&#232;','&#233;','&#234;','&#235;','&#236;','&#237;','&#238;','&#239;','&#240;','&#241;','&#242;','&#243;','&#244;','&#245;','&#246;','&#247;','&#248;','&#249;','&#250;','&#251;','&#252;','&#253;','&#254;','&#255;','&#34;','&#38;','&#60;','&#62;','&#338;','&#339;','&#352;','&#353;','&#376;','&#710;','&#732;','&#8194;','&#8195;','&#8201;','&#8204;','&#8205;','&#8206;','&#8207;','&#8211;','&#8212;','&#8216;','&#8217;','&#8218;','&#8220;','&#8221;','&#8222;','&#8224;','&#8225;','&#8240;','&#8249;','&#8250;','&#8364;','&#402;','&#913;','&#914;','&#915;','&#916;','&#917;','&#918;','&#919;','&#920;','&#921;','&#922;','&#923;','&#924;','&#925;','&#926;','&#927;','&#928;','&#929;','&#931;','&#932;','&#933;','&#934;','&#935;','&#936;','&#937;','&#945;','&#946;','&#947;','&#948;','&#949;','&#950;','&#951;','&#952;','&#953;','&#954;','&#955;','&#956;','&#957;','&#958;','&#959;','&#960;','&#961;','&#962;','&#963;','&#964;','&#965;','&#966;','&#967;','&#968;','&#969;','&#977;','&#978;','&#982;','&#8226;','&#8230;','&#8242;','&#8243;','&#8254;','&#8260;','&#8472;','&#8465;','&#8476;','&#8482;','&#8501;','&#8592;','&#8593;','&#8594;','&#8595;','&#8596;','&#8629;','&#8656;','&#8657;','&#8658;','&#8659;','&#8660;','&#8704;','&#8706;','&#8707;','&#8709;','&#8711;','&#8712;','&#8713;','&#8715;','&#8719;','&#8721;','&#8722;','&#8727;','&#8730;','&#8733;','&#8734;','&#8736;','&#8743;','&#8744;','&#8745;','&#8746;','&#8747;','&#8756;','&#8764;','&#8773;','&#8776;','&#8800;','&#8801;','&#8804;','&#8805;','&#8834;','&#8835;','&#8836;','&#8838;','&#8839;','&#8853;','&#8855;','&#8869;','&#8901;','&#8968;','&#8969;','&#8970;','&#8971;','&#9001;','&#9002;','&#9674;','&#9824;','&#9827;','&#9829;','&#9830;'],
		
	// Convert HTML entities into numerical entities
	HTML2Numerical : function(s){
		return this.swapArrayVals(s,this.arr1,this.arr2);
	},	

	// Convert Numerical entities into HTML entities
	NumericalToHTML : function(s){
		return this.swapArrayVals(s,this.arr2,this.arr1);
	},


	// Numerically encodes all unicode characters
	numEncode : function(s){ 
		if(this.isEmpty(s)) return ""; 

		var a = [],
			l = s.length; 
		
		for (var i=0;i<l;i++){ 
			var c = s.charAt(i); 
			if (c < " " || c > "~"){ 
				a.push("&#"); 
				a.push(c.charCodeAt()); //numeric value of code point 
				a.push(";"); 
			}else{ 
				a.push(c); 
			} 
		} 
		
		return a.join(""); 	
	}, 
	
	// HTML Decode numerical and HTML entities back to original values
	htmlDecode : function(s){

		var c,m,d = s;
		
		if(this.isEmpty(d)) return "";

		// convert HTML entites back to numerical entites first
		d = this.HTML2Numerical(d);
		
		// look for numerical entities &#34;
		arr=d.match(/&#[0-9]{1,5};/g);
		
		// if no matches found in string then skip
		if(arr!=null){
			for(var x=0;x<arr.length;x++){
				m = arr[x];
				c = m.substring(2,m.length-1); //get numeric part which is refernce to unicode character
				// if its a valid number we can decode
				if(c >= -32768 && c <= 65535){
					// decode every single match within string
					d = d.replace(m, String.fromCharCode(c));
				}else{
					d = d.replace(m, ""); //invalid so replace with nada
				}
			}			
		}

		return d;
	},		

	// encode an input string into either numerical or HTML entities
	htmlEncode : function(s,dbl){
			
		if(this.isEmpty(s)) return "";

		// do we allow double encoding? E.g will &amp; be turned into &amp;amp;
		dbl = dbl || false; //default to prevent double encoding
		
		// if allowing double encoding we do ampersands first
		if(dbl){
			if(this.EncodeType=="numerical"){
				s = s.replace(/&/g, "&#38;");
			}else{
				s = s.replace(/&/g, "&amp;");
			}
		}

		// convert the xss chars to numerical entities ' " < >
		s = this.XSSEncode(s,false);
		
		if(this.EncodeType=="numerical" || !dbl){
			// Now call function that will convert any HTML entities to numerical codes
			s = this.HTML2Numerical(s);
		}

		// Now encode all chars above 127 e.g unicode
		s = this.numEncode(s);

		// now we know anything that needs to be encoded has been converted to numerical entities we
		// can encode any ampersands & that are not part of encoded entities
		// to handle the fact that I need to do a negative check and handle multiple ampersands &&&
		// I am going to use a placeholder

		// if we don't want double encoded entities we ignore the & in existing entities
		if(!dbl){
			s = s.replace(/&#/g,"##AMPHASH##");
		
			if(this.EncodeType=="numerical"){
				s = s.replace(/&/g, "&#38;");
			}else{
				s = s.replace(/&/g, "&amp;");
			}

			s = s.replace(/##AMPHASH##/g,"&#");
		}
		
		// replace any malformed entities
		s = s.replace(/&#\d*([^\d;]|$)/g, "$1");

		if(!dbl){
			// safety check to correct any double encoded &amp;
			s = this.correctEncoding(s);
		}

		// now do we need to convert our numerical encoded string into entities
		if(this.EncodeType=="entity"){
			s = this.NumericalToHTML(s);
		}

		return s;					
	},

	// Encodes the basic 4 characters used to malform HTML in XSS hacks
	XSSEncode : function(s,en){
		if(!this.isEmpty(s)){
			en = en || true;
			// do we convert to numerical or html entity?
			if(en){
				s = s.replace(/\'/g,"&#39;"); //no HTML equivalent as &apos is not cross browser supported
				s = s.replace(/\"/g,"&quot;");
				s = s.replace(/</g,"&lt;");
				s = s.replace(/>/g,"&gt;");
			}else{
				s = s.replace(/\'/g,"&#39;"); //no HTML equivalent as &apos is not cross browser supported
				s = s.replace(/\"/g,"&#34;");
				s = s.replace(/</g,"&#60;");
				s = s.replace(/>/g,"&#62;");
			}
			return s;
		}else{
			return "";
		}
	},

	// returns true if a string contains html or numerical encoded entities
	hasEncoded : function(s){
		if(/&#[0-9]{1,5};/g.test(s)){
			return true;
		}else if(/&[A-Z]{2,6};/gi.test(s)){
			return true;
		}else{
			return false;
		}
	},

	// will remove any unicode characters
	stripUnicode : function(s){
		return s.replace(/[^\x20-\x7E]/g,"");
		
	},

	// corrects any double encoded &amp; entities e.g &amp;amp;
	correctEncoding : function(s){
		return s.replace(/(&amp;)(amp;)+/,"$1");
	},


	// Function to loop through an array swaping each item with the value from another array e.g swap HTML entities with Numericals
	swapArrayVals : function(s,arr1,arr2){
		if(this.isEmpty(s)) return "";
		var re;
		if(arr1 && arr2){
			//ShowDebug("in swapArrayVals arr1.length = " + arr1.length + " arr2.length = " + arr2.length)
			// array lengths must match
			if(arr1.length == arr2.length){
				for(var x=0,i=arr1.length;x<i;x++){
					re = new RegExp(arr1[x], 'g');
					s = s.replace(re,arr2[x]); //swap arr1 item with matching item from arr2	
				}
			}
		}
		return s;
	},

	inArray : function( item, arr ) {
		for ( var i = 0, x = arr.length; i < x; i++ ){
			if ( arr[i] === item ){
				return i;
			}
		}
		return -1;
	},
	
	validHTML : function (html) {
		  var openingTags, closingTags;
		  html = ""+html; // Case TypeOf to String.

		  html        = html.replace(/<[^>]*\/\s?>/g, '');      // Remove all self closing tags
		  html        = html.replace(/<(br|hr|img).*?>/g, '');  // Remove all <br>, <hr>, and <img> tags
		  openingTags = html.match(/<[^\/].*?>/g) || [];        // Get remaining opening tags
		  closingTags = html.match(/<\/.+?>/g) || [];           // Get remaining closing tags

		  return openingTags.length === closingTags.length ? true : false;
	},
		
	extractText : function (inputText, typeX) {
		    var Debuging = false;
			var s = "" + inputText;
		    var br = '<br>';
		    typeX = (typeX)? typeX : 'html';
		    if (typeX == 'text') { br = "\n"; }
		    if (typeX == 'textonly') { br = " "; }
		    //-- get rid of more than 2 multiple line breaks:
		    s=s.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/gim, "\n\n");
		    //--- sanitizeHtml-tags>....
		    var tags_erase1 = [ 'link' ];
		    //-- RipOff al attributes allowing href...only
		    tags_erase1.forEach(function(t){
		    	var rgx= new RegExp('<'+t+'(?:.|\\s)*?>','gi');
		    	if (Debuging) console.info('Processing TAG-CLEAR "'+t+'".replace('+rgx+',"")');
		    	s=s.replace(rgx, '');
		    	if (Debuging) console.info("Step tags_erase1 result:",s);
		    });
		    // console.info("Step result:",s);
		    var tags_erase2 = [ 'script','style' ];
		    //-- RipOff al attributes allowing href...only
		    tags_erase2.forEach(function(t){
		    	var rgx= new RegExp('<'+t+'(?:.|\\s)*?>(?:.|\\s)*?<\/'+t+'>','gi');
		    	if (Debuging) console.info('Processing TAG-CLEAR "'+t+'".replace('+rgx+',"")');
		    	s=s.replace(rgx, '');
		    	if (Debuging) console.info("Step tags_erase2 result:",s);
		    });
		    // console.info("Step result:",s);
		    
		    var tags = ['h1','h2','h3','h4','h5','h6',
		    			'p','b','i','strong','em',
		    			'small','span',
		    			'li','ul','ol','dt',
		    			'blockquote','caption','code','pre',
		    			'table','tbody','thead','tfoot','tr','th','td',
		    			'div'];
		    //-- RipOff al attributes
		    tags.forEach(function(t){
		    	var rgx= new RegExp('<'+t+'(?:.|\s)*?>','gi');
		    	var rp ='<'+t+'>';
		    	if (typeX == 'textonly') { tp=" "; }
		    	if (Debuging) console.info('Cleaning Attributes on TAG "'+t+'".replace("<'+t+'(?:.|\s)*?>/gi","'+rp+'")');
		    	s=s.replace(rgx, rp);
		    	//console.info("Step result:",s);
		    });
		    var tags_selfClosing = ['br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'];
		    //-- RipOff al attributes
		    tags_selfClosing.forEach(function(t){
		    	var rgx= new RegExp('<'+t+'(?:.|\s)*?>','gi');
		    	var rp ='<'+t+'>';
		    	if (typeX == 'textonly') { br = " "; }
		    	if (Debuging) console.info('Processing TAG "'+t+'".replace("<'+t+'(?:.|\s)*?>","gi")');
		    	s=s.replace(rgx, rp);
		    	//console.info("Step result:",s);
		    });
		    // console.info("Step result:",s);
		    var tags_a_attrs = [ 
		    				['a', 'href', '<a href="$1">$2</a>',' $2 ']
		    				//['img', 'src', '<img>']
		    			];
		    //-- RipOff al attributes allowing href...only
		    tags_a_attrs.forEach(function(t){
		    	var rgx= new RegExp('<'+t[0]+'(?:.|\\s)*?'+t[1]+'="((?:.|\\s)*?)"(?:.|\\s)*?>((?:.|\\s)*?)<\/'+t[0]+'>','gi');
		    	if (Debuging) console.info('Processing TAG-SP "'+t[0]+'".replace('+rgx+',"'+t[2]+'")');
		    	if (typeX == 'textonly') { br = " "; }
		    	s=s.replace(rgx, ((typeX == 'textonly')?t[3]:t[2]) );
		    	if (Debuging) console.info("Step tags_a_attrs result:",s);
		    });
		    var tags_img_attrs = [ 
		    				['img', 'src', '<img src="$1">', '']
		    			];
		    //-- RipOff al attributes allowing src...only
		    tags_img_attrs.forEach(function(t){
		    	var rgx= new RegExp('<'+t[0]+'(?:.|\\s)*?'+t[1]+'="((?:.|\\s)*?)"(?:.|\\s)*?>','gi');			
		    	if (Debuging) console.info('Processing TAG-SP "'+t[0]+'".replace('+rgx+',"'+t[2]+'")');
		    	s=s.replace(rgx, ((typeX == 'textonly')?t[3]:t[2]) );
		    	if (Debuging) console.info("Step result:",s);
		    });
	//--- sanitizeHtml-tags<....
	//--- Cleaning-tags>....
		   
		    //-- get rid of html-encoded characters:
		    s=s.replace(/&nbsp;/gi," ");
		    
		    //-- get rid of more than 2 spaces:
		    s=s.replace(/ +(?= )/g,'');

		    s=s.replace(/&amp;/gi,"&");
		    s=s.replace(/&quot;/gi,'"');
		    s=s.replace(/&lt;/gi,'<');
		    s=s.replace(/&gt;/gi,'>');
	//--- Cleaning-tags<....

		    if (Debuging) console.info("Final Result:",s);

		    return s+"";
		
		    //-- remove table tr td th
		    s=s.replace(/<(table|thead|tbody|tr).*>/gi, br);
		    s=s.replace(/<(th|td).*>(.*?)<\/(th|td)>/gi, " $1 ");
		    
		    //-- return
		   return s+"";
		}

}


//XORCipher - Super simple encryption using XOR and Base64
//
// Depends on [Underscore](http://underscorejs.org/).
//
// As a warning, this is **not** a secure encryption algorythm. It uses a very
// simplistic keystore and will be easy to crack.
//
// The Base64 algorythm is a modification of the one used in phpjs.org
// * http://phpjs.org/functions/base64_encode/
// * http://phpjs.org/functions/base64_decode/
//
// Examples
// --------
//
//     XORCipher.encode("test", "foobar");   // => "EgocFhUX"
//     XORCipher.decode("test", "EgocFhUX"); // => "foobar"
//
// Copyright © 2013 Devin Weaver <suki@tritarget.org>
//
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// http://www.wtfpl.net/ for more details.

/* jshint forin:true, noarg:true, noempty:true, eqeqeq:true, strict:true,
   undef:true, unused:true, curly:true, browser:true, indent:2, maxerr:50 */
/* global _ */

LeirAGS_XORCipher = {
		
    encode: function(key, data) {
      var key = 'Transtelco Inc';
      data = this._xor_encrypt(key, data);
      return this._b64_encode(data);
    },
    
    decode: function(key, data) {
      var key = 'Transtelco Inc';
      data = this._b64_decode(data);
      return this._xor_decrypt(key, data);
    },
    
    _b64_encode : function(data) {
      var o1, o2, o3, h1, h2, h3, h4, bits, r, i = 0, enc = "", n=0;
      var b64_table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      if (!data) { return data; }
      n=0;
      do {
        o1 = data[i++];
        o2 = data[i++];
        o3 = data[i++];
        bits = o1 << 16 | o2 << 8 | o3;
        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;
        enc += b64_table.charAt(h1) + b64_table.charAt(h2) +
               b64_table.charAt(h3) + b64_table.charAt(h4);
      } while (i < data.length);
      r = data.length % 3;
      return (r ? enc.slice(0, r - 3) : enc) + "___".slice(r || 3);
    },
    
    _b64_decode : function (data) {
      var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, result = [];
      var b64_table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      if (!data) { return data; }
      data += "";
      do {
        h = data.charAt(i++); h1 = b64_table.indexOf((h=='_')?'=':h);
        h = data.charAt(i++); h2 = b64_table.indexOf((h=='_')?'=':h);
        h = data.charAt(i++); h3 = b64_table.indexOf((h=='_')?'=':h);
        h = data.charAt(i++); h4 = b64_table.indexOf((h=='_')?'=':h);
        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;
        result.push(o1);
        if (h3 !== 64) {
          result.push(o2);
          if (h4 !== 64) {
            result.push(o3);
          }
        }
      } while (i < data.length);
      return result;
    },

    _keyCharAt : function (key, i) {
      return key.charCodeAt( Math.floor(i % key.length) );
    },

    _xor_encrypt: function (key, data) {
      return data.split('').map(function(c, i) {
        return c.charCodeAt(0) ^ key.charCodeAt( Math.floor(i % key.length) );
      });
    },

    _xor_decrypt: function (key, data) {
      return data.map(function(c, i) {
        return String.fromCharCode( c ^ key.charCodeAt( Math.floor(i % key.length) ));
      }).join("");
    }
    
};

// Encripter



LeirAGS_dates = {
	    convert:function(d) {
// Converts the date in d to a date-object. The input can be:
//   a date object: returned without modification
//  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
//   a number     : Interpreted as number of milliseconds
//                  since 1 Jan 1970 (a timestamp) 
//   a string     : Any format supported by the javascript engine, like
//                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
//  an object     : Interpreted as an object with year, month and date
//                  attributes.  **NOTE** month is 0-11.
	        return (
	            d.constructor === Date ? d :
	            d.constructor === Array ? new Date(d[0],d[1],d[2]) :
	            d.constructor === Number ? new Date(d) :
	            d.constructor === String ? new Date(d) :
	            typeof d === "object" ? new Date(d.year,d.month,d.date) :
	            NaN
	        );
	    },
	    compare:function(a,b) {
// Compare two dates (could be of any type supported by the convert
// function above) and returns:
//  -1 : if a < b
//   0 : if a = b
//   1 : if a > b
// NaN : if a or b is an illegal date
// NOTE: The code inside isFinite does an assignment (=).
	        return (
	            isFinite(a=this.convert(a).valueOf()) &&
	            isFinite(b=this.convert(b).valueOf()) ?
	            (a>b)-(a<b) :
	            NaN
	        );
	    },
	    inRange:function(d,start,end) {
// Checks if date in d is between dates in start and end.
// Returns a boolean or NaN:
//    true  : if d is between start and end (inclusive)
//    false : if d is before start or after end
//    NaN   : if one or more of the dates is illegal.
// NOTE: The code inside isFinite does an assignment (=).
	       return (
	            isFinite(d=this.convert(d).valueOf()) &&
	            isFinite(start=this.convert(start).valueOf()) &&
	            isFinite(end=this.convert(end).valueOf()) ?
	            start <= d && d <= end :
	            NaN
	        );
	    },
	    diffDays : function (a, b) {
// Calculate days between dates in start and end.
// Returns a number or NaN:
//    <0   : b is less than a, b is in the pass.
//    >0   : b is grather than a, b is in the future.
//    NaN  : if one or more of the dates is illegal.
// NOTE: The code inside isFinite does an assignment (=).
	    	var msPerDay = 8.64e7;
	    	return ( 
	    		isFinite(a=this.convert(a).valueOf()) &&
	    		isFinite(b=this.convert(b).valueOf()) ?
	    		Math.round( (a - b) / msPerDay ) :
	    		NaN
	    	);
	    },
	    diffWrkDays : function (a, b, w, h, lg) {
// Calculate working days between dates in start(a) and end(b).
// w : (bolean) work on weekends
// h : (string) list of dates for holidays, formated as
//     #MM_DD#MM_DD# ... MM-month 2 digits, DD day 2 digits
//     #MM_DD_YYYY# ... for a full date as holiday (TODO)
//     Default: Jan 01, Dec 25.
// lg : (boolean) show console-log
// Returns a number or NaN:
//    <0   : b is less than a, b is in the pass.
//    >0   : b is grather than a, b is in the future.
//    NaN  : if one or more of the dates is illegal.
// NOTES: The code inside isFinite does an assignment (=).
// h-format	#MM_DD#MM_DD# ... MM-month 2 digits, DD day 2 digits
//	 #MM_DD_YYYY# ... for a full date as holiday (TODO)
//	 Default: Jan 01, Dec 25.
	    	var days = 0, holy = '';
	    	var a_e = this.convert( a );
	    	var b_e = this.convert( b ); // Create new space to not touch parameters...
	    	w = (w != undefined) ? w : false;
	    	h = (h != undefined) ? h : "#01_01#12_25#" ;
	    	lg = (lg != undefined) ? lg : false;
	    	p = this.convert(a_e);
	    	holy = (h.indexOf( '#'+("0" + p.getMonth()).slice(-2) +'_'+("0" + p.getDate()).slice(-2)+'#' ) != -1);
	    	a_e= this.convert(a_e).valueOf();
	    	b_e= this.convert(b_e).valueOf();
	    	if(lg) console.info('diffWrkDays',a_e,b_e);
	    	if (a_e <= b_e) {
		    	while (a_e < b_e) {
		    		if(lg) console.info('a <= b',a_e,b_e,days);
					days += ( ( w || (! w && (p.getDay() > 0 && p.getDay() < 6) ) ) && ! holy)? 1 : 0;
					p.setDate(p.getDate() + 1);
					holy = (h.indexOf( '#'+("0" + p.getMonth()).slice(-2) +'_'+("0" + p.getDate()).slice(-2)+'#' ) != -1);
					a_e =  this.convert(p).valueOf();
				}
	    	} else {
	    		while (a_e > b_e) {
	    			if(lg) console.info('b <= a',a_e,b_e,days);
	    			days += ( ( w || (! w && (p.getDay() > 0 && p.getDay() < 6) ) ) && ! holy)? 1 : 0;
					p.setDate(p.getDate() - 1);
					holy = (h.indexOf( '#'+("0" + p.getMonth()).slice(-2) +'_'+("0" + p.getDate()).slice(-2)+'#' ) != -1);
					a_e =  this.convert(p).valueOf();
				}
	    		days = - days;
	    	}
	    	if(lg) console.info('Days = ',days);
	    	return days;
	    },
	    nextWorkDay: function  nextWorkDay ( a, d, w, h ) {
// Calculate next working date starting from start(a).
// d : (int) how many working days after
// w : (bolean) work on weekends
// h : (string) list of dates for holidays
// Returns a date or NaN:
//	    	    NaN  : if one or more of the dates is illegal.
// NOTES: The code inside isFinite does an assignment (=).
// h-format	#MM_DD#MM_DD# ... MM-month 2 digits, DD day 2 digits
//	    		        #MM_DD_YYYY# ... for a full date as holiday (TODO)
//	    		 	    Default: Jan 01, Dec 25.
			var nxt0 = this.convert( a );
			var nxt = this.convert( nxt0.getTime() ); // Fix void change currvalue from parameter (a)
			var holy = false, wknd = false;
			var delta = (d >= 0) ? 1 : -1; // Auto-Detect days before or after 
			var q = Math.abs(d);
			w = (typeof w === 'undefined') ? false : w;
			h = (h != undefined) ? h : "#01_01#12_25#" ;
			while (q > 0) {
				nxt.setDate( nxt.getDate() + delta);
				holy = (h.indexOf( '#'+("0" + nxt.getMonth()).slice(-2) +'_'+("0" + nxt.getDate()).slice(-2)+'#' ) != -1);
				wknd = (nxt.getDay() == 0 || nxt.getDay() == 6);
				if (!holy && (w || (!w && !wknd))) q--;
			}
			return nxt
		},
	    nextWrkDay : function (a, w, h, lg) {
// Calculate next working date starting from start(a).
// w : (bolean) work on weekends
// h : (string) list of dates for holidays
// Returns a date or NaN:
//    NaN  : if one or more of the dates is illegal.
// NOTES: The code inside isFinite does an assignment (=).
// h-format	#MM_DD#MM_DD# ... MM-month 2 digits, DD day 2 digits
//	        #MM_DD_YYYY# ... for a full date as holiday (TODO)
//	 	    Default: Jan 01, Dec 25.
	    	var holy = '', it = 0;
	    	var a_e = this.convert( a );
	    	w = (w != undefined) ? w : false;
	    	h = (h != undefined) ? h : "#01_01#12_25#" ;
	    	lg = (lg != undefined) ? lg : false;
	    	if (lg) console.log('nexWrkDay starting', a_e);
	    	p = this.convert(a_e);
	    	p.setDate(p.getDate() + 1);
	    	holy = (h.indexOf( '#'+("0" + p.getMonth()).slice(-2) +'_'+("0" + p.getDate()).slice(-2)+'#' ) != -1);
	    	if (lg) console.log({'it': it, 'date': p, 'day-week': p.getDay(), 'holy': holy });
	    	while ( ! (( w || (! w && (p.getDay() > 0 && p.getDay() < 6) ) ) && ! holy) ) {
	    		it++;
	    		p.setDate(p.getDate() + 1);
				holy = (h.indexOf( '#'+("0" + p.getMonth()).slice(-2) +'_'+("0" + p.getDate()).slice(-2)+'#' ) != -1);
				if (lg) console.log({'it': it, 'date': p, 'day-week': p.getDay(), 'holy': holy });
			}
	    	a_e =  this.convert(p);
	    	return a_e;
	    },
	    specialDate: function(a){
	    	var wD = ['Sunday','Monday','Thuesday','Wendsday','Thusday','Friday','Saturday'];
		    var mD = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'Octuber', 'November', 'December'];
		    var wDs = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
		    var mDs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
		    var today = new Date();
		   
		    var weekDay = wD[ a.getDay() ];
		    var monthDay = a.getDate();
		    var monthName = mD[ a.getMonth() ];
		    var hour = a.getHours();
		    var minute = a.getMinutes();
		    var second = a.getSeconds();
		    var milisecond = a.getMilliseconds();
		    var ampm = 'AM';
		    if (hour > 12){ hour -= 12; ampm = 'PM'; }
		    var timeDiff = a.getTime() - today.getTime();
		    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
		  	switch(diffDays){
    		  	case 0:
    		  		return hour+':'+minute+ampm+', today ';
    		  		break;
    		  	case -1:
    		  		return hour+':'+minute+ampm+', yesterday ';
    		  		break;
    		  	case -2: case -3: case -4: case -5: case -6:
    		  		return weekDay+', '+hour+':'+minute+ampm;
    		  		break;
    		  	default:
    		  		return weekDay+' '+monthName+' '+monthDay+', '+hour+':'+minute+ampm;
    		  		break;
		  	}
	    },
	    lapsedTime: function(a, b, c){
	    	//Get 1 day in milliseconds
	    	  var one_day=1000*60*60*24;

	    	  // Convert both dates to milliseconds
	    	  var date1_ms = a.getTime();
	    	  var date2_ms = b.getTime();

	    	  // Calculate the difference in milliseconds
	    	  var difference_ms = date2_ms - date1_ms;
	    	  //take out milliseconds
	    	  difference_ms = difference_ms/1000;
	    	  var seconds = Math.floor(difference_ms % 60);
	    	  difference_ms = difference_ms/60; 
	    	  var minutes = Math.floor(difference_ms % 60);
	    	  difference_ms = difference_ms/60; 
	    	  var hours = Math.floor(difference_ms % 24);  
	    	  var days = Math.floor(difference_ms/24);
	    	  
	    	  switch(c){
	    	  case 'dhms':
	    		  return days + ' days, ' + hours + ' hours, ' + minutes + ' minutes, and ' + seconds + ' seconds';
	    		  break;
	    	  case 'dhm':
	    		  return days + ' days, ' + hours + ' hours, ' + minutes + ' minutes';
	    		  break;
	    	  case 'dh':
	    		  return days + ' days, ' + hours + ' hours';
	    		  break;
	    	  case 'd':
	    		  return days + ' days';
	    		  break;
	    	  case 'dhm':
	    		  return days + ' days, ' + hours + ' hours, ' + minutes + ' minutes';
	    		  break;
	    	  case 'Dhm':
	    		  return days + ' days, ' + hours + ':' + minutes;
	    		  break;
	    	  case 'json':
	    		  return { days:days, hours:hours, minutes:minutes, seconds: seconds };
	    	  default:
	    		  return days + ' days, ' + hours + ' hours, ' + minutes + ' minutes, and ' + seconds + ' seconds';
	    		  break;
	    	  }
	    }
	}

//--- LeirAGS 2017-April-20 12:19PM
//--- LeirAGS 2017-April-23 05:59PM
//--- LeirAGS 2017-April-26 11:30AM
//--- LeirAGS 2017-April-28 12:55PM
//--- LeirAGS 2017-April-28 03:56PM
//--- LeirAGS 2017-May  -06 08:24PM add alpsedTime, specialDate
//--- LeirAGS 2017-May  -29 01:06PM to add activity by process