const puppeteer = require('puppeteer');
const cookies = require('./cookies.json');
const fs = require('fs');
const BASE_URL = 'https://na39.lightning.force.com/lightning/page/home';
const DISC_URL = "https://na39.lightning.force.com/secur/logout.jsp";
const userStyle = '\x1b[36m%s\x1b[0m';
const testStyle = '\x1b[32m%s\x1b[0m';
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let salesforce = {

    browser: null,
    page: null,

    datas:{
        products:[]
    },

    promptOrderNum : () => {
        return new Promise(function(resolve, reject) {
            var ask = function() {
              rl.question("Quel est le numéro de commande ? ", function(answer) {
                orderNum = answer;
                if (orderNum) {
                  resolve(orderNum, reject);
                } else {
                  ask();
                }
              });
            };
            ask();
          });
    },

    promptOpp : () => {
        return new Promise(function(resolve, reject) {
          var ask = function() {
            rl.question("Quel est le numéro d'opportunité ? ", function(answer) {
              opp = parseInt(answer);
              if (opp > 19000) {
                resolve(opp, reject);
              } else {
                ask();
              }
            });
          };
          ask();
        });
      },

    testStart : async (username, password) => {

        salesforce.browser = await puppeteer.launch({
            headless : false,
            slowMo: 200,
            defaultViewport: null,
            args: ['--start-fullscreen']
        })

        salesforce.page = await salesforce.browser.newPage();
        await salesforce.page.setDefaultTimeout(60000);

        if(Object.keys(cookies).length){

            await salesforce.page.setCookie(...cookies);
            await salesforce.page.goto(BASE_URL);
            await salesforce.page.waitForSelector("#input-5");
            await salesforce.page.waitFor(500);

        } else {

            await salesforce.page.goto(BASE_URL);
            await salesforce.page.waitForSelector("#privacy-link");
            await salesforce.page.waitFor(500);
            
            await salesforce.page.type("input[id='username']", username);
            await salesforce.page.type("input[id='password']", password);
            
            let [connectBtn] = await salesforce.page.$x('//*[@id="Login"]');
            await connectBtn.click();

            await salesforce.page.waitForSelector("#input-5");
            await salesforce.page.waitFor(500);

        }

        let currentCookies = await salesforce.page.cookies();
        fs.writeFileSync('./Code/cookies.json', JSON.stringify(currentCookies));
        
        console.log(userStyle, 'Connecté à SF');
        
    },

    initialize: async () =>{

        salesforce.browser = await puppeteer.launch({
            headless : false,
            slowMo: 200,
            defaultViewport: null,
            args: ['--start-fullscreen']
        });

        salesforce.page = await salesforce.browser.newPage();
        await salesforce.page.setDefaultTimeout(60000);

        console.log(userStyle, 'Browser initialized');

    },

    login: async (username, password)=>{

        await salesforce.page.goto(BASE_URL);
        await salesforce.page.waitForSelector("#privacy-link");
        await salesforce.page.waitFor(500);
        
        await salesforce.page.type("input[id='username']", username);
        await salesforce.page.type("input[id='password']", password);
        
        let [connectBtn] = await salesforce.page.$x('//*[@id="Login"]');
        await connectBtn.click();

        await salesforce.page.waitForSelector("#input-5");
        await salesforce.page.waitFor(500);

        console.log(userStyle, 'Connecté à SF');

    },

    openOpp: async (opportunity) =>{

        await salesforce.page.type("input[id='143:0;p']", (opportunity + '-'));
        await salesforce.page.waitFor(1000);

        try{
            let [oppLnk] = await salesforce.page.$x('//*[@id="oneHeader"]/div[2]/div[2]/div/div[2]/div/div[2]/div[2]/div/div/div[2]/ul/li[2]');
            await oppLnk.click();
        } catch(e) {
            console.log(userStyle, "Vérifiez le n° d'opportunité indiqué");
            await salesforce.browser.close();
        }

        try{
            await salesforce.page.waitForSelector(`.icon.noicon`, {timeout:3000});
        } catch(e) {
            await salesforce.page.waitForSelector(`.profileTrigger`, {timeout:3000});
        }
        await salesforce.page.waitFor(2500);

        salesforce.datas.oppUrl = salesforce.page.url();

        console.log(userStyle, `Sur l'opportunité n° ${opportunity}`);

    },

    closeRappels: async() =>{

        // Fonction non testée.

        let noRappel = false;

        while(!noRappel){

            console.log(testStyle, 'Entering while loop');
            let rappels = await salesforce.page.$$("button[title='Ignorer la notification’]");
            console.log(testStyle, 'looked for rappels. There are ' + rappels.length + ' elements.');

            if(rappels.length>0){
                for (let rappel in rappels){
                    await salesforce.page.click(rappel);
                    console.log(testStyle, 'rappel closed successfuly')
                }
            } else {
                noRappel = true;
            }

        }

    },

    getCustomer: async() => {
        
        let customer, customerName

        try{
            [customer] = await salesforce.page.$x('/html/body/div[4]/div[1]/section/div/div/div[1]/div/div/one-record-home-flexipage2/forcegenerated-flexipage_opportunity_rec_l_opportunity__view_js/flexipage-record-page-decorator/div/slot/flexipage-record-home-with-subheader-template-desktop2/div/div[1]/slot/slot/flexipage-component2/force-progressive-renderer/slot/slot/records-lwc-highlights-panel/records-lwc-record-layout/forcegenerated-highlightspanel_opportunity___012e00000005dtoiaa___compact___view___recordlayout2/force-highlights2/div[1]/div[2]/slot/slot/force-highlights-details-item[1]/div/p[2]/slot/force-lookup/div/force-hoverable-link/div/a');
            customerName = await customer.getProperty('textContent');
        } catch(e) {
            [customer] = await salesforce.page.$x('/html/body/div[4]/div[1]/section/div/div/div[1]/div/div/one-record-home-flexipage2/forcegenerated-flexipage_opportunity_rec_l_opportunity__view_js/flexipage-record-page-decorator/div/slot/flexipage-record-home-with-subheader-template-desktop2/div/div[1]/slot/slot/flexipage-component2/force-progressive-renderer/slot/slot/records-lwc-highlights-panel/records-lwc-record-layout/forcegenerated-highlightspanel_opportunity___012e00000005dttiaa___compact___view___recordlayout2/force-highlights2/div[1]/div[2]/slot/slot/force-highlights-details-item[1]/div/p[2]/slot/force-lookup/div/force-hoverable-link/div/a');
            customerName = await customer.getProperty('textContent');
        }

        let nameValue = await customerName.jsonValue();
        salesforce.datas.customer = nameValue;
        
        console.log(userStyle, `Nom du client obtenu: ${salesforce.datas.customer}`);
    },

    custIsNew: async()=>{

        let custLink = await salesforce.page.$x('//*[@id="brandBand_1"]/div/div[1]/div/div/one-record-home-flexipage2/forcegenerated-flexipage_opportunity_rec_l_opportunity__view_js/flexipage-record-page-decorator/div/slot/flexipage-record-home-with-subheader-template-desktop2/div/div[1]/slot/slot/flexipage-component2/force-progressive-renderer/slot/slot/records-lwc-highlights-panel/records-lwc-record-layout/forcegenerated-highlightspanel_opportunity___012e00000005dtoiaa___compact___view___recordlayout2/force-highlights2/div[1]/div[2]/slot/slot/force-highlights-details-item[1]/div/p[2]/slot/force-lookup');
        custLink = custLink[custLink.length-1];
        await custLink.click();
        await salesforce.page.waitForSelector('span[title="Opportunités"]');
        await salesforce.page.waitFor(500);

        await salesforce.page.click('span[title="Opportunités"]');
        await salesforce.page.waitForSelector('div[title="Nouveau"]');
        await salesforce.page.waitFor(500);

        const found = await salesforce.page.evaluate(() => window.find("Close gagnée"));
        if(found){
            console.log(userStyle, `${salesforce.datas.customer} est un client existant`)
            salesforce.datas.custIsNew = false;
        } else {
            console.log(userStyle, `${salesforce.datas.customer} est surement un nouveau client`)
            salesforce.datas.custIsNew = true;
        }

        await salesforce.page.goBack();
        await salesforce.page.waitForSelector('div[title="Modifier"]');
        await salesforce.page.goBack();
        try{
            await salesforce.page.waitForSelector(`.icon.noicon`, {timeout:3000});
        } catch(e) {
            await salesforce.page.waitForSelector(`.profileTrigger`, {timeout:3000});
        }
        await salesforce.page.waitFor(2500);

    },
    
    getProviders: async ()=> {
        
        await salesforce.page.click("span[title='Partenaires']");
        
        try{
            await salesforce.page.waitForSelector("span[class='slds-grid slds-grid--align-spread']", {timeout: 5000});
            let providers = await salesforce.page.evaluate(()=>{

                let [div] = document.getElementsByClassName('slds-brand-band');
    
                let els = div.getElementsByClassName('countSortedByFilteredBy');

                el = els[els.length-1];

                el = el.textContent;

                el = Number(el.split('élément')[0].trim());

                function isUpperCase(str){
                    return str === str.toUpperCase();
                }

                let providers =  Array.from(document.querySelectorAll("span[class='slds-grid slds-grid--align-spread']")).map(element=>{
                    return element.textContent;
                }).filter(element=>{
                    return isUpperCase(element) && element.length>0;
                });

                providers = providers.splice(providers.length-(el), providers.length-1);
                return providers;

            });
            salesforce.datas.providers = providers;
        } catch(e) {
            console.log(userStyle, "Aucun fournisseur n'est renseigné.");
            salesforce.datas.providers = [];
        }
        
        await salesforce.page.goBack();
        try{
            await salesforce.page.waitForSelector(`.icon.noicon`, {timeout:3000});
        } catch(e) {
            await salesforce.page.waitForSelector(`.profileTrigger`, {timeout:3000});
        }
        await salesforce.page.waitFor(2500);

        if(salesforce.datas.providers.length>0){
            console.log(userStyle, `Fournisseur(s) obtenu(s): ${salesforce.datas.providers}`);
        }
        
    },

    
    scrapeProductPage: async() => {

        // GO page "produits" + récupération des prix
        let selectorStr = "span[title='Produits']";
        await salesforce.page.$eval(selectorStr, elem => elem.click()); // page.click classique ne fonctionne pas toujours ici.

        try{
            await salesforce.page.waitForSelector("a[title='Modifier les produits']", {timeout:3000});
            await salesforce.page.waitFor(500);
        } catch(e){
            console.log(userStyle, 'Votre opp. ne contient pas de produits ou bien vous n\'êtes pas le propriétaire de l\'opp.\nAucune revue ne sera générée. Fin du processus');
            await salesforce.browser.close();
            process.exit(0);
        }

        let numOfProducts = await salesforce.page.evaluate(()=>{

            let [div] = document.getElementsByClassName('slds-brand-band');
            let els = div.getElementsByClassName('countSortedByFilteredBy');
            el = els[els.length-1];
            el = el.textContent;
            el = Number(el.split('élément')[0].trim());
            return el;

        });

        let allPrices = await salesforce.page.evaluate(()=>{
            return Array.from(document.querySelectorAll('td')).filter(el=>{
                return el.textContent.includes('EUR')}).map(el=>{
                    return el.textContent;
                });
        })

        allPrices = allPrices.splice((allPrices.length-(numOfProducts*4)-1), allPrices.length);

        if(allPrices.length === 0){
            console.log(userStyle,
                "Pas de produits dans cette opp. Vérifiez qu'il s'agit de la bonne opp ou ajoutez des produits");
            await salesforce.browser.close();
        }

        let rowPrices = [];

        for(let i=1; i <= numOfProducts; i++){

            rowPrices.push(allPrices.splice(0,4));
        
        }

        // GO page "Modif les produits + Récupération des datas"
        await salesforce.page.click("a[title='Modifier les produits']");
        await salesforce.page.waitForSelector("th[title='Réf. Offre Fourn.']");
        await salesforce.page.waitFor(500);

        let productElements = await salesforce.page.evaluate(()=>{
            return Array.from(document.querySelectorAll('span[class="slds-grid slds-grid--align-spread forceInlineEditCell"]')).map(el=>{
                return el.textContent.split('\n')[0] }) 
        });

        let rowProducts = [];
    
        for(let i=1; i <= numOfProducts; i++){

            rowProducts.push(productElements.splice(0,14));
        
        }

        // Setting salesforce.datas with scrapped datas from prev 2 steps
        for (let i=0; i < rowProducts.length; i++){

            salesforce.datas.products.push(
                {
                partNum: rowProducts[i][0],
                offNum: rowProducts[i][2],
                offDate: rowProducts[i][3],
                delTime: rowProducts[i][4],
                qty: Number(rowProducts[i][5].split(',')[0].replace(/\s/g, '')),
                buyPrice: rowProducts[i][6],
                discount: rowProducts[i][7],
                revPrice: rowPrices[i][1],
                sellPrice: rowProducts[i][13]
            });
            
        }

        // Back sur la page de l'opp.
        await salesforce.page.goBack();
        try{
            await salesforce.page.waitForSelector(`.icon.noicon`, {timeout:3000});
        } catch(e) {
            await salesforce.page.waitForSelector(`.profileTrigger`, {timeout:3000});
        }

        console.log(userStyle, `L'opp contient ${salesforce.datas.products.length} produit(s). Première partie des données obtenue`);

    },
    
    getDwgFamUrl: async () => {

        // On opp. page, click on the Produits section
        let selectorStr = "span[title='Produits']";
        await salesforce.page.$eval(selectorStr, elem => elem.click());
        await salesforce.page.waitForSelector("div[title='Ajouter des produits']");
        await salesforce.page.waitFor(500);
        
        for(let i=0; i<salesforce.datas.products.length; i++){

            // Go on products page
            let currentProduct = salesforce.datas.products[i].partNum;
            let productLnk = await salesforce.page.$$(`a[title="${currentProduct}"]`);
            try{
                productLnk = productLnk[1];
                await productLnk.click();
            } catch(e) {
                productLnk = await salesforce.page.$(`a[title="${currentProduct}"]`);
                await productLnk.click();
            }
            await salesforce.page.waitForSelector('a[title="Modifier"]');
            await salesforce.page.waitFor(1000);
            
            let [famille] = await salesforce.page.$x('/html/body/div[4]/div[1]/section/div/div/div[1]/div/div/div[1]/div/div[2]/div/div/div/section/div/div/article/div[2]/div/div[1]/div/div/div[5]/div[1]/div/div[2]/span');
            famille = await famille.getProperty('textContent');
            famille = await famille.jsonValue();
        
            // Get Dwg N°
            let dwgNum = await salesforce.page.$x('/html/body/div[4]/div[1]/section/div/div/div[1]/div/div/div[1]/div/div[2]/div/div/div/section/div/div/article/div[2]/div/div[1]/div/div/div[3]/div[2]/div/div[2]/span');
            dwgNum = dwgNum[dwgNum.length-1];
            dwgNum = await dwgNum.getProperty('textContent');
            dwgNum = await dwgNum.jsonValue();
        
            // Get Dwg Rev
            let dwgRev = await salesforce.page.$x('/html/body/div[4]/div[1]/section/div/div/div[1]/div/div/div[1]/div/div[2]/div/div/div/section/div/div/article/div[2]/div/div[1]/div/div/div[4]/div[2]/div/div[2]/span');
            dwgRev = dwgRev[dwgRev.length-1];
            dwgRev = await dwgRev.getProperty('textContent');
            dwgRev = await dwgRev.jsonValue();
        
            // Set full dwg number
            let fullDwgNum;
            if(dwgNum && dwgRev){
                fullDwgNum = (dwgNum + ' / ' + dwgRev );
            } else if( dwgNum && !dwgRev ){
                fullDwgNum = dwgNum;
            } else {
                fullDwgNum = '';
            }

            // Get product url
            let productUrl = salesforce.page.url();

            // Get number of drawings:
            try{
                await salesforce.page.click('a[title="Associé"]');
            } catch(e) {
                await salesforce.page.reload();
                await salesforce.page.waitForSelector('a[title="Associé"]');
                await salesforce.page.click('a[title="Associé"]');
            }
            await salesforce.page.waitForSelector('span[title="Notes et pièces jointes"]');
            let files = await salesforce.page.$$('.filerow');
            numOfFiles = files.length;

            // Set scrapped values in sf.datas
            salesforce.datas.products[i].famille = famille;
            salesforce.datas.products[i].fullDwgNum = fullDwgNum;
            salesforce.datas.products[i].numOfFiles = numOfFiles;
            salesforce.datas.products[i].url = productUrl;

            //Back to products page
            await salesforce.page.goBack();
            await salesforce.page.waitForSelector("div[title='Ajouter des produits']");
            await salesforce.page.waitFor(500);

        }
        
        console.log(userStyle, 'Données supplémentaires obtenues (n° de plan, famille, ..)');
    },


    getProductDS: async (productsList) => {

        for (let product of productsList){

            if(product.isNew){

                await salesforce.page.goto(product.url);
                await salesforce.page.waitForSelector('a[title="Associé"]');
                await salesforce.page.screenshot({path: `./${product.partNum}.png`});
                console.log(userStyle, `Capture d'écran du produit ${product.partNum} faite.`)

            }

        }

    },

    removeTaches: async ()=>{

        await salesforce.page.goto(salesforce.datas.oppUrl);
        try{
            await salesforce.page.waitForSelector(`.icon.noicon`, {timeout:2000});
        } catch(e) {
            await salesforce.page.waitForSelector(`.profileTrigger`, {timeout:2000});
        }
        await salesforce.page.waitFor(500);

        let checkboxes = await salesforce.page.$$('.slds-checkbox.open');

        let tachesCount = 0
        for (const checkbox of checkboxes){
            await checkbox.click();
            await salesforce.page.waitFor(500);
            tachesCount++;
        }
        
        console.log(userStyle, `${tachesCount} tâche(s) supprimée(s)`);
        await salesforce.page.waitForSelector('a[title="Modifier"]', {timeout:5000});

    },

    closeOpp: async (orderNum)=>{

        await salesforce.page.evaluate(_ => {
            window.scrollBy(0, 200);
          });

        try{
            await salesforce.page.click('a[title="Modifier"]');
        }catch(e){
            await salesforce.page.waitFor(2000);
            await salesforce.page.click('a[title="Modifier"]');
        }
        await salesforce.page.waitFor(1000);

        // Enregistrer le numero de cde client:
        await salesforce.page.type('textarea[cols="20"]', orderNum);

        // Récupérer le text des éléments de la classe uiPopupTrigger, puis les éléments eux-mêmes.
        let inputBtnsTxt = await salesforce.page.evaluate(()=>{
            return Array.from(document.getElementsByClassName('uiPopupTrigger')).map(btn=>{
                return btn.textContent;
            })
        })
        let inputBtns = await salesforce.page.$$('.uiPopupTrigger');
    
        // Chercher à quel index se trouve le bouton pour modifier l'état de l'opp puis clicker dessus et sélectionner 'Close gagnée'
        let statusOptions = ['Vérification', 'Chiffrage', 'Offre de prix', 'Négociation', 'Close gagnée', 'Close perdue'];
        let indexOfClose;
        for (let i=0; i<inputBtns.length; i++ ){
            if(statusOptions.includes(inputBtnsTxt[i])){
                indexOfClose = i;
                break;
            }
        }
        let closeInputBtn = inputBtns[indexOfClose];
        await closeInputBtn.click();
        await salesforce.page.click('a[title="Close gagnée"]');
        await salesforce.page.waitFor(500);

        // Chercher à quel index se trouve le bouton pour modifier l'état de l'opp puis clicker dessus et sélectionner 'Close gagnée'
        let raisonsOptions = ['- Aucun -', 'Prix', 'Délai de livraison', 'Technique', 'Réactivité', 'Veille', 'Force Majeure', 'Sans suite'];
        let indexOfRaison;
        for (let i=0; i<inputBtns.length; i++ ){
            if(raisonsOptions.includes(inputBtnsTxt[i])){
                indexOfRaison = i;
                break;
            }
        }
        let raisonInputBtn = inputBtns[indexOfRaison];
        await raisonInputBtn.click();
        await salesforce.page.click('a[title="Réactivité"]');

        await salesforce.page.click('button[title="Enregistrer"]');
        try{
            await salesforce.page.waitForSelector(`.icon.noicon`, {timeout:2000});
        } catch(e) {
            await salesforce.page.waitForSelector(`.profileTrigger`, {timeout:2000});
        }
        await salesforce.page.waitFor(500);
        
        console.log(userStyle, 'Numéro de commande enregistré. Opp passée en close gagnée.');

    },

    disconnect: async () => {

        await salesforce.page.goto(DISC_URL);
        await salesforce.page.waitFor(2000);

    }
}

module.exports = salesforce;