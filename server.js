
const fs = require("fs")

const http = require("http")
const cors = require("cors")
const express = require("express")

const nodemailer = require("nodemailer")

const cacher = require("./cacher")

const app = express()
const server = http.createServer(app)

const key = (fs.readFileSync("./storage/accounts.json").toString().length * (15 ** 14)).toString()

const router = {
    assets: express.Router(),
    accounts: express.Router(),
    messages: express.Router(),
    admin: express.Router()
}

let storage = {
    accounts: [],
    messages: [],
    cached: [],
    released: [[], 0]
}

app.use(cors())
app.use(express.json())

app.use("/assets", router.assets)
app.use("/accounts", router.accounts)
app.use("/messages", router.messages)
app.use("/admin", router.admin)

app.get("/", (request, response) => {
    response.sendFile(__dirname + "/assets/index.html")
})

async function release() {
    template = fs.readFileSync("./assets/template.html").toString()
    colors = { green: "#1F8B4C", black: "#000000", blue: "#206694", red: "#992D22" }
    storage.accounts.forEach((account) => {
        if (storage.messages[account[4]]) {
            messages = []
            storage.messages[account[4]].forEach((message) => {
                sender = storage.accounts.filter((account) => account[4] === message[0])
                messages.push(`
                    <div class="message">
                        <div class="profile">
                            <div class="tribe" style="background-color: ${colors[sender[0][2].toLowerCase()]}"></div>
                            <div class="info">
                                <div class="name">${sender[0][0]}</div>
                                <div class="id">${sender[0][4]}</div>
                            </div>
                        </div>
                        <div class="content">${message[1]}</div>
                    </div>
                `)
                storage.released[1] += 1
            })
            output = template
                    .replace("{ messages }", messages.join("\n"))
            /* transporter.sendMail({
                from: config.user,
                to: account[3],
                subject: `${account[0]}'s YI Camp Encouragements`,
                html: output
            }, (error, info) => {
                if (error) {
                    console.log("Failed to send messages.", error)
                } else {
                    console.log(`Messages sent to ${account[0]}. [${(output.length / (1024 * 1024)).toFixed(2)} MB]`)
                }
            }) */
            console.log(`Messages sent to ${account[0]}. [${(output.length / (1024 * 1024)).toFixed(2)} MB]`)
        }
    })
}

router.assets.get("/:id", (request, response) => {
    if (fs.existsSync(`./assets/${request.params.id}`)) {
        if (["script.js", "style.css", "banner.png"].includes(request.params.id)) {
            response.sendFile(__dirname + `/assets/${request.params.id}`)
        }
    } else if (request.params.id.includes("names.json")) {
        storage.accounts.forEach((account) => {
            if (account[4] === request.query.id) {
                found = storage.accounts.filter((account) => account[4] !== request.query.id)
                                        .map((account) => ([account[0], account[1], account[2], account[4]]))
            }
        })
        response.json(found)
    }
})

router.accounts.post("/authorize", (request, response) => {
    profile = false
    data = JSON.parse(Buffer.from(request.body.code, "base64").toString("ascii"))
    found = storage.accounts.filter(account => account[3] === data.email)
    if (found.length < 1) {
        response.json({ error: "Failed to Authorize." })
    } else {
        found = found.filter((account) => (
            btoa(account[2] + account[1]).slice(-10, -2) === data.inviteCode
        )).map(account => ({ 
            id: account[4], 
            name: account[0], 
            lifegroup: account[1],
            tribe: account[2],
            messages: (storage.cached.filter((message) => message[0][0] === account[4])).length
        }))
        if (found.length > 0) {
            response.json(found)
        } else {
            response.json({ error: "Failed to Authorize." })
        }
    }
})

router.messages.post("/create", (request, response) => {
    found = null
    storage.accounts.forEach((account) => {
        if (account[4] === request.body.receiver) {
            found = account
        }
    })
    if (found) {
        if (!storage.messages[found[4]]) {
            storage.messages[found[4]] = []
        }
        storage.messages[found[4]].push([
            request.body.sender,
            request.body.content.split("\n").join("<br>")
        ])
        storage.cached.push([
            [request.body.sender, found[4]], request.body.content.split("\n").join("<br>")
        ])
        response.json({
            receiver: {
                id: found[4],
                name: found[0],
                lifegroup: found[1],
                tribe: found[2]
            }
        })
        fs.writeFileSync("./storage/messages.json", JSON.stringify(storage.messages))
    }
})

router.admin.post("/:action", (request, response) => {
    if (request.params.action === "statistics") {
        response.json({
            messages: {
                size: [
                    (JSON.stringify(storage.messages).length / (1024)),
                    ((JSON.stringify(storage.messages).length/(1024**2))*100).toFixed(1) + "%"
                ],
                total: storage.cached.length
            },
            accounts: {
                size: (JSON.stringify(storage.accounts).length / (1024)),
                total: storage.accounts.length
            },
            released: storage.released[1]
        })
    } else if (request.params.action === "release") {
        if (storage.released[1] < 1) {
            release()
        } else {
            response.json({ status: "has already started." })
        }
    }
})

server.listen(5000, () => {
    if (!fs.existsSync("./storage/messages.json")) {
        fs.writeFileSync("./storage/messages.json", JSON.stringify({}))
    }
    storage = {
        accounts: JSON.parse(cacher.decrypt(fs.readFileSync("./storage/accounts.json").toString(), key)),
        messages: JSON.parse(fs.readFileSync("./storage/messages.json")),
        cached: [], released: [[], 0]
    }
    config = JSON.parse(cacher.decrypt(fs.readFileSync("./config.json").toString(), key))
    transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: config.user,
            pass: config.pass
        }
    })
    lifegroups = []
    storage.accounts.forEach((account) => {
        if (storage.messages[account[4]]) {
            storage.messages[account[4]].forEach((message) => {
                storage.cached.push([
                    [message[0], account[4]], message[1]
                ])
            })
        }
        if (!lifegroups.includes(account[1] + account[2])) {
            lifegroups.push(account[1] + account[2])
            console.log("**", account[1], "**", "`", btoa(account[2] + account[1]).slice(-10, -2), "`")
        }
    })
    console.log("Server Online.")
})