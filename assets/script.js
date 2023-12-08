window.addEventListener("DOMContentLoaded", async () => {
	found = []
	cached = []
	profile = {}
	tabs = document.getElementsByClassName("tab")
	colors = { green: "#1F8B4C", black: "#000000", blue: "#206694", red: "#992D22" }
	inputs = {
		autocomplete: [
			document.getElementById("send-receiver-name"),
			document.getElementById("send-receiver-autocomplete")
		],
		editor: document.getElementById("send-message-editor"),
		sendButton: document.getElementById("send-button"),
		loginButton: document.getElementById("login-button"),
		email: document.getElementById("login-email"),
		description: document.getElementById("success-description"),
		messages: document.getElementById("messages-list"),
		customise: {
			image: document.getElementById("profile-image"),
			input: document.getElementById("profile-upload-input"),
			addButton: document.getElementById("profile-add-button"),
			name: document.getElementById("profile-name"),
			id: document.getElementById("profile-id"),
			doneButton: document.getElementById("done-button")
		},
		login: document.getElementById("login-section"),
		override: [
			document.getElementById("override-section"),
			document.getElementById("override-list")
		],
		inviteCode: document.getElementById("login-code")
	}
	window.addEventListener("hashchange", (event) => {
		event.hash = JSON.parse(atob(window.location.hash.split("#")[1]))
		if (event.hash[0].includes("tab")) {
			for (var tab in tabs) {
				tab = [tabs[tab], tab]
				if (tab[0].id) {
					if (tab[0].id.split("-")[0] === event.hash[1]) {
						if (tab[0].id === "success-tab") {
							inputs.description.innerHTML = `Your message was successfully sent to <span style="color: rgba(255, 255, 255, 0.75)">${event.hash[2].name} - ${event.hash[2].lifegroup} (${event.hash[2].tribe} Tribe)</span>.`
						} else if (tab[0].id === "messages-tab") {
							cached = JSON.parse(localStorage.getItem("cached-messages"))
							inputs.messages.innerHTML = ""
							cached.forEach((item) => {
								item = [item, document.createElement("div")]
								item[1].className = "message"
								item[1].innerHTML = `
									<div class="profile">
										<div class="tribe" style="background-color: ${colors[item[0].receiver.tribe.toLowerCase()]}"></div>
										<div>
											<div class="name">${item[0].receiver.name}</div>
											<div class="id">${item[0].receiver.id}</div>
										</div>
									</div>
									<div class="content">${item[0].content.slice(0, 100)}</div>
								`
								inputs.messages.appendChild(item[1])
							})
						}
						tab[0].style.display = "block"
					} else {
						tab[0].style.display = "none"
					}
				}
			}
		}
	})
	inputs.sendButton.onclick = function() {
		if (!inputs.autocomplete[0].userId || inputs.editor.value.length < 1) {
			console.log("failed.")
		} else {
			(async () => {
				request = await fetch("/messages/create", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sender: profile.id,
						content: inputs.editor.value,
						receiver: inputs.autocomplete[0].userId
					})
				})
				data = await request.json()
				if (data.receiver.id === inputs.autocomplete[0].userId) {
					cached.push({
						receiver: {
							id: data.receiver.id,
							name: data.receiver.name,
							tribe: data.receiver.tribe
						},
						content: inputs.editor.value
					})
					inputs.editor.value = ""
					inputs.autocomplete[0].value = ""
					inputs.autocomplete[0].userId = ""
					localStorage.setItem("cached-messages", JSON.stringify(cached))
					window.location.href = "#" + btoa(JSON.stringify(["tab", "success", data.receiver]))
				}
			})()
		}
		
	}
	inputs.loginButton.onclick = function() {
		(async () => {
			request = await fetch("/accounts/authorize", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					code: btoa(JSON.stringify({
						email: inputs.email.value,
						inviteCode: inputs.inviteCode.value
					}))
				})
			})
			profile = await request.json()
			if (profile.length > 1) {
				profile.forEach((account) => {
					account = [account, document.createElement("button")]
					account[1].innerHTML = `
						<div class="name">${account[0].name}</div>
						<div class="lifegroup">${account[0].lifegroup} (${account[0].tribe} Tribe)</div>
					`
					account[1].onclick = async () => {
						profile = account[0]
						if (profile.id) {
							request = await fetch(`/assets/names.json?id=${profile.id}`)
							names = await request.json()
							if (names.length > 0) {
								if (!localStorage.getItem("cached-messages") || (profile.messages < 1 && localStorage.getItem("cached-messages"))) {
									localStorage.setItem("cached-messages", JSON.stringify([]))
								}
								window.location.href = "#" + btoa(JSON.stringify(["tab", "messages"]))
							}
						}
					}
					inputs.override[1].appendChild(account[1])
				})
				inputs.override[0].style.display = "block"
				inputs.login.style.display = "none"
			} else if (!profile.error && profile[0].id) {
				request = await fetch(`/assets/names.json?id=${profile[0].id}`)
				names = await request.json()
				if (names.length > 0) {
					profile = profile[0]
					if (!localStorage.getItem("cached-messages") || (profile.messages < 1 && localStorage.getItem("cached-messages"))) {
						localStorage.setItem("cached-messages", JSON.stringify([]))
					}
					window.location.href = "#" + btoa(JSON.stringify(["tab", "messages"]))
				} 
			} else if (profile.error) {
				inputs.email.style.backgroundColor = "#9c4040"
				inputs.email.style.color = "rgba(255, 255, 255, 0.8)"
				inputs.inviteCode.style.backgroundColor = "#9c4040"
				inputs.inviteCode.style.color = "rgba(255, 255, 255, 0.8)"
			}
		})()
	}
	inputs.autocomplete[0].addEventListener("keyup", () => {
		if (inputs.autocomplete[0].value.length > 0) {
			names.forEach((name) => {
				if (name.slice(0, 3).join("").split(" ").join("").toLowerCase().includes(inputs.autocomplete[0].value.split(" ").join("").toLowerCase())) {
					if (!found.includes(name[3])) {
						name = [name, document.createElement("button")]
						name[1].id = name[0][3]
						if (colors[name[0][2].toLowerCase()]) {
							name[1].style.color = colors[name[0][2].toLowerCase()]
							name[1].textContent = `${name[0][0]} - ${name[0][1]} (${name[0][2]} Tribe)`
						} else {
							name[1].style.color = "#A24857"
							name[1].textContent = `${name[0][0]} - ${name[0][1]}`
						}
						name[1].onclick = function() {
							names.forEach((name) => {
								if (name[3] === this.id) {
									inputs.autocomplete[0].value = this.textContent
									inputs.autocomplete[0].style.color = colors[name[2].toLowerCase()]
									inputs.autocomplete[0].style.backgroundColor = "#EEEEEE"
									inputs.autocomplete[0].userId = this.id
									inputs.autocomplete[1].style.display = "none"
									if (!colors[name[2].toLowerCase()]) {
										inputs.autocomplete[0].style.color = "#A24857"
									}
								}
							})
						}
						found.push(name[1].id)
						inputs.autocomplete[1].appendChild(name[1])
					}
				} else if (found.includes(name[3])) {
					inputs.autocomplete[0].style.color = "rgba(255, 255, 255, 0.625)"
					inputs.autocomplete[0].style.backgroundColor = "rgba(255, 255, 255, 0.0625)"
					inputs.autocomplete[0].userId = undefined
					inputs.autocomplete[1].removeChild(document.getElementById(name[3]))
					found.splice(found.indexOf(name[3]), 1)
				}
				if (found.length > 0) {
					inputs.autocomplete[1].style.display = "block"
				} else {
					inputs.autocomplete[1].style.display = "none"
				}
			})
			if (found.length > 0) {
				inputs.autocomplete[1].style.display = "block"
			}
		} else {
			inputs.autocomplete[1].style.display = "none"
		}
	})
	if (window.location.hash.length > 0) {
		window.location.hash = ""
		window.location.reload()
	} else {
		window.location.hash = "#" + btoa(JSON.stringify(["tab", "login"]))
	}
})