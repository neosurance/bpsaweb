var historyCtx = {}

function initPage() {
	if (getParameter('magicToken')) {
		draw()
		hideSpinner()
		return;
	}
	callApi('policies', {
		criteria : {
			status : 'bought',
			docs : true
		}
	}, function(res) {
		historyCtx = res
		draw()
		hideSpinner()
	}, goGroup, function(res) {
		forgetUser()
		draw()
		showLogin()
		hideSpinner()
	})
}

function draw() {
	getById('inner').innerHTML = T('home_history').render(appCtx)
}
