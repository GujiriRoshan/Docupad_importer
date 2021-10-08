import { LightningElement,api, track } from 'lwc';
import richtextMerge from '@salesforce/apex/richtextMerge.richtextMerge';
export default class AdvancedRichText extends LightningElement {
    @api textarea
    @api filedApi
    @api recordId;
    @api objectApiName;
    // @track Name="roshan";
    @track output;
    connectedCallback(){

        richtextMerge({
            recordId:this.recordId,
            bodyData:this.textarea
        })
        .then(async data=>{
            this.output=data;
            console.log(data)
        })
        .catch(err=>console.log(err))

      
    }
    
}