# GiovaBot

GiovaBot e un bot WhatsApp pensato per trasformare una chat di gruppo in un piccolo ecosistema sociale fatto di giochi, economia, progressione, eventi e strumenti utili per la vita di tutti i giorni.

L'idea non e solo "avere qualche comando", ma costruire un bot con personalita, progressione continua e modalita di gioco che si intrecciano con missioni giornaliere, achievement, classifiche e aggiornamenti pubblici.

## Cosa offre

- economia condivisa con crediti, daily, regali, banca e classifica ricchezza
- giochi sociali e competitivi come slot, dado, blackjack, cavalli, duello, roulette e altri minigame
- mega sistema pesca con aree, shop, meteo, marea, boss weekend, crafting e collezione
- missioni giornaliere con ricompense automatiche
- achievement con payout reale in crediti
- classifiche per gioco e progresso globale
- comandi admin per gestione, manutenzione, backup e annunci
- feed pubblico aggiornamenti con `.novita`
- modulo AI opzionale con Gemini per testi, idee, annunci e supporto creativo

## Filosofia del bot

GiovaBot vuole essere:

- divertente da usare ogni giorno
- leggibile e piacevole anche in chat affollate
- facile da espandere con nuovi giochi ed eventi
- abbastanza solido da distinguere tra versione di test e release stabile

## Funzioni principali

### Economia

- `.saldo`
- `.saldo top`
- `.daily`
- `.regala @utente importo`
- `.banca`
- `.scommessa @utente importo`

### Progressione

- `.missioni`
- `.achievements`
- `.streaks`
- `.stats`
- `.classifica [gioco]`

### Pesca

- `.pesca`
- `.pesca help`
- `.pesca profilo`
- `.pesca aree`
- `.pesca meteo`
- `.pesca shop`
- `.pesca craft`
- `.pesca boss`
- `.pesca boss sfida`

### Giochi

- `.slot`
- `.dado [numero]`
- `.blackjack`
- `.cavalli`
- `.duello`
- `.roulette`
- `.torneo`
- `.battaglia`

### Utilità

- `.help`
- `.novita`
- `.meteo`
- `.orario`
- `.compiti`
- `.verifiche`
- `.voti`
- `.sondaggio`
- `.qr`

### AI

- `.ai [richiesta]`

Esempi:

- `.ai scrivi un annuncio per il gruppo`
- `.ai dammi 3 idee per un evento weekend`
- `.ai inventa una missione giornaliera pesca`

## Admin tools

GiovaBot include un pannello admin pensato per gestire una vera release del bot.

Esempi di comandi:

- `.admin help`
- `.admin status`
- `.admin maintenance on|off`
- `.admin lock [comando]`
- `.admin unlock [comando]`
- `.admin backup [all|economia|pesca|progressione|roulette]`
- `.admin coins add/remove/set @utente importo`
- `.admin reset progress`
- `.admin reset classifica [gioco|all]`
- `.admin achievement give @utente [id]`
- `.admin announce pesca [qui|gruppo1|gruppo2|all]`

## Configurazione AI

Il modulo AI usa Gemini solo se la chiave e configurata come variabile d'ambiente.

PowerShell:

```powershell
$env:GEMINI_API_KEY="LA_TUA_CHIAVE"
$env:GEMINI_MODEL="gemini-2.0-flash"
node GiovaBot.js
```

La chiave non viene salvata nei file del progetto.

## Struttura del progetto

- `GiovaBot.js`: bootstrap del client WhatsApp e dispatcher comandi
- `commands/`: tutti i comandi del bot
- `utils/`: helper per economia, identita, AI, progressione e sistemi condivisi
- `data/`: persistenza JSON

## Stato del progetto

Il bot e in evoluzione continua. La repo GitHub viene aggiornata idealmente solo quando una versione viene considerata stabile, coerente e pronta all'uso.

## Visione futura

Direzione consigliata per le prossime release:

- rifinitura completa dei testi di tutti i giochi legacy
- dashboard admin piu avanzata
- piu eventi stagionali e weekend
- modalita cooperative e tornei automatici
- IA contestuale per missioni, recap giornalieri e narrazione eventi

GiovaBot non vuole essere solo un bot da comandi: vuole diventare un mondo di gruppo che cresce nel tempo.
