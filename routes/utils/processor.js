/*token.js to get the decrypted data from the token */
let jwtToken = require('../token');
/*url_port_details.js file for port & other server endpoint details*/
let url_port_details = require('../url_port_details');
const { path } = require('../app');
/* To get the current date */
var year = new Date().getFullYear();
let fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
let glob = require('glob');


const GetForkinput = payLoad => {
   const PayValue = payLoad.keys;
   const dataval = payLoad.data;
   ip = dataval.clientIp;
   var clientIp = '';
   if (ip) {
      clientIp = ip.match(/\d+/g).join().replace(/,/g, '.');
   }

   var input = {
      'chap_no': PayValue.chap_no, 'bks_no': PayValue.bks_no, 'stage': PayValue.stage, 'auth_edit': PayValue.auth_edit,
      'jnls_no': PayValue.jnls_no, 'art_no': PayValue.art_no,
      'mail_id': PayValue.mail_id, 'token': dataval.tk.token, 'type': PayValue.type,
      'dbtype': dataval.tk.dbtype, 'savecontent': dataval.tk.savecontent, 'listtype': dataval.tk.listtype,
      'answer': dataval.tk.answer,
      'method': dataval.tk.method,
      'ignored_correction': dataval.tk.ignored_correction,
      'tagid': dataval.tk.tagid,
      'authorsequence': dataval.tk.authorsequence,
      'data': dataval.tk.data,
      'oldtagid': dataval.tk.oldtagid,
      'correctiondata': dataval.tk.correctiondata,
      'submitstatus': dataval.tk.submitstatus,
      'indextermtype': dataval.tk.indextermtype,
      'chapterid': dataval.tk.chapterid,
      'primaryterm': dataval.tk.primaryterm,
      'secondaryterm': dataval.tk.secondaryterm,
      'seealsoterm': dataval.tk.seealsoterm,
      'seeterm': dataval.tk.seeterm,
      'status': dataval.tk.status,
      'tertiaryterm': dataval.tk.tertiaryterm,
      'content': dataval.tk.content,
      'term': dataval.tk.term,
      'termtype': dataval.tk.termtype,

      'width': dataval.tk.width,
      'height': dataval.tk.height,
      'left': dataval.tk.left,
      'top': dataval.tk.top,
      'test': dataval.tk.test,
      'id': dataval.tk.id,
      'ImageTagId': dataval.tk.ImageTagId,
      'imgannotype': dataval.tk.imgannotype, 'clientIp': clientIp,

      'searchtype': dataval.tk.searchtype,
      'reftext': dataval.tk.reftext,
      'correctionval': dataval.tk.correctionval,
      'authorseq': dataval.tk.authorseq,
      'url': dataval.tk.url,
      'email': dataval.tk.email,
      'Forkapipath': dataval.tk.Forkapipath,
     'oldauthorsequence': dataval.tk.oldauthorsequence,
      'pdf': dataval.tk.pdf,
      'bks_page_log': dataval.tk.bks_page_log,


   }
   return input;

}





exports.preProcessSentToToken = Token => {
   /* If token is not send in the request*/
   var FkProcess = '';
   if (Token.tk.token == '' || Token.tk.token == undefined) {
      FkProcess = 'Please check with token provided';
      return FkProcess;
   }
   else {
      /*To get the payload from the token*/
      var payLoad = jwtToken.getCyper(Token.tk.token);

      if (payLoad) {
         const url = {
            'keys': payLoad, 'data': Token

         }
         if (Token.dbtype == 'bks') {
            sql_db = `${url_port_details.filePath}${url_port_details[payLoad.type]}${payLoad.stage}/${payLoad.bks_no}/Query_ImageAnno.data`;
            FkProcess = new sqlite3.Database(sql_db)

         } else if (Token.dbtype == 'chapter') {
            sql_db = `${url_port_details.filePath}${url_port_details[payLoad.type]}${payLoad.stage}/${payLoad.bks_no}/${payLoad.chap_no}/Query_ImageAnno.data`;
            FkProcess = new sqlite3.Database(sql_db)

         } else if (Token.dbtype == 'jnls') {
            sql_db = `${url_port_details.filePath}${url_port_details[payLoad.type]}${payLoad.jnls_no}/${payLoad.art_no}/Query_ImageAnno.data`;
            FkProcess = new sqlite3.Database(sql_db)
         } else {
            FkProcess = GetForkinput(url);

         }

      } else {
         FkProcess = 'Invalid Token';
      }
      return FkProcess;
   }
}


async function Get_Html_Path(g_dataFilePath) {
   return new Promise(function (resolve, reject) {
      glob(g_dataFilePath, {}, (err, files) => {
         resolve(files[0])
      })
   })
}


exports.preProcessGetDataFolder = async (payLoad) => {
   if (payLoad) {
      var type = payLoad.type;
      if (type == 'bks') {
         var jnls_bks_no = payLoad.bks_no; var art_chap_no = payLoad.chap_no;
         var data_File_Path = `${jnls_bks_no}_${art_chap_no}.html`;
         var data_pdf_Path = `${jnls_bks_no}_${art_chap_no}_AuthorFeedback`;
         var dataFilePath = `${url_port_details.filePath}${url_port_details[type]}${payLoad.stage}/${jnls_bks_no}/${art_chap_no}/${data_File_Path}`;

         var dataFolderPath = `${url_port_details.filePath}${url_port_details[type]}${payLoad.stage}/${jnls_bks_no}/${art_chap_no}/`;
         var dataFolder_book = `${url_port_details.filePath}${url_port_details[type]}${payLoad.stage}/${jnls_bks_no}/`;
      } else {
         var jnls_bks_no = payLoad.jnls_no; var art_chap_no = payLoad.art_no;
         var data_File_Path = `${jnls_bks_no}_*_${art_chap_no}_Article.html`;
         var g_dataFilePath = `${url_port_details.filePath}${url_port_details[type]}${jnls_bks_no}/${art_chap_no}/${data_File_Path}`;
         dataFilePath = await Get_Html_Path(g_dataFilePath)
         if (dataFilePath != undefined) {
            if (dataFilePath.includes("_")) {
               var get_year = dataFilePath.split('_')[2];
            }
         }
         data_File_Path = `${jnls_bks_no}_${get_year}_${art_chap_no}_Article.html`;
         data_pdf_Path = `${jnls_bks_no}_${get_year}_${art_chap_no}_AuthorFeedback`;
         var dataFolderPath = `${url_port_details.filePath}${url_port_details[type]}${jnls_bks_no}/${art_chap_no}/`;
         var dataFolder_book = `${url_port_details.filePath}${url_port_details[type]}${jnls_bks_no}/`;
      }

      return { dataFolderPath, dataFilePath, jnls_bks_no, art_chap_no, dataFolder_book, data_File_Path, data_pdf_Path, get_year };
   }

}