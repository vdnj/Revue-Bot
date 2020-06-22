PRESENTATION DU REVUE-BOT:

Ce bot permet, une fois un numéro de commande et un numéro d'opportunité indiqués, d'exécuter automatiquement les tâches suivantes:
 - Obtention sur SF des données relatives à une opportunité, pour remplissage de la RC et de la ROF.
 - Obtention sur KLIO des données relatives à une opportunité, pour remplissage de la RC et de la ROF.
 - Si le REVUE-BOT détecte que le produit est nouveau, il fait un screenshot de la fiche produit.
 - Si le REVUE-BOT détecte que le produit existe, il check l'inventaire afin de calculer la qté à cder en fonction de la qté demandée et du stock
 - Ajout du numéro de commande dans l'opportunité
 - Fermetures de toutes les tâches en cours sur l'opportunité
 - Fermeture de l'opp (close gagnée)
 - Le tout en une moyenne de 3:30 min pour une opp "basique" comprenant 2 produits.

Certaines tâches ne sont pas automatisées (vérification des correspondances entre la commande client et l'offre, détecter si le fournisseur
existe, si la livraison peut se faire en direct ou non, ...).

Le Bot peut être utilisé 5 fois consécutivement par utilisateur. Passé ce nombre il faudra attendre un délai d'à peu près 1h.

Le REVUE-BOT a été codé par Valentin DN. Le Projet est téléchargeable gratuitement sur mon Github: vdnj

---------------------

SETUP:

- Installer NodeJs
- Installer les packages ( détailler cette étape )
- Assurez-vous d'être le propriétaire de l'opportunité.
- Assurez-vous que votre opp. contient au moins un produit.
- Assurez vous d'être déconnecté de SF et de KLIO.
- Si vous vous connectez à distance, assurez-vous d'être connecté au Fortinet.
- Gardez votre boite mail ouverte, afin de récupérer le code de vérification envoyé par SF.
- Dans Code/setup.js, assurez-vous que vos infos sont à jour.

---------------------

LANCEMENT DU BOT:

Sous OSX / Linux
- Ouvrir le dossier RevueBot et vérifier que les dernières Revues et Fiches produits ont bién été supprimées
- Ouvrir un terminal et entrer les commandes suivantes : 
    - taper "cd ", puis faire un glisser/déposer du dossier RevueBot, puis appuyer sur entrée
    - taper "node revueBot.js", puis appuyer sur entrée
    - taper le numéro de la commande client, puis apuyer sur entrée
    - taper le numéro de l'opportunité, puis appuyez sur entrée
- Une page va s'ouvrir et le Bot va entrer votre ID et MDP sur salesforce. Un code de vérification va vous être envoyé.
    Il faudra écrire ce numéro et appuyer sur entrée ( le tout en 45 secondes max ). C'est la dernière étape dans laquelle vous intervenez.
- Dans le terminal, vous pouvez suivre les logs pour savoir ce qui est fait et s'il y a une erreur.
- Si tout s'est bien passé, la RC est générée et remplie, et le nombre de ROF nécessaire est généré et rempli. Une capture d'écran des
    nouveaux produits est disponible. Si une erreur est survenue, relancez le bot en répétant ces étapes. Si après un 2ème essai le Bot rencontre une erreur,
    envoyez une capture d'écran de votre terminal par mail à Valentin.
- Toujours rechecker les revues, je ne suis pas responsable d'une erreur, les infos récupérées sont celles indiquées par le commercial ou l'ADV, sur SF ou sur Klio.
- Une fois que vous avez vérifié et mis les revues et capture(s) d'écran dans votre dossier, supprimez ces éléments du dossier Revue Bot.