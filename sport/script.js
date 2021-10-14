var buyCtx = {}

function initPage() {
	callApi('product?code=sport', null, function (res) {
		nimbleAction({
			action: 'landing'
		})
		buyCtx = res
		draw()
		hideSpinner()
	})
}

function draw() {
	getById('inner').innerHTML = T('home_prod').render(appCtx)
	if (!getById('stripe_script')) {
		var script = document.createElement('script');
		script.id = 'stripe_script'
		script.src = 'https://js.stripe.com/v3/';
		document.head.appendChild(script);
		script.onload = hideSpinner
	} else
		hideSpinner()
}

function backPrd() {
	document.body.scrollTop = 0
	getById('inner').innerHTML = T('home_prod').render(appCtx)
}

function initBuy() {
	nimbleAction({ action: 'initBuy' })
	gtag('event', 'Clic su Continua', { 'event_category': 'Processo di Acquisto', 'event_label': 'Home' });

	var vs = moment().tz('Europe/Rome')
	var validityStart = vs.valueOf()
	var validityEnd = vs.endOf('day').valueOf()
	buyCtx.params = {
		who: 'me',
		n_days: 1,
		validityStart: validityStart,
		validityEnd: validityEnd,
		period: 'day',
		kids: [{
			firstname: null,
			lastname: null,
			fiscalCode: null
		}]
	}
	buyCtx.logged = userLogged()
	buyCtx.step = null
	buyCtx.profile = buyCtx.logged ? appCtx.user.profile : {}
	showStep(1)
}

function showStep(step, trk) {
	if (!localStorage.getItem('nimbe.bpsa_key')) {
		showModal(T('not_for_you').render())
		return;
	}
	if (buyCtx.step != 1 || checkStep1()) {
		buyCtx.step = step
		getById('inner').innerHTML = T('buy_prod_' + step).render(appCtx)
		document.body.scrollTop = 0

		if (trk && step == 2) {
			gtag('event', 'Clic su Continua', { 'event_category': 'Processo di Acquisto', 'event_label': 'Step 1 - chi vuoi assicurare?/i miei dati' });
			fbq('track', 'ViewContent');
		}
		if (trk && step == 3) {
			gtag('event', 'Clic su Continua', { 'event_category': 'Processo di Acquisto', 'event_label': 'Step 2 - Scegli la polizza' });
			fbq('track', 'InitiateCheckout');
		}

		if (step == 3) {
			callApi('initPayment', {
				productCode: buyCtx.product.code
			}, function (res) {
				buyCtx.stripePublicKey = res.stripePublicKey
				buyCtx.stripeSources = res.sources
				buyCtx.stripeDefaultSource = res.defaultSource
				buyCtx.selectedSource = buyCtx.stripeDefaultSource
				initStripe()
			})
		}
	}
}

function adjWho() {
	saveParams()
	if (getById('who_me').checked)
		buyCtx.params.who = 'me'
	else if (getById('who_plus').checked) {
		buyCtx.params.who = 'plus'
		if (buyCtx.params.kids.length == 5)
			buyCtx.params.kids.splice(4, 1)
	} else if (getById('who_others').checked)
		buyCtx.params.who = 'others'
	getById('inner').innerHTML = T('buy_prod_1').render(appCtx)
}

function addKid() {
	saveParams()
	var kl = (buyCtx.params.who == 'others') ? 5 : 4
	if (buyCtx.params.kids.length < kl) {
		buyCtx.params.kids.push({
			firstname: null,
			lastname: null,
			fiscalCode: null
		})
		getById('inner').innerHTML = T('buy_prod_1').render(appCtx)
	}
}

function removeKid(idx) {
	saveParams()
	buyCtx.params.kids.splice(idx, 1)
	getById('inner').innerHTML = T('buy_prod_1').render(appCtx)
}

function saveParams() {
	if (getById('email'))
		buyCtx.profile.email = getById('email').value.trim()
	if (getById('email_2'))
		buyCtx.profile.email_2 = getById('email_2').value.trim()
	if (getById('firstname'))
		buyCtx.profile.firstname = getById('firstname').value.trim()
	if (getById('lastname'))
		buyCtx.profile.lastname = getById('lastname').value.trim()
	if (getById('fiscalCode'))
		buyCtx.profile.fiscalCode = getById('fiscalCode').value.trim()
	if (getById('mobile'))
		buyCtx.profile.mobile = getById('mobile').value.trim()
	if (getById('address'))
		buyCtx.profile.address = getById('address').value.trim()
	if (getById('zipCode'))
		buyCtx.profile.zipCode = getById('zipCode').value.trim()
	if (getById('city'))
		buyCtx.profile.city = getById('city').value.trim()
	if (getById('stateProvince'))
		buyCtx.profile.stateProvince = getById('stateProvince').value.trim()
	if (getById('country')) {
		buyCtx.profile.country = hasLength(getById('country').value) ? getById('country').value : null
		if (buyCtx.profile.country != 'IT')
			buyCtx.profile.stateProvince = 'EE'
	}
	if (getById('is_adult'))
		buyCtx.profile.adult = getById('is_adult').checked

	for (var i = 0; i < buyCtx.params.kids.length; i++) {
		if (getById('firstname_' + i))
			buyCtx.params.kids[i].firstname = getById('firstname_' + i).value.trim()
		if (getById('lastname_' + i))
			buyCtx.params.kids[i].lastname = getById('lastname_' + i).value.trim()
		if (getById('fiscalCode_' + i))
			buyCtx.params.kids[i].fiscalCode = getById('fiscalCode_' + i).value.trim()
		if (getById('country_' + i))
			buyCtx.params.kids[i].country = getById('country_' + i).value
	}
}

function addDay() {
	if (buyCtx.params.n_days < 3)
		buyCtx.params.n_days++
	usePeriod('day')
}

function subDay() {
	if (buyCtx.params.n_days > 1)
		buyCtx.params.n_days--
	usePeriod('day')
}

function usePeriod(period) {
	buyCtx.params.period = period
	adjParams()
}

function useValidityStart() {
	buyCtx.params.validityStart = parseInt(getById('validityStart').value, 10)
	adjParams()
}

function adjValidityEnd() {
	var vs = moment(buyCtx.params.validityStart).tz('Europe/Rome')
	if (buyCtx.params.period == 'day')
		buyCtx.params.validityEnd = vs.add(buyCtx.params.n_days - 1, 'day').endOf('day').valueOf()
	else if (buyCtx.params.period == 'week')
		buyCtx.params.validityEnd = vs.add(6, 'day').endOf('day').valueOf()
	else if (buyCtx.params.period == 'month')
		buyCtx.params.validityEnd = vs.add(29, 'day').endOf('day').valueOf()
	else
		buyCtx.params.validityEnd = vs.add(1, 'year').endOf('day').valueOf()
}

function adjParams() {
	adjValidityEnd()
	getById('inner').innerHTML = T('buy_prod_2').render(appCtx)
}

var stripe
function initStripe() {
	stripe = Stripe(buyCtx.stripePublicKey)

	getById('stripe').innerHTML = T('stripe').render(buyCtx)

	getById('buyButton').stripeComplete = buyCtx.selectedSource != null
	getById('buyButtonM').stripeComplete = buyCtx.selectedSource != null
	adjButton()

	var elements = stripe.elements({
		locale: ns_lang
	})
	var card = elements.create('card', {
		style: {
			base: {
				color: '#333333',
				fontFamily: 'Helvetica, sans-serif',
				fontSize: '16px',
				'::placeholder': {
					color: '#979797'
				}
			}
		},
		hidePostalCode: true
	})
	card.mount('#card-element')

	card.addEventListener('change', function (event) {
		getById('buyButton').stripeComplete = event.complete
		getById('buyButtonM').stripeComplete = event.complete
		if (event.error)
			getById('card-errors').innerHTML = event.error.message
		else
			getById('card-errors').innerHTML = ''
		adjButton()
	})

	getById('buyButton').addEventListener('click', function () {
		if (checkProceed()) {
			if (buyCtx.selectedSource == null)
				createPaymentMethodAndCallBuy(stripe, card)
			else
				callBuy(stripe, card)
		}
	})
	getById('buyButtonM').addEventListener('click', function () {
		if (checkProceed()) {
			if (buyCtx.selectedSource == null)
				createPaymentMethodAndCallBuy(stripe, card)
			else
				callBuy(stripe, card)
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
	for (var i = 0; i < buyCtx.stripeSources.length; i++) {
		var id = buyCtx.stripeSources[i].id
		if (selectedId == id)
			getById(id).addClass('selected')
		else
			getById(id).removeClass('selected')
	}
	if (getById('payment-form').style.display = 'none')
		getById('addCard').style.display = 'block'
	buyCtx.selectedSource = selectedId
	getById('buyButton').stripeComplete = buyCtx.selectedSource != null
	getById('buyButtonM').stripeComplete = buyCtx.selectedSource != null
	adjButton()
}

function createPaymentMethodAndCallBuy(stripe, card) {
	showSpinner()
	stripe.createPaymentMethod('card', card).then(function (result) {
		if (result.error) {
			var errorElement = document.getElementById('card-errors');
			errorElement.textContent = result.error.message;
			hideSpinner()
		} else {
			showSpinner()
			callApi('buy', getPayload(result), confirmOrCongrats, manageErr)
		}
	});
}

function callBuy(stripe, card) {
	showSpinner()
	callApi('buy', getPayload(), confirmOrCongrats, manageErr)
}

function adjButton() {
	var adequate = getById('adq_y').checked || getById('adq_f').checked
	var docs = getById('contract').checked && getById('allegati').checked && getById('health').checked
	if (getById('buyButton').stripeComplete && adequate && docs) {
		getById('buyButton').removeClass('disabled')
		getById('buyButtonM').removeClass('disabled')
	} else {
		getById('buyButton').addClass('disabled')
		getById('buyButtonM').addClass('disabled')
	}
}

function errStep1() {
	if (buyCtx.step != 1) {
		buyCtx.step = 1
		getById('inner').innerHTML = T('buy_prod_1').render(appCtx)
	}
}

function checkStep1() {
	console.log('checkStep1')
	if (buyCtx.step == 1)
		saveParams()
	var proceed = true;
	buyCtx.params.fullcf = true
	var st = 999999
	if (!emailRex.test(buyCtx.profile.email)) {
		proceed = false
		errStep1()
		getById('email').addClass('error')
		st = Math.min(st, getById('profile').offsetTop - 140)
	}
	if (!buyCtx.logged && buyCtx.profile.email_2.toLowerCase() != buyCtx.profile.email.toLowerCase()) {
		proceed = false
		errStep1()
		getById('email_2').addClass('error')
		st = Math.min(st, getById('profile').offsetTop - 140)
	}
	if (!hasLength(buyCtx.profile.firstname)) {
		proceed = false
		errStep1()
		getById('firstname').addClass('error')
		st = Math.min(st, getById('profile').offsetTop - 140)
	}
	if (!hasLength(buyCtx.profile.lastname)) {
		proceed = false
		errStep1()
		getById('lastname').addClass('error')
		st = Math.min(st, getById('profile').offsetTop - 140)
	}
	if (!hasLength(buyCtx.profile.address)) {
		proceed = false;
		errStep1()
		getById('address').addClass('error')
		st = Math.min(st, getById('profile').offsetTop - 140)
	}
	if (!hasLength(buyCtx.profile.city)) {
		proceed = false;
		errStep1()
		getById('city').addClass('error')
		st = Math.min(st, getById('profile').offsetTop - 140)
	}
	if (!hasLength(buyCtx.profile.stateProvince)) {
		proceed = false;
		errStep1()
		getById('stateProvince').addClass('error')
		st = Math.min(st, getById('profile').offsetTop - 140)
	}
	if (!hasLength(buyCtx.profile.zipCode)) {
		proceed = false;
		errStep1()
		getById('zipCode').addClass('error')
		st = Math.min(st, getById('profile').offsetTop - 140)
	}
	if (!hasLength(buyCtx.profile.country)) {
		proceed = false
		errStep1()
		getById('country').addClass('error')
		st = Math.min(st, getById('profile').offsetTop - 140)
	}
	if (hasLength(buyCtx.profile.mobile) && !mobileRex.test(buyCtx.profile.mobile)) {
		proceed = false
		errStep1()
		getById('mobile').addClass('error')
		st = Math.min(st, getById('profile').offsetTop - 140)
	}
	var cf = CF.check(buyCtx.profile.fiscalCode, buyCtx.profile) ? CF.reverse(buyCtx.profile.fiscalCode) : null
	if (!(cf != null && cf.age > 17 && cf.age < 71)) {
		proceed = false
		errStep1()
		getById('fiscalCode').addClass('error')
		st = Math.min(st, getById('profile').offsetTop - 140)
	}
	if (buyCtx.params.who != 'me') {
		for (var i = 0; i < buyCtx.params.kids.length; i++) {
			if (!hasLength(buyCtx.params.kids[i].firstname)) {
				proceed = false;
				errStep1()
				getById('firstname_' + i).addClass('error')
				st = Math.min(st, getById('kid_' + i).offsetTop - 140)
			}
			if (!hasLength(buyCtx.params.kids[i].lastname)) {
				proceed = false;
				errStep1()
				getById('lastname_' + i).addClass('error')
				st = Math.min(st, getById('kid_' + i).offsetTop - 140)
			}
			if (!hasLength(buyCtx.params.kids[i].country)) {
				proceed = false
				errStep1()
				getById('country_' + i).addClass('error')
				st = Math.min(st, getById('kid_' + i).offsetTop - 140)
			} else {
				if (buyCtx.params.kids[i].country == 'IT') {
					var cf = CF.check(buyCtx.params.kids[i].fiscalCode, buyCtx.params.kids[i]) ? CF.reverse(buyCtx.params.kids[i].fiscalCode) : null
					if (!(cf != null && cf.age < 71)) {
						proceed = false
						errStep1()
						getById('fiscalCode_' + i).addClass('error')
						st = Math.min(st, getById('kid_' + i).offsetTop - 140)
					}
				} else
					buyCtx.params.fullcf = false
			}
		}
	}
	if (!buyCtx.params.fullcf && (buyCtx.params.period == 'year' || buyCtx.params.period == 'month')) {
		buyCtx.params.period = 'day'
		adjValidityEnd()
	}
	if (!proceed)
		document.body.scrollTop = st
	return proceed;
}

function checkProceed() {
	var proceed = checkStep1()
	var st = 999999
	if (proceed) {
		if (!getById('buyButton').stripeComplete) {
			proceed = false
			if (getById('card-errors').innerHTML == '')
				getById('card-errors').innerHTML = 'Dati pagamento incompleti o errati';
			st = Math.min(st, getById('pay').offsetTop - 140)
		}
		if (!getById('allegati').checked) {
			getById('allegati').addClass('error')
			proceed = false
			st = Math.min(st, getById('checks').offsetTop - 140)
		}
		if (!getById('contract').checked) {
			getById('contract').addClass('error')
			proceed = false
			st = Math.min(st, getById('checks').offsetTop - 140)
		}
		if (!getById('health').checked) {
			getById('health').addClass('error')
			proceed = false
			st = Math.min(st, getById('checks').offsetTop - 140)
		}
		if (!getById('adq_y').checked && !getById('adq_n').checked) {
			getById('adq_y').addClass('error')
			getById('adq_n').addClass('error')
			proceed = false
			st = Math.min(st, getById('adq').offsetTop - 80)
		}
		if (!proceed)
			document.body.scrollTop = st
	}
	return proceed;
}

function getPayload(result) {
	if (result && result.paymentIntent)
		return {
			proposalCode: buyCtx.proposalCode,
			payment: {
				payment_intent_id: result.paymentIntent.id,
				premium: doPrice(),
			}
		}
	else {
		buyCtx.params.cf = CF.reverse(buyCtx.profile.fiscalCode)
		buyCtx.params.adq = getById('adq_y').checked ? 'yes' : 'forced'
		buyCtx.params.price = '' + doPrice().toFixed(2)
		buyCtx.params.profile = buyCtx.profile
		if (buyCtx.params.who != 'me')
			for (var i = 0; i < buyCtx.params.kids.length; i++) {
				if (buyCtx.params.kids[i].country == 'IT')
					buyCtx.params.kids[i].cf = CF.reverse(buyCtx.params.kids[i].fiscalCode)
				else
					delete buyCtx.params.kids[i].cf
			}
		return {
			timezone: moment.tz.guess(),
			profile: buyCtx.profile,
			deviceUid: deviceUid(),
			parameters: buyCtx.params,
			productCode: buyCtx.product.code,
			payment: {
				currency: 'EUR',
				premium: doPrice(),
				payment_method_id: result ? result.paymentMethod.id : buyCtx.selectedSource
			}
		}
	}
}

function doPrice(period) {
	var prd = period ? period : buyCtx.params.period
	var price = 0
	if (prd == 'year')
		price = 120
	else if (prd == 'month')
		price = 30
	else if (prd == 'week')
		price = 15
	else
		price = buyCtx.params.n_days * 3.5
	if (buyCtx.params.who == 'plus')
		price *= (buyCtx.params.kids.length + 1)
	else if (buyCtx.params.who == 'others')
		price *= buyCtx.params.kids.length
	if (period == buyCtx.params.period)
		buyCtx.params.price = '' + price.toFixed(2)
	return price
}

function doSPrice(period) {
	return sPrice(doPrice(period))
}

function congrats(res) {
	buyCtx.policy = res.policy
	document.body.scrollTop = 0
	getById('inner').innerHTML = T('congrats').render(appCtx)

	gtag('event', 'Acquisto Completato', { 'event_category': 'Processo di Acquisto' });
	fbq('track', 'Purchase', {value: res.policy.premium, currency: 'EUR'});

	hideSpinner()
}

function confirmOrCongrats(res) {
	if (res.policy)
		congrats(res)
	else {
		stripe.handleCardAction(res.confirmationInfo.secret).then(function (result) {
			if (result.error) {
				manageErr(result.error)
			} else {
				showSpinner()
				buyCtx.proposalCode = res.proposalCode
				callApi('buy', getPayload(result), confirmOrCongrats, manageErr)
			}
		})
	}
}

function toggleExclusion() {
	if (getById('exclusion').hasClass('on'))
		getById('exclusion').removeClass('on')
	else
		getById('exclusion').addClass('on')
}

function showAde() {
	getById('adq_f').checked = false
	toggleAde(getById('adq_f'))
	if (getById('adq_n').checked) {
		getById('price_smrt').hideMe()
		getById('panel_smrt').hideMe()
		getById('clicking').hideMe()
		getById('ade').showMe()
		document.body.scrollTop = getById('ade').offsetTop - 80
	} else {
		getById('price_smrt').showMe()
		getById('panel_smrt').showMe()
		getById('clicking').showMe()
		getById('ade').hideMe()
	}
	adjButton()
}

function toggleAde(obj) {
	if (obj.checked) {
		getById('ignore').hideMe()
		getById('ade_ok').showMe()
		getById('ade_ko').hideMe()
		getById('price_smrt').showMe()
		getById('panel_smrt').showMe()
		getById('clicking').showMe()
	} else {
		getById('ignore').showMe()
		getById('ade_ok').hideMe()
		getById('ade_ko').showMe()
		getById('price_smrt').hideMe()
		getById('panel_smrt').hideMe()
		getById('clicking').hideMe()
	}
	adjButton()
}

function manageErr(obj) {
	console.log(obj);
	backPrd()
	hideSpinner()
	showModal(T('pay_error').render())
}

function adjCountry(idx) {
	saveParams()
	if (!idx) {
		if (buyCtx.profile.country == 'IT')
			getById('sp_field').showMe()
		else
			getById('sp_field').hideMe()
	} else {
		if (getById('country' + idx).value == 'IT')
			getById('fc_field' + idx).showMe()
		else
			getById('fc_field' + idx).hideMe()
	}
}
