var subCtx = {}

function initPage() {
	if (getParameter('magicToken')) {
		draw()
		hideSpinner()
		return;
	}
	callApi('policy?proposalCode=' + getParameter("code"), null, function(res) {
		subCtx = res
		draw()
		if (!getById('stripe_script')) {
			var script = document.createElement('script');
			script.id = 'stripe_script'
			script.src = 'https://js.stripe.com/v3/';
			document.head.appendChild(script);
			script.onload = continueInitPage
		} else
			continueInitPage()

	}, goGroup, function(res) {
		forgetUser()
		draw()
		showLogin()
		hideSpinner()
	})
}

function continueInitPage(){
	hideSpinner()
	callApi('initPayment', {
		productCode : subCtx.product.code
	}, function(res) {
		subCtx.stripePublicKey = res.stripePublicKey
		subCtx.stripeSources = res.sources
		subCtx.stripeDefaultSource = subCtx.policy.parameters.subscriptionPaymentId
		subCtx.selectedSource = subCtx.stripeDefaultSource
		initStripe()
	})
}

function draw() {
	getById('inner').innerHTML = T('subscription').render(appCtx)
}

var stripe
function initStripe() {
	stripe = Stripe(subCtx.stripePublicKey)

	getById('stripe').innerHTML = T('stripe').render(subCtx)

	getById('chooseButton').stripeComplete = subCtx.selectedSource != null
	adjButton()

	var elements = stripe.elements({
		locale : ns_lang
	})
	var card = elements.create('card', {
		style : {
			base : {
				color : '#333333',
				fontFamily : 'Helvetica, sans-serif',
				fontSize : '16px',
				'::placeholder' : {
					color : '#979797'
				}
			}
		},
		hidePostalCode : true
	})
	card.mount('#card-element')

	card.addEventListener('change', function(event) {
		getById('chooseButton').stripeComplete = event.complete
		if (event.error)
			getById('card-errors').innerHTML = event.error.message
		else
			getById('card-errors').innerHTML = ''
		adjButton()
	})

	getById('chooseButton').addEventListener('click', function() {
		if (getById('chooseButton').stripeComplete && subCtx.stripeDefaultSource != subCtx.selectedSource) {
			if (subCtx.selectedSource == null)
				createPaymentMethodAndCallChoose(stripe, card)
			else
				callChoose(stripe, card)
		}
	})
}

function addCard() {
	selectPaymentSrc(null)
	if (getById('payment-form').style.display == 'block') {
		getById('payment-form').style.display = 'none'
		return;
	}
	if (getById('payment-form').style.display == 'none')
		getById('payment-form').style.display = 'block'
	if (getById('payment-form').style.display = 'block')
		getById('addCard').style.display = 'none'
}

function selectPaymentSrc(selectedId) {
	for (var i = 0; i < subCtx.stripeSources.length; i++) {
		var id = subCtx.stripeSources[i].id
		if (selectedId == id)
			getById(id).addClass('selected')
		else
			getById(id).removeClass('selected')
	}
	if (getById('payment-form').style.display = 'none')
		getById('addCard').style.display = 'block'
	subCtx.selectedSource = selectedId
	getById('chooseButton').stripeComplete = subCtx.selectedSource != null
	adjButton()
}

function createPaymentMethodAndCallChoose(stripe, card) {
	showSpinner()
	stripe.createPaymentMethod('card', card).then(function(result) {
		if (result.error) {
			var errorElement = document.getElementById('card-errors');
			errorElement.textContent = result.error.message;
			hideSpinner()
		} else {
			showSpinner()
			callApi('task', getPayload(result), chooseDone, manageErr)
		}
	});
}

function callChoose(stripe, card) {
	showSpinner()
	callApi('task', getPayload(), chooseDone, manageErr)
}

function chooseDone(res) {
	initPage()
}

function getPayload(result) {
	var payload = {
		task : 'updateCard',
		productCode : 'pet',
		parameters : {
			proposalCode : subCtx.policy.proposalCode
		}
	}
	if (result && result.paymentMethod.id)
		payload.parameters.payment_method_id = result.paymentMethod.id
	else
		payload.parameters.payment_method_id = subCtx.selectedSource
	return payload
}

function adjButton() {
	if (getById('chooseButton').stripeComplete && subCtx.stripeDefaultSource != subCtx.selectedSource)
		getById('chooseButton').removeClass('disabled')
	else
		getById('chooseButton').addClass('disabled')
}

function showConfirm() {
	getById('inner').innerHTML = T('confirm').render(subCtx)
	document.body.scrollTop = 0
}

function doDelete() {
	showSpinner()
	callApi('task', {
		task : 'close',
		productCode : 'pet',
		parameters : {
			proposalCode : subCtx.policy.proposalCode
		}
	}, function(res) {
		hideSpinner()
		getById('inner').innerHTML = T('deleted').render(subCtx)
	}, manageErr)
}

function manageErr(obj) {
	console.log(obj);
	hideSpinner()
	showModal(T('pay_error').render())
}
