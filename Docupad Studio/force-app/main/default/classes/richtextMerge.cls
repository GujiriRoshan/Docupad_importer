public with sharing class richtextMerge {
  
   @AuraEnabled(cacheable=true)
    public  static string  richtextMerge(String recordId, String bodyData) {

         String myIdPrefix =recordId.substring(0,3);
         List<Messaging.RenderEmailTemplateBodyResult> resList ;
         //    if(recordId.startsWith('005') || ('003') || '(00Q)')
         if(myIdPrefix =='005' || myIdPrefix =='003' || myIdPrefix=='00Q')
            {
              resList =Messaging.renderEmailTemplate(recordId, null, new List<String> {bodyData});
          
            }    
          else{
           resList = Messaging.renderEmailTemplate(null, recordId, new List<String> {bodyData});
          }
          return resList[0].getMergedBody();

    }

    

   
    
}
