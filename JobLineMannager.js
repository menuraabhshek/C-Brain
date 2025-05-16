function DecordJobLineRequests(obj){
     
     var RawPasslist=["MY","GLOB","ACTIVATE"];
     var rawPass=RawPasslist.includes(obj["M"])

     CheckServiceProvider('TX',obj["X"],obj["O"],obj["PW"],function(veryfied,info){
          if(veryfied){
               var Data=obj["DT"];
               if(obj["M"]=="NEW"){
                    AddNewJobLine(obj["X"],Data,info);
               }else if(obj["M"]=="MY"){    // reqest My job List
                    Gosip.Sent(obj["X"],JobLineing.GetCretorJobs(obj["X"]),"MYJOB"); 
               }else if(obj["M"]=="GLOB"){    // reqest globel job List
                    var allJobs=JobLineing.GetGlobleJobLineWithVehicalType(obj["T"])||[];

                    const result = Object.entries(allJobs)
                         .filter(([key, value]) => value.OID != obj["X"]) // Exclude where OID is 12
                         .reduce((acc, [key, value]) => {
                              acc[key] = value; // Reconstruct the object
                              return acc;
                    }, {});

                    Gosip.Sent(obj["X"],result,"GLOBJOB"); 
               }else if(obj["M"]=="UPVISI"){   
                    UpdateJoblineVisiBility(obj["X"],obj["ID"],obj["ST"]); 
               }else if(obj["M"]=="UPSHED"){   
                    UpdateShedual(obj["X"],obj["ID"],obj["DT"]); 
               }else if(obj["M"]=="ASS_SAP"){   
                    AssinghJoblineDriverSapatately(obj["X"],obj["JID"],obj["DID"]); 
               }else if(obj["M"]=="DELMY"){   
                    DeleteMyJob(obj["X"],obj["ID"]); 
               }else if(obj["M"]=="PAY"){   
                    PayAndEndJobline(obj["X"],obj["ID"],"DI" in obj); 
               }else if(obj["M"]=="PROMIS"){   
                    if(info["AT"]!=true){
                         Gosip.Sent(obj["X"],{M:"NOAT"},"PROMIS");
                         return
                    }
                    GetQata(obj["X"],function(QutaCount) {
                         if(QutaCount>0){
                              PromisedDriver(obj["X"],obj["ID"]); 
                         }else{
                              Gosip.Sent(obj["X"],{M:"NOQT"},"PROMIS");
                         }
                    })
               }else if(obj["M"]=="ACTIVATE"){   
                    DriverActivatedJobline(obj["X"],obj["ID"]); 
               }else if(obj["M"]=="DROPED"){   
                    DriverDropedPAssanger(obj["X"],obj["ID"]); 
               }else if(obj["M"]=="DRIEND"){   
                    DriverCloseJobLine(obj["X"],obj["ID"]); 
               }

               
          }   
     },rawPass)
     
}




async function AddNewJobLine(CreatorID,jobdata,CreatorInfo){
     if(jobdata["JLD"]==CreatorID){
          Gosip.Sent(CreatorID,"OWN","POST");
          return
     }

     GetCpayPrice(CreatorID,async function(amout){
          if(JoblinePostPrice<=amout){   
               var passangerinfo=await getUserProfileInfo(jobdata["PID"],"ACC",false)
 
               if(passangerinfo){
                    var CReatedJobData=GenarateJoblineObject(CreatorInfo,passangerinfo,jobdata);
                    CpayDeTopup(CreatorID,JoblinePostPrice,"JOBLINE POST");
                    
                    if(CReatedJobData["JLD"]!=null){
                         GetQata(CReatedJobData["JLD"],async function(QutaCount) {
                              if(QutaCount>0){
                                   let Comition=GetJobLineCommition(CReatedJobData["JLP"]);
                                   CpayDeTopup(CReatedJobData["JLD"],Comition,"JOBLINE THANK",function(deTopupd){
                                        if(deTopupd==true){
                                             AssingDriverInNew(CReatedJobData["JLD"],CReatedJobData,CreatorID) 
                                        }else{
                                             Gosip.Sent(CreatorID,"DNOBAL","POST");     
                                             CReatedJobData["JLST"]="PR"; 
                                             CReatedJobData["JLD"]=null;  
                                             CReatedJobData["JLV"]=0;                            
                                             SaveAndFinalizNewJobLine(CReatedJobData)               
                                        } 
                                   });                                               
                              }else{
                                   Gosip.Sent(CreatorID,"NOQT","POST");
                                   CReatedJobData["JLST"]="PR"; 
                                   CReatedJobData["JLD"]=null;  
                                   CReatedJobData["JLV"]=0;                            
                                   SaveAndFinalizNewJobLine(CReatedJobData)
                              }
                         })                              
                    }else{
                         Gosip.Sent(CreatorID,"OK","POST")                              
                         SaveAndFinalizNewJobLine(CReatedJobData)
                    }
               }else{
                    Gosip.Sent(CreatorID,"NOPAS","POST"); 
               }   

               
          }else{
               Gosip.Sent(CreatorID,"NOBAL","POST"); 
          }    
     })
}

async function AssingDriverInNew(DriverID,CReatedJobData,CreatorID){
     if(ServiseType.get(DriverID)=="TX" ){
          var DriverData=await getUserProfileInfo(DriverID,"Service",false)

          RECE(Dati_url+`/SERVICES/Taxi/${DriverID}/INFO`,Dati_Secret,function(VehicalData){
               VehicalData=VehicalData||{}
               var DriverDitailse={};
               Object.keys(VehicalData).forEach(function(key){
                    if(key!="RATI"){
                         DriverDitailse[key]=VehicalData[key];
                    }                         
               });
               DriverDitailse["P"]=DriverData["P"];     
               CReatedJobData["DD"]=DriverDitailse;
               SaveAndFinalizNewJobLine(CReatedJobData);
               PutJoblineDataDriveCloudAcc(CReatedJobData) 
               Gosip.Sent(CreatorID,"OK","POST");
               AddJobHistory(DriverID,CReatedJobData["PN"],CReatedJobData["PID"],`You have been assigned directly to Passenger of ${CReatedJobData["PN"]}.`);               
               Gosip.Alert(DriverID,"DIRECT JOBLINE",`You assigned direct jobline. you need pick up ${CReatedJobData["PN"]} on ${CReatedJobData["DT"]} at ${CReatedJobData["TM"]}`);
               Gosip.Sent(DriverID,CReatedJobData,"DIRJOB");
          })
     }else{
          Gosip.Sent(CreatorID,"NODRI","POST");
          CReatedJobData["JLD"]=null;
          CReatedJobData["JLS"]="PR";  
          SaveAndFinalizNewJobLine(CReatedJobData); 
     }
}

function SaveAndFinalizNewJobLine(JobData){
     var PutPath;  // Main Putpart == PRI,GLO,ASS  (privert,globle,asssing)
     if(JobData["JLD"]!=null){     
          PutPath="ASS";
          JobData["JLST"]="AS";
     }else if(JobData["JLV"]==0){
          PutPath="PRI";
          JobData["JLST"]="PR";
     }else{
          PutPath="GLO";
          JobData["JLST"]="NA";
     }
     var joblineID=generateFirebaseKey();
     JobData["JLID"]=joblineID;
     JobData["PRT"]=PutPath;
     
     SEND("PUT",Dati_url+`/JOBLINE_DATA/${PutPath}/${joblineID}`,Dati_Secret,JobData);
     JobLineing.NewAdd(joblineID,JobData);
     Gosip.Sent(JobData["OID"],{M:"ADD",DT:JobData},"MYCHANG");
     JobLineing.CatagarizVehicalType(JobData);
     NotifiyDriersToNewJoblineAdded(joblineID);
     AddPointsToServis(JobData["OID"],20);
}

function GenarateJoblineObject(creatorinfo,passangerinfo,jobdata){
     var CreatingObject={
          PID:passangerinfo["X"],
          PN:passangerinfo["N"],
          PDP:passangerinfo["DP"],
          PNU:passangerinfo["P"],
          OID:creatorinfo["X"],
          ONU:creatorinfo["P"],
          PDT:getCurrentTimestamp(),                    
     }
     CreatingObject={...CreatingObject,...jobdata};
     return CreatingObject;
}


function UpdateJoblineVisiBility(OwnerID,JoblineID,Visibility){
     var JobLineData=JobLineing.Get(JoblineID);
     var JoblineState=JobLineData["JLST"];

     if(JobLineData["OID"]!=OwnerID){
          return;
     }if(JoblineState=="PR" || JoblineState=="NA"){
          if(JobLineData["JLD"]==null || JobLineData["JLD"]==""){
               JobLineing.UpdateVisiBiliti(JoblineID,Visibility);
          }else{
               Gosip.Sent(OwnerID,{M:"ER",DT:"ASS"},"MYCHANG");
          }          
     }else{
          Gosip.Sent(OwnerID,{M:"ER",DT:"ASS"},"MYCHANG");
     }
}

function UpdateShedual(OwnerID,JoblineID,shedualDate){
     var JobLineData=JobLineing.Get(JoblineID);
     JobLineData["JLS"]=shedualDate;
     LocalJobLineStore[JoblineID]=JobLineData;

     SEND("PUT",Dati_url+`/JOBLINE_DATA/${JobLineData["PRT"]}/${JoblineID}/JLS`,Dati_Secret,shedualDate);
     Gosip.Sent(OwnerID,{M:"CHN_U",DT:JobLineData},"MYCHANG");
}

function AssinghJoblineDriverSapatately(OwnerID,JoblineID,AssiningDriverID){
     var JobLineData=JobLineing.Get(JoblineID);
     var JoblineDRiver=JobLineData["JLD"];

     if(!ChackJoblineOwner(OwnerID,JoblineID)){return}

     if(ServiseType.get(AssiningDriverID)!="TX" ){
          Gosip.Sent(OwnerID,{M:"ER",DT:"NODRI"},"MYCHANG");   // tel the jobline owner to no driver found
          return
     }
     if(AssiningDriverID==JobLineData["OID"]){
          Gosip.Sent(OwnerID,{M:"ER",DT:"OWN"},"MYCHANG");
          return
     }


     if(JoblineDRiver==null || JoblineDRiver==''){         

          DriverDebitFromJoblineOwnerAssine(AssiningDriverID,JoblineID,function(){
               JobLineData["JLD"]=AssiningDriverID;
               GetDriverDitailseForSaparateAssing(JoblineID,function(JobLineData){
                    AddJobHistory(AssiningDriverID,JobLineData["PN"],JobLineData["PID"],`You have been assigned directly to Passenger of ${JobLineData["PN"]}.`);                
                    Gosip.Alert(AssiningDriverID,"DIRECT JOBLINE",`You assigned direct jobline. you need pick up ${JobLineData["PN"]} on ${JobLineData["DT"]} at ${JobLineData["TM"]}`);
                    Gosip.Sent(AssiningDriverID,JobLineData,"DIRJOB");
                    Gosip.Sent(OwnerID,{M:"CHN_U",DT:JobLineData},"MYCHANG");
                    
               });
          })



     }else{
          Gosip.Sent(OwnerID,{M:"ER",DT:"ASS"},"MYCHANG");
     }
}



async function DriverDebitFromJoblineOwnerAssine(CpayID,joblineID,callBack){
     let JobLineData=JobLineing.Get(joblineID);
     let Comition=GetJobLineCommition(JobLineData["JLP"]);
    
     GetQata(CpayID,async function(QutaCount) {
          const OwnerID=JobLineData["OID"]
          
          if(QutaCount>0){               
               CpayDeTopup(CpayID,Comition,"JOBLINE THANK",function(deTopupd){  
                     
                    if(deTopupd==true){
                         if(callBack){
                              callBack();
                         }
                    }else{
                         Gosip.Sent(OwnerID,{M:"ER",DT:"DNOBAL"},"MYCHANG");       
                         console.log("QUTA1>",OwnerID);             
                    }
               });   

          }else{
               Gosip.Sent(OwnerID,{M:"ER",DT:"DNOQT"},"MYCHANG");  // to tel no quta from driver
          }
     })



     
}




async function GetDriverDitailseForSaparateAssing(joblineID,callback){
     var JobLineData=JobLineing.Get(joblineID);
     var DriverID=JobLineData["JLD"];
     if(DriverID==null){return}

     var DriverData=await getUserProfileInfo(DriverID,"Service",false)

     RECE(Dati_url+`/SERVICES/Taxi/${DriverID}/INFO`,Dati_Secret,function(VehicalData){
          VehicalData=VehicalData||{}
          var DriverDitailse={};
          Object.keys(VehicalData).forEach(function(key){
               if(key!="RATI"){
                    DriverDitailse[key]=VehicalData[key];
               }                         
          });
          SEND("DELETE",Dati_url+`/JOBLINE_DATA/${JobLineData["PRT"]}/${joblineID}`,Dati_Secret,'');
          DriverDitailse["P"]=DriverData["P"];   

          JobLineData["DD"]=DriverDitailse;
          JobLineData["PRT"]="ASS";
          JobLineData["JLST"]="AS";
          SEND("PUT",Dati_url+`/JOBLINE_DATA/${JobLineData["PRT"]}/${joblineID}`,Dati_Secret,JobLineData);
          PutJoblineDataDriveCloudAcc(JobLineData) ;               
          
          if(callback){
               callback(JobLineData);
          }               
     })
}



function DeleteMyJob(ownerID,joblineID){
     var JobLineData=JobLineing.Get(joblineID);
     var JoblineState=JobLineData["JLST"];

     if(JoblineState=="AS" || JoblineState=="AT"){
          JobLineing.DriverRegist.Remove(joblineID);
          if(JoblineState=="AT"){
               Gosip.Sent(JobLineData["PID"],{M:"OWNER",ID:joblineID},"JOLINE_END"); 
               UserServiseUnbackup(JobLineData["PID"],joblineID);
          }  

          DeleteJoblineDataDriveCloudAcc(JobLineData["JLD"],joblineID);
          Gosip.Sent(JobLineData["JLD"],{M:"OWNER",ID:joblineID},"JOBLINEEND");
          JobLineData["JLP"]=JoblineState=="AT"?100:50;
          JobLineData["JLST"]="PP"; 
          SEND("PUT",Dati_url+`/JOBLINE_DATA/${JobLineData["PRT"]}/${joblineID}`,Dati_Secret,JobLineData);
          JobLineing.Update(joblineID,JobLineData);
          Gosip.Sent(ownerID,{M:"CHN_U",DT:JobLineData},"MYCHANG");
          
                
     }else if(JoblineState=="PP"){

     }else{
          Gosip.Sent(ownerID,{M:"DEL",DT:{JLID:joblineID}},"MYCHANG");
          RemoveJoblineFromeCloud(joblineID);
     }

}

function PayAndEndJobline(ownerID,JoblineID,DirectEnd){
     var JobLineData=JobLineing.Get(JoblineID);
     var PayingAmount=JobLineData["JLP"];

     
    
     GetCpayPrice(ownerID,function(balance){       
          var CakingBalance=DirectEnd?JobLineOwnerThankPayment:(parseInt(PayingAmount)+JobLineOwnerThankPayment)

          if(balance>=CakingBalance){
               var Recever=JobLineData["JLD"];
              
              if(!DirectEnd){
               var Remarker;
               if(PayingAmount==50){
                    Remarker="JOBLINE DELETE";
               }else if(PayingAmount==100){
                    Remarker="ACTIVED JOBLINE DELETE";
               }else{
                    Remarker="JOBLINE PAYMENT";               
               }
               CpayTracefer(ownerID,Recever,PayingAmount,Remarker);               
              }
               RemoveJoblineFromeCloud(JoblineID);
               CpayDeTopup(ownerID,JobLineOwnerThankPayment,"JOBLINE THANK");
               Gosip.Sent(ownerID,{M:"OK",ID:JoblineID},"PAY");
          }else{
               Gosip.Sent(ownerID,{M:"NOBAL"},"PAY");
          }
     })

}

function ChackJoblineOwner(ChakingOwnerID,JoblineID){
     var JobLineData=JobLineing.Get(JoblineID);
     var CurentJoblineOwner=JobLineData["OID"];
     return ChakingOwnerID==CurentJoblineOwner;
}
function ChackJoblineDriver(DriverID,JoblineID){
     var JobLineData=JobLineing.Get(JoblineID);
     if(JobLineData==null){return false}
     var CurentJoblineDriver=JobLineData["JLD"];
     return CurentJoblineDriver==DriverID;
}


function PromisedDriver(DriverID,joblineID){
     var PreviusDriverRejistedJobs=JobLineing.DriverRegist.Get(DriverID);
     if(PreviusDriverRejistedJobs.length>=1){
          Gosip.Sent(DriverID,{M:"NOMOR"},"PROMIS");
          return;
     }    
     
     var JobLineData=JobLineing.Get(joblineID);
     var Comition=GetJobLineCommition(JobLineData["JLP"]);

     CpayDeTopup(DriverID,Comition,"JOBLINE THANK",function(Return){
          if(Return==true){
               if(JobLineData["JLD"]==null || JobLineData["JLD"]==""){
                    JobLineData["JLD"]=DriverID
                    GetDriverDitailseForSaparateAssing(joblineID,function(JobLineData){
                         AddJobHistory(DriverID,JobLineData["PN"],JobLineData["PID"],`You promised ${JobLineData["PN"]} to pickup on ${JobLineData["DT"]} at ${JobLineData["TM"]}`);               
                         Gosip.Sent(DriverID,{M:"OK",DT:JobLineData},"PROMIS");
                         Gosip.Sent(JobLineData["OID"],{M:"CHN",DT:JobLineData},"MYCHANG");
                    });
               }else{
                    Gosip.Sent(DriverID,{M:"ALRD"},"PROMIS");
               }
          }else{
               Gosip.Sent(DriverID,{M:"NOBL"},"PROMIS");
          }
     })
}

function PutJoblineDataDriveCloudAcc(JobLinedata){
     var driverID=JobLinedata["JLD"];
     var joblineID=JobLinedata["JLID"];
     SEND("PUT",Dati_url+`/SERVICES/Taxi/${driverID}/JLR/${joblineID}`,Dati_Secret,JobLinedata);
     JobLineing.DriverRegist.Add(driverID,joblineID);
     JobLineing.CatagarizVehicalType(JobLinedata);
}
function DeleteJoblineDataDriveCloudAcc(driverID,JoblineID){    
     SEND("DELETE",Dati_url+`/SERVICES/Taxi/${driverID}/JLR/${JoblineID}`,Dati_Secret,'');
}


function RemoveJoblineFromeCloud(id){  //මෙකෙන් සම්පුර්න jobline ඩෙට ක්ලොඋඩ් එකේ හා ලොකල්ලි සේරම අයින් කරල දානවා 
     var JobLineData=JobLineing.Get(id);
     SEND("DELETE",Dati_url+`/JOBLINE_DATA/${JobLineData["PRT"]}/${id}`,Dati_Secret,'');
     JobLineData["PRT"]="PRI"
     JobLineing.CatagarizVehicalType(JobLineData);
     JobLineing.Remove(id);
}




////////////////////////////////////////          managing Futnions        /////////////////////////////////////

function ItarateShadiuls(){
     var CurentDate=CurentDateLikeInput();

     Object.values(LocalJobLineStore).forEach(function(JoblineData){
          var JoblineShedualDate=JoblineData["JLS"];
          if(JoblineShedualDate==CurentDate){
               var CurentVisiBility=JoblineData["JLV"];
               if(CurentVisiBility==0){                   
                    toldToChangeVisibility(JoblineData);
               }
          }

     });
}

function toldToChangeVisibility(JobLineData){
     var JoblineID=JobLineData["JLID"];

     SEND("DELETE",Dati_url+`/JOBLINE_DATA/${JobLineData["PRT"]}/${JoblineID}`,Dati_Secret,'');
     
     JobLineData["JLV"]=1;
     JobLineData["JLST"]="NA";
     JobLineData["PRT"]="GLO";    
    
     LocalJobLineStore[JoblineID]=JobLineData
     SEND("PUT",Dati_url+`/JOBLINE_DATA/${JobLineData["PRT"]}/${JoblineID}`,Dati_Secret,JobLineData);     
     JobLineing.CatagarizVehicalType(JobLineData);

     Gosip.Alert(JobLineData["OID"],"JOBLINE UPDATE",`Your ${JobLineData["PN"]}'s job is now published!`);
     
}







//////////////////////////////////////////////////          this is for Driver Jobline Acseption Funtions          /////////////////////////
function DriverActivatedJobline(DriverID,JobLineID){
     var JobLineData=JobLineing.Get(JobLineID);

     if(DriverID!=JobLineData["JLD"]){
          return;
     }
     if(!ChackJoblineDriver(DriverID,JobLineID)){return}


     SEND("PUT",Dati_url+`/JOBLINE_DATA/${JobLineData["PRT"]}/${JobLineID}/JLST`,Dati_Secret,"AT");
     JobLineData["JLST"]="AT";
     JobLineing.Update(JobLineID,JobLineData); 
     
     
     JobLineData["SER_TYPE"]="JL"  /// make this is a jobline servise type for servis cliant to know
     Gosip.Sent(JobLineData["PID"],JobLineData,"DRIV_STRAT");
     Gosip.Sent(JobLineData["OID"],{M:"CHN",DT:JobLineData},"MYCHANG");  
     UserServiseBackup(JobLineData["PID"],JobLineID,JobLineData); 
}

function DriverDropedPAssanger(DriverID,JobLineID){   


     JobLineing.DriverRegist.Remove(JobLineID);
     var JobLineData=JobLineing.Get(JobLineID);
     if(DriverID!=JobLineData["JLD"]){
          return;
     }
     if(!ChackJoblineDriver(DriverID,JobLineID)){return}

     SEND("PUT",Dati_url+`/JOBLINE_DATA/${JobLineData["PRT"]}/${JobLineID}/JLST`,Dati_Secret,"PP");
     JobLineData["JLST"]="PP";
     JobLineing.Update(JobLineID,JobLineData);

     var OwnerID=JobLineData["OID"]
     AddJobHistory(OwnerID,JobLineData["DD"]["VDN"],DriverID,`${JobLineData["DD"]["VDN"]} Dropped ${JobLineData["PN"]} successfully.`);

     Gosip.Sent(DriverID,{M:"DROPED",ID:JobLineID},"JOBLINEEND");
     Gosip.Alert(OwnerID,"CLIENT DROPPED",`${JobLineData["DD"]["VDN"]} Dropped ${JobLineData["PN"]} successfully.Now  pay to the driver.`)
     
     Gosip.Sent(JobLineData["PID"],{M:"DROP",ID:JobLineID},"JOLINE_END");
     UserServiseUnbackup(JobLineData["PID"],JobLineID);
     DeleteJoblineDataDriveCloudAcc(DriverID,JobLineID);

     Gosip.Sent(JobLineData["OID"],{M:"CHN",DT:JobLineData},"MYCHANG"); 
     
}



function DriverCloseJobLine(DriverID,JobLineID){    
     if(!ChackJoblineDriver(DriverID,JobLineID)){Gosip.Sent(DriverID,{M:"CLOSE",ID:JobLineID},"JOBLINEEND"); return}

     var JoblineData=JobLineing.Get(JobLineID);

     var TimeAhed=GetToWorkingTime(JoblineData["DT"],JoblineData["TM"])
     var AhedFee=scale(0,600,300,0,TimeAhed);
     var TotlelFee=AhedFee+200.

     const ownerId =JoblineData["OID"];
     if (Get_ROM_Number(ownerId) == null) {
          CloseFinalJoblineByDriver(DriverID,JobLineID);
          Gosip.Sent(DriverID,{M:"PAYED",ID:JobLineID},"JOBLINEEND");
     }
    
     if(AhedFee>0){          
          CpayTracefer(DriverID,ownerId,parseInt(TotlelFee),"JOBLINE CLOSE FEE",function(state){               
               if(state=="OK"){
                    CloseFinalJoblineByDriver(DriverID,JobLineID);
                    Gosip.Sent(DriverID,{M:"PAYED",ID:JobLineID},"JOBLINEEND");
               }else{
                    Gosip.Sent(DriverID,'',"JBENDNOBAL");
               }               
          });
     }else{
          Gosip.Sent(DriverID,{M:"CLOSE",ID:JobLineID},"JOBLINEEND");
          CloseFinalJoblineByDriver(DriverID,JobLineID)
     }

     
     
}

function CloseFinalJoblineByDriver(DriverID,JobLineID){
     JobLineing.DriverRegist.Remove(JobLineID);

     var JoblineData=JobLineing.Get(JobLineID);
     if(JoblineData["JLST"]=="AT"){
          Gosip.Sent(JoblineData["PID"],{M:"CLOSE",ID:JobLineID},"JOLINE_END");
          UserServiseUnbackup(JoblineData["PID"],JobLineID)
     }


     SEND("DELETE",Dati_url+`/JOBLINE_DATA/${JoblineData["PRT"]}/${JobLineID}`,Dati_Secret,'');
     JoblineData["PRT"]="GLO"
     JoblineData["DD"]=null
     JoblineData["JLD"]=null
     JoblineData["JLST"]="NA"
     JobLineing.CatagarizVehicalType(JoblineData);
     SEND("PUT",Dati_url+`/JOBLINE_DATA/${JoblineData["PRT"]}/${JobLineID}`,Dati_Secret,JoblineData);
     
     DeleteJoblineDataDriveCloudAcc(DriverID,JobLineID);
     
     Gosip.Sent(JoblineData["OID"],{M:"CHN",DT:JoblineData},"MYCHANG");
}






function NotifiyDriersToNewJoblineAdded(JobLineID){
     let JoblineData=JobLineing.Get(JobLineID);
     let driverId=JoblineData.JLD||'';
     let visibleType=JoblineData.JLV;

     if(visibleType!=1){
          return
     }


     if(driverId==""){
          let vehicalType=JoblineData.VTP;
          let joblineID=JoblineData.JLID;
          let joblinedisplayName=JoblineData.PAV==1?JoblineData.PN:JoblineData.ONE;
          let joblineDisplayDp=JoblineData.PAV==1?JoblineData.PID:JoblineData.OID;
          const StartCity=JoblineData.SLC.N;
          const endCity=JoblineData.ELC.N;

          console.log(endCity);

          SEND("POST",UNI_Url+`/JOBLINE_NOTIFI/${vehicalType}`,UNI_Secret,[JoblineData.OID,joblineID,joblineDisplayDp,joblinedisplayName,StartCity,endCity],function(name){
               const NOTIFIID=name.name;
               if(NOTIFIID){
                    setTimeout(function(){
                         SEND("DELETE",UNI_Url+`/JOBLINE_NOTIFI/${vehicalType}/${NOTIFIID}`,UNI_Secret,'');
                    },5000)
               }               
          });
     }

}









// thia is a Server Local lobLine data handerller;
var LocalJobLineStore={}
var JovlineCreatorRejistor={}
var VehicalCatagarizreRistor={}
var AssinDriverRegister={}
var JobLineing={
     Update:function(id,data){
          LocalJobLineStore[id]=data;
     },
     NewAdd:function(id,data){
          LocalJobLineStore[id]=data;
          JobLineing.CreatorRegistor.Add(data["OID"],id);
     },
     Remove:function(id){          
          JobLineing.CreatorRegistor.Remove(id);
          delete LocalJobLineStore[id];
     },
     FetchCloud:function(){
          RECE(Dati_url+`/JOBLINE_DATA`,Dati_Secret,function(JoblineData){
               Object.values(JoblineData||{}).forEach(function(values){
                    values=values||{}
                    LocalJobLineStore={...LocalJobLineStore,...values}
                    Object.values(values).forEach(function(POSTDATA){
                         POSTDATA=POSTDATA||{}
                         JobLineing.CreatorRegistor.Add(POSTDATA["OID"],POSTDATA["JLID"]);
                         JobLineing.CatagarizVehicalType(POSTDATA);

                         var driverID=POSTDATA["JLD"]
                         if(driverID!=null && driverID!="" && POSTDATA["JLST"]!="PP"){
                              JobLineing.DriverRegist.Add(driverID,POSTDATA["JLID"])
                         }
                    });
               });
               console.log(`Succsessfully Cloud Fetched ${Object.keys(LocalJobLineStore).length} jobline Posts`)
               ItarateShadiuls();
          })
     },
     CatagarizVehicalType:function(data){
          var VehicalType=data["VTP"];
          var JoblineID=data["JLID"];
          var Parth=data["PRT"];

         

          var GobleVehicales=VehicalCatagarizreRistor[VehicalType]||{}

          if(Parth=="GLO"){
               GobleVehicales[JoblineID]=data;               
          }else{
               delete GobleVehicales[JoblineID]
          }
          VehicalCatagarizreRistor[VehicalType]=GobleVehicales;
     },
     CreatorRegistor:{
          Add:function(CreatorID,JoblineID){
               var PrevRest=JovlineCreatorRejistor[CreatorID]||[];
               PrevRest.push(JoblineID);
               JovlineCreatorRejistor[CreatorID]=PrevRest;
          },
          Remove:function(JoblineID){
               var JobLineData=JobLineing.Get(JoblineID);
               var CreatorID=JobLineData["OID"];

               let items =JovlineCreatorRejistor[CreatorID]||[];               
               items = items.filter(item => item !== JoblineID);
               JovlineCreatorRejistor[CreatorID]=items;
          },
          Get:function(CreatorID){
               return JovlineCreatorRejistor[CreatorID]||[]; 
          }
     },
     GetCretorJobs:function(CreatorID){
          var creatorJobIDS=JobLineing.CreatorRegistor.Get(CreatorID)||[];
          var CretorJOBS={}
          creatorJobIDS.forEach(function(JoblineID){
               CretorJOBS[JoblineID]=LocalJobLineStore[JoblineID]
          });
          return CretorJOBS;
     },
     Get:function(joblineID){
          return LocalJobLineStore[joblineID]||{}
     },
     GetGlobleJobLineWithVehicalType:function(vehicalType){
          return VehicalCatagarizreRistor[vehicalType]||{}
     },
     UpdateVisiBiliti:function(JoblineID,Visibility){
          var PutPath;  
          var JobLineData=JobLineing.Get(JoblineID);
          if(JobLineData["PRT"]!="ASS"){
               SEND("DELETE",Dati_url+`/JOBLINE_DATA/${JobLineData["PRT"]}/${JoblineID}`,Dati_Secret,'');
          }
          JobLineData["JLV"]=Visibility;

          var PutPath;  // Main Putpart == PRI,GLO,ASS  (privert,globle,asssing)
          if(JobLineData["JLV"]==0){
               PutPath="PRI";
               JobLineData["JLST"]="PR";
          }else{
               PutPath="GLO";
               JobLineData["JLST"]="NA";
          }
          JobLineData["PRT"]=PutPath;
         
          LocalJobLineStore[JoblineID]=JobLineData
          SEND("PUT",Dati_url+`/JOBLINE_DATA/${PutPath}/${JoblineID}`,Dati_Secret,JobLineData);
          Gosip.Sent(JobLineData["OID"],{M:"CHN_U",DT:JobLineData},"MYCHANG");
          JobLineing.CatagarizVehicalType(JobLineData);
          NotifiyDriersToNewJoblineAdded(JoblineID)
     },
     DriverRegist:{
          Add:function(DriverID,JoblineID){
               var PrevRest=AssinDriverRegister[DriverID]||[];
               PrevRest.push(JoblineID);
               AssinDriverRegister[DriverID]=PrevRest;
          },
          Remove:function(JoblineID){
               var JobLineData=JobLineing.Get(JoblineID);
               var CreatorID=JobLineData["JLD"];

               let items =AssinDriverRegister[CreatorID]||[];               
               items = items.filter(item => item !== JoblineID);
               AssinDriverRegister[CreatorID]=items;
          },
          Get:function(DriverID){
               return AssinDriverRegister[DriverID]||[]; 
          }
     }
     
}
