const { promises: fsPromises } = require('fs');
const fs = require('fs');
const path = require('path');
const userStyle = '\x1b[36m%s\x1b[0m';
const testStyle = '\x1b[32m%s\x1b[0m';
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

let templater = {

    generateRC: ()=> {
        fsPromises.copyFile('./Modeles/Revue de contrat.docx', './Docs Générés/RC Remplie.docx')
            .then(() => console.log(userStyle, 'Revue de Contrat générée'))
            .catch(() => console.log(userStyle, 'La Revue de Contrat n a pas été générée'));
    },
    
    fillRC: (datas)=>{
        //Script de base de docstemplater pour gérer les messages d'erreur
        function replaceErrors(key, value) {
            if (value instanceof Error) {
                return Object.getOwnPropertyNames(value).reduce(function(error, key) {
                    error[key] = value[key];
                    return error;
                }, {});
            }
            return value;
        }
        function errorHandler(error) {
            console.log(JSON.stringify({error: error}, replaceErrors));

            if (error.properties && error.properties.errors instanceof Array) {
                const errorMessages = error.properties.errors.map(function (error) {
                    return error.properties.explanation;
                }).join("\n");
                console.log('errorMessages', errorMessages);
            }
            throw error;
        }

        //Load the docx file as a binary
        let content = fs
            .readFileSync(path.resolve(__dirname, '../Docs Générés/RC Remplie.docx'), 'binary');
        let zip = new PizZip(content);
        let doc;
        try {
            doc = new Docxtemplater(zip);
        } catch(error) {
            errorHandler(error);
        }

        // préparer les datas à affecter aux templateVariables
        /* date */
        let today = new Date(); 
        let dd = today.getDate(); 
        let mm = today.getMonth() + 1; 
        let yyyy = today.getFullYear(); 
        if (dd < 10) { 
            dd = '0' + dd; 
        } 
        if (mm < 10) { 
            mm = '0' + mm; 
        } 
        today = dd + '/' + mm + '/' + yyyy;

        /* nouveauClient */
        let nouveauClient;
        if(datas.custIsNew){
            nouveauClient = "Oui (à vérifier)"
        } else {
            nouveauClient = "Non"
        }

        /* familleDeProduit */
        let familles = datas.products.map(product=>{
            return product.famille
        }).sort();
        let counts = {};
        let compare = 0;
        let mostFrequent;
        let determineMost = function(array){
            for(let i = 0, len = array.length; i < len; i++){
                let word = array[i];
                if(counts[word] === undefined){
                    counts[word] = 1;
                }else{
                    counts[word] = counts[word] + 1;
                }
                if(counts[word] > compare){
                        compare = counts[word];
                        mostFrequent = array[i];
                }
            }
            return mostFrequent;
        }
        let famille = determineMost(familles);

        /* articleACreer + ficheImprimee */
        let areNews = datas.products.map(product=>{
            return product.isNew;
        })
        let articleACreer = areNews.includes(true) ? 'Oui' : 'Non';
        let ficheImprimee = articleACreer === 'Oui' ? 'Fait': 'NA';

        /* stock */
        let stock = '';
        let partNums = datas.products.map(product=>{
            return product.partNum;
        });
        let stockQties = datas.products.map(product=>{
            return product.stock;
        });
        let stockUnits = datas.products.map(product=>{
            return product.stockUnit;
        });
        for (let i=0; i< partNums.length; i++){
            if(stockQties[i]>0 || stockQties[i]<0 ){
                stock += ` Il y a ${stockQties[i]} ${stockUnits[i]}(s) en stock pour l'article ${partNums[i]}.\n`
            } else {
                stock += ` Il n'y a pas de stock pour l'article ${partNums[i]}.\n`
            }
        }

        //set the templateVariables
        doc.setData({
            client: datas.customer,
            alias: datas.alias,
            date: today,
            nouveauClient: nouveauClient,
            familleDeProduit: famille,
            articleACreer: articleACreer,
            ficheImprimee: ficheImprimee,
            stock: stock
        });

        try {
            doc.render()
        }
        catch (error) {
            errorHandler(error);
        }

        let buf = doc.getZip()
                    .generate({type: 'nodebuffer'});

        // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
        fs.writeFileSync(path.resolve(__dirname, '../Docs Générés/RC Remplie.docx'), buf);

        console.log(userStyle, "Revue de Contrat remplie")
    },

    getRofInfo: (datas)=>{

        // Ajout d'une valeur toOrder aux produits
        for (let product of datas.products){
            product.toOrder = product.qty>product.stock ? true : false;
        }
        
        // Faire une liste des offres.
        let allOffers = datas.products.filter(product=>{
            return product.toOrder;
        }).map(product=>{
            return product.offNum;
        }).sort();
        let offers = [];
        let prev;
        for ( let i = 0; i < allOffers.length; i++ ) {
            if ( allOffers[i] !== prev ) {
                offers.push(allOffers[i]);
            }
            prev = allOffers[i];
        }
        
        // Affecter les valeurs rofNum, rofCol, et rofOff correspondant à chaque product.
        let rofNum = 1;
        let rofCol = 1;
        
        for (let offer of offers){
            for(let product of datas.products){
                if(product.toOrder && product.offNum === offer && !product.rofPos){
                    product.rofPos = {rofNum: rofNum, rofCol: rofCol};
                    rofCol++
                    if(rofCol === 5){
                        rofCol = 1;
                        rofNum ++;
                    }
                }
            }
            rofNum ++;
            rofCol = 1;
        }
        
        // Affecter dans datas une valeur indiquant le nb de ROF à générer
        datas.rofQty = rofNum-1;

        // retourner datas avec les données ajoutées:
        return datas
    },

    generateROF: (numOfRof)=>{
        for(let i = 1; i<=numOfRof; i++){
            fsPromises.copyFile('./Modeles/Revue offre de prix fournisseur.docx', `./Docs Générés/ROF ${i} Remplie.docx`)
            .then(() => console.log(userStyle, `ROF n°${i} générée`))
            .catch(() => console.log(userStyle, 'La ROF n a pas été générée'));
        }
    },

    fillRof: (datas, currentRofNum)=>{

        //Script de base de docstemplater pour gérer les messages d'erreur
        function replaceErrors(key, value) {
            if (value instanceof Error) {
                return Object.getOwnPropertyNames(value).reduce(function(error, key) {
                    error[key] = value[key];
                    return error;
                }, {});
            }
            return value;
        }
        function errorHandler(error) {
            console.log(JSON.stringify({error: error}, replaceErrors));
            if (error.properties && error.properties.errors instanceof Array) {
                const errorMessages = error.properties.errors.map(function (error) {
                    return error.properties.explanation;
                }).join("\n");
                console.log('errorMessages', errorMessages);
            }
            throw error;
        }

        //Load the docx file as a binary
        let content = fs
            .readFileSync(path.resolve(__dirname, `../Docs Générés/ROF ${currentRofNum} Remplie.docx`), 'binary');
        let zip = new PizZip(content);
        let doc;
        try {
            doc = new Docxtemplater(zip);
        } catch(error) {
            errorHandler(error);
        }

        // Préparer les datas à affecter aux templateVariables:
        /* fournisseur */
        let fournisseur;
        if(datas.providers.length>1){
            fournisseur = 'Selectionner : ' + datas.providers.join(' / ');
        } else {
            fournisseur = datas.providers[0];
        }

        /* offre */
        let prodOfRof = datas.products.find(product=>{
            if(product.rofPos){
                return product.rofPos.rofNum === currentRofNum;
            }
        });
        let offre = prodOfRof.offDate ? prodOfRof.offNum + ' du ' + prodOfRof.offDate : prodOfRof.offNum;

        /* infos de toutes les lignes de refFourn à plan pour toutes les colonnes à remplir */
        let allProdInfo = {
            refFournisseur: {},
            refDip: {},
            pa: {},
            pr: {},
            qte: {},
            delai: {},
            plan: {},
            comm: {}
        }

        // Iteration sur tous les produits de la rof en cours
        let productsOfRof = datas.products.filter(product=>{
            if(product.rofPos){
                return product.rofPos.rofNum===currentRofNum;
            }
        });
        for (let i=1; i<=productsOfRof.length; i++){

            // refFournisseur: 
            allProdInfo.refFournisseur[i] = '---';

            // refDIP:
            allProdInfo.refDip[i] = productsOfRof[i-1].partNum;

            // pa:
            let buyPrice = Number(productsOfRof[i-1].buyPrice.split('EUR ')[1].split(',').join('.').replace(/\s/g, ''));
            let discount = Number(productsOfRof[i-1].discount.split(' %')[0].split(',').join('.'));
            let pa = discount===0.00 ? buyPrice : buyPrice - (buyPrice * discount / 100).toFixed(2);
            allProdInfo.pa[i] = String(pa) + ' €';

            // pr:
            allProdInfo.pr[i] = productsOfRof[i-1].revPrice.split('EUR ')[1] + ' €'

            // qte:
            let qte = String(productsOfRof[i-1].qty - productsOfRof[i-1].stock);
            if (productsOfRof[i-1].stock > 0){
                qte = qte + ` ( Stock: ${productsOfRof[i-1].stock} ${productsOfRof[i-1].stockUnit} )`
            };
            allProdInfo.qte[i] = qte;

            // delai:
            allProdInfo.delai[i] = productsOfRof[i-1].delTime + ' S';

            // plan
            allProdInfo.plan[i] = productsOfRof[i-1].fullDwgNum;
            if (productsOfRof[i-1].numOfFiles>=1){
                allProdInfo.plan[i] = allProdInfo.plan[i] + ' (*)'
            }

            // comm
            let comm = '';
            if (productsOfRof[i-1].numOfFiles>=1){
                comm = ` (*) ${productsOfRof[i-1].numOfFiles} fichier(s) disponible(s) ici --> ${productsOfRof[i-1].url}`
            }
            allProdInfo.comm[i] = comm;
            
        }

        //set the templateVariables. Soit la valeur existe et on l'affecte soit on met une str vide
        doc.setData({
            oppNum: datas.oppNum,
            client: datas.customer,
            fournisseur: fournisseur,
            offre: offre,
            refFournisseur1: allProdInfo.refFournisseur[1] ? allProdInfo.refFournisseur[1] : ' ',
            refDip1: allProdInfo.refDip[1] ? allProdInfo.refDip[1] : ' ',
            pa1: allProdInfo.pa[1] ? allProdInfo.pa[1] : ' ',
            pr1: allProdInfo.pr[1] ? allProdInfo.pr[1] : ' ',
            qte1: allProdInfo.qte[1] ? allProdInfo.qte[1] : ' ',
            delai1: allProdInfo.delai[1] ? allProdInfo.delai[1] : ' ',
            plan1: allProdInfo.plan[1] ? allProdInfo.plan[1] : ' ',
            comm1: allProdInfo.comm[1] ? allProdInfo.comm[1] : ' ',
            refFournisseur2: allProdInfo.refFournisseur[2] ? allProdInfo.refFournisseur[2] : ' ',
            refDip2: allProdInfo.refDip[2] ? allProdInfo.refDip[2] : ' ',
            pa2: allProdInfo.pa[2] ? allProdInfo.pa[2] : ' ',
            pr2: allProdInfo.pr[2] ? allProdInfo.pr[2] : ' ',
            qte2: allProdInfo.qte[2] ? allProdInfo.qte[2] : ' ',
            delai2: allProdInfo.delai[2] ? allProdInfo.delai[2] : ' ',
            plan2: allProdInfo.plan[2] ? allProdInfo.plan[2] : ' ',
            comm2: allProdInfo.comm[2] ? allProdInfo.comm[2] : ' ',
            refFournisseur3: allProdInfo.refFournisseur[3] ? allProdInfo.refFournisseur[3] : ' ',
            refDip3: allProdInfo.refDip[3] ? allProdInfo.refDip[3] : ' ',
            pa3: allProdInfo.pa[3] ? allProdInfo.pa[3] : ' ',
            pr3: allProdInfo.pr[3] ? allProdInfo.pr[3] : ' ',
            qte3: allProdInfo.qte[3] ? allProdInfo.qte[3] : ' ',
            delai3: allProdInfo.delai[3] ? allProdInfo.delai[3] : ' ',
            plan3: allProdInfo.plan[3] ? allProdInfo.plan[3] : ' ',
            comm3: allProdInfo.comm[3] ? allProdInfo.comm[3] : ' ',
            refFournisseur4: allProdInfo.refFournisseur[4] ? allProdInfo.refFournisseur[4] : ' ',
            refDip4: allProdInfo.refDip[4] ? allProdInfo.refDip[4] : ' ',
            pa4: allProdInfo.pa[4] ? allProdInfo.pa[4] : ' ',
            pr4: allProdInfo.pr[4] ? allProdInfo.pr[4] : ' ',
            qte4: allProdInfo.qte[4] ? allProdInfo.qte[4] : ' ',
            delai4: allProdInfo.delai[4] ? allProdInfo.delai[4] : ' ',
            plan4: allProdInfo.plan[4] ? allProdInfo.plan[4] : ' ',
            comm4: allProdInfo.comm[4] ? allProdInfo.comm[4] : ' ',
        });

        try {
            doc.render()
        }
        catch (error) {
            errorHandler(error);
        }

        let buf = doc.getZip()
                    .generate({type: 'nodebuffer'});

        // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
        fs.writeFileSync(path.resolve(__dirname, `../Docs Générés/ROF ${currentRofNum} Remplie.docx`), buf);

        console.log(userStyle, `ROF n°${currentRofNum} remplie`)

    }

}

module.exports = templater;