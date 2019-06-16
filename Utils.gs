// Random functions
function range (start, end) {
  const length = end - start + 1;
  var array = Array(length);
  for(var i = 0; i<length; i++){
    array[i] = i + start;
  }
  return array;
}
function generate_random_integer(min, max){
  return ~~(Math.random() * (max + 1 - min) + min);
}
function generate_random_unique_integers(min, max, size){
  // Generate range tab from min and max
  var init_tab = range(min, max);

  // Initialize output tab
  var result_tab = Array(size);
  for(var i = 0; i<size; i++){
    var id_random = generate_random_integer(0, init_tab.length - 1);
    result_tab[i] = init_tab[id_random];
    init_tab.splice(id_random, 1);
  }

  // Result
  return result_tab
}

// Utils for arrays
function transposeArray(array){
    var newArray = [];
    for(var i = 0; i < array[0].length; i++){
        newArray.push([]);
    };

    for(var i = 0; i < array.length; i++){
        for(var j = 0; j < array[0].length; j++){
            newArray[j].push(array[i][j]);
        };
    };

    return newArray;
}

Array.prototype.findByName = function(name) {
  if(name === '') return false;
  for (var i = 0, len = this.length; i < len; i++)
    if (this[i].name === name) return this[i];
  return -1;
}

function getRange(string, sheetName) {
  // SpreadsheetApp.getActiveSheet().getRange('F2').setValue('Hello');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  return sheet.getRange(string);
}
