function DecordHotelRequests(obj){ 
     CheckServiceProvider('HT',obj["X"],obj["O"],obj["PW"],function(veryfied,info){
          if(veryfied){
               Data=obj["DT"];

               if(obj["M"]=="HOTEL_SET"){
                    AddHotelDitails(obj["X"],Data);
               }else if(obj["M"]=="HOTEL_VERYFI"){
                    HotelVeriFiSet(obj["X"],Data,info);
               }else if(obj["M"]=="HOTEL_BANKSET"){
                    HotelBanckSet(obj["X"],Data);
               }else if(obj["M"]=="HOTEL_ROOM_SET"){
                    HotelRoomAdded(obj["X"],Data,obj["OID"],obj["NID"]);
               }else if(obj["M"]=="HOTEL_ROOM_STATE"){
                    HotelRoomUpdate(obj["X"],obj["RO"],obj["ST"]);
               }else if(obj["M"]=="HOTEL_ROOM_DELETE"){
                    HotelRoomDelete(obj["X"],obj["RO"]);
               }else if(obj["M"]=="HOTEL_PROFILE_NEED"){
                    SendProfileData(obj["X"]);
               }else if(obj["M"]=="HOTEL_REQ_BILL_UPDATE"){
                    HotelBillUpdate(obj["X"],obj["RID"],obj["BI"],obj["G"]);
               }else if(obj["M"]=="HOTEL_REQ_STATE_UPDATE"){
                    HotelREQStateChange(obj["X"],obj["RID"],obj["ST"]);
               }else if(obj["M"]=="HOTEL_REQEST_DELETE"){
                    HotelRequestDelete(obj["X"],obj["RID"]);
               }else if(obj["M"]=="HOTEL_CHAT_SENT"){
                    HotelMassagePut(obj["X"],obj["RID"],Data);
               }else if(obj["M"]=="HT_END"){
                    EndHotelReqest(obj["X"],obj["RID"],Data);
               }else if(obj["M"]=="HOTEL_ONLINE_SET"){                    
                    if(obj["ST"]=="ON"){
                         OnlineServises.Add("HT",obj["X"]); 
                    }else if(obj["ST"]=="OFF"){
                         OnlineServises.Remove("HT",obj["X"]);                         
                    }else if(obj["ST"]=="CHACK"){
                         OnlineServises.SentCurent("HT",obj["X"]);                         
                    }          
               }
               
          }            
     })
}





///////////////////////////////////////////////////////   Hotel mange funtions   //////////////////////////////////////////////////////////////



function AddHotelDitails(id,data){
     SEND("PUT",Dati_url+"/SERVICES/Hotels/"+id+"/INFO",Dati_Secret,data,function(postdata){         
          Gosip.Respond(id,"HOTEL_UPDATED");
     })
}

function HotelVeriFiSet(id,data,info){
     console.log(info , data);
     if(!("WO" in info) && "HOW" in data){   // welcom offered          
          SentServicsWelcomePoints(id,data["HOW"])
          SEND("PUT",Profi_url+"/Service/"+id+"/info/WO",Profi_Secret,true)
          UptateLocalInfo_CoustomKey(id,"WO",true);
     }  
     if("AG" in data){   // welcom offered 
          SEND("PUT",Profi_url+"/Service/"+id+"/info/AG",Profi_Secret,data["AG"])
          UptateLocalInfo_CoustomKey(id,"AG",data["AG"]);
     } 

     SEND("PUT",Profi_url+"/Service/"+id+"/VERIFI",Profi_Secret,data,function(postdata){         
          Gosip.Respond(id,"HOTEL_VERIFI_UPDATED");     
     })
}


function HotelBanckSet(id,data){
     SEND("PUT",Profi_url+"/Service/"+id+"/BANK",Profi_Secret,data,function(postdata){         
          Gosip.Respond(id,"HOTEL_BANK_UPDATED");        
     })
}

function HotelRoomAdded(id,data,oldRID,NewRID){
     SEND("PUT",Dati_url+"/SERVICES/Hotels/"+id+"/ROOMS/"+NewRID,Dati_Secret,data,function(postdata){         
          if(oldRID!="" && NewRID!=oldRID){
               SEND("DELETE",Dati_url+"/SERVICES/Hotels/"+id+"/ROOMS/"+oldRID,Dati_Secret,"",function(postdata){ 
                    Gosip.Respond(id,"HOTEL_ROOM_ADDED");                        
               })
          }else{
               Gosip.Respond(id,"HOTEL_ROOM_ADDED");
          }        
     })
}

function HotelRoomUpdate(id,Room,state){
     SEND("PUT",Dati_url+"/SERVICES/Hotels/"+id+"/ROOMS/"+Room+"/RS",Dati_Secret,state,function(postdata){         
          Gosip.Respond(id,"HOTEL_ROOM_STATE_CHANGED");       
     })
}

function HotelRoomDelete(id,Room){
     SEND("DELETE",Dati_url+"/SERVICES/Hotels/"+id+"/ROOMS/"+Room,Dati_Secret,'',function(){         
          Gosip.Respond(id,"HOTEL_ROOM_DELETED");       
     })
}

function SendProfileData(id){
     RECE(Profi_url+"/Service/"+id,Profi_Secret,function(data){
          delete data["info"];
          Gosip.Sent(id,data,"HOTEL_PROFILE_INFO");
     });
}

var RoomReqStatus={
     PND: "Confirmation Pending",
     WBF: "Waiting for booking fee",
     COM: "Confirmed",
     PRE: "Preparing",
     RED: "Ready",
     CL: "Cleaning in Progress",
     PAY: "Pending Payment"
}

function HotelREQStateChange(id,RequestId,State){
     SEND("PUT",Dati_url+"/SERVICES/Hotels/"+id+"/REQ/"+RequestId+"/ST",Dati_Secret,State,function(){         
          var idSlipt=RequestId.split("_")

          Gosip.Respond(id,"HOTEL_REQ_STATE_CHANGE");   
          Gosip.Alert(idSlipt[0],"ROOM STATE!",`Your room(${idSlipt[1]}) status has changed to '${RoomReqStatus[State]}'`)       
     })
}

function HotelBillUpdate(id,RequestId,Bill,Geuss){
     SEND("PUT",Dati_url+"/SERVICES/Hotels/"+id+"/REQ/"+RequestId+"/BILL",Dati_Secret,Bill,function(){         
          var idSlipt=RequestId.split("_")
          Gosip.Respond(id,"HOTEL_REQ_BILL_UPDATE");
          Gosip.Alert(idSlipt[0],"ROOM BILL!",`Your hotel room(Room id : ${idSlipt[1]}) bill updated by hotel.`)       
     })
}

function HotelRequestDelete(id,RequestId){
     SEND("DELETE",Dati_url+"/SERVICES/Hotels/"+id+"/REQ/"+RequestId,Dati_Secret,'',function(){         
          Gosip.Respond(id,"HOTEL_REQUEST_DELETED"); 
          var uid=RequestId.split('_')[0];         
          Gosip.Sent(uid,{"RID":RequestId,"HID":id},"HOTEL_REQUEST_DELETED");           
          HotelReqestedIDs.del(RequestId);      

          SendUserActivitiLog(uid,"HT_SER",RequestId+" - Request DELETE")
          SendServiseActivitiLog(id,"DELETE",RequestId+" - Request DELETE")
          UserServiseUnbackup(uid,RequestId);

          var idSlipt=RequestId.split("_")
          Gosip.Alert(idSlipt[0],"ROOM REJECT!",`Hotel staff not accept your room(Room id : ${idSlipt[1]})request. You can call the hotel to confirm the reason. The hotel contact number is provided in the service history.`)
     })
}


function EndHotelReqest(id,RequestId){
     RECE(Dati_url+"/SERVICES/Hotels/"+id+"/REQ/"+RequestId+"/BILL",Dati_Secret,function(BILLArry=[]){ 
          
          var DecordBill=RetunHotelbileString(BILLArry);
          var billText=DecordBill.TX;
          var BilAmount=DecordBill.A

          var Commion=GetHotelCommition(BilAmount);

          if(Commion>0){
               CpayDeTopup(id,Commion,"ROOM COMMISSION",function(Return){
                    if(Return==true){
                         SEND("DELETE",Dati_url+"/SERVICES/Hotels/"+id+"/REQ/"+RequestId,Dati_Secret,'',function(){         
                              Gosip.Respond(id,"HOTEL_REQUEST_DELETED"); 
                              var uid=RequestId.split('_')[0];   
               
                              Gosip.Sent(uid,{"RID":RequestId,"HID":id},"HOTEL_REQUEST_DELETED");           
                              HotelReqestedIDs.del(RequestId);      
               
                              SendUserActivitiLog(uid,"HT_SER",RequestId+" - Request End")
                              SendServiseActivitiLog(id,"DELETE",RequestId+" - Request End")
               
                              var idSlipt=RequestId.split("_")
                              Gosip.Alert(idSlipt[0],"ROOM END!",`Payment for your hotel room(Room id : ${idSlipt[1]}) is successfully settled. Room access has now ended. A receipt has been sent to your mobile. Thank you for choosing our service. Stay with us again,good luck!`)   
                         
                              SendSMS(idSlipt[0],billText);
                             
                              UserServiseUnbackup(uid,RequestId);
                         })
                    }else{
                         Gosip.Error(id,`Your Cpay balance was less than Rs${Commion}(COMMISSION).first of all Please Top Up.`)
                         
                    }
               }); 
          } 






          

     }) 
}

function HotelMassagePut(id,RequestId,data){     
     SEND("PUT",Dati_url+"/SERVICES/Hotels/"+id+"/REQ/"+RequestId+"/CHT/"+data["ID"],Dati_Secret,data,function(){         
          Gosip.Sent(id,{RID:RequestId,CID:data["ID"]},"HOTEL_REQ_MASSAGE_SENT");       
     })
}




function AddNewRoomReq(UID,CC,CD,HID,RID,name,num,gender){

     if(num==null || name==null){
          Gosip.Sent(UID,"NO_DITAIL","HT_MIS");
          return;
     }

     if(HotelReqestedIDs.Chek(UID+'_'+RID)){
          Gosip.Sent(UID,"ALRDY","HT_MIS");
          return;
     }

     console.log("SentHotel");

     var DataObj={
          AC:CC,
          AD:CD,
          H:HID,
          ID:UID+'_'+RID,
          NU:num,
          N:name,
          RD:getCurrentdate(),
          RO:RID,
          ST:'PND', 
          UID:UID
     }

     SEND("PUT",Dati_url+"/SERVICES/Hotels/"+HID+"/REQ/"+UID+'_'+RID,Dati_Secret,DataObj,function(){
          Gosip.Sent(HID,{"ID":UID+'_'+RID},"HOTEL_NEW_REQ_RECEVD"); 
          SendSMS(HID,`A new guest has requested a room from you.`);
          AddJobHistory(HID,name,UID,`${RID} room request`,HotelTankpayment);   
          CpayDeTopup(HID,HotelTankpayment,"THANK PAYMENT");          
          HotelReqestedIDs.add(UID+'_'+RID);    
          Gosip.Alert(HID,"ROOM RESERVD!",`${name} has reserved your room. Please call ${getPronoun(gender,"O")} immediately to discuss the details. If a reservation fee is required, kindly request ${getPronoun(gender,"O")} to make the payment.`,`["Alert.Close()","OpenReqest(${UID+'_'+RID})"]`)


          
          RECE(Dati_url+"/SERVICES/Hotels/"+HID+"/INFO",Dati_Secret,function(HotelInfo){
               var reqesSaveData={
                    SER_TYPE:"HT",
                    HID:HID,
                    RID:RID,
                    REQ_ID:UID+'_'+RID,
                    LAT:HotelInfo["HLLAT"]||'',
                    LON:HotelInfo["HLLON"]||'',
                    NAME:HotelInfo["HN"]||'',               
                    DP:HotelInfo["DP"]||'',
                    HP:HotelInfo["HP"]||'',                         
               }

               Gosip.Sent(UID,reqesSaveData,"HTREQADDED");
               SendUserActivitiLog(UID,"HT_SER",UID+'_'+RID+" request added"); 
               UserServiseBackup(UID,UID+'_'+RID,reqesSaveData)
          }) 
     })
     
}


var HotelReqestedIDs={
     add:function(id){
          var list=localStorage.getItem("HotelReqestedIDs")||'[]';
          list=JSON.parse(list);
          list.push(id);
          localStorage.setItem("HotelReqestedIDs",JSON.stringify(list));
     },
     del:function(id){
          var list=localStorage.getItem("HotelReqestedIDs")||'[]';
          list=JSON.parse(list);
          list.splice(list.indexOf(id), 1);
          
          localStorage.setItem("HotelReqestedIDs",JSON.stringify(list));
     },
     Chek:function(id){
          var list=localStorage.getItem("HotelReqestedIDs")||[];
          return list.includes(id);
     }
}







function RetunHotelbileString(item=[]){
     var SubTotal=0;
     var discounter=0;
     var CashBak=0

     var TempotryDiscountHolder=[];

     var CatagarizedBillTrings={};

     var FullString='';

     if(item==null){item=[]}

     console.log("item",item);

     item.forEach(function(billitem){
          var value=parseFloat(billitem.IV) ;
          var Count=parseFloat(billitem.IC) ;
          var BilItem=billitem.BI;
          
          if(billitem.BT=="PO"){
               SubTotal+=(value*Count);
               CatagarizedBillTrings["PO"] = (CatagarizedBillTrings["PO"] || '') + SingleBileStringRetun(BilItem, `${value*Count}.00`, Count);
          }else if(billitem.BT=="NA"){
               SubTotal-=(value*Count);
               CatagarizedBillTrings["NA"] = (CatagarizedBillTrings["NA"] || '') + SingleBileStringRetun(BilItem, `-${value*Count}.00`, Count);
          }else if(billitem.BT=="CB"){
               CashBak+=value;
               CatagarizedBillTrings["CB"] = (CatagarizedBillTrings["CB"] || '') + SingleBileStringRetun(BilItem, `-${value}.00`);
          }else if(billitem.BT=="DI"){
               discounter+=value;
               TempotryDiscountHolder.push([BilItem,value+"%"]);    
               CatagarizedBillTrings["DI"] = (CatagarizedBillTrings["DI"] || '') + SingleBileStringRetun(BilItem, `-${value}%`);
              
          }
     });    


     FullString=`Room Payment confirmed!\n\n\n${CatagarizedBillTrings["PO"]||""}${CatagarizedBillTrings["NA"]||""}${CatagarizedBillTrings["CB"]||""}${CatagarizedBillTrings["DI"]||""}`
    
     SubTotal=SubTotal-CashBak;
     var disvalue=SubTotal*(discounter/100)
     SubTotal=SubTotal-disvalue;

     FullString+=`\nTotal = Rs ${SubTotal.toFixed(2)}\nThank you for choosing us!`    
     
     return {TX:FullString,A:SubTotal.toFixed(2)};
}

function SingleBileStringRetun(ItemName,value,Coun){
     var CeatingString="";
     CeatingString+=ItemName;

     if(Coun){
          CeatingString+=`(x${Coun})`;
     }
     CeatingString+= " : "+value;     
     return CeatingString+'\n'
}