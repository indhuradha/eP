
/*START#############################################
#
#  Purpose  :Fork method js for ForkVendor.
#
#  Author   : Indhumathi R
#
#  Client   : E-authoring
#
#  Date     : April 21, 2020
#
######################################################################END*/
/*url_port_details.js file for port & other server endpoint details*/
let url_port_details = require('../url_port_details');
/* npm glob,path methods for services */
let fs = require('fs');
var moment = require('moment');
const { response } = require('../app');
var sqlite3 = require('sqlite3').verbose();

async function ArticleInfo(db, sql) {
    return new Promise(function (resolve, reject) {
        db.all(sql, (err, val) => {
            resolve(val);
        })
    })
}
async function GetVendorName(vloop, getvname, vname_Array, db, input) {
    return new Promise(function (resolve, reject) {

        (async () => {
            if (input.type == 'bks') {
                let sqlgetsummarylist = `${"SELECT "}
    
            e1.vendorname,
            (CASE WHEN e1.booktype='0' THEN 'S300' WHEN e1.booktype='1' THEN 'S650' END) as booktype,
            count(sent) AS sent,
            epr.eproof,
            nonepr.noneproof 
    
            FROM 
    
            oxe_list as e1 
    
            LEFT OUTER JOIN  (SELECT e2.vendorname,booktype,COUNT(e2.received) as eproof
            FROM oxe_list e2 WHERE  
            datetime(sent, 'unixepoch')>='${input.fromdate}' AND datetime(sent, 'unixepoch')<='${input.todate}' AND sent<>'' AND received<>'' 
            group by e2.vendorname,e2.booktype ) epr ON epr.vendorname=e1.vendorname and epr.booktype=e1.booktype
    
            LEFT OUTER JOIN  (SELECT e3.vendorname,booktype,COUNT(e3.received) as noneproof
            FROM oxe_list e3 WHERE  
            datetime(sent, 'unixepoch')>='${input.fromdate}' AND datetime(sent, 'unixepoch')<='${input.todate}' AND sent<>'' AND received=''  
            group by e3.vendorname,e3.booktype ) nonepr ON nonepr.vendorname=e1.vendorname and nonepr.booktype=e1.booktype
    
    
            WHERE 
    
            
            e1.vendorname='${getvname[vloop].vendorname}'
            group by
            e1.vendorname,e1.booktype  
            `;
                var f_v_opt = await ArticleInfo(db, sqlgetsummarylist);
                vname_Array.push(f_v_opt)
                vloop++;

                if (vloop < getvname.length) {
                    GetVendorName(vloop, getvname, vname_Array, db, input)

                }
                if (vloop == getvname.length) {
                    sqlgetoxelist = `${'SELECT bookid,chapterid,booktype,sent,received,vendorname FROM oxe_list WHERE '} sent >= '${input.fromdate}' AND sent <= '${input.todate}'`;

                    await responseList(vname_Array, sqlgetoxelist, db)
                }
            } else {
                sqlgetoxelist = `${'SELECT jrnl,artno,datetime(sent, "unixepoch") AS sent,received,vendorname FROM oxe_list WHERE  datetime(sent,"unixepoch") >= '}'${input.fromdate}' AND datetime(sent,"unixepoch") <= '${input.todate}'`;
                sqlgetsummarylist = `${'SELECT vendorname, count(sent) AS sent,(SELECT COUNT(e2.received) FROM oxe_list e2 WHERE e2.vendorname = e1.vendorname AND datetime(sent, "unixepoc")>='}'${input.fromdate}' AND 
                datetime(sent, 'unixepoch')<= '${input.fromdate}' AND sent<>'' AND received<>'' 
                group by vendorname)eproof,(SELECT COUNT(e3.received)
                FROM 
                oxe_list e3 WHERE e3.vendorname = e1.vendorname and 
                datetime(sent, 'unixepoch')>='${input.fromdate}' AND datetime(sent, 'unixepoch')<= '${input.todate}' AND sent<>'' AND received='' 
                group by vendorname ) noneproof
               FROM 
               oxe_list as e1 WHERE datetime(sent, 'unixepoch')>='${input.fromdate}' AND datetime(sent, 'unixepoch')<= '${input.todate}' group by vendorname`;
                var f_v_opt = await ArticleInfo(db, sqlgetsummarylist);
                vname_Array.push(f_v_opt)

                await responseList(vname_Array, sqlgetoxelist, db)

            }
        })();

    })
}

async function responseList(vname_Array, sqlgetoxelist, db) {
    return new Promise(function (resolve, reject) {
        (async () => {
            let vendor_opt = await ArticleInfo(db, sqlgetoxelist);
            var v_list_opt = {
                'Oxelist': vendor_opt,
                'summarylist': vname_Array
            }
            db.close();
            process.send({ counter: { status: 200, msg: v_list_opt } });
            process.exit();
        })();
    })
}



async function ForkGetVendorList(payLoad) {
    try {
        var input = payLoad.data;
        if (input.type == 'bks') {
            sql_db = `${url_port_details.filePath}${url_port_details[input.type]}oxe_list_mpr.data`;
            var db = new sqlite3.Database(sql_db)
        } else {
            sql_db = `${url_port_details.filePath}${url_port_details[input.type]}OXE_List.data`;
            var db = new sqlite3.Database(sql_db)
        }
        if (input.method == 'get') {
                var sql = `SELECT DISTINCT vendorname FROM oxe_list`;
            let vendor_opt = await ArticleInfo(db, sql);
            process.send({ counter: { status: 200, msg: vendor_opt } });
            process.exit();

        } else {
            var vname_Array = []

            if ((input.fromdate != "" && input.todate != "") || input.vname != "") {
                if (input.fromdate != "" && input.todate != "" && input.vname != "") {
                    if (input.type == 'bks') {
                        sqlgetoxelist = `${'SELECT bookid,chapterid,booktype,sent,received,vendorname FROM oxe_list WHERE vendorname = '}'${input.vname}' AND sent >= '${input.fromdate}' AND sent <= '${input.todate}'`;
                    }
                    else {
                        sqlgetoxelist = `${'SELECT jrnl,artno,datetime(sent, "unixepoch") AS sent,received,vendorname FROM oxe_list WHERE vendorname = '}'${input.vname}' AND datetime(sent,'unixepoch') >= '${input.fromdate}' AND datetime(sent,'unixepoch') <= '${input.todate}'`;
                    }

                }
                if (input.fromdate == "" && input.todate == "" && input.vname != "") {
                    if (input.type == 'bks') {
                        sqlgetoxelist = `${'SELECT bookid,chapterid,booktype,sent,received,vendorname FROM oxe_list WHERE vendorname = '}'${input.vname}'`;
                    } else {

                        sqlgetoxelist = `${'SELECT jrnl,artno,datetime(sent, "unixepoch") AS sent,received,vendorname FROM oxe_list WHERE vendorname = '}'${input.vname}'`;
                    }
                }
                if (input.fromdate != "" && input.todate != "" && input.vname == "") {
                    if (input.type == 'bks') {

                        sqlgetsummary_vendor = "SELECT DISTINCT vendorname from oxe_list";
                        var getvname = await ArticleInfo(db, sqlgetsummary_vendor);
                        await GetVendorName(0, getvname, vname_Array, db, input);
                    } else {

                        await GetVendorName(0, '', vname_Array, db, input);



                    }
                } else {
                    if (input.type == 'bks') {
                        let sqlgetsummarylist = `${"SELECT "}

	e1.vendorname,
	(CASE WHEN e1.booktype='0' THEN 'S300' WHEN e1.booktype='1' THEN 'S650' END) as booktype,
	count(sent) AS sent,
	epr.eproof,
	nonepr.noneproof 

FROM 

	oxe_list as e1 

	LEFT OUTER JOIN  (SELECT e2.vendorname,booktype,COUNT(e2.received) as eproof
	FROM oxe_list e2 WHERE  
	datetime(sent, 'unixepoch')>='${input.fromdate}' AND datetime(sent, 'unixepoch')<='${input.todate}' AND sent<>'' AND received<>'' 
	group by e2.vendorname,e2.booktype ) epr ON epr.vendorname=e1.vendorname and epr.booktype=e1.booktype

	LEFT OUTER JOIN  (SELECT e3.vendorname,booktype,COUNT(e3.received) as noneproof
	FROM oxe_list e3 WHERE  
	datetime(sent, 'unixepoch')>='${input.fromdate}' AND datetime(sent, 'unixepoch')<='${input.todate}' AND sent<>'' AND received=''  
	group by e3.vendorname,e3.booktype ) nonepr ON nonepr.vendorname=e1.vendorname and nonepr.booktype=e1.booktype


WHERE 

e1.vendorname='${input.vname}'
group by
e1.vendorname,e1.booktype
`;
                        var f_v_opt = await ArticleInfo(db, sqlgetsummarylist);
                        vname_Array.push(f_v_opt)
                    }


                }
            }

            await responseList(vname_Array, sqlgetoxelist, db)
        }



    } catch (e) {

        process.send({ counter: { status: 400, msg: e.toString() } });
        process.exit();
    }
}

// receive message from master process
process.on('message', async (message) => {
    await ForkGetVendorList(message)
});

