function ReceveReport(Object){

    
    
     var ReporterID=Object.X;
     if(isValidPhoneNumber(ReporterID)){
          ReporterID=Get_ROM_ID(ReporterID)
     }
     var ReportingData=Object.DT||{};
     var ReportMethod=ReportingData.M;
     
  

     if(Object.M=="REQCAL"){
          CallReqestUser(ReporterID,Object.NU);  
          return;      
     }



     if(Get_ROM_Number(ReporterID)==null){
          return;
     }

     console.log(Object);
     if(ReportMethod==null || ReporterID==null || ReporterID==""){return}
     
     
     

     if(ReportMethod=="R"){
          if(Get_ROM_Number(ReportingData.ID)==null){
               return;
          }
          AddReport(ReportingData.ID,ReporterID,ReportingData.R,ReportingData.D,"DI" in Object?1:0,Object.HD)
     }else if(ReportMethod=="F"){
          AddFeedBacked(ReporterID,ReportingData.T,ReportingData.D,"DI" in Object?1:0);
          if(ReportingData.SAT!=null || ReportingData.S!=null){
               AddUserSatisFationAboutSysterm(ReporterID,ReportingData.SAT,ReportingData.S,"DI" in Object?1:0)
          }          
     }else if(ReportMethod=="B"){
          AddUserBugs(ReporterID,ReportingData,"DI" in Object?1:0);         
     }else if(ReportMethod=="PAY"){
          PayMentReceved(ReporterID,ReportingData.N,ReportingData.A,ReportingData.U)  
     }
}






function AddReport(ReportTo,ReportFrom,Reson,discrip,isdirect,Hedder){        // this is for report
     var reportObj={
          RT:ReportTo,
          RF:ReportFrom,
          RR:Reson,
          D:discrip||'',
          TM:getCurrentdate(),
          DI:isdirect||0,
          H:Hedder
     }
     SEND("POST",Dati_url+`/USER_FEELS/REPORTS/${ReportTo}`,Dati_Secret,reportObj,function(id){
          var localReports=localStorage.getItem("LocalReportSave")||'{}';
          localReports=JSON.parse(localReports);
          localReports[id.name]=reportObj
          localStorage.setItem("LocalReportSave",JSON.stringify(localReports));
          Atant("Someone reported some user");
     });
}


function AddFeedBacked(feddBacker,type,discription,isdirect){
     var reportObj={
          ID:feddBacker,
          T:type,
          D:discription,
          TM:getCurrentdate(),
          DI:isdirect||0,
     }
     SEND("POST",Dati_url+`/USER_FEELS/FEEDBACKS`,Dati_Secret,reportObj,function(){          
          Atant("User feedback received");
     });
     
}

function AddUserSatisFationAboutSysterm(feddBacker,satisfaction,suggesting,isdirect){
     var reportObj={
          ID:feddBacker,
          SA:satisfaction,
          SU:suggesting,
          TM:getCurrentdate(),
          DI:isdirect||0,
     }
     SEND("POST",Dati_url+`/USER_FEELS/SATIS`,Dati_Secret,reportObj,function(){   
          setTimeout(function(){
               Atant("Previous user satisfaction has also been confirmed.");
          },3000); 
     });
}


function AddUserBugs(userID,data,isdirect){
     data.ID=userID;
     data.TM=getCurrentdate();
     data.DI=isdirect||0,
     delete data.M;

     SEND("POST",Dati_url+`/USER_FEELS/BUGS`,Dati_Secret,data,function(){          
          Atant("Some user reported an application error!");
     });
}




function CallReqestUser(ReporterID,number){     
     var data={
          X:ReporterID,
          N:number,
          T:getCurrentdate(),
     }

     SEND("POST",Dati_url+`/USER_FEELS/CALL`,Dati_Secret,data,function(){          
          Atant("Some one user wants to contact the agent via call");
     });
}



let localPaymentStore={}
RECE(Dati_url+`/USER_FEELS/PAYED`,Dati_Secret,function(data){          
     localPaymentStore=data;
});
function PayMentReceved(PAYERID,NOTE,AMOUNT,REF_URL){
     
     var data={
          X:PAYERID,
          N:NOTE,
          A:parseInt(AMOUNT),
          U:REF_URL,
          T:getCurrentdate(),
     }
     
     SEND("POST",Dati_url+`/USER_FEELS/PAYED`,Dati_Secret,data,function(name){ 
          const key = name.name 
          localPaymentStore[key]=data
          Atant("Please pay attention to me! A payment was made by a service provider. See it Immediately!");
     
          ChakBill(REF_URL).then(Amount => {  
               if(Amount>0){
                    CpayTopup(PAYERID,parseInt(Amount), "AI TOPUP");
                    SayAIPaidUpdate(key)
               }          
          });
     });


}

function SayAIPaidUpdate(id){
     let savedLocalData=localPaymentStore[id];
     Atant(`AI decided to the last user upload bill was true, and automatically top up ${savedLocalData["A"]} rupees by AI.Immediately check if the AI decision is correct!`);
    
     savedLocalData["O"]="AI";
     SyncLocalPayment(id)
}

function RemovePaymentReqest(id,callback){
     delete localPaymentStore[id];
     SyncLocalPayment(id,callback);
}

function SyncLocalPayment(id,callback){
     const data=localPaymentStore[id];    
     if(data){
          SEND("PUT",Dati_url+`/USER_FEELS/PAYED/${id}`,Dati_Secret,data,callback);
     }else{
          SEND("DELETE",Dati_url+`/USER_FEELS/PAYED/${id}`,Dati_Secret,'',callback);         
     }
    
}


async function ChakBill(url) {
     try {      
         const response = await fetch(url);
         
         if (!response.ok) throw new Error("Failed to fetch the image");

         // Convert image to a blob
         const blob = await response.blob();

         // Process image using Tesseract.js
         const { data } = await Tesseract.recognize(blob, 'eng');
         const text = data.text;
       
       
         try {
               const result1 = extractAmountFromSlip(text);
               return parseFloat(result1.amount||0);
          } catch (error) {
               return 0;
          }       
         
     } catch (error) {
         console.error("Error processing the bill:", error);
         return 0;
     }
 }


 function extractAmountFromSlip(ocrText) {
     console.log(ocrText);  
     // Preprocess the OCR text
     ocrText = ocrText.replace(/\s+/g, ' ').trim(); // Normalize spaces
     ocrText = ocrText.replace(/,/g, ''); // Remove commas for easier parsing
 
     // Define slip types and their respective extraction rules
     const slipTypes = [
         {
             name: 'DEPOSIT_SLIP',
             keywords: ['DEPOSIT AMOUNT', 'CARD DEPOSIT'],
             pattern: /(DEPOSIT AMOUNT|TOTAL):?\s*LKR\s*(\d+\.\d{2})/i,
         },
         {
             name: 'TRANSFER_SLIP',
             keywords: ['Transfer ID', 'Transfered Date', 'Amount'],
             pattern: /Amount\s*[^\d]*(\d+\.\d{2})/i,
         },
         {
             name: 'ATM_SLIP',
             keywords: ['ATM DEPOSIT', 'TOTAL'],
             pattern: /(TOTAL|AMOUNT):?\s*LKR\s*(\d+\.\d{2})/i,
         },
     ];
 
     // Determine the slip type based on keywords
     let slipType = null;
     for (const type of slipTypes) {
         if (type.keywords.some(keyword => ocrText.includes(keyword))) {
             slipType = type;
             break;
         }
     }
 
     if (!slipType) {
         throw new Error('Unsupported slip type.');
     }
 
     // Extract the amount using the slip type's pattern
     const match = ocrText.match(slipType.pattern);
     if (match && match[1]) {
         const amount = parseFloat(match[1]);
         if (!isNaN(amount)) {
             return { slipType: slipType.name, amount };
         }
     }
 
     // If no amount is found, throw an error
     throw new Error('No valid amount found in the OCR text.');
 }
 