function initPage() {
	draw()
	hideSpinner()
}

function draw() {
	getById('inner').innerHTML = T('home_contact').render(appCtx)
}

function sendMsg() {
	var proceed = true
	if (!emailRex.test(getById('cnt_email').value.trim())) {
		proceed = false
		getById('cnt_email').addClass('error')
	}
	if (getById('cnt_firstname').value.trim() == '') {
		proceed = false
		getById('cnt_firstname').addClass('error')
	}
	if (getById('cnt_lastname').value.trim() == '') {
		proceed = false
		getById('cnt_lastname').addClass('error')
	}
	if (getById('message').value.trim() == '') {
		proceed = false
		getById('message').addClass('error')
	}
	if (proceed) {
		showSpinner()
		callApi('contact', {
			productCode : getInfo(),
			email : getById('cnt_email').value.trim(),
			firstname : getById('cnt_firstname').value.trim(),
			lastname : getById('cnt_lastname').value.trim(),
			message : getById('message').value.trim()
		}, function(res) {
			document.body.scrollTop = 0
			getById('inner').innerHTML = T('home_contact_confirm').render(appCtx)
			hideSpinner()
		}, initPage, initPage)
		gtag('event', 'Form Inviato', { 'event_category': 'Form Contatti', 'event_label': '/contact/index.html' });
		gtag('event', 'conversion', { 'send_to': 'AW-458901674/ghZfCOzaoPUBEKqR6doB'});
		fbq('track', 'Lead');
	}
}

function getInfo() {
	return sessionStorage.getItem('nimble.contact.info')
}
