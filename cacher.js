
module.exports = {
    encrypt: (data, key) => {
        encrypted = []
        while (key.length < data.length) {
            key = key.concat(key)
        }
        for (var character in data) {
            character = [data.charCodeAt(character), parseInt(key.charCodeAt(character).toString().slice(-1))]
            if (character[1] > 4) {
                character[0] = String.fromCharCode(character[0] + character[1])
            } else {
                character[0] = String.fromCharCode(character[0] - character[1])
            }
            encrypted.push(character[0])
        }
        return encrypted.join("")
    },
    decrypt: (data, key) => {
        decrypted = []
        while (key.length < data.length) {
            key = key.concat(key)
        }
        for (var character in data) {
            character = [data.charCodeAt(character), parseInt(key.charCodeAt(character).toString().slice(-1))]
            if (character[1] > 4) {
                character[0] = String.fromCharCode(character[0] - character[1])
            } else {
                character[0] = String.fromCharCode(character[0] + character[1])
            }
            decrypted.push(character[0])
        }
        return decrypted.join("")
    }
}