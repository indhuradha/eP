

/*START#############################################
#
#  Purpose  : Details of all the ports,routes and endpoints 
#
#  Author   : Indhumathi R
#
#  Client   : SPS
#
#  Date     : April 20, 2020
#
######################################################################END*/
/*npm cluster */
const cluster = require('cluster');
/* To get system procesor length */
const numCPUs = require('os').cpus().length;

/* Clustering allows you to create separate processes which can share same server port */
if (cluster.isMaster) {
  //console.log(`Master ${process.pid} is running`);
  cluster.setupMaster({
    windowsHide: true
  });

  //Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', function (worker, code, signal) {
    // console.log('worker ' + worker.process.pid + ' died');
    // kill the other workers.
    for (var id in cluster.workers) {
      cluster.workers[id].kill();
    }
    // exit the master process
    process.exit(0);
  });

}
else {
  var express = require('express');
  const app = require('./routes/app')
  /*config.json file for port & other server endpoint details*/
  let url_port_details = require('./routes/url_port_details');
  let port = url_port_details.port;
  app.use(express.static(__dirname));

  // var https = require('https');
  // var http = require('http');
  // var fs = require('fs');

  // This line is from the Node.js HTTPS documentation.

  // var options = {
  // 	key: fs.readFileSync('/etc/servercerts/privatekeyrsa.key'),
  // 	cert: fs.readFileSync('/etc/servercerts/ServerCertificate.crt')
  // };


  /*Express framework listen command*/
  var server = app.listen(port, function () {
    console.log("Running http e-proofing RestApi on port " + port);

  });

  //  var server = https.createServer(options, app).listen(port,function(){
  // 	console.log("Running https RestApi on port " + port);
  //  });

}