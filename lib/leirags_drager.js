/**
 * LeirAGS Develop
 * Create a Resizable DIV by ID
 */

jQuery.LeirAGS_reSizable = function (elem, byside, rszt ) {
	var element = document.getElementById(elem);
	var element2 = document.getElementById(byside);
	var resizer = document.createElement('div');
	var rsztype = rszt;
	var startX, startY, startWidth, startHeight;
	resizer.className = 'resizer';
	resizer.style.width = '10px';
	resizer.style.height = '10px';
	resizer.style.background = 'red';
	resizer.style.position = 'absolute';
	resizer.style.left = 0;
	resizer.style.top = 0;
	resizer.style.cursor = 'se-resize';
	element.appendChild(resizer);
	resizer.addEventListener('mousedown', initResize, false);
	function initResize(e) {
		startX = e.clientX;
		startY = e.clientY;
		startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
		startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
		window.addEventListener('mousemove', Resize, false);
		window.addEventListener('mouseup', stopResize, false);
		//console.log('init resizable',[startX, startY, startWidth, startHeight])
	}
	function Resize(e) {
		//console.log('Resizable',['element.offsetLeft', element.offsetLeft, 'element.offsetTop', element.offsetTop])
		if(rsztype == 'width'||rsztype=='both'){
			element.style.width = (e.clientX - element.offsetLeft - startX) + 'px';
			if(element2!==undefined)
				element2.style.width = (element.offsetLeft - startX) + 'px';
		}
	   if(rsztype == 'height'||rsztype=='both'){
		   element.style.height = (e.clientY - element.offsetTop) + 'px';
		   if(element2!==undefined)
			   element2.style.height = (element.offsetTop) + 'px';
	   }
		   
	}
	function stopResize(e) {
	    window.removeEventListener('mousemove', Resize, false);
	    window.removeEventListener('mouseup', stopResize, false);
	}
}
