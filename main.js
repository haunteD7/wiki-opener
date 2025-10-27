const { get } = require("http")
const https = require("https")
const readline = require("readline")
const open = require('open').default

class WikipediaClient {
    constructor(base_URL) {
        this.#base_URL = base_URL
    }

    find_articles(article) { // Query request to wikipedia
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.#base_URL,
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
                    catch (error) {
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
    get_articles_num(search_data) { // Get number of articles, max 10
        const num = search_data.query.searchinfo.totalhits
        return num > 10 ? 10 : num
    }
    get_article(search_data, num) { // Get article data
        return search_data.query.search[num];
    }
    get_articles_preview(search_data) {
        const articles_num = this.get_articles_num(search_data)
        let preview = ''
        for (let i = 0; i < articles_num; i++) {
            preview += `${i}. ${this.get_article(search_data, i).title}\n`
        }

        return preview
    }

    #base_URL
}

class WikipediaApp {
    constructor() {
        this.client = new WikipediaClient("ru.wikipedia.org")
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
    }
    get_input(question) { // Get input from terminal
        return new Promise((resolve) => {
            this.rl.question(question, resolve)
        })
    }

    close() {
        this.rl.close()
    }
    async start() {
        const article = await this.get_input('Поиск статьи: ')
        const search_data = await this.client.find_articles(article)

        if(this.client.get_articles_num(search_data) == 0) {
            console.log('Ничего не найдено')
            return;
        }

        console.log(this.client.get_articles_preview(search_data))
        let article_num
        let is_input_invalid = true
        while (is_input_invalid) { // Input validation
            article_num = Number(await this.get_input('Выберите статью: '))

            is_input_invalid = !(Number.isInteger(article_num) && article_num <= 9 && article_num >= 0)
        }
        const article_pageid = this.client.get_article(search_data, article_num).pageid

        await open(`https://ru.wikipedia.org/w/index.php?curid=${article_pageid}`)

        console.log('Статья успешно открыта!')
        this.close()
    }

    #client
}

const app = new WikipediaApp
app.start()