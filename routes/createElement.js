const axios = require('axios').default;
/*url_port_details.js file for port & other server endpoint details*/
var url_port_details = require('./url_port_details');
var baseURL = `${url_port_details.refPDFRecal}`; 
module.exports = {
    FileCorrectionDetails: (data,Crt_info) => {
        var response = {};
        return new Promise((r) => {
            var vCrt_info=0;
            if(Crt_info){
                vCrt_info = Crt_info.length;
            }
                var html = ` <div class="f_content_container">
                                            <div class="f_title_holder">
                                                <p class="f_title"><strong>File Correction Details</strong></p>
                                            </div>
                                            <div class="f_content">
                                                <p>${(Crt_info == "") ? "No correction" : `Correction is made. No of Corrections: ${vCrt_info}`} </p>
                                                <p><strong>Online Correction Link: </strong><span style="color: red;font-weight: bold;">${url_port_details['Interfacelink_'+data.type]}${data.token}</span></p>
                                            </div>
                                        </div>`;
                r(html);
            });
    },
    ImageAnnotationDetails: (Imag_info) => {
        return new Promise((r) => {
                var tbody = "";
                if(Imag_info){
                Imag_info.forEach((e) => {
                    if (e.ImageTagId && e.test) {
                        tbody += ` <tr>
                        <td style="padding:10px;">${e.ImageTagId}</td>
                        <td style="padding:10px;">${e.test}</td>
                    </tr>`
                    }
                });
            }
                var html = `<div class="f_content_container">
                <div class="f_title_holder">
                    <p class="f_title"><strong>Image Annotation Details</strong></p>
                </div>
                <div class="f_content">
                ${(Imag_info == "") ? "<p>No Details Found</p>" : `<table id="f_table">
                <thead>
                    <tr>
                        <th style="padding:10px;"><strong>Annotated Image ID</strong></th>
                        <th style="padding:10px;"><strong>Annotated Data</strong></th>
                    </tr>
                </thead>
                <tbody>
                ${tbody}
                </tbody>
            </table>`} 
                </div>
            </div>`;

                r(html);
            });
    },
    AttachedFileDetails: (data) => {
        return new Promise((r) => {
            var response = {};
            axios.get(baseURL + "/upload", { params: { token: data.token, authorsequence: data.authorseq, dbtype: data.type, method: "get",'Forkapipath': 'forkupload','pdf':'yes' } }).then((res) => {
                response = res;
            }).catch(() => {
                response.data = [];
            }).finally(() => {
                var li = "";
                if(response.data.length > 0){
                    response.data.forEach(e => {
                        e.file.forEach(ele => {
                            li += `<li>${ele}</li>`;
                        });
                    });
                }              

                var html = `<div class="f_content_container">
                    <div class="f_title_holder">
                        <p class="f_title"><strong>Attached File Details</strong></p>
                    </div>

                    <div class="f_content">
                        ${(li == "") ? "<p>No Details Found</p>" : ` <ol>
                            ${li}
                        </ol>`}
                    </div>
                </div>`;
                r(html);
            });
        });
    },
    QueryDetails: (Aq_info) => {
        return new Promise((r) => {
                var li = "";
                if (Aq_info.length > 0) {
                    Aq_info.forEach(e => {
                        li += ` <li>
                    <span><strong>${e.query}</strong></span>
                    <div id="ans">
                        <p>
                            ${e.answer}
                        </p>
                    </div>
                </li>`
                    });
                }
                var html = `   <div class="f_content_container">
                <div class="f_title_holder">
                    <p class="f_title"><strong>Query Details</strong></p>
                </div>
                <div class="f_content">
                ${(Aq_info == "") ? "<p>No Details Found</p>" : `<ol>
                ${li}
                </ol>`}
                </div>
            </div>`;
                r(html);
            });
    }
}