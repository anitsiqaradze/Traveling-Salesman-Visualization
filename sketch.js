



//////////////////////////////////////////////////
let cities = [];
let totalCities = 4;
let numCities = 4; // Set initial value to match totalCities
let useCustomWeights = false;
let showWeightsPanel = false;
let customWeights = [];
let currentRoute = null;
let sourceSelectionActive=false;
let srcInsruction = '';
let sf = 1; // scale factor



let instructionsText = 
  "Welcome to the Traveling Salesman Problem Visualization! </br> "+
  "1. Adjust the number of vertices using the input box and 'Set' button </br> "+
  "2. Click 'Edit Weights' to customize the distances between vertices </br> "+
  "3. Click 'Traveling Salesman' to find the shortest path </br> "+
  "4. When prompted, click on a vertex to select it as the starting point </br>  "+
  "5. Watch the animation as the algorithm finds the path </br> "
;

let margin = 50;

let routeAnimation ={
    active: false,
    currentIndex : 0, // which segment of route drawing i am on
    speed : 2, // two fps
    timer:0 //keeps track of when last frame happened
}

  window.addEventListener("wheel", function(e) {
    console.log("scroll");
    console.log(e)
  if (e.deltaY > 0)
    sf *= 1.05;
  else
    sf *= 0.95;
});
function setup() {
    createCanvas(600, 400);
     initControls();
    createWeightsPanel();
    resetSimulation(); // Initialize cities on startup
    
    

}


function draw() {
    push();
    if((mouseX >=0 && mouseX<=width)&&(mouseY >=0 && mouseY<=height)&&!sourceSelectionActive){
     translate(mouseX, mouseY);
     scale(sf);
     translate(-mouseX, -mouseY);
    }
   
    background(102,93,84);
    drawCities();
    showDistances();

      
     


     if(currentRoute&&currentRoute.length>1 && routeAnimation.active) showRoute(currentRoute);


   pop();
    if(currentRoute) drawResult(currentRoute);
    if(sourceSelectionActive){
         
        srcInsruction = "select vertex as source"; 
        
    }
    else {
        srcInsruction="";
    }

      fill(255);
      textSize(20);
      text(srcInsruction, 200, height-20);
}


function initControls() {
     let instructionsPanel = createDiv().id('instructions-panel');
    instructionsPanel.position(60, 80);
    instructionsPanel.style('background-color', 'rgba(0,0,0,0.7)');
    instructionsPanel.style('color', 'white');
    instructionsPanel.style('padding', '10px');
    instructionsPanel.style('border-radius', '5px');
    instructionsPanel.style('max-width', '480px');
    instructionsPanel.style('border', '1px solid #ccc');
    instructionsPanel.html(instructionsText);
    

   let heading = createDiv('Traveling Salesman Problem');
    heading.position(60, 20);
    heading.style('font-size', '24px');
    heading.style('color', '#fff');
    heading.style('font-weight', 'bold');


    let controlsDiv = createDiv().id('controls-container');
    controlsDiv.position(60, 320);
    controlsDiv.style('background-color', 'rgba(0,0,0,0.7)');
    controlsDiv.style('border-radius', '5px');
    controlsDiv.style('padding', '10px');
    controlsDiv.style('border', '1px solid #ccc');
    


    // Number of cities label
    let label = createDiv('Number of vertices:');
    label.parent(controlsDiv);
    label.style('margin-bottom', '5px');
    label.style('color', '#fff');


    
    // Number of cities input
    let citiesInput = createInput(numCities.toString());
    citiesInput.parent(controlsDiv);
    citiesInput.size(50);
    citiesInput.style('margin-right', '10px');

    // Set button
    let setButton = createButton('Set');
    setButton.parent(controlsDiv);
    setButton.mousePressed(() => {
        let val = int(citiesInput.value());
        numCities = val > 0 ? val : 1; // Ensure at least 1 city
        resetSimulation();
    });
    
    // Add spacing
    createDiv('&nbsp;').parent(controlsDiv);

    // Weights button
    let weightsButton = createButton('Edit Weights');
    weightsButton.parent(controlsDiv);

    weightsButton.mousePressed(() => {
      //  console.log("Show weights button");
        toggleWeightsPanel();

    });
   createSpan('&nbsp;').parent(controlsDiv);
    let travelingSalesmanButton = createButton('Traveling Salesman');
    travelingSalesmanButton.parent(controlsDiv);
    travelingSalesmanButton.mousePressed(()=> {
        currentRoute=null;
        sourceSelectionActive=true;
    });
}


// draw vertices on input update 
function resetSimulation() {
    cities = [];
    currentRoute=null;
          // routeAnimation.active = false;
          // routeAnimation.currentIndex = 0; 
    for (let i = 0; i < numCities; i++) {
        cities.push({
            x: random(margin, width -  5),
            y: random(margin, height - 5)
        });
    }
   // console.log('reset simulation', cities);
    initWeightMatrix();
    updateWeightsPanel();
}



// draw connections between vertices 
function drawCities() {
    for (let i = 0; i < cities.length; i++) {
        // Draw city nodes
        fill(200, 0, 0);
        ellipse(cities[i].x, cities[i].y, 10, 10);
        
        // Draw city labels
        fill(0);
        textAlign(CENTER, CENTER);
        text(i, cities[i].x, cities[i].y - 15);
    }
    
    // Draw connections between cities
    stroke(200);
    strokeWeight(2);
    noFill();
    
    for (let i = 0; i < numCities; i++) {
        for (let j = i + 1; j < numCities; j++) {
            let d;
            if (useCustomWeights) {
                d = customWeights[i][j];
            } else {
                d = dist(cities[i].x, cities[i].y, cities[j].x, cities[j].y);
                
            }
            line(cities[i].x, cities[i].y, cities[j].x, cities[j].y);
        }
    }
}



/*************   WEIGHTS INPUT *************/
// Functions for managing custom weights
function initWeightMatrix() {
    customWeights = [];
    
    // Initialize with Euclidean distances
    for (let i = 0; i < numCities; i++) {
        customWeights[i] = [];
        for (let j = 0; j < numCities; j++) {
            if (i === j) {
                // Distance to self is 0
                customWeights[i][j] = 0;
            } else if (i < j) {
                // Calculate actual distance for upper triangle
                let d = dist(cities[i].x, cities[i].y, cities[j].x, cities[j].y);
                customWeights[i][j] = parseInt(d.toFixed(0));
              //  console.log(customWeights[i][j]);
            } else {
                // Lower triangle - will be filled in later
                customWeights[i][j] = 0;
            }
        }
    }
    
    // Mirror the upper triangle to the lower triangle to make it symmetric
    for (let i = 0; i < numCities; i++) {
        for (let j = 0; j < i; j++) {
            customWeights[i][j] = customWeights[j][i];
        }
    }
}
 

function createWeightsPanel() {
    let weightsPanel = createDiv().id('weights-panel');

    weightsPanel.style('display', 'none');
    weightsPanel.position(320, 320);
    weightsPanel.style('background-color', 'rgba(0,0,0,0.7)');
    weightsPanel.style('padding', '10px');
    weightsPanel.style('border', '1px solid #fff');
     weightsPanel.style('border-radius', '5px');

    
    

    let matrixContainer = createDiv().id('weight-matrix-container');
    matrixContainer.parent(weightsPanel);
}


// toggle weights input table
function toggleWeightsPanel() {
    let panel = select('#weights-panel');
    if (panel) {
        showWeightsPanel = !showWeightsPanel;
        panel.style('display', showWeightsPanel ? 'block' : 'none');
    }
}


// create ui of table for weights
function updateWeightsPanel() {
    let matrixContainer = select('#weight-matrix-container');
    if (!matrixContainer) return;

    // Clear previous content
    matrixContainer.html('');
    
    // Create table
    let table = createElement('table');
    table.parent(matrixContainer);
    table.style('border-collapse', 'collapse');
  

    // Create header row
    let thead = createElement('thead');
    thead.parent(table);

    let headerRow = createElement('tr');
    headerRow.parent(thead);

    // Empty corner cell
    createElement('th').parent(headerRow).html('&nbsp;');

    // Table header according to matrix
    for (let i = 0; i < numCities; i++) {
        let th = createElement('th');
        th.html(i);
        th.parent(headerRow);
        th.style('padding', '5px');
        th.style('background-color', '#fff');
        th.style('color', '#000');


    }

    // Create table body
    let tbody = createElement('tbody');
    tbody.parent(table);

    for (let i = 0; i < numCities; i++) {
        let row = createElement('tr');
        row.parent(tbody);

        let rowHeader = createElement('th');
        rowHeader.html(i);
        rowHeader.parent(row);
        rowHeader.style('padding', '5px');
        rowHeader.style('background-color', '#fff');
        rowHeader.style('color','#000');

        for (let j = 0; j < numCities; j++) {
            let cell = createElement('td');
            cell.parent(row);
            cell.style('padding', '3px');
            cell.style('border', '1px solid #000');

            if (i == j) {
                cell.html('-');
            } else {
                // Input field for cell
                let input = createInput(customWeights[i][j]);
                input.parent(cell);
                input.size(40);

                input.attribute('data-row', i);
                input.attribute('data-col', j);

                input.input(() => {
                    currentRoute=null;
                    // attributes to find symetrical cell later
                    let row = parseInt(input.attribute('data-row'));
                    let col = parseInt(input.attribute('data-col'));
                    let value = parseInt(input.value());
                    if (!isNaN(value) && value >= 0) {
                        customWeights[row][col] = value;

                        if (row !== col) {
                            customWeights[col][row] = value;

                            // Update symmetric cell
                            let inputs = selectAll('input');
                            for (let inp of inputs) {
                                if (inp.attribute('data-row') == col && 
                                    inp.attribute('data-col') == row) {
                                    inp.value(value);
                                    break;
                                }
                            }
                        }
                    }
                    /********* else *************/
                });
            }
        }
    }


   // console.log(customWeights);
}



// travelin salesman
function travelingSalesman(src) {

 let n = numCities;
 let weightsMatrix = JSON.parse(JSON.stringify(customWeights)); // deep copy of weights matrix

let route =[];
route[0] = src;

let visited = new Array(n).fill(false); // array of visited vertices
let current_vert = src;


for(let i = 0; i < n-1; i++) {
    // find vertex with min weight and add it to route 
    
    let min_index = -1; 
    let min = Infinity;

    for(let j = 0; j < n; j++) {
        if(!(visited[j]) && weightsMatrix[current_vert][j]>0 && min > weightsMatrix[current_vert][j]){
            min = weightsMatrix[current_vert][j];
            min_index=j;
        }
    }
    
    route.push(min_index);
     visited[current_vert] = true; 
     // assign as current vertex
    current_vert = min_index;

}
route.push(src);

// start animation
routeAnimation.active = true;
routeAnimation.currentIndex = 0;
routeAnimation.timer = millis();
currentRoute = route;
sourceSelectionActive=false;

return route;

}

// gradually reveals salesman path
 function showRoute(route){

    let interval = 1000 / routeAnimation.speed;
    // delay between each drawing segment
    // each new segments draws in every 200ms

    if(millis() - routeAnimation.timer > interval){
        // millis is elapsed time since setup started so 
        // condition checks if delay has passed since last draw
        for(let i = 0; i < routeAnimation.currentIndex; i++){
            let from = cities[route[i]];
            let to = cities[route[i+1]];
          
             stroke(255, 0, 0);
            strokeWeight(1);
            line(from.x, from.y, to.x, to.y);

        }
                routeAnimation.currentIndex++;

        if (routeAnimation.currentIndex >= route.length) {
           
          // routeAnimation.active = false;
           routeAnimation.currentIndex = 0;  
          
           // Reset after finishing
       }

        routeAnimation.timer = millis();  // Reset timer
    } else {
        // Keep drawing up to last completed index
        for (let i = 0; i < routeAnimation.currentIndex; i++) {
            let from = cities[route[i % route.length]];
            let to = cities[route[(i + 1) % route.length]];
            stroke(255, 0, 0);
            strokeWeight(1);
            line(from.x, from.y, to.x, to.y);
        }

    }

    //  let fromIndex = route[routeAnimation.currentIndex];
    // let toIndex = route[routeAnimation.currentIndex + 1];  

    // let fromCity = cities[fromIndex];
    // let toCity = cities[toIndex];

    // // Calculate progress (t goes from 0 to 1)
    // let t = routeAnimation.timer / routeAnimation.speed;

    // // Interpolate position
    // let x = lerp(fromCity.x, toCity.x, t);
    // let y = lerp(fromCity.y, toCity.y, t);

    // // Draw the moving circle
    // fill(255, 0, 0);
    // ellipse(x, y, 10, 10);

    // // Increment timer
    // routeAnimation.timer++;

    // If we reached the end of this segment
    // if (routeAnimation.timer > routeAnimation.speed) {
    //     routeAnimation.currentIndex++;
    //     routeAnimation.timer = 0;

    //     // If finished all segments
    //     if (routeAnimation.currentIndex >= route.length - 1) {
    //         routeAnimation.active = false;
    //         routeAnimation.currentIndex = 0;
    //     }
    // }
}


function mousePressed(){
    let selectedSrc;
    if(sourceSelectionActive){
        for(let i = 0; i < cities.length; i++) {
            let d = dist(mouseX, mouseY, cities[i].x, cities[i].y);
            if(d<15){
                selectedSrc = i;

                 travelingSalesman(selectedSrc);
                sourceSelectionActive = false;
                break;
            }
        }
        
    }
   

   
}

function showDistances(){
    for(let i = 0; i < numCities; i++) {
        for(let j = i; j < numCities; j++) {
            if(i!==j){
                let d = customWeights[i][j];
                 let x = (cities[i].x+cities[j].x)/2;
                 let y = (cities[i].y+cities[j].y)/2;
                fill(255);
                textSize(10);
                text(d, x, y);
            }

        }
    }
}

function drawResult(resultr){
    let s = 0;
    
     for(let i = 0; i < numCities; i++){
       // console.log(customWeights[resultr[i]][resultr[i+1]]);
        s+= customWeights[resultr[i]][resultr[i+1]];
     }
    let result  = `your result is ${resultr.join(' -> ')} =  ${s}`;
    fill(255);
    textSize(20)
    text(result, 200, height-20);
    //console.log(result);

}

