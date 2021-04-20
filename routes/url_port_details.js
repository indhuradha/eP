
/*START#############################################
#
#  Purpose  : url,port details of other server which is configured in Eproofing 
#
#  Author   : Inshumathi R
#
#  Client   : SPS
#
#  Date     : April 13, 2020
#
*/

/*To get the value of environment*/
let ecoconfig = require('./../ecosystem.config.js');

var node_env, filePath, port ,imagePath,imageServerPath, forkPath, footerPath,bks,jnls,refPDFRecal,Developer_email,Admin_email,Interfacelink_jnls,Interfacelink_bks= " "


if (process.env.node_env == 'development') {
    node_env = process.env.node_env;
    filePath = ecoconfig.apps[0].env_development.filePath;
    port = ecoconfig.apps[0].env_development.port;
    imagePath = ecoconfig.apps[0].env_development.imagePath;
    forkPath = ecoconfig.apps[0].env_development.forkPath;
    footerPath = ecoconfig.apps[0].env_development.footerPath;
    imageServerPath = ecoconfig.apps[0].env_development.imageServerPath;
    bks = ecoconfig.apps[0].env_development.bks;
    jnls = ecoconfig.apps[0].env_development.jnls;
    refPDFRecal = ecoconfig.apps[0].env_development.refPDFRecal;
    Developer_email = ecoconfig.apps[0].env_development.Developer_email;
    Admin_email = ecoconfig.apps[0].env_development.Admin_email;
    Interfacelink_jnls = ecoconfig.apps[0].env_development.Interfacelink_jnls;
    Interfacelink_bks = ecoconfig.apps[0].env_development.Interfacelink_bks;
}
else {
    node_env = process.env.node_env;
    filePath = ecoconfig.apps[0].env_production.filePath;
    port = ecoconfig.apps[0].env_production.port;
    imagePath = ecoconfig.apps[0].env_production.imagePath;
    forkPath = ecoconfig.apps[0].env_production.forkPath;
    footerPath = ecoconfig.apps[0].env_production.footerPath;
    imageServerPath = ecoconfig.apps[0].env_development.imageServerPath;
    bks = ecoconfig.apps[0].env_production.bks;
    jnls = ecoconfig.apps[0].env_production.jnls;
    refPDFRecal = ecoconfig.apps[0].env_production.refPDFRecal;
    Developer_email = ecoconfig.apps[0].env_production.Developer_email;
    Admin_email = ecoconfig.apps[0].env_production.Admin_email;
    Interfacelink_jnls = ecoconfig.apps[0].env_production.Interfacelink_jnls;
    Interfacelink_bks = ecoconfig.apps[0].env_production.Interfacelink_bks;
}


module.exports = {
    filePath, port,imagePath,imageServerPath,forkPath,footerPath,bks,jnls,refPDFRecal,Developer_email,Admin_email,Interfacelink_jnls,Interfacelink_bks
}