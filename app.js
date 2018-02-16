//////////////////////////////////////
// BUDGET CONTROLLER
var budgetController = (function() {

  var Expense = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calcPercentage = function(totalIncome) {
    if(totalIncome > 0){
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };

  Expense.prototype.getPercentage = function() {
    return this.percentage;
  };

  var Income = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var calculateTotal = function(type) {
    var sum = 0;
    data.allItems[type].forEach(function(curr) {
      sum += curr.value;
    });
    data.totals[type] = sum;

  };

  var data = {
    allItems: {
      exp: [],
      inc: []
    },
    totals: {
      exp: 0,
      inc: 0
    },
    budget: 0,
    percentage: -1
  };

  // TODO: Implementing Local Storage
  var budgetyStorage = window.localStorage;
  var appData = 'data';

  return {
    // TODO: Implementing Local Storage
    setLocalData: function() {
      budgetyStorage.setItem(appData, JSON.stringify(data));
    },

    getLocalData: function(){
      //console.log( JSON.parse(budgetyStorage.getItem(appData)) );
      return JSON.parse(budgetyStorage.getItem(appData));
    },

    addItem: function(type, des, val) {
      var newItem, ID;

      // [1 2 3 4 5], next ID = 6
      // [1 2 4 6 8], next ID = 9
      /* Simple length solution won't work because after we delete some items
         we will eventually end up with two colliding same id numbers

         Solved by taking the last item id and increasing that by 1.
         data.allItems[type][data.allItems[type].length - 1].id + 1;
      */
      // ID = lastID + 1

      // Create new ID
      if(data.allItems[type].length > 0){
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        ID = 0;
      }

      // Create new item based on 'inc' or 'exp' type
      if(type === 'exp'){
        newItem = new Expense(ID, des, val);
      } else if (type === 'inc') {
        newItem = new Income(ID, des, val);
      }
      
      // Push new item into data structure
      data.allItems[type].push(newItem);

      // Return the new element
      return newItem;
    },

    deleteItem: function(type, id) {
      var ids, index;

      ids = data.allItems[type].map(function(current) {
        return current.id;
      });
      index = ids.indexOf(id);

      if(index !== -1) {
        data.allItems[type].splice(index, 1);
      }

    },

    calculateBudget: function() {
      
      // Calculate total income and expenses
      calculateTotal('exp');
      calculateTotal('inc');

      // Calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;

      // Calculate the percentage of income that we spent
      if(data.totals.inc > 0){
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }

    },

    calculatePercentages: function() {

      /*
        a = 20
        b = 10
        c = 40
        income = 100
        a = 20 / 100 = 20%
        b = 10 / 100 = 10%
        c = 40 / 100 = 40%
      */

      data.allItems.exp.forEach(function(curr) {
        curr.calcPercentage(data.totals.inc);
      });
    },

    getPercentages: function() {
      var allPerc = data.allItems.exp.map(function(curr) {
        return curr.getPercentage();
      });
      return allPerc;
    },

    getBudget: function() {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage
      };
    },

    testing: function() {
      console.log(data);
    }
  }

})();


//////////////////////////////////////
// UI CONTROLLER
var UIController = (function() {

  var DOMstrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputBtn: '.add__btn',
    incomeContainer: '.income__list',
    expensesContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expensesLabel: '.budget__expenses--value',
    percentageLabel: '.budget__expenses--percentage',
    container: '.container',
    expensesPercLabel: '.item__percentage',
    dateLabel: '.budget__title--month'
  };

  var formatNumber = function(num, type) {
    var numSplit, int, dec, type;
    /*
      + or - before number
      exctly 2 decimal points
      comma separating thousands

      2310.4567 -> + 2,310.46
      2000 -> + 2,000.00
    */

    num = Math.abs(num);
    num = num.toFixed(2);

    numSplit = num.split('.');
    int = numSplit[0];

    // TODO: Added support for Million.
    // To remove make the else if the main IF.
    if(int.length > 6){
      int = int.substr(0, int.length - 6) + ',' + int.substr(1, int.length - 4) + ',' + int.substr(int.length - 3, 3);
    } else if(int.length > 3) {
      int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
      // input 23510 -> output 23,510
    }

    dec = numSplit[1];
    
    return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
  };

  var nodeListForEach = function(list, callback) {
    for (var i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  return {
    getInput: function() {
      return {
        type: document.querySelector(DOMstrings.inputType).value, // Will be either inc or exp
        description: document.querySelector(DOMstrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
      };
    },

    addListItem: function(obj, type) {
      var html, element;

      // Create HTML string with placeholder text
      if(type === 'inc'){
        element = DOMstrings.incomeContainer;
        html = `<div class="item clearfix" id="inc-${obj.id}">
          <div class="item__description">${obj.description}</div>
          <div class="right clearfix">
            <div class="item__value">${formatNumber(obj.value, type)}</div>
            <div class="item__delete">
              <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
            </div>
          </div>
        </div>`;
      } else if (type === 'exp'){
        element = DOMstrings.expensesContainer;
        html = `<div class="item clearfix" id="exp-${obj.id}">
          <div class="item__description">${obj.description}</div>
          <div class="right clearfix">
            <div class="item__value">${formatNumber(obj.value, type)}</div>
            <div class="item__percentage">21%</div>
            <div class="item__delete">
              <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
            </div>
          </div>
        </div>`
      }
      
      // Replace placeholder text with some actual data
      // The below method is what we would use, however, I have used the `` syntax
      // to make my string and already replaced our placeholders with ${obj.id}
      /*
        var newHTML;
        newHTML = html.replace('%id%', obj.id);
        newHTML = newHTML.replace('%description%', obj.description);
      */

      // Insert the HTML into the DOM
      document.querySelector(element).insertAdjacentHTML('beforeend', html);

    },

    deleteListItem: function(selectorID) {
      var element = document.getElementById(selectorID);
      element.parentNode.removeChild(element);
    },

    clearFields: function() {
      var fields, fieldsArray;

      fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
      
      // Trick the slice into thinking we are sending it an array
      // in order to get back an array of fields.
      fieldsArray = Array.prototype.slice.call(fields);

      // Loops over all of the elements of the fields array
      // and clears them.
      fieldsArray.forEach(function(current, index, array) {
        current.value = '';
      });

      fieldsArray[0].focus();
    },

    displayBudget: function(obj) {
      var type;
      obj.budget > 0 ? type = 'inc' : type = 'exp';
      document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
      document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
      document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
      
      if(obj.percentage > 0){
        document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
      } else {
        document.querySelector(DOMstrings.percentageLabel).textContent = '---';
      }
      
    },

    displayPercentages: function(percentages) {
      var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

      nodeListForEach(fields, function(current, index) {
        if(percentages[index] > 0){
          current.textContent = percentages[index] + '%';
        } else {
          // current.textContent = '---';
          //FIXME: Changed the item percentage from '---' to '<1%'
          current.textContent = '<1%';
        }
      });

    },

    displayMonth: function() {
      var now, year, month;
      now = new Date();

      year = now.getFullYear();
      month = now.toLocaleString('en-us', {month: "long"});
      
      document.querySelector(DOMstrings.dateLabel).textContent = `${month}, ${year}`;
    },

    changedType: function() {
      var fields = document.querySelectorAll(
        DOMstrings.inputType + ',' +
        DOMstrings.inputDescription + ',' +
        DOMstrings.inputValue
      );

      nodeListForEach(fields, function(curr) {
        curr.classList.toggle('red-focus');
      });

      document.querySelector(DOMstrings.inputBtn).classList.toggle('red');

    },

    // Pass the DOMstrings to other Modules.
    getDOMstrings: function() {
      return DOMstrings;
    }

  };

})();

//////////////////////////////////////
// GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, UICtrl) {


  var setupEventListeners = function () {
    var DOM = UICtrl.getDOMstrings();

    document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

    document.addEventListener('keypress', function (event) {
      if (event.keyCode === 13 || event.which === 13) {
        ctrlAddItem();
      }
    });

    document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

    document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
  };

  var updateBudget = function() {
    var budget;
    
    // 1. Calculate the budget
    budgetCtrl.calculateBudget();

    // 2. Return the budget
    budget = budgetController.getBudget();

    // 3. Display the budget on the UI
    UICtrl.displayBudget(budget);

  };

  var updatePercentages = function() {

    // 1. Calculate percentages
    budgetCtrl.calculatePercentages();
    // 2. Read percentages from budget controller
    var percentages = budgetCtrl.getPercentages();
    // 3. Update the UI with the new percentages
    UICtrl.displayPercentages(percentages);

  };

  var ctrlAddItem = function () {
    var input, newItem;

    // 1. Get the field input data.
    input = UICtrl.getInput();

    if (input.description !== '' && !isNaN(input.value) && input.value > 0){
      // 2. Add the item to the budget controller.
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);

      // 3. Add the new item to the UI
      UICtrl.addListItem(newItem, input.type);

      // 4. Clear the fields 
      UICtrl.clearFields();

      // 5. Calculate and update budget
      updateBudget();

      // 6. Calculate and update percentages
      updatePercentages();

      // 7. Update the local data storage (#Experimental)
      // TODO: Implementing Local Storage
      budgetCtrl.setLocalData();
      budgetCtrl.getLocalData();

    }

  };

  var ctrlDeleteItem = function(event) {
    var itemID, splitID, type, ID;
    // This method is not so good because it is hard coded and we rely on
    // the DOM setup A LOT. (100%).
    // However, we also hardcoded the html child of the target event
    // so any change or error can be only caused by us.
    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

    /*
      This whole method should be solved better because it's not our
      brightest moment.
      However, (excuses excuses) we know that for our project it will not
      quite cause a mayhem.
      ex. Having more ID's and causing a knob in the rope.
    */
    if(itemID) {
      
      //inc-1
      splitID = itemID.split('-');
      type = splitID[0];
      ID = parseInt(splitID[1]);

      // 1. Delete the item from the data structure
      budgetCtrl.deleteItem(type, ID);

      // 2. Delete the item from the UI
      UICtrl.deleteListItem(itemID);

      // 3. Update and show new budget
      updateBudget();
      
      // 4. Calculate and update percentages
      updatePercentages();

      // 5. Update the local data storage (#Experimental)
      // TODO: Implementing Local Storage
      budgetCtrl.setLocalData();
      budgetCtrl.getLocalData();

    }

  };

  // TODO: Implementing Local Storage
  // Read data from local storage and input
  var loadLocalData = function() {
    var downloadedData;
    downloadedData = budgetCtrl.getLocalData();

    // The data must not be null in order to call
    // the load method.
    if(downloadedData !== null){
      downDataItems = downloadedData.allItems;
    }

    var loadLocalIncomes = function () {
      if (downDataItems.inc.length > 0) {
        for (var i = 0; i < downDataItems.inc.length; i++) {
          budgetCtrl.addItem('inc', downDataItems.inc[i].description, downDataItems.inc[i].value);
          UICtrl.addListItem(downDataItems.inc[i], 'inc');
        }
      }
    };

    var loadLocalExpenses = function() {
      if (downDataItems.exp.length > 0) {
        for (var i = 0; i < downDataItems.exp.length; i++) {
          budgetCtrl.addItem('exp', downDataItems.exp[i].description, downDataItems.exp[i].value);
          UICtrl.addListItem(downDataItems.exp[i], 'exp');
        }
      }
    };
    
    // The data must not be null in order to call
    // the load method.
    if(downloadedData !== null){
      loadLocalIncomes();
      loadLocalExpenses();
      updateBudget();
      updatePercentages();
    }
  };

  return {
    init: function() {
      console.log('%c Application started', 'color: green');
      UICtrl.displayMonth();
      UICtrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: -1
      });

      // TODO: Implementing Local Storage
      loadLocalData();
      
      // Setup the event listeners (important)
      setupEventListeners();
    }
  };
  
})(budgetController, UIController);

// Initializes the application
controller.init();