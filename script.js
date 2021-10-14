function initPage() {
	delete appCtx.coupon
	draw()
	hideSpinner()
}

function draw() {
	getById('inner').innerHTML = T('home').render(appCtx)
}