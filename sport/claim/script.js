var claimCtx = {}

function initPage() {
	callApi('policy?proposalCode=' + getParameter("code"), null, function(res) {
		claimCtx = res
		draw()
		hideSpinner()
	}, goGroup, goGroup)
}

function draw() {
	getById('inner').innerHTML = T('claim').render(appCtx)
	retriveClaimPayload()
}

function retriveClaimPayload() {
	var retVal = localStorage.getItem('sport_claimData_' + claimCtx.policy.proposalCode)
	if (retVal) {
		retVal = JSON.parse(retVal);
		getById('when').value = retVal.when
		getById('time').value = retVal.time
		getById('where').value = retVal.where
		getById('what').value = retVal.what
		for (var j = retVal.photos.med.length - 1; j >= 0; j--)
			usePhoto('med', retVal.photos.med[j])
		for (var j = retVal.photos.rad.length - 1; j >= 0; j--)
			usePhoto('rad', retVal.photos.rad[j])
	}
}

function storeClaimPayload() {
	localStorage.setItem('sport_claimData_' + claimCtx.policy.proposalCode, JSON.stringify(getClaimPayload()));
}

function getClaimPayload() {
	var payload = {
		when : getById('when').value,
		time : getById('time').value,
		where : getById('where').value.trim(),
		what : getById('what').value.trim(),
		photos : getPhotosPayload()
	}
	return payload
}

function checkIfEmpty() {
	var proceed = true;
	var n = "";
	if (!getById("rad").firstElementChild.classList.contains('photo')) {
		proceed = false;
		getById('esameRadio').addClass('error');
		n = 'esameRadio';
	}
	if (!getById("med").firstElementChild.classList.contains('photo')) {
		proceed = false;
		getById('certificatoPS').addClass('error');
		n = 'certificatoPS';
	}
	if (getById('what').value.trim() == '') {
		proceed = false;
		getById('what').addClass('error');
		n = 'what';
	}
	if (getById('where').value.trim() == '') {
		proceed = false;
		getById('where').addClass('error');
		n = 'where';
	}
	if (getById('time').value.trim() == '') {
		proceed = false;
		getById('time').addClass('error');
		n = 'time';
	}
	if (getById('when').value.trim() == '') {
		proceed = false;
		getById('when').addClass('error');
		n = 'when';
	}
	if (!proceed) {
		getById(n).scrollIntoView();
		window.scrollBy(0, -160);
	}
	return proceed;
}

function sendClaim() {
	if (checkIfEmpty()) {
		storeClaimPayload()
		showSpinner()
		callApi('claim', {
			proposalCode : claimCtx.policy.proposalCode,
			deviceUid : deviceUid(),
			timezone : moment.tz.guess(),
			claim : getClaimPayload()
		}, sent, manageErr)
	}
}

function sent() {
	document.body.scrollTop = 0
	getById('inner').innerHTML = T('sent').render(appCtx)
	hideSpinner()
}

function manageErr(obj) {
	console.log(obj);
	hideSpinner()
	showModal(T('pay_error').render())
}

function getPhotosPayload() {
	var retval = {
		med : [],
		rad : []
	}

	var el = getById('med').children
	for (var i = 0; i < el.length; i++)
		if (el[i].className == 'photo')
			retval.med.push(el[i].children[0].src);
	var el = getById('rad').children
	for (var i = 0; i < el.length; i++)
		if (el[i].className == 'photo')
			retval.rad.push(el[i].children[0].src);
	return retval
}

var photoArea = null;
function addPhoto(obj, area) {
	photoArea = area
	var fr = new FileReader()
	fr.onload = function() {
		usePhotoArea(fr.result)
		obj.value = null
	}
	fr.readAsDataURL(obj.files[0])
}

function usePhotoArea(res) {
	applyWaterMark(res, function(imgData) {
		usePhoto(photoArea, imgData)
	})
}

function usePhoto(area, imgData) {
	var div = document.createElement('div')
	getById(area).insertBefore(div, getById(area).firstChild);
	div.outerHTML = T('photo').render({
		imgData : imgData
	})
	storeClaimPayload()
}

function removePhoto(obj) {
	obj.parentNode.parentNode.removeChild(obj.parentNode)
	storeClaimPayload()
}

function applyWaterMark(imgData, okHandler) {
	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');
	var img = new Image();
	img.onload = function() {
		var wmImg = new Image()
		wmImg.onload = function() {
			var rt = img.width / img.height
			console.log('rt: ' + rt)

			if (rt > 1) {
				var width = 1024
				var height = Math.round(width / rt);
			} else {
				var height = 1024
				var width = Math.round(height * rt);
			}
			console.log('width: ' + width)
			console.log('height: ' + height)

			canvas.width = width
			canvas.height = height
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
			ctx.drawImage(wmImg, canvas.width - 240, canvas.height - 80, 240, 80)

			ctx.font = '300 16px Catamaran';
			ctx.fillStyle = 'rgb(204,204,204)';
			var m = new moment()
			ctx.fillText(m.format('DD/MM/YYYY'), canvas.width - 140, canvas.height - 45);
			ctx.fillText(m.format('hh.mm.ss') + ' ' + moment.tz.zone(moment.tz.guess()).abbr(m), canvas.width - 140, canvas.height - 25);
			okHandler(canvas.toDataURL('image/jpeg'))
		}
		wmImg.src = 'wm_bck.svg'
	}
	img.src = imgData;
}