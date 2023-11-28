
const fs = require("fs")

const http = require("http")
const cors = require("cors")
const express = require("express")

const nodemailer = require("nodemailer")

const cacher = require("./cacher")

const app = express()
const server = http.createServer(app)

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "blyde33@gmail.com",
        pass: "nrir lpyl wreb jweb"
    }
})

const router = {
    assets: express.Router(),
    accounts: express.Router(),
    messages: express.Router(),
    admin: express.Router()
}

let storage = {
    accounts: [],
    messages: [],
    cached: []
}

let total = 0
let key = (fs.readFileSync("./storage/accounts.json").toString().length * (15 ** 14)).toString()

app.use(cors())
app.use(express.json())

app.use("/assets", router.assets)
app.use("/accounts", router.accounts)
app.use("/messages", router.messages)
app.use("/admin", router.admin)

app.get("/", (request, response) => {
    response.sendFile(__dirname + "/assets/index.html")
})

app.get("/reset", (request, response) => {
    response.send(`
        <script>
            localStorage.removeItem("cached-messages")
            window.location.href = window.location.origin
        </script>
    `)
})

router.assets.get("/:id", (request, response) => {
    if (fs.existsSync(`./assets/${request.params.id}`)) {
        if (["script.js", "style.css", "banner.png"].includes(request.params.id)) {
            response.sendFile(__dirname + `/assets/${request.params.id}`)
        }
    } else if (request.params.id.includes("names.json")) {
        /*
        storage.accounts.forEach((account) => {
            if (account[4] === request.query.id) {
                found = storage.accounts.filter((account) => account[4] !== request.query.id)
                                        .map((account) => ([account[0], account[1], account[2], account[4]]))
            }
        })
        response.json(found)
        */
        response.json(storage.accounts.map((account) => ([account[0], account[1], account[2], account[4]])))
    }
})

router.accounts.post("/authorize", (request, response) => {
    profile = false
    data = JSON.parse(Buffer.from(request.body.code, "base64").toString("ascii"))
    found = storage.accounts.filter(account => account[3] === data.email)
    if (found.length < 1) {
        response.json({ error: "Failed to Authorize." })
    } else {
        response.json(found.map(account => ({ 
            id: account[4], 
            name: account[0], 
            lifegroup: account[1],
            tribe: account[2]
        })))
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
        response.json({
            receiver: {
                id: found[4],
                name: found[0],
                lifegroup: found[1],
                tribe: found[2]
            }
        })
        total += 1
        console.log(`Total Messages: ${total} [${(fs.statSync("./storage/messages.json").size/(1024 * 1024)).toFixed(2)} MB]`)
        fs.writeFileSync("./storage/messages.json", JSON.stringify(storage.messages))
    }
})

router.admin.get("/release/:id", (request, response) => {
    messages = []
    template = fs.readFileSync("./assets/template.html").toString()
    colors = { green: "#1F8B4C", black: "#000000", blue: "#206694", red: "#992D22" }
    account = storage.accounts.filter((account) => account[4] === request.params.id)
    if (account.length > 0 || storage.messages[request.params.id]) {
        storage.messages[account[0][4]].forEach((message) => {
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
        })
        output = template
                    .replace("{ messages }", messages.join("\n"))
                    .replace("{ banner url }", "data:image/jpg;base64," + fs.readFileSync("./assets/banner.jpg").toString("base64"))
        response.send(output)
        /*
        transporter.sendMail({
            from: "blyde33@gmail.com",
            to: account[0][3],
            subject: "YI Camp Encouragements",
            html: output
        }, (error, info) => {
            if (error) {
                response.send("Failed to send messages.")
            } else {
                response.send(`Messages sent to ${account[0][3]}. [${(output.length / (1024 * 1024)).toFixed(2)} MB]`)
            }
        })
        */
    }
})

server.listen(5000, () => {
    /* fs.writeFileSync("./storage/accounts.json", cacher.encrypt(fs.readFileSync("./storage/accounts.json").toString(), key)) */
    if (!fs.existsSync("./storage/messages.json")) {
        fs.writeFileSync("./storage/messages.json", JSON.stringify({}))
    }
    storage = {
        accounts: JSON.parse(cacher.decrypt(fs.readFileSync("./storage/accounts.json").toString(), key)),
        messages: JSON.parse(fs.readFileSync("./storage/messages.json")),
        cached: []
    }
    console.log("Server Online.")
})