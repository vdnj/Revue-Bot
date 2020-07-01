const puppeteer = require('puppeteer');
const userStyle = '\x1b[36m%s\x1b[0m';
const BASE_URL = 'http://192.168.2.252/?DataSource=KLIO_DIPOSTEL&ConfigFile=d:/klio/DIPOSTEL/config/klio.ini';
const testStyle = '\x1b[32m%s\x1b[0m';

let klio = {

    browser: null,
    page: null,

    datas:{
    },

    initialize: async () => {

        klio.browser = await puppeteer.launch({
            headless : true,
            slowMo: 200,
            defaultViewport: null,
            args: ['--start-fullscreen']
        })

        klio.page = await klio.browser.newPage();
        await klio.page.setDefaultTimeout(60000);
        console.log(userStyle, 'Nouveau browser démarré pour recherches sur KLIO');
    },

    login: async (username, password)=>{

        await klio.page.goto(BASE_URL);
        await klio.page.waitForSelector("input[name='gstUser']");
        await klio.page.waitFor(500);
        
        await klio.page.type("input[name='gstUser']", username);
        await klio.page.type("input[name='gstPssWd']", (password + String.fromCharCode(13)));


        await klio.page.waitForSelector('frame[name="ApplicationFrame"]');
        await klio.page.waitFor(500);

        console.log(userStyle, 'Connecté à KLIO');
    
    },

    isNewIsStock: async (productsList)=> {

        // Check si le tableau de bord pop up (1 fois quotidiennement). Si oui, le ferme.
        try{
            await klio.page.click('.btn', {timeout:10000});
        }catch(e){
        }

        // Go sur la page de recherche de produits
        let midFrame = await klio.page.frames().find(frame => frame.name() === 'FrameMiddle');
        await midFrame.click('i[title="Données Techniques"]');
        await midFrame.click('i[title="Article technique"]');
        await midFrame.click('i[title="Gestion des articles techniques"]');
        await klio.page.waitFor(1000);

        // Pour chaque produit, checker s'il existe et, si oui, s'il y a du stock.
        let counter = 0;
        for(let product of productsList){

            let listFrame = await klio.page.frames().find(frame => frame.name() === 'ListFrame');
            
            try{
                await listFrame.click('#searchValue');
            } catch(e) {
                await klio.page.waitFor(1000);
                listFrame = await klio.page.frames().find(frame => frame.name() === 'ListFrame');
                await klio.page.waitFor(1000);
                await listFrame.click('#searchValue');
            }

            for(let i=0; i<5; i++){
                await klio.page.keyboard.press('Backspace');
            }

            await listFrame.type('#searchValue', (product.partNum + String.fromCharCode(13)));
            await klio.page.waitFor(2000);
            
            listFrame = await klio.page.frames().find(frame => frame.name() === 'ListFrame');
            let item = await listFrame.$('.listLink');

            if(item){
                product.isNew = false
                await listFrame.click('.listLink');
                await klio.page.waitFor(3000);

                //Fermer le post it s'il y en a
                try{
                    await klio.page.click('.btnmsg');
                }catch(e){
                }
                
                let TopFrame = await klio.page.frames().find(frame => frame.name() === 'TopFrame');
                let stockUnit;
                try{
                    stockUnit = await TopFrame.$('#CD_UNIT_STO');
                    stockUnit = await stockUnit.getProperty('value');
                    stockUnit = await stockUnit.jsonValue();
                } catch(e) {
                    await klio.page.waitFor(2000);
                    TopFrame = await klio.page.frames().find(frame => frame.name() === 'TopFrame');
                    stockUnit = await TopFrame.$('#CD_UNIT_STO');
                    stockUnit = await stockUnit.getProperty('value');
                    stockUnit = await stockUnit.jsonValue();
                }
                
                let stock = await TopFrame.$('label[id="ExpectedAvailableStock"]');
                stock = await stock.getProperty('textContent');
                stock = await stock.jsonValue();
                stock = Number(stock);
                
                let BotFrame = await klio.page.frames().find(frame => frame.name() === 'BottomFrame');
                await BotFrame.click('#KlioAbandonIcon');
                await klio.page.waitForSelector('frame[name="ApplicationFrame"]');
                product.stock = stock;
                product.stockUnit = stockUnit;

                console.log(userStyle, `Pour le produit ${product.partNum}, il y a ${stock} pce(s) en stock`);
                
            } else {
                product.isNew = true
                product.stock = 0;
                product.stockUnit = '';
                counter ++;
                console.log(userStyle, `Le produit ${product.partNum} est un nouveau produit`)
            }
        }

        console.log(userStyle, `Parmis le(s) produit(s) de l'opp, ${counter} n'existe(nt) pas dans KLIO.`)
        return productsList

    },

    disconnect: async () => {
        await klio.page.waitFor(2000);
        let topFrame = await klio.page.frames().find(frame => frame.name() === 'FrameTop');
        await topFrame.click('span[title="Se déconnecter de Klio"]');
        await klio.page.waitFor(3000);

        console.log(userStyle, 'Déconnecté de KLIO');
    }

}

module.exports = klio;