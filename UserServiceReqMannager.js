function UserServiceReqProseing(obj){    
     var rawUSeVeryfi=["FI_HO","FI_TX"].includes(obj["M"]);    

     VeryfiUser(obj["X"],obj['PW'],obj['O'],rawUSeVeryfi,function(verifide,info){   
          if(verifide){
               if(obj["M"]=="FI_HO"){               
                    FindHottelse(obj["L"],obj["R"],obj["T"],obj["C"],obj["X"]);                    
               }else if(obj["M"]=="HT_REQ_SENT"){
                    AddNewRoomReq(obj["X"],obj["CC"],obj["CD"],obj["H"],obj["R"],info["N"],info["P"],info["G"])
               }else if(obj["M"]=="FI_TX"){               
                    FindTaxises(obj["L"],obj["R"],obj["T"],obj["X"],obj["DT"],info);                                       
               }else if(obj["M"]=="NE_TX_REQ"){ 
                    DirectChoosedDriver(obj["X"],obj["VID"])
               }else if(obj["M"]=="DEL_TX_REQ"){               
                    ReqestDeletByPassanger(obj["X"]);                    
               }else if(obj["M"]=="TX_RATI"){                    
                    AddSatisfitoServis(obj["DID"],obj["X"],obj["R"])
               }               
          } 
     })
}


/////////////////////////////////////        Servise Findings         /////////////////////////////////////////////

function FindHottelse(location,radius,Htype,Hclass,sentTo){  
     var list;        
     var rawSerices=FindRawServise(OnlineServises.get("HT"), location[0], location[1], radius);
     list=ServiceFindClass(rawSerices, Htype, Hclass);

     Gosip.Sent(sentTo,list,"SER_HT_RESULT");
     
}

function FindTaxises(location,radius,VehicalType,sentTo,jurnydata,info){              
     if(info.P==null || info.N==null){
          Gosip.Sent(sentTo,"NO_DITAIL","TX_MIS");
          return;
     }

     var curentSate=T_REQS.get(sentTo)||{}     
     if(curentSate["ST"]!="NEW" && curentSate["ST"]!=null){
          Gosip.Sent(sentTo,"ALRDY","TX_MIS");
          return;
     }

     GetCpayCurentBal(sentTo,function(amount){
          if(amount<RefudAmmount){
               Gosip.Sent(sentTo,"NO_BAL","TX_MIS");
               return;
          }
          var DataReqOBJ={
               JT:jurnydata["JT"],
               UX:sentTo,
               PN:info["N"],
               PP:info["P"],
               PL:jurnydata["PL"],
               PD:jurnydata["PD"],
               DP:info["DP"],   
               VT:VehicalType,
               DSM:jurnydata["DSM"], 
               TP:jurnydata["TP"],       
               KM:jurnydata["KM"],       
          }  
          
          

          var rawSerices=FindRawServise(OnlineServises.get("TX"+VehicalType), location[0], location[1], radius);
          const ids = rawSerices.map(item => item.ID); 
          
          if(ids.length<1){
               Gosip.Sent(sentTo,'NOVIHI',"TX_MIS");
          }else{
               Gosip.Sent(sentTo,ids.length,"VEH_FOUN");
               CpayDeTopup(sentTo,RefudAmmount,"TAXI HOLD");
               BrodCastJobReqstToDrivers(ids,DataReqOBJ); 

               DataReqOBJ["ST"]="NEW";              
               T_REQS.add(sentTo,DataReqOBJ);
               

               DataReqOBJ["TIMER"]=setInterval(function(){
                    var Data=T_REQS.get(sentTo);
                    var Second=Data["SEC"]||0;
                    var Intrval=Data["TIMER"]
                    Data["SEC"]=Second+1;
                    T_REQS.add(sentTo,Data);

                    console.log(60-Second);
                   
                    if(Second>=20){                         
                         if(Data["DR"]==null){                              
                              T_REQS.remove(sentTo);
                              Gosip.Sent(sentTo,'NOLIKE',"TX_MIS");
                              CpayTopup(sentTo,RefudAmmount,"REFUND TAXI HOLD"); 
                              clearInterval(Intrval);                             
                         }else if(Data["DSM"]=="A"){
                              var NerestId=findNearestLDR(Data);
                              Data["ST"]="START";
                              Data["DR"]=NerestId;
                              T_REQS.add(sentTo,Data)
                              DriverPassangerBridg(sentTo);
                         }                         
                    }
                    if(Second>=60){
                         clearInterval(Intrval);
                         Data["ST"]="START";
                         T_REQS.add(sentTo,Data)
                         DriverPassangerBridg(sentTo);
                    }
               },1000);
          }
          
          
     })
}

function DirectChoosedDriver(passangerID,DriverID){
     var Data=T_REQS.get(passangerID);
     Data["ST"]="START";     
     Data["DR"]=DriverID;
     T_REQS.add(passangerID,Data)
     DriverPassangerBridg(passangerID);     
}


function DeleteTaxiReqst(passangerID){
     EscrowRefund(passangerID);
     T_REQS.remove(passangerID);    
}




//////////////////////////////          User Reqest Backuping funtion      //////////////////////////////////////

function UserServiseBackup(UID,SerViseID,Data){
     SEND("PUT",Dati_url+`/USER_SERVICE_BACKUP/${UID}/${SerViseID}`,Dati_Secret,Data);
}

function UserServiseUnbackup(UID,SerViseID){
     SEND("DELETE",Dati_url+`/USER_SERVICE_BACKUP/${UID}/${SerViseID}`,Dati_Secret,"");
}