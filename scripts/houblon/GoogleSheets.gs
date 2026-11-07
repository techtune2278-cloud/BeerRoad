/** À coller dans Extensions > Apps Script du Google Sheets maître. */
const HOUBLON_ID='1jJMW7juxDDE1GK5-qxWmZimF-ugiEjDTAAeDx3rp6rw';
function classeurHoublon(){const s=SpreadsheetApp.getActiveSpreadsheet();if(s.getId()!==HOUBLON_ID)throw Error('Ouvrir le classeur maître prévu.');return s;}
function installerPublication(){
 const s=classeurHoublon();if(s.getSheetByName('PUBLICATION'))throw Error('PUBLICATION existe déjà : aucune modification.');
 const p=s.insertSheet('PUBLICATION');
 const dates=['2027-01-08','2027-01-15','2027-01-17','2027-01-22','2027-01-29','2027-01-31','2027-02-05','2027-02-12','2027-02-14','2027-02-19','2027-02-26','2027-02-28'];
 p.getRange('A1:B13').setValues([['Date ISO','Publier'],...dates.map(d=>[d,'Non'])]);
 p.getRange('B2:B13').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Non','Oui'],true).setAllowInvalid(false).build());
 p.setFrozenRows(1);p.autoResizeColumns(1,2);
}
function verifierLiaisonFormulaire(){
 const f=FormApp.openById('1vMCxGNsFMiYxwWTqpQR2ckYw2KxDJVn0qpJoMHLZhKk');
 console.log((f.getDestinationId()===HOUBLON_ID?'OK : réponses reliées au classeur maître.':'ATTENTION : destination différente ou absente. Vérifier Réponses > Associer à Sheets.')+'\nCela ne remplit pas automatiquement les onglets de calcul.\nLien répondant : '+f.getPublishedUrl());
}
function appliquerBaremeV6(){
 const s=classeurHoublon(),p=s.getSheetByName('PARAMETRES'),a=s.getSheetByName('ACTIONS'),c=s.getSheetByName('CALCULS');
 if(!p||!a||!c)throw Error('Structure du classeur non reconnue.');
 if(s.getSheetByName('BAREME_V6'))throw Error('Barème déjà installé : vérifier ses paramètres, ne pas le réappliquer.');
 if(p.getRange('B19').getValue()!==10||p.getRange('B22').getValue()!==50)throw Error('Barème déjà modifié : audit manuel nécessaire.');
 const actions=a.getRange('F6:F305').getFormulas();
 actions.forEach((r,i)=>{if(!r[0].includes('D'+(i+6)+'*3'))throw Error('Formule ACTIONS inattendue ligne '+(i+6));});
 const bonuses=c.getRange('K65:K112').getFormulas();
 bonuses.forEach(r=>{if(!r[0].startsWith('=SUMIFS(')||!r[0].includes('ACTIONS!'))throw Error('Formule CALCULS inattendue.');});
 // Sauvegarde avant toute mutation du barème. Ne jamais publier ce classeur privé.
 DriveApp.getFileById(s.getId()).makeCopy('Sauvegarde Houblon avant V6 '+new Date().toISOString());
 const b=s.insertSheet('BAREME_V6');
 b.getRange('A1:B5').setValues([['Paramètre','Valeur'],['Plafond défis et bonus / équipage / course',100],['Pot au Noir : points par action validée',1],['Playlist personnelle partagée : bonus',10],['Playlist : maximum par équipage sur la course',2]]);
 s.setNamedRange('PlatAbo',p.getRange('B58:B62'));
 p.getRange('B19').setValue(5);p.getRange('B22').setValue(20);
 p.getRange('C22').setValue('Deux ex æquo : 10 points chacun.');
 p.getRange('A83').setValue('Mission gagnée : 20 points ; deux ex æquo : 10 points chacun.');
 p.getRange('B66:B69').setValues([[40],[30],[50],[2500]]);
 a.getRange('F6:F305').setFormulas(actions.map((r,i)=>[r[0].replace('D'+(i+6)+'*3','D'+(i+6)+'*BAREME_V6!$B$3')]));
 c.getRange('K65:K112').setFormulas(bonuses.map(r=>['=MIN(BAREME_V6!$B$2'+(r[0].includes(';')?';':',')+r[0].slice(1)+')']));
 // Les bonus déjà attribués restent intacts : contrôle manuel obligatoire de ces lignes.
 let existants=0;
 for(let row=87;row<=150;row++){
  if(p.getRange(row,3).getValue()){existants++;continue;}
  if(row<=106)p.getRange(row,4).setValue(20);
  else if(row>=127)p.getRange(row,4).setValue([10,5,2][(row-127)%3]);
 }
 SpreadsheetApp.flush();
 console.log('Barème installé. '+existants+' bonus déjà attribués conservés : contrôler leurs points manuellement. Vérifier les scores avant de publier. Les limites de playlists et preuves restent contrôlées par le QG.');
}
