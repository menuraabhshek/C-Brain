function DecordTaxiRequests(obj){     
     if(obj["M"]=="LOC_UPD"){
          var Vehicaltype=obj["V"];  
          OnlineServises.UudateTaxiLocatin("TX"+Vehicaltype,obj["X"],obj["LO"]);
          return;
     }
     var RawPasslist=["REQ_QUOTA","REQ_C_QUOTA","ACCEPED","PICKED"];
     var rawPass=RawPasslist.includes(obj["M"])

     CheckServiceProvider('TX',obj["X"],obj["O"],obj["PW"],function(veryfied,info){
          if(veryfied){
               var Data=obj["DT"];
               
               if(obj["M"]=="TAXI_SET"){
                    AddTaxiDitails(obj["X"],Data);
               }else if(obj["M"]=="VERYFI"){
                    TaxiVeriFiSet(obj["X"],Data,info);
               }else if(obj["M"]=="BANKSET"){
                    HotelBanckSet(obj["X"],Data);
               }else if(obj["M"]=="HOTEL_PROFILE_NEED"){
                    SendProfileData(obj["X"]);
               }else if(obj["M"]=="TAXI_ONLINE_SET"){ 
                    var Vehicaltype=obj["V"];                                      
                    if(obj["ST"]=="ON"){
                         OnlineServises.Add("TX"+Vehicaltype,obj["X"],obj["LO"]); 
                    }else if(obj["ST"]=="OFF"){
                         OnlineServises.Remove("TX"+Vehicaltype,obj["X"]);                         
                    }else if(obj["ST"]=="CHACK"){
                         OnlineServises.SentCurent("TX"+Vehicaltype,obj["X"]);                         
                    }            
               }else if(obj["M"]=="ACCEPED"){
                    DiverLikedPassanger(obj["X"],Data)
               }else if(obj["M"]=="CLOSJB"){
                    CloaseTaxiJob(Data["PID"],obj["X"],Data["RE"])
               }else if(obj["M"]=="PICKED"){
                    T_REQS.add(Data,obj["X"],"PIC");
                    Gosip.Sent(obj["X"],"OK","STATECHANGE");
                    SEND("PUT",Dati_url+"/SERVICES/Taxi/"+obj["X"]+"/REQ/ST",Dati_Secret,"PIC",function(){})                  
               }else if(obj["M"]=="PAIDED"){                    
                    BillPaid(Data.P,Data,function(){
                         CpayTopup(Data.P,RefudAmmount,"REFUND TAXI HOLD");
                         SEND("DELETE",Dati_url+"/SERVICES/Taxi/"+obj["X"]+"/REQ",Dati_Secret,"");
                         T_REQS.remove(Data.P);
                         Gosip.Sent(obj["X"],"OK","END");
                         Gosip.Sent(Data.P,obj["X"],"END"); 
                         UserServiseUnbackup(obj["X"],Data.P)                        
                    });                    
               }else if(obj["M"]=="REQ_QUOTA"){                    
                    AddQuata(obj["X"],Data)                  
               }else if(obj["M"]=="REQ_C_QUOTA"){                    
                    GetQata(obj["X"],function(quta){
                         Gosip.Sent(obj["X"],GetMonthCode()+'_'+quta,"C_QUTA");
                    })                  
               }
          }   
     },rawPass)
    
}









///////////////////////////////////////////////////////   taxi mange funtions   //////////////////////////////////////////////////////////////



function AddTaxiDitails(id,data){
     RECE(Dati_url+`/SERVICES/Taxi/${id}/INFO`,Dati_Secret,function(taxiinfo){
          taxiinfo=taxiinfo||{}
          SEND("PUT",Dati_url+"/SERVICES/Taxi/"+id+"/INFO",Dati_Secret,{...taxiinfo,...data})
     })
     Gosip.Respond(id,"TAXI_UPDATED");
}



function TaxiVeriFiSet(id,data,info){     
     
     if(!("WO" in info) && "AN" in data){   // welcom offered          
          SentServicsWelcomePoints(id,data["AN"],data["AG"]);
          TestingPeriodeRegistorProced(id,"DEVMAS",data["AN"],data["AG"]);
          SEND("PUT",Profi_url+"/Service/"+id+"/info/WO",Profi_Secret,true);
          UptateLocalInfo_CoustomKey(id,"WO",true);
     }  
     if("AG" in data){   // welcom offered 
          SEND("PUT",Profi_url+"/Service/"+id+"/info/AG",Profi_Secret,data["AG"]);
          UptateLocalInfo_CoustomKey(id,"AG",data["AG"]);
     } 
     
     
     SEND("PUT",Profi_url+"/Service/"+id+"/VERIFI",Profi_Secret,data,function(){         
          Gosip.Respond(id,"TAXI_VERIFI_UPDATED");  
     })
}


function BrodCastJobReqstToDrivers(ids,datas){
     ids=ids||[];
     ids.forEach(function(vehicalId){
          Gosip.Sent(vehicalId,datas,"PASSANGER_NEED_YOU");
     });
     console.log(ids);
}



function DiverLikedPassanger(driverId,passangerID){  // after recev job to driver and he accsep it,call this..after call thia passanger sent driver data
     var HireDitails=T_REQS.get(passangerID);    

     
     
     
     if(HireDitails["ST"]!="NEW"){
          Gosip.Sent(driverId,"NOAVI","JOBST");  // tell driver Job not awailble now(Job ended)
          return
     }

     GetQata(driverId,function(quta){
          if(quta<1){
               Gosip.Sent(driverId,"NOQT","JOBST");
          }else{
               GetCpayCurentBal(driverId,function(bal){
                    const CommitonFee=calculateCommission(HireDitails["KM"],Price_Vehicals[HireDitails["VT"]],1).toFixed(0)

                    if(CommitonFee<=bal){
                         if(HireDitails["DR"]==null){
                              HireDitails["DR"]=driverId;
                              T_REQS.add(passangerID,HireDitails)
                         }
                         var LikedDrivers= HireDitails["LDR"]||{};
                    
                         var SentingData=OnlineServises.get("TX"+HireDitails["VT"])||{};
                         SentingData=SentingData[driverId];
                    
                         LikedDrivers[driverId]=SentingData;
                         HireDitails["LDR"]=LikedDrivers
                         T_REQS.add(passangerID,HireDitails);
                    
                         if(HireDitails["DSM"]=="M"){
                              Gosip.Sent(passangerID,[SentingData],"SER_TX_RESULT");
                         }
                         if(HireDitails["DSM"]=="F"){
                              HireDitails["ST"]="START";
                              T_REQS.add(passangerID,HireDitails)
                              DriverPassangerBridg(passangerID);
                         }
                    }else{
                         Gosip.Sent(driverId,"NOBL","JOBST");
                    }
               })
              
          }
     })

}








function DriverPassangerBridg(passanerID){
     var HireDitails=T_REQS.get(passanerID);

     var SelectedDriver=HireDitails["DR"];
     var AllLikeDrivers=Object.keys(HireDitails["LDR"]);
     var PassangerName=HireDitails["PN"]

     console.log("HireDitails>",HireDitails);

     clearInterval(HireDitails["TIMER"]);

     RECE(Dati_url+`/SERVICES/Taxi/${SelectedDriver}/INFO`,Dati_Secret,function(taxiinfo){
          var reqesSaveData={
               SER_TYPE:"TX",
               VC:taxiinfo["VC"],
               VT:taxiinfo["VT"],
               VM:taxiinfo["VM"],
               DP:taxiinfo["DP"]||'',
               VDN:taxiinfo["VDN"]||'',
               VCS:taxiinfo["VCS"],
               VCT:taxiinfo["VCT"],
               NP:taxiinfo["NP"],
               P:taxiinfo["N"],
               TP:HireDitails["TP"],
               ID:SelectedDriver                    
          }
          Gosip.Sent(passanerID,reqesSaveData,"ACCEPHIRE");
          UserServiseBackup(passanerID,SelectedDriver,reqesSaveData) 

          AllLikeDrivers.forEach(function(Driver){   
               if(SelectedDriver==Driver){
                    Gosip.Sent(Driver,"1","YOSLEC"); 
               }else{
                    Gosip.Sent(Driver,"0","YOSLEC"); 
               }  
          })
          
          if(HireDitails["DSM"]!="M"){
               var SentingData=OnlineServises.get("TX"+HireDitails["VT"])||{};
               SentingData=SentingData[SelectedDriver];
               Gosip.Sent(passanerID,[SentingData],"SER_TX_RESULT");
          }

          const excludeKeys = ['DSM', 'LDR','SEC',''];

          const filteredObject = Object.keys(HireDitails)
               .filter(key => !excludeKeys.includes(key)) // Exclude keys from excludeKeys array
               .reduce((obj, key) => {
               obj[key] = HireDitails[key];
               return obj;
          }, {});
          
          const CommitonFee=calculateCommission(HireDitails["KM"],Price_Vehicals[HireDitails["VT"]],1).toFixed(0)


          SEND("PUT",Dati_url+"/SERVICES/Taxi/"+SelectedDriver+"/REQ",Dati_Secret,filteredObject);
          AddJobHistory(SelectedDriver,PassangerName,passanerID,`${PassangerName} requested you`,CommitonFee);  
          SendUserActivitiLog(passanerID,"TX_SER","You hired "+taxiinfo["VDN"]);
          CpayDeTopup(SelectedDriver,CommitonFee,"THANK PAYMENT");
     })
}


function ReqestDeletByPassanger(passangerID){
     var Reqest=T_REQS.get(passangerID);
     if(Reqest["UX"]==null){
          Gosip.Sent(passangerID,"NOREQ","REQDEL");
          return;
     }

     var vehicalID=Reqest["DR"];

     T_REQS.remove(passangerID);
     UserServiseUnbackup(passangerID,vehicalID)
     Gosip.Sent(passangerID,["AF_DEL",vehicalID],"REQDEL");
     SEND("DELETE",Dati_url+"/SERVICES/Taxi/"+vehicalID+"/REQ",Dati_Secret,'',function(){
          Gosip.Sent(vehicalID,"CL","END");
     });
     SendCancelationFee(vehicalID);
}





function CloaseTaxiJob(passangerID,driverID,Reson){
     CpayDeTopup(driverID,TaxiCancelDriverPunish,"PENALTY FEE",function(Retun){
          if(Retun==true){
               T_REQS.remove(passangerID);
               Gosip.Sent(passangerID,driverID,"DRICLOSE");
               Gosip.Sent(driverID,'CLOS',"END");
          
               AddReport(passangerID,driverID,Reson)
          
               var Amount=RefudAmmount+TaxiCancelDriverPunish
               CpayTopup(passangerID,Amount,"PENALTY FEE")
               

               UserServiseUnbackup(passangerID,driverID)
          }else{
               Gosip.Sent(driverID,'',"NOPUBAL");
          }
     });
}








function findNearestLDR(data) {
     const [plLat, plLon] = data.PL; // Extract the PL location
     let nearestID = null;
     let shortestDistance = Infinity;
 
     for (const id in data.LDR) {
         const { LAT, LON } = data.LDR[id]; // Extract LDR coordinates
         const distance = getDistance(plLat, plLon, LAT, LON); // Measure distance
 
         if (distance < shortestDistance) {
             shortestDistance = distance;
             nearestID = id;
         }
     }
 
     return nearestID;
 }





var TaxiRequest=JSON.parse(localStorage.getItem("T_REQS"))||{}
var T_REQS={
     add:function(userid,data){
          TaxiRequest[userid]=data;
          localStorage.setItem("T_REQS",JSON.stringify(TaxiRequest));
     },
     get:function(userid){
          return TaxiRequest[userid]||{};
     },
     remove:function(userid){
          delete TaxiRequest[userid];
          localStorage.setItem("T_REQS",JSON.stringify(TaxiRequest));
     },
}
 










 

 

 

 











