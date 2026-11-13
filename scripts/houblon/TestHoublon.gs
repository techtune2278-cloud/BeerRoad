/** V1.6.8. Dans une NOUVELLE copie intégrale de l'officiel, nommée Houblon TEST.
 * Saisie uniquement dans SUIVI_TITRES. Ne jamais utiliser l'ancien script V1.6.2.
 */
const TEST_HOUBLON_MASTER='1jJMW7juxDDE1GK5-qxWmZimF-ugiEjDTAAeDx3rp6rw';
function preparerRepetitionHoublon(){
 const s=SpreadsheetApp.getActiveSpreadsheet();
 if(!s||s.getId()===TEST_HOUBLON_MASTER||!s.getName().toUpperCase().includes('TEST'))throw Error('Exécuter uniquement depuis une COPIE nommée Houblon TEST.');
 if(s.getSheetByName('TEST_CONTROLES'))throw Error('Test déjà préparé. Faire une nouvelle copie de l’officiel ; aucun effacement automatique.');
 const p=s.getSheetByName('PARAMETRES'),d=s.getSheetByName('DEPART'),r=s.getSheetByName('SUIVI_TITRES'),pub=s.getSheetByName('PUBLICATION'),ex=s.getSheetByName('EXPORT_PUBLIC');
 if(!p||!d||!r||!pub||!ex)throw Error('Structure récente requise : DEPART, SUIVI_TITRES, PUBLICATION, EXPORT_PUBLIC.');
 if(p.getRange('B19').getValue()!==5||p.getRange('B20').getValue()!==2)throw Error('Barème attendu : 5 écoutes par point et 2 points par auditeur.');
 // Refus avant toute modification si la copie contient déjà des mesures.
 for(const a1 of ['F6:F485','I6:J485'])if(r.getRange(a1).getValues().flat().some(v=>v!==''))throw Error('Cette copie contient déjà des mesures : utiliser une copie vierge de l’officiel.');
 const teams=p.getRange('B40:B43').getValues().flat();
 if(teams.length!==4||new Set(teams).size!==4||teams.some(v=>!v))throw Error('Quatre équipages requis.');
 const data=r.getRange('A6:E85').getValues(),expectedPlatforms=['Spotify','YouTube','Deezer','Apple Music','Amazon Music'];
 const counts={};
 data.forEach((row,i)=>{const week=Math.floor(i/40);if(!teams.includes(row[2])||!expectedPlatforms.includes(row[4])||!row[3]||!(row[1] instanceof Date)||Utilities.formatDate(row[1],'Europe/Paris','yyyy-MM-dd')!==['2027-01-08','2027-01-15'][week])throw Error('Structure ou calendrier inattendu à la ligne '+(i+6));const k=week+'|'+row[2]+'|'+row[4];counts[k]=(counts[k]||0)+1;});
 if(Object.keys(counts).length!==40||Object.values(counts).some(n=>n!==2))throw Error('Il faut deux titres par équipage et plateforme pour chacun des deux relevés.');
 const check=s.insertSheet('TEST_CONTROLES');
 check.getRange('A1').setValue('TEST EN PRÉPARATION — en cas d’erreur, ne pas relancer : repartir d’une nouvelle copie.');
 d.getRange('D6:D45').setValues(Array.from({length:40},()=>['Depuis le départ']));d.getRange('E6:E45').clearContent();
 const listens=[],audiences=[],dates=[],visibility=[];
 data.forEach((row,i)=>{const week=Math.floor(i/40),team=teams.indexOf(row[2]),visible=['Spotify','YouTube','Amazon Music'].includes(row[4]);
 listens.push([visible?[[25,20,15,10],[50,65,45,35]][week][team]:50000]);
 audiences.push([visible?[[5,4,3,2],[10,13,9,7]][week][team]:'','TEST — données fictives']);
 dates.push([row[1]]);visibility.push([visible?'Public':'Brouillard',visible?'Public':'Brouillard']);});
 r.getRange('F6:F85').setValues(listens);r.getRange('I6:J85').setValues(audiences);r.getRange('K6:K85').setValues(dates);r.getRange('N6:O85').setValues(visibility);
 SpreadsheetApp.flush();
 const actual=ex.getRange('H6:H13').getValues().flat(),expected=[90,72,54,36,180,234,162,126];
 check.getRange('A1:D9').setValues([['Équipage / relevé','Attendu','Obtenu','Contrôle'],...expected.map((n,i)=>[teams[i%4]+' / '+(i<4?'08/01':'15/01'),n,actual[i],typeof actual[i]==='number'&&Math.abs(actual[i]-n)<0.001?'OK':'À vérifier'])]);
 check.setFrozenRows(1);check.getRange('A1:D9').setWrap(true);check.setColumnWidth(1,280);check.setColumnWidths(2,3,130);
 const statuses=ex.getRange('L6:L13').getValues().flat();
 if(actual.some((v,i)=>typeof v!=='number'||Math.abs(v-expected[i])>0.001)||statuses.some(v=>v!=='Complet'))throw Error('Test créé mais non publié : consulter TEST_CONTROLES et les contrôles de SUIVI_TITRES. Ne pas relancer.');
 pub.getRange('B2:B13').setValues(Array.from({length:12},(_,i)=>[i<2?'Oui':'Non']));
 console.log('OK : Spotify, YouTube et Amazon comptent ; 50 000 écoutes Deezer et Apple par titre restent dans la brume.');
 console.log('HOUBLON_TEST_SPREADSHEET_ID = '+s.getId());
 console.log('Partager cette copie en Lecteur au compte de service utilisé dans Vercel.');
}
