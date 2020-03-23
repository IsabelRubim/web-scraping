const puppeteer = require('puppeteer');

(async () => {

    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto('http://ongsbrasil.com.br/default.asp?Pag=37&ONG=&Estado=&Cidade=&Tipo=Animais&Atividade=&PageNo=1');

        //await page.waitForFunction(
        //    'document.querySelector("body")'
        //);

        await page.waitFor(150000);

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
                timeout: 380000,
            });

            //console.log(`saving as pdf: ${url}`);

            /*await page.pdf({
                path: `${i}.pdf`,
                format: 'Letter',
                printBackground: true,
            });*/
            
            console.log(`buscando dado: ${url}`);

            const selectorTitle = 'h1.h1.text-capitalize'
            const selectorTable = 'table > tbody > tr';

            const title = await page.$$eval(selectorTitle, titles => 
                titles.map(title => title.textContent)
            );

            const data = await page.$$eval(selectorTable, trs => trs.map(tr => {
                const tds = [...tr.getElementsByTagName('td')];
                return tds.map(td => td.textContent);
            }));
            
            /*for (let property in data) {                
                //console.log(property + " = " + data[property].toString().replace(/:,/, ': '));
                console.log(JSON.stringify(data[property].toString().replace(/:,/, ': ')));
            }*/

            for (let property of data) {
                console.log(property[0], `${property[1]},`);
            }

            console.log(`title: ${title}`);

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