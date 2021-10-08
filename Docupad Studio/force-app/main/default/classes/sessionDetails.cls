public with sharing class sessionDetails {
    public sessionDetails() {

    }

    @AuraEnabled(cacheable=true)
    public static string sessionSync(){
        //String sessionId=UserInfo.getOrganizationId() + ''+UserInfo.getSessionId().SubString(15);
        String sessionId = '';
        // Refer to the Page
        PageReference sessionIdPage = Page.SessionId;
        // Get the content of the VF page
        String vfContent = sessionIdPage.getContent().toString();
        // Find the position of Start and End
        Integer startPosition = vfContent.indexOf('Start') + 'Start'.length(),
            endPosition = vfContent.indexOf('End');
        // Get the Session Id
        sessionId = vfContent.substring(startPosition, endPosition);
        System.debug('sessionId '+sessionId);
        // Return Session Id
        return sessionId;
  
    }
    @AuraEnabled(cacheable=true)
    public static string getBaseUrl(){
      String BaseUrl=  System.URL.getSalesforceBaseUrl().toExternalForm();
       // String BaseUrl =URL.getSalesforceBaseUrl().toString();
        System.debug(BaseUrl);
        return BaseUrl;

    }
}