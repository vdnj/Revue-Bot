let userDatas = require('./Code/setup.js');
let sf = require('./Code/salesforce.js');
let kl = require('./Code/klio.js');
let templater = require('./Code/docxFilling'); // for tests
let userStyle = '\x1b[36m%s\x1b[0m';
let testStyle = '\x1b[32m%s\x1b[0m'; // for tests
let fs = require('fs'); // for tests

// Pour les tests, enregistrer les données au moment voulu grâce à cette ligne :
//fs.writeFileSync('./datas.json', JSON.stringify(datas));


(async () => {

    // Demander à l'utilisateur le numéro de commande
    let orderNum = await sf.promptOrderNum();

    // Demander à l'utilisateur le numéro d'opp
    let oppNum = await sf.promptOpp();
    console.log(userStyle, `RevueBot se met au travail pour l'opp n° ${opp}.`);

    
    /* 1st PART - SF */
    // Lors de l'utilisation du testStart, avant chaque session penser à supprimer le contenu du dossier cookies.json et y ajouter {}
    
    console.log(userStyle, '\n----- PARTIE 1/4 : COLLECTE DE DONNEES SUR SF -----\n')
    try{
        //await sf.initialize();
        //await sf.login(userDatas.sfId, userDatas.sfPass);
        await sf.testStart(userDatas.sfId, userDatas.sfPass);
        await sf.openOpp(oppNum);
        await sf.getCustomer();
        await sf.custIsNew();
        await sf.getProviders();
        await sf.scrapeProductPage();
        await sf.getDwgFamUrl();
    } catch(e) {
        console.log(userStyle, "Un soucis empêche l'éxectution du script.\nDéconnexion de SF");
        console.log(testStyle, e);
        process.exit(0);
        //await sf.disconnect(); Remettre quand bot OP
    }
    

    // Importation des données scrappées sur SF + ajout des valeurs utiles. Penser à remvoe tous les testDatas et remplacer par dataslet datas = sf.datas;
    let datas = sf.datas;
    datas.oppNum = oppNum;
    datas.orderNum = orderNum;
    datas.alias = userDatas.name;


    /* 2nd PART - KLIO */
    //Connect to Fortinet and disconnect from any KLIO session.
    
    console.log(userStyle, '\n----- PARTIE 2/4 : COLLECTE DE DONNEES SUR KLIO -----\n')
    try {
        await kl.initialize();
        await kl.login(userDatas.klioId, userDatas.klioPass);
        datas.products = await kl.isNewIsStock(datas.products);
        await kl.disconnect();
    } catch(e) {
        console.log(userStyle, "Un soucis empêche l'éxectution du script.\nDéconnexion de KLIO");
        console.log(testStyle, e);
        await kl.disconnect();
    }


    /* 3rd PART - SF */
    
    console.log(userStyle, '\n----- PARTIE 3/4 : RETOUR SUR SF (MAJ OPP, SCREEN PRODUIT, ...) -----\n')
    try{
        console.log(userStyle, 'Retour sur SF')
        await sf.getProductDS(datas.products);
        await sf.removeTaches();
        await sf.closeOpp(datas.orderNum);
        //await sf.disconnect(); Remettre quand bot OP
    } catch(e) {
        console.log(userStyle, "Un soucis empêche l'éxectution du script.\nDéconnexion de SF");
        console.log(testStyle, e);
        //await sf.disconnect(); Remettre quand bot OP
    }
    

    fs.writeFileSync('./datas.json', JSON.stringify(datas));
    /* 4th PART - RC & ROF */
    
    // RC
    console.log(userStyle, '\n----- PARTIE 4/4 : GENERATION ET REMPLISSAGE RC et ROF(s) -----\n')
    templater.generateRC();
    let fillRC = () =>{    // SetTimout a besoin d'une callback pour être executé
        return templater.fillRC(datas);
    }
    setTimeout(fillRC,2000);

    //ROF
    let getRofInfo = () =>{
        datas = templater.getRofInfo(datas);
        return datas;
    }
    setTimeout(getRofInfo,4000);

    let generateROF = () =>{
        return templater.generateROF(datas.rofQty);
    }
    setTimeout(generateROF,6000);

    let logEnd = () =>{
        console.log(userStyle, '\nTravail terminé avec succès.');
    }

    let currentTimer = 8000;

    let fillRofAndEnd = () =>{
        for(let i=1; i<=datas.rofQty; i++){
            let fillRof = ()=>{
                return templater.fillRof(datas, i);
            }
            setTimeout(fillRof, currentTimer);
            if(i===datas.rofQty){
                setTimeout(logEnd, (currentTimer+1000));
            }
            currentTimer = currentTimer + 2000;
        }
    }
    
    setTimeout(fillRofAndEnd, currentTimer);
    
    // Fermeture des browsers et fin du script
    await sf.browser.close();
    await kl.browser.close();
    let exit = () =>{
        return process.exit(0);
    }
    setTimeout(exit, 20000);
    
    
})();



/* ---------------------------------- TEST ZONE ---------------------------------- */
// Pour utiliser le async test, enlever les () à la fin du 1er async et les mettre sur celui-ci.

/* TEST DE PASSER EN HEADLESS PENDANT LE SCRIPT */
(async () => {

    let oppNum = await sf.promptOpp();
    await sf.testStart(userDatas.sfId, userDatas.sfPass);
    await sf.openOpp(oppNum);

    /* 3rdth PART - RC & ROF */
    try{
        console.log(userStyle, 'Retour sur SF')
        await sf.removeTaches();
        await sf.closeRappels();
        await sf.closeOpp(' ');
        //await sf.disconnect(); Remettre quand bot OP
    } catch(e) {
        console.log(userStyle, "Un soucis empêche l'éxectution du script.\nDéconnexion de SF");
        console.log(testStyle, e);
        //await sf.disconnect(); Remettre quand bot OP
    }
    
    
});
