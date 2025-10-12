const https = require("https")
const readline = require("readline")
const open = require('open').default

class WikipediaClient {
    constructor() {
        this.base_URL = "ru.wikipedia.org"
    }

    find_articles(article) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.base_URL,
                path: encodeURI(`/w/api.php?action=query&list=search&utf8=&format=json&srsearch="${article}"`),
                headers: {
                    'User-Agent': 'MyCustomApp/1.0 (Node.js HTTPS Client)'
                }
            }
            const req = https.get(options, (response) => {
                let data = ''

                response.on('data', (chunk) => {
                    data += chunk
                })
                response.on('end', () => {
                    try {
                        const data_JSON = JSON.parse(data)
                        resolve(data_JSON)
                    }
                    catch(error) {
                        reject(new Error('Ошибка парсинга JSON: ' + error.message))
                    }
                })
            })

            req.on('error', (error) => {
                reject(new Error('Ошибка запроса: ' + error.message))
            })

            req.end()
        })
    }
    extract_article_id(search_data) {
        try {
            return search_data.query.search['0'].pageid
        }
        catch(error) {
            throw new Error('Статья не найдена')
        }
    }
}

class WikipediaApp {
    constructor() {
        this.client = new WikipediaClient
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
    }
    get_input(question) {
        return new Promise((resolve) => {
            this.rl.question(question, resolve)
        })
    }

    close() {
        this.rl.close()
    }
    async start() {
        try {
            const article = await this.get_input('Поиск статьи: ')
            const search_data = await this.client.find_articles(article)
            const page_id = this.client.extract_article_id(search_data)
            
            await open(`https://ru.wikipedia.org/w/index.php?curid=${page_id}`)

            console.log('Статья успешно открыта!')
        }
        catch (error) {
            console.log('Ошибка: ' + error.message)
        }
        finally {
            this.close()
        }
    }
}

const app = new WikipediaApp
app.start()