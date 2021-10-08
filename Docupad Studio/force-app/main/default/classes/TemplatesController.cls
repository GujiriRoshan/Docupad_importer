public with sharing class TemplatesController {
    @AuraEnabled(cacheable=true)
   public static List<Template__c>getTemplateDetails(){
    List<Template__c> templateDetails = [
        SELECT Id,templateId__c, Name,LatestVersionId__c, Title__c FROM Template__c
    ];
return templateDetails;
   }
}