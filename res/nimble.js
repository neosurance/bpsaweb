function getById(id) {
	return document.getElementById(id)
}

function getByQ(q) {
	return document.querySelector(q)
}

function getAllByQ(q) {
	return document.querySelectorAll(q)
}

function hasClass(obj, name) {
	return (obj.classList.contains(name))
}

function addClass(obj, name) {
	if (!obj.classList.contains(name)) {
		obj.classList.add(name)
		obj.offsetHeight
	}
}

function removeClass(obj, name) {
	if (obj.classList.contains(name)) {
		obj.classList.remove(name)
		obj.offsetHeight
	}
}

HTMLElement.prototype.hasClass = function(name) {
	return hasClass(this, name);
}

HTMLElement.prototype.addClass = function(name) {
	addClass(this, name)
}

HTMLElement.prototype.removeClass = function(name) {
	removeClass(this, name)
}

function toText(o) {
	return o == null ? '' : o.toString()
}

function encodeHTML(t) {
	let d = document.createElement('div')
	d.textContent = t
	return d.innerHTML
}

function encodeAttribute(a) {
	return encodeHTML(a).replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function hasLength(s) {
	return toText(s).trim() != ''
}

function randomCode(len) {
	len = len ? len : 18
	var retval = ''
	var CH_CODE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
	var num = new Date().getTime()
	var n = Math.ceil(Math.log(num) / Math.log(CH_CODE.length))
	for (var i = 0; i < n; i++) {
		retval += CH_CODE.charAt(num % CH_CODE.length)
		num /= CH_CODE.length;
	}
	for (var i = retval.length; i < len; i++)
		retval += CH_CODE.charAt(Math.random() * CH_CODE.length)
	return retval
}

function getParameter(name) {
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]")
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search)
	return results == null ? null : decodeURIComponent(results[1].replace(/\+/g, " "))
}

function T(key, src) { // _T reserved keyword
	function compile(src) {
		let t = '(function(ctx){for(let _T in ctx)try{eval("var "+_T+"=ctx."+_T)}catch(e){}let _T={T:""};'
		for (let tag = null, ps = src.split(/(\[%=|\[%|%\])/g), i = 0; i < ps.length; i++)
			if (ps[i] == '[%' || ps[i] == '[%=' || ps[i] == '%]')
				tag = ps[i] == '%]' ? null : ps[i]
			else
				t += (tag ? (tag == '[%=' ? '_T.O=' + ps[i].trim() + ';_T.T+=_T.O==null?"":_T.O;' : ps[i]) : '_T.T+=' + JSON.stringify(ps[i]) + ';')
		t += 'return _T.T})'
		return eval(t)
	}
	return {
		render : T[key] || (src ? T[key] = compile(src) : ((src = document.querySelector('script[type=T][name=' + JSON.stringify(key) + ']')) ? T[key] = compile(src.innerHTML) : null)) || compile(key)
	}
} // v 4.2 - 2020 giovanni tigli - paolo verri

var ns_lang = navigator.language || navigator.userLanguage;
ns_lang = ns_lang.split('-')[0]
var ns_token = null

var appCtx = {}

var resPath = 'res/'
var basePath = ''
var navPath = ''

var emailRex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
var mobileRex = /^[0-9 +#*]+$/

var groupMap = {
	sport : {
		code : 'sport',
		name : 'Net Sport'
	},
	bike : {
		code : 'bike',
		name : 'Net Bike'
	},
	pet : {
		code : 'pet',
		name : 'Instant Pet'
	}
}

HTMLElement.prototype.hideMe = function() {
	addClass(this, 'hidden');
}

HTMLElement.prototype.showMe = function() {
	removeClass(this, 'hidden');
}

function showSpinner() {
	getById('spinner').showMe()
}

function hideSpinner() {
	getById('spinner').hideMe()
}

function showModal(html) {
	// cooked()
	getById('modal_content').style.opacity = '0'

	getById('modal_content').innerHTML = html
	getById('modal').showMe()
	setTimeout(function() {
		getById('modal_meter').style.width = (getById('modal_content').offsetWidth) + 'px'
		getById('modal_meter').style.height = (getById('modal_content').offsetHeight) + 'px'
		setTimeout(function() {
			getById('modal_meter').style.width = 'auto'
			getById('modal_meter').style.height = 'auto'
			getById('modal_content').style.opacity = '1'
		}, 120)
	}, 10)
}

function hideModal() {
	getById('modal_content').style.opacity = '0'
	setTimeout(function() {
		getById('modal_content').innerHTML = ''
		getById('modal_meter').style.width = '0px'
		getById('modal_meter').style.height = '0px'
		getById('modal').hideMe()
	}, 120)
}

function shake() {
	getById('modal_meter').removeClass('shake')
	setTimeout(function() {
		getById('modal_meter').addClass('shake')
	}, 0)
	setTimeout(function() {
		getById('modal_meter').removeClass('shake')
	}, 780)
}

function callApi(api, payload, okHandler, errHandler, notAuthHandler) {
	var xhr = new XMLHttpRequest()
	if (payload) {
		xhr.open('POST', nimble_api + api)
		xhr.setRequestHeader("Content-Type", "application/json")
	} else
		xhr.open('GET', nimble_api + api)

	if (ns_token)
		xhr.setRequestHeader('ns_token', ns_token)
	else {
		xhr.setRequestHeader('ns_code', ns_code)
		xhr.setRequestHeader('ns_secretKey', ns_secretKey)
	}
	xhr.setRequestHeader('ns_lang', ns_lang)

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				var res = JSON.parse(xhr.responseText)
				if (res.auth) {
					ns_token = res.auth.token
					sessionStorage.setItem('nimble.token', ns_token)

					if (sessionStorage.getItem('nimble.remember') == "*")
						localStorage.setItem('nimble.token', ns_token)
					sessionStorage.removeItem('nimble.remember')

					setTimeout(function() {
						callApi('refreshToken')
					}, Math.min(999999999, res.auth.expire - new Date().getTime()))
				}
				if (res.user) {
					appCtx.user = res.user
					appCtx.email = res.user.email
					localStorage.setItem('nimbe.bpsa_key', 'user')
				}
				if (okHandler)
					okHandler(res)
			} else {
				if (xhr.status > 400 && xhr.status < 500) {
					if (notAuthHandler) {
						notAuthHandler(xhr)
					} else if (errHandler) {
						errHandler(xhr)
					} else {
						logErr(xhr)
					}
				} else {
					if (errHandler) {
						errHandler(xhr)
					} else {
						logErr(xhr)
					}
				}
			}
		}
	}
	if (payload)
		xhr.send(JSON.stringify(payload))
	else
		xhr.send()
}

function logErr(xhr) {
	try {
		console.log(JSON.parse(xhr.responseText))
	} catch (err) {
		console.log(xhr.responseText)
	}
}

function toggleMenu() {
	if (getById('user_menu').hasClass('hidden')) {
		getById('user_menu').showMe()
	} else {
		getById('user_menu').hideMe()
	}
}

function cooked() {
	if (getById('cookie')) {
		console.log(getById('cookie'))
		setTimeout(function() {
			getById('cookie').outerHTML = ''
		}, 10)
	}
	localStorage.setItem('nimble.cooked', '*')
}

function enter(evt, action) {
	if (evt.keyCode == 13)
		action()
}

function adjSelect(obj) {
	if (obj.value == '')
		obj.addClass('empty')
	else
		obj.removeClass('empty')
}

function init(group) {
	if (getParameter('bpsa_key') == 'aDddrDSK7UQM968bKE')
		localStorage.setItem('nimbe.bpsa_key', 'init')
	if (group)
		sessionStorage.setItem('nimble.group', group)
	try {
		appCtx.group = groupMap[sessionStorage.getItem('nimble.group')]
	} catch (err) {
		appCtx.group = null
	}
	var s = sessionStorage.getItem('nimble.token')
	if (s == null)
		s = localStorage.getItem('nimble.token')
	if (s != null) {
		ns_token = null
		callApi('remember', {
			token : s
		}, continueInit, rememberFail, rememberFail)
	} else
		continueInit()
}

function rememberFail(res) {
	sessionStorage.removeItem('nimble.token')
	localStorage.removeItem('nimble.token')
	goGroup()
}

function continueInit() {
	if (sessionStorage.getItem('nimble.coupon'))
		appCtx.coupon = sessionStorage.getItem('nimble.coupon')
	sessionStorage.removeItem('nimble.coupon')
	initPage()
	if (getParameter('magicToken'))
		showModal(T('magicLogin').render())
}

function goHome() {
	goTo('');
}

function goPrd(prdCode) {
	goTo(prdCode + '/')
}

function goGroup() {
	if (appCtx.group)
		goTo(appCtx.group.code + '/')
	else
		goHome()
}

function groupName() {
	return appCtx.group ? appCtx.group.name : 'home'
}

function goTo(loc) {
	if (appCtx.coupon)
		sessionStorage.setItem('nimble.coupon', appCtx.coupon)
	location.assign(basePath + loc)
}

function goToContact(loc) {
	let info = []
	if (appCtx.productCode)
		info.push(appCtx.productCode)
	if (appCtx.coupon)
		info.push(appCtx.coupon)
	sessionStorage.setItem('nimble.contact.info', info.join(' | '))
	goTo(loc)
}

function userLogged() {
	return appCtx.user ? true : false
}

function showLogin() {
	showModal(T('login').render())
}

function checkEmail() {
	if (!emailRex.test(getById('login_email').value.trim())) {
		getById('login_email').addClass('error')
		getById('login_email_err').innerHTML = "L'email non è valida"
		return;
	}
	appCtx.email = getById('login_email').value.trim()
	askForMagic()
}

function askForMagic() {
	showSpinner()
	callApi('magicLink', {
		email : appCtx.email,
		fromUri : location.href
	}, function() {
		showModal(T('magicLinked').render())
		hideSpinner()
	}, magicFailed, magicFailed)
}

function magicFailed() {
	hideSpinner()
	shake()
	if (getById('login_email_err')) {
		getById('login_email').addClass('error')
		getById('login_email_err').innerHTML = "Email sconosciuta"
	}
}

function magicLogin() {
	if (getById('remember').checked)
		sessionStorage.setItem('nimble.remember', '*')
	callApi('login', {
		magicToken : getParameter('magicToken')
	}, receiveUser, loginFailed, loginFailed)
}

function loginFailed(res) {
	hideSpinner()
	shake()
}

function receiveUser(res) {
	hideModal()
	hideSpinner()
	var uri = location.origin + location.pathname
	var parts = location.search.split(/\?|&/)
	for (var i = 1; i < parts.length; i++)
		if (!parts[i].startsWith('magic'))
			uri += (i == 1 ? '?' : '&') + parts[i]
	location.assign(uri)
}

function logout() {
	forgetUser()
	if (navPath)
		goGroup()
	else
		draw()
}

function forgetUser() {
	ns_token = null
	appCtx.user = null
	appCtx.coupon = null
	sessionStorage.removeItem('nimble.token')
	localStorage.removeItem('nimble.token')
}

function nimbleAction(payload) {
	payload.deviceUid = deviceUid()
	payload.userEmail = appCtx.user ? appCtx.user.email : null
	payload.productCode = appCtx.productCode ? appCtx.productCode : null
	payload.group = appCtx.group ? appCtx.group.code : null
	payload.actionTime = moment().valueOf()
	payload.timezone = moment.tz.guess()
	callApi('trace', payload)
}

function deviceUid() {
	var send = false
	if (!localStorage.getItem('nimble.uid')) {
		localStorage.setItem('nimble.uid', randomCode())
		send = true
	}
	if (navigator.userAgent != localStorage.getItem('nimble.agent')) {
		localStorage.setItem('nimble.agent', navigator.userAgent)
		send = true
	}
	if (send)
		callApi('device', {
			uid : localStorage.getItem('nimble.uid'),
			userEmail : appCtx.user ? appCtx.user.email : null,
			info : localStorage.getItem('nimble.agent')
		})
	return localStorage.getItem('nimble.uid')
}

function sPrice(price) {
	return ('' + price.toFixed(2)).replace('.', ',').replace(',00', '')
}