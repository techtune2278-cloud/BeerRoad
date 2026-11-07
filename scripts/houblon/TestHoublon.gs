/** Ajouter dans un NOUVEAU fichier Apps Script nommé TestHoublon.
 * Aucun déploiement ni déclencheur. Les sorties sont dans le journal.
 */
const TEST_HOUBLON_MASTER='1jJMW7juxDDE1GK5-qxWmZimF-ugiEjDTAAeDx3rp6rw';
function reparerSeparateurHoublon(){
 const s=SpreadsheetApp.getActiveSpreadsheet();
 if(!s)throw Error('Ouvrir Extensions > Apps Script depuis le tableur.');
 const c=s.getSheetByName('CALCULS');if(!c)throw Error('Onglet CALCULS absent.');
 const range=c.getRange('K65:K112'),before=range.getFormulas();
 const after=before.map(row=>[row[0].includes(';')?row[0].replace(/^=MIN\(BAREME_V6!\$B\$2,/, '=MIN(BAREME_V6!$B$2;'):row[0]]);
 const changed=after.filter((r,i)=>r[0]!==before[i][0]).length;
 if(changed){range.setFormulas(after);SpreadsheetApp.flush();}
 console.log(changed+' formules corrigées. Aucun compteur modifié.');
 const errors=range.getDisplayValues().filter(r=>/^#/.test(r[0]));
 if(errors.length)throw Error(errors.length+' erreurs restantes dans CALCULS!K65:K112.');
 console.log('Contrôle du plafond : aucune erreur dans les 48 formules.');
}
function preparerRepetitionHoublon(){
 const s=SpreadsheetApp.getActiveSpreadsheet();
 if(!s||s.getId()===TEST_HOUBLON_MASTER||!s.getName().toUpperCase().includes('TEST'))throw Error('Exécuter uniquement depuis une COPIE nommée Houblon — TEST.');
 if(s.getSheetByName('TEST_CONTROLES'))throw Error('Jeu de test déjà préparé : aucune réinitialisation.');
 const p=s.getSheetByName('PARAMETRES'),r=s.getSheetByName('RELEVES'),a=s.getSheetByName('ABONNES'),act=s.getSheetByName('ACTIONS'),cal=s.getSheetByName('CALENDRIER'),pub=s.getSheetByName('PUBLICATION');
 if(!p||!r||!a||!act||!cal||!pub)throw Error('Onglets requis absents.');
 if(p.getRange('B19').getValue()!==5||p.getRange('B20').getValue()!==2||p.getRange('B21').getValue()!==3||p.getRange('B22').getValue()!==20)throw Error('Barème attendu : 5 / 2 / 3 / 20.');
 const teams=p.getRange('B40:D43').getValues();
 if(teams.some(row=>row.some(v=>!v))||new Set(teams.flatMap(row=>[row[1],row[2]])).size!==8)throw Error('Il faut huit titres distincts, deux par équipage dans PARAMETRES.');
 const steps=cal.getRange('A6:B7').getValues();
 if(steps[0][0]!=='Vendredi 08/01'||steps[1][0]!=='Vendredi 15/01')throw Error('Calendrier non reconnu.');
 reparerSeparateurHoublon();
 // Les effacements ci-dessous touchent UNIQUEMENT la copie TEST et ses cellules de saisie.
 r.getRange('A6:D605').clearContent();r.getRange('F6:I605').clearContent();
 a.getRange('A6:H305').clearContent();act.getRange('A6:E305').clearContent();act.getRange('G6:G305').clearContent();
 p.getRange('C73:C82').clearContent();p.getRange('B87:D150').clearContent();p.getRange('F87:G150').clearContent();p.getRange('H40:H43').clearContent();
 const left=[],right=[];
 for(let week=0;week<2;week++)for(let t=0;t<4;t++)for(const song of teams[t].slice(1))for(const platform of ['Spotify','YouTube']){
  left.push([steps[week][0],steps[week][1],platform,song]);
  right.push([[25,20,15,10,50,65,45,35][week*4+t],[5,4,3,2,10,13,9,7][week*4+t],'TEST — chiffres fictifs','Répétition générale']);
 }
 r.getRange(6,1,32,4).setValues(left);r.getRange(6,6,32,4).setValues(right);
 r.getRange('A38:D38').setValues([[steps[1][0],steps[1][1],'Deezer',teams[0][1]]]);
 r.getRange('F38:I38').setValues([[50000,0,'TEST — brouillard','Ce chiffre ne doit pas modifier le total PUBLIC.']]);
 pub.getRange('B2:B13').setValues(Array.from({length:12},(_,i)=>[i<2?'Oui':'Non']));
 const check=s.insertSheet('TEST_CONTROLES');
 check.getRange('A1:D8').setValues([
 ['TEST — aucune donnée réelle','08/01 attendu','15/01 attendu','Après abonnement test'],
 [teams[0][0],60,120,123],[teams[1][0],48,156,156],[teams[2][0],36,108,108],[teams[3][0],24,84,84],
 ['Abonnement à reporter manuellement','10/01/2027','Alexis & Marie','YouTube / TEST-ABO-001'],
 ['ABONNES!E6 et F6','Oui','Preuve fictive en G6','3 points en K6'],
 ['Copie TEST uniquement','Relevés A6:I38','Aucun envoi au fichier réel','Mode administrateur /qg/test']]);
 check.setFrozenRows(1);check.getRange('A1:D1').setFontWeight('bold').setBackground('#dfeadd');check.getRange('A1:D8').setWrap(true);check.setColumnWidth(1,260);check.setColumnWidths(2,3,180);
 SpreadsheetApp.flush();
 const scores=s.getSheetByName('EXPORT_PUBLIC').getRange('H6:H13').getValues().flat();
 const expected=[60,48,36,24,120,156,108,84];
 if(scores.some((v,i)=>typeof v!=='number'||Math.abs(v-expected[i])>0.001))throw Error('Jeu créé, mais scores à contrôler : '+JSON.stringify(scores)+'. Ne pas réexécuter pour effacer les résultats.');
 console.log('OK : 8 scores vérifiés, deux relevés complets.');
 console.log('HOUBLON_TEST_SPREADSHEET_ID = '+s.getId());
 console.log('Partager cette copie en Lecteur à beer-road-lecture@certain-beach-514011-r3.iam.gserviceaccount.com');
}
