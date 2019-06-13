module.exports = { isPointInLeg, calcRouteSteps, getClassRoutes, fixDuplicates}

const turf = require("@turf/turf");
const database = require ("./database");
    
function isPointInLeg (start_step, end_step) {
    
    let sum_step =  0;
    let pointsOfStep =[];
    for (let element in database){
    
        let pt = turf.point(database[element]['location']);
        let line = turf.lineString([start_step,end_step]);
        let distance = turf.pointToLineDistance(pt, line, {units: 'kilometers'});
        if (distance <= 0.010){ 
            sum_step += (database[element]['numOfAccidents']);
            pointsOfStep.push(database[element]);
        };
    }
    //Return sum of step and array of danger points in step
    return [sum_step,pointsOfStep];
}

function calcRouteSteps (steps) {
    let route_score = 0; //toal score of route,calculating all steps
    let pointOfAllSteps =[];
    for (let current in steps){
        let start_step = steps[current]['start_location'];
        let end_step = steps[current]['end_location'];
        //Calling isPointInLeg function to calculate step score
        let result = isPointInLeg([ start_step['lat'], start_step['lng'] ],
        [ end_step['lat'], end_step['lng'] ])
        
        let step_score = result[0];
        let pointOfStep = result[1];
        //Adds the resulting points to the totoal route array
        pointOfAllSteps =pointOfAllSteps.concat(pointOfStep);
       
        route_score += step_score;
    }
    return [route_score, pointOfAllSteps];
}
//Called by index 
//Returns an array of colors according to the original routes order 
function getClassRoutes (routes){
    
    let scores_array = [];
    let address_array  =[];
    for (let r in routes){
        let legs = routes[r]['legs'];
        scores_array.push(0);
        let points_array = [];
        //Calculating total route class by legs
        for (let leg in legs){
            let result = calcRouteSteps(legs[leg]['steps']); 
            let score_leg= result[0];
            let points_leg = result[1];
            if (points_leg != ""){
                points_array = points_array.concat(points_leg);
            }
            scores_array[r] += score_leg; 
        }
        let not_added_warn = topThreePoints(points_array);
        not_added_warn = unique(not_added_warn);
        //adds random warnnings to dangerpoint 
        address_array.push(addWarnning(not_added_warn));  
    }

    let fixed_scores = fixDuplicates(scores_array);
    //Create a copy array sorted
    let sorted_scores = (fixed_scores.slice()).sort((a, b) => a - b);
    let routes_color = [];
    for(let i in sorted_scores){
        //Index of values (original array) represent the color index (0-2) 
        routes_color.push(sorted_scores.indexOf(fixed_scores[i]));   
    }
    let rates_array = getRates(fixed_scores);
    return [routes_color, address_array, rates_array];
}

function unique(array){
    let uniqueArray = [];
    for (let i in array){
        if (uniqueArray.length ==0){
            uniqueArray.push(array[i]);
        }else{
            if(array[i] != array[i-1] && (i == 2)){
                if(array[i] != array[i-2]){
                    uniqueArray.push(array[i]);}
            }
            if(array[i] != array[i-1] && (i == 1)){
                uniqueArray.push(array[i]);
            }
        }
    }
    return uniqueArray;
}
//Creates array of tuples (address, warnning)
function addWarnning (array){
    let warn = ["Stay attentive","Check the traffic","Ride carefully","Pay attention to the road","Be aware of obstacles"];
    if(array.length == 0){return [];}
    let address_warn = new Array ();
    for (let i in array){
        let index = Math.round(Math.random() * 4);
        if (array[i] != ""){
            address_warn.push({'address': array[i],'warning': warn[index]});
        }   
    }
    return address_warn;
}

function getRates (scoresArray){
    let ratesArray = [];
    let sumOfScores = sumArray(scoresArray);
    let zero = false;
    if (sumOfScores == 0){
        zero =true; 
    }
    for (let i in scoresArray){
        if(!zero){
            let rate = 10 - (9*((scoresArray[i]+0.0001)/(sumOfScores+0.00011)));
            rate = (Math.floor(rate*10)) / 10;
            ratesArray.push(rate);
        }else {ratesArray.push(10); }   
    }
    return ratesArray;
}
//Returns sum of elements in given array
function sumArray (array){
    let sum = 0;
    for (let i in array){
        sum += array[i];
    }
    return sum;
}

function topThreePoints (points_array){
    let numOfAccidents_array =[];
    let numOfAccidents_array_sorted =[];
    for (let i in points_array ){
        numOfAccidents_array.push(database[i]['numOfAccidents']);
        numOfAccidents_array_sorted.push(database[i]['numOfAccidents']);
    }
    (numOfAccidents_array_sorted.sort()).reverse();
    
    if (numOfAccidents_array_sorted.length > 3){
        //Gets the 3 highest rated point    
        numOfAccidents_array_sorted = numOfAccidents_array_sorted.slice(0,3);
    }
    let topThreeArray = [];
    for(let i in numOfAccidents_array_sorted){
        //Gets the index of the point in the original given array
        let index = numOfAccidents_array.indexOf(numOfAccidents_array_sorted[i]);
        topThreeArray.push(points_array[index]['address']); 
    }
    return topThreeArray;
}
//Returns an array with unique values-scores
function fixDuplicates (arrayColors){

    let fixedColors =[];
    for (let i in arrayColors ){
        let current = arrayColors[i];
        let flag = true;
        for (let j in arrayColors ){
            //If values are equale and index is grater than current element
            if ((current == arrayColors[j]) && (i < j)){
                flag = false;
            }
        }
        if(!flag){ //found an equal element
            fixedColors.push(arrayColors[i]+ (Math.random()*0.5));
        }else{
            fixedColors.push(arrayColors[i]);
        }
    }
    return fixedColors;
}