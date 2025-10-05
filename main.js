const https = require("https")
const readline = require('readline')
const open = require('open').default

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Введите запрос: ', (article) => {
    const options = {
        hostname: `ru.wikipedia.org`,
        path: encodeURI(`/w/api.php?action=query&list=search&utf8=&format=json&srsearch="${article}"`),
        headers: {
            'User-Agent': 'MyCustomApp/1.0 (Node.js HTTPS Client)'
        }
    }
    const req = https.get(options, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk
        })

        response.on('end', () => {
            data_json = JSON.parse(data)

            let pageid = 0
            try {
                pageid = data_json.query.search['0'].pageid
            } catch (error) {
               console.log('Статья не найдена')
               return 
            }

            open(`https://ru.wikipedia.org/w/index.php?curid=${pageid}`)
        })
    })
    req.on('error', (error) => { console.log("Ошибка запроса: ", error) })
    rl.close();
});