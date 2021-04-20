
/*START#############################################
#
#  Purpose  : Process file which will set the mode to development or environment
#
#  Author   : Indhumathi R
#
#  Client   : SPS
#
#  Date     : 13 April 2020
#
*/


module.exports = {
    apps: [
        {
            name: "eproofing-api--current",
            script: "./server.js",
            watch: true,
            exec_mode: "fork",
            env_development: {
                "port": "3005",
	        	"node_env": "development",
                "filePath": "/u01/ep/data/",
                "forkPath": "/u01/ep/ep-api/routes/forkapis/",
                "imagePath": "images",
                "footerPath": "/u01/ep/ep-api/routes/",
                "imageServerPath":"http://eproofing-dev.springernature.com",
				"refPDFRecal" : "http://eproofing-dev.springernature.com:3005/eP-api",
                "bks":"ep_bks/",
                "jnls":"ep_jnls/",
                "Developer_email":"indhumathi.r@sps.co.in",
                "Admin_email":"jgayathri@sps.co.in",
                "Interfacelink_jnls":"http://eproofing-dev.springernature.com:3003/ePj/journals/",
                "Interfacelink_bks":"http://eproofing-dev.springernature.com:3003/ePb/books/",
            },
            env_production: {
                "port": "3005",
		        "node_env": "production",
                "filePath": "/u01/ep/data/",
                "forkPath": "/u01/ep/ep-api/routes/forkapis/",
                "footerPath": "/u01/ep/ep-api/routes/",
                "imagePath": "images",
                "imageServerPath":"http://eproofing-dev.springernature.com",
				"refPDFRecal" : "http://eproofing-dev.springernature.com:3005/eP-api",
                "bks":"ep_bks/",
                "jnls":"ep_jnls/",
                "Developer_email":"indhumathi.r@sps.co.in",
                "Admin_email":"jgayathri@sps.co.in",
                "Interfacelink_jnls":"http://eproofing-dev.springernature.com:3003/ePj/journals/",
                "Interfacelink_bks":"http://eproofing-dev.springernature.com:3003/ePb/books/",
            }
        }
    ]
}
