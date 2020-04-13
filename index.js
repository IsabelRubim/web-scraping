const puppeteer = require('puppeteer');

const dataObject = {};
const jsonData = [];

(async () => {

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('http://www.ongsbrasil.com.br/default.asp?Pag=37&ONG=&Estado=&Cidade=&Tipo=Meio%20Ambiente&Atividade=&PageNo=32');

        await page.waitFor(80000);

        const result = await page.evaluate(() => {
            const titleColumn = Array.from(document.querySelectorAll('tr td div.text-capitalize h2.h3 a'));
    
            const links = titleColumn.map(link => link.getAttribute('href'));
    
            const cutLink = links.map(value => value.split("&", 3)).map(e => e[2].split("=", 2));
    
            const numberInstituicao = cutLink.map(value => parseInt(value[1]));
    
            const query = 'http://ongsbrasil.com.br/default.asp?Pag=2&Destino=InstituicoesTemplate&CodigoInstituicao=';
    
            const result = numberInstituicao.map(elem => `${query}${elem}`);

            return result;
        });

        const browserTwo = await puppeteer.launch();
        const results = result.map(async (url, i) => {
            const page = await browserTwo.newPage();

            console.log(`Loading page: ${url}`);

            await page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: 880000,
            });
            
            console.log(`buscando dado: ${url}`);

            const selectorTitle = 'h1.h1.text-capitalize';
            const selectorTable = 'table > tbody > tr';

            const title = await page.$$eval(selectorTitle, titles => 
                 titles.map(title => title.textContent).toString()
            );

            const data = await page.$$eval(selectorTable, trs => trs.map(tr => {
                const tds = [...tr.getElementsByTagName('td')];                
                return tds.map(td =>  td.textContent === '' ? td.getElementsByTagName('input').item(0).value : td.textContent);
            }));

            for (let property of data) {
                dataObject[property[0].replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g,'')] = property[1];     
            }

            const titleObj = { title };
            const obj = Object.assign({}, titleObj, dataObject);

            jsonData.push(obj);
            console.log(JSON.stringify(jsonData));
            console.log(`closing page: ${url}`);
            await page.close();
        });
        
        await Promise.all(results).then(() => {
            browserTwo.close();
        });

    } catch (error) {
        console.log(error);
    }
})();