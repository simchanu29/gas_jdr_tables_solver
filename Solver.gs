// Class for memory management
var Jdr = function(name, id, minJ, maxJ){
  this.name = name;
  this.id = id;
  this.minJoueurs = minJ;
  if(this.minJoueurs == "") this.minJoueurs = 0;
  this.maxJoueurs = maxJ;
  if(this.maxJoueurs == "") this.maxJoueurs = 0;
  this.MJ = undefined;
  this.participants = [this.MJ];

  this.setMJ = function(MJ){
    this.MJ = MJ;
    this.participants[0] = this.MJ;
  }

  this.print = function(){
    Logger.log(this.name);
    Logger.log(this.id);
    Logger.log(this.participants);
  }

  this.reset = function () {
    this.participants = [this.MJ]
  }
};

var Personne = function(name, id){
  this.name = name;
  this.id = id;
  this.tables_joueur = [];
  this.mises = {}; // dict
  this.mises_valide = {}; // dict
  this.best_mises_valide = {};
  this.tables_mjs = [];
  this.tables_mjs_active = [];
  this.best_tables_mjs_active = [];

  this.reset_mises_valide = function() {
    for (var key in this.mises){
      this.mises_valide[key] = 0;
    }
  }
  this.reset_best_mises_valide = function() {
    for (var key in this.mises){
      this.best_mises_valide[key] = 0;
    }
  }
  this.update_best_mises_valide = function(){
    for (var key in this.mises){
      this.best_mises_valide[key] = this.mises_valide[key];
    }
  }
  this.update_best_tables_mjs_active = function(){
    this.best_tables_mjs_active = this.tables_mjs_active.slice()
  }
  this.reset = function () {
    this.tables_joueur = [];
    this.tables_mjs_active = [];
    this.reset_mises_valide();
  }
}

var Round = function(numberOfTables, id, personnes_dispo, jdr_dispo){
  this.id = id;
  this.numberOfTables = numberOfTables;
  this.personnes_dispo_round = personnes_dispo.slice();
  this.jdr_dispo_round = jdr_dispo.slice();
  this.tab_jdr_round = new Array(numberOfTables);

  this.jdr_choisi = undefined;
  this.round_happyness = 0;

  this.loggerlog = function(){
    this.tab_jdr_round.forEach(function(item, index){
      //Logger.log(item.name)
    });
  }
  this.set_current_MJ_as_busy = function() {
    // On enlève le MJ des gens disponibles et on lui ajoute sa table active
    this.jdr_choisi.MJ.tables_mjs_active.push(this.jdr_choisi);
    const id = this.personnes_dispo_round.indexOf(this.jdr_choisi.MJ);
    this.personnes_dispo_round.splice(id, 1);

    // On enlève ses jdr des jdrs disponibles
    this.jdr_choisi.MJ.tables_mjs.forEach(function(jdr, index){
      const id = this.jdr_dispo_round.indexOf(jdr);
      this.jdr_dispo_round.splice(id, 1);
    }, this);
  }
  this.get_random_jdr = function(jdr_dispo_round){
    // On vérifie qu'il reste un jdr disponible
    if(this.jdr_dispo_round.length == 0){
      return 1 // EXIT
    }

    // On prend une partie au hasard parmis celles disponibles
    const jdr_id_random = generate_random_integer(0, this.jdr_dispo_round.length - 1);
    this.jdr_choisi = jdr_dispo_round[jdr_id_random]; // Contenu de la cellule du tableau round

    // Vérification qu'il y a assez de gens pour participer, n'arrive que si le nombre de joueur inital n'est pas assez élevé
    if(this.personnes_dispo_round.length < this.jdr_choisi.minJoueurs){return 1} // EXIT
    return 0
  }
  this.choose_players = function() {

    // Pour participant disponible on lui assigne une place sur une des deux tables

    // Pour chaque participant dispo (place en gros)
    // On calcule qui a la plus grosse mise sur les deux tables
    // Ensuite on lui donne sa table
    // Puis on retire la personne des dispo
    // Puis si la table est pleine on retire la table
    const gens_a_caser = this.personnes_dispo_round.length;
    var tab_jdr_round_tmp = this.tab_jdr_round.slice()

    for(var i = 0; i<gens_a_caser; i++){ // Pour chaque place
      var plus_gros_parieur = this.personnes_dispo_round[0];
      var jdr_plus_gros_pari = tab_jdr_round_tmp[0];
      var mise = 0;

      this.personnes_dispo_round.forEach(function(participant, index){ // Pour chaque personne
        var participant = participant;
        tab_jdr_round_tmp.forEach(function(jdr, jdr_index){ // Pour chaque place
          var new_mise = participant.mises[tab_jdr_round_tmp[jdr_index].name];
          if(new_mise > mise){
            mise = new_mise;
            plus_gros_parieur = participant
            jdr_plus_gros_pari = jdr
          }
          else if (new_mise==mise) {
            const choix = generate_random_integer(0,1);
            if(choix == 1){
              plus_gros_parieur = participant
              jdr_plus_gros_pari = jdr
            }
          }
        });
      });

      // Le plus gros parieur a sa place
      if(jdr_plus_gros_pari){ // Si il n'y a plus de jdr dispo dans ce cas là on ne peut plus donner de places
        jdr_plus_gros_pari.participants.push(plus_gros_parieur);
        plus_gros_parieur.mises_valide[jdr_plus_gros_pari.name] = 1;
        this.personnes_dispo_round.splice(this.personnes_dispo_round.indexOf(plus_gros_parieur), 1)

        // Clean si le jdr est plein
        if(jdr_plus_gros_pari.maxJoueurs < jdr_plus_gros_pari.participants.length){
          const id = tab_jdr_round_tmp.indexOf(jdr_plus_gros_pari);
          tab_jdr_round_tmp.splice(id,1)
        }
      }
    }
  }
  this.compute_happyness = function() {
    // Si il reste des gens de dispo alors le round est mauvais
    this.round_happyness = 0;
    this.round_happyness -= this.personnes_dispo_round.length*1000
    if(this.round_happyness < 0){
      console.log("ERROR personne toute seule")
    }

    // On calcule les gens dont les mises sont valides
    this.tab_jdr_round.forEach(function(jdr, index){
      var jdr = jdr;
      jdr.participants.forEach(function(participant, index){
        if(participant.mises_valide[jdr.name]==1){
          this.round_happyness += participant.mises[jdr.name];
        }
        else{
          this.round_happyness -= participant.mises[jdr.name];
        }
      }, this);
    }, this);
  }
  this.generate_round = function() {

    // Pour chaque table du round
    //this.tab_jdr_round.forEach(function (item, index_jdr) {
    for (var i = 0; i<this.numberOfTables; i++) {

        // Vérification que le pick est correct
        if(this.get_random_jdr(this.jdr_dispo_round) == 1){
          return 1
        } // EXIT (1 = erreur)

        // On stocke le jdr dans la config
        this.tab_jdr_round[i] = this.jdr_choisi;

        this.set_current_MJ_as_busy();
    //});
    }

    this.choose_players();
    this.compute_happyness();
  }
}

var Solver = function(tableMise, tableConfigGlobale, tableConfigLocale, stringRangeTableHandleRound, stringRangeTableHandleVote, stringOutputContentement){
  this.jdr_init = [];
  this.personnes_init = [];
  this.jdr_dispo = [];
  this.personnes_dispo = [];
  // this.tab_jdr_choisi = [];

  this.tableMise = tableMise;
  this.tableConfigLocale = tableConfigLocale;
  this.stringRangeTableHandleRound = stringRangeTableHandleRound;
  this.stringRangeTableHandleVote = stringRangeTableHandleVote;
  this.stringOutputContentement = stringOutputContentement;

  const sheetName = "Système de choix par enchère"
  this.tableHandleRound = getRange(this.stringRangeTableHandleRound, sheetName);
  this.tableHandleVote = getRange(this.stringRangeTableHandleVote, sheetName);
  this.outputContentement = getRange(this.stringOutputContentement, sheetName);
  this.rounds_data = transposeArray(this.tableHandleRound.getValues()); // lico ça nous va pas on veut du coli
  this.rounds = new Array();

  // Initialisation de la fonction de cout
  this.contentement = -100000;
  this.best_rounds = [];

  this.import_data = function() {
    // Gestion des mises (2D array [ligne[colonne]] -> coli)
    tableMise.forEach(function (item_ligne, index_ligne) {
      var item_ligne = item_ligne;
      var index_ligne = index_ligne;

      item_ligne.forEach(function (item_col, index_col) {
        if(index_ligne == 0){ // Creation des tables
          if(index_col > 0){
            var new_jdr = new Jdr(item_col, index_col, tableConfigLocale[2][index_col], tableConfigLocale[3][index_col])
            this.jdr_init.push(new_jdr);
          }
        }
        else{
          // Creation des joueurs
          if(index_col == 0){ // On prends les noms de la 1ère colonne
            if(index_ligne > 0){ // On évite la première ligne
              const personne = new Personne(item_ligne[0], index_ligne);
              this.personnes_init.push(personne)
            }
          }
          else{
            // Pour les autres colonnes c'est les mises. (li/co)
            const jdr_name = tableMise[0][index_col];
            var mise_value = item_col;
            if(mise_value == "") mise_value = 0;
            else mise_value = parseInt(mise_value);
            this.personnes_init[index_ligne-1].mises[jdr_name] = mise_value;
          }
        }
      }, this);
    }, this);


    // Gestion des MJs
    this.jdr_init.forEach(function (jdr, index_jdr) {
      var MJ_name = tableConfigLocale[4][jdr.id]; // [Ligne][Colonnes]
      var MJ = this.personnes_init.findByName(MJ_name);
      jdr.setMJ(MJ);
      this.personnes_init[MJ.id-1].tables_mjs.push(jdr);
    }, this);

    // Gestion des mises validées
    this.personnes_init.forEach(function (personne, index_personne) {
      personne.reset_mises_valide()
      personne.reset_best_mises_valide()
    });
    // jdr_dispo = jdr_init.slice(); // clone
    // personnes_dispo_round = personnes_init.slice();
  }
  this.choose_best_run = function(){
    var new_contentement = 0;

    this.rounds.forEach(function(round, index){
      new_contentement += round.round_happyness;
    });

    if(new_contentement > this.contentement){
      this.contentement = new_contentement;
      this.best_rounds = this.rounds.slice();
      this.personnes_init.forEach(function(personne, index){
        personne.update_best_mises_valide();
        personne.update_best_tables_mjs_active();
      })
    }

    //console.log("%s/%s", new_contentement, this.contentement)
  }
  this.remove_tables_of_busy_GMs = function(){
    // On enlève les jdr des meujeus qui ont trop mejeuté
    this.personnes_init.forEach(function (personne, index) {
      // On vérifie combien de table active a chaque MJ
      if(personne.tables_mjs_active.length >= tableConfigGlobale[1][1]){
        // Si max atteint on enlève ses jdr pour le prochain round
        personne.tables_mjs.forEach(function (jdr, index) {
          var id = this.jdr_dispo.indexOf(jdr)
          if(id != -1){
            this.jdr_dispo.splice(id, 1)
          }
        }, this);
      }
    }, this);
  }
  this.reset_iteration = function(){
    this.jdr_dispo = this.jdr_init.slice();
    this.personnes_dispo = this.personnes_init.slice();
    this.rounds = [];

    this.jdr_dispo.forEach(function(jdr, index){
      jdr.reset();
    });
    this.personnes_dispo.forEach(function(personne, index){
      personne.reset();
    });
  }
  this.modify_spreadsheet = function(){
    this.best_rounds.forEach(function(round, index_round){
      var index_round = index_round;
      round.tab_jdr_round.forEach(function(table, index_table){
        this.tableHandleRound.getCell(index_table+2, index_round+2).setValue(table.name);
      }, this);
    }, this);

    var tableHandleVoteValues = this.tableHandleVote.getValues();
    this.personnes_init.forEach(function(personne, index){
      var personne = personne;
      for (var table in personne.mises_valide) {
        if (personne.mises_valide.hasOwnProperty(table)) {

          // On trouve la bonne colonne (recherche sur ligne 0)
          var col = tableHandleVoteValues[0].indexOf(table);

          // On trouve la bonne ligne (recherche sur colonne 0)
          var first_line = tableHandleVoteValues.map(function(x) { return x[0] });
          var ligne = first_line.indexOf(personne.name);

          // On note le vote (pour getCell le début est à 1, fonctionne en lico)
          var mise = personne.best_mises_valide[table];

          if(personne.best_tables_mjs_active.findByName(table) != -1){
            var mise = 1;
          }

          this.tableHandleVote.getCell(ligne+1, col+1).setValue(mise);
        }
      }
    }, this);

    // Set cell for contentement
    this.outputContentement.getCell(1,1).setValue(this.contentement);
  };
  this.clean_spreadsheet = function(){
    var tableHandleVoteValues = this.tableHandleVote.getValues();
    for (var i = 1; i<tableHandleVoteValues.length; i++){
      for (var j = 1; j<tableHandleVoteValues[0].length; j++){
        this.tableHandleVote.getCell(i+1, j+1).setValue("");
      }
    }

    var tableHandleRoundValues = this.tableHandleRound.getValues();
    for (var i = 1; i<tableHandleRoundValues.length; i++){
      for (var j = 1; j<tableHandleRoundValues[0].length; j++){
        this.tableHandleRound.getCell(i+1, j+1).setValue("");
      }
    }
  }
  this.run = function(numberOfIterations) {
    console.log("Running solver with %d iterations", numberOfIterations)

    this.import_data();
    console.log("Data imported")

    console.log("Cleaning spreadsheet");
    this.clean_spreadsheet()

    for(var i = 1; i<numberOfIterations; i++){
      //console.log("Iteration %d", i)

      this.reset_iteration();
      //console.log("Reset done")

      for(var j = 0; j<this.rounds_data.length-1; j++){
        //console.log("Round %d", j)
        // Generation du round
        this.rounds.push(new Round(this.rounds_data[0].length-1, j, this.personnes_dispo, this.jdr_dispo))
        this.rounds[j].generate_round();

        // On enlève les jdr du round précédent
        this.rounds[j].tab_jdr_round.forEach(function(jdr, index){
          this.jdr_dispo.splice(this.jdr_dispo.indexOf(jdr), 1);
        }, this);

        this.remove_tables_of_busy_GMs();
      }

      //console.log("Choose best run : %d", this.contentement)
      this.choose_best_run();
    }

    this.rounds.forEach(function(item){item.loggerlog()});
    console.log("Modify spreadsheet")
    this.modify_spreadsheet();
  }
};

// CODE
function SOLVETABLES(tableMise, tableConfigGlobale, tableConfigLocale, stringRangeTableHandleRound, stringRangeTableHandleVote, stringOutputContentement, numberOfIterations) {
  var solver = new Solver(tableMise, tableConfigGlobale, tableConfigLocale, stringRangeTableHandleRound, stringRangeTableHandleVote, stringOutputContentement);
  solver.run(numberOfIterations);
  return solver.contentement;
}

function test_solver(){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Système de choix par enchère");

  Logger.clear();
  var result = SOLVETABLES(sheet.getRange("A51:T62").getValues(), sheet.getRange("A2:B4").getValues(), sheet.getRange("A7:T11").getValues(), "A79:G81", "A65:T76", "A85", 5000);
  Logger.log(result)
}
