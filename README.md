# Clé & Go — Liens Mollie / Klarna

Mini application web mobile permettant de créer un lien Mollie limité à **Klarna**, puis de le copier ou de l'envoyer sur WhatsApp.

## Sécurité

- La clé Mollie n'est jamais envoyée au navigateur.
- Elle doit être stockée uniquement dans une variable d'environnement `MOLLIE_API_KEY`.
- L'interface est protégée par un petit code `ADMIN_PIN`.
- Ne publiez jamais votre clé `live_...` dans GitHub, WhatsApp ou un fichier HTML.

## Installation locale

Prérequis : Node.js 18 ou plus récent.

```bash
npm install
```

Définissez les variables d'environnement puis lancez :

macOS / Linux :
```bash
export MOLLIE_API_KEY="test_xxx"
export ADMIN_PIN="1234"
npm start
```

Windows PowerShell :
```powershell
$env:MOLLIE_API_KEY="test_xxx"
$env:ADMIN_PIN="1234"
npm start
```

Puis ouvrez `http://localhost:3000`.

## Mise en ligne

Cette application peut être déployée sur Render, Railway, Fly.io ou tout hébergement Node.js.

Variables à définir sur l'hébergeur :

- `MOLLIE_API_KEY` : commencez avec une clé `test_...`, puis passez à `live_...` après validation.
- `ADMIN_PIN` : choisissez un code privé différent de 1234.
- `REDIRECT_URL` : facultatif.

Commande de démarrage :

```bash
npm start
```

## Fonctionnement

Le serveur appelle :

`POST https://api.mollie.com/v2/payment-links`

avec :

- montant en EUR ;
- `allowedMethods: ["klarna"]` ;
- une ligne de prestation ;
- l'adresse de facturation du client.

Le lien retourné par Mollie est ensuite affiché dans l'interface.

## Important pour Klarna et la Martinique

Mollie exige que le pays consommateur soit un marché Klarna pris en charge. La documentation Mollie liste actuellement `FR` pour la France mais ne liste pas explicitement `MQ` pour la Martinique parmi ses marchés consommateurs Klarna.

Il faut donc tester avec une clé Mollie de test et surtout demander à Mollie/Klarna comment les adresses de Martinique doivent être traitées. Ne renseignez pas un faux pays de facturation pour contourner une restriction d'éligibilité.

## Test conseillé

1. Utiliser la clé API **test** Mollie.
2. Créer un lien avec un petit montant.
3. Vérifier que Klarna apparaît et que Mollie accepte les informations du client.
4. Une fois le parcours validé, remplacer uniquement la variable d'environnement par la clé `live_...`.
