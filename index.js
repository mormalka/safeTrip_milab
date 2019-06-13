const routeClassification = require('./classification.js');
const express = require('express');
const app = express();
const server = require('http').createServer(app); //create server 
const bodyParser = require('body-parser');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 8080;
//milab - AIzaSyA6K2JBuOcoZJRG3jKAimRxaWdDqoMXIGk
//afik - AIzaSyA55Fgqx8yShAamvF7B3llMO3ZrIKBZyAs
//google route key 
const googleMapsClient = require('@google/maps').createClient({
  key: "AIzaSyA6K2JBuOcoZJRG3jKAimRxaWdDqoMXIGk"
});

app.get('/routes/:origin/:dest', (req, res) => {
    console.log('Received a GET HTTP method');

    let inputs = {
    origin: req.params.origin, //"IDC Herzliya"
    destination: req.params.dest,
    mode: "bicycling",
    avoid:"highways",
    alternatives:true}

    coloredRoutes ={'header':{},'json': {}};
    coloredRoutes['json']={'geocoded_waypoints':[] ,'routes': [-1,-1,-1], 'status': ''};
        
    googleMapsClient.directions(inputs, function(err, response) {
      
      coloredRoutes['header'] = response['headers'];
      coloredRoutes['json']['geocoded_waypoints'] =response['json']['geocoded_waypoints'];
      coloredRoutes['json']['status']=response['json']['status'];
      
      jRoutes = response['json']['routes'];
      if ( jRoutes.length > 3 ){ 
        jRoutes = [ jRoutes["0"], jRoutes["1"] , jRoutes["2"] ];
      }
      //calling getClassRoutes function to calc colors and point address
      let routesCalc = routeClassification.getClassRoutes(jRoutes);
      let array_colors = routesCalc[0];
      let array_addresses = routesCalc[1]; 
      let array_rates = routesCalc[2];

      for (let r in jRoutes){
        let pos_str = array_colors[r].toString();
    
        coloredRoutes['json']['routes'][pos_str]=
        { 
        'color': array_colors[r],
        'rate': array_rates[r],
        'topThree': array_addresses[r],
        'bounds': {}, 
        'copyrights':'',
        'legs': [],
        'overview_polyline': [],
        'summary': '',
        'warnings': [],
        'waypoint_order': [] };


        coloredRoutes['json']['routes'][pos_str]['bounds']= jRoutes[r]['bounds'];
        coloredRoutes['json']['routes'][pos_str]['copyrights']= jRoutes[r]['copyrights'];
        coloredRoutes['json']['routes'][pos_str]['legs']= jRoutes[r]['legs'];
        coloredRoutes['json']['routes'][pos_str]['overview_polyline']= jRoutes[r]['overview_polyline'];
        coloredRoutes['json']['routes'][pos_str]['summary']= jRoutes[r]['summary'];
        coloredRoutes['json']['routes'][pos_str]['warnings']= jRoutes[r]['warnings'];
        coloredRoutes['json']['routes'][pos_str]['waypoint_order']= jRoutes[r]['waypoint_order'];
        
      };
      console.log(response['json']);
      
      let routesFix = cutEmpty(coloredRoutes['json']['routes']);
     
      coloredRoutes['json']['routes'] = routesFix;
      
      console.log(coloredRoutes['json']);
      //let obj = JSON.stringify(response['json'], null, ' ');
      
      res.json(coloredRoutes['json']);
    });
});

app.listen(PORT, () =>
  console.log(`App listening on port ${PORT}!`),
);

function cutEmpty (routes){
  let i = 0;
  while((routes[i] != -1) && (i < routes.length)){
    i++;
  }
  let res = routes.slice(0,i);
  return res;
}