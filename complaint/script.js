function initPage() {
	draw()
	hideSpinner()
}

function draw() {
	getById('inner').innerHTML = T('home_terms').render(appCtx)
}
