var buyCtx = {}

function initPage() {
	callApi('product?code=pet', null, function(res) {
		nimbleAction({
			action : 'landing'
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
	nimbleAction({
		action : 'initBuy'
	})
	gtag('event', 'Clic su Continua', {
		'event_category' : 'Processo di Acquisto',
		'event_label' : 'Home'
	});

	var vs = moment().tz('Europe/Rome')
	var validityStart = vs.valueOf()
	var validityEnd = vs.add(1, 'month').endOf('day').valueOf()
	buyCtx.params = {
		who : 'dog',
		plan : 'gold',
		validityStart : validityStart,
		validityEnd : validityEnd
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
		nimbleAction({
			action : 'step',
			details : {
				step : step
			}
		})
		buyCtx.step = step
		getById('inner').innerHTML = T('buy_prod_' + step).render(appCtx)
		document.body.scrollTop = 0

		if (step == 1) {
			initTraceForm()
			fbq('trackCustom', 'Clic su Continua - Home')
		}

		if (trk && step == 2) {
			gtag('event', 'Clic su Continua', {
				'event_category' : 'Processo di Acquisto',
				'event_label' : 'Step 1 - chi vuoi assicurare?/i miei dati'
			});
			fbq('track', 'ViewContent')
			fbq('trackCustom', 'Clic su Continua - Step 1 - chi vuoi assicurare?/i miei dati')
		}
		if (trk && step == 3) {
			gtag('event', 'Clic su Continua', {
				'event_category' : 'Processo di Acquisto',
				'event_label' : 'Step 2 - Scegli la polizza'
			});
			fbq('track', 'InitiateCheckout')
			fbq('trackCustom', 'Clic su Continua - Step 2 - Scegli la polizza')
		}

		if (step == 3) {
			callApi('initPayment', {
				productCode : buyCtx.product.code
			}, function(res) {
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
	if (getById('who_dog').checked)
		buyCtx.params.who = 'dog'
	else
		buyCtx.params.who = 'cat'
	getById('inner').innerHTML = T('buy_prod_1').render(appCtx)
}

function adjPlan() {
	if (getById('plan_gold').checked)
		buyCtx.params.plan = 'gold'
	else
		buyCtx.params.plan = 'silver'
	getById('inner').innerHTML = T('buy_prod_2').render(appCtx)
}

function saveParams() {
	if (getById('petName'))
		buyCtx.params.petName = getById('petName').value.trim()

	if (getById('day'))
		buyCtx.params.bDay = getById('day').value
	if (getById('month'))
		buyCtx.params.bMonth = getById('month').value
	if (getById('year'))
		buyCtx.params.bYear = getById('year').value
	buyCtx.params.petBirthday = buyCtx.params.bYear + '-' + buyCtx.params.bMonth + '-' + buyCtx.params.bDay

	if (getById('chip'))
		buyCtx.params.chip = getById('chip').value.trim()
	if (getById('bookOk'))
		buyCtx.params.bookOk = getById('bookOk').checked

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
}

var fmd;
function initTraceForm() {
	fmd = null
	setTimeout(traceForm, 200)
}

function traceForm() {
	if (!getById('petName'))
		return;
	saveParams()
	var details = {
		who : buyCtx.params.who,
		petName : hasLength(buyCtx.params.petName),
		petBirthday : (buyCtx.params.petBirthday.length == 10) ? buyCtx.params.petBirthday : '-',
		chip : hasLength(buyCtx.params.chip),
		bookOk : buyCtx.params.bookOk,
		email : hasLength(buyCtx.profile.email),
		firstname : hasLength(buyCtx.profile.firstname),
		lastname : hasLength(buyCtx.profile.lastname),
		fiscalCode : hasLength(buyCtx.profile.fiscalCode),
		mobile : hasLength(buyCtx.profile.mobile),
		address : hasLength(buyCtx.profile.address),
		zipCode : hasLength(buyCtx.profile.zipCode),
		city : hasLength(buyCtx.profile.city),
		stateProvince : hasLength(buyCtx.profile.stateProvince),
		country : hasLength(buyCtx.profile.country)
	}
	var nfmd = JSON.stringify(details)
	if (!fmd)
		fmd = nfmd
	if (nfmd != fmd) {
		fmd = nfmd
		nimbleAction({
			action : 'form',
			details : details
		})
	}
	setTimeout(traceForm, 200)
}

function adjParams() {
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
		getById('buyButton').stripeComplete = event.complete
		getById('buyButtonM').stripeComplete = event.complete
		if (event.error)
			getById('card-errors').innerHTML = event.error.message
		else
			getById('card-errors').innerHTML = ''
		adjButton()
	})

	getById('buyButton').addEventListener('click', function() {
		if (checkProceed()) {
			if (buyCtx.selectedSource == null)
				createPaymentMethodAndCallBuy(stripe, card)
			else
				callBuy(stripe, card)
		}
	})
	getById('buyButtonM').addEventListener('click', function() {
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
	stripe.createPaymentMethod('card', card).then(function(result) {
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
	var docs = getById('contract').checked && getById('allegati').checked
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

function checkPetAge() {
	var ma = monthAge(buyCtx.params.petBirthday)
	return (ma > 5 && ma < 120)
}

function monthAge(birthday) {
	var now = new Date()
	var dob = new Date(birthday)
	var ya = now.getFullYear() - dob.getFullYear()
	var ma = now.getMonth() - dob.getMonth()
	if (now.getMonth() < dob.getMonth()) {
		ya--
		ma += 12
	}
	if (now.getDate() < dob.getDate()) {
		ma--
		if (ma < 0) {
			ma = 11
			ya--
		}
	}
	return ya * 12 + ma
}

function checkStep1() {
	console.log('checkStep1')
	if (buyCtx.step == 1)
		saveParams()
	var proceed = true;
	var st = 999999

	if (!hasLength(buyCtx.params.petName)) {
		proceed = false
		errStep1()
		getById('petName').addClass('error')
		st = Math.min(st, getById('who').offsetTop - 140)
	}
	var petBirthday = null
	try {
		petBirthday = new moment(buyCtx.params.petBirthday)
	} catch (err) {
	}
	if (!petBirthday || !petBirthday.isValid() || !checkPetAge()) {
		proceed = false
		errStep1()
		getById('day').addClass('error')
		getById('month').addClass('error')
		getById('year').addClass('error')
		st = Math.min(st, getById('who').offsetTop - 140)
	}
	var chipRex = /^[0-9]{15}$/

	if (!chipRex.test(buyCtx.params.chip)) {
		proceed = false
		errStep1()
		getById('chip').addClass('error')
		st = Math.min(st, getById('who').offsetTop - 140)
	}
	if (!buyCtx.params.bookOk) {
		proceed = false
		errStep1()
		getById('bookOk').addClass('error')
		st = Math.min(st, getById('who').offsetTop - 140)
	}

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
			proposalCode : buyCtx.proposalCode,
			payment : {
				payment_intent : result.paymentIntent,
				subscription_id : buyCtx.confirmationInfo.subscription_id,
				payment_type : 'subscription'
			}
		}
	else {
		buyCtx.params.cf = CF.reverse(buyCtx.profile.fiscalCode)
		buyCtx.params.adq = getById('adq_y').checked ? 'yes' : 'forced'
		buyCtx.params.price = '' + doPrice().toFixed(2)
		buyCtx.params.profile = buyCtx.profile
		var cd = new moment().tz('Europe/Rome').add(120 - monthAge(buyCtx.params.petBirthday), 'month')
		return {
			timezone : moment.tz.guess(),
			profile : buyCtx.profile,
			deviceUid : deviceUid(),
			parameters : buyCtx.params,
			productCode : buyCtx.product.code,
			payment : {
				currency : 'EUR',
				payment_method_id : result ? result.paymentMethod.id : buyCtx.selectedSource,
				payment_type : 'subscription',
				premium : doPrice(),
				cancel_at : Math.floor(cd.valueOf() / 1000)
			}
		}
	}
}

function doPrice() {
	return (buyCtx.params.plan == 'gold') ? 11 : 7
}

function congrats(res) {
	buyCtx.policy = res.policy
	document.body.scrollTop = 0
	getById('inner').innerHTML = T('congrats').render(appCtx)

	gtag('event', 'Acquisto Completato - ' + res.policy.parameters.plan, {
		'event_category' : 'Processo di Acquisto'
	});
	fbq('track', 'Purchase', {
		value : res.policy.premium,
		currency : 'EUR'
	});

	hideSpinner()
}

function confirmOrCongrats(res) {
	if (res.policy)
		congrats(res)
	else {
		buyCtx.confirmationInfo = res.confirmationInfo
		stripe.handleCardPayment(res.confirmationInfo.secret).then(function(result) {
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
		getById('price_pet').hideMe()
		getById('panel_pet').hideMe()
		getById('clicking').hideMe()
		getById('ade').showMe()
		document.body.scrollTop = getById('ade').offsetTop - 80
	} else {
		getById('price_pet').showMe()
		getById('panel_pet').showMe()
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
		getById('price_pet').showMe()
		getById('panel_pet').showMe()
		getById('clicking').showMe()
	} else {
		getById('ignore').showMe()
		getById('ade_ok').hideMe()
		getById('ade_ko').showMe()
		getById('price_pet').hideMe()
		getById('panel_pet').hideMe()
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

function adjCountry() {
	saveParams()
	if (buyCtx.profile.country == 'IT')
		getById('sp_field').showMe()
	else
		getById('sp_field').hideMe()
}

function removeDateErr() {
	getById('day').removeClass('error')
	getById('month').removeClass('error')
	getById('year').removeClass('error')
}

function traceNum(){
	nimbleAction({
		action : 'contact_num'
	})
}
