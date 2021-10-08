import { LightningElement, track,wire } from 'lwc';
import getTemplates from '@salesforce/apex/TemplatesController.getTemplateDetails';
import sessionId from '@salesforce/apex/sessionDetails.sessionSync';
import BaseUrl from '@salesforce/apex/sessionDetails.getBaseUrl'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
export default class GenerateDocument extends LightningElement {
    @track selectedFile = null;
    @track templateName = null;
    @track isAuthenticated = false;
    @track downloadFile = null;
    @track data = {};
    @track error;
    @track urlData = "";
    @track templateIdArray=[]
    @track isLoading = false;
    @track jsonError = null;
    @track templateId = ""
    @track obj;
    @track teaxtareavalue;
    @track dataValue;
    @track hasRender = true;
    @track isTemplateIdSelected = false;
    @track isSelectTemplate = false;
    @track serverurl;
    @track sessionid;
    @track placeholder = JSON.stringify({
        "data": JSON.parse('{"companyName":"ceptes Software","data":"20july2021", "EmpName":"manas ranjan","position":"Software Developer" }')
    }, null, 4);


    wireResult
    @wire(getTemplates)
    wiredAccounts(result) {
        this.wireResult = result;
        if (result.data) {
            this.templateIdArray = result.data;
           // console.log("template value is",this.template.querySelector('[data-id="select-01"]').value)
            // this.template.querySelector('[data-id="select-01"]').key=this.templateId
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.templateIdArray = undefined;
        }
    }
    
    connectedCallback(){
        sessionId()
        .then(res=>{
           this.sessionid = res;
        });
        BaseUrl()
        .then(url=>{
            this.serverurl = url;
        })
    }
 
    renderedCallback() {
        this.obj = {
            "templateId": this.templateId,
            "Watermark":"",
            "DocumentOpenPassword":"",
            "data": this.dataValue || JSON.parse('{"key":"value"}')
        };
        this.teaxtareavalue = JSON.stringify(this.obj, null, 4)
        this.template.querySelector('[data-id="select-01"]').value=this.templateId;
       
    }

    redirctHome(event) {
        event.preventDefault();
        this.isLoading = true
        return fetch('https://lwc-backend-carbone.herokuapp.com', {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then((response) => {
                console.log("inside the response")
                return response.json()
                    .then((result) => {
                        this.isLoading = false
                        this.isAuthenticated = false;
                        this.istemplateshows = false;
                        this.isrenderFileshows = false
                        console.log(result)
                    })
            })

    }

    onChangeHandler(event) {
        this.selectedFile = event.target.files[0]
    }

  

    addTemplate(event) {
        this.isLoading = true
        this.isTemplateIdSelected = false
        event.preventDefault();
        event.stopPropagation();
        if (this.templateId == "") {
            const data = new FormData();
            data.append('template', this.selectedFile);
            if (this.selectedFile === null) {
                this.isLoading = false
                const evt = new ShowToastEvent({
                    title: "Error",
                    message: "Please upload the file",
                    variant: "error",
                });
                this.dispatchEvent(evt);
                // this.error = "please upload the file"
            }
            else {
                return fetch('https://lwc-backend-carbone.herokuapp.com/template', {
                    headers: {
                        serverurl:this.serverurl,
                         sessionid:this.sessionid
                        //'Content-Type': 'application/json'
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                      },
                    method: 'POST',
                    body: data
                })
                    .then((response) => {
                        return response.json()
                            .then((result) => {
                                console.log(result)
                                if (result.error) {
                                    this.isLoading = false
                                    const evt = new ShowToastEvent({
                                        title: "Eroor",
                                        message: result.error,
                                        variant: "error",
                                    });
                                    this.dispatchEvent(evt);
                                    this.template.querySelector('[data-id="file-upload-input-01"]').value = "";
                                }
                                else {
                                    console.log(result.outputFileName)
                                    const evt = new ShowToastEvent({
                                        title: "Success",
                                        message: "File uploaded SuccessFully",
                                        variant: "success",
                                    });
                                   
                                    this.template.querySelector('[data-id="file-upload-input-01"]').value = ""
                                    this.dispatchEvent(evt);
                                    this.isLoading = false;
                                    this.templateName = `${result.outputFileName}`;
                                    this.downloadFile = `${result.originalFileName}`;
                                    this.templateId = result.templateId;
                                    this.isAuthenticated = true;
                                    console.log(this.templateName)
                               
                                    return refreshApex(this.wireResult);
                                    
                                 
                                  
                                }
                            })
                            .catch((err) => console.log("errror", err))
                    })
            }
        }
        else {
            const data = new FormData();
            data.append('template', this.selectedFile);
            data.append('templateId', this.templateId);
            if (this.selectedFile === null) {
                this.isLoading = false
                const evt = new ShowToastEvent({
                    title: "Error",
                    message: "Please upload the file",
                    variant: "error",
                });
                this.dispatchEvent(evt);
            }
            else {
                return fetch('https://lwc-backend-carbone.herokuapp.com/template', {
                    headers: {
                        serverurl:this.serverurl,
                         sessionid:this.sessionid
                      },

                    method: 'PUT',
                    body: data
                })
                    .then((response) => {
                        return response.json()
                            .then((result) => {
                                console.log(result)
                                const evt = new ShowToastEvent({
                                    title: "Success",
                                    message: "File uploaded SuccessFully",
                                    variant: "success",
                                });
                                this.dispatchEvent(evt);
                                this.template.querySelector('[data-id="file-upload-input-01"]').value = ""
                                this.isLoading = false
                                this.templateName = `${result.outputFileName}`;
                                this.downloadFile = `${result.originalFileName}`
                                this.isTemplateIdSelected = true
                                this.templateId = result.templateId
                                this.isAuthenticated = true;
                                this.hasRender = true
                                console.log(this.templateName)
                            })
                            .catch((err) => console.log("errror", err))
                    })
            }
        }

    }

    onchangeGetUrl(event) {
        this.urlData = event.target.value
    }
    GetUrlData(event) {
        console.log(this.urlData.length)
        if (this.urlData.length == 0) {
            this.isLoading = false;
            const evt = new ShowToastEvent({
                title: "Error",
                message: "Enter the Rest Endpoint",
                variant: "error",
            });
            this.dispatchEvent(evt);
        }
        else {
            this.isLoading = true
            fetch(`https://lwc-backend-carbone.herokuapp.com/UrlData?endPoint=${this.urlData}`, {
                headers: {
                    serverurl:this.serverurl,
                     sessionid:this.sessionid
                  },
                method: "GET",
            })
                .then((response) => {
                    return response.json()
                        .then(result => {
                            const evt = new ShowToastEvent({
                                title: "Success",
                                message: "Data fetched Successfully",
                                variant: "success",
                            });
                            this.dispatchEvent(evt);

                            this.dataValue = result.data
                            this.obj = {
                                "templateId": this.templateId,
                                "Watermark":"",
                                "DocumentOpenPassword":"",
                                "data": result.data
                            };
                            this.teaxtareavalue = JSON.stringify(this.obj, null, 4);
                            this.template.querySelector('[data-id="textarea-id-02"]').value = this.teaxtareavalue;
                            //  /services/data/v51.0/sobjects/Account/0014x00000Do1PpAAJ
                            this.isLoading = false;
                        })
                        .catch(err => {
                            console.log("inside error", err)
                            const evt = new ShowToastEvent({
                                title: "Error",
                                message: err,
                                variant: "error",
                            });
                            this.dispatchEvent(evt);
                            this.isLoading = false;
                        })
                })
                .catch(err => {
                    const evt = new ShowToastEvent({
                        title: "Error",
                        message: err,
                        variant: "error",
                    });
                    this.dispatchEvent(evt);
                    this.isLoading = false;
                })
        }

    }

    onchangeData(event) {
        // this.data = event.target.value 
        this.data = JSON.stringify(event.target.value, "\t", 2)
    }
    generateDocument(e) {
        this.isLoading = true
        var payload = this.template.querySelector('[data-id="textarea-id-02"]').value
        var docData = payload

        return fetch('https://lwc-backend-carbone.herokuapp.com/generateDocumentPreview', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                serverurl:this.serverurl,
                sessionid:this.sessionid
            },
            method: "POST",
            body: docData
        })
            .then((response) => {
                return response.json()
                    .then((result) => {
                        this.isLoading = false
                        this.isAuthenticated = true
                        this.templateName = `${result.fileName}`
                        this.downloadFile = result.originalFileName
                    })
                    .catch(err => console.log(err))
            })
            .catch(err => console.log(err))
    }

    selectTemplateId(event) {
        this.isLoading = true;
        this.template.querySelector('[data-id="file-upload-input-01"]').value = "";
        const field = event.target.name;
        //  var payload = this.template.querySelector('[data-id="textarea-id-02"]').value
        if (field === 'optionSelect' && event.target.value != "") {
            const templateID = {
                templateId: event.target.value
            }
           

            fetch('https://lwc-backend-carbone.herokuapp.com/generateDocument', {
                method: "POST",

                headers: {

                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                      serverurl:this.serverurl,
                      sessionid:this.sessionid
                },
                body: JSON.stringify(templateID)
            })
                .then((response) => {
                    return response.json()
                        .then((result) => {
                            console.log(result)
                            this.templateName = result.fileName;
                            this.downloadFile = result.originalFileName;

                            this.obj = {
                                "templateId": templateID.templateId,
                                "Watermark":"",
                                "DocumentOpenPassword":"",
                                "data": JSON.parse('{"key":"value"}')
                            };
                            this.teaxtareavalue = JSON.stringify(this.obj, null, 4);
                            this.template.querySelector('[data-id="textarea-id-02"]').value = this.teaxtareavalue;
                            this.templateId = templateID.templateId;
                            this.isAuthenticated = true;
                            this.isTemplateIdSelected = true;
                            this.isLoading = false;
                        })
                })
        }
        else {
            this.isLoading = false;
            this.templateId = "",
                this.obj = {
                    "templateId": "",
                    "Watermark":"",
                    "DocumentOpenPassword":"",
                    "data": JSON.parse('{"key":"value"}')
                };
            this.teaxtareavalue = JSON.stringify(this.obj, null, 4);
            this.template.querySelector('[data-id="textarea-id-02"]').value = this.teaxtareavalue;
            this.isAuthenticated = false;
            this.templateName = null;
            this.isTemplateIdSelected = false;
        }
    }
    formatJSON() {
        try {
            this.jsonError = null;
            var ugly = this.template.querySelector('[data-id="textarea-id-02"]').value
            var obj = JSON.parse(ugly);
            var pretty = JSON.stringify(obj, undefined, 4);
            this.template.querySelector('[data-id="textarea-id-02"]').value = pretty
        }
        catch (err) {
            this.jsonError = err
        }
    }

    // downloadDocument(event) {
    //     window.open(this.downloadFile, '_blank');
    // }


    // showSuccessNotification() {
    //     const evt = new ShowToastEvent({
    //         title: "Success",
    //         message: "This is sample success message",
    //         variant: "error",
    //     });
    //     this.dispatchEvent(evt);
    // }
}